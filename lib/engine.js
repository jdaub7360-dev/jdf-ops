// Loads the same parsing and calculation code the dashboard uses (src/engine*.js) for server side use.
const fs = require('node:fs');
const path = require('node:path');
let cached = null;
function eng() {
  if (cached) return cached;
  const dir = path.join(process.cwd(), 'src');
  const code = ['engine.js', 'engine2.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  cached = new Function(code + '\nreturn {parseHourly,computeHourly,parseGrid,computeLive,parseEnhTotals,parseEnhUsage,parseEnhOrder,computeEnh,parseEnhStoreLog,computeStoreBurn,analysePar,parseCookieTotals,isoDate,num,CFG};')();
  return cached;
}
module.exports = { eng };
