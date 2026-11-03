-- PROPOSAL ONLY: no production execution. Review against live function/trigger DDL.
-- The trusted subscription lifecycle must provision its ORIGINAL purchase anchor
-- using job_ad_set_pro_quota_anchor. Existing accounts remain unchanged by default.
-- Monthly and yearly subscriptions both receive 10 per anchored calendar month.
BEGIN;

CREATE TABLE app_private.job_ad_pro_quota_terms (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_ref text NOT NULL UNIQUE,
  anchor_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE app_private.job_ad_pro_quota_usage (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_ref text NOT NULL,
  period_start timestamptz NOT NULL,
  used integer NOT NULL CHECK (used BETWEEN 0 AND 10),
  PRIMARY KEY (company_id, subscription_ref, period_start)
);
CREATE TABLE app_private.job_ad_pro_extension_receipts (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  ad_id uuid NOT NULL,
  result jsonb,
  PRIMARY KEY (company_id, request_id)
);
ALTER TABLE app_private.job_ad_pro_quota_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_pro_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_pro_extension_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.job_ad_pro_quota_terms, app_private.job_ad_pro_quota_usage,
  app_private.job_ad_pro_extension_receipts FROM PUBLIC, anon, authenticated;

CREATE FUNCTION app_private.job_ad_quota_window(p_anchor timestamptz, p_now timestamptz)
RETURNS TABLE (period_start timestamptz, period_end timestamptz)
LANGUAGE plpgsql STABLE SET search_path = '' AS $fn$
DECLARE a timestamp := p_anchor AT TIME ZONE 'UTC';
  n timestamp := p_now AT TIME ZONE 'UTC'; months integer;
BEGIN
  IF p_anchor IS NULL OR p_now IS NULL OR p_now < p_anchor THEN RETURN; END IF;
  months := (extract(year FROM n)::integer-extract(year FROM a)::integer)*12
    + extract(month FROM n)::integer-extract(month FROM a)::integer;
  IF (a + make_interval(months => months)) AT TIME ZONE 'UTC' > p_now THEN
    months := months-1;
  END IF;
  -- Match the trusted billing UTC anchor; display dates in Lithuanian time.
  -- Always add to the original anchor: Jan 31 -> Feb 28/29 -> Mar 31, no drift.
  period_start := (a + make_interval(months => months)) AT TIME ZONE 'UTC';
  period_end := (a + make_interval(months => months+1)) AT TIME ZONE 'UTC';
  RETURN NEXT;
END;
$fn$;
REVOKE ALL ON FUNCTION app_private.job_ad_quota_window(timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.job_ad_set_pro_quota_anchor(p_company_id uuid, p_subscription_ref text, p_anchor_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE old_terms app_private.job_ad_pro_quota_terms;
BEGIN
  IF p_company_id IS NULL OR nullif(btrim(p_subscription_ref),'') IS NULL
     OR p_anchor_at IS NULL OR NOT isfinite(p_anchor_at) OR p_anchor_at > clock_timestamp() THEN
    RAISE EXCEPTION 'Invalid subscription anchor';
  END IF;
  -- Serializes concurrent subscription events for the same company.
  PERFORM 1 FROM public.companies WHERE id=p_company_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Company not found'; END IF;
  SELECT * INTO old_terms FROM app_private.job_ad_pro_quota_terms WHERE company_id=p_company_id;
  IF old_terms.subscription_ref=p_subscription_ref AND old_terms.anchor_at<>p_anchor_at THEN
    RAISE EXCEPTION 'Original subscription anchor cannot change on renewal';
  END IF;
  INSERT INTO app_private.job_ad_pro_quota_terms(company_id,subscription_ref,anchor_at,enabled)
  VALUES(p_company_id,p_subscription_ref,p_anchor_at,true)
  ON CONFLICT(company_id) DO UPDATE SET subscription_ref=excluded.subscription_ref,
    anchor_at=excluded.anchor_at,enabled=true;
END;
$fn$;
REVOKE ALL ON FUNCTION public.job_ad_set_pro_quota_anchor(uuid,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.job_ad_set_pro_quota_anchor(uuid,text,timestamptz) TO service_role;

CREATE FUNCTION public.job_ad_pro_quota(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE terms app_private.job_ad_pro_quota_terms; w record; n integer;
BEGIN
  IF NOT public.job_ad_can_manage(p_company_id) THEN
    RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
  END IF;
  SELECT * INTO terms FROM app_private.job_ad_pro_quota_terms WHERE company_id=p_company_id;
  IF terms.company_id IS NULL OR NOT terms.enabled THEN
    RETURN jsonb_build_object('enabled',false);
  END IF;
  SELECT * INTO w FROM app_private.job_ad_quota_window(terms.anchor_at,statement_timestamp());
  IF w.period_start IS NULL THEN RAISE EXCEPTION 'Quota anchor unavailable'; END IF;
  SELECT used INTO n FROM app_private.job_ad_pro_quota_usage
    WHERE company_id=p_company_id AND subscription_ref=terms.subscription_ref AND period_start=w.period_start;
  RETURN jsonb_build_object('enabled',true,'limit',10,'used',coalesce(n,0),
    'remaining',CASE WHEN public.company_effective_plan(p_company_id)='business_pro'
      THEN greatest(0,10-coalesce(n,0)) ELSE 0 END,'resets_at',w.period_end);
END;
$fn$;
REVOKE ALL ON FUNCTION public.job_ad_pro_quota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_ad_pro_quota(uuid) TO authenticated;

-- Optional one-time campaign overrides this helper in its separately reviewed SQL.
CREATE FUNCTION app_private.job_ad_uses_first_free(p_ad_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT false $$;
REVOKE ALL ON FUNCTION app_private.job_ad_uses_first_free(uuid,uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION app_private.enforce_job_ad_pro_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE terms app_private.job_ad_pro_quota_terms; w record; n integer;
BEGIN
  IF TG_OP='INSERT' AND app_private.job_ad_uses_first_free(NEW.id,NEW.created_by) THEN RETURN NEW; END IF;
  IF NEW.status<>'active' OR NEW.expires_at IS NULL THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.expires_at<=coalesce(OLD.expires_at,'-infinity'::timestamptz) THEN RETURN NEW; END IF;
    -- Existing extend RPC preserves 'stripe' on a previously paid ad. A user
    -- extension is nevertheless a FREE grant; trusted paid activation uses
    -- service_role and explicitly writes paid_via='stripe'.
    IF NEW.paid_via IS DISTINCT FROM 'plan' AND auth.role() IS DISTINCT FROM 'authenticated' THEN RETURN NEW; END IF;
  ELSIF NEW.paid_via IS DISTINCT FROM 'plan' THEN RETURN NEW;
  END IF;
  SELECT * INTO terms FROM app_private.job_ad_pro_quota_terms WHERE company_id=NEW.company_id FOR SHARE;
  IF terms.company_id IS NULL OR NOT terms.enabled THEN RETURN NEW; END IF;
  IF NOT public.job_ad_can_manage(NEW.company_id)
     OR public.company_effective_plan(NEW.company_id)<>'business_pro' THEN
    RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
  END IF;
  SELECT * INTO w FROM app_private.job_ad_quota_window(terms.anchor_at,clock_timestamp());
  IF w.period_start IS NULL THEN RAISE EXCEPTION 'Quota anchor unavailable'; END IF;
  -- Atomic row update prevents the owner and team members sharing an 11th credit.
  INSERT INTO app_private.job_ad_pro_quota_usage AS usage(company_id,subscription_ref,period_start,used)
    VALUES(NEW.company_id,terms.subscription_ref,w.period_start,1)
  ON CONFLICT(company_id,subscription_ref,period_start)
    DO UPDATE SET used=usage.used+1 WHERE usage.used<10
  RETURNING used INTO n;
  IF n IS NULL THEN
    IF TG_OP='INSERT' THEN
      NEW.status:='pending_payment'; NEW.paid_via:=NULL;
      NEW.published_at:=NULL; NEW.expires_at:=NULL;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Nemokami paskelbimai išnaudoti. Pratęsimas kainuoja 9,99 €.'
      USING ERRCODE='P0001',DETAIL='JOB_AD_FREE_QUOTA_EXHAUSTED';
  END IF;
  NEW.paid_via:='plan';
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION app_private.enforce_job_ad_pro_quota() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_job_ad_pro_quota BEFORE INSERT OR UPDATE ON public.job_ads
  FOR EACH ROW EXECUTE FUNCTION app_private.enforce_job_ad_pro_quota();

-- Existing public.job_ad_extend_plan is preserved. The trigger also protects
-- direct calls to it. New UI uses this wrapper to make a network retry idempotent.
CREATE FUNCTION public.job_ad_extend_plan_with_quota(p_ad_id uuid,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE c uuid; receipt app_private.job_ad_pro_extension_receipts; answer jsonb;
BEGIN
  SELECT company_id INTO c FROM public.job_ads WHERE id=p_ad_id AND status<>'removed';
  IF c IS NULL OR NOT public.job_ad_can_manage(c) THEN
    RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
  END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Missing request ID'; END IF;
  INSERT INTO app_private.job_ad_pro_extension_receipts(company_id,request_id,ad_id)
    VALUES(c,p_request_id,p_ad_id) ON CONFLICT DO NOTHING;
  SELECT * INTO receipt FROM app_private.job_ad_pro_extension_receipts
    WHERE company_id=c AND request_id=p_request_id FOR UPDATE;
  IF receipt.ad_id<>p_ad_id THEN RAISE EXCEPTION 'Request ID conflict'; END IF;
  IF receipt.result IS NOT NULL THEN RETURN receipt.result; END IF;
  answer:=public.job_ad_extend_plan(p_ad_id);
  UPDATE app_private.job_ad_pro_extension_receipts SET result=answer WHERE company_id=c AND request_id=p_request_id;
  RETURN answer;
END;
$fn$;
REVOKE ALL ON FUNCTION public.job_ad_extend_plan_with_quota(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_ad_extend_plan_with_quota(uuid,uuid) TO authenticated;
COMMIT;
