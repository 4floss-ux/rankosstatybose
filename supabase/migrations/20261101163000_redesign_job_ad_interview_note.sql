-- Pokalbio žinutė ir telefonas patvirtintam telefoniniam pokalbiui. Tik pridedantis pakeitimas.
alter table public.job_ad_applications add column if not exists interview_note text check (char_length(interview_note) <= 500);

drop function if exists public.job_ad_candidate_update(uuid, text, timestamptz, text, text);
create or replace function public.job_ad_candidate_update(
  p_application_id uuid, p_action text, p_interview_at timestamptz default null,
  p_interview_how text default null, p_interview_address text default null, p_interview_note text default null) returns void
language plpgsql security definer set search_path to '' as $$
declare c uuid;
begin
  select a.company_id into c from public.job_ad_applications x join public.job_ads a on a.id = x.ad_id
   where x.id = p_application_id and x.status <> 'withdrawn' and a.status <> 'removed';
  if c is null or not public.job_ad_can_manage(c) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  if p_action = 'reject' then
    update public.job_ad_applications set status = 'rejected', updated_at = now() where id = p_application_id;
  elsif p_action = 'request_cv' then
    update public.job_ad_applications set cv_requested_at = coalesce(cv_requested_at, now()), updated_at = now()
     where id = p_application_id and status <> 'rejected';
  elsif p_action = 'interview' then
    if p_interview_at is null or p_interview_at < now() - interval '1 hour' or coalesce(p_interview_how,'') not in ('live','phone')
       or (p_interview_how = 'live' and char_length(trim(coalesce(p_interview_address,''))) < 3) then
      raise exception 'Nurodykite pokalbio laiką ir vietą.';
    end if;
    update public.job_ad_applications set status = 'interview', interview_at = p_interview_at, interview_how = p_interview_how,
      interview_address = case when p_interview_how = 'live' then left(trim(p_interview_address),200) end,
      interview_note = nullif(left(trim(coalesce(p_interview_note,'')),500),''),
      interview_confirmed_at = null, updated_at = now()
     where id = p_application_id and status <> 'rejected';
  else
    raise exception 'Nežinomas veiksmas.';
  end if;
end $$;
revoke all on function public.job_ad_candidate_update(uuid,text,timestamptz,text,text,text) from public, anon;
grant execute on function public.job_ad_candidate_update(uuid,text,timestamptz,text,text,text) to authenticated;

create or replace function public.job_ad_company_detail(p_ad_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare a public.job_ads;
begin
  select * into a from public.job_ads where id = p_ad_id;
  if a.id is null or a.status = 'removed' or not public.job_ad_can_manage(a.company_id) then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  return public.job_ad_row_json(a) || jsonb_build_object(
    'views', (select count(*) from public.job_ad_views w where w.ad_id = a.id),
    'payment_pending', a.pending_session_id is not null,
    'candidates', coalesce((select jsonb_agg(jsonb_build_object(
        'id', x.id, 'worker_id', x.worker_id, 'status', x.status, 'message', x.message, 'created_at', x.created_at,
        'cv_requested_at', x.cv_requested_at, 'cv_sent_at', x.cv_sent_at, 'cv_name', x.cv_name, 'cv_path', x.cv_path,
        'interview_at', x.interview_at, 'interview_how', x.interview_how, 'interview_address', x.interview_address,
        'interview_note', x.interview_note, 'interview_confirmed_at', x.interview_confirmed_at,
        'phone', case when x.status = 'interview' and x.interview_confirmed_at is not null then up.phone end,
        'name', p.display_name, 'city', p.city, 'avatar_path', wp.avatar_path, 'attendance_rate', wp.attendance_rate,
        'rating_average', wp.rating_average, 'completed_jobs', wp.completed_jobs,
        'documents', (select coalesce(jsonb_agg(d.doc_type), '[]') from public.worker_documents d where d.worker_id = x.worker_id and d.show_to_employers))
        order by x.created_at desc)
      from public.job_ad_applications x
      join public.profiles p on p.id = x.worker_id
      left join public.worker_profiles wp on wp.user_id = x.worker_id
      left join public.user_private up on up.user_id = x.worker_id
      where x.ad_id = a.id and x.status <> 'withdrawn'), '[]'::jsonb),
    'savers', coalesce((select jsonb_agg(jsonb_build_object(
        'worker_id', s.worker_id, 'name', p.display_name, 'city', p.city, 'avatar_path', wp.avatar_path,
        'attendance_rate', wp.attendance_rate,
        'nudged', exists (select 1 from public.job_ad_nudges n where n.ad_id = a.id and n.worker_id = s.worker_id)))
      from public.job_ad_saves s
      join public.profiles p on p.id = s.worker_id
      left join public.worker_profiles wp on wp.user_id = s.worker_id
      where s.ad_id = a.id and not exists (
        select 1 from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = s.worker_id and x.status <> 'withdrawn')), '[]'::jsonb));
end $$;

-- Darbuotojui grąžinama ir pokalbio žinutė
create or replace function public.job_ads_worker_list() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare v uuid := public.job_ad_require_worker();
begin
  return coalesce((
    select jsonb_agg(public.job_ad_row_json(a) || jsonb_build_object(
      'saved', exists (select 1 from public.job_ad_saves s where s.ad_id = a.id and s.worker_id = v),
      'nudged', exists (select 1 from public.job_ad_nudges n where n.ad_id = a.id and n.worker_id = v),
      'application', (select jsonb_build_object('id', x.id, 'status', x.status, 'message', x.message,
          'cv_requested_at', x.cv_requested_at, 'cv_sent_at', x.cv_sent_at, 'cv_name', x.cv_name,
          'interview_at', x.interview_at, 'interview_how', x.interview_how, 'interview_address', x.interview_address,
          'interview_note', x.interview_note, 'interview_confirmed_at', x.interview_confirmed_at, 'created_at', x.created_at)
        from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v and x.status <> 'withdrawn'))
      order by a.published_at desc)
    from public.job_ads a
    where public.job_ad_is_live(a)
       or exists (select 1 from public.job_ad_applications x where x.ad_id = a.id and x.worker_id = v and x.status <> 'withdrawn' and a.status <> 'removed')
  ), '[]'::jsonb);
end $$;
