import type { CombatEnemy, EliteModifier, EnemyGrade } from "../../domain/combat";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

export const integer = (
  value: unknown,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;

export const chance = (value: unknown): value is number =>
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
export const parseEnemyShape = (value: unknown): CombatEnemy | undefined => {
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
