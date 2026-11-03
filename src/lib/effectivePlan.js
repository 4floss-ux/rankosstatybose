// Frontend atitikmuo DB public.company_effective_plan(p_company_id).
// Naudoti tik su pilnais įmonės prenumeratos laukais (ne vien admin RPC santrauka).
export function effectivePlanKey(company, now = Date.now()) {
  if (!company) return "basic";
  const status = company.subscription_status;
  const periodEnd = company.plan_current_period_end == null
    ? null : new Date(company.plan_current_period_end).getTime();
  const graceUntil = company.payment_grace_until == null
    ? null : new Date(company.payment_grace_until).getTime();
  const trialValid = status === "trialing" &&
    (periodEnd == null || periodEnd > now);
  const graceValid = status === "past_due" &&
    graceUntil != null && graceUntil > now;
  if (status !== "active" && !trialValid && !graceValid) return "basic";

  const pendingAt = company.pending_plan_effective_at == null
    ? null : new Date(company.pending_plan_effective_at).getTime();
  return company.pending_plan_key && pendingAt != null && pendingAt <= now
    ? company.pending_plan_key
    : company.plan_key || "basic";
}
