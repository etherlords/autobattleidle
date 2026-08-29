import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import {
  enemyVisualAnimation,
  enemyVisualGeometry,
  enemyVisualLayout,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "../config";
import type { EnemyVisualProfile, ModifierCue } from "../spec";

type ModifierComponentFactory = (profile: EnemyVisualProfile) => EnemyVisualComponent;
type VisibleModifierCue = Exclude<ModifierCue, null>;

const emptyModifier = (): EnemyVisualComponent => component("modifier-none", "modifier", []);

const defaultProfile: EnemyVisualProfile = {
  attachment: [0.7, 0.2, 0],
  decorations: ["fins", "horns"],
  palette: { accent: "#d6e5f0", core: "#d6e5f0", emissive: "#000000" },
  variant: 0,
};
const modifierComponentFactories: Readonly<Record<VisibleModifierCue, ModifierComponentFactory>> = {
  "shield-plates": (profile) =>
    component(
      "modifier-shield-plates",
      "modifier",
      [-1, 1].map((side) => {
        const plate = mesh(
          new THREE.BoxGeometry(...enemyVisualGeometry.modifier.plate),
          enemyVisualPalette.modifier.armor,
        );
        plate.position.set(
          side * profile.attachment[0],
          profile.attachment[1],
          profile.attachment[2] + 0.55,
        );
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
    return component("modifier-vitality-core", "modifier", [core]);
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
    return component("modifier-time-ring", "modifier", [ring], {
      "time-ring": () => (ring.rotation.z += enemyVisualAnimation.timeRingTickRadians),
    });
  },
  "wealth-orbitals": () =>
    component(
      "modifier-wealth-orbitals",
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
  "reinforced-band": (profile) => {
    const band = mesh(new THREE.TorusGeometry(0.72, 0.11, 6, 12), profile.palette.accent);
    band.name = "reinforced-band";
    band.rotation.x = enemyVisualTransforms.flatRingXRadians;
    band.position.set(...profile.attachment);
    return component("modifier-reinforced-band", "modifier", [band]);
  },
  "prism-guard": (profile) => {
    const prism = mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      profile.palette.accent,
      profile.palette.emissive,
    );
    prism.name = "prism-guard";
    prism.position.set(...profile.attachment);
    return component("modifier-prism-guard", "modifier", [prism]);
  },
  "directional-barrier": (profile) => {
    const barrier = mesh(new THREE.BoxGeometry(0.15, 0.82, 0.14), profile.palette.accent);
    barrier.name = "directional-barrier";
    barrier.position.set(profile.attachment[0], profile.attachment[1], profile.attachment[2]);
    return component("modifier-directional-barrier", "modifier", [barrier]);
  },
};

export const decorateModifier = (
  cue: ModifierCue,
  profile = defaultProfile,
): EnemyVisualComponent =>
  cue === null ? emptyModifier() : modifierComponentFactories[cue](profile);

export class ModifierCueDecorator {
  constructor(
    private readonly cue: ModifierCue,
    private readonly profile = defaultProfile,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateModifier(this.cue, this.profile));
  }
}
