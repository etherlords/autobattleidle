import * as THREE from "three";

import type { BodyFamily } from "./spec";
import { component, mesh, type EnemyVisualCommand, type EnemyVisualComponent } from "./components";
import {
  enemyVisualGeometry,
  enemyVisualLayout,
  enemyVisualPalette,
  enemyVisualTransforms,
} from "./config";

export type EnemyBodyFactory = () => EnemyVisualComponent;

const core = (
  geometry: THREE.BufferGeometry,
  color: string,
  emissive: string,
  body: BodyFamily,
) => {
  const node = mesh(geometry, color, emissive);
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

const beetle: EnemyBodyFactory = () => {
  const body = core(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleCore),
    enemyVisualPalette.beetle.core,
    enemyVisualPalette.beetle.emissive,
    "beetle",
  );
  const shell = mesh(
    new THREE.SphereGeometry(...enemyVisualGeometry.body.beetleShell),
    enemyVisualPalette.beetle.shell,
  );
  shell.scale.z = enemyVisualTransforms.beetleShellZScale;
  shell.position.y = enemyVisualTransforms.beetleShellY;
  return component("body-beetle", "body", [body, shell], undefined, bodyCommands(body));
};

const brute: EnemyBodyFactory = () => {
  const body = core(
    new THREE.BoxGeometry(...enemyVisualGeometry.body.brute),
    enemyVisualPalette.brute.core,
    enemyVisualPalette.brute.emissive,
    "brute",
  );
  return component("body-brute", "body", [body], undefined, bodyCommands(body));
};

const wisp: EnemyBodyFactory = () => {
  const body = core(
    new THREE.OctahedronGeometry(enemyVisualGeometry.body.wisp),
    enemyVisualPalette.wisp.core,
    enemyVisualPalette.wisp.emissive,
    "wisp",
  );
  return component("body-wisp", "body", [body], undefined, bodyCommands(body));
};

const colossus: EnemyBodyFactory = () => {
  const body = core(
    new THREE.CylinderGeometry(...enemyVisualGeometry.body.colossus),
    enemyVisualPalette.colossus.core,
    enemyVisualPalette.colossus.emissive,
    "boss-colossus",
  );
  return component("body-boss-colossus", "body", [body], undefined, bodyCommands(body));
};

const hydra: EnemyBodyFactory = () => {
  const body = core(
    new THREE.IcosahedronGeometry(...enemyVisualGeometry.body.hydraCore),
    enemyVisualPalette.hydra.core,
    enemyVisualPalette.hydra.emissive,
    "boss-hydra",
  );
  const heads = enemyVisualLayout.body.hydraHeadOffsets.map((offset) => {
    const head = mesh(
      new THREE.ConeGeometry(...enemyVisualGeometry.body.hydraHead),
      enemyVisualPalette.hydra.head,
      enemyVisualPalette.hydra.emissive,
    );
    head.position.set(offset, enemyVisualLayout.body.hydraHeadY, 0);
    return head;
  });
  return component("body-boss-hydra", "body", [body, ...heads], undefined, bodyCommands(body));
};

export const enemyBodyFactories: Readonly<Record<BodyFamily, EnemyBodyFactory>> = {
  beetle,
  brute,
  wisp,
  "boss-colossus": colossus,
  "boss-hydra": hydra,
};
