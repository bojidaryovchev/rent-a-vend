import { MODELS } from "@/content/models";
import { fromMonthly } from "@/engine/quote";
import type { Candidate } from "@/engine/recommend";

/**
 * Projects the catalogue into the slim shape the recommender scores against.
 *
 * Built on the server and handed to the wizard as props, so the browser gets a
 * few kilobytes of decision data rather than the whole catalogue and the
 * pricing engine.
 */
export function toCandidates(): Candidate[] {
  return MODELS.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    category: m.category,
    manufacturer: m.manufacturer,
    venueTypes: m.recommendation.venueTypes,
    minHeadcount: m.recommendation.minHeadcount,
    maxHeadcount: m.recommendation.maxHeadcount,
    dailyCapacity: m.recommendation.dailyCapacity,
    shifts: m.recommendation.shifts,
    products: m.recommendation.products,
    supportsMdb: m.spec.protocol?.includes("MDB") ?? false,
    knownFields: Object.values(m.spec).filter((v) => v !== null).length,
    fromEur: fromMonthly(m.id),
  }));
}
