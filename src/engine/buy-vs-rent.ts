/**
 * Buy or rent.
 *
 * The one rule that governs this whole module: **it must be allowed to conclude
 * that buying is cheaper**, because over a long enough horizon it usually is.
 * A calculator rigged to always favour renting is a calculator the customer
 * checks once with a pencil and never trusts again - and a procurement manager
 * checks.
 *
 * So the arithmetic is honest and the argument for renting is made where it is
 * actually true: no capital locked up on day one, a predictable monthly figure,
 * service and insurance included, and no exposure to a repair bill.
 *
 * Currency is EUR throughout. Bulgaria joined the euro area on 1 January 2026.
 */

export type PurchaseMode = "cash" | "credit";

export interface BuyVsRentInput {
  /** What the machine costs to buy outright. */
  machinePriceEur: number;
  /** Comparison horizon. */
  years: number;
  /** Annual interest if the purchase is financed. 0 means paying cash. */
  creditInterestPct: number;
  /** Servicing the buyer pays for, per year. Included in the rent. */
  annualServiceEur: number;
  /** Repairs and parts the buyer carries, per year. Included in the rent. */
  annualRepairsEur: number;
  /** The rent being compared against. */
  monthlyRentEur: number;
  /**
   * What the machine is still worth at the end, as a share of its price.
   * Counted in the buyer's favour: they still own an asset, and pretending
   * otherwise would be the thumb on the scale this module exists to avoid.
   */
  residualValuePct: number;
}

export interface CostSide {
  upfront: number;
  financingCost: number;
  service: number;
  repairs: number;
  rentPaid: number;
  /** Subtracted from the total. Zero for renting - the machine goes back. */
  residualValue: number;
  total: number;
  /** Cash unavailable for anything else from day one. */
  capitalTiedDayOne: number;
}

export interface BuyVsRentResult {
  months: number;
  mode: PurchaseMode;
  purchase: CostSide;
  rent: CostSide;
  cheaper: "purchase" | "rent" | "equal";
  /** Absolute difference in total cost over the horizon. */
  differenceEur: number;
  /**
   * The month at which buying overtakes renting on cumulative cost, if it does
   * within the horizon. This is the number a serious buyer wants, and hiding it
   * would be the dishonest move.
   */
  crossoverMonth: number | null;
  /** Cash the renter still has on day one. */
  capitalRetained: number;
  /** Cumulative cost month by month, for the chart. */
  series: { month: number; purchase: number; rent: number }[];
}

export const DEFAULTS: BuyVsRentInput = {
  machinePriceEur: 2500,
  years: 5,
  creditInterestPct: 0,
  // Marked as estimates in the UI and fully editable: the client has not yet
  // supplied his real servicing figures, and inventing them silently is exactly
  // what this project does not do.
  annualServiceEur: 220,
  annualRepairsEur: 180,
  monthlyRentEur: 100,
  residualValuePct: 25,
};

/** Standard annuity payment. */
function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct <= 0) return principal / months;
  const r = annualRatePct / 100 / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

const round = (n: number): number => Math.round(n);

export function compareBuyVsRent(input: BuyVsRentInput): BuyVsRentResult {
  const months = Math.max(1, Math.round(input.years * 12));
  const mode: PurchaseMode = input.creditInterestPct > 0 ? "credit" : "cash";

  const service = (input.annualServiceEur * months) / 12;
  const repairs = (input.annualRepairsEur * months) / 12;
  const residualValue = input.machinePriceEur * (input.residualValuePct / 100);

  const financedTotal =
    mode === "credit"
      ? monthlyPayment(input.machinePriceEur, input.creditInterestPct, months) * months
      : input.machinePriceEur;
  const financingCost = financedTotal - input.machinePriceEur;

  const purchase: CostSide = {
    upfront: mode === "cash" ? input.machinePriceEur : 0,
    financingCost: round(financingCost),
    service: round(service),
    repairs: round(repairs),
    rentPaid: 0,
    residualValue: round(residualValue),
    total: round(financedTotal + service + repairs - residualValue),
    // On credit the cash stays in the business, but the debt does not.
    capitalTiedDayOne: mode === "cash" ? input.machinePriceEur : 0,
  };

  const rentTotal = input.monthlyRentEur * months;

  const rent: CostSide = {
    upfront: 0,
    financingCost: 0,
    // Both are included in the rent, which is the whole asymmetry.
    service: 0,
    repairs: 0,
    rentPaid: round(rentTotal),
    residualValue: 0,
    total: round(rentTotal),
    capitalTiedDayOne: 0,
  };

  // Month-by-month cumulative cost, used for the chart and the crossover.
  const monthlyServiceAndRepairs =
    (input.annualServiceEur + input.annualRepairsEur) / 12;
  const monthlyFinanced =
    mode === "credit"
      ? monthlyPayment(input.machinePriceEur, input.creditInterestPct, months)
      : 0;

  const series: BuyVsRentResult["series"] = [];
  let crossoverMonth: number | null = null;

  for (let m = 1; m <= months; m++) {
    const purchaseSoFar =
      (mode === "cash" ? input.machinePriceEur : monthlyFinanced * m) +
      monthlyServiceAndRepairs * m;
    const rentSoFar = input.monthlyRentEur * m;

    series.push({ month: m, purchase: round(purchaseSoFar), rent: round(rentSoFar) });

    if (crossoverMonth === null && purchaseSoFar <= rentSoFar) {
      crossoverMonth = m;
    }
  }

  const difference = purchase.total - rent.total;

  return {
    months,
    mode,
    purchase,
    rent,
    cheaper:
      Math.abs(difference) < 1 ? "equal" : difference < 0 ? "purchase" : "rent",
    differenceEur: Math.abs(round(difference)),
    crossoverMonth,
    capitalRetained: purchase.capitalTiedDayOne,
    series,
  };
}

/**
 * What the retained capital could go to instead.
 *
 * Named, never priced. Attaching a return rate to "you could have spent this on
 * advertising" would be inventing a forecast, which PRODUCT.md forbids outright
 * and which is what made the original brief's revenue figures unusable.
 */
export const CAPITAL_USES = [
  { id: "marketing", label: "реклама и маркетинг" },
  { id: "hiring", label: "нов служител" },
  { id: "equipment", label: "друго оборудване" },
  { id: "working-capital", label: "оборотен капитал" },
  { id: "expansion", label: "разширяване на дейността" },
] as const;

export type CapitalUseId = (typeof CAPITAL_USES)[number]["id"];
