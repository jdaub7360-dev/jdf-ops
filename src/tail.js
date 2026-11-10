const tabs=['Overview','Orders','Ask','Sales','Labor','Supply','Tips','All data','Data health'];
const GS='Google Sheets',GD='Google Drive',FID={sales:'1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g',labor:'1j9Aep9pRCy-Os80DMD3zWnKCOpV3YVeakJuol9EqOE4',sysco:'18lcS1wZobeEVDsP4sumjXqhn298XzpsGuhXShoAKcxM',tips:'1yXfOsp9E6Qaiwq02LfobMQRZqEGBzktxJM_zHQmzFjc',enh:'1PBd6rouiKWmcOYpfXfsGhzpYqXcL_d5120e2UN19dAA',cookie:'1xqF-jZuhJUeitAZFKvudqB_2SqIFDO7vBU4KgBHRfg8',par:{Ashland:'1K2aGrtoBq_x2dTrzw3isz9fZ2ygDU16zGLZ2Y2jrDts',Wadsworth:'10j2P0GsB3f-gUgjSYHzkjo4op2Ui9LZHHJhT8hULOh4',Massillon:'1SGH3hq1KgAItnEksO7AiH0GrkYKVFUbtcH-9zrvYqPg'}};
const MODS={core:[...S.map(s=>'sales:'+s),...S.map(s=>'labor:'+s)],sysco:['sysco'],tips:['tips:summary'],enh:['enh:totals','enh:usage','enh:order','enh:gnc'],par:S.map(s=>'par:'+s),cookie:['cookie:totals','cookie:orders']};
const MODNAME={core:'Sales and labor',sysco:'Sysco',tips:'Tips',enh:'Enhancers',par:'PAR counts',cookie:'Cookies'};
const gv=(id,range,tool)=>({srv:GS,tool:'get_values',input:{spreadsheetId:id,range}});
const DEFS=[];
S.forEach(s=>{DEFS.push({k:'sales:'+s,...gv(FID.sales,`${s}!A3:N43`),every:30000,parse:r=>parseGrid(r),ok:g=>Object.keys(g.days).length>=28&&!!g.years[CFG.year-1]});
 DEFS.push({k:'labor:'+s,...gv(FID.labor,`${s}!A3:N36`),every:30000,parse:r=>parseGrid(r),ok:g=>Object.keys(g.days).length>=28});
 DEFS.push({k:'par:'+s,...gv(FID.par[s],"'PAR Sheet'!A1:B170"),every:120000,parse:r=>r,ok:r=>r.length>3});
 DEFS.push({k:'drv:'+s,srv:GD,tool:'get_file_metadata',input:{fileId:FID.par[s],excludeContentSnippets:true},every:300000,opt:true,parseObj:p=>p&&(p.modifiedTime||p.modified_time)||null})});
