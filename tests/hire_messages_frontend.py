"""Synthetic UI tests only. No real Supabase authentication or database calls."""
from pathlib import Path
import json
import subprocess
from playwright.sync_api import sync_playwright

repo = Path(__file__).resolve().parents[1]
entry = '''
import React from 'react';
import {createRoot} from 'react-dom/client';
import {HireMessages} from './src/hire/HireMessages.jsx';
import {ChatThreadView} from './src/chat/conversations.jsx';
window.calls=[]; window.failSend=false; window.failLoad=false;
window.rows=[{id:'synthetic-1',sender_kind:'admin',body:'<img src=x onerror=alert(1)>',created_at:'2026-11-03T10:00:00Z'}];
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=(fn,ms)=>{if(ms===15000)window.pollMessages=fn;return nativeSetInterval(fn,ms);};
window.renderMessages=(props)=>root.render(<HireMessages key={props.instance || 'default'} {...props}/>);
window.renderExisting=()=>root.render(<ChatThreadView title="Esamas pokalbis" messages={[]} isMine={()=>false} senderOf={()=>'Testas'} value="Originalus" setValue={()=>{}} onSend={event=>{event.preventDefault();window.originalSent=true;}} onClose={()=>{}} placeholder="Įprastas pokalbis"/>);
const root=createRoot(document.getElementById('root'));
window.renderMessages({requestId:'synthetic-request',companyName:'[TEST ONLY] Statybos24 Hire',readScope:'admin:synthetic-owner:synthetic-company'});
'''
mock = '''export const supabase={rpc:async(name,args)=>{
window.calls.push({name,args});
if(name.endsWith('_send_message')) {
 if(window.failSend){window.failSend=false;return {error:{message:'synthetic network error'}};}
 window.rows.push({id:'synthetic-2',sender_kind:'admin',body:args.p_body,created_at:'2026-11-03T10:01:00Z'});
 return {data:'synthetic-2'};
}
return window.failLoad ? {error:{message:'synthetic unavailable'}} : {data:[...window.rows]};
}};'''
build = '''
import {build} from 'esbuild';
const result=await build({stdin:{contents:ENTRY,resolveDir:process.cwd(),loader:'jsx'},
bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'synthetic-config',setup(b){
b.onResolve({filter:/lib\\/config\\.js$/},()=>({path:'mock-config',namespace:'test'}));
b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));
}}]});process.stdout.write(result.outputFiles[0].text);
'''.replace('ENTRY', json.dumps(entry)).replace('MOCK', json.dumps(mock))
bundle = subprocess.run(['node', '--input-type=module', '-e', build], cwd=repo,
                        capture_output=True, text=True, check=True).stdout
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in [1440, 781, 390]:
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('**/*', lambda route: route.fulfill(status=200, content_type='text/html', body='<html></html>') if route.request.resource_type == 'document' else route.abort())
        page.goto('http://localhost')
        page.set_content('<div class="p24" style="max-width:700px;margin:auto"><div id="root"></div></div>')
        page.add_style_tag(path=str(repo / 'src/p24/p24.css'))
        page.add_style_tag(path=str(repo / 'src/hire/hireMessages.css'))
        page.add_style_tag(path=str(repo/'src/ui/SiteSelect.css'));page.add_script_tag(content=bundle)
        launcher = page.get_by_role('button', name='Žinutės', exact=True)
        launcher.wait_for()
        assert page.get_by_role('dialog').count() == 0
        assert launcher.is_visible()
        bubble = launcher.bounding_box()
        assert bubble['x'] + bubble['width'] <= width
        assert bubble['y'] + bubble['height'] <= (820 if width == 390 else 900)
        launcher.click()
        page.get_by_role('dialog').wait_for()
        field = page.get_by_role('textbox')
        send = page.get_by_role('button', name='Siųsti žinutę')
        page.get_by_text('<img src=x onerror=alert(1)>', exact=True).wait_for()
        assert page.locator('.hire-chat-widget .bub img').count() == 0
        assert send.is_disabled()
        dialog = page.get_by_role('dialog').bounding_box()
        button = send.bounding_box()
        field_box = field.bounding_box()
        assert button['x'] >= field_box['x'] + field_box['width']
        assert button['y'] + button['height'] <= dialog['y'] + dialog['height']
        assert dialog['x'] >= 0 and dialog['x'] + dialog['width'] <= width + 1
        field.fill('Išsaugotas juodraštis')
        page.keyboard.press('Escape')
        assert page.get_by_role('dialog').count() == 0
        assert launcher.evaluate('(e)=>document.activeElement===e')
        launcher.click()
        assert field.input_value() == 'Išsaugotas juodraštis'
        field.fill('Sintetinė žinutė')
        page.evaluate('window.failSend=true')
        send.click()
        page.get_by_role('alert').wait_for()
        assert field.input_value() == 'Sintetinė žinutė'
        send.click()
        page.get_by_text('Žinutė išsiųsta.', exact=True).wait_for()
        assert field.input_value() == ''
        ids = page.evaluate("window.calls.filter(c=>c.name.endsWith('_send_message')).map(c=>c.args.p_client_id)")
        assert len(ids) == 2 and ids[0] == ids[1]
        page.keyboard.press('Escape')
        page.evaluate("window.rows.push({id:'incoming-1',sender_kind:'employer',body:'Atsakymas iš įmonės',created_at:'2026-11-03T10:02:00Z'});window.pollMessages()")
        page.get_by_role('status', name='Naujos žinutės: 1').wait_for()
        launcher.click()
        page.wait_for_function("!document.querySelector('.hire-chat-launcher .nb')")
        page.get_by_text('Atsakymas iš įmonės',exact=True).wait_for()
        assert page.locator('.who-n',has_text='Statybos24 administratorius').count() > 0
        assert page.locator('.who-n',has_text='[TEST ONLY] Statybos24 Hire').count() > 0
        assert page.locator('.tperson .cav').inner_text() == 'SH'
        page.keyboard.press('Escape')
        page.evaluate("window.renderMessages({instance:'remounted',requestId:'synthetic-request',companyName:'[TEST ONLY] Statybos24 Hire',readScope:'admin:synthetic-owner:synthetic-company'})")
        page.wait_for_function("document.querySelector('.hire-chat-launcher')?.getAttribute('aria-expanded')==='false'")
        launcher.click()
        page.get_by_text('Atsakymas iš įmonės',exact=True).wait_for()
        assert page.locator('.hire-chat-launcher .nb').count() == 0
        page.evaluate("window.rows.push({id:'long-own',sender_kind:'admin',body:'Ilgas tekstas '.repeat(150),created_at:'2026-11-03T10:03:00Z'});window.pollMessages()")
        page.get_by_text(('Ilgas tekstas ' * 150).strip(), exact=True).wait_for()
        assert page.locator('.msgs').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        bounds = page.locator('.msgs').bounding_box()
        for box in page.locator('.msgs .bub').all():
            rect = box.bounding_box()
            assert rect['x'] >= bounds['x'] and rect['x']+rect['width'] <= bounds['x']+bounds['width']
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.evaluate("window.renderMessages({sessionToken:'synthetic-token',companyName:'Actual Company',readScope:'employer:synthetic-company',lang:'en'})")
        page.get_by_role('button', name='Messages', exact=True).click()
        page.get_by_role('button', name='Send message', exact=True).wait_for()
        page.wait_for_function("window.calls.some(c=>c.name==='hire_employer_messages')")
        employer = page.evaluate("window.calls.filter(c=>c.name==='hire_employer_messages').at(-1)")
        assert employer['args'] == {'p_session_token': 'synthetic-token'}
        page.keyboard.press('Escape')
        page.evaluate("window.rows.push({id:'incoming-admin',sender_kind:'admin',body:'New administrator message',created_at:'2026-11-03T10:04:00Z'});window.pollMessages()")
        page.get_by_role('status', name='New messages: 1').wait_for()
        page.get_by_role('button', name='Messages', exact=True).click()
        page.wait_for_function("!document.querySelector('.hire-chat-launcher .nb')")
        assert page.locator('.who-n',has_text='Actual Company').count() > 0
        assert page.locator('.who-n',has_text='Statybos24 administrator').count() > 0
        assert not errors, errors
        page.screenshot(path=f'/tmp/s24-messenger-{width}.png')
        page.evaluate('window.renderExisting()')
        original = page.get_by_role('textbox', name='Įprastas pokalbis')
        original.wait_for()
        assert original.get_attribute('maxlength') == '2000'
        page.get_by_role('button', name='Siųsti', exact=True).click()
        assert page.evaluate('window.originalSent') is True
        print(f'{width}px PASS: unread/read badges for both roles, named senders, correct initials, long-message bounds, retained draft, retry ID, existing Messenger compatibility')
        page.close()
    browser.close()
