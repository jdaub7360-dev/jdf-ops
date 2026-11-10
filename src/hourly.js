// Hourly tab: what a day looks like hour by hour, per store. Read only.
// Ashland and Wadsworth hourly money is item level, so it shows shape and share of day, never checks and never a tie to the Daily Log.
const HRS={store:'Ashland',date:{},wd:{},n:4,met:'sales'};let hrsBound=false;
const hs1=h=>(h%12||12)+(h<12?'a':'p'),hl=h=>(h%12||12)+(h<12?' AM':' PM'),hr2=h=>hl(h)+' to '+hl(h+1);
const hpc=v=>v==null||!isFinite(v)?'':(v*100).toFixed(1)+'%';
const WDN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],WDORD=[1,2,3,4,5,6,0];
const hdate=d=>dayName(d),hs2=h=>hs1(h)+' to '+hs1(h+1);
const hback=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
function hchart(title,sub,lo,vals,peak,color,tipf){
 const W=640,H=230,m={l:52,r:10,t:24,b:26},iw=W-m.l-m.r,ih=H-m.t-m.b,n=vals.length,id='c'+(uid++);
 let hi=Math.max(...vals.map(v=>Math.max(v,0)),1);const step=hi>1500?500:hi>600?200:hi>300?100:hi>120?50:20;hi=Math.ceil(hi/step)*step;
 const Y=v=>m.t+ih*(1-Math.max(v,0)/hi),gw=iw/n,bw=Math.min(34,gw-6);let g='',b='';
 for(let v=0;v<=hi;v+=step)g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${m.l-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--mut)">$${v}</text>`;
 vals.forEach((v,i)=>{const x=m.l+gw*i+(gw-bw)/2;g+=`<text x="${m.l+gw*(i+.5)}" y="${H-8}" text-anchor="middle" font-size="11" fill="var(--mut)">${hs1(lo+i)}</text>`;
  b+=`<rect data-i="${i}" x="${x}" y="${Y(v)}" width="${bw}" height="${Math.max(1,Y(0)-Y(v))}" rx="3" fill="${color}" opacity="${i===peak?1:.55}"/>`;
  if(i===peak)b+=`<text x="${m.l+gw*(i+.5)}" y="${Y(v)-6}" text-anchor="middle" font-size="11" font-weight="650" fill="var(--ink)">Peak</text>`});
 setTimeout(()=>{const el=document.getElementById(id);if(!el)return;el.querySelectorAll('rect').forEach(r=>{const h=e=>{const rc=el.getBoundingClientRect();tip(el,tipf(+r.dataset.i),(e.touches?e.touches[0].clientX:e.clientX)-rc.left,30)};r.addEventListener('mousemove',h);r.addEventListener('touchstart',h,{passive:true});r.addEventListener('mouseleave',()=>$('.tip',el).style.display='none')})},0);
 return `<h3>${title}</h3><p class="sub">${sub}</p><div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${g}${b}</svg><div class="tip"></div></div>`}
