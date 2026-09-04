import { json, readBody } from '../lib/http.js';

/**
 * POST /api/feedback — two jobs:
 *   1. the private "something wasn't right" path (available to everyone, never a replacement for the public one)
 *   2. funnel counters: scanned / generated / copied
 *
 * Vercel's filesystem is read-only, so this writes to the function log. Read it with `vercel logs`,
 * or drop in Upstash/Vercel KV when the volume justifies a real store.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { error: e.message }); }

  const row = {
    at: new Date().toISOString(),
    event: String(body.event || 'note').slice(0, 32),
    loc: String(body.loc || '').slice(0, 32),
    chips: Array.isArray(body.chips) ? body.chips.slice(0, 12) : [],
    message: String(body.message || '').slice(0, 2000),
    contact: String(body.contact || '').slice(0, 120)
  };

  console.log(JSON.stringify(row));
  return json(res, 200, { ok: true });
}
