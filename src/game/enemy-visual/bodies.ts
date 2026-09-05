import * as THREE from "three";

import type { BodyFamily, EnemyVisualProfile } from "./spec";
import { component, mesh, type EnemyVisualCommand, type EnemyVisualComponent } from "./components";
import { enemyVisualAnimation, enemyVisualGeometry, enemyVisualTransforms } from "./config";
import { gltfBossBody } from "./gltf-boss-body";

export type EnemyBodyFactory = (
  profile?: EnemyVisualProfile,
  reducedMotionOverride?: boolean,
) => EnemyVisualComponent;

const defaultProfile: EnemyVisualProfile = {
  attachment: [0.7, 0.2, 0],
  decorations: ["fins", "horns"],
  palette: { accent: "#cf563f", core: "#ff9d66", emissive: "#4d180d" },
  variant: 0,
};

const core = (
  geometry: THREE.BufferGeometry,
  profile: EnemyVisualProfile,
  family: BodyFamily,
): THREE.Mesh => {
  const node = mesh(geometry, profile.palette.core, profile.palette.emissive, profile.metallic);
  node.name = `enemy-body-${family}`;
  return node;
};

const part = (
  name: string,
  geometry: THREE.BufferGeometry,
  profile: EnemyVisualProfile,
): THREE.Mesh => {
  const node = mesh(geometry, profile.palette.accent, profile.palette.emissive, profile.metallic);
  node.name = name;
  return node;
};

type Motion = "standard" | "wisp";
type SemanticSocketLayout = Readonly<{
  topY: number;
  frontZ: number;
  halfWidth: number;
  flankZ: number;
  orbitY: number;
  orbitRadius: number;
  combatY: number;
  combatZ: number;
}>;
const socketLayouts: Readonly<Record<BodyFamily, SemanticSocketLayout>> = {
  beetle: {
    topY: 1.06,
    frontZ: 1.05,
    halfWidth: 0.78,
    flankZ: 0.16,
    orbitY: 0.1,
    orbitRadius: 1.12,
    combatY: 0.12,
    combatZ: 1.2,
  },
  brute: {
    topY: 1.22,
    frontZ: 0.72,
    halfWidth: 0.9,
    flankZ: 0.1,
    orbitY: 0.08,
    orbitRadius: 0.75,
    combatY: 0.2,
    combatZ: 0.95,
  },
  wisp: {
    topY: 1.16,
    frontZ: 0.82,
    halfWidth: 0.72,
    flankZ: 0.05,
    orbitY: 0.1,
    orbitRadius: 1.15,
    combatY: 0.12,
    combatZ: 1.02,
  },
  mantis: {
    topY: 1.32,
    frontZ: 0.88,
    halfWidth: 0.8,
    flankZ: 0.04,
    orbitY: 0.1,
    orbitRadius: 1.12,
    combatY: 0.18,
    combatZ: 1.05,
  },
  sentinel: {
    topY: 1.08,
    frontZ: 0.88,
    halfWidth: 0.84,
    flankZ: 0.1,
    orbitY: 0.08,
    orbitRadius: 0.9,
    combatY: 0.16,
    combatZ: 1.08,
  },
  drake: {
    topY: 1.16,
    frontZ: 1.0,
    halfWidth: 1.0,
    flankZ: 0.05,
    orbitY: 0.1,
    orbitRadius: 1.27,
    combatY: 0.18,
    combatZ: 1.18,
  },
  "boss-colossus": {
    topY: 1.65,
    frontZ: 1.0,
    halfWidth: 1.15,
    flankZ: 0.1,
    orbitY: 0.12,
    orbitRadius: 1.1,
    combatY: 0.25,
    combatZ: 1.3,
  },
  "boss-hydra": {
    topY: 1.85,
    frontZ: 1.15,
    halfWidth: 1.1,
    flankZ: 0.1,
    orbitY: 0.14,
    orbitRadius: 1.42,
    combatY: 0.28,
    combatZ: 1.35,
  },
  "boss-catbug": {
    topY: 2.18,
    frontZ: 0.86,
    halfWidth: 0.98,
    flankZ: 0.1,
    orbitY: 1.08,
    orbitRadius: 1.2,
    combatY: 0.88,
    combatZ: 0.92,
  },
  "boss-evil-catbug": {
    topY: 1.85,
    frontZ: 0.82,
    halfWidth: 0.99,
    flankZ: 0.1,
    orbitY: 0.9,
    orbitRadius: 1.15,
    combatY: 0.72,
    combatZ: 0.86,
  },
  "boss-goose-hydra": {
    topY: 2.05,
    frontZ: 0.78,
    halfWidth: 0.98,
    flankZ: 0.08,
    orbitY: 1.02,
    orbitRadius: 1.18,
    combatY: 0.8,
    combatZ: 0.84,
  },
};

