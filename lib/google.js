// Reads the JDF sheets with a Google service account. Only the sheets listed here can be read,
// so the service account can never be used as a general purpose proxy.
const ALLOWED = new Set([
  '1WTbr7-glp5qvUaic9Rmlg8BsB1XbP1FbqHffaIDMf6g', // Monthly Sales Report
  '1j9Aep9pRCy-Os80DMD3zWnKCOpV3YVeakJuol9EqOE4', // Monthly LvsS Report
  '18lcS1wZobeEVDsP4sumjXqhn298XzpsGuhXShoAKcxM', // Sysco / Daily Numbers Log
  '1yXfOsp9E6Qaiwq02LfobMQRZqEGBzktxJM_zHQmzFjc', // Daily Tip Count
  '1PBd6rouiKWmcOYpfXfsGhzpYqXcL_d5120e2UN19dAA', // Enhancer Order / Inventory
  '1xqF-jZuhJUeitAZFKvudqB_2SqIFDO7vBU4KgBHRfg8', // Cookie Order / Inventory
  '1K2aGrtoBq_x2dTrzw3isz9fZ2ygDU16zGLZ2Y2jrDts', // PAR Ashland
  '10j2P0GsB3f-gUgjSYHzkjo4op2Ui9LZHHJhT8hULOh4', // PAR Wadsworth
  '1SGH3hq1KgAItnEksO7AiH0GrkYKVFUbtcH-9zrvYqPg', // PAR Massillon
]);
const RANGE_OK = /^[\w '&\-!:$.,()]{1,120}$/;

let clients = null;
function getClients() {
  if (clients) return clients;
  const { google } = require('googleapis');
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw Object.assign(new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set'), { code: 'tool_error' });
  const creds = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
  });
  clients = { sheets: google.sheets({ version: 'v4', auth }), drive: google.drive({ version: 'v3', auth }) };
  return clients;
}

const cache = new Map(); // short in memory cache so two viewers polling do not double the Google calls
async function cached(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit && hit.t > Date.now() - ttl) return hit.v;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  return v;
}
function mapError(e) {
  const status = e && (e.code || (e.response && e.response.status));
  if (status === 403 || status === 404) return Object.assign(new Error('Google refused this range. The sheet may not be shared with the dashboard service account.'), { code: 'tool_error' });
  if (status === 429) return Object.assign(new Error('Google is rate limiting reads. It will retry.'), { code: 'tool_error' });
  return Object.assign(new Error(e && e.message ? e.message : 'Google read failed'), { code: 'tool_error' });
}
async function getValues(id, range) {
  if (!ALLOWED.has(id)) throw Object.assign(new Error('Sheet not allowed'), { code: 'blocked_by_policy' });
  if (!RANGE_OK.test(range || '')) throw Object.assign(new Error('Bad range'), { code: 'tool_error' });
  return cached('v|' + id + '|' + range, 10000, async () => {
    try {
      const r = await getClients().sheets.spreadsheets.values.get({ spreadsheetId: id, range, majorDimension: 'ROWS' });
      return { range: r.data.range, values: r.data.values || [] };
    } catch (e) { throw mapError(e); }
  });
}
async function getMeta(id) {
  if (!ALLOWED.has(id)) throw Object.assign(new Error('Sheet not allowed'), { code: 'blocked_by_policy' });
  return cached('m|' + id, 30000, async () => {
    try {
      const r = await getClients().drive.files.get({ fileId: id, fields: 'id,name,modifiedTime', supportsAllDrives: true });
      return { id: r.data.id, name: r.data.name, modifiedTime: r.data.modifiedTime };
    } catch (e) { throw mapError(e); }
  });
}
module.exports = { getValues, getMeta, ALLOWED };
