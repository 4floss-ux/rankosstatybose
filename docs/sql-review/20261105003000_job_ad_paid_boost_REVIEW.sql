-- REVIEW ONLY. 4.99 EUR / 7 days; OFF until separately reviewed activation.
-- Does not replace any existing function, payment flow or table permissions.
BEGIN;
CREATE TABLE app_private.job_ad_boost_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false,
 environment text NOT NULL DEFAULT 'test' CHECK(environment IN ('test','live')), test_company_id uuid
);
INSERT INTO app_private.job_ad_boost_settings DEFAULT VALUES;
CREATE TABLE app_private.job_ad_boosts (
 ad_id uuid REFERENCES public.job_ads(id) ON DELETE CASCADE, environment text NOT NULL CHECK(environment IN ('test','live')), PRIMARY KEY(ad_id,environment),
 boosted_at timestamptz NOT NULL, boosted_until timestamptz NOT NULL CHECK(boosted_until>boosted_at)
);
CREATE TABLE app_private.job_ad_boost_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ad_id uuid NOT NULL, company_id uuid NOT NULL,
 created_by uuid NOT NULL, stripe_customer_id text, return_origin text NOT NULL DEFAULT 'https://statybos24.lt' CHECK(return_origin IN ('https://statybos24.lt','https://www.statybos24.lt','https://redesign-rankosstatybose.4floss.workers.dev')), created_at timestamptz NOT NULL DEFAULT now(),
 amount_cents integer NOT NULL DEFAULT 499 CHECK(amount_cents=499), currency text NOT NULL DEFAULT 'eur' CHECK(currency='eur'),
 environment text NOT NULL CHECK(environment IN ('test','live')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','expired','paid','paid_unfulfilled')),
 session_id text UNIQUE, paid_at timestamptz, applied_until timestamptz, webhook_seen_at timestamptz
);
CREATE UNIQUE INDEX job_ad_boost_one_pending ON app_private.job_ad_boost_orders(ad_id) WHERE status='pending';
ALTER TABLE app_private.job_ad_boost_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.job_ad_boost_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.job_ad_boost_settings,app_private.job_ad_boosts,app_private.job_ad_boost_orders FROM PUBLIC,anon,authenticated;

CREATE FUNCTION app_private.job_ad_boost_json(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT jsonb_build_object('boosted_at',b.boosted_at,'boosted_until',b.boosted_until)
 FROM app_private.job_ad_boosts b JOIN app_private.job_ad_boost_settings s ON s.environment=b.environment WHERE b.ad_id=p_id AND b.boosted_until>statement_timestamp()),'{}'::jsonb);
