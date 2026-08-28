import * as THREE from "three";

export type EnemyVisualLayer = "body" | "grade" | "modifier" | "decoration";
export type EnemyVisualCommand = "spawn" | "hit" | "critical" | "death";
export type EnemyVisualComponent = {
  readonly key: string;
  readonly layer: EnemyVisualLayer;
  readonly nodes: readonly THREE.Object3D[];
  readonly animations?: Readonly<Record<string, () => void>>;
  readonly commands?: Partial<Readonly<Record<EnemyVisualCommand, () => void>>>;
  readonly dispose?: () => void;
};

export const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

export const mesh = (
  geometry: THREE.BufferGeometry,
  color: string,
  emissive?: string,
): THREE.Mesh => new THREE.Mesh(geometry, material(color, emissive));

export const component = (
  key: string,
  layer: EnemyVisualLayer,
  nodes: readonly THREE.Object3D[],
  animations?: Readonly<Record<string, () => void>>,
  commands?: Partial<Readonly<Record<EnemyVisualCommand, () => void>>>,
): EnemyVisualComponent => {
  if (animations !== undefined && commands !== undefined)
    return { key, layer, nodes, animations, commands };
  if (animations !== undefined) return { key, layer, nodes, animations };
  if (commands !== undefined) return { key, layer, nodes, commands };
  return { key, layer, nodes };
};
