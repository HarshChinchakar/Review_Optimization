---
name: review-conversion-ux
description: Applied behavioural design for a one-screen, thumb-only flow whose goal is a completed public review. Use when building or editing the review page, writing chip labels, ordering chips, wording buttons or microcopy, tuning the handoff to Google, or any time a decision could add or remove a tap. Encodes the persuasion tactics that work on a scanned-QR mobile page, the exact line between assistance and fabrication, and the anti-patterns that kill completion.
---

# Review-conversion UX

The user has scanned a QR standing in a hallway. They are giving you **thirty seconds and one hand**.
Every decision below is scored against one number: **scans that end in a posted review**.

---

## 1. The five laws of this specific screen

**Law 1 — The blank box is the enemy.**
The reason people don't leave reviews is not unwillingness; it is the *composition task*. A blank field asks a
non-writer to perform in public under their real name. Our entire product is the removal of that task. Never
add a step that requires the user to originate language. Every required input must be answerable by **tapping**.

**Law 2 — Progress is the only motivator that survives a hallway.**
There is no reward at the end for the user. The only thing pulling them forward is the feeling of being nearly
done. So: show the whole thing on one screen, make the first tap happen within one second of landing, and let
each tap produce visible change. Never show a step counter that reveals there are many steps.

**Law 3 — Commitment compounds. Get the first tap cheap.**
The first chip tap is the foot in the door: once someone has invested three taps they will finish, because
abandoning now wastes the investment (sunk cost, plus consistency — they have already told you it was good).
Therefore the first interaction must be the *easiest possible*: no rating scale to consider, no text, no
scrolling. Just an obviously-true statement they can agree with.

**Law 4 — Fluency is trust.**
Anything that stutters — a slow response, a jumpy layout, a spinner with no words, a font that loads late —
gets read as "this is sketchy" and the user leaves. Perceived speed is a persuasion variable. Budget: page
interactive **< 1 s**, generation **< 3 s**, and if generation will exceed ~1.2 s, *narrate the wait*
("Writing your review…") rather than showing a bare spinner.

**Law 5 — The last five seconds are where reviews die.**
The user lands in Google's own review box, and it is a blank field again with no memory of why they are there.
Everything you did is wasted unless you (a) put the text on their clipboard *before* the jump, and (b) tell them
in one short sentence what to do the instant they arrive. Design the handoff with more care than the rest of
the page combined.

---

## 2. The chip grid — the highest-leverage surface

The chip grid *is* the product. Rules:

**Ordering.** Highest-value chips first, in the top-left two rows. On a phone held one-handed, attention and
thumb both start at the top of the content block and decay fast; the first row gets multiples of the taps the
fourth row gets. Put your commercial priorities where the thumb already is — do not use visual shouting to
drag attention downward.

**Phrasing.** Chips must be written in **resident voice, not search voice**.
- Wrong: `safe PG for girls in Kalewadi` — reads as SEO, and nobody thinks in search strings.
- Right: `Feels safe` — instantly true-or-false, one glance.
The search phrasing lives in the *prompt*, not on the chip. The model bridges the two. This separation is the
single most important design rule in the system: **the human sees human words; the AI receives commercial words.**

**Length.** One to three words. If a chip needs four words, it is two chips or it is a question, not a chip.

**Truth-testability.** Every chip must be something the user can confirm or deny from memory in under a second.
`Owner responds fast` passes. `Great value for money` is a judgement they may not have formed — weaker, but
acceptable. `Best PG in Pune` is a claim you are asking them to make on your behalf — banned.

**Count.** 10–16 visible. Fewer feels thin and produces same-y reviews; more triggers choice paralysis and a
scroll. If you need more, rotate the pool rather than growing the grid.

**Never pre-select.** Pre-ticked chips would raise completion — and they put words in someone's mouth that they
did not choose, which is the exact definition of the thing we must not do. This is a hard line, not a preference.

**Rotation for variety.** Priority chips are fixed; the remainder is shuffled and sampled per visit, so two
residents rarely tap the same set and the profile does not fill with clone reviews.

**Feedback on tap.** State change must be instant and physical: colour fill, a ~0.96 scale press, and an 8 ms
haptic via `navigator.vibrate(8)` where supported. Tap feedback that lags by even 100 ms reads as a broken page.

**Selection floor, not ceiling.** Keep the primary button disabled until 2–3 chips are selected — an
implicit goal that pulls people to a third tap — but never cap selections. Someone tapping eight chips is your
best customer; let them.

---

## 3. Microcopy patterns that measurably work here

| Slot | Use | Avoid | Why |
|---|---|---|---|
| Page opener | `What was good about your stay?` | `Please rate your experience` | A question about *them* beats an instruction to *do work* |
| Time promise | `Takes 20 seconds` | (nothing) | Explicit small cost removes the main objection before it forms |
| Effort promise | `No typing needed` | `Fill in the form` | Names the exact fear |
| Primary button, pre-generation | `Write my review →` | `Submit` / `Generate` | First person; it's *theirs*, and `Submit` implies a form |
| Waiting | `Writing your review…` | a bare spinner | Narrated waits feel ~30% shorter |
| Ownership line | `This is your review — change anything you like` | `AI-generated content` | Ownership drives both posting *and* honesty |
| Handoff button | `Copy & post on Google` | `Continue` | Says exactly what happens next; no ambiguity at the riskiest moment |
| Paste instruction | `Long-press the box → Paste → Post` | `Please paste your review` | Names the gesture; the user is now inside an unfamiliar UI |
| Reword | `Say it differently` | `Regenerate` | Human verb; also invites the second look that improves quality |

