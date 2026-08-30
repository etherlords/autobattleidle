import * as THREE from "three";

import type { BattleEnemySnapshot, BattleSnapshot } from "../../domain/snapshot";
import type { EnemyUnit } from "../units/enemy";
import { UNIT_FACTORIES } from "../units/factories";
import type { PlayerUnit } from "../units/player";
import { enemyVisualAnimation } from "../enemy-visual/config";
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

type PendingLethalReplacement = {
  displayed: BattleEnemySnapshot;
  effects: readonly EffectKind[];
  frames: number;
  snapshot: BattleEnemySnapshot;
  stage: "impact" | "pause" | "death";
};

export type BattlefieldRenderer = {
  readonly domElement: HTMLCanvasElement;
  dispose(): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle: boolean): void;
};

const enemyKey = (enemy: BattleEnemySnapshot): string =>
  `${enemy.grade}:${enemy.level}:${enemy.modifier ?? "none"}:${enemy.goldenBug}`;

export const nextBattlefieldFrame = (
  previous: BattleSnapshot | undefined,
  current: BattleSnapshot,
): BattlefieldFrame => {
  const enemyChanged =
    previous !== undefined && enemyKey(previous.enemy) !== enemyKey(current.enemy);
  return {
    effects: previous === undefined ? ["spawn"] : [...(current.visualCues ?? [])],
    enemyChanged,
  };
};

