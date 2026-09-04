/** Small helpers so the API files stay readable. Works on Vercel's Node runtime and on the local dev server. */

export const json = (res, code, body) => {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

/** Vercel parses JSON bodies for us; the local dev server does not. Handle both. */
export const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 32 * 1024) throw new Error('Request too large');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON body'); }
};

export const clientIp = (req) =>
  (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown').trim();

/**
 * Best-effort per-IP limit. Serverless instances are recycled, so this is a speed bump against
 * one phone spamming the endpoint, not a hard guarantee. Move to Upstash/Vercel KV if abuse shows up.
 */
const seen = new Map();
export const overLimit = (ip, max = 12, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const hits = (seen.get(ip) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 2000) seen.clear();
  return hits.length > max;
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
