import { createServer } from 'node:http';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = join(root, 'data');
const requestsFile = join(dataDir, 'verifications.jsonl');
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

await mkdir(dataDir, { recursive: true });
if (!existsSync(requestsFile)) await appendFile(requestsFile, '');

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'" });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readRequests() {
  const raw = await readFile(requestsFile, 'utf8');
  return raw.split('\n').filter(Boolean).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok', service: 'Nexora review intake' });
  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const requests = await readRequests();
    return send(res, 200, { trackedNetworks: 4, reviewRequests: requests.length, source: 'local application data' });
  }
  if (req.method === 'POST' && url.pathname === '/api/verifications') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 4096) return send(res, 413, { error: 'Request is too large.' });
    }
    let body;
    try { body = JSON.parse(raw || '{}'); } catch { return send(res, 400, { error: 'Please submit valid form data.' }); }
    const address = String(body.address || '').trim();
    const network = String(body.network || '').trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return send(res, 400, { error: 'Enter a valid 42-character EVM contract address.' });
    if (!['Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum'].includes(network)) return send(res, 400, { error: 'Choose a supported network.' });
    const record = { id: randomUUID(), address, network, status: 'queued', createdAt: new Date().toISOString() };
    await appendFile(requestsFile, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
    return send(res, 201, { id: record.id, status: record.status, message: 'Request received. This demo records an intake request; it does not run an audit or certify a contract.' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res, 400, { error: 'Invalid URL.' }); }
  if (pathname === '/') pathname = '/index.html';
  if (!['/index.html', '/styles.css', '/app.js'].includes(pathname)) return send(res, 404, { error: 'Not found.' });
  const file = normalize(join(root, pathname));
  try { return send(res, 200, await readFile(file), types[extname(file)] || 'application/octet-stream'); }
  catch { return send(res, 404, { error: 'Not found.' }); }
});

server.listen(port, () => console.log(`Nexora is running at http://localhost:${port}`));
