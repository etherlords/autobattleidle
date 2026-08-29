import {
  armorPenetrationForLevel,
  automaticAttacksPerSecond,
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
} from "./combat";
import { COMBAT_BALANCE } from "./combat/balance";
import type { CombatState, EliteModifier, EnemyGrade, UpgradeId } from "./combat/contracts";

export type BattleEvent = { readonly id: number; readonly message: string };
export type UpgradeSnapshot = {
  readonly cost: number;
  readonly disabledReason: string | null;
  readonly id: UpgradeId;
  readonly label: string;
  readonly level: number;
};
export type BattleEnemySnapshot = {
  readonly grade: EnemyGrade;
  readonly health: number;
  readonly level: number;
  readonly maxHealth: number;
  readonly modifier: EliteModifier | null;
  readonly name: string;
  readonly goldenBug?: boolean;
};
export type BattleSnapshot = {
  readonly automatic: {
    readonly intervalMs: number;
    readonly remainingMs: number;
    readonly unlocked: boolean;
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
  readonly upgrades: readonly UpgradeSnapshot[];
};

const enemyName = (grade: EnemyGrade): string =>
  `${grade[0]?.toUpperCase() ?? "E"}${grade.slice(1)} Ash Wisp`;

export const createBattleSnapshot = (
  state: CombatState,
  nowMs: number,
  events: readonly BattleEvent[],
  upgrades: readonly UpgradeSnapshot[],
  goldenBugRemainingMs: number | null = null,
): BattleSnapshot => ({
  automatic: {
    intervalMs: automaticInterval(state.enemy, state.player),
    remainingMs: state.automaticUnlocked ? Math.max(0, state.nextAutomaticAttackAtMs - nowMs) : 0,
    unlocked: state.automaticUnlocked,
  },
  coins: state.coins,
  encounter: "Scout the Emberfields",
  enemy: {
    grade: state.enemy.grade,
    health: state.enemy.health,
    level: state.enemy.encounter,
    maxHealth: state.enemy.maxHealth,
    modifier: state.enemy.modifier,
    name: enemyName(state.enemy.grade),
    goldenBug: state.goldenBug !== null,
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
  upgrades,
});
