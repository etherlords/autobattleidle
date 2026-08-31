export type AttackSource = "manual" | "automatic";
/** Simulator-only alternatives; omitting either preserves production asymptotic formulas. */
export type CriticalChancePolicy = "asymptotic" | "linear-capped";
export type ArmorPenetrationPolicy = "asymptotic" | "linear-capped";

export type EnemyGrade = "normal" | "veteran" | "elite" | "boss";
export type EliteModifier =
  "armor" | "health" | "automatic-slow" | "hardened" | "critical-guard" | "manual-guard";

export type CombatEnemy = {
  readonly id: number;
  readonly encounter: number;
  readonly grade: EnemyGrade;
  readonly modifier: EliteModifier | null;
  readonly health: number;
  readonly maxHealth: number;
  readonly armor: number;
  readonly reward: number;
};

export type GoldenBugEvent = {
  readonly id: number;
  readonly resumeEncounter: number;
};

export type CombatPlayer = {
  readonly automaticSpeedLevel: number;
  readonly criticalChance: number;
  readonly damage: number;
  readonly doubleRewardChance: number;
  readonly armorPenetrationLevel?: number;
  readonly criticalLevel?: number;
  readonly damageLevel?: number;
  readonly doubleRewardLevel?: number;
};

export type UpgradeId =
  | "automatic-unlock"
  | "damage"
  | "armor-penetration"
  | "critical-chance"
  | "double-reward"
  | "automatic-speed";

export type UpgradeDefinition = {
  readonly id: UpgradeId;
  readonly label: string;
  readonly baseCost: number;
};

export type CombatState = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly nextAutomaticAttackAtMs: number;
  readonly player: CombatPlayer;
  readonly goldenBug: GoldenBugEvent | null;
  /** Cumulative defeated (not escaped) Golden Bugs. */
  readonly goldenBugDefeats: number;
};

export type AttackRolls = {
  readonly critical: number;
  readonly doubleReward: number;
  readonly nextEliteModifier: number;
};

export type AttackCommand = {
  readonly atMs: number;
  readonly enemyId: number;
  /** Simulator-only ordinary-enemy curve; omitted keeps the production formula. */
  readonly ordinaryHealthGrowthRate?: number;
  /** Automatic visual batching scales only this resolved packet's damage. */
  readonly damageMultiplier?: number;
  /** Lets one visual tick resolve several automatic packets at one timestamp. */
  readonly automaticBatch?: boolean;
  /** Simulator-only alternate cadence passed to production progression spawning. */
  readonly bossInterval?: number;
  /** Simulator-only chance formula evaluated by the production attack operation. */
  readonly criticalChancePolicy?: CriticalChancePolicy;
  /** Simulator-only penetration formula evaluated by the production attack operation. */
  readonly armorPenetrationPolicy?: ArmorPenetrationPolicy;
  readonly rolls: AttackRolls;
  readonly source: AttackSource;
};

export type AttackEvent =
  | { readonly type: "ignored" }
  | {
      readonly type: "hit";
      readonly critical: boolean;
      readonly damage: number;
      readonly defeated: boolean;
      readonly reward: number;
      readonly armorPreventedDamage: number;
      readonly penetration: number;
    };

export type AttackResult = { readonly event: AttackEvent; readonly state: CombatState };
export type UpgradePurchase = { readonly state: CombatState; readonly reason: string | null };
