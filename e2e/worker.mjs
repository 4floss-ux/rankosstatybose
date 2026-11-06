import { STAGE_URL, SITE_ORIGIN, ALLOWED_EMAILS, allowedUser, publicStageKey, allowedBackendPath } from './policy.mjs';
const COOKIE = '__Host-s24-e2e';
const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const json = (value, status=200) => new Response(JSON.stringify(value),{status,headers:JSON_HEADERS});
const clearCookie = `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
function cookie(token, seconds) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${Math.max(1,Math.min(3600,Number(seconds)||3600))}`;
}
function cookieToken(request) {
  const value=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
  try {return value ? decodeURIComponent(value.slice(COOKIE.length+1)) : '';} catch {return '';}
}
const loginPage = `<!doctype html><html lang="lt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Statybos24 · Testinė svetainė</title><style>body{background:#f5f5f9;color:#222631;font:16px system-ui;margin:0;min-height:100vh;display:grid;place-items:center}main{background:white;border:1px solid #dedde8;border-radius:10px;padding:28px;width:min(360px,calc(100vw - 80px))}label{display:grid;gap:6px;margin:16px 0}input,button{box-sizing:border-box;min-height:44px;border-radius:6px;border:1px solid #dedde8;padding:10px;font:inherit}button{background:#6b5b95;color:white;width:100%;cursor:pointer}small,p{color:#647089;line-height:1.5}[role=alert]{color:#c43b32}</style><main><b>STATYBOS24 · TESTINĖ APLINKA</b><h1>Prisijungti</h1><p>Privati svetainė trims sutartoms testinėms paskyroms. Naudokite atskiros testinės paskyros duomenis.</p><form><label>El. paštas<input name="email" type="email" autocomplete="username" required></label><label>Testinis slaptažodis<input name="password" type="password" autocomplete="current-password" required></label><button>Prisijungti</button><p role="alert"></p></form><small>Tik testiniai duomenys. Tikri mokėjimai ir išorinis siuntimas išjungti.</small></main><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button'),a=f.querySelector('[role=alert]');b.disabled=true;a.textContent='';try{const r=await fetch('/__e2e/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(f)))});if(!r.ok)throw Error();const s=await r.json();localStorage.setItem('sb-wpldojonwvccdmpmlbfe-auth-token',JSON.stringify(s));location.replace('/')}catch{a.textContent='Prisijungti nepavyko. Patikrinkite testinės paskyros duomenis.'}finally{b.disabled=false}}</script></html>`;
async function authUser(token, key, fetcher) {
  if (!token || token.length>8192) return null;
  const response=await fetcher(STAGE_URL+'/auth/v1/user',{headers:{apikey:key,authorization:'Bearer '+token},redirect:'error'});
  if (!response.ok) return null;
  const user=await response.json();return allowedUser(user) ? user : null;
}
function protect(response) {
  const headers=new Headers(response.headers);
  headers.set('cache-control','no-store');
  headers.set('x-robots-tag','noindex, nofollow, noarchive');
  headers.set('referrer-policy','no-referrer');
  headers.set('x-content-type-options','nosniff');
  headers.set('content-security-policy',`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${STAGE_URL}; font-src 'self' data:; connect-src 'self' wss://statybos24-e2e-test.4floss.workers.dev; frame-src 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; base-uri 'none'`);
  headers.set('permissions-policy','payment=(), notifications=()');
  headers.delete('access-control-allow-origin');
  return new Response(response.body,{status:response.status,headers});
}
export async function handle(request, env, fetcher=fetch) {
  const url=new URL(request.url);
  // A distinct Worker and exact hostname are mandatory. Never answer for production.
  if (url.origin!==SITE_ORIGIN || env.E2E_SAFETY_VERIFIED!=='20261106' || !publicStageKey(env.E2E_SUPABASE_PUBLISHABLE_KEY)) return protect(json({error:'Testinė aplinka dar neparuošta.'},503));
  const key=env.E2E_SUPABASE_PUBLISHABLE_KEY;
  const write=!['GET','HEAD'].includes(request.method);
  if (write && request.headers.get('origin')!==url.origin) return protect(json({error:'Forbidden'},403));
  const path=url.pathname;
  const backendPrefix='/__e2e/supabase';
  const backendPath=path.startsWith(backendPrefix+'/') ? path.slice(backendPrefix.length) : null;
  const isLogin=path==='/__e2e/login' && request.method==='POST';
  const isRefresh=backendPath==='/auth/v1/token' && request.method==='POST' && url.searchParams.get('grant_type')==='refresh_token';
  if (isLogin || isRefresh) {
    if (Number(request.headers.get('content-length')||0)>16384) return protect(json({error:'Too large'},413));
    let input;try {const raw=await request.text();if(raw.length>16384)throw Error();input=JSON.parse(raw);} catch{return protect(json({error:'Invalid request'},400));}
    if (isLogin && (!ALLOWED_EMAILS.has(String(input.email||'').trim().toLowerCase()) || typeof input.password!=='string')) return protect(json({error:'Prisijungti nepavyko.'},401));
    const body=isLogin ? {email:input.email.trim().toLowerCase(),password:input.password} : {refresh_token:input.refresh_token};
    const response=await fetcher(STAGE_URL+'/auth/v1/token?grant_type='+(isLogin?'password':'refresh_token'),{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(body),redirect:'error'});
    const session=await response.json().catch(()=>null);
    if (!response.ok || !session?.access_token || !allowedUser(session.user) || !await authUser(session.access_token,key,fetcher)) return protect(json({error:'Prisijungti nepavyko.'},401));
    // Browser receives this session only through the protected same-origin endpoint.
    const result=json(session);result.headers.set('set-cookie',cookie(session.access_token,session.expires_in));return protect(result);
  }
  if (path==='/__e2e/login' && request.method==='GET') return protect(new Response(loginPage,{headers:{'content-type':'text/html; charset=utf-8'}}));
  const token=cookieToken(request);
  const user=await authUser(token,key,fetcher);
  if (!user) {
    if (backendPath || path.startsWith('/__e2e/')) return protect(json({error:'Authentication required'},401));
    return protect(new Response(null,{status:303,headers:{location:'/__e2e/login'}}));
  }
  if (path==='/__e2e/session') return protect(json({access_token:token}));
  if (backendPath==='/realtime/v1/websocket') {
    if(request.method!=='GET' || request.headers.get('upgrade')?.toLowerCase()!=='websocket' || request.headers.get('origin')!==SITE_ORIGIN) return protect(json({error:'Forbidden'},403));
    const target=new URL(STAGE_URL+backendPath);target.searchParams.set('apikey',key);target.searchParams.set('vsn','1.0.0');
    return fetcher(target.href,{headers:{upgrade:'websocket',authorization:'Bearer '+token,apikey:key},redirect:'error'});
  }
  if (backendPath) {
    if (/%2e|%2f|%5c/i.test(backendPath) || backendPath.includes('\\')) return protect(json({error:'Invalid path'},400));
    if (backendPath==='/auth/v1/token' || !allowedBackendPath(backendPath,request.method)) return protect(json({error:'Šis išorinis veiksmas testinėje aplinkoje išjungtas.'},403));
    // Password change, registration, recovery, MFA and outbound auth emails are not proxied.
    if (backendPath==='/auth/v1/user' && request.method!=='GET') return protect(json({error:'Auth changes disabled'},403));
    const headers=new Headers({'apikey':key,'authorization':'Bearer '+token});
    for (const name of ['content-type','prefer','range','accept','accept-profile','content-profile','x-upsert','if-none-match']) if(request.headers.has(name)) headers.set(name,request.headers.get(name));
    const response=await fetcher(STAGE_URL+backendPath+url.search,{method:request.method,headers,body:write?request.body:undefined,redirect:'error'});
    const result=new Response(response.body,{status:response.status,headers:response.headers});
    if (backendPath==='/auth/v1/logout') result.headers.set('set-cookie',clearCookie);
    return protect(result);
  }
  if (path==='/api/status') return protect(json({ok:true,maintenance:false,test:true}));
  if (path.startsWith('/api/') || path.startsWith('/__e2e/')) return protect(json({error:'External integrations disabled'},403));
  if (['/statybos24-push-sw.js','/sw.js','/service-worker.js'].includes(path)) return protect(new Response('',{status:410}));
  return protect(await env.ASSETS.fetch(request));
}
export default {async fetch(request,env){try{return await handle(request,env);}catch{return protect(json({error:'Testinės aplinkos klaida.'},503));}}};
