# Architecture, as built

What is actually in this repository and why it is shaped that way. Current as of
the last verification: **build clean, typecheck clean, 172 tests passing across
12 files, 71 prerendered pages.**

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.2.12, App Router | Static marketing pages, an SEO-critical catalogue, a handful of interactive tools and one form endpoint. Exactly this shape. |
| UI | React 19.2, Tailwind v4 | — |
| Types | TypeScript strict | — |
| Database | Neon Postgres over the **HTTP driver**, Drizzle | Every query here is a single statement, and a pooled connection that outlives the serverless function that opened it exhausts the database. Costs interactive transactions; nothing here uses one. |
| Email | Resend, with React email templates | Both messages send `react` *and* a plain-text twin: some clients render text only, and a message with no text part scores worse with spam filters. |
| Spam | Cloudflare Turnstile | Chosen over reCAPTCHA for EU optics. |
| Analytics | Plausible, cookieless | No consent banner at all. Renders nothing until a domain is configured. |
| Forms | react-hook-form + Zod resolver | The client validates the same shape the server enforces, and the server still validates independently. |
| Notifications | react-hot-toast | Styled into the system, bottom-centre so it never collides with the sticky header. |
| Tests | Vitest | |

**Next 16 is not the Next.js most references describe.** `params`,
`searchParams`, `cookies` and `headers` are async only; the generated
`PageProps<'/route'>` helpers are the typing convention; `middleware` is renamed
to `proxy`; `turbopack` config is top-level rather than under `experimental`;
and custom variants belong in CSS as `@custom-variant` rather than as inline
arbitrary media queries, which Lightning CSS fails to parse. `AGENTS.md` says
this at the top of the repository for a reason.

## Route groups, and why there is no root layout

```
src/app/
  (site)/     root layout #1 — <html lang="bg">, fonts, analytics, public chrome
  (admin)/    root layout #2 — <html lang="bg">, no marketing chrome
  api/        route handlers
  robots.ts · sitemap.ts · manifest.ts · llms.txt/ · not-found.tsx · opengraph-image.tsx
```

There is deliberately **no `src/app/layout.tsx`**. Both roots live in route
groups, which is the documented pattern for multiple root layouts, and it is the
part most likely to be "tidied" back by someone who does not know why.

The split was forced by a real defect rather than by taste. The admin panel
inherited the marketing header, so on a phone the placeholder banner, the
utility strip and the navigation consumed most of the screen before the first
control — on the exact screen the owner uses standing in a warehouse.

## Public routes

18 route patterns, Latin-transliterated Bulgarian slugs, `dynamicParams = false`
so only real slugs render and everything else 404s.

```
/                          home
/[category]                4 categories
/[category]/[model]        48 model pages
/tseni                     price explainer
/naem-ili-pokupka          buy versus rent
/koya-mashina              recommender
/kak-raboti  /za-nas  /kontakti  /vaprosi  /kazusi
/rakovodstva  /rakovodstva/[slug]     3 regulatory guides
/zapitvane                 the enquiry form — dynamic, everything else is static
/obshti-usloviya  /poveritelnost  /biskvitki  /usloviya-za-naem
```

## The engines

`src/engine/` — one module per calculation, and every one of them is tested,
because they compute money.

| Module | Does |
| --- | --- |
| `terms.ts` | The five contract terms and the discount curve. A leaf module on purpose: the admin's price form needs the curve in the browser, and importing it from `rates.ts` would ship 50 machine records into the admin bundle to do one multiplication. |
| `rates.ts` | The derived monthly rate for a machine with no price entered — category baseline scaled by capacity and footprint against the median of its own category. |
| `catalogue.ts` | The record shape for per-model settings, shared between the store and the engine. |
| `quote.ts` | `quote(model, term)` → monthly, daily, total, reduction against the 12-month baseline, what is included. |
| `volume.ts` | Headcount and shifts → expected daily volume, from the published 0.1–0.2 purchases per person per day. |
| `recommend.ts` | Deterministic scoring, not an LLM. Answers with a plan rather than a machine. |
| `alternatives.ts` | Three computed alternatives per model, with a manual override hook. |
| `buy-vs-rent.ts` | Total cost over the term on both sides, allowed to conclude that buying is cheaper. |

Coverage dominates the recommender's scoring for a reason found in testing: it
once ranked a snack-only machine first for a request that asked for coffee *and*
snacks, because size and availability outweighed product coverage. Full coverage
is now +35 and partial is −45, and a partial match states plainly what it does
not cover. That is locked with a test.

## The enquiry pipeline

**Validate → store → then email.** If mail fails the lead is already safe and
the visitor still sees success, because from their side it did succeed.

Four visible fields. Machine, term and recommender output are carried from
wherever the visitor came from rather than asked again — measured form data puts
three fields near 23% completion and seven near 11%, and this is the only page
whose conversion actually matters.

