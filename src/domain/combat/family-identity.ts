import type { EliteModifier, EnemyGrade } from "./contracts";

export type EnemyFamily =
  "beetle" | "brute" | "wisp" | "mantis" | "sentinel" | "drake" | "boss-colossus" | "boss-hydra";
export type EnemyPresentationModifier = EliteModifier | "wealth" | null;
export type EnemyFamilyIdentity = {
  readonly family: EnemyFamily;
  readonly label: string;
  readonly seed: number;
  readonly variant: 0 | 1 | 2;
};
export type EnemyFamilyInput = {
  readonly goldenBug?: boolean;
  readonly grade: EnemyGrade;
  readonly level: number;
  readonly modifier: EnemyPresentationModifier;
};

const ordinaryFamilies = ["beetle", "brute", "wisp"] as const;
const labels: Readonly<Record<EnemyFamily, string>> = {
  beetle: "Cinder Beetle",
  brute: "Ember Brute",
  wisp: "Ash Wisp",
  mantis: "Thorn Mantis",
  sentinel: "Prism Sentinel",
  drake: "Ash Drake",
  "boss-colossus": "Ember Colossus",
  "boss-hydra": "Cinder Hydra",
};
const modifierFamilies: Readonly<
  Partial<Record<Exclude<EnemyPresentationModifier, null>, EnemyFamily>>
> = {
  hardened: "mantis",
  "critical-guard": "sentinel",
  "manual-guard": "drake",
};

export const stableEnemySeed = (enemy: EnemyFamilyInput): number => {
  if (!Number.isFinite(enemy.level)) throw new RangeError("Enemy visual level must be finite");
  let seed = Math.abs(Math.trunc(enemy.level)) || 1;
  for (const character of `${enemy.grade}:${enemy.modifier ?? "none"}`)
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  return seed;
};

const selectFamily = (enemy: EnemyFamilyInput): EnemyFamily => {
  const level = Math.abs(Math.trunc(enemy.level));
  if (enemy.goldenBug) return "beetle";
  if (enemy.grade === "boss") return level % 2 === 0 ? "boss-colossus" : "boss-hydra";
  const modifierFamily = enemy.modifier === null ? undefined : modifierFamilies[enemy.modifier];
  if (modifierFamily !== undefined) return modifierFamily;
  const family = ordinaryFamilies[level % ordinaryFamilies.length];
  if (family === undefined) throw new RangeError("Enemy visual level did not select a body family");
  return family;
};

export const selectEnemyFamilyIdentity = (enemy: EnemyFamilyInput): EnemyFamilyIdentity => {
  const family = selectFamily(enemy);
  const seed = stableEnemySeed(enemy);
  return {
    family,
    label: enemy.goldenBug ? "Golden Bug" : labels[family],
    seed,
    variant: enemy.goldenBug ? 0 : ((seed % 3) as 0 | 1 | 2),
  };
};
