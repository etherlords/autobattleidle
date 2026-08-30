import { automaticInterval, spawnEnemy, spawnGoldenBug } from "../../domain/combat";
import type { CombatState } from "../../domain/combat";
import { SAVE_VERSION } from "./contracts";
import { decodeV2 } from "./validation-v2";
import { hasExactKeys, integer, isRecord, parseEnemyShape } from "./validation-primitives";
import { parseV2Player } from "./validation-v2";

const LEGACY_GOLDEN_BUG_REWARD_FACTOR = 10;

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
    value.version !== SAVE_VERSION
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
  const legacyReward = Math.min(
    Number.MAX_SAFE_INTEGER,
    spawnEnemy(goldenBug.resumeEncounter, 0).reward * LEGACY_GOLDEN_BUG_REWARD_FACTOR,
  );
  if (
    enemy.id !== expected.id ||
    enemy.health > expected.maxHealth ||
    enemy.maxHealth !== expected.maxHealth ||
    (enemy.reward !== expected.reward && enemy.reward !== legacyReward) ||
    enemy.encounter !== expected.encounter
  )
    return undefined;
  if (!value.automaticUnlocked && player.automaticSpeedLevel !== 0) return undefined;
  if (typeof value.automaticUnlocked !== "boolean" || !integer(value.coins, 0)) return undefined;
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy: { ...enemy, reward: expected.reward },
    goldenBug,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
  };
};
