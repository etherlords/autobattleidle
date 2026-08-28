import { afterEach, describe, expect, it } from "vitest";

import { UPGRADES } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import stylesheet from "../style.css?raw";
import { createHud } from "./hud";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  readonly style = { width: "" };
  className = "";
  disabled = false;
  focusCalls = 0;
  hidden = false;
  parent: FakeElement | undefined;
  tabIndex = -1;
  textContent = "";
  title = "";
  type = "";

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  append(...children: FakeElement[]): void {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  dispatch(type: string, detail: Partial<KeyboardEvent> = {}): void {
    const event = { preventDefault: () => undefined, ...detail, target: this } as unknown as Event;
    dispatchListeners(this, type, event);
  }

  focus(): void {
    this.focusCalls += 1;
  }

  remove(): void {
    const index = this.parent?.children.indexOf(this);
    if (index !== undefined && index >= 0) this.parent?.children.splice(index, 1);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children.splice(0, this.children.length);
    this.append(...children);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

const dispatchListeners = (element: FakeElement, type: string, event: Event): void => {
  for (const listener of element.listeners.get(type) ?? []) {
    if (typeof listener === "function") listener(event);
    else listener.handleEvent(event);
  }
  if (element.parent !== undefined) dispatchListeners(element.parent, type, event);
};

class FakeDocument extends FakeElement {
  activeElement: FakeElement | null = null;

  createElement(): FakeElement {
    return new FakeElement();
  }
}

const element = (root: FakeElement, className: string): FakeElement => {
  const candidates = [...root.children];
  while (candidates.length > 0) {
    const candidate = candidates.shift();
    if (candidate === undefined) throw new Error("Expected an element");
    if (candidate.className === className) return candidate;
    candidates.push(...candidate.children);
  }
  throw new Error(`Could not find ${className}`);
};

const snapshot: BattleSnapshot = {
  automatic: { intervalMs: 1_000, remainingMs: 500, unlocked: true },
  coins: 2,
  encounter: "Test",
  enemy: { grade: "normal", health: 9, level: 1, maxHealth: 10, modifier: null, name: "Ash Wisp" },
  events: [{ id: 1, message: "Manual hit: 1 damage" }],
  upgrades: UPGRADES.map((upgrade, index) => ({
    cost: upgrade.baseCost,
    disabledReason: index === 1 ? "Need 45 coins" : null,
    id: upgrade.id,
    label: upgrade.label,
    level: 0,
  })),
};

const originalDocument = globalThis.document;

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("createHud", () => {
  it("keeps a hidden upgrades modal out of the flex layout", () => {
    expect(stylesheet).toContain(".upgrades-modal[hidden] {\n  display: none;\n}");
    expect(stylesheet).toContain(".upgrades-dialog {");
    expect(stylesheet).toContain("max-height: calc(100vh - 2rem);");
    expect(stylesheet).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(stylesheet).toContain("grid-auto-rows: 4.75rem;");
    expect(stylesheet).toContain("height: 100%;");
    expect(stylesheet).toContain("grid-template-rows: 1fr 1fr;");
    expect(stylesheet).toContain(".upgrade-title,");
  });

  it("routes canvas input once and contains upgrades in an accessible modal", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = new FakeElement();
    const battlefield = new FakeElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    let attacks = 0;
    let resets = 0;
    let restores = 0;
    let upgrades = 0;
    hud.onAttack(() => {
      attacks += 1;
    });
    hud.onUpgrade(() => {
      upgrades += 1;
    });
    hud.onReset(() => {
      resets += 1;
    });
    hud.onRestore(() => {
      restores += 1;
    });
    hud.setRestoreAvailable(true);
    hud.reportPersistence("Restored");
    hud.render(snapshot);

    battlefield.dispatch("pointerup");
    battlefield.dispatch("keydown", { key: "Enter", repeat: false });
    battlefield.dispatch("keydown", { key: " ", repeat: false });
    battlefield.dispatch("keydown", { key: " ", repeat: true });
    expect(attacks).toBe(3);
    expect(battlefield.tabIndex).toBe(0);
    expect(element(host, "enemy-health").attributes.get("aria-valuenow")).toBe("9");
    expect(element(host, "automatic-progress").attributes.get("aria-valuenow")).toBe("500");
    expect(element(host, "upgrades-dialog").attributes.get("role")).toBe("dialog");
    expect(element(host, "upgrades-coins").textContent).toBe("Coins: 2");
    hud.render({ ...snapshot, coins: 3 });
    expect(element(host, "upgrades-coins").textContent).toBe("Coins: 3");
    hud.render({
      ...snapshot,
      upgrades: snapshot.upgrades.map((upgrade, index) =>
        index === 0
          ? {
              ...upgrade,
              cost: 123_456,
              disabledReason: "Requires a longer prerequisite than the card can display",
              label: "A deliberately long upgrade label for stable-grid coverage",
              level: 99,
            }
          : upgrade,
      ),
    });

    const launcher = element(host, "upgrades-launcher");
    const modal = element(host, "upgrades-modal");
    const dialog = element(host, "upgrades-dialog");
    const close = element(host, "upgrades-close");
    const upgradeButtons = element(host, "upgrades").children;
    const reset = element(host, "reset-progress");
    const restore = element(host, "restore-progress");
    expect(element(upgradeButtons[1] as FakeElement, "upgrade-title").textContent).toBe(
      "Damage - 0",
    );
    expect(element(upgradeButtons[1] as FakeElement, "upgrade-price").textContent).toBe("2 coins");
    expect(element(upgradeButtons[1] as FakeElement, "upgrade-title").textContent).not.toContain(
      "Need",
    );
    expect(upgradeButtons[1]?.attributes.get("aria-label")).toContain("Need 45 coins");
    expect(upgradeButtons[0]?.title).toContain("A deliberately long upgrade label");
    expect(upgradeButtons[0]?.title).toContain("Requires a longer prerequisite");
    hud.render(snapshot);
    document.dispatch("keydown", { key: "u", repeat: false });
    expect(modal.hidden).toBe(false);
    document.dispatch("keydown", { key: "u", repeat: true });
    expect(modal.hidden).toBe(false);
    document.dispatch("keydown", { key: "U", repeat: false });
    expect(modal.hidden).toBe(true);
    launcher.dispatch("click");
    dialog.dispatch("pointerup");
    expect(modal.hidden).toBe(false);
    modal.dispatch("pointerup");
    expect(modal.hidden).toBe(true);
    launcher.dispatch("click");
    expect(modal.hidden).toBe(false);
    expect(close.focusCalls).toBeGreaterThan(0);
    close.dispatch("click");
    expect(modal.hidden).toBe(true);
    expect(launcher.focusCalls).toBeGreaterThan(2);
    launcher.dispatch("click");
    document.activeElement = close;
    document.dispatch("keydown", { key: "Tab", shiftKey: true });
    expect(restore.focusCalls).toBe(1);
    document.dispatch("keydown", { key: "Escape" });
    expect(modal.hidden).toBe(true);
    expect(launcher.focusCalls).toBeGreaterThan(3);

    upgradeButtons[0]?.dispatch("click");
    reset.dispatch("click");
    restore.dispatch("click");
    expect(upgrades).toBe(1);
    expect(upgradeButtons[1]?.disabled).toBe(true);
    expect(upgradeButtons[1]?.title).toContain("Need 45 coins");
    expect(resets).toBe(1);
    expect(restores).toBe(1);
    expect(restore.hidden).toBe(false);
    expect(element(host, "persistence-status").textContent).toBe("Restored");
    expect(element(host, "event-log").children[0]?.textContent).toBe("Manual hit: 1 damage");

    launcher.dispatch("click");
    hud.dispose();
    const launcherFocusAtDispose = launcher.focusCalls;
    expect(document.listeners.get("keydown")?.size ?? 0).toBe(0);
    document.dispatch("keydown", { key: "Escape" });
    document.dispatch("keydown", { key: "Tab" });
    document.dispatch("keydown", { key: "u" });
    battlefield.dispatch("pointerup");
    battlefield.dispatch("keydown", { key: "Enter", repeat: false });
    launcher.dispatch("click");
    reset.dispatch("click");
    restore.dispatch("click");
    expect(attacks).toBe(3);
    expect(resets).toBe(1);
    expect(restores).toBe(1);
    expect(launcher.focusCalls).toBe(launcherFocusAtDispose);
    expect(host.children).toHaveLength(0);
  });
});
