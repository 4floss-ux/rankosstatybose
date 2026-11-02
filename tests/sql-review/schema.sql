-- Independent synthetic schema for GitHub Actions only. NEVER connect to production.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (
  id uuid primary key,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create table public.profiles (
  id uuid primary key references auth.users(id),
  role text not null
);
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  company_code text,
  employer_type text not null default 'company',
  is_verified boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_user_id uuid,
  target_email text,
  target_role text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$fn$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$fn$;
grant usage on schema auth, public to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- All identities are invented and exist ONLY in this temporary container.
insert into auth.users(id,raw_user_meta_data) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"role":"admin"}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{"role":"employer","employer_type":"company"}'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','{"role":"employer","employer_type":"individual"}'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','{"role":"employer","employer_type":"company"}');
insert into public.profiles(id,role) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','admin'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','employer'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','employer'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','employer');

-- A pre-existing legacy record is intentionally malformed and must remain intact.
insert into public.companies(owner_id,name,company_code,employer_type)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Existing legacy company','Legacy text','company');
