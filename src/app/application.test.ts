import { afterEach, describe, expect, it } from "vitest";

import { createApplication, startApplication } from "./application";
import { createCombatState, type UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";

const originalDocument = globalThis.document;

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("startApplication", () => {
  it("uses the startup clock for restored automatic cooldown", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: () => ({ className: "", clientHeight: 240, clientWidth: 400 }) },
    });
    const frames = new Map<number, FrameRequestCallback>();
    const snapshots: BattleSnapshot[] = [];
    let loadedAt = -1;
    const initialState = {
      ...createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }, 0, true),
    };
    const app = createApplication({ replaceChildren: () => undefined } as unknown as HTMLElement, {
      createGame: () => ({
        dispose: () => undefined,
        render: () => undefined,
        resize: () => undefined,
      }),
      createHud: () => ({
        dispose: () => undefined,
        onAttack: () => undefined,
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => undefined,
        reportPersistence: () => undefined,
        render: (snapshot) => snapshots.push(snapshot),
        setRestoreAvailable: () => undefined,
      }),
      createPersistence: () => ({
        dispose: () => undefined,
        load: (fallback, nowMs) => {
          loadedAt = nowMs;
          return { ...fallback, nextAutomaticAttackAtMs: nowMs + 1_000 };
        },
        hasPreviousVersionSave: () => false,
        onStateChanged: () => undefined,
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      }),
      initialState,
      now: () => 500,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: (id) => frames.delete(id),
        removeEventListener: () => undefined,
        requestAnimationFrame: (callback) => {
          frames.set(1, callback);
          return 1;
        },
      },
    });
    expect(loadedAt).toBe(500);
    expect(snapshots.at(-1)?.automatic.remainingMs).toBe(1_000);
    frames.get(1)?.(1_200);
    expect(snapshots.at(-1)?.enemy.health).toBe(140);
    expect(snapshots.at(-1)?.automatic.remainingMs).toBe(300);
    app.dispose();
  });

  it("owns one frame and resize listener, then disposes both idempotently", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    const resizeListeners = new Set<EventListenerOrEventListenerObject>();
    const calls = {
      cancel: 0,
      gameDispose: 0,
      hudDispose: 0,
      persistenceDispose: 0,
      persistenceReset: 0,
      render: 0,
      resize: 0,
    };
    let nextFrame = 1;
    let attack: (() => void) | undefined;
    let reset: (() => void) | undefined;
    let upgrade: ((id: UpgradeId) => void) | undefined;
    const snapshots: BattleSnapshot[] = [];
    const savedCoins: number[] = [];
    let confirmed = false;
    const app = startApplication({
      window: {
        addEventListener: (type, listener) => {
          if (type === "resize") resizeListeners.add(listener);
        },
        cancelAnimationFrame: (id) => {
          calls.cancel += 1;
          callbacks.delete(id);
        },
        removeEventListener: (type, listener) => {
          if (type === "resize") resizeListeners.delete(listener);
        },
        requestAnimationFrame: (callback) => {
          const id = nextFrame;
          nextFrame += 1;
          callbacks.set(id, callback);
          return id;
        },
        confirm: () => confirmed,
      },
      game: {
        dispose: () => {
          calls.gameDispose += 1;
        },
        render: () => {
          calls.render += 1;
        },
        resize: () => {
          calls.resize += 1;
        },
      },
      hud: {
        dispose: () => {
          calls.hudDispose += 1;
        },
        onAttack: (listener) => {
          attack = listener;
        },
        onReset: (listener) => {
          reset = listener;
        },
        onRestore: () => undefined,
        onUpgrade: (listener) => {
          upgrade = listener;
        },
        reportPersistence: () => undefined,
        render: (snapshot) => {
          snapshots.push(snapshot);
        },
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => {
          calls.persistenceDispose += 1;
        },
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: (state) => savedCoins.push(state.coins),
        reset: () => {
          calls.persistenceReset += 1;
        },
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: {
        ...createCombatState({ criticalChance: 0, damage: 10, doubleRewardChance: 0 }, 0, false),
        coins: 1,
      },
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
      onDispose: () => undefined,
    });
    expect(resizeListeners.size).toBe(1);
    expect(calls.resize).toBe(1);
    expect(callbacks.size).toBe(1);
    const lastSnapshot = (): BattleSnapshot => {
      const snapshot = snapshots.at(-1);
      if (snapshot === undefined) throw new Error("Expected a rendered snapshot");
      return snapshot;
    };
    if (attack === undefined || upgrade === undefined || reset === undefined) {
      throw new Error("Expected HUD handlers");
    }
    expect(lastSnapshot().upgrades.map((upgrade) => upgrade.disabledReason)).toEqual([
      null,
      "Need 45 coins",
      "Need 3 coins",
      "Need 3 coins",
      "Need 4 coins",
      "Requires automatic attack unlock",
    ]);
    attack();
    expect(lastSnapshot().enemy.health).toBe(100);
    expect(lastSnapshot().coins).toBe(1);
    expect(lastSnapshot().events.at(-1)?.message).toBe("Manual hit: 40 damage");
    expect(lastSnapshot().upgrades).toHaveLength(6);
    expect(savedCoins).toEqual([1]);
    expect(lastSnapshot().upgrades.map((upgrade) => upgrade.disabledReason)).toEqual([
      null,
      "Need 45 coins",
      "Need 3 coins",
      "Need 3 coins",
      "Need 4 coins",
      "Requires automatic attack unlock",
    ]);
    upgrade("automatic-unlock");
    expect(savedCoins).toEqual([1, 0]);
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    attack();
    expect(lastSnapshot().enemy.health).toBe(60);
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    const firstFrame = callbacks.values().next().value as FrameRequestCallback;
    callbacks.delete(1);
    firstFrame(1000);
    expect(snapshots.at(-1)?.enemy.health).toBe(20);
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    reset();
    expect(calls.persistenceReset).toBe(0);
    confirmed = true;
    reset();
    expect(calls.persistenceReset).toBe(1);
    expect(lastSnapshot().coins).toBe(1);
    app.dispose();
    app.dispose();
    expect(resizeListeners.size).toBe(0);
    expect(callbacks.size).toBe(0);
    expect(calls).toMatchObject({
      cancel: 1,
      gameDispose: 1,
      hudDispose: 1,
      persistenceDispose: 1,
      render: 6,
      resize: 1,
    });
  });
});
