# Marketing-surface rules (harvested)

Countable composition rules for **Persuade and Experience surfaces only** - landing pages,
marketing, campaigns, pricing, portfolios, galleries.

Do **not** apply these to Operate (app UI, dashboards, admin, settings) or Read (docs,
articles, changelogs) surfaces. The upstream source explicitly excludes those:
*"Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step
product UI."*

Derived from `Leonxlnx/taste-skill` (MIT). See `/NOTICE`.

## Why this file exists

Every rule below was checked against Impeccable's 65 detector rule IDs and its
`craft-floor.md`. **Nothing here duplicates a rule Impeccable already enforces.** Impeccable
already covers eyebrow spam, section numbering, nested cards, gradient text, the cream/beige
palette, italic serif displays, overused fonts, line length, contrast, buzzwords, oversized
h1, marquees, flat type hierarchy, and icon-tile stacks - those are detector-enforced and are
deliberately absent here.

These are the mechanically checkable composition rules Impeccable has **no** rule for.

## Hero

- **Max 4 text elements total.** Optional eyebrow OR brand strip (pick zero or one), headline,
  subtext, CTAs. Nothing else.
- **Headline max 2 lines desktop. Subtext max 20 words AND max 3-4 lines.** A 4-line hero
  headline is a font-size error, never a copy-length error.
- **Top padding cap `pt-24`** (~6rem) desktop. More reads as a layout bug, not intentional space.
- **Banned inside the hero:** tagline below the CTAs, trust micro-strip, pricing teaser,
  feature bullets, social-proof avatar row. All move to sections below.
- **"Trusted by" logo wall goes under the hero,** never inside it.
- **Hero needs a real visual.** Text plus a gradient blob is a placeholder, not a hero.
- **No version labels as hero eyebrows** (`V0.6`, `BETA`, `EARLY ACCESS`) unless the brief is
  explicitly about launch status.

## Section composition

- **Layout-family repetition ban.** Once a layout family is used (3-col cards, full-width
  quote, split text/image), it appears at most **once** more. An 8-section page uses **at least
  4 distinct layout families**.
- **Zigzag cap: max 2 consecutive** image+text split sections. The 3rd is a fail. Break with a
  full-width section, vertical stack, bento, or different family.
- **Split-header ban.** "Left big headline + right small explainer paragraph" as a section
  header is banned as a default. Stack them vertically at max 65ch instead. Allowed only when
  the right column carries a real visual or interactive element, not filler text.
- **No floating top-right sub-text** in section headings. The tiny corner paragraph is the tell.
- **Bento cell count = content count.** 3 items → 3 cells. An empty cell means the grid was
  planned wrong; re-shape it, never paste a blank tile.
- **Bento background diversity.** At least 2-3 cells in any multi-cell grid need real visual
  variation (image, pattern, tinted background). Six white-on-white cards with text is the
  default failure.
- **Marquee: max one per page.** Two or more reads as filler.

## Locks (pick once, hold page-wide)

- **Color lock.** One accent, used across the whole page. No blue CTA in section 7 of a
  warm-grey site. Audit every component before shipping.
- **Shape lock.** One corner-radius scale. Mixed systems allowed only under a documented rule
  ("buttons pill, cards 16px, inputs 8px") followed everywhere.
- **Theme lock.** The page has one theme. No light section sandwiched between dark ones.
  Section-level tints within a family are fine (`bg-zinc-950` next to `bg-zinc-900`); flipping
  to `bg-amber-50` mid-page is broken. One deliberate full theme switch is allowed if the brief
  calls for it.

## CTAs and controls

- **CTA text fits one line at desktop.** A wrapped primary CTA is a fail. Fix by shortening the
  label (3 words max, ideally 1-2) or widening the button - never by constraining `max-width`.
- **One label per intent.** "Get in touch" + "Contact us" + "Let's talk" on one page is a fail.
  Pick one label and use it in nav, hero, and footer. Same for signup intent and portfolio intent.
- **Nav renders on one line at desktop** (`lg`, 1024px). Height cap 80px, default 64-72px.

## Content and copy

- **Lists over 5 items need a different component,** not a longer list. Reach for a 2-column
  split, card grid, tabs/accordion, scroll-snap pills, or a marquee.
