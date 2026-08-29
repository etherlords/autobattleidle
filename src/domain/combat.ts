export { attack } from "./combat/attacks";
export { COMBAT_BALANCE } from "./combat/balance";
export { selectEnemyFamilyIdentity, stableEnemySeed } from "./combat/family-identity";
export type {
  AttackCommand,
  AttackEvent,
  AttackResult,
  AttackRolls,
  AttackSource,
  CombatEnemy,
  GoldenBugEvent,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
  UpgradeDefinition,
  UpgradeId,
  UpgradePurchase,
} from "./combat/contracts";
export type {
  EnemyFamily,
  EnemyFamilyIdentity,
  EnemyFamilyInput,
  EnemyPresentationModifier,
} from "./combat/family-identity";
export {
  expireGoldenBug,
  goldenBugHealth,
  spawnEnemy,
  spawnGoldenBug,
  spawnStarterEnemy,
} from "./combat/progression";
export {
  armorPenetrationForLevel,
  automaticAttacksPerSecond,
  automaticInterval,
  createCombatState,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
  purchaseUpgrade,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
} from "./combat/upgrades";
