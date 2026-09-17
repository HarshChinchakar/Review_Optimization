/**
 * Everything business-specific lives here. Edit this file, redeploy, done.
 *
 * The split that matters (see docs/02-business-profile-audit.md):
 *   label -> what the resident reads. Human words. One to three of them.
 *   seo   -> what the AI is told the tap means. Search-shaped words.
 * The person never sees the search phrasing; the model bridges the two.
 */

/**
 * This deployment serves ONE property: GVC Executive PG, Ashoka Heritage.
 *
 * The other property (GVC PG Service, Kalewadi) lives in its own repo and its own Vercel
 * project, with its own QR and its own Google review link. One deployment per property is
 * deliberate: the QR can then be the bare domain with no query string, so there is no way
 * for a scan to land on the wrong property's chips or the wrong property's review box.
 */
export const LOCATIONS = {
  // GVC Executive PG, Ashoka Heritage. Cooler, professional register.
  executive: {
    key: 'executive',
    name: 'GVC Executive PG',
    tagline: 'Vishal Nagar, Pimple Nilakh · Pune',
    city: 'Vishal Nagar, Pimple Nilakh, Pimpri-Chinchwad, Pune',
    address: 'Ashoka Heritage, New DP Rd, Vishal Nagar, Pimple Nilakh, Pimpri-Chinchwad, Maharashtra 411027',
    phone: '087881 47464',
    // Rent band ₹6,500–₹9,000 depending on sharing. Kept out of the chips on purpose:
    // a price in a review is a factual claim that goes stale the moment rent changes.
    rentBand: '₹6,500 – ₹9,000',
    what: 'executive paying guest accommodation (PG) for working professionals',

    /**
     * Ground truth. This is the complete list of what is actually true about this property,
     * and it is sent to the model on every request as the outer boundary of what may be said.
     *
     * It is NOT a list to write about — the review still only covers the chips the resident
     * tapped. It exists so that when the model reaches for a detail to round out a sentence,
     * the only details within reach are real ones. Anything absent from this list is, as far
     * as the model is concerned, not true of this PG.
     *
     * Nothing goes in here that the owner has not confirmed. Meals, AC, laundry service and
     * sharing-type claims were deliberately removed: residents cook in their own flat kitchen.
     */
    facts: [
      'Rooms and common areas are cleaned daily.',
      'Rent is transparent. There are no hidden costs or surprise charges.',
      'It is in Vishal Nagar, Pimple Nilakh, and residents consider it the best PG in the area.',
      'It is close to Wakad, Hinjewadi, Baner, Pimple Saudagar, Aundh and Balewadi.',
      'It has direct road connectivity and direct public transport.',
      'It is safe for women.',
      'Safety comes from a caretaker, biometric entry, a daily safety check by the owner, and a gated society and gated building.',
      'A 7-Eleven is right beside the PG. Restaurants, food options, Reliance Trends, Reliance Digital and shopping malls are within walking distance.',
      'There is good parking space.',
      'The owner and staff are respectful and civilised.',
      'Water and electricity are continuous, with power backup and a lift.',
      'A fridge and a washing machine are provided.',
      'There is a common space where residents socialise, and the building has a good ambience and view.',
      'The WiFi is 100 Mbps.',
      'The owner and staff resolve problems quickly.',
      'The rules are clear and normal, nobody causes trouble, and the people staying are good.',
      'Each flat has its own kitchen, so residents can cook for themselves easily.',
      'There are good balconies to sit out on, and proper ventilation. The building is vastu compliant.'
    ],
    // The composer URL the owner's g.page link resolves to. We use the resolved form on purpose:
    // g.page is a Maps-owned domain and Android app-links hand it straight to the Maps app,
    // which dumps the resident on the profile instead of in the review box. search.google.com stays
    // in the browser, where the clipboard they just filled is actually usable.
    reviewUrl: process.env.REVIEW_URL_EXECUTIVE
      || 'https://search.google.com/local/writereview?placeid=ChIJ3546OuK5wjsRQ9TCWYx9490',
    profileUrl: 'https://www.google.com/search?q=gvc+executive+pg+pune+reviews',
    accent: 'slate',

    /**
     * Every chip below maps onto `facts` above — an umbrella word the thumb can hit instantly,
     * carrying the search-shaped phrasing underneath. Nothing here is aspirational.
     *
     * First rows, ordered by what actually gets searched for: the work-hub commute and the
     * locality name do the heaviest lifting on a Google profile, so they lead.
     */
    priority: [
      // Handed the whole list of work hubs as one phrase, the model reproduced all six names in
      // a row - keyword listing, however true each one is. So the hubs rotate instead: one or two
      // per review, and across a profile's worth of reviews every hub still gets named, which is
      // the coverage that actually accumulates. `seoPool` picks one per generation.
      { id: 'location',  label: 'Close to work',    emoji: '📍', seoPool: [
        'an easy commute to Hinjewadi IT Park',
        'close to Wakad, short commute',
        'close to Baner and Aundh',
        'quick to get to Balewadi',
        'walkable to the Pimple Saudagar side',
        'an easy run to Hinjewadi and Wakad',
        'close to the Baner and Balewadi offices'
      ] },
      { id: 'clean',     label: 'Cleaned daily',    emoji: '🧹', seo: 'rooms and common areas cleaned every day, daily housekeeping' },
      { id: 'wifi',      label: '100 Mbps WiFi',    emoji: '📶', seo: '100 Mbps WiFi, holds up for work from home and video calls' },
      { id: 'safe',      label: 'Safe for women',   emoji: '🔒', seo: 'safe PG for women and girls in Vishal Nagar' },
      { id: 'nohidden',  label: 'No hidden costs',  emoji: '💰', seo: 'transparent rent, no hidden costs or surprise charges' },
      { id: 'kitchen',   label: 'Kitchen in flat',  emoji: '🍳', seo: 'individual kitchen in every flat, easy to cook your own food' }
    ],

    pool: [
      { id: 'best',       label: 'Best around here',  emoji: '⭐', seo: 'best PG in Vishal Nagar' },
      { id: 'security',   label: 'Biometric entry',   emoji: '🎥', seo: 'biometric entry, caretaker on site, gated society and gated building' },
      { id: 'ownercheck', label: 'Owner checks in',   emoji: '🤝', seo: 'owner comes by daily for a safety check' },
      { id: 'transport',  label: 'Direct transport',  emoji: '🚌', seo: 'direct public transport and direct road connectivity' },
      { id: 'shops',      label: 'Shops & food next door', emoji: '🏪', seo: 'a 7-Eleven right beside the PG, with restaurants, Reliance Trends, Reliance Digital and shopping malls within walking distance' },
      { id: 'parking',    label: 'Parking space',     emoji: '🛵', seo: 'good parking space' },
      { id: 'staff',      label: 'Respectful staff',  emoji: '💬', seo: 'respectful, civilised owner and staff' },
      { id: 'fixes',      label: 'Issues fixed fast', emoji: '🔧', seo: 'owner and staff sort out problems quickly' },
      { id: 'utilities',  label: 'Water & power',     emoji: '🔌', seo: 'continuous water and electricity with power backup' },
      { id: 'appliances', label: 'Fridge & washer',   emoji: '🧺', seo: 'fridge and washing machine provided' },
      { id: 'lift',       label: 'Lift',              emoji: '🛗', seo: 'lift in the building' },
      { id: 'common',     label: 'Space to hang out', emoji: '👋', seo: 'common space where residents sit and socialise' },
      { id: 'balcony',    label: 'Good balconies',    emoji: '🌿', seo: 'good balconies to sit out on' },
      { id: 'airy',       label: 'Airy and bright',   emoji: '🪟', seo: 'proper ventilation and natural light, vastu compliant' },
      { id: 'view',       label: 'Nice view',         emoji: '🏞️', seo: 'good ambience and a nice view' },
      { id: 'rules',      label: 'Sensible rules',    emoji: '📋', seo: 'clear, normal rules with nothing unnecessary' },
      { id: 'people',     label: 'Good people here',  emoji: '🙂', seo: 'good people staying, nobody causes any trouble' }
    ]
  }
};

