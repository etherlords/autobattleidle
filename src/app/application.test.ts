import { describe, expect, it } from "vitest";

import { startApplication } from "./application";
import { createCombatState, type UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";

describe("startApplication", () => {
  it("owns one frame and resize listener, then disposes both idempotently", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    const resizeListeners = new Set<EventListenerOrEventListenerObject>();
    const calls = {
      cancel: 0,
      gameDispose: 0,
      hudDispose: 0,
      persistenceDispose: 0,
      render: 0,
      resize: 0,
    };
    let nextFrame = 1;
    let attack: (() => void) | undefined;
    let upgrade: ((id: UpgradeId) => void) | undefined;
    const snapshots: BattleSnapshot[] = [];
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
        onUpgrade: (listener) => {
          upgrade = listener;
        },
        render: (snapshot) => {
          snapshots.push(snapshot);
        },
      },
      persistence: {
        dispose: () => {
          calls.persistenceDispose += 1;
        },
        onStateChanged: () => undefined,
      },
      initialState: createCombatState(
        { criticalChance: 0, damage: 10, doubleRewardChance: 0 },
        0,
        false,
      ),
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
    if (attack === undefined || upgrade === undefined) throw new Error("Expected HUD handlers");
    expect(lastSnapshot().upgrades.map((upgrade) => upgrade.disabledReason)).toEqual([
      "Need 1 coins",
      "Need 1024 coins",
      "Need 3 coins",
      "Need 4 coins",
      "Requires automatic attack unlock",
    ]);
    attack();
    expect(lastSnapshot().enemy.health).toBe(23);
    expect(lastSnapshot().coins).toBe(1);
    expect(lastSnapshot().events.at(-1)?.message).toBe("Manual kill: +1 coins");
    expect(lastSnapshot().upgrades).toHaveLength(5);
    expect(lastSnapshot().upgrades.map((upgrade) => upgrade.disabledReason)).toEqual([
      null,
      "Need 1024 coins",
      "Need 3 coins",
      "Need 4 coins",
      "Requires automatic attack unlock",
    ]);
    upgrade("automatic-unlock");
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    attack();
    expect(lastSnapshot().enemy.health).toBe(13);
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    const firstFrame = callbacks.values().next().value as FrameRequestCallback;
    callbacks.delete(1);
    firstFrame(1000);
    expect(snapshots.at(-1)?.enemy.health).toBe(3);
    expect(lastSnapshot().automatic.remainingMs).toBe(1000);
    app.dispose();
    app.dispose();
    expect(resizeListeners.size).toBe(0);
    expect(callbacks.size).toBe(0);
    expect(calls).toMatchObject({
      cancel: 1,
      gameDispose: 1,
      hudDispose: 1,
      persistenceDispose: 1,
      render: 5,
      resize: 1,
    });
  });
});