DEFS.push({k:'sysco',...gv(FID.sysco,"'Sysco Orders'!A3:I400"),every:60000,parse:parseSysco,ok:o=>S.some(s=>o[s].length)});
DEFS.push({k:'tips:summary',...gv(FID.tips,'Summary!A3:E400'),every:60000,parse:r=>parseTipsSummary(r,CFG.year),ok:p=>p.length>=10});
DEFS.push({k:'enh:totals',...gv(FID.enh,'Totals!A1:K24'),every:120000,parse:parseEnhTotals,ok:t=>t.items.length>=5});
DEFS.push({k:'enh:usage',...gv(FID.enh,'Usage!A1:H400'),every:120000,parse:parseEnhUsage,ok:u=>u.length>=5});
DEFS.push({k:'drv:enh',srv:GD,tool:'get_file_metadata',input:{fileId:FID.enh,excludeContentSnippets:true},every:300000,opt:true,parseObj:p=>p&&(p.modifiedTime||p.modified_time)||null});
DEFS.push({k:'enh:order',...gv(FID.enh,'Order!A1:B30'),every:120000,parse:parseEnhOrder,ok:()=>true});
DEFS.push({k:'enh:storelog',...gv(FID.enh,"'Enhancer Store Log'!A1:F3000"),every:300000,opt:true,parse:parseEnhStoreLog,ok:()=>true});
DEFS.push({k:'enh:gnc',...gv(FID.enh,"'GNC Whey Orders'!A1:O60"),every:120000,parse:parseGnc,ok:()=>true});
DEFS.push({k:'cookie:totals',...gv(FID.cookie,'Totals!A1:I16'),every:120000,parse:parseCookieTotals,ok:c=>c.length>=1});
DEFS.push({k:'cookie:orders',...gv(FID.cookie,"'Cookie Orders'!A1:O40"),every:120000,parse:parseCookieOrders,ok:()=>true});
const SNAP={};const fx=D.fx;
S.forEach(s=>{SNAP['sales:'+s]=parseGrid(fx.sales[s]);SNAP['labor:'+s]=parseGrid(fx.labor[s]);SNAP['par:'+s]=fx.par[s];SNAP['drv:'+s]=fx.par.modified[s]});
SNAP.sysco=parseSysco(fx.sysco);SNAP['tips:summary']=parseTipsSummary(fx.tips.summary,CFG.year);SNAP['enh:totals']=parseEnhTotals(fx.enh.totals);SNAP['enh:usage']=parseEnhUsage(fx.enh.usage);SNAP['enh:order']=parseEnhOrder(fx.enh.order);SNAP['enh:gnc']=parseGnc(fx.enh.gnc);SNAP['enh:storelog']=parseEnhStoreLog(fx.enh.storelog||[]);SNAP['cookie:totals']=parseCookieTotals(fx.cookie.totals);SNAP['cookie:orders']=parseCookieOrders(fx.cookie.orders);
const SNAPTABS=Object.values(fx.tips.tabs).map(parseTipsTab);
const LIVE={},STS={},TABW={};let mcp=null,pending=true,current='Overview',lastSig='';
const AUTHZ=new Set(['needs_reauth','server_not_connected','blocked_by_policy','approval_required','not_in_manifest','selection_required']);
const tm=t=>new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const dayName=iso=>{const d=new Date(iso+'T12:00:00Z');return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+' '+MN[d.getUTCMonth()]+' '+d.getUTCDate()};
const gk=k=>LIVE[k]!==undefined?LIVE[k]:SNAP[k];
function payloadOf(res){let p=res&&res.payload;if(typeof p==='string'){try{p=JSON.parse(p)}catch(e){p=null}}
 if(p==null||typeof p!=='object'){try{const t=(res.content||[]).find(c=>c.type==='text');p=t&&JSON.parse(t.text)}catch(e){p=null}}return p}
