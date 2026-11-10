const fs = require('node:fs');
const path = require('node:path');
const { isAuthed } = require('../lib/auth');

const LOGIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="icon" href="data:,"><title>JDF Group Operations</title>
<style>:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f2;color:#1c1c1a}@media(prefers-color-scheme:dark){body{background:#151513;color:#ecece6}input,button{background:#222220!important;color:#ecece6!important;border-color:#3a3a36!important}}
form{width:min(340px,88vw);display:grid;gap:12px}h1{font-size:20px;margin:0 0 4px}p{margin:0;color:#77776f;font-size:14px}input,button{font:inherit;padding:12px;border:1px solid #cfcfc6;border-radius:10px;background:#fff}button{cursor:pointer;font-weight:600}#err{color:#b3261e;min-height:1.2em;font-size:14px}</style></head><body>
<form id="f"><div><h1>JDF Group Operations</h1><p>Enter the password to continue.</p></div><input id="pw" type="password" autocomplete="current-password" placeholder="Password" autofocus required><button>Sign in</button><div id="err" role="alert"></div></form>
<script>document.getElementById('f').onsubmit=async e=>{e.preventDefault();const err=document.getElementById('err');err.textContent='';
try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('pw').value})});
if(r.ok){location.reload();return}const j=await r.json().catch(()=>({}));err.textContent=j.message||'That password is not right.'}catch(x){err.textContent='Could not reach the server. Try again.'}}</script></body></html>`;

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!isAuthed(req)) { res.status(200).send(LOGIN); return; }
  const file = path.join(process.cwd(), 'private', 'dashboard.html');
  res.status(200).send(fs.readFileSync(file, 'utf8'));
};
