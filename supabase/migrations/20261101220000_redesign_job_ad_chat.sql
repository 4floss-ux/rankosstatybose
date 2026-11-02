-- Redizainas: skelbimo pokalbis tarp įmonės ir kandidato (prototipe „Rašyti“ / „Rašyti įmonei“).
-- Tik papildymas: naujos lentelės ir RPC. Tiesioginės prieigos prie lentelių nėra – tik per RPC su teisių patikra.

create table if not exists public.job_ad_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_ad_applications(id) on delete cascade,
  sender_id uuid not null,
  sender_side text not null check (sender_side in ('worker','company')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists job_ad_messages_app_idx on public.job_ad_messages (application_id, created_at);
create table if not exists public.job_ad_message_reads (
  application_id uuid not null references public.job_ad_applications(id) on delete cascade,
  side text not null check (side in ('worker','company')),
  read_at timestamptz not null default now(),
  primary key (application_id, side)
);
alter table public.job_ad_messages enable row level security;
alter table public.job_ad_message_reads enable row level security;
revoke all on public.job_ad_messages, public.job_ad_message_reads from anon, authenticated;

-- Kuri pusė yra dabartinis naudotojas (null – jokios prieigos).
create or replace function public.job_ad_chat_side(p_application_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare v_worker uuid; v_company uuid;
begin
  select a.worker_id, ad.company_id into v_worker, v_company
  from public.job_ad_applications a join public.job_ads ad on ad.id = a.ad_id where a.id = p_application_id;
  if v_worker is null then return null; end if;
  if v_worker = auth.uid() then return 'worker'; end if;
  if public.job_ad_can_manage(v_company) then return 'company'; end if;
  return null;
end;
$$;

create or replace function public.job_ad_chat_messages(p_application_id uuid)
returns table (id uuid, sender_side text, body text, created_at timestamptz, is_mine boolean)
language plpgsql security definer set search_path = '' as $$
declare v_side text := public.job_ad_chat_side(p_application_id);
begin
  if v_side is null then raise exception 'Neturite prieigos prie šio pokalbio.'; end if;
  insert into public.job_ad_message_reads (application_id, side, read_at) values (p_application_id, v_side, now())
    on conflict (application_id, side) do update set read_at = excluded.read_at;
  return query select m.id, m.sender_side, m.body, m.created_at, m.sender_side = v_side
    from public.job_ad_messages m where m.application_id = p_application_id order by m.created_at;
end;
$$;

create or replace function public.job_ad_chat_send(p_application_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_side text := public.job_ad_chat_side(p_application_id); v_status text; v_id uuid;
begin
  if v_side is null then raise exception 'Neturite prieigos prie šio pokalbio.'; end if;
  select status into v_status from public.job_ad_applications where id = p_application_id;
  if v_status in ('rejected','withdrawn') then raise exception 'Pokalbis uždarytas.'; end if;
  if char_length(btrim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'Žinutė turi būti nuo 1 iki 2000 simbolių.'; end if;
  insert into public.job_ad_messages (application_id, sender_id, sender_side, body)
    values (p_application_id, auth.uid(), v_side, btrim(p_body)) returning id into v_id;
  insert into public.job_ad_message_reads (application_id, side, read_at) values (p_application_id, v_side, now())
    on conflict (application_id, side) do update set read_at = excluded.read_at;
  return v_id;
end;
$$;

-- Neperskaitytų žinučių skaičius kiekvienai naudotojo matomai kandidatūrai.
create or replace function public.job_ad_chat_unread()
returns table (application_id uuid, unread integer)
language sql stable security definer set search_path = '' as $$
  select m.application_id, count(*)::int
  from public.job_ad_messages m
  join public.job_ad_applications a on a.id = m.application_id
  join public.job_ads ad on ad.id = a.ad_id
  cross join lateral (select case when a.worker_id = auth.uid() then 'worker' when public.job_ad_can_manage(ad.company_id) then 'company' end as side) s
  left join public.job_ad_message_reads r on r.application_id = m.application_id and r.side = s.side
  where s.side is not null and m.sender_side <> s.side and (r.read_at is null or m.created_at > r.read_at)
  group by m.application_id;
$$;

revoke all on function public.job_ad_chat_side(uuid), public.job_ad_chat_messages(uuid), public.job_ad_chat_send(uuid, text), public.job_ad_chat_unread() from public, anon;
grant execute on function public.job_ad_chat_messages(uuid), public.job_ad_chat_send(uuid, text), public.job_ad_chat_unread() to authenticated;
