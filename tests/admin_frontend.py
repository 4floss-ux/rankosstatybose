"""Synthetic frontend regression checks. All nonlocal requests are blocked; no DB integration."""
import argparse
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', default='/tmp/s24-admin-confirmed')
args = parser.parse_args()
OUT = Path(args.output); OUT.mkdir(parents=True, exist_ok=True)
stub = (ROOT/'docs/redesign/tools/stubs/supabase.js').read_text()
stub = stub.replace('rpc: (n) => chain("rpc", n)', 'rpc: (n,args) => { (window.__rpcCalls ||= []).push({name:n,args}); return chain("rpc",n); }')
stub = stub.replace('const res = () => {', 'const res = () => { if(kind === "rpc" && name === "get_admin_company_change_log" && window.__missingCompanyAudit) return {data:null,error:{code:"PGRST202",message:"synthetic missing RPC"}};')
stub = stub.replace('functions: { invoke: async () => ({ data: null, error: null }) }', 'functions: { invoke: async () => ({ data: {enabled:false,available:true}, error: null }) }')
(OUT/'stub.js').write_text(stub)
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(ROOT/'src/main.jsx'),'--bundle','--splitting',f'--outdir={OUT}/bundle','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:@supabase/supabase-js={OUT}/stub.js',f'--alias:@sentry/react={ROOT}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=true','--define:import.meta.env.VITE_SUPABASE_URL="https://supabase.invalid"','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY="synthetic"','--define:process.env.NODE_ENV="production"','--log-level=error'],cwd=ROOT,check=True)
# Cold-load entry deliberately imports no /hire page: its CSS must come from AdminForeignHire.
(OUT/'cold.jsx').write_text('import {createRoot} from "'+str(ROOT/'node_modules/react-dom/client.js')+'"; import {AdminForeignHire} from "'+str(ROOT/'src/p24/admin/AdminForeignHire.jsx')+'"; import "'+str(ROOT/'src/p24/p24.css')+'"; createRoot(document.getElementById("root")).render(<div className="p24"><AdminForeignHire requests={[]} h={{expandedId:null}} /></div>);')
subprocess.run([str(ROOT/'node_modules/.bin/esbuild'),str(OUT/'cold.jsx'),'--bundle',f'--outdir={OUT}/cold','--entry-names=app','--format=esm','--jsx=automatic','--loader:.js=jsx',f'--alias:react={ROOT}/node_modules/react',f'--alias:react-dom={ROOT}/node_modules/react-dom',f'--alias:@supabase/supabase-js={OUT}/stub.js',f'--alias:@sentry/react={ROOT}/docs/redesign/tools/stubs/sentry.js','--define:import.meta.env.PROD=false','--define:import.meta.env.VITE_SUPABASE_URL=""','--define:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY=""','--log-level=error'],cwd=ROOT,check=True)
fixtures=(ROOT/'docs/redesign/tools/adata.js').read_text()
extra='''window.__DATA["rpc:get_admin_company_change_log"]=[{audit_id:"synthetic-audit",action:"company_updated",admin_id:"synthetic-admin",created_at:new Date().toISOString(),metadata:{company_id:"synthetic-company",changed_fields:["is_verified","name"]}}];'''
html=(ROOT/'index.html').read_text().replace('<script type="module" src="/src/main.jsx"></script>','<script>window.__ROLE="admin";'+fixtures+extra+'</script><link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1440,900),(390,844)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},service_workers='block',reduced_motion='reduce')
        def handler(route):
            url=route.request.url
            if not url.startswith('http://s24.test/'):return route.abort()
            path=url.split('http://s24.test',1)[1].split('?')[0]
            if path=='/__cold':return route.fulfill(body='<meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><link rel="stylesheet" href="/__cold_bundle/app.css"><script type="module" src="/__cold_bundle/app.js"></script>',content_type='text/html')
            if path.startswith('/__cold_bundle/'):return route.fulfill(path=str(OUT/'cold'/path.split('/')[-1]),content_type='text/css' if path.endswith('.css') else 'application/javascript')
            if path.startswith('/__b/'):return route.fulfill(path=str(OUT/'bundle'/path[5:]),content_type='text/css' if path.endswith('.css') else 'application/javascript')
            if path.startswith('/api/'):return route.fulfill(json={'ok':True,'maintenance':False})
            asset=ROOT/'public'/path.lstrip('/')
            if asset.is_file():return route.fulfill(path=str(asset))
            return route.fulfill(body=html,content_type='text/html')
        ctx.route('**/*',handler);page=ctx.new_page();errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.set_default_timeout(10000)
        page.goto('http://s24.test/__cold',wait_until='networkidle')
        assert page.locator('.fh-how ol').evaluate('(e)=>getComputedStyle(e).listStyleType')=='none'
        assert page.locator('.fh-how li > span').first.evaluate('(e)=>e.getBoundingClientRect().width')==24
        assert page.locator('.fh-how ol').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==(6 if width==1440 else 2)
        page.goto('http://s24.test/',wait_until='networkidle')
        def go(label):
            if width<900:
                page.get_by_role('button',name='Atidaryti meniu',exact=True).click()
                page.locator('.drawer .item').filter(has_text=label).first.click()
            else:page.locator('.side:not(.drawer) .item').filter(has_text=label).first.click()
        def screenshot(name):
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),name
            page.screenshot(path=str(OUT/f'{width}-{name}.png'))
        go('Tarptautinė atranka')
        page.locator('.fh-how ol li').last.wait_for()
        metrics=page.locator('.fh-how ol').evaluate('(e)=>({style:getComputedStyle(e).listStyleType,columns:getComputedStyle(e).gridTemplateColumns.split(" ").length})')
        assert metrics=={'style':'none','columns':6 if width==1440 else 2},metrics
        assert page.locator('.fh-how li > span').all_inner_texts()==['1','2','3','4','5','6']
        screenshot('foreign')
        go('Pokalbiai')
        page.locator('.at .list .atr').first.wait_for()
        if width==1440:
            positions=page.locator('.at').evaluate('e=>{const h=[...e.querySelectorAll(".ath > span")].map(x=>x.getBoundingClientRect().x);return [...e.querySelectorAll(".list .atr")].map(r=>[...r.children].map((x,i)=>Math.abs(x.getBoundingClientRect().x-h[i])))}')
            assert all(delta<1 for row in positions for delta in row),positions
        screenshot('team-chats')
        go('Darbuotojai')
        page.locator('.aw .list .atr').first.get_by_role('button',name='Valdyti',exact=True).click()
        page.get_by_role('button',name='Redaguoti profilį',exact=True).click()
        editor=page.locator('.p24-admin-editor')
        def field_styles():
            styles=editor.locator('.field input:not([type=checkbox]),.field button.input').evaluate_all('es=>es.map(e=>({height:e.getBoundingClientRect().height,border:getComputedStyle(e).borderTopWidth,font:getComputedStyle(e).fontSize}))')
            assert styles and all(x=={'height':38,'border':'1px','font':'13px' if width==1440 else '15px'} for x in styles),styles
            assert editor.locator('textarea').evaluate('(e)=>getComputedStyle(e).borderTopWidth')=='1px'
            assert editor.locator('textarea').evaluate('(e)=>parseFloat(getComputedStyle(e).minHeight)')==84
        field_styles();screenshot('worker-editor')
        editor.get_by_role('button',name='Uždaryti',exact=True).click()
        go('Visi darbai')
        page.get_by_role('button',name='Redaguoti darbą',exact=True).first.click()
        field_styles();screenshot('job-editor')
        editor.get_by_role('button',name='Atlygio vienetas',exact=True).click()
        editor.get_by_role('option',name='Už dieną',exact=True).click()
        assert editor.get_by_role('button',name='Atlygio vienetas',exact=True).locator('span').first.inner_text()=='Už dieną'
        editor.get_by_role('button',name='Darbo data',exact=True).click()
        assert editor.get_by_role('dialog',name='Darbo data',exact=True).is_visible()
        page.keyboard.press('Escape')
        editor.get_by_role('button',name='Darbo pradžios laikas',exact=True).click()
        assert editor.locator('[role=dialog]').count()>0
        page.keyboard.press('Escape')
        editor.get_by_role('button',name='Uždaryti',exact=True).click()
        go('Darbdaviai')
        page.locator('.ae .list').get_by_role('button',name='Patvirtinti',exact=True).click()
        page.get_by_text('Patvirtinti įmonę?',exact=True).wait_for()
        assert page.get_by_text('Sistema netikrina registracijos Registrų centre',exact=False).count()>0
        page.get_by_role('button',name='Atšaukti',exact=True).click()
        assert not page.evaluate('window.__rpcCalls.some(x=>x.name==="admin_update_company")')
        go('Veiksmų istorija')
        assert page.get_by_text('Įmonės duomenys pakeisti',exact=True).is_visible()
        assert page.get_by_text('Pakeisti laukai: is_verified, name',exact=False).count()==1
        screenshot('audit')
        assert not errors,errors
        print(width,'PASS: recruitment, table alignment, editor styles/date/time, verification cancellation, audit rendering',flush=True)
        page.add_init_script('window.__missingCompanyAudit=true')
        page.reload(wait_until='networkidle')
        page.get_by_role('heading',name='Suvestinė',exact=True).wait_for()
        assert page.get_by_text('synthetic missing RPC',exact=False).count()==0
        ctx.close()
    # Registration stays synthetic: no Supabase or SMS request can leave this browser.
    public=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    def public_handler(route):
        if route.request.url=='http://s24.test/__public':return route.fulfill(body=html.replace('window.__ROLE="admin"','window.__ROLE=null'),content_type='text/html')
        return handler(route)
    public.route('**/*',public_handler);page=public.new_page();page.set_default_timeout(10000)
    page.goto('http://s24.test/__public',wait_until='domcontentloaded')
    page.locator('.lp-cta [data-v=signup-emp]').click()
    modal=page.get_by_role('dialog');code=modal.locator('#r-code')
    assert code.get_attribute('required') is not None
    for value in ['', 'abcdefghi', '12345678']:
        code.fill(value);assert not code.evaluate('(e)=>e.checkValidity()')
    code.fill('123456786');assert code.evaluate('(e)=>e.checkValidity()')
    modal.get_by_text('Privatus asmuo',exact=True).click();assert modal.locator('#r-code').count()==0
    modal.get_by_text('Įmonė',exact=True).click()
    for key,value in {'r-co':'Sintetinė įmonė','r-code':'123456787','r-fn':'Testas','r-ln':'Pavyzdys','r-ph':'+37061234567','r-mail':'synthetic@example.test','r-pass':'Synthetic-only-password123!'}.items():modal.locator('#'+key).fill(value)
    modal.locator('.check input[type=checkbox]').check()
    modal.get_by_role('button',name='Sukurti paskyrą',exact=True).click()
    assert modal.get_by_text('Neteisingas įmonės kodo kontrolinis skaitmuo.',exact=True).is_visible()
    print('390 PASS: required company code, format constraints, checksum error, private employers remain supported',flush=True)
    public.close()
    browser.close()
