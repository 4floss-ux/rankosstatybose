import { useEffect, useState } from "react";
import { supabase } from "../../lib/config.js";
import { P24Modal, up } from "../ui.jsx";
import { Svg } from "../Shell.jsx";
import { isAdBoosted } from "../../lib/jobAdBoost.js";

export async function confirmAdBoost(adId, sessionId) {
  const { data, error } = await supabase.functions.invoke("job-ad-checkout", { body: { action: "boost_confirm", adId, sessionId } });
  if (error || data?.error || data?.paid !== true) throw new Error("Nepavyko patvirtinti iškėlimo. Bandykite dar kartą arba kreipkitės į pagalbą.");
  return data;
}
export function AdBoostControl({ ad, onChanged }) {
  const [quote, setQuote] = useState(null), [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let active = true; setQuote(null);
    async function load() {
      if (document.visibilityState === "hidden") return;
      try { const r = await supabase.rpc("job_ad_boost_quote", { p_ad_id: ad.id }); if (active && !r.error) setQuote(r.data); } catch { /* Optional, OFF until reviewed */ }
    }
    load(); const timer = setInterval(load, 60000);return () => { active = false; clearInterval(timer); };
  }, [ad.id, ad.expires_at]);
  if (isAdBoosted({ ...ad, ...quote })) return <div className="notebox small">Iškeltas iki {new Date(quote?.boosted_until || ad.boosted_until).toLocaleString("lt-LT",{dateStyle:"short",timeStyle:"short"})}. Pasibaigus galėsite iškelti dar kartą.</div>;
  // Fail closed: no payment button until server reports the reviewed offer enabled.
  if (quote?.enabled !== true || quote.amount_cents !== 499 || quote.currency !== "eur" || quote.duration_days !== 7 || !ad.live) return null;
  async function pay() {
    if (busy) return; setBusy(true); setError("");
    try {
      const { data, error } = await supabase.functions.invoke("job-ad-checkout", { body: { action: "boost_create", adId: ad.id } });
      if (error || data?.error) throw new Error(data?.error || "Nepavyko pradėti iškėlimo apmokėjimo.");
      if (data?.paid) {
        if (!data.delivered) throw new Error("Mokėjimas gautas, bet iškėlimas dar neįjungtas. Kreipkitės į pagalbą; pakartotinai nemokėkite.");
        setQuote(current => ({ ...current, boosted_until: data.boosted_until })); setOpen(false); onChanged(); return;
      }
      if (!data?.url || new URL(data.url).hostname !== "checkout.stripe.com" || new URL(data.url).protocol !== "https:") throw new Error("Mokėjimo nuoroda negauta.");
      window.location.assign(data.url);
    } catch (e) { setError(e.message || "Nepavyko pradėti apmokėjimo."); } finally { setBusy(false); }
  }
  return <>
    <button className="btn jd-wide" type="button" onClick={() => setOpen(true)}><Svg paths='<path d="m6 12 6-6 6 6M12 6v14"/>' size={16} />Iškelti skelbimą · 4,99 €</button>
    {open ? <P24Modal title="Iškelti skelbimą" eyebrow={up(ad.title)} onClose={() => !busy && setOpen(false)}>
      {quote.environment === "test" ? <p className="notebox">Bandomasis apmokėjimas – tik testinei įmonei.</p> : null}
      <p>7 dienas skelbimas bus rodomas aukščiau už įprastus skelbimus ir pažymėtas „Iškeltas“. Miesto filtrai lieka galioti. Tarp iškeltų pirmiau rodomi naujausiai iškelti.</p>
      <div className="adfee"><span>7 dienų iškėlimas</span><b>4,99 €</b></div>
      <p className="small muted">Vienkartinis mokėjimas visuose planuose. Automatiškai nepratęsiama. Pasibaigus galėsite pirkti vėl, be bendro iškėlimų skaičiaus ribos.</p>
      {quote.eligible !== true ? <p className="ferr">Pirmiausia pratęskite skelbimą: jis turi galioti dar bent 8 dienas, įskaitant galimą apmokėjimo laiką.</p> : null}
      {error ? <p className="ferr" role="alert">{error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn" disabled={busy} onClick={() => setOpen(false)}>Atšaukti</button><button type="button" className="btn primary" disabled={busy || quote.eligible !== true} onClick={pay}>{busy ? "Ruošiama..." : "Apmokėti 4,99 € ir iškelti"}</button></div>
    </P24Modal> : null}
  </>;
}
