const endpoint = process.env.KV_REST_API_URL
  || process.env.UPSTASH_REDIS_REST_URL
  || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN
  || process.env.UPSTASH_REDIS_REST_TOKEN
  || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN
  || process.env.UPSTASH_REDIS_REST_KV_REST_API_READ_WRITE_TOKEN;

export async function kv(command, ...parts) {
  if (!endpoint || !token) throw new Error('Missing Redis REST URL or token environment variables.');
  const path = [command, ...parts].map((part) => encodeURIComponent(String(part))).join('/');
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Storage request failed (${response.status}).`);
  const body = await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
