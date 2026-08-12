---
name: design-arbiter
description: Routes design work across the installed design skills (impeccable, emil-design-eng) and rules on the points where they contradict each other. Use when starting any UI work, when two design sources give conflicting guidance on motion timing, easing, stack choice, or copy, when building or reviewing a marketing/landing/portfolio surface, or when deciding which design command to run. Carries no aesthetic opinions of its own.
---

# Design arbiter

This project stacks three design sources. This skill decides which one governs a given
decision. **It contributes no design taste of its own** - that discipline is what keeps it from
becoming a fourth competing vocabulary, which is the failure mode it exists to prevent.

## Sources and what each owns

| Source | Owns | Installed as |
|---|---|---|
| **impeccable** | Base vocabulary, process, art direction, enforcement | `.claude/skills/impeccable/` + edit hooks |
| **emil-design-eng** | Motion mechanics and component interaction specs | `.claude/skills/emil-design-eng/` |
| **taste-skill** | Countable composition rules for marketing surfaces | harvested → `reference/marketing-rules.md` |

impeccable is the base because it is the only source with deterministic enforcement: 65
detector rules across regex, static-HTML, browser, and visual engines, wired to a `PostToolUse`
hook on every edit and a `Stop` deep pass. Those fire whether or not the model was paying
attention to any prose. The other sources are prose, and prose only works under attention.

### Detector tiers - the edit hook catches a subset

The three engines do **not** cover the same rules, and this matters operationally:

| Tier | Runs on | Catches |
|---|---|---|
| regex | any source file | literal patterns: `side-tab`, `gradient-text`, `overused-font`, `bounce-easing`, `gray-on-color` |
| static-HTML | `.html` files, with linked CSS | the above plus cascade-resolved rules: `oversized-h1`, `extreme-negative-tracking` |
| browser + visual | **a rendered URL only** | structural and computed rules: `nested-cards`, `tiny-text`, `low-contrast`, `text-occlusion`, `clipped-overflow-container` |

The edit hook runs the file tiers. **Structural and contrast rules cannot fire without a
rendered page.** Verified: `nested-cards`, `tiny-text`, and `low-contrast` exist only in
`detector/detect-antipatterns-browser.js` and `detector/browser/injected/`.

So a clean hook result is not a clean bill of health. Before shipping a surface, run
`/impeccable audit <target>` against a running dev server, or scan the URL directly:
`node .claude/skills/impeccable/scripts/detect.mjs http://localhost:3000`
(add `--viewport 390x844` for a mobile pass).

## Routing

**Before any design work:** run `/impeccable init` if `PRODUCT.md` is missing; without it the
commands fall back to generic SaaS patterns. **`init` writes `PRODUCT.md` only.** `DESIGN.md`
is written at finish by the `impeccable-documenter` subagent, or by `/impeccable document` for
an incumbent system. A missing `DESIGN.md` is not a reason to run `init`. See ruling 9.

| Task | Route to |
|---|---|
| New surface, or replacing the visual world | `/impeccable shape`, then new-work |
| Plan UX before code | `/impeccable shape` |
| Typography, color, layout, spacing | `/impeccable typeset` · `colorize` · `layout` |
| Too bland / too loud / too complex | `/impeccable bolder` · `quieter` · `distill` |
| **Adding motion - direction and thesis** | `/impeccable animate` |
| **Adding motion - durations, easing, component specs** | `emil-design-eng` (see ruling 2) |
| **Reviewing motion** | `review-animations`, or `improve-animations` for a codebase pass |
| Naming a motion precisely | `animation-vocabulary` |
| Visual iteration in the browser | `/impeccable live` (needs a dev server; see below) |
| UX review / technical audit / ship pass | `/impeccable critique` · `audit` · `polish` |
| Copy, edge cases, responsive | `/impeccable clarify` · `harden` · `adapt` |
| Capture the system from existing code | `/impeccable document`, `/impeccable extract` |
| Don't know | `/impeccable` with no argument - it reads live signals and recommends |

## Surface mode drives everything

impeccable classifies each surface as **Persuade** (marketing, landing, pricing), **Operate**
(app UI, dashboards, admin, tools), **Read** (docs, articles), or **Experience** (portfolio,
gallery). Pick it from the surface, not the product - a dev tool's landing page is still
Persuade; a fashion house's docs are still Read.

