import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { buildCatalogue } from "@/engine/catalogue";
import { getModelSettingsStore, parsePrice } from "./model-settings-store";

/**
 * The development file store, round-tripped.
 *
 * Covered because it is the store the whole flow runs against with no
 * DATABASE_URL - which is every local run and every preview a reviewer clicks
 * through. The Postgres implementation is the same four methods against the same
 * interface; what is worth testing without a database is that a save survives a
 * read, that clearing a term really clears it, and that the price parser refuses
 * the two inputs that would put a wrong number in front of a customer.
 */

const FILE = join(process.cwd(), ".data", "model-settings.json");
const store = getModelSettingsStore();

afterEach(async () => {
  await rm(FILE, { force: true });
});

describe("the file store", () => {
  it("is the store chosen when there is no database", () => {
    expect(store.kind).toBe("file");
  });

  it("round-trips a saved machine", async () => {
    await store.save("astro", {
      monthly: { 12: 100, 24: 90, 36: 85, 48: 80, 60: 75 },
      published: true,
      sortOrder: 3,
    });

    const [record] = await store.list();
    expect(record.modelId).toBe("astro");
    expect(record.monthly).toEqual({
      "12": 100,
      "24": 90,
      "36": 85,
      "48": 80,
      "60": 75,
    });
    expect(record.sortOrder).toBe(3);

    /* The point of the round trip: what the site reads back is a real price. */
    const catalogue = buildCatalogue(await store.list());
    expect(catalogue.rate("astro", 36)).toEqual({
      term: 36,
      monthlyEur: 85,
      isPlaceholder: false,
    });
  });

  it("clears a term that was saved empty rather than keeping the old figure", async () => {
    await store.save("astro", {
      monthly: { 12: 100, 60: 75 },
      published: true,
      sortOrder: 0,
    });
    await store.save("astro", {
      monthly: { 12: 100, 60: null },
      published: true,
      sortOrder: 0,
    });

    const catalogue = buildCatalogue(await store.list());
    expect(catalogue.rate("astro", 12).isPlaceholder).toBe(false);
    expect(catalogue.rate("astro", 60).isPlaceholder).toBe(true);
  });

  it("replaces a machine's row instead of appending a second one", async () => {
    await store.save("astro", { monthly: { 12: 100 }, published: true, sortOrder: 0 });
    await store.save("astro", { monthly: { 12: 110 }, published: false, sortOrder: 1 });

    const rows = await store.list();
    expect(rows).toHaveLength(1);
    expect(rows[0].published).toBe(false);
    expect(buildCatalogue(rows).rate("astro", 12).monthlyEur).toBe(110);
  });

  it("returns a machine to the derived placeholder when removed", async () => {
    await store.save("astro", { monthly: { 12: 100 }, published: false, sortOrder: 0 });
    await store.remove("astro");

    const catalogue = buildCatalogue(await store.list());
    expect(await store.list()).toHaveLength(0);
    expect(catalogue.rate("astro", 12).isPlaceholder).toBe(true);
    expect(catalogue.isPublished("astro")).toBe(true);
  });
});

describe("parsing a typed price", () => {
  it("reads an empty field as 'unprice this term'", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("   ")).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });

  it("accepts a decimal comma, which is what a Bulgarian keyboard produces", () => {
    expect(parsePrice("87,5")).toBe(88);
  });

  it("refuses zero, which would publish 'от 0 €/месец'", () => {
    expect(() => parsePrice("0")).toThrow();
  });

  it("refuses a figure past the upper bound, which catches a stray zero", () => {
    expect(() => parsePrice("950000")).toThrow();
  });

  it("refuses text", () => {
    expect(() => parsePrice("сто")).toThrow();
  });
});
