import { describe, expect, it } from "vitest";
import v1Fixture from "./fixtures/save-v1.json";
import v2Fixture from "./fixtures/save-v2.json";
import legacyV2Fixture from "./fixtures/legacy-save-v2.json";
import v3GoldenFixture from "./fixtures/save-v3-active-golden.json";
import v3GoldenHighApsFixture from "./fixtures/save-v3-active-golden-high-aps.json";
import v3Encounter2170Fixture from "./fixtures/save-v3-encounter-2170.json";
import v4GoldenDefeatsFixture from "./fixtures/save-v4-golden-defeats.json";

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

type FixtureExpectation = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: {
    readonly armor: number;
    readonly encounter: number;
    readonly grade: "normal" | "veteran" | "elite" | "boss";
    readonly health: number;
    readonly id: number;
    readonly maxHealth: number;
    readonly modifier: "armor" | "health" | "automatic-slow" | null;
    readonly reward: number;
  };
  readonly goldenBugDefeats: number;
  readonly goldenBug: { readonly id: number; readonly resumeEncounter: number } | null;
  readonly player: {
    readonly automaticSpeedLevel: number;
    readonly armorPenetrationLevel: number;
    readonly criticalChance: number;
    readonly criticalLevel: number;
    readonly damage: number;
    readonly damageLevel: number;
    readonly doubleRewardChance: number;
    readonly doubleRewardLevel: number;
  };
};

const fixtureManifest = [
  { key: SAVE_V1_KEY, fixture: v1Fixture, historical: true, name: "V1", sourceVersion: 1 },
  { key: SAVE_V2_KEY, fixture: v2Fixture, historical: true, name: "V2", sourceVersion: 2 },
  {
    key: LEGACY_SAVE_KEY,
    fixture: legacyV2Fixture,
    historical: true,
    name: "legacy V2",
    sourceVersion: 2,
  },
  {
    key: SAVE_V3_KEY,
    fixture: v3Encounter2170Fixture,
    historical: true,
    name: "V3 encounter 2170",
    sourceVersion: 3,
  },
  {
    key: SAVE_V3_KEY,
    fixture: v3GoldenFixture,
    historical: true,
    name: "V3 active Golden",
    sourceVersion: 3,
  },
  {
    key: SAVE_V3_KEY,
    fixture: v3GoldenHighApsFixture,
    historical: true,
    name: "V3 active Golden high APS",
    sourceVersion: 3,
  },
  {
    key: SAVE_V4_KEY,
    fixture: v4GoldenDefeatsFixture,
    historical: false,
    name: "V4 Golden defeats",
    sourceVersion: SAVE_VERSION,
  },
] as const;

const fixtureExpectations: readonly FixtureExpectation[] = [
  {
    automaticUnlocked: true,
    coins: 7,
    enemy: {
      armor: 0,
      encounter: 1,
      grade: "normal",
      health: 8,
      id: 1,
      maxHealth: 12,
      modifier: null,
      reward: 1,
    },
    goldenBug: null,
    goldenBugDefeats: 0,
    player: {
      automaticSpeedLevel: 1,
      armorPenetrationLevel: 0,
      criticalChance: 0.02857142857142857,
      criticalLevel: 1,
      damage: 12,
      damageLevel: 1,
      doubleRewardChance: 0.05454545454545454,
      doubleRewardLevel: 2,
    },
  },
  {
    automaticUnlocked: true,
    coins: 7,
    enemy: {
      armor: 0,
      encounter: 1,
      grade: "normal",
      health: 84,
      id: 1,
      maxHealth: 140,
      modifier: null,
      reward: 1,
    },
    goldenBug: null,
    goldenBugDefeats: 0,
    player: {
      automaticSpeedLevel: 1,
      armorPenetrationLevel: 0,
      criticalChance: 0.02857142857142857,
      criticalLevel: 1,
      damage: 12,
      damageLevel: 1,
      doubleRewardChance: 0.05454545454545454,
      doubleRewardLevel: 2,
    },
  },
  {
    automaticUnlocked: true,
    coins: 25,
    enemy: {
      armor: 30,
      encounter: 30,
      grade: "boss",
      health: 10793,
      id: 30,
      maxHealth: 19980,
      modifier: null,
      reward: 4860,
    },
    goldenBug: null,
    goldenBugDefeats: 0,
    player: {
      automaticSpeedLevel: 4,
      armorPenetrationLevel: 7,
      criticalChance: 0.12,
      criticalLevel: 5,
      damage: 52,
      damageLevel: 14,
      doubleRewardChance: 0.13846153846153844,
      doubleRewardLevel: 6,
    },
  },
  {
    automaticUnlocked: true,
    coins: 427_622_176,
    enemy: {
      armor: 2170,
      encounter: 2170,
      grade: "boss",
      health: 17810,
      id: 2170,
      maxHealth: 191100,
      modifier: null,
      reward: 16883685,
    },
    goldenBug: null,
    goldenBugDefeats: 0,
    player: {
      automaticSpeedLevel: 4093,
      armorPenetrationLevel: 1074,
      criticalChance: 0.589873417721519,
      criticalLevel: 1165,
      damage: 6370,
      damageLevel: 5620,
      doubleRewardChance: 0.5941775836972343,
      doubleRewardLevel: 2041,
    },
  },
  {
    automaticUnlocked: false,
    coins: 7,
    enemy: {
      armor: 0,
      encounter: 51,
      grade: "normal",
      health: 16,
      id: 3002399751580381,
      maxHealth: 16,
      modifier: null,
      reward: 1550,
    },
    goldenBug: { id: 50, resumeEncounter: 51 },
    goldenBugDefeats: 0,
    player: {
      automaticSpeedLevel: 0,
      armorPenetrationLevel: 0,
      criticalChance: 0,
      criticalLevel: 0,
      damage: 1,
      damageLevel: 0,
      doubleRewardChance: 0,
      doubleRewardLevel: 0,
    },
  },
  {
    automaticUnlocked: true,
    coins: 7,
    enemy: {
      armor: 0,
      encounter: 51,
      grade: "normal",
      health: 123,
      id: 3002399751580381,
      maxHealth: 123,
      modifier: null,
      reward: 1550,
    },
    goldenBug: { id: 50, resumeEncounter: 51 },
    goldenBugDefeats: 0,
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
  },
  {
    automaticUnlocked: true,
    coins: 427_622_176,
    enemy: {
      armor: 2170,
      encounter: 2170,
      grade: "boss",
      health: 17810,
      id: 2170,
      maxHealth: 191100,
      modifier: null,
      reward: 16883685,
    },
    goldenBug: null,
    goldenBugDefeats: 3,
    player: {
      automaticSpeedLevel: 4093,
      armorPenetrationLevel: 1074,
      criticalChance: 0.589873417721519,
      criticalLevel: 1165,
      damage: 6370,
      damageLevel: 5620,
      doubleRewardChance: 0.5941775836972343,
      doubleRewardLevel: 2041,
    },
  },
];

