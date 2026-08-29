import { enemyBodyFactories } from "../../enemy-visual/bodies";
import { EnemyViewBuilder } from "../../enemy-visual/builder";
import {
  GradeCueDecorator,
  ModifierCueDecorator,
  SeededDecorationDecorator,
} from "../../enemy-visual/decorators";
import { enemyVisualSpec, type EnemyVisualInput } from "../../enemy-visual/spec";
import type { UnitController } from "../core";
import type { EnemyUnitModel } from "./model";
import { EnemyUnit } from "./unit";
import type { EnemyUnitView, EnemyViewComposition } from "./view";

export class EnemyUnitBuilder {
  private model: EnemyUnitModel | undefined;
  private view: EnemyUnitView | undefined;
  private controller: UnitController<EnemyVisualInput> | undefined;
  private sealed = false;

  static composeView(snapshot: EnemyVisualInput): EnemyViewComposition {
    const spec = enemyVisualSpec(snapshot);
    const builder = new EnemyViewBuilder();
    builder.add(enemyBodyFactories[spec.body](spec.profile));
    new GradeCueDecorator(spec.gradeCue).attach(builder);
    new ModifierCueDecorator(spec.modifierCue, spec.profile).attach(builder);
    spec.decorations.forEach((decoration, index) =>
      new SeededDecorationDecorator(decoration, index, spec.profile).attach(builder),
    );
    return { build: builder.build(), spec };
  }

  withModel(model: EnemyUnitModel): this {
    this.assertOpen();
    this.model = model;
    return this;
  }

  withView(view: EnemyUnitView): this {
    this.assertOpen();
    this.view = view;
    return this;
  }

  withController(controller: UnitController<EnemyVisualInput>): this {
    this.assertOpen();
    this.controller = controller;
    return this;
  }

  build(): EnemyUnit {
    this.assertOpen();
    if (this.model === undefined) throw new Error("Enemy unit requires a model");
    if (this.view === undefined) throw new Error("Enemy unit requires a view");
    if (this.controller === undefined) throw new Error("Enemy unit requires a controller");
    if (!this.controller.composes(this.model, this.view))
      throw new Error("Enemy unit controller must compose the configured model and view");
    this.sealed = true;
    return new EnemyUnit(this.model, this.view, this.controller);
  }

  private assertOpen(): void {
    if (this.sealed) throw new Error("Enemy unit builder is sealed");
  }
}
