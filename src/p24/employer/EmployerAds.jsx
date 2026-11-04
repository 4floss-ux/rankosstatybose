import { useAdNews, AdNews, NewsBadge, MessageBadge } from "../adNews.jsx";
import { SiteSelect } from "../../ui/SiteSelect.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jobAdFreeAvailable, jobAdFirstFreeAvailable, jobAdOfferValid, jobAdQuotaUnsupported } from "../../employer/adQuota.js";
import { supabase } from "../../lib/config.js";
import { workerAvatarUrl } from "../../ui/avatars.jsx";
import { Svg } from "../Shell.jsx";
import { JobAdContent } from "../JobAdContent.jsx";
import "./EmployerAds.css";
import { ShareJobAdButton } from "../ShareJobAdButton.jsx";
import { AdChat } from "../AdChat.jsx";
import { RoundedDateSelect, StyledConfirmDialog, useStyledConfirm } from "../../ui/common.jsx";
import { Empty, Pill, initialsOf, up, P24Modal } from "../ui.jsx";
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
  return <P24Modal eyebrow={eyebrow} title={title} sub={sub} onClose={onClose}>{children}</P24Modal>;
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
function AdsList({ ads, loaded, error, onOpen, onNew, onPay, busyPay, news }) {
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
                    <div className="jtop"><h3>{up(a.title)}</h3><div className="row jpills"><NewsBadge count={news?.adCount(a.id)} />{nw ? <Pill tone="orange">{nw} {nw === 1 ? "nauja kandidatūra" : "naujos kandidatūros"}</Pill> : null}{statusPill(a)}</div></div>
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
function AdForm({ company, isPro, firstFree, quotaEnabled, pricingBusy, ad, onCancel, onSaved }) {
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
    if (pricingBusy) return;
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
        // Another team member may have used the final credit in the meantime.
        // Show the existing unpaid-ad screen; do not start checkout unexpectedly.
        if (isPro) { onSaved(data); return; }
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
            <label className="field">Miestas *<SiteSelect value={f.city} onChange={set("city")}>{cities.map((c) => <option key={c}>{c}</option>)}</SiteSelect></label>
            <label className="field">Sutartis<SiteSelect value={f.contract} onChange={set("contract")}>{contracts.map((c) => <option key={c}>{c}</option>)}</SiteSelect></label>
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
            {!ad ? <div className="adfee">{isPro ? <><span>Skelbimo kaina</span><b>0 €</b><small>{firstFree ? "Pirmas jūsų skelbimas – nemokamas" : "Panaudojamas 1 iš 10 Business Pro paskelbimų"}</small></> : <><span>Skelbimo kaina</span><b>{FEE} <em>/ 30 d.</em></b><small>{quotaEnabled ? "Business Pro: nemokamai tik turint nepanaudotų paskelbimų iš 10" : "Business Pro: iki 10 paskelbimų arba pratęsimų per prenumeratos mėnesį"}</small></>}</div> : null}
            {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
            <button className="btn primary jd-wide" type="button" disabled={busy || pricingBusy} onClick={save}>{busy ? "Saugoma..." : ad ? "Išsaugoti pakeitimus" : isPro ? "Paskelbti skelbimą" : `Apmokėti ${FEE} ir paskelbti`}</button>
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
          <label><input type="radio" name="iv-how" value="live" checked={how === "live"} onChange={() => setHow("live")} /><span>Gyvai</span></label>
          <label><input type="radio" name="iv-how" value="phone" checked={how === "phone"} onChange={() => setHow("phone")} /><span>Telefonu</span></label>
        </div></div>
        <div className="pair2"><label className="field">Data<RoundedDateSelect value={date} onChange={setDate} ariaLabel="Pokalbio data" allowClear={false} className="btn jd-wide ad-date-trigger" /></label>
          <label className="field">Laikas<SiteSelect value={time} onChange={(e) => setTime(e.target.value)}>{times.map((t) => <option key={t}>{t}</option>)}</SiteSelect></label></div>
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

function ExtendModal({ ad, isPro: freeAvailable, quotaEnabled, pricingBusy, onClose, onDone }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [exhausted, setExhausted] = useState(false);
  const requestId = useRef(null);
  const isPro = freeAvailable && !exhausted;
  const left = ad.live ? daysLeft(ad.expires_at) : 0;
  async function go() {
    if (pricingBusy) return;
    setBusy(true); setErr("");
    try {
      if (isPro) {
        if (!requestId.current) requestId.current = crypto.randomUUID();
        const { error } = await supabase.rpc(quotaEnabled ? "job_ad_extend_plan_with_quota" : "job_ad_extend_plan", {
          p_ad_id: ad.id, ...(quotaEnabled ? { p_request_id: requestId.current } : {}),
        });
        if (error) throw error;
        onDone();
      } else {
        const r = await startPayment(ad.id);
        if (r.paid) onDone();
      }
    } catch (e) {
      if (e?.details === "JOB_AD_FREE_QUOTA_EXHAUSTED") setExhausted(true);
      setErr(e?.message || "Nepavyko pratęsti.");
    }
    finally { setBusy(false); }
  }
  return (
    <Modal eyebrow="Skelbimas" title="Pratęsti 30 dienų" sub={<span className="muted small">{up(ad.title)}{ad.live ? ` · dabar galioja dar ${left} d.` : ""}</span>} onClose={() => !busy && onClose()}>
      <div className="ad-extension">
        <div className="ad-extension-price"><div><span>Pratęsimas</span><b>Dar 30 dienų</b></div><strong>{isPro ? "0 €" : FEE}</strong></div>
        <div className="ad-extension-period"><Svg name="cal" size={20} /><div><b>Po pratęsimo galios dar {left + 30} d.</b><span>{ad.live ? `Prie likusių ${left} d. pridedama 30 dienų.` : "Skelbimas vėl bus rodomas 30 dienų."}</span></div></div>
        <p className="ad-extension-kept"><Svg name="check" size={16} />Kandidatai, susirašinėjimai ir įsiminimai išlieka.</p>
      </div>
      {err && <p className="ferr" role="alert">{err}</p>}
      <div className="ad-extension-actions">
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
        <button className="btn primary" type="button" disabled={busy || pricingBusy} onClick={go}>{busy ? "Vykdoma..." : isPro ? "Pratęsti" : `Pratęsti už ${FEE}`}</button>
      </div>
    </Modal>
  );
}

/* ---------- Skelbimo puslapis su kandidatais ---------- */
function AdDetail({ adId, isPro, quotaEnabled, pricingBusy, deleteReady, onDeleted, onBack, onEdit, onWorkerProfile, onChanged, news }) {
  const { dialog, askConfirm, resolveConfirm } = useStyledConfirm();
  const [chat, setChat] = useState(null);
  const [ad, setAd] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedCandidates, setExpandedCandidates] = useState(new Set());
  useEffect(() => { setExpandedCandidates(new Set()); }, [adId]);
  const [iv, setIv] = useState(null);
  const [ext, setExt] = useState(false);
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    const [{ data, error }, saved] = await Promise.all([
      supabase.rpc("job_ad_company_detail", { p_ad_id: adId }),
      supabase.rpc("job_ad_company_savers", { p_ad_id: adId }),
    ]);
    if (data && !saved.error && Array.isArray(saved.data)) data.savers = saved.data;
    if (error) setErr(error.message || "Nepavyko įkelti skelbimo."); else { setErr(""); setAd(data); }
  }, [adId]);
  useEffect(() => {
    (async () => { await load(); await supabase.rpc("job_ad_company_mark_seen", { p_ad_id: adId }); onChanged(); })();
  }, [adId]);

  useEffect(() => { if (news?.rows) load(); }, [news?.rows, load]);

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
  async function removeAd() {
    if (!(await askConfirm({ title: "Ištrinti skelbimą?", message: "Skelbimas ir su juo susijusios kandidatūros, žinutės bei priedai bus pašalinti. Panaudota nemokamo skelbimo dovana neatsinaujins. Jei buvo mokėta, mokėjimo apskaitos įrašas išliks. Šio veiksmo atšaukti negalima.", confirmLabel: "Ištrinti skelbimą", cancelLabel: "Palikti skelbimą", danger: true }))) return;
    setBusy("delete"); setErr("");
    try {
      const { data, error } = await supabase.functions.invoke("job-ad-delete", { body: { adId } });
      if (error || data?.error) {
        let message = data?.error;
        if (!message && error?.context?.clone) {
          try { const payload = await error.context.clone().json(); if (typeof payload?.error === "string") message = payload.error; } catch { /* Keep a safe fallback. */ }
        }
        throw new Error(message || "Nepavyko patvirtinti skelbimo ištrynimo. Atnaujinkite sąrašą ir bandykite dar kartą.");
      }
      if (data?.deleted !== true) throw new Error("Nepavyko patvirtinti skelbimo ištrynimo.");
      onDeleted?.(data.cleanup_pending === true);
      onChanged(); onBack();
    } catch (error) {
      setErr(jobAdQuotaUnsupported(error) ? "Skelbimo ištrynimas dar neįjungtas. Skelbimas nepakeistas." : error.message || "Nepavyko ištrinti skelbimo.");
    } finally { setBusy(""); }
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
    const acts = c.status === "rejected" ? <><Pill>Atmesta</Pill><button className="btn sm" type="button" onClick={() => setChat(c)}>Peržiūrėti žinutes<MessageBadge news={news} applicationId={c.id} /></button>{prof}</>
      : c.status === "interview" ? <><button className="btn sm" type="button" onClick={() => setIv(c)}>Keisti laiką</button><button className="btn sm" type="button" onClick={() => setChat(c)}><Svg name="chat" size={14} />Rašyti<MessageBadge news={news} applicationId={c.id} /></button>{cvB}{prof}</>
      : <><button className="btn sm primary" type="button" onClick={() => setIv(c)}>Kviesti pokalbiui</button><button className="btn sm" type="button" onClick={() => setChat(c)}><Svg name="chat" size={14} />Rašyti<MessageBadge news={news} applicationId={c.id} /></button>{cvB}<button className="btn sm" type="button" disabled={busy === c.id + "reject"} onClick={async () => { if (await askConfirm({ title: `Atmesti ${c.name} kandidatūrą?`, confirmLabel: "Atmesti", danger: true })) act(c, "reject"); }}>Atmesti</button>{prof}</>;
    return (
      <div className="wk cand interview-candidate" key={c.id}>
        <Av w={c} />
        <div className="wn">
          <div className="cnm"><b className="nm">{c.name}</b><NewsBadge count={news?.count(c.id)} /><small className="cmeta">{c.city || ""}{c.attendance_rate !== null && c.attendance_rate !== undefined ? ` · patikimumas ${Math.round(Number(c.attendance_rate))}/100` : ""}<i>•</i>Kandidatavo prieš {daysAgo(c.created_at)} d.</small></div>
          <div className="tags">
            {c.status === "sent" ? <Pill tone="orange">Nauja</Pill> : null}
            {c.cv_path ? <button type="button" className="tag doc" onClick={() => openCv(c)}><Svg name="file" size={13} />{c.cv_name || "CV"}</button> : null}
            {(c.documents || []).map((d) => <span className="tag doc" key={d}><Svg name="file" size={13} />{d}</span>)}
          </div>
          <AdNews news={news} applicationId={c.id} autoRead />
          {c.message ? <p className="candmsg">„{c.message}“</p> : null}
          {c.status === "interview" && c.interview_at ? (
            <div className="ivline candidate-interview"><Svg name="cal" size={18} width={2.2} />
              <div className="iv-summary"><b>Pokalbis {ivShort(c.interview_at)}</b><span>{IV_HOW[c.interview_how]}{c.interview_how === "live" ? ` · ${c.interview_address || ""}` : ""}</span>
                {c.interview_note ? <small>{c.interview_note}</small> : null}

              </div>
              {c.interview_confirmed_at ? <em className="ok"><Svg name="check" size={12} width={3} />Patvirtino</em> : <em>Laukiama patvirtinimo</em>}
            </div>
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
      <div className="jd-grid ead-detail">
        <JobAdContent ad={ad}>
      <section className="card"><header><div><h2 className="ead-section-title">Kandidatai <span className="cnt">{cands.filter((c) => c.status !== "interview").length}</span></h2></div></header>
        <div className="chips" role="group" aria-label="Filtras">{[["all", "Visi"], ["rel", "Patikimumas 95+"], ["docs", "Turi pažymėjimų"]].map(([k, t]) => <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{t}</button>)}</div>
        <div className="list">{list.length ? list.map(row) : <Empty title={filter === "all" ? "Naujų kandidatų nėra" : "Pagal šį filtrą kandidatų nėra"} sub={filter === "all" ? "Pakviestieji pokalbiui rodomi žemiau." : "Pasirinkite kitą filtrą."} icon="people" />}</div>
      </section>
      <div className="ead-secondary">
      <section className="card ivsec"><header><div><h2 className="ead-section-title"><Svg name="cal" size={17} width={2.2} /><span>Pakviesti pokalbiui</span><span className="cnt">{ivs.length}</span></h2></div></header>
        <div className="list">{ivs.length ? ivs.map(c => <div className="interview-fold" key={c.id}>
          <button className="interview-toggle" type="button" aria-expanded={expandedCandidates.has(c.id)} aria-controls={`interview-${c.id}`} onClick={() => setExpandedCandidates(current => { const next = new Set(current); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })}>
            <span>{c.name}</span><NewsBadge count={news?.count(c.id)} /><Svg paths='<path d="m6 9 6 6 6-6"/>' size={17} />
          </button>
          {expandedCandidates.has(c.id) ? <div id={`interview-${c.id}`}>{row(c)}</div> : null}
        </div>) : <Empty title="Pokalbių dar nesuplanavote" sub="Prie kandidato spauskite „Kviesti pokalbiui“." icon="cal" />}</div></section>
      <section className="card"><header><div><h2 className="ead-section-title"><Heart size={17} on /><span>Įsiminė skelbimą</span><span className="cnt">{savers.length}</span></h2><p className="small muted" style={{ margin: "2px 0 0" }}>Visi darbuotojai, įsiminę šį skelbimą</p></div></header>
        <div className="list">{savers.length ? savers.map((w) => (
          <div className="wk fw" key={w.worker_id}><Av w={w} />
            <div className="fwm"><div className="fwt"><b className="nm">{w.name}</b><small className="muted">{w.city || ""}</small></div></div>
            <div className="wa">{w.has_applied || cands.some(c => c.worker_id === w.worker_id) ? <Pill tone="green">Jau kandidatavo</Pill> : w.nudged ? <Pill tone="green">Pakviestas kandidatuoti</Pill>
              : ad.live ? <button className="btn sm" type="button" disabled={busy === "n" + w.worker_id} onClick={() => nudge(w)}><Svg name="send" size={15} />Pakviesti kandidatuoti</button> : null}
              <button className="btn sm" type="button" onClick={() => onWorkerProfile(cands.find(c => c.worker_id === w.worker_id) || w)}><Svg name="user" size={15} />Profilis</button></div>
          </div>)) : <Empty title="Skelbimo dar niekas neįsiminė" sub="Čia matysite darbuotojus, kuriuos galėsite pakviesti kandidatuoti." icon="people" />}</div></section>
      </div>
        </JobAdContent>
        <aside className="jd-side">
          <section className="card jd-pay"><span className="jd-paylab">Atlyginimas {salKind(ad)}</span><b>{salTxt(ad)}</b><span>per mėnesį</span></section>
          <section className="card jd-act" aria-label="Skelbimo valdymas">
            <h2>Skelbimo valdymas</h2>
            {ad.live ? <ShareJobAdButton ad={ad} className="btn jd-wide" /> : null}
            <button className="btn jd-wide" type="button" disabled={busy === "delete"} onClick={() => onEdit(ad)}><Svg name="edit" size={16} />Redaguoti skelbimą</button>
            {ad.status !== "pending_payment" ? <button className="btn jd-wide" type="button" disabled={busy === "delete" || pricingBusy} onClick={() => setExt(true)}><Svg name="cal" size={16} />Pratęsti skelbimą</button> : null}
            <button className="btn danger jd-wide" type="button" disabled={!deleteReady || busy === "delete" || ad.payment_pending} onClick={removeAd}>{busy === "delete" ? "Trinama..." : "Ištrinti skelbimą"}</button>
            <p className="small muted" style={{ margin: 0 }}>{!deleteReady ? "Skelbimo ištrynimas laikinai nepasiekiamas." : ad.payment_pending ? "Skelbimo negalima ištrinti, kol pradėtas jo apmokėjimas." : "Ištrynus skelbimo ir kandidatūrų atkurti negalėsite. Nemokamo skelbimo dovana neatsinaujins."}</p>
          </section>
        </aside>
      </div>
      {iv && <InterviewModal ad={ad} cand={iv} onClose={() => setIv(null)} onDone={() => { setIv(null); load(); onChanged(); }} />}
      {ext && <ExtendModal ad={ad} isPro={isPro} quotaEnabled={quotaEnabled} pricingBusy={pricingBusy} onClose={() => setExt(false)} onDone={() => { setExt(false); load(); onChanged(); }} />}
      {chat ? <AdChat onOpenAd={() => window.scrollTo(0, 0)} adId={ad.id} applicationId={chat.id} title={chat.name || "Kandidatas"} sub={ad.title} onRead={news?.reload} closed={chat.status === "rejected"} onClose={() => setChat(null)} /> : null}
      <StyledConfirmDialog dialog={dialog} onResolve={resolveConfirm} />
    </>
  );
}

/* ---------- Duomenys meniu ženkliukui ---------- */
export function useEmployerAds(companyId, enabled, accountId) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const scope = `${accountId || ""}:${companyId || ""}`;
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const [owner, setOwner] = useState(scope);
  const reload = useCallback(async () => {
    if (!companyId || !enabled) { setLoaded(true); return; }
    const { data, error: e } = await supabase.rpc("job_ads_company_list", { p_company_id: companyId });
    if (activeScope.current !== scope) return;
    setOwner(scope);
    if (e) setError(e.message || "Nepavyko įkelti skelbimų."); else { setError(""); setAds(Array.isArray(data) ? data : []); }
    setLoaded(true);
  }, [companyId, enabled, accountId]);
  useEffect(() => { reload(); }, [reload]);
  const news = useAdNews(enabled, `${accountId || ""}:${companyId || ""}`, reload, companyId);
  useEffect(() => { setAds([]); setLoaded(false); }, [accountId, companyId]);
  const ownAds = enabled && owner === scope ? ads : [];
  const candidateCount = useMemo(() => ownAds.reduce((n, a) => n + Number(a.new_candidates || 0), 0), [ads, owner, scope, enabled]);
  return { ads: ownAds, loaded, error, reload, news, newCount: candidateCount + news.total };
}

export function EmployerAds({ data, company, isPro, onWorkerProfile, startNew, onStartNewHandled, initialAdId, onInitialAdHandled }) {
  const [mode, setMode] = useState("list");
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    if (!initialAdId) return;
    setCurrent({ id: initialAdId }); setMode("detail"); onInitialAdHandled?.();
  }, [initialAdId, onInitialAdHandled]);
  const [busyPay, setBusyPay] = useState("");
  const [payErr, setPayErr] = useState("");
  const [quota, setQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState("");
  const [quotaRetry, setQuotaRetry] = useState(0);
  const [quotaReady, setQuotaReady] = useState(false);
  const [deleteReady, setDeleteReady] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState("");
  useEffect(() => {
    let active = true; setDeleteReady(false);
    if (company?.id) supabase.rpc("job_ad_deletion_available", { p_company_id: company.id })
      .then(({data,error}) => { if (active) setDeleteReady(!error && data === true); })
      .catch(() => { if (active) setDeleteReady(false); });
    return () => { active = false; };
  }, [company?.id]);
  useEffect(() => { setQuotaReady(false); setQuota(null); }, [company?.id, isPro]);
  useEffect(() => {
    let active = true;
    setQuotaError("");
    if (!company?.id) { setQuotaLoading(false); return; }
    setQuotaLoading(true);
    (async () => {
      try {
        let result = await supabase.rpc("job_ad_offer", { p_company_id: company.id });
        let requireFirstFree = true;
        if (jobAdQuotaUnsupported(result.error)) {
          requireFirstFree = false;
          result = isPro ? await supabase.rpc("job_ad_pro_quota", { p_company_id: company.id }) : { data: null };
        }
        if (result.error && !jobAdQuotaUnsupported(result.error)) throw result.error;
        if (!result.error && (requireFirstFree || result.data != null) && !jobAdOfferValid(result.data, requireFirstFree)) throw new Error("Invalid offer");
        if (active) setQuota(result.data || null);
      } catch {
        if (active) setQuotaError("Nepavyko patikrinti nemokamų paskelbimų likučio. Bandykite dar kartą.");
      } finally { if (active) { setQuotaReady(true); setQuotaLoading(false); } }
    })();
    return () => { active = false; };
  }, [company?.id, isPro, data.ads, quotaRetry]);
  useEffect(() => { if (startNew) { setCurrent(null); setMode("new"); onStartNewHandled?.(); } }, [startNew]);
  const top = () => window.scrollTo(0, 0);
  const freeAvailable = jobAdFreeAvailable(isPro, quota);
  const firstFree = jobAdFirstFreeAvailable(quota);
  const pricingBusy = quotaLoading || Boolean(quotaError);
  const banner = <>{deleteNotice ? <div className="notebox" role="status">{deleteNotice}</div> : null}{quotaError ? <div className="notebox"><p className="ferr" role="alert">{quotaError}</p><button type="button" className="btn" onClick={() => setQuotaRetry(value => value + 1)}>Bandyti dar kartą</button></div> : null}{quota?.enabled ? <div className="notebox" role="status">Šį prenumeratos mėnesį liko <b>{quota.remaining} iš 10</b> nemokamų paskelbimų visai įmonei. Naujas skelbimas arba pratęsimas dar 30 dienų naudoja vieną paskelbimą. Papildomai – <b>{FEE} / 30 d.</b>{quota.resets_at && Number.isFinite(Date.parse(quota.resets_at)) ? ` Kvota atsinaujins ${new Intl.DateTimeFormat("lt-LT", { timeZone: "Europe/Vilnius", year: "numeric", month: "long", day: "numeric" }).format(new Date(quota.resets_at))}.` : ""}</div> : null}</>;
  if (quotaLoading && !quotaReady) return <p className="small muted" role="status">Tikrinamas nemokamų paskelbimų likutis...</p>;

  if (mode === "new" || mode === "edit") {
    return <>{banner}<AdForm company={company} isPro={firstFree || freeAvailable} firstFree={firstFree} quotaEnabled={quota?.enabled === true} pricingBusy={pricingBusy} ad={mode === "edit" ? current : null}
      onCancel={() => { setMode(current ? "detail" : "list"); top(); }}
      onSaved={(ad) => { data.reload(); setQuotaRetry(value => value + 1); setCurrent(ad); setMode("detail"); top(); }} /></>;
  }
  if (mode === "detail" && current) {
    return <>{banner}<AdDetail news={data.news} adId={current.id} deleteReady={deleteReady} onDeleted={pending => setDeleteNotice(pending ? "Skelbimas ir kandidatūros ištrinti. Priedų trynimas dar baigiamas." : "Skelbimas ir su juo susiję duomenys ištrinti.")} isPro={freeAvailable} quotaEnabled={quota?.enabled === true} pricingBusy={pricingBusy} onBack={() => { setMode("list"); setCurrent(null); top(); }}
      onEdit={(ad) => { setCurrent(ad); setMode("edit"); top(); }} onWorkerProfile={onWorkerProfile} onChanged={() => { data.reload(); setQuotaRetry(value => value + 1); }} /></>;
  }
  return (
    <>
      {banner}
      {data.news?.error ? <p className="ferr" role="alert">{data.news.error}</p> : null}
      {payErr && <p className="ferr" role="alert">{payErr}</p>}
      <AdsList news={data.news} ads={data.ads} loaded={data.loaded} error={data.error} busyPay={busyPay}
        onOpen={(a) => { setCurrent(a); setMode("detail"); top(); }}
        onNew={() => { setCurrent(null); setMode("new"); setQuotaRetry(value => value + 1); top(); }}
        onPay={async (a) => { setBusyPay(a.id); setPayErr(""); try { const r = await startPayment(a.id); if (r.paid) data.reload(); } catch (e) { setPayErr(e?.message || "Nepavyko pradėti apmokėjimo."); } finally { setBusyPay(""); } }} />
    </>
  );
}
