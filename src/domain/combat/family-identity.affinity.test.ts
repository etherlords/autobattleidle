import { describe, expect, it } from "vitest";

import {
  attack,
  createCombatState,
  ENEMY_AFFINITIES,
  ENEMY_AFFINITY_IDS,
  selectEnemyFamilyIdentity,
  spawnEnemy,
  spawnGoldenBug,
  stableAffinitySeed,
} from "../combat";
import { createBattleSnapshot } from "../snapshot";
import { COMBAT_BALANCE, COMBAT_FORMULAS } from "./balance";
import type { EnemyAffinity, EnemyFamily, EnemyPresentationModifier } from "../combat";

const familyLabels: Readonly<Record<EnemyFamily, string>> = {
  beetle: "Beetle",
  brute: "Brute",
  wisp: "Wisp",
  mantis: "Mantis",
  sentinel: "Sentinel",
  drake: "Drake",
  "boss-colossus": "Colossus",
  "boss-hydra": "Hydra",
  "boss-catbug": "Catbug",
  "boss-evil-catbug": "Evil Catbug",
};

type AffinityCase = {
  readonly affinity: EnemyAffinity;
  readonly level: number;
  readonly modifier: EnemyPresentationModifier;
};
type BossFamily = "boss-colossus" | "boss-hydra" | "boss-catbug" | "boss-evil-catbug";
type FamilyMatrix = Readonly<Record<EnemyFamily, ReadonlyArray<AffinityCase>>>;

const familyGrades: Readonly<Record<EnemyFamily, "normal" | "elite" | "boss">> = {
  beetle: "normal",
  brute: "normal",
  wisp: "normal",
  mantis: "elite",
  sentinel: "elite",
  drake: "elite",
  "boss-colossus": "boss",
  "boss-hydra": "boss",
  "boss-catbug": "boss",
  "boss-evil-catbug": "boss",
};

/**
 * Production-reachable inputs only: spawnEnemy yields null for non-elite grades and one
 * of six EliteModifiers for elites — never "wealth". Ordinary families split by level
 * modulo 3; bosses use modifier null (their production identity), split by parity.
 */
