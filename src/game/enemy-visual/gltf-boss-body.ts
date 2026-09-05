import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

import { enemyVisualAnimation } from "./config";
import { component, type EnemyVisualComponent } from "./components";
import type { BodyFamily, EnemyVisualProfile } from "./spec";

const loader = new GLTFLoader();
const sourceCache = new Map<string, Promise<THREE.Group>>();

type GltfBossFamily = Extract<BodyFamily, "boss-catbug" | "boss-evil-catbug">;
type BossAssetProfile = {
  readonly url: string;
  readonly scale: number;
  readonly topY: number;
  readonly frontZ: number;
  readonly halfWidth: number;
  readonly flankZ: number;
  readonly orbitY: number;
  readonly orbitRadius: number;
  readonly combatY: number;
  readonly combatZ: number;
  readonly metalness?: number;
  readonly roughness?: number;
};

// The supplied files use materially different authoring units. These scales keep their
// world-space envelopes comparable to the existing boss bodies after the shared boss scale.
const BOSS_ASSETS: Readonly<Record<GltfBossFamily, BossAssetProfile>> = {
  "boss-catbug": {
    url: "./assets/catbug.glb",
    scale: 1.1,
    topY: 2.18,
    frontZ: 0.86,
    halfWidth: 0.98,
    flankZ: 0.1,
    orbitY: 1.08,
    orbitRadius: 1.2,
    combatY: 0.88,
    combatZ: 0.92,
    metalness: 0,
    roughness: 0.82,
  },
  "boss-evil-catbug": {
    url: "./assets/evilcatbug.glb",
    scale: 15,
    topY: 1.85,
    frontZ: 0.82,
    halfWidth: 0.99,
    flankZ: 0.1,
    orbitY: 0.9,
    orbitRadius: 1.15,
    combatY: 0.72,
    combatZ: 0.86,
    metalness: 0,
    roughness: 0.78,
  },
};

const sourceScene = (url: string): Promise<THREE.Group> => {
  const cached = sourceCache.get(url);
  if (cached !== undefined) return cached;
  const pending = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error),
    );
  });
  sourceCache.set(url, pending);
  return pending;
};

const cloneMaterial = (
  material: THREE.Material,
  textures: Map<THREE.Texture, THREE.Texture>,
  asset: BossAssetProfile,
): THREE.Material => {
  const clone = material.clone();
  for (const [key, value] of Object.entries(clone)) {
    if (!(value instanceof THREE.Texture)) continue;
    let texture = textures.get(value);
    if (texture === undefined) {
      texture = value.clone();
      textures.set(value, texture);
    }
    Reflect.set(clone, key, texture);
  }
  if (clone instanceof THREE.MeshStandardMaterial) {
    if (asset.metalness !== undefined) clone.metalness = asset.metalness;
    if (asset.roughness !== undefined) clone.roughness = asset.roughness;
  }
  return clone;
};

const cloneResources = (source: THREE.Group, asset: BossAssetProfile): THREE.Group => {
  const clone = SkeletonUtils.clone(source) as THREE.Group;
  const textures = new Map<THREE.Texture, THREE.Texture>();
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry = child.geometry.clone();
    const surface = child.material;
    child.material = Array.isArray(surface)
      ? surface.map((entry) => cloneMaterial(entry, textures, asset))
      : cloneMaterial(surface, textures, asset);
  });
  return clone;
};

