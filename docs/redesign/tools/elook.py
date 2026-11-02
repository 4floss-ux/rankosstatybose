import asyncio, os, sys
from playwright.async_api import async_playwright
HTML=open('/home/claude/4floss-ux/rankosstatybose/index.html').read()
PUB='/home/claude/4floss-ux/rankosstatybose/public'
async def main():
    os.makedirs('el',exist_ok=True); errs=[]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h,steps in [(1440,900,['Naujas darbo']),(390,844,['overview','Darbai','Istorija','drawer'])]:
            ctx=await b.new_context(viewport={'width':w,'height':h})
            html=HTML.replace('<script type="module" src="/src/main.jsx"></script>','<script>window.__ROLE="employer"</script><script>'+open('edata.js').read()+'</script><link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>')
            async def handler(route):
                url=route.request.url
                if not url.startswith('http://s24.test'): return await route.abort()
                pth='/'+url.split('://',1)[1].split('/',1)[1].split('?')[0]
                if pth.startswith('/__b/'): return await route.fulfill(path='b_new/'+pth[5:], content_type='text/css' if pth.endswith('.css') else 'application/javascript')
                if pth=='/api/status': return await route.fulfill(body='{"ok":true,"maintenance":false}',content_type='application/json')
                if os.path.isfile(PUB+pth): return await route.fulfill(path=PUB+pth)
                return await route.fulfill(body=html, content_type='text/html')
            await ctx.route('**/*', handler)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
            await pg.goto('http://s24.test/'); await pg.wait_for_timeout(3500)
            for i,st in enumerate(steps):
                if st=='__chat': await pg.locator('.chatfab').click()
                elif st=='__open': await pg.locator('article.job:visible').first.click()
                elif st=='drawer': await pg.click('.topbar .iconbtn[aria-label="Atidaryti meniu"]')
                elif st!='overview':
                    sel='.tabbar .tab' if w<900 else '.app .side .item, .app .side .cta'
                    await pg.locator(sel,has_text=st).first.click()
                await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'el/{w}_{i}_{st[:8]}.png')
                ov=await pg.evaluate("document.documentElement.scrollWidth>innerWidth")
                if ov: errs.append(f'overflow {w} {st}')
            await ctx.close()
        await b.close()
    print(errs)
asyncio.run(main())
