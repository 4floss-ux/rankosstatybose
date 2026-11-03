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
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='s24-job-ad-file-cleanup' AND active) THEN
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
