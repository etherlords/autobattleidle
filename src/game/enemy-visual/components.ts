import * as THREE from "three";

export type EnemyVisualLayer = "body" | "grade" | "modifier" | "decoration";
export type EnemyVisualComponent = {
  readonly layer: EnemyVisualLayer;
  readonly nodes: readonly THREE.Object3D[];
  readonly animations?: Readonly<Record<string, () => void>>;
};

export const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

export const mesh = (
  geometry: THREE.BufferGeometry,
  color: string,
  emissive?: string,
): THREE.Mesh => new THREE.Mesh(geometry, material(color, emissive));

export const component = (
  layer: EnemyVisualLayer,
  nodes: readonly THREE.Object3D[],
  animations?: Readonly<Record<string, () => void>>,
): EnemyVisualComponent =>
  animations === undefined ? { layer, nodes } : { layer, nodes, animations };
