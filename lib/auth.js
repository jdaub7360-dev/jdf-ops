const crypto = require('node:crypto');
const COOKIE = 'jdf_session';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET must be set to a random string of at least 24 characters');
  return s;
}
const mac = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');

function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return exp + '.' + mac(exp);
}
function verifyToken(tok) {
  if (!tok || typeof tok !== 'string') return false;
  const i = tok.indexOf('.');
  if (i < 1) return false;
  const exp = tok.slice(0, i), sig = tok.slice(i + 1);
  const want = mac(exp);
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now() / 1000;
}
function readCookie(req, name) {
  const h = req.headers.cookie || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
const isAuthed = (req) => verifyToken(readCookie(req, COOKIE));
const sessionCookie = (tok) => `${COOKIE}=${encodeURIComponent(tok)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

function passwordOk(given) {
  const want = process.env.APP_PASSWORD || '';
  if (!want) return false;
  // hash both so lengths match and comparison time does not leak the length
  const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
  return crypto.timingSafeEqual(h(given), h(want));
}
module.exports = { isAuthed, makeToken, sessionCookie, clearCookie, passwordOk };
