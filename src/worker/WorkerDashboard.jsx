import { useEffect, useRef, useState } from "react";
import { getVilniusTodayISO, supabase, workerBirthDateError } from "../lib/config.js";
import { BrandLogo, CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ArrivalTimeDialog, ReviewConductNotice, RoundedSelect, RoundedTimeSelect, normalizeLithuanianMobilePhone } from "../ui/common.jsx";
import { CityAutocomplete, canonicalCityName } from "../ui/location.jsx";
import { PhoneAvailabilityHint, PhoneVerificationFields, usePhoneVerification } from "../auth/phoneVerification.jsx";
import { addPlatformDays, attendanceOutcomeLabel, browserLocationErrorMessage, currentVilniusTimeRounded5, formatJobTitle, formatNetPay, formatWorkedMinutes, isSearchLocationFresh, jobHasEnded, jobStartMoment, localDateISO, nextFourteenDays, notificationPresentation, requestBrowserLocation, timeRangesOverlap, workerCheckInWindowOpen } from "../lib/jobs.js";
import { ConversationModal, DisputeConversationModal, GroupConversationModal } from "../chat/conversations.jsx";
import { LongTermConversationModal, LongTermOfferDetails, longTermContractLabel, longTermStatusLabel, longTermWorkerUpdateLabel, longTermWorkerUpdateTone, openEmploymentContract, safeStorageFileName } from "../longterm/longTerm.jsx";
import { AccountBugReportZone, AccountDeleteZone, BugReportModal, BugResolutionNotice, DASHBOARD_PAGE_SIZE, DashboardPagination, DeleteAccountModal, MainSiteInPageAlerts, RELIABILITY_MODAL_STYLES, WebPushSettings } from "../dashboard/shared.jsx";
import { formatReliabilityChange, formatReliabilityPenaltyDate, formatReliabilityScore, reliabilityScoreColor, workerReliabilityPenaltyMeta } from "../employer/plans.js";
import { MonthlyAwardMiniList, monthlyAwardPreviousMonthISO } from "../awards/monthlyAwards.jsx";
import { CompanyBadge, workerAvatarUrl } from "../ui/avatars.jsx";
import { AdminPrivateInboxButton } from "../admin/adminParts.jsx";
import { WorkAbroadPreference } from "./workAbroad.jsx";

