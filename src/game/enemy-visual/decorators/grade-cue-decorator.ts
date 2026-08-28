import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import {
  enemyVisualGeometry,
  enemyVisualLayout,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "../config";
import type { GradeCue } from "../spec";

type GradeComponentFactory = () => EnemyVisualComponent;

const emptyGrade = (): EnemyVisualComponent => component("grade-none", "grade", []);

const gradeComponentFactories: Readonly<Record<GradeCue, GradeComponentFactory>> = {
  none: emptyGrade,
  crest: () => {
    const crest = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.grade.crest),
      enemyVisualPalette.grade.crest,
    );
    crest.position.y = enemyVisualLayout.grade.crestY;
    return component("grade-crest", "grade", [crest]);
  },
  spikes: () =>
    component(
      "grade-spikes",
      "grade",
      enemyVisualLayout.grade.spikeOffsets.map((offset) => {
        const spike = mesh(
          new THREE.ConeGeometry(...enemyVisualGeometry.grade.spike),
          enemyVisualPalette.grade.spikes,
        );
        spike.position.set(offset, enemyVisualLayout.grade.spikeY, 0);
        return spike;
      }),
    ),
  crown: () => {
    const crown = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.grade.crown),
      enemyVisualPalette.grade.crown,
      enemyVisualPalette.grade.crownEmissive,
    );
    crown.name = "boss-crown";
    crown.position.y = enemyVisualLayout.grade.crownY;
    crown.rotation.y = enemyVisualTransforms.crownYRadians;
    return component("grade-crown", "grade", [crown]);
  },
};

export const decorateGrade = (cue: GradeCue): EnemyVisualComponent =>
  gradeComponentFactories[cue]();

export class GradeCueDecorator {
  constructor(private readonly cue: GradeCue) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateGrade(this.cue));
  }
}
