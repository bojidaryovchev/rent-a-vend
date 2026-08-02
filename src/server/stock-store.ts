import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { UNITS } from "@/content/units";
import type { Unit } from "@/content/schema";
import { UNIT_STATUSES, type UnitStatus } from "@/content/taxonomy";

/**
 * Stock status overlay.
 *
 * The client tracks machines in his own internal system; this site publishes
 * availability rather than owning it. So the catalogue keeps its seed of units
 * and the admin writes a thin overlay of status changes on top.
 *
 * Every write stamps `statusUpdatedAt`, which is what the staleness rule reads.
 * That timestamp is the entire safety mechanism: without a recent one, the site
 * stops publishing availability rather than showing something false.
 */

const FILE = join(process.cwd(), ".data", "stock.json");

const overlaySchema = z.record(
  z.string(),
  z.object({
    status: z.enum(UNIT_STATUSES),
    statusUpdatedAt: z.string(),
  }),
);

type Overlay = z.infer<typeof overlaySchema>;

async function readOverlay(): Promise<Overlay> {
  try {
    return overlaySchema.parse(JSON.parse(await readFile(FILE, "utf8")));
  } catch {
    return {};
  }
}

async function writeOverlay(overlay: Overlay): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(overlay, null, 2), "utf8");
}

/** Seed units with any admin changes applied. */
export async function getUnits(): Promise<Unit[]> {
  const overlay = await readOverlay();
  if (Object.keys(overlay).length === 0) return UNITS;

  return UNITS.map((unit) => {
    const change = overlay[unit.id];
    return change
      ? { ...unit, status: change.status, statusUpdatedAt: change.statusUpdatedAt }
      : unit;
  });
}

export async function setUnitStatus(
  unitId: string,
  status: UnitStatus,
): Promise<void> {
  if (!UNITS.some((u) => u.id === unitId)) return;

  const overlay = await readOverlay();
  overlay[unitId] = { status, statusUpdatedAt: new Date().toISOString() };
  await writeOverlay(overlay);
}

/**
 * When the operator last touched stock at all, and how long ago.
 *
 * Computed here rather than in the component: reading the clock during render
 * is impure, and the freshness banner is exactly the sort of thing that must
 * not disagree with the availability engine about what time it is.
 */
export async function lastStockUpdate(): Promise<{
  at: Date | null;
  hoursAgo: number | null;
}> {
  const units = await getUnits();
  if (units.length === 0) return { at: null, hoursAgo: null };

  const at = new Date(
    Math.max(...units.map((u) => new Date(u.statusUpdatedAt).getTime())),
  );
  return { at, hoursAgo: Math.floor((Date.now() - at.getTime()) / 36e5) };
}
