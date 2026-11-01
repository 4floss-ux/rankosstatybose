import { useEffect, useState } from "react";
import { P24Modal } from "../p24/ui.jsx";
import { supabase } from "../lib/config.js";

// Atskirtas nuo adminParts.jsx, kad darbuotojo / darbdavio kodo dalys nekrautų administratoriaus kodo.
export function adminPrivateMessageDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPrivateInboxButton({ user }) {
  const [activeMessage, setActiveMessage] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  async function refreshUnread() {
    if (!user?.id) return;

    try {
      const result = await supabase.rpc(
        "get_my_admin_private_message_unread_count"
      );
      if (result.error) throw result.error;
      setUnread(Number(result.data || 0));
    } catch {
      // Pranešimas neturi trukdyti naudotis paskyra.
    }
  }

  async function openNewestUnreadMessage() {
    if (!user?.id || loading) return;

    setLoading(true);

    try {
      const result = await supabase.rpc("get_my_admin_private_messages", {
        p_limit: 50,
      });
      if (result.error) throw result.error;

      const rows = result.data || [];
      const message = rows.find((item) => !item.read_at) || rows[0] || null;

      if (!message) {
        setUnread(0);
        return;
      }

      setActiveMessage(message);

      const readResult = await supabase.rpc(
        "mark_my_admin_private_message_read",
        { p_message_id: message.message_id }
      );
      if (readResult.error) throw readResult.error;

      await refreshUnread();
    } catch {
      // Jei žinutės atidaryti nepavyko, pranešimas lieka matomas.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return undefined;

    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30000);

    return () => window.clearInterval(timer);
  }, [user?.id]);

  const showNotice = unread > 0 && !activeMessage;

  return (
    <>

      {showNotice && (
        <div className="p24 p24-portal"><div className="toast" role="status" aria-live="polite" style={{ zIndex: 9500, display: "flex", alignItems: "center", gap: 12 }}>
          <span>Nauja administratoriaus žinutė</span>
          <button className="btn sm primary" type="button" disabled={loading} onClick={openNewestUnreadMessage}>{loading ? "..." : "Peržiūrėti"}</button>
        </div></div>
      )}

      {activeMessage && (
        <P24Modal eyebrow="statybos24.lt administratorius" title="Administratoriaus žinutė" onClose={() => { setActiveMessage(null); refreshUnread(); }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{activeMessage.body}</p>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn primary" type="button" onClick={() => { setActiveMessage(null); refreshUnread(); }}>Supratau</button></div>
        </P24Modal>
      )}
    </>
  );
}

