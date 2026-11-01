import { useEffect, useState } from "react";
import { supabase } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";
import { Pill, up } from "../ui.jsx";
import { salKind, salTxt } from "../worker/WorkerAds.jsx";

/* Administratorius: darbo skelbimai (prototipo aAds). */
const daysLeft = (iso) => (iso ? Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 864e5)) : 0);

export function AdminJobAds() {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState("");

  async function load() {
    const { data, error: e } = await supabase.rpc("job_ads_admin_list");
    if (e) setError(e.message || "Nepavyko įkelti."); else { setError(""); setRows(Array.isArray(data) ? data : []); }
    setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  async function remove(ad) {
    const reason = window.prompt(`Pašalinti skelbimą „${ad.title}“ (${ad.company_name})?\nNurodykite priežastį:`, "");
    if (reason === null) return;
    setBusy(ad.id);
    const { error: e } = await supabase.rpc("job_ad_admin_remove", { p_ad_id: ad.id, p_reason: reason });
    setBusy("");
    if (e) setError(e.message); else { setOpen(null); load(); }
  }

  const needle = q.trim().toLocaleLowerCase("lt-LT");
  const list = rows.filter((a) => !needle || `${a.title} ${a.city} ${a.company_name}`.toLocaleLowerCase("lt-LT").includes(needle));
  const state = (a) => a.status === "pending_payment" ? <Pill tone="orange">Neapmokėtas</Pill> : a.status === "closed" ? <Pill>Uždarytas</Pill> : a.live ? `${daysLeft(a.expires_at)} d.` : <Pill>Nebegalioja</Pill>;

  return (
    <>
      <div className="head"><div><h1>Darbo skelbimai</h1><p className="lead">Ilgalaikio darbo skelbimai ir kandidatai</p></div></div>
      <div className="abar2"><label className="field asrch"><span className="sr">Ieškoti</span><span className="asrch-in"><Svg name="search" size={16} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Skelbimas, miestas ar įmonė" autoComplete="off" /></span></label></div>
      {error && <p className="ferr" role="alert">{error}</p>}
      <section className="card"><div className="atbl aa2">
        <div className="atr ath"><span>Skelbimas</span><span>Kandidatai</span><span>Peržiūros</span><span>Apmokėjimas</span><span>Galioja</span><span /></div>
        {!loaded ? <p className="small muted" style={{ padding: "14px 4px", margin: 0 }}>Įkeliama...</p>
          : list.length ? list.map((a) => (
            <div className="atr" key={a.id}>
              <button type="button" className="acell-nm alink" onClick={() => setOpen(a)}><span><b>{up(a.title)}</b><small>{a.company_name} · {a.city}</small></span></button>
              <span data-l="Kandidatai"><b>{a.candidates || 0}</b></span>
              <span data-l="Peržiūros">{a.views || 0}</span>
              <span data-l="Apmokėjimas">{a.paid_via === "plan" ? "Business Pro" : a.paid_via === "stripe" ? "Stripe" : "—"}</span>
              <span data-l="Galioja">{state(a)}</span>
              <span className="aacts">
                <button className="btn sm" type="button" onClick={() => setOpen(a)}><Svg name="eye" size={14} />Peržiūrėti</button>
                <button className="btn sm ghost" type="button" disabled={busy === a.id} onClick={() => remove(a)} aria-label="Pašalinti skelbimą" title="Pašalinti skelbimą"><Svg name="x" size={15} width={2.2} /></button>
              </span>
            </div>
          )) : <p className="small muted" style={{ padding: "14px 4px", margin: 0 }}>Skelbimų nėra.</p>}
      </div></section>
      {open && (
        <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label={open.title}>
            <div className="mhead"><div><span className="eyebrow">Skelbimas</span><h2>{up(open.title)}</h2><span className="muted small">{open.company_name} · {open.city}</span></div>
              <button type="button" className="iconb" onClick={() => setOpen(null)} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
            <dl className="jd-dl">
              <div><dt><Svg name="euro" size={17} />Atlyginimas</dt><dd>{salTxt(open)} {salKind(open)} / mėn.</dd></div>
              <div><dt><Svg name="file" size={17} />Sutartis</dt><dd>{open.contract_type || "Nenurodyta"}</dd></div>
              <div><dt><Svg name="clock" size={17} />Grafikas</dt><dd>{open.schedule || "Nenurodyta"}</dd></div>
              <div><dt><Svg name="pin" size={17} />Vieta</dt><dd>{open.address || open.city}</dd></div>
            </dl>
            <p className="small" style={{ whiteSpace: "pre-wrap" }}>{open.description}</p>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn" type="button" onClick={() => setOpen(null)}>Uždaryti</button>
              <button className="btn danger" type="button" disabled={busy === open.id} onClick={() => remove(open)}>Pašalinti skelbimą</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
