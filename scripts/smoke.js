#!/usr/bin/env node
/** Calls the real generate handler a few times so you can eyeball the writing quality. */
import handler from '../api/generate.js';

const fakeRes = () => {
  let code = 200;
  return {
    statusCode: 200, setHeader() {},
    set statusCodeSetter(v) {},
    end(body) { this._body = body; },
    get result() { return { code: this.statusCode, body: JSON.parse(this._body || '{}') }; }
  };
};

const run = async (loc, chips, note = '') => {
  const req = { method: 'POST', headers: {}, socket: { remoteAddress: '127.0.0.' + Math.floor(Math.random() * 250) },
                body: { loc, chips, note } };
  const res = fakeRes();
  await handler(req, res);
  const { code, body } = res.result;
  if (code !== 200) return console.log(`  ✗ [${loc}] ${code} ${body.error}`);
  console.log(`\n  [${loc} · ${body.length} · ${chips.join(', ')}]\n  ${body.review}`);
};

console.log('Generating sample reviews…');
await run('executive', ['location', 'wifi', 'clean']);
await run('executive', ['location', 'wifi', 'clean']);       // same taps, must read differently
await run('executive', ['safe', 'security', 'ownercheck', 'people', 'rules']);
await run('executive', ['kitchen', 'shops']);
await run('executive', ['nohidden', 'staff', 'fixes']);
await run('executive', ['clean', 'utilities'], 'the wifi drops sometimes in the evening');
await run('executive', ['location', 'transport', 'best', 'balcony', 'common', 'airy']);
console.log('');