const disposeResources = (object: THREE.Object3D): void => {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    const surfaces = Array.isArray(child.material) ? child.material : [child.material];
    surfaces.forEach((surface) => {
      materials.add(surface);
      Object.values(surface).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
};

const socket = (
  family: BodyFamily,
  name: string,
  parent: THREE.Object3D,
  position: THREE.Vector3,
) => {
  const node = new THREE.Group();
  node.name = `enemy-socket-${family}-${name}`;
  node.position.copy(position);
  parent.add(node);
  return node;
};

const augmentFallbackWithGltf = (
  family: GltfBossFamily,
  asset: BossAssetProfile,
  fallback: EnemyVisualComponent,
): EnemyVisualComponent => {
  const root = fallback.nodes[0];
  if (root === undefined) return fallback;
  const fallbackFamily = family === "boss-catbug" ? "boss-colossus" : "boss-hydra";
  root.traverse((child) => {
    if (child.name.includes(fallbackFamily))
      child.name = child.name.replaceAll(fallbackFamily, family);
  });
  const fallbackBounds = new THREE.Box3().setFromObject(root);
  const legacyMeshes: THREE.Mesh[] = [];
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) legacyMeshes.push(child);
  });
  const fallbackBody = legacyMeshes.find((mesh) => mesh.name.startsWith("enemy-body-"));
  if (fallbackBody !== undefined) fallbackBody.name = `enemy-body-${family}`;
  let instance: THREE.Group | undefined;
  let disposed = false;
  const assetReady: Promise<void> = sourceScene(asset.url)
    .then((source) => {
      if (disposed) return;
      instance = cloneResources(source, asset);
      const sourceBounds = new THREE.Box3().setFromObject(instance);
      instance.scale.setScalar(asset.scale);
      instance.position.y =
        (Number.isFinite(fallbackBounds.min.y) ? fallbackBounds.min.y : 0) -
        sourceBounds.min.y * asset.scale;
      legacyMeshes.forEach((mesh) => {
        mesh.removeFromParent();
        disposeResources(mesh);
      });
      let named = false;
      instance.traverse((child) => {
        if (!named && child instanceof THREE.Mesh) {
          child.name = `enemy-body-${family}`;
          named = true;
        }
      });
      root.add(instance);
    })
    .catch(() => undefined);
  return {
    assetReady,
    ...fallback,
    dispose: () => {
      disposed = true;
      fallback.dispose?.();
      if (instance !== undefined) {
        instance.removeFromParent();
        disposeResources(instance);
        instance = undefined;
      }
    },
  };
};

