import { afterEach, describe, expect, it } from "vitest";

import { UPGRADES } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import stylesheet from "../style.css?raw";
import { createHud } from "./hud";
import type { HudIntent } from "./hud/intents";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  readonly style = { width: "" };
  className = "";
  disabled = false;
  focusCalls = 0;
  focusHandler: (() => void) | undefined;
  hidden = false;
  parent: FakeElement | undefined;
  tabIndex = -1;
  textContent = "";
  title = "";
  type = "";
  value = "";

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

  dispatch(type: string, detail: Record<string, unknown> = {}): void {
    const event = { preventDefault: () => undefined, ...detail, target: this } as unknown as Event;
    dispatchListeners(this, type, event);
  }

  focus(): void {
    this.focusCalls += 1;
    this.focusHandler?.();
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

  createElement(_tagName?: string): FakeElement {
    const element = new FakeElement();
    element.focusHandler = () => {
      this.activeElement = element;
    };
    return element;
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

const clickUpgrade = (button: FakeElement | undefined, detail: Record<string, unknown>): void => {
  if (button === undefined) throw new Error("Expected an upgrade button");
  button.dispatch("click", detail);
};

const snapshot: BattleSnapshot = {
  automatic: { intervalMs: 1_000, remainingMs: 500, unlocked: true },
  coins: 2,
  encounter: "Test",
  enemy: { grade: "normal", health: 9, level: 1, maxHealth: 10, modifier: null, name: "Ash Wisp" },
  events: [{ id: 1, message: "Manual hit: 1 damage" }],
  playerStats: {
    armorPenetration: 0.375,
    automaticAttacksPerSecond: 1,
    criticalChance: 0.3,
    damage: 22,
    doubleRewardChance: 0.3,
  },
  upgrades: UPGRADES.map((upgrade, index) => ({
    cost: upgrade.baseCost,
    disabledReason: index === 1 ? "Need 45 coins" : null,
    id: upgrade.id,
    label: upgrade.label,
    level: 0,
  })),
};

const originalDocument = globalThis.document;

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("createHud", () => {
  it("renders a passive Golden Bug countdown", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = document.createElement();
    const battlefield = document.createElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    hud.render({ ...snapshot, goldenBug: { remainingMs: 9_900 } });
    expect(element(host, "golden-bug-countdown").textContent).toContain("9.9s");
    hud.dispose();
  });
  it("keeps upgrade and leaderboard dialogs mutually isolated", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = document.createElement();
    const battlefield = document.createElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    hud.render(snapshot);
    const upgrades = element(host, "upgrades-launcher");
    const leaderboard = element(host, "leaderboard-launcher");
    const upgradesModal = element(host, "upgrades-modal");
    const leaderboardModal = element(host, "leaderboard-modal");
    const upgradesClose = element(host, "upgrades-close");
    const leaderboardClose = element(host, "leaderboard-close");
    upgrades.dispatch("click");
    expect(upgradesModal.hidden).toBe(false);
    leaderboard.dispatch("click");
    expect(upgradesModal.hidden).toBe(true);
    expect(leaderboardModal.hidden).toBe(false);
    expect(document.activeElement).toBe(leaderboardClose);
    document.dispatch("keydown", { key: "u", repeat: false });
    expect(leaderboardModal.hidden).toBe(true);
    expect(upgradesModal.hidden).toBe(false);
    expect(document.activeElement).toBe(upgradesClose);
    upgrades.dispatch("click");
    leaderboard.dispatch("click");
    leaderboardModal.dispatch("pointerup");
    expect(leaderboardModal.hidden).toBe(true);
    hud.dispose();
  });
  it("drives leaderboard modal focus, loading states, rename, and disposal", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = document.createElement();
    const battlefield = document.createElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    let loads = 0;
    let renamed = "";
    hud.onLeaderboardLoad?.(() => {
      loads += 1;
    });
    hud.onLeaderboardRename?.((name) => {
      renamed = name;
    });
    const launcher = element(host, "leaderboard-launcher");
    const modal = element(host, "leaderboard-modal");
    const close = element(host, "leaderboard-close");
    launcher.dispatch("click");
    expect(loads).toBe(1);
    expect(modal.hidden).toBe(false);
    expect(close.focusCalls).toBe(1);
    hud.reportLeaderboard?.("Loading leaderboard…");
    expect(element(host, "leaderboard-rank-summary").textContent).toBe("Loading leaderboard…");
    hud.renderLeaderboard?.({ entries: [], me: null });
    expect(element(host, "leaderboard-rank-summary").textContent).toBe("No ranked players yet.");
    const input = element(host, "leaderboard-name");
    input.value = "  Name  ";
    const rename = element(host, "leaderboard-rename");
    rename.dispatch("click");
    expect(renamed).toBe("  Name  ");
    document.activeElement = close;
    document.dispatch("keydown", { key: "Tab", shiftKey: true });
    expect(element(host, "leaderboard-reset").focusCalls).toBe(1);
    document.dispatch("keydown", { key: "Escape" });
    expect(modal.hidden).toBe(true);
    expect(launcher.focusCalls).toBeGreaterThan(0);
    launcher.dispatch("click");
    modal.dispatch("pointerup");
    expect(modal.hidden).toBe(true);
    hud.dispose();
    expect(document.listeners.get("keydown")?.size ?? 0).toBe(0);
  });
  it("uses separated leaderboard tab rows and an aligned current-player table", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = document.createElement();
    const battlefield = document.createElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    const loads: [boolean, string][] = [];
    hud.onLeaderboardLoad?.((around, mode) => loads.push([around, mode]));
    element(host, "leaderboard-launcher").dispatch("click");
    const dialog = element(host, "leaderboard-dialog");
    expect(dialog.children.slice(0, 4).map((child) => child.className)).toEqual([
      "leaderboard-close",
      "leaderboard-tabs leaderboard-metric-tabs",
      "leaderboard-tabs leaderboard-view-tabs",
      "leaderboard-rank-summary",
    ]);
    element(host, "leaderboard-around").dispatch("click");
    element(host, "leaderboard-golden-bugs").dispatch("click");
    expect(loads).toEqual([
      [false, "level"],
      [true, "level"],
      [true, "golden-bugs"],
    ]);
    expect(element(host, "leaderboard-around").attributes.get("aria-pressed")).toBe("true");
    hud.renderLeaderboard?.({
      entries: [
        { goldenBugs: 9, level: 99, name: "Above", rank: 4 },
        { goldenBugs: 8, level: 88, name: "Me", rank: 5 },
      ],
      me: { goldenBugs: 8, level: 88, name: "Me", rank: 5 },
    });
    expect(element(host, "leaderboard-rank-summary").textContent).toBe(
      "Community ranking — Your rank is #5",
    );
    const table = element(host, "leaderboard-entries");
    const head = table.children[0];
    const body = table.children[1];
    expect(head?.children[0]?.children.map((cell) => cell.textContent)).toEqual([
      "Place",
      "Name",
      "Golden Bugs",
    ]);
    expect(body?.children[1]?.children.map((cell) => cell.textContent)).toEqual(["5", "Me", "8"]);
    expect(body?.children[1]?.className).toBe("leaderboard-current");
    expect(body?.children[1]?.attributes.get("aria-label")).toBe("Your rank 5");
    expect(element(host, "leaderboard-close").textContent).toBe("×");
    expect(element(host, "leaderboard-close").attributes.get("aria-label")).toBe(
      "Close leaderboard",
    );
    hud.dispose();
  });
  it("disables leaderboard actions while rename or reset is pending", async () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = document.createElement();
    const battlefield = document.createElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    const rename = deferred<undefined>();
    const reset = deferred<undefined>();
    hud.onLeaderboardRename?.(() => rename.promise);
    hud.onLeaderboardReset?.(() => reset.promise);
    const name = element(host, "leaderboard-name");
    const level = element(host, "leaderboard-level");
    const goldenBugs = element(host, "leaderboard-golden-bugs");
    const top = element(host, "leaderboard-top");
    const around = element(host, "leaderboard-around");
    const action = element(host, "leaderboard-rename");
    const remove = element(host, "leaderboard-reset");
    const controls = [name, level, goldenBugs, top, around, action, remove];
    action.dispatch("click");
    expect(controls.every((control) => control.disabled)).toBe(true);
    rename.resolve(undefined);
    await Promise.resolve();
    expect(controls.every((control) => !control.disabled)).toBe(true);
    remove.dispatch("click");
    expect(controls.every((control) => control.disabled)).toBe(true);
    reset.resolve(undefined);
    await Promise.resolve();
    expect(controls.every((control) => !control.disabled)).toBe(true);
    hud.dispose();
  });
  it("keeps a hidden upgrades modal out of the flex layout", () => {
    expect(stylesheet).toContain(".upgrades-modal[hidden] {\n  display: none;\n}");
    expect(stylesheet).toContain(".upgrades-dialog {");
    expect(stylesheet).toContain("max-height: calc(100vh - 2rem);");
    expect(stylesheet).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(stylesheet).toContain("grid-auto-rows: 4.75rem;");
    expect(stylesheet).toContain("height: 100%;");
    expect(stylesheet).toContain(
      ".battlefield {\n  grid-area: 1 / 1;\n  min-height: 100vh;\n  touch-action: none;\n}",
    );
    expect(stylesheet).toContain("grid-template-rows: 1fr 1fr;");
    expect(stylesheet).toContain(".upgrade-title,");
    expect(stylesheet).toContain(".leaderboard-current {");
    expect(stylesheet).toContain(".leaderboard-entries th,");
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
    const intents: HudIntent[] = [];
    if (hud.subscribe === undefined) throw new Error("Expected HUD intent subscription");
    const unsubscribe = hud.subscribe((intent) => intents.push(intent));
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

    expect(element(host, "hud-status").children.at(0)).toMatchObject({
      textContent: "Ash Wisp · Level 1 · normal",
    });
    battlefield.dispatch("pointerdown", { button: 0, clientX: 10, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("pointerup", { clientX: 10, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("keydown", { key: "Enter", repeat: false });
    battlefield.dispatch("keydown", { key: " ", repeat: false });
    battlefield.dispatch("keydown", { key: " ", repeat: true });
    battlefield.dispatch("keydown", { key: "ArrowLeft", repeat: false });
    battlefield.dispatch("keydown", { key: "ArrowRight", repeat: false });
    expect(attacks).toBe(3);
    expect(battlefield.tabIndex).toBe(0);
    expect(battlefield.attributes.get("aria-label")).toBe(
      "Battlefield. Press Enter or Space to attack; use Left and Right arrows to rotate the camera.",
    );
    expect(element(host, "enemy-health").attributes.get("aria-valuenow")).toBe("9");
    expect(element(host, "automatic-progress").attributes.get("aria-valuenow")).toBe("500");
    expect(element(host, "hud-status").children[3]?.textContent).toBe(
      "Automatic attack: 1.00 APS · 0.500s",
    );
    const automaticPause = element(host, "automatic-pause");
    automaticPause.dispatch("click");
    expect(automaticPause.attributes.get("aria-label")).toBe("Pause auto attack");
    hud.render({ ...snapshot, automatic: { ...snapshot.automatic, paused: true } });
    expect(automaticPause.textContent).toBe("▶");
    expect(automaticPause.attributes.get("aria-label")).toBe("Resume auto attack");
    expect(automaticPause.attributes.get("aria-pressed")).toBe("true");
    hud.render({ ...snapshot, automatic: { ...snapshot.automatic, unlocked: false } });
    expect(automaticPause.disabled).toBe(true);
    expect(element(host, "upgrades-dialog").attributes.get("role")).toBe("dialog");
    expect(element(host, "upgrades-coins").textContent).toBe("Coins: 2");
    expect(element(host, "current-upgrade-stats").textContent).toBe(
      "Damage: 22 · Armor penetration: 37.5% · Critical chance: 30.0% · Double reward: 30.0% · Automatic attacks: 1.00 APS",
    );
    expect(element(host, "current-upgrade-stats").attributes.get("aria-label")).toBe(
      "Current upgrade stats",
    );
    expect(element(host, "upgrade-bulk-hint").textContent).toBe(
      "Shift-click buys x10. Ctrl-click buys x100.",
    );
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
    expect(element(upgradeButtons[0] as FakeElement, "upgrade-title").textContent).toContain("99");
    expect(element(upgradeButtons[0] as FakeElement, "upgrade-price").textContent).toBe(
      "123K coins",
    );
    expect(upgradeButtons[0]?.attributes.get("aria-label")).toContain("123,456 coins");
    hud.render({
      ...snapshot,
      coins: 900_000,
      enemy: { ...snapshot.enemy, health: 900_000, level: 10_000, maxHealth: 1_000_000 },
    });
    expect(element(host, "enemy-health").attributes.get("aria-valuenow")).toBe("900000");
    expect(element(host, "enemy-health").attributes.get("aria-valuemax")).toBe("1000000");
    expect(element(host, "enemy-health").attributes.get("aria-label")).toBe(
      "Ash Wisp health 900,000 of 1,000,000",
    );
    expect(element(host, "enemy-health").title).toBe("900,000 / 1,000,000");
    expect(element(host, "upgrades-coins").textContent).toBe("Coins: 900K");
    expect(element(host, "upgrades-coins").title).toBe("900,000");
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

    clickUpgrade(upgradeButtons[0], { detail: 1 });
    clickUpgrade(upgradeButtons[0], { detail: 1, shiftKey: true });
    clickUpgrade(upgradeButtons[0], { ctrlKey: true, detail: 1 });
    clickUpgrade(upgradeButtons[0], { ctrlKey: true, detail: 1, shiftKey: true });
    clickUpgrade(upgradeButtons[0], { ctrlKey: true, detail: 0, shiftKey: true });
    reset.dispatch("click");
    restore.dispatch("click");
    expect(upgrades).toBe(5);
    expect(upgradeButtons[1]?.disabled).toBe(true);
    expect(upgradeButtons[1]?.title).toContain("Need 45 coins");
    expect(resets).toBe(1);
    expect(restores).toBe(1);
    expect(restore.hidden).toBe(false);
    expect(element(host, "persistence-status").textContent).toBe("Restored");
    expect(element(host, "event-log").children[0]?.textContent).toBe("Manual hit: 1 damage");
    expect(intents).toEqual([
      { type: "attack" },
      { type: "attack" },
      { type: "attack" },
      { delta: 0.12, type: "rotate-camera" },
      { delta: -0.12, type: "rotate-camera" },
      { type: "toggle-automatic-pause" },
      { id: "automatic-unlock", quantity: 1, type: "upgrade" },
      { id: "automatic-unlock", quantity: 10, type: "upgrade" },
      { id: "automatic-unlock", quantity: 100, type: "upgrade" },
      { id: "automatic-unlock", quantity: 100, type: "upgrade" },
      { id: "automatic-unlock", quantity: 1, type: "upgrade" },
      { type: "reset" },
      { type: "restore" },
    ]);
    unsubscribe();

    launcher.dispatch("click");
    hud.dispose();
    const launcherFocusAtDispose = launcher.focusCalls;
    expect(document.listeners.get("keydown")?.size ?? 0).toBe(0);
    document.dispatch("keydown", { key: "Escape" });
    document.dispatch("keydown", { key: "Tab" });
    document.dispatch("keydown", { key: "u" });
    battlefield.dispatch("pointerup", { isPrimary: true, pointerId: 1 });
    battlefield.dispatch("keydown", { key: "Enter", repeat: false });
    launcher.dispatch("click");
    reset.dispatch("click");
    restore.dispatch("click");
    automaticPause.dispatch("click");
    expect(attacks).toBe(3);
    expect(intents).toHaveLength(13);
    expect(resets).toBe(1);
    expect(restores).toBe(1);
    expect(launcher.focusCalls).toBe(launcherFocusAtDispose);
    expect(host.children).toHaveLength(0);
    expect([...battlefield.listeners.values()].every((listeners) => listeners.size === 0)).toBe(
      true,
    );
  });

  it("arbitrates drag, cancel, and stationary battlefield pointer input", () => {
    const document = new FakeDocument();
    Object.defineProperty(globalThis, "document", { configurable: true, value: document });
    const host = new FakeElement();
    const battlefield = new FakeElement();
    const hud = createHud(host as unknown as HTMLElement, battlefield as unknown as HTMLElement);
    const intents: HudIntent[] = [];
    hud.subscribe((intent) => intents.push(intent));

    battlefield.dispatch("pointerdown", { button: 0, clientX: 10, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("pointermove", { clientX: 22, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("pointermove", { clientX: 35, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("pointerup", { clientX: 35, isPrimary: true, pointerId: 1 });
    battlefield.dispatch("pointerdown", { button: 0, clientX: 10, isPrimary: true, pointerId: 2 });
    battlefield.dispatch("pointercancel", { isPrimary: true, pointerId: 2 });
    battlefield.dispatch("pointerdown", { button: 0, clientX: 10, isPrimary: true, pointerId: 3 });
    battlefield.dispatch("pointerup", { clientX: 10, isPrimary: true, pointerId: 3 });

    expect(intents.filter((intent) => intent.type === "attack")).toHaveLength(1);
    expect(intents.filter((intent) => intent.type === "rotate-camera")).toHaveLength(2);
    hud.dispose();
    hud.dispose();
    expect([...battlefield.listeners.values()].every((listeners) => listeners.size === 0)).toBe(
      true,
    );
  });
});
