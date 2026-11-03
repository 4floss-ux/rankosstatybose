-- READ ONLY, privileged reviewer. No account identities, secrets or data values.
BEGIN READ ONLY;
SELECT n.nspname,p.proname,md5(pg_get_functiondef(p.oid)) AS definition_hash,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.oid IN (to_regprocedure('public.job_ad_cv_access(text,boolean)'),
 to_regprocedure('public.job_ad_can_manage(uuid)'),to_regprocedure('app_private.job_ad_first_free_available(uuid)'));
SELECT conrelid::regclass AS dependent_table,confrelid::regclass AS parent_table,
 pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype='f' AND confrelid IN
 ('public.job_ads'::regclass,'public.job_ad_applications'::regclass);
SELECT count(*) FILTER(WHERE pending_session_id IS NOT NULL) AS ads_with_pending_checkout,
 count(*) AS existing_ads FROM public.job_ads;
SELECT to_regclass('cron.job') AS cron_available,to_regclass('vault.decrypted_secrets') AS vault_available,
 to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') AS scheduled_http_available;
ROLLBACK;
-- Compare actual function bodies in the privileged tool, not just these hashes.
-- Inspect extra content copies and existing Storage/Edge implementations.
