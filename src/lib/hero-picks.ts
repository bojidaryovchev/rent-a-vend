import type { Model } from "@/content/schema";
import { leadPhoto, modelBySlug } from "@/content/models";
import { VENUE_LABEL, type VenueType } from "@/content/taxonomy";
import type { Catalogue } from "@/engine/catalogue";
import { fromMonthly } from "@/engine/quote";

/**
 * The machines the home page hero recommends, in the order it shows them.
 *
 * NAMED, NOT COMPUTED, for the reason the single hero machine was: this is a
 * recommendation, stated as ours. The site has no sales history, so ranking
 * these by popularity would be a performance figure nobody can check, and
 * PRODUCT.md rules those out.
 *
 * What each name rests on:
 *
 * - The Brio Up + Mini Snakky leads because it always has. It is the one
 *   product photographed exactly as it is delivered, assembled, and its frame
 *   is the page's largest paint, so moving it would change the number the page
 *   is measured on.
 * - The Brio Up is the cheapest coffee machine the owner has put a price on,
 *   sized for 15-50 people, and its render is the sharpest of any coffee
 *   machine here - the machine itself is 1000px tall in it.
 *   For a small office the recommender itself answers Colibri, Korinto, Brio 3
 *   or Solista, and none of those has an owner price yet - their figures are
 *   derived. The hero does not recommend a machine at a price its owner never
 *   set.
 * - The Snakky is the recommender's pick for an office wanting snacks, with
 *   the Melodia as runner-up, and the cheaper of the two at the owner's price
 *   (75 against 105 €/month on 60 months). It once lost this slot on its
 *   photograph - a small copy of the render, the machine 377px tall in a wide
 *   white canvas - and the file is now Necta's own render at full size.
 * - The G-Drink Design 6 is the recommender's pick for cold drinks.
 * - The Astro is the recommender's pick for a plant or warehouse on two or
 *   three shifts, with the Canto as runner-up.
 *
 * Each pick also names the two places its card says it is for. Read off the
 * record alone, three cards opened on the same "Офис, автосервиз", because
 * most records list the office first; a row of five recommendations should
 * show five kinds of site. So the pair is chosen here - but only from the
 * machine's own `recommendation.venueTypes`, which `audienceLines` enforces,
 * so the card can never send a visitor somewhere the recommender would not.
 * The cold-drinks record also lists the school, left out on purpose: a
 * soft-drinks machine for pupils is not the first thing this row should offer.
 */
export const HERO_PICKS = [
  { slug: "necta-brio-up-minisnakky", venues: ["car-service", "car-wash"] },
  { slug: "necta-brio-up", venues: ["office", "retail"] },
  { slug: "necta-snakky", venues: ["gym", "office"] },
  { slug: "vendo-g-drink-design-6", venues: ["retail", "gym"] },
  { slug: "necta-astro", venues: ["warehouse", "logistics"] },
] as const satisfies readonly { slug: string; venues: readonly VenueType[] }[];

export const HERO_PICK_SLUGS = HERO_PICKS.map((pick) => pick.slug);

/** The two places a pick's card names, as chosen above; none for a machine
 *  that is not a pick. */
export const pickVenues = (slug: string): readonly VenueType[] =>
  HERO_PICKS.find((pick) => pick.slug === slug)?.venues ?? [];

/**
 * The picks that can actually be shown, in order.
 *
 * Named in code, so each one has to survive what the owner does in the admin.
 * A pick he unpublishes would link to a 404. One that loses its photograph
 * would put a drawing in a row of renders. And one whose price he clears would
 * go back to a derived figure - a price the owner never set, under the word
 * "препоръчваме", which is the one thing this row must not show. Any of the
 * three and it drops out, rather than breaking the row; the hero shows fewer.
 */
export function heroPicks(catalogue: Catalogue): Model[] {
  return HERO_PICK_SLUGS.map((slug) => modelBySlug(slug)).filter(
    (model): model is Model =>
      model !== undefined &&
      leadPhoto(model) !== null &&
      catalogue.isPublished(model.id) &&
      !catalogue.fromRate(model.id).isPlaceholder,
  );
}

