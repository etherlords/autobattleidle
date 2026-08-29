import type { EliteModifier } from "../contracts";
import { ArmorEnemyModifier } from "./armor-enemy-modifier";
import { AutomaticSlowEnemyModifier } from "./automatic-slow-enemy-modifier";
import { HealthEnemyModifier } from "./health-enemy-modifier";
import { HardenedEnemyModifier } from "./hardened-enemy-modifier";
import { CriticalGuardEnemyModifier } from "./critical-guard-enemy-modifier";
import { ManualGuardEnemyModifier } from "./manual-guard-enemy-modifier";
import type { EnemyModifierStrategy } from "./enemy-modifier-strategy";

type MissingModifiers<Order extends readonly EliteModifier[]> =
  Order extends readonly (infer Modifier extends EliteModifier)[]
    ? Exclude<EliteModifier, Modifier>
    : EliteModifier;

const MODIFIER_ORDER_VALUES = [
  "armor",
  "health",
  "automatic-slow",
  "hardened",
  "critical-guard",
  "manual-guard",
] as const satisfies readonly EliteModifier[];
type CompleteModifierOrder =
  MissingModifiers<typeof MODIFIER_ORDER_VALUES> extends never
    ? typeof MODIFIER_ORDER_VALUES
    : never;
const MODIFIER_ORDER: CompleteModifierOrder = MODIFIER_ORDER_VALUES;
const MODIFIER_ROLL_STARTS = [0, 1 / 3, 2 / 3, 3 / 4, 5 / 6, 11 / 12] as const;

export class EnemyModifierRegistry {
  constructor(readonly strategies: Readonly<Record<EliteModifier, EnemyModifierStrategy>>) {}

  forRoll(roll: number): EnemyModifierStrategy {
    if (!Number.isFinite(roll) || roll < 0)
      throw new RangeError("Elite modifier roll must be a finite non-negative number");

    const index =
      roll === 1
        ? 2
        : MODIFIER_ROLL_STARTS.reduce(
            (selected, start, candidate) => (roll >= start ? candidate : selected),
            0,
          );
    const id = MODIFIER_ORDER[index];
    if (id === undefined) throw new RangeError("Elite modifier roll did not select a modifier");

    const strategy = this.strategies[id];
    if (strategy === undefined) throw new Error(`Missing enemy modifier strategy: ${id}`);
    return strategy;
  }
}

export const ENEMY_MODIFIERS: Readonly<Record<EliteModifier, EnemyModifierStrategy>> = {
  armor: new ArmorEnemyModifier(),
  health: new HealthEnemyModifier(),
  "automatic-slow": new AutomaticSlowEnemyModifier(),
  hardened: new HardenedEnemyModifier(),
  "critical-guard": new CriticalGuardEnemyModifier(),
  "manual-guard": new ManualGuardEnemyModifier(),
};

const enemyModifierRegistry = new EnemyModifierRegistry(ENEMY_MODIFIERS);

export const modifierForRoll = (roll: number): EnemyModifierStrategy =>
  enemyModifierRegistry.forRoll(roll);
