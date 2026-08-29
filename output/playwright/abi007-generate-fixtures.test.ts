import { writeFileSync } from "node:fs";
import {
  createCombatState,
  damageForLevel,
  selectEnemyFamilyIdentity,
  spawnEnemy,
} from "../../src/domain/combat";
import { decodeSave, encodeSave } from "../../src/persistence/persistence-boundary";
import { expect, test } from "vitest";

const state = (encounter: number, roll: number) => {
  const base = createCombatState(0);
  return encodeSave({ ...base, enemy: spawnEnemy(encounter, roll) });
};

const write = (name: string, value: ReturnType<typeof createCombatState>): void => {
  const raw = encodeSave(value);
  expect(encodeSave(decodeSave(JSON.parse(raw), createCombatState(), 0))).toBe(raw);
  writeFileSync(`output/playwright/abi007-${name}.json`, raw);
};

test("generates production codec visual fixtures", () => {
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
    const raw = state(encounter, roll);
    const decoded = decodeSave(JSON.parse(raw), createCombatState(), 0);
    expect(
      selectEnemyFamilyIdentity({
        grade: decoded.enemy.grade,
        level: decoded.enemy.encounter,
        modifier: decoded.enemy.modifier,
      }),
    ).toMatchObject({ family });
    expect(encodeSave(decoded)).toBe(raw);
    writeFileSync(`output/playwright/abi007-${name}.json`, raw);
  }

  const fastPlayer = {
    damage: damageForLevel(1_000),
    damageLevel: 1_000,
  };
  const autoPlayer = { automaticSpeedLevel: 100 };
  write("armor-effect", {
    ...createCombatState({ damage: damageForLevel(10), damageLevel: 10 }),
    enemy: spawnEnemy(3, 0),
  });
  write("auto-unlocked", {
    ...createCombatState(autoPlayer, 0, true),
    coins: Number.MAX_SAFE_INTEGER,
  });
  write("auto-slow", {
    ...createCombatState(autoPlayer, 0, true),
    coins: Number.MAX_SAFE_INTEGER,
    enemy: spawnEnemy(3, 0.67),
  });
  for (const encounter of [70, 105]) {
    const enemy = spawnEnemy(encounter, 0);
    write(`boss-fixture-${encounter}`, {
      ...createCombatState(fastPlayer),
      enemy: { ...enemy, health: 1 },
    });
  }
});
