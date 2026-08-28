import { describe, expect, it } from "vitest";

import { BattleController } from "./controller";
import { battleCommands } from "./commands";
import { presentBattleUpdate } from "./presenter";
import { createCombatState, type CombatState } from "../../domain/combat";
import type { BattleControllerEvent } from "./contracts";

const rolls = () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 });

const stateWith = (state: CombatState, health: number, coins = state.coins): CombatState => ({
  ...state,
  coins,
  enemy: { ...state.enemy, health },
});

describe("BattleController", () => {
  it("publishes complete synchronous commands with exact history and persistence flags", () => {
    const initial = stateWith(
      createCombatState({ criticalChance: 0, damage: 10, doubleRewardChance: 0 }),
      40,
      2,
    );
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const updates: BattleControllerEvent[] = [];
    controller.subscribe((event) => updates.push(event));

    expect(controller.dispatch(battleCommands.attack("automatic"))).toBe(false);
    expect(controller.currentUpdate().events).toEqual([]);
    expect(updates).toEqual([]);
    controller.dispatch(battleCommands.attack("manual"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.frame(1_000));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));

    expect(updates.map((event) => event.type)).toEqual([
      "attack",
      "purchase",
      "purchase",
      "frame",
      "purchase",
      "purchase",
      "purchase",
    ]);
    expect(updates.map((event) => event.persistenceChanged)).toEqual([
      true,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
    expect(updates.at(0)?.events.map((event) => event.message)).toEqual(["Manual kill: +1 coins"]);
    expect(updates.at(-1)?.events.map((event) => event.message)).toEqual([
      "Purchased Unlock automatic attack",
      "Already unlocked",
      "Automatic hit: 40 damage",
      "Already unlocked",
      "Already unlocked",
      "Already unlocked",
    ]);
    expect(updates.at(-1)?.events.map((event) => event.id)).toEqual([2, 3, 4, 5, 6, 7]);
    const lastUpdate = updates.at(-1);
    if (lastUpdate === undefined) throw new Error("Expected controller update");
    expect(presentBattleUpdate(lastUpdate).upgrades).toHaveLength(6);
  });

  it("resets and restores history, supports unsubscribe, and ignores commands after disposal", () => {
    const initial = createCombatState({ criticalChance: 0, damage: 10, doubleRewardChance: 0 });
    const restored = stateWith(initial, initial.enemy.health, 9);
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const updates: BattleControllerEvent[] = [];
    const unsubscribe = controller.subscribe((event) => updates.push(event));

    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.restore(restored));
    controller.dispatch(battleCommands.reset());
    expect(updates.map((event) => event.type)).toEqual(["purchase", "restore", "reset"]);
    expect(updates.at(1)?.events).toEqual([]);
    expect(updates.at(2)?.events).toEqual([]);

    unsubscribe();
    controller.dispatch(battleCommands.attack("manual"));
    expect(updates).toHaveLength(3);
    controller.dispose();
    controller.dispose();
    controller.dispatch(battleCommands.purchase("damage"));
    expect(controller.currentUpdate().events.map((event) => event.id)).toEqual([1]);
  });
});
