import * as THREE from "three";

import {
  advanceBattlefieldEffect,
  createBattlefieldEffect,
  effectEvictions,
  type BattlefieldEffect,
  type EffectKind,
} from "../../game/battlefield/effects";

type DisposableResource = THREE.BufferGeometry | THREE.Material | THREE.Texture;
type ResourceSets = {
  readonly geometries: Set<THREE.BufferGeometry>;
  readonly materials: Set<THREE.Material>;
  readonly textures: Set<THREE.Texture>;
};

export type ResourceReceipt = {
  readonly objects: number;
  readonly meshes: number;
  readonly geometries: number;
  readonly materials: number;
  readonly textures: number;
  readonly rendererGeometries: number;
  readonly rendererTextures: number;
  readonly disposed: number;
  readonly expectedDisposals: number;
};
export type ResourceCounts = Pick<
  ResourceReceipt,
  "objects" | "meshes" | "geometries" | "materials" | "textures"
>;

const materialResources = (material: THREE.Material, resources: ResourceSets): void => {
  resources.materials.add(material);
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) resources.textures.add(value);
  });
};

const collect = (root: THREE.Object3D): ResourceSets => {
  const resources: ResourceSets = {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
  };
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh || node instanceof THREE.LineSegments)) return;
    resources.geometries.add(node.geometry);
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => materialResources(material, resources));
  });
  return resources;
};

const resourcesOf = (sets: ResourceSets): readonly DisposableResource[] => [
  ...sets.geometries,
  ...sets.materials,
  ...sets.textures,
];

export const resourceCounts = (root: THREE.Object3D): ResourceCounts => {
  let objects = 0;
  let meshes = 0;
  root.traverse((node) => {
    objects += 1;
    if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments) meshes += 1;
  });
  const resources = collect(root);
  return {
    objects,
    meshes,
    geometries: resources.geometries.size,
    materials: resources.materials.size,
    textures: resources.textures.size,
  };
};

export const resourceSnapshot = (
  root: THREE.Object3D,
  rendererInfo?: THREE.WebGLInfo,
): ResourceReceipt => ({
  ...resourceCounts(root),
  rendererGeometries: rendererInfo?.memory.geometries ?? 0,
  rendererTextures: rendererInfo?.memory.textures ?? 0,
  disposed: 0,
  expectedDisposals: 0,
});

export const observeResourceDisposal = (root: THREE.Object3D): (() => ResourceReceipt) => {
  const snapshot = resourceSnapshot(root);
  let disposed = 0;
  resourcesOf(collect(root)).forEach((resource) =>
    resource.addEventListener("dispose", () => {
      disposed += 1;
    }),
  );
  return () => ({
    ...snapshot,
    disposed,
    expectedDisposals: snapshot.geometries + snapshot.materials + snapshot.textures,
  });
};

export const disposeObjectResources = (root: THREE.Object3D): void => {
  resourcesOf(collect(root)).forEach((resource) => resource.dispose());
  root.removeFromParent();
};

export const resourceReceipt = (receipt: ResourceReceipt): string =>
  `objects ${receipt.objects}, meshes ${receipt.meshes}, geometries ${receipt.geometries}, materials ${receipt.materials}, textures ${receipt.textures}, renderer g/t ${receipt.rendererGeometries}/${receipt.rendererTextures}${receipt.expectedDisposals === 0 ? "" : `, disposed ${receipt.disposed}/${receipt.expectedDisposals}`}`;

export type EffectHarness = {
  readonly size: number;
  readonly disposalReceipts: readonly ResourceReceipt[];
  add(
    kind: EffectKind,
    reducedMotion: boolean,
    origin: THREE.Vector3 | undefined,
    parent: THREE.Object3D,
  ): void;
  advance(): void;
  dispose(): ResourceReceipt;
};

export const createEffectHarness = (): EffectHarness => {
  const effects: Array<{
    readonly effect: BattlefieldEffect;
    readonly receipt: () => ResourceReceipt;
  }> = [];
  const disposalReceipts: ResourceReceipt[] = [];
  let lastReceipt: ResourceReceipt = emptyReceipt();
  const dispose = (entry: {
    readonly effect: BattlefieldEffect;
    readonly receipt: () => ResourceReceipt;
  }): void => {
    disposeObjectResources(entry.effect.mesh);
    lastReceipt = entry.receipt();
    disposalReceipts.push(lastReceipt);
  };
  return {
    get size(): number {
      return effects.length;
    },
    get disposalReceipts(): readonly ResourceReceipt[] {
      return disposalReceipts;
    },
    add(kind, reducedMotion, origin, parent): void {
      const evictions = effectEvictions(effects.length, 1);
      effects.splice(0, evictions).forEach(dispose);
      const effect = createBattlefieldEffect(kind, reducedMotion, origin);
      const receipt = observeResourceDisposal(effect.mesh);
      effects.push({ effect, receipt });
      parent.add(effect.mesh);
    },
    advance(): void {
      for (const entry of [...effects]) {
        if (advanceBattlefieldEffect(entry.effect)) continue;
        effects.splice(effects.indexOf(entry), 1);
        dispose(entry);
      }
    },
    dispose(): ResourceReceipt {
      effects.splice(0).forEach(dispose);
      return lastReceipt;
    },
  };
};

const emptyReceipt = (): ResourceReceipt => ({
  objects: 0,
  meshes: 0,
  geometries: 0,
  materials: 0,
  textures: 0,
  rendererGeometries: 0,
  rendererTextures: 0,
  disposed: 0,
  expectedDisposals: 0,
});
