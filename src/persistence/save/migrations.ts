import type { CombatPlayer, CombatState } from "../../domain/combat";
import {
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  spawnEnemy,
} from "../../domain/combat";
import type { SaveV1 } from "./contracts";
import { encodeSave } from "./codecs";
import { decodeV2, decodeV3, modifierRoll, parseV1 } from "./validation";

export const migrateV1 = (source: SaveV1, nowMs: number): CombatState => {
  const player = {
    automaticSpeedLevel: source.player.automaticSpeedLevel,
    armorPenetrationLevel: 0,
    criticalLevel: source.player.criticalChance * 10,
    damageLevel: source.player.damage - 1,
    doubleRewardLevel: source.player.doubleRewardChance * 10,
  };
  const normalizedPlayer: Required<CombatPlayer> = {
    ...player,
    criticalChance: criticalChanceForLevel(player.criticalLevel),
    damage: damageForLevel(player.damageLevel),
    doubleRewardChance: doubleRewardChanceForLevel(player.doubleRewardLevel),
  };
  const spawned = spawnEnemy(source.enemy.encounter, modifierRoll(source.enemy.modifier));
  const enemy = {
    ...spawned,
    health: Math.max(
      1,
      Math.ceil((source.enemy.health / source.enemy.maxHealth) * spawned.maxHealth),
    ),
  };
  return {
    automaticUnlocked: source.automaticUnlocked,
    coins: source.coins,
    enemy,
    goldenBug: null,
    nextAutomaticAttackAtMs: source.automaticUnlocked
      ? nowMs + automaticInterval(enemy, normalizedPlayer)
      : 0,
    player: normalizedPlayer,
  };
};
export const decodeLegacySave = (value: unknown, nowMs: number): CombatState | undefined => {
  const v1 = parseV1(value);
  const current = decodeV3(value, nowMs) ?? decodeV2(value, nowMs);
  if (current !== undefined) return current;
  if (v1 !== undefined) return migrateV1(v1, nowMs);
  return undefined;
};
export const isPublicationValid = (state: CombatState, nowMs: number): boolean =>
  decodeV3(JSON.parse(encodeSave(state)) as unknown, nowMs) !== undefined;
