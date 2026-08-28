import * as THREE from "three";
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

  it("keeps the representative grade specs and seeded decorations exactly stable", () => {
    expect(enemyVisualSpec({ grade: "normal", level: 1, modifier: null })).toEqual({
      body: "brute",
      decorations: ["orbitals", "fins"],
      gradeCue: "none",
      modifierCue: null,
      scale: 1,
      seed: 4_128_564_042,
    });
    expect(enemyVisualSpec({ grade: "veteran", level: 2, modifier: null })).toMatchObject({
      body: "wisp",
      decorations: ["satellites", "horns"],
      gradeCue: "crest",
    });
    expect(enemyVisualSpec({ grade: "elite", level: 3, modifier: null })).toMatchObject({
      body: "beetle",
      decorations: ["horns", "satellites"],
      gradeCue: "spikes",
      scale: 1.12,
    });
    expect(enemyVisualSpec({ grade: "boss", level: 35, modifier: null })).toMatchObject({
      body: "boss-hydra",
      decorations: ["fins", "horns"],
      gradeCue: "crown",
      scale: 1.45,
    });
    expect(enemyVisualSpec({ grade: "boss", level: 70, modifier: null })).toMatchObject({
      body: "boss-colossus",
      decorations: ["horns", "satellites"],
      gradeCue: "crown",
      scale: 1.45,
    });
  });

  it("preserves every reachable modifier cue, including presentation-only wealth", () => {
    const input = { grade: "elite", level: 3 };
    expect(enemyVisualSpec({ ...input, modifier: "armor" }).modifierCue).toBe("shield-plates");
    expect(enemyVisualSpec({ ...input, modifier: "health" }).modifierCue).toBe("vitality-core");
    expect(enemyVisualSpec({ ...input, modifier: "automatic-slow" }).modifierCue).toBe("time-ring");
    expect(enemyVisualSpec({ ...input, modifier: "wealth" }).modifierCue).toBe("wealth-orbitals");
  });

  it("reaches all five deterministic decorations and keeps representative child counts", () => {
    const decorations = new Set<string>();
    for (let level = 1; level <= 3; level += 1) {
      enemyVisualSpec({ grade: "normal", level, modifier: null }).decorations.forEach(
        (decoration) => decorations.add(decoration),
      );
    }
    expect(decorations).toEqual(new Set(["fins", "horns", "orbitals", "satellites", "scar"]));
    expect(
      createEnemyVisual({ grade: "normal", level: 1, modifier: null }).group.children,
    ).toHaveLength(3);
    expect(
      createEnemyVisual({ grade: "veteran", level: 2, modifier: null }).group.children,
    ).toHaveLength(4);
    expect(
      createEnemyVisual({ grade: "elite", level: 3, modifier: null }).group.children,
    ).toHaveLength(6);
    expect(
      createEnemyVisual({ grade: "boss", level: 35, modifier: null }).group.children,
    ).toHaveLength(6);
    expect(
      createEnemyVisual({ grade: "boss", level: 70, modifier: null }).group.children,
    ).toHaveLength(4);
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

  it("removes its parent-owned meshes and disposes their resources exactly once", () => {
    const parent = new THREE.Group();
    const visual = createEnemyVisual({ grade: "elite", level: 3, modifier: "armor" });
    parent.add(visual.group);
    const body = visual.group.getObjectByName("enemy-body-beetle");
    if (!(body instanceof THREE.Mesh)) throw new Error("Expected named enemy body");
    let geometryDisposals = 0;
    let materialDisposals = 0;
    body.geometry.addEventListener("dispose", () => {
      geometryDisposals += 1;
    });
    body.material.addEventListener("dispose", () => {
      materialDisposals += 1;
    });

    visual.dispose();
    visual.dispose();

    expect(visual.group.parent).toBeNull();
    expect(parent.children).toHaveLength(0);
    expect(geometryDisposals).toBe(1);
    expect(materialDisposals).toBe(1);
  });
});
