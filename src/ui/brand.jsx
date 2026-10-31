

export const BRAND_NAME = "statybos24";
export const BRAND_DOMAIN = "statybos24.lt";
export const FAVICON_SRC = "/favicon.png";

export function applyBrandFavicon() {
  if (typeof document === "undefined") return;

  document.title = "Statybos24.lt - rankos tavo darbuose";

  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.type = "image/png";
  favicon.sizes = "64x64";
  favicon.href = FAVICON_SRC;
}
export const BRAND_LOGO_SRC = "/brand-logo.png";



export function Icon({children}) {
  return <span className="icon">{children}</span>;
}

export function BrandImage({ height = 38, alt = BRAND_NAME, style }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={480}
      height={160}
      decoding="async"
      style={{ display: "block", height, width: "auto", objectFit: "contain", ...style }}
    />
  );
}

export function BrandLogo({ href = "#", className = "brand", height = 38, style, imgStyle, alt = BRAND_NAME }) {
  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        event.preventDefault();

        if (href && href.startsWith("/") && !href.startsWith("/#")) {
          window.location.assign(href);
          return;
        }

        if (href === "#" || !href) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (href.startsWith("#")) {
          const targetId = href.slice(1);
          const target = targetId ? document.getElementById(targetId) : null;
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
          window.location.assign(href);
          return;
        }

        window.location.assign(href);
      }}
      style={{ display: "inline-flex", alignItems: "center", ...style }}
    >
      <BrandImage height={height} alt={alt} style={imgStyle} />
    </a>
  );
}

export function CloseMark() {
  return (
    <svg className="unified-close-mark" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

export function SilentLoader({ size = 20, minHeight = 44, fullscreen = false }) {
  const spinnerSize = Math.max(12, Number(size) || 20);
  return (
    <span
      role="status"
      aria-label="Kraunama"
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        minHeight: fullscreen ? "100vh" : minHeight,
        background: fullscreen ? "#f6f8fa" : "transparent",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${Math.max(2, Math.round(spinnerSize / 9))}px solid #dfe7ed`,
          borderTopColor: "#6b5b95",
          borderRadius: "50%",
          animation: "silent-loader-spin .75s linear infinite",
          boxSizing: "border-box",
        }}
      />
      <style>{`@keyframes silent-loader-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
