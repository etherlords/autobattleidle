import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  createBattlefieldWithRenderer,
  effectEvictions,
  enemyVisualSpec,
  nextBattlefieldFrame,
} from "./battlefield";
import { cameraScaleForAspect } from "./battlefield/config";
import type { EnemyGrade } from "../domain/combat/contracts";
import type { BattleSnapshot } from "../domain/snapshot";

const snapshot = (grade: EnemyGrade, level: number, health = 10): BattleSnapshot => ({
  automatic: { intervalMs: 1_000, remainingMs: 0, unlocked: false },
  coins: 0,
  encounter: "Test",
  enemy: { grade, health, level, maxHealth: 10, modifier: null, name: "Test enemy" },
  events: [],
  upgrades: [],
});

describe("nextBattlefieldFrame", () => {
  it("keeps every grade and modifier recognizable without relying on color", () => {
    expect(enemyVisualSpec(snapshot("normal", 1).enemy).body).toBeDefined();
    expect(enemyVisualSpec(snapshot("veteran", 2).enemy).gradeCue).toBe("crest");
    expect(enemyVisualSpec(snapshot("elite", 3).enemy).gradeCue).toBe("spikes");
    expect(enemyVisualSpec(snapshot("boss", 10).enemy)).toMatchObject({
      gradeCue: "crown",
      scale: 1.45,
    });
    expect(enemyVisualSpec({ ...snapshot("elite", 3).enemy, modifier: "armor" }).modifierCue).toBe(
      "shield-plates",
    );
    expect(
      enemyVisualSpec({ ...snapshot("elite", 3).enemy, modifier: "automatic-slow" }).modifierCue,
    ).toBe("time-ring");
  });

  it("derives bounded visual effects from immutable snapshots", () => {
    const initial = snapshot("normal", 1);
    expect(nextBattlefieldFrame(undefined, initial).effects).toEqual(["spawn"]);
    expect(nextBattlefieldFrame(initial, snapshot("normal", 1, 8)).effects).toEqual(["hit"]);
    expect(nextBattlefieldFrame(initial, snapshot("boss", 10)).effects).toEqual([
      "spawn",
      "boss",
      "death",
    ]);
    expect(nextBattlefieldFrame(initial, snapshot("boss", 10)).effects).toEqual([
      "spawn",
      "boss",
      "death",
    ]);
    expect(effectEvictions(11, 3)).toBe(2);
  });

  it("disposes retired visuals and clears the scene through one renderer seam", () => {
    let scene: THREE.Scene | undefined;
    let camera: THREE.Camera | undefined;
    let rendererDisposals = 0;
    let canvasRemovals = 0;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: {
        className: "",
        remove: () => {
          canvasRemovals += 1;
        },
      } as unknown as HTMLCanvasElement,
      dispose: () => {
        rendererDisposals += 1;
      },
      render: (nextScene: THREE.Scene, nextCamera: THREE.Camera) => {
        scene = nextScene;
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    const initial = snapshot("normal", 1);
    battlefield.render(initial);
    if (scene === undefined || camera === undefined)
      throw new Error("Expected renderer scene and camera");
    const enemy = scene.children.find(
      (child) => child instanceof THREE.Group && child.position.x === 1.7,
    );
    const player = scene.children.find(
      (child) => child instanceof THREE.Group && child.position.x === -1.7,
    );
    const spawnEffect = scene.children.find(
      (child) => child instanceof THREE.Mesh && child.position.y === 0.04,
    );
    if (
      !(enemy instanceof THREE.Group) ||
      !(player instanceof THREE.Group) ||
      !(spawnEffect instanceof THREE.Mesh)
    )
      throw new Error("Expected unit roots and spawn effect");
    const bodyLayer = enemy.getObjectByName("enemy-layer-body");
    const enemyBody = bodyLayer?.children.find((child) => child instanceof THREE.Mesh);
    if (!(enemyBody instanceof THREE.Mesh)) throw new Error("Expected enemy body");
    const playerCore = player.getObjectByName("unit-layer-body")?.children[0];
    if (!(playerCore instanceof THREE.Mesh)) throw new Error("Expected player core");
    let enemyDisposals = 0;
    let playerDisposals = 0;
    let effectDisposals = 0;
    enemyBody.geometry.addEventListener("dispose", () => {
      enemyDisposals += 1;
    });
    playerCore.geometry.addEventListener("dispose", () => {
      playerDisposals += 1;
    });
    spawnEffect.geometry.addEventListener("dispose", () => {
      effectDisposals += 1;
    });

    battlefield.render(snapshot("boss", 10));
    expect(enemy.parent).toBeNull();
    for (let index = 0; index < 120; index += 1) {
      battlefield.render(snapshot(index % 2 === 0 ? "boss" : "elite", index + 10));
    }
    expect(enemyDisposals).toBe(1);
    expect(effectDisposals).toBe(1);
    expect(scene.children.includes(spawnEffect)).toBe(false);

    battlefield.dispose();
    battlefield.dispose();
    expect(scene.children).toHaveLength(0);
    expect(playerDisposals).toBe(1);
    expect(rendererDisposals).toBe(1);
    expect(canvasRemovals).toBe(1);
  });

  it("keeps the current enemy unit for health syncs and replaces it for identity changes", () => {
    let scene: THREE.Scene | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: { className: "", remove: () => undefined } as unknown as HTMLCanvasElement,
      dispose: () => undefined,
      render: (nextScene: THREE.Scene) => {
        scene = nextScene;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.render(snapshot("normal", 1));
    const original = scene?.children.find(
      (child) => child instanceof THREE.Group && child.position.x === 1.7,
    );
    if (!(original instanceof THREE.Group)) throw new Error("Expected initial enemy unit");

    battlefield.render(snapshot("normal", 1, 8));
    expect(original.parent).toBe(scene);
    battlefield.render(snapshot("elite", 2));
    expect(original.parent).toBeNull();
    battlefield.dispose();
  });

  it("widens static camera framing only for narrow viewports", () => {
    let camera: THREE.Camera | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: { className: "", remove: () => undefined } as unknown as HTMLCanvasElement,
      dispose: () => undefined,
      render: (_scene: THREE.Scene, nextCamera: THREE.Camera) => {
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.resize(390, 844);
    battlefield.render(snapshot("boss", 15));
    if (!(camera instanceof THREE.PerspectiveCamera))
      throw new Error("Expected perspective camera");
    expect(camera.position.z).toBeCloseTo(7 * cameraScaleForAspect(390 / 844));
    expect(camera.position.z).toBeGreaterThan(7);
    battlefield.resize(1_600, 900);
    battlefield.render(snapshot("boss", 15));
    expect(camera.position.z).toBe(7);
  });

  it("orbits bosses only and preserves the session azimuth across resize", () => {
    let camera: THREE.Camera | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: { className: "", remove: () => undefined } as unknown as HTMLCanvasElement,
      dispose: () => undefined,
      render: (_scene: THREE.Scene, nextCamera: THREE.Camera) => {
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.render(snapshot("normal", 1));
    battlefield.rotateCamera(1);
    if (!(camera instanceof THREE.PerspectiveCamera))
      throw new Error("Expected perspective camera");
    expect(camera.position.x).toBe(0);
    battlefield.render(snapshot("boss", 15));
    battlefield.rotateCamera(Math.PI / 2);
    expect(camera.position.x).toBeCloseTo(7);
    expect(camera.position.y).toBe(2);
    expect(camera.position.z).toBeCloseTo(0);
    expect(camera.fov).toBe(50);
    battlefield.rotateCamera(Number.NaN);
    battlefield.rotateCamera(Number.POSITIVE_INFINITY);
    expect(camera.position.x).toBeCloseTo(7);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.resize(390, 844);
    expect(camera.position.x).toBeCloseTo(7 * cameraScaleForAspect(390 / 844));
    expect(camera.position.y).toBeCloseTo(2 * cameraScaleForAspect(390 / 844));
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("normal", 1));
    battlefield.rotateCamera(Math.PI / 2);
    expect(camera.position.x).toBe(0);
    expect(camera.position.z).toBeCloseTo(7 * cameraScaleForAspect(390 / 844));
    battlefield.dispose();
  });
});
