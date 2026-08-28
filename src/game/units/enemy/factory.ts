import type { EnemyVisualInput } from "../../enemy-visual/spec";
import { UnitController } from "../core";
import { EnemyUnitBuilder } from "./builder";
import { EnemyUnitModel } from "./model";
import { EnemyUnitView } from "./view";
import type { EnemyUnit } from "./unit";

export class EnemyUnitFactory {
  create(snapshot: EnemyVisualInput): EnemyUnit {
    const model = new EnemyUnitModel(snapshot);
    const view = new EnemyUnitView(EnemyUnitBuilder.composeView);
    const controller = new UnitController(model, view);
    return new EnemyUnitBuilder()
      .withModel(model)
      .withView(view)
      .withController(controller)
      .build();
  }
}
