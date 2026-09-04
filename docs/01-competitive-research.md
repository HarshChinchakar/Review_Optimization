# Research: How QR → AI → Google-review systems actually work

Research date: 4 September 2026. Written before building, used as the build spec.

---

## 0. The two facts that shape everything

**Fact 1 — You cannot auto-publish a review to a Google Business Profile. There is no API for it.**
The Google Business Profile API can *list*, *retrieve*, *reply to*, and *delete* reviews. It cannot *create* one.
Google's own documentation is explicit that reviews can only be created by a signed-in Google user through
Search or Maps. There is no OAuth scope, no partner program, and no paid tier that unlocks it. Every commercial
product in this category — including the ones charging money for "automatic review posting" — actually does
**clipboard + deep link**: they copy the text and drop the user into Google's own review box, where the user
taps Post.

That also answers "publish by the user's email id": the review is posted by whichever Google account is signed
in on that phone. We never touch their credentials, we never need their email, and we could not post as them
even if we wanted to. This is a hard boundary, not a limitation of our build.

**Fact 2 — the flow is legal and normal; the *gate* is what gets profiles punished.**
The FTC's Consumer Review Rule (final Aug 2024, effective 21 Oct 2024, penalties up to ~$53k per violation)
bans fake reviews, including AI-generated reviews from people with **no actual experience**. It does *not* ban
using AI to help a real customer articulate a real experience. Google's content policy separately bans
**review gating** — "discouraging or prohibiting negative reviews, or selectively soliciting positive reviews."
Most Indian competitors in this space *do* gate (below 3★ → private form only). That is the single biggest
compliance risk in the category, and we deliberately do it differently (see §4).

---

## 1. Systems reviewed

### 1.1 MagicReview AI (magicreviewai.com) — closest commercial analogue
- **Flow:** scan QR (no app) → pick 1–5 stars → for 4–5★ the AI generates ready-made, "SEO-friendly" review
  suggestions → customer picks one → auto-copied → redirected to Google → pastes → posts.
- **Negative path:** below 3★ goes to a *private* form that never reaches Google. This is textbook review gating.
- **Pricing:** ₹199 / ₹299 / ₹399 per month, token-metered, multi-branch, auto-replies, basic analytics.
- **Claims:** "200% average review growth", "10K+ reviews generated".
- **Takeaway for us:** the funnel shape is validated and users complete it. Copy the funnel, drop the gate,
  and beat them on the *selection* step — theirs is a star tap, ours is keyword selection, which produces
  far better SEO text.

### 1.2 MagicReview / YRHP India (magicreview.in) — closest to *our* spec
- **Flow:** customer taps an NFC card or scans a QR → **selects tags describing what they liked** → the system
  auto-generates the review from those tags.
- **Why it matters:** this is exactly the interaction the brief asks for. Tag selection beats free typing
  because it removes the blank-page problem *and* it lets the business seed the vocabulary.
- **Weakness observed:** tag sets are generic ("good service", "friendly staff") and identical for every
  customer, so the generated reviews read same-y across a profile. Our fix: a rotating secondary pool and
  randomised length/angle so no two reviews share a shape (see §5).

### 1.3 Podium — the review-request incumbent
- **Model:** not a QR toy; an SMS/webchat platform. Its whole thesis is **timing and channel**: a text message
  sent minutes after the interaction converts far better than an email or a poster.
- **No AI drafting of the customer's words** — it just delivers the link with one tap.
- **Takeaway:** the QR is our channel constraint, so we must win on *speed after scan*. The page has to be
  useful within one screen; anything that looks like a form loses to the SMS players.

### 1.4 Birdeye — multi-location management
- **Model:** enterprise review monitoring, aggregation across 200+ sites, AI review *responses*, sentiment
  dashboards, per-location leaderboards.
- **Takeaway:** we have two locations (GVC PG Service and GVC Executive PG). Whatever we build must be
  location-aware from day one — one deployment, one QR per property, separate keyword sets and separate
  Google links. Retrofitting multi-location later is the classic mistake here.

