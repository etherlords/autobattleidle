import * as THREE from "three";

export type EffectKind = "boss" | "death" | "hit" | "spawn";

const EFFECTS: Readonly<
  Record<
    EffectKind,
    { readonly color: string; readonly life: number; readonly outerRadius: number }
  >
> = {
  boss: { color: "#8bdbff", life: 18, outerRadius: 1.2 },
  death: { color: "#ff6d52", life: 10, outerRadius: 0.7 },
  hit: { color: "#fff4ba", life: 10, outerRadius: 0.7 },
  spawn: { color: "#8bdbff", life: 10, outerRadius: 0.7 },
};

export const MAX_ACTIVE_EFFECTS = 12;
export const effectEvictions = (activeCount: number, additionCount: number): number =>
  Math.max(0, activeCount + additionCount - MAX_ACTIVE_EFFECTS);

export type BattlefieldEffect = {
  readonly kind: EffectKind;
  life: number;
  readonly mesh: THREE.Mesh;
};

export const createBattlefieldEffect = (kind: EffectKind): BattlefieldEffect => {
  const definition = EFFECTS[kind];
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    emissive: definition.color,
    roughness: 0.55,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.15, definition.outerRadius, 20), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(1.7, 0.04, 0);
  return { kind, life: definition.life, mesh };
};
