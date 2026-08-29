import { COMBAT_FORMULAS } from "../balance";
import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class HardenedEnemyModifier extends EnemyModifierStrategy {
  readonly id = "hardened" as const;

  decorate(draft: EnemyModifierDraft, encounter: number): EnemyModifierDraft {
    return {
      armor: draft.armor + encounter * COMBAT_FORMULAS.enemyArmorPerEncounter,
      healthMultiplier: draft.healthMultiplier * 1.25,
    };
  }
}
