-- PROPOSAL ONLY. Owner authorized this work; activation still needs actual
-- schema review, deployed checkout lease code, deployed delete Edge function,
-- verified Storage lock compatibility and a successful service cleanup run.
-- Never enable merely because the frontend build or these SQL checks pass.
BEGIN;
DO $check$
BEGIN
 IF to_regclass('app_private.job_ad_deletion_policy') IS NULL OR to_regclass('cron.job') IS NULL THEN
  RAISE EXCEPTION 'Deletion schema or cleanup schedule missing';
 END IF;
 IF to_regclass('net.http_request_queue') IS NULL OR to_regclass('vault.decrypted_secrets') IS NULL THEN
  RAISE EXCEPTION 'Private cleanup configuration tables are required';
 END IF;
 -- pg_net queue may be readable. Never put raw secrets there: the Cron
 -- command must send only short-lived HMAC proofs, not a service_role key.
 IF has_table_privilege('anon','vault.decrypted_secrets','SELECT')
    OR has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') THEN
  RAISE EXCEPTION 'Vault signing credentials are publicly readable';
 END IF;
 IF (SELECT count(*) FROM vault.decrypted_secrets
      WHERE name='job_ad_cleanup_hmac_secret' AND length(decrypted_secret)>=32)<>1 THEN
  RAISE EXCEPTION 'Cleanup signing key missing';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='s24-job-ad-file-cleanup' AND active
      AND command LIKE '%x-s24-cleanup-signature%'
      AND command NOT ILIKE '%Bearer %') THEN
  RAISE EXCEPTION 'Deletion requires an active service cleanup schedule';
 END IF;
 IF has_function_privilege('authenticated','public.job_ad_delete_claim_jobs(uuid,integer)','EXECUTE')
    OR has_function_privilege('anon','public.job_ad_delete(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'Unexpected deletion permissions';
 END IF;
END;
$check$;
UPDATE app_private.job_ad_deletion_policy SET enabled=true WHERE singleton;
SELECT enabled AS advert_deletion_enabled FROM app_private.job_ad_deletion_policy WHERE singleton;
COMMIT;
