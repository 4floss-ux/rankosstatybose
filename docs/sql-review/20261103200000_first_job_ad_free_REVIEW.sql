-- PROPOSAL ONLY. Apply only after the reviewed Business Pro quota proposal.
-- First NEW publication per authenticated user, all plans, including team members.
-- Additional to Pro monthly credits; never usable for an extension.
-- Disabled until an explicitly approved campaign activation. No existing rows edited.
BEGIN;
CREATE TABLE app_private.job_ad_first_free_policy (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false
);
INSERT INTO app_private.job_ad_first_free_policy(singleton,enabled) VALUES(true,false);
CREATE TABLE app_private.job_ad_first_free_claims (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL,
  grant_txid bigint NOT NULL DEFAULT txid_current(),
  claimed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- Deliberately no FK from the claim to ad/company: removing an ad/company must
-- not restore the user's gift in another company. No message or billing values.
ALTER TABLE app_private.job_ad_first_free_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_first_free_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.job_ad_first_free_policy,app_private.job_ad_first_free_claims
  FROM PUBLIC,anon,authenticated;

CREATE FUNCTION app_private.job_ad_first_free_available(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT p_user_id IS NOT NULL
    AND EXISTS(SELECT 1 FROM app_private.job_ad_first_free_policy WHERE singleton AND enabled)
    AND NOT EXISTS(SELECT 1 FROM app_private.job_ad_first_free_claims WHERE user_id=p_user_id)
    AND NOT EXISTS(SELECT 1 FROM public.job_ads WHERE created_by=p_user_id
      AND (published_at IS NOT NULL OR status='active' OR paid_via IN ('plan','stripe','admin')));
$fn$;
REVOKE ALL ON FUNCTION app_private.job_ad_first_free_available(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION app_private.job_ad_uses_first_free(p_ad_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS(SELECT 1 FROM app_private.job_ad_first_free_claims
    WHERE ad_id=p_ad_id AND user_id=p_user_id AND grant_txid=txid_current());
$fn$;
REVOKE ALL ON FUNCTION app_private.job_ad_uses_first_free(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION app_private.grant_first_job_ad_free()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE granted uuid;
BEGIN
  -- Trusted paid activation and imported/admin records are not promotional claims.
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL
     OR NEW.created_by IS DISTINCT FROM auth.uid()
     OR NEW.status NOT IN ('active','pending_payment')
     OR NEW.paid_via IN ('stripe','admin') THEN RETURN NEW; END IF;
  IF NOT public.job_ad_can_manage(NEW.company_id) THEN
    RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
  END IF;
  IF NOT app_private.job_ad_first_free_available(auth.uid()) THEN RETURN NEW; END IF;
  INSERT INTO app_private.job_ad_first_free_claims(user_id,ad_id,company_id)
    VALUES(auth.uid(),NEW.id,NEW.company_id) ON CONFLICT DO NOTHING
    RETURNING user_id INTO granted;
  IF granted IS NULL THEN RETURN NEW; END IF;
  NEW.status:='active'; NEW.paid_via:='plan';
  NEW.published_at:=clock_timestamp(); NEW.expires_at:=NEW.published_at+interval '30 days';
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION app_private.grant_first_job_ad_free() FROM PUBLIC,anon,authenticated;
-- PostgreSQL runs same-event BEFORE triggers alphabetically: campaign BEFORE quota.
-- Reviewer must check all existing BEFORE INSERT triggers for compatibility.
CREATE TRIGGER a_grant_first_job_ad_free BEFORE INSERT ON public.job_ads
  FOR EACH ROW EXECUTE FUNCTION app_private.grant_first_job_ad_free();

CREATE FUNCTION public.job_ad_offer(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE q jsonb;
BEGIN
  -- Existing quota RPC performs the company/member permission check first.
  q:=public.job_ad_pro_quota(p_company_id);
  RETURN q||jsonb_build_object('first_free_available',app_private.job_ad_first_free_available(auth.uid()));
END;
$fn$;
REVOKE ALL ON FUNCTION public.job_ad_offer(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.job_ad_offer(uuid) TO authenticated;
-- Release activation requires separate owner approval:
-- UPDATE app_private.job_ad_first_free_policy SET enabled=true WHERE singleton;
COMMIT;
