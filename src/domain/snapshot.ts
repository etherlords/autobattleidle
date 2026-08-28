import { automaticInterval, type CombatState, type UpgradeId } from "./combat";

export type BattleEvent = { readonly id: number; readonly message: string };
export type BattleSnapshot = {
  readonly automatic: {
    readonly intervalMs: number;
    readonly remainingMs: number;
    readonly unlocked: boolean;
  };
  readonly coins: number;
  readonly encounter: string;
  readonly enemy: {
    readonly grade: string;
    readonly health: number;
    readonly level: number;
    readonly maxHealth: number;
    readonly modifier: string | null;
    readonly name: string;
  };
  readonly events: readonly BattleEvent[];
  readonly upgrades: readonly {
    readonly cost: number;
    readonly disabledReason: string | null;
    readonly id: UpgradeId;
    readonly label: string;
    readonly level: number;
  }[];
};

const enemyName = (grade: string): string =>
  `${grade[0]?.toUpperCase() ?? "E"}${grade.slice(1)} Ash Wisp`;

export const createBattleSnapshot = (
  state: CombatState,
  nowMs: number,
  events: readonly BattleEvent[],
  upgrades: BattleSnapshot["upgrades"],
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
