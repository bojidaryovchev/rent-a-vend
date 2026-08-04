import type { Model } from "@/content/schema";
import { leadPhoto } from "@/content/models";
import { VENUE_TO_GROUP, type VenueGroup } from "@/content/taxonomy";
import { fromMonthly } from "@/engine/quote";
import type { CardData } from "@/components/catalogue/model-card";

/**
 * Flattens a model into the serialisable shape the client grid needs, so
 * filtering can happen in the browser without shipping the catalogue and the
 * pricing engine along with it.
 */
export function toCardData(model: Model): CardData {
  const venueGroups = [
    ...new Set(model.recommendation.venueTypes.map((v) => VENUE_TO_GROUP[v])),
  ] as VenueGroup[];

  /* One frame per card, combination machines included: a combo is a single
   * stacked cabinet, so its front view already shows the whole product. */
  const photos = [leadPhoto(model)].filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );

  return {
    id: model.id,
    slug: model.slug,
    category: model.category,
    name: model.name,
    manufacturer: model.manufacturer,
    currentName: model.currentName,
    capacity: model.spec.productCapacity,
    fromEur: fromMonthly(model.id),
    venueGroups,
    shape: {
      widthMm: model.spec.widthMm,
      heightMm: model.spec.heightMm,
      numTrays: model.spec.numTrays,
      numberOfSelections: model.spec.numberOfSelections,
    },
    /* Flattened rather than passed whole: the card is serialised to the client
     * grid, and view/credit are of no use there. */
    photos: photos.map((p) => ({ src: p.src, alt: p.alt })),
  };
}
