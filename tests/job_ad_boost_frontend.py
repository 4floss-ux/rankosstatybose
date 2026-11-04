"""Synthetic paid-boost UI; checkout requests mocked, all external traffic blocked."""
from pathlib import Path
import json,subprocess
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
entry='''import React from 'react';import {createRoot} from 'react-dom/client';import {AdBoostControl} from './src/p24/employer/AdBoost.jsx';import {WorkerAds} from './src/p24/worker/WorkerAds.jsx';
const root=createRoot(document.getElementById('root'));let seq=0;window.calls=[];window.changed=0;
const base={company_id:'company',company_name:'Sintetinė įmonė',city:'Vilnius',salary_min:1500,description:'Sintetinis aprašymas',live:true,published_at:'2026-01-01',expires_at:'2099-01-01'};
window.ads=[{...base,id:'normal',title:'Mėgstamos įmonės įprastas'}, {...base,id:'older',company_id:'other-company',title:'Iškeltas seniau',boosted_at:'2026-01-01',boosted_until:'2099-01-01'}, {...base,id:'newer',company_id:'other-company',title:'Iškeltas naujiau',boosted_at:'2026-02-01',boosted_until:'2099-01-01'}];
window.mount=(mode,quote)=>{window.quote=quote;root.render(<main className="p24" style={{padding:16}} key={++seq}>{mode==='list'?<WorkerAds data={{ads:window.ads,loaded:true,error:null,reload:()=>{},setAds:()=>{}}} me={{}} isFavorite={id=>id==='company'} onCompany={()=>{}}/>:<AdBoostControl ad={window.ads[0]} onChanged={()=>window.changed++}/>}</main>)};window.mount('offer',{enabled:false});'''
mock='''export const supabase={rpc:async()=>({data:window.quote}),functions:{invoke:async(name,args)=>{window.calls.push({name,args});return window.success?{data:{paid:true,delivered:true}}:{error:{message:'Synthetic checkout failure'}};}}};'''
build='''import {build} from 'esbuild';const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline',setup(b){b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':950});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<div id="root"></div>') if r.request.resource_type=='document' else r.abort())
  page.goto('http://localhost')
  for css in ['src/p24/p24.css','src/ui/SiteSelect.css']:page.add_style_tag(path=str(repo/css))
  page.add_script_tag(content=bundle)
  assert page.get_by_role('button',name='Iškelti skelbimą',exact=False).count()==0
  page.evaluate("window.mount('offer',{enabled:true,eligible:true,amount_cents:499,currency:'eur',duration_days:7})")
  page.get_by_role('button',name='Iškelti skelbimą',exact=False).click();dialog=page.get_by_role('dialog');dialog.wait_for()
  assert '4,99 €' in dialog.inner_text();assert 'Automatiškai nepratęsiama' in dialog.inner_text();assert page.evaluate('window.calls.length')==0
  dialog.get_by_role('button',name='Apmokėti 4,99 € ir iškelti',exact=True).click();dialog.get_by_role('alert').wait_for()
  assert page.evaluate("window.calls[0].args.body.action==='boost_create'&&!('amount_cents' in window.calls[0].args.body)")
  page.evaluate('window.success=true');dialog.get_by_role('button',name='Apmokėti 4,99 € ir iškelti',exact=True).click();page.wait_for_function('window.changed===1')
  page.evaluate("window.mount('offer',{enabled:true,eligible:false,amount_cents:499,currency:'eur',duration_days:7})")
  page.get_by_role('button',name='Iškelti skelbimą',exact=False).click();assert page.get_by_role('button',name='Apmokėti 4,99 € ir iškelti',exact=True).is_disabled()
  page.evaluate("window.mount('offer',{enabled:true,eligible:true,amount_cents:499,currency:'eur',duration_days:7,boosted_until:'2099-01-01'})")
  page.get_by_text('Iškeltas iki',exact=False).wait_for();assert page.get_by_role('button',name='Iškelti skelbimą',exact=False).count()==0
  page.evaluate("window.mount('offer',{enabled:true,eligible:true,amount_cents:499,currency:'eur',duration_days:7,boosted_until:'2020-01-01'})")
  page.get_by_role('button',name='Iškelti skelbimą',exact=False).wait_for()
  page.evaluate("window.mount('list',{})");page.locator('article.job').nth(2).wait_for()
  titles=page.locator('article.job h3').all_text_contents();assert titles==['IŠKELTAS NAUJIAU','IŠKELTAS SENIAU','MĖGSTAMOS ĮMONĖS ĮPRASTAS'],titles
  assert page.get_by_text('Iškeltas',exact=True).count()==2
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');assert not errors,errors
  page.screenshot(path=f'/tmp/s24-boost-list-{width}.png',full_page=True)
  print(f'PASS {width}px: 4.99/7-day offer, OFF gate, explicit checkout, eligibility/error/retry, unlimited repurchase after expiry, paid priority/badge; no real payments')
  page.close()
 browser.close()
