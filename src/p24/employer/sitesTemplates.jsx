import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";
import { P24Modal } from "../ui.jsx";
import { AddressAutocomplete, CityAutocomplete } from "../../ui/location.jsx";

/* Prototipo „Objektai“ (įmonės profilis) ir „Šablonai“ (naujo darbo forma) – Business ir Business Pro planuose. */

const TRANSPORT = { self: "Darbuotojas atvyksta pats", employer_pickup: "Darbdavys paima darbuotoją" };
const right = '<path d="m9 18 6-6-6-6"/>';

function useRpcList(fn, companyId, enabled) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  // Kol DB funkcija nepritaikyta (PGRST202 / 42883), funkcija tiesiog nerodoma.
  const [missing, setMissing] = useState(false);
  const reload = useCallback(async () => {
    if (!companyId || !enabled) { setRows([]); return; }
    const { data, error: err } = await supabase.rpc(fn, { p_company_id: companyId });
    if (err) {
      if (["PGRST202", "42883"].includes(err.code) || /could not find the function|does not exist/i.test(err.message || "")) setMissing(true);
      setError(err.message || "Nepavyko įkelti."); setRows([]);
    } else { setMissing(false); setError(""); setRows(data || []); }
  }, [fn, companyId, enabled]);
  useEffect(() => { reload(); }, [reload]);
  return { rows, error, reload, missing };
}
export const useCompanySites = (companyId, enabled) => useRpcList("get_company_sites", companyId, enabled);
export const useCompanyTemplates = (companyId, enabled) => useRpcList("get_company_job_templates", companyId, enabled);
export const siteTransportLabel = (mode) => TRANSPORT[mode] || TRANSPORT.self;

/* ---------- Objektai (įmonės profilis) ---------- */
export function SitesSection({ companyId, locked, canEdit, onPlans }) {
  const { rows, error, reload, missing } = useCompanySites(companyId, !locked);
  const [open, setOpen] = useState(false);
  const blank = { name: "", city: "Vilnius", address: "", transport: "self", note: "" };
  const [form, setForm] = useState(blank);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function save() {
    if (!form.name.trim() || !form.address.trim()) { setErr("Įrašykite pavadinimą ir adresą."); return; }
    if (!picked || picked.label !== form.address.trim()) { setErr("Pasirinkite tikslų adresą iš pasiūlymų sąrašo."); return; }
    setBusy(true); setErr("");
    const { error: e } = await supabase.rpc("save_company_site", { p_company_id: companyId, p_name: form.name, p_city: form.city, p_address: form.address.trim(), p_transport_mode: form.transport, p_note: form.note, p_latitude: Number(picked.latitude), p_longitude: Number(picked.longitude) });
    setBusy(false);
    if (e) { setErr(e.message || "Nepavyko išsaugoti."); return; }
    setOpen(false); setForm(blank); setPicked(null); reload();
  }
  async function remove(site) {
    const { error: e } = await supabase.rpc("delete_company_site", { p_site_id: site.id });
    if (!e) reload();
  }
  if (missing) return null;
  return (
    <section className="card"><header><div><h2>Objektai {locked ? <span className="protag">Business</span> : null}</h2><p className="small muted" style={{ margin: "2px 0 0" }}>Kuriant darbą adresas ir atvykimo informacija užsipildys automatiškai.</p></div>
      {!locked && canEdit ? <button className="btn sm" type="button" onClick={() => { setErr(""); setOpen(true); }}><Svg name="plus" size={14} width={2.4} />Pridėti objektą</button> : null}</header>
      {locked ? <div className="row" style={{ gap: 10, flexWrap: "wrap" }}><span className="small muted">Išsaugoti objektai – Business plane.</span>{onPlans ? <button className="btn sm" type="button" onClick={onPlans}><Svg name="lock" size={13} width={2.2} />Atrakinti</button> : null}</div>
        : error ? <p className="small muted" style={{ margin: 0 }}>{error}</p>
        : rows.length ? <div className="list">{rows.map((o) => (
          <div className="objrow" key={o.id}><span className="objic"><Svg name="pin" size={17} /></span>
            <div className="objtx"><b>{o.name}</b><small>{[o.address, siteTransportLabel(o.transport_mode), o.note].filter(Boolean).join(" · ")}</small></div>
            {canEdit ? <button className="btn sm ghost" type="button" aria-label={`Pašalinti ${o.name}`} onClick={() => remove(o)}><Svg name="x" size={15} width={2.2} /></button> : null}</div>
        ))}</div> : <p className="small muted" style={{ margin: 0 }}>Objektų dar nėra. Pridėkite dažnai naudojamą adresą.</p>}
      {open ? (
        <P24Modal eyebrow="Įmonės objektai" title="Naujas objektas" busy={busy} onClose={() => setOpen(false)}>
          <div className="form" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label className="field wide">Pavadinimas *<input value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pvz. Žirmūnų objektas" /></label>
            <label className="field">Miestas<CityAutocomplete value={form.city} onChange={(value) => setForm((cur) => ({ ...cur, city: value }))} placeholder="Pradėkite rašyti miestą" /></label>
            <label className="field">Adresas *<AddressAutocomplete value={form.address} city={form.city} selectedAddress={picked}
              onChange={(value) => setForm((cur) => ({ ...cur, address: value }))}
              onSelect={(address) => { setPicked(address); setForm((cur) => ({ ...cur, address: address.label })); }} placeholder="Gatvė, namo nr." /></label>
            <label className="field wide">Atvykimas<select value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })}><option value="self">{TRANSPORT.self}</option><option value="employer_pickup">{TRANSPORT.employer_pickup}</option></select></label>
            <label className="field wide">Pastaba darbuotojams<input value={form.note} maxLength={300} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Pvz. Įvažiavimas iš kiemo pusės" /></label>
          </div>
          {err ? <p className="ferr" role="alert">{err}</p> : null}
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" type="button" disabled={busy} onClick={() => setOpen(false)}>Atšaukti</button><button className="btn primary" type="button" disabled={busy} onClick={save}>{busy ? "Saugoma..." : "Išsaugoti"}</button></div>
        </P24Modal>
      ) : null}
    </section>
  );
}

