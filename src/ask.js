// Ask tab: plain English questions answered from the sheets through /api/ask
const ASKH=[];let askBusy=false;
const askEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function mdLite(t){const lines=String(t).split('\n'),out=[];let i=0;const inl=s=>askEsc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
 const MONEYH=/\$|sales|revenue|cost|amount|price|spend|dollars/i,NOTH=/count|days|saturdays|sundays|weeks|tubs|cookies|orders|%|percent|rows/i;
 while(i<lines.length){const l=lines[i];
  if(/^\s*\|.*\|\s*$/.test(l)){const rows=[];while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++}
   const body=rows.filter(r=>!r.every(c=>/^:?-{2,}:?$/.test(c)));const head=body.shift()||[];
   const mon=head.map(h=>MONEYH.test(h)&&!NOTH.test(h.replace(/\(.*?\$.*?\)/,'')));
   const hd=head.map(h=>h.replace(/\s*\((?:sales\s*)?\$\)\s*$/i,'').replace(/\s*\(sales \$\)/i,''));
   const cell=(c,j)=>{const isNum=/^-?[\d,]+(\.\d+)?$/.test(c);if(j>0&&isNum)return `<td class="n">${mon[j]?(c.startsWith('-')?'−$'+c.slice(1):'$'+c):inl(c)}</td>`;return `<td${j>0?' class="n"':''}>${inl(c)}</td>`};
   out.push(`<div class="askt"><table><tr>${hd.map((c,j)=>`<th${j>0?' class="n"':''}>${inl(c)}</th>`).join('')}</tr>${body.map(r=>`<tr>${r.map(cell).join('')}</tr>`).join('')}</table></div>`);continue}
  if(l.trim()==='')out.push('');else out.push(`<p class="aska">${inl(l)}</p>`);i++}
 return out.join('')}
const ASKX=['Saturday and Sunday sales by store for the last 3 weeks','Average Monday sales by store since September','How much fiber blend is at each store right now?','How many cookies did each store order this fall?'];
// ---- Chat panel: floating button opens a small chat window on top of any tab
const askMoneyCell=c=>c;
function askTables(t){const lines=String(t).split('\n'),tabs=[];let i=0;
 while(i<lines.length){if(/^\s*\|.*\|\s*$/.test(lines[i])){const rows=[];while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++}
   const body=rows.filter(r=>!r.every(c=>/^:?-{2,}:?$/.test(c)));if(body.length)tabs.push(askFmtTable(body))}else i++}
 return tabs}
function askFmtTable(body){const head=body[0],MONEYH=/\$|sales|revenue|cost|amount|price|spend|dollars/i,NOTH=/count|days|saturdays|sundays|weeks|tubs|cookies|orders|%|percent|rows/i;
 const mon=head.map(h=>MONEYH.test(h)&&!NOTH.test(h.replace(/\(.*?\$.*?\)/,'')));
 const hd=head.map(h=>h.replace(/\s*\((?:sales\s*)?\$\)\s*$/i,'').replace(/\s*\(sales \$\)/i,'').replace(/\*\*/g,''));
 return [hd,...body.slice(1).map(r=>r.map((c,j)=>{c=c.replace(/\*\*/g,'');return j>0&&mon[j]&&/^-?[\d,]+(\.\d+)?$/.test(c)?(c.startsWith('-')?'-$'+c.slice(1):'$'+c):c}))]}
function askCsv(x){const q=s=>'"'+String(s).replace(/"/g,'""')+'"',tabs=askTables(x.a||'');let rows;
 if(tabs.length)rows=tabs.flatMap((t,i)=>i?[[''],...t]:t);else rows=[['Question','Answer'],[x.q,String(x.a||'').replace(/\*\*/g,'').replace(/\n+/g,' ')]];
 return '﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')}
function askExport(i){const x=ASKH[i];if(!x||x.a==null)return;const blob=new Blob([askCsv(x)],{type:'text/csv;charset=utf-8'}),a=document.createElement('a'),d=new Date().toISOString().slice(0,10);
 a.href=URL.createObjectURL(blob);a.download='jdf-answer-'+d+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function askPaint(){const el=$('#askl');if(!el)return;
 if(!ASKH.length){el.innerHTML=`<div class="askhi"><b>Ask about the business</b><p>Sales by day, weekday averages, inventory counts, enhancer use and cookie orders. Numbers come from your sheets.</p><div class="askch">${ASKX.map(x=>`<button class="askx" type="button">${askEsc(x)}</button>`).join('')}</div></div>`;el.querySelectorAll('.askx').forEach(b=>b.onclick=()=>askSend(b.textContent));return}
 el.innerHTML=ASKH.map((x,i)=>`<div class="askm askme">${askEsc(x.q)}</div><div class="askm askbot">${x.a==null?'<div class="askwait"><span></span><span></span><span></span></div>':x.err?`<p class="aska" style="color:var(--crit)">${askEsc(x.a)}</p>`:mdLite(x.a)}${x.a!=null&&!x.err?`<div class="askfoot"><button type="button" class="askexp" data-i="${i}">Export CSV</button>${x.used&&x.used.length?`<details class="askd"><summary>What it looked up</summary><div>${x.used.map(u=>askEsc(u.tool.replace(/_/g,' ')+': '+Object.entries(u.input||{}).map(([k,v])=>k+' '+(Array.isArray(v)?v.join(', '):v)).join(', '))).join('<br>')}</div></details>`:''}</div>`:''}</div>`).join('');
 el.querySelectorAll('.askexp').forEach(b=>b.onclick=()=>askExport(+b.dataset.i));el.scrollTop=el.scrollHeight}
async function askSend(q){q=String(q||'').trim();if(askBusy||!q)return;askBusy=true;const item={q,a:null};ASKH.push(item);askPaint();const b=$('#askb');if(b)b.disabled=true;
 try{const hist=[];ASKH.slice(0,-1).filter(x=>x.a&&!x.err).slice(-3).forEach(x=>{hist.push({role:'user',content:x.q},{role:'assistant',content:x.a})});
  const r=await fetch('/api/ask',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,history:hist})});
  if(r.status===401){location.reload();return}
  const j=await r.json().catch(()=>({}));if(!r.ok){item.a=j.message||'The assistant could not answer right now.';item.err=true}else{item.a=j.answer;item.used=j.used}}
 catch(e){item.a='Could not reach the server. Try again.';item.err=true}
 askBusy=false;const b2=$('#askb');if(b2)b2.disabled=false;if($('#askl'))askPaint()}
