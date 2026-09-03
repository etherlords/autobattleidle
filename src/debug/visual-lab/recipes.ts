import * as THREE from "three";

import type { EnemyFamily } from "../../domain/combat";
import { buildBossGeometryRecipe } from "../../game/enemy-visual/decorators/boss-geometry-decorator";

export const LAB_RECIPES = [
  "production",
  "legacy/no-overlay",
  "socket-probe",
  "crystal-crown",
  "orbital-runes",
  "elemental-spines",
] as const;
export type LabRecipe =
  | "production"
  | "legacy/no-overlay"
  | "socket-probe"
  | "crystal-crown"
  | "orbital-runes"
  | "elemental-spines";
export const BOSS_ONLY_LAB_RECIPES = [
  "crystal-crown",
  "orbital-runes",
  "elemental-spines",
] as const satisfies readonly LabRecipe[];
export type LabRecipeValidation = {
  readonly valid: boolean;
  readonly reason?: string;
};
export const validateLabRecipe = (recipe: LabRecipe, family: EnemyFamily): LabRecipeValidation => {
  if (recipe === "production" || recipe === "legacy/no-overlay" || recipe === "socket-probe")
    return { valid: true };
  if (family !== "boss-hydra" && family !== "boss-colossus")
    return {
      valid: false,
      reason: `${recipe} is boss-only; select Hydra or Colossus before attaching it`,
    };
  return { valid: true };
};
export const normalizeLabRecipe = (recipe: LabRecipe, _boss: boolean): LabRecipe => recipe;

type CandidateAnchor = "overhead" | "orbit" | "top";
type CandidateRecipe = {
  readonly anchor: CandidateAnchor;
  build(): THREE.Group;
  fit(
    group: THREE.Group,
    bounds: THREE.Box3,
    nativeBounds: THREE.Box3,
    anchor: THREE.Object3D,
    bossBody: THREE.Mesh,
  ): boolean;
};

const socket = (unit: THREE.Object3D, anchor: CandidateAnchor): THREE.Object3D => {
  let target: THREE.Object3D | undefined;
  unit.traverse((node) => {
    if (target === undefined && node.name.endsWith(`-${anchor}`)) target = node;
  });
  return target ?? unit;
};

const dispose = (root: THREE.Object3D): (() => void) => {
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh || node instanceof THREE.LineSegments)) return;
      node.geometry.dispose();
      if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
      else node.material.dispose();
    });
    root.removeFromParent();
  };
};

const boundsInSocket = (bounds: THREE.Box3, anchor: THREE.Object3D): THREE.Box3 => {
  const inverse = anchor.matrixWorld.clone().invert();
  const localBounds = new THREE.Box3().makeEmpty();
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z])
        localBounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
    }
  }
  return localBounds;
};

const fitAbove = (
  group: THREE.Group,
  bounds: THREE.Box3,
  nativeBounds: THREE.Box3,
  heightRatio: number,
): boolean => {
  const bodySize = bounds.getSize(new THREE.Vector3());
  const nativeHeight = nativeBounds.getSize(new THREE.Vector3()).y;
  if (nativeHeight === 0 || bodySize.y === 0) return false;
  const scale = (bodySize.y * heightRatio) / nativeHeight;
  const center = bounds.getCenter(new THREE.Vector3());
  group.scale.setScalar(scale);
  group.position.set(
    center.x,
    bounds.max.y + bodySize.y * 0.06 - nativeBounds.min.y * scale,
    center.z,
  );
  return true;
};

const fitOrbit = (group: THREE.Group, bounds: THREE.Box3, nativeBounds: THREE.Box3): boolean => {
  const bodySize = bounds.getSize(new THREE.Vector3());
  const nativeSize = nativeBounds.getSize(new THREE.Vector3());
  const nativeRadius = Math.max(nativeSize.x, nativeSize.z) / 2;
  if (nativeRadius === 0) return false;
  const radius = Math.max(bodySize.x, bodySize.z) / 2 + bodySize.y * 0.08;
  group.scale.setScalar(radius / nativeRadius);
  group.position.copy(bounds.getCenter(new THREE.Vector3()));
  return true;
};

