-- Redizainas: įmonės objektai (išsaugoti adresai) ir darbo šablonai – Business ir Business Pro planuose.
-- Tik papildymas: naujos lentelės ir RPC. Tiesioginės prieigos prie lentelių nėra.

create table if not exists public.company_sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  city text not null default '' check (char_length(city) <= 80),
  address text not null check (char_length(btrim(address)) between 1 and 200),
  transport_mode text not null default 'self' check (transport_mode in ('self','employer_pickup')),
  note text not null default '' check (char_length(note) <= 300),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists company_sites_company_idx on public.company_sites (company_id, created_at);
create table if not exists public.company_job_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists company_job_templates_company_idx on public.company_job_templates (company_id, created_at);
alter table public.company_sites enable row level security;
alter table public.company_job_templates enable row level security;
revoke all on public.company_sites, public.company_job_templates from anon, authenticated;

-- Narys su Business arba Business Pro planu. p_owner_only – tik savininkas (objektų keitimui).
create or replace function public.company_business_access(p_company_id uuid, p_owner_only boolean default false)
returns void language plpgsql stable security definer set search_path = '' as $$
declare v_role public.company_member_role;
begin
  if auth.uid() is null or not public.account_can_use_platform(auth.uid()) then raise exception 'Pirmiausia prisijunkite.'; end if;
  v_role := public.company_member_role_for(p_company_id, auth.uid());
  if v_role is null then raise exception 'Neturite prieigos prie šios įmonės.'; end if;
  if p_owner_only and v_role <> 'owner'::public.company_member_role then raise exception 'Keisti gali tik įmonės savininkas.'; end if;
  if public.company_effective_plan(p_company_id) not in ('business','business_pro') then raise exception 'Prieinama Business plane.'; end if;
end;
$$;
revoke all on function public.company_business_access(uuid, boolean) from public, anon, authenticated;

create or replace function public.get_company_sites(p_company_id uuid)
returns setof public.company_sites language plpgsql security definer set search_path = '' as $$
begin
  perform public.company_business_access(p_company_id, false);
  return query select * from public.company_sites where company_id = p_company_id order by created_at;
end;
$$;

create or replace function public.save_company_site(p_company_id uuid, p_name text, p_city text, p_address text, p_transport_mode text, p_note text, p_latitude double precision default null, p_longitude double precision default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.company_business_access(p_company_id, true);
  if (select count(*) from public.company_sites where company_id = p_company_id) >= 50 then raise exception 'Daugiausia 50 objektų.'; end if;
  insert into public.company_sites (company_id, name, city, address, transport_mode, note, latitude, longitude, created_by)
  values (p_company_id, btrim(p_name), btrim(coalesce(p_city,'')), btrim(p_address),
          case when p_transport_mode = 'employer_pickup' then 'employer_pickup' else 'self' end, btrim(coalesce(p_note,'')), p_latitude, p_longitude, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.delete_company_site(p_site_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid;
begin
  select company_id into v_company from public.company_sites where id = p_site_id;
  if v_company is null then raise exception 'Objektas nerastas.'; end if;
  perform public.company_business_access(v_company, true);
  delete from public.company_sites where id = p_site_id;
end;
$$;

create or replace function public.get_company_job_templates(p_company_id uuid)
returns setof public.company_job_templates language plpgsql security definer set search_path = '' as $$
begin
  perform public.company_business_access(p_company_id, false);
  return query select * from public.company_job_templates where company_id = p_company_id order by created_at;
end;
$$;

create or replace function public.save_company_job_template(p_company_id uuid, p_name text, p_data jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.company_business_access(p_company_id, false);
  if (select count(*) from public.company_job_templates where company_id = p_company_id) >= 100 then raise exception 'Daugiausia 100 šablonų.'; end if;
  insert into public.company_job_templates (company_id, name, data, created_by)
  values (p_company_id, btrim(p_name), coalesce(p_data, '{}'::jsonb), auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.rename_company_job_template(p_template_id uuid, p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid;
begin
  select company_id into v_company from public.company_job_templates where id = p_template_id;
  if v_company is null then raise exception 'Šablonas nerastas.'; end if;
  perform public.company_business_access(v_company, false);
  update public.company_job_templates set name = btrim(p_name), updated_at = now() where id = p_template_id;
end;
$$;

create or replace function public.delete_company_job_template(p_template_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid;
begin
  select company_id into v_company from public.company_job_templates where id = p_template_id;
  if v_company is null then raise exception 'Šablonas nerastas.'; end if;
  perform public.company_business_access(v_company, false);
  delete from public.company_job_templates where id = p_template_id;
end;
$$;

revoke all on function public.get_company_sites(uuid), public.save_company_site(uuid, text, text, text, text, text, double precision, double precision), public.delete_company_site(uuid),
  public.get_company_job_templates(uuid), public.save_company_job_template(uuid, text, jsonb), public.rename_company_job_template(uuid, text), public.delete_company_job_template(uuid) from public, anon;
grant execute on function public.get_company_sites(uuid), public.save_company_site(uuid, text, text, text, text, text, double precision, double precision), public.delete_company_site(uuid),
  public.get_company_job_templates(uuid), public.save_company_job_template(uuid, text, jsonb), public.rename_company_job_template(uuid, text), public.delete_company_job_template(uuid) to authenticated;
