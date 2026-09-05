import * as THREE from "three";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

import type { EnemyViewBuilder } from "../builder";
import { component, type EnemyVisualComponent } from "../components";
import type { BodyFamily, EnemyVisualProfile } from "../spec";

export type SemanticSurfaceTreatment = "scratches" | "shell-plates" | "affinity-mark";
export type SemanticSurfaceMode = "none" | "scratches" | "plates" | "affinity" | "all";

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
const shellPlateFamilies: Readonly<Record<string, true>> = {
  beetle: true,
  brute: true,
  sentinel: true,
  drake: true,
  "boss-colossus": true,
  "boss-catbug": true,
  "boss-goose-hydra": true,
};
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
type SurfaceFace = "front" | "left" | "right" | "flank";
type SurfacePatch = Readonly<{
  readonly center: THREE.Vector3;
  readonly normal: THREE.Vector3;
  readonly size: THREE.Vector3;
}>;

const bodyBounds = (body: THREE.Mesh): THREE.Box3 => {
  body.geometry.computeBoundingBox();
  if (body.geometry.boundingBox === null) throw new Error(`Expected bounds for ${body.name}`);
  return body.geometry.boundingBox.clone();
};

const sideFace = (face: SurfaceFace): boolean =>
  face === "left" || face === "right" || face === "flank";

const faceNormal = (body: THREE.Mesh, face: SurfaceFace): THREE.Vector3 => {
  if (face === "left") return new THREE.Vector3(-1, 0, 0);
  if (sideFace(face) || (face === "front" && body.name.endsWith("drake")))
    return new THREE.Vector3(1, 0, 0);
  return new THREE.Vector3(0, 0, 1);
};

const patchForFace = (
  body: THREE.Mesh,
  face: SurfaceFace,
  tangentU: number,
  tangentV: number,
  widthRatio: number,
  heightRatio: number,
): SurfacePatch => {
  const bounds = bodyBounds(body);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const side = sideFace(face);
  const drakeFront = face === "front" && body.name.endsWith("drake");
  const normal = faceNormal(body, face);
  const tangent = side || drakeFront ? size.z : size.x;
  const height = size.y;
  const depthAxis = side || drakeFront ? size.x : size.z;
  const depth = Math.max(0.04, Math.min(0.18, Math.max(size.x, size.y, size.z) * 0.12));
  center.addScaledVector(normal, Math.max(0.01, depthAxis * 0.5) - depth * 0.35);
  if (side || drakeFront) center.z += tangent * tangentU;
  else center.x += tangent * tangentU;
  center.y += height * tangentV;
  return {
    center,
    normal,
    size: new THREE.Vector3(tangent * widthRatio, height * heightRatio, depth),
  };
};
const createBodyDecal = (
  body: THREE.Mesh,
  parent: THREE.Object3D,
  name: string,
  patch: SurfacePatch,
  material: THREE.MeshStandardMaterial,
): THREE.Mesh => {
  body.updateWorldMatrix(true, false);
  parent.updateWorldMatrix(true, false);
  const localNormal = patch.normal.clone().normalize();
  const pose = parent.parent?.parent ?? parent.parent;
  const poseWorldQuaternion =
    pose?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  const worldNormal = localNormal.clone().applyQuaternion(poseWorldQuaternion).normalize();
  const worldOrientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    worldNormal,
  );
  let worldCenter = patch.center.clone().applyMatrix4(body.matrixWorld);
  const bodyBoundsWorld = new THREE.Box3().setFromObject(body);
  const rayDistance = bodyBoundsWorld.getSize(new THREE.Vector3()).length() * 2;
  const hit = new THREE.Raycaster(
    worldCenter.clone().addScaledVector(worldNormal, rayDistance),
    worldNormal.clone().negate(),
  ).intersectObject(body, false)[0];
  if (hit !== undefined)
    worldCenter = hit.point.clone().addScaledVector(worldNormal, patch.size.z * 0.12);
  const geometry = new DecalGeometry(
    body,
    worldCenter,
    new THREE.Euler().setFromQuaternion(worldOrientation),
    patch.size,
  );
  const inverse = parent.matrixWorld.clone().invert();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(inverse);
  const parentWorldQuaternion = parent.getWorldQuaternion(new THREE.Quaternion());
  const parentOrientation = parentWorldQuaternion.clone().invert().multiply(worldOrientation);
  const projectorLocalOrientation = parentOrientation.clone().invert();
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1)
    positions.setXYZ(
      index,
      ...new THREE.Vector3(positions.getX(index), positions.getY(index), positions.getZ(index))
        .applyMatrix4(inverse)
        .applyQuaternion(projectorLocalOrientation)
        .toArray(),
    );
  const normals = geometry.getAttribute("normal");
  if (normals !== undefined)
    for (let index = 0; index < normals.count; index += 1)
      normals.setXYZ(
        index,
        ...new THREE.Vector3(normals.getX(index), normals.getY(index), normals.getZ(index))
          .applyNormalMatrix(normalMatrix)
          .applyQuaternion(projectorLocalOrientation)
          .normalize()
          .toArray(),
      );
  positions.needsUpdate = true;
  if (normals !== undefined) normals.needsUpdate = true;
  const node = new THREE.Mesh(geometry, material);
  node.name = name;
  node.quaternion.copy(parentOrientation);
  return node;
};

