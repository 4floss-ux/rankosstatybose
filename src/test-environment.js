// This branch's previews always use a data-less Supabase branch, even when
// Workers Builds inherits production VITE_* variables. Never fall back to main.
export const isTestEnvironment = import.meta.env.MODE === 'staging' ||
  !['statybos24.lt', 'www.statybos24.lt'].includes(window.location.hostname);
export const testSupabaseUrl = 'https://wpldojonwvccdmpmlbfe.supabase.co';
export const testSupabaseKey = 'sb_publishable_ePFObotMe2_u0f_8wcSZww_PtTWxv_S';

if (isTestEnvironment) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin);
    // Cloned Edge Functions may still have production integrations configured.
    if ((url.hostname.endsWith('.supabase.co') &&
        (url.origin !== testSupabaseUrl || url.pathname.startsWith('/functions/'))) ||
        (url.origin === location.origin && url.pathname.startsWith('/api/'))) {
      return Promise.reject(new Error('Testavimo aplinkoje ši išorinė integracija išjungta.'));
    }
    return originalFetch(input, init);
  };
  document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex,nofollow');
}
