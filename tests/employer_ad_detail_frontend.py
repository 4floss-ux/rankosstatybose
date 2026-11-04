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
 window.remaining=remaining;window.options=options;window.calls=[];window.payments=0;window.deletes=0;
 window.ad={id:'10000000-0000-4000-8000-000000000100',title:'Sintetinis skelbimas',address:'Bandymų g. 1',contract_type:'Neterminuota darbo sutartis',schedule:'08:00–17:00',start_text:'Nuo pirmadienio',requirements:['Punktualumas'],offers:['Darbo įrankiai'],city:'Vilnius',salary_min:1000,description:'Pilnas darbo aprašymas\\nAntra aprašymo eilutė',status:'active',live:true,expires_at:'2099-01-01T00:00:00Z',candidates:[],savers:[]};
 const data=window.adData={ads:options.detail?[window.ad]:[],loaded:true,reload:()=>{},error:null};
 root.render(<EmployerAds key={++seq} data={data} company={{id:'synthetic-company',city:'Vilnius'}} isPro={!options.basic} startNew={!options.detail} onStartNewHandled={()=>{}}/>);
};window.mount(1,{detail:true,basic:true});
'''
mock='''export const supabase={rpc:async(name,args)=>{name=({job_ads_worker_boosted_list:'job_ads_worker_list',job_ads_company_boosted_list:'job_ads_company_list',job_ads_public_boosted_list:'job_ads_public_list',job_ad_public_boosted_detail:'job_ad_public_detail'})[name]||name;
 window.calls.push({name,args});
 if(name==='job_ad_deletion_available')return {data:!window.options.deleteOff};
 if(name==='job_ad_offer'||name==='job_ad_pro_quota')return {data:window.options.malformed?[]:{enabled:!window.options.basic,first_free_available:!!window.options.firstFree,limit:10,used:10-window.remaining,remaining:window.remaining,resets_at:'2099-12-15T12:00:00Z'}};
 if(name==='job_ad_upsert'){
  window.ad={...window.ad,...{status:window.options.race?'pending_payment':'active',live:!window.options.race}};window.remaining=0;return {data:window.ad};
 }
 if(name==='job_ad_company_detail')return {data:window.ad};
 if(name==='job_ad_extend_plan_with_quota'){
  if(window.options.exhaust){window.options.exhaust=false;window.remaining=0;return {error:{message:'Kvota išnaudota',details:'JOB_AD_FREE_QUOTA_EXHAUSTED'}};}
  if(window.options.failOnce){window.options.failOnce=false;return {error:{message:'Synthetic network failure'}};}
  window.remaining=0;return {data:window.ad};
 }if(name==='job_ad_delete')return {error:{code:'PGRST202',message:'Not installed'}};return {data:null};
},functions:{invoke:async(name)=>{if(name==='job-ad-delete'){window.deletes++;if(window.options.deleteSuccess){window.adData.ads=[];return {data:{deleted:true,cleanup_pending:!!window.options.pendingFiles}};}return {error:{context:new Response(JSON.stringify({error:'Simuliuota trynimo klaida.'}),{status:409,headers:{'Content-Type':'application/json'}})}};}window.payments++;return {error:new Error('Synthetic checkout only')};}}};'''
build='''import {build} from 'esbuild';
const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline',setup(b){
b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':1000});page.set_default_timeout(8000);errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<html></html>') if r.request.resource_type=='document' else r.abort())
  page.goto('http://localhost');page.set_content('<main class="p24" style="padding:16px;display:flex;flex-direction:column;gap:18px"><div id="root" style="display:contents"></div></main>')
  page.add_style_tag(path=str(repo/'src/p24/p24.css'));page.add_style_tag(path=str(repo/'src/p24/employer/EmployerAds.css'));page.add_style_tag(path=str(repo/'src/ui/SiteSelect.css'));page.add_script_tag(content=bundle)
  page.locator('article.job').click()
  page.get_by_role('heading',name='Apie darbą',exact=True).wait_for()
  for value in ['Pilnas darbo aprašymas','Antra aprašymo eilutė','Bandymų g. 1','08:00–17:00','Nuo pirmadienio','Punktualumas','Darbo įrankiai']:
   assert value in page.locator('.ead-detail').inner_text(),value
  controls=page.get_by_role('region',name='Skelbimo valdymas')
  assert controls.get_by_role('button',name='Redaguoti skelbimą',exact=True).count()==1
  assert controls.get_by_role('button',name='Pratęsti skelbimą',exact=True).count()==1
  candidates=page.locator('section.card').filter(has=page.get_by_role('heading',name='Kandidatai',exact=False)).first
  assert candidates.get_by_role('button',name='Redaguoti skelbimą').count()==0
  assert page.get_by_role('button',name='Uždaryti',exact=True).count()==0
  assert controls.get_by_role('button',name='Dalintis',exact=True).count()==1
  assert page.locator('.jd-hero').get_by_role('button',name='Dalintis',exact=True).count()==0
  assert page.locator('.ead-detail > .jd-side').evaluate("e=>getComputedStyle(e).position")=='static'
  main=page.locator('.ead-detail > .jd-main')
  assert main.locator('section.card').filter(has=page.get_by_role('heading',name='Kandidatai',exact=False)).count()==1
  content=page.get_by_role('heading',name='Siūlome',exact=True).locator('..').bounding_box()
  for name in ['Kandidatai','Pakviesti pokalbiui','Įsiminė skelbimą']:
   card=main.locator('section.card').filter(has=page.get_by_role('heading',name=name,exact=False)).first.bounding_box()
   assert abs(card['width']-main.bounding_box()['width'])<2,(name,width,card)
   assert card['y']>content['y']+content['height']-1

  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.screenshot(path=f'/tmp/s24-employer-ad-details-{width}.png',full_page=True)
  controls.get_by_role('button',name='Ištrinti skelbimą',exact=True).click()
  dialog=page.get_by_role('dialog');dialog.wait_for()
  assert 'nemokamo skelbimo dovana neatsinaujins' in dialog.inner_text()
  dialog.get_by_role('button',name='Palikti skelbimą',exact=True).click()
  assert not page.evaluate("window.calls.some(c=>c.name==='job_ad_delete')")
  controls.get_by_role('button',name='Ištrinti skelbimą',exact=True).click()
  page.get_by_role('dialog').get_by_role('button',name='Ištrinti skelbimą',exact=True).click()
  page.get_by_text('Simuliuota trynimo klaida.',exact=True).wait_for()
  assert page.evaluate('window.deletes')==1
  page.evaluate('window.mount(1,{detail:true,deleteOff:true})');page.locator('article.job').click()
  assert page.get_by_role('button',name='Ištrinti skelbimą',exact=True).is_disabled()
  page.evaluate('window.mount(1,{detail:true,deleteSuccess:true,pendingFiles:true})');page.locator('article.job').click()
  page.get_by_role('button',name='Ištrinti skelbimą',exact=True).click()
  page.get_by_role('dialog').get_by_role('button',name='Ištrinti skelbimą',exact=True).click()
  page.get_by_text('Skelbimas ir kandidatūros ištrinti. Priedų trynimas dar baigiamas.',exact=True).wait_for()
  assert page.locator('article.job').count()==0
  assert page.evaluate('window.deletes')==1
  assert not page.evaluate("window.calls.some(c=>c.name==='job_ad_close')")
  assert page.evaluate('window.payments')==0
  assert not errors,errors
  print(f'PASS {width}px: full ad fields; separate controls; empty cards; cancellation and unavailable-delete safety; synthetic only')
  page.close()
 browser.close()
