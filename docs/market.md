# Market and competitor research

Bulgarian vending rental, plus the European benchmarks the site's numbers are
checked against. Compiled July–August 2026 from published dealer catalogues,
operator sources, manufacturer sites rendered in a real browser, and six
Bulgarian competitor sites captured at 1440×900.

Read this as evidence, not gospel. Published rental prices are marketing
figures and operator revenue figures come from vendor content marketing; both
skew optimistic. Where several independent sources agree on a range, that range
is used.

---

## 1. What the business actually is

A Bulgarian dealer in used and refurbished vending machines, near Plovdiv, with
an owned warehouse and service workshop, over ten years in the sector, and
direct import of used machines from Europe. Rental is the primary activity;
sales run on `buy-a-vend` and acquisition on `sell-a-vend`.

The catalogue is the proof. Necta Snakky, Samba, Concerto, Canto, Astro, Kikko;
FAS 900 and 1050; Crane Merchant and BevMax; Vendo G-Snack and G-Drink. **Not
one of these can be bought new.** Necta renamed its whole range — coffee is now
Barista, impulse is now Gusto — and withdrew the product pages for the legacy
models; Snakky and Samba return a genuine 403. Bianchi Lei is absent from
Bianchi's current range. The real manufacturer set behind the catalogue is
three companies, not six: Evoca (which owns Necta, Saeco *and* Gaggia), FAS
International, and Crane, plus Vendo.

## 2. Rental price benchmarks

| Market | Machine type | Monthly rent |
| --- | --- | --- |
| Pan-European (Selecta, indicative) | Any | £80–400 |
| Italy | Coffee | €50–150 |
| Italy | Snack / cold drinks | €100–250 |
| Italy | Combination | €150–400 |
| Germany | Professional coffee, ~40 staff | €150–350 |
| Germany | Simple snack machine | ~€50 |
| Germany | Cold drinks | ~€200 |

Contract terms of 24–60 months are the market standard, which is what makes the
12-month option a genuine differentiator rather than a rounding of the same
offer. Selecta puts outright purchase of a new machine at £4,000–15,000.

The client's own indicative figures — 149 / 229 / 349 лв., converted at the
fixed 1.95583 to roughly €76 / €117 / €178 — sit in the lower-middle of that
band, which is right for the Bulgarian market. The derived rates the site ships
with are calibrated to the same band; see [pricing.md](pricing.md).

## 3. Revenue benchmarks — and the prohibition they produce

The original brief claimed a 150-employee site turns over €4,200/month.

| Source | Figure |
| --- | --- |
| Germany, operator at a railway station (high-traffic public site) | €1,000–1,200/month gross, 30–35% net |
| Spain, coworking spaces with telemetry and cashless | ~€800/month gross |
| European Vending Association, optimal locations | 20–45% net margin, break-even 12–24 months |
| US, 300-employee corporate office | ~$1,200/month gross (≈ $4 per employee per month) |
| US, 50-employee office rule of thumb | 10–15% buy daily → ~$150/month |

Applied to 150 employees, the workplace-specific benchmarks give **€450–900 per
month gross**, or €130–320 net at a 25–35% margin. A German railway station — a
far better location than a factory canteen — tops out at €1,200. The brief's
figure is four to seven times any observed number, and its own arithmetic does
not agree with itself: 150 × 1.8 × 21 working days at the €1 price used
elsewhere in the same brief is €5,670, not €4,200.

Two consequences, both binding:

- **Those figures may never appear on the site**, in any calculator or any copy
  ([PRODUCT.md](../PRODUCT.md)). B2B is outside the Unfair Commercial Practices
  Directive but squarely inside **Directive 2006/114/EC on misleading and
  comparative advertising**, and a tool telling a business it will earn €4,200
  when the real figure is €600 is exactly what that directive addresses.
- **The honest numbers qualify hard.** At the low end a machine does not cover
  its own rent. That is a finding about who the self-operator proposition suits,
  not a reason to inflate it.

## 4. How many machines a site needs

