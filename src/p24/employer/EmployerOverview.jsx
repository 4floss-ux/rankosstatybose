import { useState } from "react";
import { Svg } from "../Shell.jsx";
import { Pill, up, dateText } from "../ui.jsx";

// Darbdavio apžvalga – prototipo „eOverview“ su tikrais darbais.
const TONE = { danger: "red", action: "orange", live: "green", ok: "green", pending: "blue" };

export function EmployerJobCard({ job, state, unread, responsibleLabel, onOpen }) {
  const accepted = Number(job.confirmedCount || 0);
  const attn = state?.tone === "danger" || state?.tone === "action";
  return (
    <article className={`job${attn ? " attn" : state?.key === "today" ? " jlive" : ""}`} tabIndex={0} role="link" aria-label={up(job.title)} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter") onOpen(); }}>
      <div className="jm">
        <div className="jtop">
          <h3>{up(job.title)}</h3>
          <div className="row jpills">
            {state?.label ? <Pill tone={TONE[state.tone] || ""}>{state.label}</Pill> : null}
            {unread ? <Pill tone="blue">{unread} {unread === 1 ? "nauja žinutė" : "naujos žinutės"}</Pill> : null}
          </div>
        </div>
        <div className="metrics">
          <span><Svg name="cal" size={16} />{dateText(job.work_date)} · {job.start_time?.slice(0, 5) || ""}</span>
          <span><Svg name="user" size={16} />{responsibleLabel || "Jūsų darbas"}</span>
          <span><Svg name="people" size={16} /><b>{accepted}/{Number(job.workers_needed || 0)}</b> žmonių</span>
        </div>
      </div>
      <span className="jgo" aria-hidden="true"><Svg size={18} paths='<path d="m9 18 6-6-6-6"/>' /></span>
    </article>
  );
}