function errText(code,msg){return({needs_reauth:'Google needs to be reconnected. Reconnect it in claude.ai under Settings, Connectors.',server_not_connected:'A Google connector is not connected for this viewer. Add it in claude.ai under Settings, Connectors.',selection_required:'More than one Google connector is linked. Choose one when claude.ai asks.',not_in_manifest:'Google access was declined for this page. Allow it in the page connector settings.',approval_required:'Google needs your approval before this page can read it.',blocked_by_policy:'Your organization blocks a Google connector for this viewer.',tool_error:'Google refused a range. The sheet may not be shared with this Google account. '+(msg||'').slice(0,120),parse:'A sheet came back in a layout the page does not recognise. Showing the last good data.',empty:'A sheet range came back empty. Showing the last good data.'})[code]||'Google did not answer. Showing the last good data and retrying.'}
function build(){const live=m=>MODS[m].every(k=>LIVE[k]);const cl=live('core');
 const Sg={},Lg={};S.forEach(s=>{Sg[s]=cl?LIVE['sales:'+s]:SNAP['sales:'+s];Lg[s]=cl?LIVE['labor:'+s]:SNAP['labor:'+s]});
 const res=computeLive(Sg,Lg),asOf=Date.parse(res.meta.asOf);
 res.sysco=syscoWeekly(gk('sysco'),res.weeks,res.weekly);
 const per=gk('tips:summary');res.tips=computeTips(per,res.sumSales,asOf);
 const tabKeys=Object.keys(LIVE).filter(k=>k.startsWith('tips:tab:'));res.spikes=tipSpikes(live('tips')?tabKeys.map(k=>LIVE[k]):SNAPTABS);
 res.enhModified=LIVE['drv:enh']||null;res.enh=computeEnh(gk('enh:totals'),gk('enh:usage'),gk('enh:order'));res.gnc=gk('enh:gnc');res.storeBurn=computeStoreBurn(gk('enh:storelog')||[]);
 const parLive=live('par');res.par={};S.forEach(s=>res.par[s]=analysePar(gk('par:'+s),LIVE['drv:'+s]||(parLive?null:SNAP['drv:'+s]),Date.now()));
 const ct=gk('cookie:totals'),co=gk('cookie:orders'),first=S.map(s=>co[s]).find(x=>x&&x.total);
 res.cookie={items:ct,byStore:co,last:first||null};
 return res}
function syncTabs(){const per=LIVE['tips:summary'];if(!per||!mcp)return;const want=per.filter(p=>p.tips.Ashland!=null||true).slice(0,3).map(p=>p.label),have=Object.keys(TABW);
 have.filter(l=>!want.includes(l)).forEach(l=>{try{TABW[l]()}catch(e){}delete TABW[l];delete LIVE['tips:tab:'+l]});
 want.filter(l=>!TABW[l]).forEach(l=>{const k='tips:tab:'+l;try{TABW[l]=mcp.watchTool(GS,'get_values',{spreadsheetId:FID.tips,range:`'${l}'!A1:D40`},ev=>{if(ev.type==='data'){const p=payloadOf(ev.result);if(p&&p.values){try{LIVE[k]=parseTipsTab(p.values)}catch(e){}refresh()}}},{refetchInterval:120000})}catch(e){}})}
function paintStatus(){const el=$('#sync');if(!el)return;const m=R.meta,errs=DEFS.filter(d=>!d.opt&&STS[d.k]&&STS[d.k].err).map(d=>STS[d.k]),cl=MODS.core.every(k=>LIVE[k]);let c='warn',txt,btn='';
 const anyLive=Object.keys(MODS).some(mm=>MODS[mm].every(k=>LIVE[k])),allLive=Object.keys(MODS).every(mm=>MODS[mm].every(k=>LIVE[k]));
 if(allLive&&!errs.length){c='ok';const at=Math.max(...DEFS.map(d=>STS[d.k]?.at||0));txt=`Live · checked ${tm(at)}`;btn='<button class="tog" id="rf">Refresh now</button>'}
 else if(anyLive){c='warn';txt=(errs.length?errText(errs[0].err,errs[0].msg)+' ':'Some sheets are still connecting. ')+'Sections not yet live show the '+wl(D.snapDate)+' snapshot.';btn='<button class="tog" id="rf">Refresh now</button>'}
 else if(errs.length){txt=errText(errs[0].err,errs[0].msg)+' Showing the '+wl(D.snapDate)+' snapshot.';if(errs[0].err==='approval_required')btn='<button class="tog" id="al">Allow access</button>'}
 else if(pending||mcp){txt='Connecting to Google. Showing the '+wl(D.snapDate)+' snapshot meanwhile.'}
 else{txt='Live sync is off in this view. Showing the '+wl(D.snapDate)+' snapshot. Open the page in claude.ai with Google connected for live data.'}
 const today=new Date(),td=Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()),behind=Math.round((td-Date.parse(m.asOf))/864e5);
 const thru=`Numbers through ${dayName(m.asOf)}${cl&&behind>1?` <b style="color:var(--warn)">(${behind} days behind, check that every store entered its numbers)</b>`:''}`;
 const same=new Set(S.map(x=>m.last[x])).size===1,chips=(allLive&&!errs.length)?'':Object.keys(MODS).map(mm=>`<span class="chip ${MODS[mm].every(k=>LIVE[k])?'on':''}">${MODNAME[mm]}: ${MODS[mm].every(k=>LIVE[k])?'live':'snapshot'}</span>`).join('');
 el.innerHTML=`<span class="dot2 ${c}"></span>${txt} ${btn}<br><span class="src">${thru}.${same?'':' Last entry: '+S.map(s=>s+' '+wl(m.last[s])).join(', ')+'.'}</span>${chips?`<div class="chips">${chips}</div>`:''}`;
 const rf=$('#rf');if(rf)rf.onclick=()=>{mcp&&(mcp.invalidate(GS,'get_values').catch(()=>{}),mcp.invalidate(GD,'get_file_metadata').catch(()=>{}))};
 const al=$('#al');if(al)al.onclick=()=>{const d=DEFS[0];mcp.callTool(d.srv,d.tool,d.input).then(()=>mcp.invalidate()).catch(()=>{})}}
