import type { CombatPlayer } from "./contracts";

type PlayerLevelSource = Pick<CombatPlayer, "criticalChance" | "damage" | "doubleRewardChance"> & {
  readonly armorPenetrationLevel?: number | undefined;
  readonly criticalLevel?: number | undefined;
  readonly damageLevel?: number | undefined;
  readonly doubleRewardLevel?: number | undefined;
};

/** Validates levels at the domain boundary where a formula consumes one. */
export const normalizeLevel = (level: number): number => {
  if (!Number.isSafeInteger(level) || level < 0)
    throw new RangeError("Level must be a non-negative safe integer");
  return level;
};

export const damageLevelFor = (player: PlayerLevelSource): number =>
  player.damageLevel ?? Math.max(0, player.damage - 1);

export const criticalLevelFor = (player: PlayerLevelSource): number =>
  player.criticalLevel ?? Math.round(player.criticalChance * 10);

export const doubleRewardLevelFor = (player: PlayerLevelSource): number =>
  player.doubleRewardLevel ?? Math.round(player.doubleRewardChance * 10);

export const armorPenetrationLevelFor = (player: PlayerLevelSource): number =>
  player.armorPenetrationLevel ?? 0;
