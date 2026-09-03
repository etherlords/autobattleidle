import { describe, expect, it } from "vitest";

import { ENEMY_AFFINITY_IDS, selectEnemyFamilyIdentity } from "../../domain/combat";
import {
  BOSS_GEOMETRY_RECIPES,
  bossGeometryProfilesForFamily,
} from "./decorators/boss-geometry-decorator";
import { enemyVisualCompositionReceipt } from "./receipt";
import { enemyVisualSpec } from "./spec";

describe("enemy visual specification selection", () => {
  it("keeps valid body and decoration selection deterministic without fallback values", () => {
    expect(enemyVisualSpec({ grade: "normal", level: 1, modifier: null })).toMatchObject({
      body: "brute",
      decorations: ["orbitals", "fins"],
    });
    expect(enemyVisualSpec({ grade: "boss", level: 35, modifier: null }).body).toBe("boss-hydra");
  });

  it("rejects a non-finite visual identity instead of selecting default parts", () => {
    expect(() => enemyVisualSpec({ grade: "normal", level: Number.NaN, modifier: null })).toThrow(
      RangeError,
    );
  });

  it("uses the shared snapshot family identity policy", () => {
    const input = { grade: "elite" as const, level: 3, modifier: "manual-guard" as const };
    const identity = selectEnemyFamilyIdentity(input);
    expect(enemyVisualSpec(input)).toMatchObject({
      body: identity.family,
      seed: identity.seed,
      profile: { variant: identity.variant },
    });
  });

  it("returns a deterministic receipt that preserves input identity and production spec", () => {
    const input = {
      grade: "elite" as const,
      level: 17,
      modifier: "critical-guard" as const,
      reducedMotion: true,
    };
    const first = enemyVisualCompositionReceipt(input);
    expect(enemyVisualCompositionReceipt(input)).toEqual(first);
    expect(first.input).toBe(input);
    expect(first.seed).toBe(first.identity.seed);
    expect(first.body).toBe(first.family);
    expect(first.bodyVariant).toBe(first.variant);
    expect(first.spec).toEqual(enemyVisualSpec(input));
    expect(first.grade).toBe("elite");
    expect(first.modifierCue).toBe("prism-guard");
  });

  it("covers every shipped grade and modifier through production input", () => {
    const grades = ["normal", "veteran", "elite", "boss"] as const;
    const modifiers = [
      null,
      "armor",
      "health",
      "automatic-slow",
      "wealth",
      "hardened",
      "critical-guard",
      "manual-guard",
    ] as const;
    for (const grade of grades) {
      for (const modifier of modifiers) {
        const receipt = enemyVisualCompositionReceipt({ grade, level: 12, modifier });
        expect(receipt.grade).toBe(grade);
        expect(receipt.spec.gradeCue).toBeDefined();
        expect(receipt.body).toBeDefined();
        expect(receipt.modifierCue).toBeDefined();
      }
    }
  });

  it("reaches all twelve affinity identities without a visual fallback", () => {
    const affinities = new Set<string>();
    for (let level = 1; level <= 1_000; level += 1) {
      affinities.add(
        enemyVisualCompositionReceipt({ grade: "normal", level, modifier: null }).affinity,
      );
      if (affinities.size === ENEMY_AFFINITY_IDS.length) break;
    }
    expect(affinities).toEqual(new Set(ENEMY_AFFINITY_IDS));
  });

  it("assigns legacy geometry to ordinary bodies and explicit recipes to both bosses", () => {
    expect(bossGeometryProfilesForFamily("beetle")).toEqual(["legacy/no-overlay"]);
    expect(bossGeometryProfilesForFamily("drake")).toEqual(["legacy/no-overlay"]);
    expect(bossGeometryProfilesForFamily("boss-hydra")).toEqual(
      BOSS_GEOMETRY_RECIPES["boss-hydra"],
    );
    expect(bossGeometryProfilesForFamily("boss-colossus")).toEqual(
      BOSS_GEOMETRY_RECIPES["boss-colossus"],
    );

    const ordinary = enemyVisualCompositionReceipt({ grade: "normal", level: 1, modifier: null });
    const hydra = enemyVisualCompositionReceipt({ grade: "boss", level: 35, modifier: null });
    const colossus = enemyVisualCompositionReceipt({ grade: "boss", level: 70, modifier: null });
    expect(ordinary.geometryProfile).toBe("legacy/no-overlay");
    expect(ordinary.geometryProfiles).toEqual(["legacy/no-overlay"]);
    expect(hydra.geometryProfiles).toEqual(["crystal-crown", "elemental-spines"]);
    expect(colossus.geometryProfiles).toEqual(["orbital-runes", "elemental-spines"]);
  });
});