export const enemyAnimationForEffects = (
  effects: readonly EffectKind[],
): "critical" | "hit" | null => {
  if (effects.includes("critical")) return "critical";
  return effects.includes("armor") || effects.includes("hit") ? "hit" : null;
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
  private readonly framingCamera = new THREE.PerspectiveCamera(
    BATTLEFIELD_CONFIG.camera.fieldOfView,
    1,
    BATTLEFIELD_CONFIG.camera.near,
    BATTLEFIELD_CONFIG.camera.far,
  );
  private readonly scene = new THREE.Scene();
  private readonly player: PlayerUnit = UNIT_FACTORIES.player.create();
  private enemy: EnemyUnit | undefined;
  private unsubscribeEnemy: (() => void) | undefined;
  private previous: BattleSnapshot | undefined;
  private effects: BattlefieldEffect[] = [];
  private aspect = 1;
  private azimuth = 0;
  private bossOrbitEnabled = false;
  private pendingLethalReplacement: PendingLethalReplacement | undefined;
  private ordinaryFramingBounds: THREE.Box3 | undefined;
  private ordinaryFramingScale = 1;
  private disposed = false;
  private readonly reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
    const sequencedEffects = this.advanceLethalReplacement();
    let startedEffects: readonly EffectKind[] = [];
    if (this.pendingLethalReplacement !== undefined) {
      this.pendingLethalReplacement.snapshot = snapshot.enemy;
    } else if (this.enemy === undefined || frame.enemyChanged) {
      if (this.isLethalReplacement(frame))
        startedEffects = this.beginLethalReplacement(snapshot.enemy, frame.effects);
      else this.replaceEnemy(snapshot.enemy);
    } else {
      this.enemy.dispatchEnemy({ type: "sync", snapshot: snapshot.enemy });
      const animation = enemyAnimationForEffects(frame.effects);
      if (animation !== null) this.enemy.dispatchEnemy({ type: animation });
    }
    const effects =
      sequencedEffects ??
      (this.pendingLethalReplacement === undefined ? frame.effects : startedEffects);
    this.addEffects(effects);
    this.bossOrbitEnabled =
      this.pendingLethalReplacement === undefined
        ? snapshot.enemy.grade === "boss"
        : this.enemy?.spec.body.startsWith("boss-") === true;
    this.frameCamera(this.aspect);
    this.updateCanvasReceipt(snapshot, effects);
    this.previous = snapshot;
    this.renderer.render(this.scene, this.camera);
  }

  rotateCamera(delta: number): void {
    if (this.disposed || !this.bossOrbitEnabled || !Number.isFinite(delta)) return;
    this.azimuth = (this.azimuth + delta) % (Math.PI * 2);
    this.frameCamera(this.aspect);
    this.refreshProjectionReceipt();
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.aspect = safeWidth / safeHeight;
    this.camera.aspect = this.aspect;
    this.renderer.setSize(safeWidth, safeHeight, false);
    this.refreshOrdinaryFraming();
    this.frameCamera(this.aspect);
    this.camera.updateProjectionMatrix();
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
    this.clearCanvasReceipt();
    this.effects = [];
    this.enemy = undefined;
    this.unsubscribeEnemy = undefined;
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
    const framingScale = this.cameraFramingScale();
    const distance = BATTLEFIELD_CONFIG.camera.distance * scale * framingScale;
    const azimuth = this.bossOrbitEnabled ? this.azimuth : 0;
    this.camera.position.set(
      Math.sin(azimuth) * distance,
      BATTLEFIELD_CONFIG.camera.elevation * scale * framingScale,
      Math.cos(azimuth) * distance,
    );
    this.camera.lookAt(0, 0, 0);
  }

  private cameraFramingScale(): number {
    if (this.bossOrbitEnabled) return BATTLEFIELD_CONFIG.camera.bossFramingScale;
    return this.ordinaryFramingScale;
  }

  private refreshOrdinaryFraming(): void {
    if (this.enemy === undefined || this.bossOrbitEnabled) {
      this.ordinaryFramingBounds = undefined;
      this.ordinaryFramingScale = 1;
      return;
    }
    const canvasHeight = this.renderer.domElement.clientHeight || this.renderer.domElement.height;
    if (canvasHeight <= 0) return;
    this.enemy.view.group.updateMatrixWorld(true);
    this.ordinaryFramingBounds ??= new THREE.Box3().setFromObject(this.enemy.view.group);
    const bounds = this.ordinaryFramingBounds;
    const minimumTop = canvasHeight * BATTLEFIELD_CONFIG.camera.ordinaryHudSafeTopRatio;
    const maximum = BATTLEFIELD_CONFIG.camera.ordinaryMaximumFramingScale;
    if (this.projectedBoundsTop(bounds, this.aspect, 1) >= minimumTop) {
      this.ordinaryFramingScale = 1;
      return;
    }
    let lower = 1;
    let upper: number = maximum;
    for (let iteration = 0; iteration < 10; iteration += 1) {
      const candidate = (lower + upper) / 2;
      if (this.projectedBoundsTop(bounds, this.aspect, candidate) < minimumTop) lower = candidate;
      else upper = candidate;
    }
    this.ordinaryFramingScale = upper;
  }

  private projectedBoundsTop(bounds: THREE.Box3, aspect: number, framingScale: number): number {
    const scale = cameraScaleForAspect(aspect) * framingScale;
    const distance = BATTLEFIELD_CONFIG.camera.distance * scale;
    const camera = this.framingCamera;
    camera.aspect = aspect;
    camera.position.set(0, BATTLEFIELD_CONFIG.camera.elevation * scale, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const canvasHeight = this.renderer.domElement.clientHeight || this.renderer.domElement.height;
    return Math.min(
      ...[
        [bounds.min.x, bounds.min.y, bounds.min.z],
        [bounds.min.x, bounds.min.y, bounds.max.z],
        [bounds.min.x, bounds.max.y, bounds.min.z],
        [bounds.min.x, bounds.max.y, bounds.max.z],
        [bounds.max.x, bounds.min.y, bounds.min.z],
        [bounds.max.x, bounds.min.y, bounds.max.z],
        [bounds.max.x, bounds.max.y, bounds.min.z],
        [bounds.max.x, bounds.max.y, bounds.max.z],
      ].map(([x, y, z]) => (1 - new THREE.Vector3(x, y, z).project(camera).y) * 0.5 * canvasHeight),
    );
  }

  private tickEffects(): void {
    const retained: BattlefieldEffect[] = [];
    for (const effect of this.effects) {
      if (advanceBattlefieldEffect(effect)) retained.push(effect);
      else this.retire(effect.mesh);
    }
    this.effects = retained;
  }

  private replaceEnemy(snapshot: BattleEnemySnapshot, animateRetiring = true): void {
    if (animateRetiring) this.enemy?.dispatchEnemy({ type: "death" });
    this.enemy?.dispatchEnemy({ type: "dispose" });
    this.unsubscribeEnemy?.();
    this.enemy = UNIT_FACTORIES.enemy.create(snapshot);
    this.unsubscribeEnemy = undefined;
    this.enemy.dispatchEnemy({ type: "spawn", parent: this.scene });
    this.ordinaryFramingBounds = undefined;
    this.bossOrbitEnabled = snapshot.grade === "boss";
    this.refreshOrdinaryFraming();
  }

  private isLethalReplacement(frame: BattlefieldFrame): boolean {
    return (
      frame.enemyChanged &&
      frame.effects.includes("death") &&
      (frame.effects.includes("hit") || frame.effects.includes("critical"))
    );
  }

  private beginLethalReplacement(
    snapshot: BattleEnemySnapshot,
    effects: readonly EffectKind[],
  ): readonly EffectKind[] {
    const impact = effects.includes("critical") ? "critical" : "hit";
    this.enemy?.dispatchEnemy({ type: impact });
    this.pendingLethalReplacement = {
      displayed: this.previous?.enemy ?? snapshot,
      effects: effects.filter((effect) => effect !== "hit" && effect !== "critical"),
      frames: enemyVisualAnimation.commandFrames[impact],
      snapshot,
      stage: "impact",
    };
    return [impact];
  }

  private advanceLethalReplacement(): readonly EffectKind[] | undefined {
    const pending = this.pendingLethalReplacement;
    if (pending === undefined) return undefined;
    if (pending.stage === "pause") {
      if (pending.frames > 0) {
        pending.frames -= 1;
        return [];
      }
      pending.stage = "death";
      pending.frames = enemyVisualAnimation.commandFrames.death;
      this.enemy?.dispatchEnemy({ type: "death" });
      return pending.effects;
    }
    pending.frames -= 1;
    if (pending.frames > 0) return [];
    if (pending.stage === "impact") {
      pending.stage = "pause";
      pending.frames = enemyVisualAnimation.lethalPauseFrames;
      return [];
    }
    this.pendingLethalReplacement = undefined;
    this.replaceEnemy(pending.snapshot, false);
    return [];
  }

  private addEffects(kinds: readonly EffectKind[]): void {
    const evicted = this.effects.splice(0, effectEvictions(this.effects.length, kinds.length));
    for (const effect of evicted) this.retire(effect.mesh);
    for (const kind of kinds) {
      const effect = createBattlefieldEffect(
        kind,
        this.reducedMotion,
        this.enemy?.enemyView.combatSocketWorldPosition(),
        this.cameraFramingScale(),
      );
      this.effects.push(effect);
      this.scene.add(effect.mesh);
    }
  }

  private updateCanvasReceipt(snapshot: BattleSnapshot, effects: readonly EffectKind[]): void {
    const visual = this.enemy?.spec;
    const displayed = this.displayedEnemy(snapshot);
    const dataset = this.renderer.domElement.dataset;
    dataset.enemyFamily = visual?.body ?? snapshot.enemy.family ?? "";
    dataset.enemyVariant = String(visual?.profile.variant ?? snapshot.enemy.variant ?? "");
    dataset.enemySeed = String(visual?.seed ?? snapshot.enemy.seed ?? "");
    dataset.enemyGrade = displayed.grade;
    dataset.enemyModifier = displayed.modifier ?? "none";
    dataset.goldenBug = String(displayed.goldenBug === true);
    dataset.activeEffectCount = String(this.effects.length);
    dataset.lastEffectKinds = effects.slice(0, 8).join(",");
    this.setEffectOriginReceipt(dataset);
    dataset.enemyTopPx = this.projectedEnemyTop();
  }

  private displayedEnemy(snapshot: BattleSnapshot): BattleEnemySnapshot {
    return this.pendingLethalReplacement?.displayed ?? snapshot.enemy;
  }

  private refreshProjectionReceipt(): void {
    this.renderer.domElement.dataset.enemyTopPx = this.projectedEnemyTop();
  }

  private clearCanvasReceipt(): void {
    const dataset = this.renderer.domElement.dataset;
    delete dataset.enemyFamily;
    delete dataset.enemyVariant;
    delete dataset.enemySeed;
    delete dataset.enemyGrade;
    delete dataset.enemyModifier;
    delete dataset.goldenBug;
    delete dataset.activeEffectCount;
    delete dataset.lastEffectKinds;
    delete dataset.lastEffectOrigin;
    delete dataset.enemyTopPx;
  }

  private setEffectOriginReceipt(dataset: DOMStringMap): void {
    const effect = this.effects[this.effects.length - 1];
    dataset.lastEffectOrigin = effect === undefined ? "" : effect.mesh.position.toArray().join(",");
  }

  private projectedEnemyTop(): string {
    if (this.enemy === undefined) return "";
    const canvasHeight = this.renderer.domElement.clientHeight || this.renderer.domElement.height;
    if (canvasHeight <= 0) return "";
    this.camera.updateMatrixWorld();
    this.enemy.view.group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.enemy.view.group);
    const top = Math.min(
      ...[
        [bounds.min.x, bounds.min.y, bounds.min.z],
        [bounds.min.x, bounds.min.y, bounds.max.z],
        [bounds.min.x, bounds.max.y, bounds.min.z],
        [bounds.min.x, bounds.max.y, bounds.max.z],
        [bounds.max.x, bounds.min.y, bounds.min.z],
        [bounds.max.x, bounds.min.y, bounds.max.z],
        [bounds.max.x, bounds.max.y, bounds.min.z],
        [bounds.max.x, bounds.max.y, bounds.max.z],
      ].map(
        ([x, y, z]) => (1 - new THREE.Vector3(x, y, z).project(this.camera).y) * 0.5 * canvasHeight,
      ),
    );
    return top.toFixed(2);
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
