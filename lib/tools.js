// Deterministic lookups the assistant can call. The code does all arithmetic, the model only chooses what to look up.
const { load, STORES } = require('./data');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const pickStores = (a) => (Array.isArray(a) && a.length ? STORES.filter((s) => a.map((x) => String(x).toLowerCase()).includes(s.toLowerCase())) : STORES);

const defs = [
  { name: 'sales_by_day', description: 'Daily net sales and labor percent for one or more stores between two dates (inclusive), the current year only. Returns at most 400 rows. Use weekday_stats for averages and totals.',
    input_schema: { type: 'object', properties: { stores: { type: 'array', items: { type: 'string' }, description: 'Ashland, Wadsworth, Massillon. Omit for all.' }, from: { type: 'string', description: 'yyyy-mm-dd' }, to: { type: 'string', description: 'yyyy-mm-dd' } }, required: ['from', 'to'] } },
  { name: 'weekday_stats', description: 'Count, total, average, min and max of daily net sales by store and weekday between two dates, with the individual days listed when there are 12 or fewer. Also gives average labor percent. Use this for any average or total of sales.',
    input_schema: { type: 'object', properties: { stores: { type: 'array', items: { type: 'string' } }, from: { type: 'string' }, to: { type: 'string' }, weekdays: { type: 'array', items: { type: 'string' }, description: 'For example ["Saturday","Sunday"]. Omit for all seven days.' } }, required: ['from', 'to'] } },
  { name: 'monthly_totals', description: 'Net sales by month for each store for this year and last year, and weighted labor percent by month for this year.', input_schema: { type: 'object', properties: {} } },
  { name: 'inventory_now', description: 'Current counts: every item on each store PAR sheet with its count and a status (out, need, low, ok), each store stock of each enhancer in tubs, and each store stock of each cookie.', input_schema: { type: 'object', properties: {} } },
  { name: 'enhancer_history', description: 'Enhancer usage. Company wide weekly use per enhancer from the Usage tab, plus per store counts, deliveries and burn rate from the Enhancer Store Log. Optionally filter by part of an enhancer name.',
    input_schema: { type: 'object', properties: { item: { type: 'string', description: 'Part of the name, for example "fiber".' } } } },
  { name: 'order_plan', description: 'What to order and when. Next order days, every enhancer with tubs on hand, weekly burn, weeks of cover, estimated run out date, suggested order quantity (tubs needed to reach the target weeks of cover at current burn) and priority, plus cookies at zero by store and PAR sheet items that are out, needed or low by store. Use this for any question about what to order, what is running low, or when something runs out.', input_schema: { type: 'object', properties: {} } },
  { name: 'hourly_profile', description: 'How sales spread across the hours of the day, per store, averaged over the days in the date range (optionally only some weekdays). Gives average sales and share of day for each hour, the peak hour, and the days used. Hours with no sales count as zero. Use it for busiest hour, slow hours, and shape of the day. It is for timing only: for how much a store sold in a day, use weekday_stats. Check counts and average check exist for Massillon only.',
    input_schema: { type: 'object', properties: { stores: { type: 'array', items: { type: 'string' } }, from: { type: 'string', description: 'yyyy-mm-dd. Omit with to for the last 28 loaded days.' }, to: { type: 'string' }, weekdays: { type: 'array', items: { type: 'string' } } } } },
  { name: 'cookie_orders', description: 'Every cookie order logged per store: date, cookies ordered, order total. Optionally limit to dates.', input_schema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } } },
];

