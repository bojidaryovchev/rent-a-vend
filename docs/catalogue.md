# The catalogue

48 machines, where their specifications came from, how a combination machine is
assembled, and how a photograph gets onto a model page.

---

## 1. What is in it

| Source file | Machines |
| --- | --- |
| `content/models/necta-coffee.ts` | 17 Necta coffee machines, including three Wittenborg |
| `content/models/necta-snack.ts` | 13 Necta snack machines |
| `content/models/fas-crane.ts` | 10 FAS and Crane machines |
| `content/models/vendo.ts` | 5 Vendo machines |
| `content/models/combos.ts` | 3 combination machines, derived |
| | **48 declared, 45 base + 3 combinations** |

Four categories, and they are the URL structure as well as the taxonomy:
`coffee`, `snack`, `combo`, `cold`. **Crane Merchant sits in snack, not cold
drinks** — the Merchant is an ambient glass-fronted snack machine and only the
BevMax is a cold-drinks cabinet. Filing them together would mean a visitor
looking for a snack machine never finds the Merchant, and a visitor looking for
cold drinks opens one and finds a snack machine.

Everything in the catalogue is legacy. Necta renamed its whole range — coffee is
now Barista, impulse is now Gusto — and withdrew the product pages for these
models. `legacyName` and `currentName` carry both where the mapping is known.
**The old names are primary**, because the stock *is* the old models and the name
has to match what is printed on the machine the customer is looking at. That is
an accuracy argument, not a search one: all 21 model names measured zero
Bulgarian volume ([seo.md](seo.md) §3).

## 2. The record

`content/schema.ts` validates the whole catalogue at module load with Zod, so a
malformed machine fails the build rather than rendering a broken page.

```
Model
  id · slug · name · manufacturer (necta|fas|crane|vendo) · category
  legacyName · currentName
  condition: "refurbished" | "new"        default refurbished
  spec { 18 fields, every one nullable }
  recommendation { venueTypes, minHeadcount, maxHeadcount,
                   dailyCapacity, shifts, products, isDefault }
  photos[] { src, alt, view, credit }
  specSource                              provenance, rendered on the page
  coffeeUnit                              combinations only — the machine on top
  cabinetOf                               shares another model's photographs
  intro · copy
```

**Every specification field is nullable and a missing one renders "няма данни"
rather than being hidden or invented.** A visible gap is information; a
shortened table pretending to be complete is not.

The spec schema also catches impossible data. `depthOpenMm` must exceed
`depthMm` and must not equal `heightMm` — which is a real error in FAS's own
published table, where the door-open dimension is printed as 1830 mm, exactly
the machine's height. Manufacturer data needs validation on entry rather than
trust.

### Where the specifications came from

Necta withdrew the product pages for almost every model here, so the data comes
from **archived service manuals and dealer listings**, and each machine carries
its `specSource` on the page. Service manuals turned out to be a richer source
than the marketing pages would have been — the archived Snakky manual gives
1700 × 701 × 854 mm, 1335 mm with the door open, 190 kg, 345 W, max 6 trays,
plus ambient tolerance (2–32 °C), internal temperature band, fuse rating and
acoustic pressure, none of which a product page ever carried.

**Average completeness is about 42%, and 19 models sit under 30%.** That is
tracked as an open item rather than hidden: the gaps can be closed by measuring
the machines in the warehouse, and nothing is guessed at meanwhile.

Two caveats that come with the method: a manual must be matched to the right
revision, and a used machine may not match its original build, so a figure
should be verified against the physical unit before it is relied on.

## 3. Combination machines are derived, not entered

A combination machine here is **one cabinet, not two machines**: a coffee machine
mounted on a Mini Snakky snack base. One unit, one footprint, one payment
device, delivered on one pallet. All three are Brio-on-Mini-Snakky — Brio 3,
Brio Up, Brio Touch.

The specification is stacked from the two constituents at module load, so a
change to the Brio's weight flows into every combination built on one and the
numbers can never drift apart:

| Field | Rule |
| --- | --- |
| height | **add** — the coffee machine sits on the base |
| width, depth, door-open depth | the **larger** of the two; the cabinet has to clear a doorway on its widest figure |
| weight, power | sum |
| capacity, trays, temperature | **from the base alone** — cups and packets are not the same unit and adding them would be nonsense |
| interface, protocol | from the coffee machine; the visitor operates its panel |

**The Mini Snakky base is not a catalogue entry.** It is never let out on its
own, and a model page for a machine nobody can rent generates enquiries that
have to be refused. Its figures live beside the pairings in `combos.ts`.

## 4. Condition

There are **no A/B/C condition grades**. Every machine that leaves the base is
refurbished and tested, so a letter would grade a difference the business does
not make. The published rubric that used to be here was removed for that reason,
and the cost was accepted knowingly: a blanket statement is weaker than a
per-machine one, and it is now a promise the operation has to keep on every
unit.

