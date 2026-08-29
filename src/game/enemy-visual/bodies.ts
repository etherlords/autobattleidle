import * as THREE from "three";

import type { BodyFamily, EnemyVisualProfile } from "./spec";
import { component, mesh, type EnemyVisualCommand, type EnemyVisualComponent } from "./components";
import { enemyVisualAnimation, enemyVisualGeometry, enemyVisualTransforms } from "./config";

export type EnemyBodyFactory = (profile?: EnemyVisualProfile) => EnemyVisualComponent;

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

const riggedBody = (
  family: BodyFamily,
  root: THREE.Mesh,
  parts: readonly THREE.Object3D[],
  motion: Motion = "standard",
): EnemyVisualComponent => {
  const rig = new THREE.Group();
  rig.name = `enemy-rig-${family}`;
  rig.add(...parts);
  const nodes = [root, rig];
  const bases = nodes.map((node) => ({
    position: node.position.clone(),
    rotation: node.rotation.clone(),
    scale: node.scale.clone(),
  }));
  let command: EnemyVisualCommand | undefined;
  let frames = 0;
  let phase = 0;
  const reset = (): void => {
    nodes.forEach((node, index) => {
      const base = bases[index];
      if (base === undefined) return;
      node.position.copy(base.position);
      node.rotation.copy(base.rotation);
      node.scale.copy(base.scale);
    });
  };
  const scale = (x: number, y: number, z: number): void => {
    nodes.forEach((node) => node.scale.multiply(new THREE.Vector3(x, y, z)));
  };
  const lift = (y: number): void => {
    nodes.forEach((node) => (node.position.y += y));
  };
  const tilt = (z: number): void => {
    nodes.forEach((node) => (node.rotation.z += z));
  };
  const commands: Readonly<Record<EnemyVisualCommand, () => void>> = {
    spawn: () => {
      command = "spawn";
      frames = enemyVisualAnimation.commandFrames.spawn;
      root.userData.lastCommand = "spawn";
    },
    hit: () => {
      command = "hit";
      frames = enemyVisualAnimation.commandFrames.hit;
      root.userData.lastCommand = "hit";
    },
    critical: () => {
      command = "critical";
      frames = enemyVisualAnimation.commandFrames.critical;
      root.userData.lastCommand = "critical";
    },
    death: () => {
      command = "death";
      frames = enemyVisualAnimation.commandFrames.death;
      root.userData.lastCommand = "death";
    },
  };
  return component(
    `body-${family}`,
    "body",
    nodes,
    {
      [`body-${family}-motion`]: () => {
        phase += enemyVisualAnimation.idleRadians;
        reset();
        if (frames === 0) {
          lift(Math.sin(phase) * enemyVisualAnimation.idleLift);
          return;
        }
        const total = enemyVisualAnimation.commandFrames[command ?? "hit"];
        const progress = 1 - frames / total;
        if (command === "spawn")
          scale(0.72 + 0.28 * progress, 0.72 + 0.28 * progress, 0.72 + 0.28 * progress);
        if (command === "hit") scale(1.1, motion === "wisp" ? 0.78 : 0.9, 1.1);
        if (command === "critical") scale(1.2, motion === "wisp" ? 0.68 : 0.82, 1.2);
        if (command === "death") {
          scale(1.1, 0.86 - 0.62 * progress, 1.1);
          lift(-0.28 * progress);
          tilt(0.3 * progress);
        }
        frames -= 1;
      },
    },
    commands,
  );
};

const beetle: EnemyBodyFactory = (profile = defaultProfile) => {
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
    [-0.34, 0, 0.34].map((y, index) => {
      const leg = part(
        `enemy-part-beetle-leg-${side}-${index}`,
        new THREE.CylinderGeometry(0.035, 0.06, 0.52, 4),
        profile,
      );
      leg.position.set(side * 0.58, y, 0);
      leg.rotation.z = side * 1.08;
      return leg;
    }),
  );
  return riggedBody("beetle", body, [shell, head, ...legs]);
};

const brute: EnemyBodyFactory = (profile = defaultProfile) => {
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
  return riggedBody("brute", body, [head, ...arms, ...feet]);
};

const wisp: EnemyBodyFactory = (profile = defaultProfile) => {
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
  return riggedBody("wisp", body, [aura, tail, ...sparks], "wisp");
};

const mantis: EnemyBodyFactory = (profile = defaultProfile) => {
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
    scythe.position.set(side * 0.64, 0.35, 0.04);
    scythe.rotation.z = side * 1.18;
    return scythe;
  });
  return riggedBody("mantis", thorax, [head, abdomen, ...scythes]);
};

const sentinel: EnemyBodyFactory = (profile = defaultProfile) => {
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
  return riggedBody("sentinel", coreBody, [visor, ...pylons, ...legs]);
};

const drake: EnemyBodyFactory = (profile = defaultProfile) => {
  const torso = core(
    new THREE.OctahedronGeometry(enemyVisualGeometry.body.drakeTorso),
    profile,
    "drake",
  );
  torso.scale.set(1.25, 0.68, 0.88);
  const head = part("enemy-part-drake-head", new THREE.SphereGeometry(0.3, 8, 6), profile);
  head.position.set(0, 0.28, 0.68);
  const wings = [-1, 1].map((side) => {
    const wing = part(
      `enemy-part-drake-wing-${side}`,
      new THREE.ConeGeometry(...enemyVisualGeometry.body.drakeWing),
      profile,
    );
    wing.position.set(side * 0.78, 0.08, -0.04);
    wing.rotation.z = side * 1.32;
    return wing;
  });
  const tail = part(
    "enemy-part-drake-tail",
    new THREE.ConeGeometry(...enemyVisualGeometry.body.drakeTail),
    profile,
  );
  tail.position.set(0, -0.16, -0.72);
  tail.rotation.x = -Math.PI / 2;
  return riggedBody("drake", torso, [head, ...wings, tail]);
};

const colossus: EnemyBodyFactory = (profile = defaultProfile) => {
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
  return riggedBody("boss-colossus", body, [head, ...shoulders, ...arms]);
};

const hydra: EnemyBodyFactory = (profile = defaultProfile) => {
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
  return riggedBody("boss-hydra", body, heads);
};

export const enemyBodyFactories: Readonly<Record<BodyFamily, EnemyBodyFactory>> = {
  beetle,
  brute,
  wisp,
  mantis,
  sentinel,
  drake,
  "boss-colossus": colossus,
  "boss-hydra": hydra,
};