export function EmployerOverview({ onOpenMessages, jobs, stateOf, unreadOf, responsibleOf, onOpenJob, onChat, onGo, unreadMessages, actionCount, company, stats, canStats }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayJobs = jobs.filter((job) => job.work_date === today && job.status !== "cancelled" && job.status !== "completed");
  const [heroIndex, setHeroIndex] = useState(0);
  const heroCount = todayJobs.length;
  const hero = heroCount ? todayJobs[((heroIndex % heroCount) + heroCount) % heroCount] : null;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const short = jobs.filter((job) => (stateOf(job)?.missing || 0) > 0 && job.status !== "cancelled" && job.status !== "completed").length;
  const nearest = jobs
    .slice()
    .sort((a, b) => {
      const sa = stateOf(a), sb = stateOf(b);
      const attnA = sa?.tone === "danger" || sa?.tone === "action" ? 0 : 1;
      const attnB = sb?.tone === "danger" || sb?.tone === "action" ? 0 : 1;
      return attnA - attnB || `${a.work_date}${a.start_time}`.localeCompare(`${b.work_date}${b.start_time}`);
    })
    .slice(0, 3);
  const tile = (icon, label, value, sub, onClick, hot) => (
    <button type="button" className={`ovcard ntile${hot ? " hot" : ""}`} onClick={onClick}>
      <span className="ovtop"><small>{label}</small><span className="ntic"><Svg name={icon} size={18} /></span></span>
      <b className="ovval">{value}</b>
      <span className="ovsub">{hot ? <i className="ovdot" /> : null}{sub}</span>
    </button>
  );
  const ring = (label, value, max, color, unit, sub) => {
    const R = 40, C = 2 * Math.PI * R;
    const safe = Math.max(0, Math.min(Number(value) || 0, max || 1));
    return (
      <button type="button" className="ovcard ovbtn" onClick={() => onGo("ended")}>
        <span className="ovtop"><small>{label}</small></span>
        <div className="ovrrow">
          <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - safe / (max || 1))} transform="rotate(-90 50 50)" />
            <text x="50" y="50" textAnchor="middle" fontFamily="Manrope,Inter,sans-serif" fontWeight="800" fontSize="24" fill="var(--navy)">{value}</text>
            <text x="50" y="66" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="var(--muted)">{unit}</text>
          </svg>
          <div className="ovrtx"><span>{sub}</span></div>
        </div>
        <span className="ovmore">Darbų istorija <Svg size={14} paths='<path d="m9 18 6-6-6-6"/>' /></span>
      </button>
    );
  };

  return (
    <>
      <h1 className="sr">Apžvalga</h1>
      {hero && (
        <section className="thero">
          <div className="th-l">
            <span className="th-eb"><i />{heroCount > 1 ? `Šiandien vyksta ${heroCount} darbai` : "Šiandien vyksta"}</span>
            <button type="button" className="th-title" onClick={() => onOpenJob(hero)}>{up(hero.title)}</button>
            <div className="th-meta">
              <span><Svg name="clock" size={16} /><b>{hero.start_time?.slice(0, 5) || "—"}–{hero.end_time?.slice(0, 5) || "—"}</b></span>
              <span><Svg name="pin" size={16} />{hero.address_text || hero.city || ""}</span>
              <span><Svg name="user" size={16} />{responsibleOf(hero)}</span>
            </div>
            <div className="th-arr"><span>Patvirtinta <b>{Number(hero.confirmedCount || 0)}/{Number(hero.workers_needed || 0)}</b></span></div>
          </div>
          <div className="th-r">
            <div className="th-acts">
              <button className="btn th-g" type="button" onClick={() => onOpenJob(hero)}>Atidaryti darbą</button>
              <button className="btn th-g" type="button" onClick={() => onChat(hero)}><Svg name="chat" size={16} />Pokalbis</button>
            </div>
            {heroCount > 1 && (
              <div className="th-nav">
                <button type="button" className="th-arw" aria-label="Ankstesnis darbas" onClick={() => setHeroIndex((value) => value - 1)}><Svg size={16} width={2.4} paths='<path d="m15 18-6-6 6-6"/>' /></button>
                <div className="th-dots" role="tablist" aria-label="Šiandienos darbai">
                  {todayJobs.map((job, index) => (
                    <button key={job.id} type="button" role="tab" className={`th-dot${job === hero ? " on" : ""}`} aria-selected={job === hero} title={up(job.title)} onClick={() => setHeroIndex(index)} />
                  ))}
                </div>
                <span className="th-cnt">{todayJobs.indexOf(hero) + 1} / {heroCount}</span>
                <button type="button" className="th-arw" aria-label="Kitas darbas" onClick={() => setHeroIndex((value) => value + 1)}><Svg size={16} width={2.4} paths='<path d="m9 18 6-6-6-6"/>' /></button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="ovsec">
        <div className="ntiles">
          {tile("jobs", "Aktyvūs darbai", jobs.length, `Šiandien ${jobs.filter((job) => job.work_date === today).length} · rytoj ${jobs.filter((job) => job.work_date === tomorrow).length}`, () => onGo("active"), false)}
          {tile("people", "Trūksta darbuotojų", short, short ? "Pakvieskite laisvus" : "Visi darbai užpildyti", () => onGo("active"), short)}
          {tile("check", "Reikia veiksmo", actionCount, actionCount ? "Atvykimai ir darbo dienos" : "Viskas sutvarkyta", () => onGo("active"), actionCount)}
          {tile("chat", "Naujos žinutės", unreadMessages, unreadMessages ? "Atidarykite pokalbį" : "Visos perskaitytos", onOpenMessages || (() => onGo("active")), unreadMessages)}
        </div>
      </section>

      <section className="ovsec">
        <h2 className="sect">Artimiausi darbai</h2>
        <section className="card">
          {nearest.length ? nearest.map((job) => (
            <EmployerJobCard key={job.id} job={job} state={stateOf(job)} unread={unreadOf(job)} responsibleLabel={responsibleOf(job)} onOpen={() => onOpenJob(job)} />
          )) : (
            <div className="empty"><div className="ic"><Svg name="plus" size={20} width={2.2} /></div><div><b>Aktyvių darbų nėra</b><span>Sukurkite darbo pasiūlymą – sistema parodys laisvus darbuotojus.</span></div></div>
          )}
          <div className="seeall"><button className="linkb" type="button" onClick={() => onGo(jobs.length ? "active" : "new")}>{jobs.length ? `Visi aktyvūs darbai (${jobs.length}) →` : "Sukurti darbo pasiūlymą →"}</button></div>
        </section>
      </section>

      {canStats && (
        <section className="ovsec">
          <h2 className="sect">Įmonės statistika</h2>
          <div className="ovstats">
            {ring("Įmonės patikimumas", Math.round(Number(company?.reliability_rate ?? 100)), 100, "var(--green)", "iš 100", `${Number(company?.cancelled_confirmed_count || 0)} atšaukta po patvirtinimo`)}
            {ring("Užpildyti darbai", Number(stats?.filledJobs || 0), Math.max(1, Number(stats?.totalJobs || 0)), "var(--orange)", `iš ${Number(stats?.totalJobs || 0)}`, `Trūko ${Number(stats?.missingWorkers || 0)} darbuotojų`)}
          </div>
        </section>
      )}
    </>
  );
}
