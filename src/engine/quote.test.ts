import { describe, expect, it } from "vitest";
import { quote, quoteAllTerms, fromMonthly, reductionLabel } from "./quote";
import { TERMS } from "./rates";

const UNIT = "test-unit";

describe("quote", () => {
  it("returns a quote for every contract term", () => {
    expect(quoteAllTerms(UNIT).map((q) => q.term)).toEqual([...TERMS]);
  });

  it("total is the monthly rate across the whole term", () => {
    for (const q of quoteAllTerms(UNIT)) {
      expect(q.totalEur).toBe(q.monthlyEur * q.term);
    }
  });

  it("treats 12 months as the baseline with no reduction", () => {
    expect(quote(UNIT, 12).monthlyReductionPct).toBe(0);
  });

  it("prices longer terms at a lower monthly instalment", () => {
    const twelve = quote(UNIT, 12).monthlyEur;
    const sixty = quote(UNIT, 60).monthlyEur;
    expect(sixty).toBeLessThan(twelve);
  });

  it("charges more in total for a longer term, even though the instalment is lower", () => {
    // This is the whole reason the wording is "по-ниска месечна вноска" and
    // never "спестявате": the customer pays substantially more overall.
    expect(quote(UNIT, 60).totalEur).toBeGreaterThan(quote(UNIT, 12).totalEur);
  });

  it("never labels a longer term as a saving", () => {
    for (const q of quoteAllTerms(UNIT)) {
      const label = reductionLabel(q);
      if (label) expect(label).not.toMatch(/спестяв/i);
    }
  });

  it("derives a per-day figure from the monthly rate", () => {
    const q = quote(UNIT, 24);
    expect(q.dailyEur).toBeGreaterThan(0);
    expect(q.dailyEur).toBeLessThan(q.monthlyEur);
  });

  it("reports the cheapest monthly rate for 'from' headlines", () => {
    const all = quoteAllTerms(UNIT).map((q) => q.monthlyEur);
    expect(fromMonthly(UNIT)).toBe(Math.min(...all));
  });

  it("flags itself as placeholder data while real prices are missing", () => {
    expect(quote(UNIT, 36).isPlaceholder).toBe(true);
  });

  it("lists what the rent covers, matching the FAQ wording on service", () => {
    const included = quote(UNIT, 36).included;
    expect(included).toContain("застраховка на машината");
    expect(included).toContain("сервиз при нормална експлоатация");
    // "гаранционно обслужване" would contradict the FAQ, where damage from
    // misuse is the customer's cost.
    expect(included).not.toContain("гаранционно обслужване");
  });
});
