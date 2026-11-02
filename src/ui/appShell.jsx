import { useEffect, useState } from "react";

// Bendras paskyros išdėstymas pagal naują dizainą: kairysis meniu kompiuteryje,
// viršutinė juosta, apatiniai skirtukai ir išskleidžiamas meniu telefone.
const ICONS = {
  overview: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  jobs: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  home: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.4-7.5 10.4z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',
};

export function NavIcon({ name, size = 20, width = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }} />
  );
}

function Badge({ value }) {
  if (value === undefined || value === null || value === 0 || value === false || value === "") return null;
  return <i className={`s24-badge${typeof value === "string" ? " txt" : ""}`}>{value}</i>;
}

export const appShellStyles = `
  .s24-app{--s24-navy:#222631;--s24-lilac:#6b5b95;--s24-line:#e2e1ea;--s24-sw:256px;min-height:100vh;background:#f5f5f8}
  .s24-side{position:fixed;z-index:35;top:14px;bottom:14px;left:14px;width:var(--s24-sw);background:var(--s24-navy);color:#fff;border-radius:8px;padding:14px 10px 10px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
  .s24-side-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 6px 4px}
  .s24-side-top a{display:flex;align-items:center;min-height:40px}
  .s24-side-top img{height:30px;width:auto;display:block}
  .s24-side-close{display:none}
  .s24-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:42px;border:0;border-radius:5px;background:#6b5b95;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
  .s24-cta:hover{background:#584a7d}
  .s24-nav{display:flex;flex-direction:column;gap:12px;overflow-y:auto;overflow-x:hidden;min-height:0;margin:0 -4px;padding:0 4px}
  .s24-glabel{padding:0 10px 4px;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6);white-space:nowrap}
  .s24-item{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:0 10px;border:0;border-radius:5px;background:transparent;color:rgba(255,255,255,.86);font:inherit;font-size:13px;font-weight:600;text-align:left;white-space:nowrap;cursor:pointer}
  .s24-item svg{flex:none;width:18px;height:18px;opacity:.75}
  .s24-item span{flex:1;overflow:hidden;text-overflow:ellipsis}
  .s24-item:hover{background:rgba(255,255,255,.07)}
  .s24-item[aria-current="page"]{background:rgba(107,91,149,.28);color:#fff}
  .s24-item[aria-current="page"] svg{opacity:1;color:#b3a6dc}
  .s24-badge{min-width:20px;height:19px;padding:0 6px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-size:10.5px;font-weight:700;font-style:normal;display:flex;align-items:center;justify-content:center;flex:none}
  .s24-badge.txt{background:#6b5b95;font-size:10px;padding:0 7px}
  .s24-spacer{flex:1}
  .s24-side-foot{display:flex;flex-direction:column;gap:6px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12)}
  .s24-who{display:flex;align-items:center;gap:10px;padding:2px 4px}
  .s24-who-av{width:36px;height:36px;border-radius:999px;background:#fff;color:var(--s24-navy);display:grid;place-items:center;font-size:12px;font-weight:800;overflow:hidden;flex:none}
  .s24-who-av img{width:100%;height:100%;object-fit:cover}
  .s24-who b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .s24-who small{display:block;font-size:11px;color:rgba(255,255,255,.65)}
  .s24-who > div:not(.s24-who-av){min-width:0;flex:1}
  .s24-main{padding:14px 24px 48px calc(14px + var(--s24-sw) + 24px);min-width:0}
  .s24-side-foot .s24-item{min-height:32px;font-size:12.5px}
  @media (min-width:900px) and (max-height:940px){.s24-item{min-height:33px}.s24-nav{gap:8px}.s24-glabel{padding-bottom:2px}.s24-side{gap:8px}.s24-side-foot{gap:2px;padding-top:8px}.s24-who-av{width:32px;height:32px}}
  .s24-utility{display:flex;justify-content:flex-end;align-items:center;gap:8px;min-height:44px;max-width:1320px;margin:0 auto}
  .s24-utility:empty{display:none}
  .s24-topbar-logo,.s24-burger,.s24-tabbar,.s24-scrim{display:none}
  @media (max-width:899px){
    .s24-side{top:0;bottom:0;left:0;width:min(320px,86vw);border-radius:0 8px 8px 0;transform:translateX(-105%);transition:transform .25s ease;z-index:60;box-shadow:0 20px 60px rgba(34,38,49,.4);padding:calc(14px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px))}
    .s24-app.open .s24-side{transform:none}
    .s24-side-close{display:flex;width:38px;height:38px;border-radius:5px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;align-items:center;justify-content:center;cursor:pointer}
    .s24-scrim{display:block;position:fixed;inset:0;z-index:55;background:rgba(34,38,49,.55);opacity:0;pointer-events:none;transition:opacity .2s}
    .s24-app.open .s24-scrim{opacity:1;pointer-events:auto}
    .s24-item{min-height:44px;font-size:14px}
    .s24-main{padding:calc(62px + env(safe-area-inset-top,0px)) 0 calc(96px + env(safe-area-inset-bottom,0px))}
    .s24-utility{position:fixed;top:0;left:0;right:0;z-index:45;justify-content:space-between;height:calc(62px + env(safe-area-inset-top,0px));padding-top:env(safe-area-inset-top,0px)!important;padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));background:#fff;border-bottom:1px solid var(--s24-line);max-width:none}
    .s24-utility:empty{display:flex}
    .s24-topbar-logo{display:flex;align-items:center}
    .s24-topbar-logo img{height:28px;width:auto;display:block}
    .s24-utility-right{display:flex;align-items:center;gap:8px}
    .s24-burger{display:flex;width:44px;height:44px;border-radius:5px;border:1px solid var(--s24-line);background:#fff;color:var(--s24-navy);align-items:center;justify-content:center;cursor:pointer}
    .s24-tabbar{display:grid;position:fixed;left:0;right:0;bottom:0;z-index:40;gap:2px;padding:8px max(6px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(6px,env(safe-area-inset-left,0px));background:var(--s24-navy)}
    .s24-tab{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:54px;border:0;border-radius:5px;background:transparent;color:rgba(255,255,255,.86);font:inherit;font-size:10.5px;font-weight:600;padding:0 2px;cursor:pointer}
    .s24-tab[aria-current="page"]{background:rgba(107,91,149,.28);color:#fff;font-weight:700}
    .s24-tab[aria-current="page"] svg{color:#b3a6dc}
    .s24-tab.plus .s24-plus{width:52px;height:52px;margin-top:-26px;border-radius:999px;background:#6b5b95;color:#fff;border:4px solid var(--s24-navy);display:flex;align-items:center;justify-content:center}
    .s24-tab .s24-dot{position:absolute;top:6px;right:calc(50% - 17px);width:10px;height:10px;border-radius:999px;background:#9d86e0;border:2px solid var(--s24-navy)}
  }
  @media (min-width:900px){.s24-utility-right{display:flex;align-items:center;gap:8px}}
`;

