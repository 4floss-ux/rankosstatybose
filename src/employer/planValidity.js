// Display only. All plan permissions and payment actions remain server-controlled.
export function employerPlanValidity(planKey, billing, summary, now = Date.now()) {
  const key = billing?.effective_plan_key || planKey || summary?.plan_key;
  if (!key) return null;
  if (key === "basic") return { key, label: "Galiojimas", value: "Neterminuotas", detail: "Nemokamas Basic planas." };
  const date = value => {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  };
  const format = timestamp => new Intl.DateTimeFormat("lt-LT", {
    timeZone: "Europe/Vilnius", year: "numeric", month: "long", day: "numeric",
  }).format(new Date(timestamp));
  const periodEnd = date(billing?.current_period_end) ?? date(summary?.current_period_end);
  const graceEnd = date(billing?.payment_grace_until);
  const status = billing?.subscription_status ?? summary?.subscription_status;
  const cancelled = billing?.cancel_at_period_end ?? summary?.cancel_at_period_end;
  if (status === "past_due" && billing?.in_payment_grace && graceEnd != null && graceEnd > now) {
    return { key, label: "Plano teisės galioja iki", value: format(graceEnd), detail: "Laukiama apmokėjimo. Atnaujinkite mokėjimo būdą." };
  }
  const label = status === "trialing" ? "Išbandymas iki"
    : periodEnd != null && periodEnd <= now ? "Paskutinio laikotarpio pabaiga" : "Planas galioja iki";
  const detail = cancelled ? "Automatinis pratęsimas išjungtas. Pasibaigus laikotarpiui planas taps Basic."
    : status === "trialing" ? (billing?.has_stripe_subscription ? "Išbandymo pabaigoje prenumerata bus tęsiama pagal jos nustatymus." : "Išbandymo laikotarpis.")
    : status === "active" && billing?.has_stripe_subscription === true ? "Prenumerata pratęsiama automatiškai, jei jos neatšauksite."
    : status === "active" && billing?.has_stripe_subscription === false ? "Mokama prenumerata neprijungta."
    : "Pratęsimo informacija nepateikta.";
  return { key, label, value: periodEnd == null ? "Data nepateikta" : format(periodEnd), detail };
}
