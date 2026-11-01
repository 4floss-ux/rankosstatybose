import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/config.js";
import { workerAvatarUrl } from "../../ui/avatars.jsx";
import { Svg } from "../Shell.jsx";
import { Empty, Pill, initialsOf, up } from "../ui.jsx";
import { salKind, salTxt } from "../worker/WorkerAds.jsx";

/* Darbo skelbimai įmonei (prototipo eAds / eAd / eAdNewPage / interview / adExt). */

const AD_CITIES = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Utena"];
const CONTRACTS = ["Neterminuota darbo sutartis", "Terminuota sutartis", "Individuali veikla"];
const IV_HOW = { live: "Gyvai", phone: "Telefonu" };
const FEE = "9,99 €";
const chevron = '<path d="m9 18 6-6-6-6"/>';
const daysLeft = (iso) => (iso ? Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 864e5)) : 0);
const daysAgo = (iso) => Math.max(1, Math.floor((Date.now() - new Date(iso)) / 864e5));
const ivShort = (iso) => new Date(iso).toLocaleString("lt-LT", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
const lines = (t) => String(t || "").split("\n").map((x) => x.trim()).filter(Boolean);
const timeOpts = (() => { const o = []; for (let h = 6; h < 22; h += 1) for (const m of ["00", "30"]) o.push(`${String(h).padStart(2, "0")}:${m}`); return o; })();

function Heart({ size, on }) {
  return <Svg size={size} paths={`<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"${on ? ' fill="currentColor"' : ""}/>`} />;
}
function Av({ w, cls = "" }) {
  const url = w.avatar_path ? workerAvatarUrl(w.avatar_path) : "";
  return <div className={`av lt ${cls}`} style={{ overflow: "hidden" }}>{url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(w.name || "D")}</div>;
}
function Modal({ title, eyebrow, sub, onClose, children }) {
  return (
    <div className="rs-modal-overlay p24-ov" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rs-modal-card p24-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mhead"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{sub}</div>
          <button type="button" className="iconb" onClick={onClose} aria-label="Uždaryti"><Svg name="x" size={16} width={2.2} /></button></div>
        {children}
      </div>
    </div>
  );
}
function statusPill(a) {
  if (a.status === "pending_payment") return <Pill tone="orange">{a.payment_pending ? "Laukia apmokėjimo" : "Neapmokėtas"}</Pill>;
  if (a.status === "closed") return <Pill>Uždarytas</Pill>;
  if (!a.live) return <Pill>Nebegalioja</Pill>;
  return <Pill tone="green">Aktyvus · liko {daysLeft(a.expires_at)} d.</Pill>;
}

async function startPayment(adId) {
  const { data, error } = await supabase.functions.invoke("job-ad-checkout", { body: { action: "create", adId } });
  if (error) throw new Error(data?.error || "Nepavyko pradėti apmokėjimo.");
  if (data?.error) throw new Error(data.error);
  if (data?.paid) return { paid: true };
  if (!data?.url) throw new Error("Stripe negrąžino apmokėjimo nuorodos.");
  window.location.assign(data.url);
  return { redirect: true };
}
export async function confirmAdPayment(adId, sessionId) {
  const { data, error } = await supabase.functions.invoke("job-ad-checkout", { body: { action: "confirm", adId, sessionId } });
  if (error || data?.error) return false;
  return Boolean(data?.paid);
}

/* ---------- Sąrašas ---------- */
function AdsList({ ads, loaded, error, onOpen, onNew, onPay, busyPay }) {
  return (
    <>
      <div className="head"><div><h1>Darbo skelbimai</h1><p className="lead">Nuolatiniai darbuotojai su patikrinta darbo istorija.</p></div>
        <button className="btn primary" type="button" onClick={onNew}><Svg name="plus" size={16} width={2.4} />Naujas skelbimas</button></div>
      <section className="card">
        {!loaded ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>
          : error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p>
          : ads.length ? (
            <div className="list">{ads.map((a) => {
              const nw = Number(a.new_candidates || 0);
              return (
                <article key={a.id} className="job" tabIndex={0} role="link" aria-label={up(a.title)} onClick={() => onOpen(a)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(a); }}>
                  <div className="jm">
                    <div className="jtop"><h3>{up(a.title)}</h3><div className="row jpills">{nw ? <Pill tone="orange">{nw} {nw === 1 ? "nauja kandidatūra" : "naujos kandidatūros"}</Pill> : null}{statusPill(a)}</div></div>
                    <div className="metrics">
                      <span><Svg name="people" size={16} /><b>{a.candidates || 0}</b> kandidatai</span>
                      <span><Svg name="search" size={16} /><b>{a.views || 0}</b> peržiūros</span>
                      <span className="msave"><Heart size={15} /><b>{a.saves || 0}</b> įsiminė</span>
                      <span><Svg name="pin" size={16} />{a.city}</span>
                    </div>
                    <div className="adsal-m"><b>{salTxt(a)}</b> {salKind(a)} / mėn.</div>
                    {a.status === "pending_payment" ? (
                      <div className="row" style={{ marginTop: 4 }}>
                        <button className="btn sm primary" type="button" disabled={busyPay === a.id} onClick={(e) => { e.stopPropagation(); onPay(a); }}>{busyPay === a.id ? "Jungiamasi prie Stripe..." : `Apmokėti ${FEE}`}</button>
                      </div>) : null}
                  </div>
                  <div className="adsal"><b>{salTxt(a)}</b><span>{salKind(a)} / mėn.</span></div>
                  <span className="jgo" aria-hidden="true"><Svg size={18} paths={chevron} /></span>
                </article>
              );
            })}</div>
          ) : <Empty title="Skelbimų dar nėra" sub="Sukurkite skelbimą – kandidatai kandidatuos su savo statybos24 profiliu." icon="briefcase" />}
      </section>
    </>
  );
}

