export const COMBAT_BALANCE = {
  automaticAttackIntervalMs: 1_000,
  automaticAttackMinimumIntervalMs: 200,
  bossInterval: 15,
  eliteAutomaticSlowMs: 500,
  baseEnemyHealth: 140,
  enemyHealthGrowth: 1.002,
  baseReward: 1.2,
} as const;

const MAX_ENCOUNTER = Math.floor(Number.MAX_SAFE_INTEGER / 3);

export type AttackSource = "manual" | "automatic";
export type EnemyGrade = "normal" | "veteran" | "elite" | "boss";
export type EliteModifier = "armor" | "health" | "automatic-slow";
export type CombatEnemy = {
  readonly id: number;
  readonly encounter: number;
  readonly grade: EnemyGrade;
  readonly modifier: EliteModifier | null;
  readonly health: number;
  readonly maxHealth: number;
  readonly armor: number;
  readonly reward: number;
};
export type CombatPlayer = {
  readonly automaticSpeedLevel: number;
  readonly criticalChance: number;
  readonly damage: number;
  readonly doubleRewardChance: number;
  readonly armorPenetrationLevel?: number;
  readonly criticalLevel?: number;
  readonly damageLevel?: number;
  readonly doubleRewardLevel?: number;
};
export type UpgradeId =
  | "automatic-unlock"
  | "damage"
  | "armor-penetration"
  | "critical-chance"
  | "double-reward"
  | "automatic-speed";
export type UpgradeDefinition = {
  readonly id: UpgradeId;
  readonly label: string;
  readonly baseCost: number;
};
export type CombatState = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly nextAutomaticAttackAtMs: number;
  readonly player: CombatPlayer;
};
export type AttackRolls = {
  readonly critical: number;
  readonly doubleReward: number;
  readonly nextEliteModifier: number;
};
export type AttackCommand = {
  readonly atMs: number;
  readonly enemyId: number;
  readonly rolls: AttackRolls;
  readonly source: AttackSource;
};
export type AttackEvent =
  | { readonly type: "ignored" }
  | {
      readonly type: "hit";
      readonly critical: boolean;
      readonly damage: number;
      readonly defeated: boolean;
      readonly reward: number;
      readonly armorPreventedDamage: number;
      readonly penetration: number;
    };
export type AttackResult = { readonly event: AttackEvent; readonly state: CombatState };
export type UpgradePurchase = { readonly state: CombatState; readonly reason: string | null };

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: "automatic-unlock", label: "Unlock automatic attack", baseCost: 1 },
  { id: "damage", label: "Damage", baseCost: 2 },
  {
    id: "armor-penetration",
    label: "Armor penetration",
    baseCost: 3,
  },
  { id: "critical-chance", label: "Critical chance", baseCost: 3 },
  {
    id: "double-reward",
    label: "Double reward chance",
    baseCost: 4,
  },
  { id: "automatic-speed", label: "Automatic speed", baseCost: 5 },
];

const finiteLevel = (level: number): number => {
  if (!Number.isSafeInteger(level) || level < 0)
    throw new RangeError("Level must be a non-negative safe integer");
  return level;
};
const diminishingChance = (level: number): number =>
  (0.6 * finiteLevel(level)) / (finiteLevel(level) + 20);
export const damageForLevel = (level: number): number => {
  const safeLevel = finiteLevel(level);
  return Math.min(Number.MAX_SAFE_INTEGER, 1 + safeLevel + Math.floor(10 * Math.sqrt(safeLevel)));
};
export const criticalChanceForLevel = (level: number): number => diminishingChance(level);
export const doubleRewardChanceForLevel = (level: number): number => diminishingChance(level);
export const armorPenetrationForLevel = (level: number): number =>
  (0.75 * finiteLevel(level)) / (finiteLevel(level) + 20);
export const effectiveArmor = (armor: number, penetrationLevel: number): number =>
  Math.max(0, Math.floor(armor * (1 - armorPenetrationForLevel(penetrationLevel))));

const selectGrade = (encounter: number): EnemyGrade =>
  encounter % COMBAT_BALANCE.bossInterval === 0
    ? "boss"
    : ((["normal", "veteran", "elite"] as const)[(encounter - 1) % 3] ?? "normal");
const selectEliteModifier = (roll: number): EliteModifier =>
  (["armor", "health", "automatic-slow"] as const)[Math.min(2, Math.floor(roll * 3))] ?? "armor";
const bossHealthMultiplier = (encounter: number): number => {
  const bossIndex = Math.ceil(encounter / COMBAT_BALANCE.bossInterval) - 1;
  return 10 + 120 * bossIndex + 5 * bossIndex * bossIndex;
};
export const spawnEnemy = (encounter: number, eliteModifierRoll: number): CombatEnemy => {
  if (!Number.isSafeInteger(encounter) || encounter < 1 || encounter > MAX_ENCOUNTER)
    throw new RangeError("Encounter must be a positive safe integer with safe outputs");
  const safeEncounter = encounter;
  const grade = selectGrade(safeEncounter);
  const modifier = grade === "elite" ? selectEliteModifier(eliteModifierRoll) : null;
  const baseHealth = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.round(
      COMBAT_BALANCE.baseEnemyHealth *
        (1 + (COMBAT_BALANCE.enemyHealthGrowth - 1) * (safeEncounter - 1)),
    ),
  );
  const multiplier =
    grade === "boss"
      ? bossHealthMultiplier(safeEncounter)
      : grade === "elite"
        ? 2
        : grade === "veteran"
          ? 1.5
          : 1;
  const maxHealth = Math.max(
    1,
    Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.round(baseHealth * multiplier * (modifier === "health" ? 1.5 : 1)),
    ),
  );
  return {
    armor: modifier === "armor" ? safeEncounter * 2 : grade === "boss" ? safeEncounter : 0,
    encounter: safeEncounter,
    grade,
    health: maxHealth,
    id: safeEncounter,
    maxHealth,
    modifier,
    reward: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(1, Math.round(COMBAT_BALANCE.baseReward * safeEncounter * multiplier)),
    ),
  };
};

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
  (600 * finiteLevel(player.automaticSpeedLevel)) / (finiteLevel(player.automaticSpeedLevel) + 20) +
  (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);
