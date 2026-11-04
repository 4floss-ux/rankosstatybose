-- Read-only operational checks; no session IDs, tokens, message/CV data or secrets.
SELECT environment,status,count(*) AS orders,sum(amount_cents) AS total_cents
FROM app_private.job_ad_boost_orders GROUP BY environment,status ORDER BY environment,status;
SELECT id,ad_id,company_id,amount_cents,currency,paid_at
FROM app_private.job_ad_boost_orders WHERE status='paid_unfulfilled' ORDER BY paid_at;
SELECT s.enabled,s.environment,s.test_company_id,
 (SELECT count(*) FROM app_private.job_ad_boost_orders o WHERE o.environment='test' AND o.status='paid' AND o.webhook_seen_at IS NOT NULL) AS webhook_confirmed_test_orders
FROM app_private.job_ad_boost_settings s;
