// Shared "ordered" marks for the Overview to order list.
// Uses Supabase (table order_marks) when SUPABASE_URL and SUPABASE_SERVICE_KEY are set, so both phones see the same marks.
// Without Supabase it answers shared:false and the page keeps marks in that browser only.
const { isAuthed } = require('../lib/auth');
const on = () => process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY;
const hdr = () => ({ apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' });
const base = () => process.env.SUPABASE_URL + '/rest/v1/order_marks';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!isAuthed(req)) { res.status(401).json({ message: 'Signed out' }); return; }
  if (!on()) { res.status(200).json({ shared: false, marks: {} }); return; }
  try {
    if (req.method === 'GET') {
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const r = await fetch(`${base()}?select=key,marked_at,stock&marked_at=gte.${encodeURIComponent(since)}&limit=1000`, { headers: hdr() });
      if (!r.ok) throw new Error('read ' + r.status);
      const marks = {};
      (await r.json()).forEach((x) => { marks[x.key] = { at: Date.parse(x.marked_at), stock: x.stock == null ? null : Number(x.stock) }; });
      res.status(200).json({ shared: true, marks }); return;
    }
    if (req.method !== 'POST') { res.status(405).json({ message: 'GET or POST only' }); return; }
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    const key = String((b && b.key) || '').slice(0, 200);
    if (!key) { res.status(400).json({ message: 'Missing key' }); return; }
    if (b.action === 'undo') {
      const r = await fetch(`${base()}?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE', headers: hdr() });
      if (!r.ok) throw new Error('delete ' + r.status);
    } else {
      const stock = b.stock == null || !Number.isFinite(Number(b.stock)) ? null : Number(b.stock);
      const r = await fetch(base(), { method: 'POST', headers: { ...hdr(), Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ key, marked_at: new Date().toISOString(), stock }]) });
      if (!r.ok) throw new Error('write ' + r.status);
    }
    res.status(200).json({ shared: true, ok: true });
  } catch (e) { res.status(502).json({ message: 'Could not save that. Try again.' }); }
};