export function WorkerDashboard({ user, onLogout, onAdminReturn = null }) {
  const days = nextFourteenDays();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [originalSkills, setOriginalSkills] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [workerInvitationPage, setWorkerInvitationPage] = useState(1);
  const [recentEmployerRatings, setRecentEmployerRatings] = useState([]);
  const [recentEmployerRatingsLoading, setRecentEmployerRatingsLoading] = useState(false);
  const [workerNotifications, setWorkerNotifications] = useState([]);
  const [monthlyAwards, setMonthlyAwards] = useState([]);
  const [companyAwardsById, setCompanyAwardsById] = useState({});
  const [confirmedJobs, setConfirmedJobs] = useState([]);
  const [respondingInvitation, setRespondingInvitation] = useState(null);
  const [confirmInvitation, setConfirmInvitation] = useState(null);
  const [commitmentChecked, setCommitmentChecked] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [groupConversation, setGroupConversation] = useState(null);
  const [disputeConversation, setDisputeConversation] = useState(null);
  const [longTermOffers, setLongTermOffers] = useState([]);
  const [longTermUnreadByOffer, setLongTermUnreadByOffer] = useState({});
  const [longTermOfferProgressById, setLongTermOfferProgressById] = useState({});
  const [longTermOfferTarget, setLongTermOfferTarget] = useState(null);
  const [longTermConversation, setLongTermConversation] = useState(null);
  const [longTermEndNotice, setLongTermEndNotice] = useState(null);
  const [longTermEndNoticeBusy, setLongTermEndNoticeBusy] = useState(false);
  const [longTermBusy, setLongTermBusy] = useState(false);
  const [longTermSignedContractFile, setLongTermSignedContractFile] = useState(null);
  const [workdays, setWorkdays] = useState([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugReportNotice, setBugReportNotice] = useState("");
  const [showWorkerStats, setShowWorkerStats] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      return window.localStorage.getItem(`worker-stats-open:${user?.id || "guest"}`) === "1";
    } catch {
      return false;
    }
  });
  const [showWorkerReliabilityInfo, setShowWorkerReliabilityInfo] = useState(false);
  const [workerPenaltyHistory, setWorkerPenaltyHistory] = useState([]);
  const [showWorkTimeLoginReminder, setShowWorkTimeLoginReminder] = useState(false);
  const [workerActivePage, setWorkerActivePage] = useState(1);
  const [workerHistoryPage, setWorkerHistoryPage] = useState(1);
  const [isPhoneLayout, setIsPhoneLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 620;
  });
  const [workerHistoryMobileIndex, setWorkerHistoryMobileIndex] = useState(0);
  const [availabilityMobileIndex, setAvailabilityMobileIndex] = useState(0);
  const [workerProfileEditorTarget, setWorkerProfileEditorTarget] = useState("profile");
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [availabilityValidationMessages, setAvailabilityValidationMessages] = useState({});
  const workerProfileEditorRef = useRef(null);
  const profileFieldRefs = useRef({});

  useEffect(() => {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(
        `worker-stats-open:${user.id}`,
        showWorkerStats ? "1" : "0"
      );
    } catch {}
  }, [user?.id, showWorkerStats]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncPhoneLayout = () => setIsPhoneLayout(window.innerWidth <= 620);
    syncPhoneLayout();
    window.addEventListener("resize", syncPhoneLayout);
    return () => window.removeEventListener("resize", syncPhoneLayout);
  }, []);

  useEffect(() => {
    if (loading || !user?.id) return undefined;

    const loginKey = `worker-worktime-reminder:${user.id}:${
      user.last_sign_in_at || "current"
    }`;

    try {
      if (window.sessionStorage.getItem(loginKey) === "shown") {
        return undefined;
      }
      window.sessionStorage.setItem(loginKey, "shown");
    } catch {}

    setShowWorkTimeLoginReminder(true);
    const timer = window.setTimeout(() => {
      setShowWorkTimeLoginReminder(false);
    }, 30000);

    return () => window.clearTimeout(timer);
  }, [loading, user?.id, user?.last_sign_in_at]);

  useEffect(() => {
    if (!user?.id) {
      setLongTermOfferProgressById({});
      return;
    }
    try {
      const raw = window.localStorage.getItem(`lt-worker-progress:${user.id}`);
      setLongTermOfferProgressById(raw ? JSON.parse(raw) : {});
    } catch {
      setLongTermOfferProgressById({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(
        `lt-worker-progress:${user.id}`,
        JSON.stringify(longTermOfferProgressById)
      );
    } catch {}
  }, [user?.id, longTermOfferProgressById]);

  function markLongTermOfferProgress(offerId, patch) {
    if (!offerId) return;
    setLongTermOfferProgressById((current) => ({
      ...current,
      [offerId]: {
        ...(current?.[offerId] || {}),
        ...patch,
      },
    }));
  }

  useEffect(() => {
    if (!longTermOfferTarget?.id) return;
    setLongTermOfferTarget((current) =>
      current?.id === longTermOfferTarget.id
        ? {
            ...current,
            ...(longTermOffers.find((item) => item.id === current.id) || {}),
          }
        : current
    );
  }, [longTermOffers, longTermOfferTarget?.id]);

  useEffect(() => {
    if (!showProfileEditor) return;
    setProfileSaved(false);

    const timer = window.setTimeout(() => {
      const node =
        workerProfileEditorTarget === "availability"
          ? document.getElementById("worker-availability-editor")
          : workerProfileEditorRef.current;
      if (!node) return;

      const top =
        node.getBoundingClientRect().top + window.scrollY - 88;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [showProfileEditor, workerProfileEditorTarget]);
  const [needsAvailabilityConfirm, setNeedsAvailabilityConfirm] = useState(false);
  const [confirmingAvailability, setConfirmingAvailability] = useState(false);
  const [workerAttendanceTarget, setWorkerAttendanceTarget] = useState(null);
  const [workerAttendanceMode, setWorkerAttendanceMode] = useState(null);
  const [workerAttendanceNote, setWorkerAttendanceNote] = useState("");
  const [workerEvidenceFile, setWorkerEvidenceFile] = useState(null);
  const [arrivalHelpTarget, setArrivalHelpTarget] = useState(null);
  const [workerCheckInTarget, setWorkerCheckInTarget] = useState(null);
  const [workerCheckInTime, setWorkerCheckInTime] = useState("");
  const [workdayDetailsTarget, setWorkdayDetailsTarget] = useState(null);
  const [workerCompanyProfileTarget, setWorkerCompanyProfileTarget] = useState(null);
  const [workerCompanyProfileLoading, setWorkerCompanyProfileLoading] = useState(false);
  const [employerReviewOpportunities, setEmployerReviewOpportunities] = useState([]);
  const [employerReviewTarget, setEmployerReviewTarget] = useState(null);
  const [employerReviewScore, setEmployerReviewScore] = useState(null);
  const [employerReviewComment, setEmployerReviewComment] = useState("");
  const [employerReviewSaving, setEmployerReviewSaving] = useState(false);
  const [showUrgentAvailability, setShowUrgentAvailability] = useState(false);
  const [urgentSaving, setUrgentSaving] = useState(false);
  const [urgentAvailability, setUrgentAvailability] = useState({
    city: "",
    active: false,
  });
  const [urgentForm, setUrgentForm] = useState({
    city: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] = useState(false);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [searchLocation, setSearchLocation] = useState({
    enabled: false,
    accuracyM: null,
    updatedAt: null,
  });
  const [searchLocationBusy, setSearchLocationBusy] = useState(false);
  const [searchLocationError, setSearchLocationError] = useState("");
  const searchLocationFresh = Boolean(
    searchLocation.enabled && isSearchLocationFresh(searchLocation.updatedAt)
  );
  const searchLocationNeedsRefresh = Boolean(
    searchLocation.enabled && !searchLocationFresh
  );
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    displayName: "",
    city: "Vilnius",
    phone: "",
    travelRadius: 30,
    hasDrivingLicenseB: false,
    hasIndividualActivity: false,
    yearsExperience: 0,
    shortBio: "",
    avatarPath: "",
  });
  const phoneVerification = usePhoneVerification({
    active: true, purpose: "change", phone: form.phone, email: user.email, userId: user.id,
  });
  const [metrics, setMetrics] = useState({
    attendanceRate: 100,
    completedJobs: 0,
    ratingAverage: null,
    ratingCount: 0,
    noShowCount: 0,
    restrictedUntil: null,
    reliabilityGoodJobsSincePenalty: 0,
    reliabilityLastPenaltyAt: null,
  });
  const [workerStats, setWorkerStats] = useState({
    monthWorkedDays: 0,
    monthWorkedMinutes: 0,
    monthJobs: 0,
    activeJobs: 0,
    cancelledByEmployer: 0,
    unexcusedEarlyLeaveCount: 0,
  });
  const [availabilityConflictDates, setAvailabilityConflictDates] = useState([]);
  const [availability, setAvailability] = useState(() =>
    Object.fromEntries(
      days.map((day) => [
        day.iso,
        { available: false, from: "08:00", to: "17:00" },
      ])
    )
  );

  useEffect(() => {
    loadDashboard();
  }, [user.id]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(invitations.length / DASHBOARD_PAGE_SIZE));
    setWorkerInvitationPage((current) => Math.min(current, totalPages));
  }, [invitations.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      Promise.all([
        loadInvitations(),
        loadWorkerStats(),
        loadEmployerReviewOpportunities(),
      ]).catch(() => {
        // Periodinis atnaujinimas neturi trukdyti pagrindiniam darbui.
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [user.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadRecentEmployerRatings({ background: true }).catch(() => {
        // Atsiliepimų atnaujinimas vyksta retai ir neturi judinti pagrindinio vaizdo.
      });
    }, 5 * 60 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [user.id]);

  useEffect(() => {
    const refreshLongTermStatus = () => {
      Promise.all([loadLongTermOffers(), loadLongTermEndNotice()]).catch(() => {
        // Aktyvaus įdarbinimo būsenos atnaujinimas neturi trukdyti naudotis paskyra.
      });
    };

    const timer = window.setInterval(refreshLongTermStatus, 2000);
    const onFocus = () => refreshLongTermStatus();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshLongTermStatus();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user.id]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        await supabase.rpc("worker_touch_activity");
      } catch {
        // Aktyvumo atnaujinimas neturi trukdyti naudotis paskyra.
      }
    }, 30 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [user.id]);

  async function loadLongTermOffers() {
    const [result, unreadResult] = await Promise.all([
      supabase.rpc("get_worker_long_term_offers"),
      supabase.rpc("get_worker_long_term_unread_counts"),
    ]);
    if (result.error) throw result.error;
    if (unreadResult.error) throw unreadResult.error;
    const rows = result.data || [];
    const unreadMap = Object.fromEntries(
      (unreadResult.data || []).map((row) => [
        row.placement_id,
        Number(row.unread_count || 0),
      ])
    );

    const companyIds = [...new Set(rows.map((row) => row.company_id).filter(Boolean))];
    if (companyIds.length) {
      const awardsResult = await supabase
        .from("monthly_awards")
        .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
        .eq("recipient_type", "company")
        .eq("award_month", monthlyAwardPreviousMonthISO())
        .in("recipient_id", companyIds);

      if (!awardsResult.error) {
        setCompanyAwardsById((current) => {
          const next = { ...current };
          for (const companyId of companyIds) {
            next[companyId] = (next[companyId] || []).filter(
              (award) => String(award.award_month || "").slice(0, 10) !== monthlyAwardPreviousMonthISO()
            );
          }
          for (const award of awardsResult.data || []) {
            if (!next[award.recipient_id]) next[award.recipient_id] = [];
            next[award.recipient_id].push(award);
          }
          return next;
        });
      }
    }

    setLongTermOffers(rows);
    setLongTermUnreadByOffer(unreadMap);
    setLongTermOfferTarget((current) =>
      current ? rows.find((row) => row.id === current.id) || null : current
    );
    return rows;
  }

  async function loadLongTermEndNotice() {
    const result = await supabase.rpc("get_worker_unacknowledged_long_term_end");
    if (result.error) throw result.error;
    const nextNotice = Array.isArray(result.data) ? result.data[0] || null : null;
    setLongTermEndNotice(nextNotice);
    return nextNotice;
  }

  async function acknowledgeLongTermEnd() {
    if (!longTermEndNotice?.id || longTermEndNoticeBusy) return;
    setLongTermEndNoticeBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("worker_acknowledge_long_term_end", {
        p_placement_id: longTermEndNotice.id,
      });
      if (result.error) throw result.error;
      setLongTermEndNotice(null);
      await Promise.all([
        loadLongTermOffers(),
        loadInvitations(),
        loadWorkerStats(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti pranešimo apie nutrauktą įdarbinimą.");
    } finally {
      setLongTermEndNoticeBusy(false);
    }
  }

  async function workerConfirmLongTermOffer(offer) {
    if (!offer?.id || longTermBusy) return;
    setLongTermBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await supabase.rpc("worker_confirm_long_term_placement", {
        p_placement_id: offer.id,
      });
      if (result.error) throw result.error;
      await loadLongTermOffers();
      setNotice(
        result.data === "active"
          ? "Įsidarbinimas patvirtintas abiejų pusių. Papildomų darbų matomumas automatiškai priklausys nuo jūsų pažymėto laisvo laiko ir aktyvaus įdarbinimo grafiko."
          : "Jūsų patvirtinimas išsaugotas. Laukiama darbdavio patvirtinimo."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti įsidarbinimo.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function workerSubmitSignedContract(offer) {
    if (!offer?.id || !longTermSignedContractFile || longTermBusy) return;

    const blockingActiveEmployment = longTermOffers.find(
      (row) => row.status === "active" && row.id !== offer.id
    );
    if (blockingActiveEmployment) {
      setError(
        `Jau turite aktyvų ilgalaikį darbą su ${
          blockingActiveEmployment.company_name || "kitu darbdaviu"
        }. Šį pasiūlymą galite peržiūrėti ir aptarti, tačiau patvirtinti galėsite tik pasibaigus dabartiniam ilgalaikiam darbui.`
      );
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(longTermSignedContractFile.type)) {
      setError("Įkelkite PDF arba DOCX formato pasirašytą sutartį.");
      return;
    }
    if (longTermSignedContractFile.size > 15 * 1024 * 1024) {
      setError("Sutarties failas negali būti didesnis nei 15 MB.");
      return;
    }

    setLongTermBusy(true);
    setError("");
    setNotice("");
    let storagePath = "";
    try {
      storagePath = `${offer.id}/worker/${Date.now()}-${safeStorageFileName(
        longTermSignedContractFile.name
      )}`;

      const uploadResult = await supabase.storage
        .from("employment-contracts")
        .upload(storagePath, longTermSignedContractFile, {
          upsert: false,
          contentType: longTermSignedContractFile.type,
        });
      if (uploadResult.error) throw uploadResult.error;

      const result = await supabase.rpc("worker_submit_signed_long_term_contract", {
        p_placement_id: offer.id,
        p_contract_path: storagePath,
        p_contract_name: longTermSignedContractFile.name,
      });
      if (result.error) throw result.error;

      setLongTermSignedContractFile(null);
      await loadLongTermOffers();
      setNotice(
        "Pasirašyta darbo sutartis išsiųsta darbdaviui. Laukiama galutinio darbdavio patvirtinimo."
      );
    } catch (err) {
      if (storagePath) {
        await supabase.storage.from("employment-contracts").remove([storagePath]).catch(() => {});
      }
      setError(err?.message || "Nepavyko išsiųsti pasirašytos sutarties.");
    } finally {
      setLongTermBusy(false);
    }
  }

  async function workerMarkLongTermOfferViewed(offer) {
    if (!offer?.id) return offer;

    const nowIso = new Date().toISOString();
    const optimistic = {
      ...offer,
      worker_viewed_at: offer.worker_viewed_at || nowIso,
    };

    setLongTermOffers((current) =>
      current.map((item) => (item.id === offer.id ? optimistic : item))
    );
    setLongTermOfferTarget((current) =>
      current?.id === offer.id ? { ...current, ...optimistic } : current
    );

    try {
      const result = await supabase.rpc("worker_mark_long_term_offer_viewed", {
        p_placement_id: offer.id,
      });
      if (result.error) throw result.error;
    } catch (err) {
      setError(err?.message || "Nepavyko pažymėti pasiūlymo peržiūrėtu.");
    }

    return optimistic;
  }

  async function workerOpenLongTermContract(path, offerId = null) {
    try {
      setError("");

      if (offerId) {
        const nowIso = new Date().toISOString();
        setLongTermOffers((current) =>
          current.map((item) =>
            item.id === offerId
              ? {
                  ...item,
                  worker_viewed_at: item.worker_viewed_at || nowIso,
                  worker_contract_viewed_at:
                    item.worker_contract_viewed_at || nowIso,
                }
              : item
          )
        );
        setLongTermOfferTarget((current) =>
          current?.id === offerId
            ? {
                ...current,
                worker_viewed_at: current.worker_viewed_at || nowIso,
                worker_contract_viewed_at:
                  current.worker_contract_viewed_at || nowIso,
              }
            : current
        );

        const markResult = await supabase.rpc(
          "worker_mark_long_term_contract_viewed",
          { p_placement_id: offerId }
        );
        if (markResult.error) throw markResult.error;
      }

      await openEmploymentContract(path);
    } catch (err) {
      setError(err?.message || "Nepavyko atidaryti sutarties.");
    }
  }

  async function workerDeclineLongTermOffer(offer) {
    if (!offer?.id || longTermBusy) return;
    setLongTermBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("worker_decline_long_term_placement", {
        p_placement_id: offer.id,
      });
      if (result.error) throw result.error;
      setLongTermOfferTarget(null);
      await loadLongTermOffers();
      setNotice("Įdarbinimo pasiūlymas atmestas.");
    } catch (err) {
      setError(err?.message || "Nepavyko atmesti pasiūlymo.");
    } finally {
      setLongTermBusy(false);
    }
  }


  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const start = days[0].iso;
      const end = days[days.length - 1].iso;

      const [
        profileResult,
        privateResult,
        workerResult,
        skillsResult,
        workerSkillsResult,
        availabilityResult,
        workerPenaltiesResult,
        workerAwardsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, first_name, last_name, city")
          .eq("id", user.id)
          .single(),
        supabase
          .from("user_private")
          .select("phone, birth_date")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("worker_profiles")
          .select(
            "travel_radius_km, has_driving_license_b, has_individual_activity, years_experience, short_bio, avatar_path, attendance_rate, completed_jobs, rating_average, rating_count, no_show_count, restricted_until, last_active_at, availability_confirmed_at, urgent_city, urgent_is_active, reliability_good_jobs_since_penalty, reliability_last_penalty_at, search_location_enabled, search_location_accuracy_m, search_location_updated_at"
          )
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("skills")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("worker_skills")
          .select("skill_id")
          .eq("worker_id", user.id),
        supabase
          .from("availability")
          .select("available_date, status, available_from, available_to")
          .eq("worker_id", user.id)
          .gte("available_date", start)
          .lte("available_date", end),
        supabase
          .from("worker_penalties")
          .select("id, penalty_type, reason, restriction_days, restricted_until, created_at")
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("monthly_awards")
          .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
          .eq("recipient_type", "worker")
          .eq("recipient_id", user.id)
          .order("award_month", { ascending: false })
          .limit(120),
      ]);

      const failed = [
        profileResult,
        privateResult,
        workerResult,
        skillsResult,
        workerSkillsResult,
        availabilityResult,
        workerPenaltiesResult,
        workerAwardsResult,
      ].find((result) => result.error);

      if (failed?.error) throw failed.error;

      const profile = profileResult.data;
      const privateData = privateResult.data;
      const worker = workerResult.data;
      setMonthlyAwards(workerAwardsResult.data || []);

      const availabilityConfirmedAt = worker?.availability_confirmed_at
        ? new Date(worker.availability_confirmed_at).getTime()
        : 0;
      const activityWindowMs = 24 * 60 * 60 * 1000;

      setNeedsAvailabilityConfirm(
        !availabilityConfirmedAt ||
          Date.now() - availabilityConfirmedAt > activityWindowMs
      );

      const fallbackNameParts = String(profile?.display_name || "").trim().split(/\s+/).filter(Boolean);
      const firstName = profile?.first_name || fallbackNameParts[0] || "";
      const lastName = profile?.last_name || fallbackNameParts.slice(1).join(" ") || "";

      setForm({
        firstName,
        lastName,
        birthDate: privateData?.birth_date || "",
        displayName: `${firstName} ${lastName}`.trim() || profile?.display_name || "",
        city: profile?.city || "Vilnius",
        phone: privateData?.phone || "",
        travelRadius: worker?.travel_radius_km ?? 30,
        hasDrivingLicenseB: Boolean(worker?.has_driving_license_b),
        hasIndividualActivity: Boolean(worker?.has_individual_activity),
        yearsExperience: worker?.years_experience ?? 0,
        shortBio: worker?.short_bio || "",
        avatarPath: worker?.avatar_path || "",
      });
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarMarkedForRemoval(false);
      setSearchLocation({
        enabled: Boolean(worker?.search_location_enabled),
        accuracyM:
          worker?.search_location_accuracy_m === null ||
          worker?.search_location_accuracy_m === undefined
            ? null
            : Number(worker.search_location_accuracy_m),
        updatedAt: worker?.search_location_updated_at || null,
      });
      setSearchLocationError("");

      setUrgentAvailability({
        city: worker?.urgent_city || "",
        active: Boolean(worker?.urgent_is_active),
      });
      setUrgentForm({
        city: worker?.urgent_city || profile?.city || "Vilnius",
      });

      setWorkerPenaltyHistory(workerPenaltiesResult.data || []);

      setMetrics({
        attendanceRate: Number(worker?.attendance_rate ?? 100),
        completedJobs: Number(worker?.completed_jobs ?? 0),
        ratingAverage:
          worker?.rating_average === null || worker?.rating_average === undefined
            ? null
            : Number(worker.rating_average),
        ratingCount: Number(worker?.rating_count || 0),
        noShowCount: Number(worker?.no_show_count || 0),
        restrictedUntil: worker?.restricted_until || null,
        reliabilityGoodJobsSincePenalty: Number(
          worker?.reliability_good_jobs_since_penalty || 0
        ),
        reliabilityLastPenaltyAt: worker?.reliability_last_penalty_at || null,
      });

      setSkills(skillsResult.data || []);

      const selected = (workerSkillsResult.data || []).map((row) =>
        Number(row.skill_id)
      );
      setSelectedSkills(selected);
      setOriginalSkills(selected);

      const storedAvailability = Object.fromEntries(
        (availabilityResult.data || []).map((row) => [
          row.available_date,
          {
            available: row.status === "available",
            from: row.available_from?.slice(0, 5) || "08:00",
            to: row.available_to?.slice(0, 5) || "17:00",
          },
        ])
      );

      setAvailability(
        Object.fromEntries(
          days.map((day) => [
            day.iso,
            storedAvailability[day.iso] || {
              available: false,
              from: "08:00",
              to: "17:00",
            },
          ])
        )
      );

      setLoading(false);

      void Promise.allSettled([
        supabase.rpc("worker_touch_activity"),
        loadInvitations(),
        loadWorkerStats(),
        loadRecentEmployerRatings({ background: true }),
        loadEmployerReviewOpportunities(),
        loadLongTermOffers(),
        loadLongTermEndNotice(),
      ]);
    } catch (err) {
      setError(err?.message || "Nepavyko įkelti profilio.");
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setProfileSaved(false);
    setProfileFormErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "firstName" || key === "lastName") {
        next.displayName = `${next.firstName || ""} ${next.lastName || ""}`.trim();
      }
      return next;
    });
  }

  function showProfileFieldError(field, message) {
    setProfileFormErrors((current) => ({ ...current, [field]: message }));
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const node = profileFieldRefs.current[field];
        if (!node) return;
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusTarget = node.querySelector?.(
          'input, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        focusTarget?.focus?.({ preventScroll: true });
      });
    });
  }

  function urgentAvailabilityIsActive() {
    return Boolean(urgentAvailability.active);
  }

  function hasCurrentScheduledWork() {
    const hasShortTermWork = workdays.some((item) =>
      ["confirmed", "no_show"].includes(item.status) &&
      ["open", "filled", "in_progress"].includes(item.job?.status) &&
      !jobHasEnded(item.job)
    );

    if (hasShortTermWork) return true;

    const now = new Date();
    const today = localDateISO(now);
    const weekday = now.getDay() === 0 ? 7 : now.getDay();
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    return longTermOffers.some((offer) => {
      if (offer.status !== "active" || offer.schedule_type !== "fixed") return false;
      if (offer.proposed_start_date && today < offer.proposed_start_date) return false;
      if (offer.proposed_end_date && today > offer.proposed_end_date) return false;

      const schedule = Array.isArray(offer.schedule) ? offer.schedule : [];
      const row = schedule.find((item) => Number(item.weekday) === weekday);
      if (!row?.start_time || !row?.end_time) return false;

      const start = String(row.start_time).slice(0, 5);
      const end = String(row.end_time).slice(0, 5);
      return nowTime >= start && nowTime < end;
    });
  }

  async function enableUrgentAvailability() {
    const city = urgentForm.city.trim();

    if (hasCurrentScheduledWork()) {
      setError("Šiuo metu turite patvirtintą darbą. „Laisvas dabar“ galėsite įjungti pasibaigus suplanuotam darbo laikui.");
      return;
    }

    if (!city) {
      setError("Nurodykite miestą, kuriame šiuo metu galite dirbti.");
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Prieš įjungdami režimą „Laisvas dabar“ profilyje pridėkite telefono numerį."
      );
      return;
    }

    setUrgentSaving(true);
    setError("");
    setNotice("");

    try {
      const canonicalCity = await canonicalCityName(city);

      const result = await supabase.rpc("worker_set_urgent_availability", {
        p_city: canonicalCity,
      });

      if (result.error) throw result.error;

      const row = result.data?.[0] || {};
      setUrgentAvailability({
        city: row.urgent_city || canonicalCity,
        active: Boolean(row.urgent_is_active),
      });
      setUrgentForm((current) => ({
        ...current,
        city: row.urgent_city || canonicalCity,
      }));
      setNotice("");
    } catch (err) {
      setError(err?.message || "Nepavyko įjungti režimo „Laisvas dabar“.");
    } finally {
      setUrgentSaving(false);
    }
  }

  async function disableUrgentAvailability() {
    setUrgentSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("worker_clear_urgent_availability");
      if (result.error) throw result.error;

      setUrgentAvailability({ city: "", active: false });
      setNotice("");
    } catch (err) {
      setError(err?.message || "Nepavyko išjungti režimo „Laisvas dabar“.");
    } finally {
      setUrgentSaving(false);
    }
  }

  function chooseAvatarFile(file) {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Profilio nuotrauka turi būti JPG, PNG arba WEBP formato.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profilio nuotrauka negali būti didesnė nei 5 MB.");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setProfileSaved(false);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarMarkedForRemoval(false);
    setError("");
  }

  function markAvatarForRemoval() {
    setProfileSaved(false);
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarMarkedForRemoval(Boolean(form.avatarPath));
    setError("");
  }

  function toggleSkill(skillId) {
    setProfileSaved(false);
    setSelectedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  }

  function confirmedJobsOnDate(date) {
    return confirmedJobs
      .filter((job) => job?.work_date === date)
      .sort((a, b) =>
        String(a?.start_time || "00:00").localeCompare(String(b?.start_time || "00:00"))
      );
  }

  function confirmedJobOnDate(date) {
    return confirmedJobsOnDate(date)[0] || null;
  }

  function isoWeekday(date) {
    const parsed = new Date(`${date}T12:00:00Z`);
    const day = parsed.getUTCDay();
    return day === 0 ? 7 : day;
  }

  function longTermSchedulesOnDate(date) {
    const weekday = isoWeekday(date);

    return longTermOffers.flatMap((offer) => {
      if (offer?.status !== "active" || offer?.schedule_type !== "fixed") {
        return [];
      }
      if (offer.proposed_start_date && date < offer.proposed_start_date) return [];
      if (offer.proposed_end_date && date > offer.proposed_end_date) return [];

      const schedule = Array.isArray(offer.schedule) ? offer.schedule : [];
      return schedule
        .filter((row) => Number(row?.weekday) === weekday && row?.start_time && row?.end_time)
        .map((row) => ({
          placementId: offer.id,
          companyName: offer.company_name || "Darbdavys",
          positionTitle: offer.position_title || "Ilgalaikis įdarbinimas",
          start_time: String(row.start_time).slice(0, 5),
          end_time: String(row.end_time).slice(0, 5),
          break_start_time: row.break_start_time
            ? String(row.break_start_time).slice(0, 5)
            : null,
          break_end_time: row.break_end_time
            ? String(row.break_end_time).slice(0, 5)
            : null,
        }));
    });
  }

  function timeToMinutes(value) {
    if (!value) return null;
    const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  }

  function minutesToTime(value) {
    const safe = Math.max(0, Math.min(23 * 60 + 59, Number(value) || 0));
    const hours = Math.floor(safe / 60);
    const minutes = safe % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function shiftIsoDate(date, offsetDays) {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + offsetDays);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function availabilityIntervalForState(date, state = availability[date]) {
    if (!state?.available) return null;
    const fromMinutes = timeToMinutes(state.from);
    const toMinutes = timeToMinutes(state.to);
    if (fromMinutes === null || toMinutes === null || fromMinutes === toMinutes) {
      return null;
    }
    return {
      start: fromMinutes,
      end: toMinutes + (toMinutes <= fromMinutes ? 1440 : 0),
      overnight: toMinutes <= fromMinutes,
    };
  }

  function availabilityConflictForDate(date, state = availability[date]) {
    const selected = availabilityIntervalForState(date, state);
    if (!selected) return null;

    const locked = [];
    for (let offset = -1; offset <= 1; offset += 1) {
      const lockedDate = shiftIsoDate(date, offset);
      const base = offset * 1440;

      for (const job of confirmedJobsOnDate(lockedDate)) {
        const start = timeToMinutes(job?.start_time || "00:00");
        const end = timeToMinutes(job?.end_time || "23:59");
        if (start === null || end === null) continue;
        const endAbs = base + end + (end <= start ? 1440 : 0);
        locked.push({
          start: base + start - 60,
          end: endAbs + 60,
          label: `${formatJobTitle(job?.title, "Patvirtintas darbas")} · ${String(job?.start_time || "").slice(0, 5)}–${String(job?.end_time || "").slice(0, 5)}`,
        });
      }

      for (const row of longTermSchedulesOnDate(lockedDate)) {
        const start = timeToMinutes(row?.start_time);
        const end = timeToMinutes(row?.end_time);
        if (start === null || end === null) continue;
        const endAbs = base + end + (end <= start ? 1440 : 0);
        locked.push({
          start: base + start - 60,
          end: endAbs + 60,
          label: `Įdarbinimo grafikas · ${row.companyName || "Darbdavys"} · ${row.start_time}–${row.end_time}`,
        });
      }
    }

    return (
      locked.find(
        (item) => selected.start < item.end && selected.end > item.start
      ) || null
    );
  }

  function availabilityFreeWindowsForDate(date) {
    const jobs = confirmedJobsOnDate(date);
    const longTermSchedules = longTermSchedulesOnDate(date);
    const occupied = [
      ...jobs.map((job) => ({
        type: "short-term",
        start_time: job?.start_time || "00:00",
        end_time: job?.end_time || "23:59",
      })),
      ...longTermSchedules.map((row) => ({
        type: "long-term",
        start_time: row.start_time,
        end_time: row.end_time,
      })),
    ];

    return { jobs, longTermSchedules, occupied };
  }

  function availabilityFitsWindow(date, state = availability[date]) {
    if (!state?.available) return false;
    return Boolean(availabilityIntervalForState(date, state));
  }

  function updateAvailability(date, patch) {
    setProfileSaved(false);
    setAvailabilityConflictDates((current) =>
      current.filter((item) => item !== date)
    );
    setAvailabilityValidationMessages((current) => {
      if (!current[date]) return current;
      const next = { ...current };
      delete next[date];
      return next;
    });
    setAvailability((current) => ({
      ...current,
      [date]: { ...current[date], ...patch },
    }));
  }

  async function loadRecentEmployerRatings({ background = false } = {}) {
    if (!background) setRecentEmployerRatingsLoading(true);
    try {
      const result = await supabase.rpc("get_worker_recent_ratings", {
        p_worker_id: user.id,
        p_limit: 3,
      });
      if (result.error) throw result.error;
      const rows = result.data || [];
      setRecentEmployerRatings(rows);
      if (rows.length) {
        const fallbackAverage =
          rows.reduce((sum, review) => sum + Number(review.score || 0), 0) / rows.length;
        setMetrics((current) => ({
          ...current,
          ratingAverage:
            current.ratingAverage === null || current.ratingAverage === undefined
              ? fallbackAverage
              : current.ratingAverage,
          ratingCount: Math.max(Number(current.ratingCount || 0), rows.length),
        }));
      }
    } finally {
      if (!background) setRecentEmployerRatingsLoading(false);
    }
  }

  async function loadWorkerStats() {
    const [statsResult, workerResult] = await Promise.all([
      supabase.rpc("get_worker_public_stats", { p_worker_id: user.id }),
      supabase
        .from("worker_profiles")
        .select(
          "attendance_rate, rating_average, rating_count, no_show_count, restricted_until, completed_jobs, unexcused_early_leave_count, reliability_good_jobs_since_penalty, reliability_last_penalty_at"
        )
        .eq("user_id", user.id)
        .single(),
    ]);

    if (statsResult.error) throw statsResult.error;
    if (workerResult.error) throw workerResult.error;

    const stats = statsResult.data?.[0] || {};
    const worker = workerResult.data || {};

    setWorkerStats({
      monthWorkedDays: Number(stats.month_worked_days || 0),
      monthWorkedMinutes: Number(stats.month_worked_minutes || 0),
      monthJobs: Number(stats.month_jobs || 0),
      activeJobs: Number(stats.active_jobs || 0),
      cancelledByEmployer: Number(stats.cancelled_by_employer || 0),
      unexcusedEarlyLeaveCount: Number(
        stats.unexcused_early_leave_count ||
          worker.unexcused_early_leave_count ||
          0
      ),
    });

    setMetrics((current) => ({
      ...current,
      attendanceRate: Number(
        stats.attendance_rate ?? worker.attendance_rate ?? current.attendanceRate ?? 100
      ),
      completedJobs: Number(worker.completed_jobs || 0),
      ratingAverage:
        stats.rating_average === null || stats.rating_average === undefined
          ? worker.rating_average === null || worker.rating_average === undefined
            ? null
            : Number(worker.rating_average)
          : Number(stats.rating_average),
      ratingCount: Number(stats.rating_count ?? worker.rating_count ?? 0),
      noShowCount: Number(stats.no_show_count ?? worker.no_show_count ?? 0),
      restrictedUntil: worker.restricted_until || null,
      reliabilityGoodJobsSincePenalty: Number(
        worker.reliability_good_jobs_since_penalty || 0
      ),
      reliabilityLastPenaltyAt: worker.reliability_last_penalty_at || null,
    }));
  }

  async function loadEmployerReviewOpportunities() {
    const result = await supabase.rpc(
      "get_worker_employer_review_opportunities"
    );

    if (result.error) throw result.error;
    setEmployerReviewOpportunities(result.data || []);
  }

  async function loadInvitations() {
    const [invitationResult, bookingResult, notificationResult] = await Promise.all([
      supabase
        .from("job_invitations")
        .select("id, job_id, status, message, invited_at, responded_at")
        .eq("worker_id", user.id)
        .order("invited_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id, job_id, invitation_id, status, confirmed_at, cancelled_at, cancellation_reason")
        .eq("worker_id", user.id)
        .order("confirmed_at", { ascending: false }),
      supabase
        .from("job_notifications")
        .select("id, job_id, invitation_id, event_type, created_at, read_at")
        .is("read_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (invitationResult.error) throw invitationResult.error;
    if (bookingResult.error) throw bookingResult.error;
    if (notificationResult.error) throw notificationResult.error;

    setWorkerNotifications(notificationResult.data || []);

    const invitationRows = invitationResult.data || [];
    const bookingRows = bookingResult.data || [];
    const allJobIds = [
      ...new Set([
        ...invitationRows.map((row) => row.job_id),
        ...bookingRows.map((row) => row.job_id),
      ].filter(Boolean)),
    ];

    if (!allJobIds.length) {
      setInvitations([]);
      setConfirmedJobs([]);
      setWorkdays([]);
      setCompanyAwardsById({});
      return;
    }

    const jobsResult = await supabase
      .from("jobs")
      .select(
        "id, title, city, address_text, work_date, start_time, end_time, break_start_time, break_end_time, description, pay_amount, pay_unit, company_id, status, transport_mode, cancellation_reason, cancelled_at"
      )
      .in("id", allJobIds);

    if (jobsResult.error) throw jobsResult.error;

    const companyIds = [
      ...new Set((jobsResult.data || []).map((job) => job.company_id).filter(Boolean)),
    ];

    let companies = [];
    if (companyIds.length) {
      const companiesResult = await supabase
        .from("companies")
        .select("id, name, avatar_path, reliability_rate, cancelled_confirmed_count")
        .in("id", companyIds);

      if (companiesResult.error) throw companiesResult.error;
      companies = companiesResult.data || [];
    }

    let companyReviewSummaries = [];
    if (companyIds.length) {
      const reviewSummaryResult = await supabase.rpc(
        "get_worker_company_review_summaries",
        { p_company_ids: companyIds }
      );

      if (reviewSummaryResult.error) throw reviewSummaryResult.error;
      companyReviewSummaries = reviewSummaryResult.data || [];
    }

    let companyAwards = [];
    if (companyIds.length) {
      const companyAwardsResult = await supabase
        .from("monthly_awards")
        .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
        .eq("recipient_type", "company")
        .in("recipient_id", companyIds)
        .order("award_month", { ascending: false });

      if (companyAwardsResult.error) throw companyAwardsResult.error;
      companyAwards = companyAwardsResult.data || [];
    }

    const nextCompanyAwardsById = {};
    for (const award of companyAwards) {
      if (!nextCompanyAwardsById[award.recipient_id]) {
        nextCompanyAwardsById[award.recipient_id] = [];
      }
      nextCompanyAwardsById[award.recipient_id].push(award);
    }
    setCompanyAwardsById(nextCompanyAwardsById);

    let attendanceRows = [];
    const bookingIds = bookingRows.map((row) => row.id);
    if (bookingIds.length) {
      const attendanceResult = await supabase
        .from("attendance")
        .select(
          "id, booking_id, status, worker_check_in_at, employer_check_in_at, worker_workday_claim, worker_claimed_at, employer_outcome, employer_marked_at, actual_end_time, employer_note, worker_response, worker_response_note, worker_responded_at, dispute_status, final_outcome, finalized_at, worked_minutes, resolution_note, worker_evidence_path, worker_evidence_name"
        )
        .in("booking_id", bookingIds);

      if (attendanceResult.error) throw attendanceResult.error;
      attendanceRows = attendanceResult.data || [];
    }

    const jobMap = new Map((jobsResult.data || []).map((job) => [job.id, job]));
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    const companyReviewSummaryMap = new Map(
      companyReviewSummaries.map((row) => [row.company_id, row])
    );
    const attendanceMap = new Map(
      attendanceRows.map((row) => [row.booking_id, row])
    );

    const hasAcceptedFutureOrCurrentJob = bookingRows.some((booking) => {
      if (!["confirmed", "no_show"].includes(booking.status)) return false;
      const job = jobMap.get(booking.job_id);
      if (!job || !["open", "filled", "in_progress"].includes(job.status)) return false;
      return !jobHasEnded(job);
    });

    if (hasAcceptedFutureOrCurrentJob) {
      setUrgentAvailability((current) =>
        current.active ? { city: "", active: false } : current
      );
    }

    setInvitations(
      invitationRows
        .filter((invitation) => invitation.status === "pending")
        .map((invitation) => {
          const job = jobMap.get(invitation.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          return {
            ...invitation,
            job,
            companyName: company?.name || "Darbdavys",
            companyAvatarPath: company?.avatar_path || "",
            companyReliability: Number(company?.reliability_rate ?? 100),
            companyCancelledConfirmed: Number(
              company?.cancelled_confirmed_count ?? 0
            ),
            companyDisputeReviewCount: Number(
              companyReviewSummaryMap.get(job?.company_id)?.review_count || 0
            ),
            companyLatestDisputeReview:
              companyReviewSummaryMap.get(job?.company_id)
                ?.latest_review_comment || "",
          };
        })
        .filter((invitation) => {
          const job = invitation.job;
          if (!job || job.status !== "open") return false;
          const startsAt = jobStartMoment(job);
          return Boolean(startsAt && new Date() < startsAt);
        })
    );

    setConfirmedJobs(
      bookingRows
        .filter((booking) => booking.status === "confirmed")
        .map((booking) => {
          const job = jobMap.get(booking.job_id);
          if (!job) return null;
          const company = companyMap.get(job.company_id);
          return {
            ...job,
            companyName: company?.name || "Darbdavys",
          };
        })
        .filter(Boolean)
    );

    setWorkdays(
      bookingRows
        .map((booking) => {
          const job = jobMap.get(booking.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          return {
            ...booking,
            job,
            companyName: company?.name || "Darbdavys",
            companyAvatarPath: company?.avatar_path || "",
            companyDisputeReviewCount: Number(
              companyReviewSummaryMap.get(job?.company_id)?.review_count || 0
            ),
            companyLatestDisputeReview:
              companyReviewSummaryMap.get(job?.company_id)
                ?.latest_review_comment || "",
            attendance: attendanceMap.get(booking.id) || null,
          };
        })
        .filter((item) => item.job)
        .sort((a, b) =>
          String(b.job.work_date || "").localeCompare(String(a.job.work_date || ""))
        )
    );
  }

  function unreadWorkerNotifications(invitationId) {
    return workerNotifications.filter(
      (item) => item.invitation_id === invitationId
    );
  }

  function unreadWorkerJobNotifications(jobId) {
    return workerNotifications.filter(
      (item) => item.job_id === jobId && !item.invitation_id
    );
  }

  async function markWorkerJobUpdateNotificationsRead(jobId) {
    const ids = unreadWorkerJobNotifications(jobId)
      .filter((item) => item.event_type === "job_updated")
      .map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (!result.error) {
      setWorkerNotifications((current) =>
        current.filter((item) => !ids.includes(item.id))
      );
    }
  }

  async function markWorkerJobNotificationsRead(jobId) {
    const ids = unreadWorkerJobNotifications(jobId).map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setWorkerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  async function openWorkerGroupConversation(job) {
    setGroupConversation({
      jobId: job.id,
      title: job.title,
    });
  }

  async function markWorkerNotificationsRead(invitationId) {
    const ids = unreadWorkerNotifications(invitationId).map((item) => item.id);
    if (!ids.length) return;

    const result = await supabase
      .from("job_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setWorkerNotifications((current) =>
      current.filter((item) => !ids.includes(item.id))
    );
  }

  function invitationHasConflict(invitation) {
    if (!invitation?.job) return false;
    return confirmedJobs.some(
      (job) =>
        job.id !== invitation.job.id &&
        timeRangesOverlap(invitation.job, job)
    );
  }

  function openEmployerReview(opportunity) {
    setEmployerReviewTarget(opportunity);
    setEmployerReviewScore(null);
    setEmployerReviewComment("");
    setError("");
  }

  async function submitEmployerReview() {
    if (!employerReviewTarget?.attendance_id) return;

    const score = Number(employerReviewScore);
    const comment = employerReviewComment.trim();

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      setError("Pasirinkite įvertinimą nuo 1 iki 10.");
      return;
    }

    if (comment.length < 10) {
      setError("Atsiliepimas turi būti bent 10 simbolių.");
      return;
    }

    setEmployerReviewSaving(true);
    setError("");

    try {
      const result = await supabase.rpc("submit_employer_review", {
        p_attendance_id: employerReviewTarget.attendance_id,
        p_score: score,
        p_comment: comment,
      });

      if (result.error) throw result.error;

      setEmployerReviewTarget(null);
      setEmployerReviewScore(null);
      setEmployerReviewComment("");
      setNotice(
        "Atsiliepimas apie darbdavį paskelbtas. Jį matys įmonė ir darbuotojai, gavę šios įmonės darbo kvietimus."
      );

      await loadEmployerReviewOpportunities();
      await loadInvitations();
    } catch (err) {
      setError(err?.message || "Nepavyko paskelbti atsiliepimo.");
    } finally {
      setEmployerReviewSaving(false);
    }
  }

  async function respondToInvitation(invitationId, status) {
    setRespondingInvitation(invitationId);
    setNotice("");
    setError("");

    try {
      const result = await supabase
        .from("job_invitations")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("worker_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (result.error) throw result.error;

      if (!result.data) {
        throw new Error("Šis kvietimas jau buvo atsakytas arba nebegalioja.");
      }

      await Promise.all([loadInvitations(), loadWorkerStats()]);
      if (status === "accepted") {
        setUrgentAvailability({ city: "", active: false });
      }
      setConfirmInvitation(null);
      setCommitmentChecked(false);

      setNotice(
        status === "accepted"
          ? "Darbo kvietimas priimtas. Darbas patvirtintas."
          : "Darbo kvietimas atmestas."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko atsakyti į kvietimą.");
    } finally {
      setRespondingInvitation(null);
    }
  }

  function openWorkerCheckIn(item) {
    if (!item?.id) return;
    setWorkerCheckInTarget(item);
    setWorkerCheckInTime(currentVilniusTimeRounded5());
    setError("");
  }

  async function workerCheckIn(bookingId, arrivalTime) {
    if (!bookingId || !arrivalTime) return;
    setAttendanceBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await supabase.rpc("worker_check_in_at_time", {
        p_booking_id: bookingId,
        p_arrival_time: arrivalTime,
      });
      if (result.error) throw result.error;
      setWorkerCheckInTarget(null);
      setWorkerCheckInTime("");
      setNotice(`Atvykimas pažymėtas ${arrivalTime}. Darbdavys matys jūsų nurodytą faktinį laiką.`);
      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      setError(err?.message || "Nepavyko pažymėti atvykimo.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function copyPhoneNumber(phone) {
    if (!phone) return;
    setError("");
    setNotice("");
    try {
      await navigator.clipboard.writeText(phone);
      setNotice(`Telefono numeris nukopijuotas: ${phone}`);
    } catch (err) {
      setError("Nepavyko nukopijuoti telefono numerio.");
    }
  }

  async function openWorkdayDetails(item) {
    if (!item?.job?.id) return;

    setError("");
    await markWorkerJobUpdateNotificationsRead(item.job.id);

    try {
      const [contactResult, reviewsResult] = await Promise.all([
        supabase.rpc("get_job_contact", {
          p_job_id: item.job.id,
        }),
        supabase.rpc("get_company_worker_reviews", {
          p_company_id: item.job.company_id,
        }),
      ]);

      if (contactResult.error) throw contactResult.error;
      if (reviewsResult.error) throw reviewsResult.error;

      const contact = contactResult.data?.[0] || {};

      setWorkdayDetailsTarget({
        ...item,
        companyName: contact.company_name || item.companyName,
        companyPhone: contact.phone || "",
        companyReviews: reviewsResult.data || [],
      });
    } catch (err) {
      setWorkdayDetailsTarget({
        ...item,
        companyPhone: "",
        companyReviews: [],
      });
      setError(err?.message || "Nepavyko įkelti darbo kontaktų.");
    }
  }

  async function openWorkerCompanyProfile(source) {
    const companyId = source?.job?.company_id;
    if (!companyId) return;

    const reviewCacheKey = `worker-company-reviews-v1:${user.id}:${companyId}`;
    const reviewCacheTtlMs = 24 * 60 * 60 * 1000;
    let cachedReviews = [];
    let cachedReviewsAreFresh = false;

    try {
      const rawCache = window.localStorage.getItem(reviewCacheKey);
      if (rawCache) {
        const parsedCache = JSON.parse(rawCache);
        cachedReviews = Array.isArray(parsedCache?.reviews)
          ? parsedCache.reviews.slice(0, 3)
          : [];
        cachedReviewsAreFresh =
          Number(parsedCache?.fetchedAt || 0) > 0 &&
          Date.now() - Number(parsedCache.fetchedAt) < reviewCacheTtlMs;
      }
    } catch {
      cachedReviews = [];
      cachedReviewsAreFresh = false;
    }

    setError("");
    setWorkerCompanyProfileLoading(true);

    try {
      const summaryResult = await supabase.rpc(
        "get_company_worker_profile_summary",
        { p_company_id: companyId }
      );

      if (summaryResult.error) throw summaryResult.error;

      let latestReviews = cachedReviews;

      if (!cachedReviewsAreFresh) {
        const reviewsResult = await supabase.rpc("get_company_worker_reviews", {
          p_company_id: companyId,
        });

        if (!reviewsResult.error) {
          latestReviews = (reviewsResult.data || []).slice(0, 3);
          try {
            window.localStorage.setItem(
              reviewCacheKey,
              JSON.stringify({
                fetchedAt: Date.now(),
                reviews: latestReviews,
              })
            );
          } catch {
            // Naršyklės saugykla gali būti išjungta — profilis vis tiek veikia.
          }
        } else if (!latestReviews.length) {
          latestReviews = (source.companyReviews || []).slice(0, 3);
        }
      }

      const company = summaryResult.data?.[0] || {};

      setWorkerCompanyProfileTarget({
        id: company.company_id || companyId,
        name: company.company_name || source.companyName || "Darbdavys",
        city: company.city || source.job?.city || "",
        description: company.description || "",
        avatarPath: company.avatar_path || source.companyAvatarPath || "",
        reliabilityRate: Number(
          company.reliability_rate ?? source.companyReliability ?? 100
        ),
        completedJobs: Number(company.completed_jobs || 0),
        cancelledJobs: Number(company.cancelled_jobs || 0),
        reviewCount: Number(company.review_count || 0),
        reviewAverage:
          company.review_average === null || company.review_average === undefined
            ? null
            : Number(company.review_average),
        awards: companyAwardsById[companyId] || [],
        reviews: latestReviews.slice(0, 3),
      });
    } catch (err) {
      setWorkerCompanyProfileTarget({
        id: companyId,
        name: source.companyName || "Darbdavys",
        city: source.job?.city || "",
        description: "",
        avatarPath: source.companyAvatarPath || "",
        reliabilityRate: Number(source.companyReliability ?? 100),
        completedJobs: 0,
        cancelledJobs: 0,
        reviewCount: Number(source.companyReviews?.length || cachedReviews.length || 0),
        reviewAverage: null,
        awards: companyAwardsById[companyId] || [],
        reviews: (cachedReviews.length ? cachedReviews : source.companyReviews || []).slice(0, 3),
      });
      setError(err?.message || "Nepavyko įkelti įmonės profilio.");
    } finally {
      setWorkerCompanyProfileLoading(false);
    }
  }

  async function openArrivalHelp(item) {
    setError("");
    setNotice("");

    try {
      const result = await supabase.rpc("get_job_contact", {
        p_job_id: item.job.id,
      });

      if (result.error) throw result.error;

      const contact = result.data?.[0] || {};

      setArrivalHelpTarget({
        ...item,
        companyName: contact.company_name || item.companyName,
        companyPhone: contact.phone || "",
      });
    } catch (err) {
      setArrivalHelpTarget({
        ...item,
        companyPhone: "",
      });
      setError(err?.message || "Nepavyko įkelti darbdavio kontaktų.");
    }
  }

  async function workerClaimWorkday(bookingId, claim) {
    setAttendanceBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await supabase.rpc("worker_claim_workday", {
        p_booking_id: bookingId,
        p_claim: claim,
      });
      if (result.error) throw result.error;

      setNotice(
        claim === "worked"
          ? "Pažymėjote, kad dirbote. Laukiama darbdavio darbo dienos uždarymo."
          : "Neatvykimas patvirtintas. Pritaikytas darbuotojo patikimumo poveikis."
      );

      setWorkerAttendanceTarget(null);
      setWorkerAttendanceMode(null);
      setWorkerAttendanceNote("");
      setWorkerEvidenceFile(null);
      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      setError(err?.message || "Nepavyko užbaigti darbo dienos.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function workerRespondAttendance(attendanceId, response, note = "") {
    setAttendanceBusy(true);
    setNotice("");
    setError("");

    let uploadedPath = null;

    try {
      if (response === "disputed" && workerEvidenceFile) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ];

        if (!allowedTypes.includes(workerEvidenceFile.type)) {
          throw new Error(
            "Įrodymui galima įkelti JPG, PNG, WEBP nuotrauką arba PDF dokumentą."
          );
        }

        if (workerEvidenceFile.size > 8 * 1024 * 1024) {
          throw new Error("Įrodymo failas negali būti didesnis nei 8 MB.");
        }

        const safeName = workerEvidenceFile.name
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .slice(-100);

        uploadedPath = `${user.id}/${attendanceId}/${Date.now()}-${safeName}`;

        const uploadResult = await supabase.storage
          .from("attendance-evidence")
          .upload(uploadedPath, workerEvidenceFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: workerEvidenceFile.type,
          });

        if (uploadResult.error) throw uploadResult.error;
      }

      const result = await supabase.rpc("worker_respond_attendance", {
        p_attendance_id: attendanceId,
        p_response: response,
        p_note: note || null,
        p_evidence_path: uploadedPath,
        p_evidence_name:
          response === "disputed" && workerEvidenceFile
            ? workerEvidenceFile.name
            : null,
      });

      if (result.error) throw result.error;

      setNotice(
        response === "disputed"
          ? "Ginčas pateiktas. Kol jis neišspręstas, jūsų reitingas nekeičiamas."
          : "Darbo dienos rezultatas patvirtintas."
      );

      setWorkerAttendanceTarget(null);
      setWorkerAttendanceMode(null);
      setWorkerAttendanceNote("");
      setWorkerEvidenceFile(null);

      await Promise.all([loadInvitations(), loadWorkerStats()]);
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage
          .from("attendance-evidence")
          .remove([uploadedPath])
          .catch(() => {});
      }

      setError(err?.message || "Nepavyko pateikti atsakymo.");
    } finally {
      setAttendanceBusy(false);
    }
  }

  async function confirmCurrentAvailability() {
    setConfirmingAvailability(true);
    setNotice("");
    setError("");

    try {
      const result = await supabase.rpc("worker_confirm_availability");
      if (result.error) throw result.error;

      setNeedsAvailabilityConfirm(false);
      setNotice(
        "Grafikas patvirtintas. Darbdaviai vėl gali matyti jūsų profilį paieškoje."
      );
    } catch (err) {
      setError(err?.message || "Nepavyko patvirtinti grafiko.");
    } finally {
      setConfirmingAvailability(false);
    }
  }

  async function updateSearchLocationFromBrowser() {
    if (searchLocationBusy) return;

    setSearchLocationBusy(true);
    setSearchLocationError("");

    try {
      const position = await requestBrowserLocation();
      const latitude = Number(position?.coords?.latitude);
      const longitude = Number(position?.coords?.longitude);
      const accuracy = Number(position?.coords?.accuracy);

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new Error("Naršyklė grąžino netinkamą vietos informaciją.");
      }

      const updatedAt = new Date().toISOString();
      const accuracyM = Number.isFinite(accuracy) && accuracy >= 0
        ? Math.round(accuracy)
        : null;

      const result = await supabase
        .from("worker_profiles")
        .update({
          search_location_enabled: true,
          search_latitude: latitude,
          search_longitude: longitude,
          search_location_accuracy_m: accuracyM,
          search_location_updated_at: updatedAt,
        })
        .eq("user_id", user.id)
        .select(
          "search_location_enabled, search_location_accuracy_m, search_location_updated_at"
        )
        .single();

      if (result.error) throw result.error;

      setSearchLocation({
        enabled: Boolean(result.data?.search_location_enabled),
        accuracyM:
          result.data?.search_location_accuracy_m === null ||
          result.data?.search_location_accuracy_m === undefined
            ? null
            : Number(result.data.search_location_accuracy_m),
        updatedAt: result.data?.search_location_updated_at || updatedAt,
      });
    } catch (err) {
      setSearchLocationError(browserLocationErrorMessage(err));
    } finally {
      setSearchLocationBusy(false);
    }
  }

  async function disableSearchLocation() {
    if (searchLocationBusy) return;

    setSearchLocationBusy(true);
    setSearchLocationError("");

    try {
      const result = await supabase
        .from("worker_profiles")
        .update({
          search_location_enabled: false,
          search_latitude: null,
          search_longitude: null,
          search_location_accuracy_m: null,
          search_location_updated_at: null,
        })
        .eq("user_id", user.id);

      if (result.error) throw result.error;

      setSearchLocation({ enabled: false, accuracyM: null, updatedAt: null });
    } catch (err) {
      setSearchLocationError(err?.message || "Nepavyko išjungti lokacijos.");
    } finally {
      setSearchLocationBusy(false);
    }
  }

  async function saveEverything() {
    setSaving(true);
    setNotice("");
    setError("");
    setProfileFormErrors({});
    setAvailabilityValidationMessages({});

    try {
      if (!form.firstName.trim()) {
        showProfileFieldError("firstName", "Įveskite vardą.");
        return;
      }
      if (!form.lastName.trim()) {
        showProfileFieldError("lastName", "Įveskite pavardę.");
        return;
      }
      const birthDateError = workerBirthDateError(form.birthDate);
      if (birthDateError) {
        showProfileFieldError("birthDate", birthDateError);
        return;
      }
      if (!form.phone.trim()) {
        showProfileFieldError("phone", "Telefono numeris yra privalomas.");
        return;
      }
      if (!form.shortBio.trim()) {
        showProfileFieldError(
          "shortBio",
          'Užpildykite patirties lauką. Jei patirties neturite, įrašykite „Neturiu“.'
        );
        return;
      }

      const normalizedPhone = normalizeLithuanianMobilePhone(form.phone);
      if (!normalizedPhone) {
        showProfileFieldError(
          "phone",
          "Įveskite galiojantį Lietuvos mobiliojo telefono numerį, pvz. +37061234567."
        );
        return;
      }

      const canonicalCity = await canonicalCityName(form.city);
      if (!canonicalCity) {
        showProfileFieldError("city", "Pasirinkite miestą iš pasiūlymų sąrašo.");
        return;
      }

      const travelRadius = Number(form.travelRadius);
      if (!Number.isFinite(travelRadius) || travelRadius < 5 || travelRadius > 50) {
        showProfileFieldError("travelRadius", "Nurodykite nuo 5 iki 50 km.");
        return;
      }

      const invalidAvailabilityDays = [];
      const conflictingAvailabilityDays = [];
      const availabilityRows = days.map((day) => {
        const state = availability[day.iso] || {
          available: false,
          from: "08:00",
          to: "17:00",
        };
        const available = Boolean(state.available);

        if (available) {
          const interval = availabilityIntervalForState(day.iso, state);
          if (!interval) {
            invalidAvailabilityDays.push(day.iso);
          } else {
            const conflict = availabilityConflictForDate(day.iso, state);
            if (conflict) {
              conflictingAvailabilityDays.push({
                date: day.iso,
                label: day.label,
                conflict,
              });
            }
          }
        }

        return {
          worker_id: user.id,
          available_date: day.iso,
          status: available ? "available" : "unavailable",
          available_from: available ? state.from : null,
          available_to: available ? state.to : null,
        };
      });

      if (invalidAvailabilityDays.length || conflictingAvailabilityDays.length) {
        const dates = [
          ...invalidAvailabilityDays,
          ...conflictingAvailabilityDays.map((item) => item.date),
        ];
        const messages = {};
        invalidAvailabilityDays.forEach((date) => {
          messages[date] = "Laisvo laiko pradžia ir pabaiga negali sutapti.";
        });
        conflictingAvailabilityDays.forEach((item) => {
          messages[item.date] = `Pasirinktas laikas kertasi su užfiksuotu darbu arba nepalieka 1 val. tarpo nuvykimui.${item.conflict?.label ? ` Kertasi su: ${item.conflict.label}.` : ""}`;
        });
        setAvailabilityValidationMessages(messages);
        setAvailabilityConflictDates([...new Set(dates)]);

        const firstDate = dates[0];
        if (isPhoneLayout) {
          const firstIndex = days.findIndex((day) => day.iso === firstDate);
          if (firstIndex >= 0) setAvailabilityMobileIndex(firstIndex);
        }
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            document
              .getElementById(`worker-availability-day-${firstDate}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        });
        return;
      }

      setAvailabilityConflictDates([]);
      setAvailabilityValidationMessages({});

      await phoneVerification.saveChange();

      const profileUpdate = await supabase
        .from("profiles")
        .update({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          display_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          city: canonicalCity,
        })
        .eq("id", user.id);

      if (profileUpdate.error) throw profileUpdate.error;

      const privateUpdate = await supabase
        .from("user_private")
        .update({
          phone: normalizedPhone,
          birth_date: form.birthDate || null,
          legal_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        })
        .eq("user_id", user.id);

      if (privateUpdate.error) throw privateUpdate.error;

      let nextAvatarPath = avatarMarkedForRemoval ? "" : form.avatarPath || "";

      if (avatarFile) {
        const extension =
          avatarFile.type === "image/png"
            ? "png"
            : avatarFile.type === "image/webp"
            ? "webp"
            : "jpg";
        const uploadPath = `${user.id}/avatar-${Date.now()}.${extension}`;

        const uploadResult = await supabase.storage
          .from("worker-avatars")
          .upload(uploadPath, avatarFile, {
            cacheControl: "3600",
            contentType: avatarFile.type,
            upsert: false,
          });

        if (uploadResult.error) throw uploadResult.error;
        nextAvatarPath = uploadPath;
      }

      const workerUpdate = await supabase
        .from("worker_profiles")
        .update({
          travel_radius_km: travelRadius,
          has_driving_license_b: form.hasDrivingLicenseB,
          has_individual_activity: form.hasIndividualActivity,
          years_experience: Number(form.yearsExperience) || 0,
          short_bio: form.shortBio.trim() || null,
          avatar_path: nextAvatarPath || null,
        })
        .eq("user_id", user.id);

      if (workerUpdate.error) throw workerUpdate.error;

      if (
        form.avatarPath &&
        form.avatarPath !== nextAvatarPath &&
        (avatarFile || avatarMarkedForRemoval)
      ) {
        await supabase.storage
          .from("worker-avatars")
          .remove([form.avatarPath]);
      }

      const selectedSet = new Set(selectedSkills);
      const originalSet = new Set(originalSkills);
      const toAdd = selectedSkills.filter((id) => !originalSet.has(id));
      const toDelete = originalSkills.filter((id) => !selectedSet.has(id));

      if (toDelete.length) {
        const deleteResult = await supabase
          .from("worker_skills")
          .delete()
          .eq("worker_id", user.id)
          .in("skill_id", toDelete);

        if (deleteResult.error) throw deleteResult.error;
      }

      if (toAdd.length) {
        const insertResult = await supabase.from("worker_skills").insert(
          toAdd.map((skillId) => ({
            worker_id: user.id,
            skill_id: skillId,
            years_experience: 0,
          }))
        );

        if (insertResult.error) throw insertResult.error;
      }

      const availabilityResult = await supabase
        .from("availability")
        .upsert(availabilityRows, { onConflict: "worker_id,available_date" });

      if (availabilityResult.error) throw availabilityResult.error;

      setAvailability(
        Object.fromEntries(
          availabilityRows.map((row) => [
            row.available_date,
            {
              available: row.status === "available",
              from: row.available_from || "08:00",
              to: row.available_to || "17:00",
            },
          ])
        )
      );

      const confirmResult = await supabase.rpc("worker_confirm_availability");
      if (confirmResult.error) throw confirmResult.error;

      setNeedsAvailabilityConfirm(false);
      setOriginalSkills([...selectedSkills]);
      setForm((current) => ({
        ...current,
        city: canonicalCity,
        avatarPath: nextAvatarPath,
      }));
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarMarkedForRemoval(false);
      setProfileSaved(true);
      setNotice("Profilio informacija atnaujinta.");
    } catch (err) {
      setError(err?.message || "Nepavyko išsaugoti duomenų.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (form.displayName || user.email || "D")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const availableCount = days.filter((day) =>
    availabilityFitsWindow(day.iso, availability[day.iso])
  ).length;
  const safeAvailabilityMobileIndex = Math.min(
    Math.max(0, availabilityMobileIndex),
    Math.max(0, days.length - 1)
  );
  const availabilityMobileDay = days[safeAvailabilityMobileIndex] || null;
  const availabilityDaysForRender = isPhoneLayout
    ? availabilityMobileDay
      ? [availabilityMobileDay]
      : []
    : days;

  const profileAvatarUrl = avatarMarkedForRemoval
    ? ""
    : avatarPreview || workerAvatarUrl(form.avatarPath);

  const workerDashboardToday = localDateISO(new Date());

  const workerWorkdayChatIsClosed = (item) => {
    const attendance = item?.attendance || {};
    return (
      Boolean(attendance.finalized_at) ||
      ["completed", "cancelled_by_employer", "cancelled_by_worker"].includes(
        item?.status
      )
    );
  };

  const workerWorkdayIsHistory = (item) => {
    const attendance = item?.attendance || {};
    return (
      Boolean(attendance.finalized_at) ||
      [
        "completed",
        "no_show",
        "cancelled_by_employer",
        "cancelled_by_worker",
      ].includes(item?.status)
    );
  };

  const activeWorkerWorkdays = workdays.filter(
    (item) => !workerWorkdayIsHistory(item)
  );
  const workerWorkHistory = workdays.filter(workerWorkdayIsHistory);
  const pagedActiveWorkerWorkdays = activeWorkerWorkdays.slice(
    (workerActivePage - 1) * DASHBOARD_PAGE_SIZE,
    workerActivePage * DASHBOARD_PAGE_SIZE
  );
  const pagedWorkerWorkHistory = workerWorkHistory.slice(
    (workerHistoryPage - 1) * DASHBOARD_PAGE_SIZE,
    workerHistoryPage * DASHBOARD_PAGE_SIZE
  );
  const workerHistoryMobileTotal = workerWorkHistory.length;
  const safeWorkerHistoryMobileIndex = workerHistoryMobileTotal
    ? Math.min(workerHistoryMobileIndex, workerHistoryMobileTotal - 1)
    : 0;
  const workerHistoryMobileItem = workerHistoryMobileTotal
    ? workerWorkHistory[safeWorkerHistoryMobileIndex]
    : null;
  const activeWorkerJobIds = new Set(
    activeWorkerWorkdays.map((item) => item.job?.id).filter(Boolean)
  );

  const renderWorkerHistoryCard = (item, keyPrefix = "history") => {
    const job = item?.job;
    const attendance = item?.attendance || {};
    if (!job) return null;

    const cancelled = [
      "cancelled_by_employer",
      "cancelled_by_worker",
    ].includes(item.status);

    return (
      <div className="wd-workday wd-history-workday" key={`${keyPrefix}-${item.id}`}>
        <div>
          <div className="wd-workday-head history">
            <div className="wd-workday-head-main">
              <div className="wd-workday-title">
                <h3>{formatJobTitle(job.title)}</h3>
                <span
                  className={`wd-workday-phase ${
                    cancelled ? "cancelled" : "done"
                  }`}
                >
                  {cancelled ? "Atšauktas" : "Užbaigtas"}
                </span>
                {!cancelled && attendance.finalized_at && (
                  <span
                    className={`wd-workday-status ${
                      attendance.final_outcome === "no_show" ||
                      attendance.final_outcome === "left_early_unexcused"
                        ? "red"
                        : "green"
                    }`}
                  >
                    {attendanceOutcomeLabel(attendance)}
                  </span>
                )}
                {attendance.dispute_status === "resolved_worker" && (
                  <span className="wd-workday-status green">
                    ✓ Ginčas išspręstas jūsų naudai
                  </span>
                )}
                {attendance.dispute_status === "resolved_employer" && (
                  <span className="wd-workday-status red">
                    Ginčas išspręstas ne jūsų naudai
                  </span>
                )}
              </div>

              <div className="wd-workday-meta">
                <div className="wd-company-meta-line">
                  <b>{item.companyName}</b>
                  {job.pay_amount
                    ? ` · ${formatNetPay(job.pay_amount, job.pay_unit)}`
                    : ""}
                  {" · "}
                  {job.work_date} · {job.start_time?.slice(0, 5)}
                  {job.end_time
                    ? `–${job.end_time.slice(0, 5)}`
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {!cancelled && !attendance.finalized_at ? (
            <span className="wd-workday-status green">
              Darbas užbaigtas
            </span>
          ) : null}
        </div>

        <div className="wd-workday-actions">
          <button
            className="wd-decline"
            type="button"
            onClick={() => openWorkdayDetails(item)}
          >
            Darbo informacija
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(activeWorkerWorkdays.length / DASHBOARD_PAGE_SIZE));
    if (workerActivePage > totalPages) setWorkerActivePage(totalPages);
  }, [activeWorkerWorkdays.length, workerActivePage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(workerWorkHistory.length / DASHBOARD_PAGE_SIZE));
    if (workerHistoryPage > totalPages) setWorkerHistoryPage(totalPages);
  }, [workerWorkHistory.length, workerHistoryPage]);

  useEffect(() => {
    if (!workerWorkHistory.length) {
      setWorkerHistoryMobileIndex(0);
      return;
    }
    setWorkerHistoryMobileIndex((current) =>
      Math.min(current, workerWorkHistory.length - 1)
    );
  }, [workerWorkHistory.length]);

  useEffect(() => {
    setAvailabilityMobileIndex((current) =>
      Math.min(Math.max(0, current), Math.max(0, days.length - 1))
    );
  }, [days.length]);

  const workerTodayJobs = workdays.filter(
    (item) =>
      item.job?.work_date === workerDashboardToday &&
      !["cancelled_by_employer", "completed", "no_show"].includes(item.status)
  );

  const workerUnreadMessages = workerNotifications.filter(
    (item) =>
      item.event_type === "message" &&
      (!item.job_id || activeWorkerJobIds.has(item.job_id))
  );

  const workerOpenDisputes = workdays.filter(
    (item) =>
      item.attendance?.dispute_status === "disputed" &&
      !item.attendance?.finalized_at
  );

  const workerActionWorkdays = workdays.filter((item) => {
    const attendance = item.attendance || {};
    if (item.status !== "confirmed" || attendance.finalized_at) return false;

    const pendingNegative =
      ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
        attendance.employer_outcome
      ) && attendance.dispute_status !== "disputed";

    const needsClose =
      jobHasEnded(item.job) &&
      !attendance.employer_outcome &&
      attendance.worker_workday_claim !== "worked";

    const canCheckIn =
      workerCheckInWindowOpen(item.job) && !attendance.worker_check_in_at;

    return pendingNegative || needsClose || canCheckIn;
  });

  const nextConfirmedWorkday = [...workdays]
    .filter(
      (item) =>
        item.status === "confirmed" &&
        !item.attendance?.finalized_at &&
        item.job?.status !== "cancelled" &&
        !jobHasEnded(item.job)
    )
    .sort((a, b) => {
      const aKey = `${a.job?.work_date || "9999-12-31"}T${
        a.job?.start_time?.slice(0, 5) || "23:59"
      }`;
      const bKey = `${b.job?.work_date || "9999-12-31"}T${
        b.job?.start_time?.slice(0, 5) || "23:59"
      }`;
      return aKey.localeCompare(bKey);
    })[0];

  const workerRequiredActionCount =
    workerActionWorkdays.length + (needsAvailabilityConfirm ? 1 : 0);

  const workerDashboardTomorrow = addPlatformDays(workerDashboardToday, 1);

  const nextConfirmedJob = nextConfirmedWorkday?.job || null;
  const nextConfirmedWorkdayDateLabel = nextConfirmedJob?.work_date
    ? nextConfirmedJob.work_date === workerDashboardToday
      ? "Šiandien"
      : nextConfirmedJob.work_date === workerDashboardTomorrow
      ? "Rytoj"
      : new Date(`${nextConfirmedJob.work_date}T00:00:00`).toLocaleDateString(
          "lt-LT",
          { day: "numeric", month: "short" }
        )
    : "";

  const firstOpenDispute = workerOpenDisputes[0] || null;

  const firstPendingReview = workerActionWorkdays.find((item) => {
    const attendance = item.attendance || {};
    return (
      ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
        attendance.employer_outcome
      ) && attendance.dispute_status !== "disputed"
    );
  });

  const firstNeedsClose = workerActionWorkdays.find((item) => {
    const attendance = item.attendance || {};
    return (
      jobHasEnded(item.job) &&
      !attendance.employer_outcome &&
      attendance.worker_workday_claim !== "worked"
    );
  });

  const firstCanCheckIn = workerActionWorkdays.find((item) => {
    const attendance = item.attendance || {};
    return workerCheckInWindowOpen(item.job) && !attendance.worker_check_in_at;
  });

  const workerPrimaryFocus = needsAvailabilityConfirm
    ? {
        tone: "action",
        title: "Patvirtinkite savo prieinamumą",
        text: "Kol grafikas nepatvirtintas, darbdaviai jūsų nemato naujų darbuotojų paieškoje.",
        action: "Patvirtinti grafiką",
        target: "availability",
      }
    : metrics.restrictedUntil &&
      new Date(metrics.restrictedUntil) > new Date()
    ? {
        tone: "danger",
        title: "Paskyrai taikomas laikinas apribojimas",
        text: `Naujų darbų priimti negalite iki ${new Date(
          metrics.restrictedUntil
        ).toLocaleString("lt-LT", {
          dateStyle: "short",
          timeStyle: "short",
        })}.`,
        action: "Peržiūrėti darbus",
        target: "workdays",
      }
    : firstPendingReview
    ? {
        tone: "danger",
        title: "Reikia atsakyti į darbdavio pažymėtą rezultatą",
        text: `${formatJobTitle(firstPendingReview.job?.title, "Darbo diena")} · pasirinkite „Patvirtinti“ arba „Ginčyti“.`,
        action: "Peržiūrėti",
        target: "workdays",
      }
    : firstNeedsClose
    ? {
        tone: "action",
        title: "Reikia uždaryti darbo dieną",
        text: `${formatJobTitle(firstNeedsClose.job?.title, "Darbas")} jau pasibaigė. Užfiksuokite, ar dirbote.`,
        action: "Uždaryti dieną",
        target: "workdays",
      }
    : firstCanCheckIn
    ? {
        tone: "live",
        title: "Galite pažymėti atvykimą",
        text: `${formatJobTitle(firstCanCheckIn.job?.title, "Darbas")} · atvykimo langas jau atidarytas.`,
        action: "Atidaryti darbą",
        target: "workdays",
      }
    : invitations.length
    ? {
        tone: "action",
        title: `Turite ${invitations.length} ${
          invitations.length === 1 ? "darbo kvietimą" : "darbo kvietimus"
        }`,
        text: "Peržiūrėkite datą, laiką, atlyginimą ir atsakykite darbdaviui.",
        action: "Peržiūrėti kvietimus",
        target: "invitations",
      }
    : workerUnreadMessages.length
    ? {
        tone: "action",
        title: `Turite ${workerUnreadMessages.length} ${
          workerUnreadMessages.length === 1 ? "naują žinutę" : "naujas žinutes"
        }`,
        text: "Atidarykite darbo arba kvietimo pokalbį, kad žinutės būtų pažymėtos perskaitytomis.",
        action: "Peržiūrėti pokalbius",
        target: "workdays",
      }
    : firstOpenDispute
    ? {
        tone: "danger",
        title: "Ginčas nagrinėjamas",
        text: `${formatJobTitle(firstOpenDispute.job?.title, "Darbo diena")} · laukiamas administratoriaus sprendimas. Kol vyksta nagrinėjimas, reitingas nekeičiamas.`,
        action: "Peržiūrėti ginčą",
        target: "workdays",
      }
    : nextConfirmedWorkday
    ? {
        tone: "live",
        title: "Artimiausias patvirtintas darbas",
        text: `${formatJobTitle(nextConfirmedWorkday.job?.title, "Darbas")} · ${
          nextConfirmedWorkday.job?.work_date || ""
        } · ${nextConfirmedWorkday.job?.start_time?.slice(0, 5) || ""}`,
        action: "Peržiūrėti",
        target: "workdays",
      }
    : {
        tone: "",
        title: "Šiuo metu veiksmų nereikia",
        text: "Atnaujinkite prieinamumą ir laukite naujų tinkamų darbo kvietimų.",
        action: "Tvarkyti profilį",
        target: "profile",
      };

  function openNearestConfirmedWorkday() {
    if (!nextConfirmedWorkday?.job?.id) return;

    const targetIndex = activeWorkerWorkdays.findIndex(
      (item) => item?.job?.id === nextConfirmedWorkday.job.id
    );
    const targetPage =
      targetIndex >= 0
        ? Math.floor(targetIndex / DASHBOARD_PAGE_SIZE) + 1
        : 1;

    setWorkerActivePage(targetPage);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .getElementById(`worker-workday-${nextConfirmedWorkday.job.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    openWorkdayDetails(nextConfirmedWorkday);
  }

  function openWorkerProfileEditor(target = "profile") {
    setWorkerProfileEditorTarget(target);
    setProfileFormErrors({});
    setAvailabilityValidationMessages({});
    if (target === "availability") setAvailabilityMobileIndex(0);
    setShowProfileEditor(true);
  }

  function openWorkerWorkTimeEditor() {
    setShowWorkTimeLoginReminder(false);
    openWorkerProfileEditor("availability");
  }

  function openWorkerDashboardTarget(target) {
    if (target === "profile") {
      openWorkerProfileEditor("profile");
      return;
    }

    if (target === "availability") {
      if (needsAvailabilityConfirm) {
        confirmCurrentAvailability();
      } else {
        openWorkerProfileEditor("availability");
      }
      return;
    }

    if (target === "availability-review") {
      document
        .getElementById("worker-availability-alert")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    document
      .getElementById(
        target === "invitations" ? "worker-invitations" : "worker-workdays"
      )
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pendingLongTermOffers = longTermOffers.filter(
    (offer) => offer.status === "offered"
  );
  const activeLongTermEmployment =
    longTermOffers.find((offer) => offer.status === "active") || null;
  const blockingActiveLongTermEmployment =
    longTermOfferTarget &&
    longTermOfferTarget.status === "offered" &&
    activeLongTermEmployment &&
    activeLongTermEmployment.id !== longTermOfferTarget.id
      ? activeLongTermEmployment
      : null;

  if (loading) {
    return <SilentLoader fullscreen size={28} />;
  }

  return (
    <div className="wd-page">
      {!onAdminReturn && <MainSiteInPageAlerts user={user} kind="worker" />}
      <style>{`
        .wd-page{min-height:100vh;background:#f6f8fa;color:#102438;padding-bottom:56px}
        .wd-topbar{height:72px;background:#fff;border-bottom:1px solid #e4ebf0;display:flex;align-items:center;position:sticky;top:0;z-index:30}
        .wd-topbar-inner{width:min(1320px,calc(100% - 40px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
        .wd-shell{width:min(1320px,calc(100% - 40px));margin:32px auto 0}
        .wd-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}
        .wd-heading h1{margin:3px 0 0;font-size:34px;letter-spacing:-.035em}
        .wd-heading p{margin:8px 0 0;color:#6c7a88;max-width:650px}
        .wd-user{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
        .wd-avatar{position:relative;width:52px;height:52px;flex:0 0 52px;min-width:52px;min-height:52px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#102438;color:#fff;font-weight:800}
        .wd-user b{display:block}.wd-user span{font-size:13px;color:#6c7a88}
        .wd-overview-heading{margin:0 0 9px 2px}
        .wd-onboarding-card{margin:0 0 18px;padding:16px;border:1px solid #dfe7ed;border-radius:16px;background:#fff;box-shadow:0 8px 28px rgba(16,36,56,.035)}
        .wd-onboarding-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
        .wd-onboarding-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .wd-onboarding-btn{min-height:38px;border-radius:10px;padding:9px 13px;font:inherit;font-size:12px;font-weight:850;line-height:1;cursor:pointer;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease,transform .15s ease}
        .wd-onboarding-btn.secondary{border:1px solid #d7e1e8;background:#fff;color:#102438}
        .wd-onboarding-btn.secondary:hover{border-color:#c7d4dc;background:#f7f9fb}
        .wd-onboarding-btn.primary{border:1px solid #f08a28;background:#f08a28;color:#fff;box-shadow:0 5px 14px rgba(240,138,40,.16)}
        .wd-onboarding-btn.primary:hover{background:#df7b1f;border-color:#df7b1f}
        .wd-onboarding-btn:active{transform:translateY(1px)}
        .wd-onboarding-btn:focus-visible{outline:2px solid rgba(240,138,40,.35);outline-offset:2px}
        .wd-worktime-login-reminder{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 14px;padding:12px 14px;border:1px solid #f0d0ba;border-radius:13px;background:#fff8f1;color:#8a531d;box-shadow:0 4px 14px rgba(16,36,56,.035);animation:wdReminderIn .18s ease-out}.wd-worktime-login-reminder-copy{display:grid;gap:2px;min-width:0}.wd-worktime-login-reminder-copy b{color:#9f5211;font-size:13px}.wd-worktime-login-reminder-copy span{font-size:12px;line-height:1.4}.wd-worktime-login-reminder button{flex:0 0 auto;border:1px solid #efc59e;background:#fff;color:#a85a17;border-radius:9px;padding:8px 11px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}.wd-worktime-login-reminder button:hover{background:#fff3e7}@keyframes wdReminderIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .wd-overview{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:20px}.wd-overview-card{background:#fff;border:1px solid #e4ebf0;border-radius:13px;padding:11px 12px;min-width:0}.wd-overview-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:25px}.wd-overview-card span{display:block;color:#6c7a88;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;min-width:0}.wd-overview-card b{display:block;margin-top:2px;color:#102438;font-size:19px;line-height:1.2}.wd-overview-card small{display:block;margin-top:3px;color:#70808e;font-size:10.5px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wd-overview-card.next-work b{font-size:15px}.wd-overview-card.action{border-color:#f0d0ba;background:#fff8f1}.wd-overview-card.live{border-color:#cfe7db;background:#f2faf6}.wd-overview-card.danger{border-color:#efc7bb;background:#fff5f2}.wd-overview-open{flex:0 0 auto;border:1px solid #d7e1e8;border-radius:7px;background:#fff;color:#102438;padding:4px 8px;font:inherit;font-size:10px;font-weight:900;line-height:1.15;cursor:pointer;white-space:nowrap}.wd-overview-card.action .wd-overview-open{border-color:#ecc69f;color:#a85a17;background:#fffdf9}.wd-overview-card.live .wd-overview-open{border-color:#bddcca;color:#167a54;background:#fff}.wd-overview-card.danger .wd-overview-open{border-color:#e5b7aa;color:#a74428;background:#fff}.wd-overview-open:hover{filter:brightness(.985)}
        .wd-stats-section{margin-bottom:20px}.wd-stats-head{display:flex;align-items:center;justify-content:flex-start;margin-bottom:10px}.wd-stats-toggle{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;padding:0;color:#f08a28;font:inherit;font-size:12px;font-weight:850;letter-spacing:.08em;line-height:1;text-transform:uppercase;cursor:pointer}.wd-stats-toggle:hover{color:#c96c13}.wd-stats-toggle::after{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px);transition:transform .18s ease}.wd-stats-toggle.open::after{transform:rotate(225deg) translate(-1px,-1px)}.wd-stats-toggle:focus-visible{outline:2px solid rgba(240,138,40,.35);outline-offset:5px;border-radius:4px}
        .wd-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:0;align-items:stretch;animation:wdStatsReveal .18s ease-out}
        @keyframes wdStatsReveal{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .wd-kpi{background:#fff;border:1px solid #e4ebf0;border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;min-height:138px;box-sizing:border-box}
        .wd-kpi>span{display:flex;align-items:flex-start;justify-content:center;width:100%;font-size:13px;color:#6c7a88;line-height:1.35;min-height:36px}.wd-kpi b{font-size:25px;line-height:1.08;margin-top:8px;min-height:54px;display:flex;align-items:center;justify-content:center;text-align:center;font-variant-numeric:tabular-nums}.wd-kpi small{min-height:15px}.wd-kpi-info-btn{display:flex;align-items:flex-start;justify-content:center;width:100%;max-width:100%;min-height:36px;margin:0 auto;border:0;background:transparent;padding:0;color:#6c7a88;font:inherit;font-size:13px;line-height:1.35;text-align:center;cursor:pointer}.wd-kpi-info-label{min-height:0!important}.wd-kpi-info-btn:hover{color:#102438;text-decoration:underline;text-underline-offset:3px}.wd-kpi-info-btn:focus-visible{outline:2px solid rgba(240,138,40,.35);outline-offset:4px;border-radius:5px}
        .wd-kpi-issues{border-color:#ecd9d2;background:#fffdfc}.wd-kpi-issue-breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;width:100%;margin-top:2px}.wd-kpi-issue-breakdown>span{display:flex;align-items:center;justify-content:space-between;gap:5px;min-width:0;padding:6px 7px;border-radius:8px;background:#f8f4f2;color:#735f59;font-size:10px;line-height:1.2;text-align:left}.wd-kpi-issue-breakdown strong{color:#9b4b36;font-size:11px;font-variant-numeric:tabular-nums}
        .wd-form{display:grid;gap:18px}
        .wd-card{background:#fff;border:1px solid #e4ebf0;border-radius:16px;box-shadow:0 8px 28px rgba(16,36,56,.045);padding:24px}.wd-active-jobs-section{background:#f3faf7;border-color:#cbe6da;box-shadow:0 8px 28px rgba(28,155,103,.08);position:relative;overflow:hidden}.wd-active-jobs-section:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:#1c9b67}.wd-active-jobs-section>h2{color:#167a54}.wd-active-jobs-section .wd-workday{background:#fff}.wd-evidence-reminder{display:block;margin:10px 0 16px;padding:12px 14px;border:1px solid #efc89f;border-radius:12px;background:#fff8f1;color:#5d6873;font-size:12px;line-height:1.48}.wd-evidence-reminder-title{display:flex!important;align-items:center;gap:7px;margin-bottom:3px;color:#8a4b12;font-size:12.5px}.wd-evidence-reminder-icon{width:18px;height:18px;flex:0 0 18px;display:inline-flex;align-items:center;justify-content:center;color:#b85f0e;line-height:0}.wd-evidence-reminder-icon svg{width:17px;height:17px;display:block}.wd-evidence-reminder>div>span{display:block}.wd-invitations-section{background:#fff7ee;border-color:#f2c18f;box-shadow:0 8px 28px rgba(240,138,40,.08)}.wd-invitations-section>h2{color:#9f5211}.wd-invitations-section .wd-empty-friendly{background:#fff;border-color:#f0d5ba}
        .wd-card h2{margin:0 0 6px;font-size:22px}.wd-card-sub{margin:0 0 22px;color:#6c7a88}.wd-recent-ratings-card{margin-bottom:18px}.wd-recent-ratings-card>.eyebrow{margin-bottom:14px}.wd-recent-ratings-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.wd-recent-rating{border:1px solid #e4ebf0;border-radius:13px;padding:13px 14px;background:#f8fafb}.wd-recent-rating-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.wd-recent-rating-head b{font-family:Manrope,Inter,sans-serif;font-size:17px}.wd-recent-rating-head span{font-size:11px;color:#8a98a6}.wd-recent-rating p{margin:8px 0 0;color:#526374;line-height:1.5;white-space:pre-wrap}@media(max-width:760px){.wd-recent-ratings-list{grid-template-columns:1fr}.wd-worktime-login-reminder{align-items:flex-start;flex-direction:column}.wd-worktime-login-reminder button{width:100%}}.wd-empty-friendly{display:flex;align-items:center;gap:11px;padding:14px 16px;border:1px dashed #d6e0e7;border-radius:12px;background:#f8fafb;color:#607180;font-size:13px;line-height:1.45}.wd-empty-friendly-icon{width:34px;height:34px;border-radius:10px;background:#edf2f5;display:grid;place-items:center;flex:0 0 34px;color:#526374;font-size:16px}.wd-empty-friendly b{display:block;color:#102438;margin-bottom:2px;font-size:13px}
        .wd-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .wd-label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#263b4d}
        .wd-input,.wd-textarea{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:12px 13px;background:#fff;color:#102438;font:inherit;outline:none}
        .wd-input:focus,.wd-textarea:focus{border-color:#f08a28;box-shadow:0 0 0 3px rgba(240,138,40,.10)}
        .wd-label.has-error .wd-input,.wd-label.has-error .wd-textarea{border-color:#cf6049;box-shadow:0 0 0 3px rgba(207,96,73,.09)}
        .wd-field-error{display:block;color:#b4472a;font-size:11px;font-weight:750;line-height:1.35;margin-top:-1px}
        .wd-textarea{min-height:92px;resize:vertical}
        .wd-checks{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px}.wd-check{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
        .wd-skills{display:flex;gap:8px;flex-wrap:wrap}.wd-skill{border:1px solid #dfe7ed;background:#fff;color:#425466;border-radius:999px;padding:8px 11px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .wd-skill.on{background:#102438;color:#fff;border-color:#102438}
        .wd-invites{display:grid;gap:12px}.wd-invite{border:1px solid #e4ebf0;border-radius:14px;padding:18px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;background:#fff;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease}.wd-invite.is-pending{border-color:#f2c18f;background:#fff;box-shadow:inset 5px 0 0 #f08a28,0 8px 22px rgba(240,138,40,.08)}.wd-invite.is-pending .wd-invite-main h3{color:#9f5211}.wd-invite.has-unread{box-shadow:inset 5px 0 0 #f08a28,0 8px 22px rgba(240,138,40,.08)}.wd-invite.has-conflict{border-color:#efc7bb;background:#fffafa;box-shadow:inset 5px 0 0 #d96b4d}
        .wd-invite-main h3{margin:0 0 8px;font-size:18px}.wd-invite-meta{color:#6c7a88;font-size:14px;line-height:1.55}.wd-invite-company{font-weight:800;color:#102438}
        .wd-invite-summary{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;color:#6c7a88;font-size:13px}.wd-invite-summary b{color:#102438;font-size:14px}.wd-invite-summary>span{position:relative}.wd-invite-summary>span+span:before{content:"·";margin-right:14px;color:#a4afb8}
        .wd-pay{display:inline-block;margin-top:10px;background:#fff3e7;color:#b85f0e;border-radius:9px;padding:8px 10px;font-weight:800}
        .wd-invite-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:stretch}.wd-invite-actions>*{min-height:42px}.wd-chat-btn{position:relative}.wd-chat-btn.has-unread{border-color:#e6a96f!important;background:#fff7ef!important;color:#9f5211!important}.wd-chat-count{display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;margin-left:6px;padding:0 5px;border-radius:999px;background:#c9362b;color:#fff;font-size:10px;font-weight:900;line-height:1;vertical-align:middle}.wd-conflict{display:inline-flex;margin-top:10px;border-radius:999px;padding:6px 9px;background:#fff0ec;color:#b64d2a;font-size:11px;font-weight:900}
        .wd-accept,.wd-decline{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:10px 13px;font:inherit;font-weight:800;line-height:1.25;cursor:pointer}
        .wd-accept{border:0;background:#1c9b67;color:#fff}.wd-decline{border:1px solid #dbe4ea;background:#fff;color:#102438}.wd-accept:disabled,.wd-decline:disabled{opacity:.55;cursor:wait}
        .wd-invite-status{font-size:13px;font-weight:800;border-radius:999px;padding:7px 10px;width:max-content}.wd-invite-status.accepted{background:#edf8f3;color:#167a54}.wd-invite-status.declined{background:#f2f4f6;color:#667788}.wd-invite-status.pending{background:#fff3e7;color:#b85f0e}
        .wd-heading-actions{display:grid;justify-items:stretch;gap:10px}.wd-heading-actions>.wd-urgent-btn,.wd-heading-actions>.wd-long-term-btn,.wd-heading-actions>.wd-edit-profile{width:100%;min-height:46px;box-sizing:border-box}.wd-edit-profile,.wd-long-term-btn{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:10px;padding:10px 13px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}.wd-long-term-btn{position:relative}
        .wd-urgent-btn{border:0;background:#f08a28;color:#fff;border-radius:10px;padding:10px 13px;font:inherit;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 6px 16px rgba(240,138,40,.18)}
        .wd-urgent-btn.active{background:#1c9b67;box-shadow:0 6px 16px rgba(28,155,103,.16)}.wd-urgent-btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
        .wd-urgent-status{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:18px;padding:0 6px;font-size:11px;line-height:1.35;color:#167a54;font-weight:800;text-align:center;margin-top:-3px}
        .wd-profile-editor{background:#fff;border:1px solid #e4ebf0;border-radius:16px;padding:22px;box-shadow:0 8px 28px rgba(16,36,56,.045);margin-bottom:22px}
        .wd-profile-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:4px}
        .wd-profile-editor-head h2{font-family:Manrope,Inter,sans-serif;margin:3px 0 0;font-size:22px}
        .wd-profile-editor-head p{margin:6px 0 0;color:#6c7a88;line-height:1.5}
        .wd-profile-editor-close{border:0;background:#f1f4f6;color:#102438;border-radius:9px;width:38px;height:38px;flex:0 0 38px;font:inherit;font-size:20px;cursor:pointer}
        .wd-profile-editor-section{padding:20px 0;border-top:1px solid #e8edf1}
        .wd-profile-editor-section:first-of-type{margin-top:16px}
        .wd-profile-editor-section h3{margin:0 0 6px;font-family:Manrope,Inter,sans-serif;font-size:17px}
        .wd-profile-editor-section>p{margin:0 0 14px;color:#6c7a88;font-size:13px;line-height:1.5}
        .wd-avatar-editor{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:14px 0 18px;padding:14px;border:1px solid #e4ebf0;border-radius:13px;background:#f8fafb}
        .wd-avatar-preview{width:76px;height:76px;border-radius:50%;overflow:hidden;background:#102438;color:#fff;display:grid;place-items:center;font-family:Manrope,Inter,sans-serif;font-size:22px;font-weight:800;flex:0 0 76px}
        .wd-avatar-preview img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}.wd-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;border-radius:50%}
        .wd-avatar-editor-copy b{display:block;margin-bottom:4px}.wd-avatar-editor-copy span{display:block;color:#6c7a88;font-size:12px;line-height:1.45;margin-bottom:9px}
        .wd-avatar-actions{display:flex;gap:8px;flex-wrap:wrap}.wd-avatar-upload{display:inline-flex;border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.wd-avatar-upload input{display:none}.wd-avatar-remove{border:1px solid #efc7bb;background:#fff5f2;color:#a74428;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .wd-profile-editor-check{align-content:end;min-height:44px;padding-bottom:9px}.wd-profile-editor-check-stack{display:grid;gap:4px;align-content:end}.wd-profile-editor-check-stack .wd-profile-editor-check{min-height:34px;padding-bottom:0}
        .wd-location-card{grid-column:auto;display:flex;align-items:center;gap:12px;min-width:0;width:100%;max-width:100%;box-sizing:border-box;min-height:54px;padding:8px 10px;border:1px solid #e3eaee;border-radius:13px;background:#fbfcfd}.wd-location-copy{min-width:0;display:grid;gap:2px}.wd-location-copy-title{color:#263b4c;font-size:11.5px;line-height:1.3;font-weight:850}.wd-location-copy-text{color:#748390;font-size:10.5px;line-height:1.35;font-weight:600}.wd-location-toggle{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:7px 11px;border:1px solid #dbe4ea;border-radius:10px;background:#f5f7f9;color:#526374;font:inherit;font-size:12px;font-weight:850;line-height:1;cursor:pointer;white-space:nowrap;flex:0 0 auto;transition:background .15s ease,border-color .15s ease,color .15s ease,transform .15s ease,box-shadow .15s ease}.wd-location-toggle:hover:not(:disabled){border-color:#c6d2da;background:#eef3f6;color:#102438}.wd-location-toggle.on{border-color:#b9dfcd;background:#eaf7f1;color:#167a54;box-shadow:0 3px 10px rgba(22,122,84,.08)}.wd-location-toggle.on:hover:not(:disabled){border-color:#9fd2ba;background:#e2f3eb}.wd-location-toggle:active:not(:disabled){transform:translateY(1px)}.wd-location-toggle:disabled{opacity:.58;cursor:wait}.wd-location-toggle-dot{width:9px;height:9px;border-radius:999px;background:#9aa7b2;box-shadow:0 0 0 3px rgba(154,167,178,.13)}.wd-location-toggle.on .wd-location-toggle-dot{background:#1c9a67;box-shadow:0 0 0 3px rgba(28,154,103,.14)}.wd-location-toggle-state{font-size:10.5px;font-weight:800;opacity:.82}.wd-location-message.err{margin-left:auto;color:#c9362b;font-size:10.5px;font-weight:750;line-height:1.35}
        .wd-profile-editor-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:2px}
        .wd-profile-editor-cancel{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:10px;padding:11px 14px;font:inherit;font-weight:800;cursor:pointer}
        .wd-profile-editor-cancel:disabled,.wd-profile-editor-close:disabled{opacity:.55;cursor:wait}
        .wd-workdays{display:grid;gap:10px}.wd-workday{border:1px solid #e4ebf0;border-radius:14px;padding:16px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}.wd-workday-head{display:flex;align-items:center;gap:14px;min-width:0}.wd-workday-head-main{min-width:0;flex:1}.wd-workday-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.wd-workday h3{margin:0;font-size:18px}.wd-workday-title{margin-bottom:5px}.wd-workday-phase{display:inline-flex;align-items:center;border-radius:8px;padding:5px 8px;font-size:11px;font-weight:800;line-height:1.2}.wd-workday-phase.upcoming{background:#eaf2fb;color:#245d89}.wd-workday-phase.today{background:#edf8f3;color:#167a54}.wd-workday-phase.past{background:#fff3e7;color:#9c5417}.wd-workday-phase.done{background:#edf8f3;color:#167a54}.wd-workday-phase.cancelled{background:#fff0ec;color:#b64d2a}.wd-workday-meta{color:#6c7a88;font-size:13px;line-height:1.55}.wd-company-meta-line{min-width:0}.wd-company-badge{display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border-radius:999px;border:1px solid #dbe4ea;background:#fff;color:#102438;font-weight:800;box-shadow:0 1px 2px rgba(16,36,56,.04);flex:0 0 auto}.wd-workday-head .wd-company-badge{align-self:center}.wd-company-badge img{width:100%;height:100%;object-fit:contain;object-position:center;display:block;padding:12%;background:#fff}.wd-workday-actions{display:grid;grid-template-columns:1fr;gap:6px;justify-content:stretch;width:160px}.wd-workday-actions>button{width:100%;min-height:38px;justify-content:center;padding:7px 10px;font-size:13px;line-height:1.2}.wd-long-term-offer-card{border:1px solid #e4ebf0;border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) minmax(190px,.58fr) minmax(260px,.72fr);gap:18px;align-items:center;background:#fff;overflow:hidden}.wd-long-term-offer-info{min-width:0}.wd-long-term-offer-actions{display:grid;grid-template-columns:repeat(2,minmax(126px,1fr));align-items:center;gap:8px;min-width:0;max-width:340px;justify-self:end}.wd-long-term-offer-actions>button{width:100%;min-width:0;min-height:38px;padding:8px 13px;font-size:13px;line-height:1.2;border-radius:10px;position:relative}.wd-long-term-offer-status{display:flex;align-items:center;justify-content:center;min-width:190px;padding:6px 10px;text-align:center}.wd-long-term-status-label{display:none}.wd-long-term-status-main{display:inline-flex;align-items:center;justify-content:center;max-width:260px;border-radius:999px;padding:6px 10px;font-size:12px;line-height:1.25;font-weight:850;color:#667788;background:#f1f4f6}.wd-long-term-status-main.orange{color:#b85f0e;background:#fff3e7}.wd-long-term-status-main.green{color:#167a54;background:#edf8f3}.wd-long-term-status-main.muted{color:#667788;background:#f1f4f6}.wd-workday-status{display:inline-flex;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;margin-top:8px}.wd-workday-title .wd-workday-status{margin-top:0;padding:5px 8px;font-size:11px;line-height:1.2}.wd-workday-status.orange{background:#fff3e7;color:#b85f0e}.wd-workday-status.green{background:#edf8f3;color:#167a54}.wd-workday-status.red{background:#fff0ec;color:#b64d2a}.wd-workday-status.muted{background:#f1f4f6;color:#667788}.wd-workday-chat.has-unread{border-color:#e6a96f!important;background:#fff7ef!important;color:#9f5211!important}.wd-workday-chat{position:relative}.wd-next-step{margin-top:11px;padding:10px 12px;border-left:3px solid #d7e0e7;border-radius:0 10px 10px 0;background:#f7f9fb;color:#526374;font-size:12px;line-height:1.45}.wd-next-step b{display:block;color:#102438;margin-bottom:2px}.wd-next-step.action{border-left-color:#f08a28;background:#fff8f1}.wd-next-step.ok{border-left-color:#2d9b69;background:#f2faf6}.wd-next-step.danger{border-left-color:#c65b37;background:#fff5f2}
        .wd-danger{border:1px solid #efc7bc;background:#fff;color:#b64d2a;border-radius:9px;padding:10px 13px;font:inherit;font-weight:800;cursor:pointer}.wd-danger:disabled{opacity:.55;cursor:wait}
        .rs-alert{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;margin-bottom:9px;width:max-content}
        .rs-alert.red{background:#fff0ec;color:#b64d2a}.rs-alert.orange{background:#fff3e7;color:#b85f0e}.rs-alert.green{background:#edf8f3;color:#167a54}.rs-alert.muted{background:#f1f4f6;color:#667788}
        .ed-current-job-overview{margin-bottom:18px;border:1px solid #dfe8ee;border-radius:16px;background:#fff;overflow:hidden}.ed-current-job-overview-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:18px 18px 14px;border-bottom:1px solid #edf1f4;background:#fff}.ed-current-job-overview-head h2{margin:2px 0 4px;font-size:22px}.ed-current-job-overview-head p{margin:0;color:#6c7a88;font-size:13px}.ed-current-job-status{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;background:#edf8f3;color:#167a54;white-space:nowrap}.ed-current-job-status.open{background:#eaf2fb;color:#245d89}.ed-current-job-status.cancelled{background:#fff0ec;color:#b64d2a}.ed-current-job-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-bottom:1px solid #edf1f4}.ed-current-job-field{min-width:0;padding:13px 16px;border-right:1px solid #edf1f4;border-bottom:1px solid #edf1f4}.ed-current-job-field:nth-child(4n){border-right:0}.ed-current-job-field:nth-last-child(-n+4){border-bottom:0}.ed-current-job-field span{display:block;color:#6c7a88;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px}.ed-current-job-field b{display:block;font-size:13px;overflow-wrap:anywhere}.ed-current-job-description{padding:14px 16px 16px}.ed-current-job-description span{display:block;color:#6c7a88;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;margin-bottom:5px}.ed-current-job-description div{font-size:13px;line-height:1.55;white-space:pre-wrap}.ed-attendance-panel{margin-top:30px;margin-bottom:22px;padding:18px;border:1px solid #e4ebf0;border-radius:14px;background:#f8fafb}.ed-attendance-panel h2{margin:0 0 4px}.ed-attendance-list{display:grid;gap:9px;margin-top:14px}.ed-attendance-row{display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(220px,1.35fr) auto;gap:14px;align-items:center;background:#fff;border:1px solid #e4ebf0;border-radius:12px;padding:13px}.ed-attendance-meta{font-size:12px;color:#6c7a88;line-height:1.5}.ed-attendance-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center}.ed-attendance-badge{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:10.5px;font-weight:800;margin-top:0}.ed-attendance-badge.green{background:#edf8f3;color:#167a54}.ed-attendance-badge.orange{background:#fff3e7;color:#b85f0e}.ed-attendance-badge.red{background:#fff0ec;color:#b64d2a}.ed-attendance-badge.muted{background:#f1f4f6;color:#667788}
        .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
        .rs-modal-card{width:min(620px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
        .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
        .wd-days{display:grid;gap:10px}.wd-day{display:grid;grid-template-columns:135px 170px minmax(120px,1fr) minmax(120px,1fr);align-items:end;gap:14px;border:1px solid #e4ebf0;border-radius:12px;padding:14px}
        .wd-day.available{background:#fff7ef;border-color:#f0ba86;box-shadow:inset 3px 0 0 #f08a28}.wd-day.available .wd-day-date b{color:#a85212}.wd-day.available .wd-status-select{border-color:#f0ba86}.wd-day.occupied{background:#f4f7f9;border-color:#d7e0e7;box-shadow:inset 3px 0 0 #6c7a88}.wd-day.occupied .wd-day-date b{color:#526374}.wd-day.occupied .wd-status-select{background:#fff!important;color:#102438!important;border-color:#dbe4ea!important}.wd-day.occupied.available{background:#fff7ef;border-color:#f0ba86;box-shadow:inset 3px 0 0 #f08a28}.wd-day.occupied.available .wd-day-date b{color:#a85212}.wd-day.occupied.available .wd-status-select{background:#fff!important;color:#102438!important;border-color:#f0ba86!important}.wd-day.conflict{background:#fff4f1!important;border-color:#d85b3f!important;box-shadow:inset 4px 0 0 #c4472d,0 0 0 2px rgba(196,71,45,.08)!important}.wd-day.conflict .wd-day-date b{color:#a83924!important}.wd-day-conflict-note{grid-column:1/-1;border:1px solid #efc7bb;border-radius:10px;background:#fff0ec;color:#a74428;padding:10px 12px;font-size:12px;font-weight:800;line-height:1.45;text-align:center}.wd-day-occupied-note{grid-column:1/-1;color:#607180;font-size:11px;font-weight:700;margin-top:2px;text-align:center;line-height:1.5;padding:2px 10px}.wd-day-occupied-note b{color:#102438}
        .wd-day-date{align-self:center}.wd-day-date b{display:block;text-transform:capitalize}.wd-day-date span{font-size:13px;color:#6c7a88}
        .wd-availability-choice{display:grid;gap:5px}.wd-availability-choice span,.wd-time-field span{font-size:11px;color:#6c7a88;font-weight:700}
        .wd-status-select{width:100%;border:1px solid #dbe4ea;border-radius:9px;padding:9px 10px;background:#fff;color:#102438;font:inherit}
        .wd-time-field{display:grid;gap:5px;min-width:0}
        .wd-bottom{position:sticky;bottom:16px;z-index:20;display:flex;justify-content:flex-end}
        .wd-save{border:0;border-radius:12px;background:#f08a28;color:#fff;padding:14px 24px;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(240,138,40,.24)}
        .wd-save:disabled{opacity:.6;cursor:wait}
        .wd-note{border-radius:10px;padding:11px 13px;font-size:14px;font-weight:700;margin-bottom:18px}.wd-note.ok{background:#edf8f3;color:#167a54}.wd-note.err{background:#fff0ec;color:#b64d2a;text-align:center}
        .wd-availability-alert{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff8ed;border:1px solid #f1cf9e;border-radius:14px;padding:16px 18px;margin-bottom:20px}
        .wd-availability-alert b{display:block;font-family:Manrope,Inter,sans-serif;font-size:15px;color:#8a531d;margin-bottom:4px}
        .wd-availability-alert span{display:block;color:#6f5a42;font-size:13px;line-height:1.5;max-width:650px}
        .wd-availability-alert-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex:0 0 auto}
        /* Mobilus grafiko patvirtinimas: du vienodi, lygiuoti mygtukai. */
        @media(max-width:760px){
          .wd-availability-alert-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%;align-items:stretch;justify-content:stretch;flex:0 0 auto}
          .wd-availability-alert-actions>button{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:48px;height:100%;border-radius:10px;padding:11px 8px;font-size:13px;line-height:1.3;text-align:center;white-space:normal;box-shadow:none}
        }
        .wd-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:12px;background:#f6f8fa;color:#102438}
        .wd-spinner{width:28px;height:28px;border:3px solid #dfe7ed;border-top-color:#f08a28;border-radius:50%;animation:wdspin .8s linear infinite}
        .wd-onboarding-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
        @keyframes wdspin{to{transform:rotate(360deg)}}
        @media(max-width:1180px){
          .wd-overview{grid-template-columns:repeat(3,minmax(0,1fr))}
          .wd-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
        }
        @media(max-width:760px){
          .wd-topbar-inner,.wd-shell{width:min(100% - 24px,1320px)}
          .wd-heading{align-items:flex-start;flex-direction:column}
          .wd-onboarding-steps{grid-template-columns:1fr}
          .wd-overview{grid-template-columns:repeat(2,minmax(0,1fr))}
          .wd-heading-actions{width:100%}
          .wd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
          .wd-grid-2{grid-template-columns:1fr}
          .wd-location-card{align-items:flex-start;flex-wrap:wrap;gap:8px}.wd-location-copy{flex:1 1 190px}
          .wd-day{grid-template-columns:1fr 1fr}
          .wd-day-date{grid-column:1/-1}.wd-day-occupied-note{grid-column:1/-1}
          .wd-availability-choice{grid-column:1/-1}
          .wd-invite{grid-template-columns:1fr}.wd-invite-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));justify-content:stretch;width:100%}.wd-invite-actions>button{width:100%;min-width:0;min-height:44px;padding:10px 12px}.wd-invite-actions>.wd-invite-status{grid-column:1/-1}
          .wd-workday{grid-template-columns:1fr}.wd-workday-actions{width:100%;max-width:190px;justify-content:stretch}.wd-long-term-offer-card{grid-template-columns:1fr}.wd-long-term-offer-status{justify-content:flex-start;text-align:left;min-width:0;padding:4px 0}.wd-long-term-offer-actions{width:100%;max-width:none;grid-template-columns:1fr}
          .wd-heading-actions{justify-items:start}
          .wd-onboarding-actions{width:100%}
          .wd-onboarding-btn{flex:1 1 140px;min-height:42px}
          .wd-availability-alert{align-items:stretch;flex-direction:column}
          .wd-availability-alert-actions{justify-content:flex-start}
          .wd-bottom{bottom:10px}
          .wd-save{width:100%}
        }
        @media(max-width:480px){
          .wd-overview{grid-template-columns:1fr}
          .wd-heading h1{font-size:29px}
        }
      `}</style>

      <header className="wd-topbar">
        <div
          className="wd-topbar-inner"
          style={
            isPhoneLayout
              ? {
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  justifyItems: "center",
                  gap: 10,
                  padding: "10px 0",
                }
              : undefined
          }
        >
          <div
            style={
              isPhoneLayout
                ? { width: "100%", display: "flex", justifyContent: "center" }
                : undefined
            }
          >
            <BrandLogo className="brand" href="#" height={46} />
          </div>
          <div
            className="wd-topbar-actions"
            style={
              isPhoneLayout
                ? {
                    display: "flex",
                    width: "100%",
                    justifyContent: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }
                : { display: "flex", alignItems: "center", gap: 9 }
            }
          >
            {onAdminReturn && (
              <button
                className="btn ghost"
                type="button"
                onClick={onAdminReturn}
              >
                ← Administravimas
              </button>
            )}
            {!onAdminReturn && isPhoneLayout && (
              <button
                className="btn ghost wd-mobile-profile-btn"
                type="button"
                onClick={() => {
                  if (showProfileEditor) {
                    setShowProfileEditor(false);
                  } else {
                    openWorkerProfileEditor("profile");
                  }
                }}
              >
                {showProfileEditor ? "Uždaryti" : "Profilis"}
              </button>
            )}
            {!onAdminReturn && <AdminPrivateInboxButton user={user} />}
            <button className="btn ghost" onClick={onLogout}>
              Atsijungti
            </button>
          </div>
        </div>
      </header>
      {!onAdminReturn && <WebPushSettings user={user} kind="worker" profileOpen={showProfileEditor} />}

      <main className="wd-shell">
        {showProfileEditor && <WorkAbroadPreference user={user}/>}

        <div className="wd-heading">
          <div>
            <div className="eyebrow">DARBUOTOJO PASKYRA</div>
            <h1>Mano darbai ir statistika</h1>
            <p>
              Čia matote aktyvius darbus, neuždarytas darbo dienas ir savo
              patikimumo statistiką.
            </p>
          </div>

          <div className="wd-heading-actions">
            <div className="wd-user">
              <div className="wd-avatar">
                {profileAvatarUrl ? (
                  <img
                    src={profileAvatarUrl}
                    alt={form.displayName || "Darbuotojo profilis"}
                  />
                ) : (
                  initials || "D"
                )}
              </div>
              <div>
                <b>{form.displayName || "Darbuotojas"}</b>
                <span>{form.city || "Miestas nenurodytas"}</span>
              </div>
            </div>

            <button
              className={`wd-urgent-btn ${
                urgentAvailabilityIsActive() ? "active" : ""
              }`}
              type="button"
              onClick={() => {
                setUrgentForm((current) => ({
                  ...current,
                  city:
                    urgentAvailability.city ||
                    current.city ||
                    form.city ||
                    "Vilnius",
                }));
                setShowUrgentAvailability(true);
              }}
            >
              {urgentAvailabilityIsActive()
                ? "Laisvas dabar · įjungta"
                : "Laisvas dabar · išjungta"}
            </button>

            {urgentAvailabilityIsActive() && !hasCurrentScheduledWork() && (
              <div className="wd-urgent-status">
                {`${urgentAvailability.city} · matomas „Skubiai!“ paieškoje`}
              </div>
            )}

            {activeLongTermEmployment && (
              <button
                className="wd-long-term-btn"
                type="button"
                onClick={() => {
                  setLongTermSignedContractFile(null);
                  setLongTermOfferTarget(activeLongTermEmployment);
                }}
              >
                Darbdavys
                {Number(longTermUnreadByOffer[activeLongTermEmployment.id] || 0) > 0 && (
                  <span className="wd-chat-count">
                    {Math.min(9, Number(longTermUnreadByOffer[activeLongTermEmployment.id] || 0))}
                  </span>
                )}
              </button>
            )}

            {!isPhoneLayout && (
              <button
                className="wd-edit-profile"
                type="button"
                onClick={() => {
                  if (showProfileEditor) {
                    setShowProfileEditor(false);
                  } else {
                    openWorkerProfileEditor("profile");
                  }
                }}
              >
                {showProfileEditor
                  ? "Uždaryti redagavimą"
                  : "Tvarkyti mano informaciją"}
              </button>
            )}
          </div>
        </div>

        {notice && <div className="wd-note ok">{notice}</div>}
        {error && <div className="wd-note err">{error}</div>}
        {metrics.restrictedUntil &&
          new Date(metrics.restrictedUntil) > new Date() && (
            <div className="wd-note err">
              Paskyrai taikomas laikinas apribojimas: naujų darbų priimti negalite iki{" "}
              {new Date(metrics.restrictedUntil).toLocaleString("lt-LT", {
                dateStyle: "short",
                timeStyle: "short",
              })}.
            </div>
          )}

        {showWorkTimeLoginReminder && (
          <div className="wd-worktime-login-reminder" role="status">
            <div className="wd-worktime-login-reminder-copy">
              <b>Būtinai atnaujinkite darbo laikus</b>
              <span>
                Patikrinkite, ar jūsų prieinamumas vis dar tikslus, kad darbdaviai
                matytų realų laiką, kada galite dirbti.
              </span>
            </div>
            <button type="button" onClick={openWorkerWorkTimeEditor}>
              Atnaujinti
            </button>
          </div>
        )}

        {!onAdminReturn &&
          (!form.displayName.trim() ||
            !form.phone.trim() ||
            availableCount === 0) && (
            <section className="wd-onboarding-card">
              <div className="wd-onboarding-top">
                <div>
                  <div className="eyebrow">PIRMIEJI ŽINGSNIAI</div>
                  <h3 style={{ margin: "5px 0 4px", color: "#102438" }}>Paruoškite profilį kvietimams į darbą</h3>
                  <div style={{ color: "#607180", fontSize: 12 }}>Užpildytas profilis ir grafikas padeda sistemai siųsti tik tinkamus pasiūlymus.</div>
                </div>
                <div className="wd-onboarding-actions">
                  <button className="wd-onboarding-btn secondary" type="button" onClick={() => openWorkerProfileEditor("profile")}>Profilis</button>
                  <button className="wd-onboarding-btn primary" type="button" onClick={() => openWorkerProfileEditor("availability")}>Nustatyti grafiką</button>
                </div>
              </div>
              <div className="wd-onboarding-steps">
                <div style={{ padding: 11, borderRadius: 11, background: "#f7f9fb", fontSize: 12 }}><b>{form.displayName.trim() && form.phone.trim() ? "✓" : "1"}</b> Profilis ir telefonas</div>
                <div style={{ padding: 11, borderRadius: 11, background: "#f7f9fb", fontSize: 12 }}><b>{availableCount > 0 ? "✓" : "2"}</b> Bent viena laisva diena</div>
                <div style={{ padding: 11, borderRadius: 11, background: "#f7f9fb", fontSize: 12 }}><b>3</b> Priimkite tinkamą kvietimą</div>
              </div>
            </section>
          )}
        <div className="wd-overview-heading eyebrow">DABAR SVARBIAUSIA</div>

        <div className="wd-overview">
          <div className={`wd-overview-card ${invitations.length ? "action" : ""}`}>
            <div className="wd-overview-card-top">
              <span>Nauji kvietimai</span>
              {invitations.length > 0 && (
                <button
                  className="wd-overview-open"
                  type="button"
                  onClick={() => openWorkerDashboardTarget("invitations")}
                >
                  Peržiūrėti
                </button>
              )}
            </div>
            <b>{invitations.length}</b>
            <small>{invitations.length ? "Laukia jūsų atsakymo" : "Naujų kvietimų nėra"}</small>
          </div>

          <div
            className={`wd-overview-card next-work ${
              nextConfirmedJob?.work_date === workerDashboardToday ? "live" : ""
            }`}
          >
            <div className="wd-overview-card-top">
              <span>Artimiausias darbas</span>
              {nextConfirmedJob && (
                <button
                  className="wd-overview-open"
                  type="button"
                  onClick={openNearestConfirmedWorkday}
                >
                  Peržiūrėti
                </button>
              )}
            </div>
            <b>
              {nextConfirmedJob
                ? `${nextConfirmedWorkdayDateLabel} · ${
                    nextConfirmedJob.start_time?.slice(0, 5) || "Laikas nenurodytas"
                  }`
                : "Nėra"}
            </b>
            <small>
              {nextConfirmedJob
                ? `${nextConfirmedJob.title}${
                    workerTodayJobs.length > 1 &&
                    nextConfirmedJob.work_date === workerDashboardToday
                      ? ` · dar ${workerTodayJobs.length - 1} šiandien`
                      : nextConfirmedJob.city
                      ? ` · ${nextConfirmedJob.city}`
                      : ""
                  }`
                : "Patvirtintų artimiausių darbų nėra"}
            </small>
          </div>

          <div
            className={`wd-overview-card ${
              workerRequiredActionCount ? "danger" : ""
            }`}
          >
            <div className="wd-overview-card-top">
              <span>Reikia veiksmo</span>
              {workerRequiredActionCount > 0 && (
                <button
                  className="wd-overview-open"
                  type="button"
                  onClick={() =>
                    openWorkerDashboardTarget(
                      needsAvailabilityConfirm ? "availability-review" : "workdays"
                    )
                  }
                >
                  Peržiūrėti
                </button>
              )}
            </div>
            <b>{workerRequiredActionCount}</b>
            <small>
              {workerRequiredActionCount
                ? needsAvailabilityConfirm
                  ? "Įskaitant grafiko patvirtinimą"
                  : "Atidarykite darbo dienas"
                : "Veiksmų šiuo metu nėra"}
            </small>
          </div>

          <div
            className={`wd-overview-card ${
              workerUnreadMessages.length ? "action" : ""
            }`}
          >
            <div className="wd-overview-card-top">
              <span>Naujos žinutės</span>
              {workerUnreadMessages.length > 0 && (
                <button
                  className="wd-overview-open"
                  type="button"
                  onClick={() => openWorkerDashboardTarget("workdays")}
                >
                  Peržiūrėti
                </button>
              )}
            </div>
            <b>{workerUnreadMessages.length}</b>
            <small>{workerUnreadMessages.length ? "Atidarykite pokalbį" : "Viskas perskaityta"}</small>
          </div>

          <div
            className={`wd-overview-card wd-overview-card-disputes ${
              workerOpenDisputes.length ? "danger" : ""
            }`}
          >
            <div className="wd-overview-card-top">
              <span>Ginčai</span>
              {workerOpenDisputes.length > 0 && (
                <button
                  className="wd-overview-open"
                  type="button"
                  onClick={() => openWorkerDashboardTarget("workdays")}
                >
                  Peržiūrėti
                </button>
              )}
            </div>
            <b>{workerOpenDisputes.length}</b>
            <small>
              {workerOpenDisputes.length
                ? workerOpenDisputes.length === 1
                  ? "Nagrinėja administratorius"
                  : "Nagrinėjami administratoriaus"
                : "Aktyvių ginčų nėra"}
            </small>
          </div>

        </div>

        {showProfileEditor && (
          <section
            ref={workerProfileEditorRef}
            id="worker-profile-editor"
            className="wd-profile-editor"
            style={{ scrollMarginTop: 88 }}
          >
            <div className="wd-profile-editor-head">
              <div>
                <div className="eyebrow">MANO INFORMACIJA</div>
                <h2>Tvarkyti mano informaciją</h2>
                <p>
                  Atnaujinkite savo profilį ir laiką, kada galite priimti darbo
                  pasiūlymus.
                </p>
              </div>

              <button
                className="wd-profile-editor-close"
                type="button"
                disabled={saving}
                onClick={() => setShowProfileEditor(false)}
                aria-label="Uždaryti"
              >
                <CloseMark />
              </button>
            </div>

            <div id="s24-worker-push-settings" />
            <div className="wd-profile-editor-section">
              <h3>Pagrindinė informacija</h3>

              <div className="wd-avatar-editor">
                <div className="wd-avatar-preview">
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt={form.displayName || "Profilio nuotrauka"}
                    />
                  ) : (
                    initials || "D"
                  )}
                </div>

                <div className="wd-avatar-editor-copy">
                  <b>Profilio nuotrauka</b>
                  <span>
                    Nuotrauką matys darbdaviai prie jūsų profilio. JPG, PNG arba
                    WEBP, iki 5 MB.
                  </span>
                  <div className="wd-avatar-actions">
                    <label className="wd-avatar-upload">
                      {profileAvatarUrl ? "Keisti nuotrauką" : "Pridėti nuotrauką"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          chooseAvatarFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    {profileAvatarUrl && (
                      <button
                        className="wd-avatar-remove"
                        type="button"
                        onClick={markAvatarForRemoval}
                      >
                        Ištrinti logotipą
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="wd-grid-2">
                <label
                  className={`wd-label${profileFormErrors.firstName ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.firstName = node; }}
                >
                  Vardas *
                  <input
                    className="wd-input"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    autoComplete="given-name"
                    aria-invalid={Boolean(profileFormErrors.firstName)}
                    required
                  />
                  {profileFormErrors.firstName && <span className="wd-field-error" role="alert">{profileFormErrors.firstName}</span>}
                </label>

                <label
                  className={`wd-label${profileFormErrors.lastName ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.lastName = node; }}
                >
                  Pavardė *
                  <input
                    className="wd-input"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    autoComplete="family-name"
                    aria-invalid={Boolean(profileFormErrors.lastName)}
                    required
                  />
                  {profileFormErrors.lastName && <span className="wd-field-error" role="alert">{profileFormErrors.lastName}</span>}
                </label>

                <label
                  className={`wd-label${profileFormErrors.birthDate ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.birthDate = node; }}
                >
                  Gimimo data
                  <input
                    className="wd-input"
                    style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}
                    type="date"
                    min="1900-01-01"
                    max={getVilniusTodayISO()}
                    value={form.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                    autoComplete="bday"
                    aria-invalid={Boolean(profileFormErrors.birthDate)}
                  />
                  {profileFormErrors.birthDate && <span className="wd-field-error" role="alert">{profileFormErrors.birthDate}</span>}
                  <small style={{ fontSize: 11, color: "#72818d", fontWeight: 400 }}>
                    Šią datą matote tik savo profilyje – darbdaviams ji nerodoma.
                  </small>
                </label>

                <label
                  className={`wd-label${profileFormErrors.city ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.city = node; }}
                >
                  Miestas *
                  <CityAutocomplete
                    className="wd-input"
                    value={form.city}
                    onChange={(value) => updateField("city", value)}
                    placeholder="Pradėkite rašyti miestą"
                  />
                  {profileFormErrors.city && <span className="wd-field-error" role="alert">{profileFormErrors.city}</span>}
                </label>

                <label
                  className={`wd-label${profileFormErrors.phone ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.phone = node; }}
                >
                  Telefonas *
                  <input
                    className="wd-input"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    onBlur={() => {
                      const normalized = normalizeLithuanianMobilePhone(form.phone);
                      if (normalized) updateField("phone", normalized);
                    }}
                    placeholder="+37061234567"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(profileFormErrors.phone)}
                    required
                  />
                  {profileFormErrors.phone && <span className="wd-field-error" role="alert">{profileFormErrors.phone}</span>}
                  <PhoneAvailabilityHint verification={phoneVerification} />
                </label>

                <PhoneVerificationFields verification={phoneVerification} />

                <label
                  className={`wd-label${profileFormErrors.travelRadius ? " has-error" : ""}`}
                  ref={(node) => { profileFieldRefs.current.travelRadius = node; }}
                >
                  Kiek km galite nuvykti?
                  <input
                    className="wd-input"
                    type="number"
                    min="5"
                    max="50"
                    value={form.travelRadius}
                    onChange={(e) =>
                      updateField("travelRadius", e.target.value)
                    }
                    aria-invalid={Boolean(profileFormErrors.travelRadius)}
                  />
                  {profileFormErrors.travelRadius && <span className="wd-field-error" role="alert">{profileFormErrors.travelRadius}</span>}
                </label>

                <div className="wd-location-card">
                  <button
                    className={`wd-location-toggle ${searchLocationFresh ? "on" : "off"}`}
                    type="button"
                    disabled={searchLocationBusy}
                    aria-pressed={searchLocationFresh}
                    aria-label={
                      searchLocationNeedsRefresh
                        ? "Atnaujinti lokaciją"
                        : searchLocationFresh
                        ? "Išjungti lokaciją"
                        : "Įjungti lokaciją"
                    }
                    title={
                      searchLocationNeedsRefresh
                        ? "Lokacija senesnė nei 7 dienos. Paspauskite, kad atnaujintumėte."
                        : searchLocationFresh
                        ? "Paspauskite, kad išjungtumėte lokaciją ir ištrintumėte išsaugotas koordinates."
                        : "Paspauskite, kad įjungtumėte lokaciją tikslesniam atstumo iki darbo skaičiavimui."
                    }
                    onClick={
                      searchLocationFresh
                        ? disableSearchLocation
                        : updateSearchLocationFromBrowser
                    }
                  >
                    <span className="wd-location-toggle-dot" aria-hidden="true" />
                    <span>Lokacija</span>
                    <span className="wd-location-toggle-state">
                      {searchLocationBusy
                        ? searchLocationFresh
                          ? "Išjungiama..."
                          : "Nustatoma..."
                        : searchLocationNeedsRefresh
                        ? "Atnaujinti"
                        : searchLocationFresh
                        ? "Įjungta"
                        : "Išjungta"}
                    </span>
                  </button>
                  <span className="wd-location-copy">
                    <span className="wd-location-copy-title">Raskite arčiau esančius darbus</span>
                    <span className="wd-location-copy-text">Vietą naudojame tik atstumui apskaičiuoti — darbdaviui jos nerodome.</span>
                  </span>
                  {searchLocationError && (
                    <span className="wd-location-message err">{searchLocationError}</span>
                  )}
                </div>

                <label className="wd-label">
                  Patirtis statybose (metais)
                  <input
                    className="wd-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.yearsExperience}
                    onChange={(e) =>
                      updateField("yearsExperience", e.target.value)
                    }
                  />
                </label>

                <div className="wd-profile-editor-check-stack">
                  <label className="wd-check wd-profile-editor-check">
                    <input
                      type="checkbox"
                      checked={form.hasDrivingLicenseB}
                      onChange={(e) =>
                        updateField("hasDrivingLicenseB", e.target.checked)
                      }
                    />
                    Turiu B kategorijos vairuotojo pažymėjimą
                  </label>

                  <label className="wd-check wd-profile-editor-check">
                    <input
                      type="checkbox"
                      checked={form.hasIndividualActivity}
                      onChange={(e) =>
                        updateField("hasIndividualActivity", e.target.checked)
                      }
                    />
                    Turiu individualią veiklą
                  </label>
                </div>
              </div>

              <label
                className={`wd-label${profileFormErrors.shortBio ? " has-error" : ""}`}
                style={{ marginTop: 16 }}
                ref={(node) => { profileFieldRefs.current.shortBio = node; }}
              >
                Patirtis *
                <textarea
                  className="wd-textarea"
                  value={form.shortBio}
                  required
                  onChange={(e) => updateField("shortBio", e.target.value)}
                  placeholder="Pvz. 2 metus dirbau statybų pagalbiniu. Jei patirties neturite, įrašykite „Neturiu“."
                  aria-invalid={Boolean(profileFormErrors.shortBio)}
                />
                {profileFormErrors.shortBio && <span className="wd-field-error" role="alert">{profileFormErrors.shortBio}</span>}
              </label>
            </div>

            <div className="wd-profile-editor-section wd-recent-ratings-card">
              <div className="eyebrow">PASKUTINIAI 3 DARBDAVIŲ ĮVERTINIMAI</div>

              {recentEmployerRatingsLoading ? (
                <SilentLoader size={18} minHeight={36} />
              ) : recentEmployerRatings.length ? (
                <div className="wd-recent-ratings-list">
                  {recentEmployerRatings.map((review) => (
                    <div className="wd-recent-rating" key={review.id}>
                      <div className="wd-recent-rating-head">
                        <b>{review.score} / 10</b>
                        <span>{new Date(review.created_at).toLocaleDateString("lt-LT")}</span>
                      </div>
                      {review.comment?.trim() && <p>{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="wd-empty-friendly" style={{ marginTop: 4 }}>
                  <div className="wd-empty-friendly-icon">☆</div>
                  <div>
                    <b>Dar nėra darbdavių įvertinimų</b>
                    Kai gausite įvertinimą po užbaigto darbo, naujausi bus rodomi čia.
                  </div>
                </div>
              )}
            </div>

            <div
              className="wd-profile-editor-section"
              id="worker-availability-editor"
              style={{ scrollMarginTop: 92 }}
            >
              <h3>Kada galite dirbti?</h3>
              <p>
                Pažymėkite artimiausias 14 dienų, kuriomis realiai galite priimti
                darbo pasiūlymą.
              </p>

              {isPhoneLayout && availabilityMobileDay && (
                <div className="wd-availability-carousel-nav">
                  <button
                    type="button"
                    aria-label="Ankstesnė diena"
                    onClick={() =>
                      setAvailabilityMobileIndex((current) =>
                        (current - 1 + days.length) % days.length
                      )
                    }
                  >
                    ‹
                  </button>
                  <div>
                    <b>{availabilityMobileDay.weekday} · {availabilityMobileDay.label}</b>
                    <span>{safeAvailabilityMobileIndex + 1} / {days.length}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Kita diena"
                    onClick={() =>
                      setAvailabilityMobileIndex((current) =>
                        (current + 1) % days.length
                      )
                    }
                  >
                    ›
                  </button>
                </div>
              )}

              <div className="wd-days">
                {availabilityDaysForRender.map((day) => {
                  const state = availability[day.iso] || {
                    available: false,
                    from: "08:00",
                    to: "17:00",
                  };
                  const occupiedJobs = confirmedJobsOnDate(day.iso);
                  const longTermSchedules = longTermSchedulesOnDate(day.iso);
                  const isPartiallyOccupied =
                    occupiedJobs.length > 0 || longTermSchedules.length > 0;
                  const stateFitsWindow = availabilityFitsWindow(day.iso, state);
                  const conflictMarked = availabilityConflictDates.includes(day.iso);
                  const conflict = conflictMarked
                    ? availabilityConflictForDate(day.iso, state)
                    : null;
                  const validationMessage = availabilityValidationMessages[day.iso] || "";

                  return (
                    <div
                      id={`worker-availability-day-${day.iso}`}
                      className={`wd-day${isPartiallyOccupied ? " occupied" : ""}${stateFitsWindow ? " available" : ""}${conflictMarked ? " conflict" : ""}`}
                      key={day.iso}
                    >
                      <div className="wd-day-date">
                        <b>{day.weekday}</b>
                        <span>{day.label}</span>
                      </div>

                      <div className="wd-availability-choice">
                        <span>Būsena</span>
                        <RoundedSelect
                          className="wd-status-select"
                          ariaLabel={`${day.label} prieinamumas`}
                          value={state.available ? "available" : "unavailable"}
                          onChange={(value) =>
                            updateAvailability(day.iso, {
                              available: value === "available",
                            })
                          }
                          options={[
                            { value: "unavailable", label: "Užimtas" },
                            {
                              value: "available",
                              label: isPartiallyOccupied ? "Laisvas kitu laiku" : "Laisvas",
                            },
                          ]}
                        />
                      </div>

                      <div className="wd-time-field">
                        <span>Nuo</span>
                        <RoundedTimeSelect
                          ariaLabel={`${day.label} nuo`}
                          disabled={!state.available}
                          value={state.from || "08:00"}
                          onChange={(value) =>
                            updateAvailability(day.iso, {
                              from: value,
                            })
                          }
                        />
                      </div>

                      <div className="wd-time-field">
                        <span>Iki</span>
                        <RoundedTimeSelect
                          ariaLabel={`${day.label} iki`}
                          align="right"
                          disabled={!state.available}
                          value={state.to || "17:00"}
                          onChange={(value) =>
                            updateAvailability(day.iso, {
                              to: value,
                            })
                          }
                        />
                      </div>

                      {conflictMarked && (
                        <div className="wd-day-conflict-note" role="alert">
                          {validationMessage || (
                            <>
                              Pasirinktas laikas kertasi su užfiksuotu darbu arba nepalieka 1 val. tarpo nuvykimui.
                              {conflict?.label ? ` Kertasi su: ${conflict.label}.` : ""}
                            </>
                          )}
                        </div>
                      )}

                      {isPartiallyOccupied && (
                        <div className="wd-day-occupied-note">
                          {longTermSchedules.length > 0 && (
                            <div>
                              {longTermSchedules.map((row, index) => (
                                <span key={`${row.placementId}-${day.iso}-${index}`}>
                                  {index > 0 ? " • " : ""}
                                  <b>Užfiksuota · Įdarbinimo grafikas</b> · {row.companyName} · {row.start_time}–{row.end_time}
                                </span>
                              ))}
                            </div>
                          )}
                          {occupiedJobs.length > 0 && (
                            <div>
                              {occupiedJobs.map((job, index) => (
                                <span key={job.id || `${day.iso}-${index}`}>
                                  {index > 0 ? " • " : ""}
                                  Dirbate įmonėje <b>{job.companyName || "Darbdavys"}</b> · {formatJobTitle(job?.title, "Patvirtintas darbas")} · {job?.start_time?.slice(0, 5) || ""}{job?.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                          <div>
                            Laisvą laiką galite įvesti patys, taip pat ir per vidurnaktį, pvz. 18:00–07:00. Išsaugant sistema neleis pasirinkti laiko, kuris kertasi su užfiksuotu darbu arba 1 val. nuvykimo rezervu.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="wd-profile-editor-actions">
              <button
                className="wd-profile-editor-cancel"
                type="button"
                disabled={saving}
                onClick={() => setShowProfileEditor(false)}
              >
                Atšaukti
              </button>

              <button
                className="wd-save"
                type="button"
                disabled={saving}
                onClick={saveEverything}
              >
                {saving ? "Saugoma..." : profileSaved ? "Išsaugota" : "Išsaugoti"}
              </button>
            </div>

            <AccountDeleteZone
              onDelete={() => setDeleteAccountOpen(true)}
              description="Ištrynus darbuotojo paskyrą bus pašalintas jūsų profilis, sukurti duomenys ir įkelti failai. Šio veiksmo atkurti nebus galima."
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

        {needsAvailabilityConfirm && (
          <div id="worker-availability-alert" className="wd-availability-alert" style={{ scrollMarginTop: 88 }}>
            <div>
              <b>Patvirtinkite, kad jūsų grafikas vis dar galioja</b>
              <span>
                Kol grafikas nepatvirtintas, darbdaviai jūsų nemato naujų
                darbuotojų paieškoje. Tai padeda rodyti tik realiai aktyvius
                žmones.
              </span>
            </div>

            <div className="wd-availability-alert-actions">
              <button
                className="wd-profile-editor-cancel"
                type="button"
                disabled={confirmingAvailability}
                onClick={() => openWorkerProfileEditor("availability")}
              >
                Keisti grafiką
              </button>

              <button
                className="wd-save"
                type="button"
                disabled={confirmingAvailability}
                onClick={confirmCurrentAvailability}
              >
                {confirmingAvailability
                  ? "Patvirtinama..."
                  : "Patvirtinti grafiką"}
              </button>
            </div>
          </div>
        )}

        <BugResolutionNotice userId={user.id} />

        <section className="wd-stats-section">
          <div className="wd-stats-head">
            <button
              className={`wd-stats-toggle ${showWorkerStats ? "open" : ""}`}
              type="button"
              aria-expanded={showWorkerStats}
              aria-label={showWorkerStats ? "Slėpti mano statistiką" : "Rodyti mano statistiką"}
              onClick={() => setShowWorkerStats((current) => !current)}
            >
              MANO STATISTIKA · SPAUSK IR ŽIŪRĖK
            </button>
          </div>

          {showWorkerStats && (
            <div className="wd-kpis">
              <div className="wd-kpi">
                <span>Šį mėnesį išdirbta</span>
                <b>{formatWorkedMinutes(workerStats.monthWorkedMinutes)}</b>
              </div>
              <div className="wd-kpi">
                <span>Užbaigti darbai</span>
                <b>{metrics.completedJobs}</b>
                <small style={{ display: "block", marginTop: 5, color: "#8a98a6" }}>
                  Visa patvirtinta istorija
                </small>
              </div>
              <div className="wd-kpi wd-kpi-reliability">
                <button
                  className="wd-kpi-info-btn"
                  type="button"
                  onClick={() => setShowWorkerReliabilityInfo(true)}
                  aria-label="Atidaryti darbuotojo patikimumo paaiškinimą"
                >
                  <span className="wd-kpi-info-label">Atvykimo patikimumas</span>
                </button>
                <b
                  style={{ color: reliabilityScoreColor(metrics.attendanceRate) }}
                >
                  {formatReliabilityScore(metrics.attendanceRate)} / 100
                </b>
              </div>
              <div className="wd-kpi">
                <span>Darbdavių įvertinimas</span>
                <b>
                  {metrics.ratingAverage === null
                    ? "—"
                    : `${metrics.ratingAverage.toFixed(1)} / 10`}
                </b>
                <small style={{ display: "block", marginTop: 5, color: "#8a98a6" }}>
                  {metrics.ratingCount
                    ? `${metrics.ratingCount} vertinimai`
                    : "Dar nėra vertinimų"}
                </small>
              </div>
              <div className="wd-kpi wd-kpi-issues">
                <span>Probleminės darbo dienos</span>
                <div className="wd-kpi-issue-breakdown">
                  <span>Neatvykimai <strong>{metrics.noShowCount}</strong></span>
                  <span>Ankstyvi išėjimai <strong>{workerStats.unexcusedEarlyLeaveCount}</strong></span>
                </div>
              </div>
            </div>
          )}
        </section>


        {employerReviewOpportunities.length > 0 && (
          <section
            className="wd-card"
            style={{
              borderColor: "#f3c38f",
              background: "#fffaf5",
              marginBottom: 18,
            }}
          >
            <div className="eyebrow">GINČAS IŠSPRĘSTAS JŪSŲ NAUDAI</div>
            <h2 style={{ marginTop: 6 }}>
              Galite palikti atsiliepimą apie darbdavį
            </h2>
            <p className="wd-card-sub">
              Atsiliepimas bus rodomas įmonės profilyje ir darbuotojams,
              gavusiems šios įmonės darbo kvietimus.
            </p>

            <div style={{ display: "grid", gap: 10 }}>
              {employerReviewOpportunities.map((opportunity) => (
                <div
                  key={opportunity.attendance_id}
                  style={{
                    border: "1px solid #ead7c4",
                    background: "#fff",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <b>{opportunity.company_name}</b>
                    <div
                      style={{
                        color: "#6c7a88",
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {formatJobTitle(opportunity.job_title)} · {opportunity.work_date}
                    </div>
                  </div>

                  <button
                    className="wd-accept"
                    type="button"
                    onClick={() => openEmployerReview(opportunity)}
                  >
                    Palikti atsiliepimą
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {pendingLongTermOffers.length > 0 && (
        <section className="wd-card" id="worker-long-term-offers" style={{ marginBottom: 18 }}>
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
              <h2 style={{ marginBottom: 6 }}>Įdarbinimo pasiūlymai</h2>
            </div>
            <span className="wd-workday-status orange" style={{ marginTop: 0 }}>
              Nauji pasiūlymai · {pendingLongTermOffers.length}
            </span>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {pendingLongTermOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="wd-long-term-offer-card"
                >
                  <div className="wd-long-term-offer-info" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <MonthlyAwardMiniList
                      awards={companyAwardsById[offer.company_id] || []}
                      size={46}
                    />
                    <CompanyBadge
                      name={offer.company_name}
                      avatarPath={offer.company_avatar_path}
                      size={46}
                      fontSize={16}
                    />
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: "block", fontSize: 16 }}>
                        {offer.position_title || "Įdarbinimo pasiūlymas"}
                      </b>
                      <div style={{ marginTop: 3, color: "#425466", fontWeight: 700 }}>
                        {offer.company_name || "Darbdavys"}
                      </div>
                      <div style={{ marginTop: 3, color: "#6c7a88", fontSize: 12 }}>
                        {longTermContractLabel(offer.contract_type)} · nuo {offer.proposed_start_date}
                      </div>
                      {activeLongTermEmployment && activeLongTermEmployment.id !== offer.id && (
                        <div
                          style={{
                            marginTop: 6,
                            color: "#9a5b18",
                            fontSize: 11,
                            fontWeight: 800,
                            lineHeight: 1.35,
                          }}
                        >
                          Jau turite aktyvų ilgalaikį darbą · šį pasiūlymą kol kas galite tik peržiūrėti ir aptarti
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="wd-long-term-offer-status">
                    <div
                      className={`wd-long-term-status-main ${longTermWorkerUpdateTone(
                        offer
                      )}`}
                    >
                      {longTermWorkerUpdateLabel(offer)}
                    </div>
                  </div>

                  <div className="wd-long-term-offer-actions">
                    <button
                      className="wd-decline"
                      type="button"
                      onClick={async () => {
                        setLongTermSignedContractFile(null);
                        const viewedOffer = await workerMarkLongTermOfferViewed(offer);
                        setLongTermOfferTarget(viewedOffer || offer);
                      }}
                    >
                      Atidaryti
                    </button>

                    <button
                      className={`wd-decline wd-workday-chat ${
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
                          title: `${offer.company_name} · ${offer.position_title}`,
                        });
                      }}
                    >
                      Aptarti pasiūlymą
                      {Number(longTermUnreadByOffer[offer.id] || 0) > 0 && (
                        <span className="wd-chat-count">
                          {Math.min(9, Number(longTermUnreadByOffer[offer.id] || 0))}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
        </section>
        )}

        <div className="wd-form">
          <section className="wd-card wd-invitations-section" id="worker-invitations">
            <h2>Kvietimai į darbą</h2>

            {invitations.length ? (
              <>
              <div className="wd-invites">
                {invitations
                  .slice(
                    (workerInvitationPage - 1) * DASHBOARD_PAGE_SIZE,
                    workerInvitationPage * DASHBOARD_PAGE_SIZE
                  )
                  .map((invitation) => {
                  const job = invitation.job;
                  if (!job) return null;

                  const busy = respondingInvitation === invitation.id;
                  const unreadNews = unreadWorkerNotifications(invitation.id);
                  const unreadPrivateMessages = unreadNews.filter(
                    (item) => item.event_type === "message"
                  );
                  const unreadStatusNews = unreadNews.filter(
                    (item) => item.event_type !== "message"
                  );
                  const unreadPresentation = notificationPresentation(
                    unreadStatusNews
                  );
                  const hasConflict = invitationHasConflict(invitation);
                  const statusLabel =
                    invitation.status === "accepted"
                      ? "Priimta"
                      : invitation.status === "declined"
                      ? "Atmesta"
                      : invitation.status === "cancelled"
                      ? "Atšaukta"
                      : invitation.status === "expired"
                      ? "Nebegalioja"
                      : "Laukia atsakymo";

                  return (
                    <div
                      className={[
                        "wd-invite",
                        invitation.status === "pending" ? "is-pending" : "",
                        unreadPrivateMessages.length ? "has-unread" : "",
                        hasConflict ? "has-conflict" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={invitation.id}
                    >
                      <div className="wd-invite-main">
                        {unreadStatusNews.length > 0 && (
                          <div>
                            <span className={`rs-alert ${unreadPresentation.tone}`}>
                              {unreadPresentation.label}
                              {unreadStatusNews.length > 1
                                ? ` · ${unreadStatusNews.length}`
                                : ""}
                            </span>
                          </div>
                        )}
                        <h3>{formatJobTitle(job.title)}</h3>
                        <div className="wd-invite-summary">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              minWidth: 190,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                flex: "0 0 auto",
                              }}
                            >
                              <MonthlyAwardMiniList
                                awards={companyAwardsById[job.company_id] || []}
                                size={42}
                              />
                              <CompanyBadge
                                name={invitation.companyName}
                                avatarPath={invitation.companyAvatarPath}
                                size={42}
                                fontSize={12}
                              />
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <b style={{ display: "block" }}>
                                {invitation.companyName}
                              </b>
                            </div>
                          </div>
                          <span>
                            {job.work_date} · {job.start_time?.slice(0, 5)}
                            {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                          </span>
                          <span>{job.city || "Miestas nenurodytas"}</span>
                          <span>
                            {job.pay_amount
                              ? formatNetPay(job.pay_amount, job.pay_unit)
                              : "Atlygis nenurodytas"}
                          </span>
                        </div>

                        {hasConflict && (
                          <span className="wd-conflict">
                            Laikas sutampa su jau priimtu darbu
                          </span>
                        )}

                        {job.status === "cancelled" && (
                          <div
                            className="wd-note err"
                            style={{ marginTop: 12 }}
                          >
                            <b>Darbdavys atšaukė šį darbą.</b>
                            <div style={{ marginTop: 4 }}>
                              Priežastis:{" "}
                              {job.cancellation_reason || "Priežastis nenurodyta."}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="wd-invite-actions">
                        <button
                          className="wd-decline"
                          type="button"
                          onClick={() => openWorkdayDetails(invitation)}
                        >
                          Atidaryti
                        </button>

                        {invitation.status === "pending" ? (
                          <>
                            <button
                              className="wd-accept"
                              disabled={
                                busy ||
                                hasConflict ||
                                (metrics.restrictedUntil &&
                                  new Date(metrics.restrictedUntil) > new Date())
                              }
                              onClick={() => {
                                setCommitmentChecked(false);
                                setConfirmInvitation(invitation);
                              }}
                            >
                              {busy
                                ? "Prašome..."
                                : hasConflict
                                ? "Laikas užimtas"
                                : "Priimti"}
                            </button>
                            <button
                              className="wd-decline"
                              disabled={busy}
                              onClick={() =>
                                respondToInvitation(invitation.id, "declined")
                              }
                            >
                              Atmesti
                            </button>
                          </>
                        ) : (
                          <span className={`wd-invite-status ${invitation.status}`}>
                            {statusLabel}
                          </span>
                        )}

                        <button
                          className={`wd-decline wd-chat-btn ${
                            unreadPrivateMessages.length ? "has-unread" : ""
                          }`}
                          onClick={() => {
                            setConversation({
                              invitationId: invitation.id,
                              title: `${invitation.companyName} · ${formatJobTitle(job.title)}`,
                            });
                          }}
                        >
                          Privati žinutė
                          {unreadPrivateMessages.length > 0 && (
                            <span className="wd-chat-count">
                              {Math.min(9, unreadPrivateMessages.length)}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <DashboardPagination
                page={workerInvitationPage}
                totalItems={invitations.length}
                onPageChange={setWorkerInvitationPage}
              />
              </>
            ) : (
              <div className="wd-empty-friendly">
                <div className="wd-empty-friendly-icon">✓</div>
                <div>
                  <b>Naujų kvietimų į darbą nėra</b>
                  Kai darbdavys atsiųs jums tinkamą pasiūlymą, jis atsiras čia.
                </div>
              </div>
            )}
          </section>

          <section className="wd-card wd-active-jobs-section" id="worker-workdays">
            <h2>Mano darbai</h2>

            {activeWorkerWorkdays.length > 0 && (
              <div className="wd-evidence-reminder" role="note">
                <div>
                  <b className="wd-evidence-reminder-title">
                    <span className="wd-evidence-reminder-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M8.5 7 10 5h4l1.5 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <span>Išsaugokite atvykimo ir darbo pabaigos įrodymus</span>
                  </b>
                  <span>
                    Atvykę ir baigę darbą, jei objekte leidžiama fotografuoti, padarykite po nuotrauką ir išsaugokite originalą telefone. Tai gali padėti kilus ginčui dėl atvykimo ar darbo laiko. Venkite fotografuoti žmones, dokumentus ar kitą jautrią informaciją.
                  </span>
                </div>
              </div>
            )}

            {activeWorkerWorkdays.length ? (
              <>
              <div className="wd-workdays">
                {pagedActiveWorkerWorkdays.map((item) => {
                  const job = item.job;
                  const attendance = item.attendance || {};
                  const hasJobInformationUpdate = unreadWorkerJobNotifications(job.id).some(
                    (notification) => notification.event_type === "job_updated"
                  );
                  const ended = jobHasEnded(job);
                  const workStarts = job.work_date && job.start_time
                    ? jobStartMoment(job)
                    : null;
                  const hasStarted = workStarts && !Number.isNaN(workStarts.getTime())
                    && new Date() >= workStarts;
                  const workdayPhase = item.status === "cancelled_by_employer"
                    ? { label: "Atšauktas", tone: "cancelled" }
                    : attendance.finalized_at || item.status === "completed"
                    ? { label: "Užbaigtas", tone: "done" }
                    : attendance.dispute_status === "disputed"
                    ? { label: "Ginčas nagrinėjamas", tone: "past" }
                    : ["no_show", "left_early_agreed", "left_early_unexcused"].includes(attendance.employer_outcome)
                    ? { label: "Reikia peržiūrėti", tone: "past" }
                    : ended && attendance.worker_workday_claim === "worked"
                    ? { label: "Laukiama darbdavio", tone: "past" }
                    : ended
                    ? { label: "Pasibaigė · reikia uždaryti", tone: "past" }
                    : hasStarted
                    ? { label: "Vyksta šiandien", tone: "today" }
                    : { label: "Laukiamas darbas", tone: "upcoming" };
                  const checkInOpen = workerCheckInWindowOpen(job);
                  const isConfirmed = item.status === "confirmed";
                  const pendingNegative =
                    !attendance.finalized_at &&
                    ["no_show", "left_early_agreed", "left_early_unexcused"].includes(
                      attendance.employer_outcome
                    );
                  const disputed =
                    attendance.dispute_status === "disputed";
                  const canCheckIn =
                    isConfirmed &&
                    checkInOpen &&
                    !attendance.worker_check_in_at;
                  const needsClose =
                    isConfirmed &&
                    ended &&
                    !attendance.finalized_at &&
                    !pendingNegative;
                  const recentOrActive =
                    isConfirmed ||
                    item.status === "completed" ||
                    item.status === "no_show" ||
                    item.status === "cancelled_by_employer";

                  const workdayNextStep =
                    item.status === "cancelled_by_employer"
                      ? {
                          tone: "",
                          title: "Darbas atšauktas",
                          text: "Papildomų veiksmų šiai darbo dienai nereikia.",
                        }
                      : attendance.finalized_at
                      ? {
                          tone:
                            attendance.final_outcome === "no_show" ||
                            attendance.final_outcome === "left_early_unexcused"
                              ? "danger"
                              : "ok",
                          title: "Darbo diena uždaryta",
                          text:
                            attendance.dispute_status === "resolved_worker"
                              ? "Ginčas išspręstas jūsų naudai. Galutinis rezultatas užfiksuotas."
                              : attendance.dispute_status === "resolved_employer"
                              ? "Ginčas išspręstas ne jūsų naudai. Galutinis rezultatas užfiksuotas."
                              : "Galutinis darbo dienos rezultatas jau užfiksuotas.",
                        }
                      : disputed
                      ? {
                          tone: "danger",
                          title: "Ginčas perduotas administratoriui",
                          text: "Kol vyksta nagrinėjimas, reitingas nekeičiamas. Jei reikia, galite papildyti savo paaiškinimą ir įrodymus.",
                        }
                      : pendingNegative
                      ? {
                          tone: "action",
                          title: "Reikia jūsų atsakymo",
                          text: "Peržiūrėkite darbdavio pažymėtą rezultatą ir pasirinkite „Patvirtinti“ arba „Ginčyti“.",
                        }
                      : needsClose &&
                        attendance.worker_workday_claim === "worked"
                      ? {
                          tone: "action",
                          title: "Jūsų veiksmas atliktas",
                          text: "Pažymėjote, kad dirbote. Dabar laukiama darbdavio darbo dienos uždarymo.",
                        }
                      : needsClose
                      ? {
                          tone: "action",
                          title: "Uždarykite darbo dieną",
                          text: "Pasirinkite „Dirbau šiame darbe“ arba, jei neatvykote, pažymėkite „Neatvykau“.",
                        }
                      : canCheckIn
                      ? {
                          tone: "action",
                          title: "Atvykę pažymėkite atvykimą",
                          text: "Paspauskite „Atvykau“. Jei nerandate objekto ar atsakingo žmogaus, naudokite „Atvykau, bet nerandu“.",
                        }
                      : checkInOpen && attendance.worker_check_in_at
                      ? {
                          tone: "ok",
                          title: "Atvykimas užfiksuotas",
                          text: attendance.employer_check_in_at
                            ? "Darbdavys taip pat patvirtino jūsų atvykimą. Po darbo pabaigos reikės uždaryti dieną."
                            : "Jūsų atvykimas sistemoje užfiksuotas. Darbdavys gali jį papildomai patvirtinti.",
                        }
                      : isConfirmed && !hasStarted
                      ? {
                          tone: "",
                          title: "Laukiama darbo pradžios",
                          text: "„Atvykau“ galėsite paspausti tik prasidėjus darbui.",
                        }
                      : null;

                  if (!recentOrActive) return null;

                  return (
                    <div
                      className="wd-workday"
                      key={item.id}
                      id={`worker-workday-${job.id}`}
                    >
                      <div>
                        <div className="wd-workday-head">
                          <MonthlyAwardMiniList
                            awards={companyAwardsById[job.company_id] || []}
                            size={52}
                          />
                          <CompanyBadge
                            name={item.companyName}
                            avatarPath={item.companyAvatarPath}
                            size={52}
                            fontSize={18}
                          />
                          <div className="wd-workday-head-main">
                            <div className="wd-workday-title"><h3>{formatJobTitle(job.title)}</h3><span className={`wd-workday-phase ${workdayPhase.tone}`}>{workdayPhase.label}</span></div>
                            <div className="wd-workday-meta">
                              <div className="wd-company-meta-line">
                                <b>{item.companyName}</b>
                                {job.pay_amount
                                  ? ` · ${formatNetPay(job.pay_amount, job.pay_unit)}`
                                  : ""}
                                {" · "}
                                {job.work_date} · {job.start_time?.slice(0, 5)}
                                {job.end_time ? `–${job.end_time.slice(0, 5)}` : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        {hasJobInformationUpdate && (
                          <span className="wd-workday-status orange" style={{ marginTop: 10 }}>
                            Darbo informacija pasikeitė · atidarykite ir peržiūrėkite
                          </span>
                        )}

                        {item.status === "cancelled_by_employer" && (
                          <div className="wd-note err" style={{ marginTop: 10 }}>
                            <b>Darbdavys atšaukė darbą.</b>
                            <div style={{ marginTop: 4 }}>
                              Priežastis: {item.cancellation_reason || job.cancellation_reason || "Priežastis nenurodyta."}
                            </div>
                          </div>
                        )}

                        {attendance.finalized_at && (
                          <span
                            className={`wd-workday-status ${
                              attendance.final_outcome === "no_show" ||
                              attendance.final_outcome === "left_early_unexcused"
                                ? "red"
                                : "green"
                            }`}
                          >
                            {attendanceOutcomeLabel(attendance)}
                            {attendance.worked_minutes > 0
                              ? ` · ${formatWorkedMinutes(attendance.worked_minutes)}`
                              : ""}
                          </span>
                        )}

                        {!attendance.finalized_at && disputed && (
                          <span className="wd-workday-status red">
                            Ginčas pateiktas · reitingas nekeičiamas
                          </span>
                        )}

                        {!attendance.finalized_at &&
                          pendingNegative &&
                          !disputed && (
                            <div style={{ marginTop: 10 }}>
                              <span className="wd-workday-status orange">
                                Darbdavys pažymėjo: {attendanceOutcomeLabel(attendance)}
                              </span>
                              {attendance.employer_note && (
                                <div
                                  style={{
                                    marginTop: 7,
                                    color: "#6c7a88",
                                    fontSize: 13,
                                  }}
                                >
                                  Darbdavio paaiškinimas: {attendance.employer_note}
                                </div>
                              )}
                              {attendance.worker_check_in_at && (
                                <div
                                  style={{
                                    marginTop: 7,
                                    color: "#167a54",
                                    fontSize: 13,
                                    fontWeight: 700,
                                  }}
                                >
                                  Sistema turi jūsų „Atvykau“ pažymėjimą.
                                </div>
                              )}
                            </div>
                          )}

                        {needsClose &&
                          attendance.worker_workday_claim === "worked" && (
                            <span className="wd-workday-status orange">
                              Pažymėjote, kad dirbote · laukiama darbdavio patvirtinimo
                            </span>
                          )}

                        {needsClose &&
                          attendance.worker_workday_claim !== "worked" && (
                            <span className="wd-workday-status orange">
                              Neuždaryta darbo diena · reikia veiksmo
                            </span>
                          )}

                        {attendance.worker_check_in_at &&
                          !attendance.finalized_at &&
                          !pendingNegative && (
                            <div
                              style={{
                                marginTop: 7,
                                color: "#167a54",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              ✓ Atvykimą pažymėjote{" "}
                              {new Date(attendance.worker_check_in_at).toLocaleTimeString(
                                "lt-LT",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          )}
                        {attendance.employer_check_in_at &&
                          !attendance.finalized_at && (
                            <div
                              style={{
                                marginTop: 7,
                                color: "#167a54",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              ✓ Darbdavys patvirtino jūsų atvykimą{" "}
                              {new Date(
                                attendance.employer_check_in_at
                              ).toLocaleTimeString("lt-LT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}

                        {workdayNextStep && (
                          <div
                            className={`wd-next-step ${
                              workdayNextStep.tone || ""
                            }`}
                          >
                            <b>{workdayNextStep.title}</b>
                            {workdayNextStep.text}
                          </div>
                        )}
                      </div>

                      <div className="wd-workday-actions">
                        <button
                          className="wd-decline"
                          type="button"
                          onClick={() => openWorkdayDetails(item)}
                          style={hasJobInformationUpdate ? { background: "#fff3e7", borderColor: "#efb77b", color: "#a85810" } : undefined}
                        >
                          {hasJobInformationUpdate ? "Atidaryti · atnaujinta" : "Atidaryti"}
                        </button>

                        {item.invitation_id && (
                          <button
                            className={`wd-decline wd-workday-chat ${
                              unreadWorkerNotifications(item.invitation_id).some(
                                (notification) => notification.event_type === "message"
                              )
                                ? "has-unread"
                                : ""
                            }`}
                            type="button"
                            onClick={() =>
                              setConversation({
                                invitationId: item.invitation_id,
                                title: `${item.companyName} · ${formatJobTitle(job.title)}`,
                              })
                            }
                          >
                            Privati žinutė
                            {unreadWorkerNotifications(item.invitation_id).filter(
                              (notification) => notification.event_type === "message"
                            ).length > 0 && (
                              <span className="wd-chat-count">
                                {Math.min(
                                  9,
                                  unreadWorkerNotifications(item.invitation_id).filter(
                                    (notification) => notification.event_type === "message"
                                  ).length
                                )}
                              </span>
                            )}
                          </button>
                        )}

                        {["confirmed", "completed", "no_show"].includes(
                          item.status
                        ) && (
                          <button
                            className={`wd-decline wd-workday-chat ${
                              unreadWorkerJobNotifications(job.id).some(
                                (item) => item.event_type === "message"
                              )
                                ? "has-unread"
                                : ""
                            }`}
                            type="button"
                            onClick={() => openWorkerGroupConversation(job)}
                          >
                            Darbo pokalbis
                            {unreadWorkerJobNotifications(job.id).filter(
                              (item) => item.event_type === "message"
                            ).length > 0 && (
                              <span className="wd-chat-count">
                                {Math.min(
                                  9,
                                  unreadWorkerJobNotifications(job.id).filter(
                                    (item) => item.event_type === "message"
                                  ).length
                                )}
                              </span>
                            )}
                          </button>
                        )}

                        {canCheckIn && (
                          <>
                            <button
                              className="wd-accept"
                              disabled={attendanceBusy}
                              onClick={() => openWorkerCheckIn(item)}
                            >
                              Atvykau
                            </button>
                            <button
                              className="wd-decline"
                              type="button"
                              onClick={() => openArrivalHelp(item)}
                            >
                              Atvykau, bet nerandu
                            </button>
                          </>
                        )}

                        {pendingNegative && !disputed && (
                          <>
                            <button
                              className="wd-accept"
                              disabled={attendanceBusy}
                              onClick={() =>
                                workerRespondAttendance(
                                  attendance.id,
                                  "confirmed"
                                )
                              }
                            >
                              Patvirtinti
                            </button>
                            <button
                              className="wd-danger"
                              disabled={attendanceBusy}
                              onClick={() => {
                                setWorkerAttendanceTarget(item);
                                setWorkerAttendanceMode("dispute");
                                setWorkerAttendanceNote("");
                                setWorkerEvidenceFile(null);
                              }}
                            >
                              Ginčyti
                            </button>
                          </>
                        )}

                        {disputed && attendance.id && (
                          <>
                            <button
                              className="wd-decline"
                              disabled={attendanceBusy}
                              onClick={() => {
                                setWorkerAttendanceTarget(item);
                                setWorkerAttendanceMode("dispute");
                                setWorkerAttendanceNote(
                                  attendance.worker_response_note?.startsWith(
                                    "Automatinis ginčas:"
                                  )
                                    ? ""
                                    : attendance.worker_response_note || ""
                                );
                                setWorkerEvidenceFile(null);
                              }}
                            >
                              Papildyti ginčą
                            </button>

                            {attendance.employer_note?.trim() &&
                              attendance.worker_response_note?.trim() && (
                                <button
                                  className="wd-decline"
                                  type="button"
                                  onClick={() =>
                                    setDisputeConversation({
                                      attendanceId: attendance.id,
                                      title: `${formatJobTitle(job.title)} · Ginčo aptarimas`,
                                      workerName: form.displayName || "Darbuotojas",
                                      companyName: item.companyName || "Darbdavys",
                                    })
                                  }
                                >
                                  Ginčo pokalbis
                                </button>
                              )}
                          </>
                        )}

                        {needsClose &&
                          attendance.worker_workday_claim !== "worked" && (
                            <>
                              <button
                                className="wd-accept"
                                disabled={attendanceBusy}
                                onClick={() =>
                                  workerClaimWorkday(item.id, "worked")
                                }
                              >
                                Dirbau šiame darbe
                              </button>
                              <button
                                className="wd-danger"
                                disabled={attendanceBusy}
                                onClick={() => {
                                  setWorkerAttendanceTarget(item);
                                  setWorkerAttendanceMode("self_no_show");
                                  setWorkerAttendanceNote("");
                                  setWorkerEvidenceFile(null);
                                }}
                              >
                                Neatvykau
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <DashboardPagination
                page={workerActivePage}
                totalItems={activeWorkerWorkdays.length}
                onPageChange={setWorkerActivePage}
              />
              </>
            ) : (
              <div className="wd-empty-friendly">
                <div className="wd-empty-friendly-icon">✓</div>
                <div>
                  <b>Aktyvių darbų nėra</b>
                  Kai priimsite darbo kvietimą arba turėsite artėjantį darbą, jis bus rodomas čia.
                </div>
              </div>
            )}
          </section>

          <section className="wd-card" id="worker-job-history">
            <div className="wd-history-section-head">
              <h2>Darbų istorija</h2>
              {isPhoneLayout && workerWorkHistory.length > 0 && (
                <span className="wd-history-section-count">
                  {safeWorkerHistoryMobileIndex + 1} / {workerHistoryMobileTotal}
                </span>
              )}
            </div>

            {workerWorkHistory.length ? (
              isPhoneLayout ? (
                <div className="wd-history-mobile">
                  <div className="wd-history-carousel-head">
                    <div className="wd-history-carousel-copy">
                      <b>Paskutinis darbas</b>
                      <span>Perjunkite rodyklėmis ankstesnius darbus.</span>
                    </div>
                    <div className="wd-history-nav">
                      <button
                        type="button"
                        aria-label="Rodyti naujesnį darbą"
                        onClick={() =>
                          setWorkerHistoryMobileIndex((current) =>
                            (current - 1 + workerHistoryMobileTotal) %
                            workerHistoryMobileTotal
                          )
                        }
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label="Rodyti senesnį darbą"
                        onClick={() =>
                          setWorkerHistoryMobileIndex((current) =>
                            (current + 1) % workerHistoryMobileTotal
                          )
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {workerHistoryMobileItem ? (
                    renderWorkerHistoryCard(workerHistoryMobileItem, "history-mobile")
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="wd-workdays wd-history-desktop">
                    {pagedWorkerWorkHistory.map((item) =>
                      renderWorkerHistoryCard(item)
                    )}
                  </div>
                  <DashboardPagination
                    page={workerHistoryPage}
                    totalItems={workerWorkHistory.length}
                    onPageChange={setWorkerHistoryPage}
                  />
                </>
              )
            ) : (
              <div className="wd-empty-friendly">
                <div className="wd-empty-friendly-icon">✓</div>
                <div>
                  <b>Darbų istorijos dar nėra</b>
                  Kai darbas bus užbaigtas arba atšauktas, jis bus rodomas čia.
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {workdayDetailsTarget && (
        <div
          className="wd-job-info-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setWorkdayDetailsTarget(null);
            }
          }}
        >
          <div className="wd-job-info-modal">
            <style>{`
              .wd-job-info-overlay{position:fixed;inset:0;z-index:9650;background:rgba(16,36,56,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
              .wd-job-info-modal{width:min(780px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 30px 100px rgba(16,36,56,.30);color:#102438}
              .wd-job-info-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 24px 18px;border-bottom:1px solid #e8eef2;background:#fff}.wd-job-info-head h2{margin:7px 0 0;font-family:Manrope,Inter,sans-serif;font-size:26px;line-height:1.2}
              .wd-job-info-close{width:44px;height:44px;border:0;border-radius:12px;background:#f2f5f7;color:#102438;display:grid;place-items:center;cursor:pointer;flex:0 0 44px}
              .wd-job-info-scroll{overflow:auto;padding:18px 24px 22px;scrollbar-width:thin;scrollbar-color:#aab4bc transparent}.wd-job-info-scroll::-webkit-scrollbar{width:8px}.wd-job-info-scroll::-webkit-scrollbar-track{background:transparent}.wd-job-info-scroll::-webkit-scrollbar-thumb{background:#aab4bc;border-radius:999px;border:2px solid #fff}.wd-job-info-grid{display:grid;gap:12px}.wd-job-info-grid>*{min-width:0}
              @media(min-width:761px){.wd-job-info-modal{width:min(720px,100%)}.wd-job-info-head{padding:18px 20px 14px}.wd-job-info-head h2{font-size:23px}.wd-job-info-scroll{padding:14px 18px 18px}.wd-job-info-grid{gap:10px;margin-bottom:14px}}
              @media(max-width:620px){.wd-job-info-overlay{padding:10px}.wd-job-info-modal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:18px}.wd-job-info-head{padding:17px}.wd-job-info-scroll{padding:15px 17px 18px}.wd-job-info-head h2{font-size:22px}}
            `}</style>
            <div className="wd-job-info-head">
              <div>
                <div className="eyebrow">DARBO INFORMACIJA</div>
                <h2>{formatJobTitle(workdayDetailsTarget.job?.title)}</h2>
              </div>
              <button
                className="wd-job-info-close"
                type="button"
                onClick={() => setWorkdayDetailsTarget(null)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="wd-job-info-scroll">
            <div
              className="wd-job-info-grid"
              style={{
                display: "grid",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                  background: "#f8fafb",
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Darbdavys
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  <MonthlyAwardMiniList
                    awards={
                      companyAwardsById[workdayDetailsTarget.job?.company_id] || []
                    }
                    size={42}
                  />
                  <CompanyBadge
                    name={workdayDetailsTarget.companyName || "Darbdavys"}
                    avatarPath={workdayDetailsTarget.companyAvatarPath}
                    size={42}
                    fontSize={15}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b style={{ display: "block", fontSize: 17 }}>
                      {workdayDetailsTarget.companyName || "Darbdavys"}
                    </b>
                  </div>
                </div>
              </div>

              {workdayDetailsTarget.companyReliability !== undefined && (
                <div
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 12 }}>
                    Darbdavio patikimumas
                  </div>
                  <b
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: reliabilityScoreColor(
                        workdayDetailsTarget.companyReliability
                      ),
                    }}
                  >
                    {Math.round(
                      Number(workdayDetailsTarget.companyReliability || 0)
                    )}{" "}
                    / 100
                  </b>
                  {Number(
                    workdayDetailsTarget.companyCancelledConfirmed || 0
                  ) > 0 && (
                    <div
                      style={{
                        color: "#6c7a88",
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      Atšauktų jau patvirtintų darbų:{" "}
                      {Number(
                        workdayDetailsTarget.companyCancelledConfirmed || 0
                      )}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 12 }}>
                    Data ir laikas
                  </div>
                  <b style={{ display: "block", marginTop: 4 }}>
                    {workdayDetailsTarget.job?.work_date} ·{" "}
                    {workdayDetailsTarget.job?.start_time?.slice(0, 5)}
                    {workdayDetailsTarget.job?.end_time
                      ? `–${workdayDetailsTarget.job.end_time.slice(0, 5)}`
                      : ""}
                  </b>
                </div>

                <div
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 12 }}>
                    Atlygis
                  </div>
                  <b style={{ display: "block", marginTop: 4 }}>
                    {workdayDetailsTarget.job?.pay_amount
                      ? formatNetPay(
                          workdayDetailsTarget.job.pay_amount,
                          workdayDetailsTarget.job.pay_unit
                        )
                      : "Nenurodytas"}
                  </b>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Atvykti adresu
                </div>
                <b style={{ display: "block", marginTop: 4 }}>
                  {workdayDetailsTarget.job?.address_text ||
                    workdayDetailsTarget.job?.city ||
                    "Atvykimo adresas nenurodytas"}
                </b>
              </div>

              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Pietų pertrauka
                </div>
                <b style={{ display: "block", marginTop: 4 }}>
                  {workdayDetailsTarget.job?.break_start_time &&
                  workdayDetailsTarget.job?.break_end_time
                    ? `${workdayDetailsTarget.job.break_start_time.slice(0, 5)}–${workdayDetailsTarget.job.break_end_time.slice(0, 5)}`
                    : "Nėra"}
                </b>
              </div>

              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Atvykimas į darbo vietą
                </div>
                <b style={{ display: "block", marginTop: 4 }}>
                  {workdayDetailsTarget.job?.transport_mode ===
                  "employer_pickup"
                    ? "Darbdavys paima darbuotoją"
                    : "Darbuotojas atvyksta pats"}
                </b>
              </div>

              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Darbo kontakto telefono numeris
                </div>

                {workdayDetailsTarget.companyPhone ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 5,
                    }}
                  >
                    <b>{workdayDetailsTarget.companyPhone}</b>
                    <button
                      className="wd-decline"
                      type="button"
                      onClick={() =>
                        copyPhoneNumber(workdayDetailsTarget.companyPhone)
                      }
                    >
                      Kopijuoti numerį
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 5, color: "#6c7a88" }}>
                    Telefono numeris nenurodytas.
                  </div>
                )}
              </div>

              <div
                style={{
                  border: "1px solid #e4ebf0",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ color: "#6c7a88", fontSize: 12 }}>
                  Darbo aprašymas
                </div>
                <div
                  style={{
                    marginTop: 6,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {workdayDetailsTarget.job?.description?.trim() ||
                    "Darbdavys papildomo darbo aprašymo nepateikė."}
                </div>
              </div>

              {["resolved_worker", "resolved_employer"].includes(
                workdayDetailsTarget.attendance?.dispute_status
              ) && (
                <div
                  style={{
                    border: `1px solid ${
                      workdayDetailsTarget.attendance?.dispute_status ===
                      "resolved_worker"
                        ? "#b9dfcd"
                        : "#efc5c5"
                    }`,
                    borderRadius: 16,
                    padding: 14,
                    background:
                      workdayDetailsTarget.attendance?.dispute_status ===
                      "resolved_worker"
                        ? "#f4fbf7"
                        : "#fff6f6",
                  }}
                >
                  <div
                    style={{
                      color:
                        workdayDetailsTarget.attendance?.dispute_status ===
                        "resolved_worker"
                          ? "#167a54"
                          : "#b64242",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    GINČO SPRENDIMAS · {
                      workdayDetailsTarget.attendance?.dispute_status ===
                      "resolved_worker"
                        ? "JŪSŲ NAUDAI"
                        : "NE JŪSŲ NAUDAI"
                    }
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      color: "#102438",
                    }}
                  >
                    {workdayDetailsTarget.attendance?.resolution_note?.trim() ||
                      "Administratorius papildomo komentaro nepateikė."}
                  </div>
                </div>
              )}

              {(workdayDetailsTarget.job?.status === "cancelled" ||
                workdayDetailsTarget.status === "cancelled_by_employer") && (
                <div
                  style={{
                    border: "1px solid #f2c7bd",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff5f2",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#b64d2a",
                      marginBottom: 8,
                    }}
                  >
                    Atšaukimo priežastis
                  </div>

                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #efc0b5",
                      borderRadius: 14,
                      padding: 11,
                      color: "#102438",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {workdayDetailsTarget.cancellation_reason?.trim() ||
                      workdayDetailsTarget.job?.cancellation_reason?.trim() ||
                      "Priežastis nenurodyta."}
                  </div>
                </div>
              )}

              {workdayDetailsTarget.companyReviews?.length > 0 && (
                <div
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                    background: "#f8fafb",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#102438",
                      marginBottom: 8,
                    }}
                  >
                    Darbuotojų atsiliepimai apie darbdavį
                  </div>

                  <div style={{ display: "grid", gap: 9 }}>
                    {workdayDetailsTarget.companyReviews.map((review) => (
                      <div
                        key={review.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e4ebf0",
                          borderRadius: 14,
                          padding: 11,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 5,
                          }}
                        >
                          <b>{review.score} / 10</b>
                          <span
                            style={{
                              color: "#7a8996",
                              fontSize: 11,
                            }}
                          >
                            {review.work_date || ""}
                          </span>
                        </div>
                        <div
                          style={{
                            color: "#6c7a88",
                            fontSize: 11,
                            marginBottom: 5,
                          }}
                        >
                          {formatJobTitle(review.job_title)}
                        </div>
                        <div
                          style={{
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {review.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="wd-job-info-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {workdayDetailsTarget.status === "pending" && (
                <>
                  <button
                    className="wd-decline"
                    type="button"
                    disabled={
                      respondingInvitation === workdayDetailsTarget.id
                    }
                    onClick={async () => {
                      const invitationId = workdayDetailsTarget.id;
                      setWorkdayDetailsTarget(null);
                      await respondToInvitation(invitationId, "declined");
                    }}
                  >
                    Atmesti
                  </button>

                  <button
                    className="wd-accept"
                    type="button"
                    disabled={
                      respondingInvitation === workdayDetailsTarget.id ||
                      invitationHasConflict(workdayDetailsTarget) ||
                      (metrics.restrictedUntil &&
                        new Date(metrics.restrictedUntil) > new Date())
                    }
                    onClick={() => {
                      const invitation = workdayDetailsTarget;
                      setWorkdayDetailsTarget(null);
                      setCommitmentChecked(false);
                      setConfirmInvitation(invitation);
                    }}
                  >
                    {invitationHasConflict(workdayDetailsTarget)
                      ? "Laikas užimtas"
                      : "Priimti darbą"}
                  </button>
                </>
              )}

              {!workerWorkdayChatIsClosed(workdayDetailsTarget) &&
                workdayDetailsTarget.invitation_id && (
                  <button
                    className={`wd-decline wd-workday-chat ${
                      unreadWorkerNotifications(workdayDetailsTarget.invitation_id).filter(
                        (notification) => notification.event_type === "message"
                      ).length > 0
                        ? "has-unread"
                        : ""
                    }`}
                    type="button"
                    onClick={() => {
                      const target = workdayDetailsTarget;
                      setWorkdayDetailsTarget(null);
                      setConversation({
                        invitationId: target.invitation_id,
                        title: `${target.companyName} · ${formatJobTitle(target.job?.title)}`,
                      });
                    }}
                  >
                    Privati žinutė
                    {unreadWorkerNotifications(workdayDetailsTarget.invitation_id).filter(
                      (notification) => notification.event_type === "message"
                    ).length > 0 && (
                      <span className="wd-chat-count">
                        {Math.min(
                          9,
                          unreadWorkerNotifications(workdayDetailsTarget.invitation_id).filter(
                            (notification) => notification.event_type === "message"
                          ).length
                        )}
                      </span>
                    )}
                  </button>
                )}

              {!workerWorkdayChatIsClosed(workdayDetailsTarget) &&
                ["confirmed", "completed", "no_show"].includes(
                  workdayDetailsTarget.status
                ) && (
                  <button
                    className={`wd-decline wd-workday-chat ${
                      unreadWorkerJobNotifications(workdayDetailsTarget.job?.id).filter(
                        (item) => item.event_type === "message"
                      ).length > 0
                        ? "has-unread"
                        : ""
                    }`}
                    type="button"
                    onClick={() => {
                      const job = workdayDetailsTarget.job;
                      setWorkdayDetailsTarget(null);
                      openWorkerGroupConversation(job);
                    }}
                  >
                    Darbo pokalbis
                    {unreadWorkerJobNotifications(workdayDetailsTarget.job?.id).filter(
                      (item) => item.event_type === "message"
                    ).length > 0 && (
                      <span className="wd-chat-count">
                        {Math.min(
                          9,
                          unreadWorkerJobNotifications(workdayDetailsTarget.job?.id).filter(
                            (item) => item.event_type === "message"
                          ).length
                        )}
                      </span>
                    )}
                  </button>
                )}

              <button
                className="wd-decline"
                type="button"
                onClick={async () => {
                  const target = workdayDetailsTarget;
                  setWorkdayDetailsTarget(null);
                  await openWorkerCompanyProfile(target);
                }}
              >
                Įmonės profilis
              </button>

              <button
                className="wd-decline"
                type="button"
                onClick={() => setWorkdayDetailsTarget(null)}
              >
                Uždaryti
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {workerCompanyProfileTarget && (
        <div
          className="wd-job-info-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !workerCompanyProfileLoading) {
              setWorkerCompanyProfileTarget(null);
            }
          }}
        >
          <div className="wd-job-info-modal wd-company-profile-modal">
            <style>{`
              .wd-job-info-overlay{position:fixed;inset:0;z-index:9650;background:rgba(16,36,56,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
              .wd-job-info-modal{width:min(780px,100%);max-height:calc(100dvh - 40px);display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 30px 100px rgba(16,36,56,.30);color:#102438}
              .wd-company-profile-modal{width:min(860px,100%)}
              .wd-job-info-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 24px 18px;border-bottom:1px solid #e8eef2;background:#fff}
              .wd-job-info-head h2{margin:7px 0 0;font-family:Manrope,Inter,sans-serif;font-size:26px;line-height:1.2}
              .wd-job-info-close{width:44px;height:44px;border:0;border-radius:12px;background:#f2f5f7;color:#102438;display:grid;place-items:center;cursor:pointer;flex:0 0 44px}
              .wd-job-info-close:hover{background:#e9eef2}
              .wd-job-info-scroll{overflow:auto;padding:18px 24px 22px;scrollbar-width:thin;scrollbar-color:#aab4bc transparent}
              .wd-job-info-scroll::-webkit-scrollbar{width:8px}
              .wd-job-info-scroll::-webkit-scrollbar-track{background:transparent}
              .wd-job-info-scroll::-webkit-scrollbar-thumb{background:#aab4bc;border-radius:999px;border:2px solid #fff}
              @media(max-width:620px){.wd-job-info-overlay{padding:10px}.wd-job-info-modal,.wd-company-profile-modal{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);border-radius:18px}.wd-job-info-head{padding:17px}.wd-job-info-scroll{padding:15px 17px 18px}.wd-job-info-head h2{font-size:22px}}
            `}</style>
            <div className="wd-job-info-head">
              <div>
                <div className="eyebrow">DARBDAVIO PROFILIS</div>
                <h2>{workerCompanyProfileTarget.name || "Darbdavys"}</h2>
              </div>
              <button
                className="wd-job-info-close"
                type="button"
                onClick={() => setWorkerCompanyProfileTarget(null)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="wd-job-info-scroll">
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  className="wd-company-profile-identity"
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                    background: "#f8fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <MonthlyAwardMiniList
                      awards={workerCompanyProfileTarget.awards || []}
                      size={54}
                    />
                    <CompanyBadge
                      name={workerCompanyProfileTarget.name || "Darbdavys"}
                      avatarPath={workerCompanyProfileTarget.avatarPath}
                      size={54}
                      fontSize={18}
                    />
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: "block", fontSize: 19 }}>
                        {workerCompanyProfileTarget.name || "Darbdavys"}
                      </b>
                      <div style={{ color: "#6c7a88", marginTop: 4 }}>
                        {workerCompanyProfileTarget.city || "Miestas nenurodytas"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="wd-company-profile-metrics"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                    gap: 10,
                  }}
                >
                  <div className="wd-company-profile-metric" style={{ border: "1px solid #e4ebf0", borderRadius: 16, padding: 14 }}>
                    <div style={{ color: "#6c7a88", fontSize: 12 }}>Įvykdyti darbai</div>
                    <b style={{ display: "block", marginTop: 4, fontSize: 20 }}>
                      {Number(workerCompanyProfileTarget.completedJobs || 0)}
                    </b>
                  </div>

                  <div className="wd-company-profile-metric" style={{ border: "1px solid #e4ebf0", borderRadius: 16, padding: 14 }}>
                    <div style={{ color: "#6c7a88", fontSize: 12 }}>Atšaukti darbai</div>
                    <b style={{ display: "block", marginTop: 4, fontSize: 20 }}>
                      {Number(workerCompanyProfileTarget.cancelledJobs || 0)}
                    </b>
                  </div>

                  <div className="wd-company-profile-metric" style={{ border: "1px solid #e4ebf0", borderRadius: 16, padding: 14 }}>
                    <div style={{ color: "#6c7a88", fontSize: 12 }}>Darbdavio patikimumas</div>
                    <b
                      style={{
                        display: "block",
                        marginTop: 4,
                        fontSize: 20,
                        color: reliabilityScoreColor(workerCompanyProfileTarget.reliabilityRate),
                      }}
                    >
                      {Math.round(Number(workerCompanyProfileTarget.reliabilityRate || 0))} / 100
                    </b>
                  </div>
                </div>

                {!!workerCompanyProfileTarget.description && (
                  <div style={{ border: "1px solid #e4ebf0", borderRadius: 16, padding: 14 }}>
                    <div style={{ color: "#6c7a88", fontSize: 12 }}>Darbdavio aprašymas</div>
                    <div style={{ marginTop: 6, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {workerCompanyProfileTarget.description}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    border: "1px solid #e4ebf0",
                    borderRadius: 16,
                    padding: 14,
                    background: "#f8fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#102438" }}>
                      Darbuotojų atsiliepimai apie įmonę
                    </div>
                    {Number(workerCompanyProfileTarget.reviewCount || 0) > 0 && (
                      <span style={{ color: "#6c7a88", fontSize: 12, fontWeight: 700 }}>
                        {workerCompanyProfileTarget.reviewAverage !== null
                          ? `${Number(workerCompanyProfileTarget.reviewAverage).toFixed(1)} / 10 · `
                          : ""}
                        {Number(workerCompanyProfileTarget.reviewCount || 0)} atsiliep.
                      </span>
                    )}
                  </div>

                  {workerCompanyProfileTarget.reviews?.length > 0 ? (
                    <div style={{ display: "grid", gap: 9 }}>
                      {workerCompanyProfileTarget.reviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          style={{
                            background: "#fff",
                            border: "1px solid #e4ebf0",
                            borderRadius: 14,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              flexWrap: "wrap",
                              marginBottom: 6,
                            }}
                          >
                            <div>
                              <b style={{ display: "block", color: "#102438" }}>
                                {review.worker_name || "Darbuotojas"}
                              </b>
                              <span style={{ color: "#7a8996", fontSize: 11 }}>
                                {review.created_at
                                  ? new Date(review.created_at).toLocaleDateString("lt-LT")
                                  : review.work_date || ""}
                              </span>
                            </div>
                            <b style={{ color: "#102438" }}>{review.score} / 10</b>
                          </div>

                          {!!review.job_title && (
                            <div
                              style={{
                                color: "#6c7a88",
                                fontSize: 11,
                                marginBottom: 6,
                              }}
                            >
                              Darbas: {formatJobTitle(review.job_title)}
                            </div>
                          )}

                          <div
                            style={{
                              lineHeight: 1.5,
                              whiteSpace: "pre-wrap",
                              color: "#24384a",
                            }}
                          >
                            {review.comment || "Atsiliepimas be komentaro."}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#6c7a88", fontSize: 13 }}>
                      Darbuotojų atsiliepimų apie šią įmonę dar nėra.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <button
                  className="wd-decline"
                  type="button"
                  onClick={() => setWorkerCompanyProfileTarget(null)}
                >
                  Uždaryti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUrgentAvailability && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !urgentSaving) {
              setShowUrgentAvailability(false);
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">LAISVAS DABAR</div>
                <h2>
                  {urgentAvailabilityIsActive()
                    ? "„Laisvas dabar“ įjungta"
                    : "„Laisvas dabar“ išjungta"}
                </h2>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #f0d1b2",
                background: "#fffaf5",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                color: "#526374",
                lineHeight: 1.5,
                fontSize: 13,
              }}
            >
              {urgentAvailabilityIsActive() ? (
                <>
                  Režimas įjungtas. Darbdaviai, ieškantys darbuotojo jūsų
                  profilyje nurodytame mieste, gali matyti jūsų vardą ir telefono
                  numerį, kol režimą išjungsite.
                </>
              ) : (
                <>
                  Režimas išjungtas. Darbdaviai „Skubiai!“ paieškoje nemato jūsų
                  telefono numerio. Įjunkite tik tada, kai šiuo metu realiai
                  laukiate skubaus darbo.
                </>
              )}
            </div>

            {hasCurrentScheduledWork() && !urgentAvailabilityIsActive() && (
              <div className="wd-note err" style={{ marginBottom: 14 }}>
                Dabar turite patvirtintą darbą. „Laisvas dabar“ galėsite įjungti
                pasibaigus suplanuotam darbo laikui.
              </div>
            )}

            <button
              className={urgentAvailabilityIsActive() ? "wd-decline" : "wd-urgent-btn"}
              type="button"
              disabled={
                urgentSaving ||
                (!urgentAvailabilityIsActive() && hasCurrentScheduledWork())
              }
              onClick={
                urgentAvailabilityIsActive()
                  ? disableUrgentAvailability
                  : enableUrgentAvailability
              }
              style={{
                width: "100%",
                minHeight: 48,
                marginTop: 2,
                fontSize: 14,
                fontWeight: 850,
              }}
            >
              {urgentSaving
                ? "Saugoma..."
                : urgentAvailabilityIsActive()
                ? "Išjungti"
                : "Įjungti"}
            </button>
          </div>
        </div>
      )}

      {employerReviewTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !employerReviewSaving) {
              setEmployerReviewTarget(null);
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">ATSILIEPIMAS APIE DARBDAVĮ</div>
                <h2>Jūs laimėjote ginčą</h2>
              </div>
              <button
                className="rs-close"
                type="button"
                disabled={employerReviewSaving}
                onClick={() => setEmployerReviewTarget(null)}
              >
                <CloseMark />
              </button>
            </div>

            <ReviewConductNotice />

            <div
              style={{
                background: "#fffaf5",
                border: "1px solid #f0d1b2",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              <b>{employerReviewTarget.company_name}</b>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                {formatJobTitle(employerReviewTarget.job_title)} ·{" "}
                {employerReviewTarget.work_date}
              </div>
              <div style={{ marginTop: 8, color: "#526374" }}>
                Ginčas oficialiai išspręstas jūsų naudai. Galite pasidalinti
                savo patirtimi, kad kiti darbuotojai turėtų daugiau informacijos
                prieš priimdami šios įmonės darbo pasiūlymą.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <b>Įvertinimas</b>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(10, minmax(34px,1fr))",
                  gap: 6,
                  marginTop: 9,
                }}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setEmployerReviewScore(score)}
                      style={{
                        border:
                          employerReviewScore === score
                            ? "1px solid #f08a28"
                            : "1px solid #dbe4ea",
                        background:
                          employerReviewScore === score ? "#fff3e7" : "#fff",
                        color: "#102438",
                        borderRadius: 9,
                        minHeight: 40,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {score}
                    </button>
                  )
                )}
              </div>
            </div>

            <label style={{ display: "grid", gap: 7, fontWeight: 700 }}>
              Atsiliepimas *
              <textarea
                className="wd-textarea"
                maxLength={1500}
                value={employerReviewComment}
                onChange={(e) => setEmployerReviewComment(e.target.value)}
                placeholder="Trumpai ir konkrečiai aprašykite, kas nutiko ir ką kiti darbuotojai turėtų žinoti."
                style={{ minHeight: 120 }}
              />
              <span
                style={{
                  color: "#7a8996",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {employerReviewComment.trim().length}/1500 · mažiausiai 10
                simbolių
              </span>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 18,
              }}
            >
              <button
                className="wd-decline"
                type="button"
                disabled={employerReviewSaving}
                onClick={() => setEmployerReviewTarget(null)}
              >
                Vėliau
              </button>
              <button
                className="wd-accept"
                type="button"
                disabled={
                  employerReviewSaving ||
                  !employerReviewScore ||
                  employerReviewComment.trim().length < 10
                }
                onClick={submitEmployerReview}
              >
                {employerReviewSaving
                  ? "Skelbiama..."
                  : "Paskelbti atsiliepimą"}
              </button>
            </div>
          </div>
        </div>
      )}

      {arrivalHelpTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setArrivalHelpTarget(null);
            }
          }}
        >
          <div className="rs-modal-card" role="dialog" aria-modal="true" aria-label="Pagalba atvykus">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">PAGALBA ATVYKUS</div>
                <h2>Atvykau, bet nerandu darbdavio</h2>
              </div>
              <button
                className="rs-close"
                type="button"
                aria-label="Uždaryti atvykimo pagalbą"
                onClick={() => setArrivalHelpTarget(null)}
              >
                <CloseMark />
              </button>
            </div>

            {error && <div className="wd-note err" role="alert">{error}</div>}
            {notice && <div className="wd-note ok" role="status">{notice}</div>}

            <div
              style={{
                background: "#f6f8fa",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <b>{arrivalHelpTarget.companyName}</b>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                {formatJobTitle(arrivalHelpTarget.job?.title)} · {arrivalHelpTarget.job?.work_date}
              </div>
              <div style={{ color: "#6c7a88", marginTop: 4 }}>
                Atvykti adresu: {arrivalHelpTarget.job?.address_text || "Atvykimo adresas nenurodytas"}
              </div>
            </div>

            <div className="wd-note ok" style={{ marginBottom: 16 }}>
              Jei jau esate vietoje, pirmiausia parašykite žinutę darbdaviui.
              Jei reikia, galite nukopijuoti jo telefono numerį ir susisiekti tiesiogiai.
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
              <button
                className="wd-accept"
                type="button"
                onClick={() => {
                  setArrivalHelpTarget(null);
                  setConversation({
                    invitationId: arrivalHelpTarget.invitation_id,
                    title: `${arrivalHelpTarget.companyName} · ${formatJobTitle(arrivalHelpTarget.job?.title)}`,
                  });
                }}
              >
                Rašyti žinutę darbdaviui
              </button>

              {arrivalHelpTarget.companyPhone ? (
                <div
                  style={{
                    border: "1px solid #dbe4ea",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ color: "#6c7a88", fontSize: 13, marginBottom: 6 }}>
                    Darbo kontakto telefono numeris
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <b style={{ fontSize: 18 }}>{arrivalHelpTarget.companyPhone}</b>
                    <button
                      className="wd-decline"
                      type="button"
                      onClick={() => copyPhoneNumber(arrivalHelpTarget.companyPhone)}
                    >
                      Kopijuoti numerį
                    </button>
                  </div>
                </div>
              ) : (
                <div className="wd-note err" style={{ marginBottom: 0 }}>
                  Šiuo metu darbdavio telefono numeris nenurodytas. Parašykite jam žinutę platformoje.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="wd-decline"
                type="button"
                onClick={() => setArrivalHelpTarget(null)}
              >
                Uždaryti
              </button>
            </div>
          </div>
        </div>
      )}

      {workerAttendanceTarget && workerAttendanceMode && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !attendanceBusy) {
              setWorkerAttendanceTarget(null);
              setWorkerAttendanceMode(null);
              setWorkerAttendanceNote("");
              setWorkerEvidenceFile(null);
            }
          }}
        >
          <div className="rs-modal-card">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">
                  {workerAttendanceMode === "dispute"
                    ? "DARBO DIENOS GINČAS"
                    : "DARBO DIENOS PATVIRTINIMAS"}
                </div>
                <h2>
                  {workerAttendanceMode === "dispute"
                    ? "Nesutinkate su darbdavio pažymėjimu?"
                    : "Patvirtinti, kad neatvykote?"}
                </h2>
              </div>
              <button
                className="rs-close"
                disabled={attendanceBusy}
                onClick={() => {
                  setWorkerAttendanceTarget(null);
                  setWorkerAttendanceMode(null);
                  setWorkerAttendanceNote("");
                  setWorkerEvidenceFile(null);
                }}
              >
                <CloseMark />
              </button>
            </div>

            {workerAttendanceMode === "dispute" ? (
              <>
                <div className="wd-note err" style={{ marginBottom: 14 }}>
                  Kol ginčas neišspręstas, jūsų patikimumo reitingas nebus
                  mažinamas. Trumpai parašykite, kas įvyko.
                </div>
                <label className="wd-label">
                  Paaiškinimas *
                  <textarea
                    className="wd-textarea"
                    value={workerAttendanceNote}
                    maxLength={1000}
                    onChange={(e) => setWorkerAttendanceNote(e.target.value)}
                    placeholder="Pvz. Atvykau 07:55 ir dirbau iki 17:00. Darbdaviui parašiau žinutę..."
                  />
                </label>
                <label className="wd-label" style={{ marginTop: 14 }}>
                  Įrodymas (nebūtina)
                  <input
                    className="wd-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={attendanceBusy}
                    onChange={(e) =>
                      setWorkerEvidenceFile(e.target.files?.[0] || null)
                    }
                  />
                  <span
                    style={{
                      display: "block",
                      marginTop: 6,
                      color: "#6c7a88",
                      fontSize: 12,
                      lineHeight: 1.45,
                    }}
                  >
                    Galite pridėti nuotrauką arba PDF iki 8 MB. Failą matys tik
                    ginčą nagrinėjantis administratorius.
                  </span>
                  {workerEvidenceFile && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 6,
                        color: "#167a54",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Pasirinkta: {workerEvidenceFile.name}
                    </span>
                  )}
                </label>
              </>
            ) : (
              <div className="wd-note err" style={{ marginBottom: 0 }}>
                Patvirtinus neatvykimą, bus pritaikytas 3 dienų naujų darbų
                priėmimo apribojimas ir sumažės atvykimo patikimumas.
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
                className="wd-decline"
                disabled={attendanceBusy}
                onClick={() => {
                  setWorkerAttendanceTarget(null);
                  setWorkerAttendanceMode(null);
                  setWorkerAttendanceNote("");
                  setWorkerEvidenceFile(null);
                }}
              >
                Grįžti
              </button>
              <button
                className={
                  workerAttendanceMode === "dispute"
                    ? "wd-danger"
                    : "wd-danger"
                }
                disabled={
                  attendanceBusy ||
                  (workerAttendanceMode === "dispute" &&
                    workerAttendanceNote.trim().length < 5)
                }
                onClick={() => {
                  if (workerAttendanceMode === "dispute") {
                    workerRespondAttendance(
                      workerAttendanceTarget.attendance.id,
                      "disputed",
                      workerAttendanceNote.trim()
                    );
                  } else {
                    workerClaimWorkday(
                      workerAttendanceTarget.id,
                      "no_show"
                    );
                  }
                }}
              >
                {attendanceBusy
                  ? "Prašome..."
                  : workerAttendanceMode === "dispute"
                  ? "Pateikti ginčą"
                  : "Taip, neatvykau"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmInvitation && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !respondingInvitation) {
              setConfirmInvitation(null);
              setCommitmentChecked(false);
            }
          }}
        >
          <div className="rs-modal-card worker-accept-modal">
            <style>{`
              .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
              .rs-modal-card{width:min(620px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:22px;color:#102438}
              .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
              .rs-modal-head h2{margin:0;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
              .worker-accept-modal{width:min(620px,100%)!important;max-height:calc(100dvh - 40px)!important;padding:0!important;overflow:hidden!important;border-radius:18px!important;box-sizing:border-box}
              .worker-accept-modal-scroll{max-height:calc(100dvh - 40px);overflow-y:auto;overflow-x:hidden;padding:22px;box-sizing:border-box;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#aeb8c0 transparent}
              .worker-accept-modal-scroll::-webkit-scrollbar{width:8px}.worker-accept-modal-scroll::-webkit-scrollbar-track{background:transparent}.worker-accept-modal-scroll::-webkit-scrollbar-thumb{background:#aeb8c0;border-radius:999px}
              .worker-accept-modal *{box-sizing:border-box}
              @media(max-width:620px){.rs-modal-overlay{padding:10px}.worker-accept-modal{max-height:calc(100dvh - 20px)!important;border-radius:18px!important}.worker-accept-modal-scroll{max-height:calc(100dvh - 20px);padding:18px}}
            `}</style>
            <div className="worker-accept-modal-scroll">
            <div className="rs-modal-head">
              <div>
                <div className="eyebrow">DARBO PATVIRTINIMAS</div>
                <h2>Ar tikrai įsipareigojate atvykti laiku?</h2>
              </div>
              <button
                className="rs-close"
                disabled={Boolean(respondingInvitation)}
                onClick={() => {
                  setConfirmInvitation(null);
                  setCommitmentChecked(false);
                }}
              >
                <CloseMark />
              </button>
            </div>

            <div style={{ background: "#f6f8fa", borderRadius: 12, padding: 15 }}>
              <b>{formatJobTitle(confirmInvitation.job?.title)}</b>
              <div style={{ color: "#6c7a88", marginTop: 5, lineHeight: 1.55 }}>
                {confirmInvitation.companyName} · {confirmInvitation.job?.city}
                <br />
                Atvykti adresu: <b>{confirmInvitation.job?.address_text || "Atvykimo adresas nenurodytas"}</b>
                <br />
                Darbdavio patikimumas:{" "}
                <b
                  style={{
                    color: reliabilityScoreColor(
                      confirmInvitation.companyReliability
                    ),
                  }}
                >
                  {Math.round(confirmInvitation.companyReliability)} / 100
                </b>
                {confirmInvitation.companyCancelledConfirmed > 0
                  ? ` · atšauktų patvirtintų darbų: ${confirmInvitation.companyCancelledConfirmed}`
                  : ""}
                <br />
                {confirmInvitation.job?.work_date} ·{" "}
                {confirmInvitation.job?.start_time?.slice(0, 5)}
                {confirmInvitation.job?.end_time
                  ? `–${confirmInvitation.job.end_time.slice(0, 5)}`
                  : ""}
                <br />
                Atvykimas:{" "}
                <b>
                  {confirmInvitation.job?.transport_mode === "employer_pickup"
                    ? "darbdavys paima darbuotoją"
                    : "darbuotojas atvyksta pats"}
                </b>
                <>
                  <br />
                  Pietų pertrauka:{" "}
                  <b>
                    {confirmInvitation.job?.break_start_time &&
                    confirmInvitation.job?.break_end_time
                      ? `${confirmInvitation.job.break_start_time.slice(0, 5)}–${confirmInvitation.job.break_end_time.slice(0, 5)}`
                      : "nėra"}
                  </b>
                </>
              </div>
              <div className="wd-pay">
                {formatNetPay(
                  confirmInvitation.job?.pay_amount,
                  confirmInvitation.job?.pay_unit
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <b>Priimdami darbą prisiimate realų įsipareigojimą.</b>
              <ul style={{ lineHeight: 1.65, color: "#425466", paddingLeft: 22 }}>
                <li>
                  Prieš priimdami perskaitykite visą darbo aprašymą ir patikrinkite,
                  ar atitinkate jame nurodytus dokumentų, kvalifikacijos, aprangos,
                  apsaugos priemonių ar kitus reikalavimus.
                </li>
                <li>
                  Jei atsiranda problema dėl atvykimo, kuo greičiau parašykite
                  darbdaviui žinutę šiame darbo pokalbyje.
                </li>
                <li>
                  Neatvykus į patvirtintą darbą, 3 dienas negalėsite priimti
                  naujų darbų.
                </li>
                <li>
                  Neatvykimas sumažins jūsų patikimumo reitingą, todėl darbdavių
                  paieškoje būsite rodomi žemiau ir galite gauti mažiau kvietimų.
                </li>
              </ul>
              <p style={{ fontSize: 13, color: "#6c7a88", lineHeight: 1.5 }}>
                Jei negalite atvykti, svarbiausia nepradingti — informuokite
                darbdavį žinute kuo anksčiau.
              </p>
            </div>

            <label style={{
              display: "flex", gap: 9, alignItems: "flex-start",
              padding: "12px 0", fontWeight: 700
            }}>
              <input
                type="checkbox"
                checked={commitmentChecked}
                onChange={(e) => setCommitmentChecked(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              Perskaičiau darbo aprašymą ir visus nurodytus reikalavimus, jie man tinka, todėl patvirtinu, kad planuoju atvykti.
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
              <button
                className="wd-decline"
                disabled={Boolean(respondingInvitation)}
                onClick={() => {
                  setConfirmInvitation(null);
                  setCommitmentChecked(false);
                }}
              >
                Grįžti
              </button>
              <button
                className="wd-accept"
                disabled={!commitmentChecked || Boolean(respondingInvitation)}
                onClick={() =>
                  respondToInvitation(confirmInvitation.id, "accepted")
                }
              >
                {respondingInvitation
                  ? "Patvirtinama..."
                  : "Taip, įsipareigoju atvykti"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <ArrivalTimeDialog
        open={Boolean(workerCheckInTarget)}
        title="Kada faktiškai atvykote?"
        subject={workerCheckInTarget?.job ? `${formatJobTitle(workerCheckInTarget.job.title)} · ${workerCheckInTarget.job.work_date}` : ""}
        scheduledTime={workerCheckInTarget?.job?.start_time?.slice(0, 5) || ""}
        value={workerCheckInTime}
        onChange={setWorkerCheckInTime}
        busy={attendanceBusy}
        onClose={() => {
          if (attendanceBusy) return;
          setWorkerCheckInTarget(null);
          setWorkerCheckInTime("");
        }}
        onConfirm={() => workerCheckIn(workerCheckInTarget?.id, workerCheckInTime)}
      />

      {longTermOfferTarget && (
        <div
          className="rs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !longTermBusy) {
              setLongTermOfferTarget(null);
            }
          }}
        >
          <div className="rs-modal-card lt-worker-offer-modal">
            <style>{`
              .lt-worker-offer-modal{width:min(860px,100%)!important;max-height:calc(100dvh - 40px)!important;border-radius:22px!important;padding:0!important;overflow:hidden!important;background:#fff!important;box-sizing:border-box}.lt-worker-offer-scroll{max-height:calc(100dvh - 40px);overflow-y:auto;overflow-x:hidden;padding:24px;box-sizing:border-box;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#aeb8c0 transparent}.lt-worker-offer-scroll::-webkit-scrollbar{width:8px}.lt-worker-offer-scroll::-webkit-scrollbar-track{background:transparent}.lt-worker-offer-scroll::-webkit-scrollbar-thumb{background:#aeb8c0;border-radius:999px}
              .lt-worker-offer-modal .rs-modal-head{margin-bottom:18px}
              .lt-worker-offer-modal .rs-close{border-radius:12px!important}
              .lt-worker-offer-modal .lt-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:stretch}.lt-worker-offer-modal .lt-detail-card{border:1px solid #dfe7ed!important;border-radius:16px!important;padding:16px!important;background:#fff!important;overflow:hidden;box-sizing:border-box;box-shadow:none!important;min-height:92px;height:100%;display:flex;flex-direction:column;justify-content:flex-start}
              .lt-worker-offer-modal .lt-detail-card>span{display:block;color:#6c7a88;font-size:12px;margin-bottom:5px}
              .lt-worker-offer-modal .lt-detail-card>b{display:block;color:#102438;font-size:16px;line-height:1.35}.lt-worker-offer-modal .lt-detail-card small{display:block;margin-top:5px;color:#6c7a88;line-height:1.45}
              .lt-worker-offer-modal .lt-schedule-table{display:grid;gap:8px;margin-top:12px;border-radius:16px!important;overflow:visible!important}
              .lt-worker-offer-modal .lt-schedule-row{display:grid;grid-template-columns:1.05fr .8fr 1.4fr;gap:12px;align-items:center;padding:12px 14px;border:1px solid #dfe7ed!important;border-radius:14px!important;background:#fff!important;font-size:12px;box-sizing:border-box;box-shadow:none!important;min-height:48px}.lt-worker-offer-modal .lt-schedule-row span{color:#526374}.lt-worker-offer-modal .lt-schedule-row b{color:#102438}
              @media(max-width:620px){.lt-worker-offer-modal{border-radius:18px!important;max-height:calc(100dvh - 20px)!important}.lt-worker-offer-scroll{max-height:calc(100dvh - 20px);padding:18px}.lt-worker-offer-modal .lt-detail-grid{grid-template-columns:1fr}.lt-worker-offer-modal .lt-schedule-row{grid-template-columns:1fr}.lt-worker-offer-modal .lt-detail-card+ .lt-detail-card{min-width:0}}
            `}</style>

            <div className="lt-worker-offer-scroll">
            <div className="rs-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MonthlyAwardMiniList
                  awards={companyAwardsById[longTermOfferTarget.company_id] || []}
                  size={50}
                />
                <CompanyBadge
                  name={longTermOfferTarget.company_name}
                  avatarPath={longTermOfferTarget.company_avatar_path}
                  size={50}
                  fontSize={17}
                />
                <div>
                  <div className="eyebrow">
                    {longTermOfferTarget.status === "active"
                      ? "ILGALAIKIS DARBAS"
                      : "ĮDARBINIMO PASIŪLYMAS"}
                  </div>
                  <h2 style={{ marginBottom: 4 }}>{longTermOfferTarget.company_name}</h2>
                  <div style={{ color: "#6c7a88", fontSize: 13 }}>
                    {longTermStatusLabel(longTermOfferTarget.status)}
                  </div>
                </div>
              </div>
              <button
                className="rs-close"
                type="button"
                disabled={longTermBusy}
                onClick={() => setLongTermOfferTarget(null)}
              >
                <CloseMark />
              </button>
            </div>

            <LongTermOfferDetails offer={longTermOfferTarget} />

            <div className="lt-detail-card" style={{ marginTop: 12 }}>
              <span>Darbo sutartis</span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <b>{longTermOfferTarget.employer_contract_name || "Darbo sutartis"}</b>
                  <small>Perskaitykite visą dokumentą prieš pasirašydami.</small>
                </div>
                {longTermOfferTarget.employer_contract_path && (
                  <button
                    className="wd-decline"
                    type="button"
                    disabled={longTermBusy}
                    onClick={() =>
                      workerOpenLongTermContract(longTermOfferTarget.employer_contract_path, longTermOfferTarget.id)
                    }
                  >
                    Atidaryti sutartį
                  </button>
                )}
              </div>
            </div>

            {longTermOfferTarget.status === "offered" && (
              <div
                style={{
                  marginTop: 14,
                  padding: 13,
                  borderRadius: 12,
                  border: blockingActiveLongTermEmployment
                    ? "1px solid #f0d3aa"
                    : "1px solid transparent",
                  background: "#fff8f1",
                  color: "#7a4a1d",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {blockingActiveLongTermEmployment ? (
                  <>
                    <b>Jūs jau turite aktyvią ilgalaikio darbo sutartį</b>
                    <div style={{ marginTop: 5 }}>
                      Šiuo metu dirbate pas {blockingActiveLongTermEmployment.company_name || "kitą darbdavį"}.
                      Šį naują pasiūlymą galite peržiūrėti, skaityti sutartį ir aptarti su darbdaviu,
                      tačiau jo patvirtinti negalėsite, kol dabartinis ilgalaikis įdarbinimas nebus užbaigtas.
                    </div>
                  </>
                ) : (
                  <>
                    Perskaitykite darbdavio įkeltą darbo sutartį. Jei visos sąlygos tinka,
                    pasirašykite dokumentą ir įkelkite pasirašytą sutartį žemiau. Kol
                    darbdavys jos nepatvirtino, jūsų ilgalaikis grafikas neaktyvuojamas.
                  </>
                )}
              </div>
            )}

            {longTermOfferTarget.status === "active" && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  border: "1px solid #cfe8dc",
                  borderRadius: 12,
                  background: "#f3faf6",
                }}
              >
                <b>Papildomi darbai valdomi pagal jūsų laisvumo grafiką</b>
                <p style={{ margin: "5px 0 0", color: "#607180", fontSize: 13, lineHeight: 1.5 }}>
                  Aktyvaus įdarbinimo valandos yra užrakintos automatiškai. Jei prie kito
                  laiko pažymite „Laisvas“ arba „Laisvas kitu laiku“, darbdaviai gali jus
                  matyti tik tam laisvam laikui tinkamuose darbuose. Jei laisvo laiko
                  nepažymite, papildomiems darbams jūsų nerodys.
                </p>
              </div>
            )}

            {longTermOfferTarget.status === "offered" && (
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid #dfe7ed",
                  borderRadius: 12,
                  padding: 14,
                  background: "#f8fafb",
                }}
              >
                {blockingActiveLongTermEmployment ? (
                  <div>
                    <b style={{ color: "#9a5b18" }}>Patvirtinimas laikinai negalimas</b>
                    <div style={{ marginTop: 5, color: "#607180", fontSize: 12, lineHeight: 1.5 }}>
                      Kai dabartinis ilgalaikis darbas bus užbaigtas, šiame pasiūlyme automatiškai
                      vėl atsiras galimybė įkelti pasirašytą sutartį ir tęsti įdarbinimą.
                    </div>
                  </div>
                ) : longTermOfferTarget.worker_signed_contract_path ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <b style={{ color: "#167a54" }}>✓ Pasirašyta sutartis išsiųsta</b>
                      <div style={{ marginTop: 4, color: "#607180", fontSize: 12 }}>
                        Laukiama, kol darbdavys peržiūrės dokumentą ir galutinai patvirtins įdarbinimą.
                      </div>
                    </div>
                    <button
                      className="wd-decline"
                      type="button"
                      onClick={() =>
                        workerOpenLongTermContract(longTermOfferTarget.worker_signed_contract_path)
                      }
                    >
                      Peržiūrėti mano sutartį
                    </button>
                  </div>
                ) : (
                  <>
                    <b>Įkelti pasirašytą darbo sutartį</b>
                    <p style={{ margin: "5px 0 10px", color: "#607180", fontSize: 12, lineHeight: 1.5 }}>
                      Priimami PDF ir DOCX failai iki 15 MB. Įkėlus sutartį darbdavys gaus pranešimą,
                      kad gali ją peržiūrėti ir patvirtinti jūsų įdarbinimą.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <label className="wd-decline" style={{ cursor: "pointer" }}>
                        Pasirinkti failą
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setLongTermSignedContractFile(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                      {longTermSignedContractFile && (
                        <span style={{ color: "#526374", fontSize: 12 }}>
                          {longTermSignedContractFile.name}
                        </span>
                      )}
                      <button
                        className="wd-accept"
                        type="button"
                        disabled={longTermBusy || !longTermSignedContractFile}
                        onClick={() => workerSubmitSignedContract(longTermOfferTarget)}
                      >
                        {longTermBusy ? "Siunčiama..." : "Išsiųsti pasirašytą sutartį"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["active", "offered"].includes(longTermOfferTarget.status) && (
                  <button
                    className={`wd-decline wd-workday-chat ${
                      Number(longTermUnreadByOffer[longTermOfferTarget.id] || 0) > 0
                        ? "has-unread"
                        : ""
                    }`}
                    type="button"
                    disabled={longTermBusy}
                    onClick={() => {
                      setLongTermUnreadByOffer((current) => ({
                        ...current,
                        [longTermOfferTarget.id]: 0,
                      }));
                      setLongTermConversation({
                        placementId: longTermOfferTarget.id,
                        title: `${longTermOfferTarget.company_name} · ${longTermOfferTarget.position_title}`,
                      });
                    }}
                  >
                    Pokalbis
                    {Number(longTermUnreadByOffer[longTermOfferTarget.id] || 0) > 0 && (
                      <span className="wd-chat-count">
                        {Math.min(9, Number(longTermUnreadByOffer[longTermOfferTarget.id] || 0))}
                      </span>
                    )}
                  </button>
                )}
                {longTermOfferTarget.status === "offered" && (
                  <button
                    className="wd-danger"
                    type="button"
                    disabled={longTermBusy || Boolean(longTermOfferTarget.worker_signed_contract_path)}
                    onClick={() => workerDeclineLongTermOffer(longTermOfferTarget)}
                  >
                    {longTermOfferTarget.worker_signed_contract_path
                      ? "Sutartis jau išsiųsta"
                      : "Atmesti pasiūlymą"}
                  </button>
                )}
                <button
                  className="wd-decline"
                  type="button"
                  disabled={longTermBusy}
                  onClick={() => setLongTermOfferTarget(null)}
                >
                  Uždaryti
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {showWorkerReliabilityInfo && (
        <div
          className="reliability-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowWorkerReliabilityInfo(false);
          }}
        >
          <style>{RELIABILITY_MODAL_STYLES}</style>

          <div
            className="reliability-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="worker-reliability-modal-title"
          >
            <div className="reliability-modal-scroll">
            <div className="reliability-modal-head">
              <div>
                <div className="reliability-modal-eyebrow">PATIKIMUMO REITINGAS</div>
                <h2 id="worker-reliability-modal-title">
                  Kaip veikia darbuotojo patikimumas?
                </h2>
              </div>
              <button
                className="reliability-modal-close"
                type="button"
                aria-label="Uždaryti"
                onClick={() => setShowWorkerReliabilityInfo(false)}
              >
                <CloseMark />
              </button>
            </div>

            <div className="reliability-score-box">
              <div className="reliability-score-copy">
                <strong>
                  Dabartinis patikimumas: {" "}
                  <span style={{ color: reliabilityScoreColor(metrics.attendanceRate) }}>
                    {formatReliabilityScore(metrics.attendanceRate)} / 100
                  </span>
                </strong>
                <span>
                  Darbdaviai šį rodiklį mato vertindami jūsų profilį prieš kviesdami į darbą.
                </span>
              </div>
            </div>

            <div className="reliability-rules">
              <div className="reliability-rule">
                <div className="reliability-rule-icon">100</div>
                <p>Naujas darbuotojas pradeda nuo <b>100 patikimumo taškų</b>.</p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">−7</div>
                <p>Patvirtintas <b>neatvykimas</b> sumažina patikimumą 7 taškais ir taikomas 3 dienų darbo priėmimo apribojimas.</p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">−3</div>
                <p>Patvirtintas <b>nepagrįstas ankstyvas išėjimas</b> sumažina patikimumą 3 taškais.</p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">+</div>
                <p>
                  Tvarkingai užbaigus visą darbo dieną patikimumas atsistato pagal dabartinį rezultatą: 0–49 – <b>+3</b>, 50–69 – <b>+2</b>, 70–89 – <b>+1</b>, 90–99 – <b>+0,5</b>.
                </p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">½</div>
                <p>Suderintas ankstyvas išėjimas laikomas tvarkingu rezultatu, tačiau suteikia <b>pusę įprasto atkūrimo</b>.</p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">30</div>
                <p>
                  Jei 30 dienų nėra naujo pažeidimo, rezultatas iki 80 / 100 gali augti po <b>+1 tašką kas 30 dienų</b>. Nuo 80 iki 100 reikia sėkmingai dirbti.
                </p>
              </div>
              <div className="reliability-rule">
                <div className="reliability-rule-icon">✓</div>
                <p>
                  Po paskutinio pažeidimo tvarkingai užbaigta darbo dienų: {" "}
                  <b>{metrics.reliabilityGoodJobsSincePenalty}</b>.
                </p>
              </div>
            </div>

            <div className="reliability-history">
              <div className="reliability-history-head">
                <h3>Patikimumo sumažėjimų istorija</h3>
                {workerPenaltyHistory.length > 5 && (
                  <span>Rodomi 5 naujausi iš {workerPenaltyHistory.length}</span>
                )}
              </div>

              {workerPenaltyHistory.length ? (
                <div className="reliability-history-list">
                  {workerPenaltyHistory.slice(0, 5).map((penalty) => {
                    const meta = workerReliabilityPenaltyMeta(penalty);
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
              <b>Svarbu:</b> ginčijamas darbo dienos rezultatas patikimumo nemažina tol, kol ginčas neišspręstas. Darbdavių įvertinimas balais yra atskiras rodiklis ir į šį patikimumo skaičių neįtraukiamas.
            </div>

            <div className="reliability-modal-actions">
              <button type="button" onClick={() => setShowWorkerReliabilityInfo(false)}>
                Supratau
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {longTermEndNotice && (
        <div className="lt-end-notice-overlay" role="dialog" aria-modal="true" aria-labelledby="lt-end-notice-title">
          <style>{`
            .lt-end-notice-overlay{position:fixed;inset:0;z-index:12500;display:grid;place-items:center;padding:20px;background:rgba(16,36,56,.66);backdrop-filter:blur(2px)}
            .lt-end-notice-card{width:min(560px,100%);background:#fff;border:1px solid #e3eaef;border-radius:20px;box-shadow:0 30px 100px rgba(16,36,56,.34);padding:22px;color:#102438}
            .lt-end-notice-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:#fff1ed;color:#b64d2a;font-size:22px;font-weight:900;margin-bottom:14px}
            .lt-end-notice-card h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:24px;line-height:1.2}.lt-end-notice-card p{margin:10px 0 0;color:#607180;line-height:1.55}.lt-end-notice-company{margin-top:16px;padding:13px 14px;border:1px solid #e2e9ee;border-radius:13px;background:#f8fafb}.lt-end-notice-company b{display:block;font-size:16px}.lt-end-notice-company span{display:block;margin-top:3px;color:#6c7a88;font-size:12px;line-height:1.45}.lt-end-notice-note{margin-top:10px;padding:11px 13px;border-radius:12px;background:#fff8f1;border:1px solid #f2d3b8;color:#8a531d;font-size:12px;line-height:1.5}.lt-end-notice-actions{display:flex;justify-content:flex-end;margin-top:18px}.lt-end-notice-confirm{border:0;border-radius:11px;background:#102438;color:#fff;padding:11px 18px;font:inherit;font-weight:850;cursor:pointer}.lt-end-notice-confirm:disabled{opacity:.55;cursor:not-allowed}
            @media(max-width:560px){.lt-end-notice-overlay{padding:10px}.lt-end-notice-card{padding:18px;border-radius:17px}.lt-end-notice-actions{display:grid}.lt-end-notice-confirm{width:100%}}
          `}</style>
          <div className="lt-end-notice-card">
            <div className="lt-end-notice-icon" aria-hidden="true">!</div>
            <h2 id="lt-end-notice-title">Jūsų ilgalaikis įdarbinimas nutrauktas</h2>
            <p>
              Darbdavys nutraukė jūsų ilgalaikį įdarbinimą. Nuo nutraukimo momento
              ilgalaikio darbo grafikas jūsų prieinamumo neberiboja, o laisvu laiku vėl
              galite įprastai priimti darbo pasiūlymus pagal savo nustatytą grafiką.
            </p>
            <div className="lt-end-notice-company">
              <b>{longTermEndNotice.company_name || "Darbdavys"}</b>
              <span>
                {longTermEndNotice.position_title || "Ilgalaikis darbas"}
                {longTermEndNotice.ended_at
                  ? ` · nutraukta ${new Date(longTermEndNotice.ended_at).toLocaleString("lt-LT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
                  : ""}
              </span>
            </div>
            {longTermEndNotice.ended_note && (
              <div className="lt-end-notice-note">
                <b>Darbdavio pastaba:</b> {longTermEndNotice.ended_note}
              </div>
            )}
            <div className="lt-end-notice-actions">
              <button
                className="lt-end-notice-confirm"
                type="button"
                disabled={longTermEndNoticeBusy}
                onClick={acknowledgeLongTermEnd}
              >
                {longTermEndNoticeBusy ? "Tvirtinama..." : "Patvirtinti"}
              </button>
            </div>
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

      <ConversationModal
        open={Boolean(conversation)}
        onClose={() => setConversation(null)}
        onRead={() => conversation && markWorkerNotificationsRead(conversation.invitationId)}
        invitationId={conversation?.invitationId}
        title={conversation?.title}
        user={user}
        senderMode={onAdminReturn ? "worker" : null}
      />

      <GroupConversationModal
        open={Boolean(groupConversation)}
        onClose={() => setGroupConversation(null)}
        onRead={() => groupConversation && markWorkerJobNotificationsRead(groupConversation.jobId)}
        jobId={groupConversation?.jobId}
        title={groupConversation?.title}
        user={user}
        senderMode={onAdminReturn ? "worker" : null}
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
        accountKind="darbuotojo paskyra"
      />
    </div>
  );
}
