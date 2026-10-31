import { BrandImage } from "./brand.jsx";

export function AppBootLoader({ compact = false, label = "Kraunama" }) {
  return (
    <div role="status" aria-label={label} style={{
      minHeight: compact ? 26 : "100vh",
      display: compact ? "inline-flex" : "grid",
      alignItems: "center", justifyContent: "center", placeItems: "center",
      background: compact ? "transparent" : "#f7f9fb",
    }}>
      <div style={{ display: compact ? "flex" : "grid", alignItems: "center", justifyItems: "center", gap: compact ? 8 : 18 }}>
        <span style={compact ? { display: "inline-flex", background: "#fff", borderRadius: 4, padding: "3px 5px" } : undefined}>
          <BrandImage height={compact ? 18 : 52} />
        </span>
        <span aria-hidden="true" className="app-boot-spinner" style={{
          display: "inline-block", width: compact ? 14 : 28, height: compact ? 14 : 28,
          border: `${compact ? 2 : 3}px solid #dfe7ed`, borderTopColor: "#f08a28",
          borderRadius: "50%", animation: "app-boot-spin .75s linear infinite", flexShrink: 0,
        }} />
        <style>{`@keyframes app-boot-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.app-boot-spinner{animation:none!important}}`}</style>
      </div>
    </div>
  );
}
