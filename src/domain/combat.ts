export { attack } from "./combat-attacks";
export { COMBAT_BALANCE } from "./combat-balance";
export type {
  AttackCommand,
  AttackEvent,
  AttackResult,
  AttackRolls,
  AttackSource,
  CombatEnemy,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
  UpgradeDefinition,
  UpgradeId,
  UpgradePurchase,
} from "./combat-contracts";
export { spawnEnemy } from "./combat-progression";
export {
  armorPenetrationForLevel,
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
} from "./combat-upgrades";
