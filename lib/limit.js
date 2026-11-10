// Login lockout: 5 failed passwords from one address in 15 minutes blocks further tries.
// Uses Supabase when SUPABASE_URL and SUPABASE_SERVICE_KEY are set, otherwise a per instance
// memory fallback (weaker, because serverless instances restart).
const WINDOW_MS = 15 * 60 * 1000, MAX_FAILS = 5;
const mem = new Map();

const sb = () => process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;
const hdr = () => ({ apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' });

function ipOf(req) {
  const xf = req.headers['x-forwarded-for'];
  return (xf ? String(xf).split(',')[0] : req.socket && req.socket.remoteAddress || 'unknown').trim();
}
async function isBlocked(ip) {
  if (sb()) {
    try {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/login_attempts?ip=eq.${encodeURIComponent(ip)}&at=gte.${encodeURIComponent(since)}&select=id`, { headers: { ...hdr(), Prefer: 'count=exact', Range: '0-0' } });
      const range = r.headers.get('content-range') || '';
      const n = Number(range.split('/')[1]);
      return Number.isFinite(n) && n >= MAX_FAILS;
    } catch (e) { /* fall through to memory */ }
  }
  const a = (mem.get(ip) || []).filter((t) => t > Date.now() - WINDOW_MS);
  mem.set(ip, a);
  return a.length >= MAX_FAILS;
}
async function recordFail(ip) {
  if (sb()) {
    try {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/login_attempts`, { method: 'POST', headers: hdr(), body: JSON.stringify({ ip }) });
      return;
    } catch (e) { /* fall through */ }
  }
  const a = (mem.get(ip) || []).filter((t) => t > Date.now() - WINDOW_MS);
  a.push(Date.now());
  mem.set(ip, a);
}
module.exports = { ipOf, isBlocked, recordFail };
