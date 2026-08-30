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
  "shield-plates": (_profile) => {
    const shields = [-1, 0, 1].map((side) => {
      const shield = new THREE.Group();
      shield.name = `armor-shield-${side + 1}`;
      const face = mesh(new THREE.CircleGeometry(0.3, 8), enemyVisualPalette.modifier.armor);
      face.name = `armor-shield-face-${side + 1}`;
      const rim = mesh(
        new THREE.TorusGeometry(0.3, 0.045, 5, 8),
        enemyVisualPalette.modifier.armor,
      );
      rim.name = `armor-shield-rim-${side + 1}`;
      shield.add(face, rim);
      return shield;
    });
    let phase = 0;
    const arrange = (): void => {
      const socket = shields[0]?.parent;
      const bodyRadius = Number(socket?.userData.bodyRadius) || 1.2;
      const maxOrbitRadius = Number(socket?.userData.maxOrbitRadius) || 1.93;
      const radius = Math.min(maxOrbitRadius, bodyRadius + 0.28);
      shields.forEach((shield, index) => {
        const angle = phase + index * ((Math.PI * 2) / shields.length);
        shield.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * enemyVisualAnimation.shieldLift,
          Math.sin(angle) * radius,
        );
        const outwardX = Math.cos(angle);
        const outwardZ = Math.sin(angle);
        const readableZ = Math.sign(outwardZ || 1) * Math.max(Math.abs(outwardZ), 0.32);
        shield.rotation.y = Math.atan2(outwardX, readableZ);
      });
    };
    arrange();
    return component(
      "modifier-shield-plates",
      "modifier",
      shields,
      {
        "shield-plate-orbit": () => {
          phase += enemyVisualAnimation.shieldOrbitRadians;
          arrange();
        },
      },
      undefined,
      "orbit",
    );
  },
  "vitality-core": () => {
    const core = mesh(
      new THREE.SphereGeometry(...enemyVisualGeometry.modifier.core),
      enemyVisualPalette.modifier.health,
      enemyVisualPalette.modifier.healthEmissive,
    );
    core.name = "vitality-core";
    return component(
      "modifier-vitality-core",
      "modifier",
      [core],
      undefined,
      undefined,
      "overhead",
    );
  },
  "time-ring": () => {
    const ring = mesh(
      new THREE.TorusGeometry(...enemyVisualGeometry.modifier.ring),
      enemyVisualPalette.modifier.slow,
      enemyVisualPalette.modifier.slowEmissive,
    );
    ring.name = "time-ring";
    ring.rotation.x =
      enemyVisualTransforms.flatRingXRadians + enemyVisualTransforms.timeRingCameraTiltRadians;
    const hand = mesh(
      new THREE.BoxGeometry(...enemyVisualGeometry.modifier.hand),
      enemyVisualPalette.modifier.slowHand,
    );
    hand.position.y = enemyVisualLayout.modifier.timeHandY;
    ring.add(hand);
    let phase = 0;
    return component(
      "modifier-time-ring",
      "modifier",
      [ring],
      {
        "time-ring": () => {
          phase += enemyVisualAnimation.timeRingTickRadians;
          ring.rotation.z += enemyVisualAnimation.timeRingTickRadians;
          ring.position.y = Math.sin(phase * 2) * enemyVisualAnimation.shieldLift;
        },
      },
      undefined,
      "overhead",
    );
  },
  "wealth-orbitals": () => {
    const coins = enemyVisualLayout.modifier.wealthOffsets.map((offset, index) => {
      const coin = mesh(
        new THREE.CylinderGeometry(...enemyVisualGeometry.modifier.coin),
        enemyVisualPalette.modifier.wealth,
        enemyVisualPalette.modifier.wealthEmissive,
      );
      coin.name = `wealth-orbital-${index}`;
      coin.rotation.x = enemyVisualTransforms.flatRingXRadians;
      coin.position.set(offset * 0.9, enemyVisualLayout.modifier.wealthY, 0);
      return coin;
    });
    let phase = 0;
    return component(
      "modifier-wealth-orbitals",
      "modifier",
      coins,
      {
        "wealth-orbit": () => {
          phase += enemyVisualAnimation.decorationOrbitRadians;
          const socket = coins[0]?.parent;
          const radius = Math.min(
            Number(socket?.userData.maxOrbitRadius) || 1.93,
            (Number(socket?.userData.bodyRadius) || 0.72) + 0.34,
          );
          coins.forEach((coin, index) => {
            coin.position.x = Math.cos(phase + index * Math.PI) * radius;
            coin.position.z = Math.sin(phase + index * Math.PI) * radius;
            coin.position.y =
              enemyVisualLayout.modifier.wealthY + Math.sin(phase * 2 + index) * 0.08;
          });
        },
      },
      undefined,
      "orbit",
    );
  },
  "reinforced-band": (profile) => {
    const band = mesh(new THREE.TorusGeometry(0.72, 0.065, 6, 12), profile.palette.accent);
    band.name = "reinforced-band";
    band.rotation.x = enemyVisualTransforms.flatRingXRadians;
    const fitBand = (): void => {
      const bodyRadius = Number(band.parent?.userData.bodyRadius) || 0.72;
      band.scale.setScalar(bodyRadius / 0.78);
    };
    return {
      ...component("modifier-reinforced-band", "modifier", [band], undefined, undefined, "orbit"),
      onAttach: fitBand,
    };
  },
  "prism-guard": (profile) => {
    const shield = new THREE.Group();
    shield.name = "prism-guard";
    [-1, 1].forEach((side) => {
      const panel = mesh(
        new THREE.CylinderGeometry(0.22, 0.3, 0.07, 6),
        profile.palette.accent,
        profile.palette.emissive,
      );
      panel.name = side < 0 ? "prism-guard" : "prism-guard-right";
      panel.position.set(side * 0.36, 0, 0.06);
      panel.rotation.x = Math.PI / 2;
      shield.add(panel);
    });
    const fit = (): void => {
      const bodyRadius = Number(shield.parent?.userData.bodyRadius) || 0.72;
      shield.scale.setScalar(Math.min(1.2, Math.max(0.85, bodyRadius / 0.75)));
    };
    return {
      ...component("modifier-prism-guard", "modifier", [shield], undefined, undefined, "front"),
      onAttach: fit,
    };
  },
  "directional-barrier": (profile) => {
    const barrier = new THREE.Group();
    barrier.name = "directional-barrier";
    const panelShape = new THREE.Shape();
    panelShape.moveTo(-0.32, 0.3);
    panelShape.lineTo(0.32, 0.3);
    panelShape.lineTo(0.38, 0.12);
    panelShape.lineTo(0.22, -0.32);
    panelShape.lineTo(0, -0.48);
    panelShape.lineTo(-0.22, -0.32);
    panelShape.lineTo(-0.38, 0.12);
    panelShape.closePath();
    const panel = mesh(
      new THREE.ExtrudeGeometry(panelShape, { bevelEnabled: false, depth: 0.09 }),
      profile.palette.accent,
      profile.palette.emissive,
    );
    panel.name = "directional-barrier-panel";
    const inset = mesh(
      new THREE.ExtrudeGeometry(panelShape, { bevelEnabled: false, depth: 0.025 }),
      profile.palette.core,
      profile.palette.emissive,
    );
    inset.name = "directional-barrier-inset";
    inset.scale.setScalar(0.72);
    inset.position.z = 0.095;
    const boss = mesh(
      new THREE.OctahedronGeometry(0.08, 0),
      profile.palette.accent,
      profile.palette.emissive,
    );
    boss.name = "directional-barrier-boss";
    boss.position.set(0, -0.02, 0.14);
    barrier.add(panel, inset, boss);
    return {
      ...component(
        "modifier-directional-barrier",
        "modifier",
        [barrier],
        undefined,
        undefined,
        "front",
      ),
      onAttach: () => {
        if (barrier.parent?.name !== "enemy-socket-drake-front") {
          barrier.position.set(0, 0.02, 0.35);
          return;
        }
        // A solid, camera-readable shield remains forward of the +X-facing
        // snout while being angled enough to avoid an edge-on silhouette.
        barrier.position.set(0.28, 0.48, 0.02);
        barrier.rotation.set(0, 0.46, 0);
        barrier.scale.setScalar(0.42);
      },
    };
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
