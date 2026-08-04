import { describe, expect, it } from "vitest";
import {
  MODELS,
  catalogueStats,
  coffeeUnitOf,
  hasCompleteSet,
  leadPhoto,
  modelBySlug,
  modelsByCategory,
  ownsItsPhotos,
  photoCoverage,
} from "./index";
import { MINI_SNAKKY } from "./combos";
import { modelSchema, photoSchema } from "../schema";

describe("catalogue", () => {
  it("holds all 48 agreed models", () => {
    expect(MODELS).toHaveLength(48);
  });

  it("splits into the four agreed categories", () => {
    // The client struck five coffee machines he does not hold (Kalea, Kometa
    // and the three Wittenborgs) and added five SandenVendo. FAS Easy 7000 and
    // 8000 then went too: FAS's Easy line is 5000 and 6000, both of ours had a
    // null specSource, and the series had plainly been extrapolated upward.
    //
    // Twelve of the fifteen combinations went last. They described pairs of
    // full-size cabinets standing side by side; the client supplies one
    // combination machine - a Brio on a Mini Snakky base - in three trims.
    const { byCategory } = catalogueStats();
    expect(byCategory.coffee).toBe(17);
    expect(byCategory.combo).toBe(3);
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
  const base = MINI_SNAKKY.spec;

  it("is a coffee machine on a snack base, never two machines side by side", () => {
    // The catalogue used to hold fifteen pairs of full-size cabinets standing
    // next to each other. That is a different product, and not one the client
    // supplies: what he lets out is a Brio bolted onto a Mini Snakky.
    expect(combos).toHaveLength(3);
    for (const combo of combos) {
      const coffee = coffeeUnitOf(combo);
      expect(coffee, combo.slug).not.toBeNull();
      expect(coffee!.category, combo.slug).toBe("coffee");
      expect(combo.name, combo.slug).toContain("Mini Snakky");
    }
  });

  it("stacks the heights rather than adding the widths", () => {
    // The whole difference between one machine and two. A Brio is 540mm wide
    // and 750mm tall; on a 580x1080 base the result is 580 wide and 1830 tall,
    // not 1120 wide.
    const combo = modelBySlug("necta-brio-3-minisnakky");
    const coffee = coffeeUnitOf(combo!)!;

    expect(combo!.spec.heightMm).toBe(
      (coffee.spec.heightMm ?? 0) + (base.heightMm ?? 0),
    );
    expect(combo!.spec.widthMm).toBe(
      Math.max(coffee.spec.widthMm ?? 0, base.widthMm ?? 0),
    );
    expect(combo!.spec.depthMm).toBe(
      Math.max(coffee.spec.depthMm ?? 0, base.depthMm ?? 0),
    );
  });

  it("sums weight and power draw", () => {
    const combo = modelBySlug("necta-brio-3-minisnakky");
    const coffee = coffeeUnitOf(combo!)!;
    expect(combo!.spec.weightKg).toBe(
      (coffee.spec.weightKg ?? 0) + (base.weightKg ?? 0),
    );
    expect(combo!.spec.maxPowerW).toBe(
      (coffee.spec.maxPowerW ?? 0) + (base.maxPowerW ?? 0),
    );
  });

  it("takes capacity and trays from the snack base alone", () => {
    // Cups and packets are different units. Adding a coffee machine's drink
    // count to a snack cabinet's product count produces a number that means
    // nothing, printed under the word "капацитет".
    for (const combo of combos) {
      expect(combo.spec.productCapacity, combo.slug).toBe(base.productCapacity);
      expect(combo.spec.numTrays, combo.slug).toBe(base.numTrays);
    }
  });

  it("is sized for the small site it actually fits", () => {
    // Four trays of stock. A combo offered to a 300-person plant is not the
    // compact answer, it is the wrong one - and the recommender gates on this.
    for (const combo of combos) {
      expect(combo.recommendation.maxHeadcount, combo.slug).toBeLessThanOrEqual(70);
    }
  });

  it("is photographed assembled, as it is delivered", () => {
    for (const combo of combos) {
      expect(ownsItsPhotos(combo), combo.slug).toBe(true);
      expect(leadPhoto(combo)?.view, combo.slug).toBe("front");
    }
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
    // to stay shippable while models are still unshot. A variant may borrow its
    // base cabinet; everything else that owns no photograph shows the drawing
    // rather than a stand-in.
    for (const m of MODELS.filter((x) => !ownsItsPhotos(x) && !x.cabinetOf)) {
      expect(m.photos, m.slug).toEqual([]);
      expect(leadPhoto(m), m.slug).toBeNull();
    }
  });

  it("lends a variant its base model's cabinet, and says whose it is", () => {
    // A FAS 1050 EVO differs from a 1050 by a CO2 circuit behind the panel, so
    // the same frame is the truthful one - provided the page admits it. Only
    // applies where the variant has not been shot in its own right: Samba Top
    // shares Samba's cabinet and still has its own frame.
    const variants = MODELS.filter(
      (m) => m.cabinetOf && m.photos.length > 0 && !ownsItsPhotos(m),
    );
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

  it("never shows a combination machine as one of its halves", () => {
    // The failure this prevents: a combo page led by a photograph of the coffee
    // machine on its own, selling a cabinet the buyer is not getting. A combo
    // is delivered assembled and has to be shown assembled, under its own slug.
    for (const combo of modelsByCategory("combo")) {
      expect(combo.photos.length, combo.slug).toBeGreaterThan(0);
      for (const photo of combo.photos) {
        expect(
          photo.src.startsWith(`/machines/${combo.slug}/`),
          `${combo.slug} borrows ${photo.src}`,
        ).toBe(true);
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
