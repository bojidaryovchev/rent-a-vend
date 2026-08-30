# Decisions

Every decision that governs this repository, with the reason it was taken.
Source comments cite these by number (`D50`, `O11`); **the numbers are stable and
are never reused or renumbered**, so a gap in the sequence means a decision that
belongs to a sister site or was withdrawn.

Open items are at the bottom, each with what it blocks.

---

## The business

**D1 — The primary business is rental.** The machine stays the owner's, the
customer pays monthly, the owner services it. Sales, payment terminals, service
and spare parts run alongside. This site is 100% rental-focused.

**D2 — Bulgaria only.** Romania, Greece, Serbia and North Macedonia are named as
later markets, but there is no `[lang]` segment in this repository and no plan
for one. The multilingual sites are `buy-a-vend` and `sell-a-vend`.

**D5 — Contract terms are 12 to 60 months**, with a buyout at a predetermined
residual value at term end. Twelve months is the differentiator: the market
standard is 24–60.

**D6 — Enquiries are credit-checked before an offer.** ЕИК, company history,
financials, public liabilities and activity, with a decision inside 24 hours.
Fallbacks are a deposit, a guarantor or advance payment; on persistent
non-payment the contract is terminated and the machine recovered. The site does
not describe the check in detail — it is the reason approval is not instant, not
a feature.

**D10 — Deposits and volume discounts are determined after assessment** and are
deliberately not shown in the calculator. They do not block it: the calculator
needs the base monthly rent and nothing else.

**D11 — Sales live on `buy-a-vend`.** The two are not mixed on one site.
`/naem-ili-pokupka` is what serves the purchase-intent traffic this site cannot
convert directly.

**D18 — БАБХ registration is the customer's duty** where they stock and sell
from the machine. The owner provides guidance. The site says so openly, in the
FAQ and in a dedicated guide, because it is the question every competitor stays
quiet about.

**D32 — Enquiries are answered by the owner personally**, Monday to Friday,
09:00–18:00. The promise on the page is *"Отговаряме до 1 работен час"* with the
working-hours qualifier attached, and out-of-hours submissions get an automatic
acknowledgement saying they will be answered on the next working day. One
working hour beats the 24 hours every competitor advertises and costs nothing —
but only if the qualifier travels with it.

**D51 — Three domains, three sites, one company.** `rent-a-vend` rents machines
out, `buy-a-vend` sells refurbished ones, `sell-a-vend` buys used fleets in.
Shared branding, shared design system, separate repositories. They cross-link in
the header and footer: left unlinked they read as three unrelated strangers who
happen to share a phone number, which is worse than either running one site or
running three honest ones. The SEO cost is accepted knowingly — three domains
means clearing the link barrier three times from zero rather than pooling into
one.

## Catalogue and content

**D23a — The SEO surface is the category and regulatory clusters, not the model
pages.** Model pages stay, and they matter — they are the catalogue, the
conversion surface, the enquiry landing point and the citable unit for AI search
— but they are not a traffic strategy. Individual machines are not indexed
separately.

**D24a — Legacy model names are primary, for accuracy and not for traffic.** The
stock *is* the old models and the name must match what is printed on the machine
the customer is standing in front of. All 21 names measured zero Bulgarian
search volume, so the naming convention is kept and the search rationale was
dropped entirely.

**D25 — Real photographs, not factory renders.** One consistent set per model —
front, side, interior, payment area. Manufacturer images are rejected as the
default: Necta has withdrawn the pages for almost every model here, and what
surfaces in a search belongs to competing dealers. `credit` on the photo record
is what keeps this enforceable; our own photography leaves it null and everything
else must say where it came from. See [catalogue.md](catalogue.md) §7.

**D27 — A longer term is "с X% по-ниска месечна вноска", never "спестявате
X%".** A 60-month term has a lower instalment and a 3.5× higher total, so the
saving claim is false and exposed under Directive 2006/114/EC. The baseline for
every reduction is the 12-month price, and monotonicity is enforced in the admin
form rather than trusted.

**D28 / D42 — One venue taxonomy, defined once.** Twelve venue types used in the
recommender and on machine pages, grouped into six for filters only. Twelve
filter options overlap in ways the visitor has to adjudicate, and 48 machines
against 12 types returns empty pages.

