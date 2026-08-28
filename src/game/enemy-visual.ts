import * as THREE from "three";

import { enemyBodyFactories } from "./enemy-visual/bodies";
import {
  decorateGrade,
  decorateModifier,
  decorateSeededDecoration,
} from "./enemy-visual/decorators";
import { EnemyViewBuilder, type EnemyViewBuild } from "./enemy-visual/builder";
import { enemyVisualLayout } from "./enemy-visual/config";
import { enemyVisualSpec, type EnemyVisualInput, type EnemyVisualSpec } from "./enemy-visual/spec";

export { enemyVisualSpec, stableEnemySeed } from "./enemy-visual/spec";
export type { EnemyVisualInput, EnemyVisualSpec, ModifierCue } from "./enemy-visual/spec";
export { EnemyViewBuilder } from "./enemy-visual/builder";
export { enemyBodyFactories } from "./enemy-visual/bodies";

export type EnemyVisual = {
  readonly group: THREE.Group;
  readonly spec: EnemyVisualSpec;
  tick(): void;
  dispose(): void;
};

const disposeObject = (object: THREE.Object3D): void =>
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const surface = child.material;
      if (Array.isArray(surface)) surface.forEach((entry) => entry.dispose());
      else surface.dispose();
    }
  });

class ThreeEnemyVisual implements EnemyVisual {
  readonly spec: EnemyVisualSpec;
  readonly group: THREE.Group;
  private readonly build: EnemyViewBuild;
  private disposed = false;

  constructor(enemy: EnemyVisualInput) {
    this.spec = enemyVisualSpec(enemy);
    const builder = new EnemyViewBuilder();
    builder.add(enemyBodyFactories[this.spec.body]());
    builder.add(decorateGrade(this.spec.gradeCue));
    builder.add(decorateModifier(this.spec.modifierCue));
    this.spec.decorations.forEach((decoration, index) =>
      builder.add(decorateSeededDecoration(decoration, index)),
    );
    this.build = builder.build();
    this.group = this.build.group;
    this.group.scale.setScalar(this.spec.scale);
    this.group.position.set(
      enemyVisualLayout.actorAnchor.x,
      enemyVisualLayout.actorAnchor.y,
      enemyVisualLayout.actorAnchor.z,
    );
  }

  tick(): void {
    if (!this.disposed) this.build.tick();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject(this.group);
    this.group.removeFromParent();
  }
}

export const createEnemyVisual = (enemy: EnemyVisualInput): EnemyVisual =>
  new ThreeEnemyVisual(enemy);
