import { useEffect, useRef, useState } from "react";
import { P24Modal } from "../p24/ui.jsx";
import { createPortal } from "react-dom";
import { isHireProjectPath, supabase } from "../lib/config.js";
import { CloseMark } from "../ui/brand.jsx";
import { edgeFunctionErrorMessage } from "../employer/plans.js";

export const DASHBOARD_PAGE_SIZE = 5;

export const EMPLOYER_JOBS_BATCH_SIZE = 500;
export const EMPLOYER_JOB_SELECT =
  "id, title, city, address_text, location_latitude, location_longitude, location_geocoded_at, work_date, start_time, end_time, break_start_time, break_end_time, workers_needed, pay_amount, pay_unit, status, transport_mode, description, cancellation_reason, cancelled_at, created_at, created_by, responsible_user_id";

export const RELIABILITY_MODAL_STYLES = `
  .reliability-modal-overlay{
    position:fixed;
    inset:0;
    z-index:3000;
    display:grid;
    place-items:center;
    padding:24px;
    background:rgba(34,38,49,.62);
    backdrop-filter:blur(2px);
    font-family:Inter,sans-serif;
  }
  .reliability-modal{
    width:min(620px,100%);
    max-height:calc(100dvh - 48px);
    overflow:hidden;
    background:#fff;
    border:1px solid rgba(34,38,49,.08);
    border-radius:20px;
    box-shadow:0 28px 90px rgba(34,38,49,.28);
    padding:0;
    color:#222631;
  }
  .reliability-modal-scroll{
    max-height:calc(100dvh - 48px);
    overflow-y:auto;
    overflow-x:hidden;
    box-sizing:border-box;
    padding:26px;
    border-radius:inherit;
    scrollbar-gutter:stable;
    scrollbar-width:thin;
    scrollbar-color:#c7d0d7 transparent;
  }
  .reliability-modal-scroll::-webkit-scrollbar{width:8px}
  .reliability-modal-scroll::-webkit-scrollbar-track{background:transparent}
  .reliability-modal-scroll::-webkit-scrollbar-thumb{background:#c7d0d7;border-radius:999px}
  .reliability-modal-head{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:18px;
    margin-bottom:20px;
  }
  .reliability-modal-eyebrow{
    color:#6b5b95;
    font-size:12px;
    font-weight:800;
    letter-spacing:.08em;
    margin-bottom:7px;
  }
  .reliability-modal h2{
    margin:0;
    font-family:Manrope,Inter,sans-serif;
    font-size:28px;
    line-height:1.15;
    letter-spacing:-.025em;
    color:#222631;
  }
  .reliability-modal-close{
    width:38px;
    height:38px;
    flex:0 0 auto;
    border:0;
    border-radius:10px;
    background:#f1f4f6;
    color:#222631;
    font-family:Inter,sans-serif;
    font-size:22px;
    line-height:1;
    cursor:pointer;
  }
  .reliability-score-box{
    display:flex;
    align-items:center;
    gap:16px;
    padding:15px;
    margin-bottom:20px;
    border:1px solid #e3e9ed;
    border-radius:14px;
    background:#f7f9fa;
  }
  .reliability-score-copy strong{
    display:block;
    font-family:Manrope,Inter,sans-serif;
    font-size:18px;
    margin-bottom:4px;
  }
  .reliability-score-copy span{
    color:#6c7a88;
    font-size:13px;
    line-height:1.45;
  }
  .reliability-rules{display:grid;gap:8px}
  .reliability-rule{
    display:grid;
    grid-template-columns:58px minmax(0,1fr);
    gap:12px;
    align-items:center;
    padding:12px 14px;
    border:1px solid #e5ecef;
    border-radius:12px;
    background:#fff;
  }
  .reliability-rule:last-child{border-bottom:1px solid #e5ecef}
  .reliability-rule-icon{
    width:48px;
    height:28px;
    border-radius:999px;
    display:grid;
    place-items:center;
    background:#f1f4f6;
    font-weight:850;
    font-size:12px;
    color:#425466;
  }
  .reliability-rule p{margin:0;color:#425466;font-size:13px;line-height:1.5}
  .reliability-note{
    margin-top:16px;
    padding:13px 14px;
    border-radius:12px;
    background:#f1eef8;
    color:#433960;
    font-size:13px;
    line-height:1.5;
  }
  .reliability-history{
    margin-top:20px;
    padding-top:18px;
    border-top:1px solid #e8eef2;
  }
  .reliability-history-head{
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:12px;
    margin-bottom:10px;
  }
  .reliability-history-head h3{
    margin:0;
    font-family:Manrope,Inter,sans-serif;
    font-size:16px;
    color:#222631;
  }
  .reliability-history-head span{font-size:11px;color:#8a98a6}
  .reliability-history-list{display:grid;gap:8px}
  .reliability-history-item{
    display:grid;
    grid-template-columns:58px minmax(0,1fr) auto;
    gap:12px;
    align-items:center;
    padding:11px 12px;
    border:1px solid #e5ecef;
    border-radius:12px;
    background:#f8fafb;
  }
  .reliability-history-change{
    display:grid;
    place-items:center;
    min-height:30px;
    border-radius:9px;
    background:#fff0ec;
    color:#b64d2a;
    font-family:Manrope,Inter,sans-serif;
    font-size:13px;
    font-weight:900;
  }
  .reliability-history-copy{min-width:0}
  .reliability-history-copy b{
    display:block;
    color:#222631;
    font-size:12px;
    line-height:1.35;
  }
  .reliability-history-copy small{
    display:block;
    margin-top:3px;
    color:#6c7a88;
    font-size:11px;
    line-height:1.4;
  }
  .reliability-history-date{
    color:#8a98a6;
    font-size:10.5px;
    white-space:nowrap;
  }
  .reliability-history-empty{
    padding:12px 14px;
    border:1px dashed #d8e1e7;
    border-radius:12px;
    background:#f8fafb;
    color:#6c7a88;
    font-size:12px;
    line-height:1.45;
  }
  .reliability-modal-actions{
    display:flex;
    justify-content:flex-end;
    margin-top:20px;
  }
  .reliability-modal-actions button{
    border:0;
    border-radius:10px;
    padding:11px 17px;
    background:#6b5b95;
    color:#fff;
    font-family:Manrope,Inter,sans-serif;
    font-weight:800;
    cursor:pointer;
  }
  @media(max-width:600px){
    .reliability-modal-overlay{padding:12px}
    .reliability-modal{border-radius:16px;max-height:calc(100dvh - 24px)}
    .reliability-modal-scroll{padding:20px;max-height:calc(100dvh - 24px)}
    .reliability-modal h2{font-size:23px}
    .reliability-score-box{align-items:flex-start}
    .reliability-rule{grid-template-columns:50px minmax(0,1fr);padding:11px}
    .reliability-rule-icon{width:42px}
    .reliability-history-item{grid-template-columns:52px minmax(0,1fr)}
    .reliability-history-date{grid-column:2;justify-self:start}
  }
`;

