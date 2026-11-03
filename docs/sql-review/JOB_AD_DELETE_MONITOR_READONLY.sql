-- READ ONLY, privileged operator only. Counts; no credentials or file names.
BEGIN READ ONLY;
SELECT enabled AS deletion_enabled FROM app_private.job_ad_deletion_policy WHERE singleton;
SELECT count(*) FILTER(WHERE completed_at IS NULL) AS pending_jobs,
 max(attempts) FILTER(WHERE completed_at IS NULL) AS max_pending_attempts,
 min(created_at) FILTER(WHERE completed_at IS NULL) AS oldest_pending,
 count(*) FILTER(WHERE completed_at IS NOT NULL) AS completed_retry_receipts
FROM app_private.job_ad_deletion_jobs;
SELECT jobname,active,schedule FROM cron.job WHERE jobname='s24-job-ad-file-cleanup';
ROLLBACK;
