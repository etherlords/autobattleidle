import * as THREE from "three";

import { enemyBodyFactories } from "../../enemy-visual/bodies";
import { EnemyViewBuilder } from "../../enemy-visual/builder";
import {
  decorateAffinityCue,
  decorateBossGeometry,
  decorateGrade,
  decorateModifier,
  decorateSeededDecoration,
} from "../../enemy-visual/decorators";
import {
  enemyVisualSpec,
  profileCueScale,
  type EnemyVisualInput,
  type EnemyVisualProfile,
} from "../../enemy-visual/spec";
import type { EnemyVisualComponent } from "../../enemy-visual/components";
import type { UnitController } from "../core";
import type { EnemyUnitModel } from "./model";
import { EnemyUnit } from "./unit";
import type { EnemyUnitView, EnemyViewComposition } from "./view";

const fitCue = (cue: EnemyVisualComponent, profile: EnemyVisualProfile): EnemyVisualComponent => {
  const scale = profileCueScale(profile);
  cue.nodes.forEach((node) =>
    node.traverse((child) => {
      if (child instanceof THREE.Mesh) child.scale.multiplyScalar(scale);
    }),
  );
  return cue;
};

export type EnemyVisualCompositionMode = "production" | "legacy/no-overlay";

export class EnemyUnitBuilder {
  private model: EnemyUnitModel | undefined;
  private view: EnemyUnitView | undefined;
  private controller: UnitController<EnemyVisualInput> | undefined;
  private sealed = false;

  static composeView(
    snapshot: EnemyVisualInput,
    mode: EnemyVisualCompositionMode = "production",
  ): EnemyViewComposition {
    const spec = enemyVisualSpec(snapshot);
    const reducedMotion =
      snapshot.reducedMotion ??
      (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
    const builder = new EnemyViewBuilder();
    builder.add(enemyBodyFactories[spec.body](spec.profile, reducedMotion));
    builder.add(fitCue(decorateGrade(spec.gradeCue), spec.profile));
    builder.add(fitCue(decorateModifier(spec.modifierCue, spec.profile), spec.profile));
    builder.add(decorateAffinityCue(spec.affinity.cue, spec.affinity.palette, reducedMotion));
    if (mode === "production" && spec.body.startsWith("boss-"))
      decorateBossGeometry(spec.body as "boss-colossus" | "boss-hydra", reducedMotion).forEach(
        (geometry) => builder.add(geometry),
      );
    spec.decorations.forEach((decoration, index) =>
      builder.add(fitCue(decorateSeededDecoration(decoration, index, spec.profile), spec.profile)),
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