const labelMatrix: FamilyMatrix = {
  beetle: [
    { affinity: "cinder", level: 45, modifier: null },
    { affinity: "ice", level: 15, modifier: null },
    { affinity: "ash", level: 3, modifier: null },
    { affinity: "toxic", level: 54, modifier: null },
    { affinity: "volt", level: 42, modifier: null },
    { affinity: "tide", level: 93, modifier: null },
    { affinity: "dusk", level: 6, modifier: null },
    { affinity: "verdant", level: 12, modifier: null },
    { affinity: "gilded", level: 81, modifier: null },
    { affinity: "frost", level: 51, modifier: null },
    { affinity: "magma", level: 24, modifier: null },
    { affinity: "prism", level: 75, modifier: null },
  ],
  brute: [
    { affinity: "cinder", level: 43, modifier: null },
    { affinity: "ice", level: 19, modifier: null },
    { affinity: "ash", level: 4, modifier: null },
    { affinity: "toxic", level: 16, modifier: null },
    { affinity: "volt", level: 46, modifier: null },
    { affinity: "tide", level: 13, modifier: null },
    { affinity: "dusk", level: 28, modifier: null },
    { affinity: "verdant", level: 10, modifier: null },
    { affinity: "gilded", level: 40, modifier: null },
    { affinity: "frost", level: 70, modifier: null },
    { affinity: "magma", level: 1, modifier: null },
    { affinity: "prism", level: 52, modifier: null },
  ],
  wisp: [
    { affinity: "cinder", level: 41, modifier: null },
    { affinity: "ice", level: 59, modifier: null },
    { affinity: "ash", level: 2, modifier: null },
    { affinity: "toxic", level: 50, modifier: null },
    { affinity: "volt", level: 47, modifier: null },
    { affinity: "tide", level: 11, modifier: null },
    { affinity: "dusk", level: 8, modifier: null },
    { affinity: "verdant", level: 14, modifier: null },
    { affinity: "gilded", level: 44, modifier: null },
    { affinity: "frost", level: 17, modifier: null },
    { affinity: "magma", level: 20, modifier: null },
    { affinity: "prism", level: 35, modifier: null },
  ],
  mantis: [
    { affinity: "cinder", level: 10, modifier: "hardened" },
    { affinity: "ice", level: 3, modifier: "hardened" },
    { affinity: "ash", level: 15, modifier: "hardened" },
    { affinity: "toxic", level: 41, modifier: "hardened" },
    { affinity: "volt", level: 12, modifier: "hardened" },
    { affinity: "tide", level: 1, modifier: "hardened" },
    { affinity: "dusk", level: 11, modifier: "hardened" },
    { affinity: "verdant", level: 40, modifier: "hardened" },
    { affinity: "gilded", level: 14, modifier: "hardened" },
    { affinity: "frost", level: 5, modifier: "hardened" },
    { affinity: "magma", level: 13, modifier: "hardened" },
    { affinity: "prism", level: 42, modifier: "hardened" },
  ],
  sentinel: [
    { affinity: "cinder", level: 31, modifier: "critical-guard" },
    { affinity: "ice", level: 1, modifier: "critical-guard" },
    { affinity: "ash", level: 13, modifier: "critical-guard" },
    { affinity: "toxic", level: 43, modifier: "critical-guard" },
    { affinity: "volt", level: 10, modifier: "critical-guard" },
    { affinity: "tide", level: 3, modifier: "critical-guard" },
    { affinity: "dusk", level: 11, modifier: "critical-guard" },
    { affinity: "verdant", level: 40, modifier: "critical-guard" },
    { affinity: "gilded", level: 14, modifier: "critical-guard" },
    { affinity: "frost", level: 2, modifier: "critical-guard" },
    { affinity: "magma", level: 15, modifier: "critical-guard" },
    { affinity: "prism", level: 48, modifier: "critical-guard" },
  ],
  drake: [
    { affinity: "cinder", level: 5, modifier: "manual-guard" },
    { affinity: "ice", level: 12, modifier: "manual-guard" },
    { affinity: "ash", level: 2, modifier: "manual-guard" },
    { affinity: "toxic", level: 30, modifier: "manual-guard" },
    { affinity: "volt", level: 1, modifier: "manual-guard" },
    { affinity: "tide", level: 11, modifier: "manual-guard" },
    { affinity: "dusk", level: 4, modifier: "manual-guard" },
    { affinity: "verdant", level: 32, modifier: "manual-guard" },
    { affinity: "gilded", level: 27, modifier: "manual-guard" },
    { affinity: "frost", level: 10, modifier: "manual-guard" },
    { affinity: "magma", level: 8, modifier: "manual-guard" },
    { affinity: "prism", level: 33, modifier: "manual-guard" },
  ],
  "boss-colossus": [
    { affinity: "cinder", level: 2, modifier: null },
    { affinity: "ice", level: 18, modifier: null },
    { affinity: "ash", level: 46, modifier: null },
    { affinity: "toxic", level: 34, modifier: null },
    { affinity: "volt", level: 6, modifier: null },
    { affinity: "tide", level: 14, modifier: null },
    { affinity: "dusk", level: 44, modifier: null },
    { affinity: "verdant", level: 30, modifier: null },
    { affinity: "gilded", level: 20, modifier: null },
    { affinity: "frost", level: 10, modifier: null },
    { affinity: "magma", level: 40, modifier: null },
    { affinity: "prism", level: 32, modifier: null },
  ],
  "boss-hydra": [
    { affinity: "cinder", level: 5, modifier: null },
    { affinity: "ice", level: 31, modifier: null },
    { affinity: "ash", level: 41, modifier: null },
    { affinity: "toxic", level: 19, modifier: null },
    { affinity: "volt", level: 1, modifier: null },
    { affinity: "tide", level: 37, modifier: null },
    { affinity: "dusk", level: 43, modifier: null },
    { affinity: "verdant", level: 11, modifier: null },
    { affinity: "gilded", level: 9, modifier: null },
    { affinity: "frost", level: 33, modifier: null },
    { affinity: "magma", level: 45, modifier: null },
    { affinity: "prism", level: 13, modifier: null },
  ],
  "boss-catbug": [
    { affinity: "cinder", level: 2, modifier: null },
    { affinity: "ice", level: 18, modifier: null },
    { affinity: "ash", level: 46, modifier: null },
    { affinity: "toxic", level: 34, modifier: null },
    { affinity: "volt", level: 6, modifier: null },
    { affinity: "tide", level: 14, modifier: null },
    { affinity: "dusk", level: 44, modifier: null },
    { affinity: "verdant", level: 30, modifier: null },
    { affinity: "gilded", level: 20, modifier: null },
    { affinity: "frost", level: 10, modifier: null },
    { affinity: "magma", level: 40, modifier: null },
    { affinity: "prism", level: 32, modifier: null },
  ],
  "boss-evil-catbug": [
    { affinity: "cinder", level: 5, modifier: null },
    { affinity: "ice", level: 31, modifier: null },
    { affinity: "ash", level: 41, modifier: null },
    { affinity: "toxic", level: 19, modifier: null },
    { affinity: "volt", level: 1, modifier: null },
    { affinity: "tide", level: 37, modifier: null },
    { affinity: "dusk", level: 43, modifier: null },
    { affinity: "verdant", level: 11, modifier: null },
    { affinity: "gilded", level: 9, modifier: null },
    { affinity: "frost", level: 33, modifier: null },
    { affinity: "magma", level: 45, modifier: null },
    { affinity: "prism", level: 13, modifier: null },
  ],
};

