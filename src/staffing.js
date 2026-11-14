// Staffing tab: how long since each person's last raise, with their hourly rate. Yellow at 6 months, red at 12.
// Shirt sizes come from the Notes column. Display only, nothing here feeds labor or any calculation.
// The Needs attention block is a native details element so it collapses with no script. Its open state is kept in ST and remembered per browser.
const SZO=['xs','extra small','small','s','medium','m','large','l','xl','extra large','2xl','xxl','3xl'],szk=z=>{const i=SZO.indexOf(String(z).toLowerCase());return i<0?99:i};
const ST={open:true};try{if(localStorage.getItem('stOpen')==='0')ST.open=false}catch(e){}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.id==='stNeed'){ST.open=d.open;try{localStorage.setItem('stOpen',d.open?'1':'0')}catch(x){}}},true);
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
.stk{display:flex;gap:8px;margin:0 0 14px}.stk>div{flex:1;border:1px solid var(--line);border-radius:12px;padding:9px 12px;background:var(--card);min-width:0}
.stk b{font-size:22px;line-height:1.1;display:block}.stk span{font-size:12px;opacity:.75}.stk .r{border-left:4px solid var(--crit)}.stk .y{border-left:4px solid var(--warn)}.stk .g{border-left:4px solid var(--pos,#2a9d5c)}
.stt{width:100%;font-size:13px;border-collapse:collapse}.stt td,.stt th{padding:6px 6px;vertical-align:middle;text-align:left;white-space:normal}.stt th{font-size:11.5px;font-weight:600;opacity:.7;white-space:nowrap}
.stt td{border-top:1px solid var(--line)}.stt .nw{white-space:nowrap}.stt .rt{text-align:right}.stt .rate{font-weight:700;text-align:right;white-space:nowrap}
.stt td:first-child{font-weight:620}.stt .hire{font-size:10.5px;opacity:.65;margin-left:3px}
.stgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:12px;align-items:start}.stgrid .card{margin:0;padding-top:12px}.stgrid h3{margin:0 0 6px}
.wd{display:none}@media(min-width:720px){.wd{display:table-cell}.nr{display:none}}
@media(max-width:340px){.stt{font-size:11.5px}.stt td,.stt th{padding-left:3px;padding-right:3px}}
details.stnd{margin:0 0 6px}details.stnd>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 0 8px}
details.stnd>summary::-webkit-details-marker{display:none}details.stnd>summary h2{margin:0}
.stnd .chev{display:inline-block;transition:transform .15s;font-size:12px;opacity:.7}details.stnd[open] .chev{transform:rotate(90deg)}.stnd .hint .a{display:none}details.stnd[open] .hint .a{display:inline}details.stnd[open] .hint .b{display:none}.stnd .hint{font-size:12px;opacity:.65;margin-left:auto}
</style>`,
 head='<h2>Staffing</h2><p class="sub">Time since each person\'s last pay raise, so raises can stay on a six month rhythm. The colored badge shows how long it has been, yellow at 6 months and red at 12. A small hire next to a date means no raise is recorded, so the hire date is used.</p>';
 if(!modLive('roster')||!R0)return css+head+'<div class="card"><span class="tag warn">● Not connected</span> <span class="sub">Staffing reads straight from the Roster tab of the Pulp Employee Roster and Pay sheet and is not kept as a snapshot. This fills in as soon as Google Sheets answers for it.</span></div>';
 if(!R0.total)return css+head+'<div class="card"><p class="sub">The Roster tab has no employee rows yet.</p></div>';
 const all=S.flatMap(s=>R0.stores[s]),need=all.filter(x=>x.level==='red'||x.level==='yellow').sort((a,b)=>b.months-a.months||a.name.localeCompare(b.name)),cur=all.filter(x=>x.level==='ok').length,
 dt=x=>x.raise?esc(stSd(x.raise)):x.hire?esc(stSd(x.hire))+'<span class="hire">hire</span>':'<span class="src">none</span>',
 nm=x=>esc(x.name)+(x.seasonal?' <span class="src">seasonal</span>':''),
 rt=x=>x.rate!=null?'$'+x.rate.toFixed(2)+'/hr':'<span class="src">none</span>',
 tbl=(xs,ss)=>`<table class="stt"><tr><th>Name</th>${ss?'<th class="wd">Store</th>':''}<th class="nw">Last raise</th><th class="rt">Pay rate</th><th class="rt">Since</th></tr>${xs.map(x=>`<tr><td>${nm(x)}${ss?`<span class="nr"><br><span class="src">${x.store}</span></span>`:''}</td>${ss?`<td class="wd">${x.store}</td>`:''}<td class="nw">${dt(x)}</td><td class="rate">${rt(x)}</td><td class="rt">${stChip(x)}</td></tr>`).join('')}</table>`;
 return css+head+`<div class="stk"><div class="r"><b>${R0.red}</b><span>12 months or more</span></div><div class="y"><b>${R0.yellow}</b><span>6 to 12 months</span></div><div class="g"><b>${cur}</b><span>Under 6 months</span></div></div>
 <details class="stnd" id="stNeed"${ST.open?' open':''}><summary><span class="chev">▶</span><h2>Needs attention</h2><span class="stg r">${R0.red} red</span><span class="stg y">${R0.yellow} yellow</span><span class="hint"><span class="a">Tap to collapse</span><span class="b">Tap to show the list</span></span></summary>${need.length?`<div class="card" style="padding:6px 10px">${tbl(need,true)}</div>`:'<div class="card"><p class="sub">Everyone is under 6 months since their last raise.</p></div>'}</details>
 <h2>By store</h2><div class="stgrid">${S.map(s=>`<div class="card"><h3>${s}</h3>${R0.stores[s].length?tbl(R0.stores[s],false):'<p class="sub">No employees listed.</p>'}</div>`).join('')}</div>
 ${shirtBlock(R0)}${R0.unknown?`<p class="sub">${R0.unknown} ${R0.unknown===1?'person has':'people have'} no raise or hire date, so no flag.</p>`:''}`};
