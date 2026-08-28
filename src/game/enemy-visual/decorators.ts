import * as THREE from "three";

import type { Decoration, GradeCue, ModifierCue } from "./spec";
import { component, mesh, type EnemyVisualComponent, type EnemyVisualLayer } from "./components";
import {
  enemyVisualAnimation,
  enemyVisualGeometry,
  enemyVisualLayout,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "./config";

type Decorator<Cue> = (cue: Cue) => EnemyVisualComponent;
const empty = (layer: EnemyVisualLayer): EnemyVisualComponent => component(layer, []);

const gradeDecorators: Readonly<Record<GradeCue, Decorator<GradeCue>>> = {
  none: () => empty("grade"),
  crest: () => {
    const crest = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.grade.crest),
      enemyVisualPalette.grade.crest,
    );
    crest.position.y = enemyVisualLayout.grade.crestY;
    return component("grade", [crest]);
  },
  spikes: () =>
    component(
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
    return component("grade", [crown]);
  },
};

const modifierDecorators: Readonly<
  Record<Exclude<ModifierCue, null>, Decorator<Exclude<ModifierCue, null>>>
> = {
  "shield-plates": () =>
    component(
      "modifier",
      enemyVisualLayout.modifier.armorOffsets.map((offset) => {
        const plate = mesh(
          new THREE.BoxGeometry(...enemyVisualGeometry.modifier.plate),
          enemyVisualPalette.modifier.armor,
        );
        plate.position.x = offset;
        return plate;
      }),
    ),
  "vitality-core": () => {
    const core = mesh(
      new THREE.SphereGeometry(...enemyVisualGeometry.modifier.core),
      enemyVisualPalette.modifier.health,
      enemyVisualPalette.modifier.healthEmissive,
    );
    core.name = "vitality-core";
    return component("modifier", [core]);
  },
  "time-ring": () => {
    const ring = mesh(
      new THREE.TorusGeometry(...enemyVisualGeometry.modifier.ring),
      enemyVisualPalette.modifier.slow,
      enemyVisualPalette.modifier.slowEmissive,
    );
    ring.name = "time-ring";
    ring.rotation.x = enemyVisualTransforms.flatRingXRadians;
    const hand = mesh(
      new THREE.BoxGeometry(...enemyVisualGeometry.modifier.hand),
      enemyVisualPalette.modifier.slowHand,
    );
    hand.position.y = enemyVisualLayout.modifier.timeHandY;
    ring.add(hand);
    return component("modifier", [ring], {
      "time-ring": () => (ring.rotation.z += enemyVisualAnimation.timeRingTickRadians),
    });
  },
  "wealth-orbitals": () =>
    component(
      "modifier",
      enemyVisualLayout.modifier.wealthOffsets.map((offset) => {
        const coin = mesh(
          new THREE.CylinderGeometry(...enemyVisualGeometry.modifier.coin),
          enemyVisualPalette.modifier.wealth,
          enemyVisualPalette.modifier.wealthEmissive,
        );
        coin.rotation.x = enemyVisualTransforms.flatRingXRadians;
        coin.position.set(offset, enemyVisualLayout.modifier.wealthY, 0);
        return coin;
      }),
    ),
};

const decorationDecorators: Readonly<Record<Decoration, (index: number) => EnemyVisualComponent>> =
  {
    fins: (index) => {
      const offset = index === 0 ? -1 : 1;
      const fin = mesh(
        new THREE.ConeGeometry(...enemyVisualGeometry.decoration.fin),
        enemyVisualPalette.decoration.fins,
      );
      fin.position.set(
        offset * enemyVisualLayout.decoration.finsX,
        enemyVisualLayout.decoration.finsY,
        0,
      );
      fin.rotation.z = offset * enemyVisualTransforms.finZRadians;
      return component("decoration", [fin]);
    },
    horns: (index) => {
      const offset = index === 0 ? -1 : 1;
      const horn = mesh(
        new THREE.ConeGeometry(...enemyVisualGeometry.decoration.horn),
        enemyVisualPalette.decoration.horns,
      );
      horn.position.set(
        offset * enemyVisualLayout.decoration.hornsX,
        enemyVisualLayout.decoration.hornsY,
        0,
      );
      return component("decoration", [horn]);
    },
    orbitals: (index) => {
      const offset = index === 0 ? -1 : 1;
      const orbital = mesh(
        new THREE.TorusGeometry(...enemyVisualGeometry.decoration.orbital),
        enemyVisualPalette.decoration.orbitals,
      );
      orbital.position.x = offset * enemyVisualLayout.decoration.orbitalsX;
      orbital.rotation.x = enemyVisualTransforms.flatRingXRadians;
      return component("decoration", [orbital]);
    },
    satellites: (index) => {
      const offset = index === 0 ? -1 : 1;
      const satellite = mesh(
        new THREE.SphereGeometry(...enemyVisualGeometry.decoration.satellite),
        enemyVisualPalette.decoration.satellites,
      );
      satellite.position.set(
        offset * enemyVisualLayout.decoration.satellitesX,
        enemyVisualLayout.decoration.satellitesY,
        0,
      );
      return component("decoration", [satellite]);
    },
    scar: (index) => {
      const offset = index === 0 ? -1 : 1;
      const scar = mesh(
        new THREE.BoxGeometry(...enemyVisualGeometry.decoration.scar),
        enemyVisualPalette.decoration.scar,
      );
      scar.position.set(
        offset * enemyVisualLayout.decoration.scarX,
        enemyVisualLayout.decoration.scarY,
        enemyVisualLayout.decoration.scarZ,
      );
      scar.rotation.z = offset * enemyVisualTransforms.scarZRadians;
      return component("decoration", [scar]);
    },
  };

export const decorateGrade = (cue: GradeCue): EnemyVisualComponent => gradeDecorators[cue](cue);
export const decorateModifier = (cue: ModifierCue): EnemyVisualComponent =>
  cue === null ? empty("modifier") : modifierDecorators[cue](cue);
export const decorateSeededDecoration = (
  decoration: Decoration,
  index: number,
): EnemyVisualComponent => decorationDecorators[decoration](index);
