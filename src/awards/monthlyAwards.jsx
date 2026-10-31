import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export const MONTHLY_AWARD_TOP_IMAGE = "/assets/screens/monthly-award-top-image.svg";

export const MONTHLY_AWARD_META = {
  worker: {
    activity: { title: "Mėnesio aktyviausias", imageKey: "worker_activity" },
    best: { title: "Mėnesio geriausias", imageKey: "worker_best" },
    reliability: { title: "Mėnesio patikimiausias", imageKey: "worker_reliability" },
  },
  company: {
    activity: { title: "Mėnesio aktyviausia", imageKey: "company_activity" },
    best: { title: "Mėnesio geriausia", imageKey: "company_best" },
    reliability: { title: "Mėnesio patikimiausia", imageKey: "company_reliability" },
  },
};

export function monthlyAwardMeta(award) {
  return (
    MONTHLY_AWARD_META?.[award?.recipient_type]?.[award?.award_type] || {
      title: "Mėnesio apdovanojimas",
      imageKey: "worker_best",
    }
  );
}

export function monthlyAwardImage() {
  return MONTHLY_AWARD_TOP_IMAGE;
}

export function monthlyAwardMonthLabel(value) {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("lt-LT", { year: "numeric", month: "long" });
}

export function monthlyAwardMetricText(award) {
  if (!award) return "";
  const value = Number(award.metric_value || 0);
  const count = Number(award.metric_count || 0);
  if (award.award_type === "activity") {
    return `${count || Math.round(value)} užbaigti ${
      (count || Math.round(value)) === 1 ? "darbas" : "darbai"
    }`;
  }
  if (award.award_type === "best") {
    return `${value.toFixed(1)} / 10 · ${count} ${count === 1 ? "įvertinimas" : "įvertinimai"}`;
  }
  if (award.award_type === "reliability") {
    return `${Math.round(value)} / 100 patikimumas`;
  }
  return String(award.metric_value || "");
}

export function sortedMonthlyAwards(awards) {
  return [...(awards || [])].sort((a, b) => {
    const byMonth = String(b?.award_month || "").localeCompare(
      String(a?.award_month || "")
    );
    if (byMonth) return byMonth;
    return String(a?.award_type || "").localeCompare(String(b?.award_type || ""));
  });
}

