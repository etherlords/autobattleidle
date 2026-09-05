import {
  BOSS_FAMILY_BALANCE,
  COMBAT_BALANCE,
  COMBAT_FORMULAS,
  MAX_ENCOUNTER,
  type BossFamilyBalance,
} from "./balance";
import type {
  BossFamily,
  CombatEnemy,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
} from "./contracts";
import {
  automaticAttacksPerSecond,
  criticalChanceForLevel,
  damageForLevel,
  effectiveArmor,
} from "./upgrades";
import { modifierForRoll } from "./enemy-modifiers";
import { ENEMY_TIERS } from "./enemy-definitions";
import { armorPenetrationLevelFor, criticalLevelFor, damageLevelFor } from "./player-stats";
import { selectEnemyFamilyIdentity } from "./family-identity";

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
const legacyMultiplier = (
  grade: EnemyGrade,
  encounter: number,
  bossInterval: number = COMBAT_BALANCE.bossInterval,
): number => {
  if (grade === "boss") {
    const bossIndex = Math.ceil(encounter / bossInterval) - 1;
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

const playerDamage = (player: CombatPlayer): number => damageForLevel(damageLevelFor(player));

const safeRounded = (value: number): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(COMBAT_FORMULAS.minimumDamage, Math.round(value)));

const productionBaseHealth = (player: CombatPlayer, grade: OrdinaryGrade): number => {
  const damage = playerDamage(player);
  if (grade === "normal") return damage;
  return damage * ENEMY_TIERS[grade].multiplier(1);
};

const isBossFamily = (family: string): family is BossFamily => family.startsWith("boss-");
const bossBalanceForEncounter = (
  encounter: number,
  bossInterval: number = COMBAT_BALANCE.bossInterval,
) => {
  const family = selectEnemyFamilyIdentity({
    bossInterval,
    grade: "boss",
    level: encounter,
    modifier: null,
  }).family;
  if (!isBossFamily(family)) throw new Error("Boss encounter selected an ordinary family");
  return BOSS_FAMILY_BALANCE[family];
};

const legacyStageHealth = (
  grade: EnemyGrade,
  encounter: number,
  bossInterval: number = COMBAT_BALANCE.bossInterval,
): number => {
  const growth =
    COMBAT_FORMULAS.enemyHealthGrowthBase +
    (COMBAT_BALANCE.enemyHealthGrowth - COMBAT_FORMULAS.enemyHealthGrowthBase) * (encounter - 1);
  return safeRounded(
    Math.round(COMBAT_BALANCE.baseEnemyHealth * growth) *
      legacyMultiplier(grade, encounter, bossInterval),
  );
};

/** Same post-armor non-critical damage owner used by production attack resolution. */
const bossNonCriticalDamage = (
  player: CombatPlayer,
  encounter: number,
  armorMultiplier = 1,
): number => {
  const armor = effectiveArmor(
    Math.round(encounter * armorMultiplier),
    armorPenetrationLevelFor(player),
  );
  return Math.max(COMBAT_FORMULAS.minimumDamage, playerDamage(player) - armor);
};

/** Expected automatic damage uses the same player-stat and armor rules as production attacks. */
const expectedAutomaticBossDps = (
  player: CombatPlayer,
  encounter: number,
  armorMultiplier = 1,
): number => {
  const nonCriticalDamage = bossNonCriticalDamage(player, encounter, armorMultiplier);
  const expectedDamage =
    nonCriticalDamage *
    (1 +
      criticalChanceForLevel(criticalLevelFor(player)) *
        (COMBAT_FORMULAS.criticalDamageMultiplier - 1));
  return automaticAttacksPerSecond(player.automaticSpeedLevel) * expectedDamage;
};

const productionBossHealth = (
  player: CombatPlayer,
  encounter: number,
  bossInterval: number,
  armorMultiplier: number,
): number => {
  const currentThirtyHitHealth = safeRounded(
    bossNonCriticalDamage(player, encounter, armorMultiplier) * COMBAT_FORMULAS.bossTargetHits,
  );
  const automaticThreeMinuteHealth = safeRounded(
    expectedAutomaticBossDps(player, encounter, armorMultiplier) * 180,
  );
  return Math.min(
    legacyStageHealth("boss", encounter, bossInterval),
    Math.max(currentThirtyHitHealth, automaticThreeMinuteHealth),
  );
};
/** The immediately preceding V4 representation, retained only for save recognition. */
export const previousPlayerRelativeBossHealth = (player: CombatPlayer): number =>
  safeRounded(playerDamage(player) * COMBAT_FORMULAS.bossTargetHits);

const eliteArmorCap = (player: CombatPlayer | undefined): number | undefined => {
  if (player === undefined) return undefined;
  return Math.floor(damageForLevel(player.damageLevel ?? Math.max(0, player.damage - 1)) / 2);
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

const playerBaseHealthForSpawn = (
  grade: EnemyGrade,
  encounter: number,
  candidateGrowth: number,
  player: CombatPlayer,
  bossInterval: number,
  bossBalance: BossFamilyBalance | undefined,
): number => {
  if (grade !== "boss") return productionBaseHealth(player, grade) * candidateGrowth;
  return safeRounded(
    productionBossHealth(player, encounter, bossInterval, bossBalance?.armorMultiplier ?? 1) *
      (bossBalance?.healthMultiplier ?? 1),
  );
};

const legacyBaseHealthForSpawn = (
  grade: EnemyGrade,
  encounter: number,
  candidateGrowth: number,
  ordinaryHealthGrowthRate: number | undefined,
  bossInterval: number,
  bossBalance: BossFamilyBalance | undefined,
): number => {
  if (ordinaryHealthGrowthRate !== undefined && grade !== "boss")
    return safeRounded(
      Math.round(COMBAT_BALANCE.baseEnemyHealth * candidateGrowth) *
        legacyMultiplier(grade, encounter, bossInterval),
    );
  if (grade !== "boss") return legacyStageHealth(grade, encounter, bossInterval);
  return safeRounded(
    legacyStageHealth(grade, encounter, bossInterval) * (bossBalance?.healthMultiplier ?? 1),
  );
};

const baseHealthForSpawn = (
  grade: EnemyGrade,
  encounter: number,
  candidateGrowth: number,
  ordinaryHealthGrowthRate: number | undefined,
  player: CombatPlayer | undefined,
  bossInterval: number,
): number => {
  const bossBalance =
    grade === "boss" ? bossBalanceForEncounter(encounter, bossInterval) : undefined;
  if (player !== undefined)
    return playerBaseHealthForSpawn(
      grade,
      encounter,
      candidateGrowth,
      player,
      bossInterval,
      bossBalance,
    );
  return legacyBaseHealthForSpawn(
    grade,
    encounter,
    candidateGrowth,
    ordinaryHealthGrowthRate,
    bossInterval,
    bossBalance,
  );
};

const modifierForSpawn = (
  grade: EnemyGrade,
  encounter: number,
  eliteModifierRoll: number,
  player: CombatPlayer | undefined,
): {
  readonly modifier: EliteModifier | null;
  readonly draft: { readonly armor: number; readonly healthMultiplier: number };
} => {
  const tier = ENEMY_TIERS[grade];
  const baseModifierDraft = { armor: tier.armor(encounter), healthMultiplier: 1 };
  if (grade !== "elite") return { modifier: null, draft: baseModifierDraft };
  const modifierStrategy = modifierForRoll(eliteModifierRoll);
  return {
    modifier: modifierStrategy.id,
    draft: modifierStrategy.decorate(baseModifierDraft, encounter, eliteArmorCap(player)),
  };
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
  const bossBalance =
    grade === "boss" ? bossBalanceForEncounter(safeEncounter, bossInterval) : undefined;
  validateOrdinaryHealthGrowthRate(ordinaryHealthGrowthRate);
  const candidateGrowth =
    ordinaryHealthGrowthRate === undefined || grade === "boss"
      ? 1
      : (1 + ordinaryHealthGrowthRate) ** (safeEncounter - 1);
  const baseHealth = baseHealthForSpawn(
    grade,
    safeEncounter,
    candidateGrowth,
    ordinaryHealthGrowthRate,
    player,
    bossInterval,
  );
  const { modifier, draft: modifierDraft } = modifierForSpawn(
    grade,
    safeEncounter,
    eliteModifierRoll,
    player,
  );
  const maxHealth = Math.max(
    COMBAT_FORMULAS.minimumDamage,
    Math.min(Number.MAX_SAFE_INTEGER, Math.round(baseHealth * modifierDraft.healthMultiplier)),
  );
  return {
    armor: Math.round(modifierDraft.armor * (bossBalance?.armorMultiplier ?? 1)),
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
          COMBAT_BALANCE.baseReward *
            safeEncounter *
            legacyMultiplier(grade, safeEncounter, bossInterval) *
            (bossBalance?.rewardMultiplier ?? 1),
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