// share of the day before noon, noon to 5 PM, 5 PM on
const hparts=(lo,sales,tot)=>{const a=[0,0,0];sales.forEach((v,i)=>{const h=lo+i;a[h<12?0:h<17?1:2]+=v});return tot>0?a.map(v=>v/tot):null};
T.Hourly=()=>{
 const H=R.hourly||{},st=HRS.store,D1=H[st];
 const pills=`<div class="hpills" role="tablist">${S.map(s=>`<button class="hpill hst" role="tab" aria-selected="${s===st}" data-st="${s}"><span class="dd" style="background:var(${SVAR[s]})"></span>${s}</button>`).join('')}</div>`;
 const css=`<style>.hpills{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.hpill{padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);font:inherit;cursor:pointer;display:flex;gap:8px;align-items:center;min-height:40px}.hpill[aria-selected=true]{border-color:var(--ink);font-weight:600}.hdrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0 12px}.hdrow select{font:inherit;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);min-height:40px}.hdrow button{font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);cursor:pointer;min-height:40px}.hdrow button:disabled{opacity:.4;cursor:default}.hwds{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.hwds button{font:inherit;font-size:13px;padding:6px 10px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);cursor:pointer}.hwds button[aria-selected=true]{border-color:var(--ink);font-weight:650}.hwds button:disabled{opacity:.4;cursor:default}.htab td,.htab th{white-space:nowrap}.htab td:first-child{white-space:nowrap}.hpk td{font-weight:650}.hheat td{text-align:right;padding:5px 4px;font-size:12.5px}.hheat td:first-child{text-align:left;color:var(--ink2)}.hheat th{text-align:right;padding:5px 4px}.hheat th:first-child{text-align:left}.hheat td.pkc{box-shadow:inset 0 0 0 1.5px var(--ink);border-radius:4px;font-weight:700}</style>`;
 const head=`<h2>Hourly sales</h2>`;
 if(!modLive('hourly'))return css+head+`<div class="card"><span class="tag warn">● Not connected</span> <span class="sub">Hourly sales read straight from the Hourly Sales tab and are not kept as a snapshot. This tab fills in as soon as Google Sheets answers for it.</span></div>`;
 const lead=`<p class="sub">Pick a store and a day to see how sales spread across the hours. Hours with no sales are zero.</p>`;
 if(!D1||!D1.days.length)return css+head+lead+pills+`<div class="card"><span class="sub">No hourly rows for ${st} yet. The tab fills in as the daily reports are added.</span></div>`;
 const hasChk=!!D1.days.find(x=>x.checks),days=D1.days,dates=days.map(x=>x.d),latest=dates[dates.length-1];
 const allLatest=S.map(s=>(H[s]&&H[s].days.length)?H[s].days[H[s].days.length-1].d:null).filter(Boolean).sort().pop();
 let sel=HRS.date[st];if(!dates.includes(sel))sel=latest;const di=dates.indexOf(sel),x=days[di],lo=D1.lo,tot=x.tot;
 const behind=hback(latest,allLatest),col=`var(${SVAR[st]})`,isMoney=hasChk&&x.checks;
 const lag=behind>0?`<p class="sub">The latest ${st} hourly day is ${wl(latest)}, ${behind} day${behind==1?'':'s'} behind the other stores. ${st==='Massillon'?'Massillon hourly rows are added in batches, so this catches up when the next batch lands.':'This catches up when the next day is added.'}</p>`:'';
 const ctl=`<div class="hdrow"><button id="hprev" ${di<=0?'disabled':''} aria-label="Previous day">Previous day</button><select id="hsel" aria-label="Day">${[...dates].reverse().map(d=>`<option value="${d}" ${d===sel?'selected':''}>${hdate(d)}${d===latest?' (latest)':''}</option>`).join('')}</select><button id="hnext" ${di>=dates.length-1?'disabled':''} aria-label="Next day">Next day</button></div>`;
 const pkH=lo+x.peak,pk=x.sales[x.peak],pt=hparts(lo,x.sales,tot);
 const chkTot=x.checks?x.checks.reduce((p,c)=>p+c,0):null;
 const tiles=`<div class="kpis">${kpi('Peak hour',`<span style="font-size:20px;white-space:nowrap">${hr2(pkH)}</span>`,tot>0?`${usd2(pk)}, ${hpc(pk/tot)} of the day`:usd2(pk))}${kpi(isMoney?'Net sales':'Total of the hours',usd2(tot),isMoney?'Ties to the Daily Log':'Hourly item sales, for shape only')}${x.checks?kpi('Checks',chkTot,chkTot>0?`Average check ${usd2(tot/chkTot)}`:''):''}${pt?kpi('Before noon',hpc(pt[0]),`Noon to 5 PM ${hpc(pt[1])}, 5 PM on ${hpc(pt[2])}`):''}</div>`;
 const tipf=i=>`<b>${hr2(lo+i)}</b><div>Sales: ${usd2(x.sales[i])}</div>${tot>0?`<div>Share of day: ${hpc(x.sales[i]/tot)}</div>`:''}${x.checks?`<div>Checks: ${x.checks[i]}</div>`:''}`;
 const chart=hchart(`${st}, ${hdate(sel)}`,`Sales for each hour of the day. The tallest bar is the peak.`,lo,x.sales,tot>0?x.peak:-1,col,tipf);
 const rows=x.sales.map((v,i)=>`<tr class="${i===x.peak&&tot>0?'hpk':''}"><td>${hr2(lo+i)}</td><td>${usd2(v)}</td><td>${tot>0?hpc(v/tot):''}</td>${x.checks?`<td>${x.checks[i]}</td><td>${x.checks[i]>0?usd2(v/x.checks[i]):'No checks'}</td>`:''}</tr>`).join('');
 const table=`<div class="tw"><table class="htab"><tr><th>Hour</th><th>Sales</th><th>Share of day</th>${x.checks?'<th>Checks</th><th>Avg check</th>':''}</tr>${rows}<tr><td><b>Total</b></td><td><b>${usd2(tot)}</b></td><td><b>${tot>0?'100.0%':''}</b></td>${x.checks?`<td><b>${chkTot}</b></td><td><b>${chkTot>0?usd2(tot/chkTot):''}</b></td>`:''}</tr></table></div>`;
 const note=hasChk?'':`<p class="sub" style="margin-top:8px">Ashland and Wadsworth hourly figures come from the POS item sales report, which does not count checks. A day's hours can differ a little from the Daily Log net sales for the same day, so use this tab for timing and share of day, not for the day's sales.</p>`;
 const day=`<div class="card"><div class="sch"><span class="dd" style="background:${col}"></span><b>${st}, ${hdate(sel)}</b>${sel===latest?'<span class="tag ok" style="margin-left:auto">Latest day</span>':''}</div>${tiles}<div style="margin-top:12px">${chart}</div><button class="tog" onclick="this.nextElementSibling.classList.toggle('on')">Show hour by hour</button><div class="dt">${table}</div>${note}</div>`;
 // compare the same weekday across recent weeks: hours down the side, one column per week, shaded by how busy the hour was
 const nh=D1.hi-D1.lo+1,NW=HRS.n||4,met=hasChk&&HRS.met==='checks'?'checks':'sales';
 const hagg=xs=>{const m=xs.length;if(!m)return null;const avg=Array(nh).fill(0).map((_,i)=>xs.reduce((p,q)=>p+q.sales[i],0)/m),t=avg.reduce((p,c)=>p+c,0);let pk=0;avg.forEach((v,i)=>{if(v>avg[pk])pk=i});return{n:m,avg:avg,tot:t,peak:pk,share:t>0?avg[pk]/t:null}};
 const lastN=k=>days.filter(d=>d.wd===k).slice(-NW);
 const wdSel=HRS.wd[st]!=null&&days.some(d=>d.wd===HRS.wd[st])?HRS.wd[st]:x.wd,shown=lastN(wdSel),cw=hagg(shown);
 const wp=`<div class="hwds" role="tablist">${WDORD.map(k=>`<button role="tab" data-wd="${k}" aria-selected="${k===wdSel}" ${days.some(d=>d.wd===k)?'':'disabled'}>${WDN[k].slice(0,3)}</button>`).join('')}</div>`;
 const np=`<div class="hwds" role="tablist" aria-label="Weeks to compare">${[3,4,6].map(n=>`<button data-n="${n}" aria-selected="${n===NW}">Last ${n}</button>`).join('')}${hasChk?`<span style="width:10px"></span><button data-met="sales" aria-selected="${met==='sales'}">Sales</button><button data-met="checks" aria-selected="${met==='checks'}">Checks</button>`:''}</div>`;
 const val=(d,i)=>met==='checks'?d.checks[i]:d.sales[i],fmt=v=>met==='checks'?String(Math.round(v*10)/10):usd(v);
 const mx=Math.max(1,...shown.flatMap(d=>d.sales.map((_,i)=>val(d,i))),...cw.avg.map((v,i)=>met==='checks'?shown.reduce((p,d)=>p+d.checks[i],0)/shown.length:v));
 const avgV=i=>met==='checks'?shown.reduce((p,d)=>p+d.checks[i],0)/shown.length:cw.avg[i],avgT=met==='checks'?shown.reduce((p,d)=>p+d.checks.reduce((a,c)=>a+c,0),0)/shown.length:cw.tot;
 const heat=v=>`background-color:color-mix(in srgb,${col} ${Math.round(6+64*Math.max(v,0)/mx)}%,transparent)`;
 const colPk=shown.map(d=>{let pk=0;d.sales.forEach((v,i)=>{if(val(d,i)>val(d,pk))pk=i});return pk});
 const hrows=Array.from({length:nh},(_,i)=>`<tr><td>${hs1(lo+i)}</td>${shown.map((d,k)=>`<td class="${colPk[k]===i?'pkc':''}" style="${heat(val(d,i))}">${fmt(val(d,i))}</td>`).join('')}<td style="${heat(avgV(i))};font-weight:650">${fmt(avgV(i))}</td><td>${avgT>0?hpc(avgV(i)/avgT):''}</td></tr>`).join('');
 const heatTable=`<div class="tw"><table class="htab hheat"><tr><th>Hour</th>${shown.map(d=>`<th>${wl(d.d)}</th>`).join('')}<th>Avg</th><th>Share</th></tr>${hrows}<tr class="hpk"><td>Day</td>${shown.map(d=>`<td>${met==='checks'?d.checks.reduce((p,c)=>p+c,0):usd(d.tot)}</td>`).join('')}<td>${fmt(avgT)}</td><td>${avgT>0?'100.0%':''}</td></tr></table></div>`;
 const cfew=cw.n<NW?` Only ${cw.n} ${WDN[wdSel]}${cw.n==1?'':'s'} loaded so far.`:'';
 const cmpSub=`One column per ${WDN[wdSel]}, oldest to newest. Darker is busier, outlined is that day's busiest hour. Share is each hour's part of the average day.${cfew}${hasChk?'':' Ashland and Wadsworth show item sales, for timing only.'}`;
 const cmp=`<div class="card"><b>Compare the same weekday</b><p class="sub">${st}. Pick a weekday and how many recent weeks to line up side by side.</p>${wp}${np}<p class="sub">${cmpSub}</p>${heatTable}</div>`;
 // average day by weekday across every loaded day for this store
 const w=D1.dow[wdSel],wdays=days.filter(d=>d.wd===wdSel),wpt=hparts(lo,w.avg,w.tot);
 const wtip=i=>`<b>${hr2(lo+i)}</b><div>Average sales: ${usd2(w.avg[i])}</div>${w.tot>0?`<div>Share of day: ${hpc(w.avg[i]/w.tot)}</div>`:''}`;
 const few=w.n<3?` Only ${w.n} ${WDN[wdSel]}${w.n==1?'':'s'} so far, so treat this as a rough read.`:'';
 const wchart=hchart(`Average ${WDN[wdSel]}`,`Average of ${w.n} ${WDN[wdSel]}${w.n==1?'':'s'}, ${wl(wdays[0].d)} to ${wl(wdays[wdays.length-1].d)}. Peak hour is ${hr2(lo+w.peak)}, ${hpc(w.share)} of the day.${few}`,lo,w.avg,w.peak,col,wtip);
 const dowTable=`<div class="tw"><table class="htab"><tr><th>Weekday (days)</th><th>${hasChk?'Avg net sales':'Avg of hours'}</th><th>Peak hour</th><th>Peak share</th></tr>${WDORD.map(k=>D1.dow[k]).filter(k=>k.n).map(k=>`<tr class="${k.wd===wdSel?'hpk':''}"><td>${WDN[k.wd].slice(0,3)} (${k.n})</td><td>${usd2(k.tot)}</td><td>${hs2(lo+k.peak)}</td><td>${hpc(k.share)}</td></tr>`).join('')}</table></div>`;
 const avg=`<div class="card"><b>Average day by weekday</b><p class="sub">Every loaded day for ${st}, ${wl(dates[0])} to ${wl(latest)}.</p>${wp}${wpt?`<div class="kpis">${kpi('Before noon',hpc(wpt[0]),`Noon to 5 PM ${hpc(wpt[1])}, 5 PM on ${hpc(wpt[2])}`)}${kpi('Average total',usd2(w.tot),hasChk?'Net sales per '+WDN[wdSel]:'Of the hours, for shape only')}</div>`:''}<div style="margin-top:12px">${wchart}</div><div style="margin-top:10px">${dowTable}</div></div>`;
 return css+head+lead+pills+lag+cmp+`<div style="height:10px"></div><h3 style="margin:14px 0 4px">One day</h3>`+ctl+day+`<div style="height:10px"></div>`+avg};
