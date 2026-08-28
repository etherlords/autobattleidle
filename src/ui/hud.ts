import type { UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";

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
  const status = document.createElement("section");
  status.className = "hud-status";
  const enemy = makeText("h1", "");
  const health = progress("enemy-health");
  const healthFill = document.createElement("div");
  healthFill.className = "enemy-health-fill";
  const healthText = document.createElement("span");
  health.append(healthFill, healthText);
  const automatic = progress("automatic-progress");
  const automaticFill = document.createElement("div");
  automaticFill.className = "automatic-progress-fill";
  automatic.append(automaticFill);
  const automaticText = makeText("p", "");
  const coins = makeText("p", "");
  status.append(enemy, health, automatic, automaticText, coins);

  const launcher = button("upgrades-launcher", "Upgrades");
  launcher.setAttribute("aria-haspopup", "dialog");
  const modal = document.createElement("section");
  modal.className = "upgrades-modal";
  modal.hidden = true;
  const dialog = document.createElement("section");
  dialog.className = "upgrades-dialog";
  dialog.setAttribute("aria-label", "Upgrades and saved progress");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("role", "dialog");
  const close = button("upgrades-close", "Close upgrades");
  const modalCoins = makeText("p", "");
  modalCoins.className = "upgrades-coins";
  const upgrades = document.createElement("div");
  upgrades.className = "upgrades";
  const resetButton = button("reset-progress", "Reset progress");
  const restoreButton = button("restore-progress", "Restore from previous version");
  restoreButton.hidden = true;
  const persistenceStatus = makeText("p", "");
  persistenceStatus.className = "persistence-status";
  persistenceStatus.setAttribute("aria-live", "polite");
  dialog.append(close, modalCoins, upgrades, resetButton, restoreButton, persistenceStatus);
  modal.append(dialog);
  const log = document.createElement("ol");
  log.className = "event-log";
  log.setAttribute("aria-label", "Combat events");
  log.setAttribute("aria-live", "polite");
  panel.append(status, launcher, modal, log);
  host.append(panel);

  battlefield.tabIndex = 0;
  battlefield.setAttribute("aria-label", "Battlefield. Press Enter or Space to attack.");
  const upgradeButtons = new Map<
    UpgradeId,
    {
      button: HTMLButtonElement;
      listener: () => void;
      price: HTMLSpanElement;
      title: HTMLSpanElement;
    }
  >();
  let attackListener: (() => void) | undefined;
  let resetListener: (() => void) | undefined;
  let restoreListener: (() => void) | undefined;
  let upgradeListener: ((id: UpgradeId) => void) | undefined;
  let renderedEventIds = "";
  const attack = (): void => attackListener?.();
  const pointerAttack = (): void => attack();
  const keyboardAttack = (event: KeyboardEvent): void => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    attack();
  };
  const reset = (): void => resetListener?.();
  const restore = (): void => restoreListener?.();
  const modalButtons = (): HTMLButtonElement[] => [
    close,
    ...[...upgradeButtons.values()]
      .map(({ button: upgradeButton }) => upgradeButton)
      .filter((upgradeButton) => !upgradeButton.disabled),
    resetButton,
    ...(restoreButton.hidden ? [] : [restoreButton]),
  ];
  const closeModal = (): void => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.removeEventListener("keydown", modalKeydown);
    launcher.focus();
  };
  const modalKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === "Tab") {
      const buttons = modalButtons();
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = (current + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length;
      event.preventDefault();
      buttons[next]?.focus();
    }
  };
  const openModal = (): void => {
    if (!modal.hidden) return;
    modal.hidden = false;
    document.addEventListener("keydown", modalKeydown);
    close.focus();
  };
  const toggleModal = (event: KeyboardEvent): void => {
    if (event.repeat || event.key.toLowerCase() !== "u") return;
    event.preventDefault();
    if (modal.hidden) openModal();
    else closeModal();
  };
  const closeFromBackdrop = (event: PointerEvent): void => {
    if (event.target === modal) closeModal();
  };
  battlefield.addEventListener("pointerup", pointerAttack);
  battlefield.addEventListener("keydown", keyboardAttack);
  document.addEventListener("keydown", toggleModal);
  launcher.addEventListener("click", openModal);
  close.addEventListener("click", closeModal);
  modal.addEventListener("pointerup", closeFromBackdrop);
  resetButton.addEventListener("click", reset);
  restoreButton.addEventListener("click", restore);
  const render = (snapshot: BattleSnapshot): void => {
    enemy.textContent = `${snapshot.enemy.name} · Level ${snapshot.enemy.level} · ${snapshot.enemy.grade}${snapshot.enemy.modifier === null ? "" : ` · ${snapshot.enemy.modifier}`}`;
    setProgress(
      health,
      `${snapshot.enemy.name} health ${snapshot.enemy.health} of ${snapshot.enemy.maxHealth}`,
      snapshot.enemy.maxHealth,
      snapshot.enemy.health,
    );
    healthFill.style.width = `${(snapshot.enemy.health / snapshot.enemy.maxHealth) * 100}%`;
    healthText.textContent = `${snapshot.enemy.health}/${snapshot.enemy.maxHealth}`;
    setProgress(
      automatic,
      "Automatic attack cooldown",
      snapshot.automatic.intervalMs,
      snapshot.automatic.remainingMs,
    );
    automaticFill.style.width = snapshot.automatic.unlocked
      ? `${Math.min(100, (snapshot.automatic.remainingMs / snapshot.automatic.intervalMs) * 100)}%`
      : "0%";
    automaticText.textContent = snapshot.automatic.unlocked
      ? `Automatic attack: ${(snapshot.automatic.remainingMs / 1000).toFixed(3)}s`
      : "Automatic attack: locked";
    coins.textContent = `Coins: ${snapshot.coins}`;
    modalCoins.textContent = `Coins: ${snapshot.coins}`;
    for (const upgrade of snapshot.upgrades) {
      let entry = upgradeButtons.get(upgrade.id);
      if (entry === undefined) {
        const upgradeButton = document.createElement("button");
        upgradeButton.type = "button";
        const title = document.createElement("span");
        title.className = "upgrade-title";
        const price = document.createElement("span");
        price.className = "upgrade-price";
        upgradeButton.append(title, price);
        const listener = (): void => upgradeListener?.(upgrade.id);
        upgradeButton.addEventListener("click", listener);
        entry = { button: upgradeButton, listener, price, title };
        upgradeButtons.set(upgrade.id, entry);
        upgrades.append(upgradeButton);
      }
      const actionLabel = `${upgrade.label} - ${upgrade.level}; ${upgrade.cost} coins${upgrade.disabledReason === null ? "" : `; ${upgrade.disabledReason}`}`;
      entry.title.textContent = `${upgrade.label} - ${upgrade.level}`;
      entry.price.textContent = `${upgrade.cost} coins`;
      entry.button.setAttribute("aria-label", actionLabel);
      entry.button.disabled = upgrade.disabledReason !== null;
      entry.button.title = actionLabel;
    }
    const eventIds = snapshot.events.map((event) => event.id).join(",");
    if (eventIds !== renderedEventIds) {
      renderedEventIds = eventIds;
      log.replaceChildren(...snapshot.events.map((event) => makeText("li", event.message)));
    }
  };
  return {
    render,
    onAttack: (listener) => {
      attackListener = listener;
    },
    onUpgrade: (listener) => {
      upgradeListener = listener;
    },
    onReset: (listener) => {
      resetListener = listener;
    },
    onRestore: (listener) => {
      restoreListener = listener;
    },
    setRestoreAvailable: (available) => {
      restoreButton.hidden = !available;
    },
    reportPersistence: (message) => {
      persistenceStatus.textContent = message;
    },
    dispose: () => {
      closeModal();
      battlefield.removeEventListener("pointerup", pointerAttack);
      battlefield.removeEventListener("keydown", keyboardAttack);
      document.removeEventListener("keydown", toggleModal);
      launcher.removeEventListener("click", openModal);
      close.removeEventListener("click", closeModal);
      modal.removeEventListener("pointerup", closeFromBackdrop);
      resetButton.removeEventListener("click", reset);
      restoreButton.removeEventListener("click", restore);
      for (const { button: upgradeButton, listener } of upgradeButtons.values())
        upgradeButton.removeEventListener("click", listener);
      upgradeButtons.clear();
      panel.remove();
    },
  };
};

const button = (className: string, label: string): HTMLButtonElement => {
  const element = document.createElement("button");
  element.className = className;
  element.type = "button";
  element.textContent = label;
  return element;
};

const progress = (className: string): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  element.setAttribute("role", "progressbar");
  return element;
};

const setProgress = (element: HTMLDivElement, label: string, max: number, value: number): void => {
  element.setAttribute("aria-label", label);
  element.setAttribute("aria-valuemin", "0");
  element.setAttribute("aria-valuemax", String(max));
  element.setAttribute("aria-valuenow", String(value));
};

const makeText = (tagName: "h1" | "p" | "li", value: string): HTMLElement => {
  const element = document.createElement(tagName);
  element.textContent = value;
  return element;
};