Published industry norms, consistent across sources: roughly **0.1–0.2 purchases
per person per day**, and **one combination unit per 75–100 employees**. Shift
pattern matters as much as headcount — a 24/7 plant running three shifts of
forty needs more capacity than a 120-person office that empties at six.

The client's own sizing table is more aggressive than the published norm: up to
50 people → 1 machine; 51–200 → 3; above 200 → 4, plus one per further 200
people and one per shift beyond the first. Hot drinks and solids count
separately, so coffee plus snacks is a minimum of two machines whatever the
headcount. His stated reason is commercial. The recommender implements his
table, presents the result as a recommendation, and names the combination
machine as the smaller-footprint way to cover the same request — see
[decisions.md](decisions.md) D44 and D48.

## 5. The Bulgarian field

Six sites captured in a browser, then a wider technical sweep of nineteen.

| | Rental positioning | Prices | Calculator | Contact form |
| --- | --- | --- | --- | --- |
| bulvending | no | no | no | none |
| cityvending | no | products only | no | 7 fields |
| maxvendingbg | no | no | no | none |
| sivendingspot | no | no | no | none |
| vendingpartners | mentioned | no | no | none |
| kafeavtomati | no | no | no | none |

**Zero of six publish a rental price or a rental calculator. Five of six have no
contact form at all** — the phone number is the entire conversion mechanism.

What the field looks like up close: hero headlines are category names rather
than offers ("Вендинг машини"), the most common call to action is "Вижте
повече", the same stock photograph of a woman holding a coffee cup appears on
two sites independently, and nobody photographs their own equipment. Vending
Partners still serves a modal announcing an office move dated October 2025.
MAX Vending in Burgas — the closest direct competitor, same manufacturers, same
used-equipment model — carries a 2008 copyright.

Technical defects across the wider nineteen, all measured: vending-systems.com
serves an **empty `<title>`** on its homepage and an hreflang set broken three
ways (`BGN` is a currency code, `mk-Mk` is malformed, all seven alternates point
at the same `http://` URL); cityvending's homepage `<h1>` is literally `"5%"`,
picked up from a discount badge; sivendingspot has no `h1` and no alt text on
any of fourteen images; maxvending has no viewport tag, no `lang`, no canonical
and no sitemap.

Nine of the fourteen sites checked do serve JSON-LD, so structured data is
parity rather than an advantage. The one piece of structured-data ground nobody
else holds is an `Offer` with a rental `priceSpecification`, because nobody else
publishes a rental price.

## 6. The competitive threat that is not another rental site

Eleven Bulgarian companies give a coffee machine away against a consumables
commitment, and they rank: for `кафе автомат под наем`, four of nine results are
free-machine offers (jajda, codcaffee, caffitaly, coffeeservice). Verified
terms: a free machine at ~99–100 capsules per month, or on beans 7 kg/month
entry, 5.5 kg mid, 4.5 kg premium; coffeeservice quotes 15–40 лв./week
(≈ €30–82/month). Zagatto runs it as a named "ПРОГРАМА ОФИС".

Our rate is a real number against a headline of zero. The answer already exists
in the Italian market's vocabulary and nobody in Bulgaria uses it: *noleggio*
carries **no product purchase obligation**, whereas *comodato d'uso* — the free
machine — obliges the customer to buy product from the supplier and puts the
risk of loss on them. That is the difference, it is true, and it belongs on
`/tseni` in plain Bulgarian rather than left to inference.

## 7. Marketplaces

bazar.bg, olx.bg, alo.bg and vendora.bg rank on three to six of eight money
queries each. bazar.bg's `/obiavi/vending-mashini` carries ~310 listings under a
title tag built for our head term: *"Вендинг Машини: Втора ръка • Нови - Под
наем на Супер Цени"*.

A new domain will not out-rank national classifieds on generic head terms in any
planning horizon that matters. They are therefore a **channel, not only a
competitor** — listing there is cheaper than trying to beat them, and the same
pattern holds in every European market the sister sites target.

