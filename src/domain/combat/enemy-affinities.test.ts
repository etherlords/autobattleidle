import { describe, expect, it } from "vitest";

import { ENEMY_AFFINITIES, ENEMY_AFFINITY_IDS, type EnemyAffinity } from "./enemy-affinities";

type BoundedCue = "ember-shard" | "frost-mote" | "spark-ring" | "spore-bloom" | "tide-bead";

const BOUNDED_CUES: Record<BoundedCue, true> = {
  "ember-shard": true,
  "frost-mote": true,
  "spark-ring": true,
  "spore-bloom": true,
  "tide-bead": true,
};

describe("enemy affinity registry", () => {
  it("defines at least 12 named themes including the required Cinder, Ice, and Ash", () => {
    expect(ENEMY_AFFINITY_IDS.length).toBeGreaterThanOrEqual(12);
    for (const required of ["cinder", "ice", "ash"] as const satisfies readonly EnemyAffinity[])
      expect(ENEMY_AFFINITY_IDS, required).toContain(required);
  });

  it("keeps exactly four themes per reward factor so the mean is exactly 1.00", () => {
    const countsByFactor: Record<number, number> = {};
    for (const profile of Object.values(ENEMY_AFFINITIES))
      countsByFactor[profile.rewardMultiplier] =
        (countsByFactor[profile.rewardMultiplier] ?? 0) + 1;
    expect(countsByFactor[0.99]).toBe(4);
    expect(countsByFactor[1]).toBe(4);
    expect(countsByFactor[1.01]).toBe(4);
    const sum = Object.values(ENEMY_AFFINITIES).reduce(
      (total, profile) => total + profile.rewardMultiplier,
      0,
    );
    expect(sum / Object.keys(ENEMY_AFFINITIES).length).toBeCloseTo(1, 9);
  });

  it("gives every affinity a nonempty label, bounded cue, and hex palette", () => {
    for (const [id, profile] of Object.entries(ENEMY_AFFINITIES)) {
      expect(profile.label.length, id).toBeGreaterThan(0);
      expect(BOUNDED_CUES[profile.cue], id).toBe(true);
      for (const channel of ["core", "emissive", "accent"] as const)
        expect(profile.palette[channel], `${id}:${channel}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
