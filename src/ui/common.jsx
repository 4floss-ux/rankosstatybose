import React, { useEffect, useRef, useState } from "react";
import { P24Modal } from "../p24/ui.jsx";

export function ChatConductNotice() {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "9px 11px",
        marginBottom: 12,
        border: "1px solid #c9c2de",
        borderRadius: 12,
        background: "#fff8f1",
        color: "#433960",
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flex: "0 0 22px",
          background: "#6b5b95",
          color: "#fff",
          fontWeight: 900,
          fontSize: 13,
        }}
      >
        !
      </span>
      <span>
        <b>Keiktis griežtai draudžiama.</b> Bendraukime adekvačiai ir pagarbiai —
        necenzūrinė, įžeidžianti ar grasinanti kalba pokalbiuose neleidžiama.
      </span>
    </div>
  );
}

export function ReviewConductNotice() {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "10px 12px",
        marginBottom: 16,
        border: "1px solid #efb2a2",
        borderRadius: 12,
        background: "#fff1ed",
        color: "#b4472a",
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: 650,
      }}
    >
      <span aria-hidden="true" style={{fontWeight:900,fontSize:15,lineHeight:1}}>!</span>
      <span>
        <b>Keiktis ir įžeidinėti griežtai draudžiama.</b> Atsiliepimą rašykite
        dalykiškai ir apie realią darbo patirtį. Už necenzūrinę, grasinančią ar
        žeminančią kalbą paskyra gali būti pašalinta be papildomo įspėjimo.
      </span>
    </div>
  );
}

export class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Section render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ed-note err" style={{ marginTop: 16 }}>
          Nepavyko atvaizduoti šios dalies. Atnaujinkite puslapį ir bandykite dar kartą.
        </div>
      );
    }

    return this.props.children;
  }
}

export function StyledConfirmDialog({ dialog, onResolve }) {
  if (!dialog) return null;
  return (
    <P24Modal eyebrow={dialog.eyebrow ? String(dialog.eyebrow).charAt(0) + String(dialog.eyebrow).slice(1).toLocaleLowerCase("lt-LT") : ""} title={dialog.title || "Patvirtinkite veiksmą"} onClose={() => onResolve(false)}>
      {dialog.message ? <p className="muted" style={{ margin: 0, whiteSpace: "pre-line" }}>{dialog.message}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        {!dialog.hideCancel && <button className="btn" type="button" onClick={() => onResolve(false)}>{dialog.cancelLabel || "Atšaukti"}</button>}
        <button className={`btn ${dialog.danger ? "danger" : "primary"}`} type="button" onClick={() => onResolve(true)}>{dialog.confirmLabel || "Patvirtinti"}</button>
      </div>
    </P24Modal>
  );
}

export function useStyledConfirm() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const askConfirm = (config) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setDialog(config);
  });

  const resolveConfirm = (value) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolver?.(value);
  };

  return { dialog, askConfirm, resolveConfirm };
}

export function normalizeLithuanianMobilePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");

  if (/^3706\d{7}$/.test(digits)) return `+${digits}`;
  if (/^06\d{7}$/.test(digits)) return `+370${digits.slice(1)}`;
  if (/^6\d{7}$/.test(digits)) return `+370${digits}`;
  return "";
}

export function isValidLithuanianMobilePhone(value) {
  return Boolean(normalizeLithuanianMobilePhone(value));
}

