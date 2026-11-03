import { SiteSelect } from "../ui/SiteSelect.jsx";
import { useEffect, useState } from "react";
import { supabase } from "../lib/config.js";
import { PUBLIC_JOB_ADS_PATH, publicJobAdPath, publicJobRoute } from "../lib/publicJobAds.js";
import { AdCard, AdPage } from "../p24/worker/WorkerAds.jsx";
import { Empty } from "../p24/ui.jsx";
import "../p24/p24.css";
import "./publicJobAds.css";

const PAGE_SIZE = 24;
export function PublicJobAdsPage({ route, user, onLogin }) {
  const [city, setCity] = useState(() => new URLSearchParams(window.location.search).get("miestas") || "");
  const [page, setPage] = useState(0);
  const [ads, setAds] = useState([]);
  const [ad, setAd] = useState(null);
  const [cities, setCities] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [accountMessage, setAccountMessage] = useState("");
  useEffect(() => {
    if (route.invalid) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError("");
    (async () => {
      try {
        if (!supabase) throw new Error("Unavailable");
        const result = route.adId
          ? await supabase.rpc("job_ad_public_detail", { p_ad_id: route.adId })
          : await supabase.rpc("job_ads_public_list", { p_city: city || null, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE });
        if (result.error) throw result.error;
        if (!active) return;
        if (route.adId) {
          if (result.data && (result.data.id !== route.adId || result.data.live !== true)) throw new Error("Invalid advert");
          setAd(result.data || null);
        }
        else {
          if (!result.data || !Array.isArray(result.data.ads)) throw new Error("Invalid list");
          setAds(result.data.ads.filter(value => value && publicJobRoute(`${PUBLIC_JOB_ADS_PATH}/${value.id}`)?.adId));
          setMore(result.data.has_more === true);
        }
      } catch { if (active) setError("Nepavyko įkelti skelbimų. Bandykite dar kartą."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [route.adId, route.invalid, city, page, retry]);
  useEffect(() => {
    if (route.adId || route.invalid || !supabase) return;
    let active = true;
    supabase.rpc("job_ads_public_cities").then(({ data, error: failed }) => {
      if (active && !failed) setCities(Array.isArray(data) ? data.filter(value => typeof value === "string") : []);
    }).catch(() => {});
    return () => { active = false; };
  }, [route.adId, route.invalid, retry]);
  useEffect(() => {
    const previous = document.title;
    document.title = ad ? `${ad.title} – ${ad.company_name} | Statybos24` : "Darbo skelbimai | Statybos24";
    return () => { document.title = previous; };
  }, [ad]);
  function apply() {
    if (user) setAccountMessage("Kandidatuoti gali tik darbuotojo paskyra. Dabar esate prisijungę kito tipo paskyra.");
    else onLogin();
  }
  return <div className="p24 public-job-ads">
    <header className="public-ads-header"><div className="public-ads-width row">
      <a href="/" aria-label="Statybos24 pradžia"><img src="/brand-logo-tight.png" alt="statybos24.lt" /></a>
      <nav aria-label="Pagrindinis meniu"><a href={PUBLIC_JOB_ADS_PATH}>Darbo skelbimai</a></nav>
      {user ? <a className="btn sm" href="/">Mano paskyra</a> : <button className="btn sm" type="button" onClick={onLogin}>Prisijungti</button>}
    </div></header>
    <main className="public-ads-width public-ads-main">
      {route.adId || route.invalid ? <a className="linkbtn" href={PUBLIC_JOB_ADS_PATH}>← Visi darbo skelbimai</a> : <>
        <div className="head"><div><h1>Darbo skelbimai</h1><p className="lead">Darbas statybose. Skelbimus peržiūrėkite laisvai, o kandidatuokite su darbuotojo paskyra.</p></div></div>
        <label className="field adcity"><span>Miestas</span><SiteSelect value={city} onChange={event => {
          setCity(event.target.value); setPage(0);
          const url = new URL(window.location.href);
          if (event.target.value) url.searchParams.set("miestas", event.target.value); else url.searchParams.delete("miestas");
          window.history.replaceState(null, "", url.pathname + url.search);
        }}><option value="">Visi miestai</option>{[...new Set([...cities, city].filter(Boolean))].sort((a,b) => a.localeCompare(b,"lt")).map(value => <option key={value}>{value}</option>)}</SiteSelect></label>
      </>}
      {accountMessage ? <p className="ferr" role="alert">{accountMessage}</p> : null}
      {loading ? <p role="status">Įkeliama...</p> : error ? <section className="card"><p className="ferr" role="alert">{error}</p><button className="btn" type="button" onClick={() => setRetry(value => value + 1)}>Bandyti dar kartą</button></section>
        : route.invalid || (route.adId && !ad) ? <section className="card"><Empty title="Skelbimas nepasiekiamas" sub="Jis gali būti uždarytas arba jo galiojimas pasibaigęs." icon="briefcase" /></section>
        : route.adId ? <AdPage ad={ad} publicView onPublicApply={apply} />
        : <><section className="card">{ads.length ? <div className="list">{ads.map(value => <AdCard key={value.id} ad={value} publicHref={publicJobAdPath(value.id)} />)}</div>
          : <Empty title={city ? "Šiame mieste skelbimų nėra" : "Skelbimų dar nėra"} sub={city ? "Pasirinkite kitą miestą." : "Paskelbti darbo skelbimai bus rodomi čia."} icon="briefcase" />}</section>
          {page > 0 || more ? <nav className="row public-ads-pagination" aria-label="Skelbimų puslapiai"><button className="btn" disabled={!page} onClick={() => setPage(value => value - 1)}>Ankstesnis</button><span>{page + 1} puslapis</span><button className="btn" disabled={!more} onClick={() => setPage(value => value + 1)}>Kitas</button></nav> : null}</>}
    </main>
  </div>;
}
