import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { BrandImage, BrandLogo } from "../ui/brand.jsx";
import { AppBootLoader } from "../ui/AppBootLoader.jsx";
import { HIRE_COMPACT_COPY, HIRE_COPY, HIRE_INITIAL_REQUEST_COPY, HIRE_LANGUAGES, HIRE_OPTION_LABELS, HIRE_PROFESSIONS, HIRE_PROFESSION_LABELS, HireArrowIcon, HireCheckIcon, HireDropdown, HireInput, HireSelect, HireSideIcon } from "./hireShared.jsx";

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
  const [activeSection, setActiveSection] = useState("hire-overview");
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const t = HIRE_COPY[lang] || HIRE_COPY.en;
  const c = HIRE_COMPACT_COPY[lang] || HIRE_COMPACT_COPY.en;
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

  useEffect(() => {
    if (!requestOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") setRequestOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [requestOpen]);

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
  const professionLabel = (value) => HIRE_PROFESSION_LABELS[lang]?.[value] || value;
  const options = (values) => values.map((value) => ({ value, label: optionLabel(value) }));
  const professionOptions = HIRE_PROFESSIONS.map((value) => ({ value, label: professionLabel(value) }));
  const countryValues = ["Germany","Netherlands","Norway","Sweden","Denmark","Finland","Belgium","Austria","Other"];

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };

  const updateRole = (index, key, value) => {
    setForm((current) => ({ ...current, roles: current.roles.map((role, roleIndex) => roleIndex === index ? { ...role, [key]: value } : role) }));
    if (errors.roles) setErrors((current) => ({ ...current, roles: "" }));
  };

  const addRole = () => setForm((current) => ({ ...current, roles: [...current.roles, { profession: "", count: 1 }] }));
  const removeRole = (index) => setForm((current) => ({ ...current, roles: current.roles.length > 1 ? current.roles.filter((_, roleIndex) => roleIndex !== index) : current.roles }));

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

  const requestWindowTop = () => requestAnimationFrame(() => document.querySelector(".hire-request-overlay")?.scrollTo({ top: 0, behavior: "smooth" }));
  const openRequest = () => { setRequestOpen(true); requestWindowTop(); };
  const closeRequest = () => { setRequestOpen(false); setErrors({}); };
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

  const navItems = [
    ["hire-overview", t.nav.overview, "overview"],
    ["hire-method", t.nav.process, "method"],
    ["hire-trades", t.nav.specialists, "trades"],
    ["hire-contact", t.email, "contact"],
  ];
  const languageSelect = (compact = false) => (
    <HireDropdown
      className="hire-language-dropdown"
      ariaLabel={t.language}
      value={lang}
      onChange={changeLanguage}
      compact={compact}
      placement={compact ? "down" : "up"}
      align={compact ? "right" : "left"}
      displayLabel={compact ? (HIRE_LANGUAGES.find((item) => item.code === lang)?.short || lang.toUpperCase()) : ""}
      options={HIRE_LANGUAGES.map((item) => ({
        value: item.code,
        label: `${item.short} · ${item.label}`,
      }))}
    />
  );

  return (
    <div className="hire-page hire-v3" id="hire-top">
      <style>{`
        .hire-v3{
          --ink:#222631;--ink-2:#282d3a;--orange:#6b5b95;--orange-2:#8070ab;--paper:#f4f1ea;
          --paper-2:#ebe7de;--white:#fff;--muted:#6d7881;--line:rgba(34,38,49,.16);--green:#2f7c5d;
          min-height:100vh;background:var(--paper);color:var(--ink);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          overflow-x:hidden;-webkit-font-smoothing:antialiased;
        }
        .hire-v3 *{box-sizing:border-box}.hire-v3 button,.hire-v3 input,.hire-v3 select,.hire-v3 textarea{font:inherit}
        .hire-v3 button:disabled{opacity:.58;cursor:wait}.hire-request-submit-error{margin-top:12px;padding:11px 13px;border:1px solid rgba(182,77,42,.22);border-radius:10px;background:#fff0ec;color:#9e4527;font-size:13px;font-weight:750;line-height:1.45}
        .hire-shell{width:min(1240px,calc(100% - 56px));margin:0 auto}.hire-anchor{scroll-margin-top:88px}

        .hire-topbar{position:sticky;top:0;z-index:300;background:rgba(244,241,234,.9);border-bottom:1px solid var(--line);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
        .hire-topbar-inner{height:76px;display:flex;align-items:center;justify-content:space-between;gap:24px}.hire-top-meta{display:flex;align-items:center;gap:12px}
        .hire-private{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:8px 10px;border:1px solid var(--line);background:rgba(255,255,255,.5)}
        .hire-nav{display:flex;align-items:center;gap:24px;margin-left:auto}.hire-nav a{color:var(--ink);text-decoration:none;font-size:12px;font-weight:800}.hire-nav a:hover{color:var(--orange)}
        .hire-btn{min-height:48px;padding:12px 18px;border:1px solid transparent;background:none;color:inherit;cursor:pointer;font-weight:900;font-size:12px;letter-spacing:.01em;display:inline-flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;transition:transform .15s ease,background .15s ease,color .15s ease,border-color .15s ease}
        .hire-btn:hover{transform:translateY(-1px)}.hire-btn.primary{background:var(--orange);color:#fff;border-color:var(--orange)}.hire-btn.primary:hover{background:#594b80;border-color:#594b80}.hire-btn.dark{background:var(--ink);color:#fff;border-color:var(--ink)}.hire-btn.ghost{border-color:var(--line);background:rgba(255,255,255,.42)}.hire-btn.ghost:hover{background:#fff}.hire-btn.full{width:100%}

        .hire-hero{position:relative;padding:72px 0 54px;border-bottom:1px solid var(--line)}
        .hire-hero:before{content:"";position:absolute;left:0;right:0;top:46%;height:1px;background:var(--line);pointer-events:none}
        .hire-hero-kicker{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:28px;font-size:10px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#6b747c}.hire-hero-kicker span:last-child{color:#483d67}
        .hire-hero-title{position:relative;margin:0;max-width:1150px;font-family:Manrope,Inter,sans-serif;font-size:clamp(58px,8.5vw,132px);line-height:.82;letter-spacing:-.075em;text-transform:uppercase;font-weight:900}
        .hire-hero-title .line{display:block}.hire-hero-title .accent{display:inline-block;color:var(--orange);position:relative}.hire-hero-title .accent:after{content:"";position:absolute;left:-.02em;right:-.05em;bottom:.03em;height:.08em;background:var(--ink);transform:rotate(-1deg);opacity:.9}
        .hire-hero-bottom{display:grid;grid-template-columns:minmax(0,.78fr) minmax(420px,1.22fr);gap:70px;align-items:end;margin-top:44px}
        .hire-hero-copy{max-width:500px}.hire-hero-copy p{margin:0;color:#53616c;font-size:16px;line-height:1.72}.hire-hero-copy strong{color:var(--ink)}.hire-hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
        .hire-brief-board{position:relative;background:var(--ink);color:#fff;border:1px solid var(--ink);padding:0}.hire-brief-board:before{content:"REQUEST BUILDER";position:absolute;right:14px;top:-24px;color:#7c858b;font-size:9px;letter-spacing:.16em;font-weight:900}
        .hire-brief-row{display:grid;grid-template-columns:120px 1fr auto;gap:18px;align-items:center;padding:15px 17px;border-bottom:1px solid rgba(255,255,255,.14)}.hire-brief-row:last-child{border-bottom:0}.hire-brief-row span{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#91a2af;font-weight:900}.hire-brief-row b{font-size:14px}.hire-brief-row em{font-style:normal;color:#a396c6;font-size:11px;font-weight:900}
        .hire-brief-foot{display:flex;justify-content:space-between;gap:18px;padding:13px 17px;background:var(--orange);color:#fff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.09em}

        .hire-marquee{overflow:hidden;border-bottom:1px solid var(--line);background:#fff}.hire-marquee-track{display:flex;width:max-content;animation:hire-marquee 34s linear infinite}.hire-marquee-item{display:flex;align-items:center;gap:18px;padding:17px 28px;border-right:1px solid var(--line);white-space:nowrap;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.hire-marquee-item i{width:8px;height:8px;border-radius:50%;background:var(--orange);display:block}
        @keyframes hire-marquee{to{transform:translateX(-50%)}}

        .hire-section{padding:96px 0}.hire-section.white{background:#fff}.hire-section.dark{background:var(--ink);color:#fff}.hire-section.orange{background:var(--orange);color:#fff}
        .hire-section-head{display:grid;grid-template-columns:170px minmax(0,1fr);gap:34px;align-items:start;margin-bottom:54px}.hire-index{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#463b64;padding-top:8px}.hire-section.dark .hire-index{color:#a396c6}
        .hire-section-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:clamp(38px,5vw,68px);line-height:.98;letter-spacing:-.055em;max-width:900px}.hire-section-head p{margin:18px 0 0;max-width:650px;color:var(--muted);font-size:15px;line-height:1.7}.hire-section.dark .hire-section-head p{color:#afbdc8}
        .hire-manifesto{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.hire-manifesto article{padding:30px 28px 34px;border-right:1px solid var(--line)}.hire-manifesto article:first-child{padding-left:0}.hire-manifesto article:last-child{border-right:0}.hire-manifesto .num{display:block;color:var(--orange);font-size:11px;font-weight:950;letter-spacing:.14em}.hire-manifesto h3{margin:28px 0 10px;font-family:Manrope,Inter,sans-serif;font-size:24px;letter-spacing:-.035em}.hire-manifesto p{margin:0;color:var(--muted);font-size:13px;line-height:1.65}

        .hire-signal-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(255,255,255,.2);border-bottom:1px solid rgba(255,255,255,.2)}.hire-signal{min-height:290px;padding:30px;border-right:1px solid rgba(255,255,255,.2);display:flex;flex-direction:column;justify-content:space-between}.hire-signal:last-child{border-right:0}.hire-signal-label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#a9bac6;font-weight:900}.hire-signal-symbol{font-family:Manrope,Inter,sans-serif;font-size:72px;line-height:.8;color:var(--orange);font-weight:900;letter-spacing:-.08em}.hire-signal h3{margin:0 0 8px;font-size:20px}.hire-signal p{margin:0;color:#aebcc7;font-size:13px;line-height:1.6}

        .hire-role-wall{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid var(--line);border-top:1px solid var(--line)}.hire-role-wall span{min-height:86px;display:flex;align-items:flex-end;padding:14px 16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);font-weight:850;font-size:12px;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.52));position:relative}.hire-role-wall span:before{content:"+";position:absolute;top:12px;right:14px;color:var(--orange);font-size:18px;font-weight:400}

        .hire-request-wrap{padding:0 0 100px;background:var(--paper)}.hire-request-shell{width:min(1240px,calc(100% - 56px));margin:0 auto;border:1px solid var(--ink);background:#fff}.hire-request-head{display:grid;grid-template-columns:1fr auto;gap:24px;padding:26px 30px;border-bottom:1px solid var(--ink);background:var(--ink);color:#fff}.hire-request-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:clamp(32px,4vw,52px);letter-spacing:-.05em}.hire-request-head p{margin:7px 0 0;color:#adbdc9;font-size:13px}.hire-request-badge{align-self:start;padding:8px 10px;border:1px solid rgba(255,255,255,.28);font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#a99dca}
        .hire-request-grid{display:grid;grid-template-columns:255px minmax(0,1fr);min-height:620px}.hire-step-rail{border-right:1px solid var(--ink);background:var(--paper-2);padding:0}.hire-step-button{width:100%;min-height:96px;border:0;border-bottom:1px solid var(--line);background:transparent;color:#7a838a;text-align:left;padding:17px 20px;cursor:pointer;display:grid;grid-template-columns:34px 1fr;gap:13px;align-items:center}.hire-step-button:last-child{border-bottom:0}.hire-step-button .n{font-family:Manrope,Inter,sans-serif;font-size:22px;font-weight:900;color:#9da3a6}.hire-step-button .l{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.hire-step-button.active{background:var(--orange);color:#fff}.hire-step-button.active .n{color:#fff}.hire-step-button.done .n{color:var(--green)}.hire-step-button:disabled{cursor:default}
        .hire-form-panel{padding:34px 38px 30px;min-width:0}.hire-form-top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid var(--line)}.hire-form-top .eyebrow{font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;color:#4c406c}.hire-form-top h3{margin:7px 0 0;font-family:Manrope,Inter,sans-serif;font-size:28px;letter-spacing:-.035em}.hire-form-top p{margin:7px 0 0;color:var(--muted);font-size:12px;line-height:1.6;max-width:630px}.hire-step-count{font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#7a848c;white-space:nowrap}
        .hire-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.hire-field{display:grid;gap:7px;min-width:0}.hire-field.full{grid-column:1/-1}.hire-label{font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#53616c}.hire-label b{color:var(--orange);margin-left:3px}.hire-input{width:100%;min-width:0;min-height:48px;border:0;border-bottom:1px solid #aeb7bd;background:#faf9f5;color:var(--ink);padding:11px 12px;border-radius:0;outline:none;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease}.hire-input:hover{background:#fff}.hire-input:focus{border-bottom-color:var(--orange);box-shadow:inset 0 -2px 0 var(--orange);background:#fff}.hire-input.invalid{border-bottom-color:#c94737;box-shadow:inset 0 -2px 0 #c94737}.hire-input::placeholder{color:#9aa2a7}.hire-field textarea.hire-input{min-height:120px;resize:vertical;padding-top:13px}.hire-hint{font-size:10px;color:#889197}.hire-error{font-size:10px;color:#b9392b;font-weight:800}.hire-dropdown{position:relative;display:block;width:100%;min-width:0}.hire-dropdown-trigger{width:100%;min-width:0;min-height:48px;border:0;border-bottom:1px solid #aeb7bd;background:#faf9f5;color:var(--ink);padding:11px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:pointer;outline:none;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease}.hire-dropdown-trigger:hover{background:#fff}.hire-dropdown-trigger:focus-visible,.hire-dropdown.open .hire-dropdown-trigger{border-bottom-color:var(--orange);box-shadow:inset 0 -2px 0 var(--orange);background:#fff}.hire-dropdown-trigger.invalid{border-bottom-color:#c94737;box-shadow:inset 0 -2px 0 #c94737}.hire-dropdown-trigger:disabled{opacity:.55;cursor:not-allowed}.hire-dropdown-trigger>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hire-dropdown-trigger .placeholder{color:#9aa2a7}.hire-dropdown-chevron{width:18px;height:18px;flex:0 0 18px;color:#657681;transition:transform .16s ease}.hire-dropdown.open .hire-dropdown-chevron{transform:rotate(180deg)}.hire-dropdown-menu{position:absolute;left:0;right:0;top:calc(100% + 7px);z-index:15000;display:grid;gap:3px;padding:6px;background:#fff;border:1px solid #dce5eb;border-radius:11px;box-shadow:0 18px 45px rgba(34,38,49,.16);max-height:272px;overflow-y:auto;overscroll-behavior:contain}.hire-dropdown.drop-up .hire-dropdown-menu{top:auto;bottom:calc(100% + 7px)}.hire-dropdown.align-right .hire-dropdown-menu{left:auto;right:0;min-width:190px}.hire-dropdown-menu button{width:100%;min-height:38px;padding:9px 10px;border:0;border-radius:8px;background:#fff;color:#263d50;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font-size:11px;font-weight:750;cursor:pointer;transition:background .12s ease,color .12s ease}.hire-dropdown-menu button:hover,.hire-dropdown-menu button:focus-visible{outline:none;background:#f4f7f9;color:#222631}.hire-dropdown-menu button.active{background:#f0edf7;color:#433960;font-weight:900}.hire-dropdown-menu button svg{width:16px;height:16px;flex:0 0 16px}.hire-dropdown.compact .hire-dropdown-trigger{min-height:40px;padding:8px 9px;border:1px solid #dfe7ec;border-radius:9px;background:#fff;font-size:10px;font-weight:900}.hire-dropdown.compact .hire-dropdown-trigger:focus-visible,.hire-dropdown.compact.open .hire-dropdown-trigger{border-color:#8c7db3;box-shadow:0 0 0 3px rgba(107,91,149,.11)}
        .hire-segment{display:flex;flex-wrap:wrap;border-bottom:1px solid #aeb7bd;background:#faf9f5}.hire-segment button{min-height:47px;padding:9px 14px;border:0;border-right:1px solid var(--line);background:transparent;color:#64717a;font-size:11px;font-weight:850;cursor:pointer}.hire-segment button.active{background:var(--ink);color:#fff}.hire-segment button:last-child{border-right:0}
        .hire-subsection{grid-column:1/-1;margin-top:8px;padding-top:22px;border-top:1px solid var(--line)}.hire-subsection-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.hire-subsection h4{margin:0;font-family:Manrope,Inter,sans-serif;font-size:19px}.hire-subsection p{margin:5px 0 0;color:var(--muted);font-size:11px}
        .hire-role-editor{grid-column:1/-1;border:1px solid var(--ink);background:#fff}.hire-role-editor-head{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 15px;background:var(--ink);color:#fff}.hire-role-editor-head b{font-size:12px}.hire-role-editor-head button{border:0;background:transparent;color:#ab9fcb;font-size:11px;font-weight:900;cursor:pointer}.hire-role-editor-grid{display:grid;grid-template-columns:2fr .65fr 1fr 1fr 1fr;gap:12px;padding:16px}.hire-role-editor-grid .hire-field{gap:5px}
        .hire-count{display:flex;border-bottom:1px solid #aeb7bd;background:#faf9f5}.hire-count button{width:38px;border:0;background:transparent;color:var(--ink);font-size:18px;cursor:pointer}.hire-count input{width:100%;min-width:0;border:0;background:transparent;text-align:center;font-weight:900;outline:none}.hire-add-role{grid-column:1/-1;display:flex;justify-content:flex-start}.hire-add-role button{border:0;background:transparent;color:#493d68;padding:0;font-size:11px;font-weight:900;cursor:pointer}
        .hire-checkbox-row{grid-column:1/-1;display:flex;gap:11px;align-items:flex-start;padding:15px 0;border-top:1px solid var(--line);color:#59666f;font-size:11px;line-height:1.55}.hire-checkbox-row input{margin-top:2px;accent-color:var(--orange)}.hire-checkbox-row.invalid{color:#a73d31}
        .hire-review{display:grid;gap:0;border-top:1px solid var(--ink);border-left:1px solid var(--ink)}.hire-review-card{border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:18px}.hire-review-card h4{margin:0 0 14px;display:flex;justify-content:space-between;gap:12px;font-size:13px}.hire-review-card h4 button{border:0;background:none;color:#483d67;font-size:10px;font-weight:900;cursor:pointer}.hire-review-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.hire-review-item span{display:block;color:#7c878e;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.07em}.hire-review-item b{display:block;margin-top:4px;font-size:12px;line-height:1.45}.hire-preview-notice{margin-top:18px;padding:13px 14px;background:#f4f3f9;border-left:3px solid var(--orange);color:#7b5a3e;font-size:10px;line-height:1.55}
        .hire-form-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:30px;padding-top:22px;border-top:1px solid var(--line)}.hire-form-actions .right{display:flex;gap:10px;margin-left:auto}
        .hire-success{min-height:420px;display:grid;place-items:center;text-align:center;padding:60px 24px}.hire-success-mark{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:var(--orange);color:#fff;margin:0 auto 18px}.hire-success h3{margin:0;font-family:Manrope,Inter,sans-serif;font-size:34px;letter-spacing:-.04em}.hire-success p{max-width:560px;margin:12px auto 0;color:var(--muted);line-height:1.65}.hire-success .hire-btn{margin-top:24px}

        .hire-faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}.hire-faq h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:44px;line-height:1;letter-spacing:-.05em}.hire-faq-list{border-top:1px solid var(--line)}.hire-faq-item{display:grid;grid-template-columns:1fr 1.35fr;gap:24px;padding:19px 0;border-bottom:1px solid var(--line)}.hire-faq-item h3{margin:0;font-size:13px}.hire-faq-item p{margin:0;color:var(--muted);font-size:12px;line-height:1.65}
        .hire-final{padding:62px 0;background:var(--orange);color:#fff}.hire-final-inner{display:flex;align-items:center;justify-content:space-between;gap:40px}.hire-final h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:clamp(38px,5vw,68px);line-height:.95;letter-spacing:-.055em;max-width:800px}.hire-final .hire-btn.dark{flex:0 0 auto}
        .hire-footer{background:#222631;color:#8ea0ae}.hire-footer-inner{min-height:88px;display:flex;align-items:center;justify-content:space-between;gap:22px}.hire-footer-copy{font-size:10px}.hire-footer-contact{color:#fff;text-decoration:none;font-size:11px;font-weight:850}

        @media (max-width:980px){
          .hire-shell,.hire-request-shell{width:min(100% - 32px,900px)}.hire-nav{display:none}.hire-hero-title{font-size:clamp(56px,11vw,100px)}.hire-hero-bottom{grid-template-columns:1fr;gap:44px}.hire-brief-board{max-width:760px}.hire-manifesto,.hire-signal-grid{grid-template-columns:1fr}.hire-manifesto article,.hire-signal{border-right:0;border-bottom:1px solid var(--line)}.hire-manifesto article:first-child{padding-left:28px}.hire-signal-grid .hire-signal{border-bottom-color:rgba(255,255,255,.2)}.hire-signal:last-child{border-bottom:0}.hire-role-wall{grid-template-columns:repeat(3,1fr)}.hire-request-grid{grid-template-columns:1fr}.hire-step-rail{border-right:0;border-bottom:1px solid var(--ink);display:grid;grid-template-columns:repeat(5,1fr)}.hire-step-button{min-height:74px;border-bottom:0;border-right:1px solid var(--line);grid-template-columns:1fr;text-align:center;gap:4px;padding:10px 6px}.hire-step-button:last-child{border-right:0}.hire-step-button .n{font-size:18px}.hire-step-button .l{font-size:8px}.hire-role-editor-grid{grid-template-columns:repeat(2,1fr)}.hire-role-editor-grid .hire-field:first-child{grid-column:1/-1}.hire-faq{grid-template-columns:1fr;gap:34px}
        }
        @media (max-width:650px){
          .hire-shell,.hire-request-shell{width:calc(100% - 22px)}.hire-topbar-inner{height:66px}.hire-private{display:none}.hire-top-meta .hire-btn{display:none}.hire-hero{padding:48px 0 38px}.hire-hero-kicker{font-size:8px}.hire-hero-title{font-size:clamp(48px,17vw,78px);line-height:.84}.hire-hero-bottom{margin-top:32px;gap:34px}.hire-hero-copy p{font-size:14px}.hire-hero-actions{display:grid;grid-template-columns:1fr}.hire-hero-actions .hire-btn{width:100%}.hire-brief-row{grid-template-columns:84px 1fr;gap:10px}.hire-brief-row em{grid-column:2}.hire-brief-foot{display:grid;gap:5px}.hire-section{padding:68px 0}.hire-section-head{grid-template-columns:1fr;gap:10px;margin-bottom:32px}.hire-index{padding-top:0}.hire-section-head h2{font-size:39px}.hire-manifesto article{padding:24px 16px}.hire-manifesto article:first-child{padding-left:16px}.hire-role-wall{grid-template-columns:repeat(2,1fr)}.hire-role-wall span{min-height:72px;padding:12px;font-size:11px}.hire-request-wrap{padding-bottom:70px}.hire-request-head{padding:20px 18px;grid-template-columns:1fr}.hire-request-badge{justify-self:start}.hire-request-head h2{font-size:34px}.hire-step-rail{overflow-x:auto;grid-template-columns:repeat(5,minmax(76px,1fr))}.hire-step-button{min-width:76px}.hire-step-button .l{font-size:7px}.hire-form-panel{padding:24px 16px 20px}.hire-form-top{display:grid;gap:10px}.hire-step-count{grid-row:1}.hire-form-grid{grid-template-columns:1fr;gap:15px}.hire-field.full,.hire-subsection{grid-column:auto}.hire-role-editor-grid{grid-template-columns:1fr;padding:13px}.hire-role-editor-grid .hire-field:first-child{grid-column:auto}.hire-segment{display:grid;grid-template-columns:repeat(2,1fr)}.hire-segment button{border-bottom:1px solid var(--line)}.hire-review-grid{grid-template-columns:1fr}.hire-form-actions{align-items:stretch}.hire-form-actions>.hire-btn,.hire-form-actions .right,.hire-form-actions .right .hire-btn{width:100%}.hire-form-actions>span{display:none}.hire-faq h2{font-size:38px}.hire-faq-item{grid-template-columns:1fr;gap:7px}.hire-final-inner{display:grid;gap:28px}.hire-final .hire-btn{width:100%}.hire-footer-inner{padding:22px 0;display:grid;justify-items:start}
        }
        @media (prefers-reduced-motion:reduce){.hire-marquee-track{animation:none}.hire-btn{transition:none}.hire-btn:hover{transform:none}}

        /* ===== HIRE V4 · SIDEBAR / CLEAR B2B WORKFORCE UI ===== */
        .hire-v3{--v4-navy:#222631;--v4-navy-2:#303544;--v4-orange:#6b5b95;--v4-bg:#f6f8fb;--v4-line:#e5ebf0;--v4-text:#222631;--v4-muted:#6d7b88;background:var(--v4-bg);padding-left:236px;color:var(--v4-text)}
        .hire-v3 .hire-shell{width:min(1280px,calc(100% - 48px));margin-inline:auto}.hire-v3 .hire-anchor{scroll-margin-top:92px}
        .hire-sidebar{position:fixed;left:0;top:0;bottom:0;width:236px;background:#fff;border-right:1px solid var(--v4-line);z-index:520;display:flex;flex-direction:column;padding:24px 18px 18px;box-shadow:7px 0 28px rgba(34,38,49,.025)}
        .hire-side-brand{padding:0 10px 24px;border-bottom:1px solid #eef2f5}.hire-side-context{padding:19px 12px 9px;color:#98a4ae;font-size:9px;line-height:1.4;font-weight:900;letter-spacing:.12em}
        .hire-side-nav{display:grid;gap:5px}.hire-side-nav a{min-height:44px;display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:#667785;text-decoration:none;font-size:12px;font-weight:760;transition:.16s ease}.hire-side-nav a span{width:21px;height:21px;display:grid;place-items:center;flex:0 0 21px}.hire-side-nav a svg{width:18px;height:18px;display:block}.hire-side-nav a:hover{background:#f5f8fa;color:var(--v4-navy)}.hire-side-nav a.active{background:var(--v4-navy);color:#fff;box-shadow:0 8px 20px rgba(34,38,49,.12)}.hire-side-nav a.request-link{margin-top:8px;color:#433960;background:#f4f3f9;border:1px solid #d6d0e6}.hire-side-nav a.request-link:hover{background:var(--v4-orange);border-color:var(--v4-orange);color:#fff}
        .hire-side-foot{margin-top:auto;padding:14px 12px;border-radius:12px;background:#f7f9fb;display:grid;grid-template-columns:8px 1fr;gap:10px;align-items:start}.hire-side-foot .hire-status-dot{margin-top:4px}.hire-side-foot b{display:block;color:var(--v4-navy);font-size:10px}.hire-side-foot small{display:block;margin-top:4px;color:#82909c;font-size:9px;line-height:1.5}.hire-status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#44ad79;box-shadow:0 0 0 3px rgba(68,173,121,.11)}

        .hire-topbar{position:sticky;top:0;left:236px;z-index:400;background:rgba(255,255,255,.92);border-bottom:1px solid var(--v4-line);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .hire-topbar-inner-v4{min-height:72px;width:min(1280px,calc(100% - 48px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}.hire-mobile-brand{display:none}.hire-top-context{display:flex;align-items:center;gap:11px}.hire-top-context .hire-top-icon{width:38px;height:38px;border-radius:10px;background:#f3f6f8;color:var(--v4-navy);display:grid;place-items:center}.hire-top-context b{display:block;font-size:12px}.hire-top-context small{display:block;margin-top:2px;color:#82909b;font-size:10px}.hire-top-actions-v4{display:flex;align-items:center;gap:12px}.hire-route-pill{padding:7px 10px;border-radius:999px;background:#edf8f2;color:#32785c;font-size:9px;font-weight:900;letter-spacing:.04em}
        .hire-v3 .hire-btn{border-radius:9px;min-height:44px;padding:10px 15px;font-size:11px;letter-spacing:0}.hire-v3 .hire-btn.primary{background:var(--v4-navy);border-color:var(--v4-navy)}.hire-v3 .hire-btn.primary:hover{background:var(--v4-navy-2);border-color:var(--v4-navy-2)}.hire-v3 .hire-btn.ghost{background:#fff;border-color:#dce4ea;color:var(--v4-navy)}

        .hire-hero{padding:46px 0 24px;border:0;background:linear-gradient(180deg,#fff 0,#fbfcfd 100%)}.hire-hero:before{display:none}.hire-hero-grid-v4{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(430px,.97fr);gap:48px;align-items:center}.hire-hero-main-v4{padding:14px 0 10px}.hire-hero-kicker-v4{display:flex;align-items:center;gap:9px;color:#7b8995;font-size:9px;font-weight:900;letter-spacing:.13em}.hire-hero-title-v4{margin:19px 0 0;max-width:760px;font-family:Manrope,Inter,sans-serif;font-size:clamp(43px,5.2vw,72px);line-height:.98;letter-spacing:-.055em;text-transform:none;font-weight:900;color:var(--v4-navy)}.hire-hero-title-v4 span{color:var(--v4-orange)}.hire-hero-copy-v4{max-width:660px;margin:20px 0 0;color:#667684;font-size:14px;line-height:1.7}.hire-hero-copy-v4 b{color:var(--v4-navy)}.hire-hero-actions-v4{display:flex;gap:10px;flex-wrap:wrap;margin-top:25px}.hire-lane-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:26px}.hire-lane-tags span{padding:7px 9px;border:1px solid #e1e7ec;border-radius:8px;background:#fff;color:#75838f;font-size:9px;font-weight:800}
        .hire-route-card{background:#fff;border:1px solid var(--v4-line);border-radius:18px;padding:19px;box-shadow:0 18px 55px rgba(34,38,49,.08)}.hire-route-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:2px 2px 15px}.hire-route-card-head>div>span{color:#9aa6af;font-size:8px;font-weight:900;letter-spacing:.13em}.hire-route-card-head h2{margin:5px 0 0;font-family:Manrope,Inter,sans-serif;font-size:18px;letter-spacing:-.025em}.hire-live{display:flex;align-items:center;gap:6px;color:#6b887a;font-size:8px;font-weight:800;white-space:nowrap}.hire-live i{width:6px;height:6px;background:#44ad79;border-radius:50%}
        .hire-route-diagram{position:relative;height:250px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 22% 48%,rgba(107,91,149,.13),transparent 23%),linear-gradient(135deg,#eef4f8,#f8fafc);border:1px solid #e7edf1}.hire-route-diagram:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(34,38,49,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(34,38,49,.035) 1px,transparent 1px);background-size:26px 26px}.hire-route-diagram svg{position:absolute;inset:18px 12px;width:calc(100% - 24px);height:calc(100% - 36px)}.hire-route-diagram svg path{fill:none;stroke:#9fb5c5;stroke-width:1.5;stroke-dasharray:4 5}.hire-source-node{position:absolute;z-index:2;left:24px;top:83px;width:132px;padding:12px 13px;border-radius:12px;background:var(--v4-navy);color:#fff;box-shadow:0 10px 22px rgba(34,38,49,.18)}.hire-source-node span,.hire-source-node small{display:block;color:#9fb2c1;font-size:7px}.hire-source-node b{display:block;margin:3px 0;font-size:15px}.hire-market-node{position:absolute;z-index:2;right:24px;width:120px;min-height:42px;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid #dfe7ec;box-shadow:0 5px 15px rgba(34,38,49,.06);display:flex;align-items:center;gap:9px}.hire-market-node b{width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:#edf3f7;color:var(--v4-navy);font-size:9px}.hire-market-node span{font-size:9px;font-weight:850}.hire-market-node.n1{top:20px}.hire-market-node.n2{top:72px}.hire-market-node.n3{top:124px}.hire-market-node.n4{top:176px}.hire-route-card-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 2px 0;color:#677887;font-size:9px;font-weight:800}.hire-route-card-foot span{display:flex;align-items:center;gap:6px}.hire-route-card-foot svg{color:#42a372}
        .hire-value-row{display:grid;grid-template-columns:repeat(4,1fr);margin-top:30px;border:1px solid var(--v4-line);border-radius:15px;background:#fff;overflow:hidden}.hire-value-row>div{min-height:92px;padding:16px 17px;border-right:1px solid var(--v4-line);display:grid;grid-template-columns:38px 1fr;grid-template-rows:auto auto;column-gap:11px;align-content:center}.hire-value-row>div:last-child{border-right:0}.hire-value-icon{grid-row:1/3;width:36px;height:36px;border-radius:9px;background:#f3f6f8;color:var(--v4-navy);display:grid;place-items:center;font-weight:900}.hire-value-icon svg{width:19px;height:19px}.hire-value-row b{font-size:11px;align-self:end}.hire-value-row small{margin-top:3px;color:#8a97a2;font-size:8.5px;line-height:1.35}
        .hire-marquee{display:none}

        .hire-section{padding:72px 0;background:var(--v4-bg)}.hire-section.white{background:#fff}.hire-section.dark{background:#f2f6f9;color:var(--v4-text)}.hire-section-head{display:grid;grid-template-columns:minmax(0,1fr);gap:0;margin-bottom:31px}.hire-index{padding-top:5px;color:#a6b0b8;font-size:8px}.hire-section.dark .hire-index{color:#a6b0b8}.hire-section-head h2{max-width:800px;color:var(--v4-navy);font-size:clamp(30px,4vw,47px);line-height:1.03;letter-spacing:-.045em}.hire-section-head p,.hire-section.dark .hire-section-head p{max-width:720px;margin-top:12px;color:#71808d;font-size:13px;line-height:1.65}
        .hire-manifesto{gap:12px;border:0}.hire-manifesto article,.hire-manifesto article:first-child{padding:20px;border:1px solid var(--v4-line);border-radius:13px;background:#fff}.hire-manifesto article:last-child{border-right:1px solid var(--v4-line)}.hire-manifesto .num{color:var(--v4-orange);font-size:9px}.hire-manifesto h3{margin:17px 0 7px;font-size:18px}.hire-manifesto p{font-size:11px;line-height:1.6;color:#73818d}
        .hire-signal-grid{gap:12px;border:0}.hire-signal{min-height:220px;padding:22px;border:1px solid var(--v4-line);border-radius:13px;background:#fff;color:var(--v4-text)}.hire-signal:last-child{border-right:1px solid var(--v4-line)}.hire-signal-label{color:#84929d;font-size:8px}.hire-signal-symbol{font-size:48px;color:var(--v4-orange)}.hire-signal h3{font-size:17px;color:var(--v4-navy)}.hire-signal p{color:#75838f;font-size:11px}.hire-role-wall{grid-template-columns:repeat(4,1fr);gap:10px;border:0}.hire-role-wall span{min-height:72px;border:1px solid var(--v4-line);border-radius:11px;background:#fff;padding:14px;font-size:10px;align-items:center}.hire-role-wall span:before{top:50%;right:14px;transform:translateY(-50%);color:#c1cad1;font-size:16px}

        .hire-request-wrap{padding:0 0 78px;background:var(--v4-bg)}.hire-request-shell{width:min(1280px,calc(100% - 48px));border:1px solid var(--v4-line);border-radius:18px;overflow:hidden;box-shadow:0 18px 55px rgba(34,38,49,.06)}.hire-request-head{background:#fff;color:var(--v4-text);border-bottom:1px solid var(--v4-line);padding:25px 28px}.hire-request-head h2{font-size:34px;color:var(--v4-navy)}.hire-request-head p{color:#778692}.hire-request-badge{border:0;border-radius:999px;background:#f1eff8;color:#433960;padding:8px 10px}.hire-request-grid{grid-template-columns:220px minmax(0,1fr);min-height:600px}.hire-step-rail{background:#f6f8fa;border-right:1px solid var(--v4-line);padding:11px}.hire-step-button{min-height:58px;border:0;border-radius:10px;padding:10px 12px;grid-template-columns:26px 1fr;gap:10px}.hire-step-button .n{font-size:12px;width:25px;height:25px;border-radius:7px;background:#e9eef2;display:grid;place-items:center;color:#84919b}.hire-step-button .l{font-size:9px;letter-spacing:.04em}.hire-step-button.active{background:#fff;color:var(--v4-navy);box-shadow:0 5px 16px rgba(34,38,49,.07)}.hire-step-button.active .n{background:var(--v4-orange);color:#fff}.hire-step-button.done .n{background:#e7f5ee;color:#398162}.hire-form-panel{padding:30px 34px}.hire-form-top h3{font-size:25px;color:var(--v4-navy)}.hire-form-top p{font-size:11px}.hire-step-count{border-radius:999px;background:#f3f6f8;border:0}.hire-label{font-size:9px}.hire-input{border:1px solid #dce5eb;border-radius:9px;background:#fff;min-height:44px;padding:10px 12px}.hire-input:focus{border-color:#8c7db3;box-shadow:0 0 0 3px rgba(107,91,149,.11)}.hire-form-panel .hire-dropdown-trigger{min-height:44px;border:1px solid #dce5eb;border-radius:9px;background:#fff;padding:10px 12px}.hire-form-panel .hire-dropdown-trigger:hover{border-color:#cdd8df}.hire-form-panel .hire-dropdown-trigger:focus-visible,.hire-form-panel .hire-dropdown.open .hire-dropdown-trigger{border-color:#8c7db3;box-shadow:0 0 0 3px rgba(107,91,149,.11)}.hire-segment{border:1px solid #dce5eb;border-radius:9px;overflow:hidden;background:#fff}.hire-segment button{border-right:1px solid #e5ebef}.hire-segment button.active{background:var(--v4-navy)}.hire-subsection{border-top:1px solid #edf1f4}.hire-role-editor{border:1px solid #dce5eb;border-radius:11px;overflow:hidden}.hire-role-editor-head{background:#f4f7f9;color:var(--v4-navy)}.hire-role-editor-head button{color:#433960}.hire-count{border:1px solid #dce5eb;border-radius:9px;background:#fff;overflow:hidden}.hire-review{border:1px solid #e1e8ed;border-radius:11px;overflow:hidden}.hire-review-card{border-right:0;border-bottom:1px solid #e7edf1}.hire-review-card:last-child{border-bottom:0}.hire-preview-notice{border-radius:8px}.hire-form-actions .hire-btn.primary{background:var(--v4-orange);border-color:var(--v4-orange)}.hire-form-actions .hire-btn.primary:hover{background:#5c4e84;border-color:#5c4e84}

        .hire-faq{grid-template-columns:.7fr 1.3fr;gap:55px}.hire-faq h2{color:var(--v4-navy);font-size:36px}.hire-faq-list{border-top:1px solid var(--v4-line)}.hire-faq-item{border-bottom:1px solid var(--v4-line);grid-template-columns:.8fr 1.2fr}.hire-faq-item h3{font-size:11px;color:var(--v4-navy)}.hire-faq-item p{font-size:11px;color:#71808d}.hire-final{padding:46px 0;background:var(--v4-navy)}.hire-final h2{font-size:44px}.hire-final .hire-btn.dark{background:var(--v4-orange);border-color:var(--v4-orange)}.hire-footer{background:#222631}.hire-footer-inner{min-height:80px}.hire-footer-contact{font-size:10px}

        @media (max-width:1100px){.hire-v3{padding-left:210px}.hire-sidebar{width:210px}.hire-hero-grid-v4{grid-template-columns:1fr}.hire-route-card{max-width:760px}.hire-value-row{grid-template-columns:repeat(2,1fr)}.hire-value-row>div:nth-child(2){border-right:0}.hire-value-row>div:nth-child(-n+2){border-bottom:1px solid var(--v4-line)}.hire-role-wall{grid-template-columns:repeat(3,1fr)}}
        @media (max-width:820px){
          .hire-v3{padding-left:0}.hire-sidebar{display:none}.hire-topbar{left:0}.hire-topbar-inner-v4{width:calc(100% - 24px);min-height:66px}.hire-mobile-brand{display:block}.hire-top-context{display:none}.hire-route-pill{display:none}.hire-top-actions-v4 .hire-btn{padding-inline:11px}.hire-shell,.hire-v3 .hire-shell,.hire-request-shell{width:calc(100% - 24px)}.hire-hero{padding-top:34px}.hire-hero-grid-v4{gap:28px}.hire-hero-title-v4{font-size:clamp(38px,11vw,58px)}.hire-hero-copy-v4{font-size:13px}.hire-value-row{grid-template-columns:1fr 1fr}.hire-section{padding:58px 0}.hire-section-head{grid-template-columns:1fr;gap:8px}.hire-section-head h2{font-size:34px}.hire-manifesto,.hire-signal-grid{grid-template-columns:1fr}.hire-manifesto article,.hire-manifesto article:first-child,.hire-signal{border-right:1px solid var(--v4-line);border-bottom:1px solid var(--v4-line)}.hire-role-wall{grid-template-columns:repeat(2,1fr)}.hire-request-grid{grid-template-columns:1fr}.hire-step-rail{border-right:0;border-bottom:1px solid var(--v4-line);display:grid;grid-template-columns:repeat(5,minmax(75px,1fr));overflow-x:auto;padding:8px}.hire-step-button{min-width:75px;grid-template-columns:1fr;justify-items:center;text-align:center;gap:5px}.hire-form-panel{padding:24px 18px}.hire-faq{grid-template-columns:1fr;gap:28px}}
        @media (max-width:560px){
          .hire-top-actions-v4 .hire-btn{font-size:0;width:42px;padding:0}.hire-top-actions-v4 .hire-btn svg{width:18px;height:18px}.hire-hero-title-v4{font-size:43px}.hire-hero-actions-v4{display:grid;grid-template-columns:1fr}.hire-hero-actions-v4 .hire-btn{width:100%}.hire-lane-tags{gap:5px}.hire-lane-tags span{font-size:8px}.hire-route-card{padding:13px;border-radius:14px}.hire-route-card-head{display:grid}.hire-route-diagram{height:230px}.hire-source-node{left:13px;width:112px}.hire-market-node{right:12px;width:105px}.hire-route-card-foot{display:grid}.hire-value-row{grid-template-columns:1fr}.hire-value-row>div{border-right:0;border-bottom:1px solid var(--v4-line)}.hire-value-row>div:last-child{border-bottom:0}.hire-role-wall{grid-template-columns:1fr 1fr}.hire-request-head{padding:20px 17px}.hire-request-head h2{font-size:29px}.hire-form-grid{grid-template-columns:1fr}.hire-role-editor-grid{grid-template-columns:1fr}.hire-final h2{font-size:34px}}
      
        /* ===== HIRE V5 · REFINED SIDEBAR / MULTILINGUAL ===== */
        .hire-v3{padding-left:244px;background:#f7f9fb}
        .hire-sidebar{width:244px;padding:0 16px 18px;background:#fff;border-right:1px solid #e5ebf0;box-shadow:8px 0 28px rgba(34,38,49,.025)}
        .hire-side-brand{height:96px;padding:17px 8px 12px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #edf1f4}
        .hire-side-brand>a{width:100%;justify-content:center!important}.hire-side-brand img{margin:0 auto!important}
        .hire-side-context{text-align:center;color:#8996a1;font-size:8px;line-height:1.4;letter-spacing:.13em}
        .hire-side-nav{gap:4px}.hire-side-nav a{min-height:43px;padding:9px 10px;border-radius:9px;font-size:10px}.hire-side-nav a span{width:28px;height:28px;border-radius:7px}.hire-side-nav a.active{background:#222631;color:#fff}.hire-side-nav a.request-link:not(.active){color:#493d68;background:#f6f4fa}.hire-side-nav a.request-link:not(.active) span{background:#eeebf6;color:#5d4f86}.hire-side-nav a.request-link.active{background:#6b5b95;color:#fff}.hire-side-nav a.request-link.active span{background:rgba(255,255,255,.16);color:#fff}
        .hire-side-login{display:flex;align-items:center;gap:10px;min-height:43px;margin:10px 0 8px;padding:9px 10px;border:1px solid #c8c0dd;border-radius:9px;background:#f6f4fa;color:#493d68;text-decoration:none;font-size:10px;font-weight:850;transition:background .15s ease,border-color .15s ease,color .15s ease}.hire-side-login:hover{background:#eeebf6;border-color:#a79bc9;color:#433960}.hire-side-login span{width:28px;height:28px;border-radius:7px;background:#eeebf6;color:#5d4f86;display:grid;place-items:center;flex:0 0 auto}.hire-side-login svg{width:16px;height:16px}
        .hire-side-tools{margin-top:auto;padding:14px 4px 0;border-top:1px solid #edf1f4;display:grid;gap:11px}.hire-side-tool-label{display:block;margin-bottom:5px;color:#9aa5ad;font-size:7.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.hire-language-dropdown .hire-dropdown-trigger{min-height:38px;padding:8px 10px;border:1px solid #dfe7ec;border-radius:9px;background:#fff;color:#222631;font-size:10px;font-weight:850;box-shadow:none}.hire-language-dropdown .hire-dropdown-trigger:hover{border-color:#cad6de}.hire-language-dropdown.open .hire-dropdown-trigger,.hire-language-dropdown .hire-dropdown-trigger:focus-visible{border-color:#8c7db3;box-shadow:0 0 0 3px rgba(107,91,149,.10)}.hire-language-dropdown .hire-dropdown-menu{min-width:176px}.hire-side-email{display:flex;align-items:center;gap:8px;color:#5f7180;text-decoration:none;font-size:9px;font-weight:800}.hire-side-email:hover{color:#6b5b95}.hire-side-email svg{width:17px;height:17px;color:#6b5b95}
        .hire-topbar{left:244px;background:rgba(255,255,255,.94);box-shadow:none}.hire-topbar-inner-v4{min-height:70px}.hire-top-context small{font-size:8px}.hire-top-actions-v4{gap:9px}.hire-top-language{display:none}.hire-top-actions-v4 .hire-btn.primary{min-height:40px;padding:9px 14px;border-radius:9px}
        .hire-mobile-nav{display:none}
        .hire-hero{padding:44px 0 28px;background:linear-gradient(180deg,#fff 0%,#f7f9fb 100%)}.hire-hero-grid-v4{gap:42px}.hire-hero-title-v4{max-width:690px;font-size:clamp(42px,5.3vw,72px);line-height:.96}.hire-hero-copy-v4{max-width:650px}.hire-lane-tags{margin-top:18px}.hire-lane-tags span{background:#fff}.hire-route-card{box-shadow:0 18px 55px rgba(34,38,49,.075)}.hire-value-row{margin-top:24px}.hire-value-row>div{min-height:88px}
        .hire-section{padding:64px 0}.hire-section-head{margin-bottom:26px}.hire-manifesto article,.hire-signal{box-shadow:0 8px 26px rgba(34,38,49,.025)}
        .hire-request-wrap{padding:8px 0 72px}.hire-request-shell{box-shadow:0 22px 60px rgba(34,38,49,.07)}
        .hire-contact-clean{padding:58px 0 24px;background:#fff;border-top:1px solid #e5ebf0}.hire-contact-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:center;padding:28px 30px;border:1px solid #e3eaf0;border-radius:16px;background:#f8fafc}.hire-contact-card .eyebrow{color:#5d4f86;font-size:8px}.hire-contact-card h2{margin:5px 0 8px;color:#222631;font-family:Manrope,Inter,sans-serif;font-size:clamp(26px,3.2vw,40px);letter-spacing:-.04em}.hire-contact-card p{max-width:700px;margin:0;color:#71808d;font-size:12px;line-height:1.65}.hire-contact-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}.hire-email-btn{min-height:44px;padding:10px 14px;border:1px solid #dce5eb;border-radius:9px;background:#fff;color:#222631;text-decoration:none;font-size:10px;font-weight:850;display:inline-flex;align-items:center;gap:8px}.hire-email-btn:hover{border-color:#a598c8;color:#493d68}
        @media (max-width:1100px){.hire-v3{padding-left:212px}.hire-sidebar{width:212px}.hire-topbar{left:212px}.hire-side-brand{height:88px}}
        @media (max-width:820px){
          .hire-v3{padding-left:0}.hire-sidebar{display:none}.hire-topbar{left:0}.hire-top-language{display:block}.hire-top-actions-v4{margin-left:auto}.hire-top-actions-v4 .hire-language-dropdown{width:66px}.hire-top-actions-v4 .hire-language-dropdown .hire-dropdown-trigger{min-height:40px;padding:8px 9px}.hire-mobile-nav{display:flex;position:sticky;top:66px;z-index:260;overflow-x:auto;gap:5px;padding:7px 12px;background:rgba(255,255,255,.96);border-bottom:1px solid #e6edf1;scrollbar-width:none}.hire-mobile-nav::-webkit-scrollbar{display:none}.hire-mobile-nav a{flex:0 0 auto;padding:7px 9px;border-radius:8px;color:#677887;text-decoration:none;font-size:8.5px;font-weight:850;white-space:nowrap}.hire-mobile-nav a.active{background:#222631;color:#fff}.hire-mobile-nav a.request-link{background:#f1eff8;color:#443961}.hire-mobile-nav a.request-link.active{background:#6b5b95;color:#fff}.hire-anchor{scroll-margin-top:116px}.hire-hero{padding-top:30px}.hire-contact-card{grid-template-columns:1fr}.hire-contact-actions{justify-content:flex-start}}
        @media (max-width:560px){.hire-top-actions-v4 .hire-btn.primary{width:42px;font-size:0}.hire-top-actions-v4 .hire-language-dropdown{width:61px}.hire-mobile-nav{top:66px}.hire-hero-title-v4{font-size:40px}.hire-contact-clean{padding-top:42px}.hire-contact-card{padding:21px 18px}.hire-contact-actions{display:grid;grid-template-columns:1fr;width:100%}.hire-contact-actions>*{width:100%}}

        /* ===== HIRE V7 · CATCHY FIRST SCREEN ===== */
        .hire-topbar{display:none!important}
        .hire-mobile-hero-tools{display:none}
        .hire-hero{padding:58px 0 30px;background:linear-gradient(145deg,#fff 0%,#f7fafc 58%,#f5f3fa 100%);position:relative;isolation:isolate}
        .hire-hero:after{content:"";position:absolute;right:-110px;top:-170px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(107,91,149,.11) 0%,rgba(107,91,149,0) 68%);z-index:-1;pointer-events:none}
        .hire-hero-grid-v4{grid-template-columns:minmax(0,1.04fr) minmax(440px,.96fr);gap:58px;align-items:center}
        .hire-hero-main-v4{padding:0}
        .hire-hero-kicker-v4{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e5e9ed;border-radius:999px;background:rgba(255,255,255,.78);color:#6b7985;font-size:8.5px;font-weight:900;letter-spacing:.14em;line-height:1.2}
        .hire-status-dot{background:#6b5b95!important;box-shadow:0 0 0 4px rgba(107,91,149,.10)}
        .hire-hero-title-v4{margin:20px 0 0;max-width:790px;font-size:clamp(50px,5.2vw,76px);line-height:1.035;letter-spacing:-.043em;font-weight:900;text-wrap:balance}
        .hire-hero-title-v4 .hire-hero-line-main,.hire-hero-title-v4 .hire-hero-line-accent{display:block}
        .hire-hero-title-v4 .hire-hero-line-main{color:#222631}
        .hire-hero-title-v4 .hire-hero-line-accent{margin-top:7px;color:#6b5b95}
        .hire-hero-copy-v4{max-width:640px;margin-top:22px;color:#60717f;font-size:14.5px;line-height:1.72}
        .hire-hero-actions-v4{margin-top:27px;gap:9px}.hire-hero-actions-v4 .hire-btn{min-height:48px;padding:11px 16px;border-radius:10px}
        .hire-lane-tags{margin-top:20px}.hire-lane-tags span{background:rgba(255,255,255,.82);border-color:#e4e9ed;color:#687985}
        .hire-route-card{padding:20px;background:#222631;border:1px solid #2e3342;color:#fff;border-radius:19px;box-shadow:0 24px 70px rgba(34,38,49,.20)}
        .hire-route-card-head>div>span{color:#89a1b4}.hire-route-card-head h2{color:#fff;font-size:20px;line-height:1.2}.hire-live{color:#b5c8d5}.hire-live i{background:#6b5b95;box-shadow:0 0 0 4px rgba(107,91,149,.12)}
        .hire-route-diagram{height:292px;background:radial-gradient(circle at 22% 50%,rgba(107,91,149,.18),transparent 28%),linear-gradient(145deg,#242834,#222631);border-color:rgba(255,255,255,.11)}
        .hire-route-diagram:before{background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)}
        .hire-route-diagram svg{inset:14px 10px;width:calc(100% - 20px);height:calc(100% - 28px)}.hire-route-diagram svg path{stroke:#8171ac;stroke-width:1.7;stroke-dasharray:5 6;opacity:.8}
        .hire-source-node{left:22px;top:110px;width:136px;padding:13px 14px;background:#6b5b95;color:#fff;box-shadow:0 14px 30px rgba(0,0,0,.22)}.hire-source-node span,.hire-source-node small{color:rgba(255,255,255,.74)}.hire-source-node b{font-size:16px}
        .hire-market-node{right:22px;width:128px;min-height:43px;border-color:rgba(255,255,255,.12);box-shadow:0 8px 22px rgba(0,0,0,.16)}.hire-market-node b{background:#eaf0f4}.hire-market-node.n1{top:17px}.hire-market-node.n2{top:70px}.hire-market-node.n3{top:123px}.hire-market-node.n4{top:176px}.hire-market-node.n5{top:229px}
        .hire-route-card-foot{color:#afc0cc}.hire-route-card-foot svg{color:#8070ab}
        .hire-value-row{margin-top:28px;background:#fff;border:1px solid #e4eaf0;border-radius:14px;overflow:hidden;box-shadow:0 10px 32px rgba(34,38,49,.045)}
        .hire-value-row>div{min-height:92px;background:#fff}
        .hire-mobile-nav{top:0}
        .hire-anchor{scroll-margin-top:54px}
        @media (max-width:1100px){.hire-hero-grid-v4{grid-template-columns:1fr;gap:36px}.hire-route-card{max-width:780px}.hire-hero-title-v4{max-width:850px}}
        @media (max-width:820px){
          .hire-mobile-hero-tools{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:30px}.hire-mobile-hero-tools>a{flex:0 0 auto}.hire-mobile-hero-tools .hire-language-dropdown{width:68px}.hire-mobile-hero-tools .hire-language-dropdown .hire-dropdown-trigger{min-height:39px;padding:8px 9px;background:#fff}
          .hire-hero{padding:15px 0 28px}.hire-hero:after{width:360px;height:360px;right:-170px;top:-130px}.hire-hero-title-v4{font-size:clamp(42px,10.8vw,60px);line-height:1.06;letter-spacing:-.035em}.hire-hero-title-v4 .hire-hero-line-accent{margin-top:6px}.hire-hero-copy-v4{font-size:13.5px;line-height:1.65}.hire-hero-grid-v4{gap:28px}.hire-route-diagram{height:286px}.hire-mobile-nav{top:0}.hire-anchor{scroll-margin-top:52px}
        }
        @media (max-width:560px){
          .hire-mobile-hero-tools{margin-bottom:25px}.hire-hero-kicker-v4{font-size:7.5px;letter-spacing:.11em}.hire-hero-title-v4{font-size:clamp(38px,11.8vw,48px);line-height:1.075;letter-spacing:-.03em;text-wrap:pretty}.hire-hero-copy-v4{margin-top:18px}.hire-hero-actions-v4{margin-top:22px}.hire-lane-tags{margin-top:16px}.hire-route-card{padding:13px;border-radius:15px}.hire-route-card-head h2{font-size:18px}.hire-route-diagram{height:280px}.hire-source-node{left:12px;top:106px;width:116px}.hire-market-node{right:10px;width:108px}.hire-value-row{border-radius:12px}
        }


        /* ===== HIRE V8 · COMPACT / INTEGRATED ROUTE ===== */
        .hire-side-brand{display:flex!important;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 8px 18px!important;gap:7px}
        .hire-side-brand>a{justify-content:center!important;margin-inline:auto!important}
        .hire-side-brand .hire-side-context{display:block!important;margin:0!important;padding:0!important;width:100%!important;text-align:center!important;color:#8996a1!important;font-size:7.5px!important;font-weight:900!important;line-height:1.25!important;letter-spacing:.13em!important;white-space:nowrap!important}
        .hire-brand-sublabel{display:block;color:#98a4ae;font-size:7.5px;font-weight:950;letter-spacing:.16em;line-height:1;text-transform:uppercase;white-space:nowrap}
        .hire-mobile-brand-lockup{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;min-width:0}.hire-mobile-brand-lockup .hire-brand-sublabel{font-size:6.5px;letter-spacing:.13em}.hire-mobile-context{display:block;color:#8a97a2;font-size:5.8px;font-weight:900;line-height:1.15;letter-spacing:.11em;white-space:nowrap}

        .hire-hero{padding:0!important;min-height:560px;display:flex;align-items:center;background:linear-gradient(115deg,#ffffff 0%,#f8fafc 58%,#eef4f7 100%)!important;overflow:hidden;position:relative}
        .hire-hero:before{content:""!important;display:block!important;position:absolute;inset:0;background:linear-gradient(90deg,rgba(34,38,49,.025) 1px,transparent 1px),linear-gradient(rgba(34,38,49,.025) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,transparent 30%,#000 64%);pointer-events:none}
        .hire-hero:after{content:"";position:absolute;width:620px;height:620px;right:-250px;top:-260px;border:1px solid rgba(107,91,149,.16);border-radius:50%;box-shadow:0 0 0 90px rgba(107,91,149,.025),0 0 0 180px rgba(34,38,49,.018);pointer-events:none;z-index:0}
        .hire-hero-v8{position:relative;min-height:560px;display:flex;align-items:center;z-index:1}
        .hire-hero-main-v8{position:relative;z-index:4;width:min(58%,690px);padding:46px 0}
        .hire-hero-kicker-v4{padding:0!important;border:0!important;background:transparent!important;border-radius:0!important;color:#788792!important;font-size:8px!important;letter-spacing:.15em!important}
        .hire-hero-title-v4{margin:0!important;max-width:680px!important;font-size:clamp(48px,5.4vw,78px)!important;line-height:1.01!important;letter-spacing:-.048em!important;text-wrap:balance}
        .hire-hero-title-v4 .hire-hero-line-accent{margin-top:5px!important}
        .hire-hero-copy-v4{max-width:560px!important;margin-top:17px!important;color:#62727f!important;font-size:13.5px!important;line-height:1.55!important}
        .hire-hero-actions-v4{margin-top:22px!important}.hire-hero-actions-v4 .hire-btn{min-height:45px!important}
        .hire-hero-facts{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:19px;color:#6d7c87;font-size:8.5px;font-weight:850}.hire-hero-facts span{display:inline-flex;align-items:center;gap:5px}.hire-hero-facts svg{color:#6b5b95}
        .hire-route-mobile{display:none}

        .hire-route-background{position:absolute;z-index:2;right:-20px;top:50%;transform:translateY(-50%);width:51%;height:470px;pointer-events:none}
        .hire-route-background:before{content:"";position:absolute;inset:26px 10px 16px 22px;border-radius:50%;background:radial-gradient(circle at 33% 50%,rgba(107,91,149,.10),transparent 28%),radial-gradient(circle at 72% 50%,rgba(34,38,49,.055),transparent 55%)}
        .hire-route-word{position:absolute;right:8px;bottom:-10px;font-family:Manrope,Inter,sans-serif;font-size:76px;font-weight:950;letter-spacing:-.07em;color:rgba(34,38,49,.035)}
        .hire-route-lines-v8{position:absolute;inset:18px 4px 10px 0;width:100%;height:100%;overflow:visible}.hire-route-lines-v8 path{fill:none;stroke:#90a9ba;stroke-width:1.2;stroke-dasharray:5 7;opacity:.72;animation:hire-route-dash 14s linear infinite}
        @keyframes hire-route-dash{to{stroke-dashoffset:-120}}
        .hire-route-source-v8{position:absolute;left:10%;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:10px;padding:7px 12px 7px 7px;border-radius:999px;background:#6b5b95;color:#fff;box-shadow:0 12px 28px rgba(107,91,149,.22)}
        .hire-route-source-v8 span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#463b64;font-size:10px;font-weight:950}.hire-route-source-v8 b{font-size:11px;letter-spacing:.01em}
        .hire-route-target-v8{position:absolute;display:flex;align-items:center;gap:8px;padding:7px 10px 7px 7px;border:1px solid rgba(34,38,49,.10);border-radius:999px;background:rgba(255,255,255,.82);box-shadow:0 8px 20px rgba(34,38,49,.055);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .hire-route-target-v8 b{width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:#222631;color:#fff;font-size:8.5px}.hire-route-target-v8 span{color:#536574;font-size:9px;font-weight:850;white-space:nowrap}
        /* ===== HIRE V9 · ORBIT HERO + SEPARATE REQUEST WORKSPACE ===== */
        .hire-hero{min-height:520px!important;background:linear-gradient(115deg,#fff 0%,#f8fafc 58%,#f0f5f8 100%)!important}
        .hire-hero-v8{min-height:520px!important}
        .hire-hero-main-v8{width:min(57%,675px)!important;padding:40px 0!important}
        .hire-hero-title-v4{max-width:620px!important;font-size:clamp(50px,5vw,72px)!important;line-height:1.03!important;letter-spacing:-.045em!important}
        .hire-hero-title-v4 .hire-hero-line-main,.hire-hero-title-v4 .hire-hero-line-accent{display:block!important}
        .hire-hero-title-v4 .hire-hero-line-accent{margin-top:7px!important}
        .hire-hero-copy-v4{max-width:500px!important;margin-top:16px!important;font-size:13.5px!important;line-height:1.55!important}
        .hire-hero-actions-v4{margin-top:22px!important}.hire-hero-actions-v4 .hire-btn{min-width:170px}
        .hire-hero-facts{display:none!important}

        .hire-route-background{right:-1%!important;width:61%!important;height:410px!important;top:50%!important;transform:translateY(-50%)!important}
        .hire-route-background:before{content:""!important;position:absolute!important;inset:-20px -16px -16px -26px!important;background:radial-gradient(circle at 17% 51%,rgba(107,91,149,.12),transparent 14%),radial-gradient(circle at 48% 17%,rgba(34,38,49,.05),transparent 20%),radial-gradient(circle at 82% 48%,rgba(34,38,49,.045),transparent 18%),radial-gradient(circle at 39% 82%,rgba(34,38,49,.04),transparent 18%)!important;filter:blur(2px)!important}
        .hire-route-background:after{content:""!important;position:absolute!important;inset:0!important;background:radial-gradient(circle at 42% 52%,rgba(255,255,255,.44),transparent 34%)!important}
        .hire-route-word,.hire-route-lines-v8,.hire-route-source-v8,.hire-route-target-v8{display:none!important}
        .hire-route-cloud{position:absolute;inset:0;z-index:3}
        .hire-route-origin{position:absolute;left:0;top:45%;display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;background:rgba(107,91,149,.10);color:#5b4d83;font-size:9px;font-weight:950;letter-spacing:.15em;text-transform:uppercase;box-shadow:0 9px 22px rgba(107,91,149,.10)}
        .hire-route-origin:before{content:"";width:8px;height:8px;border-radius:50%;background:#6b5b95;box-shadow:0 0 0 6px rgba(107,91,149,.09)}
        .hire-route-country{position:absolute;display:block;font-family:Manrope,Inter,sans-serif;font-weight:950;line-height:.9;letter-spacing:-.055em;text-wrap:balance;pointer-events:none;user-select:none}
        .hire-route-country.c1{right:4%;left:auto;top:1%;max-width:68%;text-align:right;font-size:62px;color:rgba(34,38,49,.105)}
        .hire-route-country.c2{left:2%;top:23%;font-size:33px;color:rgba(34,38,49,.34);letter-spacing:-.045em}
        .hire-route-country.c3{left:43%;right:auto;top:43%;font-size:42px;color:rgba(34,38,49,.20)}
        .hire-route-country.c4{left:19%;bottom:8%;font-size:43px;color:rgba(34,38,49,.16);letter-spacing:-.045em}
        .hire-route-country.c5{right:10%;bottom:0;font-size:27px;color:rgba(34,38,49,.31);letter-spacing:-.035em}
        .hire-route-europe{position:absolute;left:4%;bottom:-6%;font-family:Manrope,Inter,sans-serif;font-size:102px;font-weight:950;letter-spacing:-.08em;color:rgba(34,38,49,.022);white-space:nowrap}

        .hire-side-request{width:100%;min-height:46px;margin:10px 0 4px;border:0;border-radius:10px;background:#222631;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;font:inherit;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 7px 18px rgba(34,38,49,.10)}
        .hire-side-request:hover{background:#2e3342}.hire-side-request svg{color:#6b5b95}
        .hire-mobile-request{flex:0 0 auto;border:0;border-radius:8px;background:#222631;color:#fff;padding:7px 10px;font:inherit;font-size:8.5px;font-weight:900;white-space:nowrap;cursor:pointer}

        .hire-sourcing-section{background:#fff!important;border-top:1px solid #edf1f4;border-bottom:1px solid #edf1f4}
        .hire-sourcing-head{display:block!important;max-width:760px!important;align-items:start!important}.hire-sourcing-head>div{width:100%!important}.hire-sourcing-head h2{max-width:760px!important;text-wrap:balance!important}.hire-sourcing-head p{max-width:620px!important}
        .hire-sourcing-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:26px}
        .hire-sourcing-card{position:relative;min-height:238px;padding:22px;border:1px solid #dfe7ec;border-radius:16px;background:#f8fafb;overflow:hidden}
        .hire-sourcing-card.network{background:#222631;border-color:#222631;color:#fff}
        .hire-sourcing-label{display:block;max-width:75%;color:#7c8b96;font-size:8px;font-weight:950;letter-spacing:.14em;line-height:1.35}
        .hire-sourcing-card.network .hire-sourcing-label{color:#90a8ba}
        .hire-sourcing-num{position:absolute;right:18px;top:15px;font:950 38px/1 Manrope,Inter,sans-serif;letter-spacing:-.06em;color:rgba(34,38,49,.07)}
        .hire-sourcing-card.network .hire-sourcing-num{color:rgba(255,255,255,.08)}
        .hire-sourcing-card h3{margin:48px 0 9px;font:900 20px/1.15 Manrope,Inter,sans-serif;letter-spacing:-.025em;color:#222631}
        .hire-sourcing-card.network h3{color:#fff}
        .hire-sourcing-card p{margin:0;color:#667785;font-size:11px;line-height:1.58}
        .hire-sourcing-card.network p{color:#c5d1da}
        .hire-network-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:10px;border:1px solid #dfe7ec;border-radius:14px;background:#fff;overflow:hidden}
        .hire-network-strip span{min-height:58px;display:flex;align-items:center;gap:10px;padding:10px 14px;border-left:1px solid #e8edf1;color:#506271;font-size:9px;font-weight:850}
        .hire-network-strip span:first-child{border-left:0}
        .hire-network-strip i{width:28px;height:28px;display:grid;place-items:center;flex:0 0 28px;border-radius:9px;background:#f1eff8;color:#584a7d;font-style:normal;font-size:8px;font-weight:950}

        .hire-request-overlay{position:fixed!important;inset:0!important;z-index:20000!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;background:#f4f7f9!important;padding:0 0 60px!important}
        .hire-request-window-head{position:sticky;top:0;z-index:40;min-height:78px;background:rgba(255,255,255,.95);border-bottom:1px solid #e2e9ee;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .hire-request-window-head-inner{position:relative;width:min(1280px,calc(100% - 48px));min-height:78px;margin:auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px}
        .hire-request-window-brand{display:flex;align-items:center;justify-content:center;min-width:0}.hire-request-window-brand img{height:40px;width:auto;display:block}
        .hire-request-window-title{display:none}
        .hire-request-window-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px}.hire-request-window-actions .hire-language-dropdown{width:76px!important}.hire-request-window-actions .hire-language-dropdown .hire-dropdown-trigger{height:46px;min-height:46px;padding:0 11px;border-radius:12px}.hire-request-back{height:46px;min-height:46px;padding:0 14px;border:1px solid #dfe7ec;border-radius:12px;background:#fff;color:#222631;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-size:11px;font-weight:900;letter-spacing:.01em}.hire-request-back:hover{background:#f6f8fa;border-color:#cfdbe3}.hire-request-back svg{width:12px;height:12px}
        .hire-request-overlay .hire-request-shell{margin:20px auto 0!important;padding-top:0!important}.hire-request-overlay .hire-request-head{border-radius:16px 16px 0 0!important}.hire-request-overlay .hire-request-grid{border-radius:0 0 16px 16px!important;overflow:visible!important;box-shadow:0 16px 45px rgba(34,38,49,.07)}

        .hire-initial-request-grid{grid-template-columns:1fr!important;min-height:0!important;background:#fff}
        .hire-initial-panel{padding:0!important}
        .hire-initial-request-head{align-items:center!important}.hire-initial-request-head>div:first-child{max-width:760px}
        .hire-initial-request-layout{display:grid;grid-template-columns:minmax(0,1fr) 305px;align-items:stretch;min-height:620px}
        .hire-initial-form{padding:29px 32px 34px;display:grid;gap:30px;min-width:0}
        .hire-initial-section{display:grid;gap:18px}.hire-initial-section+.hire-initial-section{padding-top:26px;border-top:1px solid #e8edf1}
        .hire-initial-section-title{display:flex;align-items:flex-start;gap:12px}.hire-initial-section-title>span{width:30px;height:30px;flex:0 0 30px;border-radius:9px;background:#f0edf7;color:#524575;display:grid;place-items:center;font-size:8px;font-weight:950}
        .hire-initial-section-title h3{margin:3px 0 0;color:#222631;font:900 19px/1.15 Manrope,Inter,sans-serif;letter-spacing:-.025em}
        .hire-initial-roles{display:grid;gap:10px}.hire-initial-role{border:1px solid #dfe7ec;border-radius:12px;background:#f9fbfc;overflow:hidden}
        .hire-initial-role-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border-bottom:1px solid #e4ebef}.hire-initial-role-head b{color:#516473;font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.hire-initial-role-head button{border:0;background:transparent;color:#453a63;font-size:9px;font-weight:900;cursor:pointer}
        .hire-initial-role-grid{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:12px;padding:13px}.hire-initial-role-grid .hire-field{gap:5px}.hire-initial-role-grid .hire-input,.hire-initial-role-grid .hire-count{height:44px;min-height:44px}
        .hire-initial-add-role{margin-top:1px}.hire-initial-add-role button{display:inline-flex;align-items:center;min-height:36px;padding:8px 11px;border:1px solid #e1e8ed!important;border-radius:9px!important;background:#fff!important;color:#493d68!important}
        .hire-initial-notes{margin-top:2px}.hire-initial-notes textarea{min-height:104px;resize:vertical}
        .hire-initial-panel .hire-checkbox-row{margin-top:2px;padding:14px 0 0;border-top:1px solid #edf1f4}.hire-initial-panel .hire-checkbox-row input{-webkit-appearance:none;appearance:none;width:18px;height:18px;flex:0 0 18px;margin:1px 0 0;border:1px solid #cad6de;border-radius:5px;background:#fff;display:grid;place-items:center;cursor:pointer}.hire-initial-panel .hire-checkbox-row input:checked{border-color:#6b5b95;background:#6b5b95}.hire-initial-panel .hire-checkbox-row input:checked:after{content:"✓";color:#fff;font-size:11px;font-weight:950;line-height:1}
        .hire-consent-error{margin-top:-9px}.hire-initial-submit-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding-top:4px}.hire-initial-submit-note{max-width:390px;color:#7b8994;font-size:9px;line-height:1.5}.hire-initial-submit-row .hire-btn{min-height:46px;border-radius:10px;white-space:nowrap}
        .hire-initial-next{padding:31px 25px;background:#222631;color:#fff;border-left:1px solid #313747}.hire-initial-next-label{display:block;color:#8778b0;font-size:7px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}.hire-initial-next h3{margin:8px 0 22px;color:#fff;font:900 24px/1.06 Manrope,Inter,sans-serif;letter-spacing:-.035em}
        .hire-initial-next-steps{display:grid}.hire-initial-next-steps>div{display:grid;grid-template-columns:31px minmax(0,1fr);gap:10px;padding:14px 0;border-top:1px solid rgba(255,255,255,.11)}.hire-initial-next-steps>div:first-child{border-top:0;padding-top:0}.hire-initial-next-steps span{width:25px;height:25px;border-radius:8px;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#8576ae;font-size:7px;font-weight:950}.hire-initial-next-steps p{margin:2px 0 0;color:#c2cfda;font-size:10px;line-height:1.5}
        .hire-initial-next-note{display:flex;align-items:flex-start;gap:8px;margin-top:22px;padding:13px;border:1px solid rgba(107,91,149,.28);border-radius:11px;background:rgba(107,91,149,.08);color:#b5abd2;font-size:9px;line-height:1.45}.hire-initial-next-note svg{flex:0 0 auto;margin-top:1px;color:#6b5b95}.hire-initial-contact-note{margin-top:12px;padding:13px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(255,255,255,.045)}.hire-initial-contact-note b{display:block;color:#fff;font-size:9px}.hire-initial-contact-note p{margin:5px 0 0;color:#b8c7d2;font-size:9px;line-height:1.5}
        .hire-initial-success{min-height:560px;display:grid;place-items:center;padding:40px}.hire-initial-success>div{max-width:610px;text-align:center}
        @media (max-width:980px){.hire-initial-request-layout{grid-template-columns:minmax(0,1fr) 270px}.hire-initial-form{padding:25px 24px 30px}.hire-initial-next{padding:27px 20px}}
        @media (max-width:820px){.hire-initial-request-layout{grid-template-columns:1fr!important;min-height:0}.hire-initial-next{border-left:0;border-top:1px solid #313747;padding:22px 18px}.hire-initial-next h3{font-size:21px;margin-bottom:16px}.hire-initial-next-steps{grid-template-columns:1fr 1fr;gap:0 18px}.hire-initial-next-steps>div:nth-child(2){border-top:0;padding-top:0}.hire-initial-form{padding:20px 18px 24px}}
        @media (max-width:560px){.hire-initial-form{padding:17px 14px 20px;gap:23px}.hire-initial-section{gap:14px}.hire-initial-section+.hire-initial-section{padding-top:21px}.hire-initial-role-grid{grid-template-columns:1fr;padding:11px}.hire-initial-submit-row{display:grid;grid-template-columns:1fr}.hire-initial-submit-row .hire-btn{width:100%}.hire-initial-next-steps{grid-template-columns:1fr}.hire-initial-next-steps>div:nth-child(2){border-top:1px solid rgba(255,255,255,.11);padding-top:14px}.hire-initial-success{min-height:420px;padding:28px 18px}}

        .hire-section{padding:52px 0!important}.hire-section-head{margin-bottom:20px!important}.hire-section-head h2{font-size:clamp(28px,3.4vw,43px)!important;line-height:1.05!important}.hire-section-head p{margin-top:8px!important;max-width:600px!important;font-size:12px!important;line-height:1.5!important}
        .hire-manifesto article{padding:17px!important}.hire-manifesto h3{margin:11px 0 5px!important;font-size:16px!important}.hire-manifesto p{font-size:10.5px!important;line-height:1.48!important}
        .hire-role-wall{gap:7px!important}.hire-role-wall span{min-height:54px!important;padding:10px 12px!important;font-size:9.5px!important}
        .hire-signal{min-height:154px!important;padding:17px!important}.hire-signal-symbol{font-size:34px!important}.hire-signal h3{font-size:15px!important}.hire-signal p{font-size:10.5px!important;line-height:1.45!important}
        .hire-request-wrap{padding-bottom:52px!important}.hire-request-head{padding:20px 22px!important}.hire-request-head h2{font-size:30px!important}.hire-request-head p{margin-top:5px!important}
        .hire-faq{gap:30px!important}.hire-faq-list{display:grid!important;gap:7px!important}.hire-faq-item{border:1px solid #e5ebf0!important;border-radius:10px!important;background:#fff!important;padding:0!important;overflow:hidden}.hire-faq-item summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 14px;color:#222631;font-size:11px;font-weight:850}.hire-faq-item summary::-webkit-details-marker{display:none}.hire-faq-item summary b{font-size:18px;font-weight:500;color:#6b5b95;transition:transform .15s ease}.hire-faq-item[open] summary b{transform:rotate(45deg)}.hire-faq-item p{margin:0!important;padding:0 14px 14px!important;color:#71808d!important;font-size:10.5px!important;line-height:1.55!important}.hire-contact-clean{padding:38px 0 18px!important}.hire-contact-card{padding:20px 22px!important}

        @media (max-width:1100px){
          .hire-hero-main-v8{width:56%!important}.hire-route-background{right:-5%!important;width:61%!important;transform:translateY(-50%) scale(.94)!important;transform-origin:center!important}
        }
        @media (max-width:820px){
          .hire-mobile-hero-tools{display:flex!important;align-items:flex-start!important;margin-bottom:0!important;padding-top:14px;padding-bottom:0}.hire-mobile-hero-tools .hire-language-dropdown{width:66px}
          .hire-hero{min-height:0!important;display:block!important;padding:0 0 22px!important}.hire-hero-v8{min-height:0!important;display:block!important}.hire-hero-main-v8{width:100%!important;padding:24px 0 8px!important}.hire-route-background{display:none}.hire-route-mobile{display:flex;flex-wrap:wrap;align-items:center;gap:7px;max-width:310px;margin:16px 0 0;padding:0;border:0;background:none;color:#222631}.hire-route-mobile:before{display:none}.hire-route-mobile b{position:static;display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:38px;padding:0 12px;border-radius:999px;background:#6b5b95;color:#fff;font-size:9px;box-shadow:0 8px 18px rgba(107,91,149,.22)}.hire-route-mobile i{position:static;display:inline-flex;align-items:center;justify-content:center;width:auto;height:auto;padding:7px 10px;border:1px solid #dfe7ec;border-radius:999px;background:#fff;color:#222631;font-style:normal;font-size:8px;font-weight:900;box-shadow:0 5px 14px rgba(34,38,49,.06)}.hire-route-mobile .m1,.hire-route-mobile .m2,.hire-route-mobile .m3,.hire-route-mobile .m4,.hire-route-mobile .m5{transform:none}
          .hire-hero-title-v4{max-width:620px!important;font-size:clamp(38px,10.7vw,54px)!important;line-height:1.04!important}.hire-hero-copy-v4{max-width:560px!important;font-size:12.5px!important;line-height:1.5!important;margin-top:14px!important}.hire-hero-actions-v4{margin-top:18px!important}.hire-hero-facts{margin-top:14px!important;gap:10px!important;font-size:8px!important}
          .hire-section{padding:36px 0!important}.hire-section-head{grid-template-columns:1fr!important;gap:4px!important;margin-bottom:14px!important}.hire-section-head h2{font-size:29px!important}.hire-section-head p{font-size:11px!important;margin-top:5px!important}.hire-index{padding-top:0!important;font-size:7px!important}
          .hire-manifesto{grid-template-columns:1fr!important;gap:7px!important;border:0!important}.hire-manifesto article,.hire-manifesto article:first-child{border:1px solid #e5ebf0!important;border-radius:10px!important;padding:13px 14px!important}.hire-manifesto .num{font-size:8px!important}.hire-manifesto h3{margin:7px 0 3px!important;font-size:14px!important}.hire-manifesto p{font-size:9.5px!important;line-height:1.42!important}
          .hire-role-wall{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}.hire-role-wall span{min-height:43px!important;padding:8px 10px!important;font-size:8.5px!important}.hire-role-wall span:before{right:9px!important}
          .hire-signal-grid{grid-template-columns:1fr!important;gap:7px!important;border:0!important}.hire-signal{min-height:0!important;display:grid!important;grid-template-columns:46px minmax(0,1fr)!important;grid-template-rows:auto auto!important;column-gap:11px!important;align-items:center!important;padding:12px 14px!important;border:1px solid #e5ebf0!important;border-radius:10px!important}.hire-signal-label{grid-column:2!important;font-size:7px!important}.hire-signal-symbol{grid-column:1!important;grid-row:1/3!important;font-size:28px!important;align-self:center!important}.hire-signal>div{grid-column:2!important}.hire-signal h3{font-size:13px!important;margin:0!important}.hire-signal p{font-size:9.5px!important;margin-top:3px!important;line-height:1.35!important}
          .hire-sourcing-head{grid-template-columns:1fr!important}.hire-sourcing-grid{grid-template-columns:1fr!important;gap:7px!important;margin-top:14px!important}.hire-sourcing-card{min-height:0!important;padding:15px 16px!important;border-radius:12px!important}.hire-sourcing-card h3{margin:28px 0 6px!important;font-size:16px!important}.hire-sourcing-card p{font-size:9.5px!important;line-height:1.48!important}.hire-sourcing-label{font-size:7px!important}.hire-sourcing-num{font-size:28px!important;right:14px!important;top:12px!important}.hire-network-strip{grid-template-columns:1fr 1fr!important;margin-top:7px!important;border-radius:12px!important}.hire-network-strip span{min-height:48px!important;padding:8px 10px!important;font-size:8px!important;border-left:0!important;border-top:1px solid #e8edf1!important}.hire-network-strip span:nth-child(-n+2){border-top:0!important}.hire-network-strip span:nth-child(even){border-left:1px solid #e8edf1!important}.hire-network-strip i{width:24px!important;height:24px!important;flex-basis:24px!important;font-size:7px!important}
          .hire-request-wrap{padding:0 0 38px!important}.hire-request-head{padding:17px!important}.hire-request-head h2{font-size:27px!important}.hire-request-head p{font-size:10.5px!important}.hire-request-window-head-inner{width:calc(100% - 24px)!important;min-height:64px!important;grid-template-columns:1fr auto 1fr!important;gap:10px!important}.hire-request-window-brand img{height:34px!important}.hire-request-window-actions{gap:6px!important}.hire-request-window-actions .hire-language-dropdown{width:62px!important}.hire-request-window-actions .hire-language-dropdown .hire-dropdown-trigger{height:42px!important;min-height:42px!important;padding:0 9px!important;border-radius:11px!important}.hire-request-back{height:42px!important;min-height:42px!important;padding:0 11px!important;border-radius:11px!important;font-size:10px!important}.hire-request-overlay .hire-request-shell{margin:16px auto 0!important;padding-top:0!important}.hire-faq{grid-template-columns:1fr!important;gap:14px!important}.hire-faq>div:first-child h2{font-size:28px!important}.hire-contact-clean{padding:28px 0 14px!important}.hire-contact-card{padding:17px!important}.hire-mobile-nav{padding-block:6px!important}
        }
        @media (max-width:560px){
          .hire-mobile-hero-tools{padding-top:11px}.hire-mobile-brand-lockup .hire-brand-sublabel{font-size:6px}.hire-mobile-context{font-size:5.4px}.hire-hero-main-v8{padding-top:19px!important}.hire-hero-kicker-v4{font-size:7px!important}.hire-hero-title-v4{font-size:clamp(35px,10.9vw,45px)!important;letter-spacing:-.035em!important}.hire-hero-copy-v4{font-size:11.5px!important}.hire-hero-actions-v4{display:block!important}.hire-hero-actions-v4 .hire-btn{width:100%!important;min-height:42px!important;padding:9px 8px!important;font-size:9.5px!important}.hire-hero-facts{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:5px!important}.hire-hero-facts span{justify-content:center;padding:7px 5px;border-top:1px solid #e8edf1;font-size:7px!important;text-align:center}.hire-route-mobile{width:auto!important;max-width:100%!important;justify-content:flex-start!important;margin-top:12px!important;padding:0!important}.hire-route-mobile b{min-width:36px!important;height:36px!important}.hire-section{padding:30px 0!important}.hire-section-head h2{font-size:26px!important}.hire-section-head p{display:none!important}.hire-signal p{display:none!important}.hire-signal{grid-template-rows:auto!important}.hire-signal-symbol{grid-row:1!important}.hire-signal>div{align-self:center}.hire-role-wall span{min-height:40px!important;font-size:8px!important}.hire-faq-item summary{padding:11px 12px!important;font-size:10px!important}.hire-faq-item p{padding:0 12px 12px!important;font-size:9.5px!important}
        }

`}</style>

      <aside className="hire-sidebar" aria-label="Hire navigation">
        <div className="hire-side-brand"><BrandLogo href="#hire-top" height={42} /><span className="hire-side-context">{t.sidebarLabel}</span></div>
        <a className="hire-side-login" href="/hire/login"><span><HireSideIcon type="login" /></span>{t.login || "Login"}</a>
        <nav className="hire-side-nav">
          {navItems.map(([id, label, icon]) => <a key={id} className={activeSection === id ? "active" : ""} href={`#${id}`} onClick={() => setActiveSection(id)}><span><HireSideIcon type={icon} /></span>{label}</a>)}
        </nav>
        <div className="hire-side-tools">
          <div><span className="hire-side-tool-label">{t.language}</span>{languageSelect(false)}</div>
          <div><span className="hire-side-tool-label">{t.email}</span><a className="hire-side-email" href="mailto:info@statybos24.lt"><HireSideIcon type="contact" /> info@statybos24.lt</a></div>
        </div>
      </aside>

      <main>
        <section className="hire-hero hire-anchor" id="hire-overview">
          <div className="hire-shell hire-mobile-hero-tools"><div className="hire-mobile-brand-lockup"><BrandLogo href="#hire-top" height={31} /><span className="hire-mobile-context">{t.sidebarLabel}</span></div>{languageSelect(true)}</div>
          <div className="hire-shell hire-hero-v8">
            <div className="hire-hero-main-v8">
              <h1 className="hire-hero-title-v4"><span className="hire-hero-line-main">{c.hero.title}</span><span className="hire-hero-line-accent">{c.hero.accent}</span></h1>
              <p className="hire-hero-copy-v4">{c.hero.copy}</p>
              <div className="hire-hero-actions-v4"><button type="button" className="hire-btn primary" onClick={openRequest}>{t.hero.cta} <HireArrowIcon /></button></div>
              <div className="hire-route-mobile" aria-label="Target markets"><b>LT</b>{["Germany","Netherlands","Norway","Sweden","Denmark"].map((country,index)=><i key={country} className={`m${index+1}`}>{optionLabel(country)}</i>)}</div>
            </div>
            <div className="hire-route-background" aria-hidden="true">
              <div className="hire-route-cloud">
                <span className="hire-route-origin">{optionLabel("Lithuania")}</span>
                <span className="hire-route-country c1">{optionLabel("Germany")}</span>
                <span className="hire-route-country c2">{optionLabel("Netherlands")}</span>
                <span className="hire-route-country c3">{optionLabel("Norway")}</span>
                <span className="hire-route-country c4">{optionLabel("Sweden")}</span>
                <span className="hire-route-country c5">{optionLabel("Denmark")}</span>
                <span className="hire-route-europe">EUROPE</span>
              </div>
            </div>
          </div>
        </section>

        <nav className="hire-mobile-nav" aria-label="Hire sections">{navItems.map(([id,label]) => <a key={id} className={activeSection === id ? "active" : ""} href={`#${id}`} onClick={() => setActiveSection(id)}>{label}</a>)}</nav>

        <section className="hire-section white hire-anchor" id="hire-method"><div className="hire-shell"><div className="hire-section-head"><div><h2>{c.process.title}</h2><p>{c.process.intro}</p></div></div><div className="hire-manifesto">{t.process.steps.map(([title,body],index)=><article key={title}><span className="num">0{index+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

        <section className="hire-section hire-sourcing-section hire-anchor" id="hire-trades">
          <div className="hire-shell">
            <div className="hire-section-head hire-sourcing-head"><div><h2>{c.trades.title}</h2><p>{c.trades.intro}</p></div></div>
            <div className="hire-sourcing-grid">
              {t.trades.cards.map(([label,title,body],index)=><article className={`hire-sourcing-card ${index===2?"network":""}`} key={label}><span className="hire-sourcing-label">{label}</span><span className="hire-sourcing-num">0{index+1}</span><h3>{title}</h3><p>{body}</p></article>)}
            </div>
            <div className="hire-network-strip">{t.trades.strip.map((item,index)=><span key={item}><i aria-hidden="true">{index===0?"LT":index===1?"24":index===2?"★":"→"}</i>{item}</span>)}</div>
          </div>
        </section>

        {requestOpen && <section className="hire-request-wrap hire-request-overlay" id="hire-request" role="dialog" aria-modal="true" aria-label={ir.title}>
          <div className="hire-request-window-head"><div className="hire-request-window-head-inner">
            <div />
            <div className="hire-request-window-brand"><BrandImage height={34}/></div>
            <div className="hire-request-window-actions">{languageSelect(true)}<button type="button" className="hire-request-back" aria-label={t.form.common.back || "Back"} onClick={closeRequest}><span aria-hidden="true">←</span>{t.form.common.back || "Back"}</button></div>
          </div></div>
          <div className="hire-request-shell">
            <div className="hire-request-head hire-initial-request-head">
              <div><h2>{ir.title}</h2><p>{ir.intro}</p></div>
            </div>
            <div className="hire-request-grid hire-initial-request-grid">
              <div className="hire-form-panel hire-initial-panel">
                {submitted ? <div className="hire-success hire-initial-success"><div><div className="hire-success-mark"><HireCheckIcon size={28}/></div><h3>{ir.successTitle}</h3><p>{ir.successText}</p><button type="button" className="hire-btn dark" onClick={resetInitialRequest}>{ir.reset}</button></div></div> :
                  <div className="hire-initial-request-layout">
                    <div className="hire-initial-form">
                      <div className="hire-initial-section">
                        <div className="hire-initial-section-title"><span>01</span><div><h3>{ir.companySection}</h3></div></div>
                        <div className="hire-form-grid">
                          <HireInput label={ir.companyName} required value={form.companyName} onChange={e=>setField('companyName',e.target.value)} error={errors.companyName}/>
                          <HireSelect label={ir.companyCountry} required value={form.companyCountry} onChange={v=>setField('companyCountry',v)} options={options(countryValues)} placeholder={t.form.common.select} error={errors.companyCountry}/>
                          <HireInput label={ir.contactName} required value={form.contactName} onChange={e=>setField('contactName',e.target.value)} error={errors.contactName}/>
                          <HireInput label={ir.jobTitle} required value={form.jobTitle} onChange={e=>setField('jobTitle',e.target.value)} error={errors.jobTitle}/>
                          <HireInput label={ir.email} required hint={ir.emailHint} type="email" value={form.email} onChange={e=>setField('email',e.target.value)} error={errors.email}/>
                          <HireInput label={ir.phone} value={form.phone} onChange={e=>setField('phone',e.target.value)}/>
                        </div>
                        <label className={`hire-checkbox-row${errors.consent?' invalid':''}`}><input type="checkbox" checked={form.consent} onChange={e=>setField('consent',e.target.checked)}/><span>{ir.consent}</span></label>
                        {errors.consent?<span className="hire-error hire-consent-error">{errors.consent}</span>:null}
                        {submitError?<div className="hire-request-submit-error">{submitError}</div>:null}
                        <div className="hire-initial-submit-row">
                          <div className="hire-initial-submit-note">{ir.important}</div>
                          <button type="button" className="hire-btn primary" onClick={submitInitialRequest} disabled={submitting}>{submitting ? <AppBootLoader compact label={({en:"Sending...",lt:"Siunčiama...",de:"Wird gesendet...",nl:"Verzenden...",no:"Sender...",sv:"Skickar...",da:"Sender..."}[lang] || "Sending...")} /> : ir.submit} {!submitting && <HireArrowIcon/>}</button>
                        </div>
                      </div>
                    </div>

                    <aside className="hire-initial-next">
                      <span className="hire-initial-next-label">STATYBOS24</span>
                      <h3>{ir.nextTitle}</h3>
                      <div className="hire-initial-next-steps">
                        {ir.nextSteps.map((item,index)=><div key={item}><span>{String(index+1).padStart(2,'0')}</span><p>{item}</p></div>)}
                      </div>
                      <div className="hire-initial-next-note"><HireCheckIcon size={16}/><span>{ir.important}</span></div>
                      <div className="hire-initial-contact-note"><b>{ir.questionsTitle}</b><p>{ir.questionsText}</p></div>
                    </aside>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>}

        <section className="hire-contact-clean" id="hire-contact"><div className="hire-shell"><div className="hire-contact-card"><div><div className="eyebrow">{t.contact.eyebrow}</div><h2>{c.contact.title}</h2><p>{c.contact.copy}</p></div><div className="hire-contact-actions"><a className="hire-email-btn" href="mailto:info@statybos24.lt"><HireSideIcon type="contact"/> info@statybos24.lt</a><button type="button" className="hire-btn primary" onClick={openRequest}>{t.contact.cta} <HireArrowIcon/></button></div></div></div></section>
      </main>
    </div>
  );
}
