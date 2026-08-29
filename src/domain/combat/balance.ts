export const COMBAT_BALANCE = {
  bossInterval: 35,
  eliteAutomaticSlowMs: 500,
  baseEnemyHealth: 140,
  starterEnemyHealth: 10,
  enemyHealthGrowth: 1.002,
  baseReward: 1.2,
  goldenBugEncounterInterval: 50,
  goldenBugWindowMs: 10_000,
  goldenBugHealthFactor: 5,
  goldenBugRewardFactor: 10,
} as const;

export const MAX_ENCOUNTER = Math.floor(Number.MAX_SAFE_INTEGER / 3);

export const COMBAT_FORMULAS = {
  armorPenetrationLimit: 0.75,
  automaticAttacksPerSecondBase: 0.1,
  automaticAttacksPerSecondBonus: 2.9,
  automaticAttacksPerSecondLevelScale: 150,
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
  eliteTierMultiplier: 2,
  veteranTierMultiplier: 1.5,
  criticalDamageMultiplier: 2,
  minimumDamage: 1,
  upgradeCostExponent: 1.35,
} as const;
