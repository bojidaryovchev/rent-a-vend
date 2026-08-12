import type { Model } from "@/content/schema";
import type { Category } from "@/content/taxonomy";
import { MODELS } from "@/content/models";
import { z } from "@/lib/zod";
import { derivedMonthly, TERMS, type Rate, type Term } from "./rates";

/**
 * The catalogue, as the client has configured it.
 *
 * ONE OBJECT, LOADED ONCE PER RENDER, and that shape is the point. Prices moved
 * from a pure function to a database row, which normally means every helper that
 * touches a price becomes async and the await spreads until it reaches the JSON-
 * LD builder and the card mapper. Instead the whole table - 50 rows, a few
 * kilobytes - is read once at the top of a page and handed down as a value.
 * `toCardData`, `modelJsonLd` and the quote maths stay synchronous and stay
 * testable against a literal, and a page reads its data where a page should.
 *
 * NOTHING IN THIS FILE TOUCHES A DATABASE. `buildCatalogue` takes rows as plain
 * data, so the report script and the unit tests can construct a catalogue with
 * no credentials and no `server-only` import to trip over. The reading lives in
 * `src/server/catalogue.ts`, which is the only module that needs to know a
 * database exists.
 */

/**
 * One machine's settings, as stored.
 *
 * The prices are keyed by term as a STRING, because that is what survives a
 * round trip through JSON in the development file store. `monthlyByTerm` below
 * is the only place that converts back, so nothing downstream has to remember.
 */
export const modelSettingsRecordSchema = z.object({
  modelId: z.string().min(1),
  monthly: z.record(z.string(), z.number().int().positive()).default({}),
  published: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  updatedAt: z.string(),
});

export type ModelSettingsRecord = z.infer<typeof modelSettingsRecordSchema>;

/** Narrows the loose stored shape back to terms, dropping anything unknown -
 *  a hand-edited JSON file, or a term this business no longer offers. */
export function monthlyByTerm(
  record: ModelSettingsRecord,
): Partial<Record<Term, number>> {
  const out: Partial<Record<Term, number>> = {};
  for (const term of TERMS) {
    const value = record.monthly[String(term)];
    if (typeof value === "number" && value > 0) out[term] = value;
  }
  return out;
}

export interface Catalogue {
  /** Every model, published or not, in catalogue order. For the admin. */
  readonly all: Model[];
  /** Published models, in the client's order. What the site shows. */
  readonly models: Model[];
  readonly settings: Map<string, ModelSettingsRecord>;
  /** False when the settings could not be read at all. */
  readonly ok: boolean;

  byCategory(category: Category): Model[];
  isPublished(modelId: string): boolean;

  rate(modelId: string, term: Term): Rate;
  rates(modelId: string): Rate[];
  /** Cheapest monthly figure across all terms, for "от X €/месец" headlines. */
  fromRate(modelId: string): Rate;

  /** Models with no real price on any term. Drives the admin's progress line
   *  and the honesty of the placeholder banner. */
  unpriced(): Model[];
}

export function buildCatalogue(
  records: ModelSettingsRecord[],
  ok = true,
): Catalogue {
  const settings = new Map(records.map((r) => [r.modelId, r]));

  const isPublished = (modelId: string): boolean =>
    settings.get(modelId)?.published ?? true;

  /**
   * Sorted by the client's order, then by catalogue order.
   *
   * The index tiebreak is explicit rather than leaning on a stable sort: every
   * row defaults to 0, so an untouched catalogue is ALL ties, and "the order it
   * has today" is a promise this function should make out loud.
   */
  const ordered = MODELS.map((model, index) => ({ model, index }))
    .sort((a, b) => {
      const byOrder =
        (settings.get(a.model.id)?.sortOrder ?? 0) -
        (settings.get(b.model.id)?.sortOrder ?? 0);
      return byOrder !== 0 ? byOrder : a.index - b.index;
    })
    .map((entry) => entry.model);

  const rate = (modelId: string, term: Term): Rate => {
    const record = settings.get(modelId);
    const priced = record ? monthlyByTerm(record)[term] : undefined;

    return priced !== undefined
      ? { term, monthlyEur: priced, isPlaceholder: false }
      : { term, monthlyEur: derivedMonthly(modelId, term), isPlaceholder: true };
  };

  const rates = (modelId: string): Rate[] =>
    TERMS.map((term) => rate(modelId, term));

  return {
    all: MODELS,
    models: ordered.filter((m) => isPublished(m.id)),
    settings,
    ok,

    byCategory: (category) =>
      ordered.filter((m) => m.category === category && isPublished(m.id)),

    isPublished,
    rate,
    rates,

    fromRate: (modelId) =>
      rates(modelId).reduce((cheapest, r) =>
        r.monthlyEur < cheapest.monthlyEur ? r : cheapest,
      ),

    unpriced: () =>
      MODELS.filter((m) => {
        const record = settings.get(m.id);
        return !record || Object.keys(monthlyByTerm(record)).length === 0;
      }),
  };
}

/** The catalogue as it looks with nothing configured: every machine published,
 *  every price derived. What the site was before this feature existed. */
export const derivedCatalogue = (): Catalogue => buildCatalogue([]);