export function AppShell({ groups, tabs, current, onGo, who, footer, utility, cta, children }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const go = (key) => { setOpen(false); onGo(key); };
  return (
    <div className={`s24-app${open ? " open" : ""}`}>
      <style>{appShellStyles}</style>
      <div className="s24-scrim" onClick={() => setOpen(false)} />
      <aside className="s24-side" aria-label="Meniu">
        <div className="s24-side-top">
          <a href="#" onClick={(event) => { event.preventDefault(); go(groups[0]?.[1]?.[0]?.key || "overview"); }} aria-label="statybos24.lt">
            <img src="/brand-logo-light.png" alt="statybos24.lt" />
          </a>
          <button type="button" className="s24-side-close" onClick={() => setOpen(false)} aria-label="Uždaryti meniu"><NavIcon name="x" size={18} /></button>
        </div>
        {cta && (
          <button type="button" className="s24-cta" onClick={() => { setOpen(false); cta.onClick(); }}>
            <NavIcon name="plus" size={18} width={2.4} />
            {cta.label}
          </button>
        )}
        <nav className="s24-nav" aria-label="Pagrindinis meniu">
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="s24-glabel">{label}</div>
              {items.map((item) => (
                <button key={item.key} type="button" className="s24-item" aria-current={current === item.key ? "page" : undefined} onClick={() => go(item.key)}>
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                  <Badge value={item.badge} />
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="s24-spacer" />
        <div className="s24-side-foot">
          {who && (
            <div className="s24-who">
              <div className="s24-who-av">{who.avatar ? <img src={who.avatar} alt="" /> : who.initials}</div>
              <div><b>{who.name}</b><small>{who.sub}</small></div>
            </div>
          )}
          {footer?.map((item) => (
            <button key={item.key} type="button" className="s24-item" onClick={() => { setOpen(false); item.onClick(); }}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="s24-main">
        <div className="s24-utility">
          <a className="s24-topbar-logo" href="#" onClick={(event) => { event.preventDefault(); go(tabs[0]?.key || "overview"); }} aria-label="statybos24.lt">
            <img src="/brand-logo-tight.png" alt="statybos24.lt" />
          </a>
          <div className="s24-utility-right">
            {utility}
            <button type="button" className="s24-burger" onClick={() => setOpen(true)} aria-label="Atidaryti meniu" aria-expanded={open}><NavIcon name="menu" size={22} /></button>
          </div>
        </div>
        {children}
      </div>
      <nav className="s24-tabbar" aria-label="Apatinis meniu" style={{ gridTemplateColumns: `repeat(${tabs.length + 1},minmax(0,1fr))` }}>
        {tabs.map((tab) => tab.plus ? (
          <button key={tab.key} type="button" className="s24-tab plus" onClick={() => go(tab.key)} aria-label={tab.label}>
            <span className="s24-plus"><NavIcon name="plus" size={24} width={2.6} /></span>
          </button>
        ) : (
          <button key={tab.key} type="button" className="s24-tab" aria-current={current === tab.key ? "page" : undefined} onClick={() => go(tab.key)}>
            {tab.badge ? <span className="s24-dot" /> : null}
            <NavIcon name={tab.icon} size={22} />
            {tab.label}
          </button>
        ))}
        <button type="button" className="s24-tab" onClick={() => setOpen(true)} aria-label="Daugiau meniu punktų">
          <NavIcon name="menu" size={22} />
          Daugiau
        </button>
      </nav>
    </div>
  );
}
