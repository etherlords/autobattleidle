import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, type EnemyVisualComponent } from "../components";
import { enemyVisualAnimation } from "../config";
import type { BodyFamily } from "../spec";

export type BossFamily = Extract<
  BodyFamily,
  "boss-colossus" | "boss-hydra" | "boss-catbug" | "boss-evil-catbug"
>;
export type BossGeometryProfile =
  "legacy/no-overlay" | "crystal-crown" | "orbital-runes" | "elemental-spines";
export type BossRecipe = Exclude<BossGeometryProfile, "legacy/no-overlay">;

export const BOSS_GEOMETRY_PROFILES = [
  "legacy/no-overlay",
  "crystal-crown",
  "elemental-spines",
  "orbital-runes",
] as const satisfies readonly BossGeometryProfile[];

/** Authored boss geometry is explicit; ordinary families resolve to the legacy body only. */
export const BOSS_GEOMETRY_RECIPES: Readonly<
  Record<BossFamily, readonly [BossRecipe, BossRecipe]>
> = {
  "boss-hydra": ["crystal-crown", "elemental-spines"],
  "boss-colossus": ["orbital-runes", "elemental-spines"],
  "boss-catbug": ["orbital-runes", "elemental-spines"],
  "boss-evil-catbug": ["crystal-crown", "elemental-spines"],
};

type BossGeometryBuild = {
  readonly group: THREE.Group;
  readonly tick?: (reducedMotion: boolean) => void;
};

const crystalCrown = (): BossGeometryBuild => {
  const group = new THREE.Group();
  group.name = "boss-geometry-crystal-crown";
  [-0.2, 0, 0.2].forEach((x, index) => {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(index === 1 ? 0.3 : 0.21),
      new THREE.MeshStandardMaterial({ color: "#8df5ff", emissive: "#115a7a", metalness: 0.55 }),
    );
    crystal.name = `boss-geometry-crystal-${index}`;
    crystal.position.set(x, 0.25 + (index === 1 ? 0.16 : 0), 0);
    crystal.scale.y = index === 1 ? 2.1 : 1.6;
    group.add(crystal);
  });
  return { group };
};

const orbitalRunes = (): BossGeometryBuild => {
  const group = new THREE.Group();
  group.name = "boss-geometry-orbital-runes";
  const runes = [-0.7, 0, 0.7].map((rotation, index) => {
    const rune = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.035, 6, 16),
      new THREE.MeshBasicMaterial({ color: "#b78cff", transparent: true, opacity: 0.82 }),
    );
    rune.name = `boss-geometry-orbital-rune-${index}`;
    rune.rotation.set(rotation, rotation * 0.4, rotation * 0.65);
    group.add(rune);
    return rune;
  });
  return {
    group,
    tick: (reducedMotion) => {
      if (reducedMotion) return;
      runes.forEach((rune) => rune.rotateZ(enemyVisualAnimation.orbitalRuneRadians));
    },
  };
};

const SPIKE_COUNT = 18;
const spikeDirection = (index: number): THREE.Vector3 => {
  // Sample a latitude band, not the full sphere: the topmost Fibonacci direction
  // would otherwise land on the Hydra's central crowned head silhouette.
  const bandTop = 0.82;
  const y = bandTop - ((index + 0.5) / SPIKE_COUNT) * 2 * bandTop;
  const radius = Math.sqrt(1 - y * y);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
};

const elementalSpines = (): BossGeometryBuild => {
  const group = new THREE.Group();
  group.name = "boss-geometry-elemental-spines";
  for (let index = 0; index < SPIKE_COUNT; index += 1) {
    const spine = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.55, 5),
      new THREE.MeshStandardMaterial({ color: "#ff9269", emissive: "#79220e", metalness: 0.3 }),
    );
    spine.name = `boss-geometry-elemental-spine-${index}`;
    group.add(spine);
  }
  return { group };
};

// Ported lab fit helpers: sockets carry the composed unit bounds converted into
// socket-local space so recipes scale relative to the boss silhouette.
const boundsInSocket = (bounds: THREE.Box3, anchor: THREE.Object3D): THREE.Box3 => {
  const inverse = anchor.matrixWorld.clone().invert();
  const localBounds = new THREE.Box3().makeEmpty();
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z])
        localBounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
  return localBounds;
};

