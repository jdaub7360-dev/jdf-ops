// Ask tab: plain English questions answered from the sheets through /api/ask
const ASKH=[];let askBusy=false;
const askEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function mdLite(t){const lines=String(t).split('\n'),out=[];let i=0;const inl=s=>askEsc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
 while(i<lines.length){const l=lines[i];
  if(/^\s*\|.*\|\s*$/.test(l)){const rows=[];while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++}
   const body=rows.filter(r=>!r.every(c=>/^:?-{2,}:?$/.test(c)));const head=body.shift()||[];
   out.push(`<div class="tw"><table><tr>${head.map(c=>`<th>${inl(c)}</th>`).join('')}</tr>${body.map(r=>`<tr>${r.map(c=>`<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</table></div>`);continue}
  if(l.trim()==='')out.push('');else out.push(`<p style="margin:6px 0">${inl(l)}</p>`);i++}
 return out.join('')}
const ASKX=['Saturday and Sunday sales by store for the last 3 weeks','Average Monday sales by store since September','How much fiber blend is at each store right now?','How many cookies did each store order this fall?'];
function askPaint(){const el=$('#askl');if(!el)return;el.innerHTML=ASKH.map(x=>`<div class="card" style="margin-bottom:10px"><div class="sub" style="margin:0 0 6px"><b>${askEsc(x.q)}</b></div>${x.a==null?'<p class="sub">Looking that up…</p>':x.err?`<p style="color:var(--bad,#b3261e)">${askEsc(x.a)}</p>`:mdLite(x.a)}${x.used&&x.used.length?`<details style="margin-top:6px"><summary class="sub" style="cursor:pointer">What it looked up</summary><p class="sub" style="margin:6px 0 0">${x.used.map(u=>askEsc(u.tool+' '+JSON.stringify(u.input))).join('<br>')}</p></details>`:''}</div>`).reverse().join('')}
T.Ask=()=>`<h2>Ask about the business</h2><p class="sub">Ask in plain English about sales by day, weekday averages, inventory counts, enhancer use, or cookie orders. Numbers are calculated from your sheets, and each answer shows what it looked up.</p>
 <form id="askf" style="display:grid;gap:8px;margin:12px 0"><textarea id="askq" rows="2" maxlength="500" placeholder="For example: average Saturday sales at each store since September" class="ots" style="font:inherit"></textarea><div><button class="btn" id="askb" type="submit">Ask</button></div></form>
 <div class="opills">${ASKX.map(x=>`<button class="opill askx" type="button">${askEsc(x)}</button>`).join('')}</div><div id="askl"></div>`;
async function askSend(q){if(askBusy||!q.trim())return;askBusy=true;const item={q,a:null};ASKH.push(item);askPaint();const b=$('#askb');if(b)b.disabled=true;
 try{const hist=[];ASKH.slice(0,-1).filter(x=>x.a&&!x.err).slice(-3).forEach(x=>{hist.push({role:'user',content:x.q},{role:'assistant',content:x.a})});
  const r=await fetch('/api/ask',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,history:hist})});
  if(r.status===401){location.reload();return}
  const j=await r.json().catch(()=>({}));if(!r.ok){item.a=j.message||'The assistant could not answer right now.';item.err=true}else{item.a=j.answer;item.used=j.used}}
 catch(e){item.a='Could not reach the server. Try again.';item.err=true}
 askBusy=false;const b2=$('#askb');if(b2)b2.disabled=false;if(current==='Ask')askPaint()}
function askInit(){askPaint();const f=$('#askf');if(!f)return;f.onsubmit=e=>{e.preventDefault();const t=$('#askq');const q=t.value;t.value='';askSend(q)};
 $('#askq').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();f.requestSubmit()}};
 document.querySelectorAll('.askx').forEach(b=>b.onclick=()=>askSend(b.textContent))}
