import { useState } from "react";
import { Svg } from "../Shell.jsx";
import { Paged, Pill, P24Modal, initialsOf } from "../ui.jsx";

/* Prototipo „Tarptautinė atranka“ (hire.js aHire / aHireReq / aHireNeed / aHireCand).
   Duomenys ir visi veiksmai – iš AdminDashboard (tos pačios RPC ir failų funkcijos). */

const lc = (v) => String(v || "").toLocaleLowerCase("lt-LT");
const ago = (iso) => { if (!iso) return "—"; const d = Math.round((Date.now() - new Date(iso).getTime()) / 864e5); return d <= 0 ? "Šiandien" : d === 1 ? "Vakar" : `Prieš ${d} d.`; };
const DOC_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const HR_ST = { new: ["Nauja", "orange"], under_review: ["Peržiūrima", ""], access_preparing: ["Ruošiama prieiga", ""], waiting_employer: ["Laukiama sutarties ir informacijos", "orange"], employer_submitted: ["Darbdavys pateikė", "orange"], ready_for_sourcing: ["Paruošta paieškai", "green"], sourcing: ["Vyksta paieška", "green"], declined: ["Atmesta", "red"], closed: ["Uždaryta", ""] };
const FLOW = ["new", "under_review", "access_preparing", "waiting_employer", "employer_submitted", "ready_for_sourcing", "sourcing"];
const HIRE_STEPS = [["Užklausa", "Įmonė užpildo formą statybos24.lt/hire"], ["Prieiga", "Peržiūrite ir sukuriate privatų portalą"], ["Sutartis", "Įmonė pasirašo tarpininkavimo sutartį"], ["Poreikis", "Įmonė pateikia darbuotojų poreikį, jūs pradedate paiešką"], ["Kandidatai", "Ieškote Statybos24 bazėje arba pridedate išorinį kandidatą"], ["Įdarbinimas", "Įmonė patvirtina kandidatą, įkeliate darbo sutartį ir sąskaitą"]];
const AGR = { not_prepared: ["Neparuošta", ""], waiting_signature: ["Laukiama kandidato parašo", "orange"], signed_uploaded: ["Pasirašyta įkelta", "green"], approved: ["Patvirtinta", "green"], rejected: ["Reikia pataisyti", "red"] };
const ACC = { provided: "Suteikia darbdavys", not_provided: "Nesuteikiama", employee_contributes: "Moka / prisideda darbuotojas" };
const LIC = { required: "Privalomas", advantage: "Privalumas", not_required: "Nereikalingas" };

const st = (s) => HR_ST[s] || [s || "—", ""];
const FilePick = ({ children, onFile, disabled, className = "btn sm" }) => (
  <label className={className} aria-disabled={disabled} style={{ position: "relative", overflow: "hidden", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1 }}>
    {children}
    <input type="file" accept={DOC_ACCEPT} disabled={disabled} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "inherit" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
  </label>
);
const kv = (rows, one) => <div className={`kv${one ? " one" : ""}`}>{rows.filter((r) => r[1] !== null && r[1] !== undefined && r[1] !== "").map(([k, v], i) => <div key={i} className={r2(k)}><small>{k}</small><b style={{ whiteSpace: "pre-wrap" }}>{v}</b></div>)}</div>;
function r2(k) { return /įgūdžiai|komentaras|informacija|kompetencijos|priežastis/i.test(k) ? "wide" : undefined; }

function requestFacts(r) {
  const need = r.brief_workforce_details || {};
  const roles = Array.isArray(need.roles) ? need.roles : [];
  const workers = roles.reduce((s, role) => s + Math.max(1, Number(role?.count || 0) || 0), 0);
  const title = need.needTitle || roles[0]?.profession || "";
  const hasBrief = ["submitted", "approved"].includes(r.brief_status) && !!r.brief_workforce_details;
  return { need, roles, workers, title, hasBrief, company: r.brief_company_details?.legalName || r.company_name || "Įmonė nenurodyta" };
}

