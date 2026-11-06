"""Real App components with mocked isolated data; NOT a live database test."""
from pathlib import Path
from urllib.parse import urlsplit
import subprocess,json,tempfile,mimetypes
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];out=Path(tempfile.mkdtemp(prefix='s24-isolated-screens-'))
entry=out/'entry.jsx';entry.write_text("import React from 'react';import{createRoot}from'react-dom/client';import{App}from'"+str(root/'src/App.jsx')+"';import '"+str(root/'src/styles.css')+"';createRoot(document.getElementById('root')).render(<React.Suspense fallback={<p>Įkeliama</p>}><App/></React.Suspense>)")
# Keep module resolution inside this checkout for the generated entry.
entry=root/'e2e/.screen-test-entry.jsx';entry.write_text((out/'entry.jsx').read_text())
try:
 subprocess.run([str(root/'node_modules/.bin/esbuild'),str(entry),'--bundle','--splitting',f'--outdir={out}/bundle','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:@supabase/supabase-js={root}/docs/redesign/tools/stubs/supabase.js',f'--alias:@sentry/react={root}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=true','--define:import.meta.env.VITE_E2E_REAL_ACCOUNTS="true"','--define:import.meta.env.VITE_SUPABASE_URL="https://wpldojonwvccdmpmlbfe.supabase.co"','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_synthetic_local_only"','--define:process.env.NODE_ENV="production"','--log-level=error'],cwd=root,check=True)
finally:entry.unlink(missing_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for role,fixture in [('worker','wdata.js'),('employer','edata.js'),('admin','adata.js')]:
  for width in [1440,390]:
   page=browser.new_page(viewport={'width':width,'height':950});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   data=(root/'docs/redesign/tools'/fixture).read_text();html='<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script>window.__ROLE='+json.dumps(role)+';'+data+'</script><link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>'
   def route(r):
    u=urlsplit(r.request.url)
    if u.hostname!='e2e.test':return r.abort()
    if u.path.startswith('/__b/'):
     path=out/'bundle'/u.path.removeprefix('/__b/');return r.fulfill(path=str(path),content_type=mimetypes.guess_type(str(path))[0] or 'application/javascript')
    if u.path=='/api/status':return r.fulfill(json={'ok':True,'maintenance':False,'test':True})
    asset=root/'public'/u.path.lstrip('/')
    if asset.is_file():return r.fulfill(path=str(asset))
    return r.fulfill(body=html,content_type='text/html')
   page.route('**/*',route);page.goto('https://e2e.test/?testas=1');page.locator('.app').first.wait_for(timeout=20000)
   note=page.get_by_role('note',name='Izoliuota tikrų paskyrų testavimo aplinka');note.wait_for();assert role in note.inner_text();assert page.get_by_role('button',name='Pakeisti testinę paskyrą',exact=True).count()==1
   assert page.locator('.qa-roles,.qa-banner').count()==0
   assert not errors,errors
   page.screenshot(path=str(out/f'{role}-{width}.png'));page.close();print(f'PASS {role} {width}px: real dashboard and isolated account bar; synthetic data only')
 browser.close()
