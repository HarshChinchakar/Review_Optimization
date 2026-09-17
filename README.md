# Feedback Scaler

A one-screen mobile page for **GVC Executive PG** (Ashoka Heritage, New DP Rd, Vishal Nagar / Pimple Nilakh).
A resident scans the QR at the door, taps a few things that were good about their stay, and Groq writes a
natural, keyword-rich Google review in their voice. They tap once more, the text is on their clipboard, and
Google's review box opens for them to paste and post.

**One property, one repo, one deployment, one QR.** This build serves GVC Executive PG and nothing else.
The other property (GVC PG Service, Kalewadi) gets its own copy of this repo, its own Vercel project and its
own QR — its own keywords, tone, accent colour and Google review link.

That separation is deliberate. Because there is only one property here, the QR encodes the **bare deployment
URL** with no query string, so a scan cannot land on the wrong property's chips or, worse, the wrong
property's review box. Any stray `?loc=…` on the URL resolves to Executive rather than switching anything.

Background reading, both written before the code and used as its spec:
- [docs/01-competitive-research.md](docs/01-competitive-research.md) — 8 comparable systems, what works, do/don't, compliance
- [docs/02-business-profile-audit.md](docs/02-business-profile-audit.md) — your profiles, your audience, the keywords, the psychology

---

## One thing you need to know before anything else

**A review cannot be posted automatically. There is no API for it, at any price.**

Google's Business Profile API can read reviews, reply to them and delete replies. It cannot create a review.
Google only accepts reviews written by a signed-in Google user in Search or Maps. That is a hard boundary, and
it also answers "publish by the user's email id" — the review posts from whatever Google account is on that
phone, which is exactly what makes it a real review.

Every paid product in this space (MagicReview, MagicReply and the rest) does the same thing we do: **copy to
clipboard, then deep-link into Google's review box.** The user taps Paste and Post. That is two taps, and this
build is engineered around making those two taps as certain as possible — the text is copied before anything
else happens, and the handoff sheet tells them the exact gesture to use when they land.

---

## What I need from you

| # | What | Why | Status |
|---|---|---|---|
| 0 | *(reference)* Paste the `g.page/r/…/review` link into a browser once and copy **where it lands** — `search.google.com/local/writereview?placeid=…`. Use that. Android app-links hand `g.page` straight to the Maps app, which drops people on the profile instead of the review box | Keeps the resident on google.com with a clipboard they can actually paste | ✅ done |
| 1 | **Who GVC Executive PG is for** | Answered: women stay there, so "Safe for women" and the caretaker / biometric / daily-owner-check chips are all in | ✅ done |
| 2 | **Amenity truth-check** | Done — `facts[]` and the chips now carry only the confirmed feature list. Meals, AC, hot water and laundry service were **removed**, since residents cook in their own flat kitchen. Re-check this whenever something changes | ✅ done |
| 3 | Your Vercel account (free tier is enough) | Deployment | — |
| 4 | A Groq key that isn't the throwaway one | The key in `.env` right now is the temporary one you shared, and you said you're revoking it | ⚠️ |

Nothing else. No Google API access, no OAuth, no verification, no database.

---

## Deploy to Vercel

The repo is already shaped exactly the way Vercel expects — static files in `public/`, serverless functions in
`api/`. No build step, no framework, no dependencies.

```bash
# 1. put it on GitHub
git init && git add -A && git commit -m "Feedback Scaler"
git remote add origin <your-repo-url> && git push -u origin main

# 2. vercel.com -> Add New Project -> import the repo
#    Framework preset: Other.  Build command: leave empty.  Output directory: leave empty.

# 3. Project Settings -> Environment Variables, add:
#    GROQ_API_KEY          gsk_...                          (all environments)
#    REVIEW_URL_EXECUTIVE  https://search.google.com/local/writereview?placeid=...
#    REVIEW_DESTINATION    composer   (or "profile" — see below)
#    GROQ_MODEL            openai/gpt-oss-120b              (optional)

# 4. Deploy. Then point the QR at the live URL:
npm run qr -- https://your-project.vercel.app
```

`npm run qr` writes `qr-executive.png`, `qr-executive.svg` and a printable A5 `poster-executive.html`,
all encoding the bare deployment URL.

**Adding the second property later:** copy this repo, replace the single entry in
[lib/business.js](lib/business.js) with that property's name, address, review link, accent and chips, then
deploy it as a separate Vercel project with its own `REVIEW_URL_…`. Print its QR from its own deployment.
Nothing is shared between the two, which is the point — neither can send a resident to the other's
Google review box.

