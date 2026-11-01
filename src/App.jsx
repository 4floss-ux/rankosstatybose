import { useEffect, useRef, useState } from "react";
import { initialPasswordRecovery, isHireProjectPath, statybos24IsStandalone, supabase } from "./lib/config.js";
import { PasswordRecoveryPage, clearPasswordRecoveryUrl, rememberPasswordRecoveryUser, rememberedPasswordRecoveryUser } from "./auth/passwordRecovery.jsx";
import { AuthModal } from "./auth/AuthModal.jsx";
import { TeamInvitePage } from "./team/TeamInvitePage.jsx";
import { localDateISO } from "./lib/jobs.js";
import { WorkerDashboard } from "./worker/WorkerDashboard.jsx";
import { BUSINESS_PRESENTATION_TOKEN } from "./employer/plans.js";
import { EmployerDashboard } from "./employer/EmployerDashboard.jsx";
import { AdminEmployerGateway, AdminWorkerGateway } from "./admin/adminParts.jsx";
import { AdminDashboard } from "./admin/AdminDashboard.jsx";
import { SuspendedAccount } from "./public/SuspendedAccount.jsx";
import { PublicLandingPage } from "./public/PublicLandingPage.jsx";
import { BusinessPresentationPage } from "./public/BusinessPresentationPage.jsx";
import { AppBootLoader } from "./ui/AppBootLoader.jsx";
import { PublicLandingP24 } from "./p24/public/PublicLandingP24.jsx";

