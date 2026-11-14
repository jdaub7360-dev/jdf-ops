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
        check('every module reports live',sync.startswith('Live') and 'snapshot' not in sync)
        pg.click('#nav button[data-t="Orders"]');pg.wait_for_timeout(300)
        check('orders tab renders',  'Next order day' in pg.inner_text('#main'))
        pg.click('.opill[data-v="Cookies"]');pg.wait_for_timeout(400)
        check('cookie orders explain the price per cookie','$1.85 a cookie' in pg.inner_text('#main'))
        pg.fill('.oq[data-g="cookie:Ashland"] >> nth=0','10');pg.wait_for_timeout(300)
        check('cookie order shows an estimated cost','Estimated cost $18.54 for 10 cookies' in pg.inner_text('#main') and 'estimated $18.54' in pg.inner_text('#main'))
        import subprocess as _sp
        r=_sp.run(['node','test/intensity.js'],capture_output=True,text=True)
        check('usage intensity unit checks pass (same cycles as burn, exact sales span, no estimates, 1.5 times flag)',r.returncode==0 and 'intensity ok' in r.stdout)
        pg.click('.opill[data-v="Stock health"]');pg.wait_for_timeout(500);t=pg.inner_text('#main')
        check('stock health leads with items needing attention, flags under 2 weeks and out of stock','Needs attention' in t and 'Under 2 weeks' in t and 'Out of stock' in t and '1.9 weeks' in t)
        check('stock health shows count dates and a calm not enough counts state, never zero burn','Counted Nov 4' in t and 'Counted Nov 8' in t and 'Not enough counts yet' in t and 'Delivery split unknown for Oct 14 to Nov 4 interval' in t)
        pg.click('[data-bs="Wadsworth"]');pg.wait_for_timeout(500);t=pg.inner_text('#main')
        check('stock health Wadsworth whey cover and run out, cookies calm with no counts','3.3' in t and 'Nov 27' in t and 'Company burn/wk' in t and 'no cookie counts yet' in t)
        check('stock health tightest item sorts first in the Wadsworth table',pg.evaluate("(()=>{const r=[...document.querySelectorAll('.bhtab')[0].querySelectorAll('tr')].slice(1,3).map(x=>x.children[0].innerText);return r[0].includes('Soy')&&r[1].includes('Whey')})()"))
        pg.click('#nav button[data-t="Hourly"]');pg.wait_for_timeout(400)
        t=pg.inner_text('#main')
        check('hourly tab shows peak hour and share for Ashland','Peak hour' in t and 'of the day' in t)
        check('hourly Ashland has no checks or average check','Average check' not in t and 'Checks' not in t and 'Total of the hours' in t)
        pg.click('.hst[data-st="Massillon"]');pg.wait_for_timeout(700);t=pg.inner_text('#main')
        check('hourly Massillon shows checks, average check and lag note','Average check' in t and 'Checks' in t and 'behind the other stores' in t and 'Nov 7' in t)
        pg.click('#hprev');pg.wait_for_timeout(600);check('hourly previous day moves the date','Nov 6' in pg.inner_text('#hsel option:checked') or 'Nov 6' in pg.inner_text('#main'))
        pg.click('.hst[data-st="Wadsworth"]');pg.wait_for_timeout(700);t=pg.inner_text('#main')
        check('hourly Wadsworth defaults to its latest day, no checks','Nov 9' in t and 'Average check' not in t and 'Compare the same weekday' in t and 'Average day by weekday' in t and t.index('Compare the same weekday')<t.index('Peak hour'))
        check('hourly comparison grid has one column per week plus Avg and Share',pg.evaluate("document.querySelectorAll('.hheat tr:first-child th').length")==7)
        pg.click('[data-n="3"]');pg.wait_for_timeout(500);check('hourly comparison narrows to 3 weeks',pg.evaluate("document.querySelectorAll('.hheat tr:first-child th').length")==6)
        pg.click('#nav button[data-t="Supply"]');pg.wait_for_timeout(600)
        check('supply shows usage per $1,000 of sales and the calm not enough counts state','per $1,000' in pg.inner_text('#main') and 'Not enough counts yet' in pg.inner_text('#main'))
        pg.evaluate("R.intensity['2.5lb Whey Protein'].flags={Wadsworth:2.1};show('Supply',true)");pg.wait_for_timeout(300)
        check('supply marks a store using 1.5 times the lowest as Worth a look','Worth a look' in pg.inner_text('#main'))
        check('supply tab has one enhancer table with a Company column',(pg.click('#nav button[data-t="Supply"]') or True) and 'Company' in pg.inner_text('#main') and 'Enhancers by store' not in pg.inner_text('#main'))
        pg.click('#askfab');pg.fill('#askq','average saturday sales');pg.click('#askb');pg.wait_for_timeout(1500)
        ans=pg.inner_text('#askl');print(ans[:200].replace('\n',' '))
        check('assistant answers from tool results','average' in ans and 'days' in ans and 'Ashland' in ans)
        pg.click('#nav button[data-t="Staffing"]');pg.wait_for_timeout(1200);t=pg.inner_text('#main')
        check('staffing flags red at 12 months and yellow at 6',"12 months or more" in t and "6 to 12 months" in t and 'Needs attention' in t and 'Old Raise' in t and pg.evaluate("document.querySelectorAll('#stNeed .stg.r').length>=2 && document.querySelectorAll('#stNeed .stg.y').length>=1"))
        check('staffing says when the hire date is used',pg.evaluate("[...document.querySelectorAll('.stt .hire')].length>=1"))
        pg.evaluate("document.querySelector('#stNeed summary').click()");pg.wait_for_timeout(300)
        check('staffing needs attention collapses to a small view and by store stays visible',pg.evaluate("!document.getElementById('stNeed').open")and pg.evaluate("!document.querySelector('#stNeed table').checkVisibility()") and 'By store' in pg.inner_text('#main'))
        pg.click('#nav button[data-t="Overview"]');pg.click('#nav button[data-t="Staffing"]');pg.wait_for_timeout(500)
        check('staffing remembers the collapsed state',pg.evaluate("!document.getElementById('stNeed').open"))
        pg.evaluate("document.querySelector('#stNeed summary').click()");pg.wait_for_timeout(300);t=pg.inner_text('#main')
        check('staffing shows the hourly rate under the last raise date','$14.00/hr' in t and '$13.50/hr' in t)
        check('staffing lists shirt sizes by store with employee and size side by side','Shirt sizes' in t and 'Company totals for ordering' in t and 'Medium' in t and 'Large' in t and 'no size' in t and pg.evaluate("[...document.querySelectorAll('.stgrid .card')].some(c=>c.innerText.includes('Test Employee')&&c.innerText.includes('Medium'))"))
        pg.click('#askcl');pg.click('#nav button[data-t="All data"]');pg.wait_for_timeout(1500)
        pg.click('.dtc[data-g="Roster"]');pg.wait_for_timeout(1500);t=pg.inner_text('#main')
        check('all data Roster source shows employees with pay rate in dollars','Sample' in t and '$14.00' in t and '$13.50' in t)
        pg.click('.dtc[data-g="Daily sales"]');pg.wait_for_timeout(500)
        check('all data tab renders','rows' in pg.inner_text('#main') or 'Colors' in pg.inner_text('#main'))
        check('all data daily sales fits the page with no sideways scroll','fit' in (pg.get_attribute('#dtw','class') or '') and pg.evaluate("(()=>{const w=document.getElementById('dtw');return w.scrollWidth<=w.clientWidth+1})()"))
        pg.click('.dtc[data-g="Sysco"]');pg.wait_for_timeout(600)
        check('all data Sysco has column dividers','vl' in (pg.get_attribute('#dtw','class') or '').split())
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
