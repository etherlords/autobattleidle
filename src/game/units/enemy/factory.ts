import type { EnemyVisualInput } from "../../enemy-visual/spec";
import { UnitController } from "../core";
import { EnemyUnitBuilder, type EnemyVisualCompositionMode } from "./builder";
import { EnemyUnitModel } from "./model";
import { EnemyUnitView } from "./view";
import type { EnemyUnit } from "./unit";

export type EnemyUnitFactoryOptions = {
  readonly compositionMode?: EnemyVisualCompositionMode;
};

export class EnemyUnitFactory {
  create(snapshot: EnemyVisualInput, options: EnemyUnitFactoryOptions = {}): EnemyUnit {
    const model = new EnemyUnitModel(snapshot);
    const mode = options.compositionMode ?? "production";
    const view = new EnemyUnitView((input) => EnemyUnitBuilder.composeView(input, mode));
    const controller = new UnitController(model, view);
    return new EnemyUnitBuilder()
      .withModel(model)
      .withView(view)
      .withController(controller)
      .build();
  }
}
