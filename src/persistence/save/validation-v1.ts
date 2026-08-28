import type { CombatEnemy, EliteModifier, EnemyGrade } from "../../domain/combat";
import type { SaveV1, V1Envelope } from "./contracts";
import { chance, hasExactKeys, integer, isRecord, parseEnemyShape } from "./validation-primitives";

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
