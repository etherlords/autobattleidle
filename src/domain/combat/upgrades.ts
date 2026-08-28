import { COMBAT_BALANCE, COMBAT_FORMULAS } from "./balance";
import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  UpgradeDefinition,
  UpgradeId,
  UpgradePurchase,
} from "./contracts";
import { spawnEnemy } from "./progression";

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: "automatic-unlock", label: "Unlock automatic attack", baseCost: 1 },
  { id: "damage", label: "Damage", baseCost: 2 },
  { id: "armor-penetration", label: "Armor penetration", baseCost: 3 },
  { id: "critical-chance", label: "Critical chance", baseCost: 3 },
  { id: "double-reward", label: "Double reward chance", baseCost: 4 },
  { id: "automatic-speed", label: "Automatic speed", baseCost: 5 },
];

const finiteLevel = (level: number): number => {
  if (!Number.isSafeInteger(level) || level < 0)
    throw new RangeError("Level must be a non-negative safe integer");
  return level;
};
const diminishingChance = (level: number): number =>
  (COMBAT_FORMULAS.chanceLimit * finiteLevel(level)) /
  (finiteLevel(level) + COMBAT_FORMULAS.chanceLevelScale);
export const damageForLevel = (level: number): number => {
  const safeLevel = finiteLevel(level);
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    1 + safeLevel + Math.floor(COMBAT_FORMULAS.damageRootBonus * Math.sqrt(safeLevel)),
  );
};
export const criticalChanceForLevel = (level: number): number => diminishingChance(level);
export const doubleRewardChanceForLevel = (level: number): number => diminishingChance(level);
export const armorPenetrationForLevel = (level: number): number =>
  (COMBAT_FORMULAS.armorPenetrationLimit * finiteLevel(level)) /
  (finiteLevel(level) + COMBAT_FORMULAS.chanceLevelScale);
export const effectiveArmor = (armor: number, penetrationLevel: number): number =>
  Math.max(0, Math.floor(armor * (1 - armorPenetrationForLevel(penetrationLevel))));
const damageLevel = (player: CombatPlayer): number =>
  finiteLevel(player.damageLevel ?? Math.max(0, player.damage - 1));
const criticalLevel = (player: CombatPlayer): number =>
  finiteLevel(player.criticalLevel ?? Math.round(player.criticalChance * 10));
const doubleRewardLevel = (player: CombatPlayer): number =>
  finiteLevel(player.doubleRewardLevel ?? Math.round(player.doubleRewardChance * 10));
const penetrationLevel = (player: CombatPlayer): number =>
  finiteLevel(player.armorPenetrationLevel ?? 0);
const DEFAULT_PLAYER: CombatPlayer = {
  automaticSpeedLevel: 0,
  armorPenetrationLevel: 0,
  criticalChance: 0,
  criticalLevel: 0,
  damage: 1,
  damageLevel: 0,
  doubleRewardChance: 0,
  doubleRewardLevel: 0,
};
const normalizedPlayer = (player: Partial<CombatPlayer>): CombatPlayer => {
  const merged = { ...DEFAULT_PLAYER, ...player };
  return {
    ...merged,
    armorPenetrationLevel: player.armorPenetrationLevel ?? 0,
    criticalLevel: player.criticalLevel ?? Math.round(merged.criticalChance * 10),
    damageLevel: player.damageLevel ?? Math.max(0, merged.damage - 1),
    doubleRewardLevel: player.doubleRewardLevel ?? Math.round(merged.doubleRewardChance * 10),
  };
};
export const createCombatState = (
  player: Partial<CombatPlayer> = {},
  firstEliteModifierRoll = 0,
  automaticUnlocked = false,
): CombatState => ({
  automaticUnlocked,
  coins: 0,
  enemy: spawnEnemy(1, firstEliteModifierRoll),
  nextAutomaticAttackAtMs: 0,
  player: normalizedPlayer(player),
});
export const automaticInterval = (enemy: CombatEnemy, player: CombatPlayer): number =>
  COMBAT_BALANCE.automaticAttackIntervalMs -
  (COMBAT_FORMULAS.automaticSpeedReductionMs * finiteLevel(player.automaticSpeedLevel)) /
    (finiteLevel(player.automaticSpeedLevel) + COMBAT_FORMULAS.chanceLevelScale) +
  (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);
