import { useState } from "react";
import { publicJobAdPath } from "../lib/publicJobAds.js";
import { Svg } from "./Shell.jsx";

export function ShareJobAdButton({ ad }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);
  const url = new URL(publicJobAdPath(ad.id), window.location.origin).href;
  async function share() {
    if (busy) return;
    setBusy(true); setStatus(""); setManual(false);
    try {
      if (navigator.share) await navigator.share({ title: ad.title, text: ad.company_name || "Statybos24", url });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setStatus("Nuoroda nukopijuota."); }
      else setManual(true);
    } catch (error) {
      if (error?.name !== "AbortError") setManual(true);
    } finally { setBusy(false); }
  }
  return <div><button className="btn sm" type="button" disabled={busy} onClick={share}><Svg name="clip" size={16} />Dalintis</button>
    {status ? <span className="small muted" role="status" style={{ marginLeft: 8 }}>{status}</span> : null}
    {manual ? <label className="field small">Skelbimo nuoroda<input readOnly value={url} onFocus={event => event.target.select()} /></label> : null}
  </div>;
}
