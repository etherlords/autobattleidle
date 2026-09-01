import * as THREE from "three";

export const LAB_RECIPES = [
  "production",
  "socket-probe",
  "crystal-crown",
  "orbital-runes",
  "elemental-spines",
] as const;
export type LabRecipe =
  "production" | "socket-probe" | "crystal-crown" | "orbital-runes" | "elemental-spines";

type CandidateAnchor = "overhead" | "orbit" | "front" | "top";
type CandidateRecipe = {
  readonly anchor: CandidateAnchor;
  build(): THREE.Group;
  fit(
    group: THREE.Group,
    bounds: THREE.Box3,
    nativeBounds: THREE.Box3,
    anchor: THREE.Object3D,
    outward: THREE.Vector3,
    surface: number,
  ): void;
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

const projectedExtent = (
  bounds: THREE.Box3,
  direction: THREE.Vector3,
  maximum: boolean,
): number => {
  const corners = [bounds.min, bounds.max];
  const values = corners.flatMap((x) =>
    corners.flatMap((y) => corners.map((z) => new THREE.Vector3(x.x, y.y, z.z).dot(direction))),
  );
  return maximum ? Math.max(...values) : Math.min(...values);
};

const seatOnSurface = (
  group: THREE.Group,
  nativeBounds: THREE.Box3,
  outward: THREE.Vector3,
  surface: number,
): void => {
  const nearest = projectedExtent(nativeBounds, outward, false);
  group.position.copy(outward.multiplyScalar(surface - nearest * group.scale.x - 0.01));
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward.negate());
};

const fitAbove = (
  group: THREE.Group,
  bounds: THREE.Box3,
  nativeBounds: THREE.Box3,
  heightRatio: number,
  _anchor: THREE.Object3D,
  outward: THREE.Vector3,
  surface: number,
): void => {
  const bodySize = bounds.getSize(new THREE.Vector3());
  const nativeHeight = nativeBounds.getSize(new THREE.Vector3()).y;
  if (nativeHeight === 0 || bodySize.y === 0) return;
  const scale = (bodySize.y * heightRatio) / nativeHeight;
  group.scale.setScalar(scale);
  seatOnSurface(group, nativeBounds, outward, surface);
};

const fitOrbit = (
  group: THREE.Group,
  _bounds: THREE.Box3,
  nativeBounds: THREE.Box3,
  anchor: THREE.Object3D,
): void => {
  const nativeSize = nativeBounds.getSize(new THREE.Vector3());
  const nativeRadius = Math.max(nativeSize.x, nativeSize.z) / 2;
  if (nativeRadius === 0) return;
  const radius = Number(anchor.userData.bodyRadius) || 0.9;
  group.scale.setScalar(radius / nativeRadius);
};

const crystalCrown = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = "lab-recipe-crystal-crown";
  [-0.2, 0, 0.2].forEach((x, index) => {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(index === 1 ? 0.3 : 0.21),
      new THREE.MeshStandardMaterial({ color: "#8df5ff", emissive: "#115a7a", metalness: 0.55 }),
    );
    crystal.name = `lab-crystal-crown-${index}`;
    crystal.position.set(x, 0.25 + (index === 1 ? 0.16 : 0), 0);
    crystal.scale.y = index === 1 ? 2.1 : 1.6;
    group.add(crystal);
  });
  return group;
};

const orbitalRunes = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = "lab-recipe-orbital-runes";
  [-0.7, 0, 0.7].forEach((rotation, index) => {
    const rune = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.035, 6, 16),
      new THREE.MeshBasicMaterial({ color: "#b78cff", transparent: true, opacity: 0.82 }),
    );
    rune.name = `lab-orbital-rune-${index}`;
    rune.rotation.set(rotation, rotation * 0.4, rotation * 0.65);
    group.add(rune);
  });
  return group;
};

const elementalSpines = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = "lab-recipe-elemental-spines";
  [-0.22, 0, 0.22].forEach((x, index) => {
    const spine = new THREE.Mesh(
      new THREE.ConeGeometry(index === 1 ? 0.16 : 0.12, index === 1 ? 0.82 : 0.62, 5),
      new THREE.MeshStandardMaterial({ color: "#ff9269", emissive: "#79220e", metalness: 0.3 }),
    );
    spine.name = `lab-elemental-spine-${index}`;
    spine.position.set(x, 0, 0);
    group.add(spine);
  });
  return group;
};

const recipes: Readonly<
  Record<Exclude<LabRecipe, "production" | "socket-probe">, CandidateRecipe>
> = {
  "crystal-crown": {
    anchor: "overhead",
    build: crystalCrown,
    fit: (group, bounds, nativeBounds, anchor, outward, surface) =>
      fitAbove(group, bounds, nativeBounds, 0.38, anchor, outward, surface),
  },
  "orbital-runes": { anchor: "orbit", build: orbitalRunes, fit: fitOrbit },
  "elemental-spines": {
    anchor: "overhead",
    build: elementalSpines,
    fit: (group, bounds, nativeBounds, anchor, outward, surface) =>
      fitAbove(group, bounds, nativeBounds, 0.27, anchor, outward, surface),
  },
};

export const attachLabRecipe = (recipe: LabRecipe, unit: THREE.Object3D): (() => void) => {
  if (recipe === "production") return () => undefined;
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
  unit.updateMatrixWorld(true);
  const unitBounds = new THREE.Box3().setFromObject(unit);
  const group = candidate.build();
  const nativeBounds = new THREE.Box3().setFromObject(group);
  const anchor = socket(unit, candidate.anchor);
  const center = unitBounds.getCenter(new THREE.Vector3());
  const outwardWorld = anchor.getWorldPosition(new THREE.Vector3()).sub(center).normalize();
  const anchorWorld = anchor.getWorldPosition(new THREE.Vector3());
  const outward = anchor
    .worldToLocal(anchorWorld.clone().add(outwardWorld))
    .sub(anchor.worldToLocal(anchorWorld.clone()))
    .normalize();
  const ray = new THREE.Raycaster(
    anchorWorld.clone().addScaledVector(outwardWorld, -10),
    outwardWorld.normalize(),
  );
  const hit = ray.intersectObject(unit, true).at(-1);
  const surface =
    hit === undefined
      ? projectedExtent(boundsInSocket(unitBounds, anchor), outward, true)
      : anchor.worldToLocal(hit.point.clone()).dot(outward);
  anchor.add(group);
  if (!unitBounds.isEmpty())
    candidate.fit(
      group,
      boundsInSocket(unitBounds, anchor),
      nativeBounds,
      anchor,
      outward,
      surface,
    );
  return dispose(group);
};
