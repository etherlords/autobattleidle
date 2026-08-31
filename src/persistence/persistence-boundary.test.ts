import { describe, expect, it } from "vitest";
import v1Fixture from "./fixtures/save-v1.json";
import v2Fixture from "./fixtures/save-v2.json";
import legacyV2Fixture from "./fixtures/legacy-save-v2.json";

import {
  automaticInterval,
  COMBAT_BALANCE,
  createCombatState,
  spawnEnemy,
  spawnGoldenBug,
} from "../domain/combat";
import { BattleController } from "../app/battle/controller";
import { battleCommands } from "../app/battle/commands";
import {
  createPersistenceBoundary,
  decodeSave,
  encodeSave,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  SAVE_V1_KEY,
  SAVE_V2_KEY,
  SAVE_V3_KEY,
  SAVE_V4_KEY,
  SAVE_VERSION,
} from "./persistence-boundary";

const fallback = () =>
  createCombatState(
    { automaticSpeedLevel: 0, criticalChance: 0, damage: 1, doubleRewardChance: 0 },
    0,
    false,
  );

describe("persistence boundary", () => {
  it("retains a versioned V2 source byte-for-byte while publishing and reloading V4", () => {
    const v2 = JSON.stringify(v2Fixture);
    const values = new Map<string, string>([[SAVE_V2_KEY, v2]]);
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    const migrated = boundary.load(fallback(), 100);
    expect(values.get(SAVE_V2_KEY)).toBe(v2);
    expect(values.get(SAVE_V4_KEY)).toBe(encodeSave(migrated));
    expect(boundary.load(fallback(), 200)).toMatchObject({
      coins: migrated.coins,
      enemy: migrated.enemy,
    });
  });

  it("persists an active Golden Bug in V3 without a deadline and reloads a fresh event window", () => {
    const player = fallback().player;
    const state = {
      ...fallback(),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 4_000,
    };
    const raw = encodeSave(state);
    expect(raw).not.toContain("deadline");
    expect(decodeSave(JSON.parse(raw), fallback(), 123)).toMatchObject({
      goldenBug: state.goldenBug,
      enemy: state.enemy,
      nextAutomaticAttackAtMs: 0,
    });
  });
  it("normalizes a literal legacy active-V3 Golden Bug reward through load, save, and reload", () => {
    const oldActiveV3 =
      '{"automaticUnlocked":false,"coins":7,"enemy":{"armor":0,"encounter":51,"grade":"normal","health":5,"id":3002399751580381,"maxHealth":5,"modifier":null,"reward":1220},"goldenBug":{"id":50,"resumeEncounter":51},"player":{"automaticSpeedLevel":0,"armorPenetrationLevel":0,"criticalChance":0,"criticalLevel":0,"damage":1,"damageLevel":0,"doubleRewardChance":0,"doubleRewardLevel":0},"version":3}';
    const values = new Map<string, string>([[SAVE_V3_KEY, oldActiveV3]]);
    const pagehide = new Set<() => void>();
    const boundary = createPersistenceBoundary({
      page: {
        addEventListener: (_type, listener) => pagehide.add(listener),
        removeEventListener: (_type, listener) => pagehide.delete(listener),
      },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    const loaded = boundary.load(fallback(), 100);
    expect(loaded).toMatchObject({
      goldenBug: { id: 50, resumeEncounter: 51 },
      enemy: { reward: 1550 },
    });
    boundary.onStateChanged(loaded);
    [...pagehide][0]?.();
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({ enemy: { reward: 1550 } });
    expect(boundary.load(fallback(), 200)).toEqual({ ...loaded, nextAutomaticAttackAtMs: 0 });
    expect(
      decodeSave(JSON.parse(oldActiveV3.replace('"reward":1220', '"reward":1221')), fallback(), 0),
    ).toEqual(fallback());
  });
  it("recognizes nonzero-speed V3 and V4 Golden Bugs with the pre-ABI APS curve", () => {
    const legacy = {
      automaticUnlocked: true,
      coins: 7,
      enemy: {
        armor: 0,
        encounter: 51,
        grade: "normal",
        health: 50,
        id: 3002399751580381,
        maxHealth: 50,
        modifier: null,
        reward: 1220,
      },
      goldenBug: { id: 50, resumeEncounter: 51 },
      player: {
        automaticSpeedLevel: 100,
        armorPenetrationLevel: 0,
        criticalChance: 0,
        criticalLevel: 0,
        damage: 1,
        damageLevel: 0,
        doubleRewardChance: 0,
        doubleRewardLevel: 0,
      },
    };
    for (const [key, source] of [
      [SAVE_V3_KEY, { ...legacy, version: 3 }],
      [SAVE_V4_KEY, { ...legacy, goldenBugDefeats: 0, version: 4 }],
    ] as const) {
      const values = new Map<string, string>([[key, JSON.stringify(source)]]);
      const boundary = createPersistenceBoundary({
        page: { addEventListener: () => undefined, removeEventListener: () => undefined },
        storage: {
          getItem: (storageKey) => values.get(storageKey) ?? null,
          removeItem: (storageKey) => values.delete(storageKey),
          setItem: (storageKey, value) => values.set(storageKey, value),
        },
      });
      const loaded = boundary.load(fallback(), 100);
      expect(loaded.goldenBug).toEqual(legacy.goldenBug);
      const roundTrip = decodeSave(JSON.parse(encodeSave(loaded)), fallback(), 200);
      expect(roundTrip).toMatchObject({ goldenBug: legacy.goldenBug });
    }
  });
  it("round-trips an integer high-APS visual tick without a save-schema change", () => {
    const initial = {
      ...createCombatState({ automaticSpeedLevel: 1_000, damageLevel: 100, damage: 201 }, 0, true),
      nextAutomaticAttackAtMs: 0,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
    });
    expect(controller.dispatch(battleCommands.frame(0))).toBe(true);
    const resolved = controller.currentUpdate().state;
    expect(Number.isSafeInteger(resolved.enemy.health)).toBe(true);
    expect(decodeSave(JSON.parse(encodeSave(resolved)), fallback(), 0)).toEqual({
      ...resolved,
      nextAutomaticAttackAtMs: automaticInterval(resolved.enemy, resolved.player),
    });
  });
  it("round-trips only canonical state and rejects malformed or unsupported values", () => {
    const state = {
      ...fallback(),
      automaticUnlocked: true,
      coins: 7,
      enemy: { ...fallback().enemy, health: 4 },
      player: fallback().player,
    };
    const raw = encodeSave(state);
    expect(raw).not.toContain("nextAutomaticAttackAtMs");
    expect(raw).not.toContain("events");
    expect(raw).not.toContain("automaticPaused");
    const loaded = decodeSave(JSON.parse(raw) as unknown, fallback(), 200);
    expect(loaded).toEqual({
      ...state,
      nextAutomaticAttackAtMs: 10_200,
    });
    expect(
      new BattleController({
        createInitialState: fallback,
        initialNowMs: 200,
        initialState: loaded,
        rolls: () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 }),
      }).currentUpdate().automaticPaused,
    ).toBe(false);
    expect(decodeSave({ version: SAVE_VERSION + 1 }, fallback(), 0)).toEqual(fallback());
    expect(decodeSave({ ...JSON.parse(raw), timer: 1 }, fallback(), 0)).toEqual(fallback());
    expect(
      decodeSave({ ...JSON.parse(raw), enemy: { ...state.enemy, grade: "boss" } }, fallback(), 0),
    ).toEqual(fallback());
    expect(
      decodeSave(
        {
          ...JSON.parse(raw),
          automaticUnlocked: false,
          player: { ...state.player, automaticSpeedLevel: 1 },
        },
        fallback(),
        0,
      ),
    ).toEqual(fallback());
    expect(
      decodeSave(
        { ...JSON.parse(raw), player: { ...state.player, damage: state.player.damage + 1 } },
        fallback(),
        0,
      ),
    ).toEqual(fallback());
    expect(
      decodeSave(
        { ...JSON.parse(raw), enemy: { ...state.enemy, health: Number.NaN } },
        fallback(),
        0,
      ),
    ).toEqual(fallback());
  });

  it("coalesces writes, flushes, preserves an existing save on failure, and cleans up", () => {
    const values = new Map<string, string>([[SAVE_KEY, "good"]]);
    const pagehide = new Set<() => void>();
    const timers = new Map<number, () => void>();
    let nextTimer = 1;
    let writes = 0;
    let removes = 0;
    let storageRemoves = 0;
    let fail = true;
    const boundary = createPersistenceBoundary({
      debounceMs: 1,
      page: {
        addEventListener: (_type, listener) => pagehide.add(listener),
        removeEventListener: (_type, listener) => {
          removes += 1;
          pagehide.delete(listener);
        },
      },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => {
          storageRemoves += 1;
          values.delete(key);
        },
        setItem: (key, value) => {
          writes += 1;
          if (fail) throw new Error("quota");
          values.set(key, value);
        },
      },
      timers: {
        clearTimeout: (handle) => timers.delete(handle),
        setTimeout: (callback) => {
          const handle = nextTimer;
          nextTimer += 1;
          timers.set(handle, callback);
          return handle;
        },
      },
    });
    boundary.onStateChanged({ ...fallback(), coins: 1 });
    boundary.onStateChanged({ ...fallback(), coins: 2 });
    expect(timers.size).toBe(1);
    const scheduled = [...timers.entries()][0];
    if (scheduled === undefined) throw new Error("Expected a pending write");
    timers.delete(scheduled[0]);
    scheduled[1]();
    expect(writes).toBe(1);
    expect(values.get(SAVE_KEY)).toBe("good");
    fail = false;
    [...pagehide][0]?.();
    expect(writes).toBe(2);
    expect(JSON.parse(values.get(SAVE_KEY) ?? "").coins).toBe(2);
    expect(boundary.load(fallback(), 42).coins).toBe(2);
    boundary.reset();
    expect(values.has(SAVE_KEY)).toBe(false);
    boundary.dispose();
    boundary.dispose();
    boundary.onStateChanged({ ...fallback(), coins: 9 });
    boundary.reset();
    expect(pagehide.size).toBe(0);
    expect(removes).toBe(1);
    expect(timers.size).toBe(0);
    expect(writes).toBe(2);
    expect(storageRemoves).toBe(1);
  });

  it("migrates the authentic V1 shape through V2 and V3 into V4 without changing the prior bytes", () => {
    const v1 = JSON.stringify(v1Fixture);
    const values = new Map<string, string>([[SAVE_V1_KEY, v1]]);
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    const migrated = boundary.load(fallback(), 100);
    expect(migrated).toMatchObject({
      automaticUnlocked: true,
      coins: 7,
      enemy: { encounter: 1, health: 8, maxHealth: 12 },
      player: {
        armorPenetrationLevel: 0,
        criticalLevel: 1,
        damage: 12,
        damageLevel: 1,
        doubleRewardLevel: 2,
      },
    });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(SAVE_V4_KEY)).toBe(encodeSave(migrated));
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({
      goldenBug: null,
      version: SAVE_VERSION,
    });
    expect(boundary.hasPreviousVersionSave()).toBe(true);
    expect(boundary.restorePreviousVersion(200).state).toMatchObject({ coins: 7 });
    expect(boundary.load(fallback(), 200)).toMatchObject({ coins: 7, enemy: { health: 8 } });
    boundary.reset();
    expect(values.has(SAVE_V2_KEY)).toBe(false);
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
  });

  it("promotes a valid legacy V2 slot without modifying its bytes", () => {
    const legacy = JSON.stringify(legacyV2Fixture);
    const expectedState = {
      automaticUnlocked: legacyV2Fixture.automaticUnlocked,
      coins: legacyV2Fixture.coins,
      enemy: legacyV2Fixture.enemy,
      player: legacyV2Fixture.player,
    };
    const values = new Map<string, string>([
      [LEGACY_SAVE_KEY, legacy],
      [SAVE_V4_KEY, "invalid current payload"],
    ]);
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    expect(boundary.load(fallback(), 100)).toMatchObject(expectedState);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({
      ...legacyV2Fixture,
      goldenBug: null,
      version: SAVE_VERSION,
    });
    expect(boundary.load(fallback(), 200)).toMatchObject(expectedState);
    values.set(LEGACY_SAVE_KEY, JSON.stringify({ ...legacyV2Fixture, coins: 1 }));
    expect(boundary.load(fallback(), 300)).toMatchObject({ coins: 25 });
  });

  it("accepts current and previous boss cadence saves but rejects corrupted historical values", () => {
    const base = fallback();
    const current = { ...base, enemy: spawnEnemy(35, 0, undefined, base.player) };
    expect(decodeSave(JSON.parse(encodeSave(current)) as unknown, fallback(), 0)).toEqual(current);
    expect(decodeSave(legacyV2Fixture, fallback(), 0)).toMatchObject({
      coins: legacyV2Fixture.coins,
      enemy: legacyV2Fixture.enemy,
    });
    expect(
      decodeSave(
        {
          ...legacyV2Fixture,
          enemy: { ...legacyV2Fixture.enemy, reward: legacyV2Fixture.enemy.reward + 1 },
        },
        fallback(),
        0,
      ),
    ).toEqual(fallback());
  });

  it("uses current recognition first and rejects a non-matching cadence interpretation", () => {
    const base = fallback();
    const current = { ...base, enemy: spawnEnemy(35, 0, undefined, base.player) };
    const currentRaw = JSON.parse(encodeSave(current)) as Record<string, unknown>;
    expect(decodeSave(currentRaw, fallback(), 0)).toEqual(current);
    expect(
      decodeSave(
        {
          ...currentRaw,
          enemy: { ...current.enemy, grade: "normal", maxHealth: 150, health: 150 },
        },
        fallback(),
        0,
      ),
    ).toEqual(fallback());
  });

  it("round-trips the new starter save and accepts the historical encounter-1 fixture", () => {
    const freshStarter = fallback();
    expect(freshStarter.enemy).toMatchObject({ health: 10, maxHealth: 10 });
    expect(decodeSave(JSON.parse(encodeSave(freshStarter)), fallback(), 0)).toEqual(freshStarter);
    expect(decodeSave(v2Fixture, fallback(), 0)).toMatchObject({
      enemy: v2Fixture.enemy,
    });
  });

  it("retains current linear progression and historical V1 through load, save, and reload", () => {
    const base = fallback();
    const current = { ...base, enemy: spawnEnemy(100, 0, undefined, base.player) };
    const historical = decodeSave(v1Fixture, fallback(), 0);
    expect(decodeSave(JSON.parse(encodeSave(current)) as unknown, fallback(), 0)).toEqual(current);
    expect(decodeSave(JSON.parse(encodeSave(historical)) as unknown, fallback(), 0)).toEqual(
      historical,
    );
  });

  it("round-trips each new modifier without changing the save shape", () => {
    for (const roll of [0.76, 0.85, 0.96]) {
      const base = fallback();
      const state = { ...base, enemy: spawnEnemy(3, roll, undefined, base.player) };
      expect(decodeSave(JSON.parse(encodeSave(state)) as unknown, fallback(), 0)).toEqual(state);
    }
  });

  it("prefers direct legacy V2 over versioned V1 when the current slot is unusable", () => {
    const v1 = JSON.stringify(v1Fixture);
    const legacy = JSON.stringify(legacyV2Fixture);
    const values = new Map<string, string>([
      [SAVE_V1_KEY, v1],
      [LEGACY_SAVE_KEY, legacy],
    ]);
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
      },
    });
    expect(boundary.load(fallback(), 100)).toMatchObject({
      coins: legacyV2Fixture.coins,
      enemy: legacyV2Fixture.enemy,
      player: legacyV2Fixture.player,
    });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);
  });

  it("keeps legacy V2 precedence when Restore runs before a failed publish retry", () => {
    const v1 = JSON.stringify(v1Fixture);
    const legacy = JSON.stringify(legacyV2Fixture);
    const values = new Map<string, string>([
      [SAVE_V1_KEY, v1],
      [LEGACY_SAVE_KEY, legacy],
      [SAVE_V4_KEY, "invalid current payload"],
    ]);
    const timers = new Map<number, () => void>();
    let writes = 0;
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => {
          writes += 1;
          if (writes === 1) throw new Error("quota");
          values.set(key, value);
        },
      },
      timers: {
        clearTimeout: (handle) => timers.delete(handle),
        setTimeout: (callback) => {
          timers.set(1, callback);
          return 1;
        },
      },
    });
    expect(boundary.load(fallback(), 100)).toMatchObject({ coins: legacyV2Fixture.coins });
    expect(boundary.hasPreviousVersionSave()).toBe(true);
    expect(boundary.restorePreviousVersion(100).state).toMatchObject({
      coins: legacyV2Fixture.coins,
    });
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({
      ...legacyV2Fixture,
      goldenBug: null,
      version: SAVE_VERSION,
    });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);
    timers.get(1)?.();
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({
      ...legacyV2Fixture,
      goldenBug: null,
      version: SAVE_VERSION,
    });
  });

  it("repairs only an invalid current slot and keeps the in-memory migration on write failure", () => {
    const v1 = JSON.stringify({ ...v1Fixture, coins: 3 });
    const values = new Map<string, string>([
      [SAVE_V1_KEY, v1],
      [SAVE_V4_KEY, "not json"],
    ]);
    let writesFail = true;
    const timers = new Map<number, () => void>();
    const boundary = createPersistenceBoundary({
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => {
          if (writesFail) throw new Error("quota");
          values.set(key, value);
        },
      },
      timers: {
        clearTimeout: (handle) => timers.delete(handle),
        setTimeout: (callback) => {
          timers.set(1, callback);
          return 1;
        },
      },
    });
    expect(boundary.load(fallback(), 0)).toMatchObject({ coins: 3 });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(SAVE_V4_KEY)).toBe("not json");
    expect(timers.size).toBe(1);
    writesFail = false;
    timers.get(1)?.();
    expect(JSON.parse(values.get(SAVE_V4_KEY) ?? "")).toMatchObject({
      version: SAVE_VERSION,
      coins: 3,
    });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
  });

  it("round-trips the highest accepted boss without an unsafe reward", () => {
    const highestBoss =
      Math.floor(Number.MAX_SAFE_INTEGER / 3 / COMBAT_BALANCE.bossInterval) *
      COMBAT_BALANCE.bossInterval;
    const state = {
      ...fallback(),
      enemy: spawnEnemy(highestBoss, 0),
    };
    expect(decodeSave(JSON.parse(encodeSave(state)), fallback(), 0)).toEqual(state);
  });
});
