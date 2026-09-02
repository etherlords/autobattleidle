import {
  armorPenetrationForLevel,
  automaticAttacksPerSecond,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
  selectEnemyFamilyIdentity,
  type EnemyAffinity,
  type EnemyFamily,
} from "./combat";
import { COMBAT_BALANCE } from "./combat/balance";
import type { CombatState, EliteModifier, EnemyGrade, UpgradeId } from "./combat/contracts";

export type BattleAttackSource = "automatic" | "manual";
export type BattleAttackMetadata = {
  readonly kind: "critical" | "hit";
  readonly source: BattleAttackSource;
  readonly packets: { readonly count: number; readonly units: number };
  readonly damage: number;
  readonly defeated: boolean;
};
export type BattleEvent = {
  readonly id: number;
  readonly message: string;
  readonly attack?: BattleAttackMetadata;
};
export type BattleAttackVisualCue = {
  readonly kind: "armor" | "critical" | "hit";
  readonly packets: { readonly count: number; readonly units: number };
  readonly source: "automatic" | "manual";
};
export type BattleVisualCue =
  BattleAttackVisualCue | "boss" | "coin" | "death" | "golden-escape" | "golden-kill" | "spawn";
export type UpgradeSnapshot = {
  readonly cost: number;
  readonly disabledReason: string | null;
  readonly effect: { readonly exact: string; readonly text: string } | null;
  readonly id: UpgradeId;
  readonly label: string;
  readonly level: number;
};
export type BattleEnemySnapshot = {
  readonly armor: { readonly effective: number; readonly raw: number };
  readonly family?: EnemyFamily;
  readonly affinity?: EnemyAffinity;
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
      armor: {
        effective: effectiveArmor(state.enemy.armor, state.player.armorPenetrationLevel ?? 0),
        raw: state.enemy.armor,
      },
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
      affinity: identity.affinity,
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
