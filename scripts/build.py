# Builds private/dashboard.html from src/. Run after changing anything in src/.
import json,re,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
S=R+'src/'
D2=dict(snapDate='2026-11-09',health=json.load(open(S+'health.json')),fx=json.load(open(S+'fixtures.json')),stores=['Ashland','Wadsworth','Massillon'])
t=open(S+'template.html').read()
t=t.replace('const R=D.R,S=D.stores,','let R={},S=D.stores,')
t=t.replace('<p>Pulp Juice &amp; Smoothie Bar · Ashland, Wadsworth, Massillon · Snapshot through Mon Nov 9, 2026</p>','<p>Pulp Juice &amp; Smoothie Bar · Ashland, Wadsworth, Massillon</p><p id="sync" class="syncbar"></p>')
SYNC_CSS=open(S+'sync.css').read() if os.path.exists(S+'sync.css') else ''
t=t.replace('</style>',SYNC_CSS+'</style>',1)
t=re.sub(r'<p class="foot">.*?</p>','<p class="foot">Everything on this page reads live from the JDF Group Google Sheets. Sales and labor recheck about every 30 seconds, the rest every one to five minutes. Labor dollars are labor % × net sales. Projections use the days entered so far in the current month. <a href="#" onclick="fetch(\'/api/logout\',{method:\'POST\'}).then(()=>location.reload());return false">Sign out</a></p>',t,flags=re.S)
a=t.index('T.Overview=()=>'); b=t.index('const tabs=Object.keys(T);'); d=t.index('</script>',b)
eng=open(S+'engine.js').read().split("if(typeof module")[0]+'\n'+open(S+'engine2.js').read().split("if(typeof module")[0]
parts=[open(S+f).read() for f in ['newtabs.js','supplytabs.js','datatab.js','orders.js','tail.js']]
t=t[:a]+eng+'\n'+'\n'.join(parts)+'\n'+t[d:]
t=t.replace('/*DATA*/',json.dumps(D2))
svg=re.sub(r'<\?xml[^>]*\?>','',open(S+'logo.svg').read()); t=t.replace('<!--LOGO-->',svg)
# runtime shim goes first inside the main script so claude.use('mcp') resolves to /api calls
shim=open(S+'shim.js').read()
i=t.index('<script>')+len('<script>'); t=t[:i]+'\n'+shim+'\n'+t[i:]
t=t.replace('<head>','<head><link rel="icon" href="data:,">',1)
os.makedirs(R+'private',exist_ok=True)
t=t.replace('Live sync is off in this view. Showing the \'+wl(D.snapDate)+\' snapshot. Open the page in claude.ai with Google connected for live data.','Live sync is off. Showing the \'+wl(D.snapDate)+\' snapshot. Reload the page.')
open(R+'private/dashboard.html','w').write(t)
print('built',len(t))
