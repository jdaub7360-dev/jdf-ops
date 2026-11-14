const assert=require('assert'),E=require('../src/engine2.js');
const H=["Store","First Name","Last Name","Key","Base Hourly Rate","Notes","Hire Date","Last Pay Raise Date","Seasonal","Flags"];
const r=E.computeRoster([H,["Ashland","A","One","X","13","","2024-01-01","2026-05-13"],["Ashland","B","Two","X","13","","2024-01-01","2026-05-14"],["Ashland","C","Three","X","13","","2024-01-01","2025-11-13"],["Ashland","D","Four","X","13","","2024-01-01","2025-11-14"],["Wadsworth","E","Five","X","13","","2026-10-01",""],["Wadsworth","F","Six","X","13","","",""],["Nowhere","G","Seven","X","13","","2020-01-01",""]],'2026-11-13');
const by=n=>r.stores.Ashland.concat(r.stores.Wadsworth).find(x=>x.name===n);
assert.strictEqual(by('A One').level,'yellow');// exactly 6 months
assert.strictEqual(by('B Two').level,'ok');// one day short of 6 months
assert.strictEqual(by('C Three').level,'red');// exactly 12 months
assert.strictEqual(by('D Four').level,'yellow');// one day short of 12 months
assert.strictEqual(by('E Five').since,'hire');// no raise recorded, hire date used
assert.strictEqual(by('F Six').level,null);// no dates, no flag
assert.strictEqual(r.total,6);assert.strictEqual(r.red,1);assert.strictEqual(r.yellow,2);assert.strictEqual(r.unknown,1);
assert.deepStrictEqual(E.computeRoster([],'2026-11-13').total,0);
console.log('roster ok');
