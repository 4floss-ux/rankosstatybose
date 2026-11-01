-- Darbuotojo pažymėjimai ir dokumentai (redizainas). Tik pridedantis pakeitimas.
create table if not exists public.worker_documents (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doc_type text not null check (char_length(doc_type) between 1 and 80),
  valid_until date,
  file_path text not null check (char_length(file_path) <= 300),
  file_name text check (char_length(file_name) <= 160),
  show_to_employers boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists worker_documents_worker_idx on public.worker_documents(worker_id);
alter table public.worker_documents enable row level security;

create policy wdoc_owner_select on public.worker_documents for select to authenticated
  using (worker_id = (select auth.uid()));
create policy wdoc_owner_insert on public.worker_documents for insert to authenticated
  with check (worker_id = (select auth.uid()) and split_part(file_path, '/', 1) = (select auth.uid())::text);
create policy wdoc_owner_update on public.worker_documents for update to authenticated
  using (worker_id = (select auth.uid())) with check (worker_id = (select auth.uid()));
create policy wdoc_owner_delete on public.worker_documents for delete to authenticated
  using (worker_id = (select auth.uid()));
create policy wdoc_employer_select on public.worker_documents for select to authenticated
  using (show_to_employers and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'employer'));
create policy wdoc_admin_select on public.worker_documents for select to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('worker-documents', 'worker-documents', false, 10485760,
        array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy worker_documents_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'worker-documents' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy worker_documents_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'worker-documents' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy worker_documents_read on storage.objects for select to authenticated
  using (bucket_id = 'worker-documents' and (
    (storage.foldername(name))[1] = (auth.uid())::text
    or public.is_admin()
    or exists (
      select 1 from public.worker_documents d
      join public.profiles p on p.id = auth.uid() and p.role = 'employer'
      where d.file_path = storage.objects.name and d.show_to_employers
    )
  ));
