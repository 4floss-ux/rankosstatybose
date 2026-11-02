import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Darbo skelbimo apmokėjimas (vienkartinis, 9,99 € už 30 d.).
// Atskira nuo prenumeratų funkcijų – jų nekeičia. Apmokėjimas tikrinamas serveryje per Stripe API.
const AMOUNT_CENTS = 999;
const CURRENCY = "eur";
const ALLOWED_RETURN = ["https://statybos24.lt", "https://www.statybos24.lt", "https://redesign-rankosstatybose.4floss.workers.dev"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
class PayError extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }

function config() {
  const key = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const environment = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "test" : null;
  const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!environment || !url || !service || !anon) throw new PayError("Neužbaigta mokėjimų serverio konfigūracija.", 500);
  return { key, environment, url, anon, admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }) };
}
type Cfg = ReturnType<typeof config>;

async function stripe(cfg: Cfg, path: string, params: URLSearchParams | null = null, idem: string | null = null) {
  const headers: Record<string, string> = { Authorization: "Bearer " + cfg.key };
  if (params) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idem) headers["Idempotency-Key"] = idem;
  const res = await fetch("https://api.stripe.com/v1/" + path, { method: params ? "POST" : "GET", headers, body: params || undefined, signal: AbortSignal.timeout(15000) });
  const data = await res.json();
  if (!res.ok) {
    console.error("Stripe request failed", { path: path.split("?")[0], status: res.status, code: data?.error?.code });
    throw new PayError("Nepavyko susisiekti su mokėjimų sistema. Bandykite dar kartą.", 502);
  }
  if (data?.livemode !== undefined && data.livemode !== (cfg.environment === "live")) throw new PayError("Mokėjimas priklauso kitai Stripe aplinkai.", 409);
  return data;
}

// Tikrinama naudotojo teisė valdyti įmonės skelbimus (tas pats patikrinimas kaip DB funkcijose).
async function loadAd(cfg: Cfg, req: Request, adId: string) {
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/i.test(auth)) throw new PayError("Turite būti prisijungę.", 401);
  const user = createClient(cfg.url, cfg.anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const ad = await cfg.admin.from("job_ads").select("id, company_id, title, status, pending_session_id").eq("id", adId).maybeSingle();
  if (ad.error || !ad.data || ad.data.status === "removed") throw new PayError("Skelbimas nerastas.", 404);
  const can = await user.rpc("job_ad_can_manage", { p_company_id: ad.data.company_id });
  if (can.error || can.data !== true) throw new PayError("Nėra teisių.", 403);
  const who = await user.auth.getUser();
  return { ad: ad.data, email: who.data?.user?.email || "" };
}

async function activate(cfg: Cfg, adId: string, session: any) {
  if (session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.ad_id !== adId
      || session.amount_total !== AMOUNT_CENTS || session.currency !== CURRENCY) return null;
  const { data, error } = await cfg.admin.rpc("job_ad_activate_paid", {
    p_ad_id: adId, p_session_id: session.id, p_amount_cents: session.amount_total, p_currency: session.currency, p_environment: cfg.environment,
  });
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const cfg = config();
    let body: any; try { body = await req.json(); } catch { throw new PayError("Netinkama užklausa."); }
    const adId = String(body?.adId || "");
    if (!/^[0-9a-f-]{36}$/i.test(adId)) throw new PayError("Netinkamas skelbimas.");
    const { ad, email } = await loadAd(cfg, req, adId);

    if (body?.action === "confirm") {
      const sessionId = String(body?.sessionId || ad.pending_session_id || "");
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return reply({ paid: false });
      const session = await stripe(cfg, `checkout/sessions/${encodeURIComponent(sessionId)}`);
      const result = await activate(cfg, adId, session);
      return reply({ paid: Boolean(result), ad: result || null });
    }

    if (body?.action !== "create") throw new PayError("Netinkamas veiksmas.");
    if (!["pending_payment", "active", "closed"].includes(ad.status)) throw new PayError("Šio skelbimo apmokėti negalima.", 409);

    // Neužbaigtą sesiją pakartotinai naudojame, kad nebūtų dvigubų mokėjimų.
    if (ad.pending_session_id) {
      const old = await stripe(cfg, `checkout/sessions/${encodeURIComponent(ad.pending_session_id)}`);
      const done = await activate(cfg, adId, old);
      if (done) return reply({ paid: true, ad: done });
      if (old.status === "open" && old.url) return reply({ url: old.url });
    }

    const origin = (req.headers.get("Origin") || "").replace(/\/$/, "");
    const base = ALLOWED_RETURN.includes(origin) ? origin : "https://statybos24.lt";
    const company = await cfg.admin.from("companies").select("id, name, billing_customer_id, billing_environment").eq("id", ad.company_id).single();
    if (company.error) throw company.error;
    const params = new URLSearchParams({
      mode: "payment", client_reference_id: ad.company_id, locale: "lt",
      "payment_method_types[]": "card",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": CURRENCY,
      "line_items[0][price_data][unit_amount]": String(AMOUNT_CENTS),
      "line_items[0][price_data][product_data][name]": `Darbo skelbimas 30 d. · ${String(ad.title).slice(0, 80)}`,
      success_url: `${base}/?adpay=success&ad=${adId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?adpay=cancelled&ad=${adId}`,
      billing_address_collection: "required", "tax_id_collection[enabled]": "true",
      "invoice_creation[enabled]": "true",
      "metadata[ad_id]": adId, "metadata[company_id]": ad.company_id, "metadata[kind]": "job_ad",
      "payment_intent_data[metadata][ad_id]": adId, "payment_intent_data[metadata][company_id]": ad.company_id,
    });
    if (company.data.billing_customer_id && company.data.billing_environment === cfg.environment) {
      params.set("customer", company.data.billing_customer_id);
      params.set("customer_update[name]", "auto"); params.set("customer_update[address]", "auto");
    } else if (email) {
      params.set("customer_email", email);
    }
    const session = await stripe(cfg, "checkout/sessions", params, `statybos24-jobad-${adId}-${crypto.randomUUID()}`);
    if (!session.url || !session.id) throw new PayError("Stripe negrąžino apmokėjimo nuorodos.", 502);
    const upd = await cfg.admin.from("job_ads").update({ pending_session_id: session.id }).eq("id", adId);
    if (upd.error) throw upd.error;
    return reply({ url: session.url });
  } catch (error) {
    console.error("job-ad-checkout failed", { name: (error as any)?.name, message: (error as any)?.message });
    return reply({ error: error instanceof PayError ? error.message : "Mokėjimo užklausa nepavyko. Bandykite dar kartą." }, error instanceof PayError ? error.status : 500);
  }
});
