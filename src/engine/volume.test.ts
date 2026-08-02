import { describe, expect, it } from "vitest";
import {
  estimateDemand,
  isBelowFreePlacementThreshold,
  MIN_HEADCOUNT_FOR_FREE_PLACEMENT,
} from "./volume";

describe("estimateDemand", () => {
  it("scales with headcount", () => {
    expect(estimateDemand(200, 1).dailyVolume).toBeGreaterThan(
      estimateDemand(50, 1).dailyVolume,
    );
  });

  it("scales with shift count at the same headcount", () => {
    const one = estimateDemand(120, 1).dailyVolume;
    const three = estimateDemand(120, 3).dailyVolume;
    expect(three).toBeGreaterThan(one);
  });

  it("stays inside the published 0.1-0.2 purchases per person per day", () => {
    const headcount = 150;
    const { dailyVolume } = estimateDemand(headcount, 1);
    const perPerson = dailyVolume / headcount;
    expect(perPerson).toBeGreaterThanOrEqual(0.1);
    expect(perPerson).toBeLessThanOrEqual(0.2);
  });

  it("does not reproduce the brief's inflated figures", () => {
    // The original brief claimed 150 employees produce 1.8 purchases each per
    // day. European benchmarks put a site that size an order of magnitude lower,
    // and publishing the inflated number would be a misleading-advertising
    // exposure as well as a broken promise.
    const { dailyVolume } = estimateDemand(150, 1);
    expect(dailyVolume).toBeLessThan(150 * 0.5);
  });

  it("follows the client's sizing bands", () => {
    // Up to 50 people one machine; above 50 and up to 200, three; above 200,
    // four and up. Round 15, and deliberately more generous than the industry
    // one-unit-per-75-to-100 norm it replaced.
    expect(estimateDemand(50, 1).machineCount).toBe(1);
    expect(estimateDemand(51, 1).machineCount).toBe(3);
    expect(estimateDemand(200, 1).machineCount).toBe(3);
    expect(estimateDemand(201, 1).machineCount).toBe(4);
  });

  it("adds machines with headcount above the top band", () => {
    expect(estimateDemand(400, 1).machineCount).toBe(5);
    expect(estimateDemand(600, 1).machineCount).toBe(6);
  });

  it("adds a machine per extra shift, but only on the large sites", () => {
    expect(estimateDemand(300, 1).machineCount).toBe(4);
    expect(estimateDemand(300, 2).machineCount).toBe(5);
    expect(estimateDemand(300, 3).machineCount).toBe(6);
    // A small site works the same machine harder; it does not get a second one.
    expect(estimateDemand(40, 3).machineCount).toBe(1);
  });

  it("counts coffee and snacks as two machines even on a small site", () => {
    expect(estimateDemand(40, 1, ["coffee"]).machineCount).toBe(1);
    expect(estimateDemand(40, 1, ["coffee", "snack"]).machineCount).toBe(2);
    expect(
      estimateDemand(40, 1, ["coffee", "snack", "cold"]).machineCount,
    ).toBe(3);
  });

  it("treats food as the snack line rather than a fourth machine", () => {
    expect(estimateDemand(40, 1, ["snack", "food"]).machineCount).toBe(1);
    expect(estimateDemand(40, 1, ["snack", "food"]).mix).toEqual([
      { line: "snack", count: 1 },
    ]);
  });

  it("splits the count across the requested machine types", () => {
    const { machineCount, mix } = estimateDemand(120, 1, ["coffee", "snack"]);
    expect(machineCount).toBe(3);
    // Remainder goes to the highest-turnover line.
    expect(mix).toEqual([
      { line: "coffee", count: 2 },
      { line: "snack", count: 1 },
    ]);
    expect(mix.reduce((sum, m) => sum + m.count, 0)).toBe(machineCount);
  });

  it("always recommends at least one machine", () => {
    expect(estimateDemand(3, 1).machineCount).toBe(1);
    expect(estimateDemand(0, 1).machineCount).toBe(1);
  });

  it("states its assumption in plain language", () => {
    const { assumption } = estimateDemand(120, 2);
    expect(assumption).toContain("120");
    expect(assumption).toContain("две смени");
  });

  it("still marks the consumption rate as a default", () => {
    // The sizing table is the client's as of round 15; the purchases-per-person
    // figure behind dailyVolume is still ours.
    expect(estimateDemand(100, 1).isDefault).toBe(true);
  });
});

describe("free placement threshold", () => {
  it("flags sites below the published operator minimum", () => {
    expect(isBelowFreePlacementThreshold(MIN_HEADCOUNT_FOR_FREE_PLACEMENT - 1)).toBe(true);
    expect(isBelowFreePlacementThreshold(MIN_HEADCOUNT_FOR_FREE_PLACEMENT)).toBe(false);
  });
});
