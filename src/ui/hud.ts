import type { BattleSnapshot } from "../domain/snapshot";
import type { UpgradeId } from "../domain/combat";

export type Hud = {
  render(snapshot: BattleSnapshot): void;
  onAttack(listener: () => void): void;
  onUpgrade(listener: (id: UpgradeId) => void): void;
  onReset(listener: () => void): void;
  dispose(): void;
};

export const createHud = (host: HTMLElement): Hud => {
  const panel = document.createElement("section");
  panel.className = "hud";
  panel.setAttribute("aria-label", "Battle status");
  host.append(panel);
  const title = makeText("h1", "Autobattle Idle");
  const enemy = makeText("h2", "");
  const health = document.createElement("div");
  health.className = "enemy-health";
  health.setAttribute("role", "progressbar");
  const healthFill = document.createElement("div");
  healthFill.className = "enemy-health-fill";
  const healthText = document.createElement("span");
  health.append(healthFill, healthText);
  const automatic = makeText("p", "");
  const automaticProgress = document.createElement("div");
  automaticProgress.className = "automatic-progress";
  automaticProgress.setAttribute("role", "progressbar");
  const automaticFill = document.createElement("div");
  automaticFill.className = "automatic-progress-fill";
  automaticProgress.append(automaticFill);
  const coins = makeText("p", "");
  const attackButton = document.createElement("button");
  attackButton.className = "manual-attack";
  attackButton.type = "button";
  attackButton.textContent = "Attack";
  attackButton.setAttribute("aria-label", "Attack enemy");
  const resetButton = document.createElement("button");
  resetButton.className = "reset-progress";
  resetButton.type = "button";
  resetButton.textContent = "Reset progress";
  const upgrades = document.createElement("div");
  upgrades.className = "upgrades";
  const upgradeButtons = new Map<UpgradeId, { button: HTMLButtonElement; listener: () => void }>();
  const log = document.createElement("ol");
  log.className = "event-log";
  log.setAttribute("aria-label", "Combat events");
  log.setAttribute("aria-live", "polite");
  panel.append(
    title,
    enemy,
    health,
    automatic,
    automaticProgress,
    coins,
    attackButton,
    resetButton,
    upgrades,
    log,
  );
  let attackListener: (() => void) | undefined;
  let resetListener: (() => void) | undefined;
  let upgradeListener: ((id: UpgradeId) => void) | undefined;
  let renderedEventIds = "";
  const attack = (): void => attackListener?.();
  attackButton.addEventListener("click", attack);
  const reset = (): void => resetListener?.();
  resetButton.addEventListener("click", reset);
  const render = (snapshot: BattleSnapshot): void => {
    enemy.textContent = `${snapshot.enemy.name} · Level ${snapshot.enemy.level} · ${snapshot.enemy.grade}${snapshot.enemy.modifier === null ? "" : ` · ${snapshot.enemy.modifier}`}`;
    const percent = (snapshot.enemy.health / snapshot.enemy.maxHealth) * 100;
    health.setAttribute("aria-valuemin", "0");
    health.setAttribute("aria-valuemax", String(snapshot.enemy.maxHealth));
    health.setAttribute("aria-valuenow", String(snapshot.enemy.health));
    health.setAttribute(
      "aria-label",
      `${snapshot.enemy.name} health ${snapshot.enemy.health} of ${snapshot.enemy.maxHealth}`,
    );
    healthFill.style.width = `${percent}%`;
    healthText.textContent = `${snapshot.enemy.health}/${snapshot.enemy.maxHealth}`;
    automatic.textContent = snapshot.automatic.unlocked
      ? `Automatic attack: ${(snapshot.automatic.remainingMs / 1000).toFixed(3)}s`
      : "Automatic attack: locked";
    automaticProgress.setAttribute("aria-label", "Automatic attack cooldown");
    automaticProgress.setAttribute("aria-valuemin", "0");
    automaticProgress.setAttribute("aria-valuemax", String(snapshot.automatic.intervalMs));
    automaticProgress.setAttribute("aria-valuenow", String(snapshot.automatic.remainingMs));
    automaticFill.style.width = snapshot.automatic.unlocked
      ? `${Math.min(100, (snapshot.automatic.remainingMs / snapshot.automatic.intervalMs) * 100)}%`
      : "0%";
    coins.textContent = `Coins: ${snapshot.coins}`;
    for (const upgrade of snapshot.upgrades) {
      let entry = upgradeButtons.get(upgrade.id);
      if (entry === undefined) {
        const button = document.createElement("button");
        const listener = (): void => upgradeListener?.(upgrade.id);
        button.type = "button";
        button.addEventListener("click", listener);
        entry = { button, listener };
        upgradeButtons.set(upgrade.id, entry);
        upgrades.append(button);
      }
      const { button } = entry;
      button.textContent = `${upgrade.label} Lv.${upgrade.level} · ${upgrade.cost} coins${upgrade.disabledReason === null ? "" : ` · ${upgrade.disabledReason}`}`;
      button.disabled = upgrade.disabledReason !== null;
      button.title = upgrade.disabledReason ?? "";
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
    dispose: () => {
      attackButton.removeEventListener("click", attack);
      resetButton.removeEventListener("click", reset);
      for (const { button, listener } of upgradeButtons.values()) {
        button.removeEventListener("click", listener);
      }
      upgradeButtons.clear();
      panel.remove();
    },
  };
};

const makeText = (tagName: "h1" | "h2" | "p" | "li", value: string): HTMLElement => {
  const element = document.createElement(tagName);
  element.textContent = value;
  return element;
};
