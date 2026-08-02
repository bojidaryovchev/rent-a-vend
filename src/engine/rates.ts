import { MODELS } from "@/content/models";
import type { Category } from "@/content/taxonomy";

/**
 * Rental rates.
 *
 * PLACEHOLDER DATA — but no longer a flat one.
 *
 * A single rate across the whole catalogue made every card read "от 70 €/месец"
 * on a site whose entire positioning is "real stock, individually priced". The
 * page built to break the competitors' impression was reproducing it.
 *
 * So the placeholder is now DERIVED from catalogue facts we already hold:
 * category, capacity, and physical footprint. Nothing is invented — a bigger
 * machine that holds more product costs more, which is true of the real market
 * and produces a believable spread instead of a flat line. It stays flagged as
 * placeholder, the banner stays up, and the readiness gate still blocks launch.
 *
 * The real model is per physical unit (decision D9): each machine in the
 * warehouse carries its own monthly rate across five contract terms. When that
 * table arrives, `rateFor` reads it and `IS_PLACEHOLDER` flips to false.
 *
 * Currency is EUR only. Bulgaria joined the euro area on 1 January 2026.
 */

export const TERMS = [12, 24, 36, 48, 60] as const;
export type Term = (typeof TERMS)[number];

export const IS_PLACEHOLDER = true;

/**
 * Category baselines, in the band observed across Europe: Italian coffee
 * machines run €50-150, snack and cold €100-250, combinations €150-400.
 */
const CATEGORY_BASE: Record<Category, number> = {
  coffee: 78,
  snack: 84,
  cold: 96,
  combo: 148,
};

/**
 * Term multipliers.
 *
 * Twelve months is the baseline and the most expensive per month: the shortest
 * term recovers the machine's cost slowest, so it has to price highest. Longer
 * terms step down. Illustrative ratios only.
 */
const TERM_FACTOR: Record<Term, number> = {
  12: 1,
  24: 0.88,
  36: 0.8,
  48: 0.74,
  60: 0.7,
};

/** Scales a machine against the median of its own category. */
function sizeFactor(modelId: string): number {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return 1;

  const peers = MODELS.filter((m) => m.category === model.category);

  const magnitude = (id: string): number => {
    const m = MODELS.find((x) => x.id === id);
    if (!m) return 0;
    const capacity = m.spec.productCapacity ?? 0;
    const selections = (m.spec.numberOfSelections ?? 0) * 6;
    const footprint =
      m.spec.widthMm && m.spec.heightMm
        ? (m.spec.widthMm * m.spec.heightMm) / 4000
        : 0;
    return capacity || selections || footprint;
  };

  const own = magnitude(modelId);
  const known = peers.map((p) => magnitude(p.id)).filter((v) => v > 0);
  if (own === 0 || known.length === 0) return 1;

  const median = known.sort((a, b) => a - b)[Math.floor(known.length / 2)];
  if (median === 0) return 1;

  // Clamped: a machine twice the size is not twice the rent.
  const raw = Math.sqrt(own / median);
  return Math.min(1.45, Math.max(0.72, raw));
}

export interface Rate {
  term: Term;
  monthlyEur: number;
  isPlaceholder: boolean;
}

/** Baseline monthly figure for a model, before the term discount. */
function baseMonthly(modelId: string): number {
  const model = MODELS.find((m) => m.id === modelId);
  const base = CATEGORY_BASE[model?.category ?? "coffee"];
  // Rounded to the nearest 5 so the catalogue reads like a price list rather
  // than the output of a formula.
  return Math.round((base * sizeFactor(modelId)) / 5) * 5;
}

export function rateFor(modelId: string, term: Term): Rate {
  return {
    term,
    monthlyEur: Math.round((baseMonthly(modelId) * TERM_FACTOR[term]) / 5) * 5,
    isPlaceholder: IS_PLACEHOLDER,
  };
}

export function ratesFor(modelId: string): Rate[] {
  return TERMS.map((term) => rateFor(modelId, term));
}

/** Cheapest monthly figure across all terms, for "от X €/месец" headlines. */
export function fromRate(modelId: string): Rate {
  return ratesFor(modelId).reduce((cheapest, rate) =>
    rate.monthlyEur < cheapest.monthlyEur ? rate : cheapest,
  );
}

/**
 * Reduction against the 12-month baseline.
 *
 * Deliberately expressed as a lower monthly instalment, never as a saving: a
 * 60-month term has a lower monthly payment but a far higher total, so
 * "спестявате 30%" would be false and is exposed under Directive 2006/114/EC.
 */
export function monthlyReductionVsBaseline(modelId: string, term: Term): number {
  const baseline = rateFor(modelId, 12).monthlyEur;
  const current = rateFor(modelId, term).monthlyEur;
  if (baseline <= 0) return 0;
  return Math.round(((baseline - current) / baseline) * 100);
}
