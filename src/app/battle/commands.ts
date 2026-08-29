import type {
  AttackCommand,
  FrameCommand,
  PurchaseCommand,
  ResetCommand,
  RestoreCommand,
} from "./contracts";
import type { AttackSource, CombatState, UpgradeId } from "../../domain/combat";

export const battleCommands = {
  attack: (source: AttackSource): AttackCommand => ({
    execute: (context) => context.attack(source),
    source,
    type: "attack",
  }),
  frame: (nowMs: number): FrameCommand => ({
    execute: (context) => context.frame(nowMs),
    nowMs,
    type: "frame",
  }),
  purchase: (id: UpgradeId, quantity = 1): PurchaseCommand => ({
    execute: (context) => context.purchase(id, quantity),
    id,
    quantity,
    type: "purchase",
  }),
  reset: (): ResetCommand => ({ execute: (context) => context.reset(), type: "reset" }),
  restore: (state: CombatState): RestoreCommand => ({
    execute: (context) => context.restore(state),
    state,
    type: "restore",
  }),
} as const;
