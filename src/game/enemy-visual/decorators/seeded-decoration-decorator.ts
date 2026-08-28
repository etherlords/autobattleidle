import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import {
  enemyVisualGeometry,
  enemyVisualLayout,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "../config";
import type { Decoration } from "../spec";

type DecorationComponentFactory = (index: number) => EnemyVisualComponent;

const decorationComponentFactories: Readonly<Record<Decoration, DecorationComponentFactory>> = {
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
    return component(`decoration-fins-${index}`, "decoration", [fin]);
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
    return component(`decoration-horns-${index}`, "decoration", [horn]);
  },
  orbitals: (index) => {
    const offset = index === 0 ? -1 : 1;
    const orbital = mesh(
      new THREE.TorusGeometry(...enemyVisualGeometry.decoration.orbital),
      enemyVisualPalette.decoration.orbitals,
    );
    orbital.position.x = offset * enemyVisualLayout.decoration.orbitalsX;
    orbital.rotation.x = enemyVisualTransforms.flatRingXRadians;
    return component(`decoration-orbitals-${index}`, "decoration", [orbital]);
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
    return component(`decoration-satellites-${index}`, "decoration", [satellite]);
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
    return component(`decoration-scar-${index}`, "decoration", [scar]);
  },
};

export const decorateSeededDecoration = (
  decoration: Decoration,
  index: number,
): EnemyVisualComponent => decorationComponentFactories[decoration](index);

export class SeededDecorationDecorator {
  constructor(
    private readonly decoration: Decoration,
    private readonly index: number,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateSeededDecoration(this.decoration, this.index));
  }
}
