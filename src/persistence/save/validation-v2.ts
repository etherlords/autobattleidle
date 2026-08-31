import {
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  spawnEnemy,
  spawnStarterEnemy,
  type CombatEnemy,
  type CombatPlayer,
  type CombatState,
  type EliteModifier,
  type EnemyGrade,
} from "../../domain/combat";
import {
  chance,
  hasExactKeys,
  integer,
  isRecord,
  modifierRoll,
  parseEnemyShape,
} from "./validation-primitives";

// eslint-disable-next-line complexity -- each persisted derived field must be validated at the boundary.
export const parseV2Player = (value: unknown): Required<CombatPlayer> | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "automaticSpeedLevel",
      "armorPenetrationLevel",
      "criticalChance",
      "criticalLevel",
      "damage",
      "damageLevel",
      "doubleRewardChance",
      "doubleRewardLevel",
    ])
  )
    return undefined;
  const {
    automaticSpeedLevel,
    armorPenetrationLevel,
    criticalChance,
    criticalLevel,
    damage,
    damageLevel,
    doubleRewardChance,
    doubleRewardLevel,
  } = value;
  if (!integer(automaticSpeedLevel, 0) || !integer(armorPenetrationLevel, 0)) return undefined;
  if (!integer(criticalLevel, 0) || !integer(damageLevel, 0) || !integer(doubleRewardLevel, 0))
    return undefined;
  if (!integer(damage, 1) || !chance(criticalChance) || !chance(doubleRewardChance))
    return undefined;
  if (
    ![
      automaticSpeedLevel,
      armorPenetrationLevel,
      criticalLevel,
      damageLevel,
      doubleRewardLevel,
    ].every((level) => integer(level, 0))
  )
    return undefined;
  if (
    damage !== damageForLevel(damageLevel) ||
    criticalChance !== criticalChanceForLevel(criticalLevel) ||
    doubleRewardChance !== doubleRewardChanceForLevel(doubleRewardLevel)
  )
    return undefined;
  return {
    automaticSpeedLevel,
    armorPenetrationLevel,
    criticalChance,
    criticalLevel,
    damage,
    damageLevel,
    doubleRewardChance,
    doubleRewardLevel,
  };
};

const isCurrentSaveEnvelope = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  hasExactKeys(value, ["automaticUnlocked", "coins", "enemy", "player", "version"]) &&
  value.version === 2 &&
  integer(value.coins, 0) &&
  typeof value.automaticUnlocked === "boolean";

const matchesCurrentEnemy = (expected: CombatEnemy, enemy: CombatEnemy): boolean =>
  expected.grade === enemy.grade &&
  expected.modifier === enemy.modifier &&
  expected.armor === enemy.armor &&
  expected.maxHealth === enemy.maxHealth &&
  expected.reward === enemy.reward;

const PREVIOUS_BOSS_INTERVAL = 15;
const PREVIOUS_BASE_ENEMY_HEALTH = 140;
const PREVIOUS_ENEMY_HEALTH_GROWTH = 1.002;
const PREVIOUS_BASE_REWARD = 1.2;
const PREVIOUS_BOSS_BASE_MULTIPLIER = 10;
const PREVIOUS_BOSS_INDEX_LINEAR_MULTIPLIER = 120;
const PREVIOUS_BOSS_INDEX_QUADRATIC_MULTIPLIER = 5;

const previousCadenceGrade = (encounter: number): EnemyGrade => {
  if (encounter % PREVIOUS_BOSS_INTERVAL === 0) return "boss";
  return (["normal", "veteran", "elite"] as const)[(encounter - 1) % 3] ?? "normal";
};

const previousCadenceMultiplier = (enemyGrade: EnemyGrade, encounter: number): number => {
  if (enemyGrade === "boss") {
    const bossIndex = Math.ceil(encounter / PREVIOUS_BOSS_INTERVAL) - 1;
    return (
      PREVIOUS_BOSS_BASE_MULTIPLIER +
      PREVIOUS_BOSS_INDEX_LINEAR_MULTIPLIER * bossIndex +
      PREVIOUS_BOSS_INDEX_QUADRATIC_MULTIPLIER * bossIndex * bossIndex
    );
  }
  if (enemyGrade === "elite") return 2;
  if (enemyGrade === "veteran") return 1.5;
  return 1;
};

