import { automaticInterval, damageForLevel, spawnGoldenBug } from "../../domain/combat";
import type { CombatState } from "../../domain/combat";
import { decodeV2 } from "./validation-v2";
import { hasExactKeys, integer, isRecord, parseEnemyShape } from "./validation-primitives";
import { parseV2Player } from "./validation-v2";

const LEGACY_GOLDEN_BUG_REWARD_FACTOR = 10;
const LEGACY_GOLDEN_BUG_HEALTH_FACTOR = 5;
const legacyOrdinaryReward = (encounter: number): number => {
  let gradeMultiplier = 1;
  if (encounter % 3 === 0) gradeMultiplier = 2;
  else if (encounter % 3 === 2) gradeMultiplier = 1.5;
  return Math.max(1, Math.round(1.2 * encounter * gradeMultiplier));
};
const legacyAutomaticAttacksPerSecond = (level: number): number => {
  const ratio = level === 0 ? 0 : 1 / (1 + (150 / level) ** 2);
  return 0.1 + 2.9 * ratio;
};

const parseGoldenBug = (
  value: unknown,
): { readonly id: number; readonly resumeEncounter: number } | undefined => {
  if (!isRecord(value) || !hasExactKeys(value, ["id", "resumeEncounter"])) return undefined;
  if (!integer(value.id, 1) || !integer(value.resumeEncounter, 1)) return undefined;
  return { id: value.id, resumeEncounter: value.resumeEncounter };
};

// eslint-disable-next-line complexity -- V3 validates each persisted timed-event field at the boundary.
export const decodeV3 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "automaticUnlocked",
      "coins",
      "enemy",
      "goldenBug",
      "player",
      "version",
    ]) ||
    value.version !== 3
  )
    return undefined;
  const { goldenBug: ignoredGoldenBug, ...v2 } = value;
  void ignoredGoldenBug;
  if (value.goldenBug === null) return decodeV2({ ...v2, version: 2 }, nowMs);
  const goldenBug = parseGoldenBug(value.goldenBug);
  const enemyRecord = isRecord(value.enemy) ? value.enemy : undefined;
  const normalizedEnemy =
    enemyRecord === undefined
      ? undefined
      : parseEnemyShape({ ...enemyRecord, id: enemyRecord.encounter });
  const enemy =
    normalizedEnemy === undefined || enemyRecord === undefined || !integer(enemyRecord.id, 1)
      ? undefined
      : { ...normalizedEnemy, id: enemyRecord.id };
  const player = parseV2Player(value.player);
  if (goldenBug === undefined || enemy === undefined || player === undefined) return undefined;
  const expected = spawnGoldenBug(goldenBug.resumeEncounter, player);
  const legacyMaxHealth =
    Math.ceil(10 * legacyAutomaticAttacksPerSecond(player.automaticSpeedLevel)) *
    damageForLevel(player.damageLevel ?? Math.max(0, player.damage - 1)) *
    LEGACY_GOLDEN_BUG_HEALTH_FACTOR;
  const legacyReward = Math.min(
    Number.MAX_SAFE_INTEGER,
    legacyOrdinaryReward(goldenBug.resumeEncounter) * LEGACY_GOLDEN_BUG_REWARD_FACTOR,
  );
  if (
    enemy.id !== expected.id ||
    enemy.health > enemy.maxHealth ||
    (enemy.maxHealth !== expected.maxHealth && enemy.maxHealth !== legacyMaxHealth) ||
    (enemy.reward !== expected.reward && enemy.reward !== legacyReward) ||
    enemy.encounter !== expected.encounter
  )
    return undefined;
  if (!value.automaticUnlocked && player.automaticSpeedLevel !== 0) return undefined;
  if (typeof value.automaticUnlocked !== "boolean" || !integer(value.coins, 0)) return undefined;
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy: {
      ...expected,
      health:
        enemy.maxHealth === expected.maxHealth
          ? enemy.health
          : Math.max(1, Math.ceil((enemy.health / enemy.maxHealth) * expected.maxHealth)),
    },
    goldenBug,
    goldenBugDefeats: 0,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
  };
};