export async function loadAllCompanyJobs(companyId) {
  if (!supabase || !companyId) {
    return { data: [], error: null };
  }

  const rows = [];

  for (let from = 0; ; from += EMPLOYER_JOBS_BATCH_SIZE) {
    const result = await supabase
      .from("jobs")
      .select(EMPLOYER_JOB_SELECT)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(from, from + EMPLOYER_JOBS_BATCH_SIZE - 1);

    if (result.error) return result;

    const batch = result.data || [];
    rows.push(...batch);

    if (batch.length < EMPLOYER_JOBS_BATCH_SIZE) break;
  }

  return { data: rows, error: null };
}


export function DashboardPagination({ page, totalItems, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(Number(totalItems || 0) / DASHBOARD_PAGE_SIZE));
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        style={{
          border: "1px solid #dbe4ea",
          background: "#fff",
          color: "#222631",
          borderRadius: 10,
          padding: "9px 13px",
          font: "inherit",
          fontWeight: 800,
          cursor: page <= 1 ? "not-allowed" : "pointer",
          opacity: page <= 1 ? 0.45 : 1,
        }}
      >
        Ankstesnis
      </button>

      <span style={{ color: "#6c7a88", fontSize: 12, fontWeight: 700 }}>
        {page} / {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        style={{
          border: "1px solid #dbe4ea",
          background: "#fff",
          color: "#222631",
          borderRadius: 10,
          padding: "9px 13px",
          font: "inherit",
          fontWeight: 800,
          cursor: page >= totalPages ? "not-allowed" : "pointer",
          opacity: page >= totalPages ? 0.45 : 1,
        }}
      >
        Sekantis puslapis
      </button>
    </div>
  );
}

export async function deleteAccountThroughServer({ targetUserId = null, reason = "" } = {}) {
  const body = { confirmation: "ISTRINTI" };
  if (targetUserId) body.targetUserId = targetUserId;
  if (reason) body.reason = reason;

  const result = await supabase.functions.invoke("delete-account", { body });

  if (result.error) {
    throw new Error(
      await edgeFunctionErrorMessage(
        result.error,
        result.data?.error || "Nepavyko ištrinti paskyros."
      )
    );
  }

  if (result.data?.error) {
    throw new Error(result.data.error);
  }

  return result.data || { ok: true };
}

