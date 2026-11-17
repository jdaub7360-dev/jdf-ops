// Unit checks for Sysco item burn (store PAR sheet Burn Rate tabs) and the Sysco spend trend.
const assert = require('assert');
const { eng } = require('../lib/engine');
const E = eng();
const P = require('./parburn.fixture.json');
// quantities in the store's own words
assert.strictEqual(E.qtyNum('NONE'), 0, 'NONE is a real zero');
assert.strictEqual(E.qtyNum('2 1/2 box'), 2.5);
assert.strictEqual(E.qtyNum('3/4 box'), 0.75);
assert.strictEqual(E.qtyNum('1 BAG'), 1);
assert.strictEqual(E.qtyNum('12 bottles (24 oz)'), 12);
assert.strictEqual(E.qtyNum(''), null);
// parsing: Massillon has a header row, Ashland has none, a missing tab gives nothing
const m = E.parseBurnPar(P.Massillon, 'Massillon'), a = E.parseBurnPar(P.Ashland, 'Ashland');
assert.strictEqual(m.length, 10, 'header row is skipped');
assert.strictEqual(a.length, 4, 'headerless tab keeps every row');
assert.strictEqual(E.parseBurnPar(undefined, 'Wadsworth').length, 0);
assert.strictEqual(m.find((r) => r.item === 'Peaches').burn, null, 'blank burn stays blank, never zero');
assert.strictEqual(m.find((r) => r.item === 'Strawberries').burn, 0, 'an explicit zero burn stays zero');
assert.strictEqual(m.find((r) => r.item === 'Avocado').stockTxt, '10 package', 'on hand text is trimmed');
// states and sort order
const b = E.computeBurn([], [], m.concat(a));
const st = (s, i) => b.kinds.par[s].rows.find((r) => r.item === i).st;
assert.strictEqual(st('Massillon', 'Ginger'), 'out');
assert.strictEqual(st('Massillon', 'Oranges'), 'under2');
assert.strictEqual(st('Massillon', 'Heavy Whipping Cream'), 'ok');
assert.strictEqual(st('Massillon', 'Strawberries'), 'idle', 'zero burn with no cover is no use, not a blank');
assert.strictEqual(st('Massillon', 'Peaches'), 'pending');
assert.deepStrictEqual(b.kinds.par.Massillon.rows.slice(0, 3).map((r) => r.item), ['Ginger', 'Celery', 'Oranges'], 'out first, then tightest cover');
assert.strictEqual(b.kinds.par.Wadsworth.rows.length, 0);
assert.strictEqual(b.kinds.par.Massillon.last, '2026-11-16');
assert.ok(b.attention.some((x) => x.kind === 'par' && x.item === 'Ginger' && x.st === 'out'));
assert.ok(b.attention.some((x) => x.kind === 'par' && x.store === 'Ashland' && x.item === 'Mangos'));
assert.ok(!b.attention.some((x) => x.item === 'Heavy Whipping Cream'));
// enhancers and cookies keep their own rules: a zero burn with no cover is still not computable there
const enh = [{ store: 'Ashland', item: 'Whey', count: '2026-11-08', stock: 3, used: 0, burn: 0, co: null, cover: null, runout: null, note: '' }];
assert.strictEqual(E.computeBurn(enh, [], []).kinds.enh.Ashland.rows[0].st, 'pending');
// spend trend: only weeks where all three stores logged two orders
const wk = (week, o) => ({ week, orders: o[0], n: o[1], sales: 1, pct: 1 });
const weeks = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16'];
const mk = (vals, lastN) => weeks.map((w, i) => wk(w, [vals[i], i === 6 ? lastN : 2]));
const sy = { Ashland: mk([100, 200, 300, 400, 500, 600, 50], 1), Wadsworth: mk([10, 20, 30, 40, 50, 60, 5], 1), Massillon: mk([1, 2, 3, 4, 5, 6, 5], 2) };
const sp = E.syscoSpend(sy);
assert.deepStrictEqual(sp.weeks, weeks.slice(0, 6), 'the partial week is left out for every store');
assert.strictEqual(sp.stores.Ashland.avg4, 450, 'average of the last four full weeks');
assert.strictEqual(sp.stores.Ashland.prev4, null, 'only six full weeks, so no four week comparison yet');
const sy2 = {};
['Ashland', 'Wadsworth', 'Massillon'].forEach((s) => { sy2[s] = Array.from({ length: 9 }, (_, i) => wk('w' + i, [100 + i * 10, 2])); });
const sp2 = E.syscoSpend(sy2);
assert.strictEqual(sp2.stores.Ashland.avg4, 165);
assert.strictEqual(sp2.stores.Ashland.prev4, 125);
assert.strictEqual(sp2.stores.Ashland.chg, 32);
// last order and days since
const T = (m, d) => Date.UTC(2026, m - 1, d);
const last = E.syscoLast({ Ashland: [{ t: T(11, 12), total: 1610.15 }, { t: T(11, 15), total: 1776.08 }], Wadsworth: [], Massillon: [{ t: T(11, 16), total: 1128.07 }] }, T(11, 17));
assert.deepStrictEqual(last.Ashland, { date: '2026-11-15', total: 1776.08, days: 2 });
assert.strictEqual(last.Wadsworth, null);
assert.strictEqual(last.Massillon.days, 1);
console.log('sysco burn ok');
