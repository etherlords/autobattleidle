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
  "shield-plates": (profile) => {
    const shields = [-1, 0, 1].map((side) => {
      const shield = new THREE.Group();
      shield.name = `armor-shield-${side + 1}`;
      const face = mesh(new THREE.CircleGeometry(0.3, 8), enemyVisualPalette.modifier.armor);
      face.name = `armor-shield-face-${side + 1}`;
      const rim = mesh(new THREE.TorusGeometry(0.3, 0.045, 5, 8), profile.palette.accent);
      rim.name = `armor-shield-rim-${side + 1}`;
      shield.add(face, rim);
      return shield;
    });
    let phase = 0;
    const arrange = (): void => {
      shields.forEach((shield, index) => {
        const angle = phase + index * ((Math.PI * 2) / shields.length);
        shield.position.set(
          Math.cos(angle) * (profile.attachment[0] + 0.16),
          profile.attachment[1] + Math.sin(angle * 2) * enemyVisualAnimation.shieldLift,
          profile.attachment[2] + 0.55 + Math.sin(angle) * 0.18,
        );
        shield.rotation.y = -angle;
      });
    };
    arrange();
    return component("modifier-shield-plates", "modifier", shields, {
      "shield-plate-orbit": () => {
        phase += enemyVisualAnimation.shieldOrbitRadians;
        arrange();
      },
    });
  },
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
    let phase = 0;
    return component("modifier-time-ring", "modifier", [ring], {
      "time-ring": () => {
        phase += enemyVisualAnimation.timeRingTickRadians;
        ring.rotation.z += enemyVisualAnimation.timeRingTickRadians;
        ring.position.y = Math.sin(phase * 2) * enemyVisualAnimation.shieldLift;
      },
    });
  },
  "wealth-orbitals": () => {
    const coins = enemyVisualLayout.modifier.wealthOffsets.map((offset) => {
      const coin = mesh(
        new THREE.CylinderGeometry(...enemyVisualGeometry.modifier.coin),
        enemyVisualPalette.modifier.wealth,
        enemyVisualPalette.modifier.wealthEmissive,
      );
      coin.rotation.x = enemyVisualTransforms.flatRingXRadians;
      coin.position.set(offset, enemyVisualLayout.modifier.wealthY, 0);
      return coin;
    });
    let phase = 0;
    return component("modifier-wealth-orbitals", "modifier", coins, {
      "wealth-orbit": () => {
        phase += enemyVisualAnimation.decorationOrbitRadians;
        coins.forEach((coin, index) => {
          coin.position.x = Math.cos(phase + index * Math.PI) * 0.65;
          coin.position.y = enemyVisualLayout.modifier.wealthY + Math.sin(phase * 2 + index) * 0.08;
        });
      },
    });
  },
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
