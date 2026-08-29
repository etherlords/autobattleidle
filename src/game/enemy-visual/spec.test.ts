import { describe, expect, it } from "vitest";

import { enemyVisualSpec } from "./spec";
import { selectEnemyFamilyIdentity } from "../../domain/combat";

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
});