const riggedBody = (
  family: BodyFamily,
  root: THREE.Mesh,
  parts: readonly THREE.Object3D[],
  head: THREE.Object3D,
  motion: Motion = "standard",
  deathDrop = 0.2,
  reducedMotionOverride?: boolean,
): EnemyVisualComponent => {
  const pose = new THREE.Group();
  pose.name = `enemy-pose-${family}`;
  const rig = new THREE.Group();
  rig.name = `enemy-rig-${family}`;
  rig.add(root, ...parts);
  pose.add(rig);
  const socket = (name: string, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const node = new THREE.Group();
    node.name = `enemy-socket-${family}-${name}`;
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  };
  // Body-owned sockets keep profile identity separate from semantic placement.
  const layout = socketLayouts[family];
  const bodyAnchor = new THREE.Group();
  bodyAnchor.name = `enemy-body-anchor-${family}`;
  rig.add(bodyAnchor);
  const top = socket("top", head, 0, 0.16, 0);
  // The overhead socket belongs to the deforming rig, not a particular head.
  const overhead = socket("overhead", rig, 0, layout.topY, 0);
  const front =
    family === "drake"
      ? socket("front", rig, layout.frontZ, 0, 0)
      : socket("front", rig, 0, 0, layout.frontZ);
  const left = socket("left", rig, -layout.halfWidth, 0.05, layout.flankZ);
  const right = socket("right", rig, layout.halfWidth, 0.05, layout.flankZ);
  const flank = socket("flank", rig, layout.halfWidth, 0.05, layout.flankZ);
  const orbit = socket("orbit", pose, 0, layout.orbitY, 0);
  orbit.userData.bodyRadius = layout.orbitRadius;
  orbit.userData.maxOrbitRadius = 1.93;
  const combat = socket("combat", rig, 0, layout.combatY, layout.combatZ);
  const bases = [pose].map((node) => ({
    position: node.position.clone(),
    rotation: node.rotation.clone(),
    scale: node.scale.clone(),
  }));
  let command: EnemyVisualCommand | undefined;
  let frames = 0;
  let phase = 0;
  const reducedMotion =
    reducedMotionOverride ??
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  let captured:
    | {
        readonly position: THREE.Vector3;
        readonly rotation: THREE.Euler;
        readonly scale: THREE.Vector3;
      }
    | undefined;
  let residual = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  };
  const reset = (): void => {
    [pose].forEach((node, index) => {
      const base = bases[index];
      if (base === undefined) return;
      node.position.copy(base.position);
      node.rotation.copy(base.rotation);
      node.scale.copy(base.scale);
    });
    lift(Math.sin(phase) * enemyVisualAnimation.idleLift);
  };
  const scale = (x: number, y: number, z: number): void => {
    pose.scale.multiply(new THREE.Vector3(x, y, z));
  };
  const lift = (y: number): void => {
    pose.position.y += y;
  };
  const tilt = (z: number): void => {
    pose.rotation.z += z;
  };
  const start = (next: EnemyVisualCommand): void => {
    captured = {
      position: pose.position.clone(),
      rotation: pose.rotation.clone(),
      scale: pose.scale.clone(),
    };
    command = next;
    frames = enemyVisualAnimation.commandFrames[next];
    root.userData.lastCommand = next;
  };
  const commands: Readonly<Record<EnemyVisualCommand, () => void>> = {
    spawn: () => start("spawn"),
    hit: () => start("hit"),
    critical: () => start("critical"),
    death: () => start("death"),
  };
  const advanceCommand = (): void => {
    const total = enemyVisualAnimation.commandFrames[command ?? "hit"];
    const progress = (total - frames) / (total - 1);
    if (captured !== undefined) {
      residual = {
        position: captured.position.sub(pose.position),
        rotation: new THREE.Euler(
          captured.rotation.x - pose.rotation.x,
          captured.rotation.y - pose.rotation.y,
          captured.rotation.z - pose.rotation.z,
        ),
        scale: new THREE.Vector3(
          captured.scale.x / pose.scale.x,
          captured.scale.y / pose.scale.y,
          captured.scale.z / pose.scale.z,
        ),
      };
      captured = undefined;
    }
    const decay = 1 - progress;
    pose.position.addScaledVector(residual.position, decay);
    pose.rotation.x += residual.rotation.x * decay;
    pose.rotation.y += residual.rotation.y * decay;
    pose.rotation.z += residual.rotation.z * decay;
    pose.scale.multiply(
      new THREE.Vector3().lerpVectors(new THREE.Vector3(1, 1, 1), residual.scale, decay),
    );
    const peak = Math.sin(Math.PI * progress);
    if (command === "spawn") {
      const spawnScale = 0.72 + 0.28 * (1 - Math.cos(Math.PI * progress)) * 0.5;
      scale(spawnScale, spawnScale, spawnScale);
    }
    if (command === "hit")
      scale(1 + 0.08 * peak, 1 - (motion === "wisp" ? 0.16 : 0.08) * peak, 1 + 0.08 * peak);
    if (command === "critical")
      scale(1 + 0.15 * peak, 1 - (motion === "wisp" ? 0.25 : 0.14) * peak, 1 + 0.15 * peak);
    if (command === "death") {
      scale(1 + 0.1 * peak, 0.86 - 0.62 * progress, 1 + 0.1 * peak);
      lift(-deathDrop * progress);
      tilt(0.3 * progress);
    }
    frames -= 1;
    if (frames === 0)
      residual = {
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        scale: new THREE.Vector3(1, 1, 1),
      };
  };
  return component(
    `body-${family}`,
    "body",
    [pose],
    {
      [`body-${family}-motion`]: () => {
        if (reducedMotion) {
          frames = Math.max(0, frames - 1);
          if (frames === 0)
            residual = {
              position: new THREE.Vector3(),
              rotation: new THREE.Euler(),
              scale: new THREE.Vector3(1, 1, 1),
            };
          return;
        }
        phase += enemyVisualAnimation.idleRadians;
        reset();
        if (frames === 0) {
          return;
        }
        advanceCommand();
      },
    },
    commands,
    undefined,
    { pose, head, top, overhead, front, left, right, flank, orbit, combat, body: bodyAnchor },
  );
};

