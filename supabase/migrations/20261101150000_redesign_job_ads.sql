-- Darbo skelbimai (ilgalaikis darbas): skelbimai, kandidatūros, įsiminti, kvietimai kandidatuoti.
-- Tik pridedantis pakeitimas. Visa prieiga – per SECURITY DEFINER RPC su patikrinimais.

create table if not exists public.job_ads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  city text not null check (char_length(city) between 2 and 80),
  address text check (char_length(address) <= 200),
  contract_type text check (char_length(contract_type) <= 80),
  schedule text check (char_length(schedule) <= 120),
  start_text text check (char_length(start_text) <= 80),
  salary_min numeric(10,2) not null check (salary_min > 0 and salary_min < 100000),
  salary_max numeric(10,2) check (salary_max is null or (salary_max >= salary_min and salary_max < 100000)),
  salary_gross boolean not null default false,
  description text not null check (char_length(description) between 10 and 5000),
  requirements text[] not null default '{}',
  offers text[] not null default '{}',
  status text not null default 'pending_payment' check (status in ('pending_payment','active','closed','removed')),
  paid_via text check (paid_via in ('plan','stripe','admin')),
  stripe_session_id text,
  published_at timestamptz,
  expires_at timestamptz,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_ads_company_idx on public.job_ads(company_id);
create index if not exists job_ads_active_idx on public.job_ads(status, expires_at);

create table if not exists public.job_ad_applications (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.job_ads(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  message text check (char_length(message) <= 1000),
  status text not null default 'sent' check (status in ('sent','viewed','interview','rejected','withdrawn')),
  cv_requested_at timestamptz,
  cv_path text,
  cv_name text check (char_length(cv_name) <= 160),
  cv_sent_at timestamptz,
  interview_at timestamptz,
  interview_how text check (interview_how in ('live','phone')),
  interview_address text check (char_length(interview_address) <= 200),
  interview_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ad_id, worker_id)
);
create index if not exists job_ad_applications_worker_idx on public.job_ad_applications(worker_id);

create table if not exists public.job_ad_saves (
  ad_id uuid not null references public.job_ads(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ad_id, worker_id)
);
create table if not exists public.job_ad_nudges (
  ad_id uuid not null references public.job_ads(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (ad_id, worker_id)
);
create table if not exists public.job_ad_views (
  ad_id uuid not null references public.job_ads(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ad_id, worker_id)
);

alter table public.job_ads enable row level security;
alter table public.job_ad_applications enable row level security;
alter table public.job_ad_saves enable row level security;
alter table public.job_ad_nudges enable row level security;
alter table public.job_ad_views enable row level security;
-- Be tiesioginių politikų: skaitymas ir rašymas tik per žemiau esančias funkcijas.

-- ---------- Pagalbinės ----------
create or replace function public.job_ad_is_live(a public.job_ads) returns boolean
language sql stable set search_path to '' as $$
  select a.status = 'active' and a.expires_at > now();
$$;

create or replace function public.job_ad_can_manage(p_company_id uuid) returns boolean
language sql stable security definer set search_path to '' as $$
  select public.account_can_use_platform(auth.uid()) and exists (
    select 1 from public.companies c where c.id = p_company_id and c.owner_id = auth.uid()
  ) or (public.is_company_member(p_company_id) and exists (
    select 1 from public.company_members cm where cm.company_id = p_company_id and cm.user_id = auth.uid()
      and cm.is_active and cm.member_role in ('owner','manager')
  ));
$$;

create or replace function public.job_ad_require_worker() returns uuid
language plpgsql stable security definer set search_path to '' as $$
declare v uuid := auth.uid();
begin
  if v is null or not public.account_can_use_platform(v)
     or not exists (select 1 from public.profiles p where p.id = v and p.role = 'worker') then
    raise exception 'Ši funkcija skirta darbuotojams.' using errcode = '42501';
  end if;
  return v;
end $$;

create or replace function public.job_ad_row_json(a public.job_ads) returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'id', a.id, 'company_id', a.company_id, 'company_name', c.name, 'company_avatar_path', c.avatar_path,
    'title', a.title, 'city', a.city, 'address', a.address, 'contract_type', a.contract_type,
    'schedule', a.schedule, 'start_text', a.start_text, 'salary_min', a.salary_min, 'salary_max', a.salary_max,
    'salary_gross', a.salary_gross, 'description', a.description, 'requirements', a.requirements, 'offers', a.offers,
    'status', a.status, 'published_at', a.published_at, 'expires_at', a.expires_at, 'live', public.job_ad_is_live(a))
  from public.companies c where c.id = a.company_id;
