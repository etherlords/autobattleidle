import {
  ENEMY_AFFINITIES,
  selectEnemyFamilyIdentity,
  type EnemyAffinityProfile,
  type EnemyFamily,
  type EnemyPresentationModifier,
} from "../../domain/combat";
import type { EnemyGrade } from "../../domain/combat/contracts";

export { stableEnemySeed } from "../../domain/combat";

export type EnemyVisualInput = {
  readonly grade: EnemyGrade;
  readonly level: number;
  readonly modifier: EnemyPresentationModifier;
  readonly goldenBug?: boolean;
  readonly reducedMotion?: boolean;
};
export type PresentationModifier = EnemyPresentationModifier;
export type BodyFamily = EnemyFamily;
export type Decoration = "fins" | "horns" | "orbitals" | "satellites" | "scar";
export type GradeCue = "none" | "crest" | "spikes" | "crown";
export const ENEMY_VISUAL_GRADES = [
  "normal",
  "veteran",
  "elite",
  "boss",
] as const satisfies readonly EnemyGrade[];
export type ModifierCue =
  | "shield-plates"
  | "vitality-core"
  | "time-ring"
  | "wealth-orbitals"
  | "reinforced-band"
  | "prism-guard"
  | "directional-barrier"
  | null;
export type EnemyVisualProfile = {
  readonly attachment: readonly [number, number, number];
  readonly decorations: readonly [Decoration, Decoration];
  readonly palette: { readonly accent: string; readonly core: string; readonly emissive: string };
  readonly variant: 0 | 1 | 2;
  readonly metallic?: boolean;
};
export const profileCueScale = (profile: EnemyVisualProfile): number =>
  Math.min(1.2, Math.max(0.8, profile.attachment[0] / 0.7));
export type EnemyVisualSpec = {
  readonly affinity: EnemyAffinityProfile;
  readonly body: BodyFamily;
  readonly decorations: readonly Decoration[];
  readonly gradeCue: GradeCue;
  readonly modifierCue: ModifierCue;
  readonly profile: EnemyVisualProfile;
  readonly scale: number;
  readonly seed: number;
};

const p = <const T extends readonly [EnemyVisualProfile, EnemyVisualProfile, EnemyVisualProfile]>(
  values: T,
): T => values;

// Fixed authored palette, ornament pair, and attachment anchor. The stable seed picks one of three.
const FAMILY_PROFILES: Readonly<
  Record<BodyFamily, readonly [EnemyVisualProfile, EnemyVisualProfile, EnemyVisualProfile]>
