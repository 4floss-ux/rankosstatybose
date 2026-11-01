import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/config.js";
import { Svg } from "../Shell.jsx";
import { Pill, up } from "../ui.jsx";
import { shortWorkerName } from "../../employer/plans.js";

/* Prototipo eStats. Duomenys – RPC employer_stats_v1 (tik skaitymas). */

const PLV = { basic: 0, business: 1, business_pro: 2 };
const PLN = { basic: "Basic", business: "Business", business_pro: "Business Pro" };
const GR = (n) => n / 0.605; // apytikslis „ant popieriaus“ pagal GPM ir „Sodrą“ (kaip prototipe)
const MON_S = ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rgp", "Rgs", "Spa", "Lap", "Grd"];
const eur = (n) => `${Math.round(Number(n || 0)).toLocaleString("lt-LT")} €`;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hrs = (m) => Math.round(Number(m || 0) / 60);
const fillTime = (m) => (m ? `${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, "0")} val.` : "—");
const PERIODS = [["m1", "Šis mėnuo", "basic"], ["m3", "3 mėn.", "business"], ["m6", "6 mėn.", "business"], ["m12", "12 mėn.", "business_pro"], ["cust", "Pasirinkti datas", "business_pro"]];

function rangeOf(per, from, to) {
  const t = new Date();
  const start = new Date(t.getFullYear(), t.getMonth(), 1);
  if (per === "m1") return [iso(start), iso(t)];
  if (per === "cust") return [from, to];
  const n = { m3: 2, m6: 5, m12: 11 }[per];
  return [iso(new Date(t.getFullYear(), t.getMonth() - n, 1)), iso(t)];
}

function Lock({ ok, need, onPlans, children }) {
  if (ok) return children;
  return (
    <div className="stlock"><div className="stlock-in" aria-hidden="true">{children}</div>
      <div className="stlock-ov"><Svg name="lock" size={20} width={2.2} /><b>Prieinama {PLN[need]} plane</b>
        <button className="btn sm primary" type="button" onClick={onPlans}>Atrakinti su {PLN[need]}</button></div></div>
  );
}

function Bar({ label, value, dim }) {
  return <div className="ovdr"><span>{label}</span><div className={`ovdbar${dim ? " nv" : ""}`}><i style={{ width: `${value}%` }} /></div><b>{value} %</b></div>;
}
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function downloadCsv(name, rows) {
  const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function printReport(title, company, rows, total) {
  const w = window.open("", "_blank", "noopener=no,width=900,height=700");
  if (!w) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:13px Inter,Arial,sans-serif;color:#222631;margin:32px}h1{font-size:20px;margin:0 0 4px}p{color:#6c7a88;margin:0 0 18px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid #e4ebf0}th{font-size:11px;text-transform:uppercase;color:#6c7a88}td.n,th.n{text-align:right}tfoot td{font-weight:700}</style>
  <h1>${esc(title)}</h1><p>${esc(company)} · statybos24.lt · sumos į rankas</p><table><thead><tr><th>Darbuotojas</th><th class="n">Dienos</th><th class="n">Valandos</th><th class="n">Suma</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="n">${r.days}</td><td class="n">${hrs(r.minutes)}</td><td class="n">${eur(r.spend)}</td></tr>`).join("")}</tbody><tfoot><tr><td>Iš viso</td><td class="n">${total.days}</td><td class="n">${hrs(total.minutes)}</td><td class="n">${eur(total.spend)}</td></tr></tfoot></table><script>window.onload=()=>window.print()</script>`);
  w.document.close();
}

