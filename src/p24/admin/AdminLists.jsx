import { useState } from "react";
import { Svg } from "../Shell.jsx";
import { Empty, Paged, Pill, initialsOf, up } from "../ui.jsx";
import { AwardSvg } from "../worker/WorkerProfileEditor.jsx";

/* Administratoriaus sąrašų ekranai pagal prototipą (admin.js). Duomenys ir veiksmai – iš AdminDashboard. */

const lc = (v) => String(v || "").toLocaleLowerCase("lt-LT");
const daysAgo = (iso) => (iso ? Math.round((Date.now() - new Date(iso).getTime()) / 864e5) : null);
const ago = (iso) => { const d = daysAgo(iso); return d == null ? "—" : d <= 0 ? "Šiandien" : d === 1 ? "Vakar" : `Prieš ${d} d.`; };
const dt = (iso) => (iso ? new Date(iso).toLocaleDateString("lt-LT") : "—");
const num = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d).replace(".", ","));
const PLAN = { basic: "Basic", business: "Business", business_pro: "Business Pro" };

function Head({ title, lead, extra }) {
  return <div className="head"><div><h1>{title}</h1>{lead ? <p className="lead">{lead}</p> : null}</div>{extra}</div>;
}
function Search({ value, onChange, placeholder }) {
  return <label className="field asrch"><span className="sr">Ieškoti</span><span className="asrch-in"><Svg name="search" size={16} /><input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" /></span></label>;
}
function Chips({ value, onChange, options }) {
  return <div className="chips" role="group">{options.map(([k, t, n]) => <button key={k} type="button" className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>{t}{n != null ? <> <span className="cnt">{n}</span></> : null}</button>)}</div>;
}
function Av({ name, co }) {
  return <span className={`av ${co ? "co" : "lt"} sm`} style={co ? { border: "1px solid var(--line)" } : undefined}>{initialsOf(String(name || "?").replace(/^(UAB|MB|IĮ|AB)\s+/i, ""))}</span>;
}
function Table({ cls, head, rows, render, empty = "Nieko nerasta." }) {
  return (
    <section className="card"><div className={`atbl ${cls}`}>
      <div className="atr ath">{head.map((h, i) => <span key={i}>{h}</span>)}</div>
      {rows.length ? <Paged items={rows} render={render} /> : <p className="small muted" style={{ padding: "14px 4px", margin: 0 }}>{empty}</p>}
    </div></section>
  );
}
function Modal({ eyebrow, title, sub, onClose, children }) {
  return (
    <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mhead"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{sub ? <span className="muted small">{sub}</span> : null}</div>
          <button type="button" className="iconb" onClick={onClose} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Darbuotojai ---------- */
export function AdminWorkersList({ workers, selfId, isSuspended, isRestricted, onMessage, onEdit, onSuspend, onDelete, onLoginAs }) {
  const [q, setQ] = useState(""); const [f, setF] = useState("all"); const [open, setOpen] = useState(null);
  const susp = (w) => isSuspended(w) || isRestricted(w);
  const nSusp = workers.filter(susp).length;
  const rows = workers.filter((w) => (f === "all" || (f === "susp" ? susp(w) : !susp(w))) && (!q.trim() || lc(`${w.display_name} ${w.city} ${w.email} ${w.phone}`).includes(lc(q.trim()))));
  const status = (w) => isSuspended(w) ? <Pill tone="red">Suspenduotas</Pill> : isRestricted(w) ? <Pill tone="red">Darb. režimas suspenduotas</Pill> : w.is_active ? <Pill tone="green">Aktyvus</Pill> : <Pill>Išjungtas</Pill>;
  const w = open && workers.find((x) => x.user_id === open);
  const self = w && w.user_id === selfId;
  const actSusp = w && (self ? isRestricted(w) : isSuspended(w));
  const close = () => setOpen(null);
  return (
    <>
      <Head title="Darbuotojai" lead={`${workers.length} registruoti darbuotojai`} />
      <div className="abar2"><Search value={q} onChange={setQ} placeholder="Ieškoti pagal vardą ar miestą" />
        <Chips value={f} onChange={setF} options={[["all", "Visi", workers.length], ["ok", "Aktyvūs", workers.length - nSusp], ["susp", "Suspenduoti", nSusp]]} /></div>
      <Table cls="aw" head={["Darbuotojas", "Patikimumas", "Įvertinimas", "Darbai", "Būsena", ""]} rows={rows} render={(x) => (
        <div className="atr" key={x.user_id}>
          <span className="acell-nm"><Av name={x.display_name || x.email} /><span><b>{x.display_name || x.email || "Darbuotojas"}</b><small>{x.city || "Miestas nenurodytas"} · registr. {ago(x.created_at).toLocaleLowerCase("lt-LT")}</small></span></span>
          <span data-l="Patikimumas"><b>{Math.round(Number(x.attendance_rate ?? 100))}</b>/100</span>
          <span data-l="Įvertinimas">{x.rating_average == null ? "—" : `${num(x.rating_average)}/10`}</span>
          <span data-l="Darbai">{Number(x.completed_jobs || 0)}</span>
          <span>{status(x)}</span>
          <span className="aacts"><button className="btn sm" type="button" onClick={() => setOpen(x.user_id)}>Valdyti</button></span>
        </div>
      )} />
      {w && (
        <Modal eyebrow="Darbuotojas" title={w.display_name || w.email || "Darbuotojas"} sub={`${w.city || "Miestas nenurodytas"} · registr. ${dt(w.created_at)}`} onClose={close}>
          <div className="kv">
            <div><small>Telefonas</small><b>{w.phone || "—"}</b></div>
            <div><small>El. paštas</small><b>{w.email || "—"}</b></div>
            <div><small>Patikimumas</small><b>{Math.round(Number(w.attendance_rate ?? 100))}/100</b></div>
            <div><small>Įvertinimas</small><b>{w.rating_average == null ? "—" : `${num(w.rating_average)}/10 (${w.rating_count || 0})`}</b></div>
            <div><small>Darbų</small><b>{Number(w.completed_jobs || 0)}</b></div>
            <div><small>Suspendavimų</small><b>{Number(w.suspension_count || 0)}</b></div>
          </div>
          {isSuspended(w) ? <div className="alert"><div><b>Paskyra suspenduota</b><p>{w.suspension_reason || "Priežastis nenurodyta"} · iki {dt(w.suspended_until)}</p></div></div>
            : isRestricted(w) ? <div className="alert"><div><b>Darbuotojo režimas suspenduotas</b><p>iki {dt(w.restricted_until)}</p></div></div> : null}
          <div className="mgrid">
            {!self && onLoginAs ? <button className="btn" type="button" onClick={() => { close(); onLoginAs({ userId: w.user_id, name: w.display_name || w.email }); }}><Svg name="eye" size={15} />Prisijungti kaip</button> : null}
            {!self && <button className="btn" type="button" onClick={() => { close(); onMessage(w); }}><Svg name="chat" size={15} />Rašyti žinutę</button>}
            <button className="btn" type="button" onClick={() => { close(); onEdit(w); }}><Svg name="user" size={15} />Redaguoti profilį</button>
            <button className={`btn ${actSusp ? "primary" : "danger"}`} type="button" onClick={() => { close(); onSuspend(w); }}>{actSusp ? "Nuimti suspendavimą" : self ? "Suspenduoti darbuotojo režimą" : "Suspenduoti"}</button>
          </div>
          {!self && <button type="button" className="linkbtn dangerlink" onClick={() => { close(); onDelete(w); }}>Ištrinti paskyrą</button>}
        </Modal>
      )}
    </>
  );
}

/* ---------- Darbdaviai ---------- */
export function AdminEmployersList({ employers, selfId, isSuspended, busyId, onVerify, onMessage, onEdit, onSuspend, onDelete, onLoginAs }) {
  const [q, setQ] = useState(""); const [f, setF] = useState("all"); const [open, setOpen] = useState(null);
  const key = (c) => c.company_id || c.owner_id;
  const rows = employers.filter((c) => (f === "all" || (f === "unver" && !c.is_verified) || (f === "susp" && isSuspended(c))) && (!q.trim() || lc(`${c.company_name} ${c.company_code} ${c.city} ${c.display_name} ${c.email}`).includes(lc(q.trim()))));
  const status = (c) => isSuspended(c) ? <Pill tone="red">Suspenduotas</Pill> : !c.is_verified ? <Pill tone="orange">Nepatvirtinta</Pill> : <Pill tone="green">Patvirtinta</Pill>;
  const c = open && employers.find((x) => key(x) === open);
  const self = c && c.owner_id === selfId;
  const canAct = c && !self && c.account_role !== "admin";
  const close = () => setOpen(null);
  return (
    <>
      <Head title="Darbdaviai ir įmonės" lead={`${employers.length} darbdaviai`} />
      <div className="abar2"><Search value={q} onChange={setQ} placeholder="Pavadinimas, kodas, miestas" />
        <Chips value={f} onChange={setF} options={[["all", "Visi", employers.length], ["unver", "Laukia patvirtinimo", employers.filter((x) => !x.is_verified).length], ["susp", "Suspenduoti", employers.filter(isSuspended).length]]} /></div>
      <Table cls="ae" head={["Darbdavys", "Planas", "Darbų", "Patikimumas", "Būsena", ""]} rows={rows} render={(x) => (
        <div className="atr" key={key(x)}>
          <span className="acell-nm"><Av name={x.company_name} co /><span><b>{x.company_name || "Įmonė"}</b><small>{x.company_code ? `Įmonė · ${x.company_code}` : "Darbdavys"} · {x.city || "Miestas nenurodytas"}</small></span></span>
          <span data-l="Planas">{PLAN[x.plan_key] || "Basic"}</span>
          <span data-l="Darbų">{Number(x.jobs_count || 0)}</span>
          <span data-l="Patikimumas"><b>{Number(x.reliability_rate ?? 100).toFixed(0)}</b>/100</span>
          <span>{status(x)}</span>
          <span className="aacts">{!x.is_verified && x.company_id ? <button className="btn sm primary" type="button" disabled={busyId === x.company_id} onClick={() => onVerify(x)}>Patvirtinti</button> : null}<button className="btn sm" type="button" onClick={() => setOpen(key(x))}>Valdyti</button></span>
        </div>
      )} />
      {c && (
        <Modal eyebrow="Įmonė" title={c.company_name || "Įmonė"} sub={`${c.company_code ? `Įmonės kodas ${c.company_code} · ` : ""}${c.city || "Miestas nenurodytas"} · registr. ${dt(c.account_created_at)}`} onClose={close}>
          <div className="kv">
            <div><small>Savininkas</small><b>{c.display_name || "—"}</b></div>
            <div><small>Planas</small><b>{PLAN[c.plan_key] || "Basic"}</b></div>
            <div><small>El. paštas</small><b>{c.email || "—"}</b></div>
            <div><small>Telefonas</small><b>{c.phone || "—"}</b></div>
            <div><small>Darbų</small><b>{Number(c.jobs_count || 0)}</b></div>
            <div><small>Darbų šį mėn.</small><b>{Number(c.jobs_used_this_month || 0)}</b></div>
          </div>
          {isSuspended(c) ? <div className="alert"><div><b>Paskyra suspenduota</b><p>{c.suspension_reason || "Priežastis nenurodyta"} · iki {dt(c.suspended_until)}</p></div></div> : null}
          <div className="mgrid">
            {!c.is_verified && c.company_id ? <button className="btn primary" type="button" disabled={busyId === c.company_id} onClick={() => { close(); onVerify(c); }}><Svg name="check" size={15} width={2.6} />Patvirtinti įmonę</button> : null}
            {!self && onLoginAs && c.owner_id ? <button className="btn" type="button" onClick={() => { close(); onLoginAs({ userId: c.owner_id, name: c.company_name || c.email }); }}><Svg name="eye" size={15} />Prisijungti kaip</button> : null}
            {!self && <button className="btn" type="button" onClick={() => { close(); onMessage(c); }}><Svg name="chat" size={15} />Rašyti žinutę</button>}
            <button className="btn" type="button" onClick={() => { close(); onEdit(c); }}><Svg name="home" size={15} />Redaguoti įmonę</button>
            {canAct && <button className={`btn ${isSuspended(c) ? "primary" : "danger"}`} type="button" onClick={() => { close(); onSuspend(c); }}>{isSuspended(c) ? "Nuimti suspendavimą" : "Suspenduoti"}</button>}
          </div>
          {canAct && <button type="button" className="linkbtn dangerlink" onClick={() => { close(); onDelete(c); }}>Ištrinti paskyrą</button>}
        </Modal>
      )}
    </>
  );
}

/* ---------- Visi darbai ---------- */
const todayISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Vilnius" });
function jobState(j) {
  const t = todayISO(), d = String(j.work_date || "");
  if (j.status === "cancelled") return ["cancel", "Atšauktas", "red"];
  if (j.status === "completed") return ["done", "Įvykdytas", ""];
  const acc = Number(j.confirmed_workers || 0), need = Number(j.workers_needed || 0);
  if (d < t) return acc ? ["toClose", "Neuždaryta", "orange"] : ["past", "Nebeaktualus", ""];
  if (acc < need) return ["short", "Trūksta žmonių", "orange"];
  if (d === t) return ["live", "Vyksta", "green"];
  return ["full", "Surinkta", "green"];
}
export function AdminJobsList({ jobs, formatPay, onChat, onEdit, onDelete }) {
  const [q, setQ] = useState(""); const [f, setF] = useState("all");
  const t = todayISO();
  const isAct = (j) => !["cancelled", "completed"].includes(j.status) && String(j.work_date) >= t;
  const rows = jobs.filter((j) => {
    const s = jobState(j)[0];
    return (f === "all" || (f === "act" && isAct(j)) || (f === "short" && s === "short") || (f === "past" && !isAct(j))) && (!q.trim() || lc(`${j.title} ${j.company_name} ${j.city}`).includes(lc(q.trim())));
  });
  return (
    <>
      <Head title="Visi darbai" lead="Visų darbdavių darbo pasiūlymai" />
      <div className="abar2"><Search value={q} onChange={setQ} placeholder="Darbas arba darbdavys" />
        <Chips value={f} onChange={setF} options={[["all", "Visi", jobs.length], ["act", "Aktyvūs"], ["short", "Trūksta žmonių"], ["past", "Pasibaigę"]]} /></div>
      <Table cls="aj" head={["Darbas", "Data", "Žmonių", "Atlygis", "Būsena", ""]} rows={rows} render={(j) => {
        const [, label, tone] = jobState(j);
        return (
          <div className="atr" key={j.job_id}>
            <span className="acell-nm"><span><b>{up(j.title)}</b><small>{j.company_name || "Įmonė"} · {j.city || ""}</small></span></span>
            <span data-l="Data">{j.work_date} · {String(j.start_time || "").slice(0, 5)}</span>
            <span data-l="Žmonių"><b>{Number(j.confirmed_workers || 0)}</b>/{Number(j.workers_needed || 0)}</span>
            <span data-l="Atlygis">{formatPay(j.pay_amount, j.pay_unit)}</span>
            <span><Pill tone={tone}>{label}</Pill></span>
            <span className="aacts">
              <button className="btn sm" type="button" onClick={() => onChat(j)}><Svg name="chat" size={14} />Pokalbis</button>
              <button className="btn sm ghost" type="button" aria-label="Redaguoti darbą" title="Redaguoti darbą" onClick={() => onEdit(j)}><Svg name="edit" size={15} width={2.2} /></button>
              {j.status !== "cancelled" ? <button className="btn sm ghost" type="button" aria-label="Ištrinti darbą" title="Ištrinti darbą" onClick={() => onDelete(j)}><Svg name="x" size={15} width={2.2} /></button> : null}
            </span>
          </div>
        );
      }} />
    </>
  );
}

/* ---------- Įdarbinti darbuotojai ---------- */
const PL_ST = { active: ["Dirba", "green"], ended: ["Pasibaigė", ""], cancelled: ["Atšaukta", ""], declined: ["Atmesta", ""] };
export function AdminEmploymentList({ placements }) {
  const month = new Date().toISOString().slice(0, 7);
  const n = (fn) => placements.filter(fn).length;
  const pending = (p) => !["active", "ended", "cancelled", "declined"].includes(p.status);
  return (
    <>
      <Head title="Įdarbinti darbuotojai" lead="Ilgalaikiai įdarbinimai per platformą" />
      <div className="stats">
        <div className="stat"><small>Aktyviai įdarbinti</small><b>{n((p) => p.status === "active")}</b></div>
        <div className="stat"><small>Laukiantys pasiūlymai</small><b>{n(pending)}</b></div>
        <div className="stat"><small>Pasiūlymai šį mėnesį</small><b>{n((p) => String(p.created_at || "").slice(0, 7) === month)}</b></div>
        <div className="stat"><small>Pasibaigę įdarbinimai</small><b>{n((p) => p.status === "ended")}</b></div>
      </div>
      <Table cls="ap" head={["Darbuotojas", "Įmonė", "Pozicija", "Sutartis", "Būsena"]} rows={placements} empty="Įdarbinimų dar nėra." render={(p) => {
        const [label, tone] = PL_ST[p.status] || ["Laukia parašo", "orange"];
        return (
          <div className="atr" key={p.placement_id}>
            <span className="acell-nm"><Av name={p.worker_name} /><span><b>{p.worker_name || "Darbuotojas"}</b><small>{p.proposed_start_date ? `Nuo ${p.proposed_start_date}` : ""}</small></span></span>
            <span data-l="Įmonė">{p.company_name}</span>
            <span data-l="Pozicija">{p.position_title}</span>
            <span data-l="Sutartis">{p.contract_type}{p.proposed_end_date ? ` iki ${p.proposed_end_date}` : ""}</span>
            <span><Pill tone={tone}>{label}</Pill></span>
          </div>
        );
      }} />
    </>
  );
}

/* ---------- Ginčai ---------- */
const CLAIM = { worked: "Dirbau visą dieną", no_show: "Neatvyko", left_early: "Išėjo anksčiau" };
const OUTCOME = { no_show: "Neatvyko", left_early: "Išėjo anksčiau", worked: "Dirbo", completed: "Dirbo" };
const tm = (iso) => (iso ? new Date(iso).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vilnius" }) : "—");
export function AdminDisputesList({ disputes, notes, setNote, resolvingId, onResolve, onMessage, onDiscuss }) {
  const [res, setRes] = useState(null);
  const side = (who, says, arr, left, note, file) => (
    <div className="dside"><small>{who}</small><b>{says}</b>
      <dl><div><dt>Atvyko</dt><dd>{arr}</dd></div><div><dt>Išėjo</dt><dd>{left}</dd></div></dl>
      {note ? <p>„{note}“</p> : null}
      {file ? (file.url ? <a className="tag doc" href={file.url} target="_blank" rel="noopener noreferrer"><Svg name="file" size={13} />{file.name || "Atidaryti failą"}</a> : <span className="tag doc"><Svg name="file" size={13} />{file.name || "Failas įkeltas"}</span>) : null}
    </div>
  );
  const d = res && disputes.find((x) => x.attendance_id === res.id);
  return (
    <>
      <Head title="Darbo dienos ginčai" lead="Kai darbuotojo ir darbdavio duomenys apie darbo dieną nesutampa" />
      {disputes.length ? disputes.map((x) => (
        <section className="card disp" key={x.attendance_id}><header><div><span className="eyebrow">Ginčas · {ago(x.worker_responded_at || x.employer_marked_at)}</span><h2>{up(x.job_title)}</h2><p className="small muted" style={{ margin: "2px 0 0" }}>{x.worker_name} ↔ {x.company_name} · {x.work_date}</p></div><Pill tone="orange">Laukia sprendimo</Pill></header>
          <div className="dgrid">
            {side("Darbuotojo pareiškimas", CLAIM[x.worker_workday_claim] || "Nesutinka su darbdaviu", tm(x.worker_check_in_at), String(x.end_time || "").slice(0, 5) || "—", x.worker_response_note, x.worker_evidence_path ? { url: x.evidenceUrl, name: x.worker_evidence_name } : null)}
            {side("Darbdavio patvirtinimas", OUTCOME[x.employer_outcome] || x.employer_outcome || "—", tm(x.employer_check_in_at), String(x.actual_end_time || "").slice(0, 5) || "—", x.employer_note, null)}
          </div>
          <div className="row dact">
            <button className="btn sm" type="button" onClick={() => onMessage({ userId: x.worker_id, name: x.worker_name })}><Svg name="chat" size={14} />Rašyti darbuotojui</button>
            {x.employer_note?.trim() && x.worker_response_note?.trim() ? <button className="btn sm" type="button" onClick={() => onDiscuss(x)}><Svg name="chat" size={14} />Ginčo pokalbis</button> : null}
            <span className="spacer" />
            <button className="btn sm primary" type="button" disabled={resolvingId === x.attendance_id} onClick={() => setRes({ id: x.attendance_id, v: "worker" })}>Darbuotojo naudai</button>
            <button className="btn sm primary" type="button" disabled={resolvingId === x.attendance_id} onClick={() => setRes({ id: x.attendance_id, v: "employer" })}>Darbdavio naudai</button>
          </div>
        </section>
      )) : <section className="card"><Empty title="Neišspręstų ginčų nėra" sub="" icon="shield" /></section>}
      {d && (
        <Modal eyebrow="Ginčo sprendimas" title={res.v === "worker" ? "Darbuotojo naudai" : "Darbdavio naudai"} sub={`${up(d.job_title)} · ${d.worker_name} ↔ ${d.company_name}`} onClose={() => setRes(null)}>
          <label className="field">Paaiškinimas abiem pusėms<textarea value={notes[d.attendance_id] || ""} onChange={(e) => setNote(d.attendance_id, e.target.value)} placeholder={res.v === "worker" ? "Pvz. Darbuotojo nuotrauka patvirtina buvimą objekte 14:40." : "Pvz. Darbuotojas nepateikė įrodymų."} /></label>
          <p className="small muted" style={{ margin: "10px 0 0" }}>{res.v === "worker" ? "Darbo diena bus užskaityta pagal darbuotojo pareiškimą." : "Darbo diena bus užskaityta pagal darbdavio patvirtinimą."}</p>
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn" type="button" onClick={() => setRes(null)}>Atšaukti</button>
            <button className="btn primary" type="button" disabled={resolvingId === d.attendance_id || String(notes[d.attendance_id] || "").trim().length < 5} onClick={async () => { await onResolve(d, res.v); setRes(null); }}>Patvirtinti sprendimą</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------- Svetainės klaidos ---------- */
export function AdminBugsList({ reports, onReply, onResolve, onIrrelevant, onOpen }) {
  const [f, setF] = useState("active");
  const st = (r) => (r.status === "resolved" ? "fixed" : r.status === "irrelevant" ? "na" : "active");
  const P = { active: ["Aktyvi", "orange"], fixed: ["Sutvarkyta", "green"], na: ["Neaktualu", ""] };
  const rows = reports.filter((r) => f === "all" || st(r) === f);
  return (
    <>
      <Head title="Svetainės klaidos" lead="Naudotojų pranešimai per „Pranešti apie klaidą“" />
      <Chips value={f} onChange={setF} options={[["active", "Aktyvios", reports.filter((r) => st(r) === "active").length], ["fixed", "Sutvarkytos"], ["all", "Visos", reports.length]]} />
      {rows.length ? rows.map((r) => { const s = st(r); return (
        <section className="card bug" key={r.id}>
          <div className="bugrow"><div className="bugtx">
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><Pill tone={P[s][1]}>{P[s][0]}</Pill><span className="small muted">{ago(r.created_at)} {new Date(r.created_at).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" })}</span></div>
            <p style={{ whiteSpace: "pre-wrap" }}>{r.message}</p>
            <span className="small"><b>{r.reporter_name || "Vartotojas"}</b> <span className="muted">· {r.reporter_email || "El. paštas nepasiekiamas"}</span></span>
          </div></div>
          <div className="row dact">
            {r.reporter_id ? <button className="btn sm" type="button" onClick={() => onReply(r)}><Svg name="chat" size={14} />Atsakyti</button> : null}
            <span className="spacer" />
            {s === "active" ? <><button className="btn sm" type="button" onClick={() => onIrrelevant(r)}>Neaktualu</button><button className="btn sm primary" type="button" onClick={() => onResolve(r)}><Svg name="check" size={14} width={2.6} />Sutvarkyta</button></> : null}
          </div>
        </section>
      ); }) : <section className="card"><Empty title="Klaidų pranešimų nėra" sub="" icon="check" /></section>}
    </>
  );
}

/* ---------- Atsiliepimai ---------- */
export function AdminRatingsList({ ratings, busyId, onDelete }) {
  return (
    <>
      <Head title="Atsiliepimai" lead="Darbdavių atsiliepimai apie darbuotojus" />
      <section className="card">{ratings.length ? <Paged items={ratings} render={(r) => (
        <div className="revrow" key={r.rating_id}><span className="revscore">{r.score}/10</span>
          <div className="revtx"><b>{r.company_name} → {r.worker_name}</b>{r.comment?.trim() ? <p>„{r.comment}“</p> : null}<small className="muted">{up(r.job_title)} · {ago(r.created_at)}</small></div>
          <button className="btn sm" type="button" disabled={busyId === r.rating_id} onClick={() => onDelete(r)}>Pašalinti</button>
        </div>
      )} /> : <Empty title="Atsiliepimų dar nėra" sub="" icon="star" />}</section>
    </>
  );
}

/* ---------- Vadovų pokalbiai ---------- */
export function AdminTeamChatsList({ chats, onView }) {
  return (
    <>
      <Head title="Vadovų pokalbiai" lead="Įmonių vidiniai komandos pokalbiai. Matote tik skaitymo režimu." />
      <Table cls="at" head={["Įmonė", "Planas", "Narių", "Žinučių", ""]} rows={chats} empty="Pokalbių dar nėra." render={(c) => (
        <div className="atr" key={c.company_id}>
          <span className="acell-nm"><Av name={c.company_name} co /><span><b>{c.company_name}</b><small>{Number(c.message_count) ? `Paskutinė žinutė ${ago(c.last_message_at).toLocaleLowerCase("lt-LT")}` : "Pokalbis dar tuščias"}</small></span></span>
          <span data-l="Planas">{PLAN[c.plan_key] || "Basic"}</span>
          <span data-l="Narių">{Number(c.active_members || 0)}</span>
          <span data-l="Žinučių">{Number(c.message_count || 0)}</span>
          <span className="aacts">{Number(c.message_count) ? <button className="btn sm" type="button" onClick={() => onView(c)}><Svg name="eye" size={14} />Peržiūrėti</button> : null}</span>
        </div>
      )} />
    </>
  );
}

/* ---------- Failai ---------- */
const size = (b) => (b == null ? "—" : b >= 1048576 ? `${num(b / 1048576)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export function AdminFilesList({ files }) {
  const [q, setQ] = useState("");
  const rows = files.filter((x) => !q.trim() || lc(`${x.file_name} ${x.owner_name} ${x.job_title} ${x.company_name}`).includes(lc(q.trim())));
  return (
    <>
      <Head title="Įkelti failai" lead={`${files.length} failai`} />
      <div className="abar2"><Search value={q} onChange={setQ} placeholder="Failo pavadinimas arba savininkas" /></div>
      <Table cls="af" head={["Failas", "Savininkas", "Susijęs darbas", "Dydis", ""]} rows={rows} render={(x) => (
        <div className="atr" key={x.object_id}>
          <span className="acell-nm"><span className="objic"><Svg name="file" size={16} /></span><span><b>{x.file_name || "Failas"}</b><small>{x.mime_type || "Failas"} · įkelta {ago(x.uploaded_at).toLocaleLowerCase("lt-LT")}</small></span></span>
          <span data-l="Savininkas">{x.owner_name || "—"}</span>
          <span data-l="Darbas">{x.job_title ? `${up(x.job_title)}${x.company_name ? ` · ${x.company_name}` : ""}` : "—"}</span>
          <span data-l="Dydis">{size(x.size_bytes)}</span>
          <span className="aacts">{x.signedUrl ? <a className="btn sm" href={x.signedUrl} target="_blank" rel="noopener noreferrer"><Svg name="eye" size={14} />Peržiūrėti</a> : null}</span>
        </div>
      )} />
    </>
  );
}

/* ---------- Mėnesio geriausi ---------- */
const AW_LAB = { worker: { best: "Mėnesio geriausias", reliability: "Mėnesio patikimiausias", activity: "Mėnesio aktyviausias" }, company: { best: "Mėnesio geriausia", reliability: "Mėnesio patikimiausia", activity: "Mėnesio aktyviausia" } };
const MON = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
export function AdminAwardsList({ awards, metricText }) {
  const months = [...new Set(awards.map((a) => String(a.award_month).slice(0, 10)))].sort().reverse();
  const latest = months[0];
  const cur = awards.filter((a) => String(a.award_month).slice(0, 10) === latest);
  const m = latest ? new Date(`${latest}T12:00:00`) : null;
  const card = (a) => (
    <div className="awc" key={`${a.recipient_type}-${a.award_type}`}><AwardSvg type={a.award_type} size={40} />
      <div><small>{AW_LAB[a.recipient_type]?.[a.award_type] || a.award_type}</small><b>{a.recipient_name}</b><span className="muted small">{metricText(a)}</span></div></div>
  );
  const group = (t) => cur.filter((a) => a.recipient_type === t);
  return (
    <>
      <Head title="Mėnesio geriausi" lead={`${m ? `${MON[m.getMonth()]} · ` : ""}skiriama automatiškai mėnesio 1 d. pagal statistiką`} />
      {cur.length ? <>
        <section className="card"><header><div><h2>Darbuotojai</h2></div></header><div className="awgrid">{group("worker").map(card)}</div></section>
        <section className="card"><header><div><h2>Įmonės</h2></div></header><div className="awgrid">{group("company").map(card)}</div></section>
      </> : <section className="card"><Empty title="Apdovanojimų dar nėra" sub="Jie skiriami automatiškai mėnesio 1 d." icon="star" /></section>}
    </>
  );
}

/* ---------- Veiksmų istorija ---------- */
export function AdminAuditList({ items, actionLabel }) {
  return (
    <>
      <Head title="Veiksmų istorija" lead="Visi administratoriaus veiksmai" />
      <section className="card">{items.length ? <div className="loglist"><Paged items={items} render={(x) => (
        <div className="logrow" key={x.audit_id}><span className="av lt sm">AD</span>
          <div><b>{actionLabel(x.action)}</b> <span className="logobj">{x.target_email || ""}{x.reason ? ` · ${x.reason}` : ""}</span></div>
          <small>{ago(x.created_at)}</small></div>
      )} /></div> : <Empty title="Veiksmų dar nėra" sub="" icon="history" />}</section>
    </>
  );
}
