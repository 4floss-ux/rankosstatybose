-- ACTIVATION ONLY. Owner authorized activation/testing in chat.
-- Reviewer must first compare the standalone proposal with live schema and
-- assess history using FIRST_JOB_AD_FREE_PREFLIGHT.sql, including deleted ads.
-- Apply only after the first-free schema and compatible frontend are installed.
-- Does not install/activate Business Pro monthly quota. No existing ad edits.
BEGIN;
DO $check$
BEGIN
  IF to_regclass('app_private.job_ad_first_free_policy') IS NULL
     OR to_regclass('app_private.job_ad_first_free_claims') IS NULL
     OR to_regprocedure('public.job_ad_offer(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Install reviewed first-free schema before activation';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.job_ads'::regclass AND tgname='a_grant_first_job_ad_free'
      AND NOT tgisinternal AND tgenabled IN ('O','A')
      AND tgfoid='app_private.grant_first_job_ad_free()'::regprocedure) THEN
    RAISE EXCEPTION 'Expected first-free trigger is not enabled';
  END IF;
  IF (SELECT count(*) FROM app_private.job_ad_first_free_policy)<>1 THEN
    RAISE EXCEPTION 'Unexpected campaign policy state';
  END IF;
  IF EXISTS(SELECT 1 FROM public.job_ads WHERE created_by IS NULL
    AND (published_at IS NOT NULL OR status='active' OR paid_via IN ('plan','stripe','admin'))) THEN
    RAISE EXCEPTION 'Published ads without author require history review';
  END IF;
  IF has_function_privilege('anon','public.job_ad_offer(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous offer access is unexpected';
  END IF;
END;
$check$;
UPDATE app_private.job_ad_first_free_policy SET enabled=true WHERE singleton;
SELECT enabled AS first_free_enabled,
 (SELECT count(*) FROM app_private.job_ad_first_free_claims) AS claimed_gifts
FROM app_private.job_ad_first_free_policy WHERE singleton;
COMMIT;
