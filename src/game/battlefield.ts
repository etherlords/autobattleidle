import * as THREE from "three";

import type { BattleSnapshot } from "../domain/snapshot";
import { createEnemyVisual, type EnemyVisual } from "./enemy-visual";

export { enemyVisualSpec, type EnemyVisualSpec } from "./enemy-visual";

export type Battlefield = {
  render(snapshot: BattleSnapshot): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

type EffectKind = "boss" | "death" | "hit" | "spawn";
type EnemyIdentity = {
  readonly grade: string;
  readonly level: number;
  readonly modifier: string | null;
};
type Effect = { readonly kind: EffectKind; life: number; readonly mesh: THREE.Mesh };

export type BattlefieldFrame = {
  readonly effects: readonly EffectKind[];
  readonly enemyChanged: boolean;
};

export type BattlefieldRenderer = {
  readonly domElement: HTMLCanvasElement;
  dispose(): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle: boolean): void;
};

const enemyKey = (enemy: EnemyIdentity): string =>
  `${enemy.grade}:${enemy.level}:${enemy.modifier ?? "none"}`;

export const nextBattlefieldFrame = (
  previous: BattleSnapshot | undefined,
  current: BattleSnapshot,
): BattlefieldFrame => {
  const enemyChanged =
    previous !== undefined && enemyKey(previous.enemy) !== enemyKey(current.enemy);
  const effects: EffectKind[] = [];
  if (previous === undefined || enemyChanged) {
    effects.push("spawn");
    if (current.enemy.grade === "boss") effects.push("boss");
  } else if (current.enemy.health < previous.enemy.health) {
    effects.push("hit");
  }
  if (enemyChanged) effects.push("death");
  return { effects, enemyChanged };
};

export const effectEvictions = (activeCount: number, additionCount: number): number =>
  Math.max(0, activeCount + additionCount - 12);

const disposeObject = (object: THREE.Object3D): void =>
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    }
  });

const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

const mesh = (geometry: THREE.BufferGeometry, color: string, emissive?: string): THREE.Mesh =>
  new THREE.Mesh(geometry, material(color, emissive));

const createPlayer = (): THREE.Group => {
  const player = new THREE.Group();
  player.add(mesh(new THREE.IcosahedronGeometry(0.62), "#4de1c1", "#0d443d"));
  const base = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 20), "#245f66");
  base.position.y = -0.68;
  player.add(base);
  player.position.set(-1.7, 0.7, 0);
  return player;
};

const createEffect = (kind: EffectKind): Effect => {
  const color = effectColor(kind);
  const effect = mesh(new THREE.RingGeometry(0.15, kind === "boss" ? 1.2 : 0.7, 20), color, color);
  effect.rotation.x = -Math.PI / 2;
  effect.position.set(1.7, 0.04, 0);
  return { kind, life: kind === "boss" ? 18 : 10, mesh: effect };
};
const effectColor = (kind: EffectKind): string => {
  if (kind === "hit") return "#fff4ba";
  return kind === "death" ? "#ff6d52" : "#8bdbff";
};

export const createBattlefield = (host: HTMLElement): Battlefield =>
  createBattlefieldWithRenderer(host, new THREE.WebGLRenderer({ antialias: true }));

export const createBattlefieldWithRenderer = (
  host: HTMLElement,
  renderer: BattlefieldRenderer,
): Battlefield => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07121f");
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2, 7);
  camera.lookAt(0, 0, 0);
  renderer.setPixelRatio(typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.domElement.className = "battlefield-canvas";
  host.append(renderer.domElement);
  const light = new THREE.DirectionalLight("#f8d28b", 2);
  light.position.set(2, 4, 3);
  scene.add(light, new THREE.HemisphereLight("#75c7ff", "#25120b", 1.5));
  const ground = mesh(new THREE.CircleGeometry(4, 32), "#172c35");
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground, createPlayer());
  let enemy: EnemyVisual | undefined;
  let previous: BattleSnapshot | undefined;
  let effects: Effect[] = [];
  let disposed = false;
  const retire = (object: THREE.Object3D): void => {
    scene.remove(object);
    disposeObject(object);
  };
  return {
    render: (snapshot) => {
      if (disposed) return;
      const retained: Effect[] = [];
      for (const effect of effects) {
        effect.life -= 1;
        effect.mesh.scale.multiplyScalar(1.08);
        if (effect.life > 0) retained.push(effect);
        else retire(effect.mesh);
      }
      effects = retained;
      enemy?.tick();
      const frame = nextBattlefieldFrame(previous, snapshot);
      if (enemy === undefined || frame.enemyChanged) {
        enemy?.dispose();
        enemy = createEnemyVisual(snapshot.enemy);
        scene.add(enemy.group);
      }
      const evicted = effects.splice(0, effectEvictions(effects.length, frame.effects.length));
      for (const effect of evicted) retire(effect.mesh);
      for (const kind of frame.effects) {
        const effect = createEffect(kind);
        effects.push(effect);
        scene.add(effect.mesh);
      }
      previous = snapshot;
      renderer.render(scene, camera);
    },
    resize: (width, height) => {
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      enemy?.dispose();
      disposeObject(scene);
      scene.clear();
      renderer.dispose();
      renderer.domElement.remove();
      effects = [];
      enemy = undefined;
      previous = undefined;
    },
  };
};
