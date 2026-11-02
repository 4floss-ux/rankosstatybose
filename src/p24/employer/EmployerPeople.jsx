import { Svg } from "../Shell.jsx";
import { Empty, initialsOf } from "../ui.jsx";
import { shortWorkerName, workerRecentActivityLabel } from "../../employer/plans.js";

/* Prototipo eFavorites ir eUrgent. Duomenys ir veiksmai – iš EmployerDashboard. */

const HEART = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor"/>';
const URGENT_CITIES = ["Vilnius", "Kaunas", "Klaipėda"];

function Av({ url, name }) {
  return <div className="av lt" style={{ overflow: "hidden" }}>{url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(name || "D")}</div>;
}

export function PlanLock({ title, lead, plan, onPlans }) {
  return (
    <>
      <div className="head"><div><h1>{title}</h1><p className="lead">{lead}</p></div></div>
      <section className="card">
        <div className="empty">
          <div className="ic"><Svg name="lock" size={20} width={2.2} /></div>
          <div><b>Prieinama {plan} plane</b><span>Atrakinkite šią funkciją pakeitę planą.</span></div>
        </div>
        <div className="row"><button className="btn primary" type="button" onClick={onPlans}><Svg name="lock" size={14} width={2.2} />Atrakinti su {plan}</button></div>
      </section>
    </>
  );
}

export function EmployerFavorites({ locked, onPlans, loading, workers, busyId, onRemove, onProfile }) {
  if (locked) return <PlanLock title="Mėgstami darbuotojai" lead="Juos galėsite pakviesti pirmiausia." plan="Business" onPlans={onPlans} />;
  return (
    <>
      <div className="head"><div><h1>Mėgstami darbuotojai</h1><p className="lead">Juos galėsite pakviesti pirmiausia.</p></div></div>
      <section className="card"><div className="list flatwk">
        {loading ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>
          : workers.length ? workers.map((w) => (
            <div className="wk fw" key={w.id}>
              <Av url={w.avatarUrl} name={w.name} />
              <div className="fwm">
                <div className="fwt"><b className="nm">{shortWorkerName(w.name)}</b><small className="muted">{w.city || ""}</small></div>
                {w.last_job_title ? <small className="muted fwl">Paskutinis darbas: <b>{w.last_job_title}</b>{w.last_work_date ? <span> · {w.last_work_date}</span> : null}</small> : null}
              </div>
              <div className="wa">
                <button type="button" className="favbtn on" aria-pressed="true" title="Pašalinti iš mėgstamų" disabled={busyId === w.id} onClick={() => onRemove(w)}><Svg size={17} paths={HEART} /></button>
                <button className="btn sm" type="button" onClick={() => onProfile(w)}><Svg name="user" size={15} />Profilis</button>
              </div>
            </div>
          )) : <Empty title="Mėgstamų darbuotojų dar nėra" sub="Užbaigę darbo dieną prie patikusio darbuotojo paspauskite širdelę." icon="star" />}
      </div></section>
    </>
  );
}

export function EmployerUrgent({ locked, onPlans, city, onCity, loading, error, completed, results, copied, onCopy, onProfile }) {
  if (locked) return <PlanLock title="Skubiai!" lead="Kas gali atvykti dirbti dabar. Skambinkite tiesiogiai." plan="Business Pro" onPlans={onPlans} />;
  return (
    <>
      <div className="head"><div><h1>Skubiai!</h1><p className="lead">Kas gali atvykti dirbti dabar. Skambinkite tiesiogiai.</p></div></div>
      <div className="adbar">
        <div className="chips" role="group" aria-label="Miestas">
          {URGENT_CITIES.map((c) => <button key={c} type="button" className="chip" aria-pressed={city === c} disabled={loading} onClick={() => onCity(c)}>{c}</button>)}
        </div>
      </div>
      {error && <p className="ferr" role="alert">{error}</p>}
      <section className="card"><div className="list">
        {loading ? <p className="muted small" style={{ margin: 0 }}>Ieškoma...</p>
          : results.length ? results.map((w) => (
            <div className="wk" key={w.worker_id}>
              <Av url={w.avatarUrl} name={w.display_name} />
              <div className="wn"><b className="nm">{shortWorkerName(w.display_name)}</b>
                <small>{workerRecentActivityLabel(w.urgent_updated_at) || w.city || ""}</small></div>
              <div className="wa">
                <a className="btn sm dark" href={`tel:${String(w.phone || "").replace(/\s/g, "")}`}><Svg name="phone" size={15} />{w.phone}</a>
                <button className="btn sm" type="button" onClick={() => onCopy(w.phone)}>{copied === w.phone ? "Nukopijuota" : "Kopijuoti"}</button>
                <button className="btn sm" type="button" onClick={() => onProfile(w)}><Svg name="user" size={15} />Profilis</button>
              </div>
            </div>
          )) : <Empty title="Šiame mieste šiuo metu laisvų ir aktyvių darbuotojų nerasta." sub="Pabandykite kitą miestą arba sukurkite įprastą darbo pasiūlymą." icon="search" />}
      </div></section>
    </>
  );
}
