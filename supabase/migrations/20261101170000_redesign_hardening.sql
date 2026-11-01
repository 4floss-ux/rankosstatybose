-- Redizaino objektų sutvarkymas (tik šiame redizaine sukurtos lentelės; duomenys nekeičiami).

-- 1) Indeksai užsienio raktams (greitesni trynimai ir paieškos)
create index if not exists job_ad_nudges_worker_idx on public.job_ad_nudges(worker_id);
create index if not exists job_ad_nudges_created_by_idx on public.job_ad_nudges(created_by);
create index if not exists job_ad_payments_ad_idx on public.job_ad_payments(ad_id);
create index if not exists job_ad_payments_company_idx on public.job_ad_payments(company_id);
create index if not exists job_ad_saves_worker_idx on public.job_ad_saves(worker_id);
create index if not exists job_ad_views_worker_idx on public.job_ad_views(worker_id);
create index if not exists job_ads_created_by_idx on public.job_ads(created_by);
create index if not exists worker_favorite_companies_company_idx on public.worker_favorite_companies(company_id);

-- 2) worker_favorite_companies: pasikartojančios politikos (lieka lygiavertės su (select auth.uid()))
drop policy if exists wfc_select_own on public.worker_favorite_companies;
drop policy if exists wfc_insert_own on public.worker_favorite_companies;
drop policy if exists wfc_delete_own on public.worker_favorite_companies;

-- 3) chat_hidden: auth.uid() vertinama vieną kartą
alter policy chat_hidden_select_own on public.chat_hidden using (user_id = (select auth.uid()));
alter policy chat_hidden_insert_own on public.chat_hidden with check (user_id = (select auth.uid()));
alter policy chat_hidden_update_own on public.chat_hidden using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy chat_hidden_delete_own on public.chat_hidden using (user_id = (select auth.uid()));

-- 4) worker_documents: viena skaitymo politika vietoj trijų
drop policy if exists wdoc_owner_select on public.worker_documents;
drop policy if exists wdoc_employer_select on public.worker_documents;
drop policy if exists wdoc_admin_select on public.worker_documents;
create policy wdoc_select on public.worker_documents for select to authenticated using (
  worker_id = (select auth.uid())
  or (show_to_employers and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'employer'))
  or (select public.is_admin())
);

-- 5) CV: darbuotojas gali ištrinti savo įkeltą failą (pvz. nepavykus pridėti prie kandidatūros)
create policy job_ad_cv_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'job-ad-cv' and owner_id = (select auth.uid())::text);
