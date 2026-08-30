# Rent-a-Vend

Lead generation site for vending machine rental in Bulgaria. One measurable
output: a qualified enquiry reaching the owner, carrying enough context that he
can answer it with a real price for a real machine.

Bulgarian only, one language, no locale segment. The two sister sites —
`buy-a-vend` (sells refurbished machines across Europe) and `sell-a-vend` (buys
used fleets in) — are separate repositories sharing this design system and this
company.

```bash
npm install
cp .env.example .env      # everything is optional for local development
npm run dev               # http://localhost:3000
```

With no keys at all the site runs, the catalogue renders, the enquiry form
validates and the submission is printed to the console instead of emailed.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run build:launch` | `readiness --strict` then build. Fails while anything blocking is unresolved |
| `npm run readiness` | Prints what is still placeholder and who owes it |
| `npm test` | Vitest — 172 tests across 12 files |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from a schema change |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run brand:assets` | Regenerate favicons and icons from the logo |

## Layout

```
src/
  app/(site)/        the public site — 18 route patterns, Bulgarian slugs
  app/(admin)/       the owner's panel: prices, enquiries, mailbox
  app/api/inbound/   Resend webhook for mail arriving at info@
  content/           catalogue, guides, FAQ, case studies, legal, taxonomy
  engine/            rates, quote, recommender, alternatives, volume, buy-vs-rent
  server/            enquiry pipeline, auth, storage, mail
  emails/            React email templates
  lib/               routes, SEO, company facts, placeholder registry
docs/                see below
drizzle/             migrations
```

Two root layouts in route groups, so the public site and the admin panel do not
share chrome. There is deliberately no `src/app/layout.tsx`.

## Documentation

| Document | Contents |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | What this site is, who it is for, what it must never claim |
| [DESIGN.md](DESIGN.md) | The design system: tokens, materials, named rules |
| [docs/decisions.md](docs/decisions.md) | Every decision that governs this repo, with its reason |
| [docs/market.md](docs/market.md) | Market and competitor research |
| [docs/seo.md](docs/seo.md) | Measured demand, the SERP, the content architecture |
| [docs/pricing.md](docs/pricing.md) | How a rental price is arrived at, and the benchmarks behind it |
| [docs/catalogue.md](docs/catalogue.md) | The catalogue data model, specifications and photography |
| [docs/architecture.md](docs/architecture.md) | How the application is built, as built |
| [docs/launch.md](docs/launch.md) | What still stands between this and a live site |

Decisions are cited from source comments by number (`D50`, `O11`). The numbers
are stable; they are not renumbered when a decision is superseded.

## Environment

Every variable is documented in [`.env.example`](.env.example). Nothing there
is required to run the site locally. The four that matter in production:

- `NEXT_PUBLIC_SITE_URL` — canonical URLs, sitemap, structured data. Defaults to
  `https://example.invalid`, which is deliberately unusable.
- `NEXT_PUBLIC_SITE_INDEXABLE` — until this is exactly `true`, `robots.txt`
  disallows everything and every page carries `noindex`.
- `DATABASE_URL` — Neon or any Postgres. Without it, enquiries and settings fall
  back to a JSON file, which the admin panel says out loud.
- `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` — without them the admin panel is
  disabled rather than falling back to a default.
