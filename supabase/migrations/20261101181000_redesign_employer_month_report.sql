-- Mėnesio ataskaita: visi darbuotojai, uždarytos darbo dienos šį mėnesį (sumos į rankas). Tik skaitymas.
create or replace function public.employer_month_report_v1(p_company_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare
  me uuid := auth.uid(); role text;
  m_start date := date_trunc('month', (now() at time zone 'Europe/Vilnius'))::date;
  m_end date := (now() at time zone 'Europe/Vilnius')::date;
begin
  if me is null or not public.account_can_use_platform(me) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  select case when c.owner_id = me then 'owner' else (select cm.member_role::text from public.company_members cm where cm.company_id = c.id and cm.user_id = me and cm.is_active) end
    into role from public.companies c where c.id = p_company_id;
  if role is null then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if public.company_effective_plan(p_company_id) = 'basic' then raise exception 'Ataskaita prieinama Business plane.'; end if;
  return coalesce((select jsonb_agg(r order by (r->>'spend')::numeric desc) from (
    select jsonb_build_object('worker_id', bk.worker_id, 'name', p.display_name, 'days', count(*),
      'minutes', sum(coalesce(a.worked_minutes, greatest(0, extract(epoch from (j.end_time - j.start_time))/60 - coalesce(extract(epoch from (j.break_end_time - j.break_start_time))/60, 0))::int)),
      'spend', round(sum(case j.pay_unit when 'hour' then coalesce(j.pay_amount,0) * coalesce(a.worked_minutes, greatest(0, extract(epoch from (j.end_time - j.start_time))/60 - coalesce(extract(epoch from (j.break_end_time - j.break_start_time))/60, 0))) / 60.0 else coalesce(j.pay_amount,0) end)::numeric, 2)) r
    from public.bookings bk join public.jobs j on j.id = bk.job_id
    left join public.attendance a on a.booking_id = bk.id
    join public.profiles p on p.id = bk.worker_id
    where j.company_id = p_company_id and bk.status = 'completed' and j.work_date between m_start and m_end
      and (role <> 'recruiter' or j.created_by = me or j.responsible_user_id = me)
    group by bk.worker_id, p.display_name) q), '[]'::jsonb);
end $$;
revoke all on function public.employer_month_report_v1(uuid) from public, anon;
grant execute on function public.employer_month_report_v1(uuid) to authenticated;