/**
 * The cheapest-four strip further down the home page.
 *
 * It used to lead on whatever was rentable today. With one availability state
 * (D50) there is nothing to sort on, so it leads on the cheapest four - the
 * figure the page is already selling on. Machines the hero already recommends
 * are left out, so the same card is not shown twice a screen apart.
 */
export function featuredStrip(
  catalogue: Catalogue,
  picks: Model[],
  size = 4,
): Model[] {
  const picked = new Set(picks.map((m) => m.id));
  return [...catalogue.models]
    .filter((m) => !picked.has(m.id))
    .sort((a, b) => fromMonthly(catalogue, a.id) - fromMonthly(catalogue, b.id))
    .slice(0, size);
}

/**
 * The venue half of a pick's audience line stays on one line at 320px.
 *
 * Measured, not guessed: Commissioner at 13px fits about 28 characters of the
 * widest venue labels into the 213.7px a slide's text gets on a 320px screen
 * - 86% of a 288px rail, less the card's border and padding - and
 * "Производствено предприятие" alone is 195px. A character count rather
 * than a measured width keeps this a pure function the tests can hold to it.
 */
const VENUE_LINE_MAX = 28;
const VENUES_MAX = 2;

/** "15-70 души", "до 25 души", "от 100 души" - or nothing, when the record
 *  has no band at all. */
function headcountPhrase(lo: number | null, hi: number | null): string | null {
  if (lo !== null && hi !== null) return `${lo}-${hi} души`;
  if (hi !== null) return `до ${hi} души`;
  if (lo !== null) return `от ${lo} души`;
  return null;
}

/** "1-2 смени", "2-3 смени", "3 смени" - or nothing for a one-shift machine. */
function shiftPhrase(shifts: number[]): string | null {
  if (!shifts.some((s) => s >= 2)) return null;
  const lo = Math.min(...shifts);
  const hi = Math.max(...shifts);
  return lo === hi ? `${hi} смени` : `${lo}-${hi} смени`;
}

/**
 * Who a pick is for, in two short lines: where it goes, and how many people on
 * how many shifts.
 *
 * GENERATED FROM THE MODEL RECORD, never written beside it. The figures are
 * the ones the recommender scores against, so when a band moves the card
 * moves with it, and the card can never promise a site size the recommender
 * would mark the machine down for. A hand-written line agrees with the record
 * only for as long as someone remembers to keep it in step.
 *
 * Two venues at most. The `chosen` ones come first, in the order given, but
 * only those the record actually lists: one it does not is dropped, and the
 * record's own order fills the gap. Every label that still fits the line at
 * 320px is kept, so one long label does not cost the card a short one after
 * it. Shifts are named only when the record covers a second or third:
 * "1 смяна" describes every workplace and tells nobody anything.
 */
export function audienceLines(
  model: Model,
  chosen: readonly VenueType[] = [],
): {
  venues: string | null;
  fit: string | null;
} {
  const { venueTypes, minHeadcount, maxHeadcount, shifts } =
    model.recommendation;

  const candidates = [
    ...chosen.filter((venue) => venueTypes.includes(venue)),
    ...venueTypes.filter((venue) => !chosen.includes(venue)),
  ];

  const venues: string[] = [];
  for (const venue of candidates) {
    if (venues.length === VENUES_MAX) break;
    const label =
      venues.length === 0 ? VENUE_LABEL[venue] : VENUE_LABEL[venue].toLowerCase();
    if (venues.length === 0 || [...venues, label].join(", ").length <= VENUE_LINE_MAX) {
      venues.push(label);
    }
  }

  const fit = [headcountPhrase(minHeadcount, maxHeadcount), shiftPhrase(shifts)]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return {
    venues: venues.length > 0 ? venues.join(", ") : null,
    fit: fit || null,
  };
}
