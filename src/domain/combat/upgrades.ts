import { COMBAT_BALANCE, COMBAT_FORMULAS } from "./balance";
import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  UpgradeDefinition,
  UpgradeId,
  UpgradePurchase,
} from "./contracts";
import {
  armorPenetrationLevelFor,
  criticalLevelFor,
  damageLevelFor,
  doubleRewardLevelFor,
  normalizeLevel,
} from "./player-stats";
import { spawnStarterEnemy } from "./progression";

const diminishingChance = (level: number): number =>
  (COMBAT_FORMULAS.chanceLimit * normalizeLevel(level)) /
  (normalizeLevel(level) + COMBAT_FORMULAS.chanceLevelScale);

export const damageForLevel = (level: number): number => {
  const safeLevel = normalizeLevel(level);
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    1 + safeLevel + Math.floor(COMBAT_FORMULAS.damageRootBonus * Math.sqrt(safeLevel)),
  );
};

export const criticalChanceForLevel = (level: number): number => diminishingChance(level);
export const doubleRewardChanceForLevel = (level: number): number => diminishingChance(level);
export const armorPenetrationForLevel = (level: number): number =>
  (COMBAT_FORMULAS.armorPenetrationLimit * normalizeLevel(level)) /
  (normalizeLevel(level) + COMBAT_FORMULAS.chanceLevelScale);
export const effectiveArmor = (armor: number, penetrationLevel: number): number =>
  Math.max(0, Math.floor(armor * (1 - armorPenetrationForLevel(penetrationLevel))));

export const automaticAttacksPerSecond = (level: number): number => {
  const safeLevel = normalizeLevel(level);
  const ratio =
    safeLevel === 0
      ? 0
      : 1 / (1 + (COMBAT_FORMULAS.automaticAttacksPerSecondLevelScale / safeLevel) ** 2);
  return Math.min(
    COMBAT_FORMULAS.automaticAttacksPerSecondBase +
      COMBAT_FORMULAS.automaticAttacksPerSecondBonus -
      Number.EPSILON * 2,
    COMBAT_FORMULAS.automaticAttacksPerSecondBase +
      COMBAT_FORMULAS.automaticAttacksPerSecondBonus * ratio,
  );
};

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
    armorPenetrationLevel: armorPenetrationLevelFor({
      ...merged,
      armorPenetrationLevel: player.armorPenetrationLevel,
    }),
    criticalLevel: criticalLevelFor({ ...merged, criticalLevel: player.criticalLevel }),
    damageLevel: damageLevelFor({ ...merged, damageLevel: player.damageLevel }),
    doubleRewardLevel: doubleRewardLevelFor({
      ...merged,
      doubleRewardLevel: player.doubleRewardLevel,
    }),
  };
};

export const createCombatState = (
  player: Partial<CombatPlayer> = {},
  firstEliteModifierRoll = 0,
  automaticUnlocked = false,
): CombatState => ({
  automaticUnlocked,
  coins: 0,
  enemy: spawnStarterEnemy(firstEliteModifierRoll),
  nextAutomaticAttackAtMs: 0,
  player: normalizedPlayer(player),
  goldenBug: null,
  goldenBugDefeats: 0,
});

export const automaticInterval = (enemy: CombatEnemy, player: CombatPlayer): number =>
  1_000 / automaticAttacksPerSecond(player.automaticSpeedLevel) +
  (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);

type UpgradeStrategy = {
  readonly definition: UpgradeDefinition;
  readonly level: (state: CombatState) => number;
  readonly canAdvance: (state: CombatState, nextLevel: number) => boolean;
  readonly apply: (player: CombatPlayer, level: number) => CombatPlayer;
};

