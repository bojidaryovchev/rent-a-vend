import { MODELS } from "./models";
import { unitSchema, type Unit } from "./schema";
import type { ConditionGrade, UnitStatus } from "./taxonomy";

/**
 * PLACEHOLDER STOCK.
 *
 * Generated deterministically so the catalogue, availability rules and the
 * admin panel can all be built and tested before the real stock list arrives.
 * The client holds roughly 350 machines and tracks them internally; this site
 * publishes availability rather than owning it.
 *
 * Real data replaces this wholesale. Nothing here is a claim about anything.
 */

export const UNITS_ARE_PLACEHOLDER = true;

/** Fixed reference date so builds are reproducible. */
const SEED_DATE = new Date("2026-07-30T09:00:00.000Z");

/** Small deterministic PRNG - no Math.random, so output never shifts. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATUS_POOL: UnitStatus[] = [
  "available",
  "available",
  "available",
  "rented",
  "rented",
  "reserved",
  "servicing",
  "incoming",
];

const GRADE_POOL: ConditionGrade[] = ["A", "B", "B", "B", "C"];

const SUPPLIERS = ["Внос Италия", "Внос Германия", "Внос Холандия", "Обратно от наем"];

function unitsForModel(modelId: string, index: number): Unit[] {
  const rand = seeded(modelId);
  const count = 1 + Math.floor(rand() * 5);

  return Array.from({ length: count }, (_, i) => {
    const status = STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)];
    const grade = GRADE_POOL[Math.floor(rand() * GRADE_POOL.length)];
    const year = 2008 + Math.floor(rand() * 15);

    // Stagger the update stamps a little so staleness logic has something real
    // to work with, but keep them all recent.
    const updated = new Date(SEED_DATE);
    updated.setUTCHours(updated.getUTCHours() - Math.floor(rand() * 30));

    return unitSchema.parse({
      id: `${modelId}-${i + 1}`,
      stockRef: `${String(index + 1).padStart(3, "0")}-${i + 1}`,
      modelId,
      year,
      conditionGrade: grade,
      status,
      monthlyRates: null, // placeholder rates come from the engine, not here
      serialNumber: null,
      purchaseDate: null,
      supplier: SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)],
      internalNotes: null,
      statusUpdatedAt: updated.toISOString(),
    });
  });
}

export const UNITS: Unit[] = MODELS.flatMap((m, i) => unitsForModel(m.id, i));

export const unitsForModelId = (modelId: string): Unit[] =>
  UNITS.filter((u) => u.modelId === modelId);

export const unitById = (id: string): Unit | undefined =>
  UNITS.find((u) => u.id === id);