$$;

-- ---------- Darbuotojas ----------
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
        from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v and x.status <> 'withdrawn'))
      order by a.published_at desc)
    from public.job_ads a
    where public.job_ad_is_live(a)
       or exists (select 1 from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v and x.status <> 'withdrawn' and a.status <> 'removed')
  ), '[]'::jsonb);
end $$;

create or replace function public.job_ad_mark_viewed(p_ad_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  insert into public.job_ad_views(ad_id, worker_id)
  select a.id, v from public.job_ads a where a.id = p_ad_id and public.job_ad_is_live(a)
  on conflict do nothing;
end $$;

create or replace function public.job_ad_set_saved(p_ad_id uuid, p_saved boolean) returns boolean
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  if p_saved then
    if not exists (select 1 from public.job_ads a where a.id = p_ad_id and public.job_ad_is_live(a)) then
      raise exception 'Skelbimas nebegalioja.';
    end if;
    insert into public.job_ad_saves(ad_id, worker_id) values (p_ad_id, v) on conflict do nothing;
  else
    delete from public.job_ad_saves where ad_id = p_ad_id and worker_id = v;
  end if;
  return p_saved;
end $$;

create or replace function public.job_ad_apply(p_ad_id uuid, p_message text default null) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker(); r uuid;
begin
  if not exists (select 1 from public.job_ads a where a.id = p_ad_id and public.job_ad_is_live(a)) then
    raise exception 'Skelbimas nebegalioja.';
  end if;
  insert into public.job_ad_applications(ad_id, worker_id, message)
  values (p_ad_id, v, nullif(left(trim(coalesce(p_message,'')), 1000), ''))
  on conflict (ad_id, worker_id) do update
    set status = 'sent', message = excluded.message, created_at = now(), updated_at = now(),
        cv_requested_at = null, interview_at = null, interview_how = null, interview_address = null, interview_confirmed_at = null
    where public.job_ad_applications.status = 'withdrawn'
  returning id into r;
  if r is null then raise exception 'Jau kandidatavote į šį skelbimą.'; end if;
  return r;
end $$;

create or replace function public.job_ad_withdraw(p_application_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  update public.job_ad_applications set status = 'withdrawn', updated_at = now()
  where id = p_application_id and worker_id = v and status <> 'withdrawn';
  if not found then raise exception 'Kandidatūra nerasta.'; end if;
end $$;

create or replace function public.job_ad_confirm_interview(p_application_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  update public.job_ad_applications set interview_confirmed_at = now(), updated_at = now()
  where id = p_application_id and worker_id = v and status = 'interview' and interview_at is not null;
  if not found then raise exception 'Pokalbis nerastas.'; end if;
end $$;

create or replace function public.job_ad_attach_cv(p_application_id uuid, p_path text, p_name text) returns void
language plpgsql security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  if split_part(coalesce(p_path,''), '/', 1) <> p_application_id::text or p_path like '%..%' then
    raise exception 'Netinkamas failas.';
  end if;
  update public.job_ad_applications
     set cv_path = p_path, cv_name = left(coalesce(p_name,'CV'), 160), cv_sent_at = now(), updated_at = now()
   where id = p_application_id and worker_id = v and status in ('sent','viewed','interview') and cv_requested_at is not null;
  if not found then raise exception 'CV įkelti nepavyko.'; end if;
end $$;

-- ---------- Įmonė ----------
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
      'saves', (select count(*) from public.job_ad_saves s where s.ad_id = a.id))
      order by a.created_at desc)
    from public.job_ads a where a.company_id = p_company_id and a.status <> 'removed'
  ), '[]'::jsonb);
end $$;

