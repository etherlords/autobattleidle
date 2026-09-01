import { describe, expect, it } from "vitest";
import { createCombatState, type AttackEvent } from "../../domain/combat";
import type { BattleControllerEvent } from "./contracts";
import { battleEventMessages, battleVisualCues } from "./presenter";

const state = createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 });
const update = {
  events: [],
  goldenBugRemainingMs: null,
  nowMs: 0,
  persistenceChanged: false,
  state,
};
const hit = (overrides: Partial<Extract<AttackEvent, { readonly type: "hit" }>> = {}) => ({
  armorPreventedDamage: 0,
  critical: false,
  damage: 1,
  defeated: false,
  penetration: 0,
  reward: 0,
  type: "hit" as const,
  ...overrides,
});
const attackEvent = (
  outcome: AttackEvent,
  overrides: Partial<Extract<BattleControllerEvent, { readonly type: "attack" }>> = {},
) =>
  ({
    ...update,
    goldenBugBefore: false,
    outcome,
    previousEnemy: state.enemy,
    source: "manual",
    type: "attack",
    ...overrides,
  }) satisfies BattleControllerEvent;

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
    expect(
      battleEventMessages.attack(
        "manual",
        {
          armorPreventedDamage: 0,
          critical: false,
          damage: 0,
          defeated: true,
          penetration: 0,
          reward: 123_456,
          type: "hit",
        },
        true,
      ),
    ).toBe("Golden Bug reward: +123K coins (123,456)");
  });

  it("maps one immutable combat event to exact presentation-only visual cues", () => {
    const manual = { packets: { count: 1, units: 1 }, source: "manual" };
    expect(battleVisualCues(attackEvent(hit()))).toEqual([{ kind: "hit", ...manual }]);
    expect(battleVisualCues(attackEvent(hit({ armorPreventedDamage: 2 })))).toEqual([
      { kind: "armor", ...manual },
    ]);
    expect(battleVisualCues(attackEvent(hit({ critical: true })))).toEqual([
      { kind: "critical", ...manual },
    ]);
    expect(battleVisualCues(attackEvent(hit({ defeated: true, reward: 3 })))).toEqual([
      { kind: "hit", ...manual },
      "death",
      "coin",
    ]);
    expect(battleVisualCues(attackEvent(hit({ defeated: true, critical: true })))).toEqual([
      { kind: "critical", ...manual },
      "death",
    ]);
    expect(
      battleVisualCues(
        attackEvent(hit({ defeated: true }), {
          state: { ...state, enemy: { ...state.enemy, grade: "boss" } },
        }),
      ),
    ).toEqual([{ kind: "hit", ...manual }, "death", "boss"]);
    expect(
      battleVisualCues(
        attackEvent(hit({ defeated: true, reward: 3 }), {
          goldenBugBefore: true,
          previousEnemy: { ...state.enemy, grade: "boss" },
        }),
      ),
    ).toEqual([{ kind: "hit", ...manual }, "death", "coin", "boss", "golden-kill"]);
    expect(
      battleVisualCues({
        ...update,
        automaticOutcome: hit(),
        automaticReceipt: { count: 4, units: 3.4 },
        previousEnemy: state.enemy,
        type: "frame",
      }),
    ).toEqual([{ kind: "hit", packets: { count: 4, units: 3.4 }, source: "automatic" }]);
    expect(
      battleVisualCues({
        ...update,
        automaticOutcome: null,
        goldenBugEscaped: true,
        previousEnemy: state.enemy,
        type: "frame",
      }),
    ).toEqual(["golden-escape"]);
  });
});
