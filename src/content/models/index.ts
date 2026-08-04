import { modelSchema, specSchema, type Model, type Photo, type Spec } from "../schema";
import { PHOTO_VIEWS, type Category } from "../taxonomy";
import { nectaCoffee } from "./necta-coffee";
import { nectaSnack } from "./necta-snack";
import { fasCrane } from "./fas-crane";
import { vendo } from "./vendo";
import { combos, MINI_SNAKKY } from "./combos";

/**
 * Assembles and validates the catalogue at module load.
 *
 * A combination machine's specs are stacked here from the coffee machine on top
 * and the snack base under it, so a change to the Brio's weight flows into every
 * combo built on one.
 */

type Draft = Parameters<typeof modelSchema.parse>[0];

const sum = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

const max = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : Math.max(a ?? 0, b ?? 0);

/**
 * One machine, stacked: a coffee machine bolted onto a snack base.
 *
 * So heights ADD and widths do not - the opposite of the side-by-side pair this
 * catalogue used to describe. Width and depth are the larger of the two, because
 * the assembled cabinet is as wide as its widest half and has to clear a
 * doorway on that figure.
 *
 * Capacity, trays and temperature come from the base alone: they describe the
 * snack half, and the coffee half's cup count is a different unit that would be
 * nonsense to add to it.
 */
function deriveStackedSpec(top: Spec, base: Spec): Spec {
  return specSchema.parse({
    // The visitor operates the coffee machine's panel; it drives both halves.
    userInterface: top.userInterface,
    numberOfSelections: base.numberOfSelections,
    protocol: top.protocol ?? base.protocol,

    heightMm: sum(top.heightMm, base.heightMm),
    widthMm: max(top.widthMm, base.widthMm),
    depthMm: max(top.depthMm, base.depthMm),
    depthOpenMm: max(top.depthOpenMm, base.depthOpenMm),
    weightKg: sum(top.weightKg, base.weightKg),

    voltage: top.voltage ?? base.voltage,
    maxPowerW: sum(top.maxPowerW, base.maxPowerW),
    frequencyHz: top.frequencyHz ?? base.frequencyHz,

    configuration:
      ["Топли напитки", base.configuration].filter(Boolean).join(" · ") || null,
    numTrays: base.numTrays,
    elevator: base.elevator ?? top.elevator,
    dispensingSystem: base.dispensingSystem,
    temperature: base.temperature,
    productCapacity: base.productCapacity,
  });
}

const MINI_SNAKKY_SPEC = specSchema.parse(MINI_SNAKKY.spec);

const singles: Model[] = [
  ...nectaCoffee,
  ...nectaSnack,
  ...fasCrane,
  ...vendo,
].map((d) => modelSchema.parse(d as Draft));

const singlesById = new Map(singles.map((m) => [m.id, m]));

/** Authored photos, before combos or variants borrow anything - what the
 *  integrity rules below are allowed to judge. Snapshotted here because the
 *  derivations that follow write into `model.photos`. */
const authored: { slug: string; photos: Photo[] }[] = singles.map((m) => ({
  slug: m.slug,
  photos: [...m.photos],
}));

/**
 * Lend a variant the cabinet it shares with its base model.
 *
 * A FAS 1050 EVO differs from a FAS 1050 by its CO2 circuit, which is behind the
 * panel; photographing both would produce two identical frames. The caption says
 * whose cabinet it is, so the page never implies this machine was shot itself,
 * and `ownsItsPhotos` still counts it as unphotographed in the readiness report.
 */
for (const model of singles) {
  if (!model.cabinetOf || model.photos.length > 0) continue;
  const base = singlesById.get(model.cabinetOf);
  if (!base) {
    throw new Error(
      `"${model.slug}" сочи към несъществуващ корпус: ${model.cabinetOf}`,
    );
  }
  if (base.cabinetOf) {
    throw new Error(
      `"${model.slug}" сочи към "${base.slug}", който сам заема чужд корпус.`,
    );
  }
  const lead = base.photos.find((p) => p.view === "front") ?? base.photos[0];
  if (!lead) continue;
  model.photos = [
    {
      ...lead,
      alt: `${model.name}: същият корпус като ${base.name}. ${lead.alt}`,
      credit: `Същият корпус като ${base.name}. ${lead.credit ?? ""}`.trim(),
    },
  ];
}


