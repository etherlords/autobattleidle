import * as THREE from "three";

export type EffectKind = "boss" | "death" | "hit" | "spawn";

type EffectDefinition = {
  readonly color: string;
  readonly life: number;
  readonly outerRadius: number;
};

export const BATTLEFIELD_EFFECT_CONFIG = {
  actorAnchor: { x: 1.7, y: 0.04, z: 0 },
  geometry: { innerRadius: 0.15, segments: 20 },
  growth: 1.08,
  maximumActive: 12,
  variants: {
    boss: { color: "#8bdbff", life: 18, outerRadius: 1.2 },
    death: { color: "#ff6d52", life: 10, outerRadius: 0.7 },
    hit: { color: "#fff4ba", life: 10, outerRadius: 0.7 },
    spawn: { color: "#8bdbff", life: 10, outerRadius: 0.7 },
  },
} as const satisfies {
  readonly actorAnchor: { readonly x: number; readonly y: number; readonly z: number };
  readonly geometry: { readonly innerRadius: number; readonly segments: number };
  readonly growth: number;
  readonly maximumActive: number;
  readonly variants: Readonly<Record<EffectKind, EffectDefinition>>;
};

export const MAX_ACTIVE_EFFECTS = BATTLEFIELD_EFFECT_CONFIG.maximumActive;
export const effectEvictions = (activeCount: number, additionCount: number): number =>
  Math.max(0, activeCount + additionCount - MAX_ACTIVE_EFFECTS);

export type BattlefieldEffect = {
  readonly kind: EffectKind;
  life: number;
  readonly mesh: THREE.Mesh;
};

export const createBattlefieldEffect = (kind: EffectKind): BattlefieldEffect => {
  const definition = BATTLEFIELD_EFFECT_CONFIG.variants[kind];
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    emissive: definition.color,
    roughness: 0.55,
  });
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(
      BATTLEFIELD_EFFECT_CONFIG.geometry.innerRadius,
      definition.outerRadius,
      BATTLEFIELD_EFFECT_CONFIG.geometry.segments,
    ),
    material,
  );
  mesh.rotation.x = -Math.PI / 2;
  const { x, y, z } = BATTLEFIELD_EFFECT_CONFIG.actorAnchor;
  mesh.position.set(x, y, z);
  return { kind, life: definition.life, mesh };
};

export const advanceBattlefieldEffect = (effect: BattlefieldEffect): boolean => {
  effect.life -= 1;
  effect.mesh.scale.multiplyScalar(BATTLEFIELD_EFFECT_CONFIG.growth);
  return effect.life > 0;
};
