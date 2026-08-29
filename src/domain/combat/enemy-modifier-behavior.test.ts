import { describe, expect, it } from "vitest";

import { attack, createCombatState, damageForLevel, spawnEnemy } from "../combat";

const command = (source: "manual" | "automatic", enemyId: number) => ({
  atMs: 0,
  enemyId,
  rolls: { critical: 0, doubleReward: 1, nextEliteModifier: 0 },
  source,
});

describe("ABI-022 modifier behavior", () => {
  it("keeps prior modifier rolls and adds the bounded hardened draft", () => {
    expect(spawnEnemy(3, 0)).toMatchObject({ modifier: "armor", armor: 6, maxHealth: 282 });
    expect(spawnEnemy(3, 0.34)).toMatchObject({ modifier: "health", armor: 0, maxHealth: 423 });
    expect(spawnEnemy(3, 0.67)).toMatchObject({
      modifier: "automatic-slow",
      armor: 0,
      maxHealth: 282,
    });
    expect(spawnEnemy(3, 0.76)).toMatchObject({ modifier: "hardened", armor: 6, maxHealth: 353 });
  });

  it("suppresses only critical damage for critical guard", () => {
    const state = {
      ...createCombatState({
        criticalChance: 0.5,
        criticalLevel: 5,
        damage: damageForLevel(5),
        damageLevel: 5,
      }),
      enemy: { ...spawnEnemy(3, 0.85), health: 100 },
    };
    const result = attack(state, command("manual", state.enemy.id));
    expect(result.event).toMatchObject({ critical: false, damage: damageForLevel(5) });
  });

  it("reduces only manual post-armor damage and retains the minimum floor", () => {
    const enemy = { ...spawnEnemy(3, 0.96), armor: 0, health: 100 };
    const state = {
      ...createCombatState({ damage: 5, damageLevel: 4 }),
      automaticUnlocked: true,
      enemy,
      nextAutomaticAttackAtMs: 0,
    };
    expect(attack(state, command("manual", enemy.id)).event).toMatchObject({ damage: 12 });
    expect(attack(state, command("automatic", enemy.id)).event).toMatchObject({ damage: 25 });
    const guardedFloor = attack(
      { ...state, enemy: { ...enemy, armor: 99 } },
      command("manual", enemy.id),
    );
    expect(guardedFloor.event).toMatchObject({ damage: 1 });
  });
});
