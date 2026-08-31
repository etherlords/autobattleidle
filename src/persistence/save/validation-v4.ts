import type { CombatState } from "../../domain/combat";
import { decodeV3 } from "./validation-v3";
import { hasExactKeys, integer, isRecord } from "./validation-primitives";

export const decodeV4 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (
    !isRecord(value) ||
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
    !integer(value.goldenBugDefeats, 0)
  )
    return undefined;
  const { goldenBugDefeats, ...v3 } = value;
  const state = decodeV3({ ...v3, version: 3 }, nowMs);
  return state === undefined ? undefined : { ...state, goldenBugDefeats };
};
