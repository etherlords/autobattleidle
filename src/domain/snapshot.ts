import {
  armorPenetrationForLevel,
  automaticAttacksPerSecond,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  selectEnemyFamilyIdentity,
  type EnemyFamily,
} from "./combat";
import { COMBAT_BALANCE } from "./combat/balance";
import type { CombatState, EliteModifier, EnemyGrade, UpgradeId } from "./combat/contracts";

export type BattleEvent = { readonly id: number; readonly message: string };
export type BattleVisualCue =
  "armor" | "boss" | "coin" | "critical" | "death" | "golden-escape" | "golden-kill" | "hit";
export type UpgradeSnapshot = {
  readonly cost: number;
  readonly disabledReason: string | null;
  readonly id: UpgradeId;
  readonly label: string;
  readonly level: number;
};
export type BattleEnemySnapshot = {
  readonly family?: EnemyFamily;
  readonly grade: EnemyGrade;
  readonly health: number;
  readonly level: number;
  readonly maxHealth: number;
  readonly modifier: EliteModifier | null;
  readonly name: string;
  readonly goldenBug?: boolean;
  readonly seed?: number;
  readonly variant?: 0 | 1 | 2;
};
export type BattleSnapshot = {
  readonly automatic: {
    readonly intervalMs: number;
    readonly remainingMs: number;
    readonly unlocked: boolean;
    readonly paused?: boolean;
  };
  readonly coins: number;
  readonly encounter: string;
  readonly enemy: BattleEnemySnapshot;
  readonly goldenBug?: { readonly remainingMs: number } | null;
  readonly playerStats: {
    readonly armorPenetration: number;
    readonly automaticAttacksPerSecond: number;
    readonly criticalChance: number;
    readonly damage: number;
    readonly doubleRewardChance: number;
  };
  readonly events: readonly BattleEvent[];
  readonly visualCues?: readonly BattleVisualCue[];
  readonly upgrades: readonly UpgradeSnapshot[];
};

const remainingAutomaticMs = (
  state: CombatState,
  nowMs: number,
  override: number | undefined,
): number =>
  override ?? (state.automaticUnlocked ? Math.max(0, state.nextAutomaticAttackAtMs - nowMs) : 0);

export const createBattleSnapshot = (
  state: CombatState,
  nowMs: number,
  events: readonly BattleEvent[],
  upgrades: readonly UpgradeSnapshot[],
  goldenBugRemainingMs: number | null = null,
  visualCues: readonly BattleVisualCue[] = [],
  automaticPaused = false,
  automaticRemainingMs?: number,
): BattleSnapshot => {
  const identity = selectEnemyFamilyIdentity({
    goldenBug: state.goldenBug !== null,
    grade: state.enemy.grade,
    level: state.enemy.encounter,
    modifier: state.enemy.modifier,
  });
  return {
    automatic: {
      intervalMs: automaticInterval(state.enemy, state.player),
      remainingMs: remainingAutomaticMs(state, nowMs, automaticRemainingMs),
      paused: automaticPaused,
      unlocked: state.automaticUnlocked,
    },
    coins: state.coins,
    encounter: "Scout the Emberfields",
    enemy: {
      family: identity.family,
      goldenBug: state.goldenBug !== null,
      grade: state.enemy.grade,
      health: state.enemy.health,
      level: state.enemy.encounter,
      maxHealth: state.enemy.maxHealth,
      modifier: state.enemy.modifier,
      name: identity.label,
      seed: identity.seed,
      variant: identity.variant,
    },
    goldenBug:
      state.goldenBug === null
        ? null
        : {
            remainingMs: Math.min(
              COMBAT_BALANCE.goldenBugWindowMs,
              goldenBugRemainingMs ?? COMBAT_BALANCE.goldenBugWindowMs,
            ),
          },
    playerStats: {
      armorPenetration: armorPenetrationForLevel(state.player.armorPenetrationLevel ?? 0),
      automaticAttacksPerSecond: automaticAttacksPerSecond(state.player.automaticSpeedLevel ?? 0),
      criticalChance: criticalChanceForLevel(state.player.criticalLevel ?? 0),
      damage: damageForLevel(state.player.damageLevel ?? 0),
      doubleRewardChance: doubleRewardChanceForLevel(state.player.doubleRewardLevel ?? 0),
    },
    events,
    visualCues,
    upgrades,
  };
};
