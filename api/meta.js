const { isAuthed } = require('../lib/auth');
const { getMeta } = require('../lib/google');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!isAuthed(req)) { res.status(401).json({ code: 'unauthorized', message: 'Signed out' }); return; }
  try { res.status(200).json(await getMeta(String(req.query.id || ''))); }
  catch (e) { res.status(e.code === 'blocked_by_policy' ? 403 : 502).json({ code: e.code || 'tool_error', message: e.message }); }
};
