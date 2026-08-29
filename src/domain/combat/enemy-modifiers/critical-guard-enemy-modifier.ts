import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class CriticalGuardEnemyModifier extends EnemyModifierStrategy {
  readonly id = "critical-guard" as const;

  decorate(draft: EnemyModifierDraft): EnemyModifierDraft {
    return draft;
  }

  override allowsCritical(): boolean {
    return false;
  }
}