function show(t,keep){current=t;const y=window.scrollY;uid=0;$('#main').innerHTML=T[t]();[...$('#nav').children].forEach(b=>b.setAttribute('aria-selected',b.dataset.t==t));try{history.replaceState(null,'','#'+t.replace(' ','').toLowerCase())}catch(e){}if(t==='All data')dtInit();if(t==='Orders')ordInit();if(t==='Ask')askInit();window.scrollTo(0,keep?y:0)}
function refresh(){let res;try{res=build()}catch(e){console.error(e);STS.parse={err:'parse'};const bk={...LIVE};Object.keys(LIVE).forEach(k=>delete LIVE[k]);res=build();Object.assign(LIVE,bk);}
 R=res;const sig=JSON.stringify(res)+Object.keys(LIVE).length;if(sig!==lastSig){lastSig=sig;show(current,true)}paintStatus()}
function onEv(d,ev){if(ev.type==='data'){const p=payloadOf(ev.result);let v=null;
  try{if(d.parseObj)v=d.parseObj(p);else{const rows=p&&p.values;if(rows&&rows.length){v=d.parse(rows);if(d.ok&&!d.ok(v))v=null;}else v=null}}catch(e){v=null}
  if(v==null){if(d.opt){delete LIVE[d.k];return refresh()}STS[d.k]={err:(p&&p.values&&p.values.length)?'parse':'empty'};return refresh()}
  LIVE[d.k]=v;STS[d.k]={at:(ev.result.cache&&ev.result.cache.storedAt)||Date.now()};if(d.k==='tips:summary')syncTabs()}
 else{const code=ev.error.code;if(d.opt&&!AUTHZ.has(code)){return}STS[d.k]={err:code,msg:ev.error.message};if(AUTHZ.has(code))delete LIVE[d.k]}
 refresh()}
$('#nav').innerHTML=tabs.map(t=>`<button role="tab" data-t="${t}">${t}</button>`).join('');
$('#nav').onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.t)};
current=tabs.find(t=>t.replace(' ','').toLowerCase()==location.hash.slice(1))||'Overview';
R=build();show(current);paintStatus();
(async()=>{let m=null;try{if(typeof claude!=='undefined')m=await claude.use('mcp')}catch(e){m=null}
 pending=false;if(!m){paintStatus();return}mcp=m;paintStatus();if(current==='All data')dtWatch();
 DEFS.forEach(d=>{try{mcp.watchTool(d.srv,d.tool,d.input,ev=>onEv(d,ev),{refetchInterval:d.every})}catch(e){if(!d.opt){STS[d.k]={err:'bad_request'};paintStatus()}}})})();
