import * as THREE from "three";

import type { BattleEnemySnapshot, BattleSnapshot } from "../../domain/snapshot";
import type { EnemyUnit, EnemyUnitEvent, EnemyUnitEventType } from "../units/enemy";
import { UNIT_FACTORIES } from "../units/factories";
import type { PlayerUnit } from "../units/player";
import { BATTLEFIELD_CONFIG, cameraScaleForAspect } from "./config";
import {
  advanceBattlefieldEffect,
  createBattlefieldEffect,
  effectEvictions,
  type BattlefieldEffect,
  type EffectKind,
} from "./effects";

export type Battlefield = {
  render(snapshot: BattleSnapshot): void;
  rotateCamera(delta: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

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

const enemyKey = (enemy: BattleEnemySnapshot): string =>
  `${enemy.grade}:${enemy.level}:${enemy.modifier ?? "none"}`;

const ENEMY_EVENT_EFFECTS: Readonly<Record<EnemyUnitEventType, EffectKind | null>> = {
  spawned: "spawn",
  hit: "hit",
  critical: "hit",
  death: "death",
  synchronized: null,
  disposed: null,
};

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

const disposeObject = (object: THREE.Object3D): void =>
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material.dispose();
    }
  });

const createMaterial = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

const createMesh = (geometry: THREE.BufferGeometry, color: string, emissive?: string): THREE.Mesh =>
  new THREE.Mesh(geometry, createMaterial(color, emissive));

class ThreeBattlefield implements Battlefield {
  private readonly camera = new THREE.PerspectiveCamera(
    BATTLEFIELD_CONFIG.camera.fieldOfView,
    1,
    BATTLEFIELD_CONFIG.camera.near,
    BATTLEFIELD_CONFIG.camera.far,
  );
  private readonly scene = new THREE.Scene();
  private readonly player: PlayerUnit = UNIT_FACTORIES.player.create();
  private enemy: EnemyUnit | undefined;
  private unsubscribeEnemy: (() => void) | undefined;
  private pendingEnemyEffects: EffectKind[] = [];
  private previous: BattleSnapshot | undefined;
  private effects: BattlefieldEffect[] = [];
  private aspect = 1;
  private azimuth = 0;
  private bossOrbitEnabled = false;
  private disposed = false;

