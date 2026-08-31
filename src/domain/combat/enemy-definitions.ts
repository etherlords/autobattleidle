import { COMBAT_FORMULAS } from "./balance";
import type { EnemyGrade } from "./contracts";

export type EnemyTierDefinition = {
  readonly grade: EnemyGrade;
  multiplier(encounter: number): number;
  armor(encounter: number): number;
};

export const ENEMY_TIERS: Readonly<Record<EnemyGrade, EnemyTierDefinition>> = {
  normal: { grade: "normal", multiplier: () => 1, armor: () => 0 },
  veteran: {
    grade: "veteran",
    multiplier: () => COMBAT_FORMULAS.veteranTargetHits,
    armor: () => 0,
  },
  elite: { grade: "elite", multiplier: () => COMBAT_FORMULAS.eliteTargetHits, armor: () => 0 },
  boss: {
    grade: "boss",
    multiplier: () => COMBAT_FORMULAS.bossTargetHits,
    armor: (encounter) => encounter,
  },
};
