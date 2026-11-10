// Reads the sheets once per question (cached briefly) and exposes parsed data to the assistant tools.
const google = require('./google');
const { eng } = require('./engine');
const STORES = ['Ashland', 'Wadsworth', 'Massillon'];
const FID = {
  sales: '1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g', labor: '1j9Aep9pRCy-Os80DMD3zWnKCOpV3YVeakJuol9EqOE4',
  sysco: '18lcS1wZobeEVDsP4sumjXqhn298XzpsGuhXShoAKcxM',
  enh: '1PBd6rouiKWmcOYpfXfsGhzpYqXcL_d5120e2UN19dAA', cookie: '1xqF-jZuhJUeitAZFKvudqB_2SqIFDO7vBU4KgBHRfg8',
  par: { Ashland: '1K2aGrtoBq_x2dTrzw3isz9fZ2ygDU16zGLZ2Y2jrDts', Wadsworth: '10j2P0GsB3f-gUgjSYHzkjo4op2Ui9LZHHJhT8hULOh4', Massillon: '1SGH3hq1KgAItnEksO7AiH0GrkYKVFUbtcH-9zrvYqPg' },
};
let cache = null;
const get = (id, range) => google.getValues(id, range).then((x) => x.values).catch(() => null);

async function load() {
  if (cache && cache.t > Date.now() - 20000) return cache.v;
  const E = eng();
  const [sales, labor, par, enhTot, enhUse, enhOrd, enhLog, ckTot, ckOrd, hourly] = await Promise.all([
    Promise.all(STORES.map((s) => get(FID.sales, `${s}!A3:N43`))),
    Promise.all(STORES.map((s) => get(FID.labor, `${s}!A3:N36`))),
    Promise.all(STORES.map((s) => get(FID.par[s], "'PAR Sheet'!A1:B170"))),
    get(FID.enh, 'Totals!A1:K24'), get(FID.enh, 'Usage!A1:H400'), get(FID.enh, 'Order!A1:B30'),
    get(FID.enh, "'Enhancer Store Log'!A1:F3000"),
    get(FID.cookie, 'Totals!A1:I16'), get(FID.cookie, "'Cookie Orders'!A1:O200"),
    get(FID.sysco, "'Hourly Sales'!A:E"),
  ]);
  const v = { STORES, E };
  if (sales.every(Boolean) && labor.every(Boolean)) {
    const S = {}, L = {};
    STORES.forEach((s, i) => { S[s] = E.parseGrid(sales[i]); L[s] = E.parseGrid(labor[i]); });
    v.live = E.computeLive(S, L);
  }
  v.par = {};
  STORES.forEach((s, i) => { if (par[i]) v.par[s] = E.analysePar(par[i], null, Date.now()); });
  if (enhTot && enhUse) {
    v.enh = E.computeEnh(E.parseEnhTotals(enhTot), E.parseEnhUsage(enhUse), enhOrd ? E.parseEnhOrder(enhOrd) : {});
    v.enhUsage = E.parseEnhUsage(enhUse);
  }
  v.hourly = hourly ? E.computeHourly(E.parseHourly(hourly)) : null;
  v.storeLog = enhLog ? E.parseEnhStoreLog(enhLog) : [];
  v.storeBurn = E.computeStoreBurn(v.storeLog);
  v.cookies = ckTot ? E.parseCookieTotals(ckTot) : null;
  v.cookieOrders = [];
  if (ckOrd) STORES.forEach((s, i) => ckOrd.forEach((r) => {
    const t = E.isoDate(r[i * 5]), n = E.num(r[i * 5 + 2]), tot = E.num(r[i * 5 + 3]);
    if (t != null && n > 0) v.cookieOrders.push({ store: s, date: new Date(t).toISOString().slice(0, 10), cookies: n, order_total: tot });
  }));
  cache = { t: Date.now(), v };
  return v;
}
module.exports = { load, STORES };
