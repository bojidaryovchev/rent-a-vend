import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { leadPhoto, modelBySlug } from "@/content/models";
import type { Model } from "@/content/schema";
import {
  buildCatalogue,
  derivedCatalogue,
  type ModelSettingsRecord,
} from "@/engine/catalogue";
import { fromMonthly } from "@/engine/quote";
import { HeroPicks } from "@/components/catalogue/hero-picks";
import {
  HERO_PICK_SLUGS,
  audienceLines,
  featuredStrip,
  heroPicks,
} from "./hero-picks";

const model = (slug: string): Model => {
  const found = modelBySlug(slug);
  if (!found) throw new Error(`no model ${slug}`);
  return found;
};

/** A settings row as the admin writes it: an owner price on every term. */
const row = (
  slug: string,
  over: Partial<ModelSettingsRecord> = {},
): ModelSettingsRecord => ({
  modelId: model(slug).id,
  monthly: { "12": 120, "24": 110, "36": 100, "48": 95, "60": 90 },
  published: true,
  sortOrder: 0,
  updatedAt: "2026-10-27T00:00:00.000Z",
  ...over,
});

/** Every pick priced by the owner, as on the live site today. */
const pricedPicks = (over: Record<string, Partial<ModelSettingsRecord>> = {}) =>
  buildCatalogue(HERO_PICK_SLUGS.map((slug) => row(slug, over[slug])));

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

  it("shows every pick, in order, when all are published and priced", () => {
    expect(heroPicks(pricedPicks()).map((m) => m.slug)).toEqual([
      ...HERO_PICK_SLUGS,
    ]);
  });

  it("drops a pick the client has unpublished rather than linking to a 404", () => {
    const slugs = heroPicks(
      pricedPicks({ "necta-melodia": { published: false } }),
    ).map((m) => m.slug);
    expect(slugs).not.toContain("necta-melodia");
    expect(slugs).toHaveLength(HERO_PICK_SLUGS.length - 1);
  });

  it("drops a pick whose price the owner has not set, rather than recommend a derived one", () => {
    const catalogue = pricedPicks({ "necta-brio-up": { monthly: {} } });
    expect(catalogue.fromRate(model("necta-brio-up").id).isPlaceholder).toBe(true);
    expect(heroPicks(catalogue).map((m) => m.slug)).toEqual(
      HERO_PICK_SLUGS.filter((slug) => slug !== "necta-brio-up"),
    );
  });

  it("shows none when no price is the owner's - the drawing, not five derived figures", () => {
    expect(heroPicks(derivedCatalogue())).toEqual([]);
  });
});

describe("the cheapest-four strip", () => {
  it("leaves out the hero's machines and still shows four", () => {
    const catalogue = derivedCatalogue();
    const cheapest = featuredStrip(catalogue, []);
    // Recommend the cheapest machine in the hero, and the strip moves past it.
    const strip = featuredStrip(catalogue, [cheapest[0]]);
    expect(strip).toHaveLength(4);
    expect(strip.map((m) => m.id)).not.toContain(cheapest[0].id);
    expect(strip.slice(0, 3)).toEqual(cheapest.slice(1, 4));
  });

  it("never repeats a card the hero shows", () => {
    const catalogue = pricedPicks();
    const picks = heroPicks(catalogue);
    const ids = new Set(picks.map((m) => m.id));
    expect(featuredStrip(catalogue, picks).some((m) => ids.has(m.id))).toBe(false);
  });

  it("stays in price order", () => {
    const catalogue = derivedCatalogue();
    const prices = featuredStrip(catalogue, []).map((m) =>
      fromMonthly(catalogue, m.id),
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe("the hero row, rendered", () => {
  const render = (picks: Model[]) =>
    renderToStaticMarkup(
      createElement(HeroPicks, { picks, catalogue: pricedPicks() }),
    );

  it("falls back to the drawing when no pick can be shown", () => {
    const html = render([]);
    expect(html).toContain('role="img"');
    expect(html).toContain("заместващо изображение");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('aria-roledescription="carousel"');
  });

  it("is a plain card, with no carousel chrome, when one pick is left", () => {
    const html = render([model("necta-astro")]);
    expect(html.match(/<h3/g)).toHaveLength(1);
    expect(html).toContain('href="/kafe-mashini-pod-naem/necta-astro"');
    expect(html).not.toContain('aria-roledescription="carousel"');
    expect(html).not.toContain("<button");
  });

  it("is a carousel of slides, numbered, from two picks up", () => {
    const html = render(heroPicks(pricedPicks()));
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html.match(/aria-roledescription="slide"/g)).toHaveLength(5);
    expect(html).toContain('aria-label="5 от 5"');
    expect(html.match(/<button/g)).toHaveLength(2);
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
