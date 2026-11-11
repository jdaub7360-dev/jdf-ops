const DT={fit:true,color:true,src:'',q:'',sort:null,raw:{},unsub:null,key:'',at:{}};
const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const DESC={'Daily sales':'Net sales by day, one column per month. Rows below the days hold the monthly totals.','Daily labor':'Labor percent by day, one column per month, as entered in the sheet.','Sysco':'Every Sysco order logged by store, with dates and amounts.','Tips':'Tip counts. Summary lists each 14 day pay period, the period tabs list each day.','Enhancers':'Enhancer inventory, weekly usage and order drafts. Totals is current stock, Usage is the weekly counts.','PAR counts':'The live on hand counts the stores enter. The sheet has no PAR levels.','Cookies':'Cookie stock by store and the order history.'};
const ICON={};
const reRe=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const isNumV=v=>/^[\s$%(),.\-+0-9]+$/.test(String(v))&&/[0-9]/.test(String(v));
const nz=v=>String(v==null?'':v).trim()!=='';
function dtModel(rows){let w0=0;rows.forEach(r=>w0=Math.max(w0,r.length));let hi=-1;
 for(let i=0;i<Math.min(8,rows.length);i++){const ne=rows[i].filter(nz);if(ne.length>=3&&ne.every(c=>!isNumV(c))){hi=i;break}}
 const titles=[],body=[];rows.forEach((r,i)=>{if(!r.some(nz))return;if(i<hi||(hi<0&&false)){titles.push({i,t:r.filter(nz).join('  ·  ')});return}if(i===hi)return;body.push({r,i})});
 const labels=Array.from({length:w0},(_,c)=>hi>=0&&nz(rows[hi][c])?String(rows[hi][c]):hi>=0&&c===0?'Day':String.fromCharCode(65+c%26));return {w0,hi,titles,body,labels}}
function dtSources(){const L=[];
 S.forEach(s=>L.push({g:'Daily sales',n:s,id:FID.sales,range:`${s}!A1:N60`,fx:()=>fx.sales[s]}));
 L.push({g:'Daily sales',n:'Total Company',id:FID.sales,range:"'Total Company'!A1:K40",fx:()=>fx.sales['Total Company']});
 S.forEach(s=>L.push({g:'Daily labor',n:s,id:FID.labor,range:`${s}!A1:N60`,fx:()=>fx.labor[s]}));
 L.push({g:'Sysco',n:'Sysco orders',id:FID.sysco,range:"'Sysco Orders'!A1:I600",fx:()=>fx.sysco});
 L.push({g:'Tips',n:'Summary',id:FID.tips,range:'Summary!A1:E400',fx:()=>fx.tips.summary});
 const per=LIVE['tips:summary'],labs=per?per.slice(0,4).map(p=>p.label):Object.keys(fx.tips.tabs);
 labs.forEach(l=>L.push({g:'Tips',n:l,id:FID.tips,range:`'${l}'!A1:D40`,fx:()=>fx.tips.tabs[l]}));
 [['Totals','A1:K40','totals'],['Usage','A1:H600','usage'],['Order','A1:B40','order'],['GNC Whey Orders','A1:O80','gnc']].forEach(([t,r,k])=>L.push({g:'Enhancers',n:t,id:FID.enh,range:`'${t}'!${r}`,fx:()=>fx.enh[k]}));
 S.forEach(s=>L.push({g:'PAR counts',n:s,id:FID.par[s],range:"'PAR Sheet'!A1:B200",fx:()=>fx.par[s]}));
 [['Totals','A1:I30','totals'],['Cookie Orders','A1:O60','orders']].forEach(([t,r,k])=>L.push({g:'Cookies',n:t,id:FID.cookie,range:`'${t}'!${r}`,fx:()=>fx.cookie[k]}));
 return L}
