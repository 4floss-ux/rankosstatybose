import { useEffect, useRef, useState } from "react";
import { JOB_SCOPE_ACK_VERSION, supabase } from "../lib/config.js";
import { BrandLogo, CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ArrivalTimeDialog, ReviewConductNotice, RoundedDateSelect, RoundedSelect, RoundedTimeSelect, StyledConfirmDialog, normalizeLithuanianMobilePhone, useStyledConfirm } from "../ui/common.jsx";
import { AddressAutocomplete, CityAutocomplete, canonicalCityName } from "../ui/location.jsx";
import { PhoneAvailabilityHint, PhoneVerificationFields, usePhoneVerification } from "../auth/phoneVerification.jsx";
import { attendanceOutcomeLabel, currentVilniusTimeRounded5, formatJobTitle, formatNetPay, formatWorkedMinutes, jobCheckInWindowOpen, jobHasEnded, jobHasStarted, jobStartMoment, localDateISO, notificationPresentation, workerDistanceLabel } from "../lib/jobs.js";
import { ConversationModal, DisputeConversationModal, GroupConversationModal } from "../chat/conversations.jsx";
import { LongTermConversationModal, defaultLongTermSchedule, longTermContractLabel, longTermEmployerUpdateLabel, longTermEmployerUpdateTone, longTermWeekdayLabel, openEmploymentContract, safeStorageFileName } from "../longterm/longTerm.jsx";
import { CompanyTeamChatModal } from "../chat/CompanyTeamChatModal.jsx";
import { WorkerProfileModal } from "../worker/WorkerProfileModal.jsx";
import { AccountBugReportZone, AccountDeleteZone, BugReportModal, BugResolutionNotice, DASHBOARD_PAGE_SIZE, DashboardPagination, DeleteAccountModal, MainSiteInPageAlerts, RELIABILITY_MODAL_STYLES, WebPushSettings, loadAllCompanyJobs } from "../dashboard/shared.jsx";
import { EMPLOYER_PLANS, companyTeamInviteLink, companyTeamRoleLabel, edgeFunctionErrorMessage, employerPlanAnnualMonthlyEquivalent, employerPlanAnnualPrice, employerPlanAnnualSavings, employerPlanName, employerReliabilityPenaltyMeta, employerSubscriptionStatusLabel, employerTomorrowISO, formatPlanPrice, formatReliabilityChange, formatReliabilityPenaltyDate, formatReliabilityScore, isComplimentaryBusinessTrial, reliabilityScoreColor, shortWorkerName, workerRecentActivityLabel } from "./plans.js";
import { MonthlyAwardMiniList, MonthlyAwardsPanel, monthlyAwardPreviousMonthISO } from "../awards/monthlyAwards.jsx";
import { companyAvatarUrl, workerAvatarUrl, workerInitials } from "../ui/avatars.jsx";
import { EmployerWorkCalendar } from "./EmployerWorkCalendar.jsx";
import { AdminPrivateInboxButton } from "../admin/adminParts.jsx";
import { P24Shell } from "../p24/Shell.jsx";
import { EmployerJobCard, EmployerOverview } from "../p24/employer/EmployerOverview.jsx";
import { Empty, ListGroup, PageHead, Paged, Pill } from "../p24/ui.jsx";

export function EmployerDashboard({ user, onLogout, onAdminReturn = null }) {
  const { dialog: confirmDialog, askConfirm, resolveConfirm } = useStyledConfirm();
  // User metadata stores only the visitor's plan preference; DB entitlements remain authoritative.
  const preferredPlanKey = EMPLOYER_PLANS.some(
    (plan) => plan.key === user?.user_metadata?.preferred_plan
  ) ? user.user_metadata.preferred_plan : "basic";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [company, setCompany] = useState(null);
  const [companyMonthlyAwards, setCompanyMonthlyAwards] = useState([]);
  const [workerAwardsById, setWorkerAwardsById] = useState({});
  const [companyMemberRole, setCompanyMemberRole] = useState(null);
  const [showCompanyEditor, setShowCompanyEditor] = useState(false);
  const [employerView, setEmployerView] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem("s24-employer-view");
      return ["overview", "active", "ended"].includes(saved) ? saved : "overview";
    } catch {
      return "overview";
    }
  });
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugReportNotice, setBugReportNotice] = useState("");
  const companyEditorRef = useRef(null);

  useEffect(() => {
    if (!showCompanyEditor) return;

    const timer = window.setTimeout(() => {
      const node = companyEditorRef.current;
      if (!node) return;

      const top =
        node.getBoundingClientRect().top + window.scrollY - 88;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [showCompanyEditor]);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyAvatarFile, setCompanyAvatarFile] = useState(null);
  const [companyAvatarPreview, setCompanyAvatarPreview] = useState("");
  const [companyAvatarMarkedForRemoval, setCompanyAvatarMarkedForRemoval] = useState(false);
  const [planSummary, setPlanSummary] = useState(null);
  const employerCalendarMemory = useRef(null);
  const [calendarRequested, setCalendarRequested] = useState(() => new URLSearchParams(window.location.search).get("employerView") === "calendar");
  // Temporary calendar rollout: existing admin preview plus the explicitly authorized tester.
  // This controls feature visibility only; existing plan, company and database permissions still apply.
  const calendarTesterEmail = String(user?.email || "").trim().toLowerCase();
  const calendarPreviewEnabled = typeof onAdminReturn === "function" || calendarTesterEmail === "tattoo.staponas@gmail.com";
  const calendarAllowed = calendarPreviewEnabled && planSummary?.plan_key === "business_pro";
  const calendarVisible = calendarRequested && calendarAllowed;
  useEffect(() => {
    const sync = () => setCalendarRequested(new URLSearchParams(window.location.search).get("employerView") === "calendar");
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  function navigateEmployerCalendar(open) {
    if (open && !calendarPreviewEnabled) return;
    if (open && !calendarAllowed) { setShowPlans(true); return; }
    const url = new URL(window.location.href);
    if (open) url.searchParams.set("employerView", "calendar");
    else url.searchParams.delete("employerView");
    const marker = { ...(window.history.state || {}), employerCalendarTransition: true };
    window.history.replaceState(marker, "", window.location.href);
    window.history.pushState(marker, "", url.pathname + url.search + url.hash);
    setCalendarRequested(open);
    window.scrollTo({top:0, behavior:"auto"});
  }

  const [billingStatus, setBillingStatus] = useState(null);
  const [pendingPlanChange, setPendingPlanChange] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [planActionBusy, setPlanActionBusy] = useState(false);
  const planActionInFlightRef = useRef(false);
  const billingReturnHandledRef = useRef(false);
  const [planBillingCycle, setPlanBillingCycle] = useState(
    preferredPlanKey !== "basic" && user?.user_metadata?.preferred_billing_interval === "yearly"
      ? "yearly"
      : "monthly"
  );
  const [showUrgentSearch, setShowUrgentSearch] = useState(false);
  const [urgentSearchCity, setUrgentSearchCity] = useState("");
  const [urgentSearchResults, setUrgentSearchResults] = useState([]);
  const [urgentSearchPage, setUrgentSearchPage] = useState(1);
  const [urgentSearchLoading, setUrgentSearchLoading] = useState(false);
  const [urgentSearchCompleted, setUrgentSearchCompleted] = useState(false);
  const [urgentSearchError, setUrgentSearchError] = useState("");
  const [urgentPhoneCopied, setUrgentPhoneCopied] = useState("");
  const [showSavedWorkers, setShowSavedWorkers] = useState(false);
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [savedWorkersLoading, setSavedWorkersLoading] = useState(false);
  const [savedWorkerBusy, setSavedWorkerBusy] = useState("");
  const [workerSource, setWorkerSource] = useState("available");
  const [invitingSavedTeam, setInvitingSavedTeam] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [teamChatUnread, setTeamChatUnread] = useState(0);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamInvites, setTeamInvites] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamActionBusy, setTeamActionBusy] = useState(false);
  const [lastTeamInviteLink, setLastTeamInviteLink] = useState("");
  const [jobScope, setJobScope] = useState("mine");
  const [employerActivePage, setEmployerActivePage] = useState(1);
  const [employerHistoryPage, setEmployerHistoryPage] = useState(1);
  const [isEmployerPhoneLayout, setIsEmployerPhoneLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 620;
  });
  const [employerActiveMobileIndex, setEmployerActiveMobileIndex] = useState(0);
  const [employerHistoryMobileIndex, setEmployerHistoryMobileIndex] = useState(0);
  const [acceptedWorkersPage, setAcceptedWorkersPage] = useState(1);
  const [declinedWorkersPage, setDeclinedWorkersPage] = useState(1);
  const [showEmployerStats, setShowEmployerStats] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      return window.localStorage.getItem(`employer-stats-open:${user?.id || "guest"}`) === "1";
    } catch {
      return false;
    }
  });
  const employerStatsStorageUserRef = useRef(null);
  useEffect(() => {
    if (!user?.id || employerStatsStorageUserRef.current === user.id) return;
    employerStatsStorageUserRef.current = user.id;
    try {
      setShowEmployerStats(
        window.localStorage.getItem(`employer-stats-open:${user.id}`) === "1"
      );
    } catch {}
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id || employerStatsStorageUserRef.current !== user.id) return;
    try {
      window.localStorage.setItem(
        `employer-stats-open:${user.id}`,
        showEmployerStats ? "1" : "0"
      );
    } catch {}
  }, [user?.id, showEmployerStats]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncEmployerPhoneLayout = () =>
      setIsEmployerPhoneLayout(window.innerWidth <= 620);
    syncEmployerPhoneLayout();
    window.addEventListener("resize", syncEmployerPhoneLayout);
    return () => window.removeEventListener("resize", syncEmployerPhoneLayout);
  }, []);

  const [teamInviteForm, setTeamInviteForm] = useState({
    displayName: "",
    email: "",
    memberRole: "recruiter",
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    companyCode: "",
    city: "",
    phone: "",
    description: "",
    avatarPath: "",
  });
  const companyPhoneVerification = usePhoneVerification({
    active: true, purpose: "change", phone: companyForm.phone, email: user.email, userId: user.id,
  });
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [employerStats, setEmployerStats] = useState({
    totalJobs: 0,
    filledJobs: 0,
    missingWorkers: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    monthlyWorkersUsed: 0,
    activeLongTermEmployees: 0,
    reliabilityRate: 100,
    cancelledConfirmedCount: 0,
    falseAttendanceClaimCount: 0,
    reliabilityGoodJobsSincePenalty: 0,
    reliabilityLastPenaltyAt: null,
  });
  const [employerPenaltyByJob, setEmployerPenaltyByJob] = useState({});
  const [employerPenaltyHistory, setEmployerPenaltyHistory] = useState([]);
  const [companyWorkerReviews, setCompanyWorkerReviews] = useState([]);
  const [showReliabilityInfo, setShowReliabilityInfo] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [currentJobDescriptionExpanded, setCurrentJobDescriptionExpanded] = useState(false);
  useEffect(() => {
    setCurrentJobDescriptionExpanded(false);
  }, [currentJob?.id]);
  const jobOpenRequestRef = useRef(0);
  const jobWorkersRequestRef = useRef(0);
  const jobMatchesRequestRef = useRef(0);
  const [jobInfoTarget, setJobInfoTarget] = useState(null);
  const [jobInfoWorkers, setJobInfoWorkers] = useState([]);
  const [jobInfoWorkersLoading, setJobInfoWorkersLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);
  const [invitationStatuses, setInvitationStatuses] = useState({});
  const [invitationByWorker, setInvitationByWorker] = useState({});
  const [employerNotifications, setEmployerNotifications] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [jobWorkers, setJobWorkers] = useState([]);
  const [jobWorkersLoading, setJobWorkersLoading] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState(null);
  const [attendanceMode, setAttendanceMode] = useState(null);
  const [employerCheckInTarget, setEmployerCheckInTarget] = useState(null);
  const [employerCheckInTime, setEmployerCheckInTime] = useState("");
  const [attendanceEndTime, setAttendanceEndTime] = useState("");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceScore, setAttendanceScore] = useState(null);
  const [attendanceRatingComment, setAttendanceRatingComment] = useState("");
  useEffect(() => {
    setAttendanceScore(null);
    setAttendanceRatingComment("");
  }, [attendanceTarget?.bookingId]);
  useEffect(() => {
    setAttendanceError("");
  }, [attendanceTarget?.bookingId, attendanceMode]);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingScore, setRatingScore] = useState(null);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [conversation, setConversation] = useState(null);
  const [groupConversation, setGroupConversation] = useState(null);
  const [disputeConversation, setDisputeConversation] = useState(null);
  const [showLongTermEmployment, setShowLongTermEmployment] = useState(false);
  const [longTermModalMode, setLongTermModalMode] = useState("hire");
  const [longTermCandidates, setLongTermCandidates] = useState([]);
  const [companyLongTermOffers, setCompanyLongTermOffers] = useState([]);
  const [longTermUnreadByOffer, setLongTermUnreadByOffer] = useState({});
  const [longTermSelectedWorker, setLongTermSelectedWorker] = useState(null);
  const [longTermCommitmentSummary, setLongTermCommitmentSummary] = useState(null);
  const [longTermCommitmentLoading, setLongTermCommitmentLoading] = useState(false);
  const [longTermConversation, setLongTermConversation] = useState(null);
  const [longTermBusy, setLongTermBusy] = useState(false);
  const [longTermContractFile, setLongTermContractFile] = useState(null);
  const [longTermOfferForm, setLongTermOfferForm] = useState({
    positionTitle: "",
    contractType: "indefinite",
    proposedStartDate: employerTomorrowISO(),
    proposedEndDate: "",
    workplaceCity: "",
    workplaceAddress: "",
    salaryAmount: "",
    salaryPeriod: "monthly",
    salaryBasis: "net",
    salaryNote: "",
    employmentDetails: "",
    scheduleType: "fixed",
  });
  const [longTermSchedule, setLongTermSchedule] = useState(() =>
    defaultLongTermSchedule()
  );
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingConfirmedCount, setEditingConfirmedCount] = useState(0);
  const [editingInvitationCount, setEditingInvitationCount] = useState(0);
  const editingCoreTermsLocked = Boolean(editingJobId) &&
    (editingInvitationCount > 0 || editingConfirmedCount > 0);
  const [showJobForm, setShowJobForm] = useState(false);
  const [cityWorkerSignal, setCityWorkerSignal] = useState(null);
  const [cityWorkerSignalLoading, setCityWorkerSignalLoading] = useState(false);
  const [cancelJobTarget, setCancelJobTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingJob, setCancellingJob] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [jobScopeAcknowledged, setJobScopeAcknowledged] = useState(false);
  const jobScopeAckRef = useRef(null);
  const addressInputRef = useRef(null);
  const [selectedJobAddress, setSelectedJobAddress] = useState(null);
  const breakStartInputRef = useRef(null);
  const breakEndInputRef = useRef(null);
  const payAmountInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "Statybų pagalbiniai",
    city: "Vilnius",
    address: "",
    workDate: employerTomorrowISO(),
    startTime: "08:00",
    endTime: "17:00",
    breakStartTime: "12:00",
    breakEndTime: "12:30",
    workersNeeded: 1,
    transportMode: "self_arrival",
    payAmount: "",
    payUnit: "hour",
    description: "",
    responsibleUserId: user.id,
  });

  useEffect(() => {
    loadEmployerDashboard();
  }, [user.id]);

  useEffect(() => {
    const cleanCity = String(form.city || "").trim();
    const cleanAddress = String(form.address || "").trim();

    const selectedAddressMatches =
      selectedJobAddress?.label === cleanAddress &&
      Number.isFinite(Number(selectedJobAddress?.latitude)) &&
      Number.isFinite(Number(selectedJobAddress?.longitude));

    const currentAddressMatches =
      Boolean(editingJobId) &&
      currentJob?.id === editingJobId &&
      cleanCity === String(currentJob?.city || "").trim() &&
      cleanAddress === String(currentJob?.address_text || "").trim() &&
      Number.isFinite(Number(currentJob?.location_latitude)) &&
      Number.isFinite(Number(currentJob?.location_longitude));

    const previewLatitude = selectedAddressMatches
      ? Number(selectedJobAddress.latitude)
      : currentAddressMatches
      ? Number(currentJob.location_latitude)
      : null;
    const previewLongitude = selectedAddressMatches
      ? Number(selectedJobAddress.longitude)
      : currentAddressMatches
      ? Number(currentJob.location_longitude)
      : null;

    if (
      !showJobForm ||
      !company?.id ||
      !cleanCity ||
      !form.workDate ||
      !form.startTime ||
      !form.endTime ||
      !Number.isFinite(previewLatitude) ||
      !Number.isFinite(previewLongitude)
    ) {
      setCityWorkerSignal(null);
      setCityWorkerSignalLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCityWorkerSignalLoading(true);

      const result = await supabase.rpc("get_employer_job_worker_signal_v3", {
        p_company_id: company.id,
        p_city: cleanCity,
        p_work_date: form.workDate,
        p_start_time: form.startTime || null,
        p_end_time: form.endTime || null,
        p_location_latitude: previewLatitude,
        p_location_longitude: previewLongitude,
      });

      if (cancelled) return;

      if (result.error) {
        console.error(result.error);
        setCityWorkerSignal(null);
      } else {
        const row = result.data?.[0] || null;
        setCityWorkerSignal(
          row
            ? {
                availableWorkers: Number(row.available_workers || 0),
                urgentWorkersNow:
                  row.urgent_workers_now === null ||
                  row.urgent_workers_now === undefined
                    ? null
                    : Number(row.urgent_workers_now || 0),
              }
            : null
        );
      }

      setCityWorkerSignalLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    showJobForm,
    company?.id,
    form.city,
    form.address,
    form.workDate,
    form.startTime,
    form.endTime,
    editingJobId,
    currentJob?.id,
    currentJob?.city,
    currentJob?.address_text,
    currentJob?.location_latitude,
    currentJob?.location_longitude,
    selectedJobAddress?.label,
    selectedJobAddress?.latitude,
    selectedJobAddress?.longitude,
    planSummary?.plan_key,
  ]);

  useEffect(() => {
    if (!currentJob?.id) return;

    const hasUnreadJobNews = unreadEmployerNotifications(currentJob.id).some(
      (item) => item.event_type !== "message"
    );
    if (!hasUnreadJobNews) return;

    const timer = window.setTimeout(() => {
      markEmployerJobRead(currentJob.id);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [currentJob?.id, employerNotifications]);

  useEffect(() => {
    if (!company?.id || billingReturnHandledRef.current) return;

    const url = new URL(window.location.href);
    const billingResult = url.searchParams.get("billing");
    if (!billingResult) return;

    billingReturnHandledRef.current = true;

    const clearBillingParam = () => {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("billing");
      window.history.replaceState(
        {},
        "",
        `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
      );
    };

    if (billingResult === "cancelled") {
      setNotice("Apmokėjimas atšauktas. Jūsų planas nepakeistas.");
      clearBillingParam();
      return;
    }

    if (billingResult !== "success") {
      clearBillingParam();
      return;
    }

    let stopped = false;
    let attempts = 0;
    let retryTimer;

    setShowPlans(false);
    setError("");
    setNotice(
      "Laukiame Stripe mokėjimo patvirtinimo ir aktyvuojame planą..."
    );

    const refreshPaidPlan = async () => {
      if (stopped) return;
      attempts += 1;

      try {
        const summary = await loadCompanyPlan(company.id);

        const freshBilling = await loadCompanyBillingStatus(company.id);
        if (stopped) return;
        if (
          freshBilling?.has_stripe_subscription &&
          summary?.plan_key !== "basic" &&
          ["active", "trialing"].includes(summary?.subscription_status)
        ) {
          setPlanBillingCycle(
            freshBilling?.billing_interval === "yearly" ? "yearly" : "monthly"
          );
          setNotice(
            `${summary.plan_name} planas aktyvuotas. Mokamo plano teisės jau galioja.`
          );
          clearBillingParam();
          return;
        }
      } catch {
        // Webhook gali būti dar neapdorotas — bandome dar kartą.
      }

      if (!stopped && attempts < 10) {
        retryTimer = window.setTimeout(refreshPaidPlan, 1500);
      } else if (!stopped) {
        setNotice(
          "Stripe mokėjimo patvirtinimo dar negavome. Planas bus aktyvuotas gavus patvirtinimą. Jei būsena nesikeičia, kreipkitės į administratorių."
        );
        clearBillingParam();
      }
    };

    refreshPaidPlan();

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
    };
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;

    const timer = setInterval(async () => {
      try {
        await reloadJobs(company.id);
        await Promise.all([
          loadEmployerNotifications(),
          loadEmployerStats(company.id, companyMemberRole),
          loadCompanyWorkerReviews(company.id),
          loadCompanyPlan(company.id),
          loadCompanyBillingStatus(company.id),
          loadPendingPlanChange(company.id),
          planSummary?.can_saved_workers
            ? loadSavedWorkers(company.id, planSummary)
            : Promise.resolve(),
          loadCompanyTeamChatUnread(company.id, planSummary),
          companyMemberRole === "owner"
            ? loadCompanyLongTermUnreadCounts(company.id, companyMemberRole)
            : Promise.resolve(),
        ]);

        if (showLongTermEmployment && companyMemberRole === "owner") {
          await loadCompanyLongTermData(company.id, companyMemberRole);
        }

        if (currentJob?.id) {
          await loadCurrentJobWorkers(currentJob.id);

          const [jobResult, bookingResult, invitationsResult] = await Promise.all([
            supabase
              .from("jobs")
              .select(
                "id, title, city, address_text, location_latitude, location_longitude, location_geocoded_at, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
              )
              .eq("id", currentJob.id)
              .single(),
            supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("job_id", currentJob.id)
              .eq("status", "confirmed"),
            supabase
              .from("job_invitations")
              .select("id, worker_id, status")
              .eq("job_id", currentJob.id),
          ]);

          const invitationRows = invitationsResult.error
            ? []
            : invitationsResult.data || [];
          const declinedInvitationCount = invitationRows.filter(
            (row) => row.status === "declined"
          ).length;

          if (!jobResult.error) {
            const confirmedCount = bookingResult.count || 0;
            setCurrentJob((existing) =>
              existing?.id === currentJob.id
                ? {
                    ...jobResult.data,
                    confirmedCount,
                    declinedInvitationCount,
                  }
                : existing
            );
          }

          if (!invitationsResult.error) {
            setInvitedIds(invitationRows.map((row) => row.worker_id));
            setInvitationStatuses(
              Object.fromEntries(
                invitationRows.map((row) => [row.worker_id, row.status])
              )
            );
            setInvitationByWorker(
              Object.fromEntries(
                invitationRows.map((row) => [row.worker_id, row])
              )
            );
          }
        }
      } catch {
        // Periodinis atnaujinimas neturi trukdyti pagrindiniam darbui.
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [company?.id, currentJob?.id, planSummary?.can_team_chat, companyMemberRole, showLongTermEmployment]);

  async function loadEmployerNotifications() {
    const result = await supabase
      .from("job_notifications")
      .select("id, job_id, invitation_id, event_type, created_at, read_at")
      .is("read_at", null)
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
    setEmployerNotifications(result.data || []);
  }

  function unreadEmployerNotifications(jobId) {
    return employerNotifications.filter((item) => item.job_id === jobId);
  }

  function unreadEmployerGroupChatNotifications(jobId) {
    return employerNotifications.filter(
      (item) =>
        item.job_id === jobId &&
        item.event_type === "message" &&
        !item.invitation_id
    );
  }

  function unreadEmployerPrivateChatNotifications(invitationId) {
    return employerNotifications.filter(
      (item) =>
        item.invitation_id === invitationId &&
        item.event_type === "message"
    );
  }

  async function markEmployerNotificationIdsRead(ids) {
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setEmployerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  async function markEmployerGroupChatRead(jobId) {
    const ids = unreadEmployerGroupChatNotifications(jobId).map(
      (item) => item.id
    );
    await markEmployerNotificationIdsRead(ids);
  }

  async function markEmployerPrivateChatRead(invitationId) {
    const ids = unreadEmployerPrivateChatNotifications(invitationId).map(
      (item) => item.id
    );
    await markEmployerNotificationIdsRead(ids);
  }

  async function markEmployerJobRead(jobId) {
    const ids = unreadEmployerNotifications(jobId)
      .filter((item) => item.event_type !== "message")
      .map((item) => item.id);
    await markEmployerNotificationIdsRead(ids);
  }

  function teamMemberName(userId) {
    return (
      teamMembers.find((member) => member.user_id === userId)?.display_name ||
      (userId === user.id ? "Aš" : "Komandos narys")
    );
  }

  async function loadCompanyTeamChatUnread(
    companyId = company?.id,
    plan = planSummary
  ) {
    if (!companyId || !plan?.can_team_chat) {
      setTeamChatUnread(0);
      return 0;
    }

    const result = await supabase.rpc(
      "get_company_team_chat_unread_count",
      { p_company_id: companyId }
    );

    if (result.error) throw result.error;

    const count = Number(result.data || 0);
    setTeamChatUnread(count);
    return count;
  }

  async function loadCompanyTeam(
    companyId = company?.id,
    role = companyMemberRole,
    plan = planSummary
  ) {
    if (!companyId || !plan?.can_team_management) {
      setTeamMembers([]);
      setTeamInvites([]);
      return;
    }

    setTeamLoading(true);

    try {
      const membersResult = await supabase.rpc("get_company_team", {
        p_company_id: companyId,
      });

      if (membersResult.error) throw membersResult.error;

      setTeamMembers(membersResult.data || []);

      if (role === "owner") {
        const invitesResult = await supabase.rpc(
          "get_company_team_invites",
          { p_company_id: companyId }
        );

        if (invitesResult.error) throw invitesResult.error;
        setTeamInvites(invitesResult.data || []);
      } else {
        setTeamInvites([]);
      }
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti įmonės komandos.");
    } finally {
      setTeamLoading(false);
    }
  }

  function goEmployerView(view) {
    const actions = {
      favorites: openSavedWorkerTeam,
      urgent: openUrgentSearch,
      longterm: () => openLongTermEmployment("hire"),
      teamchat: openCompanyTeamChat,
      team: openCompanyTeam,
      plans: () => setShowPlans(true),
    };
    if (actions[view]) {
      actions[view]();
      return;
    }
    if (view === "new") {
      openNewJobForm();
      return;
    }
    if (view === "calendar") {
      navigateEmployerCalendar(true);
      return;
    }
    if (calendarVisible) navigateEmployerCalendar(false);
    if (view === "company") {
      setShowCompanyEditor(true);
      setEmployerView("company");
      return;
    }
    setShowCompanyEditor(false);
    if (showJobForm) setShowJobForm(false);
    if (currentJob) setCurrentJob(null);
    setEmployerView(view);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  }

  async function openCompanyTeam() {
    if (!planSummary?.can_team_management) {
      setNotice("Įmonės komandos valdymas prieinamas tik Business Pro plane. Planus galite peržiūrėti paspaudę „Planai“.");
      return;
    }

    setShowTeam(true);
    setLastTeamInviteLink("");
    await loadCompanyTeam(company?.id, companyMemberRole, planSummary);
  }

  async function openCompanyTeamChat() {
    if (!planSummary?.can_team_chat) {
      setNotice(
        "Vidinis įmonės vadovų pokalbis prieinamas tik Business Pro plane. Planus galite peržiūrėti paspaudę „Planai“."
      );
      return;
    }

    if (company?.id) {
      const readResult = await supabase.rpc("mark_company_team_chat_read", {
        p_company_id: company.id,
      });

      if (readResult.error) {
        setError(readResult.error.message);
        return;
      }
    }

    setTeamChatUnread(0);
    setShowTeamChat(true);
  }

  async function createTeamInvite() {
    if (!company?.id || companyMemberRole !== "owner") return;

    setTeamActionBusy(true);
    setError("");
    setNotice("");
    setLastTeamInviteLink("");

    try {
      const result = await supabase.rpc("create_company_team_invite", {
        p_company_id: company.id,
        p_email: teamInviteForm.email.trim(),
        p_display_name: teamInviteForm.displayName.trim(),
        p_member_role: teamInviteForm.memberRole,
      });

      if (result.error) throw result.error;

      const row = result.data?.[0];
      const link = companyTeamInviteLink(row?.token);
      setLastTeamInviteLink(link);

      try {
        await navigator.clipboard.writeText(link);
        setNotice("Kvietimas sukurtas. Nuoroda nukopijuota.");
      } catch {
        setNotice("Kvietimas sukurtas. Nukopijuokite nuorodą iš komandos lango.");
      }

      setTeamInviteForm({
        displayName: "",
        email: "",
        memberRole: "recruiter",
      });

      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko sukurti komandos kvietimo.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function copyTeamInvite(token) {
    const link = companyTeamInviteLink(token);

    try {
      await navigator.clipboard.writeText(link);
      setNotice("Kvietimo nuoroda nukopijuota.");
    } catch {
      setLastTeamInviteLink(link);
      setNotice("Kvietimo nuoroda paruošta kopijavimui.");
    }
  }

  async function revokeTeamInvite(inviteId) {
    if (!company?.id) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc("revoke_company_team_invite", {
        p_invite_id: inviteId,
      });

      if (result.error) throw result.error;

      setNotice("Kvietimas atšauktas.");
      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko atšaukti kvietimo.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function changeTeamMemberRole(member, memberRole) {
    if (!company?.id || !member?.user_id) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc(
        "update_company_team_member_role",
        {
          p_company_id: company.id,
          p_user_id: member.user_id,
          p_member_role: memberRole,
        }
      );

      if (result.error) throw result.error;

      setNotice("Komandos nario rolė atnaujinta.");
      await loadCompanyTeam(company.id, companyMemberRole, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko pakeisti rolės.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  async function removeTeamMember(member) {
    if (!company?.id || !member?.user_id) return;

    const confirmed = await askConfirm({
      eyebrow: "KOMANDOS NARYS",
      title: "Pašalinti iš įmonės komandos?",
      message: `${member.display_name} bus pašalintas iš komandos, o jo atsakingi darbai bus perduoti įmonės savininkui.`,
      confirmLabel: "Pašalinti",
      danger: true,
    });

    if (!confirmed) return;

    setTeamActionBusy(true);
    setError("");

    try {
      const result = await supabase.rpc("remove_company_team_member", {
        p_company_id: company.id,
        p_user_id: member.user_id,
      });

      if (result.error) throw result.error;

      setNotice("Komandos narys pašalintas.");
      await Promise.all([
        loadCompanyTeam(company.id, companyMemberRole, planSummary),
        reloadJobs(company.id),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti komandos nario.");
    } finally {
      setTeamActionBusy(false);
    }
  }

  function requireEmployerChatPlan() {
    if (planSummary?.can_job_chat) return true;

    setNotice(
      "Darbo pokalbiai prieinami Business ir Business Pro planuose. Planus galite peržiūrėti paspaudę „Planai“."
    );
    return false;
  }

  async function openEmployerPrivateConversation(invitationId, title) {
    if (!requireEmployerChatPlan()) return;

    setConversation({
      invitationId,
      title,
    });
  }

  async function openEmployerGroupConversation(job) {
    if (!requireEmployerChatPlan()) return;

    setGroupConversation({
      jobId: job.id,
      title: job.title,
    });
  }

  async function loadCompanyPlan(companyId = company?.id) {
    if (!companyId) return null;

    const result = await supabase.rpc("get_company_plan_summary", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const summary = result.data?.[0] || null;
    setPlanSummary(summary);
    return summary;
  }

  async function loadCompanyBillingStatus(companyId = company?.id) {
    if (!companyId) {
      setBillingStatus(null);
      return null;
    }

    const result = await supabase.rpc("get_company_billing_status", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const status = result.data?.[0] || null;
    setBillingStatus(status);
    return status;
  }

  async function loadPendingPlanChange(companyId = company?.id) {
    if (!companyId) {
      setPendingPlanChange(null);
      return null;
    }

    const result = await supabase.rpc("get_company_pending_plan_change", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const pending = result.data?.[0] || null;
    const activePending = pending?.pending_plan_key
      ? pending
      : null;

    setPendingPlanChange(activePending);
    return activePending;
  }

  async function activatePlanForAdminTest(planKey) {
    if (!company?.id || !onAdminReturn) return;

    setPlanActionBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("admin_set_company_plan", {
        p_company_id: company.id,
        p_plan_key: planKey,
        p_subscription_status: "active",
        p_period_end: null,
        p_reason: "Plano testavimas administratoriaus darbdavio režime",
      });

      if (result.error) throw result.error;

      const billingInterval =
        planKey === "basic" ? "monthly" : planBillingCycle;

      const billingResult = await supabase.rpc(
        "set_company_billing_preference",
        {
          p_company_id: company.id,
          p_billing_interval: billingInterval,
        }
      );

      if (billingResult.error) throw billingResult.error;

      setCompany((current) =>
        current
          ? { ...current, billing_interval: billingInterval }
          : current
      );

      await loadCompanyPlan(company.id);
      setNotice(
        `${employerPlanName(planKey)} planas aktyvuotas testavimui · ${
          billingInterval === "yearly" ? "metinis" : "mėnesinis"
        } atsiskaitymas.`
      );
      setShowPlans(false);
    } catch (err) {
      setError(err?.message || "Nepavyko pakeisti plano.");
    } finally {
      setPlanActionBusy(false);
    }
  }

  async function openBillingPortal() {
    if (!company?.id || planActionInFlightRef.current) return;

    if (companyMemberRole !== "owner") {
      setError("Prenumeratą gali valdyti tik įmonės savininkas.");
      return;
    }

    planActionInFlightRef.current = true;
    setPlanActionBusy(true);
    setError("");
    setNotice("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "stripe-customer-portal",
        {
          body: { companyId: company.id },
        }
      );

      if (invokeError) throw invokeError;
      if (!data?.url) {
        throw new Error("Stripe negrąžino prenumeratos valdymo nuorodos.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        await edgeFunctionErrorMessage(
          err,
          "Nepavyko atidaryti prenumeratos valdymo. Bandykite dar kartą."
        )
      );
      setPlanActionBusy(false);
      planActionInFlightRef.current = false;
    }
  }

  async function requestPaidPlan(planKey) {
    if (planActionInFlightRef.current) return;
    const plan = EMPLOYER_PLANS.find((item) => item.key === planKey);
    if (!plan || !company?.id) return;

    if (companyMemberRole !== "owner") {
      setError(
        "Planą ir atsiskaitymo laikotarpį gali keisti tik įmonės savininkas."
      );
      return;
    }

    const hasPaidSubscription =
      Boolean(billingStatus?.has_stripe_subscription) &&
      ["active", "trialing", "past_due"].includes(
        billingStatus?.subscription_status
      );

    if (plan.price === 0) {
      if (hasPaidSubscription) {
        setNotice(
          "Mokama prenumerata galioja. Norėdami grįžti į Basic, pirmiausia valdykite arba nutraukite prenumeratą Stripe lange."
        );
        await openBillingPortal();
        return;
      }

      setNotice("Basic planas jau yra nemokamas ir nereikalauja apmokėjimo.");
      setShowPlans(false);
      return;
    }

    if (hasPaidSubscription) {
      setNotice(
        "Jau turite aktyvią mokamą prenumeratą. Planą, atsiskaitymo laikotarpį ar atšaukimą valdykite prenumeratos lange."
      );
      await openBillingPortal();
      return;
    }

    const billingInterval = planBillingCycle;

    planActionInFlightRef.current = true;
    setPlanActionBusy(true);
    setError("");
    setNotice("");

    try {
      const preferenceResult = await supabase.auth.updateUser({
        data: {
          preferred_plan: planKey,
          preferred_billing_interval: billingInterval,
        },
      });

      if (preferenceResult.error) throw preferenceResult.error;

      const { data, error: checkoutError } = await supabase.functions.invoke(
        "stripe-create-checkout",
        {
          body: {
            companyId: company.id,
            planKey,
            billingInterval,
          },
        }
      );

      if (checkoutError) throw checkoutError;
      if (!data?.url) {
        throw new Error("Stripe negrąžino apmokėjimo nuorodos.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        await edgeFunctionErrorMessage(
          err,
          "Nepavyko pradėti Stripe apmokėjimo. Bandykite dar kartą."
        )
      );
      setPlanActionBusy(false);
      planActionInFlightRef.current = false;
    }
  }

  async function loadSavedWorkers(
    companyId = company?.id,
    plan = planSummary
  ) {
    if (!companyId || !plan?.can_saved_workers) {
      setSavedWorkers([]);
      return [];
    }

    const result = await supabase.rpc("get_company_saved_workers", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const rows = (result.data || []).map((row) => ({
      ...row,
      id: row.worker_id,
      name: shortWorkerName(row.display_name),
      initials: workerInitials(row.display_name),
      avatarUrl: workerAvatarUrl(row.avatar_path),
      city: row.city || "",
      yearsExperience: Number(row.years_experience || 0),
      hasDrivingLicenseB: Boolean(row.has_driving_license_b),
      attendanceRate: Number(row.attendance_rate ?? 100),
      ratingAverage:
        row.rating_average === null || row.rating_average === undefined
          ? null
          : Number(row.rating_average),
      ratingCount: Number(row.rating_count || 0),
      completedJobs: Number(row.completed_jobs || 0),
    }));

    setSavedWorkers(rows);
    return rows;
  }

  async function loadCompanyWorkerReviews(companyId = company?.id) {
    if (!companyId) {
      setCompanyWorkerReviews([]);
      return [];
    }

    const result = await supabase.rpc("get_company_worker_reviews_for_company", {
      p_company_id: companyId,
    });

    if (result.error) throw result.error;

    const rows = result.data || [];
    setCompanyWorkerReviews(rows);
    return rows;
  }

  async function openReviewWorkerProfile(review) {
    if (!review?.worker_id) return;

    await openWorkerProfile({
      id: review.worker_id,
      name: shortWorkerName(review.worker_name || "Darbuotojas"),
      initials: workerInitials(review.worker_name || "Darbuotojas"),
      avatarUrl: workerAvatarUrl(review.avatar_path),
      city: review.city || "",
      yearsExperience: Number(review.years_experience || 0),
      hasDrivingLicenseB: Boolean(review.has_driving_license_b),
      attendanceRate:
        review.attendance_rate === null || review.attendance_rate === undefined
          ? null
          : Number(review.attendance_rate),
      completedJobs: Number(review.completed_jobs || 0),
      ratingAverage:
        review.rating_average === null || review.rating_average === undefined
          ? null
          : Number(review.rating_average),
      ratingCount: Number(review.rating_count || 0),
      noShowCount: Number(review.no_show_count || 0),
      unexcusedEarlyLeaveCount: Number(
        review.unexcused_early_leave_count || 0
      ),
      shortBio: review.short_bio || "",
      skillNames: Array.isArray(review.skill_names) ? review.skill_names : [],
      profileJobId: review.job_id || null,
    });
  }

  async function loadCompanyLongTermUnreadCounts(
    companyId = company?.id,
    role = companyMemberRole
  ) {
    if (!companyId || role !== "owner") {
      setLongTermUnreadByOffer({});
      return {};
    }
    const result = await supabase.rpc("get_company_long_term_unread_counts", {
      p_company_id: companyId,
    });
    if (result.error) throw result.error;
    const unreadMap = Object.fromEntries(
      (result.data || []).map((row) => [
        row.placement_id,
        Number(row.unread_count || 0),
      ])
    );
    setLongTermUnreadByOffer(unreadMap);
    return unreadMap;
  }

  async function loadCompanyLongTermData(
    companyId = company?.id,
    role = companyMemberRole
  ) {
    if (!companyId || role !== "owner") {
      setLongTermCandidates([]);
      setCompanyLongTermOffers([]);
      setLongTermUnreadByOffer({});
      return { candidates: [], offers: [] };
    }

    const [candidatesResult, offersResult, unreadResult] = await Promise.all([
      supabase.rpc("get_company_long_term_candidates", {
        p_company_id: companyId,
      }),
      supabase.rpc("get_company_long_term_offers", {
        p_company_id: companyId,
      }),
      supabase.rpc("get_company_long_term_unread_counts", {
        p_company_id: companyId,
      }),
    ]);

    if (candidatesResult.error) throw candidatesResult.error;
    if (offersResult.error) throw offersResult.error;
    if (unreadResult.error) throw unreadResult.error;

    const candidates = candidatesResult.data || [];
    const offers = offersResult.data || [];
    const unreadMap = Object.fromEntries(
      (unreadResult.data || []).map((row) => [
        row.placement_id,
        Number(row.unread_count || 0),
      ])
    );
    setLongTermCandidates(candidates);
    setCompanyLongTermOffers(offers);
    setEmployerStats((current) => ({
      ...current,
      activeLongTermEmployees: offers.filter((offer) => offer.status === "active").length,
    }));
    setLongTermUnreadByOffer(unreadMap);
    return { candidates, offers };
  }

  async function openLongTermEmployment(mode = "hire") {
    if (!company?.id) return;
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimo pasiūlymus gali valdyti tik įmonės savininkas.");
      return;
    }
    setLongTermModalMode(mode);
    setShowLongTermEmployment(true);
    setLongTermSelectedWorker(null);
    setLongTermCommitmentSummary(null);
    setLongTermContractFile(null);
    setLongTermBusy(true);
    setError("");
    try {
      await loadCompanyLongTermData(company.id, companyMemberRole);
      setLongTermOfferForm((current) => ({
        ...current,
        positionTitle: "",
        contractType: "indefinite",
        proposedStartDate: employerTomorrowISO(),
        proposedEndDate: "",
        workplaceCity: company.city || companyForm.city || "Vilnius",
        workplaceAddress: "",
        salaryAmount: "",
        salaryPeriod: "monthly",
        salaryBasis: "net",
        salaryNote: "",
        employmentDetails: "",
        scheduleType: "fixed",
      }));
      setLongTermSchedule(defaultLongTermSchedule());
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti įdarbinimo pasiūlymų.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function chooseLongTermCandidate(worker) {
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimo pasiūlymą gali rengti tik įmonės savininkas.");
      return;
    }
    setLongTermSelectedWorker(worker);
    setLongTermCommitmentSummary(null);
    setLongTermContractFile(null);
    setLongTermOfferForm((current) => ({
      ...current,
      positionTitle: "",
      contractType: "indefinite",
      proposedStartDate: employerTomorrowISO(),
      proposedEndDate: "",
      workplaceCity: company?.city || companyForm.city || "Vilnius",
      workplaceAddress: "",
      salaryAmount: "",
      salaryPeriod: "monthly",
      salaryBasis: "net",
      salaryNote: "",
      employmentDetails: "",
      scheduleType: "fixed",
    }));
    setLongTermSchedule(defaultLongTermSchedule());

    if (!company?.id || !worker?.worker_id) return;
    setLongTermCommitmentLoading(true);
    try {
      const result = await supabase.rpc(
        "get_long_term_candidate_commitment_summary",
        {
          p_company_id: company.id,
          p_worker_id: worker.worker_id,
        }
      );
      if (result.error) throw result.error;
      setLongTermCommitmentSummary(result.data?.[0] || null);
    } catch (err) {
      setError(err?.message || "Nepavyko patikrinti darbuotojo suplanuotų darbų.");
    } finally {
      setLongTermCommitmentLoading(false);
    }
  }

  function updateLongTermScheduleDay(weekday, key, value) {
    setLongTermSchedule((current) =>
      current.map((row) =>
        row.weekday === weekday ? { ...row, [key]: value } : row
      )
    );
  }

  async function submitLongTermOffer() {
    if (!company?.id || !longTermSelectedWorker?.worker_id || longTermBusy) return;
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimo pasiūlymą gali pateikti tik įmonės savininkas.");
      return;
    }

    if (!longTermOfferForm.positionTitle.trim()) {
      setError("Nurodykite darbo poziciją.");
      return;
    }
    if (!longTermOfferForm.proposedStartDate) {
      setError("Nurodykite preliminarią darbo pradžios datą.");
      return;
    }
    if (
      longTermOfferForm.contractType === "fixed_term" &&
      !longTermOfferForm.proposedEndDate
    ) {
      setError("Terminuotai sutarčiai nurodykite pabaigos datą.");
      return;
    }
    if (
      longTermOfferForm.scheduleType === "fixed" &&
      !longTermSchedule.some((row) => row.enabled)
    ) {
      setError("Pasirinkite bent vieną darbo dieną.");
      return;
    }
    if (!longTermContractFile) {
      setError("Įkelkite darbo sutartį, kurią darbuotojas turės perskaityti ir pasirašyti.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(longTermContractFile.type)) {
      setError("Darbo sutartis turi būti PDF arba DOCX formato.");
      return;
    }
    if (longTermContractFile.size > 15 * 1024 * 1024) {
      setError("Darbo sutarties failas negali būti didesnis nei 15 MB.");
      return;
    }

    setLongTermBusy(true);
    setError("");
    setNotice("");
    let placementId = null;
    let storagePath = "";

    try {
      const schedule = longTermSchedule.map((row) => ({
        weekday: row.weekday,
        enabled: Boolean(row.enabled),
        start_time: row.startTime,
        end_time: row.endTime,
        break_start_time: row.noBreak ? null : row.breakStartTime,
        break_end_time: row.noBreak ? null : row.breakEndTime,
      }));

      const result = await supabase.rpc("create_long_term_offer", {
        p_company_id: company.id,
        p_worker_id: longTermSelectedWorker.worker_id,
        p_position_title: longTermOfferForm.positionTitle.trim(),
        p_contract_type: longTermOfferForm.contractType,
        p_proposed_start_date: longTermOfferForm.proposedStartDate,
        p_proposed_end_date:
          longTermOfferForm.contractType === "fixed_term"
            ? longTermOfferForm.proposedEndDate || null
            : null,
        p_workplace_city: longTermOfferForm.workplaceCity.trim() || null,
        p_workplace_address: longTermOfferForm.workplaceAddress.trim() || null,
        p_salary_amount: longTermOfferForm.salaryAmount
          ? Number(longTermOfferForm.salaryAmount)
          : null,
        p_salary_period: longTermOfferForm.salaryAmount
          ? longTermOfferForm.salaryPeriod
          : null,
        p_salary_basis: longTermOfferForm.salaryAmount
          ? longTermOfferForm.salaryBasis
          : "net",
        p_salary_note: longTermOfferForm.salaryNote.trim() || null,
        p_employment_details: longTermOfferForm.employmentDetails.trim() || null,
        p_schedule_type: longTermOfferForm.scheduleType,
        p_schedule:
          longTermOfferForm.scheduleType === "fixed" ? schedule : [],
      });
      if (result.error) throw result.error;

      placementId = result.data;
      storagePath = `${placementId}/employer/${Date.now()}-${safeStorageFileName(
        longTermContractFile.name
      )}`;

      const uploadResult = await supabase.storage
        .from("employment-contracts")
        .upload(storagePath, longTermContractFile, {
          upsert: false,
          contentType: longTermContractFile.type,
        });
      if (uploadResult.error) throw uploadResult.error;

      const publishResult = await supabase.rpc("publish_long_term_offer", {
        p_placement_id: placementId,
        p_contract_path: storagePath,
        p_contract_name: longTermContractFile.name,
      });
      if (publishResult.error) throw publishResult.error;

      const workerName = longTermSelectedWorker.worker_name;
      const positionTitle = longTermOfferForm.positionTitle.trim();
      setLongTermContractFile(null);
      setLongTermSelectedWorker(null);
      await loadCompanyLongTermData(company.id, companyMemberRole);
      setNotice(
        `Pasiūlymas pateiktas darbuotojui ${workerName}. Darbuotojui išsiųsta darbo sutartis ir žinutė ją perskaityti, pasirašyti bei įkelti atgal.`
      );

      // Iškart po sėkmingo pateikimo atidarome pasiūlymo pokalbį.
      // Taip darbdavys iš karto mato automatinę žinutę apie sutartį ir gali rašyti darbuotojui.
      setShowLongTermEmployment(false);
      setLongTermConversation({
        placementId,
        title: `${workerName} · ${positionTitle}`,
      });
    } catch (err) {
      // Jei pasiūlymo sukūrimas pavyko, bet sutarties įkėlimas / pateikimas nepavyko,
      // išvalome neužbaigtą juodraštį, kad kitas bandymas būtų švarus.
      if (storagePath) {
        try {
          await supabase.storage.from("employment-contracts").remove([storagePath]);
        } catch (_) {}
      }
      if (placementId) {
        try {
          await supabase.rpc("discard_long_term_offer_draft", {
            p_placement_id: placementId,
          });
        } catch (_) {}
      }
      setError(err?.message || "Nepavyko išsiųsti įdarbinimo pasiūlymo.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function employerConfirmLongTermOffer(offer) {
    if (!offer?.id || longTermBusy) return;
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimą gali patvirtinti tik įmonės savininkas.");
      return;
    }
    setLongTermBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("employer_confirm_long_term_placement", {
        p_placement_id: offer.id,
      });
      if (result.error) throw result.error;
      await loadCompanyLongTermData(company.id, companyMemberRole);
      setNotice(
        result.data === "active"
          ? "Pasirašyta sutartis priimta. Darbuotojo įdarbinimas aktyvuotas ir grafikas pradėjo galioti."
          : "Patvirtinimas išsaugotas."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti įsidarbinimo.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function employerOpenLongTermContract(path) {
    try {
      setError("");
      await openEmploymentContract(path);
    } catch (err) {
      setError(err?.message || "Nepavyko atidaryti sutarties.");
    }
  }

  async function endLongTermEmployment(offer) {
    if (!offer?.id || longTermBusy) return;
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimą gali valdyti tik įmonės savininkas.");
      return;
    }
    const confirmed = await askConfirm({
      title: "Nutraukti įdarbinimą?",
      message: `Ar tikrai norite nutraukti ${offer.worker_name || "darbuotojo"} ilgalaikį įdarbinimą? Darbuotojas apie tai bus informuotas prisijungęs prie paskyros.`,
      confirmLabel: "Nutraukti įdarbinimą",
      cancelLabel: "Atšaukti",
      tone: "danger",
    });
    if (!confirmed) return;

    setLongTermBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("end_long_term_placement", {
        p_placement_id: offer.id,
        p_note: null,
      });
      if (result.error) throw result.error;
      await loadCompanyLongTermData(company.id, companyMemberRole);
      setNotice("Įdarbinimas nutrauktas. Darbuotojas bus informuotas prisijungęs prie paskyros.");
    } catch (err) {
      setError(err?.message || "Nepavyko nutraukti įdarbinimo.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function withdrawLongTermOffer(offer) {
    if (!offer?.id || longTermBusy) return;
    if (companyMemberRole !== "owner") {
      setError("Įdarbinimo pasiūlymą gali atšaukti tik įmonės savininkas.");
      return;
    }
    setLongTermBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("employer_withdraw_long_term_placement", {
        p_placement_id: offer.id,
      });
      if (result.error) throw result.error;
      await loadCompanyLongTermData(company.id, companyMemberRole);
      setNotice("Įdarbinimo pasiūlymas atšauktas.");
    } catch (err) {
      setError(err?.message || "Nepavyko atšaukti pasiūlymo.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function loadEmployerDashboard() {
    setLoading(true);
    setError("");

    try {
      const memberResult = await supabase
        .from("company_members")
        .select("company_id, member_role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (memberResult.error) throw memberResult.error;
      if (!memberResult.data?.company_id) {
        throw new Error("Prie paskyros nerasta įmonė.");
      }

      const companyId = memberResult.data.company_id;
      const loadedMemberRole = memberResult.data.member_role || null;
      setCompanyMemberRole(loadedMemberRole);

      const [
        companyResult,
        jobsResult,
        planResult,
      ] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "id, name, company_code, city, description, avatar_path, is_verified, reliability_rate, cancelled_confirmed_count, false_attendance_claim_count"
          )
          .eq("id", companyId)
          .single(),
        loadAllCompanyJobs(companyId),
        supabase.rpc("get_company_plan_summary", {
          p_company_id: companyId,
        }),
      ]);

      const failed = [
        companyResult,
        jobsResult,
        planResult,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;

      const loadedPlan = planResult.data?.[0] || null;

      setCompany(companyResult.data);
      setCompanyForm((current) => ({
        ...current,
        name: companyResult.data?.name || "",
        companyCode: companyResult.data?.company_code || "",
        city: companyResult.data?.city || "",
        description: companyResult.data?.description || "",
        avatarPath: companyResult.data?.avatar_path || "",
      }));
      setCompanyAvatarFile(null);
      setCompanyAvatarPreview("");
      setCompanyAvatarMarkedForRemoval(false);
      setJobs(jobsResult.data || []);
      setPlanSummary(loadedPlan);
      setForm((current) => ({
        ...current,
        city: companyResult.data?.city || current.city,
      }));

      setLoading(false);

      const backgroundTasks = [
        supabase
          .from("user_private")
          .select("phone")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) throw error;
            setCompanyForm((current) => ({
              ...current,
              phone: data?.phone || "",
            }));
          }),
        supabase
          .from("skills")
          .select("id, name")
          .eq("is_active", true)
          .order("name")
          .then(({ data, error }) => {
            if (error) throw error;
            setSkills(data || []);
          }),
        addConfirmedCounts(jobsResult.data || []).then((rows) => setJobs(rows)),
        loadCompanyBillingStatus(companyId).then((loadedBilling) => {
          setPlanBillingCycle(
            loadedBilling?.billing_interval === "yearly"
              ? "yearly"
              : preferredPlanKey !== "basic" &&
                user?.user_metadata?.preferred_billing_interval === "yearly"
              ? "yearly"
              : "monthly"
          );
        }),
        supabase
          .from("monthly_awards")
          .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
          .eq("recipient_type", "company")
          .eq("recipient_id", companyId)
          .order("award_month", { ascending: false })
          .limit(120)
          .then(({ data, error }) => {
            if (error) throw error;
            setCompanyMonthlyAwards(data || []);
          }),
        supabase
          .from("monthly_awards")
          .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
          .eq("recipient_type", "worker")
          .eq("award_month", monthlyAwardPreviousMonthISO())
          .then(({ data, error }) => {
            if (error) throw error;
            const nextWorkerAwardsById = {};
            for (const award of data || []) {
              if (!nextWorkerAwardsById[award.recipient_id]) {
                nextWorkerAwardsById[award.recipient_id] = [];
              }
              nextWorkerAwardsById[award.recipient_id].push(award);
            }
            setWorkerAwardsById(nextWorkerAwardsById);
          }),
        loadPendingPlanChange(companyId),
        loadEmployerNotifications(),
        loadEmployerStats(companyId, loadedMemberRole, loadedPlan),
        loadCompanyWorkerReviews(companyId),
        loadedPlan?.can_saved_workers
          ? loadSavedWorkers(companyId, loadedPlan)
          : Promise.resolve(),
        loadedPlan?.can_team_management
          ? loadCompanyTeam(companyId, loadedMemberRole, loadedPlan)
          : Promise.resolve(),
        loadedPlan?.can_team_chat
          ? loadCompanyTeamChatUnread(companyId, loadedPlan)
          : Promise.resolve(),
        loadedMemberRole === "owner"
          ? loadCompanyLongTermUnreadCounts(companyId, loadedMemberRole)
          : Promise.resolve(),
      ];

      void Promise.allSettled(backgroundTasks);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbdavio paskyros.");
      setLoading(false);
    }
  }

  function updateCompanyField(key, value) {
    setCompanyForm((current) => ({ ...current, [key]: value }));
  }

  function chooseCompanyAvatarFile(file) {
    if (companyMemberRole !== "owner") {
      setError("Įmonės logotipą gali keisti tik įmonės savininkas.");
      return;
    }
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Įmonės logotipas turi būti JPG, PNG arba WEBP formato.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Įmonės logotipas negali būti didesnis nei 5 MB.");
      return;
    }

    if (companyAvatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(companyAvatarPreview);
    }

    setCompanyAvatarFile(file);
    setCompanyAvatarPreview(URL.createObjectURL(file));
    setCompanyAvatarMarkedForRemoval(false);
    setError("");
  }

  function markCompanyAvatarForRemoval() {
    if (companyMemberRole !== "owner") {
      setError("Įmonės logotipą gali ištrinti tik įmonės savininkas.");
      return;
    }
    if (companyAvatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(companyAvatarPreview);
    }
    setCompanyAvatarFile(null);
    setCompanyAvatarPreview("");
    setCompanyAvatarMarkedForRemoval(Boolean(companyForm.avatarPath));
    setError("");
  }

  async function saveCompanyInformation() {
    const name = companyForm.name.trim();
    const cityInput = companyForm.city.trim();
    const phone = companyForm.phone.trim();
    const normalizedPhone = phone ? normalizeLithuanianMobilePhone(phone) : "";
    const description = companyForm.description.trim();

    if (!company?.id) return;

    if (companyMemberRole !== "owner") {
      setError("Įmonės informaciją gali redaguoti tik įmonės savininkas.");
      return;
    }

    if (name.length < 2) {
      setError("Įveskite įmonės pavadinimą.");
      return;
    }

    if (cityInput.length < 2) {
      setError("Pasirinkite įmonės miestą.");
      return;
    }

    if (phone && !normalizedPhone) {
      setError("Įveskite galiojantį Lietuvos mobiliojo telefono numerį, pvz. +37061234567.");
      return;
    }

    setCompanySaving(true);
    setError("");
    setNotice("");

    try {
      const city = await canonicalCityName(cityInput);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      await companyPhoneVerification.saveChange();

      let nextCompanyAvatarPath = companyAvatarMarkedForRemoval
        ? ""
        : companyForm.avatarPath || "";

      if (companyAvatarFile) {
        const extension =
          companyAvatarFile.type === "image/png"
            ? "png"
            : companyAvatarFile.type === "image/webp"
            ? "webp"
            : "jpg";
        const uploadPath = `${user.id}/company-${company.id}-${Date.now()}.${extension}`;

        const uploadResult = await supabase.storage
          .from("worker-avatars")
          .upload(uploadPath, companyAvatarFile, {
            cacheControl: "3600",
            contentType: companyAvatarFile.type,
            upsert: false,
          });

        if (uploadResult.error) throw uploadResult.error;
        nextCompanyAvatarPath = uploadPath;
      }

      const companyResult = await supabase
        .from("companies")
        .update({
          name,
          city,
          description: description || null,
          avatar_path: nextCompanyAvatarPath || null,
        })
        .eq("id", company.id)
        .select(
          "id, name, company_code, city, description, avatar_path, is_verified, reliability_rate, cancelled_confirmed_count, false_attendance_claim_count"
        )
        .single();

      if (companyResult.error) throw companyResult.error;

      if (
        companyForm.avatarPath &&
        companyForm.avatarPath !== nextCompanyAvatarPath &&
        (companyAvatarFile || companyAvatarMarkedForRemoval)
      ) {
        await supabase.storage
          .from("worker-avatars")
          .remove([companyForm.avatarPath]);
      }

      const privateResult = await supabase
        .from("user_private")
        .upsert(
          {
            user_id: user.id,
            phone: normalizedPhone || null,
          },
          { onConflict: "user_id" }
        );

      if (privateResult.error) throw privateResult.error;

      setCompany(companyResult.data);
      setCompanyForm({
        name: companyResult.data?.name || "",
        companyCode: companyResult.data?.company_code || "",
        city: companyResult.data?.city || "",
        phone: normalizedPhone,
        description: companyResult.data?.description || "",
        avatarPath: companyResult.data?.avatar_path || "",
      });
      if (companyAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(companyAvatarPreview);
      }
      setCompanyAvatarFile(null);
      setCompanyAvatarPreview("");
      setCompanyAvatarMarkedForRemoval(false);

      setShowCompanyEditor(false);
      setNotice("Įmonės informacija atnaujinta.");
    } catch (err) {
      setError(err?.message || "Nepavyko atnaujinti įmonės informacijos.");
    } finally {
      setCompanySaving(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "address") {
      setSelectedJobAddress(null);
    }
    if (key === "city") {
      setSelectedJobAddress(null);
    }
    if (key === "address" || key === "payAmount" || key === "description") {
      setJobFormErrors((current) => ({ ...current, [key]: "" }));
    }
  }

  async function loadEmployerStats(
    companyId = company?.id,
    memberRole = companyMemberRole,
    plan = planSummary
  ) {
    if (!companyId) return;

    const [jobsResult, companyResult, penaltiesResult, longTermOffersResult] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, status, workers_needed, work_date, created_by, responsible_user_id"
        )
        .eq("company_id", companyId),
      supabase
        .from("companies")
        .select("reliability_rate, cancelled_confirmed_count, false_attendance_claim_count, reliability_good_jobs_since_penalty, reliability_last_penalty_at")
        .eq("id", companyId)
        .single(),
      supabase
        .from("employer_penalties")
        .select("id, job_id, booking_id, penalty_type, reliability_change, affected_workers, reason, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      memberRole === "owner"
        ? supabase.rpc("get_company_long_term_offers", { p_company_id: companyId })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (jobsResult.error) throw jobsResult.error;
    if (companyResult.error) throw companyResult.error;
    if (penaltiesResult.error) throw penaltiesResult.error;
    if (longTermOffersResult.error) throw longTermOffersResult.error;

    const allJobRows = jobsResult.data || [];
    const jobRows =
      plan?.can_team_management && memberRole === "recruiter"
        ? allJobRows.filter(
            (job) =>
              job.created_by === user.id ||
              job.responsible_user_id === user.id
          )
        : allJobRows;
    const jobIds = jobRows.map((job) => job.id);

    let bookingRows = [];
    let attendanceRows = [];

    if (jobIds.length) {
      const bookingsResult = await supabase
        .from("bookings")
        .select("id, worker_id, job_id, status")
        .in("job_id", jobIds);

      if (bookingsResult.error) throw bookingsResult.error;
      bookingRows = bookingsResult.data || [];

      const bookingIds = bookingRows.map((booking) => booking.id);

      if (bookingIds.length) {
        const attendanceResult = await supabase
          .from("attendance")
          .select("booking_id, final_outcome, finalized_at")
          .in("booking_id", bookingIds)
          .not("finalized_at", "is", null);

        if (attendanceResult.error) throw attendanceResult.error;
        attendanceRows = attendanceResult.data || [];
      }
    }

    const confirmedByJob = {};
    for (const booking of bookingRows) {
      if (booking.status !== "confirmed") continue;

      confirmedByJob[booking.job_id] =
        (confirmedByJob[booking.job_id] || 0) + 1;
    }

    const attendanceByBooking = new Map(
      attendanceRows.map((attendance) => [
        attendance.booking_id,
        attendance,
      ])
    );

    const jobById = new Map(
      jobRows.map((job) => [job.id, job])
    );

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );
    const nextMonthStart = `${nextMonthDate.getFullYear()}-${String(
      nextMonthDate.getMonth() + 1
    ).padStart(2, "0")}-01`;

    const monthlyWorkerIds = new Set();

    for (const booking of bookingRows) {
      const job = jobById.get(booking.job_id);
      const attendance = attendanceByBooking.get(booking.id);

      if (!job || !attendance?.finalized_at) continue;

      const worked =
        attendance.final_outcome === "full_day" ||
        attendance.final_outcome === "left_early_agreed" ||
        attendance.final_outcome === "left_early_unexcused";

      if (
        worked &&
        job.work_date >= monthStart &&
        job.work_date < nextMonthStart
      ) {
        monthlyWorkerIds.add(booking.worker_id);
      }
    }

    const monthlyWorkersUsed = monthlyWorkerIds.size;

    const today = localDateISO(new Date());

    const filledJobs = jobRows.filter((job) => {
      const confirmed = confirmedByJob[job.id] || 0;
      return (
        job.status !== "cancelled" &&
        confirmed >= Number(job.workers_needed || 0) &&
        job.work_date >= today
      );
    }).length;

    const missingWorkers = jobRows
      .filter(
        (job) =>
          job.status !== "cancelled" &&
          job.status !== "completed" &&
          job.work_date >= today
      )
      .reduce((sum, job) => {
        const confirmed = confirmedByJob[job.id] || 0;
        return sum + Math.max(0, Number(job.workers_needed || 0) - confirmed);
      }, 0);

    const completedJobs = jobRows.filter(
      (job) => job.status === "completed"
    ).length;

    setEmployerStats({
      totalJobs: jobRows.length,
      filledJobs,
      missingWorkers,
      completedJobs,
      cancelledJobs: jobRows.filter((job) => job.status === "cancelled").length,
      monthlyWorkersUsed,
      activeLongTermEmployees: (longTermOffersResult.data || []).filter(
        (offer) => offer.status === "active"
      ).length,
      reliabilityRate: Number(companyResult.data?.reliability_rate ?? 100),
      cancelledConfirmedCount: Number(
        companyResult.data?.cancelled_confirmed_count || 0
      ),
      falseAttendanceClaimCount: Number(
        companyResult.data?.false_attendance_claim_count || 0
      ),
      reliabilityGoodJobsSincePenalty: Number(
        companyResult.data?.reliability_good_jobs_since_penalty || 0
      ),
      reliabilityLastPenaltyAt:
        companyResult.data?.reliability_last_penalty_at || null,
    });

    setEmployerPenaltyHistory(penaltiesResult.data || []);

    setEmployerPenaltyByJob(
      Object.fromEntries(
        (penaltiesResult.data || [])
          .filter((penalty) => penalty.penalty_type === "job_cancelled")
          .map((penalty) => [
          penalty.job_id,
          {
            change: Number(penalty.reliability_change || 0),
            affectedWorkers: Number(penalty.affected_workers || 0),
            createdAt: penalty.created_at,
          },
        ])
      )
    );

    setCompany((current) =>
      current
        ? {
            ...current,
            reliability_rate: companyResult.data?.reliability_rate ?? 100,
            cancelled_confirmed_count:
              companyResult.data?.cancelled_confirmed_count || 0,
            false_attendance_claim_count:
              companyResult.data?.false_attendance_claim_count || 0,
          }
        : current
    );
  }

  async function addConfirmedCounts(jobRows) {
    const rows = jobRows || [];
    const ids = rows.map((job) => job.id);
    if (!ids.length) {
      return rows.map((job) => ({
        ...job,
        confirmedCount: 0,
        historicalAcceptedCount: 0,
        declinedInvitationCount: 0,
        employerWonDisputes: 0,
        workerWonDisputes: 0,
        unclosedAttendanceCount: 0,
        pendingAttendanceCount: 0,
        disputedAttendanceCount: 0,
      }));
    }

    const [bookingsResult, invitationsResult, acceptanceCountsResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, job_id, status, confirmed_at")
        .in("job_id", ids),
      supabase
        .from("job_invitations")
        .select("job_id, status")
        .in("job_id", ids),
      supabase.rpc("get_employer_job_acceptance_counts", {
        p_job_ids: ids,
      }),
    ]);

    const bookingRows = bookingsResult.error ? [] : bookingsResult.data || [];
    const invitationRows = invitationsResult.error ? [] : invitationsResult.data || [];
    const counts = {};
    const historicalAcceptedCounts = {};
    const declinedInvitationCounts = {};
    const pendingInvitationCounts = {};
    const jobIdByBookingId = new Map();

    if (!acceptanceCountsResult.error) {
      for (const row of acceptanceCountsResult.data || []) {
        counts[row.job_id] = Number(row.confirmed_now || 0);
        historicalAcceptedCounts[row.job_id] = Number(row.accepted_historically || 0);
      }
    }

    for (const invitation of invitationRows) {
      if(invitation.status === "pending") pendingInvitationCounts[invitation.job_id]=(pendingInvitationCounts[invitation.job_id] || 0)+1;
      if (invitation.status === "declined") {
        declinedInvitationCounts[invitation.job_id] =
          (declinedInvitationCounts[invitation.job_id] || 0) + 1;
      }
    }

    for (const booking of bookingRows) {
      jobIdByBookingId.set(booking.id, booking.job_id);
      if (acceptanceCountsResult.error && booking.status === "confirmed") {
        counts[booking.job_id] = (counts[booking.job_id] || 0) + 1;
      }
      if (acceptanceCountsResult.error && booking.confirmed_at) {
        historicalAcceptedCounts[booking.job_id] =
          (historicalAcceptedCounts[booking.job_id] || 0) + 1;
      }
    }

    const disputeCounts = {};
    const attendanceByBookingId = new Map();
    const bookingIds = bookingRows.map((booking) => booking.id);

    if (bookingIds.length) {
      const attendanceResult = await supabase
        .from("attendance")
        .select("booking_id, dispute_status, employer_outcome, finalized_at")
        .in("booking_id", bookingIds);

      if (attendanceResult.error) throw attendanceResult.error;

      for (const attendance of attendanceResult.data || []) {
        attendanceByBookingId.set(attendance.booking_id, attendance);
        const jobId = jobIdByBookingId.get(attendance.booking_id);
        if (!jobId) continue;
        if (!disputeCounts[jobId]) {
          disputeCounts[jobId] = { employer: 0, worker: 0 };
        }
        if (attendance.dispute_status === "resolved_employer") {
          disputeCounts[jobId].employer += 1;
        } else if (attendance.dispute_status === "resolved_worker") {
          disputeCounts[jobId].worker += 1;
        }
      }
    }

    const attendanceCounts = {};
    for (const booking of bookingRows) {
      if (booking.status !== "confirmed") continue;
      const attendance = attendanceByBookingId.get(booking.id);
      if (attendance?.finalized_at) continue;
      const summary = (attendanceCounts[booking.job_id] ||= {
        unclosed: 0,
        pending: 0,
        disputed: 0,
      });
      if (attendance?.dispute_status === "disputed") {
        summary.disputed += 1;
      } else if (["no_show", "left_early_agreed", "left_early_unexcused"].includes(attendance?.employer_outcome)) {
        summary.pending += 1;
      } else if (!attendance?.employer_outcome) {
        summary.unclosed += 1;
      }
    }

    return rows.map((job) => ({
      ...job,
      confirmedCount: counts[job.id] || 0,
      historicalAcceptedCount: historicalAcceptedCounts[job.id] || 0,
      declinedInvitationCount: declinedInvitationCounts[job.id] || 0,
      pendingInvitationCount: invitationsResult.error ? null : (pendingInvitationCounts[job.id] || 0),
      employerWonDisputes: disputeCounts[job.id]?.employer || 0,
      workerWonDisputes: disputeCounts[job.id]?.worker || 0,
      unclosedAttendanceCount: attendanceCounts[job.id]?.unclosed || 0,
      pendingAttendanceCount: attendanceCounts[job.id]?.pending || 0,
      disputedAttendanceCount: attendanceCounts[job.id]?.disputed || 0,
    }));
  }

  async function reloadJobs(companyId = company?.id) {
    if (!companyId) return;

    const result = await loadAllCompanyJobs(companyId);

    if (!result.error) {
      try {
        setJobs(await addConfirmedCounts(result.data || []));
      } catch {
        setJobs(result.data || []);
      }

      try {
        await loadEmployerStats(companyId, companyMemberRole);
      } catch {
        // Statistikos klaida neturi blokuoti poreikių sąrašo.
      }
    }
  }

  async function openJobInformation(job) {
    if (!job?.id) return;

    setJobInfoTarget(job);
    setJobInfoWorkers([]);
    setJobInfoWorkersLoading(true);

    try {
      const workersResult = await supabase.rpc("get_job_information_workers", {
        p_job_id: job.id,
      });

      if (workersResult.error) throw workersResult.error;

      setJobInfoWorkers(
        (workersResult.data || []).map((row) => ({
          id: row.worker_id,
          bookingId: row.booking_id,
          name: shortWorkerName(row.worker_name),
          initials: workerInitials(row.worker_name),
          city: row.worker_city || "",
          avatarUrl: workerAvatarUrl(row.avatar_path),
          bookingStatus: row.booking_status,
          cancellationReason: row.cancellation_reason || "",
          attendance: {
            final_outcome: row.attendance_final_outcome || null,
            employer_outcome: row.attendance_employer_outcome || null,
            worked_minutes: Number(row.attendance_worked_minutes || 0),
            finalized_at: row.attendance_finalized_at || null,
            dispute_status: row.attendance_dispute_status || null,
            resolution_note: row.attendance_resolution_note || null,
          },
        }))
      );
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbo komandos.");
      setJobInfoWorkers([]);
    } finally {
      setJobInfoWorkersLoading(false);
    }
  }

  async function loadCurrentJobWorkers(jobId) {
    const requestId = ++jobWorkersRequestRef.current;
    if (!jobId) {
      setJobWorkers([]);
      return;
    }

    const bookingsResult = await supabase
      .from("bookings")
      .select(
        "id, worker_id, invitation_id, status, confirmed_at, cancelled_at, cancellation_reason"
      )
      .eq("job_id", jobId)
      .order("confirmed_at", { ascending: true });

    if (requestId !== jobWorkersRequestRef.current) return;
    if (bookingsResult.error) throw bookingsResult.error;

    const bookingRows = bookingsResult.data || [];
    const workerIds = [...new Set(bookingRows.map((row) => row.worker_id))];
    const bookingIds = bookingRows.map((row) => row.id);

    if (!workerIds.length) {
      setJobWorkers([]);
      return;
    }

    const [profilesResult, workersResult, workerSkillsResult, attendanceResult, ratingsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, city")
          .in("id", workerIds),
        supabase.rpc("get_employer_worker_profiles", {
          p_job_id: jobId,
          p_worker_ids: workerIds,
        }),
        supabase
          .from("worker_skills")
          .select("worker_id, skill_id")
          .in("worker_id", workerIds),
        supabase
          .from("attendance")
          .select(
            "id, booking_id, status, worker_check_in_at, employer_check_in_at, worker_workday_claim, worker_claimed_at, employer_outcome, employer_marked_at, actual_end_time, employer_note, worker_response, worker_response_note, worker_responded_at, dispute_status, final_outcome, finalized_at, worked_minutes, resolution_note"
          )
          .in("booking_id", bookingIds),
        supabase
          .from("worker_ratings")
          .select("booking_id, score, comment")
          .in("booking_id", bookingIds),
      ]);

    const failed = [
      profilesResult,
      workersResult,
      workerSkillsResult,
      attendanceResult,
      ratingsResult,
    ].find((result) => result.error);

    if (requestId !== jobWorkersRequestRef.current) return;
    if (failed?.error) throw failed.error;

    const profileMap = new Map(
      (profilesResult.data || []).map((row) => [row.id, row])
    );
    const workerMap = new Map(
      (workersResult.data || []).map((row) => [row.user_id, row])
    );
    const attendanceMap = new Map(
      (attendanceResult.data || []).map((row) => [row.booking_id, row])
    );
    const ratingMap = new Map(
      (ratingsResult.data || []).map((row) => [row.booking_id, row])
    );

    const skillNameMap = new Map(
      skills.map((skill) => [Number(skill.id), skill.name])
    );
    const skillIdsByWorker = new Map();

    for (const row of workerSkillsResult.data || []) {
      const list = skillIdsByWorker.get(row.worker_id) || [];
      list.push(Number(row.skill_id));
      skillIdsByWorker.set(row.worker_id, list);
    }

    const publicStatsEntries = await Promise.all(
      workerIds.map(async (workerId) => {
        const result = await supabase.rpc("get_worker_public_stats", {
          p_worker_id: workerId,
        });
        if (result.error) return [workerId, null];

        const row = result.data?.[0] || {};
        return [
          workerId,
          {
            monthWorkedDays: Number(row.month_worked_days || 0),
            monthWorkedMinutes: Number(row.month_worked_minutes || 0),
            monthJobs: Number(row.month_jobs || 0),
            activeJobs: Number(row.active_jobs || 0),
            cancelledByEmployer: Number(row.cancelled_by_employer || 0),
            attendanceRate:
              row.attendance_rate === null ||
              row.attendance_rate === undefined
                ? null
                : Number(row.attendance_rate),
            ratingAverage:
              row.rating_average === null || row.rating_average === undefined
                ? null
                : Number(row.rating_average),
            ratingCount:
              row.rating_count === null || row.rating_count === undefined
                ? null
                : Number(row.rating_count),
            noShowCount:
              row.no_show_count === null || row.no_show_count === undefined
                ? null
                : Number(row.no_show_count),
            unexcusedEarlyLeaveCount:
              row.unexcused_early_leave_count === null ||
              row.unexcused_early_leave_count === undefined
                ? null
                : Number(row.unexcused_early_leave_count),
          },
        ];
      })
    );

    if (requestId !== jobWorkersRequestRef.current) return;
    const publicStatsMap = new Map();
    for (const [workerId, stats] of publicStatsEntries) {
      publicStatsMap.set(workerId, stats);
    }

    const rows = bookingRows
      .map((booking) => {
        const profile = profileMap.get(booking.worker_id);
        const worker = workerMap.get(booking.worker_id);
        if (!profile || !worker) return null;

        const skillNames = (skillIdsByWorker.get(booking.worker_id) || [])
          .map((id) => skillNameMap.get(id))
          .filter(Boolean)
          .slice(0, 6);

        return {
          id: booking.worker_id,
          bookingId: booking.id,
          invitationId: booking.invitation_id,
          bookingStatus: booking.status,
          name: shortWorkerName(profile.display_name),
          initials: workerInitials(profile.display_name),
          city: profile.city,
          yearsExperience: Number(worker.years_experience || 0),
          completedJobs: Number(worker.completed_jobs || 0),
          attendanceRate:
            worker.attendance_rate === null ||
            worker.attendance_rate === undefined
              ? null
              : Number(worker.attendance_rate),
          ratingAverage:
            worker.rating_average === null ||
            worker.rating_average === undefined
              ? null
              : Number(worker.rating_average),
          ratingCount:
            worker.rating_count === null || worker.rating_count === undefined
              ? null
              : Number(worker.rating_count),
          noShowCount:
            worker.no_show_count === null || worker.no_show_count === undefined
              ? null
              : Number(worker.no_show_count),
          unexcusedEarlyLeaveCount:
            worker.unexcused_early_leave_count === null ||
            worker.unexcused_early_leave_count === undefined
              ? null
              : Number(worker.unexcused_early_leave_count),
          hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
          shortBio: worker.short_bio || "",
          avatarUrl: workerAvatarUrl(worker.avatar_path),
          skillNames,
          attendance: attendanceMap.get(booking.id) || null,
          rating: ratingMap.get(booking.id) || null,
          publicStats: publicStatsMap.get(booking.worker_id) || null,
        };
      })
      .filter(Boolean);

    setJobWorkers(rows);
  }

  async function openWorkerProfile(worker) {
    setError("");

    if (worker?.publicStats) {
      setSelectedWorker(worker);
      return;
    }

    try {
      const result = await supabase.rpc("get_worker_public_stats", {
        p_worker_id: worker.id,
      });
      if (result.error) throw result.error;

      const row = result.data?.[0] || {};
      setSelectedWorker({
        ...worker,
        publicStats: {
          monthWorkedDays: Number(row.month_worked_days || 0),
          monthWorkedMinutes: Number(row.month_worked_minutes || 0),
          monthJobs: Number(row.month_jobs || 0),
          activeJobs: Number(row.active_jobs || 0),
          cancelledByEmployer: Number(row.cancelled_by_employer || 0),
          attendanceRate: canViewWorkerMetrics
            ? row.attendance_rate === null ||
              row.attendance_rate === undefined
              ? worker.attendanceRate ?? null
              : Number(row.attendance_rate)
            : null,
          ratingAverage: canViewWorkerMetrics
            ? row.rating_average === null ||
              row.rating_average === undefined
              ? worker.ratingAverage ?? null
              : Number(row.rating_average)
            : null,
          ratingCount: canViewWorkerMetrics
            ? Number(row.rating_count || 0)
            : null,
          noShowCount: canViewWorkerMetrics
            ? Number(row.no_show_count || worker.noShowCount || 0)
            : null,
          unexcusedEarlyLeaveCount: canViewWorkerMetrics
            ? Number(
                row.unexcused_early_leave_count ||
                  worker.unexcusedEarlyLeaveCount ||
                  0
              )
            : null,
        },
      });
    } catch (err) {
      setError(err?.message || "Nepavyko atidaryti darbuotojo profilio.");
    }
  }

  function openEmployerCheckIn(worker) {
    if (!worker?.bookingId) return;
    if (!currentJob || !jobCheckInWindowOpen(currentJob)) {
      setError("Atvykimą galima patvirtinti tik nuo darbo pradžios iki darbo pabaigos.");
      return;
    }
    setEmployerCheckInTarget(worker);
    setEmployerCheckInTime(currentVilniusTimeRounded5());
    setError("");
  }

  async function employerCheckInWorker(target, arrivalTime) {
    if (!target?.bookingId || !arrivalTime) return;

    setAttendanceSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("employer_check_in_worker_at_time", {
        p_booking_id: target.bookingId,
        p_arrival_time: arrivalTime,
      });

      if (result.error) throw result.error;

      setEmployerCheckInTarget(null);
      setEmployerCheckInTime("");
      setNotice(
        `Patvirtinote, kad ${target.name} atvyko ${arrivalTime}. Darbo dieną vis tiek reikės uždaryti pasibaigus darbo laikui.`
      );

      await Promise.all([
        loadCurrentJobWorkers(currentJob?.id),
        loadEmployerNotifications(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti darbuotojo atvykimo.");
    } finally {
      setAttendanceSaving(false);
    }
  }

  async function recordEmployerAttendance(
    target,
    outcome,
    actualEndTime = null,
    note = ""
  ) {
    if (!target?.bookingId) return;
    const job = currentJob;
    const needsRating = outcome !== "no_show";
    const score = Number(attendanceScore);
    if (needsRating && (!Number.isInteger(score) || score < 1 || score > 10)) {
      setAttendanceError("Pasirinkite darbuotojo įvertinimą nuo 1 iki 10.");
      return;
    }

    setAttendanceSaving(true);
    setAttendanceError("");
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc(needsRating ? "employer_record_and_rate_workday" : "employer_record_attendance", {
        p_booking_id: target.bookingId,
        p_outcome: outcome,
        p_actual_end_time: actualEndTime || null,
        p_note: note.trim() || null,
        ...(needsRating ? { p_score: score, p_comment: attendanceRatingComment.trim() || null } : {}),
      });

      if (result.error) throw result.error;

      const returnedAttendance = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      setNotice(
        outcome === "full_day"
          ? "Darbo diena uždaryta, darbuotojo įvertinimas išsaugotas."
          : returnedAttendance?.dispute_status === "disputed"
          ? "Sistema aptiko nesutapimą ir automatiškai sukūrė ginčą. Darbuotojo reitingas nekeičiamas iki sprendimo."
          : needsRating
          ? "Rezultatas ir įvertinimas išsaugoti. Įvertinimas bus įskaitytas, kai darbuotojas patvirtins rezultatą arba bus išspręstas ginčas."
          : "Darbo dienos rezultatas perduotas darbuotojui patvirtinti. Kol darbuotojas nepatvirtino arba ginčas neišspręstas, galutinis rezultatas nefiksuojamas."
      );

      setAttendanceTarget(null);
      setAttendanceMode(null);
      setAttendanceEndTime("");
      setAttendanceNote("");

      if (returnedAttendance) {
        setJobWorkers((workers) => workers.map((worker) =>
          worker.bookingId === target.bookingId
            ? {
                ...worker,
                attendance: returnedAttendance,
                rating: needsRating && returnedAttendance.finalized_at
                  ? { score, comment: attendanceRatingComment.trim() || null } : worker.rating,
                bookingStatus: returnedAttendance.finalized_at
                  ? returnedAttendance.final_outcome === "no_show" ? "no_show" : "completed"
                  : worker.bookingStatus,
              }
            : worker
        ));
      }

      const refreshResults = await Promise.allSettled([
        loadCurrentJobWorkers(job?.id),
        reloadJobs(company?.id),
        loadEmployerStats(company?.id),
        loadEmployerNotifications(),
      ]);
      if (refreshResults.some((result) => result.status === "rejected")) {
        setError("Darbo dienos rezultatas išsaugotas, bet nepavyko atnaujinti visų duomenų. Atnaujinkite puslapį.");
      }
    } catch (err) {
      setAttendanceError(err?.message || "Nepavyko uždaryti darbo dienos.");
    } finally {
      setAttendanceSaving(false);
    }
  }

  function openWorkerRating(target, job = currentJob) {
    const responsibleUserId = job?.responsible_user_id || job?.created_by;
    if (!target?.bookingId || !job?.id || responsibleUserId !== user.id) return;
    setRatingTarget({
      ...target,
      jobId: job.id,
      jobTitle: job.title,
      workDate: job.work_date,
      responsibleUserId,
    });
    setRatingScore(null);
    setRatingComment("");
    setRatingError("");
  }

  async function submitWorkerRating() {
    if (!ratingTarget?.bookingId) return;

    const responsibleUserId =
      ratingTarget.responsibleUserId || null;

    if (!responsibleUserId || responsibleUserId !== user.id) {
      setRatingError(
        "Darbuotoją už šį darbą gali įvertinti ir atsiliepimą palikti tik atsakingas žmogus, kuris kuravo darbą."
      );
      return;
    }

    const numericScore = Number(ratingScore);
    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 10) {
      setRatingError("Pasirinkite darbuotojo įvertinimą nuo 1 iki 10.");
      return;
    }

    setRatingSaving(true);
    setRatingError("");
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("submit_worker_rating", {
        p_booking_id: ratingTarget.bookingId,
        p_score: numericScore,
        p_comment: ratingComment.trim() || null,
      });

      if (result.error) throw result.error;

      setNotice("Darbuotojo įvertinimas išsaugotas.");
      setRatingTarget(null);
      setRatingScore(null);
      setRatingComment("");

      try {
        await loadCurrentJobWorkers(currentJob?.id);
      } catch {
        setError("Įvertinimas išsaugotas, bet nepavyko atnaujinti darbuotojų sąrašo. Atnaujinkite puslapį.");
      }
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      setRatingError(
        message.includes("duplicate")
          ? "Šis darbuotojas už šį darbą jau įvertintas."
          : message.includes("row-level security") ||
            message.includes("policy")
          ? "Šį darbuotoją gali įvertinti tik už darbą atsakingas žmogus."
          : err?.message || "Nepavyko išsaugoti įvertinimo."
      );
    } finally {
      setRatingSaving(false);
    }
  }

  async function findMatches(job) {
    const requestId = ++jobMatchesRequestRef.current;
    const confirmedCount = Number(job?.confirmedCount || 0);
    const workersNeeded = Number(job?.workers_needed || 0);
    const searchClosed =
      job?.status !== "open" ||
      (workersNeeded > 0 && confirmedCount >= workersNeeded);

    setSearching(true);
    setError("");
    setMatches([]);

    try {
      const [candidateResult, invitationsResult] = await Promise.all([
        searchClosed
          ? Promise.resolve({ data: [], error: null })
          : supabase.rpc("get_job_match_candidates_v2", {
              p_job_id: job.id,
            }),
        supabase
          .from("job_invitations")
          .select("id, worker_id, status")
          .eq("job_id", job.id),
      ]);

      if (requestId !== jobMatchesRequestRef.current) return;
      if (candidateResult.error) throw candidateResult.error;
      if (invitationsResult.error) throw invitationsResult.error;

      const candidateRows = candidateResult.data || [];
      const invitationRows = invitationsResult.data || [];
      const invitationStatusMap = Object.fromEntries(
        invitationRows.map((row) => [row.worker_id, row.status])
      );
      const invitationByWorkerMap = Object.fromEntries(
        invitationRows.map((row) => [row.worker_id, row])
      );
      const declinedWorkerIds = invitationRows
        .filter((row) => row.status === "declined")
        .map((row) => row.worker_id);
      const workerIds = [
        ...new Set([
          ...candidateRows.map((row) => row.worker_id),
          ...declinedWorkerIds,
        ]),
      ];

      setInvitedIds(invitationRows.map((row) => row.worker_id));
      setInvitationStatuses(invitationStatusMap);
      setInvitationByWorker(invitationByWorkerMap);

      if (!workerIds.length) {
        setMatches([]);
        return;
      }

      const [profilesResult, workersResult, workerSkillsResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, city, role")
            .in("role", ["worker", "admin"])
            .eq("is_active", true)
            .in("id", workerIds),
          supabase.rpc("get_employer_worker_profiles", {
            p_job_id: job.id,
            p_worker_ids: workerIds,
          }),
          supabase
            .from("worker_skills")
            .select("worker_id, skill_id")
            .in("worker_id", workerIds),
        ]);

      const failed = [profilesResult, workersResult, workerSkillsResult].find(
        (result) => result.error
      );

      if (requestId !== jobMatchesRequestRef.current) return;
      if (failed?.error) throw failed.error;

      const profileMap = new Map(
        (profilesResult.data || []).map((row) => [row.id, row])
      );
      const workerMap = new Map(
        (workersResult.data || []).map((row) => [row.user_id, row])
      );
      const candidateMap = new Map(
        candidateRows.map((row) => [row.worker_id, row])
      );

      const skillIdsByWorker = new Map();
      for (const row of workerSkillsResult.data || []) {
        const list = skillIdsByWorker.get(row.worker_id) || [];
        list.push(Number(row.skill_id));
        skillIdsByWorker.set(row.worker_id, list);
      }

      const skillNameMap = new Map(
        skills.map((skill) => [Number(skill.id), skill.name])
      );

      const combined = workerIds
        .map((workerId) => {
          const profile = profileMap.get(workerId);
          const worker = workerMap.get(workerId);
          const slot = candidateMap.get(workerId) || null;
          const declinedInvitation =
            invitationStatusMap[workerId] === "declined";

          if (!profile || !worker || (!slot && !declinedInvitation)) return null;

          const skillNames = (skillIdsByWorker.get(workerId) || [])
            .map((id) => skillNameMap.get(id))
            .filter(Boolean)
            .slice(0, 4);

          return {
            id: workerId,
            name: shortWorkerName(profile.display_name),
            initials: workerInitials(profile.display_name),
            city: profile.city,
            hasDrivingLicenseB: Boolean(worker.has_driving_license_b),
            yearsExperience: Number(worker.years_experience || 0),
            attendanceRate:
              worker.attendance_rate === null ||
              worker.attendance_rate === undefined
                ? null
                : Number(worker.attendance_rate),
            completedJobs: Number(worker.completed_jobs || 0),
            shortBio: worker.short_bio || "",
            avatarUrl: workerAvatarUrl(worker.avatar_path),
            travelRadiusKm: Number(worker.travel_radius_km || 0),
            distanceKm:
              slot?.distance_km === null || slot?.distance_km === undefined
                ? null
                : Number(slot.distance_km),
            distanceSource: slot?.distance_source || null,
            noShowCount: Number(worker.no_show_count || 0),
            lastActiveAt: worker.last_active_at,
            activityLabel: workerRecentActivityLabel(worker.last_active_at),
            ratingAverage:
              worker.rating_average === null ||
              worker.rating_average === undefined
                ? null
                : Number(worker.rating_average),
            availableFrom: slot?.available_from?.slice(0, 5) || "",
            availableTo: slot?.available_to?.slice(0, 5) || "",
            skillNames,
            declinedInvitation,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.declinedInvitation !== b.declinedInvitation) {
            return a.declinedInvitation ? -1 : 1;
          }

          const distanceA =
            a.distanceKm === null ? Number.POSITIVE_INFINITY : a.distanceKm;
          const distanceB =
            b.distanceKm === null ? Number.POSITIVE_INFINITY : b.distanceKm;

          if (distanceA !== distanceB) return distanceA - distanceB;

          const attendanceA = Number(a.attendanceRate || 0);
          const attendanceB = Number(b.attendanceRate || 0);
          if (attendanceB !== attendanceA) return attendanceB - attendanceA;

          return Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0);
        });

      setMatches(combined);
    } catch (err) {
      if (requestId === jobMatchesRequestRef.current) {
        setError(err?.message || "Nepavyko rasti darbuotojų.");
      }
    } finally {
      if (requestId === jobMatchesRequestRef.current) setSearching(false);
    }
  }

  async function saveJobAndFind() {
    setNotice("");
    setError("");
    setJobFormErrors({});

    if (!company?.id) {
      setError("Nerasta įmonė.");
      return;
    }

    if (!form.title.trim()) {
      setError("Įrašykite poreikio pavadinimą.");
      return;
    }

    if (!form.city.trim()) {
      setError("Pasirinkite miestą.");
      return;
    }

    if (!form.address.trim()) {
      const message = "Įrašykite adresą, kuriuo darbuotojas turi atvykti.";
      setJobFormErrors({ address: message });
      requestAnimationFrame(() => {
        addressInputRef.current?.focus();
        addressInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    if (!form.workDate || !form.startTime) {
      setError("Pasirinkite datą ir pradžios laiką.");
      return;
    }

    if (!form.endTime || form.endTime <= form.startTime) {
      setError("Nurodykite teisingą darbo pabaigos laiką.");
      return;
    }

    if (
      (form.breakStartTime || form.breakEndTime) &&
      (
        !form.breakStartTime ||
        !form.breakEndTime ||
        form.breakStartTime < form.startTime ||
        form.breakEndTime > form.endTime ||
        form.breakEndTime <= form.breakStartTime
      )
    ) {
      const startInvalid =
        !form.breakStartTime || form.breakStartTime < form.startTime;
      const target = startInvalid
        ? breakStartInputRef.current
        : breakEndInputRef.current;

      requestAnimationFrame(() => {
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.focus();
      });
      return;
    }

    if (!form.payAmount || Number(form.payAmount) <= 0) {
      const message = "Įveskite atlygio sumą prieš kuriant darbo pasiūlymą.";
      setJobFormErrors({ payAmount: message });
      requestAnimationFrame(() => {
        payAmountInputRef.current?.focus();
        payAmountInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    if (form.description.trim().length < 10) {
      const message =
        form.description.trim().length === 0
          ? "Įrašykite darbo aprašymą."
          : "Darbo aprašymas turi būti bent 10 simbolių.";
      setJobFormErrors({ description: message });
      requestAnimationFrame(() => {
        descriptionInputRef.current?.focus();
        descriptionInputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    if (!["hour", "day"].includes(form.payUnit)) {
      setError("Pasirinkite, ar atlygis mokamas už valandą, ar už dieną.");
      return;
    }

    if (!editingJobId && !jobScopeAcknowledged) {
      const message = "Prieš paskelbdami darbą patvirtinkite darbdavio atsakomybių ir platformos vaidmens informaciją.";
      setJobFormErrors({ scopeAcknowledgement: message });
      requestAnimationFrame(() => {
        jobScopeAckRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        jobScopeAckRef.current?.focus?.();
      });
      return;
    }

    setSaving(true);

    try {
      const canonicalCity = await canonicalCityName(form.city);
      if (!canonicalCity) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const cleanAddress = form.address.trim();
      const currentAddressHasCoordinates =
        Number.isFinite(Number(currentJob?.location_latitude)) &&
        Number.isFinite(Number(currentJob?.location_longitude));
      const addressUnchanged =
        Boolean(editingJobId) &&
        canonicalCity === String(currentJob?.city || "").trim() &&
        cleanAddress === String(currentJob?.address_text || "").trim();
      const selectedAddressMatches =
        selectedJobAddress?.label === cleanAddress &&
        Number.isFinite(Number(selectedJobAddress?.latitude)) &&
        Number.isFinite(Number(selectedJobAddress?.longitude));

      if (!selectedAddressMatches && !(addressUnchanged && currentAddressHasCoordinates)) {
        const message = "Pasirinkite tikslų adresą iš pasiūlymų sąrašo.";
        setJobFormErrors((current) => ({ ...current, address: message }));
        requestAnimationFrame(() => {
          addressInputRef.current?.focus();
          addressInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return;
      }

      const geocodeFields = selectedAddressMatches
        ? {
            location_latitude: Number(selectedJobAddress.latitude),
            location_longitude: Number(selectedJobAddress.longitude),
            location_geocoded_at: new Date().toISOString(),
          }
        : {};

      const payload = {
        city: canonicalCity,
        ...geocodeFields,
        address_text: cleanAddress,
        work_date: form.workDate,
        start_time: form.startTime,
        end_time: form.endTime || null,
        break_start_time: form.breakStartTime || null,
        break_end_time: form.breakEndTime || null,
        workers_needed: Number(form.workersNeeded) || 1,
        title: form.title.trim(),
        description: form.description.trim() || null,
        pay_amount: Number(form.payAmount),
        pay_unit: form.payUnit,
        transport_mode: form.transportMode,
        responsible_user_id:
          planSummary?.can_team_management
            ? form.responsibleUserId || user.id
            : user.id,
      };

      let job;

      if (editingJobId) {
        const updateResult = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", editingJobId)
          .select(
            "id, title, city, address_text, location_latitude, location_longitude, location_geocoded_at, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
          )
          .single();

        if (updateResult.error) throw updateResult.error;
        job = updateResult.data;


        setNotice("Poreikis atnaujintas.");
      } else {
        const insertResult = await supabase
          .from("jobs")
          .insert({
            ...payload,
            company_id: company.id,
            created_by: user.id,
            status: "open",
            platform_scope_acknowledged_at: new Date().toISOString(),
            platform_scope_version: JOB_SCOPE_ACK_VERSION,
          })
          .select(
            "id, title, city, address_text, location_latitude, location_longitude, location_geocoded_at, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id"
          )
          .single();

        if (insertResult.error) throw insertResult.error;
        job = insertResult.data;

        setNotice("Darbo pasiūlymas sukurtas. Žemiau rodomi tinkami darbuotojai.");
      }

      setForm((current) => ({ ...current, city: canonicalCity }));
      const nextCurrentJob = {
        ...job,
        confirmedCount: editingConfirmedCount || 0,
      };
      setCurrentJob(nextCurrentJob);
      setInvitedIds([]);
      setInvitationStatuses({});
      setInvitationByWorker({});
      setEditingJobId(null);
      setEditingConfirmedCount(0);
    setEditingInvitationCount(0);
      await reloadJobs(company.id);
      await loadCompanyPlan(company.id);
      await findMatches(nextCurrentJob);
      setShowJobForm(false);

    } catch (err) {
      const message = err?.message || "Nepavyko sukurti darbo pasiūlymo.";
      const unclosedMatch = message.match(
        /Pirmiausia uždarykite pasibaigusias darbo dienas \((\d+)\)/i
      );

      if (unclosedMatch) {
        setError("");
        setShowJobForm(false);
        await askConfirm({
          eyebrow: "NEUŽBAIGTI DARBAI",
          title: "Pirmiausia užbaikite pasibaigusius darbus",
          message: `Turite neuždarytų pasibaigusių darbo dienų (${unclosedMatch[1]}). Pateikite jų rezultatus, tada galėsite kurti naują darbo pasiūlymą.`,
          confirmLabel: "Supratau",
          hideCancel: true,
        });
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  function closeCurrentJob() {
    if (attendanceSaving || ratingSaving) return;
    jobOpenRequestRef.current += 1;
    jobWorkersRequestRef.current += 1;
    jobMatchesRequestRef.current += 1;
    setCurrentJob(null);
    setJobWorkers([]);
    setJobWorkersLoading(false);
    setMatches([]);
    setSearching(false);
    setInvitedIds([]);
    setInvitationStatuses({});
    setInvitationByWorker({});
    setAttendanceTarget(null);
    setAttendanceMode(null);
    setRatingTarget(null);
    setRatingScore(null);
    setRatingComment("");
    setRatingError("");
  }

  async function openExistingJob(job) {
    const requestId = ++jobOpenRequestRef.current;
    setNotice("");
    setError("");
    setWorkerSource("available");
    setEditingJobId(null);
    setEditingConfirmedCount(0);
    setEditingInvitationCount(0);
    setShowJobForm(false);
    setJobWorkers([]);
    setJobWorkersLoading(true);
    setInvitedIds([]);
    setInvitationStatuses({});
    setInvitationByWorker({});
    setCurrentJob(job);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById("employer-open-job")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    try {
      setForm((current) => ({
        ...current,
        title: job.title || "",
        city: job.city || "",
        address: job.address_text || "",
        workDate: job.work_date,
        startTime: job.start_time?.slice(0, 5) || "08:00",
        endTime: job.end_time?.slice(0, 5) || "17:00",
        breakStartTime: job.break_start_time?.slice(0, 5) || "",
        breakEndTime: job.break_end_time?.slice(0, 5) || "",
        workersNeeded: job.workers_needed || 1,
        transportMode:
          job.transport_mode === "employer_pickup"
            ? "employer_pickup"
            : "self_arrival",
        payAmount: job.pay_amount ?? "",
        payUnit: job.pay_unit === "day" ? "day" : "hour",
        description: job.description || "",
        responsibleUserId: job.responsible_user_id || job.created_by || user.id,
      }));

      await Promise.all([
        findMatches(job),
        loadCurrentJobWorkers(job.id),
      ]);
    } catch (err) {
      if (requestId === jobOpenRequestRef.current) {
        setError(err?.message || "Nepavyko atidaryti poreikio.");
      }
    } finally {
      if (requestId === jobOpenRequestRef.current) setJobWorkersLoading(false);
    }
    return requestId === jobOpenRequestRef.current;
  }

  async function openSavedWorkerTeam() {
    if (!planSummary?.can_saved_workers) {
      setNotice(
        "„Darbuotojai favoritai“ prieinami Business ir Business Pro planuose. Planus galite peržiūrėti paspaudę „Planai“."
      );
      return;
    }

    setShowSavedWorkers(true);
    setSavedWorkersLoading(true);
    setError("");

    try {
      await loadSavedWorkers(company?.id, planSummary);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti darbuotojų komandos.");
    } finally {
      setSavedWorkersLoading(false);
    }
  }

  async function saveWorkerToTeam(worker) {
    if (!company?.id || !worker?.id) return;

    if (!planSummary?.can_saved_workers) {
      setNotice(
        "„Darbuotojai favoritai“ prieinami Business ir Business Pro planuose. Planus galite peržiūrėti paspaudę „Planai“."
      );
      return;
    }

    setSavedWorkerBusy(worker.id);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("save_worker_to_company_team", {
        p_company_id: company.id,
        p_worker_id: worker.id,
      });

      if (result.error) throw result.error;

      const saved = await loadSavedWorkers(company.id, planSummary);
      if (!saved.some((item) => item.id === worker.id)) {
        setError("Darbuotojas išsaugotas, bet jo nėra gautame favoritų sąraše. Atnaujinkite puslapį.");
        return;
      }
      setNotice(`${worker.name || "Darbuotojas"} pridėtas į darbuotojų favoritus.`);
    } catch (err) {
      setError(err?.message || "Nepavyko pridėti darbuotojo į komandą.");
    } finally {
      setSavedWorkerBusy("");
    }
  }

  async function removeWorkerFromTeam(worker) {
    if (!company?.id || !worker?.id) return;

    setSavedWorkerBusy(worker.id);
    setError("");

    try {
      const result = await supabase.rpc(
        "remove_worker_from_company_team",
        {
          p_company_id: company.id,
          p_worker_id: worker.id,
        }
      );

      if (result.error) throw result.error;

      await loadSavedWorkers(company.id, planSummary);
      setNotice(`${worker.name || "Darbuotojas"} pašalintas iš darbuotojų favoritų.`);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti darbuotojo iš komandos.");
    } finally {
      setSavedWorkerBusy("");
    }
  }

  async function inviteSavedWorkerTeam() {
    if (!currentJob?.id || !planSummary?.can_saved_workers) return;

    setInvitingSavedTeam(true);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("invite_company_saved_workers", {
        p_job_id: currentJob.id,
      });

      if (result.error) throw result.error;

      const summary = result.data?.[0] || {};
      const invited = Number(summary.invited_count || 0);
      const matching = Number(summary.matching_count || 0);
      const saved = Number(summary.saved_count || 0);
      const already = Number(summary.already_invited_count || 0);

      await findMatches(currentJob);

      if (!saved) {
        setNotice("Darbuotojų favorituose dar nėra išsaugotų darbuotojų.");
      } else if (!matching) {
        setNotice(
          "Šiam darbui šiuo metu netinka nė vienas darbuotojas iš favoritų pagal vietą, laiką, prieinamumą ir kitus darbo kriterijus."
        );
      } else if (invited) {
        setNotice(
          `Kvietimai išsiųsti ${invited} tinkamiems darbuotojams iš favoritų.${
            already ? ` ${already} jau buvo pakviesti anksčiau.` : ""
          }`
        );
      } else {
        setNotice(
          "Visi šiam darbui tinkami darbuotojai iš favoritų jau buvo pakviesti."
        );
      }
    } catch (err) {
      setError(err?.message || "Nepavyko pakviesti „Mano komandos“.");
    } finally {
      setInvitingSavedTeam(false);
    }
  }

  function openUrgentSearch() {
    const canUseUrgent = Boolean(planSummary?.can_team_management);

    if (!canUseUrgent) {
      setNotice(
        "„Skubiai!“ kontaktų paieška prieinama tik Business Pro plane. Planus galite peržiūrėti paspaudę „Planai“."
      );
      return;
    }

    setUrgentSearchCompleted(false);
    setUrgentSearchError("");
    setUrgentSearchCity(company?.city || "");
    setUrgentSearchResults([]);
    setUrgentSearchPage(1);
    setShowUrgentSearch(true);
    setError("");
  }

  async function searchUrgentWorkers() {
    if (!company?.id) return;

    setUrgentSearchError("");
    setUrgentSearchCompleted(false);
    setUrgentSearchResults([]);
    const city = urgentSearchCity.trim();
    if (!city) {
      setUrgentSearchError("Nurodykite miestą.");
      return;
    }

    setUrgentSearchLoading(true);
    setError("");

    try {
      const canonicalCity = await canonicalCityName(city);
      if (!canonicalCity) throw new Error("Pasirinkite miestą iš sąrašo.");

      const result = await supabase.rpc("get_urgent_workers", {
        p_company_id: company.id,
        p_city: canonicalCity,
      });

      if (result.error) throw result.error;

      setUrgentSearchCompleted(true);
      setUrgentSearchCity(canonicalCity);
      setUrgentSearchPage(1);
      setUrgentSearchResults(
        (result.data || []).map((row) => ({
          ...row,
          avatarUrl: workerAvatarUrl(row.avatar_path),
        }))
      );
    } catch (err) {
      setUrgentSearchError(err?.message || "Nepavyko rasti skubiai laisvų darbuotojų.");
    } finally {
      setUrgentSearchLoading(false);
    }
  }

  async function copyUrgentPhone(phone) {
    if (!phone) return;

    try {
      await navigator.clipboard.writeText(phone);
      setUrgentPhoneCopied(phone);
      window.setTimeout(() => setUrgentPhoneCopied(""), 1600);
    } catch {
      setError("Nepavyko nukopijuoti telefono numerio.");
    }
  }

  async function openNewJobForm(options = {}) {
    if (
      planSummary &&
      !planSummary.unlimited_jobs &&
      Number(planSummary.jobs_remaining ?? 0) <= 0
    ) {
      setError(
        planSummary.plan_key === "business"
          ? "Business plano 25 darbo pasiūlymų limitas šį mėnesį išnaudotas. Business Pro plane darbų skaičius neribojamas. Planus galite peržiūrėti paspaudę „Planai“."
          : "Basic plano 5 darbo pasiūlymų limitas šį mėnesį išnaudotas. Planus galite peržiūrėti paspaudę „Planai“."
      );
      return;
    }

    if (company?.id) {
      const unclosedResult = await supabase.rpc(
        "get_employer_unclosed_workdays",
        { p_company_id: company.id }
      );

      if (unclosedResult.error) {
        setError(
          unclosedResult.error.message ||
            "Nepavyko patikrinti neuždarytų darbo dienų."
        );
        return;
      }

      const unclosedCount = (unclosedResult.data || []).length;

      if (unclosedCount > 0) {
        setError("");
        await askConfirm({
          eyebrow: "NEUŽBAIGTI DARBAI",
          title: "Pirmiausia užbaikite pasibaigusius darbus",
          message: `Turite neuždarytų pasibaigusių darbo dienų (${unclosedCount}). Pateikite jų rezultatus, tada galėsite kurti naują darbo pasiūlymą.`,
          confirmLabel: "Supratau",
          hideCancel: true,
        });
        return;
      }
    }

    setEditingJobId(null);
    setEditingConfirmedCount(0);
    setEditingInvitationCount(0);
    setJobFormErrors({});
    setSelectedJobAddress(null);
    setJobScopeAcknowledged(false);
    setNotice("");
    setError("");
    setForm({
      title: "Statybų pagalbiniai",
      city: company?.city || "Vilnius",
      address: "",
      workDate: employerTomorrowISO(),
      startTime: "08:00",
      endTime: "17:00",
      breakStartTime: "12:00",
      breakEndTime: "12:30",
      workersNeeded: 1,
      transportMode: "self_arrival",
      payAmount: "",
      payUnit: "hour",
      description: "",
      responsibleUserId: user.id,
    });
    const copy = options?.sourceJob;
    const chosenDate = /^\d{4}-\d{2}-\d{2}$/.test(String(options?.date || "")) ? options.date : employerTomorrowISO();
    if (copy) {
      setForm(previous => ({...previous,title:copy.title || previous.title,city:copy.city || previous.city,address:copy.address_text || "",workDate:chosenDate,startTime:String(copy.start_time || "08:00").slice(0,5),endTime:String(copy.end_time || "17:00").slice(0,5),breakStartTime:String(copy.break_start_time || "").slice(0,5),breakEndTime:String(copy.break_end_time || "").slice(0,5),workersNeeded:Math.max(1,Number(copy.workers_needed)||1),transportMode:copy.transport_mode || "self_arrival",payAmount:copy.pay_amount ?? "",payUnit:copy.pay_unit || "hour",description:copy.description || "",responsibleUserId:user.id}));
      if(copy.address_text && copy.location_latitude != null && copy.location_longitude != null) setSelectedJobAddress({label:copy.address_text,latitude:copy.location_latitude,longitude:copy.location_longitude});
      setNotice("Darbo sąlygos nukopijuotos. Patikrinkite naują datą ir išsaugokite. Darbuotojus reikės pakviesti iš naujo.");
    } else if(options?.date) setForm(previous => ({...previous,workDate:chosenDate}));
    setShowJobForm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("employer-job-form")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  async function startEditJob(job) {
    if (!(await openExistingJob(job))) return;

    const invitationsResult = await supabase
      .from("job_invitations")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id);

    if (invitationsResult.error) {
      setError(
        invitationsResult.error.message ||
          "Nepavyko patikrinti, ar darbuotojai jau buvo pakviesti."
      );
      return;
    }

    const invitationCount = Number(invitationsResult.count || 0);
    const confirmedCount = Number(job.confirmedCount || 0);

    setShowJobForm(true);
    setEditingJobId(job.id);
    setEditingConfirmedCount(confirmedCount);
    setEditingInvitationCount(invitationCount);
    setSelectedJobAddress(
      Number.isFinite(Number(job.location_latitude)) && Number.isFinite(Number(job.location_longitude))
        ? {
            label: String(job.address_text || "").trim(),
            latitude: Number(job.location_latitude),
            longitude: Number(job.location_longitude),
          }
        : null
    );
    setNotice(
      confirmedCount > 0
        ? "Poreikis jau turi patvirtintų darbuotojų. Esminės sąlygos užrakintos."
        : invitationCount > 0
        ? "Darbuotojai jau buvo pakviesti, todėl data, darbo laikas, miestas ir atlygis nebekeičiami."
        : "Darbuotojai dar nepakviesti – galite redaguoti visas darbo sąlygas."
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("employer-job-form")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  async function requestRemoveOrCancelJob(job) {
    setError("");
    setNotice("");

    const visibleConfirmedCount = Number(job.confirmedCount || 0);

    // Jei darbdavys jau mato "Atšaukti", modalą rodome IŠKART.
    // Galutinio atšaukimo metu DB vis tiek dar kartą patikrinama.
    if (visibleConfirmedCount > 0) {
      setCancelReason("");
      setCancelJobTarget({
        ...job,
        confirmedCount: visibleConfirmedCount,
      });

      // Fone tik patiksliname skaičių. Tai neblokuoja modalo atsidarymo.
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "confirmed")
        .then(({ count, error: countError }) => {
          if (!countError && Number(count || 0) > 0) {
            setCancelJobTarget((current) =>
              current?.id === job.id
                ? { ...current, confirmedCount: Number(count || 0) }
                : current
            );
          }
        });

      return;
    }

    try {
      const countResult = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "confirmed");

      if (countResult.error) throw countResult.error;

      const confirmedCount = Number(countResult.count || 0);

      if (confirmedCount > 0) {
        setCancelReason("");
        setCancelJobTarget({
          ...job,
          confirmedCount,
        });
        return;
      }

      const shouldDelete = await askConfirm({
        eyebrow: "DARBO ŠALINIMAS",
        title: "Ištrinti darbo pasiūlymą?",
        message: "Šis poreikis neturi patvirtintų darbuotojų. Ištrynus jo atkurti nebebus galima.",
        confirmLabel: "Ištrinti",
        danger: true,
      });

      if (!shouldDelete) return;

      const result = await supabase.from("jobs").delete().eq("id", job.id);
      if (result.error) throw result.error;

      setNotice("Poreikis ištrintas.");

      if (currentJob?.id === job.id) {
        ++jobOpenRequestRef.current;
        ++jobWorkersRequestRef.current;
        ++jobMatchesRequestRef.current;
        setJobWorkers([]);
        setJobWorkersLoading(false);
        setSearching(false);
        setMatches([]);
        setCurrentJob(null);
        setMatches([]);
      }

      if (editingJobId === job.id) {
        setEditingJobId(null);
        setEditingConfirmedCount(0);
    setEditingInvitationCount(0);
      }

      await reloadJobs(company.id);
    } catch (err) {
      setError(err?.message || "Nepavyko pašalinti poreikio.");
    }
  }

  async function confirmEmployerCancellation() {
    if (!cancelJobTarget) return;

    const reason = cancelReason.trim();

    if (reason.length < 5) {
      setError("Įrašykite aiškią atšaukimo priežastį.");
      return;
    }

    setCancellingJob(true);
    setError("");
    setNotice("");

    try {
      const cancelResult = await supabase.rpc("cancel_job_by_employer", {
        p_job_id: cancelJobTarget.id,
        p_reason: reason,
      });

      if (cancelResult.error) throw cancelResult.error;

      const cancelled = cancelResult.data?.[0] || null;
      const confirmedCount = Number(
        cancelled?.confirmed_workers ?? cancelJobTarget.confirmedCount ?? 0
      );
      const reliabilityChange = Number(cancelled?.reliability_change ?? -7);
      const newReliability = Number(cancelled?.new_reliability ?? 100);
      const cancelledAt = cancelled?.cancelled_at || new Date().toISOString();
      const savedReason = cancelled?.cancellation_reason || reason;

      setNotice(
        `Darbas atšauktas. ${confirmedCount === 1 ? "Darbuotojas matys" : "Darbuotojai matys"} atšaukimo priežastį. Patikimumas ${reliabilityChange < 0 ? `sumažėjo ${Math.abs(reliabilityChange)} taškų` : "nepasikeitė"} · dabar ${formatReliabilityScore(newReliability)} / 100.`
      );

      if (currentJob?.id === cancelJobTarget.id) {
        setCurrentJob((existing) =>
          existing
            ? {
                ...existing,
                status: "cancelled",
                cancellation_reason: savedReason,
                cancelled_at: cancelledAt,
                confirmedCount: 0,
              }
            : existing
        );
        setMatches([]);
      }

      if (editingJobId === cancelJobTarget.id) {
        setEditingJobId(null);
        setEditingConfirmedCount(0);
    setEditingInvitationCount(0);
      }

      setCancelJobTarget(null);
      setCancelReason("");

      await Promise.all([
        reloadJobs(company.id),
        loadEmployerStats(company.id, companyMemberRole),
        loadEmployerNotifications(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko atšaukti poreikio.");
    } finally {
      setCancellingJob(false);
    }
  }


  async function inviteWorker(workerId) {
    if (!currentJob?.id) return;

    setError("");
    setNotice("");

    try {
      if (jobHasStarted(currentJob)) {
        throw new Error("Šis darbas jau prasidėjo. Naujo kvietimo siųsti nebegalima.");
      }

      if (
        currentJob.status !== "open" ||
        Number(currentJob.confirmedCount || 0) >= Number(currentJob.workers_needed || 0)
      ) {
        throw new Error("Šis poreikis jau užpildytas arba uždarytas.");
      }

      const result = await supabase
        .from("job_invitations")
        .insert({
          job_id: currentJob.id,
          worker_id: workerId,
          status: "pending",
        })
        .select("id, worker_id, status")
        .single();

      if (result.error) throw result.error;

      setInvitedIds((current) => [...current, workerId]);
      setInvitationStatuses((current) => ({
        ...current,
        [workerId]: "pending",
      }));
      setInvitationByWorker((current) => ({
        ...current,
        [workerId]: result.data,
      }));
      setNotice("Kvietimas darbuotojui išsiųstas.");
    } catch (err) {
      if (String(err?.message || "").toLowerCase().includes("duplicate")) {
        const existingResult = await supabase
          .from("job_invitations")
          .select("id, worker_id, status")
          .eq("job_id", currentJob.id)
          .eq("worker_id", workerId)
          .maybeSingle();

        const existing = existingResult.data || null;

        if (existing?.status === "declined") {
          setMatches((current) =>
            current.filter((worker) => worker.id !== workerId)
          );
          setInvitationStatuses((current) => ({
            ...current,
            [workerId]: "declined",
          }));
          setInvitationByWorker((current) => ({
            ...current,
            [workerId]: existing,
          }));
          setNotice(
            "Šis darbuotojas jau atmetė šį darbą, todėl pakartotinai jam jo neberodome."
          );
        } else {
          setInvitedIds((current) => [...new Set([...current, workerId])]);
          setNotice("Šis darbuotojas jau buvo pakviestas į šį darbą.");
        }
      } else {
        const message = String(err?.message || "");
        if (
          message
            .toLowerCase()
            .includes("darbuotojas šį darbą atmetė")
        ) {
          setMatches((current) =>
            current.filter((worker) => worker.id !== workerId)
          );
          setNotice(
            "Šis darbuotojas šį darbą atmetė, todėl pakartotinai jo kviesti negalima."
          );
        } else {
          setError(message || "Nepavyko išsiųsti kvietimo.");
        }
      }
    }
  }

  const canSeeAllCompanyJobs =
    Boolean(planSummary?.can_team_management) &&
    ["owner", "manager"].includes(companyMemberRole);

  const currentJobResponsibleUserId =
    currentJob?.responsible_user_id || currentJob?.created_by || null;

  const currentJobWorkerSearchOpen = Boolean(
    currentJob?.id &&
      currentJob.status === "open" &&
      !jobHasStarted(currentJob) &&
      Number(currentJob.confirmedCount || 0) <
        Number(currentJob.workers_needed || 0)
  );

  const canViewWorkerMetrics = Boolean(
    planSummary?.can_advanced_analytics
  );

  const canRateCurrentJob =
    Boolean(currentJobResponsibleUserId) &&
    currentJobResponsibleUserId === user.id;

  const savedWorkerIdSet = new Set(
    savedWorkers.map((worker) => worker.id)
  );

  const baseCandidateWorkers = matches.filter(
    (worker) => !jobWorkers.some((item) => item.id === worker.id)
  );

  const declinedCandidateWorkers = baseCandidateWorkers.filter(
    (worker) => worker.declinedInvitation
  );
  const searchableCandidateWorkers = baseCandidateWorkers.filter(
    (worker) => !worker.declinedInvitation
  );

  const visibleCandidateWorkers =
    workerSource === "team"
      ? searchableCandidateWorkers.filter((worker) =>
          savedWorkerIdSet.has(worker.id)
        )
      : searchableCandidateWorkers;

  const matchingSavedWorkersCount = searchableCandidateWorkers.filter((worker) =>
    savedWorkerIdSet.has(worker.id)
  ).length;

  const pagedAcceptedWorkers = jobWorkers.slice(
    (acceptedWorkersPage - 1) * DASHBOARD_PAGE_SIZE,
    acceptedWorkersPage * DASHBOARD_PAGE_SIZE
  );
  const pagedDeclinedWorkers = declinedCandidateWorkers.slice(
    (declinedWorkersPage - 1) * DASHBOARD_PAGE_SIZE,
    declinedWorkersPage * DASHBOARD_PAGE_SIZE
  );

  useEffect(() => {
    setAcceptedWorkersPage(1);
    setDeclinedWorkersPage(1);
  }, [currentJob?.id]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(jobWorkers.length / DASHBOARD_PAGE_SIZE));
    if (acceptedWorkersPage > totalPages) setAcceptedWorkersPage(totalPages);
  }, [jobWorkers.length, acceptedWorkersPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(declinedCandidateWorkers.length / DASHBOARD_PAGE_SIZE));
    if (declinedWorkersPage > totalPages) setDeclinedWorkersPage(totalPages);
  }, [declinedCandidateWorkers.length, declinedWorkersPage]);

  useEffect(() => {
    if (!currentJob?.id || currentJobWorkerSearchOpen) return;
    setSearching(false);
    setWorkerSource("available");
  }, [currentJob?.id, currentJobWorkerSearchOpen]);

  useEffect(() => {
    if (
      !currentJob?.id ||
      currentJob.status !== "open" ||
      Number(currentJob.confirmedCount || 0) > 0
    ) {
      return;
    }

    const start = jobStartMoment(currentJob);
    if (!start || Number.isNaN(start.getTime())) return;

    const closeExpiredEmptyJob = () => {
      setCurrentJob((existing) =>
        existing?.id === currentJob.id ? null : existing
      );
      setMatches([]);
      setInvitedIds([]);
      setInvitationStatuses({});
      setInvitationByWorker({});
      if (company?.id) reloadJobs(company.id);
    };

    const delay = start.getTime() - Date.now();
    if (delay <= 0) {
      closeExpiredEmptyJob();
      return;
    }

    const timer = window.setTimeout(closeExpiredEmptyJob, delay + 250);
    return () => window.clearTimeout(timer);
  }, [
    currentJob?.id,
    currentJob?.status,
    currentJob?.confirmedCount,
    currentJob?.work_date,
    currentJob?.start_time,
    company?.id,
  ]);

  const myEmployerJobs = jobs.filter((job) => {
    const responsibleUserId = job.responsible_user_id || null;

    // „Mano darbai“ reiškia darbus, už kuriuos šiuo metu atsakingas
    // prisijungęs įmonės naudotojas. Tik seniems darbams, kuriuose dar nėra
    // responsible_user_id, paliekamas created_by fallback.
    if (responsibleUserId) return responsibleUserId === user.id;
    return job.created_by === user.id;
  });

  const visibleJobs =
    jobScope === "all" && canSeeAllCompanyJobs ? jobs : myEmployerJobs;

  const activeVisibleJobs = visibleJobs.filter((job) => {
    if (["completed", "cancelled"].includes(job.status)) return false;

    const startedEmptyJob =
      ["draft", "open"].includes(job.status) &&
      Number(job.confirmedCount || 0) === 0 &&
      jobHasStarted(job);

    return !startedEmptyJob;
  });

  const employerJobHistory = visibleJobs.filter((job) =>
    ["completed", "cancelled"].includes(job.status)
  );

  const pagedActiveVisibleJobs = activeVisibleJobs.slice(
    (employerActivePage - 1) * DASHBOARD_PAGE_SIZE,
    employerActivePage * DASHBOARD_PAGE_SIZE
  );
  const employerActiveMobileTotal = activeVisibleJobs.length;
  const safeEmployerActiveMobileIndex = employerActiveMobileTotal
    ? Math.min(employerActiveMobileIndex, employerActiveMobileTotal - 1)
    : 0;
  const employerActiveMobileJob = employerActiveMobileTotal
    ? activeVisibleJobs[safeEmployerActiveMobileIndex]
    : null;
  const activeJobsForRender = isEmployerPhoneLayout
    ? employerActiveMobileJob
      ? [employerActiveMobileJob]
      : []
    : pagedActiveVisibleJobs;

  const pagedEmployerJobHistory = employerJobHistory.slice(
    (employerHistoryPage - 1) * DASHBOARD_PAGE_SIZE,
    employerHistoryPage * DASHBOARD_PAGE_SIZE
  );
  const employerHistoryMobileTotal = employerJobHistory.length;
  const safeEmployerHistoryMobileIndex = employerHistoryMobileTotal
    ? Math.min(employerHistoryMobileIndex, employerHistoryMobileTotal - 1)
    : 0;
  const employerHistoryMobileJob = employerHistoryMobileTotal
    ? employerJobHistory[safeEmployerHistoryMobileIndex]
    : null;
  const employerHistoryForRender = isEmployerPhoneLayout
    ? employerHistoryMobileJob
      ? [employerHistoryMobileJob]
      : []
    : pagedEmployerJobHistory;

  useEffect(() => {
    setEmployerActivePage(1);
    setEmployerHistoryPage(1);
    setEmployerActiveMobileIndex(0);
    setEmployerHistoryMobileIndex(0);
  }, [jobScope]);

  useEffect(() => {
    setEmployerActiveMobileIndex((current) =>
      activeVisibleJobs.length
        ? Math.min(Math.max(0, current), activeVisibleJobs.length - 1)
        : 0
    );
  }, [activeVisibleJobs.length]);

  useEffect(() => {
    setEmployerHistoryMobileIndex((current) =>
      employerJobHistory.length
        ? Math.min(Math.max(0, current), employerJobHistory.length - 1)
        : 0
    );
  }, [employerJobHistory.length]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(activeVisibleJobs.length / DASHBOARD_PAGE_SIZE));
    if (employerActivePage > totalPages) setEmployerActivePage(totalPages);
  }, [activeVisibleJobs.length, employerActivePage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(employerJobHistory.length / DASHBOARD_PAGE_SIZE));
    if (employerHistoryPage > totalPages) setEmployerHistoryPage(totalPages);
  }, [employerJobHistory.length, employerHistoryPage]);

  const employerDashboardToday = localDateISO(new Date());

  function employerJobDashboardState(job) {
    const confirmed = Number(job.confirmedCount || 0);
    const needed = Number(job.workers_needed || 0);
    const missing = Math.max(0, needed - confirmed);
    const ended = jobHasEnded(job);
    const isToday = job.work_date === employerDashboardToday;
    const startMoment =
      job.work_date && job.start_time
        ? jobStartMoment(job)
        : null;
    const started =
      Boolean(startMoment) &&
      !Number.isNaN(startMoment?.getTime()) &&
      new Date() >= startMoment;

    if (job.status === "cancelled") {
      const penalty = employerPenaltyByJob[job.id];
      const penaltyPoints = Math.abs(Number(penalty?.change || 0));

      return {
        key: "cancelled",
        tone: "danger",
        label: "Atšaukta",
        detail:
          penaltyPoints > 0
            ? `Patikimumas sumažėjo ${penaltyPoints} taškų`
            : "",
        missing,
      };
    }

    if (job.status === "completed") {
      const historicallyAccepted = Number(job.historicalAcceptedCount || 0);
      const hadFullTeam = needed > 0 && historicallyAccepted >= needed;

      return {
        key: "completed",
        tone: "ok",
        label: "Įvykdyta",
        detail: hadFullTeam ? "Darbo ciklas užbaigtas" : "Trūko darbuotojų",
        missing: Math.max(0, needed - historicallyAccepted),
      };
    }

    if (ended && confirmed > 0) {
      const unclosed = Number(job.unclosedAttendanceCount ?? confirmed);
      if (unclosed === 0 && Number(job.disputedAttendanceCount || 0) > 0) {
        return {
          key: "disputed",
          tone: "action",
          label: "Ginčas nagrinėjamas",
          detail: "Laukiama administratoriaus sprendimo",
          missing,
        };
      }
      if (unclosed === 0 && Number(job.pendingAttendanceCount || 0) > 0) {
        return {
          key: "pending",
          tone: "action",
          label: "Laukiama darbuotojo atsakymo",
          detail: "Darbo dienos rezultatas jau pateiktas",
          missing,
        };
      }
      return {
        key: "action",
        tone: "danger",
        label: "Reikia veiksmo",
        detail: "Uždarykite pasibaigusią darbo dieną",
        missing,
      };
    }

    if (isToday && started) {
      return {
        key: "today",
        tone: "live",
        label: "Vyksta šiandien",
        detail:
          missing > 0
            ? `Dar trūksta ${missing} ${missing === 1 ? "žmogaus" : "žmonių"}`
            : "Komanda suformuota",
        missing,
      };
    }

    if (missing > 0) {
      return {
        key: "hiring",
        tone: "action",
        label:
          missing === 1
            ? "Trūksta 1 darbuotojo"
            : `Trūksta ${missing} darbuotojų`,
        detail: "",
        missing,
      };
    }

    return {
      key: "ready",
      tone: "ok",
      label: isToday ? "Paruošta šiandienai" : "Komanda suformuota",
      detail: `${confirmed}/${needed} darbuotojai patvirtinti`,
      missing: 0,
    };
  }

  const dashboardActionJobs = activeVisibleJobs.filter(
    (job) => employerJobDashboardState(job).key === "action"
  ).length;

  const dashboardMissingWorkers = activeVisibleJobs.reduce(
    (sum, job) => sum + employerJobDashboardState(job).missing,
    0
  );

  const dashboardTodayJobs = activeVisibleJobs.filter(
    (job) =>
      job.work_date === employerDashboardToday &&
      !["cancelled", "completed"].includes(job.status)
  ).length;

  const dashboardUnreadMessages = employerNotifications.filter(
    (item) =>
      item.event_type === "message" &&
      activeVisibleJobs.some((job) => job.id === item.job_id)
  ).length;

  const activeTeamMembers = teamMembers.filter((member) => member.is_active);
  const pendingTeamInvites = teamInvites.filter(
    (invite) =>
      invite.status === "pending" &&
      new Date(invite.expires_at) > new Date()
  );
  const usedTeamSeats =
    activeTeamMembers.length + pendingTeamInvites.length;

  const currentTeamMember = activeTeamMembers.find(
    (member) => member.user_id === user.id
  );

  useEffect(() => {
    try { window.sessionStorage.setItem("s24-employer-view", employerView); } catch {}
  }, [employerView]);
  useEffect(() => {
    if (showJobForm) setEmployerView("new");
    else setEmployerView((current) => (current === "new" ? (currentJob ? "active" : "overview") : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showJobForm]);
  useEffect(() => {
    if (showCompanyEditor) setEmployerView("company");
    else setEmployerView((current) => (current === "company" ? "overview" : current));
  }, [showCompanyEditor]);
  useEffect(() => {
    if (currentJob?.id && !showJobForm) setEmployerView("job");
    else setEmployerView((current) => (current === "job" ? "active" : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob?.id]);

  const employerLongTermUnread = Object.values(longTermUnreadByOffer).reduce((sum, value) => sum + Number(value || 0), 0);
  const employerShellView = calendarVisible ? "calendar" : employerView === "job" ? "active" : employerView;

  const currentCompanyAvatarUrl = companyAvatarMarkedForRemoval
    ? ""
    : companyAvatarPreview || companyAvatarUrl(companyForm.avatarPath);

  if (loading) {
    return <SilentLoader fullscreen size={28} />;
  }

  const employerPlanLocked = (flag, label) => (planSummary?.[flag] ? 0 : label);
  return (
    <P24Shell
      current={employerShellView}
      onGo={goEmployerView}
      cta={{ label: "Naujas darbo pasiūlymas", onClick: () => goEmployerView("new") }}
      groups={[
        ["Darbai", [
          { key: "overview", label: "Apžvalga", icon: "overview" },
          { key: "active", label: "Aktyvūs darbai", icon: "jobs", badge: activeVisibleJobs.length },
          { key: "ended", label: "Pasibaigę darbai", icon: "history" },
          ...(calendarPreviewEnabled ? [{ key: "calendar", label: "Darbų kalendorius", icon: "cal", badge: calendarAllowed ? 0 : "Pro" }] : []),
        ]],
        ["Darbuotojai", [
          { key: "favorites", label: "Mėgstami darbuotojai", icon: "heart", badge: planSummary?.can_saved_workers ? savedWorkers.length : "Business" },
          { key: "urgent", label: "Skubiai!", icon: "bolt", badge: employerPlanLocked("can_team_management", "Pro") },
          ...(companyMemberRole === "owner" ? [{ key: "longterm", label: "Įdarbinti darbuotoją", icon: "briefcase", badge: employerLongTermUnread }] : []),
        ]],
        ["Įmonė", [
          { key: "teamchat", label: "Vadovų pokalbis", icon: "chat", badge: planSummary?.can_team_chat ? teamChatUnread : "Pro" },
          { key: "team", label: "Komanda", icon: "team", badge: employerPlanLocked("can_team_management", "Pro") },
          ...(planSummary ? [{ key: "plans", label: "Planai", icon: "card", badge: planSummary.plan_name || 0 }] : []),
          ...(company ? [{ key: "company", label: "Įmonės profilis", icon: "home" }] : []),
        ]],
      ]}
      tabs={[
        { key: "overview", label: "Apžvalga", icon: "overview" },
        { key: "active", label: "Darbai", icon: "jobs", badge: activeVisibleJobs.length },
        { key: "new", label: "Naujas darbo pasiūlymas", icon: "plus", plus: true },
        { key: "ended", label: "Istorija", icon: "history" },
      ]}
      who={{ name: company?.name || "Įmonė", sub: planSummary?.plan_name || "Darbdavys", company: true, initials: String(company?.name || "Į").replace(/^(UAB|MB|IĮ|AB)\s+/i, "").slice(0, 2).toUpperCase(), avatar: currentCompanyAvatarUrl, current: employerView === "company", onClick: () => company && goEmployerView("company"), onLogout }}
      roleBar={onAdminReturn ? (
        <div className="rolebar adm"><span>Administratorius peržiūri darbdavio paskyrą</span><button type="button" onClick={onAdminReturn}>Grįžti į administravimą</button></div>
      ) : null}
      utility={!onAdminReturn ? <AdminPrivateInboxButton user={user} /> : null}
    >
    <div className="ed-page">
      {!onAdminReturn && <MainSiteInPageAlerts user={user} kind="employer" />}
      <style>{`
        .ed-page{min-height:0;background:transparent;color:#222631}.ed-shell[data-view="overview"] [data-wv]:not([data-wv~="overview"]){display:none!important}.ed-shell[data-view="active"] [data-wv]:not([data-wv~="active"]){display:none!important}.ed-shell[data-view="ended"] [data-wv]:not([data-wv~="ended"]){display:none!important}.ed-shell[data-view="new"] [data-wv]:not([data-wv~="new"]){display:none!important}.ed-shell[data-view="company"] [data-wv]:not([data-wv~="company"]){display:none!important}.ed-shell[data-view="job"] [data-wv]:not([data-wv~="job"]){display:none!important}
        .ed-topbar{height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:30}
        .ed-topbar-inner{width:min(1180px,calc(100% - 40px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
        .ed-company{display:flex;align-items:center;gap:12px}.ed-company-icon{width:42px;height:42px;border-radius:11px;background:#222631;color:#fff;display:grid;place-items:center;font-weight:800}
        .ed-company b{display:block}.ed-company span{font-size:13px;color:#6c7a88}
        .ed-shell{width:min(1240px,100%);margin:8px auto 0;display:grid;gap:20px;padding-bottom:40px}
        @media(max-width:899px){.ed-shell{width:calc(100% - 32px)!important;margin-top:16px}}
        .ed-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.ed-heading h1{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:34px;letter-spacing:-.035em}.ed-heading p{margin:8px 0 0;color:#6c7a88;max-width:720px}
        .ed-heading-actions{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:8px;min-width:300px}
        .ed-heading-actions>button{width:100%}
        .ed-heading-primary-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ed-heading-primary-row>button{width:100%}
        .ed-urgent-btn{border:0;border-radius:10px;background:#222631;color:#fff;padding:12px 16px;font:inherit;font-weight:900;cursor:pointer;white-space:nowrap}
        .ed-urgent-btn:hover{background:#2b303f}
        .ed-urgent-overlay{position:fixed;inset:0;z-index:9450;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-urgent-modal{width:min(760px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 30px 100px rgba(34,38,49,.3)}
        .ed-attendance-overlay{position:fixed;inset:0;z-index:9600;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-attendance-modal{width:min(560px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 30px 100px rgba(34,38,49,.32);color:#222631}
        .ed-attendance-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
        .ed-attendance-head h2{margin:4px 0 0;font-family:Manrope,Inter,sans-serif;font-size:24px;line-height:1.2}
        .ed-attendance-close{border:0;background:#f1f4f6;color:#222631;border-radius:10px;width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;cursor:pointer}
        .ed-attendance-close:disabled{opacity:.55;cursor:not-allowed}
        .ed-attendance-person{background:#f6f8fa;border:1px solid #e4ebf0;border-radius:12px;padding:14px;margin-bottom:16px}
        .ed-attendance-person b{display:block;font-size:15px}
        .ed-attendance-person span{display:block;color:#6c7a88;margin-top:4px;font-size:13px}
        .ed-attendance-choice{display:grid;gap:10px}
        .ed-attendance-choice>button{width:100%;min-height:48px}
        .ed-rating-overlay{position:fixed;inset:0;z-index:9700;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-rating-modal{width:min(620px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 30px 100px rgba(34,38,49,.32);color:#222631}
        .ed-rating-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
        .ed-rating-head h2{margin:4px 0 0;font-family:Manrope,Inter,sans-serif;font-size:24px;line-height:1.2}
        .ed-rating-close{border:0;background:#f1f4f6;color:#222631;border-radius:10px;width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;cursor:pointer}
        .ed-rating-close:disabled{opacity:.55;cursor:not-allowed}
        .ed-rating-scores{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px;margin-bottom:16px}
        .ed-rating-scores>button{min-width:0;padding:10px 0}
        .ed-rating-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
        .ed-urgent-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:12px}.ed-urgent-head h2{margin:3px 0 0;font-family:Manrope,Inter,sans-serif;font-size:25px}.ed-urgent-head p{margin:0;color:#6c7a88;line-height:1.5}
        .ed-urgent-filter{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:end;margin-bottom:16px}.ed-urgent-filter .ed-label{margin:0}
        .ed-urgent-note{border:1px solid #c5bddb;background:#fffaf5;border-radius:11px;padding:11px 12px;color:#6c7a88;font-size:12px;line-height:1.45;margin-bottom:14px}
        .ed-urgent-results{display:grid;gap:9px}.ed-urgent-row{border:1px solid #e4ebf0;border-radius:12px;padding:13px;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center}
        .ed-urgent-results-nav{display:grid;grid-template-columns:42px minmax(0,1fr) 42px;align-items:center;gap:10px;margin:12px auto 0;width:min(100%,240px)}
        .ed-urgent-results-nav>span{text-align:center;color:#6c7a88;font-size:12px;font-weight:850}
        .ed-urgent-results-nav>button{width:42px;height:42px;padding:0;border:1px solid #d7e1e8;border-radius:50%;background:#fff;color:#405264;font:inherit;font-size:23px;font-weight:850;line-height:1;cursor:pointer;box-shadow:0 3px 10px rgba(34,38,49,.05)}
        .ed-urgent-results-nav>button:hover{background:#f7f9fb;border-color:#c7d5de}
        .ed-urgent-worker{display:flex;align-items:center;gap:11px}.ed-urgent-avatar{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#eef2f5;display:grid;place-items:center;font-weight:800;flex:0 0 44px}.ed-urgent-avatar img{width:100%;height:100%;object-fit:cover}.ed-urgent-worker b{display:block}.ed-urgent-worker span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-urgent-contact{text-align:right}.ed-urgent-contact b{display:block;font-size:15px;margin-bottom:6px}.ed-urgent-empty{text-align:center;color:#6c7a88;padding:28px 10px}
        .ed-worker-source{display:flex;align-items:center;gap:5px;margin-top:12px;padding:4px;background:#f1f4f6;border-radius:10px;width:max-content;max-width:100%}
        .ed-worker-source button{border:0;background:transparent;color:#526374;border-radius:8px;padding:8px 11px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ed-worker-source button.active{background:#fff;color:#222631;box-shadow:0 1px 5px rgba(34,38,49,.10)}
        .ed-worker-source button.locked{color:#9a6a3d}
        .ed-saved-overlay{position:fixed;inset:0;z-index:9440;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-saved-modal{width:min(850px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 30px 100px rgba(34,38,49,.3)}
        .ed-job-info-modal{border-radius:22px!important;overflow:hidden!important;background:#fff;isolation:isolate}
        .ed-job-info-scroll{border-radius:inherit;scrollbar-width:thin;scrollbar-color:#98a5ae transparent;scrollbar-gutter:stable}.ed-job-info-scroll::-webkit-scrollbar{width:8px}.ed-job-info-scroll::-webkit-scrollbar-track{background:transparent}.ed-job-info-scroll::-webkit-scrollbar-thumb{background:#98a5ae;border-radius:999px;border:2px solid #fff}
        .ed-saved-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}
        .ed-saved-head h2{margin:3px 0 5px;font-family:Manrope,Inter,sans-serif;font-size:25px}.ed-saved-head p{margin:0;color:#6c7a88;line-height:1.5}
        .ed-saved-list{display:grid;gap:10px}
        .ed-saved-row{border:1px solid #e4ebf0;border-radius:13px;padding:14px;display:grid;grid-template-columns:minmax(220px,1.5fr) minmax(180px,1fr) auto;gap:14px;align-items:center}
        .ed-saved-main{display:flex;align-items:center;gap:11px}.ed-saved-main b{display:block}.ed-saved-main span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-saved-meta span{display:block;color:#7a8996;font-size:11px;margin-bottom:4px}.ed-saved-meta b{font-size:13px}
        .ed-saved-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}
        .ed-team-add{border:1px solid #cfe4db;background:#f2faf6;color:#167a54;border-radius:9px;padding:9px 11px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .ed-team-add.saved{cursor:default}
        .ed-team-badge{display:inline-flex;align-items:center;border-radius:999px;background:#edf8f3;color:#167a54;padding:7px 9px;font-size:11px;font-weight:800}
        .ed-team-chat-btn{position:relative}
        .ed-team-chat-btn.locked{border-style:dashed}
        .ed-chat-alert-btn{position:relative}
        .ed-chat-alert{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;margin-left:6px;padding:0 5px;border-radius:999px;background:#c9362b;color:#fff;font-size:10px;font-weight:900;line-height:1;vertical-align:middle;box-shadow:none}
        .ed-company-editor{background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:20px;box-shadow:0 8px 24px rgba(34,38,49,.04)}
        .ed-company-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
        .ed-company-editor-head h2{margin:3px 0 0;font-family:Manrope,Inter,sans-serif;font-size:21px}
        .ed-company-editor-head p{margin:6px 0 0;color:#6c7a88;font-size:13px;line-height:1.45}
        .ed-company-avatar-editor{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 18px;padding:14px;border:1px solid #e4ebf0;border-radius:13px;background:#f8fafb}.ed-company-avatar-preview{width:76px;height:76px;border-radius:50%;overflow:hidden;background:#222631;color:#fff;display:grid;place-items:center;font-family:Manrope,Inter,sans-serif;font-size:22px;font-weight:800;flex:0 0 76px}.ed-company-avatar-preview img{width:100%;height:100%;object-fit:cover;display:block}.ed-company-avatar-copy{min-width:0}.ed-company-avatar-copy b{display:block;margin-bottom:4px}.ed-company-avatar-copy span{display:block;color:#6c7a88;font-size:12px;line-height:1.45;margin-bottom:9px}.ed-company-avatar-actions{display:flex;gap:8px;flex-wrap:wrap}.ed-company-avatar-upload{display:inline-flex;border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.ed-company-avatar-upload input{display:none}.ed-company-avatar-remove{border:1px solid #efc7bb;background:#fff5f2;color:#a74428;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.ed-company-avatar-remove:disabled{opacity:.45;cursor:not-allowed;background:#f7f8f9;color:#8a98a6;border-color:#dfe6eb}
        .ed-profile-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:18px}
        .ed-profile-summary-card{border:1px solid #e4ebf0;background:#f8fafb;border-radius:12px;padding:14px;min-width:0}
        .ed-profile-summary-card span{display:block;color:#7a8996;font-size:11px;margin-bottom:5px}
        .ed-profile-summary-card b{display:block;font-family:Manrope,Inter,sans-serif;font-size:16px;overflow-wrap:anywhere}
        .ed-profile-summary-card small{display:block;color:#6c7a88;font-size:11px;margin-top:4px}
        .ed-link-btn{border:0;background:transparent;color:#453a63;padding:0;margin-top:7px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;text-align:left}
        .ed-profile-readonly-note{margin-top:16px;border-radius:10px;background:#f4f6f8;color:#6c7a88;padding:11px 13px;font-size:12px}
        .ed-company-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ed-company-reviews{margin-top:18px;border-top:1px solid #e4ebf0;padding-top:18px}
        .ed-company-reviews-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
        .ed-company-reviews-head h3{margin:0;font-size:17px}.ed-company-reviews-head span{color:#6c7a88;font-size:12px}
        .ed-company-review-list{display:grid;gap:9px}
        .ed-company-review{border:1px solid #e4ebf0;background:#f8fafb;border-radius:11px;padding:12px}
        .ed-company-review-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px;align-items:center}
        .ed-company-review-top b{font-size:13px}.ed-company-review-top span{font-size:11px;color:#7a8996}
        .ed-review-worker{display:flex;align-items:center;gap:10px;min-width:0}.ed-review-worker-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;border:1px solid #dbe4ea;background:#eef3f6;color:#222631;display:grid;place-items:center;font-weight:800;flex:0 0 42px}.ed-review-worker-avatar img{width:100%;height:100%;object-fit:cover;display:block}.ed-review-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.ed-review-actions .ed-secondary{padding:7px 10px;min-height:34px;font-size:12px}
        .ed-company-review-meta{font-size:11px;color:#7a8996;margin-top:3px}
        .ed-company-review p{margin:0;line-height:1.5;color:#405264;font-size:13px;white-space:pre-wrap}
        .ed-company-editor-wide{grid-column:1/-1}
        .ed-company-editor-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}
        /* Mobilus imones profilio redagavimas: abu veiksmai vienodo plocio ir aukscio. */
        @media(max-width:760px){
          .ed-company-editor-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%;align-items:stretch;justify-content:stretch}
          .ed-company-editor-actions>button{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:48px;height:100%;border-radius:10px;padding:11px 9px;font-size:13px;line-height:1.3;text-align:center;white-space:normal}
        }
        .ed-company-readonly{background:#f4f6f8!important;color:#6c7a88!important}
        .ed-stats-section{width:100%;box-sizing:border-box;margin-bottom:0;background:#f5f7f9;border-radius:18px;padding:14px 0}.ed-stats-head{display:flex;align-items:center;justify-content:flex-start;margin-bottom:10px;padding:0 14px}.ed-stats-toggle{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;padding:0;color:#6b5b95;font:inherit;font-size:12px;font-weight:850;letter-spacing:.08em;line-height:1;text-transform:uppercase;cursor:pointer}.ed-stats-toggle:hover{color:#4f4271}.ed-stats-toggle::after{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .18s ease}.ed-stats-toggle.open::after{transform:rotate(225deg) translate(-1px,-1px)}.ed-stats-toggle:focus-visible{outline:2px solid rgba(107,91,149,.35);outline-offset:5px;border-radius:4px}.ed-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;animation:edStatsReveal .18s ease-out}.ed-kpis.ed-kpis-eight{grid-template-columns:repeat(8,minmax(0,1fr))}@keyframes edStatsReveal{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@media(max-width:1300px){.ed-kpis.ed-kpis-eight{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:700px){.ed-kpis,.ed-kpis.ed-kpis-eight{grid-template-columns:repeat(2,minmax(0,1fr))}.ed-stats-section{padding:12px 0}.ed-stats-head{padding:0 12px}}
        .ed-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:104px}
        .ed-kpi span{display:block;font-size:13px;color:#6c7a88;line-height:1.35;min-height:36px}
        .ed-kpi b{font-family:Manrope,Inter,sans-serif;font-size:25px;font-weight:800;line-height:1;letter-spacing:-.03em;margin-top:10px;font-variant-numeric:tabular-nums}.ed-kpi small{display:block;margin-top:5px;color:#8a98a6;font-size:11px}
        .ed-reliability-card{display:flex;align-items:center;justify-content:center;text-align:center}
        .ed-reliability-copy{min-width:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .ed-reliability-title{
          display:flex;
          width:100%;
          justify-content:center;
          margin-bottom:0;
        }
        .ed-reliability-title-btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:max-content;
          max-width:100%;
          border:0;
          background:transparent;
          color:#6c7a88;
          font-family:Inter,sans-serif;
          font-size:13px;
          line-height:1.35;
          cursor:pointer;
          padding:0;
          margin:0 auto;
          text-align:center;
        }
        .ed-reliability-title-btn:hover{
          color:#222631;
          text-decoration:underline;
          text-underline-offset:3px;
        }
        .ed-reliability-title-btn:focus-visible{
          outline:2px solid rgba(107,91,149,.35);
          outline-offset:4px;
          border-radius:4px;
        }
        .ed-reliability-label{font-family:Manrope,Inter,sans-serif!important;font-size:25px!important;font-weight:800!important;line-height:1!important;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin-top:10px!important}
        .ed-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;box-shadow:0 8px 28px rgba(34,38,49,.045);padding:24px}.ed-active-jobs-section{background:#f3faf7;border-color:#cbe6da;box-shadow:0 8px 28px rgba(28,155,103,.08);position:relative;overflow:hidden}.ed-active-jobs-section>div:first-child h2{color:#167a54}.ed-active-jobs-section .ed-job{background:#fff}
        .ed-card h2{margin:0 0 6px;font-size:22px}.ed-sub{margin:0 0 20px;color:#6c7a88}
        .ed-form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}.ed-time-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ed-time-pair .ed-label{min-width:0}.ed-time-pair .ed-input{min-width:0}.ed-span-2{grid-column:span 2}.ed-span-4{grid-column:1/-1}
        .ed-label{display:grid;gap:7px;align-content:start;font-size:13px;font-weight:700;color:#263b4d}
        .ed-input,.ed-select,.ed-textarea{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:12px 13px;background:#fff;color:#222631;font:inherit;outline:none}
        .ed-input:focus,.ed-select:focus,.ed-textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.10)}
        .ed-textarea{min-height:90px;resize:vertical}
        .ed-check{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:700;min-height:46px}.ed-check input{width:18px;height:18px;accent-color:#1c9b67}
        .ed-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.ed-primary{border:0;border-radius:10px;background:#6b5b95;color:#fff;padding:12px 18px;font:inherit;font-weight:800;cursor:pointer}.ed-primary:disabled{opacity:.6;cursor:wait}
        .ed-note{border-radius:10px;padding:11px 13px;font-size:14px;font-weight:700}.ed-note.ok{background:#edf8f3;color:#167a54}.ed-note.err{background:#fff0ec;color:#b64d2a}
        .ed-plan-badge{border:1px solid #dbe4ea;background:#f8fafb;color:#222631;border-radius:999px;padding:7px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ed-plan-badge strong{color:#6b5b95}
        .ed-plan-usage{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:14px 16px;margin-bottom:20px}
        .ed-plan-usage-copy b{display:block;font-family:Manrope,Inter,sans-serif;font-size:15px;margin-bottom:3px}
        .ed-plan-usage-copy span{display:block;color:#6c7a88;font-size:13px;line-height:1.45}
        .ed-plan-usage-meter{display:flex;align-items:center;gap:10px;min-width:250px}
        .ed-plan-usage-bar{height:8px;flex:1;background:#edf1f4;border-radius:999px;overflow:hidden}
        .ed-plan-usage-fill{height:100%;background:#6b5b95;border-radius:999px}
        .ed-plan-usage-meter b{font-size:12px;white-space:nowrap}
        .ed-analytics-lock{margin-top:12px;border:1px dashed #d5dde4;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fafbfc}
        .ed-analytics-lock b{display:block;font-size:13px}.ed-analytics-lock span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-plan-overlay{position:fixed;inset:0;z-index:9400;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-plan-modal{width:min(1040px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border:1px solid #e2e9ee;border-radius:24px;padding:24px;box-shadow:0 30px 100px rgba(34,38,49,.3);background-clip:padding-box;overscroll-behavior:contain;clip-path:inset(0 round 24px);scrollbar-gutter:stable}.ed-plan-modal::-webkit-scrollbar{width:12px}.ed-plan-modal::-webkit-scrollbar-track{background:transparent;margin:14px 0}.ed-plan-modal::-webkit-scrollbar-thumb{background:#aab5bd;border:3px solid #fff;border-radius:999px}.ed-plan-modal::-webkit-scrollbar-corner{background:transparent}
        .ed-plan-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:20px}
        .ed-plan-modal > .ed-note{margin:0 0 16px}
        .ed-plan-modal > .ed-note.ok{margin-bottom:24px}
        .ed-plan-head h2{margin:3px 0 5px;font-family:Manrope,Inter,sans-serif;font-size:26px}.ed-plan-head p{margin:0;color:#6c7a88}
        .ed-billing-row{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 18px;padding:12px 14px;border:1px solid #e4ebf0;border-radius:13px;background:#f8fafb}
        .ed-billing-row>span{font-size:12px;color:#526374;font-weight:800}
        .ed-billing-toggle{display:flex;align-items:center;gap:4px;padding:4px;background:#eaf0f4;border-radius:10px}
        .ed-billing-toggle button{border:0;background:transparent;color:#526374;border-radius:8px;padding:8px 12px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
        .ed-billing-toggle button.active{background:#fff;color:#222631;box-shadow:0 1px 5px rgba(34,38,49,.10)}
        .ed-billing-discount{display:inline-flex;align-items:center;border-radius:999px;background:#eaf8f1;color:#167a54;padding:6px 9px;font-size:10px;font-weight:900}
        .ed-billing-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}
        .ed-billing-card{border:1px solid #e3eaf0;border-radius:13px;background:#fff;padding:12px 13px;min-width:0}
        .ed-billing-card span{display:block;color:#6b7a88;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
        .ed-billing-card b{display:block;color:#222631;font-size:14px;line-height:1.3;overflow-wrap:anywhere}
        .ed-billing-card small{display:block;color:#6b7a88;font-size:10px;line-height:1.4;margin-top:4px}
        .ed-billing-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;margin:0 0 16px}
        .ed-billing-warning{margin:0 0 16px;padding:12px 14px;border-radius:13px;border:1px solid #ccc4df;background:#f6f4fa;color:#222631;font-size:12px;line-height:1.55}
        .ed-billing-warning b{font-weight:900}
        .ed-plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .ed-plan-card{border:1px solid #e1e8ed;border-radius:16px;padding:20px;display:flex;flex-direction:column;min-height:390px;background:#fff}
        .ed-plan-card.current{border-color:#6b5b95;box-shadow:0 0 0 2px rgba(107,91,149,.08)}
        .ed-plan-card.pro{background:#222631;color:#fff;border-color:#222631}
        .ed-plan-card .eyebrow{margin-bottom:6px}.ed-plan-card.pro .eyebrow{color:#7e6eaa}
        .ed-plan-card h3{font-family:Manrope,Inter,sans-serif;font-size:22px;margin:0}
        .ed-plan-price{font-family:Manrope,Inter,sans-serif;font-size:31px;font-weight:900;margin:12px 0 2px}.ed-plan-price small{font:600 12px Inter,sans-serif;color:#7a8996}.ed-plan-card.pro .ed-plan-price small{color:#b7c2cc}
        .ed-plan-yearly{min-height:30px;margin:5px 0 2px;color:#167a54;font-size:11px;font-weight:800;line-height:1.4}.ed-plan-card.pro .ed-plan-yearly{color:#65d5aa}
        .ed-plan-desc{font-size:13px;color:#6c7a88;min-height:40px;line-height:1.5}.ed-plan-card.pro .ed-plan-desc{color:#c7d0d8}
        .ed-plan-features{display:grid;gap:9px;margin:17px 0 20px;padding:0;list-style:none;flex:1}.ed-plan-features li{font-size:13px;line-height:1.4}.ed-plan-features li:before{content:"✓";color:#1c9b67;font-weight:900;margin-right:7px}.ed-plan-card.pro .ed-plan-features li:before{color:#65d5aa}
        .ed-plan-current{display:inline-flex;width:max-content;background:#f1eef8;color:#453a63;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800;margin-top:9px}
        .ed-plan-card.pro .ed-plan-current{background:rgba(255,255,255,.12);color:#fff}
        .ed-plan-card .ed-primary,.ed-plan-card .ed-secondary{width:100%;min-height:43px}
        .ed-plan-card.pro .ed-secondary{border-color:#526779;background:#fff;color:#222631}
        .ed-plan-footnote{margin-top:16px;color:#778694;font-size:12px;line-height:1.5;text-align:center}
        .ed-team-btn{border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:10px;padding:10px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
        .ed-team-btn.locked{color:#8a98a6;background:#f8fafb}
        .ed-team-overlay{position:fixed;inset:0;z-index:9450;background:rgba(34,38,49,.64);display:grid;place-items:center;padding:20px}
        .ed-team-modal{width:min(980px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 30px 100px rgba(34,38,49,.30)}
        .ed-team-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
        .ed-team-head h2{margin:3px 0 4px;font-family:Manrope,Inter,sans-serif;font-size:25px}
        .ed-team-head p{margin:0;color:#6c7a88;font-size:13px;line-height:1.5}
        .ed-team-seat{display:inline-flex;margin-top:9px;border-radius:999px;background:#eef3f6;color:#405264;padding:6px 9px;font-size:11px;font-weight:800}
        .ed-team-layout{display:grid;grid-template-columns:1fr;gap:16px}
        .ed-team-panel{border:1px solid #e4ebf0;border-radius:14px;padding:16px}
        .ed-team-panel h3{margin:0 0 5px;font-family:Manrope,Inter,sans-serif;font-size:17px}
        .ed-team-panel>p{margin:0 0 14px;color:#6c7a88;font-size:12px;line-height:1.45}
        .ed-team-list{display:grid;gap:9px}
        .ed-team-member{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;border:1px solid #edf1f4;border-radius:11px;padding:12px}
        .ed-team-member b{display:block;font-size:14px}.ed-team-member span{display:block;color:#6c7a88;font-size:12px;margin-top:3px}
        .ed-team-member-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        .ed-team-role-select{border:1px solid #dbe4ea;border-radius:8px;padding:8px 9px;background:#fff;font:inherit;font-size:12px;font-weight:700}
        .ed-team-remove{border:1px solid #e8bbae;background:#fff;color:#b64d2a;border-radius:8px;padding:8px 9px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .ed-team-invite-form{display:grid;gap:10px}.ed-team-invite-form .ed-input,.ed-team-invite-form .ed-select{min-height:42px}
        .ed-team-role-title{display:block;font-size:12px;font-weight:800;color:#405264;margin-bottom:7px}
        .ed-team-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .ed-team-role-card{border:1px solid #dfe7ec;background:#fff;border-radius:12px;padding:13px;text-align:left;cursor:pointer;color:#222631;font:inherit;transition:border-color .15s,box-shadow .15s,background .15s}
        .ed-team-role-card:hover{border-color:#bdcbd5}
        .ed-team-role-card.active{border-color:#6b5b95;background:#fff9f3;box-shadow:0 0 0 2px rgba(107,91,149,.08)}
        .ed-team-role-card b{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:Manrope,Inter,sans-serif;font-size:14px;margin-bottom:5px}
        .ed-team-role-card b span{font-family:Inter,sans-serif;font-size:10px;color:#453a63;background:#ece9f5;border-radius:999px;padding:4px 6px;white-space:nowrap}
        .ed-team-role-card p{margin:0;color:#6c7a88;font-size:12px;line-height:1.5}
        .ed-team-role-card ul{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:6px}
        .ed-team-role-card li{font-size:12px;line-height:1.45;color:#405264}
        .ed-team-role-card li:before{content:"✓";color:#1c9b67;font-weight:900;margin-right:6px}
        .ed-team-role-summary{border:1px solid #e4ebf0;background:#f8fafb;border-radius:11px;padding:11px 12px;margin-top:12px}
        .ed-team-role-summary b{display:block;font-size:12px;margin-bottom:4px}
        .ed-team-role-summary span{display:block;color:#6c7a88;font-size:11px;line-height:1.45}
        .ed-team-invite-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .ed-team-invites{display:grid;gap:8px;margin-top:15px;padding-top:15px;border-top:1px solid #edf1f4}
        .ed-team-invite{border:1px solid #edf1f4;border-radius:10px;padding:11px}
        .ed-team-invite b{display:block;font-size:13px}.ed-team-invite span{display:block;color:#6c7a88;font-size:11px;margin-top:3px}
        .ed-team-invite-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
        .ed-team-link{margin-top:12px;background:#f6f8fa;border-radius:10px;padding:11px;font-size:11px;overflow-wrap:anywhere;color:#405264}
        .ed-job-scope{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
        .ed-job-scope button{position:relative;border:1px solid #d7e3dd;border-left:4px solid #1c9b67;background:#fff;color:#405264;border-radius:11px;padding:10px 14px 10px 13px;min-height:40px;font:inherit;font-size:12px;font-weight:850;cursor:pointer;box-shadow:0 3px 10px rgba(34,38,49,.035);transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease}
        .ed-job-scope button:hover{background:#f7fbf9;border-color:#bfdccc;border-left-color:#167a54}
        .ed-job-scope button.active{background:#eaf7f1;color:#126947;border-color:#b8ddcc;border-left-color:#167a54;box-shadow:0 4px 12px rgba(28,155,103,.09)}
        .ed-responsible{display:inline-flex;align-items:center;margin-top:0;color:#6c7a88;padding:0;font-size:13px;font-weight:600;line-height:1.35}.ed-responsible-name{color:#6b5b95;font-weight:800;margin-left:4px}.ed-job-responsibility-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px}.ed-job-responsibility-line .ed-responsible,.ed-job-responsibility-line .ed-attendance-badge{margin-top:0}
        .ed-results-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:16px}.ed-results-head p{margin:4px 0 0;color:#6c7a88}
        .ed-results{display:grid;gap:10px}.ed-worker{display:grid;grid-template-columns:minmax(320px,1fr) 130px 100px minmax(300px,360px);gap:18px;align-items:center;border:1px solid #e4ebf0;border-radius:13px;padding:14px 16px}
        .ed-worker.ed-worker-basic{grid-template-columns:minmax(260px,1fr) minmax(300px,360px)}
        .ed-worker-id{display:flex;align-items:flex-start;gap:10px}.ed-avatar{width:42px;height:42px;border-radius:50%;background:#eef2f5;display:grid;place-items:center;font-weight:800;overflow:hidden;flex:0 0 42px}.ed-avatar img{width:100%;height:100%;object-fit:cover;display:block}.ed-worker-id b{display:block}.ed-worker-id span{font-size:13px;color:#6c7a88}
        .ed-tags{display:flex;flex-wrap:wrap;gap:6px}.ed-tag{font-size:11px;font-weight:700;background:#f1f4f6;border-radius:999px;padding:5px 7px;color:#44576a}
        .ed-metric{display:grid;align-content:center;gap:3px;min-width:0}.ed-metric b{display:block}.ed-metric span{font-size:12px;color:#6c7a88}
        .ed-invite{border:0;border-radius:9px;background:#6b5b95;color:#fff;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer}.ed-invite.sent{background:#edf8f3;color:#167a54;cursor:default}.ed-invite.sent.declined{background:#fff0ec;color:#b9472d;border:1px solid #f1c1b4}
        .ed-worker-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;width:100%;max-width:360px;justify-self:end}.ed-worker-actions>button{width:100%;min-height:38px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}.ed-secondary{border:1px solid #dbe4ea;background:#fff;color:#222631;border-radius:9px;padding:8px 10px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        @media(max-width:900px){.ed-worker{grid-template-columns:1fr}.ed-worker.ed-worker-basic{grid-template-columns:1fr}.ed-worker-actions{justify-self:stretch;max-width:none}}
        .ed-current-job-overview{margin-bottom:18px;border:1px solid #dfe8ee;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 10px 28px rgba(34,38,49,.045)}
        .ed-current-job-overview-head{display:flex;justify-content:space-between;align-items:flex-start;gap:22px;padding:20px 22px 18px;border-bottom:1px solid #edf1f4;background:#fff}
        .ed-current-job-heading-copy{min-width:0}.ed-current-job-overview-head .eyebrow{margin-bottom:7px}.ed-current-job-overview-head h2{margin:0 0 8px;font-family:Manrope,Inter,sans-serif;font-size:25px;line-height:1.15;color:#222631}
        .ed-current-job-head-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:#6c7a88;font-size:12.5px;line-height:1.45}.ed-current-job-head-meta i{font-style:normal;color:#c2ccd4}.ed-current-job-responsible b{color:#6b5b95;font-weight:900}
        .ed-current-job-status{display:inline-flex;align-items:center;justify-content:center;min-height:32px;border-radius:999px;padding:6px 12px;background:#edf8f3;color:#167a54;font-size:11px;font-weight:900;white-space:nowrap;border:1px solid rgba(22,122,84,.08)}.ed-current-job-status.open{background:#eef5fb;color:#245d89;border-color:#d8e7f3}.ed-current-job-status.cancelled{background:#fff0ec;color:#b64d2a;border-color:#f4d8cf}
        .ed-current-job-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px 18px 12px;background:#fff}
        .ed-current-job-field{min-width:0;border:1px solid #e5ebf0;border-radius:12px;background:#fbfcfd;padding:12px 13px;min-height:66px}.ed-current-job-field.wide{grid-column:span 2}
        .ed-current-job-field span{display:block;margin-bottom:5px;color:#758492;font-size:10px;font-weight:900;letter-spacing:.055em;text-transform:uppercase}
        .ed-current-job-field b{display:block;color:#222631;font-size:13px;line-height:1.4;overflow-wrap:anywhere}
        .ed-current-job-description{margin:0 18px 18px;border:1px solid #e5ebf0;border-radius:12px;background:#fbfcfd;padding:13px 14px 14px}
        .ed-current-job-description span{display:block;margin-bottom:5px;color:#758492;font-size:10px;font-weight:900;letter-spacing:.055em;text-transform:uppercase}
        .ed-current-job-description div{color:#263b4d;font-size:13px;line-height:1.55;white-space:pre-wrap}
        #employer-open-job,.ed-current-job-overview,.ed-current-job-overview-head,.ed-current-job-grid{background:#fff!important}.ed-current-job-grid{border-bottom:0!important}
        .ed-attendance-panel{margin-top:30px;margin-bottom:22px;padding:18px;border:1px solid #e4ebf0;border-radius:14px;background:#f8fafb}
        .ed-attendance-panel h2{margin:0 0 4px}
        .ed-attendance-help{margin:0;color:#6c7a88;font-size:12px;line-height:1.5}
        .ed-next-step{margin-top:9px;padding:9px 11px;border-left:3px solid #d7e0e7;border-radius:0 9px 9px 0;background:#f7f9fb;color:#526374;font-size:11.5px;line-height:1.45}
        .ed-next-step b{display:block;color:#222631;margin-bottom:2px}
        .ed-next-step.action{border-left-color:#6b5b95;background:#fff8f1}
        .ed-next-step.ok{border-left-color:#2d9b69;background:#f2faf6}
        .ed-next-step.danger{border-left-color:#c65b37;background:#fff5f2}
        .ed-attendance-list{display:grid;gap:9px;margin-top:14px}
        .ed-attendance-row{display:grid;grid-template-columns:minmax(220px,1.35fr) minmax(210px,.9fr) auto;gap:18px;align-items:center;background:#fff;border:1px solid #e4ebf0;border-radius:12px;padding:14px 15px}
        .ed-worker-main{display:flex;flex-direction:column;gap:4px}.ed-worker-main b{display:block}.ed-worker-main span{font-size:13px;color:#6c7a88}.ed-member-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ed-member-metric{padding:8px 10px;border-radius:10px;background:#f6f8fa}
        .ed-member-metric span{display:block;color:#6c7a88;font-size:11px;margin-bottom:3px}
        .ed-member-metric b{font-family:Manrope,Inter,sans-serif;font-size:17px}
        .ed-worker-status{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center}.ed-worker-activity{display:flex;align-items:center;justify-content:center;min-width:0}.ed-worker-activity .ed-attendance-badge{margin:0;text-align:center}
        .ed-attendance-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.ed-attendance-row>.ed-member-metrics{grid-template-columns:1fr;gap:8px;min-width:210px}.ed-attendance-row>.ed-attendance-actions{display:grid;grid-template-columns:1fr;gap:8px;min-width:190px;width:190px}.ed-attendance-row>.ed-attendance-actions>button{width:100%;min-height:44px;justify-content:center}
        .ed-attendance-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800;margin-top:5px}
        .ed-attendance-badge.green{background:#edf8f3;color:#167a54}.ed-attendance-badge.orange{background:#f1eef8;color:#453a63}.ed-attendance-badge.red{background:#fff0ec;color:#b64d2a}.ed-attendance-badge.muted{background:#f1f4f6;color:#667788}
        .ed-progress{font-size:12px;font-weight:800;color:#222631}.ed-job-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;align-items:stretch;justify-content:center}.ed-job-actions.single{grid-template-columns:1fr}.ed-job-actions button{width:100%;min-height:34px;padding:7px 8px!important;font-size:12px!important}.ed-danger{border-color:#f0c8bc!important;color:#b64d2a!important}
        .rs-alert{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;width:max-content}
        .rs-alert.red{background:#fff0ec;color:#b64d2a}.rs-alert.orange{background:#f1eef8;color:#453a63}.rs-alert.green{background:#edf8f3;color:#167a54}.rs-alert.muted{background:#f1f4f6;color:#667788}
        .ed-news{margin-top:7px}.ed-news .rs-alert{margin:0}
        .ed-empty{border:1px dashed #cfd9e0;border-radius:13px;padding:24px;text-align:center;color:#6c7a88}
        .ed-empty.compact{padding:14px 16px;text-align:left;background:#f8fafb}
        .ed-jobs-empty{margin-top:16px;border:1px solid #e7edf1;background:#f8fafb;border-radius:12px;padding:16px 18px;text-align:left;display:flex;align-items:center;gap:12px;color:#6c7a88}
        .ed-jobs-empty-icon{width:36px;height:36px;border-radius:10px;background:#fff;border:1px solid #e1e8ed;display:grid;place-items:center;color:#222631;font-size:20px;font-weight:800;flex:0 0 36px}
        .ed-jobs-empty b{display:block;color:#222631;font-size:13px;margin-bottom:2px}.ed-jobs-empty span{display:block;font-size:12px;line-height:1.45}
        .ed-onboarding-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.ed-job-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:18px}.ed-job-overview-card{border:1px solid #e3eaf0;border-radius:12px;background:#fff;padding:11px 12px}.ed-job-overview-card span{display:block;color:#6c7a88;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.ed-job-overview-card b{display:block;margin-top:3px;color:#222631;font-size:18px}.ed-job-overview-card.alert{border-color:#c9c2de;background:#fff8f1}.ed-job-overview-card.danger{border-color:#efc7bb;background:#fff5f2}.ed-job-overview-card.live{border-color:#cfe7db;background:#f2faf6}
        .ed-jobs{display:grid;gap:8px;margin-top:12px}.ed-job{display:grid;grid-template-columns:108px minmax(210px,1.5fr) 96px 106px minmax(220px,.9fr);gap:11px;align-items:center;padding:10px 11px;border:1px solid #edf1f4;border-radius:12px;background:#fff;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease}.ed-job:first-child{border-top:1px solid #edf1f4}.ed-job-date{white-space:nowrap}.ed-job:hover{border-color:#dbe4ea;box-shadow:0 6px 20px rgba(34,38,49,.05)}.ed-job-active{background:#eef3f6;border-color:#cfdbe4}.ed-job-priority-danger{border-left:4px solid #c65b37}.ed-job-priority-action{border-left:4px solid #1c9b67}.ed-job-priority-live{border-left:4px solid #2d9b69}.ed-opened-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;background:#dce2e6;color:#425466;font-size:11px;font-weight:800}.ed-opened-badge.declined{background:#fff0ec;color:#b64d2a;border:0;padding:5px 8px}
        .ed-job-state-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;justify-self:center;align-self:center;text-align:center;min-width:0;width:100%}.ed-job-state{display:inline-flex;align-items:center;justify-content:center;text-align:center;border-radius:999px;padding:5px 10px;font-size:10px;font-weight:900;line-height:1.2}.ed-job-state.action{background:#f0edf7;color:#433960}.ed-job-state.danger{background:#fde8e4;color:#b42318}.ed-job-state.live{background:#edf8f3;color:#167a54}.ed-job-state.ok{background:#edf8f3;color:#167a54}.ed-job-state.muted{background:#f1f4f6;color:#667788}.ed-job-state-detail{display:block;margin-top:4px;color:#6c7a88;font-size:10.5px;line-height:1.3;text-align:center}
        .ed-job-chat-btn.has-unread{border-color:#897bb1!important;background:#f6f4fa!important;color:#433960!important}.ed-job-chat-new{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;margin-left:6px;padding:0 5px;border-radius:999px;background:#c9362b;color:#fff;font-size:10px;font-weight:900;line-height:1;vertical-align:middle}
        .ed-job button{border:1px solid #dbe4ea;background:#fff;border-radius:9px;padding:8px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .ed-status{font-size:12px;font-weight:800;border-radius:999px;padding:5px 8px;background:#edf8f3;color:#167a54;width:max-content}
        .ed-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;background:#f6f8fa}.ed-spinner{width:28px;height:28px;border:3px solid #dfe7ed;border-top-color:#6b5b95;border-radius:50%;animation:edspin .8s linear infinite}@keyframes edspin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.ed-job-overview{grid-template-columns:1fr 1fr}.ed-team-layout{grid-template-columns:1fr}.ed-form-grid{grid-template-columns:1fr 1fr}.ed-span-4{grid-column:1/-1}.ed-worker{grid-template-columns:minmax(0,1fr) 120px}.ed-worker-actions{grid-column:1/-1;justify-self:stretch;max-width:none}.ed-worker .ed-tags{grid-column:1/-1}.ed-job{grid-template-columns:108px 1fr 110px}.ed-job>:nth-child(3){display:none}.ed-current-job-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ed-current-job-field.wide{grid-column:span 2}.ed-attendance-row{grid-template-columns:1fr}.ed-attendance-actions{justify-content:flex-start}.ed-attendance-row>.ed-attendance-actions{width:100%;min-width:0}.ed-member-metrics{grid-template-columns:1fr 1fr}.ed-attendance-row>.ed-member-metrics{grid-template-columns:1fr}.ed-plan-grid{grid-template-columns:1fr}.ed-plan-card{min-height:0}}
        @media(max-width:620px){.ed-current-job-overview-head{padding:16px;flex-direction:column;align-items:flex-start}.ed-current-job-grid{grid-template-columns:1fr;padding:12px}.ed-current-job-field.wide{grid-column:auto}.ed-current-job-head-meta{gap:5px}.ed-current-job-head-meta i{display:none}.ed-current-job-description{margin:0 12px 12px}.ed-attendance-overlay{padding:12px}.ed-attendance-modal{padding:18px;border-radius:16px;max-height:calc(100dvh - 24px)}.ed-attendance-head h2{font-size:21px}.ed-onboarding-steps{grid-template-columns:1fr}.ed-team-role-grid{grid-template-columns:1fr}.ed-team-invite-row{grid-template-columns:1fr}.ed-team-member{grid-template-columns:1fr}.ed-team-member-actions{justify-content:flex-start}.ed-team-modal{padding:18px}.ed-topbar-inner,.ed-shell{width:min(100% - 24px,1180px)}.ed-heading{flex-direction:column;align-items:flex-start}.ed-heading-actions{justify-content:flex-start;width:100%;min-width:0}.ed-heading-primary-row{grid-template-columns:1fr}.ed-urgent-filter{grid-template-columns:1fr}.ed-urgent-row{grid-template-columns:1fr}.ed-urgent-contact{text-align:left}.ed-saved-row{grid-template-columns:1fr}.ed-saved-actions{justify-content:flex-start}.ed-job-overview{grid-template-columns:1fr 1fr}.ed-worker-source{width:100%;overflow:auto}.ed-profile-summary{grid-template-columns:1fr}.ed-company-editor-grid{grid-template-columns:1fr}.ed-company-editor-wide{grid-column:auto}.ed-form-grid{grid-template-columns:1fr}.ed-span-2,.ed-span-4{grid-column:auto}.ed-worker{grid-template-columns:1fr}.ed-jobs .ed-job{grid-template-columns:1fr}.ed-job>:nth-child(3){display:block}.ed-job-actions{grid-template-columns:1fr 1fr}.ed-attendance-row{grid-template-columns:1fr}.ed-plan-usage{align-items:stretch;flex-direction:column}.ed-plan-usage-meter{min-width:0;width:100%}.ed-plan-modal{padding:18px}.ed-plan-head h2{font-size:23px}}
      `}</style>


      {!onAdminReturn && <WebPushSettings user={user} kind="employer" profileOpen={showCompanyEditor} />}

      <main className="ed-shell" data-view={employerView}>
        {calendarVisible && <EmployerWorkCalendar
          jobs={canSeeAllCompanyJobs ? jobs : myEmployerJobs}
          currentUserId={user.id}
          calendarMemory={employerCalendarMemory}
          memoryKey={`${company?.id}:${user.id}`}
          teamName={teamMemberName}
          unreadCount={job => unreadEmployerNotifications(job.id).filter(item => item.event_type === "message").length}
          currentJobId={currentJob?.id}
          workers={jobWorkers}
          workersLoading={jobWorkersLoading}
          onSelectJob={job => openExistingJob(job)}
          onWorkerProfile={(worker, job) => openWorkerProfile({...worker, profileJobId: job.id})}
          onDemoProfile={(name, city) => setSelectedWorker({
            id: null, isDemoProfile: true, name, city, initials: name.slice(0,1),
            yearsExperience: 6, hasDrivingLicenseB: true,
            skillNames: ["Betonavimas", "Pagalbiniai statybos darbai"],
            shortBio: "Pavyzdinis aprašymas: turiu 6 metų patirtį statybose, dirbu su betonavimu ir pagalbiniais darbais. Visi šiame profilyje pateikti duomenys išgalvoti.",
            publicStats: {monthWorkedDays:8, monthWorkedMinutes:3840, monthJobs:5, activeJobs:1, cancelledByEmployer:0,
              ...(canViewWorkerMetrics ? {attendanceRate:98, ratingAverage:9.2, ratingCount:12, noShowCount:0, unexcusedEarlyLeaveCount:0} : {})}
          })}
          onWorkerMessage={(worker, job) => openEmployerPrivateConversation(worker.invitationId, `${worker.name} · ${formatJobTitle(job.title)}`)}
          onGroupMessage={job => openEmployerGroupConversation(job)}
          jobScope={jobScope}
          canSeeAllCompanyJobs={canSeeAllCompanyJobs}
          onScopeChange={scope => setJobScope(scope === "all" && canSeeAllCompanyJobs ? "all" : "mine")}
          onBack={() => navigateEmployerCalendar(false)}
          onCreateJob={options => { navigateEmployerCalendar(false); requestAnimationFrame(() => openNewJobForm(options)); }}
          onOpenJob={(job, favorites) => { navigateEmployerCalendar(false); requestAnimationFrame(async () => { if (await openExistingJob(job)) { if (favorites && planSummary?.can_saved_workers) setWorkerSource("team"); } }); }}
        />}
        <div style={{display: calendarVisible ? "none" : "contents"}}>

        {!onAdminReturn && jobs.length === 0 && (
          <section
            data-wv="overview active"
            style={{
              marginBottom: 18,
              padding: 16,
              border: "1px solid #dfe7ed",
              borderRadius: 16,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow">PIRMIEJI ŽINGSNIAI</div>
                <h3 style={{ margin: "5px 0 4px", color: "#222631" }}>Sukurkite pirmą darbo poreikį</h3>
                <div style={{ color: "#607180", fontSize: 12 }}>Įmonė jau paruošta. Dabar nurodykite konkretų darbą ir sistema padės ieškoti tinkamų žmonių.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="ed-secondary" type="button" onClick={() => setShowPlans(true)}>Planas: {planSummary?.plan_name || "Basic"}</button>
                <button className="ed-primary" type="button" onClick={openNewJobForm}>Sukurti pirmą darbą</button>
              </div>
            </div>
            <div className="ed-onboarding-steps">
              <div style={{ padding: 11, borderRadius: 11, background: "#f7f9fb", fontSize: 12 }}><b>✓</b> Įmonės profilis</div>
              <div style={{ padding: 11, borderRadius: 11, background: "#f7f9fb", fontSize: 12 }}><b>✓</b> Pasirinktas planas</div>
              <div style={{ padding: 11, borderRadius: 11, background: "#f6f4fa", fontSize: 12 }}><b>3</b> Pirmas darbas ir kvietimai</div>
            </div>
          </section>
        )}
        {showCompanyEditor && (
          <section
            ref={companyEditorRef}
            id="employer-profile-editor"
            data-wv="company"
            className="ed-company-editor"
            style={{ scrollMarginTop: 88 }}
          >
            <div className="ed-company-editor-head">
              <div>
                <div className="eyebrow">ĮMONĖS PROFILIS</div>
                <h2>{company?.name || "Įmonės profilis"}</h2>
                <p>
                  Čia matote įmonės paskyros informaciją, savo rolę, planą ir
                  pagrindinius komandos nustatymus.
                  {companyMemberRole === "owner"
                    ? " Įmonės savininkas taip pat gali redaguoti informaciją."
                    : " Įmonės informaciją gali redaguoti tik savininkas."}
                </p>
              </div>

            </div>

            <div id="s24-employer-push-settings" />
            <div className="ed-company-avatar-editor">
              <div className="ed-company-avatar-preview">
                {currentCompanyAvatarUrl ? (
                  <img
                    src={currentCompanyAvatarUrl}
                    alt={companyForm.name || "Įmonės logotipas"}
                  />
                ) : (
                  String(companyForm.name || "Į")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "Į"
                )}
              </div>
              <div className="ed-company-avatar-copy">
                <b>Įmonės logotipas</b>
                <span>JPG, PNG arba WEBP, iki 5 MB. Keisti ir ištrinti gali įmonės savininkas.</span>
                {companyMemberRole === "owner" && (
                  <div className="ed-company-avatar-actions">
                    <label className="ed-company-avatar-upload">
                      {currentCompanyAvatarUrl ? "Keisti logotipą" : "Įkelti logotipą"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          chooseCompanyAvatarFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <button
                      className="ed-company-avatar-remove"
                      type="button"
                      disabled={!currentCompanyAvatarUrl}
                      onClick={markCompanyAvatarForRemoval}
                      title={
                        currentCompanyAvatarUrl
                          ? "Pašalinti dabartinį įmonės logotipą"
                          : "Įmonės logotipas neįkeltas"
                      }
                    >
                      Ištrinti logotipą
                    </button>
                  </div>
                )}
              </div>
            </div>

            <MonthlyAwardsPanel
              awards={companyMonthlyAwards}
              recipientType="company"
              showEmpty={true}
            />

            <div className="ed-profile-summary">
              <div className="ed-profile-summary-card">
                <span>Jūs prisijungę kaip</span>
                <b>
                  {currentTeamMember?.display_name || user.email || "Vartotojas"}
                </b>
                <small>{companyTeamRoleLabel(companyMemberRole)}</small>
              </div>

              <div className="ed-profile-summary-card">
                <span>Dabartinis planas</span>
                <b>{planSummary?.plan_name || "Basic"}</b>
                <button
                  className="ed-link-btn"
                  type="button"
                  onClick={() => setShowPlans(true)}
                >
                  Peržiūrėti planus
                </button>
              </div>

              <div className="ed-profile-summary-card">
                <span>Komandos vietos</span>
                <b>
                  {planSummary?.can_team_management
                    ? `${Math.max(1, activeTeamMembers.length)}/5`
                    : "1/1"}
                </b>
                <button
                  className="ed-link-btn"
                  type="button"
                  onClick={openCompanyTeam}
                >
                  {planSummary?.can_team_management
                    ? "Valdyti komandą"
                    : "Komanda · Business Pro"}
                </button>
              </div>

              {companyMemberRole === "owner" && (
                <div className="ed-profile-summary-card">
                  <span>Įdarbinti darbuotojai</span>
                  <b>{employerStats.activeLongTermEmployees}</b>
                  <button
                    className="ed-link-btn"
                    type="button"
                    onClick={() => openLongTermEmployment("employees")}
                  >
                    Valdyti darbuotojus
                  </button>
                </div>
              )}
            </div>

            <div className="ed-company-editor-grid">
              <label className="ed-label">
                Darbdavio pavadinimas / vardas *
                <input
                  className="ed-input"
                  value={companyForm.name}
                  maxLength={160}
                  disabled={companyMemberRole !== "owner"}
                  onChange={(e) =>
                    updateCompanyField("name", e.target.value)
                  }
                />
              </label>

              <label className="ed-label">
                Įmonės kodas (jei taikoma)
                <input
                  className="ed-input ed-company-readonly"
                  value={companyForm.companyCode || "Nenurodytas"}
                  readOnly
                />
              </label>

              <label className="ed-label">
                Miestas *
                <CityAutocomplete
                  className="ed-input"
                  value={companyForm.city}
                  disabled={companyMemberRole !== "owner"}
                  onChange={(value) =>
                    updateCompanyField("city", value)
                  }
                  placeholder="Pradėkite rašyti miestą"
                />
              </label>

              <label className="ed-label">
                Kontaktinis telefono numeris
                <input
                  className="ed-input"
                  type="tel"
                  value={companyForm.phone}
                  maxLength={40}
                  disabled={companyMemberRole !== "owner"}
                  onChange={(e) =>
                    updateCompanyField("phone", e.target.value)
                  }
                  placeholder="+370..."
                />
                  <PhoneAvailabilityHint verification={companyPhoneVerification} />
              </label>

              {companyMemberRole === "owner" && <PhoneVerificationFields verification={companyPhoneVerification} />}

              <label className="ed-label ed-company-editor-wide">
                Trumpai apie įmonę
                <textarea
                  className="ed-textarea"
                  value={companyForm.description}
                  maxLength={1200}
                  disabled={companyMemberRole !== "owner"}
                  onChange={(e) =>
                    updateCompanyField("description", e.target.value)
                  }
                  placeholder="Pvz. Dirbame Vilniuje ir Vilniaus rajone, vykdome bendrastatybinius darbus..."
                />
              </label>
            </div>

            <div className="ed-company-reviews">
              <div className="ed-company-reviews-head">
                <div>
                  <h3>Atsiliepimai apie įmonę</h3>
                  <span>
                    Atsiliepimus gali palikti tik darbuotojai, kurių ginčas
                    oficialiai išspręstas jų naudai.
                  </span>
                </div>
                <b>{companyWorkerReviews.length}</b>
              </div>

              {companyWorkerReviews.length ? (
                <div className="ed-company-review-list">
                  {companyWorkerReviews.map((review) => (
                    <div className="ed-company-review" key={review.id}>
                      <div className="ed-company-review-top">
                        <div className="ed-review-worker">
                          <div className="ed-review-worker-avatar">
                            {review.avatar_path ? (
                              <img
                                src={workerAvatarUrl(review.avatar_path)}
                                alt={review.worker_name || "Darbuotojas"}
                              />
                            ) : (
                              workerInitials(review.worker_name || "Darbuotojas")
                            )}
                          </div>
                          <div>
                            <b>
                              {review.worker_name || "Darbuotojas"} · {review.score} / 10
                            </b>
                            <div className="ed-company-review-meta">
                              {formatJobTitle(review.job_title)}
                              {review.work_date ? ` · ${review.work_date}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="ed-review-actions">
                          <span>
                            {new Date(review.created_at).toLocaleDateString("lt-LT")}
                          </span>
                          {review.worker_id && (
                            <button
                              type="button"
                              className="ed-secondary"
                              onClick={() => openReviewWorkerProfile(review)}
                            >
                              Profilis
                            </button>
                          )}
                        </div>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ed-profile-readonly-note">
                  Darbuotojų atsiliepimų apie įmonę dar nėra.
                </div>
              )}
            </div>

            {companyMemberRole === "owner" ? (
              <div className="ed-company-editor-actions">
                <button
                  className="ed-secondary"
                  type="button"
                  disabled={companySaving}
                  onClick={() => setShowCompanyEditor(false)}
                >
                  Uždaryti
                </button>

                <button
                  className="ed-primary"
                  type="button"
                  disabled={companySaving}
                  onClick={saveCompanyInformation}
                >
                  {companySaving ? "Saugoma..." : "Išsaugoti pakeitimus"}
                </button>
              </div>
            ) : (
              <div className="ed-profile-readonly-note">
                Įmonės duomenis gali keisti tik paskyros Savininkas.
              </div>
            )}

            <AccountDeleteZone
              onDelete={() => setDeleteAccountOpen(true)}
              description={
                companyMemberRole === "owner"
                  ? "Ištrynus savininko paskyrą bus pašalinta ir jos valdoma įmonės paskyra, jūsų sukurti darbai bei failai. Aktyvi prenumerata bus nutraukta prieš trynimą."
                  : "Ištrynus paskyrą bus pašalinta jūsų asmeninė prieiga, jūsų sukurti darbai ir įkelti failai. Įmonės savininko paskyra išliks."
              }
            />
            <AccountBugReportZone
              successMessage={bugReportNotice}
              onOpen={() => {
                setBugReportNotice("");
                setBugReportOpen(true);
              }}
            />
          </section>
        )}

        {employerCalendarMemory.current && calendarAllowed && <button type="button" className="ed-secondary" style={{justifySelf:"start"}} onClick={() => navigateEmployerCalendar(true)}>← Grįžti į kalendorių</button>}
        <div data-wv="overview" style={{ display: "contents" }}>
          <EmployerOverview
            jobs={activeVisibleJobs}
            stateOf={employerJobDashboardState}
            unreadOf={(job) => unreadEmployerGroupChatNotifications(job.id).length}
            responsibleOf={(job) => (job.responsible_user_id || job.created_by) === user.id ? "Jūsų darbas" : teamMemberName(job.responsible_user_id || job.created_by)}
            onOpenJob={openExistingJob}
            onChat={openEmployerGroupConversation}
            onGo={goEmployerView}
            unreadMessages={employerNotifications.filter((item) => item.event_type === "message" && !item.read_at).length}
            actionCount={activeVisibleJobs.filter((job) => ["action", "disputed"].includes(employerJobDashboardState(job)?.key)).length}
            company={company}
            stats={employerStats}
            canStats={Boolean(planSummary?.can_advanced_analytics)}
          />
        </div>
        <div className="ed-heading" data-wv="legacy">
          <div>
            <div className="eyebrow">DARBDAVIO PASKYRA</div>
            <h1>Sukurkite darbuotojų kvietimą</h1>
            <p>
              Sistema rodys darbuotojus, kurie tą dieną ir tuo laiku pažymėjo,
              kad gali dirbti ir yra arčiausiai jūsų vietovės.
            </p>
          </div>

          <div className="ed-heading-actions">
            <div className="ed-heading-primary-row">
              <button
                className="ed-primary"
                type="button"
                onClick={openNewJobForm}
              >
                + Sukurti darbo pasiūlymą
              </button>

              <button
                className="ed-urgent-btn"
                type="button"
                onClick={openUrgentSearch}
              >
                {planSummary?.can_team_management
                  ? "Skubiai!"
                  : "Skubiai! · Pro"}
              </button>
            </div>

            {calendarPreviewEnabled && (
            <button className="ed-secondary ed-calendar-launch" type="button" style={{background:"#6b5b95",borderColor:"#6b5b95",color:"#fff"}} onClick={() => navigateEmployerCalendar(true)}>
              {calendarAllowed ? "Darbų kalendorius" : "Darbų kalendorius · Pro"}
            </button>
            )}

            <button
              className={`ed-secondary ed-team-chat-btn ed-chat-alert-btn ${
                planSummary?.can_team_chat ? "" : "locked"
              }`}
              type="button"
              onClick={openCompanyTeamChat}
            >
              {planSummary?.can_team_chat
                ? "Vadovų pokalbis"
                : "Vadovų pokalbis · Pro"}

              {planSummary?.can_team_chat && teamChatUnread > 0 && (
                <span
                  className="ed-chat-alert"
                  title="Nauja žinutė vadovų pokalbyje"
                >
                  {Math.min(9, teamChatUnread)}
                </span>
              )}
            </button>

            <button
              className="ed-secondary"
              type="button"
              onClick={openSavedWorkerTeam}
            >
              {planSummary?.can_saved_workers
                ? `Darbuotojai favoritai${savedWorkers.length ? ` · ${savedWorkers.length}` : ""}`
                : "Darbuotojai favoritai · Business"}
            </button>

            {companyMemberRole === "owner" && (
              <>
                <button
                  className={`ed-secondary wd-workday-chat ${
                    Object.values(longTermUnreadByOffer).reduce(
                      (sum, value) => sum + Number(value || 0),
                      0
                    ) > 0
                      ? "has-unread"
                      : ""
                  }`}
                  type="button"
                  onClick={() => openLongTermEmployment("hire")}
                >
                  Įdarbinti darbuotoją
                  {Object.values(longTermUnreadByOffer).reduce(
                    (sum, value) => sum + Number(value || 0),
                    0
                  ) > 0 && (
                    <span className="wd-chat-count">
                      {Math.min(
                        9,
                        Object.values(longTermUnreadByOffer).reduce(
                          (sum, value) => sum + Number(value || 0),
                          0
                        )
                      )}
                    </span>
                  )}
                </button>
              </>
            )}

          </div>
        </div>

        {notice && <div className="ed-note ok">{notice}</div>}
        {error && <div className="ed-note err">{error}</div>}

        {showJobForm && (
        <section
          className="ed-card"
          id="employer-job-form"
          data-wv="new"
        >
          <h2>
            {editingJobId ? "Redaguoti darbo pasiūlymą" : "Naujas darbo pasiūlymas"}
          </h2>
          <p className="ed-sub">
            {editingJobId
              ? editingCoreTermsLocked
                ? "Darbuotojai jau buvo pakviesti, todėl data, darbo laikas, miestas ir atlygis nebekeičiami. Kitą informaciją galite atnaujinti pagal darbo būseną."
                : "Darbuotojai dar nepakviesti, todėl galite pakeisti visas darbo sąlygas."
              : "Užpildykite svarbiausią informaciją ir iškart ieškosime tinkamų žmonių."}
          </p>

          <div className="ed-form-grid">
            <label className="ed-label ed-span-2">
              Darbo pasiūlymo pavadinimas
              <input
                className="ed-input"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Pvz. Reikia 2 statybų pagalbinių rytoj"
              />
            </label>

            {planSummary?.can_team_management && (
              <div className="ed-label ed-span-2">
                Atsakingas žmogus
                <RoundedSelect
                  value={form.responsibleUserId}
                  ariaLabel="Atsakingas žmogus"
                  disabled={
                    !["owner", "manager"].includes(companyMemberRole)
                  }
                  onChange={(userId) =>
                    updateField("responsibleUserId", userId)
                  }
                  options={activeTeamMembers.map((member) => ({
                    value: member.user_id,
                    label: `${member.display_name} · ${companyTeamRoleLabel(member.member_role)}`,
                  }))}
                />
                <span
                  style={{
                    color: "#7a8996",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Vadybininkui naujas darbas automatiškai priskiriamas jam
                  pačiam. Savininkas ir vadovas gali pakeisti atsakingą žmogų.
                </span>
              </div>
            )}

            <label className="ed-label">
              Miestas *
              <CityAutocomplete
                className="ed-input"
                value={form.city}
                disabled={editingCoreTermsLocked}
                onChange={(value) => updateField("city", value)}
                placeholder="Pradėkite rašyti miestą"
              />
            </label>

            <label className="ed-label">
              Žmonių skaičius
              <input
                className="ed-input"
                type="number"
                min="1"
                max="100"
                value={form.workersNeeded}
                onChange={(e) => updateField("workersNeeded", e.target.value)}
              />
            </label>

            <label className="ed-label ed-span-2">
              Atvykti adresu *
              <AddressAutocomplete
                inputRef={addressInputRef}
                value={form.address}
                city={form.city}
                disabled={editingConfirmedCount > 0}
                invalid={Boolean(jobFormErrors.address)}
                selectedAddress={selectedJobAddress}
                onChange={(value) => updateField("address", value)}
                onSelect={(address) => {
                  setSelectedJobAddress(address);
                  setForm((current) => ({ ...current, address: address.label }));
                  setJobFormErrors((current) => ({ ...current, address: "" }));
                }}
                placeholder="Pvz. Gedimino pr. 1"
              />
              {jobFormErrors.address && (
                <span style={{ color: "#c9362b", fontSize: 11, fontWeight: 800, marginTop: 5 }}>
                  {jobFormErrors.address}
                </span>
              )}
            </label>

<div className="ed-label ed-span-2">
  Data
  <RoundedDateSelect
    className="ed-input wd-date-trigger"
    ariaLabel="Darbo data"
    value={form.workDate}
    disabled={editingCoreTermsLocked}
    allowClear={false}
    onChange={(value) => updateField("workDate", value)}
  />
</div>


<div className="ed-label ed-span-2">
  Darbo laikas
  <div className="ed-time-pair">
    <label className="ed-label">Nuo
      <RoundedTimeSelect
        ariaLabel="Darbo pradžios laikas"
        className="ed-input wd-time-trigger"
        value={form.startTime}
        disabled={editingCoreTermsLocked}
        onChange={(value) => updateField("startTime", value)}
      />
    </label>
    <label className="ed-label">Iki
      <RoundedTimeSelect
        ariaLabel="Darbo pabaigos laikas"
        className="ed-input wd-time-trigger"
        value={form.endTime}
        disabled={editingCoreTermsLocked}
        onChange={(value) => updateField("endTime", value)}
        align="right"
      />
    </label>
  </div>
</div>

<div className="ed-label ed-span-2">
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
    <span>Pietų pertrauka</span>
    <label className="ed-check" style={{ minHeight: 0, fontSize: 12, fontWeight: 800 }}>
      <input
        type="checkbox"
        checked={!form.breakStartTime && !form.breakEndTime}
        disabled={editingConfirmedCount > 0}
        onChange={(e) => {
          if (e.target.checked) {
            setForm((current) => ({ ...current, breakStartTime: "", breakEndTime: "" }));
          } else {
            setForm((current) => ({
              ...current,
              breakStartTime: current.breakStartTime || "12:00",
              breakEndTime: current.breakEndTime || "12:30",
            }));
          }
        }}
      />
      Pietų pertraukos nėra
    </label>
  </div>
  <div className="ed-time-pair">
    <label className="ed-label">Nuo
      <RoundedTimeSelect
        ariaLabel="Pietų pertraukos pradžia"
        buttonRef={breakStartInputRef}
        className="ed-input wd-time-trigger"
        value={form.breakStartTime}
        disabled={editingConfirmedCount > 0 || (!form.breakStartTime && !form.breakEndTime)}
        onChange={(value) => updateField("breakStartTime", value)}
      />
    </label>
    <label className="ed-label">Iki
      <RoundedTimeSelect
        ariaLabel="Pietų pertraukos pabaiga"
        buttonRef={breakEndInputRef}
        className="ed-input wd-time-trigger"
        value={form.breakEndTime}
        disabled={editingConfirmedCount > 0 || (!form.breakStartTime && !form.breakEndTime)}
        onChange={(value) => updateField("breakEndTime", value)}
        align="right"
      />
    </label>
  </div>
</div>

<label className="ed-label">
  Atlygis į rankas (€) *
  <input
    ref={payAmountInputRef}
    className="ed-input"
    type="number"
    min="1"
    step="0.01"
    required
    aria-invalid={Boolean(jobFormErrors.payAmount)}
    value={form.payAmount}
    disabled={editingCoreTermsLocked}
    onChange={(e) => updateField("payAmount", e.target.value)}
    placeholder="Pvz. 12"
    style={jobFormErrors.payAmount ? { borderColor: "#d94a3a", boxShadow: "0 0 0 2px rgba(217,74,58,.10)" } : undefined}
  />
  {jobFormErrors.payAmount && (
    <span style={{ color: "#c9362b", fontSize: 11, fontWeight: 800, marginTop: 5 }}>
      {jobFormErrors.payAmount}
    </span>
  )}
</label>

<div className="ed-label">
  Mokėjimo tipas *
  <RoundedSelect
    ariaLabel="Mokėjimo tipas"
    value={form.payUnit}
    disabled={editingCoreTermsLocked}
    onChange={(value) => updateField("payUnit", value)}
    options={[{ value: "hour", label: "Už valandą" }, { value: "day", label: "Už dieną" }]}
  />
</div>

<div className="ed-label ed-span-2">
  Atvykimas į darbo vietą *
  <RoundedSelect
    ariaLabel="Atvykimas į darbo vietą"
    value={form.transportMode}
    disabled={editingConfirmedCount > 0}
    onChange={(value) => updateField("transportMode", value)}
    options={[{ value: "self_arrival", label: "Darbuotojas atvyksta pats" }, { value: "employer_pickup", label: "Darbdavys paima darbuotoją" }]}
  />
</div>

            <label className="ed-label ed-span-4">
              Darbo aprašymas *
              <textarea
                ref={descriptionInputRef}
                className="ed-textarea"
                required
                aria-invalid={Boolean(jobFormErrors.description)}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Pvz. Pagalbiniai mūro darbai. Įrankiai suteikiami, reikalinga darbo avalynė."
                style={jobFormErrors.description ? { borderColor: "#d94a3a", boxShadow: "0 0 0 2px rgba(217,74,58,.10)" } : undefined}
              />
              {jobFormErrors.description && (
                <span style={{ color: "#c9362b", fontSize: 11, fontWeight: 800, marginTop: 5 }}>
                  {jobFormErrors.description}
                </span>
              )}
            </label>

            {!editingJobId && (
              <div
                ref={jobScopeAckRef}
                tabIndex={-1}
                className="ed-span-4"
                style={{
                  border: jobFormErrors.scopeAcknowledgement ? "1px solid #d94a3a" : "1px solid #b0a5cf",
                  borderRadius: 13,
                  padding: "14px 15px",
                  background: "#fff8f1",
                  outline: "none",
                }}
              >
                <b style={{ display: "block", color: "#433960", fontSize: 13, marginBottom: 6 }}>
                  Prieš paskelbiant darbą
                </b>
                <div style={{ color: "#5c6874", fontSize: 12, lineHeight: 1.55 }}>
                  Padedame suvesti darbdavį ir darbuotoją bei valdyti darbo eigą, tačiau atlygio už šį darbą nemokame. Darbdavys atsako už sutartą apmokėjimą, teisėtą ir saugų darbo organizavimą, instruktavimą bei konkrečiam darbui taikomus reikalavimus. Jei reikalingi dokumentai, pažymėjimai, leidimai, kvalifikacija, speciali apranga, apsaugos priemonės ar kitos sąlygos, jos turi būti aiškiai nurodytos darbo aprašyme prieš siunčiant kvietimus.
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 11, color: "#222631", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={jobScopeAcknowledged}
                    onChange={(e) => {
                      setJobScopeAcknowledged(e.target.checked);
                      if (e.target.checked) {
                        setJobFormErrors((current) => ({ ...current, scopeAcknowledgement: "" }));
                      }
                    }}
                    style={{ marginTop: 3 }}
                  />
                  <span>Patvirtinu, kad suprantu savo atsakomybę dėl apmokėjimo, saugos ir teisėto darbo organizavimo, o darbo aprašyme nurodžiau visus darbuotojui būtinus reikalavimus.</span>
                </label>
                {jobFormErrors.scopeAcknowledgement && (
                  <div style={{ marginTop: 7, color: "#c9362b", fontSize: 11, fontWeight: 800 }}>
                    {jobFormErrors.scopeAcknowledgement}
                  </div>
                )}
              </div>
            )}

            {!editingJobId && (
              <div
                className="ed-span-4"
                style={{
                  border: "1px solid #dfe7ed",
                  borderRadius: 13,
                  padding: "9px 14px",
                  background: "#f7f9fb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 240, flex: "1 1 520px" }}>
                    <b style={{ color: "#222631", fontSize: 13 }}>
                      Darbuotojų pasiūla · {form.city || "pasirinktas miestas"}
                    </b>
                    <span style={{ marginLeft: 8, color: "#6c7a87", fontSize: 11 }}>
                      Aktyvūs per paskutines 24 val. ir patvirtinę prieinamumą pasirinktai dienai.
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "5px 9px",
                        background: "#fff",
                        border: "1px solid #dfe7ed",
                        color: "#222631",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {cityWorkerSignalLoading || (selectedJobAddress && !cityWorkerSignal) ? (
                        <SilentLoader size={13} minHeight={15} />
                      ) : cityWorkerSignal ? (
                        `${cityWorkerSignal.availableWorkers} tinkamų pagal vietą ir laiką`
                      ) : (
                        "Pasirinkite adresą"
                      )}
                    </span>

                    {planSummary?.plan_key === "business_pro" &&
                      cityWorkerSignal &&
                      cityWorkerSignal.urgentWorkersNow !== null &&
                      cityWorkerSignal.urgentWorkersNow !== undefined && (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "5px 9px",
                            background: "#f0edf7",
                            border: "1px solid #c6bedc",
                            color: "#433960",
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {cityWorkerSignal.urgentWorkersNow} „Laisvas dabar“
                        </span>
                      )}
                  </div>
                </div>

                {!cityWorkerSignalLoading &&
                  cityWorkerSignal &&
                  cityWorkerSignal.availableWorkers === 0 && (
                    <div
                      style={{
                        marginTop: 5,
                        color: "#433960",
                        fontSize: 10.5,
                        lineHeight: 1.35,
                      }}
                    >
                      Šiuo metu šiai dienai tinkamų aktyvių darbuotojų nematome. Darbą vis tiek galite paskelbti – pasiūla gali pasikeisti darbuotojams atnaujinus grafiką.
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="ed-actions">
            <button
              className="ed-secondary"
              type="button"
              disabled={saving}
              onClick={() => {
                setShowJobForm(false);
                setEditingJobId(null);
                setEditingConfirmedCount(0);
                setEditingInvitationCount(0);
              }}
            >
              Uždaryti
            </button>

            <button
              className="ed-primary"
              disabled={saving}
              onClick={saveJobAndFind}
            >
              {saving
                ? "Saugoma..."
                : editingJobId
                ? "Išsaugoti pakeitimus"
                : "Sukurti darbo pasiūlymą"}
            </button>
          </div>
        </section>
        )}

        <BugResolutionNotice userId={user.id} />

        <section className="ed-stats-section" data-wv="legacy">
          <div className="ed-stats-head">
            <button
              className={`ed-stats-toggle ${showEmployerStats ? "open" : ""}`}
              type="button"
              aria-expanded={showEmployerStats}
              aria-label={showEmployerStats ? "Slėpti statistiką" : "Rodyti statistiką"}
              onClick={() => setShowEmployerStats((current) => !current)}
            >
              {planSummary?.can_team_management &&
              companyMemberRole === "recruiter"
                ? "MANO DARBŲ STATISTIKA · SPAUSK IR ŽIŪRĖK"
                : "ĮMONĖS STATISTIKA · SPAUSK IR ŽIŪRĖK"}
            </button>
          </div>

          {showEmployerStats && (
            <>
          <div
            className={`ed-kpis ${
              companyMemberRole === "owner" && planSummary?.can_advanced_analytics
                ? "ed-kpis-eight"
                : ""
            }`}
          >
            <div className="ed-kpi">
              <span>Sukurta darbo pasiūlymų</span>
              <b>{employerStats.totalJobs}</b>
            </div>

            {planSummary?.can_advanced_analytics && (
              <div className="ed-kpi">
                <span>Žmonėmis užpildyti darbai</span>
                <b>{employerStats.filledJobs}</b>
              </div>
            )}

            <div className="ed-kpi">
              <span>Trūksta darbuotojų</span>
              <b>{employerStats.missingWorkers}</b>
            </div>

            <div className="ed-kpi">
              <span>Įvykdyti darbai</span>
              <b>{employerStats.completedJobs}</b>
            </div>

            {planSummary?.can_advanced_analytics && (
              <>
                <div className="ed-kpi">
                  <span>Atšaukti darbai</span>
                  <b>{employerStats.cancelledJobs}</b>
                </div>

                <div className="ed-kpi">
                  <span>Panaudoti darbuotojai / mėn.</span>
                  <b>{employerStats.monthlyWorkersUsed}</b>
                </div>
              </>
            )}

            {companyMemberRole === "owner" && (
              <div className="ed-kpi">
                <span>Įdarbinti darbuotojai</span>
                <b>{employerStats.activeLongTermEmployees}</b>
              </div>
            )}

            <div className="ed-kpi ed-reliability-card">
              <div className="ed-reliability-copy">
                <div className="ed-reliability-title">
                  <button
                    type="button"
                    className="ed-reliability-title-btn"
                    aria-label="Atidaryti darbdavio patikimumo paaiškinimą"
                    onClick={() => setShowReliabilityInfo(true)}
                  >
                    Įmonės patikimumas
                  </button>
                </div>

                <b
                  className="ed-reliability-label"
                  style={{
                    color: reliabilityScoreColor(employerStats.reliabilityRate),
                  }}
                >
                  {formatReliabilityScore(employerStats.reliabilityRate)} / 100
                </b>
              </div>
            </div>
          </div>

          {planSummary && !planSummary.can_advanced_analytics && (
            <div className="ed-analytics-lock">
              <div>
                <b>Išplėstinė įmonės statistika</b>
                <span>
                  Užpildytų ir atšauktų darbų bei mėnesio darbuotojų analizė
                  įtraukta į Business ir Business Pro.
                </span>
              </div>
              <button
                className="ed-secondary"
                type="button"
                onClick={() => setShowPlans(true)}
              >
                Peržiūrėti planus
              </button>
            </div>
          )}
            </>
          )}
        </section>


        {currentJob && (
          <section
            className="ed-card"
            id="employer-open-job"
            data-wv="job"
            style={{ scrollMarginTop: 96 }}
          >
            <div className="ed-current-job-overview">
              <div className="ed-current-job-overview-head">
                <div className="ed-current-job-heading-copy">
                  <div className="eyebrow">ATIDARYTAS DARBAS</div>
                  <h2>{formatJobTitle(currentJob.title)}</h2>
                  <div className="ed-current-job-head-meta">
                    <span>{currentJob.city || "Miestas nenurodytas"}</span>
                    <i>•</i>
                    <span>{currentJob.work_date || "Data nenurodyta"}</span>
                    <i>•</i>
                    <span>
                      {currentJob.start_time?.slice(0, 5) || "—"}
                      {currentJob.end_time
                        ? `–${currentJob.end_time.slice(0, 5)}`
                        : ""}
                    </span>
                    {planSummary?.can_team_management && (
                      <>
                        <i>•</i>
                        <span className="ed-current-job-responsible">
                          Atsakingas: <b>{teamMemberName(currentJobResponsibleUserId)}</b>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ed-current-job-head-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span
                  className={`ed-current-job-status ${
                    currentJob.status === "cancelled"
                      ? "cancelled"
                      : currentJob.status === "open"
                      ? "open"
                      : ""
                  }`}
                >
                  {currentJob.status === "cancelled"
                    ? "Atšauktas"
                    : currentJob.status === "completed"
                    ? "Užbaigtas"
                    : currentJob.status === "filled"
                    ? "Komanda suformuota"
                    : "Aktyvus"}
                </span>
                <button
                  className="ed-secondary"
                  type="button"
                  disabled={attendanceSaving || ratingSaving}
                  onClick={closeCurrentJob}
                  aria-label="Uždaryti darbo kortelę"
                >
                  Uždaryti kortelę
                </button>
                </div>
              </div>

              <div className="ed-current-job-grid">
                {[
                  ["Atvykti adresu", currentJob.address_text || "—", "wide"],
                  [
                    "Pietų pertrauka",
                    currentJob.break_start_time && currentJob.break_end_time
                      ? `${currentJob.break_start_time.slice(0, 5)}–${currentJob.break_end_time.slice(0, 5)}`
                      : "Nėra",
                    "",
                  ],
                  [
                    "Atlygis",
                    currentJob.pay_amount
                      ? formatNetPay(currentJob.pay_amount, currentJob.pay_unit)
                      : "—",
                    "",
                  ],
                  [
                    "Darbuotojai",
                    currentJob.status === "completed"
                      ? `${jobWorkers.length} darbuotojų`
                      : `${Number(currentJob.confirmedCount || 0)}/${Number(
                          currentJob.workers_needed || 0
                        )} patvirtinti`,
                    "",
                  ],
                  [
                    "Atvykimas",
                    currentJob.transport_mode === "employer_pickup"
                      ? "Darbdavys paima darbuotoją"
                      : "Darbuotojas atvyksta pats",
                    "wide",
                  ],
                ].map(([label, value, fieldClass]) => (
                  <div
                    className={`ed-current-job-field ${fieldClass || ""}`}
                    key={label}
                  >
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                ))}
              </div>

              <div className="ed-current-job-description">
                <span>Darbo aprašymas</span>
                {(() => {
                  const descriptionText =
                    currentJob.description?.trim() ||
                    "Darbo aprašymas nepateiktas.";
                  const canToggleDescription = descriptionText.length > 180;
                  return (
                    <>
                      <div
                        className={`ed-current-job-description-copy ${
                          currentJobDescriptionExpanded ? "expanded" : "collapsed"
                        }`}
                      >
                        {descriptionText}
                      </div>
                      {canToggleDescription && (
                        <button
                          className="ed-description-toggle"
                          type="button"
                          style={{
                            marginTop: 10,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 36,
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid #d9e3ea",
                            background: "#fff",
                            color: "#222631",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setCurrentJobDescriptionExpanded((value) => !value)
                          }
                          aria-expanded={currentJobDescriptionExpanded}
                        >
                          {currentJobDescriptionExpanded
                            ? "Rodyti mažiau"
                            : "Rodyti daugiau"}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {unreadEmployerNotifications(currentJob.id).some((item) => item.event_type !== "message") && (() => {
              const currentNews = unreadEmployerNotifications(currentJob.id)
                .filter((item) => item.event_type !== "message");
              const currentPresentation = notificationPresentation(currentNews);
              return (
                <div className={`ed-note ${currentPresentation.tone === "red" ? "err" : "ok"}`} style={{ marginBottom: 16 }}>
                  {currentPresentation.label}
                  {currentNews.length > 1 ? ` · ${currentNews.length} naujienos` : ""}
                </div>
              );
            })()}

            {currentJob.status === "cancelled" && (
              <div className="ed-note err" style={{ marginBottom: 16 }}>
                <b>Poreikis atšauktas.</b>
                <div style={{ marginTop: 4 }}>
                  Priežastis:{" "}
                  {currentJob.cancellation_reason || "Priežastis nenurodyta."}
                </div>
              </div>
            )}

            {currentJob.status === "filled" && (
              <div className="ed-note ok" style={{ marginBottom: 16 }}>
                Poreikis užpildytas: {currentJob.confirmedCount}/{currentJob.workers_needed}.
                Darbuotojų paieška automatiškai uždaryta.
              </div>
            )}

            {currentJobWorkerSearchOpen && (
              <>
            <div className="ed-results-head">
              <div>
                <h2>
                  {workerSource === "team"
                    ? "Kviesti darbuotojus iš favoritų"
                    : "Kviesti laisvus darbuotojus pagal jūsų parinktis"}
                </h2>

                <div className="ed-worker-source">
                  <button
                    type="button"
                    className={workerSource === "available" ? "active" : ""}
                    onClick={() => setWorkerSource("available")}
                  >
                    Laisvi darbuotojai
                  </button>
                  <button
                    type="button"
                    className={`${
                      workerSource === "team" ? "active" : ""
                    } ${planSummary?.can_saved_workers ? "" : "locked"}`}
                    onClick={() => {
                      if (!planSummary?.can_saved_workers) {
                        setNotice(
                          "„Darbuotojai favoritai“ prieinami Business ir Business Pro planuose. Planus galite peržiūrėti paspaudę „Planai“."
                        );
                        return;
                      }
                      setWorkerSource("team");
                    }}
                  >
                    {planSummary?.can_saved_workers
                      ? `Darbuotojai favoritai · ${matchingSavedWorkersCount}`
                      : "Darbuotojai favoritai · Business"}
                  </button>
                </div>

                {workerSource === "team" &&
                  planSummary?.can_saved_workers &&
                  currentJob.status === "open" && (
                    <button
                      className="ed-primary ed-invite-all-mobile"
                      type="button"
                      disabled={
                        invitingSavedTeam ||
                        matchingSavedWorkersCount === 0
                      }
                      onClick={inviteSavedWorkerTeam}
                    >
                      {invitingSavedTeam
                        ? "Siunčiami kvietimai..."
                        : `Pakviesti visus tinkamus · ${matchingSavedWorkersCount}/${savedWorkers.length}`}
                    </button>
                  )}
              </div>
              <div style={{ textAlign: "right" }}>
                <b>{visibleCandidateWorkers.length} rasti</b>
                <div className="ed-progress">
                  {currentJob.status === "completed"
                    ? "Darbo diena užbaigta"
                    : `${Number(currentJob.confirmedCount || 0)}/${currentJob.workers_needed} patvirtinti`}
                </div>

                {workerSource === "team" &&
                  planSummary?.can_saved_workers &&
                  currentJob.status === "open" && (
                    <button
                      className="ed-primary ed-invite-all-desktop"
                      type="button"
                      style={{ marginTop: 10, padding: "9px 14px", fontSize: 13, borderRadius: 9, minHeight: 0 }}
                      disabled={
                        invitingSavedTeam ||
                        matchingSavedWorkersCount === 0
                      }
                      onClick={inviteSavedWorkerTeam}
                    >
                      {invitingSavedTeam
                        ? "Siunčiami kvietimai..."
                        : `Pakviesti visus tinkamus · ${matchingSavedWorkersCount}/${savedWorkers.length}`}
                    </button>
                  )}
              </div>
            </div>

            {searching ? (
              <div className="ed-empty"><SilentLoader size={20} minHeight={44} /></div>
            ) : visibleCandidateWorkers.length ? (
              <div className="ed-results">
                {visibleCandidateWorkers.map((worker) => {
                  const invited = invitedIds.includes(worker.id);
                  return (
                    <div
                      className={
                        canViewWorkerMetrics
                          ? "ed-worker"
                          : "ed-worker ed-worker-basic"
                      }
                      key={worker.id}
                    >
                      <div className="ed-worker-id">
                        <div className="ed-avatar">
                          {worker.avatarUrl ? (
                            <img src={worker.avatarUrl} alt={worker.name} />
                          ) : (
                            worker.initials
                          )}
                        </div>
                        <MonthlyAwardMiniList
                          awards={workerAwardsById[worker.id] || []}
                          size={42}
                        />
                        <div>
                          <b>{worker.name}</b>
                          <span>
                            {worker.city} · Atlikta darbų: {Number(worker.completedJobs || 0)}
                            {workerDistanceLabel(worker)
                              ? ` · ${workerDistanceLabel(worker)}`
                              : ""}
                          </span>
                          {!canViewWorkerMetrics && worker.activityLabel && !worker.declinedInvitation && (
                            <div className="ed-worker-status">
                              <span className="ed-attendance-badge green">
                                {worker.activityLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {canViewWorkerMetrics && (
                        <>
                          <div className="ed-worker-activity">
                            {worker.activityLabel ? (
                              <span className="ed-attendance-badge green">
                                {worker.activityLabel}
                              </span>
                            ) : (
                              <span className="ed-attendance-badge">Neaktyvus</span>
                            )}
                          </div>
                          <div className="ed-metric">
                            <b>{Math.round(worker.attendanceRate ?? 0)}%</b>
                            <span>atvykimas</span>
                          </div>
                        </>
                      )}

                      <div className="ed-worker-actions">
                        <button
                          className="ed-secondary"
                          onClick={() => openWorkerProfile(worker)}
                        >
                          Profilis
                        </button>

                        <button
                          className={invited ? "ed-invite sent" : "ed-invite"}
                          disabled={invited || currentJob.status !== "open"}
                          onClick={() => inviteWorker(worker.id)}
                        >
                          {!invited
                            ? "Kviesti"
                            : invitationStatuses[worker.id] === "accepted"
                            ? "Priėmė"
                            : invitationStatuses[worker.id] === "declined"
                            ? "Atmetė"
                            : invitationStatuses[worker.id] === "expired"
                            ? "Užpildyta"
                            : "Pakviestas"}
                        </button>

                        {invitationByWorker[worker.id] && !worker.declinedInvitation && (
                          <button
                            className="ed-secondary ed-chat-alert-btn"
                            onClick={() =>
                              openEmployerPrivateConversation(
                                invitationByWorker[worker.id].id,
                                `${worker.name} · ${formatJobTitle(currentJob.title)}`
                              )
                            }
                          >
                            {planSummary?.can_job_chat
                              ? "Žinutė"
                              : "Žinutė · Business"}
                            {unreadEmployerPrivateChatNotifications(
                              invitationByWorker[worker.id].id
                            ).length > 0 && (
                              <span
                                className="ed-chat-alert"
                                title="Nauja privati žinutė"
                              >
                                {Math.min(
                                  9,
                                  unreadEmployerPrivateChatNotifications(
                                    invitationByWorker[worker.id].id
                                  ).length
                                )}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ed-empty">
                {workerSource === "team"
                  ? "Šiuo metu nė vienas darbuotojas iš favoritų neatitinka šio darbo vietos, laiko, prieinamumo ir kitų kriterijų."
                  : "Šiuo metu papildomų laisvų darbuotojų pagal šiuos kriterijus nerasta."}
              </div>
            )}
              </>
            )}

            <div className="ed-attendance-panel">
                <h2>Pasiūlymą priėmę darbuotojai</h2>
                <p className="ed-attendance-help">
                  Čia matote pasiūlymą priėmusius darbuotojus ir jų darbo dienos veiksmus.
                </p>

                <div className="ed-attendance-list">
                  {jobWorkersLoading && (
                    <div className="ed-empty"><SilentLoader size={20} minHeight={44} /></div>
                  )}
                  {!jobWorkersLoading && pagedAcceptedWorkers.map((worker) => {
                    const attendance = worker.attendance || {};
                    const ended = jobHasEnded(currentJob);
                    const checkInOpen = jobCheckInWindowOpen(currentJob);
                    const isConfirmed = worker.bookingStatus === "confirmed";
                    const pendingNegative =
                      !attendance.finalized_at &&
                      ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
                        attendance.employer_outcome
                      );
                    const disputed =
                      attendance.dispute_status === "disputed";
                    const canClose =
                      isConfirmed &&
                      ended &&
                      !attendance.finalized_at &&
                      !attendance.employer_outcome;

                    const employerNextStep =
                      currentJob.status === "cancelled"
                        ? {
                            tone: "",
                            title: "Darbas atšauktas",
                            text: "Papildomų veiksmų šiai darbo dienai nereikia.",
                          }
                        : attendance.finalized_at
                        ? attendance.dispute_status === "resolved_employer"
                          ? {
                              tone: "ok",
                              title: "Ginčas išspręstas jūsų naudai",
                              text:
                                attendance.resolution_note ||
                                "Administratorius patvirtino darbdavio pateiktą darbo dienos rezultatą.",
                            }
                          : attendance.dispute_status === "resolved_worker"
                          ? {
                              tone: "danger",
                              title: "Ginčas išspręstas ne jūsų naudai",
                              text:
                                attendance.resolution_note ||
                                "Administratorius ginčą išsprendė darbuotojo naudai.",
                            }
                          : attendance.final_outcome === "no_show"
                          ? {
                              tone: "ok",
                              title: "Darbo diena uždaryta",
                              text: "Užfiksuotas neatvykimas. Atskiro darbuotojo vertinimo šiuo atveju nėra.",
                            }
                          : !worker.rating && canRateCurrentJob
                          ? {
                              tone: "action",
                              title: "Kitas žingsnis – įvertinkite darbuotoją",
                              text: "Darbo diena užbaigta. Palikite 1–10 įvertinimą; vertinti gali tik už darbą atsakingas žmogus.",
                            }
                          : worker.rating &&
                            !savedWorkerIdSet.has(worker.id) &&
                            planSummary?.can_saved_workers
                          ? {
                              tone: "action",
                              title: "Darbo ciklas užbaigtas",
                              text: "Jei norite šį žmogų greitai kviesti ateityje, galite pridėti jį į favoritus.",
                            }
                          : {
                              tone: "ok",
                              title: "Darbo ciklas užbaigtas",
                              text: worker.rating
                                ? `Darbuotojas įvertintas ${worker.rating.score}/10.`
                                : "Galutinis darbo dienos rezultatas užfiksuotas.",
                            }
                        : disputed
                        ? {
                            tone: "danger",
                            title: "Laukiama administratoriaus sprendimo",
                            text: "Kol ginčas neišspręstas, darbuotojo reitingas ir galutinis rezultatas nekeičiami.",
                          }
                        : pendingNegative
                        ? {
                            tone: "action",
                            title: "Laukiama darbuotojo atsakymo",
                            text: "Jūs pateikėte darbo dienos rezultatą. Darbuotojas turi jį patvirtinti arba ginčyti.",
                          }
                        : canClose
                        ? {
                            tone: "action",
                            title: "Reikia uždaryti darbo dieną",
                            text: "Darbo laikas pasibaigė. Pasirinkite „Uždaryti dieną“ ir užfiksuokite rezultatą.",
                          }
                        : checkInOpen &&
                          isConfirmed &&
                          !attendance.employer_check_in_at
                        ? {
                            tone: "action",
                            title: "Patvirtinkite atvykimą",
                            text: attendance.worker_check_in_at
                              ? "Darbuotojas jau pažymėjo „Atvykau“. Jei jis objekte, patvirtinkite jo atvykimą."
                              : "Jei darbuotojas jau objekte, galite patvirtinti jo atvykimą.",
                          }
                        : attendance.employer_check_in_at
                        ? {
                            tone: "ok",
                            title: "Atvykimas patvirtintas",
                            text: "Po numatyto darbo laiko pabaigos čia atsiras darbo dienos uždarymo veiksmas.",
                          }
                        : {
                            tone: "",
                            title: "Darbas dar neprasidėjo",
                            text: "Atvykimą galėsite patvirtinti nuo 2 valandų prieš darbo pradžią.",
                          };

                    return (
                      <div
                        className="ed-attendance-row"
                        key={worker.bookingId}
                      >
                        <div className="ed-worker-id">
                          <div className="ed-worker-main">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <b>{worker.name}</b>
                              <MonthlyAwardMiniList
                                awards={workerAwardsById[worker.id] || []}
                                size={32}
                              />
                            </div>
                            <span>
                              {worker.city} · Atlikta darbų: {Number(worker.completedJobs || 0)}
                            </span>

                            <div className="ed-worker-status">
                              {attendance.worker_check_in_at && (
                                <span className="ed-attendance-badge green">
                                  ✓ Darbuotojas pažymėjo „Atvykau“
                                </span>
                              )}

                              {attendance.employer_check_in_at && (
                                <span className="ed-attendance-badge green">
                                  ✓ Atvykimą patvirtinote
                                </span>
                              )}

                              {attendance.finalized_at && (
                                <span
                                  className={`ed-attendance-badge ${
                                    attendance.final_outcome === "no_show" ||
                                    attendance.final_outcome ===
                                      "left_early_unexcused"
                                      ? "red"
                                      : "green"
                                  }`}
                                >
                                  {attendanceOutcomeLabel(attendance)}
                                  {attendance.worked_minutes > 0
                                    ? ` · ${formatWorkedMinutes(
                                        attendance.worked_minutes
                                      )}`
                                    : ""}
                                </span>
                              )}

                              {pendingNegative && !disputed && (
                                <span className="ed-attendance-badge orange">
                                  Laukiama darbuotojo patvirtinimo
                                </span>
                              )}

                              {disputed && (
                                <span className="ed-attendance-badge red">
                                  Ginčas · reitingas nekeičiamas
                                </span>
                              )}

                              {attendance.dispute_status === "resolved_employer" && (
                                <span className="ed-attendance-badge green">
                                  ✓ Ginčas išspręstas jūsų naudai
                                </span>
                              )}

                              {attendance.dispute_status === "resolved_worker" && (
                                <span className="ed-attendance-badge red">
                                  Ginčas išspręstas ne jūsų naudai
                                </span>
                              )}

                              {canClose && (
                                <span className="ed-attendance-badge orange">
                                  Neuždaryta darbo diena
                                </span>
                              )}

                              {!ended &&
                                isConfirmed &&
                                checkInOpen &&
                                !attendance.finalized_at &&
                                !attendance.employer_check_in_at && (
                                  <span className="ed-attendance-badge muted">
                                    Darbo diena vyksta
                                  </span>
                                )}
                            </div>

                            <div
                              className={`ed-next-step ${
                                employerNextStep.tone || ""
                              }`}
                            >
                              <b>{employerNextStep.title}</b>
                              {employerNextStep.text}
                            </div>
                          </div>
                        </div>

                        {canViewWorkerMetrics && (
                          <div className="ed-member-metrics">
                            <div className="ed-member-metric">
                              <span>Atvykimo patikimumas</span>
                              <b>{Math.round(worker.attendanceRate ?? 0)}%</b>
                            </div>

                            <div className="ed-member-metric">
                              <span>Darbdavių įvertinimas</span>
                              <b>
                                {worker.ratingAverage === null
                                  ? "—"
                                  : `${worker.ratingAverage.toFixed(1)} / 10`}
                              </b>
                            </div>
                          </div>
                        )}

                        <div className="ed-attendance-actions">
                          <button
                            className="ed-secondary"
                            onClick={() => openWorkerProfile(worker)}
                          >
                            Profilis
                          </button>

                          {disputed &&
                            attendance.id &&
                            attendance.employer_note?.trim() &&
                            attendance.worker_response_note?.trim() && (
                              <button
                                className="ed-secondary"
                                type="button"
                                onClick={() =>
                                  setDisputeConversation({
                                    attendanceId: attendance.id,
                                    title: `${formatJobTitle(currentJob.title)} · Ginčo aptarimas`,
                                    workerName: worker.name || "Darbuotojas",
                                    companyName: company?.name || "Darbdavys",
                                  })
                                }
                              >
                                Ginčo pokalbis
                              </button>
                            )}

                          {worker.invitationId && (
                            <button
                              className="ed-secondary ed-chat-alert-btn"
                              onClick={() =>
                                openEmployerPrivateConversation(
                                  worker.invitationId,
                                  `${worker.name} · ${formatJobTitle(currentJob.title)}`
                                )
                              }
                            >
                              {planSummary?.can_job_chat
                                ? "Privati žinutė"
                                : "Privati žinutė · Business"}
                              {unreadEmployerPrivateChatNotifications(
                                worker.invitationId
                              ).length > 0 && (
                                <span
                                  className="ed-chat-alert"
                                  title="Nauja privati žinutė"
                                >
                                  {Math.min(
                                    9,
                                    unreadEmployerPrivateChatNotifications(
                                      worker.invitationId
                                    ).length
                                  )}
                                </span>
                              )}
                            </button>
                          )}

                          {checkInOpen &&
                            isConfirmed &&
                            !attendance.finalized_at &&
                            !attendance.employer_check_in_at && (
                              <button
                                className="ed-secondary"
                                disabled={attendanceSaving}
                                onClick={() => openEmployerCheckIn(worker)}
                              >
                                Patvirtinti atvykimą
                              </button>
                            )}

                          {canClose && (
                            <button
                              className="ed-primary"
                              disabled={attendanceSaving}
                              title="Uždaryti šio darbuotojo darbo dieną"
                              onClick={() => {
                                setAttendanceTarget(worker);
                                setAttendanceMode("choose");
                                setAttendanceEndTime("");
                                setAttendanceNote("");
                              }}
                            >
                              Uždaryti dieną
                            </button>
                          )}

                          {attendance.finalized_at &&
                            attendance.final_outcome !== "no_show" &&
                            !worker.rating &&
                            canRateCurrentJob && (
                              <button
                                className="ed-primary lt-existing-primary-wide"
                                onClick={() => openWorkerRating(worker)}
                              >
                                Įvertinti
                              </button>
                            )}

                          {attendance.finalized_at &&
                            attendance.final_outcome !== "no_show" &&
                            (savedWorkerIdSet.has(worker.id) ? (
                              <button
                                className="ed-team-add saved"
                                type="button"
                                aria-disabled="true"
                              >
                                Favorituose
                              </button>
                            ) : (
                              <button
                                className="ed-team-add"
                                type="button"
                                disabled={savedWorkerBusy === worker.id}
                                onClick={() => saveWorkerToTeam(worker)}
                              >
                                {savedWorkerBusy === worker.id
                                  ? "Pridedama..."
                                  : planSummary?.can_saved_workers
                                  ? "Pridėti į favoritus"
                                  : "Pridėti į favoritus · Business"}
                              </button>
                            ))}

                          {canViewWorkerMetrics &&
                            attendance.finalized_at &&
                            attendance.final_outcome !== "no_show" &&
                            !worker.rating &&
                            !canRateCurrentJob && (
                              <span className="ed-attendance-badge muted">
                                Vertina atsakingas:{" "}
                                {teamMemberName(currentJobResponsibleUserId)}
                              </span>
                            )}

                          {worker.rating && (
                            <span className="ed-attendance-badge green">
                              Įvertinta {worker.rating.score}/10
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!jobWorkersLoading && jobWorkers.length === 0 && (
                  <div className="ed-empty">
                    Šiuo metu pasiūlymo dar nepriėmė nė vienas darbuotojas.
                  </div>
                )}
                <DashboardPagination
                  page={acceptedWorkersPage}
                  totalItems={jobWorkersLoading ? 0 : jobWorkers.length}
                  pageSize={DASHBOARD_PAGE_SIZE}
                  onPageChange={setAcceptedWorkersPage}
                />
              </div>

            {declinedCandidateWorkers.length > 0 &&
              !["completed", "cancelled"].includes(currentJob?.status) && (
              <div className="ed-attendance-panel ed-declined-workers-panel">
                <h2>Pasiūlymo atsisakę darbuotojai</h2>
                <p className="ed-attendance-help">
                  Šie darbuotojai atsisakė šio darbo pasiūlymo ir negali būti pakviesti pakartotinai tik į šį konkretų pasiūlymą. Į kitus darbo pasiūlymus juos galima kviesti įprastai, jei jie atitinka kriterijus.
                </p>
                <div className="ed-results">
                  {pagedDeclinedWorkers.map((worker) => (
                    <div
                      className={
                        canViewWorkerMetrics
                          ? "ed-worker declined-worker"
                          : "ed-worker ed-worker-basic declined-worker"
                      }
                      key={worker.id}
                    >
                      <div className="ed-worker-id">
                        <div className="ed-avatar">
                          {worker.avatarUrl ? (
                            <img src={worker.avatarUrl} alt={worker.name} />
                          ) : (
                            worker.initials
                          )}
                        </div>
                        <MonthlyAwardMiniList
                          awards={workerAwardsById[worker.id] || []}
                          size={42}
                        />
                        <div>
                          <b>{worker.name}</b>
                          <span>
                            {worker.city} · Atlikta darbų: {Number(worker.completedJobs || 0)}
                            {workerDistanceLabel(worker)
                              ? ` · ${workerDistanceLabel(worker)}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      {canViewWorkerMetrics && (
                        <>
                          <div className="ed-worker-activity">
                            <span className="ed-attendance-badge red">
                              Atsisakė pasiūlymo
                            </span>
                          </div>
                          <div className="ed-metric">
                            <b>{Math.round(worker.attendanceRate ?? 0)}%</b>
                            <span>atvykimas</span>
                          </div>
                        </>
                      )}

                      <div className="ed-worker-actions">
                        <button
                          className="ed-secondary"
                          onClick={() => openWorkerProfile(worker)}
                        >
                          Profilis
                        </button>
                        <button
                          className="ed-invite sent declined"
                          type="button"
                          disabled
                        >
                          Atmetė
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <DashboardPagination
                  page={declinedWorkersPage}
                  totalItems={declinedCandidateWorkers.length}
                  pageSize={DASHBOARD_PAGE_SIZE}
                  onPageChange={setDeclinedWorkersPage}
                />
              </div>
            )}

          </section>
        )}

        <div data-wv="active" style={{ display: "contents" }}>
          <PageHead title="Aktyvūs darbai" lead={jobScope === "mine" ? "Darbai, už kuriuos esate atsakingas" : "Visi įmonės darbai"}>
            <div className="toggle2" role="group" aria-label="Darbų apimtis" style={{ minWidth: 280 }}>
              <button type="button" aria-pressed={jobScope === "mine"} onClick={() => setJobScope("mine")}>Mano darbai</button>
              <button type="button" aria-pressed={jobScope === "all"} onClick={() => setJobScope("all")}>Visi įmonės darbai</button>
            </div>
          </PageHead>
          {activeVisibleJobs.length ? (() => {
            const sorted = activeVisibleJobs.slice().sort((a, b) => `${a.work_date}${a.start_time}`.localeCompare(`${b.work_date}${b.start_time}`));
            const need = sorted.filter((job) => ["danger", "action"].includes(employerJobDashboardState(job)?.tone));
            const rest = sorted.filter((job) => !["danger", "action"].includes(employerJobDashboardState(job)?.tone));
            const card = (job) => <EmployerJobCard key={job.id} job={job} state={employerJobDashboardState(job)} unread={unreadEmployerGroupChatNotifications(job.id).length} responsibleLabel={(job.responsible_user_id || job.created_by) === user.id ? "Jūsų darbas" : teamMemberName(job.responsible_user_id || job.created_by)} onOpen={() => openExistingJob(job)} />;
            return (
              <>
                {need.length ? <ListGroup title="Reikia jūsų veiksmo" count={need.length} hot><Paged items={need} render={card} /></ListGroup> : null}
                {rest.length ? <ListGroup title="Vyksta ir suplanuoti" count={rest.length}><Paged items={rest} render={card} /></ListGroup> : null}
              </>
            );
          })() : (
            <section className="card"><Empty title="Aktyvių darbų nėra" sub="Sukurkite darbo pasiūlymą – jis atsiras čia." icon="jobs" /></section>
          )}
        </div>

        <div data-wv="ended" style={{ display: "contents" }}>
          <PageHead title="Pasibaigę darbai" lead="Užbaigti ir atšaukti darbai bus saugomi čia. Galite vėl atidaryti ankstesnį poreikį." />
          <section className="card">
            {employerJobHistory.length ? (
              <Paged items={employerJobHistory} render={(job) => {
                const state = employerJobDashboardState(job);
                return (
                  <article key={job.id} className="job" tabIndex={0} role="link" onClick={() => (job.status === "completed" ? openJobInformation(job) : openExistingJob(job))}>
                    <div className="jm">
                      <div className="jtop"><h3>{String(job.title || "").toLocaleUpperCase("lt-LT")}</h3><div className="row jpills"><Pill tone={job.status === "cancelled" ? "red" : state?.missing ? "orange" : "green"}>{job.status === "cancelled" ? "Atšaukta" : state?.missing ? "Trūko darbuotojų" : "Įvykdyta"}</Pill></div></div>
                      <div className="metrics"><span>{job.work_date} · {job.start_time?.slice(0, 5)}</span><span>{(job.responsible_user_id || job.created_by) === user.id ? "Jūsų darbas" : teamMemberName(job.responsible_user_id || job.created_by)}</span></div>
                    </div>
                    <span className="jgo" aria-hidden="true">›</span>
                  </article>
                );
              }} />
            ) : <Empty title="Darbų istorija tuščia" sub="Užbaigti ir atšaukti darbai bus saugomi čia." />}
          </section>
        </div>

        <section className="ed-card ed-active-jobs-section" data-wv="legacy">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ marginBottom: 6 }}>Aktyvūs darbai</h2>
              <p className="ed-sub">
                {planSummary?.can_team_management
                  ? jobScope === "mine"
                    ? "Rodomi tik darbai, už kuriuos esate atsakingas."
                    : "Rodomi visi aktyvūs įmonės darbai."
                  : "Galite vėl atidaryti ankstesnį poreikį ir patikrinti, kas dabar laisvas."}
              </p>
            </div>

            {canSeeAllCompanyJobs && (
              <div className="ed-job-scope">
                <button
                  className={jobScope === "mine" ? "active" : ""}
                  type="button"
                  onClick={() => setJobScope("mine")}
                >
                  Mano darbai
                </button>
                <button
                  className={jobScope === "all" ? "active" : ""}
                  type="button"
                  onClick={() => setJobScope("all")}
                >
                  Visi įmonės darbai
                </button>
              </div>
            )}
          </div>

          {activeVisibleJobs.length ? (
            <>
              <div className="ed-job-overview">
                <div
                  className={`ed-job-overview-card ${
                    dashboardActionJobs ? "danger" : ""
                  }`}
                >
                  <span>Reikia veiksmo</span>
                  <b>{dashboardActionJobs}</b>
                </div>

                <div
                  className={`ed-job-overview-card ${
                    dashboardMissingWorkers ? "alert" : ""
                  }`}
                >
                  <span>Trūksta žmonių</span>
                  <b>{dashboardMissingWorkers}</b>
                </div>

                <div
                  className={`ed-job-overview-card ${
                    dashboardTodayJobs ? "live" : ""
                  }`}
                >
                  <span>Šiandienos darbai</span>
                  <b>{dashboardTodayJobs}</b>
                </div>

                <div
                  className={`ed-job-overview-card ${
                    dashboardUnreadMessages ? "alert" : ""
                  }`}
                >
                  <span>Naujos žinutės</span>
                  <b>{dashboardUnreadMessages}</b>
                </div>
              </div>

              {isEmployerPhoneLayout && employerActiveMobileTotal > 1 && (
                <div className="ed-active-carousel-nav">
                  <button
                    type="button"
                    aria-label="Ankstesnis aktyvus darbas"
                    onClick={() =>
                      setEmployerActiveMobileIndex((current) =>
                        (current - 1 + employerActiveMobileTotal) %
                        employerActiveMobileTotal
                      )
                    }
                  >
                    ‹
                  </button>
                  <div>
                    <b>Aktyvus darbas</b>
                    <span>{safeEmployerActiveMobileIndex + 1} / {employerActiveMobileTotal}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Kitas aktyvus darbas"
                    onClick={() =>
                      setEmployerActiveMobileIndex((current) =>
                        (current + 1) % employerActiveMobileTotal
                      )
                    }
                  >
                    ›
                  </button>
                </div>
              )}

              <div className="ed-jobs">
              {activeJobsForRender.map((job) => {
                const unreadNonMessageNews = unreadEmployerNotifications(job.id).filter(
                  (item) =>
                    item.event_type !== "message" &&
                    item.event_type !== "invitation_declined"
                );
                const newsPresentation = notificationPresentation(unreadNonMessageNews);
                const unreadGroupMessages =
                  unreadEmployerGroupChatNotifications(job.id);
                const jobDashboardState = employerJobDashboardState(job);

                return (
                  <div
                    className={[
                      "ed-job",
                      currentJob?.id === job.id ? "ed-job-active" : "",
                      jobDashboardState.tone === "danger"
                        ? "ed-job-priority-danger"
                        : jobDashboardState.tone === "action"
                        ? "ed-job-priority-action"
                        : jobDashboardState.tone === "live"
                        ? "ed-job-priority-live"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={job.id}
                  >
                    <b className="ed-job-date">{job.work_date}</b>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <b>{formatJobTitle(job.title)}</b>
                        {currentJob?.id === job.id && (
                          <span className="ed-opened-badge">Atidarytas</span>
                        )}
                      </div>
                      {(planSummary?.can_team_management ||
                        Number(job.declinedInvitationCount || 0) > 0 ||
                        Number(job.employerWonDisputes || 0) > 0 ||
                        Number(job.workerWonDisputes || 0) > 0) && (
                        <div className="ed-job-responsibility-line">
                          {planSummary?.can_team_management && (
                            <span className="ed-responsible">
                              Atsakingas:{" "}
                              <span className="ed-responsible-name">
                                {teamMemberName(
                                  job.responsible_user_id || job.created_by
                                )}
                              </span>
                            </span>
                          )}
                          {Number(job.declinedInvitationCount || 0) > 0 && (
                            <span className="ed-attendance-badge red">
                              Darbuotojų atsisakė · {Number(job.declinedInvitationCount || 0)}
                            </span>
                          )}
                          {Number(job.employerWonDisputes || 0) > 0 && (
                            <span className="ed-attendance-badge green">
                              ✓ Ginčas išspręstas jūsų naudai
                              {Number(job.employerWonDisputes || 0) > 1
                                ? ` · ${job.employerWonDisputes}`
                                : ""}
                            </span>
                          )}
                          {Number(job.workerWonDisputes || 0) > 0 && (
                            <span className="ed-attendance-badge red">
                              Ginčas išspręstas ne jūsų naudai
                              {Number(job.workerWonDisputes || 0) > 1
                                ? ` · ${job.workerWonDisputes}`
                                : ""}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ color: "#6c7a88", fontSize: 13 }}>
                        {job.city} · {job.start_time?.slice(0, 5)}
                      </div>
                      {jobHasEnded(job) &&
                        Number(job.confirmedCount || 0) > 0 &&
                        !["cancelled", "completed"].includes(job.status) && (
                          <div style={{ marginTop: 7 }}>
                            <span className="ed-attendance-badge orange">
                              {jobDashboardState.key === "action"
                                ? "Neuždaryta darbo diena · patvirtinkite rezultatą"
                                : jobDashboardState.label}
                            </span>
                          </div>
                        )}
                      {unreadNonMessageNews.length > 0 && (
                        <div className="ed-news">
                          <span className={`rs-alert ${newsPresentation.tone}`}>
                            {newsPresentation.label}
                            {unreadNonMessageNews.length > 1
                              ? ` · ${unreadNonMessageNews.length}`
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="ed-progress">
                      {job.confirmedCount || 0}/{job.workers_needed} patvirtinti
                    </span>

                    <div className="ed-job-state-cell">
                      <span
                        className={`ed-job-state ${jobDashboardState.tone}`}
                      >
                        {jobDashboardState.label}
                      </span>
                      {jobDashboardState.detail && (
                        <span className="ed-job-state-detail">
                          {jobDashboardState.detail}
                        </span>
                      )}
                    </div>

                    <div className={`ed-job-actions ${job.status === "completed" ? "single" : ""}`}>
                      {job.status === "completed" ? (
                        <button
                          type="button"
                          onClick={() => openJobInformation(job)}
                        >
                          Darbo informacija
                        </button>
                      ) : (
                        <>
                          <button onClick={() => openExistingJob(job)}>
                            Atidaryti
                          </button>

                          <button
                            className={`ed-job-chat-btn ${
                              unreadGroupMessages.length ? "has-unread" : ""
                            }`}
                            type="button"
                            onClick={() => openEmployerGroupConversation(job)}
                          >
                            {planSummary?.can_job_chat
                              ? "Darbo pokalbis"
                              : "Darbo pokalbis · Business"}
                            {unreadGroupMessages.length > 0 && (
                              <span className="ed-job-chat-new">
                                {Math.min(9, unreadGroupMessages.length)}
                              </span>
                            )}
                          </button>

                          {job.status !== "cancelled" && (
                            <button onClick={() => startEditJob(job)}>
                              Redaguoti
                            </button>
                          )}
                          {job.status !== "cancelled" && (
                            <button
                              className="ed-danger"
                              onClick={() => requestRemoveOrCancelJob(job)}
                            >
                              {job.confirmedCount > 0 ? "Atšaukti" : "Ištrinti"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
              {!isEmployerPhoneLayout && (
                <DashboardPagination
                  page={employerActivePage}
                  totalItems={activeVisibleJobs.length}
                  onPageChange={setEmployerActivePage}
                />
              )}
            </>
          ) : (
            <div className="ed-jobs-empty">
              <div className="ed-jobs-empty-icon">+</div>
              <div>
                <b>Aktyvių darbų nėra</b>
                <span>
                  {planSummary?.can_team_management && jobScope === "mine"
                    ? "Kai jums bus priskirtas aktyvus darbas, jis atsiras čia."
                    : "Aktyvūs įmonės darbai atsiras šiame sąraše."}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="ed-card" data-wv="legacy">
          <div>
            <h2 style={{ marginBottom: 6 }}>Pasibaigę darbai</h2>
          </div>

          {employerJobHistory.length ? (
            <>
            {isEmployerPhoneLayout && employerHistoryMobileTotal > 1 && (
              <div className="ed-active-carousel-nav">
                <button
                  type="button"
                  aria-label="Naujesnis istorijos darbas"
                  onClick={() =>
                    setEmployerHistoryMobileIndex((current) =>
                      (current - 1 + employerHistoryMobileTotal) %
                      employerHistoryMobileTotal
                    )
                  }
                >
                  ‹
                </button>
                <div>
                  <b>Darbų istorija</b>
                  <span>{safeEmployerHistoryMobileIndex + 1} / {employerHistoryMobileTotal}</span>
                </div>
                <button
                  type="button"
                  aria-label="Senesnis istorijos darbas"
                  onClick={() =>
                    setEmployerHistoryMobileIndex((current) =>
                      (current + 1) % employerHistoryMobileTotal
                    )
                  }
                >
                  ›
                </button>
              </div>
            )}
            <div className="ed-jobs">
              {employerHistoryForRender.map((job) => {
                const jobDashboardState = employerJobDashboardState(job);

                return (
                  <div className="ed-job ed-job-history" key={`history-${job.id}`}>
                    <b className="ed-job-date">{job.work_date}</b>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <b>{formatJobTitle(job.title)}</b>
                      </div>
                      {(planSummary?.can_team_management ||
                        Number(job.employerWonDisputes || 0) > 0 ||
                        Number(job.workerWonDisputes || 0) > 0) && (
                        <div className="ed-job-responsibility-line">
                          {planSummary?.can_team_management && (
                            <span className="ed-responsible">
                              Atsakingas:{" "}
                              <span className="ed-responsible-name">
                                {teamMemberName(
                                  job.responsible_user_id || job.created_by
                                )}
                              </span>
                            </span>
                          )}
                          {Number(job.employerWonDisputes || 0) > 0 && (
                            <span className="ed-attendance-badge green">
                              ✓ Ginčas išspręstas jūsų naudai
                              {Number(job.employerWonDisputes || 0) > 1
                                ? ` · ${job.employerWonDisputes}`
                                : ""}
                            </span>
                          )}
                          {Number(job.workerWonDisputes || 0) > 0 && (
                            <span className="ed-attendance-badge red">
                              Ginčas išspręstas ne jūsų naudai
                              {Number(job.workerWonDisputes || 0) > 1
                                ? ` · ${job.workerWonDisputes}`
                                : ""}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ color: "#6c7a88", fontSize: 13 }}>
                        {job.city} · {job.start_time?.slice(0, 5)}
                      </div>
                    </div>

                    <span className="ed-progress">
                      {job.status === "completed" || job.status === "cancelled"
                        ? `${Number(job.historicalAcceptedCount || 0)}/${job.workers_needed} buvo priėmę darbą`
                        : `${Number(job.confirmedCount || 0)}/${job.workers_needed} patvirtinti`}
                    </span>

                    <div className="ed-job-state-cell">
                      <span className={`ed-job-state ${jobDashboardState.tone}`}>
                        {jobDashboardState.label}
                      </span>
                      {jobDashboardState.detail && (
                        <span className="ed-job-state-detail">
                          {jobDashboardState.detail}
                        </span>
                      )}
                    </div>

                    <div className={`ed-job-actions ${job.status === "completed" ? "" : "single"}`}>
                      <button
                        type="button"
                        onClick={() => openJobInformation(job)}
                      >
                        Darbo informacija
                      </button>
                      {job.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => openExistingJob(job)}
                        >
                          Darbuotojai ir įvertinimai
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!isEmployerPhoneLayout && (
              <DashboardPagination
                page={employerHistoryPage}
                totalItems={employerJobHistory.length}
                onPageChange={setEmployerHistoryPage}
              />
            )}
            </>
          ) : (
            <div className="ed-jobs-empty">
              <div className="ed-jobs-empty-icon">✓</div>
              <div>
                <b>Darbų istorija tuščia</b>
                <span>Užbaigti ir atšaukti darbai bus saugomi čia.</span>
              </div>
            </div>
          )}
        </section>
        </div>
      </main>

      <ArrivalTimeDialog
        open={Boolean(employerCheckInTarget)}
        title="Kada darbuotojas faktiškai atvyko?"
        subject={employerCheckInTarget ? `${employerCheckInTarget.name} · ${formatJobTitle(currentJob?.title || "Darbas")}` : ""}
        scheduledTime={currentJob?.start_time?.slice(0, 5) || ""}
        value={employerCheckInTime}
        onChange={setEmployerCheckInTime}
        busy={attendanceSaving}
        onClose={() => {
          if (attendanceSaving) return;
          setEmployerCheckInTarget(null);
          setEmployerCheckInTime("");
        }}
        onConfirm={() => employerCheckInWorker(employerCheckInTarget, employerCheckInTime)}
      />

      {attendanceTarget && attendanceMode && (
        <div
          className="ed-attendance-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9600,
            background: "rgba(34,38,49,.64)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !attendanceSaving) {
              setAttendanceTarget(null);
              setAttendanceMode(null);
              setAttendanceEndTime("");
              setAttendanceNote("");
            }
          }}
        >
          <div
            className="ed-attendance-modal"
            style={{
              width: "min(560px, 100%)",
              maxHeight: "calc(100dvh - 40px)",
              overflow: "auto",
              background: "#fff",
              borderRadius: 20,
              padding: 22,
              boxShadow: "0 30px 100px rgba(34,38,49,.32)",
              color: "#222631",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Darbo dienos uždarymas"
          >
            <div className="ed-attendance-head">
              <div>
                <div className="eyebrow">DARBO DIENOS UŽDARYMAS</div>
                <h2>
                  {attendanceMode === "choose"
                    ? "Kaip baigėsi darbuotojo darbo diena?"
                    : attendanceMode === "full_day"
                    ? "Įvertinkite darbuotoją ir uždarykite dieną"
                    : attendanceMode === "no_show"
                    ? "Pažymėti, kad darbuotojas neatvyko?"
                    : "Darbuotojas išėjo anksčiau"}
                </h2>
              </div>

              <button
                className="ed-attendance-close"
                aria-label="Uždaryti darbo dienos formą"
                disabled={attendanceSaving}
                onClick={() => {
                  setAttendanceTarget(null);
                  setAttendanceMode(null);
                  setAttendanceEndTime("");
                  setAttendanceNote("");
                }}
              >
                <CloseMark />
              </button>
            </div>

            {attendanceError && (
              <div className="ed-error" role="alert">{attendanceError}</div>
            )}

            <div className="ed-attendance-person">
              <b>{attendanceTarget.name}</b>
              <span>
                {currentJob?.title} · {currentJob?.work_date}
              </span>
            </div>

            {attendanceMode === "choose" && (
              <div className="ed-attendance-choice">
                <button
                  className="ed-primary"
                  disabled={attendanceSaving || !canRateCurrentJob}
                  onClick={() => setAttendanceMode("full_day")}
                >
                  Išdirbo visą dieną
                </button>

                <button
                  className="ed-secondary"
                  disabled={attendanceSaving || !canRateCurrentJob}
                  onClick={() => {
                    setAttendanceMode("left_early_agreed");
                    setAttendanceEndTime("");
                    setAttendanceNote("");
                  }}
                >
                  Išėjo anksčiau
                </button>

                {!attendanceTarget?.attendance?.employer_check_in_at && (
                  <button
                    className="ed-secondary ed-danger"
                    disabled={attendanceSaving}
                    onClick={() => {
                      setAttendanceMode("no_show");
                      setAttendanceEndTime("");
                      setAttendanceNote("");
                    }}
                  >
                    Neatvyko
                  </button>
                )}
              </div>
            )}

            {["left_early_agreed", "left_early_unexcused"].includes(attendanceMode) && (
                <>
                  <div className="ed-label" style={{ marginBottom: 14 }}>
                    Ankstyvo išėjimo tipas *
                    <RoundedSelect
                      ariaLabel="Ankstyvo išėjimo tipas"
                      value={attendanceMode}
                      onChange={setAttendanceMode}
                      options={[{ value: "left_early_agreed", label: "Išėjo anksčiau – suderinta" }, { value: "left_early_unexcused", label: "Išėjo anksčiau be pateisinamos priežasties" }]}
                    />
                  </div>

                  <label className="ed-label" style={{ marginBottom: 14 }}>
                    Faktinis išėjimo laikas *
                    <RoundedTimeSelect
                      ariaLabel="Faktinis išėjimo laikas"
                      className="ed-input wd-time-trigger"
                      value={attendanceEndTime}
                      onChange={setAttendanceEndTime}
                    />
                  </label>
                </>
              )}

            {attendanceMode !== "choose" && (
              <>
                {attendanceMode !== "no_show" && (
                  <>
                    <div className="ed-label">Darbuotojo įvertinimas *</div>
                    <div className="ed-rating-scores" style={{ marginBottom: 16 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          className={Number(attendanceScore) === score ? "ed-primary" : "ed-secondary"}
                          disabled={attendanceSaving}
                          aria-pressed={Number(attendanceScore) === score}
                          onClick={() => setAttendanceScore(score)}
                        >{score}</button>
                      ))}
                    </div>
                    <label className="ed-label" style={{ marginBottom: 14 }}>
                      Komentaras apie darbuotoją
                      <textarea className="ed-textarea" maxLength={1000}
                        value={attendanceRatingComment}
                        disabled={attendanceSaving}
                        onChange={(e) => setAttendanceRatingComment(e.target.value)}
                        placeholder="Pvz. gerai atliko užduotis, buvo punktualus..." />
                    </label>
                    <ReviewConductNotice />
                  </>
                )}
                {attendanceMode !== "full_day" && (
                <label className="ed-label">
                  {attendanceMode === "left_early_agreed"
                    ? "Pastaba"
                    : "Paaiškinimas *"}
                  <textarea
                    className="ed-textarea"
                    maxLength={1000}
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder={
                      attendanceMode === "no_show"
                        ? "Trumpai parašykite, kodėl pažymite neatvykimą."
                        : attendanceMode === "left_early_unexcused"
                        ? "Trumpai aprašykite, kas įvyko."
                        : "Pvz. Išėjimas buvo suderintas iš anksto."
                    }
                  />
                </label>
                )}

                {["no_show", "left_early_unexcused"].includes(
                  attendanceMode
                ) && (
                  <div className="ed-note err" style={{ marginTop: 14 }}>
                    Šis neigiamas pažymėjimas{" "}
                    <b>darbuotojo reitingo iškart nemažina</b>. Darbuotojas
                    galės jį patvirtinti arba ginčyti.
                  </div>
                )}

                {attendanceMode === "left_early_agreed" && (
                  <div className="ed-note ok" style={{ marginTop: 14 }}>
                    Suderintas ankstyvas išėjimas darbuotojo patikimumo
                    nemažina. Į statistiką bus įskaitytas tik faktiškai dirbtas
                    laikas.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 9,
                    marginTop: 18,
                  }}
                >
                  <button
                    className="ed-secondary"
                    disabled={attendanceSaving}
                    onClick={() => {
                      setAttendanceMode("choose");
                      setAttendanceEndTime("");
                      setAttendanceNote("");
                    }}
                  >
                    Grįžti
                  </button>

                  <button
                    className={
                      ["no_show", "left_early_unexcused"].includes(
                        attendanceMode
                      )
                        ? "ed-secondary ed-danger"
                        : "ed-primary"
                    }
                    disabled={
                      attendanceSaving ||
                      (attendanceMode !== "no_show" && !attendanceScore) ||
                      (["left_early_agreed", "left_early_unexcused"].includes(attendanceMode) && !attendanceEndTime) ||
                      (["no_show", "left_early_unexcused"].includes(
                        attendanceMode
                      ) &&
                        attendanceNote.trim().length < 5)
                    }
                    onClick={() =>
                      recordEmployerAttendance(
                        attendanceTarget,
                        attendanceMode,
                        attendanceEndTime || null,
                        attendanceNote
                      )
                    }
                  >
                    {attendanceSaving
                      ? "Saugoma..."
                      : attendanceMode === "full_day"
                      ? "Išsaugoti įvertinimą ir uždaryti dieną"
                      : "Patvirtinti rezultatą"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {ratingTarget && (
        <div
          className="ed-rating-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9700,
            background: "rgba(34,38,49,.64)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !ratingSaving) {
              setRatingTarget(null);
              setRatingScore(null);
              setRatingComment("");
            }
          }}
        >
          <div
            className="ed-rating-modal"
            style={{
              width: "min(620px, 100%)",
              maxHeight: "calc(100dvh - 40px)",
              overflow: "auto",
              background: "#fff",
              borderRadius: 20,
              padding: 22,
              boxShadow: "0 30px 100px rgba(34,38,49,.32)",
              color: "#222631",
            }}
          >
            <div className="ed-rating-head">
              <div>
                <div className="eyebrow">DARBUOTOJO ĮVERTINIMAS</div>
                <h2>Kaip įvertintumėte {ratingTarget.name}?</h2>
                <div style={{ color: "#6c7a88", marginTop: 5, fontSize: 13 }}>
                  {ratingTarget.jobTitle} · {ratingTarget.workDate}
                </div>
                <div style={{ color: "#6c7a88", marginTop: 5, fontSize: 13 }}>
                  Pasirinkite bendrą įvertinimą nuo 1 iki 10. Vertinimą ir
                  komentarą paliekate kaip už šį darbą atsakingas žmogus.
                </div>
              </div>
              <button
                className="ed-rating-close"
                disabled={ratingSaving}
                onClick={() => {
                  setRatingTarget(null);
                  setRatingScore(null);
                  setRatingComment("");
                }}
              >
                <CloseMark />
              </button>
            </div>

            {ratingError && <div className="ed-error" role="alert">{ratingError}</div>}

            <ReviewConductNotice />

            <div style={{ marginBottom: 16 }}>
              <div className="ed-rating-scores">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={
                      Number(ratingScore) === score
                        ? "ed-primary"
                        : "ed-secondary"
                    }
                    style={{ minWidth: 46 }}
                    onClick={() => setRatingScore(score)}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <label className="ed-label">
              Komentaras apie darbuotoją
              <textarea
                className="ed-textarea"
                maxLength={1000}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Pvz. punktualus, gerai atliko užduotis, lengva susitarti..."
              />
            </label>

            <div className="ed-rating-actions">
              <button
                className="ed-secondary"
                disabled={ratingSaving}
                onClick={() => {
                  setRatingTarget(null);
                  setRatingScore(null);
                  setRatingComment("");
                }}
              >
                Grįžti
              </button>
              <button
                className="ed-primary"
                disabled={ratingSaving || !ratingScore}
                onClick={submitWorkerRating}
              >
                {ratingSaving ? "Saugoma..." : "Išsaugoti įvertinimą"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeam && (
        <div
          className="ed-team-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !teamActionBusy) {
              setShowTeam(false);
            }
          }}
        >
          <div className="ed-team-modal">
            <div className="ed-team-head">
              <div>
                <div className="eyebrow">BUSINESS PRO · ĮMONĖS KOMANDA</div>
                <h2>{company?.name} komanda</h2>
                <p>
                  Kiekvienas žmogus jungiasi savo el. paštu. Darbai ir žinutės
                  lieka aiškiai priskirti konkrečiam įmonės atstovui.
                </p>
                <span className="ed-team-seat">
                  Panaudota {usedTeamSeats} iš 5 komandos vietų
                </span>
              </div>

              <button
                className="rs-close"
                type="button"
                disabled={teamActionBusy}
                onClick={() => setShowTeam(false)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="ed-team-layout">
              <div className="ed-team-panel">
                <h3>Komandos nariai</h3>
                <p>
                  Savininkas ir vadovas gali matyti visus įmonės darbus.
                  Vadybininkas pagal nutylėjimą dirba tik su savo darbais.
                </p>

                {teamLoading ? (
                  <div className="ed-empty compact"><SilentLoader size={18} minHeight={38} /></div>
                ) : activeTeamMembers.length ? (
                  <div className="ed-team-list">
                    {activeTeamMembers.map((member) => (
                      <div className="ed-team-member" key={member.user_id}>
                        <div>
                          <b>
                            {member.display_name}
                            {member.user_id === user.id ? " · Jūs" : ""}
                          </b>
                          <span>{member.email}</span>
                          <span>
                            {companyTeamRoleLabel(member.member_role)} ·{" "}
                            {Number(member.jobs_responsible || 0)} atsakingi darbai
                          </span>
                        </div>

                        <div className="ed-team-member-actions">
                          {companyMemberRole === "owner" &&
                          member.member_role !== "owner" ? (
                            <>
                              <RoundedSelect
                                className="ed-team-role-select"
                                ariaLabel={`${member.display_name} rolė`}
                                value={member.member_role}
                                disabled={teamActionBusy}
                                onChange={(value) =>
                                  changeTeamMemberRole(
                                    member,
                                    value
                                  )
                                }
                                options={[{ value: "manager", label: "Vadovas" }, { value: "recruiter", label: "Vadybininkas" }]}
                              />

                              <button
                                className="ed-team-remove"
                                type="button"
                                disabled={teamActionBusy}
                                onClick={() => removeTeamMember(member)}
                              >
                                Pašalinti
                              </button>
                            </>
                          ) : (
                            <span
                              className="ed-opened-badge"
                              style={{ margin: 0 }}
                            >
                              {companyTeamRoleLabel(member.member_role)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ed-empty compact">Komandos narių nerasta.</div>
                )}
              </div>

              <div className="ed-team-panel">
                {companyMemberRole === "owner" ? (
                  <>
                    <h3>Pakviesti žmogų</h3>
                    <p>
                      Įveskite vardą ir asmeninį darbo el. paštą, tada
                      pasirinkite, kiek teisių žmogui reikia. Sukursime
                      vienkartinę 7 dienas galiojančią registracijos nuorodą.
                    </p>

                    <div className="ed-team-invite-form">
                      <label className="ed-label">
                        Vardas
                        <input
                          className="ed-input"
                          value={teamInviteForm.displayName}
                          maxLength={120}
                          onChange={(e) =>
                            setTeamInviteForm((current) => ({
                              ...current,
                              displayName: e.target.value,
                            }))
                          }
                          placeholder="Pvz. Tomas"
                        />
                      </label>

                      <label className="ed-label">
                        El. paštas
                        <input
                          className="ed-input"
                          type="email"
                          value={teamInviteForm.email}
                          onChange={(e) =>
                            setTeamInviteForm((current) => ({
                              ...current,
                              email: e.target.value,
                            }))
                          }
                          placeholder="tomas@imone.lt"
                        />
                      </label>

                      <div>
                        <span className="ed-team-role-title">
                          Pasirinkite žmogaus rolę
                        </span>

                        <div className="ed-team-role-grid">
                          <button
                            className={`ed-team-role-card ${
                              teamInviteForm.memberRole === "recruiter"
                                ? "active"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setTeamInviteForm((current) => ({
                                ...current,
                                memberRole: "recruiter",
                              }))
                            }
                          >
                            <b>
                              Vadybininkas
                              {teamInviteForm.memberRole === "recruiter" && (
                                <span>Pasirinkta</span>
                              )}
                            </b>
                            <p>
                              Skirtas žmogui, kuris pats kuria ir prižiūri savo
                              darbo pasiūlymus.
                            </p>
                            <ul>
                              <li>Mato savo sukurtus ir jam priskirtus darbus</li>
                              <li>Gali kviesti darbuotojus į savo darbus</li>
                              <li>Gali vesti pokalbius apie savo darbus</li>
                              <li>Mato savo darbų statistiką</li>
                              <li>Negali valdyti kitų vadybininkų darbų</li>
                            </ul>
                          </button>

                          <button
                            className={`ed-team-role-card ${
                              teamInviteForm.memberRole === "manager"
                                ? "active"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setTeamInviteForm((current) => ({
                                ...current,
                                memberRole: "manager",
                              }))
                            }
                          >
                            <b>
                              Vadovas
                              {teamInviteForm.memberRole === "manager" && (
                                <span>Pasirinkta</span>
                              )}
                            </b>
                            <p>
                              Skirtas žmogui, kuris koordinuoja kelių
                              vadybininkų darbus ir visos įmonės samdymą.
                            </p>
                            <ul>
                              <li>Mato visus įmonės darbo pasiūlymus</li>
                              <li>Gali valdyti ir redaguoti visus įmonės darbus</li>
                              <li>Gali perskirstyti atsakingus žmones</li>
                              <li>Mato visos įmonės statistiką</li>
                              <li>Negali keisti komandos narių rolių ar jų šalinti</li>
                            </ul>
                          </button>
                        </div>

                        <div className="ed-team-role-summary">
                          <b>
                            {teamInviteForm.memberRole === "manager"
                              ? "Kviečiate kaip Vadovą"
                              : "Kviečiate kaip Vadybininką"}
                          </b>
                          <span>
                            {teamInviteForm.memberRole === "manager"
                              ? "Šis žmogus galės koordinuoti visus įmonės darbus ir perskirstyti juos tarp komandos narių, tačiau komandos sudėtį vis tiek valdys tik Savininkas."
                              : "Šis žmogus dirbs tik su savo sukurtais arba jam priskirtais darbais ir nematys kitų vadybininkų darbų kaip valdomų savo darbų."}
                          </span>
                        </div>
                      </div>

                      <button
                        className="ed-primary"
                        type="button"
                        disabled={
                          teamActionBusy ||
                          usedTeamSeats >= 5 ||
                          !teamInviteForm.displayName.trim() ||
                          !teamInviteForm.email.trim()
                        }
                        onClick={createTeamInvite}
                      >
                        {teamActionBusy
                          ? "Kuriamas kvietimas..."
                          : usedTeamSeats >= 5
                          ? "Visos 5 vietos panaudotos"
                          : "Sukurti kvietimą"}
                      </button>
                    </div>

                    {lastTeamInviteLink && (
                      <div className="ed-team-link">
                        <b>Kvietimo nuoroda</b>
                        <div style={{ marginTop: 5 }}>
                          {lastTeamInviteLink}
                        </div>
                        <button
                          className="ed-secondary"
                          type="button"
                          style={{ marginTop: 9 }}
                          onClick={() =>
                            navigator.clipboard
                              .writeText(lastTeamInviteLink)
                              .then(() =>
                                setNotice("Kvietimo nuoroda nukopijuota.")
                              )
                              .catch(() => {})
                          }
                        >
                          Kopijuoti
                        </button>
                      </div>
                    )}

                    <div className="ed-team-invites">
                      <h3 style={{ marginBottom: 0 }}>Laukiantys kvietimai</h3>

                      {pendingTeamInvites.length ? (
                        pendingTeamInvites.map((invite) => (
                          <div className="ed-team-invite" key={invite.invite_id}>
                            <b>{invite.display_name}</b>
                            <span>
                              {invite.email} ·{" "}
                              {companyTeamRoleLabel(invite.member_role)}
                            </span>
                            <span>
                              Galioja iki{" "}
                              {new Date(invite.expires_at).toLocaleDateString(
                                "lt-LT"
                              )}
                            </span>

                            <div className="ed-team-invite-actions">
                              <button
                                className="ed-secondary"
                                type="button"
                                onClick={() => copyTeamInvite(invite.token)}
                              >
                                Kopijuoti nuorodą
                              </button>
                              <button
                                className="ed-team-remove"
                                type="button"
                                disabled={teamActionBusy}
                                onClick={() =>
                                  revokeTeamInvite(invite.invite_id)
                                }
                              >
                                Atšaukti
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#7a8996", fontSize: 12 }}>
                          Laukiančių kvietimų nėra.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Komandos valdymas</h3>
                    <p>
                      Narius kviesti, keisti jų roles ir šalinti gali įmonės
                      savininkas. Jūs galite matyti komandą ir dirbti pagal savo
                      rolės teises.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {jobInfoTarget && (
        <div
          className="ed-saved-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setJobInfoTarget(null);
              setJobInfoWorkers([]);
            }
          }}
        >
          <div
            className="ed-saved-modal ed-job-info-modal"
            style={{
              width: "min(760px, 100%)",
              maxHeight: "calc(100dvh - 40px)",
              overflow: "hidden",
              padding: 0,
              borderRadius: 22,
            }}
          >
            <div
              className="ed-job-info-scroll"
              style={{
                maxHeight: "calc(100dvh - 40px)",
                overflowY: "auto",
                padding: 24,
                boxSizing: "border-box",
                borderRadius: "inherit",
                background: "#fff",
              }}
            >
            <div className="ed-saved-head">
              <div>
                <div className="eyebrow">DARBO INFORMACIJA</div>
                <h2>{jobInfoTarget.title || "Darbas"}</h2>
                <p>Visa informacija, kuri buvo nurodyta kuriant šį darbo pasiūlymą.</p>
              </div>
              <button
                className="rs-close"
                type="button"
                aria-label="Uždaryti darbo informaciją"
                onClick={() => {
                  setJobInfoTarget(null);
                  setJobInfoWorkers([]);
                }}
              >
                <CloseMark />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {[
                ["Miestas", jobInfoTarget.city || "—"],
                ["Atvykti adresu", jobInfoTarget.address_text || "—"],
                ["Data", jobInfoTarget.work_date || "—"],
                [
                  "Darbo laikas",
                  `${jobInfoTarget.start_time?.slice(0, 5) || "—"}${
                    jobInfoTarget.end_time ? `–${jobInfoTarget.end_time.slice(0, 5)}` : ""
                  }`,
                ],
                [
                  "Pietų pertrauka",
                  jobInfoTarget.break_start_time && jobInfoTarget.break_end_time
                    ? `${jobInfoTarget.break_start_time.slice(0, 5)}–${jobInfoTarget.break_end_time.slice(0, 5)}`
                    : "Nėra",
                ],
                [
                  "Atlygis",
                  jobInfoTarget.pay_amount
                    ? formatNetPay(jobInfoTarget.pay_amount, jobInfoTarget.pay_unit)
                    : "—",
                ],
                ["Reikia darbuotojų", String(jobInfoTarget.workers_needed || 0)],
                [
                  "Atvykimas",
                  jobInfoTarget.transport_mode === "employer_pickup"
                    ? "Darbdavys paima darbuotoją"
                    : "Darbuotojas atvyksta pats",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{ border: "1px solid #e4ebf0", borderRadius: 12, padding: 13, minWidth: 0 }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 12 }}>{label}</div>
                  <b style={{ display: "block", marginTop: 4, overflowWrap: "anywhere" }}>{value}</b>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
                border: "1px solid #e4ebf0",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ color: "#6c7a88", fontSize: 12 }}>Darbo aprašymas</div>
              <div style={{ marginTop: 6, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {jobInfoTarget.description?.trim() || "Darbo aprašymas nepateiktas."}
              </div>
            </div>

            {jobInfoTarget.status === "cancelled" && (
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #f2c7bd",
                  background: "#fff5f2",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ color: "#b64d2a", fontSize: 12, fontWeight: 800 }}>
                  ATŠAUKIMO PRIEŽASTIS
                </div>
                <div
                  style={{
                    marginTop: 6,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    color: "#222631",
                  }}
                >
                  {jobInfoTarget.cancellation_reason?.trim() || "Priežastis nenurodyta."}
                </div>
              </div>
            )}

            {jobInfoWorkers.some((worker) =>
              ["resolved_worker", "resolved_employer"].includes(
                worker.attendance?.dispute_status
              )
            ) && (
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #e4ebf0",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>Ginčai</div>
                <b style={{ display: "block", marginTop: 4 }}>Ginčo sprendimas</b>

                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {jobInfoWorkers
                    .filter((worker) =>
                      ["resolved_worker", "resolved_employer"].includes(
                        worker.attendance?.dispute_status
                      )
                    )
                    .map((worker) => {
                      const employerWon =
                        worker.attendance?.dispute_status === "resolved_employer";
                      return (
                        <div
                          key={`dispute-${jobInfoTarget.id}-${worker.bookingId}`}
                          style={{
                            border: `1px solid ${employerWon ? "#b9dfcd" : "#efc5c5"}`,
                            borderRadius: 11,
                            padding: "11px 12px",
                            background: employerWon ? "#f4fbf7" : "#fff6f6",
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
                            <b style={{ color: "#222631", fontSize: 13 }}>
                              {worker.name}
                            </b>
                            <span
                              style={{
                                color: employerWon ? "#167a54" : "#b64242",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {employerWon ? "JŪSŲ NAUDAI" : "NE JŪSŲ NAUDAI"}
                            </span>
                          </div>
                          <div
                            style={{
                              marginTop: 7,
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                              color: "#222631",
                              fontSize: 12,
                            }}
                          >
                            {worker.attendance?.resolution_note?.trim() ||
                              "Administratorius papildomo komentaro nepateikė."}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div
              style={{
                marginTop: 10,
                border: "1px solid #e4ebf0",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: "#6c7a88", fontSize: 12 }}>Darbo komanda</div>
                  <b style={{ display: "block", marginTop: 4 }}>
                    {jobInfoTarget.status === "cancelled"
                      ? "Patvirtinti darbuotojai prieš atšaukimą"
                      : "Dirbę darbuotojai"}
                  </b>
                </div>
                {!jobInfoWorkersLoading && jobInfoWorkers.length > 0 && (
                  <span className="ed-attendance-badge green" style={{ marginTop: 0 }}>
                    {jobInfoWorkers.length} {jobInfoWorkers.length === 1 ? "darbuotojas" : "darbuotojai"}
                  </span>
                )}
              </div>

              {jobInfoWorkersLoading ? (
                <div style={{ marginTop: 12 }}><SilentLoader size={18} minHeight={38} /></div>
              ) : jobInfoWorkers.length ? (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {jobInfoWorkers.map((worker) => {
                    const outcome = attendanceOutcomeLabel(worker.attendance);
                    const worked = Number(worker.attendance?.worked_minutes || 0);
                    return (
                      <div
                        key={`${jobInfoTarget.id}-${worker.bookingId}`}
                        className="ed-job-info-worker-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "auto auto minmax(0,1fr) auto",
                          alignItems: "center",
                          gap: 11,
                          padding: "10px 11px",
                          border: "1px solid #edf1f4",
                          borderRadius: 11,
                          background: "#f8fafb",
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            overflow: "hidden",
                            background: "#eef2f5",
                            color: "#222631",
                            fontWeight: 800,
                            flex: "0 0 38px",
                          }}
                        >
                          {worker.avatarUrl ? (
                            <img
                              src={worker.avatarUrl}
                              alt={worker.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            worker.initials
                          )}
                        </div>
                        <div className="ed-job-info-worker-awards">
                          <MonthlyAwardMiniList
                            awards={workerAwardsById[worker.id] || []}
                            size={38}
                          />
                        </div>
                        <div className="ed-job-info-worker-copy" style={{ minWidth: 0 }}>
                          <b style={{ display: "block" }}>{worker.name}</b>
                          <span style={{ display: "block", marginTop: 2, color: "#6c7a88", fontSize: 12 }}>
                            {worker.city || "Miestas nenurodytas"}
                          </span>
                        </div>
                        <span
                          className={`ed-attendance-badge ed-job-info-worker-status ${
                            jobInfoTarget.status === "cancelled"
                              ? "red"
                              : worker.attendance?.final_outcome === "no_show" ||
                                worker.attendance?.final_outcome === "left_early_unexcused"
                              ? "red"
                              : worker.attendance?.finalized_at
                              ? "green"
                              : "muted"
                          }`}
                          style={{ marginTop: 0, textAlign: "center" }}
                        >
                          {jobInfoTarget.status === "cancelled"
                            ? "Buvo patvirtintas · darbas atšauktas"
                            : `${outcome}${
                                worked > 0 ? ` · ${formatWorkedMinutes(worked)}` : ""
                              }`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginTop: 12, color: "#6c7a88", fontSize: 12 }}>
                  {jobInfoTarget.status === "cancelled"
                    ? "Iki atšaukimo šiame darbe nebuvo patvirtintų darbuotojų."
                    : "Šiam darbui dirbusių darbuotojų nėra."}
                </div>
              )}
            </div>

            </div>
          </div>
        </div>
      )}

      {showSavedWorkers && (
        <div
          className="ed-saved-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savedWorkerBusy) {
              setShowSavedWorkers(false);
            }
          }}
        >
          <div className="ed-saved-modal">
            <div className="ed-saved-head">
              <div>
                <div className="eyebrow">DARBUOTOJAI FAVORITAI</div>
                <h2>Patikrinti darbuotojai, su kuriais jau dirbote</h2>
                <p>
                  Čia galite kaupti gerai pasirodžiusius darbuotojus. Sukūrus
                  naują darbą sistema iš jų parodys tik tuos, kurie tuo metu
                  atitinka darbo vietą, grafiką ir kitus kriterijus.
                </p>
              </div>

              <button
                className="rs-close"
                type="button"
                disabled={Boolean(savedWorkerBusy)}
                onClick={() => setShowSavedWorkers(false)}
              >
                <CloseMark />
              </button>
            </div>

            {savedWorkersLoading ? (
              <div className="ed-empty"><SilentLoader size={20} minHeight={44} /></div>
            ) : savedWorkers.length ? (
              <div className="ed-saved-list">
                {savedWorkers.map((worker) => (
                  <div className="ed-saved-row" key={worker.id}>
                    <div className="ed-saved-main">
                      <div className="ed-avatar">
                        {worker.avatarUrl ? (
                          <img src={worker.avatarUrl} alt={worker.name} />
                        ) : (
                          worker.initials
                        )}
                      </div>
                      <MonthlyAwardMiniList
                        awards={workerAwardsById[worker.id] || []}
                        size={42}
                      />
                      <div>
                        <b>{worker.name}</b>
                        <span>
                          {worker.city || "Miestas nenurodytas"} ·{" "}
                          Atlikta darbų: {Number(worker.completedJobs || 0)}
                          {worker.hasDrivingLicenseB ? " · B kategorija" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="ed-saved-meta">
                      <span>Paskutinis darbas su jumis</span>
                      <b>
                        {formatJobTitle(worker.last_job_title, "Įvykdytas darbas")}
                        {worker.last_work_date
                          ? ` · ${worker.last_work_date}`
                          : ""}
                      </b>
                      <span style={{ marginTop: 7 }}>
                        Patikimumas{" "}
                        <b
                          style={{
                            color: reliabilityScoreColor(worker.attendanceRate),
                          }}
                        >
                          {Math.round(worker.attendanceRate)}%
                        </b>
                        {worker.ratingAverage !== null
                          ? ` · ${worker.ratingAverage.toFixed(1)}/10`
                          : ""}
                      </span>
                    </div>

                    <div className="ed-saved-actions">
                      <button
                        className="ed-secondary"
                        type="button"
                        disabled={savedWorkerBusy === worker.id}
                        onClick={() => removeWorkerFromTeam(worker)}
                      >
                        {savedWorkerBusy === worker.id
                          ? "Šalinama..."
                          : "Pašalinti"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ed-empty">
                Darbuotojų favoritų sąrašas dar tuščias. Užbaigę darbo dieną prie patikusio
                darbuotojo spauskite „Pridėti į favoritus“.
              </div>
            )}
          </div>
        </div>
      )}

      {showUrgentSearch && (
        <div
          className="ed-urgent-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !urgentSearchLoading) {
              setShowUrgentSearch(false);
            }
          }}
        >
          <div className="ed-urgent-modal">
            <div className="ed-urgent-head">
              <div>
                <div className="eyebrow">SKUBIAI!</div>
                <h2>Kas gali atvykti dirbti dabar?</h2>
              </div>

              <button
                className="rs-close"
                type="button"
                disabled={urgentSearchLoading}
                aria-label="Uždaryti skubią paiešką"
                onClick={() => setShowUrgentSearch(false)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="ed-urgent-note">
              Kontaktai skirti tiesiogiai susisiekti dėl skubaus darbo.
              Numeris rodomas tik kol darbuotojas įjungęs „Laisvas dabar“.
            </div>

            <div className="ed-urgent-filter">
              <label className="ed-label">
                Miestas
                <CityAutocomplete
                  className="ed-input"
                  value={urgentSearchCity}
                  disabled={urgentSearchLoading}
                  onChange={(city) => {
                    setUrgentSearchCity(city);
                    setUrgentSearchCompleted(false);
                    setUrgentSearchError("");
                    setUrgentSearchResults([]);
                    setUrgentSearchPage(1);
                  }}
                  placeholder="Pvz. Vilnius"
                />
              </label>

              <button
                className="ed-primary"
                type="button"
                disabled={urgentSearchLoading}
                onClick={searchUrgentWorkers}
              >
                {urgentSearchLoading ? <SilentLoader size={15} minHeight={18} /> : "Filtruoti"}
              </button>
            </div>

            {urgentSearchError && (
              <div className="ed-error" role="alert">{urgentSearchError}</div>
            )}

            {urgentSearchResults.length ? (
              <>
              <div className="ed-urgent-results">
                {urgentSearchResults
                  .slice((urgentSearchPage - 1) * 5, urgentSearchPage * 5)
                  .map((worker) => (
                  <div className="ed-urgent-row" key={worker.worker_id}>
                    <div className="ed-urgent-worker">
                      <div className="ed-urgent-avatar">
                        {worker.avatarUrl ? (
                          <img
                            src={worker.avatarUrl}
                            alt={worker.display_name || "Darbuotojas"}
                          />
                        ) : (
                          workerInitials(worker.display_name)
                        )}
                      </div>
                      <MonthlyAwardMiniList
                        awards={workerAwardsById[worker.worker_id] || []}
                        size={44}
                      />

                      <div>
                        <b>{shortWorkerName(worker.display_name)}</b>
                        <span>
                          {worker.city}
                          {Number(worker.years_experience || 0) > 0
                            ? ` · ${Number(worker.years_experience)} m. patirties`
                            : ""}
                          {worker.has_driving_license_b ? " · B kategorija" : ""}
                        </span>
                        <span style={{ color: "#167a54", fontWeight: 800 }}>
                          Laisvas dabar
                        </span>
                      </div>
                    </div>

                    <div className="ed-urgent-contact">
                      <b>{worker.phone}</b>
                      <button
                        className="ed-secondary"
                        type="button"
                        onClick={() => copyUrgentPhone(worker.phone)}
                      >
                        {urgentPhoneCopied === worker.phone
                          ? "Nukopijuota"
                          : "Kopijuoti numerį"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {urgentSearchResults.length > 5 && (
                <div className="ed-urgent-results-nav">
                  <button
                    type="button"
                    aria-label="Ankstesni darbuotojai"
                    onClick={() => {
                      const totalPages = Math.ceil(urgentSearchResults.length / 5);
                      setUrgentSearchPage((current) =>
                        current <= 1 ? totalPages : current - 1
                      );
                    }}
                  >
                    ‹
                  </button>

                  <span>
                    {urgentSearchPage} / {Math.ceil(urgentSearchResults.length / 5)}
                  </span>

                  <button
                    type="button"
                    aria-label="Kiti darbuotojai"
                    onClick={() => {
                      const totalPages = Math.ceil(urgentSearchResults.length / 5);
                      setUrgentSearchPage((current) =>
                        current >= totalPages ? 1 : current + 1
                      );
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
              </>
            ) : (
              <div className="ed-urgent-empty">
                {urgentSearchLoading ? (
                  <SilentLoader size={20} minHeight={44} />
                ) : urgentSearchCompleted ? (
                  "Šiame mieste šiuo metu laisvų ir aktyvių darbuotojų nerasta."
                ) : (
                  "Pasirinkite miestą ir spauskite „Filtruoti“."
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showPlans && (
        <div
          className="ed-plan-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !planActionBusy) {
              setShowPlans(false);
            }
          }}
        >
          <div className="ed-plan-modal">
            <div className="ed-plan-head">
              <div>
                <div className="eyebrow">DARBDAVIO PLANAI</div>
                <h2>Rinkitės planą pagal savo prioritetus</h2>
              </div>

              <button
                className="rs-close"
                type="button"
                aria-label="Uždaryti planų langą"
                disabled={planActionBusy}
                onClick={() => setShowPlans(false)}
              >
                <CloseMark />
              </button>
            </div>

            {error && (
              <div className="ed-note err" role="alert">{error}</div>
            )}
            {notice && (
              <div className="ed-note ok" role="status">{notice}</div>
            )}

            {billingStatus && (
              <>
                <div className="ed-billing-overview">
                  <div className="ed-billing-card">
                    <span>Aktyvus planas</span>
                    <b>{billingStatus.effective_plan_name || planSummary?.plan_name || "Basic"}</b>
                    <small>{employerSubscriptionStatusLabel(billingStatus.subscription_status)}</small>
                  </div>

                  <div className="ed-billing-card">
                    <span>Kaina</span>
                    <b>
                      {isComplimentaryBusinessTrial(planSummary, billingStatus)
                        ? "0 € išbandymo metu"
                        : billingStatus.effective_plan_key === "basic"
                        ? "0 € / mėn."
                        : `${formatPlanPrice(Number(billingStatus.amount_cents || 0) / 100)} € / ${
                            billingStatus.billing_interval === "yearly"
                              ? "metus"
                              : "mėn."
                          }`}
                    </b>
                    <small>
                      {isComplimentaryBusinessTrial(planSummary, billingStatus)
                        ? "30 dienų nemokamai · be kortelės"
                        : billingStatus.billing_interval === "yearly"
                        ? "Metinis atsiskaitymas"
                        : "Mėnesinis atsiskaitymas"}
                    </small>
                  </div>

                  <div className="ed-billing-card">
                    <span>
                      {isComplimentaryBusinessTrial(planSummary, billingStatus)
                        ? "Išbandymas iki"
                        : billingStatus.cancel_at_period_end
                        ? "Galioja iki"
                        : "Kitas laikotarpis"}
                    </span>
                    <b>
                      {billingStatus.current_period_end
                        ? new Intl.DateTimeFormat("lt-LT", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(billingStatus.current_period_end))
                        : "—"}
                    </b>
                    <small>
                      {isComplimentaryBusinessTrial(planSummary, billingStatus)
                        ? "Po datos planas automatiškai taps Basic"
                        : billingStatus.cancel_at_period_end
                        ? "Po datos prenumerata nebus pratęsta"
                        : billingStatus.effective_plan_key === "basic"
                        ? "Nemokamas planas"
                        : "Prenumerata pratęsiama pagal Stripe būseną"}
                    </small>
                  </div>

                  <div className="ed-billing-card">
                    <span>Paskutinis apmokėjimas</span>
                    <b>
                      {billingStatus.last_payment_at
                        ? new Intl.DateTimeFormat("lt-LT", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }).format(new Date(billingStatus.last_payment_at))
                        : "—"}
                    </b>
                    <small>
                      {billingStatus.last_invoice_id
                        ? "Sąskaita yra Stripe istorijoje"
                        : "Dar nėra užfiksuotos sąskaitos"}
                    </small>
                  </div>
                </div>

                {isComplimentaryBusinessTrial(planSummary, billingStatus) &&
                  planSummary?.current_period_end && (
                    <div
                      className="ed-billing-warning"
                      style={{ background: "#eef8f3", borderColor: "#c7e8d8" }}
                    >
                      <b>Business išbandymas aktyvus.</b>{" "}
                      Visos Business funkcijos galioja iki{" "}
                      <b>
                        {new Intl.DateTimeFormat("lt-LT", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(planSummary.current_period_end))}
                      </b>
                      . Kortelės nereikia ir mokestis nenuskaičiuojamas. Jei iki
                      šios datos nepasirinksite mokamos prenumeratos, planas
                      automatiškai grįš į <b>Basic</b>.
                    </div>
                  )}

                {billingStatus.in_payment_grace && (
                  <div className="ed-billing-warning">
                    <b>Nepavyko automatiškai apmokėti prenumeratos.</b>{" "}
                    Mokamo plano teisės laikinai paliktos iki{" "}
                    <b>
                      {new Intl.DateTimeFormat("lt-LT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(billingStatus.payment_grace_until))}
                    </b>
                    . Atnaujinkite mokėjimo būdą Stripe lange, kad planas
                    nenukristų į Basic.
                  </div>
                )}

                {companyMemberRole === "owner" &&
                  billingStatus.has_stripe_customer &&
                  !onAdminReturn && (
                    <div className="ed-billing-actions">
                      <button
                        className="ed-secondary"
                        type="button"
                        disabled={planActionBusy}
                        onClick={openBillingPortal}
                      >
                        {planActionBusy
                          ? "Atidaroma..."
                          : "Valdyti prenumeratą ir sąskaitas"}
                      </button>
                    </div>
                  )}
              </>
            )}

            <div className="ed-billing-row">
              <span>Atsiskaitymo laikotarpis</span>

              <div className="ed-billing-toggle">
                <button
                  type="button"
                  className={planBillingCycle === "monthly" ? "active" : ""}
                  onClick={() => setPlanBillingCycle("monthly")}
                >
                  Kas mėnesį
                </button>
                <button
                  type="button"
                  className={planBillingCycle === "yearly" ? "active" : ""}
                  onClick={() => setPlanBillingCycle("yearly")}
                >
                  Už metus
                </button>
              </div>

              <span className="ed-billing-discount">
                Metams · 20% pigiau
              </span>
            </div>

            {preferredPlanKey !== "basic" && planSummary?.plan_key === "basic" && (
              <div className="ed-note" style={{ background: "#f6f4fa", border: "1px solid #ccc4df", color: "#222631", marginBottom: 16 }}>
                Jūsų pasirinkimas – {employerPlanName(preferredPlanKey)}. Žemiau patvirtinkite atsiskaitymo laikotarpį ir atlikite saugų apmokėjimą per Stripe. Iki Stripe patvirtinimo aktyvus lieka Basic planas.
              </div>
            )}

            {planSummary?.cancel_at_period_end && (
              <div
                className="ed-note"
                style={{
                  background: "#f6f4fa",
                  border: "1px solid #ccc4df",
                  color: "#222631",
                  marginBottom: 16,
                }}
              >
                <b>Prenumeratos atšaukimas suplanuotas.</b>{" "}
                {planSummary?.plan_name || employerPlanName(planSummary?.plan_key)} teisės
                {planSummary?.current_period_end && (
                  <>
                    {" "}galioja iki{" "}
                    <b>
                      {new Intl.DateTimeFormat("lt-LT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(planSummary.current_period_end))}
                    </b>
                  </>
                )}
                . Po šios datos planas automatiškai taps <b>Basic</b>.
              </div>
            )}

            {pendingPlanChange?.pending_plan_key && (
              <div
                className="ed-note"
                style={{
                  background: "#eef6ff",
                  border: "1px solid #cfe1f4",
                  color: "#222631",
                  marginBottom: 16,
                }}
              >
                <b>Suplanuotas plano pakeitimas:</b>{" "}
                {pendingPlanChange.pending_plan_name ||
                  employerPlanName(pendingPlanChange.pending_plan_key)}
                {pendingPlanChange.pending_billing_interval === "yearly"
                  ? " · metinis atsiskaitymas"
                  : " · mėnesinis atsiskaitymas"}
                {pendingPlanChange.pending_effective_at && (
                  <>
                    {" "}nuo{" "}
                    <b>
                      {new Intl.DateTimeFormat("lt-LT", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(pendingPlanChange.pending_effective_at))}
                    </b>
                  </>
                )}
                . Iki tol lieka galioti <b>{planSummary?.plan_name}</b> teisės.
              </div>
            )}

            <div className="ed-plan-grid">
              {EMPLOYER_PLANS.map((plan) => {
                const samePlan = planSummary?.plan_key === plan.key;
                const selectedBilling =
                  plan.price === 0 ? "monthly" : planBillingCycle;
                const currentBilling =
                  billingStatus?.billing_interval === "yearly"
                    ? "yearly"
                    : "monthly";
                const current =
                  samePlan &&
                  (plan.price === 0 || currentBilling === selectedBilling);
                const isPro = plan.key === "business_pro";
                const shownPrice =
                  plan.price === 0
                    ? 0
                    : planBillingCycle === "yearly"
                    ? employerPlanAnnualPrice(plan)
                    : plan.price;

                return (
                  <div
                    className={`ed-plan-card ${current ? "current" : ""} ${
                      isPro ? "pro" : ""
                    }`}
                    key={plan.key}
                  >
                    <div className="eyebrow">
                      {plan.key === "basic"
                        ? "PRADŽIA"
                        : plan.key === "business"
                        ? "REKOMENDUOJAMAS"
                        : "KOMANDAI"}
                    </div>
                    <h3>{plan.name}</h3>
                    <div className="ed-plan-price">
                      {formatPlanPrice(shownPrice)} €{" "}
                      <small>
                        {plan.price === 0
                          ? "/ mėn."
                          : planBillingCycle === "yearly"
                          ? "/ metus"
                          : "/ mėn."}
                      </small>
                    </div>

                    {plan.price > 0 && planBillingCycle === "yearly" ? (
                      <div className="ed-plan-yearly">
                        {formatPlanPrice(
                          employerPlanAnnualMonthlyEquivalent(plan)
                        )}{" "}
                        € / mėn. · sutaupote{" "}
                        {formatPlanPrice(employerPlanAnnualSavings(plan))} € per
                        metus
                      </div>
                    ) : (
                      <div className="ed-plan-yearly" />
                    )}

                    <div className="ed-plan-desc">{plan.description}</div>

                    {current && (
                      <span className="ed-plan-current">
                        Dabartinis planas
                      </span>
                    )}
                    {!current && preferredPlanKey === plan.key && planSummary?.plan_key === "basic" && (
                      <span className="ed-plan-current">Pasirinktas planas</span>
                    )}

                    <ul className="ed-plan-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    {current && (plan.price === 0 || onAdminReturn || billingStatus?.has_stripe_subscription) ? (
                      plan.price > 0 && !onAdminReturn ? (
                        <button
                          className="ed-secondary"
                          type="button"
                          disabled={planActionBusy}
                          onClick={openBillingPortal}
                        >
                          {planActionBusy
                            ? "Atidaroma..."
                            : "Valdyti prenumeratą"}
                        </button>
                      ) : (
                        <button
                          className="ed-secondary"
                          type="button"
                          disabled
                        >
                          Aktyvus planas
                        </button>
                      )
                    ) : onAdminReturn ? (
                      <button
                        className={isPro ? "ed-secondary" : "ed-primary"}
                        type="button"
                        disabled={planActionBusy}
                        onClick={() => activatePlanForAdminTest(plan.key)}
                      >
                        {planActionBusy
                          ? "Keičiama..."
                          : "Aktyvuoti testavimui"}
                      </button>
                    ) : (
                      <button
                        className={isPro ? "ed-secondary" : "ed-primary"}
                        type="button"
                        disabled={planActionBusy}
                        onClick={() => requestPaidPlan(plan.key)}
                      >
                        {planActionBusy
                          ? "Atidaroma..."
                          : plan.price === 0
                          ? "Pasirinkti Basic"
                          : samePlan &&
                            isComplimentaryBusinessTrial(planSummary, billingStatus)
                          ? "Tęsti Business po išbandymo"
                          : samePlan && billingStatus?.has_stripe_subscription
                          ? planBillingCycle === "yearly"
                            ? "Keisti į metinį atsiskaitymą"
                            : "Keisti į mėnesinį atsiskaitymą"
                          : `Apmokėti ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="ed-plan-footnote">
              Naujoms įmonėms Business automatiškai aktyvuojamas 30 dienų
              nemokamai, be kortelės ir be įsipareigojimo. Privatiems darbdaviams
              automatinis išbandymas netaikomas. Pasibaigus išbandymui planas
              automatiškai grįžta į Basic, jei nepasirenkama mokama prenumerata.
              Business ir Business Pro apmokami saugiai per
              Stripe. Galite mokėti kas mėnesį arba iš karto už 12 mėnesių;
              metiniam atsiskaitymui taikoma 20% nuolaida. Kortelės duomenų
              statybos24.lt nesaugo.
            </div>
          </div>
        </div>
      )}

      {showReliabilityInfo && (
        <div
          className="reliability-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowReliabilityInfo(false);
          }}
        >
          <style>{RELIABILITY_MODAL_STYLES}</style>

          <div
            className="reliability-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reliability-modal-title"
          >
            <div className="reliability-modal-scroll">
            <div className="reliability-modal-head">
              <div>
                <div className="reliability-modal-eyebrow">
                  PATIKIMUMO REITINGAS
                </div>
                <h2 id="reliability-modal-title">
                  Kaip veikia įmonės patikimumas?
                </h2>
              </div>

              <button
                className="reliability-modal-close"
                type="button"
                aria-label="Uždaryti"
                onClick={() => setShowReliabilityInfo(false)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="reliability-score-box">
              <div className="reliability-score-copy">
                <strong>
                  Dabartinis patikimumas:{" "}
                  <span
                    style={{
                      color: reliabilityScoreColor(employerStats.reliabilityRate),
                    }}
                  >
                    {formatReliabilityScore(employerStats.reliabilityRate)} / 100
                  </span>
                </strong>
                <span>
                  Darbuotojai šį rodiklį mato prieš priimdami jūsų darbo kvietimą.
                </span>
              </div>
            </div>

            <div className="reliability-rules">
              <div className="reliability-rule">
                <div className="reliability-rule-icon">100</div>
                <p>
                  Nauja darbdavio paskyra pradeda nuo <b>100 patikimumo taškų</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">−7</div>
                <p>
                  Jei darbuotojas jau <b>patvirtino darbą</b>, o darbdavys visą
                  darbą atšaukia, patikimumas sumažėja <b>7 taškais</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">0</div>
                <p>
                  Pažymėjus „Neatvyko“ ar „Išėjo anksčiau be pateisinamos
                  priežasties“, darbuotojo reitingas <b>nesumažėja iškart</b>.
                  Darbuotojas pirmiausia gali patvirtinti arba ginčyti rezultatą.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">−15</div>
                <p>
                  Jei ginčas išsprendžiamas darbuotojo naudai ir paaiškėja, kad
                  darbdavio neigiamas pažymėjimas buvo nepagrįstas, darbdavio
                  patikimumas sumažėja <b>15 taškų</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">+</div>
                <p>
                  Patikimumas atsistato per <b>tvarkingai užbaigtus darbus</b>.
                  Kai rezultatas yra 0–49, už darbą pridedami 3 taškai; 50–69 –
                  2; 70–89 – 1; 90–99 – 0,5 taško. Daugiau kaip 100 taškų
                  sukaupti negalima.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">30</div>
                <p>
                  Jei 30 dienų nėra naujo pažeidimo, žemas patikimumas gali
                  natūraliai paaugti po <b>1 tašką kas 30 dienų</b>, tačiau vien
                  laiku galima atsistatyti tik iki <b>80 / 100</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">✓</div>
                <p>
                  Po paskutinio pažeidimo tvarkingai užbaigta darbų: {" "}
                  <b>{employerStats.reliabilityGoodJobsSincePenalty}</b>.
                </p>
              </div>

              <div className="reliability-rule">
                <div className="reliability-rule-icon">#</div>
                <p>
                  Jei darbuotojas užginčija jūsų pažymėtą neigiamą darbo dienos
                  rezultatą ir administratorius nusprendžia darbuotojo naudai,
                  tai skaičiuojama kaip <b>nepagrįstas pažymėjimas</b>. Tokių
                  atvejų šiuo metu: <b>{employerStats.falseAttendanceClaimCount}</b>.
                </p>
              </div>
            </div>

            <div className="reliability-history">
              <div className="reliability-history-head">
                <h3>Patikimumo sumažėjimų istorija</h3>
                {employerPenaltyHistory.length > 5 && (
                  <span>Rodomi 5 naujausi iš {employerPenaltyHistory.length}</span>
                )}
              </div>

              {employerPenaltyHistory.length ? (
                <div className="reliability-history-list">
                  {employerPenaltyHistory.slice(0, 5).map((penalty) => {
                    const meta = employerReliabilityPenaltyMeta(penalty);
                    return (
                      <div className="reliability-history-item" key={penalty.id}>
                        <div className="reliability-history-change">
                          {meta.change < 0 ? formatReliabilityChange(meta.change) : "—"}
                        </div>
                        <div className="reliability-history-copy">
                          <b>{meta.label}</b>
                          {penalty.reason && penalty.reason !== meta.label && (
                            <small>{penalty.reason}</small>
                          )}
                        </div>
                        <div className="reliability-history-date">
                          {formatReliabilityPenaltyDate(penalty.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="reliability-history-empty">
                  Patikimumas dar nebuvo sumažintas.
                </div>
              )}
            </div>

            <div className="reliability-note">
              <b>Svarbu:</b> nei darbdavys, nei darbuotojas negali vienašališkai
              sugadinti kitos pusės reitingo ginčytinoje situacijoje. Ginčo metu
              sankcijos sustabdomos iki sprendimo.
            </div>

            <div className="reliability-modal-actions">
              <button
                type="button"
                onClick={() => setShowReliabilityInfo(false)}
              >
                Supratau
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {cancelJobTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !cancellingJob) {
              setCancelJobTarget(null);
              setCancelReason("");
            }
          }}
        >
          <div className="rs-modal-card">
            <style>{`
              .rs-modal-overlay{position:fixed;inset:0;background:rgba(34,38,49,.62);z-index:12000;display:grid;place-items:center;padding:20px}
              .rs-modal-card{width:min(620px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(34,38,49,.25);padding:22px;color:#222631}
              .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
              .rs-modal-head h2{margin:0;font-size:22px}
              .rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
              .rs-cancel-warning{background:#fff0ec;color:#9f4529;border-radius:12px;padding:14px;line-height:1.5;margin-bottom:16px}
              .rs-cancel-reason{width:100%;min-height:105px;border:1px solid #dbe4ea;border-radius:10px;padding:12px;font:inherit;resize:vertical}
              .rs-cancel-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:16px}
            `}</style>

            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBO ATŠAUKIMAS</div>
                <h2>Ar tikrai norite atšaukti šį darbą?</h2>
              </div>
              <button
                className="rs-close"
                disabled={cancellingJob}
                onClick={() => {
                  setCancelJobTarget(null);
                  setCancelReason("");
                }}
              >
                <CloseMark />
              </button>
            </div>

            <div className="rs-cancel-warning">
              <b>
                Šį darbą jau patvirtino {cancelJobTarget.confirmedCount}{" "}
                {cancelJobTarget.confirmedCount === 1 ? "darbuotojas" : "darbuotojai"}.
              </b>
              <div style={{ marginTop: 5 }}>
                Atšaukus darbą jų rezervacijos bus panaikintos, pokalbis bus
                uždarytas, o darbuotojai matys jūsų nurodytą atšaukimo priežastį.
              </div>
              <div style={{ marginTop: 5 }}>
                Kadangi darbą jau patvirtino darbuotojas, atšaukimas sumažins
                jūsų darbdavio patikimumo reitingą 7 punktais.
              </div>
            </div>

            <label className="ed-label">
              Atšaukimo priežastis *
              <textarea
                className="rs-cancel-reason"
                value={cancelReason}
                maxLength={500}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Pvz. Užsakovas netikėtai nukėlė darbus į kitą savaitę."
              />
            </label>

            <div
              style={{
                marginTop: 6,
                color: "#6c7a88",
                fontSize: 12,
              }}
            >
              Šią priežastį matys darbą patvirtinę darbuotojai.
            </div>

            <div className="rs-cancel-actions">
              <button
                className="ed-secondary"
                disabled={cancellingJob}
                onClick={() => {
                  setCancelJobTarget(null);
                  setCancelReason("");
                }}
              >
                Ne, grįžti
              </button>
              <button
                className="ed-primary"
                style={{ background: "#b64d2a" }}
                disabled={cancellingJob || cancelReason.trim().length < 5}
                onClick={confirmEmployerCancellation}
              >
                {cancellingJob ? "Atšaukiama..." : "Taip, atšaukti darbą"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLongTermEmployment && (
        <div
          className="rs-modal-overlay lt-employment-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !longTermBusy) {
              setShowLongTermEmployment(false);
              setLongTermSelectedWorker(null);
              setLongTermContractFile(null);
            }
          }}
        >
          <div className="rs-modal-card lt-employment-modal">
            <style>{`
              .lt-employment-overlay{position:fixed;inset:0;z-index:2400;display:grid;place-items:center;padding:20px;background:rgba(34,38,49,.58);backdrop-filter:blur(2px)}.lt-employment-modal{width:min(1120px,calc(100vw - 40px));max-width:1120px;min-width:0;max-height:calc(100dvh - 40px);overflow-y:auto;overflow-x:hidden;background:#fff;border-radius:22px;box-shadow:0 28px 90px rgba(34,38,49,.28);padding:24px;color:#222631;box-sizing:border-box;justify-self:center;align-self:center;scrollbar-width:none;-ms-overflow-style:none}.lt-employment-modal::-webkit-scrollbar{width:0;height:0;display:none}.lt-employment-modal::-webkit-scrollbar-track{background:transparent}.lt-employment-modal::-webkit-scrollbar-thumb{background:transparent;border-radius:999px}.lt-employment-modal .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid #edf1f4}.lt-employment-modal .rs-modal-head h2{margin:5px 0 0;font-size:25px;line-height:1.2}.lt-employment-modal .rs-close{border:0;background:#f2f5f7;color:#222631;border-radius:11px;width:40px;height:40px;display:grid;place-items:center;cursor:pointer;flex:0 0 40px}.lt-employment-list{display:grid;gap:10px;max-width:900px;margin:0 auto}.lt-employment-worker{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;border:1px solid #dfe7ec;border-radius:15px;padding:14px 15px;background:#fff;box-shadow:0 3px 12px rgba(34,38,49,.035)}.lt-employment-worker:hover{border-color:#cbd8e1;background:#fbfcfd}.lt-employment-worker-main{display:flex;align-items:center;gap:13px;min-width:0}.lt-employment-avatar{width:52px;height:52px;border-radius:50%;overflow:hidden;background:#eef2f4;color:#222631;display:grid;place-items:center;font-size:16px;font-weight:850;flex:0 0 52px}.lt-employment-avatar img{width:100%;height:100%;object-fit:cover}.lt-employment-worker b{font-size:16px}.lt-employment-worker small{display:block;color:#6c7a88;margin-top:3px;line-height:1.35}.lt-employment-worker .ed-primary{min-width:112px;padding:11px 17px}.lt-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.lt-wide{grid-column:1/-1}.lt-salary-row{grid-column:1/-1;display:grid;grid-template-columns:1.15fr .9fr 1.15fr;gap:12px;padding:14px;border:1px solid #e5ebef;border-radius:13px;background:#fff}.lt-schedule-editor{display:grid;gap:9px;margin-top:10px}.lt-schedule-edit-row{display:grid;grid-template-columns:170px minmax(0,1fr) minmax(0,1fr) minmax(0,2fr);gap:10px;align-items:center;padding:12px;border:1px solid #e5ebef;border-radius:13px;background:#fff;min-width:0}.lt-schedule-edit-row>*{min-width:0}.lt-schedule-day{display:flex;align-items:center;gap:8px;font-weight:800;min-height:42px}.lt-break-group{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px 10px;align-items:end;min-width:0}.lt-no-break{grid-column:1/-1;display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;padding:7px 10px;border-radius:999px;background:#f4f7f9;color:#526374;font-size:11px;font-weight:800;cursor:pointer}.lt-no-break input{accent-color:#6b5b95}.lt-contract-upload{grid-column:1/-1;border:1px dashed #cbd7df;border-radius:13px;padding:14px;background:#fff}.lt-contract-upload strong{display:block;margin-bottom:4px}.lt-contract-upload p{margin:0 0 10px;color:#607180;font-size:12px;line-height:1.5}.lt-file-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.lt-file-name{font-size:12px;color:#526374;min-width:0;overflow-wrap:anywhere}.lt-existing-offers{display:grid;gap:8px;margin-top:12px}.lt-existing-offer{border:1px solid #e4ebf0;border-radius:14px;padding:14px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(220px,.55fr) minmax(260px,.72fr);gap:16px;align-items:center;background:#fff}.lt-existing-info{min-width:0}.lt-existing-info-title{display:block;font-size:18px;line-height:1.25}.lt-existing-info-sub{margin-top:5px;color:#222631;font-size:14px;font-weight:700}.lt-existing-info-meta{margin-top:4px;color:#6c7a88;font-size:12px;line-height:1.45}.lt-existing-status{display:grid;justify-items:center;gap:7px;text-align:center;align-self:center;align-content:center;padding:6px 10px}.lt-existing-status-label{font-size:11px;letter-spacing:.08em;font-weight:800;color:#7b8a97}.lt-existing-status-main{display:inline-flex;align-items:center;justify-content:center;max-width:340px;border-radius:999px;padding:7px 11px;background:#edf8f3;color:#167a54;font-size:12px;line-height:1.35;font-weight:850}.lt-existing-status-main.waiting{background:#f1f4f6;color:#526374}.lt-existing-status-main.attention{background:#f1eef8;color:#453a63}.lt-existing-actions{display:grid;grid-template-columns:repeat(2,minmax(126px,1fr));gap:8px;align-self:center;align-content:center;min-width:0;max-width:340px;justify-self:end}.lt-existing-actions>button{width:100%;min-height:40px;justify-content:center;white-space:normal;line-height:1.2;padding:8px 12px;font-size:13px;position:relative}.lt-employed-table{display:grid;gap:8px;margin-top:10px}.lt-employed-row{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(140px,.55fr) minmax(390px,auto);gap:16px;align-items:center;border:1px solid #cfe7dc;border-radius:14px;padding:14px 16px;background:#f7fbf9}.lt-employed-meta{color:#607180;font-size:12px;line-height:1.45}.lt-employed-row .lt-existing-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;max-width:none;min-width:0}.lt-employed-row .lt-existing-actions>button{width:auto;min-width:118px;min-height:40px;white-space:nowrap}.lt-employed-row .lt-employee-chat-btn,.lt-employed-row .lt-employee-contract-btn{background:#fff;border-color:#d7e1e8;color:#222631}.lt-employed-row .lt-employee-chat-btn:hover,.lt-employed-row .lt-employee-contract-btn:hover{background:#f7fafb}.lt-employed-row .lt-employee-end-btn{background:#fff;border-color:#efb9aa;color:#b64d2a}.lt-employed-row .lt-employee-end-btn:hover{background:#fff5f2}.lt-section-title{font-size:17px;margin:18px 0 9px}.lt-help{color:#6c7a88;font-size:12px;line-height:1.45}.lt-modal-note{background:#f2f8f5;border:1px solid #dcefe5;border-radius:12px;padding:12px 14px;color:#476355;font-size:12px;line-height:1.5;margin-bottom:16px}.lt-commitment-note{border:1px solid #dbe5eb;border-radius:12px;padding:11px 13px;background:#fff;color:#526374;font-size:12px;line-height:1.5;text-align:center}.lt-commitment-note.warning{border-color:#c2bada;background:#fff8f1;color:#433960}.lt-commitment-note b{display:block;color:#222631;margin-bottom:3px}.lt-commitment-note span{display:block}
              @media(min-width:901px){.lt-employed-table,.lt-existing-offers{width:100%;min-width:0}.lt-employed-row,.lt-existing-offer{width:100%;min-width:0;box-sizing:border-box}.lt-employed-row>*,.lt-existing-offer>*{min-width:0}}@media(max-width:900px){.lt-schedule-edit-row{grid-template-columns:150px 1fr 1fr}.lt-break-group{grid-column:2/-1}.lt-employed-row{grid-template-columns:1fr}.lt-existing-offer{grid-template-columns:1fr}.lt-existing-status{justify-items:start;text-align:left;padding:6px 0}.lt-existing-actions{grid-template-columns:repeat(2,minmax(126px,1fr));justify-content:stretch;max-width:none;min-width:0}}
              @media(max-width:760px){.lt-employment-overlay{padding:10px}.lt-employment-modal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:17px;border-radius:17px}.lt-form-grid{grid-template-columns:1fr}.lt-wide{grid-column:auto}.lt-salary-row{grid-column:auto;grid-template-columns:1fr}.lt-schedule-edit-row{grid-template-columns:1fr}.lt-schedule-day,.lt-break-group{grid-column:1/-1}.lt-existing-offer,.lt-employment-worker{grid-template-columns:1fr}.lt-existing-actions{grid-template-columns:1fr}.lt-employment-worker .ed-primary{width:100%}.wd-long-term-offer-actions{width:100%;justify-content:flex-start}.wd-long-term-offer-actions>button{flex:1 1 140px}}
            `}</style>

            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">ĮDARBINTI DARBUOTOJĄ</div>
                <h2>
                  {longTermSelectedWorker
                    ? `Pasiūlymas · ${longTermSelectedWorker.worker_name}`
                    : longTermModalMode === "employees"
                    ? "Įdarbinti darbuotojai"
                    : "Darbuotojai, su kuriais jau dirbote"}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#6c7a88", fontSize: 13 }}>
                  {longTermModalMode === "employees"
                    ? "Čia galite valdyti aktyvius ilgalaikius darbuotojus, peržiūrėti sutartis ir rašyti žinutes."
                    : "Pasiūlymą galima siųsti tik darbuotojui, su kuriuo turite bent vieną tvarkingai užbaigtą darbo dieną."}
                </p>
              </div>
              <button
                className="rs-close"
                type="button"
                disabled={longTermBusy}
                onClick={() => {
                  setShowLongTermEmployment(false);
                  setLongTermSelectedWorker(null);
                  setLongTermContractFile(null);
                }}
              >
                <CloseMark />
              </button>
            </div>

            {longTermSelectedWorker ? (
              <>
                <div className="lt-modal-note">
                  Darbuotojas pasiūlymą ir jūsų įkeltą darbo sutartį gaus atskiroje
                  „Įdarbinimo pasiūlymų“ skiltyje. Darbuotojas sutartį perskaitys,
                  pasirašys ir įkels atgal. Įdarbinimas aktyvuosis tik jums patvirtinus,
                  kad pasirašytą sutartį gavote.
                </div>

                <div className="lt-form-grid">
                  <label className="ed-label lt-wide">
                    Darbo pozicija *
                    <input
                      className="ed-input"
                      value={longTermOfferForm.positionTitle}
                      onChange={(e) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          positionTitle: e.target.value,
                        }))
                      }
                      placeholder="Pvz. Statybų darbų vadovas"
                    />
                  </label>

                  <label className="ed-label">
                    Sutarties tipas *
                    <RoundedSelect
                      className="ed-input"
                      value={longTermOfferForm.contractType}
                      options={[
                        { value: "indefinite", label: "Neterminuota" },
                        { value: "fixed_term", label: "Terminuota" },
                      ]}
                      onChange={(value) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          contractType: value,
                          proposedEndDate:
                            value === "indefinite" ? "" : current.proposedEndDate,
                        }))
                      }
                    />
                  </label>

                  <label className="ed-label">
                    Preliminari darbo pradžia *
                    <RoundedDateSelect
                      className="ed-input wd-date-trigger"
                      value={longTermOfferForm.proposedStartDate}
                      allowClear={false}
                      onChange={(value) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          proposedStartDate: value,
                        }))
                      }
                    />
                  </label>

                  {longTermCommitmentLoading && (
                    <div className="lt-wide lt-commitment-note">
                      <SilentLoader size={18} minHeight={34} />
                    </div>
                  )}

                  {!longTermCommitmentLoading &&
                    Number(longTermCommitmentSummary?.confirmed_job_count || 0) > 0 && (
                      <div className="lt-wide lt-commitment-note warning">
                        <b>Darbuotojas dar turi suplanuotų statybos24 darbų.</b>
                        <span>
                          Patvirtintų darbų: {Number(
                            longTermCommitmentSummary.confirmed_job_count || 0
                          )}. Paskutinis suplanuotas darbas – {
                            longTermCommitmentSummary.last_confirmed_job_date
                          }.
                          {longTermOfferForm.proposedStartDate &&
                          longTermCommitmentSummary.last_confirmed_job_date &&
                          longTermOfferForm.proposedStartDate <=
                            longTermCommitmentSummary.last_confirmed_job_date
                            ? " Pasirinkta įdarbinimo pradžia yra iki šios datos arba tą pačią dieną. Aktyvinant įdarbinimą sistema dar patikrins konkretų grafikų persidengimą."
                            : " Pasirinkta įdarbinimo pradžia yra po paskutinio suplanuoto darbo."}
                        </span>
                      </div>
                    )}

                  {longTermOfferForm.contractType === "fixed_term" && (
                    <label className="ed-label">
                      Sutarties pabaiga *
                      <RoundedDateSelect
                        className="ed-input wd-date-trigger"
                        value={longTermOfferForm.proposedEndDate}
                        allowClear={false}
                        onChange={(value) =>
                          setLongTermOfferForm((current) => ({
                            ...current,
                            proposedEndDate: value,
                          }))
                        }
                      />
                    </label>
                  )}

                  <label className="ed-label">
                    Miestas
                    <CityAutocomplete
                      className="ed-input"
                      value={longTermOfferForm.workplaceCity}
                      onChange={(value) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          workplaceCity: value,
                        }))
                      }
                      placeholder="Pvz. Vilnius"
                    />
                  </label>

                  <label className="ed-label lt-wide">
                    Atvykti adresu
                    <input
                      className="ed-input"
                      value={longTermOfferForm.workplaceAddress}
                      onChange={(e) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          workplaceAddress: e.target.value,
                        }))
                      }
                      placeholder="Gatvė, numeris, objektas"
                    />
                  </label>

                  <div className="lt-salary-row">
                    <label className="ed-label">
                      Siūlomas atlygis (€)
                      <input
                        className="ed-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={longTermOfferForm.salaryAmount}
                        onChange={(e) =>
                          setLongTermOfferForm((current) => ({
                            ...current,
                            salaryAmount: e.target.value,
                          }))
                        }
                        placeholder="Pvz. 1800"
                      />
                    </label>

                    <label className="ed-label">
                      Atlygio periodas
                      <RoundedSelect
                        className="ed-input"
                        value={longTermOfferForm.salaryPeriod}
                        options={[
                          { value: "monthly", label: "Per mėnesį" },
                          { value: "hourly", label: "Per valandą" },
                        ]}
                        onChange={(value) =>
                          setLongTermOfferForm((current) => ({
                            ...current,
                            salaryPeriod: value,
                          }))
                        }
                      />
                    </label>

                    <label className="ed-label">
                      Atlygis nurodytas
                      <RoundedSelect
                        className="ed-input"
                        value={longTermOfferForm.salaryBasis}
                        options={[
                          { value: "net", label: "Į rankas (neto)" },
                          { value: "gross", label: "Ant popieriaus (bruto)" },
                        ]}
                        onChange={(value) =>
                          setLongTermOfferForm((current) => ({
                            ...current,
                            salaryBasis: value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <label className="ed-label lt-wide">
                    Atlygio / sąlygų pastaba
                    <input
                      className="ed-input"
                      value={longTermOfferForm.salaryNote}
                      onChange={(e) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          salaryNote: e.target.value,
                        }))
                      }
                      placeholder="Pvz. bandomasis laikotarpis, priedai ar premijos"
                    />
                  </label>

                  <label className="ed-label lt-wide">
                    Įdarbinimo informacija
                    <textarea
                      className="ed-textarea"
                      value={longTermOfferForm.employmentDetails}
                      onChange={(e) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          employmentDetails: e.target.value,
                        }))
                      }
                      placeholder="Aprašykite pareigas, atsakomybes, sąlygas ir kitą darbuotojui svarbią informaciją."
                    />
                  </label>

                  <label className="ed-label lt-wide">
                    Grafiko tipas *
                    <RoundedSelect
                      className="ed-input"
                      value={longTermOfferForm.scheduleType}
                      options={[
                        { value: "fixed", label: "Pastovus grafikas" },
                        { value: "variable", label: "Kintamas grafikas" },
                      ]}
                      onChange={(value) =>
                        setLongTermOfferForm((current) => ({
                          ...current,
                          scheduleType: value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="lt-contract-upload" style={{ marginTop: 14 }}>
                  <strong>Darbo sutartis *</strong>
                  <p>
                    Įkelkite galutinę sutartį, kurią darbuotojas turi perskaityti ir
                    pasirašyti. Priimami PDF ir DOCX failai iki 15 MB.
                  </p>
                  <div className="lt-file-row">
                    <label className="ed-secondary" style={{ cursor: "pointer" }}>
                      Pasirinkti sutartį
                      <input
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: "none" }}
                        onChange={(e) => setLongTermContractFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <span className="lt-file-name">
                      {longTermContractFile
                        ? longTermContractFile.name
                        : "Sutarties failas dar nepasirinktas"}
                    </span>
                  </div>
                </div>

                {longTermOfferForm.scheduleType === "fixed" ? (
                  <div>
                    <h3 className="lt-section-title">Siūlomos darbo dienos ir laikas</h3>
                    <div className="lt-help">
                      Pažymėkite darbo dienas, laiką ir pietų pertrauką. Tik aktyvus,
                      abiejų pusių patvirtintas grafikas rezervuos darbuotojo laiką.
                    </div>
                    <div className="lt-schedule-editor">
                      {longTermSchedule.map((row) => (
                        <div className="lt-schedule-edit-row" key={row.weekday}>
                          <label className="lt-schedule-day">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) =>
                                updateLongTermScheduleDay(
                                  row.weekday,
                                  "enabled",
                                  e.target.checked
                                )
                              }
                            />
                            {longTermWeekdayLabel(row.weekday)}
                          </label>

                          <label className="ed-label">
                            Nuo
                            <RoundedTimeSelect
                              className="ed-input wd-time-trigger"
                              value={row.startTime}
                              disabled={!row.enabled}
                              onChange={(value) =>
                                updateLongTermScheduleDay(row.weekday, "startTime", value)
                              }
                            />
                          </label>

                          <label className="ed-label">
                            Iki
                            <RoundedTimeSelect
                              className="ed-input wd-time-trigger"
                              value={row.endTime}
                              disabled={!row.enabled}
                              onChange={(value) =>
                                updateLongTermScheduleDay(row.weekday, "endTime", value)
                              }
                            />
                          </label>

                          <div className="lt-break-group">
                            <label className="ed-label">
                              Pietūs nuo
                              <RoundedTimeSelect
                                className="ed-input wd-time-trigger"
                                value={row.breakStartTime}
                                disabled={!row.enabled || row.noBreak}
                                onChange={(value) =>
                                  updateLongTermScheduleDay(
                                    row.weekday,
                                    "breakStartTime",
                                    value
                                  )
                                }
                              />
                            </label>

                            <label className="ed-label">
                              Pietūs iki
                              <RoundedTimeSelect
                                className="ed-input wd-time-trigger"
                                value={row.breakEndTime}
                                disabled={!row.enabled || row.noBreak}
                                align="right"
                                onChange={(value) =>
                                  updateLongTermScheduleDay(
                                    row.weekday,
                                    "breakEndTime",
                                    value
                                  )
                                }
                              />
                            </label>

                            <label className="lt-no-break">
                              <input
                                type="checkbox"
                                checked={row.noBreak}
                                disabled={!row.enabled}
                                onChange={(e) =>
                                  updateLongTermScheduleDay(
                                    row.weekday,
                                    "noBreak",
                                    e.target.checked
                                  )
                                }
                              />
                              Pietų pertraukos nėra
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="lt-modal-note" style={{ marginTop: 14, marginBottom: 0 }}>
                    Kintamo grafiko atveju konkretus laikas nebus automatiškai rezervuojamas.
                    Darbuotojas savo prieinamumą ir toliau valdys statybos24 grafike.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 18,
                  }}
                >
                  <button
                    className="ed-secondary"
                    type="button"
                    disabled={longTermBusy}
                    onClick={() => {
                      setLongTermSelectedWorker(null);
                      setLongTermContractFile(null);
                    }}
                  >
                    ← Grįžti prie darbuotojų
                  </button>
                  <button
                    className="ed-primary"
                    type="button"
                    disabled={longTermBusy || !longTermContractFile}
                    onClick={submitLongTermOffer}
                  >
                    {longTermBusy ? "Siunčiama..." : "Pateikti įdarbinimo pasiūlymą"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {longTermModalMode !== "employees" && (
                  <>
                {longTermBusy && !longTermCandidates.length ? (
                  <div className="ed-empty"><SilentLoader size={20} minHeight={44} /></div>
                ) : longTermCandidates.some(
                    (worker) => !["offered", "active"].includes(worker.current_offer_status)
                  ) ? (
                  <div className="lt-employment-list">
                    {longTermCandidates
                      .filter(
                        (worker) => !["offered", "active"].includes(worker.current_offer_status)
                      )
                      .map((worker) => {
                      return (
                        <div className="lt-employment-worker" key={worker.worker_id}>
                          <div className="lt-employment-worker-main">
                            <div className="lt-employment-avatar">
                              {worker.avatar_path ? (
                                <img
                                  src={workerAvatarUrl(worker.avatar_path)}
                                  alt={worker.worker_name || "Darbuotojas"}
                                />
                              ) : (
                                workerInitials(worker.worker_name)
                              )}
                            </div>
                            <MonthlyAwardMiniList
                              awards={workerAwardsById[worker.worker_id] || []}
                              size={52}
                            />
                            <div>
                              <b>{worker.worker_name}</b>
                              <small>
                                {worker.city || "Miestas nenurodytas"} · kartu užbaigta darbo dienų: {worker.completed_days}
                              </small>
                              <small>
                                Paskutinis darbas: {worker.last_job_title ? formatJobTitle(worker.last_job_title) : "—"}
                                {worker.last_work_date ? ` · ${worker.last_work_date}` : ""}
                              </small>
                            </div>
                          </div>
                          <button
                            className="ed-primary"
                            type="button"
                            disabled={longTermBusy}
                            onClick={() => chooseLongTermCandidate(worker)}
                          >
                            Rinktis
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ed-empty">
                    Dar nėra darbuotojų, su kuriais būtų tvarkingai užbaigta bent viena darbo diena.
                  </div>
                )}

                {companyLongTermOffers.some((offer) => offer.status === "offered") && (
                  <>
                    <h3 className="lt-section-title">Pateikti įdarbinimo pasiūlymai</h3>
                    <div className="lt-existing-offers">
                      {companyLongTermOffers
                        .filter((offer) => offer.status === "offered")
                        .map((offer) => (
                          <div className="lt-existing-offer" key={offer.id}>
                            <div className="lt-existing-info">
                              <b className="lt-existing-info-title">
                                {offer.position_title || "Įdarbinimo pasiūlymas"}
                              </b>
                              <div className="lt-existing-info-sub">
                                Darbuotojas: {offer.worker_name || "Darbuotojas"}
                              </div>
                              <div className="lt-existing-info-meta">
                                {longTermContractLabel(offer.contract_type)} · nuo {offer.proposed_start_date}
                              </div>
                            </div>

                            <div className="lt-existing-status">
                              <div className="lt-existing-status-label">BŪSENA</div>
                              <div
                                className={`lt-existing-status-main ${
                                  longTermEmployerUpdateTone(offer) === "muted"
                                    ? "waiting"
                                    : longTermEmployerUpdateTone(offer) === "attention"
                                    ? "attention"
                                    : ""
                                }`}
                              >
                                {longTermEmployerUpdateLabel(offer)}
                              </div>
                            </div>

                            <div className="lt-existing-actions">
                              <button
                                className={`ed-secondary wd-workday-chat ${
                                  Number(longTermUnreadByOffer[offer.id] || 0) > 0
                                    ? "has-unread"
                                    : ""
                                }`}
                                type="button"
                                onClick={() => {
                                  setLongTermUnreadByOffer((current) => ({
                                    ...current,
                                    [offer.id]: 0,
                                  }));
                                  setLongTermConversation({
                                    placementId: offer.id,
                                    title: `${offer.worker_name} · ${offer.position_title}`,
                                  });
                                }}
                              >
                                Žinutės
                                {Number(longTermUnreadByOffer[offer.id] || 0) > 0 && (
                                  <span className="wd-chat-count">
                                    {Math.min(9, Number(longTermUnreadByOffer[offer.id] || 0))}
                                  </span>
                                )}
                              </button>
                              {offer.employer_contract_path && (
                                <button
                                  className="ed-secondary"
                                  type="button"
                                  onClick={() => employerOpenLongTermContract(offer.employer_contract_path)}
                                >
                                  Siųsta sutartis
                                </button>
                              )}
                              {offer.worker_signed_contract_path && (
                                <button
                                  className="ed-secondary"
                                  type="button"
                                  onClick={() => employerOpenLongTermContract(offer.worker_signed_contract_path)}
                                >
                                  Pasirašyta sutartis
                                </button>
                              )}
                              <button
                                className="ed-primary"
                                type="button"
                                disabled={longTermBusy || !offer.worker_signed_contract_path}
                                onClick={() => employerConfirmLongTermOffer(offer)}
                              >
                                Priimu darbuotoją
                              </button>
                              <button
                                className="ed-secondary"
                                type="button"
                                disabled={longTermBusy || Boolean(offer.worker_signed_contract_path)}
                                onClick={() => withdrawLongTermOffer(offer)}
                              >
                                Atšaukti pasiūlymą
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                  </>
                )}

                {longTermModalMode === "employees" && companyLongTermOffers.some((offer) => offer.status === "active") && (
                  <>
                    <h3 className="lt-section-title">Įdarbinti darbuotojai</h3>
                    <div className="lt-employed-table">
                      {companyLongTermOffers
                        .filter((offer) => offer.status === "active")
                        .map((offer) => (
                          <div className="lt-employed-row" key={`active-${offer.id}`}>
                            <div>
                              <b>{offer.worker_name}</b>
                              <div className="lt-employed-meta">
                                {offer.position_title} · nuo {offer.proposed_start_date}
                                {offer.proposed_end_date ? ` iki ${offer.proposed_end_date}` : " · neterminuota"}
                              </div>
                            </div>
                            <div className="lt-employed-meta">
                              {offer.schedule_type === "fixed"
                                ? "Pastovus grafikas"
                                : "Kintamas grafikas"}
                            </div>
                            <div className="lt-existing-actions">
                              <button
                                className={`ed-secondary lt-employee-chat-btn ${
                                  Number(longTermUnreadByOffer[offer.id] || 0) > 0
                                    ? "wd-workday-chat has-unread"
                                    : ""
                                }`}
                                type="button"
                                onClick={() => {
                                  setLongTermUnreadByOffer((current) => ({
                                    ...current,
                                    [offer.id]: 0,
                                  }));
                                  setLongTermConversation({
                                    placementId: offer.id,
                                    title: `${offer.worker_name} · ${offer.position_title}`,
                                  });
                                }}
                              >
                                Žinutės
                                {Number(longTermUnreadByOffer[offer.id] || 0) > 0 && (
                                  <span className="wd-chat-count">
                                    {Math.min(9, Number(longTermUnreadByOffer[offer.id] || 0))}
                                  </span>
                                )}
                              </button>
                              {offer.worker_signed_contract_path && (
                                <button
                                  className="ed-secondary lt-employee-contract-btn"
                                  type="button"
                                  onClick={() => employerOpenLongTermContract(offer.worker_signed_contract_path)}
                                >
                                  Sutartis
                                </button>
                              )}
                              <button
                                className="ed-secondary lt-employee-end-btn"
                                type="button"
                                disabled={longTermBusy}
                                onClick={() => endLongTermEmployment(offer)}
                              >
                                Nutraukti įdarbinimą
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {longTermModalMode === "employees" &&
                  !longTermBusy &&
                  !companyLongTermOffers.some((offer) => offer.status === "active") && (
                    <div className="ed-empty">
                      Aktyviai įdarbintų darbuotojų kol kas nėra.
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}

      <LongTermConversationModal
        open={Boolean(longTermConversation)}
        onClose={() => setLongTermConversation(null)}
        placementId={longTermConversation?.placementId}
        title={longTermConversation?.title}
        user={user}
      />

      <CompanyTeamChatModal
        open={showTeamChat}
        onClose={() => setShowTeamChat(false)}
        companyId={company?.id}
        companyName={company?.name}
        user={user}
        onRead={() => setTeamChatUnread(0)}
      />

      <WorkerProfileModal
        worker={selectedWorker}
        jobId={selectedWorker?.profileJobId || currentJob?.id || null}
        canViewWorkerMetrics={canViewWorkerMetrics}
        onClose={() => setSelectedWorker(null)}
      />

      <ConversationModal
        open={Boolean(conversation)}
        onClose={() => setConversation(null)}
        onRead={() => conversation && markEmployerPrivateChatRead(conversation.invitationId)}
        invitationId={conversation?.invitationId}
        title={conversation?.title}
        user={user}
        senderMode={onAdminReturn ? "employer" : null}
      />
      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        onRead={() => groupConversation && markEmployerGroupChatRead(groupConversation.jobId)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
        senderMode={onAdminReturn ? "employer" : null}
      />

      <DisputeConversationModal
        open={Boolean(disputeConversation)}
        onClose={() => setDisputeConversation(null)}
        attendanceId={disputeConversation?.attendanceId}
        title={disputeConversation?.title}
        workerName={disputeConversation?.workerName}
        companyName={disputeConversation?.companyName}
        user={user}
      />

      <BugReportModal
        open={bugReportOpen}
        onClose={() => setBugReportOpen(false)}
        onSubmitted={() => setBugReportNotice("Ačiū. Klaidos pranešimas perduotas administratoriui.")}
      />
      <DeleteAccountModal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        accountKind={companyMemberRole === "owner" ? "savininko ir įmonės paskyra" : "darbdavio paskyra"}
      />
      <StyledConfirmDialog dialog={confirmDialog} onResolve={resolveConfirm} />
    </div>
    </P24Shell>
  );
}
