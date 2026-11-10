const { passwordOk, makeToken, sessionCookie } = require('../lib/auth');
const { ipOf, isBlocked, recordFail } = require('../lib/limit');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ message: 'POST only' }); return; }
  const ip = ipOf(req);
  if (await isBlocked(ip)) { res.status(429).json({ message: 'Too many wrong passwords. Wait 15 minutes and try again.' }); return; }
  let pw = '';
  try { pw = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}).password || ''; } catch (e) { /* empty */ }
  if (!passwordOk(pw)) { await recordFail(ip); res.status(401).json({ message: 'That password is not right.' }); return; }
  res.setHeader('Set-Cookie', sessionCookie(makeToken()));
  res.status(200).json({ ok: true });
};