const previousCadenceModifier = (enemyGrade: EnemyGrade, roll: number): EliteModifier | null => {
  if (enemyGrade !== "elite") return null;
  return (
    (["armor", "health", "automatic-slow"] as const)[Math.min(2, Math.floor(roll * 3))] ?? "armor"
  );
};

const previousCadenceArmor = (
  enemyGrade: EnemyGrade,
  enemyModifier: EliteModifier | null,
  encounter: number,
): number => {
  if (enemyModifier === "armor") return encounter * 2;
  if (enemyGrade === "boss") return encounter;
  return 0;
};

const previousCadenceEnemy = (encounter: number, roll: number): CombatEnemy => {
  const enemyGrade = previousCadenceGrade(encounter);
  const enemyModifier = previousCadenceModifier(enemyGrade, roll);
  const baseHealth = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.round(
      PREVIOUS_BASE_ENEMY_HEALTH * (1 + (PREVIOUS_ENEMY_HEALTH_GROWTH - 1) * (encounter - 1)),
    ),
  );
  const multiplier = previousCadenceMultiplier(enemyGrade, encounter);
  const healthMultiplier = enemyModifier === "health" ? 1.5 : 1;
  const armor = previousCadenceArmor(enemyGrade, enemyModifier, encounter);
  const maxHealth = Math.max(
    1,
    Math.min(Number.MAX_SAFE_INTEGER, Math.round(baseHealth * multiplier * healthMultiplier)),
  );
  return {
    armor,
    encounter,
    grade: enemyGrade,
    health: maxHealth,
    id: encounter,
    maxHealth,
    modifier: enemyModifier,
    reward: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(1, Math.round(PREVIOUS_BASE_REWARD * encounter * multiplier)),
    ),
  };
};

type EnemyRecognition = "current" | "historical" | "invalid";

const sameEnemySemantics = (left: CombatEnemy, right: CombatEnemy): boolean =>
  left.grade === right.grade &&
  left.modifier === right.modifier &&
  left.armor === right.armor &&
  left.maxHealth === right.maxHealth &&
  left.reward === right.reward;

const recognizeEnemy = (enemy: CombatEnemy): EnemyRecognition => {
  const current = spawnEnemy(enemy.encounter, modifierRoll(enemy.modifier));
  const starter = enemy.encounter === 1 ? spawnStarterEnemy(modifierRoll(enemy.modifier)) : current;
  const historical = previousCadenceEnemy(enemy.encounter, modifierRoll(enemy.modifier));
  const currentMatches = matchesCurrentEnemy(current, enemy) || matchesCurrentEnemy(starter, enemy);
  const historicalMatches = matchesCurrentEnemy(historical, enemy);
  if (currentMatches && historicalMatches)
    return sameEnemySemantics(current, historical) ? "current" : "invalid";
  if (currentMatches) return "current";
  if (historicalMatches) return "historical";
  return "invalid";
};

export const decodeV2 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (!isCurrentSaveEnvelope(value)) return undefined;
  const automaticUnlocked = value.automaticUnlocked;
  const coins = value.coins;
  if (typeof automaticUnlocked !== "boolean" || !integer(coins, 0)) return undefined;
  const player = parseV2Player(value.player);
  const enemy = parseEnemyShape(value.enemy);
  if (!player || !enemy || (!value.automaticUnlocked && player.automaticSpeedLevel !== 0))
    return undefined;
  const recognition = recognizeEnemy(enemy);
  if (recognition === "invalid") return undefined;
  return {
    automaticUnlocked,
    coins,
    enemy,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
    goldenBug: null,
    goldenBugDefeats: 0,
  };
};
