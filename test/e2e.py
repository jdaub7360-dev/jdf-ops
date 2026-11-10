# Starts test/server.js, then drives the site in Chrome: gate, login, live data, polling, logout.
import subprocess,time,sys,json,urllib.request
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['node','test/server.js'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
time.sleep(1.5)
base='http://localhost:3917'
def get(p,cookie=None):
    r=urllib.request.Request(base+p,headers={'Cookie':cookie} if cookie else {})
    try:
        x=urllib.request.urlopen(r);return x.status,x.read().decode()
    except urllib.error.HTTPError as e:return e.code,e.read().decode()
ok=True
def check(name,cond):
    global ok;print(('PASS ' if cond else 'FAIL ')+name);ok=ok and cond
try:
    s,b=get('/');check('root without login shows login form, not dashboard','Enter the password' in b and 'Store scorecard' not in b and '2026-11-09' not in b)
    s,b=get('/api/sheets?id=1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g&range=Ashland!A3:N43');check('sheets api refuses without session',s==401)
    s,b=get('/api/meta?id=1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g');check('meta api refuses without session',s==401)
    with sync_playwright() as p:
        br=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=br.new_page(viewport={'width':420,'height':900});errs=[]
        pg.on('response',lambda r:print('HTTP',r.status,r.url[:140]) if r.status>=400 else None);pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'status of 401' not in m.text and 'status of 429' not in m.text and 'status of 502' not in m.text else None)
        pg.goto(base+'/');pg.fill('#pw','wrong');pg.click('button');pg.wait_for_timeout(400)
        check('wrong password shows an error','not right' in pg.inner_text('#err'))
        pg.fill('#pw','test-pass');pg.click('button');pg.wait_for_selector('#nav',timeout=8000);pg.wait_for_timeout(2500)
        sync=pg.inner_text('#sync');print(sync[:200])
        check('dashboard loads after login','Operations dashboard' in pg.inner_text('body'))
        check('every module reports live',all(x in sync for x in ['Sales and labor: live','Sysco: live','Tips: live','Enhancers: live','PAR counts: live','Cookies: live']))
        pg.click('#nav button[data-t="Orders"]');pg.wait_for_timeout(300)
        check('orders tab renders',  'Next order day' in pg.inner_text('#main'))
        pg.click('#nav button[data-t="All data"]');pg.wait_for_timeout(1500)
        check('all data tab renders','rows' in pg.inner_text('#main') or 'Colors' in pg.inner_text('#main'))
        pg.screenshot(path='/tmp/site_phone.png',full_page=False)
        check('no script errors',errs==[] ); 
        if errs:print(errs)
        cookies=pg.context.cookies();ck='; '.join(c['name']+'='+c['value'] for c in cookies)
        s,b=get('/api/sheets?id=1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g&range=Ashland!A3:N43',ck);check('sheets api works with session',s==200 and 'values' in b)
        s,b=get('/api/sheets?id=NOTALLOWEDSHEETID&range=A1:B2',ck);check('sheet outside allowlist is refused',s==403)
        s,b=get('/api/sheets?id=1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g&range=A1%27%3B%20drop',ck);check('odd range characters refused',s in (400,502))
        s,b=get('/',ck);check('root with session serves dashboard','Store scorecard' in b or 'Operations dashboard' in b)
        tampered=ck.replace('jdf_session=','jdf_session=9999999999.');s,b=get('/api/meta?id=1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g',tampered);check('tampered cookie refused',s==401)
        br.close()
    # lockout
    import urllib.parse
    def login(pw):
        r=urllib.request.Request(base+'/api/login',data=json.dumps({'password':pw}).encode(),headers={'Content-Type':'application/json'},method='POST')
        try:return urllib.request.urlopen(r).status
        except urllib.error.HTTPError as e:return e.code
    codes=[login('nope') for _ in range(7)]
    check('lockout after repeated wrong passwords',429 in codes and codes[0]==401 and codes.index(429)<=6)
    check('lockout blocks even the right password',login('test-pass')==429)
finally:
    srv.terminate()
print('ALL PASS' if ok else 'FAILURES');sys.exit(0 if ok else 1)
