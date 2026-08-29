import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  createEnemyVisual,
  EnemyViewBuilder,
  enemyBodyFactories,
  enemyVisualSpec,
  stableEnemySeed,
  type EnemyVisualInput,
} from "./enemy-visual";
import { component } from "./enemy-visual/components";
import {
  decorateGrade,
  decorateModifier,
  decorateSeededDecoration,
} from "./enemy-visual/decorators";
import { EnemyUnitBuilder, EnemyUnitFactory } from "./units/enemy";

const meshCount = (visual: ReturnType<typeof createEnemyVisual>): number => {
  let count = 0;
  visual.group.traverse((node) => {
    if (node instanceof THREE.Mesh) count += 1;
  });
  return count;
};

describe("enemy visual factory", () => {
  it("selects stable varied ordinary bodies and decorations from snapshot identity", () => {
    const families = new Set<string>();
    const decorations = new Set<string>();
    for (let level = 1; level <= 18; level += 1) {
      const input: EnemyVisualInput = { grade: "normal", level, modifier: null };
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

  it("keeps existing body selection stable while adding authored family profiles", () => {
    expect(enemyVisualSpec({ grade: "normal", level: 1, modifier: null })).toMatchObject({
      body: "brute",
      decorations: ["orbitals", "fins"],
      gradeCue: "none",
      modifierCue: null,
      profile: { variant: 0 },
      scale: 1,
      seed: 4_128_564_042,
    });
    expect(enemyVisualSpec({ grade: "veteran", level: 2, modifier: null })).toMatchObject({
      body: "wisp",
      decorations: ["orbitals", "scar"],
      gradeCue: "crest",
    });
    expect(enemyVisualSpec({ grade: "elite", level: 3, modifier: null })).toMatchObject({
      body: "beetle",
      decorations: ["horns", "orbitals"],
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

  it("covers three deterministic coordinated variants for every family", () => {
    const inputs: Readonly<Record<string, EnemyVisualInput>> = {
      beetle: { grade: "normal", level: 3, modifier: null },
      brute: { grade: "normal", level: 1, modifier: null },
      wisp: { grade: "normal", level: 2, modifier: null },
      mantis: { grade: "elite", level: 3, modifier: "hardened" },
      sentinel: { grade: "elite", level: 3, modifier: "critical-guard" },
      drake: { grade: "elite", level: 3, modifier: "manual-guard" },
      "boss-colossus": { grade: "boss", level: 2, modifier: null },
      "boss-hydra": { grade: "boss", level: 1, modifier: null },
    };
    for (const [family, input] of Object.entries(inputs)) {
      const variants = new Map<number, string>();
      for (let level = input.level; level < input.level + 120; level += 1) {
        const spec = enemyVisualSpec({ ...input, level });
        if (spec.body === family)
          variants.set(
            spec.profile.variant,
            `${spec.profile.palette.core}:${spec.decorations.join("/")}`,
          );
      }
      expect(variants.size).toBe(3);
      expect(new Set(variants.values()).size).toBe(3);
    }
  });

  it("renders every family/profile with bounded surface attachments and new modifier cues", () => {
    const inputs: Readonly<Record<string, EnemyVisualInput>> = {
      beetle: { grade: "normal", level: 3, modifier: null },
      brute: { grade: "normal", level: 1, modifier: null },
      wisp: { grade: "normal", level: 2, modifier: null },
      mantis: { grade: "elite", level: 3, modifier: "hardened" },
      sentinel: { grade: "elite", level: 3, modifier: "critical-guard" },
      drake: { grade: "elite", level: 3, modifier: "manual-guard" },
      "boss-colossus": { grade: "boss", level: 2, modifier: null },
      "boss-hydra": { grade: "boss", level: 1, modifier: null },
    };
    for (const [family, input] of Object.entries(inputs)) {
      const renderedVariants = new Set<number>();
      for (let level = input.level; level < input.level + 120; level += 1) {
        const visual = createEnemyVisual({ ...input, level });
        if (visual.spec.body !== family || renderedVariants.has(visual.spec.profile.variant)) {
          visual.dispose();
          continue;
        }
        renderedVariants.add(visual.spec.profile.variant);
        expect(visual.group.getObjectByName(`enemy-body-${family}`)).toBeDefined();
        expect(meshCount(visual)).toBeLessThanOrEqual(9);
        const shields = new EnemyViewBuilder();
        shields.add(enemyBodyFactories[visual.spec.body](visual.spec.profile));
        shields.add(decorateModifier("shield-plates", visual.spec.profile));
        const shielded = shields.build();
        for (const plate of shielded.roots.modifier.children) {
          expect(Math.abs(plate.position.x)).toBe(visual.spec.profile.attachment[0]);
          expect(plate.position.z).toBe(visual.spec.profile.attachment[2] + 0.55);
        }
        shielded.dispose();
        visual.dispose();
      }
      expect(renderedVariants.size).toBe(3);
    }
    for (const [modifier, cue] of [
      ["hardened", "reinforced-band"],
      ["critical-guard", "prism-guard"],
      ["manual-guard", "directional-barrier"],
    ] as const) {
      const visual = createEnemyVisual({ grade: "elite", level: 3, modifier });
      expect(visual.group.getObjectByName(cue)).toBeDefined();
      expect(visual.group.getObjectByName(cue)?.position).toMatchObject({
        x: visual.spec.profile.attachment[0],
        y: visual.spec.profile.attachment[1],
        z: visual.spec.profile.attachment[2],
      });
      visual.dispose();
    }
  });

  it("keeps the Sentinel core within its authored compact silhouette height", () => {
    const visual = createEnemyVisual({ grade: "elite", level: 3, modifier: "critical-guard" });
    const core = visual.group.getObjectByName("enemy-body-sentinel");
    if (!(core instanceof THREE.Mesh)) throw new Error("Expected Sentinel core mesh");
    core.geometry.computeBoundingBox();
    const bounds = core.geometry.boundingBox;
    if (bounds === null) throw new Error("Expected Sentinel core bounds");
    const height = bounds.max.y - bounds.min.y;
    expect(height).toBeGreaterThan(0.8);
    expect(height).toBeLessThanOrEqual(0.82);
    visual.dispose();
  });

  it("preserves every reachable modifier cue, including presentation-only wealth", () => {
    const input: Pick<EnemyVisualInput, "grade" | "level"> = { grade: "elite", level: 3 };
    expect(enemyVisualSpec({ ...input, modifier: "armor" }).modifierCue).toBe("shield-plates");
    expect(enemyVisualSpec({ ...input, modifier: "health" }).modifierCue).toBe("vitality-core");
    expect(enemyVisualSpec({ ...input, modifier: "automatic-slow" }).modifierCue).toBe("time-ring");
    expect(enemyVisualSpec({ ...input, modifier: "wealth" }).modifierCue).toBe("wealth-orbitals");
  });

  it("keeps decoration and mesh composition bounded", () => {
    const decorations = new Set<string>();
    for (let level = 1; level <= 120; level += 1) {
      enemyVisualSpec({ grade: "normal", level, modifier: null }).decorations.forEach(
        (decoration) => decorations.add(decoration),
      );
    }
    expect(decorations).toEqual(new Set(["fins", "horns", "orbitals", "satellites", "scar"]));
    expect(
      meshCount(createEnemyVisual({ grade: "normal", level: 1, modifier: null })),
    ).toBeLessThanOrEqual(9);
    expect(
      meshCount(createEnemyVisual({ grade: "elite", level: 3, modifier: "manual-guard" })),
    ).toBeLessThanOrEqual(9);
    expect(
      meshCount(createEnemyVisual({ grade: "boss", level: 35, modifier: null })),
    ).toBeLessThanOrEqual(9);
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

  it("uses an exhaustive body registry and seals valid component builds", () => {
    expect(Object.keys(enemyBodyFactories).sort()).toEqual([
      "beetle",
      "boss-colossus",
      "boss-hydra",
      "brute",
      "drake",
      "mantis",
      "sentinel",
      "wisp",
    ]);
    const builder = new EnemyViewBuilder();
    expect(() => builder.build()).toThrow("requires exactly one body");
    builder.add(enemyBodyFactories.beetle());
    expect(() => builder.add(enemyBodyFactories.brute())).toThrow("already has a body");
    const built = builder.build();
    expect(built.roots.body.name).toBe("enemy-layer-body");
    expect(() => builder.add(decorateGrade("crest"))).toThrow("sealed");
  });

  it("composes decorators independently and registers an animation only once", () => {
    const builder = new EnemyViewBuilder();
    builder.add(enemyBodyFactories.beetle());
    builder.add(decorateGrade("spikes"));
    builder.add(decorateModifier("time-ring"));
    builder.add(decorateSeededDecoration("scar", 0));
    builder.add(decorateSeededDecoration("horns", 1));
    const built = builder.build();
    expect(Object.values(built.roots).map((root) => root.name)).toEqual([
      "enemy-layer-body",
      "enemy-layer-grade",
      "enemy-layer-modifier",
      "enemy-layer-decoration",
    ]);
    expect(built.roots.body.children).toHaveLength(2);
    expect(built.roots.grade.children).toHaveLength(2);
    expect(built.roots.modifier.children).toHaveLength(1);
    expect(built.roots.decoration.children).toHaveLength(2);
    const ring = built.group.getObjectByName("time-ring");
    if (ring === undefined) throw new Error("Expected decorator time ring");
    const before = ring.rotation.z;
    built.tick();
    expect(ring.rotation.z).toBe(before + 0.035);

    const animations = new EnemyViewBuilder();
    animations.add(enemyBodyFactories.brute());
    animations.add(
      component("decoration-shared-first", "decoration", [new THREE.Group()], {
        shared: () => undefined,
      }),
    );
    expect(() =>
      animations.add(
        component("decoration-shared-second", "decoration", [new THREE.Group()], {
          shared: () => undefined,
        }),
      ),
    ).toThrow("already registered");
  });

  it("adapts the stable view through the core-owned enemy unit lifecycle", () => {
    const unit = new EnemyUnitFactory().create({ grade: "normal", level: 1, modifier: null });
    const parent = new THREE.Group();
    const events: string[] = [];
    unit.subscribeEnemy((event) => events.push(event.type));
    unit.dispatchEnemy({ type: "spawn", parent });
    expect(parent.children).toContain(unit.view.group);
    unit.dispatchEnemy({ type: "sync", snapshot: { grade: "boss", level: 35, modifier: null } });
    expect(unit.spec.body).toBe("boss-hydra");
    unit.dispatchEnemy({ type: "hit" });
    unit.dispatchEnemy({ type: "critical" });
    unit.dispatchEnemy({ type: "death" });
    expect(unit.view.group.getObjectByName("enemy-body-boss-hydra")?.userData.lastCommand).toBe(
      "death",
    );
    unit.dispatchEnemy({ type: "dispose" });
    unit.dispatchEnemy({ type: "dispose" });
    expect(unit.view.group.parent).toBeNull();
    expect(events).toEqual(["spawned", "synchronized", "hit", "critical", "death", "disposed"]);
  });

  it("requires and seals a complete enemy model-view-controller composition", () => {
    const builder = new EnemyUnitBuilder();
    expect(() => builder.build()).toThrow("requires a model");
    const unit = new EnemyUnitFactory().create({ grade: "normal", level: 1, modifier: null });
    expect(unit.model.snapshot.level).toBe(1);
    expect(unit.controller.composes(unit.model, unit.view)).toBe(true);
  });
});
