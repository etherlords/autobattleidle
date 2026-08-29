import { COMBAT_BALANCE, COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type { CombatEnemy, EliteModifier, EnemyGrade } from "./contracts";
import { modifierForRoll } from "./enemy-modifiers";
import { ENEMY_TIERS } from "./enemy-definitions";

type OrdinaryGrade = Exclude<EnemyGrade, "boss">;
type MissingOrdinaryGrades<Order extends readonly OrdinaryGrade[]> =
  Order extends readonly (infer Grade extends OrdinaryGrade)[]
    ? Exclude<OrdinaryGrade, Grade>
    : OrdinaryGrade;

const ORDINARY_GRADE_VALUES = [
  "normal",
  "veteran",
  "elite",
] as const satisfies readonly OrdinaryGrade[];
type CompleteOrdinaryGradeOrder =
  MissingOrdinaryGrades<typeof ORDINARY_GRADE_VALUES> extends never
    ? typeof ORDINARY_GRADE_VALUES
    : never;
const ORDINARY_GRADES: CompleteOrdinaryGradeOrder = ORDINARY_GRADE_VALUES;

const selectGrade = (encounter: number): EnemyGrade => {
  if (encounter % COMBAT_BALANCE.bossInterval === 0) return "boss";
  const grade = ORDINARY_GRADES[(encounter - 1) % ORDINARY_GRADES.length];
  if (grade === undefined) throw new RangeError("Encounter did not select an ordinary enemy grade");
  return grade;
};

export const spawnEnemy = (encounter: number, eliteModifierRoll: number): CombatEnemy => {
  if (!Number.isSafeInteger(encounter) || encounter < 1 || encounter > MAX_ENCOUNTER)
    throw new RangeError("Encounter must be a positive safe integer with safe outputs");
  const safeEncounter = encounter;
  const grade = selectGrade(safeEncounter);
  let modifier: EliteModifier | null = null;
  const baseHealth = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.round(
      COMBAT_BALANCE.baseEnemyHealth *
        (COMBAT_FORMULAS.enemyHealthGrowthBase +
          (COMBAT_BALANCE.enemyHealthGrowth - COMBAT_FORMULAS.enemyHealthGrowthBase) *
            (safeEncounter - 1)),
    ),
  );
  const tier = ENEMY_TIERS[grade];
  const multiplier = tier.multiplier(safeEncounter);
  const baseModifierDraft = { armor: tier.armor(safeEncounter), healthMultiplier: 1 };
  let modifierDraft = baseModifierDraft;
  if (grade === "elite") {
    const modifierStrategy = modifierForRoll(eliteModifierRoll);
    modifier = modifierStrategy.id;
    modifierDraft = modifierStrategy.decorate(baseModifierDraft, safeEncounter);
  }
  const maxHealth = Math.max(
    COMBAT_FORMULAS.minimumDamage,
    Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.round(baseHealth * multiplier * modifierDraft.healthMultiplier),
    ),
  );
  return {
    armor: modifierDraft.armor,
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

export const spawnStarterEnemy = (eliteModifierRoll: number): CombatEnemy => {
  const enemy = spawnEnemy(1, eliteModifierRoll);
  return {
    ...enemy,
    health: COMBAT_BALANCE.starterEnemyHealth,
    maxHealth: COMBAT_BALANCE.starterEnemyHealth,
  };
};
