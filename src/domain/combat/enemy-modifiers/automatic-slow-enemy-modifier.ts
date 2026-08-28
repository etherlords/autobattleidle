import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class AutomaticSlowEnemyModifier extends EnemyModifierStrategy {
  readonly id = "automatic-slow" as const;

  decorate(draft: EnemyModifierDraft): EnemyModifierDraft {
    return { ...draft };
  }
}
