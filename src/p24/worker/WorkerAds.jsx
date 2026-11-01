import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/config.js";
import { companyAvatarUrl } from "../../ui/avatars.jsx";
import { Svg } from "../Shell.jsx";
import { Empty, Paged, Pill, initialsOf, up } from "../ui.jsx";

/* Darbo skelbimai darbuotojui (prototipo wAds / wAd / adApply). Duomenys – RPC job_ads_worker_list ir kt. */

const AD_ST = { sent: ["Išsiųsta", "blue"], viewed: ["Peržiūrėta", "blue"], interview: ["Kviečia pokalbiui", "green"], rejected: ["Atmesta", ""] };
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
  return (x.status === "interview" && !x.interview_confirmed_at) || (x.cv_requested_at && !x.cv_sent_at && x.status !== "rejected");
}

/* Bendras duomenų „kabliukas“ – naudojamas ir meniu ženkliukui. */
export function useWorkerAds(enabled) {
  const [ads, setAds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("job_ads_worker_list");
    if (e) setError(e.message || "Nepavyko įkelti skelbimų.");
    else { setError(""); setAds(Array.isArray(data) ? data : []); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (enabled) reload(); else setLoaded(true); }, [enabled, reload]);
  return { ads, setAds, loaded, error, reload, actionCount: ads.filter(needsAction).length };
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

function AdCard({ ad, fav, onOpen, onToggleSave }) {
  const x = ad.application;
  const avatar = ad.company_avatar_path ? companyAvatarUrl(ad.company_avatar_path) : "";
  return (
    <article className="job" tabIndex={0} role="link" aria-label={up(ad.title)} onClick={() => onOpen(ad)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(ad); }}>
      <div className="jm">
        <div className="jtop"><h3>{up(ad.title)}</h3>
          <div className="row jpills">
            {x && x.cv_requested_at && !x.cv_sent_at && x.status !== "rejected" ? <Pill tone="orange">Prašo CV</Pill> : null}
            {x ? <Pill tone={AD_ST[x.status]?.[1]}>{AD_ST[x.status]?.[0]}</Pill> : ad.nudged ? <Pill tone="orange">Kviečia kandidatuoti</Pill> : null}
            {!ad.live ? <Pill>Nebegalioja</Pill> : null}
          </div>
        </div>
        <div className="co-line">
          <div className="av co sm" style={{ border: "1px solid var(--line)", overflow: "hidden" }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(String(ad.company_name || "").replace(/^(UAB|MB)\s+/, ""))}</div>
          <div><b className="nm">{ad.company_name}{fav ? <span className="cofav" title="Mėgstama įmonė"><Heart size={13} on /></span> : null}</b></div>
        </div>
        <div className="adsal-m"><b>{salTxt(ad)}</b> {salKind(ad)} / mėn.</div>
      </div>
      <div className="adsal"><b>{salTxt(ad)}</b><span>{salKind(ad)} / mėn.</span></div>
      {x || !ad.live ? null : <SaveBtn ad={ad} onToggle={onToggleSave} />}
      <span className="jgo" aria-hidden="true"><Svg size={18} paths={chevron} /></span>
    </article>
  );
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

function AdPage({ ad, me, isFavorite, toggleFavorite, onBack, onToggleSave, onChanged, onCompany }) {
  const x = ad.application;
  const st = x?.status;
  const [apply, setApply] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const avatar = ad.company_avatar_path ? companyAvatarUrl(ad.company_avatar_path) : "";
  useEffect(() => { if (ad.live) supabase.rpc("job_ad_mark_viewed", { p_ad_id: ad.id }); }, [ad.id]);

  async function run(fn, args) {
    setBusy(true); setErr("");
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) setErr(error.message || "Nepavyko."); else onChanged();
  }
  async function uploadCv(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErr("Failas per didelis – iki 10 MB."); return; }
    setBusy(true); setErr("");
    try {
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "pdf";
      const path = `${x.id}/cv-${Date.now()}.${ext}`;
      const up1 = await supabase.storage.from("job-ad-cv").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (up1.error) throw up1.error;
      const r = await supabase.rpc("job_ad_attach_cv", { p_application_id: x.id, p_path: path, p_name: file.name.slice(0, 160) });
      if (r.error) throw r.error;
      onChanged();
    } catch (e) { setErr(e?.message || "Nepavyko įkelti CV."); }
    finally { setBusy(false); }
  }

  const steps = [["sent", "Išsiųsta"], ["viewed", "Peržiūrėjo"], ["interview", "Pokalbis"]];
  const si = st === "rejected" ? -1 : steps.findIndex((s) => s[0] === st);
  const fav = isFavorite(ad.company_id);

  const act = x ? (
    <>
      <div className="adtrack">{st === "rejected"
        ? <p className="small muted" style={{ margin: 0 }}>Įmonė pasirinko kitą kandidatą.</p>
        : steps.map(([k, t], i) => <div key={k} className={`ats${i <= si ? " on" : ""}`}><i>{i <= si ? <Svg name="check" size={12} width={3} /> : null}</i><span>{t}</span></div>)}</div>
      {st !== "rejected" && x.cv_requested_at ? (x.cv_sent_at
        ? <div className="cvbox ok"><Svg name="check" size={15} width={2.6} /><span><b>CV išsiųstas</b> {x.cv_name}</span></div>
        : <div className="cvbox"><span className="ivk">Įmonė prašo CV</span><span>Jai trūksta informacijos apie jus. Įkelkite CV – jį matys tik ši įmonė.</span>
            <label className={`btn primary jd-wide cvup${busy ? " dis" : ""}`}><Svg name="upload" size={16} />{busy ? "Įkeliama..." : "Įkelti CV"}<input type="file" hidden disabled={busy} accept=".pdf,.doc,.docx,image/*" onChange={(e) => uploadCv(e.target.files?.[0])} /></label></div>) : null}
      {st === "interview" && x.interview_at ? (
        <div className="ivcard"><span className="ivk">Pokalbis</span><b>{ivWhen(x.interview_at)}</b>
          <span>{IV_HOW[x.interview_how]}{x.interview_how === "live" ? ` · ${x.interview_address || ""}` : " – įmonė paskambins"}</span>
          {x.interview_note ? <span className="small">„{x.interview_note}“</span> : null}
          {x.interview_how === "live" && x.interview_address ? <a className="jd-map" href={mapLink(x.interview_address)} target="_blank" rel="noopener noreferrer">Rodyti žemėlapyje ↗</a> : null}
          {x.interview_confirmed_at ? <span className="ivok"><Svg name="check" size={13} width={3} />Patvirtinote</span>
            : <button className="btn primary jd-wide" type="button" disabled={busy} onClick={() => run("job_ad_confirm_interview", { p_application_id: x.id })}>Patvirtinti pokalbį</button>}
        </div>) : null}
      {st !== "rejected" ? <button className="btn jd-wide" type="button" disabled={busy} onClick={() => { if (window.confirm("Atšaukti kandidatūrą?")) run("job_ad_withdraw", { p_application_id: x.id }); }}>Atšaukti kandidatūrą</button> : null}
    </>
  ) : ad.live ? (
    <>
      {ad.nudged ? <div className="nudge"><Svg name="send" size={15} width={2.2} /><span><b>Įmonė kviečia kandidatuoti.</b> Ji matė, kad įsiminėte skelbimą, ir jūsų profilis jai tinka.</span></div> : null}
      <button className="btn primary jd-wide" type="button" onClick={() => setApply(true)}>Kandidatuoti</button>
      <SaveBtn ad={ad} label onToggle={onToggleSave} />
      <p className="small muted" style={{ margin: 0, textAlign: "center" }}>Įmonė matys jūsų profilį, patikimumą ir įvertinimus</p>
    </>
  ) : <p className="small muted" style={{ margin: 0 }}>Skelbimas nebegalioja.</p>;

  return (
    <>
      <div className="row" style={{ marginBottom: 4 }}><button type="button" className="btn sm ghost" onClick={onBack}><Svg name="back" size={15} width={2.4} />Visi skelbimai</button></div>
      <header className="jd-hero">
        <div className="jd-titlerow"><h1>{up(ad.title)}</h1>{st ? <Pill tone={AD_ST[st]?.[1]}>{AD_ST[st]?.[0]}</Pill> : null}</div>
        <div className="jd-meta">
          <button type="button" className={`favbtn${fav ? " on" : ""}`} aria-pressed={fav} title={fav ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"} aria-label={fav ? "Pašalinti iš mėgstamų įmonių" : "Pridėti prie mėgstamų įmonių"}
            onClick={() => toggleFavorite(ad.company_id, { name: ad.company_name, avatar_path: ad.company_avatar_path })}><Heart size={17} on={fav} /></button>
          <span className="jd-co-chip"><span className="av co sm" style={{ overflow: "hidden" }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(String(ad.company_name || "").replace(/^(UAB|MB)\s+/, ""))}</span>{ad.company_name}</span>
          <span><Svg name="pin" size={16} />{ad.city}</span>
          {ad.published_at ? <span><Svg name="cal" size={16} />Įkelta prieš {daysAgo(ad.published_at)} d.</span> : null}
        </div>
      </header>
      <div className="jd-grid">
        <div className="jd-main">
          <section className="card jd-sec"><h2>Apie darbą</h2><div className="jd-desc">{String(ad.description || "").split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div></section>
          <section className="card jd-sec"><h2>Sąlygos</h2><dl className="jd-dl">
            <div><dt><Svg name="file" size={17} />Sutartis</dt><dd>{ad.contract_type || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="clock" size={17} />Darbo grafikas</dt><dd>{ad.schedule || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="cal" size={17} />Darbo pradžia</dt><dd>{ad.start_text || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="pin" size={17} />Darbo vieta</dt><dd>{ad.address || ad.city}<a className="jd-map" href={mapLink(ad.address || ad.city)} target="_blank" rel="noopener noreferrer">Rodyti žemėlapyje ↗</a></dd></div>
          </dl></section>
          {(ad.requirements?.length || ad.offers?.length) ? (
            <div className="adcols">
              {ad.requirements?.length ? <section className="card jd-sec"><h2>Reikalavimai</h2><ul className="adlist">{ad.requirements.map((r, i) => <li key={i}><Svg name="check" size={15} width={2.4} />{r}</li>)}</ul></section> : null}
              {ad.offers?.length ? <section className="card jd-sec"><h2>Siūlome</h2><ul className="adlist">{ad.offers.map((r, i) => <li key={i}><Svg name="check" size={15} width={2.4} />{r}</li>)}</ul></section> : null}
            </div>) : null}
        </div>
        <aside className="jd-side">
          <section className="card jd-pay"><span className="jd-paylab">Atlyginimas {salKind(ad)}</span><b>{salTxt(ad)}</b><span>per mėnesį</span></section>
          <section className="card jd-act">
            {act}
            {err && <p className="ferr" role="alert" style={{ margin: 0 }}>{err}</p>}
            <button className="btn jd-wide" type="button" onClick={() => onCompany(ad)}><Svg name="home" size={16} />Įmonės profilis</button>
          </section>
          {ad.live && ad.expires_at ? <p className="small muted adexp">Skelbimas galioja dar {daysLeft(ad.expires_at)} d.</p> : null}
        </aside>
      </div>
      {apply && <ApplyModal ad={ad} me={me} onClose={() => setApply(false)} onSent={() => { setApply(false); onChanged(); }} />}
    </>
  );
}

export function WorkerAds({ data, me, isFavorite, toggleFavorite, onCompany }) {
  const { ads, setAds, loaded, error, reload } = data;
  const [tab, setTab] = useState("all");
  const [city, setCity] = useState("Visi");
  const [openId, setOpenId] = useState(null);
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
    const all = live.filter(inCity).sort((a, b) => isFavorite(b.company_id) - isFavorite(a.company_id));
    const saved = live.filter((a) => a.saved);
    const mine = ads.filter((a) => a.application);
    return { all, saved, mine, savedInCity: saved.filter(inCity), cities: ["Visi", ...new Set([...AD_CITIES, ...live.map((a) => a.city)])], live };
  }, [ads, city, isFavorite]);

  if (open) return <AdPage ad={open} me={me} isFavorite={isFavorite} toggleFavorite={toggleFavorite} onBack={() => setOpenId(null)} onToggleSave={toggleSave} onChanged={reload} onCompany={onCompany} />;

  const list = tab === "mine" ? lists.mine : tab === "saved" ? lists.savedInCity : lists.all;
  return (
    <>
      <div className="head"><div><h1>Darbo skelbimai</h1><p className="lead">Nuolatinis darbas statybose. Kandidatuokite su savo statybos24 profiliu – CV nereikia.</p></div></div>
      <div className="adbar">
        <div className="toggle2 sm adtabs" role="group" aria-label="Skelbimai">
          <button type="button" aria-pressed={tab === "all"} onClick={() => setTab("all")}>Visi skelbimai</button>
          <button type="button" aria-pressed={tab === "saved"} onClick={() => setTab("saved")}><Heart size={14} on={tab === "saved"} />Įsiminti <span className="cnt">{lists.saved.length}</span></button>
          <button type="button" aria-pressed={tab === "mine"} onClick={() => setTab("mine")}><span className="hm">Mano kandidatūros</span><span className="hm2">Kandidatūros</span> <span className="cnt">{lists.mine.length}</span></button>
        </div>
        {tab !== "mine" ? (
          <label className="field adcity"><span className="sr">Miestas</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}>{lists.cities.map((c) => <option key={c} value={c}>{c === "Visi" ? "Visi miestai" : `${c} (${lists.live.filter((a) => a.city === c).length})`}</option>)}</select>
          </label>) : null}
      </div>
      <section className="card">
        {!loaded ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>
          : error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p>
          : list.length ? <Paged items={list} render={(a) => <AdCard key={a.id} ad={a} fav={isFavorite(a.company_id)} onOpen={openAd} onToggleSave={toggleSave} />} />
          : tab === "mine" ? <Empty title="Kandidatūrų dar nėra" sub="Atidarykite skelbimą ir paspauskite „Kandidatuoti“." icon="briefcase" />
          : tab === "saved" ? <Empty title={lists.saved.length ? "Šiame mieste įsimintų skelbimų nėra" : "Įsimintų skelbimų dar nėra"} sub={lists.saved.length ? "Pasirinkite kitą miestą." : "Prie patikusio skelbimo paspauskite širdelę."} icon="briefcase" />
          : <Empty title={city === "Visi" ? "Skelbimų dar nėra" : "Šiame mieste skelbimų nėra"} sub={city === "Visi" ? "Kai įmonės įkels ilgalaikio darbo skelbimų, jie atsiras čia." : "Pasirinkite kitą miestą."} icon="briefcase" />}
      </section>
    </>
  );
}
