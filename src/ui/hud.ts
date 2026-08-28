import type { UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import { BattleStatus } from "./hud/battle-status";
import { EventLog } from "./hud/event-log";
import { UpgradeDialog } from "./hud/upgrade-dialog";
import type { HudIntent, HudIntentListener, HudUnsubscribe } from "./hud/intents";

export type Hud = {
  render(snapshot: BattleSnapshot): void;
  subscribe(listener: HudIntentListener): HudUnsubscribe;
  onAttack(listener: () => void): void;
  onUpgrade(listener: (id: UpgradeId) => void): void;
  onReset(listener: () => void): void;
  onRestore(listener: () => void): void;
  setRestoreAvailable(available: boolean): void;
  reportPersistence(message: string): void;
  dispose(): void;
};

export const createHud = (host: HTMLElement, battlefield: HTMLElement): Hud => {
  const panel = document.createElement("section");
  panel.className = "hud";
  panel.setAttribute("aria-label", "Battle status");
  const status = new BattleStatus();
  const dialog = new UpgradeDialog();
  const log = new EventLog();
  panel.append(status.element, dialog.launcher, dialog.modal, log.element);
  host.append(panel);

  battlefield.tabIndex = 0;
  battlefield.setAttribute("aria-label", "Battlefield. Press Enter or Space to attack.");
  let disposed = false;
  const listeners = new Set<HudIntentListener>();
  const emit = (intent: HudIntent): void => {
    for (const listener of [...listeners]) listener(intent);
  };
  const attack = (): void => emit({ type: "attack" });
  const pointerAttack = (): void => attack();
  const keyboardAttack = (event: KeyboardEvent): void => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    attack();
  };
  battlefield.addEventListener("pointerup", pointerAttack);
  battlefield.addEventListener("keydown", keyboardAttack);
  dialog.onUpgrade((id) => emit({ id, type: "upgrade" }));
  dialog.onReset(() => emit({ type: "reset" }));
  dialog.onRestore(() => emit({ type: "restore" }));

  const subscribe = (listener: HudIntentListener): HudUnsubscribe => {
    if (disposed) return () => undefined;
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    render: (snapshot) => {
      status.render(snapshot);
      dialog.render(snapshot);
      log.render(snapshot.events);
    },
    subscribe,
    onAttack: (listener) =>
      subscribe((intent) => {
        if (intent.type === "attack") listener();
      }),
    onUpgrade: (listener) =>
      subscribe((intent) => {
        if (intent.type === "upgrade") listener(intent.id);
      }),
    onReset: (listener) =>
      subscribe((intent) => {
        if (intent.type === "reset") listener();
      }),
    onRestore: (listener) =>
      subscribe((intent) => {
        if (intent.type === "restore") listener();
      }),
    setRestoreAvailable: (available) => dialog.setRestoreAvailable(available),
    reportPersistence: (message) => dialog.reportPersistence(message),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      battlefield.removeEventListener("pointerup", pointerAttack);
      battlefield.removeEventListener("keydown", keyboardAttack);
      dialog.dispose();
      panel.remove();
    },
  };
};
