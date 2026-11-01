import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { BrandLogo } from "../ui/brand.jsx";
import { HIRE_COPY, HIRE_LANGUAGES } from "./hireShared.jsx";
import "../p24/p24.css";
import "../p24/hire.css";

export const FOREIGN_HIRE_PORTAL_SESSION_KEY = "s24_foreign_hire_portal_session";

export function getForeignHirePortalToken() {
  try { return localStorage.getItem(FOREIGN_HIRE_PORTAL_SESSION_KEY) || ""; } catch { return ""; }
}

export function setForeignHirePortalToken(token) {
  try {
    if (token) localStorage.setItem(FOREIGN_HIRE_PORTAL_SESSION_KEY, token);
    else localStorage.removeItem(FOREIGN_HIRE_PORTAL_SESSION_KEY);
  } catch {}
}


export const HIRE_PORTAL_LOGIN_COPY = {
  en:{metaTitle:"Employer portal login | Statybos24",eyebrow:"FOR INTERNATIONAL EMPLOYERS",heroTitle:"Your private recruitment workspace.",heroCopy:"Review your agreement, complete the workforce brief and follow the candidates introduced by Statybos24.",heroFoot:"Direct construction recruitment from Lithuania.",portal:"EMPLOYER PORTAL",signIn:"Sign in",intro:"Use the private access details sent to you by Statybos24.",companyId:"LOGIN",companyPlaceholder:"e.g. ID-123456",password:"PASSWORD",passwordPlaceholder:"Your password",missing:"Enter your login details.",accessDenied:"Incorrect login details.",sessionError:"Could not create a portal session.",signInError:"Incorrect login details.",busy:"Signing in...",submit:"Sign in to employer portal",help:"Questions about your access or agreement? Reply to the Statybos24 email from which you received your login details, or contact"},
  lt:{metaTitle:"Darbdavio portalo prisijungimas | Statybos24",eyebrow:"TARPTAUTINIAMS DARBDAVIAMS",heroTitle:"Jūsų privati darbuotojų atrankos erdvė.",heroCopy:"Peržiūrėkite sutartį, užpildykite pilną darbuotojų poreikį ir stebėkite Statybos24 pristatomus kandidatus.",heroFoot:"Tiesioginė statybų darbuotojų atranka iš Lietuvos.",portal:"DARBDAVIO PORTALAS",signIn:"Prisijungti",intro:"Naudokite privačius prisijungimo duomenis, kuriuos jums atsiuntė Statybos24.",companyId:"PRISIJUNGIMO ID",companyPlaceholder:"Įveskite prisijungimo ID",password:"SLAPTAŽODIS",passwordPlaceholder:"Jūsų slaptažodis",missing:"Įveskite prisijungimo duomenis.",accessDenied:"Neteisingi prisijungimo duomenys.",sessionError:"Nepavyko sukurti portalo sesijos.",signInError:"Neteisingi prisijungimo duomenys.",busy:"Jungiamasi...",submit:"Prisijungti prie darbdavio portalo",help:"Klausimų dėl prisijungimo ar sutarties? Atsakykite į Statybos24 el. laišką, iš kurio gavote prisijungimo duomenis, arba rašykite"},
  de:{metaTitle:"Arbeitgeberportal Login | Statybos24",eyebrow:"FÜR INTERNATIONALE ARBEITGEBER",heroTitle:"Ihr privater Recruiting-Arbeitsbereich.",heroCopy:"Prüfen Sie Ihre Vereinbarung, vervollständigen Sie den Personalbedarf und verfolgen Sie die von Statybos24 vorgestellten Kandidaten.",heroFoot:"Direkte Baurekrutierung aus Litauen.",portal:"ARBEITGEBERPORTAL",signIn:"Anmelden",intro:"Verwenden Sie die privaten Zugangsdaten, die Ihnen Statybos24 zugesandt hat.",companyId:"ANMELDUNG",companyPlaceholder:"z. B. ID-123456",password:"PASSWORT",passwordPlaceholder:"Ihr Passwort",missing:"Geben Sie Ihre Unternehmens-ID und Ihr Passwort ein.",accessDenied:"Anmeldedaten sind ungültig.",sessionError:"Die Portalsitzung konnte nicht erstellt werden.",signInError:"Unternehmens-ID oder Passwort ist falsch.",busy:"Anmeldung...",submit:"Zum Arbeitgeberportal anmelden",help:"Fragen zu Ihrem Zugang oder Vertrag? Antworten Sie auf die Statybos24-E-Mail mit Ihren Zugangsdaten oder kontaktieren Sie"},
  nl:{metaTitle:"Werkgeversportaal login | Statybos24",eyebrow:"VOOR INTERNATIONALE WERKGEVERS",heroTitle:"Uw private recruitmentomgeving.",heroCopy:"Bekijk uw overeenkomst, vul de personeelsbehoefte volledig in en volg de kandidaten die Statybos24 voorstelt.",heroFoot:"Directe bouwrecruitment vanuit Litouwen.",portal:"WERKGEVERSPORTAAL",signIn:"Inloggen",intro:"Gebruik de privé-inloggegevens die Statybos24 u heeft gestuurd.",companyId:"INLOGGEGEVENS",companyPlaceholder:"bijv. ID-123456",password:"WACHTWOORD",passwordPlaceholder:"Uw wachtwoord",missing:"Vul uw bedrijfs-ID en wachtwoord in.",accessDenied:"Onjuiste inloggegevens.",sessionError:"De portalsessie kon niet worden aangemaakt.",signInError:"Bedrijfs-ID of wachtwoord is onjuist.",busy:"Inloggen...",submit:"Inloggen op werkgeversportaal",help:"Vragen over uw toegang of overeenkomst? Beantwoord de Statybos24-e-mail met uw inloggegevens of neem contact op via"},
  no:{metaTitle:"Arbeidsgiverportal innlogging | Statybos24",eyebrow:"FOR INTERNASJONALE ARBEIDSGIVERE",heroTitle:"Deres private rekrutteringsområde.",heroCopy:"Les avtalen, fyll ut hele bemanningsbehovet og følg kandidatene som Statybos24 presenterer.",heroFoot:"Direkte rekruttering til bygg fra Litauen.",portal:"ARBEIDSGIVERPORTAL",signIn:"Logg inn",intro:"Bruk de private innloggingsopplysningene dere har mottatt fra Statybos24.",companyId:"INNLOGGING",companyPlaceholder:"f.eks. ID-123456",password:"PASSORD",passwordPlaceholder:"Passordet deres",missing:"Skriv inn bedrifts-ID og passord.",accessDenied:"Ugyldige innloggingsopplysninger.",sessionError:"Kunne ikke opprette portalsesjon.",signInError:"Bedrifts-ID eller passord er feil.",busy:"Logger inn...",submit:"Logg inn på arbeidsgiverportalen",help:"Spørsmål om tilgang eller avtale? Svar på Statybos24-e-posten der dere mottok innloggingsopplysningene, eller kontakt"},
  sv:{metaTitle:"Arbetsgivarportal inloggning | Statybos24",eyebrow:"FÖR INTERNATIONELLA ARBETSGIVARE",heroTitle:"Er privata rekryteringsyta.",heroCopy:"Läs avtalet, fyll i hela bemanningsbehovet och följ kandidaterna som Statybos24 presenterar.",heroFoot:"Direkt byggrekrytering från Litauen.",portal:"ARBETSGIVARPORTAL",signIn:"Logga in",intro:"Använd de privata inloggningsuppgifter som Statybos24 har skickat till er.",companyId:"INLOGGNING",companyPlaceholder:"t.ex. ID-123456",password:"LÖSENORD",passwordPlaceholder:"Ert lösenord",missing:"Ange företags-ID och lösenord.",accessDenied:"Felaktiga inloggningsuppgifter.",sessionError:"Det gick inte att skapa portalsessionen.",signInError:"Företags-ID eller lösenord är fel.",busy:"Loggar in...",submit:"Logga in på arbetsgivarportalen",help:"Frågor om åtkomst eller avtal? Svara på Statybos24-mejlet där ni fick inloggningsuppgifterna eller kontakta"},
  da:{metaTitle:"Arbejdsgiverportal login | Statybos24",eyebrow:"FOR INTERNATIONALE ARBEJDSGIVERE",heroTitle:"Jeres private rekrutteringsområde.",heroCopy:"Læs aftalen, udfyld hele bemandingsbehovet og følg de kandidater, som Statybos24 præsenterer.",heroFoot:"Direkte rekruttering til byggebranchen fra Litauen.",portal:"ARBEJDSGIVERPORTAL",signIn:"Log ind",intro:"Brug de private loginoplysninger, som Statybos24 har sendt til jer.",companyId:"LOGIN",companyPlaceholder:"f.eks. ID-123456",password:"ADGANGSKODE",passwordPlaceholder:"Jeres adgangskode",missing:"Indtast virksomheds-ID og adgangskode.",accessDenied:"Forkerte loginoplysninger.",sessionError:"Portalsessionen kunne ikke oprettes.",signInError:"Virksomheds-ID eller adgangskode er forkert.",busy:"Logger ind...",submit:"Log ind på arbejdsgiverportalen",help:"Spørgsmål om adgang eller aftale? Svar på Statybos24-mailen, hvor I modtog loginoplysningerne, eller kontakt"}
};

export function detectHirePortalLanguage() {
  const supported = HIRE_LANGUAGES.map((item) => item.code);
  const queryLanguage = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
  if (supported.includes(queryLanguage)) return queryLanguage;
  try {
    const saved = window.localStorage.getItem("hire-language");
    if (supported.includes(saved)) return saved;
  } catch {}
  const browser = String(window.navigator?.language || "").toLowerCase().slice(0,2);
  return supported.includes(browser) ? browser : "en";
}

export function persistHirePortalLanguage(code) {
  if (!HIRE_LANGUAGES.some((item) => item.code === code)) return;
  try { window.localStorage.setItem("hire-language", code); } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("lang", code);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  document.documentElement.lang = code;
}

