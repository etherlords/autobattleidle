import { describe, expect, it } from "vitest";

import { createCombatState, spawnGoldenBug } from "./combat";
import { createBattleSnapshot } from "./snapshot";

describe("battle snapshots", () => {
  it("shares the family identity used by rendered enemies, including Golden Bug", () => {
    const ordinary = createBattleSnapshot(createCombatState(), 0, [], []);
    expect(ordinary.enemy).toMatchObject({
      family: "brute",
      name: "Ember Brute",
      variant: expect.any(Number),
      seed: expect.any(Number),
    });

    const state = createCombatState();
    const goldenBug = {
      ...state,
      enemy: spawnGoldenBug(51, state.player),
      goldenBug: { id: 50, resumeEncounter: 51 },
    };
    expect(createBattleSnapshot(goldenBug, 0, [], []).enemy).toMatchObject({
      family: "beetle",
      goldenBug: true,
      name: "Golden Bug",
      variant: 0,
    });
  });
});
