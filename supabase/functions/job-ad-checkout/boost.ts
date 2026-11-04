import { BOOST_AMOUNT, BOOST_CURRENCY, fulfilBoost } from "../_shared/jobAdBoost.mjs";
// Additional actions on the existing checkout endpoint; publication/subscription flows unchanged.
export async function handleBoost({ cfg, user, ad, req, body, stripe }: any) {
  const who = await user.auth.getUser();
  if (who.error || !who.data?.user?.id) throw new Error("Turite būti prisijungę.");
  const complete = (id: string) => fulfilBoost({ admin: cfg.admin, stripe, sessionId: id, environment: cfg.environment, expectedAdId: ad.id });
  if (body.action === "boost_confirm") return await complete(String(body.sessionId || ""));
  const origin = String(req.headers.get("Origin") || "").replace(/\/$/, "");
  const allowed = ["https://statybos24.lt", "https://www.statybos24.lt", "https://redesign-rankosstatybose.4floss.workers.dev"];
  for (let attempt = 0; attempt < 2; attempt++) {
    const reserved = await user.rpc("job_ad_boost_prepare", { p_ad_id: ad.id, p_environment: cfg.environment, p_return_origin: allowed.includes(origin) ? origin : allowed[0] });
    if (reserved.error || !reserved.data?.id) throw new Error("Nepavyko paruošti iškėlimo. Patikrinkite, ar skelbimas galioja dar bent 8 dienas ir nėra jau iškeltas.");
    const order = reserved.data;
    if (order.session_id) {
      const old = await stripe(`checkout/sessions/${encodeURIComponent(order.session_id)}`);
      if (old.payment_status === "paid") return await complete(old.id);
      if (old.status === "open" && old.url) return { url: old.url };
      if (old.status !== "expired") throw new Error("Ankstesnio mokėjimo būsena dar tikrinama.");
      const expired = await cfg.admin.rpc("job_ad_boost_expire_order", { p_order_id: order.id });
      if (expired.error) throw new Error("Nepavyko atnaujinti mokėjimo būsenos.");
      continue;
    }
    // Stable order-based parameters/idempotency prevent duplicate sessions on retries.
    // Stripe's default 24h checkout window is covered by the server's 8-day eligibility.
    const params = new URLSearchParams({
      mode: "payment", client_reference_id: order.company_id, locale: "lt", "payment_method_types[]": "card",
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": BOOST_CURRENCY,
      "line_items[0][price_data][unit_amount]": String(BOOST_AMOUNT),
      "line_items[0][price_data][product_data][name]": "Darbo skelbimo iškėlimas 7 dienoms",
      success_url: `${order.return_origin}/?adboost=success&ad=${ad.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${order.return_origin}/?adboost=cancelled&ad=${ad.id}`,
      billing_address_collection: "required", "tax_id_collection[enabled]": "true", "invoice_creation[enabled]": "true",
      "metadata[kind]": "job_ad_boost", "metadata[boost_order_id]": order.id,
      "metadata[ad_id]": ad.id, "metadata[company_id]": order.company_id,
      "payment_intent_data[metadata][kind]": "job_ad_boost", "payment_intent_data[metadata][boost_order_id]": order.id,
    });
    if (order.stripe_customer_id) {
      params.set("customer", order.stripe_customer_id);
      params.set("customer_update[name]", "auto"); params.set("customer_update[address]", "auto");
    }
    const session = await stripe("checkout/sessions", params, `statybos24-boost-${order.id}`);
    if (!session.id || !session.url || new URL(session.url).hostname !== "checkout.stripe.com") throw new Error("Mokėjimo nuoroda negauta.");
    const current = await stripe(`checkout/sessions/${encodeURIComponent(session.id)}`);
    if (current.payment_status === "paid") return await complete(session.id);
    const saved = await cfg.admin.rpc("job_ad_boost_register_session", { p_order_id: order.id, p_session_id: session.id });
    if (saved.error) throw new Error("Nepavyko užregistruoti mokėjimo. Bandykite dar kartą.");
    return { url: session.url };
  }
  throw new Error("Bandykite dar kartą.");
}
