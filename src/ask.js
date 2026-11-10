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
function askPaint(){const el=$('#askl');if(!el)return;
 if(!ASKH.length){el.innerHTML='<div class="askempty">Ask a question above or tap one of the examples. Answers are worked out from your sheets, and each one lists what it looked up.</div>';return}
 el.innerHTML=ASKH.map(x=>`<div class="askc"><div class="askq">${askEsc(x.q)}</div>${x.a==null?'<div class="askwait"><span></span><span></span><span></span> Looking that up</div>':x.err?`<p class="aska" style="color:var(--crit)">${askEsc(x.a)}</p>`:mdLite(x.a)}${x.used&&x.used.length?`<details class="askd"><summary>What it looked up</summary><div>${x.used.map(u=>askEsc(u.tool.replace(/_/g,' ')+': '+Object.entries(u.input||{}).map(([k,v])=>k+' '+(Array.isArray(v)?v.join(', '):v)).join(', '))).join('<br>')}</div></details>`:''}</div>`).reverse().join('')}
T.Ask=()=>`<style>
.askbox{display:flex;gap:8px;align-items:flex-end;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 8px 8px 14px;margin:12px 0 10px}.askbox:focus-within{border-color:var(--M);box-shadow:0 0 0 3px #e7820026}
.askbox textarea{flex:1;border:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;resize:none;outline:none;padding:6px 0;min-height:44px;max-height:140px}.askbox textarea::placeholder{color:var(--mut)}
.askgo{background:var(--M);color:#fff;border:0;border-radius:10px;font:inherit;font-weight:650;padding:11px 20px;cursor:pointer;min-height:44px}.askgo:disabled{opacity:.5}
.askch{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}.askx{background:var(--card);color:var(--ink2);border:1px solid var(--line);border-radius:999px;font:inherit;font-size:13px;padding:7px 13px;cursor:pointer;text-align:left}.askx:hover{border-color:var(--M);color:var(--ink)}
.askc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:12px}.askq{font-size:12.5px;font-weight:650;color:var(--M);margin-bottom:8px}
.aska{margin:6px 0;line-height:1.55}.aska:first-of-type{font-size:16.5px;font-weight:560}
.askt{overflow-x:auto;margin:10px 0;border:1px solid var(--line);border-radius:10px}.askt table{font-size:14px}.askt th{background:var(--bg);padding:9px 12px}.askt td{padding:9px 12px}.askt tr:last-child td{border-bottom:0}.askt .n{text-align:right;font-variant-numeric:tabular-nums}.askt td:first-child{font-weight:600}
.askd{margin-top:10px;font-size:12.5px;color:var(--mut)}.askd summary{cursor:pointer}.askd div{margin-top:6px;line-height:1.6}
.askempty{color:var(--mut);font-size:13.5px;padding:18px 4px}
.askwait{color:var(--ink2);font-size:14px;display:flex;gap:4px;align-items:center}.askwait span{width:7px;height:7px;border-radius:50%;background:var(--M);animation:askb 1s infinite}.askwait span:nth-child(2){animation-delay:.15s}.askwait span:nth-child(3){animation-delay:.3s;margin-right:6px}@keyframes askb{0%,80%,100%{opacity:.25}40%{opacity:1}}
</style>
 <h2>Ask about the business</h2><p class="sub">Sales by day, weekday averages, inventory counts, enhancer use and cookie orders. Numbers are calculated from your sheets, not guessed.</p>
 <form id="askf" class="askbox"><textarea id="askq" rows="1" maxlength="500" placeholder="Ask a question, like average Saturday sales since September"></textarea><button class="askgo" id="askb" type="submit">Ask</button></form>
 <div class="askch">${ASKX.map(x=>`<button class="askx" type="button">${askEsc(x)}</button>`).join('')}</div><div id="askl"></div>`;
async function askSend(q){if(askBusy||!q.trim())return;askBusy=true;const item={q,a:null};ASKH.push(item);askPaint();const b=$('#askb');if(b)b.disabled=true;
 try{const hist=[];ASKH.slice(0,-1).filter(x=>x.a&&!x.err).slice(-3).forEach(x=>{hist.push({role:'user',content:x.q},{role:'assistant',content:x.a})});
  const r=await fetch('/api/ask',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,history:hist})});
  if(r.status===401){location.reload();return}
  const j=await r.json().catch(()=>({}));if(!r.ok){item.a=j.message||'The assistant could not answer right now.';item.err=true}else{item.a=j.answer;item.used=j.used}}
 catch(e){item.a='Could not reach the server. Try again.';item.err=true}
 askBusy=false;const b2=$('#askb');if(b2)b2.disabled=false;if($('#askl'))askPaint()}
function askInit(){askPaint();const f=$('#askf');if(!f)return;f.onsubmit=e=>{e.preventDefault();const t=$('#askq');const q=t.value;t.value='';askSend(q)};
 $('#askq').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();f.requestSubmit()}};
 document.querySelectorAll('.askx').forEach(b=>b.onclick=()=>askSend(b.textContent))}

// Global Ask button: opens the Ask panel on top of whatever tab is showing
function askOpen(){let o=$('#askov');if(!o){o=document.createElement('div');o.id='askov';o.setAttribute('role','dialog');o.setAttribute('aria-label','Ask about the business');
  o.innerHTML='<style>#askov{position:fixed;inset:0;z-index:50;background:var(--bg);overflow-y:auto;display:none}#askov.on{display:block}#askov .askin{max-width:760px;margin:0 auto;padding:12px 14px 80px}#askcl{position:sticky;top:8px;float:right;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:999px;font:inherit;font-size:14px;padding:8px 14px;cursor:pointer;z-index:2}#askfab{position:fixed;right:16px;bottom:16px;z-index:40;background:var(--M);color:#fff;border:0;border-radius:999px;font:inherit;font-weight:650;font-size:15px;padding:13px 22px;box-shadow:0 4px 14px #0004;cursor:pointer}</style><div class="askin"><button id="askcl" type="button">Close</button><div id="askbody"></div></div>';
  document.body.appendChild(o);$('#askcl').onclick=askClose;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&o.classList.contains('on'))askClose()})}
 $('#askbody').innerHTML=T.Ask();o.classList.add('on');document.body.style.overflow='hidden';askInit();const q=$('#askq');if(q&&!/Mobi|Android|iPhone/.test(navigator.userAgent))q.focus();try{history.replaceState(null,'','#ask')}catch(e){}}
function askClose(){const o=$('#askov');if(o)o.classList.remove('on');document.body.style.overflow='';try{history.replaceState(null,'','#'+current.replace(' ','').toLowerCase())}catch(e){}}
(function(){const b=document.createElement('button');b.id='askfab';b.type='button';b.textContent='Ask';b.setAttribute('aria-label','Ask a question about the business');
 const st=document.createElement('style');st.textContent='#askfab{position:fixed;right:16px;bottom:16px;z-index:40;background:var(--M);color:#fff;border:0;border-radius:999px;font:inherit;font-weight:650;font-size:15px;padding:13px 22px;box-shadow:0 4px 14px #0004;cursor:pointer}';document.head.appendChild(st);
 b.onclick=askOpen;document.body.appendChild(b);if(location.hash==='#ask')setTimeout(askOpen,0)})();
