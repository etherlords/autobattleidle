import { describe, expect, it } from "vitest";

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
});