**Tone rules.** Second person. Present tense. Contractions. No exclamation marks except in the thank-you.
No emoji in buttons (they read as a toy); one or two in chips is fine (they aid scanning). Never use the word
"AI" in the primary path — it invites the question "is this allowed?" at the moment you most need momentum.
Disclose it plainly in the ownership line and the fine print instead. That is honest without being alarming.

---

## 4. The handoff — engineer this like a launch sequence

```
tap → copy to clipboard (INSIDE the tap handler, synchronously) →
confirm visually ("Copied ✓") → show the paste instruction →
open Google's review URL
```

Non-negotiables:
- **`navigator.clipboard.writeText()` must be called inside the user-gesture handler.** iOS Safari refuses it
  from an async continuation after an `await`. If you must await something first, copy *first*, then await.
  This single mistake breaks the majority of DIY builds of this flow.
- **Always keep a fallback**: a hidden `<textarea>`, `select()`, `document.execCommand('copy')`. Old Android
  webviews and in-app browsers (Instagram, WhatsApp) still need it.
- **Show the copy confirmation before navigating.** A ~600 ms beat with `Copied ✓` visible is what makes the
  user *believe* the paste will work when they get there.
- **Keep the text on screen after the jump** — when they come back (and some will), the review must still be
  there, with a `Copy again` button. Never reset state on return.
- **Same-tab navigation beats a new tab on mobile.** `window.open` is eaten by popup blockers inside in-app
  browsers; `location.href` is not.
- **Instruct with the *gesture*, not the concept**: "Long-press → Paste", with the words in the order the
  thumb performs them.

---

## 5. The line: assistance vs. fabrication

The product is defensible only if every review is a real customer's real opinion, expressed for them. Hold
these five and the flow stays on the right side of Google's policies and the FTC's Consumer Review Rule
(which bans reviews from people with no genuine experience — not AI assistance itself):

1. **Only expand what was tapped or typed.** The model may add connective language and natural phrasing.
   It may never add a fact: no prices, no dates, no durations, no staff names, no outcomes, no comparisons to
   competitors, no claims about things not selected. Enforce this in the system prompt *and* keep chips concrete.
2. **Always editable, always visible before posting.** The user sees the exact final text and can change every
   word. This is what makes it their statement rather than yours.
3. **Never gate the negative path.** Routing unhappy customers away from the public review violates Google's
   policy. A private-feedback option may exist for *everyone*, always visible, never as a replacement for the
   public path. If someone taps negative chips, generate the honest negative review just as willingly.
4. **Never reward a positive review.** Asking everyone is fine; paying for praise is not.
5. **One review per person, from their own phone, their own account.** Rate-limit. Never post from a
   reception device.

If a request would cross these — pre-ticked chips, a hidden negative funnel, "make it sound like a different
person", generating without a real customer present — say plainly which line it crosses and offer the nearest
compliant version. It is nearly always available and nearly always converts about as well.

---

## 6. Mobile mechanics that are actually conversion features

- **Thumb zone.** Primary action within the bottom third, full width, ≥ 56 px tall. Sticky at the bottom once
  the user has selected anything — never make them scroll to find the way forward.
- **Tap targets ≥ 44 px**, ≥ 8 px apart. Mis-taps on chips are silent conversion killers.
- **No hover states.** They stick on touch and look broken. Style `:active` instead.
- **`font-size: 16px` minimum on any input** or iOS zooms the viewport and the layout appears to break.
- **`-webkit-tap-highlight-color: transparent`** plus your own press state, always.
- **Respect `env(safe-area-inset-bottom)`** or the sticky button sits under the home indicator.
- **`viewport-fit=cover`, `user-scalable` left alone** (never disable zoom — accessibility, and it signals
  a cheap page).
- **One-hand reachability:** nothing essential in the top 15% of the screen except identity.
- **Assume a bad connection and an in-app browser.** No external fonts on the critical path, no framework, no
  render-blocking anything. The page should be usable at 3G on a ₹8,000 Android phone.
- **Never auto-focus a text input.** The keyboard covering the screen on landing is an instant bounce.
- **`prefers-reduced-motion`** — honour it; springy animation is decoration, not persuasion.

---

## 7. Anti-patterns (each one is a real, observed conversion killer)

- A **splash or logo screen** before the interaction. Every 100 ms costs completions.
- **Asking for name, email or phone** before the review. It converts a 20-second favour into a data transaction.
- **Multiple pages / a wizard**. One screen, revealed progressively.
- A **star rating as step one** when chips can carry sentiment — it is a step that produces no review text.
- **Three variants to choose from.** Choice costs more than it gains here; show one, offer *Say it differently*.
  (Only offer variants if the user asked for them.)
- **A long generated review by default.** Long reviews look manufactured on a small profile and take longer to
  read and approve. Vary length; skew short.
- **Any modal or interstitial with a close button.** Every dismissal is an exit opportunity.
- **`alert()`** — looks broken on mobile, blocks the thread.
- **A progress bar showing "Step 1 of 4"** — it tells them the cost is high.
- **A thank-you screen with nothing on it.** Use it: ask them to tell a friend looking for a place.

---

## 8. Instrumentation — what to count

Scans → first chip tap → generation → copy → return-to-page → (posted, unverifiable). The two numbers that
matter are **first-tap rate** (is the page persuasive) and **copy rate** (is the review good enough to post).
If first-tap is low the chips are wrong; if copy rate is low the *writing* is wrong. They are different fixes.
