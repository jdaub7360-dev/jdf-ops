// Staffing tab: how long since each person's last raise, with their hourly rate. Yellow at 6 months, red at 12.
// Shirt sizes come from the Notes column. Display only, nothing here feeds labor or any calculation.
// The Needs attention block is a native details element so it collapses with no script. Its open state is kept in ST and remembered per browser.
const SZO=['xs','extra small','small','s','medium','m','large','l','xl','extra large','2xl','xxl','3xl'],szk=z=>{const i=SZO.indexOf(String(z).toLowerCase());return i<0?99:i};
const ST={f:null};
document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-stf]');if(!b)return;const f=b.dataset.stf;ST.f=ST.f===f?null:f;if(typeof current!=='undefined'&&current==='Staffing')show('Staffing',true)});
const KEYIC='<svg class="kic" style="vertical-align:-1px" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-label="Key holder"><circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 21 2M17 6l3 3M14.5 8.5l2.5 2.5"/></svg>';
const stTen=m=>m<1?'<1 mo':m<24?m+' mo':Math.floor(m/12)+'y '+(m%12)+'m';
const stLab=m=>m==null?'No date':m<1?'<1 mo':m<24?m+' mo':Math.floor(m/12)+'y '+(m%12)+'m';
const stSd=v=>{const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(v||''));return m?String(+m[2]).padStart(2,'0')+'/'+String(+m[3]).padStart(2,'0')+'/'+m[1].slice(2):String(v||'')};
const stChip=x=>`<span class="stg ${x.level==='red'?'r':x.level==='yellow'?'y':x.level==='ok'?'g':'n'}" title="${x.level==='red'?'12 months or more':x.level==='yellow'?'6 to 12 months':x.level==='ok'?'Under 6 months':'No date'}">${stLab(x.months)}</span>`;
const shirtBlock=R0=>{const all=S.flatMap(s=>R0.stores[s]),sizes=[...new Set(all.filter(x=>x.shirt).map(x=>x.shirt))].sort((a,b)=>szk(a)-szk(b)||a.localeCompare(b)),none=all.filter(x=>!x.shirt).length;
 if(!sizes.length)return '';const cnt=(xs,z)=>xs.filter(x=>x.shirt===z).length,tot=sizes.map(z=>`<b>${esc(z)}</b> ${cnt(all,z)}`).concat(none?[`No size ${none}`]:[]).join(' &nbsp;·&nbsp; ');
 const card=s=>{const xs=R0.stores[s].slice().sort((a,b)=>szk(a.shirt||'')-szk(b.shirt||'')||a.name.localeCompare(b.name));
  return `<div class="card"><h3>${s}</h3><p class="sub" style="margin:0 0 4px">${sizes.filter(z=>cnt(xs,z)).map(z=>esc(z)+' '+cnt(xs,z)).join(' · ')}</p>${xs.length?`<table class="stt"><tr><th>Employee</th><th style="text-align:right">Shirt</th></tr>${xs.map(x=>`<tr><td>${esc(x.name)}</td><td style="text-align:right;white-space:nowrap">${x.shirt?esc(x.shirt):'<span class="src">no size</span>'}</td></tr>`).join('')}</table>`:'<p class="sub">No employees listed.</p>'}</div>`};
 return `<h2>Shirt sizes</h2><p class="sub">Pulled from the Notes column when it says Shirt Size. Smallest size first. Company totals for ordering: ${tot}.</p><div class="stgrid">${S.map(card).join('')}</div>`};
