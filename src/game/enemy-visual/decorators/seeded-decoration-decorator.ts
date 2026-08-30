import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import {
  enemyVisualAnimation,
  enemyVisualGeometry,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "../config";
import type { Decoration, EnemyVisualProfile } from "../spec";

type DecorationComponentFactory = (
  index: number,
  profile: EnemyVisualProfile,
) => EnemyVisualComponent;
const defaultProfile: EnemyVisualProfile = {
  attachment: [0.5, 0.2, 0],
  decorations: ["fins", "horns"],
  palette: { accent: "#8ddcff", core: "#8ddcff", emissive: "#000000" },
  variant: 0,
};

const decorationComponentFactories: Readonly<Record<Decoration, DecorationComponentFactory>> = {
  fins: (index, _profile) => {
    const offset = index === 0 ? -1 : 1;
    const fin = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.decoration.fin),
      enemyVisualPalette.decoration.fins,
    );
    fin.name = `decoration-fins-${index}`;
    fin.position.set(0, 0.12, 0);
    fin.rotation.z = -offset * enemyVisualTransforms.finZRadians;
    fin.scale.z = 0.35;
    return component(
      `decoration-fins-${index}`,
      "decoration",
      [fin],
      undefined,
      undefined,
      offset < 0 ? "left" : "right",
    );
  },
  horns: (index, _profile) => {
    const offset = index === 0 ? -1 : 1;
    const horn = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.decoration.horn),
      enemyVisualPalette.decoration.horns,
    );
    horn.name = `decoration-horns-${index}`;
    horn.position.set(offset * 0.2, 0.45, 0.24);
    horn.rotation.set(0.18, 0, -offset * 0.22);
    horn.scale.y = 0.56;
    let phase = 0;
    return component(
      `decoration-horns-${index}`,
      "decoration",
      [horn],
      {
        [`decoration-horns-${index}`]: () => {
          phase += 0.06;
          horn.rotation.y = Math.sin(phase) * 0.08;
        },
      },
      undefined,
      "head",
    );
  },
  orbitals: (index, _profile) => {
    const offset = index === 0 ? -1 : 1;
    const orbital = mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      enemyVisualPalette.decoration.orbitals,
    );
    orbital.name = `decoration-orbitals-${index}`;
    orbital.position.set(offset * 1.55, 0, 0.18);
    let phase = index * Math.PI;
    return component(
      `decoration-orbitals-${index}`,
      "decoration",
      [orbital],
      {
        [`decoration-orbital-${index}`]: () => {
          phase += enemyVisualAnimation.decorationOrbitRadians;
          const radius = (Number(orbital.parent?.userData.bodyRadius) || 0.72) + 0.2;
          orbital.position.x = Math.cos(phase) * radius;
          orbital.position.z = Math.sin(phase) * radius;
          orbital.position.y = Math.sin(phase * 2) * 0.08;
        },
      },
      undefined,
      "orbit",
    );
  },
  satellites: (index, _profile) => {
    const offset = index === 0 ? -1 : 1;
    const satellite = mesh(
      new THREE.SphereGeometry(...enemyVisualGeometry.decoration.satellite),
      enemyVisualPalette.decoration.satellites,
    );
    satellite.name = `decoration-satellites-${index}`;
    satellite.position.set(offset * 1.55, 0.2, 0);
    let phase = index * Math.PI;
    return component(
      `decoration-satellites-${index}`,
      "decoration",
      [satellite],
      {
        [`decoration-satellite-${index}`]: () => {
          phase += enemyVisualAnimation.decorationOrbitRadians;
          const radius = (Number(satellite.parent?.userData.bodyRadius) || 0.72) + 0.24;
          satellite.position.x = Math.cos(phase) * radius;
          satellite.position.z = Math.sin(phase) * radius;
          satellite.position.y = 0.2 + Math.sin(phase * 2) * 0.08;
        },
      },
      undefined,
      "orbit",
    );
  },
  scar: (index, _profile) => {
    const offset = index === 0 ? -1 : 1;
    const scars = [-1, 0, 1].map((slash) => {
      const scar = mesh(
        new THREE.BoxGeometry(...enemyVisualGeometry.decoration.scar),
        enemyVisualPalette.decoration.scar,
      );
      scar.name = `decoration-scar-${index}-${slash + 1}`;
      scar.position.set(offset * 0.1 + slash * 0.07, slash * 0.025, 0.04);
      scar.rotation.z = offset * enemyVisualTransforms.scarZRadians;
      return scar;
    });
    return component(
      `decoration-scar-${index}`,
      "decoration",
      scars,
      undefined,
      undefined,
      "front",
    );
  },
};

export const decorateSeededDecoration = (
  decoration: Decoration,
  index: number,
  profile = defaultProfile,
): EnemyVisualComponent => decorationComponentFactories[decoration](index, profile);

export class SeededDecorationDecorator {
  constructor(
    private readonly decoration: Decoration,
    private readonly index: number,
    private readonly profile = defaultProfile,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateSeededDecoration(this.decoration, this.index, this.profile));
  }
}