> = {
  beetle: p([
    {
      attachment: [0.58, 0.18, 0],
      decorations: ["fins", "scar"],
      palette: { core: "#ff9d66", emissive: "#4d180d", accent: "#cf563f" },
      variant: 0,
    },
    {
      attachment: [0.64, 0.1, 0],
      decorations: ["horns", "orbitals"],
      palette: { core: "#e88554", emissive: "#3f160c", accent: "#b9483c" },
      variant: 1,
    },
    {
      attachment: [0.54, 0.24, 0],
      decorations: ["satellites", "fins"],
      palette: { core: "#f2b264", emissive: "#4e2a0c", accent: "#ce743e" },
      variant: 2,
    },
  ]),
  brute: p([
    {
      attachment: [0.74, 0.22, 0],
      decorations: ["orbitals", "fins"],
      palette: { core: "#f3bd58", emissive: "#4d3210", accent: "#d7923e" },
      variant: 0,
    },
    {
      attachment: [0.78, 0.1, 0],
      decorations: ["scar", "horns"],
      palette: { core: "#d69d4f", emissive: "#40270e", accent: "#a96938" },
      variant: 1,
    },
    {
      attachment: [0.7, 0.3, 0],
      decorations: ["satellites", "orbitals"],
      palette: { core: "#e9c46a", emissive: "#49390d", accent: "#b68f4d" },
      variant: 2,
    },
  ]),
  wisp: p([
    {
      attachment: [0.56, 0.3, 0],
      decorations: ["horns", "satellites"],
      palette: { core: "#bd7cff", emissive: "#311653", accent: "#8f5acb" },
      variant: 0,
    },
    {
      attachment: [0.52, 0.38, 0],
      decorations: ["orbitals", "scar"],
      palette: { core: "#7da8ff", emissive: "#162b58", accent: "#527dcc" },
      variant: 1,
    },
    {
      attachment: [0.6, 0.25, 0],
      decorations: ["fins", "satellites"],
      palette: { core: "#d58cff", emissive: "#50194d", accent: "#a65abc" },
      variant: 2,
    },
  ]),
  mantis: p([
    {
      attachment: [0.72, 0.56, 0.38],
      decorations: ["fins", "satellites"],
      palette: { core: "#a7d65d", emissive: "#1d431e", accent: "#57a98c" },
      variant: 0,
    },
    {
      attachment: [0.76, 0.5, 0.38],
      decorations: ["horns", "scar"],
      palette: { core: "#6bc9a4", emissive: "#123d36", accent: "#b7ad4d" },
      variant: 1,
    },
    {
      attachment: [0.68, 0.6, 0.38],
      decorations: ["satellites", "fins"],
      palette: { core: "#cfbf5f", emissive: "#4b3c13", accent: "#58a76e" },
      variant: 2,
    },
  ]),
  sentinel: p([
    {
      attachment: [0.86, 0.18, 0],
      decorations: ["scar", "orbitals"],
      palette: { core: "#7899ba", emissive: "#1d3049", accent: "#b97d4e" },
      variant: 0,
    },
    {
      attachment: [0.9, 0.12, 0],
      decorations: ["horns", "scar"],
      palette: { core: "#5a77b8", emissive: "#192652", accent: "#9c6945" },
      variant: 1,
    },
    {
      attachment: [0.82, 0.24, 0],
      decorations: ["orbitals", "satellites"],
      palette: { core: "#8b9ca4", emissive: "#25363c", accent: "#c08c5a" },
      variant: 2,
    },
  ]),
  drake: p([
    {
      attachment: [0.92, 0.08, 0],
      decorations: ["horns", "fins"],
      palette: { core: "#d55c65", emissive: "#541420", accent: "#7b4dab" },
      variant: 0,
    },
    {
      attachment: [0.88, 0.16, 0],
      decorations: ["fins", "scar"],
      palette: { core: "#7763c7", emissive: "#251951", accent: "#d36d71" },
      variant: 1,
    },
    {
      attachment: [0.96, 0.04, 0],
      decorations: ["satellites", "horns"],
      palette: { core: "#7bbde1", emissive: "#163f60", accent: "#aa5f91" },
      variant: 2,
    },
  ]),
  "boss-colossus": p([
    {
      attachment: [0.88, 0.35, 0],
      decorations: ["horns", "satellites"],
      palette: { core: "#e9576d", emissive: "#5b1021", accent: "#b93654" },
      variant: 0,
    },
    {
      attachment: [0.92, 0.28, 0],
      decorations: ["scar", "orbitals"],
      palette: { core: "#c75c7a", emissive: "#4a1830", accent: "#91405c" },
      variant: 1,
    },
    {
      attachment: [0.84, 0.4, 0],
      decorations: ["fins", "horns"],
      palette: { core: "#ed7c55", emissive: "#5a2414", accent: "#bc4f39" },
      variant: 2,
    },
  ]),
  "boss-hydra": p([
    {
      attachment: [0.82, 0.42, 0],
      decorations: ["fins", "horns"],
      palette: { core: "#d754c3", emissive: "#4e123f", accent: "#ff8fdb" },
      variant: 0,
    },
    {
      attachment: [0.86, 0.35, 0],
      decorations: ["satellites", "scar"],
      palette: { core: "#a85ccf", emissive: "#391650", accent: "#d99aff" },
      variant: 1,
    },
    {
      attachment: [0.78, 0.5, 0],
      decorations: ["horns", "orbitals"],
      palette: { core: "#df6d91", emissive: "#53182c", accent: "#f7a6b8" },
      variant: 2,
    },
  ]),
  "boss-catbug": p([
    {
      attachment: [0.88, 0.35, 0],
      decorations: ["fins", "scar"],
      palette: { core: "#e9b75c", emissive: "#4b2d0c", accent: "#c9803e" },
      variant: 0,
    },
    {
      attachment: [0.92, 0.28, 0],
      decorations: ["horns", "orbitals"],
      palette: { core: "#d89048", emissive: "#45240b", accent: "#a96135" },
      variant: 1,
    },
    {
      attachment: [0.84, 0.4, 0],
      decorations: ["satellites", "fins"],
      palette: { core: "#f0c878", emissive: "#533510", accent: "#c1753d" },
      variant: 2,
    },
  ]),
  "boss-evil-catbug": p([
    {
      attachment: [0.82, 0.42, 0],
      decorations: ["horns", "scar"],
      palette: { core: "#8f5fba", emissive: "#28143d", accent: "#d26fa3" },
      variant: 0,
    },
    {
      attachment: [0.86, 0.35, 0],
      decorations: ["fins", "orbitals"],
      palette: { core: "#704d9e", emissive: "#211332", accent: "#b35c99" },
      variant: 1,
    },
    {
      attachment: [0.78, 0.5, 0],
      decorations: ["satellites", "horns"],
      palette: { core: "#b66f9d", emissive: "#3d182c", accent: "#e58ab4" },
      variant: 2,
    },
  ]),
};

