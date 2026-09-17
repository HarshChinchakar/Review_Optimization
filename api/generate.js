import { getLocation, pickLength, pickVoice, pickPersona, pickAnchors, seoFor } from '../lib/business.js';
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
  '6. Never state who the reviewer is. Not their age, job, course, gender, how long they have lived here or where they came from. You do not know any of it about the person holding the phone, and it would be published under their name. See rule 16.',
  '7. If the resident wrote a note describing a problem, say it plainly in their words. Never soften it, never balance it away, never turn a complaint into praise.',
  '',
  'WRITING AS THE RESIDENT, NOT ABOUT THE BUILDING',
  '8. Write in the first person, from inside living there. "I", "my", "we". You are describing your own experience of the place, not summarising what it offers.',
  '   Wrong: "The place feels safe for women." That is how a listing describes a building.',
  '   Right: "Coming back late has never been a worry for me."',
  '   Wrong: "The 100 Mbps WiFi holds up for video calls and work from home."',
  '   Right: "WiFi has not dropped on me during a call yet, which is all I needed."',
  '9. Do not recite specifications. A resident says the internet is fast, not that it is 100 Mbps. Say a number only where a person genuinely would, which is almost never.',
  '10. Never give every point the same weight in the same shape. One clause per feature, strung together, is a specification list and it is the single clearest sign a review was generated. Say something real about one or two things and let the rest be a passing mention or nothing at all.',
  '11. Simple words, Indian English, the register of someone typing on a phone. Contractions throughout. Ordinary connectors like "and", "so", "but", not "additionally" or "moreover".',
  '12. Banned outright because they are the tells of a generated review: "nestled", "top-notch", "highly recommend to anyone looking for", "hassle-free", "state of the art", "peace of mind", "a home away from home", "worth every penny", "the icing on the cake", "look no further", "the perfect blend", "ticks all the boxes". No em dashes, no hyphen used as a pause, no hashtags, no emoji, no bullet points, no headings, no star ratings written out.',
  '13. Do not open with "I recently", "I have been staying", "This is a great PG", or the business name. Vary how you begin.',
  '14. Mention the business name at most once, and only if it falls naturally. In a short review, skip it.',
  '15. Not every review needs a recommendation at the end. Most real ones just stop.',
  '16. You may be told roughly who is typing. That tells you HOW to write - the register, the vocabulary, the level of fuss - and never WHAT to write about. It adds no subject matter whatsoever, and it never becomes a stated fact: never say how long they have stayed, that they are new, that they just started working or studying, where they work or study, or why they moved. You do not know any of that about the person holding the phone.',
  '',
  'NAMING WHERE THIS IS',
  '17. You may be given a local search anchor: a plain phrase naming what this place is and where it is. Treat it as a way of referring to the place inside a sentence that is already saying something. It is never a sentence of its own.',
  '18. The anchor must sit inside a clause that makes a real point. It may never be appended after the review is finished, never stand as a trailing fragment, never follow a full stop at the end, and never be introduced by "It is a" or "This is a" as a closing line.',
  '   Wrong: "Rooms are cleaned daily and the staff are helpful. PG near Hinjewadi IT Park."',
  '   Wrong: "The people are nice. It is a PG near Aundh."',
  '   Right: "I took this place mainly because it is a PG near Hinjewadi IT Park and the commute actually matters to me."',
  '   Right: "Hard to find a PG in Vishal Nagar where the cleaning actually happens every day."',
  '19. Name at most three nearby places in the whole review, and only if a tap was about the location. Two is better than three. Listing Hinjewadi, Wakad, Baner, Pimple Saudagar, Aundh and Balewadi in a row is keyword listing even though every one of them is true, and it is the fastest way to get a review filtered. Name the ones that matter and move on.',
  '20. If the anchor cannot be worked in that way, leave it out entirely. A review with no locality in it is completely fine and better than a bolted-on one. Use it once at most, and never repeat the locality anywhere else in the review.',
  '21. Do not write "near me". Someone searching that phrase is not looking for it in your words, and it reads as planted.',
  '',
  'Write only the review text. No quotation marks around it, no preamble, no sign-off, no title, no JSON, no label, no explanation.'
].join('\n');

