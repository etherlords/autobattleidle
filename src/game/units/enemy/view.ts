import * as THREE from "three";

import { UnitView } from "../core";
import type { EnemyViewBuild } from "../../enemy-visual/builder";
import { enemyVisualLayout } from "../../enemy-visual/config";
import {
  enemyVisualSpec,
  type EnemyVisualInput,
  type EnemyVisualSpec,
} from "../../enemy-visual/spec";

export type EnemyViewComposition = {
  readonly build: EnemyViewBuild;
  readonly spec: EnemyVisualSpec;
};

export type EnemyViewComposer = (snapshot: EnemyVisualInput) => EnemyViewComposition;

const disposeObject = (object: THREE.Object3D): void =>
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const surface = child.material;
      if (Array.isArray(surface)) surface.forEach((entry) => entry.dispose());
      else surface.dispose();
    }
  });

export class EnemyUnitView extends UnitView<EnemyVisualInput> {
  private build: EnemyViewBuild | undefined;
  private currentSeed: number | undefined;
  private currentSpec: EnemyVisualSpec | undefined;

  constructor(private readonly compose: EnemyViewComposer) {
    super();
    this.registerAnimation("enemy-view", () => this.build?.tick());
    for (const command of ["spawn", "hit", "critical", "death"] as const) {
      this.registerAnimation(command, () => this.build?.command(command));
    }
  }

  get spec(): EnemyVisualSpec {
    if (this.currentSpec === undefined) throw new Error("Enemy view has not been synchronized");
    return this.currentSpec;
  }

  override dispose(): void {
    this.clearBuild();
    super.dispose();
  }

  protected applySnapshot(snapshot: EnemyVisualInput): void {
    const spec = enemyVisualSpec(snapshot);
    if (this.currentSeed === spec.seed) return;
    this.clearBuild();
    const { build } = this.compose(snapshot);
    this.build = build;
    this.group.add(this.build.group);
    this.group.scale.setScalar(spec.scale);
    this.group.position.set(
      enemyVisualLayout.actorAnchor.x,
      enemyVisualLayout.actorAnchor.y,
      enemyVisualLayout.actorAnchor.z,
    );
    this.currentSeed = spec.seed;
    this.currentSpec = spec;
  }

  private clearBuild(): void {
    if (this.build === undefined) return;
    this.build.dispose();
    disposeObject(this.build.group);
    this.build.group.removeFromParent();
    this.build = undefined;
  }
}