const comboModels: Model[] = combos.map((draft) => {
  const parsed = modelSchema.parse(draft as Draft);
  const top = parsed.coffeeUnit ? singlesById.get(parsed.coffeeUnit) : undefined;

  if (!top) {
    throw new Error(
      `Комбинацията "${parsed.slug}" сочи към несъществуваща кафе машина: ${parsed.coffeeUnit}`,
    );
  }

  authored.push({ slug: parsed.slug, photos: parsed.photos });

  return {
    ...parsed,
    spec: deriveStackedSpec(top.spec, MINI_SNAKKY_SPEC),
  };
});


export const MODELS: Model[] = [...singles, ...comboModels];

/* -- integrity ----------------------------------------------------------- */

const duplicateSlug = MODELS.map((m) => m.slug).find(
  (slug, i, all) => all.indexOf(slug) !== i,
);
if (duplicateSlug) {
  throw new Error(`Дублиран slug в каталога: ${duplicateSlug}`);
}

/* Photos are filed under the model's own slug. The failure this catches is the
 * quiet one: a file copied from another machine's folder shows the wrong
 * machine at the right price, and nothing about the page looks broken. */
for (const { slug, photos } of authored) {
  for (const photo of photos) {
    if (!photo.src.startsWith(`/machines/${slug}/`)) {
      throw new Error(
        `Снимка на "${slug}" сочи към чужда папка: ${photo.src}. ` +
          `Очаква се /machines/${slug}/...`,
      );
    }
  }
}

const allAuthored = authored.flatMap((a) => a.photos.map((p) => p.src));
const duplicatePhoto = allAuthored.find((src, i) => allAuthored.indexOf(src) !== i);
if (duplicatePhoto) {
  throw new Error(`Един и същи файл е използван два пъти: ${duplicatePhoto}`);
}

/* -- lookups -------------------------------------------------------------- */

export const modelsByCategory = (category: Category): Model[] =>
  MODELS.filter((m) => m.category === category);

export const modelBySlug = (slug: string): Model | undefined =>
  MODELS.find((m) => m.slug === slug);

export const modelById = (id: string): Model | undefined =>
  MODELS.find((m) => m.id === id);

/** The catalogued coffee machine forming a combo's top half, if this is one. */
export const coffeeUnitOf = (model: Model): Model | null =>
  model.coffeeUnit ? (modelById(model.coffeeUnit) ?? null) : null;

/** The snack base under every combination machine. Named, not catalogued: the
 *  client supplies it only under a Brio. */
export const COMBO_BASE_NAME = MINI_SNAKKY.name;

/** How complete a model's specification is, for the readiness report. */
export const specCompleteness = (model: Model): number => {
  const values = Object.values(model.spec);
  const filled = values.filter((v) => v !== null).length;
  return Math.round((filled / values.length) * 100);
};

/* -- photography ---------------------------------------------------------- */

/** The frame a card and the gallery open on. Front view wins when there is one,
 *  because a side-on shot as the lead reads as a mistake. */
export const leadPhoto = (model: Model): Photo | null =>
  model.photos.find((p) => p.view === "front") ?? model.photos[0] ?? null;

/** True once a model has all four agreed views (D25), not merely one photo. */
export const hasCompleteSet = (model: Model): boolean =>
  PHOTO_VIEWS.every((view) => model.photos.some((p) => p.view === view));

/** True when the frames on show belong to the model itself rather than being
 *  borrowed from the base model whose cabinet it shares. */
export const ownsItsPhotos = (model: Model): boolean =>
  model.photos.some((p) => p.src.startsWith(`/machines/${model.slug}/`));

/** Photography progress, for the readiness report. Counts only what a model
 *  owns: a variant showing its base model's cabinet is not yet shot. */
export const photoCoverage = () => {
  const owned = MODELS.filter(ownsItsPhotos);
  return {
    withAny: owned.length,
    withCompleteSet: owned.filter(hasCompleteSet).length,
    total: MODELS.length,
    percent: Math.round((owned.length / MODELS.length) * 100),
  };
};

export const catalogueStats = () => ({
  total: MODELS.length,
  byCategory: {
    coffee: modelsByCategory("coffee").length,
    snack: modelsByCategory("snack").length,
    combo: modelsByCategory("combo").length,
    cold: modelsByCategory("cold").length,
  },
  averageSpecCompleteness: Math.round(
    MODELS.reduce((acc, m) => acc + specCompleteness(m), 0) / MODELS.length,
  ),
  photos: photoCoverage(),
});
