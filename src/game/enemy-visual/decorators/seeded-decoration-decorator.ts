import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import { enemyVisualGeometry, enemyVisualPalette, enemyVisualTransforms } from "../config";
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
  fins: (index, profile) => {
    const offset = index === 0 ? -1 : 1;
    const fin = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.decoration.fin),
      enemyVisualPalette.decoration.fins,
    );
    fin.position.set(offset * profile.attachment[0], profile.attachment[1], profile.attachment[2]);
    fin.rotation.z = offset * enemyVisualTransforms.finZRadians;
    return component(`decoration-fins-${index}`, "decoration", [fin]);
  },
  horns: (index, profile) => {
    const offset = index === 0 ? -1 : 1;
    const horn = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.decoration.horn),
      enemyVisualPalette.decoration.horns,
    );
    horn.position.set(
      offset * profile.attachment[0],
      profile.attachment[1] + 0.3,
      profile.attachment[2],
    );
    return component(`decoration-horns-${index}`, "decoration", [horn]);
  },
  orbitals: (index, profile) => {
    const offset = index === 0 ? -1 : 1;
    const orbital = mesh(
      new THREE.TorusGeometry(...enemyVisualGeometry.decoration.orbital),
      enemyVisualPalette.decoration.orbitals,
    );
    orbital.position.set(
      offset * profile.attachment[0] * 0.55,
      profile.attachment[1],
      profile.attachment[2],
    );
    orbital.rotation.x = enemyVisualTransforms.flatRingXRadians;
    return component(`decoration-orbitals-${index}`, "decoration", [orbital]);
  },
  satellites: (index, profile) => {
    const offset = index === 0 ? -1 : 1;
    const satellite = mesh(
      new THREE.SphereGeometry(...enemyVisualGeometry.decoration.satellite),
      enemyVisualPalette.decoration.satellites,
    );
    satellite.position.set(
      offset * profile.attachment[0] * 1.1,
      profile.attachment[1] + 0.15,
      profile.attachment[2],
    );
    return component(`decoration-satellites-${index}`, "decoration", [satellite]);
  },
  scar: (index, profile) => {
    const offset = index === 0 ? -1 : 1;
    const scar = mesh(
      new THREE.BoxGeometry(...enemyVisualGeometry.decoration.scar),
      enemyVisualPalette.decoration.scar,
    );
    scar.position.set(
      offset * profile.attachment[0] * 0.35,
      profile.attachment[1],
      profile.attachment[2],
    );
    scar.rotation.z = offset * enemyVisualTransforms.scarZRadians;
    return component(`decoration-scar-${index}`, "decoration", [scar]);
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
