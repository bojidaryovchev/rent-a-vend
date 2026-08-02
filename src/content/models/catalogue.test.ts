import { describe, expect, it } from "vitest";
import {
  MODELS,
  catalogueStats,
  constituentsOf,
  hasCompleteSet,
  leadPhoto,
  modelBySlug,
  modelsByCategory,
  ownsItsPhotos,
  photoCoverage,
} from "./index";
import { modelSchema, photoSchema } from "../schema";

describe("catalogue", () => {
  it("holds all 60 agreed models", () => {
    expect(MODELS).toHaveLength(60);
  });

  it("splits into the four agreed categories", () => {
    // The client struck five coffee machines he does not hold (Kalea, Kometa
    // and the three Wittenborgs) and added five SandenVendo. FAS Easy 7000 and
    // 8000 then went too: FAS's Easy line is 5000 and 6000, both of ours had a
    // null specSource, and the series had plainly been extrapolated upward.
    const { byCategory } = catalogueStats();
    expect(byCategory.coffee).toBe(17);
    expect(byCategory.combo).toBe(15);
    expect(byCategory.cold).toBe(4);
    expect(byCategory.snack).toBe(24);
  });

  it("keeps Crane Merchant in snack, not cold drinks", () => {
    // Merchant is an ambient glass-front snack machine; only BevMax is a cold
    // drinks unit. Filing all Crane under cold drinks would hide the Merchants
    // from snack buyers and mislead drinks buyers.
    const merchants = MODELS.filter((m) => m.name.includes("Merchant"));
    expect(merchants).not.toHaveLength(0);
    for (const m of merchants) expect(m.category).toBe("snack");

    const bevmax = MODELS.filter((m) => m.name.includes("BevMax"));
    for (const m of bevmax) expect(m.category).toBe("cold");
  });

  it("has unique slugs", () => {
    const slugs = MODELS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses latin transliterated slugs so shared URLs stay readable", () => {
    for (const m of MODELS) expect(m.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("resolves a model by slug", () => {
    expect(modelBySlug("necta-snakky")?.name).toBe("Necta Snakky");
  });

  it("never invents specifications it could not verify", () => {
    // Every field is nullable by design. Models we could not source render
    // "няма данни" rather than a plausible guess. Kikko is the thinnest record
    // left after the Wittenborg/Kalea/Kometa cut: an interface and a voltage.
    const kikko = modelBySlug("necta-kikko");
    expect(kikko?.spec.weightKg).toBeNull();
    expect(kikko?.spec.heightMm).toBeNull();
    expect(kikko?.spec.numTrays).toBeNull();
  });

  it("takes SandenVendo figures from the manufacturer, not from a dealer", () => {
    // The one line in the catalogue whose maker still publishes. Seven shelves
    // times the selections per shelf must reproduce the published totals, or
    // the max-configuration reading in vendo.ts is wrong.
    for (const [slug, perShelf, total] of [
      ["vendo-g-snack-design-6", 6, 42],
      ["vendo-g-snack-design-8", 8, 56],
      ["vendo-g-snack-design-10", 10, 70],
      ["vendo-g-drink-design-6", 6, 42],
      ["vendo-g-drink-design-9", 9, 63],
    ] as const) {
      const m = modelBySlug(slug);
      expect(m, slug).toBeDefined();
      expect(m!.spec.numTrays).toBe(7);
      expect(m!.spec.numberOfSelections).toBe(total);
      expect(m!.spec.numTrays! * perShelf).toBe(total);
      expect(m!.specSource).toContain("SandenVendo");
    }
  });

  it("carries the legacy name as primary and the current name as clarification", () => {
    // Necta renamed the range, but buyers search the old names and the stock is
    // the old machines.
    const concerto = modelBySlug("necta-concerto");
    expect(concerto?.name).toBe("Necta Concerto");
    expect(concerto?.currentName).toBe("Barista 500");
  });
});

describe("combination machines", () => {
  const combos = modelsByCategory("combo");

  it("all reference two real catalogued machines", () => {
    for (const combo of combos) {
      expect(constituentsOf(combo)).toHaveLength(2);
    }
  });

  it("adds the widths of its two machines", () => {
    const combo = modelBySlug("necta-brio-3-snakky");
    const [left, right] = constituentsOf(combo!);
    expect(combo!.spec.widthMm).toBe(
      (left.spec.widthMm ?? 0) + (right.spec.widthMm ?? 0),
    );
  });

  it("takes the taller of the two heights rather than adding them", () => {
    const combo = modelBySlug("necta-brio-3-snakky");
    const [left, right] = constituentsOf(combo!);
    expect(combo!.spec.heightMm).toBe(
      Math.max(left.spec.heightMm ?? 0, right.spec.heightMm ?? 0),
    );
  });

  it("sums weight and power draw", () => {
    const combo = modelBySlug("necta-brio-3-snakky");
    const [left, right] = constituentsOf(combo!);
    expect(combo!.spec.weightKg).toBe(
      (left.spec.weightKg ?? 0) + (right.spec.weightKg ?? 0),
    );
    expect(combo!.spec.maxPowerW).toBe(
      (left.spec.maxPowerW ?? 0) + (right.spec.maxPowerW ?? 0),
    );
  });
});

describe("photography", () => {
  /** A model as it will look once the warehouse shoot lands. */
  const photographed = (slug: string, views: string[]) =>
    modelSchema.parse({
      id: `test-${slug}`,
      slug,
      name: "Тестова машина",
      manufacturer: "necta",
      category: "snack",
      photos: views.map((view) => ({
        src: `/machines/${slug}/${view}.jpg`,
        alt: `Тестова машина - ${view}`,
        view,
      })),
    });

  it("falls back to the drawing rather than to a stock photograph", () => {
    // The gallery renders MachineImage on an empty list, and the catalogue has
    // to stay shippable while models are still unshot. Combos borrow from their
    // constituents and variants from their base cabinet; everything else that
    // owns no photograph shows the drawing rather than a stand-in.
    for (const m of MODELS.filter(
      (x) => !ownsItsPhotos(x) && !x.comboOf && !x.cabinetOf,
    )) {
      expect(m.photos, m.slug).toEqual([]);
      expect(leadPhoto(m), m.slug).toBeNull();
    }
  });

  it("lends a variant its base model's cabinet, and says whose it is", () => {
    // A FAS 1050 EVO differs from a 1050 by a CO2 circuit behind the panel, so
    // the same frame is the truthful one - provided the page admits it.
    const variants = MODELS.filter((m) => m.cabinetOf && m.photos.length > 0);
    expect(variants.length).toBeGreaterThan(0);

    for (const v of variants) {
      const base = MODELS.find((m) => m.id === v.cabinetOf);
      expect(base, v.slug).toBeDefined();
      // Borrowed, never counted as this machine having been photographed.
      expect(ownsItsPhotos(v), v.slug).toBe(false);
      for (const p of v.photos) {
        expect(p.src.startsWith(`/machines/${base!.slug}/`), v.slug).toBe(true);
        expect(p.credit, v.slug).toContain(base!.name);
        expect(p.alt, v.slug).toContain(v.name);
      }
    }
  });

  it("never lends a cabinet to a variant whose front differs", () => {
    // Touch models have a screen where the base has buttons. Borrowing there
    // would put the wrong interface on the page.
    for (const m of MODELS.filter((x) => x.cabinetOf)) {
      expect(m.name, m.slug).not.toContain("Touch");
    }
  });

  it("opens on the front view rather than whichever file sorted first", () => {
    const model = photographed("test-front", ["interior", "side", "front"]);
    expect(leadPhoto(model)?.view).toBe("front");
  });

  it("counts a set complete only with all four agreed views", () => {
    expect(hasCompleteSet(photographed("test-partial", ["front", "side"]))).toBe(
      false,
    );
    expect(
      hasCompleteSet(
        photographed("test-full", ["front", "side", "interior", "payment"]),
      ),
    ).toBe(true);
  });

  it("rejects a photo filed under another machine's folder", () => {
    // The quiet failure: the right price beside the wrong machine.
    expect(() =>
      photoSchema.parse({
        src: "/machines/necta-snakky/../necta-kikko/front.jpg",
        alt: "Грешна папка",
        view: "front",
      }),
    ).toThrow();
  });

  it("refuses a photo with no alt text", () => {
    expect(() =>
      photoSchema.parse({ src: "/machines/a/front.jpg", alt: "", view: "front" }),
    ).toThrow();
  });

  it("never shows a combination machine as only one of its two halves", () => {
    // The failure this prevents: Concerto Touch + Melodia led by a photograph
    // of the Melodia snack machine alone, on a page selling a coffee pair.
    for (const combo of modelsByCategory("combo")) {
      if (combo.photos.length === 0) continue;
      if (ownsItsPhotos(combo)) continue;
      const [left, right] = constituentsOf(combo);
      expect(combo.photos.length, combo.slug).toBeGreaterThanOrEqual(2);
      for (const half of [left, right]) {
        expect(
          combo.photos.some((p) =>
            p.src.startsWith(`/machines/${half.slug}/`),
          ),
          `${combo.slug} is missing ${half.slug}`,
        ).toBe(true);
      }
    }
  });

  it("lets a combination machine borrow its constituents' frames", () => {
    // A combo is two catalogued machines side by side, so until the pair is
    // photographed its frames legitimately come from elsewhere - but only from
    // its own two constituents.
    for (const combo of modelsByCategory("combo")) {
      if (combo.photos.length === 0) continue;
      const allowed = [combo, ...constituentsOf(combo)].map(
        (m) => `/machines/${m.slug}/`,
      );
      for (const photo of combo.photos) {
        expect(allowed.some((prefix) => photo.src.startsWith(prefix))).toBe(true);
      }
    }
  });

  it("does not count borrowed frames as the combo being shot", () => {
    const coverage = photoCoverage();
    expect(coverage.total).toBe(MODELS.length);
    expect(coverage.withAny).toBe(MODELS.filter(ownsItsPhotos).length);
    expect(coverage.withCompleteSet).toBeLessThanOrEqual(coverage.withAny);
    expect(catalogueStats().photos).toEqual(coverage);
  });
});

describe("specification sanity", () => {
  it("never claims a door opens to less than the closed depth", () => {
    for (const m of MODELS) {
      const { depthMm, depthOpenMm } = m.spec;
      if (depthMm !== null && depthOpenMm !== null) {
        expect(depthOpenMm).toBeGreaterThan(depthMm);
      }
    }
  });

  it("never repeats the FAS data error of door-open depth equalling height", () => {
    for (const m of MODELS) {
      const { heightMm, depthOpenMm } = m.spec;
      if (heightMm !== null && depthOpenMm !== null) {
        expect(depthOpenMm).not.toBe(heightMm);
      }
    }
  });
});
