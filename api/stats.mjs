import { json, kv } from './_store.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  try {
    const reviewRequests = Number(await kv('LLEN', 'nexora:requests'));
    return json(res, 200, { trackedNetworks: 4, reviewRequests, source: 'persistent KV storage' });
  } catch (error) {
    console.error('Nexora stats storage error:', error.message);
    return json(res, 503, { error: 'Persistent storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.' });
  }
}
