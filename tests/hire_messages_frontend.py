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
window.calls=[]; window.failSend=false; window.failLoad=false;
window.rows=[{id:'synthetic-1',sender_kind:'admin',body:'<img src=x onerror=alert(1)>',created_at:'2026-11-03T10:00:00Z'}];
window.renderMessages=(props)=>root.render(<HireMessages {...props}/>);
const root=createRoot(document.getElementById('root'));
window.renderMessages({requestId:'synthetic-request'});
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
bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'synthetic-config',setup(b){
b.onResolve({filter:/lib\\/config\\.js$/},()=>({path:'mock-config',namespace:'test'}));
b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:MOCK,loader:'js'}));
}}]});process.stdout.write(result.outputFiles[0].text);
'''.replace('ENTRY', json.dumps(entry)).replace('MOCK', json.dumps(mock))
bundle = subprocess.run(['node', '--input-type=module', '-e', build], cwd=repo,
                        capture_output=True, text=True, check=True).stdout
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in [1440, 390]:
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('**/*', lambda route: route.fulfill(status=200, content_type='text/html', body='<html></html>') if route.request.resource_type == 'document' else route.abort())
        page.goto('http://localhost')
        page.set_content('<div class="p24" style="max-width:700px;margin:auto"><div id="root"></div></div>')
        page.add_style_tag(path=str(repo / 'src/p24/p24.css'))
        page.add_script_tag(content=bundle)
        field = page.get_by_role('textbox')
        send = page.get_by_role('button', name='Siųsti žinutę')
        page.get_by_text('<img src=x onerror=alert(1)>', exact=True).wait_for()
        assert page.locator('#root img').count() == 0
        assert send.is_disabled()
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
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.evaluate("window.renderMessages({sessionToken:'synthetic-token',lang:'en'})")
        page.get_by_role('button', name='Send message', exact=True).wait_for()
        page.wait_for_function("window.calls.some(c=>c.name==='hire_employer_messages')")
        employer = page.evaluate("window.calls.filter(c=>c.name==='hire_employer_messages').at(-1)")
        assert employer['args'] == {'p_session_token': 'synthetic-token'}
        assert not errors, errors
        print(f'{width}px PASS: safe text, empty-send prevention, retained draft, retry ID, employer context, no overflow')
        page.close()
    browser.close()
