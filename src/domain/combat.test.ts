import { describe, expect, it } from "vitest";

import {
  armorPenetrationForLevel,
  attack,
  automaticInterval,
  COMBAT_BALANCE,
  criticalChanceForLevel,
  createCombatState,
  damageForLevel,
  doubleRewardChanceForLevel,
  purchaseUpgrade,
  spawnEnemy,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
} from "./combat";
import { simulateProgression } from "./progression-simulator";
import { UPGRADE_DISPLAY_ORDER } from "./combat/upgrades";

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
      armorPreventedDamage: 387767,
      automaticAttacks: 5842,
      bosses: [
        { elapsedMs: 907468.752117449, encounter: 35 },
        { elapsedMs: 2960992.2615383873, encounter: 70 },
        { elapsedMs: 4824837.422828496, encounter: 105 },
      ],
      coins: 37715,
      elapsedMs: 4824837.422828496,
      encounters: 106,
      manualAttacks: 0,
      penetration: 0.375,
      purchases: {
        "armor-penetration": 20,
        "automatic-speed": 11,
        "automatic-unlock": 1,
        "critical-chance": 9,
        damage: 64,
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
