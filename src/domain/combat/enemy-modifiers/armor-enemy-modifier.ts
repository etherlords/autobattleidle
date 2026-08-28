import { COMBAT_FORMULAS } from "../balance";
import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class ArmorEnemyModifier extends EnemyModifierStrategy {
  readonly id = "armor" as const;

  decorate(draft: EnemyModifierDraft, encounter: number): EnemyModifierDraft {
    return { ...draft, armor: encounter * COMBAT_FORMULAS.enemyArmorPerEncounter };
  }
}
