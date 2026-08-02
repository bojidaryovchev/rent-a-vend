import {
  CATEGORY_UNIT_LABEL,
  PRODUCT_LABEL,
  type Category,
  type ProductKind,
  type Shifts,
  type VenueType,
} from "@/content/taxonomy";
import type { Model } from "@/content/schema";
import {
  estimateDemand,
  isBelowFreePlacementThreshold,
  type LineCount,
  type MachineLine,
} from "./volume";

/**
 * The fleet we actually hold, and the weight each brand gets for it.
 *
 * Not brand loyalty: the stock is overwhelmingly Necta, the workshop carries
 * Necta parts and the service knowledge is Necta knowledge, so a Necta machine
 * is genuinely the faster repair and the more likely delivery date. The nudge is
 * small on purpose - it separates two machines that both fit, and never rescues
 * one that does not.
 *
 * Wittenborg carried half weight here while three of them were in the
 * catalogue. They are no longer stocked, so the entry went with them.
 */
const FLEET_PREFERENCE: Partial<Record<Model["manufacturer"], number>> = {
  necta: 10,
};

/**
 * The recommender.
 *
 * A deterministic rules engine, not a language model. It answers instantly,
 * costs nothing, is testable, and can never recommend a machine that does not
 * exist - which an LLM absolutely can.
 *
 * What it really is: the free site survey, productised. No European competitor
 * publishes one; every operator performs it in person. The questions are the
 * ones a rep asks on a site visit.
 *
 * It takes its candidates as an argument rather than importing the catalogue,
 * so the identical scoring runs on the server or in the browser without either
 * duplicating the rules or shipping the whole catalogue to the client.
 */

/** The slim projection of a model the scorer actually needs. */
export interface Candidate {
  id: string;
  slug: string;
  name: string;
  category: Category;
  manufacturer: Model["manufacturer"];
  venueTypes: VenueType[];
  minHeadcount: number | null;
  maxHeadcount: number | null;
  dailyCapacity: number | null;
  shifts: number[];
  products: ProductKind[];
  supportsMdb: boolean;
  /** How many spec fields we actually know, as a tie-breaker. */
  knownFields: number;
  fromEur: number;
}

export interface SiteProfile {
  venueType: VenueType;
  headcount: number;
  shifts: Shifts;
  products: ProductKind[];
  cashless: boolean | null;
  /** Optional, and asked last: an early budget question anchors people low. */
  maxMonthlyEur?: number | null;
}

export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  reasons: string[];
}

/**
 * One line of the answer: a machine, how many of it, and the runners-up.
 *
 * The recommendation is a plan for a site, not a single machine. A 200-person
 * plant asking for coffee, snacks and cold drinks needs three different
 * machines; naming only the best-scoring one of the three answers a question
 * nobody asked and, worse, leaves the visitor looking at a snack machine under
 * the words "не покрива: топли напитки".
 */
export interface PlanItem {
  line: MachineLine;
  /** How many of this machine the sizing table calls for. */
  count: number;
  pick: ScoredCandidate;
  alternatives: ScoredCandidate[];
}

export interface Recommendation {
  /** The machines to put on site, one entry per machine type. */
  plan: PlanItem[];
  /** The first plan item's machine. Kept for callers that want one name. */
  primary: ScoredCandidate | null;
  /** Runners-up across the whole plan, for the "other suitable machines" grid. */
  alternatives: ScoredCandidate[];
  /**
   * One combination machine covering hot and solid in a single cabinet, when
   * the request spans both. The cheaper, smaller-footprint answer, offered
   * rather than buried - the sizing table counts those as two machines.
   */
  comboInstead: ScoredCandidate | null;
  /** Sum of the plan at the headline per-machine rates. */
  monthlyFromEur: number;
  demand: ReturnType<typeof estimateDemand>;
  notes: string[];
  /**
   * True while the consumption rate is still our published-norm default. The
   * machine-count sizing is no longer a default - it is the client's own table.
   */
  isDefault: boolean;
}

/**
 * Which categories can serve each machine line.
 *
 * Combination machines are deliberately absent: a plan of separate machines is
 * what the sizing table describes, and a combo filling two lines at once would
 * either be listed twice or silently absorb a line. They are offered instead as
 * `comboInstead`, whole and clearly labelled.
 */
const LINE_CATEGORIES: Record<MachineLine, Category[]> = {
  coffee: ["coffee"],
  snack: ["snack"],
  // Some snack cabinets carry canned drinks; the product filter decides.
  cold: ["cold", "snack"],
};

/** Which of the visitor's chosen products a given line is answering for. */
const LINE_PRODUCTS: Record<MachineLine, ProductKind[]> = {
  coffee: ["coffee"],
  snack: ["snack", "food"],
  cold: ["cold"],
};

