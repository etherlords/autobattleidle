import { describe, expect, it } from "vitest";

import { BattleController } from "./controller";
import { battleCommands } from "./commands";
import { presentBattleUpdate } from "./presenter";
import {
  createCombatState,
  purchaseUpgrade,
  spawnGoldenBug,
  type CombatState,
} from "../../domain/combat";
import type { BattleControllerEvent } from "./contracts";

const rolls = () => ({ critical: 1, doubleReward: 1, nextEliteModifier: 0 });

const stateWith = (state: CombatState, health: number, coins = state.coins): CombatState => ({
  ...state,
  coins,
  enemy: { ...state.enemy, health },
});

describe("BattleController", () => {
  it("expires Golden Bug at the exact deadline before automatic damage and publishes one zero-reward transition", () => {
    const player = createCombatState().player;
    const initial = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 10_000,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const events: BattleControllerEvent[] = [];
    controller.subscribe((event) => events.push(event));
    expect(controller.dispatch(battleCommands.frame(10_000))).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      persistenceChanged: true,
      state: { goldenBug: null, enemy: { encounter: 51 } },
    });
    expect(controller.dispatch(battleCommands.attack("manual"))).toBe(true);
    expect(events).toHaveLength(2);
    expect(events[0]?.events.at(-1)?.message).toBe("Golden Bug escaped.");
  });

  it("keeps a Golden Bug deadline fixed across nonlethal manual and automatic hits", () => {
    const player = createCombatState().player;
    const initial = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 1_000,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    controller.dispatch(battleCommands.attack("manual"));
    controller.dispatch(battleCommands.frame(1_000));
    expect(controller.currentUpdate().goldenBugRemainingMs).toBe(9_000);
    controller.dispatch(battleCommands.frame(10_000));
    expect(controller.currentUpdate().state).toMatchObject({
      goldenBug: null,
      enemy: { encounter: 51 },
    });
  });
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
    controller.dispatch(battleCommands.frame(10_000));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    controller.dispatch(battleCommands.purchase("automatic-unlock"));

    expect(updates.map((event) => event.type)).toEqual(["attack", "purchase", "frame"]);
    expect(updates.map((event) => event.persistenceChanged)).toEqual([true, true, true]);
    expect(updates.at(0)?.events.map((event) => event.message)).toEqual(["Manual kill: +1 coins"]);
    expect(updates.at(-1)?.events.map((event) => event.message)).toEqual([
      "Manual kill: +1 coins",
      "Purchased Unlock automatic attack",
      "Automatic hit: 40 damage",
    ]);
    expect(updates.at(-1)?.events.map((event) => event.id)).toEqual([1, 2, 3]);
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
    expect(updates.map((event) => event.type)).toEqual(["restore", "reset"]);
    expect(updates.at(0)?.events).toEqual([]);
    expect(updates.at(1)?.events).toEqual([]);

    unsubscribe();
    controller.dispatch(battleCommands.attack("manual"));
    expect(updates).toHaveLength(2);
    controller.dispose();
    controller.dispose();
    controller.dispatch(battleCommands.purchase("damage"));
    expect(controller.currentUpdate().events.map((event) => event.id)).toEqual([1]);
  });

  it("batches purchases atomically, stops at the first failure, and preserves successful order", () => {
    const initial = stateWith(
      createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      40,
      1_000_000,
    );
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const updates: BattleControllerEvent[] = [];
    controller.subscribe((event) => updates.push(event));

    expect(controller.dispatch(battleCommands.purchase("damage", 10))).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ persistenceChanged: true, quantity: 10, reason: null });
    expect(updates[0]?.events.map((event) => event.message)).toEqual(
      Array.from({ length: 6 }, () => "Purchased Damage"),
    );

    const beforeFailure = controller.currentUpdate();
    expect(controller.dispatch(battleCommands.purchase("automatic-unlock", 100))).toBe(true);
    expect(updates).toHaveLength(2);
    expect(updates[1]).toMatchObject({ quantity: 1, reason: "Already unlocked" });
    expect(updates[1]?.events).toHaveLength(6);
    expect(controller.dispatch(battleCommands.purchase("automatic-unlock", 100))).toBe(false);
    expect(updates).toHaveLength(2);
    expect(controller.currentUpdate().state).toEqual(updates[1]?.state);
    expect(controller.dispatch(battleCommands.purchase("automatic-unlock"))).toBe(false);
    expect(updates).toHaveLength(2);
    expect(beforeFailure.state.coins).toBeGreaterThan(controller.currentUpdate().state.coins);
  });

  it("caps at 100, matches repeated pure purchases, and keeps partial batches bounded", () => {
    const initial = stateWith(
      createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      40,
      Number.MAX_SAFE_INTEGER,
    );
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const updates: BattleControllerEvent[] = [];
    controller.subscribe((event) => updates.push(event));
    let repeated = initial;
    for (let index = 0; index < 100; index += 1)
      repeated = purchaseUpgrade(repeated, "damage", 0).state;

    expect(controller.dispatch(battleCommands.purchase("damage", 100))).toBe(true);
    expect(updates[0]).toMatchObject({ quantity: 100, state: repeated });
    expect(updates[0]?.events.map((event) => event.id)).toEqual([95, 96, 97, 98, 99, 100]);

    const partialInitial = stateWith(initial, 40, 8);
    const partial = new BattleController({
      createInitialState: () => partialInitial,
      initialNowMs: 0,
      initialState: partialInitial,
      rolls,
    });
    const partialUpdates: BattleControllerEvent[] = [];
    partial.subscribe((event) => partialUpdates.push(event));
    expect(partial.dispatch(battleCommands.purchase("damage", 10))).toBe(true);
    expect(partialUpdates[0]).toMatchObject({ quantity: 2, state: { coins: 0 } });
    expect(partialUpdates[0]?.events).toEqual([
      { id: 1, message: "Purchased Damage" },
      { id: 2, message: "Purchased Damage" },
    ]);
  });
});
