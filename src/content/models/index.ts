import { modelSchema, specSchema, type Model, type Photo, type Spec } from "../schema";
import { PHOTO_VIEWS, type Category } from "../taxonomy";
import { nectaCoffee } from "./necta-coffee";
import { nectaSnack } from "./necta-snack";
import { fasCrane } from "./fas-crane";
import { vendo } from "./vendo";
import { combos } from "./combos";

/**
 * Assembles and validates the catalogue at module load.
 *
 * Combination machines get their specs computed from their two constituents
 * here, so a change to Snakky's weight flows into every combo containing one.
 */

type Draft = Parameters<typeof modelSchema.parse>[0];

const sum = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

const max = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : Math.max(a ?? 0, b ?? 0);

/** Two machines standing side by side: widths add, heights do not. */
function deriveComboSpec(left: Spec, right: Spec): Spec {
  return specSchema.parse({
    userInterface: left.userInterface,
    numberOfSelections: sum(left.numberOfSelections, right.numberOfSelections),
    protocol: left.protocol ?? right.protocol,
    heightMm: max(left.heightMm, right.heightMm),
    widthMm: sum(left.widthMm, right.widthMm),
    depthMm: max(left.depthMm, right.depthMm),
    depthOpenMm: max(left.depthOpenMm, right.depthOpenMm),
    weightKg: sum(left.weightKg, right.weightKg),
    voltage: left.voltage ?? right.voltage,
    maxPowerW: sum(left.maxPowerW, right.maxPowerW),
    frequencyHz: left.frequencyHz ?? right.frequencyHz,
    configuration: [left.configuration, right.configuration]
      .filter(Boolean)
      .join(" · ") || null,
    numTrays: sum(left.numTrays, right.numTrays),
    elevator: left.elevator ?? right.elevator,
    dispensingSystem: [left.dispensingSystem, right.dispensingSystem]
      .filter(Boolean)
      .join(" · ") || null,
    temperature: right.temperature ?? left.temperature,
    productCapacity: sum(left.productCapacity, right.productCapacity),
  });
}

/**
 * A combination machine is two catalogued machines standing side by side. Until
 * the pair itself is photographed it borrows its constituents' frames, each one
 * naming the machine it shows, so nothing implies the photograph is of the set.
 */
function deriveComboPhotos(left: Model, right: Model): Photo[] {
  const halves = [left, right].map((m) => {
    const lead = m.photos.find((p) => p.view === "front") ?? m.photos[0];
    return lead ? { model: m, lead } : null;
  });

  // Both halves or neither. Half a combination is not a picture of it: a
  // coffee-plus-snack pair whose only frame is the snack machine reads as the
  // wrong product entirely, and the drawing - which does render two cabinets -
  // is the more honest stand-in until the pair itself is shot.
  if (halves.some((h) => h === null)) return [];

  return (halves as { model: Model; lead: Photo }[]).map(({ model, lead }) => ({
    ...lead,
    alt: lead.alt.includes(model.name)
      ? lead.alt
      : `${model.name}: ${lead.alt}`,
  }));
}

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
  const [leftId, rightId] = parsed.comboOf ?? [];
  const left = leftId ? singlesById.get(leftId) : undefined;
  const right = rightId ? singlesById.get(rightId) : undefined;

  if (!left || !right) {
    throw new Error(
      `Комбинацията "${parsed.slug}" сочи към несъществуваща машина: ${leftId} / ${rightId}`,
    );
  }

  authored.push({ slug: parsed.slug, photos: parsed.photos });

  const spec = deriveComboSpec(left.spec, right.spec);
  const dailyCapacity =
    sum(
      left.recommendation.dailyCapacity,
      right.recommendation.dailyCapacity,
    ) ?? null;

  return {
    ...parsed,
    spec,
    photos: parsed.photos.length ? parsed.photos : deriveComboPhotos(left, right),
    recommendation: { ...parsed.recommendation, dailyCapacity },
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

export const constituentsOf = (model: Model): Model[] =>
  model.comboOf
    ? model.comboOf.map((id) => modelById(id)).filter((m): m is Model => !!m)
    : [];

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
 *  borrowed from a combo's two constituents. */
export const ownsItsPhotos = (model: Model): boolean =>
  model.photos.some((p) => p.src.startsWith(`/machines/${model.slug}/`));

/** Photography progress, for the readiness report. Counts only what a model
 *  owns: a combo borrowing its constituents' frames is not yet shot. */
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
