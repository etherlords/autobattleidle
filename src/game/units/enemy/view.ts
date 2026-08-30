import * as THREE from "three";

import { UnitView } from "../core";
import type { EnemyViewBuild } from "../../enemy-visual/builder";
import { enemyVisualLayout } from "../../enemy-visual/config";
import {
  enemyVisualSpec,
  type EnemyVisualInput,
  type EnemyVisualSpec,
} from "../../enemy-visual/spec";
import type { EnemyVisualCommand } from "../../enemy-visual/components";

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
  }

  override animate(name: string): boolean {
    if (isEnemyVisualCommand(name)) return this.build?.command(name) ?? false;
    return super.animate(name);
  }

  get spec(): EnemyVisualSpec {
    if (this.currentSpec === undefined) throw new Error("Enemy view has not been synchronized");
    return this.currentSpec;
  }

  combatSocketWorldPosition(): THREE.Vector3 | undefined {
    const socket = this.build?.anchor("combat");
    if (socket === undefined) return undefined;
    this.group.updateMatrixWorld(true);
    return socket.getWorldPosition(new THREE.Vector3());
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
    this.group.position.set(enemyVisualLayout.actorAnchor.x, 0, enemyVisualLayout.actorAnchor.z);
    this.group.updateMatrixWorld(true);
    const bodyBounds = new THREE.Box3().setFromObject(this.build.roots.body);
    this.group.position.y += enemyVisualLayout.actorAnchor.groundClearance - bodyBounds.min.y;
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

const isEnemyVisualCommand = (name: string): name is EnemyVisualCommand =>
  name === "spawn" || name === "hit" || name === "critical" || name === "death";
