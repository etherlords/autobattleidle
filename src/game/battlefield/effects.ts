import * as THREE from "three";

export type EffectKind =
  | "armor"
  | "boss"
  | "coin"
  | "critical"
  | "death"
  | "golden-escape"
  | "golden-kill"
  | "hit"
  | "spawn";

type EffectDefinition = {
  readonly color: string;
  readonly life: number;
  readonly size: number;
};

export const BATTLEFIELD_EFFECT_CONFIG = {
  actorAnchor: { x: 1.7, y: 0.04, z: 0 },
  geometry: { innerRadius: 0.15, segments: 20 },
  growth: 1.08,
  maximumActive: 12,
  variants: {
    armor: { color: "#8bdbff", life: 10, size: 0.42 },
    boss: { color: "#8bdbff", life: 18, size: 1.2 },
    coin: { color: "#ffd766", life: 12, size: 0.28 },
    critical: { color: "#fff4ba", life: 12, size: 0.65 },
    death: { color: "#ff6d52", life: 10, size: 0.55 },
    "golden-escape": { color: "#d4af37", life: 14, size: 0.5 },
    "golden-kill": { color: "#ffd766", life: 16, size: 0.65 },
    hit: { color: "#fff4ba", life: 10, size: 0.7 },
    spawn: { color: "#8bdbff", life: 10, size: 0.7 },
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
  readonly reducedMotion: boolean;
  readonly mesh: THREE.Mesh;
};

const effectGeometry = (kind: EffectKind, size: number): THREE.BufferGeometry => {
  if (kind === "armor") return new THREE.IcosahedronGeometry(size, 0);
  if (kind === "boss") return new THREE.TorusKnotGeometry(size * 0.55, size * 0.12, 32, 8);
  if (kind === "coin") return new THREE.CylinderGeometry(size, size, 0.08, 16);
  if (kind === "critical") return new THREE.TorusGeometry(size * 0.72, size * 0.11, 6, 16);
  if (kind === "death") return new THREE.SphereGeometry(size, 12, 8);
  if (kind === "golden-escape") return new THREE.DodecahedronGeometry(size, 0);
  if (kind === "golden-kill") return new THREE.OctahedronGeometry(size, 0);
  return new THREE.RingGeometry(BATTLEFIELD_EFFECT_CONFIG.geometry.innerRadius, size, 20);
};

export const createBattlefieldEffect = (
  kind: EffectKind,
  reducedMotion = false,
): BattlefieldEffect => {
  const definition = BATTLEFIELD_EFFECT_CONFIG.variants[kind];
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    emissive: definition.color,
    roughness: 0.55,
  });
  const mesh = new THREE.Mesh(effectGeometry(kind, definition.size), material);
  mesh.rotation.x = -Math.PI / 2;
  const { x, y, z } = BATTLEFIELD_EFFECT_CONFIG.actorAnchor;
  mesh.position.set(x, y, z);
  return { kind, life: definition.life, mesh, reducedMotion };
};

export const advanceBattlefieldEffect = (effect: BattlefieldEffect): boolean => {
  effect.life -= 1;
  if (!effect.reducedMotion) effect.mesh.scale.multiplyScalar(BATTLEFIELD_EFFECT_CONFIG.growth);
  return effect.life > 0;
};
