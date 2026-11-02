import { useEffect, useRef, useState } from "react";
import { Svg } from "../Shell.jsx";
import { EMPLOYER_PLANS, employerPlanAnnualPrice, employerPlanAnnualSavings, formatPlanPrice } from "../../employer/plans.js";

/* Prototipo ePlans. Kainos ir mygtukų logika – iš esamos Stripe sistemos (EmployerDashboard). */

const chevron = '<path d="m9 18 6-6-6-6"/>';
// Kortelių tekstai – tik tai, kas tikrai veikia svetainėje.
const CARD = {
  basic: { eb: "Pradžia", d: "Pradėti darbuotojų paiešką.", extra: ["Darbo skelbimai – 9,99 € / 30 d."] },
  business: { eb: "Reguliariai ieškantiems", d: "Daugiau atrankos ir valdymo galimybių.", extra: ["Darbo skelbimai – 9,99 € / 30 d.", "Mėnesio darbo ataskaita (PDF)"] },
  business_pro: { eb: "Komandai", d: "Neriboti darbai, komanda ir pilnas valdymas.", extra: ["Neriboti darbo skelbimai – nemokamai", "Darbų kalendorius"] },
};
const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width:981px)").matches;

export function EmployerPlans({ planKey, billing, cycle, setCycle, busy, isOwner, adminMode, onRequest, onPortal, onAdminActivate, notes }) {
  const [open, setOpen] = useState(() => (isDesktop() ? "" : "business_pro"));
  const leaveT = useRef(null);
  useEffect(() => () => clearTimeout(leaveT.current), []);
  const yr = cycle === "yearly";
  const currentBilling = billing?.billing_interval === "yearly" ? "yearly" : "monthly";
  const ord = { basic: 0, business: 1, business_pro: 2 };

  const button = (plan) => {
    const same = planKey === plan.key;
    const current = same && (plan.price === 0 || currentBilling === (plan.price === 0 ? "monthly" : cycle));
    const best = plan.key === "business_pro";
    if (adminMode) {
      return current ? <button className="btn pc-btn" type="button" disabled>Aktyvus planas</button>
        : <button className={`btn${best ? " primary" : ""} pc-btn`} type="button" disabled={busy} onClick={() => onAdminActivate(plan.key)}>{busy ? "Keičiama..." : "Aktyvuoti testavimui"}</button>;
    }
    if (!isOwner) return <button className="btn pc-btn" type="button" disabled>{current ? "Dabartinis planas" : "Keičia savininkas"}</button>;
    if (current && (plan.price === 0 || billing?.has_stripe_subscription)) {
      return plan.price > 0 ? <button className="btn pc-btn" type="button" disabled={busy} onClick={onPortal}>{busy ? "Atidaroma..." : "Valdyti prenumeratą"}</button>
        : <button className="btn pc-btn" type="button" disabled>Dabartinis planas</button>;
    }
    const label = same && billing?.has_stripe_subscription ? (yr ? "Pereiti į metinį" : "Pereiti į mėnesinį") : same ? `Tęsti ${plan.name}` : `Pereiti į ${plan.name}`;
    return <button className={`btn${ord[plan.key] > ord[planKey || "basic"] ? " primary" : ""} pc-btn`} type="button" disabled={busy} onClick={() => onRequest(plan.key)}>{busy ? "Atidaroma..." : label}</button>;
  };

  return (
    <>
      <div className="head"><div><h1>Planai</h1><p className="lead">Apmokama saugiai per Stripe. Prenumeratą valdo įmonės savininkas.</p></div>
        <div className="pertgl" role="group" aria-label="Atsiskaitymo laikotarpis">
          <button type="button" aria-pressed={!yr} onClick={() => setCycle("monthly")}>Kas mėnesį</button>
          <button type="button" aria-pressed={yr} onClick={() => setCycle("yearly")}>Už metus <em>−20 %</em></button>
        </div></div>
      {notes}
      <div className={`pcards${open ? " any" : ""}`} onMouseLeave={() => { if (isDesktop()) { clearTimeout(leaveT.current); leaveT.current = setTimeout(() => setOpen(""), 200); } }}>
        {EMPLOYER_PLANS.map((plan) => {
          const C = CARD[plan.key] || { eb: "", d: plan.description, extra: [] };
          const best = plan.key === "business_pro", on = plan.key === planKey, paid = plan.price > 0;
          const y = paid && yr;
          const year = employerPlanAnnualPrice(plan), save = employerPlanAnnualSavings(plan);
          const feats = [...plan.features, ...C.extra];
          return (
            <article key={plan.key} className={`pc${best ? " best" : ""}${on ? " on" : ""}${open === plan.key ? " open" : ""}`} tabIndex={0}
              onMouseEnter={() => { if (isDesktop()) { clearTimeout(leaveT.current); setOpen(plan.key); } }}
              onClick={() => { if (!isDesktop()) setOpen(plan.key); }}>
              <div className="pc-main">
                {best || on ? <div className="pc-ribs">{best ? <span className="pc-rib"><Svg name="star" size={13} width={2.4} />Geriausias pasirinkimas</span> : null}{on ? <span className="pc-rib cur"><Svg name="check" size={13} width={3} />Jūsų planas</span> : null}</div> : null}
                <span className="pc-eb">{C.eb}</span><h3>{plan.name}</h3><p className="pc-d">{C.d}</p>
                <div className="pc-price"><b>{formatPlanPrice(y ? year : plan.price)} €</b><span>/ {y ? "metus" : "mėn."}</span></div>
                {!paid ? <div className="pc-sub">Nemokamai visada</div>
                  : yr ? <div className="pc-sub"><span>≈ {formatPlanPrice(year / 12)} €/mėn.</span><span className="pc-save">Sutaupote {formatPlanPrice(save)} €</span></div>
                  : <div className="pc-sub"><span>Už metus – {formatPlanPrice(year)} €</span><span className="pc-save soft">sutaupytumėte {formatPlanPrice(save)} €</span></div>}
                {best ? <div className="pc-day"><Svg name="check" size={14} width={2.8} /><span>Visas mėnuo kainuoja <b>mažiau nei vieno darbuotojo darbo diena</b></span></div> : null}
                {button(plan)}
                <ul className="pc-mini">{plan.features.filter((x) => !/^Viskas/.test(x)).slice(0, 3).map((x) => <li key={x}><Svg name="check" size={14} width={2.6} /><span>{x}</span></li>)}</ul>
                <span className="pc-more">Visos galimybės <Svg size={14} width={2.4} paths={chevron} /></span>
              </div>
              <div className="pc-feat"><div className="pc-fin"><b className="pc-fh">Kas įeina</b>
                <ul>{feats.map((x) => <li key={x}><Svg name="check" size={15} width={2.6} /><span>{x}</span></li>)}</ul>
                {best ? <div className="pc-value"><Svg name="bolt" size={16} width={2.2} /><span>Basic ir Business planuose už kiekvieną darbo skelbimą mokate <b>9,99 € / 30 d.</b> Su Business Pro skelbimai <b>neriboti ir nemokami</b>.</span></div> : null}
              </div></div>
            </article>
          );
        })}
      </div>
      <div className="notebox">Naujoms įmonėms Business automatiškai aktyvuojamas 30 dienų nemokamai, be kortelės. Pasibaigus išbandymui, jei nepasirenkate mokamos prenumeratos, planas grįžta į nemokamą Basic.</div>
    </>
  );
}
