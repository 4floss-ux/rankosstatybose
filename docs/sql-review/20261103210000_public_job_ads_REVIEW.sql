-- PROPOSAL ONLY. Review against actual schema/functions before any application.
-- Public RPCs return ONLY intended published advert fields; no candidate, CV,
-- contact, billing, session, owner-user or internal moderation fields.
BEGIN;
CREATE FUNCTION app_private.public_job_ad_visible(a public.job_ads)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT public.job_ad_is_live(a) AND EXISTS (
    SELECT 1 FROM public.companies c WHERE c.id=a.company_id
      AND public.account_can_use_platform(c.owner_id)
  );
$fn$;
CREATE FUNCTION app_private.public_job_ad_json(a public.job_ads)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT jsonb_build_object(
    'id',a.id,'company_id',a.company_id,'company_name',c.name,'company_avatar_path',c.avatar_path,
    'title',a.title,'city',a.city,'address',a.address,'contract_type',a.contract_type,
    'schedule',a.schedule,'start_text',a.start_text,'salary_min',a.salary_min,'salary_max',a.salary_max,
    'salary_gross',a.salary_gross,'description',a.description,'requirements',a.requirements,'offers',a.offers,
    'published_at',a.published_at,'expires_at',a.expires_at,'live',true)
  FROM public.companies c WHERE c.id=a.company_id;
$fn$;
REVOKE ALL ON FUNCTION app_private.public_job_ad_visible(public.job_ads) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION app_private.public_job_ad_json(public.job_ads) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.job_ads_public_list(p_city text DEFAULT NULL,p_limit integer DEFAULT 24,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  WITH candidates AS (
    SELECT a.* FROM public.job_ads a
    WHERE app_private.public_job_ad_visible(a)
      AND (nullif(btrim(p_city),'') IS NULL OR a.city=btrim(p_city))
    ORDER BY a.published_at DESC NULLS LAST,a.id DESC
    LIMIT greatest(1,least(coalesce(p_limit,24),50))+1 OFFSET greatest(0,coalesce(p_offset,0))
  ), page AS (
    SELECT * FROM candidates ORDER BY published_at DESC NULLS LAST,id DESC
    LIMIT greatest(1,least(coalesce(p_limit,24),50))
  )
  SELECT jsonb_build_object('ads',coalesce((SELECT jsonb_agg(app_private.public_job_ad_json(p) ORDER BY p.published_at DESC NULLS LAST,p.id DESC) FROM page p),'[]'::jsonb),
    'has_more',(SELECT count(*) FROM candidates)>greatest(1,least(coalesce(p_limit,24),50)));
$fn$;
CREATE FUNCTION public.job_ad_public_detail(p_ad_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT app_private.public_job_ad_json(a) FROM public.job_ads a
  WHERE a.id=p_ad_id AND app_private.public_job_ad_visible(a);
$fn$;
CREATE FUNCTION public.job_ads_public_cities()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT coalesce(array_agg(c.city ORDER BY c.city),'{}'::text[]) FROM (
    SELECT DISTINCT a.city FROM public.job_ads a
    WHERE app_private.public_job_ad_visible(a) AND nullif(btrim(a.city),'') IS NOT NULL
  ) c;
$fn$;
REVOKE ALL ON FUNCTION public.job_ads_public_list(text,integer,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.job_ad_public_detail(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.job_ads_public_cities() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ads_public_list(text,integer,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ad_public_detail(uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ads_public_cities() TO anon,authenticated;

-- Require an existing immediate unique (ad_id,worker_id) index. Do not silently
-- delete or rewrite historical applications to manufacture this invariant.
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i WHERE i.indrelid='public.job_ad_applications'::regclass
      AND i.indisunique AND i.indisvalid AND i.indimmediate AND i.indpred IS NULL
      AND i.indexprs IS NULL AND i.indnkeyatts=2
      AND (SELECT array_agg(a.attname::text ORDER BY a.attname)
           FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(attnum,n)
           JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum
           WHERE k.n<=i.indnkeyatts)=ARRAY['ad_id','worker_id']::text[]
  ) THEN RAISE EXCEPTION 'Required unique ad/worker index missing: review separately'; END IF;
END;
$check$;

-- One lifetime application row per user/ad, including legacy withdrawn applications.
-- Existing signature and worker authorization retained; ACLs are not broadened.
CREATE OR REPLACE FUNCTION public.job_ad_apply(p_ad_id uuid,p_message text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v uuid:=public.job_ad_require_worker(); r uuid;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.job_ads a WHERE a.id=p_ad_id AND app_private.public_job_ad_visible(a)) THEN
    RAISE EXCEPTION 'Skelbimas nebegalioja.';
  END IF;
  INSERT INTO public.job_ad_applications(ad_id,worker_id,message)
    VALUES(p_ad_id,v,nullif(left(btrim(coalesce(p_message,'')),1000),''))
    ON CONFLICT(ad_id,worker_id) DO NOTHING RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Jau kandidatavote į šį skelbimą.'; END IF;
  RETURN r;
END;
$fn$;
-- Existing job_ads_worker_list is appended below with one narrow change:
-- include the caller's withdrawn application in its own public/live ad row,
-- so historical withdrawn applications cannot be submitted again. No new withdrawal is allowed.

create or replace function public.job_ads_worker_list() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  return coalesce((
    select jsonb_agg(public.job_ad_row_json(a) || jsonb_build_object(
      'saved', exists (select 1 from public.job_ad_saves s where s.ad_id = a.id and s.worker_id = v),
      'nudged', exists (select 1 from public.job_ad_nudges n where n.ad_id = a.id and n.worker_id = v),
      'application', (select jsonb_build_object('id', x.id, 'status', x.status, 'message', x.message,
          'cv_requested_at', x.cv_requested_at, 'cv_sent_at', x.cv_sent_at, 'cv_name', x.cv_name,
          'interview_at', x.interview_at, 'interview_how', x.interview_how, 'interview_address', x.interview_address,
          'interview_confirmed_at', x.interview_confirmed_at, 'created_at', x.created_at)
        from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v))
      order by a.published_at desc)
    from public.job_ads a
    where public.job_ad_is_live(a)
       or exists (select 1 from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v and x.status <> 'withdrawn' and a.status <> 'removed')
  ), '[]'::jsonb);
end $$;
-- Candidate withdrawal is intentionally disabled. Preserve the RPC signature
-- and existing ACLs so stale clients receive an explicit error without mutations.
CREATE OR REPLACE FUNCTION public.job_ad_withdraw(p_application_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
  PERFORM public.job_ad_require_worker();
  RAISE EXCEPTION 'Pateiktos kandidatūros atšaukti negalima.' USING ERRCODE = '42501';
END;
$fn$;
COMMIT;
