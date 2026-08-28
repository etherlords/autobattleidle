import * as THREE from "three";

import type { BattleSnapshot } from "../domain/snapshot";

export type Battlefield = {
  render(snapshot: BattleSnapshot): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

type EffectKind = "boss" | "death" | "hit" | "spawn";
type EnemyIdentity = Pick<BattleSnapshot["enemy"], "grade" | "level" | "modifier">;
type Effect = { readonly kind: EffectKind; life: number; readonly mesh: THREE.Mesh };

export type EnemyVisualSpec = {
  readonly body: "box" | "cone" | "dodecahedron" | "octahedron";
  readonly bossCrown: boolean;
  readonly modifierCue: "clock" | "halo" | "shield" | null;
  readonly scale: number;
};

export const enemyVisualSpec = (enemy: EnemyIdentity): EnemyVisualSpec => ({
  body:
    enemy.grade === "normal"
      ? "dodecahedron"
      : enemy.grade === "veteran"
        ? "box"
        : enemy.grade === "elite"
          ? "octahedron"
          : "cone",
  bossCrown: enemy.grade === "boss",
  modifierCue:
    enemy.modifier === "armor"
      ? "shield"
      : enemy.modifier === "health"
        ? "halo"
        : enemy.modifier === "automatic-slow"
          ? "clock"
          : null,
  scale: enemy.grade === "boss" ? 1.45 : enemy.grade === "elite" ? 1.12 : 1,
});

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

const addModifierCue = (group: THREE.Group, modifier: string | null): void => {
  if (modifier === "armor") {
    const shield = mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 20), "#d6e5f0");
    shield.rotation.x = Math.PI / 2;
    group.add(shield);
  }
  if (modifier === "health") {
    const halo = mesh(new THREE.TorusGeometry(0.98, 0.08, 8, 20), "#7dff92", "#163f1d");
    halo.position.y = 0.5;
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
  }
  if (modifier === "automatic-slow") {
    const clock = mesh(new THREE.TorusGeometry(0.82, 0.07, 8, 16), "#8cb7ff", "#12274d");
    clock.rotation.x = Math.PI / 2;
    group.add(clock);
    const hand = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), "#e8f0ff");
    hand.position.y = 0.25;
    group.add(hand);
  }
};

const createEnemy = (enemy: EnemyIdentity): THREE.Group => {
  const group = new THREE.Group();
  const spec = enemyVisualSpec(enemy);
  const body =
    spec.body === "dodecahedron"
      ? mesh(new THREE.DodecahedronGeometry(0.68), "#ff9d66", "#4d180d")
      : spec.body === "box"
        ? mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), "#f3bd58", "#4d3210")
        : spec.body === "octahedron"
          ? mesh(new THREE.OctahedronGeometry(0.8), "#bd7cff", "#311653")
          : mesh(new THREE.ConeGeometry(0.92, 1.6, 6), "#e9576d", "#5b1021");
  group.add(body);
  if (spec.bossCrown) {
    const crown = mesh(new THREE.ConeGeometry(0.75, 0.5, 5), "#f8d28b", "#60420b");
    crown.position.y = 1;
    crown.rotation.y = Math.PI / 5;
    group.add(crown);
  }
  addModifierCue(group, enemy.modifier);
  group.scale.setScalar(spec.scale);
  group.position.set(1.7, 0.8, 0);
  return group;
};

const createEffect = (kind: EffectKind): Effect => {
  const color = kind === "hit" ? "#fff4ba" : kind === "death" ? "#ff6d52" : "#8bdbff";
  const effect = mesh(new THREE.RingGeometry(0.15, kind === "boss" ? 1.2 : 0.7, 20), color, color);
  effect.rotation.x = -Math.PI / 2;
  effect.position.set(1.7, 0.04, 0);
  return { kind, life: kind === "boss" ? 18 : 10, mesh: effect };
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
  let enemy: THREE.Group | undefined;
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
      const frame = nextBattlefieldFrame(previous, snapshot);
      if (enemy === undefined || frame.enemyChanged) {
        if (enemy !== undefined) retire(enemy);
        enemy = createEnemy(snapshot.enemy);
        scene.add(enemy);
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