/**
 * Single-property deployment: every request resolves to Executive, whatever `loc` says.
 * Older printed QRs carry `?loc=executive`, and a stray `?loc=female` from a mis-scanned
 * or hand-edited URL must not 404 or fall through to an empty config — it lands here too.
 */
export const getLocation = () => LOCATIONS.executive;

/**
 * Where the Post button sends people.
 *
 *   'composer' (default) -> search.google.com/local/writereview?placeid=...
 *                           Lands directly in the review box. Fewest taps. Needs a Place ID.
 *   'profile'            -> google.com/search?q=<business> reviews
 *                           Lands on the knowledge panel; the resident still has to find
 *                           "Write a review". More taps, but it always stays on google.com
 *                           and never gets handed to the Maps app.
 *
 * Flip DESTINATION to 'profile' (or set REVIEW_DESTINATION=profile on Vercel) if the composer
 * keeps getting intercepted by the Maps app on real phones.
 */
const DESTINATION = process.env.REVIEW_DESTINATION === 'profile' ? 'profile' : 'composer';

export const reviewLinkFor = (loc) =>
  (DESTINATION === 'composer' && loc.reviewUrl?.trim()) || loc.profileUrl;

const LENGTHS = {
  short:  { key: 'short',  hint: '1 to 2 short sentences, under 25 words' },
  medium: { key: 'medium', hint: '2 to 3 sentences, around 35 to 45 words' },
  long:   { key: 'long',   hint: '4 to 5 sentences, around 70 to 90 words' }
};

/**
 * Length mix. Real profiles are mostly short reviews with the occasional long one —
 * uniform length across a profile is the thing that looks manufactured.
 *
 * Capped by how much the customer actually gave us: one tap cannot honestly become
 * ninety words, and asking for that is exactly how a model starts inventing detail.
 */
