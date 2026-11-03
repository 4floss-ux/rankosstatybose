-- PROPOSAL ONLY. Compare all touched definitions with the actual schema first.
-- Install with deletion OFF, then deploy checkout + delete Edge functions and
-- configure the service-only cleanup schedule before enabling deletion.
BEGIN;
DO $check$
DECLARE dep record;
BEGIN
 IF to_regprocedure('public.job_ad_cv_access(text,boolean)') IS NULL
    OR to_regprocedure('app_private.job_ad_first_free_available(uuid)') IS NULL THEN
  RAISE EXCEPTION 'Existing reviewed CV and first-free definitions are required; preserve their ACLs';
 END IF;
 FOR dep IN SELECT * FROM (VALUES
  ('job_ad_applications','job_ads','ad_id'),('job_ad_saves','job_ads','ad_id'),
  ('job_ad_views','job_ads','ad_id'),('job_ad_nudges','job_ads','ad_id'),
  ('job_ad_payments','job_ads','ad_id'),('job_ad_messages','job_ad_applications','application_id'),
  ('job_ad_message_reads','job_ad_applications','application_id')) AS x(child,parent,col)
 LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attname=dep.col
   WHERE c.contype='f' AND c.conrelid=to_regclass('public.'||dep.child)
    AND c.confrelid=to_regclass('public.'||dep.parent) AND c.confdeltype='c' AND c.conkey=ARRAY[a.attnum]::smallint[]) THEN
   RAISE EXCEPTION 'Required cascade missing: %.%. Review the actual schema first.',dep.child,dep.col;
  END IF;
 END LOOP;
