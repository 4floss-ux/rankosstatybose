import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { AppBootLoader } from "../ui/AppBootLoader.jsx";
import { HIRE_EMPLOYER_PORTAL_I18N, HirePortalCheckChoice, HirePortalDatePicker, HirePortalLanguageSwitch, HirePortalLogo, detectHirePortalLanguage, getForeignHirePortalToken, persistHirePortalLanguage, setForeignHirePortalToken } from "./hirePortalShared.jsx";

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

  const blankRole = () => ({ profession:"", count:1, experience:"", skills:"", language:"", languageLevel:"", drivingLicense:"" });
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
    accommodation:"",
    roomType:"",
    accommodationCost:"",
    homeTravelPaid:"",
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
    setNeedForm(blankNeed());
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
    return <div className="hep-access-removed-page">
      <style>{`
        .hep-access-removed-page{min-height:100vh;background:#f4f7f9;color:#10283f;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:24px;box-sizing:border-box}
        .hep-access-removed-card{width:min(100%,620px);background:#fff;border:1px solid #dfe7ec;border-radius:22px;padding:34px;box-shadow:0 28px 80px rgba(16,40,63,.10);text-align:center}
        .hep-access-removed-logo{display:flex;justify-content:center;margin-bottom:24px}.hep-access-removed-eyebrow{color:#d56d16;font-size:8px;font-weight:950;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
        .hep-access-removed-card h1{margin:0;font:900 clamp(28px,5vw,42px)/1.04 Manrope,Inter,sans-serif;letter-spacing:-.04em}.hep-access-removed-card p{margin:16px auto 0;max-width:500px;color:#6f808c;font-size:12px;line-height:1.7}
        .hep-access-removed-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:24px}.hep-access-removed-actions a,.hep-access-removed-actions button{min-height:46px;padding:0 18px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-family:inherit;font-size:10px;font-weight:950;cursor:pointer}
        .hep-access-removed-mail{border:1px solid #dbe5eb;background:#fff;color:#10283f}.hep-access-removed-request{border:1px solid #f08a28;background:#f08a28;color:#fff}
        .hep-access-removed-lang{display:flex;justify-content:center;margin-top:20px}.hep-access-removed-lang .hire-portal-lang-switch{position:relative}.hep-access-removed-lang .hire-portal-lang-trigger{width:74px;height:40px;padding:0 11px;border:1px solid #dce5eb;border-radius:10px;background:#fff;color:#10283f;display:flex;align-items:center;justify-content:space-between;gap:10px;font:900 9px Inter,sans-serif;cursor:pointer}.hep-access-removed-lang .hire-portal-lang-menu{position:absolute;left:50%;transform:translateX(-50%);top:calc(100% + 8px);z-index:10;width:190px;padding:6px;border:1px solid #dce5eb;border-radius:12px;background:#fff;box-shadow:0 18px 45px rgba(16,40,63,.16)}.hep-access-removed-lang .hire-portal-lang-menu button{width:100%;min-height:37px;padding:7px 9px;border:0;border-radius:8px;background:transparent;color:#526575;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font:800 10px Inter,sans-serif;cursor:pointer}.hep-access-removed-lang .hire-portal-lang-menu button.active{background:#10283f;color:#fff}
        @media(max-width:560px){.hep-access-removed-card{padding:28px 20px}.hep-access-removed-actions{display:grid}.hep-access-removed-actions a,.hep-access-removed-actions button{width:100%;box-sizing:border-box}}
      `}</style>
      <section className="hep-access-removed-card">
        <div className="hep-access-removed-logo"><HirePortalLogo/></div>
        <div className="hep-access-removed-eyebrow">{tr("EMPLOYER PORTAL", "DARBDAVIO PORTALAS")}</div>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <div className="hep-access-removed-actions">
          <button className="hep-access-removed-request" type="button" onClick={() => loadPortal()}>{copy.retry}</button>
          <a className="hep-access-removed-mail" href={`/hire/login?lang=${encodeURIComponent(lang)}`}>{copy.signIn}</a>
          <a className="hep-access-removed-mail" href="mailto:info@statybos24.lt">{copy.contact}</a>
          <a className="hep-access-removed-request" href={`/hire?request=1&lang=${encodeURIComponent(lang)}`}>{copy.request}</a>
        </div>
        <div className="hep-access-removed-lang"><HirePortalLanguageSwitch lang={lang} onChange={changeLanguage}/></div>
      </section>
    </div>;
  }

  const wf = selectedNeed?.workforceDetails || {};
  const selectedCandidates = Array.isArray(selectedNeed?.candidates) ? selectedNeed.candidates : [];

  return (
    <div className="hep-page">
      <style>{`
        .hep-need-card.is-fully-staffed{background:#eaf8f0;border-color:#9ed7b8;box-shadow:inset 4px 0 0 #289568}
        .hep-need-card.is-fully-staffed h3{color:#145a3b}
        .hep-need-card.is-fully-staffed .hep-need-card-meta{color:#39785b}
        .hep-staffing-finished-message{margin:10px 0 0;color:#166545;font-size:10px;line-height:1.6;font-weight:800;white-space:normal}
        .hep-status.fully-staffed{background:#ccebdc;color:#126141}
        .hep-open-with-news{position:relative;display:inline-flex;align-items:center;gap:7px}
        .hep-news-mark{display:grid;place-items:center;width:17px;height:17px;flex:0 0 17px;border-radius:50%;background:#df342d;color:#fff;font-size:11px;font-weight:950;line-height:1}
        .hep-candidate-row.has-new-update{border-color:#f0b37c;background:#fff4e9}
        .hep-candidate-row.has-new-update h4{color:#9c4d13}
        .hep-page{min-height:100vh;background:#f4f7f9;color:#10283f;font-family:Inter,system-ui,sans-serif}.hep-top{position:sticky;top:0;z-index:80;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-bottom:1px solid #dde6ec}.hep-top-inner{width:min(1180px,calc(100% - 36px));min-height:72px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}.hep-brand{display:flex;align-items:center;gap:15px}.hep-brand-copy{display:grid;gap:2px}.hep-brand-copy b{font-size:9px;letter-spacing:.11em}.hep-brand-copy span{font-size:8px;color:#7a8a96}.hep-top-actions{display:flex;align-items:center;gap:8px}.hep-top .hire-portal-lang-switch{position:relative;display:inline-block}.hep-top .hire-portal-lang-trigger{width:74px;height:40px;padding:0 11px;border:1px solid #dce5eb;border-radius:10px;background:#fff;color:#10283f;display:flex;align-items:center;justify-content:space-between;gap:10px;font:900 9px Inter,sans-serif;cursor:pointer;box-shadow:none;appearance:none;-webkit-appearance:none}.hep-top .hire-portal-lang-trigger:hover{background:#f8fafb}.hep-top .hire-portal-lang-trigger svg{width:15px;height:15px;flex:0 0 auto}.hep-top .hire-portal-lang-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:120;width:190px;padding:6px;border:1px solid #dce5eb;border-radius:12px;background:#fff;box-shadow:0 18px 45px rgba(16,40,63,.16)}.hep-top .hire-portal-lang-menu button{width:100%;min-height:37px;padding:7px 9px;border:0;border-radius:8px;background:transparent;color:#526575;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font:800 10px Inter,sans-serif;cursor:pointer;appearance:none;-webkit-appearance:none}.hep-top .hire-portal-lang-menu button:hover{background:#f4f7f9}.hep-top .hire-portal-lang-menu button.active{background:#10283f;color:#fff}.hep-top .hire-portal-lang-menu button b{font-size:8px;letter-spacing:.08em}.hep-company-id{height:40px;padding:0 12px;border:1px solid #dce5eb;border-radius:10px;background:#f8fafb;display:flex;align-items:center;font-size:9px;font-weight:900}.hep-logout,.hep-back{height:40px;padding:0 13px;border:1px solid #dce5eb;border-radius:10px;background:#fff;color:#10283f;font-size:9px;font-weight:900;cursor:pointer}.hep-shell{width:min(1180px,calc(100% - 36px));margin:0 auto;padding:34px 0 60px}.hep-alerts{display:grid;gap:8px;margin-bottom:18px}.hep-notice,.hep-error{padding:11px 13px;border-radius:10px;font-size:10px;line-height:1.5}.hep-notice{border:1px solid #bfe3d2;background:#edf8f3;color:#1f6d50}.hep-error{border:1px solid #efc2b7;background:#fff2ee;color:#a5452d}.hep-dashboard-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:22px 0 28px}.hep-eyebrow{color:#d56d16;font-size:8px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}.hep-dashboard-hero h1,.hep-view-head h1{margin:8px 0 8px;font:900 clamp(30px,4vw,48px)/1 Manrope,Inter,sans-serif;letter-spacing:-.045em}.hep-dashboard-hero p,.hep-view-head p{max-width:720px;margin:0;color:#6f808c;font-size:11px;line-height:1.65}.hep-primary{min-height:46px;padding:0 18px;border:0;border-radius:11px;background:#f08a28;color:#fff;font-size:10px;font-weight:950;cursor:pointer;white-space:nowrap}.hep-primary:disabled{opacity:.55;cursor:wait}.hep-secondary{min-height:40px;padding:0 13px;border:1px solid #dbe5eb;border-radius:10px;background:#fff;color:#10283f;font-size:9px;font-weight:900;cursor:pointer}.hep-secondary:hover{background:#f8fafb}.hep-danger{color:#9c432f}.hep-dashboard-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px}.hep-panel{background:#fff;border:1px solid #dfe7ec;border-radius:18px;box-shadow:0 18px 50px rgba(16,40,63,.04)}.hep-panel-pad{padding:20px}.hep-panel-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.hep-panel-head h2{margin:0;font:900 18px Manrope,Inter,sans-serif}.hep-panel-head p{margin:4px 0 0;color:#7a8994;font-size:9.5px;line-height:1.5}.hep-needs-list{display:grid;gap:10px}.hep-need-card{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px;border:1px solid #e2e9ee;border-radius:13px;background:#fbfcfd}.hep-need-card-main{min-width:0}.hep-need-card h3{margin:0;font:900 14px Manrope,Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hep-need-card-meta{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:6px;color:#758591;font-size:9px}.hep-status{display:inline-flex;align-items:center;padding:6px 9px;border-radius:999px;background:#edf3f6;color:#506575;font-size:8px;font-weight:950}.hep-status.sourcing{background:#eaf7f1;color:#176c4d}.hep-status.employer_submitted,.hep-status.under_review{background:#fff3e8;color:#9e581b}.hep-status.declined{background:#fff0ed;color:#9d432f}.hep-need-card-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.hep-empty{padding:28px 18px;border:1px dashed #d3dfe6;border-radius:13px;text-align:center;background:#fafcfd}.hep-empty b{display:block;font-size:12px}.hep-empty span{display:block;margin-top:6px;color:#81909a;font-size:9.5px;line-height:1.5}.hep-agreement-box{display:grid;gap:12px}.hep-agreement-box h3{margin:0;font:900 15px Manrope,Inter,sans-serif}.hep-agreement-state{padding:12px;border-radius:11px;background:#f4f7f9}.hep-agreement-state b{display:block;font-size:10px}.hep-agreement-state span{display:block;margin-top:4px;color:#778792;font-size:9px;line-height:1.5}.hep-agreement-document{width:100%;padding:12px;border:1px solid #dfe7ec;border-radius:11px;background:#f7f9fb;color:#10283f;text-align:left;cursor:pointer}.hep-agreement-document b{display:block;font-size:10px;overflow-wrap:anywhere}.hep-agreement-document span{display:block;margin-top:4px;color:#778792;font-size:9px;line-height:1.5}.hep-agreement-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.hep-agreement-actions.accepted{grid-template-columns:1fr}.hep-agreement-download{min-height:40px;padding:0 12px;border:1px solid #b9d9ca;border-radius:10px;background:#edf8f3;color:#176c4d;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:950;cursor:pointer}.hep-agreement-download:hover{background:#e5f4ed}.hep-agreement-upload{min-height:40px;border:0;border-radius:10px;background:#f08a28;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:9px;font-weight:950;cursor:pointer}.hep-agreement-upload input{display:none}.hep-agreement-email{min-height:40px;padding:0 12px;border:1px solid #dbe5eb;border-radius:10px;background:#fff;color:#10283f;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:9px;font-weight:900}.hep-file-pick{display:grid;gap:8px}.hep-file-pick label{min-height:38px;padding:0 11px;border:1px dashed #cbd8e0;border-radius:9px;background:#fbfcfd;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;cursor:pointer}.hep-file-pick input{display:none}.hep-agreement-locked{padding:11px;border:1px solid #cfe8dc;border-radius:10px;background:#eef8f4;color:#28674e;font-size:9px;line-height:1.5}.hep-view-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px}.hep-view-title-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.hep-detail-card{background:#fff;border:1px solid #dfe7ec;border-radius:18px;padding:20px}.hep-detail-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.hep-detail-top h2{margin:0;font:900 23px Manrope,Inter,sans-serif;letter-spacing:-.03em}.hep-detail-meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;color:#778791;font-size:9.5px}.hep-info-toggle{margin-top:16px}.hep-info{margin-top:14px;border-top:1px solid #edf1f4;padding-top:16px;display:grid;gap:18px}.hep-info-section h3{margin:0 0 10px;font:900 13px Manrope,Inter,sans-serif}.hep-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hep-info-cell{padding:10px 11px;border:1px solid #edf1f4;border-radius:10px;background:#fafcfd}.hep-info-cell span{display:block;color:#85949e;font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.hep-info-cell b{display:block;margin-top:4px;font-size:9.5px;overflow-wrap:anywhere}.hep-role-list{display:grid;gap:9px}.hep-role-summary{padding:12px;border:1px solid #e5ebef;border-radius:11px;background:#fbfcfd}.hep-role-summary-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.hep-role-summary-head b{font-size:11px}.hep-role-summary-head span{font-size:9px;color:#758591}.hep-role-summary p{margin:7px 0 0;color:#566b7a;font-size:9.5px;line-height:1.55}.hep-candidates-section{margin-top:18px}.hep-candidates-section-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:10px}.hep-candidates-section h3{margin:0;font:900 16px Manrope,Inter,sans-serif}.hep-candidates-section p{margin:4px 0 0;color:#7b8994;font-size:9px}.hep-candidate-row{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:13px 14px;border:1px solid #e1e8ed;border-radius:11px;background:#fbfcfd}.hep-candidate-row+.hep-candidate-row{margin-top:8px}.hep-candidate-row h4{margin:0;font:900 12px Manrope,Inter,sans-serif}.hep-candidate-row p{margin:4px 0 0;color:#758591;font-size:9px}.hep-candidate-row-right{display:flex;align-items:center;gap:8px}.hep-candidate-response{padding:6px 8px;border-radius:999px;background:#edf3f6;color:#526675;font-size:8px;font-weight:900}.hep-candidate-response.accepted{background:#e9f7f1;color:#176e4e}.hep-candidate-response.interview_requested{background:#fff3e7;color:#a85a16}.hep-candidate-response.not_suitable{background:#fff0ed;color:#9f432e}.hep-form-card{background:#fff;border:1px solid #dfe7ec;border-radius:18px;padding:22px}.hep-form-section+.hep-form-section{margin-top:24px;padding-top:22px;border-top:1px solid #edf1f4}.hep-form-section h2{margin:0 0 5px;font:900 17px Manrope,Inter,sans-serif}.hep-form-section>p{margin:0 0 14px;color:#7a8994;font-size:9.5px;line-height:1.5}.hep-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.hep-field{display:grid;gap:6px}.hep-field.full{grid-column:1/-1}.hep-field span{font-size:8px;font-weight:950;color:#5c7180;letter-spacing:.05em}.hep-input,.hep-textarea{width:100%;box-sizing:border-box;border:1px solid #dce5eb;border-radius:10px;background:#fff;color:#10283f;padding:11px 12px;font:750 11px Inter,sans-serif;outline:0}.hep-input{min-height:44px}.hep-textarea{min-height:92px;resize:vertical}.hep-number-stepper{width:100%;min-height:44px;box-sizing:border-box;border:1px solid #dce5eb;border-radius:10px;background:#fff;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;overflow:hidden}.hep-number-stepper button{height:44px;border:0;background:#f8fafb;color:#10283f;font:900 19px/1 Inter,sans-serif;cursor:pointer}.hep-number-stepper button:first-child{border-right:1px solid #e4eaee}.hep-number-stepper button:last-child{border-left:1px solid #e4eaee}.hep-number-stepper button:hover:not(:disabled){background:#fff1e5;color:#bd6418}.hep-number-stepper button:focus-visible{outline:0;box-shadow:inset 0 0 0 2px #ee9c51}.hep-number-stepper button:disabled{opacity:.35;cursor:not-allowed}.hep-number-stepper b{text-align:center;font:900 14px Manrope,Inter,sans-serif}.hep-date-picker{position:relative;width:100%}.hep-date-trigger{width:100%;min-height:44px;padding:0 12px;border:1px solid #dce5eb;border-radius:10px;background:#fff;color:#10283f;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;font:750 11px Inter,sans-serif;cursor:pointer}.hep-date-trigger .placeholder{color:#8b99a3}.hep-date-trigger svg{width:17px;height:17px;color:#617482;flex:0 0 auto}.hep-date-picker.open .hep-date-trigger,.hep-date-trigger:focus-visible{outline:0;border-color:#ee9c51;box-shadow:0 0 0 3px rgba(240,138,40,.1)}.hep-date-popover{position:absolute;left:0;top:calc(100% + 8px);z-index:240;width:min(320px,calc(100vw - 42px));padding:12px;border:1px solid #dce5eb;border-radius:14px;background:#fff;box-shadow:0 22px 55px rgba(16,40,63,.18)}.hep-date-head{display:grid;grid-template-columns:34px 1fr 34px;align-items:center;gap:6px}.hep-date-head b{text-align:center;font:900 11px Manrope,Inter,sans-serif;text-transform:capitalize}.hep-date-head button{width:34px;height:34px;border:1px solid #e2e9ee;border-radius:9px;background:#fff;color:#10283f;font:900 15px Inter,sans-serif;cursor:pointer}.hep-date-head button:hover{background:#f5f8fa}.hep-date-weekdays,.hep-date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.hep-date-weekdays{margin:10px 0 4px}.hep-date-weekdays span{text-align:center;color:#8a99a4;font-size:7.5px;font-weight:900;text-transform:uppercase}.hep-date-grid button{aspect-ratio:1;border:0;border-radius:8px;background:transparent;color:#30495b;font:800 9px Inter,sans-serif;cursor:pointer}.hep-date-grid button:hover{background:#f2f6f8}.hep-date-grid button.outside{color:#b2bdc4}.hep-date-grid button.today{box-shadow:inset 0 0 0 1px #efaa6a}.hep-date-grid button.active{background:#10283f;color:#fff;box-shadow:none}.hep-date-foot{display:flex;justify-content:space-between;gap:8px;margin-top:9px;padding-top:9px;border-top:1px solid #edf1f4}.hep-date-foot button{min-height:32px;padding:0 9px;border:0;border-radius:8px;background:transparent;color:#d56d16;font-size:8.5px;font-weight:900;cursor:pointer}.hep-date-foot button:hover{background:#fff3e8}.hep-input:focus,.hep-textarea:focus{border-color:#ee9c51;box-shadow:0 0 0 3px rgba(240,138,40,.1)}.hep-segment{display:flex;flex-wrap:wrap;gap:6px}.hep-segment button{min-height:38px;padding:0 11px;border:1px solid #dce5eb;border-radius:9px;background:#fff;color:#536878;font-size:8.5px;font-weight:900;cursor:pointer}.hep-segment button.active{border-color:#10283f;background:#10283f;color:#fff}.hep-check-choice{display:flex;flex-wrap:wrap;gap:10px}.hep-check-choice label{display:flex;align-items:center;gap:8px;min-height:36px;color:#536878;font-size:9px;font-weight:850;cursor:pointer;user-select:none}.hep-check-choice input{position:absolute;opacity:0;pointer-events:none}.hep-check-box{width:20px;height:20px;border:1px solid #c9d6de;border-radius:5px;background:#fff;display:grid;place-items:center;color:transparent;font:900 15px/1 Inter,sans-serif;transition:.15s ease}.hep-check-choice label.active .hep-check-box{border-color:#10283f;background:#10283f;color:#fff}.hep-check-choice label:focus-within .hep-check-box{box-shadow:0 0 0 3px rgba(240,138,40,.12);border-color:#ee9c51}.hep-contract-upload{grid-column:1/-1;padding:15px;border:1px dashed #cbd8e0;border-radius:12px;background:#fafcfd}.hep-contract-upload h3{margin:0;font:900 13px Manrope,Inter,sans-serif}.hep-contract-upload p{margin:5px 0 12px;color:#74848f;font-size:9px;line-height:1.55}.hep-contract-file{min-height:44px;padding:0 13px;border:1px solid #dbe5eb;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:9px;font-weight:900;cursor:pointer}.hep-contract-file input{display:none}.hep-contract-file em{font-style:normal;color:#7b8b96;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hep-form-role{padding:14px;border:1px solid #e2e9ee;border-radius:12px;background:#fafcfd}.hep-form-role+.hep-form-role{margin-top:10px}.hep-role-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.hep-role-head b{font-size:9px;letter-spacing:.07em}.hep-role-head button{border:0;background:transparent;color:#a34b35;font-size:8.5px;font-weight:900;cursor:pointer}.hep-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px;padding-top:18px;border-top:1px solid #edf1f4}.hep-modal{position:fixed;inset:0;z-index:950;background:rgba(7,24,38,.68);display:grid;place-items:center;padding:20px}.hep-modal-card{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25)}.hep-modal-head{position:sticky;top:0;z-index:3;padding:16px 18px;border-bottom:1px solid #e7edf1;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:15px}.hep-modal-head h2{margin:0;font:900 20px Manrope,Inter,sans-serif}.hep-modal-head p{margin:4px 0 0;color:#758591;font-size:9px}.hep-modal-body{padding:18px}.hep-candidate-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hep-candidate-meta>div{padding:10px;border:1px solid #edf1f4;border-radius:10px;background:#fafcfd}.hep-candidate-meta span{display:block;color:#87959f;font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.hep-candidate-meta b{display:block;margin-top:4px;font-size:9.5px;overflow-wrap:anywhere}.hep-candidate-skills{margin-top:10px;padding:11px;border-radius:10px;background:#f2f6f8;color:#506575;font-size:9.5px;line-height:1.55}.hep-candidate-comment{margin-top:10px;padding:12px;border:1px solid #e1e8ed;border-radius:10px;background:#fff;color:#506575;font-size:9.5px;line-height:1.6}.hep-candidate-comment b{display:block;margin-bottom:4px;color:#10283f}.hep-candidate-cv{margin-top:12px;padding:12px 13px;border:1px solid #dfe7ec;border-radius:11px;background:#fafcfd;display:flex;align-items:center;justify-content:space-between;gap:12px}.hep-candidate-cv-copy{min-width:0}.hep-candidate-cv-copy span{display:block;color:#87959f;font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.hep-candidate-cv-copy b{display:block;margin-top:4px;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.admin-candidate-choice-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hep-candidate-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.hep-candidate-btn{min-height:40px;padding:0 13px;border:1px solid #dce5eb;border-radius:9px;background:#fff;color:#334d60;font-size:9px;font-weight:950;cursor:pointer}.hep-candidate-btn.primary{border-color:#f08a28;background:#f08a28;color:#fff}.hep-candidate-btn.danger{color:#9e452f}.hep-candidate-btn.active{box-shadow:0 0 0 2px rgba(16,40,63,.12)}.hep-candidate-btn:disabled{opacity:.55;cursor:wait}.hep-candidate-contact{margin-top:12px;padding:11px;border:1px solid #cfe9dc;border-radius:10px;background:#eef8f4}.hep-candidate-contact span{display:block;color:#5f8073;font-size:8px;font-weight:900}.hep-candidate-contact a{display:inline-block;margin-top:4px;color:#1d654b;font-size:11px;font-weight:900;text-decoration:none}.hep-rejection-note{margin-top:12px;padding:11px 12px;border:1px solid #f1d1c8;border-radius:10px;background:#fff5f2;color:#7f3d2e;font-size:9.5px;line-height:1.55}.hep-rejection-note b{display:block;margin-bottom:3px;color:#9b432f}.hep-accepted-note{margin-top:16px;padding:13px 14px;border:1px solid #bfe3d2;border-radius:11px;background:#edf8f3;color:#176c4d;font-size:10px;font-weight:900;line-height:1.5}.hep-reject-overlay{position:fixed;inset:0;z-index:980;background:rgba(7,24,38,.72);display:grid;place-items:center;padding:20px}.hep-reject-card{width:min(520px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.28)}.hep-reject-card h3{margin:8px 0 7px;font:900 22px/1.1 Manrope,Inter,sans-serif;letter-spacing:-.03em}.hep-reject-card p{margin:0 0 14px;color:#71818d;font-size:10px;line-height:1.55}.hep-reject-card textarea{width:100%;min-height:120px;box-sizing:border-box;border:1px solid #dce5eb;border-radius:10px;padding:12px;background:#fff;color:#10283f;font:750 11px/1.5 Inter,sans-serif;resize:vertical;outline:0}.hep-reject-card textarea:focus{border-color:#ee9c51;box-shadow:0 0 0 3px rgba(240,138,40,.1)}.hep-password-overlay{position:fixed;inset:0;z-index:1000;background:rgba(8,25,39,.72);display:grid;place-items:center;padding:18px}.hep-password-card{width:min(100%,480px);background:#fff;border-radius:18px;padding:26px;box-shadow:0 30px 80px rgba(0,0,0,.25)}.hep-password-card h2{margin:12px 0 8px;font:900 25px Manrope,Inter,sans-serif}.hep-password-card p{margin:0 0 18px;color:#71818d;font-size:11px;line-height:1.55}.hep-loading{min-height:100vh;display:grid;place-items:center;background:#f4f7f9;color:#71818d;font:800 12px Inter,sans-serif}
        @media(max-width:900px){.hep-dashboard-grid{grid-template-columns:1fr}.hep-info-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:680px){.hep-top-inner,.hep-shell{width:calc(100% - 24px)}.hep-top-inner{min-height:66px}.hep-brand-copy,.hep-company-id{display:none}.hep-dashboard-hero,.hep-view-head,.hep-detail-top{align-items:stretch;flex-direction:column}.hep-dashboard-hero .hep-primary{width:100%}.hep-need-card{align-items:flex-start;flex-direction:column}.hep-need-card-actions{width:100%;justify-content:space-between}.hep-form-grid,.hep-info-grid,.hep-candidate-meta{grid-template-columns:1fr}.hep-form-actions{display:grid;grid-template-columns:1fr}.hep-form-actions button{width:100%}.hep-candidate-row{align-items:flex-start;flex-direction:column}.hep-candidate-row-right{width:100%;justify-content:space-between}.hep-modal{padding:10px}.hep-modal-card{max-height:calc(100vh - 20px)}}
      `}</style>

      <header className="hep-top">
        <div className="hep-top-inner">
          <div className="hep-brand"><HirePortalLogo/><div className="hep-brand-copy"><b>{tr("EMPLOYER PORTAL", "DARBDAVIO PORTALAS")}</b><span>{tr("PRIVATE RECRUITMENT WORKSPACE", "PRIVATI DARBUOTOJŲ ATRANKOS ERDVĖ")}</span></div></div>
          <div className="hep-top-actions"><HirePortalLanguageSwitch lang={lang} onChange={changeLanguage}/><div className="hep-company-id">{portal.account?.loginId}</div><button className="hep-logout" type="button" onClick={logout}>{tr("Sign out", "Atsijungti")}</button></div>
        </div>
      </header>

      <main className="hep-shell">
        <div className="hep-alerts">{notice ? <div className="hep-notice">{notice}</div> : null}{error ? <div className="hep-error">{error}</div> : null}</div>

        {screen === "dashboard" ? <>
          <section className="hep-dashboard-hero">
            <div><div className="hep-eyebrow">{tr("STATYBOS24 · INTERNATIONAL HIRE", "STATYBOS24 · TARPTAUTINĖ ATRANKA")}</div><h1>{tr("Hello", "Sveiki")}{portalContactName ? `, ${portalContactName}` : ""}</h1><p>{tr("Submit workforce needs and review the candidates Statybos24 introduces for each specific job.", "Pateikite darbuotojų poreikius ir kiekvienam konkrečiam darbui peržiūrėkite Statybos24 pateiktus kandidatus.")}</p></div>
            <button className="hep-primary" type="button" onClick={openNewNeed}>+ {tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button>
          </section>

          <div className="hep-dashboard-grid">
            <section className="hep-panel hep-panel-pad">
              <div className="hep-panel-head"><div><h2>{tr("Your workforce needs", "Jūsų darbuotojų poreikiai")}</h2><p>{tr("Open a need to review the information you submitted and the candidates assigned to it.", "Atidarykite poreikį, kad matytumėte pateiktą informaciją ir jam priskirtus kandidatus.")}</p></div><b>{needs.length}</b></div>
              {needs.length ? <div className="hep-needs-list">{needs.map((need) => {
                const fullyStaffed = needIsFullyStaffed(need);
                return <article className={`hep-need-card${fullyStaffed ? " is-fully-staffed" : ""}`} key={need.id}>
                  <div className="hep-need-card-main">
                    <h3>{need.title}</h3>
                    <div className="hep-need-card-meta"><span>{need.projectLocation}, {need.projectCountry}</span><span>{tr("Start", "Pradžia")}: {need.requestedStartDate || "—"}</span><span>{tr("Workers", "Darbuotojai")}: {totalWorkers(need) || "—"}</span></div>
                    {fullyStaffed ? <p className="hep-staffing-finished-message">{staffingFinishedText}</p> : null}
                  </div>
                  <div className="hep-need-card-actions"><span className={`hep-status ${fullyStaffed ? "fully-staffed" : (need.status || "")}`}>{fullyStaffed ? staffingFinishedLabel : needStatusLabel(need.status)}</span>{need.status === "closed" && availableInvoices.includes(need.id) ? <button className="hep-secondary" type="button" onClick={() => downloadNeedInvoice(need)}>{({ en:"Invoice", lt:"Sąskaita", de:"Rechnung", nl:"Factuur", no:"Faktura", sv:"Faktura", da:"Faktura" })[lang] || "Invoice"}</button> : null}<button className="hep-secondary hep-open-with-news" type="button" onClick={() => openNeed(need)}>{tr("Open", "Atidaryti")}{needHasNews(need) ? <span className="hep-news-mark" aria-label={tr("New update", "Nauja informacija")} title={tr("New candidate update", "Nauja informacija apie kandidatą")}>!</span> : null}</button></div>
                </article>;
              })}</div> : <div className="hep-empty"><b>{tr("No workforce needs submitted yet", "Darbuotojų poreikių dar nepateikta")}</b><span>{tr("Use “Submit workforce need” when you are ready to provide full job, salary, accommodation and project information.", "Paspauskite „Pateikti darbuotojų poreikį“, kai būsite pasiruošę pateikti pilną darbo, atlyginimo, apgyvendinimo ir projekto informaciją.")}</span></div>}
            </section>

            <aside className="hep-panel hep-panel-pad">
              <div className="hep-agreement-box"><div><h3>{tr("Recruitment agreement", "Tarpininkavimo sutartis")}</h3></div>
                {portal.agreement ? (agreementDone ? <>
                  <div className="hep-agreement-locked">{tr("Your signed agreement has been accepted.", "Jūsų pasirašyta sutartis priimta.")}</div>
                  <div className="hep-agreement-actions accepted">
                    <button className="hep-agreement-download" type="button" onClick={downloadSignedAgreement}>{tr("Download signed copy", "Parsisiųsti pasirašytos sutarties kopiją")}</button>
                    <a className="hep-agreement-email" href="mailto:info@statybos24.lt">{tr("Contact by email", "Susisiekti el. paštu")}</a>
                  </div>
                </> : <>
                  <button className="hep-agreement-document" type="button" onClick={openAgreement}>
                    <b>{portal.agreement.name || tr("Recruitment agreement", "Tarpininkavimo sutartis")}</b>
                    <span>{tr("Click the document to read the agreement.", "Paspauskite dokumentą ir perskaitykite sutartį.")}</span>
                  </button>
                  <div className="hep-agreement-state"><span>{tr("Please read the agreement carefully. If everything is acceptable, sign it and upload the signed copy. If you have questions, contact Statybos24 by email.", "Prašome atidžiai perskaityti ir susipažinti su sutartimi. Jeigu viskas tinka, pasirašykite ją ir įkelkite pasirašytą kopiją. Jeigu turite klausimų, susisiekite su Statybos24 el. paštu.")}</span></div>
                  <div className="hep-agreement-actions">
                    <label className="hep-agreement-upload" aria-disabled={uploading}>{uploading ? <AppBootLoader compact label={tr("Uploading...", "Įkeliama...")} /> : tr("Upload signed agreement", "Įkelti pasirašytą sutartį")}<input type="file" disabled={uploading} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.target.files?.[0] || null; if (file) { setSignedFile(file); uploadSignedAgreement(file); } event.target.value = ""; }}/></label>
                    <a className="hep-agreement-email" href="mailto:info@statybos24.lt">{tr("Contact by email", "Susisiekti el. paštu")}</a>
                  </div>
                </>) : <><div className="hep-agreement-state"><b>{tr("Agreement is being prepared", "Sutartis ruošiama")}</b><span>{tr("Statybos24 will place the company agreement here.", "Statybos24 čia įkels įmonės sutartį.")}</span></div><a className="hep-agreement-email" href="mailto:info@statybos24.lt">{tr("Contact by email", "Susisiekti el. paštu")}</a></>}
              </div>
            </aside>
          </div>
        </> : null}

        {screen === "new" ? <>
          <section className="hep-view-head"><div><button className="hep-back" type="button" onClick={() => setScreen("dashboard")}>← {tr("Back", "Atgal")}</button><div className="hep-eyebrow" style={{marginTop:16}}>{tr("NEW WORKFORCE NEED", "NAUJAS DARBUOTOJŲ POREIKIS")}</div><h1>{tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</h1><p>{tr("Provide the complete job and project conditions. This is the information Statybos24 will use for sourcing and candidate screening.", "Pateikite pilnas darbo ir projekto sąlygas. Pagal šią informaciją Statybos24 vykdys paiešką ir kandidatų atranką.")}</p></div></section>

          <section className="hep-form-card">
            <div className="hep-form-section"><h2>{tr("Job & project", "Darbas ir projektas")}</h2><p>{tr("Give the job a clear title and specify exactly where and when the work starts.", "Aiškiai nurodykite darbą, projekto vietą ir pagrindines datas.")}</p><div className="hep-form-grid">
              <label className="hep-field full"><span>{tr("JOB TITLE *", "DARBO PAVADINIMAS *")}</span><input className="hep-input" value={needForm.needTitle} onChange={(e) => setNeedField("needTitle", e.target.value)} placeholder={tr("e.g. Drywall installer", "pvz. Gipso montuotojas")}/></label>
              <label className="hep-field"><span>{tr("PROJECT COUNTRY *", "PROJEKTO ŠALIS *")}</span><input className="hep-input" value={needForm.projectCountry} onChange={(e) => setNeedField("projectCountry", e.target.value)}/></label>
              <label className="hep-field"><span>{tr("PROJECT ADDRESS *", "PROJEKTO ADRESAS *")}</span><input className="hep-input" value={needForm.projectLocation} onChange={(e) => setNeedField("projectLocation", e.target.value)} placeholder={tr("Street, city", "Gatvė, miestas")}/></label>
              <div className="hep-field"><span>{tr("START DATE *", "DARBO PRADŽIA *")}</span><HirePortalDatePicker lang={lang} value={needForm.startDate} onChange={(value) => setNeedField("startDate", value)}/></div>
              <div className="hep-field"><span>{tr("WORKERS REQUIRED BY *", "DARBUOTOJUS REIKIA TURĖTI IKI *")}</span><HirePortalDatePicker lang={lang} value={needForm.neededBy} onChange={(value) => setNeedField("neededBy", value)}/></div>
            </div></div>

            <div className="hep-form-section"><h2>{tr("Workers required", "Reikalingi darbuotojai")}</h2><p>{tr("Add every trade / role needed for this project.", "Pridėkite visas šiam projektui reikalingas profesijas / pozicijas.")}</p>
              {needForm.roles.map((role, index) => <div className="hep-form-role" key={`need-role-${index}`}><div className="hep-role-head"><b>{tr("ROLE", "POZICIJA")} {String(index + 1).padStart(2, "0")}</b>{needForm.roles.length > 1 ? <button type="button" onClick={() => removeNeedRole(index)}>{tr("Remove", "Pašalinti")}</button> : null}</div><div className="hep-form-grid">
                <label className="hep-field"><span>{tr("PROFESSION / TRADE *", "PROFESIJA / SPECIALYBĖ *")}</span><input className="hep-input" value={role.profession} onChange={(e) => setNeedRole(index, "profession", e.target.value)} placeholder={tr("e.g. Drywall installer", "pvz. gipso kartono montuotojas")}/></label>
                <div className="hep-field"><span>{tr("WORKERS NEEDED *", "DARBUOTOJŲ SKAIČIUS *")}</span><div className="hep-number-stepper"><button type="button" aria-label={tr("Decrease workers", "Sumažinti darbuotojų skaičių")} disabled={Number(role.count || 1) <= 1} onClick={() => setNeedRole(index, "count", Math.max(1, Number(role.count || 1) - 1))}>−</button><b>{Number(role.count || 1)}</b><button type="button" aria-label={tr("Increase workers", "Padidinti darbuotojų skaičių")} disabled={Number(role.count || 1) >= 100} onClick={() => setNeedRole(index, "count", Math.min(100, Number(role.count || 1) + 1))}>+</button></div></div>
                <label className="hep-field"><span>{tr("MINIMUM EXPERIENCE", "MINIMALI PATIRTIS")}</span><input className="hep-input" value={role.experience} onChange={(e) => setNeedRole(index, "experience", e.target.value)} placeholder={tr("e.g. 3+ years", "pvz. 3+ metai")}/></label>
                <label className="hep-field"><span>{tr("LANGUAGE / LEVEL", "KALBA / LYGIS")}</span><input className="hep-input" value={role.language} onChange={(e) => setNeedRole(index, "language", e.target.value)} placeholder={tr("e.g. English B1", "pvz. anglų B1")}/></label>
                <label className="hep-field full"><span>{tr("REQUIRED SKILLS / TASKS", "REIKALINGI ĮGŪDŽIAI / DARBAI")}</span><textarea className="hep-textarea" value={role.skills} onChange={(e) => setNeedRole(index, "skills", e.target.value)} placeholder={tr("Drywall installation, framing, ceilings, finishing...", "Gipso montavimas, karkasas, lubos, glaistymas...")}/></label>
                <div className="hep-field full"><span>{tr("DRIVING LICENCE", "VAIRUOTOJO PAŽYMĖJIMAS")}</span><HirePortalCheckChoice name={`driving-${index}`} value={role.drivingLicense} onChange={(value) => setNeedRole(index, "drivingLicense", value)} options={[{value:"required",label:tr("Required", "Privalomas")},{value:"advantage",label:tr("Advantage", "Privalumas")},{value:"not_required",label:tr("Not required", "Nereikalingas")}]} /></div>
              </div></div>)}
              <button className="hep-secondary" type="button" style={{marginTop:10}} onClick={addNeedRole}>+ {tr("Add another trade", "Pridėti kitą profesiją")}</button>
            </div>

            <div className="hep-form-section"><h2>{tr("Employment conditions", "Darbo sąlygos")}</h2><p>{tr("Describe the employment arrangement and contract duration. Mark whether overtime is offered.", "Aprašykite įdarbinimo tipą, sutarties trukmę ir pažymėkite, ar numatomi viršvalandžiai.")}</p><div className="hep-form-grid">
              <label className="hep-field"><span>{tr("EMPLOYMENT TYPE *", "ĮDARBINIMO TIPAS *")}</span><input className="hep-input" value={needForm.employmentType} onChange={(e) => setNeedField("employmentType", e.target.value)} placeholder={tr("e.g. direct employment under German contract", "pvz. tiesioginis įdarbinimas pagal Vokietijos darbo sutartį")}/></label>
              <label className="hep-field"><span>{tr("CONTRACT DURATION *", "SUTARTIES TRUKMĖ *")}</span><input className="hep-input" value={needForm.duration} onChange={(e) => setNeedField("duration", e.target.value)} placeholder={tr("e.g. 12 months / permanent", "pvz. 12 mėnesių / neterminuota")}/></label>
              <label className="hep-field"><span>{tr("WORKING HOURS PER WEEK *", "DARBO VALANDŲ PER SAVAITĘ SKAIČIUS *")}</span><input className="hep-input" type="number" inputMode="numeric" min="1" max="80" step="1" required value={needForm.weeklyHours} onChange={(e) => setNeedField("weeklyHours", e.target.value)} placeholder={tr("e.g. 40", "pvz. 40")}/></label>
              <div className="hep-field full"><span>{tr("OVERTIME", "VIRŠVALANDŽIAI")}</span><HirePortalCheckChoice name="overtime" value={needForm.overtimeAllowed} onChange={(value) => setNeedField("overtimeAllowed", value)} options={[{value:"yes",label:tr("Overtime available", "Taip")},{value:"no",label:tr("No overtime", "Ne")}]} /></div>
              {needForm.overtimeAllowed === "yes" ? <label className="hep-field full"><span>{tr("OVERTIME PAY *", "KAIP APMOKAMI VIRŠVALANDŽIAI *")}</span><input className="hep-input" value={needForm.overtimePay} onChange={(e) => setNeedField("overtimePay", e.target.value)} placeholder={tr("e.g. 125% hourly rate / +5 EUR per hour", "pvz. 125% valandinio tarifo / +5 EUR už valandą")}/></label> : null}
            </div></div>

            <div className="hep-form-section"><h2>{tr("Salary", "Atlyginimas")}</h2><p>{tr("State one clear salary amount and how often it is paid.", "Nurodykite vieną aiškų atlyginimą ir kaip dažnai jis mokamas.")}</p><div className="hep-form-grid">
              <label className="hep-field"><span>{tr("SALARY AMOUNT *", "ATLYGINIMAS *")}</span><input className="hep-input" inputMode="decimal" value={needForm.salaryAmount} onChange={(e) => setNeedField("salaryAmount", e.target.value)} placeholder="22"/></label>
              <label className="hep-field"><span>{tr("CURRENCY *", "VALIUTA *")}</span><input className="hep-input" value={needForm.salaryCurrency} onChange={(e) => setNeedField("salaryCurrency", e.target.value.toUpperCase())} placeholder="EUR"/></label>
              <div className="hep-field"><span>{tr("SALARY BASIS", "ATLYGINIMO PAGRINDAS")}</span><HirePortalCheckChoice name="salary-basis" value={needForm.salaryBasis} onChange={(value) => setNeedField("salaryBasis", value)} options={[{value:"gross",label:tr("Gross", "Bruto")},{value:"net",label:tr("Net", "Neto")}]} /></div>
              <label className="hep-field"><span>{tr("PAYMENT FREQUENCY *", "KAIP DAŽNAI MOKAMAS ATLYGINIMAS *")}</span><input className="hep-input" value={needForm.salaryPayFrequency} onChange={(e) => setNeedField("salaryPayFrequency", e.target.value)} placeholder={tr("e.g. every week / every 2 weeks / monthly", "pvz. kas savaitę / kas 2 savaites / kas mėnesį")}/></label>
            </div></div>

            <div className="hep-form-section"><h2>{tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h2><p>{tr("Mark the accommodation and home-travel arrangement and describe vacation conditions.", "Pažymėkite apgyvendinimo bei kelionių namo sąlygas ir nurodykite atostogų tvarką.")}</p><div className="hep-form-grid">
              <div className="hep-field full"><span>{tr("ACCOMMODATION *", "APGYVENDINIMAS *")}</span><HirePortalCheckChoice name="accommodation" value={needForm.accommodation} onChange={(value) => {
                setNeedField("accommodation", value);
                if (value === "provided") setNeedField("accommodationCost", "");
                if (value === "not_provided") { setNeedField("roomType", ""); setNeedField("accommodationCost", ""); }
              }} options={[{value:"provided",label:tr("Employer provides", "Suteikia darbdavys")},{value:"not_provided",label:tr("Not provided", "Nesuteikiama")},{value:"employee_contributes",label:tr("Employee pays / contributes", "Moka / prisideda darbuotojas")}]} /></div>
              {needForm.accommodation === "provided" || needForm.accommodation === "employee_contributes" ?
                <label className="hep-field"><span>{tr("ROOM / ACCOMMODATION TYPE", "KAMBARIO / APGYVENDINIMO TIPAS")}</span><input className="hep-input" value={needForm.roomType} onChange={(e) => setNeedField("roomType", e.target.value)} placeholder={tr("Single / shared room", "Atskiras / bendras kambarys")}/></label>
              : null}
              {needForm.accommodation === "employee_contributes" ?
                <label className="hep-field"><span>{tr("EMPLOYEE ACCOMMODATION COST", "DARBUOTOJO APGYVENDINIMO KAINA")}</span><input className="hep-input" value={needForm.accommodationCost} onChange={(e) => setNeedField("accommodationCost", e.target.value)} placeholder={tr("amount per month", "suma per mėnesį")}/></label>
              : null}
              <div className="hep-field full"><span>{tr("HOME TRAVEL", "KELIONĖS NAMO")}</span><HirePortalCheckChoice name="home-travel" value={needForm.homeTravelPaid} onChange={(value) => setNeedField("homeTravelPaid", value)} options={[{value:"yes",label:tr("Paid by employer", "Apmoka darbdavys")},{value:"no",label:tr("Not paid by employer", "Darbdavys neapmoka")}]} /></div>
              <label className="hep-field"><span>{tr("VACATION", "ATOSTOGOS")}</span><input className="hep-input" value={needForm.vacationTerms} onChange={(e) => setNeedField("vacationTerms", e.target.value)} placeholder={tr("e.g. 24 working days per year", "pvz. 24 darbo dienos per metus")}/></label>
              <label className="hep-field"><span>{tr("VACATION PAY", "ATOSTOGŲ APMOKĖJIMAS")}</span><input className="hep-input" value={needForm.vacationPay} onChange={(e) => setNeedField("vacationPay", e.target.value)} placeholder={tr("e.g. paid according to employment contract", "pvz. apmokamos pagal darbo sutartį")}/></label>
              <label className="hep-field full"><span>{tr("ADDITIONAL REQUIREMENTS / INFORMATION", "PAPILDOMI REIKALAVIMAI / INFORMACIJA")}</span><textarea className="hep-textarea" value={needForm.additionalInfo} onChange={(e) => setNeedField("additionalInfo", e.target.value)} placeholder={tr("Certificates, tools, shifts, safety requirements or other important information...", "Sertifikatai, įrankiai, pamainos, saugos reikalavimai ar kita svarbi informacija...")}/></label>
              <div className="hep-contract-upload">
                <h3>{tr("Employment contract for review", "Darbo sutartis susipažinimui")}</h3>
                <p>{tr("Optional: upload a sample employment contract so Statybos24 can review the terms together with the workforce need.", "Nebūtina: galite įkelti darbo sutarties pavyzdį, kad Statybos24 galėtų susipažinti su sąlygomis kartu su pateiktu poreikiu.")}</p>
                <label className="hep-contract-file"><span>{tr("Choose employment contract PDF / DOCX", "Įkelti darbo sutartį PDF / DOCX")}</span><em>{employmentContractFile?.name || tr("No file selected", "Failas nepasirinktas")}</em><input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setEmploymentContractFile(event.target.files?.[0] || null)}/></label>
              </div>
            </div></div>

            <div className="hep-form-actions"><button className="hep-secondary" type="button" disabled={saving} onClick={() => setScreen("dashboard")}>{tr("Cancel", "Atšaukti")}</button><button className="hep-primary" type="button" disabled={saving} onClick={submitNeed}>{saving ? <AppBootLoader compact label={tr("Submitting...", "Pateikiama...")} /> : tr("Submit workforce need", "Pateikti darbuotojų poreikį")}</button></div>
          </section>
        </> : null}

        {screen === "need" && selectedNeed ? <>
          <section className="hep-view-head"><div><button className="hep-back" type="button" onClick={() => { setScreen("dashboard"); setSelectedCandidate(null); }}>← {tr("All workforce needs", "Visi poreikiai")}</button><div className="hep-eyebrow" style={{marginTop:16}}>{tr("WORKFORCE NEED", "DARBUOTOJŲ POREIKIS")}</div><div className="hep-view-title-row"><h1>{selectedNeed.title}</h1><span className={`hep-status ${selectedNeed.status || ""}`}>{needStatusLabel(selectedNeed.status)}</span></div><p>{selectedNeed.projectLocation}, {selectedNeed.projectCountry} · {tr("start", "pradžia")} {selectedNeed.requestedStartDate || "—"}</p></div></section>

          <section className="hep-detail-card">
            <div className="hep-detail-top"><div><h2>{selectedNeed.title}</h2><div className="hep-detail-meta"><span>{tr("Workers required", "Reikia darbuotojų")}: {totalWorkers(selectedNeed) || "—"}</span><span>{tr("Submitted", "Pateikta")}: {selectedNeed.submittedAt ? new Date(selectedNeed.submittedAt).toLocaleDateString(lang === "lt" ? "lt-LT" : "en-GB") : "—"}</span></div></div><button className="hep-secondary" type="button" onClick={() => setNeedInfoOpen((open) => !open)}>{needInfoOpen ? tr("Hide information", "Slėpti informaciją") : tr("Information", "Informacija")}</button></div>

            {needInfoOpen ? <div className="hep-info">
              <div className="hep-info-section"><h3>{tr("Project", "Projektas")}</h3><div className="hep-info-grid">
                <div className="hep-info-cell"><span>{tr("Country", "Šalis")}</span><b>{selectedNeed.projectCountry || "—"}</b></div><div className="hep-info-cell"><span>{tr("Location", "Adresas")}</span><b>{selectedNeed.projectLocation || "—"}</b></div><div className="hep-info-cell"><span>{tr("Start", "Darbo pradžia")}</span><b>{selectedNeed.requestedStartDate || "—"}</b></div>
                <div className="hep-info-cell"><span>{tr("Needed by", "Darbuotojus turėti iki")}</span><b>{wf.neededBy || "—"}</b></div><div className="hep-info-cell"><span>{tr("Employment", "Įdarbinimas")}</span><b>{employmentTypeLabel(wf.employmentType)}</b></div><div className="hep-info-cell"><span>{tr("Duration", "Sutarties trukmė")}</span><b>{wf.duration || "—"}</b></div><div className="hep-info-cell"><span>{tr("Hours per week", "Valandų per savaitę")}</span><b>{wf.weeklyHours ? `${wf.weeklyHours} ${tr("hours", "val.")}` : "—"}</b></div><div className="hep-info-cell"><span>{tr("Overtime", "Viršvalandžiai")}</span><b>{wf.overtimeAllowed === "yes" ? tr("Yes", "Taip") : wf.overtimeAllowed === "no" ? tr("No", "Ne") : (wf.overtime || "—")}</b></div>{wf.overtimeAllowed === "yes" ? <div className="hep-info-cell"><span>{tr("Overtime pay", "Viršvalandžių apmokėjimas")}</span><b>{wf.overtimePay || "—"}</b></div> : null}
              </div></div>
              <div className="hep-info-section"><h3>{tr("Workers required", "Reikalingi darbuotojai")}: {totalWorkers(selectedNeed) || "—"}</h3><div className="hep-role-list">{Array.isArray(wf.roles) ? wf.roles.map((role, index) => <div className="hep-role-summary" key={`summary-${index}`}>
                  <div className="hep-info-grid">
                    <div className="hep-info-cell"><span>{tr("Profession / trade", "Profesija / specialybė")}</span><b>{role.profession || "—"}</b></div>
                    <div className="hep-info-cell"><span>{tr("Number of workers", "Darbuotojų skaičius")}</span><b>{role.count || 1}</b></div>
                    <div className="hep-info-cell"><span>{tr("Experience", "Patirtis")}</span><b>{role.experience || "—"}</b></div>
                    <div className="hep-info-cell"><span>{tr("Language", "Kalba")}</span><b>{role.language || "—"}</b></div>
                    <div className="hep-info-cell"><span>{tr("Driving licence", "Vairuotojo pažymėjimas")}</span><b>{drivingLabel(role.drivingLicense)}</b></div>
                    <div className="hep-info-cell"><span>{tr("Skills / tasks", "Įgūdžiai / darbai")}</span><b style={{whiteSpace:"pre-wrap"}}>{role.skills || "—"}</b></div>
                  </div>
                </div>) : null}</div></div>
              <div className="hep-info-section"><h3>{tr("Salary", "Atlyginimas")}</h3><div className="hep-info-grid"><div className="hep-info-cell"><span>{tr("Salary", "Atlyginimas")}</span><b>{wf.salaryAmount || wf.salaryMin || "—"} {wf.salaryCurrency || ""}</b></div><div className="hep-info-cell"><span>{tr("Basis", "Pagrindas")}</span><b>{salaryBasisLabel(wf.salaryBasis)}</b></div><div className="hep-info-cell"><span>{tr("Payment frequency", "Mokėjimo dažnumas")}</span><b>{wf.salaryPayFrequency || (wf.salaryType ? wf.salaryType : "—")}</b></div></div></div>
              <div className="hep-info-section"><h3>{tr("Accommodation & travel", "Apgyvendinimas, kelionės ir atostogos")}</h3><div className="hep-info-grid"><div className="hep-info-cell"><span>{tr("Accommodation", "Apgyvendinimas")}</span><b>{accommodationLabel(wf.accommodation)}</b></div><div className="hep-info-cell"><span>{tr("Room", "Kambarys")}</span><b>{wf.roomType || "—"}</b></div><div className="hep-info-cell"><span>{tr("Cost", "Kaina")}</span><b>{wf.accommodationCost || "—"}</b></div><div className="hep-info-cell"><span>{tr("Home travel", "Kelionės namo")}</span><b>{wf.homeTravelPaid === "yes" ? tr("Paid by employer", "Apmoka darbdavys") : wf.homeTravelPaid === "no" ? tr("Not paid by employer", "Darbdavys neapmoka") : (wf.homeTravel || "—")}</b></div><div className="hep-info-cell"><span>{tr("Vacation", "Atostogos")}</span><b>{wf.vacationTerms || "—"}</b></div><div className="hep-info-cell"><span>{tr("Vacation pay", "Atostogų apmokėjimas")}</span><b>{wf.vacationPay || "—"}</b></div></div>{selectedNeed.employmentContractAvailable ? <div className="hep-role-summary" style={{marginTop:8}}><p style={{margin:0}}><b>{tr("Employment contract", "Darbo sutartis")}:</b> {selectedNeed.employmentContractName || tr("Employment contract", "Darbo sutartis")}</p></div> : null}{wf.additionalInfo ? <div className="hep-role-summary" style={{marginTop:8}}><p style={{margin:0}}>{wf.additionalInfo}</p></div> : null}</div>
            </div> : null}

            <div className="hep-candidates-section"><div className="hep-candidates-section-head"><div><h3>{tr("Candidates", "Kandidatai")}</h3><p>{tr("Candidates Statybos24 has introduced for this exact workforce need.", "Kandidatai, kuriuos Statybos24 pateikė būtent šiam darbuotojų poreikiui.")}</p></div><b>{selectedCandidates.length}</b></div>
              {selectedCandidates.length ? selectedCandidates.map((candidate) => <article className={`hep-candidate-row ${candidateHasNews(selectedNeed, candidate) ? "has-new-update" : ""}`} key={candidate.id}><div><h4>{candidate.name}</h4><p>{candidate.profession || tr("Construction specialist", "Statybų specialistas")}</p></div><div className="hep-candidate-row-right"><span className={`hep-candidate-response ${candidate.employerResponse || ""}`}>{candidateResponseLabel(candidate.employerResponse, !!candidate.contactEmail)}</span><button className="hep-secondary" type="button" onClick={() => reviewCandidate(selectedNeed, candidate)}>{tr("Review", "Peržiūrėti")}</button></div></article>) : <div className="hep-empty"><b>{tr("No candidates yet", "Kandidatų dar nėra")}</b><span>{tr("Candidates assigned by Statybos24 to this need will appear here.", "Čia atsiras Statybos24 šiam poreikiui priskirti kandidatai.")}</span></div>}
            </div>
          </section>
        </> : null}
      </main>

      {activeCandidate ? <div className="hep-modal" role="dialog" aria-modal="true"><div className="hep-modal-card"><div className="hep-modal-head"><div><h2>{activeCandidate.name}</h2><p>{activeCandidate.profession || tr("Construction specialist", "Statybų specialistas")}</p></div><button className="hep-back" type="button" onClick={() => setSelectedCandidate(null)}>← {tr("Back", "Atgal")}</button></div><div className="hep-modal-body">
        <div className="hep-candidate-meta">
          <div><span>{tr("Age", "Amžius")}</span><b>{activeCandidate.ageYears ?? "—"}</b></div>
          <div><span>{tr("Experience", "Patirtis")}</span><b>{activeCandidate.yearsExperience === null || activeCandidate.yearsExperience === undefined ? "—" : `${Number(activeCandidate.yearsExperience)} ${tr("yrs", "m.")}`}</b></div>
          <div><span>{tr("Language", "Kalbos")}</span><b>{activeCandidate.languageDetails || "—"}</b></div>
          <div><span>{tr("Driving licence", "Vairuotojo paž.")}</span><b>{activeCandidate.hasDrivingLicenseB === true ? tr("Yes", "Taip") : activeCandidate.hasDrivingLicenseB === false ? tr("No", "Ne") : "—"}</b></div>
          <div><span>{tr("Available from", "Gali vykti nuo")}</span><b>{activeCandidate.availableFrom || "—"}</b></div>
          <div><span>{tr("Needs accommodation", "Reikalingas būstas")}</span><b>{activeCandidate.needsAccommodation === true ? tr("Yes", "Taip") : activeCandidate.needsAccommodation === false ? tr("No", "Ne") : "—"}</b></div>
          <div><span>{tr("Decision", "Sprendimas")}</span><b>{candidateResponseLabel(activeCandidate.employerResponse, !!activeCandidate.contactEmail)}</b></div>
        </div>
        {activeCandidate.skills ? <div className="hep-candidate-comment"><b>{tr("Skills", "Įgūdžiai")}</b><span style={{whiteSpace:"pre-wrap"}}>{activeCandidate.skills}</span></div> : null}
        {activeCandidate.recruiterComment ? <div className="hep-candidate-comment"><b>{tr("Statybos24 comment", "Statybos24 komentaras")}</b>{activeCandidate.recruiterComment}</div> : null}
        {activeCandidate.cvAvailable ? <div className="hep-candidate-cv"><div className="hep-candidate-cv-copy"><span>{tr("Candidate CV", "Kandidato CV")}</span><b>{activeCandidate.cvName || tr("Candidate CV", "Kandidato CV")}</b></div><button className="hep-candidate-btn" type="button" disabled={candidateBusyId === activeCandidate.id} onClick={() => openCandidateCv(activeCandidate)}>{tr("Open full CV", "Atidaryti pilną CV")}</button></div> : null}
        {activeCandidate.contactEmail ? <div className="hep-candidate-contact"><span>{tr("We share the candidate email so you can contact them about the interview.", "Perduodame kandidato el. paštą, kad galėtumėte susisiekti dėl interviu.")}</span><a href={`mailto:${activeCandidate.contactEmail}`}>{activeCandidate.contactEmail}</a></div> : null}
        {activeCandidate.rejectionReason ? <div className="hep-rejection-note"><b>{tr("Rejection reason", "Atmetimo priežastis")}</b>{activeCandidate.rejectionReason}</div> : null}
        {activeCandidate.employerResponse === "accepted" ? (
          <div className="hep-accepted-note">✓ {tr("Candidate confirmed and accepted.", "Darbuotojas patvirtintas ir priimtas.")}</div>
        ) : (
          <div className="hep-candidate-actions">
            {!activeCandidate.employerResponse ? <button className="hep-candidate-btn" type="button" disabled={candidateBusyId === activeCandidate.id} onClick={() => respondToCandidate(activeCandidate, "interview_requested")}>{tr("Request interview", "Noriu interviu")}</button> : null}
            <button className="hep-candidate-btn primary" type="button" disabled={candidateBusyId === activeCandidate.id} onClick={() => respondToCandidate(activeCandidate, "accepted")}>{tr("Approve candidate", "Patvirtinti kandidatą")}</button>
            <button className={`hep-candidate-btn danger ${activeCandidate.employerResponse === "not_suitable" ? "active" : ""}`} type="button" disabled={candidateBusyId === activeCandidate.id} onClick={() => { setRejectCandidateId(activeCandidate.id); setRejectReason(activeCandidate.rejectionReason || ""); }}>{tr("Reject", "Atmesti")}</button>
          </div>
        )}
      </div></div></div> : null}

      {activeCandidate && rejectCandidateId === activeCandidate.id ? <div className="hep-reject-overlay" role="dialog" aria-modal="true"><div className="hep-reject-card">
        <div className="hep-eyebrow">{tr("CANDIDATE DECISION", "SPRENDIMAS DĖL KANDIDATO")}</div>
        <h3>{tr("Why are you rejecting this candidate?", "Kodėl atmetate šį kandidatą?")}</h3>
        <p>{tr("Please give a short reason. Statybos24 will see it and use it to improve the next candidate selection.", "Trumpai nurodykite priežastį. Statybos24 ją matys ir galės tiksliau parinkti kitus kandidatus.")}</p>
        <textarea maxLength={1200} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={tr("e.g. insufficient experience, language level, availability...", "pvz. per maža patirtis, netinka kalbos lygis, negali pradėti reikiamu metu...")}/>
        <div className="hep-form-actions">
          <button className="hep-secondary" type="button" disabled={candidateBusyId === activeCandidate.id} onClick={() => { setRejectCandidateId(null); setRejectReason(""); }}>{tr("Cancel", "Atšaukti")}</button>
          <button className="hep-candidate-btn danger" type="button" disabled={candidateBusyId === activeCandidate.id || rejectReason.trim().length < 3} onClick={() => respondToCandidate(activeCandidate, "not_suitable", rejectReason)}>{candidateBusyId === activeCandidate.id ? tr("Saving...", "Saugoma...") : tr("Reject candidate", "Atmesti kandidatą")}</button>
        </div>
      </div></div> : null}

      {portal.account?.mustChangePassword ? <div className="hep-password-overlay"><div className="hep-password-card"><div className="hep-eyebrow">{tr("FIRST SIGN-IN", "PIRMAS PRISIJUNGIMAS")}</div><h2>{tr("Create your own password", "Susikurkite savo slaptažodį")}</h2><p>{tr("The password sent by Statybos24 is temporary. Set a private password before using the employer portal.", "Statybos24 atsiųstas slaptažodis yra laikinas. Prieš naudojantis darbdavio portalu susikurkite savo privatų slaptažodį.")}</p><label className="hep-field"><span>{tr("NEW PASSWORD", "NAUJAS SLAPTAŽODIS")}</span><input className="hep-input" type="password" value={password1} onChange={(e) => setPassword1(e.target.value)} placeholder={tr("At least 12 characters", "Bent 12 simbolių")}/></label><label className="hep-field" style={{marginTop:11}}><span>{tr("CONFIRM PASSWORD", "PAKARTOKITE SLAPTAŽODĮ")}</span><input className="hep-input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}/></label>{error ? <div className="hep-error" style={{marginTop:12}}>{error}</div> : null}<div className="hep-form-actions"><button className="hep-primary" type="button" disabled={saving} onClick={changePassword}>{saving ? <AppBootLoader compact label={tr("Saving...", "Saugoma...")} /> : tr("Save password & continue", "Išsaugoti slaptažodį ir tęsti")}</button></div></div></div> : null}
    </div>
  );
}
