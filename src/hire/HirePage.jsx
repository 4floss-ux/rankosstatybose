import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { Svg } from "../p24/Shell.jsx";
import { HIRE_COPY, HIRE_INITIAL_REQUEST_COPY, HIRE_LANGUAGES, HIRE_OPTION_LABELS } from "./hireShared.jsx";
import { HIRE_PORTAL_LOGIN_COPY } from "./hirePortalShared.jsx";
import "../p24/p24.css";
import "../p24/hire.css";

/* Viešas /hire puslapis – prototipo vieno ekrano forma (įmonės užklausa). */
export function HirePage() {
  const supportedLanguageCodes = HIRE_LANGUAGES.map((item) => item.code);
  const detectInitialLanguage = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
    if (supportedLanguageCodes.includes(queryLanguage)) return queryLanguage;
    try {
      const saved = window.localStorage.getItem("hire-language");
      if (supportedLanguageCodes.includes(saved)) return saved;
    } catch { /* Optional preference storage. */ }
    const browserLanguage = String(window.navigator?.language || "").toLowerCase();
    if (browserLanguage.startsWith("lt")) return "lt";
    if (browserLanguage.startsWith("de")) return "de";
    if (browserLanguage.startsWith("nl")) return "nl";
    if (browserLanguage.startsWith("no") || browserLanguage.startsWith("nb") || browserLanguage.startsWith("nn")) return "no";
    if (browserLanguage.startsWith("sv")) return "sv";
    if (browserLanguage.startsWith("da")) return "da";
    return "en";
  };

  const [lang, setLang] = useState(detectInitialLanguage);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const t = HIRE_COPY[lang] || HIRE_COPY.en;
  const ir = HIRE_INITIAL_REQUEST_COPY[lang] || HIRE_INITIAL_REQUEST_COPY.en;

  const createInitialRequestForm = () => ({
    companyName: "", companyCountry: "", contactName: "", jobTitle: "", email: "", phone: "",
    roles: [{ profession: "", count: 1 }],
    jobCountry: "", jobLocation: "", startDate: "", additionalInfo: "", consent: false,
  });
  const [form, setForm] = useState(createInitialRequestForm);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlLang = document.documentElement.lang;
    const existingRobots = document.querySelector('meta[name="robots"]');
    const previousRobots = existingRobots?.getAttribute("content") ?? null;
    const robots = existingRobots || document.createElement("meta");
    if (!existingRobots) {
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousHtmlLang;
      if (existingRobots) {
        if (previousRobots === null) existingRobots.removeAttribute("content");
        else existingRobots.setAttribute("content", previousRobots);
      } else robots.remove();
    };
  }, []);

  useEffect(() => {
    document.title = t.metaTitle;
    document.documentElement.lang = ({ no: "nb" })[lang] || lang;
  }, [lang, t.metaTitle]);


  const changeLanguage = (code) => {
    if (!supportedLanguageCodes.includes(code)) return;
    setLang(code);
    setErrors({});
    try { window.localStorage.setItem("hire-language", code); } catch { /* Optional preference storage. */ }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", code);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const optionLabel = (value) => HIRE_OPTION_LABELS[lang]?.[value] || value;
  const countryValues = ["Germany","Netherlands","Norway","Sweden","Denmark","Finland","Belgium","Austria","Other"];

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };



  const requestErrors = () => {
    const next = {};
    if (!form.companyName.trim()) next.companyName = ir.errors.companyName;
    if (!form.companyCountry) next.companyCountry = ir.errors.companyCountry;
    if (!form.contactName.trim()) next.contactName = ir.errors.contactName;
    if (!form.jobTitle.trim()) next.jobTitle = ir.errors.jobTitle;
    if (!form.email.trim()) next.email = ir.errors.email;
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = ir.errors.emailValid;
    if (!form.consent) next.consent = ir.errors.consent;
    return next;
  };

  const requestWindowTop = () => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  const submitInitialRequest = async () => {
    const nextErrors = requestErrors();
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) return;
    if (!supabase) {
      setSubmitError("Submission service is temporarily unavailable. Please contact Statybos24 by email.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await supabase.rpc("submit_foreign_hire_request", {
        p_company_name: form.companyName.trim(),
        p_company_country: form.companyCountry,
        p_contact_name: form.contactName.trim(),
        p_contact_job_title: form.jobTitle.trim(),
        p_business_email: form.email.trim().toLowerCase(),
        p_phone: form.phone.trim() || null,
        p_project_country: null,
        p_project_location: null,
        p_requested_start_date: null,
        p_roles: [],
        p_additional_info: null,
        p_language_code: lang,
        p_consent: Boolean(form.consent),
      });

      if (result.error) throw result.error;
      setSubmitted(true);
      requestWindowTop();
    } catch (err) {
      setSubmitError(
        err?.message ||
          "We could not submit the request. Please try again or contact Statybos24 by email."
      );
    } finally {
      setSubmitting(false);
    }
  };
  const resetInitialRequest = () => {
    setForm(createInitialRequestForm());
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
    requestWindowTop();
  };

  const err = (key) => (errors[key] ? <span className="ferr">{errors[key]}</span> : null);
  const field = (key, label, type = "text", hint = "", auto = "off") => (
    <label className="field" htmlFor={`hf-${key}`}>{label} *
      <input id={`hf-${key}`} type={type} value={form[key]} autoComplete={auto} onChange={(e) => setField(key, e.target.value)} aria-invalid={Boolean(errors[key])} />
      {hint ? <span className="hint">{hint}</span> : null}{err(key)}
    </label>
  );

  return (
    <div className="p24 hire-p24">
      <div className="h-one">
        <header className="pub-top h-top2"><div className="h-in">
          <span className="h-brand"><img src="/brand-logo-tight.png" alt="statybos24.lt" /><i className="h-sep" aria-hidden="true" /><span className="h-blab">{t.sidebarLabel}</span></span>
          <div className="h-tright">
            <div className="h-lsel"><select aria-label={t.language || "Language"} value={lang} onChange={(e) => changeLanguage(e.target.value)}>
              {HIRE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select></div>
            <a className="btn" href={`/hire/login?lang=${lang}`}>{(HIRE_PORTAL_LOGIN_COPY[lang] || HIRE_PORTAL_LOGIN_COPY.en).signIn}</a>
          </div>
        </div></header>
        <main className="h-hero"><div className="lp-glow" aria-hidden="true" /><div className="h-in h-hero-in">
          <div className="h-hero-tx"><h1>{ir.title}</h1><p>{ir.intro}</p>
            <div className="h-next"><b>{ir.nextTitle}</b><ol>{ir.nextSteps.map((x, i) => <li key={i}><span>{i + 1}</span><p>{x}</p></li>)}</ol></div>
            <div className="h-warn"><Svg name="shield" size={17} /><span>{ir.important}</span></div>
            <p className="h-mail"><b>{ir.questionsTitle}</b> {ir.questionsText}</p>
          </div>
          {submitted ? (
            <div className="h-card h-card-done"><div className="h-done"><Svg name="check" size={28} width={2.6} /></div><h2>{ir.successTitle}</h2><p>{ir.successText}</p><p className="h-imp">{ir.important}</p>
              <button className="btn" type="button" onClick={resetInitialRequest}>{ir.reset}</button></div>
          ) : (
            <form className="h-card h-form" noValidate onSubmit={(e) => { e.preventDefault(); if (!submitting) submitInitialRequest(); }}>
              <h2>{ir.companySection}</h2>
              <div className="h-grid">
                {field("companyName", ir.companyName, "text", "", "organization")}
                <label className="field" htmlFor="hf-country">{ir.companyCountry} *
                  <select id="hf-country" value={form.companyCountry} onChange={(e) => setField("companyCountry", e.target.value)} aria-invalid={Boolean(errors.companyCountry)}>
                    <option value="">—</option>{countryValues.map((x) => <option key={x} value={x}>{optionLabel(x)}</option>)}
                  </select>{err("companyCountry")}</label>
                {field("contactName", ir.contactName, "text", "", "name")}
                {field("jobTitle", ir.jobTitle, "text", "", "organization-title")}
              </div>
              {field("email", ir.email, "email", ir.emailHint, "email")}
              <label className="field" htmlFor="hf-phone">{ir.phone}<input id="hf-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></label>
              <label className="h-consent"><input type="checkbox" checked={form.consent} onChange={(e) => setField("consent", e.target.checked)} /><span>{ir.consent}</span></label>{err("consent")}
              {submitError ? <p className="ferr" role="alert" style={{ margin: 0 }}>{submitError}</p> : null}
              <button className="btn primary lp-big" type="submit" disabled={submitting}>{submitting ? "…" : ir.submit}</button>
            </form>
          )}
        </div></main>
        <footer className="h-foot2"><div className="h-in"><span>© {new Date().getFullYear()} statybos24.lt</span></div></footer>
      </div>
    </div>
  );
}