create or replace function public.job_ad_company_detail(p_ad_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare a public.job_ads;
begin
  select * into a from public.job_ads where id = p_ad_id;
  if a.id is null or a.status = 'removed' or not public.job_ad_can_manage(a.company_id) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  return public.job_ad_row_json(a) || jsonb_build_object(
    'views', (select count(*) from public.job_ad_views w where w.ad_id = a.id),
    'candidates', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.id, 'worker_id', x.worker_id, 'status', x.status, 'message', x.message, 'created_at', x.created_at,
        'cv_requested_at', x.cv_requested_at, 'cv_sent_at', x.cv_sent_at, 'cv_name', x.cv_name, 'cv_path', x.cv_path,
        'interview_at', x.interview_at, 'interview_how', x.interview_how, 'interview_address', x.interview_address,
        'interview_confirmed_at', x.interview_confirmed_at,
        'name', p.display_name, 'city', p.city, 'avatar_path', wp.avatar_path, 'attendance_rate', wp.attendance_rate,
        'rating_average', wp.rating_average, 'completed_jobs', wp.completed_jobs,
        'documents', (select coalesce(jsonb_agg(d.doc_type), '[]') from public.worker_documents d where d.worker_id = x.worker_id and d.show_to_employers))
        order by x.created_at desc)
      from public.job_ad_applications x
      join public.profiles p on p.id = x.worker_id
      left join public.worker_profiles wp on wp.user_id = x.worker_id
      where x.ad_id = a.id and x.status <> 'withdrawn'), '[]'::jsonb),
    'savers', coalesce((select jsonb_agg(jsonb_build_object(
        'worker_id', s.worker_id, 'name', p.display_name, 'city', p.city, 'avatar_path', wp.avatar_path,
        'attendance_rate', wp.attendance_rate,
        'nudged', exists (select 1 from public.job_ad_nudges n where n.ad_id = a.id and n.worker_id = s.worker_id)))
      from public.job_ad_saves s
      join public.profiles p on p.id = s.worker_id
      left join public.worker_profiles wp on wp.user_id = s.worker_id
      where s.ad_id = a.id and not exists (
        select 1 from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = s.worker_id and x.status <> 'withdrawn')), '[]'::jsonb));
end $$;

create or replace function public.job_ad_upsert(
  p_ad_id uuid, p_company_id uuid, p_title text, p_city text, p_address text, p_contract_type text,
  p_schedule text, p_start_text text, p_salary_min numeric, p_salary_max numeric, p_salary_gross boolean,
  p_description text, p_requirements text[], p_offers text[]) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.job_ads; pro boolean;
  clean_list text[];
begin
  if not public.job_ad_can_manage(p_company_id) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if p_ad_id is null then
    pro := public.company_effective_plan(p_company_id) = 'business_pro';
    insert into public.job_ads(company_id, created_by, title, city, address, contract_type, schedule, start_text,
      salary_min, salary_max, salary_gross, description, requirements, offers, status, paid_via, published_at, expires_at)
    values (p_company_id, auth.uid(), trim(p_title), trim(p_city), nullif(trim(coalesce(p_address,'')),''),
      nullif(trim(coalesce(p_contract_type,'')),''), nullif(trim(coalesce(p_schedule,'')),''), nullif(trim(coalesce(p_start_text,'')),''),
      p_salary_min, p_salary_max, coalesce(p_salary_gross,false), trim(p_description),
      (select coalesce(array_agg(left(trim(x),200)), '{}') from unnest(coalesce(p_requirements,'{}')) x where trim(x) <> ''),
      (select coalesce(array_agg(left(trim(x),200)), '{}') from unnest(coalesce(p_offers,'{}')) x where trim(x) <> ''),
      case when pro then 'active' else 'pending_payment' end,
      case when pro then 'plan' end,
      case when pro then now() end,
      case when pro then now() + interval '30 days' end)
    returning * into r;
  else
    update public.job_ads set title = trim(p_title), city = trim(p_city), address = nullif(trim(coalesce(p_address,'')),''),
      contract_type = nullif(trim(coalesce(p_contract_type,'')),''), schedule = nullif(trim(coalesce(p_schedule,'')),''),
      start_text = nullif(trim(coalesce(p_start_text,'')),''), salary_min = p_salary_min, salary_max = p_salary_max,
      salary_gross = coalesce(p_salary_gross,false), description = trim(p_description),
      requirements = (select coalesce(array_agg(left(trim(x),200)), '{}') from unnest(coalesce(p_requirements,'{}')) x where trim(x) <> ''),
      offers = (select coalesce(array_agg(left(trim(x),200)), '{}') from unnest(coalesce(p_offers,'{}')) x where trim(x) <> ''),
      updated_at = now()
    where id = p_ad_id and company_id = p_company_id and status <> 'removed'
    returning * into r;
    if r.id is null then raise exception 'Skelbimas nerastas.'; end if;
  end if;
  return public.job_ad_row_json(r);
