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
  purchase: (id: UpgradeId): PurchaseCommand => ({
    execute: (context) => context.purchase(id),
    id,
    type: "purchase",
  }),
  reset: (): ResetCommand => ({ execute: (context) => context.reset(), type: "reset" }),
  restore: (state: CombatState): RestoreCommand => ({
    execute: (context) => context.restore(state),
    state,
    type: "restore",
  }),
} as const;
