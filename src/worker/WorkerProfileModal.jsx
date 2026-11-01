import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { Svg } from "../p24/Shell.jsx";
import { Pill } from "../p24/ui.jsx";
import { AwardPanel } from "../p24/worker/WorkerProfileEditor.jsx";
import { shortWorkerName } from "../employer/plans.js";

/* Prototipo „workerProfile“ langas: darbuotojo profilis darbdaviui (ir administratoriui). */

const HEART = (on) => `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"${on ? ' fill="currentColor"' : ""}/>`;
const activeLabel = (iso) => {
  if (!iso) return "";
  const h = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (!Number.isFinite(h)) return "";
  if (h < 24) return "Aktyvus šiandien";
  if (h < 48) return "Aktyvus vakar";
  if (h < 24 * 7) return `Aktyvus prieš ${Math.floor(h / 24)} d.`;
  return "";
};
const todayISO = () => new Date().toISOString().slice(0, 10);

export function WorkerProfileModal({ worker, jobId, canViewWorkerMetrics = false, onClose, isFavorite, onToggleFavorite, contactsLocked = false, onPlans }) {
  const [card, setCard] = useState(null);
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [awards, setAwards] = useState([]);
  const [docs, setDocs] = useState([]);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    if (!worker?.id) return undefined;
    let off = false;
    setCard(null); setAwards([]); setDocs([]);
    supabase.rpc("worker_profile_card_v1", { p_worker_id: worker.id }).then(({ data }) => { if (!off) setCard(data || null); });
    supabase.from("monthly_awards").select("id, award_month, recipient_type, recipient_id, award_type, metric_value, metric_count, metric_detail, created_at")
      .eq("recipient_type", "worker").eq("recipient_id", worker.id).order("award_month", { ascending: false }).limit(12)
      .then(({ data }) => { if (!off) setAwards(data || []); });
    supabase.from("worker_documents").select("id, doc_type, valid_until, file_path, file_name").eq("worker_id", worker.id).eq("show_to_employers", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (!off) setDocs((data || []).filter((d) => !d.valid_until || d.valid_until >= todayISO())); });
    return () => { off = true; };
  }, [worker?.id]);

  useEffect(() => {
    setPhone(worker?.phone || "");
    if (!worker?.id || !jobId || worker?.phone) return undefined;
    let off = false;
    supabase.rpc("get_worker_contact", { p_worker_id: worker.id, p_job_id: jobId }).then(({ data }) => { if (!off) setPhone(data?.[0]?.phone || ""); });
    return () => { off = true; };
  }, [worker?.id, worker?.phone, jobId]);

  if (!worker) return null;

  const stats = worker.publicStats || {};
  const att = stats.attendanceRate ?? worker.attendanceRate;
  const rating = stats.ratingAverage ?? worker.ratingAverage;
  const ratingCount = Number(stats.ratingCount ?? worker.ratingCount ?? 0);
  const completed = card?.completed_jobs ?? worker.completedJobs;
  const active = activeLabel(card?.last_active_at || worker.lastActiveAt);
  const bio = (worker.shortBio || card?.short_bio || "").trim() || "Darbuotojas dar nepateikė savo patirties aprašymo.";
  const licenseB = worker.hasDrivingLicenseB ?? card?.has_driving_license_b;

  async function copy() {
    try { await navigator.clipboard.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* naršyklė neleido */ }
  }
  async function openDoc(d) {
    const { data } = await supabase.storage.from("worker-documents").createSignedUrl(d.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }
  async function toggleFav() {
    if (!onToggleFavorite || favBusy) return;
    setFavBusy(true);
    try { await onToggleFavorite(worker); } finally { setFavBusy(false); }
  }

  return (
    <div className="p24 p24-portal">
      <div className="modal-bg" style={{ zIndex: 9000 }} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wp-title">
          <header>
            <div className="wph">
              {onToggleFavorite ? <button type="button" className={`favbtn${isFavorite ? " on" : ""}`} title="Mėgstamas darbuotojas" aria-pressed={Boolean(isFavorite)} disabled={favBusy} onClick={toggleFav}><Svg size={17} paths={HEART(isFavorite)} /></button> : null}
              <h2 id="wp-title">{shortWorkerName(worker.name || "Darbuotojas")}</h2>
              <span className="muted small">{[worker.city, active].filter(Boolean).join(" · ")}</span>
            </div>
            <button type="button" className="x" style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 4 }} aria-label="Uždaryti" onClick={onClose}><Svg name="x" size={18} width={2.2} /></button>
          </header>

          {worker.isDemoProfile ? <div className="notebox">Pavyzdinis profilis · išgalvoti duomenys.</div> : null}

          {phone ? (
            <div className="wpc"><div className="wpc-ph"><small>Telefonas</small><b>{phone}</b></div>
              <div className="wpc-a"><a className="btn sm dark" href={`tel:${phone.replace(/\s/g, "")}`}><Svg name="phone" size={15} />Skambinti</a>
                <button className="btn sm" type="button" onClick={copy}>{copied ? "Nukopijuota" : "Kopijuoti"}</button></div></div>
          ) : contactsLocked && onPlans ? (
            <button type="button" className="wpc lk" onClick={() => { onClose(); onPlans(); }}><Svg name="lock" size={16} width={2.2} /><span><b>Kontaktai</b><small>Prieinama Business Pro plane</small></span><span className="btn sm primary">Atrakinti</span></button>
          ) : null}

          {canViewWorkerMetrics ? (
            <div className="stats">
              <div className="stat"><small>Atvykimo patikimumas</small><b>{att == null ? "–" : Math.round(Number(att))}</b></div>
              <div className="stat"><small>Darbdavių įvertinimas</small><b>{rating == null ? "–" : Number(rating).toFixed(1).replace(".", ",")}</b>{ratingCount ? <span>{`Iš ${ratingCount} įvertinimų`}</span> : rating == null ? <span>Dar nėra vertinimų</span> : null}</div>
              <div className="stat"><small>Užbaigti darbai</small><b>{completed ?? "–"}</b></div>
            </div>
          ) : (
            <div className="stats">
              <div className="stat"><small>Užbaigti darbai</small><b>{completed ?? "–"}</b></div>
              {onPlans ? <button type="button" className="stat" onClick={() => { onClose(); onPlans(); }}><small>Patikimumas ir įvertinimai</small><b style={{ fontSize: 15 }}><Svg name="lock" size={14} width={2.2} /> Business</b><span>Peržiūrėti planus</span></button> : null}
            </div>
          )}

          {licenseB ? <div className="tags"><span className="tag">B kategorijos vairuotojo pažymėjimas</span></div> : null}
          <div className="kv"><div className="wide"><small>Patirtis</small><b style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{bio}</b></div></div>

          {docs.length ? (
            <div className="mdocs"><h3>Pažymėjimai ir dokumentai</h3><div className="mdlist">
              {docs.map((d) => (
                <button type="button" className="mdrow" key={d.id} onClick={() => openDoc(d)}>
                  <span className="setic"><Svg name="file" size={17} /></span>
                  <span className="htx"><b>{d.doc_type}</b><small>{d.valid_until ? `Galioja iki ${d.valid_until}` : "Neterminuotas"}</small></span>
                  <Pill tone="green">Galioja</Pill><span className="mdgo"><Svg name="eye" size={16} /></span>
                </button>
              ))}
            </div></div>
          ) : null}

          <AwardPanel awards={awards} />
        </div>
      </div>
    </div>
  );
}
