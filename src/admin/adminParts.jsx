import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ChatConductNotice } from "../ui/common.jsx";
import { CityAutocomplete, canonicalCityName } from "../ui/location.jsx";
import { formatJobTitle } from "../lib/jobs.js";
import { WorkerDashboard } from "../worker/WorkerDashboard.jsx";
import { employerPlanName } from "../employer/plans.js";
import { EmployerDashboard } from "../employer/EmployerDashboard.jsx";

export function AdminSetupModal({
  eyebrow,
  title,
  description,
  error,
  onClose,
  children,
}) {
  return (
    <div
      className="admin-setup-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        .admin-setup-overlay{position:fixed;inset:0;z-index:9500;background:rgba(34,38,49,.62);display:grid;place-items:center;padding:20px}
        .admin-setup-card{width:min(760px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border-radius:18px;box-shadow:0 28px 90px rgba(34,38,49,.30);padding:24px;color:#222631}
        .admin-setup-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}
        .admin-setup-head h2{font-family:Manrope,Inter,sans-serif;margin:4px 0 0;font-size:25px}
        .admin-setup-head p{margin:7px 0 0;color:#6c7a88;line-height:1.5;max-width:620px}
        .admin-setup-close{border:0;background:#f1f4f6;color:#222631;border-radius:9px;width:38px;height:38px;font:inherit;font-size:20px;cursor:pointer}
        .admin-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .admin-setup-wide{grid-column:1/-1}
        .admin-setup-label{display:grid;gap:6px;font-size:13px;font-weight:800;color:#526374}
        .admin-setup-input{width:100%;border:1px solid #dbe4ea;border-radius:10px;padding:11px 12px;font:inherit;color:#222631;background:#fff;outline:none}
        .admin-setup-input:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
        .admin-setup-textarea{min-height:105px;resize:vertical}
        .admin-setup-check{display:flex;align-items:center;gap:9px;min-height:44px;color:#222631;font-size:13px;font-weight:800}
        .admin-setup-error{margin-bottom:14px;border-radius:10px;padding:11px 12px;background:#fff0ec;color:#b64d2a;font-size:13px;font-weight:700}
        .admin-setup-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
        .admin-setup-cancel,.admin-setup-save{border-radius:10px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer}
        .admin-setup-cancel{border:1px solid #dbe4ea;background:#fff;color:#222631}
        .admin-setup-save{border:0;background:#6b5b95;color:#fff}
        .admin-setup-save:disabled,.admin-setup-cancel:disabled{opacity:.55;cursor:wait}
        @media(max-width:620px){.admin-setup-grid{grid-template-columns:1fr}.admin-setup-wide{grid-column:auto}.admin-setup-card{padding:18px}}
      `}</style>

      <div className="admin-setup-card">
        <div className="admin-setup-head">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button
            className="admin-setup-close"
            type="button"
            onClick={onClose}
            aria-label="Uždaryti"
          >
            <CloseMark />
          </button>
        </div>

        {error && <div className="admin-setup-error">{error}</div>}
        {children}
      </div>
    </div>
  );
}

export function AdminWorkerGateway({ user, onAdminReturn, onLogout }) {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    city: "Vilnius",
    phone: "",
    travelRadius: 30,
    hasDrivingLicenseB: false,
    yearsExperience: 0,
    shortBio: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function checkWorkerMode() {
      setChecking(true);
      setError("");

      try {
        const [profileResult, privateResult, workerResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, city")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_private")
            .select("phone")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("worker_profiles")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (privateResult.error) throw privateResult.error;
        if (workerResult.error) throw workerResult.error;

        if (cancelled) return;

        setForm((current) => ({
          ...current,
          displayName: profileResult.data?.display_name || "",
          city: profileResult.data?.city || "Vilnius",
          phone: privateResult.data?.phone || "",
        }));

        setReady(Boolean(workerResult.data?.user_id));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko patikrinti darbuotojo režimo.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkWorkerMode();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function activateWorkerMode() {
    setSaving(true);
    setError("");

    try {
      const city = await canonicalCityName(form.city);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const travelRadius = Number(form.travelRadius);
      if (!Number.isFinite(travelRadius) || travelRadius < 5 || travelRadius > 50) {
        throw new Error("Kelionės spindulys turi būti nuo 5 iki 50 km.");
      }

      const result = await supabase.rpc("admin_register_worker_mode", {
        p_display_name: form.displayName.trim(),
        p_city: city,
        p_phone: form.phone.trim() || null,
        p_travel_radius_km: travelRadius,
        p_has_driving_license_b: Boolean(form.hasDrivingLicenseB),
        p_years_experience: Number(form.yearsExperience) || 0,
        p_short_bio: form.shortBio.trim() || null,
      });

      if (result.error) throw result.error;
      setReady(true);
    } catch (err) {
      setError(err?.message || "Nepavyko aktyvuoti darbuotojo režimo.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return <SilentLoader fullscreen size={28} />;
  }

  if (ready) {
    return (
      <WorkerDashboard
        user={user}
        onLogout={onLogout}
        onAdminReturn={onAdminReturn}
      />
    );
  }

  return (
    <AdminSetupModal
      eyebrow="ADMIN · DARBUOTOJO REŽIMAS"
      title="Aktyvuoti darbuotojo profilį"
      description="Administratoriaus rolė išliks. Užpildykite informaciją ir galėsite naudotis sistema taip pat kaip darbuotojas."
      error={error}
      onClose={onAdminReturn}
    >
      <div className="admin-setup-grid">
        <label className="admin-setup-label">
          Vardas
          <input
            className="admin-setup-input"
            value={form.displayName}
            onChange={(e) =>
              setForm((current) => ({ ...current, displayName: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Miestas
          <CityAutocomplete
            className="admin-setup-input"
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Telefonas
          <input
            className="admin-setup-input"
            value={form.phone}
            onChange={(e) =>
              setForm((current) => ({ ...current, phone: e.target.value }))
            }
            placeholder="+370..."
          />
        </label>

        <label className="admin-setup-label">
          Kiek km galite nuvykti?
          <input
            className="admin-setup-input"
            type="number"
            min="5"
            max="50"
            value={form.travelRadius}
            onChange={(e) =>
              setForm((current) => ({ ...current, travelRadius: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Patirtis statybose (metais)
          <input
            className="admin-setup-input"
            type="number"
            min="0"
            step="0.5"
            value={form.yearsExperience}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                yearsExperience: e.target.value,
              }))
            }
          />
        </label>

        <label className="admin-setup-check">
          <input
            type="checkbox"
            checked={form.hasDrivingLicenseB}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                hasDrivingLicenseB: e.target.checked,
              }))
            }
          />
          Turiu B kategorijos vairuotojo pažymėjimą
        </label>

        <label className="admin-setup-label admin-setup-wide">
          Trumpai apie save
          <textarea
            className="admin-setup-input admin-setup-textarea"
            value={form.shortBio}
            onChange={(e) =>
              setForm((current) => ({ ...current, shortBio: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="admin-setup-actions">
        <button
          className="admin-setup-cancel"
          type="button"
          disabled={saving}
          onClick={onAdminReturn}
        >
          Atšaukti
        </button>
        <button
          className="admin-setup-save"
          type="button"
          disabled={saving}
          onClick={activateWorkerMode}
        >
          {saving ? "Aktyvuojama..." : "Aktyvuoti darbuotojo režimą"}
        </button>
      </div>
    </AdminSetupModal>
  );

}export function AdminEmployerGateway({ user, onAdminReturn, onLogout }) {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    companyCode: "",
    city: "Vilnius",
    phone: "",
    description: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function checkEmployerMode() {
      setChecking(true);
      setError("");

      try {
        const [memberResult, profileResult, privateResult] = await Promise.all([
          supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("city")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_private")
            .select("phone")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (memberResult.error) throw memberResult.error;
        if (profileResult.error) throw profileResult.error;
        if (privateResult.error) throw privateResult.error;

        if (cancelled) return;

        setReady(Boolean(memberResult.data?.company_id));
        setForm((current) => ({
          ...current,
          city: profileResult.data?.city || "Vilnius",
          phone: privateResult.data?.phone || "",
        }));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko patikrinti darbdavio režimo.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkEmployerMode();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  async function activateEmployerMode() {
    setSaving(true);
    setError("");

    try {
      const city = await canonicalCityName(form.city);
      if (!city) {
        throw new Error("Pasirinkite miestą iš pasiūlymų sąrašo.");
      }

      const result = await supabase.rpc("admin_register_employer_mode", {
        p_company_name: form.companyName.trim(),
        p_company_code: form.companyCode.trim() || null,
        p_city: city,
        p_phone: form.phone.trim() || null,
        p_description: form.description.trim() || null,
      });

      if (result.error) throw result.error;
      setReady(true);
    } catch (err) {
      setError(err?.message || "Nepavyko aktyvuoti darbdavio režimo.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return <SilentLoader fullscreen size={28} />;
  }

  if (ready) {
    return (
      <EmployerDashboard
        user={user}
        onLogout={onLogout}
        onAdminReturn={onAdminReturn}
      />
    );
  }

  return (
    <AdminSetupModal
      eyebrow="ADMIN · DARBDAVIO REŽIMAS"
      title="Užregistruoti savo įmonę"
      description="Administratoriaus rolė išliks. Užpildykite įmonės informaciją ir galėsite kurti darbus kaip įprastas darbdavys."
      error={error}
      onClose={onAdminReturn}
    >
      <div className="admin-setup-grid">
        <label className="admin-setup-label">
          Įmonės pavadinimas
          <input
            className="admin-setup-input"
            value={form.companyName}
            onChange={(e) =>
              setForm((current) => ({ ...current, companyName: e.target.value }))
            }
            placeholder="UAB ..."
          />
        </label>

        <label className="admin-setup-label">
          Įmonės kodas
          <input
            className="admin-setup-input"
            value={form.companyCode}
            onChange={(e) =>
              setForm((current) => ({ ...current, companyCode: e.target.value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Miestas
          <CityAutocomplete
            className="admin-setup-input"
            value={form.city}
            onChange={(value) =>
              setForm((current) => ({ ...current, city: value }))
            }
          />
        </label>

        <label className="admin-setup-label">
          Telefonas
          <input
            className="admin-setup-input"
            value={form.phone}
            onChange={(e) =>
              setForm((current) => ({ ...current, phone: e.target.value }))
            }
            placeholder="+370..."
          />
        </label>

        <label className="admin-setup-label admin-setup-wide">
          Trumpai apie įmonę
          <textarea
            className="admin-setup-input admin-setup-textarea"
            value={form.description}
            onChange={(e) =>
              setForm((current) => ({ ...current, description: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="admin-setup-actions">
        <button
          className="admin-setup-cancel"
          type="button"
          disabled={saving}
          onClick={onAdminReturn}
        >
          Atšaukti
        </button>
        <button
          className="admin-setup-save"
          type="button"
          disabled={saving}
          onClick={activateEmployerMode}
        >
          {saving ? "Kuriama..." : "Aktyvuoti darbdavio režimą"}
        </button>
      </div>
    </AdminSetupModal>
  );

}
export function AdminJobChatModal({ job, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);
  const loadedJobRef = useRef(null);

  useEffect(() => {
    if (!job?.job_id) return undefined;

    let cancelled = false;
    scrollOnLoadRef.current = true;
    loadedJobRef.current = null;
    setMessages([]);
    setLoading(true);

    async function refresh() {
      try {
        const result = await supabase.rpc("get_admin_job_chat_messages", {
          p_job_id: job.job_id,
        });

        if (result.error) throw result.error;

        if (!cancelled) {
          loadedJobRef.current = job.job_id;
          setMessages(result.data || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko įkelti darbo pokalbio.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [job?.job_id]);

  useEffect(() => {
    if (!job?.job_id || loading || loadedJobRef.current !== job.job_id || !messagesRef.current) return;

    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [job?.job_id, loading, messages]);

  async function sendMessage(e) {
    e.preventDefault();

    const body = textValue.trim();
    if (!body || !job?.job_id || sending) return;

    setSending(true);
    setError("");

    try {
      const result = await supabase.rpc("admin_send_job_chat_message", {
        p_job_id: job.job_id,
        p_body: body,
      });

      if (result.error) throw result.error;

      setTextValue("");
      scrollOnLoadRef.current = true;

      const refreshed = await supabase.rpc("get_admin_job_chat_messages", {
        p_job_id: job.job_id,
      });

      if (refreshed.error) throw refreshed.error;
      loadedJobRef.current = job.job_id;
      setMessages(refreshed.data || []);
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  if (!job) return null;

  return (
    <div
      className="admin-chat-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <style>{`
        .admin-chat-overlay{position:fixed;inset:0;z-index:9700;background:rgba(34,38,49,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
        .admin-chat-card{width:min(720px,100%);max-height:calc(100dvh - 40px);background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(34,38,49,.30);padding:22px;color:#222631;display:grid;grid-template-rows:auto auto auto minmax(180px,1fr) auto;overflow:hidden}
        .admin-chat-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
        .admin-chat-head h2{font-family:Manrope,Inter,sans-serif;margin:6px 0 0;font-size:24px;line-height:1.2}
        .admin-chat-meta{margin-top:6px;color:#6c7a88;font-size:12px}.admin-chat-info{background:#edf8f3;color:#167a54;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:13px;line-height:1.45}
        .admin-chat-info.cancelled{background:#f1eef8;color:#433960}.admin-chat-messages{display:grid;align-content:start;gap:10px;min-height:220px;max-height:420px;overflow-y:auto;padding:18px 4px 14px;background:#f8fafb;border:1px solid #e8eef2;border-radius:16px}
        .admin-chat-message{max-width:min(84%,560px);border-radius:14px 14px 14px 5px;padding:11px 13px;background:#fff;border:1px solid #dfe7ec;box-shadow:0 2px 8px rgba(34,38,49,.04)}
        .admin-chat-message.mine{margin-left:auto;background:#f5f3fa;border-color:#c9c2de;border-radius:14px 14px 5px 14px}.admin-chat-message.admin-other{background:#eef3f8;border-color:#d7e4ef}
        .admin-chat-message b{display:block;font-size:12px;margin-bottom:5px}.admin-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}.admin-chat-message time{display:block;margin-top:7px;font-size:10px;color:#7a8996}
        .admin-chat-empty{text-align:center;color:#6c7a88;padding:34px 10px}.admin-chat-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 11px;margin-bottom:12px;font-size:12px}
        .admin-chat-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border-top:1px solid #e5ebef;padding-top:14px;margin-top:14px}
        .admin-chat-form textarea{width:100%;min-height:54px;max-height:130px;resize:vertical;border:1px solid #d7e0e7;border-radius:12px;padding:11px 12px;font:inherit;color:#222631;outline:none}.admin-chat-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
        .admin-chat-form button{border:0;background:#6b5b95;color:#fff;border-radius:11px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer;min-width:92px}.admin-chat-form button:disabled{opacity:.55;cursor:wait}
        @media(max-width:560px){.admin-chat-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:17px;border-radius:16px}.admin-chat-form{grid-template-columns:1fr}.admin-chat-form button{min-height:44px}.admin-chat-message{max-width:92%}}
      `}</style>

      <div className="admin-chat-card">
        <div className="admin-chat-head">
          <div>
            <div className="eyebrow">ADMINISTRATORIUS · DARBO POKALBIS</div>
            <h2>{job.title ? formatJobTitle(job.title) : "Darbo pokalbis"}</h2>
            <div className="admin-chat-meta">
              {job.company_name || "Įmonė"} · {job.city || "—"} ·{" "}
              {job.work_date || "—"}
            </div>
          </div>

          <button
            className="rs-close"
            type="button"
            disabled={sending}
            onClick={onClose}
          >
            <CloseMark />
          </button>
        </div>

        <div
          className={`admin-chat-info ${
            job.status === "cancelled" ? "cancelled" : ""
          }`}
        >
          {job.status === "cancelled"
            ? "Darbas atšauktas. Administratorius vis tiek gali peržiūrėti istoriją ir rašyti administracinę žinutę."
            : "Matote visą šio darbo grupinio pokalbio istoriją. Jūsų žinutė bus siunčiama kaip administratoriaus žinutė darbo komandai."}
        </div>

        {error && <div className="admin-chat-error">{error}</div>}

        <ChatConductNotice />

        <div className="admin-chat-messages" ref={messagesRef}>
          {loading && !messages.length ? (
            <div className="admin-chat-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => {
              const mine = message.sender_id === user?.id;
              const adminOther =
                !mine && String(message.sender_role || "") === "admin";

              return (
                <div
                  className={`admin-chat-message ${
                    mine ? "mine" : adminOther ? "admin-other" : ""
                  }`}
                  key={message.message_id}
                >
                  <b>{message.sender_name || "Vartotojas"}</b>
                  <p>{message.body}</p>
                  <time>
                    {new Date(message.created_at).toLocaleString("lt-LT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              );
            })
          ) : (
            <div className="admin-chat-empty">
              Šiame darbe žinučių dar nėra.
            </div>
          )}
        </div>

        <form className="admin-chat-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            maxLength={2000}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent?.isComposing
              ) {
                e.preventDefault();
                if (!sending && textValue.trim()) {
                  sendMessage(e);
                }
              }
            }}
            placeholder="Administratoriaus žinutė darbo komandai..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminCompanyTeamChatModal({ chat, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const scrollOnLoadRef = useRef(true);
  const loadedCompanyRef = useRef(null);

  useEffect(() => {
    if (!chat?.company_id) return undefined;

    let cancelled = false;
    scrollOnLoadRef.current = true;
    loadedCompanyRef.current = null;
    setMessages([]);
    setLoading(true);

    async function refresh() {
      try {
        const result = await supabase.rpc(
          "get_admin_company_team_chat_messages",
          { p_company_id: chat.company_id }
        );

        if (result.error) throw result.error;

        if (!cancelled) {
          loadedCompanyRef.current = chat.company_id;
          setMessages(result.data || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Nepavyko įkelti vadovų pokalbio.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [chat?.company_id]);

  useEffect(() => {
    if (
      !chat?.company_id ||
      loading ||
      loadedCompanyRef.current !== chat.company_id ||
      !messagesRef.current
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      scrollOnLoadRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [chat?.company_id, loading, messages]);

  async function sendMessage(e) {
    e.preventDefault();

    const body = textValue.trim();
    if (!body || !chat?.company_id || sending) return;

    setSending(true);
    setError("");

    try {
      const result = await supabase.rpc("admin_send_company_team_message", {
        p_company_id: chat.company_id,
        p_body: body,
      });

      if (result.error) throw result.error;

      setTextValue("");
      scrollOnLoadRef.current = true;

      const refreshed = await supabase.rpc(
        "get_admin_company_team_chat_messages",
        { p_company_id: chat.company_id }
      );

      if (refreshed.error) throw refreshed.error;
      loadedCompanyRef.current = chat.company_id;
      setMessages(refreshed.data || []);
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  if (!chat) return null;

  return (
    <div
      className="admin-team-chat-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose();
      }}
    >
      <style>{`
        .admin-team-chat-overlay{position:fixed;inset:0;z-index:9720;background:rgba(34,38,49,.62);display:grid;place-items:center;padding:20px;backdrop-filter:blur(2px)}
        .admin-team-chat-card{width:min(720px,100%);max-height:calc(100dvh - 40px);background:#fff;border-radius:20px;box-shadow:0 28px 90px rgba(34,38,49,.3);padding:22px;color:#222631;display:grid;grid-template-rows:auto auto auto minmax(180px,1fr) auto;overflow:hidden}
        .admin-team-chat-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
        .admin-team-chat-head h2{font-family:Manrope,Inter,sans-serif;margin:6px 0 0;font-size:24px;line-height:1.2}
        .admin-team-chat-meta{margin-top:6px;color:#6c7a88;font-size:12px}.admin-team-chat-note{background:#edf8f3;color:#167a54;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.45}
        .admin-team-chat-error{background:#fff0ec;color:#b64d2a;border-radius:10px;padding:10px 11px;margin-bottom:12px;font-size:12px}
        .admin-team-chat-messages{display:grid;align-content:start;gap:10px;min-height:220px;max-height:420px;overflow:auto;padding:18px 4px 14px;background:#f8fafb;border:1px solid #e8eef2;border-radius:16px}
        .admin-team-chat-message{width:fit-content;max-width:min(84%,560px);border-radius:14px 14px 14px 5px;padding:11px 13px;background:#fff;border:1px solid #dfe7ec;box-shadow:0 2px 8px rgba(34,38,49,.04)}
        .admin-team-chat-message.mine{justify-self:end;background:#f5f3fa;border-color:#c9c2de;border-radius:14px 14px 5px 14px}.admin-team-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}
        .admin-team-chat-message b{display:block;font-size:12px;margin-bottom:5px}.admin-team-chat-role{font-weight:600;color:#7a8996}.admin-team-chat-message time{display:block;margin-top:7px;font-size:10px;color:#7a8996}
        .admin-team-chat-empty{text-align:center;color:#6c7a88;padding:42px 10px}.admin-team-chat-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border-top:1px solid #e5ebef;padding-top:14px;margin-top:14px}
        .admin-team-chat-form textarea{width:100%;min-height:54px;max-height:130px;resize:vertical;border:1px solid #d7e0e7;border-radius:12px;padding:11px 12px;font:inherit;color:#222631;outline:none}.admin-team-chat-form textarea:focus{border-color:#6b5b95;box-shadow:0 0 0 3px rgba(107,91,149,.12)}
        .admin-team-chat-form button{border:0;background:#6b5b95;color:#fff;border-radius:11px;padding:0 17px;font:inherit;font-weight:800;cursor:pointer;min-width:92px}.admin-team-chat-form button:disabled{opacity:.55;cursor:wait}
        @media(max-width:560px){.admin-team-chat-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px);padding:17px;border-radius:16px}.admin-team-chat-message{max-width:92%}.admin-team-chat-form{grid-template-columns:1fr}.admin-team-chat-form button{min-height:44px}}
      `}</style>

      <div className="admin-team-chat-card">
        <div className="admin-team-chat-head">
          <div>
            <div className="eyebrow">ADMINISTRATORIUS · KOMANDOS POKALBIS</div>
            <h2>{chat.company_name || "Įmonės komanda"}</h2>
            <div className="admin-team-chat-meta">
              {employerPlanName(chat.plan_key)} ·{" "}
              {Number(chat.active_members || 0)} komandos nariai ·{" "}
              {Number(chat.message_count || 0)} žinutės
            </div>
          </div>

          <button
            className="rs-close"
            type="button"
            disabled={sending}
            onClick={onClose}
          >
            <CloseMark />
          </button>
        </div>

        <div className="admin-team-chat-note">
          Matote visą įmonės komandos pokalbį ir galite parašyti administratoriaus
          žinutę visai komandai.
        </div>

        {error && <div className="admin-team-chat-error">{error}</div>}

        <ChatConductNotice />

        <div className="admin-team-chat-messages" ref={messagesRef}>
          {loading && !messages.length ? (
            <div className="admin-team-chat-empty"><SilentLoader size={18} minHeight={42} /></div>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                className={`admin-team-chat-message ${
                  message.sender_id === user?.id ? "mine" : ""
                }`}
                key={message.id}
              >
                <b>
                  {message.sender_label ||
                    (message.sender_role === "admin"
                      ? "Administratorius"
                      : "Komandos narys")}
                </b>
                <p>{message.body}</p>
                <time>
                  {new Date(message.created_at).toLocaleString("lt-LT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            ))
          ) : (
            <div className="admin-team-chat-empty">
              Šios įmonės komandos pokalbyje žinučių nėra.
            </div>
          )}
        </div>

        <form className="admin-team-chat-form" onSubmit={sendMessage}>
          <textarea
            value={textValue}
            maxLength={2000}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent?.isComposing
              ) {
                e.preventDefault();
                if (!sending && textValue.trim()) sendMessage(e);
              }
            }}
            placeholder="Administratoriaus žinutė įmonės komandai..."
          />
          <button disabled={sending || !textValue.trim()}>
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </form>
      </div>
    </div>
  );
}


export { AdminPrivateInboxButton, adminPrivateMessageDate } from "./AdminPrivateInbox.jsx";
import { adminPrivateMessageDate } from "./AdminPrivateInbox.jsx";

export function AdminPrivateMessageComposer({ target, onClose, onSent }) {
  const [body, setBody] = useState("");
  const [latestMessage, setLatestMessage] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadLatestStatus() {
    if (!target?.userId) {
      setLatestMessage(null);
      return;
    }

    setLoadingStatus(true);
    setError("");

    try {
      const result = await supabase.rpc("get_admin_private_message_thread", {
        p_recipient_id: target.userId,
        p_limit: 1,
      });
      if (result.error) throw result.error;
      setLatestMessage((result.data || [])[0] || null);
    } catch (err) {
      setError(err?.message || "Nepavyko patikrinti žinutės būsenos.");
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    setBody("");
    setError("");
    loadLatestStatus();
  }, [target?.userId]);

  if (!target) return null;

  async function sendMessage() {
    const clean = body.trim();
    if (!clean) {
      setError("Parašykite žinutę.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const result = await supabase.rpc("send_admin_private_message", {
        p_recipient_id: target.userId,
        p_body: clean,
      });
      if (result.error) throw result.error;

      setBody("");
      await loadLatestStatus();
      onSent?.();
    } catch (err) {
      setError(err?.message || "Nepavyko išsiųsti žinutės.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="admin-modal-overlay"
      style={{ zIndex: 15000 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) onClose?.();
      }}
    >
      <div className="admin-modal" style={{ width: "min(620px,100%)" }}>
        <div className="admin-modal-head">
          <div>
            <div className="eyebrow">PRIVATI ADMINISTRATORIAUS ŽINUTĖ</div>
            <h2>{target.name || "Vartotojas"}</h2>
          </div>
          <button
            className="rs-close"
            type="button"
            disabled={sending}
            onClick={onClose}
            aria-label="Uždaryti"
          >
            <CloseMark />
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "11px 12px",
            border: "1px solid #e3e9ee",
            borderRadius: 11,
            background: "#f8fafb",
            fontSize: 12.5,
            color: "#526374",
          }}
        >
          {loadingStatus ? (
            "Tikrinama..."
          ) : latestMessage ? (
            latestMessage.read_at ? (
              <span style={{ color: "#16845b", fontWeight: 850 }}>
                ✓ Paskutinę žinutę peržiūrėjo
              </span>
            ) : (
              <span style={{ fontWeight: 800 }}>Paskutinė žinutė dar neperžiūrėta</span>
            )
          ) : (
            "Žinutė dar nebuvo siųsta"
          )}
        </div>

        <label className="admin-label" style={{ marginTop: 16 }}>
          Nauja žinutė
          <textarea
            className="admin-input admin-textarea"
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Parašykite privačią žinutę..."
            style={{ minHeight: 120 }}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <span className="admin-muted">{body.length}/2000</span>
          <button
            className="admin-small-btn"
            type="button"
            disabled={sending || !body.trim()}
            onClick={sendMessage}
            style={{
              background: "#222631",
              color: "#fff",
              borderColor: "#222631",
              minWidth: 120,
            }}
          >
            {sending ? "Siunčiama..." : "Siųsti"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fff3ef",
              color: "#a84b2a",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
