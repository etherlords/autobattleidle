import { afterEach, describe, expect, it } from "vitest";

import { createApplication, startApplication } from "./application";
import { createCombatState, type UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import type { LeaderboardView } from "../leaderboard/contracts";
import type { HudIntent } from "../ui/hud/intents";

const visualCuesOf = (snapshot: BattleSnapshot | undefined): readonly string[] => {
  if (snapshot === undefined) throw new Error("Expected rendered snapshot");
  return snapshot.visualCues ?? [];
};

const originalDocument = globalThis.document;

const deferred = <T>() => {
  let reject: (reason?: unknown) => void = () => undefined;
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, reject, resolve };
};

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
});

describe("startApplication", () => {
  it("renders and reports only the latest leaderboard request", async () => {
    const requests: ReturnType<typeof deferred<LeaderboardView>>[] = [];
    const renameRequest = deferred<undefined>();
    const resetRequest = deferred<undefined>();
    const rendered: LeaderboardView[] = [];
    const reports: string[] = [];
    let load: ((around: boolean, mode: "level" | "golden-bugs") => void) | undefined;
    let rename: ((name: string) => void) | undefined;
    let reset: (() => void) | undefined;
    const app = startApplication({
      createLeaderboard: () => ({
        load: () => {
          const request = deferred<LeaderboardView>();
          requests.push(request);
          return request.promise;
        },
        rename: () => renameRequest.promise,
        reset: () => resetRequest.promise,
        submit: async () => undefined,
      }),
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: () => undefined,
        removeEventListener: () => undefined,
        requestAnimationFrame: () => 1,
      },
      game: {
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: () => undefined,
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: () => () => undefined,
        onAttack: () => undefined,
        onLeaderboardLoad: (listener) => {
          load = listener;
        },
        onLeaderboardRename: (listener) => {
          rename = listener;
        },
        onLeaderboardReset: (listener) => {
          reset = listener;
        },
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => undefined,
        render: () => undefined,
        renderLeaderboard: (view) => rendered.push(view),
        reportLeaderboard: (message) => reports.push(message),
        reportPersistence: () => undefined,
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => undefined,
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: () => undefined,
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      onDispose: () => undefined,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
    });
    if (load === undefined || rename === undefined || reset === undefined)
      throw new Error("Expected leaderboard controls");
    load(false, "golden-bugs");
    load(false, "level");
    const level = { entries: [{ goldenBugs: 0, level: 12, name: "Level", rank: 1 }], me: null };
    requests[1]?.resolve(level);
    await Promise.resolve();
    requests[0]?.resolve({
      entries: [{ goldenBugs: 12, level: 0, name: "Golden Bugs", rank: 1 }],
      me: null,
    });
    await Promise.resolve();
    expect(rendered).toEqual([level]);
    load(false, "golden-bugs");
    load(false, "level");
    requests[3]?.resolve(level);
    await Promise.resolve();
    requests[2]?.reject(new Error("offline"));
    await Promise.resolve();
    expect(rendered).toEqual([level, level]);
    expect(reports).toEqual([
      "Loading leaderboard…",
      "Loading leaderboard…",
      "Loading leaderboard…",
      "Loading leaderboard…",
    ]);
    load(false, "level");
    const reportsBeforeDispose = reports.length;
    rename("Name");
    reset();
    app.dispose();
    requests[4]?.resolve(level);
    renameRequest.resolve(undefined);
    resetRequest.resolve(undefined);
    await Promise.resolve();
    expect(rendered).toEqual([level, level]);
    expect(reports).toHaveLength(reportsBeforeDispose);
  });

  it("does not submit leaderboard progress for ordinary level changes", async () => {
    let intent: ((value: HudIntent) => void) | undefined;
    let submissions = 0;
    const app = startApplication({
      createLeaderboard: () => ({
        load: async () => ({ entries: [], me: null }),
        rename: async () => undefined,
        reset: async () => undefined,
        submit: async () => {
          submissions += 1;
        },
      }),
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: () => undefined,
        removeEventListener: () => undefined,
        requestAnimationFrame: () => 1,
      },
      game: {
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: () => undefined,
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: (listener) => {
          intent = listener;
          return () => undefined;
        },
        onAttack: () => undefined,
        onLeaderboardLoad: () => undefined,
        onLeaderboardRename: () => undefined,
        onLeaderboardReset: () => undefined,
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => undefined,
        render: () => undefined,
        reportLeaderboard: () => undefined,
        reportPersistence: () => undefined,
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => undefined,
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: () => undefined,
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      onDispose: () => undefined,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
    });
    if (intent === undefined) throw new Error("Expected application seams");
    intent({ type: "attack" });
    expect(submissions).toBe(0);
    intent({ type: "attack" });
    app.dispose();
  });
  it("routes presentation-only camera intents to the battlefield", () => {
    let rotate: ((delta: number) => void) | undefined;
    let rotatedBy = 0;
    const app = startApplication({
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: () => undefined,
        removeEventListener: () => undefined,
        requestAnimationFrame: () => 1,
      },
      game: {
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: (delta) => {
          rotatedBy += delta;
        },
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: (listener) => {
          rotate = (delta) => listener({ delta, type: "rotate-camera" });
          return () => undefined;
        },
        onAttack: () => undefined,
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => undefined,
        reportPersistence: () => undefined,
        render: () => undefined,
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => undefined,
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: () => undefined,
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      onDispose: () => undefined,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
    });
    if (rotate === undefined) throw new Error("Expected camera handler");
    rotate(0.12);
    expect(rotatedBy).toBe(0.12);
    app.dispose();
  });

  it("keeps attack, automatic-frame, purchase, persistence, and render ordering compatible", () => {
    const frames = new Map<number, FrameRequestCallback>();
    const snapshots: BattleSnapshot[] = [];
    const savedCoins: number[] = [];
    let gameRenders = 0;
    let attack: (() => void) | undefined;
    let upgrade: ((id: UpgradeId, quantity?: 1 | 10 | 100) => void) | undefined;
    let intentUnsubscribes = 0;
    let nextFrame = 1;
    const initialState = createCombatState({
      criticalChance: 0,
      damage: 10,
      doubleRewardChance: 0,
    });
    const app = startApplication({
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: (id) => frames.delete(id),
        removeEventListener: () => undefined,
        requestAnimationFrame: (callback) => {
          const id = nextFrame;
          nextFrame += 1;
          frames.set(id, callback);
          return id;
        },
      },
      game: {
        dispose: () => undefined,
        render: () => {
          gameRenders += 1;
        },
        rotateCamera: () => undefined,
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: (listener) => {
          attack = () => listener({ type: "attack" });
          upgrade = (id, quantity = 1) => listener({ id, quantity, type: "upgrade" });
          return () => {
            intentUnsubscribes += 1;
          };
        },
        onAttack: () => {
          throw new Error("Application must use HUD intents");
        },
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => {
          throw new Error("Application must use HUD intents");
        },
        reportPersistence: () => undefined,
        render: (snapshot) => snapshots.push(snapshot),
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => undefined,
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: (state) => savedCoins.push(state.coins),
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: {
        ...initialState,
        coins: 100,
        enemy: { ...initialState.enemy, health: 70 },
        nextAutomaticAttackAtMs: 100,
      },
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
      onDispose: () => undefined,
    });
    if (attack === undefined || upgrade === undefined) throw new Error("Expected HUD handlers");

    const beforeManualHit = snapshots.length;
    attack();
    expect(snapshots).toHaveLength(beforeManualHit + 1);
    expect(visualCuesOf(snapshots.at(-1))).toEqual(["hit"]);
    attack();
    expect(visualCuesOf(snapshots.at(-1))).toEqual(["hit", "death", "coin"]);
    expect(snapshots.at(-1)?.events.map((event) => event.message)).toEqual([
      "Manual hit: 40 damage",
      "Manual kill: +1 coins",
    ]);
    expect(savedCoins).toEqual([100, 101]);

    const beforeIdleFrame = snapshots.length;
    const idleFrame = frames.get(1);
    if (idleFrame === undefined) throw new Error("Expected animation frame");
    frames.delete(1);
    idleFrame(99);
    expect(snapshots).toHaveLength(beforeIdleFrame + 1);
    expect(snapshots.at(-1)?.events).toHaveLength(2);
    expect(visualCuesOf(snapshots.at(-1))).toEqual([]);
    expect(savedCoins).toEqual([100, 101]);

    upgrade("automatic-unlock");
    upgrade("automatic-unlock");
    expect(snapshots.at(-1)?.events.map((event) => event.message)).toEqual([
      "Manual hit: 40 damage",
      "Manual kill: +1 coins",
      "Purchased Unlock automatic attack",
    ]);
    expect(savedCoins).toEqual([100, 101, 100]);
    const beforeBulkSnapshots = snapshots.length;
    const beforeBulkGameRenders = gameRenders;
    const beforeBulkSaves = savedCoins.length;
    upgrade("damage", 10);
    expect(snapshots).toHaveLength(beforeBulkSnapshots + 1);
    expect(gameRenders).toBe(beforeBulkGameRenders + 1);
    expect(savedCoins).toHaveLength(beforeBulkSaves + 1);
    expect(savedCoins.at(-1)).toBeLessThan(100);
    expect(snapshots.at(-1)?.events.at(-1)?.message).toBe("Purchased Damage");
    expect(snapshots.at(-1)?.events.map((event) => event.message)).not.toContain("Need 3 coins");
    app.dispose();
    expect(intentUnsubscribes).toBe(1);
  });

  it("keeps automatic hit and kill messages plus persistence on the animation path", () => {
    const frames = new Map<number, FrameRequestCallback>();
    const snapshots: BattleSnapshot[] = [];
    const savedCoins: number[] = [];
    const initialState = createCombatState(
      { criticalChance: 0, damage: 10, doubleRewardChance: 0 },
      0,
      true,
    );
    const app = startApplication({
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: (id) => frames.delete(id),
        removeEventListener: () => undefined,
        requestAnimationFrame: (callback) => {
          frames.set(1, callback);
          return 1;
        },
      },
      game: {
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: () => undefined,
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: () => () => undefined,
        onAttack: () => undefined,
        onReset: () => undefined,
        onRestore: () => undefined,
        onUpgrade: () => undefined,
        reportPersistence: () => undefined,
        render: (snapshot) => snapshots.push(snapshot),
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => undefined,
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => false,
        onStateChanged: (state) => savedCoins.push(state.coins),
        reset: () => undefined,
        restorePreviousVersion: () => ({ message: "", state: undefined }),
      },
      initialState: { ...initialState, enemy: { ...initialState.enemy, health: 80 } },
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
      onDispose: () => undefined,
    });
    const firstFrame = frames.get(1);
    if (firstFrame === undefined) throw new Error("Expected animation frame");
    frames.delete(1);
    firstFrame(0);
    const secondFrame = frames.get(1);
    if (secondFrame === undefined) throw new Error("Expected animation frame");
    frames.delete(1);
    secondFrame(10_000);
    expect(snapshots.at(-1)?.events.map((event) => event.message)).toEqual([
      "Automatic hit: 40 damage",
      "Automatic kill: +1 coins",
    ]);
    expect(savedCoins).toEqual([0, 1]);
    app.dispose();
  });

  it("keeps reset, restore, and disposal side effects compatible", () => {
    const frames = new Map<number, FrameRequestCallback>();
    const messages: string[] = [];
    const snapshots: BattleSnapshot[] = [];
    let attack: (() => void) | undefined;
    let reset: (() => void) | undefined;
    let restore: (() => void) | undefined;
    let confirmed = false;
    let resets = 0;
    let disposals = 0;
    const initialState = createCombatState({
      criticalChance: 0,
      damage: 10,
      doubleRewardChance: 0,
    });
    const restoredState = { ...initialState, coins: 9 };
    const restoreResults = [
      { message: "Previous-version save is unavailable or invalid.", state: undefined },
      { message: "Progress restored from the previous version.", state: restoredState },
    ];
    const app = startApplication({
      window: {
        addEventListener: () => undefined,
        cancelAnimationFrame: (id) => frames.delete(id),
        confirm: () => confirmed,
        removeEventListener: () => undefined,
        requestAnimationFrame: (callback) => {
          frames.set(1, callback);
          return 1;
        },
      },
      game: {
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: () => undefined,
        resize: () => undefined,
      },
      hud: {
        dispose: () => undefined,
        subscribe: (listener) => {
          attack = () => listener({ type: "attack" });
          reset = () => listener({ type: "reset" });
          restore = () => listener({ type: "restore" });
          return () => undefined;
        },
        onAttack: (listener) => {
          attack = listener;
        },
        onReset: (listener) => {
          reset = listener;
        },
        onRestore: (listener) => {
          restore = listener;
        },
        onUpgrade: () => undefined,
        reportPersistence: (message) => messages.push(message),
        render: (snapshot) => snapshots.push(snapshot),
        setRestoreAvailable: () => undefined,
      },
      persistence: {
        dispose: () => {
          disposals += 1;
        },
        load: (fallback) => fallback,
        hasPreviousVersionSave: () => true,
        onStateChanged: () => undefined,
        reset: () => {
          resets += 1;
        },
        restorePreviousVersion: () => restoreResults.shift() ?? { message: "", state: undefined },
      },
      initialState,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      viewport: () => ({ height: 240, width: 400 }),
      onDispose: () => undefined,
    });
    if (attack === undefined || reset === undefined || restore === undefined)
      throw new Error("Expected HUD handlers");

    attack();
    const beforeCancelledReset = snapshots.length;
    reset();
    expect(resets).toBe(0);
    expect(snapshots).toHaveLength(beforeCancelledReset);

    const beforeFailedRestore = snapshots.length;
    restore();
    expect(messages).toEqual(["Previous-version save is unavailable or invalid."]);
    expect(snapshots).toHaveLength(beforeFailedRestore);

    restore();
    expect(messages).toEqual([
      "Previous-version save is unavailable or invalid.",
      "Progress restored from the previous version.",
    ]);
    expect(snapshots.at(-1)?.coins).toBe(9);
    expect(snapshots.at(-1)?.events).toEqual([]);

    confirmed = true;
    reset();
    expect(resets).toBe(1);
    expect(snapshots.at(-1)?.coins).toBe(0);
    expect(snapshots.at(-1)?.events).toEqual([]);
    app.dispose();
    app.dispose();
    expect(disposals).toBe(1);
  });

  it("uses the startup clock for restored automatic cooldown", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { createElement: () => ({ className: "", clientHeight: 240, clientWidth: 400 }) },
    });
    const frames = new Map<number, FrameRequestCallback>();
    const snapshots: BattleSnapshot[] = [];
    let suppliedBattlefield: HTMLElement | undefined;
    let loadedAt = -1;
    const initialState = {
      ...createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }, 0, true),
    };
    const app = createApplication({ replaceChildren: () => undefined } as unknown as HTMLElement, {
      createGame: () => ({
        dispose: () => undefined,
        render: () => undefined,
        rotateCamera: () => undefined,
        resize: () => undefined,
      }),
      createHud: (_host, battlefield) => {
        suppliedBattlefield = battlefield;
        return {
          dispose: () => undefined,
          subscribe: () => () => undefined,
          onAttack: () => undefined,
          onReset: () => undefined,
          onRestore: () => undefined,
          onUpgrade: () => undefined,
          reportPersistence: () => undefined,
          render: (snapshot) => snapshots.push(snapshot),
          setRestoreAvailable: () => undefined,
        };
      },
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
    expect(suppliedBattlefield).toBeDefined();
    expect(snapshots.at(-1)?.automatic.remainingMs).toBe(1_000);
    frames.get(1)?.(1_200);
    expect(snapshots.at(-1)?.enemy.health).toBe(10);
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
    let upgrade: ((id: UpgradeId, quantity?: 1 | 10 | 100) => void) | undefined;
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
        rotateCamera: () => undefined,
        resize: () => {
          calls.resize += 1;
        },
      },
      hud: {
        dispose: () => {
          calls.hudDispose += 1;
        },
        subscribe: (listener) => {
          attack = () => listener({ type: "attack" });
          upgrade = (id, quantity = 1) => listener({ id, quantity, type: "upgrade" });
          reset = () => listener({ type: "reset" });
          return () => undefined;
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
    expect(lastSnapshot().enemy.health).toBe(210);
    expect(lastSnapshot().coins).toBe(2);
    expect(lastSnapshot().events.at(-1)?.message).toBe("Manual kill: +1 coins");
    expect(lastSnapshot().upgrades).toHaveLength(6);
    expect(savedCoins).toEqual([2]);
    expect(lastSnapshot().upgrades.map((upgrade) => upgrade.disabledReason)).toEqual([
      null,
      "Need 45 coins",
      "Need 3 coins",
      "Need 3 coins",
      "Need 4 coins",
      "Requires automatic attack unlock",
    ]);
    upgrade("automatic-unlock");
    expect(savedCoins).toEqual([2, 1]);
    expect(lastSnapshot().automatic.remainingMs).toBe(10000);
    attack();
    expect(lastSnapshot().enemy.health).toBe(170);
    expect(lastSnapshot().automatic.remainingMs).toBe(10000);
    const firstFrame = callbacks.values().next().value as FrameRequestCallback;
    callbacks.delete(1);
    firstFrame(10000);
    expect(snapshots.at(-1)?.enemy.health).toBe(130);
    expect(lastSnapshot().automatic.remainingMs).toBe(10000);
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
