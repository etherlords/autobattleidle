import type { UpgradeId } from "../../domain/combat";

export type HudIntent =
  | { readonly type: "attack" }
  | { readonly type: "rotate-camera"; readonly delta: number }
  | { readonly type: "upgrade"; readonly id: UpgradeId }
  | { readonly type: "reset" }
  | { readonly type: "restore" };

export type HudIntentListener = (intent: HudIntent) => void;
export type HudUnsubscribe = () => void;
