"""Synthetic login layout/error checks. No real credentials or external requests."""
from pathlib import Path
import mimetypes
import subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/tmp/s24-hire-login');OUT.mkdir(exist_ok=True)
entry='import {createRoot} from "'+str(ROOT/'node_modules/react-dom/client.js')+'"; import "'+str(ROOT/'src/styles.css')+'"; import "'+str(ROOT/'src/p24/p24.css')+'"; import {HireEmployerLoginPage} from "'+str(ROOT/'src/hire/hirePortalShared.jsx')+'"; createRoot(document.getElementById("root")).render(<HireEmployerLoginPage/>);'
(OUT/'entry.jsx').write_text(entry)
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(OUT/'entry.jsx'),'--bundle',f'--outdir={OUT}/bundle','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:react={ROOT}/node_modules/react',f'--alias:react-dom={ROOT}/node_modules/react-dom',f'--alias:@supabase/supabase-js={ROOT}/docs/redesign/tools/stubs/supabase.js',f'--alias:@sentry/react={ROOT}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=false','--define:import.meta.env.MODE="hire"','--define:import.meta.env.VITE_SUPABASE_URL="https://supabase.invalid"','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY="synthetic"','--log-level=error'],cwd=ROOT,check=True)
html='<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><link rel="stylesheet" href="/bundle/app.css"><script type="module" src="/bundle/app.js"></script>'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in [1440,555,390]:
        for lang in ['lt','en','de','nl','no','sv','da']:
            c=b.new_context(viewport={'width':width,'height':900},service_workers='block')
            def handler(r):
                from urllib.parse import urlsplit
                u=urlsplit(r.request.url)
                if u.hostname!='hire.test':return r.abort()
                file=(OUT/u.path.lstrip('/')) if u.path.startswith('/bundle/') else ROOT/'public'/u.path.lstrip('/')
                if file.is_file():return r.fulfill(path=str(file),content_type=mimetypes.guess_type(file)[0] or 'application/octet-stream')
                return r.fulfill(body=html,content_type='text/html')
            c.route('**/*',handler);pg=c.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
            pg.goto('http://hire.test/login?lang='+lang,wait_until='domcontentloaded')
            pg.locator('.hp-card').wait_for()
            assert pg.locator('.hp-card h2').count()==0
            pg.locator('#hl-e').fill('ID-SYNTHETIC');pg.locator('#hl-p').fill('synthetic-only')
            pg.locator('button[type=submit]').click()
            pg.get_by_role('alert').wait_for()
            metrics=pg.locator('.hp-card .form').evaluate('e=>{const r=e.getBoundingClientRect(),b=e.querySelector("button[type=submit]"),a=e.querySelector(".ferr");return {width:r.width,button:b.getBoundingClientRect().width,error:a.getBoundingClientRect().width,clipped:b.scrollWidth>b.clientWidth,overflow:document.documentElement.scrollWidth>innerWidth}}')
            assert abs(metrics['button']-metrics['width'])<1 and abs(metrics['error']-metrics['width'])<1,metrics
            assert not metrics['clipped'] and not metrics['overflow'],metrics
            if lang=='lt':
                assert pg.locator('button[type=submit]').inner_text()=='Prisijungti'
                pg.screenshot(path=str(OUT/f'login-fixed-{width}.png'),mask=[pg.locator('#hl-p')])
            assert not errors,errors
            c.close()
        print(width,'PASS: 7 languages, no repeated heading, full-width error/button, no clipping',flush=True)
    b.close()
