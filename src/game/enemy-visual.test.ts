import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

import {
  createEnemyVisual,
  EnemyViewBuilder,
  enemyBodyFactories,
  enemyVisualSpec,
  stableEnemySeed,
  type EnemyVisual,
  type EnemyVisualInput,
} from "./enemy-visual";
import { component } from "./enemy-visual/components";
import { enemyVisualTransforms } from "./enemy-visual/config";
import { profileCueScale } from "./enemy-visual/spec";
import {
  decorateGrade,
  decorateModifier,
  decorateSeededDecoration,
} from "./enemy-visual/decorators";
import { observeResourceDisposal, resourceCounts } from "../debug/visual-lab/resource-ledger";
import { EnemyUnitBuilder, EnemyUnitFactory, type EnemyUnit } from "./units/enemy";

const meshCount = (visual: ReturnType<typeof createEnemyVisual>): number => {
  let count = 0;
  visual.group.traverse((node) => {
    if (node instanceof THREE.Mesh) count += 1;
  });
  return count;
};

const assertMantisBandAttachment = (
  family: string,
  visual: ReturnType<typeof createEnemyVisual>,
): void => {
  if (family !== "mantis") return;
  const band = visual.group.getObjectByName("reinforced-band");
  if (band === undefined) throw new Error("Expected hardened Mantis band");
  expect(band.position.toArray()).toEqual([0, 0, 0]);
};

const shippedInputs = [
  { grade: "normal", level: 1, modifier: null },
  { grade: "veteran", level: 2, modifier: null },
  { grade: "elite", level: 3, modifier: "armor" },
  { grade: "elite", level: 3, modifier: "hardened" },
  { grade: "elite", level: 3, modifier: "critical-guard" },
  { grade: "elite", level: 3, modifier: "manual-guard" },
  { grade: "boss", level: 35, modifier: null },
  { grade: "boss", level: 70, modifier: null },
] as const satisfies readonly EnemyVisualInput[];

const namedMesh = (visual: ReturnType<typeof createEnemyVisual>, prefix: string): THREE.Mesh => {
  let result: THREE.Mesh | undefined;
  visual.group.traverse((node) => {
    if (result === undefined && node instanceof THREE.Mesh && node.name.startsWith(prefix))
      result = node;
  });
  if (result === undefined) throw new Error(`Expected ${prefix}`);
  return result;
};

const requiredNode = (
  visual: ReturnType<typeof createEnemyVisual>,
  name: string,
): THREE.Object3D => {
  const node = visual.group.getObjectByName(name);
  if (node === undefined) throw new Error(`Expected ${name}`);
  return node;
};

const poseState = (pose: THREE.Object3D): readonly [THREE.Vector3, THREE.Euler, THREE.Vector3] => [
  pose.position.clone(),
  pose.rotation.clone(),
  pose.scale.clone(),
];

const expectFinitePose = (state: readonly [THREE.Vector3, THREE.Euler, THREE.Vector3]): void => {
  const [position, rotation, scale] = state;
  expect(position.toArray().every(Number.isFinite)).toBe(true);
  expect([rotation.x, rotation.y, rotation.z].every(Number.isFinite)).toBe(true);
  expect(scale.toArray().every(Number.isFinite)).toBe(true);
};

const rotationDelta = (left: THREE.Euler, right: THREE.Euler): number =>
  Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);

const sampleReaction = (
  unit: EnemyUnit,
  pose: THREE.Object3D,
  command: "hit" | "critical",
  frames: number,
): void => {
  const neutral = poseState(pose);
  unit.dispatchEnemy({ type: command });
  const samples = Array.from({ length: frames }, () => {
    unit.tick();
    return poseState(pose);
  });
  unit.tick();
  const nextNeutral = poseState(pose);
  expect(samples[0]).toEqual(neutral);
  expect(samples[1]?.[2].y).toBeLessThan(neutral[2].y);
  expect(samples[frames - 2]?.[2].y).toBeLessThan(neutral[2].y);
  expect(samples[frames - 1]?.[1]).toEqual(neutral[1]);
  expect(samples[frames - 1]?.[2]).toEqual(neutral[2]);
  expect(nextNeutral[1]).toEqual(neutral[1]);
  expect(nextNeutral[2]).toEqual(neutral[2]);
  [...samples, nextNeutral].forEach(expectFinitePose);
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (previous === undefined || current === undefined) continue;
    expect(current[0].distanceTo(previous[0])).toBeLessThan(0.25);
    expect(rotationDelta(current[1], previous[1])).toBeLessThan(0.5);
    expect(current[2].distanceTo(previous[2])).toBeLessThan(0.35);
  }
};

type CueAnchor =
  "pose" | "head" | "top" | "overhead" | "front" | "left" | "right" | "flank" | "orbit";
type CueFixture = {
  readonly label: string;
  readonly input: EnemyVisualInput;
  readonly anchor: CueAnchor;
  readonly orientation: "flat" | "tilted" | "free";
  readonly maxRatio?: number;
  readonly minOffset?: number;
  readonly surroundsBody?: boolean;
  readonly select: (visual: ReturnType<typeof createEnemyVisual>) => THREE.Mesh;
};

const findCueInput = (matches: (spec: ReturnType<typeof enemyVisualSpec>) => boolean) => {
  const grades = ["normal", "veteran", "elite", "boss"] as const;
  const modifiers = [
    null,
    "armor",
    "health",
    "automatic-slow",
    "wealth",
    "hardened",
    "critical-guard",
    "manual-guard",
  ] as const;
  for (const grade of grades)
    for (const modifier of modifiers)
      for (let level = 1; level <= 120; level += 1) {
        const input: EnemyVisualInput = { grade, level, modifier };
        if (matches(enemyVisualSpec(input))) return input;
      }
  throw new Error("Expected a reachable cue fixture");
};

const findCueInputs = (
  matches: (spec: ReturnType<typeof enemyVisualSpec>) => boolean,
): readonly EnemyVisualInput[] => {
  const matchesByFamilyProfile = new Map<string, EnemyVisualInput>();
  const grades = ["normal", "veteran", "elite", "boss"] as const;
  const modifiers = [
    null,
    "armor",
    "health",
    "automatic-slow",
    "wealth",
    "hardened",
    "critical-guard",
    "manual-guard",
  ] as const;
  for (const grade of grades)
    for (const modifier of modifiers)
      for (let level = 1; level <= 120; level += 1) {
        const input: EnemyVisualInput = { grade, level, modifier };
        const spec = enemyVisualSpec(input);
        if (matches(spec))
          matchesByFamilyProfile.set(`${spec.body}:${spec.profile.variant}`, input);
      }
  return [...matchesByFamilyProfile.values()];
};

const inputsForCueLabel = (label: string): readonly EnemyVisualInput[] => {
  if (label.startsWith("decoration-")) {
    const decoration = (["fins", "horns", "orbitals", "satellites", "scar"] as const).find(
      (candidate) => label === `decoration-${candidate}`,
    );
    if (decoration === undefined) throw new Error(`Unknown decoration fixture ${label}`);
    return findCueInputs((spec) => spec.decorations.includes(decoration));
  }
  if (label === "grade-crest") return findCueInputs((spec) => spec.gradeCue === "crest");
  if (label === "grade-spikes") return findCueInputs((spec) => spec.gradeCue === "spikes");
  if (label === "grade-crown") return findCueInputs((spec) => spec.gradeCue === "crown");
  return findCueInputs((spec) => spec.modifierCue === label);
};

