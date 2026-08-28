import type { EliteModifier } from "../contracts";
import { ArmorEnemyModifier } from "./armor-enemy-modifier";
import { AutomaticSlowEnemyModifier } from "./automatic-slow-enemy-modifier";
import { HealthEnemyModifier } from "./health-enemy-modifier";
import type { EnemyModifierStrategy } from "./enemy-modifier-strategy";

type MissingModifiers<Order extends readonly EliteModifier[]> =
  Order extends readonly (infer Modifier extends EliteModifier)[]
    ? Exclude<EliteModifier, Modifier>
    : EliteModifier;

const MODIFIER_ORDER_VALUES = [
  "armor",
  "health",
  "automatic-slow",
] as const satisfies readonly EliteModifier[];
type CompleteModifierOrder =
  MissingModifiers<typeof MODIFIER_ORDER_VALUES> extends never
    ? typeof MODIFIER_ORDER_VALUES
    : never;
const MODIFIER_ORDER: CompleteModifierOrder = MODIFIER_ORDER_VALUES;

export class EnemyModifierRegistry {
  constructor(readonly strategies: Readonly<Record<EliteModifier, EnemyModifierStrategy>>) {}

  forRoll(roll: number): EnemyModifierStrategy {
    if (!Number.isFinite(roll) || roll < 0)
      throw new RangeError("Elite modifier roll must be a finite non-negative number");

    const index = Math.min(MODIFIER_ORDER.length - 1, Math.floor(roll * MODIFIER_ORDER.length));
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
};

const enemyModifierRegistry = new EnemyModifierRegistry(ENEMY_MODIFIERS);

export const modifierForRoll = (roll: number): EnemyModifierStrategy =>
  enemyModifierRegistry.forRoll(roll);