const beetle: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const body = core(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleCore),
    profile,
    "beetle",
  );
  body.scale.set(1.05, 0.72, 1.15);
  const shell = part(
    "enemy-part-beetle-shell",
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleShell),
    profile,
  );
  shell.scale.set(1.12, 0.72, enemyVisualTransforms.beetleShellZScale);
  shell.position.set(0, 0.22, 0.16);
  const head = part("enemy-part-beetle-head", new THREE.SphereGeometry(0.28, 8, 6), profile);
  head.position.set(0, -0.18, 0.62);
  const legs = [-1, 1].flatMap((side) =>
    [0.42, 0, -0.42].map((z, index) => {
      const leg = part(
        `enemy-part-beetle-leg-${side}-${index}`,
        new THREE.CylinderGeometry(0.035, 0.06, 0.52, 4),
        profile,
      );
      leg.position.set(side * 0.58, -0.38, z);
      leg.rotation.z = side * 1.22;
      leg.rotation.x = 0.42;
      return leg;
    }),
  );
  return riggedBody(
    "beetle",
    body,
    [shell, head, ...legs],
    head,
    "standard",
    0.2,
    reducedMotionOverride,
  );
};

const brute: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const body = core(new THREE.BoxGeometry(...enemyVisualGeometry.body.brute), profile, "brute");
  const head = part("enemy-part-brute-head", new THREE.BoxGeometry(0.68, 0.48, 0.52), profile);
  head.position.y = 0.64;
  const arms = [-1, 1].map((side) => {
    const arm = part(
      `enemy-part-brute-arm-${side}`,
      new THREE.CapsuleGeometry(0.16, 0.62, 4, 6),
      profile,
    );
    arm.position.set(side * 0.72, -0.06, 0);
    arm.rotation.z = side * 0.25;
    return arm;
  });
  const feet = [-1, 1].map((side) => {
    const foot = part(
      `enemy-part-brute-foot-${side}`,
      new THREE.BoxGeometry(0.28, 0.38, 0.36),
      profile,
    );
    foot.position.set(side * 0.34, -0.64, 0.06);
    return foot;
  });
  return riggedBody(
    "brute",
    body,
    [head, ...arms, ...feet],
    head,
    "standard",
    0.2,
    reducedMotionOverride,
  );
};