const cueAncestors = (cue: THREE.Mesh): readonly THREE.Object3D[] => {
  const ancestors: THREE.Object3D[] = [];
  for (let node = cue.parent; node !== null; node = node.parent) ancestors.push(node);
  return ancestors;
};

const expectedCueAnchor = (
  fixture: CueFixture,
  visual: ReturnType<typeof createEnemyVisual>,
  pose: THREE.Object3D,
): THREE.Object3D | undefined => {
  if (fixture.anchor === "pose") return pose;
  if (fixture.label === "decoration-fins") {
    const side = visual.spec.decorations.indexOf("fins") === 0 ? "left" : "right";
    return visual.group.getObjectByName(`enemy-socket-${visual.spec.body}-${side}`);
  }
  if (fixture.anchor === "head")
    return visual.group.getObjectByName(
      {
        beetle: "enemy-part-beetle-head",
        brute: "enemy-part-brute-head",
        wisp: "enemy-body-wisp",
        mantis: "enemy-part-mantis-head",
        sentinel: "enemy-part-sentinel-visor",
        drake: "enemy-part-drake-head",
        "boss-colossus": "enemy-part-colossus-head",
        "boss-hydra": "enemy-part-hydra-head-1",
        "boss-catbug": "enemy-part-colossus-head",
        "boss-evil-catbug": "enemy-part-hydra-head-1",
      }[visual.spec.body],
    );
  return visual.group.getObjectByName(`enemy-socket-${visual.spec.body}-${fixture.anchor}`);
};

const assertCueOrientation = (fixture: CueFixture, cue: THREE.Mesh): void => {
  if (fixture.orientation === "flat")
    expect(Math.abs(cue.rotation.x), fixture.label).toBeCloseTo(Math.PI / 2);
  if (fixture.orientation === "tilted")
    expect(
      Math.abs(cue.rotation.z) +
        Math.abs(cue.rotation.y) +
        Math.abs(cue.parent?.rotation.z ?? 0) +
        Math.abs(cue.parent?.rotation.y ?? 0),
      fixture.label,
    ).toBeGreaterThan(0);
};

const boxGap = (left: THREE.Box3, right: THREE.Box3): number => {
  const axisGap = (minimum: number, maximum: number, otherMinimum: number, otherMaximum: number) =>
    Math.max(0, minimum - otherMaximum, otherMinimum - maximum);
  return new THREE.Vector3(
    axisGap(left.min.x, left.max.x, right.min.x, right.max.x),
    axisGap(left.min.y, left.max.y, right.min.y, right.max.y),
    axisGap(left.min.z, left.max.z, right.min.z, right.max.z),
  ).length();
};

const meshBounds = (mesh: THREE.Mesh): THREE.Box3 => {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  if (bounds === null) throw new Error(`Expected ${mesh.name} bounds`);
  return bounds.clone().applyMatrix4(mesh.matrixWorld);
};

const isOrbitingCue = (label: string): boolean =>
  label === "decoration-orbitals" ||
  label === "decoration-satellites" ||
  label === "shield-plates" ||
  label === "wealth-orbitals";

const requiresSurfaceClearance = (label: string): boolean =>
  !label.startsWith("grade-") && label !== "decoration-horns" && label !== "decoration-scar";

const expectCueScale = (label: string, cue: THREE.Mesh, profile: EnemyVisualInput): void => {
  if (label === "reinforced-band") {
    const bodyRadius = Number(cue.parent?.userData.bodyRadius) || 0.72;
    expect(cue.scale.x, label).toBeCloseTo(bodyRadius / 0.78);
    return;
  }
  expect(cue.scale.x, label).toBeCloseTo(profileCueScale(enemyVisualSpec(profile).profile));
};

const unitVisual = (unit: EnemyUnit): ReturnType<typeof createEnemyVisual> => ({
  group: unit.view.group,
  spec: unit.spec,
  tick: () => unit.tick(),
  dispose: () => unit.dispose(),
});

const assertLiveCueAttachment = (fixture: CueFixture): void => {
  const unit = new EnemyUnitFactory().create(fixture.input);
  const visual = unitVisual(unit);
  const cue = fixture.select(visual);
  const pose = visual.group.getObjectByName(`enemy-pose-${visual.spec.body}`);
  if (pose === undefined) throw new Error(`Expected ${visual.spec.body} pose`);
  const anchor = expectedCueAnchor(fixture, visual, pose);
  if (anchor === undefined) throw new Error(`Expected ${fixture.label} anchor`);
  const sample = () => {
    visual.group.updateMatrixWorld(true);
    return {
      anchor: anchor.getWorldPosition(new THREE.Vector3()),
      cue: cue.getWorldPosition(new THREE.Vector3()),
    };
  };
  unit.tick();
  const idle = sample();
  unit.dispatchEnemy({ type: "hit" });
  unit.tick();
  unit.tick();
  const peak = sample();
  for (let frame = 0; frame < 3; frame += 1) unit.tick();
  const recovery = sample();
  unit.dispatchEnemy({ type: "death" });
  unit.tick();
  unit.tick();
  const death = sample();
  for (const state of [idle, peak, recovery, death]) {
    expect(state.anchor.toArray().every(Number.isFinite), fixture.label).toBe(true);
    expect(state.cue.toArray().every(Number.isFinite), fixture.label).toBe(true);
  }
  expect(peak.anchor.distanceTo(idle.anchor), fixture.label).toBeGreaterThan(0);
  expect(peak.cue.distanceTo(idle.cue), fixture.label).toBeGreaterThan(0);
  expect(death.anchor.distanceTo(recovery.anchor), fixture.label).toBeGreaterThan(0);
  expect(death.cue.distanceTo(recovery.cue), fixture.label).toBeGreaterThan(0);
  expect(cueAncestors(cue), fixture.label).toContain(anchor);
  unit.dispose();
};

const assertOrbitExtrema = (
  fixture: CueFixture,
  visual: ReturnType<typeof createEnemyVisual>,
  cue: THREE.Mesh,
  expectedAnchor: THREE.Object3D | undefined,
  body: THREE.Mesh,
  bodySize: THREE.Vector3,
): void => {
  if (!isOrbitingCue(fixture.label)) return;
  const caseLabel = `${fixture.label}:${visual.spec.body}:${visual.spec.profile.variant}`;
  for (let frame = 0; frame < 210; frame += 1) {
    visual.tick();
    visual.group.updateMatrixWorld(true);
    const anchorBox =
      fixture.anchor === "head" && expectedAnchor instanceof THREE.Mesh
        ? meshBounds(expectedAnchor)
        : meshBounds(body);
    const cueBox = new THREE.Box3().setFromObject(cue);
    expect(anchorBox.containsBox(cueBox), caseLabel).toBe(false);
    expect(boxGap(cueBox, anchorBox) / bodySize.length(), caseLabel).toBeLessThan(0.65);
    if (fixture.label === "shield-plates" && expectedAnchor !== undefined) {
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
        cue.getWorldQuaternion(new THREE.Quaternion()),
      );
      const outward = cue
        .getWorldPosition(new THREE.Vector3())
        .sub(expectedAnchor.getWorldPosition(new THREE.Vector3()))
        .normalize();
      expect(Math.abs(normal.z), caseLabel).toBeGreaterThan(0.28);
      expect(normal.dot(outward), caseLabel).toBeGreaterThan(0.8);
    }
  }
};

