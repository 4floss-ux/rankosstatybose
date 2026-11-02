import { useState } from "react";
import { Svg } from "../Shell.jsx";

// Darbuotojo apžvalga – prototipo „wOverview“ išdėstymas su tikrais duomenimis.
const MON_S = ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rgp", "Rgs", "Spa", "Lap", "Grd"];
const MON_L = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const up = (value) => String(value || "").toLocaleUpperCase("lt-LT");
const num = (value) => String(value).replace(".", ",");
const initialsOf = (name) => String(name || "").replace(/^(UAB|MB|IĮ|AB)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "Į";

function itemEarnings(item) {
  const job = item.job || {};
  const minutes = Number(item.attendance?.worked_minutes || 0);
  const amount = Number(job.pay_amount || 0);
  if (!amount || !minutes) return 0;
  return job.pay_unit === "day" ? amount : (amount * minutes) / 60;
}

function RingCard({ open, onToggle, label, value, max, color, unit, sub }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const safe = Math.max(0, Math.min(Number(value) || 0, max));
  return (
    <button type="button" className={`ovcard ovbtn${open ? " sel" : ""}`} aria-expanded={open} onClick={onToggle}>
      <span className="ovtop"><small>{label}</small></span>
      <div className="ovrrow">
        <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - safe / max)} transform="rotate(-90 50 50)" />
          <text x="50" y="50" textAnchor="middle" fontFamily="Manrope,Inter,sans-serif" fontWeight="800" fontSize="24" fill="var(--navy)">{value === null ? "—" : num(value)}</text>
          <text x="50" y="66" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="var(--muted)">{unit}</text>
        </svg>
        <div className="ovrtx"><span>{sub}</span></div>
      </div>
      <span className="ovmore">{open ? "Slėpti" : "Plačiau"} <Svg size={14} paths={open ? '<path d="m18 15-6-6-6 6"/>' : '<path d="m6 9 6 6 6-6"/>'} /></span>
    </button>
  );
}

