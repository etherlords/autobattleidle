export const COMBAT_BALANCE = {
  automaticAttackIntervalMs: 1_000,
  automaticAttackMinimumIntervalMs: 100,
  bossInterval: 35,
  eliteAutomaticSlowMs: 500,
  baseEnemyHealth: 140,
  starterEnemyHealth: 10,
  enemyHealthGrowth: 1.002,
  baseReward: 1.2,
} as const;

export const MAX_ENCOUNTER = Math.floor(Number.MAX_SAFE_INTEGER / 3);

export const COMBAT_FORMULAS = {
  armorPenetrationLimit: 0.75,
  automaticSpeedReductionMs: 600,
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
