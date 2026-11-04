export function isAdBoosted(ad, now = Date.now()) {
  return ad?.live === true && Number.isFinite(Date.parse(ad.boosted_until)) && Date.parse(ad.boosted_until) > now;
}
export function compareAdBoost(a, b, now = Date.now()) {
  const aa = isAdBoosted(a, now), bb = isAdBoosted(b, now);
  if (aa !== bb) return aa ? -1 : 1;
  if (aa) return (Date.parse(b.boosted_at) || 0) - (Date.parse(a.boosted_at) || 0);
  return 0;
}
export function boostRpcMissing(error) { return ["PGRST202", "42883"].includes(error?.code); }
export async function boostCompatibleRpc(supabase, preferred, legacy, args) {
  let result = await supabase.rpc(preferred, args);
  if (boostRpcMissing(result.error)) result = await supabase.rpc(legacy, args);
  return result;
}
