// ---- Live engine: parses Google Sheets grids and computes every figure the Sales and Labor tabs show.
const CFG={year:2026,baseline:[2,1,6,31],/*Mar 1 to Jul 31 as [m0,d0,m1,d1] zero based months*/recentFrom:[7,1],days28:28,dowDays:84};
const STORES_=["Ashland","Wadsworth","Massillon"];
const num=v=>{if(v==null||v==='')return null;if(typeof v==='number')return v;const t=String(v).replace(/[$,%\s]/g,'');if(t===''||t==='-')return null;const n=parseFloat(t);return isNaN(n)?null:n};
const U=(y,m,d)=>Date.UTC(y,m,d),DAY=864e5,iso=t=>new Date(t).toISOString().slice(0,10);
const r2=(x,n=2)=>Math.round(x*10**n)/10**n;
function parseGrid(rows){ // rows: array of arrays from the sheet, starting at the day 1 row
  const days={},years={},pct={};
  rows.forEach(r=>{const a=String(r[0]??'').trim();
    if(/^\d{1,2}$/.test(a)){days[+a]=Array.from({length:12},(_,m)=>num(r[m+1]))}
    else if(/^20\d\d$/.test(a)){years[+a]={m:Array.from({length:12},(_,m)=>num(r[m+1])),total:num(r[13])}}
    else if(a==='% + / -'){pct.total=num(r[13])}});
  return{days,years,pct};
}
function computeLive(S,L){ // S[store], L[store] are parsed grids
  const Y=CFG.year,out={},raw={};
  // pass 1: daily series and last day with sales per store
  let asOf=Infinity;const last={};
  STORES_.forEach(s=>{raw[s]=[];let lm=0;
    for(let m=0;m<12;m++)for(let d=1;d<=31;d++){const t=U(Y,m,d);if(new Date(t).getUTCMonth()!==m)continue;
      const sv=S[s].days[d]?.[m]??null,lv=L[s].days[d]?.[m]??null;raw[s].push({t,sales:sv,labor:lv});if(sv>0&&t>lm)lm=t}
    last[s]=lm;asOf=Math.min(asOf,lm)});
  const D={};STORES_.forEach(s=>D[s]=raw[s].filter(x=>x.t<=asOf));
  const ad=new Date(asOf),cm=ad.getUTCMonth(),cd=ad.getUTCDate();
  const meta={asOf:iso(asOf),cm,days:cd,last:Object.fromEntries(STORES_.map(s=>[s,iso(last[s])])),year:Y};
  const inR=(x,a,b)=>x.t>=a&&x.t<=b,pos=x=>x.sales>0;
  const sum=a=>a.reduce((p,c)=>p+c,0);
  const sumS=(s,a,b)=>sum(D[s].filter(x=>inR(x,a,b)&&pos(x)).map(x=>x.sales));
  const lab$=x=>x.sales*x.labor/100;
  // weekly (Mon to Sun, first Monday on or after Jan 1, full weeks only)
  let w=U(Y,0,1);while(new Date(w).getUTCDay()!==1)w+=DAY;const weeks=[];
  while(w+6*DAY<=asOf){weeks.push(w);w+=7*DAY}
  const wk=(s,a)=>{const xs=D[s].filter(x=>inR(x,a,a+6*DAY)&&x.sales!=null);return[sum(xs.map(x=>x.sales)),sum(xs.filter(x=>x.labor!=null).map(lab$))]};
  out.weeks=weeks.map(iso);
  out.weekly={};out.weekly_labor_pct={};
  STORES_.forEach(s=>{out.weekly[s]=weeks.map(a=>r2(wk(s,a)[0]));out.weekly_labor_pct[s]=weeks.map(a=>{const[x,l]=wk(s,a);return x?r2(100*l/x):null})});
  // monthly
  const ms={},ml={};
  STORES_.forEach(s=>{ms[s]=[];ml[s]=[];for(let m=0;m<=cm;m++){const xs=D[s].filter(x=>new Date(x.t).getUTCMonth()===m&&x.sales!=null);ms[s].push(sum(xs.map(x=>x.sales)));ml[s].push(sum(xs.filter(x=>x.labor!=null).map(lab$)))}});
  const y25=s=>S[s].years[Y-1]?.m||[];
  out.month_sales={};out.month_sales_2025={};out.month_labor_pct_w={};out.yoy={};
  STORES_.forEach(s=>{out.month_sales[s]=ms[s].map(v=>r2(v));out.month_sales_2025[s]=y25(s).slice(0,12).map(v=>v??0);
    out.month_labor_pct_w[s]=ms[s].map((v,i)=>v?r2(100*ml[s][i]/v):null);
    out.yoy[s]=Array.from({length:cm},(_,i)=>r2((ms[s][i]/y25(s)[i]-1)*100))});
  const comp=Array.from({length:cm+1},(_,i)=>sum(STORES_.map(s=>ms[s][i])));
  const comp25=Array.from({length:12},(_,i)=>sum(STORES_.map(s=>y25(s)[i]||0)));
  out.yoy.Company=Array.from({length:cm},(_,i)=>r2((comp[i]/comp25[i]-1)*100));
  const ytd26=sum(comp.slice(0,cm)),ytd25=sum(comp25.slice(0,cm));
  out.ytd=dict_ytd();function dict_ytd(){const by={};STORES_.forEach(s=>by[s]=r2((sum(ms[s].slice(0,cm))/sum(y25(s).slice(0,cm))-1)*100));
    const sheet={};STORES_.forEach(s=>sheet[s]=S[s].pct.total??null);
    return{y26:r2(ytd26),y25:r2(ytd25),pct:r2((ytd26/ytd25-1)*100),by_store:by,sheet_total_pct:sheet}}
  // current month pacing
  out.pace={};
  STORES_.forEach(s=>{const mtd=ms[s][cm],per=mtd/cd,prev=cm>0?ms[s][cm-1]:null,daysPrev=new Date(U(Y,cm,0)).getUTCDate();
    const dim25=new Date(U(Y-1,cm+1,0)).getUTCDate(),ly=y25(s)[cm];
    let ratio=null;const rs=[];[Y-3,Y-2,Y-1].forEach(yr=>{const m=S[s].years[yr]?.m;if(m&&cm>0&&m[cm]&&m[cm-1])rs.push(m[cm]/m[cm-1])});
    if(rs.length)ratio=sum(rs)/rs.length;
    const dimC=new Date(U(Y,cm+1,0)).getUTCDate();
    const seas=ratio&&prev?prev*ratio:per*dimC;
    out.pace[s]={mtd:r2(mtd),per_day:r2(per),prev_per_day:prev?r2(prev/daysPrev):null,ly_per_day:ly?r2(ly/dim25):null,proj_runrate:r2(per*dimC),proj_seasonal:r2(seas),ly_month:ly,ratio:ratio?r2(ratio,3):null,vs_ly_per_day:ly?r2((per/(ly/dim25)-1)*100,1):null}});
  // labor baseline vs recent
  const [bm0,bd0,bm1,bd1]=CFG.baseline,B0=U(Y,bm0,bd0),B1=U(Y,bm1,bd1),R0=U(Y,CFG.recentFrom[0],CFG.recentFrom[1]);
  const wl=(s,a,b)=>{const xs=D[s].filter(x=>inR(x,a,b)&&pos(x)&&x.labor!=null);return[sum(xs.map(x=>x.sales)),sum(xs.map(lab$))]};
  const cnt=(s,a,b)=>D[s].filter(x=>inR(x,a,b)&&pos(x)).length;
  out.labor={};
  STORES_.forEach(s=>{const[bs,bl]=wl(s,B0,B1),[rs,rl]=wl(s,R0,asOf),[s28,l28]=wl(s,asOf-27*DAY,asOf),[s7,l7]=wl(s,asOf-6*DAY,asOf),[sy,ly]=wl(s,U(Y,0,1),asOf);
    const bd=cnt(s,B0,B1),rd=cnt(s,R0,asOf),base=100*bl/bs,rec=100*rl/rs;
    out.labor[s]={base_pct:r2(base),recent_pct:r2(rec),excess:Math.round((rec-base)/100*rs),base_days:bd,rec_days:rd,l28:r2(100*l28/s28),l7:r2(100*l7/s7),ytd:r2(100*ly/sy),
      base_labor_per_day:r2(bl/bd,1),rec_labor_per_day:r2(rl/rd,1),base_sales_per_day:r2(bs/bd,1),rec_sales_per_day:r2(rs/rd,1)}});
  // day of week, last 84 days (Mon first)
  out.dow={};
  STORES_.forEach(s=>{out.dow[s]=[0,1,2,3,4,5,6].map(k=>{const xs=D[s].filter(x=>inR(x,asOf-(CFG.dowDays-1)*DAY,asOf)&&pos(x)&&((new Date(x.t).getUTCDay()+6)%7)===k);
    const sal=sum(xs.map(x=>x.sales))/xs.length,lp=100*sum(xs.filter(x=>x.labor!=null).map(lab$))/sum(xs.filter(x=>x.labor!=null).map(x=>x.sales)),ld=sum(xs.filter(x=>x.labor!=null).map(lab$))/xs.filter(x=>x.labor!=null).length;
    return{sales:Math.round(sal),labor_pct:r2(lp,1),labor_usd:Math.round(ld),n:xs.length}})});
  // worst labor days, last 28 days
  const worst=[];STORES_.forEach(s=>D[s].slice(-28).forEach(x=>{if(x.labor&&x.sales)worst.push({labor:x.labor,store:s,date:iso(x.t),sales:x.sales})}));
  worst.sort((a,b)=>b.labor-a.labor);out.worst_labor=worst.slice(0,8);
  // 28 day and 7 day comparisons
  out.w4={};
  STORES_.forEach(s=>{const cur=sumS(s,asOf-27*DAY,asOf),prev=sumS(s,asOf-55*DAY,asOf-28*DAY),l7=sumS(s,asOf-6*DAY,asOf),p7=sumS(s,asOf-13*DAY,asOf-7*DAY);
    out.w4[s]={cur:Math.round(cur),prev:Math.round(prev),pct:r2((cur/prev-1)*100,1),last7:Math.round(l7),prev7:Math.round(p7),pct7:r2((l7/p7-1)*100,1)}});
  // projection: current month seasonal plus remaining months scaled by the last three closed months vs last year
  const fam=comp.slice(Math.max(0,cm-3),cm),fam25=comp25.slice(Math.max(0,cm-3),cm),factor=sum(fam)/sum(fam25);
  const curProj=sum(STORES_.map(s=>out.pace[s].proj_seasonal)),rest=sum(comp25.slice(cm+1))*factor;
  out.projection={cur:Math.round(curProj),rest:Math.round(rest),closed:Math.round(ytd26),total:Math.round(ytd26+curProj+rest),factor:r2(factor,4),y25:r2(sum(comp25))};
  // reconciliation: sheet's own 2026 total row vs sum of daily entries
  out.recon=[];STORES_.forEach(s=>{const t=S[s].years[Y]?.m||[];for(let m=0;m<=cm;m++){const d=ms[s][m],sh=t[m];if(sh!=null&&Math.abs(d-sh)>0.02)out.recon.push({store:s,month:m,daily:r2(d),sheet:sh})}});
  out.meta=meta;out.sumSales=sumS;out.days=D;return out;
}
if(typeof module!=='undefined')module.exports={computeLive,parseGrid,CFG,STORES_};