### 1.5 GatherUp / Grade.us — the review-funnel pioneers
- **History that matters:** both built their business on the classic "How was your experience? 😊/☹️" split
  funnel, then **publicly re-engineered it** once Google made gating a policy violation. Their current guidance
  is: ask everyone the same way, make the public path available to everyone, and use the private path as an
  *additional* option, never as a replacement.
- **Takeaway:** the compliant pattern is proven and still converts. We adopt their post-2018 shape.

### 1.6 QR Code AI / MagicReply — pure deep-link generators
- **Model:** generate a QR that points straight at `https://search.google.com/local/writereview?placeid=…`,
  with a branded short link and scan analytics. No AI, no page in between.
- **Conversion reality:** dumping someone straight into a blank Google review box is where reviews die —
  the blank text field *is* the friction. Scan-to-post completion is far lower than a system that hands them
  words. But their scan analytics idea is worth stealing: know how many scans became posts.
- **Takeaway:** our page must justify existing between the scan and Google. It does that by filling the box.

### 1.7 NFC "tap to review" cards (Tapt / Popl / Reviewly style)
- Same funnel, tap instead of scan, card sits on a counter or reception desk.
- **Takeaway:** keep our entry URL short and dumb (`/?loc=female`), so the same build works on a printed
  standee, an NFC sticker at the PG reception, or a WhatsApp link — no code change.

### 1.8 Trustmary / NiceJob — the loop closers
- Push collected reviews back onto the website as social-proof widgets, and re-request from happy customers.
- **Takeaway:** out of scope for v1, but the feedback log we write is the seed for it.

---

## 2. What the winning flow looks like (synthesised)

```
scan QR
  → land on ONE screen, business name recognisable, no login, no app
  → tap 3–6 keyword chips (high-value ones first, visually magnetic)
  → optional one-line "anything else"      ← most users skip; that is fine
  → tap the single primary button
  → AI writes it in ~1–2 s, shown in an editable box
  → tap "Copy & Post" → text is on the clipboard → Google review box opens
  → paste, tap Post
```
Time budget: **under 30 seconds**, **under 8 taps**, **zero typing required**.

---

## 3. Do / Don't

### Do
- **Fill the box.** The reviewer's job is to *approve* text, not to compose it.
- **Order chips by SEO value, but let the human ones look human.** Highest-value keywords go in the first row,
  where thumb and eye land first.
- **Vary the output.** Length, opening words, and sentence rhythm must differ every time. A profile where
  every new review is 3 sentences starting "I recently visited…" is a pattern Google can see and readers can feel.
- **Copy to the clipboard inside the tap handler.** iOS Safari silently refuses `navigator.clipboard.write`
  outside a user gesture. This one detail breaks half the DIY builds of this idea.
- **Show a paste instruction before the handoff.** The drop-off point is the moment Google's box opens and
  the user forgets why they are there. One line — "Now press and hold in the box → Paste" — recovers it.
- **Keep the review editable.** It is the customer's review. It is also the compliance argument.
- **Log scans and posts.** Without it you cannot tell a dead QR from a broken funnel.
- **Ask only about things the customer actually experienced.** Chips must be true-or-not-true, never leading.

### Don't
- **Don't gate negative ratings.** Selectively routing unhappy customers away from Google violates Google's
  policy and, in the US, the FTC rule. The private-feedback option must be an *addition* available to everyone,
  not a fork that replaces the public option.
- **Don't invent specifics.** No prices, no dates, no staff names, no outcomes the customer did not tap or type.
  The model must be prompted to *only* expand what it was given, and to drop keywords that do not fit.
- **Don't pre-tick chips.** Defaults would lift conversion, and would also put words in a customer's mouth that
  they never chose. That is the line between "assisted" and "fabricated".
- **Don't offer a reward for a positive review.** Incentivising *reviews* is allowed in some jurisdictions;
  incentivising *positive* reviews is banned everywhere that matters.
- **Don't generate more than a handful per device.** A single phone posting many reviews is the clearest
  fake-review signal there is. Rate-limit per IP.
- **Don't put the API key in the browser.** It goes in a serverless function's environment. A key in front-end
  JS is a key someone else is billing.
