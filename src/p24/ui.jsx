import { useState } from "react";
import { Svg } from "./Shell.jsx";

// Bendri prototipo komponentai (pill, empty, co-line, puslapiavimas, darbo kortelė, darbo puslapis).
export const up = (value) => String(value || "").toLocaleUpperCase("lt-LT");
export const initialsOf = (name) =>
  String(name || "").replace(/^(UAB|MB|IĮ|AB|VšĮ)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "–";

const WD = ["sekmadienis", "pirmadienis", "antradienis", "trečiadienis", "ketvirtadienis", "penktadienis", "šeštadienis"];
const MON_G = ["sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio", "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio"];

export function dateText(iso) {
  if (!iso) return "Data nenurodyta";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date - today) / 86400000);
  const rel = diff === 0 ? "Šiandien" : diff === 1 ? "Rytoj" : diff === -1 ? "Vakar" : WD[date.getDay()][0].toUpperCase() + WD[date.getDay()].slice(1);
  return `${iso} · ${rel}`;
}

export function longDate(iso) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${WD[date.getDay()][0].toUpperCase()}${WD[date.getDay()].slice(1)}, ${MON_G[date.getMonth()]} ${date.getDate()} d.`;
}

export const timeRange = (job) => `${job?.start_time?.slice(0, 5) || "—"}–${job?.end_time?.slice(0, 5) || "—"}`;

export function Pill({ children, tone = "" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function Empty({ title, sub, icon = "check" }) {
  return (
    <div className="empty">
      <div className="ic"><Svg name={icon} size={20} width={2.2} /></div>
      <div><b>{title}</b><span>{sub}</span></div>
    </div>
  );
}

export function CoLine({ name, sub, avatar }) {
  return (
    <div className="co-line">
      <div className="av co sm" style={{ border: "1px solid var(--line)", overflow: "hidden" }}>
        {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(name)}
      </div>
      <div><b className="nm">{name}</b>{sub ? <small>{sub}</small> : null}</div>
    </div>
  );
}

const PER_PAGE = 8;
export function Paged({ items, render }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const from = current * PER_PAGE;
  const slice = items.slice(from, from + PER_PAGE);
  const nums = [];
  for (let index = 0; index < pages; index += 1) {
    if (pages <= 7 || index === 0 || index === pages - 1 || Math.abs(index - current) <= 1) nums.push(index);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <>
      <div className="list">{slice.map(render)}</div>
      {pages > 1 && (
        <nav className="pager" aria-label="Puslapiai">
          <span className="pinfo">Rodoma {from + 1}–{from + slice.length} iš {items.length}</span>
          <div className="pbtns">
            <button type="button" className="pbtn" disabled={current === 0} aria-label="Ankstesnis puslapis" onClick={() => setPage(current - 1)}><Svg name="back" size={16} width={2.2} /></button>
            {nums.map((value, index) => value === "…" ? <span key={`d${index}`} className="pdots">…</span> : (
              <button key={value} type="button" className={`pbtn${value === current ? " cur" : ""}`} aria-current={value === current ? "page" : undefined} onClick={() => setPage(value)}>{value + 1}</button>
            ))}
            <button type="button" className="pbtn" disabled={current === pages - 1} aria-label="Kitas puslapis" onClick={() => setPage(current + 1)}><Svg size={16} width={2.2} paths='<path d="m9 18 6-6-6-6"/>' /></button>
          </div>
        </nav>
      )}
    </>
  );
}

export function JobCard({ title, pills, company, companyAvatar, sub, locked, lockTip, onOpen }) {
  if (locked) {
    return (
      <article className="job locked" aria-disabled="true" data-tip={lockTip}>
        <div className="jm"><div className="jtop"><h3>{up(title)}</h3></div><CoLine name={company} avatar={companyAvatar} sub={sub} /></div>
        <span className="jgo" aria-hidden="true"><Svg name="lock" size={17} /></span>
      </article>
    );
  }
  return (
    <article className="job" tabIndex={0} role="link" aria-label={up(title)} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter") onOpen(); }}>
      <div className="jm">
        <div className="jtop"><h3>{up(title)}</h3><div className="row jpills">{pills}</div></div>
        <CoLine name={company} avatar={companyAvatar} sub={sub} />
      </div>
      <span className="jgo" aria-hidden="true"><Svg size={18} paths='<path d="m9 18 6-6-6-6"/>' /></span>
    </article>
  );
}

export function ListGroup({ title, count, hot, children }) {
  return (
    <div className={`lgroup${hot ? " hot" : ""}`}>
      <h2 className="lgh">{title} <span>{count}</span></h2>
      {children}
    </div>
  );
}

export function PageHead({ title, lead, children }) {
  return (
    <div className="head">
      <div><h1>{title}</h1>{lead ? <p className="lead">{lead}</p> : null}</div>
      {children ? <div className="row">{children}</div> : null}
    </div>
  );
}

// Prototipo „jobDetail“: antraštė, aprašymas, laikas/vieta, atlygis, veiksmai, šoninė informacija.
export function JobDetail({ job, company, companyAvatar, pills, metaExtra, alert, mainExtra, actions, side, payLabel, payUnit, hidePay }) {
  const paras = String(job?.description || "Darbo aprašymas nepateiktas.").split(/(?<=\.)\s+/).filter(Boolean);
  const lunch = job?.break_start_time && job?.break_end_time ? `${job.break_start_time.slice(0, 5)}–${job.break_end_time.slice(0, 5)}` : "Pietų pertraukos nėra";
  const arrival = job?.transport_mode === "employer_pickup" ? "Darbdavys paima darbuotoją" : "Darbuotojas atvyksta pats";
  return (
    <>
      <header className="jd-hero">
        <div className="jd-titlerow"><h1>{up(job?.title)}</h1>{pills}</div>
        <div className="jd-meta">
          {company ? (
            <span className="jd-co-chip">
              <span className="av co sm" style={{ overflow: "hidden" }}>{companyAvatar ? <img src={companyAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(company)}</span>
              {company}
            </span>
          ) : null}
          <span><Svg name="pin" size={16} />{job?.city || ""}</span>
          {metaExtra}
        </div>
      </header>
      <div className="jd-grid">
        <div className="jd-main">
          {alert}
          <section className="card jd-sec"><h2>Darbo aprašymas</h2><div className="jd-desc">{paras.map((text, index) => <p key={index}>{text}</p>)}</div></section>
          <section className="card jd-sec">
            <h2>Laikas, vieta ir sąlygos</h2>
            <dl className="jd-dl">
              <div><dt><Svg name="cal" size={17} />Data</dt><dd>{dateText(job?.work_date)}</dd></div>
              <div><dt><Svg name="clock" size={17} />Darbo laikas</dt><dd>{timeRange(job)}</dd></div>
              <div><dt><Svg name="clock" size={17} />Pietų pertrauka</dt><dd>{lunch}</dd></div>
              <div><dt><Svg name="pin" size={17} />Atvykti adresu</dt><dd>{job?.address_text || "Adresas nenurodytas"}{job?.address_text ? <a className="jd-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address_text)}`} target="_blank" rel="noopener noreferrer">Rodyti žemėlapyje ↗</a> : null}</dd></div>
              <div><dt><Svg name="car" size={17} />Atvykimas į darbo vietą</dt><dd>{arrival}</dd></div>
            </dl>
          </section>
          {mainExtra}
        </div>
        <aside className="jd-side">
          {!hidePay && (
            <section className="card jd-pay"><span className="jd-paylab">{payLabel || "Atlygis į rankas"}</span><b>{job?.pay_amount ? `${job.pay_amount} €` : "—"}</b><span>{payUnit || (job?.pay_unit === "day" ? "už dieną" : "už valandą")}</span></section>
          )}
          {actions ? <section className="card jd-act">{actions}</section> : null}
          {side}
        </aside>
      </div>
    </>
  );
}

export function ActionButtons({ items }) {
  return items.filter(Boolean).map((item) => (
    <button key={item.label} className={`btn jd-wide${item.kind ? ` ${item.kind}` : ""}`} type="button" disabled={item.disabled} onClick={item.onClick}>
      {item.icon ? <Svg name={item.icon} size={16} width={item.kind === "green" ? 2.4 : 2} /> : null}
      {item.label}
      {item.count ? <span className="nb" style={{ marginLeft: 6 }}>{item.count}</span> : null}
    </button>
  ));
}
