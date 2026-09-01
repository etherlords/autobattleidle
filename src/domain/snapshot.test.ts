import { describe, expect, it } from "vitest";

import { attack, createCombatState, effectiveArmor, spawnEnemy, spawnGoldenBug } from "./combat";
import { createBattleSnapshot } from "./snapshot";
import { enemyVisualSpec } from "../game/enemy-visual/spec";
import { decodeSave, encodeSave } from "../persistence/persistence-boundary";

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

  it("keeps saved presentation names paired with rendered bodies without saving a name", () => {
    const initial = createCombatState();
    const goldenBug = {
      ...initial,
      enemy: spawnGoldenBug(51, initial.player),
      goldenBug: { id: 50, resumeEncounter: 51 },
    };
    const states = [
      { expectedName: "Ember Brute", state: initial },
      {
        expectedName: "Thorn Mantis",
        state: { ...initial, enemy: spawnEnemy(3, 0.76, undefined, initial.player) },
      },
      {
        expectedName: "Cinder Hydra",
        state: { ...initial, enemy: spawnEnemy(35, 0, undefined, initial.player) },
      },
      { expectedName: "Golden Bug", state: goldenBug },
    ];

    for (const { expectedName, state } of states) {
      const encoded = encodeSave(state);
      const restored = decodeSave(JSON.parse(encoded), createCombatState(), 0);
      const snapshot = createBattleSnapshot(restored, 0, [], []);
      const visual = enemyVisualSpec({
        goldenBug: restored.goldenBug !== null,
        grade: restored.enemy.grade,
        level: restored.enemy.encounter,
        modifier: restored.enemy.modifier,
      });

      expect(encoded).not.toContain('"name"');
      expect(snapshot.enemy).toMatchObject({ family: visual.body, seed: visual.seed });
      expect(snapshot.enemy.name).toBe(expectedName);
    }
  });

  it("reports the same armor values used by attack resolution", () => {
    const player = createCombatState({
      armorPenetrationLevel: 5,
      damageLevel: 6,
      damage: 31,
    }).player;
    const state = { ...createCombatState(player), enemy: spawnEnemy(36, 0, undefined, player) };
    const snapshot = createBattleSnapshot(state, 0, [], []);
    const result = attack(state, {
      atMs: 0,
      enemyId: state.enemy.id,
      rolls: { critical: 1, doubleReward: 1, nextEliteModifier: 0 },
      source: "manual",
    });
    if (result.event.type === "ignored") throw new Error("Expected resolved attack");
    expect(snapshot.enemy.armor).toEqual({
      effective: effectiveArmor(state.enemy.armor, player.armorPenetrationLevel ?? 0),
      raw: state.enemy.armor,
    });
    expect(result.event.armorPreventedDamage).toBe(snapshot.enemy.armor.effective);
  });
});
