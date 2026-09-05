import type { UpgradeId, UpgradePurchaseQuantity } from "../../domain/combat";

export type HudIntent =
  | { readonly type: "attack" }
  | { readonly type: "toggle-automatic-pause" }
  | { readonly type: "rotate-camera"; readonly delta: number }
  | { readonly type: "upgrade"; readonly id: UpgradeId; readonly quantity: UpgradePurchaseQuantity }
  | { readonly type: "reset" }
  | { readonly type: "restore" };

export type HudIntentListener = (intent: HudIntent) => void;
export type HudUnsubscribe = () => void;
