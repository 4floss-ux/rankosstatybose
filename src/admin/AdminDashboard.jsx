import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { RoundedDateSelect, RoundedSelect, RoundedTimeSelect, StyledConfirmDialog, useStyledConfirm } from "../ui/common.jsx";
import { CityAutocomplete, canonicalCityName } from "../ui/location.jsx";
import { addPlatformDays, attendanceOutcomeLabel, formatJobTitle, formatNetPay, localDateISO, platformDateTime } from "../lib/jobs.js";
import { DisputeConversationModal } from "../chat/conversations.jsx";
import { longTermContractLabel, safeStorageFileName } from "../longterm/longTerm.jsx";
import { WorkerProfileModal } from "../worker/WorkerProfileModal.jsx";
import { DeleteAccountModal, deleteAccountThroughServer } from "../dashboard/shared.jsx";
import { EMPLOYER_TRIAL_DAYS, businessPresentationUrl, employerPlanName, reliabilityScoreColor } from "../employer/plans.js";
import { MonthlyAwardBadgeVisual, monthlyAwardMeta, monthlyAwardMetricText, monthlyAwardMonthLabel, monthlyAwardPreviousMonthISO } from "../awards/monthlyAwards.jsx";
import { workerAvatarUrl } from "../ui/avatars.jsx";
import { AdminCompanyTeamChatModal, AdminJobChatModal, AdminPrivateMessageComposer } from "./adminParts.jsx";
import { AdminWorkAbroadInterests } from "../worker/workAbroad.jsx";
import { P24Shell } from "../p24/Shell.jsx";
import { Svg } from "../p24/Shell.jsx";
import { Empty, PageHead } from "../p24/ui.jsx";
import { AdminPrivateChats } from "../p24/admin/AdminPrivateChats.jsx";
import { AdminJobAds } from "../p24/admin/AdminJobAds.jsx";
import { AdminAuditList, AdminAwardsList, AdminBugsList, AdminDisputesList, AdminEmployersList, AdminEmploymentList, AdminFilesList, AdminJobsList, AdminRatingsList, AdminTeamChatsList, AdminWorkersList } from "../p24/admin/AdminLists.jsx";

