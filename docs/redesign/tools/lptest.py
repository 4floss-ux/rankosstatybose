import asyncio, os
from playwright.async_api import async_playwright
HTML=open('/home/claude/4floss-ux/rankosstatybose/index.html').read().replace('<script type="module" src="/src/main.jsx"></script>','<link rel="stylesheet" href="/__b/app.css"><script type="module" src="/__b/app.js"></script>')
PUB='/home/claude/4floss-ux/rankosstatybose/public'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); errs=[]
    for w,h in [(1440,900),(390,844)]:
      ctx=await b.new_context(viewport={'width':w,'height':h})
      async def handler(route):
        url=route.request.url
        if not url.startswith('http://s24.test'): return await route.abort()
        pth='/'+url.split('://',1)[1].split('/',1)[1].split('?')[0]
        if pth.startswith('/__b/'): return await route.fulfill(path='b_new/'+pth[5:], content_type='text/css' if pth.endswith('.css') else 'application/javascript')
        if pth=='/api/status': return await route.fulfill(body='{"ok":true,"maintenance":false}',content_type='application/json')
        if os.path.isfile(PUB+pth): return await route.fulfill(path=PUB+pth)
        return await route.fulfill(body=HTML, content_type='text/html')
      await ctx.route('**/*', handler)
      pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
      await pg.goto('http://s24.test/'); await pg.wait_for_timeout(3500)
      await pg.evaluate("document.querySelectorAll('[data-rv]').forEach(e=>e.classList.add('in'))")
      await pg.screenshot(path=f'lp_{w}.png', full_page=True)
      print(w,'overflow', await pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
      await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
      info=await pg.evaluate('''(()=>{const b=[...document.querySelectorAll('[data-act=auth][data-v=login]')].find(e=>e.offsetParent);const r=b.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);const h=document.querySelector('.pub-top');const cs=getComputedStyle(h);return [r.y, t&&t.outerHTML.slice(0,80), cs.position, cs.zIndex]})()''')
      print(info)
      await pg.mouse.click(*(await pg.evaluate('''(()=>{const b=[...document.querySelectorAll('[data-act=auth][data-v=login]')].find(e=>e.offsetParent);const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()'''))); await pg.wait_for_timeout(700)
      await pg.screenshot(path=f'lp_login_{w}.png')
      await ctx.close()
    print(errs); await b.close()
asyncio.run(main())
