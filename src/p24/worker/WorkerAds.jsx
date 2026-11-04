import { useBoostClock } from "../useBoostClock.js";
import { boostCompatibleRpc, compareAdBoost, isAdBoosted } from "../../lib/jobAdBoost.js";
import { useAdNews, AdNews, NewsBadge } from "../adNews.jsx";
import { SiteSelect } from "../../ui/SiteSelect.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/config.js";
import { MB, prepareUpload, safeExt } from "../../lib/imageUpload.js";
import { companyAvatarUrl } from "../../ui/avatars.jsx";
import { Svg } from "../Shell.jsx";
import { AdChat } from "../AdChat.jsx";
import { JobAdContent } from "../JobAdContent.jsx";
import { ShareJobAdButton } from "../ShareJobAdButton.jsx";
import { Empty, Paged, Pill, initialsOf, up, P24Modal } from "../ui.jsx";

/* Darbo skelbimai darbuotojui (prototipo wAds / wAd / adApply). Duomenys – RPC job_ads_worker_list ir kt. */

const AD_ST = { sent: ["Išsiųsta", "blue"], viewed: ["Peržiūrėta", "blue"], interview: ["Kviečia pokalbiui", "green"], rejected: ["Atmesta", ""], withdrawn: ["Atšaukta", ""] };
const AD_CITIES = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Utena"];
const IV_HOW = { live: "Gyvai", phone: "Telefonu" };
const chevron = '<path d="m9 18 6-6-6-6"/>';
const money = (v) => Number(v || 0).toLocaleString("lt-LT", { maximumFractionDigits: 2 });
export const salTxt = (a) => (!a.salary_max || Number(a.salary_max) === Number(a.salary_min) ? `${money(a.salary_min)} €` : `${money(a.salary_min)}–${money(a.salary_max)} €`);
export const salKind = (a) => (a.salary_gross ? "ant popieriaus" : "į rankas");
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 864e5));
const daysAgo = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5));
const mapLink = (addr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
const ivWhen = (iso) => new Date(iso).toLocaleString("lt-LT", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function Heart({ size, on }) {
  return <Svg size={size} paths={`<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"${on ? ' fill="currentColor"' : ""}/>`} />;
}

export function needsAction(a) {
  const x = a.application;
  if (!x) return Boolean(a.nudged && a.live);
  return (x.status === "interview" && !x.interview_confirmed_at) || (x.cv_requested_at && !x.cv_sent_at && !["rejected", "withdrawn"].includes(x.status));
}

/* Bendras duomenų „kabliukas“ – naudojamas ir meniu ženkliukui. */
export function useWorkerAds(enabled, accountId) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const activeScope = useRef(accountId);
  activeScope.current = accountId;
  const [owner, setOwner] = useState(accountId);
  const reload = useCallback(async () => {
    if (!enabled) return;
    const [{ data, error: e }, interviewState] = await Promise.all([
      boostCompatibleRpc(supabase, "job_ads_worker_boosted_list", "job_ads_worker_list"), supabase.rpc("job_ad_interview_state"),
    ]);
    if (activeScope.current !== accountId) return;
    setOwner(accountId);
    if (e) setError(e.message || "Nepavyko įkelti skelbimų.");
    else { setError(""); setAds(Array.isArray(data) ? data.map(ad => {
      const state = !interviewState.error && Array.isArray(interviewState.data) ? interviewState.data.find(row => row.application_id === ad.application?.id) : null;
      return state && ad.application ? { ...ad, application: { ...ad.application, interview_changed: state.needs_reconfirmation } } : ad;
    }) : []); }
    setLoaded(true);
  }, [enabled, accountId]);
  useEffect(() => { if (enabled) reload(); else setLoaded(true); }, [enabled, reload]);
  useEffect(() => { if (!enabled) return; const timer=setInterval(()=>{if(document.visibilityState!=="hidden")reload();},60000);return ()=>clearInterval(timer); }, [enabled,reload]);
  const news = useAdNews(enabled, accountId, reload);
  useEffect(() => { setAds([]); setLoaded(false); }, [accountId]);
  const ownAds = enabled && owner === accountId ? ads : [];
  return { ads: ownAds, setAds, loaded, error, reload, news, actionCount: news.total };
}

function SaveBtn({ ad, label, onToggle }) {
  return (
    <button type="button" className={`favbtn adsave${ad.saved ? " on" : ""}${label ? " lab" : ""}`} aria-pressed={!!ad.saved}
      title={label ? undefined : ad.saved ? "Pašalinti iš įsimintų" : "Įsiminti skelbimą"}
      onClick={(e) => { e.stopPropagation(); onToggle(ad); }}>
      <Heart size={label ? 16 : 17} on={ad.saved} />{label ? (ad.saved ? "Įsimintas" : "Įsiminti") : null}
    </button>
  );
}

export function AdCard({ ad, fav, mutual, onOpen, onToggleSave, publicHref, newsCount }) {
  const x = ad.application;
  const avatar = ad.company_avatar_path ? companyAvatarUrl(ad.company_avatar_path) : "";
  const Tag = publicHref ? "a" : "article";
  return (
    <Tag className="job" href={publicHref} tabIndex={0} role="link" aria-label={up(ad.title)} onClick={publicHref ? undefined : () => onOpen(ad)} onKeyDown={publicHref ? undefined : (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(ad); }}>
      <div className="jm">
        <div className="jtop"><h3>{up(ad.title)}</h3>
          <div className="row jpills">{isAdBoosted(ad) ? <Pill tone="blue">Iškeltas</Pill> : null}<NewsBadge count={newsCount} />
            {x && x.cv_requested_at && !x.cv_sent_at && x.status !== "rejected" ? <Pill tone="orange">Prašo CV</Pill> : null}
            {x ? <Pill tone={x.interview_changed && !x.interview_confirmed_at ? "red" : AD_ST[x.status]?.[1]}>{x.interview_changed && !x.interview_confirmed_at ? "Pokalbis pakeistas" : AD_ST[x.status]?.[0]}</Pill> : ad.nudged ? <Pill tone="orange">Kviečia kandidatuoti</Pill> : null}
            {!ad.live ? <Pill>Nebegalioja</Pill> : null}
            {mutual ? <span className="pill team"><Svg name="people" size={13} width={2.2} />Nuolatinė komanda</span> : null}
          </div>
        </div>
        <div className="co-line">
          <div className="av co sm" style={{ border: "1px solid var(--line)", overflow: "hidden" }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(String(ad.company_name || "").replace(/^(UAB|MB)\s+/, ""))}</div>
          <div><b className="nm">{ad.company_name}{fav ? <span className="cofav" title="Mėgstama įmonė"><Heart size={13} on /></span> : null}</b></div>
        </div>
        <div className="adsal-m"><span><b>{salTxt(ad)}</b> {salKind(ad)} / mėn.</span>{!publicHref && ad.live ? <SaveBtn ad={ad} onToggle={onToggleSave} /> : null}</div>
      </div>
      <div className="adsal"><b>{salTxt(ad)}</b><span>{salKind(ad)} / mėn.</span>{!publicHref && ad.live ? <SaveBtn ad={ad} onToggle={onToggleSave} /> : null}</div>
      <span className="jgo" aria-hidden="true"><Svg size={18} paths={chevron} /></span>
    </Tag>
  );
}

function Modal({ title, eyebrow, sub, onClose, children }) {
  return <P24Modal eyebrow={eyebrow} title={title} sub={sub} onClose={onClose}>{children}</P24Modal>;
}

function ApplyModal({ ad, me, onClose, onSent }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    supabase.from("worker_documents").select("doc_type").eq("show_to_employers", true).then(({ data }) => setDocs([...new Set((data || []).map((d) => d.doc_type))]));
  }, []);
  async function send() {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("job_ad_apply", { p_ad_id: ad.id, p_message: msg });
    setBusy(false);
    if (error) setErr(error.message || "Nepavyko išsiųsti kandidatūros."); else onSent();
  }
  return (
    <Modal eyebrow="Kandidatavimas" title={up(ad.title)} sub={<span className="muted small">{ad.company_name}</span>} onClose={() => !busy && onClose()}>
      <div className="apprev"><small className="eyebrow">Įmonė matys</small>
        <div className="apwho"><div className="av">{me.avatarUrl ? <img src={me.avatarUrl} alt="" /> : me.initials}</div><div><b>{me.name}</b><span className="muted small">{[me.city, me.license ? "B kategorija" : ""].filter(Boolean).join(" · ")}</span></div></div>
        <div className="apstats">
          <div><b>{me.reliability ?? "—"}</b><span>Patikimumas</span></div>
          <div><b>{me.rating ? String(Number(me.rating).toFixed(1)).replace(".", ",") : "—"}</b><span>Įvertinimas</span></div>
          <div><b>{me.completed ?? 0}</b><span>Darbo dienų</span></div>
        </div>
        {docs.length ? <div className="tags">{docs.map((d) => <span className="tag doc" key={d}><Svg name="file" size={13} />{d}</span>)}</div> : null}
      </div>
      <label className="field" style={{ marginTop: 14 }}>Žinutė įmonei (nebūtina)<textarea value={msg} maxLength={1000} onChange={(e) => setMsg(e.target.value)} placeholder="Pvz. Galiu pradėti nuo pirmadienio." /></label>
      {err && <p className="ferr" role="alert">{err}</p>}
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
        <button className="btn primary" type="button" disabled={busy} onClick={send}>{busy ? "Siunčiama..." : "Siųsti kandidatūrą"}</button>
      </div>
    </Modal>
  );
}

