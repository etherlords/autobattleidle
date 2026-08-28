import { describe, expect, it } from "vitest";

import { createCombatState } from "../domain/combat";
import {
  createPersistenceBoundary,
  decodeSave,
  encodeSave,
  SAVE_KEY,
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
      player: { automaticSpeedLevel: 1, criticalChance: 0.1, damage: 2, doubleRewardChance: 0.2 },
    };
    const raw = encodeSave(state);
    expect(raw).not.toContain("nextAutomaticAttackAtMs");
    expect(raw).not.toContain("events");
    expect(decodeSave(JSON.parse(raw) as unknown, fallback(), 200)).toEqual({
      ...state,
      nextAutomaticAttackAtMs: 1_100,
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
});
