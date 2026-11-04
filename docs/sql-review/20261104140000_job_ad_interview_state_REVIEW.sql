-- REVIEW ONLY. New read-only metadata RPC; do not replace existing listing or news RPCs.
-- Keeps changed styling independent of whether its notification has already been read.
BEGIN;
CREATE OR REPLACE FUNCTION public.job_ad_interview_state()
RETURNS TABLE (application_id uuid, needs_reconfirmation boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_worker uuid := public.job_ad_require_worker();
BEGIN
  RETURN QUERY SELECT a.id,
    a.status = 'interview' AND a.interview_revision > 1 AND a.interview_confirmed_at IS NULL
  FROM public.job_ad_applications a
  JOIN public.job_ads ad ON ad.id = a.ad_id
  WHERE a.worker_id = v_worker AND ad.status <> 'removed';
END $$;
REVOKE ALL ON FUNCTION public.job_ad_interview_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_ad_interview_state() TO authenticated;
COMMIT;
