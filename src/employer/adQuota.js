export function jobAdFreeAvailable(isPro, quota) {
  if (!isPro) return false;
  // Legacy accounts keep their current offer until the reviewed policy is enabled.
  return quota?.enabled !== true || (Number.isInteger(quota.remaining) && quota.remaining > 0);
}

export function jobAdQuotaUnsupported(error) {
  return error?.code === "PGRST202" || error?.code === "42883";
}
