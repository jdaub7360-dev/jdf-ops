// Local test server: real route handlers, Google replaced by the sample data in src/fixtures.json.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-test-secret-test-secret';
process.env.APP_PASSWORD = process.env.APP_PASSWORD || 'test-pass';
const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const F = require('../src/fixtures.json');
const g = require('../lib/google');
const parById = { '1K2a': 'Ashland', '10j2': 'Wadsworth', '1SGH': 'Massillon' };
g.getValues = async (id, range) => {
  if (!g.ALLOWED.has(id)) throw Object.assign(new Error('Sheet not allowed'), { code: 'blocked_by_policy' });
  const tab = range.split('!')[0].replace(/'/g, '');
  let v;
  if (id.startsWith('1WTb')) v = F.sales[tab];
  else if (id.startsWith('1j9A')) v = F.labor[tab];
  else if (id.startsWith('18lc')) v = F.sysco;
  else if (id.startsWith('1yXf')) v = range.startsWith('Summary') ? F.tips.summary : F.tips.tabs[tab];
  else if (id.startsWith('1PBd')) v = tab === 'Totals' ? F.enh.totals : tab === 'Usage' ? F.enh.usage : tab === 'Order' ? F.enh.order : tab === 'Enhancer Store Log' ? F.enh.storelog : F.enh.gnc;
  else if (id.startsWith('1xqF')) v = range.startsWith('Totals') ? F.cookie.totals : F.cookie.orders;
  else { const k = Object.keys(parById).find((x) => id.startsWith(x)); v = F.par[parById[k]]; }
  if (!v) throw Object.assign(new Error('no sample data'), { code: 'tool_error' });
  return { range, values: v };
};
g.getMeta = async (id) => ({ id, name: 'sample', modifiedTime: '2026-11-08T15:00:00Z' });

process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.ANTHROPIC_BASE_URL = 'http://localhost:3918';
// fake Anthropic: first call asks for weekday_stats, second call answers from the tool result
http.createServer(async (rq, rs) => { let b = ''; for await (const c of rq) b += c; const j = JSON.parse(b || '{}'); const last = j.messages[j.messages.length - 1];
  rs.setHeader('Content-Type', 'application/json');
  if (Array.isArray(last.content) && last.content[0] && last.content[0].type === 'tool_result') { const r = JSON.parse(last.content[0].content); const x = r.results && r.results[0]; rs.end(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Result for ' + (x ? x.store + ' ' + x.weekday + ' average ' + x.average_sales + ' over ' + x.days_counted + ' days' : JSON.stringify(r).slice(0, 80)) }] })); }
  else rs.end(JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'weekday_stats', input: { from: '2026-10-01', to: '2026-11-09', weekdays: ['Saturday'] } }] }));
}).listen(3918);
const routes = { '/': 'app', '/api/app': 'app', '/api/login': 'login', '/api/logout': 'logout', '/api/sheets': 'sheets', '/api/meta': 'meta', '/api/ask': 'ask' };
const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  const name = routes[u.pathname];
  if (!name) { res.statusCode = 404; res.end('not found'); return; }
  req.query = u.query;
  let body = '';
  for await (const c of req) body += c;
  try { req.body = body ? JSON.parse(body) : {}; } catch (e) { req.body = {}; }
  res.status = (n) => { res.statusCode = n; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  res.send = (s) => res.end(s);
  // the test runs over plain http, so drop the Secure flag the way a browser on localhost allows
  const set = res.setHeader.bind(res);
  res.setHeader = (k, v) => set(k, k.toLowerCase() === 'set-cookie' ? String(v).replace('; Secure', '') : v);
  await require(path.join('..', 'api', name))(req, res);
});
const port = Number(process.env.PORT || 3917);
server.listen(port, () => console.log('test server on', port));