export function AdminDashboard({
  user,
  onLogout,
  onOpenWorker,
  onOpenEmployer,
  initialTab = "overview",
}) {
  const { dialog: confirmDialog, askConfirm, resolveConfirm } = useStyledConfirm();
  const [abroadProfile, setAbroadProfile] = useState(null);
  function openAbroadWorkerProfile(row) {
    const record = workers.find(item => item.user_id === row.user_id);
    if (!record) { setError("Nepavyko rasti darbuotojo profilio. Atnaujinkite administratoriaus duomenis."); return; }
    setAbroadProfile({
      id: record.user_id, name:record.display_name || row.display_name, initials:String(record.display_name || "D").split(" ").map(part=>part[0]).slice(0,2).join(""),
      city:record.city, yearsExperience:Number(record.years_experience || 0), hasDrivingLicenseB:Boolean(record.has_driving_license_b), shortBio:record.short_bio || "",
      avatarUrl:workerAvatarUrl(record.avatar_path), skillNames:Array.isArray(record.skill_names) ? record.skill_names : [],
      attendanceRate:record.attendance_rate, ratingAverage:record.rating_average, ratingCount:record.rating_count,
      publicStats:{monthWorkedDays:Number(record.month_worked_days || 0),monthWorkedMinutes:Number(record.month_worked_minutes || 0),monthJobs:Number(record.month_jobs || 0),activeJobs:Number(record.active_jobs || 0),cancelledByEmployer:Number(record.cancelled_by_employer || 0),attendanceRate:record.attendance_rate,ratingAverage:record.rating_average,ratingCount:record.rating_count,noShowCount:Number(record.no_show_count || 0),unexcusedEarlyLeaveCount:Number(record.unexcused_early_leave_count || 0)}
    });
  }
  const [activeTab, setActiveTab] = useState(() => initialTab === "foreignHire" ? "foreignHire" : "overview");
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const extraMenuRef = useRef(null);
  const extraMenuTriggerRef = useRef(null);
  // Close the custom admin menu when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!extraMenuOpen) return undefined;
    const onOutsidePointer = (event) => {
      if (!extraMenuRef.current?.contains(event.target)) setExtraMenuOpen(false);
    };
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      setExtraMenuOpen(false);
      extraMenuTriggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onOutsidePointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [extraMenuOpen]);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountDayStats,setAccountDayStats]=useState(null);
  const [accountDayError,setAccountDayError]=useState("");
  useEffect(()=>{
    if(activeTab!=="overview")return;
    let stopped=false,inFlight=false;
    async function loadDay(){
      if(stopped || inFlight || document.visibilityState!=="visible")return;
      inFlight=true;
      try{const result=await supabase.rpc("admin_get_account_day_stats");if(stopped)return;if(result.error){setAccountDayError(result.error.message);setAccountDayStats(null);}else{setAccountDayStats(result.data);setAccountDayError("");}}catch(e){if(!stopped){setAccountDayError(e.message||"Nepavyko įkelti dienos statistikos.");setAccountDayStats(null);}}finally{inFlight=false;}
    }
    loadDay();const interval=window.setInterval(loadDay,60000);document.addEventListener("visibilitychange",loadDay);
    return()=>{stopped=true;window.clearInterval(interval);document.removeEventListener("visibilitychange",loadDay);};
  },[activeTab,refreshing]);

  const [stats, setStats] = useState({});
  const [visitorAnalytics, setVisitorAnalytics] = useState({});
  const [disputes, setDisputes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [files, setFiles] = useState([]);
  const [teamChats, setTeamChats] = useState([]);
  const [longTermPlacements, setLongTermPlacements] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [siteBugReports, setSiteBugReports] = useState([]);
  const [foreignHireRequests, setForeignHireRequests] = useState([]);
  const [foreignHireSavingId, setForeignHireSavingId] = useState(null);
  const [foreignHireSetupRequest, setForeignHireSetupRequest] = useState(null);
  const [foreignHireSetupLogin, setForeignHireSetupLogin] = useState("");
  const [foreignHireSetupPassword, setForeignHireSetupPassword] = useState("");
  const [foreignHireAgreementFile, setForeignHireAgreementFile] = useState(null);
  const [foreignHireInvoices, setForeignHireInvoices] = useState({});
  const [foreignHireInvoiceBusyId, setForeignHireInvoiceBusyId] = useState(null);
  const [foreignHireInvoiceFeedback, setForeignHireInvoiceFeedback] = useState({});
  const [foreignHireSetupBusy, setForeignHireSetupBusy] = useState(false);
  const [foreignHireCredentials, setForeignHireCredentials] = useState(null);
  const [foreignHireCandidateOpenId, setForeignHireCandidateOpenId] = useState(null);
  const [foreignHireExpandedCandidateIds, setForeignHireExpandedCandidateIds] = useState({});
  const [foreignHireExpandedId, setForeignHireExpandedId] = useState(null);
  const [foreignHireMinimized, setForeignHireMinimized] = useState({});
  const [foreignHireCandidatesByRequest, setForeignHireCandidatesByRequest] = useState({});
  const [foreignHireCandidateLoadingId, setForeignHireCandidateLoadingId] = useState(null);
  const [foreignHireCandidateBusyId, setForeignHireCandidateBusyId] = useState(null);
  const [foreignHireWorkerQuery, setForeignHireWorkerQuery] = useState("");
  const [foreignHireWorkerResults, setForeignHireWorkerResults] = useState([]);
  const [foreignHireWorkerSearchBusy, setForeignHireWorkerSearchBusy] = useState(false);
  const [foreignHireCandidateProfession, setForeignHireCandidateProfession] = useState("");
  const [foreignHireExternalRequestId, setForeignHireExternalRequestId] = useState(null);
  const [foreignHireJobConfirmationOpenId, setForeignHireJobConfirmationOpenId] = useState(null);
  const [foreignHireJobConfirmationForm, setForeignHireJobConfirmationForm] = useState({
    employerName: "", projectLocation: "", profession: "", startDate: "", salary: "",
    schedule: "", accommodation: "", travel: "", notes: "",
  });
  const [foreignHireExternalForm, setForeignHireExternalForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "",
    ageYears: "",
    yearsExperience: "",
    skills: "",
    languageDetails: "",
    hasDrivingLicenseB: false,
    needsAccommodation: null,
    availableFrom: "",
    sourceDetail: "",
    recruiterNote: "",
  });
  const [foreignHireExternalCvFile, setForeignHireExternalCvFile] = useState(null);
  const [foreignHireExternalSignedAgreementFile, setForeignHireExternalSignedAgreementFile] = useState(null);
  const [monthlyAwardLeaders, setMonthlyAwardLeaders] = useState([]);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [resolvingBugId, setResolvingBugId] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [actionDays, setActionDays] = useState(7);
  const [actionReason, setActionReason] = useState("");
  const [actionConfirm, setActionConfirm] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState({});
  const [deletingRatingId, setDeletingRatingId] = useState(null);
  const [editor, setEditor] = useState(null);
  const [adminConversation, setAdminConversation] = useState(null);
  const [adminTeamConversation, setAdminTeamConversation] = useState(null);
  const [adminDisputeConversation, setAdminDisputeConversation] = useState(null);
  const [adminMessageTarget, setAdminMessageTarget] = useState(null);
  const [editorForm, setEditorForm] = useState({});
  const [editorSaving, setEditorSaving] = useState(false);
  const [adminPage, setAdminPage] = useState(1);

  const activeSiteBugCount = siteBugReports.filter(
    (report) => report.status === "active"
  ).length;
  const activeDisputeCount = disputes.filter(
    (dispute) => !dispute?.dispute_status || dispute.dispute_status === "disputed"
  ).length;
  const foreignHireAlertCount = foreignHireRequests.filter((request) => {
    if (request.status === "closed" || request.status === "declined") return false;
    const candidates = foreignHireCandidatesByRequest[request.request_id];
    if (["new", "employer_submitted"].includes(request.status)) return true;
    if (!candidates) return Number(request.employer_interview_requested_count || 0) > 0 || Number(request.employer_accepted_count || 0) > 0;
    return candidates.some((candidate) =>
      (candidate.employer_response === "interview_requested" && !candidate.employer_contact_shared_at) ||
      (candidate.employer_response === "accepted" && !["hired", "started", "withdrawn", "rejected"].includes(candidate.status))
    );
  }).length;

  const presentationLink = businessPresentationUrl();

  async function copyBusinessPresentationLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(presentationLink);
      } else {
        const input = document.createElement("textarea");
        input.value = presentationLink;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setNotice("Įmonių pristatymo nuoroda nukopijuota.");
    } catch {
      setError("Nepavyko automatiškai nukopijuoti nuorodos. Nukopijuokite ją rankiniu būdu.");
    }
  }

  function openBusinessPresentation() {
    window.open(presentationLink, "_blank", "noopener,noreferrer");
  }

  const tabs = [
    ["overview", "Suvestinė"],
    ["workers", "Darbuotojai"],
    ["workAbroadInterest", "Domisi darbu užsienyje"],
    ["employers", "Darbdaviai"],
    ["jobs", "Darbai"],
    ["jobAds", "Darbo skelbimai"],
    ["employment", `Įdarbinti darbuotojai${longTermPlacements.filter((item) => item.status === "active").length ? ` (${longTermPlacements.filter((item) => item.status === "active").length})` : ""}`],
    ["teamChats", "Vadovų pokalbiai"],
    ["disputes", `Ginčai${activeDisputeCount ? ` (${activeDisputeCount})` : ""}`],
    ["ratings", "Atsiliepimai"],
    ["monthlyAwards", "Mėnesio geriausi"],
    ["audit", "Veiksmų istorija"],
    ["files", "Failai"],
    ["bugs", `Svetainės klaidos${activeSiteBugCount ? ` (${activeSiteBugCount})` : ""}`],
    ["foreignHire", `Tarptautinė atranka${foreignHireAlertCount ? ` (${foreignHireAlertCount})` : ""}`],
  ];
  // The admin bar shows the three essential sections and one compact selector.
  // The original tab keys and their content remain unchanged.
  const mainAdminTabs = ["overview", "workers", "employers"];
  const extraAdminTabs = tabs.filter(([key]) => !mainAdminTabs.includes(key));
  const extraSectionActive = !mainAdminTabs.includes(activeTab);

  function handleExtraMenuKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(extraMenuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    if (!extraMenuOpen) {
      event.preventDefault();
      setExtraMenuOpen(true);
      window.requestAnimationFrame(() => extraMenuRef.current?.querySelector('[role="menuitem"]')?.focus());
      return;
    }
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? items.length - 1
      : event.key === "ArrowDown" ? (currentIndex + 1) % items.length
      : (currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length);
    items[nextIndex]?.focus();
  }

  useEffect(() => {
    loadAdminData();

    const timer = setInterval(() => {
      loadAdminData(true).catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!foreignHireCandidateOpenId) return undefined;

    const refreshCandidates = () => {
      loadForeignHireCandidates(foreignHireCandidateOpenId, true).catch(() => {});
    };

    refreshCandidates();
    const timer = window.setInterval(refreshCandidates, 10000);
    return () => window.clearInterval(timer);
  }, [foreignHireCandidateOpenId]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setAdminPage(1);
  }, [activeTab]);

  async function createSafeFileUrl(bucketId, storagePath) {
    if (!bucketId || !storagePath) return null;

    const signedResult = await supabase.storage
      .from(bucketId)
      .createSignedUrl(storagePath, 60 * 60);

    return signedResult.error
      ? null
      : signedResult.data?.signedUrl || null;
  }

  async function loadAdminData(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        statsResult,
        visitorAnalyticsResult,
        disputesResult,
        workersResult,
        employersResult,
        jobsResult,
        ratingsResult,
        filesResult,
        teamChatsResult,
        longTermPlacementsResult,
        auditResult,
        siteBugReportsResult,
        foreignHireRequestsResult,
        monthlyAwardsResult,
      ] = await Promise.all([
        supabase.rpc("get_admin_dashboard_stats"),
        supabase.rpc("get_admin_visitor_analytics", { p_days: 14 }),
        supabase.rpc("get_attendance_disputes"),
        supabase.rpc("get_admin_workers"),
        supabase.rpc("get_admin_employers"),
        supabase.rpc("get_admin_jobs"),
        supabase.rpc("get_admin_ratings"),
        supabase.rpc("get_admin_files"),
        supabase.rpc("get_admin_company_team_chats"),
        supabase.rpc("get_admin_long_term_placements"),
        supabase.rpc("get_admin_audit_log"),
        supabase.rpc("get_admin_site_bug_reports"),
        supabase.rpc("get_admin_foreign_hire_requests"),
        supabase.rpc("get_admin_monthly_awards"),
      ]);

      const failed = [
        statsResult,
        disputesResult,
        workersResult,
        employersResult,
        jobsResult,
        ratingsResult,
        filesResult,
        teamChatsResult,
        longTermPlacementsResult,
        auditResult,
        siteBugReportsResult,
        foreignHireRequestsResult,
        monthlyAwardsResult,
      ].find((result) => result.error);

      if (failed?.error) throw failed.error;

      const disputeRows = await Promise.all(
        (disputesResult.data || []).map(async (row) => ({
          ...row,
          evidenceUrl: row.worker_evidence_path
            ? await createSafeFileUrl(
                "attendance-evidence",
                row.worker_evidence_path
              )
            : null,
        }))
      );

      const fileRows = await Promise.all(
        (filesResult.data || []).map(async (row) => ({
          ...row,
          signedUrl: await createSafeFileUrl(
            row.bucket_id,
            row.storage_path
          ),
        }))
      );

      const { data: invoiceRows, error: invoiceLoadError } = await supabase.rpc("admin_get_foreign_hire_invoices");
      if (invoiceLoadError) throw invoiceLoadError;
      setForeignHireInvoices(Object.fromEntries((invoiceRows || []).map((invoice) => [invoice.request_id, invoice])));

      const foreignHireRows = await Promise.all(
        (foreignHireRequestsResult.data || []).map(async (row) => ({
          ...row,
          agreementUrl: row.agreement_path
            ? await createSafeFileUrl("foreign-hire-contracts", row.agreement_path)
            : null,
          signedAgreementUrl: row.signed_agreement_path
            ? await createSafeFileUrl("foreign-hire-contracts", row.signed_agreement_path)
            : null,
          employmentContractUrl: row.employment_contract_path
            ? await createSafeFileUrl("foreign-hire-contracts", row.employment_contract_path)
            : null,
        }))
      );

      setStats(statsResult.data || {});
      if (!visitorAnalyticsResult.error) {
        setVisitorAnalytics(visitorAnalyticsResult.data || {});
      }
      setDisputes(disputeRows);
      setWorkers(workersResult.data || []);
      setEmployers(employersResult.data || []);
      setJobs(jobsResult.data || []);
      setRatings(ratingsResult.data || []);
      setFiles(fileRows);
      setTeamChats(teamChatsResult.data || []);
      setLongTermPlacements(longTermPlacementsResult.data || []);
      setAuditLog(auditResult.data || []);
      setSiteBugReports(siteBugReportsResult.data || []);
      setForeignHireRequests(foreignHireRows);
      setMonthlyAwardLeaders(monthlyAwardsResult.data || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti administratoriaus duomenų.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateForeignHireRequestStatus(request, status) {
    if (!request?.request_id || !status || foreignHireSavingId) return;
    setForeignHireSavingId(request.request_id);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_update_foreign_hire_request", {
        p_request_id: request.request_id,
        p_status: status,
        p_internal_note: request.internal_note || null,
      });
      if (result.error) throw result.error;
      setNotice(
        status === "under_review"
          ? "Tarptautinė užklausa pažymėta peržiūrima."
          : status === "declined"
          ? "Tarptautinė užklausa atmesta."
          : "Tarptautinės užklausos būsena atnaujinta."
      );
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko atnaujinti tarptautinės užklausos.");
    } finally {
      setForeignHireSavingId(null);
    }
  }

  async function deleteForeignHireRequest(request) {
    if (!request?.request_id || foreignHireSavingId) return;
    const ok = await askConfirm({
      eyebrow: "TARPTAUTINĖ ATRANKA",
      title: "Ištrinti užklausą visam laikui?",
      message: `Bus negrįžtamai ištrinta užklausa #${String(request.request_id).slice(0,8).toUpperCase()}, darbdavio prieiga, sutartys, pilnas brief'as, kandidatai ir jų dabartiniai dokumentai.`,
      confirmLabel: "Ištrinti visam laikui",
      tone: "danger",
    });
    if (!ok) return;

    setForeignHireSavingId(request.request_id);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_delete_foreign_hire_request", { p_request_id: request.request_id });
      if (result.error) throw result.error;
      const contractPaths = Array.isArray(result.data?.contractPaths) ? result.data.contractPaths.filter(Boolean) : [];
      const candidatePaths = Array.isArray(result.data?.candidatePaths) ? result.data.candidatePaths.filter(Boolean) : [];
      let fileWarning = false;
      if (contractPaths.length) {
        const removed = await supabase.storage.from("foreign-hire-contracts").remove(contractPaths);
        if (removed.error) fileWarning = true;
      }
      if (candidatePaths.length) {
        const removed = await supabase.storage.from("foreign-hire-candidates").remove(candidatePaths);
        if (removed.error) fileWarning = true;
      }
      setForeignHireExpandedId(null);
      setForeignHireCandidateOpenId(null);
      setForeignHireCandidatesByRequest((current) => { const next = { ...current }; delete next[request.request_id]; return next; });
      setNotice(fileWarning ? "Užklausa ir visi jos duomenys ištrinti. Nepavyko pašalinti vieno ar kelių nebeprieinamų saugyklos failų." : "Užklausa, prieiga, kandidatai ir susiję dokumentai ištrinti visam laikui.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko ištrinti tarptautinės užklausos.");
    } finally {
      setForeignHireSavingId(null);
    }
  }

  function foreignHireStatusLabel(status) {
    return ({
      new: "Nauja",
      under_review: "Peržiūrima",
      access_preparing: "Ruošiama prieiga",
      waiting_employer: "Laukiama sutarties ir informacijos",
      employer_submitted: "Darbdavys pateikė",
      ready_for_sourcing: "Paruošta paieškai",
      sourcing: "Vyksta paieška",
      declined: "Atmesta",
      closed: "Uždaryta",
    })[status] || status || "—";
  }

  function foreignHireCandidateStatusLabel(status) {
    return ({
      found: "Rastas",
      contacted: "Susisiekta",
      interested: "Domisi",
      screening: "Tikrinamas",
      ready_to_present: "Paruoštas pateikti",
      presented: "Pateiktas darbdaviui",
      interview: "Interviu",
      offer: "Pasiūlymas",
      hired: "Įdarbintas",
      started: "Pradėjo dirbti",
      rejected: "Atmestas",
      withdrawn: "Pasitraukė",
    })[status] || status || "—";
  }

  function foreignHireCandidateAgreementLabel(status) {
    return ({
      not_prepared: "Neparuošta",
      waiting_signature: "Laukiama kandidato parašo",
      signed_uploaded: "Pasirašyta įkelta",
      approved: "Patvirtinta",
      rejected: "Reikia pataisyti",
    })[status] || status || "—";
  }

  function foreignHireEmployerResponseLabel(response) {
    return ({
      interested: "Domina",
      interview_requested: "Prašo interviu",
      accepted: "Kandidatas patvirtintas",
      not_suitable: "Netinka",
    })[response] || "Laukiama atsakymo";
  }

  async function shareForeignHireCandidateEmail(candidate) {
    if (!candidate?.candidate_id || foreignHireCandidateBusyId) return;
    const ok = await askConfirm({
      eyebrow: "KANDIDATO KONTAKTAS",
      title: "Perduoti kandidato el. paštą darbdaviui?",
      message: `Darbdavio portale bus parodytas ${candidate.full_name || "kandidato"} el. paštas. Telefono numeris nebus perduotas.`,
      confirmLabel: "Perduoti el. paštą",
    });
    if (!ok) return;
    setForeignHireCandidateBusyId(candidate.candidate_id);
    setError("");
    try {
      const result = await supabase.rpc("admin_share_foreign_candidate_email", {
        p_candidate_id: candidate.candidate_id,
      });
      if (result.error) throw result.error;
      setNotice("Kandidato el. paštas perduotas darbdaviui. Telefono numeris lieka privatus.");
      await loadForeignHireCandidates(candidate.request_id, true);
    } catch (err) {
      setError(err?.message || "Nepavyko perduoti kandidato el. pašto.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }


  async function deleteForeignHireCandidate(candidate) {
    if (!candidate?.candidate_id || foreignHireCandidateBusyId) return;
    const ok = await askConfirm({
      eyebrow: "KANDIDATAS",
      title: "Ištrinti kandidatą visam laikui?",
      message: `Bus negrįžtamai ištrintas ${candidate.full_name || "kandidatas"}, jo CV, sutartys, darbdavio sprendimai ir visa su šia atranka susijusi kandidato informacija.`,
      confirmLabel: "Ištrinti kandidatą",
      tone: "danger",
    });
    if (!ok) return;

    setForeignHireCandidateBusyId(candidate.candidate_id);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_delete_foreign_hire_candidate", {
        p_candidate_id: candidate.candidate_id,
      });
      if (result.error) throw result.error;

      const candidatePaths = Array.isArray(result.data?.candidatePaths)
        ? result.data.candidatePaths.filter(Boolean)
        : [];
      let fileWarning = false;
      if (candidatePaths.length) {
        const removed = await supabase.storage.from("foreign-hire-candidates").remove(candidatePaths);
        if (removed.error) fileWarning = true;
      }

      setForeignHireCandidatesByRequest((current) => ({
        ...current,
        [candidate.request_id]: (current[candidate.request_id] || []).filter((item) => item.candidate_id !== candidate.candidate_id),
      }));
      if (foreignHireJobConfirmationOpenId === candidate.candidate_id) setForeignHireJobConfirmationOpenId(null);
      setNotice(
        fileWarning
          ? "Kandidatas ištrintas. Vieno ar kelių nebeprieinamų failų nepavyko pašalinti iš saugyklos."
          : "Kandidatas ir jo dokumentai ištrinti visam laikui."
      );
      await loadAdminData(true);
      await loadForeignHireCandidates(candidate.request_id, true);
    } catch (err) {
      setError(err?.message || "Nepavyko ištrinti kandidato.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  async function uploadForeignHireEmploymentAgreement(request, candidate, file) {
    if (!candidate?.candidate_id || !file || foreignHireCandidateBusyId) return;
    const validationError = validateForeignCandidateDocument(file);
    if (validationError) { setError(validationError); return; }
    if (candidate.employer_response !== "accepted") {
      setError("Darbdavys pirmiausia turi patvirtinti kandidatą.");
      return;
    }
    setForeignHireCandidateBusyId(candidate.candidate_id);
    setError("");
    let newPath = "";
    try {
      // The signed employment agreement is distinct from the Statybos24 intermediary agreement.
      // Store it in the private candidate bucket and associate it with this candidate's confirmation.
      newPath = `${candidate.request_id}/${candidate.candidate_id}/employment-agreement/${Date.now()}-${safeStorageFileName(file.name)}`;
      const upload = await supabase.storage.from("foreign-hire-candidates").upload(newPath, file, {
        upsert: false, contentType: file.type || "application/octet-stream",
      });
      if (upload.error) throw upload.error;
      const wd = request?.brief_workforce_details || {};
      const previous = candidate.job_confirmation || {};
      const confirmation = {
        ...previous,
        employerName: previous.employerName || request?.company_name || "",
        projectLocation: previous.projectLocation || [wd.projectLocation, wd.projectCountry].filter(Boolean).join(", "),
        profession: previous.profession || candidate.profession || "",
        startDate: previous.startDate || wd.startDate || request?.requested_start_date || "",
        salary: previous.salary || [wd.salaryAmount || wd.salaryMin, wd.salaryCurrency, wd.salaryBasis].filter(Boolean).join(" "),
        signedEmploymentAgreementPath: newPath,
        signedEmploymentAgreementName: file.name,
        signedEmploymentAgreementUploadedAt: new Date().toISOString(),
      };
      // Reuse the existing admin-only confirmation RPC: no additional public file URL or grant.
      const result = await supabase.rpc("admin_prepare_foreign_candidate_job_confirmation", {
        p_candidate_id: candidate.candidate_id,
        p_confirmation: confirmation,
      });
      if (result.error) throw result.error;
      // Abiejų šalių pasirašyta darbo sutartis yra kandidato sutikimo įrodymas.
      // Išlaikome esamą backend būseną, bet papildomo admin mygtuko nebereikia.
      const consentResult = await supabase.rpc("admin_confirm_foreign_candidate_job_confirmation", {
        p_candidate_id: candidate.candidate_id,
      });
      setNotice(consentResult.error
        ? "Pasirašyta darbo sutartis įkelta, tačiau automatiškai pažymėti patvirtinimo nepavyko: " + consentResult.error.message
        : "Pasirašyta darbo sutartis įkelta ir sutikimas užfiksuotas.");
      await loadForeignHireCandidates(candidate.request_id, true);
      if (previous.signedEmploymentAgreementPath && previous.signedEmploymentAgreementPath !== newPath) {
        try { await supabase.storage.from("foreign-hire-candidates").remove([previous.signedEmploymentAgreementPath]); } catch (_) {}
      }
    } catch (err) {
      if (newPath) {
        try { await supabase.storage.from("foreign-hire-candidates").remove([newPath]); } catch (_) {}
      }
      setError(err?.message || "Nepavyko įkelti pasirašytos darbo sutarties.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  function foreignHireCandidateNext(status) {
    return ({
      found: ["contacted", "Pažymėti susisiekta"],
      contacted: ["interested", "Kandidatas domisi"],
      interested: ["screening", "Pradėti patikrą"],
      screening: ["ready_to_present", "Paruoštas pateikti"],
      ready_to_present: ["presented", "Pateikti darbdaviui"],
      presented: ["interview", "Interviu"],
      interview: ["offer", "Pasiūlymas"],
      offer: ["hired", "Įdarbinti"],
      hired: ["started", "Pradėjo dirbti"],
    })[status] || null;
  }

  async function loadForeignHireCandidates(requestId, silent = false) {
    if (!requestId) return;
    if (!silent) setForeignHireCandidateLoadingId(requestId);
    try {
      const result = await supabase.rpc("admin_get_foreign_hire_candidates", {
        p_request_id: requestId,
      });
      if (result.error) throw result.error;
      const rows = await Promise.all(
        (result.data || []).map(async (row) => ({
          ...row,
          cvUrl: row.cv_path
            ? await createSafeFileUrl("foreign-hire-candidates", row.cv_path)
            : null,
          candidateAgreementUrl: row.candidate_agreement_path
            ? await createSafeFileUrl("foreign-hire-candidates", row.candidate_agreement_path)
            : null,
          candidateSignedAgreementUrl: row.candidate_signed_agreement_path
            ? await createSafeFileUrl("foreign-hire-candidates", row.candidate_signed_agreement_path)
            : null,
          signedEmploymentAgreementUrl: row.job_confirmation?.signedEmploymentAgreementPath
            ? await createSafeFileUrl("foreign-hire-candidates", row.job_confirmation.signedEmploymentAgreementPath)
            : null,
        }))
      );
      setForeignHireCandidatesByRequest((current) => ({
        ...current,
        [requestId]: rows,
      }));
      return rows;
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti kandidatų.");
    } finally {
      if (!silent) setForeignHireCandidateLoadingId(null);
    }
  }

  async function openForeignHireAcceptedCandidates(request) {
    if (!request?.request_id) return;
    setForeignHireCandidateOpenId(request.request_id);
    setForeignHireExternalRequestId(null);
    const rows = await loadForeignHireCandidates(request.request_id);
    if (Array.isArray(rows)) {
      const accepted = rows.filter((candidate) => candidate.employer_response === "accepted" && !["hired", "started"].includes(candidate.status));
      setForeignHireExpandedCandidateIds((current) => ({
        ...current,
        ...Object.fromEntries(accepted.map((candidate) => [candidate.candidate_id, true])),
      }));
    }
    requestAnimationFrame(() => {
      document.getElementById(`foreign-hire-candidates-${request.request_id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function openForeignHireInterviewCandidates(request) {
    if (!request?.request_id) return;
    // An alert is always an "open" action, never a toggle that closes the list.
    setForeignHireCandidateOpenId(request.request_id);
    setForeignHireExternalRequestId(null);
    const rows = await loadForeignHireCandidates(request.request_id);
    if (Array.isArray(rows)) {
      const matching = rows.filter((candidate) => candidate.employer_response === "interview_requested" && !candidate.employer_contact_shared_at);
      if (matching.length) {
        setForeignHireExpandedCandidateIds((current) => ({
          ...current,
          ...Object.fromEntries(matching.map((candidate) => [candidate.candidate_id, true])),
        }));
      }
    }
    requestAnimationFrame(() => {
      document.getElementById(`foreign-hire-candidates-${request.request_id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function toggleForeignHireCandidates(request) {
    if (!request?.request_id) return;
    if (foreignHireCandidateOpenId === request.request_id) {
      setForeignHireCandidateOpenId(null);
      setForeignHireWorkerResults([]);
      setForeignHireExternalRequestId(null);
      return;
    }

    const defaultProfession =
      request.brief_workforce_details?.roles?.[0]?.profession ||
      request.roles?.[0]?.profession ||
      "";
    setForeignHireCandidateOpenId(request.request_id);
    setForeignHireCandidateProfession(defaultProfession);
    setForeignHireWorkerQuery("");
    setForeignHireWorkerResults([]);
    setForeignHireExternalRequestId(null);
    await loadForeignHireCandidates(request.request_id);
  }

  async function searchForeignHireWorkers() {
    if (!foreignHireCandidateOpenId || foreignHireWorkerSearchBusy) return;
    setForeignHireWorkerSearchBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("admin_search_foreign_hire_workers", {
        p_query: foreignHireWorkerQuery.trim(),
        p_limit: 50,
      });
      if (result.error) throw result.error;
      setForeignHireWorkerResults(result.data || []);
      if (!(result.data || []).length) {
        setNotice("Pagal šią paiešką Statybos24 bazėje darbuotojų nerasta.");
      }
    } catch (err) {
      setError(err?.message || "Nepavyko atlikti darbuotojų paieškos.");
    } finally {
      setForeignHireWorkerSearchBusy(false);
    }
  }

  async function addPlatformForeignHireCandidate(worker) {
    if (!foreignHireCandidateOpenId || !worker?.user_id || foreignHireCandidateBusyId) return;
    const profession = foreignHireCandidateProfession.trim();
    if (!profession) {
      setError("Nurodykite profesiją, kuriai priskiriate kandidatą.");
      return;
    }
    setForeignHireCandidateBusyId(worker.user_id);
    setError("");
    try {
      const result = await supabase.rpc("admin_add_platform_foreign_hire_candidate", {
        p_request_id: foreignHireCandidateOpenId,
        p_worker_id: worker.user_id,
        p_profession: profession,
        p_recruiter_note: null,
      });
      if (result.error) throw result.error;
      setNotice(`${worker.display_name || "Darbuotojas"} pridėtas prie tarptautinės atrankos.`);
      await loadForeignHireCandidates(foreignHireCandidateOpenId, true);
    } catch (err) {
      setError(err?.message || "Nepavyko pridėti darbuotojo.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  function openExternalForeignHireCandidate(request) {
    const profession =
      foreignHireCandidateProfession ||
      request?.brief_workforce_details?.roles?.[0]?.profession ||
      request?.roles?.[0]?.profession ||
      "";
    setForeignHireExternalRequestId(request?.request_id || null);
    setForeignHireExternalForm({
      fullName: "",
      email: "",
      phone: "",
      profession,
      ageYears: "",
      yearsExperience: "",
      skills: "",
      languageDetails: "",
      hasDrivingLicenseB: false,
      needsAccommodation: null,
      availableFrom: "",
      salaryExpectation: "",
      sourceDetail: "",
      recruiterNote: "",
    });
    setForeignHireExternalCvFile(null);
    setForeignHireExternalSignedAgreementFile(null);
  }

  async function saveExternalForeignHireCandidate() {
    if (!foreignHireExternalRequestId || foreignHireCandidateBusyId) return;
    const activeRequest = foreignHireRequests.find((request) => request.request_id === foreignHireExternalRequestId);
    if (!activeRequest || activeRequest.status === "closed") {
      setError("Paieška uždaryta. Naujo kandidato pridėti negalima.");
      return;
    }
    if (!foreignHireExternalForm.fullName.trim() || !foreignHireExternalForm.profession.trim()) {
      setError("Nurodykite kandidato vardą, pavardę ir profesiją.");
      return;
    }
    if (foreignHireExternalForm.ageYears && (Number(foreignHireExternalForm.ageYears) < 18 || Number(foreignHireExternalForm.ageYears) > 80)) {
      setError("Nurodykite tinkamą kandidato amžių.");
      return;
    }
    for (const candidateFile of [foreignHireExternalCvFile, foreignHireExternalSignedAgreementFile].filter(Boolean)) {
      const validationError = validateForeignCandidateDocument(candidateFile);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setForeignHireCandidateBusyId("external");
    setError("");
    try {
      const requestId = foreignHireExternalRequestId;
      const result = await supabase.rpc("admin_add_external_foreign_hire_candidate", {
        p_request_id: requestId,
        p_full_name: foreignHireExternalForm.fullName.trim(),
        p_email: foreignHireExternalForm.email.trim() || null,
        p_phone: foreignHireExternalForm.phone.trim() || null,
        p_profession: foreignHireExternalForm.profession.trim(),
        p_age_years: foreignHireExternalForm.ageYears ? Number(foreignHireExternalForm.ageYears) : null,
        p_years_experience: foreignHireExternalForm.yearsExperience
          ? Number(foreignHireExternalForm.yearsExperience)
          : null,
        p_skills: foreignHireExternalForm.skills.trim() || null,
        p_language_details: foreignHireExternalForm.languageDetails.trim() || null,
        p_has_driving_license_b: !!foreignHireExternalForm.hasDrivingLicenseB,
        p_needs_accommodation: foreignHireExternalForm.needsAccommodation,
        p_available_from: foreignHireExternalForm.availableFrom || null,
        p_salary_expectation: null,
        p_source_detail: foreignHireExternalForm.sourceDetail.trim() || null,
        p_recruiter_note: foreignHireExternalForm.recruiterNote.trim() || null,
      });
      if (result.error) throw result.error;

      const candidateId = result.data;
      let cvUploadFailed = false;
      if (foreignHireExternalCvFile && candidateId) {
        const file = foreignHireExternalCvFile;
        const storagePath = `${requestId}/${candidateId}/cv/${Date.now()}-${safeStorageFileName(file.name)}`;
        const uploadResult = await supabase.storage
          .from("foreign-hire-candidates")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadResult.error) {
          cvUploadFailed = true;
        } else {
          const documentResult = await supabase.rpc("admin_set_foreign_candidate_document", {
            p_candidate_id: candidateId,
            p_document_type: "cv",
            p_path: storagePath,
            p_name: file.name,
          });
          if (documentResult.error) {
            cvUploadFailed = true;
            try { await supabase.storage.from("foreign-hire-candidates").remove([storagePath]); } catch {}
          }
        }
      }

      let agreementUploadFailed = false;
      if (foreignHireExternalSignedAgreementFile && candidateId) {
        const file = foreignHireExternalSignedAgreementFile;
        const storagePath = `${requestId}/${candidateId}/signed_agreement/${Date.now()}-${safeStorageFileName(file.name)}`;
        const uploadResult = await supabase.storage.from("foreign-hire-candidates")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream" });
        if (uploadResult.error) {
          agreementUploadFailed = true;
        } else {
          const documentResult = await supabase.rpc("admin_set_foreign_candidate_document", {
            p_candidate_id: candidateId,
            p_document_type: "signed_agreement",
            p_path: storagePath,
            p_name: file.name,
          });
          if (documentResult.error) {
            agreementUploadFailed = true;
            try { await supabase.storage.from("foreign-hire-candidates").remove([storagePath]); } catch {}
          }
        }
      }

      setNotice(
        agreementUploadFailed || cvUploadFailed
          ? `Kandidatas pridėtas, tačiau nepavyko įkelti: ${[cvUploadFailed ? "CV" : "", agreementUploadFailed ? "pasirašytos tarpininkavimo sutarties" : ""].filter(Boolean).join(" ir ")}. Galite bandyti dar kartą kandidato kortelėje.`
          : "Kandidatas pridėtas su visa pateikta informacija."
      );
      setForeignHireExternalRequestId(null);
      setForeignHireExternalCvFile(null);
      setForeignHireExternalSignedAgreementFile(null);
      await loadForeignHireCandidates(foreignHireCandidateOpenId, true);
    } catch (err) {
      setError(err?.message || "Nepavyko pridėti kandidato.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  async function updateForeignHireCandidateStatus(candidate, status, confirmConsent = false) {
    if (!candidate?.candidate_id || !status || foreignHireCandidateBusyId) return;
    if (["hired", "started"].includes(status) && !candidate.job_confirmation?.signedEmploymentAgreementPath) {
      setError("Pirmiausia įkelkite darbdavio ir darbuotojo pasirašytą darbo sutartį.");
      return;
    }
    if (["hired", "started"].includes(status) && (!candidate.candidate_job_confirmed_at || !candidate.candidate_signed_agreement_path || !["signed_uploaded", "approved"].includes(candidate.candidate_agreement_status) || candidate.employer_response !== "accepted")) {
      setError("Įdarbinimui būtinas darbdavio patvirtinimas, pasirašyta tarpininkavimo sutartis ir užfiksuotas darbo sutarties patvirtinimas.");
      return;
    }
    setForeignHireCandidateBusyId(candidate.candidate_id);
    setError("");
    try {
      const result = await supabase.rpc("admin_update_foreign_hire_candidate_status", {
        p_candidate_id: candidate.candidate_id,
        p_status: status,
        p_confirm_consent: !!confirmConsent,
      });
      if (result.error) throw result.error;
      setNotice(
        confirmConsent
          ? "Kandidato sutikimas perduoti profilį konkrečiam darbdaviui pažymėtas."
          : `Kandidato būsena: ${foreignHireCandidateStatusLabel(status)}.`
      );
      await loadForeignHireCandidates(candidate.request_id, true);
      if (["hired", "started"].includes(status)) await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko atnaujinti kandidato būsenos.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  function validateForeignCandidateDocument(file) {
    if (!file) return "Pasirinkite failą.";
    const lowerName = String(file.name || "").toLowerCase();
    const allowed =
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx");
    if (!allowed) return "Failas turi būti PDF arba DOCX formato.";
    if (file.size > 15 * 1024 * 1024) return "Failas negali būti didesnis nei 15 MB.";
    return "";
  }

  async function uploadForeignCandidateDocument(candidate, documentType, file) {
    if (!candidate?.candidate_id || !file || foreignHireCandidateBusyId) return;
    const validationError = validateForeignCandidateDocument(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setForeignHireCandidateBusyId(candidate.candidate_id);
    setError("");
    let storagePath = "";
    try {
      storagePath = `${candidate.request_id}/${candidate.candidate_id}/${documentType}/${Date.now()}-${safeStorageFileName(file.name)}`;
      const uploadResult = await supabase.storage
        .from("foreign-hire-candidates")
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
      if (uploadResult.error) throw uploadResult.error;

      const result = await supabase.rpc("admin_set_foreign_candidate_document", {
        p_candidate_id: candidate.candidate_id,
        p_document_type: documentType,
        p_path: storagePath,
        p_name: file.name,
      });
      if (result.error) throw result.error;

      setNotice(
        documentType === "cv"
          ? "Kandidato CV įkeltas."
          : documentType === "agreement"
          ? "Kandidato sutartis įkelta."
          : "Kandidato pasirašyta sutartis įkelta."
      );
      await loadForeignHireCandidates(candidate.request_id, true);
    } catch (err) {
      if (storagePath) {
        try {
          await supabase.storage.from("foreign-hire-candidates").remove([storagePath]);
        } catch (_) {}
      }
      setError(err?.message || "Nepavyko įkelti kandidato dokumento.");
    } finally {
      setForeignHireCandidateBusyId(null);
    }
  }

  function renderForeignHireCandidatePanel(request, candidates) {
    const loadingCandidates = foreignHireCandidateLoadingId === request.request_id;
    const externalOpen = foreignHireExternalRequestId === request.request_id;
    const roles = request.brief_workforce_details?.roles || [];
    const required = Array.isArray(roles) ? roles.reduce((total, role) => total + Math.max(1, Number(role?.count) || 1), 0) : 0;
    const hired = candidates.filter((candidate) => ["hired", "started"].includes(candidate.status)).length;
    const hiringComplete = request.status === "closed" || (required > 0 && hired >= required);

    return (
      <div className="admin-candidate-zone" id={`foreign-hire-candidates-${request.request_id}`} style={{ scrollMarginTop: 100 }}>
        <div className="admin-candidate-zone-head">
          <div>
            <strong>Kandidatai</strong>
            <span>Čia kandidatą tiesiog pridedame rankiniu būdu ir toliau valdome jo eigą.</span>
          </div>
          <button className="admin-small-btn" type="button" disabled={hiringComplete} title={hiringComplete ? "Visi reikalingi darbuotojai įdarbinti. Paieška uždaryta." : undefined} onClick={() => { if (!hiringComplete) openExternalForeignHireCandidate(request); }} style={{ background: hiringComplete ? "#e8eef0" : "#222631", color: hiringComplete ? "#647583" : "#fff", borderColor: hiringComplete ? "#d5dfe4" : "#222631", cursor: hiringComplete ? "not-allowed" : "pointer" }}>
            {hiringComplete ? "Darbuotojai surinkti" : "+ Pridėti kandidatą"}
          </button>
        </div>

        <div className="admin-candidate-tools">
            {externalOpen && !hiringComplete ? (
              <div className="admin-external-form">
                <div className="admin-candidate-zone-head">
                  <div>
                    <strong>Pridėti kandidatą</strong>
                    <span>Įveskite kandidato informaciją. Šaltinį galite nurodyti, jei norite.</span>
                  </div>
                </div>
                <div className="admin-external-grid" style={{ marginTop: 10 }}>
                  <div className="admin-external-field"><label>Vardas, pavardė *</label><input value={foreignHireExternalForm.fullName} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, fullName: event.target.value }))} /></div>
                  <div className="admin-external-field"><label>Profesija *</label><input value={foreignHireExternalForm.profession} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, profession: event.target.value }))} /></div>
                  <div className="admin-external-field"><label>Amžius</label><input inputMode="numeric" value={foreignHireExternalForm.ageYears} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, ageYears: event.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))} placeholder="Pvz. 34" /></div>
                  <div className="admin-external-field"><label>Patirtis, metai</label><input inputMode="decimal" value={foreignHireExternalForm.yearsExperience} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, yearsExperience: event.target.value.replace(/[^0-9.,]/g, "").replace(",", ".") }))} /></div>
                  <div className="admin-external-field"><label>El. paštas</label><input value={foreignHireExternalForm.email} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, email: event.target.value }))} /></div>
                  <div className="admin-external-field"><label>Telefonas</label><input value={foreignHireExternalForm.phone} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, phone: event.target.value }))} /></div>
                  <div className="admin-external-field"><label>Galimas nuo</label><input value={foreignHireExternalForm.availableFrom} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, availableFrom: event.target.value }))} placeholder="YYYY-MM-DD" /></div>
                  <div className="admin-external-field wide"><label>Kandidato patirtis / kompetencijos</label><input value={foreignHireExternalForm.skills} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, skills: event.target.value }))} placeholder="Pvz. 6 m. gipso montavimas, metalinis karkasas, lubos, Q2/Q3" /></div>
                  <div className="admin-external-field wide">
                    <label>Kalbos ir lygiai</label>
                    {(foreignHireExternalForm.languageDetails.split("\n").length ? foreignHireExternalForm.languageDetails.split("\n") : [""]).map((language, index, all) => (
                      <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          style={{ flex: 1, minWidth: 0 }}
                          value={language}
                          placeholder={index === 0 ? "Pvz. English B1" : "Kita kalba ir jos lygis"}
                          onChange={(event) => setForeignHireExternalForm((current) => {
                            const languages = current.languageDetails.split("\n");
                            languages[index] = event.target.value.replace(/[\r\n]/g, " ");
                            return { ...current, languageDetails: languages.join("\n") };
                          })}
                        />
                        {all.length > 1 ? <button type="button" className="admin-small-btn" aria-label="Pašalinti kalbą" onClick={() => setForeignHireExternalForm((current) => ({ ...current, languageDetails: current.languageDetails.split("\n").filter((_, i) => i !== index).join("\n") }))}>×</button> : null}
                      </div>
                    ))}
                    <button type="button" className="admin-small-btn" onClick={() => setForeignHireExternalForm((current) => ({ ...current, languageDetails: `${current.languageDetails}\n` }))}>+ Pridėti kalbą</button>
                  </div>
                  <div className="admin-external-field"><label>Šaltinis (nebūtina)</label><input value={foreignHireExternalForm.sourceDetail} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, sourceDetail: event.target.value }))} placeholder="Facebook grupė / referral..." /></div>
                  <div className="admin-external-field">
                    <label>Vairuotojo pažymėjimas</label>
                    <RoundedSelect
                      className="admin-external-dropdown"
                      ariaLabel="Vairuotojo pažymėjimas"
                      value={foreignHireExternalForm.hasDrivingLicenseB ? "yes" : "no"}
                      options={[{ value: "yes", label: "Taip (B kategorija)" }, { value: "no", label: "Ne" }]}
                      onChange={(value) => setForeignHireExternalForm((current) => ({ ...current, hasDrivingLicenseB: value === "yes" }))}
                    />
                  </div>
                  <div className="admin-external-field">
                    <label>Ar reikalingas būstas?</label>
                    <RoundedSelect
                      className="admin-external-dropdown"
                      ariaLabel="Ar reikalingas būstas?"
                      value={foreignHireExternalForm.needsAccommodation === null ? "unset" : foreignHireExternalForm.needsAccommodation ? "yes" : "no"}
                      options={[{ value: "unset", label: "Pasirinkite" }, { value: "yes", label: "Taip" }, { value: "no", label: "Ne" }]}
                      onChange={(value) => setForeignHireExternalForm((current) => ({ ...current, needsAccommodation: value === "unset" ? null : value === "yes" }))}
                    />
                  </div>
                  <div className="admin-external-field full"><label>Mano komentaras</label><textarea value={foreignHireExternalForm.recruiterNote} onChange={(event) => setForeignHireExternalForm((current) => ({ ...current, recruiterNote: event.target.value }))} placeholder="Trumpas mano komentaras apie kandidatą, pokalbį ar tinkamumą šiai užklausai..." /></div>
                  <label className="admin-foreign-file">
                    <span className="admin-foreign-file-copy">
                      <b>{foreignHireExternalCvFile?.name || "Pilnas kandidato CV nepasirinktas"}</b>
                      <span>PDF arba DOCX · iki 15 MB · darbdavys galės atidaryti kandidato peržiūroje</span>
                    </span>
                    <span className="admin-small-btn">{foreignHireExternalCvFile ? "Pakeisti CV" : "Pasirinkti CV"}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => setForeignHireExternalCvFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="admin-foreign-file">
                    <span className="admin-foreign-file-copy">
                      <b>{foreignHireExternalSignedAgreementFile?.name || "Pasirašyta kandidato ir Statybos24 tarpininkavimo sutartis"}</b>
                      <span>Privatus admin dokumentas · PDF arba DOCX · iki 15 MB · darbdaviui nerodomas</span>
                    </span>
                    <span className="admin-small-btn">{foreignHireExternalSignedAgreementFile ? "Pakeisti sutartį" : "Pasirinkti sutartį"}</span>
                    <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setForeignHireExternalSignedAgreementFile(event.target.files?.[0] || null)} />
                  </label>
                </div>
                <div className="admin-candidate-actions">
                  <button className="admin-small-btn" type="button" onClick={() => { setForeignHireExternalRequestId(null); setForeignHireExternalCvFile(null); setForeignHireExternalSignedAgreementFile(null); }}>Atšaukti</button>
                  <button className="admin-small-btn" type="button" disabled={foreignHireCandidateBusyId === "external"} onClick={saveExternalForeignHireCandidate} style={{ background: "#222631", color: "#fff", borderColor: "#222631" }}>
                    {foreignHireCandidateBusyId === "external" ? "Saugoma..." : "Pridėti kandidatą"}
                  </button>
                </div>
              </div>
            ) : null}

            {loadingCandidates ? (
              <div className="admin-empty" style={{ marginTop: 12 }}>Kraunami kandidatai...</div>
            ) : candidates.length ? (
              <div className="admin-candidates-list">
                {candidates.map((candidate) => {
                  const next = foreignHireCandidateNext(candidate.status);
                  const candidateBusy = foreignHireCandidateBusyId === candidate.candidate_id;
                  const candidateExpanded = !!foreignHireExpandedCandidateIds[candidate.candidate_id];
                  const needsSignedAgreement = ["presented", "interview", "offer", "hired", "started"].includes(next?.[0]) && !["signed_uploaded", "approved"].includes(candidate.candidate_agreement_status);
                  const needsEmployerAcceptance = ["hired", "started"].includes(next?.[0]) && candidate.employer_response !== "accepted";
                  const needsEmploymentAgreement = ["hired", "started"].includes(next?.[0]) && !candidate.job_confirmation?.signedEmploymentAgreementPath;
                  const needsJobConfirmation = ["hired", "started"].includes(next?.[0]) && !candidate.candidate_job_confirmed_at;
                  const canHireCandidate = candidate.employer_response === "accepted" && !["hired", "started", "rejected", "withdrawn"].includes(candidate.status);
                  const hireBlocked = !candidate.job_confirmation?.signedEmploymentAgreementPath || !candidate.candidate_job_confirmed_at || !candidate.candidate_signed_agreement_path || !["signed_uploaded", "approved"].includes(candidate.candidate_agreement_status);
                  return (
                    <div className="admin-candidate-card" key={candidate.candidate_id}>
                      <button
                        type="button"
                        className={`admin-candidate-card-head ${candidate.employer_response === "accepted" && !["hired", "started"].includes(candidate.status) ? "is-employer-accepted" : candidate.employer_response === "interview_requested" && !candidate.employer_contact_shared_at ? "is-interview-requested" : ""}`}
                        aria-expanded={candidateExpanded}
                        onClick={() => setForeignHireExpandedCandidateIds((current) => ({ ...current, [candidate.candidate_id]: !current[candidate.candidate_id] }))}
                        style={{ width: "100%", border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                      >
                        <h4 style={{ margin: 0, minWidth: 0, overflowWrap: "anywhere" }}>{candidate.full_name || "Kandidatas"}</h4>
                        <span aria-hidden="true" style={{ fontSize: 22, color: "#607180", lineHeight: 1, flexShrink: 0 }}>{candidateExpanded ? "−" : "+"}</span>
                      </button>
                      {candidateExpanded ? <>
                        <div className="admin-candidate-card-head" style={{ marginTop: 10 }}>
                          <p>{candidate.source_type === "platform" ? "Statybos24 bazė" : candidate.source_detail || "Išorinis kandidatas"} · {candidate.profession}</p>
                          <span className="admin-candidate-chip">{foreignHireCandidateStatusLabel(candidate.status)}</span>
                        </div>
                      <div className="admin-candidate-meta">
                        <div><span>Amžius</span><b>{candidate.age_years ?? "—"}</b></div>
                        <div><span>Patirtis</span><b>{candidate.years_experience === null ? "—" : `${Number(candidate.years_experience)} m.`}</b></div>
                        <div><span>Kalba</span><b>{candidate.language_details || "—"}</b></div>
                        <div><span>Galimas nuo</span><b>{candidate.available_from || "—"}</b></div>
                        <div><span>B kategorija</span><b>{candidate.has_driving_license_b === true ? "Taip" : candidate.has_driving_license_b === false ? "Ne" : "—"}</b></div>
                        <div><span>Reikalingas būstas</span><b>{candidate.needs_accommodation === true ? "Taip" : candidate.needs_accommodation === false ? "Ne" : "—"}</b></div>
                        <div><span>Telefonas</span><b>{candidate.phone || "—"}</b></div>
                        <div><span>El. paštas</span><b>{candidate.email || "—"}</b></div>
                        <div><span>Darbdavio atsakymas</span><b>{foreignHireEmployerResponseLabel(candidate.employer_response)}</b></div>
                        <div><span>Galutinės sąlygos</span><b>{candidate.candidate_job_confirmed_at ? "Kandidatas sutiko" : candidate.job_confirmation?.signedEmploymentAgreementPath ? "Darbo sutartis įkelta" : "Sutartis neįkelta"}</b></div>
                        {candidate.employer_rejection_reason ? <div className="wide"><span>Atmetimo priežastis (darbdavio)</span><b>{candidate.employer_rejection_reason}</b></div> : null}
                        <div className="wide"><span>Kandidato patirtis / kompetencijos</span><b>{candidate.skills || "—"}</b></div>
                        <div className="wide"><span>Mano komentaras</span><b>{candidate.recruiter_note || "—"}</b></div>
                      </div>

                      <div className="admin-candidate-docs">
                        {candidate.cvUrl ? <a className="admin-candidate-doc" href={candidate.cvUrl} target="_blank" rel="noreferrer">CV · {candidate.cv_name || "Atidaryti"}</a> : null}
                        <label className="admin-candidate-doc">{candidate.cv_path ? "Pakeisti CV" : "+ Įkelti CV"}<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={candidateBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadForeignCandidateDocument(candidate, "cv", file); event.target.value = ""; }} /></label>
                        {candidate.candidate_signed_agreement_path ? (candidate.candidateSignedAgreementUrl ? <a className="admin-candidate-doc" href={candidate.candidateSignedAgreementUrl} target="_blank" rel="noreferrer">Statybos24 ir darbuotojo tarpininkavimo sutartis · {candidate.candidate_signed_agreement_name || "Peržiūrėti"}</a> : <span className="admin-candidate-doc">✓ Tarpininkavimo sutartis įkelta · {candidate.candidate_signed_agreement_name || "Dokumentas"}</span>) : null}
                        <label className="admin-candidate-doc">{candidate.candidate_signed_agreement_path ? "Pakeisti tarpininkavimo sutartį" : "+ Įkelti tarpininkavimo sutartį"}<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={candidateBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadForeignCandidateDocument(candidate, "signed_agreement", file); event.target.value = ""; }} /></label>
                      </div>

                      {candidate.employer_contact_shared_at ? (
                        <div className="admin-candidate-contact-share ok">✓ Kandidato el. paštas perduotas darbdaviui {formatAdminDate(candidate.employer_contact_shared_at)}. Telefono numeris neperduodamas.</div>
                      ) : candidate.employer_response === "interview_requested" || candidate.employer_response === "accepted" ? (
                        <div className="admin-candidate-contact-share interview-ready">
                          <span>Darbdavys paprašė tęsti procesą. Jei reikia, galite perduoti tik kandidato el. paštą; telefono numeris lieka privatus.</span>
                          <button className="admin-small-btn" type="button" disabled={candidateBusy || !candidate.email} onClick={() => shareForeignHireCandidateEmail(candidate)}>{candidate.email ? "Perduoti el. paštą" : "El. paštas nenurodytas"}</button>
                        </div>
                      ) : null}

                      <div className="admin-candidate-job-confirmation">
                        <div className="admin-candidate-zone-head">
                          <div>
                            <strong>Darbdavio ir darbuotojo pasirašyta darbo sutartis</strong>
                            <span>Įkelkite abiejų šalių pasirašytą darbo sutartį (PDF arba DOCX, iki 15 MB). Tai ne Statybos24 tarpininkavimo sutartis.</span>
                          </div>
                        </div>
                        {candidate.signedEmploymentAgreementUrl ? (
                          <div className="admin-candidate-consent ok" style={{ marginTop: 12 }}>
                            <strong>✓ Pasirašyta darbo sutartis įkelta</strong>
                            <div style={{ marginTop: 8 }}>
                              <a className="admin-candidate-doc" href={candidate.signedEmploymentAgreementUrl} target="_blank" rel="noreferrer">
                                Peržiūrėti · {candidate.job_confirmation?.signedEmploymentAgreementName || "Darbo sutartis"}
                              </a>
                            </div>
                          </div>
                        ) : <div className="admin-candidate-job-note">Pasirašyta darbo sutartis dar neįkelta.</div>}
                        <label className="admin-foreign-file" style={{ marginTop: 12, cursor: candidate.employer_response === "accepted" && !candidateBusy ? "pointer" : "not-allowed" }}>
                          <span className="admin-foreign-file-copy">
                            <b>{candidate.signedEmploymentAgreementUrl ? "Pakeisti pasirašytą darbo sutartį" : "Pasirinkti pasirašytą darbo sutartį"}</b>
                            <span>Privatus dokumentas · PDF arba DOCX · iki 15 MB</span>
                          </span>
                          <span className="admin-small-btn">{candidateBusy ? "Įkeliama..." : "Įkelti sutartį"}</span>
                          <input
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            disabled={candidateBusy || candidate.employer_response !== "accepted"}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) uploadForeignHireEmploymentAgreement(request, candidate, file);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        {candidate.employer_response !== "accepted" ? <div className="admin-candidate-job-note" style={{ marginTop: 9 }}>Įkelti galima, kai darbdavys patvirtina kandidatą.</div> : null}
                      </div>

                      <div className="admin-candidate-actions">
                        {canHireCandidate ? (
                          <button
                            className="admin-small-btn"
                            type="button"
                            disabled={candidateBusy || hireBlocked}
                            title={!candidate.job_confirmation?.signedEmploymentAgreementPath ? "Pirmiausia įkelkite darbdavio ir darbuotojo pasirašytą darbo sutartį." : !candidate.candidate_signed_agreement_path || !["signed_uploaded", "approved"].includes(candidate.candidate_agreement_status) ? "Pirmiausia įkelkite pasirašytą kandidato tarpininkavimo sutartį." : !candidate.candidate_job_confirmed_at ? "Palaukite, kol bus užfiksuotas darbo sutarties patvirtinimas." : ""}
                            onClick={() => updateForeignHireCandidateStatus(candidate, "hired")}
                            style={{ background: hireBlocked ? "#eef2f5" : "#222631", color: hireBlocked ? "#83909d" : "#fff", borderColor: hireBlocked ? "#dce5eb" : "#222631" }}
                          >{candidateBusy ? "Saugoma..." : "Įdarbinti"}</button>
                        ) : ["hired", "started"].includes(candidate.status) ? (
                          next ? <button className="admin-small-btn" type="button" disabled={candidateBusy || needsSignedAgreement || needsEmployerAcceptance || needsEmploymentAgreement || needsJobConfirmation} onClick={() => updateForeignHireCandidateStatus(candidate, next[0])}>{candidateBusy ? "Saugoma..." : next[1]}</button> : <span className="admin-foreign-status sourcing">Įdarbintas</span>
                        ) : next ? (
                          <button
                            className="admin-small-btn"
                            type="button"
                            disabled={candidateBusy || needsSignedAgreement || needsEmployerAcceptance || needsEmploymentAgreement || needsJobConfirmation}
                            onClick={() => updateForeignHireCandidateStatus(candidate, next[0])}
                            style={next[0] === "presented" || next[0] === "started" ? { background: "#222631", color: "#fff", borderColor: "#222631" } : undefined}
                            title={needsEmployerAcceptance ? "Pirmiausia darbdavys turi patvirtinti kandidatą." : needsSignedAgreement ? "Pirmiausia įkelkite kandidato pasirašytą sutartį." : needsEmploymentAgreement ? "Pirmiausia įkelkite darbdavio ir darbuotojo pasirašytą darbo sutartį." : needsJobConfirmation ? "Palaukite, kol sistema užfiksuos pasirašytos darbo sutarties patvirtinimą." : ""}
                          >
                            {candidateBusy ? "Saugoma..." : next[1]}
                          </button>
                        ) : null}
                        {!['rejected','withdrawn','started'].includes(candidate.status) ? (
                          <button className="admin-small-btn danger" type="button" disabled={candidateBusy} onClick={() => updateForeignHireCandidateStatus(candidate, "rejected")}>Atmesti</button>
                        ) : null}
                        <button className="admin-small-btn danger" type="button" disabled={candidateBusy} onClick={() => deleteForeignHireCandidate(candidate)}>Ištrinti kandidatą</button>
                      </div>
                      </> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty" style={{ marginTop: 12 }}>Prie šios užklausos kandidatų dar nepridėta.</div>
            )}
          </div>
      </div>
    );
  }

  function generateForeignHireLogin() {
    const bytes = new Uint32Array(2);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else {
      bytes[0] = Math.floor(Math.random() * 1000000);
      bytes[1] = Math.floor(Math.random() * 1000000);
    }
    const number = String(((bytes[0] ^ bytes[1]) % 900000) + 100000);
    return `ID-${number}`;
  }

  function generateForeignHirePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = new Uint32Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 1000000);
      }
    }
    return Array.from(bytes, (value) => chars[value % chars.length]).join("");
  }

  function openForeignHireAccessSetup(request) {
    setForeignHireSetupRequest(request);
    setForeignHireSetupLogin(request?.employer_login_id || generateForeignHireLogin(request));
    setForeignHireSetupPassword(request?.employer_account_id ? "" : generateForeignHirePassword());
    setForeignHireAgreementFile(null);
    setForeignHireCredentials(null);
    setError("");
    setNotice("");
  }

  async function uploadForeignHireInvoice(request, file) {
    if (!request?.request_id || !file || foreignHireInvoiceBusyId) return;
    const requestId = request.request_id;
    const feedback = (message, kind = "error") => setForeignHireInvoiceFeedback((previous) => ({ ...previous, [requestId]: { message, kind } }));
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(ext) || file.size < 1 || file.size > 15 * 1024 * 1024) {
      feedback("Sąskaita turi būti PDF arba DOCX, iki 15 MB."); return;
    }
    if (request.status !== "closed") {
      feedback("Sąskaitą galima įkelti tik uždarius paiešką. Perkraukite puslapį ir bandykite vėl."); return;
    }
    setForeignHireInvoiceBusyId(requestId);
    feedback(`Įkeliamas dokumentas: ${file.name}`, "progress");
    setError(""); setNotice("");
    const storagePath = `${requestId}/${Date.now()}-${window.crypto.randomUUID()}-${safeStorageFileName(file.name)}`;
    try {
      const uploaded = await supabase.storage.from("foreign-hire-invoices").upload(storagePath, file, {
        contentType: ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert: false,
      });
      if (uploaded.error) throw uploaded.error;
      const saved = await supabase.rpc("admin_set_foreign_hire_invoice", {
        p_request_id: requestId, p_path: storagePath, p_name: file.name,
      });
      if (saved.error) {
        await supabase.storage.from("foreign-hire-invoices").remove([storagePath]);
        throw saved.error;
      }
      const oldPath = foreignHireInvoices[requestId]?.storage_path;
      setForeignHireInvoices((previous) => ({ ...previous, [requestId]: {
        request_id: requestId, file_name: file.name, storage_path: storagePath,
      } }));
      feedback(`Sąskaita įkelta: ${file.name}`, "success");
      if (oldPath && oldPath !== storagePath) {
        await supabase.storage.from("foreign-hire-invoices").remove([oldPath]);
      }
      setNotice("Sąskaita faktūra įkelta. Darbdavys gali ją atsisiųsti.");
    } catch (err) {
      const message = err?.message || "Nepavyko įkelti sąskaitos.";
      feedback(`Nepavyko įkelti „${file.name}“: ${message}`);
      setError(message);
    } finally { setForeignHireInvoiceBusyId(null); }
  }

  async function viewForeignHireInvoice(invoice) {
    if (!invoice?.storage_path) return;
    try {
      const { data, error } = await supabase.storage.from("foreign-hire-invoices")
        .createSignedUrl(invoice.storage_path, 300, { download: invoice.file_name });
      if (error || !data?.signedUrl) throw error || new Error("Nuoroda nepasiekiama.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) { setError(err?.message || "Nepavyko atsisiųsti sąskaitos."); }
  }

  function validateForeignHireAgreementFile(file) {
    if (!file) return "Įkelkite recruitment sutartį.";
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) return "Sutartis turi būti PDF arba DOCX formato.";
    if (file.size > 15 * 1024 * 1024) return "Sutarties failas negali būti didesnis nei 15 MB.";
    return "";
  }

  async function copyForeignHireText(value, successMessage) {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setNotice(successMessage || "Nukopijuota.");
    } catch {
      setError("Nepavyko nukopijuoti. Nukopijuokite rankiniu būdu.");
    }
  }

  function foreignHireCredentialsText(request, credentials = foreignHireCredentials) {
    if (!request || !credentials || credentials.requestId !== request.request_id) return "";
    return [
      "Statybos24 employer portal",
      `Login: ${credentials.loginId}`,
      `Temporary password: ${credentials.password}`,
      `Portal: ${window.location.origin}/hire/login`,
      "",
      "Please use these private credentials to access your company portal. You will find the recruitment agreement and the full workforce requirements form there. If anything is unclear, reply to the email that contained these credentials.",
    ].join("\n");
  }

  async function createForeignEmployerAccess() {
    const request = foreignHireSetupRequest;
    if (!request?.request_id || foreignHireSetupBusy) return;

    const loginId = foreignHireSetupLogin.trim().toUpperCase();
    const tempPassword = foreignHireSetupPassword;
    if (!/^ID-[0-9]{6}$/.test(loginId)) {
      setError("Įmonės ID turi būti ID- ir 6 skaitmenys, pvz. ID-123456.");
      return;
    }
    if (tempPassword.length < 10) {
      setError("Laikinas slaptažodis turi būti bent 10 simbolių.");
      return;
    }

    setForeignHireSetupBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_create_foreign_employer_access", {
        p_request_id: request.request_id,
        p_login_id: loginId,
        p_temp_password: tempPassword,
        p_agreement_path: null,
        p_agreement_name: null,
      });
      if (result.error) throw result.error;

      setForeignHireCredentials({
        requestId: request.request_id,
        loginId,
        password: tempPassword,
      });
      setForeignHireSetupRequest(null);
      setNotice("Darbdavio prieiga sukurta. Dabar įkelkite tarpininkavimo sutartį ir tada išsiųskite prisijungimo duomenis darbdaviui.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko sukurti darbdavio prieigos.");
    } finally {
      setForeignHireSetupBusy(false);
    }
  }

  async function replaceForeignEmployerAgreement() {
    const request = foreignHireSetupRequest;
    if (!request?.request_id || !request?.employer_account_id || foreignHireSetupBusy) return;
    const fileError = validateForeignHireAgreementFile(foreignHireAgreementFile);
    if (fileError) { setError(fileError); return; }

    setForeignHireSetupBusy(true);
    setError("");
    setNotice("");
    let storagePath = "";
    try {
      storagePath = `${request.request_id}/original/${Date.now()}-${safeStorageFileName(foreignHireAgreementFile.name)}`;
      const uploadResult = await supabase.storage
        .from("foreign-hire-contracts")
        .upload(storagePath, foreignHireAgreementFile, {
          upsert: false,
          contentType: foreignHireAgreementFile.type,
        });
      if (uploadResult.error) throw uploadResult.error;

      const result = await supabase.rpc("admin_replace_foreign_hire_agreement", {
        p_request_id: request.request_id,
        p_agreement_path: storagePath,
        p_agreement_name: foreignHireAgreementFile.name,
      });
      if (result.error) throw result.error;

      setForeignHireAgreementFile(null);
      setForeignHireSetupRequest(null);
      setNotice("Tarpininkavimo sutartis įkelta. Darbdavys ją matys iškart prisijungęs prie portalo.");
      await loadAdminData(true);
    } catch (err) {
      if (storagePath) {
        try { await supabase.storage.from("foreign-hire-contracts").remove([storagePath]); } catch (_) {}
      }
      setError(err?.message || "Nepavyko įkelti sutarties.");
    } finally {
      setForeignHireSetupBusy(false);
    }
  }


  async function lockForeignHireSubmission(request) {
    if (!request?.request_id || foreignHireSavingId) return;
    if (!request.signed_agreement_path || !["submitted", "approved"].includes(request.brief_status) || !request.brief_workforce_details) {
      setError("Paiešką galima pradėti tik gavus pilną darbuotojų poreikį ir pasirašytą tarpininkavimo sutartį.");
      return;
    }
    const ok = await askConfirm({
      eyebrow: "DARBUOTOJŲ POREIKIS",
      title: "Pradėti darbuotojų paiešką?",
      message: "Patvirtinsite darbdavio pateiktą pilną poreikį ir gautą pasirašytą tarpininkavimo sutartį. Po patvirtinimo galėsite pradėti kandidatų paiešką.",
      confirmLabel: "Pradėti paiešką",
    });
    if (!ok) return;
    setForeignHireSavingId(request.request_id);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_lock_foreign_hire_submission", { p_request_id: request.request_id });
      if (result.error) throw result.error;
      setNotice("Darbuotojų paieška pradėta. Galite pridėti kandidatus.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko pradėti darbuotojų paieškos.");
    } finally {
      setForeignHireSavingId(null);
    }
  }

  async function resetForeignEmployerPassword(request) {
    if (!request?.request_id || foreignHireSetupBusy) return;
    const confirmed = await askConfirm({
      eyebrow: "TARPTAUTINĖ ATRANKA",
      title: "Sugeneruoti naują laikiną slaptažodį?",
      message: "Senas slaptažodis nebeveiks. Naują slaptažodį reikės privačiai išsiųsti darbdaviui.",
      confirmLabel: "Generuoti",
    });
    if (!confirmed) return;

    const password = generateForeignHirePassword();
    setForeignHireSetupBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_reset_foreign_employer_password", {
        p_request_id: request.request_id,
        p_temp_password: password,
      });
      if (result.error) throw result.error;
      const loginId = result.data || request.employer_login_id;
      setForeignHireCredentials({
        requestId: request.request_id,
        loginId,
        password,
      });
      setNotice("Naujas laikinas slaptažodis sugeneruotas. Nukopijuokite jį dabar — sistemoje jis saugomas tik užšifruotas.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko sugeneruoti naujo slaptažodžio.");
    } finally {
      setForeignHireSetupBusy(false);
    }
  }

  async function resolveSiteBug(report) {
    if (!report || report.status === "resolved") return;

    // Pirmiausia uždarome klaidos peržiūros modalą, kad patvirtinimas
    // visada būtų vienintelis aktyvus dialogas viršuje, o ne po juo.
    setSelectedBugReport(null);

    const confirmed = await askConfirm({
      eyebrow: "SVETAINĖS KLAIDA",
      title: "Pažymėti klaidą sutvarkyta?",
      message:
        "Pranešimas bus pažymėtas sutvarkytu. Kitą kartą prisijungęs vartotojas gaus pranešimą, o jei jo patikimumas mažesnis nei 100, sistema pridės +1 patikimumo tašką.",
      confirmLabel: "Sutvarkiau",
    });

    if (!confirmed) {
      setSelectedBugReport(report);
      return;
    }

    setResolvingBugId(report.id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("resolve_site_bug_report", {
        p_report_id: report.id,
      });

      if (result.error) throw result.error;

      const resolved = result.data?.[0] || null;
      const reward = Number(resolved?.reward_points || 0);

      setSelectedBugReport((current) =>
        current?.id === report.id
          ? {
              ...current,
              status: "resolved",
              resolved_at: resolved?.resolved_at || new Date().toISOString(),
              reward_points: reward,
            }
          : current
      );

      setNotice(
        reward > 0
          ? `Klaida pažymėta sutvarkyta. Vartotojui skirta +${reward} patikimumo taškas.`
          : "Klaida pažymėta sutvarkyta. Vartotojo patikimumas jau buvo 100 / 100."
      );

      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko pažymėti klaidos sutvarkyta.");
    } finally {
      setResolvingBugId(null);
    }
  }

  async function markSiteBugIrrelevant(report) {
    if (!report || report.status !== "active") return;

    // Tas pats dialogų eiliškumas kaip „Sutvarkiau“ veiksme.
    setSelectedBugReport(null);

    const confirmed = await askConfirm({
      eyebrow: "SVETAINĖS KLAIDA",
      title: "Pažymėti pranešimą neaktualiu?",
      message:
        "Pranešimas nebebus skaičiuojamas kaip aktyvi svetainės klaida. Vartotojui patikimumo taškai nebus skiriami ir pranešimas apie sutvarkytą klaidą nebus siunčiamas.",
      confirmLabel: "Neaktualu",
      danger: true,
    });

    if (!confirmed) {
      setSelectedBugReport(report);
      return;
    }

    setResolvingBugId(report.id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("mark_site_bug_report_irrelevant", {
        p_report_id: report.id,
      });

      if (result.error) throw result.error;

      const updated = result.data?.[0] || null;
      setSelectedBugReport((current) =>
        current?.id === report.id
          ? {
              ...current,
              status: "irrelevant",
              resolved_at: updated?.marked_at || new Date().toISOString(),
              reward_points: 0,
            }
          : current
      );

      setNotice("Pranešimas pažymėtas neaktualiu.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko pažymėti pranešimo neaktualiu.");
    } finally {
      setResolvingBugId(null);
    }
  }

  async function resolveDispute(dispute, resolution) {
    const resolutionNote = String(
      disputeResolutionNotes[dispute.attendance_id] || ""
    ).trim();

    if (!resolutionNote) {
      setError(
        "Prieš išspręsdami ginčą įrašykite administratoriaus komentarą. Jį matys abi ginčo pusės."
      );
      return;
    }

    const workerWon = resolution === "worker";
    const finalOutcome = workerWon
      ? dispute.employer_outcome === "no_show"
        ? "full_day"
        : dispute.employer_outcome === "left_early_unexcused"
        ? "left_early_agreed"
        : "full_day"
      : dispute.employer_outcome;

    const actualEndTime = ["left_early_agreed", "left_early_unexcused"].includes(
      finalOutcome
    )
      ? dispute.actual_end_time
      : null;

    const question = workerWon
      ? "Patvirtinti sprendimą darbuotojo naudai? Jei darbdavio neigiamas pažymėjimas nepasitvirtino, darbdavio patikimumui bus pritaikyta sistemos numatyta bauda."
      : "Patvirtinti sprendimą darbdavio naudai? Darbuotojui bus pritaikytas galutinis darbo dienos rezultatas.";

    const confirmed = await askConfirm({
      eyebrow: "GINČO SPRENDIMAS",
      title: workerWon ? "Spręsti darbuotojo naudai?" : "Spręsti darbdavio naudai?",
      message: question,
      confirmLabel: "Patvirtinti sprendimą",
      danger: !workerWon,
    });
    if (!confirmed) return;

    setResolvingId(dispute.attendance_id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_resolve_attendance_dispute", {
        p_attendance_id: dispute.attendance_id,
        p_resolution: resolution,
        p_final_outcome: finalOutcome,
        p_actual_end_time: actualEndTime || null,
        p_note: resolutionNote,
      });

      if (result.error) throw result.error;

      setDisputeResolutionNotes((current) => {
        const next = { ...current };
        delete next[dispute.attendance_id];
        return next;
      });
      setNotice("Ginčas išspręstas. Administratoriaus komentaras išsaugotas ir rodomas abiem pusėms.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko išspręsti ginčo.");
    } finally {
      setResolvingId(null);
    }
  }

  function openWorkerEditor(worker) {
    setEditor({ type: "worker", id: worker.user_id });
    setEditorForm({
      displayName: worker.display_name || "",
      legalName: worker.legal_name || "",
      phone: worker.phone || "",
      city: worker.city || "",
      isActive: Boolean(worker.is_active),
      travelRadiusKm: Number(worker.travel_radius_km ?? 30),
      hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
      yearsExperience: Number(worker.years_experience || 0),
      shortBio: worker.short_bio || "",
    });
  }

  async function openEmployerEditor(employer) {
    setError("");
    setEditor({
      type: "employer",
      id: employer.company_id,
      ownerId: employer.owner_id,
      originalPlanKey: employer.plan_key || "basic",
      originalSubscriptionStatus: employer.subscription_status || "active",
      originalPlanPeriodEnd: employer.plan_current_period_end
        ? String(employer.plan_current_period_end).slice(0, 10)
        : "",
      trialEligibilityLoading: true,
      trialBlockedByStripe: false,
    });
    setEditorForm({
      displayName: employer.display_name || "",
      phone: employer.phone || "",
      name: employer.company_name || "",
      companyCode: employer.company_code || "",
      vatCode: employer.vat_code || "",
      city: employer.city || "",
      description: employer.description || "",
      isVerified: Boolean(employer.is_verified),
      ownerActive: Boolean(employer.is_active),
      planKey: employer.plan_key || "basic",
      subscriptionStatus: employer.subscription_status || "active",
      planPeriodEnd: employer.plan_current_period_end
        ? String(employer.plan_current_period_end).slice(0, 10)
        : "",
    });

    try {
      const billingResult = await supabase.rpc("get_company_billing_status", {
        p_company_id: employer.company_id,
      });

      if (billingResult.error) throw billingResult.error;

      const billing = billingResult.data?.[0] || null;
      const trialBlockedByStripe =
        Boolean(billing?.has_stripe_subscription) &&
        ["active", "trialing", "past_due"].includes(
          billing?.subscription_status
        );

      setEditor((current) =>
        current?.type === "employer" && current.id === employer.company_id
          ? {
              ...current,
              trialEligibilityLoading: false,
              trialBlockedByStripe,
            }
          : current
      );
    } catch (err) {
      setEditor((current) =>
        current?.type === "employer" && current.id === employer.company_id
          ? {
              ...current,
              trialEligibilityLoading: false,
              trialBlockedByStripe: true,
            }
          : current
      );
      setError(
        err?.message ||
          "Nepavyko patikrinti Stripe prenumeratos. Bandomasis planas saugumo sumetimais neaktyvuojamas."
      );
    }
  }

  function openJobEditor(job) {
    setEditor({ type: "job", id: job.job_id });
    setEditorForm({
      title: job.title || "",
      city: job.city || "",
      addressText: job.address_text || "",
      workDate: job.work_date || "",
      startTime: job.start_time?.slice(0, 5) || "08:00",
      endTime: job.end_time?.slice(0, 5) || "17:00",
      breakStartTime: job.break_start_time?.slice(0, 5) || "",
      breakEndTime: job.break_end_time?.slice(0, 5) || "",
      workersNeeded: Number(job.workers_needed || 1),
      payAmount: job.pay_amount ?? "",
      payUnit: job.pay_unit === "day" ? "day" : "hour",
      transportMode:
        job.transport_mode === "employer_pickup"
          ? "employer_pickup"
          : "self_arrival",
      description: job.description || "",
    });
  }

  function updateEditorField(key, value) {
    setEditorForm((current) => ({ ...current, [key]: value }));
  }

  async function saveEditor() {
    if (!editor) return;

    setEditorSaving(true);
    setError("");
    setNotice("");

    try {
      if (editor.type === "worker") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const travelRadiusKm = Number(editorForm.travelRadiusKm);
        if (
          !Number.isFinite(travelRadiusKm) ||
          travelRadiusKm < 5 ||
          travelRadiusKm > 50
        ) {
          throw new Error("Kelionės spindulys turi būti nuo 5 iki 50 km.");
        }

        const [profileResult, contactResult] = await Promise.all([
          supabase.rpc("admin_update_worker", {
            p_user_id: editor.id,
            p_display_name: editorForm.displayName.trim(),
            p_city: city,
            p_is_active: Boolean(editorForm.isActive),
            p_travel_radius_km: travelRadiusKm,
            p_has_driving_license_b: Boolean(
              editorForm.hasDrivingLicenseB
            ),
            p_years_experience: Number(editorForm.yearsExperience) || 0,
            p_short_bio: editorForm.shortBio.trim() || null,
          }),
          supabase.rpc("admin_update_account_contact", {
            p_user_id: editor.id,
            p_display_name: editorForm.displayName.trim(),
            p_legal_name: editorForm.legalName.trim() || null,
            p_phone: editorForm.phone.trim() || null,
          }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (contactResult.error) throw contactResult.error;
      }

      if (editor.type === "employer") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const [companyResult, contactResult] = await Promise.all([
          supabase.rpc("admin_update_company", {
            p_company_id: editor.id,
            p_name: editorForm.name.trim(),
            p_company_code: editorForm.companyCode.trim() || null,
            p_vat_code: editorForm.vatCode.trim() || null,
            p_city: city,
            p_description: editorForm.description.trim() || null,
            p_is_verified: Boolean(editorForm.isVerified),
            p_owner_active: Boolean(editorForm.ownerActive),
          }),
          supabase.rpc("admin_update_account_contact", {
            p_user_id: editor.ownerId,
            p_display_name: editorForm.displayName.trim(),
            p_legal_name: null,
            p_phone: editorForm.phone.trim() || null,
          }),
        ]);

        if (companyResult.error) throw companyResult.error;
        if (contactResult.error) throw contactResult.error;

        const planChanged =
          editorForm.planKey !== editor.originalPlanKey ||
          editorForm.subscriptionStatus !==
            editor.originalSubscriptionStatus ||
          editorForm.planPeriodEnd !== editor.originalPlanPeriodEnd;

        if (planChanged) {
          const periodEnd = editorForm.planPeriodEnd
            ? platformDateTime(editorForm.planPeriodEnd, "23:59:59")?.toISOString() || null
            : null;

          const planResult = await supabase.rpc("admin_set_company_plan", {
            p_company_id: editor.id,
            p_plan_key: editorForm.planKey,
            p_subscription_status: editorForm.subscriptionStatus,
            p_period_end: periodEnd,
            p_reason: "Planas pakeistas administratoriaus valdymo centre",
          });

          if (planResult.error) throw planResult.error;
        }
      }

      if (editor.type === "job") {
        const city = await canonicalCityName(editorForm.city);
        if (!city) throw new Error("Pasirinkite miestą iš sąrašo.");

        const result = await supabase.rpc("admin_update_job", {
          p_job_id: editor.id,
          p_title: editorForm.title.trim(),
          p_city: city,
          p_address_text: editorForm.addressText.trim() || null,
          p_work_date: editorForm.workDate,
          p_start_time: editorForm.startTime,
          p_end_time: editorForm.endTime,
          p_break_start_time: editorForm.breakStartTime || null,
          p_break_end_time: editorForm.breakEndTime || null,
          p_workers_needed: Number(editorForm.workersNeeded) || 1,
          p_pay_amount: Number(editorForm.payAmount),
          p_pay_unit: editorForm.payUnit,
          p_transport_mode: editorForm.transportMode,
          p_description: editorForm.description.trim() || null,
        });

        if (result.error) throw result.error;
      }

      setEditor(null);
      setNotice("Pakeitimai išsaugoti.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti pakeitimų.");
    } finally {
      setEditorSaving(false);
    }
  }

  const [verifyingCompanyId, setVerifyingCompanyId] = useState(null);
  // Greitas įmonės patvirtinimas iš sąrašo – kiti duomenys siunčiami nepakeisti.
  async function verifyEmployer(employer) {
    if (!employer?.company_id || employer.is_verified) return;
    setVerifyingCompanyId(employer.company_id);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("admin_update_company", {
        p_company_id: employer.company_id,
        p_name: employer.company_name || "",
        p_company_code: employer.company_code || null,
        p_vat_code: employer.vat_code || null,
        p_city: employer.city || "",
        p_description: employer.description || null,
        p_is_verified: true,
        p_owner_active: Boolean(employer.is_active),
      });
      if (result.error) throw result.error;
      setNotice(`${employer.company_name || "Įmonė"} patvirtinta.`);
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti įmonės.");
    } finally {
      setVerifyingCompanyId(null);
    }
  }

  async function deleteRating(rating) {
    const confirmed = await askConfirm({
      eyebrow: "ATSILIEPIMO ŠALINIMAS",
      title: "Pašalinti darbuotojo įvertinimą?",
      message: `${rating.worker_name} įvertinimas ${rating.score}/10 bus pašalintas, o darbuotojo vidurkis perskaičiuotas.`,
      confirmLabel: "Pašalinti",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingRatingId(rating.rating_id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_delete_worker_rating", {
        p_rating_id: rating.rating_id,
      });

      if (result.error) throw result.error;

      setNotice("Atsiliepimas pašalintas ir darbuotojo vidurkis perskaičiuotas.");
      await loadAdminData(true);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti atsiliepimo.");
    } finally {
      setDeletingRatingId(null);
    }
  }

  function adminAuditActionLabel(action) {
    return {
      suspend_user: "Paskyra suspenduota",
      unsuspend_user: "Suspendavimas panaikintas",
      suspend_worker_mode: "Darbuotojo režimas suspenduotas",
      unsuspend_worker_mode: "Darbuotojo režimo suspendavimas panaikintas",
      delete_user_account: "Paskyra ištrinta",
      delete_job: "Darbas ištrintas",
    }[action] || action;
  }

  function isCurrentlySuspended(record) {
    if (!record?.suspended_until) return false;
    const until = new Date(record.suspended_until);
    return !Number.isNaN(until.getTime()) && until > new Date();
  }

  function isWorkerModeRestricted(record) {
    if (!record?.restricted_until) return false;
    const until = new Date(record.restricted_until);
    return !Number.isNaN(until.getTime()) && until > new Date();
  }

  function openAccountAction(type, record, role) {
    setActionError("");
    setError("");
    const userId = role === "worker" ? record.user_id : record.owner_id;
    const name =
      role === "worker"
        ? record.display_name || record.email || "Darbuotojas"
        : record.company_name || record.display_name || record.email || "Darbdavys";

    setActionDialog({
      type,
      role,
      userId,
      companyId: role === "employer" ? record.company_id : null,
      name,
      email: record.email || "",
    });
    setActionDays(7);
    setActionReason(
      type === "unsuspend" || type === "unsuspendWorkerMode"
        ? "Administratoriaus sprendimu suspendavimas panaikintas."
        : ""
    );
    setActionConfirm("");
  }

  function openJobDelete(job) {
    setActionError("");
    setError("");
    setActionDialog({
      type: "deleteJob",
      jobId: job.job_id,
      name: job.title || "Darbas",
      companyId: job.company_id || null,
    });
    setActionDays(7);
    setActionReason("");
    setActionConfirm("");
  }

  async function removeStorageRows(rows) {
    const unique = new Map();

    for (const row of rows || []) {
      if (!row?.bucket_id || !row?.storage_path) continue;
      unique.set(`${row.bucket_id}:${row.storage_path}`, row);
    }

    const grouped = new Map();

    for (const row of unique.values()) {
      if (!grouped.has(row.bucket_id)) grouped.set(row.bucket_id, []);
      grouped.get(row.bucket_id).push(row.storage_path);
    }

    for (const [bucketId, paths] of grouped.entries()) {
      if (!paths.length) continue;
      const result = await supabase.storage.from(bucketId).remove(paths);
      if (result.error) throw result.error;
    }
  }

  async function performAdminAction() {
    if (!actionDialog) return;
    setActionError("");

    const destructive =
      actionDialog.type === "deleteAccount" ||
      actionDialog.type === "deleteJob";

    if (
      actionDialog.type === "suspend" ||
      actionDialog.type === "suspendWorkerMode"
    ) {
      const days = Number(actionDays);

      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        setActionError("Suspendavimo trukmė turi būti nuo 1 iki 3650 dienų.");
        return;
      }
    }

    if (
      actionDialog.type !== "unsuspend" &&
      actionDialog.type !== "unsuspendWorkerMode" &&
      actionReason.trim().length < 5
    ) {
      setActionError("Įrašykite aiškią priežastį (bent 5 simboliai).");
      return;
    }

    if (destructive && actionConfirm.trim().toUpperCase() !== "ISTRINTI") {
      setActionError('Norėdami patvirtinti trynimą, įrašykite „ISTRINTI“.');
      return;
    }

    setActionBusy(true);
    setError("");
    setNotice("");

    try {
      if (actionDialog.type === "suspendWorkerMode") {
        const result = await supabase.rpc("admin_suspend_worker_mode", {
          p_user_id: actionDialog.userId,
          p_days: Number(actionDays),
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        setNotice(
          `${actionDialog.name} darbuotojo režimas suspenduotas ${Number(actionDays)} d.`
        );
      }

      if (actionDialog.type === "unsuspendWorkerMode") {
        const result = await supabase.rpc("admin_unsuspend_worker_mode", {
          p_user_id: actionDialog.userId,
          p_reason: actionReason.trim() || null,
        });

        if (result.error) throw result.error;
        setNotice(`${actionDialog.name} darbuotojo režimo suspendavimas panaikintas.`);
      }

      if (actionDialog.type === "suspend") {
        const result = await supabase.rpc("admin_suspend_user", {
          p_user_id: actionDialog.userId,
          p_days: Number(actionDays),
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        setNotice(
          `${actionDialog.name} paskyra suspenduota ${Number(actionDays)} d.`
        );
      }

      if (actionDialog.type === "unsuspend") {
        const result = await supabase.rpc("admin_unsuspend_user", {
          p_user_id: actionDialog.userId,
          p_reason: actionReason.trim() || null,
        });

        if (result.error) throw result.error;
        setNotice(`${actionDialog.name} suspendavimas panaikintas.`);
      }

      if (actionDialog.type === "deleteAccount") {
        await deleteAccountThroughServer({
          targetUserId: actionDialog.userId,
          reason: actionReason.trim(),
        });

        setEditor(null);
        setNotice(
          `${actionDialog.name} paskyra visiškai pašalinta. Aktyvi prenumerata, jei buvo, nutraukta prieš trynimą.`
        );
      }

      if (actionDialog.type === "deleteJob") {
        const relatedFiles = files.filter(
          (file) => file.job_id === actionDialog.jobId
        );

        const result = await supabase.rpc("admin_delete_job", {
          p_job_id: actionDialog.jobId,
          p_reason: actionReason.trim(),
        });

        if (result.error) throw result.error;

        let cleanupWarning = "";
        try {
          await removeStorageRows(relatedFiles);
        } catch {
          cleanupWarning =
            " Darbas pašalintas, bet dalies susijusių failų automatiškai išvalyti nepavyko.";
        }

        if (editor?.type === "job" && editor.id === actionDialog.jobId) {
          setEditor(null);
        }

        setNotice(
          `Darbas „${actionDialog.name}“ ištrintas.${cleanupWarning}`
        );
      }

      setActionDialog(null);
      setActionReason("");
      setActionConfirm("");
      await loadAdminData(true);
    } catch (err) {
      setActionError(err?.message || "Administratoriaus veiksmo atlikti nepavyko.");
    } finally {
      setActionBusy(false);
    }
  }

  function formatAdminDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("lt-LT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function bytesLabel(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  const ADMIN_PAGE_SIZE = 10;

  function adminPageSlice(items) {
    const source = Array.isArray(items) ? items : [];
    const pageCount = Math.max(1, Math.ceil(source.length / ADMIN_PAGE_SIZE));
    const page = Math.min(Math.max(1, adminPage), pageCount);
    const start = (page - 1) * ADMIN_PAGE_SIZE;
    return source.slice(start, start + ADMIN_PAGE_SIZE);
  }

  function renderAdminPagination(totalItems) {
    const total = Number(totalItems || 0);
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
    if (pageCount <= 1) return null;

    const page = Math.min(Math.max(1, adminPage), pageCount);

    return (
      <div className="admin-pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setAdminPage((current) => Math.max(1, current - 1))}
        >
          Ankstesnis
        </button>
        <span>
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() =>
            setAdminPage((current) => Math.min(pageCount, current + 1))
          }
        >
          Sekantis puslapis
        </button>
      </div>
    );
  }

  function adminEmploymentStatusLabel(value) {
    return ({
      offered: "Laukiama darbuotojo",
      active: "Aktyvus įdarbinimas",
      ended: "Įdarbinimas pasibaigęs",
      declined: "Darbuotojas atmetė",
      withdrawn: "Pasiūlymas atšauktas",
    })[value] || value || "—";
  }

  function adminEmploymentStatusTone(value) {
    if (value === "active") return "green";
    if (value === "offered") return "orange";
    if (value === "ended") return "gray";
    return "red";
  }

  const activeLongTermPlacements = longTermPlacements.filter(
    (item) => item.status === "active"
  );
  const pendingLongTermPlacements = longTermPlacements.filter(
    (item) => item.status === "offered"
  );
  const endedLongTermPlacements = longTermPlacements.filter(
    (item) => item.status === "ended"
  );
  const longTermPlacementsThisMonth = longTermPlacements.filter((item) => {
    if (!item?.created_at) return false;
    const created = new Date(item.created_at);
    const now = new Date();
    return (
      !Number.isNaN(created.getTime()) &&
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }).length;

  const trafficToday = Number(visitorAnalytics?.today || 0);
  const trafficYesterday = Number(visitorAnalytics?.yesterday || 0);
  const trafficDevices = visitorAnalytics?.todayDevices || {};
  const trafficCities = Array.isArray(visitorAnalytics?.todayCities)
    ? visitorAnalytics.todayCities
    : [];
  const trafficDaily = Array.isArray(visitorAnalytics?.daily)
    ? visitorAnalytics.daily
    : [];
  const trafficMaxDaily = Math.max(
    1,
    ...trafficDaily.map((item) => Number(item?.count || 0))
  );

  function adminTrafficDateLabel(value) {
    if (!value) return "—";
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("lt-LT", {
      month: "2-digit",
      day: "2-digit",
    });
  }

  if (loading) {
    return <SilentLoader fullscreen size={28} />;
  }

  const adminEmploymentActive = longTermPlacements.filter((item) => item.status === "active").length;
  const adminGoTab = (key) => {
    if (key === "__delete") { setDeleteAccountOpen(true); return; }
    setActiveTab(key);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  };
  return (
    <P24Shell
      current={activeTab}
      onGo={adminGoTab}
      groups={[
        ["Apžvalga", [{ key: "overview", label: "Suvestinė", icon: "overview" }]],
        ["Naudotojai", [
          { key: "workers", label: "Darbuotojai", icon: "people" },
          { key: "employers", label: "Darbdaviai", icon: "home" },
          { key: "workAbroadInterest", label: "Domisi darbu užsienyje", icon: "nav" },
        ]],
        ["Darbai", [
          { key: "jobs", label: "Visi darbai", icon: "jobs" },
          { key: "jobAds", label: "Darbo skelbimai", icon: "briefcase" },
          { key: "employment", label: "Įdarbinti darbuotojai", icon: "briefcase", badge: adminEmploymentActive },
          { key: "foreignHire", label: "Tarptautinė atranka", icon: "user", badge: foreignHireAlertCount },
        ]],
        ["Priežiūra", [
          { key: "disputes", label: "Ginčai", icon: "shield", badge: activeDisputeCount },
          { key: "bugs", label: "Svetainės klaidos", icon: "bell", badge: activeSiteBugCount },
          { key: "ratings", label: "Atsiliepimai", icon: "star" },
          { key: "teamChats", label: "Pokalbiai", icon: "chat" },
          { key: "files", label: "Failai", icon: "file" },
        ]],
        ["Sistema", [
          { key: "monthlyAwards", label: "Mėnesio geriausi", icon: "star" },
          { key: "audit", label: "Veiksmų istorija", icon: "history" },
        ]],
      ]}
      tabs={[
        { key: "overview", label: "Suvestinė", icon: "overview" },
        { key: "workers", label: "Žmonės", icon: "people" },
        { key: "disputes", label: "Ginčai", icon: "shield", badge: activeDisputeCount },
        { key: "bugs", label: "Klaidos", icon: "bell", badge: activeSiteBugCount },
      ]}
      who={{ name: "Administratorius", sub: "statybos24.lt", initials: "AD", onClick: () => adminGoTab("audit"), onLogout }}
      extra={[
        { key: "worker", label: "Darbuotojo režimas", icon: "user", onClick: onOpenWorker },
        { key: "employer", label: "Darbdavio režimas", icon: "home", onClick: onOpenEmployer },
        { key: "delete", label: "Ištrinti paskyrą", icon: "x", onClick: () => setDeleteAccountOpen(true) },
      ]}
    >
    <div className="admin-page">
      <style>{`
        .admin-page{min-height:0;background:transparent;color:#222631}
        .admin-topbar{min-height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:100}
        .admin-topbar-inner{width:min(1280px,calc(100% - 40px));margin:auto;display:flex;justify-content:space-between;align-items:center;gap:18px}
        .admin-top-actions{display:grid;grid-template-columns:repeat(4,160px);align-items:stretch;gap:8px;justify-content:flex-end}
        .admin-top-actions>*{width:160px;min-height:46px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center}
        .admin-mode{border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:9px;padding:9px 11px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .admin-mode.primary{border-color:#6b5b95;background:#6b5b95;color:#fff}
        .admin-shell{width:min(1280px,100%);margin:8px auto 40px}
        @media(max-width:899px){.admin-shell{width:calc(100% - 32px)!important;margin-top:16px}}
        .admin-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}
        .admin-head h1{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:34px;letter-spacing:-.035em}
        .admin-head p{margin:8px 0 0;color:#6c7a88;max-width:800px;line-height:1.5}
        .admin-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:20px}
        .admin-tab{width:100%;min-height:46px;border:1px solid #dbe4ea;background:#fff;color:#526374;border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;font-weight:800;line-height:1.25;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center}
        .admin-tab.active{background:#222631;color:#fff;border-color:#222631}
        /* Custom sections dropdown uses the site's own visual language, not a native select. */
        .admin-tabs{position:relative;z-index:5}
        .admin-extra-wrap{position:relative;min-width:0}
        .admin-extra-trigger{gap:10px;position:relative;transition:background .15s ease,border-color .15s ease}
        .admin-extra-trigger:hover:not(.active){background:#f8fafb;border-color:#c9d7e0;color:#222631}
        .admin-extra-trigger:focus-visible{outline:2px solid #6b5b95;outline-offset:3px}
        .admin-extra-chevron{width:14px;height:14px;flex:none;transition:transform .15s ease;stroke:currentColor}
        .admin-extra-trigger[aria-expanded="true"] .admin-extra-chevron{transform:rotate(180deg)}
        .admin-extra-panel{position:absolute;top:calc(100% + 8px);right:0;width:max(100%,290px);max-width:calc(100vw - 32px);max-height:min(440px,65vh);overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;padding:8px;background:#fff;border:1px solid #dbe4ea;border-radius:14px;box-shadow:0 18px 48px rgba(34,38,49,.16),0 4px 12px rgba(34,38,49,.07)}
        .admin-extra-heading{padding:10px 12px 9px;margin:0 0 3px;border-bottom:1px solid #edf1f4;color:#7a8996;font-size:11px;font-weight:800;letter-spacing:.035em}
        .admin-extra-item{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:42px;margin:2px 0;padding:10px 12px;box-sizing:border-box;background:transparent;border:0;border-radius:9px;color:#222631;text-align:left;font:inherit;font-size:12.5px;font-weight:750;line-height:1.3;cursor:pointer;transition:background .12s ease,color .12s ease}
        .admin-extra-item:hover,.admin-extra-item:focus-visible{background:#f2f6f9;color:#222631}
        .admin-extra-item:focus-visible{outline:2px solid #6b5b95;outline-offset:-2px}
        .admin-extra-item.selected,.admin-extra-item.selected:hover{background:#222631;color:#fff}
        .admin-extra-check{font-size:14px;font-weight:900;flex:none}
        .admin-tab.bug-alert,.admin-tab.dispute-alert,.admin-tab.foreign-hire-alert{background:#c63f34;color:#fff;border-color:#c63f34;box-shadow:0 7px 18px rgba(198,63,52,.18)}
        .admin-tab.bug-alert:hover,.admin-tab.dispute-alert:hover,.admin-tab.foreign-hire-alert:hover{background:#b7362d;border-color:#b7362d}
        .admin-tab.bug-alert.active,.admin-tab.dispute-alert.active,.admin-tab.foreign-hire-alert.active{background:#a92f27;border-color:#a92f27;color:#fff}
        .admin-kpis{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:11px}
        .admin-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:17px;min-height:116px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 7px 22px rgba(34,38,49,.035)}
        .admin-kpi span{color:#6c7a88;font-size:12px;line-height:1.35;min-height:33px}.admin-kpi b{font-family:Manrope,Inter,sans-serif;font-size:28px;line-height:1;margin-top:12px}
        .admin-kpi.attention{border-color:#f0c4b5;background:#fffaf8}.admin-kpi.attention b{color:#b64d2a}
        .admin-traffic{margin-top:18px}.admin-traffic-top{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.admin-traffic-stat{border:1px solid #e4ebf0;border-radius:13px;background:#f8fafb;padding:14px}.admin-traffic-stat span{display:block;color:#6c7a88;font-size:11px;line-height:1.35}.admin-traffic-stat b{display:block;margin-top:8px;font-family:Manrope,Inter,sans-serif;font-size:25px;line-height:1;color:#222631}.admin-traffic-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:16px;margin-top:16px}.admin-traffic-subtitle{font-size:12px;font-weight:800;color:#526374;margin-bottom:10px}.admin-traffic-chart{height:170px;display:flex;align-items:flex-end;gap:6px;padding:14px 8px 4px;border:1px solid #edf1f4;border-radius:12px;background:#fbfcfd}.admin-traffic-day{min-width:0;flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px}.admin-traffic-value{font-size:9px;font-weight:800;color:#526374;line-height:1}.admin-traffic-bar-wrap{width:100%;height:118px;display:flex;align-items:flex-end;justify-content:center}.admin-traffic-bar{width:min(22px,72%);min-height:2px;border-radius:5px 5px 2px 2px;background:#1c9b67}.admin-traffic-day-label{font-size:9px;color:#7a8996;white-space:nowrap}.admin-traffic-cities{display:grid;gap:7px}.admin-traffic-city{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #edf1f4;padding:7px 0;font-size:12px}.admin-traffic-city:last-child{border-bottom:0}.admin-traffic-city span{color:#526374}.admin-traffic-city b{color:#222631}.admin-traffic-note{margin-top:10px;color:#7a8996;font-size:11px;line-height:1.45}
        .admin-toast-stack{position:relative;z-index:1;display:grid;gap:8px;width:100%;margin:0 0 14px}
        .admin-toast{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:13px;padding:12px 14px;box-shadow:0 4px 14px rgba(34,38,49,.035);font-size:13px;font-weight:750;line-height:1.45}
        .admin-toast.ok{background:#edf8f3;border:1px solid #bfe6d3;color:#146f4d}
        .admin-toast.err{background:#fff0ec;border:1px solid #efc4b7;color:#a6462b}
        .admin-toast button{border:0;background:transparent;color:inherit;font:inherit;font-size:18px;line-height:1;cursor:pointer;padding:0 1px}
        .admin-section{width:100%;box-sizing:border-box;background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:20px;box-shadow:0 8px 28px rgba(34,38,49,.035)}
        .admin-section+.admin-section{margin-top:14px}
        .admin-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
        .admin-section h2{font-family:Manrope,Inter,sans-serif;margin:0;font-size:20px}
        .admin-awards-month{margin-top:4px;color:#6c7a88;font-size:12px;font-weight:700}
        .admin-awards-group+.admin-awards-group{margin-top:18px}.admin-awards-group h3{margin:0 0 10px;font-family:Manrope,Inter,sans-serif;font-size:16px;color:#222631}
        .admin-awards-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .admin-award-card{min-height:152px;border:1px solid #e4ebf0;border-radius:15px;background:#f8fafb;padding:15px;display:flex;align-items:center;gap:14px;box-sizing:border-box}.admin-award-card.empty{justify-content:center;text-align:center;color:#7a8996;border-style:dashed}
        .admin-award-copy{min-width:0}.admin-award-copy span{display:block;color:#6c7a88;font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:800}.admin-award-copy b{display:block;margin-top:5px;font-size:16px;color:#222631}.admin-award-copy strong{display:block;margin-top:5px;color:#453a63;font-size:12px}.admin-award-copy small{display:block;margin-top:4px;color:#7a8996;font-size:11px;line-height:1.4}
        .admin-muted{color:#6c7a88;font-size:13px;line-height:1.5}
        .admin-list{display:grid;gap:10px}
        .admin-pagination{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid #edf1f4}.admin-pagination button{border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:9px;padding:9px 13px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.admin-pagination button:disabled{opacity:.42;cursor:not-allowed}.admin-pagination span{min-width:58px;text-align:center;color:#6c7a88;font-size:12px;font-weight:800}
        .admin-row{width:100%;box-sizing:border-box;display:grid;grid-template-columns:minmax(240px,1.35fr) repeat(3,minmax(130px,.72fr)) minmax(110px,auto);gap:14px;align-items:center;border:1px solid #e4ebf0;border-radius:12px;padding:13px 15px}
        .admin-row-title b{display:block;font-size:14px}.admin-row-title span{display:block;margin-top:3px;color:#6c7a88;font-size:12px;line-height:1.4}
        .admin-cell span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}.admin-cell b{font-size:13px}
        .admin-pill{display:inline-flex;width:max-content;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800}
        .admin-pill.green{background:#edf8f3;color:#167a54}.admin-pill.orange{background:#f1eef8;color:#453a63}.admin-pill.red{background:#fff0ec;color:#b64d2a}.admin-pill.gray{background:#f1f4f6;color:#667788}
        .admin-small-btn{border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:8px;padding:8px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .admin-small-btn.danger{color:#b64d2a;border-color:#e8bbae}
        .admin-small-btn.warning{color:#453a63;border-color:#b0a5ce}
        .admin-small-btn:disabled{opacity:.55;cursor:wait}
        .admin-row-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        .admin-bug-list{display:grid;gap:10px}
        .admin-bug-row{display:grid;grid-template-columns:minmax(260px,1.3fr) minmax(170px,.7fr) minmax(120px,.45fr) auto;gap:14px;align-items:center;border:1px solid #e4ebf0;border-radius:13px;padding:14px 16px;background:#fff}
        .admin-bug-row.active{border-color:#efc5bd;background:#fffaf9}
        .admin-bug-row.resolved{background:#fbfcfd}
        .admin-bug-row.irrelevant{background:#f7f9fa;border-color:#dfe6eb}
        .admin-bug-person b{display:block;font-size:14px}.admin-bug-person span{display:block;margin-top:3px;color:#6c7a88;font-size:12px;line-height:1.4}
        .admin-bug-meta span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.admin-bug-meta b{font-size:13px}
        .admin-bug-actions{display:flex;justify-content:flex-end;gap:8px}
        .admin-bug-resolved-note{margin-top:14px;padding:11px 12px;border:1px solid #bfe2d3;border-radius:11px;background:#eff8f4;color:#146f4d;font-size:12px;font-weight:800;line-height:1.45}
        .admin-dispute{border:1px solid #e4ebf0;border-radius:14px;padding:18px}.admin-dispute+.admin-dispute{margin-top:10px}
        .admin-dispute-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
        .admin-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:13px}.admin-fact{background:#f6f8fa;border-radius:10px;padding:11px}.admin-fact span{display:block;color:#6c7a88;font-size:10px;margin-bottom:4px}.admin-fact b{font-size:13px}
        .admin-note{margin-top:10px;padding:11px;border-radius:10px;background:#f1eef8;color:#433960;font-size:13px;line-height:1.5}
        .admin-resolution-field{margin-top:14px;border:1px solid #dbe4ea;border-radius:12px;background:#f8fafb;padding:12px}
        .admin-resolution-field label{display:block;font-size:12px;font-weight:800;color:#222631;margin-bottom:7px}
        .admin-resolution-field textarea{width:100%;min-height:92px;resize:vertical;border:1px solid #d6e0e7;border-radius:10px;background:#fff;padding:10px 12px;color:#222631;font:inherit;line-height:1.5;outline:none;box-sizing:border-box}
        .admin-resolution-field textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
        .admin-resolution-help{margin-top:6px;font-size:11px;color:#6c7a88;line-height:1.45}
        .admin-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}
        .admin-modal-overlay{position:fixed;inset:0;background:rgba(34,38,49,.62);z-index:9000;display:grid;place-items:center;padding:20px}
        .admin-modal{width:min(760px,100%);max-height:calc(100dvh - 40px);overflow-y:auto;overflow-x:hidden;background:#fff;border-radius:18px;padding:22px;box-sizing:border-box;box-shadow:0 28px 90px rgba(34,38,49,.28);scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#98a5ae transparent}.admin-modal::-webkit-scrollbar{width:8px}.admin-modal::-webkit-scrollbar-track{background:transparent}.admin-modal::-webkit-scrollbar-thumb{background:#98a5ae;border-radius:999px;border:2px solid #fff}
        .admin-modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:17px}.admin-modal-head h2{margin:2px 0 0;font-family:Manrope,Inter,sans-serif;font-size:22px}
        .admin-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:13px}.admin-wide{grid-column:1/-1}
        .admin-label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#526374}.admin-input{width:100%;border:1px solid #dbe4ea;border-radius:9px;padding:10px 11px;font:inherit;color:#222631;background:#fff}.admin-textarea{min-height:100px;resize:vertical}
        .admin-empty{padding:24px;border:1px dashed #d7e0e6;border-radius:12px;color:#6c7a88;text-align:center}
        .admin-foreign-list{display:grid;gap:12px}.admin-foreign-card.is-new{border-color:#e6aaa4!important;box-shadow:0 8px 24px rgba(198,63,52,.08)!important}.admin-foreign-summary{width:100%;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:pointer}.admin-foreign-summary-id{font:900 13px/1.2 Manrope,Inter,sans-serif;letter-spacing:.06em;color:#222631}.admin-foreign-summary-info{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;min-width:0;flex:1}.admin-foreign-summary-company{font:750 13px/1.4 Inter,sans-serif;color:#41566a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}@media(max-width:520px){.admin-foreign-summary-info{gap:4px;flex-direction:column;align-items:flex-start}.admin-foreign-summary-company{font-size:12px;width:100%}}.admin-foreign-summary-id small{display:block;margin-top:4px;color:#80909c;font:750 9px/1.2 Inter,sans-serif;letter-spacing:.03em}.admin-foreign-summary-toggle{width:32px;height:32px;flex:0 0 32px;border:1px solid #dfe7ec;border-radius:9px;display:grid;place-items:center;color:#222631;font-size:16px;font-weight:900;background:#f8fafb}.admin-foreign-expanded{margin-top:14px;padding-top:14px;border-top:1px solid #e8edf1}.admin-candidate-simple-actions{display:flex;justify-content:flex-end;margin-bottom:10px}
.admin-foreign-card.search-completed{background:#effaf3!important;border-color:#8fd3ac!important;box-shadow:0 8px 24px rgba(21,128,74,.09)!important}.admin-foreign-card.search-completed .admin-foreign-summary{background:#effaf3}.admin-foreign-card.search-completed .admin-foreign-expanded{border-color:#cbead7}
                .admin-foreign-card{border:1px solid #e2e9ee;border-radius:15px;background:#fff;padding:17px}.admin-foreign-card.has-employer-action{border-color:#afa4ce;box-shadow:0 10px 28px rgba(107,91,149,.10)}.admin-foreign-employer-alert{margin-top:12px;padding:11px 12px;border:1px solid #bab1d5;border-radius:11px;background:#f4f3f9;display:flex;align-items:center;justify-content:space-between;gap:12px}.admin-foreign-employer-alert.interview{border-color:#efb0aa;background:#fff1ef}.admin-foreign-employer-alert{margin-bottom:16px}.admin-foreign-employer-alert.interview{margin-bottom:16px}.admin-foreign-employer-alert>div{min-width:0}.admin-foreign-employer-alert strong{display:block;color:#222631;font-size:11px}.admin-foreign-employer-alert span{display:block;margin-top:3px;color:#6f7d88;font-size:10px;line-height:1.4}.admin-foreign-employer-alert .admin-small-btn{flex:0 0 auto}.admin-foreign-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.admin-foreign-head h3{margin:0;font:800 17px/1.25 Manrope,Inter,sans-serif}.admin-foreign-head p{margin:5px 0 0;color:#6c7a88;font-size:12px}.admin-foreign-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.admin-foreign-fact{padding:11px 12px;border-radius:11px;background:#f8fafb;border:1px solid #edf1f4}.admin-foreign-fact span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.045em;margin-bottom:5px}.admin-foreign-fact b,.admin-foreign-fact a{color:#222631;font-size:12px;font-weight:800;overflow-wrap:anywhere}.admin-foreign-roles{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.admin-foreign-role{padding:7px 9px;border-radius:9px;background:#eef4f8;color:#282d3a;font-size:11px;font-weight:800}.admin-foreign-note{margin-top:12px;padding:11px 12px;background:#f6f4fa;border:1px solid #d4cde4;border-radius:10px;color:#6b5846;font-size:12px;line-height:1.5;white-space:pre-wrap}.admin-foreign-role-heading{grid-column:1 / -1;font-size:12px;font-weight:850;color:#222631;padding-top:6px}.admin-foreign-fact b{white-space:pre-wrap}.admin-foreign-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.admin-foreign-status{padding:7px 10px;border-radius:999px;background:#edf8f3;color:#167a54;font-size:11px;font-weight:850}.admin-foreign-status.new{background:#f1eef8;color:#433960}.admin-foreign-status.declined{background:#fff0ec;color:#b64d2a}
        .admin-candidate-zone{margin-top:16px;border-top:1px solid #e6edf2;padding-top:16px}.admin-candidate-zone-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.admin-candidate-zone-head strong{font:850 14px/1.25 Manrope,Inter,sans-serif;color:#222631}.admin-candidate-zone-head span{display:block;margin-top:3px;color:#71808d;font-size:11px}.admin-candidate-tools{margin-top:12px;padding:13px;border:1px solid #e2e9ee;border-radius:13px;background:#f8fafb}.admin-candidate-search{display:grid;grid-template-columns:minmax(160px,1.3fr) minmax(160px,1fr) auto auto;gap:8px;align-items:end}.admin-candidate-field label,.admin-external-field label{display:block;margin:0 0 5px;color:#768694;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.admin-candidate-field input,.admin-external-field input,.admin-external-field textarea{width:100%;box-sizing:border-box;border:1px solid #dce5eb;background:#fff;border-radius:9px;padding:9px 10px;color:#222631;font:700 12px/1.3 Manrope,Inter,sans-serif;outline:none}.admin-candidate-field input:focus,.admin-external-field input:focus,.admin-external-field textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.09)}.admin-worker-results{display:grid;gap:8px;margin-top:10px}.admin-worker-result{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px;border:1px solid #e3e9ed;border-radius:11px;background:#fff}.admin-worker-result strong{display:block;color:#222631;font-size:12px}.admin-worker-result small{display:block;color:#71808d;font-size:10px;line-height:1.45;margin-top:3px}.admin-worker-skill{display:flex;flex-wrap:wrap;gap:4px}.admin-worker-skill span{padding:4px 6px;border-radius:7px;background:#eef4f8;color:#29465d;font-size:9px;font-weight:800}.admin-candidates-list{display:grid;gap:9px;margin-top:12px}.admin-candidate-card{border:1px solid #dfe7ec;border-radius:12px;background:#fff;padding:13px}.admin-candidate-card-head.is-interview-requested{background:#f0edf7!important;border:1px solid #aca1cc!important;border-radius:9px;padding:10px 12px!important}.admin-candidate-card-head.is-interview-requested h4{color:#433960}.admin-candidate-card-head.is-employer-accepted{background:#eaf8f0!important;border:1px solid #9fd7b8!important;border-radius:9px;padding:10px 12px!important}.admin-candidate-card-head.is-employer-accepted h4{color:#176c4d}.admin-candidate-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.admin-candidate-card-head h4{margin:0;font:850 14px/1.25 Manrope,Inter,sans-serif}.admin-candidate-card-head p{margin:4px 0 0;color:#71808d;font-size:10px}.admin-candidate-chip{padding:6px 8px;border-radius:999px;background:#eef4f8;color:#27465e;font-size:9px;font-weight:850;white-space:nowrap}.admin-candidate-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.admin-candidate-meta>div{padding:8px 9px;border-radius:9px;background:#f8fafb}.admin-candidate-meta>div.wide{grid-column:span 2}.admin-candidate-meta span{display:block;color:#80909c;font-size:8px;text-transform:uppercase;letter-spacing:.06em}.admin-candidate-meta b{display:block;margin-top:3px;color:#222631;font-size:10px;overflow-wrap:anywhere}.admin-candidate-docs{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.admin-candidate-doc{display:inline-flex;align-items:center;gap:5px;padding:7px 8px;border:1px solid #dce5eb;border-radius:8px;background:#fff;color:#292e3c;font-size:10px;font-weight:800;text-decoration:none;cursor:pointer}.admin-candidate-doc input{display:none}.admin-candidate-consent{margin-top:9px;padding:9px 10px;border-radius:9px;background:#f6f4fa;border:1px solid #d4cde4;color:#6b5846;font-size:10px;line-height:1.45}.admin-candidate-consent.ok{background:#eef8f4;border-color:#cfe9dc;color:#236649}.admin-candidate-contact-share{margin-top:9px;padding:9px 10px;border-radius:9px;background:#f7f9fb;border:1px solid #e2e9ee;color:#637583;font-size:10px;line-height:1.45;display:flex;align-items:center;justify-content:space-between;gap:10px}.admin-candidate-contact-share.interview-ready{background:#eaf8ef;border-color:#a8dcc0;color:#17633e}.admin-candidate-contact-share.ok{background:#eef8f4;border-color:#cfe9dc;color:#236649}.admin-candidate-contact-share .admin-small-btn{flex:0 0 auto}.admin-candidate-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.admin-external-form{margin-top:12px;padding:13px;border:1px solid #dfe7ec;border-radius:12px;background:#fff}.admin-external-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.admin-external-field.wide{grid-column:span 2}.admin-external-field.full{grid-column:1/-1}.admin-external-field textarea{min-height:72px;resize:vertical}.admin-external-dropdown{min-height:39px;width:100%;box-sizing:border-box;border:1px solid #dce5eb;border-radius:9px;background:#fff;padding:9px 10px;color:#222631;font:700 12px/1.3 Manrope,Inter,sans-serif;outline:none}.admin-external-dropdown:focus-visible{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.09)}.admin-toggle-button{width:100%;border:1px solid #dce5eb;border-radius:9px;background:#fff;padding:9px 10px;text-align:left;color:#526675;font-size:11px;font-weight:800;cursor:pointer}.admin-toggle-button.active{border-color:#222631;background:#222631;color:#fff}.admin-candidate-legal-note{margin-top:12px;padding:10px 11px;border-left:3px solid #6b5b95;background:#fffaf4;color:#6b5846;font-size:10px;line-height:1.5}.admin-candidate-job-confirmation{margin-top:11px;padding-top:11px;border-top:1px solid #edf1f4}.admin-candidate-job-note{margin-top:8px;padding:8px 9px;border-radius:8px;background:#f7f9fb;color:#73828d;font-size:9.5px;line-height:1.45}.admin-job-confirm-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:9px}.admin-job-confirm-summary>div{padding:8px 9px;border-radius:8px;background:#f8fafb}.admin-job-confirm-summary span{display:block;color:#82919c;font-size:7.5px;text-transform:uppercase;letter-spacing:.06em}.admin-job-confirm-summary b{display:block;margin-top:3px;color:#222631;font-size:9.5px;overflow-wrap:anywhere}.admin-job-confirm-form{margin-top:10px;padding:11px;border:1px solid #e1e8ed;border-radius:11px;background:#f9fbfc}
        @media(max-width:900px){.admin-foreign-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-candidate-search{grid-template-columns:1fr 1fr}.admin-worker-result{grid-template-columns:1fr}.admin-candidate-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-external-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-job-confirm-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.admin-candidate-meta>div.wide{grid-column:auto}.admin-foreign-employer-alert{align-items:flex-start;flex-direction:column}.admin-foreign-employer-alert .admin-small-btn{width:100%}.admin-foreign-head{flex-direction:column}.admin-foreign-grid{grid-template-columns:1fr}.admin-foreign-card{padding:14px}.admin-candidate-search,.admin-external-grid{grid-template-columns:1fr}.admin-external-field.wide{grid-column:auto}.admin-candidate-meta{grid-template-columns:1fr}.admin-candidate-zone-head{align-items:flex-start;flex-direction:column}.admin-job-confirm-summary{grid-template-columns:1fr}}
        .admin-foreign-access-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:13px;padding-top:13px;border-top:1px solid #edf1f4}.admin-foreign-access-summary>div{border:1px solid #e4ebf0;border-radius:10px;padding:10px 11px;background:#fbfcfd}.admin-foreign-access-summary span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.045em;margin-bottom:4px}.admin-foreign-access-summary b,.admin-foreign-access-summary a{font-size:12px;font-weight:850;color:#222631;overflow-wrap:anywhere}.admin-foreign-access-summary>div>b{display:block}.admin-foreign-access-summary>div>a{display:inline-flex;margin-top:6px}.admin-foreign-brief{margin-top:12px;border:1px solid #dfe7ec;border-radius:12px;background:#fbfcfd;overflow:hidden}.admin-foreign-brief summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 13px;color:#222631;font-size:12px;font-weight:850}.admin-foreign-brief summary::-webkit-details-marker{display:none}.admin-foreign-brief summary b{color:#453a63;font-size:11px}.admin-foreign-brief-body{padding:0 13px 13px;border-top:1px solid #edf1f4}.admin-foreign-brief-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-top:12px}.admin-foreign-brief-grid>div{padding:10px;border:1px solid #e6edf1;border-radius:9px;background:#fff}.admin-foreign-brief-grid span{display:block;color:#7a8996;font-size:9px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.admin-foreign-brief-grid b{font-size:11px;line-height:1.4;overflow-wrap:anywhere}.admin-foreign-brief-roles{display:grid;gap:7px;margin-top:10px}.admin-foreign-brief-roles>div{padding:10px 11px;border:1px solid #e6edf1;border-radius:9px;background:#fff}.admin-foreign-brief-roles strong{display:block;font-size:11px}.admin-foreign-brief-roles span{display:block;margin-top:4px;color:#6f7f8b;font-size:10px;line-height:1.45}.admin-foreign-credentials{margin-top:12px;border:1px solid #bfe6d3;background:#eff9f4;border-radius:12px;padding:13px}.admin-foreign-credentials strong{display:block;color:#126b4a;font-size:12px;margin-bottom:7px}.admin-foreign-credentials code{display:block;white-space:pre-wrap;overflow-wrap:anywhere;color:#282d3a;font:750 12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}.admin-foreign-credentials .admin-foreign-actions{margin-top:10px}.admin-foreign-setup{margin-top:14px;border:1px solid #dbe4ea;background:#f8fafb;border-radius:13px;padding:14px}.admin-foreign-setup h4{margin:0;font:850 14px/1.35 Manrope,Inter,sans-serif}.admin-foreign-setup p{margin:5px 0 12px;color:#6c7a88;font-size:11px;line-height:1.45}.admin-foreign-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.admin-foreign-field{display:grid;gap:5px}.admin-foreign-field span{color:#526374;font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.admin-foreign-field input{width:100%;box-sizing:border-box;border:1px solid #d6e0e7;border-radius:9px;background:#fff;color:#222631;padding:10px 11px;font:750 12px/1.3 Inter,system-ui,sans-serif;outline:none}.admin-foreign-field input:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.11)}.admin-foreign-file{grid-column:1/-1;border:1px dashed #cdd8df;border-radius:10px;padding:11px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}.admin-foreign-file-copy{min-width:0}.admin-foreign-file-copy b{display:block;font-size:12px;color:#222631;overflow-wrap:anywhere}.admin-foreign-file-copy span{display:block;margin-top:3px;color:#7a8996;font-size:10px}.admin-foreign-file input{display:none}.admin-foreign-setup-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px}@media(max-width:900px){.admin-foreign-access-summary{grid-template-columns:1fr 1fr}.admin-foreign-brief-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.admin-foreign-access-summary,.admin-foreign-setup-grid,.admin-foreign-brief-grid{grid-template-columns:1fr}.admin-foreign-file{grid-column:auto;align-items:flex-start;flex-direction:column}}
        .admin-file-link{color:#222631;font-weight:800;text-decoration:underline}
        .admin-employment-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px}.admin-employment-stat{border:1px solid #e4ebf0;border-radius:12px;padding:14px;background:#f8fafb}.admin-employment-stat span{display:block;color:#6c7a88;font-size:11px;margin-bottom:7px}.admin-employment-stat b{font-family:Manrope,Inter,sans-serif;font-size:24px}.admin-employment-list{display:grid;gap:9px}.admin-employment-row{display:grid;grid-template-columns:minmax(220px,1.25fr) minmax(200px,1fr) minmax(160px,.75fr) minmax(150px,.72fr) minmax(130px,.65fr);gap:14px;align-items:center;border:1px solid #e4ebf0;border-radius:13px;padding:14px 15px}.admin-employment-person b{display:block;font-size:14px}.admin-employment-person span{display:block;margin-top:3px;color:#6c7a88;font-size:12px;line-height:1.4}.admin-employment-cell span{display:block;color:#7a8996;font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.admin-employment-cell b{font-size:13px}.admin-employment-contract{color:#526374;font-size:12px;line-height:1.45}.admin-employment-empty{padding:28px;border:1px dashed #d7e0e6;border-radius:12px;color:#6c7a88;text-align:center}
        @media(max-width:1120px){.admin-tabs{grid-template-columns:repeat(4,minmax(0,1fr))}.admin-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.admin-employment-row{grid-template-columns:1fr 1fr}.admin-employment-row>:last-child{grid-column:1/-1}.admin-employment-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:900px){.admin-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-awards-grid{grid-template-columns:1fr}.admin-row{grid-template-columns:1fr 1fr}.admin-row>:last-child{grid-column:1/-1}.admin-bug-row{grid-template-columns:1fr 1fr}.admin-bug-actions{grid-column:1/-1;justify-content:flex-start}.admin-facts{grid-template-columns:1fr 1fr}.admin-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-traffic-grid{grid-template-columns:1fr}.admin-traffic-top{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:620px){.admin-modal-overlay{padding:10px}.admin-modal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:17px;border-radius:16px}.admin-tabs{grid-template-columns:1fr}.admin-topbar-inner,.admin-shell{width:min(100% - 24px,1280px)}.admin-topbar-inner,.admin-head{align-items:flex-start;flex-direction:column}.admin-topbar-inner{padding:14px 0 16px;gap:14px}.admin-top-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));justify-content:stretch;gap:8px;width:100%}.admin-top-actions>*{width:100%;min-height:46px;box-sizing:border-box}.admin-grid-2,.admin-facts,.admin-row,.admin-bug-row,.admin-kpis,.admin-employment-stats,.admin-employment-row,.admin-traffic-top{grid-template-columns:1fr}.admin-wide,.admin-row>:last-child,.admin-employment-row>:last-child{grid-column:auto}.admin-bug-actions{grid-column:auto}.admin-head h1{font-size:28px}.admin-toast-stack{width:100%}.admin-traffic-chart{gap:3px;padding-left:3px;padding-right:3px}.admin-traffic-day-label{font-size:8px}.admin-traffic-value{font-size:8px}}
      `}</style>



      <main className="admin-shell">
        {(notice || error) && (
          <div className="admin-toast-stack">
            {notice && (
              <div className="admin-toast ok">
                <span>{notice}</span>
                <button
                  type="button"
                  aria-label="Uždaryti pranešimą"
                  onClick={() => setNotice("")}
                >
                  <CloseMark />
                </button>
              </div>
            )}

            {error && (
              <div className="admin-toast err">
                <span>{error}</span>
                <button
                  type="button"
                  aria-label="Uždaryti klaidos pranešimą"
                  onClick={() => setError("")}
                >
                  <CloseMark />
                </button>
              </div>
            )}
          </div>
        )}




        {activeTab === "workAbroadInterest" && <AdminWorkAbroadInterests onOpenProfile={openAbroadWorkerProfile}/>}
        {activeTab === "jobAds" && <AdminJobAds />}
        <WorkerProfileModal worker={abroadProfile} jobId={null} canViewWorkerMetrics={true} onClose={()=>setAbroadProfile(null)}/>

        {activeTab === "overview" && (
          <>
            {accountDayError && <p role="alert" style={{fontSize:12,color:"#b64d2a"}}>{accountDayError}</p>}
            <style>{`
              .admin-kpis .admin-daily-logins{grid-column:span 2;justify-content:flex-start;gap:12px;min-width:0}
              .admin-kpis .admin-daily-title{min-height:0;font-size:12px;line-height:1.35}
              .admin-daily-rows{display:grid;gap:8px}
              .admin-daily-rows>div{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
              .admin-kpis .admin-daily-rows span{min-height:0;font-size:12px;color:#607180}
              .admin-kpis .admin-daily-rows b{margin:0;font-size:22px;line-height:1.2;white-space:nowrap}
              .admin-daily-rows small{font-size:16px;color:#8a98a6;font-weight:600}
              @media(max-width:620px){.admin-kpis .admin-daily-logins{grid-column:1/-1}}
            `}</style>
            {(() => {
              const regW = accountDayStats?.workersRegisteredToday;
              const regE = accountDayStats?.employersRegisteredToday;
              const regTotal = regW == null && regE == null ? "—" : Number(regW || 0) + Number(regE || 0);
              const loginTotal = accountDayStats ? Number(accountDayStats.workersToday || 0) + Number(accountDayStats.employersToday || 0) : "—";
              const openDisputes = disputes.filter((dispute) => !dispute?.dispute_status || dispute.dispute_status === "disputed");
              const activeBugs = siteBugReports.filter((report) => report.status === "active");
              const queue = [
                ...openDisputes.map((dispute) => ({ key: `d${dispute.attendance_id}`, icon: "shield", title: `Ginčas: ${dispute.worker_name || "Darbuotojas"} ↔ ${dispute.company_name || "Įmonė"}`, sub: String(dispute.job_title || "").toLocaleUpperCase("lt-LT"), label: "Spręsti", primary: true, go: "disputes" })),
                ...activeBugs.map((report) => ({ key: `b${report.id}`, icon: "bell", title: `Klaida: ${report.reporter_name || report.reporter_email || "naudotojas"}`, sub: report.created_at ? new Date(report.created_at).toLocaleString("lt-LT", { dateStyle: "short", timeStyle: "short" }) : "", label: "Peržiūrėti", go: "bugs" })),
                ...(foreignHireAlertCount ? [{ key: "fh", icon: "people", title: `Tarptautinė atranka: ${foreignHireAlertCount} reikia peržiūrėti`, sub: "Užklausos ir kandidatai", label: "Atidaryti", go: "foreignHire" }] : []),
              ];
              const tile = (icon, label, value, sub, go, hot) => (
                <button type="button" className={`ovcard ntile${hot ? " hot" : ""}`} onClick={() => adminGoTab(go)}>
                  <span className="ovtop"><small>{label}</small><span className="ntic"><Svg name={icon} size={18} /></span></span>
                  <b className="ovval">{value}</b>
                  <span className="ovsub">{hot ? <i className="ovdot" /> : null}{sub}</span>
                </button>
              );
              return (
                <>
                  <PageHead title="Suvestinė" lead={`Šiandien, ${new Date().toLocaleDateString("lt-LT")}`} />
                  <section className="ovsec">
                    <div className="ntiles">
                      {tile("user", "Šiandien užsiregistravo", regTotal, `${regW == null ? "—" : regW} darb. · ${regE == null ? "—" : regE} darbd.`, "workers")}
                      {tile("out", "Šiandien prisijungė", loginTotal, accountDayStats ? `${Number(accountDayStats.workersToday || 0)} darb. · ${Number(accountDayStats.employersToday || 0)} darbd.` : "Duomenys kraunami", "workers")}
                      {tile("jobs", "Aktyvūs darbai", Number(stats.openJobs || 0), "Visi atviri darbai", "jobs")}
                      {tile("shield", "Neišspręsti ginčai", Number(stats.unresolvedDisputes || 0), Number(stats.unresolvedDisputes || 0) ? "Reikia sprendimo" : "Nėra", "disputes", Number(stats.unresolvedDisputes || 0))}
                    </div>
                  </section>
                  <section className="card queue">
                    <header><div><h2>Reikia veiksmo{queue.length ? ` · ${queue.length}` : ""}</h2></div></header>
                    {queue.length ? (
                      <div className="qlist">
                        {queue.map((item) => (
                          <div className="qrow" key={item.key}>
                            <span className="qic o"><Svg name={item.icon} size={16} width={2.2} /></span>
                            <div className="qtx"><b>{item.title}</b><small>{item.sub}</small></div>
                            <div className="qbt"><button className={`btn sm${item.primary ? " primary" : ""}`} type="button" onClick={() => adminGoTab(item.go)}>{item.label}</button></div>
                          </div>
                        ))}
                      </div>
                    ) : <Empty title="Viskas sutvarkyta" sub="Šiuo metu jokių veiksmų nereikia." />}
                  </section>
                  <section className="ovsec">
                    <h2 className="sect">Šis mėnuo</h2>
                    <div className="stats">
                      <div className="stat"><small>Įvykdyti darbai</small><b>{Number(stats.completedJobs || 0)}</b><span className="muted small">Užbaigti darbai</span></div>
                      <div className="stat"><small>Atšaukti darbai</small><b>{Number(stats.cancelledJobs || 0)}</b><span className="muted small">Atšaukti darbai</span></div>
                      <div className="stat"><small>Panaudoti darbuotojai</small><b>{Number(stats.workersUsedThisMonth || 0)}</b><span className="muted small">Dirbo bent vieną dieną</span></div>
                      <div className="stat"><small>Įdarbinti darbuotojai</small><b>{activeLongTermPlacements.length}</b><span className="muted small">Ilgalaikis darbas</span></div>
                    </div>
                  </section>
                </>
              );
            })()}

            <section className="admin-section admin-traffic">
              <div className="admin-section-head">
                <div>
                  <div className="eyebrow">SVETAINĖS LANKOMUMAS</div>
                </div>
              </div>

              <div className="admin-traffic-top">
                <div className="admin-traffic-stat">
                  <span>Šiandien</span>
                  <b>{trafficToday}</b>
                </div>
                <div className="admin-traffic-stat">
                  <span>Vakar</span>
                  <b>{trafficYesterday}</b>
                </div>
                <div className="admin-traffic-stat">
                  <span>Telefonu šiandien</span>
                  <b>{Number(trafficDevices.mobile || 0)}</b>
                </div>
                <div className="admin-traffic-stat">
                  <span>Kompiuteriu šiandien</span>
                  <b>{Number(trafficDevices.desktop || 0)}</b>
                </div>
              </div>

              <div className="admin-traffic-grid">
                <div>
                  <div className="admin-traffic-subtitle">
                    Paskutinės {trafficDaily.length || 14} dienų
                  </div>
                  <div className="admin-traffic-chart">
                    {trafficDaily.map((item) => {
                      const count = Number(item?.count || 0);
                      const height = Math.max(
                        count > 0 ? 5 : 2,
                        Math.round((count / trafficMaxDaily) * 100)
                      );

                      return (
                        <div className="admin-traffic-day" key={item.date}>
                          <div className="admin-traffic-value">{count}</div>
                          <div className="admin-traffic-bar-wrap">
                            <div
                              className="admin-traffic-bar"
                              style={{ height: `${height}%` }}
                              title={`${item.date}: ${count}`}
                            />
                          </div>
                          <div className="admin-traffic-day-label">
                            {adminTrafficDateLabel(item.date)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="admin-traffic-subtitle">Lietuvos miestai šiandien</div>
                  <div className="admin-traffic-cities">
                    {trafficCities.length ? (
                      trafficCities.map((item) => (
                        <div
                          className="admin-traffic-city"
                          key={`${item.city}-${item.count}`}
                        >
                          <span>{item.city || "Nežinoma"}</span>
                          <b>{Number(item.count || 0)}</b>
                        </div>
                      ))
                    ) : (
                      <div className="admin-muted">
                        Šiandien lankytojų iš Lietuvos dar neužfiksuota.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-section" style={{ marginTop: 18, border: "1px solid #c6bfdc", background: "linear-gradient(135deg,#fff8f1,#fff)" }}>
              <div className="admin-section-head">
                <div>
                  <div className="eyebrow">PRISTATYMAS ĮMONĖMS</div>
                  <h2>Privati dalinimosi nuoroda</h2>
                </div>
                <span className="admin-pill green">Paruošta dalintis</span>
              </div>

              <div
                className="admin-presentation-share"
                style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center", marginTop: 14 }}
              >
                <div
                  className="admin-presentation-link"
                  style={{ minWidth: 0, padding: "11px 13px", border: "1px solid #dfe7ed", borderRadius: 10, background: "#fff", color: "#526374", fontSize: 12, overflowWrap: "anywhere" }}
                >
                  {presentationLink}
                </div>
                <div className="admin-presentation-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="admin-small-btn" type="button" onClick={openBusinessPresentation}>Atidaryti puslapį</button>
                  <button className="admin-small-btn" type="button" onClick={copyBusinessPresentationLink}>Kopijuoti nuorodą</button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "disputes" && (
          <AdminDisputesList
            disputes={disputes}
            notes={disputeResolutionNotes}
            setNote={(id, value) => setDisputeResolutionNotes((current) => ({ ...current, [id]: value }))}
            resolvingId={resolvingId}
            onResolve={resolveDispute}
            onMessage={(target) => setAdminMessageTarget({ ...target, role: "worker" })}
            onDiscuss={(dispute) => setAdminDisputeConversation({ attendanceId: dispute.attendance_id, title: `${formatJobTitle(dispute.job_title)} · Ginčo aptarimas`, workerName: dispute.worker_name, companyName: dispute.company_name })}
          />
        )}

        {activeTab === "foreignHire" && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Tarptautinė atranka</h2>
                <div className="admin-muted">
                  Užklausos rodomos kompaktiškai. Išskleiskite ID, kad matytumėte visą informaciją ir veiksmus.
                </div>
              </div>
              <b>{foreignHireRequests.length}</b>
            </div>

            <style>{`
              .admin-hire-overview { gap: 9px !important; }
              .admin-hire-overview-stat { border: 1px solid #e3eaf0 !important; border-radius: 12px !important; background: #fff !important; box-shadow: none !important; padding: 12px 14px !important; position: relative; }
              /* Visi poreikio santraukos duomenys turi vienodą švelnų mėlyną foną. */
              .admin-hire-overview-stat,
              .admin-hire-overview-stat:first-child,
              .admin-hire-overview-stat:nth-child(4) { background: #eef6ff !important; border-color: #d4e5f6 !important; }
              .admin-hire-overview-stat > div:first-child { color: #56718a !important; }
              .admin-hire-details-toggle { border-color: #dce6ed !important; border-radius: 12px !important; background: #f6f9fb !important; padding: 12px 14px !important; }
              .admin-hire-details-toggle .admin-small-btn { border-radius: 9px; font-weight: 750; white-space: nowrap; }
              .admin-hire-details-body { padding-top: 12px; }
              .admin-hire-detail-section { border: 1px solid #e2eaf0 !important; border-radius: 14px !important; background: #fff !important; box-shadow: none !important; padding: 16px !important; margin-bottom: 10px !important; }
              .admin-hire-detail-section h4 { font-size: 15px !important; letter-spacing: -.015em; }
              .admin-hire-detail-section .admin-foreign-grid { gap: 8px !important; }
              .admin-hire-detail-section .admin-foreign-fact { background: #f8fafc !important; border: 1px solid #edf1f5 !important; border-radius: 10px !important; padding: 11px 12px !important; min-width: 0; overflow-wrap: anywhere; }
              .admin-hire-detail-section .admin-foreign-fact span { color: #718497 !important; }
              .admin-hire-detail-section .admin-foreign-fact b { color: #242833 !important; line-height: 1.45; }

              @media (max-width: 640px) {
                .admin-hire-overview { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
                .admin-hire-overview-stat { padding: 10px 11px !important; }
                .admin-hire-details-toggle { align-items: stretch !important; }
                .admin-hire-details-toggle .admin-small-btn { width: 100%; }
                .admin-hire-detail-section { padding: 12px !important; }
              }
              @media (max-width: 370px) { .admin-hire-overview { grid-template-columns: 1fr !important; } }
            `}</style>

            {foreignHireRequests.length ? (
              <div className="admin-foreign-list">
                {adminPageSlice(foreignHireRequests).map((request) => {
                  const busy = foreignHireSavingId === request.request_id;
                  const setupOpen = foreignHireSetupRequest?.request_id === request.request_id;
                  const credentials =
                    foreignHireCredentials?.requestId === request.request_id
                      ? foreignHireCredentials
                      : null;
                  const credentialsText = credentials
                    ? foreignHireCredentialsText(request, credentials)
                    : "";
                  const mailSubject = `Statybos24 employer portal · ${request.company_name}`;
                  const mailBody = credentialsText ||
                    `Hello ${request.contact_name || ""},\n\nRegarding your Statybos24 workforce request.\n\nIf anything is unclear, please reply to this email.`;
                  const mailHref = `mailto:${request.business_email}?subject=${encodeURIComponent(
                    mailSubject
                  )}&body=${encodeURIComponent(mailBody)}`;
                  const candidatePanelOpen = foreignHireCandidateOpenId === request.request_id;
                  const requestCandidates = foreignHireCandidatesByRequest[request.request_id] || [];
                  const hasLoadedRequestCandidates = Object.prototype.hasOwnProperty.call(foreignHireCandidatesByRequest, request.request_id);
                  const pendingInterviewCount = hasLoadedRequestCandidates
                    ? requestCandidates.filter((candidate) => candidate.employer_response === "interview_requested" && !candidate.employer_contact_shared_at).length
                    : Number(request.employer_interview_requested_count || 0);
                  const pendingAcceptedCount = hasLoadedRequestCandidates
                    ? requestCandidates.filter((candidate) => candidate.employer_response === "accepted" && !["hired", "started", "rejected", "withdrawn"].includes(candidate.status)).length
                    : Number(request.employer_accepted_count || 0);
                  const expanded = foreignHireExpandedId === request.request_id;
                  const shortRequestId = String(request.request_id || "").slice(0, 8).toUpperCase();
                  const hasFullBrief = ["submitted", "approved"].includes(request.brief_status) && !!request.brief_workforce_details;
                  const fullNeed = request.brief_workforce_details || {};
                  const fullNeedTitle = fullNeed.needTitle || fullNeed.roles?.[0]?.profession || request.company_name;
                  const roleList = Array.isArray(fullNeed.roles) ? fullNeed.roles : [];
                  const detailsMinimized = foreignHireMinimized[request.request_id] !== false;
                  const totalRequestedWorkers = roleList.reduce((sum, role) => sum + Math.max(1, Number(role?.count || 0) || 0), 0);
                  const hiredWorkers = requestCandidates.filter((candidate) => ["hired", "started"].includes(candidate.status)).length;
                  const searchCompleted = request.status === "closed" || (totalRequestedWorkers > 0 && hiredWorkers >= totalRequestedWorkers);
                  const projectSummary = [fullNeed.projectCountry, fullNeed.projectLocation].filter(Boolean).join(" · ") || "—";
                  const salaryValue = `${fullNeed.salaryAmount || fullNeed.salaryMin || "—"}${fullNeed.salaryCurrency ? ` ${fullNeed.salaryCurrency}` : ""}`.trim();
                  const salarySummary = [salaryValue, fullNeed.salaryBasis].filter(Boolean).join(" · ") || "—";
                  const accommodationSummary = fullNeed.accommodation === "provided"
                    ? "Suteikia darbdavys"
                    : fullNeed.accommodation === "not_provided"
                      ? "Nesuteikiama"
                      : fullNeed.accommodation === "employee_contributes"
                        ? "Moka / prisideda darbuotojas"
                        : (fullNeed.accommodation || "—");
                  const homeTravelSummary = fullNeed.homeTravelPaid === "yes"
                    ? "Apmoka darbdavys"
                    : fullNeed.homeTravelPaid === "no"
                      ? "Darbdavys neapmoka"
                      : (fullNeed.homeTravel || "—");

                  return (
                    <article className={`admin-foreign-card ${searchCompleted ? "search-completed" : ["new", "employer_submitted"].includes(request.status) ? "is-new" : ""} ${!searchCompleted && (pendingInterviewCount+pendingAcceptedCount)>0 ? "has-employer-action" : ""}`} key={request.request_id}>
                      <button type="button" className="admin-foreign-summary" onClick={() => {
                        setForeignHireExpandedId(expanded ? null : request.request_id);
                        if (!expanded && (["sourcing", "closed"].includes(request.status) || Number(request.candidate_count || 0) > 0)) {
                          // Show candidates with their current data when opening the workforce request.
                          if (foreignHireCandidateOpenId !== request.request_id) {
                            setForeignHireCandidateOpenId(request.request_id);
                            setForeignHireExternalRequestId(null);
                            setForeignHireWorkerResults([]);
                          }
                          loadForeignHireCandidates(request.request_id).catch(() => {});
                        }
                      }} aria-expanded={expanded}>
                        <span className="admin-foreign-summary-info">
                          <span className="admin-foreign-summary-id">#{shortRequestId}</span>
                          <span className="admin-foreign-summary-company" title={request.brief_company_details?.legalName || request.company_name || ""}>{request.brief_company_details?.legalName || request.company_name || "Įmonė nenurodyta"}</span>
                        </span>
                        <span className="admin-foreign-summary-toggle" aria-hidden="true">{expanded ? "−" : "+"}</span>
                      </button>

                      {expanded ? <div className="admin-foreign-expanded">
                      {!hasFullBrief ? <div className="admin-foreign-head">
                        <div>
                          <h3>{request.company_name}</h3>
                          <p>{request.company_country || "—"} · pateikta {formatAdminDate(request.created_at)}</p>
                        </div>
                      </div> : null}

                      {!searchCompleted && pendingInterviewCount > 0 ? (
                        <div className="admin-foreign-employer-alert interview">
                          <div>
                            <strong>Darbdavys paprašė interviu</strong>
                            <span>{pendingInterviewCount} {pendingInterviewCount === 1 ? "kandidatui reikia suderinti interviu" : "kandidatams reikia suderinti interviu"}.</span>
                          </div>
                          <button className="admin-small-btn" type="button" onClick={() => openForeignHireInterviewCandidates(request)}>Peržiūrėti kandidatus</button>
                        </div>
                      ) : !searchCompleted && pendingAcceptedCount > 0 ? (
                        <div className="admin-foreign-employer-alert">
                          <div>
                            <strong>Darbdavys patvirtino kandidatą</strong>
                            <span>Galima ruošti galutinį darbo sąlygų patvirtinimą su kandidatu.</span>
                          </div>
                          <button className="admin-small-btn" type="button" onClick={() => openForeignHireAcceptedCandidates(request)}>Peržiūrėti kandidatus</button>
                        </div>
                      ) : null}

                      {hasFullBrief ? <>
                        <div className="admin-hire-details-toggle" style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          padding: "14px 16px",
                          border: "1px solid #d8e1e8",
                          borderRadius: 16,
                          background: searchCompleted ? "#eaf8f0" : "#f7f9fb",
                          borderColor: searchCompleted ? "#a8ddbf" : "#d8e1e8",
                          marginBottom: detailsMinimized ? 0 : 12,
                        }}>
                          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7 }}>
                            <strong style={{ color: "#222631", fontSize: 17, lineHeight: 1.35 }}>
                              {fullNeedTitle} – poreikio duomenys
                            </strong>
                            <span className={`admin-foreign-status ${request.status || "new"}`}>{searchCompleted ? "Paieška uždaryta – susisiekite su darbdaviu" : foreignHireStatusLabel(request.status)}</span>
                          </div>
                          <button
                            className="admin-small-btn"
                            type="button"
                            onClick={() => setForeignHireMinimized((current) => ({ ...current, [request.request_id]: !(current[request.request_id] !== false) }))}
                            style={{ background: "#fff", color: "#222631", borderColor: "#d8e1e8" }}
                          >
                            {detailsMinimized ? "Išskleisti informaciją" : "Suskleisti informaciją"}
                          </button>
                        </div>

                        {!detailsMinimized ? <div className="admin-hire-details-body">
                          <div className="admin-hire-detail-section" style={{
                            border: "1px solid #e2e8ee",
                            borderRadius: 18,
                            background: "#fff",
                            padding: 14,
                            boxShadow: "0 3px 12px rgba(34,38,49,.025)",
                            marginBottom: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "#eae7f4", borderLeft: "4px solid #6b5b95" }}>
                              <h4 style={{ margin: 0, fontSize: 15, color: "#3b3254", fontWeight: 850 }}>Kontaktinė informacija</h4>
                              <span style={{ fontSize: 12, color: "#607180" }}>Įmonė ir atsakingas kontaktas</span>
                            </div>
                            <div className="admin-foreign-grid">
                              <div className="admin-foreign-fact"><span>Kompanija</span><b>{request.brief_company_details?.legalName || request.company_name || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Įmonės šalis</span><b>{request.company_country || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Pildė</span><b>{request.brief_company_details?.contactName || request.contact_name || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Pareigos</span><b>{request.brief_company_details?.jobTitle || request.contact_job_title || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>El. paštas</span><a href={`mailto:${request.brief_company_details?.businessEmail || request.business_email}`}>{request.brief_company_details?.businessEmail || request.business_email || "—"}</a></div>
                              <div className="admin-foreign-fact"><span>Telefonas</span><b>{request.phone || "—"}</b></div>
                            </div>
                          </div>

                          <div className="admin-hire-detail-section" style={{
                            border: "1px solid #e2e8ee",
                            borderRadius: 18,
                            background: "#fff",
                            padding: 14,
                            boxShadow: "0 3px 12px rgba(34,38,49,.025)",
                            marginBottom: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "#eae7f4", borderLeft: "4px solid #6b5b95" }}>
                              <h4 style={{ margin: 0, fontSize: 15, color: "#3b3254", fontWeight: 850 }}>Poreikio ir darbo sąlygos</h4>
                              <span style={{ fontSize: 12, color: "#607180" }}>Pagrindinė suvestinė apie projektą ir sąlygas</span>
                            </div>
                            <div className="admin-foreign-grid">
                              <div className="admin-foreign-fact"><span>Darbo / poreikio pavadinimas</span><b>{fullNeedTitle || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Projektas</span><b>{[fullNeed.projectLocation, fullNeed.projectCountry].filter(Boolean).join(", ") || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Darbo pradžia</span><b>{fullNeed.startDate || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Surinkti iki</span><b>{fullNeed.neededBy || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Įdarbinimo tipas</span><b>{fullNeed.employmentType || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Sutarties trukmė</span><b>{fullNeed.duration || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Darbo valandų per savaitę</span><b>{fullNeed.weeklyHours ? `${fullNeed.weeklyHours} val.` : "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Viršvalandžiai</span><b>{fullNeed.overtimeAllowed === "yes" ? "Taip" : fullNeed.overtimeAllowed === "no" ? "Ne" : (fullNeed.overtime || "—")}</b></div>
                              <div className="admin-foreign-fact"><span>Viršvalandžių apmokėjimas</span><b>{fullNeed.overtimePay || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Atlygis</span><b>{salarySummary}</b></div>
                              <div className="admin-foreign-fact"><span>Mokėjimo dažnumas</span><b>{fullNeed.salaryPayFrequency || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Apgyvendinimas</span><b>{accommodationSummary}</b></div>
                              <div className="admin-foreign-fact"><span>Kambarys</span><b>{fullNeed.roomType || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Būsto kaina</span><b>{fullNeed.accommodationCost || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Kelionės namo</span><b>{homeTravelSummary}</b></div>
                              <div className="admin-foreign-fact"><span>Atostogos</span><b>{fullNeed.vacationTerms || "—"}</b></div>
                              <div className="admin-foreign-fact"><span>Atostogų apmokėjimas</span><b>{fullNeed.vacationPay || "—"}</b></div>
                            </div>
                          </div>

                          {roleList.length ? roleList.map((role, index) => (
                            <div
                              className="admin-hire-detail-section"
                              key={`${request.request_id}-full-role-${index}`}
                              style={{
                                border: "1px solid #e2e8ee",
                                borderRadius: 18,
                                background: "#fff",
                                padding: 14,
                                boxShadow: "0 3px 12px rgba(34,38,49,.025)",
                                marginBottom: 12,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "#eae7f4", borderLeft: "4px solid #6b5b95" }}>
                                <h4 style={{ margin: 0, fontSize: 15, color: "#3b3254", fontWeight: 850 }}>{roleList.length > 1 ? `Profesija ${index + 1}` : "Reikalinga profesija"}</h4>
                                <span style={{ fontSize: 12, color: "#607180" }}>{role.profession || "Profesija nenurodyta"}</span>
                              </div>
                              <div className="admin-foreign-grid">
                                <div className="admin-foreign-fact"><span>Profesija / specialybė</span><b>{role.profession || "—"}</b></div>
                                <div className="admin-foreign-fact"><span>Darbuotojų skaičius</span><b>{Number(role.count || 1)} žm.</b></div>
                                <div className="admin-foreign-fact"><span>Minimali patirtis</span><b>{role.experience || "—"}</b></div>
                                <div className="admin-foreign-fact"><span>Kalba / lygis</span><b>{role.language || "—"}</b></div>
                                <div className="admin-foreign-fact"><span>Vairuotojo pažymėjimas</span><b>{({required:"Privalomas", advantage:"Privalumas", not_required:"Nereikalingas"})[role.drivingLicense] || role.drivingLicense || "—"}</b></div>
                                <div className="admin-foreign-fact"><span>Reikalingi įgūdžiai / darbai</span><b style={{ whiteSpace: "pre-wrap" }}>{role.skills || "—"}</b></div>
                              </div>
                            </div>
                          )) : null}

                          {fullNeed.additionalInfo ? (
                            <div className="admin-hire-additional-section" style={{
                              border: "1px solid #e2e8ee",
                              borderRadius: 18,
                              background: "#fff",
                              padding: 14,
                              boxShadow: "0 3px 12px rgba(34,38,49,.025)",
                              marginBottom: 12,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "#eae7f4", borderLeft: "4px solid #6b5b95" }}>
                                <h4 style={{ margin: 0, fontSize: 15, color: "#3b3254", fontWeight: 850 }}>Papildoma informacija</h4>
                                <span style={{ fontSize: 12, color: "#607180" }}>Papildomi reikalavimai ir pastabos</span>
                              </div>
                              <div className="admin-foreign-grid">
                                <div className="admin-foreign-fact" style={{ gridColumn: "1 / -1" }}><span>Papildomi reikalavimai / informacija</span><b style={{ whiteSpace: "pre-wrap" }}>{fullNeed.additionalInfo}</b></div>
                              </div>
                            </div>
                          ) : null}

                          <div className="admin-hire-detail-section" style={{
                            border: "1px solid #e2e8ee",
                            borderRadius: 18,
                            background: "#fff",
                            padding: 14,
                            boxShadow: "0 3px 12px rgba(34,38,49,.025)",
                            marginBottom: 12,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 11, background: "#eae7f4", borderLeft: "4px solid #6b5b95" }}>
                              <h4 style={{ margin: 0, fontSize: 15, color: "#3b3254", fontWeight: 850 }}>Portalas ir dokumentai</h4>
                              <span style={{ fontSize: 12, color: "#607180" }}>Prisijungimas, sutartys ir prisegti failai</span>
                            </div>
                            <div className="admin-foreign-access-summary" style={{ marginTop: 0 }}>
                              <div><span>Employer login</span><b>{request.employer_login_id || "—"}</b></div>
                              <div><span>Tarpininkavimo sutartis</span>{request.agreementUrl ? <a href={request.agreementUrl} target="_blank" rel="noreferrer">Atidaryti sutartį</a> : <b>Neįkelta</b>}</div>
                              <div><span>Pasirašyta tarpininkavimo sutartis</span>{request.signedAgreementUrl ? <a href={request.signedAgreementUrl} target="_blank" rel="noreferrer">Peržiūrėti pasirašytą sutartį</a> : <b>Dar negauta</b>}</div>
                              <div><span>Darbo sutartis susipažinimui</span>{request.employmentContractUrl ? <a href={request.employmentContractUrl} target="_blank" rel="noreferrer">{request.employment_contract_name || "Atidaryti darbo sutartį"}</a> : <b>Neįkelta</b>}</div>
                            </div>
                          </div>
                        </div> : null}
                      </> : <>
                        <div className="admin-foreign-grid">
                          <div className="admin-foreign-fact"><span>Kompanija</span><b>{request.company_name || "—"}</b></div>
                          <div className="admin-foreign-fact"><span>Pildė</span><b>{request.contact_name || "—"}</b></div><div className="admin-foreign-fact"><span>Pareigos</span><b>{request.contact_job_title || "—"}</b></div>
                          <div className="admin-foreign-fact"><span>El. paštas</span><a href={`mailto:${request.business_email}`}>{request.business_email || "—"}</a></div>
                          <div className="admin-foreign-fact"><span>Telefonas</span><b>{request.phone || "—"}</b></div>
                        </div>
                        {request.employer_account_id ? <div className="admin-foreign-access-summary" style={{marginTop:12}}>
                          <div><span>Employer login</span><b>{request.employer_login_id || "—"}</b></div>
                          <div><span>Tarpininkavimo sutartis</span>{request.agreementUrl ? <a href={request.agreementUrl} target="_blank" rel="noreferrer">{request.agreement_name || "Atidaryti sutartį"}</a> : <b>Dar neįkelta</b>}</div>
                          <div><span>Būsena</span><b>{request.agreement_path ? (request.signed_agreement_path ? "Pasirašyta kopija gauta" : "Laukiama darbdavio parašo") : "Laukiama sutarties"}</b></div>
                        </div> : null}
                      </>}

                      {credentials ? (
                        <div className="admin-foreign-credentials">
                          <strong>Nauji laikini prisijungimo duomenys — nukopijuokite prieš perkraunant puslapį.</strong>
                          <code>{credentialsText}</code>
                          <div className="admin-foreign-actions">
                            <button
                              className="admin-small-btn"
                              type="button"
                              onClick={() => copyForeignHireText(credentialsText, "Prisijungimo duomenys nukopijuoti.")}
                            >
                              Kopijuoti prisijungimus
                            </button>
                            <a className="admin-small-btn" href={mailHref} style={{ textDecoration: "none" }}>
                              Atidaryti el. laišką
                            </a>
                          </div>
                        </div>
                      ) : null}

                      {setupOpen ? (
                        <div className="admin-foreign-setup">
                          <h4>{request.employer_account_id ? "Įkelti tarpininkavimo sutartį" : "Sukurti darbdavio prieigą"}</h4>
                          <p>{request.employer_account_id ? "Įkelta sutartis iš karto atsiras darbdavio portale. Darbdavys galės ją perskaityti, pasirašyti ir įkelti pasirašytą kopiją." : "Sukurkite privatų Company ID ir laikiną slaptažodį. Prisijungimo duomenis nukopijuokite prieš perkraudami puslapį."}</p>
                          <div className="admin-foreign-setup-grid">
                            {!request.employer_account_id ? <>
                              <label className="admin-foreign-field"><span>Company ID</span><input value={foreignHireSetupLogin} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 6); setForeignHireSetupLogin(`ID-${digits}`); }} inputMode="numeric" autoComplete="off" /></label>
                              <label className="admin-foreign-field"><span>Laikinas slaptažodis</span><input value={foreignHireSetupPassword} onChange={(event) => setForeignHireSetupPassword(event.target.value.slice(0, 128))} autoComplete="off" /></label>
                            </> : <label className="admin-foreign-file">
                              <span className="admin-foreign-file-copy"><b>{foreignHireAgreementFile?.name || "Tarpininkavimo sutartis nepasirinkta"}</b><span>PDF arba DOCX · iki 15 MB</span></span>
                              <span className="admin-small-btn">Pasirinkti sutartį</span>
                              <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setForeignHireAgreementFile(event.target.files?.[0] || null)} />
                            </label>}
                          </div>
                          <div className="admin-foreign-setup-actions">
                            {!request.employer_account_id ? <>
                              <button className="admin-small-btn" type="button" disabled={foreignHireSetupBusy} onClick={() => setForeignHireSetupLogin(generateForeignHireLogin(request))}>Sugeneruoti naują ID</button>
                              <button className="admin-small-btn" type="button" disabled={foreignHireSetupBusy} onClick={() => setForeignHireSetupPassword(generateForeignHirePassword())}>Naujas slaptažodis</button>
                            </> : null}
                            <button className="admin-small-btn" type="button" disabled={foreignHireSetupBusy} onClick={() => { setForeignHireSetupRequest(null); setForeignHireAgreementFile(null); }}>Atšaukti</button>
                            <button className="admin-small-btn" type="button" disabled={foreignHireSetupBusy || (request.employer_account_id && !foreignHireAgreementFile)} onClick={request.employer_account_id ? replaceForeignEmployerAgreement : createForeignEmployerAccess} style={{ background: "#222631", color: "#fff", borderColor: "#222631" }}>
                              {foreignHireSetupBusy ? "Saugoma..." : request.employer_account_id ? "Įkelti tarpininkavimo sutartį" : "Sukurti darbdavio prieigą"}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="admin-foreign-actions">
                        {!hasFullBrief && !request.employer_account_id ? <button className="admin-small-btn" type="button" disabled={busy} onClick={() => openForeignHireAccessSetup(request)}>Sukurti darbdavio prieigą</button> : null}
                        {!hasFullBrief && request.employer_account_id && !request.agreement_path ? <button className="admin-small-btn" type="button" disabled={foreignHireSetupBusy} onClick={() => openForeignHireAccessSetup(request)}>Įkelti tarpininkavimo sutartį</button> : null}
                        {hasFullBrief && request.brief_status !== "approved" ? <button className="admin-small-btn" type="button" disabled={busy || !request.signed_agreement_path} title={!request.signed_agreement_path ? "Pirmiausia turi būti įkelta pasirašyta tarpininkavimo sutartis" : undefined} onClick={() => lockForeignHireSubmission(request)} style={{background:request.signed_agreement_path ? "#222631" : "#e8edf1",color:request.signed_agreement_path ? "#fff" : "#81909c",borderColor:request.signed_agreement_path ? "#222631" : "#d8e1e8",cursor:request.signed_agreement_path ? "pointer" : "not-allowed"}}>{busy ? "Pradedama..." : "Pradėti paiešką"}</button> : null}
                        {hasFullBrief && !request.signed_agreement_path && request.brief_status !== "approved" ? <span className="admin-candidate-job-note" style={{margin:0}}>Paieškai pradėti būtina pasirašyta tarpininkavimo sutartis.</span> : null}
                        <a className="admin-small-btn" href={mailHref} style={{textDecoration:"none", ...(searchCompleted ? {background:"#b62e28",color:"#fff",borderColor:"#b62e28",fontWeight:800} : {})}}>Rašyti el. paštu</a>
                        {searchCompleted ? <>
                          <label className="admin-small-btn" style={{cursor:foreignHireInvoiceBusyId ? "wait" : "pointer",display:"inline-flex",alignItems:"center",gap:6}}>
                            {foreignHireInvoiceBusyId === request.request_id ? "Įkeliama..." : foreignHireInvoices[request.request_id] ? "Pakeisti sąskaitą faktūrą" : "+ Įkelti sąskaitą faktūrą"}
                            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={!!foreignHireInvoiceBusyId} style={{display:"none"}} onChange={(event) => { const file=event.target.files?.[0]; if (file) uploadForeignHireInvoice(request,file); event.target.value=""; }} />
                          </label>
                          {foreignHireInvoices[request.request_id] ? <button className="admin-small-btn" type="button" onClick={() => viewForeignHireInvoice(foreignHireInvoices[request.request_id])}>Sąskaita: {foreignHireInvoices[request.request_id].file_name}</button> : null}
                          {foreignHireInvoiceFeedback[request.request_id] ? <span role="status" style={{width:"100%",fontSize:12,fontWeight:700,color:foreignHireInvoiceFeedback[request.request_id].kind === "success" ? "#16734a" : foreignHireInvoiceFeedback[request.request_id].kind === "progress" ? "#526779" : "#b52b28"}}>{foreignHireInvoiceFeedback[request.request_id].message}</span> : null}
                        </> : null}
                        <button className="admin-small-btn danger" type="button" disabled={busy} onClick={() => deleteForeignHireRequest(request)}>Ištrinti visam laikui</button>
                      </div>

                      {(["sourcing", "closed"].includes(request.status) || Number(request.candidate_count || 0) > 0) ? renderForeignHireCandidatePanel(request, requestCandidates) : null}
                      </div> : null}
                    </article>
                  );
                })}
                {renderAdminPagination(foreignHireRequests.length)}
              </div>
            ) : (
              <div className="admin-empty">Tarptautinių užklausų dar nėra.</div>
            )}
          </section>
        )}

        {activeTab === "workers" && (
          <AdminWorkersList
            workers={workers}
            selfId={user?.id}
            isSuspended={isCurrentlySuspended}
            isRestricted={isWorkerModeRestricted}
            onMessage={(worker) => setAdminMessageTarget({ userId: worker.user_id, name: worker.display_name || worker.email || "Darbuotojas", role: "worker" })}
            onEdit={openWorkerEditor}
            onSuspend={(worker) => {
              const isSelf = worker.user_id === user?.id;
              const suspended = isSelf ? isWorkerModeRestricted(worker) : isCurrentlySuspended(worker);
              openAccountAction(isSelf ? (suspended ? "unsuspendWorkerMode" : "suspendWorkerMode") : suspended ? "unsuspend" : "suspend", worker, "worker");
            }}
            onDelete={(worker) => openAccountAction("deleteAccount", worker, "worker")}
          />
        )}

        {activeTab === "employers" && (
          <AdminEmployersList
            employers={employers}
            selfId={user?.id}
            isSuspended={isCurrentlySuspended}
            busyId={verifyingCompanyId}
            onVerify={verifyEmployer}
            onMessage={(employer) => setAdminMessageTarget({ userId: employer.owner_id, name: employer.company_name || employer.email || "Darbdavys", role: "employer" })}
            onEdit={openEmployerEditor}
            onSuspend={(employer) => openAccountAction(isCurrentlySuspended(employer) ? "unsuspend" : "suspend", employer, "employer")}
            onDelete={(employer) => openAccountAction("deleteAccount", employer, "employer")}
          />
        )}

        {activeTab === "monthlyAwards" && (
          <AdminAwardsList awards={monthlyAwardLeaders} metricText={monthlyAwardMetricText} />
        )}

        {activeTab === "jobs" && (
          <AdminJobsList jobs={jobs} formatPay={formatNetPay} onChat={setAdminConversation} onEdit={openJobEditor} onDelete={openJobDelete} />
        )}

        {activeTab === "employment" && (
          <AdminEmploymentList placements={longTermPlacements} />
        )}

        {activeTab === "teamChats" && <AdminPrivateChats />}
        {activeTab === "teamChats" && (
          <AdminTeamChatsList chats={teamChats} onView={setAdminTeamConversation} />
        )}

        {activeTab === "ratings" && (
          <AdminRatingsList ratings={ratings} busyId={deletingRatingId} onDelete={deleteRating} />
        )}

        {activeTab === "files" && (
          <AdminFilesList files={files} />
        )}
        {activeTab === "bugs" && (
          <AdminBugsList
            reports={siteBugReports}
            onReply={(report) => setAdminMessageTarget({ userId: report.reporter_id, name: report.reporter_name || report.reporter_email || "Vartotojas" })}
            onResolve={resolveSiteBug}
            onIrrelevant={markSiteBugIrrelevant}
            onOpen={setSelectedBugReport}
          />
        )}

        {activeTab === "audit" && (
          <AdminAuditList items={auditLog} actionLabel={adminAuditActionLabel} />
        )}

      </main>


      <AdminJobChatModal
        job={adminConversation}
        user={user}
        onClose={() => setAdminConversation(null)}
      />

      <AdminCompanyTeamChatModal
        chat={adminTeamConversation}
        user={user}
        onClose={() => setAdminTeamConversation(null)}
      />

      <DisputeConversationModal
        open={Boolean(adminDisputeConversation)}
        onClose={() => setAdminDisputeConversation(null)}
        attendanceId={adminDisputeConversation?.attendanceId}
        title={adminDisputeConversation?.title}
        workerName={adminDisputeConversation?.workerName}
        companyName={adminDisputeConversation?.companyName}
        user={user}
      />

      <AdminPrivateMessageComposer
        target={adminMessageTarget}
        onClose={() => setAdminMessageTarget(null)}
        onSent={() => setNotice("Privati žinutė išsiųsta.")}
      />

      {editor && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !editorSaving) {
              setEditor(null);
            }
          }}
        >
          <div className="admin-modal">
            <div className="admin-modal-head">
              <div>
                <div className="eyebrow">ADMINISTRATORIAUS REDAGAVIMAS</div>
                <h2>
                  {editor.type === "worker"
                    ? "Darbuotojo informacija"
                    : editor.type === "employer"
                    ? "Darbdavio informacija"
                    : "Darbo pasiūlymas"}
                </h2>
              </div>
              <button
                className="rs-close"
                disabled={editorSaving}
                onClick={() => setEditor(null)}
              >
                <CloseMark />
              </button>
            </div>

            {editor.type === "worker" && (
              <div className="admin-grid-2">
                <label className="admin-label">
                  Rodomas vardas
                  <input
                    className="admin-input"
                    value={editorForm.displayName}
                    onChange={(e) =>
                      updateEditorField("displayName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Teisinis vardas / pavardė
                  <input
                    className="admin-input"
                    value={editorForm.legalName}
                    onChange={(e) =>
                      updateEditorField("legalName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Telefonas
                  <input
                    className="admin-input"
                    value={editorForm.phone}
                    onChange={(e) =>
                      updateEditorField("phone", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  Kelionės spindulys, km
                  <input
                    className="admin-input"
                    type="number"
                    min="5"
                    max="50"
                    value={editorForm.travelRadiusKm}
                    onChange={(e) =>
                      updateEditorField("travelRadiusKm", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Patirtis, metais
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={editorForm.yearsExperience}
                    onChange={(e) =>
                      updateEditorField("yearsExperience", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.hasDrivingLicenseB}
                      onChange={(e) =>
                        updateEditorField(
                          "hasDrivingLicenseB",
                          e.target.checked
                        )
                      }
                    />{" "}
                    B kategorija
                  </span>
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.isActive}
                      onChange={(e) =>
                        updateEditorField("isActive", e.target.checked)
                      }
                    />{" "}
                    Paskyra aktyvi
                  </span>
                </label>
                <label className="admin-label admin-wide">
                  Aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.shortBio}
                    onChange={(e) =>
                      updateEditorField("shortBio", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {editor.type === "employer" && (
              <div className="admin-grid-2">
                <label className="admin-label">
                  Paskyros vardas
                  <input
                    className="admin-input"
                    value={editorForm.displayName}
                    onChange={(e) =>
                      updateEditorField("displayName", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Telefonas
                  <input
                    className="admin-input"
                    value={editorForm.phone}
                    onChange={(e) =>
                      updateEditorField("phone", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Darbdavio pavadinimas / vardas
                  <input
                    className="admin-input"
                    value={editorForm.name}
                    onChange={(e) => updateEditorField("name", e.target.value)}
                  />
                </label>
                <label className="admin-label">
                  Įmonės kodas (jei taikoma)
                  <input
                    className="admin-input"
                    value={editorForm.companyCode}
                    onChange={(e) =>
                      updateEditorField("companyCode", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  PVM kodas
                  <input
                    className="admin-input"
                    value={editorForm.vatCode}
                    onChange={(e) =>
                      updateEditorField("vatCode", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.isVerified}
                      onChange={(e) =>
                        updateEditorField("isVerified", e.target.checked)
                      }
                    />{" "}
                    Darbdavys patvirtintas
                  </span>
                </label>
                <label className="admin-label">
                  <span>
                    <input
                      type="checkbox"
                      checked={editorForm.ownerActive}
                      onChange={(e) =>
                        updateEditorField("ownerActive", e.target.checked)
                      }
                    />{" "}
                    Savininko paskyra aktyvi
                  </span>
                </label>
                <div className="admin-label">
                  Planas
                  <RoundedSelect
                    className="admin-input"
                    ariaLabel="Įmonės planas"
                    value={editorForm.planKey}
                    onChange={(value) => updateEditorField("planKey", value)}
                    options={[{ value: "basic", label: "Basic · 0 €" }, { value: "business", label: "Business · 29 €" }, { value: "business_pro", label: "Business Pro · 59 €" }]}
                  />
                </div>

                <div className="admin-label">
                  Prenumeratos būsena
                  <RoundedSelect
                    className="admin-input"
                    ariaLabel="Prenumeratos būsena"
                    value={editorForm.subscriptionStatus}
                    onChange={(value) => {
                      if (
                        value === "trialing" &&
                        (editor?.trialEligibilityLoading || editor?.trialBlockedByStripe)
                      ) {
                        setError(
                          editor?.trialEligibilityLoading
                            ? "Palaukite, kol bus patikrinta Stripe prenumerata."
                            : "Nemokamo Business išbandymo negalima aktyvuoti įmonei, kuri jau turi aktyvią Stripe prenumeratą."
                        );
                        return;
                      }
                      updateEditorField("subscriptionStatus", value);
                    }}
                    options={[{ value: "active", label: "Aktyvi" }, { value: "trialing", label: "Bandomoji" }, { value: "past_due", label: "Laukiama apmokėjimo" }, { value: "cancelled", label: "Nutraukta" }]}
                  />
                </div>

                <div className="admin-label">
                  Apmokėta iki / laikotarpio pabaiga
                  <RoundedDateSelect
                    className="admin-input wd-date-trigger"
                    ariaLabel="Apmokėta iki / laikotarpio pabaiga"
                    value={editorForm.planPeriodEnd}
                    onChange={(value) => updateEditorField("planPeriodEnd", value)}
                  />
                </div>

                <div className="admin-label admin-wide" style={{ border: "1px solid #ccc4df", background: "#fff8f1", borderRadius: 12, padding: 13 }}>
                  <b>30 dienų Business išbandymas</b>
                  <span style={{ color: "#6c7a88", fontSize: 12, lineHeight: 1.45 }}>
                    {editor?.trialEligibilityLoading
                      ? "Tikrinama, ar įmonė neturi aktyvios Stripe prenumeratos..."
                      : editor?.trialBlockedByStripe
                      ? "Šiai įmonei nemokamas išbandymas nepasiekiamas, nes jau yra aktyvi Stripe prenumerata. Pirmiausia ją valdykite arba nutraukite per Stripe."
                      : `Paruošia Business planą, bandomąją būseną ir pabaigos datą po ${EMPLOYER_TRIAL_DAYS} dienų. Įsigalios paspaudus „Išsaugoti“. `}
                  </span>
                  <button
                    className="admin-small-btn"
                    type="button"
                    disabled={
                      Boolean(editor?.trialEligibilityLoading) ||
                      Boolean(editor?.trialBlockedByStripe)
                    }
                    title={
                      editor?.trialBlockedByStripe
                        ? "Įmonė jau turi aktyvią Stripe prenumeratą"
                        : undefined
                    }
                    onClick={() =>
                      setEditorForm((current) => ({
                        ...current,
                        planKey: "business",
                        subscriptionStatus: "trialing",
                        planPeriodEnd: addPlatformDays(
                          localDateISO(new Date()),
                          EMPLOYER_TRIAL_DAYS
                        ),
                      }))
                    }
                  >
                    {editor?.trialEligibilityLoading
                      ? "Tikrinama..."
                      : editor?.trialBlockedByStripe
                      ? "Išbandymas nepasiekiamas"
                      : "Paruošti 30 d. Business išbandymą"}
                  </button>
                </div>

                <label className="admin-label admin-wide">
                  Įmonės aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.description}
                    onChange={(e) =>
                      updateEditorField("description", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {editor.type === "job" && (
              <div className="admin-grid-2">
                <label className="admin-label admin-wide">
                  Pavadinimas
                  <input
                    className="admin-input"
                    value={editorForm.title}
                    onChange={(e) => updateEditorField("title", e.target.value)}
                  />
                </label>
                <label className="admin-label">
                  Miestas
                  <CityAutocomplete
                    className="admin-input"
                    value={editorForm.city}
                    onChange={(value) => updateEditorField("city", value)}
                  />
                </label>
                <label className="admin-label">
                  Atvykti adresu
                  <input
                    className="admin-input"
                    value={editorForm.addressText}
                    onChange={(e) =>
                      updateEditorField("addressText", e.target.value)
                    }
                  />
                </label>
                <div className="admin-label">
                  Data
                  <RoundedDateSelect
                    className="admin-input wd-date-trigger"
                    ariaLabel="Darbo data"
                    value={editorForm.workDate}
                    onChange={(value) => updateEditorField("workDate", value)}
                  />
                </div>
                <label className="admin-label">
                  Žmonių skaičius
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="100"
                    value={editorForm.workersNeeded}
                    onChange={(e) =>
                      updateEditorField("workersNeeded", e.target.value)
                    }
                  />
                </label>
                <label className="admin-label">
                  Pradžia
                  <RoundedTimeSelect
                    ariaLabel="Darbo pradžios laikas"
                    className="admin-input wd-time-trigger"
                    value={editorForm.startTime}
                    onChange={(value) => updateEditorField("startTime", value)}
                  />
                </label>
                <label className="admin-label">
                  Pabaiga
                  <RoundedTimeSelect
                    ariaLabel="Darbo pabaigos laikas"
                    className="admin-input wd-time-trigger"
                    value={editorForm.endTime}
                    onChange={(value) => updateEditorField("endTime", value)}
                    align="right"
                  />
                </label>
                <label className="admin-label">
                  Pietų pradžia
                  <RoundedTimeSelect
                    ariaLabel="Pietų pertraukos pradžia"
                    className="admin-input wd-time-trigger"
                    value={editorForm.breakStartTime}
                    placeholder="Nėra"
                    onChange={(value) => updateEditorField("breakStartTime", value)}
                  />
                </label>
                <label className="admin-label">
                  Pietų pabaiga
                  <RoundedTimeSelect
                    ariaLabel="Pietų pertraukos pabaiga"
                    className="admin-input wd-time-trigger"
                    value={editorForm.breakEndTime}
                    placeholder="Nėra"
                    onChange={(value) => updateEditorField("breakEndTime", value)}
                    align="right"
                  />
                </label>
                <label className="admin-label">
                  Atlygis
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editorForm.payAmount}
                    onChange={(e) =>
                      updateEditorField("payAmount", e.target.value)
                    }
                  />
                </label>
                <div className="admin-label">
                  Atlygio vienetas
                  <RoundedSelect
                    className="admin-input"
                    ariaLabel="Atlygio vienetas"
                    value={editorForm.payUnit}
                    onChange={(value) => updateEditorField("payUnit", value)}
                    options={[{ value: "hour", label: "Už valandą" }, { value: "day", label: "Už dieną" }]}
                  />
                </div>
                <div className="admin-label admin-wide">
                  Atvykimas
                  <RoundedSelect
                    className="admin-input"
                    ariaLabel="Atvykimas"
                    value={editorForm.transportMode}
                    onChange={(value) => updateEditorField("transportMode", value)}
                    options={[{ value: "self_arrival", label: "Darbuotojas atvyksta pats" }, { value: "employer_pickup", label: "Darbdavys paima darbuotoją" }]}
                  />
                </div>
                <label className="admin-label admin-wide">
                  Aprašymas
                  <textarea
                    className="admin-input admin-textarea"
                    value={editorForm.description}
                    onChange={(e) =>
                      updateEditorField("description", e.target.value)
                    }
                  />
                </label>
              </div>
            )}

            <div className="admin-actions">
              {editor.type === "job" && (
                <button
                  className="admin-small-btn danger"
                  disabled={editorSaving}
                  onClick={() =>
                    openJobDelete({
                      job_id: editor.id,
                      title: editorForm.title || "Darbas",
                      company_id: null,
                    })
                  }
                  style={{ marginRight: "auto" }}
                >
                  Ištrinti darbą
                </button>
              )}

              <button
                className="admin-small-btn"
                disabled={editorSaving}
                onClick={() => setEditor(null)}
              >
                Atšaukti
              </button>
              <button
                className="admin-small-btn"
                style={{
                  background: "#6b5b95",
                  color: "#fff",
                  borderColor: "#6b5b95",
                }}
                disabled={editorSaving}
                onClick={saveEditor}
              >
                {editorSaving ? "Saugoma..." : "Išsaugoti"}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionDialog && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionBusy) {
              setActionDialog(null);
            }
          }}
        >
          <div className="admin-modal" style={{ width: "min(600px,100%)" }}>
            <div className="admin-modal-head">
              <div>
                <div className="eyebrow">
                  {actionDialog.type === "suspendWorkerMode"
                    ? "DARBUOTOJO REŽIMO SUSPENDAVIMAS"
                    : actionDialog.type === "unsuspendWorkerMode"
                    ? "DARBUOTOJO REŽIMO SUSPENDAVIMO PANAIKINIMAS"
                    : actionDialog.type === "suspend"
                    ? "PASKYROS SUSPENDAVIMAS"
                    : actionDialog.type === "unsuspend"
                    ? "SUSPENDAVIMO PANAIKINIMAS"
                    : actionDialog.type === "deleteJob"
                    ? "DARBO TRYNIMAS"
                    : "PASKYROS TRYNIMAS"}
                </div>
                <h2>
                  {actionDialog.type === "suspendWorkerMode"
                    ? `Suspenduoti darbuotojo režimą: ${actionDialog.name}`
                    : actionDialog.type === "unsuspendWorkerMode"
                    ? `Nuimti darbuotojo režimo suspendavimą: ${actionDialog.name}`
                    : actionDialog.type === "suspend"
                    ? `Suspenduoti: ${actionDialog.name}`
                    : actionDialog.type === "unsuspend"
                    ? `Nuimti suspendavimą: ${actionDialog.name}`
                    : actionDialog.type === "deleteJob"
                    ? `Ištrinti darbą: ${actionDialog.name}`
                    : `Visiškai ištrinti: ${actionDialog.name}`}
                </h2>
              </div>

              <button
                className="rs-close"
                aria-label="Uždaryti administratoriaus veiksmą"
                disabled={actionBusy}
                onClick={() => setActionDialog(null)}
              >
                <CloseMark />
              </button>
            </div>

            {actionError && (
              <div className="admin-toast err" role="alert" style={{ marginBottom: 14 }}>{actionError}</div>
            )}

            {(actionDialog.type === "suspend" ||
              actionDialog.type === "suspendWorkerMode") && (
              <label className="admin-label">
                Kiek dienų suspenduoti?
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  max="3650"
                  value={actionDays}
                  onChange={(e) => setActionDays(e.target.value)}
                />
              </label>
            )}

            <label className="admin-label" style={{ marginTop: 13 }}>
              {actionDialog.type === "unsuspend" ||
              actionDialog.type === "unsuspendWorkerMode"
                ? "Pastaba"
                : "Priežastis *"}
              <textarea
                className="admin-input admin-textarea"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionDialog.type === "suspend" ||
                  actionDialog.type === "suspendWorkerMode"
                    ? "Pvz. Pakartotinis neatvykimas ir taisyklių pažeidimas..."
                    : actionDialog.type === "deleteAccount"
                    ? "Pvz. Pakartotiniai rimti pažeidimai..."
                    : actionDialog.type === "deleteJob"
                    ? "Kodėl šis darbo pasiūlymas šalinamas?"
                    : "Administratoriaus pastaba..."
                }
              />
            </label>

            {(actionDialog.type === "deleteAccount" ||
              actionDialog.type === "deleteJob") && (
              <div
                className="admin-note"
                style={{ background: "#fff0ec", color: "#9f4529" }}
              >
                <b>Negrįžtamas veiksmas.</b>{" "}
                {actionDialog.type === "deleteAccount"
                  ? "Bus pašalinta paskyra ir su ja susiję sistemos duomenys."
                  : "Bus pašalintas darbas ir su juo susiję kvietimai, rezervacijos bei darbo dienų įrašai."}

                <label className="admin-label" style={{ marginTop: 12 }}>
                  Patvirtinimui įrašykite ISTRINTI
                  <input
                    className="admin-input"
                    value={actionConfirm}
                    onChange={(e) => setActionConfirm(e.target.value)}
                    placeholder="ISTRINTI"
                  />
                </label>
              </div>
            )}

            <div className="admin-actions">
              <button
                className="admin-small-btn"
                disabled={actionBusy}
                onClick={() => setActionDialog(null)}
              >
                Atšaukti
              </button>

              <button
                className={`admin-small-btn ${
                  actionDialog.type === "deleteAccount" ||
                  actionDialog.type === "deleteJob"
                    ? "danger"
                    : ""
                }`}
                disabled={actionBusy}
                onClick={performAdminAction}
                style={
                  actionDialog.type === "deleteAccount" ||
                  actionDialog.type === "deleteJob"
                    ? undefined
                    : {
                        background: "#222631",
                        color: "#fff",
                        borderColor: "#222631",
                      }
                }
              >
                {actionBusy
                  ? "Vykdoma..."
                  : actionDialog.type === "suspendWorkerMode"
                  ? "Suspenduoti darbuotojo režimą"
                  : actionDialog.type === "unsuspendWorkerMode"
                  ? "Nuimti darbuotojo režimo suspendavimą"
                  : actionDialog.type === "suspend"
                  ? "Suspenduoti"
                  : actionDialog.type === "unsuspend"
                  ? "Nuimti suspendavimą"
                  : actionDialog.type === "deleteJob"
                  ? "Ištrinti darbą"
                  : "Ištrinti paskyrą"}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedBugReport && (
        <div
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            !resolvingBugId &&
            setSelectedBugReport(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(34,38,49,.62)",
          }}
        >
          <div
            style={{
              width: "min(640px,100%)",
              maxHeight: "calc(100dvh - 40px)",
              overflow: "auto",
              background: "#fff",
              borderRadius: 18,
              padding: 22,
              boxShadow: "0 28px 90px rgba(34,38,49,.28)",
              color: "#222631",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 14,
              }}
            >
              <div>
                <div className="eyebrow">SVETAINĖS KLAIDA</div>
                <h2>{selectedBugReport.reporter_name || "Vartotojas"}</h2>
              </div>
              <button
                type="button"
                disabled={Boolean(resolvingBugId)}
                onClick={() => setSelectedBugReport(null)}
                style={{
                  border: 0,
                  background: "#f2f5f7",
                  color: "#222631",
                  borderRadius: 11,
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <CloseMark />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div style={{ color: "#6c7a88", fontSize: 12 }}>
                {selectedBugReport.reporter_email || "El. paštas nepasiekiamas"} ·{" "}
                {formatAdminDate(selectedBugReport.created_at)}
              </div>
              <span
                className={`admin-pill ${
                  selectedBugReport.status === "resolved"
                    ? "green"
                    : selectedBugReport.status === "irrelevant"
                    ? "gray"
                    : "red"
                }`}
              >
                {selectedBugReport.status === "resolved"
                  ? "Sutvarkyta"
                  : selectedBugReport.status === "irrelevant"
                  ? "Neaktualu"
                  : "Aktyvi"}
              </span>
            </div>

            <div
              style={{
                border: "1px solid #dfe7ed",
                borderRadius: 14,
                padding: 16,
                background: "#fff",
                color: "#222631",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedBugReport.message}
            </div>

            {selectedBugReport.status === "resolved" ? (
              <div className="admin-bug-resolved-note">
                Sutvarkyta {formatAdminDate(selectedBugReport.resolved_at)}.{" "}
                {Number(selectedBugReport.reward_points || 0) > 0
                  ? `Vartotojui skirta +${Number(
                      selectedBugReport.reward_points
                    )} patikimumo taškas.`
                  : "Papildomas patikimumo taškas nepridėtas, nes balas jau buvo 100 / 100 arba atlygis šiai paskyrai netaikomas."}
              </div>
            ) : selectedBugReport.status === "irrelevant" ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "11px 12px",
                  border: "1px solid #dfe6eb",
                  borderRadius: 11,
                  background: "#f7f9fa",
                  color: "#667788",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.45,
                }}
              >
                Pažymėta neaktualia {formatAdminDate(selectedBugReport.resolved_at)}.
                Vartotojui patikimumo taškai neskirti.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 9,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="admin-small-btn"
                  type="button"
                  onClick={() => setSelectedBugReport(null)}
                  disabled={Boolean(resolvingBugId)}
                >
                  Uždaryti
                </button>
                <button
                  className="admin-small-btn danger"
                  type="button"
                  disabled={resolvingBugId === selectedBugReport.id}
                  onClick={() => markSiteBugIrrelevant(selectedBugReport)}
                >
                  {resolvingBugId === selectedBugReport.id
                    ? "Žymima..."
                    : "Neaktualu"}
                </button>
                <button
                  type="button"
                  disabled={resolvingBugId === selectedBugReport.id}
                  onClick={() => resolveSiteBug(selectedBugReport)}
                  style={{
                    border: "1px solid #9bd2ba",
                    background: "#167a54",
                    color: "#fff",
                    borderRadius: 9,
                    padding: "9px 13px",
                    font: "inherit",
                    fontSize: 12,
                    fontWeight: 850,
                    cursor:
                      resolvingBugId === selectedBugReport.id
                        ? "wait"
                        : "pointer",
                    opacity:
                      resolvingBugId === selectedBugReport.id ? 0.65 : 1,
                  }}
                >
                  {resolvingBugId === selectedBugReport.id
                    ? "Žymima..."
                    : "Sutvarkiau"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      <DeleteAccountModal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        accountKind="administratoriaus paskyra"
      />
      <StyledConfirmDialog dialog={confirmDialog} onResolve={resolveConfirm} />
    </div>
    </P24Shell>
  );
}