const wisp: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const body = core(new THREE.OctahedronGeometry(enemyVisualGeometry.body.wisp), profile, "wisp");
  const aura = part("enemy-part-wisp-aura", new THREE.TorusGeometry(0.58, 0.045, 6, 12), profile);
  aura.rotation.x = Math.PI / 2;
  aura.position.y = -0.12;
  const tail = part("enemy-part-wisp-tail", new THREE.ConeGeometry(0.3, 0.72, 6), profile);
  tail.position.y = -0.58;
  tail.rotation.x = Math.PI;
  const sparks = [-1, 1].map((side) => {
    const spark = part(
      `enemy-part-wisp-spark-${side}`,
      new THREE.SphereGeometry(0.09, 6, 5),
      profile,
    );
    spark.position.set(side * 0.48, 0.18, 0.08);
    return spark;
  });
  return riggedBody(
    "wisp",
    body,
    [aura, tail, ...sparks],
    body,
    "wisp",
    0.2,
    reducedMotionOverride,
  );
};

const mantis: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const thorax = core(
    new THREE.CapsuleGeometry(...enemyVisualGeometry.body.mantisThorax),
    profile,
    "mantis",
  );
  thorax.rotation.z = Math.PI / 2;
  const head = part("enemy-part-mantis-head", new THREE.SphereGeometry(0.25, 8, 6), profile);
  head.position.set(0, 0.72, 0.08);
  const abdomen = part("enemy-part-mantis-abdomen", new THREE.SphereGeometry(0.34, 8, 6), profile);
  abdomen.scale.set(0.8, 1.25, 0.75);
  abdomen.position.y = -0.58;
  const scythes = [-1, 1].map((side) => {
    const scythe = part(
      `enemy-part-mantis-scythe-${side}`,
      new THREE.ConeGeometry(...enemyVisualGeometry.body.mantisScythe),
      profile,
    );
    scythe.position.set(side * 0.58, 0.18, 0.18);
    scythe.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(side * 0.55, 0.16, 0.82).normalize(),
    );
    scythe.scale.y = 0.84;
    return scythe;
  });
  return riggedBody(
    "mantis",
    thorax,
    [head, abdomen, ...scythes],
    head,
    "standard",
    0.2,
    reducedMotionOverride,
  );
};

const sentinel: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const coreBody = core(
    new THREE.CylinderGeometry(...enemyVisualGeometry.body.sentinelCore),
    profile,
    "sentinel",
  );
  const visor = part("enemy-part-sentinel-visor", new THREE.BoxGeometry(0.72, 0.16, 0.2), profile);
  visor.position.set(0, 0.22, 0.58);
  const pylons = [-1, 1].map((side) => {
    const pylon = part(
      `enemy-part-sentinel-pylon-${side}`,
      new THREE.BoxGeometry(...enemyVisualGeometry.body.sentinelPylon),
      profile,
    );
    pylon.position.set(side * 0.7, 0.18, 0);
    return pylon;
  });
  const legs = [-1, 1].map((side) => {
    const leg = part(
      `enemy-part-sentinel-leg-${side}`,
      new THREE.BoxGeometry(0.2, 0.46, 0.24),
      profile,
    );
    leg.position.set(side * 0.32, -0.58, 0);
    return leg;
  });
  return riggedBody(
    "sentinel",
    coreBody,
    [visor, ...pylons, ...legs],
    visor,
    "standard",
    0.2,
    reducedMotionOverride,
  );
};