const fitAbove = (
  group: THREE.Group,
  bodyBounds: THREE.Box3,
  nativeBounds: THREE.Box3,
  heightRatio: number,
): boolean => {
  const bodySize = bodyBounds.getSize(new THREE.Vector3());
  const nativeHeight = nativeBounds.getSize(new THREE.Vector3()).y;
  if (nativeHeight === 0 || bodySize.y === 0) return false;
  const scale = (bodySize.y * heightRatio) / nativeHeight;
  const center = bodyBounds.getCenter(new THREE.Vector3());
  group.scale.setScalar(scale);
  group.position.set(
    center.x,
    bodyBounds.max.y + bodySize.y * 0.06 - nativeBounds.min.y * scale,
    center.z,
  );
  return true;
};

const fitOrbit = (
  group: THREE.Group,
  bodyBounds: THREE.Box3,
  nativeBounds: THREE.Box3,
): boolean => {
  const bodySize = bodyBounds.getSize(new THREE.Vector3());
  const nativeSize = nativeBounds.getSize(new THREE.Vector3());
  const nativeRadius = Math.max(nativeSize.x, nativeSize.z) / 2;
  if (nativeRadius === 0) return false;
  const radius = Math.max(bodySize.x, bodySize.z) / 2 + bodySize.y * 0.08;
  group.scale.setScalar(radius / nativeRadius);
  group.position.copy(bodyBounds.getCenter(new THREE.Vector3()));
  return true;
};

const fitSpines = (
  group: THREE.Group,
  bossBody: THREE.Mesh,
  anchor: THREE.Object3D,
  protectedHead: THREE.Object3D | undefined,
): boolean => {
  const bodyBounds = new THREE.Box3().setFromObject(bossBody);
  const size = bodyBounds.getSize(new THREE.Vector3());
  const scale = Math.min(1.25, Math.max(0.7, size.length() / 5));
  const length = 0.55 * scale;
  bossBody.updateWorldMatrix(true, false);
  anchor.updateWorldMatrix(true, false);
  const headBounds =
    protectedHead === undefined
      ? undefined
      : new THREE.Box3().setFromObject(protectedHead).expandByScalar(0.12);
  const headYawAvoid = (direction: THREE.Vector3): THREE.Vector3 => {
    if (headBounds === undefined) return direction;
    for (let step = 0; step < 16; step += 1) {
      const candidate = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), step * 0.22);
      const probe = new THREE.Raycaster(
        center.clone().addScaledVector(candidate, rayDistance),
        candidate.clone().negate(),
      );
      const hit = probe.intersectObject(bossBody, false)[0];
      if (hit === undefined || hit.face === null || hit.face === undefined) continue;
      if (!headBounds.containsPoint(hit.point)) return candidate;
    }
    return direction;
  };
  const rayDistance = size.length() * 2;
  const center = bodyBounds.getCenter(new THREE.Vector3());
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(bossBody.matrixWorld);
  const placements = group.children.map((node, index) => {
    if (!(node instanceof THREE.Mesh)) return undefined;
    const direction = headYawAvoid(spikeDirection(index));
    const ray = new THREE.Raycaster(
      center.clone().addScaledVector(direction, rayDistance),
      direction.clone().negate(),
    );
    const hit = ray.intersectObject(bossBody, false)[0];
    if (hit === undefined || hit.face === null || hit.face === undefined) return undefined;
    const worldNormal = hit.face.normal.clone().applyNormalMatrix(normalMatrix).normalize();
    const anchorWorld = anchor.getWorldPosition(new THREE.Vector3());
    const normal = anchor
      .worldToLocal(anchorWorld.clone().add(worldNormal))
      .sub(anchor.worldToLocal(anchorWorld.clone()))
      .normalize();
    return { node, normal, point: anchor.worldToLocal(hit.point.clone()) };
  });
  placements.forEach((placement, index) => {
    const node = group.children[index];
    if (!(node instanceof THREE.Mesh)) return;
    if (placement === undefined) {
      const direction = spikeDirection(index);
      node.scale.setScalar(scale);
      node.position.copy(
        anchor.worldToLocal(center.clone().addScaledVector(direction, size.length() * 0.45)),
      );
      node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      return;
    }
    const { node: placedNode, normal, point } = placement;
    placedNode.scale.setScalar(scale);
    placedNode.position.copy(point).addScaledVector(normal, length * 0.42);
    placedNode.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  });
  return true;
};

