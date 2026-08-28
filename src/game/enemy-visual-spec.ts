export type EnemyVisualInput = {
  readonly grade: string;
  readonly level: number;
  readonly modifier: string | null;
};

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

const modifierCue = (modifier: string | null): ModifierCue => {
  const cues: Readonly<Record<string, Exclude<ModifierCue, null>>> = {
    armor: "shield-plates",
    health: "vitality-core",
    "automatic-slow": "time-ring",
    wealth: "wealth-orbitals",
  };
  return cues[modifier ?? ""] ?? null;
};

const gradeCue = (grade: string): GradeCue => {
  const cues: Readonly<Record<string, GradeCue>> = {
    boss: "crown",
    elite: "spikes",
    veteran: "crest",
  };
  return cues[grade] ?? "none";
};

export const enemyVisualSpec = (enemy: EnemyVisualInput): EnemyVisualSpec => {
  const seed = stableEnemySeed(enemy);
  return {
    body: bodyFamily(enemy),
    decorations: [
      DECORATIONS[seed % DECORATIONS.length] ?? "fins",
      DECORATIONS[(seed >>> 3) % DECORATIONS.length] ?? "horns",
    ],
    gradeCue: gradeCue(enemy.grade),
    modifierCue: modifierCue(enemy.modifier),
    scale: visualScale(enemy.grade),
    seed,
  };
};

const visualScale = (grade: string): number => {
  if (grade === "boss") return 1.45;
  return grade === "elite" ? 1.12 : 1;
};