const spikeDirection = (index: number): THREE.Vector3 => {
  const y = 1 - ((index + 0.5) / 18) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
};

const fitSpines = (
  group: THREE.Group,
  bounds: THREE.Box3,
  anchor: THREE.Object3D,
  bossBody: THREE.Mesh,
): boolean => {
  const size = bounds.getSize(new THREE.Vector3());
  const scale = Math.min(1.25, Math.max(0.7, size.length() / 5));
  const length = 0.55 * scale;
  bossBody.updateWorldMatrix(true, false);
  anchor.updateWorldMatrix(true, false);
  const bodyBounds = new THREE.Box3().setFromObject(bossBody);
  const center = bodyBounds.getCenter(new THREE.Vector3());
  const rayDistance = bodyBounds.getSize(new THREE.Vector3()).length() * 2;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(bossBody.matrixWorld);
  const placements = group.children.map((node, index) => {
    if (!(node instanceof THREE.Mesh)) return undefined;
    const direction = spikeDirection(index);
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
  if (placements.some((placement) => placement === undefined)) return false;
  placements.forEach((placement) => {
    if (placement === undefined) return;
    const { node, normal, point } = placement;
    node.scale.setScalar(scale);
    node.position.copy(point).addScaledVector(normal, length * 0.42);
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  });
  return true;
};

const recipes: Readonly<
  Record<Exclude<LabRecipe, "production" | "legacy/no-overlay" | "socket-probe">, CandidateRecipe>
> = {
  "crystal-crown": {
    anchor: "overhead",
    build: () => buildBossGeometryRecipe("crystal-crown", "lab"),
    fit: (group, bounds, nativeBounds) => fitAbove(group, bounds, nativeBounds, 0.38),
  },
  "orbital-runes": {
    anchor: "orbit",
    build: () => buildBossGeometryRecipe("orbital-runes", "lab"),
    fit: fitOrbit,
  },
  "elemental-spines": {
    anchor: "orbit",
    build: () => buildBossGeometryRecipe("elemental-spines", "lab"),
    fit: (group, bounds, _nativeBounds, anchor, bossBody) =>
      fitSpines(group, bounds, anchor, bossBody),
  },
};

const bossBody = (unit: THREE.Object3D): THREE.Mesh | undefined => {
  let body: THREE.Mesh | undefined;
  unit.traverse((node) => {
    if (
      body === undefined &&
      node instanceof THREE.Mesh &&
      node.name.startsWith("enemy-body-boss-")
    )
      body = node;
  });
  return body;
};

export const attachLabRecipe = (recipe: LabRecipe, unit: THREE.Object3D): (() => void) => {
  if (recipe === "production" || recipe === "legacy/no-overlay") return () => undefined;
  if (recipe === "socket-probe") {
    const marker = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12),
      new THREE.MeshBasicMaterial({ color: "#ff4fd8", wireframe: true }),
    );
    marker.name = "lab-candidate-socket-probe";
    socket(unit, "top").add(marker);
    return dispose(marker);
  }
  const candidate = recipes[recipe];
  const body = bossBody(unit);
  if (body === undefined) return () => undefined;
  unit.updateMatrixWorld(true);
  const unitBounds = new THREE.Box3().setFromObject(unit);
  const group = candidate.build();
  const nativeBounds = new THREE.Box3().setFromObject(group);
  const anchor = socket(unit, candidate.anchor);
  anchor.add(group);
  if (
    unitBounds.isEmpty() ||
    !candidate.fit(group, boundsInSocket(unitBounds, anchor), nativeBounds, anchor, body)
  ) {
    dispose(group)();
    return () => undefined;
  }
  return dispose(group);
};

export const advanceLabRecipe = (
  recipe: LabRecipe,
  unit: THREE.Object3D | undefined,
  reducedMotion: boolean,
): void => {
  if (recipe !== "orbital-runes" || unit === undefined || reducedMotion) return;
  unit.getObjectByName("lab-recipe-orbital-runes")?.traverse((node) => {
    if (node.name.startsWith("lab-orbital-rune-")) node.rotateZ(0.055);
  });
};
