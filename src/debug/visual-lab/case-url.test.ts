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
import {
  allLabCases,
  firstReachableLabCase,
  inputForCase,
  LAB_FAMILIES,
  LAB_GRADES,
  LAB_MODIFIERS,
  reachableLabCases,
  toggleGoldenLabCase,
} from "./catalog";
import { DEFAULT_LAB_CASE, parseLabCase, serializeLabCase } from "./case-url";
import { attachLabRecipe, LAB_RECIPES, type LabRecipe } from "./recipes";
import { createEffectHarness, observeResourceDisposal, resourceCounts } from "./resource-ledger";

const assertOrbitalBounds = (candidate: THREE.Object3D, bodyBounds: THREE.Box3): void => {
  const candidateBounds = new THREE.Box3().setFromObject(candidate);
  {
    const bodySize = bodyBounds.getSize(new THREE.Vector3());
    const candidateSize = candidateBounds.getSize(new THREE.Vector3());
    expect(candidateSize.x).toBeLessThanOrEqual(bodySize.x * 1.5);
  }
};

const assertElementalSpines = (candidate: THREE.Object3D, bodyBounds: THREE.Box3): void => {
  const candidateBounds = new THREE.Box3().setFromObject(candidate);
  const center = candidate.getObjectByName("lab-elemental-spine-1");
  if (!(center instanceof THREE.Mesh) || !(center.geometry instanceof THREE.ConeGeometry))
    throw new Error("Expected upright cone spine");
  expect(center.rotation.x).toBeCloseTo(0);
  center.updateWorldMatrix(true, false);
  const outward = candidate.parent
    ?.getWorldPosition(new THREE.Vector3())
    .sub(bodyBounds.getCenter(new THREE.Vector3()))
    .normalize();
  if (outward === undefined) throw new Error("Expected elemental spine socket");
  const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
    center.getWorldQuaternion(new THREE.Quaternion()),
  );
  expect(worldUp.dot(outward)).toBeGreaterThan(0.97);
  const projection = (bounds: THREE.Box3, maximum: boolean): number => {
    const corners = [bounds.min, bounds.max];
    const values = corners.flatMap((x) =>
      corners.flatMap((y) => corners.map((z) => new THREE.Vector3(x.x, y.y, z.z).dot(outward))),
    );
    return maximum ? Math.max(...values) : Math.min(...values);
  };
  const ray = new THREE.Raycaster(
    candidate.parent?.getWorldPosition(new THREE.Vector3()).addScaledVector(outward, -10) ??
      bodyBounds.getCenter(new THREE.Vector3()),
    outward,
  );
  let root: THREE.Object3D = candidate;
  while (root.parent !== null) root = root.parent;
  const hit = ray
    .intersectObject(root, true)
    .filter((entry) => {
      let node: THREE.Object3D | null = entry.object;
      while (node !== null) {
        if (node === candidate) return false;
        node = node.parent;
      }
      return true;
    })
    .at(-1);
  if (hit === undefined) throw new Error("Expected body surface ray hit");
  expect(Math.abs(projection(candidateBounds, false) - hit.point.dot(outward))).toBeLessThan(0.03);
};

const assertCandidateSilhouette = (
  recipe: LabRecipe,
  candidate: THREE.Object3D,
  bodyBounds: THREE.Box3,
): void => {
  if (recipe === "orbital-runes") assertOrbitalBounds(candidate, bodyBounds);
  if (
    recipe === "crystal-crown" &&
    !(candidate.getObjectByName("lab-crystal-crown-1") instanceof THREE.Mesh)
  )
    throw new Error("Expected crown center crystal");
  if (recipe === "elemental-spines") assertElementalSpines(candidate, bodyBounds);
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
    expect(parseLabCase("?recipe=crystal-crown").recipe).toBe("crystal-crown");
    expect(parseLabCase("?subject=player&stage=36365")).toMatchObject({
      subject: "player",
      playerStage: 36_365,
    });
    expect(parseLabCase("?subject=player&stage=2")).toMatchObject({ playerStage: 1 });
    expect(LAB_RECIPES).toEqual([
      "production",
      "socket-probe",
      "crystal-crown",
      "orbital-runes",
      "elemental-spines",
    ]);
  });

  it("attaches distinct bounded candidate recipes to production sockets and disposes them exactly", () => {
    const ordinary = allLabCases().find((candidate) => candidate.grade === "normal");
    const boss = allLabCases().find(
      (candidate) => candidate.grade === "boss" && candidate.family === "boss-hydra",
    );
    if (ordinary === undefined || boss === undefined)
      throw new Error("Expected ordinary and boss cases");
    const candidates = [
      ["crystal-crown", "overhead", "OctahedronGeometry"],
      ["orbital-runes", "orbit", "TorusGeometry"],
      ["elemental-spines", "overhead", "ConeGeometry"],
    ] as const satisfies readonly [LabRecipe, string, string][];
    for (const input of [ordinary, boss]) {
      for (const [recipe, anchor, geometry] of candidates) {
        const unit = UNIT_FACTORIES.enemy.create(inputForCase(input));
        const parent = new THREE.Group();
        const baseline = resourceCounts(parent);
        unit.dispatchEnemy({ type: "spawn", parent });
        unit.view.group.updateMatrixWorld(true);
        const bodyBounds = new THREE.Box3().setFromObject(unit.view.group);
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
        assertCandidateSilhouette(recipe, candidate, bodyBounds);
        detach();
        detach();
        expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
        unit.dispose();
        expect(resourceCounts(parent)).toEqual(baseline);
      }
    }
    const fallback = new THREE.Group();
    const detach = attachLabRecipe("orbital-runes", fallback);
    expect(fallback.getObjectByName("lab-recipe-orbital-runes")?.parent).toBe(fallback);
    detach();
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
