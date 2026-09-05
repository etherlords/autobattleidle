import { describe, expect, it } from "vitest";

import legacyV2Fixture from "../fixtures/legacy-save-v2.json";
import v1Fixture from "../fixtures/save-v1.json";
import v2Fixture from "../fixtures/save-v2.json";
import v3ArmoredPreCapFixture from "../fixtures/save-v3-active-armored-pre-cap.json";
import v3GoldenFixture from "../fixtures/save-v3-active-golden.json";
import v3GoldenHighApsFixture from "../fixtures/save-v3-active-golden-high-aps.json";
import v3HardenedPreCapFixture from "../fixtures/save-v3-active-hardened-pre-cap.json";
import v3Encounter2170Fixture from "../fixtures/save-v3-encounter-2170.json";
import v4ArmoredPreCapFixture from "../fixtures/save-v4-active-armored-pre-cap.json";
import v4GoldenDefeatsFixture from "../fixtures/save-v4-golden-defeats.json";
import v4HardenedPreCapFixture from "../fixtures/save-v4-active-hardened-pre-cap.json";
import v4PlayerRelativeBossFixture from "../fixtures/save-v4-player-relative-boss.json";

import { createCombatState, ENEMY_AFFINITIES, type EnemyAffinity } from "../../domain/combat";
import type { CombatState } from "../../domain/combat";
import { createBattleSnapshot } from "../../domain/snapshot";
import { decodeSave, encodeSave, SAVE_VERSION } from "../persistence-boundary";

const fallback = () =>
  createCombatState(
    { automaticSpeedLevel: 0, criticalChance: 0, damage: 1, doubleRewardChance: 0 },
    0,
    false,
  );

/** Frozen grammar nouns: `<Affinity label> <boss/family noun>`. */
const familyNouns = [
  "Beetle",
  "Brute",
  "Wisp",
  "Mantis",
  "Sentinel",
  "Drake",
  "Catbug",
  "Evil Catbug",
] as const;

const saveV4Keys = [
  "automaticUnlocked",
  "coins",
  "enemy",
  "goldenBug",
  "goldenBugDefeats",
  "player",
  "version",
] as const;

const persistedEnemyKeys = [
  "armor",
  "encounter",
  "grade",
  "health",
  "id",
  "maxHealth",
  "modifier",
  "reward",
] as const;

const fixtureMatrix = [
  { fixture: v1Fixture, goldenBug: false, name: "V1" },
  { fixture: v2Fixture, goldenBug: false, name: "V2" },
  { fixture: legacyV2Fixture, goldenBug: false, name: "legacy V2" },
  { fixture: v3Encounter2170Fixture, goldenBug: false, name: "V3 encounter 2170" },
  { fixture: v3GoldenFixture, goldenBug: true, name: "V3 active Golden" },
  { fixture: v3GoldenHighApsFixture, goldenBug: true, name: "V3 active Golden high APS" },
  { fixture: v3ArmoredPreCapFixture, goldenBug: false, name: "V3 armored pre-cap" },
  { fixture: v3HardenedPreCapFixture, goldenBug: false, name: "V3 hardened pre-cap" },
  { fixture: v4GoldenDefeatsFixture, goldenBug: false, name: "V4 Golden defeats" },
  { fixture: v4ArmoredPreCapFixture, goldenBug: false, name: "V4 armored pre-cap" },
  { fixture: v4HardenedPreCapFixture, goldenBug: false, name: "V4 hardened pre-cap" },
  { fixture: v4PlayerRelativeBossFixture, goldenBug: false, name: "V4 player-relative boss" },
] as const;

const snapshotEnemy = (state: CombatState) => createBattleSnapshot(state, 0, [], []).enemy;

const grammarMatch = (label: string): RegExpMatchArray | null =>
  new RegExp(`^(.+?) (${familyNouns.join("|")})$`).exec(label);

