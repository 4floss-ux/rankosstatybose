-- PROPOSAL ONLY / DO NOT DEPLOY ALONE.
-- Run ONLY after the reviewed deletion schema, payment checkout leases,
-- service-only Storage cleanup, deletion Edge function and end-to-end
-- deletion activation are deployed and verified.
-- The historical redesign migration is deliberately left unchanged.
BEGIN;
DO $preflight$
BEGIN
  IF to_regprocedure('public.job_ad_delete(uuid)') IS NULL
     OR to_regprocedure('public.job_ad_deletion_available(uuid)') IS NULL
     OR to_regclass('app_private.job_ad_deletion_policy') IS NULL THEN
    RAISE EXCEPTION 'Do not retire closed status before safe owner deletion is installed';
  END IF;
  IF (SELECT enabled FROM app_private.job_ad_deletion_policy WHERE singleton)
      IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Do not retire closed status while owner deletion is disabled';
  END IF;
  IF EXISTS (SELECT 1 FROM public.job_ads WHERE status='closed') THEN
    RAISE EXCEPTION 'Legacy closed job adverts must be reviewed and resolved first';
  END IF;
  IF to_regprocedure('public.job_ad_close(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Unexpected schema: job_ad_close is already missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.job_ads'::regclass AND conname='job_ads_status_check'
      AND pg_get_constraintdef(oid) LIKE '%closed%'
  ) THEN
    RAISE EXCEPTION 'Unexpected status check; do not overwrite unknown constraints';
  END IF;
END;
$preflight$;
-- RESTRICT is intentional: a dependent view or function must halt the migration.
DROP FUNCTION public.job_ad_close(uuid) RESTRICT;
-- Transactional replacement: no window with an unrestricted status column.
ALTER TABLE public.job_ads DROP CONSTRAINT job_ads_status_check;
ALTER TABLE public.job_ads ADD CONSTRAINT job_ads_status_check
  CHECK (status IN ('pending_payment','active','removed'));
COMMIT;
