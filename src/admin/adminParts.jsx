import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark, SilentLoader } from "../ui/brand.jsx";
import { ChatThreadView } from "../chat/conversations.jsx";
import { P24Modal } from "../p24/ui.jsx";
import { Svg } from "../p24/Shell.jsx";
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
    <P24Modal wide eyebrow={eyebrow} title={title} sub={description} onClose={onClose}>
      {error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p> : null}
      {children}
    </P24Modal>
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
    <ChatThreadView kind="group" title={job.title ? formatJobTitle(job.title).toLocaleUpperCase("lt-LT") : "Darbo pokalbis"} sub={`${job.company_name || "Įmonė"} · darbo pokalbis`}
      privacy={["Bendras darbo pokalbis", "Matote kaip administratorius. Žinutes mato visi darbo dalyviai."]}
      messages={messages} isMine={(m) => m.sender_id === user?.id} senderOf={(m) => m.sender_name || "Vartotojas"} isAdmin={(m) => String(m.sender_role || "") === "admin"}
      loading={loading} error={error} messagesRef={messagesRef} locked={false}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti visiems" />
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
    <ChatThreadView kind="team" title="Vadovų pokalbis" sub={chat.company_name || "Įmonės komanda"}
      privacy={["Vadovų pokalbis", "Matote kaip administratorius. Darbuotojai šio pokalbio nemato."]}
      messages={messages} isMine={(m) => m.sender_id === user?.id} senderOf={(m) => m.sender_label || (m.sender_role === "admin" ? "Administratorius" : "Komandos narys")} isAdmin={(m) => m.sender_role === "admin"}
      loading={loading} error={error} messagesRef={messagesRef} locked={false}
      value={textValue} setValue={setTextValue} onSend={sendMessage} sending={sending} onClose={onClose} placeholder="Rašyti komandai" />
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
    <P24Modal eyebrow="Privati administratoriaus žinutė" title={target.name || "Vartotojas"} sub={loadingStatus ? "Tikrinama..." : latestMessage ? (latestMessage.read_at ? "✓ Paskutinę žinutę peržiūrėjo" : "Paskutinė žinutė dar neperžiūrėta") : "Žinutė dar nebuvo siųsta"} onClose={onClose} busy={sending}>
      <label className="field">Nauja žinutė<textarea value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} placeholder="Parašykite privačią žinutę..." style={{ minHeight: 120 }} /><span className="hint">{body.length}/2000</span></label>
      {error ? <p className="ferr" role="alert" style={{ margin: 0 }}>{error}</p> : null}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn" type="button" disabled={sending} onClick={onClose}>Atšaukti</button>
        <button className="btn primary" type="button" disabled={sending || !body.trim()} onClick={sendMessage}><Svg name="send" size={15} />{sending ? "Siunčiama..." : "Siųsti"}</button>
      </div>
    </P24Modal>
  );
}
