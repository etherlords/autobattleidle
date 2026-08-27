export const COMBAT_BALANCE = {
  automaticAttackIntervalMs: 1_000,
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
  readonly damage: number;
  readonly criticalChance: number;
  readonly doubleRewardChance: number;
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
  player: CombatPlayer,
  firstEliteModifierRoll: number,
  automaticUnlocked: boolean,
): CombatState => ({
  automaticUnlocked,
  coins: 0,
  enemy: spawnEnemy(1, firstEliteModifierRoll),
  nextAutomaticAttackAtMs: 0,
  player,
});

const automaticInterval = (enemy: CombatEnemy): number =>
  COMBAT_BALANCE.automaticAttackIntervalMs +
  (enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0);

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
      ? command.atMs + automaticInterval(state.enemy)
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