function dayRows(d, a) {
  const from = Date.parse(a.from), to = Date.parse(a.to);
  if (!(from <= to)) throw new Error('from and to must be valid yyyy-mm-dd dates with from before to');
  const rows = [];
  pickStores(a.stores).forEach((s) => (d.live.days[s] || []).forEach((x) => { if (x.t >= from && x.t <= to && x.sales != null) rows.push({ store: s, t: x.t, date: iso(x.t), weekday: DAYS[new Date(x.t).getUTCDay()], sales: r2(x.sales), labor_pct: x.labor == null ? null : r2(x.labor) }); }));
  return rows;
}
const run = {
  async sales_by_day(a) {
    const d = await load(); if (!d.live) throw new Error('sales and labor sheets could not be read');
    const rows = dayRows(d, a); if (rows.length > 400) throw new Error(`${rows.length} rows, narrow the dates or stores`);
    return { last_day_with_data_for_all_stores: iso(d.live.meta.asOf), rows: rows.map(({ t, ...x }) => x) };
  },
  async weekday_stats(a) {
    const d = await load(); if (!d.live) throw new Error('sales and labor sheets could not be read');
    const want = Array.isArray(a.weekdays) && a.weekdays.length ? a.weekdays.map((x) => String(x).toLowerCase()) : null;
    const rows = dayRows(d, a).filter((r) => !want || want.includes(r.weekday.toLowerCase()));
    const out = {};
    rows.forEach((r) => { const k = r.store + '|' + r.weekday; (out[k] = out[k] || { store: r.store, weekday: r.weekday, days: [] }).days.push(r); });
    return { last_day_with_data_for_all_stores: iso(d.live.meta.asOf), results: Object.values(out).map((g) => {
      const v = g.days.map((x) => x.sales), lab = g.days.filter((x) => x.labor_pct != null).map((x) => x.labor_pct);
      return { store: g.store, weekday: g.weekday, days_counted: v.length, total_sales: r2(v.reduce((s, x) => s + x, 0)), average_sales: r2(v.reduce((s, x) => s + x, 0) / v.length), min_sales: Math.min(...v), max_sales: Math.max(...v), average_labor_pct: lab.length ? r2(lab.reduce((s, x) => s + x, 0) / lab.length) : null, days: v.length <= 12 ? g.days.map((x) => ({ date: x.date, sales: x.sales })) : undefined };
    }) };
  },
  async monthly_totals() {
    const d = await load(); if (!d.live) throw new Error('sales and labor sheets could not be read');
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], L = d.live, o = {};
    STORES.forEach((s) => { o[s] = m.map((n, i) => ({ month: n, sales_this_year: L.month_sales[s][i] || null, sales_last_year: L.month_sales_2025[s][i] || null, labor_pct_this_year: L.month_labor_pct_w[s][i] })); });
    return { note: 'The current month is partial.', stores: o };
  },
  async inventory_now() {
    const d = await load(), o = { par_counts: {}, enhancers: null, cookies: null };
    STORES.forEach((s) => { const p = d.par[s]; o.par_counts[s] = p ? { items_counted: p.counted, items: p.items.map((i) => ({ section: i.sec, item: i.name, count: i.raw, status: i.st })) } : 'could not be read'; });
    if (d.enh) o.enhancers = d.enh.items.map((e) => ({ item: e.item, tubs_on_hand: { Ashland: e.a, Wadsworth: e.w, Massillon: e.m }, company_burn_tubs_per_week: e.burn, company_weeks_of_cover: e.cover }));
    if (d.cookies) o.cookies = d.cookies.map((c) => ({ cookie: c.name, stock: c.stock }));
    return o;
  },
  async enhancer_history(a) {
    const d = await load(), f = a.item ? String(a.item).toLowerCase() : null, has = (n) => !f || String(n).toLowerCase().includes(f);
    return {
      company_usage_by_cycle: (d.enhUsage || []).filter((u) => has(u.item)).map((u) => ({ cycle_date: iso(u.t), item: u.item, used_tubs: u.used, used_per_week: u.perWeek == null ? null : r2(u.perWeek) })),
      store_log_counts: d.storeLog.filter((x) => has(x.item)).map((x) => ({ date: iso(x.t), store: x.store, item: x.item, stock_on_hand: x.stock, received_since_last_count: x.recv })),
      per_store_burn_tubs_per_week: Object.fromEntries(Object.entries(d.storeBurn).filter(([k]) => has(k)).map(([k, v]) => [k, v])),
      note: 'Per store burn only uses cycles of 28 days or less with deliveries recorded, so it may be empty until clean counts accumulate. Company usage is not split by store.',
    };
  },
  async order_plan() {
    const d = await load();
    const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })), today = Date.UTC(nowET.getFullYear(), nowET.getMonth(), nowET.getDate());
    const next = []; for (let i = 0; i < 8 && next.length < 3; i++) { const t = today + i * 864e5, w = new Date(t).getUTCDay(); if (w === 1 || w === 4) next.push({ date: iso(t), weekday: DAYS[w], in_days: i }); }
    const out = { today: iso(today), next_order_days: next, order_days_note: 'Stores order on Mondays and Thursdays.' };
    out.enhancers = d.enh ? d.enh.items.map((e) => ({ item: e.item, tubs_on_hand_total: e.stock, tubs_on_hand_by_store: { Ashland: e.a, Wadsworth: e.w, Massillon: e.m }, burn_tubs_per_week: e.burn, weeks_of_cover: e.cover == null ? null : r2(e.cover), estimated_run_out_date: e.cover == null ? null : iso(today + e.cover * 7 * 864e5), suggested_order_tubs: e.model, tubs_already_in_draft_order_sheet: e.draft, priority: e.cover != null && e.cover < 2 ? 'order now' : e.cover != null && e.cover < 4 ? 'order soon' : e.model > 0 ? 'order' : 'ok' })).sort((a, b) => (a.weeks_of_cover == null ? 99 : a.weeks_of_cover) - (b.weeks_of_cover == null ? 99 : b.weeks_of_cover)) : 'could not be read';
    out.enhancer_rule = 'Suggested order is the tubs needed to reach three weeks of cover at the current company wide burn. Burn is the average of the last three weekly usage cycles. Tub size is part of each enhancer name.';
    out.cookies_at_zero = Object.fromEntries(STORES.map((s) => [s, (d.cookies || []).filter((c) => c.stock[s] === 0).map((c) => c.name)]));
    out.par_items_needing_attention = Object.fromEntries(STORES.map((s) => [s, d.par[s] ? d.par[s].items.filter((i) => i.st !== 'ok').map((i) => ({ item: i.name, count: i.raw, status: i.st })) : 'could not be read']));
    return out;
  },
  async hourly_profile(a) {
    const d = await load(); if (!d.hourly) throw new Error('the Hourly Sales tab could not be read');
    const want = Array.isArray(a.weekdays) && a.weekdays.length ? a.weekdays.map((x) => String(x).toLowerCase()) : null;
    const hl = (h) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM'), range = (h) => hl(h) + ' to ' + hl(h + 1);
    const out = pickStores(a.stores).map((s) => {
      const H = d.hourly[s]; if (!H || !H.days.length) return { store: s, note: 'no hourly rows for this store yet' };
      const lastT = Date.parse(H.days[H.days.length - 1].d), to = a.to ? Date.parse(a.to) : lastT, from = a.from ? Date.parse(a.from) : to - 27 * 864e5;
      if (!(from <= to)) throw new Error('from and to must be valid yyyy-mm-dd dates with from before to');
      const ds = H.days.filter((x) => Date.parse(x.d) >= from && Date.parse(x.d) <= to && (!want || want.includes(DAYS[x.wd].toLowerCase())));
      if (!ds.length) return { store: s, note: 'no hourly days in that range', latest_hourly_date: H.days[H.days.length - 1].d };
      const n = H.hi - H.lo + 1, avg = Array(n).fill(0).map((_, i) => ds.reduce((p, x) => p + x.sales[i], 0) / ds.length), tot = avg.reduce((p, c) => p + c, 0);
      const chk = s === 'Massillon' && ds.every((x) => x.checks) ? Array(n).fill(0).map((_, i) => ds.reduce((p, x) => p + x.checks[i], 0) / ds.length) : null;
      let pk = 0; avg.forEach((v, i) => { if (v > avg[pk]) pk = i; });
      return { store: s, days_used: ds.length, first_day: ds[0].d, last_day: ds[ds.length - 1].d, latest_hourly_date: H.days[H.days.length - 1].d,
        average_total_of_hours: r2(tot), peak_hour: range(H.lo + pk), peak_hour_avg_sales: r2(avg[pk]), peak_hour_share_of_day: tot > 0 ? r2((avg[pk] / tot) * 100) : null,
        hours: avg.map((v, i) => ({ hour: range(H.lo + i), avg_sales: r2(v), share_of_day_pct: tot > 0 ? r2((v / tot) * 100) : null, ...(chk ? { avg_checks: r2(chk[i]), avg_check: chk[i] > 0 ? r2(v / chk[i]) : null } : {}) })),
        ...(s === 'Massillon' ? {} : { note: 'Hourly figures for this store are item level sales for shape of the day only. They do not tie to daily net sales and there is no check count, so never give checks or average check for this store.' }) };
    });
    return { results: out, note: 'Massillon hourly rows can lag the other stores by a few days. Share of day is the right way to compare stores, since dollar totals of the hours are not daily net sales for Ashland and Wadsworth.' };
  },
  async cookie_orders(a) {
    const d = await load(), from = a.from ? Date.parse(a.from) : -Infinity, to = a.to ? Date.parse(a.to) : Infinity;
    return { orders: d.cookieOrders.filter((o) => Date.parse(o.date) >= from && Date.parse(o.date) <= to), note: 'These are cookies ordered per store, not cookies sold. Only the Ashland store count exists in the cookie store log so far.' };
  },
};
async function runTool(name, input) {
  if (!run[name]) throw new Error('unknown tool ' + name);
  return run[name](input || {});
}
module.exports = { defs, runTool };
