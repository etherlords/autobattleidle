import { UnitModel } from "../core";
import type { EnemyVisualInput } from "../../enemy-visual/spec";

export class EnemyUnitModel extends UnitModel<EnemyVisualInput> {
  protected sameIdentity(previous: EnemyVisualInput, next: EnemyVisualInput): boolean {
    return (
      previous.grade === next.grade &&
      previous.level === next.level &&
      previous.modifier === next.modifier &&
      previous.goldenBug === next.goldenBug
    );
  }
}