/* ---------- Šablonai (naujo darbo forma) ---------- */
export function TemplateBar({ templates, locked, onUse, onManage, onPlans }) {
  const ref = useRef(null);
  const list = [...templates].reverse();
  return (
    <section className="card tplbar"><div className="tplh"><Svg name="file" size={17} /><b>Šablonai</b>{locked ? <span className="protag">Business</span> : null}</div>
      {locked ? <><span className="small muted">Dažnai kartojamą darbą sukurkite vienu paspaudimu.</span>{onPlans ? <button className="btn sm" type="button" onClick={onPlans}><Svg name="lock" size={13} width={2.2} />Atrakinti</button> : null}</>
        : list.length ? <>
          <div className="tplcar"><button type="button" className="tplarr" aria-label="Ankstesni šablonai" onClick={() => ref.current?.scrollBy({ left: -200, behavior: "smooth" })}><Svg name="back" size={16} width={2.4} /></button>
            <div className="tplchips" ref={ref}>{list.map((t) => <button key={t.id} type="button" className="chip" title={t.name} onClick={() => onUse(t)}>{t.name}</button>)}</div>
            <button type="button" className="tplarr" aria-label="Kiti šablonai" onClick={() => ref.current?.scrollBy({ left: 200, behavior: "smooth" })}><Svg size={16} width={2.4} paths={right} /></button></div>
          {list.length > 1 ? <button type="button" className="btn sm ghost tplall" title="Ieškoti ir tvarkyti šablonus" onClick={onManage}><Svg name="search" size={14} width={2.2} /><span>{list.length}</span></button> : null}
        </> : <span className="small muted">Išsaugokite darbą kaip šabloną – kitą kartą užpildysite vienu paspaudimu.</span>}
    </section>
  );
}

export function TemplatesModal({ templates, onUse, onClose, onChanged }) {
  const [q, setQ] = useState("");
  const [ren, setRen] = useState(null);
  const [name, setName] = useState("");
  const lc = (v) => String(v || "").toLocaleLowerCase("lt-LT");
  const list = [...templates].reverse().filter((t) => !q.trim() || lc(`${t.name} ${t.data?.title || ""} ${t.data?.address || ""}`).includes(lc(q.trim())));
  async function rename(t) {
    if (!name.trim()) return;
    const { error } = await supabase.rpc("rename_company_job_template", { p_template_id: t.id, p_name: name });
    if (!error) { setRen(null); onChanged(); }
  }
  async function remove(t) {
    const { error } = await supabase.rpc("delete_company_job_template", { p_template_id: t.id });
    if (!error) onChanged();
  }
  const meta = (d = {}) => [d.address, d.startTime && d.endTime ? `${d.startTime}–${d.endTime}` : "", d.workersNeeded ? `${d.workersNeeded} žm.` : "", d.payAmount ? `${d.payAmount} € / ${d.payUnit === "day" ? "d." : "val."}` : ""].filter(Boolean).join(" · ");
  return (
    <P24Modal eyebrow="Šablonai" title={`Visi šablonai · ${templates.length}`} onClose={onClose}>
      <label className="field"><span className="sr">Ieškoti</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ieškoti šablono…" autoComplete="off" /></label>
      <div className="tpllist">{list.map((t) => (
        <div className="tplrow" key={t.id}>
          {ren === t.id
            ? <><div className="tpltx"><input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Naujas pavadinimas" /></div><button className="btn sm primary" type="button" onClick={() => rename(t)}>Išsaugoti</button></>
            : <><div className="tpltx"><b>{t.name}</b><small>{meta(t.data)}</small></div><button className="btn sm primary" type="button" onClick={() => { onUse(t); onClose(); }}>Naudoti</button>
              <button className="btn sm ghost" type="button" title="Pervadinti" aria-label={`Pervadinti ${t.name}`} onClick={() => { setRen(t.id); setName(t.name); }}><Svg name="edit" size={15} width={2.2} /></button></>}
          <button className="btn sm ghost" type="button" title="Ištrinti" aria-label={`Ištrinti ${t.name}`} onClick={() => remove(t)}><Svg name="x" size={15} width={2.2} /></button>
        </div>
      ))}{list.length ? null : <p className="small muted" style={{ margin: 0 }}>Nieko nerasta.</p>}</div>
    </P24Modal>
  );
}
