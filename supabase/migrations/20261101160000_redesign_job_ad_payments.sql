-- Darbo skelbimų apmokėjimai (Stripe vienkartinis mokėjimas). Tik pridedantis pakeitimas.
alter table public.job_ads add column if not exists pending_session_id text;

create table if not exists public.job_ad_payments (
  stripe_session_id text primary key,
  ad_id uuid not null references public.job_ads(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  amount_cents integer not null,
  currency text not null,
  environment text not null,
  paid_at timestamptz not null default now()
);
alter table public.job_ad_payments enable row level security;

-- Kiekviena Stripe sesija pratęsia skelbimą tik vieną kartą.
create or replace function public.job_ad_activate_paid(p_ad_id uuid, p_session_id text, p_amount_cents integer, p_currency text, p_environment text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.job_ads; inserted int;
begin
  select * into r from public.job_ads where id = p_ad_id for update;
  if r.id is null or r.status = 'removed' then raise exception 'Skelbimas nerastas.'; end if;
  insert into public.job_ad_payments(stripe_session_id, ad_id, company_id, amount_cents, currency, environment)
  values (p_session_id, r.id, r.company_id, p_amount_cents, p_currency, p_environment)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return public.job_ad_row_json(r); end if;
  update public.job_ads set status = 'active', paid_via = 'stripe', stripe_session_id = p_session_id, pending_session_id = null,
    published_at = coalesce(published_at, now()),
    expires_at = greatest(coalesce(expires_at, now()), now()) + interval '30 days', updated_at = now()
  where id = p_ad_id returning * into r;
  return public.job_ad_row_json(r);
end $$;
revoke all on function public.job_ad_activate_paid(uuid, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.job_ad_activate_paid(uuid, text, integer, text, text) to service_role;
-- Senoji 2 argumentų versija nebenaudojama – atimama visa prieiga.
revoke all on function public.job_ad_activate_paid(uuid, text) from public, anon, authenticated, service_role;

-- Įmonei: ar skelbimas laukia apmokėjimo (rodoma sąraše)
create or replace function public.job_ads_company_list(p_company_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.job_ad_can_manage(p_company_id) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(public.job_ad_row_json(a) || jsonb_build_object(
      'candidates', (select count(*) from public.job_ad_applications x where x.ad_id = a.id and x.status <> 'withdrawn'),
      'new_candidates', (select count(*) from public.job_ad_applications x where x.ad_id = a.id and x.status = 'sent'),
      'interviews', (select count(*) from public.job_ad_applications x where x.ad_id = a.id and x.status = 'interview'),
      'views', (select count(*) from public.job_ad_views w where w.ad_id = a.id),
      'saves', (select count(*) from public.job_ad_saves s where s.ad_id = a.id),
      'payment_pending', a.pending_session_id is not null)
      order by a.created_at desc)
    from public.job_ads a where a.company_id = p_company_id and a.status <> 'removed'
  ), '[]'::jsonb);
end $$;
