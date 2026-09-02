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
import { ENEMY_AFFINITIES } from "./enemy-affinities";
import { selectEnemyFamilyIdentity } from "./family-identity";
import { COMBAT_BALANCE } from "./balance";
import { ENEMY_MODIFIERS } from "./enemy-modifiers";

const modifierFor = (state: CombatState) =>
  state.enemy.modifier === null ? undefined : ENEMY_MODIFIERS[state.enemy.modifier];

const resolvesCritical = (state: CombatState, command: AttackCommand): boolean => {
  const modifier = modifierFor(state);
  return (
    modifier?.allowsCritical(command.source) !== false &&
    command.rolls.critical <
      criticalChanceForPolicy(
        normalizeLevel(criticalLevelFor(state.player)),
        command.criticalChancePolicy,
      )
  );
};

const resolvedDamage = (
  state: CombatState,
  command: AttackCommand,
  armor: number,
  critical: boolean,
): number => {
  const damageMultiplier = command.damageMultiplier ?? 1;
  if (!Number.isFinite(damageMultiplier) || damageMultiplier <= 0)
    throw new RangeError("Damage multiplier must be finite and positive");
  const baseDamage = damageForLevel(normalizeLevel(damageLevelFor(state.player)));
  const unguardedDamage =
    Math.max(COMBAT_FORMULAS.minimumDamage, baseDamage - armor) *
    (critical ? COMBAT_FORMULAS.criticalDamageMultiplier : 1);
  return Math.round(
    Math.max(
      COMBAT_FORMULAS.minimumDamage,
      Math.floor(unguardedDamage * (modifierFor(state)?.damageMultiplier(command.source) ?? 1)),
    ) * damageMultiplier,
  );
};
import {
  armorPenetrationForPolicy,
  automaticInterval,
  criticalChanceForPolicy,
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
  const penetration = armorPenetrationForPolicy(penetrationLevel, command.armorPenetrationPolicy);
  const armor = effectiveArmor(state.enemy.armor, penetrationLevel, command.armorPenetrationPolicy);
  const critical = resolvesCritical(state, command);
  const baseDamage = damageForLevel(normalizeLevel(damageLevelFor(state.player)));
  const damage = resolvedDamage(state, command, armor, critical);
  const armorPreventedDamage = Math.round(
    Math.max(0, baseDamage - Math.max(COMBAT_FORMULAS.minimumDamage, baseDamage - armor)) *
      (critical ? COMBAT_FORMULAS.criticalDamageMultiplier : 1) *
      (command.damageMultiplier ?? 1),
  );
  const health = Math.max(0, state.enemy.health - damage);
  const nextAutomaticAttackAtMs = (() => {
    if (command.source !== "automatic") return state.nextAutomaticAttackAtMs;
    if (command.automaticBatch) return command.atMs;
    return command.atMs + automaticInterval(state.enemy, state.player);
  })();
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
  const identity = selectEnemyFamilyIdentity({
    goldenBug: state.goldenBug !== null,
    grade: state.enemy.grade,
    level: state.enemy.encounter,
    modifier: state.enemy.modifier,
  });
  const requestedReward =
    state.enemy.reward *
    (command.rolls.doubleReward <
    doubleRewardChanceForLevel(normalizeLevel(doubleRewardLevelFor(state.player)))
      ? COMBAT_FORMULAS.doubleRewardMultiplier
      : 1) *
    // Golden Bug keeps its legacy 50x payout path; affinity scales every other defeat.
    (state.goldenBug !== null ? 1 : ENEMY_AFFINITIES[identity.affinity].rewardMultiplier);
  const reward = Math.min(
    Math.max(COMBAT_FORMULAS.minimumDamage, Math.round(requestedReward)),
    Number.MAX_SAFE_INTEGER - state.coins,
  );
  const nextEncounter = state.enemy.encounter === MAX_ENCOUNTER ? 1 : state.enemy.encounter + 1;
  const resumeEncounter = state.goldenBug?.resumeEncounter;
  const goldenBugDefeats =
    resumeEncounter === undefined
      ? state.goldenBugDefeats
      : Math.min(Number.MAX_SAFE_INTEGER, state.goldenBugDefeats + 1);
  const goldenBug =
    state.goldenBug === null &&
    state.enemy.encounter % COMBAT_BALANCE.goldenBugEncounterInterval === 0
      ? { id: state.enemy.id, resumeEncounter: nextEncounter }
      : null;
  const nextEnemy = (): typeof state.enemy => {
    if (resumeEncounter !== undefined)
      return spawnEnemy(
        resumeEncounter,
        command.rolls.nextEliteModifier,
        command.ordinaryHealthGrowthRate,
        state.player,
        command.bossInterval,
      );
    if (goldenBug !== null) return spawnGoldenBug(goldenBug.resumeEncounter, state.player);
    return spawnEnemy(
      nextEncounter,
      command.rolls.nextEliteModifier,
      command.ordinaryHealthGrowthRate,
      state.player,
      command.bossInterval,
    );
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
      goldenBugDefeats,
      nextAutomaticAttackAtMs,
    },
  };
};