export function AdminForeignHire({ requests, h }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const sel = h.expandedId ? requests.find((r) => r.request_id === h.expandedId) : null;
  if (sel) return <ForeignHireRequest r={sel} h={h} />;

  const action = (r) => (Number(r.employer_interview_requested_count || 0) + Number(r.employer_accepted_count || 0)) > 0 || r.status === "employer_submitted" || (r.signed_agreement_path && ["waiting_employer", "access_preparing"].includes(r.status)) || (["submitted"].includes(r.brief_status));
  const grp = { all: () => true, new: (r) => ["new", "under_review", "access_preparing"].includes(r.status), wait: action, src: (r) => ["ready_for_sourcing", "sourcing"].includes(r.status) };
  const rows = requests.filter((r) => grp[f](r) && (!q.trim() || lc(`${r.company_name} ${r.company_country} ${r.contact_name} ${r.business_email} ${r.brief_company_details?.legalName || ""}`).includes(lc(q.trim()))));

  return (
    <>
      <div className="head"><div><h1>Tarptautinė atranka</h1><p className="lead">Užsienio statybų įmonės ieško darbuotojų iš Lietuvos – statybos24.lt/hire</p></div>
        <div className="row" style={{ gap: 8 }}><a className="btn sm" href="/hire" target="_blank" rel="noopener noreferrer"><Svg name="eye" size={14} />Atidaryti /hire puslapį</a></div></div>
      <section className="card fh-how"><ol>{HIRE_STEPS.map(([t, p], i) => <li key={t}><span>{i + 1}</span><div><b>{t}</b><small>{p}</small></div></li>)}</ol></section>
      <div className="abar2">
        <label className="field asrch"><span className="sr">Ieškoti</span><span className="asrch-in"><Svg name="search" size={16} /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Įmonė, šalis ar kontaktas" autoComplete="off" /></span></label>
        <div className="chips" role="group">{[["all", "Visos", requests.length], ["new", "Naujos", requests.filter(grp.new).length], ["wait", "Reikia veiksmo", requests.filter(grp.wait).length], ["src", "Vyksta paieška", requests.filter(grp.src).length]].map(([k, t, n]) => <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{t} <span className="cnt">{n}</span></button>)}</div>
      </div>
      <div className="list fhl">
        {rows.length ? <Paged items={rows} render={(r) => {
          const x = requestFacts(r);
          return (
            <button type="button" className="card fh-row" key={r.request_id} onClick={() => h.open(r)}>
              <div className="fh-rl"><span className="av co sm" style={{ border: "1px solid var(--line)" }}>{initialsOf(x.company)}</span><div><b>{x.company}</b><small>{[r.company_country, r.contact_name, ago(r.created_at)].filter(Boolean).join(" · ")}</small></div></div>
              <div className="fh-rm"><span className="small muted">{x.title ? <>Poreikis: <b>{x.title}</b> · </> : null}Darbuotojų: <b>{x.workers || "—"}</b> · Kandidatų: <b>{Number(r.candidate_count || 0)}</b></span>
                {Number(r.employer_interview_requested_count || 0) > 0 ? <Pill tone="orange">Prašo interviu</Pill> : Number(r.employer_accepted_count || 0) > 0 ? <Pill tone="orange">Darbdavys patvirtino kandidatą</Pill> : null}
                <Pill tone={st(r.status)[1]}>{st(r.status)[0]}</Pill></div>
            </button>
          );
        }} /> : <section className="card"><p className="small muted" style={{ margin: 0 }}>{requests.length ? "Pagal paiešką nieko nerasta." : "Tarptautinių užklausų dar nėra."}</p></section>}
      </div>
    </>
  );
}