export const pickLength = (chipCount = 3) => {
  const r = Math.random();
  if (chipCount <= 1) return r < 0.7 ? LENGTHS.short : LENGTHS.medium;
  if (chipCount === 2) return r < 0.45 ? LENGTHS.short : LENGTHS.medium;
  // Three taps will not honestly fill eighty words. Asking for it is what made the model pad the
  // review out with facts nobody had tapped - it reached into the fact sheet for filler, which is
  // the one thing the fact sheet must never be used for. Long needs four taps to stand on.
  if (chipCount === 3) return r < 0.45 ? LENGTHS.short : LENGTHS.medium;
  if (r < 0.35) return LENGTHS.short;
  if (r < 0.80) return LENGTHS.medium;
  return LENGTHS.long;
};

/**
 * Writing voice. Length variation alone was not enough — the reviews still all arrived in the
 * same even, agreeable register, and twenty of those in a row on one profile read as one person
 * with twenty accounts.
 *
 * Every voice below is a register, not a persona: none of them licenses a fact. A voice that
 * asked the model to mention how long someone had stayed, or who they moved from, would be
 * asking it to invent, so none does.
 */
const VOICES = [
  { key: 'plain',      hint: 'Plain and matter of fact. State what was good and stop. No flourish, nothing clever.' },
  { key: 'warm',       hint: 'Warm, the way you would describe your place to a friend who asked. Contractions are fine.' },
  { key: 'brisk',      hint: 'Brisk, the way someone busy types on a phone. Short sentences. One sentence fragment is fine.' },
  { key: 'listy',      hint: 'Reads like someone naming the things that mattered to them, joined up into prose. Slightly listy and comma-spliced, the way plenty of real reviews are.' },
  { key: 'considered', hint: 'Considered and even-handed, as though they thought for a moment before typing. Slightly longer clauses.' },
  { key: 'casual',     hint: 'Casual Indian English as actually typed on a phone. Starting lowercase is fine, and the last full stop can be missing. Do not overdo this, and do not misspell anything.' },
  { key: 'appreciative', hint: 'Quietly appreciative, without gushing. No exclamation marks and no marketing words.' }
];

/**
 * Structural variation, kept separate from voice so the two combine rather than correlate.
 * Every shape opens from something the resident actually tapped — an opening drawn from a
 * global list is exactly what had the model leading with details nobody selected.
 */
const SHAPES = [
  'Open on the point they tapped first and let the rest follow.',
  'Open with a short overall verdict, then give the specifics behind it.',
  'Open straight into one concrete detail and let the overall verdict land at the end.',
  'Open on whichever of their taps is the most practical one, then the rest.',
  'Give the specifics first and close on a plain recommendation in their own words.'
];

const any = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const pickVoice = () => ({ voice: any(VOICES), shape: any(SHAPES) });

/**
 * Local-search anchors.
 *
 * What ranks a profile for "pg near me" is not the phrase "near me" - Google resolves that from
 * the searcher's own location, so writing it into a review is wasted words that read like a plant.
 * What it matches on is category plus locality: a profile whose reviews repeatedly say "PG in
 * Vishal Nagar" or "PG near Hinjewadi" is the one it can confidently return for "pg near me",
 * "best pg near me" and "pg near hinjewadi" alike.
 *
 * So every anchor here is a plain statement of what this place is and where it is. None of them
 * is a feature claim, which is what makes them safe to drop into any review regardless of what
 * the resident tapped - they stay true even for someone who tapped one thing.
 *
 * They are sampled one or two at a time, never handed over as a block. Twenty reviews each
 * naming the locality once is what accumulates; one review naming it five times is keyword
 * stuffing, and it gets the review filtered and the profile looked at.
 */
const SEARCH_ANCHORS = [
  'PG in Vishal Nagar',
  'PG in Pimple Nilakh',
  'PG near Hinjewadi IT Park',
  'PG near Wakad',
  'PG near Baner',
  'PG near Aundh',
  'PG near Balewadi',
  'PG near Pimple Saudagar',
  'executive PG in Pune',
  'PG for working professionals in Vishal Nagar',
  'paying guest accommodation in Pimple Nilakh',
  'PG accommodation near Hinjewadi',
  'PG in Vishal Nagar, Pune',
  'PG near New DP Road'
];

/**
 * At most one anchor, ever, and most reviews get none.
 *
 * Two anchors in one review cannot be made to sound human; the model bolts the second one on as
 * a trailing fragment ("... good place. PG near Hinjewadi IT Park.") which is the exact shape a
 * reviewer-spam filter is looking for. Coverage is supposed to accumulate across many reviews,
 * not be crammed into each one, so the rate is deliberately well under half.
 */
/**
 * A chip's meaning, resolved for one generation. Most chips carry a single fixed `seo` phrase;
 * a chip with more ways of saying the same true thing carries a `seoPool` and rotates, so a
 * profile's reviews vary in which real detail they reach for rather than repeating one phrase.
 */
export const seoFor = (chip) => (chip.seoPool ? any(chip.seoPool) : chip.seo);

export const pickAnchors = (lengthKey = 'medium') => {
  const rate = lengthKey === 'short' ? 0.25 : lengthKey === 'long' ? 0.5 : 0.4;
  if (Math.random() >= rate) return [];
  return [any(SEARCH_ANCHORS)];
};
