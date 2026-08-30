import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import { enemyVisualGeometry, enemyVisualLayout, enemyVisualPalette } from "../config";
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
    crest.name = "grade-crest";
    crest.position.y = enemyVisualLayout.grade.crestY;
    return component("grade-crest", "grade", [crest], undefined, undefined, "top");
  },
  spikes: () => {
    const spikes = enemyVisualLayout.grade.spikeOffsets.map((offset) => {
      const spike = mesh(
        new THREE.ConeGeometry(...enemyVisualGeometry.grade.spike),
        enemyVisualPalette.grade.spikes,
      );
      spike.name = `grade-spike-${offset}`;
      spike.position.set(offset * 0.48, enemyVisualLayout.grade.spikeY, -0.05);
      return spike;
    });
    return {
      ...component("grade-spikes", "grade", spikes, undefined, undefined, "top"),
      onAttach: () => {
        if (spikes[0]?.parent?.parent?.name !== "enemy-part-drake-head") return;
        spikes.forEach((spike, index) => {
          const side = index === 0 ? -1 : 1;
          spike.geometry.scale(0.48, 0.48, 0.48);
          spike.geometry.computeBoundingSphere();
          spike.position.set(-0.12, 0.16, side * 0.18);
          spike.rotation.set(0, side * 0.16, -Math.PI * 0.5);
        });
      },
    };
  },
  crown: () => {
    const crown = new THREE.Group();
    crown.name = "boss-crown";
    [-0.18, 0, 0.18].forEach((x, index) => {
      const prong = mesh(
        new THREE.BoxGeometry(0.08, index === 1 ? 0.32 : 0.24, 0.1),
        enemyVisualPalette.grade.crown,
        enemyVisualPalette.grade.crownEmissive,
      );
      prong.name = `boss-crown-prong-${index}`;
      prong.position.set(x, 0.18 + (index === 1 ? 0.04 : 0), 0);
      crown.add(prong);
    });
    const band = mesh(new THREE.BoxGeometry(0.5, 0.1, 0.14), enemyVisualPalette.grade.crown);
    band.name = "boss-crown-band";
    crown.add(band);
    crown.position.y = 0;
    return component("grade-crown", "grade", [crown], undefined, undefined, "top");
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
