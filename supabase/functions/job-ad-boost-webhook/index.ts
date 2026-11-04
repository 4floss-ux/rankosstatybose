import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { fulfilBoost, verifyStripeSignature } from "../_shared/jobAdBoost.mjs";
// Dedicated signed callback so payment delivery does not depend on browser return.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("JOB_AD_BOOST_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 503 });
  if (Number(req.headers.get("content-length") || 0) > 262144) return new Response("Too large", { status: 413 });
  const raw = await req.text();
  if (raw.length > 262144) return new Response("Too large", { status: 413 });
  if (!await verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) return new Response("Invalid signature", { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) return new Response("Ignored");
    if (event.data?.object?.metadata?.kind !== "job_ad_boost") return new Response("Ignored");
    const key = Deno.env.get("STRIPE_BOOST_SECRET_KEY") || "";
    const environment = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "test" : null;
    if (!environment || event.livemode !== (environment === "live")) return new Response("Environment mismatch", { status: 400 });
    const url = Deno.env.get("SUPABASE_URL"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) return new Response("Not configured", { status: 503 });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    await fulfilBoost({ admin, environment, sessionId: event.data.object.id, source: "webhook", stripe: async (path: string) => {
      const r = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error("Stripe lookup failed");
      return r.json();
    } });
    return new Response("OK");
  } catch {
    // No request bodies, signature headers, payment/session data or keys in logs.
    return new Response("Payment verification failed", { status: 500 });
  }
});
