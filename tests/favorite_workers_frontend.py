"""Synthetic full-App navigation; no real accounts, database writes or payments."""
from pathlib import Path
from urllib.parse import urlsplit
import subprocess,mimetypes
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/tmp/s24-unified-favorites-check');OUT.mkdir(exist_ok=True)
stub=(ROOT/'docs/redesign/tools/stubs/supabase.js').read_text()
stub=stub.replace('rpc: (n) => chain("rpc", n)', '''rpc: (n,args) => { (window.__CALLS ||= []).push({n,args});if(n==='remove_worker_from_company_team')window.__DATA['rpc:get_company_saved_workers']=window.__DATA['rpc:get_company_saved_workers'].filter(w=>w.worker_id!==args.p_worker_id);return chain("rpc",n); }''')
(OUT/'stub.js').write_text(stub)
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(ROOT/'src/main.jsx'),'--bundle','--splitting',f'--outdir={OUT}/bundle','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:@supabase/supabase-js={OUT}/stub.js',f'--alias:@sentry/react={ROOT}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=true','--define:import.meta.env.VITE_SUPABASE_URL="https://supabase.invalid"','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY="synthetic"','--define:process.env.NODE_ENV="production"','--log-level=error'],cwd=ROOT,check=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  context=browser.new_context(viewport={'width':width,'height':950},service_workers='block');page=context.new_page();page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  html='<div id="root"></div><script>window.__ROLE="employer";</script><script>'+(ROOT/'docs/redesign/tools/edata.js').read_text()+'</script><link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>'
  def route(r):
   u=urlsplit(r.request.url)
   if u.hostname!='s24.test':return r.abort()
   if u.path.startswith('/__b/'):
    path=OUT/'bundle'/u.path.removeprefix('/__b/');return r.fulfill(path=str(path),content_type=mimetypes.guess_type(str(path))[0] or 'application/javascript')
   if u.path.startswith('/api/'):return r.fulfill(json={'ok':True,'maintenance':False})
   path=ROOT/'public'/u.path.lstrip('/')
   if path.is_file():return r.fulfill(path=str(path))
   return r.fulfill(body=html,content_type='text/html')
  context.route('**/*',route);page.goto('http://s24.test/',wait_until='networkidle');page.locator('.app').first.wait_for()
  if width<900:page.get_by_role('button',name='Atidaryti meniu',exact=True).click()
  nav=page.locator('.drawer .item' if width<900 else '.side:not(.drawer) .item').filter(has_text='Mėgstami darbuotojai')
  assert nav.count()==1;nav.click()
  section=page.locator('[data-wv=favorites]');section.get_by_role('heading',name='Mėgstami darbuotojai',exact=True).wait_for()
  section.locator('.wk').nth(1).wait_for();assert section.locator('.wk').count()==2
  assert page.locator('.ed-saved-overlay').count()==0
  assert 'favorit' not in page.locator('.app').inner_text().lower()
  assert page.evaluate("!window.__CALLS.some(c=>c.n==='remove_worker_from_company_team'||c.n==='save_worker_to_company_team')")
  section.get_by_role('button',name='Profilis',exact=True).first.click();page.get_by_role('dialog').last.wait_for()
  page.get_by_role('button',name='Uždaryti',exact=True).last.click()
  section.get_by_role('button',name='Pašalinti iš mėgstamų',exact=True).first.click()
  page.wait_for_function("window.__CALLS.some(c=>c.n==='remove_worker_from_company_team')")
  page.wait_for_function("document.querySelectorAll('[data-wv=favorites] .wk').length===1")
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert not errors,errors
  page.screenshot(path=f'/tmp/s24-unified-favorites-{width}.png',full_page=True)
  print(f'PASS {width}px: one favorite-workers section; existing saved records/profile/removal retained; no legacy modal or duplicate labels; synthetic only')
  context.close()
 browser.close()
