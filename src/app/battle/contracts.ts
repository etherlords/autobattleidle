import type {
  AttackEvent,
  AttackRolls,
  AttackSource,
  CombatState,
  UpgradeId,
} from "../../domain/combat";
import type { BattleEvent } from "../../domain/snapshot";

export type BattleCommandContext = {
  attack(source: AttackSource): boolean;
  frame(nowMs: number): boolean;
  purchase(id: UpgradeId): boolean;
  reset(): boolean;
  restore(state: CombatState): boolean;
};

type Command = { readonly execute: (context: BattleCommandContext) => boolean };
export type AttackCommand = Command & { readonly type: "attack"; readonly source: AttackSource };
export type FrameCommand = Command & { readonly type: "frame"; readonly nowMs: number };
export type PurchaseCommand = Command & { readonly type: "purchase"; readonly id: UpgradeId };
export type ResetCommand = Command & { readonly type: "reset" };
export type RestoreCommand = Command & { readonly type: "restore"; readonly state: CombatState };
export type BattleCommand =
  AttackCommand | FrameCommand | PurchaseCommand | ResetCommand | RestoreCommand;

export type BattleUpdate = {
  readonly events: readonly BattleEvent[];
  readonly nowMs: number;
  readonly persistenceChanged: boolean;
  readonly state: CombatState;
};

export type BattleControllerEvent =
  | (BattleUpdate & {
      readonly type: "attack";
      readonly outcome: AttackEvent;
      readonly source: AttackSource;
    })
  | (BattleUpdate & { readonly type: "frame"; readonly automaticOutcome: AttackEvent | null })
  | (BattleUpdate & {
      readonly type: "purchase";
      readonly id: UpgradeId;
      readonly reason: string | null;
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
