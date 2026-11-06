export const STAGE_REF = 'wpldojonwvccdmpmlbfe';
export const STAGE_URL = `https://${STAGE_REF}.supabase.co`;
export const SITE_ORIGIN = 'https://statybos24-e2e-test.4floss.workers.dev';
export const ALLOWED_EMAILS = new Set([
  '4floss@gmail.com', 'tattoo.staponas@gmail.com', 'beatabune@gmail.com',
]);
export function allowedUser(user) {
  return Boolean(user?.id && user.email_confirmed_at &&
    ALLOWED_EMAILS.has(String(user.email || '').trim().toLowerCase()));
}
export function publicStageKey(key) {
  if (typeof key !== 'string') return false;
  if (key.startsWith('sb_publishable_') && key.length > 30) return true;
  try {
    const part = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const value = JSON.parse(atob(part));
    return value.role === 'anon' && value.ref === STAGE_REF;
  } catch { return false; }
}
// Deliberately no Edge Function forwarding: payments, emails, push and actor
// brokers remain unavailable until separately reviewed staging implementations exist.
export function allowedBackendPath(path, method) {
  if (path.startsWith('/functions/') || path.startsWith('/realtime/')) return false;
  if (path === '/auth/v1/token') return method === 'POST';
  if (['/auth/v1/user', '/auth/v1/logout'].includes(path)) return ['GET', 'POST', 'PUT'].includes(method);
  return path.startsWith('/rest/v1/') || path.startsWith('/storage/v1/');
}
