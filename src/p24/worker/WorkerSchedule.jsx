import { useState } from "react";

// Darbuotojo darbo grafikas – prototipo „wSchedule“ su tikru prieinamumu.
const WDS = ["Sk", "Pr", "An", "Tr", "Kt", "Pn", "Št"];
const WD = ["Sekmadienis", "Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis"];
const MON_S = ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rgp", "Rgs", "Spa", "Lap", "Grd"];
const MON_G = ["sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio", "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio"];
const TIMES = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);

function TimeSelect({ id, value, onChange, label }) {
  const options = TIMES.includes(value) ? TIMES : [value, ...TIMES];
  return (
    <select id={id} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((time) => <option key={time} value={time}>{time}</option>)}
    </select>
  );
}

export function WorkerSchedule({ days, availability, onUpdate, occupiedOn, validation, onSave, saving, saved, needsConfirm, onConfirm, confirming }) {
  const [quickFrom, setQuickFrom] = useState("07:00");
  const [quickTo, setQuickTo] = useState("18:00");
  const [repeat, setRepeat] = useState(false);
  const [edit, setEdit] = useState(null);
  const [editError, setEditError] = useState("");

  const dateOf = (iso) => new Date(`${iso}T12:00:00`);
  const applyQuick = (mode) => {
    days.forEach((day) => {
      if (occupiedOn(day.iso).length) return;
      const weekday = dateOf(day.iso).getDay();
      if (mode === "clear") onUpdate(day.iso, { available: false });
      else if (mode === "all" || (weekday >= 1 && weekday <= 5)) onUpdate(day.iso, { available: true, from: quickFrom, to: quickTo });
      else onUpdate(day.iso, { available: false });
    });
  };
  const toggleRepeat = () => {
    const next = !repeat;
    setRepeat(next);
    if (next) {
      days.slice(7).forEach((day, index) => {
        const source = availability[days[index].iso];
        if (source && !occupiedOn(day.iso).length) onUpdate(day.iso, { available: source.available, from: source.from, to: source.to });
      });
    }
  };
  const saveDay = () => {
    if (!edit) return;
    if (edit.from >= edit.to) { setEditError("Pabaigos laikas turi būti vėlesnis nei pradžios."); return; }
    onUpdate(edit.iso, { available: true, from: edit.from, to: edit.to });
    if (repeat) {
      const index = days.findIndex((day) => day.iso === edit.iso);
      if (index >= 0 && index < 7 && days[index + 7] && !occupiedOn(days[index + 7].iso).length) onUpdate(days[index + 7].iso, { available: true, from: edit.from, to: edit.to });
    }
    setEdit(null);
  };
  const dayOff = () => {
    if (!edit) return;
    onUpdate(edit.iso, { available: false });
    setEdit(null);
  };

  return (
    <>
      <h1 className="sr">Darbo grafikas</h1>
      <section className="card sched">
        <div className="squick">
          <div className="pair stime">
            <label className="field" htmlFor="qs-from"><span className="sr">Nuo</span><TimeSelect id="qs-from" label="Nuo" value={quickFrom} onChange={setQuickFrom} /></label>
            <span className="sdash">–</span>
            <label className="field" htmlFor="qs-to"><span className="sr">Iki</span><TimeSelect id="qs-to" label="Iki" value={quickTo} onChange={setQuickTo} /></label>
          </div>
          <div className="sbtns">
            <button className="btn dark" type="button" onClick={() => applyQuick("weekdays")}>Pr–Pn</button>
            <button className="btn dark" type="button" onClick={() => applyQuick("all")}>Visos dienos</button>
            <button className="btn primary" type="button" onClick={() => applyQuick("clear")}>Išvalyti</button>
          </div>
        </div>
        <div className="sgrid">
          {days.map((day, index) => {
            const date = dateOf(day.iso);
            const state = availability[day.iso] || { available: false, from: "08:00", to: "17:00" };
            const jobs = occupiedOn(day.iso);
            const status = jobs.length ? "locked" : state.available ? "free" : "busy";
            const chip = status === "locked" ? (
              <><span className="schip job">{jobs[0].start_time?.slice(0, 5)}–{jobs[0].end_time?.slice(0, 5)}</span><span className="slab">Įdarbintas</span></>
            ) : status === "free" ? <span className="schip sfree">{state.from}–{state.to}</span> : <span className="slab muted">Nenoriu dirbti</span>;
            const invalid = validation?.[day.iso];
            return (
              <button key={day.iso} type="button" className={`sday st-${status}${index === 0 ? " today" : ""}`} style={invalid ? { outline: "2px solid var(--red)" } : undefined} title={invalid || undefined}
                aria-label={`${WD[date.getDay()]} ${day.iso}: ${status === "busy" ? "nenoriu dirbti" : status === "locked" ? "įdarbintas" : `${state.from}–${state.to}`}`}
                onClick={() => { if (status === "locked") return; setEditError(""); setEdit({ iso: day.iso, from: state.available ? state.from : quickFrom, to: state.available ? state.to : quickTo }); }}>
                <span className="sdh">
                  <span className="swk">{index < 2 ? <><span className="lg">{index === 0 ? "Šiandien" : "Rytoj"}</span><span className="sh">{WDS[date.getDay()]}</span></> : WDS[date.getDay()]}</span>
                  <span className="smon">{MON_S[date.getMonth()]}</span>
                </span>
                <span className="sdn">{date.getDate()}</span>
                {chip}
              </button>
            );
          })}
        </div>
        <div className="srep">
          <div className="settx"><b>Kartoti kas savaitę</b><span>Antra savaitė užpildoma pagal pirmą</span></div>
          <button type="button" className={`tgl${repeat ? " on" : ""}`} role="switch" aria-checked={repeat} aria-label="Kartoti grafiką kas savaitę" onClick={toggleRepeat}><i /></button>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {saved ? <span className="small" style={{ color: "var(--green)", fontWeight: 700 }}>Grafikas išsaugotas</span> : null}
          {needsConfirm ? <button className="btn" type="button" disabled={confirming} onClick={onConfirm}>{confirming ? "Patvirtinama..." : "Grafikas teisingas – patvirtinti"}</button> : null}
          <button className="btn primary" type="button" disabled={saving} onClick={onSave}>{saving ? "Saugoma..." : "Išsaugoti grafiką"}</button>
        </div>
      </section>

      <section className="card sinfo">
        <div className="sitable" role="table" aria-label="Grafikas ir matomumas">
          <div className="sir" role="row"><span role="cell" className="sik"><i className="lf" />Laisva diena</span><span role="cell">Darbdaviai jus randa paieškoje tik tą dieną ir tik nurodytu laiku.</span></div>
          <div className="sir" role="row"><span role="cell" className="sik"><i className="lb" />Nenoriu dirbti</span><span role="cell">Tą dieną paieškoje nerodomi ir kvietimų negaunate.</span></div>
          <div className="sir" role="row"><span role="cell" className="sik"><i className="lj" />Įdarbintas</span><span role="cell">Šiuo laiku dirbate darbe, kurį priėmėte (jį rasite skiltyje „Mano darbai“). Laikas užrakintas ir jo keisti negalima. Kitus kvietimus galėsite gauti tik ne šiuo laiku – prieš ir po darbo paliekama 1 val. nuvykimui.</span></div>
        </div>
      </section>

      {edit && (
        <div className="modal-bg" onClick={(event) => { if (event.target === event.currentTarget) setEdit(null); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">
            <h2 id="m-title" className="dtitle">{WD[dateOf(edit.iso).getDay()]}, {MON_G[dateOf(edit.iso).getMonth()]} {dateOf(edit.iso).getDate()} d.</h2>
            <div className="pair">
              <label className="field" htmlFor="de-from">Nuo<TimeSelect id="de-from" label="Nuo" value={edit.from} onChange={(value) => setEdit({ ...edit, from: value })} /></label>
              <label className="field" htmlFor="de-to">Iki<TimeSelect id="de-to" label="Iki" value={edit.to} onChange={(value) => setEdit({ ...edit, to: value })} /></label>
            </div>
            <p className="small" style={{ color: "var(--red)", fontWeight: 600, margin: "-6px 0 0" }} role="alert">{editError}</p>
            <div className="dbtns">
              <button className="btn" type="button" onClick={dayOff}>Nenoriu dirbti</button>
              <button className="btn dark" type="button" onClick={saveDay}>Atlikta</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
