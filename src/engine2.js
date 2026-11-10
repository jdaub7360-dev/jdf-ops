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
function computeStoreBurn(log){const by={};log.forEach(x=>{const k=x.item+'|'+x.store;(by[k]=by[k]||[]).push(x)});const res={};
 Object.keys(by).forEach(k=>{const m=new Map();by[k].forEach(x=>m.set(x.t,x));const a=[...m.values()].sort((p,q)=>p.t-q.t),cyc=[];let skipped=0;/* a later row for the same date replaces an earlier one */
  for(let i=1;i<a.length;i++){const p=a[i-1],c=a[i];if(c.recv==null){skipped++;continue}const days=(c.t-p.t)/864e5;if(days<=0)continue;if(days>28){skipped++;continue}const used=p.stock+c.recv-c.stock;if(used<0){skipped++;continue}cyc.push(used/days*7)}
  const use=cyc.slice(-3),burn=use.length?use.reduce((s,v)=>s+v,0)/use.length:null,[item,store]=k.split('|');
  (res[item]=res[item]||{})[store]={burn:burn==null?null:r2(burn),cycles:use.length,skipped,last:a[a.length-1].t}});return res}
if(typeof module!=='undefined')module.exports={parseEnhStoreLog,computeStoreBurn,parseSysco,syscoWeekly,parseTipsSummary,computeTips,parseTipsTab,tipSpikes,parseEnhTotals,parseEnhUsage,parseEnhOrder,computeEnh,parseGnc,qtyInfo,analysePar,parseCookieTotals,parseCookieOrders};
