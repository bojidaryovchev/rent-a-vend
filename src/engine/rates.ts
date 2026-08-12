import { MODELS } from "@/content/models";
import type { Category } from "@/content/taxonomy";
import { TERMS, TERM_FACTOR, roundToFive, type Term } from "./terms";

/**
 * The DERIVED rental rate - what a machine costs when nobody has priced it yet.
 *
 * This file used to be the price list. It is now the fallback under one, and the
 * distinction is the whole point of the change: real prices live in the
 * `model_settings` table and are edited by the client in `/admin/tseni`, and
 * every term with no figure in that table lands here instead.
 *
 * So a machine is placeholder-priced or it is not, MODEL BY MODEL. There is no
 * global `IS_PLACEHOLDER` any more, because the honest answer stopped being a
 * single boolean the moment the first real price could be typed: ten priced
 * machines beside forty derived ones is the normal state of this catalogue for
 * as long as it takes the client to work through it, and the banner has to be
 * able to say so.
 *
 * The derivation itself is unchanged, and the reasoning still holds. A single
 * flat rate across the catalogue made every card read "от 70 €/месец" on a site
 * whose entire positioning is "real stock, individually priced" - the page built
 * to break the competitors' impression was reproducing it. What is derived here
 * comes from catalogue facts we already hold: category, capacity and physical
 * footprint. Nothing is invented; a bigger machine that holds more product costs
 * more, which is true of the real market and produces a believable spread.
 *
 * Currency is EUR only. Bulgaria joined the euro area on 1 January 2026.
 */

export { TERMS, TERM_FACTOR, roundToFive };
export type { Term };

/**
 * Category baselines, in the band observed across Europe: Italian coffee
 * machines run €50-150, snack and cold €100-250, combinations €150-400.
 *
 * The combo baseline sits under that band on purpose. It was set at 148 for a
 * catalogue of full-size pairs - a Canto beside a Samba is two large machines
 * and priced like it. What the client actually lets out is a Brio on a Mini
 * Snakky base: one compact cabinet, four trays, 252 products. Pricing it above
 * every snack machine in the catalogue would have been the formula outrunning
 * the machine.
 */
const CATEGORY_BASE: Record<Category, number> = {
  coffee: 78,
  snack: 84,
  cold: 96,
  combo: 126,
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

/** Derived baseline monthly figure for a model, before the term discount. */
export function derivedBaseMonthly(modelId: string): number {
  const model = MODELS.find((m) => m.id === modelId);
  const base = CATEGORY_BASE[model?.category ?? "coffee"];
  return roundToFive(base * sizeFactor(modelId));
}

/** Derived monthly figure for one model on one term. */
export function derivedMonthly(modelId: string, term: Term): number {
  return roundToFive(derivedBaseMonthly(modelId) * TERM_FACTOR[term]);
}

export interface Rate {
  term: Term;
  monthlyEur: number;
  /** True when this figure came from the derivation above rather than from a
   *  price the client typed. Per model and per term, not per site. */
  isPlaceholder: boolean;
}