One field survives, because it is a difference the business genuinely makes:
`condition: "refurbished" | "new"`, defaulting to refurbished. The owner now
stocks new machines alongside rebuilt ones, and the single blanket sentence had
become false on part of the catalogue — and, on a new machine, weaker than the
truth. It drives the on-page sentence, the badge, and `itemCondition` in the
JSON-LD, which was previously a hardcoded `RefurbishedCondition` and would
otherwise have made a false machine-readable claim.

This is not the grading rubric returning. It is one fact that varies, not a
grade applied to individual machines.

## 5. Availability

The site does not track individual machines. There are no per-machine records,
no stock counts, no statuses and no "2 available of 5" on cards. Every
catalogued model can be supplied, and the model page states that once.

This was a deliberate reversal of the original design, and the reasoning is in
[decisions.md](decisions.md) D50. The short version: live availability rested on
someone updating statuses from a phone in the warehouse every day, the client
will not do that, and a staleness rule would have pinned every model page to
"Проверете наличност" permanently — which is worse than not claiming
availability at all.

## 6. Venue taxonomy — one list, two shapes

Twelve venue types, defined once in `content/taxonomy.ts` and used in the
recommender and on machine pages. They are grouped into **six for filters
only**: Офис и бизнес сграда · Производство и склад · Хотел и заведение ·
Автосервиз и автомивка · Училище и болница · Търговски обект и фитнес.

Two reasons for the split. The twelve overlap in ways a visitor has to
adjudicate — "Офис" and "Бизнес сграда" are the same thing to most people, as
are "Склад" and "Логистична база" — and 48 machines against 12 venue types means
many combinations return nothing. An empty result page is a bad experience and
a thin page.

Drift into three different lists was corrected once already. There is one list.

## 7. Photography

Real photographs of the machines in the warehouse. Factory renders and images
found in search results are not used: Necta has withdrawn the pages for almost
every model here, and what surfaces in a search belongs to competing dealers and
is copyright to them.

### Adding a photograph

One model, one directory named for its slug:

```
public/machines/necta-snakky/front.jpg
public/machines/necta-snakky/side.jpg
public/machines/necta-snakky/interior.jpg
public/machines/necta-snakky/payment.jpg
```

Allowed extensions: `jpg`, `jpeg`, `png`, `webp`, `avif`. Names are lower-case
Latin with hyphens. Then one line per photograph on the model in
`src/content/models/`:

```ts
photos: [
  { src: "/machines/necta-snakky/front.jpg", alt: "Necta Snakky, изглед отпред", view: "front" },
  { src: "/machines/necta-snakky/interior.jpg", alt: "Отворена витрина с петте рафта", view: "interior" },
],
```

- `view` is one of `front`, `side`, `interior`, `payment`. `front` becomes the
  lead image on cards.
- `alt` is required and cannot be empty. A decorative photograph of a vending
  machine does not exist — it either shows the machine or it does not belong
  there.
- `credit` is optional. **Absent means our own photograph.** Everything else has
  to say where it came from, which makes quietly slipping in a factory render
  impossible.

No dimensions are set anywhere. The gallery fits the image into a fixed bed and
shows it whole (`object-contain`) rather than cropped, because a buyer comparing
a 701 mm Snakky against a 1180 mm Merchant is looking at exactly that
proportion.

### What the build refuses

- a photograph pointing into another model's directory — the quiet one: the
  right price beside the wrong machine, on a page that looks perfectly healthy
- the same file used on two models
- an empty `alt`
- a path that is not `/machines/<slug>/<name>.<ext>`

Progress is counted by `photoCoverage()` and printed by
`scripts/catalogue-report.ts`. A combination machine that has only borrowed
another model's frames does not count as photographed.

### Two conventions

**Combination machines are photographed assembled**, under their own slug. A
combination is one cabinet; a frame of the coffee machine on top sells a
different product.

**Variants that share a cabinet** — a machine differing from the base model only
internally (elevator, CO₂ cooling, a food configuration) — take its photograph
with the caption "Същият корпус като …", set through `cabinetOf`. This does
**not** apply to Touch variants: a screen instead of buttons is a different front
and therefore a different machine.

### Provenance is an open risk

Where a manufacturer image is used it is credited, and that is the practice a
rights holder is least likely to object to: factual use, of a product genuinely
being offered, attributed. It is not a licence.

None of the three manufacturers publishes a general grant for dealer use of its
product photography, and none publishes an outright prohibition either — the
sites simply do not address it, so the default applies. Crane/CPI does publish
**Trademark Guidelines**, which is the document to ask for by name. The route to
closing this is one short email per manufacturer; it is in
[launch.md](launch.md).

If a manufacturer says no, nothing breaks. Every model with no photograph
renders a dimensioned technical drawing derived from its own width-to-height
ratio and tray count, labelled "не е снимка", and the catalogue stays honest and
published while the real photographs are taken.
