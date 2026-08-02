import { describe, expect, it } from "vitest";
import {
  availabilityForModel,
  availabilityLabel,
  availabilityOverall,
  availableModelIds,
  STALE_AFTER_HOURS,
} from "./availability";
import { MODELS } from "@/content/models";
import { UNITS } from "@/content/units";

/** The seed stock is stamped around this moment. */
const NOW = new Date("2026-07-30T12:00:00.000Z");
const STALE_NOW = new Date("2026-09-30T12:00:00.000Z");

describe("availability", () => {
  it("generates stock for every model", () => {
    for (const m of MODELS) {
      expect(availabilityForModel(m.id, NOW).total).toBeGreaterThan(0);
    }
  });

  it("counts add up to the total", () => {
    const s = availabilityOverall(NOW);
    expect(s.available + s.reserved + s.incoming + s.unavailable).toBe(s.total);
  });

  it("treats recent data as fresh and publishable", () => {
    const s = availabilityOverall(NOW);
    expect(s.freshness).toBe("fresh");
    expect(s.canPublish).toBe(true);
  });

  it("refuses to publish availability once the data goes stale", () => {
    // The whole point: showing less beats showing something false.
    const s = availabilityOverall(STALE_NOW);
    expect(s.freshness).toBe("stale");
    expect(s.canPublish).toBe(false);
  });

  it("falls back to 'check availability' rather than a stale count", () => {
    const label = availabilityLabel(availabilityOverall(STALE_NOW));
    expect(label).toBe("Проверете наличност");
    expect(label).not.toMatch(/налични/);
  });

  it("goes stale exactly at the documented threshold", () => {
    const justInside = new Date(NOW.getTime() + (STALE_AFTER_HOURS - 40) * 36e5);
    expect(availabilityOverall(justInside).canPublish).toBe(true);
  });

  it("frames partial stock as scarcity rather than shortage", () => {
    const label = availabilityLabel({
      total: 5,
      available: 2,
      reserved: 1,
      incoming: 0,
      unavailable: 2,
      freshness: "fresh",
      lastUpdated: NOW,
      canPublish: true,
    });
    expect(label).toBe("2 налични от общо 5");
  });

  it("calls out the last machine", () => {
    const label = availabilityLabel({
      total: 4,
      available: 1,
      reserved: 0,
      incoming: 0,
      unavailable: 3,
      freshness: "fresh",
      lastUpdated: NOW,
      canPublish: true,
    });
    expect(label).toBe("Последна налична машина");
  });

  it("points at an incoming delivery when nothing is on the floor", () => {
    const label = availabilityLabel({
      total: 3,
      available: 0,
      reserved: 0,
      incoming: 2,
      unavailable: 1,
      freshness: "fresh",
      lastUpdated: NOW,
      canPublish: true,
    });
    expect(label).toBe("Очаква се доставка");
  });

  it("reports which models can actually be rented today", () => {
    const ids = availableModelIds();
    expect(ids.size).toBeGreaterThan(0);
    for (const id of ids) {
      expect(UNITS.some((u) => u.modelId === id && u.status === "available")).toBe(true);
    }
  });
});
