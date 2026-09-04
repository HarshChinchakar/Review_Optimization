---
name: human-crafted-frontend
description: How to write front-end that reads as designed by a person with taste rather than generated. Use when building or restyling any user-facing page, choosing colour/type/spacing, writing CSS, or reviewing a UI that feels generic. Catalogues the specific tells of machine-made interfaces, the decisions a real designer makes instead, and how to derive a look from a brand rather than from a framework default.
---

# Human-crafted frontend

A generated-looking UI is not ugly. It is *anonymous* — technically fine and clearly nobody's. That anonymity
costs trust, and on a page asking someone for a favour, trust is the whole conversion. This skill is about
putting fingerprints on it.

---

## 1. The tells — recognise them, then don't do them

If a page has three or more of these, it reads as machine-made:

1. **Default purple/indigo→blue gradient** on a hero, a button, or a badge. The single loudest tell.
2. **Everything on an 8-point grid with no exceptions.** Real spacing has a rhythm and then breaks it where
   meaning demands.
3. **Uniform border-radius everywhere.** One radius token applied to buttons, cards, inputs, avatars and the
   page alike.
4. **A `shadow-lg` on every card.** Real designers use one shadow at one elevation and mostly rely on borders.
5. **Perfectly symmetric padding** on every side of everything. Optical balance is rarely mathematical balance.
6. **Emoji as icons** in headings and buttons (🚀 ✨ 🎯) — the "AI slide deck" signature.
7. **Three feature cards in a row, identical shape, icon-title-paragraph.** The generated layout.
8. **Text at exactly `#666` on `#fff`, or pure `#000` on pure `#fff`.** Nobody with taste ships pure black.
9. **Gradient text on headings.**
10. **`Inter` (or the framework's default sans) at 400/600, no other type decision made.**
11. **Every element animated in on scroll, all with the same 300 ms ease.**
12. **Copy in the shape "Effortlessly streamline your workflow"** — adjective, verb, abstract noun.
13. **Centre-aligned everything**, including body text that runs several lines.
14. **A palette of exactly five equally-saturated colours** with no dominant neutral.

---

## 2. What to do instead — the decisions a person actually makes

### Colour: derive it, don't pick it
Start from something real about the business — the paint on the wall, the sign outside, the material of the
product, the mood of the place. Then build:

- **One dominant neutral** that is *not* pure grey. It is a warm off-white, a cool paper, a slate. This is 85%
  of the page. Getting this right does more than every accent decision combined.
- **One accent**, used sparingly. It appears on the primary action and on selected states. If your accent is on
  more than ~10% of the pixels, it is not an accent.
- **One text colour that is not black** — the neutral pushed very dark, usually with a trace of the same hue,
  so the page feels like one material. `#191817` on `#f6f5f2` reads warm and intentional; `#000` on `#fff`
  reads unfinished.
- **Secondary text is a *lighter mix of the ink*, not grey.** Mix the ink toward the background rather than
  reaching for `#888`.
- Borders are the background darkened a step, never `#ddd`.
- Dark mode is **not inverted light mode.** Backgrounds lift to a soft near-black with hue in it (`#131211`,
  not `#000`), text drops to a soft off-white (`#f0eeea`, not `#fff`), and the accent usually needs to become
  *lighter and less saturated* to stay comfortable — an accent that works on white will vibrate on black.

### Type: make two real decisions
- Choose a size ramp with **actual contrast**: if the heading and body differ by 4px, no decision was made.
  Big jumps (30 → 16) read as designed; timid ones read as default.
- **Set letter-spacing on large text.** Display sizes need negative tracking (`-0.02em` to `-0.03em`);
  small caps/labels need positive (`+0.08em`). Default tracking at 30px is the most common amateur tell.
- **Line-height inversely to size**: ~1.15 for display, ~1.5–1.6 for body. One global `line-height: 1.5` is a
  non-decision.
- Use a weight *between* the obvious ones where the family allows — 560, 640. It is a small thing that
  consistently reads as hand-tuned.
- The system font stack is a legitimate, often *better* choice on mobile — it renders instantly and looks
  native. Choosing it deliberately beats loading a webfont to look "designed".

### Space: rhythm, then deliberate breaks
- Use a scale, but **break it on purpose** where the content asks: the gap after a section heading should be
  smaller than the gap before it, because the heading belongs to what follows. That single asymmetry
  (`margin: 32px 0 12px`) instantly reads human, because it encodes meaning rather than arithmetic.
- **Optical, not mathematical, alignment.** A button with an icon needs slightly less padding on the icon
  side. Text next to a circle needs a nudge. Trust the eye over the number.
- Let one thing be **bigger than it needs to be** and one thing be **quieter than expected**. Uniform emphasis
  is the same as no emphasis.

### Shape and depth
- Pick **two** radii with a reason: containers larger (14–18px), controls smaller (10–12px), pills for chips.
  Nested corners should differ — an inner radius equal to its parent's looks wrong to the eye.
- Prefer **a 1px border in the darkened background colour** over a shadow. Use at most one shadow, and make it
  two layers: a tight almost-black hairline plus a wide, very soft ambient. Single-layer shadows look plastic.
- Never use a shadow *and* a heavy border *and* a background change to express the same state.

### Motion
- Short (120–200 ms) and only on state change. Transform and opacity only.
- The press state matters more than any entrance animation: `transform: scale(0.96)` on `:active` is felt.
- No scroll-triggered choreography. Honour `prefers-reduced-motion`.

---

## 3. Nuance — the small things that only appear when a person cared

These are the details reviewers point at when they say a UI "feels good":

- **The empty state has a personality**, and the loading state uses words, not just a spinner.
- **A state you would have forgotten** is handled: no network, the API key missing, the user coming *back* to
  the page after leaving, a chip label that is one word too long, a very long generated text.
- **Text does not shift when it changes.** Reserve the height of a line that will be filled later.
- **The disabled state explains itself** — "Pick a couple first" rather than a greyed-out mystery.
- **The copy is specific to this business.** A placeholder that says "e.g. the food on Sundays" belongs to one
  business; "Enter your feedback" belongs to none.
- **One small moment of delight that costs nothing** — a haptic tick on tap, a checkmark that draws itself,
  a thank-you line that sounds like a person wrote it.
- **Numbers are formatted like a human writes them**, and a count that hits 1 says "1 thing", not "1 things".
- **Something is slightly imperfect on purpose**: a chip row that doesn't justify, a heading that hangs a word,
  a card that isn't the same height as its neighbour. Machine layouts are suspiciously tidy.

---

## 4. Matching a brand you were given

Before writing CSS, answer these in one line each. If you cannot, ask — do not default.

1. **Who is on the other side of the screen, and what are they feeling right now?**
   (A woman in a PG hallway who just wants to be helpful, is not a writer, and is slightly self-conscious.)
2. **What is the physical place like?** Warm and homely, or clinical and premium? The page should feel like
   the room the QR is printed in.
3. **What one word must the page project?** Trustworthy. Fast. Warm. Professional. Pick one, not three.
4. **What would be embarrassing here?** (For a family-run PG: anything that looks like a startup landing page,
   a growth-hacky gradient, or corporate SaaS language.)

Then let the answers pick the palette and the voice. For a warm, family-run residence: warm paper background,
a terracotta or deep-saffron accent, generous rounding, plain Indian-English second-person copy, no gradients,
no "experience" or "seamless". For an executive property: cooler neutral, tighter radii, more restraint, less
warmth, shorter sentences.

**Two properties under one brand should share the skeleton and differ in temperature** — same layout, same
components, a shifted accent and a shifted voice. That is how a real design system handles sub-brands.

---

## 5. Code habits that keep it human

- **Write CSS a person could read.** Custom properties named for *role* (`--ink`, `--paper`, `--accent`,
  `--line`), not for value (`--gray-700`).
- **Hand-write the CSS for a page this size.** No framework, no utility soup. A single-purpose page does not
  need a build step, and shipping one is itself a tell.
- **Comment the two or three decisions that look odd but are deliberate** — the iOS clipboard ordering, the
  16px input rule. Real code carries scars; comment them like a person explaining to a teammate.
- **Don't over-abstract a one-off.** A component factory for three chips is a machine's instinct.
- **Ship the states**: `:active`, `:focus-visible` (never remove the focus ring — replace it with a better one),
  disabled, loading, error, empty, and the "came back to the page" case.
- **Semantic HTML.** `<button>` for actions, real labels, `aria-pressed` on toggles, sane document order. It is
  also the cheapest accessibility win there is.
- Test at **360×640** first. If it works one-handed on a small cheap Android phone, it works everywhere.
