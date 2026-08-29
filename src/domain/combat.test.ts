import { describe, expect, it } from "vitest";

import {
  armorPenetrationForLevel,
  attack,
  automaticAttacksPerSecond,
  automaticInterval,
  COMBAT_BALANCE,
  criticalChanceForLevel,
  createCombatState,
  damageForLevel,
  doubleRewardChanceForLevel,
  purchaseUpgrade,
  spawnGoldenBug,
  type CombatState,
  spawnEnemy,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
} from "./combat";
import { simulateProgression } from "./progression-simulator";
import { UPGRADE_DISPLAY_ORDER } from "./combat/upgrades";
import { MAX_ENCOUNTER } from "./combat/balance";

const expectReferenceStrategy = (report: ReturnType<typeof simulateProgression>): void => {
  const [firstBoss, secondBoss, thirdBoss] = report.bosses;
  if (firstBoss === undefined || secondBoss === undefined || thirdBoss === undefined)
    throw new Error("Expected three boss encounters");
  const secondGap = secondBoss.elapsedMs - firstBoss.elapsedMs;
  const thirdGap = thirdBoss.elapsedMs - secondBoss.elapsedMs;
  expect(firstBoss.encounter).toBe(COMBAT_BALANCE.bossInterval);
  expect(secondBoss.encounter).toBe(COMBAT_BALANCE.bossInterval * 2);
  expect(thirdBoss.encounter).toBe(COMBAT_BALANCE.bossInterval * 3);
  expect(firstBoss.elapsedMs).toBeGreaterThan(0);
  expect(secondGap).toBeGreaterThan(0);
  expect(thirdGap).toBeGreaterThan(0);
  const repeatablePurchases =
    report.purchases.damage +
    report.purchases["armor-penetration"] +
    report.purchases["automatic-speed"] +
    report.purchases["critical-chance"] +
    report.purchases["double-reward"];
  expect(repeatablePurchases).toBeLessThanOrEqual(report.encounters - 1);
};