/**
 * Filling a line with the machine built for it.
 *
 * A snack cabinet with a chilled shelf does sell cans, so it is eligible for
 * the cold line - but a refrigerated drinks machine is the right answer, and
 * without this it loses to the Necta preference, putting a snack cabinet in the
 * cold-drinks slot of a plan that already has a snack cabinet in it. Set above
 * the fleet bonus deliberately: purpose beats brand.
 */
const PURPOSE_BUILT_BONUS = 15;

function score(
  candidate: Candidate,
  profile: SiteProfile,
  /** Per machine, not per site - the sizing table may call for several. */
  dailyVolume: number,
): ScoredCandidate {
  const reasons: string[] = [];
  let total = 0;

  if (candidate.venueTypes.includes(profile.venueType)) {
    total += 40;
    reasons.push("Подходяща за този тип обект");
  }

  const { minHeadcount: lo, maxHeadcount: hi } = candidate;
  if (lo !== null && hi !== null) {
    if (profile.headcount >= lo && profile.headcount <= hi) {
      total += 35;
      reasons.push(`Оразмерена за ${lo}-${hi} души`);
    } else if (profile.headcount < lo) {
      total -= Math.min(25, (lo - profile.headcount) / 4);
      reasons.push("По-голяма от нужното за този брой хора");
    } else {
      total -= Math.min(30, (profile.headcount - hi) / 4);
      reasons.push("Може да се наложи повече от една машина");
    }
  }

  if (candidate.dailyCapacity !== null) {
    if (candidate.dailyCapacity >= dailyVolume) {
      total += 20;
      reasons.push(`Капацитет за около ${candidate.dailyCapacity} продажби на ден`);
    } else {
      total -= 15;
      reasons.push("Капацитетът е под очакваното потребление");
    }
  }

  if (candidate.shifts.includes(profile.shifts)) {
    total += 10;
    reasons.push(
      profile.shifts === 3
        ? "Издържа режим 24/7"
        : "Подходяща за вашия режим на работа",
    );
  }

  // Product coverage dominates. A machine that cannot serve what the visitor
  // asked for is not a weaker answer, it is the wrong answer - so failing to
  // cover the request outweighs being in stock, well sized and well documented
  // put together.
  const covered = profile.products.filter((p) => candidate.products.includes(p));
  if (profile.products.length > 0) {
    if (covered.length === profile.products.length) {
      total += 35;
      reasons.push("Покрива всички избрани продукти");
    } else {
      const missing = profile.products.filter(
        (p) => !candidate.products.includes(p),
      );
      total -= 45;
      reasons.push(
        `Не покрива: ${missing.map((m) => PRODUCT_LABEL[m].toLowerCase()).join(", ")}`,
      );
    }
  }

  if (profile.cashless && candidate.supportsMdb) {
    total += 5;
    reasons.push("Готова за картов терминал (MDB)");
  }

  // A machine we can actually describe makes a better recommendation than one
  // whose page is mostly "няма данни", even when both fit.
  total += Math.min(8, candidate.knownFields);

  const fleetBonus = FLEET_PREFERENCE[candidate.manufacturer];
  if (fleetBonus) {
    total += fleetBonus;
    reasons.push("Necta - основната марка в наличност, с части и сервиз при нас");
  }

  // Budget filters rather than scores: over budget is a no, not a maybe.
  if (profile.maxMonthlyEur && candidate.fromEur > profile.maxMonthlyEur) {
    total -= 60;
    reasons.push("Над посочения бюджет");
  }

  return { candidate, score: total, reasons };
}

/** Second word of the model name, used to avoid offering three of one family. */
const family = (name: string): string => name.split(" ")[1] ?? name;

