import { useState } from "react";
import { Svg } from "../Shell.jsx";
import { Empty, Pill, up } from "../ui.jsx";
import { localDateISO } from "../../lib/jobs.js";
import { PlanLock } from "./EmployerPeople.jsx";

/* Prototipo eCalendar: mėnesio tinklelis, aktyvūs (oranžiniai) ir pasibaigę (žali) darbai, pasirinktos dienos sąrašas. */

const MON = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const WD = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];
const chev = (d) => `<path d="${d}"/>`;
const ARR = { width: 26, height: 26, border: 0, background: "transparent", padding: 0, display: "grid", placeItems: "center", color: "var(--muted)", cursor: "pointer" };

export function EmployerCalendar({ locked, onPlans, jobs, isEnded, canCreate, renderCard, onOpenEnded, onNewOnDay }) {
  const todayKey = localDateISO(new Date());
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12); });
  const [day, setDay] = useState(todayKey);
  if (locked) return <PlanLock title="Darbų kalendorius" lead="Visi įmonės darbai pagal datą." plan="Business Pro" onPlans={onPlans} />;

  const start = new Date(month); start.setDate(1 - ((month.getDay() + 6) % 7));
  const byDay = new Map();
  for (const j of jobs) { const k = String(j.work_date || "").slice(0, 10); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(j); }
  for (const list of byDay.values()) list.sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const sel = byDay.get(day) || [];
  const emptySub = day < todayKey ? "Pasirinkite kitą dieną." : canCreate ? "Diena laisva – darbą sukursite paspaudę „+“ dienos kampe." : "Diena laisva.";
  const go = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12));

  return (
    <>
      <div className="head"><div><h1>Darbų kalendorius</h1><p className="lead">Visi įmonės darbai pagal datą.</p></div></div>
      <section className="card"><header>
        <div className="row" style={{ gap: 2, flexWrap: "nowrap" }}>
          <button type="button" style={ARR} aria-label="Ankstesnis mėnuo" onClick={() => go(-1)}><Svg size={16} width={2.4} paths={chev("m15 18-6-6 6-6")} /></button>
          <h2 style={{ margin: 0, whiteSpace: "nowrap" }}>{MON[month.getMonth()]} {month.getFullYear()}</h2>
          <button type="button" style={ARR} aria-label="Kitas mėnuo" onClick={() => go(1)}><Svg size={16} width={2.4} paths={chev("m9 18 6-6-6-6")} /></button>
        </div>
        <div className="row" style={{ gap: 6 }}><Pill tone="orange">Aktyvus</Pill><Pill tone="green">Pasibaigęs</Pill></div></header>
        <div style={{ overflowX: "auto" }}><div className="cal" style={{ minWidth: 300 }}>
          {WD.map((d) => <div className="wd" key={d}>{d}</div>)}
          {cells.map((d) => {
            const k = localDateISO(d); const ev = byDay.get(k) || [];
            return (
              <button key={k} type="button" className={`${d.getMonth() !== month.getMonth() ? "out" : ""}${k === todayKey ? " today" : ""}`} aria-pressed={day === k} aria-label={`${k}${ev.length ? `, darbų: ${ev.length}` : ""}`} onClick={() => setDay(k)}>
                <span className="dn">{d.getDate()}</span>
                {canCreate && k >= todayKey ? <span className="addday" role="button" tabIndex={-1} title="Sukurti darbą šiai dienai" onClick={(e) => { e.stopPropagation(); onNewOnDay(k); }}><Svg name="plus" size={12} width={2.6} /></span> : null}
                {ev.map((j) => <span key={j.id} className={`ev${isEnded(j) ? " g" : ""}`}>{j.title}</span>)}
              </button>
            );
          })}
        </div></div>
      </section>
      <section className="card calsel"><header><div><h2>{day}</h2></div></header>
        <div className="list">{sel.length ? sel.map((j) => isEnded(j) ? (
          <article key={j.id} className="job" tabIndex={0} role="link" onClick={() => onOpenEnded(j)} onKeyDown={(e) => { if (e.key === "Enter") onOpenEnded(j); }}>
            <div className="jm"><div className="jtop"><h3>{up(j.title)}</h3><Pill tone="green">Pasibaigęs</Pill></div></div>
          </article>
        ) : renderCard(j)) : <Empty title="Šią dieną darbų nėra" sub={emptySub} icon="cal" />}</div>
      </section>
    </>
  );
}
