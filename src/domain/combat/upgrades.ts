import { COMBAT_BALANCE, COMBAT_FORMULAS } from "./balance";
import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  ArmorPenetrationPolicy,
  CriticalChancePolicy,
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
export const criticalChanceForPolicy = (
  level: number,
  policy: CriticalChancePolicy = "asymptotic",
): number =>
  policy === "linear-capped"
    ? Math.min(COMBAT_FORMULAS.chanceLimit, normalizeLevel(level) * 0.02)
    : criticalChanceForLevel(level);
export const doubleRewardChanceForLevel = (level: number): number => diminishingChance(level);
export const armorPenetrationForLevel = (level: number): number =>
  (COMBAT_FORMULAS.armorPenetrationLimit * normalizeLevel(level)) /
  (normalizeLevel(level) + COMBAT_FORMULAS.chanceLevelScale);
export const armorPenetrationForPolicy = (
  level: number,
  policy: ArmorPenetrationPolicy = "asymptotic",
): number =>
  policy === "linear-capped"
    ? Math.min(COMBAT_FORMULAS.armorPenetrationLimit, normalizeLevel(level) * 0.025)
    : armorPenetrationForLevel(level);
export const effectiveArmor = (
  armor: number,
  penetrationLevel: number,
  policy: ArmorPenetrationPolicy = "asymptotic",
): number =>
  Math.max(0, Math.floor(armor * (1 - armorPenetrationForPolicy(penetrationLevel, policy))));

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

/** Packet weights resolved together at the bounded visual cadence. */
export const automaticAttackPacketMultipliers = (attacksPerSecond: number): readonly number[] => {
  if (!Number.isFinite(attacksPerSecond) || attacksPerSecond <= 0)
    throw new RangeError("Automatic attacks per second must be finite and positive");
  const attacksPerTick = attacksPerSecond / COMBAT_BALANCE.automaticVisualTickRate;
  const fullPackets = Math.floor(attacksPerTick);
  const fractionalPacket = Number((attacksPerTick - fullPackets).toFixed(12));
  return [
    ...Array.from({ length: fullPackets }, () => 1),
    ...(fractionalPacket > 0 ? [fractionalPacket] : []),
  ];
};

const displayedThousandths = (value: number): number => Math.floor(value * 1_000 + 1e-9);
const displayedHundredths = (value: number): number => Math.round(value * 100);

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
): CombatState => {
  const normalized = normalizedPlayer(player);
  return {
    automaticUnlocked,
    coins: 0,
    enemy: spawnStarterEnemy(firstEliteModifierRoll, normalized),
    nextAutomaticAttackAtMs: 0,
    player: normalized,
    goldenBug: null,
    goldenBugDefeats: 0,
  };
};

export const automaticInterval = (enemy: CombatEnemy, player: CombatPlayer): number =>
  1_000 / automaticAttacksPerSecond(player.automaticSpeedLevel) +
  (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);

type UpgradeStrategy = {
  readonly definition: UpgradeDefinition;
  readonly level: (state: CombatState) => number;
  readonly displayedValue: (player: CombatPlayer, level: number) => number;
  readonly apply: (player: CombatPlayer, level: number) => CombatPlayer;
};