function hrsInit(){if(hrsBound)return;hrsBound=true;const m=$('#main');
 m.addEventListener('click',e=>{if(current!=='Hourly')return;const s=e.target.closest('.hst');if(s){HRS.store=s.dataset.st;show('Hourly',true);return}
  const w=e.target.closest('[data-wd]');if(w&&!w.disabled){HRS.wd[HRS.store]=+w.dataset.wd;show('Hourly',true);return}
  const nb=e.target.closest('[data-n]');if(nb){HRS.n=+nb.dataset.n;show('Hourly',true);return}
  const mb=e.target.closest('[data-met]');if(mb){HRS.met=mb.dataset.met;show('Hourly',true);return}
  const st=HRS.store,dd=(R.hourly[st]||{days:[]}).days.map(x=>x.d),cur=dd.includes(HRS.date[st])?HRS.date[st]:dd[dd.length-1];
  if(e.target.closest('#hprev')){const i=dd.indexOf(cur);if(i>0){HRS.date[st]=dd[i-1];HRS.wd[st]=null;show('Hourly',true)}return}
  if(e.target.closest('#hnext')){const i=dd.indexOf(cur);if(i>=0&&i<dd.length-1){HRS.date[st]=dd[i+1];HRS.wd[st]=null;show('Hourly',true)}}});
 m.addEventListener('change',e=>{if(current!=='Hourly'||e.target.id!=='hsel')return;HRS.date[HRS.store]=e.target.value;HRS.wd[HRS.store]=null;show('Hourly',true)})}
