import { getLocation, reviewLinkFor } from '../lib/business.js';
import { json, shuffle } from '../lib/http.js';

/**
 * GET /api/config?loc=female
 * Priority chips are fixed and ordered; the rest of the pool is shuffled and sampled per visit
 * so two residents rarely tap the same combination, and the profile doesn't fill with clones.
 */
export default function handler(req, res) {
  const loc = getLocation(new URL(req.url, 'http://x').searchParams.get('loc'));
  const strip = ({ id, label, emoji }) => ({ id, label, emoji });

  json(res, 200, {
    loc: loc.key,
    name: loc.name,
    tagline: loc.tagline,
    accent: loc.accent,
    reviewUrl: reviewLinkFor(loc),
    reviewUrlConfigured: Boolean(loc.reviewUrl?.trim()),
    chips: [...loc.priority.map(strip), ...shuffle(loc.pool).slice(0, 8).map(strip)],
    aiReady: Boolean(process.env.GROQ_API_KEY)
  });
}
