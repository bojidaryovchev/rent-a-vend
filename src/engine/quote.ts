import { rateFor, ratesFor, IS_PLACEHOLDER, type Term } from "./rates";

/**
 * Quote maths.
 *
 * One module computes every money figure on the site, so the machine page, the
 * rental calculator and the enquiry email can never disagree with each other in
 * front of a customer.
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

export function quote(unitId: string, term: Term): Quote {
  const rate = rateFor(unitId, term);
  const baseline = rateFor(unitId, 12).monthlyEur;

  return {
    term,
    monthlyEur: rate.monthlyEur,
    dailyEur: Math.round((rate.monthlyEur / WORKING_DAYS_PER_MONTH) * 100) / 100,
    totalEur: rate.monthlyEur * term,
    monthlyReductionPct:
      baseline > 0
        ? Math.round(((baseline - rate.monthlyEur) / baseline) * 100)
        : 0,
    included: INCLUDED_IN_RENT,
    isPlaceholder: IS_PLACEHOLDER,
  };
}

export const quoteAllTerms = (unitId: string): Quote[] =>
  ratesFor(unitId).map((r) => quote(unitId, r.term));

/** Cheapest monthly figure, for "от X €/месец" headlines. */
export function fromMonthly(unitId: string): number {
  return Math.min(...ratesFor(unitId).map((r) => r.monthlyEur));
}

/**
 * Phrasing for a term's advantage. Returns null for the baseline term, where
 * there is nothing to claim.
 */
export function reductionLabel(q: Quote): string | null {
  if (q.term === 12) return "Стандартна месечна вноска";
  if (q.monthlyReductionPct <= 0) return null;
  return `С ${q.monthlyReductionPct}% по-ниска месечна вноска`;
}
