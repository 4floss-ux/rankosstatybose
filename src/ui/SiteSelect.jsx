import React, { Children, forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./SiteSelect.css";

function textOf(value) {
  return Children.toArray(value).map(node => typeof node === "string" || typeof node === "number" ? String(node) : React.isValidElement(node) ? textOf(node.props.children) : "").join("");
}
function optionsOf(children, group = "", disabled = false) {
  return Children.toArray(children).flatMap(node => {
    if (!React.isValidElement(node)) return [];
    if (node.type === React.Fragment) return optionsOf(node.props.children, group, disabled);
    if (node.type === "optgroup") return optionsOf(node.props.children, node.props.label, disabled || node.props.disabled);
    if (node.type !== "option") return [];
    const label = String(node.props.label ?? textOf(node.props.children));
    return [{ value: String(node.props.value ?? label), label, group, disabled: disabled || Boolean(node.props.disabled) }];
  });
}

// A single styled popup for native-select call sites and RoundedSelect. Keep a
// real select for form serialization/validation and existing change handlers.
export const SiteSelect = forwardRef(function SiteSelect({ children, value, defaultValue, onChange, onBlur, id, disabled = false, required, className = "", style, buttonRef, ariaLabel, ...props }, forwardedRef) {
  const uid = useId(); const triggerId = id || `s24-select-${uid}`; const listId = `${triggerId}-list`;
  const options = optionsOf(children);
  const [localValue, setLocalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));
  const current = value === undefined ? localValue : String(value ?? "");
  const selectedIndex = options.findIndex(option => option.value === current);
  const selected = options[selectedIndex] || options[0];
  const [open, setOpen] = useState(false); const [active, setActive] = useState(0);
  const [label, setLabel] = useState(""); const [invalid, setInvalid] = useState(false); const [position, setPosition] = useState(null);
  const trigger = useRef(null); const native = useRef(null); const menu = useRef(null); const search = useRef({ text: "", at: 0 });
  const explicitLabel = props["aria-label"] || ariaLabel;
  const accessibleLabel = explicitLabel || label || props.title || "Pasirinkimas";
  useLayoutEffect(() => {
    if (explicitLabel) return;
    const source = trigger.current?.closest("label") || (id ? [...document.querySelectorAll("label[for]")].find(node => node.htmlFor === id) : null);
    if (source) { const clone = source.cloneNode(true); clone.querySelectorAll(".s24-select").forEach(node => node.remove()); setLabel(clone.textContent.trim()); }
  }, [explicitLabel, id, children]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect || !rect.width) { setOpen(false); return; }
      const viewport = window.visualViewport;
      const bottom = viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
      if (rect.bottom < 0 || rect.top > bottom || rect.right < 0 || rect.left > window.innerWidth) { setOpen(false); return; }
      const below = bottom - rect.bottom - 12, above = rect.top - 12;
      const upwards = below < 180 && above > below;
      const height = Math.max(40, Math.min(260, upwards ? above - 6 : below - 6));
      const width = Math.min(rect.width, window.innerWidth - 24);
      setPosition({ position: "fixed", width, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), maxHeight: height,
        ...(upwards ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }), fontFamily: getComputedStyle(trigger.current).fontFamily });
    }
    function outside(event) { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }
    place(); document.addEventListener("pointerdown", outside, true); document.addEventListener("keydown", escape);
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place); if (trigger.current) observer?.observe(trigger.current);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); observer?.disconnect(); };
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: "nearest" }); }, [active, open, listId]);
  function firstIndex() { return selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : Math.max(0, options.findIndex(option => !option.disabled)); }
  function choose(index) {
    const option = options[index]; if (disabled || !option || option.disabled) return;
    if (native.current) native.current.value = option.value;
    setLocalValue(option.value); setInvalid(false); setOpen(false);
    if (option.value !== (selected?.value ?? "")) onChange?.({ target: native.current, currentTarget: native.current, type: "change" });
    trigger.current?.focus();
  }
  function keyDown(event) {
    if (disabled) return;
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); return; }
    if (event.key === "Tab") { setOpen(false); return; }
    if (["Enter", " "].includes(event.key)) { event.preventDefault(); if (open) choose(active); else { setActive(firstIndex()); setOpen(true); } return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); const enabled = options.map((option,index) => option.disabled ? -1 : index).filter(index => index >= 0); if (!enabled.length) return;
      let next = firstIndex();
      if (event.key === "Home") next = enabled[0]; else if (event.key === "End") next = enabled.at(-1);
      else if (open) { const n = enabled.indexOf(active); next = enabled[(n + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]; }
      setActive(next); setOpen(true); return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now(); search.current = { text: (now - search.current.at < 700 ? search.current.text : "") + event.key.toLocaleLowerCase("lt"), at: now };
      const index = options.findIndex(option => !option.disabled && option.label.toLocaleLowerCase("lt").startsWith(search.current.text));
      if (index >= 0) { event.preventDefault(); setActive(index); setOpen(true); }
    }
  }
  return <span className="s24-select">
    <button id={triggerId} ref={node => { trigger.current = node; if (typeof buttonRef === "function") buttonRef(node); else if (buttonRef) buttonRef.current = node; }}
      type="button" role="combobox" className={`s24-select-trigger ${className}`} style={style} disabled={disabled}
      aria-label={props["aria-labelledby"] ? undefined : accessibleLabel} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]}
      aria-haspopup="listbox" aria-controls={listId} aria-expanded={open && !disabled} aria-activedescendant={open ? `${listId}-${active}` : undefined}
      aria-required={required || undefined} aria-invalid={props["aria-invalid"] || invalid || undefined}
      onClick={() => { if (!open) setActive(firstIndex()); setOpen(!open); }} onKeyDown={keyDown}
      onBlur={event => { if (!menu.current?.contains(event.relatedTarget)) setOpen(false); onBlur?.({ ...event, target: native.current, currentTarget: native.current }); }}>
      <span className="s24-select-value">{selected?.label || "Pasirinkite"}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9L12 15L18 9" /></svg>
    </button>
    <select {...props} id={`${triggerId}-native`} ref={node => { native.current = node; if (typeof forwardedRef === "function") forwardedRef(node); else if (forwardedRef) forwardedRef.current = node; }}
      className="s24-select-native" aria-hidden="true" tabIndex={-1} value={value === undefined ? localValue : value} disabled={disabled} required={required}
      onChange={event => { setLocalValue(event.target.value); setInvalid(false); onChange?.(event); }}
      onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); props.onInvalid?.(event); }}>
      {children}
    </select>
    {open && !disabled && position ? createPortal(<div ref={menu} id={listId} role="listbox" aria-label={accessibleLabel} className="s24-select-menu" style={position}
      onPointerDown={event => event.preventDefault()}>
      {options.map((option,index) => <React.Fragment key={`${index}-${option.value}`}>
        {option.group && option.group !== options[index - 1]?.group ? <div className="s24-select-group" role="presentation">{option.group}</div> : null}
        <div id={`${listId}-${index}`} role="option" aria-selected={option.value === selected?.value} aria-disabled={option.disabled || undefined}
          className={`s24-select-option${index === active ? " active" : ""}`} onPointerMove={() => { if (!option.disabled) setActive(index); }} onClick={() => choose(index)}>
          <span>{option.label}</span>{option.value === selected?.value ? <span aria-hidden="true">✓</span> : null}
        </div>
      </React.Fragment>)}
    </div>, document.body) : null}
  </span>;
});