const surfaceComponent = (
  key: string,
  nodes: readonly THREE.Object3D[],
  dispose: () => void,
  refresh: (body: THREE.Mesh) => void,
): EnemyVisualComponent => ({
  ...component(key, "decoration", nodes, undefined, undefined, "body"),
  dispose,
  refresh,
});
const clearSurfaceChildren = (group: THREE.Group): void => {
  [...group.children].forEach((child) => disposeGeneratedNodes([child]));
};

const scratches = (
  body: THREE.Mesh,
  parent: THREE.Object3D,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent => {
  const group = new THREE.Group();
  group.name = "semantic-surface-scratches";
  const populate = (target: THREE.Mesh): void => {
    authoredScratchOffsets.forEach(([x, y, rotation], index) => {
      const mark = createBodyDecal(
        target,
        parent,
        `surface-scratch-${index}`,
        patchForFace(target, "front", x * 1.3, y * 1.4, 0.22 + profile.variant * 0.015, 0.045),
        markMaterial(palette.accent, palette.emissive),
      );
      mark.rotateZ(rotation);
      group.add(mark);
    });
  };
  populate(body);
  let disposed = false;
  const refresh = (target: THREE.Mesh): void => {
    clearSurfaceChildren(group);
    populate(target);
  };
  return surfaceComponent(
    "semantic-surface-scratches",
    [group],
    () => {
      if (disposed) return;
      disposed = true;
      clearSurfaceChildren(group);
      group.removeFromParent();
    },
    refresh,
  );
};

const shellPlates = (
  body: THREE.Mesh,
  parent: THREE.Object3D,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent[] =>
  (["left", "right"] as const).map((anchor) => {
    const group = new THREE.Group();
    group.name = `semantic-surface-shell-plates-${anchor}`;
    const populate = (target: THREE.Mesh): void => {
      authoredPlateOffsets.forEach(([x, y, rotation], index) => {
        const plate = createBodyDecal(
          target,
          parent,
          `surface-shell-plate-${anchor}-${index}`,
          patchForFace(
            target,
            anchor,
            (anchor === "left" ? -1 : 1) * x * 1.4,
            y * 1.5,
            0.3 + profile.variant * 0.012,
            0.18,
          ),
          markMaterial(palette.core, palette.emissive),
        );
        plate.rotateZ(rotation);
        group.add(plate);
      });
    };
    populate(body);
    let disposed = false;
    const refresh = (target: THREE.Mesh): void => {
      clearSurfaceChildren(group);
      populate(target);
    };
    return surfaceComponent(
      `semantic-surface-shell-plates-${anchor}`,
      [group],
      () => {
        if (disposed) return;
        disposed = true;
        disposeGeneratedNodes([group]);
      },
      refresh,
    );
  });

const affinityMark = (
  body: THREE.Mesh,
  parent: THREE.Object3D,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
): EnemyVisualComponent => {
  const acquired = acquireAffinityTexture(palette, profile);
  const group = new THREE.Group();
  group.name = "semantic-surface-affinity-mark";
  const populate = (target: THREE.Mesh): void => {
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
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    group.add(
      createBodyDecal(
        target,
        parent,
        "surface-affinity-mark",
        patchForFace(target, "flank", 0, 0.04, 0.42 + profile.variant * 0.02, 0.42),
        material,
      ),
    );
  };
  populate(body);
  let disposed = false;
  const refresh = (target: THREE.Mesh): void => {
    clearSurfaceChildren(group);
    populate(target);
  };
  return surfaceComponent(
    "semantic-surface-affinity-mark",
    [group],
    () => {
      if (disposed) return;
      disposed = true;
      clearSurfaceChildren(group);
      group.removeFromParent();
      if (acquired.key !== undefined) releaseAffinityTexture(acquired.key);
    },
    refresh,
  );
};

export const semanticSurfaceTreatmentsForFamily = (
  family: BodyFamily,
): readonly SemanticSurfaceTreatment[] =>
  shellPlateFamilies[family] === true
    ? ["scratches", "shell-plates", "affinity-mark"]
    : ["scratches", "affinity-mark"];
export const decorateSemanticSurfaces = (
  family: BodyFamily,
  palette: SurfacePalette,
  profile: EnemyVisualProfile,
  body: THREE.Mesh,
  parent: THREE.Object3D = body,
  mode: SemanticSurfaceMode = "all",
): readonly EnemyVisualComponent[] => {
  if (mode === "none") return [];
  const treatments = semanticSurfaceTreatmentsForFamily(family);
  if (mode === "scratches") return [scratches(body, parent, palette, profile)];
  if (mode === "affinity") return [affinityMark(body, parent, palette, profile)];
  if (mode === "plates")
    return treatments.includes("shell-plates") ? shellPlates(body, parent, palette, profile) : [];
  const components: EnemyVisualComponent[] = [
    scratches(body, parent, palette, profile),
    affinityMark(body, parent, palette, profile),
  ];
  if (treatments.includes("shell-plates"))
    components.splice(1, 0, ...shellPlates(body, parent, palette, profile));
  return components;
};

const bodyMeshForAnchor = (anchor: THREE.Object3D): THREE.Mesh | undefined => {
  if (anchor instanceof THREE.Mesh) return anchor;
  let body: THREE.Mesh | undefined;
  anchor.parent?.traverse((node) => {
    if (body === undefined && node instanceof THREE.Mesh && node.name.startsWith("enemy-body-"))
      body = node;
  });
  return body;
};

export class SemanticSurfaceDecorator {
  constructor(
    private readonly family: BodyFamily,
    private readonly palette: SurfacePalette,
    private readonly profile: EnemyVisualProfile,
    private readonly mode: SemanticSurfaceMode = "all",
  ) {}

  attach(builder: EnemyViewBuilder): void {
    const anchor = builder.anchorNode("body");
    const body = anchor === undefined ? undefined : bodyMeshForAnchor(anchor);
    if (anchor === undefined || body === undefined)
      throw new Error(`Semantic surfaces require a mesh body for ${this.family}`);
    const surfaces = decorateSemanticSurfaces(
      this.family,
      this.palette,
      this.profile,
      body,
      anchor,
      this.mode,
    );
    surfaces.forEach((surface) => builder.add(surface));
    anchor.userData.refreshSemanticSurfaces = (): void => {
      const loadedBody = bodyMeshForAnchor(anchor);
      if (loadedBody === undefined) return;
      surfaces.forEach((surface) => surface.refresh?.(loadedBody));
    };
  }
}
