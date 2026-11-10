// Stands in for the claude.ai artifact runtime. The dashboard asks for claude.use('mcp') and
// watchTool(); here those become polling calls to this site's own /api routes.
(function(){
 const pollers=new Set();
 function fetchJson(url){return fetch(url,{credentials:'same-origin',cache:'no-store'}).then(async r=>{
  if(r.status===401){location.reload();throw new Error('signed out')}
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.message||'request failed');e.code=j.code||'tool_error';throw e}
  return j})}
 const mcp={
  watchTool(server,tool,input,handler,opt){
   const every=Math.max((opt&&opt.refetchInterval)||60000,30000);let stop=false,timer=null;
   const url=server==='Google Drive'?'/api/meta?id='+encodeURIComponent(input.fileId||input.file_id||input.id||''):'/api/sheets?id='+encodeURIComponent(input.spreadsheetId)+'&range='+encodeURIComponent(input.range);
   const tick=async()=>{if(stop)return;
    if(document.hidden){timer=setTimeout(tick,5000);return}
    try{const j=await fetchJson(url);if(!stop)handler({type:'data',result:{payload:j}})}
    catch(e){if(!stop&&e.message!=='signed out')handler({type:'error',error:{code:e.code||'tool_error',message:e.message}})}
    if(!stop)timer=setTimeout(tick,every)};
   const p={now:()=>{clearTimeout(timer);tick()}};pollers.add(p);tick();
   return()=>{stop=true;clearTimeout(timer);pollers.delete(p)}},
  invalidate(){pollers.forEach(p=>p.now());return Promise.resolve()},
  callTool(){return Promise.resolve({})}};
 const downloads={save:async({filename,data})=>{const b=new Blob([data],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}};
 window.claude={use:async n=>{if(n==='mcp')return mcp;if(n==='downloads')return downloads;throw new Error('unsupported capability '+n)}};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)mcp.invalidate()});
})();