describe("affinity identity across the persistence boundary", () => {
  it("keeps affinity identity deterministic across load, save, and reload for every save version", () => {
    for (const { fixture, goldenBug, name } of fixtureMatrix) {
      const loaded = decodeSave(fixture, fallback(), 100);
      const identity = snapshotEnemy(loaded);

      // Derivation is pure: a second snapshot over the same state must agree.
      const derivedAgain = createBattleSnapshot(loaded, 900, [], [], 0, [], true).enemy;
      expect(derivedAgain.affinity, name).toBe(identity.affinity);
      expect(derivedAgain.name, name).toBe(identity.name);

      if (goldenBug) {
        expect(identity.name, name).toBe("Golden Bug");
        expect(identity.affinity, name).toBe("cinder");
      } else {
        const match = grammarMatch(identity.name);
        expect(match, name).not.toBeNull();
        const affinity = identity.affinity as EnemyAffinity;
        expect(identity.affinity, name).toBeDefined();
        expect(match?.[1], name).toBe(ENEMY_AFFINITIES[affinity].label);
        expect(familyNouns).toContain(match?.[2]);
      }

      // Save -> reload keeps the identity deterministic.
      const raw = encodeSave(loaded);
      const reloaded = decodeSave(JSON.parse(raw) as unknown, fallback(), 200);
      const reloadedIdentity = snapshotEnemy(reloaded);
      expect(reloadedIdentity.affinity, name).toBe(identity.affinity);
      expect(reloadedIdentity.name, name).toBe(identity.name);
    }
  });

  it("keeps the accepted historical encounter-1 starter semantics while deriving affinity", () => {
    for (const fixture of [v1Fixture, v2Fixture]) {
      const loaded = decodeSave(fixture, fallback(), 100);
      expect(loaded.enemy).toMatchObject({ encounter: 1, grade: "normal", modifier: null });
      const identity = snapshotEnemy(loaded);
      // Level 1 normal derives magma per the frozen affinity grammar.
      expect(identity.affinity).toBe("magma");
      expect(identity.name).toBe("Magma Brute");
      const reloaded = decodeSave(JSON.parse(encodeSave(loaded)) as unknown, fallback(), 200);
      expect(snapshotEnemy(reloaded).affinity).toBe(identity.affinity);
      expect(snapshotEnemy(reloaded).name).toBe(identity.name);
    }
  });

  it("keeps a fresh starter save (10 HP enemy) affinity-stable through save and reload", () => {
    const starter = fallback();
    expect(starter.enemy).toMatchObject({ encounter: 1, health: 10, maxHealth: 10 });
    const identity = snapshotEnemy(starter);
    expect(identity.affinity).toBe("magma");
    expect(identity.name).toBe("Magma Brute");
    const reloaded = decodeSave(JSON.parse(encodeSave(starter)) as unknown, fallback(), 200);
    expect(snapshotEnemy(reloaded)).toMatchObject({
      affinity: identity.affinity,
      name: identity.name,
    });
  });

  it("keeps the Golden Bug label fixed and its reward path untouched through save and reload", () => {
    for (const fixture of [v3GoldenFixture, v3GoldenHighApsFixture]) {
      const loaded = decodeSave(fixture, fallback(), 100);
      expect(loaded.goldenBug).toEqual({ id: 50, resumeEncounter: 51 });
      const identity = snapshotEnemy(loaded);
      expect(identity.name).toBe("Golden Bug");
      expect(identity.affinity).toBe("cinder");
      expect(loaded.enemy.reward).toBe(1550);
      const reloaded = decodeSave(JSON.parse(encodeSave(loaded)) as unknown, fallback(), 200);
      expect(reloaded.enemy.reward).toBe(loaded.enemy.reward);
      expect(snapshotEnemy(reloaded)).toMatchObject({
        affinity: identity.affinity,
        name: identity.name,
      });
      expect(snapshotEnemy(reloaded).name).toBe(identity.name);
    }
  });

  it("recovers malformed and unknown-version saves to the supplied safe state", () => {
    expect(decodeSave({ version: SAVE_VERSION + 1 }, fallback(), 0)).toEqual(fallback());
    expect(decodeSave("invalid", fallback(), 0)).toEqual(fallback());
    expect(decodeSave(null, fallback(), 0)).toEqual(fallback());
    expect(decodeSave({}, fallback(), 0)).toEqual(fallback());
    const changedV4 = {
      ...v4GoldenDefeatsFixture,
      enemy: { ...v4GoldenDefeatsFixture.enemy, reward: 67_534_741 },
    };
    expect(decodeSave(changedV4, fallback(), 0)).toMatchObject({
      coins: v4GoldenDefeatsFixture.coins,
      enemy: { encounter: 2170, reward: 67_534_741 },
    });
    expect(decodeSave({ ...v4GoldenDefeatsFixture, goldenBugDefeats: "3" }, fallback(), 0)).toEqual(
      fallback(),
    );
    // Even the recovery path derives a deterministic affinity identity.
    const recovered = decodeSave({ version: SAVE_VERSION + 1 }, fallback(), 0);
    expect(snapshotEnemy(recovered).affinity).toBe(snapshotEnemy(fallback()).affinity);
  });

  it("leaks no affinity field into the serialized save DTO", () => {
    for (const { fixture, name } of fixtureMatrix) {
      const loaded = decodeSave(fixture, fallback(), 100);
      const raw = encodeSave(loaded);
      expect(raw.includes("affinity"), name).toBe(false);
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      expect(Object.keys(parsed).sort(), name).toEqual([...saveV4Keys].sort());
      expect(Object.keys(parsed.enemy as Record<string, unknown>).sort(), name).toEqual(
        [...persistedEnemyKeys].sort(),
      );
      const roundTrip = decodeSave(parsed, fallback(), 200);
      expect(JSON.parse(encodeSave(roundTrip))).not.toHaveProperty("affinity");
    }
    // A live Golden Bug state round-trips through the same closed DTO.
    const goldenRaw = encodeSave({
      ...fallback(),
      enemy: { ...fallback().enemy, id: 3002399751580381, reward: 1550 },
      goldenBug: { id: 50, resumeEncounter: 51 },
    });
    expect(goldenRaw.includes("affinity")).toBe(false);
    expect(JSON.parse(goldenRaw)).not.toHaveProperty("affinity");
  });
});
