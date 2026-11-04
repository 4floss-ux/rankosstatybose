"""Offline browser coverage, synthetic worker/employer accounts; all network blocked."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
entry='''import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {WorkerAds,useWorkerAds} from './src/p24/worker/WorkerAds.jsx';
import {EmployerAds,useEmployerAds} from './src/p24/employer/EmployerAds.jsx';
import {Messenger} from './src/p24/Messenger.jsx';
import {AdChat} from './src/p24/AdChat.jsx';
import {adNewsConversations} from './src/p24/adNews.jsx';
import {unifiedCloseStyles} from './src/ui/common.jsx';
const root=createRoot(document.getElementById('root'));let seq=0;
window.ad={id:'40000000-0000-4000-8000-000000000100',company_id:'company',company_name:'UAB Bandymų įmonė',title:'Sintetinis darbas',city:'Vilnius',salary_min:1500,description:'Tik bandymams skirtas aprašymas.',live:true,expires_at:'2099-01-01',requirements:['Patirtis'],offers:['Įrankiai']};
window.candidate={id:'application',worker_id:'worker',name:'Testinis Kandidatas',phone:'+370 600 00000',created_at:'2026-11-01',status:'interview',cv_requested_at:'2026-11-02',cv_sent_at:'2026-11-03',cv_name:'Mano labai ilgas gyvenimo aprašymas CV testavimui.pdf',cv_path:'application/cv.pdf',interview_at:'2099-11-05T10:00:00Z',interview_how:'phone',interview_note:'Paskambinsime nurodytu laiku.',interview_confirmed_at:'2026-11-03'};
window.calls=[];window.records={worker:[],employer:[]};window.mode='worker';
function Inbox({data,side}){const [open,setOpen]=useState(false);const [chat,setChat]=useState(null);const conversations=adNewsConversations({ads:data.ads,news:data.news,side,onOpen:setChat});return <><button aria-label="Atidaryti Messenger" onClick={()=>setOpen(true)}>Žinutės <span data-testid="messenger-count">{conversations.filter(c=>c.unread).length}</span></button>{open&&<Messenger conversations={conversations} hidden={{}} onHide={()=>{}} onClose={()=>setOpen(false)}/ >}{chat&&<AdChat {...chat} onRead={data.news.reload} onClose={()=>setChat(null)}/>}</>}
function Worker(){const data=useWorkerAds(true,'worker');return <><output data-testid="nav-count">{data.news.total}</output><Inbox data={data} side="worker"/><WorkerAds data={data} me={{}} isFavorite={()=>false} toggleFavorite={()=>{}} onCompany={()=>{}} /></>}
function Employer(){const data=useEmployerAds('company',true,'employer');return <><output data-testid="nav-count">{data.newCount}</output><Inbox data={data} side="company"/><EmployerAds data={data} company={{id:'company',city:'Vilnius'}} isPro={false} onWorkerProfile={()=>{}} /></>}
window.mount=(mode)=>{window.mode=mode;root.render(<main className="p24" style={{padding:16,display:'flex',flexDirection:'column',gap:18}} key={++seq}><style>{unifiedCloseStyles}</style>{mode==='worker'?<Worker/>:<Employer/>}</main>)};
window.mount('worker');'''
mock='''export const supabase={rpc:async(name,args)=>{
window.calls.push({name,args});const mode=window.mode;
if(name==='job_ad_news')return {data:JSON.parse(JSON.stringify(window.records[mode]))};
if(name==='job_ad_news_read'){if(window.ackError)return {error:{message:'Synthetic failure'}};window.records[mode]=window.records[mode].map(r=>({...r,events:r.events.filter(e=>!args.p_events.some(x=>x.kind===e.kind&&x.version===e.version))})).filter(r=>r.events.length||r.chat_unread||r.chat_latest_at);return {data:null};}
if(name==='job_ad_chat_messages'){window.records[mode]=window.records[mode].map(r=>({...r,chat_unread:0})).filter(r=>r.events.length||r.chat_latest_at);return {data:[{id:'msg',body:'Sintetinė žinutė',is_mine:false,created_at:'2026-11-03T10:00:00Z'}]};}
if(name==='job_ad_interview_state')return {data:[{application_id:'application',needs_reconfirmation:!!window.candidate.interview_changed}]};
if(name==='job_ads_worker_list')return {data:[{...window.ad,application:{...window.candidate}}]};
if(name==='job_ads_company_list')return {data:[{...window.ad,candidates:1}]};
if(name==='job_ad_company_detail')return {data:{...window.ad,candidates:[{...window.candidate}],savers:[]}};
if(name==='job_ad_attach_cv'){Object.assign(window.candidate,{cv_path:args.p_path,cv_name:args.p_name,cv_sent_at:'2026-11-04'});return {data:null};}
if(name==='job_ad_confirm_interview'){window.candidate.interview_confirmed_at='2026-11-04';return {data:null};}
if(name==='job_ad_offer')return {data:{enabled:false,first_free_available:false}};
if(name==='job_ad_deletion_available')return {data:false};
if(name==='job_ad_candidate_update'){Object.assign(window.candidate,{interview_at:args.p_interview_at,interview_how:args.p_interview_how,interview_confirmed_at:null});return {data:null};}
return {data:null};},storage:{from:()=>({upload:async()=>({data:{}}),remove:async()=>({data:{}}),createSignedUrl:async()=>({data:{signedUrl:'http://localhost/synthetic.pdf'}})})}};'''
build='''import {build} from 'esbuild';const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'offline',setup(b){b.onResolve({filter:/config\\.js$/},()=>({path:'mock',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));}}]});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry)).replace('MOCK',json.dumps(mock))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':950});page.set_default_timeout(8000);errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.route('**/*',lambda route:route.fulfill(status=200,content_type='text/html',body='<div id="root"></div>') if route.request.resource_type=='document' else route.abort())
  page.goto('http://localhost');page.clock.install()
  for css in ['src/p24/p24.css','src/p24/employer/EmployerAds.css','src/ui/SiteSelect.css']:page.add_style_tag(path=str(repo/css))
  page.add_script_tag(content=bundle);page.locator('article.job').wait_for()
  # Global counter refreshes while the advert remains unopened.
  page.evaluate("window.records.worker=[{application_id:'application',ad_id:window.ad.id,chat_unread:1,events:[{kind:'interview_changed',version:'v1',label:'Pakeistas pokalbio laikas',interview_at:window.candidate.interview_at}]}]")
  page.clock.fast_forward(15001);page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='2'")
  assert page.locator('article.job .ad-news-badge').inner_text()=='2'
  page.locator('article.job').click();page.locator('.cvbox.ok').wait_for()
  assert page.locator('.ad-news.changed').count()==1
  assert page.get_by_text('Įmonė matys jūsų profilį, patikimumą ir įvertinimus',exact=True).count()==0
  assert 'Mano labai ilgas' in page.locator('.cvbox.ok').inner_text()
  assert 'Patvirtinote' in page.locator('.ivcard').inner_text()
  assert 'Paskambinsime nurodytu laiku.' in page.locator('.ivcard').inner_text()
  share=page.get_by_role('button',name='Dalintis',exact=True).bounding_box();profile=page.get_by_role('button',name='Įmonės profilis',exact=True).bounding_box()
  assert abs(share['width']-profile['width'])<1
  # Errors do not clear news; successful acknowledgement leaves unread chat.
  page.evaluate('window.ackError=true');page.get_by_role('button',name='Pažymėti perskaityta').click();page.get_by_role('alert').wait_for()
  assert page.locator('[data-testid=nav-count]').inner_text()=='2'
  page.evaluate('window.ackError=false');page.get_by_role('button',name='Pažymėti perskaityta').click();page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='1'")
  page.get_by_role('button',name='Rašyti įmonei').click();page.get_by_text('Sintetinė žinutė',exact=True).wait_for();page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='0'")
  # Hidden conversation must not silently consume incoming messages.
  page.locator('.msgs').evaluate("e=>e.style.display='none'")
  page.evaluate("window.records.worker=[{application_id:'application',ad_id:window.ad.id,chat_unread:1,events:[]}]")
  page.clock.fast_forward(15001);page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='1'")
  page.locator('.msgs').evaluate("e=>e.style.removeProperty('display')")
  page.evaluate("window.dispatchEvent(new Event('focus'))")
  page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='0'")
  # The same existing Messenger opens ad conversations from outside the ad.
  page.evaluate("window.records.worker=[{application_id:'application',ad_id:window.ad.id,chat_unread:1,events:[],participant_name:'UAB Bandymų įmonė',ad_title:window.ad.title,chat_latest_at:'2026-11-04T10:00:00Z'}];window.mount('worker')")
  page.wait_for_function("document.querySelector('[data-testid=messenger-count]').textContent==='1'")
  page.get_by_role('button',name='Atidaryti Messenger',exact=True).click()
  page.locator('.conv.un').click();page.get_by_text('Sintetinė žinutė',exact=True).wait_for()
  page.wait_for_function("document.querySelector('[data-testid=messenger-count]').textContent==='0'")
  # Preserve actual upload/confirmation frontend path (mock storage/RPC only).
  page.evaluate("window.candidate.cv_sent_at=null;window.candidate.cv_path=null;window.candidate.interview_confirmed_at=null;window.mount('worker')")
  page.locator('article.job').wait_for();page.locator('article.job').click()
  page.locator('input[type=file]').set_input_files({'name':'Atnaujintas CV.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 synthetic CV'})
  page.get_by_text('Atnaujintas CV.pdf',exact=True).wait_for()
  page.get_by_role('button',name='Patvirtinti pokalbį',exact=True).click()
  page.get_by_text('Patvirtinote',exact=True).wait_for()
  assert page.evaluate("window.calls.some(c=>c.name==='job_ad_attach_cv')&&window.calls.some(c=>c.name==='job_ad_confirm_interview')")
  page.screenshot(path=f'/tmp/s24-worker-candidate-{width}.png',full_page=True)
  assert page.locator('.ivcard.changed').count()==0
  # Read notification state is independent from renewed interview confirmation.
  page.evaluate("window.candidate.interview_changed=true;window.candidate.interview_confirmed_at=null;window.records.worker=[];window.mount('worker')")
  page.locator('article.job').wait_for();page.locator('article.job').click()
  page.locator('.ivcard.changed').wait_for()
  page.get_by_text('Pokalbis pakeistas',exact=True).wait_for()
  assert 'Patvirtinkite iš naujo' in page.locator('.ivcard.changed').inner_text()
  page.screenshot(path=f'/tmp/s24-interview-changed-{width}.png',full_page=True)
  page.get_by_role('button',name='Patvirtinti pokalbį',exact=True).click()
  page.get_by_text('Patvirtinote',exact=True).wait_for()
  assert page.locator('.ivcard.changed').count()==0

  # Switching to employer resets the previous worker badge; employer gets own news.
  page.evaluate("window.records.employer=[{application_id:'application',ad_id:window.ad.id,chat_unread:1,chat_latest_at:'2026-11-04T10:00:00Z',participant_name:'Testinis Kandidatas',ad_title:window.ad.title,events:[{kind:'cv_uploaded',version:'v2',label:'Kandidatas įkėlė CV'},{kind:'confirmed',version:'v3',label:'Kandidatas patvirtino pokalbio laiką'}]}];window.mount('employer')")
  page.locator('article.job').wait_for();page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='3'")
  page.locator('article.job').click();page.get_by_text('Kandidatas įkėlė CV',exact=True).wait_for()
  assert page.locator('.candidate-contact a').get_attribute('href')=='tel:+37060000000'
  assert page.locator('.candidate-contact').get_by_text('Kandidato telefonas',exact=True).count()==1
  page.get_by_text('Kandidatas patvirtino pokalbio laiką',exact=True).wait_for()
  # Seeing CV/confirmation news clears only those events, not incoming messages.
  page.locator('.ad-news').scroll_into_view_if_needed()
  page.clock.run_for(1600)
  page.wait_for_function("document.querySelector('[data-testid=nav-count]').textContent==='1'")
  assert page.evaluate('window.records.employer[0].chat_unread')==1
  assert page.evaluate('window.records.employer[0].events.length')==0
  page.locator('.wk.cand').screenshot(path=f'/tmp/s24-candidate-card-{width}.png')

  page.get_by_role('button',name='Keisti laiką',exact=True).click()
  assert page.locator('input[type=date]').count()==0
  page.get_by_role('button',name='Pokalbio data',exact=True).click()
  page.get_by_role('dialog',name='Pokalbio data',exact=True).wait_for()
  page.keyboard.press('Escape')
  page.get_by_role('combobox',name='Laikas',exact=True).click();page.get_by_role('option',name='10:30',exact=True).click()
  page.get_by_text('Telefonu',exact=True).last.click()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.screenshot(path=f'/tmp/s24-candidate-interview-{width}.png',full_page=True)
  page.get_by_role('button',name='Siųsti naują laiką').click()
  page.wait_for_function("window.calls.some(c=>c.name==='job_ad_candidate_update'&&c.args.p_interview_how==='phone')")
  page.wait_for_function("document.querySelectorAll('.candidate-contact a').length===0")
  # Employer can reopen a read conversation; only its red badge disappears.
  page.get_by_role('button',name='Atidaryti Messenger',exact=True).click()
  page.locator('.conv.un').click();page.get_by_text('Sintetinė žinutė',exact=True).wait_for()
  page.wait_for_function("document.querySelector('[data-testid=messenger-count]').textContent==='0'")
  page.get_by_role('region',name='Pokalbis',exact=True).get_by_role('button',name='Uždaryti',exact=True).click()
  page.get_by_role('button',name='Atidaryti Messenger',exact=True).click()
  assert page.locator('.conv').count()==1
  assert page.locator('.conv.un').count()==0
  page.clock.fast_forward(15001)
  assert page.locator('.conv').count()==1
  assert page.locator('.conv.un').count()==0
  assert 'Testinis Kandidatas' in page.locator('.conv').inner_text()
  page.locator('.conv').click();page.get_by_text('Sintetinė žinutė',exact=True).wait_for()
  # Confirmed face-to-face interviews expose the same contact on the Basic plan.
  page.evaluate("window.candidate.interview_how='live';window.candidate.interview_address='Bandymų g. 1';window.candidate.interview_confirmed_at='2026-11-04';window.mount('employer')")
  page.locator('article.job').wait_for();page.locator('article.job').click()
  page.locator('.candidate-contact a').wait_for()
  assert page.locator('.candidate-contact a').get_attribute('href')=='tel:+37060000000'
  assert not errors,errors
  print(f'PASS {width}px: automatic global/ad/candidate counters, isolated roles, news acknowledgement/error, chat reads, CV card, interview/calendar/select, share width; synthetic only')
  page.close()
 browser.close()