export function WorkerOverview({
  todayItem, todayIsToday, canCheckIn, onArrive, onDetails, onChat,
  pendingInvites, actionCount, unreadMessages, metrics, workdays, recentRatings,
  onGo, onOpenMessages, onReliabilityRules,
}) {
  const [openPanel, setOpenPanel] = useState(null);
  const now = new Date();
  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const months = [-5, -4, -3, -2, -1, 0].map((offset) => new Date(now.getFullYear(), now.getMonth() + offset, 1));
  const worked = (workdays || []).filter((item) => Number(item.attendance?.worked_minutes || 0) > 0 && item.job?.work_date);
  const hoursByMonth = months.map((date) => worked.filter((item) => item.job.work_date.startsWith(monthKey(date))).reduce((sum, item) => sum + Number(item.attendance.worked_minutes || 0), 0) / 60);
  const thisMonth = worked.filter((item) => item.job.work_date.startsWith(monthKey(now)));
  const monthHours = Math.round(hoursByMonth[5] * 10) / 10;
  const monthEarn = Math.round(thisMonth.reduce((sum, item) => sum + itemEarnings(item), 0));
  const maxHours = Math.max(10, ...hoursByMonth);
  const reliability = Math.round(Number(metrics.attendanceRate ?? 100));
  const rating = metrics.ratingAverage === null || metrics.ratingAverage === undefined ? null : Math.round(Number(metrics.ratingAverage) * 10) / 10;
  const toggle = (key) => setOpenPanel((current) => (current === key ? null : key));

  const tile = (icon, label, value, sub, onClick, hot) => (
    <button type="button" className={`ovcard ntile${hot ? " hot" : ""}`} onClick={onClick}>
      <span className="ovtop"><small>{label}</small><span className="ntic"><Svg name={icon} size={18} /></span></span>
      <b className="ovval">{value}</b>
      <span className="ovsub">{hot ? <i className="ovdot" /> : null}{sub}</span>
    </button>
  );

  const job = todayItem?.job;
  return (
    <>
      <h1 className="sr">Apžvalga</h1>
      {job && (
        <section className={`thero${todayIsToday ? "" : " tmr"}`}>
          <div className="th-l">
            <span className="th-eb"><i />{todayIsToday ? "Šiandien dirbate" : "Rytoj dirbate"}</span>
            <button type="button" className="th-title" onClick={() => onDetails(todayItem)}>{up(job.title)}</button>
            <div className="th-meta">
              <span><Svg name="clock" size={16} /><b>{job.start_time?.slice(0, 5) || "—"}–{job.end_time?.slice(0, 5) || "—"}</b></span>
              <span><Svg name="pin" size={16} />{job.address_text || job.city || "Adresas nenurodytas"}</span>
              <span><Svg name="home" size={16} />{todayItem.companyName || "Darbdavys"}</span>
            </div>
            {todayItem.attendance?.worker_check_in_at ? <span className="th-ok"><Svg name="check" size={14} width={2.8} />Atvykimas užfiksuotas</span> : null}
          </div>
          <div className="th-acts">
            {todayIsToday && canCheckIn ? (
              <button className="btn green" type="button" onClick={() => onArrive(todayItem)}><Svg name="check" size={17} width={2.6} />Atvykau</button>
            ) : null}
            {job.address_text ? (
              <a className="btn th-g" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address_text)}`} target="_blank" rel="noopener noreferrer"><Svg name="nav" size={16} />Nuvesti</a>
            ) : null}
            <button className="btn th-g" type="button" onClick={() => onChat(job)}><Svg name="chat" size={16} />Pokalbis</button>
          </div>
        </section>
      )}

      <section className="ovsec">
        <h2 className="sr">Dabar svarbiausia</h2>
        <div className="ntiles">
          {tile("mail", "Nauji kvietimai", pendingInvites, pendingInvites ? "Laukia jūsų atsakymo" : "Naujų kvietimų nėra", () => onGo("invites"), pendingInvites)}
          {tile("euro", "Uždirbta šį mėnesį", `≈ ${monthEarn} €`, `${num(monthHours)} val. · ${thisMonth.length} ${thisMonth.length === 1 ? "darbas" : "darbai"}`, () => toggle("hours"), false)}
          {tile("check", "Reikia veiksmo", actionCount, actionCount ? "Atvykimas ar dienos uždarymas" : "Veiksmų nėra", () => onGo("jobs"), actionCount)}
          {tile("chat", "Naujos žinutės", unreadMessages, unreadMessages ? "Atidarykite pokalbį" : "Visos perskaitytos", onOpenMessages, unreadMessages)}
        </div>
      </section>

      <section className="ovsec">
        <h2 className="sect">Mano statistika</h2>
        <div className="ovstats">
          <RingCard open={openPanel === "rel"} onToggle={() => toggle("rel")} label="Atvykimo patikimumas" value={reliability} max={100} color="var(--green)" unit="iš 100" sub={`Neatvykimų ${Number(metrics.noShowCount || 0)} · užbaigtų darbų ${Number(metrics.completedJobs || 0)}`} />
          <RingCard open={openPanel === "rate"} onToggle={() => toggle("rate")} label="Darbdavių įvertinimas" value={rating} max={10} color="var(--orange)" unit="iš 10" sub={metrics.ratingCount ? `Iš ${metrics.ratingCount} įvertinimų` : "Įvertinimų dar nėra"} />
          <button type="button" className={`ovcard ovhours ovbtn${openPanel === "hours" ? " sel" : ""}`} aria-expanded={openPanel === "hours"} onClick={() => toggle("hours")}>
            <div className="ovh-top">
              <div><small>Šį mėnesį išdirbta</small><div className="ovbig">{num(monthHours)}<span> val.</span></div></div>
              <div className="ovh-side"><b>≈ {monthEarn} €</b><span>į rankas</span></div>
            </div>
            <div className="minibars">
              {hoursByMonth.map((value, index) => (
                <div key={index}><i className={index === 5 ? "now" : ""} style={{ height: `${(value / maxHours) * 100}%` }} /><span>{MON_S[months[index].getMonth()]}</span></div>
              ))}
            </div>
            <span className="ovmore">{openPanel === "hours" ? "Slėpti" : "Plačiau"} <Svg size={14} paths={openPanel === "hours" ? '<path d="m18 15-6-6-6 6"/>' : '<path d="m6 9 6 6 6-6"/>'} /></span>
          </button>
        </div>

        {openPanel === "rel" && (
          <div className="ovdet card">
            <header>
              <div><h2>Atvykimo patikimumas</h2><p className="muted small">Kaip formuojasi jūsų {reliability} iš 100</p></div>
              <button type="button" className="linkb" onClick={onReliabilityRules}>Taisyklės</button>
            </header>
            <div className="ovkpis">
              <div><b>{Number(metrics.completedJobs || 0)}</b><span>Užbaigtų darbų</span></div>
              <div><b>{Number(metrics.noShowCount || 0)}</b><span>Neatvykimai</span></div>
              <div><b>{Number(metrics.reliabilityGoodJobsSincePenalty || 0)}</b><span>Darbai be pažeidimų</span></div>
            </div>
            <div className="infobox"><span className="infoic"><Svg name="shield" size={20} /></span><div><b>Kaip skaičiuojama</b><p>Neatvykimas ir nepagrįstas ankstyvas išėjimas sumažina patikimumą. Plačiau – „Taisyklės“.</p></div></div>
          </div>
        )}
        {openPanel === "rate" && (
          <div className="ovdet card">
            <header><div><h2>Darbdavių įvertinimai</h2><p className="muted small">{rating === null ? "Įvertinimų dar nėra" : `Vidurkis ${num(rating)} iš ${metrics.ratingCount} įvertinimų`}</p></div></header>
            <div className="ovrevs">
              {(recentRatings || []).length ? recentRatings.slice(0, 5).map((row, index) => (
                <div className="cpr" key={row.id || index}>
                  <span className="av co sm" style={{ border: "1px solid var(--line)" }}>{initialsOf(row.company_name)}</span>
                  <div>
                    <div className="cpr-top"><b>{row.company_name || "Darbdavys"}</b><span className="cpr-score">{row.score}/10</span></div>
                    {row.comment ? <p>{row.comment}</p> : null}
                    <small>{row.job_title ? up(row.job_title) : ""}{row.created_at ? `${row.job_title ? " · " : ""}${new Date(row.created_at).toLocaleDateString("lt-LT")}` : ""}</small>
                  </div>
                </div>
              )) : <p className="muted small">Kai darbdaviai įvertins jūsų darbą, įvertinimai atsiras čia.</p>}
            </div>
          </div>
        )}
        {openPanel === "hours" && (
          <div className="ovdet card">
            <header><div><h2>Išdirbtas laikas ir uždarbis</h2><p className="muted small">{MON_L[now.getMonth()]} · paskutiniai 6 mėnesiai</p></div></header>
            <div className="ovkpis">
              <div><b>{num(monthHours)} val.</b><span>Išdirbta šį mėnesį</span></div>
              <div><b>≈ {monthEarn} €</b><span>Uždirbta į rankas</span></div>
              <div><b>{thisMonth.length}</b><span>Užbaigti darbai</span></div>
              <div><b>{num(Math.round(hoursByMonth.reduce((a, b) => a + b, 0) * 10) / 10)} val.</b><span>Per 6 mėn.</span></div>
            </div>
            <div className="ovsplit">
              <div className="ovmonths">
                {months.map((date, index) => (
                  <div className="ovdr" key={index}><span>{MON_S[date.getMonth()]}</span><div className="ovdbar nv"><i style={{ width: `${(hoursByMonth[index] / maxHours) * 100}%` }} /></div><b>{num(Math.round(hoursByMonth[index] * 10) / 10)} val.</b></div>
                ))}
              </div>
              <div className="ovtl">
                <h3>Šio mėnesio darbai</h3>
                {thisMonth.length ? thisMonth.map((item) => (
                  <div className="ovtlr" key={item.id}><span className="ovtld nv" /><div><b>{up(item.job.title)}</b><span>{item.job.work_date} · {item.companyName || "Darbdavys"} · {num(Math.round(Number(item.attendance.worked_minutes) / 6) / 10)} val.</span></div><em className="money">{Math.round(itemEarnings(item))} €</em></div>
                )) : <p className="muted small">Šį mėnesį užbaigtų darbų dar nėra.</p>}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
