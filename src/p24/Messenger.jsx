import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { Svg } from "./Shell.jsx";
import { initialsOf, up } from "./ui.jsx";

// Prototipo žinučių langas (chatpop): pokalbių sąrašas su filtru, paieška ir „ištrinti sau“.
// Pokalbis atidaromas esamu pokalbio langu (jame veikia visa siuntimo logika).

export function useChatHidden(userId) {
  const [hidden, setHidden] = useState({});
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    supabase.from("chat_hidden").select("conv_key, hidden_at").then(({ data, error }) => {
      if (cancelled || error) return;
      setHidden(Object.fromEntries((data || []).map((row) => [row.conv_key, row.hidden_at])));
    });
    return () => { cancelled = true; };
  }, [userId]);
  const hide = async (key) => {
    const at = new Date().toISOString();
    setHidden((current) => ({ ...current, [key]: at }));
    await supabase.from("chat_hidden").upsert({ user_id: userId, conv_key: key, hidden_at: at }, { onConflict: "user_id,conv_key" });
  };
  return { hidden, hide };
}

// conv: { key, kind: "private"|"group"|"team", name, job, lastText, lastAt, unread, onOpen }
export function visibleConversations(conversations, hidden) {
  return conversations.filter((conv) => {
    const at = hidden[conv.key];
    if (!at) return true;
    return Boolean(conv.lastAt && new Date(conv.lastAt) > new Date(at));
  });
}

function Cav({ conv }) {
  if (conv.kind === "team") return <span className="cav team"><Svg name="team" size={22} /></span>;
  if (conv.kind === "group") return <span className="cav grp"><Svg name="people" size={22} /></span>;
  return <span className="cav">{initialsOf(conv.name)}</span>;
}

const typeLabel = (conv) => (conv.kind === "team" ? "Vadovų pokalbis" : conv.kind === "group" ? "Darbo pokalbis" : "Privatus");

export function Messenger({ conversations, hidden, onHide, onClose }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [confirmKey, setConfirmKey] = useState(null);
  const convs = visibleConversations(conversations, hidden);
  const q = query.trim().toLocaleLowerCase("lt-LT");
  const list = convs.filter((conv) => (filter === "all" || conv.kind === filter) && (!q || `${conv.name} ${conv.job || ""}`.toLocaleLowerCase("lt-LT").includes(q)));
  const count = (kind) => convs.filter((conv) => (kind === "all" || conv.kind === kind) && conv.unread).length;
  const seg = (kind, label) => (
    <button type="button" aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{label}{count(kind) ? <> <em>{count(kind)}</em></> : null}</button>
  );
  const hasTeam = convs.some((conv) => conv.kind === "team");
  return (
    <div className="chatpop" role="dialog" aria-label="Žinutės">
      <div className="chat narrow">
        <div className="convs">
          <div className="pophead"><b>Žinutės</b><button type="button" className="tbtn" aria-label="Uždaryti žinutes" onClick={onClose}><Svg name="x" size={20} width={2.2} /></button></div>
          <div className="convs-head">
            <div className="cfilter" role="group" aria-label="Pokalbių tipas">{seg("all", "Visi")}{seg("private", "Privatūs")}{seg("group", hasTeam ? "Darbo" : "Darbo pokalbiai")}{hasTeam ? seg("team", "Vadovai") : null}</div>
            <label className="csearch"><Svg name="search" size={17} /><span className="sr">Ieškoti pokalbio</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ieškoti" autoComplete="off" /></label>
          </div>
          <div className="clist">
            {list.length ? list.map((conv) => (
              <div key={conv.key} style={{ position: "relative" }}>
                <button type="button" className={`conv${conv.unread ? " un" : ""}`} onClick={() => { onClose(); conv.onOpen(hidden[conv.key] || null); }}>
                  <Cav conv={conv} />
                  <div className="cn">
                    <span className={`ctype ${conv.kind === "group" ? "g" : conv.kind === "team" ? "t" : "p"}`}><Svg name={conv.kind === "group" ? "people" : conv.kind === "team" ? "team" : "shield"} size={12} width={2.4} />{typeLabel(conv)}</span>
                    <b>{conv.kind === "group" ? up(conv.name) : conv.name}</b>
                    <small>{conv.lastText || (conv.job ? up(conv.job) : "")}{conv.lastAt ? ` · ${new Date(conv.lastAt).toLocaleDateString("lt-LT")}` : ""}</small>
                  </div>
                  {conv.unread ? <span className="unread" aria-label="Neperskaityta" /> : null}
                </button>
                {conv.kind !== "team" && (
                  confirmKey === conv.key ? (
                    <div className="row" style={{ position: "absolute", right: 8, top: 8, gap: 6 }}>
                      <button type="button" className="btn sm danger" onClick={() => { onHide(conv.key); setConfirmKey(null); }}>Ištrinti sau</button>
                      <button type="button" className="btn sm" onClick={() => setConfirmKey(null)}>Ne</button>
                    </div>
                  ) : (
                    <button type="button" className="tbtn tdel" style={{ position: "absolute", right: 6, top: 6 }} aria-label="Ištrinti pokalbį" title="Ištrinti pokalbį (tik jums)" onClick={() => setConfirmKey(conv.key)}>
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
                    </button>
                  )
                )}
              </div>
            )) : <p className="muted small" style={{ padding: 10 }}>Pokalbių nerasta.</p>}
          </div>
          <p className="muted small" style={{ padding: "8px 12px", margin: 0 }}>Ištrintas pokalbis dingsta tik jums. Gavus naują žinutę jis vėl atsiras – matysite tik naujas žinutes.</p>
        </div>
      </div>
    </div>
  );
}
