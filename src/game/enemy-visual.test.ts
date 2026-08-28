import { describe, expect, it } from "vitest";

import { createEnemyVisual, enemyVisualSpec, stableEnemySeed } from "./enemy-visual";

describe("enemy visual factory", () => {
  it("selects stable varied ordinary bodies and decorations from snapshot identity", () => {
    const families = new Set<string>();
    const decorations = new Set<string>();
    for (let level = 1; level <= 18; level += 1) {
      const input = { grade: "normal", level, modifier: null };
      const first = enemyVisualSpec(input);
      expect(enemyVisualSpec(input)).toEqual(first);
      expect(stableEnemySeed(input)).toBe(first.seed);
      families.add(first.body);
      first.decorations.forEach((decoration) => decorations.add(decoration));
    }
    expect(families).toEqual(new Set(["beetle", "brute", "wisp"]));
    expect(decorations.size).toBeGreaterThan(3);
  });

  it("uses dedicated boss bodies and visible grade and modifier attachments", () => {
    const bossBodies = new Set<string>();
    for (let level = 1; level <= 18; level += 1) {
      bossBodies.add(enemyVisualSpec({ grade: "boss", level, modifier: "armor" }).body);
    }
    expect(bossBodies).toEqual(new Set(["boss-colossus", "boss-hydra"]));
    expect(enemyVisualSpec({ grade: "elite", level: 4, modifier: "armor" })).toMatchObject({
      gradeCue: "spikes",
      modifierCue: "shield-plates",
    });
    expect(enemyVisualSpec({ grade: "elite", level: 4, modifier: "health" }).modifierCue).toBe(
      "vitality-core",
    );
    expect(
      enemyVisualSpec({ grade: "elite", level: 4, modifier: "automatic-slow" }).modifierCue,
    ).toBe("time-ring");
    expect(enemyVisualSpec({ grade: "elite", level: 4, modifier: "wealth" }).modifierCue).toBe(
      "wealth-orbitals",
    );
  });

  it("owns a bounded visual tree and keeps the slow ring animated", () => {
    const visual = createEnemyVisual({ grade: "boss", level: 15, modifier: "automatic-slow" });
    expect(visual.group.children.length).toBeLessThanOrEqual(9);
    const ring = visual.group.getObjectByName("time-ring");
    expect(ring).toBeDefined();
    const before = ring?.rotation.z;
    visual.tick();
    expect(ring?.rotation.z).toBeGreaterThan(before ?? 0);
  });
});