END;
$check$;
CREATE TABLE app_private.job_ad_deletion_policy (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false
);
INSERT INTO app_private.job_ad_deletion_policy VALUES(true,false);
-- Minimal accounting, deliberately no FK to the advert/company being removed.
CREATE TABLE app_private.job_ad_retained_payments (
  stripe_session_id text PRIMARY KEY,
  ad_id uuid NOT NULL, company_id uuid NOT NULL,
  amount_cents integer NOT NULL, currency text NOT NULL,
  environment text NOT NULL, paid_at timestamptz NOT NULL
);
-- A previous publication must not become a "first" publication after deletion.
-- This is eligibility evidence, NOT a fabricated promotional gift event.
CREATE TABLE app_private.job_ad_publisher_history (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 evidence_ad_id uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE app_private.job_ad_publisher_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.job_ad_publisher_history FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION app_private.job_ad_first_free_available(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT p_user_id IS NOT NULL
  AND EXISTS(SELECT 1 FROM app_private.job_ad_first_free_policy WHERE singleton AND enabled)
  AND NOT EXISTS(SELECT 1 FROM app_private.job_ad_first_free_claims WHERE user_id=p_user_id)
  AND NOT EXISTS(SELECT 1 FROM app_private.job_ad_publisher_history WHERE user_id=p_user_id)
  AND NOT EXISTS(SELECT 1 FROM public.job_ads WHERE created_by=p_user_id
   AND (published_at IS NOT NULL OR status='active' OR paid_via IN ('plan','stripe','admin')));
$f$;
-- Temporary outbox, NOT an advert/candidate archive. Folder IDs are cleared on
-- completion; completed retry receipts expire after one day.
CREATE TABLE app_private.job_ad_deletion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ad_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL, requested_by uuid NOT NULL,
  application_folders uuid[] NOT NULL DEFAULT '{}',
  attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_id uuid, lease_until timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app_private.job_ad_checkout_leases (
  ad_id uuid PRIMARY KEY REFERENCES public.job_ads(id) ON DELETE CASCADE,
  lease_id uuid NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE app_private.job_ad_deletion_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_retained_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_deletion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_checkout_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.job_ad_deletion_policy,app_private.job_ad_retained_payments,
 app_private.job_ad_deletion_jobs,app_private.job_ad_checkout_leases FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.job_ad_deletion_available(p_company_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF auth.uid() IS NULL OR public.job_ad_can_manage(p_company_id) IS DISTINCT FROM TRUE THEN
  RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
 END IF;
 RETURN (SELECT enabled FROM app_private.job_ad_deletion_policy WHERE singleton);
END;$f$;

CREATE FUNCTION public.job_ad_checkout_acquire(p_ad_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE a public.job_ads; token uuid:=gen_random_uuid();
BEGIN
 SELECT * INTO a FROM public.job_ads WHERE id=p_ad_id FOR UPDATE;
 IF a.id IS NULL OR a.status='removed' OR auth.uid() IS NULL OR public.job_ad_can_manage(a.company_id) IS DISTINCT FROM TRUE THEN
  RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
 END IF;
 INSERT INTO app_private.job_ad_checkout_leases(ad_id,lease_id,expires_at)
 VALUES(a.id,token,clock_timestamp()+interval '15 minutes')
 ON CONFLICT(ad_id) DO UPDATE SET lease_id=excluded.lease_id,expires_at=excluded.expires_at
 WHERE app_private.job_ad_checkout_leases.expires_at<clock_timestamp();
 IF NOT FOUND THEN RAISE EXCEPTION 'Šio skelbimo mokėjimas jau tikrinamas. Bandykite vėliau.'; END IF;
 RETURN token;
END;$f$;
CREATE FUNCTION public.job_ad_checkout_release(p_ad_id uuid,p_lease_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.job_ads a WHERE a.id=p_ad_id AND public.job_ad_can_manage(a.company_id)) THEN
  RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501';
 END IF;
 DELETE FROM app_private.job_ad_checkout_leases WHERE ad_id=p_ad_id AND lease_id=p_lease_id;
END;$f$;

-- Same existing CV access rules, adding a shared transaction lock around Storage
-- metadata operations. Deletion obtains the matching exclusive locks before
-- removing applications, so new uploads cannot race behind the file listing.
CREATE OR REPLACE FUNCTION public.job_ad_cv_access(p_name text,p_write boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE app uuid; x public.job_ad_applications; c uuid;
BEGIN
 BEGIN app:=split_part(p_name,'/',1)::uuid; EXCEPTION WHEN OTHERS THEN RETURN false; END;
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('job-ad-cv:'||app::text,0));
 IF p_write THEN
  SELECT * INTO x FROM public.job_ad_applications WHERE id=app FOR KEY SHARE;
 ELSE
  SELECT * INTO x FROM public.job_ad_applications WHERE id=app;
 END IF;
 IF x.id IS NULL THEN RETURN false; END IF;
 IF x.worker_id=auth.uid() THEN RETURN p_write=false OR x.cv_requested_at IS NOT NULL; END IF;
 IF p_write THEN RETURN false; END IF;
 IF public.is_admin() THEN RETURN true; END IF;
 SELECT company_id INTO c FROM public.job_ads WHERE id=x.ad_id;
 RETURN x.cv_path=p_name AND public.job_ad_can_manage(c);
END;$f$;

CREATE FUNCTION public.job_ad_delete(p_ad_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE a public.job_ads; j app_private.job_ad_deletion_jobs; folders uuid[]; app uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.job_ads WHERE id=p_ad_id FOR UPDATE;
 IF a.id IS NULL THEN
  SELECT * INTO j FROM app_private.job_ad_deletion_jobs WHERE ad_id=p_ad_id;
  IF j.id IS NULL OR public.job_ad_can_manage(j.company_id) IS DISTINCT FROM TRUE THEN
   RAISE EXCEPTION 'Skelbimas nerastas arba nėra teisių.' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object('deleted',true,'job_id',j.id,'cleanup_pending',j.completed_at IS NULL);
 END IF;
 IF public.job_ad_can_manage(a.company_id) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Nėra teisių.' USING ERRCODE='42501'; END IF;
 IF (SELECT enabled FROM app_private.job_ad_deletion_policy WHERE singleton) IS DISTINCT FROM TRUE THEN
  RAISE EXCEPTION 'Skelbimo ištrynimas dar neįjungtas.' USING ERRCODE='55000';
 END IF;
 IF a.pending_session_id IS NOT NULL OR EXISTS(SELECT 1 FROM app_private.job_ad_checkout_leases WHERE ad_id=a.id AND expires_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'Skelbimo negalima ištrinti, kol pradėtas jo apmokėjimas.' USING ERRCODE='55000';
 END IF;
 SELECT coalesce(array_agg(id ORDER BY id),'{}'::uuid[]) INTO folders FROM public.job_ad_applications WHERE ad_id=a.id;
 FOREACH app IN ARRAY folders LOOP
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-ad-cv:'||app::text,0));
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.job_ad_payments p WHERE p.ad_id=a.id AND p.company_id<>a.company_id) THEN
  RAISE EXCEPTION 'Mokėjimo įrašo neatitikimas. Skelbimas nepakeistas.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.job_ad_payments p JOIN app_private.job_ad_retained_payments r USING(stripe_session_id)
  WHERE p.ad_id=a.id AND (r.ad_id,r.company_id,r.amount_cents,r.currency,r.environment,r.paid_at)
    IS DISTINCT FROM (p.ad_id,p.company_id,p.amount_cents,p.currency,p.environment,p.paid_at)) THEN
  RAISE EXCEPTION 'Mokėjimo įrašo neatitikimas. Skelbimas nepakeistas.';
 END IF;
 INSERT INTO app_private.job_ad_retained_payments SELECT stripe_session_id,ad_id,company_id,amount_cents,currency,environment,paid_at
 FROM public.job_ad_payments WHERE ad_id=a.id ON CONFLICT(stripe_session_id) DO NOTHING;
 IF a.created_by IS NOT NULL AND (a.published_at IS NOT NULL OR a.status='active' OR a.paid_via IN ('plan','stripe','admin'))
    AND NOT EXISTS(SELECT 1 FROM app_private.job_ad_first_free_claims WHERE user_id=a.created_by) THEN
  INSERT INTO app_private.job_ad_publisher_history(user_id,evidence_ad_id) VALUES(a.created_by,a.id) ON CONFLICT(user_id) DO NOTHING;
 END IF;
 INSERT INTO app_private.job_ad_deletion_jobs(ad_id,company_id,requested_by,application_folders,completed_at)
 VALUES(a.id,a.company_id,auth.uid(),folders,CASE WHEN cardinality(folders)=0 THEN clock_timestamp() END) RETURNING * INTO j;
 -- Optional quota receipts may cache the full advert JSON. Keep only their
 -- idempotency identifiers; deletion must not leave a hidden content archive.
 IF to_regclass('app_private.job_ad_pro_extension_receipts') IS NOT NULL THEN
  EXECUTE 'UPDATE app_private.job_ad_pro_extension_receipts SET result=NULL WHERE ad_id=$1' USING a.id;
 END IF;
 -- Existing ON DELETE CASCADE constraints remove applications/messages/reads,
 -- views/saves/nudges and original payment rows; retained receipts stay private.
 DELETE FROM public.job_ads WHERE id=a.id;
 RETURN jsonb_build_object('deleted',true,'job_id',j.id,'cleanup_pending',j.completed_at IS NULL);
END;$f$;

CREATE FUNCTION public.job_ad_delete_claim_jobs(p_job_id uuid DEFAULT NULL,p_limit integer DEFAULT 10)
RETURNS TABLE(job_id uuid,lease_id uuid,application_folders uuid[])
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $f$
 WITH candidates AS (
  SELECT id FROM app_private.job_ad_deletion_jobs
  WHERE completed_at IS NULL AND next_attempt_at<=clock_timestamp()
    AND (lease_until IS NULL OR lease_until<clock_timestamp()) AND (p_job_id IS NULL OR id=p_job_id)
  ORDER BY created_at LIMIT greatest(1,least(coalesce(p_limit,10),20)) FOR UPDATE SKIP LOCKED
 ), claimed AS (
  UPDATE app_private.job_ad_deletion_jobs j SET lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '5 minutes'
  FROM candidates c WHERE j.id=c.id RETURNING j.id,j.lease_id,j.application_folders
 ) SELECT * FROM claimed;
$f$;
CREATE FUNCTION public.job_ad_delete_finish_job(p_job_id uuid,p_lease_id uuid,p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
BEGIN
 UPDATE app_private.job_ad_deletion_jobs SET
  completed_at=CASE WHEN p_success THEN clock_timestamp() END,
  application_folders=CASE WHEN p_success THEN '{}'::uuid[] ELSE application_folders END,
  attempts=attempts+1,next_attempt_at=clock_timestamp()+least(30,power(2,least(attempts,5)))::integer*interval '1 minute',
  lease_id=NULL,lease_until=NULL
 WHERE id=p_job_id AND lease_id=p_lease_id AND completed_at IS NULL;
 RETURN FOUND;
END;$f$;
CREATE FUNCTION public.job_ad_delete_prune_jobs()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $f$
 DELETE FROM app_private.job_ad_deletion_jobs WHERE completed_at<clock_timestamp()-interval '1 day';
$f$;

REVOKE ALL ON FUNCTION public.job_ad_deletion_available(uuid),public.job_ad_checkout_acquire(uuid),
 public.job_ad_checkout_release(uuid,uuid),public.job_ad_delete(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.job_ad_deletion_available(uuid),public.job_ad_checkout_acquire(uuid),
 public.job_ad_checkout_release(uuid,uuid),public.job_ad_delete(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.job_ad_delete_claim_jobs(uuid,integer),public.job_ad_delete_finish_job(uuid,uuid,boolean),
 public.job_ad_delete_prune_jobs() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ad_delete_claim_jobs(uuid,integer),public.job_ad_delete_finish_job(uuid,uuid,boolean),
 public.job_ad_delete_prune_jobs() TO service_role;
-- Existing CV function ACL is preserved by CREATE OR REPLACE.
COMMIT;