export function EmployerStats({ company, planKey, onPlans, onGo, onWorkerProfile, onReliabilityRules }) {
  const plan = PLV[planKey] !== undefined ? planKey : "basic";
  const has = (need) => PLV[plan] >= PLV[need];
  const [per, setPer] = useState("m1");
  const [cust, setCust] = useState(() => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth() - 2, t.getDate())), iso(t)]; });
  const [draft, setDraft] = useState(cust);
  const [gross, setGross] = useState(false);
  const [open, setOpen] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!company?.id) return;
    let off = false;
    const [from, to] = rangeOf(per, cust[0], cust[1]);
    supabase.rpc("employer_stats_v1", { p_company_id: company.id, p_from: from, p_to: to }).then(({ data: d, error }) => {
      if (off) return;
      if (error) setErr(error.message || "Nepavyko įkelti statistikos."); else { setErr(""); setData(d); }
    });
    return () => { off = true; };
  }, [company?.id, per, cust[0], cust[1]]);

  async function openReport(kind) {
    const { data: rowsData, error } = await supabase.rpc("employer_month_report_v1", { p_company_id: company.id });
    if (error) { setErr(error.message || "Nepavyko paruošti ataskaitos."); return; }
    const rows = Array.isArray(rowsData) ? rowsData : [];
    const total = rows.reduce((a, r) => ({ days: a.days + Number(r.days || 0), minutes: a.minutes + Number(r.minutes || 0), spend: a.spend + Number(r.spend || 0) }), { days: 0, minutes: 0, spend: 0 });
    const t = new Date(); const title = `${["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"][t.getMonth()]} ${t.getFullYear()}`;
    if (kind === "pdf") return printReport(`Mėnesio ataskaita · ${title}`, company?.name, rows, total);
    if (kind === "excel") return downloadCsv(`statybos24-ataskaita-${iso(t).slice(0, 7)}.csv`, [["Darbuotojas", "Dienos", "Valandos", "Suma į rankas, €"], ...rows.map((r) => [r.name, r.days, hrs(r.minutes), Math.round(Number(r.spend))]), ["Iš viso", total.days, hrs(total.minutes), Math.round(total.spend)]]);
    setReport({ title, rows, total });
  }

  const d = data || {};
  const spend = Number(d.spend_net || 0);
  const shown = gross ? GR(spend) : spend;
  const money = (n) => (gross ? <em className="g">≈ {eur(GR(n))}</em> : <em>{eur(n)}</em>);
  const mlbl = gross ? "Sumokėta ant popieriaus" : "Sumokėta į rankas";
  const fillRate = pct(d.jobs_filled, d.jobs_created);
  const kpi = (k, lab, val, sub, need) => {
    const ok = has(need);
    return (
      <button type="button" className={`ovcard stk${open === k ? " sel" : ""}${ok ? "" : " lk"}`} onClick={() => (ok ? setOpen(open === k ? "" : k) : onPlans())}>
        <span className="ovtop"><small>{lab}</small>{ok ? null : <Svg name="lock" size={14} width={2.2} />}</span>
        <b className="ovval">{ok ? val : "•••"}</b><span className="ovsub">{ok ? sub : `${PLN[need]} plane`}</span>
      </button>
    );
  };
  const months = d.monthly || [];
  const mx = Math.max(1, ...months.map((m) => Number(m.created || 0)));
  const I = d.invites || {}, A = d.arrival || {}, R = d.reliability || {}, AD = d.ads || {};
  const arrTot = Number(A.present || 0) + Number(A.late || 0) + Number(A.no_show || 0);

  const det = open === "ads" ? (
    <div className="ovdet card relrep"><header><div><h2>Ilgalaikio darbo skelbimai</h2><p className="muted small">Nuolatiniams darbuotojams skirti skelbimai – ne vienkartiniai darbo pasiūlymai</p></div><button type="button" className="linkb" onClick={() => onGo("eads")}>Atidaryti skelbimus</button></header>
      <div className="rr-kpis k6"><div><b>{AD.active || 0}</b><span>Aktyvūs skelbimai</span></div><div><b>{AD.views || 0}</b><span>Peržiūros</span></div><div><b>{AD.candidates || 0}</b><span>Kandidatai</span></div><div><b>{AD.new || 0}</b><span>Nauji, neperžiūrėti</span></div><div><b>{AD.interviews || 0}</b><span>Pakviesta pokalbiui</span></div><div><b>{AD.views ? ((AD.candidates / AD.views) * 100).toFixed(1).replace(".", ",") : 0} %</b><span>Kandidatavo iš peržiūrėjusių</span></div></div>
    </div>
  ) : open === "fill" ? (
    <div className="ovdet card relrep"><header><div><h2>Darbų statistika</h2><p className="muted small">Kaip kuriami, užpildomi ir įvykdomi jūsų darbai</p></div></header>
      <div className="rr-kpis k6"><div><b>{d.jobs_created || 0}</b><span>Sukurta darbų</span></div><div><b>{d.jobs_filled || 0}</b><span>Užpildyta pilnai</span></div><div><b>{d.jobs_completed || 0}</b><span>Įvykdyta</span></div><div><b>{d.jobs_short || 0}</b><span>Trūko žmonių</span></div><div><b>{d.jobs_cancelled || 0}</b><span>Atšaukta</span></div><div><b>{fillTime(d.avg_fill_minutes)}</b><span>Vid. surinkimo laikas</span></div></div>
      <div className="rr-grid">
        <section className="rr-box"><div className="rr-rh"><h3>Sukurta ir įvykdyta pagal mėnesius</h3><div className="lg2"><span><i className="c1" />Sukurta</span><span><i className="c2" />Įvykdyta</span></div></div>
          <div className="bars2">{months.map((m) => <div key={m.m}><div className="b2"><i className="c1" style={{ height: `${(m.created / mx) * 100}%` }} title={`Sukurta ${m.created}`} /><i className="c2" style={{ height: `${(m.completed / mx) * 100}%` }} title={`Įvykdyta ${m.completed}`} /></div><span>{MON_S[Number(m.m.slice(5)) - 1]}</span></div>)}</div></section>
        <section className="rr-box"><h3>Nuo kvietimo iki atlikto darbo</h3><div className="funnel">{[["Išsiųsta kvietimų", I.sent], ["Priimta", I.accepted], ["Atvyko", Number(A.present || 0) + Number(A.late || 0)], ["Užbaigė darbą", d.completed_bookings]].map(([t, n]) => <div className="fn" key={t}><div className="fn-t"><b>{t}</b><span>{n || 0} · {pct(n, I.sent)} %</span></div><div className="fn-b"><i style={{ width: `${pct(n, I.sent)}%` }} /></div></div>)}</div></section>
      </div>
      <div className="rr-grid g3">
        <section className="rr-box"><h3>Kvietimai</h3><Bar label="Priimta" value={pct(I.accepted, I.sent)} /><Bar label="Atmesta" value={pct(I.declined, I.sent)} dim /><Bar label="Neatsakyta" value={pct(I.no_answer, I.sent)} dim /></section>
        <section className="rr-box"><h3>Atvykimas</h3><Bar label="Laiku" value={pct(A.present, arrTot)} /><Bar label="Vėlavo" value={pct(A.late, arrTot)} dim /><Bar label="Neatvyko" value={pct(A.no_show, arrTot)} dim /></section>
        <section className="rr-box"><h3>Komandos surinkimas</h3><div className="ovkpis mini"><div><b>{d.jobs_filled ? (Number(I.sent || 0) / Math.max(1, d.jobs_filled)).toFixed(1).replace(".", ",") : "—"}</b><span>Kvietimų vienam darbui</span></div><div><b>{fillRate} %</b><span>Užpildyta pilnai</span></div></div></section>
      </div>
    </div>
  ) : open === "spend" ? (
    <div className="ovdet card"><header><div><h2>Išlaidos darbo jėgai</h2><p className="muted small">Pagal patvirtintą darbo laiką ir nurodytą atlygį</p></div></header>
      <div className="ovkpis"><div><b>{gross ? "≈ " : ""}{eur(shown)}</b><span>Išleista {gross ? "ant popieriaus" : "į rankas"}</span></div><div><b>{hrs(d.minutes)} val.</b><span>Išdirbta</span></div><div><b>{d.minutes ? (shown / (d.minutes / 60)).toFixed(2).replace(".", ",") : "0"} €</b><span>Vid. valandos kaina {gross ? "ant popieriaus" : "į rankas"}</span></div><div><b>{eur(shown / Math.max(1, d.jobs_completed || 0))}</b><span>Vid. vieno darbo kaina</span></div></div></div>
  ) : open === "rel" ? (
    <div className="ovdet card relrep"><header><div><h2>Įmonės patikimumas</h2><p className="muted small">Tai mato darbuotojai, rinkdamiesi jūsų kvietimus</p></div><button type="button" className="linkb" onClick={onReliabilityRules}>Taisyklės</button></header>
      <div className="rr-top">
        <div className="rr-score"><svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--line)" strokeWidth="9" /><circle cx="50" cy="50" r="40" fill="none" stroke="var(--green)" strokeWidth="9" strokeLinecap="round" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - Number(R.rate || 0) / 100)} transform="rotate(-90 50 50)" /><text x="50" y="53" textAnchor="middle" fontFamily="Manrope,Inter,sans-serif" fontWeight="800" fontSize="26" fill="var(--navy)">{Math.round(Number(R.rate || 0))}</text><text x="50" y="68" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9.5" fill="var(--muted)">iš 100</text></svg>
          <div><b>{Number(R.rate) >= 95 ? "Labai patikima" : Number(R.rate) >= 85 ? "Patikima" : "Reikia dėmesio"}</b></div></div>
        <div className="rr-kpis"><div><b>{R.completed_total || 0}</b><span>Įvykdyti darbai</span></div><div><b>{R.cancelled_after_confirm || 0}</b><span>Atšaukti po patvirtinimo</span></div><div><b>{R.disputes || 0}</b><span>Ginčai</span></div><div><b>{R.rating ? String(R.rating).replace(".", ",") : "—"}</b><span>Darbuotojų įvertinimas</span></div></div>
      </div>
      <section className="rr-box"><h3>Kas keitė patikimumą</h3>{(R.events || []).length ? R.events.map((e, i) => <div className="ovtlr" key={i}><span className={`ovtld ${Number(e.change) < 0 ? "bad" : "ok"}`} /><div><b>{e.reason || "Patikimumo pakeitimas"}</b><span>{String(e.created_at).slice(0, 10)}{e.job ? ` · ${up(e.job)}` : ""}</span></div><em className={Number(e.change) < 0 ? "neg" : "zero"}>{Number(e.change) > 0 ? "+" : ""}{e.change}</em></div>) : <p className="small muted" style={{ margin: 0 }}>Pakeitimų nebuvo.</p>}</section>
      <section className="rr-box"><h3>Darbuotojų atsiliepimai</h3>{(R.reviews || []).length ? <div className="rr-revs">{R.reviews.slice(0, 4).map((r, i) => <div className="cpr" key={i}><span className="av lt sm">★</span><div><div className="cpr-top"><b>Darbuotojas</b><span className="cpr-score">{r.score}/10</span></div>{r.comment ? <p>{r.comment}</p> : null}<small>{r.job ? `${up(r.job)} · ` : ""}{String(r.created_at).slice(0, 10)}</small></div></div>)}</div> : <p className="small muted" style={{ margin: 0 }}>Atsiliepimų dar nėra.</p>}</section>
      <p className="rr-tip"><Svg name="shield" size={15} /> Neatšaukite darbų, kuriuos darbuotojai jau patvirtino. Jei 30 dienų nėra pažeidimų, pridedamas 1 taškas.</p>
    </div>
  ) : null;

  const top = d.top_workers || [], topS = d.top_spend || [], team = d.members || [], sites = d.sites || [];
  const own = Boolean(d.own_only);
  const topFill = (
    <section className="card stc"><header><div><h2>5 geriausi darbuotojai</h2></div></header><Lock ok={has("business")} need="business" onPlans={onPlans}>
      <div className="sttab"><div className="str sthd tophd tf"><span /><b>Darbuotojas</b><span>Darbai</span><span>Įvertinimas</span><em>Atvyko laiku</em><span /></div>
        {top.length ? top.map((w, i) => <div className="str tf" key={w.worker_id}><span className="strk">{i + 1}</span><b>{shortWorkerName(w.name)}</b><span>{w.jobs} darbai</span><span>{w.rating ? `${String(w.rating).replace(".", ",")}/10` : "—"}</span><em>{w.on_time != null ? `${w.on_time} %` : "—"}</em><button className="btn sm" type="button" onClick={() => onWorkerProfile({ id: w.worker_id, name: w.name })}>Profilis</button></div>)
          : <p className="small muted" style={{ margin: "10px 0 0" }}>Per šį laikotarpį įvykdytų darbų nėra.</p>}</div></Lock></section>
  );
  const topMoney = (
    <section className="card stc"><header><div><h2>Išlaidos 5 geriausiems darbuotojams</h2></div></header><Lock ok={has("business")} need="business" onPlans={onPlans}>
      <div className="sttab"><div className="str sthd tophd"><span /><b>Darbuotojas</b><span>Darbai</span><span>Įvertinimas</span><em>{mlbl}</em><span /></div>
        {topS.length ? topS.map((w, i) => <div className="str" key={w.worker_id}><span className="strk">{i + 1}</span><b>{shortWorkerName(w.name)}</b><span>{w.jobs} darbai</span><span>{w.rating ? `${String(w.rating).replace(".", ",")}/10` : "—"}</span>{money(w.spend)}<button className="btn sm" type="button" onClick={() => onWorkerProfile({ id: w.worker_id, name: w.name })}>Profilis</button></div>)
          : <p className="small muted" style={{ margin: "10px 0 0" }}>Per šį laikotarpį išlaidų nėra.</p>}</div></Lock></section>
  );
  const teamFill = own ? null : (
    <section className="card stc"><header><div><h2>Komandos narių darbai</h2></div></header><Lock ok={has("business_pro")} need="business_pro" onPlans={onPlans}>
      <div className="sttab"><div className="str sthd tm4"><b>Žmogus</b><span>Sukurta</span><span>Užpildyta</span><span>Įvykdyta</span><em>Atšaukta</em></div>
        {team.map((m) => <div className="str tm4" key={m.user_id}><b>{m.me ? "Jūs" : shortWorkerName(m.name)}</b><span>{m.created}</span><span>{m.filled}</span><span>{m.completed}</span><em>{m.cancelled}</em></div>)}</div></Lock></section>
  );
  const teamMoney = own ? null : (
    <section className="card stc"><header><div><h2>Kiek išleido komandos nariai</h2></div></header><Lock ok={has("business_pro")} need="business_pro" onPlans={onPlans}>
      <div className="sttab"><div className="str sthd m1"><b>Žmogus</b><span>Įvykdyta</span><span>Darbuotojų</span><em>{gross ? "Išleista ant popieriaus" : "Išleista į rankas"}</em></div>
        {team.map((m) => <div className="str m1" key={m.user_id}><b>{m.me ? "Jūs" : shortWorkerName(m.name)}</b><span>{m.completed}</span><span>{m.workers}</span>{money(m.spend)}</div>)}</div></Lock></section>
  );
  const sitesM = (
    <section className="card stc"><header><div><h2>Išlaidos pagal objektą</h2></div></header><Lock ok={has("business_pro")} need="business_pro" onPlans={onPlans}>
      <div className="sttab"><div className="str sthd m1"><b>Adresas</b><span>Darbai</span><span>Valandos</span><em>{mlbl}</em></div>
        {sites.length ? sites.map((s) => <div className="str" key={s.address}><b>{s.address}</b><span>{s.jobs}</span><span>{hrs(s.minutes)} val.</span>{money(s.spend)}</div>)
          : <p className="small muted" style={{ margin: "10px 0 0" }}>Per šį laikotarpį išlaidų nėra.</p>}</div></Lock></section>
  );
  const foot = <p className="stfoot">Sumos be „≈“ – tokios, kokias nurodėte kurdami darbą. Su „≈“ – perskaičiuotos pagal darbuotojo mokesčius (GPM ir „Sodra“), tikslias pateiks buhalterija.</p>;

  const tables = open === "rel" || open === "ads" ? null : open === "fill" ? <>{topFill}{teamFill}</>
    : open === "spend" ? <>{topMoney}{teamMoney}{sitesM}{foot}</> : <>{topFill}{teamFill}{topMoney}{teamMoney}{sitesM}{foot}</>;

  return (
    <>
      <div className="head"><div><h1>Statistika</h1><p className="lead">{own ? "Tik jūsų darbai · " : ""}{PLN[plan]} planas{per === "cust" ? ` · ${cust[0]} – ${cust[1]}` : ""}</p></div>
        <div className="row stexp">
          {has("business") ? <button className="btn sm" type="button" onClick={() => openReport("view")}><Svg name="file" size={14} />Mėnesio ataskaita</button>
            : <button className="btn sm lockd" type="button" onClick={onPlans} title="Business plane"><Svg name="lock" size={13} width={2.2} />Mėnesio ataskaita</button>}
          {has("business") ? <button className="btn sm" type="button" onClick={() => openReport("pdf")}><Svg name="download" size={14} width={2.2} />PDF</button> : null}
          {has("business_pro") ? <button className="btn sm" type="button" onClick={() => openReport("excel")}><Svg name="download" size={14} width={2.2} />Excel</button> : null}
        </div></div>
      <div className="stbar">
        <div className="chips stper" role="group" aria-label="Laikotarpis">{PERIODS.map(([k, t, need]) => has(need)
          ? <button key={k} type="button" className="chip" aria-pressed={per === k} onClick={() => setPer(k)}>{t}</button>
          : <button key={k} type="button" className="chip lk" onClick={onPlans} title={`${PLN[need]} plane`}><Svg name="lock" size={12} width={2.4} />{t}</button>)}</div>
        <div className="segs stmon" role="radiogroup" aria-label="Sumos">
          <label><input type="radio" name="stm" checked={!gross} onChange={() => setGross(false)} /><span>Į rankas</span></label>
          <label><input type="radio" name="stm" checked={gross} onChange={() => setGross(true)} /><span>Ant popieriaus</span></label>
        </div>
      </div>
      {per === "cust" ? (
        <div className="stcust"><label className="field">Nuo<input type="date" value={draft[0]} max={draft[1]} onChange={(e) => setDraft([e.target.value, draft[1]])} /></label>
          <label className="field">Iki<input type="date" value={draft[1]} max={iso(new Date())} onChange={(e) => setDraft([draft[0], e.target.value])} /></label>
          <button className="btn dark" type="button" onClick={() => setCust(draft)}>Rodyti</button></div>) : null}
      {err && <p className="ferr" role="alert">{err}</p>}
      <section className="ovsec"><div className="ntiles">
        {own ? kpi("fill", "Įvykdyti darbai", d.jobs_completed || 0, `Sukurta ${d.jobs_created || 0}`, "basic")
          : kpi("ads", "Ilgalaikio darbo skelbimai", AD.total || 0, `${AD.candidates || 0} kandidatai · ${AD.views || 0} peržiūros`, "basic")}
        {kpi("fill", "Darbų statistika", `${fillRate} %`, `Vid. surinkimas ${fillTime(d.avg_fill_minutes)}`, "business")}
        {kpi("spend", "Išlaidos darbo jėgai", `${gross ? "≈ " : ""}${eur(shown)}`, `${gross ? "ant popieriaus" : "į rankas"} · ${hrs(d.minutes)} val.`, "business")}
        {kpi("rel", "Įmonės patikimumas", Math.round(Number(R.rate || 0)), "iš 100", "basic")}
      </div>{det}</section>
      {tables}
      {report && (
        <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setReport(null); }}>
          <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label="Ataskaita" style={{ width: "min(640px,100%)" }}>
            <div className="mhead"><div><span className="eyebrow">Ataskaita</span><h2>{report.title}</h2><span className="muted small">Pagal uždarytas darbo dienas · sumos į rankas</span></div><button type="button" className="iconb" onClick={() => setReport(null)} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
            <div className="reptbl"><div className="rr rh"><span>Darbuotojas</span><span>Dienos</span><span>Valandos</span><span>Suma</span></div>
              {report.rows.length ? report.rows.map((r) => <div className="rr" key={r.worker_id}><span>{r.name}</span><span>{r.days}</span><span>{hrs(r.minutes)}</span><span>{eur(r.spend)}</span></div>) : <div className="rr"><span className="muted">Šį mėnesį uždarytų darbo dienų nėra.</span></div>}
              <div className="rr rt"><span>Iš viso</span><span>{report.total.days}</span><span>{hrs(report.total.minutes)}</span><span>{eur(report.total.spend)}</span></div></div>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn" type="button" onClick={() => setReport(null)}>Uždaryti</button>
              {has("business_pro") ? <button className="btn" type="button" onClick={() => openReport("excel")}><Svg name="download" size={15} width={2.2} />Excel</button> : null}
              <button className="btn primary" type="button" onClick={() => openReport("pdf")}><Svg name="download" size={15} width={2.2} />Atsisiųsti PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
