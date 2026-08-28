import type {
  AttackEvent,
  AttackRolls,
  AttackSource,
  CombatState,
  UpgradeId,
} from "../../domain/combat";
import type { BattleEvent } from "../../domain/snapshot";

export type BattleCommand =
  | { readonly type: "attack"; readonly source: AttackSource }
  | { readonly type: "frame"; readonly nowMs: number }
  | { readonly type: "purchase"; readonly id: UpgradeId }
  | { readonly type: "reset" }
  | { readonly type: "restore"; readonly state: CombatState };

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
