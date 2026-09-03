import type { CombatState } from "../../domain/combat";
import { automaticInterval } from "../../domain/combat";
import { decodeV3 } from "./validation-v3";
import { parseV2Player } from "./validation-v2";
import { hasExactKeys, integer, isRecord, parseEnemyShape } from "./validation-primitives";

const parseHistoricalEnemy = (value: unknown) => {
  if (!isRecord(value) || !integer(value.id, 1)) return undefined;
  const parsed = parseEnemyShape({ ...value, id: value.encounter });
  return parsed === undefined ? undefined : { ...parsed, id: value.id };
};

const parseGoldenBug = (
  value: unknown,
): { readonly id: number; readonly resumeEncounter: number } | null | undefined => {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "resumeEncounter"]) ||
    !integer(value.id, 1) ||
    !integer(value.resumeEncounter, 1)
  )
    return undefined;
  return { id: value.id, resumeEncounter: value.resumeEncounter };
};

/* eslint-disable complexity -- V4 boundary validation checks every persisted field. */
const decodeHistoricalV4 = (
  value: Record<string, unknown>,
  nowMs: number,
): CombatState | undefined => {
  if (
    !hasExactKeys(value, [
      "automaticUnlocked",
      "coins",
      "enemy",
      "goldenBug",
      "goldenBugDefeats",
      "player",
      "version",
    ]) ||
    value.version !== 4 ||
    typeof value.automaticUnlocked !== "boolean" ||
    !integer(value.coins, 0) ||
    !integer(value.goldenBugDefeats, 0)
  )
    return undefined;
  const enemy = parseHistoricalEnemy(value.enemy);
  const player = parseV2Player(value.player);
  const goldenBug = parseGoldenBug(value.goldenBug);
  if (enemy === undefined || player === undefined || goldenBug === undefined) return undefined;
  if (!value.automaticUnlocked && player.automaticSpeedLevel !== 0) return undefined;
  if (enemy.encounter === 1 && enemy.grade !== "normal") return undefined;
  if (
    goldenBug !== null &&
    (enemy.grade !== "normal" ||
      enemy.modifier !== null ||
      enemy.encounter !== goldenBug.resumeEncounter)
  )
    return undefined;
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy,
    goldenBug,
    goldenBugDefeats: value.goldenBugDefeats,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
  };
};
/* eslint-enable complexity */

export const decodeV4 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (!isRecord(value) || value.version !== 4) return undefined;
  const { goldenBugDefeats: ignoredGoldenBugDefeats, ...v3 } = value;
  void ignoredGoldenBugDefeats;
  const migrated = decodeV3({ ...v3, version: 3 }, nowMs);
  return migrated === undefined
    ? decodeHistoricalV4(value, nowMs)
    : { ...migrated, goldenBugDefeats: value.goldenBugDefeats as number };
};