const modifierCueRegistry: Readonly<
  Record<Exclude<PresentationModifier, null>, Exclude<ModifierCue, null>>
> = {
  armor: "shield-plates",
  health: "vitality-core",
  "automatic-slow": "time-ring",
  wealth: "wealth-orbitals",
  hardened: "reinforced-band",
  "critical-guard": "prism-guard",
  "manual-guard": "directional-barrier",
};
export const ENEMY_VISUAL_GRADE_CUES: Readonly<Record<EnemyGrade, GradeCue>> = {
  normal: "none",
  veteran: "crest",
  elite: "spikes",
  boss: "crown",
};
const visualScaleRegistry: Readonly<Record<EnemyGrade, number>> = {
  normal: 1,
  veteran: 1,
  elite: 1.12,
  boss: 1.45,
};
const visualModifierCue = (enemy: EnemyVisualInput): ModifierCue => {
  if (enemy.goldenBug) return "wealth-orbitals";
  return enemy.modifier === null ? null : modifierCueRegistry[enemy.modifier];
};

export const enemyVisualSpec = (enemy: EnemyVisualInput): EnemyVisualSpec => {
  const identity = selectEnemyFamilyIdentity(enemy);
  const body = identity.family;
  const seed = identity.seed;
  const affinity = ENEMY_AFFINITIES[identity.affinity];
  const profile = enemy.goldenBug
    ? {
        attachment: [0.6, 0.2, 0] as const,
        decorations: ["horns", "orbitals"] as const,
        metallic: true,
        palette: { core: "#d4af37", emissive: "#5c4300", accent: "#fff1a3" },
        variant: 0 as const,
      }
    : FAMILY_PROFILES[body][identity.variant];
  if (profile === undefined) throw new RangeError("Enemy visual seed did not select a profile");
  return {
    affinity,
    body,
    decorations: profile.decorations,
    gradeCue: enemy.goldenBug ? "crown" : ENEMY_VISUAL_GRADE_CUES[enemy.grade],
    modifierCue: visualModifierCue(enemy),
    profile: enemy.goldenBug ? profile : { ...profile, palette: affinity.palette },
    scale: visualScaleRegistry[enemy.grade],
    seed,
  };
};
