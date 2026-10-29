import React, { useEffect, useLayoutEffect, useRef, useState } from "react";


export function DashboardMenuToggle() {
  const button = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { const saved = localStorage.getItem('s24-dashboard-menu-collapsed'); return saved === null ? window.innerWidth < 1100 : saved === 'true'; }
    catch { return window.innerWidth < 1100; }
  });
  useLayoutEffect(() => {
    const page = button.current?.closest('.wd-page, .ed-page, .admin-page');
    page?.classList.toggle('s24-menu-collapsed', collapsed);
    try { localStorage.setItem('s24-dashboard-menu-collapsed', String(collapsed)); } catch {}
    return () => page?.classList.remove('s24-menu-collapsed');
  }, [collapsed]);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && !collapsed) { setCollapsed(true); button.current?.focus(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [collapsed]);
  return <>
    <button ref={button} className="s24-menu-toggle" type="button"
      aria-label={collapsed ? 'Rodyti meniu' : 'Slėpti meniu'} aria-expanded={!collapsed}
      aria-controls="s24-account-navigation" onClick={() => setCollapsed(value => !value)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {collapsed ? <path d="M4 6h16M4 12h16M4 18h16" /> : <path d="m14 6-6 6 6 6" />}
      </svg><span>{collapsed ? 'Meniu' : 'Slėpti'}</span>
    </button>
    {!collapsed && <button type="button" className="s24-menu-backdrop" aria-label="Uždaryti meniu" onClick={() => setCollapsed(true)} />}
  </>;
}

// Only the desktop navigation shell changes; business actions stay in each dashboard.
const glyphs = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13a20 20 0 0 0 18 0" /></>,
  invitation: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="m3 7 9 7 9-7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 15h3" /></>,
  chart: <><path d="M4 20V12m5 8V8m5 12V4m5 16v-6M3 21h18" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  team: <><circle cx="9" cy="8" r="3" /><path d="M2 20v-1a7 7 0 0 1 14 0v1M16 5a3 3 0 0 1 0 6m3 9v-1a7 7 0 0 0-3-5.74" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></>,
  chat: <><path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.7-.8L3 20l1.1-4.5A8.5 8.5 0 1 1 20 11.5Z" /></>,
  plan: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
};

export function scrollToDashboardTarget(selector) {
  if (typeof document === "undefined") return false;
  for (const candidate of selector.split(",")) {
    const target = document.querySelector(candidate.trim());
    if (!target) continue;
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    return true;
  }
  return false;
}

export function DashboardSidebar({ role, items, logo, initialActive = "overview" }) {
  const [active, setActive] = useState(initialActive);
  useEffect(() => {
    setActive((current) => initialActive === "calendar"
      ? "calendar"
      : current === "calendar" ? "overview" : current);
  }, [initialActive]);
  return (
    <aside id="s24-account-navigation" className="s24-dashboard-sidebar" aria-label={role + " navigacija"}>
      <div className="s24-dashboard-brand" aria-label="Statybos24">
        {logo || (
          <>
            <span className="s24-dashboard-mark" aria-hidden="true">S<span>24</span></span>
            <span className="s24-dashboard-brand-copy"><strong>STATYBOS<span>24</span></strong><small>Valdymo aplinka</small></span>
          </>
        )}
      </div>
      <div className="s24-dashboard-menu-label">{role}</div>
      <nav className="s24-dashboard-nav" aria-label="Paskyros skyriai">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={"s24-dashboard-nav-item" + (active === item.key ? " is-active" : "")}
            aria-current={active === item.key ? "location" : undefined}
            onClick={() => {
              const completed = item.onClick();
              if (completed !== false) setActive(item.key);
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {glyphs[item.icon] || glyphs.overview}
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="s24-dashboard-sidebar-foot">Statybos24.lt</div>
    </aside>
  );
}
