-- Redizainas: kvietimo atsakymo terminas kaip prototipe – 12 val. nuo kvietimo, „Nuolatinei komandai“ 24 val.,
-- bet ne vėliau nei darbo pradžia. Tik papildymai.
-- SVARBU: priėmimo patikra (trigeris) sukuriama IŠJUNGTA, o automatinis pasibaigusių kvietimų žymėjimas nesuplanuotas,
-- kad sena (gyva) svetainė nepakeistų elgsenos. Įjungiama paleidžiant naują dizainą – žr. docs/LAUNCH.md.

create or replace function public.job_invitation_deadline(p_invitation_id uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select least(
    i.invited_at + case when exists (
      select 1 from public.worker_favorite_companies f
      join public.company_saved_workers s on s.company_id = f.company_id and s.worker_id = f.worker_id
      where f.worker_id = i.worker_id and f.company_id = j.company_id
    ) then interval '24 hours' else interval '12 hours' end,
    ((j.work_date + j.start_time) at time zone 'Europe/Vilnius')
  )
  from public.job_invitations i join public.jobs j on j.id = i.job_id
  where i.id = p_invitation_id;
$$;
revoke all on function public.job_invitation_deadline(uuid) from public, anon, authenticated;

-- Darbuotojas mato savo laukiančių kvietimų terminus.
create or replace function public.get_my_invitation_deadlines()
returns table (invitation_id uuid, deadline timestamptz, mutual boolean)
language sql stable security definer set search_path = '' as $$
  select i.id, public.job_invitation_deadline(i.id),
    exists (select 1 from public.worker_favorite_companies f
      join public.company_saved_workers s on s.company_id = f.company_id and s.worker_id = f.worker_id
      where f.worker_id = i.worker_id and f.company_id = j.company_id)
  from public.job_invitations i join public.jobs j on j.id = i.job_id
  where i.worker_id = auth.uid() and i.status = 'pending'::public.invitation_status;
$$;
revoke all on function public.get_my_invitation_deadlines() from public, anon;
grant execute on function public.get_my_invitation_deadlines() to authenticated;

-- Priimti po termino negalima (įjungiama paleidimo metu).
create or replace function public.job_invitation_enforce_deadline()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'accepted'::public.invitation_status and old.status = 'pending'::public.invitation_status
     and now() > public.job_invitation_deadline(new.id) then
    raise exception 'Atsakymo laikas baigėsi. Kvietimas nebegalioja.';
  end if;
  return new;
end;
$$;
revoke all on function public.job_invitation_enforce_deadline() from public, anon, authenticated;
drop trigger if exists job_invitations_enforce_deadline on public.job_invitations;
create trigger job_invitations_enforce_deadline before update of status on public.job_invitations
  for each row execute function public.job_invitation_enforce_deadline();
alter table public.job_invitations disable trigger job_invitations_enforce_deadline;

-- Pasibaigusių kvietimų žymėjimas (suplanuojamas paleidimo metu per pg_cron).
create or replace function public.expire_overdue_job_invitations()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  update public.job_invitations i
     set status = 'expired'::public.invitation_status, responded_at = coalesce(i.responded_at, now())
   where i.status = 'pending'::public.invitation_status and now() > public.job_invitation_deadline(i.id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.expire_overdue_job_invitations() from public, anon, authenticated;
