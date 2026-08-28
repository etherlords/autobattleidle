export const COMBAT_BALANCE = {
  automaticAttackIntervalMs: 1_000,
  automaticAttackMinimumIntervalMs: 500,
  automaticAttackSpeedStepMs: 100,
  bossInterval: 10,
  eliteAutomaticSlowMs: 500,
  baseEnemyHealth: 10,
  enemyHealthPerEncounter: 5,
  baseReward: 1,
} as const;

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
  readonly damage: number;
  readonly criticalChance: number;
  readonly doubleRewardChance: number;
};

export type UpgradeId =
  "automatic-unlock" | "damage" | "critical-chance" | "double-reward" | "automatic-speed";

export type UpgradeDefinition = {
  readonly id: UpgradeId;
  readonly label: string;
  readonly maximumLevel: number;
  readonly baseCost: number;
};

export type UpgradePurchase = {
  readonly state: CombatState;
  readonly reason: string | null;
};

export const UPGRADES: readonly UpgradeDefinition[] = [
  { id: "automatic-unlock", label: "Unlock automatic attack", maximumLevel: 1, baseCost: 1 },
  { id: "damage", label: "Damage", maximumLevel: 10, baseCost: 2 },
  { id: "critical-chance", label: "Critical chance", maximumLevel: 5, baseCost: 3 },
  { id: "double-reward", label: "Double reward chance", maximumLevel: 5, baseCost: 4 },
  { id: "automatic-speed", label: "Automatic speed", maximumLevel: 5, baseCost: 5 },
];

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
    };

export type AttackResult = {
  readonly event: AttackEvent;
  readonly state: CombatState;
};

const selectGrade = (encounter: number): EnemyGrade => {
  if (encounter % COMBAT_BALANCE.bossInterval === 0) return "boss";
  return (["normal", "veteran", "elite"] as const)[(encounter - 1) % 3] ?? "normal";
};

const selectEliteModifier = (roll: number): EliteModifier => {
  const index = Math.min(2, Math.floor(roll * 3));
  return (["armor", "health", "automatic-slow"] as const)[index] ?? "armor";
};

export const spawnEnemy = (encounter: number, eliteModifierRoll: number): CombatEnemy => {
  const grade = selectGrade(encounter);
  const modifier = grade === "elite" ? selectEliteModifier(eliteModifierRoll) : null;
  const baseHealth =
    COMBAT_BALANCE.baseEnemyHealth + (encounter - 1) * COMBAT_BALANCE.enemyHealthPerEncounter;
  const gradeMultiplier =
    grade === "boss" ? 3 : grade === "elite" ? 2 : grade === "veteran" ? 1.5 : 1;
  const maxHealth = Math.round(baseHealth * gradeMultiplier * (modifier === "health" ? 1.5 : 1));
  const reward = Math.round(COMBAT_BALANCE.baseReward * encounter * gradeMultiplier);

  return {
    armor: modifier === "armor" ? encounter : 0,
    encounter,
    grade,
    health: maxHealth,
    id: encounter,
    maxHealth,
    modifier,
    reward,
  };
};

export const createCombatState = (
  player: Omit<CombatPlayer, "automaticSpeedLevel"> &
    Partial<Pick<CombatPlayer, "automaticSpeedLevel">>,
  firstEliteModifierRoll: number,
  automaticUnlocked: boolean,
): CombatState => ({
  automaticUnlocked,
  coins: 0,
  enemy: spawnEnemy(1, firstEliteModifierRoll),
  nextAutomaticAttackAtMs: 0,
  player: { ...player, automaticSpeedLevel: player.automaticSpeedLevel ?? 0 },
});

export const automaticInterval = (enemy: CombatEnemy, player: CombatPlayer): number =>
  Math.max(
    COMBAT_BALANCE.automaticAttackMinimumIntervalMs,
    COMBAT_BALANCE.automaticAttackIntervalMs -
      player.automaticSpeedLevel * COMBAT_BALANCE.automaticAttackSpeedStepMs,
  ) + (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);

const definitionFor = (id: UpgradeId): UpgradeDefinition => {
  const definition = UPGRADES.find((entry) => entry.id === id);
  if (definition === undefined) throw new Error(`Unknown upgrade ${id}`);
  return definition;
};

export const upgradeLevel = (state: CombatState, id: UpgradeId): number => {
  if (id === "automatic-unlock") return state.automaticUnlocked ? 1 : 0;
  if (id === "damage") return state.player.damage - 1;
  if (id === "critical-chance") return Math.round(state.player.criticalChance * 10);
  if (id === "double-reward") return Math.round(state.player.doubleRewardChance * 10);
  return state.player.automaticSpeedLevel;
};

export const upgradeCost = (state: CombatState, id: UpgradeId): number => {
  const definition = definitionFor(id);
  return definition.baseCost * 2 ** upgradeLevel(state, id);
};

export const upgradeDisabledReason = (state: CombatState, id: UpgradeId): string | null => {
  const definition = definitionFor(id);
  if (id === "automatic-speed" && !state.automaticUnlocked) {
    return "Requires automatic attack unlock";
  }
  if (upgradeLevel(state, id) >= definition.maximumLevel) return "Maximum level reached";
  const cost = upgradeCost(state, id);
  return state.coins < cost ? `Need ${cost} coins` : null;
};

export const purchaseUpgrade = (
  state: CombatState,
  id: UpgradeId,
  atMs: number,
): UpgradePurchase => {
  const disabledReason = upgradeDisabledReason(state, id);
  if (disabledReason !== null) return { reason: disabledReason, state };
  const cost = upgradeCost(state, id);
  if (state.coins < cost) return { reason: `Need ${cost} coins`, state };
  const player =
    id === "damage"
      ? { ...state.player, damage: state.player.damage + 1 }
      : id === "critical-chance"
        ? { ...state.player, criticalChance: Math.min(0.5, state.player.criticalChance + 0.1) }
        : id === "double-reward"
          ? {
              ...state.player,
              doubleRewardChance: Math.min(0.5, state.player.doubleRewardChance + 0.1),
            }
          : id === "automatic-speed"
            ? { ...state.player, automaticSpeedLevel: state.player.automaticSpeedLevel + 1 }
            : state.player;
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
  ) {
    return { event: { type: "ignored" }, state };
  }

  const critical = command.rolls.critical < state.player.criticalChance;
  const damage = Math.max(1, state.player.damage - state.enemy.armor) * (critical ? 2 : 1);
  const health = Math.max(0, state.enemy.health - damage);
  const nextAutomaticAttackAtMs =
    command.source === "automatic"
      ? command.atMs + automaticInterval(state.enemy, state.player)
      : state.nextAutomaticAttackAtMs;

  if (health > 0) {
    return {
      event: { critical, damage, defeated: false, reward: 0, type: "hit" },
      state: { ...state, enemy: { ...state.enemy, health }, nextAutomaticAttackAtMs },
    };
  }

  const reward =
    state.enemy.reward * (command.rolls.doubleReward < state.player.doubleRewardChance ? 2 : 1);
  return {
    event: { critical, damage, defeated: true, reward, type: "hit" },
    state: {
      ...state,
      coins: state.coins + reward,
      enemy: spawnEnemy(state.enemy.encounter + 1, command.rolls.nextEliteModifier),
      nextAutomaticAttackAtMs,
    },
  };
};
