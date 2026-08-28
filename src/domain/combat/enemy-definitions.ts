import { COMBAT_BALANCE, COMBAT_FORMULAS } from "./balance";
import type { EnemyGrade } from "./contracts";

export type EnemyTierDefinition = {
  readonly grade: EnemyGrade;
  multiplier(encounter: number): number;
  armor(encounter: number): number;
};

const bossMultiplier = (encounter: number): number => {
  const bossIndex = Math.ceil(encounter / COMBAT_BALANCE.bossInterval) - 1;
  return (
    COMBAT_FORMULAS.bossHealthBaseMultiplier +
    COMBAT_FORMULAS.bossHealthIndexLinearMultiplier * bossIndex +
    COMBAT_FORMULAS.bossHealthIndexQuadraticMultiplier * bossIndex * bossIndex
  );
};

export const ENEMY_TIERS: Readonly<Record<EnemyGrade, EnemyTierDefinition>> = {
  normal: { grade: "normal", multiplier: () => 1, armor: () => 0 },
  veteran: {
    grade: "veteran",
    multiplier: () => COMBAT_FORMULAS.veteranTierMultiplier,
    armor: () => 0,
  },
  elite: { grade: "elite", multiplier: () => COMBAT_FORMULAS.eliteTierMultiplier, armor: () => 0 },
  boss: { grade: "boss", multiplier: bossMultiplier, armor: (encounter) => encounter },
};
