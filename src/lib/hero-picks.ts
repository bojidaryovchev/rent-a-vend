import type { Model } from "@/content/schema";
import { leadPhoto, modelBySlug } from "@/content/models";
import { VENUE_LABEL } from "@/content/taxonomy";
import type { Catalogue } from "@/engine/catalogue";

/**
 * The machines the home page hero recommends, in the order it shows them.
 *
 * NAMED, NOT COMPUTED, for the reason the single hero machine was: this is a
 * recommendation, stated as ours. The site has no sales history, so ranking
 * these by popularity would be a performance figure nobody can check, and
 * PRODUCT.md rules those out.
 *
 * What the names rest on. The first is the combination machine the hero has
 * always led on - the one product photographed exactly as it is delivered,
 * assembled - and it stays first because its frame is the page's largest
 * paint: moving it would change the number the page is measured on. Each of
 * the other four is what `recommend()` itself answers for one kind of site,
 * as its pick or its first runner-up: a small office or car service wanting
 * coffee (Korinto), snacks (Melodia), cold drinks (G-Drink Design 6), and a
 * plant or warehouse on two or three shifts (Astro).
 *
 * Where the recommender's own pick lost the slot, it lost on the photograph.
 * The Colibri, Snakky and Canto renders show the machine 358-377px tall, and
 * a 280-320px bed on a phone screen at two or three device pixels per pixel
 * enlarges that past sharp. These five show it at 430px and up.
 *
 * The snack slot may yet go to the Snakky. That is a one-word change here,
 * and nothing else needs to know.
 */
export const HERO_PICK_SLUGS = [
  "necta-brio-up-minisnakky",
  "necta-korinto",
  "necta-melodia",
  "vendo-g-drink-design-6",
  "necta-astro",
] as const;

/**
 * The picks that can actually be shown, in order.
 *
 * Named in code, so each one has to survive being unpublished or losing its
 * frame: a pick the client has hidden would link to a 404, and one with no
 * photograph would put a drawing in the middle of a row of renders. Either
 * way it drops out rather than breaking the row, and the hero shows fewer.
 */
export function heroPicks(catalogue: Catalogue): Model[] {
  return HERO_PICK_SLUGS.map((slug) => modelBySlug(slug)).filter(
    (model): model is Model =>
      model !== undefined &&
      leadPhoto(model) !== null &&
      catalogue.isPublished(model.id),
  );
}

/**
 * The venue half of a pick's audience line stays on one line at 320px.
 *
 * Measured, not guessed: Commissioner at 13px fits about 28 characters of the
 * widest venue labels into the 211px a slide's text gets on a 320px screen
 * ("Производствено предприятие" alone is 195px). A character count rather
 * than a measured width keeps this a pure function the tests can hold to it.
 */
const VENUE_LINE_MAX = 28;
const VENUES_MAX = 3;

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
 * Venues are taken in record order, at most three, and stop at the first one
 * that would push the line past what fits on one line at 320px. Shifts are
 * named only when the record covers a second or third: "1 смяна" describes
 * every workplace and tells nobody anything.
 */
export function audienceLines(model: Model): {
  venues: string | null;
  fit: string | null;
} {
  const { venueTypes, minHeadcount, maxHeadcount, shifts } =
    model.recommendation;

  const venues: string[] = [];
  for (const venue of venueTypes.slice(0, VENUES_MAX)) {
    const label =
      venues.length === 0 ? VENUE_LABEL[venue] : VENUE_LABEL[venue].toLowerCase();
    const next = [...venues, label].join(", ");
    if (venues.length > 0 && next.length > VENUE_LINE_MAX) break;
    venues.push(label);
  }

  const fit = [headcountPhrase(minHeadcount, maxHeadcount), shiftPhrase(shifts)]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return {
    venues: venues.length > 0 ? venues.join(", ") : null,
    fit: fit || null,
  };
}
