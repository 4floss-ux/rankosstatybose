-- SQL already applied in Supabase as isolated_qa_preview_state.
-- Only synthetic scenario state; never creates real jobs, users, charges, or messages.
create table if not exists public.qa_preview_state (
 id text primary key check (id = 'shared'),
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.qa_preview_state enable row level security;
revoke all on table public.qa_preview_state from public, anon, authenticated;
grant select, insert, update on table public.qa_preview_state to service_role;
