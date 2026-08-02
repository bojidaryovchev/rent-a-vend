import { describe, expect, it } from "vitest";
import { compareBuyVsRent, DEFAULTS, type BuyVsRentInput } from "./buy-vs-rent";

const input = (over: Partial<BuyVsRentInput> = {}): BuyVsRentInput => ({
  ...DEFAULTS,
  ...over,
});

describe("buy vs rent", () => {
  it("counts the months in the horizon", () => {
    expect(compareBuyVsRent(input({ years: 5 })).months).toBe(60);
  });

  it("charges the buyer for service and repairs, and the renter for neither", () => {
    // The whole asymmetry. If this ever inverts, the comparison is broken.
    const r = compareBuyVsRent(input());
    expect(r.purchase.service).toBeGreaterThan(0);
    expect(r.purchase.repairs).toBeGreaterThan(0);
    expect(r.rent.service).toBe(0);
    expect(r.rent.repairs).toBe(0);
  });

  it("credits the buyer with the machine's residual value", () => {
    // They still own an asset at the end. Ignoring it would be the thumb on
    // the scale this module exists to avoid.
    const withResidual = compareBuyVsRent(input({ residualValuePct: 40 }));
    const without = compareBuyVsRent(input({ residualValuePct: 0 }));
    expect(withResidual.purchase.total).toBeLessThan(without.purchase.total);
  });

  it("IS ALLOWED TO CONCLUDE THAT BUYING IS CHEAPER", () => {
    // The single most important test here. Over a long horizon, purchase
    // normally wins on total cost, and a calculator that cannot say so is one
    // the customer checks with a pencil and never trusts again.
    const r = compareBuyVsRent(input({ years: 10 }));
    expect(r.cheaper).toBe("purchase");
  });

  it("finds renting cheaper over a short horizon", () => {
    const r = compareBuyVsRent(input({ years: 1 }));
    expect(r.cheaper).toBe("rent");
  });

  it("reports the month where buying overtakes renting", () => {
    const r = compareBuyVsRent(input({ years: 10 }));
    expect(r.crossoverMonth).not.toBeNull();
    expect(r.crossoverMonth!).toBeGreaterThan(1);
    expect(r.crossoverMonth!).toBeLessThanOrEqual(r.months);
  });

  it("returns no crossover when renting stays cheaper throughout", () => {
    const r = compareBuyVsRent(input({ years: 1, machinePriceEur: 9000 }));
    expect(r.crossoverMonth).toBeNull();
  });

  it("ties up the buyer's capital on day one and the renter's not at all", () => {
    const r = compareBuyVsRent(input({ machinePriceEur: 2500 }));
    expect(r.purchase.capitalTiedDayOne).toBe(2500);
    expect(r.rent.capitalTiedDayOne).toBe(0);
    expect(r.capitalRetained).toBe(2500);
  });

  it("frees the day-one capital when the purchase is financed, but charges interest", () => {
    const cash = compareBuyVsRent(input({ creditInterestPct: 0 }));
    const credit = compareBuyVsRent(input({ creditInterestPct: 9 }));

    expect(credit.mode).toBe("credit");
    expect(credit.purchase.capitalTiedDayOne).toBe(0);
    expect(credit.purchase.financingCost).toBeGreaterThan(0);
    expect(credit.purchase.total).toBeGreaterThan(cash.purchase.total);
  });

  it("charges no interest on a cash purchase", () => {
    const r = compareBuyVsRent(input({ creditInterestPct: 0 }));
    expect(r.mode).toBe("cash");
    expect(r.purchase.financingCost).toBe(0);
  });

  it("produces a cumulative series covering every month", () => {
    const r = compareBuyVsRent(input({ years: 3 }));
    expect(r.series).toHaveLength(36);
    expect(r.series[0].month).toBe(1);
    expect(r.series.at(-1)!.month).toBe(36);
  });

  it("starts a cash purchase high on day one and rent near zero", () => {
    // The shape the chart exists to show.
    const r = compareBuyVsRent(input({ machinePriceEur: 2500, monthlyRentEur: 100 }));
    expect(r.series[0].purchase).toBeGreaterThan(2000);
    expect(r.series[0].rent).toBeLessThan(200);
  });

  it("grows the rent line linearly", () => {
    const r = compareBuyVsRent(input({ monthlyRentEur: 100 }));
    expect(r.series[0].rent).toBe(100);
    expect(r.series[11].rent).toBe(1200);
  });

  it("reports the difference as an absolute figure", () => {
    const r = compareBuyVsRent(input({ years: 10 }));
    expect(r.differenceEur).toBeGreaterThanOrEqual(0);
  });
});
