import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/config.js";
import { P24Shell, Svg } from "../Shell.jsx";
import "./QaSandbox.css";

// This is a self-contained QA view. It never invokes real jobs, billing, CV,
// email, SMS, chat, or applicant mutation endpoints.
const NAMES = {
  jobs: "Darbai", ads: "Skelbimai", candidates: "Kandidatai",
  workers: "Darbuotojai", employers: "Darbdaviai", invitations: "Kvietimai",
  interviews: "Pokalbiai", messages: "Žinutės", favorites: "Įsiminti skelbimai",
  notifications: "Pranešimai", documents: "CV / dokumentai", payments: "Mokėjimai",
  bookings: "Rezervacijos", attendance: "Darbo laikas", ratings: "Įvertinimai",
};
const ICONS = {
  jobs:"jobs",ads:"file",candidates:"people",workers:"user",employers:"home",
  invitations:"mail",interviews:"cal",messages:"chat",favorites:"heart",
  notifications:"bell",documents:"file",payments:"euro",bookings:"cal",
  attendance:"clock",ratings:"star",
};
const ROLE_TABS = {
  worker: ["jobs","ads","invitations","bookings","messages","notifications","documents","favorites","ratings","attendance"],
  employer: ["jobs","ads","candidates","interviews","workers","invitations","messages","bookings","payments","ratings"],
  admin: Object.keys(NAMES),
};
const ROLES = [
  { key:"worker", title:"Darbuotojas" },
  { key:"employer", title:"Darbdavys" },
  { key:"admin", title:"Administratorius" },
];
const STATUS = {
  active:"Aktyvus",open:"Atviras",invited:"Pakviestas",confirmed:"Patvirtinta",
  in_progress:"Vyksta",completed:"Baigta",cancelled:"Atšaukta",
  pending_payment:"Laukia apmokėjimo",expired:"Nebegalioja",removed:"Ištrinta",
  sent:"Kandidatavo",viewed:"Peržiūrėta",interview:"Pakviestas pokalbiui",
  rejected:"Atmesta",pending:"Laukia",accepted:"Priimta",declined:"Atmesta",
  unread:"Neskaityta",read:"Perskaityta",saved:"Įsiminta",test:"Testas",
  paid_demo:"Testinis mokėjimas",unpaid_demo:"Testinis neapmokėta",
  present:"Atvyko",missing:"Neatvyko",published_demo:"Testinis įvertinimas",
  applied_demo:"Kandidatavo (testas)",answered_demo:"Atsakyta (testas)",
};
const isExpandable = (section) => section === "candidates" || section === "interviews";
const shownTitle = (section, item) => section === "interviews"
  ? "Bandomasis kandidatas " + String(item.number).padStart(2,"0")
  : item.title;
const actionText = (name) => ({
  view:"Peržiūrėti",edit:"Redaguoti",delete:"Ištrinti",
  extend:"Pratęsti +30 d.",apply:"Kandidatuoti",invite:"Kviesti pokalbiui",
  confirm:"Patvirtinti",reject:"Atmesti",toggle:"Įsiminti / pašalinti",
  read:"Pažymėti perskaitytu",message:"Rašyti",
})[name] || name;

function actions(section, role) {
  if (section === "jobs") return role === "worker"
    ? ["view"] : ["view","edit","delete"];
  if (section === "ads") return role === "worker"
    ? ["view","apply"] : ["view","edit","extend","delete"];
  if (section === "candidates") return role === "worker"
    ? ["view"] : ["view","invite","reject"];
  if (section === "interviews") return ["view","confirm"];
  if (section === "invitations") return ["view","confirm","reject"];
  if (section === "favorites") return ["view","toggle"];
  if (section === "notifications") return ["view","read"];
  if (section === "messages") return ["view","message"];
  if (["payments","bookings","attendance","ratings"].includes(section))
    return ["view","confirm"];
  if (section === "workers" && role !== "worker") return ["view","invite"];
  return ["view"];
}

function ErrorBanner({ children }) {
  return <div className="qa-error" role="alert">{children}</div>;
}

