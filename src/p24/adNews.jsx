import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/config.js";

// Extends the existing job_ad_message_reads / job_ad_chat_unread system.
// No browser-local read ledger; only the server authorizes and records reads.
export function useAdNews(enabled, scope, onUpdate, companyId) {
  const [state, setState] = useState({ scope, rows: [], error: "" });
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;
  const generation = useRef(0);
  const refreshRef = useRef(async () => {});
  useEffect(() => {
    const current = ++generation.current;
    let busy = false;
    let signature = "";
    setState({ scope, rows: [], error: "" });
    async function refresh() {
      if (!enabled || document.visibilityState === "hidden" || busy) return;
      busy = true;
      try {
        let result = await supabase.rpc("job_ad_news", companyId ? { p_company_id: companyId } : {});
        // Reviewed SQL is optional until installed. Existing chat still works.
        if (result.error?.code === "PGRST202" || result.error?.code === "42883") {
          result = await supabase.rpc("job_ad_chat_unread");
          result = { ...result, data: (companyId ? [] : result.data || []).map(r => ({ ...r, chat_unread: r.unread, events: [] })) };
        }
        if (generation.current !== current) return;
        if (result.error) throw result.error;
        const rows = Array.isArray(result.data) ? result.data : [];
        const next = JSON.stringify(rows.map(({ observed_at, ...row }) => row));
        setState({ scope, rows, error: "" });
        if (next !== signature) { signature = next; updateRef.current?.(); }
      } catch {
        if (generation.current === current) setState(s => ({ ...s, error: "Nepavyko atnaujinti skelbimų naujienų." }));
      } finally { busy = false; }
    }
    refreshRef.current = refresh;
    refresh();
    const timer = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { generation.current++; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [enabled, scope, companyId]);
  const reload = useCallback(() => refreshRef.current(), []);
  const rows = enabled && state.scope === scope ? state.rows : [];
  const countRow = row => Number(row.chat_unread || 0) + (row.events || []).length;
  return {
    rows, error: state.scope === scope ? state.error : "", reload,
    total: rows.reduce((n, r) => n + countRow(r), 0),
    count: id => rows.filter(r => r.application_id === id).reduce((n, r) => n + countRow(r), 0),
    adCount: id => rows.filter(r => r.ad_id === id).reduce((n, r) => n + countRow(r), 0),
    mark: async row => {
      if (!row.events?.length) return;
      const { error } = await supabase.rpc("job_ad_news_read", { p_application_id: row.application_id, p_events: row.events.map(({ kind, version }) => ({ kind, version })) });
      if (error) throw error;
      await reload();
    },
  };
}

export function NewsBadge({ count }) {
  return Number(count) > 0 ? <span title={`Neperskaitytų naujienų: ${count} – žinutės, CV arba pokalbio patvirtinimas`} className="ad-news-badge" role="status" aria-label={`Neperskaitytų naujienų: ${count}`}>{count}</span> : null;
}

export function MessageBadge({ news, applicationId }) {
  const count = Number(news?.rows.find(row => row.application_id === applicationId)?.chat_unread || 0);
  return count > 0 ? <span className="ad-news-badge" role="status" aria-label={`Neperskaitytų žinučių: ${count}`} title={`Neperskaitytų žinučių: ${count}`}>{count}</span> : null;
}

export function AdNews({ news, applicationId, autoRead = false, hideInterview = false }) {
  const original = news?.rows.find(r => r.application_id === applicationId);
  const row = original && hideInterview ? { ...original, events: original.events?.filter(event => !["interview", "interview_changed"].includes(event.kind)) } : original;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const element = useRef(null);
  const currentNews = useRef(news);
  currentNews.current = news;
  const versions = JSON.stringify(row?.events?.map(({ kind, version }) => ({ kind, version })) || []);
  useEffect(() => {
    if (!autoRead || !row?.events?.length || !element.current) return;
    let timer;
    let visible = false;
    const schedule = () => {
      clearTimeout(timer);
      if (!visible || document.visibilityState === "hidden") return;
      timer = setTimeout(async () => {
        try { await currentNews.current.mark(row); } catch { setError("Nepavyko pažymėti perskaityta. Bandykite dar kartą."); }
      }, 1200);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0.5 });
    observer.observe(element.current);
    document.addEventListener("visibilitychange", schedule);
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener("visibilitychange", schedule); };
  }, [autoRead, applicationId, versions]);
  if (!row?.events?.length) return null;
  return <div ref={element} className={`ad-news${row.events?.some(event => event.kind === "interview_changed") ? " changed" : ""}`} aria-label="Kandidatūros naujienos">
    {(row.events || []).map(e => <div key={e.kind}><b>{e.label}</b>{e.interview_at ? <span>{new Date(e.interview_at).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius", dateStyle: "short", timeStyle: "short" })}</span> : null}</div>)}
    {row.events?.length ? <button className="btn sm" type="button" disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await news.mark(row); } catch { setError("Nepavyko pažymėti perskaityta. Bandykite dar kartą."); } finally { setBusy(false); }
    }}>Pažymėti perskaityta</button> : null}
    {error ? <p role="alert" className="ferr">{error}</p> : null}
  </div>;
}

// Existing Messenger conversation contract; no separate inbox or unread ledger.
export function adNewsConversations({ ads = [], news, side, onOpen }) {
  const source = side === "worker"
    ? ads.filter(ad => ad.application).map(ad => ({ application_id: ad.application.id, ad_id: ad.id,
        participant_name: ad.company_name, ad_title: ad.title, application_status: ad.application.status,
        ...news?.rows.find(row => row.application_id === ad.application.id) }))
    : (news?.rows || []).filter(row => row.chat_latest_at || Number(row.chat_unread) > 0);
  return source.map(row => ({ key: `ad:${row.application_id}`, kind: "private",
    name: row.participant_name || (side === "worker" ? "Įmonė" : "Kandidatas"), job: row.ad_title || ads.find(ad => ad.id === row.ad_id)?.title || "Darbo skelbimas",
    unread: Number(row.chat_unread || 0), lastAt: row.chat_latest_at || null,
    lastText: `${Number(row.chat_unread) > 0 ? "Nauja žinutė" : "Pokalbis"} · ${row.ad_title || ads.find(ad => ad.id === row.ad_id)?.title || "Darbo skelbimas"}`,
    onOpen: (hiddenBefore) => onOpen({ hiddenBefore, adId: row.ad_id, applicationId: row.application_id, title: row.participant_name || (side === "worker" ? "Įmonė" : "Kandidatas"),
      sub: row.ad_title || ads.find(ad => ad.id === row.ad_id)?.title || "Darbo skelbimas", closed: ["rejected", "withdrawn"].includes(row.application_status) }),
  }));
}
