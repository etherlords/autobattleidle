import type {
  AttackEvent,
  AttackRolls,
  AttackSource,
  CombatEnemy,
  CombatState,
  UpgradeId,
} from "../../domain/combat";
import type { BattleEvent } from "../../domain/snapshot";

export type AutomaticAttackReceipt = {
  readonly count: number;
  readonly units: number;
};

export type BattleCommandContext = {
  attack(source: AttackSource): boolean;
  toggleAutomaticPause(): boolean;
  frame(nowMs: number): boolean;
  purchase(id: UpgradeId, quantity: number): boolean;
  reset(): boolean;
  restore(state: CombatState): boolean;
};

type Command = { readonly execute: (context: BattleCommandContext) => boolean };
export type AttackCommand = Command & { readonly type: "attack"; readonly source: AttackSource };
export type ToggleAutomaticPauseCommand = Command & { readonly type: "toggle-automatic-pause" };
export type FrameCommand = Command & { readonly type: "frame"; readonly nowMs: number };
export type PurchaseCommand = Command & {
  readonly type: "purchase";
  readonly id: UpgradeId;
  readonly quantity: number;
};
export type ResetCommand = Command & { readonly type: "reset" };
export type RestoreCommand = Command & { readonly type: "restore"; readonly state: CombatState };
export type BattleCommand =
  | AttackCommand
  | ToggleAutomaticPauseCommand
  | FrameCommand
  | PurchaseCommand
  | ResetCommand
  | RestoreCommand;

export type BattleUpdate = {
  readonly events: readonly BattleEvent[];
  readonly nowMs: number;
  readonly persistenceChanged: boolean;
  readonly state: CombatState;
  readonly goldenBugRemainingMs: number | null;
  readonly automaticPaused?: boolean;
  readonly automaticRemainingMs?: number;
};

export type BattleControllerEvent =
  | (BattleUpdate & {
      readonly type: "attack";
      readonly outcome: AttackEvent;
      readonly source: AttackSource;
      readonly previousEnemy: CombatEnemy;
      readonly goldenBugBefore: boolean;
    })
  | (BattleUpdate & {
      readonly type: "frame";
      readonly automaticOutcome: AttackEvent | null;
      readonly automaticReceipt?: AutomaticAttackReceipt;
      readonly previousEnemy?: CombatEnemy;
      readonly goldenBugBefore?: boolean;
      readonly goldenBugEscaped?: boolean;
    })
  | (BattleUpdate & { readonly type: "toggle-automatic-pause" })
  | (BattleUpdate & {
      readonly type: "purchase";
      readonly id: UpgradeId;
      readonly reason: string | null;
      readonly quantity: number;
    })
  | (BattleUpdate & { readonly type: "reset" })
  | (BattleUpdate & { readonly type: "restore" });

export type BattleControllerListener = (event: BattleControllerEvent) => void;
export type BattleControllerOptions = {
  readonly createInitialState: () => CombatState;
  readonly initialNowMs: number;
  readonly initialState: CombatState;
  readonly rolls: () => AttackRolls;
};
export type Unsubscribe = () => void;