const assertCueFixture = (fixture: CueFixture): void => {
  const visual = createEnemyVisual(fixture.input);
  const cue = fixture.select(visual);
  const rebuilt = createEnemyVisual(fixture.input);
  const rebuiltCue = fixture.select(rebuilt);
  const pose = visual.group.getObjectByName(`enemy-pose-${visual.spec.body}`);
  const body = visual.group.getObjectByName(`enemy-body-${visual.spec.body}`);
  if (pose === undefined || !(body instanceof THREE.Mesh))
    throw new Error(`Expected ${visual.spec.body} semantic nodes`);
  visual.group.updateMatrixWorld(true);
  const cueBox = new THREE.Box3().setFromObject(cue);
  const bodyBox = meshBounds(body);
  const cueSize = cueBox.getSize(new THREE.Vector3());
  const bodySize = bodyBox.getSize(new THREE.Vector3());
  const cueCenter = cueBox.getCenter(new THREE.Vector3());
  const bodyCenter = bodyBox.getCenter(new THREE.Vector3());
  const ancestors = cueAncestors(cue);
  const expectedAnchor = expectedCueAnchor(fixture, visual, pose);
  const anchorBox =
    fixture.anchor === "head" && expectedAnchor instanceof THREE.Mesh
      ? meshBounds(expectedAnchor)
      : bodyBox;
  let geometryDisposals = 0;
  cue.geometry.addEventListener("dispose", () => {
    geometryDisposals += 1;
  });
  expect(expectedAnchor, fixture.label).toBeDefined();
  expect(ancestors, fixture.label).toContain(expectedAnchor);
  expectCueScale(fixture.label, cue, fixture.input);
  expect(cue.scale.toArray().every(Number.isFinite), fixture.label).toBe(true);
  expect(cue.quaternion.toArray().every(Number.isFinite), fixture.label).toBe(true);
  expect(cueSize.toArray().every(Number.isFinite), fixture.label).toBe(true);
  expect(cueSize.length() / bodySize.length(), fixture.label).toBeGreaterThan(0);
  expect(cueSize.length() / bodySize.length(), fixture.label).toBeLessThan(fixture.maxRatio ?? 1.5);
  if (requiresSurfaceClearance(fixture.label) && anchorBox.containsBox(cueBox)) {
    visual.tick();
    rebuilt.tick();
    visual.group.updateMatrixWorld(true);
    expect(
      anchorBox.containsBox(new THREE.Box3().setFromObject(cue)),
      `${fixture.label}:${visual.spec.body}`,
    ).toBe(false);
  }
  expect(boxGap(cueBox, anchorBox) / bodySize.length(), fixture.label).toBeLessThan(0.65);
  expect(
    cueCenter.distanceTo(bodyCenter) / bodySize.length(),
    fixture.label,
  ).toBeGreaterThanOrEqual(fixture.minOffset ?? 0.05);
  if (fixture.surroundsBody) expect(cueSize.x, fixture.label).toBeGreaterThan(bodySize.x);
  assertCueOrientation(fixture, cue);
  expect(rebuiltCue.scale).toEqual(cue.scale);
  expect(rebuiltCue.position).toEqual(cue.position);
  assertOrbitExtrema(fixture, visual, cue, expectedAnchor, body, bodySize);
  visual.dispose();
  visual.dispose();
  expect(geometryDisposals, fixture.label).toBe(1);
  rebuilt.dispose();
  assertLiveCueAttachment(fixture);
};

const assertBossTopEnvelope = (input: EnemyVisualInput): void => {
  const visual = createEnemyVisual(input);
  const headName =
    visual.spec.body === "boss-hydra" || visual.spec.body === "boss-evil-catbug"
      ? "enemy-part-hydra-head-1"
      : "enemy-part-colossus-head";
  const head = visual.group.getObjectByName(headName);
  const crown = visual.group.getObjectByName("boss-crown");
  if (!(head instanceof THREE.Mesh) || crown === undefined)
    throw new Error(`Expected ${visual.spec.body} composed top envelope`);
  visual.group.updateMatrixWorld(true);
  const envelope = new THREE.Box3().setFromObject(crown);
  visual.group.traverse((node) => {
    if (node instanceof THREE.Mesh && node.name.startsWith("decoration-horns-"))
      envelope.union(meshBounds(node));
  });
  const headBounds = meshBounds(head);
  const caseLabel = `${visual.spec.body}:${visual.spec.profile.variant}`;
  expect(envelope.max.y - headBounds.max.y, caseLabel).toBeLessThan(0.7);
  expect(envelope.min.y, caseLabel).toBeGreaterThan(headBounds.min.y - 0.2);
  visual.dispose();
};