export function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    if(!user?.id || !supabase) return;
    let stopped=false, busy=false, recordedDay="";
    async function recordDay() {
      if(stopped || busy || document.visibilityState !== "visible") return;
      const date=localDateISO(new Date());
      if(recordedDay===date) return;
      busy=true;
      try { const result=await supabase.rpc("record_my_account_day"); if(!result.error && !stopped)recordedDay=date; } catch {} finally {busy=false;}
    }
    recordDay();
    const interval=window.setInterval(recordDay,60000);
    document.addEventListener("visibilitychange",recordDay);
    return()=>{stopped=true;window.clearInterval(interval);document.removeEventListener("visibilitychange",recordDay);};
  },[user?.id]);

  const authUserIdRef = useRef(null);
  const [authSessionChecked, setAuthSessionChecked] = useState(!supabase);
  const [accountStatusChecked, setAccountStatusChecked] = useState(!supabase);
  const [passwordRecovery, setPasswordRecovery] = useState(initialPasswordRecovery.requested);
  const [recoveryError, setRecoveryError] = useState(initialPasswordRecovery.error);
  const [recoveryUserId, setRecoveryUserId] = useState(() =>
    initialPasswordRecovery.requested && !initialPasswordRecovery.error && !initialPasswordRecovery.hasCallback
      ? rememberedPasswordRecoveryUser() : ""
  );
  const [accountRole, setAccountRole] = useState(null);
  const [accountStatus, setAccountStatus] = useState({
    isActive: true,
    suspendedUntil: null,
    suspensionReason: null,
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("worker");
  const [pricingBillingCycle, setPricingBillingCycle] = useState("monthly");
  const [adminMode, setAdminMode] = useState("admin");
  const businessPresentationToken = new URLSearchParams(window.location.search).get(
    "pristatymas"
  );
  const [teamInviteToken, setTeamInviteToken] = useState(() =>
    new URLSearchParams(window.location.search).get("team_invite")
  );
  const [teamInvite, setTeamInvite] = useState(null);
  const [teamInviteLoading, setTeamInviteLoading] = useState(false);
  const [teamInviteError, setTeamInviteError] = useState("");
  const [teamInviteAccepting, setTeamInviteAccepting] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        const nextUser = data?.session?.user ?? null;
        authUserIdRef.current = nextUser?.id || null;
        setAccountStatusChecked(!nextUser);
        setUser(nextUser);
        if (error && initialPasswordRecovery.requested) {
          setRecoveryError("Atkūrimo nuoroda nebegalioja. Paprašykite naujos nuorodos.");
        }
        setAuthSessionChecked(true);
      })
      .catch(() => {
        setAccountStatusChecked(true);
        if (initialPasswordRecovery.requested) {
          setRecoveryError("Nepavyko patikrinti atkūrimo nuorodos. Bandykite atidaryti ją dar kartą.");
        }
        setAuthSessionChecked(true);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const nextUser = session?.user ?? null;
        const nextUserId = nextUser?.id || null;
        if (authUserIdRef.current !== nextUserId) {
          setAccountStatusChecked(!nextUser);
          authUserIdRef.current = nextUserId;
        }
        setUser(nextUser);
        if (event === "PASSWORD_RECOVERY" && session?.user?.id) {
          rememberPasswordRecoveryUser(session.user.id);
          setRecoveryUserId(session.user.id);
          setRecoveryError("");
          setPasswordRecovery(true);
          setAuthOpen(false);
          setAuthSessionChecked(true);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!teamInviteToken || !supabase) {
      setTeamInvite(null);
      setTeamInviteError("");
      setTeamInviteLoading(false);
      return;
    }

    let cancelled = false;
    setTeamInviteLoading(true);
    setTeamInviteError("");

    supabase
      .rpc("get_company_team_invite_public", {
        p_token: teamInviteToken,
      })
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          setTeamInvite(null);
          setTeamInviteError(
            error.message || "Nepavyko patikrinti komandos kvietimo."
          );
        } else {
          setTeamInvite(data?.[0] || null);
        }

        setTeamInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamInviteToken]);

  useEffect(() => {
    if (!user || !supabase) {
      setAccountRole(null);
      setAccountStatus({
        isActive: true,
        suspendedUntil: null,
        suspensionReason: null,
      });
      setAccountStatusChecked(true);
      return;
    }

    let cancelled = false;
    setAccountStatusChecked(false);

    supabase
      .rpc("get_my_account_status")
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            console.error(error);
            setAccountRole(null);
          } else {
            const status = data?.[0] || null;
            setAccountRole(status?.role || null);
            setAccountStatus({
              isActive: status?.is_active !== false,
              suspendedUntil: status?.suspended_until || null,
              suspensionReason: status?.suspension_reason || null,
            });
          }
          setAccountStatusChecked(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setAccountRole(null);
          setAccountStatusChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || accountRole !== "admin") {
      setAdminMode("admin");
    }
  }, [user?.id, accountRole]);

  const openLogin = () => {
    setAuthMode("login");
    setAuthRole("worker");
    setAuthOpen(true);
  };

  const openEmployerSignup = () => {
    setAuthMode("signup");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const openWorkerSignup = () => {
    setAuthMode("signup");
    setAuthRole("worker");
    setAuthOpen(true);
  };

  const clearTeamInvite = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("team_invite");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setTeamInviteToken(null);
    setTeamInvite(null);
    setTeamInviteError("");
  };

  const openTeamInviteLogin = () => {
    setAuthMode("login");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const openTeamInviteSignup = () => {
    setAuthMode("signup");
    setAuthRole("employer");
    setAuthOpen(true);
  };

  const acceptTeamInvite = async () => {
    if (!teamInviteToken || !user) return;

    setTeamInviteAccepting(true);
    setTeamInviteError("");

    try {
      const result = await supabase.rpc("accept_company_team_invite", {
        p_token: teamInviteToken,
      });

      if (result.error) throw result.error;

      const profileResult = await supabase.rpc("get_my_account_status");

      if (profileResult.error) throw profileResult.error;

      const profileStatus = profileResult.data?.[0] || null;
      setAccountRole(profileStatus?.role || "employer");
      setAccountStatus({
        isActive: profileStatus?.is_active !== false,
        suspendedUntil: profileStatus?.suspended_until || null,
        suspensionReason: profileStatus?.suspension_reason || null,
      });

      clearTeamInvite();
    } catch (err) {
      setTeamInviteError(
        err?.message || "Nepavyko prisijungti prie įmonės komandos."
      );
    } finally {
      setTeamInviteAccepting(false);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const finishPasswordRecovery = () => {
    clearPasswordRecoveryUrl();
    setRecoveryUserId("");
    setRecoveryError("");
    setPasswordRecovery(false);
  };

  if (!authSessionChecked || (user && !accountStatusChecked)) {
    // Standalone PWA already displays the OS-generated launch screen.
    // Keep login initialization visually quiet; do not show a second logo/spinner.
    // Website and separate /hire portal keep their original loading views.
    if (!isHireProjectPath && statybos24IsStandalone()) {
      return <div role="status" aria-label="Įkeliama" style={{ minHeight: "100vh", background: "#ffffff" }} />;
    }
    return <AppBootLoader />;
  }

  if (passwordRecovery) {
    return (
      <PasswordRecoveryPage
        user={user}
        checking={!authSessionChecked}
        authorized={Boolean(user?.id && recoveryUserId === user.id)}
        error={recoveryError}
        onDone={finishPasswordRecovery}
      />
    );
  }

  if (
    businessPresentationToken === BUSINESS_PRESENTATION_TOKEN &&
    (!user || accountRole === "admin")
  ) {
    return (
      <>
        <BusinessPresentationPage onSignup={openEmployerSignup} />
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode="signup"
          initialRole="employer"
        />
      </>
    );
  }

  const accountIsSuspended =
    accountRole !== "admin" &&
    accountStatus.suspendedUntil &&
    new Date(accountStatus.suspendedUntil) > new Date();

  if (
    user &&
    accountRole !== "admin" &&
    (!accountStatus.isActive || accountIsSuspended)
  ) {
    return (
      <SuspendedAccount
        onLogout={logout}
        disabled={!accountStatus.isActive}
        suspendedUntil={accountStatus.suspendedUntil}
        reason={accountStatus.suspensionReason}
      />
    );
  }

  if (teamInviteToken) {
    return (
      <>
        <TeamInvitePage
          invite={teamInvite}
          loading={teamInviteLoading}
          error={teamInviteError}
          user={user}
          accepting={teamInviteAccepting}
          onLogin={openTeamInviteLogin}
          onSignup={openTeamInviteSignup}
          onAccept={acceptTeamInvite}
          onCancel={clearTeamInvite}
        />

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          initialMode={authMode}
          initialRole="employer"
          teamInvite={
            teamInvite
              ? { ...teamInvite, token: teamInviteToken }
              : null
          }
        />
      </>
    );
  }

  if (user && accountRole === "worker") {
    return (
      <WorkerDashboard user={user} onLogout={logout} />
    );
  }

  if (user && accountRole === "employer") {
    return (
      <EmployerDashboard user={user} onLogout={logout} />
    );
  }

  if (user && accountRole === "admin") {
    if (adminMode === "worker") {
      return (
        <AdminWorkerGateway
          user={user}
          onLogout={logout}
          onAdminReturn={() => setAdminMode("admin")}
        />
      );
    }

    if (adminMode === "employer") {
      return (
        <AdminEmployerGateway
          user={user}
          onLogout={logout}
          onAdminReturn={() => setAdminMode("admin")}
        />
      );
    }

    return (
      <AdminDashboard
        user={user}
        onLogout={logout}
        onOpenWorker={() => setAdminMode("worker")}
        onOpenEmployer={() => setAdminMode("employer")}
        initialTab={new URLSearchParams(window.location.search).get("admin_tab")}
      />
    );
  }

  return (
    <>
      <PublicLandingP24
        onLogin={openLogin}
        onEmployerSignup={openEmployerSignup}
        onWorkerSignup={openWorkerSignup}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        initialRole={authRole}
      />
    </>
  );
}
