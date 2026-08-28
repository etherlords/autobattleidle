import { COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type { AttackCommand, AttackResult, CombatState } from "./contracts";
import {
  armorPenetrationLevelFor,
  criticalLevelFor,
  damageLevelFor,
  doubleRewardLevelFor,
  normalizeLevel,
} from "./player-stats";
import { spawnEnemy } from "./progression";
import {
  armorPenetrationForLevel,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
} from "./upgrades";

export const attack = (state: CombatState, command: AttackCommand): AttackResult => {
  if (
    command.enemyId !== state.enemy.id ||
    (command.source === "automatic" &&
      (!state.automaticUnlocked || command.atMs < state.nextAutomaticAttackAtMs))
  )
    return { event: { type: "ignored" }, state };
  const penetrationLevel = normalizeLevel(armorPenetrationLevelFor(state.player));
  const penetration = armorPenetrationForLevel(penetrationLevel);
  const armor = effectiveArmor(state.enemy.armor, penetrationLevel);
  const critical =
    command.rolls.critical < criticalChanceForLevel(normalizeLevel(criticalLevelFor(state.player)));
  const baseDamage = damageForLevel(normalizeLevel(damageLevelFor(state.player)));
  const damage =
    Math.max(COMBAT_FORMULAS.minimumDamage, baseDamage - armor) *
    (critical ? COMBAT_FORMULAS.criticalDamageMultiplier : 1);
  const armorPreventedDamage =
    Math.max(0, baseDamage - Math.max(COMBAT_FORMULAS.minimumDamage, baseDamage - armor)) *
    (critical ? COMBAT_FORMULAS.criticalDamageMultiplier : 1);
  const health = Math.max(0, state.enemy.health - damage);
  const nextAutomaticAttackAtMs =
    command.source === "automatic"
      ? command.atMs + automaticInterval(state.enemy, state.player)
      : state.nextAutomaticAttackAtMs;
  if (health > 0)
    return {
      event: {
        type: "hit",
        critical,
        damage,
        defeated: false,
        reward: 0,
        armorPreventedDamage,
        penetration,
      },
      state: { ...state, enemy: { ...state.enemy, health }, nextAutomaticAttackAtMs },
    };
  const requestedReward =
    state.enemy.reward *
    (command.rolls.doubleReward <
    doubleRewardChanceForLevel(normalizeLevel(doubleRewardLevelFor(state.player)))
      ? COMBAT_FORMULAS.doubleRewardMultiplier
      : 1);
  const reward = Math.min(requestedReward, Number.MAX_SAFE_INTEGER - state.coins);
  const nextEncounter = state.enemy.encounter === MAX_ENCOUNTER ? 1 : state.enemy.encounter + 1;
  return {
    event: {
      type: "hit",
      critical,
      damage,
      defeated: true,
      reward,
      armorPreventedDamage,
      penetration,
    },
    state: {
      ...state,
      coins: state.coins + reward,
      enemy: spawnEnemy(nextEncounter, command.rolls.nextEliteModifier),
      nextAutomaticAttackAtMs,
    },
  };
};