const UPGRADE_STRATEGIES = {
  "automatic-unlock": {
    definition: { id: "automatic-unlock", label: "Unlock automatic attack", baseCost: 1 },
    level: (state) => Number(state.automaticUnlocked),
    canAdvance: (state) => !state.automaticUnlocked,
    apply: (player) => player,
  },
  damage: {
    definition: { id: "damage", label: "Damage", baseCost: 2 },
    level: (state) => normalizeLevel(damageLevelFor(state.player)),
    canAdvance: (state, nextLevel) =>
      damageForLevel(nextLevel) > damageForLevel(normalizeLevel(damageLevelFor(state.player))),
    apply: (player, level) => ({ ...player, damageLevel: level, damage: damageForLevel(level) }),
  },
  "armor-penetration": {
    definition: { id: "armor-penetration", label: "Armor penetration", baseCost: 3 },
    level: (state) => normalizeLevel(armorPenetrationLevelFor(state.player)),
    canAdvance: (state, nextLevel) =>
      armorPenetrationForLevel(nextLevel) >
      armorPenetrationForLevel(normalizeLevel(armorPenetrationLevelFor(state.player))),
    apply: (player, level) => ({ ...player, armorPenetrationLevel: level }),
  },
  "critical-chance": {
    definition: { id: "critical-chance", label: "Critical chance", baseCost: 3 },
    level: (state) => normalizeLevel(criticalLevelFor(state.player)),
    canAdvance: (state, nextLevel) =>
      criticalChanceForLevel(nextLevel) >
      criticalChanceForLevel(normalizeLevel(criticalLevelFor(state.player))),
    apply: (player, level) => ({
      ...player,
      criticalLevel: level,
      criticalChance: criticalChanceForLevel(level),
    }),
  },
  "double-reward": {
    definition: { id: "double-reward", label: "Double reward chance", baseCost: 4 },
    level: (state) => normalizeLevel(doubleRewardLevelFor(state.player)),
    canAdvance: (state, nextLevel) =>
      doubleRewardChanceForLevel(nextLevel) >
      doubleRewardChanceForLevel(normalizeLevel(doubleRewardLevelFor(state.player))),
    apply: (player, level) => ({
      ...player,
      doubleRewardLevel: level,
      doubleRewardChance: doubleRewardChanceForLevel(level),
    }),
  },
  "automatic-speed": {
    definition: { id: "automatic-speed", label: "Automatic speed", baseCost: 5 },
    level: (state) => normalizeLevel(state.player.automaticSpeedLevel),
    canAdvance: (state, nextLevel) =>
      automaticInterval(state.enemy, { ...state.player, automaticSpeedLevel: nextLevel }) <
      automaticInterval(state.enemy, state.player),
    apply: (player, level) => ({ ...player, automaticSpeedLevel: level }),
  },
} satisfies Record<UpgradeId, UpgradeStrategy>;

type MissingUpgradeIds<Order extends readonly UpgradeId[]> =
  Order extends readonly (infer Id extends UpgradeId)[] ? Exclude<UpgradeId, Id> : UpgradeId;

const UPGRADE_DISPLAY_ORDER_VALUES = [
  "automatic-unlock",
  "damage",
  "armor-penetration",
  "critical-chance",
  "double-reward",
  "automatic-speed",
] as const satisfies readonly UpgradeId[];

type CompleteUpgradeDisplayOrder =
  MissingUpgradeIds<typeof UPGRADE_DISPLAY_ORDER_VALUES> extends never
    ? typeof UPGRADE_DISPLAY_ORDER_VALUES
    : never;

export const UPGRADE_DISPLAY_ORDER: CompleteUpgradeDisplayOrder = UPGRADE_DISPLAY_ORDER_VALUES;

export const UPGRADES: readonly UpgradeDefinition[] = UPGRADE_DISPLAY_ORDER.map(
  (id) => UPGRADE_STRATEGIES[id].definition,
);

export const upgradeLevel = (state: CombatState, id: UpgradeId): number =>
  UPGRADE_STRATEGIES[id].level(state);

export const upgradeCost = (state: CombatState, id: UpgradeId): number => {
  const cost = Math.ceil(
    UPGRADE_STRATEGIES[id].definition.baseCost *
      (upgradeLevel(state, id) + 1) ** COMBAT_FORMULAS.upgradeCostExponent,
  );
  return Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, cost));
};

const canAdvanceUpgrade = (state: CombatState, id: UpgradeId): boolean => {
  const level = upgradeLevel(state, id);
  if (level === Number.MAX_SAFE_INTEGER) return false;
  return UPGRADE_STRATEGIES[id].canAdvance(state, level + 1);
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
  UPGRADE_STRATEGIES[id].apply(player, level);

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
