import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

import {
  BATTLEFIELD_EFFECT_CONFIG,
  MAX_ACTIVE_EFFECTS,
  effectEvictions,
} from "../../game/battlefield/effects";
import { ENEMY_MODIFIERS } from "../../domain/combat";
import { enemyBodyFactories } from "../../game/enemy-visual/bodies";
import { ENEMY_VISUAL_GRADE_CUES } from "../../game/enemy-visual/spec";
import { UNIT_FACTORIES } from "../../game/units/factories";
import { allLabCases, inputForCase, LAB_FAMILIES, LAB_GRADES, LAB_MODIFIERS } from "./catalog";
import { DEFAULT_LAB_CASE, parseLabCase, serializeLabCase } from "./case-url";
import { attachLabRecipe, LAB_RECIPES } from "./recipes";
import { createEffectHarness, observeResourceDisposal, resourceCounts } from "./resource-ledger";

describe("visual lab cases", () => {
  it("round-trips a bounded reproducible case and defaults invalid inputs", () => {
    expect(parseLabCase(serializeLabCase(DEFAULT_LAB_CASE))).toEqual(DEFAULT_LAB_CASE);
    expect(parseLabCase("?family=nope&variant=91&golden=wat")).toEqual(DEFAULT_LAB_CASE);
    expect(parseLabCase("?family=beetle&grade=boss&modifier=nope&variant=2")).toEqual(
      DEFAULT_LAB_CASE,
    );
    expect(parseLabCase("?recipe=socket-probe").recipe).toBe("socket-probe");
    expect(parseLabCase("?recipe=unbounded").recipe).toBe("production");
    expect(LAB_RECIPES).toEqual(["production", "socket-probe"]);
  });

  it("derives every selectable family, grade, and modifier from production registries", () => {
    expect([...LAB_FAMILIES].sort()).toEqual(Object.keys(enemyBodyFactories).sort());
    expect([...LAB_GRADES].sort()).toEqual(Object.keys(ENEMY_VISUAL_GRADE_CUES).sort());
    expect(LAB_MODIFIERS).toEqual([null, ...Object.keys(ENEMY_MODIFIERS), "wealth"]);
  });

  it("replays the production spawn command through EnemyUnit until it completes", () => {
    const unit = UNIT_FACTORIES.enemy.create(inputForCase(allLabCases()[0] ?? DEFAULT_LAB_CASE));
    const parent = new THREE.Group();
    unit.dispatchEnemy({ type: "spawn", parent });
    const body = unit.view.group.getObjectByName(`enemy-body-${unit.spec.body}`);
    const pose = unit.view.group.getObjectByName(`enemy-pose-${unit.spec.body}`);
    if (!(body instanceof THREE.Mesh) || pose === undefined)
      throw new Error("Expected production body");
    const neutral = pose.scale.clone();
    for (let frame = 0; frame < 16; frame += 1) unit.tick();
    expect(body.userData.lastCommand).toBe("spawn");
    expect(pose.scale).toEqual(neutral);
    unit.dispose();
  });

  it("constructs, animates, and disposes every selectable production visual serially in both motion modes", () => {
    const cases = allLabCases();
    expect(cases.length).toBeGreaterThan(20);
    for (const labCase of cases) {
      for (const reducedMotion of [false, true]) {
        const unit = UNIT_FACTORIES.enemy.create({ ...inputForCase(labCase), reducedMotion });
        const parent = new THREE.Group();
        const baseline = resourceCounts(parent);
        unit.dispatchEnemy({ type: "spawn", parent });
        const detachRecipe = attachLabRecipe("socket-probe", unit.view.group);
        const receipt = observeResourceDisposal(unit.view.group);
        const pose = unit.view.group.getObjectByName(`enemy-pose-${unit.spec.body}`);
        if (pose === undefined) throw new Error("Expected production pose");
        const neutral = {
          position: pose.position.clone(),
          rotation: pose.rotation.clone(),
          scale: pose.scale.clone(),
        };
        (["hit", "critical", "death"] as const).forEach((type) => {
          unit.dispatchEnemy({ type });
          for (let frame = 0; frame < 16; frame += 1) unit.tick();
        });
        if (reducedMotion) {
          expect(pose.position).toEqual(neutral.position);
          expect([pose.rotation.x, pose.rotation.y, pose.rotation.z]).toEqual([
            neutral.rotation.x,
            neutral.rotation.y,
            neutral.rotation.z,
          ]);
          expect(pose.scale).toEqual(neutral.scale);
        }
        unit.view.group.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(unit.view.group);
        expect(bounds.isEmpty()).toBe(false);
        expect(Number.isFinite(bounds.max.y)).toBe(true);
        unit.view.group.traverse((node) => {
          expect(Number.isFinite(node.position.x)).toBe(true);
          expect(Number.isFinite(node.position.y)).toBe(true);
          expect(Number.isFinite(node.position.z)).toBe(true);
          expect(Number.isFinite(node.scale.x)).toBe(true);
          expect(Number.isFinite(node.rotation.x)).toBe(true);
        });
        detachRecipe();
        unit.dispatchEnemy({ type: "dispose" });
        unit.dispatchEnemy({ type: "dispose" });
        expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
        expect(unit.view.group.parent).toBeNull();
        expect(resourceCounts(parent)).toEqual(baseline);
      }
    }
  });

  it("caps, advances, evicts, and disposes lab-owned effects with exact receipts", () => {
    expect(effectEvictions(MAX_ACTIVE_EFFECTS, 1)).toBe(1);
    expect(effectEvictions(0, MAX_ACTIVE_EFFECTS)).toBe(0);
    const harness = createEffectHarness();
    const parent = new THREE.Group();
    const baseline = resourceCounts(parent);
    const kinds = Object.keys(BATTLEFIELD_EFFECT_CONFIG.variants) as Array<
      keyof typeof BATTLEFIELD_EFFECT_CONFIG.variants
    >;
    for (let index = 0; index <= MAX_ACTIVE_EFFECTS; index += 1)
      harness.add(kinds[index % kinds.length] ?? "hit", false, undefined, parent);
    expect(harness.size).toBe(MAX_ACTIVE_EFFECTS);
    for (let frame = 0; frame < 24; frame += 1) harness.advance();
    expect(harness.size).toBe(0);
    harness.dispose();
    expect(harness.disposalReceipts.length).toBe(MAX_ACTIVE_EFFECTS + 1);
    harness.disposalReceipts.forEach((receipt) =>
      expect(receipt.disposed).toBe(receipt.expectedDisposals),
    );
    expect(resourceCounts(parent)).toEqual(baseline);
  });

  it("uses matchMedia when reduced motion is omitted for every body family", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    try {
      LAB_FAMILIES.forEach((family) => {
        const labCase = allLabCases().find((candidate) => candidate.family === family);
        if (labCase === undefined) throw new Error(`Missing ${family} lab case`);
        const unit = UNIT_FACTORIES.enemy.create(inputForCase(labCase));
        const pose = unit.view.group.getObjectByName(`enemy-pose-${family}`);
        if (pose === undefined) throw new Error(`Missing ${family} pose`);
        const position = pose.position.clone();
        unit.tick();
        expect(pose.position).toEqual(position);
        unit.dispose();
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
