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
import type { ModifierCue } from "../spec";

type ModifierComponentFactory = () => EnemyVisualComponent;
type VisibleModifierCue = Exclude<ModifierCue, null>;

const emptyModifier = (): EnemyVisualComponent => component("modifier-none", "modifier", []);

const modifierComponentFactories: Readonly<Record<VisibleModifierCue, ModifierComponentFactory>> = {
  "shield-plates": () =>
    component(
      "modifier-shield-plates",
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
};

export const decorateModifier = (cue: ModifierCue): EnemyVisualComponent =>
  cue === null ? emptyModifier() : modifierComponentFactories[cue]();

export class ModifierCueDecorator {
  constructor(private readonly cue: ModifierCue) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateModifier(this.cue));
  }
}