export function HirePortalLanguageSwitch({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = HIRE_LANGUAGES.find((item) => item.code === lang) || HIRE_LANGUAGES[0];
  useEffect(() => {
    if (!open) return;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const key = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  return <div className="hire-portal-lang-switch" ref={rootRef}>
    <button type="button" className="hire-portal-lang-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span>{selected.short}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    {open ? <div className="hire-portal-lang-menu" role="listbox" aria-label={HIRE_COPY[lang]?.language || "Language"}>
      {HIRE_LANGUAGES.map((item) => <button type="button" role="option" aria-selected={item.code===lang} className={item.code===lang?"active":""} key={item.code} onClick={() => { onChange(item.code); setOpen(false); }}><span>{item.label}</span><b>{item.short}</b></button>)}
    </div> : null}
  </div>;
}

export function HirePortalLogo() {
  return <BrandLogo href="/hire" height={48} style={{display:"inline-flex",justifyContent:"center"}} imgStyle={{maxWidth:210}} />;
}

export function HireEmployerLoginPage() {
  const [lang, setLang] = useState(detectHirePortalLanguage);
  const copy = HIRE_PORTAL_LOGIN_COPY[lang] || HIRE_PORTAL_LOGIN_COPY.en;
  const changeLanguage = (code) => { persistHirePortalLanguage(code); setLang(code); };

  useEffect(() => {
    const previousTitle = document.title;
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.getAttribute("content") ?? null;
    const robots = existing || document.createElement("meta");
    if (!existing) { robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", "noindex,nofollow,noarchive");
    document.title = copy.metaTitle;
    document.documentElement.lang = lang;
    return () => { document.title = previousTitle; if (existing) { if (previous === null) existing.removeAttribute("content"); else existing.setAttribute("content", previous); } else robots.remove(); };
  }, [lang, copy.metaTitle]);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Opening the login page must always require an explicit sign-in.
    // Do not reuse a previous employer portal session automatically.
    setForeignHirePortalToken("");
  }, []);

  async function submit(event) {
    event?.preventDefault?.();
    if (!supabase || busy) return;
    setError("");
    if (!loginId.trim() || !password) {
      setError(copy.missing);
      return;
    }
    setBusy(true);
    try {
      // Only the backend decides whether an authenticated email user can get an
      // employer portal session. Passwords and allowed-email lists stay off the client.
      if (loginId.trim().includes("@")) {
        const signedIn = await supabase.auth.signInWithPassword({
          email: loginId.trim().toLowerCase(), password,
        });
        if (signedIn.error || !signedIn.data?.session) throw new Error(copy.signInError);
        try {
          const { data, error: sessionError } = await supabase.rpc("foreign_employer_admin_test_login");
          if (sessionError) throw sessionError;
          const portalToken = (Array.isArray(data) ? data[0]?.session_token : data?.session_token) || "";
          if (!portalToken) throw new Error(copy.sessionError);
          setForeignHirePortalToken(portalToken);
          window.location.assign("/hire/portal");
          return;
        } catch (accessError) {
          await supabase.auth.signOut({ scope: "local" });
          throw new Error(copy.accessDenied);
        }
      }
      const { data, error } = await supabase.rpc("foreign_employer_login", {
        p_login_id: loginId.trim().toUpperCase(),
        p_password: password,
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row?.session_token) throw new Error(copy.signInError);
      setForeignHirePortalToken(row.session_token);
      window.location.assign("/hire/portal");
    } catch (err) {
      setError(err?.message || copy.signInError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p24">
      <div className="hp-login">
        <form className="hp-card" onSubmit={submit} noValidate>
          <div className="h-lsel"><select aria-label="Language" value={lang} onChange={(e) => changeLanguage(e.target.value)}>
            {HIRE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select></div>
          <img src="/brand-logo-tight.png" alt="statybos24.lt" className="hp-logo" />
          <span className="h-k">{copy.portal}</span>
          <h2>{copy.signIn}</h2>
          <p className="small muted" style={{ margin: 0 }}>{copy.intro}</p>
          <div className="form">
            <label className="field" htmlFor="hl-e">{copy.companyId}<input id="hl-e" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={copy.companyPlaceholder} /></label>
            <label className="field" htmlFor="hl-p">{copy.password}<input id="hl-p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={copy.passwordPlaceholder} /></label>
            {error ? <p className="ferr" role="alert">{error}</p> : null}
            <button className="btn primary" type="submit" disabled={busy}>{busy ? copy.busy : copy.submit}</button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>{copy.help} <a href="mailto:info@statybos24.lt">info@statybos24.lt</a></p>
          <a className="linkbtn" href={`/hire?lang=${lang}`}>← statybos24.lt/hire</a>
        </form>
      </div>
    </div>
  );
}

export function HirePortalSegment({ value, onChange, options }) {
  return <div className="hep-segment">{options.map(item=><button type="button" key={item.value} className={value===item.value?"active":""} onClick={()=>onChange(item.value)}>{item.label}</button>)}</div>;
}

export function HirePortalCheckChoice({ value, onChange, options, name }) {
  return <div className="hep-check-choice">{options.map((item) => (
    <label key={item.value} className={value === item.value ? "active" : ""}>
      <input type="radio" name={name} value={item.value} checked={value === item.value} onChange={() => onChange(item.value)} />
      <span className="hep-check-box" aria-hidden="true">×</span>
      <span>{item.label}</span>
    </label>
  ))}</div>;
}

export function HirePortalDatePicker({ value, onChange, lang = "en" }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const parseValue = (dateValue) => {
    const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };
  const [viewDate, setViewDate] = useState(() => {
    const selected = parseValue(value) || new Date();
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selected = parseValue(value);
    if (selected) setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [open, value]);

  const locale = ({ lt:"lt-LT", de:"de-DE", nl:"nl-NL", no:"nb-NO", sv:"sv-SE", da:"da-DK", en:"en-GB" })[lang] || "en-GB";
  const ui = ({
    lt:{ clear:"Išvalyti", today:"Šiandien" },
    de:{ clear:"Löschen", today:"Heute" },
    nl:{ clear:"Wissen", today:"Vandaag" },
    no:{ clear:"Tøm", today:"I dag" },
    sv:{ clear:"Rensa", today:"I dag" },
    da:{ clear:"Ryd", today:"I dag" },
    en:{ clear:"Clear", today:"Today" },
  })[lang] || { clear:"Clear", today:"Today" };

  const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const selected = parseValue(value);
  const displayValue = selected ? new Intl.DateTimeFormat(locale, { day:"2-digit", month:"2-digit", year:"numeric" }).format(selected) : "dd/mm/yyyy";
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthTitle = new Intl.DateTimeFormat(locale, { month:"long", year:"numeric" }).format(viewDate);
  const weekdayLabels = Array.from({ length:7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday:"short" }).format(new Date(2024, 0, 1 + index)).replace(/\.$/, ""));
  const cells = Array.from({ length:42 }, (_, index) => new Date(year, month, index - firstDayOffset + 1));
  const todayIso = toISO(new Date());

  return <div className={`hep-date-picker ${open ? "open" : ""}`} ref={rootRef}>
    <button className="hep-date-trigger" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
      <span className={value ? "" : "placeholder"}>{displayValue}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    </button>
    {open ? <div className="hep-date-popover">
      <div className="hep-date-head">
        <button type="button" aria-label="Previous month" onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</button>
        <b>{monthTitle}</b>
        <button type="button" aria-label="Next month" onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</button>
      </div>
      <div className="hep-date-weekdays">{weekdayLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
      <div className="hep-date-grid">{cells.map((date) => {
        const iso = toISO(date);
        const outside = date.getMonth() !== month;
        const active = iso === value;
        const today = iso === todayIso;
        return <button type="button" key={iso} className={`${outside ? "outside" : ""} ${active ? "active" : ""} ${today ? "today" : ""}`} onClick={() => { onChange(iso); setOpen(false); }}>{date.getDate()}</button>;
      })}</div>
      <div className="hep-date-foot">
        <button type="button" onClick={() => { onChange(""); setOpen(false); }}>{ui.clear}</button>
        <button type="button" onClick={() => { const iso = toISO(new Date()); onChange(iso); setViewDate(new Date()); setOpen(false); }}>{ui.today}</button>
      </div>
    </div> : null}
  </div>;
}


export const HIRE_EMPLOYER_PORTAL_I18N = {
  "Comment": {de:"Kommentar",nl:"Opmerking",no:"Kommentar",sv:"Kommentar",da:"Kommentar"},
  "Employer portal | Statybos24":{de:"Arbeitgeberportal | Statybos24",nl:"Werkgeversportaal | Statybos24",no:"Arbeidsgiverportal | Statybos24",sv:"Arbetsgivarportal | Statybos24",da:"Arbejdsgiverportal | Statybos24"},
  "New":{de:"Neu",nl:"Nieuw",no:"Ny",sv:"Ny",da:"Ny"},
  "Under review":{de:"In Prüfung",nl:"In beoordeling",no:"Til vurdering",sv:"Under granskning",da:"Under gennemgang"},
  "Preparing":{de:"In Vorbereitung",nl:"Wordt voorbereid",no:"Forberedes",sv:"Förbereds",da:"Forberedes"},
  "Waiting for employer":{de:"Warten auf Arbeitgeber",nl:"Wacht op werkgever",no:"Venter på arbeidsgiver",sv:"Väntar på arbetsgivaren",da:"Venter på arbejdsgiver"},
  "Submitted":{de:"Eingereicht",nl:"Ingediend",no:"Sendt inn",sv:"Inskickad",da:"Indsendt"},
  "Approved":{de:"Freigegeben",nl:"Goedgekeurd",no:"Godkjent",sv:"Godkänd",da:"Godkendt"},
  "Sourcing":{de:"Kandidatensuche",nl:"Werving loopt",no:"Søk pågår",sv:"Rekrytering pågår",da:"Rekruttering i gang"},
  "Declined":{de:"Abgelehnt",nl:"Afgewezen",no:"Avslått",sv:"Avslagen",da:"Afvist"},
  "Completed":{de:"Abgeschlossen",nl:"Afgerond",no:"Fullført",sv:"Slutförd",da:"Afsluttet"},
  "Interview requested":{de:"Vorstellungsgespräch angefragt",nl:"Interview aangevraagd",no:"Intervju forespurt",sv:"Intervju begärd",da:"Samtale anmodet"},
  "Interview contact provided":{de:"Interviewkontakt bereitgestellt",nl:"Interviewcontact verstrekt",no:"Intervjukontakt delt",sv:"Intervjukontakt delad",da:"Interviewkontakt delt"},
  "Candidate approved":{de:"Kandidat bestätigt",nl:"Kandidaat goedgekeurd",no:"Kandidat godkjent",sv:"Kandidat godkänd",da:"Kandidat godkendt"},
  "Not suitable":{de:"Nicht geeignet",nl:"Niet geschikt",no:"Ikke egnet",sv:"Inte lämplig",da:"Ikke egnet"},
  "Awaiting decision":{de:"Entscheidung ausstehend",nl:"Wacht op beslissing",no:"Avventer beslutning",sv:"Väntar på beslut",da:"Afventer beslutning"},
  "Direct employment":{de:"Direkteinstellung",nl:"Direct dienstverband",no:"Direkte ansettelse",sv:"Direktanställning",da:"Direkte ansættelse"},
  "Fixed-term":{de:"Befristet",nl:"Tijdelijk",no:"Tidsbegrenset",sv:"Tidsbegränsad",da:"Tidsbegrænset"},
  "Permanent":{de:"Unbefristet",nl:"Vast",no:"Fast",sv:"Tillsvidare",da:"Fast"},
  "Per hour":{de:"Pro Stunde",nl:"Per uur",no:"Per time",sv:"Per timme",da:"Pr. time"},
  "Per month":{de:"Pro Monat",nl:"Per maand",no:"Per måned",sv:"Per månad",da:"Pr. måned"},
  "Gross":{de:"Brutto",nl:"Bruto",no:"Brutto",sv:"Brutto",da:"Brutto"},
  "Net":{de:"Netto",nl:"Netto",no:"Netto",sv:"Netto",da:"Netto"},
  "Provided by employer":{de:"Vom Arbeitgeber gestellt",nl:"Door werkgever verstrekt",no:"Tilbys av arbeidsgiver",sv:"Tillhandahålls av arbetsgivaren",da:"Stilles til rådighed af arbejdsgiver"},
  "Not provided":{de:"Nicht gestellt",nl:"Niet verstrekt",no:"Tilbys ikke",sv:"Tillhandahålls inte",da:"Stilles ikke til rådighed"},
  "Employee contributes":{de:"Mitarbeiter beteiligt sich",nl:"Werknemer betaalt mee",no:"Arbeidstaker betaler en del",sv:"Arbetstagaren betalar en del",da:"Medarbejderen betaler en del"},
  "Required":{de:"Erforderlich",nl:"Verplicht",no:"Påkrevd",sv:"Obligatoriskt",da:"Påkrævet"},
  "Preferred":{de:"Bevorzugt",nl:"Gewenst",no:"Foretrukket",sv:"Önskvärt",da:"Foretrukket"},
  "Not required":{de:"Nicht erforderlich",nl:"Niet vereist",no:"Ikke påkrevd",sv:"Krävs inte",da:"Ikke påkrævet"},
  "Loading employer portal...":{de:"Arbeitgeberportal wird geladen...",nl:"Werkgeversportaal laden...",no:"Laster arbeidsgiverportal...",sv:"Laddar arbetsgivarportalen...",da:"Indlæser arbejdsgiverportal..."},
  "Portal is not available.":{de:"Portal ist nicht verfügbar.",nl:"Portaal is niet beschikbaar.",no:"Portalen er ikke tilgjengelig.",sv:"Portalen är inte tillgänglig.",da:"Portalen er ikke tilgængelig."},
  "EMPLOYER PORTAL":{de:"ARBEITGEBERPORTAL",nl:"WERKGEVERSPORTAAL",no:"ARBEIDSGIVERPORTAL",sv:"ARBETSGIVARPORTAL",da:"ARBEJDSGIVERPORTAL"},
  "PRIVATE RECRUITMENT WORKSPACE":{de:"PRIVATER RECRUITING-BEREICH",nl:"PRIVÉ WERVINGSOMGEVING",no:"PRIVAT REKRUTTERINGSOMRÅDE",sv:"PRIVAT REKRYTERINGSYTA",da:"PRIVAT REKRUTTERINGSOMRÅDE"},
  "Sign out":{de:"Abmelden",nl:"Uitloggen",no:"Logg ut",sv:"Logga ut",da:"Log ud"},
  "STATYBOS24 · INTERNATIONAL HIRE":{de:"STATYBOS24 · INTERNATIONALE REKRUTIERUNG",nl:"STATYBOS24 · INTERNATIONALE WERVING",no:"STATYBOS24 · INTERNASJONAL REKRUTTERING",sv:"STATYBOS24 · INTERNATIONELL REKRYTERING",da:"STATYBOS24 · INTERNATIONAL REKRUTTERING"},
  "Hello":{de:"Hallo",nl:"Hallo",no:"Hei",sv:"Hej",da:"Hej"},
  "Submit workforce needs and review the candidates Statybos24 introduces for each specific job.":{de:"Übermitteln Sie Ihren Personalbedarf und prüfen Sie die Kandidaten, die Statybos24 für jede konkrete Stelle vorstellt.",nl:"Dien personeelsbehoeften in en bekijk de kandidaten die Statybos24 voor elke specifieke functie voorstelt.",no:"Send inn bemanningsbehov og vurder kandidatene Statybos24 presenterer for hver konkrete stilling.",sv:"Skicka in bemanningsbehov och granska kandidaterna som Statybos24 presenterar för varje specifikt jobb.",da:"Indsend bemandingsbehov og gennemgå de kandidater, Statybos24 præsenterer til hver konkret stilling."},
  "Submit workforce need":{de:"Personalbedarf einreichen",nl:"Personeelsbehoefte indienen",no:"Send inn bemanningsbehov",sv:"Skicka in bemanningsbehov",da:"Indsend bemandingsbehov"},
  "Your workforce needs":{de:"Ihre Personalbedarfe",nl:"Uw personeelsbehoeften",no:"Dine bemanningsbehov",sv:"Era bemanningsbehov",da:"Jeres bemandingsbehov"},
  "Open a need to review the information you submitted and the candidates assigned to it.":{de:"Öffnen Sie einen Bedarf, um Ihre Angaben und die zugeordneten Kandidaten zu sehen.",nl:"Open een behoefte om uw gegevens en de toegewezen kandidaten te bekijken.",no:"Åpne et behov for å se informasjonen du sendte inn og kandidatene som er knyttet til det.",sv:"Öppna ett behov för att se informationen ni skickat in och kandidaterna som kopplats till det.",da:"Åbn et behov for at se de oplysninger, I har indsendt, og de kandidater der er tilknyttet."},
  "Start":{de:"Start",nl:"Start",no:"Start",sv:"Start",da:"Start"},
  "Workers":{de:"Mitarbeiter",nl:"Medewerkers",no:"Arbeidere",sv:"Arbetare",da:"Medarbejdere"},
  "Open":{de:"Öffnen",nl:"Openen",no:"Åpne",sv:"Öppna",da:"Åbn"},
  "No workforce needs submitted yet":{de:"Noch kein Personalbedarf eingereicht",nl:"Nog geen personeelsbehoeften ingediend",no:"Ingen bemanningsbehov sendt inn ennå",sv:"Inga bemanningsbehov har skickats in ännu",da:"Ingen bemandingsbehov indsendt endnu"},
  "Use “Submit workforce need” when you are ready to provide full job, salary, accommodation and project information.":{de:"Nutzen Sie „Personalbedarf einreichen“, sobald Sie vollständige Angaben zu Stelle, Lohn, Unterkunft und Projekt machen können.",nl:"Gebruik ‘Personeelsbehoefte indienen’ zodra u volledige informatie over functie, salaris, huisvesting en project kunt geven.",no:"Bruk «Send inn bemanningsbehov» når du er klar til å oppgi full informasjon om jobb, lønn, bolig og prosjekt.",sv:"Använd ”Skicka in bemanningsbehov” när ni är redo att lämna fullständig information om jobb, lön, boende och projekt.",da:"Brug “Indsend bemandingsbehov”, når I er klar til at oplyse alle detaljer om job, løn, bolig og projekt."},
  "Recruitment agreement":{de:"Vermittlungsvereinbarung",nl:"Wervingsovereenkomst",no:"Rekrutteringsavtale",sv:"Rekryteringsavtal",da:"Rekrutteringsaftale"},
  "Signed copy received.":{de:"Unterschriebene Kopie erhalten.",nl:"Ondertekende kopie ontvangen.",no:"Signert kopi mottatt.",sv:"Signerad kopia mottagen.",da:"Underskrevet kopi modtaget."},
  "Your signed agreement has been accepted.":{de:"Ihre unterschriebene Vereinbarung wurde angenommen.",nl:"Uw ondertekende overeenkomst is geaccepteerd.",no:"Den signerte avtalen deres er mottatt og godkjent.",sv:"Ert signerade avtal har tagits emot och godkänts.",da:"Jeres underskrevne aftale er modtaget og godkendt."},
  "Open agreement":{de:"Vertrag öffnen",nl:"Overeenkomst openen",no:"Åpne avtale",sv:"Öppna avtal",da:"Åbn aftale"},
  "Please read the agreement carefully. If everything is acceptable, sign it and upload the signed copy. If you have questions, contact Statybos24 by email.":{de:"Bitte lesen Sie die Vereinbarung sorgfältig. Wenn alles passt, unterschreiben Sie sie und laden Sie die unterschriebene Kopie hoch. Bei Fragen kontaktieren Sie Statybos24 per E-Mail.",nl:"Lees de overeenkomst zorgvuldig. Als alles akkoord is, onderteken deze en upload de ondertekende kopie. Neem bij vragen per e-mail contact op met Statybos24.",no:"Les avtalen nøye. Hvis alt er i orden, signer den og last opp den signerte kopien. Kontakt Statybos24 på e-post hvis dere har spørsmål.",sv:"Läs avtalet noggrant. Om allt är i sin ordning, signera det och ladda upp den signerade kopian. Kontakta Statybos24 via e-post om ni har frågor.",da:"Læs aftalen grundigt. Hvis alt er i orden, underskriv den og upload den underskrevne kopi. Kontakt Statybos24 via e-mail, hvis I har spørgsmål."},
  "Click the document to read the agreement.":{de:"Klicken Sie auf das Dokument, um die Vereinbarung zu lesen.",nl:"Klik op het document om de overeenkomst te lezen.",no:"Klikk på dokumentet for å lese avtalen.",sv:"Klicka på dokumentet för att läsa avtalet.",da:"Klik på dokumentet for at læse aftalen."},
  "Upload signed agreement":{de:"Unterschriebene Vereinbarung hochladen",nl:"Ondertekende overeenkomst uploaden",no:"Last opp signert avtale",sv:"Ladda upp signerat avtal",da:"Upload underskrevet aftale"},
  "Contact by email":{de:"Per E-Mail kontaktieren",nl:"Contact per e-mail",no:"Kontakt på e-post",sv:"Kontakta via e-post",da:"Kontakt via e-mail"},
  "Download signed copy":{de:"Unterschriebene Kopie herunterladen",nl:"Ondertekende kopie downloaden",no:"Last ned signert kopi",sv:"Ladda ner signerad kopia",da:"Download underskrevet kopi"},
  "Uploading...":{de:"Wird hochgeladen...",nl:"Uploaden...",no:"Laster opp...",sv:"Laddar upp...",da:"Uploader..."},
  "The signed agreement is locked in the portal. Corrections are handled through Statybos24.":{de:"Der unterschriebene Vertrag ist im Portal gesperrt. Korrekturen erfolgen über Statybos24.",nl:"De ondertekende overeenkomst is vergrendeld in het portaal. Correcties verlopen via Statybos24.",no:"Den signerte avtalen er låst i portalen. Endringer håndteres gjennom Statybos24.",sv:"Det signerade avtalet är låst i portalen. Ändringar hanteras via Statybos24.",da:"Den underskrevne aftale er låst i portalen. Rettelser håndteres gennem Statybos24."},
  "Back":{de:"Zurück",nl:"Terug",no:"Tilbake",sv:"Tillbaka",da:"Tilbage"},
  "NEW WORKFORCE NEED":{de:"NEUER PERSONALBEDARF",nl:"NIEUWE PERSONEELSBEHOEFTE",no:"NYTT BEMANNINGSBEHOV",sv:"NYTT BEMANNINGSBEHOV",da:"NYT BEMANDINGSBEHOV"},
  "Provide the complete job and project conditions. This is the information Statybos24 will use for sourcing and candidate screening.":{de:"Geben Sie die vollständigen Stellen- und Projektbedingungen an. Diese Angaben nutzt Statybos24 für Suche und Kandidatenprüfung.",nl:"Geef de volledige functie- en projectvoorwaarden. Statybos24 gebruikt deze informatie voor sourcing en kandidaatselectie.",no:"Oppgi fullstendige jobb- og prosjektvilkår. Statybos24 bruker informasjonen til søk og kandidatvurdering.",sv:"Ange fullständiga jobb- och projektvillkor. Statybos24 använder informationen för sökning och kandidaturval.",da:"Angiv de fulde job- og projektvilkår. Statybos24 bruger oplysningerne til søgning og kandidatvurdering."},
  "Job & project":{de:"Stelle & Projekt",nl:"Functie & project",no:"Jobb og prosjekt",sv:"Jobb & projekt",da:"Job & projekt"},
  "WORKFORCE NEED / JOB TITLE *":{de:"PERSONALBEDARF / STELLENTITEL *",nl:"PERSONEELSBEHOEFTE / FUNCTIETITEL *",no:"BEMANNINGSBEHOV / STILLINGSTITTEL *",sv:"BEMANNINGSBEHOV / JOBBTITEL *",da:"BEMANDINGSBEHOV / JOBTITEL *"},
  "PROJECT COUNTRY *":{de:"PROJEKTLAND *",nl:"PROJECTLAND *",no:"PROSJEKTLAND *",sv:"PROJEKTLAND *",da:"PROJEKTLAND *"},
  "PROJECT LOCATION *":{de:"PROJEKTORT *",nl:"PROJECTLOCATIE *",no:"PROSJEKTSTED *",sv:"PROJEKTPLATS *",da:"PROJEKTSTED *"},
  "START DATE *":{de:"STARTDATUM *",nl:"STARTDATUM *",no:"STARTDATO *",sv:"STARTDATUM *",da:"STARTDATO *"},
  "NEEDED BY":{de:"BENÖTIGT BIS",nl:"BENODIGD VOOR",no:"BEHOV INNEN",sv:"BEHÖVS SENAST",da:"BEHOV SENEST"},
  "Workers required":{de:"Benötigte Mitarbeiter",nl:"Benodigde medewerkers",no:"Arbeidere som trengs",sv:"Arbetare som behövs",da:"Medarbejdere der kræves"},
  "ROLE":{de:"POSITION",nl:"FUNCTIE",no:"ROLLE",sv:"ROLL",da:"ROLLE"},
  "Remove":{de:"Entfernen",nl:"Verwijderen",no:"Fjern",sv:"Ta bort",da:"Fjern"},
  "PROFESSION / TRADE *":{de:"BERUF / GEWERK *",nl:"BEROEP / VAK *",no:"FAG / YRKE *",sv:"YRKE / FACK *",da:"FAG / STILLING *"},
  "WORKERS NEEDED *":{de:"BENÖTIGTE MITARBEITER *",nl:"AANTAL MEDEWERKERS *",no:"ANTALL ARBEIDERE *",sv:"ANTAL ARBETARE *",da:"ANTAL MEDARBEJDERE *"},
  "MINIMUM EXPERIENCE":{de:"MINDESTERFAHRUNG",nl:"MINIMALE ERVARING",no:"MINIMUMSERFARING",sv:"MINSTA ERFARENHET",da:"MINIMUMSERFARING"},
  "LANGUAGE / LEVEL":{de:"SPRACHE / NIVEAU",nl:"TAAL / NIVEAU",no:"SPRÅK / NIVÅ",sv:"SPRÅK / NIVÅ",da:"SPROG / NIVEAU"},
  "REQUIRED SKILLS / TASKS":{de:"ERFORDERLICHE FÄHIGKEITEN / AUFGABEN",nl:"VEREISTE VAARDIGHEDEN / TAKEN",no:"NØDVENDIGE FERDIGHETER / OPPGAVER",sv:"KRÄVDA FÄRDIGHETER / UPPGIFTER",da:"NØDVENDIGE KOMPETENCER / OPGAVER"},
  "DRIVING LICENCE":{de:"FÜHRERSCHEIN",nl:"RIJBEWIJS",no:"FØRERKORT",sv:"KÖRKORT",da:"KØREKORT"},
  "Add another trade":{de:"Weiteres Gewerk hinzufügen",nl:"Nog een vak toevoegen",no:"Legg til et fag",sv:"Lägg till ett yrke",da:"Tilføj et fag"},
  "Employment conditions":{de:"Arbeitsbedingungen",nl:"Arbeidsvoorwaarden",no:"Arbeidsvilkår",sv:"Anställningsvillkor",da:"Ansættelsesvilkår"},
  "EMPLOYMENT TYPE":{de:"BESCHÄFTIGUNGSART",nl:"DIENSTVERBAND",no:"ANSETTELSESFORM",sv:"ANSTÄLLNINGSFORM",da:"ANSÆTTELSESFORM"},
  "PROJECT / CONTRACT DURATION":{de:"PROJEKT- / VERTRAGSDAUER",nl:"PROJECT- / CONTRACTDUUR",no:"PROSJEKT- / KONTRAKTSVARIGHET",sv:"PROJEKT- / AVTALSTID",da:"PROJEKT- / KONTRAKTVARIGHED"},
  "HOURS PER WEEK *":{de:"STUNDEN PRO WOCHE *",nl:"UREN PER WEEK *",no:"TIMER PER UKE *",sv:"TIMMAR PER VECKA *",da:"TIMER PR. UGE *"},
  "OVERTIME":{de:"ÜBERSTUNDEN",nl:"OVERWERK",no:"OVERTID",sv:"ÖVERTID",da:"OVERTID"},
  "ROTATION":{de:"ROTATION",nl:"ROTATIE",no:"ROTASJON",sv:"ROTATION",da:"ROTATION"},
  "Salary":{de:"Vergütung",nl:"Salaris",no:"Lønn",sv:"Lön",da:"Løn"},
  "CURRENCY *":{de:"WÄHRUNG *",nl:"VALUTA *",no:"VALUTA *",sv:"VALUTA *",da:"VALUTA *"},
  "SALARY TYPE":{de:"VERGÜTUNGSART",nl:"SALARISTYPE",no:"LØNNSTYPE",sv:"LÖNETYP",da:"LØNTYPE"},
  "MINIMUM SALARY *":{de:"MINDESTLOHN *",nl:"MINIMUMSALARIS *",no:"MINSTELØNN *",sv:"MINSTA LÖN *",da:"MINIMUMSLØN *"},
  "MAXIMUM SALARY":{de:"MAXIMALLOHN",nl:"MAXIMUMSALARIS",no:"MAKSIMAL LØNN",sv:"HÖGSTA LÖN",da:"MAKSIMUMSLØN"},
  "SALARY BASIS":{de:"LOHNBASIS",nl:"SALARISBASIS",no:"LØNNSGRUNNLAG",sv:"LÖNEBAS",da:"LØNGRUNDLAG"},
  "Accommodation & travel":{de:"Unterkunft & Reise",nl:"Huisvesting & reizen",no:"Bolig og reise",sv:"Boende & resor",da:"Bolig & rejse"},
  "ACCOMMODATION *":{de:"UNTERKUNFT *",nl:"HUISVESTING *",no:"BOLIG *",sv:"BOENDE *",da:"BOLIG *"},
  "ROOM / ACCOMMODATION TYPE":{de:"ZIMMER- / UNTERKUNFTSART",nl:"KAMER- / HUISVESTINGSTYPE",no:"ROM- / BOLIGTYPE",sv:"RUMS- / BOENDETYP",da:"VÆRELSES- / BOLIGTYPE"},
  "EMPLOYEE ACCOMMODATION COST":{de:"UNTERKUNFTSKOSTEN FÜR MITARBEITER",nl:"HUISVESTINGSKOSTEN WERKNEMER",no:"ARBEIDSTAKERS BOLIGKOSTNAD",sv:"ARBETSTAGARENS BOENDEKOSTNAD",da:"MEDARBEJDERENS BOLIGUDGIFT"},
  "INITIAL TRAVEL":{de:"ERSTE ANREISE",nl:"EERSTE REIS",no:"FØRSTE REISE",sv:"FÖRSTA RESAN",da:"FØRSTE REJSE"},
  "TRANSPORT TO WORKSITE":{de:"TRANSPORT ZUR BAUSTELLE",nl:"VERVOER NAAR WERKLOCATIE",no:"TRANSPORT TIL ARBEIDSSTED",sv:"TRANSPORT TILL ARBETSPLATS",da:"TRANSPORT TIL ARBEJDSSTED"},
  "HOME / ROTATION TRAVEL":{de:"HEIM- / ROTATIONSREISEN",nl:"THUIS- / ROTATIEREIZEN",no:"HJEM- / ROTASJONSREISER",sv:"HEM- / ROTATIONSRESOR",da:"HJEM- / ROTATIONSREJSER"},
  "ADDITIONAL REQUIREMENTS / INFORMATION":{de:"ZUSÄTZLICHE ANFORDERUNGEN / INFORMATIONEN",nl:"AANVULLENDE EISEN / INFORMATIE",no:"YTTERLIGERE KRAV / INFORMASJON",sv:"YTTERLIGARE KRAV / INFORMATION",da:"YDERLIGERE KRAV / INFORMATION"},
  "Cancel":{de:"Abbrechen",nl:"Annuleren",no:"Avbryt",sv:"Avbryt",da:"Annuller"},
  "Submitting...":{de:"Wird übermittelt...",nl:"Indienen...",no:"Sender inn...",sv:"Skickar...",da:"Indsender..."},
  "All workforce needs":{de:"Alle Personalbedarfe",nl:"Alle personeelsbehoeften",no:"Alle bemanningsbehov",sv:"Alla bemanningsbehov",da:"Alle bemandingsbehov"},
  "WORKFORCE NEED":{de:"PERSONALBEDARF",nl:"PERSONEELSBEHOEFTE",no:"BEMANNINGSBEHOV",sv:"BEMANNINGSBEHOV",da:"BEMANDINGSBEHOV"},
  "Hide information":{de:"Informationen ausblenden",nl:"Informatie verbergen",no:"Skjul informasjon",sv:"Dölj information",da:"Skjul information"},
  "Information":{de:"Informationen",nl:"Informatie",no:"Informasjon",sv:"Information",da:"Information"},
  "Project":{de:"Projekt",nl:"Project",no:"Prosjekt",sv:"Projekt",da:"Projekt"},
  "Country":{de:"Land",nl:"Land",no:"Land",sv:"Land",da:"Land"},
  "Location":{de:"Ort",nl:"Locatie",no:"Sted",sv:"Plats",da:"Sted"},
  "Needed by":{de:"Benötigt bis",nl:"Benodigd voor",no:"Behov innen",sv:"Behövs senast",da:"Behov senest"},
  "Employment":{de:"Beschäftigung",nl:"Dienstverband",no:"Ansettelse",sv:"Anställning",da:"Ansættelse"},
  "Hours / week":{de:"Stunden / Woche",nl:"Uren / week",no:"Timer / uke",sv:"Timmar / vecka",da:"Timer / uge"},
  "Duration":{de:"Dauer",nl:"Duur",no:"Varighet",sv:"Varaktighet",da:"Varighed"},
  "Experience":{de:"Erfahrung",nl:"Ervaring",no:"Erfaring",sv:"Erfarenhet",da:"Erfaring"},
  "Language":{de:"Sprache",nl:"Taal",no:"Språk",sv:"Språk",da:"Sprog"},
  "Driving licence":{de:"Führerschein",nl:"Rijbewijs",no:"Førerkort",sv:"Körkort",da:"Kørekort"},
  "Skills / tasks":{de:"Fähigkeiten / Aufgaben",nl:"Vaardigheden / taken",no:"Ferdigheter / oppgaver",sv:"Färdigheter / uppgifter",da:"Kompetencer / opgaver"},
  "Accommodation":{de:"Unterkunft",nl:"Huisvesting",no:"Bolig",sv:"Boende",da:"Bolig"},
  "Room":{de:"Zimmer",nl:"Kamer",no:"Rom",sv:"Rum",da:"Værelse"},
  "Cost":{de:"Kosten",nl:"Kosten",no:"Kostnad",sv:"Kostnad",da:"Pris"},
  "Initial travel":{de:"Erste Anreise",nl:"Eerste reis",no:"Første reise",sv:"Första resan",da:"Første rejse"},
  "Work transport":{de:"Arbeitsweg",nl:"Vervoer naar werk",no:"Transport til jobb",sv:"Transport till arbete",da:"Transport til arbejde"},
  "Home travel":{de:"Heimreise",nl:"Reis naar huis",no:"Hjemreise",sv:"Hemresa",da:"Hjemrejse"},
  "Candidates":{de:"Kandidaten",nl:"Kandidaten",no:"Kandidater",sv:"Kandidater",da:"Kandidater"},
  "Candidates Statybos24 has introduced for this exact workforce need.":{de:"Kandidaten, die Statybos24 genau für diesen Personalbedarf vorgestellt hat.",nl:"Kandidaten die Statybos24 specifiek voor deze personeelsbehoefte heeft voorgesteld.",no:"Kandidater Statybos24 har presentert for akkurat dette bemanningsbehovet.",sv:"Kandidater som Statybos24 har presenterat för just detta bemanningsbehov.",da:"Kandidater som Statybos24 har præsenteret specifikt til dette bemandingsbehov."},
  "Construction specialist":{de:"Baufachkraft",nl:"Bouwspecialist",no:"Byggfagarbeider",sv:"Byggspecialist",da:"Byggefaglig specialist"},
  "Review":{de:"Ansehen",nl:"Bekijken",no:"Se",sv:"Granska",da:"Se"},
  "No candidates yet":{de:"Noch keine Kandidaten",nl:"Nog geen kandidaten",no:"Ingen kandidater ennå",sv:"Inga kandidater ännu",da:"Ingen kandidater endnu"},
  "yrs":{de:"J.",nl:"jr",no:"år",sv:"år",da:"år"},
  "B category":{de:"Klasse B",nl:"Categorie B",no:"Klasse B",sv:"B-kategori",da:"Kategori B"},
  "No / not confirmed":{de:"Nein / nicht bestätigt",nl:"Nee / niet bevestigd",no:"Nei / ikke bekreftet",sv:"Nej / inte bekräftat",da:"Nej / ikke bekræftet"},
  "Available from":{de:"Verfügbar ab",nl:"Beschikbaar vanaf",no:"Tilgjengelig fra",sv:"Tillgänglig från",da:"Tilgængelig fra"},
  "Salary expectation":{de:"Gehaltsvorstellung",nl:"Salarisverwachting",no:"Lønnsforventning",sv:"Löneanspråk",da:"Lønforventning"},
  "Decision":{de:"Entscheidung",nl:"Beslissing",no:"Beslutning",sv:"Beslut",da:"Beslutning"},
  "Skills / experience":{de:"Fähigkeiten / Erfahrung",nl:"Vaardigheden / ervaring",no:"Ferdigheter / erfaring",sv:"Färdigheter / erfarenhet",da:"Kompetencer / erfaring"},
  "Skills":{de:"Fähigkeiten",nl:"Vaardigheden",no:"Ferdigheter",sv:"Färdigheter",da:"Kompetencer"},
  "Age":{de:"Alter",nl:"Leeftijd",no:"Alder",sv:"Ålder",da:"Alder"},
  "Needs accommodation":{de:"Unterkunft benötigt",nl:"Huisvesting nodig",no:"Trenger bolig",sv:"Behöver boende",da:"Har brug for bolig"},
  "Yes":{de:"Ja",nl:"Ja",no:"Ja",sv:"Ja",da:"Ja"},
  "No":{de:"Nein",nl:"Nee",no:"Nei",sv:"Nej",da:"Nej"},
  "Statybos24 comment":{de:"Kommentar von Statybos24",nl:"Opmerking van Statybos24",no:"Kommentar fra Statybos24",sv:"Kommentar från Statybos24",da:"Kommentar fra Statybos24"},
  "Candidate CV":{de:"Lebenslauf des Kandidaten",nl:"CV van kandidaat",no:"Kandidatens CV",sv:"Kandidatens CV",da:"Kandidatens CV"},
  "Open full CV":{de:"Vollständigen Lebenslauf öffnen",nl:"Volledig CV openen",no:"Åpne full CV",sv:"Öppna fullständigt CV",da:"Åbn fuldt CV"},
  "View CV":{de:"Lebenslauf ansehen",nl:"CV bekijken",no:"Se CV",sv:"Visa CV",da:"Se CV"},
  "CONTACT SHARED BY STATYBOS24":{de:"KONTAKT VON STATYBOS24 FREIGEGEBEN",nl:"CONTACT GEDEELD DOOR STATYBOS24",no:"KONTAKT DELT AV STATYBOS24",sv:"KONTAKT DELAD AV STATYBOS24",da:"KONTAKT DELT AF STATYBOS24"},
  "We share the candidate email so you can contact them about the interview.":{de:"Wir geben die E-Mail-Adresse des Kandidaten weiter, damit Sie ihn wegen des Vorstellungsgesprächs kontaktieren können.",nl:"We delen het e-mailadres van de kandidaat zodat u contact kunt opnemen over het interview.",no:"Vi deler kandidatens e-postadresse slik at dere kan kontakte kandidaten om intervjuet.",sv:"Vi delar kandidatens e-postadress så att ni kan kontakta kandidaten om intervjun.",da:"Vi deler kandidatens e-mailadresse, så I kan kontakte kandidaten om interviewet."},
  "Request interview":{de:"Vorstellungsgespräch anfragen",nl:"Interview aanvragen",no:"Be om intervju",sv:"Begär intervju",da:"Bed om samtale"},
  "Approve candidate":{de:"Kandidat bestätigen",nl:"Kandidaat goedkeuren",no:"Godkjenn kandidat",sv:"Godkänn kandidat",da:"Godkend kandidat"},
  "Reject":{de:"Ablehnen",nl:"Afwijzen",no:"Avslå",sv:"Avslå",da:"Afvis"},
  "FIRST SIGN-IN":{de:"ERSTE ANMELDUNG",nl:"EERSTE LOGIN",no:"FØRSTE INNLOGGING",sv:"FÖRSTA INLOGGNING",da:"FØRSTE LOGIN"},
  "Create your own password":{de:"Eigenes Passwort erstellen",nl:"Maak uw eigen wachtwoord",no:"Opprett ditt eget passord",sv:"Skapa ett eget lösenord",da:"Opret dit eget kodeord"},
  "NEW PASSWORD":{de:"NEUES PASSWORT",nl:"NIEUW WACHTWOORD",no:"NYTT PASSORD",sv:"NYTT LÖSENORD",da:"NYT KODEORD"},
  "At least 12 characters":{de:"Mindestens 12 Zeichen",nl:"Minstens 12 tekens",no:"Minst 12 tegn",sv:"Minst 12 tecken",da:"Mindst 12 tegn"},
  "CONFIRM PASSWORD":{de:"PASSWORT BESTÄTIGEN",nl:"BEVESTIG WACHTWOORD",no:"BEKREFT PASSORD",sv:"BEKRÄFTA LÖSENORD",da:"BEKRÆFT KODEORD"},
  "Saving...":{de:"Wird gespeichert...",nl:"Opslaan...",no:"Lagrer...",sv:"Sparar...",da:"Gemmer..."},
  "Save password & continue":{de:"Passwort speichern & fortfahren",nl:"Wachtwoord opslaan & doorgaan",no:"Lagre passord og fortsett",sv:"Spara lösenord och fortsätt",da:"Gem kodeord og fortsæt"},
  "CANDIDATE DECISION":{de:"KANDIDATENENTSCHEIDUNG",nl:"BESLISSING OVER KANDIDAAT",no:"KANDIDATBESLUTNING",sv:"BESLUT OM KANDIDAT",da:"BESLUTNING OM KANDIDAT"},
  "Why are you rejecting this candidate?":{de:"Warum lehnen Sie diesen Kandidaten ab?",nl:"Waarom wijst u deze kandidaat af?",no:"Hvorfor avslår dere denne kandidaten?",sv:"Varför avslår ni den här kandidaten?",da:"Hvorfor afviser I denne kandidat?"},
  "Please give a short reason. Statybos24 will see it and use it to improve the next candidate selection.":{de:"Bitte nennen Sie kurz den Grund. Statybos24 sieht ihn und kann die nächste Kandidatenauswahl verbessern.",nl:"Geef kort de reden aan. Statybos24 ziet deze en gebruikt dit om de volgende selectie te verbeteren.",no:"Oppgi en kort grunn. Statybos24 ser den og bruker den til å forbedre neste kandidatvalg.",sv:"Ange kort varför. Statybos24 ser orsaken och använder den för att förbättra nästa kandidaturval.",da:"Angiv kort årsagen. Statybos24 ser den og bruger den til at forbedre næste kandidatvalg."},
  "e.g. insufficient experience, language level, availability...":{de:"z. B. zu wenig Erfahrung, Sprachniveau, Verfügbarkeit...",nl:"bijv. te weinig ervaring, taalniveau, beschikbaarheid...",no:"f.eks. for lite erfaring, språknivå, tilgjengelighet...",sv:"t.ex. för lite erfarenhet, språknivå, tillgänglighet...",da:"f.eks. for lidt erfaring, sprogniveau, tilgængelighed..."},
  "Reject candidate":{de:"Kandidaten ablehnen",nl:"Kandidaat afwijzen",no:"Avslå kandidat",sv:"Avslå kandidat",da:"Afvis kandidat"},
  "Rejection reason":{de:"Ablehnungsgrund",nl:"Reden van afwijzing",no:"Årsak til avslag",sv:"Orsak till avslag",da:"Årsag til afvisning"},
  "Please tell us why the candidate is not suitable.":{de:"Bitte geben Sie an, warum der Kandidat nicht geeignet ist.",nl:"Geef aan waarom de kandidaat niet geschikt is.",no:"Oppgi hvorfor kandidaten ikke passer.",sv:"Ange varför kandidaten inte passar.",da:"Angiv hvorfor kandidaten ikke passer."},
  "Candidate rejected. The reason was sent to Statybos24.":{de:"Kandidat abgelehnt. Der Grund wurde an Statybos24 übermittelt.",nl:"Kandidaat afgewezen. De reden is naar Statybos24 gestuurd.",no:"Kandidaten er avslått. Årsaken er sendt til Statybos24.",sv:"Kandidaten har avslagits. Orsaken har skickats till Statybos24.",da:"Kandidaten er afvist. Årsagen er sendt til Statybos24."},
  "Candidate confirmed and accepted.":{de:"Kandidat bestätigt und angenommen.",nl:"Kandidaat bevestigd en geaccepteerd.",no:"Kandidaten er bekreftet og godkjent.",sv:"Kandidaten är bekräftad och godkänd.",da:"Kandidaten er bekræftet og godkendt."}
  ,"Advantage":{de:"Vorteil",nl:"Voordeel",no:"Fordel",sv:"Fördel",da:"Fordel"}
  ,"JOB TITLE *":{de:"STELLENTITEL *",nl:"FUNCTIETITEL *",no:"STILLINGSTITTEL *",sv:"JOBBTITEL *",da:"JOBTITEL *"}
  ,"PROJECT ADDRESS *":{de:"PROJEKTADRESSE *",nl:"PROJECTADRES *",no:"PROSJEKTADRESSE *",sv:"PROJEKTADRESS *",da:"PROJEKTADRESSE *"}
  ,"WORKERS REQUIRED BY *":{de:"MITARBEITER BENÖTIGT BIS *",nl:"MEDEWERKERS NODIG UITERLIJK *",no:"ARBEIDERE MÅ VÆRE PÅ PLASS INNEN *",sv:"ARBETARE BEHÖVS SENAST *",da:"MEDARBEJDERE SKAL VÆRE KLAR SENEST *"}
  ,"EMPLOYMENT TYPE *":{de:"BESCHÄFTIGUNGSART *",nl:"TYPE DIENSTVERBAND *",no:"ANSETTELSESFORM *",sv:"ANSTÄLLNINGSFORM *",da:"ANSÆTTELSESFORM *"}
  ,"CONTRACT DURATION *":{de:"VERTRAGSDAUER *",nl:"CONTRACTDUUR *",no:"KONTRAKTSVARIGHET *",sv:"AVTALSTID *",da:"KONTRAKTVARIGHED *"}
  ,"OVERTIME":{de:"ÜBERSTUNDEN",nl:"OVERUREN",no:"OVERTID",sv:"ÖVERTID",da:"OVERTID"}
  ,"Overtime available":{de:"Überstunden möglich",nl:"Overuren mogelijk",no:"Overtid mulig",sv:"Övertid finns",da:"Overtid muligt"}
  ,"No overtime":{de:"Keine Überstunden",nl:"Geen overuren",no:"Ingen overtid",sv:"Ingen övertid",da:"Ingen overtid"}
  ,"OVERTIME PAY *":{de:"ÜBERSTUNDENVERGÜTUNG *",nl:"VERGOEDING OVERUREN *",no:"OVERTIDSBETALING *",sv:"ÖVERTIDSERSÄTTNING *",da:"OVERTIDSBETALING *"}
  ,"SALARY AMOUNT *":{de:"LOHNBETRAG *",nl:"SALARISBEDRAG *",no:"LØNNSBELØP *",sv:"LÖNEBELOPP *",da:"LØNBELØB *"}
  ,"PAYMENT FREQUENCY *":{de:"AUSZAHLUNGSRHYTHMUS *",nl:"BETAALFREQUENTIE *",no:"UTBETALINGSFREKVENS *",sv:"UTBETALNINGSFREKVENS *",da:"UDBETALINGSFREKVENS *"}
  ,"Employer provides":{de:"Arbeitgeber stellt bereit",nl:"Werkgever verstrekt",no:"Arbeidsgiver tilbyr",sv:"Arbetsgivaren ordnar",da:"Arbejdsgiver stiller til rådighed"}
  ,"Employee pays / contributes":{de:"Mitarbeiter zahlt / beteiligt sich",nl:"Werknemer betaalt / draagt bij",no:"Arbeidstaker betaler / bidrar",sv:"Arbetstagaren betalar / bidrar",da:"Medarbejderen betaler / bidrager"}
  ,"HOME TRAVEL":{de:"HEIMREISEN",nl:"REIZEN NAAR HUIS",no:"HJEMREISER",sv:"HEMRESOR",da:"HJEMREJSER"}
  ,"Paid by employer":{de:"Vom Arbeitgeber bezahlt",nl:"Betaald door werkgever",no:"Betales av arbeidsgiver",sv:"Betalas av arbetsgivaren",da:"Betales af arbejdsgiver"}
  ,"Not paid by employer":{de:"Nicht vom Arbeitgeber bezahlt",nl:"Niet betaald door werkgever",no:"Betales ikke av arbeidsgiver",sv:"Betalas inte av arbetsgivaren",da:"Betales ikke af arbejdsgiver"}
  ,"VACATION":{de:"URLAUB",nl:"VAKANTIE",no:"FERIE",sv:"SEMESTER",da:"FERIE"}
  ,"VACATION PAY":{de:"URLAUBSVERGÜTUNG",nl:"VAKANTIELOON",no:"FERIEPENGER",sv:"SEMESTERERSÄTTNING",da:"FERIEBETALING"}
  ,"Employment contract for review":{de:"Arbeitsvertrag zur Einsicht",nl:"Arbeidsovereenkomst ter inzage",no:"Arbeidsavtale for gjennomgang",sv:"Anställningsavtal för granskning",da:"Ansættelseskontrakt til gennemgang"}
  ,"Optional: upload a sample employment contract so Statybos24 can review the terms together with the workforce need.":{de:"Optional: Laden Sie einen Muster-Arbeitsvertrag hoch, damit Statybos24 die Bedingungen zusammen mit dem Personalbedarf prüfen kann.",nl:"Optioneel: upload een voorbeeldarbeidsovereenkomst zodat Statybos24 de voorwaarden samen met de personeelsbehoefte kan bekijken.",no:"Valgfritt: last opp en eksempelarbeidsavtale slik at Statybos24 kan gjennomgå vilkårene sammen med bemanningsbehovet.",sv:"Valfritt: ladda upp ett exempel på anställningsavtal så att Statybos24 kan granska villkoren tillsammans med bemanningsbehovet.",da:"Valgfrit: upload en eksempelansættelseskontrakt, så Statybos24 kan gennemgå vilkårene sammen med bemandingsbehovet."}
  ,"Choose employment contract PDF / DOCX":{de:"Arbeitsvertrag PDF / DOCX auswählen",nl:"Arbeidsovereenkomst PDF / DOCX kiezen",no:"Velg arbeidsavtale PDF / DOCX",sv:"Välj anställningsavtal PDF / DOCX",da:"Vælg ansættelseskontrakt PDF / DOCX"}
  ,"Employment contract":{de:"Arbeitsvertrag",nl:"Arbeidsovereenkomst",no:"Arbeidsavtale",sv:"Anställningsavtal",da:"Ansættelseskontrakt"}
  ,"Open employment contract":{de:"Arbeitsvertrag öffnen",nl:"Arbeidsovereenkomst openen",no:"Åpne arbeidsavtale",sv:"Öppna anställningsavtal",da:"Åbn ansættelseskontrakt"}

  ,"Add every trade / role needed for this project.": {"de": "Fügen Sie alle benötigten Berufe hinzu.", "nl": "Voeg alle benodigde beroepen toe.", "no": "Legg til alle yrkene prosjektet trenger.", "sv": "Lägg till alla yrken som behövs i projektet.", "da": "Tilføj alle fag, projektet har brug for."},
  "Advantage": {"de": "Von Vorteil", "nl": "Een pluspunt", "no": "En fordel", "sv": "Meriterande", "da": "En fordel"},
  "Agreement is being prepared": {"de": "Vertrag wird vorbereitet", "nl": "Overeenkomst wordt voorbereid", "no": "Avtalen klargjøres", "sv": "Avtalet förbereds", "da": "Aftalen forberedes"},
  "Agreement link is not available.": {"de": "Der Vertragslink ist nicht verfügbar.", "nl": "De overeenkomstlink is niet beschikbaar.", "no": "Lenken til avtalen er ikke tilgjengelig.", "sv": "Länken till avtalet är inte tillgänglig.", "da": "Linket til aftalen er ikke tilgængeligt."},
  "Basis": {"de": "Grundlage", "nl": "Grondslag", "no": "Grunnlag", "sv": "Grund", "da": "Grundlag"},
  "CONTRACT DURATION *": {"de": "VERTRAGSDAUER *", "nl": "CONTRACTDUUR *", "no": "KONTRAKTVARIGHET *", "sv": "AVTALSTID *", "da": "KONTRAKTVARIGHED *"},
  "Candidate CV is not available.": {"de": "Der Lebenslauf ist nicht verfügbar.", "nl": "Het cv is niet beschikbaar.", "no": "Kandidatens CV er ikke tilgjengelig.", "sv": "Kandidatens CV är inte tillgängligt.", "da": "Kandidatens CV er ikke tilgængeligt."},
  "Candidate approved. Statybos24 will coordinate the next step.": {"de": "Kandidat bestätigt. Statybos24 koordiniert den nächsten Schritt.", "nl": "Kandidaat goedgekeurd. Statybos24 regelt de volgende stap.", "no": "Kandidaten er godkjent. Statybos24 koordinerer neste steg.", "sv": "Kandidaten har godkänts. Statybos24 samordnar nästa steg.", "da": "Kandidaten er godkendt. Statybos24 koordinerer næste skridt."},
  "Candidates assigned by Statybos24 to this need will appear here.": {"de": "Hier erscheinen die von Statybos24 zugewiesenen Kandidaten.", "nl": "Hier verschijnen kandidaten die Statybos24 aan deze aanvraag koppelt.", "no": "Her vises kandidater som Statybos24 knytter til behovet.", "sv": "Här visas kandidater som Statybos24 kopplar till behovet.", "da": "Her vises kandidater, som Statybos24 knytter til behovet."},
  "Certificates, tools, shifts, safety requirements or other important information...": {"de": "Zertifikate, Werkzeuge, Schichten, Sicherheitsanforderungen oder weitere Informationen...", "nl": "Certificaten, gereedschap, diensten, veiligheidseisen of andere informatie...", "no": "Sertifikater, verktøy, skift, sikkerhetskrav eller annen viktig informasjon...", "sv": "Certifikat, verktyg, skift, säkerhetskrav eller annan viktig information...", "da": "Certifikater, værktøj, skift, sikkerhedskrav eller andre vigtige oplysninger..."},
  "Choose employment contract PDF / DOCX": {"de": "Arbeitsvertrag als PDF / DOCX auswählen", "nl": "Arbeidsovereenkomst PDF / DOCX kiezen", "no": "Velg arbeidsavtale som PDF / DOCX", "sv": "Välj anställningsavtal som PDF / DOCX", "da": "Vælg ansættelseskontrakt som PDF / DOCX"},
  "Complete profession and worker count for every role.": {"de": "Geben Sie Beruf und Mitarbeiterzahl für jede Position an.", "nl": "Vul voor elke functie het beroep en aantal werknemers in.", "no": "Fyll inn yrke og antall arbeidere for hver stilling.", "sv": "Ange yrke och antal arbetare för varje roll.", "da": "Angiv fag og antal medarbejdere for hver stilling."},
  "Could not download invoice.": {"de": "Rechnung konnte nicht heruntergeladen werden.", "nl": "Kan de factuur niet downloaden.", "no": "Kunne ikke laste ned fakturaen.", "sv": "Kunde inte ladda ner fakturan.", "da": "Kunne ikke downloade fakturaen."},
  "Could not download the signed agreement.": {"de": "Unterzeichneter Vertrag konnte nicht heruntergeladen werden.", "nl": "Ondertekende overeenkomst kon niet worden gedownload.", "no": "Kunne ikke laste ned den signerte avtalen.", "sv": "Kunde inte ladda ner det undertecknade avtalet.", "da": "Kunne ikke downloade den underskrevne aftale."},
  "Could not load the employer portal.": {"de": "Arbeitgeberportal konnte nicht geladen werden.", "nl": "Werkgeversportaal kon niet worden geladen.", "no": "Kunne ikke laste inn arbeidsgiverportalen.", "sv": "Kunde inte läsa in arbetsgivarportalen.", "da": "Kunne ikke indlæse arbejdsgiverportalen."},
  "Could not open candidate CV.": {"de": "Lebenslauf konnte nicht geöffnet werden.", "nl": "Cv kon niet worden geopend.", "no": "Kunne ikke åpne kandidatens CV.", "sv": "Kunde inte öppna kandidatens CV.", "da": "Kunne ikke åbne kandidatens CV."},
  "Could not open the agreement.": {"de": "Vertrag konnte nicht geöffnet werden.", "nl": "Overeenkomst kon niet worden geopend.", "no": "Kunne ikke åpne avtalen.", "sv": "Kunde inte öppna avtalet.", "da": "Kunne ikke åbne aftalen."},
  "Could not save your candidate decision.": {"de": "Entscheidung konnte nicht gespeichert werden.", "nl": "Beslissing over kandidaat kon niet worden opgeslagen.", "no": "Kunne ikke lagre beslutningen om kandidaten.", "sv": "Kunde inte spara beslutet om kandidaten.", "da": "Kunne ikke gemme beslutningen om kandidaten."},
  "Could not submit the workforce need.": {"de": "Personalbedarf konnte nicht übermittelt werden.", "nl": "Personeelsbehoefte kon niet worden ingediend.", "no": "Kunne ikke sende inn bemanningsbehovet.", "sv": "Kunde inte skicka in personalbehovet.", "da": "Kunne ikke indsende personalebehovet."},
  "Could not update password.": {"de": "Passwort konnte nicht geändert werden.", "nl": "Wachtwoord kon niet worden gewijzigd.", "no": "Kunne ikke oppdatere passordet.", "sv": "Kunde inte uppdatera lösenordet.", "da": "Kunne ikke opdatere adgangskoden."},
  "Could not upload the signed agreement.": {"de": "Unterzeichneter Vertrag konnte nicht hochgeladen werden.", "nl": "Ondertekende overeenkomst kon niet worden geüpload.", "no": "Kunne ikke laste opp den signerte avtalen.", "sv": "Kunde inte ladda upp det undertecknade avtalet.", "da": "Kunne ikke uploade den underskrevne aftale."},
  "Decrease workers": {"de": "Mitarbeiterzahl verringern", "nl": "Aantal werknemers verlagen", "no": "Reduser antall arbeidere", "sv": "Minska antalet arbetare", "da": "Reducer antal medarbejdere"},
  "Describe the employment arrangement and contract duration. Mark whether overtime is offered.": {"de": "Beschreiben Sie die Beschäftigung und Vertragsdauer sowie mögliche Überstunden.", "nl": "Beschrijf de arbeidsvoorwaarden, contractduur en overwerk.", "no": "Beskriv ansettelsesforholdet, kontraktens varighet og eventuell overtid.", "sv": "Beskriv anställningen, avtalstiden och eventuell övertid.", "da": "Beskriv ansættelsesforholdet, kontraktens varighed og eventuelt overarbejde."},
  "Drywall installation, framing, ceilings, finishing...": {"de": "Trockenbau, Ständerwände, Decken, Ausbau...", "nl": "Gipsplaten plaatsen, regelwerk, plafonds, afwerking...", "no": "Gipsmontering, stenderverk, himlinger, overflatearbeid...", "sv": "Gipsmontage, regelverk, tak, ytbehandling...", "da": "Gipsmontering, skeletkonstruktioner, lofter, finish..."},
  "EMPLOYMENT TYPE *": {"de": "BESCHÄFTIGUNGSART *", "nl": "TYPE DIENSTVERBAND *", "no": "ANSETTELSESFORM *", "sv": "ANSTÄLLNINGSFORM *", "da": "ANSÆTTELSESFORM *"},
  "Employee pays / contributes": {"de": "Arbeitnehmer zahlt / beteiligt sich", "nl": "Werknemer betaalt / draagt bij", "no": "Arbeidstaker betaler / bidrar", "sv": "Arbetstagaren betalar / bidrar", "da": "Medarbejderen betaler / bidrager"},
  "Employer provides": {"de": "Arbeitgeber stellt Unterkunft", "nl": "Werkgever zorgt voor huisvesting", "no": "Arbeidsgiver tilbyr bolig", "sv": "Arbetsgivaren tillhandahåller boende", "da": "Arbejdsgiveren stiller bolig til rådighed"},
  "Employment contract": {"de": "Arbeitsvertrag", "nl": "Arbeidsovereenkomst", "no": "Arbeidsavtale", "sv": "Anställningsavtal", "da": "Ansættelseskontrakt"},
  "Employment contract for review": {"de": "Arbeitsvertrag zur Einsicht", "nl": "Arbeidsovereenkomst ter inzage", "no": "Arbeidsavtale for gjennomgang", "sv": "Anställningsavtal för granskning", "da": "Ansættelseskontrakt til gennemgang"},
  "Employment contract must be a PDF or DOCX smaller than 15 MB.": {"de": "Der Arbeitsvertrag muss ein PDF oder DOCX unter 15 MB sein.", "nl": "De arbeidsovereenkomst moet een PDF of DOCX kleiner dan 15 MB zijn.", "no": "Arbeidsavtalen må være PDF eller DOCX under 15 MB.", "sv": "Anställningsavtalet måste vara PDF eller DOCX under 15 MB.", "da": "Ansættelseskontrakten skal være PDF eller DOCX under 15 MB."},
  "Enter a job title.": {"de": "Geben Sie die Stellenbezeichnung ein.", "nl": "Vul een functietitel in.", "no": "Skriv inn stillingstittel.", "sv": "Ange en jobbtitel.", "da": "Angiv en stillingsbetegnelse."},
  "Enter how overtime is paid.": {"de": "Geben Sie die Überstundenvergütung an.", "nl": "Geef aan hoe overwerk wordt betaald.", "no": "Oppgi hvordan overtid betales.", "sv": "Ange hur övertid ersätts.", "da": "Angiv hvordan overarbejde betales."},
  "Enter project country, address, start date and the date workers must be ready by.": {"de": "Geben Sie Projektland, Adresse, Startdatum und Bereitstellungsdatum an.", "nl": "Vul projectland, adres, startdatum en uiterste beschikbaarheidsdatum in.", "no": "Oppgi prosjektland, adresse, startdato og frist for når arbeiderne må være klare.", "sv": "Ange projektland, adress, startdatum och senaste datum då arbetarna behövs.", "da": "Angiv projektland, adresse, startdato og frist for, hvornår medarbejderne skal være klar."},
  "Enter the contract duration.": {"de": "Geben Sie die Vertragsdauer ein.", "nl": "Vul de contractduur in.", "no": "Oppgi kontraktens varighet.", "sv": "Ange avtalets längd.", "da": "Angiv kontraktens varighed."},
  "Enter the employment type.": {"de": "Geben Sie die Beschäftigungsart ein.", "nl": "Vul het type dienstverband in.", "no": "Oppgi ansettelsesform.", "sv": "Ange anställningsform.", "da": "Angiv ansættelsesform."},
  "Enter the offered salary.": {"de": "Geben Sie das angebotene Gehalt ein.", "nl": "Vul het aangeboden salaris in.", "no": "Oppgi tilbudt lønn.", "sv": "Ange erbjuden lön.", "da": "Angiv den tilbudte løn."},
  "Enter the salary currency and payment frequency.": {"de": "Geben Sie Währung und Auszahlungshäufigkeit an.", "nl": "Vul valuta en betaalfrequentie in.", "no": "Oppgi valuta og hvor ofte lønnen betales.", "sv": "Ange valuta och hur ofta lönen betalas ut.", "da": "Angiv valuta og hvor ofte lønnen udbetales."},
  "Give the job a clear title and specify exactly where and when the work starts.": {"de": "Geben Sie einen klaren Titel und den genauen Arbeitsort und Beginn an.", "nl": "Geef een duidelijke titel en de precieze werklocatie en startdatum op.", "no": "Gi stillingen en tydelig tittel og oppgi nøyaktig hvor og når arbeidet starter.", "sv": "Ge jobbet en tydlig titel och ange exakt var och när arbetet börjar.", "da": "Giv jobbet en tydelig titel og angiv præcist, hvor og hvornår arbejdet starter."},
  "HOME TRAVEL": {"de": "HEIMREISEN", "nl": "THUISREIZEN", "no": "HJEMREISER", "sv": "HEMRESOR", "da": "HJEMREJSER"},
  "Increase workers": {"de": "Mitarbeiterzahl erhöhen", "nl": "Aantal werknemers verhogen", "no": "Øk antall arbeidere", "sv": "Öka antalet arbetare", "da": "Øg antal medarbejdere"},
  "Interview requested. Statybos24 will coordinate the next step.": {"de": "Interview angefragt. Statybos24 koordiniert den nächsten Schritt.", "nl": "Interview aangevraagd. Statybos24 regelt de volgende stap.", "no": "Intervju forespurt. Statybos24 koordinerer neste steg.", "sv": "Intervju har begärts. Statybos24 samordnar nästa steg.", "da": "Der er anmodet om interview. Statybos24 koordinerer næste skridt."},
  "JOB TITLE *": {"de": "STELLENBEZEICHNUNG *", "nl": "FUNCTIETITEL *", "no": "STILLINGSTITTEL *", "sv": "JOBBTITEL *", "da": "STILLINGSBETEGNELSE *"},
  "Mark the accommodation and home-travel arrangement and describe vacation conditions.": {"de": "Geben Sie Unterkunft, Heimreisen und Urlaubsbedingungen an.", "nl": "Geef huisvesting, thuisreizen en vakantievoorwaarden aan.", "no": "Oppgi bolig, hjemreiser og ferievilkår.", "sv": "Ange boende, hemresor och semestervillkor.", "da": "Angiv bolig, hjemrejser og ferieforhold."},
  "New candidate update": {"de": "Neues Kandidatenupdate", "nl": "Nieuwe kandidaatupdate", "no": "Ny oppdatering om kandidat", "sv": "Ny kandidatuppdatering", "da": "Ny kandidatopdatering"},
  "New update": {"de": "Neue Aktualisierung", "nl": "Nieuwe update", "no": "Ny oppdatering", "sv": "Ny uppdatering", "da": "Ny opdatering"},
  "No file selected": {"de": "Keine Datei ausgewählt", "nl": "Geen bestand geselecteerd", "no": "Ingen fil valgt", "sv": "Ingen fil vald", "da": "Ingen fil valgt"},
  "No overtime": {"de": "Keine Überstunden", "nl": "Geen overwerk", "no": "Ingen overtid", "sv": "Ingen övertid", "da": "Intet overarbejde"},
  "Not paid by employer": {"de": "Nicht vom Arbeitgeber bezahlt", "nl": "Niet betaald door werkgever", "no": "Betales ikke av arbeidsgiver", "sv": "Betalas inte av arbetsgivaren", "da": "Betales ikke af arbejdsgiveren"},
  "Number of workers": {"de": "Anzahl Mitarbeiter", "nl": "Aantal werknemers", "no": "Antall arbeidere", "sv": "Antal arbetare", "da": "Antal medarbejdere"},
  "OVERTIME PAY *": {"de": "ÜBERSTUNDENVERGÜTUNG *", "nl": "OVERWERKVERGOEDING *", "no": "OVERTIDSBETALING *", "sv": "ÖVERTIDSERSÄTTNING *", "da": "OVERARBEJDSBETALING *"},
  "Optional: upload a sample employment contract so Statybos24 can review the terms together with the workforce need.": {"de": "Optional: Laden Sie einen Muster-Arbeitsvertrag hoch, damit Statybos24 die Bedingungen prüfen kann.", "nl": "Optioneel: upload een voorbeeldcontract zodat Statybos24 de voorwaarden kan beoordelen.", "no": "Valgfritt: last opp en eksempelarbeidsavtale så Statybos24 kan gjennomgå vilkårene.", "sv": "Valfritt: ladda upp ett exempelavtal så att Statybos24 kan granska villkoren.", "da": "Valgfrit: upload en eksempelkontrakt, så Statybos24 kan gennemgå vilkårene."},
  "Overtime": {"de": "Überstunden", "nl": "Overwerk", "no": "Overtid", "sv": "Övertid", "da": "Overarbejde"},
  "Overtime available": {"de": "Überstunden möglich", "nl": "Overwerk mogelijk", "no": "Overtid mulig", "sv": "Övertid förekommer", "da": "Overarbejde muligt"},
  "Overtime pay": {"de": "Überstundenvergütung", "nl": "Overwerkvergoeding", "no": "Overtidsbetaling", "sv": "Övertidsersättning", "da": "Overarbejdsbetaling"},
  "PAYMENT FREQUENCY *": {"de": "ZAHLUNGSHÄUFIGKEIT *", "nl": "BETAALFREQUENTIE *", "no": "UTBETALINGSFREKVENS *", "sv": "UTBETALNINGSFREKVENS *", "da": "UDBETALINGSFREKVENS *"},
  "PROJECT ADDRESS *": {"de": "PROJEKTADRESSE *", "nl": "PROJECTADRES *", "no": "PROSJEKTADRESSE *", "sv": "PROJEKTADRESS *", "da": "PROJEKTADRESSE *"},
  "Paid by employer": {"de": "Vom Arbeitgeber bezahlt", "nl": "Betaald door werkgever", "no": "Betales av arbeidsgiver", "sv": "Betalas av arbetsgivaren", "da": "Betales af arbejdsgiveren"},
  "Password updated.": {"de": "Passwort aktualisiert.", "nl": "Wachtwoord gewijzigd.", "no": "Passordet er oppdatert.", "sv": "Lösenordet har uppdaterats.", "da": "Adgangskoden er opdateret."},
  "Passwords do not match.": {"de": "Passwörter stimmen nicht überein.", "nl": "Wachtwoorden komen niet overeen.", "no": "Passordene er ikke like.", "sv": "Lösenorden matchar inte.", "da": "Adgangskoderne er ikke ens."},
  "Payment frequency": {"de": "Zahlungshäufigkeit", "nl": "Betaalfrequentie", "no": "Utbetalingshyppighet", "sv": "Utbetalningsfrekvens", "da": "Udbetalingshyppighed"},
  "Profession / trade": {"de": "Beruf / Gewerbe", "nl": "Beroep / vak", "no": "Yrke / fag", "sv": "Yrke / fack", "da": "Fag / erhverv"},
  "SALARY AMOUNT *": {"de": "GEHALTSBETRAG *", "nl": "SALARISBEDRAG *", "no": "LØNNSBELØP *", "sv": "LÖNEBELOPP *", "da": "LØNBELØB *"},
  "Select the accommodation arrangement.": {"de": "Wählen Sie die Unterkunftsregelung aus.", "nl": "Kies de huisvestingsregeling.", "no": "Velg boligordning.", "sv": "Välj boendealternativ.", "da": "Vælg boligordning."},
  "Signed agreement uploaded. Statybos24 will review it.": {"de": "Unterzeichneter Vertrag hochgeladen. Statybos24 prüft ihn.", "nl": "Ondertekende overeenkomst geüpload. Statybos24 controleert deze.", "no": "Signert avtale er lastet opp. Statybos24 vil gjennomgå den.", "sv": "Undertecknat avtal uppladdat. Statybos24 granskar det.", "da": "Underskrevet aftale uploadet. Statybos24 gennemgår den."},
  "Single / shared room": {"de": "Einzel- / Mehrbettzimmer", "nl": "Eenpersoons- / gedeelde kamer", "no": "Enkeltrom / delt rom", "sv": "Enkelrum / delat rum", "da": "Enkeltværelse / delt værelse"},
  "State one clear salary amount and how often it is paid.": {"de": "Nennen Sie einen konkreten Gehaltsbetrag und die Auszahlungshäufigkeit.", "nl": "Vul één duidelijk salarisbedrag in en hoe vaak het wordt betaald.", "no": "Oppgi ett tydelig lønnsbeløp og hvor ofte det utbetales.", "sv": "Ange ett tydligt lönebelopp och hur ofta det betalas ut.", "da": "Angiv ét klart lønbeløb og hvor ofte det udbetales."},
  "Statybos24 will place the company agreement here.": {"de": "Statybos24 stellt den Unternehmensvertrag hier bereit.", "nl": "Statybos24 plaatst hier de bedrijfsovereenkomst.", "no": "Statybos24 legger firmaavtalen her.", "sv": "Statybos24 lägger företagets avtal här.", "da": "Statybos24 placerer virksomhedsaftalen her."},
  "Street, city": {"de": "Straße, Stadt", "nl": "Straat, stad", "no": "Gate, by", "sv": "Gata, ort", "da": "Gade, by"},
  "The password sent by Statybos24 is temporary. Set a private password before using the employer portal.": {"de": "Das zugesandte Passwort ist vorläufig. Legen Sie ein eigenes Passwort fest.", "nl": "Het ontvangen wachtwoord is tijdelijk. Stel een eigen wachtwoord in.", "no": "Passordet fra Statybos24 er midlertidig. Lag et eget passord før du bruker portalen.", "sv": "Lösenordet från Statybos24 är tillfälligt. Ange ett eget lösenord innan du använder portalen.", "da": "Adgangskoden fra Statybos24 er midlertidig. Opret en personlig adgangskode før brug."},
  "The workforce need was submitted, but the employment contract could not be uploaded. You can send it to Statybos24 by email.": {"de": "Bedarf übermittelt, aber der Arbeitsvertrag konnte nicht hochgeladen werden. Senden Sie ihn per E-Mail.", "nl": "Aanvraag ingediend, maar het contract kon niet worden geüpload. Stuur het per e-mail.", "no": "Behovet ble sendt inn, men arbeidsavtalen kunne ikke lastes opp. Send den på e-post.", "sv": "Behovet skickades in, men avtalet kunde inte laddas upp. Skicka det via e-post.", "da": "Behovet blev indsendt, men kontrakten kunne ikke uploades. Send den via e-mail."},
  "Use at least 12 characters with uppercase, lowercase and a number.": {"de": "Mindestens 12 Zeichen mit Groß- und Kleinbuchstaben sowie einer Zahl.", "nl": "Gebruik minimaal 12 tekens met hoofdletters, kleine letters en een cijfer.", "no": "Bruk minst 12 tegn med store og små bokstaver og et tall.", "sv": "Använd minst 12 tecken med stora och små bokstäver samt en siffra.", "da": "Brug mindst 12 tegn med store og små bogstaver samt et tal."},
  "VACATION": {"de": "URLAUB", "nl": "VAKANTIE", "no": "FERIE", "sv": "SEMESTER", "da": "FERIE"},
  "VACATION PAY": {"de": "URLAUBSVERGÜTUNG", "nl": "VAKANTIEGELD", "no": "FERIEPENGER", "sv": "SEMESTERERSÄTTNING", "da": "FERIEPENGE"},
  "Vacation": {"de": "Urlaub", "nl": "Vakantie", "no": "Ferie", "sv": "Semester", "da": "Ferie"},
  "Vacation pay": {"de": "Urlaubsvergütung", "nl": "Vakantiegeld", "no": "Feriepenger", "sv": "Semesterersättning", "da": "Feriepenge"},
  "WORKERS REQUIRED BY *": {"de": "MITARBEITER BENÖTIGT BIS *", "nl": "WERKNEMERS NODIG VÓÓR *", "no": "ARBEIDERE MÅ VÆRE KLARE INNEN *", "sv": "ARBETARE BEHÖVS SENAST *", "da": "MEDARBEJDERE SKAL VÆRE KLAR SENEST *"},
  "Workforce need submitted to Statybos24.": {"de": "Personalbedarf an Statybos24 übermittelt.", "nl": "Personeelsbehoefte ingediend bij Statybos24.", "no": "Bemanningsbehovet er sendt til Statybos24.", "sv": "Personalbehovet har skickats till Statybos24.", "da": "Personalebehovet er sendt til Statybos24."},
  "Your portal session is not available.": {"de": "Ihre Portalsitzung ist nicht verfügbar.", "nl": "Uw portaalsessie is niet beschikbaar.", "no": "Portaløkten er ikke tilgjengelig.", "sv": "Din portalsession är inte tillgänglig.", "da": "Din portalsession er ikke tilgængelig."},
  "amount per month": {"de": "Betrag pro Monat", "nl": "Bedrag per maand", "no": "Beløp per måned", "sv": "Belopp per månad", "da": "Beløb pr. måned"},
  "e.g. 12 months / permanent": {"de": "z. B. 12 Monate / unbefristet", "nl": "bijv. 12 maanden / vast", "no": "f.eks. 12 måneder / fast", "sv": "t.ex. 12 månader / tillsvidare", "da": "f.eks. 12 måneder / fast"},
  "e.g. 125% hourly rate / +5 EUR per hour": {"de": "z. B. 125 % Stundenlohn / +5 EUR pro Stunde", "nl": "bijv. 125% uurloon / +5 EUR per uur", "no": "f.eks. 125 % timelønn / +5 EUR per time", "sv": "t.ex. 125 % timlön / +5 EUR per timme", "da": "f.eks. 125 % timeløn / +5 EUR i timen"},
  "e.g. 24 working days per year": {"de": "z. B. 24 Arbeitstage pro Jahr", "nl": "bijv. 24 werkdagen per jaar", "no": "f.eks. 24 arbeidsdager i året", "sv": "t.ex. 24 arbetsdagar per år", "da": "f.eks. 24 arbejdsdage om året"},
  "e.g. 3+ years": {"de": "z. B. über 3 Jahre", "nl": "bijv. 3+ jaar", "no": "f.eks. 3+ år", "sv": "t.ex. 3+ år", "da": "f.eks. 3+ år"},
  "e.g. Drywall installer": {"de": "z. B. Trockenbauer", "nl": "bijv. gipsplaatmonteur", "no": "f.eks. gipsmontør", "sv": "t.ex. gipsmontör", "da": "f.eks. gipsmontør"},
  "e.g. English B1": {"de": "z. B. Englisch B1", "nl": "bijv. Engels B1", "no": "f.eks. engelsk B1", "sv": "t.ex. engelska B1", "da": "f.eks. engelsk B1"},
  "e.g. direct employment under German contract": {"de": "z. B. direkte Anstellung mit deutschem Vertrag", "nl": "bijv. direct dienstverband met Duits contract", "no": "f.eks. direkte ansettelse med tysk kontrakt", "sv": "t.ex. direktanställning med tyskt avtal", "da": "f.eks. direkte ansættelse med tysk kontrakt"},
  "e.g. every week / every 2 weeks / monthly": {"de": "z. B. wöchentlich / alle 2 Wochen / monatlich", "nl": "bijv. wekelijks / elke 2 weken / maandelijks", "no": "f.eks. hver uke / annenhver uke / månedlig", "sv": "t.ex. varje vecka / varannan vecka / månadsvis", "da": "f.eks. hver uge / hver anden uge / månedligt"},
  "e.g. paid according to employment contract": {"de": "z. B. gemäß Arbeitsvertrag bezahlt", "nl": "bijv. betaald volgens arbeidsovereenkomst", "no": "f.eks. betalt etter arbeidsavtalen", "sv": "t.ex. betalt enligt anställningsavtalet", "da": "f.eks. betalt i henhold til ansættelseskontrakten"},
  "start": {"de": "Beginn", "nl": "begin", "no": "start", "sv": "start", "da": "start"},
};
