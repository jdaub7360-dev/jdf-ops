// ---- Supply side engine: Sysco, tips, enhancers, GNC, PAR, cookies. Pure functions over sheet rows.
const COVER_WEEKS=3,MONTHS_=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dlab=t=>{const d=new Date(t);return MONTHS_[d.getUTCMonth()]+' '+d.getUTCDate()};
const isoDate=s=>{const m=String(s||'').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null};
const median=a=>{const b=[...a].sort((x,y)=>x-y),n=b.length;return n?(n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2):0};
// Sysco orders: three side by side blocks (date, order #, total)
function parseSysco(rows){const cols={Ashland:[0,2],Wadsworth:[3,5],Massillon:[6,8]},out={};
 STORES_.forEach(s=>{out[s]=[];rows.forEach(r=>{const t=isoDate(r[cols[s][0]]),v=num(r[cols[s][1]]);if(t!=null&&v!=null)out[s].push({t,total:v})})});return out}
function syscoWeekly(orders,weeks,weekly){const res={};
 STORES_.forEach(s=>{const wk=weeks.map(isoDate),last=Math.max(0,wk.length-13),rows=[];
  for(let i=last;i<wk.length;i++){const a=wk[i];let tot=0,n=0;
   orders[s].forEach(o=>{const key=new Date(o.t).getUTCDay()===0?o.t+864e5:o.t;let mon=key;while(new Date(mon).getUTCDay()!==1)mon-=864e5;if(mon===a){tot+=o.total;n++}});
   const sal=weekly[s][i];rows.push({week:weeks[i],orders:r2(tot),n,sales:sal,pct:sal?r2(100*tot/sal,1):null})}
  res[s]=rows});return res}
// Tips: Summary tab lists pay periods newest first, labels are m/d-m/d without a year
function parseTipsSummary(rows,Y){let yr=Y,prev=null;const out=[];
 rows.forEach(r=>{const m=String(r[0]??'').trim().match(/^(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})$/);if(!m)return;
  const m1=+m[1],d1=+m[2],m2=+m[3],d2=+m[4],k=m1*100+d1;if(prev!=null&&k>prev)yr--;prev=k;
  const ey=m2<m1?yr+1:yr;out.push({label:String(r[0]).trim(),start:Date.UTC(yr,m1-1,d1),end:Date.UTC(ey,m2-1,d2),tips:{Ashland:num(r[1]),Wadsworth:num(r[2]),Massillon:num(r[3])}})});return out}
function computeTips(periods,sumS,asOf){const closed=periods.filter(p=>p.end<=asOf&&p.tips.Ashland!=null).sort((a,b)=>b.start-a.start).slice(0,8).reverse(),out={};
 STORES_.forEach(s=>{out[s]=closed.map(p=>{const ly=periods.find(q=>Math.abs(q.start-(p.start-364*864e5))<=864e5),sal=sumS(s,p.start,p.end),t=p.tips[s],t25=ly?ly.tips[s]:null,f=x=>{const d=new Date(x);return(d.getUTCMonth()+1)+'/'+d.getUTCDate()};
  return{period:f(p.start)+' to '+f(p.end),start:p.start,end:p.end,tips:t,tips25:t25,sales:Math.round(sal),pct:sal?r2(100*t/sal,2):null,yoy:t25?r2((t/t25-1)*100,1):null}})});return out}
function computeTipsNow(periods,asOf,sumS,tab){const DAY=864e5,cur=periods.filter(p=>p.start<=asOf&&p.end>=asOf&&p.tips.Ashland!=null).sort((a,b)=>b.start-a.start)[0];if(!cur)return null;
 const prev=periods.find(q=>Math.abs(q.start-(cur.start-14*DAY))<=DAY),ly=periods.find(q=>Math.abs(q.start-(cur.start-364*DAY))<=DAY),last=Math.min(asOf,cur.end),elapsed=Math.floor((last-cur.start)/DAY)+1,out={};
 STORES_.forEach(s=>{const tips=cur.tips[s],ent=tab&&tab[s]&&tab[s].length?tab[s].filter(x=>x.t<=last):null,days=ent&&ent.length?ent.length:elapsed,
  sales=ent&&ent.length?ent.reduce((a,x)=>a+sumS(s,x.t,x.t),0):sumS(s,cur.start,last),pct=sales>0?100*tips/sales:null,
  pt=prev?prev.tips[s]:null,psal=prev?sumS(s,prev.start,prev.end):0,ppct=pt!=null&&psal>0?100*pt/psal:null,lt=ly?ly.tips[s]:null,proj=tips/days*14;
  out[s]={tips,days,perDay:tips/days,proj,pct,prevTotal:pt,prevPct:ppct,vsPrev:pt>0?(proj/pt-1)*100:null,pp:pct!=null&&ppct!=null?pct-ppct:null,lyTotal:lt,vsLy:lt>0?(proj/lt-1)*100:null}});
 const f=x=>{const d=new Date(x);return(d.getUTCMonth()+1)+'/'+d.getUTCDate()};
 return{label:f(cur.start)+' to '+f(cur.end),elapsed,total:14,stores:out}}
