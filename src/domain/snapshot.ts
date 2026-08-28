import { automaticInterval } from "./combat";
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
  },
  events,
  upgrades,
});
