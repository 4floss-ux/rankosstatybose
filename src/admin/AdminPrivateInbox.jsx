import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { CloseMark } from "../ui/brand.jsx";

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
      <style>{`
        .apm-notice{
          position:fixed !important;
          inset:auto !important;
          left:50% !important;
          right:auto !important;
          top:50% !important;
          bottom:auto !important;
          transform:translate(-50%,-50%) !important;
          z-index:14450;
          width:240px !important;
          max-width:calc(100vw - 64px) !important;
          min-width:0 !important;
          box-sizing:border-box !important;
          display:flex !important;
          flex-direction:column !important;
          align-items:center !important;
          justify-content:center !important;
          gap:12px !important;
          padding:18px 16px !important;
          margin:0 !important;
          border:1px solid #c7bfdd;
          border-radius:16px;
          background:#fff;
          box-shadow:0 18px 54px rgba(34,38,49,.22);
          color:#222631;
          text-align:center
        }
        .apm-notice-title{
          font-size:14px;
          font-weight:850;
          line-height:1.35
        }
        .apm-notice-open{
          border:0;
          cursor:pointer;
          padding:10px 18px;
          border-radius:10px;
          background:#222631;
          color:#fff;
          font-size:12px;
          font-weight:850
        }
        .apm-notice-open:disabled{opacity:.6;cursor:default}
        .apm-overlay{
          position:fixed;
          inset:0;
          z-index:14500;
          display:grid;
          place-items:center;
          padding:18px;
          background:rgba(34,38,49,.52);
          backdrop-filter:blur(2px)
        }
        .apm-message-card{
          position:relative;
          width:min(520px,calc(100vw - 36px));
          max-height:calc(100dvh - 36px);
          overflow:auto;
          box-sizing:border-box;
          background:#fff;
          border:1px solid #e2e9ee;
          border-radius:18px;
          padding:22px 58px 22px 22px;
          box-shadow:0 28px 90px rgba(34,38,49,.28);
          scrollbar-width:none
        }
        .apm-message-card::-webkit-scrollbar{width:0;height:0}
        .apm-message-card p{
          margin:0;
          white-space:pre-wrap;
          overflow-wrap:anywhere;
          color:#1f3447;
          font-size:15px;
          line-height:1.65
        }
        .apm-message-close{
          position:absolute;
          top:12px;
          right:12px;
          width:36px;
          height:36px;
          display:grid;
          place-items:center;
          border:0;
          border-radius:10px;
          background:#f2f5f7;
          color:#222631;
          cursor:pointer
        }
        @media(max-width:620px){
          .apm-notice{
            width:224px !important;
            max-width:calc(100vw - 72px) !important;
            padding:17px 14px !important;
            border-radius:15px
          }
          .apm-notice-title{font-size:13px}
          .apm-notice-open{padding:10px 17px;font-size:11.5px}
          .apm-overlay{padding:10px}
          .apm-message-card{
            width:calc(100vw - 28px);
            max-height:calc(100dvh - 28px);
            padding:20px 54px 20px 18px;
            border-radius:15px
          }
          .apm-message-card p{font-size:14px;line-height:1.6}
          .apm-message-close{top:10px;right:10px;width:34px;height:34px}
        }
      `}</style>

      {showNotice && (
        <div className="apm-notice" role="status" aria-live="polite">
          <div className="apm-notice-title">Administratoriaus žinutė</div>
          <button
            className="apm-notice-open"
            type="button"
            disabled={loading}
            onClick={openNewestUnreadMessage}
          >
            {loading ? "..." : "Peržiūrėti"}
          </button>
        </div>
      )}

      {activeMessage && (
        <div
          className="apm-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setActiveMessage(null);
              refreshUnread();
            }
          }}
        >
          <div className="apm-message-card">
            <button
              type="button"
              className="apm-message-close"
              onClick={() => {
                setActiveMessage(null);
                refreshUnread();
              }}
              aria-label="Uždaryti žinutę"
              title="Uždaryti"
            >
              <CloseMark />
            </button>

            <p>{activeMessage.body}</p>
          </div>
        </div>
      )}
    </>
  );
}