/** "2 кафе автомата и 1 снакс автомат" */
function describeMix(mix: LineCount[]): string {
  const parts = mix.map(({ line, count }) => {
    const label = CATEGORY_UNIT_LABEL[line];
    return `${count} ${count === 1 ? label.one : label.many}`;
  });
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} и ${parts[parts.length - 1]}`;
}

/** Up to `limit` runners-up, avoiding three trims of the same family. */
function diverseRunnersUp(
  scored: ScoredCandidate[],
  chosen: ScoredCandidate,
  limit: number,
): ScoredCandidate[] {
  const out: ScoredCandidate[] = [];
  for (const c of scored) {
    if (out.length >= limit) break;
    const clash = [chosen, ...out].some(
      (x) => family(x.candidate.name) === family(c.candidate.name),
    );
    if (!clash) out.push(c);
  }
  for (const c of scored) {
    if (out.length >= limit) break;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

export function recommend(
  profile: SiteProfile,
  candidates: Candidate[],
): Recommendation {
  const demand = estimateDemand(
    profile.headcount,
    profile.shifts,
    profile.products,
  );

  // Judge each machine on the share of the day's sales it actually carries.
  // Against the whole site's volume, a three-machine site would be told its
  // recommended machine is undersized in the same breath as being told to take
  // three of them.
  const perMachineVolume = Math.ceil(demand.dailyVolume / demand.machineCount);

  // Nothing chosen is not a state the wizard can reach, but the engine is
  // public: answer with the machine the business leads on rather than nothing.
  const wanted: LineCount[] = demand.mix.length
    ? demand.mix
    : [{ line: "coffee", count: demand.machineCount }];

  // One pass per machine type. Each pass scores against only the products that
  // type is answering for, so a snack machine is never marked down for failing
  // to pour coffee when a coffee machine is standing next to it in the plan.
  const plan: PlanItem[] = [];
  const spokenFor = new Set<string>();

  for (const { line, count } of wanted) {
    const lineProducts = profile.products.filter((p) =>
      LINE_PRODUCTS[line].includes(p),
    );
    const scored = candidates
      .filter(
        (c) =>
          LINE_CATEGORIES[line].includes(c.category) &&
          !spokenFor.has(c.id),
      )
      .map((c) => {
        const scored = score(
          c,
          { ...profile, products: lineProducts },
          perMachineVolume,
        );
        // Silent, like the other tie-breakers: "this is a drinks machine" is
        // not a selling point worth a bullet on a drinks machine's card.
        if (c.category === line) scored.score += PURPOSE_BUILT_BONUS;
        return scored;
      })
      .sort((a, b) => b.score - a.score);

    const pick = scored[0];
    if (!pick) continue;
    spokenFor.add(pick.candidate.id);
    plan.push({
      line,
      count,
      pick,
      alternatives: diverseRunnersUp(scored.slice(1), pick, 2),
    });
  }

  const primary = plan[0]?.pick ?? null;

  // The combination machine, whole. Scored against the full request, because
  // covering all of it in one cabinet is exactly what it is for.
  const linesWanted = wanted.map((w) => w.line);
  const spansHotAndSolid =
    linesWanted.includes("coffee") && linesWanted.includes("snack");
  const comboInstead = spansHotAndSolid
    ? (candidates
        .filter((c) => c.category === "combo")
        .map((c) => score(c, profile, perMachineVolume))
        .sort((a, b) => b.score - a.score)[0] ?? null)
    : null;

  const monthlyFromEur = plan.reduce(
    (sum, item) => sum + item.pick.candidate.fromEur * item.count,
    0,
  );

  const notes: string[] = [demand.assumption];

  if (isBelowFreePlacementThreshold(profile.headcount)) {
    notes.push(
      "При този брой хора повечето оператори не поставят машина безплатно. " +
        "Наемът е по-подходящият вариант и цената го отразява.",
    );
  }

  if (demand.machineCount > 1) {
    // Name the machines rather than only counting them: "3 машини" reads as an
    // upsell, "2 кафе автомата и 1 снакс автомат" reads as a plan for the site.
    const mixed = demand.mix.length > 1;
    const detail = describeMix(demand.mix);
    notes.push(
      `За ${profile.headcount} души препоръчваме ` +
        (mixed
          ? `${demand.machineCount} машини: ${detail}. `
          : detail
            ? `${detail}. `
            : `${demand.machineCount} машини. `) +
        "При повече от една се изготвя индивидуална оферта.",
    );

    // The smaller way to cover the same request, said out loud rather than left
    // for the visitor to work out. The sizing table counts a coffee machine and
    // a snack machine separately; one combination cabinet does both.
    if (comboInstead) {
      // Space, not money. A combination cabinet is not automatically cheaper
      // than the two machines it replaces - in this catalogue it is often
      // dearer - so the saving claimed here is the floor space, which is always
      // true, rather than the rent, which is not.
      notes.push(
        demand.machineCount === demand.mix.length
          ? "Ако мястото е ограничено, една комбинирана машина покрива и топлите " +
              "напитки, и снаксовете - с по-малък капацитет на зареждане."
          : "Комбинирана машина може да замени два от автоматите в един корпус, " +
              "ако мястото е ограничено - с по-малък капацитет на зареждане.",
      );
    }
  }

  if (profile.maxMonthlyEur) {
    notes.push(
      "Бюджетът е ориентировъчен - точната цена зависи от конкретната машина и срока.",
    );
  }

  // One runner-up from each machine type before a second from any of them, so a
  // three-machine plan does not show four alternative coffee machines.
  const alternatives: ScoredCandidate[] = [];
  const listed = new Set(plan.map((item) => item.pick.candidate.id));
  for (let rank = 0; rank < 2 && alternatives.length < 3; rank++) {
    for (const item of plan) {
      if (alternatives.length >= 3) break;
      const c = item.alternatives[rank];
      if (!c || listed.has(c.candidate.id)) continue;
      listed.add(c.candidate.id);
      alternatives.push(c);
    }
  }

  return {
    plan,
    primary,
    alternatives,
    comboInstead,
    monthlyFromEur,
    demand,
    notes,
    isDefault: true,
  };
}
