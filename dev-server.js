/**
 * Local dev only — Vercel never runs this file.
 * It serves public/ and hands /api/* to the same functions Vercel will run,
 * so you can test the whole flow without installing the Vercel CLI.
 *
 *   npm run dev   ->  http://localhost:3000
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
               '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };

const routes = {
  '/api/config': (await import('./api/config.js')).default,
  '/api/generate': (await import('./api/generate.js')).default,
  '/api/feedback': (await import('./api/feedback.js')).default
};

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const handler = routes[pathname];
  if (handler) {
    try { await handler(req, res); }
    catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const rel = pathname === '/' ? '/index.html' : pathname;
  const file = path.join(ROOT, 'public', path.normalize(rel));
  if (!file.startsWith(path.join(ROOT, 'public'))) { res.statusCode = 403; return res.end('forbidden'); }
  try {
    const buf = await fs.readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.statusCode = 404; res.end('not found'); }
}).listen(PORT, () => {
  console.log(`\n  dev  →  http://localhost:${PORT}   (GVC Executive PG, Ashoka Heritage)`);
  console.log(process.env.GROQ_API_KEY ? '  GROQ_API_KEY loaded\n' : '  ⚠ GROQ_API_KEY missing — add it to .env\n');
});
