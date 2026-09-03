import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

import {
  BATTLEFIELD_EFFECT_CONFIG,
  MAX_ACTIVE_EFFECTS,
  effectEvictions,
} from "../../game/battlefield/effects";
import { ENEMY_MODIFIERS } from "../../domain/combat";
import { ENEMY_VISUAL_GRADE_CUES } from "../../game/enemy-visual/spec";
import { enemyVisualCompositionReceipt } from "../../game/enemy-visual/receipt";
import { enemyBodyFactories } from "../../game/enemy-visual/bodies";
import { UNIT_FACTORIES } from "../../game/units/factories";
import {
  allLabCases,
  compositionReceiptForCase,
  firstReachableLabCase,
  inputForCase,
  LAB_AFFINITIES,
  LAB_FAMILIES,
  LAB_GRADES,
  LAB_MODIFIERS,
  reachableLabCases,
  toggleGoldenLabCase,
  reconcileLabFamily,
} from "./catalog";
import { DEFAULT_LAB_CASE, parseLabCase, serializeLabCase } from "./case-url";
import {
  advanceLabRecipe,
  attachLabRecipe,
  LAB_RECIPES,
  type LabRecipe,
  validateLabRecipe,
} from "./recipes";
import { createEffectHarness, observeResourceDisposal, resourceCounts } from "./resource-ledger";

const assertOrbitalBounds = (candidate: THREE.Object3D, bodyBounds: THREE.Box3): void => {
  const candidateBounds = new THREE.Box3().setFromObject(candidate);
  {
    const bodySize = bodyBounds.getSize(new THREE.Vector3());
    const candidateSize = candidateBounds.getSize(new THREE.Vector3());
    expect(candidateSize.x).toBeLessThanOrEqual(bodySize.x * 1.5);
  }
};

const assertElementalSpines = (candidate: THREE.Object3D, bossBody: THREE.Mesh): void => {
  const spines = candidate.children.filter(
    (node): node is THREE.Mesh => node instanceof THREE.Mesh,
  );
  expect(spines).toHaveLength(18);
  spines.forEach((spine) => {
    expect(spine.geometry).toBeInstanceOf(THREE.ConeGeometry);
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(
      spine.getWorldQuaternion(new THREE.Quaternion()),
    );
    const base = new THREE.Vector3(0, -0.275, 0).applyMatrix4(spine.matrixWorld);
    const hit = new THREE.Raycaster(
      base.clone().addScaledVector(axis, 2),
      axis.clone().negate(),
    ).intersectObject(bossBody, false)[0];
    if (hit === undefined || hit.face === null || hit.face === undefined)
      throw new Error("Expected canonical boss-body ray hit");
    const normal = hit.face.normal
      .clone()
      .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(bossBody.matrixWorld))
      .normalize();
    expect(hit.object).toBe(bossBody);
    expect(base.distanceTo(hit.point)).toBeLessThan(0.15);
    expect(axis.dot(normal)).toBeGreaterThan(0.94);
  });
};

const assertCandidateSilhouette = (
  recipe: LabRecipe,
  candidate: THREE.Object3D,
  bodyBounds: THREE.Box3,
  bossBody: THREE.Mesh,
): void => {
  if (recipe === "orbital-runes") assertOrbitalBounds(candidate, bodyBounds);
  if (
    recipe === "crystal-crown" &&
    !(candidate.getObjectByName("lab-crystal-crown-1") instanceof THREE.Mesh)
  )
    throw new Error("Expected crown center crystal");
  if (recipe === "crystal-crown")
    expect(new THREE.Box3().setFromObject(candidate).min.y).toBeGreaterThan(bodyBounds.max.y);
  if (recipe === "elemental-spines") {
    expect(candidate.parent?.name).toMatch(/-orbit$/);
    assertElementalSpines(candidate, bossBody);
  }
};

