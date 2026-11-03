-- READ ONLY. Run by the independent reviewer before approval/activation.
-- Counts and trigger names only; no customer identities or contact details.
BEGIN READ ONLY;
SELECT count(*) AS existing_ads,
 count(*) FILTER(WHERE published_at IS NOT NULL OR status='active' OR paid_via IN ('plan','stripe','admin')) AS ever_published_rows,
 count(DISTINCT created_by) FILTER(WHERE published_at IS NOT NULL OR status='active' OR paid_via IN ('plan','stripe','admin')) AS publishers,
 count(*) FILTER(WHERE created_by IS NULL AND published_at IS NOT NULL) AS published_missing_author
FROM public.job_ads;
SELECT tgname AS existing_trigger, pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger WHERE tgrelid='public.job_ads'::regclass AND NOT tgisinternal;
SELECT to_regprocedure('public.job_ad_offer(uuid)') AS offer_function,
 to_regprocedure('public.job_ad_pro_quota(uuid)') AS optional_quota_function,
 to_regclass('app_private.job_ad_first_free_policy') AS policy_table,
 to_regclass('app_private.job_ad_first_free_claims') AS claims_table;
ROLLBACK;
-- Zero current ads do not establish that no ads have ever been deleted.
-- Reviewer must assess existing audit/history evidence and document that limit.
-- Do not enable the campaign merely because this query returns zero rows.