- **Spec tables: no `border-t` AND `border-b` on every row.** Pick one, use it sparsely, or
  group 10 specs into 3 labelled clusters.
- **Quotes max 3 lines.** Attribution is name + role, never name alone.
- **Fake-precise numbers are banned** unless real or explicitly marked mock. Don't invent
  engineering precision (`92%`, `5.8 mm`, `4.1×`) the brand doesn't claim.
- **No generic names or startup-slop brand names.** Not "John Doe", not "Acme"/"Nexus"/"SmartFlow".
- **One copy register per page.** Don't mix technical mono, editorial prose, and marketing punch.
- **Copy self-audit before ship.** Re-read every visible string. Rewrite anything grammatically
  broken, with unclear referents, or that reads as LLM trying to sound thoughtful
  (forced metaphors, fake-craftsman labels, mock-poetic micro-meta). Plain beats cute.

## Decoration tells (banned by default)

- **Scroll cues.** `Scroll`, `↓ scroll`, animated mouse-wheel icons. If they haven't scrolled,
  they're looking at the hero. They know what scroll is.
- **Locale / time / weather strips.** "Lisbon 14:23 · 18°C" in nav or hero. A contact address in
  the footer is fine; an atmospheric locale strip is not.
- **Hero-bottom decoration text strip.** `BRAND. MOTION. SPATIAL.` mono-caps strips. Allowed
  only if the strip carries real navigable links or real status.
- **Decorative status dots** before nav items, list rows, or badges. Allowed only for real
  semantic state, max one per section.
- **Pills or tags overlaid on images.** Let the image speak, or caption below it, outside the image.
- **Photo-credit captions as decoration.** `Frame XII · 35mm` under a placeholder image is
  pretentious. Real credit for a real photographer only.
- **Version footers on marketing pages.** `v1.4.2`, `last sync 4s ago · main`.
- **Middle-dot rationed.** Max 1 per line in metadata strips. Not the default separator.
- **Vertical rotated text.** Agency cliché unless the brief is explicitly experimental.
- **Crosshair / hairline grid lines as pure decoration.**

## Images

- **Real images are mandatory, even on minimalist pages.** A pure-text page is incomplete work,
  not minimalism. Even a restrained editorial site needs 2-3 real images.
- **Priority order:** image-generation tool if one is available in the environment → real
  photography (`https://picsum.photos/seed/{descriptive-seed}/{w}/{h}`, or brand/stock URLs the
  brief provides) → clearly-labelled placeholder slots plus an explicit list of what the user
  must supply. Never silently skip.
- **Div-based fake screenshots are banned.** A product preview built from styled `<div>`
  rectangles (fake task list, fake terminal, fake dashboard) is the single most recognisable
  tell. Use a real screenshot, a generated image, a real mini component preview, or nothing.
- **Logo walls are logos only.** No category labels underneath (`Stripe` + `payments`). For
  invented brands, generate a simple inline SVG monogram - plain text wordmarks look generic.
- **Hand-rolled decorative SVG illustrations: strongly discouraged.** Icons from a library are fine.

## Typography mechanics

- **Italic descender clearance.** When italic display type contains `y g j p q`, `leading-none`
  clips the descender. Use `leading-[1.1]` minimum plus `pb-1` reserve on the wrapper. Audit
  every italic word in a display headline before shipping.
- **Same-family emphasis only.** To emphasise a word in a headline use italic or bold of the
  *same* font. Injecting a serif word into a sans headline is amateur.

## Redesign preservation (harvested from §11)

Impeccable's `new-work.md` covers redesign intent well but is not specific about the downstream
breakage. These are:

**Never change silently - explicit approval required:** URL structure and route slugs, primary
nav labels, form field names and order (breaks analytics and autofill), brand logo or wordmark,
existing legal / consent / cookie copy.

**Audit before touching:** current brand tokens, information architecture and conversion paths,
which content blocks are doing work, signature interactions worth preserving, and the **SEO
baseline** (ranking pages, meta titles, structured data, OG cards). SEO migration is the single
biggest redesign risk and nothing else in this stack mentions it.

**Modernisation levers, in priority order** - stop when the brief is satisfied: typography
refresh (biggest lift per unit of risk) → spacing and rhythm → color recalibration → motion
layer → hero and key-section recomposition → full block replacement (only when unsalvageable).

