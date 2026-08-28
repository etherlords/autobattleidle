import { describe, expect, it } from "vitest";
import { battleEventMessages } from "./presenter";

describe("battleEventMessages", () => {
  it("formats numeric combat logs before the event log receives them", () => {
    expect(
      battleEventMessages.attack("manual", {
        armorPreventedDamage: 0,
        critical: false,
        damage: 900_000,
        defeated: false,
        penetration: 0,
        reward: 0,
        type: "hit",
      }),
    ).toBe("Manual hit: 900K damage");
    expect(
      battleEventMessages.attack("automatic", {
        armorPreventedDamage: 0,
        critical: false,
        damage: 0,
        defeated: true,
        penetration: 0,
        reward: 1_000_000,
        type: "hit",
      }),
    ).toBe("Automatic kill: +1M coins");
  });
});