const definitionFor = (id: UpgradeId): UpgradeDefinition => {
  const definition = UPGRADES.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Unknown upgrade ${id}`);
  return definition;
};
type UpgradePolicy = {
  readonly level: (state: CombatState) => number;
  readonly canAdvance: (state: CombatState, nextLevel: number) => boolean;
  readonly apply: (player: CombatPlayer, level: number) => CombatPlayer;
};
const UPGRADE_POLICIES: Record<UpgradeId, UpgradePolicy> = {
  "automatic-unlock": {
    level: (state) => Number(state.automaticUnlocked),
    canAdvance: (state) => !state.automaticUnlocked,
    apply: (player) => player,
  },
  damage: {
    level: (state) => damageLevel(state.player),
    canAdvance: (state, nextLevel) =>
      damageForLevel(nextLevel) > damageForLevel(damageLevel(state.player)),
    apply: (player, level) => ({ ...player, damageLevel: level, damage: damageForLevel(level) }),
  },
  "armor-penetration": {
    level: (state) => penetrationLevel(state.player),
    canAdvance: (state, nextLevel) =>
      armorPenetrationForLevel(nextLevel) >
      armorPenetrationForLevel(penetrationLevel(state.player)),
    apply: (player, level) => ({ ...player, armorPenetrationLevel: level }),
  },
  "critical-chance": {
    level: (state) => criticalLevel(state.player),
    canAdvance: (state, nextLevel) =>
      criticalChanceForLevel(nextLevel) > criticalChanceForLevel(criticalLevel(state.player)),
    apply: (player, level) => ({
      ...player,
      criticalLevel: level,
      criticalChance: criticalChanceForLevel(level),
    }),
  },
  "double-reward": {
    level: (state) => doubleRewardLevel(state.player),
    canAdvance: (state, nextLevel) =>
      doubleRewardChanceForLevel(nextLevel) >
      doubleRewardChanceForLevel(doubleRewardLevel(state.player)),
    apply: (player, level) => ({
      ...player,
      doubleRewardLevel: level,
      doubleRewardChance: doubleRewardChanceForLevel(level),
    }),
  },
  "automatic-speed": {
    level: (state) => state.player.automaticSpeedLevel,
    canAdvance: (state, nextLevel) =>
      automaticInterval(state.enemy, { ...state.player, automaticSpeedLevel: nextLevel }) <
      automaticInterval(state.enemy, state.player),
    apply: (player, level) => ({ ...player, automaticSpeedLevel: level }),
  },
};
export const upgradeLevel = (state: CombatState, id: UpgradeId): number =>
  UPGRADE_POLICIES[id].level(state);
export const upgradeCost = (state: CombatState, id: UpgradeId): number => {
  const cost = Math.ceil(
    definitionFor(id).baseCost *
      (upgradeLevel(state, id) + 1) ** COMBAT_FORMULAS.upgradeCostExponent,
  );
  return Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, cost));
};
const canAdvanceUpgrade = (state: CombatState, id: UpgradeId): boolean => {
  const level = upgradeLevel(state, id);
  if (level === Number.MAX_SAFE_INTEGER) return false;
  return UPGRADE_POLICIES[id].canAdvance(state, level + 1);
};
export const upgradeDisabledReason = (state: CombatState, id: UpgradeId): string | null => {
  if (id === "automatic-speed" && !state.automaticUnlocked)
    return "Requires automatic attack unlock";
  if (id === "automatic-unlock" && state.automaticUnlocked) return "Already unlocked";
  if (!canAdvanceUpgrade(state, id)) return "Level cannot advance safely";
  const cost = upgradeCost(state, id);
  return state.coins < cost ? `Need ${cost} coins` : null;
};
const upgradedPlayer = (player: CombatPlayer, id: UpgradeId, level: number): CombatPlayer =>
  UPGRADE_POLICIES[id].apply(player, level);
export const purchaseUpgrade = (
  state: CombatState,
  id: UpgradeId,
  atMs: number,
): UpgradePurchase => {
  const reason = upgradeDisabledReason(state, id);
  if (reason) return { reason, state };
  const cost = upgradeCost(state, id);
  const level = Math.min(Number.MAX_SAFE_INTEGER, upgradeLevel(state, id) + 1);
  const player = upgradedPlayer(state.player, id, level);
  const automaticUnlocked = state.automaticUnlocked || id === "automatic-unlock";
  return {
    reason: null,
    state: {
      ...state,
      automaticUnlocked,
      coins: state.coins - cost,
      nextAutomaticAttackAtMs:
        id === "automatic-unlock" || id === "automatic-speed"
          ? atMs + automaticInterval(state.enemy, player)
          : state.nextAutomaticAttackAtMs,
      player,
    },
  };
};
