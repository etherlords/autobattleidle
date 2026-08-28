import type { EliteModifier, EnemyGrade } from "../../domain/combat/contracts";

export type EnemyVisualInput = {
  readonly grade: EnemyGrade;
  readonly level: number;
  readonly modifier: PresentationModifier;
};
export type PresentationModifier = EliteModifier | "wealth" | null;

export type BodyFamily = "beetle" | "brute" | "wisp" | "boss-colossus" | "boss-hydra";
export type Decoration = "fins" | "horns" | "orbitals" | "satellites" | "scar";
export type GradeCue = "none" | "crest" | "spikes" | "crown";
export type ModifierCue =
  "shield-plates" | "vitality-core" | "time-ring" | "wealth-orbitals" | null;

export type EnemyVisualSpec = {
  readonly body: BodyFamily;
  readonly decorations: readonly Decoration[];
  readonly gradeCue: GradeCue;
  readonly modifierCue: ModifierCue;
  readonly scale: number;
  readonly seed: number;
};

export const stableEnemySeed = (enemy: EnemyVisualInput): number => {
  let seed = Math.abs(Math.trunc(enemy.level)) || 1;
  for (const character of `${enemy.grade}:${enemy.modifier ?? "none"}`) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }
  return seed;
};

const BODY_FAMILIES = ["beetle", "brute", "wisp"] as const;
const DECORATIONS = ["fins", "horns", "orbitals", "satellites", "scar"] as const;

const bodyFamily = (enemy: EnemyVisualInput): BodyFamily => {
  const identityLevel = Math.abs(Math.trunc(enemy.level));
  if (enemy.grade === "boss") return identityLevel % 2 === 0 ? "boss-colossus" : "boss-hydra";
  return BODY_FAMILIES[identityLevel % BODY_FAMILIES.length] ?? "beetle";
};

const modifierCueRegistry: Readonly<
  Record<Exclude<PresentationModifier, null>, Exclude<ModifierCue, null>>
> = {
  armor: "shield-plates",
  health: "vitality-core",
  "automatic-slow": "time-ring",
  wealth: "wealth-orbitals",
};

const gradeCueRegistry: Readonly<Record<EnemyGrade, GradeCue>> = {
  normal: "none",
  veteran: "crest",
  elite: "spikes",
  boss: "crown",
};

const modifierCue = (modifier: PresentationModifier): ModifierCue =>
  modifier === null ? null : modifierCueRegistry[modifier];

const visualScaleRegistry: Readonly<Record<EnemyGrade, number>> = {
  normal: 1,
  veteran: 1,
  elite: 1.12,
  boss: 1.45,
};

export const enemyVisualSpec = (enemy: EnemyVisualInput): EnemyVisualSpec => {
  const seed = stableEnemySeed(enemy);
  return {
    body: bodyFamily(enemy),
    decorations: [
      DECORATIONS[seed % DECORATIONS.length] ?? "fins",
      DECORATIONS[(seed >>> 3) % DECORATIONS.length] ?? "horns",
    ],
    gradeCue: gradeCueRegistry[enemy.grade],
    modifierCue: modifierCue(enemy.modifier),
    scale: visualScaleRegistry[enemy.grade],
    seed,
  };
};
