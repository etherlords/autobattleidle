import * as THREE from "three";

import type { AttackSource } from "../../domain/combat";
import type { BattleVisualCue } from "../../domain/snapshot";

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

type Slash = {
  readonly delay: number;
  readonly from: THREE.Vector3;
  readonly mesh: THREE.Mesh;
  readonly to: THREE.Vector3;
  readonly trail: readonly SlashTrailLayer[];
};

type SlashTrailLayer = {
  readonly mesh: THREE.Mesh;
  readonly opacityScale: number;
  readonly verticalOffset: number;
};

export const BATTLEFIELD_EFFECT_CONFIG = {
  actorAnchor: { x: 1.7, y: 0.04, z: 0 },
  geometry: { innerRadius: 0.15, segments: 20 },
  growth: 1.08,
  maximumActive: 12,
  slash: {
    criticalRootScale: 2.7,
    framingCompensation: 0.25,
    hitRootScale: 2.05,
    maximumOpacity: 0.42,
  },
  timing: {
    automaticMaximumLife: 12,
    automaticMinimumLife: 6,
    automaticReferenceAps: 12,
    manualLife: 8,
  },
  variants: {
    armor: { color: "#8bdbff", life: 10, size: 0.42 },
    boss: { color: "#8bdbff", life: 18, size: 1.2 },
    coin: { color: "#ffd766", life: 12, size: 0.28 },
    critical: { color: "#fff4ba", life: 12, size: 0.65 },
    death: { color: "#ff6d52", life: 10, size: 0.55 },
    "golden-escape": { color: "#d4af37", life: 14, size: 0.5 },
    "golden-kill": { color: "#ffd766", life: 16, size: 0.65 },
    hit: { color: "#fff4ba", life: 12, size: 0.7 },
    spawn: { color: "#8bdbff", life: 10, size: 0.7 },
  },
} as const satisfies {
  readonly actorAnchor: { readonly x: number; readonly y: number; readonly z: number };
  readonly geometry: { readonly innerRadius: number; readonly segments: number };
  readonly growth: number;
  readonly maximumActive: number;
  readonly slash: {
    readonly criticalRootScale: number;
    readonly framingCompensation: number;
    readonly hitRootScale: number;
    readonly maximumOpacity: number;
  };
  readonly timing: {
    readonly automaticMaximumLife: number;
    readonly automaticMinimumLife: number;
    readonly automaticReferenceAps: number;
    readonly manualLife: number;
  };
  readonly variants: Readonly<Record<EffectKind, EffectDefinition>>;
};

export const MAX_ACTIVE_EFFECTS = BATTLEFIELD_EFFECT_CONFIG.maximumActive;
export const effectEvictions = (activeCount: number, additionCount: number): number =>
  Math.max(0, activeCount + additionCount - MAX_ACTIVE_EFFECTS);

export const effectVisualScale = (framingScale: number): number => {
  const boundedFramingScale = Math.min(3, Math.max(1, framingScale));
  return 1 + (boundedFramingScale - 1) * BATTLEFIELD_EFFECT_CONFIG.slash.framingCompensation;
};

export type BattlefieldEffect = {
  readonly kind: EffectKind;
  life: number;
  readonly maximumLife: number;
  readonly mesh: THREE.Object3D;
  readonly reducedMotion: boolean;
  readonly slashes: readonly Slash[];
  readonly source?: AttackSource;
};

type EffectCue = BattleVisualCue | EffectKind;

const effectKind = (cue: EffectCue): EffectKind => (typeof cue === "string" ? cue : cue.kind);
const effectSource = (cue: EffectCue): AttackSource | undefined =>
  typeof cue === "string" ? undefined : cue.source;

