import { randomUUID } from 'node:crypto';
import { json, kv } from './_store.mjs';

const networks = new Set(['Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  const address = String(req.body?.address || '').trim();
  const network = String(req.body?.network || '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return json(res, 400, { error: 'Enter a valid 42-character EVM contract address.' });
  if (!networks.has(network)) return json(res, 400, { error: 'Choose a supported network.' });
  const record = { id: randomUUID(), address, network, status: 'queued', createdAt: new Date().toISOString() };
  try {
    await kv('LPUSH', 'nexora:requests', JSON.stringify(record));
    return json(res, 201, { id: record.id, status: record.status, message: 'Request received. This demo records an intake request; it does not run an audit or certify a contract.' });
  } catch (error) {
    console.error('Nexora submission storage error:', error.message);
    return json(res, 503, { error: 'Persistent storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' });
  }
}