export function DeleteAccountModal({ open, onClose, accountKind = "paskyra" }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setConfirmText("");
    setBusy(false);
    setError("");
  }, [open]);

  if (!open) return null;

  async function confirmDeletion() {
    if (confirmText.trim().toUpperCase() !== "ISTRINTI" || busy) return;

    setBusy(true);
    setError("");

    try {
      await deleteAccountThroughServer();
      try {
        await supabase.auth.signOut();
      } catch {}
      window.location.replace("/");
    } catch (err) {
      setError(err?.message || "Nepavyko ištrinti paskyros.");
      setBusy(false);
    }
  }

  return (
    <P24Modal eyebrow="Paskyros ištrynimas" title="Ištrinti paskyrą?" onClose={onClose} busy={busy}>
      <p className="small muted" style={{ margin: 0 }}>Bus pašalinta jūsų {accountKind}, su ja sukurti duomenys ir įkelti failai. Atkurti negalima. Mokama prenumerata bus nutraukta prieš ištrynimą. Kitiems suteikti įvertinimai išliks. Vėliau galėsite susikurti naują paskyrą tuo pačiu el. paštu.</p>
      <p className="small muted" style={{ margin: 0 }}>Įrašykite <b style={{ color: "var(--navy)" }}>ISTRINTI</b>, kad patvirtintumėte.</p>
      <label className="field"><span className="sr">Patvirtinimas</span><input value={confirmText} disabled={busy} onChange={(e) => setConfirmText(e.target.value)} placeholder="ISTRINTI" autoComplete="off" /></label>
      {error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atgal</button>
        <button className="btn danger" type="button" disabled={busy || confirmText.trim().toUpperCase() !== "ISTRINTI"} onClick={confirmDeletion}>{busy ? "Trinama..." : "Ištrinti visam laikui"}</button>
      </div>
    </P24Modal>
  );
}

export function AccountDeleteZone({ onDelete, description }) {
  return (
    <div className="account-delete-zone">
      <style>{`
        .account-delete-zone{margin-top:22px;padding:16px 18px;border:1px solid #efd5cc;border-radius:14px;background:#fffaf8;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .account-delete-zone b{display:block;color:#222631;font-size:14px;margin-bottom:4px}.account-delete-zone span{display:block;color:#7a625c;font-size:12px;line-height:1.5;max-width:720px}
        .account-delete-open{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid #e7a894;background:#fff;color:#b64d2a;border-radius:11px;padding:9px 15px;font:inherit;font-size:13px;font-weight:850;cursor:pointer;white-space:nowrap;box-shadow:0 2px 7px rgba(182,77,42,.05);transition:background .15s ease,border-color .15s ease,transform .15s ease}
        .account-delete-open:hover{background:#fff2ed;border-color:#d98569}.account-delete-open:active{transform:translateY(1px)}
        @media(max-width:560px){.account-delete-zone{align-items:stretch}.account-delete-open{width:100%}}
      `}</style>
      <div>
        <b>Paskyros ištrynimas</b>
        <span>
          {description ||
            "Ištrynus paskyrą jos atkurti nebus galima. Prieš trynimą bus sustabdyta aktyvi prenumerata."}
        </span>
      </div>
      <button className="account-delete-open" type="button" onClick={onDelete}>
        Ištrinti paskyrą
      </button>
    </div>
  );
}

export function AccountBugReportZone({ onOpen, successMessage = "" }) {
  return (
    <>
      {successMessage && (
        <div className="account-bug-success">{successMessage}</div>
      )}
      <div className="account-bug-zone">
      <style>{`
        .account-bug-success{margin-top:12px;padding:12px 16px;border:1px solid #bfe1d0;border-radius:12px;background:#eef9f3;color:#167a54;font-size:13px;font-weight:800;line-height:1.45}
        .account-bug-zone{margin-top:12px;padding:16px 18px;border:1px solid #dbe5eb;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .account-bug-zone b{display:block;color:#222631;font-size:14px;margin-bottom:4px}.account-bug-zone span{display:block;color:#6c7a88;font-size:12px;line-height:1.5;max-width:720px}
        .account-bug-open{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid #d4dee5;background:#fff;color:#222631;border-radius:11px;padding:9px 15px;font:inherit;font-size:13px;font-weight:850;cursor:pointer;white-space:nowrap;box-shadow:0 2px 7px rgba(34,38,49,.04)}
        .account-bug-open:hover{background:#f7fafb;border-color:#c2d0da}
        @media(max-width:560px){.account-bug-zone{align-items:stretch}.account-bug-open{width:100%}}
      `}</style>
      <div>
        <b>Pastebėjote svetainės klaidą?</b>
        <span>Aprašykite, kas nutiko. Pranešimas bus perduotas administratoriui kartu su jūsų vardu ir pateikimo laiku.</span>
      </div>
      <button className="account-bug-open" type="button" onClick={onOpen}>
        Pranešti apie svetainės klaidą
      </button>
      </div>
    </>
  );
}