const dtCur=()=>{const L=dtSources();let x=L.find(y=>y.g+'|'+y.n===DT.src);if(!x){x=L[0];DT.src=x.g+'|'+x.n}return {L,x}};
T['All data']=()=>{const {L,x}=dtCur(),gs=[...new Set(L.map(y=>y.g))];
 const GC={'Daily sales':'--A','Daily labor':'--M','Sysco':'--W','Tips':'--g','Enhancers':'--info','PAR counts':'--crit','Cookies':'--warn'},SC={Ashland:'--A',Wadsworth:'--W',Massillon:'--M'};
 const chip=(a,t,on,d,cv)=>`<button class="dtc ${on?'on':''}" ${d}>${cv?`<span class="dd" style="background:var(${cv})"></span>`:''}${esc(t)}</button>`;
 return `<style>.dtc{font:inherit;font-size:13px;border:1px solid var(--line);background:transparent;color:inherit;border-radius:999px;padding:4px 11px;cursor:pointer;white-space:nowrap}.dtc.on{background:var(--ink,#222);color:var(--bg,#fff);border-color:transparent;font-weight:600}.dtrow{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}#dtw table{border-collapse:separate;border-spacing:0}#dtw th,#dtw td{padding:7px 10px;border-bottom:1px solid var(--line)}#dtw tbody tr:hover td{background:rgba(127,127,127,.09)}#dtw td.fc,#dtw th.fc{position:sticky;left:0;background:var(--card,var(--bg));z-index:1}#dtw th{position:sticky;top:0;background:var(--card,var(--bg));z-index:2;font-weight:600;text-align:right;cursor:pointer}#dtw th.fc{z-index:3;text-align:left}#dtw mark{background:#f5c84255;color:inherit;border-radius:3px}#dtw .neg{color:var(--crit);font-weight:600}#dtw .zero{color:var(--mut)}.dd{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}#dtw tbody tr:nth-child(even) td{background-image:linear-gradient(rgba(127,127,127,.045),rgba(127,127,127,.045))}#dtw tr.tot td{font-weight:700;border-top:2px solid var(--line)}#dtw td.zh{background:color-mix(in srgb,var(--crit) 16%,transparent);color:var(--crit);font-weight:600}#dtw td.lh{background:color-mix(in srgb,var(--warn) 16%,transparent);color:var(--warn);font-weight:600}#dtw th{border-bottom:2px solid var(--line)}#dtw tr.hd td{background:color-mix(in srgb,var(--info) 9%,transparent)}#dtw.fit{overflow-x:hidden!important;max-height:none!important}#dtw.fit table{table-layout:fixed;width:100%;min-width:0!important}#dtw.fit th,#dtw.fit td{padding:6px 1px;font-size:clamp(7.5px,1.95vw,13px);text-align:right!important;overflow:hidden;text-overflow:clip;white-space:nowrap}#dtw.fit th.fc,#dtw.fit td.fc{text-align:left!important;width:11%;padding-left:5px;white-space:normal;overflow:visible;line-height:1.15}#dtw.fit th:last-child{width:11%}#dtw.fit td{letter-spacing:-.25px}#dtw.fit td:last-child,#dtw.fit th:last-child{overflow:visible;font-weight:650}#dtw.vl th,#dtw.vl td{border-left:1px solid var(--line)}#dtw.vl th:first-child,#dtw.vl td:first-child{border-left:0}#dtw.vl th:nth-child(3n+1):not(:first-child),#dtw.vl td:nth-child(3n+1):not(:first-child){border-left:2px solid var(--mut)}.dtl{display:flex;gap:10px;align-items:center;font-size:12px;color:var(--mut);margin:0 0 8px;flex-wrap:wrap}.dtl i{display:inline-block;width:70px;height:8px;border-radius:4px}</style>
 <h2>All data</h2><p class="sub">Every row from the source sheets. Pick a source, search, tap a column to sort.</p>
 <div class="dtrow" id="dtg">${gs.map(g=>chip('g',g,g===x.g,`data-g="${esc(g)}"`,GC[g])).join('')}</div>
 <div class="dtrow" id="dtt">${L.filter(y=>y.g===x.g).map(y=>chip('t',y.n,y.n===x.n,`data-s="${esc(y.g+'|'+y.n)}"`,SC[y.n])).join('')}</div>
 <div class="card"><p class="sub" style="margin:0 0 8px">${esc(DESC[x.g]||'')}</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><input id="dtq" type="search" placeholder="Search this sheet" value="${esc(DT.q)}" style="flex:1;min-width:150px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:inherit;font:inherit"><button class="dtc ${DT.color?'on':''}" id="dtcol">Colors</button>${x.g==='Daily sales'?`<button class="dtc ${DT.fit?'on':''}" id="dtfit">Fit to screen</button>`:''}<button class="dtc" id="dtcsv" hidden>Download CSV</button></div><div class="dtl" id="dtleg"></div>
 <div id="dtt0"></div><div class="tw" style="max-height:68vh;overflow:auto" id="dtw"></div><p class="sub" id="dtn" style="margin:8px 0 0"></p></div>`};
