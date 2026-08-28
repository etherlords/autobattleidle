import type { UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import { BattleStatus } from "./hud/battle-status";
import { EventLog } from "./hud/event-log";
import { UpgradeDialog } from "./hud/upgrade-dialog";

export type Hud = {
  render(snapshot: BattleSnapshot): void;
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
  let attackListener: (() => void) | undefined;
  const attack = (): void => attackListener?.();
  const pointerAttack = (): void => attack();
  const keyboardAttack = (event: KeyboardEvent): void => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    attack();
  };
  battlefield.addEventListener("pointerup", pointerAttack);
  battlefield.addEventListener("keydown", keyboardAttack);

  return {
    render: (snapshot) => {
      status.render(snapshot);
      dialog.render(snapshot);
      log.render(snapshot.events);
    },
    onAttack: (listener) => {
      attackListener = listener;
    },
    onUpgrade: (listener) => dialog.onUpgrade(listener),
    onReset: (listener) => dialog.onReset(listener),
    onRestore: (listener) => dialog.onRestore(listener),
    setRestoreAvailable: (available) => dialog.setRestoreAvailable(available),
    reportPersistence: (message) => dialog.reportPersistence(message),
    dispose: () => {
      battlefield.removeEventListener("pointerup", pointerAttack);
      battlefield.removeEventListener("keydown", keyboardAttack);
      dialog.dispose();
      panel.remove();
    },
  };
};