export function BugReportModal({ open, onClose, onSubmitted }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setError("");
  }, [open]);

  if (!open) return null;

  async function submitBugReport() {
    const text = message.trim();
    if (text.length < 10) {
      setError("Aprašykite klaidą bent 10 simbolių.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await supabase.rpc("report_site_bug", { p_message: text });
      if (result.error) throw result.error;
      onClose();
      onSubmitted?.();
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti klaidos pranešimo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <P24Modal eyebrow="Svetainės klaida" title="Pranešti administratoriui" sub="Trumpai aprašykite, ką darėte, ką paspaudėte ir kokią klaidą pamatėte." onClose={onClose} busy={busy}>
      <label className="field"><span className="sr">Klaidos aprašymas</span><textarea value={message} maxLength={4000} onChange={(e) => setMessage(e.target.value)} placeholder="Pvz. paspaudus „Išsaugoti“ pasirodė baltas ekranas..." style={{ minHeight: 140 }} /></label>
      {error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn" type="button" disabled={busy} onClick={onClose}>Atšaukti</button>
        <button className="btn primary" type="button" disabled={busy || message.trim().length < 10} onClick={submitBugReport}>{busy ? "Siunčiama..." : "Išsiųsti pranešimą"}</button>
      </div>
    </P24Modal>
  );
}


export function BugResolutionNotice({ userId }) {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!userId || !supabase) {
      setNotice(null);
      return undefined;
    }

    let cancelled = false;

    supabase
      .rpc("get_my_pending_bug_resolution_notice")
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setNotice(data?.[0] || null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function acknowledge(reportId) {
    setNotice(null);
    if (!reportId || !supabase) return;

    const result = await supabase.rpc("acknowledge_bug_resolution_notice", {
      p_report_id: reportId,
    });

    if (result.error) console.error(result.error);
  }

  useEffect(() => {
    if (!notice?.report_id) return undefined;

    const timer = window.setTimeout(() => {
      acknowledge(notice.report_id);
    }, 60 * 1000);

    return () => window.clearTimeout(timer);
  }, [notice?.report_id]);

  if (!notice) return null;

  const reward = Number(notice.reward_points || 0);

  return (
    <div className="bug-resolution-banner" role="status">
      <style>{`
        .bug-resolution-banner{width:100%;min-width:0;box-sizing:border-box;margin:0 0 14px;padding:12px 14px;border:1px solid #b9decf;border-radius:13px;background:#eef8f3;color:#125f45;box-shadow:0 4px 14px rgba(34,38,49,.035);display:flex;align-items:center;justify-content:space-between;gap:14px;clear:both}
        .bug-resolution-banner-copy{display:grid;gap:2px;min-width:0}
        .bug-resolution-banner-copy b{color:#146f4d;font-size:13px;line-height:1.35}
        .bug-resolution-banner-copy span{font-size:12px;line-height:1.45;color:#356f5b}
        .bug-resolution-banner-close{flex:0 0 auto;border:1px solid #b9decf;background:#fff;color:#146f4d;border-radius:9px;width:38px;height:34px;display:grid;place-items:center;cursor:pointer}
        .bug-resolution-banner-close:hover{background:#f7fcf9}
        @media(max-width:700px){.bug-resolution-banner{align-items:flex-start}.bug-resolution-banner-close{width:34px}}
      `}</style>
      <div className="bug-resolution-banner-copy">
        <b>Svetainės klaida sutvarkyta</b>
        <span>
          Jūsų pranešta svetainės klaida pašalinta. Ačiū, kad padėjote gerinti platformą.{" "}
          {reward > 0
            ? `Jums pridėtas +${reward} patikimumo taškas.`
            : "Patikimumo balas jau buvo 100 / 100, todėl papildomi taškai nepridėti."}
        </span>
      </div>
      <button
        className="bug-resolution-banner-close"
        type="button"
        aria-label="Uždaryti pranešimą"
        onClick={() => acknowledge(notice.report_id)}
      >
        <CloseMark />
      </button>
    </div>
  );
}


// Web Push belongs to the main statybos24.lt project only, never /hire.
// First-party, consent-free in-page alerts for the primary Statybos24 project.
// Unlike system Web Push, these require the main website to be open.
export function MainSiteInPageAlerts({ user, kind }) {
  const [alerts, setAlerts] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id || !supabase || isHireProjectPath) return undefined;
    let stopped = false;
    let busy = false;
    const timeouts = new Set();
    const storageKey = `s24-in-page-alerts-v1:${user.id}`;
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) seenRef.current = new Set(stored.slice(-150));
    } catch { seenRef.current = new Set(); }
    setAlerts([]);

    const descriptions = {
      message: "Gavote naują žinutę",
      invitation_accepted: "Darbuotojas priėmė kvietimą",
      invitation_declined: "Darbuotojas atmetė kvietimą",
      invitation_cancelled: "Darbo kvietimas atšauktas",
      invitation_expired: "Darbo kvietimas nebegalioja",
      job_updated: "Pakeista darbo informacija",
      worker_checked_in: "Darbuotojas pažymėjo atvykimą",
      employer_checked_in: "Atvykimas patvirtintas",
      attendance_action_required: "Reikia atlikti veiksmą dėl darbo dienos",
      attendance_review_required: "Peržiūrėkite darbo dieną",
      attendance_finalized: "Darbo diena užbaigta",
      attendance_disputed: "Gautas darbo dienos ginčas",
      attendance_resolved: "Darbo dienos ginčas išspręstas",
      attendance_resolved_in_favor: "Ginčas išspręstas",
      attendance_resolved_against: "Ginčas išspręstas",
    };

    async function checkNewAlerts() {
      if (stopped || busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const requests = [supabase.from("job_notifications")
          .select("id,event_type,created_at")
          .eq("recipient_id", user.id).is("read_at", null)
          .gte("created_at", since)
          .order("created_at", { ascending: false }).limit(15)];
        if (kind === "worker") {
          requests.push(supabase.from("job_invitations")
            .select("id,invited_at")
            .eq("worker_id", user.id).eq("status", "pending")
            .gte("invited_at", since)
            .order("invited_at", { ascending: false }).limit(15));
        }
        const result = await Promise.all(requests);
        if (stopped) return;
        const entries = [];
        if (!result[0]?.error) {
          for (const row of result[0]?.data || []) {
            entries.push({ key:`notice:${row.id}`, time:row.created_at,
              title:descriptions[row.event_type] || "Naujas pranešimas" });
          }
        }
        if (kind === "worker" && !result[1]?.error) {
          for (const row of result[1]?.data || []) {
            entries.push({ key:`invite:${row.id}`, time:row.invited_at,
              title:"Gavote naują darbo kvietimą" });
          }
        }
        const unseen = entries
          .filter(item => !seenRef.current.has(item.key))
          .sort((a,b) => String(a.time).localeCompare(String(b.time)));
        // Show at most two at a time, without replaying the same event after refresh.
        for (const item of unseen.slice(0,2)) {
          seenRef.current.add(item.key);
          const timer = window.setTimeout(() => {
            timeouts.delete(timer);
            if (!stopped) setAlerts(current => current.filter(a => a.key !== item.key));
          }, 9000);
          timeouts.add(timer);
        }
        if (unseen.length) {
          try { window.localStorage.setItem(storageKey, JSON.stringify([...seenRef.current].slice(-150))); } catch {}
          const shown = unseen.slice(0,2);
          setAlerts(current => [...current, ...shown].slice(-3));
        }
      } catch {
        // A notification check must never prevent ordinary website use.
      } finally { busy = false; }
    }

    checkNewAlerts();
    const interval = window.setInterval(checkNewAlerts, 20000);
    document.addEventListener("visibilitychange", checkNewAlerts);
    window.addEventListener("focus", checkNewAlerts);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkNewAlerts);
      window.removeEventListener("focus", checkNewAlerts);
      for (const timer of timeouts) window.clearTimeout(timer);
    };
  }, [user?.id, kind]);

  if (!user?.id || isHireProjectPath || !alerts.length) return null;
  return createPortal(
    <div aria-live="polite" aria-relevant="additions" style={{
      position:"fixed",top:"max(15px, env(safe-area-inset-top, 0px))",right:12,
      width:"min(365px, calc(100vw - 24px))",display:"grid",gap:9,
      zIndex:6500,pointerEvents:"none",
    }}>
      {alerts.map(alert => (
        <div key={alert.key} role="status" style={{
          display:"flex",gap:12,alignItems:"flex-start",padding:"13px 14px",
          background:"#fff",border:"1px solid #dfE7ED",borderLeft:"4px solid #6b5b95",
          borderRadius:14,boxShadow:"0 12px 38px rgba(34,38,49,.18)",
          fontFamily:"Inter,system-ui,sans-serif",color:"#222631",pointerEvents:"auto",
        }}>
          <div style={{flex:1,minWidth:0}}>
            <strong style={{display:"block",fontSize:13,lineHeight:1.35}}>Statybos24</strong>
            <span style={{display:"block",fontSize:12,lineHeight:1.5,marginTop:3}}>{alert.title}</span>
          </div>
          <button type="button" aria-label="Uždaryti pranešimą" onClick={() => setAlerts(current => current.filter(a => a.key !== alert.key))}
            style={{cursor:"pointer",border:0,background:"#f1f4f6",color:"#526374",width:28,height:28,
              flex:"0 0 28px",borderRadius:8,fontSize:17,lineHeight:1}}>×</button>
        </div>
      ))}
    </div>,document.body
  );
}

