import { getLocation, pickLength, pickVoice, pickAnchors, seoFor } from '../lib/business.js';
import { json, readBody, clientIp, overLimit } from '../lib/http.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retires models fairly often. First one that answers wins; the list is the safety net.
const MODELS = [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
  .filter(Boolean)
  .filter((m, i, a) => a.indexOf(m) === i);

/**
 * The resident's taps are the subject of the review. The fact sheet is its boundary.
 *
 * Those are two different jobs and the prompt keeps them apart on purpose. Handing the model
 * the full fact sheet without the second rule below produced complete brochures for people who
 * had tapped two chips; withholding it entirely sent the model reaching for the generic PG
 * details it already knows - meals, AC, laundry, a rent figure - none of which are true here.
 */
const systemPrompt = (loc) => [
  `You are helping a real resident of ${loc.name} turn a few taps into the Google review they would have written themselves, if they had the time.`,
  'You are not writing marketing copy. You are not a brand voice. You are one ordinary person typing on a phone.',
  '',
  'THE ONLY TRUE FACTS ABOUT THIS PLACE',
  ...loc.facts.map((f) => `- ${f}`),
  '',
  'That list is exhaustive. Anything not on it is not true here and must never appear, however ordinary it sounds for a PG.',
  'Specifically absent, and therefore forbidden: meals, mess or tiffin service, AC, hot water or geysers, laundry or ironing service, room-sharing types, furniture, no-brokerage or deposit claims, rent amounts, gate or curfew timings, and any named nearby place other than the ones listed above.',
  '',
  'WHAT THE REVIEW IS ABOUT',
  '1. Write only about the points the resident tapped. The fact sheet is the boundary of what is true, not a list of things to cover. A resident who tapped three things gets a three-point review, not a tour of the building.',
  '2. Do not embellish around a tapped point either, even from the fact sheet. If they tapped daily cleaning, do not also mention the balconies. If they tapped nothing about safety, safety does not appear.',
  '3. The search phrasing under each tap is a hint about meaning, not text to reproduce. Never list those phrases, never stack them into one sentence, and never let a sentence read like a search query. Two or three of the supplied phrases, woven in naturally, is the most any review should carry.',
  '',
  'NEVER (these break the review and the profile)',
  '4. Never invent a fact: no prices or rent, no dates, no durations, no "I have been staying here for", no room or flat numbers, no staff or owner names, no comparisons to other PGs or landlords, no travel times or distances in minutes or kilometres.',
  '5. The only numbers you may ever write are ones that appear in the fact sheet. No other figure, in any form.',
  '6. Do not claim to be a particular kind of resident - student, working professional, man, woman, newcomer - unless the taps say so. You do not know who is typing.',
  '7. If the resident wrote a note describing a problem, say it plainly in their words. Never soften it, never balance it away, never turn a complaint into praise.',
  '',
  'SOUNDING LIKE A PERSON',
  '8. Simple words, Indian English, the register of someone typing quickly on a phone. Contractions welcome.',
  '9. Banned outright because they are the tells of a generated review: "nestled", "top-notch", "highly recommend to anyone looking for", "hassle-free", "state of the art", "peace of mind", "a home away from home", "worth every penny", "the icing on the cake", "look no further". No em dashes, no hyphen used as a pause, no hashtags, no emoji, no bullet points, no headings, no star ratings written out.',
  '10. Do not open with "I recently", "I have been staying", "This is a great PG", or the business name. Vary how you begin.',
  '11. Perfect balance is itself a tell. Real reviews lean on one thing the person cared about and mention the rest lightly. Let the review be uneven.',
  '12. Mention the business name at most once, and only if it falls naturally. The area name likewise. In a short review, skip both.',
  '13. Not every review needs a recommendation at the end. Most real ones just stop.',
  '',
  'NAMING WHERE THIS IS',
  '14. You may be given a local search anchor: a plain phrase naming what this place is and where it is. Treat it as a way of referring to the place inside a sentence that is already saying something. It is never a sentence of its own.',
  '15. The anchor must sit inside a clause that makes a real point. It may never be appended after the review is finished, never stand as a trailing fragment, never follow a full stop at the end, and never be introduced by "It is a" or "This is a" as a closing line.',
  '   Wrong: "Rooms are cleaned daily and the staff are helpful. PG near Hinjewadi IT Park."',
  '   Wrong: "The people are nice. It is a PG near Aundh."',
  '   Right: "Being a PG near Hinjewadi IT Park, the commute is the main reason I took it."',
  '   Right: "Hard to find a PG in Vishal Nagar where the cleaning actually happens every day."',
  '16. Name at most three nearby places in the whole review, and only if a tap was about the location. Two is better than three. Listing Hinjewadi, Wakad, Baner, Pimple Saudagar, Aundh and Balewadi in a row is keyword listing even though every one of them is true, and it is the fastest way to get a review filtered. Name the ones that matter and move on.',
  '17. If the anchor cannot be worked in that way, leave it out entirely. A review with no locality in it is completely fine and better than a bolted-on one. Use it once at most, and never repeat the locality anywhere else in the review.',
  '18. Do not write "near me". Someone searching that phrase is not looking for it in your words, and it reads as planted.',
  '',
  'Write only the review text. No quotation marks around it, no preamble, no sign-off, no title, no JSON, no label, no explanation.'
].join('\n');

const userPrompt = ({ loc, chips, note, length, angle, voice, shape, anchors, previous }) => {
  const lines = [
    `Business: ${loc.name}, ${loc.what} in ${loc.city}.`,
    '',
    // The label is button text, not English — "Water & power" lands in the review ampersand and
    // all if it is handed over as-is. The seo phrase is the part meant to be written from.
    'What the resident tapped, and the wording each tap stands for:',
    ...chips.map((c) => `- ${c.label.replace(/&/g, 'and')}: ${seoFor(c)}`),
    'Those short names are button labels, not English. Write from the meaning, never copy a label.',
    '',
    note ? `The resident also typed: "${note}"` : 'The resident did not type anything extra.',
    '',
    `Length: ${length.hint}.`,
    `Voice: ${voice.hint}`,
    `Shape: ${shape}`,
    anchors.length
      ? `Local search anchor: "${anchors[0]}". Work it into a clause that is already making a point, or leave it out. Never as its own sentence and never tacked on at the end.`
      : 'No local search anchor this time. Do not name the locality at all unless one of their taps is about the location.',
    `Their taps are the whole subject. Lead from "${angle.label.replace(/&/g, 'and')}".`,
    'Nothing outside those taps may appear, including true things from the fact sheet they did not tap. If the length will not fill honestly, write a shorter review.'
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

/**
 * Last line of defence against a bolted-on keyword.
 *
 * Even with the prompt forbidding it, a model handed a locality phrase will sometimes finish the
 * review and then append the phrase as its own fragment: "...staff are helpful. PG near Hinjewadi
 * IT Park." That single trailing sentence is the clearest keyword-stuffing signal a review can
 * carry, and it is the difference between a review that sticks and one that gets filtered.
 *
 * So the final sentence is dropped when it is nothing but a place label: no verb, and built only
 * out of the category-and-locality vocabulary. Anything that actually says something survives,
 * which is why the test for a verb comes first.
 */
// "It is a ...", "This is a ..." — a copula carries no meaning on its own, so it is peeled off
// before deciding whether anything is actually being said.
const COPULA = /^(?:it'?s|it is|this is|that'?s|that is)\s+/i;
// "a PG", "the best PG", "paying guest accommodation" — the category label itself.
const CATEGORY = /^(?:a|an|the)?\s*(?:best|good|nice|top|great|excellent|executive|ladies|gents|boys|girls|co-?ed|safe|clean|affordable)?\s*(?:pg|paying guest(?: accommodation)?|hostel|accommodation)\b/i;
// What may follow the category and still be nothing but a place name: a preposition and proper
// nouns. "in Vishal Nagar" qualifies. "in Vishal Nagar that actually keeps its word" does not,
// because "that" is neither a proper noun nor a connector — and that sentence says something.
const LOCALITY_ONLY = /^(?:(?:in|near|at|around|on)\s+(?:[A-Z][\w.'-]*|\d+)(?:[\s,]+(?:[A-Z][\w.'-]*|\d+|and|of|the))*)?$/;

/**
 * A handful of phrases survive being banned in the prompt — "hassle-free" in particular kept
 * coming back, because it is genuinely the phrase the model wants for "easy". Each swap below is
 * lexical and meaning-preserving, so nothing the resident said changes; it just stops the review
 * announcing itself as generated. Anything needing judgement to rewrite stays a prompt rule.
 */
const TELLS = [
  [/\bhassle[- ]free\b/gi, 'easy'],
  [/\bstate of the art\b/gi, 'modern'],
  [/\bpeace of mind\b/gi, 'one less thing to worry about'],
  [/\bworth every penny\b/gi, 'worth it'],
  [/\bnestled\b/gi, 'located'],
  [/\btop[- ]notch\b/gi, 'very good'],
  [/\ba home away from home\b/gi, 'a comfortable place to stay'],
  [/\blook no further\b/gi, 'this is a good option'],
  [/\s*&\s*/g, ' and ']
];

export const scrubTells = (text) =>
  TELLS.reduce((s, [re, to]) => s.replace(re, to), text).replace(/\s+/g, ' ').trim();

/**
 * When the model runs out of budget mid-sentence the review arrives with its last clause hanging
 * ("Good overall, especially for work. 100 Mbps WiFi"). Dropping back to the last completed
 * sentence gives a shorter review rather than a broken one; if nothing completed, the caller
 * treats it as a failure and retries rather than putting a fragment on someone's clipboard.
 */
export const dropIncompleteTail = (text) => {
  if (/[.!?]["']?$/.test(text)) return text;
  const cut = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return cut === -1 ? '' : text.slice(0, cut + 1).trim();
};

export const stripStuffedTail = (text) => {
  // Split on sentence ends, keeping the terminator so the rebuilt text is otherwise untouched.
  const parts = text.match(/[^.!?]+[.!?]*/g);
  if (!parts || parts.length < 2) return text;

  const bare = parts[parts.length - 1].replace(/[.!?]+$/, '').trim();
  if (!bare || bare.split(/\s+/).length > 9) return text;

  const withoutCopula = bare.replace(COPULA, '');
  const m = CATEGORY.exec(withoutCopula);
  if (!m) return text;

  // Whatever is left after the category label must be a bare place name, or nothing at all.
  if (!LOCALITY_ONLY.test(withoutCopula.slice(m[0].length).trim())) return text;

  return parts.slice(0, -1).join('').trim();
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

  const loc = getLocation();
  const known = new Map([...loc.priority, ...loc.pool].map((c) => [c.id, c]));
  const chips = (Array.isArray(body.chips) ? body.chips : []).map((id) => known.get(id)).filter(Boolean).slice(0, 10);

  if (!chips.length) return json(res, 400, { error: 'Pick at least one thing first.' });

  const note = String(body.note || '').slice(0, 300).trim();
  const previous = String(body.previous || '').slice(0, 1200).trim();
  const length = pickLength(chips.length);
  // The opening facet is drawn from what they actually tapped — picking it from a global list
  // made the model open with move-in or rent claims nobody had selected.
  const angle = chips[Math.floor(Math.random() * chips.length)];
  // Voice and shape vary independently of length, so the profile doesn't fill with reviews that
  // differ only in word count. Anchors carry the locality wording that local search matches on.
  const { voice, shape } = pickVoice();
  const anchors = pickAnchors(length.key);

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
          // gpt-oss spends reasoning tokens out of this same budget, so 320 was occasionally
          // being eaten before the review was finished and the text arrived cut off mid-clause.
          max_tokens: 500,
          // gpt-oss models think before answering; at default effort they sometimes return an empty
          // completion, and the extra latency is dead weight for a task this small.
          ...(model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
          messages: [
            { role: 'system', content: systemPrompt(loc) },
            { role: 'user', content: userPrompt({ loc, chips, note, length, angle, voice, shape, anchors, previous }) }
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
    const review = stripStuffedTail(dropIncompleteTail(scrubTells(
      String(data.choices?.[0]?.message?.content || '')
        .replace(/^\s*(?:here(?:'s| is)[^:]*:|review:)\s*/i, '')  // strip any preamble the model adds
        // An em or en dash is always a pause, so it becomes a comma directly. Turning it into a
        // hyphen first glued words together ("...malls nearby-good enough for me") whenever the
        // model wrote it unspaced, which no phone keyboard produces.
        .replace(/\s*[\u2013\u2014]\s*/g, ', ')
        .replace(/[\u2010-\u2012\u2015]/g, '-')            // the remaining exotic hyphens -> a plain one
        .replace(/\s-\s/g, ', ')            // a spaced hyphen used as a pause reads as machine writing
        .replace(/[\u2018\u2019]/g, "'")    // smart quotes -> what an Android keyboard types
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )));

    if (!review) return json(res, 502, { error: 'Could not write the review just now. Try again.' });

    console.log(JSON.stringify({ at: new Date().toISOString(), event: 'generated', loc: loc.key, model: data.model, chips: chips.map(c => c.id), length: length.key, voice: voice.key, anchors, chars: review.length }));
    return json(res, 200, { review, length: length.key });
  } catch (err) {
    console.error('[generate]', err.name, err.message);
    const msg = err.name === 'AbortError' ? 'That took too long. Try again.' : 'Something went wrong writing the review.';
    return json(res, 502, { error: msg });
  }
}