const UPGRADE_STRATEGIES = {
  "automatic-unlock": {
    definition: { id: "automatic-unlock", label: "Unlock automatic attack", baseCost: 1 },
    level: (state) => Number(state.automaticUnlocked),
    displayedValue: () => 0,
    apply: (player) => player,
  },
  damage: {
    definition: { id: "damage", label: "Damage", baseCost: 2 },
    level: (state) => normalizeLevel(damageLevelFor(state.player)),
    displayedValue: (_player, level) => damageForLevel(level),
    apply: (player, level) => ({ ...player, damageLevel: level, damage: damageForLevel(level) }),
  },
  "armor-penetration": {
    definition: { id: "armor-penetration", label: "Armor penetration", baseCost: 3 },
    level: (state) => normalizeLevel(armorPenetrationLevelFor(state.player)),
    displayedValue: (_player, level) => displayedThousandths(armorPenetrationForLevel(level)),
    apply: (player, level) => ({ ...player, armorPenetrationLevel: level }),
  },
  "critical-chance": {
    definition: { id: "critical-chance", label: "Critical chance", baseCost: 3 },
    level: (state) => normalizeLevel(criticalLevelFor(state.player)),
    displayedValue: (_player, level) => displayedThousandths(criticalChanceForLevel(level)),
    apply: (player, level) => ({
      ...player,
      criticalLevel: level,
      criticalChance: criticalChanceForLevel(level),
    }),
  },
  "double-reward": {
    definition: { id: "double-reward", label: "Double reward chance", baseCost: 4 },
    level: (state) => normalizeLevel(doubleRewardLevelFor(state.player)),
    displayedValue: (_player, level) => displayedThousandths(doubleRewardChanceForLevel(level)),
    apply: (player, level) => ({
      ...player,
      doubleRewardLevel: level,
      doubleRewardChance: doubleRewardChanceForLevel(level),
    }),
  },
  "automatic-speed": {
    definition: { id: "automatic-speed", label: "Automatic speed", baseCost: 5 },
    level: (state) => normalizeLevel(state.player.automaticSpeedLevel),
    displayedValue: (_player, level) => displayedHundredths(automaticAttacksPerSecond(level)),
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

export const upgradeCost = (state: CombatState, id: UpgradeId, costMultiplier = 1): number => {
  if (!Number.isFinite(costMultiplier) || costMultiplier <= 0)
    throw new RangeError("Upgrade cost multiplier must be finite and positive");
  const next = nextUpgradeLevel(state, id);
  if (next === null) return Number.MAX_SAFE_INTEGER;
  return costForNextUpgrade(state, id, next, costMultiplier);
};

const costForNextUpgrade = (
  state: CombatState,
  id: UpgradeId,
  next: number,
  costMultiplier: number,
): number =>
  Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.ceil(totalUpgradeCost(id, upgradeLevel(state, id), next) * costMultiplier),
  );

const levelCost = (id: UpgradeId, level: number): number =>
  Math.max(
    1,
    Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.ceil(
        UPGRADE_STRATEGIES[id].definition.baseCost * level ** COMBAT_FORMULAS.upgradeCostExponent,
      ),
    ),
  );

const totalUpgradeCost = (id: UpgradeId, current: number, next: number): number => {
  const count = next - current;
  const minimumCost = levelCost(id, current + 1);
  if (count > Math.floor(Number.MAX_SAFE_INTEGER / minimumCost)) return Number.MAX_SAFE_INTEGER;
  let total = 0;
  for (let level = current + 1; level <= next; level += 1) {
    total = Math.min(Number.MAX_SAFE_INTEGER, total + levelCost(id, level));
    if (total === Number.MAX_SAFE_INTEGER) return total;
  }
  return total;
};

const nextUpgradeLevel = (state: CombatState, id: UpgradeId): number | null => {
  const level = upgradeLevel(state, id);
  if (id === "automatic-unlock") return state.automaticUnlocked ? null : 1;
  const strategy = UPGRADE_STRATEGIES[id];
  const current = strategy.displayedValue(state.player, level);
  if (
    id === "automatic-speed" &&
    current >=
      Math.round(
        (COMBAT_FORMULAS.automaticAttacksPerSecondBase +
          COMBAT_FORMULAS.automaticAttacksPerSecondBonus) *
          100,
      )
  )
    return null;
  if (strategy.displayedValue(state.player, Number.MAX_SAFE_INTEGER) <= current) return null;
  let low = level + 1;
  let high = Number.MAX_SAFE_INTEGER;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (strategy.displayedValue(state.player, middle) > current) high = middle;
    else low = middle + 1;
  }
  return low;
};

export const upgradeDisabledReason = (
  state: CombatState,
  id: UpgradeId,
  costMultiplier = 1,
): string | null => {
  if (id === "automatic-speed" && !state.automaticUnlocked)
    return "Requires automatic attack unlock";
  if (id === "automatic-unlock" && state.automaticUnlocked) return "Already unlocked";
  if (nextUpgradeLevel(state, id) === null) return "Level cannot advance safely";
  const cost = upgradeCost(state, id, costMultiplier);
  return state.coins < cost ? `Need ${cost} coins` : null;
};

const upgradedPlayer = (player: CombatPlayer, id: UpgradeId, level: number): CombatPlayer =>
  UPGRADE_STRATEGIES[id].apply(player, level);

export const purchaseUpgrade = (
  state: CombatState,
  id: UpgradeId,
  atMs: number,
  costMultiplier = 1,
): UpgradePurchase => {
  if (id === "automatic-speed" && !state.automaticUnlocked)
    return { reason: "Requires automatic attack unlock", state };
  if (id === "automatic-unlock" && state.automaticUnlocked)
    return { reason: "Already unlocked", state };
  const next = nextUpgradeLevel(state, id);
  if (next === null) return { reason: "Level cannot advance safely", state };
  const cost = costForNextUpgrade(state, id, next, costMultiplier);
  if (state.coins < cost) return { reason: `Need ${cost} coins`, state };
  const level = next;
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