const definitionFor = (id: UpgradeId): UpgradeDefinition => {
  const definition = UPGRADES.find((entry) => entry.id === id);
  if (!definition) throw new Error(`Unknown upgrade ${id}`);
  return definition;
};
export const upgradeLevel = (state: CombatState, id: UpgradeId): number =>
  id === "automatic-unlock"
    ? Number(state.automaticUnlocked)
    : id === "damage"
      ? damageLevel(state.player)
      : id === "armor-penetration"
        ? penetrationLevel(state.player)
        : id === "critical-chance"
          ? criticalLevel(state.player)
          : id === "double-reward"
            ? doubleRewardLevel(state.player)
            : state.player.automaticSpeedLevel;
export const upgradeCost = (state: CombatState, id: UpgradeId): number => {
  const cost = Math.ceil(definitionFor(id).baseCost * (upgradeLevel(state, id) + 1) ** 1.35);
  return Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, cost));
};
const canAdvanceUpgrade = (state: CombatState, id: UpgradeId): boolean => {
  if (id === "automatic-unlock") return !state.automaticUnlocked;
  const level = upgradeLevel(state, id);
  if (level === Number.MAX_SAFE_INTEGER) return false;
  const nextLevel = level + 1;
  switch (id) {
    case "damage":
      return damageForLevel(nextLevel) > damageForLevel(level);
    case "armor-penetration":
      return armorPenetrationForLevel(nextLevel) > armorPenetrationForLevel(level);
    case "critical-chance":
      return criticalChanceForLevel(nextLevel) > criticalChanceForLevel(level);
    case "double-reward":
      return doubleRewardChanceForLevel(nextLevel) > doubleRewardChanceForLevel(level);
    case "automatic-speed":
      return (
        automaticInterval(state.enemy, { ...state.player, automaticSpeedLevel: nextLevel }) <
        automaticInterval(state.enemy, state.player)
      );
  }
};
export const upgradeDisabledReason = (state: CombatState, id: UpgradeId): string | null => {
  if (id === "automatic-speed" && !state.automaticUnlocked)
    return "Requires automatic attack unlock";
  if (id === "automatic-unlock" && state.automaticUnlocked) return "Already unlocked";
  if (!canAdvanceUpgrade(state, id)) return "Level cannot advance safely";
  const cost = upgradeCost(state, id);
  return state.coins < cost ? `Need ${cost} coins` : null;
};
const upgradedPlayer = (player: CombatPlayer, id: UpgradeId, level: number): CombatPlayer => {
  switch (id) {
    case "automatic-unlock":
      return player;
    case "damage":
      return { ...player, damageLevel: level, damage: damageForLevel(level) };
    case "armor-penetration":
      return { ...player, armorPenetrationLevel: level };
    case "critical-chance":
      return { ...player, criticalLevel: level, criticalChance: criticalChanceForLevel(level) };
    case "double-reward":
      return {
        ...player,
        doubleRewardLevel: level,
        doubleRewardChance: doubleRewardChanceForLevel(level),
      };
    case "automatic-speed":
      return { ...player, automaticSpeedLevel: level };
  }
};
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
export const attack = (state: CombatState, command: AttackCommand): AttackResult => {
  if (
    command.enemyId !== state.enemy.id ||
    (command.source === "automatic" &&
      (!state.automaticUnlocked || command.atMs < state.nextAutomaticAttackAtMs))
  )
    return { event: { type: "ignored" }, state };
  const penetration = armorPenetrationForLevel(penetrationLevel(state.player));
  const armor = effectiveArmor(state.enemy.armor, penetrationLevel(state.player));
  const critical = command.rolls.critical < criticalChanceForLevel(criticalLevel(state.player));
  const baseDamage = damageForLevel(damageLevel(state.player));
  const damage = Math.max(1, baseDamage - armor) * (critical ? 2 : 1);
  const armorPreventedDamage =
    Math.max(0, baseDamage - Math.max(1, baseDamage - armor)) * (critical ? 2 : 1);
  const health = Math.max(0, state.enemy.health - damage);
  const nextAutomaticAttackAtMs =
    command.source === "automatic"
      ? command.atMs + automaticInterval(state.enemy, state.player)
      : state.nextAutomaticAttackAtMs;
  if (health > 0)
    return {
      event: {
        type: "hit",
        critical,
        damage,
        defeated: false,
        reward: 0,
        armorPreventedDamage,
        penetration,
      },
      state: { ...state, enemy: { ...state.enemy, health }, nextAutomaticAttackAtMs },
    };
  const requestedReward =
    state.enemy.reward *
    (command.rolls.doubleReward < doubleRewardChanceForLevel(doubleRewardLevel(state.player))
      ? 2
      : 1);
  const reward = Math.min(requestedReward, Number.MAX_SAFE_INTEGER - state.coins);
  const nextEncounter = state.enemy.encounter === MAX_ENCOUNTER ? 1 : state.enemy.encounter + 1;
  return {
    event: {
      type: "hit",
      critical,
      damage,
      defeated: true,
      reward,
      armorPreventedDamage,
      penetration,
    },
    state: {
      ...state,
      coins: state.coins + reward,
      enemy: spawnEnemy(nextEncounter, command.rolls.nextEliteModifier),
      nextAutomaticAttackAtMs,
    },
  };
};
