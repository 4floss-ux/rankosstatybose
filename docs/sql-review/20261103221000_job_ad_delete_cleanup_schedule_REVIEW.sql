-- PROPOSAL ONLY. Requires reviewed deletion schema and deployed job-ad-delete.
-- Configure these two Vault secrets securely using Supabase; do not put secret
-- VALUES in this file, GitHub, screenshots or chat:
--   job_ad_cleanup_url: https://<same-project-ref>.supabase.co/functions/v1/job-ad-delete
--   job_ad_cleanup_service_key: that project's SUPABASE_SERVICE_ROLE_KEY
-- The Edge function checks the service key; anon/user JWTs cannot run cleanup.
-- Never copy a secret from another project. Never use a browser-visible key.
BEGIN;
DO $check$
BEGIN
 IF to_regclass('cron.job') IS NULL OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
    OR to_regclass('vault.decrypted_secrets') IS NULL THEN
  RAISE EXCEPTION 'Supabase Cron, pg_net and Vault must be available; configure securely before enabling deletion';
 END IF;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='s24-job-ad-file-cleanup') THEN
  RAISE EXCEPTION 'Cleanup schedule already exists; inspect instead of overwriting';
 END IF;
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_url'
      AND decrypted_secret ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/job-ad-delete$')<>1
    OR (SELECT count(*) FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_service_key' AND length(decrypted_secret)>20)<>1 THEN
  RAISE EXCEPTION 'Required same-project Vault configuration missing';
 END IF;
END;
$check$;
SELECT cron.schedule('s24-job-ad-file-cleanup','*/5 * * * *',$cron$
 SELECT net.http_post(
  url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_url'),
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_service_key')),
  body:='{"action":"cleanup"}'::jsonb,timeout_milliseconds:=60000);
$cron$);
COMMIT;
-- Reviewer must confirm cron/pg_net tables and HTTP logs are not readable by
-- browser roles and verify successful service cleanup with no credentials logged.
