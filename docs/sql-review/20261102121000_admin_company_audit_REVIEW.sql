-- TAIKYTA produkcinėje Supabase 2026-11-02, migracija 20261102193537 – launch_admin_company_audit_20261102.
-- ISTORINĖ PERŽIŪROS KOPIJA: NEKARTOTI, NES TRIGERIAI/FUNKCIJOS JAU YRA.
-- apribojimus, default ir NULL taisykles) bei esamą get_admin_audit_log grąžą.
-- Esamas admin_update_company neperrašomas, istoriniai įvykiai nekuriami.
begin;
-- Registruojami tik administratoriaus redaguojami profilio laukai. Planų, Stripe ir
-- patikimumo sistemos laukų keitimai (admin_set_company_plan, ginčų sprendimai)
-- čia neregistruojami kaip „company_updated“, kad istorija nebūtų klaidinanti.
create function public.audit_admin_company_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); fields text[];
begin
  if actor is null or public.is_admin() is not true then return new; end if;
  select array_agg(n.key order by n.key) into fields
    from jsonb_each(to_jsonb(new)) n
    where n.key in ('name','company_code','vat_code','city','description','is_verified','employer_type')
      and n.value is distinct from to_jsonb(old) -> n.key;
  if coalesce(array_length(fields, 1), 0) = 0 then return new; end if;
  -- Tik aktorius, tikslinė įmonė, laikas ir pakeistų laukų vardai. Jokių reikšmių,
  -- el. pašto, telefono, aprašymo ar senos/naujos eilutės kopijų.
  insert into public.admin_audit_log(admin_id, action, target_role, metadata, created_at)
    values (actor, 'company_updated', 'employer',
      jsonb_build_object('company_id', new.id, 'changed_fields', fields), now());
  -- Klaida NEGAUDOMA: UPDATE ir audito INSERT yra toje pačioje transakcijoje.
  return new;
end;
$$;
revoke all on function public.audit_admin_company_update() from public, anon, authenticated;
create trigger s24_audit_admin_company_update after update on public.companies
  for each row execute function public.audit_admin_company_update();

-- Papildomas siauras skaitymo RPC nekeičia esamo get_admin_audit_log parašo.
-- Frontend sujungia pagal audit_id ir taip nekuria antros istorijos kopijos.
create function public.get_admin_company_change_log()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.is_admin() is not true then raise exception 'Nėra teisių.' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(x.entry order by x.created_at desc), '[]'::jsonb) into result
  from (
    select a.created_at, jsonb_build_object(
      'audit_id', coalesce(to_jsonb(a) ->> 'id', to_jsonb(a) ->> 'audit_id'),
      'admin_id', a.admin_id, 'action', a.action, 'created_at', a.created_at,
      'metadata', a.metadata
    ) as entry
    from public.admin_audit_log a where a.action = 'company_updated'
    order by a.created_at desc limit 200
  ) x;
  return result;
end;
$$;
revoke all on function public.get_admin_company_change_log() from public, anon;
grant execute on function public.get_admin_company_change_log() to authenticated;
commit;
