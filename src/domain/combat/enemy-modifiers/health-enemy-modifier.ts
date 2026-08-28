import { COMBAT_FORMULAS } from "../balance";
import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class HealthEnemyModifier extends EnemyModifierStrategy {
  readonly id = "health" as const;

  decorate(draft: EnemyModifierDraft): EnemyModifierDraft {
    return {
      ...draft,
      healthMultiplier: draft.healthMultiplier * COMBAT_FORMULAS.eliteHealthMultiplier,
    };
  }
}
