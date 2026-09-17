#!/usr/bin/env node
/**
 * Builds the QR + printable poster for this deployment's property (GVC Executive PG).
 *   npm run qr                          uses PUBLIC_URL from .env
 *   npm run qr -- https://your.app      override
 *
 * The QR encodes the bare deployment URL — no ?loc. Each property gets its own repo,
 * its own Vercel project and its own QR, so a scan cannot land on the wrong one.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCATIONS } from '../lib/business.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, '');

const has = (bin) => { try { execFileSync('which', [bin], { stdio: 'ignore' }); return true; } catch { return false; } };
const useQrencode = has('qrencode');

const makeQr = (url, pngPath) => {
  if (useQrencode) {
    execFileSync('qrencode', ['-o', pngPath, '-s', '14', '-m', '2', '-l', 'M', url]);
    return execFileSync('qrencode', ['-t', 'SVG', '-o', '-', '-m', '1', '-l', 'M', url], { encoding: 'utf8' });
  }
  execFileSync('npx', ['-y', 'qrcode', '-o', pngPath, '-w', '700', url], { stdio: 'inherit' });
  return execFileSync('npx', ['-y', 'qrcode', '-t', 'svg', url], { encoding: 'utf8' });
};

const poster = (loc, svg, url) => `<!doctype html>
<meta charset="utf-8"><title>${loc.name} — review QR</title>
<style>
  @page{size:A5;margin:0}
  body{margin:0;background:#f7f5f1;color:#1b1a18;
       font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       display:grid;place-items:center;min-height:100vh}
  .card{width:148mm;height:210mm;box-sizing:border-box;background:#fff;padding:18mm 14mm;
        display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  h1{font-size:27px;font-weight:640;letter-spacing:-.025em;margin:0}
  .tag{color:#6f6a62;font-size:15px;margin:6px 0 30px}
  .qr{width:76mm;height:76mm;padding:11px;border:1px solid #e6e2da;border-radius:18px}
  .qr svg{width:100%;height:100%;display:block}
  .cta{margin-top:26px;font-size:23px;font-weight:640;letter-spacing:-.02em}
  .why{margin-top:9px;color:#6f6a62;font-size:15px;max-width:88mm}
  .steps{margin-top:22px;color:#6f6a62;font-size:13.5px;line-height:1.9}
  .steps b{color:#c2410c}
  .contact{margin-top:auto;padding-top:20px;color:#8d877e;font-size:11.5px;line-height:1.55;max-width:100mm}
  .url{padding-top:8px;color:#c4bfb6;font-size:9.5px;word-break:break-all}
  @media print{body{background:#fff}.card{padding:16mm 12mm}}
</style>
<div class="card">
  <h1>${loc.name}</h1>
  <div class="tag">${loc.tagline}</div>
  <div class="qr">${svg.replace(/<\?xml[^>]*\?>|<!DOCTYPE[^>]*>/gi, '')}</div>
  <div class="cta">Scan to leave a review</div>
  <div class="why">Tap what was good. We'll write it for you.</div>
  <div class="steps"><b>1</b> Scan &nbsp;·&nbsp; <b>2</b> Tap a few things &nbsp;·&nbsp; <b>3</b> Post</div>
  <div class="contact">${loc.address ? loc.address + '<br>' : ''}${loc.phone || ''}</div>
  <div class="url">${url}</div>
</div>`;

for (const loc of Object.values(LOCATIONS)) {
  const url = `${base}/`;
  const png = path.join(ROOT, `qr-${loc.key}.png`);
  const svg = makeQr(url, png);
  fs.writeFileSync(path.join(ROOT, `qr-${loc.key}.svg`), svg);
  fs.writeFileSync(path.join(ROOT, `poster-${loc.key}.html`), poster(loc, svg, url));
  console.log(`  ${loc.name.padEnd(20)} ${url}`);
  console.log(`  ${''.padEnd(20)} qr-${loc.key}.png · poster-${loc.key}.html`);
}
console.log('\n  Open the poster files in a browser and print to A5.\n');
