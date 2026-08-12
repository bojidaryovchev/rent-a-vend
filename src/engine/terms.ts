/**
 * Contract terms and the shape of the discount curve.
 *
 * A leaf module on purpose: `rates.ts` imports the whole catalogue to size a
 * machine against its peers, and the admin's price form needs the term curve in
 * the BROWSER to fill four fields the moment the client types the fifth. Left in
 * `rates.ts`, that import would ship 50 machine records and every spec figure
 * into the admin bundle to do one multiplication.
 */

export const TERMS = [12, 24, 36, 48, 60] as const;
export type Term = (typeof TERMS)[number];

/**
 * Term multipliers.
 *
 * Twelve months is the baseline and the most expensive per month: the shortest
 * term recovers the machine's cost slowest, so it has to price highest. Longer
 * terms step down.
 *
 * These now do two jobs. They still shape the derived placeholder, and they are
 * also the curve the admin form suggests from a typed 12-month price - which is
 * what turns pricing the catalogue into 50 numbers instead of 250. Every
 * suggestion stays editable; this decides where the fields START, not what they
 * are worth.
 */
export const TERM_FACTOR: Record<Term, number> = {
  12: 1,
  24: 0.88,
  36: 0.8,
  48: 0.74,
  60: 0.7,
};

/** Rounded to the nearest 5 so a catalogue reads like a price list rather than
 *  the output of a formula. */
export const roundToFive = (value: number): number => Math.round(value / 5) * 5;

/** The other four terms, suggested from a 12-month figure. */
export function deriveTerms(monthly12: number): Record<Term, number> {
  return {
    12: roundToFive(monthly12),
    24: roundToFive(monthly12 * TERM_FACTOR[24]),
    36: roundToFive(monthly12 * TERM_FACTOR[36]),
    48: roundToFive(monthly12 * TERM_FACTOR[48]),
    60: roundToFive(monthly12 * TERM_FACTOR[60]),
  };
}

/**
 * Whether a set of prices gets cheaper, or at least no dearer, as the term
 * lengthens.
 *
 * Enforced rather than trusted, because D27 makes the phrasing a legal matter
 * and not a cosmetic one. `reductionLabel` in `quote.ts` reads the gap between a
 * term and the 12-month baseline; if a 60-month rate were entered ABOVE the
 * 12-month one, the machine page would advertise a negative reduction. Cheapest
 * to catch in the form, at the moment the client types it.
 */
export function termsAreMonotonic(
  monthly: Partial<Record<Term, number | null>>,
): boolean {
  const entered = TERMS.map((t) => monthly[t]).filter(
    (v): v is number => typeof v === "number",
  );
  return entered.every((value, i) => i === 0 || value <= entered[i - 1]);
}
