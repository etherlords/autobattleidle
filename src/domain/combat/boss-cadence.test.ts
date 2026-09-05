import { describe, expect, it } from "vitest";

import {
  bossCadenceBandForOrdinal,
  bossEncounterForOrdinal,
  bossGapForOrdinal,
  bossOrdinalForEncounter,
} from "./boss-cadence";

describe("progression-aware boss cadence", () => {
  it("varies the first ten seeded gaps across early and mid bands", () => {
    const gaps = Array.from({ length: 10 }, (_, index) => bossGapForOrdinal(index + 1));
    expect(new Set(gaps.slice(0, 3)).size).toBeGreaterThan(1);
    expect(new Set(gaps.slice(3)).size).toBeGreaterThan(1);
    gaps.forEach((gap, index) => {
      const band = bossCadenceBandForOrdinal(index + 1);
      expect(gap).toBeGreaterThanOrEqual(band.minGap);
      expect(gap).toBeLessThanOrEqual(band.maxGap);
    });
    expect(gaps.some((gap) => gap !== 35)).toBe(true);
  });

  it("varies the first three seeded gaps within every declared envelope", () => {
    const gaps = [1, 2, 3].map(bossGapForOrdinal);
    expect(new Set(gaps).size).toBeGreaterThan(1);
    gaps.forEach((gap, index) => {
      const band = bossCadenceBandForOrdinal(index + 1);
      expect(gap).toBeGreaterThanOrEqual(band.minGap);
      expect(gap).toBeLessThanOrEqual(band.maxGap);
    });
    const firstGap = gaps[1] ?? 0;
    const secondGap = gaps[2] ?? 0;
    expect(bossEncounterForOrdinal(3)).toBe(bossEncounterForOrdinal(1) + firstGap + secondGap);
  });

  it("reconstructs post-160 identities and rejects unsafe ordinal outputs", () => {
    const encounter = bossEncounterForOrdinal(161);
    expect(encounter).toBeGreaterThan(0);
    expect(bossOrdinalForEncounter(encounter)).toBe(161);
    expect(() => bossEncounterForOrdinal(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });
});
