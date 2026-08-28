import { describe, expect, it } from "vitest";

import {
  attack,
  COMBAT_BALANCE,
  createCombatState,
  purchaseUpgrade,
  spawnEnemy,
  upgradeCost,
  type AttackCommand,
  type CombatState,
} from "./combat";

const player = { criticalChance: 0, damage: 10, doubleRewardChance: 0 };

const command = (state: CombatState, source: AttackCommand["source"], atMs = 0): AttackCommand => ({
  atMs,
  enemyId: state.enemy.id,
  rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
  source,
});

describe("combat simulation", () => {
  it("uses one attack command for manual and automatic attacks", () => {
    const state = createCombatState(player, 0, true);
    const manual = attack(state, command(state, "manual"));
    const automatic = attack(state, command(state, "automatic"));

    expect(manual.event).toEqual(automatic.event);
    expect(manual.state).toMatchObject({ coins: 1, enemy: { encounter: 2 } });
    expect(automatic.state).toMatchObject({ coins: 1, enemy: { encounter: 2 } });
  });

  it("rejects automatic attacks before unlock without changing manual attacks", () => {
    const state = createCombatState(player, 0, false);

    expect(attack(state, command(state, "automatic")).event).toEqual({ type: "ignored" });
    expect(attack(state, command(state, "manual")).event).toMatchObject({ type: "hit" });
  });

  it("bounds armored damage and doubles final critical damage", () => {
    const state: CombatState = {
      ...createCombatState({ ...player, criticalChance: 1, damage: 3 }, 0, false),
      enemy: { ...spawnEnemy(3, 0), armor: 99, health: 10 },
    };

    const result = attack(state, {
      ...command(state, "manual"),
      rolls: { critical: 0, doubleReward: 1, nextEliteModifier: 0 },
    });
    expect(result.event).toMatchObject({ critical: true, damage: 2, defeated: false, reward: 0 });
    expect(result.state.enemy.health).toBe(8);
  });

  it("advances once, pays one double reward, and ignores a stale duplicate", () => {
    const state = createCombatState({ ...player, damage: 100, doubleRewardChance: 1 }, 0, false);
    const defeated = attack(state, {
      ...command(state, "manual"),
      rolls: { critical: 1, doubleReward: 0, nextEliteModifier: 0 },
    });
    const duplicate = attack(defeated.state, command(state, "manual"));

    expect(defeated.event).toMatchObject({ defeated: true, reward: 2 });
    expect(defeated.state).toMatchObject({ coins: 2, enemy: { encounter: 2 } });
    expect(duplicate.event).toEqual({ type: "ignored" });
    expect(duplicate.state.coins).toBe(2);
  });

  it("selects deterministic grades, bosses, and seeded elite modifiers", () => {
    expect(spawnEnemy(1, 0)).toMatchObject({ grade: "normal", modifier: null });
    expect(spawnEnemy(2, 0)).toMatchObject({ grade: "veteran", modifier: null });
    expect(spawnEnemy(3, 0.8)).toMatchObject({ grade: "elite", modifier: "automatic-slow" });
    expect(spawnEnemy(COMBAT_BALANCE.bossInterval, 0)).toMatchObject({
      grade: "boss",
      modifier: null,
    });
  });

  it("slows only scheduled automatic attacks against a slow elite", () => {
    const state: CombatState = {
      ...createCombatState(player, 0, true),
      enemy: spawnEnemy(3, 0.8),
    };
    const automatic = attack(state, command(state, "automatic", 10));
    const manual = attack(state, command(state, "manual", 10));

    expect(automatic.state.nextAutomaticAttackAtMs).toBe(
      10 + COMBAT_BALANCE.automaticAttackIntervalMs + COMBAT_BALANCE.eliteAutomaticSlowMs,
    );
    expect(manual.state.nextAutomaticAttackAtMs).toBe(0);
  });

  it("accepts unlocked automatic attacks once per second", () => {
    const state = createCombatState({ ...player, damage: 1 }, 0, true);
    const first = attack(state, command(state, "automatic", 0));
    const early = attack(first.state, command(first.state, "automatic", 999));
    const next = attack(first.state, command(first.state, "automatic", 1_000));

    expect(early.event).toEqual({ type: "ignored" });
    expect(next.event).toMatchObject({ type: "hit" });
    expect(next.state.nextAutomaticAttackAtMs).toBe(2_000);
  });

  it("purchases the five upgrades atomically with prerequisites, caps, and geometric costs", () => {
    const state = {
      ...createCombatState({ ...player, damage: 1 }, 0, false),
      coins: 10_000,
    };
    expect(purchaseUpgrade(state, "automatic-speed", 0).reason).toBe(
      "Requires automatic attack unlock",
    );
    const unlocked = purchaseUpgrade(state, "automatic-unlock", 10).state;
    expect(unlocked.nextAutomaticAttackAtMs).toBe(1_010);
    const damage = purchaseUpgrade(unlocked, "damage", 10).state;
    expect(damage.player.damage).toBe(2);
    expect(upgradeCost(damage, "damage")).toBe(4);
    const critical = purchaseUpgrade(damage, "critical-chance", 10).state;
    const rewards = purchaseUpgrade(critical, "double-reward", 10).state;
    const speed = purchaseUpgrade(rewards, "automatic-speed", 10).state;
    expect(speed.player).toMatchObject({
      automaticSpeedLevel: 1,
      criticalChance: 0.1,
      doubleRewardChance: 0.1,
    });
    expect(speed.nextAutomaticAttackAtMs).toBe(910);
    const capped = { ...speed, player: { ...speed.player, criticalChance: 0.5 } };
    expect(purchaseUpgrade(capped, "critical-chance", 10).reason).toBe("Maximum level reached");
  });

  it("reschedules slow elite automatic attacks after speed purchase without changing manual attacks", () => {
    const state: CombatState = {
      ...createCombatState({ ...player, automaticSpeedLevel: 0 }, 0, true),
      coins: 100,
      enemy: spawnEnemy(3, 0.8),
      nextAutomaticAttackAtMs: 1_600,
    };
    const speed = purchaseUpgrade(state, "automatic-speed", 100).state;
    const manual = attack(speed, command(speed, "manual", 100));

    expect(speed.nextAutomaticAttackAtMs).toBe(1_500);
    expect(manual.state.nextAutomaticAttackAtMs).toBe(1_500);
    expect(manual.state.enemy.health).toBe(state.enemy.health - player.damage);
  });
});
