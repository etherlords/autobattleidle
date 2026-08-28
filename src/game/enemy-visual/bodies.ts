import * as THREE from "three";

import type { BodyFamily } from "./spec";
import { component, mesh, type EnemyVisualComponent } from "./components";
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
  return component("body", [body, shell]);
};

const brute: EnemyBodyFactory = () =>
  component("body", [
    core(
      new THREE.BoxGeometry(...enemyVisualGeometry.body.brute),
      enemyVisualPalette.brute.core,
      enemyVisualPalette.brute.emissive,
      "brute",
    ),
  ]);

const wisp: EnemyBodyFactory = () =>
  component("body", [
    core(
      new THREE.OctahedronGeometry(enemyVisualGeometry.body.wisp),
      enemyVisualPalette.wisp.core,
      enemyVisualPalette.wisp.emissive,
      "wisp",
    ),
  ]);

const colossus: EnemyBodyFactory = () =>
  component("body", [
    core(
      new THREE.CylinderGeometry(...enemyVisualGeometry.body.colossus),
      enemyVisualPalette.colossus.core,
      enemyVisualPalette.colossus.emissive,
      "boss-colossus",
    ),
  ]);

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
  return component("body", [body, ...heads]);
};

export const enemyBodyFactories: Readonly<Record<BodyFamily, EnemyBodyFactory>> = {
  beetle,
  brute,
  wisp,
  "boss-colossus": colossus,
  "boss-hydra": hydra,
};
