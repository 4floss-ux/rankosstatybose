from pathlib import Path
import json,subprocess
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
Path('/tmp/s24-minimal-extension-evidence').mkdir(parents=True,exist_ok=True)
entry='''import React from 'react';import{createRoot}from'react-dom/client';import{EmployerAds}from'./src/p24/employer/EmployerAds.jsx';const root=createRoot(document.getElementById('root'));let seq=0;window.mount=(pro=false)=>{window.pro=pro;window.calls=[];window.ad={id:'10000000-0000-4000-8000-000000000100',title:'Testinis skelbimas',city:'Vilnius',salary_min:1100,description:'Aprašymas',status:'active',live:true,expires_at:'2099-01-01',candidates:[],savers:[]};root.render(<EmployerAds key={++seq} data={{ads:[window.ad],loaded:true,error:null,reload:()=>{}}} company={{id:'company'}} isPro={pro}/>)};window.mount();'''
mock='''export const supabase={rpc:async(name,args)=>{window.calls.push({name,args});return {data:name==='job_ad_company_detail'?window.ad:null}},functions:{invoke:async()=>({error:new Error('Synthetic checkout only')})}};'''
js='''import{build}from'esbuild';const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'mock',setup(b){b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}))}}]});process.stdout.write(r.outputFiles[0].text)'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',js],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/*',lambda r:r.fulfill(content_type='text/html',body='<main class="p24"><div id="root"></div></main>') if r.request.resource_type=='document' else r.abort());page.goto('http://localhost')
  for css in ['src/p24/p24.css','src/p24/employer/EmployerAds.css']:page.add_style_tag(path=str(repo/css))
  page.add_script_tag(content=bundle)
  for pro in [False,True]:
   page.evaluate('(pro)=>window.mount(pro)',pro);page.locator('article.job').click();page.get_by_role('button',name='Pratęsti skelbimą',exact=True).click();modal=page.locator('.modal');modal.wait_for();text=modal.inner_text();assert 'TESTINIS SKELBIMAS' in text;assert '30 dienų.' in text
   for absent in ['Business Pro','Po pratęsimo','Kandidatai','Pratęsimo kaina']:assert absent not in text,absent
   action=page.get_by_role('button',name='Pratęsti' if pro else 'Pratęsti už 9,99 €',exact=True);assert action.count()==1;assert page.get_by_role('button',name='Atšaukti',exact=True).count()==1
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');modal.screenshot(path=f'/tmp/s24-minimal-extension-evidence/modal-{width}-{pro}.png')
   if pro:
    action.click();page.wait_for_function("window.calls.some(c=>c.name==='job_ad_extend_plan')")
   else:
    page.get_by_role('button',name='Atšaukti',exact=True).click();assert modal.count()==0;assert not page.evaluate("window.calls.some(c=>c.name==='job_ad_extend_plan')")
  assert not errors,errors;page.close();print(f'PASS {width}px: minimal paid/free modal, clear price, cancel without mutation, existing free extension RPC; synthetic only')
 b.close()