// Boss-only assignment: Hydra and Evil Catbug carry crystal crowns, while Colossus and
// Catbug carry orbital runes; all four bosses receive raycast elemental spines on their silhouette.
export const bossGeometryProfilesForFamily = (
  family: BodyFamily,
): readonly BossGeometryProfile[] => {
  if (
    family === "boss-hydra" ||
    family === "boss-colossus" ||
    family === "boss-catbug" ||
    family === "boss-evil-catbug"
  )
    return BOSS_GEOMETRY_RECIPES[family];
  return ["legacy/no-overlay"];
};

const recipesFor = (family: BossFamily): readonly [BossRecipe, BossRecipe] =>
  BOSS_GEOMETRY_RECIPES[family];
const builders: Readonly<Record<BossRecipe, () => BossGeometryBuild>> = {
  "crystal-crown": crystalCrown,
  "orbital-runes": orbitalRunes,
  "elemental-spines": elementalSpines,
};

export const buildBossGeometryRecipe = (
  recipe: BossRecipe,
  naming: "production" | "lab" = "production",
): THREE.Group => {
  const group = builders[recipe]().group;
  if (naming === "production") return group;
  group.name = `lab-recipe-${recipe}`;
  group.children.forEach((node, index) => {
    if (recipe === "crystal-crown") node.name = `lab-crystal-crown-${index}`;
    else if (recipe === "orbital-runes") node.name = `lab-orbital-rune-${index}`;
    else node.name = `lab-elemental-spine-${index}`;
  });
  return group;
};

const ANCHORS: Readonly<Record<BossRecipe, "overhead" | "orbit">> = {
  "crystal-crown": "overhead",
  "orbital-runes": "orbit",
  "elemental-spines": "orbit",
};

const fit = (
  recipe: BossRecipe,
  group: THREE.Group,
  unit: THREE.Object3D,
  bossBody: THREE.Mesh,
  anchor: THREE.Object3D,
): boolean => {
  // Detach so the unit's own bounds never include the candidate being fitted.
  group.removeFromParent();
  unit.updateMatrixWorld(true);
  const unitBounds = new THREE.Box3().setFromObject(unit);
  if (unitBounds.isEmpty()) return false;
  const localBounds = boundsInSocket(unitBounds, anchor);
  const nativeBounds = new THREE.Box3().setFromObject(group);
  if (recipe === "crystal-crown") return fitAbove(group, localBounds, nativeBounds, 0.38);
  if (recipe === "orbital-runes") return fitOrbit(group, localBounds, nativeBounds);
  return fitSpines(
    group,
    bossBody,
    anchor,
    unit.getObjectByName("enemy-part-hydra-head-1") ??
      unit.getObjectByName(`enemy-socket-${bossBody.name.replace("enemy-body-", "")}-head`),
  );
};

export const decorateBossGeometry = (
  family: BossFamily,
  reducedMotion: boolean,
): EnemyVisualComponent[] => {
  return recipesFor(family).map((recipe) => {
    const build = builders[recipe]();
    const key = `boss-geometry-${recipe}`;
    let fitted = false;
    let fittedBody: THREE.Mesh | undefined;
    const fitIfReady = (): void => {
      const anchor = build.group.parent;
      const unit = anchor?.parent;
      if (anchor === null || unit === null || anchor === undefined || unit === undefined) return;
      const bossBody = unit.getObjectByName(`enemy-body-${family}`);
      if (!(bossBody instanceof THREE.Mesh) || (fitted && fittedBody === bossBody)) return;
      fitted = fit(recipe, build.group, unit, bossBody, anchor);
      fittedBody = fitted ? bossBody : undefined;
      if (fitted) anchor.add(build.group);
    };
    return {
      ...component(
        key,
        "decoration",
        [build.group],
        {
          [`${key}-fit`]: fitIfReady,
          ...(build.tick === undefined ? {} : { [key]: () => build.tick?.(reducedMotion) }),
        },
        undefined,
        ANCHORS[recipe],
      ),
      onAttach: fitIfReady,
    };
  });
};

export class BossGeometryDecorator {
  constructor(
    private readonly family: BossFamily,
    private readonly reducedMotion: boolean,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    decorateBossGeometry(this.family, this.reducedMotion).forEach((geometry) =>
      builder.add(geometry),
    );
  }
}