## 8. Compliance, and why it is also positioning

Obligations that attach to placing refurbished machines on the market, none of
which any competitor site mentions:

- **CE marking.** Like-for-like part replacement does not require re-marking.
  But if the specification is *enhanced or changed* — a new card reader, a
  touchscreen, a telemetry module — the machine may count as new, and **the
  refurbisher becomes the de facto manufacturer, responsible for conformity**.
  Equipment first supplied in the EU before 1 January 1995 is exempt from CE
  marking unless its specification is enhanced.
- **GPSR** applies to second-hand products placed on the market commercially,
  including unmodified ones, with safety, traceability and documentation duties.
- **Food contact materials** need a separate Declaration of Conformity under
  Regulation (EC) 1935/2004, independent of CE marking.
- **БАБХ registration under the Food Act is the customer's duty**, per machine,
  where they stock it and sell from it — including a documented self-control
  system, an application, a fee, and registration finalised within 15 days of
  inspection. Trading in machines is not a food business and carries none of it.

The last one is on the site, openly, in the FAQ and in a dedicated guide. It is
the cheapest trust the site can buy: it is the question every competitor stays
quiet about.

## 9. Currency

Bulgaria joined the euro area on 1 January 2026. Dual display in BGN and EUR at
the fixed rate of 1.95583 was mandatory from 8 August 2025 and **expired
8 August 2026**, including for websites and online shops. The site is therefore
**euro only**: no dual display, no currency switcher.

## Sources

Competitors and pricing — [Selecta](https://www.selecta.com/int/en/vending-machines) ·
[noleggio vs comodato d'uso](https://www.world-matic.com/blog/distributore-automatici-comodato-uso-noleggio/) ·
[Kaffeevollautomat mieten](https://www.coffeeness.de/kaffeevollautomat-mieten/) ·
[tradingtwins Getränkeautomaten](https://www.tradingtwins.com/de/verkaufsautomaten/getraenkeautomaten)

Benchmarks — [European operator ROI](https://aurency.com/post/the-hidden-math-behind-vending-machine-roi-what-european-operators-overlook) ·
[VendSoft profit figures](https://www.vendsoft.com/vending-machine-profit/) ·
[machines per headcount](https://www.itsinreach.com/blog/how-many-vending-machines-does-your-office-need/)

Manufacturers — [Necta / Evoca](https://necta.evocagroup.com/en/products) ·
[FAS International](https://www.fas.it/en/) · [Bianchi](https://www.bianchivending.com/en/) ·
[archived Snakky service manual](https://archive.org/stream/necta_Snakky_manual_ed2_H180U01/Snakky_manual_ed2_H180U01_djvu.txt)

Bulgarian field — [Вендинг Груп](https://www.vending-bg.com/) ·
[Вендинг Партнърс](https://vendingpartnersbg.com/) · [Bulvending](https://bulvending.com/vending-mashini-pod-naem/) ·
[City Vending](https://cityvending.bg/) · [Вендинг Център](https://vendingcentar.com/) ·
[MAX Vending](https://www.maxvendingbg.com/) · [Si Vending Spot](https://sivendingspot.com/)

Free-machine field — [Mauro](https://mauro.bg/kafemashina-pod-naem) ·
[Caffitaly](https://www.caffitaly.bg/bezplatna-kafe-mashina/) ·
[Zagatto Програма Офис](https://www.zagatto.com/кафе-на-дози/програма-офис/) ·
[Coffee Service](https://coffeeservice.bg/kafe/kafe-mashina-pod-naem-lizing-i-zakupuvane/)

Compliance — [second-hand machinery and CE](https://www.conformance.co.uk/secondhand-machinery) ·
[GPSR for second-hand products](https://euverify.com/resource/gpsr-for-second-hand-products/) ·
[БАБХ registration](https://www.foodindustry.bg/registracia-babh) ·
[misleading and comparative advertising](https://eur-lex.europa.eu/EN/legal-content/summary/misleading-and-comparative-advertising.html)
