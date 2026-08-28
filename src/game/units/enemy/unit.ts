import { Unit } from "../core";
import type { UnitController } from "../core";
import type { EnemyVisualInput, EnemyVisualSpec } from "../../enemy-visual/spec";
import type { EnemyUnitCommand, EnemyUnitEvent, EnemyUnitListener } from "./commands";
import type { EnemyUnitModel } from "./model";
import type { EnemyUnitView } from "./view";

export class EnemyUnit extends Unit<EnemyVisualInput> {
  readonly enemyView: EnemyUnitView;
  private readonly enemyListeners = new Set<EnemyUnitListener>();

  constructor(
    model: EnemyUnitModel,
    view: EnemyUnitView,
    controller: UnitController<EnemyVisualInput>,
  ) {
    super(model, view, controller);
    this.enemyView = view;
  }

  get spec(): EnemyVisualSpec {
    return this.enemyView.spec;
  }

  dispatchEnemy(command: EnemyUnitCommand): void {
    if (command.type === "spawn") {
      const attached = this.dispatch({ type: "attach", parent: command.parent });
      const animated = this.dispatch({ type: "animate", name: "spawn" });
      if (attached && animated) this.publishEnemy({ type: "spawned" });
      return;
    }
    if (command.type === "sync") {
      if (this.dispatch({ type: "sync", snapshot: command.snapshot }))
        this.publishEnemy({ type: "synchronized", snapshot: command.snapshot });
      return;
    }
    if (command.type === "dispose") {
      if (this.dispose()) {
        this.publishEnemy({ type: "disposed" });
        this.enemyListeners.clear();
      }
      return;
    }
    if (this.dispatch({ type: "animate", name: command.type }))
      this.publishEnemy({ type: command.type });
  }

  subscribeEnemy(listener: EnemyUnitListener): () => void {
    this.enemyListeners.add(listener);
    return () => this.enemyListeners.delete(listener);
  }

  private publishEnemy(event: EnemyUnitEvent): void {
    for (const listener of this.enemyListeners) listener(event);
  }
}
