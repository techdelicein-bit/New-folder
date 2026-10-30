# Nexora

An independent on-chain research landing page with a small Node.js backend for contract review intake.

## Run locally

Requires Node.js 18 or newer. From this folder, run:

```sh
npm start
```

Then open <http://localhost:3000>.

## Backend

- `GET /api/health` reports whether the server is running.
- `GET /api/stats` returns the number of locally stored review intake requests.
- `POST /api/verifications` accepts `{ "address": "0x…", "network": "Ethereum" }` for Ethereum, BNB Chain, Polygon, or Arbitrum.
- Requests are appended to `data/verifications.jsonl` and receive a `queued` status.

### Deploy on Vercel

The `api/` folder contains Vercel serverless handlers, separate from the browser script in `app.js`. Configure a Vercel KV compatible REST store, then add `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's Environment Variables before deploying. The local Node server continues to use the JSONL file.

This is an intake demo only. It does not connect to a chain, inspect bytecode, perform an audit, or certify contracts. Use HTTPS and a production database before exposing it publicly.