- **Don't stuff keywords.** Two or three woven naturally beat six listed. Google's spam systems and human
  readers both punish the listing pattern, and a keyword-stuffed review is worth less than a plain one.
- **Don't make the page look like a form.** Forms trigger "this will take a while". Chips read as a game.

---

## 4. Where we deliberately differ from the competition

| Competitor norm | What we do | Why |
|---|---|---|
| Star rating first | **Keyword chips first** | Fewer steps, and the taps become the review content instead of just a sentiment score |
| <3★ diverted to a private form | Everyone can post publicly; private feedback is an always-visible *extra* | Google's gating policy; FTC rule |
| One fixed review shape | Randomised length (short / medium / long) + varied opening angle | Reviews on one profile must not look mass-produced |
| Same chips for every customer | Priority chips fixed, secondary chips rotate per visit | Produces natural variety in wording across the profile |
| Generic tags | Chips written from *this* business's real search demand | The whole point: reviews that carry the terms people search |
| Key in the client / no limits | Key server-side in a Vercel function, per-IP rate limit | Cost and abuse control |

---

## 5. The variety engine (our differentiator, spec)

Reviews on one profile must not share a fingerprint. Three dials, seeded randomly per visit:

1. **Length** — weighted: ~35% short (1–2 sentences), ~45% medium (2–3), ~20% detailed (4–5).
   Real profiles are mostly short reviews with occasional long ones. Uniform length is the tell.
2. **Angle** — the model is told to lead with a randomly chosen facet: the room, the food, the safety, the
   location, the owner, the value, the move-in. Different lead = different-sounding review.
3. **Chip pool rotation** — priority chips (the SEO ones) always visible in the first rows; the secondary pool
   is shuffled and sampled per visit, so two customers rarely tap the same combination.

Plus hard style rules in the system prompt: plain phone-typed English, contractions allowed, no marketing
voice, no em dashes, no hashtags, no emoji, never open two variants the same way.

---

## 6. Technical shape that follows from all this

- **Static page + one serverless function.** Nothing else is needed, and it fits Vercel's free tier exactly.
- **Groq** for generation: fast enough (sub-second on `llama-3.3-70b-versatile`) that the wait feels like the
  page thinking, not the page hanging. Latency *is* a conversion feature here; a 6-second wait loses people.
- **Two locations, one deployment**, selected by a `?loc=` query param baked into each property's QR.
- **Clipboard + deep link handoff**, with `https://search.google.com/local/writereview?placeid=<PLACE_ID>` or
  the profile's own `g.page/r/<CID>/review` short link.
- **No database in v1.** Feedback logs go to the function's console (visible in Vercel logs); swap in Upstash
  or Vercel KV when the volume justifies it. Vercel's filesystem is read-only, so file logging is not an option.

---

## Sources
- [FTC final rule banning fake reviews and testimonials](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)
- [Sidley — FTC's rule on fake and AI-generated reviews](https://www.sidley.com/en/insights/newsupdates/2024/08/us-ftcs-new-rule-on-fake-and-ai-generated-reviews-and-social-media-bots)
- [SOCi — what the FTC and Google say about review gating](https://www.soci.ai/knowledge-articles/review-gating/)
- [SocialPilot — review gating risks and ethical alternatives](https://www.socialpilot.co/reviews/blogs/review-gating)
- [Google Business Profile API — work with review data](https://developers.google.com/my-business/content/review-data)
- [Google My Business API — accounts.locations.reviews reference](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews)
- [BrightLocal — Google review link and Place ID generator](https://help.brightlocal.com/hc/en-us/articles/360014993600-Google-Review-Link-Place-ID-Generator-Overview)
- [Magic Reviews AI](https://www.magicreviewai.com/)
- [MagicReview India — AI generated Google review cards](https://magicreview.in/)
- [MagicReply — Google review QR code](https://magicreply.ai/blog/google-review-qr-code)
- [QR Code AI — Google reviews QR generator](https://qrcode-ai.com/en-US/qr-code-generator/google-reviews)