function dtRows(){const {x}=dtCur();const live=DT.raw[x.id+x.range];return {x,rows:live||x.fx()||[],live:!!live}}
const HEATRGB={'Daily sales':'--A','Daily labor':'--M'};
const ZEROHL=x=>x.g==='PAR counts'||(x.g==='Cookies'&&x.n==='Totals')||(x.g==='Enhancers'&&x.n==='Totals');
function dtCell(v,c,q,ex,disp){const t=String(v==null?'':v);let h=dtHl(disp!=null?disp:t,q);const num=c>0&&isNumV(t),tt=t.trim();let cls=c===0?'fc':'',st='white-space:nowrap;text-align:'+(num?'right':'left');
 const nv=num?parseFloat(tt.replace(/[$,%()]/g,'')):null;
 if(num&&/^\(.*\)$|^-\s*\$?[0-9]|^\$-/.test(tt))cls+=' neg';
 else if(ex.color&&num&&ex.hz&&nv===0)cls+=' zh';
 else if(ex.color&&ex.hz&&c>0&&ex.lowRe&&ex.lowRe.test(tt))cls+=' lh';
 else if(ex.color&&ex.hz&&c>0&&nv!=null&&nv>0&&nv<=0.3)cls+=' lh';
 else if(num&&nv===0)cls+=' zero';
 if(ex.color&&ex.heat&&num&&nv!=null&&!ex.totRow&&ex.hi>ex.lo){const k=Math.max(0,Math.min(1,(nv-ex.lo)/(ex.hi-ex.lo)));st+=`;background-color:color-mix(in srgb,var(${ex.heat}) ${Math.round(8+62*k)}%,transparent)`}
 return `<td class="${cls}" style="${st}"${disp!=null?` title="${esc(t)}"`:''}>${h}</td>`}