export function AdPage({ ad, me, isFavorite = () => false, isMutual, toggleFavorite, onBack, onToggleSave, onChanged, onCompany, publicView = false, onPublicApply, news }) {
  const [chat, setChat] = useState(false);
  const x = ad.application;
  const st = x?.status;
  const changedInterview = !x?.interview_confirmed_at && (x?.interview_changed || news?.rows.find(row => row.application_id === x?.id)?.events?.some(event => event.kind === "interview_changed"));
  const [apply, setApply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const avatar = ad.company_avatar_path ? companyAvatarUrl(ad.company_avatar_path) : "";
  useEffect(() => { if (!publicView && ad.live) supabase.rpc("job_ad_mark_viewed", { p_ad_id: ad.id }); }, [ad.id, publicView]);

  async function run(fn, args) {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) setErr(error.message || "Nepavyko."); else {
      if (fn === "job_ad_confirm_interview") {
        const row = news?.rows.find(row => row.application_id === x.id);
        const events = row?.events?.filter(event => ["interview", "interview_changed"].includes(event.kind));
        if (events?.length) try { await news.mark({ ...row, events }); } catch { setErr("Pokalbis patvirtintas, bet nepavyko atnaujinti naujienos žymėjimo."); }
      }
      onChanged(); news?.reload();
    }
  }
  async function uploadCv(file) {
    if (!file) return;
    setBusy(true); setErr("");
    let path = "";
    try {
      const ready = await prepareUpload(file, {
        types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg", "image/png", "image/webp", ".pdf", ".doc", ".docx"],
        maxBytes: 10 * MB, maxSide: 2000,
        badType: "Tinka PDF, Word arba nuotrauka.", tooBig: "Failas per didelis – iki 10 MB.",
      });
      const ext = safeExt(ready, "pdf");
      const contentType = ready.type || { doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }[ext] || "application/pdf";
      path = `${x.id}/cv-${Date.now()}.${ext}`;
      const up1 = await supabase.storage.from("job-ad-cv").upload(path, ready, { contentType, upsert: false });
      if (up1.error) { path = ""; throw up1.error; }
      const r = await supabase.rpc("job_ad_attach_cv", { p_application_id: x.id, p_path: path, p_name: file.name.slice(0, 160) });
      if (r.error) throw r.error;
      path = "";
      onChanged();
    } catch (e) {
      if (path) await supabase.storage.from("job-ad-cv").remove([path]);
      setErr(e?.message || "Nepavyko įkelti CV.");
    }
    finally { setBusy(false); }
  }

  const steps = [["sent", "Išsiųsta"], ["viewed", "Peržiūrėjo"], ["interview", "Pokalbis"]];
  const si = st === "rejected" ? -1 : steps.findIndex((s) => s[0] === st);
  const fav = isFavorite(ad.company_id);

  const act = publicView ? <><button className="btn primary jd-wide" type="button" onClick={onPublicApply}>Kandidatuoti</button><p className="small muted" style={{ margin: 0 }}>Norėdami kandidatuoti, prisijunkite arba susikurkite darbuotojo paskyrą.</p></>
    : st === "withdrawn" ? <p className="small muted">Kandidatūra atšaukta. Į šį skelbimą jau kandidatavote; pakartotinai kandidatuoti negalima.</p> : x ? (
    <>
      <div className="adtrack">{st === "rejected"
        ? <p className="small muted" style={{ margin: 0 }}>Įmonė pasirinko kitą kandidatą.</p>
        : steps.map(([k, t], i) => <div key={k} className={`ats${i <= si ? " on" : ""}`}><i>{i <= si ? <Svg name="check" size={12} width={3} /> : null}</i><span>{t}</span></div>)}</div>
      {st !== "rejected" && x.cv_requested_at ? (x.cv_sent_at
        ? <div className="cvbox ok" role="status"><Svg name="file" size={22} /><div className="cv-file"><b>CV išsiųstas</b><span className="cv-filename">{x.cv_name || "CV failas"}</span><small>Įkeltas · matomas šiai įmonei</small></div><Svg name="check" size={16} width={2.6} /></div>
        : <div className="cvbox"><span className="ivk">Įmonė prašo CV</span><span>Jai trūksta informacijos apie jus. Įkelkite CV – jį matys tik ši įmonė.</span>
            <label className={`btn primary jd-wide cvup${busy ? " dis" : ""}`}><Svg name="upload" size={16} />{busy ? "Įkeliama..." : "Įkelti CV"}<input type="file" hidden disabled={busy} accept=".pdf,.doc,.docx,image/*" onChange={(e) => uploadCv(e.target.files?.[0])} /></label></div>) : null}
      {st === "interview" && x.interview_at ? (
        <div className={`ivcard${changedInterview ? " changed" : ""}`}><span className="ivk">{IV_HOW[x.interview_how]} · pokalbis</span><b>{ivWhen(x.interview_at)}</b>{changedInterview ? <strong className="iv-change">Pakeisti pokalbio duomenys. Patvirtinkite iš naujo.</strong> : null}
          <span>{x.interview_how === "live" ? `${IV_HOW[x.interview_how]} · ${x.interview_address || ""}` : "Įmonė susisieks jūsų profilyje nurodytu telefono numeriu."}</span>
          {x.interview_note ? <span className="small iv-note"><b>Pastaba</b>{x.interview_note}</span> : null}
          {x.interview_how === "live" && x.interview_address ? <a className="jd-map" href={mapLink(x.interview_address)} target="_blank" rel="noopener noreferrer">Rodyti žemėlapyje ↗</a> : null}
          {x.interview_confirmed_at ? <span className="ivok"><Svg name="check" size={13} width={3} />Patvirtinote</span>
            : <button className="btn primary jd-wide" type="button" disabled={busy} onClick={() => run("job_ad_confirm_interview", { p_application_id: x.id })}>Patvirtinti pokalbį</button>}
        </div>) : null}
      <button className="btn jd-wide" type="button" onClick={() => setChat(true)}><Svg name="chat" size={16} />{st === "rejected" ? "Peržiūrėti žinutes" : "Rašyti įmonei"}</button>
    </>
  ) : ad.live ? (
    <>
      {ad.nudged ? <div className="nudge"><Svg name="send" size={15} width={2.2} /><span><b>Įmonė kviečia kandidatuoti.</b> Ji matė, kad įsiminėte skelbimą, ir jūsų profilis jai tinka.</span></div> : null}
      <button className="btn primary jd-wide" type="button" onClick={() => setApply(true)}>Kandidatuoti</button>

    </>
  ) : <p className="small muted" style={{ margin: 0 }}>Skelbimas nebegalioja.</p>;

  return (
    <>
      <header className="jd-hero">
        <div className="jd-titlerow"><h1>{up(ad.title)}</h1>{isAdBoosted(ad) ? <Pill tone="blue">Iškeltas</Pill> : null}{st ? <Pill tone={changedInterview ? "red" : AD_ST[st]?.[1]}>{changedInterview ? "Pokalbis pakeistas" : AD_ST[st]?.[0]}</Pill> : null}{isMutual?.(ad.company_id) ? <span className="pill team"><Svg name="people" size={13} width={2.2} />Nuolatinė komanda</span> : null}</div>
        <div className="jd-meta">
          {!publicView ? <button type="button" className={`favbtn${fav ? " on" : ""}`} aria-pressed={fav} title={fav ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"} aria-label={fav ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"}
            onClick={() => toggleFavorite(ad.company_id, { name: ad.company_name, avatar_path: ad.company_avatar_path })}><Heart size={17} on={fav} /></button> : null}
          <span className="jd-co-chip"><span className="av co sm" style={{ overflow: "hidden" }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(String(ad.company_name || "").replace(/^(UAB|MB)\s+/, ""))}</span>{ad.company_name}</span>
          <span><Svg name="pin" size={16} />{ad.city}</span>
          {ad.published_at ? <span><Svg name="cal" size={16} />Įkelta prieš {daysAgo(ad.published_at)} d.</span> : null}
        </div>
      </header>
      <div className="jd-grid">
        <JobAdContent ad={ad} />
        <aside className="jd-side">
          <section className="card jd-pay"><span className="jd-paylab">Atlyginimas {salKind(ad)}</span><div className="jd-pay-top"><b>{salTxt(ad)}</b>{!publicView && ad.live ? <SaveBtn ad={ad} onToggle={onToggleSave} /> : null}</div><span>per mėnesį</span></section>
          <section className="card jd-act">
            {x ? <AdNews news={news} applicationId={x.id} hideInterview={st === "interview" && !x.interview_confirmed_at} /> : null}
            {act}
            {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
            {!publicView ? <button className="btn jd-wide" type="button" onClick={() => onCompany(ad)}><Svg name="home" size={16} />Įmonės profilis</button> : null}
            {ad.live ? <ShareJobAdButton ad={ad} className="btn jd-wide" /> : null}
          </section>
          {ad.live && ad.expires_at ? <p className="small muted adexp">Skelbimas galioja dar {daysLeft(ad.expires_at)} d.</p> : null}
        </aside>
      </div>
      {apply && <ApplyModal ad={ad} me={me} onClose={() => setApply(false)} onSent={() => { setApply(false); onChanged(); }} />}
      {chat && x ? <AdChat applicationId={x.id} title={ad.company_name || "Įmonė"} sub={ad.title} onRead={news?.reload} closed={["rejected", "withdrawn"].includes(st)} onClose={() => setChat(false)} /> : null}
    </>
  );
}

export function WorkerAds({ data, me, isFavorite, isMutual, toggleFavorite, onCompany, initialAdId, onInitialAdHandled }) {
  const { ads, setAds, loaded, error, reload, news } = data;
  const boostNow = useBoostClock();
  const [tab, setTab] = useState("all");
  const [city, setCity] = useState("Visi");
  const [openId, setOpenId] = useState(initialAdId || null);
  const [initialMissing, setInitialMissing] = useState(false);
  useEffect(() => {
    if (!initialAdId || !loaded || error) return;
    setOpenId(initialAdId);
    setInitialMissing(!ads.some(ad => ad.id === initialAdId));
    onInitialAdHandled?.();
  }, [initialAdId, loaded, error, ads, onInitialAdHandled]);
  const open = ads.find((a) => a.id === openId);

  async function toggleSave(ad) {
    const next = !ad.saved;
    setAds((cur) => cur.map((a) => (a.id === ad.id ? { ...a, saved: next } : a)));
    const { error: e } = await supabase.rpc("job_ad_set_saved", { p_ad_id: ad.id, p_saved: next });
    if (e) setAds((cur) => cur.map((a) => (a.id === ad.id ? { ...a, saved: !next } : a)));
  }
  const openAd = (ad) => { setOpenId(ad.id); window.scrollTo(0, 0); };

  const lists = useMemo(() => {
    const inCity = (a) => city === "Visi" || a.city === city;
    const live = ads.filter((a) => a.live);
    const all = live.filter(inCity).sort((a, b) => compareAdBoost(a, b, boostNow) || isFavorite(b.company_id) - isFavorite(a.company_id));
    const saved = live.filter((a) => a.saved);
    const mine = ads.filter((a) => a.application);
    return { all, saved, mine, savedInCity: saved.filter(inCity), cities: ["Visi", ...new Set([...AD_CITIES, ...live.map((a) => a.city)])], live };
  }, [ads, city, isFavorite, boostNow]);

  if (open) return <AdPage ad={open} me={me} isFavorite={isFavorite} isMutual={isMutual} toggleFavorite={toggleFavorite} onBack={() => setOpenId(null)} onToggleSave={toggleSave} onChanged={reload} onCompany={onCompany} news={news} />;

  const list = tab === "mine" ? lists.mine : tab === "saved" ? lists.savedInCity : lists.all;
  return (
    <>
      {news?.error ? <p className="ferr" role="alert">{news.error}</p> : null}
      {initialMissing ? <p className="ferr" role="alert">Pasirinktas skelbimas nepasiekiamas arba jo galiojimas pasibaigęs.</p> : null}
      <div className="head"><div><h1>Darbo skelbimai</h1><p className="lead">Nuolatinis darbas statybose. Kandidatuokite su savo statybos24 profiliu – CV nereikia.</p></div></div>
      <div className="adbar">
        <div className="toggle2 sm adtabs" role="group" aria-label="Skelbimai">
          <button type="button" aria-pressed={tab === "all"} onClick={() => setTab("all")}>Visi skelbimai</button>
          <button type="button" aria-pressed={tab === "saved"} onClick={() => setTab("saved")}><Heart size={14} on={tab === "saved"} />Įsiminti <span className="cnt">{lists.saved.length}</span></button>
          <button type="button" aria-pressed={tab === "mine"} onClick={() => setTab("mine")}><span className="hm">Mano kandidatūros</span><span className="hm2">Kandidatūros</span> <span className="cnt">{lists.mine.length}</span></button>
        </div>
        {tab !== "mine" ? (
          <label className="field adcity"><span className="sr">Miestas</span>
            <SiteSelect value={city} onChange={(e) => setCity(e.target.value)}>{lists.cities.map((c) => <option key={c} value={c}>{c === "Visi" ? "Visi miestai" : `${c} (${lists.live.filter((a) => a.city === c).length})`}</option>)}</SiteSelect>
          </label>) : null}
      </div>
      <section className="card">
        {!loaded ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>
          : error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p>
          : list.length ? <Paged items={list} render={(a) => <AdCard key={a.id} ad={a} fav={isFavorite(a.company_id)} newsCount={news?.count(a.application?.id)} mutual={isMutual?.(a.company_id)} onOpen={openAd} onToggleSave={toggleSave} />} />
          : tab === "mine" ? <Empty title="Kandidatūrų dar nėra" sub="Atidarykite skelbimą ir paspauskite „Kandidatuoti“." icon="briefcase" />
          : tab === "saved" ? <Empty title={lists.saved.length ? "Šiame mieste įsimintų skelbimų nėra" : "Įsimintų skelbimų dar nėra"} sub={lists.saved.length ? "Pasirinkite kitą miestą." : "Prie patikusio skelbimo paspauskite širdelę."} icon="briefcase" />
          : <Empty title={city === "Visi" ? "Skelbimų dar nėra" : "Šiame mieste skelbimų nėra"} sub={city === "Visi" ? "Kai įmonės įkels ilgalaikio darbo skelbimų, jie atsiras čia." : "Pasirinkite kitą miestą."} icon="briefcase" />}
      </section>
    </>
  );
}