const userPrompt = ({ loc, note, length, angle, focus, rest, meaning, persona, voice, shape, anchors, previous }) => {
  // Button labels are deliberately not sent. Shown alongside the meaning, they were lifted
  // wholesale as the subject of the opening sentence — "Kitchen in flat lets me cook my own
  // meals", "100 Mbps WiFi never drops" — which is a caption, not something a person says.
  const say = (c) => `- ${meaning.get(c.id)}`;
  const lines = [
    `Business: ${loc.name}, ${loc.what} in ${loc.city}.`,
    '',
    'This is what the review is actually about. Say something real about it, in your own words:',
    ...focus.map(say),
    rest.length ? '' : null,
    rest.length ? 'They also tapped these. Mention one or two in passing if it flows, or leave them out altogether. Do not give them a clause each:' : null,
    ...rest.map(say),
    '',
    'Those are notes on what they meant, not phrases to reuse. Put it in your own words.',
    '',
    note ? `The resident also typed: "${note}"` : 'The resident did not type anything extra.',
    '',
    `Length: ${length.hint}.`,
    `Who is typing (steers what they notice and the words they use, never stated outright): ${persona.hint}`,
    `Voice: ${voice.hint}`,
    `Shape: ${shape}`,
    anchors.length
      ? `Local search anchor: "${anchors[0]}". Work it into a clause that is already making a point, or leave it out. Never as its own sentence and never tacked on at the end.`
      : 'No local search anchor this time. Do not name the locality at all unless one of their taps is about the location.',
    `Lead from this one: ${meaning.get(angle.id)}`,
    'Nothing outside their taps may appear, including true things from the fact sheet they did not tap. If the length will not fill honestly, write a shorter review rather than padding it.'
  ].filter((l) => l !== null);
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
  // Voice, persona and shape vary independently of length, so the profile doesn't fill with
  // reviews that differ only in word count. Anchors carry the wording local search matches on.
  const { voice, shape } = pickVoice();
  const persona = pickPersona();
  const anchors = pickAnchors(length.key);

  /**
   * Which taps actually get written about.
   *
   * Covering every tap in order is what made the reviews read as brochures: six taps became six
   * even clauses, one per feature, which is a specification list rather than anything a person
   * would type. Real reviews lean hard on the one or two things that mattered and let the rest go.
   *
   * So the taps are split here rather than in the prompt. One or two carry the review; the rest
   * are available but explicitly droppable. Nothing outside the resident's own taps is ever in
   * either group, so this narrows the review without inventing anything.
   */
  const shuffled = [...chips].sort(() => Math.random() - 0.5);
  // Even two taps became one clause each. Most of the time one of them carries the review.
  const focusCount = chips.length === 1 ? 1 : (Math.random() < 0.6 ? 1 : 2);
  const focus = shuffled.slice(0, focusCount);
  const rest = shuffled.slice(focusCount);
  const angle = focus[0];
  // Resolved once so a rotating seoPool gives the same phrasing in the list and in the lead line.
  const meaning = new Map(chips.map((c) => [c.id, seoFor(c)]));

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
            { role: 'user', content: userPrompt({ loc, note, length, angle, focus, rest, meaning, persona, voice, shape, anchors, previous }) }
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

    console.log(JSON.stringify({ at: new Date().toISOString(), event: 'generated', loc: loc.key, model: data.model, chips: chips.map(c => c.id), focus: focus.map(c => c.id), length: length.key, voice: voice.key, persona: persona.key, anchors, chars: review.length }));
    return json(res, 200, { review, length: length.key });
  } catch (err) {
    console.error('[generate]', err.name, err.message);
    const msg = err.name === 'AbortError' ? 'That took too long. Try again.' : 'Something went wrong writing the review.';
    return json(res, 502, { error: msg });
  }
}