**D30 — Alternatives are computed, not curated.** Derived from category,
capacity, selections, size and purpose, with a manual override available.
48 × 3 hand-maintained links would drift on every catalogue change.

**D41 — Case studies must be real.** Where rental projects do not yet exist,
genuine deliveries, sales and service work are described as exactly what they
were. Two real beat five invented, and an invented customer is the same
misleading-advertising exposure as "спестявате X%". Consent is required even for
an anonymised description.

**D49 / D49a — No condition grades; one condition field.** The published A/B/C
rubric is gone: every machine that leaves the base is refurbished and tested, so
a letter graded a difference the business does not make. What survives is
`condition: "refurbished" | "new"`, because the owner now stocks new machines
too and the single blanket sentence had become false on part of the catalogue.
It drives the on-page sentence, the badge and `itemCondition` in the JSON-LD.

**D50 — No stock, no availability, no unit records.** There are no per-machine
rows, no statuses, no staleness rule, no stock screen in the admin panel and no
"2 available of 5" on cards. Every catalogued model can be supplied, and the
model page states that once.

This reversed the site's original headline advantage and the reasoning is worth
keeping: live availability rested on someone updating statuses from a phone in
the warehouse every day. The client will not do that. The design already had a
rule for stale data — past 96 hours, stop publishing availability — and with no
daily update that rule would have pinned every model page to "Проверете
наличност" permanently, which is worse than not claiming availability at all.

The consequence is that **the published price is now the whole differentiator**,
which is why D19 is load-bearing rather than housekeeping.

**D55 — If a stock figure is ever published it is a floor, never a live count.**
"Над 350 машини" would be true and would vary daily; a number that looks live
and is not is the one version that is prohibited. No such claim is currently on
the site.

## Money

**D9 / D19 — Prices are per model per term, and a placeholder must never ship
silently.** Real prices live in `model_settings` and are entered at
`/admin/tseni`; a machine with no row falls through to a figure derived from
catalogue facts. Every derived figure is flagged per model and per term, the
site renders a visible banner while any blocking placeholder is open, and
`build:launch` refuses to build in strict mode. A plausible-looking wrong price
is worse than no price, and the derived figures sit inside the real market band.
See [pricing.md](pricing.md).

**D26 — Calculator ordering:** monthly rent largest, then price per day, then
what is included, then the total contract value last, smaller and behind a
disclosure. The total is available to anyone looking for it and is not the first
thing anyone reads.

**Currency is euro only.** Bulgaria joined the euro area on 1 January 2026 and
the dual-display obligation expired on 8 August 2026, before this site launches.
No dual display, no currency switcher.

## The recommender

**D43 — It computes demand rather than asking for it.** Inputs are venue type,
headcount, shifts, product mix, cashless, and budget last and optional. Daily
volume is derived from the published 0.1–0.2 purchases per person per day and
shown as an editable assumption. Asking "how many coffees a day?" asks the
visitor to do our job; they will guess, and a wrong recommendation is worse than
none. Showing the assumption and letting them correct it is what separates a
tool from a questionnaire.

**D44 — Machine count comes from the client's sizing table, not the industry
norm.** Up to 50 people → 1 machine; 51–200 → 3; above 200 → 4, plus one per
further 200 people and one per shift beyond the first. Hot drinks and solids
count separately, so coffee plus snacks is a minimum of two. His stated reason
is commercial. It is implemented as given and presented as a recommendation,
with the combination machine named as the smaller-footprint way to cover the
same request. It replaces the published one-per-75-100 norm, which gives 1
machine where his table gives 3.

**D45 — The recommender is biased toward Necta**, at a weight (+10, Wittenborg
+5) that separates two machines which both fit and never rescues one that does
not. The fleet is overwhelmingly Necta and so are the workshop's parts and
service knowledge — which is also the honest reason given to the visitor on the
result page, rather than a silent thumb on the scale.

**D48 — It answers with a plan, not a machine.** One catalogue card per machine
type the sizing table calls for, plus the plan's total rent, plus the
combination machine offered whole as the smaller-footprint alternative. The old
single-machine answer could not represent a three-machine recommendation: it
showed a snack machine captioned "не покрива: топли напитки" for a site that had
been told to take three. Coverage is now guaranteed across the plan, a line is
filled by the machine built for it (purpose beats the D45 brand nudge), and the
whole plan travels into the enquiry as `recommenderSummary`.

