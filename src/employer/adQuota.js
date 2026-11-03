export function jobAdFreeAvailable(isPro, quota) {
  if (!isPro) return false;
  // Legacy accounts keep their current offer until the reviewed policy is enabled.
  return quota?.enabled !== true || (Number.isInteger(quota.remaining) && quota.remaining > 0);
}

export function jobAdQuotaUnsupported(error) {
  return error?.code === "PGRST202" || error?.code === "42883";
}

export function jobAdFirstFreeAvailable(offer) {
  return offer?.first_free_available === true;
}

export function jobAdOfferValid(offer, requireFirstFree = true) {
  if (!offer || typeof offer !== "object" || Array.isArray(offer) || typeof offer.enabled !== "boolean") return false;
  if (requireFirstFree && typeof offer.first_free_available !== "boolean") return false;
  if (!offer.enabled) return true;
  return offer.limit === 10 && Number.isInteger(offer.used) && offer.used >= 0 && offer.used <= 10
    && Number.isInteger(offer.remaining) && offer.remaining >= 0 && offer.remaining <= 10
    && typeof offer.resets_at === "string" && Number.isFinite(Date.parse(offer.resets_at));
}
