import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, type EnemyVisualComponent } from "../components";
import type { BodyFamily, EnemyVisualProfile } from "../spec";

export type SemanticSurfaceTreatment = "scratches" | "shell-plates" | "affinity-mark";

type SurfacePalette = Readonly<{
  readonly core: string;
  readonly emissive: string;
  readonly accent: string;
}>;

type TextureEntry = {
  readonly texture: THREE.DataTexture;
  refs: number;
};

type AcquiredAffinityTexture = Readonly<{
  readonly key?: string;
  readonly texture?: THREE.DataTexture;
}>;

const TEXTURE_SIZE = 24;
const MAX_TEXTURE_CACHE_ENTRIES = 8;
const textureCache = new Map<string, TextureEntry>();
const shellPlateFamilies: ReadonlySet<BodyFamily> = new Set([
  "beetle",
  "brute",
  "sentinel",
  "drake",
  "boss-colossus",
  "boss-catbug",
]);
const authoredScratchOffsets = [
  [-0.16, 0.18, -0.28],
  [-0.05, 0.02, 0.24],
  [0.07, -0.14, -0.18],
] as const;
const authoredPlateOffsets = [
  [-0.12, 0.1, -0.18],
  [0.1, -0.08, 0.2],
] as const;

const hexChannel = (value: string, shift: number): number => {
  const parsed = Number.parseInt(value.replace("#", ""), 16);
  return Number.isFinite(parsed) ? (parsed >>> shift) & 0xff : 255;
};

const cacheKey = (palette: SurfacePalette, profile: EnemyVisualProfile): string =>
  `affinity-mark:${palette.core}:${palette.accent}:${profile.variant}`;

const evictIdleTexture = (): void => {
  if (textureCache.size < MAX_TEXTURE_CACHE_ENTRIES) return;
  const idle = [...textureCache.entries()].find(([, entry]) => entry.refs === 0);
  if (idle === undefined) return;
  idle[1].texture.dispose();
  textureCache.delete(idle[0]);
};

