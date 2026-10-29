import React, { useEffect, useState } from "react";

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
  plan: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
};

export function scrollToDashboardTarget(selector) {
  if (typeof document === "undefined") return false;
  for (const candidate of selector.split(",")) {
    const target = document.querySelector(candidate.trim());
    if (!target) continue;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }
  return false;
}

export function DashboardSidebar({ role, items, logo, initialActive = "overview" }) {
  const [active, setActive] = useState(initialActive);
  useEffect(() => { setActive(initialActive); }, [initialActive]);
  return (
    <aside className="s24-dashboard-sidebar" aria-label={role + " navigacija"}>
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
