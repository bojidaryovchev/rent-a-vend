import { describe, expect, it } from "vitest";
import { MODELS } from "@/content/models";
import { buildCatalogue, derivedCatalogue } from "./catalogue";
import { deriveTerms, termsAreMonotonic, TERMS } from "./terms";

const record = (
  modelId: string,
  over: Partial<{
    monthly: Record<string, number>;
    published: boolean;
    sortOrder: number;
  }> = {},
) => ({
  modelId,
  monthly: over.monthly ?? {},
  published: over.published ?? true,
  sortOrder: over.sortOrder ?? 0,
  updatedAt: "2026-08-12T00:00:00.000Z",
});

describe("an unconfigured catalogue", () => {
  it("publishes everything, so a site with no database is the site we had", () => {
    const catalogue = derivedCatalogue();
    expect(catalogue.models).toHaveLength(MODELS.length);
    expect(catalogue.models.map((m) => m.id)).toEqual(MODELS.map((m) => m.id));
  });

  it("counts every machine as unpriced", () => {
    expect(derivedCatalogue().unpriced()).toHaveLength(MODELS.length);
  });

  it("still produces a spread of prices rather than one flat rate", () => {
    /* The reason the derivation exists at all: a single figure across the
       catalogue reproduced exactly the impression the site is built to break. */
    const catalogue = derivedCatalogue();
    const prices = new Set(MODELS.map((m) => catalogue.fromRate(m.id).monthlyEur));
    expect(prices.size).toBeGreaterThan(5);
  });
});

describe("visibility", () => {
  it("hides an unpublished machine from the site view but not from the admin", () => {
    const hidden = MODELS[0];
    const catalogue = buildCatalogue([record(hidden.id, { published: false })]);

    expect(catalogue.isPublished(hidden.id)).toBe(false);
    expect(catalogue.models.map((m) => m.id)).not.toContain(hidden.id);
    expect(catalogue.all.map((m) => m.id)).toContain(hidden.id);
    expect(catalogue.byCategory(hidden.category).map((m) => m.id)).not.toContain(
      hidden.id,
    );
  });

  it("treats a machine with no row as published", () => {
    expect(derivedCatalogue().isPublished(MODELS[0].id)).toBe(true);
  });
});

describe("ordering", () => {
  it("keeps catalogue order while every position is still the default", () => {
    const catalogue = buildCatalogue(MODELS.map((m) => record(m.id)));
    expect(catalogue.models.map((m) => m.id)).toEqual(MODELS.map((m) => m.id));
  });

  it("lifts a machine to the front of its category when given a lower position", () => {
    const category = MODELS[0].category;
    const peers = MODELS.filter((m) => m.category === category);
    const last = peers[peers.length - 1];

    const catalogue = buildCatalogue([record(last.id, { sortOrder: -1 })]);
    expect(catalogue.byCategory(category)[0].id).toBe(last.id);
  });
});

describe("the term curve", () => {
  it("suggests a curve that never rises with the term", () => {
    const suggested = deriveTerms(120);
    expect(termsAreMonotonic(suggested)).toBe(true);
    expect(suggested[60]).toBeLessThan(suggested[12]);
  });

  it("rounds every suggestion to a figure a price list would print", () => {
    for (const value of Object.values(deriveTerms(137))) {
      expect(value % 5).toBe(0);
    }
  });

  it("accepts a partly filled curve, judging only what was entered", () => {
    expect(termsAreMonotonic({ 12: 100, 60: 80 })).toBe(true);
    expect(termsAreMonotonic({ 12: 100, 60: 120 })).toBe(false);
    expect(termsAreMonotonic({})).toBe(true);
  });

  it("accepts a flat curve - no discount is a legitimate price list", () => {
    expect(
      termsAreMonotonic(Object.fromEntries(TERMS.map((t) => [t, 100]))),
    ).toBe(true);
  });
});
