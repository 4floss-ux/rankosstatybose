import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { formatWorkedMinutes } from "../lib/jobs.js";
import { MonthlyAwardMiniList } from "../awards/monthlyAwards.jsx";

export function WorkerProfileModal({
  worker,
  jobId,
  canViewWorkerMetrics = false,
  onClose,
}) {
  const [ratingReviews, setRatingReviews] = useState([]);
  const [ratingReviewsLoading, setRatingReviewsLoading] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [monthlyAwards, setMonthlyAwards] = useState([]);

  useEffect(() => {
    if (!worker?.id) {
      setRatingReviews([]);
      setRatingReviewsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRatingReviews() {
      setRatingReviewsLoading(true);

      const result = await supabase.rpc("get_worker_recent_ratings", {
        p_worker_id: worker.id,
        p_limit: 3,
      });

      if (!cancelled) {
        setRatingReviews(result.error ? [] : result.data || []);
        setRatingReviewsLoading(false);
      }
    }

    loadRatingReviews();

    return () => {
      cancelled = true;
    };
  }, [worker?.id]);

  useEffect(() => {
    if (!worker?.id) {
      setMonthlyAwards([]);
      return;
    }

    let cancelled = false;

    async function loadMonthlyAwards() {
      const result = await supabase
        .from("monthly_awards")
        .select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
        .eq("recipient_type", "worker")
        .eq("recipient_id", worker.id)
        .order("award_month", { ascending: false })
        .limit(120);

      if (!cancelled) {
        setMonthlyAwards(result.error ? [] : result.data || []);
      }
    }

    loadMonthlyAwards();

    return () => {
      cancelled = true;
    };
  }, [worker?.id]);

  useEffect(() => {
    if (!worker?.id || !jobId) {
      setContactPhone("");
      setContactError("");
      return;
    }

    let cancelled = false;

    async function loadContact() {
      setContactLoading(true);
      setContactError("");

      try {
        const result = await supabase.rpc("get_worker_contact", {
          p_worker_id: worker.id,
          p_job_id: jobId,
        });

        if (result.error) throw result.error;

        if (!cancelled) {
          setContactPhone(result.data?.[0]?.phone || "");
        }
      } catch (err) {
        if (!cancelled) {
          setContactPhone("");
          setContactError(
            err?.message || "Nepavyko įkelti darbuotojo telefono numerio."
          );
        }
      } finally {
        if (!cancelled) setContactLoading(false);
      }
    }

    loadContact();

    return () => {
      cancelled = true;
    };
  }, [worker?.id, jobId]);

  async function copyWorkerPhone() {
    if (!contactPhone) return;

    try {
      await navigator.clipboard.writeText(contactPhone);
      setPhoneCopied(true);
      window.setTimeout(() => setPhoneCopied(false), 1800);
    } catch {
      setContactError("Nepavyko nukopijuoti telefono numerio.");
    }
  }

  if (!worker) return null;

  const stats = worker.publicStats || {};
  const monthMinutes = Number(stats.monthWorkedMinutes || 0);
  const reviewAverage = ratingReviews.length
    ? ratingReviews.reduce((sum, review) => sum + Number(review.score || 0), 0) / ratingReviews.length
    : null;
  const rawRatingAverage = stats.ratingAverage ?? worker.ratingAverage ?? null;
  const rawRatingCount = Number(stats.ratingCount ?? worker.ratingCount ?? 0);
  const ratingCount = rawRatingCount > 0 ? rawRatingCount : ratingReviews.length;
  const ratingAverage =
    rawRatingAverage === null || rawRatingAverage === undefined
      ? reviewAverage
      : Number(rawRatingAverage);
  const attendanceRate =
    Number(stats.attendanceRate ?? worker.attendanceRate ?? 100);
  const noShows =
    Number(stats.noShowCount ?? worker.noShowCount ?? 0);
  const earlyLeaves =
    Number(
      stats.unexcusedEarlyLeaveCount ??
        worker.unexcusedEarlyLeaveCount ??
        0
    );

  return (
    <div
      className="rs-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rs-modal-card worker-profile-modal">
        <style>{`
          .rs-modal-overlay{position:fixed;inset:0;background:rgba(16,36,56,.62);z-index:2000;display:grid;place-items:center;padding:20px}
          .worker-profile-modal{width:min(700px,100%);max-height:calc(100dvh - 40px);overflow:hidden;background:#fff;border:1px solid rgba(16,36,56,.08);border-radius:20px;box-shadow:0 26px 80px rgba(16,36,56,.25);padding:0;color:#102438}
          .worker-profile-modal-scroll{max-height:calc(100dvh - 40px);overflow:auto;padding:22px;box-sizing:border-box;scrollbar-gutter:stable}
          .rs-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
          .rs-modal-head h2{margin:0;font-family:Manrope,Inter,sans-serif;font-size:22px}.rs-close{border:0;background:#f1f4f6;border-radius:9px;width:38px;height:38px;font-size:20px;cursor:pointer}
          .rs-profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
          .rs-profile-stat{background:#f6f8fa;border:1px solid #e4ebf0;border-radius:12px;padding:13px}
          .rs-profile-stat span{display:block;font-size:11px;color:#6c7a88;margin-bottom:5px;line-height:1.3}.rs-profile-stat b{font-family:Manrope,Inter,sans-serif;font-size:18px}
          .rs-profile-phone{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
          .rs-profile-phone button{border:1px solid #dbe4ea;background:#fff;color:#102438;border-radius:8px;padding:6px 8px;font:inherit;font-size:10px;font-weight:800;cursor:pointer}
          .rs-profile-contact-error{margin-top:6px;font-size:11px;color:#b64d2a}
          .rs-profile-plan-lock{grid-column:1/-1;border:1px dashed #d7e0e7;background:#f8fafb;border-radius:12px;padding:13px 14px;color:#526374;font-size:12px;line-height:1.5}
          .rs-profile-plan-lock b{display:block;color:#102438;font-size:13px;margin-bottom:3px}
          .rs-profile-section{margin-top:18px}.rs-profile-section> b{font-family:Manrope,Inter,sans-serif}
          .rs-profile-experience{margin-top:18px;border:1px solid #e4ebf0;border-radius:16px;background:linear-gradient(180deg,#fff 0%,#fbfcfd 100%);padding:16px 18px;box-shadow:0 6px 18px rgba(16,36,56,.035)}
          .rs-profile-experience-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.rs-profile-experience-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#fff1e4;color:#d66f14;flex:0 0 34px}.rs-profile-experience-icon svg{width:18px;height:18px;display:block}
          .rs-profile-experience-title{min-width:0}.rs-profile-experience-title b{display:block;font-family:Manrope,Inter,sans-serif;font-size:15px;color:#102438}.rs-profile-experience-title span{display:block;margin-top:2px;color:#7a8996;font-size:11px}
          .rs-profile-experience-text{margin:0;padding:12px 14px;border-radius:11px;background:#f6f8fa;color:#526374;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
          .rs-review-list{display:grid;gap:10px;margin-top:10px}.rs-review{border:1px solid #e4ebf0;border-radius:12px;padding:13px;background:#fff}.rs-review-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:7px}.rs-review-score{font-family:Manrope,Inter,sans-serif;font-size:17px;font-weight:800}.rs-review-date{font-size:11px;color:#8a98a6}.rs-review p{margin:0;color:#4f6070;line-height:1.5;white-space:pre-wrap}.rs-profile-reviews .rs-review-list{margin-top:12px}.rs-profile-empty-note{margin-top:12px}
          @media(max-width:620px){
            .worker-profile-modal{border-radius:16px;max-height:calc(100dvh - 20px)}
            .worker-profile-modal-scroll{max-height:calc(100dvh - 20px);padding:15px;padding-bottom:max(28px,env(safe-area-inset-bottom));overscroll-behavior:contain}
            .rs-modal-head{margin-bottom:12px;gap:10px}
            .rs-profile-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
            .rs-profile-stat{min-width:0;padding:9px 8px;border-radius:10px}
            .rs-profile-stat span{font-size:9.5px;line-height:1.2;margin-bottom:4px;overflow-wrap:anywhere}
            .rs-profile-stat b{font-size:14px;line-height:1.2;overflow-wrap:anywhere;word-break:break-word}
            .rs-profile-stat:nth-child(2){grid-column:span 2}
            .rs-profile-phone{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px;align-items:center}
            .rs-profile-phone button{padding:5px 6px;font-size:9px;border-radius:7px}
            .rs-profile-section{margin-top:13px}
            .rs-profile-experience{margin-top:13px;padding:12px;border-radius:13px}
            .rs-profile-experience-head{margin-bottom:8px}
            .rs-profile-experience-text{padding:10px 11px;line-height:1.5;font-size:12px}
            .rs-review-list{gap:8px;margin-top:8px}
            .rs-review{padding:10px}
          }
        `}</style>

        <div className="worker-profile-modal-scroll">
        <div className="rs-modal-head">
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <MonthlyAwardMiniList awards={monthlyAwards} size={44} />
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#102438",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                overflow: "hidden",
                flex: "0 0 50px",
              }}
            >
              {worker.avatarUrl ? (
                <img
                  src={worker.avatarUrl}
                  alt={worker.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                worker.initials
              )}
            </div>
            <div>
              <div className="eyebrow">DARBUOTOJO PROFILIS</div>
              <h2>{worker.name}</h2>
            </div>
          </div>
          <button className="rs-close" onClick={onClose}><CloseMark /></button>
        </div>

        {worker.isDemoProfile && <div role="status" style={{marginBottom:14,padding:"11px 13px",border:"1px solid #f2d3b8",borderRadius:10,background:"#fff7ee",color:"#8a531d",fontSize:12,lineHeight:1.5}}><b>Demonstracinis profilis · Išgalvoti duomenys</b><br/>Naudojamas tikras profilio išdėstymas ir jūsų plano matomumo taisyklės. Tai nėra tikro žmogaus paskyra. Telefonas ir tikri atsiliepimai neįkeliami.</div>}
        <div className="rs-profile-grid">
          <div className="rs-profile-stat">
            <span>Miestas</span>
            <b>{worker.city || "—"}</b>
          </div>

          <div className="rs-profile-stat">
            <span>Telefonas</span>
            {contactLoading ? (
              <SilentLoader size={14} minHeight={20} />
            ) : contactPhone ? (
              <div className="rs-profile-phone">
                <b>{contactPhone}</b>
                <button type="button" onClick={copyWorkerPhone}>
                  {phoneCopied ? "Nukopijuota" : "Kopijuoti"}
                </button>
              </div>
            ) : (
              <b>—</b>
            )}
            {contactError && (
              <div className="rs-profile-contact-error">{contactError}</div>
            )}
          </div>

          <div className="rs-profile-stat">
            <span>Patirtis</span>
            <b>{Number(worker.yearsExperience || 0)} m.</b>
          </div>
          <div className="rs-profile-stat">
            <span>Dirbta šį mėnesį</span>
            <b>{Number(stats.monthWorkedDays || 0)} d.</b>
          </div>
          <div className="rs-profile-stat">
            <span>Valandų šį mėnesį</span>
            <b>{formatWorkedMinutes(monthMinutes)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Darbų šį mėnesį</span>
            <b>{Number(stats.monthJobs || 0)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Aktyvūs darbai</span>
            <b>{Number(stats.activeJobs || 0)}</b>
          </div>
          <div className="rs-profile-stat">
            <span>Darbdavio atšaukti</span>
            <b>{Number(stats.cancelledByEmployer || 0)}</b>
          </div>
          {canViewWorkerMetrics ? (
            <>
              <div className="rs-profile-stat">
                <span>Atvykimo patikimumas</span>
                <b>{Math.round(attendanceRate)}%</b>
              </div>
              <div className="rs-profile-stat">
                <span>Darbdavių įvertinimas</span>
                <b>
                  {ratingAverage === null || ratingAverage === undefined
                    ? "—"
                    : `${Number(ratingAverage).toFixed(1)} / 10`}
                </b>
                <span style={{ marginTop: 4, marginBottom: 0 }}>
                  {ratingCount ? `${ratingCount} vert.` : "Dar nėra vertinimų"}
                </span>
              </div>
              <div className="rs-profile-stat">
                <span>Neatvykimai</span>
                <b>{noShows}</b>
              </div>
              <div className="rs-profile-stat">
                <span>Nepagrįsti ankstyvi išėjimai</span>
                <b>{earlyLeaves}</b>
              </div>
            </>
          ) : (
            <div className="rs-profile-plan-lock">
              <b>Patikimumas ir įvertinimai · Business</b>
              Šie darbuotojo rodikliai prieinami Business ir Business Pro
              planuose.
            </div>
          )}
        </div>

        {worker.hasDrivingLicenseB && (
          <div className="rs-profile-section">
            <b>Vairuotojo pažymėjimas</b>
            <p style={{ margin: "6px 0 0", color: "#6c7a88" }}>
              Turi B kategoriją
            </p>
          </div>
        )}

        <div className="rs-profile-experience">
          <div className="rs-profile-experience-head">
            <span className="rs-profile-experience-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6V4h6v2" />
                <rect x="3" y="6" width="18" height="14" rx="3" />
                <path d="M3 11h18" />
                <path d="M10 14h4" />
              </svg>
            </span>
            <div className="rs-profile-experience-title">
              <b>Patirtis</b>
              <span>Darbuotojo pateiktas patirties aprašymas</span>
            </div>
          </div>
          <p className="rs-profile-experience-text">
            {worker.shortBio?.trim() || (Number(worker.yearsExperience || 0) > 0
              ? `Profilyje nurodyta ${Number(worker.yearsExperience)} m. patirtis. Išsamesnio aprašymo darbuotojas dar nepateikė.`
              : "Darbuotojas dar nepateikė savo patirties aprašymo.")}
          </p>
        </div>

        <div className="rs-profile-experience rs-profile-reviews">
          <div className="rs-profile-experience-head">
            <span className="rs-profile-experience-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.35l6.03-.88L12 3z" />
              </svg>
            </span>
            <div className="rs-profile-experience-title">
              <b>Darbdavių įvertinimai</b>
              <span>Paskutiniai darbuotojo gauti atsiliepimai</span>
            </div>
          </div>

          {ratingReviewsLoading ? (
            <SilentLoader size={18} minHeight={42} />
          ) : ratingReviews.length ? (
            <div className="rs-review-list">
              {ratingReviews.map((review) => (
                <div className="rs-review" key={review.id}>
                  <div className="rs-review-head">
                    <span className="rs-review-score">
                      {review.score} / 10
                    </span>
                    <span className="rs-review-date">
                      {new Date(review.created_at).toLocaleDateString("lt-LT")}
                    </span>
                  </div>

                  <p
                    style={
                      review.comment?.trim()
                        ? undefined
                        : { color: "#7a8996", fontStyle: "italic" }
                    }
                  >
                    {review.comment?.trim() || "Komentaro nepaliko."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rs-profile-experience-text rs-profile-empty-note">
              Dar nėra darbdavių įvertinimų.
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