function parseTipsTab(rows){const out={Ashland:[],Wadsworth:[],Massillon:[]};
 rows.forEach(r=>{const m=String(r[0]??'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)return;const t=Date.UTC(+m[3],+m[1]-1,+m[2]);STORES_.forEach((s,i)=>{const v=num(r[i+1]);if(v!=null)out[s].push({t,tips:v})})});return out}
function tipSpikes(tabs){const spikes=[];STORES_.forEach(s=>{const all=[];tabs.forEach(tb=>tb[s].forEach(x=>all.push(x)));const md=median(all.map(x=>x.tips)),lim=Math.max(150,2.5*md);
 all.filter(x=>x.tips>lim).forEach(x=>spikes.push({store:s,date:iso(x.t),tips:x.tips,median:r2(md,0)}))});return spikes.sort((a,b)=>a.date<b.date?-1:1)}
// Enhancers
function parseEnhTotals(rows){const items=[];let info={};
 rows.forEach((r,i)=>{const a=String(r[0]??'').trim();if(i===0||!a)return;if(/^total order/i.test(a))return;
  if(/^last order received/i.test(a)){info.received=String(r[1]||'');return}if(/^last order:/i.test(a)){info.line=a;return}
  if(/^(order info|days since)/i.test(a))return;const stock=[num(r[1]),num(r[2]),num(r[3])];if(r[1]===undefined&&r[4]===undefined)return;
  items.push({item:a,a:stock[0]??0,w:stock[1]??0,m:stock[2]??0,stock:num(r[4])??(stock[0]||0)+(stock[1]||0)+(stock[2]||0),sheetOrder:num(r[6])||0,cost:num(r[7])??0,sheetDays:num(r[10])})});return{items,info}}
function parseEnhUsage(rows){const out=[];rows.forEach(r=>{const t=isoDate(r[0]);if(t==null||!r[1])return;const used=num(r[5]),cd=num(r[6]),pw=num(r[7]);out.push({t,item:String(r[1]).trim(),used,perWeek:pw!=null?pw:(used!=null&&cd?used/cd*7:null)})});return out}
function parseEnhOrder(rows){const o={};rows.forEach((r,i)=>{const a=String(r[0]??'').trim(),q=num(r[1]);if(i===0||!a||/^total/i.test(a))return;if(q!=null)o[a]=q});return o}
function computeEnh(tot,usage,order){let td=0,tm=0,ts=0,inv=0,tubsD=0,tubsM=0;
 const items=tot.items.map(e=>{const us=usage.filter(u=>u.item===e.item&&u.perWeek!=null).sort((a,b)=>b.t-a.t).slice(0,3),burn=us.length?us.reduce((p,c)=>p+c.perWeek,0)/us.length:null,cover=burn>0?e.stock/burn:null,
  need=burn!=null?Math.max(0,Math.ceil(burn*COVER_WEEKS-e.stock)):0,draft=order[e.item]||0;
  td+=draft*e.cost;tm+=need*e.cost;ts+=e.sheetOrder*e.cost;inv+=e.stock*e.cost;tubsD+=draft;tubsM+=need;
  return{item:e.item,a:e.a,w:e.w,m:e.m,stock:e.stock,cost:e.cost,burn:burn==null?null:r2(burn),cover:cover==null?null:r2(cover,1),draft,sheet:e.sheetOrder,model:need,value:r2(e.stock*e.cost),sheetDays:e.sheetDays,cycles:us.length,negUse:us.some(u=>u.used<0)}});
 return{items,draftCost:r2(td),modelCost:r2(tm),sheetCost:r2(ts),inventory:r2(inv),tubsDraft:tubsD,tubsModel:tubsM,tubsSheet:items.reduce((p,c)=>p+c.sheet,0),info:tot.info}}
function parseGnc(rows){const out=[];STORES_.forEach((s,i)=>{const c=i*5;rows.forEach(r=>{const t=isoDate(r[c]),u=num(r[c+2]),tot=num(r[c+3]);if(t!=null&&u>0&&tot>0)out.push({t,unit:r2(tot/u),store:s})})});
 const seen=new Set(),res=[];out.sort((a,b)=>a.t-b.t).forEach(x=>{const k=x.t+'|'+x.unit;if(!seen.has(k)){seen.add(k);res.push({t:x.t,date:dlab(x.t),unit:x.unit})}});return res}
// PAR sheets
function qtyInfo(q){const s=String(q??'').trim();if(!s)return null;const nums=[...s.matchAll(/(\d+)\s*\/\s*(\d+)|(\d*\.?\d+)/g)].map(m=>m[1]?(+m[1])/(+m[2]):parseFloat(m[3]));return{raw:s,nums,need:/need/i.test(s)}}
function parCountDate(rows){let t=null;(rows||[]).slice(0,6).forEach(r=>(r||[]).forEach(c=>{const s=String(c??''),m=s.match(/last counted\D{0,4}(\d{4})-(\d{2})-(\d{2})/i),u=s.match(/last counted\D{0,4}(\d{1,2})\/(\d{1,2})\/(\d{4})/i);if(m)t=Date.UTC(+m[1],+m[2]-1,+m[3]);else if(u)t=Date.UTC(+u[3],+u[1]-1,+u[2])}));return t}
function analysePar(rows,modifiedIso,nowT){let counted=0,total=0,sec='';const out=[],low=[],items=[];const countDate=parCountDate(rows);
 rows.forEach(r=>{const name=String(r[0]??'').trim();if(!name||/^(item|pulp .*par sheet|store team|last counted)/i.test(name))return;const q=qtyInfo(r[1]);
  if(r.length<2){sec=name;return}total++;if(!q)return;counted++;
  const disp=q.raw.replace(/^0\./,'.').replace(/\.$/,'');
  const zero=q.nums.length===1&&q.nums[0]===0,lw=q.need||(q.nums.length===1&&q.nums[0]<=0.3);items.push({name,sec,raw:q.raw,st:zero?'out':q.need?'need':lw?'low':'ok'});
  if(zero)out.push(name);else if(lw)low.push(name+' ('+(q.need?q.raw.toLowerCase():disp)+')')});
 const modT=modifiedIso?Date.parse(modifiedIso):null,editAge=modT?Math.floor((nowT-modT)/864e5):null,age=countDate!=null?Math.floor((nowT-countDate)/864e5):editAge;
 return{counted,out,low,items,modified:modifiedIso||null,countDate,editAge,ageDays:age}}
// Cookies
function parseCookieTotals(rows){const items=[];rows.forEach((r,i)=>{const a=String(r[0]??'').trim();if(i===0||!a||/^(total order|order info|last order|days since)/i.test(a))return;const st=[num(r[1]),num(r[2]),num(r[3])];if(st.every(x=>x==null)&&num(r[4])==null)return;items.push({name:a,stock:{Ashland:st[0],Wadsworth:st[1],Massillon:st[2]},total:num(r[4])})});return items}
function parseCookieOrders(rows){const res={};STORES_.forEach((s,i)=>{const c=i*5;const xs=[];rows.forEach(r=>{const t=isoDate(r[c]),n=num(r[c+2]),tot=num(r[c+3]);if(t!=null&&n>0)xs.push({t,cookies:n,total:tot})});xs.sort((a,b)=>b.t-a.t);res[s]=xs[0]||null});return res}
// Per store enhancer log (new tab written by the agent each count)
function parseEnhStoreLog(rows){const out=[];(rows||[]).forEach(r=>{const t=isoDate(r[0]),st=String(r[1]??'').trim(),item=String(r[2]??'').trim(),stock=num(r[3]);if(t==null||!st||!item||stock==null)return;out.push({t,store:st,item,stock,recv:r[4]===undefined||String(r[4]).trim()===''?null:num(r[4])})});return out}
// Per store burn from the Enhancer Store Log. Optional sales(store,fromT,toT) returns Daily Log net sales for the days after fromT up to and including toT
// (count date to count date), or null when any of those days has no sales entered. It adds usage intensity over the exact same clean cycles.
function computeStoreBurn(log,sales){const by={};log.forEach(x=>{const k=x.item+'|'+x.store;(by[k]=by[k]||[]).push(x)});const res={};
 Object.keys(by).forEach(k=>{const m=new Map();by[k].forEach(x=>m.set(x.t,x));const a=[...m.values()].sort((p,q)=>p.t-q.t),cyc=[];let skipped=0;/* a later row for the same date replaces an earlier one */
  for(let i=1;i<a.length;i++){const p=a[i-1],c=a[i];if(c.recv==null){skipped++;continue}const days=(c.t-p.t)/864e5;if(days<=0)continue;if(days>28){skipped++;continue}const used=p.stock+c.recv-c.stock;if(used<0){skipped++;continue}cyc.push({rate:used/days*7,used:used,from:p.t,to:c.t})}
  const use=cyc.slice(-3),burn=use.length?use.reduce((s,v)=>s+v.rate,0)/use.length:null,[item,store]=k.split('|'),o={burn:burn==null?null:r2(burn),cycles:use.length,skipped,last:a[a.length-1].t};
  // intensity: tubs used over the same clean cycles divided by net sales over the same dates, per $1,000. Pooled across the cycles. Never estimated: any missing sales day means no intensity.
  o.inten=null;o.used=null;o.sales=null;o.from=use.length?use[0].from:null;o.to=use.length?use[use.length-1].to:null;
  if(use.length&&typeof sales==='function'){let u=0,sv=0,ok=true;use.forEach(c=>{const v=sales(store,c.from,c.to);if(v==null||!(v>=0))ok=false;else{u+=c.used;sv+=v}});
   if(ok&&sv>0){o.used=r2(u);o.sales=Math.round(sv*100)/100;o.inten=Math.round(u/sv*1000*1000)/1000}}
  (res[item]=res[item]||{})[store]=o});return res}
// Daily Log net sales for a store over (fromT, toT]. Grids are parseGrid output, year is the year the day by month grid holds.
function salesLookup(grids,year){return(store,fromT,toT)=>{const g=grids&&grids[store];if(!g||!g.days)return null;let t=fromT+864e5,sum=0;if(!(toT>fromT))return null;
 while(t<=toT){const d=new Date(t);if(d.getUTCFullYear()!==year)return null;const row=g.days[d.getUTCDate()],v=row?row[d.getUTCMonth()]:null;if(v==null)return null;sum+=v;t+=864e5}return sum}}
// Company intensity per item (total use over total sales across the stores that have clean cycles) and the worth a look flag:
// a store is flagged when its intensity is at least 1.5 times the lowest store on the same item. Counts are in quarter tubs, so only stores that used at least 1 tub over their cycles are compared,
// which keeps a single quarter tub of count rounding from reading as a difference. Needs two such stores and a lowest above zero.
function enhIntensity(burn){const out={};Object.keys(burn||{}).forEach(item=>{const st=burn[item],have=Object.keys(st).filter(s=>st[s].inten!=null);if(!have.length)return;
 const u=have.reduce((p,s)=>p+st[s].used,0),sv=have.reduce((p,s)=>p+st[s].sales,0),low=Math.min.apply(null,have.map(s=>st[s].inten)),flags={};
 const el=have.filter(s=>st[s].used>=1),elow=el.length?Math.min.apply(null,el.map(s=>st[s].inten)):0;
 if(el.length>=2&&elow>0)el.forEach(s=>{const r=st[s].inten/elow;if(r>=1.5)flags[s]=Math.round(r*100)/100});
 out[item]={co:sv>0?Math.round(u/sv*1000*1000)/1000:null,used:Math.round(u*100)/100,sales:Math.round(sv*100)/100,stores:have,low:elow,flags:flags}});return out}

// Hourly sales (Sysco and Daily Numbers workbook, tab Hourly Sales: Date, Store, Hour, Net Sales, Checks).
// Only hours with activity have rows, so a missing hour is zero. Checks are real for Massillon only, never read a blank as zero.
// Ashland and Wadsworth hourly money is item level (POS Sales Mix) and does not tie to the Daily Log, so it is for shape and share only.
const HOURLY_CHECK_STORES={Massillon:1};
// Roster: one row per employee. Raise age is whole calendar months from Last Pay Raise Date to today (Hire Date when no raise is recorded).
// Yellow at 6 months, red at 12. Dates are yyyy-mm-dd, m/d/yyyy also read. Base Hourly Rate is read for display only and Shirt Size is parsed from Notes ("Shirt Size - Large").
function rdate(v){const t=String(v==null?'':v).trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);if(m)return{y:+m[1],m:+m[2],d:+m[3]};m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);return m?{y:+m[3],m:+m[1],d:+m[2]}:null}
function rmonths(a,t){let n=(t.y-a.y)*12+(t.m-a.m);if(t.d<a.d)n--;return n}
function computeRoster(rows,today){const out={stores:{Ashland:[],Wadsworth:[],Massillon:[]},total:0,yellow:0,red:0,unknown:0};if(!rows||!rows.length)return out;
 const h=(rows[0]||[]).map(x=>String(x==null?'':x).trim().toLowerCase()),ix=n=>h.indexOf(n),iS=ix('store'),iF=ix('first name'),iL=ix('last name'),iH=ix('hire date'),iR=ix('last pay raise date'),iZ=ix('seasonal'),iK=ix('key'),iP=ix('base hourly rate'),iN=ix('notes');
 if(iS<0||iF<0)return out;const t=rdate(today);
 rows.slice(1).forEach(r=>{const st=String(r[iS]||'').trim(),a=out.stores[st];if(!a)return;const name=(String(r[iF]||'').trim()+' '+String(r[iL]==null?'':r[iL]).trim()).trim();if(!name)return;
  const rr=iR>=0?rdate(r[iR]):null,hh=iH>=0?rdate(r[iH]):null,base=rr||hh,months=base&&t?rmonths(base,t):null,
   level=months==null?null:months>=12?'red':months>=6?'yellow':'ok',rt=iP>=0?parseFloat(String(r[iP]==null?'':r[iP]).replace(/[$,\s]/g,'')):NaN,sm=iN>=0?/shirt\s*size\s*[-:]?\s*([A-Za-z0-9 ]+)/i.exec(String(r[iN]||'')):null;
  a.push({name,store:st,tenure:hh&&t?rmonths(hh,t):null,raise:rr?(r[iR]+'').trim():null,hire:hh?(r[iH]+'').trim():null,since:rr?'raise':hh?'hire':null,months,level,seasonal:iZ>=0&&String(r[iZ]||'').trim()!=='',key:iK>=0&&String(r[iK]||'').trim()!=='',rate:isFinite(rt)?rt:null,shirt:sm?sm[1].trim():null});
  out.total++;if(level==='red')out.red++;else if(level==='yellow')out.yellow++;else if(level==null)out.unknown++});
 Object.keys(out.stores).forEach(k=>out.stores[k].sort((a,b)=>(b.months==null?-1:b.months)-(a.months==null?-1:a.months)||a.name.localeCompare(b.name)));return out}
function parseHourly(rows){const out={Ashland:{},Wadsworth:{},Massillon:{}};
 (rows||[]).forEach(r=>{if(!r)return;const d=String(r[0]==null?'':r[0]).trim(),st=String(r[1]==null?'':r[1]).trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!out[st])return;
  const hs=String(r[2]==null?'':r[2]).trim(),h=hs===''?NaN:Number(hs);if(!Number.isInteger(h)||h<0||h>23)return;
  const sales=num(r[3]);if(sales==null)return;
  const c=r[4]==null||String(r[4]).trim()===''?null:num(r[4]);
  (out[st][d]=out[st][d]||{})[h]={s:sales,c:c}});
 return out}
function computeHourly(P){const res={};
 Object.keys(P||{}).forEach(st=>{const days=P[st]||{},ds=Object.keys(days).sort();
  if(!ds.length){res[st]={lo:null,hi:null,days:[],dow:[]};return}
  let lo=24,hi=-1;ds.forEach(d=>Object.keys(days[d]).forEach(k=>{const h=+k;if(h<lo)lo=h;if(h>hi)hi=h}));
  const n=hi-lo+1,sum=a=>a.reduce((p,c)=>p+c,0);
  const list=ds.map(d=>{const sales=Array(n).fill(0),checks=Array(n).fill(0);let chk=!!HOURLY_CHECK_STORES[st];
   Object.keys(days[d]).forEach(k=>{const x=days[d][k],i=+k-lo;sales[i]=x.s;if(x.c==null)chk=false;else checks[i]=x.c});
   const tot=sum(sales);let pk=0;sales.forEach((v,i)=>{if(v>sales[pk])pk=i});
   return{d:d,wd:new Date(d+'T12:00:00Z').getUTCDay(),sales:sales,checks:chk?checks:null,tot:tot,peak:pk}});
  const dow=[0,1,2,3,4,5,6].map(w=>{const xs=list.filter(x=>x.wd===w);if(!xs.length)return{wd:w,n:0,avg:[],tot:0,peak:null,share:null};
   const avg=Array(n).fill(0).map((_,i)=>sum(xs.map(x=>x.sales[i]))/xs.length),t=sum(avg);let pk=0;avg.forEach((v,i)=>{if(v>avg[pk])pk=i});
   return{wd:w,n:xs.length,avg:avg,tot:t,peak:pk,share:t>0?avg[pk]/t:null}});
  res[st]={lo:lo,hi:hi,days:list,dow:dow}});
 return res}

// Burn Rate tabs (Enhancer and Cookie workbooks), maintained by Pacer from the store counts. Updates on the count cycle, not real time.
// Columns: Store, Item, Last Count, Stock On Hand, Used Last Interval, Burn per week, Company Burn per week, Weeks of Cover, Projected Run-Out, Notes.
// A blank burn, cover or run out is never computable yet and never zero. Stock On Hand of 0 is a real zero.
function parseBurn(rows){const items=[],ds=v=>{const t=String(v==null?'':v).trim();return /^\d{4}-\d{2}-\d{2}$/.test(t)?t:null},nz=v=>{const t=String(v==null?'':v).trim();return t===''?null:num(t)};
 (rows||[]).forEach((r,i)=>{if(!r)return;const st=String(r[0]==null?'':r[0]).trim(),it=String(r[1]==null?'':r[1]).trim();if(!st||!it||(i===0&&/^store$/i.test(st)))return;
  items.push({store:st,item:it,count:ds(r[2]),stock:nz(r[3]),used:nz(r[4]),burn:nz(r[5]),co:nz(r[6]),cover:nz(r[7]),runout:ds(r[8]),note:String(r[9]==null?'':r[9]).trim()})});
 return items}
function computeBurn(enh,cookie){const ST=['Ashland','Wadsworth','Massillon'],kinds={enh:enh||[],cookie:cookie||[]},out={kinds:{},attention:[],pending:0,nocount:0},rank={out:0,under2:1,ok:1,pending:2,nocount:3};
 Object.keys(kinds).forEach(k=>{const by={};ST.forEach(s=>by[s]=[]);kinds[k].forEach((x,i)=>{if(by[x.store])by[x.store].push(Object.assign({ord:i},x))});const o={};
  ST.forEach(s=>{const rows=by[s].map(r=>Object.assign({},r,{st:r.stock===0?'out':r.stock==null?'nocount':r.cover!=null?(r.cover<2?'under2':'ok'):'pending'}));
   rows.sort((a,b)=>rank[a.st]-rank[b.st]||((a.st==='under2'||a.st==='ok')?a.cover-b.cover:0)||a.ord-b.ord);
   const dates=rows.map(r=>r.count).filter(Boolean).sort();o[s]={rows:rows,first:dates.length?dates[0]:null,last:dates.length?dates[dates.length-1]:null};
   rows.forEach(r=>{if(r.st==='out'||r.st==='under2')out.attention.push({kind:k,store:s,item:r.item,st:r.st,cover:r.cover,runout:r.runout,count:r.count,co:r.co});if(r.st==='pending')out.pending++;if(r.st==='nocount')out.nocount++})});
  out.kinds[k]=o});
 out.attention.sort((a,b)=>(a.st==='out'?0:1)-(b.st==='out'?0:1)||(a.cover==null?99:a.cover)-(b.cover==null?99:b.cover));
 return out}
if(typeof module!=='undefined')module.exports={computeRoster,salesLookup,enhIntensity,parseBurn,computeBurn,parseHourly,computeHourly,parseEnhStoreLog,computeStoreBurn,parseSysco,syscoWeekly,parseTipsSummary,computeTips,parseTipsTab,tipSpikes,parseEnhTotals,parseEnhUsage,parseEnhOrder,computeEnh,parseGnc,qtyInfo,analysePar,parseCookieTotals,parseCookieOrders};
