# Launch

Everything standing between this repository and a live site, ordered by what
blocks what. `npm run readiness` prints the machine-readable half of this list;
this document is the half a script cannot check.

---

## Blocking

| | Item | Owner |
| --- | --- | --- |
| ⛔ | **Real rental prices.** The mechanism is built: `/admin/tseni`, one 12-month figure per machine, the other four terms suggested and editable. What is open is the owner working through 48 machines. Every unpriced machine renders a derived figure behind a visible banner until then. **Indexing must not be opened before this is done** — a catalogue cached at derived prices teaches search engines numbers that are slow to correct. | client |
| ⛔ | **Model photography.** One set per machine — front, side, interior, payment area — taken in the warehouse. Files go to `public/machines/<slug>/` and one line per photograph into the catalogue; no code changes. See [catalogue.md](catalogue.md) §7. Machines with no photograph render a dimensioned drawing, so this does not stop the site working. | client |
| ⛔ | **Case-study consent.** Three real case studies are published. What is missing is written confirmation from the customers that the projects may appear, and a venue description for two of the three. | client |
| ⛔ | **Legal review.** Four legal pages are drafted and specific to what this site actually does. The rental terms bind to the owner's real contract and want a lawyer. | client + lawyer |
| ⛔ | **`NEXT_PUBLIC_SITE_URL` in the production environment.** Set locally; it must carry the same value on the first deploy. Canonical URLs, the sitemap, `robots.txt`, `llms.txt` and every absolute URL in the structured data derive from it, and the default is `https://example.invalid`. | us |

## Required at launch

- **Flip `NEXT_PUBLIC_SITE_INDEXABLE=true`** — but only after prices are real.
  It gates `robots.txt`, the per-page `noindex` and `/llms.txt` together.
- Set `DATABASE_URL` (the **pooled** Neon host, the one with `-pooler`),
  `MAIL_TO` and `RESEND_API_KEY` first — those three decide whether an enquiry
  survives. Then `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `MAIL_FROM`,
  `RESEND_WEBHOOK_SECRET`.
- Turnstile is **both keys or neither**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  renders the widget, `TURNSTILE_SECRET_KEY` verifies its token. Either alone
  means no bot protection.
- Scope `NEXT_PUBLIC_SITE_INDEXABLE` to **Production only**. It is inlined at
  build time, so an "all environments" value reaches preview builds; the
  `VERCEL_ENV` check in `isIndexable()` is the backstop, not the plan.
- Run `npm run env:check` against the production values. It catches the things
  a checklist cannot: an unpooled Neon host, a half-configured Turnstile, an
  indexable preview.
- Run `db:migrate` against the production database. Nothing creates tables at
  runtime, so the first enquiry fails without it.
- Verify `npm run build:launch` passes — the strict readiness gate.
- Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, then submit the sitemap in Google Search
  Console.

Already done and worth not re-doing: the domain `rent-a-vend.com` is registered
with DKIM, SPF and MX verified in Resend, so the site both sends and receives
mail. The brand name, the logo and the company's legal identity are all in
place.

## Should do at launch, not blocking

- **A Content-Security-Policy**, tested on a deployed preview against Plausible,
  Turnstile and the Maps embed. It is absent on purpose: a wrong clause fails
  silently and takes the enquiry form with it, and the form is the entire
  product. It belongs behind a browser test, not guessed at in a config file.
- **A real 1200×630 Open Graph image.** The logo is square and every network
  centre-crops it.
- **Confirm the map pin.** The coordinates are inferred from the parent
  company's own published map of the same premises, not supplied by the client.
  They also want one word about which entrance. Fixed in `mapPin` in
  `src/lib/company.ts`.
- **Confirm the VAT registration.** The client supplied `BG204578516`, which is
  the VAT form of the same ЕИК. A company can be registered without being
  VAT-registered, and the legal pages state one or the other.
- **Decide the marketplace listing strategy** — bazar.bg, olx.bg and alo.bg
  cannot be out-ranked and are a cheap acquisition channel.
- **Manufacturer image permission**, if any manufacturer photograph is still
  carried at launch. One email each to Necta/Evoca, FAS and Crane, saying what
  is true because that is what makes it easy to say yes to: a dealer reselling
  the machine, using the image credited and unmodified to illustrate that exact
  model. Ask Crane for the **CPI Trademark Guidelines** by name — it may answer
  the question without a negotiation. If any of them says no, the affected pages
  fall back to drawings.

## After launch, in order

1. **Digital PR against the three guides.** 30–50 quality referring domains
   reaches parity with the market leader, and breaktime.bg's profile —
   capital.bg, bnr.bg, nova.bg, actualno.com and regional press — is the
   reachable target list. Do not buy directory links; the field's worst profiles
   are one algorithm update from losing everything.
2. **Google Business Profile.** A competitor holds a knowledge panel and reviews
   on the hardest term measured.
3. **Re-measure in Search Console**, then build venue or city pages only if real
   impressions appear. They were deliberately not built against zero measured
   demand.
4. **Fill the specification gaps** from the machines in the warehouse. Average
   completeness is 42%; 19 models are under 30%. It degrades honestly meanwhile.

## Housekeeping, done

- `skills-lock.json` was a lockfile for design skills vendored at
  `.claude/skills/`. That directory is no longer in the repository, so the file
  had no subject and is removed. `NOTICE` is kept and now says so: the
  attributions stand for what the skills left behind, which is the format of
  `DESIGN.md` and the vocabulary it records.
- The four process SVGs that sat loose at the repository root —
  `01-izbor`, `02-oferta`, `03-dogovor`, `04-montazh` — are referenced from
  nothing and now live in `assets/process/` with the other source artwork.
