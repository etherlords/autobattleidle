import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
} from "../domain/combat";
import {
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  spawnEnemy,
} from "../domain/combat";
import { SAVE_VERSION, type SaveV1, type V1Envelope } from "./save-contracts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const integer = (
  value: unknown,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const chance = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 0.6;
const grade = (value: unknown): value is EnemyGrade =>
  value === "normal" || value === "veteran" || value === "elite" || value === "boss";
const modifier = (value: unknown): value is EliteModifier | null =>
  value === null || value === "armor" || value === "health" || value === "automatic-slow";
export const modifierRoll = (value: EliteModifier | null): number => {
  if (value === "health") return 0.34;
  if (value === "automatic-slow") return 0.67;
  return 0;
};
const validEnemyNumbers = (enemy: Record<string, unknown>): boolean =>
  integer(enemy.id, 1) &&
  integer(enemy.encounter, 1, Math.floor(Number.MAX_SAFE_INTEGER / 3)) &&
  enemy.id === enemy.encounter &&
  integer(enemy.health, 1) &&
  integer(enemy.maxHealth, 1) &&
  enemy.health <= enemy.maxHealth &&
  integer(enemy.armor, 0) &&
  integer(enemy.reward, 1);
const validEnemyKind = (enemy: Record<string, unknown>): boolean =>
  grade(enemy.grade) &&
  modifier(enemy.modifier) &&
  (enemy.grade === "elite" || enemy.modifier === null);

// eslint-disable-next-line complexity -- strict boundary validation is intentionally exhaustive.
const parseEnemyShape = (value: unknown): CombatEnemy | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "armor",
      "encounter",
      "grade",
      "health",
      "id",
      "maxHealth",
      "modifier",
      "reward",
    ])
  )
    return undefined;
  const {
    armor,
    encounter,
    grade: enemyGrade,
    health,
    id,
    maxHealth,
    modifier: enemyModifier,
    reward,
  } = value;
  if (!validEnemyNumbers(value) || !validEnemyKind(value)) return undefined;
  if (!integer(armor, 0) || !integer(encounter, 1) || !grade(enemyGrade) || !integer(health, 1))
    return undefined;
  if (!integer(id, 1) || !integer(maxHealth, 1) || !modifier(enemyModifier) || !integer(reward, 1))
    return undefined;
  return {
    armor,
    encounter,
    grade: enemyGrade,
    health,
    id,
    maxHealth,
    modifier: enemyModifier,
    reward,
  };
};

const isV1SaveEnvelope = (value: unknown): value is V1Envelope =>
  isRecord(value) &&
  hasExactKeys(value, ["automaticUnlocked", "coins", "enemy", "player", "version"]) &&
  value.version === 1 &&
  integer(value.coins, 0) &&
  typeof value.automaticUnlocked === "boolean" &&
  isRecord(value.player) &&
  hasExactKeys(value.player, [
    "automaticSpeedLevel",
    "criticalChance",
    "damage",
    "doubleRewardChance",
  ]);
const validV1Player = (
  automaticSpeedLevel: unknown,
  criticalChance: unknown,
  damage: unknown,
  doubleRewardChance: unknown,
  automaticUnlocked: boolean,
): boolean =>
  integer(automaticSpeedLevel, 0, 5) &&
  integer(damage, 1, 11) &&
  chance(criticalChance) &&
  chance(doubleRewardChance) &&
  Number.isInteger(criticalChance * 10) &&
  Number.isInteger(doubleRewardChance * 10) &&
  (automaticUnlocked || automaticSpeedLevel === 0);
const matchesHistoricEnemy = (
  enemy: CombatEnemy,
  oldGrade: EnemyGrade,
  oldModifier: EliteModifier | null,
  oldBaseHealth: number,
  oldMultiplier: number,
): boolean =>
  enemy.grade === oldGrade &&
  enemy.modifier === oldModifier &&
  enemy.maxHealth ===
    Math.round(oldBaseHealth * oldMultiplier * (oldModifier === "health" ? 1.5 : 1)) &&
  enemy.armor === (oldModifier === "armor" ? enemy.encounter : 0) &&
  enemy.reward === Math.round(enemy.encounter * oldMultiplier);
const historicGrade = (encounter: number): EnemyGrade => {
  if (encounter % 10 === 0) return "boss";
  return (["normal", "veteran", "elite"] as const)[(encounter - 1) % 3] ?? "normal";
};
const historicMultiplier = (enemyGrade: EnemyGrade): number => {
  if (enemyGrade === "boss") return 3;
  if (enemyGrade === "elite") return 2;
  if (enemyGrade === "veteran") return 1.5;
  return 1;
};

export const parseV1 = (value: unknown): SaveV1 | undefined => {
  if (!isV1SaveEnvelope(value)) return undefined;
  const { automaticSpeedLevel, criticalChance, damage, doubleRewardChance } = value.player;
  if (
    !validV1Player(
      automaticSpeedLevel,
      criticalChance,
      damage,
      doubleRewardChance,
      value.automaticUnlocked,
    )
  )
    return undefined;
  if (!integer(automaticSpeedLevel, 0, 5) || !chance(criticalChance)) return undefined;
  if (!integer(damage, 1, 11) || !chance(doubleRewardChance)) return undefined;
  const enemy = parseEnemyShape(value.enemy);
  if (!enemy) return undefined;
  const oldGrade = historicGrade(enemy.encounter);
  const oldModifier = oldGrade === "elite" ? enemy.modifier : null;
  const oldBaseHealth = 10 + (enemy.encounter - 1) * 5;
  const oldMultiplier = historicMultiplier(oldGrade);
  if (!matchesHistoricEnemy(enemy, oldGrade, oldModifier, oldBaseHealth, oldMultiplier))
    return undefined;
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy,
    player: { automaticSpeedLevel, criticalChance, damage, doubleRewardChance },
    version: 1,
  };
};

// eslint-disable-next-line complexity -- each persisted derived field must be validated at the boundary.
const parseV2Player = (value: unknown): Required<CombatPlayer> | undefined => {
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
  value.version === SAVE_VERSION &&
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
  return historicMultiplier(enemyGrade);
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
const matchesPreviousCadenceEnemy = (enemy: CombatEnemy): boolean =>
  matchesCurrentEnemy(previousCadenceEnemy(enemy.encounter, modifierRoll(enemy.modifier)), enemy);

export const decodeV2 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (!isCurrentSaveEnvelope(value)) return undefined;
  const automaticUnlocked = value.automaticUnlocked;
  const coins = value.coins;
  if (typeof automaticUnlocked !== "boolean" || !integer(coins, 0)) return undefined;
  const player = parseV2Player(value.player);
  const enemy = parseEnemyShape(value.enemy);
  if (!player || !enemy || (!value.automaticUnlocked && player.automaticSpeedLevel !== 0))
    return undefined;
  const expected = spawnEnemy(enemy.encounter, modifierRoll(enemy.modifier));
  if (!matchesCurrentEnemy(expected, enemy) && !matchesPreviousCadenceEnemy(enemy))
    return undefined;
  return {
    automaticUnlocked,
    coins,
    enemy,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
  };
};
export const decodeSave = (value: unknown, fallback: CombatState, nowMs: number): CombatState =>
  decodeV2(value, nowMs) ?? fallback;