export function monthlyAwardPreviousMonthISO(reference = new Date()) {
  const date = new Date(reference);
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function monthlyAwardTemporaryStillVisible(award, reference = new Date()) {
  const until = award?.metric_detail?.temporary_test_until;
  if (!until) return true;
  const end = new Date(`${String(until).slice(0, 10)}T23:59:59`);
  return !Number.isNaN(end.getTime()) && reference <= end;
}

export function visibleMonthlyAwardHistory(awards) {
  const now = new Date();
  return sortedMonthlyAwards(awards).filter((award) =>
    monthlyAwardTemporaryStillVisible(award, now)
  );
}

export function activeMonthlyAwards(awards) {
  const activeMonth = monthlyAwardPreviousMonthISO();
  return visibleMonthlyAwardHistory(awards).filter(
    (row) => String(row?.award_month || "").slice(0, 10) === activeMonth
  );
}

export const MONTHLY_AWARD_TOOLTIP_STYLES = `
  .monthly-award-hover{position:relative;display:inline-grid;place-items:center;flex:0 0 auto;border-radius:999px;outline:none;cursor:help}
  .monthly-award-hover>img{display:block;object-fit:contain;border-radius:999px;transition:transform .15s ease,filter .15s ease}
  .monthly-award-hover:hover>img,.monthly-award-hover:focus-visible>img{transform:translateY(-1px);filter:drop-shadow(0 5px 9px rgba(16,36,56,.16))}
`;

export function monthlyAwardAriaText(award) {
  const meta = monthlyAwardMeta(award);
  return `${meta.title}, ${monthlyAwardMonthLabel(award.award_month)}, ${monthlyAwardMetricText(award)}`;
}

export function MonthlyAwardTopBadge({ awards, size = 31, tooltipLimit = 6 }) {
  const rows = visibleMonthlyAwardHistory(awards);
  const badgeRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  if (!rows.length) return null;

  const tooltipRows = rows.slice(0, Math.max(1, tooltipLimit));

  function showAwardTooltip() {
    const rect = badgeRef.current?.getBoundingClientRect();
    if (!rect) return;

    const tooltipWidth = 286;
    const margin = 12;
    const canShowRight = window.innerWidth - rect.right >= tooltipWidth + margin;
    const left = canShowRight
      ? rect.right + margin
      : Math.max(14, rect.left - tooltipWidth - margin);
    const estimatedHeight = Math.min(330, 62 + tooltipRows.length * 56);
    const top = Math.min(
      Math.max(14, rect.top + rect.height / 2 - estimatedHeight / 2),
      Math.max(14, window.innerHeight - estimatedHeight - 14)
    );

    setTooltipPos({ left, top });
  }

  function toggleAwardTooltip(event) {
    event.preventDefault();
    if (tooltipPos) setTooltipPos(null);
    else showAwardTooltip();
  }

  return (
    <>
      <span
        ref={badgeRef}
        className="monthly-award-hover"
        tabIndex={0}
        role="button"
        aria-label={`TOP apdovanojimai: ${rows.map(monthlyAwardAriaText).join("; ")}`}
        style={{ width: size, height: size }}
        onMouseEnter={showAwardTooltip}
        onMouseLeave={() => setTooltipPos(null)}
        onFocus={showAwardTooltip}
        onBlur={() => setTooltipPos(null)}
        onClick={toggleAwardTooltip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            toggleAwardTooltip(event);
          }
        }}
      >
        <style>{MONTHLY_AWARD_TOOLTIP_STYLES}</style>
        <img
          src={MONTHLY_AWARD_TOP_IMAGE}
          alt="TOP"
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          style={{ width: size, height: size }}
        />
      </span>

      {tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: tooltipPos.left,
              top: tooltipPos.top,
              zIndex: 20000,
              width: 286,
              maxWidth: "calc(100vw - 28px)",
              maxHeight: "min(330px,calc(100dvh - 28px))",
              overflowY: "auto",
              padding: "12px 13px",
              border: "1px solid #ead3a2",
              borderRadius: 13,
              background: "#fffdf7",
              boxShadow: "0 14px 32px rgba(16,36,56,.16)",
              color: "#102438",
              fontSize: 11,
              lineHeight: 1.4,
              pointerEvents: "none",
            }}
          >
            <b style={{ display: "block", fontSize: 12.5, marginBottom: 7 }}>
              TOP apdovanojimai
            </b>
            {tooltipRows.map((award, index) => {
              const meta = monthlyAwardMeta(award);
              return (
                <div
                  key={award.id || `${award.award_month}-${award.recipient_type}-${award.award_type}-${index}`}
                  style={{
                    padding: index ? "8px 0 0" : "0",
                    marginTop: index ? 8 : 0,
                    borderTop: index ? "1px solid #f0e5cf" : 0,
                  }}
                >
                  <strong style={{ display: "block", color: "#9f5d0b", fontSize: 11.5 }}>
                    {meta.title}
                  </strong>
                  <span style={{ display: "block", color: "#6c7a88", marginTop: 2 }}>
                    {monthlyAwardMonthLabel(award.award_month)} · {monthlyAwardMetricText(award)}
                  </span>
                </div>
              );
            })}
            {rows.length > tooltipRows.length && (
              <span style={{ display: "block", color: "#7a6a50", marginTop: 9, fontWeight: 800 }}>
                + dar {rows.length - tooltipRows.length}
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

export function MonthlyAwardBadgeVisual({ award, size = 31 }) {
  if (!award) return null;
  return <MonthlyAwardTopBadge awards={[award]} size={size} tooltipLimit={1} />;
}

export function MonthlyAwardMiniList({ awards, size = 31 }) {
  const rows = activeMonthlyAwards(awards);
  if (!rows.length) return null;

  return (
    <MonthlyAwardTopBadge
      awards={rows}
      size={size}
      tooltipLimit={6}
    />
  );
}

export function MonthlyAwardsPanel({ awards, recipientType, showEmpty = false }) {
  const rows = visibleMonthlyAwardHistory(awards);
  const active = activeMonthlyAwards(rows);
  const activeKeys = new Set(
    active.map((award) =>
      award?.id || `${String(award?.award_month || "").slice(0, 10)}-${award?.recipient_type || ""}-${award?.award_type || ""}`
    )
  );

  if (!rows.length && !showEmpty) return null;

  return (
    <div
      style={{
        border: "1px solid #e4ebf0",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        marginTop: 14,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: rows.length ? 14 : 0,
        }}
      >
        <div className="eyebrow">MĖNESIO TOP</div>
        {rows.length > 0 && (
          <span style={{ color: "#6c7a88", fontSize: 12 }}>
            Pasiekimų: {rows.length}
          </span>
        )}
      </div>

      {rows.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "76px minmax(0,1fr)",
            alignItems: "start",
            gap: 15,
          }}
        >
          <div style={{ paddingTop: 2 }}>
            <MonthlyAwardTopBadge awards={rows} size={72} tooltipLimit={6} />
          </div>

          <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
            {rows.map((award, index) => {
              const meta = monthlyAwardMeta(award);
              const key =
                award?.id || `${String(award?.award_month || "").slice(0, 10)}-${award?.recipient_type || ""}-${award?.award_type || ""}-${index}`;
              const isActive = activeKeys.has(
                award?.id || `${String(award?.award_month || "").slice(0, 10)}-${award?.recipient_type || ""}-${award?.award_type || ""}`
              );

              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid #edf1f4",
                    borderRadius: 11,
                    background: isActive ? "#fffaf1" : "#f8fafb",
                    padding: "9px 11px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <b style={{ color: "#102438", fontSize: 12.5, lineHeight: 1.3 }}>
                      {meta.title}
                    </b>
                    {isActive && (
                      <span style={{ color: "#9f5d0b", fontSize: 9.5, fontWeight: 900, letterSpacing: ".04em" }}>
                        AKTYVUS
                      </span>
                    )}
                  </div>
                  <span style={{ display: "block", color: "#6c7a88", fontSize: 10.5, marginTop: 3 }}>
                    {monthlyAwardMonthLabel(award.award_month)} · {monthlyAwardMetricText(award)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : showEmpty ? (
        <div
          style={{
            border: "1px dashed #d7e0e7",
            borderRadius: 12,
            padding: 13,
            color: "#6c7a88",
            fontSize: 12,
            background: "#f8fafb",
          }}
        >
          <b style={{ display: "block", color: "#102438", marginBottom: 5 }}>
            TOP pasiekimų dar nėra
          </b>
          <span>
            Kiekvieno mėnesio 1 dieną sistema automatiškai įvertina praėjusio mėnesio statistiką.
          </span>
        </div>
      ) : null}
    </div>
  );
}
