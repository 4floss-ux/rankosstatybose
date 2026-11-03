"""Synthetic quota UI only. All Supabase/checkout calls replaced; no real payments."""
from pathlib import Path
import json
import subprocess
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
entry='''
import React from 'react';import {createRoot} from 'react-dom/client';
import {EmployerAds} from './src/p24/employer/EmployerAds.jsx';
const root=createRoot(document.getElementById('root'));let seq=0;
window.mount=(remaining,options={})=>{
 window.remaining=remaining;window.options=options;window.calls=[];window.payments=0;
 window.ad={id:'synthetic-ad',title:'Sintetinis skelbimas',city:'Vilnius',salary_min:1000,description:'Sintetinis darbo aprašymas',status:'active',live:true,expires_at:'2099-01-01T00:00:00Z',candidates:[],savers:[]};
 const data={ads:options.detail?[window.ad]:[],loaded:true,reload:()=>{},error:null};
 root.render(<EmployerAds key={++seq} data={data} company={{id:'synthetic-company',city:'Vilnius'}} isPro={!options.basic} startNew={!options.detail} onStartNewHandled={()=>{}}/>);
};window.mount(1);
'''
mock='''export const supabase={rpc:async(name,args)=>{
 window.calls.push({name,args});
 if(name==='job_ad_offer'||name==='job_ad_pro_quota')return {data:window.options.malformed?[]:{enabled:!window.options.basic,first_free_available:!!window.options.firstFree,limit:10,used:10-window.remaining,remaining:window.remaining,resets_at:'2099-12-15T12:00:00Z'}};
 if(name==='job_ad_upsert'){
  window.ad={...window.ad,...{status:window.options.race?'pending_payment':'active'}};window.remaining=0;return {data:window.ad};
 }
 if(name==='job_ad_company_detail')return {data:window.ad};
 if(name==='job_ad_extend_plan_with_quota'){
  if(window.options.exhaust){window.options.exhaust=false;window.remaining=0;return {error:{message:'Kvota išnaudota',details:'JOB_AD_FREE_QUOTA_EXHAUSTED'}};}
  if(window.options.failOnce){window.options.failOnce=false;return {error:{message:'Synthetic network failure'}};}
  window.remaining=0;return {data:window.ad};
 }return {data:null};
},functions:{invoke:async()=>{window.payments++;return {error:new Error('Synthetic checkout only')};}}};'''
build='''import {build} from 'esbuild';
const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline',setup(b){
b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<html></html>') if r.request.resource_type=='document' else r.abort())
  page.goto('http://localhost');page.set_content('<main class="p24" style="padding:16px"><div id="root"></div></main>')
  page.add_style_tag(path=str(repo/'src/p24/p24.css'));page.add_script_tag(content=bundle)
  page.get_by_role('button',name='Paskelbti skelbimą',exact=True).wait_for()
  assert '1 iš 10' in page.locator('.notebox').inner_text()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.evaluate('window.mount(0)')
  page.get_by_role('button',name='Apmokėti 9,99 € ir paskelbti',exact=True).wait_for()
  page.evaluate('window.mount(1,{malformed:true})')
  page.get_by_role('alert').wait_for()
  assert page.get_by_role('button',name='Paskelbti skelbimą',exact=True).is_disabled()
  assert page.evaluate('window.payments')==0
  assert page.evaluate('window.payments')==0
  page.evaluate('window.mount(1,{race:true})')
  page.get_by_role('button',name='Paskelbti skelbimą',exact=True).wait_for()
  page.get_by_placeholder('Pvz. Statybų darbininkas').fill('Sintetinės pareigos')
  page.get_by_placeholder('1600',exact=True).fill('1600')
  page.locator('textarea').first.fill('Sintetinis aprašymas tik vietiniam bandymui')
  page.get_by_role('button',name='Paskelbti skelbimą',exact=True).click()
  page.get_by_text('Skelbimas dar nepaskelbtas',exact=True).wait_for()
  assert page.evaluate('window.payments')==0
  assert len(page.evaluate("window.calls.filter(c=>c.name==='job_ad_pro_quota')"))<10
  for failure in ['exhaust','failOnce']:
   page.evaluate('window.mount(1,'+json.dumps({'detail':True,failure:True})+')')
   page.locator('article.job').click()
   page.get_by_role('button',name='Pratęsti',exact=True).click()
   dialog=page.get_by_role('dialog');dialog.wait_for()
   dialog.get_by_role('button',name='Pratęsti',exact=True).click()
   dialog.get_by_role('alert').wait_for()
   if failure=='exhaust':
    dialog.get_by_role('button',name='Pratęsti už 9,99 €',exact=True).wait_for()
    assert page.evaluate('window.payments')==0
   else:
    dialog.get_by_role('button',name='Pratęsti',exact=True).click()
    page.wait_for_function("!document.querySelector('[role=dialog]')")
    ids=page.evaluate("window.calls.filter(c=>c.name==='job_ad_extend_plan_with_quota').map(c=>c.args.p_request_id)")
    assert len(ids)==2 and ids[0]==ids[1]
  page.evaluate('window.mount(0,{basic:true,firstFree:true})')
  page.get_by_role('button',name='Paskelbti skelbimą',exact=True).wait_for()
  page.get_by_text('Pirmas jūsų skelbimas – nemokamas',exact=True).wait_for()
  assert page.evaluate('window.payments')==0
  page.evaluate('window.mount(0,{basic:true,firstFree:false})')
  page.get_by_role('button',name='Apmokėti 9,99 € ir paskelbti',exact=True).wait_for()
  assert not errors,errors
  print(f'{width}px PASS: shared quota pricing, unpaid fallback without checkout, exhausted extension price, retry ID, no remount loop; synthetic only')
  page.close()
 browser.close()