export function WebPushSettings({ user, kind = "worker", profileOpen = false }) {
  // No header control or registration checkbox: consent is requested only after login.
  const [consentOpen, setConsentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [pushStep, setPushStep] = useState("");
  const [pushStatus, setPushStatus] = useState("checking");
  const [profileAnchor, setProfileAnchor] = useState(null);
  // A new login-only consent version gives accounts that saw the older signup flow
  // a chance to decide here instead. A deliberate "Ne" is remembered per device.
  const decisionKey = `s24-push-login-consent-v2:${user?.id || "guest"}`;
  const legacyOptOutKey = `s24-webpush-disabled:${user?.id || "guest"}`;
  const supported = typeof window !== "undefined" && window.isSecureContext &&
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  async function pushRequest(body) {
    const { data, error } = await supabase.functions.invoke("statybos24-webpush", { body });
    if (error) throw new Error("Nepavyko susisiekti su pranešimų paslauga.");
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function ensurePushSubscription() {
    await navigator.serviceWorker.register("/statybos24-push-sw.js", {
      scope: "/", updateViaCache: "none",
    });
    // Browser installs the worker asynchronously; PushManager needs an ACTIVE worker.
    // In an installed Android PWA this is often the very first registration.
    const registration = await navigator.serviceWorker.ready;
    const config = await pushRequest({ action: "config" });
    if (!config?.public_key) throw new Error("Pranešimų serveris dar neparuoštas.");
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const keyString = config.public_key.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(keyString.padEnd(Math.ceil(keyString.length / 4) * 4, "="));
      const applicationServerKey = Uint8Array.from(raw, c => c.charCodeAt(0));
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey,
      });
    }
    const data = subscription.toJSON();
    await pushRequest({ action: "subscribe", subscription: {
      endpoint: subscription.endpoint,
      keys: { p256dh: data.keys?.p256dh, auth: data.keys?.auth },
    } });
  }

  function rememberDecision(value) {
    try { window.localStorage.setItem(decisionKey, value); } catch {}
  }

  function readablePushError(error) {
    const name = String(error?.name || "");
    if (name === "NotAllowedError" || name === "SecurityError") {
      return "Telefonas arba naršyklė neleidžia pranešimų. Patikrinkite programėlės ir „Chrome“ pranešimų leidimus nustatymuose.";
    }
    if (name === "InvalidStateError") {
      return "Nepavyko paruošti pranešimų paslaugos. Uždarykite programėlę, atidarykite iš naujo ir bandykite dar kartą.";
    }
    if (name === "AbortError") {
      return "Telefono pranešimų registracija nutrūko. Bandykite dar kartą.";
    }
    return error instanceof Error && error.message
      ? error.message : "Nepavyko užregistruoti šio įrenginio pranešimams.";
  }

  // The status control lives INSIDE profile settings; nothing is rendered
  // beside the header's Profile / Log out controls.
  useEffect(() => {
    if (!profileOpen || typeof document === "undefined" || isHireProjectPath) {
      setProfileAnchor(null);
      return;
    }
    setProfileAnchor(document.getElementById(
      kind === "employer" ? "s24-employer-push-settings" : "s24-worker-push-settings"
    ));
  }, [profileOpen, kind]);

  useEffect(() => {
    let active = true;
    setProblem("");
    setPushStep("");
    setConsentOpen(false);
    setPushStatus("checking");
    if (isHireProjectPath || !user?.id) return undefined;
    if (!supported) {
      setPushStatus("unsupported");
      return undefined;
    }
    // Chrome will NOT show a native prompt for a previously blocked origin.
    // Do not show a misleading Yes/No popup that cannot enable anything.
    if (Notification.permission === "denied") {
      setPushStatus("blocked");
      setConsentOpen(false);
      return undefined;
    }

    (async () => {
      let savedDecision = null;
      let previouslyDisabled = false;
      try {
        savedDecision = window.localStorage.getItem(decisionKey);
        previouslyDisabled = window.localStorage.getItem(legacyOptOutKey) === "1";
      } catch {}
      if (!active) return;
      if (savedDecision === "declined" || savedDecision === "later") {
        setPushStatus("off");
        return;
      }

      // Browser permission is already enough: no extra confirmation click.
      // Respect a previous explicit opt-out until changed in Profile.
      if (Notification.permission === "granted" && !previouslyDisabled) {
        try {
          await ensurePushSubscription();
          if (active) {
            rememberDecision("accepted");
            setPushStatus("on");
          }
        } catch (error) {
          if (active) {
            setPushStatus("off");
            // A temporary network/registration error must not block the account.
            // Details are available inside Profile → Pranešimai instead.
            setProblem(readablePushError(error));
            setConsentOpen(false);
          }
        }
      } else if (active) {
        setPushStatus(Notification.permission === "denied" ? "blocked" : "off");
        // Only ask when the native browser grant can actually be requested.
        setConsentOpen(Notification.permission === "default");
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  async function decline(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (busy) return;
    // "Ne" closes the consent immediately. Network errors must never trap anyone.
    try { window.localStorage.setItem(legacyOptOutKey, "1"); } catch {}
    rememberDecision("declined");
    setPushStatus("off");
    setConsentOpen(false);
    setPushStep("");
    setProblem("");
    setBusy(true);
    try {
      // Stop existing notifications on this device if the person previously opted in.
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) {
        // Unsubscribe locally first, even when the backend is temporarily unavailable.
        const removed = await subscription.unsubscribe();
        if (!removed) throw new Error("Nepavyko išjungti pranešimų šiame įrenginyje.");
        await pushRequest({ action: "unsubscribe", endpoint: subscription.endpoint });
      }
    } catch (error) {
      // Any issue can be handled later in Profile, but the dialog stays closed.
      setProblem(readablePushError(error));
    } finally {
      setBusy(false);
    }
  }

  async function accept(event) {
    // A React portal can still bubble click events through its React parent.
    // Prevent accidental form/header actions in the installed app.
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (busy || !supported || !user?.id) return;
    if (Notification.permission === "denied") {
      setPushStatus("blocked");
      setProblem("");
      setConsentOpen(false);
      return;
    }

    // Persist the user's positive choice BEFORE opening Android's native permission UI.
    // Some installed PWAs suspend/reload while this system UI is opening. On the next
    // startup, useEffect will resume subscription if permission became "granted".
    rememberDecision("accepted");
    try { window.localStorage.removeItem(legacyOptOutKey); } catch {}
    setBusy(true);
    setProblem("");
    setPushStep("Tikrinamas įrenginio pranešimų leidimas…");

    // Must run directly from the click handler, before any awaited call.
    let permissionPromise;
    try {
      permissionPromise = Notification.permission === "granted"
        ? Promise.resolve("granted")
        : Notification.requestPermission();
    } catch (error) {
      // If opening Android permission UI fails, the person can still use the app.
      rememberDecision("later");
      setProblem(readablePushError(error));
      setConsentOpen(false);
      setPushStep("");
      setPushStatus("off");
      setBusy(false);
      return;
    }
    try {
      const permission = await permissionPromise;
      if (permission !== "granted") {
        setPushStatus(permission === "denied" ? "blocked" : "off");
        // No lengthy instructions or retry loop: dismiss the onboarding.
        // A dismissed browser prompt can be enabled later in Profile.
        if (permission === "default") rememberDecision("later");
        setProblem("");
        setConsentOpen(false);
        return;
      }
      setPushStep("Registruojami šio įrenginio pranešimai…");
      await ensurePushSubscription();
      rememberDecision("accepted");
      setPushStatus("on");
      setConsentOpen(false);
    } catch (error) {
      // Native permission may be granted while a network request fails.
      // Keep the accepted choice for automatic retry on the next sign-in.
      setPushStatus(Notification.permission === "denied" ? "blocked" : "off");
      setProblem(readablePushError(error));
      setConsentOpen(false);
    } finally {
      setPushStep("");
      setBusy(false);
    }
  }

  if (!user?.id || isHireProjectPath) return null;
  return <>
    {profileAnchor && profileAnchor.dataset?.variant === "p24" && createPortal(
      <div className="setrow">
        <span className="setic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>
        <div className="settx"><b>Pranešimai telefone</b><span>
          {pushStatus === "blocked" ? "Užblokuoti šiame įrenginyje. Leidimą pakeiskite naršyklės ar įrenginio nustatymuose."
            : pushStatus === "unsupported" ? "Šiame įrenginyje ar naršyklėje pranešimai nepalaikomi."
            : busy ? "Vykdoma..."
            : kind === "employer" ? "Darbuotojų atsakymai ir darbų atnaujinimai" : "Nauji kvietimai, žinutės ir grafiko priminimai"}
          {problem && <span className="pushprob" role="alert">{problem}</span>}
        </span></div>
        <button type="button" className={`tgl${pushStatus === "on" ? " on" : ""}`} role="switch" aria-checked={pushStatus === "on"} aria-label="Pranešimai telefone"
          onClick={pushStatus === "on" ? decline : accept}
          disabled={busy || pushStatus === "checking" || pushStatus === "unsupported" || pushStatus === "blocked"}><i /></button>
      </div>, profileAnchor
    )}
    {profileAnchor && profileAnchor.dataset?.variant !== "p24" && createPortal(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",padding:"15px 17px",border:"1px solid #e2e9ee",background:"#f7f9fb",borderRadius:12,margin:"10px 0 20px"}}>
        <div style={{flex:"1 1 215px",minWidth:0}}>
          <strong style={{display:"block",fontSize:15,color:"#222631",marginBottom:5}}>Pranešimai</strong>
          <div style={{fontSize:12,lineHeight:1.5,color:"#607180"}}>
            {pushStatus === "on" ? "Įjungti šiame įrenginyje."
              : pushStatus === "blocked" ? "Užblokuoti šiame įrenginyje. Leidimą pakeiskite naršyklės ar įrenginio nustatymuose."
              : pushStatus === "unsupported" ? "Šiame įrenginyje ar naršyklėje pranešimai nepalaikomi."
              : kind === "employer" ? "Pranešimai apie darbuotojų atsakymus ir darbus."
              : "Darbo pasiūlymai, atnaujinimai ir grafiko priminimai."}
          </div>
          {problem && <div role="alert" style={{fontSize:12,lineHeight:1.5,color:"#433960",marginTop:6}}>{problem}</div>}
        </div>
        <button type="button" className="btn ghost" onClick={pushStatus === "on" ? decline : accept}
          disabled={busy || pushStatus === "checking" || pushStatus === "unsupported" || pushStatus === "blocked"}
          style={{minHeight:42,border:"1px solid #d4dce4",borderRadius:9,background:"#fff",color:"#222631",fontWeight:650,justifyContent:"center",padding:"8px 14px"}}>
          {busy ? "Vykdoma..." : pushStatus === "on" ? "Išjungti" : pushStatus === "blocked" ? "Užblokuota" : pushStatus === "unsupported" ? "Nepalaikoma" : "Įjungti"}
        </button>
      </div>, profileAnchor
    )}
    {supported && consentOpen && createPortal(
    <div role="presentation" style={{position:"fixed",inset:0,display:"grid",placeItems:"center",background:"rgba(34,38,49,.62)",zIndex:7600,padding:16}}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="s24-login-push-title" aria-describedby="s24-login-push-description"
        style={{width:"min(390px,100%)",background:"#fff",color:"#222631",border:"1px solid #dfe7ed",borderRadius:18,padding:"28px 24px",boxShadow:"0 22px 70px rgba(34,38,49,.27)",textAlign:"center"}}>
        <h3 id="s24-login-push-title" style={{fontSize:20,lineHeight:1.3,margin:"0 0 15px",fontWeight:800}}>Ar sutinkate gauti pranešimus?</h3>
        <p id="s24-login-push-description" style={{fontSize:14,lineHeight:1.65,margin:"0 0 22px",color:"#405264"}}>
          {kind === "employer"
            ? "Sutikdami gausite pranešimus apie darbuotojų atsakymus, darbo atnaujinimus ir priminimus."
            : "Sutikdami gausite pranešimus apie gautus darbo pasiūlymus, darbo atnaujinimus, grafiko atnaujinimą ir priminimus."}
        </p>
        {pushStep && <p role="status" style={{fontSize:13,lineHeight:1.5,color:"#405264",margin:"0 0 14px"}}>{pushStep}</p>}
        {problem && <p role="alert" style={{fontSize:13,lineHeight:1.5,color:"#9e4013",margin:"0 0 14px"}}>{problem}</p>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <button type="button" className="btn ghost" onClick={decline} disabled={busy}
            style={{minHeight:46,border:"1px solid #d4dce4",borderRadius:10,background:"#fff",color:"#222631",fontSize:15,fontWeight:750,justifyContent:"center"}}>Ne</button>
          <button type="button" className="btn ghost" onClick={accept} disabled={busy}
            style={{minHeight:46,border:"1px solid #d4dce4",borderRadius:10,background:"#fff",color:"#222631",fontSize:15,fontWeight:750,justifyContent:"center"}}>{busy ? "Jungiama..." : "Taip"}</button>
        </div>
      </section>
    </div>, document.body
    )}
  </>;
}