describe("endless combat progression", () => {
  it("uses the bounded automatic APS curve and retains the elite slow interval", () => {
    const levels = [0, 1, 10, 50, 100, 200, 500, 1_000];
    const aps = levels.map(automaticAttacksPerSecond);
    expect(aps[0]).toBe(0.1);
    expect(aps[4]).toBeCloseTo(1, 1);
    expect(aps[5]).toBeCloseTo(2, 1);
    for (const value of aps) expect(value).toBeGreaterThan(0);
    for (let index = 1; index < aps.length; index += 1)
      expect(aps[index]).toBeGreaterThan(aps[index - 1] ?? 0);
    expect(automaticAttacksPerSecond(1_000)).toBeLessThan(3);
    expect(automaticAttacksPerSecond(Number.MAX_SAFE_INTEGER)).toBeLessThan(3);
    const player = { ...createCombatState().player, automaticSpeedLevel: 200 };
    expect(automaticInterval(spawnEnemy(3, 0.67), player)).toBeCloseTo(
      1_000 / automaticAttacksPerSecond(200) + COMBAT_BALANCE.eliteAutomaticSlowMs,
    );
  });

  it("spawns one Golden Bug after encounter 50, resumes encounter 51, and awards its fixed reward once", () => {
    const ordinary = spawnEnemy(50, 0);
    const initial = { ...createCombatState(), enemy: { ...ordinary, health: 1 } };
    const spawned = attack(initial, {
      atMs: 0,
      enemyId: ordinary.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    expect(spawned.state.goldenBug).toEqual({ id: 50, resumeEncounter: 51 });
    expect(spawned.state.enemy).toEqual(spawnGoldenBug(51, initial.player));
    const killed = attack(
      { ...spawned.state, enemy: { ...spawned.state.enemy, health: 1 } },
      {
        atMs: 1,
        enemyId: spawned.state.enemy.id,
        rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
        source: "manual",
      },
    );
    expect(killed.event).toMatchObject({ defeated: true, reward: spawnEnemy(51, 0).reward * 10 });
    expect(killed.state).toMatchObject({ goldenBug: null, enemy: spawnEnemy(51, 0) });
  });

  it("keeps Golden Bug above automatic-only damage while 10Hz manual input preserves the automatic cooldown", () => {
    const player = createCombatState().player;
    let state: CombatState = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 1_000,
    };
    for (let atMs = 1_000; atMs <= 10_000; atMs += 1_000)
      state = attack(state, {
        atMs,
        enemyId: state.enemy.id,
        rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
        source: "automatic",
      }).state;
    expect(state.enemy.health).toBeGreaterThan(0);
    const beforeCooldown = state.nextAutomaticAttackAtMs;
    for (let atMs = 0; atMs < 10_000 && state.goldenBug !== null; atMs += 100)
      state = attack(state, {
        atMs,
        enemyId: state.enemy.id,
        rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
        source: "manual",
      }).state;
    expect(state.goldenBug).toBeNull();
    expect(state.nextAutomaticAttackAtMs).toBe(beforeCooldown);
  });
  it("defeats only the fresh starter enemy on the tenth baseline manual attack", () => {
    let state = createCombatState();
    expect(state.enemy).toMatchObject({ encounter: 1, health: 10, maxHealth: 10 });
    for (let index = 0; index < 9; index += 1) {
      const result = attack(state, {
        atMs: index,
        enemyId: state.enemy.id,
        rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
        source: "manual",
      });
      expect(result.event).toMatchObject({ critical: false, damage: 1, defeated: false });
      state = result.state;
    }
    expect(state.enemy.health).toBe(1);
    const result = attack(state, {
      atMs: 9,
      enemyId: state.enemy.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    expect(result.event).toMatchObject({ critical: false, damage: 1, defeated: true });
    expect(result.state.enemy).toEqual(spawnEnemy(2, 0));
  });

  it("keeps representative later enemies on their existing balance", () => {
    expect(spawnEnemy(2, 0)).toEqual({
      armor: 0,
      encounter: 2,
      grade: "veteran",
      health: 210,
      id: 2,
      maxHealth: 210,
      modifier: null,
      reward: 4,
    });
    expect(spawnEnemy(3, 0.34)).toEqual({
      armor: 0,
      encounter: 3,
      grade: "elite",
      health: 423,
      id: 3,
      maxHealth: 423,
      modifier: "health",
      reward: 7,
    });
    expect(spawnEnemy(35, 0)).toEqual({
      armor: 35,
      encounter: 35,
      grade: "boss",
      health: 1500,
      id: 35,
      maxHealth: 1500,
      modifier: null,
      reward: 420,
    });
  });

  it("uses normal encounter-1 balance after the safe rollover", () => {
    const state = {
      ...createCombatState(),
      enemy: { ...spawnEnemy(MAX_ENCOUNTER, 0), health: 1 },
    };
    const result = attack(state, {
      atMs: 0,
      enemyId: MAX_ENCOUNTER,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    expect(result.state.enemy).toEqual(spawnEnemy(1, 0));
    expect(result.state.enemy).toMatchObject({ health: 140, maxHealth: 140 });
  });

  it("keeps display order and behavior in one complete upgrade strategy registry", () => {
    expect(UPGRADES.map((upgrade) => upgrade.id)).toEqual(UPGRADE_DISPLAY_ORDER);
    expect(new Set(UPGRADE_DISPLAY_ORDER).size).toBe(UPGRADE_DISPLAY_ORDER.length);

    let state = { ...createCombatState(), coins: Number.MAX_SAFE_INTEGER };
    for (const id of UPGRADE_DISPLAY_ORDER) {
      const initialLevel = upgradeLevel(state, id);
      const purchase = purchaseUpgrade(state, id, 250);
      expect(upgradeCost(state, id)).toBeGreaterThan(0);
      expect(purchase.reason).toBeNull();
      expect(upgradeLevel(purchase.state, id)).toBe(initialLevel + 1);
      state = purchase.state;
    }
  });

  it("uses the same legacy player-level derivation for attacks and upgrades", () => {
    const state = {
      ...createCombatState({
        criticalChance: 0.2,
        damage: 10,
        doubleRewardChance: 0.1,
      }),
      coins: Number.MAX_SAFE_INTEGER,
    };
    expect(state.player).toMatchObject({
      criticalLevel: 2,
      damageLevel: 9,
      doubleRewardLevel: 1,
    });
    expect(upgradeLevel(state, "damage")).toBe(9);
    const result = attack(state, {
      atMs: 0,
      enemyId: state.enemy.id,
      rolls: { critical: 0, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (result.event.type === "ignored") throw new Error("Expected a hit");
    expect(result.event).toMatchObject({ critical: true, damage: damageForLevel(9) * 2 });
  });

  it("keeps repeatable upgrades finite, increasing, and available", () => {
    let state = { ...createCombatState(), coins: Number.MAX_SAFE_INTEGER };
    const first = upgradeCost(state, "damage");
    state = purchaseUpgrade(state, "damage", 0).state;
    expect(upgradeCost(state, "damage")).toBeGreaterThan(first);
    expect(upgradeDisabledReason(state, "damage")).toBeNull();
    const high = 1_000_000;
    expect(damageForLevel(high)).toBeGreaterThan(damageForLevel(high - 1));
    expect(armorPenetrationForLevel(high)).toBeGreaterThan(armorPenetrationForLevel(high - 1));
    expect(criticalChanceForLevel(high)).toBeGreaterThan(criticalChanceForLevel(high - 1));
    expect(doubleRewardChanceForLevel(high)).toBeGreaterThan(doubleRewardChanceForLevel(high - 1));
    expect(
      automaticInterval(spawnEnemy(1, 0), {
        ...createCombatState().player,
        automaticSpeedLevel: high,
      }),
    ).toBeLessThan(
      automaticInterval(spawnEnemy(1, 0), {
        ...createCombatState().player,
        automaticSpeedLevel: high - 1,
      }),
    );
    expect(armorPenetrationForLevel(high)).toBeLessThan(0.75);
    expect(
      upgradeDisabledReason({ ...state, player: { ...state.player, damageLevel: high } }, "damage"),
    ).toBeNull();
    expect(() => spawnEnemy(0, 0)).toThrow(RangeError);
    expect(() => spawnEnemy(Number.POSITIVE_INFINITY, 0)).toThrow(RangeError);
    const maxLevelState = {
      ...createCombatState(),
      coins: Number.MAX_SAFE_INTEGER,
      player: {
        ...createCombatState().player,
        damage: damageForLevel(Number.MAX_SAFE_INTEGER),
        damageLevel: Number.MAX_SAFE_INTEGER,
      },
    };
    const noOp = purchaseUpgrade(maxLevelState, "damage", 0);
    expect(Number.isSafeInteger(maxLevelState.player.damage)).toBe(true);
    expect(noOp.reason).toBe("Level cannot advance safely");
    expect(noOp.state).toBe(maxLevelState);
    const edgeState = {
      ...createCombatState(),
      automaticUnlocked: true,
      coins: Number.MAX_SAFE_INTEGER,
      player: {
        ...createCombatState().player,
        armorPenetrationLevel: Number.MAX_SAFE_INTEGER - 1,
        automaticSpeedLevel: Number.MAX_SAFE_INTEGER - 1,
        criticalLevel: Number.MAX_SAFE_INTEGER - 1,
        damage: damageForLevel(Number.MAX_SAFE_INTEGER - 1),
        damageLevel: Number.MAX_SAFE_INTEGER - 1,
        doubleRewardLevel: Number.MAX_SAFE_INTEGER - 1,
      },
    };
    for (const id of [
      "damage",
      "armor-penetration",
      "critical-chance",
      "double-reward",
      "automatic-speed",
    ] as const) {
      const purchase = purchaseUpgrade(edgeState, id, 0);
      expect(purchase.reason).toBe("Level cannot advance safely");
      expect(purchase.state).toBe(edgeState);
    }
  });

  it("advances encounter 100 into a finite 101", () => {
    const state = {
      ...createCombatState({ damageLevel: 100, damage: damageForLevel(100) }),
      enemy: { ...spawnEnemy(100, 0), health: 1 },
    };
    const result = attack(state, {
      atMs: 0,
      enemyId: 100,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    expect(result.state.enemy).toMatchObject({ encounter: 101, health: expect.any(Number) });
    expect(Number.isSafeInteger(result.state.enemy.reward)).toBe(true);
  });

  it("saturates the highest accepted boss reward safely", () => {
    const highestBoss =
      Math.floor(Number.MAX_SAFE_INTEGER / 3 / COMBAT_BALANCE.bossInterval) *
      COMBAT_BALANCE.bossInterval;
    expect(Number.isSafeInteger(spawnEnemy(highestBoss, 0).reward)).toBe(true);
  });

  it("uses bounded penetration before minimum damage", () => {
    const state = {
      ...createCombatState({ armorPenetrationLevel: 20, damageLevel: 10, damage: 33 }),
      enemy: { ...spawnEnemy(3, 0), armor: 40, health: 100 },
    };
    const result = attack(state, {
      atMs: 0,
      enemyId: state.enemy.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (result.event.type === "ignored") throw new Error("Expected a hit");
    expect(result.event.damage).toBeGreaterThan(1);
    expect(result.event.armorPreventedDamage).toBeGreaterThan(0);
  });

  it("produces a deterministic, finite multi-boss reference report", () => {
    const first = simulateProgression();
    expect(simulateProgression()).toEqual(first);
    expect(first).toEqual({
      armorPreventedDamage: 142681,
      automaticAttacks: 2780,
      bosses: [
        { elapsedMs: 8079407.359888906, encounter: 35 },
        { elapsedMs: 18222883.009831183, encounter: 70 },
        { elapsedMs: 25581417.26164943, encounter: 105 },
      ],
      coins: 36501,
      elapsedMs: 25581417.26164943,
      encounters: 106,
      manualAttacks: 0,
      penetration: 0.35526315789473684,
      purchases: {
        "armor-penetration": 18,
        "automatic-speed": 11,
        "automatic-unlock": 1,
        "critical-chance": 3,
        damage: 72,
        "double-reward": 0,
      },
    });
    expectReferenceStrategy(first);
    expect(first.automaticAttacks).toBeGreaterThan(0);
    expect(first.manualAttacks).toBe(0);
    expect(first.purchases.damage).toBeGreaterThan(0);
    expect(first.purchases["armor-penetration"]).toBeGreaterThan(0);
  });
});