export const gltfBossBody = (
  family: GltfBossFamily,
  _profile?: EnemyVisualProfile,
  reducedMotionOverride?: boolean,
  fallback?: EnemyVisualComponent,
): EnemyVisualComponent => {
  const asset = BOSS_ASSETS[family];
  if (fallback !== undefined) return augmentFallbackWithGltf(family, asset, fallback);
  const pose = new THREE.Group();
  pose.name = `enemy-pose-${family}`;
  const rig = new THREE.Group();
  rig.name = `enemy-rig-${family}`;
  pose.add(rig);
  const head = socket(family, "head", rig, new THREE.Vector3(0, asset.topY - 0.14, 0));
  const top = socket(family, "top", head, new THREE.Vector3(0, 0.14, 0));
  const overhead = socket(family, "overhead", rig, new THREE.Vector3(0, asset.topY, 0));
  const front = socket(family, "front", rig, new THREE.Vector3(0, 0, asset.frontZ));
  const left = socket(family, "left", rig, new THREE.Vector3(-asset.halfWidth, 0.05, asset.flankZ));
  const right = socket(
    family,
    "right",
    rig,
    new THREE.Vector3(asset.halfWidth, 0.05, asset.flankZ),
  );
  const flank = socket(
    family,
    "flank",
    rig,
    new THREE.Vector3(asset.halfWidth, 0.05, asset.flankZ),
  );
  const orbit = socket(family, "orbit", pose, new THREE.Vector3(0, asset.orbitY, 0));
  orbit.userData.bodyRadius = asset.orbitRadius;
  orbit.userData.maxOrbitRadius = 1.93;
  const combat = socket(family, "combat", rig, new THREE.Vector3(0, asset.combatY, asset.combatZ));

  let instance: THREE.Group | undefined;
  let disposed = false;
  const assetReady: Promise<void> = sourceScene(asset.url)
    .then((source) => {
      if (disposed) return;
      instance = cloneResources(source, asset);
      const sourceBounds = new THREE.Box3().setFromObject(instance);
      instance.scale.setScalar(asset.scale);
      instance.position.y = -sourceBounds.min.y * asset.scale;
      let named = false;
      instance.traverse((child) => {
        if (!named && child instanceof THREE.Mesh) {
          child.name = `enemy-body-${family}`;
          named = true;
        }
      });
      rig.add(instance);
    })
    .catch(() => {
      // A failed optional asset load leaves the lifecycle intact without a procedural substitute.
    });

  const reducedMotion =
    reducedMotionOverride ??
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  const bases = [
    { position: pose.position.clone(), rotation: pose.rotation.clone(), scale: pose.scale.clone() },
  ];
  let command: "spawn" | "hit" | "critical" | "death" | undefined;
  let frames = 0;
  let phase = 0;
  let captured:
    { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } | undefined;
  let residual = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  };
  const reset = (): void => {
    const base = bases[0];
    if (base === undefined) return;
    pose.position.copy(base.position);
    pose.rotation.copy(base.rotation);
    pose.scale.copy(base.scale);
    pose.position.y += Math.sin(phase) * enemyVisualAnimation.idleLift;
  };
  const start = (next: "spawn" | "hit" | "critical" | "death"): void => {
    captured = {
      position: pose.position.clone(),
      rotation: pose.rotation.clone(),
      scale: pose.scale.clone(),
    };
    command = next;
    frames = enemyVisualAnimation.commandFrames[next];
    rig.userData.lastCommand = next;
  };
  const advance = (): void => {
    const total = enemyVisualAnimation.commandFrames[command ?? "hit"];
    const progress = (total - frames) / (total - 1);
    if (captured !== undefined) {
      residual = {
        position: captured.position.clone().sub(pose.position),
        rotation: new THREE.Euler(
          captured.rotation.x - pose.rotation.x,
          captured.rotation.y - pose.rotation.y,
          captured.rotation.z - pose.rotation.z,
        ),
        scale: new THREE.Vector3(
          captured.scale.x / pose.scale.x,
          captured.scale.y / pose.scale.y,
          captured.scale.z / pose.scale.z,
        ),
      };
      captured = undefined;
    }
    const decay = 1 - progress;
    pose.position.addScaledVector(residual.position, decay);
    pose.rotation.x += residual.rotation.x * decay;
    pose.rotation.y += residual.rotation.y * decay;
    pose.rotation.z += residual.rotation.z * decay;
    pose.scale.multiply(
      new THREE.Vector3().lerpVectors(new THREE.Vector3(1, 1, 1), residual.scale, decay),
    );
    const peak = Math.sin(Math.PI * progress);
    if (command === "spawn") {
      const spawnScale = 0.72 + 0.28 * (1 - Math.cos(Math.PI * progress)) * 0.5;
      pose.scale.multiplyScalar(spawnScale);
    }
    if (command === "hit")
      pose.scale.multiply(new THREE.Vector3(1 + 0.08 * peak, 1 - 0.08 * peak, 1 + 0.08 * peak));
    if (command === "critical")
      pose.scale.multiply(new THREE.Vector3(1 + 0.15 * peak, 1 - 0.14 * peak, 1 + 0.15 * peak));
    if (command === "death") {
      pose.scale.multiply(
        new THREE.Vector3(1 + 0.1 * peak, 0.86 - 0.62 * progress, 1 + 0.1 * peak),
      );
      pose.position.y -= 0.2 * progress;
      pose.rotation.z += 0.3 * progress;
    }
    frames -= 1;
    if (frames === 0)
      residual = {
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        scale: new THREE.Vector3(1, 1, 1),
      };
  };
  const componentBase = component(
    `body-${family}`,
    "body",
    [pose],
    {
      [`body-${family}-motion`]: () => {
        if (reducedMotion) {
          frames = Math.max(0, frames - 1);
          if (frames === 0)
            residual = {
              position: new THREE.Vector3(),
              rotation: new THREE.Euler(),
              scale: new THREE.Vector3(1, 1, 1),
            };
          return;
        }
        phase += enemyVisualAnimation.idleRadians;
        reset();
        if (frames > 0) advance();
      },
    },
    {
      spawn: () => start("spawn"),
      hit: () => start("hit"),
      critical: () => start("critical"),
      death: () => start("death"),
    },
    undefined,
    { pose, head, top, overhead, front, left, right, flank, orbit, combat },
  );
  return {
    ...componentBase,
    assetReady,
    dispose: () => {
      disposed = true;
      if (instance !== undefined) {
        instance.removeFromParent();
        disposeResources(instance);
        instance = undefined;
      }
    },
  };
};

export const catbugBossBody = (
  profile?: EnemyVisualProfile,
  reducedMotionOverride?: boolean,
): EnemyVisualComponent => gltfBossBody("boss-catbug", profile, reducedMotionOverride);

export const evilCatbugBossBody = (
  profile?: EnemyVisualProfile,
  reducedMotionOverride?: boolean,
): EnemyVisualComponent => gltfBossBody("boss-evil-catbug", profile, reducedMotionOverride);

export const clearGltfBossCache = (): void => {
  sourceCache.clear();
};