describe("enemy visual factory", () => {
  it("selects a compact metallic non-color Golden Bug composition and disposes it", () => {
    const visual = createEnemyVisual({
      grade: "normal",
      level: 51,
      modifier: null,
      goldenBug: true,
    });
    expect(visual.spec).toMatchObject({
      body: "beetle",
      gradeCue: "crown",
      modifierCue: "wealth-orbitals",
    });
    expect(visual.spec.profile.palette).toEqual({
      core: "#d4af37",
      emissive: "#5c4300",
      accent: "#fff1a3",
    });
    const body = visual.group.getObjectByName("enemy-body-beetle");
    if (!(body instanceof THREE.Mesh) || Array.isArray(body.material))
      throw new Error("Expected Golden Bug body");
    expect(body.material.metalness).toBeGreaterThan(0);
    visual.dispose();
    expect(visual.group.parent).toBeNull();
  });
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

  it("uses all four dedicated boss bodies and visible grade and modifier attachments", () => {
    const bossBodies = new Set<string>();
    for (let level = 1; level <= 18; level += 1) {
      bossBodies.add(enemyVisualSpec({ grade: "boss", level, modifier: "armor" }).body);
    }
    expect(bossBodies).toEqual(
      new Set(["boss-colossus", "boss-hydra", "boss-catbug", "boss-evil-catbug"]),
    );
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

  it("aligns every body silhouette to the shared ground clearance", () => {
    const boss = new EnemyUnitFactory().create({ grade: "boss", level: 35, modifier: null });
    const ordinary = new EnemyUnitFactory().create({ grade: "elite", level: 3, modifier: null });
    expect(boss.view.group.position.y).not.toBeCloseTo(ordinary.view.group.position.y);
    for (const unit of [boss, ordinary]) {
      const body = unit.view.group.getObjectByName(`enemy-layer-body`);
      if (body === undefined) throw new Error("Expected body layer");
      unit.view.group.updateMatrixWorld(true);
      expect(new THREE.Box3().setFromObject(body).min.y).toBeCloseTo(0.02, 5);
    }
    boss.dispose();
    ordinary.dispose();
  });
  it("keeps every composed boss body on the deterministic ground plane", () => {
    const bossProfiles = findCueInputs((spec) => spec.body.startsWith("boss-"));
    expect(bossProfiles).toHaveLength(12);
    for (const input of bossProfiles) {
      const unit = new EnemyUnitFactory().create(input);
      unit.view.group.updateMatrixWorld(true);
      const body = unit.view.group.getObjectByName("enemy-layer-body");
      if (body === undefined) throw new Error("Expected boss body layer");
      expect(new THREE.Box3().setFromObject(body).min.y).toBeCloseTo(0.02, 5);
      unit.dispose();
    }
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
      body: "boss-evil-catbug",
      decorations: ["horns", "scar"],
      gradeCue: "crown",
      scale: 1.45,
    });
    expect(enemyVisualSpec({ grade: "boss", level: 70, modifier: null })).toMatchObject({
      body: "boss-catbug",
      decorations: ["fins", "scar"],
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
        expect(profileCueScale(visual.spec.profile)).toBeGreaterThanOrEqual(0.8);
        expect(profileCueScale(visual.spec.profile)).toBeLessThanOrEqual(1.2);
        expect(visual.group.getObjectByName(`enemy-body-${family}`)).toBeDefined();
        expect(meshCount(visual)).toBeLessThanOrEqual(family.startsWith("boss-") ? 51 : 30);
        const markers: Readonly<Record<string, readonly string[]>> = {
          beetle: [
            "enemy-part-beetle-shell",
            "enemy-part-beetle-head",
            "enemy-part-beetle-leg-1-2",
          ],
          brute: ["enemy-part-brute-head", "enemy-part-brute-arm-1", "enemy-part-brute-foot-1"],
          wisp: ["enemy-part-wisp-aura", "enemy-part-wisp-tail", "enemy-part-wisp-spark-1"],
          mantis: [
            "enemy-part-mantis-head",
            "enemy-part-mantis-abdomen",
            "enemy-part-mantis-scythe-1",
          ],
          sentinel: [
            "enemy-part-sentinel-visor",
            "enemy-part-sentinel-pylon-1",
            "enemy-part-sentinel-leg-1",
          ],
          drake: ["enemy-part-drake-head", "enemy-part-drake-wing-1", "enemy-part-drake-tail"],
          "boss-colossus": [
            "enemy-part-colossus-head",
            "enemy-part-colossus-shoulder-1",
            "enemy-part-colossus-arm-1",
          ],
          "boss-hydra": [
            "enemy-part-hydra-neck-2",
            "enemy-part-hydra-head-2",
            "enemy-part-hydra-horn-2",
          ],
        };
        markers[family]?.forEach((marker) =>
          expect(visual.group.getObjectByName(marker)).toBeDefined(),
        );
        assertMantisBandAttachment(family, visual);
        const shields = new EnemyViewBuilder();
        shields.add(enemyBodyFactories[visual.spec.body](visual.spec.profile));
        shields.add(decorateModifier("shield-plates", visual.spec.profile));
        const shielded = shields.build();
        const firstShield = shielded.group.getObjectByName("armor-shield-0");
        if (firstShield === undefined) throw new Error("Expected shield group");
        expect(
          firstShield.children.some((node) => node.name.startsWith("armor-shield-face-")),
        ).toBe(true);
        expect(firstShield.children.some((node) => node.name.startsWith("armor-shield-rim-"))).toBe(
          true,
        );
        const beforeOrbit = firstShield.position.clone();
        shielded.tick();
        expect(firstShield.position.distanceTo(beforeOrbit)).toBeGreaterThan(0);
        expect(firstShield.position.length()).toBeLessThan(2);
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
      const modifierNode = visual.group.getObjectByName(cue);
      expect(modifierNode).toBeDefined();
      expect(modifierNode?.parent?.name).toMatch(
        new RegExp(`^enemy-(?:pose|socket-${visual.spec.body})`),
      );
      expect(modifierNode?.position.length()).toBeLessThanOrEqual(1.2);
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
    ).toBeLessThanOrEqual(30);
    expect(
      meshCount(createEnemyVisual({ grade: "elite", level: 3, modifier: "manual-guard" })),
    ).toBeLessThanOrEqual(30);
    expect(
      meshCount(createEnemyVisual({ grade: "boss", level: 35, modifier: null })),
    ).toBeLessThanOrEqual(51);
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

  it("tilts Time Ring 11.5 degrees toward the default camera while retaining its overhead tick", () => {
    const visual = createEnemyVisual(findCueInput((spec) => spec.modifierCue === "time-ring"));
    const ring = visual.group.getObjectByName("time-ring");
    if (ring === undefined) throw new Error("Expected Time Ring");
    expect(ring.rotation.x).toBeCloseTo(
      enemyVisualTransforms.flatRingXRadians + enemyVisualTransforms.timeRingCameraTiltRadians,
    );
    expect(enemyVisualTransforms.timeRingCameraTiltRadians).toBeCloseTo((11.5 * Math.PI) / 180, 12);
    expect(ring.rotation.x - enemyVisualTransforms.flatRingXRadians).toBeGreaterThan(0);
    ring.updateMatrixWorld(true);
    const cameraFacingNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(ring.quaternion);
    expect(cameraFacingNormal.z).toBeLessThan(0);
    const beforeY = ring.position.y;
    visual.tick();
    expect(ring.position.y).not.toBe(beforeY);
    visual.dispose();
  });

  it("gives Ash Drake symmetric rearward membrane wings instead of side cones", () => {
    const visual = createEnemyVisual({ grade: "elite", level: 3, modifier: "manual-guard" });
    const body = requiredNode(visual, "enemy-body-drake");
    const head = requiredNode(visual, "enemy-part-drake-head");
    const snout = requiredNode(visual, "enemy-part-drake-snout");
    const left = requiredNode(visual, "enemy-part-drake-wing--1");
    const right = requiredNode(visual, "enemy-part-drake-wing-1");
    const tail = requiredNode(visual, "enemy-part-drake-tail");
    const barrier = requiredNode(visual, "directional-barrier");
    visual.group.updateMatrixWorld(true);
    const headPosition = head.getWorldPosition(new THREE.Vector3());
    const bodyPosition = body.getWorldPosition(new THREE.Vector3());
    const leftPosition = left.getWorldPosition(new THREE.Vector3());
    const rightPosition = right.getWorldPosition(new THREE.Vector3());
    expect(leftPosition.z - bodyPosition.z).toBeCloseTo(-(rightPosition.z - bodyPosition.z), 5);
    expect(leftPosition.x).toBeLessThan(headPosition.x);
    expect(rightPosition.x).toBeLessThan(headPosition.x);
    expect(left).toBeInstanceOf(THREE.Mesh);
    expect(right).toBeInstanceOf(THREE.Mesh);
    if (!(left instanceof THREE.Mesh) || !(right instanceof THREE.Mesh))
      throw new Error("Expected Drake membrane wing meshes");
    expect(left.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    expect(right.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    expect(left.scale.x).toBeCloseTo(1);
    expect(right.scale.x).toBeCloseTo(1);
    const leftNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      left.getWorldQuaternion(new THREE.Quaternion()),
    );
    const rightNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      right.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(leftNormal.z).toBeGreaterThan(0.35);
    expect(rightNormal.z).toBeGreaterThan(0.35);
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const projectCenter = (node: THREE.Object3D): THREE.Vector3 =>
      node.getWorldPosition(new THREE.Vector3()).project(camera);
    const leftProjection = projectCenter(left);
    const rightProjection = projectCenter(right);
    expect(Math.abs(leftProjection.y - rightProjection.y)).toBeGreaterThan(0.04);
    expect(snout).toBeInstanceOf(THREE.Mesh);
    if (!(snout instanceof THREE.Mesh)) throw new Error("Expected Drake cone snout");
    expect(snout.geometry).toBeInstanceOf(THREE.ConeGeometry);
    const snoutFacing = new THREE.Vector3(0, 1, 0).applyQuaternion(
      snout.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(snoutFacing.x).toBeGreaterThan(0.9);
    const tailSegments = [1, 2, 3, 4, 5].map((index) =>
      requiredNode(visual, `enemy-part-drake-tail-segment-${index}`),
    );
    const tailPositions = tailSegments.map((segment) =>
      segment.getWorldPosition(new THREE.Vector3()),
    );
    const tailSizes = tailSegments.map((segment) =>
      new THREE.Box3().setFromObject(segment).getSize(new THREE.Vector3()).length(),
    );
    expect(tailPositions.map((position) => position.x)).toEqual(
      [...tailPositions.map((position) => position.x)].sort((left, right) => right - left),
    );
    expect(tailSizes).toEqual([...tailSizes].sort((left, right) => right - left));
    for (let index = 1; index < tailPositions.length; index += 1) {
      const previous = tailPositions[index - 1];
      const current = tailPositions[index];
      if (previous === undefined || current === undefined)
        throw new Error("Expected Drake tail position");
      const tangent = current.clone().sub(previous).normalize();
      const facing = new THREE.Vector3(1, 0, 0).applyQuaternion(
        tailSegments[index]?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion(),
      );
      expect(facing.dot(tangent)).toBeGreaterThan(0.7);
    }
    const tailSpike = requiredNode(visual, "enemy-part-drake-tail-spike");
    const tailEnd = tailSpike.getWorldPosition(new THREE.Vector3());
    const lastTailPosition = tailPositions.at(-1);
    if (lastTailPosition === undefined) throw new Error("Expected final Drake tail segment");
    const spikeTangent = tailEnd.clone().sub(lastTailPosition).normalize();
    const spikeFacing = new THREE.Vector3(0, 1, 0).applyQuaternion(
      tailSpike.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(spikeFacing.dot(spikeTangent)).toBeGreaterThan(0.7);
    expect(tail.children).toHaveLength(6);
    expect(barrier.parent?.name).toBe("enemy-socket-drake-front");
    const barrierNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      barrier.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(barrierNormal.x).toBeGreaterThan(0.35);
    expect(barrierNormal.z).toBeGreaterThan(0.75);
    const barrierBounds = new THREE.Box3().setFromObject(barrier);
    const barrierMin = barrierBounds.min.clone().project(camera);
    const barrierMax = barrierBounds.max.clone().project(camera);
    expect(Math.abs(barrierMax.x - barrierMin.x)).toBeGreaterThan(0.03);
    expect(requiredNode(visual, "directional-barrier-inset").parent).toBe(barrier);
    expect(requiredNode(visual, "directional-barrier-boss").parent).toBe(barrier);
    const nativeHorn = requiredNode(visual, "enemy-part-drake-native-horn--1");
    const nativeHornFacing = new THREE.Vector3(0, 1, 0).applyQuaternion(
      nativeHorn.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(nativeHornFacing.x).toBeGreaterThan(0.5);
    const horn = requiredNode(visual, "grade-spike--0.3");
    const hornFacing = new THREE.Vector3(0, 1, 0).applyQuaternion(
      horn.getWorldQuaternion(new THREE.Quaternion()),
    );
    expect(hornFacing.x).toBeGreaterThan(0.9);
    expect(horn.getWorldPosition(new THREE.Vector3()).distanceTo(headPosition)).toBeLessThan(0.6);
    visual.dispose();
  });

  it("keeps the redesigned Drake wings attached and flapping across its profiles", () => {
    const inputs = findCueInputs((spec) => spec.body === "drake");
    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      const visual = createEnemyVisual(input);
      const snout = visual.group.getObjectByName("enemy-part-drake-snout");
      const wingRoot = visual.group.getObjectByName("enemy-part-drake-wing-root--1");
      if (snout === undefined || wingRoot === undefined)
        throw new Error("Expected Drake snout and wing");
      const before = wingRoot.quaternion.clone();
      visual.tick();
      expect(wingRoot.quaternion.equals(before)).toBe(false);
      visual.group.updateMatrixWorld(true);
      expect(new THREE.Box3().setFromObject(visual.group).min.y).toBeGreaterThanOrEqual(0);
      visual.dispose();
    }
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
      "boss-catbug",
      "boss-colossus",
      "boss-evil-catbug",
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
    expect(built.roots.body.children).toHaveLength(1);
    expect(built.roots.grade.children).toHaveLength(0);
    expect(built.roots.modifier.children).toHaveLength(0);
    expect(built.roots.decoration.children).toHaveLength(0);
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
    expect(unit.spec.body).toBe("boss-evil-catbug");
    unit.dispatchEnemy({ type: "hit" });
    unit.dispatchEnemy({ type: "critical" });
    unit.dispatchEnemy({ type: "death" });
    expect(
      unit.view.group.getObjectByName("enemy-body-boss-evil-catbug")?.userData.lastCommand,
    ).toBe("death");
    unit.dispatchEnemy({ type: "dispose" });
    unit.dispatchEnemy({ type: "dispose" });
    expect(unit.view.group.parent).toBeNull();
    expect(events).toEqual(["spawned", "synchronized", "hit", "critical", "death", "disposed"]);
  });

  it("applies command motion without transform accumulation and restores the authored rig", () => {
    const unit = new EnemyUnitFactory().create({ grade: "normal", level: 2, modifier: null });
    expect(unit.spec.body).toBe("wisp");
    const pose = unit.view.group.getObjectByName("enemy-pose-wisp");
    if (pose === undefined) throw new Error("Expected wisp pose");
    const initialScale = pose.scale.clone();
    unit.dispatchEnemy({ type: "hit" });
    unit.tick();
    unit.tick();
    expect(pose.scale.y).toBeLessThan(initialScale.y);
    for (let frame = 0; frame < 10; frame += 1) unit.tick();
    expect(pose.scale).toEqual(initialScale);
    unit.dispatchEnemy({ type: "critical" });
    unit.tick();
    unit.tick();
    expect(pose.scale.y).toBeLessThan(initialScale.y);
    for (let frame = 0; frame < 10; frame += 1) unit.tick();
    expect(pose.scale).toEqual(initialScale);
    unit.dispose();
  });

  it("samples the full hit, critical, spawn, and death lifecycle for every shipped family", () => {
    for (const input of shippedInputs) {
      const unit = new EnemyUnitFactory().create(input);
      const pose = unit.view.group.getObjectByName(`enemy-pose-${unit.spec.body}`);
      if (pose === undefined) throw new Error(`Expected ${unit.spec.body} pose`);
      unit.tick();
      for (const [command, frames] of [
        ["hit", 10],
        ["critical", 12],
      ] as const)
        sampleReaction(unit, pose, command, frames);
      unit.dispatchEnemy({ type: "hit" });
      unit.tick();
      unit.tick();
      const hitPeak = poseState(pose);
      unit.dispatchEnemy({ type: "critical" });
      unit.tick();
      const criticalStart = poseState(pose);
      expect(criticalStart[0].distanceTo(hitPeak[0])).toBeLessThan(0.000001);
      expect(rotationDelta(criticalStart[1], hitPeak[1])).toBeLessThan(0.000001);
      expect(criticalStart[2].distanceTo(hitPeak[2])).toBeLessThan(0.000001);
      for (let frame = 0; frame < 8; frame += 1) unit.tick();
      unit.dispatchEnemy({ type: "spawn", parent: new THREE.Group() });
      unit.tick();
      unit.tick();
      const spawnPose = poseState(pose);
      unit.dispatchEnemy({ type: "death" });
      unit.tick();
      const deathStart = poseState(pose);
      expect(deathStart[0].distanceTo(spawnPose[0])).toBeLessThan(0.25);
      expect(rotationDelta(deathStart[1], spawnPose[1])).toBeLessThan(0.5);
      expect(deathStart[2].distanceTo(spawnPose[2])).toBeLessThan(0.2);
      for (let frame = 0; frame < 14; frame += 1) unit.tick();
      unit.tick();
      expect([pose.rotation.x, pose.rotation.y, pose.rotation.z]).toEqual([0, 0, 0]);
      expect(pose.scale).toEqual(new THREE.Vector3(1, 1, 1));
      unit.dispose();
    }
  });

  it("suppresses shared rig motion when native reduced motion is requested", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    const query: MediaQueryList = {
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
      addListener: () => undefined,
      removeListener: () => undefined,
    };
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { matchMedia: () => query },
    });
    try {
      for (const input of shippedInputs) {
        const unit = new EnemyUnitFactory().create(input);
        const pose = unit.view.group.getObjectByName(`enemy-pose-${unit.spec.body}`);
        if (pose === undefined) throw new Error(`Expected ${unit.spec.body} pose`);
        const neutralPosition = pose.position.clone();
        const neutralScale = pose.scale.clone();
        for (const [command, frames] of [
          ["hit", 10],
          ["critical", 12],
        ] as const) {
          unit.dispatchEnemy({ type: command });
          for (let frame = 0; frame < frames; frame += 1) {
            unit.tick();
            expect(pose.position).toEqual(neutralPosition);
            expect(pose.scale).toEqual(neutralScale);
          }
          expect(
            unit.view.group.getObjectByName(`enemy-body-${unit.spec.body}`)?.userData.lastCommand,
          ).toBe(command);
        }
        unit.dispose();
      }
    } finally {
      if (previous === undefined) Reflect.deleteProperty(globalThis, "window");
      else Object.defineProperty(globalThis, "window", previous);
    }
  });

  it("fits every rendered cue to its declared semantic anchor", () => {
    const decorations = [
      ["fins", "left", "tilted"],
      ["horns", "head", "tilted"],
      ["orbitals", "orbit", "free"],
      ["satellites", "orbit", "free"],
      ["scar", "front", "tilted"],
    ] as const;
    const fixtures: CueFixture[] = [
      ...decorations.map(([decoration, anchor, orientation]) => ({
        label: `decoration-${decoration}`,
        input: findCueInput((spec) => spec.decorations[0] === decoration),
        anchor,
        orientation,
        select: (visual: ReturnType<typeof createEnemyVisual>) => {
          const index = visual.spec.decorations.indexOf(decoration);
          if (index < 0) throw new Error(`Expected ${decoration} decoration`);
          return namedMesh(visual, `decoration-${decoration}-${index}`);
        },
      })),
      {
        label: "grade-crest",
        input: findCueInput((spec) => spec.gradeCue === "crest"),
        anchor: "head",
        orientation: "free",
        select: (visual) => namedMesh(visual, "grade-crest"),
      },
      {
        label: "grade-spikes",
        input: findCueInput((spec) => spec.gradeCue === "spikes"),
        anchor: "head",
        orientation: "free",
        select: (visual) => namedMesh(visual, "grade-spike-"),
      },
      {
        label: "grade-crown",
        input: findCueInput((spec) => spec.gradeCue === "crown"),
        anchor: "head",
        orientation: "free",
        select: (visual) => namedMesh(visual, "boss-crown"),
      },
      {
        label: "shield-plates",
        input: findCueInput((spec) => spec.modifierCue === "shield-plates"),
        anchor: "orbit",
        orientation: "tilted",
        select: (visual) => namedMesh(visual, "armor-shield-face-1"),
      },
      {
        label: "vitality-core",
        input: findCueInput((spec) => spec.modifierCue === "vitality-core"),
        anchor: "overhead",
        orientation: "free",
        select: (visual) => namedMesh(visual, "vitality-core"),
      },
      {
        label: "time-ring",
        input: findCueInput((spec) => spec.modifierCue === "time-ring"),
        anchor: "overhead",
        orientation: "free",
        maxRatio: 1.9,
        minOffset: 0,
        select: (visual) => namedMesh(visual, "time-ring"),
      },
      {
        label: "wealth-orbitals",
        input: findCueInput((spec) => spec.modifierCue === "wealth-orbitals"),
        anchor: "orbit",
        orientation: "flat",
        select: (visual) => namedMesh(visual, "wealth-orbital-"),
      },
      {
        label: "reinforced-band",
        input: findCueInput((spec) => spec.modifierCue === "reinforced-band"),
        anchor: "orbit",
        orientation: "flat",
        maxRatio: 1.6,
        minOffset: 0,
        surroundsBody: true,
        select: (visual) => namedMesh(visual, "reinforced-band"),
      },
      {
        label: "prism-guard",
        input: findCueInput((spec) => spec.modifierCue === "prism-guard"),
        anchor: "front",
        orientation: "free",
        select: (visual) => namedMesh(visual, "prism-guard"),
      },
      {
        label: "directional-barrier",
        input: findCueInput((spec) => spec.modifierCue === "directional-barrier"),
        anchor: "front",
        orientation: "free",
        select: (visual) => namedMesh(visual, "directional-barrier"),
      },
    ];
    fixtures
      .flatMap((fixture) =>
        inputsForCueLabel(fixture.label).map((input) => ({ ...fixture, input })),
      )
      .forEach(assertCueFixture);
    const goldenInput: EnemyVisualInput = {
      grade: "normal",
      level: 51,
      modifier: null,
      goldenBug: true,
    };
    const goldenFixtures = [
      "grade-crown",
      "wealth-orbitals",
      "decoration-horns",
      "decoration-orbitals",
    ].map((label) => {
      const fixture = fixtures.find((candidate) => candidate.label === label);
      if (fixture === undefined) throw new Error(`Expected Golden Bug ${label} fixture`);
      return { ...fixture, input: goldenInput };
    });
    for (const fixture of goldenFixtures) {
      const visual = createEnemyVisual(fixture.input);
      expect(visual.spec.body).toBe("beetle");
      expect(visual.spec.profile.metallic).toBe(true);
      visual.dispose();
      assertCueFixture(fixture);
    }
  });

  it("keeps boss crowns and elite spikes within body-relative top clearance", () => {
    for (const [input, headName, cueName] of [
      [{ grade: "boss", level: 35, modifier: null }, "enemy-part-hydra-head-1", "boss-crown"],
      [{ grade: "boss", level: 70, modifier: null }, "enemy-part-colossus-head", "boss-crown"],
      [
        { grade: "elite", level: 3, modifier: "hardened" },
        "enemy-part-mantis-head",
        "grade-spike-",
      ],
    ] as const) {
      const visual = createEnemyVisual(input);
      const head = visual.group.getObjectByName(headName);
      const cue = cueName.endsWith("-")
        ? namedMesh(visual, cueName)
        : visual.group.getObjectByName(cueName);
      if (head === undefined || cue === undefined) throw new Error(`Expected ${cueName} bounds`);
      visual.group.updateMatrixWorld(true);
      if (!(head instanceof THREE.Mesh)) throw new Error(`Expected ${headName} mesh`);
      const headBounds = meshBounds(head);
      const cueBounds = new THREE.Box3().setFromObject(cue);
      expect(cueBounds.max.y - headBounds.max.y, visual.spec.body).toBeLessThan(0.6);
      expect(cueBounds.min.y, visual.spec.body).toBeGreaterThan(headBounds.max.y - 0.3);
      visual.dispose();
    }
    for (const input of inputsForCueLabel("decoration-horns").filter((candidate) =>
      enemyVisualSpec(candidate).body.startsWith("boss-"),
    )) {
      const visual = createEnemyVisual(input);
      const headName =
        visual.spec.body === "boss-hydra" || visual.spec.body === "boss-evil-catbug"
          ? "enemy-part-hydra-head-1"
          : "enemy-part-colossus-head";
      const head = visual.group.getObjectByName(headName);
      if (!(head instanceof THREE.Mesh)) throw new Error(`Expected ${headName} mesh`);
      visual.group.updateMatrixWorld(true);
      const headBounds = meshBounds(head);
      const horns: THREE.Mesh[] = [];
      visual.group.traverse((node) => {
        if (node instanceof THREE.Mesh && node.name.startsWith("decoration-horns-"))
          horns.push(node);
      });
      expect(horns.length, visual.spec.body).toBeGreaterThan(0);
      for (const horn of horns) {
        const hornBounds = meshBounds(horn);
        expect(hornBounds.max.y - headBounds.max.y, visual.spec.body).toBeLessThan(0.7);
        expect(hornBounds.min.y, visual.spec.body).toBeGreaterThan(headBounds.min.y - 0.2);
      }
      visual.dispose();
    }
    const bossProfiles = findCueInputs(
      (spec) => spec.gradeCue === "crown" && spec.body.startsWith("boss-"),
    );
    expect(bossProfiles).toHaveLength(12);
    bossProfiles.forEach(assertBossTopEnvelope);
  });

  it("samples hit and critical at neutral endpoints with one bounded shared peak", () => {
    const evilCatbug = new EnemyUnitFactory().create({ grade: "boss", level: 35, modifier: null });
    const pose = evilCatbug.view.group.getObjectByName("enemy-pose-boss-evil-catbug");
    if (pose === undefined) throw new Error("Expected Evil Catbug pose");
    const neutral = pose.scale.clone();
    for (const [command, frames] of [
      ["hit", 10],
      ["critical", 12],
    ] as const) {
      evilCatbug.dispatchEnemy({ type: command });
      evilCatbug.tick();
      expect(pose.scale).toEqual(neutral);
      evilCatbug.tick();
      expect(pose.scale.y).toBeLessThan(neutral.y);
      for (let frame = 0; frame < frames - 2; frame += 1) evilCatbug.tick();
      expect(pose.scale).toEqual(neutral);
      evilCatbug.tick();
      expect(pose.scale).toEqual(neutral);
    }
    evilCatbug.dispose();
  });
  it("anchors head cues to deforming family poses and keeps shared boss motion bounded", () => {
    const evilCatbug = new EnemyUnitFactory().create({
      grade: "boss",
      level: 35,
      modifier: "armor",
    });
    const crown = evilCatbug.view.group.getObjectByName("boss-crown");
    const centerHead = evilCatbug.view.group.getObjectByName("enemy-part-hydra-head-1");
    const shield = evilCatbug.view.group.getObjectByName("armor-shield-0");
    if (crown === undefined || centerHead === undefined || shield === undefined)
      throw new Error("Expected Evil Catbug semantic anchors");
    expect(crown.parent?.name).toBe("enemy-socket-boss-evil-catbug-top");
    expect(shield.parent?.name).toBe("enemy-socket-boss-evil-catbug-orbit");
    evilCatbug.view.group.updateMatrixWorld(true);
    const crownBefore = crown.getWorldPosition(new THREE.Vector3());
    evilCatbug.dispatchEnemy({ type: "critical" });
    evilCatbug.tick();
    evilCatbug.tick();
    evilCatbug.view.group.updateMatrixWorld(true);
    expect(crown.getWorldPosition(new THREE.Vector3()).distanceTo(crownBefore)).toBeGreaterThan(0);
    const catbug = new EnemyUnitFactory().create({ grade: "boss", level: 70, modifier: null });
    const catbugPose = catbug.view.group.getObjectByName("enemy-pose-boss-catbug");
    if (catbugPose === undefined) throw new Error("Expected Catbug pose");
    catbug.dispatchEnemy({ type: "death" });
    for (let frame = 0; frame < 12; frame += 1) catbug.tick();
    expect(catbugPose.position.y).toBeGreaterThanOrEqual(-0.1);
    evilCatbug.dispose();
    catbug.dispose();
  });

  it("keeps overhead vitality centered above the deforming family rig", () => {
    for (const input of findCueInputs((spec) => spec.modifierCue === "vitality-core")) {
      const visual = createEnemyVisual(input);
      const core = visual.group.getObjectByName("vitality-core");
      const body = visual.group.getObjectByName(`enemy-body-${visual.spec.body}`);
      const rig = visual.group.getObjectByName(`enemy-rig-${visual.spec.body}`);
      if (!(core instanceof THREE.Mesh) || !(body instanceof THREE.Mesh) || rig === undefined)
        throw new Error("Expected vitality body");
      visual.group.updateMatrixWorld(true);
      const coreBounds = meshBounds(core);
      const bodyBounds = meshBounds(body);
      expect(core.parent?.name).toBe(`enemy-socket-${visual.spec.body}-overhead`);
      expect(core.getWorldPosition(new THREE.Vector3()).x).toBeCloseTo(
        rig.getWorldPosition(new THREE.Vector3()).x,
      );
      expect(coreBounds.min.y).toBeGreaterThanOrEqual(bodyBounds.max.y - 0.001);
      visual.dispose();
    }
  });

  it("uses symmetric guards and family-correct beetle and mantis geometry", () => {
    const guarded = createEnemyVisual(findCueInput((spec) => spec.modifierCue === "prism-guard"));
    const left = namedMesh(guarded, "prism-guard");
    const right = namedMesh(guarded, "prism-guard-right");
    expect(left.parent?.name).toBe("prism-guard");
    expect(right.parent?.name).toBe("prism-guard");
    expect(left.position.x).toBeCloseTo(-right.position.x);
    expect(left.position.y).toBeCloseTo(right.position.y);
    expect(left.position.z).toBeCloseTo(right.position.z);
    guarded.dispose();

    const beetle = createEnemyVisual({ grade: "elite", level: 3, modifier: "armor" });
    if (beetle.spec.body !== "beetle") throw new Error("Expected Beetle fixture");
    const head = beetle.group.getObjectByName("enemy-part-beetle-head");
    const horn = beetle.group.getObjectByName("decoration-horns-0");
    const legs = [-1, 1].flatMap((side) =>
      [0, 1, 2].map((index) =>
        beetle.group.getObjectByName(`enemy-part-beetle-leg-${side}-${index}`),
      ),
    );
    if (
      !(head instanceof THREE.Mesh) ||
      !(horn instanceof THREE.Mesh) ||
      legs.some((leg) => leg === undefined)
    )
      throw new Error("Expected Beetle horns and legs");
    beetle.group.updateMatrixWorld(true);
    const hornBounds = meshBounds(horn);
    const headBounds = meshBounds(head);
    expect(horn.parent).toBe(head);
    expect(hornBounds.min.z).toBeGreaterThan(headBounds.getCenter(new THREE.Vector3()).z);
    const legMeshes = legs as THREE.Object3D[];
    expect(new Set(legMeshes.map((leg) => leg.position.y))).toEqual(new Set([-0.38]));
    expect(new Set(legMeshes.map((leg) => leg.position.z))).toEqual(new Set([0.42, 0, -0.42]));
    beetle.dispose();

    const mantis = createEnemyVisual({ grade: "elite", level: 3, modifier: "hardened" });
    if (mantis.spec.body !== "mantis") throw new Error("Expected Mantis fixture");
    for (const side of [-1, 1] as const) {
      const scythe = mantis.group.getObjectByName(`enemy-part-mantis-scythe-${side}`);
      if (scythe === undefined) throw new Error("Expected Mantis scythe");
      const tip = new THREE.Vector3(0, 1, 0).applyQuaternion(scythe.quaternion);
      expect(tip.z).toBeGreaterThan(0.7);
      expect(tip.x * side).toBeGreaterThan(0.35);
    }
    mantis.dispose();
  });

  it("keeps Colossus feet and every body profile at deterministic ground clearance", () => {
    const fixtures = findCueInputs(() => true);
    expect(fixtures).toHaveLength(30);
    for (const input of fixtures) {
      const visual = createEnemyVisual(input);
      const bodyLayer = visual.group.getObjectByName("enemy-layer-body");
      if (bodyLayer === undefined) throw new Error("Expected body layer");
      visual.group.updateMatrixWorld(true);
      expect(new THREE.Box3().setFromObject(bodyLayer).min.y).toBeCloseTo(0.02, 5);
      visual.dispose();
    }
    const colossus = createEnemyVisual({ grade: "boss", level: 70, modifier: null });
    const feet = [-1, 1].map((side) =>
      colossus.group.getObjectByName(`enemy-part-colossus-foot-${side}`),
    );
    expect(feet.every((foot) => foot instanceof THREE.Mesh)).toBe(true);
    colossus.dispose();
  });

  it("renders scars as three thin front-surface claw slashes", () => {
    const visual = createEnemyVisual(findCueInput((spec) => spec.decorations.includes("scar")));
    const front = visual.group.getObjectByName(`enemy-socket-${visual.spec.body}-front`);
    const scars: THREE.Mesh[] = [];
    visual.group.traverse((node) => {
      if (node instanceof THREE.Mesh && node.name.startsWith("decoration-scar-")) scars.push(node);
    });
    if (front === undefined) throw new Error("Expected front socket");
    expect(scars).toHaveLength(3);
    visual.group.updateMatrixWorld(true);
    for (const scar of scars) {
      const size = meshBounds(scar).getSize(new THREE.Vector3());
      expect(scar.parent).toBe(front);
      expect(size.y).toBeLessThan(0.25);
      expect(size.z).toBeLessThan(0.04);
    }
    visual.dispose();
  });

  it("rebuilds the same seeded visual tree after a reload-style disposal", () => {
    const input: EnemyVisualInput = { grade: "boss", level: 35, modifier: "armor" };
    const first = createEnemyVisual(input);
    const firstNames: string[] = [];
    first.group.traverse((node) => firstNames.push(node.name));
    first.dispose();
    const reloaded = createEnemyVisual(input);
    const reloadedNames: string[] = [];
    reloaded.group.traverse((node) => reloadedNames.push(node.name));
    expect(reloaded.spec).toEqual(enemyVisualSpec(input));
    expect(reloadedNames).toEqual(firstNames);
    reloaded.dispose();
  });

  it("applies the affinity palette to every family body and bounds the affinity cue", () => {
    const families: Readonly<Record<string, EnemyVisualInput>> = {
      beetle: { grade: "normal", level: 45, modifier: null },
      brute: { grade: "normal", level: 43, modifier: null },
      hydra: { grade: "boss", level: 35, modifier: null },
      colossus: { grade: "boss", level: 70, modifier: null },
    };
    for (const input of Object.values(families)) {
      const visual = createEnemyVisual(input);
      const body = visual.group.getObjectByName(`enemy-body-${visual.spec.body}`);
      if (!(body instanceof THREE.Mesh) || Array.isArray(body.material))
        throw new Error(`Expected ${visual.spec.body} body mesh`);
      expect(body.material.color.getHexString()).toBe(visual.spec.affinity.palette.core.slice(1));
      expect(body.material.emissive.getHexString()).toBe(
        visual.spec.affinity.palette.emissive.slice(1),
      );
      const cue = visual.group.getObjectByName("affinity-cue");
      expect(cue).toBeDefined();
      let cueMeshes = 0;
      cue?.traverse((node) => {
        if (node instanceof THREE.Mesh) cueMeshes += 1;
      });
      expect(cueMeshes).toBeLessThanOrEqual(6);
      visual.dispose();
    }
  });

  it("keeps boss-only geometry on bosses and off ordinary families", () => {
    for (let level = 1; level <= 120; level += 1) {
      const ordinary = createEnemyVisual({ grade: "normal", level, modifier: null });
      expect(ordinary.group.getObjectByName("boss-geometry-crystal-crown")).toBeUndefined();
      expect(ordinary.group.getObjectByName("boss-geometry-orbital-runes")).toBeUndefined();
      expect(ordinary.group.getObjectByName("boss-geometry-elemental-spines")).toBeUndefined();
      ordinary.dispose();
    }
    const hydra = createEnemyVisual({ grade: "boss", level: 35, modifier: null });
    const crown = hydra.group.getObjectByName("boss-geometry-crystal-crown");
    expect(crown).toBeDefined();
    expect(crown?.children).toHaveLength(3);
    const spines = hydra.group.getObjectByName("boss-geometry-elemental-spines");
    expect(spines).toBeDefined();
    expect(spines?.children).toHaveLength(18);
    const centerHead = hydra.group.getObjectByName("enemy-part-hydra-head-1");
    if (!(centerHead instanceof THREE.Mesh)) throw new Error("Expected Hydra center head");
    hydra.group.updateMatrixWorld(true);
    const headBox = new THREE.Box3().setFromObject(centerHead);
    let spinesNearHead = 0;
    spines?.children.forEach((spine) => {
      if (!(spine instanceof THREE.Mesh)) return;
      if (headBox.distanceToPoint(spine.getWorldPosition(new THREE.Vector3())) < 0.05)
        spinesNearHead += 1;
    });
    expect(spinesNearHead).toBe(0);
    hydra.dispose();
    const colossus = createEnemyVisual({ grade: "boss", level: 70, modifier: null });
    const runes = colossus.group.getObjectByName("boss-geometry-orbital-runes");
    expect(runes).toBeDefined();
    expect(runes?.children).toHaveLength(3);
    colossus.dispose();
  });

  it("disposes affinity cues and boss geometry back to baseline resource counts", () => {
    const parent = new THREE.Group();
    const baseline = resourceCounts(parent);
    const visual = createEnemyVisual({ grade: "boss", level: 35, modifier: "armor" });
    parent.add(visual.group);
    const receipt = observeResourceDisposal(visual.group);
    visual.dispose();
    expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
    expect(resourceCounts(parent)).toEqual(baseline);
  });

  it("keeps reduced-motion affinity cues static instead of displacing", () => {
    const visual = createEnemyVisual({
      grade: "normal",
      level: 1,
      modifier: null,
      reducedMotion: true,
    });
    const cue = visual.group.getObjectByName("affinity-cue");
    expect(cue).toBeDefined();
    const position = cue?.position.clone();
    const rotation = cue?.rotation.clone();
    for (let frame = 0; frame < 10; frame += 1) visual.tick();
    expect(cue?.position).toEqual(position);
    expect(cue?.rotation.toArray()).toEqual(rotation?.toArray());
    visual.dispose();
  });
  it("honors native reduced motion for production boss orbital runes", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    let visual: EnemyVisual | undefined;
    try {
      visual = createEnemyVisual({ grade: "boss", level: 70, modifier: null });
      const runes = visual.group.getObjectByName("boss-geometry-orbital-runes");
      if (runes === undefined) throw new Error("Expected orbital runes");
      const rotations = runes.children.map((rune) => rune.rotation.toArray());
      for (let frame = 0; frame < 10; frame += 1) visual.tick();
      expect(runes.children.map((rune) => rune.rotation.toArray())).toEqual(rotations);
    } finally {
      visual?.dispose();
      vi.unstubAllGlobals();
    }
  });

  it("requires and seals a complete enemy model-view-controller composition", () => {
    const builder = new EnemyUnitBuilder();
    expect(() => builder.build()).toThrow("requires a model");
    const unit = new EnemyUnitFactory().create({ grade: "normal", level: 1, modifier: null });
    expect(unit.model.snapshot.level).toBe(1);
    expect(unit.controller.composes(unit.model, unit.view)).toBe(true);
  });
});
