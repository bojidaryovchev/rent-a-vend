import type { Catalogue } from "./catalogue";
import { TERMS, type Term } from "./rates";

/**
 * Quote maths.
 *
 * One module computes every money figure on the site, so the machine page, the
 * rental calculator and the enquiry email can never disagree with each other in
 * front of a customer.
 *
 * Every function takes the loaded `Catalogue` as its first argument rather than
 * reaching for prices itself. That keeps the maths synchronous and unit-testable
 * against a literal now that the prices behind it come from a database, and it
 * makes the data dependency visible in the signature instead of hidden in an
 * import.
 */

/** Working days used to convert a monthly rate into a per-day figure. */
const WORKING_DAYS_PER_MONTH = 30;

/**
 * What the monthly rate covers.
 *
 * Deliberately says "сервиз при нормална експлоатация" rather than "гаранционно
 * обслужване": the FAQ makes damage from misuse the customer's cost, and a
 * customer will point at the calculator when a repair bill arrives. The two
 * must say the same thing.
 */
export const INCLUDED_IN_RENT = [
  "доставка",
  "монтаж",
  "сервиз при нормална експлоатация",
  "техническа поддръжка",
  "застраховка на машината",
  "без първоначална инвестиция",
] as const;

export interface Quote {
  term: Term;
  monthlyEur: number;
  /** Per-day framing. A smaller number is easier to accept than a monthly one. */
  dailyEur: number;
  /** Total across the whole term. Shown last and smaller - see note below. */
  totalEur: number;
  /**
   * How much lower the monthly instalment is than the 12-month baseline.
   *
   * Expressed as a lower instalment, never as a saving. A 60-month term has a
   * lower monthly payment but a far higher total, so "спестявате 30%" would be
   * false and is exposed under Directive 2006/114/EC on misleading B2B
   * advertising.
   */
  monthlyReductionPct: number;
  included: readonly string[];
  isPlaceholder: boolean;
}

export function quote(
  catalogue: Catalogue,
  modelId: string,
  term: Term,
): Quote {
  const rate = catalogue.rate(modelId, term);
  const baseline = catalogue.rate(modelId, 12).monthlyEur;

  return {
    term,
    monthlyEur: rate.monthlyEur,
    dailyEur: Math.round((rate.monthlyEur / WORKING_DAYS_PER_MONTH) * 100) / 100,
    totalEur: rate.monthlyEur * term,
    /**
     * Clamped at zero.
     *
     * The derived curve could never produce a longer term that costs more, and
     * the admin form refuses to save one - but a row written before that
     * validation existed, or edited in the database by hand, still can. A
     * negative reduction would render as "С -4% по-ниска месечна вноска", so
     * the floor here is the last of three guards rather than the only one.
     */
    monthlyReductionPct:
      baseline > 0
        ? Math.max(0, Math.round(((baseline - rate.monthlyEur) / baseline) * 100))
        : 0,
    included: INCLUDED_IN_RENT,
    isPlaceholder: rate.isPlaceholder,
  };
}

export const quoteAllTerms = (catalogue: Catalogue, modelId: string): Quote[] =>
  TERMS.map((term) => quote(catalogue, modelId, term));

/** Cheapest monthly figure, for "от X €/месец" headlines. */
export const fromMonthly = (catalogue: Catalogue, modelId: string): number =>
  catalogue.fromRate(modelId).monthlyEur;

/**
 * Phrasing for a term's advantage. Returns null for the baseline term, where
 * there is nothing to claim.
 */
export function reductionLabel(q: Quote): string | null {
  if (q.term === 12) return "Стандартна месечна вноска";
  if (q.monthlyReductionPct <= 0) return null;
  return `С ${q.monthlyReductionPct}% по-ниска месечна вноска`;
}
