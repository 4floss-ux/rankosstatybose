export const e2eEnabled = import.meta.env.VITE_E2E_REAL_ACCOUNTS === 'true';
const stage = 'https://wpldojonwvccdmpmlbfe.supabase.co';
export async function e2eFetch(input, init) {
  const source = new Request(input, init);
  const url = new URL(source.url);
  if (url.origin !== stage) throw new Error('E2E: production and external requests are disabled.');
  const target = new URL('/__e2e/supabase'+url.pathname+url.search,window.location.origin);
  return fetch(new Request(target,source));
}
export async function bootstrapE2eSession(client) {
  if (!e2eEnabled) return;
  const response=await fetch('/__e2e/session',{cache:'no-store'});
  if (!response.ok) {window.location.replace('/__e2e/login');throw new Error('E2E sign-in required');}
  const data=await response.json();
  const saved=JSON.parse(localStorage.getItem('sb-wpldojonwvccdmpmlbfe-auth-token')||'null');
  if (!saved?.refresh_token) {window.location.replace('/__e2e/login');throw new Error('E2E session missing');}
  const {error}=await client.auth.setSession({access_token:data.access_token,refresh_token:saved.refresh_token});
  if (error) {window.location.replace('/__e2e/login');throw error;}
}
// Keep the real dashboards' live subscriptions, confined to the same protected host.
export class E2eWebSocket extends WebSocket {
  constructor(input, protocols) {
    const url=new URL(input);
    if(url.origin!=='wss://wpldojonwvccdmpmlbfe.supabase.co' || url.pathname!=='/realtime/v1/websocket') throw new Error('External realtime is disabled.');
    const proxy=new URL('/__e2e/supabase'+url.pathname+url.search,window.location.origin);
    proxy.protocol='wss:';
    super(proxy.href,protocols);
  }
}
