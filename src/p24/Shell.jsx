import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./p24.css";
import { I } from "./icons.js";

// Naujo dizaino (prototipo) paskyros rėmas: tie patys elementai ir klasės kaip prototipe
// (.side, .navwrap, .item, .topbar, .tabbar, .drawer), stiliai apriboti .p24 šaknimi.

export function Svg({ name, size = 20, width = 2, paths }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths || I[name] || "" }} />
  );
}

export function Badge({ value }) {
  if (value === undefined || value === null || value === "" || value === 0 || value === false) return null;
  if (value === "Pro" || value === "Business") return <em className="badge pro">{value}</em>;
  if (typeof value === "string") return <em className="badge hot txt">{value}</em>;
  return <em className="badge hot">{value}</em>;
}

const RAIL_KEY = "s24full-rail";

function Menu({ drawer, groups, current, go, cta, close, rail, toggleRail, free, who, extra }) {
  return (
    <>
      <div className="sidetop">
        <a className="logo" href="#" aria-label="statybos24.lt" onClick={(event) => { event.preventDefault(); go(groups[0]?.[1]?.[0]?.key || "overview"); }}>
          <img className="full" src="/brand-logo-light.png" alt="statybos24.lt" />
          <img className="mark" src="/brand-mark-light.png" alt="" />
        </a>
        {drawer && (
          <button type="button" className="closebtn" aria-label="Uždaryti meniu" onClick={close}>
            <Svg name="x" size={20} width={2.2} />
          </button>
        )}
      </div>
      {!drawer && (
        <button type="button" className="railtab" aria-label={rail ? "Išskleisti meniu" : "Suskleisti meniu"} title={rail ? "Išskleisti meniu" : "Suskleisti meniu"} aria-expanded={!rail} onClick={toggleRail}>
          <Svg size={14} width={2.4} paths={rail ? '<path d="m9 18 6-6-6-6"/>' : '<path d="m15 18-6-6 6-6"/>'} />
        </button>
      )}
      {cta && (
        <button type="button" className="cta ring" title={cta.label} aria-label={cta.label} onClick={() => { close(); cta.onClick(); }}>
          <Svg name="plus" size={18} width={2.4} />
          <span className="t">{cta.label}</span>
        </button>
      )}
      <nav className="navwrap" aria-label="Pagrindinis meniu">
        {groups.map(([label, items]) => (
          <div className="group" key={label}>
            <div className="glabel">{label}</div>
            <div className="glabel-sep" aria-hidden="true" />
            {items.map((item) => (
              <button key={item.key} type="button" className="item" title={item.label} aria-current={current === item.key ? "page" : undefined} onClick={() => go(item.key)}>
                <Svg name={item.icon} />
                <span>{item.label}</span>
                <Badge value={item.badge} />
              </button>
            ))}
          </div>
        ))}
        {extra?.length ? (
          <div className="group">
            <div className="glabel">Paskyra</div>
            <div className="glabel-sep" aria-hidden="true" />
            {extra.map((item) => (
              <button key={item.key} type="button" className="item" title={item.label} onClick={() => { close(); item.onClick(); }}>
                <Svg name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </nav>
      <div className="spacer" />
      {free && (
        <button type="button" className={`free2${free.on ? " on" : ""}${free.locked ? " lock" : ""}`} role="switch" aria-checked={free.on} aria-disabled={Boolean(free.locked)} data-tip={free.tip} onClick={() => { if (!free.locked) free.onToggle(); }}>
          <span className="fdot" />
          <span className="ftx"><b>Laisvas dabar</b></span>
          <span className="sw"><i /></span>
        </button>
      )}
      {who && (
        <div className="who2">
          <button type="button" className="wcard" title="Profilis" aria-current={who.current ? "page" : undefined} onClick={() => { close(); who.onClick?.(); }}>
            <span className={`av${who.company ? " co" : ""}`}>{who.avatar ? <img src={who.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : who.initials}</span>
            <span className="wtx"><b>{who.name}</b><small>{who.sub}</small></span>
          </button>
          <button type="button" className="wout" title="Atsijungti" aria-label="Atsijungti" onClick={who.onLogout}>
            <Svg name="out" size={18} />
          </button>
        </div>
      )}
    </>
  );
}

export function P24Shell({ groups, tabs, current, onGo, cta, free, who, extra, roleBar, messenger, utility, children }) {
  const [open, setOpen] = useState(false);
  const [rail, setRail] = useState(() => {
    try { return window.localStorage.getItem(RAIL_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(RAIL_KEY, rail ? "1" : "0"); } catch {}
  }, [rail]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(max-width: 899px)")?.matches);
  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 899px)");
    if (!query) return undefined;
    const sync = () => setPhone(query.matches);
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  // Prototipo fitMenu: jei meniu netelpa į ekrano aukštį, žingsniais sutankinama (mfit1–mfit4), kad nereikėtų slinkti.
  const rootRef = useRef(null);
  const [fitTick, setFitTick] = useState(0);
  const [fitLevel, setFitLevel] = useState("");
  useEffect(() => {
    const onResize = () => setFitTick((value) => value + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const fitKey = JSON.stringify(groups.map(([label, items]) => [label, items.length])) + (cta ? "c" : "") + (rail ? "r" : "") + fitTick;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const levels = ["mfit1", "mfit2", "mfit3", "mfit4"];
    root.classList.remove(...levels);
    let found = "";
    const side = window.innerWidth >= 900 ? root.querySelector(".side:not(.drawer)") : null;
    if (side) {
      const nav = side.querySelector(".navwrap");
      const over = () => (nav && nav.scrollHeight > nav.clientHeight + 1) || side.scrollHeight > side.clientHeight + 1;
      for (const level of levels) {
        if (!over()) break;
        root.classList.add(level);
        found = level;
      }
      // Prototipe klasės kaupiasi (mfit1 + mfit2 ...), todėl paliekamos visos iki rastos.
    }
    setFitLevel(found ? levels.slice(0, levels.indexOf(found) + 1).join(" ") : "");
  }, [fitKey]);
  const close = () => setOpen(false);
  const go = (key) => { setOpen(false); onGo(key); };
  const menuProps = { groups, current, go, cta, close, rail, toggleRail: () => setRail((value) => !value), free, who, extra };
  const unread = Number(messenger?.unread || 0);
  return (
    <div ref={rootRef} className={`p24 in-app${rail ? " rail" : ""}${open ? " open" : ""}${fitLevel ? ` ${fitLevel}` : ""}`}>
      <header className="topbar">
        <a href="#" aria-label="statybos24.lt" onClick={(event) => { event.preventDefault(); go(tabs[0]?.key || "overview"); }}>
          <img src="/brand-logo-tight.png" alt="statybos24.lt" />
        </a>
        <div className="row" style={{ gap: 8 }}>
          {phone && utility}
          {messenger && (
            <button type="button" className={`iconbtn${unread ? " has-new" : ""}`} aria-label={`Žinutės${unread ? `, neperskaitytų: ${unread}` : ""}`} onClick={messenger.onOpen}>
              <Svg name="chat" size={20} />
              {unread ? <span className="nb">{unread}</span> : null}
            </button>
          )}
          <button type="button" className="iconbtn" aria-label="Atidaryti meniu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Svg size={22} paths='<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>' />
          </button>
        </div>
      </header>
      <div className="app">
        <aside className="side" aria-label="Meniu"><Menu {...menuProps} drawer={false} /></aside>
        <main>
          {roleBar}
          {!phone && utility && <div className="p24-utility-desktop">{utility}</div>}
          {children}
        </main>
      </div>
      <div className="scrim" onClick={close} />
      <aside className="side drawer" aria-label="Meniu"><Menu {...menuProps} drawer /></aside>
      <nav className="tabbar" aria-label="Apatinis meniu">
        {tabs.map((tab) => tab.plus ? (
          <button key={tab.key} type="button" className="tab plus" aria-label={tab.label} onClick={() => go(tab.key)}>
            <span className="p"><Svg name="plus" size={24} width={2.6} /></span>
          </button>
        ) : (
          <button key={tab.key} type="button" className="tab" aria-current={current === tab.key ? "page" : undefined} onClick={() => go(tab.key)}>
            {tab.badge ? <span className="dot" /> : null}
            <Svg name={tab.icon} size={22} />
            {tab.label}
          </button>
        ))}
        <button type="button" className="tab" aria-label="Daugiau meniu punktų" onClick={() => setOpen(true)}>
          <Svg name="more" size={22} />
          Daugiau
        </button>
      </nav>
      {messenger && (
        <button type="button" className={`chatfab${unread ? " has-new" : ""}`} aria-label="Žinutės" onClick={messenger.onOpen}>
          <Svg name="chat" size={24} width={2.2} />
          {unread ? <span className="nb">{unread}</span> : null}
        </button>
      )}
    </div>
  );
}
