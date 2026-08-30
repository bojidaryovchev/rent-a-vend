# Product

## What this is

A lead generation site for vending machine rental in Bulgaria, trading as
**Rent-a-Vend**. It has one measurable output: a qualified enquiry reaching the
owner, carrying enough context that he can answer it with a real price for a
real machine.

Everything on the site is instrumentation around that event. Success is the
number and quality of enquiries — not traffic, time on page, or pages per
session.

Platform: web. Language: Bulgarian, and only Bulgarian. Currency: euro only.

## Who it is for

**Primary: the workplace decision-maker.** A facilities or office manager, an HR
lead, or the owner of a small factory, hotel, car wash or workshop in Bulgaria.
They are equipping their own site so staff and visitors have coffee and snacks.
The machine is an operating expense, not an investment. They know their
headcount, their shift pattern and roughly what their people drink. They do not
know vending machine models, and they should never be asked to.

**Secondary: the small vending operator.** Rents several machines to place at
third-party sites and earns from the sales. Uses the same catalogue and the same
rental terms, and typically arrives through a multi-machine enquiry. Served, but
not addressed with separate messaging.

There is a third audience the search results drag in and the site does not want:
property owners looking for an operator to place a machine on their premises.
`вендинг машини под наем` means both things in Bulgarian and both rank. The home
page separates them in the first screen rather than converting the wrong one.

**Who the business contracts with:** companies and sole traders (ЕТ). VAT
registration is therefore optional rather than required, and the smallest
customers may fall under consumer protection provisions, so claims must meet the
stricter standard rather than the B2B one.

## Positioning

**A published price, per machine, per term.** Every Bulgarian competitor
reviewed publishes no prices, no specifications and no availability, and routes
every visitor through a phone call. This site shows the machine, its full
specification, and what it costs a month across five contract lengths. That is
the whole differentiator, and it is the reason real prices block launch.

**Answered within one working hour.** The pan-European incumbent and the
Bulgarian field both advertise 24 hours. A single owner answering personally can
beat that, and it costs nothing to deliver — provided the promise carries its
working-hours qualifier, which it does.

**Specificity instead of reputation.** The brand is new and inherits no track
record, so exactness substitutes for it: this exact machine, this specification,
this price, this term. Vagueness reads as concealment to anyone renting used
equipment.

## Operating context

- **Market:** Bulgaria only. There is no `[lang]` segment in this repository and
  no plan for one; the multilingual sites are `buy-a-vend` and `sell-a-vend`.
- **Model:** rental with service included. The customer stocks the machine
  themselves; full service with consumables is available on individual quote.
- **Terms:** 12 to 60 months, with a buyout at a predetermined residual value at
  term end. Twelve months is unusually short for this market, where 24 to 60 is
  standard.
- **Service:** 48-hour response nationwide, 24 hours in major cities. A
  replacement machine is offered subject to a reasonable repair period and
  availability — deliberately soft, and therefore stated in the FAQ and the
  rental terms rather than headlined.
- **Equipment:** used and refurbished, plus new where the owner stocks it.
  Predominantly models the manufacturers have discontinued.
- **Enquiry handling:** the owner personally, Monday to Friday, 09:00 to 18:00.
  Out-of-hours submissions receive an automatic acknowledgement and a reply on
  the next working day.
- **Stock:** the site does not track individual machines. It publishes a
  catalogue of models the business can supply, with one availability statement.
  See [D50](docs/decisions.md).
- **Shared inventory:** the same physical machine may be rented or sold, and
  sales run on `buy-a-vend`. The two sites cross-link and must not publish the
  same body copy about the same machines.

## Scope

**Built and shipping:** home, four category pages, 48 model pages, the rental
calculator on every machine, the buy-versus-rent calculator, the "which machine
do I need" recommender, the enquiry form, About, Contact, FAQ, three regulatory
guides, three case studies, four legal pages, and an admin panel covering
prices, enquiries and the shared mailbox.

**Deliberately not built:** venue landing pages (twelve pages against zero
measured demand), a machine comparison tool, favourites and bulk enquiry, a
coverage map, admin statistics, video.

**Explicitly a separate product:** full machine lifecycle management — service
history, repairs, parts, rental periods, contracts, customers, payments. Not
part of this site, and it should be quoted as its own project.

## Brand

**Rent-a-Vend is a standalone brand.** It was chosen over presenting the service
as a sub-brand of the parent company, and the consequence is recorded here so
future work does not forget it: the brand inherits no track record. Ten years of
trading, the warehouse and the workshop stand behind a name the marketing does
not use.

The legal entity — Лидер офис МЛ ЕООД, ЕИК 204578516 — appears in the imprint,
the legal pages and the structured data, because the Bulgarian E-Commerce Act
requires a trader to identify itself. It appears nowhere else.

## Evidence, and what may never be claimed

**Real and available:** an owned warehouse and service workshop near Plovdiv;
over ten years trading in the vending sector; direct import of used machines
from Europe; nationwide delivery and installation with the company's own
technician; photographs of the warehouse, the workshop, loading and an
installation, all supplied by the client.

**Committed but not yet supplied:** photographs of each model taken in the
warehouse; written consent for the three published case studies; final rental
prices for the whole catalogue.

**Does not exist and must not be fabricated:** testimonials, named customers,
third-party reviews, awards, certifications, press coverage, published
performance figures, or any `AggregateRating` markup.

**One specific prohibition.** The original client brief contained revenue
projections roughly four to seven times above every European benchmark, together
with example calculations that did not survive their own arithmetic. Those
figures must not appear anywhere on the site, in any calculator, or in any copy.
Where the site states a number, it states a real one or it states none. The
honest benchmarks are in [docs/market.md](docs/market.md).

## Principles

1. **The enquiry is the product.** Every surface is judged by whether it
   produces one, and by the quality of the context it carries.
2. **Specificity is the trust strategy.** With no inherited reputation,
   exactness substitutes for reputation.
3. **Never claim what cannot be honoured.** Promises are sized to what one
   person working weekdays can actually deliver. A kept modest promise beats a
   broken ambitious one.
4. **Degrade safely rather than lie.** Where data is missing the site shows
   less, never something false. A missing specification renders "няма данни"; a
   machine with no confirmed price renders a derived figure behind a banner that
   says so.
5. **Compute, do not interrogate.** Ask what the visitor knows — headcount,
   shifts, what people drink — and derive what they do not. Showing the
   assumption and letting them correct it is what separates a tool from a
   questionnaire.

## Accessibility

WCAG 2.2 AA is the working standard. Schools and hospitals are in the target
venue list, so public-sector buyers may impose requirements of their own.
