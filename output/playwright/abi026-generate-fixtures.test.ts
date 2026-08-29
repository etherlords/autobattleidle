import { writeFileSync } from "node:fs";
import {
  createCombatState,
  criticalChanceForLevel,
  selectEnemyFamilyIdentity,
  spawnEnemy,
} from "../../src/domain/combat";
import { decodeSave, encodeSave } from "../../src/persistence/persistence-boundary";
import { expect, test } from "vitest";

const write = (name: string, state: ReturnType<typeof createCombatState>): void => {
  const raw = encodeSave(state);
  expect(encodeSave(decodeSave(JSON.parse(raw), createCombatState(), 0))).toBe(raw);
  writeFileSync(`output/playwright/abi026-${name}.json`, raw);
};

test("generates current-codec ABI-026 visual fixtures", () => {
  for (const [name, encounter, roll, family] of [
    ["body-beetle", 3, 0, "beetle"],
    ["body-brute", 1, 0, "brute"],
    ["body-wisp", 2, 0, "wisp"],
    ["body-mantis", 3, 0.76, "mantis"],
    ["body-sentinel", 3, 0.85, "sentinel"],
    ["body-drake", 3, 0.96, "drake"],
    ["body-boss-hydra", 35, 0, "boss-hydra"],
    ["body-boss-colossus", 70, 0, "boss-colossus"],
  ] as const) {
    const state = { ...createCombatState(), enemy: spawnEnemy(encounter, roll) };
    expect(
      selectEnemyFamilyIdentity({
        grade: state.enemy.grade,
        level: state.enemy.encounter,
        modifier: state.enemy.modifier,
      }),
    ).toMatchObject({ family });
    write(name, state);
  }

  write("armor-shield", { ...createCombatState(), enemy: spawnEnemy(3, 0) });
  const criticalPlayer = { criticalChance: criticalChanceForLevel(100), criticalLevel: 100 };
  write("hydra-critical", {
    ...createCombatState(criticalPlayer),
    enemy: spawnEnemy(35, 0),
  });
  write("colossus-critical", {
    ...createCombatState(criticalPlayer),
    enemy: spawnEnemy(70, 0),
  });
});
