"""Plans UI with synthetic billing data only; no Stripe or Supabase requests."""
from pathlib import Path
import json
import subprocess
from playwright.sync_api import sync_playwright

repo = Path(__file__).resolve().parents[1]
entry = '''
import React from 'react';
import {createRoot} from 'react-dom/client';
import {EmployerPlans} from './src/p24/employer/EmployerPlans.jsx';
const root=createRoot(document.getElementById('root'));
window.actions=[];
window.showPlans=(props)=>root.render(<EmployerPlans cycle="monthly" setCycle={()=>{}}
 isOwner={true} busy={false} onPortal={()=>window.actions.push('portal')}
 onRequest={()=>window.actions.push('request')} {...props}/>);
window.showPlans({planKey:'business_pro',billing:{effective_plan_key:'business_pro',subscription_status:'active',current_period_end:'2099-12-03T12:00:00Z',has_stripe_subscription:true}});
'''
build = '''
import {build} from 'esbuild';
const result=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},
 bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline-config',setup(b){
 b.onResolve({filter:/lib\\/config\\.js$|^\\.\\/config\\.js$/},()=>({path:'offline-config',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const supabase=null;',loader:'js'}));
 }}]});
process.stdout.write(result.outputFiles[0].text);
'''.replace('ENTRY', json.dumps(entry))
bundle = subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.set_default_timeout(8000)
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.route('**/*',lambda route:route.fulfill(status=200,content_type='text/html',body='<html></html>') if route.request.resource_type=='document' else route.abort())
        page.goto('http://localhost')
        page.set_content('<main class="p24" style="padding:16px"><div id="root"></div></main>')
        page.add_style_tag(path=str(repo/'src/p24/p24.css'))
        page.add_script_tag(content=bundle)
        section=page.get_by_role('region',name='Dabartinio plano informacija')
        section.wait_for()
        assert 'Business Pro' in section.inner_text()
        assert '2099' in section.inner_text()
        assert 'pratęsiama automatiškai' in section.inner_text()
        assert page.evaluate('window.actions')==[]
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=f'/tmp/s24-plan-validity-{width}.png')
        page.get_by_role('button',name='Valdyti prenumeratą',exact=True).click()
        assert page.evaluate('window.actions')==['portal']
        page.evaluate("window.showPlans({planKey:'business_pro',billing:{effective_plan_key:'basic'}})")
        page.get_by_text('Neterminuotas',exact=True).wait_for()
        assert '2099' not in section.inner_text()
        page.evaluate("window.showPlans({planKey:'business',summary:{subscription_status:'trialing',current_period_end:'2099-12-03T12:00:00Z'}})")
        page.wait_for_function("document.querySelector('[aria-label=\"Dabartinio plano informacija\"]').textContent.includes('Išbandymas iki')")
        assert '2099' in section.inner_text()
        assert not errors,errors
        print(f'{width}px PASS: plan validity visible, Basic/trial fallback, no overflow, existing billing button unchanged; synthetic data only')
        page.close()
    browser.close()
