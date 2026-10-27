import { describe, expect, it } from "vitest";
import { leadPhoto, modelBySlug } from "@/content/models";
import type { Model } from "@/content/schema";
import { buildCatalogue, derivedCatalogue } from "@/engine/catalogue";
import { HERO_PICK_SLUGS, audienceLines, heroPicks } from "./hero-picks";

const model = (slug: string): Model => {
  const found = modelBySlug(slug);
  if (!found) throw new Error(`no model ${slug}`);
  return found;
};

describe("hero picks", () => {
  it("names only machines the catalogue holds, each with a frame to show", () => {
    // Named in code, so a renamed slug or a withdrawn photograph would
    // otherwise surface only as a shorter row on the live home page.
    for (const slug of HERO_PICK_SLUGS) {
      const found = modelBySlug(slug);
      expect(found, slug).toBeDefined();
      expect(leadPhoto(found!), slug).not.toBeNull();
    }
  });

  it("names five different machines", () => {
    expect(HERO_PICK_SLUGS).toHaveLength(5);
    expect(new Set(HERO_PICK_SLUGS).size).toBe(HERO_PICK_SLUGS.length);
  });

  it("keeps the combination machine first, because its frame is the page's largest paint", () => {
    expect(HERO_PICK_SLUGS[0]).toBe("necta-brio-up-minisnakky");
  });

  it("shows every pick, in order, when all are published", () => {
    expect(heroPicks(derivedCatalogue()).map((m) => m.slug)).toEqual([
      ...HERO_PICK_SLUGS,
    ]);
  });

  it("drops a pick the client has unpublished rather than linking to a 404", () => {
    const hidden = model("necta-korinto");
    const catalogue = buildCatalogue([
      {
        modelId: hidden.id,
        monthly: {},
        published: false,
        sortOrder: 0,
        updatedAt: "2026-10-27T00:00:00.000Z",
      },
    ]);
    const slugs = heroPicks(catalogue).map((m) => m.slug);
    expect(slugs).not.toContain("necta-korinto");
    expect(slugs).toHaveLength(HERO_PICK_SLUGS.length - 1);
  });
});

describe("audience lines", () => {
  it("are read off the record, not written beside it", () => {
    expect(audienceLines(model("necta-brio-up-minisnakky"))).toEqual({
      venues: "Офис, автосервиз, автомивка",
      fit: "15-70 души · 1-2 смени",
    });
    expect(audienceLines(model("necta-astro"))).toEqual({
      venues: "Производствено предприятие",
      fit: "100-300 души · 2-3 смени",
    });
  });

  it("leave shifts out for a one-shift machine", () => {
    expect(audienceLines(model("necta-korinto")).fit).toBe("5-25 души");
  });

  it("follow the record when it changes", () => {
    const base = model("necta-korinto");
    const moved: Model = {
      ...base,
      recommendation: {
        ...base.recommendation,
        venueTypes: ["gym"],
        minHeadcount: null,
        maxHeadcount: 40,
        shifts: [3],
      },
    };
    expect(audienceLines(moved)).toEqual({
      venues: "Фитнес",
      fit: "до 40 души · 3 смени",
    });
  });

  it("keep the venue line to one line at 320px for every pick", () => {
    // 28 characters is what the widest venue labels fit into a slide's text
    // width at 320px; see VENUE_LINE_MAX.
    for (const slug of HERO_PICK_SLUGS) {
      const { venues } = audienceLines(model(slug));
      expect(venues, slug).not.toBeNull();
      expect(venues!.length, slug).toBeLessThanOrEqual(28);
    }
  });

  it("name at most three venues, in record order", () => {
    const base = model("necta-melodia");
    const many: Model = {
      ...base,
      recommendation: {
        ...base.recommendation,
        venueTypes: ["office", "gym", "school", "hotel", "retail"],
      },
    };
    expect(audienceLines(many).venues).toBe("Офис, фитнес, училище");
  });
});
