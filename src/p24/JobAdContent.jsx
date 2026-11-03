import { Svg } from "./Shell.jsx";
const mapLink = address => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// The approved public/worker advert content, also shown to its employer.
export function JobAdContent({ ad }) {
  return (
<div className="jd-main">
          <section className="card jd-sec"><h2>Apie darbą</h2><div className="jd-desc">{String(ad.description || "").split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div></section>
          <section className="card jd-sec"><h2>Sąlygos</h2><dl className="jd-dl">
            <div><dt><Svg name="file" size={17} />Sutartis</dt><dd>{ad.contract_type || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="clock" size={17} />Darbo grafikas</dt><dd>{ad.schedule || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="cal" size={17} />Darbo pradžia</dt><dd>{ad.start_text || "Nenurodyta"}</dd></div>
            <div><dt><Svg name="pin" size={17} />Darbo vieta</dt><dd>{ad.address || ad.city}<a className="jd-map" href={mapLink(ad.address || ad.city)} target="_blank" rel="noopener noreferrer">Rodyti žemėlapyje ↗</a></dd></div>
          </dl></section>
          {(ad.requirements?.length || ad.offers?.length) ? (
            <div className="adcols">
              {ad.requirements?.length ? <section className="card jd-sec"><h2>Reikalavimai</h2><ul className="adlist">{ad.requirements.map((r, i) => <li key={i}><Svg name="check" size={15} width={2.4} />{r}</li>)}</ul></section> : null}
              {ad.offers?.length ? <section className="card jd-sec"><h2>Siūlome</h2><ul className="adlist">{ad.offers.map((r, i) => <li key={i}><Svg name="check" size={15} width={2.4} />{r}</li>)}</ul></section> : null}
            </div>) : null}
        </div>
  );
}
