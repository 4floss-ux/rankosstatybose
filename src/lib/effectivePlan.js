// Realiai galiojantis įmonės planas, atitinkantis DB company_effective_plan:
// atšaukta, nesumokėta ar pasibaigusi prenumerata reiškia Basic, net jei
// companies.plan_key vis dar rodo buvusį planą.
export function effectivePlanKey(company, now = Date.now()) {
  const status = company?.subscription_status;
  const end = company?.plan_current_period_end ? new Date(company.plan_current_period_end).getTime() : null;
  const live = status === "active" || status === "past_due" || (status === "trialing" && (end == null || end > now));
  return live ? company?.plan_key || "basic" : "basic";
}
