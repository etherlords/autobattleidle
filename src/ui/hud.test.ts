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
    const event = { preventDefault: () => undefined, ...detail } as unknown as Event;
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
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

    const launcher = element(host, "upgrades-launcher");
    const modal = element(host, "upgrades-modal");
    const close = element(host, "upgrades-close");
    const upgradeButtons = element(host, "upgrades").children;
    const reset = element(host, "reset-progress");
    const restore = element(host, "restore-progress");
    launcher.dispatch("click");
    expect(modal.hidden).toBe(false);
    expect(close.focusCalls).toBe(1);
    close.dispatch("click");
    expect(modal.hidden).toBe(true);
    expect(launcher.focusCalls).toBe(1);
    launcher.dispatch("click");
    document.activeElement = close;
    document.dispatch("keydown", { key: "Tab", shiftKey: true });
    expect(restore.focusCalls).toBe(1);
    document.dispatch("keydown", { key: "Escape" });
    expect(modal.hidden).toBe(true);
    expect(launcher.focusCalls).toBe(2);

    upgradeButtons[0]?.dispatch("click");
    reset.dispatch("click");
    restore.dispatch("click");
    expect(upgrades).toBe(1);
    expect(upgradeButtons[1]?.disabled).toBe(true);
    expect(upgradeButtons[1]?.title).toBe("Need 45 coins");
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