The mode is not cosmetic here. It decides two live rulings:

- **Durations.** Operate/Read: 150-250ms on most transitions, 300ms absolute ceiling, no
  page-load choreography. Persuade/Experience: one focal sequence may run 500-800ms; everything
  else stays under 300ms.
- **Marketing rules.** `reference/marketing-rules.md` applies to Persuade and Experience
  **only**. Loading it for a dashboard imports rules its own author excluded.

## Conflict rulings

Read `reference/conflicts.md` when two sources disagree, or when you want the evidence behind a
ruling. Summary:

1. **Motion volume** → impeccable. One authored moment per surface, not a per-section floor.
2. **Motion mechanics** → emil. Component specs, `:active` scale, `transform-origin`, GPU rules.
3. **Durations** → split by mode, above.
4. **Easing** → one token: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`. `ease-in` banned on UI.
5. **Stack** → impeccable. Inherit the incumbent framework, icons, and fonts. Never re-platform.
6. **Em-dash** → zero in user-visible copy.
7. **Review format** → emil's Before/After/Why table for motion reviews only.
8. **emil's canned first response** → suppressed; apply the content directly.
9. **DESIGN.md** → written by impeccable at finish, never by `init` and never by hand.
10. **The finish** → impeccable owns it on new work; the arbiter's chain is for refinement only.
11. **Image-first** → impeccable's visualize.md, not taste-skill's image-to-code.

## Live mode has its own rules

`/impeccable live` is not the normal flow with a browser attached. Three things differ:

- **No finish chain runs.** The overlay's preview is the verification channel. Do not
  screenshot, re-render, or audit between generate and accept; apply the craft floors by
  construction as you write. Full verification happens once, at accept, during carbonize
  cleanup.
- **Variation within identity, not between identities.** Phase A extracts an identity lock from
  `DESIGN.md`, CSS custom properties, computed styles, and sibling components, in that order.
  Default mode preserves it and varies one axis per variant, and `live.md` puts that at roughly
  90% of sessions. Departure mode needs the user to ask for it explicitly in the current
  request; a stale critique is not authorization. If unsure, you are in default mode.
- **Parameters are part of the design.** Each variant declares 0-4 coarse knobs sized to the
  element's visual weight: 0 for a button, 2-3 for a hero. Shipping a hero with zero knobs is
  the common failure, not a judgement call.

## Two things not to route around

**The concept roll.** For a genuinely open new surface, `new-work.md` runs
`concept-seed.mjs` to assign a direction from outside your own ranking, deals catalog
challengers, and puts the decision on a served page with a standing "category canon" exit. Its
entire purpose is that a single ranking is deterministic and therefore always ships the same
safe candidate. Picking a direction directly defeats it.

**a11y at design time.** impeccable deliberately keeps accessibility guidance in `audit.md`
rather than in the design-time path, because models over-correct into safe, underdesigned output
when reminded about accessibility while composing. Do not add a11y rules to this skill or to
`CLAUDE.md`. Run `/impeccable audit` instead - that is where the check belongs.

## Marketing and portfolio surfaces

Load `reference/marketing-rules.md`. It carries the countable composition rules impeccable has
no detector for - hero stack limits, layout-family repetition, zigzag caps, bento cell counts,
the color/shape/theme locks, CTA intent dedup, and the decoration-tell bans. Every rule in it
was checked against impeccable's 65 rule IDs for non-duplication.

It also carries the redesign preservation rules (SEO baseline, nav labels, form field names,
route slugs) and the out-of-scope routing table for surfaces these rules do not fit.

Its closing pre-flight is harvested from taste-skill's own final checklist, scoped to marketing
surfaces and deduped against impeccable's detector rules. Run it before declaring done.

## What not to do

- Do not install a second full design vocabulary alongside impeccable. Two vocabularies in one
  context cancel out - this is impeccable's own stated warning about Anthropic's
  `frontend-design` skill and it applies equally to any other base-layer design skill.
- Do not add aesthetic rules to this skill. Direction belongs in `DESIGN.md`, where impeccable
  enforces it. Rules here are routing and arbitration only.
- Do not edit files under `.claude/skills/impeccable/` or `.claude/skills/emil-design-eng/` -
  both are upstream and updatable (`npx impeccable update`, `npx skills update`). Overrides
  belong in `CLAUDE.md` or this skill.
