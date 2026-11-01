import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { AppBootLoader } from "../ui/AppBootLoader.jsx";
import { Svg } from "../p24/Shell.jsx";
import { NoticeToast, P24Modal } from "../p24/ui.jsx";
import { HIRE_COUNTRIES, HIRE_LANGUAGES, HIRE_OPTION_LABELS, HIRE_PROFESSIONS, HIRE_PROFESSION_LABELS } from "./hireShared.jsx";
import "../p24/p24.css";
import "../p24/hire.css";
import { HIRE_EMPLOYER_PORTAL_I18N, detectHirePortalLanguage, getForeignHirePortalToken, persistHirePortalLanguage, setForeignHirePortalToken } from "./hirePortalShared.jsx";

export function HireEmployerPortalPage() {
  const [lang, setLang] = useState(detectHirePortalLanguage);
  const tr = (en, lt) => {
    if (lang === "lt") return lt;
    if (lang === "en") return en;
    return HIRE_EMPLOYER_PORTAL_I18N[en]?.[lang] || en;
  };
  const changeLanguage = (code) => {
    persistHirePortalLanguage(code);
    setLang(code);
  };

  useEffect(() => {
    const previousTitle = document.title;
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.getAttribute("content") ?? null;
    const robots = existing || document.createElement("meta");
    if (!existing) { robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", "noindex,nofollow,noarchive");
    document.title = tr("Employer portal | Statybos24", "Darbdavio portalas | Statybos24");
    document.documentElement.lang = lang;
    return () => {
      document.title = previousTitle;
      if (existing) {
        if (previous === null) existing.removeAttribute("content");
        else existing.setAttribute("content", previous);
      } else robots.remove();
    };
  }, [lang]);

  const blankRole = () => ({ profession:"", count:1, experience:"", skills:"", language:"", languageLevel:"", drivingLicense:"not_required" });
  const blankNeed = () => ({
    needTitle:"",
    projectCountry:"",
    projectLocation:"",
    startDate:"",
    neededBy:"",
    employmentType:"",
    duration:"",
    weeklyHours:"",
    overtimeAllowed:"no",
    overtimePay:"",
    salaryCurrency:"EUR",
    salaryAmount:"",
    salaryBasis:"gross",
    salaryPayFrequency:"",
    accommodation:"provided",
    roomType:"",
    accommodationCost:"",
    homeTravelPaid:"yes",
    vacationTerms:"",
    vacationPay:"",
    additionalInfo:"",
    roles:[blankRole()],
  });

  const [token] = useState(() => getForeignHirePortalToken());
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedFile, setSignedFile] = useState(null);
  const [employmentContractFile, setEmploymentContractFile] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [candidateBusyId, setCandidateBusyId] = useState(null);
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [screen, setScreen] = useState("dashboard");
  const [selectedNeedId, setSelectedNeedId] = useState(null);
  const [needInfoOpen, setNeedInfoOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  // Per-candidate news receipts survive reloads on this browser.
  const [hireSeenNews, setHireSeenNews] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("statybos24:hire:seen-candidate-news:v1") || "{}"); }
    catch { return {}; }
  });
  const [rejectCandidateId, setRejectCandidateId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [needForm, setNeedForm] = useState(blankNeed);

  const needs = Array.isArray(portal?.needs) ? portal.needs : [];
  const selectedNeed = needs.find((need) => need.id === selectedNeedId) || null;
  const activeCandidate = selectedCandidate
    ? (needs.find((need) => need.id === selectedCandidate.needId)?.candidates || []).find((candidate) => candidate.id === selectedCandidate.candidateId) || null
    : null;
  const agreementDone = ["signed_uploaded", "approved"].includes(portal?.agreement?.status);
  const portalContactName = portal?.request?.contactName || "";
  // Use the workforce need and candidate IDs; never store email addresses in localStorage.
  const candidateNewsKey = (need, candidate) => `${need.id}:${candidate.id}`;
  const candidateNewsVersion = (candidate) => candidate.contactEmail
    ? "contact-shared" : "";
  const candidateHasNews = (need, candidate) => {
    const version = candidateNewsVersion(candidate);
    return Boolean(version && hireSeenNews[candidateNewsKey(need, candidate)] !== version);
  };
  const needHasNews = (need) => (need.candidates || []).some((candidate) => candidateHasNews(need, candidate));
  function reviewCandidate(need, candidate) {
    setSelectedCandidate({ needId:need.id, candidateId:candidate.id });
    const version = candidateNewsVersion(candidate);
    if (version) setHireSeenNews((current) => {
      const updated = { ...current, [candidateNewsKey(need, candidate)]: version };
      try { window.localStorage.setItem("statybos24:hire:seen-candidate-news:v1", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function needStatusLabel(status) {
    return ({
      new:tr("New", "Naujas"),
      under_review:tr("Under review", "Peržiūrima"),
      access_preparing:tr("Preparing", "Ruošiama"),
      waiting_employer:tr("Waiting for employer", "Laukiama darbdavio"),
      employer_submitted:tr("Submitted", "Pateikta"),
      ready_for_sourcing:tr("Approved", "Patvirtinta"),
      sourcing:tr("Sourcing", "Vyksta paieška"),
      declined:tr("Declined", "Atmesta"),
      closed:tr("Completed", "Užbaigta"),
    })[status] || tr("Submitted", "Pateikta");
  }

  function candidateResponseLabel(response, contactShared = false) {
    if (response === "interview_requested" && contactShared) {
      return tr("Interview contact provided", "Interviu kontaktas pateiktas");
    }
    return ({
      interview_requested:tr("Interview requested", "Paprašytas interviu"),
      accepted:tr("Candidate approved", "Kandidatas patvirtintas"),
      not_suitable:tr("Not suitable", "Netinka"),
    })[response] || tr("Awaiting decision", "Laukiama sprendimo");
  }

  function employmentTypeLabel(value) {
    return value || "—";
  }

  function salaryBasisLabel(value) {
    return ({ gross:tr("Gross", "Bruto"), net:tr("Net", "Neto") })[value] || value || "—";
  }

  function accommodationLabel(value) {
    return ({ provided:tr("Employer provides", "Suteikia darbdavys"), not_provided:tr("Not provided", "Nesuteikiama"), employee_contributes:tr("Employee pays / contributes", "Moka / prisideda darbuotojas"), yes:tr("Employer provides", "Suteikia darbdavys"), no:tr("Not provided", "Nesuteikiama"), shared_cost:tr("Employee pays / contributes", "Moka / prisideda darbuotojas") })[value] || value || "—";
  }

  function drivingLabel(value) {
    return ({ required:tr("Required", "Privalomas"), advantage:tr("Advantage", "Privalumas"), preferred:tr("Advantage", "Privalumas"), not_required:tr("Not required", "Nereikalingas") })[value] || value || "—";
  }

  function totalWorkers(need) {
    const roles = need?.workforceDetails?.roles;
    if (!Array.isArray(roles)) return 0;
    return roles.reduce((sum, role) => sum + Math.max(0, Number(role?.count || 0)), 0);
  }

  // A need is filled only after the employer has approved enough distinct candidates.
  function needIsFullyStaffed(need) {
    const requested = totalWorkers(need);
    if (requested < 1) return false;
    const candidates = Array.isArray(need?.candidates) ? need.candidates : [];
    const acceptedIds = new Set(candidates.filter((candidate) =>
      candidate?.employerResponse === "accepted" || candidate?.employer_response === "accepted"
    ).map((candidate) => candidate.id).filter(Boolean));
    return acceptedIds.size >= requested;
  }

  const staffingFinishedText = ({
    en:"Workers recruited and approved. A representative will contact you.",
    lt:"Darbuotojai surinkti ir patvirtinti. Su jumis susisieks atsakingas darbuotojas.",
    de:"Mitarbeiter gefunden und bestätigt. Ein zuständiger Mitarbeiter wird sich mit Ihnen in Verbindung setzen.",
    nl:"De werknemers zijn gevonden en goedgekeurd. Een medewerker neemt contact met u op.",
    no:"Arbeiderne er funnet og godkjent. En ansvarlig medarbeider vil kontakte dere.",
    sv:"Arbetarna har hittats och godkänts. En ansvarig medarbetare kontaktar er.",
    da:"Medarbejderne er fundet og godkendt. En ansvarlig medarbejder kontakter jer."
  })[lang] || "Workers recruited and approved. A representative will contact you.";
  const staffingFinishedLabel = ({
    en:"Workers approved",lt:"Darbuotojai patvirtinti",de:"Mitarbeiter bestätigt",nl:"Werknemers goedgekeurd",no:"Arbeidere godkjent",sv:"Arbetare godkända",da:"Medarbejdere godkendt"
  })[lang] || "Workers approved";

  async function loadPortal(showLoader=true) {
    if (!supabase || !token) {
      setLoading(false);
      setError(tr("Your portal session is not available.", "Jūsų portalo sesija nepasiekiama."));
      return;
    }
    if (showLoader) setLoading(true);
    try {
      const { data, error } = await supabase.rpc("foreign_employer_portal_data", { p_session_token: token });
      if (error) throw error;
      setPortal(data);
      setError("");
      setLoading(false);
      try {
        const invoices = await supabase.functions.invoke("foreign-hire-portal-files", { body: { action:"invoice-list", token } });
        setAvailableInvoices(invoices.error ? [] : (invoices.data?.requestIds || []));
      } catch { setAvailableInvoices([]); }
      setError("");
    } catch (err) {
      setError(err?.message || tr("Could not load the employer portal.", "Nepavyko įkelti darbdavio portalo."));
      if (/(session|sesij)/i.test(err?.message || "")) setForeignHirePortalToken("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPortal(); }, []);

  async function logout() {
    if (supabase && token) {
      try { await supabase.rpc("foreign_employer_logout", { p_session_token: token }); } catch {}
    }
    setForeignHirePortalToken("");
    // End a Supabase Auth test login too; normal company-ID users are unaffected.
    if (supabase) {
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    }
    window.location.assign("/hire/login");
  }

  async function changePassword() {
    setError(""); setNotice("");
    if (password1.length < 12 || !/[A-Z]/.test(password1) || !/[a-z]/.test(password1) || !/[0-9]/.test(password1)) {
      setError(tr("Use at least 12 characters with uppercase, lowercase and a number.", "Naudokite bent 12 simbolių, didžiąją raidę, mažąją raidę ir skaičių."));
      return;
    }
    if (password1 !== password2) {
      setError(tr("Passwords do not match.", "Slaptažodžiai nesutampa."));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("foreign_employer_change_password", { p_session_token:token, p_new_password:password1 });
      if (error) throw error;
      setPassword1(""); setPassword2("");
      setNotice(tr("Password updated.", "Slaptažodis atnaujintas."));
      await loadPortal(false);
    } catch (err) {
      setError(err?.message || tr("Could not update password.", "Nepavyko atnaujinti slaptažodžio."));
    } finally { setSaving(false); }
  }

  async function openAgreement() {
    if (!supabase || !portal?.agreement) return;
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("foreign-hire-portal-files", { body:{ action:"agreement-url", token } });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || tr("Agreement link is not available.", "Sutarties nuoroda nepasiekiama."));
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.message || tr("Could not open the agreement.", "Nepavyko atidaryti sutarties."));
    }
  }

  async function downloadNeedInvoice(need) {
    if (need?.status !== "closed" || !availableInvoices.includes(need.id)) return;
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("foreign-hire-portal-files", {
        body: { action:"invoice-url", token, needId:need.id },
      });
      if (error || !data?.url) throw error || new Error(data?.error || "Invoice is not available.");
      const a=document.createElement("a"); a.href=data.url; a.download=data.name || "invoice.pdf";
      a.rel="noopener"; document.body.appendChild(a); a.click(); a.remove();
    } catch (err) { setError(err?.message || tr("Could not download invoice.", "Nepavyko atsisiųsti sąskaitos.")); }
  }

  async function downloadSignedAgreement() {
    if (!supabase || !portal?.agreement || !agreementDone) return;
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke("foreign-hire-portal-files", { body:{ action:"signed-agreement-url", token } });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || tr("Could not download the signed agreement.", "Nepavyko parsisiųsti pasirašytos sutarties."));
      const anchor = document.createElement("a");
      anchor.href = data.url;
      anchor.download = data.name || "signed-recruitment-agreement";
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      setError(err?.message || tr("Could not download the signed agreement.", "Nepavyko parsisiųsti pasirašytos sutarties."));
    }
  }

  async function uploadSignedAgreement(file = signedFile) {
    if (!supabase || !file || uploading) return;
    setError(""); setNotice(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("action", "upload-signed");
      fd.append("token", token);
      fd.append("file", file);
      const { data, error } = await supabase.functions.invoke("foreign-hire-portal-files", { body:fd });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSignedFile(null);
      setNotice(tr("Signed agreement uploaded. Statybos24 will review it.", "Pasirašyta sutartis įkelta. Statybos24 ją peržiūrės."));
      await loadPortal(false);
    } catch (err) {
      setError(err?.message || tr("Could not upload the signed agreement.", "Nepavyko įkelti pasirašytos sutarties."));
    } finally { setUploading(false); }
  }

  async function openCandidateCv(candidate) {
    if (!supabase || !candidate?.id || candidateBusyId) return;
    setError(""); setCandidateBusyId(candidate.id);
    try {
      const { data, error } = await supabase.functions.invoke("foreign-hire-portal-files", { body:{ action:"candidate-cv-url", token, candidateId:candidate.id } });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || tr("Candidate CV is not available.", "Kandidato CV nepasiekiamas."));
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err?.message || tr("Could not open candidate CV.", "Nepavyko atidaryti kandidato CV."));
    } finally { setCandidateBusyId(null); }
  }

  async function respondToCandidate(candidate, response, reason = "") {
    if (!supabase || !candidate?.id || candidateBusyId) return;
    if (response === "not_suitable" && reason.trim().length < 3) {
      setError(tr("Please tell us why the candidate is not suitable.", "Nurodykite, kodėl kandidatas netinka."));
      return;
    }
    setError(""); setNotice(""); setCandidateBusyId(candidate.id);
    try {
      const { error } = await supabase.rpc("foreign_employer_candidate_response", {
        p_session_token:token,
        p_candidate_id:candidate.id,
        p_response:response,
        p_reason:response === "not_suitable" ? reason.trim() : null,
      });
      if (error) throw error;
      const message = response === "interview_requested"
        ? tr("Interview requested. Statybos24 will coordinate the next step.", "Paprašytas interviu. Statybos24 suderins kitą žingsnį.")
        : response === "accepted"
        ? tr("Candidate approved. Statybos24 will coordinate the next step.", "Kandidatas patvirtintas. Statybos24 suderins kitą žingsnį.")
        : tr("Candidate rejected. The reason was sent to Statybos24.", "Kandidatas atmestas. Priežastis perduota Statybos24.");
      setNotice(message);
      if (response === "not_suitable") {
        setRejectCandidateId(null);
        setRejectReason("");
      }
      await loadPortal(false);
    } catch (err) {
      setError(err?.message || tr("Could not save your candidate decision.", "Nepavyko išsaugoti sprendimo dėl kandidato."));
    } finally { setCandidateBusyId(null); }
  }

  function setNeedField(key, value) {
    setNeedForm((current) => ({ ...current, [key]:value }));
  }

  function setNeedRole(index, key, value) {
    setNeedForm((current) => ({
      ...current,
      roles:current.roles.map((role, roleIndex) => roleIndex === index ? { ...role, [key]:value } : role),
    }));
  }

  function addNeedRole() {
    setNeedForm((current) => ({ ...current, roles:[...current.roles, blankRole()] }));
  }

  function removeNeedRole(index) {
    setNeedForm((current) => ({
      ...current,
      roles:current.roles.length > 1 ? current.roles.filter((_, roleIndex) => roleIndex !== index) : current.roles,
    }));
  }

  function openNewNeed() {
    setNeedForm({ ...blankNeed(), projectCountry: HIRE_COUNTRIES.includes(portal?.request?.companyCountry) ? portal.request.companyCountry : "" });
    setEmploymentContractFile(null);
    setError(""); setNotice("");
    setScreen("new");
    setSelectedNeedId(null);
    setNeedInfoOpen(false);
    setSelectedCandidate(null);
  }

  function openNeed(need) {
    setSelectedNeedId(need.id);
    setNeedInfoOpen(false);
    setSelectedCandidate(null);
    setScreen("need");
    setError("");
  }

  async function submitNeed() {
    if (!supabase || saving) return;
    setError(""); setNotice("");
    const firstInvalidRole = needForm.roles.find((role) => !role.profession.trim() || Number(role.count || 0) < 1);
    if (!needForm.needTitle.trim()) { setError(tr("Enter a job title.", "Įrašykite darbo pavadinimą.")); return; }
    if (!needForm.projectCountry.trim() || !needForm.projectLocation.trim() || !needForm.startDate || !needForm.neededBy) { setError(tr("Enter project country, address, start date and the date workers must be ready by.", "Nurodykite projekto šalį, adresą, darbo pradžią ir iki kada darbuotojai turi būti paruošti.")); return; }
    if (firstInvalidRole) { setError(tr("Complete profession and worker count for every role.", "Kiekvienai pozicijai nurodykite profesiją ir darbuotojų skaičių.")); return; }
    if (!needForm.employmentType.trim()) { setError(tr("Enter the employment type.", "Nurodykite įdarbinimo tipą.")); return; }
    if (!needForm.duration.trim()) { setError(tr("Enter the contract duration.", "Nurodykite sutarties trukmę.")); return; }
    if (!/^[1-9]\d*$/.test(String(needForm.weeklyHours).trim()) || Number(needForm.weeklyHours) > 80) { setError(tr("Enter weekly working hours (1–80).", "Nurodykite darbo valandų per savaitę skaičių (1–80).")); return; }
    if (needForm.overtimeAllowed === "yes" && !needForm.overtimePay.trim()) { setError(tr("Enter how overtime is paid.", "Nurodykite, kaip apmokami viršvalandžiai.")); return; }
    if (!String(needForm.salaryAmount).trim()) { setError(tr("Enter the offered salary.", "Nurodykite siūlomą atlyginimą.")); return; }
    if (!needForm.salaryCurrency.trim() || !needForm.salaryPayFrequency.trim()) { setError(tr("Enter the salary currency and payment frequency.", "Nurodykite atlyginimo valiutą ir kaip dažnai jis mokamas.")); return; }
    if (!needForm.accommodation) { setError(tr("Select the accommodation arrangement.", "Pažymėkite apgyvendinimo sąlygas.")); return; }
    if (employmentContractFile) {
      const lower = employmentContractFile.name.toLowerCase();
      if (!(lower.endsWith(".pdf") || lower.endsWith(".docx")) || employmentContractFile.size > 15 * 1024 * 1024) {
        setError(tr("Employment contract must be a PDF or DOCX smaller than 15 MB.", "Darbo sutartis turi būti PDF arba DOCX iki 15 MB."));
        return;
      }
    }

    setSaving(true);
    try {
      const workforceDetails = { ...needForm };
      delete workforceDetails.needTitle;
      const { data:needId, error } = await supabase.rpc("foreign_employer_submit_need", {
        p_session_token:token,
        p_need_title:needForm.needTitle.trim(),
        p_workforce_details:workforceDetails,
      });
      if (error) throw error;

      let contractWarning = "";
      if (employmentContractFile && needId) {
        try {
          const fd = new FormData();
          fd.append("action", "upload-employment-contract");
          fd.append("token", token);
          fd.append("needId", String(needId));
          fd.append("file", employmentContractFile);
          const { data:uploadData, error:uploadError } = await supabase.functions.invoke("foreign-hire-portal-files", { body:fd });
          if (uploadError) throw uploadError;
          if (uploadData?.error) throw new Error(uploadData.error);
        } catch (uploadErr) {
          contractWarning = tr("The workforce need was submitted, but the employment contract could not be uploaded. You can send it to Statybos24 by email.", "Darbuotojų poreikis pateiktas, tačiau darbo sutarties įkelti nepavyko. Ją galite atsiųsti Statybos24 el. paštu.");
        }
      }

      await loadPortal(false);
      setScreen("dashboard");
      setSelectedNeedId(null);
      setNeedForm(blankNeed());
      setEmploymentContractFile(null);
      if (contractWarning) setError(contractWarning);
      else setNotice(tr("Workforce need submitted to Statybos24.", "Darbuotojų poreikis pateiktas Statybos24."));
    } catch (err) {
      setError(err?.message || tr("Could not submit the workforce need.", "Nepavyko pateikti darbuotojų poreikio."));
    } finally { setSaving(false); }
  }

  if (loading) return <AppBootLoader label={tr("Loading employer portal...", "Kraunamas darbdavio portalas...")} />;
  if (!portal) {
    const loadErrorCopy = {
  "en": {
    "title": "Could not load your employer portal",
    "body": "Try again. If your session has expired, sign in again. Contact Statybos24 if the problem continues.",
    "contact": "Contact by email",
    "request": "Submit workforce need",
    "retry": "Try again",
    "signIn": "Sign in"
  },
  "lt": {
    "title": "Nepavyko įkelti darbdavio portalo",
    "body": "Bandykite dar kartą. Jei sesija baigėsi, prisijunkite iš naujo. Jei problema kartojasi, susisiekite su Statybos24.",
    "contact": "Susisiekti el. paštu",
    "request": "Pateikti poreikį",
    "retry": "Bandyti dar kartą",
    "signIn": "Prisijungti"
  },
  "de": {
    "title": "Ihr Arbeitgeberportal konnte nicht geladen werden",
    "body": "Versuchen Sie es erneut. Wenn Ihre Sitzung abgelaufen ist, melden Sie sich erneut an. Kontaktieren Sie Statybos24, wenn das Problem weiterhin besteht.",
    "contact": "Per E-Mail kontaktieren",
    "request": "Personalbedarf senden",
    "retry": "Erneut versuchen",
    "signIn": "Anmelden"
  },
  "nl": {
    "title": "Uw werkgeversportaal kon niet worden geladen",
    "body": "Probeer het opnieuw. Als uw sessie is verlopen, log dan opnieuw in. Neem contact op met Statybos24 als het probleem blijft bestaan.",
    "contact": "Contact via e-mail",
    "request": "Personeelsbehoefte indienen",
    "retry": "Opnieuw proberen",
    "signIn": "Inloggen"
  },
  "no": {
    "title": "Kunne ikke laste arbeidsgiverportalen",
    "body": "Prøv igjen. Logg inn på nytt hvis økten har utløpt. Kontakt Statybos24 hvis problemet fortsetter.",
    "contact": "Kontakt på e-post",
    "request": "Send bemanningsbehov",
    "retry": "Prøv igjen",
    "signIn": "Logg inn"
  },
  "sv": {
    "title": "Arbetsgivarportalen kunde inte laddas",
    "body": "Försök igen. Logga in på nytt om sessionen har gått ut. Kontakta Statybos24 om problemet kvarstår.",
    "contact": "Kontakta via e-post",
    "request": "Skicka bemanningsbehov",
    "retry": "Försök igen",
    "signIn": "Logga in"
  },
  "da": {
    "title": "Arbejdsgiverportalen kunne ikke indlæses",
    "body": "Prøv igen. Log ind igen, hvis sessionen er udløbet. Kontakt Statybos24, hvis problemet fortsætter.",
    "contact": "Kontakt via e-mail",
    "request": "Indsend bemandingsbehov",
    "retry": "Prøv igen",
    "signIn": "Log ind"
  }
};
    const copy = loadErrorCopy[lang] || loadErrorCopy.en;
    return <div className="p24 hire-p24"><div className="hp-login"><section className="hp-card">
      <div className="h-lsel"><select aria-label="Language" value={lang} onChange={(event) => changeLanguage(event.target.value)}>{HIRE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
      <img src="/brand-logo-tight.png" alt="statybos24.lt" style={{ height:26, alignSelf:"flex-start" }} />
      <span className="h-k">{tr("EMPLOYER PORTAL", "DARBDAVIO PORTALAS")}</span>
      <h2>{copy.title}</h2>
      <p className="small muted" style={{ margin:0 }}>{copy.body}</p>
      {error ? <div className="alert" role="alert"><div>{error}</div></div> : null}
      <button className="btn primary" type="button" onClick={() => loadPortal()}>{copy.retry}</button>
      <a className="btn" href={`/hire/login?lang=${encodeURIComponent(lang)}`}>{copy.signIn}</a>
      <div className="row" style={{ gap:8, flexWrap:"wrap" }}><a className="btn sm ghost" href="mailto:info@statybos24.lt">{copy.contact}</a><a className="btn sm ghost" href={`/hire?lang=${encodeURIComponent(lang)}`}>{copy.request}</a></div>
    </section></div></div>;
  }

  const wf = selectedNeed?.workforceDetails || {};
  const selectedCandidates = Array.isArray(selectedNeed?.candidates) ? selectedNeed.candidates : [];
  const companyName = portal.request?.companyName || portal.company?.name || portal.account?.loginId || "";
  const firstName = portalContactName.trim().split(/\s+/)[0] || "";
  const invoiceNeeds = needs.filter((need) => need.status === "closed" && availableInvoices.includes(need.id));
  const fmtDate = (value) => value ? new Date(value).toLocaleDateString(lang === "lt" ? "lt-LT" : "en-GB") : "—";
  const pill = (text, tone = "") => <span className={`pill${tone ? ` ${tone}` : ""}`}>{text}</span>;
  const needTone = (need) => needIsFullyStaffed(need) ? "green" : ({ new:"orange", employer_submitted:"orange", waiting_employer:"orange", ready_for_sourcing:"green", sourcing:"green", declined:"red" })[need.status] || "";
  const needPill = (need) => pill(needIsFullyStaffed(need) ? staffingFinishedLabel : needStatusLabel(need.status), needTone(need));
  const respPill = (candidate) => candidate.employerResponse
    ? pill(candidateResponseLabel(candidate.employerResponse, !!candidate.contactEmail), candidate.employerResponse === "not_suitable" ? "red" : "green")
    : pill(tr("Awaiting decision", "Laukiama sprendimo"), "orange");
  const ini = (name) => String(name || "").trim().split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  const kv = (rows) => <div className="kv">{rows.filter((row) => row[1] !== null && row[1] !== undefined && row[1] !== "").map(([label, value], index) => <div key={index}><small>{label}</small><b style={{ whiteSpace:"pre-wrap" }}>{value}</b></div>)}</div>;
  const seg = (value, onChange, options) => <div className="seg" role="group">{options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
  const field = (label, input, wide = false) => <label className={`field${wide ? " hp-wide" : ""}`}>{label}{input}</label>;
  const profLabel = (value) => HIRE_PROFESSION_LABELS[lang]?.[value] || value;
  const countryLabel = (value) => HIRE_OPTION_LABELS[lang]?.[value] || value;
  const fileAccept = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  function goHome() { setScreen("dashboard"); setSelectedCandidate(null); setSelectedNeedId(null); window.scrollTo(0, 0); }
  function openNeedView(need) {
    openNeed(need);
    const seen = {};
    (need.candidates || []).forEach((candidate) => { const version = candidateNewsVersion(candidate); if (version) seen[candidateNewsKey(need, candidate)] = version; });
    if (Object.keys(seen).length) setHireSeenNews((current) => {
      const updated = { ...current, ...seen };
      try { window.localStorage.setItem("statybos24:hire:seen-candidate-news:v1", JSON.stringify(updated)); } catch {}
      return updated;
    });
    window.scrollTo(0, 0);
  }

  const langSelect = <div className="h-lsel"><select aria-label="Language" value={lang} onChange={(event) => changeLanguage(event.target.value)}>{HIRE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>;

  const agreementCard = (
    <section className="card hp-agr">
      <header><div><h2>{tr("Recruitment agreement", "Tarpininkavimo sutartis")}</h2>
        <p className="small muted" style={{ margin:"2px 0 0" }}>{!portal.agreement ? tr("Agreement is being prepared", "Sutartis ruošiama") : agreementDone ? tr("Your signed agreement has been accepted.", "Jūsų pasirašyta sutartis priimta.") : tr("Click the document to read the agreement.", "Paspauskite dokumentą ir perskaitykite sutartį.")}</p></div>
        {agreementDone ? pill(tr("Approved", "Patvirtinta"), "green") : null}</header>
      {!portal.agreement ? <p className="small muted" style={{ margin:0 }}>{tr("Statybos24 will place the company agreement here.", "Statybos24 čia įkels įmonės sutartį.")}</p> : (
        <>
          {!agreementDone ? <p className="small muted" style={{ margin:0 }}>{tr("Please read the agreement carefully. If everything is acceptable, sign it and upload the signed copy. If you have questions, contact Statybos24 by email.", "Prašome atidžiai perskaityti ir susipažinti su sutartimi. Jeigu viskas tinka, pasirašykite ją ir įkelkite pasirašytą kopiją. Jeigu turite klausimų, susisiekite su Statybos24 el. paštu.")}</p> : null}
          <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
            {agreementDone
              ? <button className="btn sm" type="button" onClick={downloadSignedAgreement}><Svg name="download" size={15} />{tr("Download signed copy", "Parsisiųsti pasirašytos sutarties kopiją")}</button>
              : <>
                  <button className="btn sm" type="button" onClick={openAgreement}><Svg name="file" size={15} />{portal.agreement.name || `${tr("Recruitment agreement", "Tarpininkavimo sutartis")}.pdf`}</button>
                  <label className={`btn sm primary${uploading ? " is-busy" : ""}`} aria-disabled={uploading} style={{ position:"relative", overflow:"hidden" }}><Svg name="upload" size={15} />{uploading ? tr("Uploading...", "Įkeliama...") : tr("Upload signed agreement", "Įkelti pasirašytą sutartį")}
                    <input type="file" disabled={uploading} accept={fileAccept} style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} onChange={(event) => { const file = event.target.files?.[0] || null; if (file) { setSignedFile(file); uploadSignedAgreement(file); } event.target.value = ""; }} /></label>
                </>}
            <a className="btn sm ghost" href="mailto:info@statybos24.lt"><Svg name="mail" size={15} />{tr("Contact by email", "Susisiekti el. paštu")}</a>
          </div>
        </>
      )}
    </section>
  );

  const home = (
    <>
      <div className="hp-hello"><div><span className="h-k">{tr("PRIVATE RECRUITMENT WORKSPACE", "PRIVATI DARBUOTOJŲ ATRANKOS ERDVĖ")}</span><h1>{tr("Hello", "Sveiki")}{firstName ? `, ${firstName}` : ""}</h1><p className="muted">{tr("Submit workforce needs and review the candidates Statybos24 introduces for each specific job.", "Pateikite darbuotojų poreikius ir kiekvienam konkrečiam darbui peržiūrėkite Statybos24 pateiktus kandidatus.")}</p></div>
        <button className="btn primary" type="button" onClick={openNewNeed} disabled={!agreementDone}><Svg name="plus" size={16} width={2.4} />{tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button></div>
      {agreementDone ? null : <div className="notebox">{tr("Upload the signed recruitment agreement first – then you can submit workforce needs.", "Pirmiausia įkelkite pasirašytą tarpininkavimo sutartį – tada galėsite pateikti darbuotojų poreikius.")}</div>}
      {agreementCard}
      <section className="card"><header><div><h2>{tr("Your workforce needs", "Jūsų darbuotojų poreikiai")}</h2><p className="small muted" style={{ margin:"2px 0 0" }}>{tr("Open a need to review the information you submitted and the candidates assigned to it.", "Atidarykite poreikį, kad matytumėte pateiktą informaciją ir jam priskirtus kandidatus.")}</p></div></header>
        {needs.length ? <div className="list">{needs.map((need) => (
          <button type="button" className="hp-need" key={need.id} onClick={() => openNeedView(need)}>
            <div><b>{need.title}</b><small>{[need.workforceDetails?.roles?.map((role) => profLabel(role?.profession)).filter(Boolean).join(", "), `${totalWorkers(need) || "—"} ${tr("workers", "darbuotojai")}`, [need.projectLocation, need.projectCountry].filter(Boolean).join(", "), `${tr("start", "pradžia")} ${need.requestedStartDate || "—"}`].filter(Boolean).join(" · ")}</small>
              {needIsFullyStaffed(need) ? <small style={{ color:"var(--green)", fontWeight:600 }}>{staffingFinishedText}</small> : null}</div>
            <span className="row" style={{ gap:8 }}>{needHasNews(need) ? <em className="hp-new">{tr("New candidate update", "Nauja informacija apie kandidatą")}</em> : null}<span className="small muted">{tr("Candidates", "Kandidatai")}: <b>{(need.candidates || []).length}</b></span>{needPill(need)}</span>
          </button>
        ))}</div> : <p className="small muted" style={{ margin:0 }}>{tr("No workforce needs submitted yet", "Darbuotojų poreikių dar nepateikta")}</p>}
      </section>
      {invoiceNeeds.length ? <section className="card"><header><div><h2>{tr("Invoices", "Sąskaitos")}</h2></div></header><div className="list">{invoiceNeeds.map((need) => (
        <div className="hp-inv" key={need.id}><span><Svg name="file" size={15} /><b>{need.title}</b></span><span className="small muted">{needStatusLabel(need.status)}</span><button className="btn sm" type="button" onClick={() => downloadNeedInvoice(need)}><Svg name="download" size={14} />PDF</button></div>
      ))}</div></section> : null}
    </>
  );

  const needView = selectedNeed ? (
    <>
      <button type="button" className="linkbtn" onClick={goHome}>← {tr("All workforce needs", "Visi poreikiai")}</button>
      <div className="hp-hello"><div><span className="h-k">{tr("WORKFORCE NEED", "DARBUOTOJŲ POREIKIS")}</span><h1>{selectedNeed.title}</h1><p className="muted">{[(selectedNeed.workforceDetails?.roles || []).map((role) => profLabel(role?.profession)).filter(Boolean).join(", "), `${totalWorkers(selectedNeed) || "—"} ${tr("workers", "darbuotojai")}`, [selectedNeed.projectLocation, selectedNeed.projectCountry].filter(Boolean).join(", "), `${tr("Submitted", "Pateikta")} ${fmtDate(selectedNeed.submittedAt)}`].filter(Boolean).join(" · ")}</p></div>{needPill(selectedNeed)}</div>
      {needIsFullyStaffed(selectedNeed) ? <div className="hp-ok"><Svg name="check" size={15} width={2.6} />{staffingFinishedText}</div> : null}
      <section className="card"><button type="button" className="hp-tgl" aria-expanded={needInfoOpen} onClick={() => setNeedInfoOpen((open) => !open)}>{needInfoOpen ? tr("Hide information", "Slėpti informaciją") : tr("Information", "Informacija")}<Svg name="plus" size={14} width={2.4} /></button>
        {needInfoOpen ? <>
          <h3 className="hp-sub">{tr("Job & project", "Darbas ir projektas")}</h3>
          {kv([[tr("Country", "Šalis"), selectedNeed.projectCountry], [tr("Location", "Adresas"), selectedNeed.projectLocation], [tr("Start", "Darbo pradžia"), selectedNeed.requestedStartDate], [tr("Needed by", "Darbuotojus turėti iki"), wf.neededBy]])}
          {(Array.isArray(wf.roles) ? wf.roles : []).map((role, index) => <div key={index}>
            <h3 className="hp-sub">{tr("Workers required", "Reikalingi darbuotojai")}{wf.roles.length > 1 ? ` · ${index + 1}` : ""}</h3>
            {kv([[tr("Profession / trade", "Profesija / specialybė"), profLabel(role.profession)], [tr("Workers required", "Reikalingi darbuotojai"), role.count || 1], [tr("Experience", "Patirtis"), role.experience], [tr("Language", "Kalbos"), role.language], [tr("Driving licence", "Vairuotojo pažymėjimas"), role.drivingLicense ? drivingLabel(role.drivingLicense) : ""], [tr("Skills / tasks", "Įgūdžiai / darbai"), role.skills]])}
          </div>)}
          <h3 className="hp-sub">{tr("Employment conditions", "Darbo sąlygos")}</h3>
          {kv([[tr("Employment", "Įdarbinimas"), wf.employmentType], [tr("Duration", "Sutarties trukmė"), wf.duration], [tr("Hours per week", "Valandų per savaitę"), wf.weeklyHours], [tr("Overtime", "Viršvalandžiai"), wf.overtimeAllowed === "yes" ? `${tr("Yes", "Taip")}${wf.overtimePay ? ` · ${wf.overtimePay}` : ""}` : wf.overtimeAllowed === "no" ? tr("No", "Ne") : (wf.overtime || "")], [tr("Salary", "Atlyginimas"), `${wf.salaryAmount || wf.salaryMin || "—"} ${wf.salaryCurrency || ""} · ${salaryBasisLabel(wf.salaryBasis)}`], [tr("Payment frequency", "Mokėjimo dažnumas"), wf.salaryPayFrequency || wf.salaryType]])}
          <h3 className="hp-sub">{tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h3>
          {kv([[tr("Accommodation", "Apgyvendinimas"), wf.accommodation ? accommodationLabel(wf.accommodation) : ""], [tr("Room", "Kambarys"), wf.roomType], [tr("Cost", "Kaina"), wf.accommodationCost], [tr("Home travel", "Kelionės namo"), wf.homeTravelPaid === "yes" ? tr("Paid by employer", "Apmoka darbdavys") : wf.homeTravelPaid === "no" ? tr("Not paid by employer", "Darbdavys neapmoka") : (wf.homeTravel || "")], [tr("Vacation", "Atostogos"), wf.vacationTerms], [tr("Vacation pay", "Atostogų apmokėjimas"), wf.vacationPay], [tr("Employment contract", "Darbo sutartis"), selectedNeed.employmentContractAvailable ? (selectedNeed.employmentContractName || tr("Employment contract", "Darbo sutartis")) : ""]])}
          {wf.additionalInfo ? <p className="small" style={{ margin:"6px 0 0", whiteSpace:"pre-wrap" }}>{wf.additionalInfo}</p> : null}
        </> : null}
      </section>
      <section className="card"><header><div><h2>{tr("Candidates", "Kandidatai")} · {selectedCandidates.length}</h2></div></header>
        {selectedCandidates.length ? selectedCandidates.map((candidate) => {
          const busy = candidateBusyId === candidate.id;
          return <article className="hp-cand" key={candidate.id}>
            <div className="hp-ch"><span className="av lt">{ini(candidate.name)}</span><div><b>{candidate.name}</b><small>{[candidate.profession || tr("Construction specialist", "Statybų specialistas"), candidate.ageYears != null ? `${tr("Age", "Amžius")} ${candidate.ageYears}` : ""].filter(Boolean).join(" · ")}</small></div>{respPill(candidate)}</div>
            {kv([[tr("Experience", "Patirtis"), candidate.yearsExperience == null ? "" : `${Number(candidate.yearsExperience)} ${tr("yrs", "m.")}`], [tr("Language", "Kalbos"), candidate.languageDetails], [tr("Driving licence", "Vairuotojo paž."), candidate.hasDrivingLicenseB === true ? tr("Yes", "Taip") : candidate.hasDrivingLicenseB === false ? tr("No", "Ne") : ""], [tr("Available from", "Gali vykti nuo"), candidate.availableFrom], [tr("Needs accommodation", "Reikalingas būstas"), candidate.needsAccommodation === true ? tr("Yes", "Taip") : candidate.needsAccommodation === false ? tr("No", "Ne") : ""], [tr("Skills", "Įgūdžiai"), candidate.skills]])}
            {candidate.recruiterComment ? <p className="hp-note"><b>{tr("Statybos24 comment", "Statybos24 komentaras")}:</b> {candidate.recruiterComment}</p> : null}
            {candidate.cvAvailable || candidate.contactEmail ? <div className="row" style={{ gap:8, flexWrap:"wrap" }}>
              {candidate.cvAvailable ? <button className="btn sm" type="button" disabled={busy} onClick={() => openCandidateCv(candidate)}><Svg name="file" size={14} />{tr("Open full CV", "Atidaryti pilną CV")}</button> : null}
              {candidate.contactEmail ? <span className="small"><Svg name="mail" size={13} /> {tr("Interview contact provided", "Interviu kontaktas pateiktas")}: <a href={`mailto:${candidate.contactEmail}`}>{candidate.contactEmail}</a></span> : null}
            </div> : null}
            {candidate.employerResponse === "accepted"
              ? <div className="hp-ok"><Svg name="check" size={15} width={2.6} />{tr("Candidate confirmed and accepted.", "Darbuotojas patvirtintas ir priimtas.")}</div>
              : candidate.employerResponse === "not_suitable"
              ? <p className="small muted" style={{ margin:0 }}>{tr("Rejection reason", "Atmetimo priežastis")}: {candidate.rejectionReason || "—"}</p>
              : <div className="hp-dec"><b>{tr("CANDIDATE DECISION", "SPRENDIMAS DĖL KANDIDATO")}</b><div className="row" style={{ gap:8, flexWrap:"wrap" }}>
                  <button className="btn sm primary" type="button" disabled={busy} onClick={() => respondToCandidate(candidate, "accepted")}><Svg name="check" size={14} width={2.6} />{tr("Approve candidate", "Patvirtinti kandidatą")}</button>
                  {!candidate.employerResponse ? <button className="btn sm" type="button" disabled={busy} onClick={() => respondToCandidate(candidate, "interview_requested")}>{tr("Request interview", "Noriu interviu")}</button> : null}
                  <button className="btn sm danger" type="button" disabled={busy} onClick={() => { setRejectCandidateId(candidate.id); setRejectReason(candidate.rejectionReason || ""); }}>{tr("Reject candidate", "Atmesti kandidatą")}</button>
                </div></div>}
          </article>;
        }) : <p className="small muted" style={{ margin:0 }}>{tr("No candidates yet", "Kandidatų dar nėra")}</p>}
      </section>
    </>
  ) : null;

  const needFormView = (
    <>
      <button type="button" className="linkbtn" onClick={goHome}>← {tr("Back", "Atgal")}</button>
      <div className="hp-hello"><div><span className="h-k">{tr("NEW WORKFORCE NEED", "NAUJAS DARBUOTOJŲ POREIKIS")}</span><h1>{tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</h1></div></div>
      <form className="hp-form" noValidate onSubmit={(event) => { event.preventDefault(); submitNeed(); }}>
        <section className="card"><h2>{tr("Job & project", "Darbas ir projektas")}</h2><div className="h-grid">
          {field(tr("JOB TITLE *", "DARBO PAVADINIMAS *"), <input value={needForm.needTitle} onChange={(e) => setNeedField("needTitle", e.target.value)} placeholder={tr("e.g. Drywall installer", "pvz. gipso kartono montuotojas")} />)}
        </div>
        {needForm.roles.map((role, index) => <div className="h-grid" key={`need-role-${index}`} style={{ marginTop:14, paddingTop: index ? 14 : 0, borderTop: index ? "1px solid var(--line)" : 0 }}>
          {needForm.roles.length > 1 ? <div className="hp-wide row" style={{ justifyContent:"space-between" }}><b className="small">{tr("ROLE", "POZICIJA")} {index + 1}</b><button className="btn sm ghost" type="button" onClick={() => removeNeedRole(index)}>{tr("Remove", "Pašalinti")}</button></div> : null}
          {field(tr("PROFESSION / TRADE *", "PROFESIJA / SPECIALYBĖ *"), <select value={role.profession} onChange={(e) => setNeedRole(index, "profession", e.target.value)}><option value="">—</option>{[...HIRE_PROFESSIONS, ...(role.profession && !HIRE_PROFESSIONS.includes(role.profession) ? [role.profession] : [])].map((item) => <option key={item} value={item}>{profLabel(item)}</option>)}</select>)}
          {field(tr("WORKERS NEEDED *", "DARBUOTOJŲ SKAIČIUS *"), <input type="number" min="1" max="100" inputMode="numeric" value={role.count} onChange={(e) => setNeedRole(index, "count", Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />)}
          {field(tr("MINIMUM EXPERIENCE", "MINIMALI PATIRTIS"), <input value={role.experience} onChange={(e) => setNeedRole(index, "experience", e.target.value)} placeholder={tr("e.g. 3+ years", "pvz. 3+ metai")} />)}
          {field(tr("LANGUAGE / LEVEL", "KALBA / LYGIS"), <input value={role.language} onChange={(e) => setNeedRole(index, "language", e.target.value)} placeholder={tr("e.g. English B1", "pvz. anglų B1")} />)}
          <div className="field"><span>{tr("DRIVING LICENCE", "VAIRUOTOJO PAŽYMĖJIMAS")}</span>{seg(role.drivingLicense, (value) => setNeedRole(index, "drivingLicense", value), [{ value:"required", label:tr("Required", "Privalomas") }, { value:"advantage", label:tr("Advantage", "Privalumas") }, { value:"not_required", label:tr("Not required", "Nereikalingas") }])}</div>
          {field(tr("REQUIRED SKILLS / TASKS", "REIKALINGI ĮGŪDŽIAI / DARBAI"), <textarea value={role.skills} onChange={(e) => setNeedRole(index, "skills", e.target.value)} placeholder={tr("Drywall installation, framing, ceilings, finishing...", "Gipso montavimas, karkasas, lubos, glaistymas...")} />, true)}
        </div>)}
        <button className="btn sm" type="button" style={{ marginTop:12, alignSelf:"flex-start" }} onClick={addNeedRole}><Svg name="plus" size={14} width={2.4} />{tr("Add another trade", "Pridėti kitą profesiją")}</button>
        <div className="h-grid" style={{ marginTop:14 }}>
          {field(tr("PROJECT COUNTRY *", "PROJEKTO ŠALIS *"), <select value={needForm.projectCountry} onChange={(e) => setNeedField("projectCountry", e.target.value)}><option value="">—</option>{[...HIRE_COUNTRIES, ...(needForm.projectCountry && !HIRE_COUNTRIES.includes(needForm.projectCountry) ? [needForm.projectCountry] : [])].map((item) => <option key={item} value={item}>{countryLabel(item)}</option>)}</select>)}
          {field(tr("PROJECT ADDRESS *", "PROJEKTO ADRESAS *"), <input value={needForm.projectLocation} onChange={(e) => setNeedField("projectLocation", e.target.value)} placeholder={tr("Street, city", "Gatvė, miestas")} />)}
          {field(tr("START DATE *", "DARBO PRADŽIA *"), <input type="date" value={needForm.startDate} onChange={(e) => setNeedField("startDate", e.target.value)} />)}
          {field(tr("WORKERS REQUIRED BY *", "DARBUOTOJUS REIKIA TURĖTI IKI *"), <input type="date" value={needForm.neededBy} onChange={(e) => setNeedField("neededBy", e.target.value)} />)}
        </div>
        </section>
        <section className="card"><h2>{tr("Employment conditions", "Darbo sąlygos")}</h2><div className="h-grid">
          {field(tr("EMPLOYMENT TYPE *", "ĮDARBINIMO TIPAS *"), <input value={needForm.employmentType} onChange={(e) => setNeedField("employmentType", e.target.value)} placeholder="Full-time" />)}
          {field(tr("CONTRACT DURATION *", "SUTARTIES TRUKMĖ *"), <input value={needForm.duration} onChange={(e) => setNeedField("duration", e.target.value)} placeholder={tr("e.g. 12 months / permanent", "pvz. 12 mėnesių / neterminuota")} />)}
          {field(tr("WORKING HOURS PER WEEK *", "DARBO VALANDŲ PER SAVAITĘ SKAIČIUS *"), <input type="number" inputMode="numeric" min="1" max="80" step="1" value={needForm.weeklyHours} onChange={(e) => setNeedField("weeklyHours", e.target.value)} placeholder={tr("e.g. 40", "pvz. 40")} />)}
          <div className="field"><span>{tr("OVERTIME", "VIRŠVALANDŽIAI")}</span>{seg(needForm.overtimeAllowed, (value) => setNeedField("overtimeAllowed", value), [{ value:"yes", label:tr("Yes", "Taip") }, { value:"no", label:tr("No", "Ne") }])}</div>
          {needForm.overtimeAllowed === "yes" ? field(tr("OVERTIME PAY *", "KAIP APMOKAMI VIRŠVALANDŽIAI *"), <input value={needForm.overtimePay} onChange={(e) => setNeedField("overtimePay", e.target.value)} placeholder={tr("e.g. 125% hourly rate / +5 EUR per hour", "pvz. 125% valandinio tarifo / +5 EUR už valandą")} />) : null}
          {field(tr("SALARY AMOUNT *", "ATLYGINIMAS *"), <input inputMode="decimal" value={needForm.salaryAmount} onChange={(e) => setNeedField("salaryAmount", e.target.value)} />)}
          {field(tr("CURRENCY *", "VALIUTA *"), <input value={needForm.salaryCurrency} onChange={(e) => setNeedField("salaryCurrency", e.target.value.toUpperCase())} placeholder="EUR" />)}
          {field(tr("PAYMENT FREQUENCY *", "KAIP DAŽNAI MOKAMAS ATLYGINIMAS *"), <input value={needForm.salaryPayFrequency} onChange={(e) => setNeedField("salaryPayFrequency", e.target.value)} placeholder={tr("e.g. every week / every 2 weeks / monthly", "pvz. kas savaitę / kas 2 savaites / kas mėnesį")} />)}
          <div className="field"><span>{tr("SALARY BASIS", "ATLYGINIMO PAGRINDAS")}</span>{seg(needForm.salaryBasis, (value) => setNeedField("salaryBasis", value), [{ value:"gross", label:tr("Gross", "Bruto") }, { value:"net", label:tr("Net", "Neto") }])}</div>
        </div></section>
        <section className="card"><h2>{tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h2><div className="h-grid">
          <div className="field hp-wide"><span>{tr("ACCOMMODATION *", "APGYVENDINIMAS *")}</span>{seg(needForm.accommodation, (value) => {
            setNeedField("accommodation", value);
            if (value === "provided") setNeedField("accommodationCost", "");
            if (value === "not_provided") { setNeedField("roomType", ""); setNeedField("accommodationCost", ""); }
          }, [{ value:"provided", label:tr("Employer provides", "Suteikia darbdavys") }, { value:"employee_contributes", label:tr("Employee pays / contributes", "Moka / prisideda darbuotojas") }, { value:"not_provided", label:tr("Not provided", "Nesuteikiama") }])}</div>
          {needForm.accommodation === "provided" || needForm.accommodation === "employee_contributes" ? field(tr("ROOM / ACCOMMODATION TYPE", "KAMBARIO / APGYVENDINIMO TIPAS"), <input value={needForm.roomType} onChange={(e) => setNeedField("roomType", e.target.value)} placeholder={tr("Single / shared room", "Atskiras / bendras kambarys")} />) : null}
          {needForm.accommodation === "employee_contributes" ? field(tr("EMPLOYEE ACCOMMODATION COST", "DARBUOTOJO APGYVENDINIMO KAINA"), <input value={needForm.accommodationCost} onChange={(e) => setNeedField("accommodationCost", e.target.value)} placeholder={tr("amount per month", "suma per mėnesį")} />) : null}
          <div className="field"><span>{tr("HOME TRAVEL", "KELIONĖS NAMO")}</span>{seg(needForm.homeTravelPaid, (value) => setNeedField("homeTravelPaid", value), [{ value:"yes", label:tr("Paid by employer", "Apmoka darbdavys") }, { value:"no", label:tr("Not paid by employer", "Darbdavys neapmoka") }])}</div>
          {field(tr("VACATION", "ATOSTOGOS"), <input value={needForm.vacationTerms} onChange={(e) => setNeedField("vacationTerms", e.target.value)} placeholder={tr("e.g. 24 working days per year", "pvz. 24 darbo dienos per metus")} />)}
          {field(tr("VACATION PAY", "ATOSTOGŲ APMOKĖJIMAS"), <input value={needForm.vacationPay} onChange={(e) => setNeedField("vacationPay", e.target.value)} placeholder={tr("e.g. paid according to employment contract", "pvz. apmokamos pagal darbo sutartį")} />)}
          {field(tr("ADDITIONAL REQUIREMENTS / INFORMATION", "PAPILDOMI REIKALAVIMAI / INFORMACIJA"), <textarea value={needForm.additionalInfo} onChange={(e) => setNeedField("additionalInfo", e.target.value)} />, true)}
          <div className="field hp-wide"><span>{tr("EMPLOYMENT CONTRACT FOR REVIEW", "DARBO SUTARTIS SUSIPAŽINIMUI")}</span>
            <label className="btn" style={{ position:"relative", overflow:"hidden", alignSelf:"flex-start" }}><Svg name="file" size={16} />{employmentContractFile?.name || tr("Choose employment contract PDF / DOCX", "Įkelti darbo sutartį PDF / DOCX")}<input type="file" accept={fileAccept} style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} onChange={(event) => setEmploymentContractFile(event.target.files?.[0] || null)} /></label>
            <span className="hint">{tr("Optional: upload a sample employment contract so Statybos24 can review the terms together with the workforce need.", "Nebūtina: galite įkelti darbo sutarties pavyzdį, kad Statybos24 galėtų susipažinti su sąlygomis kartu su darbuotojų poreikiu.")}</span></div>
        </div></section>
        {error ? <p className="ferr">{error}</p> : null}
        <div className="row" style={{ justifyContent:"flex-end" }}><button className="btn primary lp-big" type="submit" disabled={saving}>{saving ? tr("Submitting...", "Pateikiama...") : tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button></div>
      </form>
    </>
  );

  const rejectCandidate = rejectCandidateId ? selectedCandidates.find((candidate) => candidate.id === rejectCandidateId) : null;

  return (
    <div className="p24 hire-p24">
      <div className="hp">
        <header className="hp-top"><div className="h-in"><img src="/brand-logo-tight.png" alt="statybos24.lt" className="hp-logo2" /><span className="hp-tag">{tr("STATYBOS24 · INTERNATIONAL HIRE", "STATYBOS24 · TARPTAUTINĖ ATRANKA")}</span><span className="spacer" />{langSelect}<span className="hp-co">{companyName}</span><button className="btn sm" type="button" onClick={logout}>{tr("Sign out", "Atsijungti")}</button></div></header>
        <main className="h-in hp-main">
          {error && screen !== "new" && !portal.account?.mustChangePassword ? <div className="alert" role="alert"><div><b>{error}</b></div></div> : null}
          {screen === "new" ? needFormView : screen === "need" && selectedNeed ? needView : home}
        </main>
      </div>
      <NoticeToast notice={notice} onClear={() => setNotice("")} />

      {rejectCandidate ? <P24Modal eyebrow={tr("CANDIDATE DECISION", "SPRENDIMAS DĖL KANDIDATO")} title={tr("Why are you rejecting this candidate?", "Kodėl atmetate šį kandidatą?")} sub={rejectCandidate.name} busy={candidateBusyId === rejectCandidate.id} onClose={() => { setRejectCandidateId(null); setRejectReason(""); }}>
        <label className="field">{tr("Rejection reason", "Atmetimo priežastis")} *<textarea maxLength={1200} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={tr("e.g. insufficient experience, language level, availability...", "pvz. per maža patirtis, netinka kalbos lygis, negali pradėti reikiamu metu...")} /><span className="hint">{tr("Please give a short reason. Statybos24 will see it and use it to improve the next candidate selection.", "Trumpai nurodykite priežastį. Statybos24 ją matys ir galės tiksliau parinkti kitus kandidatus.")}</span></label>
        <div className="row" style={{ justifyContent:"flex-end" }}>
          <button className="btn" type="button" disabled={candidateBusyId === rejectCandidate.id} onClick={() => { setRejectCandidateId(null); setRejectReason(""); }}>{tr("Cancel", "Atšaukti")}</button>
          <button className="btn danger" type="button" disabled={candidateBusyId === rejectCandidate.id || rejectReason.trim().length < 3} onClick={() => respondToCandidate(rejectCandidate, "not_suitable", rejectReason)}>{candidateBusyId === rejectCandidate.id ? tr("Saving...", "Saugoma...") : tr("Reject candidate", "Atmesti kandidatą")}</button>
        </div>
      </P24Modal> : null}

      {portal.account?.mustChangePassword ? <P24Modal eyebrow={tr("FIRST SIGN-IN", "PIRMAS PRISIJUNGIMAS")} title={tr("Create your own password", "Susikurkite savo slaptažodį")} sub={tr("The password sent by Statybos24 is temporary. Set a private password before using the employer portal.", "Statybos24 atsiųstas slaptažodis yra laikinas. Prieš naudojantis darbdavio portalu susikurkite savo privatų slaptažodį.")}>
        <div className="form" style={{ gridTemplateColumns:"1fr" }}>
          <label className="field">{tr("NEW PASSWORD", "NAUJAS SLAPTAŽODIS")}<input type="password" autoComplete="new-password" value={password1} onChange={(e) => setPassword1(e.target.value)} placeholder={tr("At least 12 characters", "Bent 12 simbolių")} /></label>
          <label className="field">{tr("CONFIRM PASSWORD", "PAKARTOKITE SLAPTAŽODĮ")}<input type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} /></label>
        </div>
        {error ? <div className="alert" role="alert"><div>{error}</div></div> : null}
        <div className="row" style={{ justifyContent:"flex-end" }}><button className="btn primary" type="button" disabled={saving} onClick={changePassword}>{saving ? tr("Saving...", "Saugoma...") : tr("Save password & continue", "Išsaugoti slaptažodį ir tęsti")}</button></div>
      </P24Modal> : null}
    </div>
  );
}
