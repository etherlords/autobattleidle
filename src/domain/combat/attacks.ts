import { COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type { AttackCommand, AttackResult, CombatState } from "./contracts";
import { spawnEnemy } from "./progression";
import {
  armorPenetrationForLevel,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
} from "./upgrades";

const damageLevel = (state: CombatState): number =>
  state.player.damageLevel ?? Math.max(0, state.player.damage - 1);
const criticalLevel = (state: CombatState): number =>
  state.player.criticalLevel ?? Math.round(state.player.criticalChance * 10);
const doubleRewardLevel = (state: CombatState): number =>
  state.player.doubleRewardLevel ?? Math.round(state.player.doubleRewardChance * 10);
const penetrationLevel = (state: CombatState): number => state.player.armorPenetrationLevel ?? 0;

export const attack = (state: CombatState, command: AttackCommand): AttackResult => {
  if (
    command.enemyId !== state.enemy.id ||
    (command.source === "automatic" &&
      (!state.automaticUnlocked || command.atMs < state.nextAutomaticAttackAtMs))
  )
    return { event: { type: "ignored" }, state };
  const penetration = armorPenetrationForLevel(penetrationLevel(state));
  const armor = effectiveArmor(state.enemy.armor, penetrationLevel(state));
  const critical = command.rolls.critical < criticalChanceForLevel(criticalLevel(state));
  const baseDamage = damageForLevel(damageLevel(state));
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
    (command.rolls.doubleReward < doubleRewardChanceForLevel(doubleRewardLevel(state))
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