T.Staffing=()=>{const R0=R.roster,css=`<style>
.stg{display:inline-block;border-radius:999px;padding:1px 9px;font-size:11.5px;font-weight:650;white-space:nowrap;min-width:46px;text-align:center}
.stg.r{background:color-mix(in srgb,var(--crit) 15%,transparent);color:var(--crit)}.stg.y{background:color-mix(in srgb,var(--warn) 18%,transparent);color:var(--warn)}
.stg.g{background:color-mix(in srgb,var(--pos,#2a9d5c) 14%,transparent);color:var(--pos,#2a9d5c)}.stg.n{background:var(--line);color:inherit}
.stk{display:flex;gap:8px;margin:0 0 6px}.stk>button{flex:1;border:1px solid var(--line);border-radius:12px;padding:9px 12px;background:var(--card);min-width:0;font:inherit;color:inherit;text-align:left;cursor:pointer}.stk>button:hover{border-color:color-mix(in srgb,var(--line) 40%,currentColor)}.stk>button.on{box-shadow:0 0 0 2px currentColor inset}.sthint{font-size:12px;opacity:.7;margin:0 0 14px}
.stk b{font-size:22px;line-height:1.1;display:block}.stk span{font-size:12px;opacity:.75}.stk .r{border-left:4px solid var(--crit)}.stk .y{border-left:4px solid var(--warn)}.stk .g{border-left:4px solid var(--pos,#2a9d5c)}
.stt{width:100%;font-size:13px;border-collapse:collapse}.stt td,.stt th{padding:6px 6px;vertical-align:middle;text-align:left;white-space:normal}.stt th{font-size:11.5px;font-weight:600;opacity:.7;white-space:nowrap}
.stt td{border-top:1px solid var(--line)}.stt .nw{white-space:nowrap}.stt .rt{text-align:right}.stt .rate{font-weight:700;text-align:right;white-space:nowrap}
.stt td.nm{width:100%;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stt .n1{font-weight:650;overflow:hidden;text-overflow:ellipsis}.stt .n2{font-size:10.5px;opacity:.6;overflow:hidden;text-overflow:ellipsis}.stt .hire{font-size:10.5px;font-weight:600;opacity:.65;margin-left:4px}.stt .kw{margin-left:5px;opacity:.8;white-space:nowrap}.stt .kw .kic{vertical-align:-2px}.stt sup.hire{vertical-align:super;font-size:9.5px}
.stgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:12px;align-items:start}.stgrid .card{margin:0;padding:12px 10px 6px}.stgrid .stt td,.stgrid .stt th{padding-left:4px;padding-right:4px}.stgrid h3{margin:0 0 6px}
.wd{display:none}@media(min-width:720px){.wd{display:table-cell}.nr{display:none}}
@media(max-width:340px){.stt{font-size:11.5px}.stt td,.stt th{padding-left:3px;padding-right:3px}}
</style>`,
 head='<h2>Staffing</h2><p class="sub">Time since each person\'s last pay raise, so raises can stay on a six month rhythm. The colored badge shows how long it has been, yellow at 6 months and red at 12. Each store list is sorted by seniority, longest here first. Under each name is the last raise date, or the hire date when no raise is recorded, then how long they have been here.</p><p class="sub" style="margin-top:-6px"><b>S</b> after a name means seasonal. '+KEYIC+' means key.</p>';
 if(!modLive('roster')||!R0)return css+head+'<div class="card"><span class="tag warn">● Not connected</span> <span class="sub">Staffing reads straight from the Roster tab of the Pulp Employee Roster and Pay sheet and is not kept as a snapshot. This fills in as soon as Google Sheets answers for it.</span></div>';
 if(!R0.total)return css+head+'<div class="card"><p class="sub">The Roster tab has no employee rows yet.</p></div>';
 const all=S.flatMap(s=>R0.stores[s]),cur=all.filter(x=>x.level==='ok').length,
 sd2=x=>x.raise?esc(stSd(x.raise)):x.hire?esc(stSd(x.hire))+'<span class="hire">hired</span>':'<span class="src">none</span>',
 sd3=v=>stSd(v).replace(/^0/,'').replace('/0','/'),
 sub=(x,ss)=>(ss?x.store.slice(0,3).toUpperCase()+' · ':'')+(x.raise?'Raised '+sd3(x.raise):x.hire?'Hired '+sd3(x.hire):'No dates')+(x.tenure!=null&&x.tenure>=0?' · '+stTen(x.tenure)+' here':''),
 rt=x=>x.rate!=null?'$'+x.rate.toFixed(2):'<span class="src">none</span>',
 tbl=(xs,ss)=>`<table class="stt"><tr><th>Name</th><th class="rt">Rate/hr</th><th class="rt">Since</th></tr>${xs.map(x=>`<tr><td class="nm"><div class="n1">${esc(x.name)}${x.seasonal?'<sup class="hire" title="Seasonal">S</sup>':''}${x.key?'<span class="kw" title="Key holder"><svg class="kic" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-label="Key holder"><circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 21 2M17 6l3 3M14.5 8.5l2.5 2.5"/></svg></span>':''}</div><div class="n2">${esc(sub(x,ss))}</div></td><td class="rate">${rt(x)}</td><td class="rt">${stChip(x)}</td></tr>`).join('')}</table>`;
 const lv={red:'12 months or more',yellow:'6 to 12 months',ok:'Under 6 months'},fl=ST.f?{red:'red',yellow:'yellow',green:'ok'}[ST.f]:null,
 tile=(k,c,n,t)=>`<button class="${c}${ST.f===k?' on':''}" data-stf="${k}" aria-pressed="${ST.f===k}"><b>${n}</b><span>${t}</span></button>`,
 show1=xs=>fl?xs.filter(x=>x.level===fl):xs;
 return css+head+`<div class="stk">${tile('red','r',R0.red,lv.red)}${tile('yellow','y',R0.yellow,lv.yellow)}${tile('green','g',cur,lv.ok)}</div><p class="sthint">${fl?'Showing only people at '+lv[fl].toLowerCase()+'. Tap the tile again to show everyone.':'Tap a tile to show only those people.'}</p>
 <h2>By store</h2><div class="stgrid">${S.map(s=>{const xs=show1(R0.stores[s]).slice().sort((a,b)=>(b.tenure==null?-1:b.tenure)-(a.tenure==null?-1:a.tenure)||a.name.localeCompare(b.name));return `<div class="card"><h3>${s}${fl?` <span class="src">${xs.length}</span>`:''}</h3>${xs.length?tbl(xs,false):`<p class="sub">${fl?'No one in this group.':'No employees listed.'}</p>`}</div>`}).join('')}</div>
 ${shirtBlock(R0)}${R0.unknown?`<p class="sub">${R0.unknown} ${R0.unknown===1?'person has':'people have'} no raise or hire date, so no flag.</p>`:''}`};
