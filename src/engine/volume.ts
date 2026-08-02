import type { Category, ProductKind, Shifts } from "@/content/taxonomy";

/**
 * Demand estimation and machine sizing.
 *
 * The recommender deliberately does NOT ask "how many coffees a day do you
 * expect?" - the visitor does not know, will guess, and a guessed input
 * produces a wrong recommendation. We ask what they do know (headcount, shift
 * pattern, products) and derive the rest, then show the assumption so they can
 * correct it.
 *
 * Two separate things are derived here, from two separate sources:
 *
 * 1. `dailyVolume` - how much gets bought. Still our published-norm default:
 *    workplace vending runs roughly 0.1-0.2 purchases per person per working
 *    day, and shift pattern lifts consumption per head. The client has not
 *    given us his own consumption figures, so `isDefault` stays true.
 *
 * 2. `machineCount` - how many machines to put on site. This is now the
 *    CLIENT'S table (round 15), not ours, and it is deliberately more generous
 *    than the industry norm of one unit per 75-100 people. His stated reason is
 *    commercial: more machines on site is more rent. We implement his table as
 *    given, present the result as a recommendation rather than a requirement,
 *    and name the combination machine as the smaller alternative wherever one
 *    exists - so the visitor can see and take the cheaper option.
 */

/** Purchases per person per working day, midpoint of the observed 0.1-0.2. */
const PURCHASE_RATE = 0.15;

/** Round-the-clock sites consume more per head than single-shift ones. */
const SHIFT_MULTIPLIER: Record<Shifts, number> = {
  1: 1,
  2: 1.15,
  3: 1.3,
};

/**
 * The client's sizing bands: up to 50 people one machine, above 50 and up to
 * 200 three machines. Read as inclusive upper bounds.
 */
const HEADCOUNT_BANDS = [
  { upTo: 50, machines: 1 },
  { upTo: 200, machines: 3 },
] as const;

/** "Над 200 човека вече ще са от четири машини нагоре." */
const MACHINES_ABOVE_TOP_BAND = 4;

/** ...growing with headcount past that point. */
const PEOPLE_PER_EXTRA_MACHINE = 200;

/**
 * "...в зависимост от смените." Shifts add machines only on the large sites,
 * where a second and third shift means the same units are worked round the
 * clock and cannot be restocked between rushes.
 */
const MACHINES_PER_EXTRA_SHIFT = 1;

/** A machine type on site. A combination unit is a pair, not a fourth line. */
export type MachineLine = Exclude<Category, "combo">;

/**
 * Which line serves which product. Hot drinks and solids are different
 * machines - that is the whole of the client's "snacks and coffee is two
 * machines" rule.
 */
const LINE_FOR_PRODUCT: Record<ProductKind, MachineLine> = {
  coffee: "coffee",
  snack: "snack",
  food: "snack",
  cold: "cold",
};

/** Extra machines land on the highest-turnover line first. */
const LINE_ORDER: readonly MachineLine[] = ["coffee", "snack", "cold"];

export interface LineCount {
  line: MachineLine;
  count: number;
}

export interface DemandEstimate {
  /** Drinks or items expected on a normal working day. */
  dailyVolume: number;
  /** Machines the site is advised to take, per the client's table. */
  machineCount: number;
  /** How that count splits across machine types. Empty if nothing was chosen. */
  mix: LineCount[];
  /** True while the consumption rate is our published-norm default. */
  isDefault: boolean;
  /** Plain-language statement of what was assumed, shown to the visitor. */
  assumption: string;
}

/** The client's band table, before the product mix is taken into account. */
function bandMachineCount(headcount: number, shifts: Shifts): number {
  for (const band of HEADCOUNT_BANDS) {
    if (headcount <= band.upTo) return band.machines;
  }
  const top = HEADCOUNT_BANDS[HEADCOUNT_BANDS.length - 1];
  const forHeadcount = Math.floor(
    (headcount - top.upTo) / PEOPLE_PER_EXTRA_MACHINE,
  );
  const forShifts = (shifts - 1) * MACHINES_PER_EXTRA_SHIFT;
  return MACHINES_ABOVE_TOP_BAND + forHeadcount + forShifts;
}

/** Which distinct machine lines the requested products need, in serve order. */
export function linesFor(products: ProductKind[]): MachineLine[] {
  const wanted = new Set(products.map((p) => LINE_FOR_PRODUCT[p]));
  return LINE_ORDER.filter((line) => wanted.has(line));
}

/** Spread a total across the lines, remainder to the earliest lines. */
function distribute(total: number, lines: MachineLine[]): LineCount[] {
  if (lines.length === 0) return [];
  const each = Math.floor(total / lines.length);
  let remainder = total % lines.length;
  return lines.map((line) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { line, count: each + extra };
  });
}

export function estimateDemand(
  headcount: number,
  shifts: Shifts,
  products: ProductKind[] = [],
): DemandEstimate {
  const safeHeadcount = Math.max(0, Math.round(headcount));
  const dailyVolume = Math.round(
    safeHeadcount * PURCHASE_RATE * SHIFT_MULTIPLIER[shifts],
  );

  // One machine per requested line is the floor: a coffee machine cannot sell
  // a sandwich however small the site is.
  const lines = linesFor(products);
  const machineCount = Math.max(
    1,
    bandMachineCount(safeHeadcount, shifts),
    lines.length,
  );
  const mix = distribute(machineCount, lines);

  const shiftWord =
    shifts === 1 ? "една смяна" : shifts === 2 ? "две смени" : "три смени";

  return {
    dailyVolume,
    machineCount,
    mix,
    isDefault: true,
    assumption:
      `При ${safeHeadcount} души на ${shiftWord} очакваме около ${dailyVolume} ` +
      `продажби на ден и ${machineCount} ${machineCount === 1 ? "машина" : "машини"}.`,
  };
}

/**
 * Whether a site is large enough for an operator to place a machine free of
 * charge. Published thresholds sit at 40-50 people, with some operators holding
 * out for 65-75; the client's own table puts the first machine at up to 50.
 * Used to steer small sites toward rental rather than waiting for an offer that
 * will not come.
 */
export const MIN_HEADCOUNT_FOR_FREE_PLACEMENT = 45;

export const isBelowFreePlacementThreshold = (headcount: number): boolean =>
  headcount < MIN_HEADCOUNT_FOR_FREE_PLACEMENT;
