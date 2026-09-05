import type * as THREE from "three";

import type { EnemyVisualInput, EnemyVisualSpec } from "./enemy-visual/spec";
import type { EnemyUnit } from "./units/enemy";
import { UNIT_FACTORIES } from "./units/factories";

export { enemyVisualSpec, stableEnemySeed } from "./enemy-visual/spec";
export {
  enemyVisualCompositionReceipt,
  type EnemyVisualCompositionMode,
  type EnemyVisualCompositionReceipt,
} from "./enemy-visual/receipt";
export type {
  BodyFamily,
  EnemyVisualInput,
  EnemyVisualSpec,
  ModifierCue,
} from "./enemy-visual/spec";
export { EnemyViewBuilder } from "./enemy-visual/builder";
export { enemyBodyFactories } from "./enemy-visual/bodies";

export type EnemyVisual = {
  readonly group: THREE.Group;
  readonly spec: EnemyVisualSpec;
  tick(): void;
  dispose(): void;
};

class EnemyVisualFacade implements EnemyVisual {
  private readonly unit: EnemyUnit;

  constructor(enemy: EnemyVisualInput) {
    this.unit = UNIT_FACTORIES.enemy.create(enemy);
  }

  get group(): THREE.Group {
    return this.unit.view.group;
  }

  get spec(): EnemyVisualSpec {
    return this.unit.spec;
  }

  tick(): void {
    this.unit.tick();
  }

  dispose(): void {
    this.unit.dispose();
  }
}

export const createEnemyVisual = (enemy: EnemyVisualInput): EnemyVisual =>
  new EnemyVisualFacade(enemy);
