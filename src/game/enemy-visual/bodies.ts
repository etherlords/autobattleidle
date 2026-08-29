import * as THREE from "three";

import type { BodyFamily, EnemyVisualProfile } from "./spec";
import { component, mesh, type EnemyVisualCommand, type EnemyVisualComponent } from "./components";
import { enemyVisualGeometry, enemyVisualLayout, enemyVisualTransforms } from "./config";

export type EnemyBodyFactory = (profile?: EnemyVisualProfile) => EnemyVisualComponent;
const defaultProfile: EnemyVisualProfile = {
  attachment: [0.7, 0.2, 0],
  decorations: ["fins", "horns"],
  palette: { accent: "#cf563f", core: "#ff9d66", emissive: "#4d180d" },
  variant: 0,
};

const core = (
  geometry: THREE.BufferGeometry,
  color: string,
  emissive: string,
  body: BodyFamily,
  profile?: EnemyVisualProfile,
) => {
  const node = mesh(geometry, color, emissive, profile?.metallic);
  node.name = `enemy-body-${body}`;
  return node;
};

const bodyCommands = (body: THREE.Object3D): Readonly<Record<EnemyVisualCommand, () => void>> => ({
  spawn: () => {
    body.userData.lastCommand = "spawn";
  },
  hit: () => {
    body.userData.lastCommand = "hit";
  },
  critical: () => {
    body.userData.lastCommand = "critical";
  },
  death: () => {
    body.userData.lastCommand = "death";
  },
});

const beetle: EnemyBodyFactory = (profile = defaultProfile) => {
  const body = core(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleCore),
    profile.palette.core,
    profile.palette.emissive,
    "beetle",
    profile,
  );
  const shell = mesh(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleShell),
    profile.palette.accent,
  );
  shell.scale.z = enemyVisualTransforms.beetleShellZScale;
  shell.position.y = enemyVisualTransforms.beetleShellY;
  return component("body-beetle", "body", [body, shell], undefined, bodyCommands(body));
};

const brute: EnemyBodyFactory = (profile = defaultProfile) => {
  const body = core(
    new THREE.BoxGeometry(...enemyVisualGeometry.body.brute),
    profile.palette.core,
    profile.palette.emissive,
    "brute",
    profile,
  );
  return component("body-brute", "body", [body], undefined, bodyCommands(body));
};

const wisp: EnemyBodyFactory = (profile = defaultProfile) => {
  const body = core(
    new THREE.OctahedronGeometry(enemyVisualGeometry.body.wisp),
    profile.palette.core,
    profile.palette.emissive,
    "wisp",
    profile,
  );
  return component("body-wisp", "body", [body], undefined, bodyCommands(body));
};

const colossus: EnemyBodyFactory = (profile = defaultProfile) => {
  const body = core(
    new THREE.CylinderGeometry(...enemyVisualGeometry.body.colossus),
    profile.palette.core,
    profile.palette.emissive,
    "boss-colossus",
    profile,
  );
  return component("body-boss-colossus", "body", [body], undefined, bodyCommands(body));
};

const hydra: EnemyBodyFactory = (profile = defaultProfile) => {
  const body = core(
    new THREE.IcosahedronGeometry(...enemyVisualGeometry.body.hydraCore),
    profile.palette.core,
    profile.palette.emissive,
    "boss-hydra",
    profile,
  );
  const heads = enemyVisualLayout.body.hydraHeadOffsets.map((offset) => {
    const head = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.body.hydraHead),
      profile.palette.accent,
      profile.palette.emissive,
    );
    head.position.set(offset, enemyVisualLayout.body.hydraHeadY, 0);
    return head;
  });
  return component("body-boss-hydra", "body", [body, ...heads], undefined, bodyCommands(body));
};

const mantis: EnemyBodyFactory = (profile = defaultProfile) => {
  const thorax = core(
    new THREE.CapsuleGeometry(...enemyVisualGeometry.body.mantisThorax),
    profile.palette.core,
    profile.palette.emissive,
    "mantis",
    profile,
  );
  const scythes = [-1, 1].map((side) => {
    const scythe = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.body.mantisScythe),
      profile.palette.accent,
    );
    scythe.position.set(side * 0.62, 0.45, 0);
    scythe.rotation.z = side * 1.05;
    return scythe;
  });
  return component("body-mantis", "body", [thorax, ...scythes], undefined, bodyCommands(thorax));
};

const sentinel: EnemyBodyFactory = (profile = defaultProfile) => {
  const coreBody = core(
    new THREE.CylinderGeometry(...enemyVisualGeometry.body.sentinelCore),
    profile.palette.core,
    profile.palette.emissive,
    "sentinel",
    profile,
  );
  const pylons = [-1, 1].map((side) => {
    const pylon = mesh(
      new THREE.BoxGeometry(...enemyVisualGeometry.body.sentinelPylon),
      profile.palette.accent,
    );
    pylon.position.set(side * 0.7, 0.18, 0);
    return pylon;
  });
  return component(
    "body-sentinel",
    "body",
    [coreBody, ...pylons],
    undefined,
    bodyCommands(coreBody),
  );
};

const drake: EnemyBodyFactory = (profile = defaultProfile) => {
  const torso = core(
    new THREE.OctahedronGeometry(enemyVisualGeometry.body.drakeTorso),
    profile.palette.core,
    profile.palette.emissive,
    "drake",
    profile,
  );
  torso.scale.set(1.2, 0.65, 0.8);
  const wings = [-1, 1].map((side) => {
    const wing = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.body.drakeWing),
      profile.palette.accent,
    );
    wing.position.set(side * 0.74, 0.05, 0);
    wing.rotation.z = side * 1.2;
    return wing;
  });
  const tail = mesh(
    new THREE.ConeGeometry(...enemyVisualGeometry.body.drakeTail),
    profile.palette.accent,
  );
  tail.position.set(0, -0.42, 0);
  tail.rotation.x = Math.PI;
  return component("body-drake", "body", [torso, ...wings, tail], undefined, bodyCommands(torso));
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