The combination machine is sold on floor space, never on price — in this
catalogue it is often dearer than the two cabinets it replaces — and it is gated
on the headcount band, because these combinations top out at about 70 people and
offering one to a 300-person plant is a wrong answer rather than a smaller one.

## Privacy, consent and the map

**D46 — The map is click-to-load.** A Google Maps iframe contacts Google and
sets cookies on render, and it is not strictly necessary, so it needs consent —
and one auto-loading map would cost the whole site the consent banner it is
built to avoid. A panel states what pressing the button does, and nothing
reaches Google until it is pressed. Verified: zero requests to any Google host
before the click. The cookie policy already promised exactly this.

**D47 / D47a — The pin points at coordinates, not at the registered office.**
The seat of the company is a legal fact; the map is an invitation to drive
somewhere. "Местност Бедрозов бунар" is a locality rather than a street, so
geocoding it lands **2.8 km away**, in the middle of Марково. The current pin
(42.089274, 24.699687) was recovered from the parent company's own published map
of the same premises, matches on address, working hours and phone number, and
still needs a yes from the client — it is a confirmation item, not an unknown.

**Analytics is cookieless** (Plausible), which is why the site needs no consent
banner at all.

## Not in scope

**Machine lifecycle management is a separate product** — service history,
repairs, replaced parts, rental periods, contracts, customers, payments. It is
genuinely useful for a business with 350 machines and would probably save more
money than this site, but it has a different user, a different logic and a
different size, and it should be quoted as its own project. What this repository
carries instead is a handful of admin-only fields on records it already keeps.

**The site is not the master record for stock.** Machines are tracked internally
and the admin panel publishes only. This is what D50 followed from.

## Open

| # | Item | Blocks |
| --- | --- | --- |
| **O4** | **Real rental prices.** The mechanism is built and the client enters them at `/admin/tseni`; what is open is him working through the catalogue. Until then every unpriced machine renders a derived figure behind a banner. | Launch, and indexing |
| **O11** | **Legal review.** The four legal pages are drafted and specific to what this site does. The rental terms bind to the owner's actual contract and want a lawyer before launch. | Launch |
| O6 | **Delivery cost by locality.** Appears in the offer, not the calculator. Figures are still needed if it is ever to be included. | Calculator completeness |
| O13 | **Marketplace listing strategy.** bazar.bg, olx.bg and alo.bg rank on three to six of eight money queries and cannot be out-ranked. Channel, competitor, or both — undecided. | Acquisition mix |
| O14 | **The free-machine answer.** Eleven Bulgarian firms give a machine away against a consumables commitment. The *noleggio carries no product purchase obligation* argument is on `/tseni`; whether it is prominent enough is a copy question. | `/tseni` copy |
| O18 | **Social as a channel.** A Facebook post ranks #2 on the head term. Cheap, and absent from the plan. Also blocks `sameAs` in the structured data. | Acquisition mix |
| O19 | **Google Business Profile.** A competitor holds a knowledge panel and reviews, and city terms carry the highest measured difficulty. Local SEO is unplanned. | Local visibility |
| O20 | **AI Overviews / GEO.** Overviews appear on four of six queries tested. The basics ship (answer-first guides, `llms.txt`, no AI-crawler blocks); anything beyond that is out of scope. | Content format |
| — | **Specification gaps.** Average completeness 42%, 19 models under 30%. Closeable by measuring the machines in the warehouse. Renders "няма данни" meanwhile. | Nothing — it degrades honestly |
| — | **Model copy.** Drafted from the specifications. Wants the owner's practical knowledge: which models suit which venues, which are troublesome. | Nothing |
| — | **Service cost figures.** Annual service, average repair, frequency. Would replace the buy-versus-rent defaults with the owner's real numbers. | Better defaults |

**Resolved and worth recording as resolved:** the brand name and logo
(Rent-a-Vend, delivered 2 August 2026), the company's legal identity, the
domain and its DNS, three real case studies, and the map pin's coordinates —
pending only the client's confirmation.