export function QaSandbox({ onExit }) {
  const [role, setRole] = useState("worker");
  const [section, setSection] = useState("jobs");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");

  const api = useCallback(async (body) => {
    if (!supabase) throw new Error("Nepavyko prisijungti prie testavimo paslaugos.");
    const { data, error: invokeError } = await supabase.functions.invoke("qa-preview", { body });
    if (invokeError || !data?.ok) {
      const forbidden = invokeError?.context?.status === 403;
      throw new Error(forbidden
        ? "Ši paskyra neturi prieigos prie privataus testavimo režimo."
        : data?.error || "Nepavyko gauti testinių duomenų. Patikrinkite prisijungimą.");
    }
    return data;
  }, []);

  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try {
        const result = await api({ op:"read" });
        if (!stopped) {
          setState(result.state);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        if (!stopped) { setError(err.message); setLoading(false); }
      }
    }
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 12000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [api]);

  const sections = ROLE_TABS[role];
  const rows = useMemo(() => (state?.[section] || [])
    .filter((item) => role === "admin" || item.status !== "removed")
    .filter((item) => String(shownTitle(section, item) + " " + item.city + " " + item.status)
      .toLocaleLowerCase("lt-LT").includes(query.toLocaleLowerCase("lt-LT"))), [state,section,role,query]);

  const chooseRole = (key) => {
    setRole(key);
    setSection(ROLE_TABS[key][0]);
    setQuery("");
    setExpanded(new Set());
    setPreview(null);
  };
  const chooseSection = (key) => {
    setSection(key);
    setExpanded(new Set());
    setQuery("");
    setEditing(null);
    setPreview(null);
  };
  const save = async (body, label) => {
    const requestKey = body.id || body.op;
    setBusy(requestKey);
    setNotice("");
    setError("");
    try {
      const result = await api(body);
      setState(result.state);
      setNotice(label + " Tai tik bandomojo režimo veiksmas — tikri įrašai nepakeisti.");
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };
  const handleAction = async (action, item) => {
    if (action === "view") { setPreview(item); return; }
    if (action === "edit" || action === "message") {
      setEditing({ id:item.id, action });
      setDraft(action === "edit" ? item.title.replace(/^TESTAS\s*[–-]\s*/i, "") : "");
      return;
    }
    if (action === "delete" && !window.confirm("Ištrinti šį NETIKRĄ įrašą? Tikrų skelbimų tai nepaveiks.")) return;
    await save({op:"act",action,collection:section,id:item.id},
      actionText(action) + ": atlikta.");
  };
  const saveEdited = async (item) => {
    if (!editing || busy) return;
    const payload = editing.action === "edit" ? {title:draft} : {note:draft};
    await save({op:"act",collection:section,id:item.id,action:editing.action,...payload},
      editing.action === "edit" ? "Testinis pavadinimas atnaujintas." : "Testinė žinutė išsaugota.");
  };
  const reset = async () => {
    if (!window.confirm("Atstatyti VISUS testinius įrašus po 10? Tikri duomenys nebus paliesti.")) return;
    await save({op:"reset"},"Visi testiniai įrašai atstatyti po 10.");
    setExpanded(new Set());
  };

  const groups = [["Bandomieji duomenys",sections.map((key) => ({ key, label:NAMES[key], icon:ICONS[key] }))]];
  const tabs = sections.slice(0,4).map((key) => ({key,label:NAMES[key],icon:ICONS[key]}));
  return (
    <P24Shell groups={groups} tabs={tabs} current={section} onGo={chooseSection}
      extra={[{key:"qa-exit",label:"Grįžti į tikrą svetainę",onClick:onExit}]}>
      <div className="qa-banner">
        <div>
          <b>TESTAVIMO REŽIMAS · TIK NETIKRI DUOMENYS</b>
          <p>Privati, trims paskyroms skirta peržiūra. Bandomieji paspaudimai nepaveikia tikrų darbų, kandidatų, CV, mokėjimų ar žinučių.</p>
        </div>
        <button className="btn" type="button" onClick={onExit}>Grįžti į svetainę</button>
      </div>
      <div className="qa-roles" role="group" aria-label="Peržiūrima paskyra">
        {ROLES.map((option) => <button key={option.key} type="button"
          className={"btn" + (role === option.key ? " primary" : "")}
          aria-pressed={role === option.key} onClick={() => chooseRole(option.key)}>
          {option.title}
        </button>)}
      </div>
      <section className="qa-head">
        <div>
          <span className="qa-eyebrow">{ROLES.find((entry) => entry.key === role)?.title} · demonstracija</span>
          <h1>{NAMES[section]}</h1>
          <p className="muted small">Kiekvienai kategorijai paruošta po 10 skirtingų bandomųjų įrašų.</p>
        </div>
        <div className="qa-head-actions">
          <button className="btn" type="button" disabled={!state || Boolean(busy)} onClick={() => {
            void api({op:"read"}).then((result) => { setState(result.state); setNotice("Testiniai duomenys atnaujinti."); }).catch((err) => setError(err.message));
          }}>Atnaujinti</button>
          <button className="btn danger" type="button" disabled={!state || Boolean(busy)} onClick={reset}>Atstatyti visus po 10</button>
        </div>
      </section>
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {notice ? <div className="qa-notice" role="status">{notice}</div> : null}
      {loading ? <section className="card">Įkeliami bandomieji duomenys...</section> : null}
      {!loading && !state ? (
        <section className="card">
          <b>Testavimo režimas nepasiekiamas</b>
          <p>Duomenys prieinami tik prisijungus viena iš trijų patvirtintų paskyrų.</p>
          <button className="btn" type="button" onClick={onExit}>Grįžti į svetainę</button>
        </section>
      ) : null}
      {state ? <>
        <div className="qa-toolbar">
          <div className="qa-count">{rows.length} iš {state[section]?.length || 0} bandomųjų įrašų</div>
          <label className="qa-search"><Svg name="search" size={18} />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              aria-label="Ieškoti bandomųjų įrašų" placeholder="Ieškoti..." />
          </label>
        </div>
        <div className="qa-items">
          {rows.map((item) => {
            const open = expanded.has(item.id);
            const folded = isExpandable(section);
            return <article className="qa-item" key={item.id}>
              {folded ? (
                <button className="qa-fold" type="button" aria-expanded={open}
                  aria-controls={"qa-details-" + item.id}
                  onClick={() => setExpanded((old) => {
                    const copy = new Set(old);
                    if (copy.has(item.id)) copy.delete(item.id); else copy.add(item.id);
                    return copy;
                  })}>
                  <span>{shownTitle(section, item)}</span>
                  <Svg name="cal" size={16} />
                  <Svg size={16} paths={open
                    ? '<path d="m6 15 6-6 6 6"/>'
                    : '<path d="m6 9 6 6 6-6"/>'} />
                </button>
              ) : null}
              {(!folded || open) ? <div id={"qa-details-" + item.id} className="qa-item-content">
                <div className="qa-item-main">
                  {!folded ? <b>{shownTitle(section, item)}</b> : null}
                  <div className="qa-subline">
                    <span><Svg name="pin" size={14} />{item.city}</span>
                    <span className="qa-status">{STATUS[item.status] || item.status}</span>
                    {section === "ads" ? <span>Galioja dar {item.daysLeft || 0} d.</span> : null}
                    {item.amount ? <span>{Number(item.amount).toLocaleString("lt-LT",{minimumFractionDigits:2,maximumFractionDigits:2})} € (testas)</span> : null}
                  </div>
                  <p>{item.note}</p>
                </div>
                <div className="qa-actions">
                  {actions(section,role).map((action) =>
                    <button type="button" key={action} className={"btn sm" + (action === "delete" ? " danger" : "")}
                      disabled={Boolean(busy)} onClick={() => handleAction(action,item)}>
                      {busy === item.id ? "Vykdoma..." : actionText(action)}
                    </button>
                  )}
                </div>
                {editing?.id === item.id ? <div className="qa-editor">
                  <label htmlFor={"qa-edit-" + item.id}>{editing.action === "edit" ? "Naujas pavadinimas" : "Testinė žinutė"}</label>
                  <input id={"qa-edit-" + item.id} value={draft} maxLength={editing.action === "edit" ? 100 : 240}
                    onChange={(event) => setDraft(event.target.value)} />
                  <button className="btn primary" type="button" onClick={() => saveEdited(item)} disabled={Boolean(busy)}>Išsaugoti</button>
                  <button className="btn" type="button" onClick={() => setEditing(null)}>Atšaukti</button>
                </div> : null}
              </div> : null}
            </article>;
          })}
          {!rows.length ? <section className="card">Pagal pasirinktą paiešką testinių įrašų nerasta.</section> : null}
        </div>
      </> : null}
      {preview ? <div className="qa-overlay" role="presentation">
        <div className="qa-dialog" role="dialog" aria-modal="true" aria-label="Testinio įrašo peržiūra">
          <div className="qa-dialog-title">
            <b>{shownTitle(section,preview)}</b>
            <button className="btn sm" type="button" onClick={() => setPreview(null)}>Uždaryti</button>
          </div>
          <p><b>Bandomasis įrašas.</b> Ši peržiūra nenaudoja tikrų CV, sąskaitų ar pranešimų.</p>
          <p>Miestas: {preview.city}. Būsena: {STATUS[preview.status] || preview.status}.</p>
          <p>{preview.note}</p>
        </div>
      </div> : null}
    </P24Shell>
  );
}
