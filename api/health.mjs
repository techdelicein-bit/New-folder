import { json } from './_store.mjs';

export default function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  return json(res, 200, { status: 'ok', service: 'Nexora review intake' });
}
