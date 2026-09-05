import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  armorPenetrationForLevel,
  armorPenetrationForPolicy,
  attack,
  automaticAttackPacketMultipliers,
  automaticPacketSchedule,
  automaticAttacksPerSecond,
  automaticInterval,
  BOSS_FAMILY_BALANCE,
  bossEncounterForOrdinal,
  bossGapForOrdinal,
  COMBAT_BALANCE,
  COMBAT_FORMULAS,
  criticalChanceForLevel,
  criticalChanceForPolicy,
  createCombatState,
  damageForLevel,
  doubleRewardChanceForLevel,
  effectiveArmor,
  expireGoldenBug,
  purchaseUpgrade,
  previousPlayerRelativeBossHealth,
  spawnGoldenBug,
  type CombatState,
  spawnEnemy,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeEffectPreview,
  upgradeLevel,
  selectEnemyFamilyIdentity,
} from "./combat";
import {
  fastForwardProgression,
  measureOrdinaryTtkStages,
  ORDINARY_TTK_STAGE_CONTRACT,
  ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS,
  type OrdinaryTtkStage,
  simulateProgression,
  summarizeOrdinaryTtkBands,
  summarizeTelemetry,
  type ProgressionReport,
} from "./progression-simulator";
import { buildMeasuredReport } from "./measured-report";
import { UPGRADE_DISPLAY_ORDER } from "./combat/upgrades";
import { MAX_ENCOUNTER } from "./combat/balance";
const expectReferenceStrategy = (report: ProgressionReport): void => {
  const [firstBoss, secondBoss, thirdBoss] = report.bosses;
  if (firstBoss === undefined || secondBoss === undefined || thirdBoss === undefined)
    throw new Error("Expected three boss encounters");
  const secondGap = secondBoss.elapsedMs - firstBoss.elapsedMs;
  const thirdGap = thirdBoss.elapsedMs - secondBoss.elapsedMs;
  expect([firstBoss.encounter, secondBoss.encounter, thirdBoss.encounter]).toEqual([
    bossEncounterForOrdinal(1),
    bossEncounterForOrdinal(2),
    bossEncounterForOrdinal(3),
  ]);
  expect([secondBoss.gap, thirdBoss.gap]).toEqual([bossGapForOrdinal(2), bossGapForOrdinal(3)]);
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
  it("keeps omitted simulator growth structurally identical and confines it to ordinary spawns", () => {
    expect(spawnEnemy(100, 0)).toEqual(spawnEnemy(100, 0, undefined));
    expect(spawnEnemy(100, 0, 0.005).maxHealth).not.toBe(spawnEnemy(100, 0).maxHealth);
    expect(spawnGoldenBug(100, createCombatState().player)).toEqual(
      spawnGoldenBug(100, createCombatState().player),
    );
  });

  it("retains the linear baseline after both exponential candidates exceed it", () => {
    const health = (rate: number, encounter: number) =>
      Math.round(COMBAT_BALANCE.baseEnemyHealth * (1 + rate) ** (encounter - 1));
    expect(spawnEnemy(100, 0, 0.005).maxHealth).toBe(health(0.005, 100));
    expect(spawnEnemy(100, 0, 0.008).maxHealth).toBe(health(0.008, 100));
    expect(spawnEnemy(100, 0, 0.008).maxHealth).toBeGreaterThan(
      spawnEnemy(100, 0, 0.005).maxHealth,
    );
    expect(spawnEnemy(100, 0).maxHealth).toBeLessThan(spawnEnemy(100, 0, 0.005).maxHealth);
  });

  it("uses a 12 APS automatic curve and bounded visual attack packets", () => {
    const levels = [0, 1, 10, 50, 100, 200, 500, 1_000];
    const aps = levels.map(automaticAttacksPerSecond);
    expect(aps[0]).toBe(0.1);
    expect(aps[4]).toBeCloseTo(6.05, 1);
    expect(aps[5]).toBeGreaterThan(2);
    for (const value of aps) expect(value).toBeGreaterThan(0);
    for (let index = 1; index < aps.length; index += 1)
      expect(aps[index]).toBeGreaterThan(aps[index - 1] ?? 0);
    expect(automaticAttacksPerSecond(1_000)).toBeGreaterThan(9);
    expect(automaticAttacksPerSecond(Number.MAX_SAFE_INTEGER)).toBeGreaterThan(11);
    expect(automaticAttacksPerSecond(Number.MAX_SAFE_INTEGER)).toBeLessThanOrEqual(12);
    expect(automaticAttackPacketMultipliers(3.3)).toEqual([1, 0.1]);
    expect(automaticAttackPacketMultipliers(6)).toEqual([1, 1]);
    expect(automaticAttackPacketMultipliers(10.2)).toEqual([1, 1, 1, 0.4]);
    const player = { ...createCombatState().player, automaticSpeedLevel: 200 };
    expect(automaticInterval(spawnEnemy(3, 0.67), player)).toBeCloseTo(
      1_000 / automaticAttacksPerSecond(200) + COMBAT_BALANCE.eliteAutomaticSlowMs,
    );
  });

  it("audits cadence-derived Golden Bug rewards across legal early, mid, and late resumes", () => {
    const bands = [
      {
        automaticSpeedLevel: 0,
        criticalLevel: 0,
        damageLevel: 5,
        goldenBeatsNearestBoss: true,
        resumeEncounter: 51,
        upgrade: "damage",
      },
      {
        automaticSpeedLevel: 0,
        criticalLevel: 5,
        damageLevel: 25,
        goldenBeatsNearestBoss: false,
        resumeEncounter: 101,
        upgrade: "critical-chance",
      },
      {
        automaticSpeedLevel: 25,
        criticalLevel: 0,
        damageLevel: 100,
        goldenBeatsNearestBoss: false,
        resumeEncounter: 1_001,
        upgrade: "automatic-speed",
      },
    ] as const;
    for (const band of bands) {
      const player = createCombatState({
        automaticSpeedLevel: band.automaticSpeedLevel ?? 0,
        criticalChance: criticalChanceForLevel(band.criticalLevel ?? 0),
        criticalLevel: band.criticalLevel ?? 0,
        damage: damageForLevel(band.damageLevel),
        damageLevel: band.damageLevel,
      }).player;
      const resumeEncounter = band.resumeEncounter;
      const ordinary = spawnEnemy(resumeEncounter, 0);
      const centerBossOrdinal = Math.max(1, Math.floor(resumeEncounter / 35));
      const nearestBossEncounter = [centerBossOrdinal - 1, centerBossOrdinal, centerBossOrdinal + 1]
        .filter((ordinal) => ordinal >= 1)
        .map((ordinal) => bossEncounterForOrdinal(ordinal))
        .reduce(
          (nearest, candidate) =>
            Math.abs(candidate - resumeEncounter) < Math.abs(nearest - resumeEncounter)
              ? candidate
              : nearest,
          bossEncounterForOrdinal(1),
        );
      const nearestBoss = spawnEnemy(nearestBossEncounter, 0);
      const golden = spawnGoldenBug(resumeEncounter, player);
      const reward = golden.reward;
      const upgradeState = {
        ...createCombatState(player, 0, band.upgrade === "automatic-speed"),
        coins: reward,
      };
      expect(reward).toBe(ordinary.reward * COMBAT_BALANCE.goldenBugRewardFactor);
      expect(reward).toBeGreaterThan(ordinary.reward);
      expect(nearestBoss.reward).toBeGreaterThan(ordinary.reward);
      expect(golden.reward > nearestBoss.reward).toBe(band.goldenBeatsNearestBoss);
      expect(upgradeDisabledReason(upgradeState, band.upgrade)).toBeNull();
      expect(reward).toBeGreaterThan(upgradeCost(upgradeState, band.upgrade));
      const automaticDamage =
        Math.ceil(COMBAT_BALANCE.goldenBugWindowMs / automaticInterval(spawnEnemy(1, 0), player)) *
        damageForLevel(band.damageLevel);
      expect(golden.maxHealth).toBeGreaterThan(
        automaticDamage * COMBAT_FORMULAS.criticalDamageMultiplier,
      );
    }
  });

  it("spawns one Golden Bug after encounter 50, resumes encounter 51, and applies double reward once", () => {
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
    expect(killed.event).toMatchObject({
      defeated: true,
      reward: spawnEnemy(51, 0).reward * COMBAT_BALANCE.goldenBugRewardFactor,
    });
    expect(killed.state).toMatchObject({
      goldenBug: null,
      goldenBugDefeats: 1,
      enemy: spawnEnemy(51, 0, undefined, initial.player),
    });
    const doubled = attack(
      {
        ...spawned.state,
        enemy: { ...spawned.state.enemy, health: 1 },
        player: { ...spawned.state.player, doubleRewardLevel: 20 },
      },
      {
        atMs: 1,
        enemyId: spawned.state.enemy.id,
        rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
        source: "manual",
      },
    );
    expect(doubled.event).toMatchObject({
      defeated: true,
      reward: spawnEnemy(51, 0).reward * COMBAT_BALANCE.goldenBugRewardFactor * 2,
    });
    expect(
      attack(doubled.state, {
        atMs: 2,
        enemyId: spawned.state.enemy.id,
        rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
        source: "manual",
      }),
    ).toMatchObject({ event: { type: "ignored" }, state: doubled.state });
  });

  it("keeps Golden Bug escape empty and saturates a single accepted reward", () => {
    const player = createCombatState().player;
    const active = {
      ...createCombatState(player),
      enemy: { ...spawnGoldenBug(51, player), health: 1, reward: Number.MAX_SAFE_INTEGER },
      goldenBug: { id: 50, resumeEncounter: 51 },
      coins: Number.MAX_SAFE_INTEGER - 1,
    };
    expect(expireGoldenBug(active)).toMatchObject({
      coins: Number.MAX_SAFE_INTEGER - 1,
      goldenBugDefeats: 0,
      goldenBug: null,
    });
    expect(
      attack(active, {
        atMs: 0,
        enemyId: active.enemy.id,
        rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
        source: "manual",
      }),
    ).toMatchObject({
      state: { coins: Number.MAX_SAFE_INTEGER },
    });
  });

  it("keeps ordinary health player-relative while giving bosses a bounded stage durability envelope", () => {
    const player = createCombatState({
      automaticSpeedLevel: 2_000,
      damageLevel: 10_000,
      damage: damageForLevel(10_000),
    }).player;
    const normal = spawnEnemy(1_999, 0, undefined, player);
    const veteran = spawnEnemy(2_000, 0, undefined, player);
    let eliteEncounter = 2_001;
    while (spawnEnemy(eliteEncounter, 0.34).grade !== "elite") eliteEncounter += 1;
    const elite = spawnEnemy(eliteEncounter, 0.34, undefined, player);
    const boss = spawnEnemy(bossEncounterForOrdinal(60), 0, undefined, player);
    const golden = spawnGoldenBug(2_001, player);
    expect(normal.maxHealth).toBe(damageForLevel(10_000));
    expect(veteran.maxHealth).toBe(damageForLevel(10_000) * 5);
    expect(elite.maxHealth).toBe(damageForLevel(10_000) * 15);
    expect(boss.maxHealth).toBeGreaterThan(damageForLevel(10_000) * 30);
    expect(normal.maxHealth).toBeGreaterThan(200);
    expect(golden.maxHealth).toBeGreaterThan(damageForLevel(10_000));
  });
  it("applies the Goose Hydra family multiplier to the bounded legacy max-health envelope", () => {
    const encounter = bossEncounterForOrdinal(5);
    const growth =
      COMBAT_FORMULAS.enemyHealthGrowthBase +
      (COMBAT_BALANCE.enemyHealthGrowth - COMBAT_FORMULAS.enemyHealthGrowthBase) * (encounter - 1);
    const legacyHealth =
      Math.round(COMBAT_BALANCE.baseEnemyHealth * growth) *
      (COMBAT_FORMULAS.bossHealthBaseMultiplier +
        COMBAT_FORMULAS.bossHealthIndexLinearMultiplier * 4 +
        COMBAT_FORMULAS.bossHealthIndexQuadraticMultiplier * 16);
    const goose = spawnEnemy(encounter, 0);
    expect(goose.grade).toBe("boss");
    expect(goose.maxHealth).toBe(legacyHealth);
    expect(goose.maxHealth).toBeLessThanOrEqual(legacyHealth * 1.1);
    expect(goose.reward).toBe(
      Math.round(
        COMBAT_BALANCE.baseReward *
          encounter *
          (COMBAT_FORMULAS.bossHealthBaseMultiplier +
            COMBAT_FORMULAS.bossHealthIndexLinearMultiplier * 4 +
            COMBAT_FORMULAS.bossHealthIndexQuadraticMultiplier * 16) *
          BOSS_FAMILY_BALANCE["boss-goose-hydra"].rewardMultiplier,
      ),
    );
    expect(goose.armor).toBe(encounter);
  });
  it("caps Goose Hydra's adjacent durability, TTK, and reward spike", () => {
    const player = createCombatState({
      automaticSpeedLevel: 1_000,
      damage: damageForLevel(1_000),
      damageLevel: 1_000,
    }).player;
    const bosses = [4, 5, 6].map((ordinal) =>
      simulateProgression({
        bossCount: 1,
        eventJump: true,
        initialPlayer: player,
        startEncounter: bossEncounterForOrdinal(ordinal),
      }).observations.find(({ grade }) => grade === "boss"),
    );
    const before = bosses[0];
    const goose = bosses[1];
    if (before === undefined || goose === undefined)
      throw new Error("Missing adjacent boss receipt");
    expect(goose.reward / before.reward).toBeLessThanOrEqual(2);
    expect(goose.timeToKillMs / before.timeToKillMs).toBeLessThanOrEqual(1.6);
    const previousHealth = spawnEnemy(bossEncounterForOrdinal(4), 0, undefined, player).maxHealth;
    const gooseHealth = spawnEnemy(bossEncounterForOrdinal(5), 0, undefined, player).maxHealth;
    expect(gooseHealth / previousHealth).toBeLessThanOrEqual(1.5);
    expect(BOSS_FAMILY_BALANCE["boss-goose-hydra"].rewardMultiplier).toBeLessThanOrEqual(1);
  });
  it("threads custom boss cadence through family balance and progression health", () => {
    const interval = 10;
    const first = spawnEnemy(interval, 0, undefined, undefined, interval);
    const second = spawnEnemy(interval * 2, 0, undefined, undefined, interval);
    const goose = spawnEnemy(interval * 5, 0, undefined, undefined, interval);
    expect(first.grade).toBe("boss");
    expect(second.grade).toBe("boss");
    expect(goose.grade).toBe("boss");
    expect(
      selectEnemyFamilyIdentity({
        bossInterval: interval,
        grade: "boss",
        level: interval * 5,
        modifier: null,
      }).family,
    ).toBe("boss-goose-hydra");
    expect(goose.armor).toBe(
      Math.round(interval * 5 * BOSS_FAMILY_BALANCE["boss-goose-hydra"].armorMultiplier),
    );
    expect(spawnEnemy(interval * 5, 0).grade).not.toBe("boss");
    expect(goose.reward).toBeGreaterThan(
      spawnEnemy(interval * 4, 0, undefined, undefined, interval).reward,
    );
  });

  it("keeps a scheduled late-run boss above the prior 30-hit save envelope", () => {
    const player = createCombatState({
      automaticSpeedLevel: 4_093,
      armorPenetrationLevel: 1_074,
      criticalChance: 0.589873417721519,
      criticalLevel: 1_165,
      damage: 6_370,
      damageLevel: 5_620,
      doubleRewardChance: 0.5941775836972343,
      doubleRewardLevel: 2_041,
    }).player;
    const boss = spawnEnemy(bossEncounterForOrdinal(60), 0, undefined, player);
    expect(boss.grade).toBe("boss");
    expect(previousPlayerRelativeBossHealth(player)).toBe(191_100);
    expect(boss.maxHealth).toBeGreaterThan(previousPlayerRelativeBossHealth(player));
  });

  it("finishes a warmed 48-hour event-jump receipt within the 8-second portable CI bound", () => {
    fastForwardProgression(48 * 60 * 60 * 1_000);
    const startedAtMs = performance.now();
    const report = fastForwardProgression(48 * 60 * 60 * 1_000);
    expect(report.elapsedMs).toBe(48 * 60 * 60 * 1_000);
    expect(performance.now() - startedAtMs).toBeLessThan(8_000);
  }, 18_000);

  it("keeps the event-driven 48-hour fast-forward equal to the production simulator at time boundaries", () => {
    const roundedTiming = (report: ReturnType<typeof simulateProgression>) => ({
      ...report,
      bosses: report.bosses.map((boss) => ({
        ...boss,
        elapsedMs: Math.round(boss.elapsedMs / 10),
      })),
      elapsedMs: Math.round(report.elapsedMs / 10),
      observations: report.observations.map((observation) => ({
        ...observation,
        timeToKillMs: Math.round(observation.timeToKillMs / 10),
      })),
    });
    for (const hours of [1, 4, 8, 24, 48, 49]) {
      const horizonMs = hours * 60 * 60 * 1_000;
      const fast = fastForwardProgression(horizonMs);
      const exact = simulateProgression({ horizonMs });
      expect(fast.elapsedMs).toBe(horizonMs);
      expect(exact.elapsedMs).toBe(horizonMs);
      expect(fast.state).toEqual(exact.state);
      expect(roundedTiming(fast)).toEqual(roundedTiming(exact));
    }
  }, 75_000);

  it("measures automatic, manual, and combined boss TTK at the 48-hour boundary", () => {
    const endgame = fastForwardProgression(48 * 60 * 60 * 1_000);
    const measure = (automaticEnabled: boolean, manualIntervalMs: number | null) => {
      const report = simulateProgression({
        automaticEnabled,
        bossCount: 1,
        eventJump: true,
        initialPlayer: endgame.player,
        manualIntervalMs,
        startEncounter: 36_365,
      });
      return report.observations.find(({ grade }) => grade === "boss");
    };
    const automatic = measure(true, null);
    const manual = measure(false, 100);
    const combined = measure(true, 100);
    expect(automatic?.timeToKillMs).toBeGreaterThan(0);
    expect(manual?.timeToKillMs).toBeGreaterThan(0);
    expect(combined?.timeToKillMs).toBeLessThan(automatic?.timeToKillMs ?? Infinity);
    expect(combined?.timeToKillMs).toBeLessThan(manual?.timeToKillMs ?? Infinity);
  }, 20_000);

  it("keeps the simulator Golden Bug expiry at one fixed window across automatic packets", () => {
    const player = createCombatState({
      automaticSpeedLevel: 1_000,
      damageLevel: 100,
      damage: damageForLevel(100),
    }).player;
    const report = simulateProgression({
      automaticEnabled: true,
      eventJump: true,
      initialPlayer: player,
      manualIntervalMs: null,
      startEncounter: 49,
      horizonMs: COMBAT_BALANCE.goldenBugWindowMs + 2_000,
    });
    expect(report.goldenBugDelayMs).toBe(COMBAT_BALANCE.goldenBugWindowMs);
    expect(report.state.goldenBug).toBeNull();
  });

  it("reduces Golden Bug HP with normal automatic damage before manual reward", () => {
    const player = createCombatState().player;
    let state: CombatState = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 1_000,
    };
    const initialHealth = state.enemy.health;
    const automatic = attack(state, {
      atMs: 1_000,
      enemyId: state.enemy.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "automatic",
    });
    expect(automatic.event).toMatchObject({
      type: "hit",
      damage: damageForLevel(0),
      defeated: false,
      reward: 0,
    });
    expect(automatic.state.enemy.health).toBe(initialHealth - damageForLevel(0));
    state = automatic.state;
    let manualReward = 0;
    for (let atMs = 2_000; atMs < 10_000 && state.goldenBug !== null; atMs += 100) {
      const result = attack(state, {
        atMs,
        enemyId: state.enemy.id,
        rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
        source: "manual",
      });
      if (result.event.type === "hit" && result.event.defeated) manualReward = result.event.reward;
      state = result.state;
    }
    expect(state.goldenBug).toBeNull();
    expect(manualReward).toBe(spawnEnemy(51, 0).reward * COMBAT_BALANCE.goldenBugRewardFactor);
    expect(state.goldenBugDefeats).toBe(1);
    expect(state.nextAutomaticAttackAtMs).toBe(11_000);
  });
  it("keeps Golden Bug nonlethal through the full four-packet critical automatic frame", () => {
    const player = createCombatState({
      automaticSpeedLevel: 1_000,
      damageLevel: 100,
      damage: damageForLevel(100),
    }).player;
    let state: CombatState = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 0,
    };
    const initialHealth = state.enemy.health;
    const schedule = automaticPacketSchedule(state, 0);
    expect(schedule.packets).toHaveLength(4);
    expect(
      schedule.packets.reduce((total, packet) => total + packet.damageMultiplier, 0),
    ).toBeCloseTo(
      automaticAttacksPerSecond(player.automaticSpeedLevel) /
        COMBAT_BALANCE.automaticVisualTickRate,
      12,
    );
    let damage = 0;
    for (const packet of schedule.packets) {
      const result = attack(state, {
        atMs: 0,
        automaticBatch: packet.automaticBatch,
        damageMultiplier: packet.damageMultiplier,
        enemyId: state.enemy.id,
        rolls: { critical: 0, doubleReward: 1, nextEliteModifier: 0 },
        source: "automatic",
      });
      expect(result.event).toMatchObject({ type: "hit", defeated: false, reward: 0 });
      expect(result.event.type === "hit" ? result.event.damage : 0).toBeGreaterThan(0);
      damage += result.event.type === "hit" ? result.event.damage : 0;
      state = result.state;
    }
    expect(state.enemy.health).toBe(initialHealth - damage);
    expect(state.goldenBug).toEqual({ id: 50, resumeEncounter: 51 });
  });
  it("budgets high-APS Golden Bug HP above the full critical automatic window", () => {
    const player = createCombatState({
      automaticSpeedLevel: 1_000,
      damageLevel: 100,
      damage: damageForLevel(100),
    }).player;
    const packetSchedule = automaticPacketSchedule(
      { ...createCombatState(player, 0, true), enemy: spawnGoldenBug(51, player) },
      0,
    );
    const criticalDamagePerFrame = packetSchedule.packets.reduce(
      (total, packet) =>
        total +
        Math.round(
          damageForLevel(100) * COMBAT_FORMULAS.criticalDamageMultiplier * packet.damageMultiplier,
        ),
      0,
    );
    expect(spawnGoldenBug(51, player).maxHealth).toBeGreaterThan(30 * criticalDamagePerFrame);
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
    expect(result.state.enemy).toEqual(spawnEnemy(2, 0, undefined, state.player));
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
      reward: 1,
    });
    expect(spawnEnemy(3, 0.34)).toEqual({
      armor: 0,
      encounter: 3,
      grade: "elite",
      health: 423,
      id: 3,
      maxHealth: 423,
      modifier: "health",
      reward: 2,
    });
    expect(spawnEnemy(35, 0)).toEqual({
      armor: 35,
      encounter: 35,
      grade: "boss",
      health: 1500,
      id: 35,
      maxHealth: 1500,
      modifier: null,
      reward: 105,
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
    expect(result.state.enemy).toEqual(spawnEnemy(1, 0, undefined, state.player));
    expect(result.state.enemy).toMatchObject({ health: 1, maxHealth: 1 });
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
      expect(upgradeLevel(purchase.state, id)).toBeGreaterThan(initialLevel);
      state = purchase.state;
    }
  });

  it("previews the exact displayed gain from the same next level that purchase applies", () => {
    const state = {
      ...createCombatState(),
      automaticUnlocked: true,
      coins: Number.MAX_SAFE_INTEGER,
    };
    for (const id of [
      "damage",
      "armor-penetration",
      "critical-chance",
      "double-reward",
      "automatic-speed",
    ] as const) {
      const preview = upgradeEffectPreview(state, id);
      expect(preview).toMatchObject({ kind: "delta" });
      if (preview === null || preview.kind !== "delta")
        throw new Error("Expected a numeric preview");
      const purchase = purchaseUpgrade(state, id, 0);
      expect(upgradeLevel(purchase.state, id)).toBe(preview.targetLevel);
      expect(preview.delta).toBeGreaterThan(0);
    }
    expect(upgradeEffectPreview(createCombatState(), "automatic-unlock")).toEqual({
      kind: "unlock",
    });
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

  it("finds the next displayed asymptotic upgrade quantum without a linear scan", () => {
    const state = {
      ...createCombatState(),
      coins: Number.MAX_SAFE_INTEGER,
      player: { ...createCombatState().player, criticalLevel: 1_000_000 },
    };
    const purchase = purchaseUpgrade(state, "critical-chance", 0);
    expect(purchase.reason).toBeNull();
    expect(purchase.state.player.criticalLevel).toBeGreaterThan(1_000_000);
    expect(upgradeDisabledReason(purchase.state, "critical-chance")).toBe(
      "Level cannot advance safely",
    );
  });

  it("combines skipped levels into one preview and exposes no terminal gain", () => {
    const state = {
      ...createCombatState(),
      coins: Number.MAX_SAFE_INTEGER,
      player: { ...createCombatState().player, criticalLevel: 1_000_000 },
    };
    const preview = upgradeEffectPreview(state, "critical-chance");
    expect(preview).toMatchObject({ kind: "delta" });
    if (preview === null || preview.kind !== "delta") throw new Error("Expected a numeric preview");
    expect(preview.targetLevel).toBeGreaterThan(1_000_001);
    expect(preview.delta).toBeGreaterThan(0);
    const endpoint = {
      ...state,
      player: { ...state.player, damageLevel: Number.MAX_SAFE_INTEGER },
    };
    expect(upgradeEffectPreview(endpoint, "damage")).toBeNull();
  });

  it("treats rounded 12.00 APS as the terminal automatic-speed quantum", () => {
    const state = {
      ...createCombatState(),
      automaticUnlocked: true,
      coins: Number.MAX_SAFE_INTEGER,
      player: { ...createCombatState().player, automaticSpeedLevel: 5_000 },
    };
    expect(automaticAttacksPerSecond(state.player.automaticSpeedLevel).toFixed(2)).toBe("12.00");
    expect(upgradeDisabledReason(state, "automatic-speed")).toBe("Level cannot advance safely");
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

  it("caps elite armor against the current damage budget without touching bosses", () => {
    const player = createCombatState({
      armorPenetrationLevel: 5,
      damage: damageForLevel(6),
      damageLevel: 6,
    }).player;
    const armored = spawnEnemy(36, 0, undefined, player);
    const hardened = spawnEnemy(48, 0.76, undefined, player);
    const highPenetration = spawnEnemy(57, 0, undefined, {
      ...player,
      armorPenetrationLevel: Number.MAX_SAFE_INTEGER - 1,
    });
    const boss = spawnEnemy(35, 0, undefined, player);
    expect(armored).toMatchObject({ armor: 15, maxHealth: 310, modifier: "armor" });
    expect(hardened).toMatchObject({ armor: 15, maxHealth: 388, modifier: "hardened" });
    expect(effectiveArmor(armored.armor, player.armorPenetrationLevel ?? 0)).toBe(12);
    expect(Math.ceil(armored.maxHealth / (player.damage - 12))).toBeLessThanOrEqual(20);
    expect(Math.ceil(hardened.maxHealth / (player.damage - 12))).toBeLessThanOrEqual(25);
    expect(effectiveArmor(highPenetration.armor, Number.MAX_SAFE_INTEGER - 1)).toBeLessThan(12);
    expect(boss.armor).toBe(35);
  });

  it("keeps reported early armored elites below the adjacent boss with readable hit receipts", () => {
    const player = createCombatState({
      armorPenetrationLevel: 5,
      damage: damageForLevel(6),
      damageLevel: 6,
    }).player;
    const hit = (enemy: ReturnType<typeof spawnEnemy>) => {
      const result = attack(
        { ...createCombatState(player), enemy },
        {
          atMs: 0,
          enemyId: enemy.id,
          rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
          source: "manual",
        },
      );
      if (result.event.type === "ignored") throw new Error("Expected a manual hit");
      return result.event;
    };
    const armored36 = spawnEnemy(36, 0, undefined, player);
    const hardened48 = spawnEnemy(48, 0.76, undefined, player);
    const armored57 = spawnEnemy(57, 0, undefined, player);
    const boss35 = spawnEnemy(35, 0, undefined, player);

    expect(armored36).toMatchObject({ armor: 15, health: 310, modifier: "armor" });
    expect(hardened48).toMatchObject({ armor: 15, health: 388, modifier: "hardened" });
    expect(armored57).toMatchObject({ armor: 15, health: 310, modifier: "armor" });
    expect(effectiveArmor(armored36.armor, player.armorPenetrationLevel ?? 0)).toBe(12);
    expect(hit(armored36)).toMatchObject({ damage: 19, penetration: 0.15 });
    expect(hit(hardened48)).toMatchObject({ damage: 19, penetration: 0.15 });
    expect(hit(armored57)).toMatchObject({ damage: 19, penetration: 0.15 });
    expect(Math.ceil(armored36.maxHealth / 19)).toBe(17);
    expect(Math.ceil(hardened48.maxHealth / 19)).toBe(21);
    expect(Math.ceil(armored57.maxHealth / 19)).toBe(17);
    expect(hit(boss35).damage).toBeLessThan(19);
  });

  it("produces a deterministic, finite multi-boss reference report", () => {
    const first = simulateProgression();
    expect(simulateProgression()).toEqual(first);
    expect(first.bosses.map(({ encounter }) => encounter)).toEqual([
      bossEncounterForOrdinal(1),
      bossEncounterForOrdinal(2),
      bossEncounterForOrdinal(3),
    ]);
    expect(first.elapsedMs).toBeGreaterThan(0);
    expect(first.coins).toBeGreaterThan(0);
    expect(first.observations.length).toBeGreaterThanOrEqual(105);
    expect(first.byGrade.elite.tenPlusFraction).toBeGreaterThan(0);
    expectReferenceStrategy(first);
    expect(first.automaticAttacks).toBeGreaterThan(0);
    expect(first.manualAttacks).toBe(0);
    expect(first.purchases.damage).toBeGreaterThan(0);
    expect(first.purchases["armor-penetration"]).toBeGreaterThan(0);
  });

  it("reports deterministic 3,000-ordinary-enemy telemetry without a second combat engine", () => {
    const report = simulateProgression({ bossCount: 0, ordinaryEncounters: 3_000 });
    expect(
      report.observations.filter(({ grade }) => grade !== "boss").length,
    ).toBeGreaterThanOrEqual(3_000);
    expect(report.byGrade.normal.p90).toBeGreaterThan(0);
    expect(report.ordinaryWallsOver60Seconds).toBeGreaterThanOrEqual(0);
  });

  it("routes alternative chance and penetration formulas through production attack resolution", () => {
    expect(criticalChanceForPolicy(20, "linear-capped")).not.toBe(criticalChanceForLevel(20));
    expect(armorPenetrationForPolicy(20, "linear-capped")).not.toBe(armorPenetrationForLevel(20));
    const state = {
      ...createCombatState({ criticalLevel: 20, damageLevel: 100, armorPenetrationLevel: 20 }),
      enemy: { ...spawnEnemy(3, 0), armor: 100, health: 10_000 },
    };
    const command = {
      atMs: 0,
      enemyId: state.enemy.id,
      rolls: { critical: 0.35, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual" as const,
    };
    const current = attack(state, command);
    const alternative = attack(state, {
      ...command,
      armorPenetrationPolicy: "linear-capped",
      criticalChancePolicy: "linear-capped",
    });
    expect(current.event).toMatchObject({ critical: false });
    expect(alternative.event).toMatchObject({ critical: true });
    if (current.event.type === "ignored" || alternative.event.type === "ignored")
      throw new Error("Expected production hits");
    expect(alternative.event.damage).toBeGreaterThan(current.event.damage);
  });

  it("keeps Golden Bug observations out of ordinary distributions", () => {
    const report = simulateProgression({ bossCount: 0, ordinaryEncounters: 100 });
    const golden = report.observations.filter(({ goldenBug }) => goldenBug);
    expect(golden).not.toHaveLength(0);
    const ordinaryNormals = report.observations.filter(
      ({ grade, goldenBug }) => grade === "normal" && !goldenBug,
    );
    expect(report.byGrade.normal.count).toBe(ordinaryNormals.length);
    expect(summarizeTelemetry(report).grades.normal.count).toBe(ordinaryNormals.length);
    const ordinary = report.observations.filter(
      ({ grade, goldenBug }) => grade !== "boss" && !goldenBug,
    );
    const expectedTransitions = ordinary
      .slice(1)
      .reduce<Record<string, number>>((counts, value, index) => {
        const previous = ordinary[index];
        if (previous !== undefined && previous.grade !== value.grade) {
          const key = `${previous.grade}->${value.grade}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
      }, {});
    expect(report.observations.some(({ goldenBug }) => goldenBug)).toBe(true);
    expect(summarizeTelemetry(report).gradeTransitions).toEqual(expectedTransitions);
  });

  it("keeps a candidate curve across a skipped boss boundary", () => {
    const report = simulateProgression({
      bossCount: 0,
      ordinaryEncounters: 36,
      ordinaryHealthGrowthRate: 0.005,
    });
    const encounter36 = report.observations.find(({ encounter }) => encounter === 36);
    expect(encounter36?.hits).toBeGreaterThan(0);
    expect(spawnEnemy(36, 0, 0.005).maxHealth).toBeGreaterThan(spawnEnemy(36, 0).maxHealth);
    expect(spawnEnemy(35, 0, 0.005)).toEqual(spawnEnemy(35, 0));
    expect(spawnGoldenBug(51, createCombatState().player)).toEqual(
      spawnGoldenBug(51, createCombatState().player),
    );
  });

  it("generates the frozen report telemetry deterministically", () => {
    const first = summarizeTelemetry(
      simulateProgression({ bossCount: 0, ordinaryEncounters: 3_000, manualIntervalMs: 100 }),
    );
    expect(
      summarizeTelemetry(
        simulateProgression({ bossCount: 0, ordinaryEncounters: 3_000, manualIntervalMs: 100 }),
      ),
    ).toEqual(first);
    expect(first.modifiers.armor.max).toBeGreaterThan(0);
    expect(first.adjacentMedianJump).toBeGreaterThanOrEqual(0);
    expect(first.armor.prevented).toBeGreaterThan(0);
  }, 7_000);

  it("reports production ordinary TTK composition across the ABI-020 endgame boundary", () => {
    // Goose Hydra durability slows progression; retain every stage probe by extending this
    // measured run beyond the historical 49-hour receipt.
    const automaticReport = fastForwardProgression(60 * 60 * 60 * 1_000);
    const automaticOnly = summarizeOrdinaryTtkBands(automaticReport);
    const stageStarts = Object.values(ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS);
    const stageReference = simulateProgression({
      eventJump: true,
      horizonMs: 60 * 60 * 60 * 1_000,
      playerSnapshotEncounters: stageStarts,
    });
    const stagePlayers = Object.fromEntries(
      stageReference.playerSnapshots.map(({ encounter, player }) => [
        Object.entries(ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS).find(
          ([, probeEncounter]) => probeEncounter === encounter,
        )?.[0],
        player,
      ]),
    ) as Record<OrdinaryTtkStage, typeof stageReference.player>;
    expect(Object.keys(stagePlayers)).toHaveLength(ORDINARY_TTK_STAGE_CONTRACT.length);
    const manualOnly = measureOrdinaryTtkStages({
      automaticEnabled: false,
      criticalRoll: 0.99,
      manualIntervalMs: 100,
      stagePlayers,
    });
    const combined = measureOrdinaryTtkStages({
      criticalRoll: 0.99,
      manualIntervalMs: 100,
      stagePlayers,
    });

    expect(ORDINARY_TTK_STAGE_CONTRACT).toEqual([
      ["early", 1, 99],
      ["startPlus", 100, 499],
      ["lateStart", 500, 999],
      ["midgame", 1_000, 9_999],
      ["endgameStart", 10_000, 36_364],
      ["endgame", 36_365, Number.MAX_SAFE_INTEGER],
    ]);
    expect(ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS.endgame).toBe(36_365);
    const endgameSnapshot = stageReference.playerSnapshots.find(
      ({ encounter }) => encounter === ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS.endgame,
    );
    expect(stageReference.bosses.some(({ encounter }) => encounter < 36_365)).toBe(true);
    expect(endgameSnapshot).toEqual(
      expect.objectContaining({
        player: expect.objectContaining({ damageLevel: expect.any(Number) }),
      }),
    );
    expect(stagePlayers.endgame).toEqual(endgameSnapshot?.player);
    const endgameProbe = simulateProgression({
      bossCount: 0,
      eventJump: true,
      initialPlayer: stagePlayers.endgame,
      ordinaryEncounters: 3,
      skipBosses: false,
      startEncounter: ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS.endgame,
    });
    expect(endgameProbe.observations[0]).toMatchObject({
      encounter: ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS.endgame,
      goldenBug: false,
    });
    expect(endgameProbe.observations[0]?.grade).not.toBe("boss");
    expect(automaticReport.encounters).toBeGreaterThan(40_000);
    expect(automaticOnly.endgame.count).toBeGreaterThan(0);
    for (const stage of Object.values(automaticOnly)) {
      expect(stage.count).toBeGreaterThan(0);
      expect(stage.fivePlusFraction).toBeGreaterThan(0);
      expect(stage.tenPlusFraction).toBeGreaterThan(0);
    }
    for (const stage of Object.values(manualOnly)) {
      expect(stage.count).toBeGreaterThan(0);
      expect(stage.oneHitFraction).toBeGreaterThan(0);
      expect(stage.fivePlusFraction).toBeGreaterThan(0);
      expect(stage.tenPlusFraction).toBeGreaterThan(0);
    }
    for (const stage of Object.values(combined)) {
      expect(stage.count).toBeGreaterThan(0);
      expect(stage.oneHitFraction).toBeGreaterThan(0);
      expect(stage.fivePlusFraction).toBeGreaterThan(0);
    }
    expect(combined).not.toEqual(manualOnly);
  }, 15_000);

  it("uses effective attack units instead of raw fractional automatic packet events", () => {
    const report = simulateProgression({
      automaticSpeedLevel: 200,
      bossCount: 0,
      ordinaryEncounters: 100,
      eventJump: true,
    });
    const fractionalPacketObservation = report.ttkObservations.find(
      ({ effectiveAttackUnits, packetEvents }) => packetEvents > effectiveAttackUnits,
    );
    expect(fractionalPacketObservation).toMatchObject({ packetEvents: expect.any(Number) });
    expect(fractionalPacketObservation?.effectiveAttackUnits).toBeLessThan(
      fractionalPacketObservation?.packetEvents ?? 0,
    );
    const firstOrdinarySequence = report.ttkObservations
      .filter(
        ({ encounter, goldenBug, grade }) => encounter <= 34 && !goldenBug && grade !== "boss",
      )
      .map(({ encounter }) => encounter);
    expect(firstOrdinarySequence).toEqual(Array.from({ length: 34 }, (_, index) => index + 1));
    const staged = summarizeOrdinaryTtkBands(report);
    expect(staged.early.oneHitFraction).toBeGreaterThan(0);
    expect(staged.early.fivePlusFraction).toBeGreaterThan(0);
  });

  it("keeps manual-only scheduling out of returned combat state", () => {
    const report = simulateProgression({
      automaticEnabled: false,
      bossCount: 0,
      manualIntervalMs: 100,
      ordinaryEncounters: 100,
    });
    const values = [
      report.state.coins,
      report.state.enemy.armor,
      report.state.enemy.encounter,
      report.state.enemy.health,
      report.state.enemy.id,
      report.state.enemy.maxHealth,
      report.state.enemy.reward,
      report.state.goldenBugDefeats,
      report.state.nextAutomaticAttackAtMs,
      report.state.player.armorPenetrationLevel,
      report.state.player.automaticSpeedLevel,
      report.state.player.criticalChance,
      report.state.player.criticalLevel,
      report.state.player.damage,
      report.state.player.damageLevel,
      report.state.player.doubleRewardChance,
      report.state.player.doubleRewardLevel,
    ].filter((value): value is number => value !== undefined);
    expect(report.automaticAttacks).toBe(0);
    expect(report.state.automaticUnlocked).toBe(false);
    expect(report.purchases["automatic-unlock"]).toBe(0);
    expect(report.purchases["automatic-speed"]).toBe(0);
    for (const value of values) {
      expect(Number.isFinite(value)).toBe(true);
      expect(
        Number.isSafeInteger(value) ||
          value === report.state.player.criticalChance ||
          value === report.state.player.doubleRewardChance,
      ).toBe(true);
    }
  });

  it("matches the committed ABI-029 affinity measured report JSON", () => {
    const raw = readFileSync(
      new URL(
        "../../plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-029-compose-deterministic-elemental-enemy-variants-from-reusable/MEASURED-REPORT-AFFINITY.json",
        import.meta.url,
      ),
      "utf8",
    );
    expect(JSON.parse(raw)).toEqual(buildMeasuredReport());
  }, 60_000);

  it("records derived candidate rejections and named TTK bands", () => {
    const report = buildMeasuredReport() as {
      candidates: Record<
        string,
        {
          rejectionReasons: readonly string[];
          telemetry: { bands: Record<string, { timeToKillMs: { p90: number } }> };
        }
      >;
    };
    const first = report.candidates.exponential005;
    const second = report.candidates.exponential008;
    expect(first?.rejectionReasons.length).toBeGreaterThan(0);
    expect(second?.rejectionReasons.length).toBeGreaterThan(0);
    expect(first?.telemetry.bands.encounters100To149?.timeToKillMs.p90).toBeGreaterThan(0);
    expect(second?.telemetry.bands.encounters100To149?.timeToKillMs.p90).toBeGreaterThan(
      first?.telemetry.bands.encounters100To149?.timeToKillMs.p90 ?? 0,
    );
  });

  it("measures every declared alternative across 3,000 production encounters", () => {
    const report = buildMeasuredReport() as {
      alternatives: Record<
        string,
        {
          input: Record<string, number | string>;
          measured: { evaluatedOrdinaryEncounters: number };
          reason: string;
        }
      >;
    };
    expect(Object.keys(report.alternatives).sort()).toEqual([
      "attackSpeed",
      "cadence",
      "critical",
      "damage",
      "penetration",
      "reward",
      "upgradeCost",
    ]);
    for (const alternative of Object.values(report.alternatives)) {
      expect(Object.keys(alternative.input)).not.toHaveLength(0);
      expect(alternative.measured.evaluatedOrdinaryEncounters).toBeGreaterThanOrEqual(3_000);
      expect(alternative.reason).toMatch(/rejected/);
    }
    expect(report.alternatives.critical?.input).toEqual({ criticalChancePolicy: "linear-capped" });
    expect(report.alternatives.penetration?.input).toEqual({
      armorPenetrationPolicy: "linear-capped",
    });
  }, 30_000);

  it("reports real automatic, manual-only, and combined Golden Bug outcomes", () => {
    const report = buildMeasuredReport() as {
      highApsGoldenBug: {
        automaticOnly: {
          automaticEnabled: boolean;
          escaped: boolean;
          manualIntervalMs: number | null;
          defeatsGoldenBug: boolean;
          packets: number;
          damage: number;
          reward: number;
        };
        manualOnly: {
          automaticEnabled: boolean;
          escaped: boolean;
          manualIntervalMs: number | null;
          defeatsGoldenBug: boolean;
          manualClicks: number;
          damage: number;
          reward: number;
        };
        manualPlusAutomatic: {
          automaticEnabled: boolean;
          escaped: boolean;
          manualIntervalMs: number | null;
          defeatsGoldenBug: boolean;
          manualClicks: number;
          damage: number;
          reward: number;
        };
      };
    };
    expect(report.highApsGoldenBug.automaticOnly).toMatchObject({
      automaticEnabled: true,
      escaped: true,
      manualIntervalMs: null,
      defeatsGoldenBug: false,
    });
    expect(report.highApsGoldenBug.automaticOnly.packets).toBeGreaterThanOrEqual(100);
    expect(report.highApsGoldenBug.automaticOnly.damage).toBeGreaterThan(0);
    expect(report.highApsGoldenBug.automaticOnly.reward).toBe(0);
    expect(report.highApsGoldenBug.manualOnly).toMatchObject({
      automaticEnabled: false,
      escaped: true,
      manualIntervalMs: 100,
      defeatsGoldenBug: false,
    });
    expect(report.highApsGoldenBug.manualOnly.manualClicks).toBeGreaterThan(0);
    expect(report.highApsGoldenBug.manualOnly.damage).toBeGreaterThan(0);
    expect(report.highApsGoldenBug.manualOnly.reward).toBe(0);
    expect(report.highApsGoldenBug.manualPlusAutomatic).toMatchObject({
      automaticEnabled: true,
      escaped: false,
      manualIntervalMs: 50,
      defeatsGoldenBug: true,
    });
    expect(report.highApsGoldenBug.manualPlusAutomatic.manualClicks).toBeGreaterThan(0);
    expect(report.highApsGoldenBug.manualPlusAutomatic.damage).toBeGreaterThan(0);
    expect(report.highApsGoldenBug.manualPlusAutomatic.reward).toBeGreaterThan(0);
  }, 30_000);

  it("records actual 10-plus APS at the 48-hour endgame boundary", () => {
    const report = buildMeasuredReport() as {
      briefRevision: number;
      bossTtk: Record<
        string,
        {
          automaticOnly: { hits: number; timeToKillMs: number };
          combined: { hits: number; timeToKillMs: number };
          manualOnly: { hits: number; timeToKillMs: number };
        }
      >;
      cadence: {
        firstTenGaps: readonly number[];
        fortyEightHourGaps: readonly number[];
      };
      realTimeBands: readonly { hours: number; automaticAttacksPerSecond: number }[];
    };
    expect(report.cadence.firstTenGaps).toHaveLength(10);
    expect(new Set(report.cadence.firstTenGaps.slice(0, 3)).size).toBeGreaterThan(1);
    expect(new Set(report.cadence.firstTenGaps.slice(3)).size).toBeGreaterThan(1);
    expect(report.cadence.fortyEightHourGaps.length).toBeGreaterThan(10);
    expect(new Set(report.cadence.fortyEightHourGaps).size).toBeGreaterThan(1);
    expect(report.briefRevision).toBe(19);
    expect(
      report.realTimeBands.find(({ hours }) => hours === 48)?.automaticAttacksPerSecond,
    ).toBeGreaterThanOrEqual(10);
    expect(Object.keys(report.bossTtk)).toEqual([
      "starter",
      "early",
      "midgame",
      "endgameStart",
      "endgame",
    ]);
    for (const receipt of Object.values(report.bossTtk)) {
      expect(receipt.automaticOnly.timeToKillMs).toBeGreaterThan(0);
      expect(receipt.manualOnly.timeToKillMs).toBeGreaterThan(0);
      expect(receipt.combined.timeToKillMs).toBeLessThan(receipt.automaticOnly.timeToKillMs);
      expect(receipt.combined.timeToKillMs).toBeLessThanOrEqual(receipt.manualOnly.timeToKillMs);
    }
  }, 30_000);

  it("uses the configured deterministic manual cadence without moving automatic cooldowns", () => {
    const automaticOnly = simulateProgression({ bossCount: 0, ordinaryEncounters: 100 });
    const combined = simulateProgression({
      bossCount: 0,
      manualIntervalMs: 100,
      ordinaryEncounters: 100,
    });
    expect(combined.manualAttacks).toBeGreaterThan(0);
    expect(combined.automaticAttacks).toBeGreaterThan(0);
    expect(combined.elapsedMs).toBeLessThan(automaticOnly.elapsedMs);
    expect(() => simulateProgression({ manualIntervalMs: 0 })).toThrow(RangeError);
  });
});