const ASKCSS=`#askfab{position:fixed;right:16px;bottom:16px;z-index:40;background:var(--M);color:#fff;border:0;border-radius:999px;font:inherit;font-weight:650;font-size:15px;padding:13px 22px;box-shadow:0 4px 14px #0004;cursor:pointer}
#askp{position:fixed;z-index:50;right:16px;bottom:16px;width:400px;height:min(640px,calc(100vh - 32px));background:var(--bg);border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 40px #0006;display:none;flex-direction:column;overflow:hidden}#askp.on{display:flex}
@media(max-width:520px){#askp{right:0;left:0;bottom:0;width:auto;height:88vh;border-radius:16px 16px 0 0}}
.askhd{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);background:var(--card)}.askhd b{flex:1;font-size:15px}.askhd button{background:none;border:0;color:var(--ink2);font:inherit;font-size:13px;cursor:pointer;padding:6px 8px}
#askl{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.askhi{color:var(--ink2);font-size:14px}.askhi b{color:var(--ink);font-size:16px}.askhi p{margin:6px 0 12px}
.askch{display:flex;flex-direction:column;gap:8px}.askx{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:12px;font:inherit;font-size:13.5px;padding:10px 12px;cursor:pointer;text-align:left}.askx:hover{border-color:var(--M)}
.askm{max-width:92%;border-radius:14px;padding:10px 13px;font-size:14.5px;line-height:1.5}.askme{align-self:flex-end;background:var(--M);color:#fff;border-bottom-right-radius:4px}.askbot{align-self:flex-start;background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px;max-width:100%}
.aska{margin:5px 0}.aska:first-child{margin-top:0}
.askt{overflow-x:auto;margin:8px 0;border:1px solid var(--line);border-radius:10px}.askt table{font-size:13px}.askt th{background:var(--bg);padding:7px 9px}.askt td{padding:7px 9px}.askt tr:last-child td{border-bottom:0}.askt .n{text-align:right;font-variant-numeric:tabular-nums}.askt td:first-child{font-weight:600}
.askfoot{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin-top:8px}.askexp{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;font:inherit;font-size:12.5px;padding:6px 11px;cursor:pointer}.askexp:hover{border-color:var(--g)}
.askd{font-size:12px;color:var(--mut)}.askd summary{cursor:pointer}.askd div{margin-top:5px;line-height:1.6}
.askwait{display:flex;gap:4px;padding:4px 0}.askwait span{width:7px;height:7px;border-radius:50%;background:var(--M);animation:askb 1s infinite}.askwait span:nth-child(2){animation-delay:.15s}.askwait span:nth-child(3){animation-delay:.3s}@keyframes askb{0%,80%,100%{opacity:.25}40%{opacity:1}}
#askf{display:flex;gap:8px;align-items:flex-end;padding:10px;border-top:1px solid var(--line);background:var(--card)}#askq{flex:1;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:16px;border-radius:12px;padding:10px 12px;resize:none;outline:none;max-height:110px;min-height:42px}#askq:focus{border-color:var(--M)}
#askb{background:var(--M);color:#fff;border:0;border-radius:12px;font:inherit;font-weight:650;padding:0 18px;min-height:42px;cursor:pointer}#askb:disabled{opacity:.5}`;
function askBuild(){if($('#askp'))return;
 const p=document.createElement('div');p.id='askp';p.setAttribute('role','dialog');p.setAttribute('aria-label','Ask about the business');
 p.innerHTML='<div class="askhd"><b>Ask</b><button type="button" id="askclr">Clear</button><button type="button" id="askcl" aria-label="Close">Close</button></div><div id="askl"></div><form id="askf"><textarea id="askq" rows="1" maxlength="500" placeholder="Ask a question"></textarea><button id="askb" type="submit">Send</button></form>';
 document.body.appendChild(p);
 $('#askcl').onclick=askClose;$('#askclr').onclick=()=>{if(!askBusy){ASKH.length=0;askPaint()}};
 $('#askf').onsubmit=e=>{e.preventDefault();const t=$('#askq'),q=t.value;t.value='';t.style.height='auto';askSend(q)};
 $('#askq').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#askf').requestSubmit()}};
 $('#askq').oninput=e=>{const t=e.target;t.style.height='auto';t.style.height=Math.min(110,t.scrollHeight)+'px'};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&p.classList.contains('on'))askClose()})}
function askOpen(){askBuild();$('#askp').classList.add('on');$('#askfab').style.display='none';askPaint();if(!/Mobi|Android|iPhone/.test(navigator.userAgent))$('#askq').focus()}
function askClose(){const p=$('#askp');if(p)p.classList.remove('on');const f=$('#askfab');if(f)f.style.display=''}
(function(){const st=document.createElement('style');st.textContent=ASKCSS;document.head.appendChild(st);const b=document.createElement('button');b.id='askfab';b.type='button';b.textContent='Ask';b.setAttribute('aria-label','Ask a question about the business');b.onclick=askOpen;document.body.appendChild(b)})();
