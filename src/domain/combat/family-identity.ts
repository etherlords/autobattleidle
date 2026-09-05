import type { EliteModifier, EnemyGrade } from "./contracts";

import { ENEMY_AFFINITIES, ENEMY_AFFINITY_IDS, type EnemyAffinity } from "./enemy-affinities";

export type { EnemyAffinity };

export type EnemyFamily =
  | "beetle"
  | "brute"
  | "wisp"
  | "mantis"
  | "sentinel"
  | "drake"
  | "boss-colossus"
  | "boss-hydra"
  | "boss-catbug"
  | "boss-evil-catbug";
export type EnemyPresentationModifier = EliteModifier | "wealth" | null;
export type EnemyFamilyIdentity = {
  readonly affinity: EnemyAffinity;
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
  beetle: "Beetle",
  brute: "Brute",
  wisp: "Wisp",
  mantis: "Mantis",
  sentinel: "Sentinel",
  drake: "Drake",
  "boss-colossus": "Colossus",
  "boss-hydra": "Hydra",
  "boss-catbug": "Catbug",
  "boss-evil-catbug": "Evil Catbug",
};
const modifierFamilies: Readonly<
  Partial<Record<Exclude<EnemyPresentationModifier, null>, EnemyFamily>>
> = {
  hardened: "mantis",
  "critical-guard": "sentinel",
  "manual-guard": "drake",
};
/** Golden Bug keeps its legacy 50x payout path, so its affinity never touches rewards. */
const goldenBugAffinity: EnemyAffinity = "cinder";

const identityLabel = (affinity: EnemyAffinity, family: EnemyFamily, goldenBug: boolean): string =>
  goldenBug ? "Golden Bug" : `${ENEMY_AFFINITIES[affinity].label} ${labels[family]}`;

/**
 * The affinity channel is mixed independently of the family channel: bosses derive their
 * family from a stable level-modulo-four cycle, so a shared seed would make affinities
 * correlate with one boss family. A second mix of the same canonical inputs keeps
 * same-input-same-affinity determinism while decorrelating the two selections.
 */
export const stableAffinitySeed = (enemy: EnemyFamilyInput): number => {
  if (!Number.isFinite(enemy.level)) throw new RangeError("Enemy visual level must be finite");
  let mix = 2166136261;
  for (const character of `${enemy.level}:${enemy.grade}:${enemy.modifier ?? "none"}:affinity`)
    mix = (Math.imul(mix, 131071) + character.charCodeAt(0)) >>> 0;
  let level = Math.abs(Math.trunc(enemy.level)) || 1;
  level = Math.imul(level, 2246822519) >>> 0;
  return (mix ^ level) >>> 0;
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
  if (enemy.grade === "boss") {
    const bossFamilies = [
      "boss-colossus",
      "boss-hydra",
      "boss-catbug",
      "boss-evil-catbug",
    ] as const;
    const family = bossFamilies[level % bossFamilies.length];
    if (family === undefined)
      throw new RangeError("Enemy visual level did not select a boss family");
    return family;
  }
  const modifierFamily = enemy.modifier === null ? undefined : modifierFamilies[enemy.modifier];
  if (modifierFamily !== undefined) return modifierFamily;
  const family = ordinaryFamilies[level % ordinaryFamilies.length];
  if (family === undefined) throw new RangeError("Enemy visual level did not select a body family");
  return family;
};

export const selectEnemyFamilyIdentity = (enemy: EnemyFamilyInput): EnemyFamilyIdentity => {
  const family = selectFamily(enemy);
  const seed = stableEnemySeed(enemy);
  const affinitySeed = stableAffinitySeed(enemy);
  const affinityId = ENEMY_AFFINITY_IDS[affinitySeed % ENEMY_AFFINITY_IDS.length];
  if (affinityId === undefined)
    throw new RangeError("Enemy visual affinity seed did not select an affinity");
  const affinity = enemy.goldenBug ? goldenBugAffinity : affinityId;
  return {
    affinity,
    family,
    label: identityLabel(affinity, family, enemy.goldenBug === true),
    seed,
    variant: enemy.goldenBug ? 0 : ((seed % 3) as 0 | 1 | 2),
  };
};
