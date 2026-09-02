export { attack } from "./combat/attacks";
export { automaticPacketSchedule, resolveAutomaticPackets } from "./combat/automatic-packets";
export type {
  AutomaticPacket,
  AutomaticPacketResolution,
  AutomaticPacketSchedule,
} from "./combat/automatic-packets";
export { COMBAT_BALANCE } from "./combat/balance";
export { ENEMY_MODIFIERS } from "./combat/enemy-modifiers/enemy-modifier-registry";
export { ENEMY_AFFINITIES, ENEMY_AFFINITY_IDS } from "./combat/enemy-affinities";
export {
  selectEnemyFamilyIdentity,
  stableAffinitySeed,
  stableEnemySeed,
} from "./combat/family-identity";
export type {
  AttackCommand,
  AttackEvent,
  AttackResult,
  AttackRolls,
  AttackSource,
  ArmorPenetrationPolicy,
  CombatEnemy,
  GoldenBugEvent,
  CombatPlayer,
  CombatState,
  CriticalChancePolicy,
  EliteModifier,
  EnemyGrade,
  UpgradeDefinition,
  UpgradeId,
  UpgradePurchase,
} from "./combat/contracts";
export type { EnemyAffinityProfile } from "./combat/enemy-affinities";
export type {
  EnemyAffinity,
  EnemyFamily,
  EnemyFamilyIdentity,
  EnemyFamilyInput,
  EnemyPresentationModifier,
} from "./combat/family-identity";
export {
  expireGoldenBug,
  goldenBugHealth,
  previousPlayerRelativeBossHealth,
  spawnEnemy,
  spawnGoldenBug,
  spawnStarterEnemy,
} from "./combat/progression";
export {
  armorPenetrationForLevel,
  armorPenetrationForPolicy,
  automaticAttacksPerSecond,
  automaticAttackPacketMultipliers,
  automaticInterval,
  createCombatState,
  criticalChanceForLevel,
  criticalChanceForPolicy,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
  purchaseUpgrade,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeEffectPreview,
  upgradeLevel,
} from "./combat/upgrades";
export type { UpgradeEffectPreview } from "./combat/upgrades";
