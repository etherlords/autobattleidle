import type { UpgradeId } from "../../domain/combat";
import type { BattleSnapshot } from "../../domain/snapshot";
import { button, makeText } from "./elements";
import { formatNumber } from "../number-format";

const upgradeQuantity = (event: MouseEvent): 1 | 10 | 100 => {
  if (event.detail === 0) return 1;
  if (event.ctrlKey) return 100;
  if (event.shiftKey) return 10;
  return 1;
};

export class UpgradeDialog {
  readonly launcher = button("upgrades-launcher", "Upgrades");
  readonly modal = document.createElement("section");
  private readonly dialog = document.createElement("section");
  private readonly close = button("upgrades-close", "Close upgrades");
  private readonly coins = makeText("p", "");
  private readonly currentStats = makeText("p", "");
  private readonly bulkHint = makeText("p", "Shift-click buys x10. Ctrl-click buys x100.");
  private readonly upgrades = document.createElement("div");
  private readonly resetButton = button("reset-progress", "Reset progress");
  private readonly restoreButton = button("restore-progress", "Restore from previous version");
  private readonly persistenceStatus = makeText("p", "");
  private readonly upgradeButtons = new Map<
    UpgradeId,
    {
      readonly button: HTMLButtonElement;
      readonly listener: (event: MouseEvent) => void;
      readonly price: HTMLSpanElement;
      readonly title: HTMLSpanElement;
    }
  >();
  private upgradeListener: ((id: UpgradeId, quantity: 1 | 10 | 100) => void) | undefined;
  private resetListener: (() => void) | undefined;
  private restoreListener: (() => void) | undefined;

  constructor() {
    this.launcher.setAttribute("aria-haspopup", "dialog");
    this.modal.className = "upgrades-modal";
    this.modal.hidden = true;
    this.dialog.className = "upgrades-dialog";
    this.dialog.setAttribute("aria-label", "Upgrades and saved progress");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("role", "dialog");
    this.coins.className = "upgrades-coins";
    this.currentStats.className = "current-upgrade-stats";
    this.currentStats.setAttribute("aria-label", "Current upgrade stats");
    this.bulkHint.className = "upgrade-bulk-hint";
    this.upgrades.className = "upgrades";
    this.restoreButton.hidden = true;
    this.persistenceStatus.className = "persistence-status";
    this.persistenceStatus.setAttribute("aria-live", "polite");
    this.dialog.append(
      this.close,
      this.coins,
      this.currentStats,
      this.bulkHint,
      this.upgrades,
      this.resetButton,
      this.restoreButton,
      this.persistenceStatus,
    );
    this.modal.append(this.dialog);
    this.launcher.addEventListener("click", this.open);
    this.close.addEventListener("click", this.closeFromButton);
    this.modal.addEventListener("pointerup", this.closeFromBackdrop);
    this.resetButton.addEventListener("click", this.reset);
    this.restoreButton.addEventListener("click", this.restore);
  }

  onUpgrade(listener: (id: UpgradeId, quantity: 1 | 10 | 100) => void): void {
    this.upgradeListener = listener;
  }
  onReset(listener: () => void): void {
    this.resetListener = listener;
  }
  onRestore(listener: () => void): void {
    this.restoreListener = listener;
  }
  setRestoreAvailable(available: boolean): void {
    this.restoreButton.hidden = !available;
  }
  reportPersistence(message: string): void {
    this.persistenceStatus.textContent = message;
  }
  dismiss(): void {
    this.closeModal();
  }
  dismissForHandoff(): void {
    this.closeModal(false);
  }
  toggleShortcut(): void {
    if (this.modal.hidden) this.open();
    else this.closeModal();
  }

  render(snapshot: BattleSnapshot): void {
    const coins = formatNumber(snapshot.coins);
    this.coins.textContent = `Coins: ${coins.text}`;
    this.coins.title = coins.exact;
    const { playerStats } = snapshot;
    this.currentStats.textContent = `Damage: ${formatNumber(playerStats.damage).text} · Armor penetration: ${(playerStats.armorPenetration * 100).toFixed(1)}% · Critical chance: ${(playerStats.criticalChance * 100).toFixed(1)}% · Double reward: ${(playerStats.doubleRewardChance * 100).toFixed(1)}% · Automatic attacks: ${playerStats.automaticAttacksPerSecond.toFixed(2)} APS`;
    for (const upgrade of snapshot.upgrades) {
      let entry = this.upgradeButtons.get(upgrade.id);
      if (entry === undefined) {
        const upgradeButton = document.createElement("button");
        upgradeButton.type = "button";
        const title = document.createElement("span");
        title.className = "upgrade-title";
        const price = document.createElement("span");
        price.className = "upgrade-price";
        upgradeButton.append(title, price);
        const listener = (event: MouseEvent): void =>
          this.upgradeListener?.(upgrade.id, upgradeQuantity(event));
        upgradeButton.addEventListener("click", listener);
        entry = { button: upgradeButton, listener, price, title };
        this.upgradeButtons.set(upgrade.id, entry);
        this.upgrades.append(upgradeButton);
      }
      const level = formatNumber(upgrade.level);
      const cost = formatNumber(upgrade.cost);
      const disabledReason =
        upgrade.disabledReason === `Need ${upgrade.cost} coins`
          ? `Need ${cost.text} coins`
          : upgrade.disabledReason;
      const actionLabel = `${upgrade.label} - ${level.exact}; ${cost.exact} coins${disabledReason === null ? "" : `; ${disabledReason}`}`;
      entry.title.textContent = `${upgrade.label} - ${level.text}`;
      entry.price.textContent = `${cost.text} coins`;
      entry.button.setAttribute("aria-label", actionLabel);
      entry.button.disabled = upgrade.disabledReason !== null;
      entry.button.title = actionLabel;
    }
  }

  dispose(): void {
    this.closeModal();
    this.launcher.removeEventListener("click", this.open);
    this.close.removeEventListener("click", this.closeFromButton);
    this.modal.removeEventListener("pointerup", this.closeFromBackdrop);
    this.resetButton.removeEventListener("click", this.reset);
    this.restoreButton.removeEventListener("click", this.restore);
    for (const { button: upgradeButton, listener } of this.upgradeButtons.values())
      upgradeButton.removeEventListener("click", listener);
    this.upgradeButtons.clear();
  }

  private readonly reset = (): void => this.resetListener?.();
  private readonly restore = (): void => this.restoreListener?.();
  private readonly closeFromButton = (): void => this.closeModal();
  private readonly open = (): void => {
    if (!this.modal.hidden) return;
    this.modal.hidden = false;
    document.addEventListener("keydown", this.modalKeydown);
    this.close.focus();
  };
  private readonly closeModal = (restoreFocus = true): void => {
    if (this.modal.hidden) return;
    this.modal.hidden = true;
    document.removeEventListener("keydown", this.modalKeydown);
    if (restoreFocus) this.launcher.focus();
  };
  private readonly closeFromBackdrop = (event: PointerEvent): void => {
    if (event.target === this.modal) this.closeModal();
  };
  private readonly modalKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [
      this.close,
      ...[...this.upgradeButtons.values()]
        .map(({ button }) => button)
        .filter((button) => !button.disabled),
      this.resetButton,
      ...(this.restoreButton.hidden ? [] : [this.restoreButton]),
    ];
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = (current + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  };
}
