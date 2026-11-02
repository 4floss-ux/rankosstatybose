-- Darbuotojo profilio langas darbdaviui (prototipo „workerProfile“): užbaigtų darbų skaičius ir aktyvumas.
-- Tik skaitymas, tik pridedama. Prieinama darbdaviams ir administratoriams.
create or replace function public.worker_profile_card_v1(p_worker_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare me uuid := auth.uid(); result jsonb;
begin
  if me is null or not (public.is_admin() or exists (select 1 from public.profiles p where p.id = me and p.role = 'employer'::public.profile_role and p.is_active)) then
    raise exception 'Nėra teisių.' using errcode = '42501';
  end if;
  select jsonb_build_object('completed_jobs', coalesce(w.completed_jobs, 0), 'last_active_at', w.last_active_at)
    into result from public.worker_profiles w where w.user_id = p_worker_id;
  return coalesce(result, jsonb_build_object('completed_jobs', 0, 'last_active_at', null));
end $$;
revoke all on function public.worker_profile_card_v1(uuid) from public, anon;
grant execute on function public.worker_profile_card_v1(uuid) to authenticated;

-- Papildyta: aprašymas ir B kategorija (kad langas būtų pilnas atidarius iš bet kurio sąrašo).
create or replace function public.worker_profile_card_v1(p_worker_id uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare me uuid := auth.uid(); result jsonb;
begin
  if me is null or not (public.is_admin() or exists (select 1 from public.profiles p where p.id = me and p.role = 'employer'::public.profile_role and p.is_active)) then
    raise exception 'Nėra teisių.' using errcode = '42501';
  end if;
  select jsonb_build_object('completed_jobs', coalesce(w.completed_jobs, 0), 'last_active_at', w.last_active_at,
                            'short_bio', w.short_bio, 'has_driving_license_b', w.has_driving_license_b)
    into result from public.worker_profiles w where w.user_id = p_worker_id;
  return coalesce(result, jsonb_build_object('completed_jobs', 0, 'last_active_at', null));
end $$;
revoke all on function public.worker_profile_card_v1(uuid) from public, anon;
grant execute on function public.worker_profile_card_v1(uuid) to authenticated;