const drake: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const torso = core(
    new THREE.OctahedronGeometry(enemyVisualGeometry.body.drakeTorso),
    profile,
    "drake",
  );
  torso.scale.set(0.88, 0.42, 0.52);
  const neck = part("enemy-part-drake-neck", new THREE.OctahedronGeometry(0.28, 0), profile);
  neck.scale.set(1.2, 0.72, 0.78);
  neck.position.set(0.66, 0.08, 0);
  const head = core(new THREE.OctahedronGeometry(0.36, 0), profile, "drake");
  head.name = "enemy-part-drake-head";
  head.scale.set(1.06, 0.92, 0.9);
  head.position.set(1, 0.14, 0);
  const snout = part("enemy-part-drake-snout", new THREE.ConeGeometry(0.15, 0.34, 4), profile);
  snout.position.set(1.28, 0.12, 0);
  snout.rotation.z = -Math.PI / 2;
  const nativeHorns = [-1, 1].map((side) => {
    const horn = part(
      `enemy-part-drake-native-horn-${side}`,
      new THREE.ConeGeometry(0.05, 0.18, 4),
      profile,
    );
    horn.position.set(1.03, 0.31, side * 0.14);
    horn.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.62, 0.7, side * 0.2).normalize(),
    );
    return horn;
  });
  const wingRoots = [-1, 1].map((side) => {
    const root = new THREE.Group();
    root.name = `enemy-part-drake-wing-root-${side}`;
    root.position.set(-0.08 + side * 0.12, side < 0 ? 0.08 : 0.3, side * 0.1);
    root.rotation.y = side * 0.45;
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.04, -0.06);
    wingShape.lineTo(-0.98, side < 0 ? 0.04 : 0.12);
    wingShape.lineTo(-1.18, side < 0 ? 0.3 : 0.5);
    wingShape.lineTo(-0.38, side < 0 ? 0.42 : 0.62);
    wingShape.closePath();
    const wing = part(`enemy-part-drake-wing-${side}`, new THREE.ShapeGeometry(wingShape), profile);
    const material = wing.material;
    if (material instanceof THREE.MeshStandardMaterial) material.side = THREE.DoubleSide;
    root.add(wing);
    return root;
  });
  const tail = new THREE.Group();
  tail.name = "enemy-part-drake-tail";
  const tailCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.72, -0.04, 0),
    new THREE.Vector3(-1.24, -0.16, 0.3),
    new THREE.Vector3(-1.76, -0.18, 0.05),
  );
  const tailSegments = [0.12, 0.28, 0.46, 0.64, 0.8].map((progress, index) => {
    const scale = 0.22 - index * 0.032;
    const segment = part(
      `enemy-part-drake-tail-segment-${index + 1}`,
      new THREE.OctahedronGeometry(1, 0),
      profile,
    );
    segment.position.copy(tailCurve.getPoint(progress));
    segment.quaternion.setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      tailCurve.getTangent(progress),
    );
    segment.scale.set(scale * 1.5, scale * 0.7, scale);
    tail.add(segment);
    return segment;
  });
  const terminalSpike = part(
    "enemy-part-drake-tail-spike",
    new THREE.ConeGeometry(0.07, 0.3, 4),
    profile,
  );
  terminalSpike.position.copy(tailCurve.getPoint(1));
  terminalSpike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailCurve.getTangent(1));
  tail.add(terminalSpike);
  const body = riggedBody(
    "drake",
    torso,
    [neck, head, snout, ...nativeHorns, ...wingRoots, tail],
    head,
    "standard",
    0.2,
    reducedMotionOverride,
  );
  const reducedMotion =
    reducedMotionOverride ??
    (typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  const tailBases = tailSegments.map((segment) => segment.quaternion.clone());
  let phase = 0;
  return {
    ...body,
    animations: {
      ...body.animations,
      "body-drake-wing-flap": () => {
        if (reducedMotion) return;
        phase += enemyVisualAnimation.idleRadians;
        wingRoots.forEach((root, index) => {
          root.rotation.x = (index === 0 ? -1 : 1) * Math.sin(phase) * 0.08;
        });
        tailSegments.forEach((segment, index) => {
          const base = tailBases[index];
          if (base === undefined) return;
          segment.quaternion.copy(base);
          segment.rotateX(Math.sin(phase + index * 0.65) * 0.08);
        });
      },
    },
  };
};

