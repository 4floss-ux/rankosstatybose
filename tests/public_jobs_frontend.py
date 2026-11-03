"""Offline component checks: synthetic ads, no real authentication or database."""
from pathlib import Path
import json, subprocess
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
entry='''import React from 'react';import {createRoot} from 'react-dom/client';
import {PublicJobAdsPage} from './src/public/PublicJobAdsPage.jsx';
import {AdPage} from './src/p24/worker/WorkerAds.jsx';
const root=createRoot(document.getElementById('root'));let seq=0;
window.ads=[{id:'20000000-0000-4000-8000-000000000100',company_id:'20000000-0000-4000-8000-000000000010',company_name:'UAB Pavyzdys',title:'Statybininkas',city:'Vilnius',salary_min:1500,description:'Sintetinis darbo aprašymas',requirements:[],offers:[],live:true,published_at:'2026-11-03T10:00:00Z',expires_at:'2099-01-01T00:00:00Z'},
{id:'20000000-0000-4000-8000-000000000106',company_name:'UAB Pavyzdys',title:'Stalius',city:'Kaunas',salary_min:1600,description:'Sintetinis darbo aprašymas',requirements:[],offers:[],live:true,published_at:'2026-11-03T10:00:00Z',expires_at:'2099-01-01T00:00:00Z'}];
window.calls=[];window.loginCount=0;
window.mount=(route,user=null)=>root.render(<PublicJobAdsPage key={++seq} route={route} user={user} onLogin={()=>window.loginCount++}/>);
window.privateAd=(status)=>root.render(<div className="p24"><AdPage key={++seq} ad={{...window.ads[0],application:{id:'application',status}}} onChanged={()=>{}}/></div>);
window.mount({list:true});'''
mock='''export const supabase={rpc:async(name,args)=>{
window.calls.push(name);
if(window.fail)return {error:{message:'Synthetic error'}};
if(name==='job_ads_public_cities')return {data:['Kaunas','Vilnius']};
if(name==='job_ads_public_list')return {data:{ads:window.ads.filter(a=>!args.p_city||a.city===args.p_city),has_more:false}};
if(name==='job_ad_public_detail')return {data:window.ads.find(a=>a.id===args.p_ad_id)||null};
return {data:null};}};'''
build='''import {build} from 'esbuild';const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline',setup(b){b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  def route_request(route):
   url=urlsplit(route.request.url)
   if url.hostname!='localhost':return route.abort()
   if route.request.resource_type=='document':return route.fulfill(status=200,content_type='text/html',body='<div id="root"></div>')
   if url.path=='/brand-logo-tight.png':return route.fulfill(path=str(repo/'public/brand-logo-tight.png'))
   return route.abort()
  page.route('**/*',route_request)
  page.goto('http://localhost/darbo-skelbimai')
  for css in ['src/p24/p24.css','src/public/publicJobAds.css']:page.add_style_tag(path=str(repo/css))
  page.add_script_tag(content=bundle)
  page.locator('.job').nth(1).wait_for();assert page.locator('.job').count()==2
  page.locator('.adcity select').select_option('Vilnius');page.wait_for_function("document.querySelectorAll('.job').length===1")
  href=page.locator('.job').get_attribute('href');assert href.endswith(window_id:='20000000-0000-4000-8000-000000000100')
  page.evaluate("window.mount({adId:window.ads[0].id})")
  page.get_by_role('button',name='Kandidatuoti',exact=True).click();assert page.evaluate('window.loginCount')==1
  assert not page.evaluate("window.calls.includes('job_ad_mark_viewed')||window.calls.includes('job_ads_worker_list')||window.calls.includes('job_ad_apply')")
  page.evaluate("Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async url=>window.copied=url},configurable:true})")
  page.get_by_role('button',name='Dalintis',exact=True).click();page.get_by_text('Nuoroda nukopijuota.',exact=True).wait_for()
  assert page.evaluate('window.copied')=='http://localhost'+href
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.screenshot(path=f'/tmp/s24-public-job-detail-{width}.png')
  page.evaluate("window.mount({adId:window.ads[0].id},{id:'employer'})")
  page.get_by_role('button',name='Kandidatuoti',exact=True).click();page.get_by_role('alert').wait_for()
  for status in ['sent','viewed','interview','rejected','withdrawn']:
   page.evaluate('(status)=>window.privateAd(status)',status)
   page.wait_for_timeout(60)
   assert page.get_by_role('button',name='Atšaukti kandidatūrą',exact=True).count()==0
   assert page.get_by_role('button',name='Kandidatuoti',exact=True).count()==0
  page.evaluate("window.mount({adId:'20000000-0000-4000-8000-999999999999'})")
  page.get_by_text('Skelbimas nepasiekiamas',exact=True).wait_for()
  page.evaluate('window.fail=true;window.mount({list:true})');page.get_by_role('alert').wait_for()
  page.evaluate('window.fail=false');page.get_by_role('button',name='Bandyti dar kartą').click();page.locator('.job').first.wait_for()
  assert not errors,errors
  print(f'PASS {width}px: public list/filter/detail/share/login gate, role rejection, no withdrawal/reapply, missing ad and retry (synthetic only)')
  page.close()
 browser.close()
