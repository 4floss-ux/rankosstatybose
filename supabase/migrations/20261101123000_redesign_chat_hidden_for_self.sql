-- Taikyta per Supabase MCP 2026-11-01. Pokalbio slėpimas tik sau (nieko netrina).
create table if not exists public.chat_hidden (
  user_id uuid not null references auth.users(id) on delete cascade,
  conv_key text not null check (char_length(conv_key) between 3 and 120),
  hidden_at timestamptz not null default now(),
  primary key (user_id, conv_key)
);
alter table public.chat_hidden enable row level security;
-- politikos: select/insert/update/delete tik savo eilutėms (user_id = auth.uid())