$$;
REVOKE ALL ON FUNCTION app_private.job_ad_boost_json(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.job_ad_boost_quote(p_ad_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.job_ads; settings app_private.job_ad_boost_settings;
BEGIN
 SELECT * INTO a FROM public.job_ads WHERE id=p_ad_id;
 IF a.id IS NULL OR public.account_can_use_platform(auth.uid()) IS DISTINCT FROM TRUE
   OR public.job_ad_can_manage(a.company_id) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Neturite prieigos.' USING ERRCODE='42501'; END IF;
 SELECT * INTO settings FROM app_private.job_ad_boost_settings;
 RETURN jsonb_build_object('enabled',settings.enabled AND (settings.environment='live' OR settings.test_company_id=a.company_id),'environment',settings.environment,'amount_cents',499,'currency','eur','duration_days',7,
 'eligible',public.job_ad_is_live(a) AND a.expires_at>=statement_timestamp()+interval '8 days')
 || app_private.job_ad_boost_json(a.id);
END $$;

-- Only the authenticated owner/manager can reserve an order. Pricing is server-owned.
CREATE FUNCTION public.job_ad_boost_prepare(p_ad_id uuid,p_environment text,p_return_origin text DEFAULT 'https://statybos24.lt') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.job_ads; o app_private.job_ad_boost_orders;
BEGIN
 SELECT * INTO a FROM public.job_ads WHERE id=p_ad_id FOR UPDATE;
 IF a.id IS NULL OR public.account_can_use_platform(auth.uid()) IS DISTINCT FROM TRUE
   OR public.job_ad_can_manage(a.company_id) IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Neturite prieigos.' USING ERRCODE='42501'; END IF;
 IF p_return_origin IS NULL OR p_return_origin NOT IN ('https://statybos24.lt','https://www.statybos24.lt','https://redesign-rankosstatybose.4floss.workers.dev') THEN RAISE EXCEPTION 'Invalid return origin'; END IF;
 IF p_environment NOT IN ('test','live') OR p_environment IS NULL THEN RAISE EXCEPTION 'Invalid environment'; END IF;
 IF NOT EXISTS(SELECT 1 FROM app_private.job_ad_boost_settings WHERE enabled AND environment=p_environment AND (environment='live' OR test_company_id=a.company_id)) THEN RAISE EXCEPTION 'Iškėlimas dar neįjungtas.'; END IF;
 IF NOT public.job_ad_is_live(a) OR a.expires_at<clock_timestamp()+interval '8 days' THEN RAISE EXCEPTION 'Pirmiausia pratęskite skelbimą bent 8 dienoms.'; END IF;
 IF EXISTS(SELECT 1 FROM app_private.job_ad_boosts WHERE ad_id=a.id AND environment=p_environment AND boosted_until>clock_timestamp()) THEN RAISE EXCEPTION 'Skelbimas jau iškeltas.'; END IF;
 SELECT * INTO o FROM app_private.job_ad_boost_orders WHERE ad_id=a.id AND status='pending' FOR UPDATE;
 IF o.id IS NOT NULL AND o.environment<>p_environment THEN RAISE EXCEPTION 'Pending payment belongs to a different environment'; END IF;
 IF o.id IS NULL THEN
  INSERT INTO app_private.job_ad_boost_orders(ad_id,company_id,created_by,environment,return_origin,stripe_customer_id)
  VALUES(a.id,a.company_id,auth.uid(),p_environment,p_return_origin,
   (SELECT c.billing_customer_id FROM public.companies c WHERE c.id=a.company_id AND c.billing_environment=p_environment)) RETURNING * INTO o;
 END IF;
 RETURN to_jsonb(o);
END $$;

-- Trusted Edge only; the browser never gets activation/registration authority.
CREATE FUNCTION public.job_ad_boost_order(p_order_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT to_jsonb(o) FROM app_private.job_ad_boost_orders o WHERE o.id=p_order_id;
$$;
CREATE FUNCTION public.job_ad_boost_register_session(p_order_id uuid,p_session_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_session_id IS NULL OR p_session_id !~ '^cs_[A-Za-z0-9_]+$' THEN RAISE EXCEPTION 'Invalid session'; END IF;
 UPDATE app_private.job_ad_boost_orders SET session_id=p_session_id
 WHERE id=p_order_id AND ((status='pending' AND session_id IS NULL) OR session_id=p_session_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment reservation changed'; END IF;
END $$;
CREATE FUNCTION public.job_ad_boost_expire_order(p_order_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 UPDATE app_private.job_ad_boost_orders SET status='expired' WHERE id=p_order_id AND status='pending';
$$;
CREATE FUNCTION public.job_ad_boost_activate_paid(p_order_id uuid,p_session_id text,p_amount_cents integer,
 p_currency text,p_environment text,p_source text DEFAULT 'confirm') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o app_private.job_ad_boost_orders; a public.job_ads; until_at timestamptz;
BEGIN
 SELECT * INTO o FROM app_private.job_ad_boost_orders WHERE id=p_order_id;
 SELECT * INTO a FROM public.job_ads WHERE id=o.ad_id FOR UPDATE;
 SELECT * INTO o FROM app_private.job_ad_boost_orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.session_id IS DISTINCT FROM p_session_id OR p_amount_cents IS DISTINCT FROM 499
   OR p_currency IS DISTINCT FROM 'eur' OR p_environment IS DISTINCT FROM o.environment THEN RAISE EXCEPTION 'Unverified payment'; END IF;
 IF p_source NOT IN ('confirm','webhook') OR p_source IS NULL THEN RAISE EXCEPTION 'Invalid source'; END IF;
 IF p_source='webhook' THEN UPDATE app_private.job_ad_boost_orders SET webhook_seen_at=clock_timestamp() WHERE id=o.id; END IF;
 IF o.status='paid' THEN RETURN jsonb_build_object('paid',true,'delivered',true,'boosted_until',o.applied_until); END IF;
 IF a.id IS NULL OR a.company_id<>o.company_id OR NOT public.job_ad_is_live(a)
   OR a.expires_at<clock_timestamp()+interval '7 days'
   OR NOT app_private.public_job_ad_visible(a) THEN
  UPDATE app_private.job_ad_boost_orders SET status='paid_unfulfilled',paid_at=coalesce(paid_at,clock_timestamp()) WHERE id=o.id;
  RETURN jsonb_build_object('paid',true,'delivered',false,'reason','ad_unavailable');
 END IF;
 until_at:=clock_timestamp()+interval '7 days';
 INSERT INTO app_private.job_ad_boosts(ad_id,environment,boosted_at,boosted_until) VALUES(a.id,o.environment,clock_timestamp(),until_at)
 ON CONFLICT(ad_id,environment) DO UPDATE SET boosted_at=excluded.boosted_at,boosted_until=excluded.boosted_until;
 UPDATE app_private.job_ad_boost_orders SET status='paid',paid_at=coalesce(paid_at,clock_timestamp()),applied_until=until_at WHERE id=o.id;
 RETURN jsonb_build_object('paid',true,'delivered',true,'boosted_until',until_at);
END $$;
REVOKE ALL ON FUNCTION public.job_ad_boost_order(uuid),public.job_ad_boost_register_session(uuid,text),public.job_ad_boost_expire_order(uuid),public.job_ad_boost_activate_paid(uuid,text,integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ad_boost_order(uuid),public.job_ad_boost_register_session(uuid,text),public.job_ad_boost_expire_order(uuid),public.job_ad_boost_activate_paid(uuid,text,integer,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.job_ad_boost_quote(uuid),public.job_ad_boost_prepare(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.job_ad_boost_quote(uuid),public.job_ad_boost_prepare(uuid,text,text) TO authenticated;

-- New wrappers preserve ALL existing JSON fields and existing RPC definitions/ACLs.
CREATE FUNCTION public.job_ads_worker_boosted_list() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb:=public.job_ads_worker_list();
BEGIN
 RETURN coalesce((SELECT jsonb_agg(j.value||app_private.job_ad_boost_json((j.value->>'id')::uuid)
 ORDER BY (b.boosted_until>statement_timestamp()) DESC NULLS LAST,b.boosted_at DESC NULLS LAST,(j.value->>'published_at')::timestamptz DESC NULLS LAST,j.value->>'id' DESC)
 FROM jsonb_array_elements(rows) j LEFT JOIN app_private.job_ad_boosts b ON b.ad_id=(j.value->>'id')::uuid AND b.environment=(SELECT environment FROM app_private.job_ad_boost_settings) AND b.boosted_until>statement_timestamp()),'[]'::jsonb);
END $$;
CREATE FUNCTION public.job_ads_company_boosted_list(p_company_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb:=public.job_ads_company_list(p_company_id);
BEGIN
 RETURN coalesce((SELECT jsonb_agg(j.value||app_private.job_ad_boost_json((j.value->>'id')::uuid) ORDER BY j.ordinality)
 FROM jsonb_array_elements(rows) WITH ORDINALITY j(value,ordinality)),'[]'::jsonb);
END $$;
CREATE FUNCTION public.job_ads_public_boosted_list(p_city text DEFAULT NULL,p_limit integer DEFAULT 24,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH candidates AS (
 SELECT a.id,a.published_at,b.boosted_at,b.boosted_until FROM public.job_ads a LEFT JOIN app_private.job_ad_boosts b ON b.ad_id=a.id AND b.environment=(SELECT environment FROM app_private.job_ad_boost_settings) AND b.boosted_until>statement_timestamp()
 WHERE app_private.public_job_ad_visible(a) AND (nullif(btrim(p_city),'') IS NULL OR a.city=btrim(p_city))
 ORDER BY b.boosted_at DESC NULLS LAST,a.published_at DESC NULLS LAST,a.id DESC
 LIMIT greatest(1,least(coalesce(p_limit,24),50))+1 OFFSET greatest(0,coalesce(p_offset,0))
 ), page AS (SELECT * FROM candidates ORDER BY boosted_at DESC NULLS LAST,published_at DESC NULLS LAST,id DESC LIMIT greatest(1,least(coalesce(p_limit,24),50)))
 SELECT jsonb_build_object('ads',coalesce((SELECT jsonb_agg(app_private.public_job_ad_json(a)||app_private.job_ad_boost_json(a.id)
 ORDER BY p.boosted_at DESC NULLS LAST,p.published_at DESC NULLS LAST,p.id DESC) FROM page p JOIN public.job_ads a ON a.id=p.id),'[]'::jsonb),
 'has_more',(SELECT count(*) FROM candidates)>greatest(1,least(coalesce(p_limit,24),50)));
$$;
CREATE FUNCTION public.job_ad_public_boosted_detail(p_ad_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.job_ad_public_detail(p_ad_id)||app_private.job_ad_boost_json(p_ad_id);
$$;
REVOKE ALL ON FUNCTION public.job_ads_worker_boosted_list(),public.job_ads_company_boosted_list(uuid),public.job_ads_public_boosted_list(text,integer,integer),public.job_ad_public_boosted_detail(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_ads_worker_boosted_list(),public.job_ads_company_boosted_list(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_ads_public_boosted_list(text,integer,integer),public.job_ad_public_boosted_detail(uuid) TO anon,authenticated;
COMMIT;