Or straight from this folder without GitHub:

```bash
npx vercel        # preview
npx vercel --prod # production
```

**Environment variables are set in Vercel, not in `.env`.** `.env` is local-only and is gitignored — the key
never enters the repo, and it never reaches the browser either: all Groq calls happen inside `api/generate.js`.

---

## Run it locally

```bash
cp .env.example .env      # already done — your test key is in there
npm run dev               # http://localhost:3000
npm run smoke             # prints 5 sample reviews so you can judge the writing
npm run qr                # QR code + printable A5 poster
```

No `npm install` — there are zero runtime dependencies. Node 20+.

## Testing

```bash
pip install playwright    # one-off; uses your system Chromium, no 150MB download
npm run dev               # in one terminal
npm test                  # in another
```

`scripts/test-ui.py` drives real Chromium at 390×844 and 360×640 and runs **146 checks**: the API contract,
input validation and rate limiting, the anti-fabrication rules on generated text (no invented prices, no em
dashes, no emoji, no keyword listing, length actually varies), the full tap-to-post flow, the clipboard, the handoff sheet, returning to the page, the private path, colour contrast against WCAG AA,
44px tap targets, horizontal overflow, text clipping, and light *and* dark mode. Screenshots land in
`.screens/` so you can look at what it saw.

Bugs it has already caught: 42px tap targets, a review box that collapsed to zero height in dark mode, an
`AbortController` that was cancelling its own retries, and a single tapped chip being padded out into a
90-word review.

---

## Changing the keywords

Everything business-specific is in **[lib/business.js](lib/business.js)**. Each chip is two things:

```js
{ id: 'wifi', label: '100 Mbps WiFi', emoji: '📶', seo: '100 Mbps WiFi, holds up for work from home and video calls' }
//              ^ what the resident reads               ^ what the AI is told the tap means
```

That split is the whole trick. The resident sees three human words and taps instantly; the model receives the
search-shaped phrase and weaves it in naturally. Nobody is asked to read a keyword.

- `priority[]` — always shown, in order, in the first rows. Put your highest-value terms here; the thumb
  starts at the top and attention decays fast.
- `pool[]` — shuffled and sampled (8 of them) per visit, so two residents rarely tap the same combination and
  the profile doesn't fill up with reviews that read the same.
- `seoPool[]` instead of `seo` on a chip — rotate between several true phrasings of the same point. The
  `location` chip uses this to name a different work hub each time rather than reciting all six.

Edit, redeploy, reprint nothing — the QR URL doesn't change.

### `facts[]` — the boundary, and the reason nothing gets invented

`facts[]` is the complete list of what is actually true about this PG. It goes to the model on **every**
request, and it is the only thing the model is allowed to know.

It is not a list of things to write about. The review still only covers the chips the resident tapped —
`facts[]` exists so that when the model reaches for a detail to round out a sentence, the only details
within reach are real ones. Without it the model reaches for what it knows about PGs generally: a mess,
AC rooms, laundry service, a rent figure. None of those are true here, and a review claiming them is a
false statement published under a resident's name.

**So: anything you have not confirmed does not go in `facts[]`.** Meals, AC, hot water and laundry service
were deliberately left out for exactly this reason. If you add an amenity later, add the fact and the chip
together.

---

## How the local-search wording works

What ranks a profile for *"pg near me"* is not the phrase "near me" — Google resolves that from the
searcher's own GPS. What it matches on is **category + locality**: a profile whose reviews say "PG in
Vishal Nagar" or "PG near Hinjewadi" is the one it can confidently return for "pg near me", "best pg near
me" and "pg near hinjewadi" alike.

`SEARCH_ANCHORS` in [lib/business.js](lib/business.js) holds those phrasings. One is offered per review,
and only to **about 40%** of them. That rate is deliberate:

> Coverage accumulates across many reviews. Twenty reviews each naming the locality once is what ranks.
> One review naming it five times is keyword stuffing, and it gets the review filtered and the profile
> looked at. A review with no locality in it at all is doing its job too.

Three defences keep it from reading as planted, and all three exist because the model did each of these
before they were added:

1. The prompt forbids the anchor as a standalone sentence, with worked right/wrong examples.
2. `stripStuffedTail()` in [api/generate.js](api/generate.js) deletes a final sentence that is nothing but
   a place label — the `... staff are helpful. PG near Hinjewadi IT Park.` shape.
