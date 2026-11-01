-- Darbdavio statistika (prototipo eStats). Tik skaitymas, tik pridedama.
create or replace function public.employer_stats_v1(p_company_id uuid, p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare
  me uuid := auth.uid();
  role text;
  plan text;
  own_only boolean;
  d_from date;
  d_to date := least(coalesce(p_to, (now() at time zone 'Europe/Vilnius')::date), (now() at time zone 'Europe/Vilnius')::date);
  month_start date := date_trunc('month', (now() at time zone 'Europe/Vilnius'))::date;
  result jsonb;
begin
  if me is null or not public.account_can_use_platform(me) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  select case when c.owner_id = me then 'owner' else (
           select cm.member_role::text from public.company_members cm
            where cm.company_id = c.id and cm.user_id = me and cm.is_active) end
    into role from public.companies c where c.id = p_company_id;
  if role is null and not public.is_admin() then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  plan := public.company_effective_plan(p_company_id);
  own_only := role = 'recruiter';
  -- Laikotarpio ribos pagal planą (kaip prototipe): Basic – šis mėnuo; Business – iki 6 mėn.; Pro – bet koks.
  d_from := coalesce(p_from, month_start);
  if plan = 'basic' then d_from := greatest(d_from, month_start);
  elsif plan = 'business' then d_from := greatest(d_from, (month_start - interval '5 months')::date);
  end if;
  if d_from > d_to then d_from := d_to; end if;

  with j as (
    select jb.* from public.jobs jb
    where jb.company_id = p_company_id and jb.work_date between d_from and d_to
      and (not own_only or jb.created_by = me or jb.responsible_user_id = me)
  ),
  b as (
    select bk.*, j.pay_amount, j.pay_unit, j.address_text, j.created_by job_creator, j.work_date,
           a.status att_status, a.final_outcome, a.worked_minutes,
           greatest(0, extract(epoch from (j.end_time - j.start_time))/60
             - coalesce(extract(epoch from (j.break_end_time - j.break_start_time))/60, 0))::int sched_min
    from public.bookings bk join j on j.id = bk.job_id
    left join public.attendance a on a.booking_id = bk.id
  ),
  bc as (
    select b.*, coalesce(b.worked_minutes, b.sched_min) mins,
      case b.pay_unit when 'hour' then coalesce(b.pay_amount,0) * coalesce(b.worked_minutes, b.sched_min) / 60.0 else coalesce(b.pay_amount,0) end spend
    from b where b.status = 'completed'
  ),
  jf as (
    select j.id, j.created_by, j.status, j.workers_needed, j.created_at,
      (select count(*) from public.bookings x where x.job_id = j.id and x.status in ('confirmed','completed')) taken,
      (select max(x.confirmed_at) from public.bookings x where x.job_id = j.id and x.status in ('confirmed','completed')) last_conf,
      exists (select 1 from public.bookings x where x.job_id = j.id and x.status = 'completed') done
    from j
  ),
  inv as (
    select i.status from public.job_invitations i join j on j.id = i.job_id
  ),
  rat as (
    select r.worker_id, r.score from public.worker_ratings r join b on b.id = r.booking_id
  )
  select jsonb_build_object(
    'from', d_from, 'to', d_to, 'plan', plan, 'role', role, 'own_only', own_only,
    'jobs_created', (select count(*) from jf),
    'jobs_filled', (select count(*) from jf where taken >= workers_needed),
    'jobs_completed', (select count(*) from jf where done),
    'jobs_cancelled', (select count(*) from jf where status = 'cancelled'),
    'jobs_short', (select count(*) from jf where status <> 'cancelled' and taken < workers_needed),
    'avg_fill_minutes', (select round(avg(extract(epoch from (last_conf - created_at))/60)) from jf where taken >= workers_needed and last_conf is not null and last_conf > created_at),
    'spend_net', (select round(coalesce(sum(spend),0)::numeric, 2) from bc),
    'minutes', (select coalesce(sum(mins),0) from bc),
    'completed_bookings', (select count(*) from bc),
    'invites', jsonb_build_object(
      'sent', (select count(*) from inv),
      'accepted', (select count(*) from inv where status = 'accepted'),
      'declined', (select count(*) from inv where status = 'declined'),
      'no_answer', (select count(*) from inv where status in ('pending','expired'))),
    'arrival', jsonb_build_object(
      'present', (select count(*) from b where att_status = 'present'),
      'late', (select count(*) from b where att_status = 'late'),
      'no_show', (select count(*) from b where att_status = 'no_show' or status = 'no_show')),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('m', to_char(m, 'YYYY-MM'),
        'created', (select count(*) from public.jobs x where x.company_id = p_company_id and date_trunc('month', x.work_date) = m
                    and (not own_only or x.created_by = me or x.responsible_user_id = me)),
        'completed', (select count(distinct x.id) from public.jobs x join public.bookings y on y.job_id = x.id and y.status = 'completed'
                      where x.company_id = p_company_id and date_trunc('month', x.work_date) = m
                      and (not own_only or x.created_by = me or x.responsible_user_id = me))) order by m), '[]')
      from generate_series(date_trunc('month', d_to::timestamp) - interval '5 months', date_trunc('month', d_to::timestamp), interval '1 month') m),
    'top_workers', (select coalesce(jsonb_agg(t order by t->>'jobs' desc), '[]') from (
        select jsonb_build_object('worker_id', bc.worker_id, 'name', p.display_name, 'jobs', count(*),
          'rating', (select round(avg(score)::numeric, 1) from rat where rat.worker_id = bc.worker_id),
          'on_time', (select round(100.0 * count(*) filter (where att_status = 'present') / nullif(count(*) filter (where att_status in ('present','late')), 0)) from b where b.worker_id = bc.worker_id),
          'spend', round(sum(bc.spend)::numeric, 2)) t
        from bc join public.profiles p on p.id = bc.worker_id
        group by bc.worker_id, p.display_name order by count(*) desc, sum(bc.spend) desc limit 5) q),
    'top_spend', (select coalesce(jsonb_agg(t order by (t->>'spend')::numeric desc), '[]') from (
        select jsonb_build_object('worker_id', bc.worker_id, 'name', p.display_name, 'jobs', count(*),
          'rating', (select round(avg(score)::numeric, 1) from rat where rat.worker_id = bc.worker_id),
          'spend', round(sum(bc.spend)::numeric, 2)) t
        from bc join public.profiles p on p.id = bc.worker_id
        group by bc.worker_id, p.display_name order by sum(bc.spend) desc limit 5) q),
    'members', case when own_only then '[]'::jsonb else (select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', u.uid, 'name', coalesce(pr.display_name, 'Narys'), 'me', u.uid = me,
        'created', (select count(*) from jf where jf.created_by = u.uid),
        'filled', (select count(*) from jf where jf.created_by = u.uid and taken >= workers_needed),
        'completed', (select count(*) from jf where jf.created_by = u.uid and done),
        'cancelled', (select count(*) from jf where jf.created_by = u.uid and status = 'cancelled'),
        'workers', (select count(distinct worker_id) from bc where bc.job_creator = u.uid),
        'spend', (select round(coalesce(sum(spend),0)::numeric, 2) from bc where bc.job_creator = u.uid))), '[]')
      from (select c.owner_id uid from public.companies c where c.id = p_company_id
            union select cm.user_id from public.company_members cm where cm.company_id = p_company_id and cm.is_active) u
      left join public.profiles pr on pr.id = u.uid) end,
    'sites', (select coalesce(jsonb_agg(s order by (s->>'spend')::numeric desc), '[]') from (
        select jsonb_build_object('address', coalesce(nullif(trim(address_text),''), 'Adresas nenurodytas'),
          'jobs', count(distinct job_id), 'minutes', sum(mins), 'spend', round(sum(spend)::numeric, 2)) s
        from bc group by coalesce(nullif(trim(address_text),''), 'Adresas nenurodytas') order by sum(spend) desc limit 10) q),
    'reliability', (select jsonb_build_object('rate', c.reliability_rate, 'cancelled_after_confirm', c.cancelled_confirmed_count,
        'completed_total', (select count(distinct x.id) from public.jobs x join public.bookings y on y.job_id = x.id and y.status = 'completed' where x.company_id = p_company_id),
        'disputes', (select count(*) from public.attendance a join public.bookings y on y.id = a.booking_id join public.jobs x on x.id = y.job_id
                      where x.company_id = p_company_id and a.dispute_status is not null),
        'rating', (select round(avg(score)::numeric, 1) from public.employer_reviews r where r.company_id = p_company_id),
        'reviews', (select coalesce(jsonb_agg(jsonb_build_object('score', r.score, 'comment', r.comment, 'created_at', r.created_at, 'job', x.title) order by r.created_at desc), '[]')
                    from (select * from public.employer_reviews r where r.company_id = p_company_id order by r.created_at desc limit 20) r
                    left join public.jobs x on x.id = r.job_id),
        'events', (select coalesce(jsonb_agg(jsonb_build_object('change', e.reliability_change, 'type', e.penalty_type, 'reason', e.reason, 'created_at', e.created_at, 'job', x.title) order by e.created_at desc), '[]')
                    from (select * from public.employer_penalties e where e.company_id = p_company_id order by e.created_at desc limit 10) e
                    left join public.jobs x on x.id = e.job_id))
      from public.companies c where c.id = p_company_id),
    'ads', (select jsonb_build_object('total', count(*), 'active', count(*) filter (where a.status = 'active' and a.expires_at > now()),
        'views', (select count(*) from public.job_ad_views v join public.job_ads z on z.id = v.ad_id where z.company_id = p_company_id),
        'candidates', (select count(*) from public.job_ad_applications x join public.job_ads z on z.id = x.ad_id where z.company_id = p_company_id and x.status <> 'withdrawn'),
        'new', (select count(*) from public.job_ad_applications x join public.job_ads z on z.id = x.ad_id where z.company_id = p_company_id and x.status = 'sent'),
        'interviews', (select count(*) from public.job_ad_applications x join public.job_ads z on z.id = x.ad_id where z.company_id = p_company_id and x.status = 'interview'))
      from public.job_ads a where a.company_id = p_company_id and a.status <> 'removed')
  ) into result;
  return result;
end $$;
revoke all on function public.employer_stats_v1(uuid, date, date) from public, anon;
grant execute on function public.employer_stats_v1(uuid, date, date) to authenticated;
