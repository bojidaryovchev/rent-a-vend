import { MODELS, modelById } from "@/content/models";
import type { Model } from "@/content/schema";

/**
 * "Подходяща алтернатива" on every machine page.
 *
 * Computed from the catalogue rather than curated by hand: 62 models times
 * three alternatives is 186 relationships that would need maintaining every
 * time stock changes, and they would rot.
 *
 * Machines that are actually available rank first - suggesting a model the
 * customer cannot have wastes the click.
 */

interface Options {
  /** Model ids with at least one rentable unit right now. */
  availableModelIds?: Set<string>;
  limit?: number;
}

const magnitude = (model: Model): number =>
  model.spec.productCapacity ??
  (model.spec.numberOfSelections ? model.spec.numberOfSelections * 8 : 0);

const footprint = (model: Model): number =>
  (model.spec.widthMm ?? 0) * (model.spec.depthMm ?? 0);

export function alternativesFor(
  model: Model,
  { availableModelIds, limit = 3 }: Options = {},
): Model[] {
  const scored = MODELS.filter(
    (m) => m.id !== model.id && m.category === model.category,
  ).map((candidate) => {
    let score = 0;

    // Similar capacity is the strongest similarity signal.
    const a = magnitude(model);
    const b = magnitude(candidate);
    if (a > 0 && b > 0) {
      const ratio = Math.min(a, b) / Math.max(a, b);
      score += ratio * 40;
    }

    // Similar footprint: a machine that will not fit is not an alternative.
    const fa = footprint(model);
    const fb = footprint(candidate);
    if (fa > 0 && fb > 0) {
      score += (Math.min(fa, fb) / Math.max(fa, fb)) * 25;
    }

    // Overlapping headcount band.
    const lo = Math.max(
      model.recommendation.minHeadcount ?? 0,
      candidate.recommendation.minHeadcount ?? 0,
    );
    const hi = Math.min(
      model.recommendation.maxHeadcount ?? Infinity,
      candidate.recommendation.maxHeadcount ?? Infinity,
    );
    if (hi > lo) score += 20;

    // Shared venue types.
    const sharedVenues = candidate.recommendation.venueTypes.filter((v) =>
      model.recommendation.venueTypes.includes(v),
    ).length;
    score += Math.min(15, sharedVenues * 4);

    // A different manufacturer is a more useful alternative than another trim
    // of the same machine.
    if (candidate.manufacturer !== model.manufacturer) score += 8;
    if (candidate.name.split(" ")[1] === model.name.split(" ")[1]) score -= 12;

    // Availability wins ties decisively.
    if (availableModelIds?.has(candidate.id)) score += 30;

    return { candidate, score };
  });

  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => s.candidate);
}

/** Manual override hook: the client knows pairings the data cannot see. */
const MANUAL_OVERRIDES: Record<string, string[]> = {};

export function alternativesWithOverrides(
  model: Model,
  options: Options = {},
): Model[] {
  const manual = (MANUAL_OVERRIDES[model.id] ?? [])
    .map((id) => modelById(id))
    .filter((m): m is Model => !!m);

  if (manual.length >= (options.limit ?? 3)) return manual.slice(0, options.limit ?? 3);

  const computed = alternativesFor(model, options).filter(
    (m) => !manual.some((x) => x.id === m.id),
  );
  return [...manual, ...computed].slice(0, options.limit ?? 3);
}