If IA, content, and SEO are sound, prefer targeted evolution over full redesign: roughly 70% of
the value at 40% of the risk.

## Out of scope (harvested from §13)

This file, and the taste-skill material it derives from, is **not** for these. Say so explicitly
and point at the right tool rather than applying marketing rules to them:

| Surface | Use instead |
|---|---|
| Dashboards, dense product UI, admin panels | Fluent, Carbon, Atlassian, or Polaris - and impeccable's `operate.md` |
| Data tables | TanStack Table or AG Grid |
| Multi-step forms and wizards | Form-specific patterns; these rules will not improve them |
| Code editors | Monaco or CodeMirror with their official skinning |
| Native mobile | Apple HIG / Material directly - impeccable's `ios.md` / `android.md` |
| Realtime collaborative UI (presence, cursors, OT) | A different problem class entirely |

Only the marketing, about, and landing surfaces of such a product take these rules.

## Pre-flight (harvested from §14)

Run before declaring done. Every box must honestly pass; a box that cannot be ticked means the
page is not finished. Items impeccable's detectors already enforce are omitted here - the hook
covers those. What remains is what nothing else in this stack checks.

**Direction**
- [ ] Design read declared in one line before any code was written.
- [ ] If a redesign: mode detected (preserve vs overhaul) and the audit above performed.

**Locks**
- [ ] One theme for the whole page. No section flips light/dark mid-scroll.
- [ ] One accent color, used identically across every section.
- [ ] One corner-radius system, applied consistently.

**Hero**
- [ ] Headline ≤ 2 lines; subtext ≤ 20 words AND ≤ 4 lines; CTA visible without scrolling.
- [ ] Hero top padding ≤ `pt-24` at desktop.
- [ ] ≤ 4 text elements. No tagline under the CTAs, no trust micro-strip, no pricing teaser.
- [ ] Logo wall sits under the hero, uses real SVG marks, not plain text wordmarks.
- [ ] No version label (`V0.6`, `BETA`, `INVITE-ONLY`) as the hero eyebrow.

**Composition**
- [ ] At least 4 distinct layout families across 8 sections; no family used more than twice.
- [ ] No 3+ consecutive image+text split sections.
- [ ] No split-header pattern (big left headline + small right explainer paragraph).
- [ ] No floating top-right sub-text in section headings.
- [ ] Bento grids have exactly N cells for N items, and 2-3 cells carry real visual variation.
- [ ] ≤ 1 marquee on the page.

**Controls and copy**
- [ ] Every CTA label fits one line at desktop; ≤ 3 words on primaries.
- [ ] One label per intent across nav, hero, and footer.
- [ ] Nav renders on one line at desktop, height ≤ 80px.
- [ ] Quotes ≤ 3 lines; attribution is name + role.
- [ ] Copy self-audit done: every visible string re-read, nothing grammatically broken or
      LLM-poetic shipped.
- [ ] No fake-precise numbers, generic names, or startup-slop brand names.

**Assets**
- [ ] Real images present. Zero div-based fake screenshots. Zero hand-rolled decorative SVG.
- [ ] No pills or labels overlaid on images; no decorative photo-credit captions.
- [ ] Italic display words containing `y g j p q` have `leading-[1.1]` min plus `pb-1` reserve.

**Decoration tells**
- [ ] No scroll cues, locale/time/weather strips, hero-bottom text strips, decorative status
      dots, version footers, or micro-meta sentences under eyebrows.

**Motion** (defers to the arbiter's rulings 1-4, not to taste-skill's dials)
- [ ] Every animation justifiable in one sentence.
- [ ] Reduced-motion handled for everything that moves.
- [ ] No `window.addEventListener('scroll')` - use `useScroll()`, ScrollTrigger,
      IntersectionObserver, or CSS scroll-driven animations.
- [ ] `useEffect` animations have cleanup functions.

**Responsive**
- [ ] Mobile collapse explicit per section for every multi-column layout.
- [ ] `min-h-[100dvh]`, never `h-screen`.

Note: taste-skill's own §14 also carries a "motion claimed, motion shown" box requiring the page
to animate whenever its motion dial exceeds 4. **That box is deliberately omitted** - it
contradicts arbiter ruling 1, where impeccable's one-authored-moment rule wins.
