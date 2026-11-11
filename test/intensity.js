// Unit checks for usage intensity: tubs used per $1,000 of net sales over the same clean cycles that drive burn.
const assert = require('assert');
const { eng } = require('../lib/engine');
const E = eng();
const T = (m, d, y = 2026) => Date.UTC(y, m - 1, d);
const log = [];
const add = (store, y, m, d, stock, recv) => log.push({ t: T(m, d, y), store, item: 'Whey', stock, recv });
// Ashland: two clean cycles, Sep 23 to Oct 14 (used 4) and Oct 14 to Nov 4 (used 5)
add('Ashland', 2026, 9, 23, 10, null); add('Ashland', 2026, 10, 14, 8, 2); // used 4
add('Ashland', 2026, 11, 4, 5, 2);                                          // 8+2-5 = 5
add('Wadsworth', 2026, 10, 14, 20, null); add('Wadsworth', 2026, 11, 4, 9, 0); // used 11
add('Massillon', 2026, 10, 14, 15, null); add('Massillon', 2026, 11, 4, 9, 0); // used 6
add('Massillon', 2026, 12, 20, 9, null);                                       // blank received, skipped
const grid = (fn) => { const days = {}; for (let d = 1; d <= 31; d++) days[d] = Array(12).fill(null); fn(days); return { days, years: {}, pct: {} }; };
const fill = (days, m, a, b, v) => { for (let d = a; d <= b; d++) days[d][m - 1] = v; };
const S = {
  Ashland: grid((D) => { fill(D, 9, 24, 30, 1000); fill(D, 10, 1, 31, 1000); fill(D, 11, 1, 4, 1000); D[23][8] = 99999; D[5][10] = 99999; }),
  Wadsworth: grid((D) => { fill(D, 10, 15, 31, 500); fill(D, 11, 1, 4, 500); D[14][9] = 99999; D[5][10] = 99999; }),
  Massillon: grid((D) => { fill(D, 10, 15, 31, 750); fill(D, 11, 1, 3, 750); /* Nov 4 missing */ }),
};
let burn = E.computeStoreBurn(log, E.salesLookup(S, 2026));
// span is the days after the earlier count through the later count date
assert.strictEqual(burn.Whey.Ashland.cycles, 2);
assert.strictEqual(burn.Whey.Ashland.used, 9);
assert.strictEqual(burn.Whey.Ashland.sales, 42000);
assert.strictEqual(burn.Whey.Ashland.inten, Math.round(9 / 42000 * 1000 * 1000) / 1000);
// burn is unchanged: mean of 4/21*7 and 5/21*7
assert.strictEqual(burn.Whey.Ashland.burn, Math.round(((4 / 21 * 7) + (5 / 21 * 7)) / 2 * 100) / 100);
assert.strictEqual(burn.Whey.Wadsworth.inten, Math.round(11 / 10500 * 1000 * 1000) / 1000);
// a store with a missing sales day keeps its burn but gets no intensity, never zero and never an estimate
assert.strictEqual(burn.Whey.Massillon.burn, Math.round(6 / 21 * 7 * 100) / 100);
assert.strictEqual(burn.Whey.Massillon.inten, null);
// company intensity is total use over total sales for the stores that have it, and the 1.5 times flag compares to the lowest
let I = E.enhIntensity(burn).Whey;
assert.deepStrictEqual(I.stores.sort(), ['Ashland', 'Wadsworth']);
assert.strictEqual(I.co, Math.round((9 + 11) / (42000 + 10500) * 1000 * 1000) / 1000);
assert.ok(I.flags.Wadsworth >= 1.5 && !I.flags.Ashland);
// stores that used under 1 tub are never compared, so quarter tub count rounding is not flagged
assert.deepStrictEqual(E.enhIntensity({ Item: { A: { inten: 0.2, used: 0.25, sales: 1000 }, B: { inten: 1.5, used: 1.5, sales: 1000 } } }).Item.flags, {});
// no sales source means no intensity at all, and a cycle in another year has none either
burn = E.computeStoreBurn(log);
assert.strictEqual(burn.Whey.Ashland.inten, null);
assert.strictEqual(burn.Whey.Ashland.burn > 0, true);
const log2 = [{ t: T(12, 20, 2025), store: 'Ashland', item: 'Mix', stock: 5, recv: null }, { t: T(1, 10), store: 'Ashland', item: 'Mix', stock: 3, recv: 0 }];
assert.strictEqual(E.computeStoreBurn(log2, E.salesLookup(S, 2026)).Mix.Ashland.inten, null);
// flag needs two stores and a lowest above zero, and equals exactly 1.5 counts
const fake = { Item: { A: { inten: 1, used: 1, sales: 1000 }, B: { inten: 1.5, used: 1.5, sales: 1000 } } };
assert.ok(E.enhIntensity(fake).Item.flags.B === 1.5);
assert.deepStrictEqual(E.enhIntensity({ Item: { A: { inten: 1, used: 1, sales: 1000 } } }).Item.flags, {});
assert.deepStrictEqual(E.enhIntensity({ Item: { A: { inten: 0, used: 0, sales: 1000 }, B: { inten: 2, used: 2, sales: 1000 } } }).Item.flags, {});
console.log('intensity ok');