const colossus: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const body = core(
    new THREE.CylinderGeometry(...enemyVisualGeometry.body.colossus),
    profile,
    "boss-colossus",
  );
  const head = part("enemy-part-colossus-head", new THREE.BoxGeometry(0.82, 0.5, 0.62), profile);
  head.position.y = 1.02;
  const shoulders = [-1, 1].map((side) => {
    const shoulder = part(
      `enemy-part-colossus-shoulder-${side}`,
      new THREE.SphereGeometry(0.38, 8, 6),
      profile,
    );
    shoulder.position.set(side * 0.84, 0.52, 0);
    return shoulder;
  });
  const arms = [-1, 1].map((side) => {
    const arm = part(
      `enemy-part-colossus-arm-${side}`,
      new THREE.BoxGeometry(0.28, 0.9, 0.34),
      profile,
    );
    arm.position.set(side * 0.92, -0.18, 0);
    return arm;
  });
  const legs = [-1, 1].flatMap((side) => {
    const leg = part(
      `enemy-part-colossus-leg-${side}`,
      new THREE.BoxGeometry(0.36, 0.7, 0.4),
      profile,
    );
    leg.position.set(side * 0.7, -1.25, 0.16);
    const foot = part(
      `enemy-part-colossus-foot-${side}`,
      new THREE.BoxGeometry(0.46, 0.18, 0.6),
      profile,
    );
    foot.position.set(side * 0.7, -1.7, 0.28);
    return [leg, foot];
  });
  return riggedBody(
    "boss-colossus",
    body,
    [head, ...shoulders, ...arms, ...legs],
    head,
    "standard",
    0.1,
    reducedMotionOverride,
  );
};

const hydra: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) => {
  const body = core(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.hydraCore),
    profile,
    "boss-hydra",
  );
  body.scale.set(1.15, 0.72, 0.92);
  const heads = [-0.6, 0, 0.6].flatMap((offset, index) => {
    const neck = part(
      `enemy-part-hydra-neck-${index}`,
      new THREE.CylinderGeometry(0.14, 0.2, 0.72, 6),
      profile,
    );
    neck.position.set(offset, 0.62, 0);
    neck.rotation.z = -offset * 0.52;
    const head = part(
      `enemy-part-hydra-head-${index}`,
      new THREE.SphereGeometry(0.3, 8, 6),
      profile,
    );
    head.position.set(offset * 1.24, 1.02, 0.08);
    const horn = part(
      `enemy-part-hydra-horn-${index}`,
      new THREE.ConeGeometry(0.09, 0.32, 4),
      profile,
    );
    horn.position.set(offset * 1.24, 1.32, 0.08);
    return [neck, head, horn];
  });
  const centerHead = heads[4];
  if (centerHead === undefined) throw new Error("Hydra requires a center head");
  return riggedBody("boss-hydra", body, heads, centerHead, "standard", 0.2, reducedMotionOverride);
};
const catbug: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) =>
  gltfBossBody(
    "boss-catbug",
    profile,
    reducedMotionOverride,
    colossus(profile, reducedMotionOverride),
  );

const gooseHydra: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) =>
  gltfBossBody(
    "boss-goose-hydra",
    profile,
    reducedMotionOverride,
    hydra(profile, reducedMotionOverride),
  );

const evilCatbug: EnemyBodyFactory = (profile = defaultProfile, reducedMotionOverride) =>
  gltfBossBody(
    "boss-evil-catbug",
    profile,
    reducedMotionOverride,
    hydra(profile, reducedMotionOverride),
  );
export const enemyBodyFactories: Readonly<Record<BodyFamily, EnemyBodyFactory>> = {
  beetle,
  brute,
  wisp,
  mantis,
  sentinel,
  drake,
  "boss-colossus": colossus,
  "boss-hydra": hydra,
  "boss-catbug": catbug,
  "boss-goose-hydra": gooseHydra,
  "boss-evil-catbug": evilCatbug,
};