describe("visual lab cases", () => {
  it("round-trips a bounded reproducible case and defaults invalid inputs", () => {
    expect(parseLabCase(serializeLabCase(DEFAULT_LAB_CASE))).toEqual(DEFAULT_LAB_CASE);
    expect(parseLabCase("?family=nope&variant=91&golden=wat")).toMatchObject({
      ...DEFAULT_LAB_CASE,
      correction: { requested: "?family=nope&variant=91&golden=wat" },
    });
    expect(parseLabCase("?family=beetle&grade=boss&modifier=nope&variant=2")).toMatchObject({
      ...DEFAULT_LAB_CASE,
      correction: { requested: "?family=beetle&grade=boss&modifier=nope&variant=2" },
    });
    expect(parseLabCase("?recipe=socket-probe").recipe).toBe("socket-probe");
    expect(parseLabCase("?recipe=unbounded").recipe).toBe("production");
    expect(parseLabCase("?recipe=crystal-crown")).toMatchObject({
      recipe: "crystal-crown",
      correction: { requested: "?recipe=crystal-crown" },
    });
    expect(parseLabCase("?golden=1&affinity=ice")).toMatchObject({
      goldenBug: true,
      affinity: "cinder",
      family: "beetle",
      correction: {
        canonical: expect.stringContaining("affinity=cinder"),
      },
    });
    expect(parseLabCase("?family=boss-colossus&grade=boss&recipe=crystal-crown")).toMatchObject({
      family: "boss-colossus",
      recipe: "crystal-crown",
    });
    expect(parseLabCase("?subject=player&stage=36365")).toMatchObject({
      subject: "player",
      playerStage: 36_365,
      playerLevel: 36_365,
    });
    expect(parseLabCase("?subject=player&level=50000")).toMatchObject({
      subject: "player",
      playerLevel: 50_000,
    });
    expect(parseLabCase("?subject=player&level=100001")).toMatchObject({
      playerLevel: 100_000,
    });
    expect(parseLabCase("?subject=player&stage=2")).toMatchObject({ playerStage: 1 });
    expect(parseLabCase("?subject=player&stage=1000&detail=1600")).toMatchObject({
      playerDetailLevel: 1_600,
    });
    expect(parseLabCase("?subject=player&stage=1000&detail=1700")).toMatchObject({
      playerDetailLevel: 1_000,
    });
    expect(parseLabCase("?subject=player&stage=500&detail=2000")).toMatchObject({
      playerStage: 500,
      playerDetailLevel: 1_000,
    });
    expect(LAB_RECIPES).toEqual([
      "production",
      "legacy/no-overlay",
      "socket-probe",
      "crystal-crown",
      "orbital-runes",
      "elemental-spines",
    ]);
  });

  it("keeps every selectable composition reachable across all affinities", () => {
    for (const known of allLabCases()) {
      if (known.goldenBug) continue;
      for (const affinity of LAB_AFFINITIES) {
        expect(() => inputForCase({ ...known, affinity })).not.toThrow();
      }
    }
  });
  it("rejects boss-only recipes for ordinary enemies without allocating geometry", () => {
    const ordinary = allLabCases().find((candidate) => candidate.grade === "normal");
    if (ordinary === undefined) throw new Error("Expected ordinary case");
    const candidates = [
      ["crystal-crown", "overhead", "OctahedronGeometry"],
      ["orbital-runes", "orbit", "TorusGeometry"],
      ["elemental-spines", "orbit", "ConeGeometry"],
    ] as const satisfies readonly [LabRecipe, string, string][];
    for (const [recipe] of candidates) {
      const unit = UNIT_FACTORIES.enemy.create(inputForCase(ordinary));
      const parent = new THREE.Group();
      const baseline = resourceCounts(parent);
      unit.dispatchEnemy({ type: "spawn", parent });
      attachLabRecipe(recipe, unit.view.group)();
      expect(unit.view.group.getObjectByName(`lab-recipe-${recipe}`)).toBeUndefined();
      unit.dispose();
      expect(resourceCounts(parent)).toEqual(baseline);
    }
    expect(validateLabRecipe("legacy/no-overlay", ordinary.family)).toEqual({ valid: true });
    expect(validateLabRecipe("crystal-crown", ordinary.family)).toMatchObject({
      valid: false,
      reason: expect.stringContaining("boss-only"),
    });
  });

  it("keeps legacy boss mode free of production geometry and resource leaks", () => {
    const boss = allLabCases().find(
      (candidate) => candidate.family === "boss-hydra" && candidate.grade === "boss",
    );
    if (boss === undefined) throw new Error("Expected Hydra case");
    const parent = new THREE.Group();
    const baseline = resourceCounts(parent);
    const unit = UNIT_FACTORIES.enemy.create(inputForCase(boss), {
      compositionMode: "legacy/no-overlay",
    });
    unit.dispatchEnemy({ type: "spawn", parent });
    expect(unit.view.group.getObjectByName("boss-geometry-crystal-crown")).toBeUndefined();
    const detach = attachLabRecipe("legacy/no-overlay", unit.view.group);
    detach();
    unit.dispose();
    expect(resourceCounts(parent)).toEqual(baseline);
  });

  it("attaches bounded boss recipes across Hydra and Colossus motions and disposes them exactly", () => {
    const bosses = (["boss-colossus", "boss-hydra"] as const).map((family) =>
      allLabCases().find((candidate) => candidate.grade === "boss" && candidate.family === family),
    );
    if (bosses.some((candidate) => candidate === undefined)) throw new Error("Expected boss cases");
    const candidates = [
      ["crystal-crown", "overhead", "OctahedronGeometry"],
      ["orbital-runes", "orbit", "TorusGeometry"],
      ["elemental-spines", "orbit", "ConeGeometry"],
    ] as const satisfies readonly [LabRecipe, string, string][];
    for (const input of bosses) {
      if (input === undefined) continue;
      for (const [recipe, anchor, geometry] of candidates) {
        const unit = UNIT_FACTORIES.enemy.create(inputForCase(input));
        const parent = new THREE.Group();
        const baseline = resourceCounts(parent);
        unit.dispatchEnemy({ type: "spawn", parent });
        unit.view.group.updateMatrixWorld(true);
        const bodyBounds = new THREE.Box3().setFromObject(unit.view.group);
        const bossBody = unit.view.group.getObjectByName(`enemy-body-${input.family}`);
        if (!(bossBody instanceof THREE.Mesh)) throw new Error("Expected canonical boss body mesh");
        const detach = attachLabRecipe(recipe, unit.view.group);
        const candidate = unit.view.group.getObjectByName(`lab-recipe-${recipe}`);
        if (candidate === undefined) throw new Error(`Expected ${recipe}`);
        expect(candidate.parent?.name).toMatch(new RegExp(`-${anchor}$`));
        const receipt = observeResourceDisposal(candidate);
        const geometries: string[] = [];
        candidate.traverse((node) => {
          expect(Number.isFinite(node.position.x)).toBe(true);
          if (node instanceof THREE.Mesh) geometries.push(node.geometry.type);
        });
        expect(geometries).toContain(geometry);
        assertCandidateSilhouette(recipe, candidate, bodyBounds, bossBody);
        if (recipe === "elemental-spines" && input.family === "boss-hydra") {
          expect(unit.view.group.getObjectByName("enemy-part-hydra-head-1")).toBeDefined();
          expect(unit.view.group.getObjectByName("boss-crown")).toBeDefined();
          expect(candidate.parent?.name).toBe("enemy-socket-boss-hydra-orbit");
        }
        (["hit", "death"] as const).forEach((type) => {
          unit.dispatchEnemy({ type });
          for (let frame = 0; frame < 16; frame += 1) unit.tick();
        });
        unit.view.group.updateMatrixWorld(true);
        expect(new THREE.Box3().setFromObject(candidate).isEmpty()).toBe(false);
        detach();
        detach();
        expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
        unit.dispose();
        expect(resourceCounts(parent)).toEqual(baseline);
      }
    }
    const fallback = new THREE.Group();
    attachLabRecipe("orbital-runes", fallback)();
    expect(fallback.getObjectByName("lab-recipe-orbital-runes")).toBeUndefined();
  });

  it("spins each rune around its local wheel axis and respects reduced motion", () => {
    const boss = allLabCases().find(
      (candidate) => candidate.grade === "boss" && candidate.family === "boss-colossus",
    );
    if (boss === undefined) throw new Error("Expected Colossus case");
    const unit = UNIT_FACTORIES.enemy.create(inputForCase(boss));
    unit.dispatchEnemy({ type: "spawn", parent: new THREE.Group() });
    const detach = attachLabRecipe("orbital-runes", unit.view.group);
    const rune = unit.view.group.getObjectByName("lab-orbital-rune-0");
    if (!(rune instanceof THREE.Mesh)) throw new Error("Expected orbital rune");
    const before = rune.quaternion.clone();
    advanceLabRecipe("orbital-runes", unit.view.group, false);
    expect(rune.quaternion.toArray()).not.toEqual(before.toArray());
    const moving = rune.quaternion.clone();
    advanceLabRecipe("orbital-runes", unit.view.group, true);
    expect(rune.quaternion.toArray()).toEqual(moving.toArray());
    detach();
    unit.dispose();
  });

  it("derives every selectable family, grade, and modifier from production registries", () => {
    expect([...LAB_FAMILIES].sort()).toEqual(Object.keys(enemyBodyFactories).sort());
    expect([...LAB_GRADES].sort()).toEqual(Object.keys(ENEMY_VISUAL_GRADE_CUES).sort());
    expect(LAB_MODIFIERS).toEqual([null, ...Object.keys(ENEMY_MODIFIERS), "wealth"]);
    expect(reachableLabCases({ family: "beetle", grade: "boss" })).toEqual([]);
    expect(reachableLabCases({ family: "boss-hydra", grade: "boss" }).length).toBeGreaterThan(0);
    expect(reachableLabCases({ family: "boss-hydra", goldenBug: true })).toEqual([]);
    expect(firstReachableLabCase({ family: "boss-hydra", goldenBug: true })).toMatchObject({
      family: "beetle",
      goldenBug: false,
    });
    const hydra = firstReachableLabCase({ family: "boss-hydra", grade: "boss" });
    const golden = toggleGoldenLabCase(hydra, true);
    expect(golden).toEqual({
      affinity: "cinder",
      family: "beetle",
      grade: "normal",
      modifier: null,
      variant: 0,
      goldenBug: true,
    });
    expect(serializeLabCase({ ...DEFAULT_LAB_CASE, ...golden })).toContain("golden=1");
    const returned = toggleGoldenLabCase(golden, false);
    expect(returned).toMatchObject({
      goldenBug: false,
    });
    expect(serializeLabCase({ ...DEFAULT_LAB_CASE, ...returned })).toContain("golden=0");
  });

  it("reconciles family transitions from the requested family in catalog order", () => {
    const hydra = firstReachableLabCase({ family: "boss-hydra", grade: "boss" });
    const colossus = reconcileLabFamily(hydra, "boss-colossus");
    expect(colossus.family).toBe("boss-colossus");
    expect(colossus.affinity).toBe(hydra.affinity);
    expect(reachableLabCases(colossus)).toEqual([colossus]);
    expect(reconcileLabFamily(hydra, "boss-colossus")).toEqual(colossus);

    const ordinary = firstReachableLabCase({
      family: "beetle",
      grade: "normal",
      modifier: null,
      variant: 0,
    });
    const mantis = reconcileLabFamily(ordinary, "mantis");
    expect(mantis.family).toBe("mantis");
    expect(mantis.affinity).toBe(ordinary.affinity);
    expect(mantis.modifier).toBe("hardened");
    expect(reachableLabCases(mantis)).toEqual([mantis]);
  });

  it("reopens every affinity through the production resolver", () => {
    for (const affinity of LAB_AFFINITIES) {
      const labCase = firstReachableLabCase({
        affinity,
        family: "beetle",
        grade: "normal",
        modifier: null,
        variant: 0,
      });
      expect(
        reachableLabCases({
          affinity,
          family: "beetle",
          grade: "normal",
          modifier: null,
          variant: 0,
        }),
      ).not.toHaveLength(0);
      const receipt = compositionReceiptForCase(labCase);
      expect(receipt.affinity).toBe(affinity);
      const reopened = parseLabCase(serializeLabCase({ ...DEFAULT_LAB_CASE, ...labCase }));
      expect(reopened.affinity).toBe(affinity);
    }
  });
  it("derives the same typed receipt as production for every reachable lab case", () => {
    for (const labCase of allLabCases()) {
      const labInput = inputForCase(labCase);
      const production = enemyVisualCompositionReceipt(labInput);
      const lab = compositionReceiptForCase(labCase);
      expect(lab).toEqual(production);
      expect(lab.input).toEqual(labInput);
      if (lab.family.startsWith("boss-")) expect(lab.geometryProfile).not.toBe("legacy/no-overlay");
      else expect(lab.geometryProfile).toBe("legacy/no-overlay");
    }
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
