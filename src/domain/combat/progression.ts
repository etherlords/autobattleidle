import { COMBAT_BALANCE, COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type { CombatEnemy, EliteModifier, EnemyGrade } from "./contracts";

const selectGrade = (encounter: number): EnemyGrade => {
  if (encounter % COMBAT_BALANCE.bossInterval === 0) return "boss";
  return (["normal", "veteran", "elite"] as const)[(encounter - 1) % 3] ?? "normal";
};

const selectEliteModifier = (roll: number): EliteModifier =>
  (["armor", "health", "automatic-slow"] as const)[Math.min(2, Math.floor(roll * 3))] ?? "armor";

const bossHealthMultiplier = (encounter: number): number => {
  const bossIndex = Math.ceil(encounter / COMBAT_BALANCE.bossInterval) - 1;
  return (
    COMBAT_FORMULAS.bossHealthBaseMultiplier +
    COMBAT_FORMULAS.bossHealthIndexLinearMultiplier * bossIndex +
    COMBAT_FORMULAS.bossHealthIndexQuadraticMultiplier * bossIndex * bossIndex
  );
};

const enemyMultiplier = (grade: EnemyGrade, encounter: number): number => {
  if (grade === "boss") return bossHealthMultiplier(encounter);
  if (grade === "elite") return COMBAT_FORMULAS.eliteTierMultiplier;
  if (grade === "veteran") return COMBAT_FORMULAS.veteranTierMultiplier;
  return 1;
};

const enemyArmor = (
  grade: EnemyGrade,
  modifier: EliteModifier | null,
  encounter: number,
): number => {
  if (modifier === "armor") return encounter * COMBAT_FORMULAS.enemyArmorPerEncounter;
  return grade === "boss" ? encounter : 0;
};

export const spawnEnemy = (encounter: number, eliteModifierRoll: number): CombatEnemy => {
  if (!Number.isSafeInteger(encounter) || encounter < 1 || encounter > MAX_ENCOUNTER)
    throw new RangeError("Encounter must be a positive safe integer with safe outputs");
  const safeEncounter = encounter;
  const grade = selectGrade(safeEncounter);
  const modifier = grade === "elite" ? selectEliteModifier(eliteModifierRoll) : null;
  const baseHealth = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.round(
      COMBAT_BALANCE.baseEnemyHealth *
        (COMBAT_FORMULAS.enemyHealthGrowthBase +
          (COMBAT_BALANCE.enemyHealthGrowth - COMBAT_FORMULAS.enemyHealthGrowthBase) *
            (safeEncounter - 1)),
    ),
  );
  const multiplier = enemyMultiplier(grade, safeEncounter);
  const maxHealth = Math.max(
    COMBAT_FORMULAS.minimumDamage,
    Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.round(
        baseHealth *
          multiplier *
          (modifier === "health" ? COMBAT_FORMULAS.eliteHealthMultiplier : 1),
      ),
    ),
  );
  return {
    armor: enemyArmor(grade, modifier, safeEncounter),
    encounter: safeEncounter,
    grade,
    health: maxHealth,
    id: safeEncounter,
    maxHealth,
    modifier,
    reward: Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.max(1, Math.round(COMBAT_BALANCE.baseReward * safeEncounter * multiplier)),
    ),
  };
};
