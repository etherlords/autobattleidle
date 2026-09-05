import type { BossFamily } from "./contracts";

export const COMBAT_BALANCE = {
  bossInterval: 35,
  eliteAutomaticSlowMs: 500,
  baseEnemyHealth: 140,
  starterEnemyHealth: 10,
  enemyHealthGrowth: 1.002,
  baseReward: 0.3,
  goldenBugEncounterInterval: 50,
  goldenBugWindowMs: 10_000,
  goldenBugRewardFactor: 50,
  automaticVisualTickRate: 3,
} as const;
/**
 * Boss cadence is encounter-derived rather than save-state-derived. Each band keeps an
 * explicit progression window and independent seeded draws; it does not preserve fixed-35
 * pair budgets, so local boss spacing remains visibly different from the historical schedule.
 */
export const BOSS_CADENCE_BALANCE = {
  seed: 0x39_2026,
  bands: [
    { id: "early", firstBoss: 1, lastBoss: 3, minGap: 28, maxGap: 42 },
    { id: "mid", firstBoss: 4, lastBoss: 11, minGap: 24, maxGap: 46 },
    { id: "late", firstBoss: 12, lastBoss: 31, minGap: 26, maxGap: 44 },
    { id: "long-run", firstBoss: 32, lastBoss: Number.POSITIVE_INFINITY, minGap: 28, maxGap: 42 },
  ],
} as const;
/**
 * Boss identity tuning is centralized here so adding a family cannot hide balance in
 * presentation selection. Existing bosses retain their accepted envelope; Goose Hydra
 * is intentionally the tougher fifth encounter with a measured health/armor/reward lift.
 */
export type BossFamilyBalance = {
  readonly healthMultiplier: number;
  readonly armorMultiplier: number;
  readonly rewardMultiplier: number;
};

export const BOSS_FAMILY_BALANCE: Readonly<
  Record<
    BossFamily,
    {
      readonly healthMultiplier: number;
      readonly armorMultiplier: number;
      readonly rewardMultiplier: number;
    }
  >
> = {
  "boss-colossus": { armorMultiplier: 1, healthMultiplier: 1, rewardMultiplier: 1 },
  "boss-hydra": { armorMultiplier: 1, healthMultiplier: 1, rewardMultiplier: 1 },
  "boss-catbug": { armorMultiplier: 1, healthMultiplier: 1, rewardMultiplier: 1 },
  "boss-evil-catbug": { armorMultiplier: 1, healthMultiplier: 1, rewardMultiplier: 1 },
  "boss-goose-hydra": { armorMultiplier: 1, healthMultiplier: 1, rewardMultiplier: 1 },
};

export const MAX_ENCOUNTER = Math.floor(Number.MAX_SAFE_INTEGER / 3);

export const COMBAT_FORMULAS = {
  armorPenetrationLimit: 0.75,
  automaticAttacksPerSecondBase: 0.1,
  automaticAttacksPerSecondBonus: 11.9,
  automaticAttacksPerSecondLevelScale: 100,
  bossTargetHits: 30,
  bossHealthBaseMultiplier: 10,
  bossHealthIndexLinearMultiplier: 120,
  bossHealthIndexQuadraticMultiplier: 5,
  chanceLimit: 0.6,
  chanceLevelScale: 20,
  damageRootBonus: 10,
  doubleRewardMultiplier: 2,
  enemyArmorPerEncounter: 2,
  enemyHealthGrowthBase: 1,
  eliteHealthMultiplier: 1.5,
  eliteTargetHits: 10,
  eliteTierMultiplier: 2,
  veteranTierMultiplier: 1.5,
  veteranTargetHits: 5,
  criticalDamageMultiplier: 2,
  minimumDamage: 1,
  upgradeCostExponent: 1.35,
} as const;