export const attackEffectLife = (source: AttackSource, aps: number): number => {
  if (source === "manual") return BATTLEFIELD_EFFECT_CONFIG.timing.manualLife;
  const boundedAps = Math.min(
    BATTLEFIELD_EFFECT_CONFIG.timing.automaticReferenceAps,
    Math.max(0, Number.isFinite(aps) ? aps : 0),
  );
  const ratio = boundedAps / BATTLEFIELD_EFFECT_CONFIG.timing.automaticReferenceAps;
  const { automaticMaximumLife, automaticMinimumLife } = BATTLEFIELD_EFFECT_CONFIG.timing;
  return Math.round(automaticMaximumLife - (automaticMaximumLife - automaticMinimumLife) * ratio);
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

const slashGeometry = (size: number): THREE.ShapeGeometry => {
  const shape = new THREE.Shape();
  shape.moveTo(-size * 0.62, -size * 0.045);
  shape.quadraticCurveTo(-size * 0.04, size * 0.12, size * 0.62, size * 0.045);
  shape.lineTo(size * 0.44, 0);
  shape.quadraticCurveTo(-size * 0.08, -size * 0.07, -size * 0.48, -size * 0.025);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
};

const slashMaterial = (color: string): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({
    color,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
    side: THREE.DoubleSide,
    transparent: true,
  });

const slashTrajectory = (
  index: number,
): { readonly from: THREE.Vector3; readonly to: THREE.Vector3 } =>
  index === 0
    ? { from: new THREE.Vector3(-0.42, 0.48, 0), to: new THREE.Vector3(0.3, -0.36, 0) }
    : { from: new THREE.Vector3(0.42, 0.48, 0), to: new THREE.Vector3(-0.3, -0.36, 0) };

const createSlashEffect = (
  kind: "critical" | "hit",
  definition: EffectDefinition,
  reducedMotion: boolean,
  origin: THREE.Vector3,
  framingScale: number,
  life = definition.life,
  source?: AttackSource,
): BattlefieldEffect => {
  const root = new THREE.Group();
  root.name = `battlefield-effect-${kind}`;
  const baseScale =
    kind === "critical"
      ? BATTLEFIELD_EFFECT_CONFIG.slash.criticalRootScale
      : BATTLEFIELD_EFFECT_CONFIG.slash.hitRootScale;
  root.scale.setScalar(baseScale * framingScale);
  const delays = kind === "critical" ? [0, 0] : [0];
  const slashes = delays.map((delay, index) => {
    const trajectory = slashTrajectory(index);
    const color = kind === "critical" && index === 1 ? "#ffcf8a" : definition.color;
    const trail = [
      { opacityScale: 1, sizeScale: 1, yOffset: 0 },
      { opacityScale: 0.62, sizeScale: 0.86, yOffset: 0.04 },
      { opacityScale: 0.34, sizeScale: 0.72, yOffset: 0.08 },
    ].map(({ opacityScale, sizeScale, yOffset }) => {
      const mesh = new THREE.Mesh(slashGeometry(definition.size * sizeScale), slashMaterial(color));
      mesh.position.copy(trajectory.from);
      mesh.position.y += yOffset;
      mesh.rotation.z = Math.atan2(
        trajectory.to.y - trajectory.from.y,
        trajectory.to.x - trajectory.from.x,
      );
      mesh.renderOrder = 1;
      root.add(mesh);
      return { mesh, opacityScale, verticalOffset: yOffset };
    });
    const primary = trail[0];
    if (primary === undefined) throw new Error("Expected a primary slash trail layer");
    return { delay, from: trajectory.from, mesh: primary.mesh, to: trajectory.to, trail };
  });
  const first = slashes[0];
  if (first !== undefined) {
    const material = first.mesh.material;
    if (!(material instanceof THREE.MeshBasicMaterial))
      throw new Error("Expected transparent slash material");
    material.opacity = BATTLEFIELD_EFFECT_CONFIG.slash.maximumOpacity;
  }
  root.position.copy(origin);
  return {
    kind,
    life,
    maximumLife: life,
    mesh: root,
    reducedMotion,
    slashes,
    ...(source === undefined ? {} : { source }),
  };
};

export const createBattlefieldEffect = (
  cue: EffectCue,
  reducedMotion = false,
  origin?: THREE.Vector3,
  framingScale = 1,
  automaticAttacksPerSecond = 0,
): BattlefieldEffect => {
  const kind = effectKind(cue);
  const source = effectSource(cue);
  const definition = BATTLEFIELD_EFFECT_CONFIG.variants[kind];
  const life =
    source === undefined ? definition.life : attackEffectLife(source, automaticAttacksPerSecond);
  const fallback = BATTLEFIELD_EFFECT_CONFIG.actorAnchor;
  const effectOrigin = origin ?? new THREE.Vector3(fallback.x, fallback.y, fallback.z);
  if (kind === "critical" || kind === "hit") {
    return createSlashEffect(
      kind,
      definition,
      reducedMotion,
      effectOrigin,
      effectVisualScale(framingScale),
      life,
      source,
    );
  }
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    emissive: definition.color,
    roughness: 0.55,
    ...(kind === "armor" ? { opacity: 0.5, transparent: true } : {}),
  });
  const mesh = new THREE.Mesh(effectGeometry(kind, definition.size), material);
  if (kind === "armor") mesh.scale.setScalar(0.58);
  if (kind === "spawn") mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(effectOrigin);
  return {
    kind,
    life,
    maximumLife: life,
    mesh,
    reducedMotion,
    slashes: [],
    ...(source === undefined ? {} : { source }),
  };
};

export const advanceBattlefieldEffect = (effect: BattlefieldEffect): boolean => {
  const age = effect.maximumLife - effect.life + 1;
  effect.life -= 1;
  if (effect.slashes.length > 0) {
    for (const slash of effect.slashes) {
      const phase = Math.min(1, Math.max(0, (age - slash.delay) / effect.maximumLife));
      const opacity =
        phase === 0 || phase === 1
          ? 0
          : BATTLEFIELD_EFFECT_CONFIG.slash.maximumOpacity * Math.sin(Math.PI * phase);
      slash.trail.forEach(({ mesh, opacityScale, verticalOffset }) => {
        const material = mesh.material;
        if (!(material instanceof THREE.MeshBasicMaterial))
          throw new Error("Expected transparent slash material");
        material.opacity = opacity * opacityScale;
        if (!effect.reducedMotion)
          mesh.position
            .lerpVectors(slash.from, slash.to, phase)
            .add(new THREE.Vector3(0, verticalOffset, 0));
        mesh.scale.setScalar(0.82 + phase * 0.28);
      });
    }
  } else if (!effect.reducedMotion) {
    effect.mesh.scale.multiplyScalar(BATTLEFIELD_EFFECT_CONFIG.growth);
  }
  return effect.life > 0;
};
