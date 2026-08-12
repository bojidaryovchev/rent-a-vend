import { describe, expect, it } from "vitest";
import { MODELS } from "@/content/models";
import { buildCatalogue, derivedCatalogue } from "./catalogue";
import { quote, quoteAllTerms, fromMonthly, reductionLabel } from "./quote";
import { TERMS } from "./rates";

/**
 * A real catalogue id, not a made-up one.
 *
 * The suite used to price "test-unit", which every lookup missed and every
 * fallback caught - so it exercised the same default path five different ways
 * and would have passed against a derivation that ignored the machine entirely.
 */
const MODEL = MODELS[0].id;

const derived = derivedCatalogue();

/** A catalogue with one machine really priced, for the tests that need to tell
 *  a client's number from a derived one. */
const priced = buildCatalogue([
  {
    modelId: MODEL,
    monthly: { "12": 100, "24": 90, "36": 85, "48": 80, "60": 75 },
    published: true,
    sortOrder: 0,
    updatedAt: "2026-08-12T00:00:00.000Z",
  },
]);

describe("quote", () => {
  it("returns a quote for every contract term", () => {
    expect(quoteAllTerms(derived, MODEL).map((q) => q.term)).toEqual([...TERMS]);
  });

  it("total is the monthly rate across the whole term", () => {
    for (const q of quoteAllTerms(derived, MODEL)) {
      expect(q.totalEur).toBe(q.monthlyEur * q.term);
    }
  });

  it("treats 12 months as the baseline with no reduction", () => {
    expect(quote(derived, MODEL, 12).monthlyReductionPct).toBe(0);
  });

  it("prices longer terms at a lower monthly instalment", () => {
    const twelve = quote(derived, MODEL, 12).monthlyEur;
    const sixty = quote(derived, MODEL, 60).monthlyEur;
    expect(sixty).toBeLessThan(twelve);
  });

  it("charges more in total for a longer term, even though the instalment is lower", () => {
    // This is the whole reason the wording is "по-ниска месечна вноска" and
    // never "спестявате": the customer pays substantially more overall.
    expect(quote(derived, MODEL, 60).totalEur).toBeGreaterThan(
      quote(derived, MODEL, 12).totalEur,
    );
  });

  it("never labels a longer term as a saving", () => {
    for (const q of quoteAllTerms(derived, MODEL)) {
      const label = reductionLabel(q);
      if (label) expect(label).not.toMatch(/спестяв/i);
    }
  });

  it("derives a per-day figure from the monthly rate", () => {
    const q = quote(derived, MODEL, 24);
    expect(q.dailyEur).toBeGreaterThan(0);
    expect(q.dailyEur).toBeLessThan(q.monthlyEur);
  });

  it("reports the cheapest monthly rate for 'from' headlines", () => {
    const all = quoteAllTerms(derived, MODEL).map((q) => q.monthlyEur);
    expect(fromMonthly(derived, MODEL)).toBe(Math.min(...all));
  });

  it("lists what the rent covers, matching the FAQ wording on service", () => {
    const included = quote(derived, MODEL, 36).included;
    expect(included).toContain("застраховка на машината");
    expect(included).toContain("сервиз при нормална експлоатация");
    // "гаранционно обслужване" would contradict the FAQ, where damage from
    // misuse is the customer's cost.
    expect(included).not.toContain("гаранционно обслужване");
  });
});

describe("real prices versus the placeholder", () => {
  it("flags an unpriced machine as placeholder data", () => {
    expect(quote(derived, MODEL, 36).isPlaceholder).toBe(true);
  });

  it("uses the client's figure, and stops calling it a placeholder", () => {
    const q = quote(priced, MODEL, 36);
    expect(q.monthlyEur).toBe(85);
    expect(q.isPlaceholder).toBe(false);
  });

  it("falls back per term, not per machine", () => {
    /* The point of nullable columns: a machine priced on 12 and 24 months only
       must still quote the other three rather than refusing to render. */
    const partial = buildCatalogue([
      {
        modelId: MODEL,
        monthly: { "12": 100, "24": 90 },
        published: true,
        sortOrder: 0,
        updatedAt: "2026-08-12T00:00:00.000Z",
      },
    ]);

    expect(quote(partial, MODEL, 12).isPlaceholder).toBe(false);
    expect(quote(partial, MODEL, 60).isPlaceholder).toBe(true);
    expect(quote(partial, MODEL, 60).monthlyEur).toBeGreaterThan(0);
  });

  it("computes the reduction from the client's own baseline", () => {
    // 75 against a 100 baseline is a 25% lower instalment.
    expect(quote(priced, MODEL, 60).monthlyReductionPct).toBe(25);
  });

  it("never reports a negative reduction, however the row was written", () => {
    /* Not reachable through the admin form, which refuses to save a rising
       curve - but reachable by editing the database by hand, and "С -20%
       по-ниска месечна вноска" must not be a sentence this site can print. */
    const inverted = buildCatalogue([
      {
        modelId: MODEL,
        monthly: { "12": 100, "60": 120 },
        published: true,
        sortOrder: 0,
        updatedAt: "2026-08-12T00:00:00.000Z",
      },
    ]);

    const q = quote(inverted, MODEL, 60);
    expect(q.monthlyReductionPct).toBe(0);
    expect(reductionLabel(q)).toBeNull();
  });
});