describe("enemy affinity selection", () => {
  it("derives the affinity from an independent stable seed of the same canonical inputs", () => {
    for (const level of [1, 2, 3, 17, 51, 999, 1_200]) {
      for (const grade of ["normal", "veteran", "elite", "boss"] as const) {
        for (const modifier of [null, "hardened", "critical-guard", "manual-guard"] as const) {
          const enemy = { grade, level, modifier };
          const identity = selectEnemyFamilyIdentity(enemy);
          const expected =
            ENEMY_AFFINITY_IDS[stableAffinitySeed(enemy) % ENEMY_AFFINITY_IDS.length];
          expect(expected).toBeDefined();
          expect(identity.affinity).toBe(expected);
        }
      }
    }
  });

  it("reaches every affinity for all four boss families with production-reachable inputs", () => {
    const bossFamilies: readonly BossFamily[] = [
      "boss-colossus",
      "boss-hydra",
      "boss-catbug",
      "boss-evil-catbug",
    ];
    const counts: Record<BossFamily, Partial<Record<EnemyAffinity, number>>> = {
      "boss-colossus": {},
      "boss-hydra": {},
      "boss-catbug": {},
      "boss-evil-catbug": {},
    };
    for (let level = 1; level <= 192; level += 1) {
      const identity = selectEnemyFamilyIdentity({ grade: "boss", level, modifier: null });
      if (!bossFamilies.includes(identity.family as BossFamily))
        throw new Error(`Expected a boss family, received ${identity.family}`);
      const family = identity.family as BossFamily;
      counts[family][identity.affinity] = (counts[family][identity.affinity] ?? 0) + 1;
    }
    for (const family of bossFamilies) {
      for (const affinityId of ENEMY_AFFINITY_IDS) {
        expect(counts[family][affinityId]).toBeGreaterThan(0);
      }
    }
  });

  it("keeps Golden Bug identity on the fixed cinder affinity", () => {
    for (const level of [51, 101, 1_000]) {
      const identity = selectEnemyFamilyIdentity({
        goldenBug: true,
        grade: "normal",
        level,
        modifier: null,
      });
      expect(identity).toMatchObject({
        affinity: "cinder",
        family: "beetle",
        label: "Golden Bug",
        variant: 0,
      });
    }
  });

  it("distributes every affinity within 15% of uniform across a long encounter run", () => {
    const counts: Record<string, number> = {};
    const levels = 1_200;
    for (let level = 1; level <= levels; level += 1) {
      const ordinaryGrade = (["normal", "veteran", "elite"] as const)[(level - 1) % 3] ?? "normal";
      const grade = level % COMBAT_BALANCE.bossInterval === 0 ? "boss" : ordinaryGrade;
      const modifier = grade === "elite" ? ("hardened" as const) : null;
      const identity = selectEnemyFamilyIdentity({ grade, level, modifier });
      counts[identity.affinity] = (counts[identity.affinity] ?? 0) + 1;
    }
    const expected = levels / ENEMY_AFFINITY_IDS.length;
    for (const affinityId of ENEMY_AFFINITY_IDS) {
      const count = counts[affinityId] ?? 0;
      expect(count / expected).toBeGreaterThan(0.85);
      expect(count / expected).toBeLessThan(1.15);
    }
  });
});

