import type { AttackSource } from "../contracts";
import { type EnemyModifierDraft, EnemyModifierStrategy } from "./enemy-modifier-strategy";

export class ManualGuardEnemyModifier extends EnemyModifierStrategy {
  readonly id = "manual-guard" as const;

  decorate(draft: EnemyModifierDraft): EnemyModifierDraft {
    return draft;
  }

  override damageMultiplier(source: AttackSource): number {
    return source === "manual" ? 0.5 : 1;
  }
}
