import { describe, expect, it } from "vitest";

import { spawnEnemy } from "../combat";
import { modifierForRoll } from "./enemy-modifiers";

describe("enemy modifier registry", () => {
  it("selects every modifier deterministically at valid roll boundaries", () => {
    expect(modifierForRoll(0).id).toBe("armor");
    expect(modifierForRoll(0.34).id).toBe("health");
    expect(modifierForRoll(0.67).id).toBe("automatic-slow");
    expect(modifierForRoll(1).id).toBe("automatic-slow");
    expect(modifierForRoll(0.76).id).toBe("hardened");
    expect(modifierForRoll(0.85).id).toBe("critical-guard");
    expect(modifierForRoll(0.96).id).toBe("manual-guard");
  });

  it("rejects invalid elite rolls instead of choosing a fallback modifier", () => {
    expect(() => modifierForRoll(-0.01)).toThrow(RangeError);
    expect(() => modifierForRoll(Number.NaN)).toThrow(RangeError);
    expect(() => spawnEnemy(3, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