  constructor(
    host: HTMLElement,
    private readonly renderer: BattlefieldRenderer,
  ) {
    this.scene.background = new THREE.Color(BATTLEFIELD_CONFIG.backgroundColor);
    this.frameCamera(1);
    renderer.setPixelRatio(
      typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio, BATTLEFIELD_CONFIG.renderer.maximumPixelRatio),
    );
    renderer.domElement.className = "battlefield-canvas";
    host.append(renderer.domElement);
    this.addSceneFixtures();
  }

  render(snapshot: BattleSnapshot): void {
    if (this.disposed) return;
    this.tickEffects();
    this.enemy?.tick();
    const frame = nextBattlefieldFrame(this.previous, snapshot);
    if (this.enemy === undefined || frame.enemyChanged) this.replaceEnemy(snapshot.enemy);
    else this.enemy.dispatchEnemy({ type: "sync", snapshot: snapshot.enemy });
    if (frame.effects.includes("hit")) this.enemy?.dispatchEnemy({ type: "hit" });
    this.addEffects(this.effectsForFrame(frame.effects));
    this.bossOrbitEnabled = snapshot.enemy.grade === "boss";
    this.frameCamera(this.aspect);
    this.previous = snapshot;
    this.renderer.render(this.scene, this.camera);
  }

  rotateCamera(delta: number): void {
    if (this.disposed || !this.bossOrbitEnabled || !Number.isFinite(delta)) return;
    this.azimuth = (this.azimuth + delta) % (Math.PI * 2);
    this.frameCamera(this.aspect);
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.aspect = safeWidth / safeHeight;
    this.camera.aspect = this.aspect;
    this.frameCamera(this.aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.enemy?.dispatchEnemy({ type: "dispose" });
    this.unsubscribeEnemy?.();
    this.player.dispose();
    disposeObject(this.scene);
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.effects = [];
    this.enemy = undefined;
    this.unsubscribeEnemy = undefined;
    this.pendingEnemyEffects = [];
    this.previous = undefined;
  }

  private addSceneFixtures(): void {
    const { directional, hemisphere } = BATTLEFIELD_CONFIG.lights;
    const light = new THREE.DirectionalLight(directional.color, directional.intensity);
    light.position.set(...directional.position);
    this.scene.add(
      light,
      new THREE.HemisphereLight(hemisphere.skyColor, hemisphere.groundColor, hemisphere.intensity),
    );
    const { color, radius, segments } = BATTLEFIELD_CONFIG.ground;
    const ground = createMesh(new THREE.CircleGeometry(radius, segments), color);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    this.player.dispatch({ type: "attach", parent: this.scene });
  }

  private frameCamera(aspect: number): void {
    const scale = cameraScaleForAspect(aspect);
    const distance = BATTLEFIELD_CONFIG.camera.distance * scale;
    const azimuth = this.bossOrbitEnabled ? this.azimuth : 0;
    this.camera.position.set(
      Math.sin(azimuth) * distance,
      BATTLEFIELD_CONFIG.camera.elevation * scale,
      Math.cos(azimuth) * distance,
    );
    this.camera.lookAt(0, 0, 0);
  }

  private tickEffects(): void {
    const retained: BattlefieldEffect[] = [];
    for (const effect of this.effects) {
      if (advanceBattlefieldEffect(effect)) retained.push(effect);
      else this.retire(effect.mesh);
    }
    this.effects = retained;
  }

  private replaceEnemy(snapshot: BattleEnemySnapshot): void {
    this.enemy?.dispatchEnemy({ type: "death" });
    this.enemy?.dispatchEnemy({ type: "dispose" });
    this.unsubscribeEnemy?.();
    this.enemy = UNIT_FACTORIES.enemy.create(snapshot);
    this.unsubscribeEnemy = this.enemy.subscribeEnemy((event) => this.receiveEnemyEvent(event));
    this.enemy.dispatchEnemy({ type: "spawn", parent: this.scene });
  }

  private receiveEnemyEvent(event: EnemyUnitEvent): void {
    const effect = ENEMY_EVENT_EFFECTS[event.type];
    if (effect !== null) this.pendingEnemyEffects.push(effect);
  }

  private effectsForFrame(expected: readonly EffectKind[]): readonly EffectKind[] {
    const effects: EffectKind[] = [];
    for (const effect of expected) {
      if (effect === "boss") {
        effects.push(effect);
        continue;
      }
      const index = this.pendingEnemyEffects.indexOf(effect);
      if (index < 0) continue;
      this.pendingEnemyEffects.splice(index, 1);
      effects.push(effect);
    }
    this.pendingEnemyEffects = [];
    return effects;
  }

  private addEffects(kinds: readonly EffectKind[]): void {
    const evicted = this.effects.splice(0, effectEvictions(this.effects.length, kinds.length));
    for (const effect of evicted) this.retire(effect.mesh);
    for (const kind of kinds) {
      const effect = createBattlefieldEffect(kind);
      this.effects.push(effect);
      this.scene.add(effect.mesh);
    }
  }

  private retire(object: THREE.Object3D): void {
    this.scene.remove(object);
    disposeObject(object);
  }
}

export const createBattlefield = (host: HTMLElement): Battlefield =>
  createBattlefieldWithRenderer(host, new THREE.WebGLRenderer({ antialias: true }));

export const createBattlefieldWithRenderer = (
  host: HTMLElement,
  renderer: BattlefieldRenderer,
): Battlefield => new ThreeBattlefield(host, renderer);