function ForeignHireRequest({ r, h }) {
  const x = requestFacts(r);
  const busy = h.savingId === r.request_id;
  const candidates = h.candidatesByRequest[r.request_id] || [];
  const hired = candidates.filter((c) => ["hired", "started"].includes(c.status)).length;
  const completed = r.status === "closed" || (x.workers > 0 && hired >= x.workers);
  const ended = ["declined", "closed"].includes(r.status);
  const ci = FLOW.indexOf(r.status);
  const [needOpen, setNeedOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const credentials = h.credentials?.requestId === r.request_id ? h.credentials : null;
  const credentialsText = credentials ? h.credentialsText(r, credentials) : "";
  const mailHref = `mailto:${r.business_email}?subject=${encodeURIComponent(`Statybos24 employer portal · ${r.company_name}`)}&body=${encodeURIComponent(credentialsText || `Hello ${r.contact_name || ""},\n\nRegarding your Statybos24 workforce request.\n\nIf anything is unclear, please reply to this email.`)}`;
  const invoice = h.invoices[r.request_id];
  const invoiceFb = h.invoiceFeedback[r.request_id];
  const pendingInterview = candidates.filter((c) => c.employer_response === "interview_requested" && !c.employer_contact_shared_at).length;
  const pendingAccepted = candidates.filter((c) => c.employer_response === "accepted" && !["hired", "started", "rejected", "withdrawn"].includes(c.status)).length;

  let next = null;
  if (!ended) {
    if (r.status === "new") next = <button className="btn primary" type="button" disabled={busy} onClick={() => h.setStatus(r, "under_review")}>Pradėti peržiūrą</button>;
    else if (!r.employer_account_id) next = <button className="btn primary" type="button" disabled={busy} onClick={() => h.openSetup(r)}>Sukurti prieigą įmonei</button>;
    else if (!r.agreement_path) next = <button className="btn primary" type="button" disabled={h.setupBusy} onClick={() => h.openSetup(r)}><Svg name="upload" size={15} />Įkelti tarpininkavimo sutartį</button>;
    else if (x.hasBrief && r.brief_status !== "approved") next = <button className="btn primary" type="button" disabled={busy || !r.signed_agreement_path} title={!r.signed_agreement_path ? "Pirmiausia turi būti įkelta pasirašyta tarpininkavimo sutartis" : undefined} onClick={() => h.lock(r)}>{busy ? "Pradedama..." : "Patvirtinti poreikį ir pradėti paiešką"}</button>;
  }
  const waitText = !ended && r.employer_account_id && r.agreement_path && !x.hasBrief ? (r.signed_agreement_path ? "Laukiama, kol įmonė pateiks darbuotojų poreikį portale." : "Laukiama, kol įmonė pasirašys sutartį ir pateiks poreikį.") : x.hasBrief && r.brief_status !== "approved" && !r.signed_agreement_path ? "Paieškai pradėti būtina pasirašyta tarpininkavimo sutartis." : "";

  const agrPill = !r.agreement_path ? ["Neparuošta", ""] : r.signed_agreement_path ? ["Pasirašyta įkelta", "green"] : ["Išsiųsta – laukiama parašo", "orange"];

  return (
    <>
      <button type="button" className="linkbtn" onClick={h.back}>← Tarptautinė atranka</button>
      <div className="head"><div><h1>{x.company}</h1><p className="lead">{[r.company_country, `užklausa gauta ${ago(r.created_at).toLowerCase()}`, `#${String(r.request_id || "").slice(0, 8).toUpperCase()}`].filter(Boolean).join(" · ")}</p></div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><Pill tone={completed && !ended ? "green" : st(r.status)[1]}>{completed && r.status !== "closed" ? "Darbuotojai surinkti" : st(r.status)[0]}</Pill></div></div>

      {pendingInterview > 0 ? <div className="alert"><div><b>Darbdavys paprašė interviu</b><span>{pendingInterview} {pendingInterview === 1 ? "kandidatui reikia suderinti interviu" : "kandidatams reikia suderinti interviu"}. Perduokite kandidato el. paštą žemiau.</span></div></div>
        : pendingAccepted > 0 ? <div className="alert"><div><b>Darbdavys patvirtino kandidatą</b><span>Įkelkite pasirašytą darbo sutartį ir pažymėkite įdarbinimą.</span></div></div> : null}
      {completed && !ended ? <div className="notebox">Visi reikalingi darbuotojai įdarbinti. Susisiekite su darbdaviu ir įkelkite sąskaitą.</div> : null}

      <div className="jd-grid"><div className="jd-main">
        <section className="card"><header><div><h2>Būsena</h2></div></header>
          <div className="fh-steps">{FLOW.map((k, i) => <span key={k} className={`${ci >= 0 && i <= ci ? "on" : ""}${r.status === k ? " cur" : ""}`}>{HR_ST[k][0]}</span>)}</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {next}{waitText ? <span className="small muted">{waitText}</span> : null}
            {!ended ? <>
              <button className="btn" type="button" disabled={busy} onClick={() => h.setStatus(r, "closed")}>Uždaryti</button>
              <button className="btn danger" type="button" disabled={busy} onClick={() => h.setStatus(r, "declined")}>Atmesti</button>
            </> : <button className="btn" type="button" disabled={busy} onClick={() => h.setStatus(r, "under_review")}>Atnaujinti</button>}
          </div>
        </section>

        <section className="card"><header><div><h2>Darbuotojų poreikis · {x.hasBrief ? 1 : 0}</h2></div></header>
          {x.hasBrief ? (
            <div className={`fh-need${needOpen ? " open" : ""}`}>
              <button type="button" className="fh-nh" onClick={() => setNeedOpen((v) => !v)}>
                <div><b>{x.title || "Poreikis"}</b><small>{[x.roles.map((role) => role?.profession).filter(Boolean).join(", "), `${x.workers || "—"} darb.`, x.need.projectLocation, x.need.startDate ? `pradžia ${x.need.startDate}` : "", x.need.salaryAmount || x.need.salaryMin ? `${x.need.salaryAmount || x.need.salaryMin} ${x.need.salaryCurrency || ""} ${x.need.salaryBasis === "net" ? "neto" : x.need.salaryBasis === "gross" ? "bruto" : ""}`.trim() : ""].filter(Boolean).join(" · ")}</small></div>
                <span className="row" style={{ gap: 8 }}><span className="small muted">Įdarbinta {hired}/{x.workers || "—"} · Kandidatų {candidates.length || Number(r.candidate_count || 0)}</span><Pill tone={r.brief_status === "approved" ? "green" : "orange"}>{r.brief_status === "approved" ? "Patvirtinta" : "Naujas"}</Pill></span>
              </button>
              {needOpen ? <div className="fh-nb">
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn sm" type="button" onClick={() => setInfoOpen((v) => !v)}>{infoOpen ? "Slėpti sąlygas" : "Visos sąlygos"}</button>
                  {r.employmentContractUrl ? <a className="btn sm" href={r.employmentContractUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />{r.employment_contract_name || "Darbo sutartis susipažinimui"}</a> : null}</div>
                {infoOpen ? <div className="fh-info">
                  <h3 className="hp-sub">Darbas ir projektas</h3>
                  {kv([["Šalis", x.need.projectCountry], ["Adresas", x.need.projectLocation], ["Darbo pradžia", x.need.startDate], ["Darbuotojus turėti iki", x.need.neededBy]])}
                  {x.roles.map((role, i) => <div key={i}><h3 className="hp-sub">{x.roles.length > 1 ? `Profesija ${i + 1}` : "Reikalinga profesija"}</h3>
                    {kv([["Profesija / specialybė", role.profession], ["Darbuotojų skaičius", `${Number(role.count || 1)} žm.`], ["Minimali patirtis", role.experience], ["Kalba / lygis", role.language], ["Vairuotojo pažymėjimas", LIC[role.drivingLicense] || role.drivingLicense], ["Reikalingi įgūdžiai / darbai", role.skills]])}</div>)}
                  <h3 className="hp-sub">Darbo sąlygos</h3>
                  {kv([["Įdarbinimas", x.need.employmentType], ["Sutarties trukmė", x.need.duration], ["Valandų per savaitę", x.need.weeklyHours], ["Viršvalandžiai", x.need.overtimeAllowed === "yes" ? `Taip${x.need.overtimePay ? ` · ${x.need.overtimePay}` : ""}` : x.need.overtimeAllowed === "no" ? "Ne" : x.need.overtime], ["Atlyginimas", `${x.need.salaryAmount || x.need.salaryMin || "—"} ${x.need.salaryCurrency || ""} · ${x.need.salaryBasis === "net" ? "Neto" : "Bruto"}`], ["Mokėjimo dažnumas", x.need.salaryPayFrequency]])}
                  <h3 className="hp-sub">Apgyvendinimas, kelionės ir atostogos</h3>
                  {kv([["Apgyvendinimas", ACC[x.need.accommodation] || x.need.accommodation], ["Kambarys", x.need.roomType], ["Būsto kaina", x.need.accommodationCost], ["Kelionės namo", x.need.homeTravelPaid === "yes" ? "Apmoka darbdavys" : x.need.homeTravelPaid === "no" ? "Darbdavys neapmoka" : x.need.homeTravel], ["Atostogos", x.need.vacationTerms], ["Atostogų apmokėjimas", x.need.vacationPay], ["Papildoma informacija", x.need.additionalInfo]])}
                </div> : null}
                <div className="fh-ch"><b>Kandidatai</b>
                  {r.brief_status === "approved" || ["sourcing", "ready_for_sourcing"].includes(r.status)
                    ? <button className="btn sm" type="button" disabled={completed} title={completed ? "Visi reikalingi darbuotojai įdarbinti. Paieška uždaryta." : undefined} onClick={() => h.openAdd(r)}><Svg name="plus" size={14} width={2.4} />{completed ? "Darbuotojai surinkti" : "Pridėti kandidatą"}</button>
                    : <span className="small muted">Kandidatus galėsite pridėti pradėjus paiešką.</span>}</div>
                {h.loadingId === r.request_id ? <p className="small muted" style={{ margin: 0 }}>Kraunami kandidatai...</p>
                  : candidates.length ? <div className="fh-cands">{candidates.map((c) => <ForeignHireCandidate key={c.candidate_id} r={r} c={c} h={h} />)}</div> : null}
              </div> : null}
            </div>
          ) : <p className="small muted" style={{ margin: 0 }}>{r.employer_account_id ? "Įmonė dar nepateikė poreikio portale." : "Poreikį įmonė pateiks portale, kai suteiksite prieigą."}</p>}
        </section>
      </div>

      <aside className="jd-side">
        <section className="card"><h2>Kontaktas</h2>
          {kv([["Kontaktinis asmuo", [r.brief_company_details?.contactName || r.contact_name, r.brief_company_details?.jobTitle || r.contact_job_title].filter(Boolean).join(" · ")], ["El. paštas", <a key="m" href={`mailto:${r.brief_company_details?.businessEmail || r.business_email}`}>{r.brief_company_details?.businessEmail || r.business_email || "—"}</a>], ["Telefonas", r.phone || "—"], ["Portalo prieiga", r.employer_account_id ? (r.employer_login_id || "Sukurta") : "Nesukurta"]], true)}
          <a className="btn sm" href={mailHref}><Svg name="mail" size={14} />Rašyti el. paštu</a>
        </section>
        <section className="card"><h2>Tarpininkavimo sutartis</h2>
          <div><Pill tone={agrPill[1]}>{agrPill[0]}</Pill></div>
          {credentials ? <div className="notebox" style={{ display: "grid", gap: 8 }}><b>Nauji laikini prisijungimo duomenys – nukopijuokite prieš perkraunant puslapį.</b><code style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{credentialsText}</code>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn sm" type="button" onClick={() => h.copy(credentialsText, "Prisijungimo duomenys nukopijuoti.")}>Kopijuoti prisijungimus</button><a className="btn sm" href={mailHref}>Atidaryti el. laišką</a></div></div> : null}
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {r.employer_account_id && !r.agreement_path ? <button className="btn sm" type="button" disabled={h.setupBusy} onClick={() => h.openSetup(r)}><Svg name="upload" size={14} />Įkelti sutartį įmonei</button> : null}
            {r.agreementUrl ? <a className="btn sm" href={r.agreementUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />Peržiūrėti</a> : null}
            {r.signedAgreementUrl ? <a className="btn sm" href={r.signedAgreementUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />Pasirašyta sutartis</a> : null}
          </div>
        </section>
        <section className="card"><h2>Sąskaitos</h2>
          {invoice ? <div className="list"><div className="fh-inv"><div><b>{invoice.file_name || "Sąskaita"}</b></div><button className="btn sm" type="button" onClick={() => h.viewInvoice(invoice)}>Peržiūrėti</button></div></div> : <p className="small muted" style={{ margin: 0 }}>{completed ? "Sąskaitos dar nėra." : "Sąskaitą įkelsite, kai visi darbuotojai bus įdarbinti."}</p>}
          {completed ? <FilePick disabled={!!h.invoiceBusyId} onFile={(file) => h.uploadInvoice(r, file)}><Svg name="plus" size={14} width={2.4} />{h.invoiceBusyId === r.request_id ? "Įkeliama..." : invoice ? "Pakeisti sąskaitą" : "Įkelti sąskaitą"}</FilePick> : null}
          {invoiceFb ? <p className="small" role="status" style={{ margin: 0, color: invoiceFb.kind === "success" ? "var(--green)" : invoiceFb.kind === "progress" ? "var(--muted)" : "var(--red)" }}>{invoiceFb.message}</p> : null}
        </section>
        <button type="button" className="linkbtn dangerlink" disabled={busy} onClick={() => h.remove(r)}>Ištrinti užklausą ir visus jos duomenis</button>
      </aside></div>

      {h.setupRequest?.request_id === r.request_id ? (
        <P24Modal eyebrow="Tarptautinė atranka" title={r.employer_account_id ? "Įkelti tarpininkavimo sutartį" : "Sukurti darbdavio prieigą"} sub={r.employer_account_id ? "Įkelta sutartis iš karto atsiras darbdavio portale. Darbdavys galės ją perskaityti, pasirašyti ir įkelti pasirašytą kopiją." : "Sukurkite privatų Company ID ir laikiną slaptažodį. Pirmą kartą prisijungęs darbdavys turės susikurti savo slaptažodį."} busy={h.setupBusy} onClose={h.closeSetup}>
          {!r.employer_account_id ? <div className="form">
            <label className="field">Company ID<input value={h.setupLogin} onChange={(e) => h.setSetupLogin(`ID-${e.target.value.replace(/\D/g, "").slice(0, 6)}`)} inputMode="numeric" autoComplete="off" /></label>
            <label className="field">Laikinas slaptažodis<input value={h.setupPassword} onChange={(e) => h.setSetupPassword(e.target.value.slice(0, 128))} autoComplete="off" /></label>
            <div className="row wide" style={{ gap: 8 }}><button className="btn sm" type="button" disabled={h.setupBusy} onClick={h.newLogin}>Sugeneruoti naują ID</button><button className="btn sm" type="button" disabled={h.setupBusy} onClick={h.newPassword}>Naujas slaptažodis</button></div>
          </div> : <div className="field"><span>Tarpininkavimo sutartis *</span><FilePick className="btn" disabled={h.setupBusy} onFile={h.setAgreementFile}><Svg name="file" size={16} />{h.agreementFile?.name || "Pasirinkti sutartį"}</FilePick><span className="hint">PDF arba DOCX · iki 15 MB</span></div>}
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" type="button" disabled={h.setupBusy} onClick={h.closeSetup}>Atšaukti</button>
            <button className="btn primary" type="button" disabled={h.setupBusy || (r.employer_account_id && !h.agreementFile)} onClick={r.employer_account_id ? h.replaceAgreement : h.createAccess}>{h.setupBusy ? "Saugoma..." : r.employer_account_id ? "Įkelti sutartį" : "Sukurti prieigą"}</button></div>
        </P24Modal>
      ) : null}

      {h.externalRequestId === r.request_id ? <AddCandidateModal r={r} h={h} /> : null}
    </>
  );
}

function ForeignHireCandidate({ r, c, h }) {
  const nx = h.candidateNext(c.status);
  const busy = h.candidateBusyId === c.candidate_id;
  const endedC = ["rejected", "withdrawn"].includes(c.status);
  const signedAgr = !!c.candidate_signed_agreement_path && ["signed_uploaded", "approved"].includes(c.candidate_agreement_status);
  const needsSignedAgreement = ["presented", "interview", "offer", "hired", "started"].includes(nx?.[0]) && !["signed_uploaded", "approved"].includes(c.candidate_agreement_status);
  const needsEmployerAcceptance = ["hired", "started"].includes(nx?.[0]) && c.employer_response !== "accepted";
  const needsEmploymentAgreement = ["hired", "started"].includes(nx?.[0]) && !c.job_confirmation?.signedEmploymentAgreementPath;
  const needsJobConfirmation = ["hired", "started"].includes(nx?.[0]) && !c.candidate_job_confirmed_at;
  const block = needsEmployerAcceptance ? "Pirmiausia darbdavys turi patvirtinti kandidatą." : needsSignedAgreement ? "Pirmiausia įkelkite pasirašytą kandidato tarpininkavimo sutartį." : needsEmploymentAgreement ? "Pirmiausia įkelkite darbdavio ir darbuotojo pasirašytą darbo sutartį." : needsJobConfirmation ? "Palaukite, kol bus užfiksuotas darbo sutarties patvirtinimas." : "";
  const canHire = c.employer_response === "accepted" && !["hired", "started", "rejected", "withdrawn"].includes(c.status);
  const hireBlock = !c.job_confirmation?.signedEmploymentAgreementPath ? "Pirmiausia įkelkite darbdavio ir darbuotojo pasirašytą darbo sutartį." : !signedAgr ? "Pirmiausia įkelkite pasirašytą kandidato tarpininkavimo sutartį." : !c.candidate_job_confirmed_at ? "Palaukite, kol bus užfiksuotas darbo sutarties patvirtinimas." : "";
  const open = !!h.expandedCandidates[c.candidate_id];
  const agr = AGR[c.candidate_agreement_status] || [c.candidate_agreement_status || "Neparuošta", ""];
  const idx = ["hired", "started"].includes(c.status);

  return (
    <div className="fh-cand">
      <div className="fh-cl"><span className="av lt sm">{initialsOf(c.full_name || "?")}</span><div><b>{c.full_name || "Kandidatas"}</b><small>{[c.profession, c.source_type === "platform" ? "Statybos24 bazė" : c.source_detail || "Išorinis kandidatas", c.language_details].filter(Boolean).join(" · ")}</small></div>
        <button type="button" className="btn sm ghost" style={{ marginLeft: "auto" }} aria-expanded={open} onClick={() => h.toggleCandidate(c.candidate_id)}>{open ? "Slėpti" : "Plačiau"}</button></div>
      <div className="fh-cst"><Pill tone={endedC ? "red" : idx ? "green" : ""}>{h.candidateStatusLabel(c.status)}</Pill><Pill tone={agr[1]}>Sutartis: {agr[0]}</Pill><Pill tone={c.employer_response === "not_suitable" ? "red" : c.employer_response ? "green" : ""}>Darbdavys: {h.responseLabel(c.employer_response)}</Pill></div>
      {c.employer_response === "not_suitable" && c.employer_rejection_reason ? <p className="small muted" style={{ margin: 0 }}>Atmetimo priežastis: {c.employer_rejection_reason}</p> : null}

      {open ? <>
        {kv([["Amžius", c.age_years ?? ""], ["Patirtis", c.years_experience == null ? "" : `${Number(c.years_experience)} m.`], ["Galimas nuo", c.available_from], ["B kategorija", c.has_driving_license_b === true ? "Taip" : c.has_driving_license_b === false ? "Ne" : ""], ["Reikalingas būstas", c.needs_accommodation === true ? "Taip" : c.needs_accommodation === false ? "Ne" : ""], ["Telefonas", c.phone], ["El. paštas", c.email], ["Galutinės sąlygos", c.candidate_job_confirmed_at ? "Kandidatas sutiko" : c.job_confirmation?.signedEmploymentAgreementPath ? "Darbo sutartis įkelta" : "Sutartis neįkelta"], ["Kandidato patirtis / kompetencijos", c.skills], ["Mano komentaras", c.recruiter_note]])}
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {c.cvUrl ? <a className="btn sm" href={c.cvUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />CV · {c.cv_name || "Atidaryti"}</a> : null}
          <FilePick disabled={busy} onFile={(file) => h.uploadCandidateDoc(c, "cv", file)}><Svg name="upload" size={14} />{c.cv_path ? "Pakeisti CV" : "Įkelti CV"}</FilePick>
          {c.candidate_signed_agreement_path ? (c.candidateSignedAgreementUrl ? <a className="btn sm" href={c.candidateSignedAgreementUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />Tarpininkavimo sutartis · {c.candidate_signed_agreement_name || "Peržiūrėti"}</a> : <span className="small">✓ Tarpininkavimo sutartis įkelta</span>) : null}
          <FilePick disabled={busy} onFile={(file) => h.uploadCandidateDoc(c, "signed_agreement", file)}><Svg name="upload" size={14} />{c.candidate_signed_agreement_path ? "Pakeisti tarpininkavimo sutartį" : "Įkelti tarpininkavimo sutartį"}</FilePick>
        </div>
        {c.employer_contact_shared_at ? <div className="hp-ok"><Svg name="check" size={15} width={2.6} />Kandidato el. paštas perduotas darbdaviui {new Date(c.employer_contact_shared_at).toLocaleDateString("lt-LT")}. Telefono numeris neperduodamas.</div> : null}
        <div className="hp-dec"><b>DARBDAVIO IR DARBUOTOJO PASIRAŠYTA DARBO SUTARTIS</b>
          <p className="small muted" style={{ margin: 0 }}>Įkelkite abiejų šalių pasirašytą darbo sutartį (PDF arba DOCX, iki 15 MB). Tai ne Statybos24 tarpininkavimo sutartis.</p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {c.signedEmploymentAgreementUrl ? <a className="btn sm" href={c.signedEmploymentAgreementUrl} target="_blank" rel="noreferrer"><Svg name="file" size={14} />{c.job_confirmation?.signedEmploymentAgreementName || "Darbo sutartis"}</a> : null}
            <FilePick disabled={busy || c.employer_response !== "accepted"} onFile={(file) => h.uploadEmployment(r, c, file)}><Svg name="upload" size={14} />{busy ? "Įkeliama..." : c.signedEmploymentAgreementUrl ? "Pakeisti darbo sutartį" : "Įkelti darbo sutartį"}</FilePick>
          </div>
          {c.employer_response !== "accepted" ? <span className="small muted">Įkelti galima, kai darbdavys patvirtina kandidatą.</span> : null}
        </div>
      </> : null}

      {!endedC ? <div className="fh-cact">
        {canHire ? <button className="btn sm primary" type="button" disabled={busy || !!hireBlock} title={hireBlock || undefined} onClick={() => h.setCandidateStatus(c, "hired")}>{busy ? "Saugoma..." : "→ Įdarbinti"}</button>
          : nx ? <button className="btn sm primary" type="button" disabled={busy || !!block} title={block || undefined} onClick={() => h.setCandidateStatus(c, nx[0])}>{busy ? "Saugoma..." : `→ ${nx[1]}`}</button> : null}
        {!c.employer_contact_shared_at && (c.employer_response === "interview_requested" || c.employer_response === "accepted") ? <button className="btn sm" type="button" disabled={busy || !c.email} onClick={() => h.shareEmail(c)}>{c.email ? "Perduoti el. paštą" : "El. paštas nenurodytas"}</button> : null}
        {c.status !== "started" ? <button className="btn sm" type="button" disabled={busy} onClick={() => h.setCandidateStatus(c, "rejected")}>{c.employer_response === "not_suitable" ? "Pažymėti atmestu" : "Atmesti"}</button> : null}
        <button className="btn sm ghost" type="button" disabled={busy} onClick={() => h.deleteCandidate(c)}>Ištrinti</button>
      </div> : <div className="fh-cact"><button className="btn sm ghost" type="button" disabled={busy} onClick={() => h.deleteCandidate(c)}>Ištrinti</button></div>}
      {!endedC && !canHire && nx && block ? <p className="small muted" style={{ margin: 0 }}>{block}</p> : null}
      {canHire && hireBlock ? <p className="small muted" style={{ margin: 0 }}>{hireBlock}</p> : null}
    </div>
  );
}

function AddCandidateModal({ r, h }) {
  const [src, setSrc] = useState("base");
  const ef = h.externalForm;
  const set = (k) => (e) => h.setExternalForm((cur) => ({ ...cur, [k]: e.target.value }));
  const used = new Set((h.candidatesByRequest[r.request_id] || []).map((c) => c.worker_id).filter(Boolean));
  const busyExt = h.candidateBusyId === "external";
  const langs = ef.languageDetails.split("\n");
  return (
    <P24Modal wide eyebrow="Kandidatas" title={`Pridėti kandidatą · ${requestFacts(r).title || r.company_name}`} onClose={h.closeAdd} busy={busyExt}>
      <div className="seg" role="group"><button type="button" aria-pressed={src === "base"} onClick={() => setSrc("base")}>Statybos24 bazė</button><button type="button" aria-pressed={src === "ext"} onClick={() => setSrc("ext")}>Išorinis kandidatas</button></div>
      {src === "base" ? <>
        <div className="form">
          <label className="field">Profesija, kuriai priskiriate *<input value={h.candidateProfession} onChange={(e) => h.setCandidateProfession(e.target.value)} /></label>
          <label className="field">Paieška bazėje<span className="row" style={{ gap: 8 }}><input value={h.workerQuery} onChange={(e) => h.setWorkerQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); h.searchWorkers(); } }} placeholder="Vardas, miestas ar įgūdis" style={{ flex: 1 }} /><button className="btn" type="button" disabled={h.workerSearchBusy} onClick={h.searchWorkers}><Svg name="search" size={15} />{h.workerSearchBusy ? "Ieškoma..." : "Ieškoti"}</button></span></label>
        </div>
        <div className="list">{h.workerResults.length ? h.workerResults.map((w) => (
          <div className="co-line fh-pick" key={w.user_id}><div className="av lt sm">{initialsOf(w.display_name || "?")}</div><div><b>{w.display_name || "Darbuotojas"}</b><small>{[w.city, w.attendance_rate != null ? `patikimumas ${Math.round(Number(w.attendance_rate))}/100` : "", w.rating_count ? `${Number(w.rating_average).toFixed(1).replace(".", ",")}/10` : "", w.years_experience != null ? `${Number(w.years_experience)} m. patirtis` : ""].filter(Boolean).join(" · ")}</small></div>
            {used.has(w.user_id) ? <Pill tone="green">Pridėtas</Pill> : <button className="btn sm" type="button" disabled={h.candidateBusyId === w.user_id} onClick={() => h.addPlatform(w)}>{h.candidateBusyId === w.user_id ? "Pridedama..." : "Pridėti"}</button>}</div>
        )) : <p className="small muted" style={{ margin: 0 }}>Įveskite paiešką ir spauskite „Ieškoti“.</p>}</div>
      </> : <>
        <div className="form">
          <label className="field">Vardas, pavardė *<input value={ef.fullName} onChange={set("fullName")} /></label>
          <label className="field">Profesija *<input value={ef.profession} onChange={set("profession")} /></label>
          <label className="field">Amžius<input inputMode="numeric" value={ef.ageYears} onChange={(e) => h.setExternalForm((cur) => ({ ...cur, ageYears: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))} placeholder="Pvz. 34" /></label>
          <label className="field">Patirtis, metai<input inputMode="decimal" value={ef.yearsExperience} onChange={(e) => h.setExternalForm((cur) => ({ ...cur, yearsExperience: e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".").slice(0, 4) }))} /></label>
          <label className="field">El. paštas<input value={ef.email} onChange={set("email")} /></label>
          <label className="field">Telefonas<input value={ef.phone} onChange={set("phone")} /></label>
          <label className="field">Galimas nuo<input type="date" value={ef.availableFrom} onChange={set("availableFrom")} /></label>
          <label className="field">Šaltinis (nebūtina)<input value={ef.sourceDetail} onChange={set("sourceDetail")} placeholder="Facebook grupė / rekomendacija..." /></label>
          <label className="field wide">Kandidato patirtis / kompetencijos<input value={ef.skills} onChange={set("skills")} placeholder="Pvz. 6 m. gipso montavimas, metalinis karkasas, lubos" /></label>
          <div className="field wide"><span>Kalbos ir lygiai</span>
            {langs.map((lang, i) => <span className="row" key={i} style={{ gap: 8 }}><input style={{ flex: 1, minWidth: 0 }} value={lang} placeholder={i === 0 ? "Pvz. English B1" : "Kita kalba ir jos lygis"} onChange={(e) => h.setExternalForm((cur) => { const l = cur.languageDetails.split("\n"); l[i] = e.target.value.replace(/[\r\n]/g, " "); return { ...cur, languageDetails: l.join("\n") }; })} />
              {langs.length > 1 ? <button type="button" className="btn sm ghost" aria-label="Pašalinti kalbą" onClick={() => h.setExternalForm((cur) => ({ ...cur, languageDetails: cur.languageDetails.split("\n").filter((_, j) => j !== i).join("\n") }))}><Svg name="x" size={14} /></button> : null}</span>)}
            <button type="button" className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => h.setExternalForm((cur) => ({ ...cur, languageDetails: `${cur.languageDetails}\n` }))}><Svg name="plus" size={14} width={2.4} />Pridėti kalbą</button></div>
          <div className="field"><span>Vairuotojo pažymėjimas</span><div className="seg" role="group"><button type="button" aria-pressed={!!ef.hasDrivingLicenseB} onClick={() => h.setExternalForm((cur) => ({ ...cur, hasDrivingLicenseB: true }))}>Taip (B kategorija)</button><button type="button" aria-pressed={!ef.hasDrivingLicenseB} onClick={() => h.setExternalForm((cur) => ({ ...cur, hasDrivingLicenseB: false }))}>Ne</button></div></div>
          <div className="field"><span>Ar reikalingas būstas?</span><div className="seg" role="group"><button type="button" aria-pressed={ef.needsAccommodation === true} onClick={() => h.setExternalForm((cur) => ({ ...cur, needsAccommodation: true }))}>Taip</button><button type="button" aria-pressed={ef.needsAccommodation === false} onClick={() => h.setExternalForm((cur) => ({ ...cur, needsAccommodation: false }))}>Ne</button></div></div>
          <label className="field wide">Mano komentaras<textarea value={ef.recruiterNote} onChange={set("recruiterNote")} placeholder="Trumpas mano komentaras apie kandidatą, pokalbį ar tinkamumą šiai užklausai..." /></label>
          <div className="field"><span>Pilnas kandidato CV</span><FilePick className="btn" onFile={h.setExternalCv}><Svg name="file" size={16} />{h.externalCv?.name || "Pasirinkti CV"}</FilePick><span className="hint">PDF arba DOCX · iki 15 MB · darbdavys galės atidaryti</span></div>
          <div className="field"><span>Kandidato ir Statybos24 tarpininkavimo sutartis</span><FilePick className="btn" onFile={h.setExternalAgreement}><Svg name="file" size={16} />{h.externalAgreement?.name || "Pasirinkti sutartį"}</FilePick><span className="hint">Privatus dokumentas · darbdaviui nerodomas</span></div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" type="button" disabled={busyExt} onClick={h.closeAdd}>Atšaukti</button><button className="btn primary" type="button" disabled={busyExt} onClick={h.saveExternal}>{busyExt ? "Saugoma..." : "Pridėti kandidatą"}</button></div>
      </>}
    </P24Modal>
  );
}
