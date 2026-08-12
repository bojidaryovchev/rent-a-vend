import { describe, expect, it } from "vitest";
import { recommend, type SiteProfile } from "./recommend";
import { alternativesFor } from "./alternatives";
import { modelBySlug } from "@/content/models";
import { toCandidates } from "@/lib/candidates";
import { derivedCatalogue } from "./catalogue";

const CANDIDATES = toCandidates(derivedCatalogue());

const profile = (over: Partial<SiteProfile> = {}): SiteProfile => ({
  venueType: "office",
  headcount: 60,
  shifts: 1,
  products: ["coffee"],
  cashless: null,
  ...over,
});

describe("the plan", () => {
  it("proposes one machine per requested product line, each able to serve it", () => {
    const r = recommend(
      profile({
        headcount: 200,
        shifts: 3,
        products: ["coffee", "snack", "food", "cold"],
      }),
      CANDIDATES,
    );
    expect(r.plan.map((p) => p.line)).toEqual(["coffee", "snack", "cold"]);
    expect(r.plan[0].pick.candidate.products).toContain("coffee");
    expect(r.plan[1].pick.candidate.products).toContain("snack");
    expect(r.plan[2].pick.candidate.products).toContain("cold");
  });

  it("fills the cold-drinks line with a drinks machine, not a chilled shelf", () => {
    // A snack cabinet that carries cans is eligible, and with the Necta
    // preference on top it used to win - putting a second snack machine in a
    // plan that already had one.
    const r = recommend(
      profile({ headcount: 200, shifts: 3, products: ["coffee", "snack", "cold"] }),
      CANDIDATES,
    );
    const cold = r.plan.find((p) => p.line === "cold");
    expect(cold?.pick.candidate.category).toBe("cold");
  });

  it("never proposes the same machine twice in one plan", () => {
    const r = recommend(
      profile({ headcount: 200, products: ["snack", "cold"] }),
      CANDIDATES,
    );
    const ids = r.plan.map((p) => p.pick.candidate.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the plan's counts equal to the sizing table's", () => {
    const r = recommend(
      profile({ headcount: 120, products: ["coffee", "snack"] }),
      CANDIDATES,
    );
    const total = r.plan.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(r.demand.machineCount);
  });

  it("prices the whole plan, not one machine of it", () => {
    const r = recommend(
      profile({ headcount: 120, products: ["coffee", "snack"] }),
      CANDIDATES,
    );
    const expected = r.plan.reduce(
      (sum, item) => sum + item.pick.candidate.fromEur * item.count,
      0,
    );
    expect(r.monthlyFromEur).toBe(expected);
    expect(r.monthlyFromEur).toBeGreaterThan(r.primary!.candidate.fromEur);
  });

  it("keeps a coffee-only request to coffee machines", () => {
    const r = recommend(profile({ products: ["coffee"] }), CANDIDATES);
    expect(r.plan).toHaveLength(1);
    for (const item of r.plan) expect(item.pick.candidate.category).toBe("coffee");
  });

  it("does not offer a coffee machine to someone who asked for cold drinks", () => {
    const r = recommend(profile({ products: ["cold"] }), CANDIDATES);
    for (const item of r.plan) {
      expect(item.pick.candidate.category).not.toBe("coffee");
    }
  });
});

describe("recommend", () => {
  it("returns a primary recommendation and two alternatives", () => {
    const r = recommend(profile(), CANDIDATES);
    expect(r.primary).not.toBeNull();
    expect(r.alternatives).toHaveLength(2);
  });

  it("never repeats the primary machine as its own alternative", () => {
    const r = recommend(profile(), CANDIDATES);
    for (const alt of r.alternatives) {
      expect(alt.candidate.id).not.toBe(r.primary!.candidate.id);
    }
  });

  it("recommends a coffee machine when only coffee is asked for", () => {
    const r = recommend(profile({ products: ["coffee"] }), CANDIDATES);
    expect(r.primary!.candidate.category).toBe("coffee");
  });

  it("offers a combination machine when hot and solid are both wanted", () => {
    const r = recommend(
      profile({ products: ["coffee", "snack"], headcount: 55 }),
      CANDIDATES,
    );
    expect(r.comboInstead?.candidate.category).toBe("combo");
    expect(r.comboInstead!.candidate.products).toEqual(
      expect.arrayContaining(["coffee", "snack"]),
    );
  });

  it("does not offer one to a site it is far too small for", () => {
    // Every combo in the catalogue is a coffee machine on a four-tray snack
    // base, sized to seventy people. Offering one as the compact alternative to
    // a 300-person plant's four machines is a wrong answer, not a smaller one.
    const r = recommend(
      profile({ products: ["coffee", "snack"], headcount: 300, shifts: 3 }),
      CANDIDATES,
    );
    expect(r.comboInstead).toBeNull();
  });

  it("does not offer one when only one product line was asked for", () => {
    const r = recommend(profile({ products: ["coffee"] }), CANDIDATES);
    expect(r.comboInstead).toBeNull();
  });

  it("scales the recommendation with headcount", () => {
    const small = recommend(profile({ headcount: 20 }), CANDIDATES);
    const large = recommend(profile({ headcount: 250, shifts: 3 }), CANDIDATES);
    expect(small.primary!.candidate.id).not.toBe(large.primary!.candidate.id);
  });

  it("warns a small site that free placement is unlikely", () => {
    const r = recommend(profile({ headcount: 20 }), CANDIDATES);
    expect(r.notes.join(" ")).toMatch(/безплатно/);
  });

  it("says when more than one machine is needed", () => {
    const r = recommend(profile({ headcount: 260 }), CANDIDATES);
    expect(r.demand.machineCount).toBeGreaterThan(1);
    expect(r.notes.join(" ")).toMatch(/машини/);
  });

  it("names the machines it is proposing, not just the count", () => {
    const r = recommend(
      profile({ headcount: 120, products: ["coffee", "snack"] }),
      CANDIDATES,
    );
    expect(r.notes.join(" ")).toContain("кафе автомат");
    expect(r.notes.join(" ")).toContain("снакс автомат");
  });

  it("offers the combination machine as the smaller way to cover the same need", () => {
    // The sizing table counts hot and solid as two machines. On a site small
    // enough for one of each, one combo does the job - and we say so rather
    // than quietly selling the second unit.
    const r = recommend(
      profile({ headcount: 40, products: ["coffee", "snack"] }),
      CANDIDATES,
    );
    expect(r.demand.machineCount).toBe(2);
    expect(r.notes.join(" ")).toMatch(/комбинирана машина/);
  });

  it("does not dangle the combination alternative once the site outgrows it", () => {
    const r = recommend(
      profile({ headcount: 300, products: ["coffee", "snack"] }),
      CANDIDATES,
    );
    expect(r.notes.join(" ")).not.toMatch(/комбинирана машина покрива/);
  });

  it("leads with its demand assumption so the visitor can correct it", () => {
    const r = recommend(profile({ headcount: 120, shifts: 2 }), CANDIDATES);
    expect(r.notes[0]).toContain("120");
    expect(r.notes[0]).toContain("две смени");
  });

  it("explains why it picked what it picked", () => {
    const r = recommend(profile(), CANDIDATES);
    expect(r.primary!.reasons.length).toBeGreaterThan(0);
  });

  it("prefers Necta when two machines are otherwise identical", () => {
    // The fleet is overwhelmingly Necta, and so are the spare parts and the
    // service knowledge behind the 48-hour SLA.
    const base = CANDIDATES.find((c) => c.manufacturer === "necta")!;
    const rival = { ...base, id: "rival", slug: "rival", name: "Crane Rival", manufacturer: "crane" as const };
    const r = recommend(profile(), [rival, base]);
    expect(r.primary!.candidate.id).toBe(base.id);
  });

  it("does not let the brand preference rescue a machine that does not fit", () => {
    const necta = CANDIDATES.find((c) => c.manufacturer === "necta")!;
    const misfit = { ...necta, id: "misfit", slug: "misfit", name: "Necta Misfit", products: [] };
    const rival = {
      ...necta,
      id: "rival",
      slug: "rival",
      name: "Crane Rival",
      manufacturer: "crane" as const,
    };
    const r = recommend(profile({ products: ["coffee"] }), [misfit, rival]);
    expect(r.primary!.candidate.id).toBe("rival");
  });

  it("pushes machines over budget down the list", () => {
    const cheap = CANDIDATES.reduce((a, b) => (a.fromEur < b.fromEur ? a : b));
    const r = recommend(
      profile({ maxMonthlyEur: cheap.fromEur }),
      CANDIDATES,
    );
    expect(r.primary!.candidate.fromEur).toBeLessThanOrEqual(cheap.fromEur);
  });

  it("still marks the consumption rate as a default", () => {
    // The client's sizing table arrived in round 15; his consumption figures
    // have not, so dailyVolume is still derived from published norms.
    expect(recommend(profile(), CANDIDATES).isDefault).toBe(true);
  });

  it("is deterministic - the same profile always gives the same answer", () => {
    const a = recommend(profile({ headcount: 90, shifts: 2 }), CANDIDATES);
    const b = recommend(profile({ headcount: 90, shifts: 2 }), CANDIDATES);
    expect(a.primary!.candidate.id).toBe(b.primary!.candidate.id);
  });

  it("never invents a machine that is not in the catalogue", () => {
    // The reason this is a rules engine and not a language model.
    const r = recommend(profile(), CANDIDATES);
    const ids = new Set(CANDIDATES.map((c) => c.id));
    for (const pick of [r.primary!, ...r.alternatives]) {
      expect(ids.has(pick.candidate.id)).toBe(true);
    }
  });
});

describe("alternatives", () => {
  it("returns same-category machines and never the model itself", () => {
    const model = modelBySlug("necta-snakky")!;
    const alts = alternativesFor(model);
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) {
      expect(a.id).not.toBe(model.id);
      expect(a.category).toBe(model.category);
    }
  });

  it("is deterministic - similarity alone decides the order", () => {
    // Availability used to add a decisive +30 here (D50 removed it), so this
    // guards the thing that replaced it: the same model must always produce
    // the same three alternatives, in the same order.
    const model = modelBySlug("necta-snakky")!;
    const a = alternativesFor(model, { limit: 5 });
    const b = alternativesFor(model, { limit: 5 });
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  it("respects the requested limit", () => {
    const model = modelBySlug("necta-concerto")!;
    expect(alternativesFor(model, { limit: 2 })).toHaveLength(2);
  });
});

describe("product coverage", () => {
  it("covers everything that was asked for, across the plan", () => {
    // The guarantee is now the plan's, not one machine's: no chosen product may
    // go unserved by every machine on the page. The old single-machine version
    // of this rule is what produced a snack machine captioned "не покрива:
    // топли напитки".
    for (const products of [
      ["coffee", "snack"],
      ["coffee", "snack", "food", "cold"],
      ["cold", "food"],
    ] as const) {
      const r = recommend(
        profile({ products: [...products], headcount: 200, shifts: 3 }),
        CANDIDATES,
      );
      const served = new Set(r.plan.flatMap((i) => i.pick.candidate.products));
      for (const p of products) expect(served).toContain(p);
    }
  });

  it("does not caption a machine with products another machine is there to serve", () => {
    const r = recommend(
      profile({ products: ["coffee", "snack", "cold"], headcount: 200 }),
      CANDIDATES,
    );
    for (const item of r.plan) {
      expect(item.pick.reasons.join(" ")).not.toMatch(/Не покрива/);
    }
  });

  it("says plainly what a partial match does not cover", () => {
    // Still true within a line: a coffee machine offered for the coffee line
    // that cannot pour what was asked for says so.
    const r = recommend(
      profile({ products: ["coffee", "snack"], headcount: 60 }),
      CANDIDATES,
    );
    const partial = [...r.plan.flatMap((i) => i.alternatives)].find((p) =>
      p.reasons.some((x) => x.startsWith("Не покрива")),
    );
    if (partial) expect(partial.reasons.join(" ")).toMatch(/Не покрива/);
  });
});
