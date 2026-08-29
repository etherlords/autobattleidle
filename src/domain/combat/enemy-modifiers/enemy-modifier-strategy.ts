import type { AttackSource, EliteModifier } from "../contracts";

export type EnemyModifierDraft = {
  readonly armor: number;
  readonly healthMultiplier: number;
};

export abstract class EnemyModifierStrategy {
  abstract readonly id: EliteModifier;

  abstract decorate(draft: EnemyModifierDraft, encounter: number): EnemyModifierDraft;

  allowsCritical(_source: AttackSource): boolean {
    return true;
  }

  damageMultiplier(_source: AttackSource): number {
    return 1;
  }
}
