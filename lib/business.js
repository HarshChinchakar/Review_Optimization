/**
 * Everything business-specific lives here. Edit this file, redeploy, done.
 *
 * The split that matters (see docs/02-business-profile-audit.md):
 *   label -> what the resident reads. Human words. One to three of them.
 *   seo   -> what the AI is told the tap means. Search-shaped words.
 * The person never sees the search phrasing; the model bridges the two.
 */

export const LOCATIONS = {
  // ?loc=female  — GVC PG Service (Female Only), Kalewadi
  female: {
    key: 'female',
    name: 'GVC PG Service',
    tagline: 'Kalewadi, Pune · Female only',
    city: 'Kalewadi, Pimpri-Chinchwad, Pune',
    what: 'ladies paying guest accommodation (PG) for working women and students',
    // Google Business Profile -> Ask for reviews -> paste that link here (or set REVIEW_URL_FEMALE on Vercel)
    reviewUrl: process.env.REVIEW_URL_FEMALE || '',
    profileUrl: 'https://www.google.com/search?q=GVC+PG+Service+Female+Only+Kalewadi+Pune+reviews',
    accent: 'terracotta',

    // First rows. Ordered by commercial value — the thumb starts here.
    priority: [
      { id: 'safe',   label: 'Feels safe',      emoji: '🔒', seo: 'safe PG for girls in Kalewadi, secure for female residents' },
      { id: 'food',   label: 'Homely food',     emoji: '🍲', seo: 'homely home-cooked food, tasty meals included' },
      { id: 'owner',  label: 'Caring owner',    emoji: '💛', seo: 'cooperative and caring owner who responds quickly' },
      { id: 'commute',label: 'Easy commute',    emoji: '🛵', seo: 'close to Hinjewadi IT Park and Wakad, convenient location' },
      { id: 'clean',  label: 'Clean rooms',     emoji: '✨', seo: 'clean well-maintained rooms with regular housekeeping' },
      { id: 'wifi',   label: 'Good WiFi',       emoji: '📶', seo: 'good WiFi, fine for work from home calls' }
    ],

    // Shuffled and sampled per visit, so two residents rarely tap the same set.
    pool: [
      { id: 'parents',  label: 'Parents felt okay',  emoji: '🙏', seo: 'parents were reassured about safety and security' },
      { id: 'rules',    label: 'Rules are fair',     emoji: '📋', seo: 'strict but fair rules and discipline' },
      { id: 'cctv',     label: 'CCTV & security',    emoji: '🎥', seo: '24x7 security, CCTV cameras, controlled entry' },
      { id: 'hotwater', label: 'Hot water always',   emoji: '🚿', seo: '24 hours hot water supply' },
      { id: 'power',    label: 'No power cuts',      emoji: '🔌', seo: 'power backup and steady water supply' },
      { id: 'sharing',  label: 'Room options',       emoji: '🛏️', seo: 'single sharing and double sharing rooms available' },
      { id: 'value',    label: 'Worth the rent',     emoji: '💰', seo: 'affordable PG rent, good value for money in Kalewadi' },
      { id: 'movein',   label: 'Easy move-in',       emoji: '🧳', seo: 'hassle-free move in, no brokerage' },
      { id: 'quiet',    label: 'Quiet for calls',    emoji: '🤫', seo: 'quiet enough for office calls and study' },
      { id: 'laundry',  label: 'Laundry sorted',     emoji: '🧺', seo: 'laundry and housekeeping taken care of' },
      { id: 'kitchen',  label: 'Kitchen access',     emoji: '🍳', seo: 'kitchen appliances available for residents' },
      { id: 'market',   label: 'Market nearby',      emoji: '🏪', seo: 'walking distance to bus stop, market and shops' },
      { id: 'girls',    label: 'Nice roommates',     emoji: '👭', seo: 'friendly roommates, homely environment' },
      { id: 'home',     label: 'Feels like home',    emoji: '🏠', seo: 'feels like home, homely atmosphere' }
    ]
  },

  // ?loc=executive — GVC Executive PG, Ashoka Heritage. Cooler, professional register.
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
    // The composer URL the owner's g.page link resolves to. We use the resolved form on purpose:
    // g.page is a Maps-owned domain and Android app-links hand it straight to the Maps app,
    // which dumps the resident on the profile instead of in the review box. search.google.com stays
    // in the browser, where the clipboard they just filled is actually usable.
    reviewUrl: process.env.REVIEW_URL_EXECUTIVE
      || 'https://search.google.com/local/writereview?placeid=ChIJ3546OuK5wjsRQ9TCWYx9490',
    profileUrl: 'https://www.google.com/search?q=gvc+executive+pg+pune+reviews',
    accent: 'slate',

    priority: [
      { id: 'furnished', label: 'Fully furnished', emoji: '🛏️', seo: 'fully furnished executive PG rooms, everything provided' },
      { id: 'wifi',      label: 'Fast WiFi',       emoji: '📶', seo: 'high-speed WiFi, reliable for work from home' },
      { id: 'location',  label: 'Prime location',  emoji: '📍', seo: 'PG in Vishal Nagar Pimple Nilakh, close to Wakad, Baner, Aundh and Hinjewadi IT Park' },
      { id: 'clean',     label: 'Well maintained', emoji: '✨', seo: 'clean rooms with regular housekeeping' },
      { id: 'privacy',   label: 'Peaceful',        emoji: '🤫', seo: 'peaceful and private, suits working professionals' },
      { id: 'value',     label: 'Worth the rent',  emoji: '💰', seo: 'good value for money, fair rent for Pimple Nilakh' }
    ],

    pool: [
      { id: 'single',   label: 'Room options',     emoji: '🚪', seo: 'single, double and triple sharing rooms available' },
      { id: 'ac',       label: 'AC rooms',         emoji: '❄️', seo: 'AC rooms' },
      { id: 'food',     label: 'Decent food',      emoji: '🍲', seo: 'home-style meals included' },
      { id: 'owner',    label: 'Responsive owner', emoji: '💬', seo: 'owner responds quickly to any issue' },
      { id: 'power',    label: 'Power backup',     emoji: '🔌', seo: 'power backup and steady water supply' },
      { id: 'hotwater', label: 'Hot water always', emoji: '🚿', seo: '24 hours hot water' },
      { id: 'parking',  label: 'Parking space',    emoji: '🛵', seo: 'two wheeler parking available' },
      { id: 'checkin',  label: 'Easy check-in',    emoji: '🧳', seo: 'quick hassle-free check in, no brokerage' },
      { id: 'security', label: 'Secure building',  emoji: '🎥', seo: 'CCTV and secure entry' },
      { id: 'laundry',  label: 'Laundry sorted',   emoji: '🧺', seo: 'laundry service available' },
      { id: 'market',   label: 'Market nearby',    emoji: '🏪', seo: 'shops, cafes and bus stop on New DP Road within walking distance' },
      { id: 'nofuss',   label: 'No nonsense',      emoji: '👍', seo: 'well run, no unnecessary restrictions' }
    ],

    angles: ['the room itself', 'the location and commute', 'the WiFi and work setup', 'the upkeep', 'the value for the rent', 'how smooth check-in was', 'the owner']
  }
};

export const getLocation = (key) => LOCATIONS[key] || LOCATIONS.female;

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
  if (r < 0.35) return LENGTHS.short;
  if (r < 0.80) return LENGTHS.medium;
  return LENGTHS.long;
};