end $$;

-- Pratęsti nemokamai gali tik Business Pro; kitiems – per apmokėjimą.
create or replace function public.job_ad_extend_plan(p_ad_id uuid) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.job_ads;
begin
  select * into r from public.job_ads where id = p_ad_id;
  if r.id is null or r.status = 'removed' or not public.job_ad_can_manage(r.company_id) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if public.company_effective_plan(r.company_id) <> 'business_pro' then raise exception 'Pratęsimas apmokamas.'; end if;
  update public.job_ads set status = 'active', paid_via = coalesce(paid_via,'plan'),
    published_at = coalesce(published_at, now()),
    expires_at = greatest(coalesce(expires_at, now()), now()) + interval '30 days', updated_at = now()
  where id = p_ad_id returning * into r;
  return public.job_ad_row_json(r);
end $$;

create or replace function public.job_ad_close(p_ad_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare c uuid;
begin
  select company_id into c from public.job_ads where id = p_ad_id;
  if c is null or not public.job_ad_can_manage(c) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  update public.job_ads set status = 'closed', updated_at = now() where id = p_ad_id and status in ('active','pending_payment');
end $$;

create or replace function public.job_ad_company_mark_seen(p_ad_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare c uuid;
begin
  select company_id into c from public.job_ads where id = p_ad_id;
  if c is null or not public.job_ad_can_manage(c) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  update public.job_ad_applications set status = 'viewed', updated_at = now() where ad_id = p_ad_id and status = 'sent';
end $$;

create or replace function public.job_ad_candidate_update(
  p_application_id uuid, p_action text, p_interview_at timestamptz default null,
  p_interview_how text default null, p_interview_address text default null) returns void
language plpgsql security definer set search_path to '' as $$
declare c uuid;
begin
  select a.company_id into c from public.job_ad_applications x join public.job_ads a on a.id = x.ad_id
   where x.id = p_application_id and x.status <> 'withdrawn' and a.status <> 'removed';
  if c is null or not public.job_ad_can_manage(c) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if p_action = 'reject' then
    update public.job_ad_applications set status = 'rejected', updated_at = now() where id = p_application_id;
  elsif p_action = 'request_cv' then
    update public.job_ad_applications set cv_requested_at = coalesce(cv_requested_at, now()), updated_at = now()
     where id = p_application_id and status <> 'rejected';
  elsif p_action = 'interview' then
    if p_interview_at is null or p_interview_at < now() - interval '1 hour' or coalesce(p_interview_how,'') not in ('live','phone')
       or (p_interview_how = 'live' and char_length(trim(coalesce(p_interview_address,''))) < 3) then
      raise exception 'Nurodykite pokalbio laiką ir vietą.';
    end if;
    update public.job_ad_applications set status = 'interview', interview_at = p_interview_at, interview_how = p_interview_how,
      interview_address = case when p_interview_how = 'live' then left(trim(p_interview_address),200) end,
      interview_confirmed_at = null, updated_at = now()
     where id = p_application_id and status <> 'rejected';
  else
    raise exception 'Nežinomas veiksmas.';
  end if;
end $$;

create or replace function public.job_ad_nudge(p_ad_id uuid, p_worker_id uuid) returns void
language plpgsql security definer set search_path to '' as $$
declare c uuid;
begin
  select company_id into c from public.job_ads a where a.id = p_ad_id and public.job_ad_is_live(a);
  if c is null or not public.job_ad_can_manage(c) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if not exists (select 1 from public.job_ad_saves s where s.ad_id = p_ad_id and s.worker_id = p_worker_id) then
    raise exception 'Darbuotojas šio skelbimo neįsiminė.';
  end if;
  insert into public.job_ad_nudges(ad_id, worker_id, created_by) values (p_ad_id, p_worker_id, auth.uid()) on conflict do nothing;
end $$;

-- Aktyvavimas po Stripe apmokėjimo: kviečia tik serveris (service_role).
create or replace function public.job_ad_activate_paid(p_ad_id uuid, p_session_id text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.job_ads;
begin
  select * into r from public.job_ads where id = p_ad_id for update;
  if r.id is null or r.status = 'removed' then raise exception 'Skelbimas nerastas.'; end if;
  if r.stripe_session_id is not distinct from p_session_id and r.status = 'active' then return public.job_ad_row_json(r); end if;
  update public.job_ads set status = 'active', paid_via = 'stripe', stripe_session_id = p_session_id,
    published_at = coalesce(published_at, now()),
    expires_at = greatest(coalesce(expires_at, now()), now()) + interval '30 days', updated_at = now()
  where id = p_ad_id returning * into r;
  return public.job_ad_row_json(r);
end $$;

-- ---------- Administratorius ----------
create or replace function public.job_ads_admin_list() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(public.job_ad_row_json(a) || jsonb_build_object(
      'candidates', (select count(*) from public.job_ad_applications x where x.ad_id = a.id and x.status <> 'withdrawn'),
      'views', (select count(*) from public.job_ad_views w where w.ad_id = a.id), 'paid_via', a.paid_via)
    order by a.created_at desc) from public.job_ads a where a.status <> 'removed'), '[]'::jsonb);
end $$;

create or replace function public.job_ad_admin_remove(p_ad_id uuid, p_reason text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  update public.job_ads set status = 'removed', removed_reason = left(coalesce(p_reason,''), 300), updated_at = now() where id = p_ad_id;
end $$;

-- ---------- Teisės ----------
revoke all on function public.job_ad_activate_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.job_ad_activate_paid(uuid, text) to service_role;
revoke all on function public.job_ad_require_worker() from public, anon;
revoke all on function public.job_ad_row_json(public.job_ads) from public, anon, authenticated;
revoke all on function public.job_ad_can_manage(uuid) from anon;
do $$ declare f text; begin
  foreach f in array array['job_ads_worker_list()','job_ad_mark_viewed(uuid)','job_ad_set_saved(uuid,boolean)','job_ad_apply(uuid,text)',
    'job_ad_withdraw(uuid)','job_ad_confirm_interview(uuid)','job_ad_attach_cv(uuid,text,text)','job_ads_company_list(uuid)',
    'job_ad_company_detail(uuid)','job_ad_upsert(uuid,uuid,text,text,text,text,text,text,numeric,numeric,boolean,text,text[],text[])',
    'job_ad_extend_plan(uuid)','job_ad_close(uuid)','job_ad_company_mark_seen(uuid)','job_ad_candidate_update(uuid,text,timestamptz,text,text)',
    'job_ad_nudge(uuid,uuid)','job_ads_admin_list()','job_ad_admin_remove(uuid,text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ---------- CV saugykla ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-ad-cv', 'job-ad-cv', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create or replace function public.job_ad_cv_access(p_name text, p_write boolean) returns boolean
language plpgsql stable security definer set search_path to '' as $$
declare app uuid; x public.job_ad_applications; c uuid;
begin
  begin app := split_part(p_name, '/', 1)::uuid; exception when others then return false; end;
  select * into x from public.job_ad_applications where id = app;
  if x.id is null then return false; end if;
  if x.worker_id = auth.uid() then return p_write = false or x.cv_requested_at is not null; end if;
  if p_write then return false; end if;
  if public.is_admin() then return true; end if;
  select company_id into c from public.job_ads where id = x.ad_id;
  return x.cv_path = p_name and public.job_ad_can_manage(c);
end $$;
revoke all on function public.job_ad_cv_access(text, boolean) from public, anon;
grant execute on function public.job_ad_cv_access(text, boolean) to authenticated;

create policy job_ad_cv_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'job-ad-cv' and public.job_ad_cv_access(name, true));
create policy job_ad_cv_read on storage.objects for select to authenticated
  using (bucket_id = 'job-ad-cv' and public.job_ad_cv_access(name, false));

-- Papildomai (redesign_job_ads_grants)
revoke all on function public.job_ad_can_manage(uuid) from public, anon;
grant execute on function public.job_ad_can_manage(uuid) to authenticated;
revoke all on function public.job_ad_is_live(public.job_ads) from public, anon;
grant execute on function public.job_ad_is_live(public.job_ads) to authenticated;
