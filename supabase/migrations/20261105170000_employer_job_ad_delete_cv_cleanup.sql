-- Matches the deployed Supabase schema change: employer delete + post-commit CV cleanup.
-- Removal is soft to preserve Stripe payment and billing foreign keys.
create or replace function public.job_ad_employer_delete(p_ad_id uuid)
returns void language plpgsql security definer set search_path = ''
as $fn$
declare v_company uuid; v_status text;
begin
  select company_id, status into v_company, v_status
    from public.job_ads where id = p_ad_id for update;
  if v_company is null or v_status = 'removed' then
    raise exception 'Skelbimas nerastas.' using errcode = 'P0002';
  end if;
  if not public.job_ad_can_manage(v_company) then
    raise exception 'Neturite teisių ištrinti šio skelbimo.' using errcode = '42501';
  end if;
  update public.job_ads
    set status = 'removed', removed_reason = 'Ištrynė darbdavys', updated_at = now()
    where id = p_ad_id;
end
$fn$;
revoke all on function public.job_ad_employer_delete(uuid) from public, anon;
grant execute on function public.job_ad_employer_delete(uuid) to authenticated;

-- PG_NET sends only after commit; request has HMAC scoped to the removed ad.
create or replace function app_private.job_ad_enqueue_cv_cleanup()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
declare
  v_url text; v_hmac text; v_timestamp text; v_signature text; v_request_id bigint;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets
    where name = 'job_ad_cleanup_url' limit 1;
  select decrypted_secret into v_hmac from vault.decrypted_secrets
    where name = 'job_ad_cleanup_hmac_secret' limit 1;
  if v_url is null or v_url = '' or v_hmac is null or length(v_hmac) < 32 then
    raise exception 'CV ištrynimo paslauga neprieinama.' using errcode = '55000';
  end if;
  v_timestamp := floor(extract(epoch from clock_timestamp()))::bigint::text;
  v_signature := encode(extensions.hmac(
    'statybos24:job-ad-cv-cleanup:v2:' || v_timestamp || ':execute:' || new.id::text,
    v_hmac, 'sha256'
  ), 'hex');
  select net.http_post(
    url := v_url,
    body := jsonb_build_object('mode', 'execute', 'adId', new.id::text),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-job-ad-cleanup-ts', v_timestamp,
      'x-job-ad-cleanup-hmac', v_signature
    ),
    timeout_milliseconds := 10000
  ) into v_request_id;
  if v_request_id is null then
    raise exception 'Nepavyko inicijuoti CV failų valymo.' using errcode = '55000';
  end if;
  return new;
end
$fn$;
revoke all on function app_private.job_ad_enqueue_cv_cleanup() from public, anon, authenticated;
drop trigger if exists job_ad_cv_cleanup_on_remove on public.job_ads;
create trigger job_ad_cv_cleanup_on_remove
after update of status on public.job_ads
for each row when (new.status = 'removed' and old.status is distinct from new.status)
execute function app_private.job_ad_enqueue_cv_cleanup();

-- Do not grant access to CV objects of deleted ads, even on an old browser tab.
create or replace function public.job_ad_cv_access(p_name text, p_write boolean)
returns boolean language plpgsql stable security definer set search_path = ''
as $fn$
declare
  v_app_id uuid; v_app public.job_ad_applications;
  v_company_id uuid; v_ad_status text;
begin
  begin v_app_id := split_part(p_name, '/', 1)::uuid;
  exception when others then return false; end;
  select * into v_app from public.job_ad_applications where id = v_app_id;
  if v_app.id is null then return false; end if;
  select company_id, status into v_company_id, v_ad_status
    from public.job_ads where id = v_app.ad_id;
  if v_company_id is null or v_ad_status = 'removed' then return false; end if;
  if v_app.worker_id = auth.uid() then
    return p_write = false or v_app.cv_requested_at is not null;
  end if;
  if p_write then return false; end if;
  if public.is_admin() then return true; end if;
  return v_app.cv_path = p_name and public.job_ad_can_manage(v_company_id);
end
$fn$;

create or replace function public.job_ad_attach_cv(
  p_application_id uuid, p_path text, p_name text
) returns void language plpgsql security definer set search_path = ''
as $fn$
declare v_worker uuid := public.job_ad_require_worker();
begin
  if split_part(coalesce(p_path,''), '/', 1) <> p_application_id::text
    or p_path like '%..%' then
    raise exception 'Netinkamas failas.';
  end if;
  update public.job_ad_applications as app
    set cv_path = p_path,
        cv_name = left(coalesce(p_name,'CV'),160),
        cv_sent_at = now(), updated_at = now()
    where app.id = p_application_id
      and app.worker_id = v_worker
      and app.status in ('sent','viewed','interview')
      and app.cv_requested_at is not null
      and exists (
        select 1 from public.job_ads a
        where a.id = app.ad_id and a.status <> 'removed'
      );
  if not found then raise exception 'CV įkelti nepavyko.'; end if;
end
$fn$;

-- Recovery for transient failures in pg_net or Storage; not the primary delete path.
select cron.unschedule('statybos24-job-ad-cv-cleanup-dry-run')
where exists(select 1 from cron.job where jobname='statybos24-job-ad-cv-cleanup-dry-run');
select cron.schedule(
  'statybos24-job-ad-cv-cleanup-retry',
  '*/15 * * * *',
  $cron$
  with cfg as (
    select
      (select decrypted_secret from vault.decrypted_secrets where name='job_ad_cleanup_url' limit 1) as endpoint,
      (select decrypted_secret from vault.decrypted_secrets where name='job_ad_cleanup_hmac_secret' limit 1) as signing_key,
      floor(extract(epoch from clock_timestamp()))::bigint::text as ts
  )
  select net.http_post(
    url := endpoint,
    body := '{"mode":"execute","adId":"all"}'::jsonb,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-job-ad-cleanup-ts', ts,
      'x-job-ad-cleanup-hmac',
      encode(extensions.hmac(
        'statybos24:job-ad-cv-cleanup:v2:' || ts || ':execute:all',
        signing_key, 'sha256'
      ), 'hex')
    ),
    timeout_milliseconds := 15000
  )
  from cfg where endpoint is not null and signing_key is not null;
  $cron$
);
