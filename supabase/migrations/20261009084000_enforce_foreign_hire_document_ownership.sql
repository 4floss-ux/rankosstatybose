create or replace function app_private.enforce_foreign_hire_document_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request_id uuid;
  v_path text;
  v_bucket text;
  v_prefix text;
begin
  if tg_table_name = 'foreign_hire_agreements' then
    v_request_id := new.request_id;

    if tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.agreement_path is distinct from old.agreement_path then
      v_path := btrim(coalesce(new.agreement_path, ''));
      v_prefix := v_request_id::text || '/';
      if v_path = '' or left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o
                        where o.bucket_id = 'foreign-hire-contracts' and o.name = v_path) then
        raise exception 'Agreement file must exist in this request folder.';
      end if;
    end if;

    if (tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.signed_path is distinct from old.signed_path) and new.signed_path is not null then
      v_path := btrim(new.signed_path);
      v_prefix := v_request_id::text || '/signed/';
      if left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o
                        where o.bucket_id = 'foreign-hire-contracts' and o.name = v_path) then
        raise exception 'Signed agreement file must exist in this request signed folder.';
      end if;
    end if;

  elsif tg_table_name = 'foreign_hire_candidates' then
    v_request_id := new.request_id;
    v_bucket := 'foreign-hire-candidates';
    v_prefix := v_request_id::text || '/';

    if (tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.cv_path is distinct from old.cv_path) and new.cv_path is not null then
      v_path := btrim(new.cv_path);
      if left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o where o.bucket_id=v_bucket and o.name=v_path) then
        raise exception 'Candidate CV must exist in its request folder.';
      end if;
    end if;
    if (tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.candidate_agreement_path is distinct from old.candidate_agreement_path)
       and new.candidate_agreement_path is not null then
      v_path := btrim(new.candidate_agreement_path);
      if left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o where o.bucket_id=v_bucket and o.name=v_path) then
        raise exception 'Candidate agreement must exist in its request folder.';
      end if;
    end if;
    if (tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.candidate_signed_agreement_path is distinct from old.candidate_signed_agreement_path)
       and new.candidate_signed_agreement_path is not null then
      v_path := btrim(new.candidate_signed_agreement_path);
      if left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o where o.bucket_id=v_bucket and o.name=v_path) then
        raise exception 'Signed candidate agreement must exist in its request folder.';
      end if;
    end if;

  elsif tg_table_name = 'foreign_hire_invoices' then
    v_request_id := new.request_id;
    if tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.storage_path is distinct from old.storage_path then
      v_path := btrim(coalesce(new.storage_path, ''));
      v_prefix := v_request_id::text || '/';
      if v_path = '' or left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o
                        where o.bucket_id = 'foreign-hire-invoices' and o.name = v_path) then
        raise exception 'Invoice file must exist in this request folder.';
      end if;
    end if;

  elsif tg_table_name = 'foreign_hire_employer_briefs' then
    v_request_id := new.request_id;
    if (tg_op = 'INSERT' or new.request_id is distinct from old.request_id or new.employment_contract_path is distinct from old.employment_contract_path)
       and new.employment_contract_path is not null then
      v_path := btrim(new.employment_contract_path);
      v_prefix := v_request_id::text || '/employment-contract/';
      if left(v_path, char_length(v_prefix)) <> v_prefix
         or not exists (select 1 from storage.objects o
                        where o.bucket_id = 'foreign-hire-contracts' and o.name = v_path) then
        raise exception 'Employment contract must exist in this request folder.';
      end if;
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function app_private.enforce_foreign_hire_document_ownership() from public, anon, authenticated, service_role;

drop trigger if exists foreign_hire_agreements_document_ownership on public.foreign_hire_agreements;
create trigger foreign_hire_agreements_document_ownership
before insert or update of request_id, agreement_path, signed_path on public.foreign_hire_agreements
for each row execute function app_private.enforce_foreign_hire_document_ownership();

drop trigger if exists foreign_hire_candidates_document_ownership on public.foreign_hire_candidates;
create trigger foreign_hire_candidates_document_ownership
before insert or update of request_id, cv_path, candidate_agreement_path, candidate_signed_agreement_path on public.foreign_hire_candidates
for each row execute function app_private.enforce_foreign_hire_document_ownership();

drop trigger if exists foreign_hire_invoices_document_ownership on public.foreign_hire_invoices;
create trigger foreign_hire_invoices_document_ownership
before insert or update of request_id, storage_path on public.foreign_hire_invoices
for each row execute function app_private.enforce_foreign_hire_document_ownership();

drop trigger if exists foreign_hire_briefs_document_ownership on public.foreign_hire_employer_briefs;
create trigger foreign_hire_briefs_document_ownership
before insert or update of request_id, employment_contract_path on public.foreign_hire_employer_briefs
for each row execute function app_private.enforce_foreign_hire_document_ownership();