describe("deterministic affinity label grammar", () => {
  it("prefixes every family label with the affinity adjective across the 96-combination matrix", () => {
    for (const [family, cases] of Object.entries(labelMatrix)) {
      for (const { affinity, level, modifier } of cases) {
        const input = { grade: familyGrades[family as EnemyFamily], level, modifier };
        const identity = selectEnemyFamilyIdentity(input);
        const profile = ENEMY_AFFINITIES[identity.affinity];
        expect(identity.affinity).toBe(affinity);
        expect(identity.label).toBe(`${profile.label} ${familyLabels[identity.family]}`);
      }
    }
  });

  it("never doubles an elemental word inside a composed label", () => {
    for (const [family, cases] of Object.entries(labelMatrix)) {
      for (const { level, modifier } of cases) {
        const identity = selectEnemyFamilyIdentity({
          grade: familyGrades[family as EnemyFamily],
          level,
          modifier,
        });
        const tokens = identity.label.split(" ");
        expect(new Set(tokens).size).toBe(tokens.length);
        expect(identity.label).not.toMatch(/\b(\w+) \1\b/i);
      }
    }
  });
});

describe("affinity reward application", () => {
  const rewardFixture: ReadonlyArray<{
    readonly factor: number;
    readonly encounter: number;
    readonly affinity: string;
    readonly base: number;
    readonly applied: number;
  }> = [
    { factor: 0.99, encounter: 232, affinity: "ice", base: 70, applied: 69 },
    { factor: 1, encounter: 2, affinity: "ash", base: 1, applied: 1 },
    { factor: 1.01, encounter: 190, affinity: "cinder", base: 57, applied: 58 },
  ];

  it("applies the exact affinity reward factor once at defeat", () => {
    for (const fixture of rewardFixture) {
      const identity = selectEnemyFamilyIdentity({
        grade: "normal",
        level: fixture.encounter,
        modifier: null,
      });
      expect(identity.affinity).toBe(fixture.affinity);
      const enemy = spawnEnemy(fixture.encounter, 0);
      expect(enemy.reward).toBe(fixture.base);
      const state = {
        ...createCombatState({ criticalChance: 0, damage: 10_000, doubleRewardChance: 0 }),
        enemy: { ...enemy, health: 1 },
      };
      const result = attack(state, {
        atMs: 0,
        enemyId: enemy.id,
        rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
        source: "manual",
      });
      if (result.event.type === "ignored") throw new Error("Expected a resolved attack");
      expect(result.event.defeated).toBe(true);
      expect(result.event.reward).toBe(fixture.applied);
      expect(fixture.applied).toBe(
        Math.max(COMBAT_FORMULAS.minimumDamage, Math.round(fixture.base * fixture.factor)),
      );
    }
  });

  it("keeps the Golden Bug defeat reward on the legacy 50x path without affinity", () => {
    const ordinary = spawnEnemy(50, 0);
    const initial = { ...createCombatState(), enemy: { ...ordinary, health: 1 } };
    const spawned = attack(initial, {
      atMs: 0,
      enemyId: ordinary.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (spawned.state.goldenBug === null) throw new Error("Expected a spawned Golden Bug");
    const golden = spawnGoldenBug(51, initial.player);
    expect(spawned.state.enemy).toEqual(golden);
    const killed = attack(
      { ...spawned.state, enemy: { ...spawned.state.enemy, health: 1 } },
      {
        atMs: 1,
        enemyId: golden.id,
        rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
        source: "manual",
      },
    );
    if (killed.event.type === "ignored") throw new Error("Expected a resolved attack");
    expect(killed.event.defeated).toBe(true);
    expect(killed.event.reward).toBe(
      spawnEnemy(51, 0).reward * COMBAT_BALANCE.goldenBugRewardFactor,
    );
    expect(killed.state.goldenBugDefeats).toBe(1);
  });

  it("saturates the defeat reward safely near Number.MAX_SAFE_INTEGER with a 1.01 factor", () => {
    const encounter = 40; // normal grade, gilded affinity, factor 1.01
    const identity = selectEnemyFamilyIdentity({
      grade: "normal",
      level: encounter,
      modifier: null,
    });
    expect(identity.affinity).toBe("gilded");
    const enemy = spawnEnemy(encounter, 0);
    const coins = Number.MAX_SAFE_INTEGER - 5;
    const state = {
      ...createCombatState({ criticalChance: 0, damage: 10_000, doubleRewardChance: 0 }),
      coins,
      enemy: { ...enemy, health: 1 },
    };
    const result = attack(state, {
      atMs: 0,
      enemyId: enemy.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (result.event.type === "ignored") throw new Error("Expected a resolved attack");
    const expected = Math.min(
      Math.max(COMBAT_FORMULAS.minimumDamage, Math.round(enemy.reward * 1.01)),
      Number.MAX_SAFE_INTEGER - coins,
    );
    expect(result.event.reward).toBe(expected);
    expect(result.state.coins).toBe(coins + expected);
  });

  it("floors the defeat reward at the minimum damage constant", () => {
    const encounter = 10; // normal grade, verdant affinity, factor 0.99
    const identity = selectEnemyFamilyIdentity({
      grade: "normal",
      level: encounter,
      modifier: null,
    });
    expect(identity.affinity).toBe("verdant");
    const enemy = { ...spawnEnemy(1, 0), reward: 1 };
    const state = {
      ...createCombatState({ criticalChance: 0, damage: 10_000, doubleRewardChance: 0 }),
      enemy: { ...enemy, encounter, id: encounter, health: 1 },
    };
    const result = attack(state, {
      atMs: 0,
      enemyId: encounter,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (result.event.type === "ignored") throw new Error("Expected a resolved attack");
    expect(result.event.reward).toBe(1);
  });
});

describe("affinity snapshot projection", () => {
  it("projects the affinity into the battle enemy snapshot", () => {
    const identity = selectEnemyFamilyIdentity({ grade: "normal", level: 1, modifier: null });
    const snapshot = createBattleSnapshot(createCombatState(), 0, [], []);
    const affinity = snapshot.enemy.affinity;
    expect(affinity).toBe(identity.affinity);
    expect(affinity).toBe("magma");
    if (affinity !== undefined) expect(ENEMY_AFFINITIES[affinity]).toBeDefined();
  });
});