const createAffinityTexture = (
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): THREE.DataTexture => {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  const core = [
    hexChannel(palette.core, 16),
    hexChannel(palette.core, 8),
    hexChannel(palette.core, 0),
  ];
  const accent = [
    hexChannel(palette.accent, 16),
    hexChannel(palette.accent, 8),
    hexChannel(palette.accent, 0),
  ];
  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const index = (y * TEXTURE_SIZE + x) * 4;
      const dx = x - (TEXTURE_SIZE - 1) / 2;
      const dy = y - (TEXTURE_SIZE - 1) / 2;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const ring = radius >= 6.1 && radius <= 8.3;
      const cross = Math.abs(dx - dy * (profile.variant === 1 ? -1 : 1)) < 1.1;
      const visible = ring || cross;
      const color = cross ? accent : core;
      data[index] = color[0] ?? 255;
      data[index + 1] = color[1] ?? 255;
      data[index + 2] = color[2] ?? 255;
      data[index + 3] = visible ? 235 : 0;
    }
  }
  const texture = new THREE.DataTexture(data, TEXTURE_SIZE, TEXTURE_SIZE, THREE.RGBAFormat);
  texture.name = `semantic-affinity-mark-${profile.variant}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

const acquireAffinityTexture = (
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): AcquiredAffinityTexture => {
  const key = cacheKey(palette, profile);
  const existing = textureCache.get(key);
  if (existing !== undefined) {
    existing.refs += 1;
    return { key, texture: existing.texture };
  }
  evictIdleTexture();
  if (textureCache.size >= MAX_TEXTURE_CACHE_ENTRIES) {
    // Saturated active cache: deterministically degrade this mark instead of exceeding the cap.
    return {};
  }
  const texture = createAffinityTexture(palette, profile);
  textureCache.set(key, { texture, refs: 1 });
  return { key, texture };
};

const releaseAffinityTexture = (key: string): void => {
  const entry = textureCache.get(key);
  if (entry === undefined) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs !== 0) return;
  entry.texture.dispose();
  textureCache.delete(key);
};

export const semanticSurfaceCacheStats = (): Readonly<{ entries: number; references: number }> => ({
  entries: textureCache.size,
  references: [...textureCache.values()].reduce((total, entry) => total + entry.refs, 0),
});

export const clearSemanticSurfaceCache = (): void => {
  [...textureCache.entries()]
    .filter(([, entry]) => entry.refs === 0)
    .forEach(([key, entry]) => {
      entry.texture.dispose();
      textureCache.delete(key);
    });
};

const markMaterial = (color: string, emissive: string): THREE.MeshStandardMaterial => {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    metalness: 0.1,
    roughness: 0.48,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  return material;
};
const disposeGeneratedNodes = (nodes: readonly THREE.Object3D[]): void => {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  nodes.forEach((node) => {
    node.removeFromParent();
    node.traverse((child) => {
      if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
      geometries.add(child.geometry);
      const surfaces = Array.isArray(child.material) ? child.material : [child.material];
      surfaces.forEach((surface) => materials.add(surface));
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
};
type SurfaceFace = "front" | "flank" | "left" | "right";
const surfaceRotationY = (family: BodyFamily, face: SurfaceFace): number => {
  if (face === "left") return -Math.PI / 2;
  if (face === "flank" || face === "right" || family === "drake") return Math.PI / 2;
  return 0;
};

const surfaceComponent = (
  key: string,
  anchor: "front" | "left" | "right" | "flank",
  nodes: readonly THREE.Object3D[],
  dispose?: () => void,
): EnemyVisualComponent => ({
  ...component(key, "decoration", nodes, undefined, undefined, anchor),
  ...(dispose === undefined ? {} : { dispose }),
});

const scratches = (
  family: BodyFamily,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent => {
  const group = new THREE.Group();
  group.name = "semantic-surface-scratches";
  group.rotation.y = surfaceRotationY(family, "front");
  authoredScratchOffsets.forEach(([x, y, rotation], index) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.19 + profile.variant * 0.012, 0.035, 1, 1),
      markMaterial(palette.accent, palette.emissive),
    );
    mesh.name = `surface-scratch-${index}`;
    mesh.position.set(x, y, 0.022);
    mesh.rotation.z = rotation;
    group.add(mesh);
  });
  let disposed = false;
  return surfaceComponent("semantic-surface-scratches", "front", [group], () => {
    if (disposed) return;
    disposed = true;
    disposeGeneratedNodes([group]);
  });
};

const shellPlates = (
  family: BodyFamily,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent[] =>
  (["left", "right"] as const).map((anchor) => {
    const group = new THREE.Group();
    group.name = `semantic-surface-shell-plates-${anchor}`;
    authoredPlateOffsets.forEach(([x, y, rotation], index) => {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.25 + profile.variant * 0.01, 0.16, 0.035),
        markMaterial(palette.core, palette.emissive),
      );
      plate.name = `surface-shell-plate-${anchor}-${index}`;
      plate.position.set((anchor === "left" ? -1 : 1) * x, y, 0.035);
      plate.rotation.set(0, surfaceRotationY(family, anchor), rotation);
      group.add(plate);
    });
    let disposed = false;
    return surfaceComponent(`semantic-surface-shell-plates-${anchor}`, anchor, [group], () => {
      if (disposed) return;
      disposed = true;
      disposeGeneratedNodes([group]);
    });
  });

const affinityMark = (
  family: BodyFamily,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent => {
  const acquired = acquireAffinityTexture(palette, profile);
  const material = new THREE.MeshStandardMaterial({
    ...(acquired.texture === undefined ? {} : { map: acquired.texture }),
    color: acquired.texture === undefined ? palette.accent : "#ffffff",
    emissive: palette.emissive,
    emissiveIntensity: 0.8,
    metalness: 0.15,
    roughness: 0.42,
    transparent: true,
    opacity: acquired.texture === undefined ? 0.32 : 0.94,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34, 1, 1), material);
  mark.name = "surface-affinity-mark";
  mark.position.set(0, 0.04, 0.04);
  mark.rotation.y = surfaceRotationY(family, "flank");
  let disposed = false;
  return surfaceComponent("semantic-surface-affinity-mark", "flank", [mark], () => {
    if (disposed) return;
    disposed = true;
    disposeGeneratedNodes([mark]);
    if (acquired.key === undefined) return;
    releaseAffinityTexture(acquired.key);
  });
};

export const semanticSurfaceTreatmentsForFamily = (
  family: BodyFamily,
): readonly SemanticSurfaceTreatment[] =>
  shellPlateFamilies.has(family)
    ? ["scratches", "shell-plates", "affinity-mark"]
    : ["scratches", "affinity-mark"];

export const decorateSemanticSurfaces = (
  family: BodyFamily,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): readonly EnemyVisualComponent[] => {
  const treatments = semanticSurfaceTreatmentsForFamily(family);
  const components: EnemyVisualComponent[] = [
    scratches(family, palette, profile),
    affinityMark(family, palette, profile),
  ];
  if (treatments.includes("shell-plates"))
    components.splice(1, 0, ...shellPlates(family, palette, profile));
  return components;
};

export class SemanticSurfaceDecorator {
  constructor(
    private readonly family: BodyFamily,
    private readonly palette: SurfacePalette,
    private readonly profile: EnemyVisualProfile,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    decorateSemanticSurfaces(this.family, this.palette, this.profile).forEach((surface) =>
      builder.add(surface),
    );
  }
}
