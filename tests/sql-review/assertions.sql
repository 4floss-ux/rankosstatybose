-- Every assertion runs against an EPHEMERAL, synthetic Postgres service only.
do $t$ begin
  if not public.lt_company_code_valid('123456786')
     or not public.lt_company_code_valid('1234567')
     or public.lt_company_code_valid('123456787')
     or public.lt_company_code_valid('UAB ABC')
     or public.lt_company_code_valid('') then
    raise exception 'Company code checksum/format regression';
  end if;
end $t$;

-- Company signup: mandatory valid code, no self-verification.
insert into public.companies(owner_id,name,company_code,employer_type,is_verified)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','New valid employer','123456786','company',true);
do $t$ begin
 if (select is_verified from public.companies where name='New valid employer') then
   raise exception 'Signup must not self-verify';
 end if;
 if (select count(*) from public.company_registration_claims where company_code='123456786') <> 1 then
   raise exception 'First code not reserved';
 end if;
end $t$;

-- Individual owner may have no legal entity code.
insert into public.companies(owner_id,name,company_code,employer_type)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Individual employer',null,'individual');

do $t$ begin
  begin
    insert into public.companies(owner_id,name,company_code,employer_type)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Bad format','Surname','company');
    raise exception 'INVALID_INSERT_WAS_ACCEPTED';
  exception when check_violation then null; end;
  begin
    insert into public.companies(owner_id,name,company_code,employer_type)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Missing code',null,'company');
    raise exception 'MISSING_CODE_WAS_ACCEPTED';
  exception when check_violation then null; end;
  begin
    insert into public.companies(owner_id,name,company_code,employer_type)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Mismatched type',null,'company');
    raise exception 'TYPE_METADATA_BYPASS_ACCEPTED';
  exception when check_violation then null; end;
  begin
    insert into public.companies(owner_id,name,company_code,employer_type)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Duplicate company','123456786','company');
    raise exception 'DUPLICATE_CODE_ACCEPTED';
  exception when unique_violation then null; end;
end $t$;

-- Auth BEFORE INSERT guard is independent of any frontend checks.
do $t$ begin
  begin
    insert into auth.users(id,raw_user_meta_data)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            '{"role":"employer","employer_type":"company","company_code":"Surname"}');
    raise exception 'INVALID_AUTH_SIGNUP_ACCEPTED';
  exception when check_violation then null; end;
end $t$;

-- Changed code is checked, old legacy data remains editable.
update public.companies set name='Legacy text preserved' where name='Existing legacy company';
do $t$ begin
  if (select company_code from public.companies where name='Legacy text preserved') <> 'Legacy text' then
    raise exception 'Legacy record changed unexpectedly';
  end if;
  begin
    update public.companies set company_code='Surname' where name='New valid employer';
    raise exception 'INVALID_UPDATE_ACCEPTED';
  exception when check_violation then null; end;
  begin
    update public.companies set company_code='123456786' where name='Legacy text preserved';
    raise exception 'DUPLICATE_CODE_UPDATE_ACCEPTED';
  exception when unique_violation then null; end;
end $t$;

update public.companies set company_code='100000080' where name='New valid employer';
do $t$ begin
  if (select count(*) from public.company_registration_claims where company_code='100000080') <> 1
     or (select count(*) from public.company_registration_claims where company_code='123456786') <> 0 then
    raise exception 'Claim was not transferred on company code edit';
  end if;
end $t$;

-- Admin-only action log: changed column names, no sensitive values, atomic.
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
update public.companies set name='Admin edit' where name='New valid employer';
do $t$ begin
  if (select count(*) from public.admin_audit_log where action='company_updated') <> 1 then
    raise exception 'Expected exactly one admin audit event';
  end if;
  if not exists (
    select 1 from public.admin_audit_log a
    where a.action='company_updated'
      and a.admin_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and a.metadata->'changed_fields' ? 'name'
      and a.metadata->>'company_id' =
          (select id::text from public.companies where name='Admin edit')
      and a.metadata::text not like '%Admin edit%'
  ) then raise exception 'Audit metadata has wrong fields or sensitive value'; end if;
end $t$;

update public.companies set name='Admin edit' where name='Admin edit';
do $t$ begin
  if (select count(*) from public.admin_audit_log where action='company_updated') <> 1 then
    raise exception 'No-op update incorrectly audited';
  end if;
end $t$;

select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
update public.companies set name='Employer edit' where name='Admin edit';
do $t$ begin
  if (select count(*) from public.admin_audit_log where action='company_updated') <> 1 then
    raise exception 'Non-admin update incorrectly tagged admin action';
  end if;
end $t$;

-- RPC should be callable only by an admin.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
do $t$ begin
  if jsonb_array_length(public.get_admin_company_change_log()) <> 1 then
    raise exception 'Admin cannot read company audit';
  end if;
end $t$;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
do $t$ begin
  begin
    perform public.get_admin_company_change_log();
    raise exception 'UNAUTHORIZED_READ_ALLOWED';
  exception when insufficient_privilege then null; end;
end $t$;
rollback;

-- An audit write failure must roll back the company update.
create function public.test_reject_audit() returns trigger language plpgsql as $t$
begin
  raise exception 'EXPECTED_AUDIT_FAILURE';
end $t$;
create trigger test_reject_audit before insert on public.admin_audit_log
for each row execute function public.test_reject_audit();
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
do $t$ begin
  begin
    update public.companies set name='Should not persist' where name='Employer edit';
    raise exception 'AUDIT_FAILURE_NOT_RAISED';
  exception when raise_exception then
    if sqlerrm <> 'EXPECTED_AUDIT_FAILURE' then raise; end if;
  end;
  if (select count(*) from public.companies where name='Employer edit') <> 1
     or (select count(*) from public.companies where name='Should not persist') <> 0 then
    raise exception 'Audit failure did not roll back company update';
  end if;
end $t$;
drop trigger test_reject_audit on public.admin_audit_log;
drop function public.test_reject_audit();
select 'ALL SYNTHETIC SQL REVIEW TESTS PASSED' as result;
