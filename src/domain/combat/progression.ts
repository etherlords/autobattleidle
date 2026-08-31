import { COMBAT_BALANCE, COMBAT_FORMULAS, MAX_ENCOUNTER } from "./balance";
import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
} from "./contracts";
import { automaticAttacksPerSecond, damageForLevel } from "./upgrades";
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

const selectGrade = (
  encounter: number,
  bossInterval: number = COMBAT_BALANCE.bossInterval,
): EnemyGrade => {
  if (encounter % bossInterval === 0) return "boss";
  const grade = ORDINARY_GRADES[(encounter - 1) % ORDINARY_GRADES.length];
  if (grade === undefined) throw new RangeError("Encounter did not select an ordinary enemy grade");
  return grade;
};

const legacyMultiplier = (grade: EnemyGrade, encounter: number): number => {
  if (grade === "boss") {
    const bossIndex = Math.ceil(encounter / COMBAT_BALANCE.bossInterval) - 1;
    return (
      COMBAT_FORMULAS.bossHealthBaseMultiplier +
      COMBAT_FORMULAS.bossHealthIndexLinearMultiplier * bossIndex +
      COMBAT_FORMULAS.bossHealthIndexQuadraticMultiplier * bossIndex * bossIndex
    );
  }
  if (grade === "elite") return COMBAT_FORMULAS.eliteTierMultiplier;
  if (grade === "veteran") return COMBAT_FORMULAS.veteranTierMultiplier;
  return 1;
};

const productionBaseHealth = (player: CombatPlayer, grade: EnemyGrade): number => {
  const damage = damageForLevel(player.damageLevel ?? Math.max(0, player.damage - 1));
  if (grade === "normal") return damage;
  return damage * ENEMY_TIERS[grade].multiplier(1);
};

const validateOrdinaryHealthGrowthRate = (ordinaryHealthGrowthRate: number | undefined): void => {
  if (
    ordinaryHealthGrowthRate !== undefined &&
    (!Number.isFinite(ordinaryHealthGrowthRate) || ordinaryHealthGrowthRate < 0)
  )
    throw new RangeError("Ordinary health growth rate must be finite and non-negative");
};

const validateBossInterval = (bossInterval: number): void => {
  if (!Number.isSafeInteger(bossInterval) || bossInterval < 2)
    throw new RangeError("Boss interval must be a safe integer of at least two");
};

export const spawnEnemy = (
  encounter: number,
  eliteModifierRoll: number,
  ordinaryHealthGrowthRate?: number,
  player?: CombatPlayer,
  bossInterval: number = COMBAT_BALANCE.bossInterval,
): CombatEnemy => {
  if (!Number.isSafeInteger(encounter) || encounter < 1 || encounter > MAX_ENCOUNTER)
    throw new RangeError("Encounter must be a positive safe integer with safe outputs");
  const safeEncounter = encounter;
  validateBossInterval(bossInterval);
  const grade = selectGrade(safeEncounter, bossInterval);
  let modifier: EliteModifier | null = null;
  validateOrdinaryHealthGrowthRate(ordinaryHealthGrowthRate);
  const candidateGrowth =
    ordinaryHealthGrowthRate === undefined || grade === "boss"
      ? 1
      : (1 + ordinaryHealthGrowthRate) ** (safeEncounter - 1);
  const legacyGrowth =
    COMBAT_FORMULAS.enemyHealthGrowthBase +
    (COMBAT_BALANCE.enemyHealthGrowth - COMBAT_FORMULAS.enemyHealthGrowthBase) *
      (safeEncounter - 1);
  const baseHealth =
    player === undefined
      ? Math.round(
          COMBAT_BALANCE.baseEnemyHealth *
            (ordinaryHealthGrowthRate === undefined || grade === "boss"
              ? legacyGrowth
              : candidateGrowth),
        ) * legacyMultiplier(grade, safeEncounter)
      : productionBaseHealth(player, grade) * candidateGrowth;
  const tier = ENEMY_TIERS[grade];
  const baseModifierDraft = { armor: tier.armor(safeEncounter), healthMultiplier: 1 };
  let modifierDraft = baseModifierDraft;
  if (grade === "elite") {
    const modifierStrategy = modifierForRoll(eliteModifierRoll);
    modifier = modifierStrategy.id;
    modifierDraft = modifierStrategy.decorate(baseModifierDraft, safeEncounter);
  }
  const maxHealth = Math.max(
    COMBAT_FORMULAS.minimumDamage,
    Math.min(Number.MAX_SAFE_INTEGER, Math.round(baseHealth * modifierDraft.healthMultiplier)),
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
      Math.max(
        1,
        Math.round(
          COMBAT_BALANCE.baseReward * safeEncounter * legacyMultiplier(grade, safeEncounter),
        ),
      ),
    ),
  };
};

export const spawnStarterEnemy = (
  eliteModifierRoll: number,
  player?: CombatPlayer,
): CombatEnemy => {
  const enemy = spawnEnemy(1, eliteModifierRoll, undefined, player);
  return {
    ...enemy,
    health: COMBAT_BALANCE.starterEnemyHealth,
    maxHealth: COMBAT_BALANCE.starterEnemyHealth,
  };
};

export const goldenBugHealth = (player: CombatPlayer): number =>
  Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(
      COMBAT_FORMULAS.minimumDamage,
      Math.ceil(
        COMBAT_FORMULAS.goldenBugAutomaticHitBudgetFactor *
          Math.sqrt(automaticAttacksPerSecond(player.automaticSpeedLevel)),
      ) * damageForLevel(player.damageLevel ?? Math.max(0, player.damage - 1)),
    ),
  );

export const spawnGoldenBug = (resumeEncounter: number, player: CombatPlayer): CombatEnemy => {
  const resumed = spawnEnemy(resumeEncounter, 0);
  const maxHealth = goldenBugHealth(player);
  return {
    armor: 0,
    encounter: resumeEncounter,
    grade: "normal",
    health: maxHealth,
    id: Math.min(Number.MAX_SAFE_INTEGER, resumeEncounter + MAX_ENCOUNTER),
    maxHealth,
    modifier: null,
    reward: Math.min(
      Number.MAX_SAFE_INTEGER,
      resumed.reward * COMBAT_BALANCE.goldenBugRewardFactor,
    ),
  };
};

export const expireGoldenBug = (
  state: CombatState,
  ordinaryHealthGrowthRate?: number,
): CombatState =>
  state.goldenBug === null
    ? state
    : {
        ...state,
        enemy: spawnEnemy(
          state.goldenBug.resumeEncounter,
          0,
          ordinaryHealthGrowthRate,
          state.player,
        ),
        goldenBug: null,
      };
