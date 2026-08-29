import { describe, expect, it } from "vitest";
import v1Fixture from "./fixtures/save-v1.json";
import v2Fixture from "./fixtures/save-v2.json";
import legacyV2Fixture from "./fixtures/legacy-save-v2.json";

import { COMBAT_BALANCE, createCombatState, spawnEnemy } from "../domain/combat";
import {
  createPersistenceBoundary,
  decodeSave,
  encodeSave,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  SAVE_V1_KEY,
  SAVE_V2_KEY,
  SAVE_VERSION,
} from "./persistence-boundary";

const fallback = () =>
  createCombatState(
    { automaticSpeedLevel: 0, criticalChance: 0, damage: 1, doubleRewardChance: 0 },
    0,
    false,
  );

describe("persistence boundary", () => {
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
    expect(decodeSave(JSON.parse(raw) as unknown, fallback(), 200)).toEqual({
      ...state,
      nextAutomaticAttackAtMs: 1_200,
    });
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

  it("migrates the authentic V1 shape into V2 without changing the prior bytes", () => {
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
      enemy: { encounter: 1, health: 84, maxHealth: 140 },
      player: {
        armorPenetrationLevel: 0,
        criticalLevel: 1,
        damage: 12,
        damageLevel: 1,
        doubleRewardLevel: 2,
      },
    });
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(SAVE_V2_KEY)).toBe(encodeSave(migrated));
    expect(JSON.parse(values.get(SAVE_V2_KEY) ?? "")).toEqual(v2Fixture);
    expect(boundary.hasPreviousVersionSave()).toBe(false);
    expect(boundary.restorePreviousVersion(200)).toEqual({
      message: "Current-version progress is already valid.",
      state: undefined,
    });
    expect(boundary.load(fallback(), 200)).toMatchObject({ coins: 7, enemy: { health: 84 } });
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
      [SAVE_V2_KEY, "invalid current payload"],
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
    expect(JSON.parse(values.get(SAVE_V2_KEY) ?? "")).toEqual(legacyV2Fixture);
    expect(boundary.load(fallback(), 200)).toMatchObject(expectedState);
    values.set(LEGACY_SAVE_KEY, JSON.stringify({ ...legacyV2Fixture, coins: 1 }));
    expect(boundary.load(fallback(), 300)).toMatchObject({ coins: 25 });
  });

  it("accepts current and previous boss cadence saves but rejects corrupted historical values", () => {
    const current = { ...fallback(), enemy: spawnEnemy(35, 0) };
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
    const current = { ...fallback(), enemy: spawnEnemy(35, 0) };
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
      [SAVE_V2_KEY, "invalid current payload"],
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
    expect(JSON.parse(values.get(SAVE_V2_KEY) ?? "")).toEqual(legacyV2Fixture);
    expect(values.get(SAVE_V1_KEY)).toBe(v1);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);
    timers.get(1)?.();
    expect(JSON.parse(values.get(SAVE_V2_KEY) ?? "")).toEqual(legacyV2Fixture);
  });

  it("repairs only an invalid current slot and keeps the in-memory migration on write failure", () => {
    const v1 = JSON.stringify({ ...v1Fixture, coins: 3 });
    const values = new Map<string, string>([
      [SAVE_V1_KEY, v1],
      [SAVE_V2_KEY, "not json"],
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
    expect(values.get(SAVE_V2_KEY)).toBe("not json");
    expect(timers.size).toBe(1);
    writesFail = false;
    timers.get(1)?.();
    expect(JSON.parse(values.get(SAVE_V2_KEY) ?? "")).toMatchObject({
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
