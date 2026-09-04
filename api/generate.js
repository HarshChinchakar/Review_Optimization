import { getLocation, pickLength } from '../lib/business.js';
import { json, readBody, clientIp, overLimit } from '../lib/http.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retires models fairly often. First one that answers wins; the list is the safety net.
const MODELS = [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
  .filter(Boolean)
  .filter((m, i, a) => a.indexOf(m) === i);

const systemPrompt = () => [
  'You write short Google reviews on behalf of a real customer who is standing in front of you, using only what they told you.',
  '',
  'Absolute rules:',
  '1. Never invent a fact. No prices, rent amounts, dates, durations, room numbers, staff names, comparisons to other places, or outcomes the customer did not give you.',
  '2. Do not embellish around a point either. If they tapped "clean rooms", do not add fresh linens, tidy common areas or regular housekeeping. If they tapped nothing about the food, the move-in or the rent, those must not appear at all. Three taps means a three-tap review; a short honest review is the goal, not a full one.',
  '3. Only expand the points the customer selected. If a supplied keyword phrase does not fit what they selected, drop it. Never list keywords, never write more than two or three of them, and never let a sentence read like a search query.',
  '4. Sound like an ordinary person typing on a phone in Indian English. Contractions are fine. Simple words. No marketing voice, no "nestled", no "top-notch", no "highly recommend to anyone looking for", no em dashes, no hashtags, no emoji, no bullet points, no headings.',
  '5. Vary your sentence rhythm. Do not start with "I recently" or "I have been staying". Never begin with the business name.',
  '6. Mention the business name once, naturally, and the area only if it fits. Both are optional if the review is very short.',
  '7. If the customer wrote a note describing a problem, say it honestly and plainly. Do not paper over it and do not turn a complaint into praise.',
  '8. Write only the review text. No quotation marks around it, no preamble, no sign-off, no title.',
  '',
  'Reply with the review text and nothing else. No JSON, no quotes around it, no label, no explanation.'
].join('\n');

const userPrompt = ({ loc, chips, note, length, angle, previous }) => {
  const lines = [
    `Business: ${loc.name} — ${loc.what} in ${loc.city}.`,
    '',
    'What the customer tapped, and the search wording each tap stands for:',
    ...chips.map((c) => `- "${c.label}" → ${c.seo}`),
    '',
    note ? `The customer also typed: "${note}"` : 'The customer did not type anything extra.',
    '',
    `Length: ${length.hint}.`,
    `Open with what they said about "${angle.label}", then cover the rest of their taps if the length allows. Do not mention anything outside their taps.`
  ];
  if (previous) {
    lines.push(
      '',
      'They asked for different wording. Here is the version they did not like:',
      `"${previous}"`,
      'Write a clearly different one: different opening, different order, different sentence shapes. Same facts.'
    );
  }
  return lines.join('\n');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  if (!process.env.GROQ_API_KEY) {
    return json(res, 503, { error: 'The review writer is not configured yet. (GROQ_API_KEY is missing on the server.)' });
  }
  if (overLimit(clientIp(req))) {
    return json(res, 429, { error: 'That is a lot of reviews from one phone. Try again in a little while.' });
  }

  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { error: e.message }); }

  const loc = getLocation(body.loc);
  const known = new Map([...loc.priority, ...loc.pool].map((c) => [c.id, c]));
  const chips = (Array.isArray(body.chips) ? body.chips : []).map((id) => known.get(id)).filter(Boolean).slice(0, 10);

  if (!chips.length) return json(res, 400, { error: 'Pick at least one thing first.' });

  const note = String(body.note || '').slice(0, 300).trim();
  const previous = String(body.previous || '').slice(0, 1200).trim();
  const length = pickLength(chips.length);
  // The opening facet is drawn from what they actually tapped — picking it from a global list
  // made the model open with move-in or rent claims nobody had selected.
  const angle = chips[Math.floor(Math.random() * chips.length)];

  // One overall budget for the whole thing (Vercel's function limit is 30s), with a
  // shorter timeout on each individual attempt. A single controller spanning the retries
  // aborted them mid-flight, which surfaced as a generic error with nothing in the logs.
  const deadline = Date.now() + 24000;
  const remaining = () => deadline - Date.now();

  const callModel = async (model) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(9000, Math.max(1000, remaining())));
    try {
      return await fetch(GROQ_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          // High enough that two residents tapping the same chips don't get the same paragraph.
          temperature: 1.0,
          top_p: 0.95,
          max_tokens: 320,
          // gpt-oss models think before answering; at default effort they sometimes return an empty
          // completion, and the extra latency is dead weight for a task this small.
          ...(model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
          messages: [
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: userPrompt({ loc, chips, note, length, angle, previous }) }
          ]
        })
      });
    } finally {
      clearTimeout(timer);
    }
  };

  const attempt = async () => {
    let r;
    for (const model of MODELS) {
      if (remaining() < 1500) break;
      try {
        r = await callModel(model);
      } catch (err) {
        console.error('[groq]', model, err.name, err.message);
        continue;   // timed out or the connection failed; the next model gets a fresh try
      }
      if (r.ok) break;
      console.error('[groq]', model, r.status, (await r.text()).slice(0, 300));
      // Retired model (404), refused shape (400), or this model's per-minute quota is full (429).
      // Each model has its own bucket on Groq, so falling through is a real fix, not a retry loop.
      if (![404, 400, 429].includes(r.status)) break;
    }
    return r;
  };

  try {
    let r = await attempt();
    // On Groq's free tier (8k tokens/min) two people scanning in the same minute collide.
    // A quiet wait beats telling a resident to come back later.
    while (r && r.status === 429 && remaining() > 8000) {
      await new Promise((done) => setTimeout(done, 2500));
      r = await attempt();
    }

    if (!r || !r.ok) {
      const status = r?.status;
      const msg = status === 401 ? 'The review writer key was rejected. Check GROQ_API_KEY.'
        : status === 429 ? 'The review writer is busy right now. Try again in a moment.'
        : 'Could not write the review just now. Try again.';
      return json(res, 502, { error: msg });
    }

    const data = await r.json();
    const review = String(data.choices?.[0]?.message?.content || '')
      .replace(/^\s*(?:here(?:'s| is)[^:]*:|review:)\s*/i, '')  // strip any preamble the model adds
      .replace(/[\u2010-\u2015]/g, '-')   // non-breaking hyphens / en / em dashes -> plain hyphen
      .replace(/\s-\s/g, ', ')            // a dash used as a pause reads as machine writing
      .replace(/[\u2018\u2019]/g, "'")    // smart quotes -> what an Android keyboard types
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!review) return json(res, 502, { error: 'Could not write the review just now. Try again.' });

    console.log(JSON.stringify({ at: new Date().toISOString(), event: 'generated', loc: loc.key, model: data.model, chips: chips.map(c => c.id), length: length.key, chars: review.length }));
    return json(res, 200, { review, length: length.key });
  } catch (err) {
    console.error('[generate]', err.name, err.message);
    const msg = err.name === 'AbortError' ? 'That took too long. Try again.' : 'Something went wrong writing the review.';
    return json(res, 502, { error: msg });
  }
}
