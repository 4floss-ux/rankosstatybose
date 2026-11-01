-- Taikyta per Supabase MCP 2026-11-01. Darbuotojo mėgstamos įmonės (tik pridedama).
create table if not exists public.worker_favorite_companies (
  worker_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (worker_id, company_id)
);
alter table public.worker_favorite_companies enable row level security;
-- politikos: select/insert/delete tik savo eilutėms (worker_id = auth.uid())
