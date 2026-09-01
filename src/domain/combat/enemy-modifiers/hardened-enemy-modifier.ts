import { COMBAT_FORMULAS } from "../balance";
import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class HardenedEnemyModifier extends EnemyModifierStrategy {
  readonly id = "hardened" as const;

  decorate(draft: EnemyModifierDraft, encounter: number, armorCap?: number): EnemyModifierDraft {
    const armor = draft.armor + encounter * COMBAT_FORMULAS.enemyArmorPerEncounter;
    return {
      armor: armorCap === undefined ? armor : Math.min(armor, armorCap),
      healthMultiplier: draft.healthMultiplier * 1.25,
    };
  }
}
