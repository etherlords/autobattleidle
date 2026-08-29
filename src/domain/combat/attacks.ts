import { COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type { AttackCommand, AttackResult, CombatState } from "./contracts";
import {
  armorPenetrationLevelFor,
  criticalLevelFor,
  damageLevelFor,
  doubleRewardLevelFor,
  normalizeLevel,
} from "./player-stats";
import { spawnEnemy, spawnGoldenBug } from "./progression";
import { COMBAT_BALANCE } from "./balance";
import { ENEMY_MODIFIERS } from "./enemy-modifiers";

const modifierFor = (state: CombatState) =>
  state.enemy.modifier === null ? undefined : ENEMY_MODIFIERS[state.enemy.modifier];

const resolvesCritical = (state: CombatState, command: AttackCommand): boolean => {
  const modifier = modifierFor(state);
  return (
    modifier?.allowsCritical(command.source) !== false &&
    command.rolls.critical < criticalChanceForLevel(normalizeLevel(criticalLevelFor(state.player)))
  );
};

const resolvedDamage = (
  state: CombatState,
  command: AttackCommand,
  armor: number,
  critical: boolean,
): number => {
  const baseDamage = damageForLevel(normalizeLevel(damageLevelFor(state.player)));
  const unguardedDamage =
    Math.max(COMBAT_FORMULAS.minimumDamage, baseDamage - armor) *
    (critical ? COMBAT_FORMULAS.criticalDamageMultiplier : 1);
  return Math.max(
    COMBAT_FORMULAS.minimumDamage,
    Math.floor(unguardedDamage * (modifierFor(state)?.damageMultiplier(command.source) ?? 1)),
  );
};
import {
  armorPenetrationForLevel,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
} from "./upgrades";

// eslint-disable-next-line complexity -- defeat resolves ordinary and timed-event transitions together.
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
  const critical = resolvesCritical(state, command);
  const baseDamage = damageForLevel(normalizeLevel(damageLevelFor(state.player)));
  const damage = resolvedDamage(state, command, armor, critical);
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
    state.goldenBug === null
      ? state.enemy.reward *
        (command.rolls.doubleReward <
        doubleRewardChanceForLevel(normalizeLevel(doubleRewardLevelFor(state.player)))
          ? COMBAT_FORMULAS.doubleRewardMultiplier
          : 1)
      : state.enemy.reward;
  const reward = Math.min(requestedReward, Number.MAX_SAFE_INTEGER - state.coins);
  const nextEncounter = state.enemy.encounter === MAX_ENCOUNTER ? 1 : state.enemy.encounter + 1;
  const resumeEncounter = state.goldenBug?.resumeEncounter;
  const goldenBug =
    state.goldenBug === null &&
    state.enemy.encounter % COMBAT_BALANCE.goldenBugEncounterInterval === 0
      ? { id: state.enemy.id, resumeEncounter: nextEncounter }
      : null;
  const nextEnemy = (): typeof state.enemy => {
    if (resumeEncounter !== undefined)
      return spawnEnemy(resumeEncounter, command.rolls.nextEliteModifier);
    if (goldenBug !== null) return spawnGoldenBug(goldenBug.resumeEncounter, state.player);
    return spawnEnemy(nextEncounter, command.rolls.nextEliteModifier);
  };
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
      enemy: nextEnemy(),
      goldenBug,
      nextAutomaticAttackAtMs,
    },
  };
};
