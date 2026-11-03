"""Built-site navigation only. No authentication, form submissions or external requests."""
from pathlib import Path
from urllib.parse import urlsplit
import mimetypes
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/tmp/s24-hire-split');OUT.mkdir(exist_ok=True)
for folder in ['dist','dist-hire']:assert (ROOT/folder/'index.html').is_file(),f'Run build and build:hire first: {folder}'
hire_js='\n'.join(p.read_text() for p in (ROOT/'dist-hire/assets').glob('*.js'))
main_js='\n'.join(p.read_text() for p in (ROOT/'dist/assets').glob('*.js'))
assert 'get_admin_dashboard_stats' not in hire_js
assert 'foreign_employer_login' not in main_js
assert not (ROOT/'dist-hire/statybos24-push-sw.js').exists()
assert 'https://hire.statybos24.lt/' in (ROOT/'dist-hire/sitemap.xml').read_text()

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1440,900),(390,844)]:
        ctx=b.new_context(viewport={'width':width,'height':height},service_workers='block');errors=[]
        def route(r):
            url=urlsplit(r.request.url)
            if url.hostname not in ['main.test','hire.test']:return r.abort()
            directory=ROOT/('dist-hire' if url.hostname=='hire.test' else 'dist')
            path=(directory/url.path.lstrip('/')).resolve()
            assert path.is_relative_to(directory.resolve())
            if path.is_file():return r.fulfill(path=str(path),content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
            return r.fulfill(path=str(directory/'index.html'),content_type='text/html')
        ctx.route('**/*',route);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://main.test/',wait_until='domcontentloaded')
        page.locator('.lp-hero').wait_for()
        page.evaluate('localStorage.setItem("s24_foreign_hire_portal_session","synthetic-old-origin-only")')
        page.goto('http://hire.test/',wait_until='domcontentloaded')
        page.locator('.hire-p24').wait_for()
        assert page.evaluate('localStorage.getItem("s24_foreign_hire_portal_session")') is None
        assert page.locator('link[rel=manifest]').count()==0
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.screenshot(path=str(OUT/f'hire-home-{width}.png'))
        page.locator('a[href^="/login"]').click()
        page.locator('.hp-login').wait_for()
        assert '/login' in page.url and '/hire' not in urlsplit(page.url).path
        page.screenshot(path=str(OUT/f'hire-login-{width}.png'))
        assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
        page.locator('a[href^="/?lang"]').click()
        page.locator('.hire-p24').wait_for()
        page.goto('http://hire.test/portal',wait_until='domcontentloaded')
        page.locator('a[href^="/login"]').first.wait_for()
        assert page.locator('.lp-hero,.wd-shell,.ed-shell').count()==0
        assert not errors,errors
        print(width,'PASS: independent root/login/portal, same-origin links, separate storage, no main PWA or runtime errors',flush=True)
        ctx.close()
    b.close()
print('PASS: hire bundle excludes main admin app; main bundle excludes hire login; only hire public assets')
