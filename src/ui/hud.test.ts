import { afterEach, describe, expect, it } from "vitest";

import { UPGRADES } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import { createHud } from "./hud";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly listeners = new Map<string, Set<() => void>>();
  readonly style = { width: "" };
  className = "";
  disabled = false;
  parent: FakeElement | undefined;
  textContent = "";
  title = "";
  type = "";

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  append(...children: FakeElement[]): void {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  click(): void {
    for (const listener of this.listeners.get("click") ?? []) listener();
  }

  remove(): void {
    this.parent?.children.splice(this.parent.children.indexOf(this), 1);
  }

  removeEventListener(type: string, listener: () => void): void {
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
  enemy: {
    grade: "normal",
    health: 9,
    level: 1,
    maxHealth: 10,
    modifier: null,
    name: "Ash Wisp",
  },
  events: [{ id: 1, message: "Manual hit: 1 damage" }],
  upgrades: UPGRADES.map((upgrade) => ({
    cost: upgrade.baseCost,
    disabledReason: null,
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
  it("routes one native click event and removes every handler", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: () => new FakeElement() },
    });
    const host = new FakeElement();
    const hud = createHud(host as unknown as HTMLElement);
    let attacks = 0;
    let upgrades = 0;
    hud.onAttack(() => {
      attacks += 1;
    });
    hud.onUpgrade(() => {
      upgrades += 1;
    });
    hud.render(snapshot);

    const attack = element(host, "manual-attack");
    const upgradeButtons = element(host, "upgrades").children;
    attack.click();
    for (const upgrade of upgradeButtons) upgrade.click();

    expect(attacks).toBe(1);
    expect(upgrades).toBe(5);
    expect(element(host, "event-log").children[0]?.textContent).toBe("Manual hit: 1 damage");
    hud.dispose();
    attack.click();
    for (const upgrade of upgradeButtons) upgrade.click();
    expect(attacks).toBe(1);
    expect(upgrades).toBe(5);
    expect(host.children).toHaveLength(0);
  });
});
