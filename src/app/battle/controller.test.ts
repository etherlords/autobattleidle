import { describe, expect, it } from "vitest";

import { BattleController } from "./controller";
import { battleCommands } from "./commands";
import { presentBattleUpdate } from "./presenter";
import {
  automaticAttackPacketMultipliers,
  automaticAttacksPerSecond,
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
  it("batches high APS into independently rolled full and fractional packets at three visual ticks", () => {
    const criticalRolls = [0, 1, 1, 1];
    let rollIndex = 0;
    const initial = {
      ...createCombatState(
        { automaticSpeedLevel: 1_000, criticalLevel: 20, damageLevel: 9, damage: 40 },
        0,
        true,
      ),
      enemy: { ...createCombatState().enemy, health: 10_000 },
      nextAutomaticAttackAtMs: 0,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls: () => ({
        critical: criticalRolls[rollIndex++] ?? 1,
        doubleReward: 1,
        nextEliteModifier: 0,
      }),
    });
    const events: BattleControllerEvent[] = [];
    controller.subscribe((event) => events.push(event));
    expect(controller.dispatch(battleCommands.frame(0))).toBe(true);
    const outcome = events.at(-1);
    if (outcome?.type !== "frame" || outcome.automaticOutcome?.type !== "hit")
      throw new Error("Expected a batched automatic hit");
    const packets = automaticAttackPacketMultipliers(
      automaticAttacksPerSecond(initial.player.automaticSpeedLevel),
    );
    expect(rollIndex).toBe(packets.length);
    expect(outcome.automaticReceipt).toEqual({
      count: packets.length,
      units: packets.reduce((total, packet) => total + packet, 0),
    });
    expect(outcome.automaticOutcome.critical).toBe(true);
    expect(controller.currentUpdate().state.nextAutomaticAttackAtMs).toBeCloseTo(1_000 / 3);
    expect(controller.dispatch(battleCommands.frame(100))).toBe(false);
  });
  it("freezes automatic remainder without stopping manual attacks or Golden Bug expiry", () => {
    const player = createCombatState({
      criticalChance: 0,
      damage: 1,
      doubleRewardChance: 0,
    }).player;
    const initial = {
      ...createCombatState(player, 0, true),
      enemy: { ...createCombatState(player, 0, true).enemy, health: 10 },
      nextAutomaticAttackAtMs: 1_000,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    controller.dispatch(battleCommands.frame(400));
    expect(controller.dispatch(battleCommands.toggleAutomaticPause())).toBe(true);
    expect(controller.currentUpdate()).toMatchObject({
      automaticPaused: true,
      automaticRemainingMs: 600,
    });
    controller.dispatch(battleCommands.frame(2_000));
    expect(controller.currentUpdate().state.enemy.health).toBe(10);
    expect(controller.dispatch(battleCommands.attack("manual"))).toBe(true);
    expect(controller.currentUpdate().state.enemy.health).toBe(9);
    controller.dispatch(battleCommands.toggleAutomaticPause());
    controller.dispatch(battleCommands.frame(2_599));
    expect(controller.currentUpdate().state.enemy.health).toBe(9);
    controller.dispatch(battleCommands.frame(2_600));
    expect(controller.currentUpdate().state.enemy.health).toBe(8);
  });
  it("keeps Golden Bug expiry live while automatic attacks are paused", () => {
    const player = createCombatState().player;
    const initial = {
      ...createCombatState(player, 0, true),
      enemy: spawnGoldenBug(51, player),
      goldenBug: { id: 50, resumeEncounter: 51 },
      nextAutomaticAttackAtMs: 1,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    controller.dispatch(battleCommands.toggleAutomaticPause());
    expect(controller.dispatch(battleCommands.frame(10_000))).toBe(true);
    expect(controller.currentUpdate().state.goldenBug).toBeNull();
  });
  it("ignores locked pause and clears pause on restore and reset", () => {
    const base = {
      ...createCombatState({ criticalChance: 0, damage: 1, doubleRewardChance: 0 }),
      coins: 10,
    };
    const unlocked = { ...base, automaticUnlocked: true, nextAutomaticAttackAtMs: 2_000 };
    const controller = new BattleController({
      createInitialState: () => base,
      initialNowMs: 0,
      initialState: base,
      rolls,
    });
    expect(controller.dispatch(battleCommands.toggleAutomaticPause())).toBe(false);
    controller.dispatch(battleCommands.purchase("automatic-unlock"));
    expect(controller.dispatch(battleCommands.toggleAutomaticPause())).toBe(true);
    controller.dispatch(battleCommands.restore(unlocked));
    expect(controller.currentUpdate().automaticPaused).toBe(false);
    controller.dispatch(battleCommands.toggleAutomaticPause());
    controller.dispatch(battleCommands.reset());
    expect(controller.currentUpdate().automaticPaused).toBe(false);
  });
  it("keeps a slow elite remainder through a manual kill while paused", () => {
    const initial = {
      ...createCombatState({ criticalChance: 0, damage: 10, doubleRewardChance: 0 }, 0, true),
      enemy: { ...createCombatState().enemy, health: 1, modifier: "automatic-slow" as const },
      nextAutomaticAttackAtMs: 2_000,
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    controller.dispatch(battleCommands.frame(500));
    controller.dispatch(battleCommands.toggleAutomaticPause());
    expect(controller.currentUpdate().automaticRemainingMs).toBe(1500);
    controller.dispatch(battleCommands.attack("manual"));
    expect(controller.currentUpdate()).toMatchObject({
      automaticPaused: true,
      automaticRemainingMs: 1500,
      state: { enemy: { encounter: 2 } },
    });
    controller.dispatch(battleCommands.toggleAutomaticPause());
    controller.dispatch(battleCommands.frame(1_999));
    expect(controller.currentUpdate().state.enemy.health).toBe(
      controller.currentUpdate().state.enemy.maxHealth,
    );
  });
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
  it("publishes one explicit Golden Bug payout without changing the event shape", () => {
    const player = createCombatState({ damage: 10, doubleRewardChance: 0 }).player;
    const initial = {
      ...createCombatState(player),
      enemy: { ...spawnGoldenBug(51, player), health: 1 },
      goldenBug: { id: 50, resumeEncounter: 51 },
    };
    const controller = new BattleController({
      createInitialState: () => initial,
      initialNowMs: 0,
      initialState: initial,
      rolls,
    });
    const events: BattleControllerEvent[] = [];
    controller.subscribe((event) => events.push(event));
    expect(controller.dispatch(battleCommands.attack("manual"))).toBe(true);
    expect(events[0]?.events.at(-1)).toEqual({
      id: 1,
      message: "Golden Bug reward: +1,550 coins",
      attack: {
        kind: "hit",
        source: "manual",
        packets: { count: 1, units: 1 },
        damage: 40,
        defeated: true,
      },
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
    expect(updates.at(0)?.events.map((event) => event.message)).toEqual(["Kill: +1 coins"]);
    expect(updates.at(-1)?.events.map((event) => event.message)).toEqual([
      "Kill: +1 coins",
      "Purchased Unlock automatic attack",
      "Hit: 40 damage",
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