/* ---------- Naujas / redaguoti ---------- */
function AdForm({ company, isPro, ad, onCancel, onSaved }) {
  const [f, setF] = useState(() => ({
    title: ad?.title || "", city: ad?.city || company?.city || "Vilnius", address: ad?.address || "",
    contract: ad?.contract_type || CONTRACTS[0], s1: ad ? String(Number(ad.salary_min)) : "", s2: ad?.salary_max ? String(Number(ad.salary_max)) : "",
    gross: Boolean(ad?.salary_gross), sched: ad?.schedule || "", start: ad?.start_text || "", desc: ad?.description || "",
    req: (ad?.requirements || []).join("\n"), offer: (ad?.offers || []).join("\n"),
  }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((c) => ({ ...c, [k]: e.target.type === "radio" ? e.target.value === "gross" : e.target.value }));
  const num = (v) => Number(String(v).replace(/\s/g, "").replace(",", "."));
  const preview = { salary_min: num(f.s1) || 0, salary_max: num(f.s2) || null, salary_gross: f.gross };
  const cities = [...new Set([...AD_CITIES, f.city].filter(Boolean))];
  const contracts = [...new Set([...CONTRACTS, f.contract].filter(Boolean))];

  async function save() {
    setErr("");
    const s1 = num(f.s1), s2 = f.s2 ? num(f.s2) : null;
    if (f.title.trim().length < 2) return setErr("Įrašykite pareigas.");
    if (!(s1 > 0)) return setErr("Nurodykite atlyginimą nuo.");
    if (s2 !== null && !(s2 >= s1)) return setErr("Atlyginimas „iki“ turi būti ne mažesnis nei „nuo“.");
    if (f.desc.trim().length < 10) return setErr("Aprašykite darbą (bent 10 simbolių).");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("job_ad_upsert", {
        p_ad_id: ad?.id || null, p_company_id: company.id, p_title: f.title, p_city: f.city, p_address: f.address,
        p_contract_type: f.contract, p_schedule: f.sched, p_start_text: f.start, p_salary_min: s1, p_salary_max: s2,
        p_salary_gross: f.gross, p_description: f.desc, p_requirements: lines(f.req), p_offers: lines(f.offer),
      });
      if (error) throw error;
      if (!ad && data?.status === "pending_payment") {
        const r = await startPayment(data.id);
        if (r.redirect) return;
      }
      onSaved(data);
    } catch (e) { setErr(e?.message || "Nepavyko išsaugoti skelbimo."); }
    finally { setBusy(false); }
  }

  const sec = (n, t, body, extra) => (
    <section className="card afsec"><header className="afh"><span className="afn">{n}</span><h2>{t}</h2>{extra}</header>{body}</section>
  );
  return (
    <>
      <div className="head"><div><h1>{ad ? "Redaguoti skelbimą" : "Naujas darbo skelbimas"}</h1><p className="lead">{ad ? (ad.live ? `Galioja dar ${daysLeft(ad.expires_at)} d. Pakeitimai matomi iš karto.` : "Pakeitimai bus matomi paskelbus skelbimą.") : "Skelbimas galios 30 dienų."}</p></div></div>
      <div className="jd-grid adnew">
        <div className="jd-main">
          {sec(1, "Pareigos ir vieta", <div className="form">
            <label className="field wide">Pareigos *<input value={f.title} maxLength={120} onChange={set("title")} placeholder="Pvz. Statybų darbininkas" /></label>
            <label className="field">Miestas *<select value={f.city} onChange={set("city")}>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="field">Sutartis<select value={f.contract} onChange={set("contract")}>{contracts.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>)}
          {sec(2, "Atlyginimas", <div className="form">
            <label className="field">Nuo *<span className="inpx"><input inputMode="numeric" value={f.s1} onChange={set("s1")} placeholder="1600" /><em>€ / mėn.</em></span></label>
            <label className="field">Iki<span className="inpx"><input inputMode="numeric" value={f.s2} onChange={set("s2")} placeholder="1900" /><em>€ / mėn.</em></span></label>
          </div>, <div className="segs" role="radiogroup" aria-label="Atlyginimo tipas">
            <label><input type="radio" name="ad-gross" value="net" checked={!f.gross} onChange={set("gross")} /><span>Į rankas</span></label>
            <label><input type="radio" name="ad-gross" value="gross" checked={f.gross} onChange={set("gross")} /><span>Ant popieriaus</span></label>
          </div>)}
          {sec(3, "Darbo laikas", <div className="form">
            <label className="field">Darbo grafikas<input value={f.sched} maxLength={120} onChange={set("sched")} placeholder="Pvz. I–V · 08:00–17:00" /></label>
            <label className="field">Darbo pradžia<input value={f.start} maxLength={80} onChange={set("start")} placeholder="Pvz. Iš karto" /></label>
          </div>)}
          {sec(4, "Aprašymas", <div className="form">
            <label className="field wide">Apie darbą *<textarea value={f.desc} maxLength={5000} onChange={set("desc")} placeholder="Ką reikės dirbti, kur, su kuo" /></label>
            <label className="field">Reikalavimai<textarea value={f.req} onChange={set("req")} placeholder="Kiekvienas iš naujos eilutės" /></label>
            <label className="field">Siūlome<textarea value={f.offer} onChange={set("offer")} placeholder="Kiekvienas iš naujos eilutės" /></label>
          </div>)}
        </div>
        <aside className="jd-side">
          <section className="card adpv"><small className="pvlab">Taip matys darbuotojai</small>
            <div className="adpv-card"><b className="adpv-t">{up(f.title) || "PAREIGOS"}</b>
              <div className="co-line"><div className="av co sm" style={{ border: "1px solid var(--line)" }}>{initialsOf(String(company?.name || "").replace(/^(UAB|MB)\s+/, ""))}</div><div><b className="nm">{company?.name}</b><small>{[f.city, f.contract].filter(Boolean).join(" · ")}</small></div></div>
              <div className="adpv-sal"><b>{preview.salary_min ? salTxt(preview) : "— €"}</b><span>{salKind(preview)} / mėn.</span></div>
              {f.sched ? <small className="muted">{f.sched}</small> : null}
            </div>
          </section>
          <section className="card jd-act">
            {!ad ? <div className="adfee">{isPro ? <><span>Skelbimo kaina</span><b>0 €</b><small>Įskaičiuota į Business Pro</small></> : <><span>Skelbimo kaina</span><b>{FEE} <em>/ 30 d.</em></b><small>Business Pro plane – nemokamai</small></>}</div> : null}
            {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
            <button className="btn primary jd-wide" type="button" disabled={busy} onClick={save}>{busy ? "Saugoma..." : ad ? "Išsaugoti pakeitimus" : isPro ? "Paskelbti skelbimą" : `Apmokėti ${FEE} ir paskelbti`}</button>
            <button className="btn jd-wide" type="button" disabled={busy} onClick={onCancel}>Atšaukti</button>
            {!ad && !isPro ? <p className="small muted" style={{ margin: 0, textAlign: "center" }}>Apmokėsite kortele per Stripe. Sąskaita – el. paštu.</p> : null}
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- Pokalbio kvietimas ---------- */
function InterviewModal({ ad, cand, onClose, onDone }) {
  const prev = cand.interview_at ? new Date(cand.interview_at) : null;
  const d0 = prev || new Date(Date.now() + 2 * 864e5);
  const pad = (n) => String(n).padStart(2, "0");
  const [how, setHow] = useState(cand.interview_how || "live");
  const [date, setDate] = useState(`${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`);
  const [time, setTime] = useState(prev ? `${pad(prev.getHours())}:${pad(prev.getMinutes())}` : "10:00");
  const [addr, setAddr] = useState(cand.interview_address || ad.address || "");
  const [note, setNote] = useState(cand.interview_note || "");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const times = timeOpts.includes(time) ? timeOpts : [time, ...timeOpts];
  async function send() {
    setErr("");
    const at = new Date(`${date}T${time}:00`);
    if (Number.isNaN(at.getTime()) || at < new Date()) return setErr("Pasirinkite būsimą datą ir laiką.");
    if (how === "live" && addr.trim().length < 3) return setErr("Nurodykite pokalbio adresą.");
    setBusy(true);
    const { error } = await supabase.rpc("job_ad_candidate_update", { p_application_id: cand.id, p_action: "interview", p_interview_at: at.toISOString(), p_interview_how: how, p_interview_address: addr, p_interview_note: note });
    setBusy(false);
    if (error) setErr(error.message || "Nepavyko išsiųsti kvietimo."); else onDone();
  }
  return (
    <Modal title={cand.interview_at ? "Keisti pokalbio laiką" : "Kviesti pokalbiui"} eyebrow={cand.name} sub={<span className="muted small">{up(ad.title)}</span>} onClose={() => !busy && onClose()}>
      <div className="ivm">
        <div className="field"><span>Kaip vyks pokalbis</span><div className="segs wide2" role="radiogroup" aria-label="Pokalbio būdas">
          <label><input type="radio" name="iv-how" checked={how === "live"} onChange={() => setHow("live")} /><span>Gyvai</span></label>
          <label><input type="radio" name="iv-how" checked={how === "phone"} onChange={() => setHow("phone")} /><span>Telefonu</span></label>
        </div></div>
        <div className="pair2"><label className="field">Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="field">Laikas<select value={time} onChange={(e) => setTime(e.target.value)}>{times.map((t) => <option key={t}>{t}</option>)}</select></label></div>
        {how === "live" ? <label className="field iv-addr">Adresas<input value={addr} maxLength={200} onChange={(e) => setAddr(e.target.value)} placeholder="Pvz. Ozo g. 25, Vilnius" /></label>
          : <p className="small muted iv-ph" style={{ margin: 0 }}>Paskambinsite kandidatui nurodytu laiku – jo telefoną matysite, kai jis patvirtins pokalbį.</p>}
        <label className="field">Žinutė (nebūtina)<textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Pvz. Pasiimkite asmens dokumentą." /></label>
        {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
          <button className="btn primary" type="button" disabled={busy} onClick={send}><Svg name="send" size={15} />{cand.interview_at ? "Siųsti naują laiką" : "Siųsti kvietimą"}</button>
        </div>
      </div>
    </Modal>
  );
}

function ExtendModal({ ad, isPro, onClose, onDone }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const left = ad.live ? daysLeft(ad.expires_at) : 0;
  async function go() {
    setBusy(true); setErr("");
    try {
      if (isPro) {
        const { error } = await supabase.rpc("job_ad_extend_plan", { p_ad_id: ad.id });
        if (error) throw error;
        onDone();
      } else {
        const r = await startPayment(ad.id);
        if (r.paid) onDone();
      }
    } catch (e) { setErr(e?.message || "Nepavyko pratęsti."); }
    finally { setBusy(false); }
  }
  return (
    <Modal eyebrow="Skelbimas" title="Pratęsti 30 dienų" sub={<span className="muted small">{up(ad.title)}{ad.live ? ` · dabar galioja dar ${left} d.` : ""}</span>} onClose={() => !busy && onClose()}>
      <div className="adfee">{isPro ? <><span>Pratęsimo kaina</span><b>0 €</b><small>Įskaičiuota į Business Pro</small></> : <><span>Pratęsimo kaina</span><b>{FEE}</b><small>Business Pro plane – nemokamai</small></>}</div>
      <p className="small muted" style={{ margin: "12px 0 0" }}>Po pratęsimo skelbimas galios dar {left + 30} d. Kandidatai ir įsiminimai išlieka.</p>
      {err && <p className="ferr" role="alert">{err}</p>}
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
        <button className="btn primary" type="button" disabled={busy} onClick={go}>{busy ? "Vykdoma..." : isPro ? "Pratęsti" : `Pratęsti už ${FEE}`}</button>
      </div>
    </Modal>
  );
}

/* ---------- Skelbimo puslapis su kandidatais ---------- */
function AdDetail({ adId, isPro, onBack, onEdit, onWorkerProfile, onChanged }) {
  const [ad, setAd] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [iv, setIv] = useState(null);
  const [ext, setExt] = useState(false);
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("job_ad_company_detail", { p_ad_id: adId });
    if (error) setErr(error.message || "Nepavyko įkelti skelbimo."); else { setErr(""); setAd(data); }
  }, [adId]);
  useEffect(() => {
    (async () => { await load(); await supabase.rpc("job_ad_company_mark_seen", { p_ad_id: adId }); onChanged(); })();
  }, [adId]);

  async function act(cand, action) {
    setBusy(cand.id + action);
    const { error } = await supabase.rpc("job_ad_candidate_update", { p_application_id: cand.id, p_action: action });
    setBusy("");
    if (error) setErr(error.message); else { await load(); onChanged(); }
  }
  async function nudge(w) {
    setBusy("n" + w.worker_id);
    const { error } = await supabase.rpc("job_ad_nudge", { p_ad_id: adId, p_worker_id: w.worker_id });
    setBusy("");
    if (error) setErr(error.message); else load();
  }
  async function openCv(c) {
    const { data } = await supabase.storage.from("job-ad-cv").createSignedUrl(c.cv_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  async function close() {
    if (!window.confirm("Uždaryti skelbimą? Darbuotojai jo nebematys.")) return;
    const { error } = await supabase.rpc("job_ad_close", { p_ad_id: adId });
    if (error) setErr(error.message); else { await load(); onChanged(); }
  }
  async function pay() {
    setBusy("pay");
    try { const r = await startPayment(adId); if (r.paid) { await load(); onChanged(); } }
    catch (e) { setErr(e?.message || "Nepavyko pradėti apmokėjimo."); }
    finally { setBusy(""); }
  }

  if (!ad) return (
    <>
      <section className="card">{err ? <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p> : <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>}</section>
    </>
  );

  const cands = ad.candidates || [];
  const visible = cands.filter((c) => filter === "all" || (filter === "rel" && Number(c.attendance_rate) >= 95) || (filter === "docs" && (c.documents?.length || c.cv_path)))
    .sort((x, y) => Number(y.attendance_rate || 0) - Number(x.attendance_rate || 0));
  const list = visible.filter((c) => c.status !== "interview");
  const ivs = cands.filter((c) => c.status === "interview").sort((x, y) => new Date(x.interview_at) - new Date(y.interview_at));

  const row = (c) => {
    const cvB = c.cv_path ? null : c.cv_requested_at ? <span className="pill cvp"><Svg name="clock" size={13} width={2.2} />CV prašoma</span>
      : <button className="btn sm" type="button" disabled={busy === c.id + "request_cv"} onClick={() => act(c, "request_cv")}><Svg name="file" size={14} />Prašyti CV</button>;
    const prof = <button className="btn sm" type="button" onClick={() => onWorkerProfile(c)}><Svg name="user" size={14} />Profilis</button>;
    const acts = c.status === "rejected" ? <><Pill>Atmesta</Pill>{prof}</>
      : c.status === "interview" ? <><button className="btn sm" type="button" onClick={() => setIv(c)}>Keisti laiką</button>{cvB}{prof}</>
      : <><button className="btn sm primary" type="button" onClick={() => setIv(c)}>Kviesti pokalbiui</button>{cvB}<button className="btn sm" type="button" disabled={busy === c.id + "reject"} onClick={() => { if (window.confirm(`Atmesti ${c.name} kandidatūrą?`)) act(c, "reject"); }}>Atmesti</button>{prof}</>;
    return (
      <div className="wk cand" key={c.id}>
        <Av w={c} />
        <div className="wn">
          <div className="cnm"><b className="nm">{c.name}</b><small className="cmeta">{c.city || ""}{c.attendance_rate !== null && c.attendance_rate !== undefined ? ` · patikimumas ${Math.round(Number(c.attendance_rate))}/100` : ""}<i>•</i>Kandidatavo prieš {daysAgo(c.created_at)} d.</small></div>
          <div className="tags">
            {c.status === "sent" ? <Pill tone="orange">Nauja</Pill> : null}
            {c.cv_path ? <button type="button" className="tag doc" onClick={() => openCv(c)}><Svg name="file" size={13} />CV</button> : null}
            {(c.documents || []).map((d) => <span className="tag doc" key={d}><Svg name="file" size={13} />{d}</span>)}
          </div>
          {c.message ? <p className="candmsg">„{c.message}“</p> : null}
          {c.status === "interview" && c.interview_at ? (
            <div className="ivline"><Svg name="cal" size={15} width={2.2} /><span><b>Pokalbis {ivShort(c.interview_at)}</b> · {IV_HOW[c.interview_how]}{c.interview_how === "live" ? ` · ${c.interview_address || ""}` : c.phone ? ` · ${c.phone}` : ""}</span>
              {c.interview_confirmed_at ? <em className="ok"><Svg name="check" size={12} width={3} />Patvirtino</em> : <em>Laukiama patvirtinimo</em>}</div>
          ) : null}
        </div>
        <div className="wa cva">{acts}</div>
      </div>
    );
  };

  const savers = ad.savers || [];
  return (
    <>
      <header className="jd-hero"><div className="jd-titlerow"><h1>{up(ad.title)}</h1>{statusPill(ad)}</div>
        <div className="jd-meta"><span><Svg name="pin" size={16} />{ad.city}</span><span><Svg name="euro" size={16} />{salTxt(ad)} {salKind(ad)} / mėn.</span>{ad.contract_type ? <span><Svg name="file" size={16} />{ad.contract_type}</span> : null}{ad.schedule ? <span><Svg name="clock" size={16} />{ad.schedule}</span> : null}</div></header>
      {err && <p className="ferr" role="alert">{err}</p>}
      {ad.status === "pending_payment" ? (
        <section className="card"><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div><b>Skelbimas dar nepaskelbtas</b><p className="small muted" style={{ margin: "2px 0 0" }}>Apmokėjus {FEE} skelbimas bus matomas darbuotojams 30 dienų.</p></div>
          <button className="btn primary" type="button" disabled={busy === "pay"} onClick={pay}>{busy === "pay" ? "Jungiamasi prie Stripe..." : `Apmokėti ${FEE}`}</button>
        </div></section>) : null}
      <section className="card"><header><div><h2>Kandidatai <span className="muted">· {cands.filter((c) => c.status !== "interview").length}</span></h2></div>
        <div className="row" style={{ gap: 8 }}><button className="btn sm" type="button" onClick={() => onEdit(ad)}>Redaguoti</button>
          {ad.status !== "pending_payment" ? <button className="btn sm" type="button" onClick={() => setExt(true)}>Pratęsti</button> : null}
          {ad.status === "active" ? <button className="btn sm ghost" type="button" onClick={close}>Uždaryti</button> : null}</div></header>
        <div className="chips" role="group" aria-label="Filtras">{[["all", "Visi"], ["rel", "Patikimumas 95+"], ["docs", "Turi pažymėjimų"]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t}</button>)}</div>
        <div className="list">{list.length ? list.map(row) : <Empty title={filter === "all" ? "Naujų kandidatų nėra" : "Pagal šį filtrą kandidatų nėra"} sub={filter === "all" ? "Pakviestieji pokalbiui rodomi žemiau." : "Pasirinkite kitą filtrą."} icon="people" />}</div>
      </section>
      <section className="card ivsec"><header><div><h2><Svg name="cal" size={17} width={2.2} /> Pakviesti pokalbiui <span className="muted">· {ivs.length}</span></h2></div></header>
        <div className="list">{ivs.length ? ivs.map(row) : <p className="small muted" style={{ padding: "6px 2px", margin: 0 }}>Dar nieko nepakvietėte. Prie kandidato spauskite „Kviesti pokalbiui“.</p>}</div></section>
      <section className="card"><header><div><h2><Heart size={17} on /> Įsiminė skelbimą <span className="muted">· {savers.length}</span></h2><p className="small muted" style={{ margin: "2px 0 0" }}>Dar nekandidatavo</p></div></header>
        <div className="list">{savers.length ? savers.map((w) => (
          <div className="wk fw" key={w.worker_id}><Av w={w} />
            <div className="fwm"><div className="fwt"><b className="nm">{w.name}</b><small className="muted">{w.city || ""}</small></div></div>
            <div className="wa">{w.nudged ? <Pill tone="green">Pakviestas kandidatuoti</Pill>
              : ad.live ? <button className="btn sm" type="button" disabled={busy === "n" + w.worker_id} onClick={() => nudge(w)}><Svg name="send" size={15} />Pakviesti kandidatuoti</button> : null}
              <button className="btn sm" type="button" onClick={() => onWorkerProfile(w)}><Svg name="user" size={15} />Profilis</button></div>
          </div>)) : <p className="small muted" style={{ padding: "6px 2px", margin: 0 }}>Kol kas niekas neįsiminė.</p>}</div></section>
      {iv && <InterviewModal ad={ad} cand={iv} onClose={() => setIv(null)} onDone={() => { setIv(null); load(); onChanged(); }} />}
      {ext && <ExtendModal ad={ad} isPro={isPro} onClose={() => setExt(false)} onDone={() => { setExt(false); load(); onChanged(); }} />}
    </>
  );
}

/* ---------- Duomenys meniu ženkliukui ---------- */
export function useEmployerAds(companyId, enabled) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!companyId || !enabled) { setLoaded(true); return; }
    const { data, error: e } = await supabase.rpc("job_ads_company_list", { p_company_id: companyId });
    if (e) setError(e.message || "Nepavyko įkelti skelbimų."); else { setError(""); setAds(Array.isArray(data) ? data : []); }
    setLoaded(true);
  }, [companyId, enabled]);
  useEffect(() => { reload(); }, [reload]);
  const newCount = useMemo(() => ads.reduce((n, a) => n + Number(a.new_candidates || 0), 0), [ads]);
  return { ads, loaded, error, reload, newCount };
}

export function EmployerAds({ data, company, isPro, onWorkerProfile, startNew, onStartNewHandled }) {
  const [mode, setMode] = useState("list");
  const [current, setCurrent] = useState(null);
  const [busyPay, setBusyPay] = useState("");
  const [payErr, setPayErr] = useState("");
  useEffect(() => { if (startNew) { setCurrent(null); setMode("new"); onStartNewHandled?.(); } }, [startNew]);
  const top = () => window.scrollTo(0, 0);

  if (mode === "new" || mode === "edit") {
    return <AdForm company={company} isPro={isPro} ad={mode === "edit" ? current : null}
      onCancel={() => { setMode(current ? "detail" : "list"); top(); }}
      onSaved={(ad) => { data.reload(); setCurrent(ad); setMode("detail"); top(); }} />;
  }
  if (mode === "detail" && current) {
    return <AdDetail adId={current.id} isPro={isPro} onBack={() => { setMode("list"); setCurrent(null); top(); }}
      onEdit={(ad) => { setCurrent(ad); setMode("edit"); top(); }} onWorkerProfile={onWorkerProfile} onChanged={data.reload} />;
  }
  return (
    <>
      {payErr && <p className="ferr" role="alert">{payErr}</p>}
      <AdsList ads={data.ads} loaded={data.loaded} error={data.error} busyPay={busyPay}
        onOpen={(a) => { setCurrent(a); setMode("detail"); top(); }}
        onNew={() => { setCurrent(null); setMode("new"); top(); }}
        onPay={async (a) => { setBusyPay(a.id); setPayErr(""); try { const r = await startPayment(a.id); if (r.paid) data.reload(); } catch (e) { setPayErr(e?.message || "Nepavyko pradėti apmokėjimo."); } finally { setBusyPay(""); } }} />
    </>
  );
}
