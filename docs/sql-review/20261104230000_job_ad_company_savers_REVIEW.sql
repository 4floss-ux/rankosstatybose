-- REVIEW ONLY: all existing savers, including applicants; no writes or RPC replacement.
BEGIN;
CREATE OR REPLACE FUNCTION public.job_ad_company_savers(p_ad_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_company uuid;
BEGIN
 SELECT ad.company_id INTO v_company FROM public.job_ads ad WHERE ad.id=p_ad_id AND ad.status<>'removed';
 IF auth.uid() IS NULL OR public.account_can_use_platform(auth.uid()) IS DISTINCT FROM TRUE
    OR v_company IS NULL OR public.job_ad_can_manage(v_company) IS DISTINCT FROM TRUE THEN
   RAISE EXCEPTION 'Neturite prieigos.' USING ERRCODE='42501';
 END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object(
   'worker_id',s.worker_id,'name',p.display_name,'city',p.city,'avatar_path',wp.avatar_path,
   'attendance_rate',wp.attendance_rate,
   'has_applied',EXISTS(SELECT 1 FROM public.job_ad_applications a WHERE a.ad_id=s.ad_id AND a.worker_id=s.worker_id),
   'nudged',EXISTS(SELECT 1 FROM public.job_ad_nudges n WHERE n.ad_id=s.ad_id AND n.worker_id=s.worker_id)) ORDER BY s.worker_id)
 FROM public.job_ad_saves s JOIN public.profiles p ON p.id=s.worker_id
 LEFT JOIN public.worker_profiles wp ON wp.user_id=s.worker_id WHERE s.ad_id=p_ad_id),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.job_ad_company_savers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.job_ad_company_savers(uuid) TO authenticated;
COMMIT;
