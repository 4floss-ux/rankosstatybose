import { Svg } from "../Shell.jsx";
import { Empty, JobDetail, Paged, Pill, initialsOf } from "../ui.jsx";

/* Prototipo eJob / eEndedJob: darbdavio darbo puslapis. Visa logika – EmployerDashboard (perduodama per props). */

const TONE = { danger: "red", action: "orange", live: "green", ok: "green", pending: "blue" };
const HEART = (on) => `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"${on ? ' fill="currentColor"' : ""}/>`;

function Av({ w }) {
  return <div className="av lt" style={{ overflow: "hidden" }}>{w.avatarUrl ? <img src={w.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (w.initials || initialsOf(w.name || "D"))}</div>;
}
function WkRow({ w, sub, actions, extra, onProfile }) {
  return (
    <div className="wk">
      <Av w={w} />
      <div className="wn"><b className="nm">{w.name}</b>{sub ? <small>{sub}</small> : null}{extra}</div>
      <div className="wa">{actions}<button className="btn sm" type="button" onClick={onProfile}><Svg name="user" size={15} />Profilis</button></div>
    </div>
  );
}
const Unread = ({ n }) => (n > 0 ? <span className="nb" style={{ marginLeft: 6 }}>{Math.min(9, n)}</span> : null);

export function EmployerJob(p) {
  const { job, state, workers, workersLoading, candidates, declined, searching, searchOpen, source, setSource, canFavorites, favMatches, invitingAll,
    invitedIds, invitationStatuses, invitationByWorker, savedIds, savedBusy, canMetrics, canRate, attendanceSaving, responsibleName, responsibleRole, isMine,
    canHandover, isPro, canChat, unreadPrivate, unreadGroup, canEdit } = p;
  const a = p.actions;
  const ended = job.status === "completed";
  const cancelled = job.status === "cancelled";
  const need = Number(job.workers_needed || 0);
  const accN = ended ? workers.length : Number(job.confirmedCount || 0);
  const pending = Object.values(invitationStatuses || {}).filter((s) => s === "pending").length;
  const left = Math.max(0, need - accN);

  const pills = cancelled ? <Pill tone="red">Atšauktas</Pill> : ended ? <Pill tone="green">Įvykdyta</Pill> : state?.label ? <Pill tone={TONE[state.tone] || ""}>{state.label}</Pill> : null;

  const workerActions = (w) => {
    const at = w.attendance || {};
    const isConfirmed = w.bookingStatus === "confirmed";
    const canClose = isConfirmed && p.jobEnded && !at.finalized_at && !at.employer_outcome;
    const disputed = at.dispute_status === "disputed";
    const chat = w.invitationId ? (
      <button className="btn sm ghost" type="button" onClick={() => a.privateChat(w)}>Privati žinutė{canChat ? null : " · Business"}<Unread n={unreadPrivate(w.invitationId)} /></button>
    ) : null;
    const out = [];
    if (!at.finalized_at && !ended) out.push(<span key="c">{chat}</span>);
    if (disputed && at.id && at.employer_note?.trim() && at.worker_response_note?.trim()) out.push(<button key="d" className="btn sm" type="button" onClick={() => a.disputeChat(w)}>Ginčo pokalbis</button>);
    if (p.checkInOpen && isConfirmed && !at.finalized_at && !at.employer_check_in_at) out.push(<button key="a" className="btn sm green" type="button" disabled={attendanceSaving} onClick={() => a.checkIn(w)}>Patvirtinti atvykimą</button>);
    if (canClose) out.push(<button key="z" className="btn sm primary" type="button" disabled={attendanceSaving} onClick={() => a.closeDay(w)}>Uždaryti dieną</button>);
    if (at.finalized_at && at.final_outcome !== "no_show" && !w.rating && canRate) out.push(<button key="r" className="btn sm primary" type="button" onClick={() => a.rate(w)}>Įvertinti</button>);
    if (w.rating) out.push(<Pill key="s" tone="green">{w.rating.score}/10</Pill>);
    if (at.finalized_at && at.final_outcome !== "no_show") {
      const on = savedIds.has(w.id);
      out.push(<button key="f" type="button" className={`favbtn${on ? " on" : ""}`} aria-pressed={on} disabled={on || savedBusy === w.id} title={on ? "Mėgstamas darbuotojas" : canFavorites ? "Pridėti prie mėgstamų" : "Mėgstami – Business plane"} onClick={() => a.favorite(w)}><Svg size={17} paths={HEART(on)} /></button>);
    }
    return out;
  };
  const statusLine = (w) => {
    const at = w.attendance || {};
    if (at.dispute_status === "disputed") return <div className="wkst o"><Svg name="shield" size={13} width={2.4} />Ginčas · laukiama administratoriaus</div>;
    if (at.finalized_at) return <div className={`wkst ${["no_show", "left_early_unexcused"].includes(at.final_outcome) ? "o" : "g"}`}><Svg name="check" size={13} width={2.6} />{p.outcomeLabel(at)}</div>;
    if (at.employer_outcome) return <div className="wkst o"><Svg name="clock" size={13} width={2.4} />Laukiama darbuotojo patvirtinimo</div>;
    if (at.employer_check_in_at) return <div className="wkst g"><Svg name="check" size={13} width={2.6} />Atvykimas patvirtintas</div>;
    if (at.worker_check_in_at) return <div className="wkst o"><Svg name="clock" size={13} width={2.4} />Pažymėjo „Atvykau“</div>;
    return null;
  };

  const actionsCard = (
    <>
      {ended ? <button className="btn primary jd-wide" type="button" onClick={a.copy}>Kurti panašų darbą</button> : null}
      {!cancelled ? <button className="btn dark jd-wide" type="button" onClick={a.groupChat}><Svg name="chat" size={16} />Darbo pokalbis{canChat ? null : " · Business"}<Unread n={unreadGroup} /></button> : null}
      {!ended && !cancelled && canEdit ? <button className="btn jd-wide" type="button" onClick={a.edit}><Svg name="file" size={15} />Redaguoti sąlygas</button> : null}
      {!ended && !cancelled && !p.jobStarted ? <button className="btn danger jd-wide" type="button" onClick={a.cancel}>{accN ? "Atšaukti darbą" : "Ištrinti darbą"}</button> : null}
    </>
  );

  const side = ended || cancelled ? null : (
    <section className="card jd-co"><h2>Komanda</h2>
      <div className="jd-prog"><b>{accN}/{need}</b><span>darbuotojų patvirtino</span></div>
      <div className="jd-bar"><i style={{ width: `${Math.min(100, need ? (accN / need) * 100 : 0)}%` }} /></div>
      <p className="small muted" style={{ margin: 0 }}>{pending ? `Laukia atsakymo: ${pending}` : accN < need ? "Pakvieskite daugiau darbuotojų žemiau" : "Komanda surinkta"}</p>
      {isPro && accN < need ? <div className="prio sm"><Svg name="bolt" size={14} width={2.2} /><span>Rodoma darbuotojams pirmiau</span></div> : null}
      <div className="jd-resp"><small>Atsakingas</small>
        <div className="co-line"><div className="av lt sm">{initialsOf(responsibleName)}</div><div><b>{isMine ? "Jūs" : responsibleName}</b><small>{responsibleRole} · valdo darbą</small></div></div>
        {canHandover && canEdit ? <button className="btn sm jd-wide" type="button" onClick={a.edit}><Svg name="send" size={15} />Perduoti darbą</button> : null}
      </div>
    </section>
  );

  const alert = cancelled ? (
    <div className="alert"><div><b>Darbas atšauktas</b><p>Priežastis: {job.cancellation_reason || "Priežastis nenurodyta."}</p></div></div>
  ) : p.news ? <div className={`alert${p.news.tone === "red" ? "" : " blue"}`}><div><b>{p.news.label}</b></div></div> : null;

  const accepted = (
    <section className="card"><header><div><h2>{ended ? "Dirbę darbuotojai" : `Priėmę darbuotojai · ${accN}/${need}`}</h2></div></header>
      {workersLoading ? <p className="muted small" style={{ margin: 0 }}>Įkeliama...</p>
        : workers.length ? <Paged items={workers} render={(w) => (
          <div key={w.bookingId || w.id}>
            <WkRow w={w} sub={w.activityLabel || [w.city, `Atlikta darbų: ${Number(w.completedJobs || 0)}`].filter(Boolean).join(" · ")} actions={workerActions(w)} extra={statusLine(w)} onProfile={() => a.profile(w)} />
          </div>
        )} />
        : ended || cancelled ? <Empty title="Šiame darbe darbuotojų nebuvo." icon="people" />
        : <Empty title="Šiuo metu pasiūlymo dar nepriėmė nė vienas darbuotojas." sub="Pakvieskite laisvus darbuotojus žemiau." icon="people" />}
    </section>
  );

  const inviteBtn = (w) => {
    const invited = invitedIds.includes(w.id);
    const st = invitationStatuses[w.id];
    if (!invited) return <button className="btn sm primary" type="button" disabled={job.status !== "open"} onClick={() => a.invite(w)}>Kviesti</button>;
    const chat = invitationByWorker[w.id] ? <button className="btn sm ghost" type="button" onClick={() => a.inviteChat(w)}>Žinutė<Unread n={unreadPrivate(invitationByWorker[w.id].id)} /></button> : null;
    const pill = st === "accepted" ? <Pill tone="green">Priėmė</Pill> : st === "declined" ? <Pill>Atmetė</Pill> : st === "expired" ? <Pill>Užpildyta</Pill> : <Pill tone="orange">Laukia atsakymo</Pill>;
    return <>{chat}{pill}</>;
  };
  const invite = searchOpen ? (
    <section className="card"><header><div><h2>Kviesti darbuotojus</h2></div>
      <div className="segs invtabs" role="tablist" aria-label="Kviesti">
        <label><input type="radio" name="invt" checked={source !== "team"} onChange={() => setSource("available")} /><span>Laisvi darbuotojai</span></label>
        <label><input type="radio" name="invt" checked={source === "team"} onChange={() => (canFavorites ? setSource("team") : a.plans())} /><span>Mėgstami darbuotojai{canFavorites ? "" : " · Business"}</span></label>
      </div></header>
      <div className="invnote"><Svg name="bolt" size={15} /><span>Kviesti galite kiek norite – <b>{left} {left === 1 ? "vietą" : "vietas"}</b> užims pirmieji priėmę. Kitiems kvietimas nebegalios automatiškai.</span></div>
      {source === "team" && favMatches > 0 ? (
        <div className="favall"><span><b>{favMatches}</b> {favMatches === 1 ? "mėgstamas laisvas" : "mėgstami laisvi"} šiam darbui</span>
          <button className="btn sm primary" type="button" disabled={invitingAll} onClick={a.inviteFavs}><Svg name="send" size={15} />{invitingAll ? "Siunčiama..." : `Pakviesti tinkamus · ${favMatches}`}</button></div>
      ) : null}
      {searching ? <p className="muted small" style={{ margin: 0 }}>Ieškoma...</p>
        : candidates.length ? <Paged items={candidates} render={(w) => (
          <div key={w.id}><WkRow w={w} sub={[w.activityLabel, p.distance(w)].filter(Boolean).join(" · ") || w.city} actions={inviteBtn(w)} onProfile={() => a.profile(w)} /></div>
        )} />
        : <Empty title={source === "team" ? "Tinkamų mėgstamų darbuotojų nėra" : "Papildomų laisvų darbuotojų nerasta"} sub={source === "team" ? "Nė vienas mėgstamas darbuotojas šiuo metu neatitinka šio darbo laiko ir vietos." : "Šiuo metu papildomų laisvų darbuotojų pagal šiuos kriterijus nerasta."} icon="search" />}
    </section>
  ) : null;

  const declinedCard = declined.length && !ended && !cancelled ? (
    <section className="card"><header><div><h2>Atsisakę · {declined.length}</h2></div></header>
      <div className="list">{declined.map((w) => <WkRow key={w.id} w={w} sub={w.city} actions={null} onProfile={() => a.profile(w)} />)}</div></section>
  ) : null;

  return (
    <JobDetail job={job} pills={pills} alert={alert} actions={actionsCard} side={side}
      mainExtra={<>{accepted}{invite}{declinedCard}</>} />
  );
}