const createFixtureBoundary = (values: Map<string, string>) =>
  createPersistenceBoundary({
    page: { addEventListener: () => undefined, removeEventListener: () => undefined },
    storage: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    },
  });

const expectFixtureState = (
  state: ReturnType<typeof fallback>,
  expected: FixtureExpectation,
): void => {
  const { nextAutomaticAttackAtMs: ignoredTimestamp, ...persisted } = state;
  void ignoredTimestamp;
  expect(persisted).toEqual({
    automaticUnlocked: expected.automaticUnlocked,
    coins: expected.coins,
    enemy: expected.enemy,
    goldenBug: expected.goldenBug,
    goldenBugDefeats: expected.goldenBugDefeats,
    player: expected.player,
  });
};

describe("persistence boundary", () => {
  it("keeps a closed, table-driven migration matrix for every supported save fixture", () => {
    expect(fixtureManifest.map(({ name }) => name)).toEqual([
      "V1",
      "V2",
      "legacy V2",
      "V3 encounter 2170",
      "V3 active Golden",
      "V3 active Golden high APS",
      "V4 Golden defeats",
    ]);
    expect(fixtureExpectations).toHaveLength(fixtureManifest.length);
    expect(fixtureManifest.map(({ sourceVersion }) => sourceVersion)).toEqual([
      1,
      2,
      2,
      3,
      3,
      3,
      SAVE_VERSION,
    ]);
    expect(new Set(fixtureManifest.map(({ sourceVersion }) => sourceVersion))).toEqual(
      new Set(Array.from({ length: SAVE_VERSION }, (_value, index) => index + 1)),
    );

    for (const [index, source] of fixtureManifest.entries()) {
      const expected = fixtureExpectations[index];
      if (expected === undefined) throw new Error(`Missing fixture expectation for ${source.name}`);
      const raw = JSON.stringify(source.fixture);
      expect(source.fixture.version).toBe(source.sourceVersion);
      const values = new Map<string, string>([[source.key, raw]]);
      const boundary = createFixtureBoundary(values);
      const migrated = boundary.load(fallback(), 100);

      expectFixtureState(migrated, expected);
      expect(values.get(source.key)).toBe(raw);
      if (source.historical) expect(values.get(SAVE_V4_KEY)).toBe(encodeSave(migrated));
      else expect(values.get(SAVE_V4_KEY)).toBe(raw);

      const reloaded = boundary.load(fallback(), 200);
      expectFixtureState(reloaded, expected);
      expect(values.get(source.key)).toBe(raw);
    }
  });

  it("repairs all historical slots in strict V3, V2, legacy, then V1 precedence", () => {
    const sources = [
      {
        expected: fixtureExpectations[3],
        key: SAVE_V3_KEY,
        raw: JSON.stringify(v3Encounter2170Fixture),
      },
      { expected: fixtureExpectations[1], key: SAVE_V2_KEY, raw: JSON.stringify(v2Fixture) },
      {
        expected: fixtureExpectations[2],
        key: LEGACY_SAVE_KEY,
        raw: JSON.stringify(legacyV2Fixture),
      },
      { expected: fixtureExpectations[0], key: SAVE_V1_KEY, raw: JSON.stringify(v1Fixture) },
    ];
    const scenarios = [
      { expectedIndex: 0, mutate: () => undefined },
      {
        expectedIndex: 1,
        mutate: (values: Map<string, string>) => values.set(SAVE_V3_KEY, "invalid"),
      },
      {
        expectedIndex: 2,
        mutate: (values: Map<string, string>) => {
          values.delete(SAVE_V3_KEY);
          values.set(SAVE_V2_KEY, "invalid");
        },
      },
      {
        expectedIndex: 3,
        mutate: (values: Map<string, string>) => {
          values.delete(SAVE_V3_KEY);
          values.delete(SAVE_V2_KEY);
          values.set(LEGACY_SAVE_KEY, "invalid");
        },
      },
    ];

    for (const scenario of scenarios) {
      const values = new Map(sources.map(({ key, raw }) => [key, raw]));
      scenario.mutate(values);
      const historicalBeforeLoad = new Map(sources.map(({ key }) => [key, values.get(key)]));
      const selected = sources[scenario.expectedIndex];
      if (selected?.expected === undefined)
        throw new Error("Missing historical precedence expectation");
      const writtenKeys: string[] = [];
      const boundary = createPersistenceBoundary({
        page: { addEventListener: () => undefined, removeEventListener: () => undefined },
        storage: {
          getItem: (key) => values.get(key) ?? null,
          removeItem: (key) => values.delete(key),
          setItem: (key, value) => {
            writtenKeys.push(key);
            values.set(key, value);
          },
        },
      });
      const loaded = boundary.load(fallback(), 100);

      expectFixtureState(loaded, selected.expected);
      expect(values.get(selected.key)).toBe(selected.raw);
      expect(values.get(SAVE_V4_KEY)).toBe(encodeSave(loaded));
      expect(writtenKeys).toEqual([SAVE_V4_KEY]);
      for (const source of sources) {
        expect(values.get(source.key)).toBe(historicalBeforeLoad.get(source.key));
      }
    }
  });

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

  it("keeps the authentic encounter-2170 V3 ahead of lower historical saves", () => {
    const v3 = JSON.stringify(v3Encounter2170Fixture);
    const legacy = JSON.stringify(legacyV2Fixture);
    const values = new Map<string, string>([
      [SAVE_V3_KEY, v3],
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

    const migrated = boundary.load(fallback(), 100);
    expect(migrated).toMatchObject({
      automaticUnlocked: true,
      coins: 427_622_176,
      enemy: { encounter: 2170, grade: "boss" },
      player: { automaticSpeedLevel: 4093, damageLevel: 5620 },
    });
    expect(migrated.enemy.health / migrated.enemy.maxHealth).toBeCloseTo(1_805_505 / 19_373_445, 5);
    expect(values.get(SAVE_V3_KEY)).toBe(v3);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);

    const currentV4 = values.get(SAVE_V4_KEY);
    expect(currentV4).toBeDefined();
    expect(boundary.load(fallback(), 200).enemy.encounter).toBe(2170);
    values.set(SAVE_V4_KEY, encodeSave({ ...fallback(), coins: 1 }));
    expect(boundary.load(fallback(), 250).coins).toBe(1);
    expect(boundary.restorePreviousVersion(300).state).toMatchObject({
      coins: 427_622_176,
      enemy: { encounter: 2170 },
    });
    expect(values.get(SAVE_V3_KEY)).toBe(v3);
    expect(values.get(LEGACY_SAVE_KEY)).toBe(legacy);

    const corrupted = JSON.parse(v3) as Record<string, unknown>;
    corrupted.enemy = {
      ...(corrupted.enemy as Record<string, unknown>),
      reward: 67_534_741,
    };
    values.set(SAVE_V3_KEY, JSON.stringify(corrupted));
    values.delete(SAVE_V4_KEY);
    expect(boundary.load(fallback(), 400).enemy.encounter).toBe(legacyV2Fixture.enemy.encounter);
  });

  it("does not let a stale failed autosave overwrite a successful V3 Restore", () => {
    const v3 = JSON.stringify(v3Encounter2170Fixture);
    const values = new Map<string, string>([[SAVE_V3_KEY, v3]]);
    const timers = new Map<number, () => void>();
    let writable = false;
    const boundary = createPersistenceBoundary({
      debounceMs: 1,
      page: { addEventListener: () => undefined, removeEventListener: () => undefined },
      storage: {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => {
          if (!writable) throw new Error("quota");
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
    boundary.onStateChanged({ ...fallback(), coins: 1 });
    timers.get(1)?.();
    writable = true;

    expect(boundary.restorePreviousVersion(100).state?.enemy.encounter).toBe(2170);
    const restored = values.get(SAVE_V4_KEY);
    timers.get(1)?.();
    expect(values.get(SAVE_V4_KEY)).toBe(restored);
    expect(JSON.parse(restored ?? "")).toMatchObject({ coins: 427_622_176 });
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
    const oldActiveV3 = JSON.stringify(v3GoldenFixture);
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
    const legacy = v3GoldenHighApsFixture;
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
