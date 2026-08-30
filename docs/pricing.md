# Pricing

How a monthly rent gets onto a machine page, what it is derived from while the
client works through the catalogue, and the rules the wording has to obey.

---

## 1. Prices are per model, per term, entered by the client

Five contract terms: **12, 24, 36, 48 and 60 months**. Twelve is the baseline
and the most expensive per month — the shortest term recovers the machine's cost
slowest, so it has to price highest.

Real prices live in the **`model_settings` table** and are edited by the owner
at **`/admin/tseni`**. He types the 12-month figure; the form fills the other
four from the term curve and every one stays editable. That is what turns
pricing the catalogue into fifty numbers rather than two hundred and fifty.

| Term | Factor |
| --- | --- |
| 12 | 1 |
| 24 | 0.88 |
| 36 | 0.80 |
| 48 | 0.74 |
| 60 | 0.70 |

Everything is rounded to the nearest €5, so a catalogue reads like a price list
rather than the output of a formula.

The form **enforces monotonicity**: a set of prices must get cheaper, or at
least no dearer, as the term lengthens. This is not cosmetic. `reductionLabel`
reads the gap between a term and the 12-month baseline, and a 60-month rate
entered above the 12-month one would make the page advertise a negative
reduction. Cheapest to catch at the moment it is typed.

## 2. The derived fallback, and why it is not a flat number

A machine with no row in `model_settings` falls through to a **derived** figure.
There is no global placeholder flag: a machine is placeholder-priced or it is
not, **model by model**, because ten priced machines beside forty derived ones is
the normal state of this catalogue for as long as it takes the client to work
through it, and the banner has to be able to say so.

The derivation uses catalogue facts already held — category, capacity,
selections and physical footprint:

| Category | Baseline (12-month, €/month) |
| --- | --- |
| coffee | 78 |
| snack | 84 |
| cold drinks | 96 |
| combination | 126 |

A machine is then scaled against the **median of its own category** on
`sqrt(own / median)`, clamped to 0.72–1.45 because a machine twice the size is
not twice the rent.

This replaced a flat €100 across the whole catalogue, and the reason is worth
keeping: a flat rate made all 48 machines read *"от 70 €/месец"* on a site whose
entire positioning is *real stock, individually priced*. The page built to break
the competitors' impression was reproducing it. Nothing here is invented — a
bigger machine that holds more product costs more, which is true of the real
market and produces a believable spread.

The combination baseline sits below the European band on purpose. It was set at
148 for a catalogue of full-size pairs; what the client actually lets out is a
Brio on a Mini Snakky base — one compact cabinet, four trays, 252 products.
Pricing it above every snack machine would have been the formula outrunning the
machine.

## 3. The guard

**A plausible-looking wrong price is worse than no price**, and the derived
figures sit inside the real market band, which is exactly why they are
believable.

- Every derived rate carries `isPlaceholder: true`, per model and per term.
- The machine page renders a visible banner while any blocking placeholder is
  unresolved. It can only be suppressed by an explicit
  `NEXT_PUBLIC_HIDE_PLACEHOLDER_BANNER=true`, so no screenshot, preview link or
  client review circulates without it.
- `npm run build:launch` runs the readiness check in strict mode and refuses to
  build while `rental-prices` is open.
- **Indexing must not be opened before real prices land.** A catalogue cached at
  derived figures teaches search engines numbers that are slow to correct.

## 4. Wording rules that are legal, not stylistic

**Never "спестявате X%".** A 60-month term has a lower monthly instalment and a
**3.5× higher total**: €100 × 12 = €1,200 against €70 × 60 = €4,200. A customer
who does that arithmetic and finds "you save 30%" next to it has been misled,
and B2B advertising is covered by **Directive 2006/114/EC**. The site says
*"с X% по-ниска месечна вноска"* — the same benefit, stated truthfully, and for
a customer watching their monthly outgoings it is the stronger message anyway.

The baseline for every reduction is the 12-month price.

**Order of presentation on the calculator**, largest to smallest: monthly rent →
price per day → what is included → total contract value last, smaller, behind a
disclosure. The total is available to anyone who looks for it and is not the
first thing anyone sees. €100 × 60 = €6,000 sitting alone beside the thought
"I could buy one for €3,000" loses the argument before the included service,
insurance and replacement machine are read.

**What is included** must match the FAQ exactly: delivery, installation, service
under normal operation, technical support, insurance of the machine, no capital
outlay. Not "гаранционно обслужване" — damage from misuse, deliberate acts or
external interference is the customer's cost under the contract, and a
calculator that says otherwise is what a customer will point at when a repair
bill arrives.

## 5. Currency

**Euro only.** Bulgaria joined the euro area on 1 January 2026 and the dual
display obligation — BGN and EUR at the fixed 1.95583, same size, colour and
font — expired on 8 August 2026, before this site launches. No dual display, no
currency switcher.

## 6. Where the numbers were checked against

Published European rental bands, from [market.md](market.md) §2: Italian coffee
machines €50–150, snack and cold drinks €100–250, combinations €150–400; German
professional coffee €150–350, a simple snack machine ~€50. The client's own
indicative figures convert to roughly €76 / €117 / €178. The derived rates land
in the same band, which is what makes the guard necessary rather than optional.

## 7. Buy versus rent

`/naem-ili-pokupka` computes total cost over the full term on both sides, and
the governing rule — which the client arrived at himself — is that **it must be
allowed to conclude that buying is cheaper**. Over a long horizon it usually is,
and a calculator rigged to always favour renting is one a procurement manager
checks with a pencil once and never trusts again.

So the arithmetic is honest. Buying is credited with its residual value.
Financing frees the day-one capital and charges interest. Service, repairs and
insurance sit on the buyer's side, because that is the real asymmetry. With the
default inputs at five years it reports that **buying is cheaper**, names the
difference and the crossover month, and then says plainly why renting can still
be the better choice: a fixed monthly cost, no capital outlay, no repair risk,
and a replacement machine.

The inputs are **pre-filled** rather than asked for. A customer has no idea what
it costs to service a vending machine; asked, they will enter zero and the sum
will favour buying for the wrong reason. They can change every figure, and they
start from realistic ones.

Opportunity cost is **named but never priced**. Capital retained is a fact;
"what you could do with it" is a label. Attaching a return rate would be
inventing a forecast, which is precisely what made the original brief's revenue
figures unusable.

One test is named for what it protects:
`it("IS ALLOWED TO CONCLUDE THAT BUYING IS CHEAPER")`.

## 8. What is deliberately not priced on the page

- **Deposit and multi-machine discounts** — determined after customer
  assessment, so they are stated as such rather than guessed at in a calculator.
- **Delivery** — appears in the offer, not in the calculator. Real per-locality
  figures have never been supplied, and quoting a wrong one is the same failure
  mode as a wrong rent.
- **Service costs** — needed to refine the buy-versus-rent defaults. The client
  owes an annual service figure, an average repair cost and a frequency.