export function RoundedSelect({ value, options, disabled, onChange, className = "ed-select", ariaLabel = "Pasirinkimas", buttonRef = null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof buttonRef === "function") buttonRef(node);
          else if (buttonRef) buttonRef.current = node;
        }}
        type="button"
        className={className}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => containerRef.current?.querySelector('[role="option"]')?.focus());
          }
        }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", background: "#fff", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.label || "Pasirinkite"}</span>
        <span aria-hidden="true" style={{ marginLeft: 12 }}>⌄</span>
      </button>
      {open && !disabled && (
        <div role="listbox" aria-label={ariaLabel} style={{ position: "absolute", zIndex: 50, top: "calc(100% + 6px)", left: 0, right: 0, maxHeight: 240, overflowY: "auto", padding: 5, background: "#fff", border: "1px solid #dfe7ed", borderRadius: 12, boxShadow: "0 14px 35px rgba(34,38,49,.14)" }}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                event.preventDefault();
                const buttons = [...containerRef.current.querySelectorAll('[role="option"]')];
                const next = buttons.indexOf(event.currentTarget) + (event.key === "ArrowDown" ? 1 : -1);
                buttons[(next + buttons.length) % buttons.length]?.focus();
              }}
              style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", border: 0, borderRadius: 8, background: option.value === value ? "#f0edf7" : "#fff", color: "#222631", font: "inherit", cursor: "pointer" }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function parseDateValue(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateDisplay(value, placeholder = "Pasirinkite datą") {
  const date = parseDateValue(value);
  if (!date) return placeholder;
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function RoundedDateSelect({
  value,
  disabled,
  onChange,
  ariaLabel = "Data",
  align = "left",
  className = "ed-input wd-date-trigger",
  placeholder = "Pasirinkite datą",
  allowClear = true,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const initialDate = selectedDate || new Date();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12)
  );

  useEffect(() => {
    if (!open) return;
    const next = parseDateValue(value) || new Date();
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1, 12));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1, 12);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset, 12);
  const todayValue = formatDateInputValue(new Date());
  const monthLabel = new Intl.DateTimeFormat("lt-LT", {
    month: "long",
    year: "numeric",
  }).format(viewMonth);
  const dayLabels = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span style={!value ? { color: "#8a98a6" } : undefined}>
          {formatDateDisplay(value, placeholder)}
        </span>
        <span aria-hidden="true" className="wd-date-icon">▦</span>
      </button>

      {open && !disabled && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="wd-date-popover"
          style={align === "right" ? { right: 0 } : { left: 0 }}
        >
          <div className="wd-date-head">
            <b>{monthLabel}</b>
            <div className="wd-date-nav">
              <button
                type="button"
                aria-label="Ankstesnis mėnuo"
                onClick={() => setViewMonth(new Date(year, month - 1, 1, 12))}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Kitas mėnuo"
                onClick={() => setViewMonth(new Date(year, month + 1, 1, 12))}
              >
                ›
              </button>
            </div>
          </div>

          <div className="wd-date-weekdays" aria-hidden="true">
            {dayLabels.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="wd-date-grid">
            {Array.from({ length: 42 }, (_, index) => {
              const date = new Date(gridStart);
              date.setDate(gridStart.getDate() + index);
              const optionValue = formatDateInputValue(date);
              const outside = date.getMonth() !== month;
              const selected = optionValue === value;
              const today = optionValue === todayValue;
              return (
                <button
                  key={optionValue}
                  type="button"
                  className={[outside ? "outside" : "", selected ? "selected" : "", today ? "today" : ""].filter(Boolean).join(" ")}
                  aria-label={new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" }).format(date)}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="wd-date-actions">
            {allowClear ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Išvalyti
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={() => {
                onChange(todayValue);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              Šiandien
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoundedTimeSelect({ value, disabled, onChange, ariaLabel, align = "left", className = "wd-time wd-time-trigger", placeholder = "Pasirinkite laiką", minTime = null, maxTime = null, buttonRef = null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const hasValue = Boolean(value);
  const [hour = "08", minute = "00"] = String(value || "08:00").split(":");

  const timeToMinutes = (time) => {
    if (!time) return null;
    const [h, m] = String(time).split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };

  const isAllowedTime = (time) => {
    const minutes = timeToMinutes(time);
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    if (minutes === null) return false;
    if (minMinutes !== null && minutes < minMinutes) return false;
    if (maxMinutes !== null && minutes > maxMinutes) return false;
    return true;
  };

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const hourOptions = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0")
  );
  const minuteOptions = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, "0")
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof buttonRef === "function") buttonRef(node);
          else if (buttonRef) buttonRef.current = node;
        }}
        type="button"
        className={className}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span style={!hasValue ? { color: "#8a98a6" } : undefined}>
          {hasValue ? `${hour}:${minute}` : placeholder}
        </span>
        <span aria-hidden="true">◷</span>
      </button>

      {open && !disabled && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="wd-time-popover wd-time-popover-compact"
          style={align === "right" ? { right: 0 } : { left: 0 }}
        >
          <div className="wd-time-compact-section">
            <b>Valandos</b>
            <div className="wd-time-compact-grid hours">
              {hourOptions.map((option) => {
                const candidate = `${option}:${minute}`;
                const optionDisabled = !isAllowedTime(candidate);
                return (
                  <button
                    key={option}
                    type="button"
                    className={option === hour ? "selected" : ""}
                    disabled={optionDisabled}
                    onClick={() => {
                      if (optionDisabled) return;
                      onChange(`${option}:${minute}`);
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wd-time-compact-section">
            <b>Minutės</b>
            <div className="wd-time-compact-grid minutes">
              {minuteOptions.map((option) => {
                const candidate = `${hour}:${option}`;
                const optionDisabled = !isAllowedTime(candidate);
                return (
                  <button
                    key={option}
                    type="button"
                    className={option === minute ? "selected" : ""}
                    disabled={optionDisabled}
                    onClick={() => {
                      if (optionDisabled) return;
                      onChange(`${hour}:${option}`);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function ArrivalTimeDialog({
  open,
  title,
  subject,
  scheduledTime,
  value,
  onChange,
  onClose,
  onConfirm,
  busy = false,
}) {
  if (!open) return null;
  return (
    <P24Modal eyebrow="Faktinis atvykimas" title={title || "Nurodykite atvykimo laiką"} sub={subject} onClose={onClose} busy={busy}>
      <div className="notebox">{scheduledTime ? <>Numatyta darbo pradžia: <b>{scheduledTime}</b>. </> : null}Atvykimo laikas negali būti ankstesnis už darbo pradžią ar vėlesnis nei dabar.</div>
      <label className="field">Atvykimo laikas<RoundedTimeSelect ariaLabel="Faktinis atvykimo laikas" className="ed-input wd-time-trigger" value={value} disabled={busy} onChange={onChange} /></label>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
        <button className="btn green" type="button" disabled={busy || !value} onClick={onConfirm}>{busy ? "Saugoma..." : "Patvirtinti atvykimą"}</button>
      </div>
    </P24Modal>
  );
}

export const unifiedCloseStyles = `
  button.rs-close, button.ctc-close, button.wd-profile-editor-close,
  button.reliability-modal-close, button.admin-setup-close,
  button[aria-label="Uždaryti"], button[aria-label="Uždaryti sąlygas"],
  button[aria-label="Uždaryti pranešimą"], button[aria-label="Uždaryti klaidos pranešimą"] {
    display:inline-flex !important; align-items:center !important; justify-content:center !important;
    width:44px !important; height:44px !important; min-width:44px !important; flex:0 0 44px !important;
    padding:0 !important; border:0 !important; border-radius:12px !important;
    background:#f1f4f6 !important; color:#222631 !important; cursor:pointer;
    line-height:1 !important;
  }
  .unified-close-mark { display:block; width:20px; height:20px; pointer-events:none; }
  button.rs-close:focus-visible, button.ctc-close:focus-visible,
  button.wd-profile-editor-close:focus-visible, button.reliability-modal-close:focus-visible,
  button.admin-setup-close:focus-visible, button[aria-label^="Uždaryti"]:focus-visible {
    outline:2px solid #6b5b95; outline-offset:2px;
  }
  .wd-time-trigger{
    width:100%!important;min-width:0!important;min-height:46px!important;box-sizing:border-box!important;
    display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;
    padding:11px 13px!important;border:1px solid #dbe4ea!important;border-radius:10px!important;
    background:#fff!important;color:#222631!important;font:inherit!important;font-variant-numeric:tabular-nums!important;
    text-align:left!important;cursor:pointer!important;box-shadow:none!important;
    transition:border-color .15s ease,box-shadow .15s ease,background .15s ease!important;
  }
  .wd-time-trigger:hover:not(:disabled){border-color:#c8d5dd!important;background:#fbfcfd!important}
  .wd-time-trigger:focus-visible{outline:none!important;border-color:#6b5b95!important;box-shadow:0 0 0 3px rgba(107,91,149,.11)!important}
  .wd-time-trigger>span:first-child{font-weight:750!important}
  .wd-time-trigger>span:last-child{display:grid!important;place-items:center!important;width:22px!important;height:22px!important;flex:0 0 22px!important;color:#607180!important;font-size:17px!important;line-height:1!important}
  .wd-time-trigger:disabled{background:#f4f6f8!important;color:#a0aab3!important;border-color:#e2e8ec!important;cursor:not-allowed!important}
  .wd-time-popover,.wd-time-popover-compact{
    position:absolute!important;top:calc(100% + 7px)!important;z-index:9600!important;
    width:min(350px,calc(100vw - 40px))!important;display:grid!important;grid-template-columns:1fr!important;
    gap:12px!important;padding:12px!important;background:#fff!important;border:1px solid #dfe7ed!important;
    border-radius:14px!important;box-shadow:0 16px 40px rgba(34,38,49,.16)!important;box-sizing:border-box!important;
    max-height:none!important;overflow:visible!important;
  }
  .wd-time-compact-section{min-width:0!important}
  .wd-time-compact-section>b{display:block!important;margin:0 0 7px!important;padding:0 2px!important;color:#607180!important;font-size:11px!important;font-weight:850!important;letter-spacing:.04em!important;text-transform:uppercase!important}
  .wd-time-compact-grid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:5px!important}
  .wd-time-compact-grid button{
    min-width:0!important;min-height:36px!important;padding:7px 3px!important;border:1px solid #e7edf1!important;
    border-radius:9px!important;background:#f8fafb!important;color:#263b4c!important;font:inherit!important;font-size:12px!important;
    font-weight:750!important;font-variant-numeric:tabular-nums!important;text-align:center!important;cursor:pointer!important;
    transition:background .12s ease,border-color .12s ease,color .12s ease,transform .12s ease!important;
  }
  .wd-time-compact-grid button:hover:not(:disabled){background:#f4f2f9!important;border-color:#b9afd4!important;color:#433960!important}
  .wd-time-compact-grid button.selected{background:#6b5b95!important;border-color:#6b5b95!important;color:#fff!important;font-weight:900!important;box-shadow:0 3px 8px rgba(107,91,149,.18)!important}
  .wd-time-compact-grid button:active:not(:disabled){transform:translateY(1px)!important}
  .wd-time-compact-grid button:disabled{opacity:.3!important;cursor:not-allowed!important;background:#f5f7f8!important;color:#95a1ab!important;border-color:#edf1f3!important}
  @media (max-width:520px){
    .wd-time-popover,.wd-time-popover-compact{
      position:fixed!important;
      left:50%!important;right:auto!important;top:auto!important;
      bottom:max(10px,env(safe-area-inset-bottom))!important;
      transform:translateX(-50%)!important;
      width:min(430px,calc(100vw - 20px))!important;
      max-width:calc(100vw - 20px)!important;
      max-height:min(68dvh,520px)!important;
      overflow-y:auto!important;overflow-x:hidden!important;
      z-index:20000!important;
      padding:14px!important;gap:12px!important;
      border-radius:18px!important;
      border:1px solid #dfe7ed!important;
      box-shadow:0 -10px 34px rgba(34,38,49,.18),0 0 0 100vmax rgba(34,38,49,.16)!important;
      overscroll-behavior:contain!important;
    }
    .wd-time-compact-grid{gap:6px!important}
    .wd-time-compact-grid button{min-height:42px!important;padding:8px 2px!important;font-size:12.5px!important;border-radius:10px!important}
    .wd-time-compact-section>b{margin-bottom:8px!important;font-size:11px!important}
  }
  .wd-date-trigger{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px;min-height:44px;text-align:left!important;cursor:pointer}.wd-date-trigger:disabled{background:#f4f6f8!important;color:#a0aab3!important;cursor:not-allowed}.wd-date-icon{font-size:18px;line-height:1;color:#607180}.wd-date-popover{position:absolute;top:calc(100% + 6px);z-index:9600;width:min(320px,calc(100vw - 48px));padding:12px;background:#fff;border:1px solid #dfe7ed;border-radius:14px;box-shadow:0 14px 35px rgba(34,38,49,.16)}.wd-date-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;padding:0 2px}.wd-date-head>b{text-transform:capitalize;color:#222631;font-size:14px}.wd-date-nav{display:flex;gap:5px}.wd-date-nav button{width:34px;height:34px;border:0;border-radius:9px;background:#f4f6f8;color:#222631;font:inherit;font-size:24px;line-height:1;cursor:pointer}.wd-date-nav button:hover{background:#f0edf7;color:#433960}.wd-date-weekdays,.wd-date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.wd-date-weekdays{margin-bottom:4px}.wd-date-weekdays span{display:grid;place-items:center;height:26px;color:#7a8895;font-size:11px;font-weight:800}.wd-date-grid button{aspect-ratio:1;border:0;border-radius:9px;background:#fff;color:#222631;font:inherit;font-size:12px;cursor:pointer}.wd-date-grid button:hover{background:#f0edf7;color:#433960}.wd-date-grid button.outside{color:#a7b1ba}.wd-date-grid button.today{box-shadow:inset 0 0 0 1px #a498c7;color:#433960}.wd-date-grid button.selected{background:#6b5b95;color:#fff;font-weight:800;box-shadow:none}.wd-date-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #edf1f4}.wd-date-actions button{border:0;background:transparent;color:#433960;padding:7px 8px;border-radius:8px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.wd-date-actions button:hover{background:#f0edf7}

`;
