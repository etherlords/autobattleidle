import { describe, expect, it } from "vitest";

import {
  armorPenetrationForLevel,
  attack,
  automaticInterval,
  criticalChanceForLevel,
  createCombatState,
  damageForLevel,
  doubleRewardChanceForLevel,
  purchaseUpgrade,
  spawnEnemy,
  upgradeCost,
  upgradeDisabledReason,
} from "./combat";
import { simulateProgression } from "./progression-simulator";

const expectReferenceStrategy = (report: ReturnType<typeof simulateProgression>): void => {
  const [firstBoss, secondBoss, thirdBoss] = report.bosses;
  if (firstBoss === undefined || secondBoss === undefined || thirdBoss === undefined)
    throw new Error("Expected three boss encounters");
  const secondGap = secondBoss.elapsedMs - firstBoss.elapsedMs;
  const thirdGap = thirdBoss.elapsedMs - secondBoss.elapsedMs;
  expect(firstBoss.elapsedMs).toBeGreaterThan(540_000);
  expect(firstBoss.elapsedMs).toBeLessThan(660_000);
  expect(secondGap).toBeGreaterThan(firstBoss.elapsedMs);
  expect(thirdGap).toBeGreaterThan(secondGap);
  const repeatablePurchases =
    report.purchases.damage +
    report.purchases["armor-penetration"] +
    report.purchases["automatic-speed"] +
    report.purchases["critical-chance"] +
    report.purchases["double-reward"];
  expect(repeatablePurchases).toBeLessThanOrEqual(report.encounters - 1);
};

describe("endless combat progression", () => {
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
    const highestBoss = Math.floor(Number.MAX_SAFE_INTEGER / 3 / 15) * 15;
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
      armorPreventedDamage: 50313,
      automaticAttacks: 2262,
      bosses: [
        { elapsedMs: 596085.714285711, encounter: 15 },
        { elapsedMs: 1296381.36645964, encounter: 30 },
        { elapsedMs: 2135163.9751553102, encounter: 45 },
      ],
      coins: 18081,
      elapsedMs: 2135163.9751553102,
      encounters: 46,
      manualAttacks: 0,
      penetration: 0.25,
      purchases: {
        "armor-penetration": 10,
        "automatic-speed": 3,
        "automatic-unlock": 1,
        "critical-chance": 0,
        damage: 31,
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