3. At most three place names may appear in one review, and the `location` chip rotates which hubs it names.

---

## Where the Post button lands

Two destinations, set by `REVIEW_DESTINATION`:

- **`composer`** (default) — `search.google.com/local/writereview?placeid=…`. Opens Google's review box
  directly. Fewest taps, and the one to use.
- **`profile`** — `google.com/search?q=<business> reviews`. Lands on the knowledge panel, so the resident
  still has to find *Write a review*. More taps, but it is plain google.com and can never be intercepted.

Use `profile` only if the composer keeps getting hijacked by the Maps app on real phones. A property with no
review link configured falls back to its `profileUrl` automatically — never to a Maps search, which is a dead
end for someone holding a clipboard.

**There is still no way to pre-fill the text or the stars.** Verified directly: Google strips `&rating=` and
`&review=` from the URL before redirecting, and cross-origin JS cannot touch Google's page. Clipboard plus
clear instructions is the whole of what is possible.

## How the writing stays honest (and why that's also what makes it work)

- The model is only allowed to expand points the resident actually tapped. No prices, dates, staff names,
  durations, or embellishments around a tapped point — and nothing outside `facts[]` even exists to it.
- Length is randomised — ~35% short, ~45% medium, ~20% detailed — because a profile where every new review is
  the same shape looks manufactured to readers and to Google.
- **Length is capped by how much the resident actually gave us.** One to three taps can never become a
  70-90 word review. That cap is not cosmetic: asking for eighty words off three taps is precisely what had
  the model padding the review out with true-but-untapped facts, which is fabrication with extra steps.
- **Voice is randomised independently of length** — seven registers, five structural shapes. Varying only
  the word count still produced twenty reviews that read like one person with twenty accounts.
- The opening facet is drawn from the resident's own taps, so the review never leads with something they
  didn't say.
- Two text guards run on every response, because the prompt alone did not hold: `scrubTells()` rewrites the
  giveaway phrases the model kept reaching for ("hassle-free"), and `dropIncompleteTail()` trims a review
  that was cut off mid-clause rather than putting a fragment on someone's clipboard.
- The text is fully editable before posting, and it posts from their account. It is their review.
- **No review gating.** The private-feedback link is visible to everyone at all times and never replaces the
  public path. Routing unhappy customers away from Google violates Google's review policy — most competitors
  in this space do it anyway, and it's the fastest way to get a profile's reviews filtered.
- Rate-limited per IP, because many reviews from one device is the clearest fake-review signal there is.
  The operational rule matters more than the code: never let people post from a reception phone.

---

## Groq notes

- Default model `openai/gpt-oss-120b`, with automatic fallback to `openai/gpt-oss-20b` then `qwen/qwen3.8-27b`
  if a model is retired, rejects the request, or its per-minute quota is full. Groq retires models fairly often;
  this is why the page won't break when they do.
- **Free tier is 8,000 tokens/minute per model**, and each review reserves ~950. That is roughly 6–8 reviews a
  minute before requests start bouncing to the fallback model. Fine for a PG; upgrade to Groq's Dev Tier if you
  ever roll this out across many properties.
- Typical generation takes 1–2 seconds.

---

## Files

```
api/generate.js      Groq call, prompt rules, model fallback, rate limit   (server-side; the key lives here)
api/config.js        Serves the chip set, shuffled per visit
api/feedback.js      Private feedback + funnel counters -> Vercel logs
lib/business.js      ← the file you'll actually edit: the property, all chips, all keywords
lib/http.js          Small request/response helpers
public/index.html    The entire mobile page — hand-written HTML/CSS/JS, no framework, no build
dev-server.js        Local dev only; Vercel never runs it
scripts/make-qr.js   QR code + printable A5 poster for this deployment
scripts/smoke.js     Prints sample reviews to judge quality
.claude/skills/      The two skills this was built against (see below)
```

## The two skills

Written into `.claude/skills/` and applied throughout this build:

- **[review-conversion-ux](.claude/skills/review-conversion-ux/SKILL.md)** — the behavioural design of a
  thumb-only, thirty-second review flow: chip ordering and phrasing, microcopy that converts, the clipboard
  and handoff mechanics, the line between assistance and fabrication, and the anti-patterns that kill completion.
- **[human-crafted-frontend](.claude/skills/human-crafted-frontend/SKILL.md)** — how to build UI that reads as
  made by a person: the fourteen tells of generated interfaces, deriving colour and type from a real brand
  instead of a framework default, and the small nuances that make an interface feel cared for.
