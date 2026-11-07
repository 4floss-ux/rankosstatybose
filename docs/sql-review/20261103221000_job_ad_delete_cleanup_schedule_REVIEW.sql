-- PROPOSAL ONLY. Requires reviewed deletion schema, deployed Edge with
-- verify_jwt=false and a verified HMAC-authenticated cleanup path.
-- IMPORTANT: pg_net HTTP queue is readable to browser roles in this project.
-- NEVER send the service_role key (or a static bearer token) through pg_net.
-- Configure:
--   Vault job_ad_cleanup_url: own-project job-ad-delete function URL
--   Vault job_ad_cleanup_hmac_secret: random 32+ byte signing secret
--   Edge Functions Secret JOB_AD_DELETE_CLEANUP_HMAC_SECRET: exactly the
--     same secret (no sharing in chat, repo, screenshots or logs).
-- The queue contains only an expiring HMAC; a replay can only process pending
-- private deletion cleanup jobs, never select/delete arbitrary files or ads.
-- The Edge function enforces a 120-second timestamp limit.
BEGIN;
DO $check$
BEGIN
 IF to_regclass('cron.job') IS NULL
    OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL
    OR to_regprocedure('extensions.hmac(text,text,text)') IS NULL
    OR to_regclass('vault.decrypted_secrets') IS NULL THEN
   RAISE EXCEPTION 'Cron, pg_net, pgcrypto and Vault must be available';
 END IF;
 IF has_table_privilege('anon','vault.decrypted_secrets','SELECT')
    OR has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') THEN
   RAISE EXCEPTION 'Vault signing key could be exposed to browser users';
 END IF;
 IF EXISTS(SELECT 1 FROM cron.job WHERE jobname='s24-job-ad-file-cleanup') THEN
   RAISE EXCEPTION 'Cleanup schedule already exists';
 END IF;
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_url'
      AND decrypted_secret ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/job-ad-delete$')<>1
    OR (SELECT count(*) FROM vault.decrypted_secrets WHERE name='job_ad_cleanup_hmac_secret'
       AND length(decrypted_secret)>=32)<>1 THEN
   RAISE EXCEPTION 'Required same-project cleanup URL or HMAC signing secret missing';
 END IF;
END;
$check$;
SELECT cron.schedule('s24-job-ad-file-cleanup','*/5 * * * *',$cron$
 WITH stamp AS MATERIALIZED (
   SELECT floor(extract(epoch FROM clock_timestamp()))::bigint AS ts
 )
 SELECT net.http_post(
   url:=(SELECT decrypted_secret FROM vault.decrypted_secrets
         WHERE name='job_ad_cleanup_url'),
   headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-s24-cleanup-ts',stamp.ts::text,
      'x-s24-cleanup-signature',encode(extensions.hmac(
         'statybos24:job-ad-cleanup:v1:'||stamp.ts::text,
         (SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name='job_ad_cleanup_hmac_secret'),
         'sha256'),'hex')),
   body:='{"action":"cleanup"}'::jsonb,
   timeout_milliseconds:=60000
 ) FROM stamp;
$cron$);
COMMIT;
-- Reviewer must verify a valid signed request succeeds, missing/expired/
-- tampered HMAC is rejected, and no privileged key appears in pg_net headers.
