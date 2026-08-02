import { UNITS } from "@/content/units";
import type { Unit } from "@/content/schema";
import { RENTABLE_STATUSES, type UnitStatus } from "@/content/taxonomy";

/**
 * Availability, and the rule that stops it lying.
 *
 * Live stock is the single largest advantage this site has over every Bulgarian
 * competitor - none of them publishes any. But it depends on one person marking
 * machines available, reserved and rented, by hand, every day, forever. Stock is
 * tracked internally; this site only publishes it.
 *
 * So when the data goes stale we show LESS, never something false. A visitor
 * told "call to check" costs a phone call. A visitor told "available" about a
 * machine that sold last week is lost for good.
 *
 * Pure functions over a supplied unit list, so pages can pass either the seed
 * or the admin-updated view without the engine knowing which.
 */

/** Beyond this, availability stops being shown at all. */
export const STALE_AFTER_HOURS = 96;

/** Below this, a freshness note is worth surfacing to the operator. */
const WARN_AFTER_HOURS = 48;

export type Freshness = "fresh" | "ageing" | "stale";

export interface AvailabilitySummary {
  total: number;
  available: number;
  reserved: number;
  incoming: number;
  unavailable: number;
  freshness: Freshness;
  lastUpdated: Date | null;
  /** When stale, the UI must fall back to "проверете наличност". */
  canPublish: boolean;
}

const hoursSince = (date: Date, now: Date): number =>
  (now.getTime() - date.getTime()) / 36e5;

function freshnessOf(lastUpdated: Date | null, now: Date): Freshness {
  if (!lastUpdated) return "stale";
  const hours = hoursSince(lastUpdated, now);
  if (hours > STALE_AFTER_HOURS) return "stale";
  if (hours > WARN_AFTER_HOURS) return "ageing";
  return "fresh";
}

export function summarise(units: Unit[], now: Date = new Date()): AvailabilitySummary {
  const count = (status: UnitStatus) =>
    units.filter((u) => u.status === status).length;

  const lastUpdated = units.length
    ? new Date(Math.max(...units.map((u) => new Date(u.statusUpdatedAt).getTime())))
    : null;

  const freshness = freshnessOf(lastUpdated, now);

  return {
    total: units.length,
    available: units.filter((u) => RENTABLE_STATUSES.includes(u.status)).length,
    reserved: count("reserved"),
    incoming: count("incoming"),
    unavailable: units.filter(
      (u) =>
        !RENTABLE_STATUSES.includes(u.status) &&
        u.status !== "reserved" &&
        u.status !== "incoming",
    ).length,
    freshness,
    lastUpdated,
    canPublish: freshness !== "stale",
  };
}

export const availabilityForModel = (
  modelId: string,
  now: Date = new Date(),
  units: Unit[] = UNITS,
): AvailabilitySummary =>
  summarise(
    units.filter((u) => u.modelId === modelId),
    now,
  );

export const availabilityOverall = (
  now: Date = new Date(),
  units: Unit[] = UNITS,
): AvailabilitySummary => summarise(units, now);

/** Model ids with at least one rentable unit, for weighting alternatives. */
export const availableModelIds = (units: Unit[] = UNITS): Set<string> =>
  new Set(
    units.filter((u) => RENTABLE_STATUSES.includes(u.status)).map((u) => u.modelId),
  );

/**
 * The line shown next to stock counts.
 *
 * Scarcity is framed to work in the client's favour where it honestly can:
 * "2 available of 5" says the machines are wanted, where "rented" alone reads
 * as sold out.
 */
export function availabilityLabel(summary: AvailabilitySummary): string {
  if (!summary.canPublish) return "Проверете наличност";
  if (summary.available === 0 && summary.incoming > 0) return "Очаква се доставка";
  if (summary.available === 0) return "Няма налични в момента";
  if (summary.available === 1 && summary.total > 1) return "Последна налична машина";
  if (summary.available < summary.total) {
    return `${summary.available} налични от общо ${summary.total}`;
  }
  // Concord matters: "1 налични" is wrong for машина, and on a site whose
  // whole strategy is exactness a grammar slip reads as machine translation.
  if (summary.available === 1) return "1 налична машина";
  return `${summary.available} налични`;
}