const DTMONEY=/sales|total|cost|amount|price|spend|revenue|\$/i,DTNOT=/stock|tubs|to order|count|days|used|burn|cookies|qty|quantity|week|%/i;
let DTHL=null;
function dtMoney(v,c,M,x){if(c===0||v===''||v==null)return v;const s=String(v).trim();if(!/^-?\d[\d,]*(\.\d+)?$/.test(s))return v;const lab=String((DTHL&&DTHL[c])||M.labels[c]||'');if(!(x.g==='Daily sales'||(DTMONEY.test(lab)&&!DTNOT.test(lab))))return v;const n=parseFloat(s.replace(/,/g,''));return (n<0?'-$':'$')+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
// Fit to screen shortens daily sales so every column shows without sideways scrolling: whole dollars, and thousands on a phone. The exact value stays in the cell title.
function dtFit(v,c,x){if(!DT.fit||x.g!=='Daily sales'||c===0)return null;const s=String(v==null?'':v).trim();
 if(/^-?\d+(\.\d+)?%$/.test(s))return parseFloat(s).toFixed(1)+'%';
 if(!/^\(?-?\$?-?\d[\d,]*(\.\d+)?\)?$/.test(s))return null;
 let n=parseFloat(s.replace(/[$,()]/g,''));if(/^\(|-/.test(s))n=-Math.abs(n);const a=Math.abs(n),narrow=window.innerWidth<640;
 const o=a>=1e6?'$'+(a/1e6).toFixed(2)+'M':narrow&&a>=1000?'$'+(a/1000).toFixed(a>=10000?0:1)+'k':'$'+Math.round(a).toLocaleString('en-US');return (n<0?'-':'')+o}
const dtLab=(l,x)=>DT.fit&&x.g==='Daily sales'?String(l).replace(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*$/i,'$1'):l;
function dtPaint(){DTHL=null;const w=$('#dtw');if(!w)return;const {x,rows,live}=dtRows(),M=dtModel(rows),q=DT.q.trim();let body=M.body;
 if(q){const ql=q.toLowerCase();body=body.filter(o=>o.r.some(c=>String(c).toLowerCase().includes(ql)))}
 if(DT.sort!=null){const c=DT.sort.c,d=DT.sort.d,nv=v=>{const n=parseFloat(String(v).replace(/[$,%()]/g,''));return isNaN(n)?null:n};body=body.filter(o=>nz(o.r[0])||o.r.slice(1).some(nz)).slice().sort((a,b)=>{const p=a.r[c]??'',z=b.r[c]??'',np=nv(p),nq=nv(z);if(!nz(p))return 1;if(!nz(z))return -1;return d*(np!=null&&nq!=null?np-nq:String(p).localeCompare(String(z)))})}
 const ex={color:DT.color,heat:HEATRGB[x.g],hz:ZEROHL(x),lowRe:/^need/i,lo:0,hi:0};
 if(ex.heat){const vs=[];body.forEach(o=>{if(/total/i.test(String(o.r[0]||'')))return;o.r.forEach((c,i)=>{if(i>0&&isNumV(c)){const n=parseFloat(String(c).replace(/[$,%()]/g,''));if(!isNaN(n)&&n>0)vs.push(n)}})});vs.sort((a,b)=>a-b);if(vs.length>4){ex.lo=vs[Math.floor(vs.length*.05)];ex.hi=vs[Math.floor(vs.length*.95)]}}
 const section=o=>{const ne=o.r.filter(nz);return ne.length===1&&nz(o.r[0])&&!isNumV(o.r[0])&&String(o.r[0]).length>3};
 const fitOn=DT.fit&&x.g==='Daily sales',cols=Array.from({length:M.w0},(_,c)=>c).filter(c=>c===0||!fitOn||body.some(o=>nz(o.r[c])));
 const tbl=`<table style="min-width:100%"><thead><tr>${cols.map(c=>{const l=M.labels[c];return `<th class="${c===0?'fc':''}" data-c="${c}">${esc(dtLab(l,x))}${DT.sort&&DT.sort.c===c?(DT.sort.d>0?' ▲':' ▼'):''}</th>`}).join('')}</tr></thead><tbody>${body.slice(0,800).map(o=>{if(section(o)&&DT.sort==null)return `<tr><td class="fc" colspan="${cols.length}" style="font-weight:600;background:color-mix(in srgb,var(--info) 11%,transparent);position:static;white-space:normal;min-width:0">${dtHl(o.r[0],q)}</td></tr>`;const nn=o.r.filter(nz);const hdr=nn.length>1&&nn.every(c=>!isNumV(c));if(hdr)DTHL=o.r;const totRow=/^total/i.test(String(o.r[0]||'').trim());return `<tr class="${hdr?'hd':''} ${totRow?'tot':''}">${cols.map(c=>{const v=o.r[c]??'';if(hdr)return `<td class="${c===0?'fc':''}" style="white-space:nowrap;font-weight:600;color:var(--ink2);text-align:${c===0?'left':'right'}">${dtHl(v,q)}</td>`;return dtCell(dtMoney(v,c,M,x),c,q,{...ex,totRow},dtFit(v,c,x))}).join('')}</tr>`}).join('')}</tbody></table>`;
 const lg=$('#dtleg');if(lg)lg.innerHTML=!DT.color?'':(ex.heat?`<span>${x.g==='Daily labor'?'Lower labor %':'Lower sales'}</span><i style="background:linear-gradient(90deg,color-mix(in srgb,var(${ex.heat}) 6%,transparent),color-mix(in srgb,var(${ex.heat}) 70%,transparent))"></i><span>${x.g==='Daily labor'?'Higher labor %':'Higher sales'}</span>`:'')+(ex.hz?'<span style="color:var(--crit)">■ zero</span><span style="color:var(--warn)">■ low or needed</span>':'')+'<span style="color:var(--crit)">■ negative</span>';
 $('#dtt0').innerHTML=M.titles.length?`<p style="margin:0 0 8px;font-weight:600">${M.titles.map(t=>esc(t.t)).join(' · ')}</p>`:'';
 w.className='tw'+(DT.fit&&x.g==='Daily sales'?' fit':'')+(x.g==='Sysco'?' vl':'');w.innerHTML=tbl;
 const blanks=body.reduce((a,o)=>a+Array.from({length:M.w0},(_,c)=>nz(o.r[c])?0:1).reduce((p,z)=>p+z,0),0);
 $('#dtn').textContent=`${body.length} row${body.length==1?'':'s'}${q?` matching "${q}"`:''}${body.length>800?', first 800 shown':''} · ${M.w0} columns · ${live?'live, read '+tm(DT.at[x.id+x.range]||Date.now()):'Nov 9 snapshot'}`;
 w.querySelectorAll('th[data-c]').forEach(th=>th.onclick=()=>{const c=+th.dataset.c;DT.sort=DT.sort&&DT.sort.c===c?{c,d:-DT.sort.d}:{c,d:1};dtPaint()})}
const dtHl=(v,q)=>{let h=esc(v);return q?h.replace(new RegExp(reRe(esc(q)),'gi'),m=>`<mark>${m}</mark>`):h};
async function dtCsv(){const {x,rows}=dtRows(),q=a=>/[",\n]/.test(a)?'"'+a.replace(/"/g,'""')+'"':a;const t=rows.filter(r=>r.some(nz)).map(r=>r.map(c=>q(String(c??''))).join(',')).join('\n');
 try{const d=await claude.use('downloads');if(d&&d.save)await d.save({filename:(x.g+' '+x.n).replace(/[^\w]+/g,'_')+'.csv',data:t})}catch(e){}}
function dtWatch(){const {x}=dtCur(),key=x.id+x.range;if(DT.key===key)return;if(DT.unsub){try{DT.unsub()}catch(e){}DT.unsub=null}if(!mcp)return;DT.key=key;
 try{DT.unsub=mcp.watchTool(GS,'get_values',{spreadsheetId:x.id,range:x.range},ev=>{if(ev.type==='data'){const p=payloadOf(ev.result);if(p&&p.values){DT.raw[key]=p.values;DT.at[key]=Date.now();if(current==='All data'&&DT.key===key)dtPaint()}}},{refetchInterval:60000})}catch(e){}}
function dtInit(){const g=$('#dtg');if(!g)return;document.querySelectorAll('.dtrow .on').forEach(e=>{try{e.scrollIntoView({inline:'center',block:'nearest'})}catch(_){}});DT.at=DT.at||{};dtWatch();dtPaint();
 g.onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;const L=dtSources().filter(y=>y.g===b.dataset.g);DT.src=L[0].g+'|'+L[0].n;DT.sort=null;DT.q='';show('All data',true)};
 $('#dtt').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;DT.src=b.dataset.s;DT.sort=null;show('All data',true)};
 $('#dtq').oninput=e=>{DT.q=e.target.value;dtPaint()};$('#dtcol').onclick=()=>{DT.color=!DT.color;$('#dtcol').classList.toggle('on',DT.color);dtPaint()};const ft=$('#dtfit');if(ft)ft.onclick=()=>{DT.fit=!DT.fit;ft.classList.toggle('on',DT.fit);dtPaint()};const cb=$('#dtcsv');cb.onclick=dtCsv;(async()=>{try{if(typeof claude!=='undefined'&&await claude.use('downloads'))cb.hidden=false}catch(e){}})()}