| Module | Notes |
| --- | --- |
| `enquiry-schema.ts` | Split from the action deliberately: a `"use server"` module may only export async functions, and exporting the Zod schema from it breaks submission. Caught by an end-to-end test, not by the build. |
| `enquiry-store.ts` | Neon through Drizzle when `DATABASE_URL` is set, a local JSON file otherwise, so the whole flow runs without credentials. `storageHealth()` says out loud that the file store loses data on an ephemeral filesystem, and the admin renders that warning. |
| `mailer.ts` | The notification carries every piece of context the visitor gave, so the reply can be a real price rather than another round of questions. Without a key both messages log to the console rather than vanishing. |
| `turnstile.ts` | A verification **outage lets traffic through**: losing a real lead costs more than admitting one bot. |
| `auth.ts` | HMAC-signed cookie, constant-time password compare. With no `ADMIN_PASSWORD` the admin is **disabled** rather than falling back to a default. |
| `model-settings-store.ts` | Same two-implementations-behind-one-interface shape. **Read failures are not fatal here** — settings are read during a build across ~60 pages, and a database that blinks mid-deploy must not become a failed deploy. Callers fall back to the derived rate: the site renders, the banner stays up, nobody sees a wrong number. |

## The mailbox

`info@rent-a-vend.com` is a real inbox, not a decoration. The domain holds MX,
SPF and DKIM records in Resend, and `api/inbound` receives the webhook.

Two things happen to every incoming message, in this order and for different
reasons. It is **recorded**, so the conversation can be answered from the admin
panel and the reply leaves as `info@` — which a forward can never do. And it is
**forwarded** to the owner's Gmail, because a panel nobody has open notifies
nobody. Recording first is deliberate: a forward that fails costs a
notification, a record that never happens costs the conversation.

Resend's own `emails.receiving.forward()` is not used because it does not set
`Reply-To`, so the copy arrives from our own domain and pressing Reply in Gmail
writes back to us instead of to the customer — on a site whose headline promise
is an answer within one working hour, that is the whole point of the feature.

Webhooks carry metadata only, so bodies and attachments need a second call to
the Received Emails API.

## Admin

`/admin/vhod` to sign in, then:

| Screen | Purpose |
| --- | --- |
| `/admin` | Dashboard |
| `/admin/tseni` | Prices, per machine, per term. Type the 12-month figure and the other four fill in, editable, monotonicity enforced. |
| `/admin/zapitvaniya` | Enquiries: date, name, phone, email, machine, term, calculator result, notes, and a status — new · in-progress · quoted · won · lost. |
| `/admin/poshta` | The shared mailbox: threads, messages, replies that leave as `info@`. |

Enquiry management came before statistics on purpose. Charts show zeros until
there is traffic; a list with a status is what one person needs from day one.

The panel is built for a phone in a warehouse, carries an unconditional
`noindex`, and is Bulgarian permanently.

## Data

`content/` is typed, validated at module load, and is the source of truth for
everything the site publishes: the catalogue and its taxonomy, the FAQ, three
guides, three case studies, and four legal documents.

Postgres carries only what changes: `enquiries`, `model_settings`,
`mail_threads`, `mail_messages`. Migrations are generated from the schema and
applied with `db:migrate`; **nothing creates tables at runtime**, so a fresh
database needs a migration before the first enquiry.

## Design system

Three type families, all with real Cyrillic subsets — Oswald for condensed
signage display, Commissioner for reading, JetBrains Mono for identifiers.
`lang="bg"` plus `locl` is what makes the browser draw в г д и к л п ц ш щ in
their Bulgarian forms rather than their Russian ones, and it is the cheapest
possible signal that the site was made for this market rather than translated
into it.

The rest — the palette, the material utilities, the named rules and the reasons
behind them — is [DESIGN.md](../DESIGN.md).

## Placeholder machinery

`lib/placeholders.ts` is the registry: every item the client still owes, who
owns it, and whether it blocks launch. `npm run readiness` reads it and prints
the state; `npm run build:launch` runs it strict and refuses to build while
anything blocking is open; the site renders a visible banner while any blocking
item is unresolved.

Company facts live in `lib/company.ts` and unresolved values use `[[TOKEN]]`
markers, which the readiness check scans for, so nothing half-filled can ship.

## Environment

Every variable is documented in `.env.example` and none is required locally.

`NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_SITE_INDEXABLE` · `DATABASE_URL` ·
`ADMIN_PASSWORD` · `ADMIN_SESSION_SECRET` · `RESEND_API_KEY` · `MAIL_FROM` ·
`MAIL_TO` · `RESEND_WEBHOOK_SECRET` · `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ·
`TURNSTILE_SECRET_KEY` · `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` ·
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` · `NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER`
