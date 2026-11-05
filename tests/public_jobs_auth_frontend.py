"""Full App with mocked auth: exact public-ad return and once-only UI flow.
No real sign-in, email delivery, Supabase or payments are tested here.
"""
from pathlib import Path
import subprocess,mimetypes,json,tempfile
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path(tempfile.mkdtemp(prefix='s24-public-auth-'))
stub=(ROOT/'docs/redesign/tools/stubs/supabase.js').read_text().replace('const ROLE =','let ROLE =').replace('const USER =','let USER =').replace('const SESSION =','let SESSION =')
stub=stub.replace('function chain(kind, name)', 'function chain(kind, name, args)')
stub=stub.replace('const res = () => {','''const res = () => {
 if(kind==='rpc'){
  window.__calls=window.__calls||[];window.__calls.push(name);
  const ad=window.__DATA['rpc:job_ads_worker_list'][0];
  if(name==='job_ad_public_detail')return {data:ad,error:null};
  if(name==='job_ad_apply'){
   if(ad.application)return {error:{message:'Jau kandidatavote'}};
   ad.application={id:'synthetic-application',status:'sent'};return {data:ad.application.id,error:null};
  }
 }
''')
stub=stub.replace('rpc: (n) => chain("rpc", n)', 'rpc: (n,args) => chain("rpc", n,args)')
stub=stub.replace('onAuthStateChange: () =>', 'onAuthStateChange: (cb) => (window.__authCallback=cb,')
stub=stub.replace('signOut: async', 'signInWithPassword: async()=>{ROLE="worker";USER={id:"00000000-0000-0000-0000-000000000001",email:"synthetic@example.invalid",user_metadata:{role:"worker"},app_metadata:{}};SESSION={user:USER,access_token:"synthetic",refresh_token:"synthetic",expires_at:9999999999};window.__authCallback("SIGNED_IN",SESSION);return {data:{user:USER,session:SESSION},error:null};}, signOut: async')
# Close the additional grouping around the callback registration expression.
stub=stub.replace('unsubscribe() {} } } }), signInWithPassword', 'unsubscribe() {} } } })), signInWithPassword')
(OUT/'stub.js').write_text(stub)
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(ROOT/'src/main.jsx'),'--bundle','--splitting',f'--outdir={OUT}/bundle','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:@supabase/supabase-js={OUT}/stub.js',f'--alias:@sentry/react={ROOT}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=true','--define:import.meta.env.VITE_SUPABASE_URL="https://supabase.invalid"','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY="synthetic"','--define:process.env.NODE_ENV="production"','--log-level=error'],cwd=ROOT,check=True)
fixture=(ROOT/'docs/redesign/tools/wdata.js').read_text()+'''
window.__DATA['rpc:job_ads_worker_list']=[{id:'20000000-0000-4000-8000-000000000100',company_id:'c1',company_name:'UAB Pavyzdys',title:'Sintetinis statybininkas',city:'Vilnius',salary_min:1500,description:'Sintetinis darbo aprašymas',requirements:[],offers:[],live:true,published_at:'2026-11-03T10:00:00Z',expires_at:'2099-01-01T00:00:00Z'}];
'''
html='<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script>'+fixture+'</script><link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  ctx=b.new_context(viewport={'width':width,'height':900},service_workers='block');errors=[]
  def route(r):
   u=urlsplit(r.request.url)
   if u.hostname!='s24.test':return r.abort()
   if u.path.startswith('/__b/'):
    path=OUT/'bundle'/u.path.removeprefix('/__b/');return r.fulfill(path=str(path),content_type=mimetypes.guess_type(str(path))[0] or 'application/javascript')
   if u.path.startswith('/api/'):return r.fulfill(json={'ok':True,'maintenance':False})
   path=ROOT/'public'/u.path.lstrip('/')
   if path.is_file():return r.fulfill(path=str(path))
   return r.fulfill(body=html,content_type='text/html')
  ctx.route('**/*',route);page=ctx.new_page();page.set_default_timeout(10000);page.on('pageerror',lambda e:errors.append(str(e)))
  url='http://s24.test/darbo-skelbimai/20000000-0000-4000-8000-000000000100'
  page.goto(url,wait_until='domcontentloaded');page.get_by_role('button',name='Kandidatuoti',exact=True).click()
  page.locator('#a-mail').fill('synthetic@example.invalid');page.locator('#a-pass').fill('synthetic-only-password')
  page.locator('form button[type=submit]').click()
  page.locator('.app').first.wait_for();page.get_by_role('button',name='Kandidatuoti',exact=True).wait_for()
  assert page.url==url
  assert page.get_by_role('heading',name='SINTETINIS STATYBININKAS',exact=True).inner_text().lower()=='sintetinis statybininkas'
  page.get_by_role('button',name='Kandidatuoti',exact=True).click()
  page.get_by_role('button',name='Siųsti kandidatūrą',exact=True).click()
  page.wait_for_function("document.body.textContent.includes('Peržiūrėjo')")
  assert page.get_by_role('button',name='Kandidatuoti',exact=True).count()==0
  assert page.get_by_role('button',name='Atšaukti kandidatūrą',exact=True).count()==0
  assert page.evaluate("window.__calls.filter(n=>n==='job_ad_apply').length")==1
  # Public home remains accessible without signing out, and account return works.
  ctx.add_init_script("window.__ROLE='worker'")
  page.goto('http://s24.test/?pradzia=1',wait_until='domcontentloaded')
  page.locator('[data-act="auth"][data-v="login"]:visible').first.wait_for()
  page.wait_for_function("document.querySelector('[data-act=auth][data-v=login]').textContent==='Mano paskyra'")
  if width<640:
   page.locator('.lp-burger').click()
   page.locator('.lp-mmenu [data-act="auth"][data-v="login"]').click()
  else:
   page.locator('.lp-hacts [data-act="auth"][data-v="login"]').click()
  page.wait_for_url('http://s24.test/')
  page.locator('.app').first.wait_for()
  assert not errors,errors
  print(f'PASS {width}px: full App mocked login returns to exact ad; application sent once; no withdrawal')
  ctx.close()
 b.close()
