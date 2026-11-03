"""Shared select behavior in an offline browser. No server or account access."""
from pathlib import Path
import json,subprocess
from playwright.sync_api import sync_playwright
repo=Path(__file__).resolve().parents[1]
entry='''import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {SiteSelect} from './src/ui/SiteSelect.jsx';import {RoundedSelect} from './src/ui/common.jsx';
function App(){const [value,setValue]=useState(''),[number,setNumber]=useState(1);
window.setChoice=setValue;window.changes=window.changes||[];
return <main className="p24" style={{padding:16,maxWidth:600}}><form onSubmit={e=>{e.preventDefault();window.submitted=Object.fromEntries(new FormData(e.currentTarget));}}>
<label className="field">Miestas<SiteSelect name="city" required value={value} onChange={e=>{window.changes.push(e.target.value);setValue(e.target.value);}}>
<option value="" disabled>Pasirinkite miestą</option><optgroup label="Didieji miestai"><option value="vilnius">Vilnius</option><option value="kaunas" disabled>Kaunas</option><option value="klaipeda">Klaipėda</option></optgroup><option value="siauliai">Šiauliai</option></SiteSelect></label>
<label className="field">Neaktyvus<SiteSelect disabled value="a"><option value="a">Neaktyvus laukas</option></SiteSelect></label>
<button type="submit" className="btn">Siųsti</button></form>
<button type="button" className="btn">Kitas mygtukas</button>
<label className="field">Skaičius<RoundedSelect ariaLabel="Skaičius" value={number} options={[{value:1,label:'Vienas'},{value:2,label:'Du'}]} onChange={x=>{window.numberType=typeof x;setNumber(x);}}/></label>
<div style={{height:650}}></div><label className="field">Ilgas sąrašas<SiteSelect defaultValue="0">{Array.from({length:80},(_,i)=><option key={i} value={String(i)}>Pasirinkimas {i}</option>)}</SiteSelect></label>
</main>};createRoot(document.getElementById('root')).render(<App/>);'''
build='''import {build} from 'esbuild';const r=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'}});process.stdout.write(r.outputFiles[0].text);'''.replace('ENTRY',json.dumps(entry))
bundle=subprocess.run(['node','--input-type=module','-e',build],cwd=repo,capture_output=True,text=True,check=True).stdout
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=b.new_page(viewport={'width':width,'height':900});page.set_default_timeout(8000);errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<div id="root"></div>') if r.request.resource_type=='document' else r.abort())
  page.goto('http://localhost');page.add_style_tag(path=str(repo/'src/p24/p24.css'));page.add_style_tag(path=str(repo/'src/ui/SiteSelect.css'));page.add_script_tag(content=bundle)
  city=page.get_by_role('combobox',name='Miestas',exact=True);city.wait_for()
  page.get_by_role('button',name='Siųsti',exact=True).click();assert city.get_attribute('aria-invalid')=='true';assert city.evaluate('e=>e===document.activeElement')
  assert page.evaluate('window.submitted||null') is None
  city.press('ArrowDown');page.get_by_role('listbox',name='Miestas',exact=True).wait_for()
  city.press('ArrowDown');city.press('Enter');assert city.inner_text().strip()=='Klaipėda'
  assert page.evaluate('window.changes')==['klaipeda']
  page.get_by_role('button',name='Siųsti',exact=True).click();assert page.evaluate('window.submitted.city')=='klaipeda'
  city.press('v');page.get_by_role('listbox',name='Miestas',exact=True).wait_for();city.press('Escape');assert city.inner_text().strip()=='Klaipėda'
  city.press('Home');city.press('End');city.press('Enter');assert city.inner_text().strip()=='Šiauliai'
  city.click();page.get_by_role('option',name='Vilnius',exact=True).click();assert city.inner_text().strip()=='Vilnius'
  assert city.get_attribute('aria-expanded')=='false'
  city.click();page.get_by_role('button',name='Kitas mygtukas',exact=True).click();assert city.get_attribute('aria-expanded')=='false'
  assert page.get_by_role('combobox',name='Neaktyvus',exact=True).is_disabled()
  number=page.get_by_role('combobox',name='Skaičius',exact=True);number.click();page.get_by_role('option',name='Du',exact=True).click();assert page.evaluate('window.numberType')=='number'
  city.click();city.press('Tab');assert city.get_attribute('aria-expanded')=='false'
  long=page.get_by_role('combobox',name='Ilgas sąrašas',exact=True);long.scroll_into_view_if_needed();long.click();long.press('End')
  box=page.get_by_role('listbox',name='Ilgas sąrašas',exact=True);box.wait_for();assert box.evaluate('e=>e.parentElement===document.body')
  bounds=box.bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=width+1
  assert bounds['y']>=0 and bounds['y']+bounds['height']<=901
  assert box.evaluate('e=>e.scrollTop')>0
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.screenshot(path=f'/tmp/s24-site-select-{width}.png')
  long.press('Enter');assert '79' in long.inner_text()
  assert not errors,errors
  print(f'PASS {width}px: custom popup, keyboard, required validation, form data, disabled choices, numeric adapter, outside/Escape/Tab, scrolling and viewport bounds')
  page.close()
 b.close()
