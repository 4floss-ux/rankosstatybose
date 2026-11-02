-- PARUOŠTA PERŽIŪRAI. NETAIKYTA. Prieš taikant būtina patikrinti esamus Auth
-- kūrimo trigerius, companies schemą ir istorinių kodų taisykles. Jokio backfill.
begin;

create function public.lt_company_code_valid(p_code text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare c text := btrim(coalesce(p_code, '')); total integer := 0; check_digit integer; i integer;
begin
  if c !~ '^([1-9][0-9]{6}|[1-9][0-9]{8})$' then return false; end if;
  -- 7 skaitmenų istorinis formatas: jo egzistavimas tikrinamas registre.
  if length(c) = 7 then return true; end if;
  for i in 1..8 loop total := total + substring(c, i, 1)::integer * i; end loop;
  check_digit := total % 11;
  if check_digit = 10 then
    total := 0;
    for i in 1..8 loop total := total + substring(c, i, 1)::integer * (((i + 1) % 9) + 1); end loop;
    check_digit := total % 11;
    if check_digit = 10 then check_digit := 0; end if;
  end if;
  return check_digit = substring(c, 9, 1)::integer;
end;
$$;
revoke all on function public.lt_company_code_valid(text) from public, anon, authenticated;

-- Tik naujų registracijų rezervacijos. Esami įrašai nekeičiami, esami
-- pasikartojantys kodai nevalomi ir nesukelia unique-index migracijos nesėkmės.
create table public.company_registration_claims (
  company_code text primary key,
  company_id uuid not null unique references public.companies(id) on delete cascade deferrable initially deferred
);
alter table public.company_registration_claims enable row level security;
revoke all on public.company_registration_claims from public, anon, authenticated;

create function public.guard_new_company_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c text := btrim(coalesce(new.company_code, '')); employer_type text;
begin
  select u.raw_user_meta_data ->> 'employer_type' into employer_type
    from auth.users u where u.id = new.owner_id;
  -- Neleidžiame klientui per naują registraciją patvirtinti įmonės.
  new.is_verified := false;
  if employer_type = 'individual' and c = '' then
    new.company_code := null;
    return new;
  end if;
  if not public.lt_company_code_valid(c) then
    raise exception 'Neteisingas juridinio asmens kodas. Reikia 9 skaitmenų kodo su teisingu kontroliniu skaitmeniu arba 7 skaitmenų istorinio kodo.' using errcode = '23514';
  end if;
  if exists (select 1 from public.companies x where btrim(x.company_code) = c) then
    raise exception 'Įmonė su šiuo kodu jau registruota. Kreipkitės į administratorių.' using errcode = '23505';
  end if;
  -- PK saugo ir nuo dviejų vienalaikių registracijų su tuo pačiu kodu.
  begin
    insert into public.company_registration_claims(company_code, company_id) values (c, new.id);
  exception when unique_violation then
    raise exception 'Įmonė su šiuo kodu jau registruota. Kreipkitės į administratorių.' using errcode = '23505';
  end;
  new.company_code := c;
  return new;
end;
$$;
revoke all on function public.guard_new_company_registration() from public, anon, authenticated;
create trigger s24_guard_new_company_registration before insert on public.companies
  for each row execute function public.guard_new_company_registration();

-- Auth metaduomenų vartai stabdo netaisyklingą juridinio asmens signup dar prieš
-- esamus profilio/įmonės kūrimo trigerius. Komandos kvietimai ir privatūs asmenys
-- lieka esamame kelyje; faktinis companies INSERT vis tiek saugomas aukščiau.
create function public.guard_company_signup_metadata()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_user_meta_data ->> 'role' = 'employer'
     and new.raw_user_meta_data ->> 'employer_type' = 'company'
     and not public.lt_company_code_valid(new.raw_user_meta_data ->> 'company_code') then
    raise exception 'Neteisingas juridinio asmens kodas.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_company_signup_metadata() from public, anon, authenticated;
create trigger s24_guard_company_signup_metadata before insert on auth.users
  for each row execute function public.guard_company_signup_metadata();
commit;
