-- Redizainas: komandos „Veiksmų istorija“ (kas sukūrė, atšaukė, perdavė darbą ar pakeitė teises).
-- Tik papildymas: nauja lentelė, AFTER trigeriai (klaidos niekada nestabdo pagrindinio įrašo) ir skaitymo RPC.

create table if not exists public.company_team_activity (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid,
  action text not null check (action in ('job_created','job_cancelled','job_transferred','role_changed')),
  job_id uuid,
  job_title text,
  target_user_id uuid,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists company_team_activity_company_idx on public.company_team_activity (company_id, created_at desc);
alter table public.company_team_activity enable row level security;
-- Tiesioginės prieigos nėra: skaitoma tik per get_company_team_activity.
revoke all on public.company_team_activity from anon, authenticated;

create or replace function public.company_team_activity_jobs_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_op = 'INSERT' then
      insert into public.company_team_activity (company_id, actor_id, action, job_id, job_title)
      values (new.company_id, coalesce(new.created_by, auth.uid()), 'job_created', new.id, new.title);
    elsif tg_op = 'UPDATE' then
      if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
        insert into public.company_team_activity (company_id, actor_id, action, job_id, job_title)
        values (new.company_id, auth.uid(), 'job_cancelled', new.id, new.title);
      end if;
      if new.responsible_user_id is distinct from old.responsible_user_id and new.responsible_user_id is not null then
        insert into public.company_team_activity (company_id, actor_id, action, job_id, job_title, target_user_id)
        values (new.company_id, auth.uid(), 'job_transferred', new.id, new.title, new.responsible_user_id);
      end if;
    end if;
  exception when others then
    null; -- istorija niekada netrukdo kurti ar keisti darbų
  end;
  return null;
end;
$$;

create or replace function public.company_team_activity_members_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  begin
    if new.member_role is distinct from old.member_role then
      insert into public.company_team_activity (company_id, actor_id, action, target_user_id, detail)
      values (new.company_id, auth.uid(), 'role_changed', new.user_id, new.member_role::text);
    end if;
  exception when others then
    null;
  end;
  return null;
end;
$$;

drop trigger if exists zz_company_team_activity_jobs on public.jobs;
create trigger zz_company_team_activity_jobs after insert or update of status, responsible_user_id on public.jobs
  for each row execute function public.company_team_activity_jobs_trg();
drop trigger if exists zz_company_team_activity_members on public.company_members;
create trigger zz_company_team_activity_members after update of member_role on public.company_members
  for each row execute function public.company_team_activity_members_trg();

create or replace function public.get_company_team_activity(p_company_id uuid, p_limit integer default 30)
returns table (id bigint, action text, created_at timestamptz, actor_id uuid, actor_name text, job_id uuid, job_title text, target_user_id uuid, target_name text, detail text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.company_members m where m.company_id = p_company_id and m.user_id = auth.uid() and m.is_active)
     and not exists (select 1 from public.companies c where c.id = p_company_id and c.owner_id = auth.uid())
     and not public.is_admin() then
    raise exception 'Neturite prieigos prie šios įmonės istorijos.';
  end if;
  return query
    select a.id, a.action, a.created_at, a.actor_id,
      nullif(btrim(concat_ws(' ', pa.first_name, pa.last_name)), '') as actor_name,
      a.job_id, a.job_title, a.target_user_id,
      nullif(btrim(concat_ws(' ', pt.first_name, pt.last_name)), '') as target_name,
      a.detail
    from public.company_team_activity a
    left join public.profiles pa on pa.id = a.actor_id
    left join public.profiles pt on pt.id = a.target_user_id
    where a.company_id = p_company_id
    order by a.created_at desc
    limit least(greatest(coalesce(p_limit, 30), 1), 100);
end;
$$;
revoke all on function public.get_company_team_activity(uuid, integer) from public, anon;
grant execute on function public.get_company_team_activity(uuid, integer) to authenticated;
revoke all on function public.company_team_activity_jobs_trg() from public, anon, authenticated;
revoke all on function public.company_team_activity_members_trg() from public, anon, authenticated;
