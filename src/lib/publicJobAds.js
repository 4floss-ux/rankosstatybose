const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PUBLIC_JOB_ADS_PATH = "/darbo-skelbimai";
export function publicJobAdPath(id) {
  if (!UUID.test(String(id || ""))) throw new Error("Invalid job ad ID");
  return `${PUBLIC_JOB_ADS_PATH}/${id.toLowerCase()}`;
}
export function publicJobRoute(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === PUBLIC_JOB_ADS_PATH) return { list: true };
  if (!path.startsWith(`${PUBLIC_JOB_ADS_PATH}/`)) return null;
  const id = path.slice(PUBLIC_JOB_ADS_PATH.length + 1);
  return UUID.test(id) ? { adId: id.toLowerCase() } : { invalid: true };
}
export function publicJobAuthReturnUrl(path, origin) {
  const route = typeof path === "string" ? publicJobRoute(path) : null;
  if (!route || route.invalid) return origin;
  return new URL(route.adId ? publicJobAdPath(route.adId) : PUBLIC_JOB_ADS_PATH, origin).href;
}
