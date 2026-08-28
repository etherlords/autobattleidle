import type { EliteModifier, EnemyGrade } from "../../domain/combat/contracts";

export type EnemyVisualInput = {
  readonly grade: EnemyGrade;
  readonly level: number;
  readonly modifier: PresentationModifier;
};
export type PresentationModifier = EliteModifier | "wealth" | null;

export type BodyFamily = "beetle" | "brute" | "wisp" | "boss-colossus" | "boss-hydra";
type OrdinaryBodyFamily = Exclude<BodyFamily, "boss-colossus" | "boss-hydra">;
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
  if (!Number.isFinite(enemy.level)) throw new RangeError("Enemy visual level must be finite");

  let seed = Math.abs(Math.trunc(enemy.level)) || 1;
  for (const character of `${enemy.grade}:${enemy.modifier ?? "none"}`) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }
  return seed;
};

type MissingOrdinaryBodies<Order extends readonly OrdinaryBodyFamily[]> =
  Order extends readonly (infer Body extends OrdinaryBodyFamily)[]
    ? Exclude<OrdinaryBodyFamily, Body>
    : OrdinaryBodyFamily;

const BODY_FAMILY_VALUES = [
  "beetle",
  "brute",
  "wisp",
] as const satisfies readonly OrdinaryBodyFamily[];
type CompleteOrdinaryBodyOrder =
  MissingOrdinaryBodies<typeof BODY_FAMILY_VALUES> extends never
    ? typeof BODY_FAMILY_VALUES
    : never;
const BODY_FAMILIES: CompleteOrdinaryBodyOrder = BODY_FAMILY_VALUES;
const DECORATIONS = ["fins", "horns", "orbitals", "satellites", "scar"] as const;

const bodyFamily = (enemy: EnemyVisualInput): BodyFamily => {
  const identityLevel = Math.abs(Math.trunc(enemy.level));
  if (enemy.grade === "boss") return identityLevel % 2 === 0 ? "boss-colossus" : "boss-hydra";
  const body = BODY_FAMILIES[identityLevel % BODY_FAMILIES.length];
  if (body === undefined) throw new RangeError("Enemy visual level did not select a body family");
  return body;
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
  const firstDecoration = DECORATIONS[seed % DECORATIONS.length];
  const secondDecoration = DECORATIONS[(seed >>> 3) % DECORATIONS.length];
  if (firstDecoration === undefined || secondDecoration === undefined)
    throw new Error("Enemy visual seed did not select decorations");

  return {
    body: bodyFamily(enemy),
    decorations: [firstDecoration, secondDecoration],
    gradeCue: gradeCueRegistry[enemy.grade],
    modifierCue: modifierCue(enemy.modifier),
    scale: visualScaleRegistry[enemy.grade],
    seed,
  };
};
