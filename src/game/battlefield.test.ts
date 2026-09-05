import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";

import {
  createBattlefieldWithRenderer,
  enemyAnimationForEffects,
  effectEvictions,
  enemyVisualSpec,
  nextBattlefieldFrame,
  type Battlefield,
} from "./battlefield";
import { BATTLEFIELD_CONFIG, cameraScaleForAspect } from "./battlefield/config";
import { enemyVisualAnimation } from "./enemy-visual/config";
import type { EliteModifier, EnemyGrade } from "../domain/combat/contracts";
import type { BattleSnapshot, BattleVisualCue } from "../domain/snapshot";

type TestVisualCue = BattleVisualCue | "armor" | "critical" | "hit";

const normalizedVisualCue = (cue: TestVisualCue): BattleVisualCue =>
  typeof cue === "string" && (cue === "armor" || cue === "critical" || cue === "hit")
    ? { kind: cue, packets: { count: 1, units: 1 }, source: "manual" }
    : cue;
const normalizedVisualCues = (cues: readonly TestVisualCue[]): readonly BattleVisualCue[] =>
  cues.map(normalizedVisualCue);

const snapshot = (
  grade: EnemyGrade,
  level: number,
  health = 10,
  visualCues: readonly TestVisualCue[] = [],
  modifier: EliteModifier | null = null,
  goldenBug = false,
): BattleSnapshot => ({
  automatic: { intervalMs: 1_000, remainingMs: 0, unlocked: false },
  coins: 0,
  encounter: "Test",
  enemy: {
    armor: { effective: 0, raw: 0 },
    grade,
    health,
    level,
    maxHealth: 10,
    modifier,
    name: "Test enemy",
    goldenBug,
  },
  events: [],
  visualCues: normalizedVisualCues(visualCues),
  playerStats: {
    armorPenetration: 0,
    automaticAttacksPerSecond: 0.1,
    criticalChance: 0,
    damage: 1,
    doubleRewardChance: 0,
  },
  upgrades: [],
});

const assertDesktopBossHudClearance = (
  battlefield: Battlefield,
  dataset: Record<string, string>,
  bossLevels: Iterable<number>,
): void => {
  // Production QA at 1280x800 measured `.hud-status.getBoundingClientRect().bottom` as 142.78125.
  const desktopHudStatusBottomPx = 142.78125;
  const desktopHudClearancePx = 6;
  const desktopBossTopMinimumPx = desktopHudStatusBottomPx + desktopHudClearancePx;
  battlefield.resize(1_280, 800);
  for (const level of bossLevels) {
    const sampledTops: number[] = [];
    battlefield.render(snapshot("boss", level));
    sampledTops.push(Number(dataset.enemyTopPx));
    let currentAzimuth = 0;
    for (const azimuth of [Math.PI / 2, Math.PI]) {
      battlefield.rotateCamera(azimuth - currentAzimuth);
      currentAzimuth = azimuth;
      sampledTops.push(Number(dataset.enemyTopPx));
    }
    battlefield.rotateCamera(-currentAzimuth);
    battlefield.render(snapshot("boss", level, 10, ["hit"]));
    battlefield.render(snapshot("boss", level));
    sampledTops.push(Number(dataset.enemyTopPx));
    battlefield.render(snapshot("boss", level));
    sampledTops.push(Number(dataset.enemyTopPx));
    sampledTops.forEach((top) =>
      expect(
        top,
        `${enemyVisualSpec(snapshot("boss", level).enemy).body} level ${level}`,
      ).toBeGreaterThanOrEqual(desktopBossTopMinimumPx),
    );
  }
};

describe("nextBattlefieldFrame", () => {
  it("freezes every ordinary family, profile, grade, modifier, and Golden Bug framing", () => {
    let camera: THREE.Camera | undefined;
    let scene: THREE.Scene | undefined;
    const dataset: Record<string, string> = {};
    const host = { append: () => undefined } as unknown as HTMLElement;
    const canvas = {
      className: "",
      dataset,
      height: 800,
      remove: () => undefined,
      width: 1_280,
    } as unknown as HTMLCanvasElement;
    const renderer = {
      domElement: canvas,
      dispose: () => undefined,
      render: (nextScene: THREE.Scene, nextCamera: THREE.Camera) => {
        scene = nextScene;
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.resize(1_280, 800);
    const modifiers: readonly (EliteModifier | null)[] = [
      null,
      "armor",
      "health",
      "automatic-slow",
      "hardened",
      "critical-guard",
      "manual-guard",
    ];
    const compositions = new Map<string, BattleSnapshot>();
    for (const grade of ["normal", "veteran", "elite"] as const) {
      for (let level = 1; level <= 180; level += 1) {
        for (const modifier of modifiers) {
          const candidate = snapshot(grade, level, 10, [], modifier);
          const visual = enemyVisualSpec(candidate.enemy);
          compositions.set(
            `${visual.body}:${visual.profile.variant}:${grade}:${modifier ?? "none"}:ordinary`,
            candidate,
          );
        }
        const golden = snapshot(grade, level, 10, [], null, true);
        const goldenVisual = enemyVisualSpec(golden.enemy);
        compositions.set(
          `${goldenVisual.body}:${goldenVisual.profile.variant}:${grade}:golden`,
          golden,
        );
      }
    }
    const ordinary = [...compositions.values()].filter(
      (candidate) => !enemyVisualSpec(candidate.enemy).body.startsWith("boss-"),
    );
    expect(new Set(ordinary.map((candidate) => enemyVisualSpec(candidate.enemy).body))).toEqual(
      new Set(["beetle", "brute", "wisp", "mantis", "sentinel", "drake"]),
    );
    for (const candidate of ordinary) {
      const { body } = enemyVisualSpec(candidate.enemy);
      battlefield.render(candidate);
      if (!(camera instanceof THREE.PerspectiveCamera) || scene === undefined)
        throw new Error("Expected captured scene and camera");
      const capturedCamera = camera;
      const pose = scene.getObjectByName(`enemy-pose-${body}`);
      const socket = scene.getObjectByName(`enemy-socket-${body}-overhead`);
      if (pose === undefined || socket === undefined)
        throw new Error("Expected animated pose and socket");
      const cameraTransform = {
        position: capturedCamera.position.toArray(),
        projection: capturedCamera.projectionMatrix.toArray(),
        quaternion: capturedCamera.quaternion.toArray(),
      };
      const animationSamples: string[] = [];
      for (const visualCues of [[], ["hit"], [], ["critical"], []] as const) {
        battlefield.render({ ...candidate, visualCues: normalizedVisualCues(visualCues) });
        expect(capturedCamera.position.toArray()).toEqual(cameraTransform.position);
        expect(capturedCamera.quaternion.toArray()).toEqual(cameraTransform.quaternion);
        expect(capturedCamera.projectionMatrix.toArray()).toEqual(cameraTransform.projection);
        pose.updateMatrixWorld(true);
        socket.updateMatrixWorld(true);
        animationSamples.push(
          [...pose.matrixWorld.elements, ...socket.matrixWorld.elements]
            .map((value) => value.toFixed(6))
            .join(","),
        );
      }
      expect(new Set(animationSamples).size).toBeGreaterThan(1);
    }
    battlefield.dispose();
  });

  it("keeps every ordinary composed profile below the HUD safe area", () => {
    const dataset: Record<string, string> = {};
    const host = { append: () => undefined } as unknown as HTMLElement;
    const canvas = {
      className: "",
      dataset,
      height: 800,
      remove: () => undefined,
      width: 1_280,
    } as unknown as HTMLCanvasElement;
    const renderer = {
      domElement: canvas,
      dispose: () => undefined,
      render: () => undefined,
      setPixelRatio: () => undefined,
      setSize: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    const modifiers: readonly (EliteModifier | null)[] = [
      null,
      "armor",
      "health",
      "automatic-slow",
      "hardened",
      "critical-guard",
      "manual-guard",
    ];
    const compositions = new Map<string, BattleSnapshot>();
    for (const grade of ["normal", "veteran", "elite"] as const) {
      for (let level = 1; level <= 180; level += 1) {
        for (const modifier of modifiers) {
          const candidate = snapshot(grade, level, 10, [], modifier);
          const visual = enemyVisualSpec(candidate.enemy);
          compositions.set(
            `${visual.body}:${visual.profile.variant}:${grade}:${modifier ?? "none"}`,
            candidate,
          );
        }
        const golden = snapshot(grade, level, 10, [], null, true);
        const goldenVisual = enemyVisualSpec(golden.enemy);
        compositions.set(
          `${goldenVisual.body}:${goldenVisual.profile.variant}:${grade}:golden`,
          golden,
        );
      }
    }
    expect(
      new Set([...compositions.values()].map((entry) => enemyVisualSpec(entry.enemy).body)).size,
    ).toBe(6);
    for (const [width, height] of [
      [1_280, 800],
      [390, 844],
    ] as const) {
      battlefield.resize(width, height);
      const minimumTop = height * BATTLEFIELD_CONFIG.camera.ordinaryHudSafeTopRatio;
      for (const candidate of compositions.values()) {
        for (const cues of [[], ["hit"], ["critical"]] as const) {
          battlefield.render({ ...candidate, visualCues: normalizedVisualCues(cues) });
          expect(Number(dataset.enemyTopPx)).toBeGreaterThanOrEqual(minimumTop);
        }
      }
    }
    battlefield.dispose();
  });

  it("publishes finite composed boss top pixels across production framing", () => {
    const dataset: Record<string, string> = {};
    let scene: THREE.Scene | undefined;
    let camera: THREE.Camera | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const canvas = {
      className: "",
      dataset,
      height: 800,
      remove: () => undefined,
      width: 1_280,
    } as unknown as HTMLCanvasElement;
    const renderer = {
      domElement: canvas,
      dispose: () => undefined,
      render: (nextScene: THREE.Scene, nextCamera: THREE.Camera) => {
        scene = nextScene;
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    const profiles = new Map<string, number>();
    for (let level = 1; level <= 180; level += 1) {
      const spec = enemyVisualSpec(snapshot("boss", level).enemy);
      profiles.set(`${spec.body}:${spec.profile.variant}`, level);
    }
    expect(profiles.size).toBe(15);
    for (const size of [
      [1280, 800],
      [390, 844],
    ] as const) {
      const [width, height] = size;
      battlefield.resize(width, height);
      expect(canvas.width).toBe(width);
      expect(canvas.height).toBe(height);
      for (const level of profiles.values()) {
        battlefield.render(snapshot("boss", level));
        let currentAzimuth = 0;
        for (const azimuth of [0, Math.PI / 2, Math.PI]) {
          battlefield.rotateCamera(azimuth - currentAzimuth);
          currentAzimuth = azimuth;
          const receipt = dataset.enemyTopPx;
          const enemy = scene?.children.find(
            (node) => node instanceof THREE.Group && node.position.x === 1.7,
          );
          if (!(enemy instanceof THREE.Group) || camera === undefined)
            throw new Error("Expected captured boss scene and camera");
          const capturedCamera = camera;
          capturedCamera.updateMatrixWorld();
          enemy.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(enemy);
          const expected = Math.min(
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
              ([x, y, z]) =>
                ((1 - new THREE.Vector3(x, y, z).project(capturedCamera).y) * height) / 2,
            ),
          );
          expect(receipt).toBe(expected.toFixed(2));
          const top = Number(receipt);
          expect(Number.isFinite(top)).toBe(true);
          expect(top).toBeCloseTo(expected, 2);
          expect(top).toBeGreaterThanOrEqual(0);
          expect(top).toBeLessThan(height);
        }
        battlefield.rotateCamera(-currentAzimuth);
      }
    }
    assertDesktopBossHudClearance(battlefield, dataset, profiles.values());
    const hydraLevels = [...profiles.entries()]
      .filter(([key]) => key.startsWith("boss-hydra:"))
      .map(([, level]) => level);
    const colossusLevel = [...profiles.entries()].find(([key]) =>
      key.startsWith("boss-colossus:"),
    )?.[1];
    const [hydraLevel, alternateHydraLevel] = hydraLevels;
    if (
      hydraLevel === undefined ||
      alternateHydraLevel === undefined ||
      colossusLevel === undefined
    ) {
      throw new Error("Expected multiple Hydra profiles and a Colossus profile");
    }
    battlefield.render(snapshot("boss", hydraLevel));
    const hydraTop = dataset.enemyTopPx;
    battlefield.rotateCamera(Math.PI / 2);
    const rotatedHydraTop = dataset.enemyTopPx;
    expect(Number(rotatedHydraTop)).not.toBeCloseTo(Number(hydraTop), 2);
    battlefield.rotateCamera(-Math.PI / 2);
    battlefield.render(snapshot("boss", alternateHydraLevel));
    expect(dataset.enemyFamily).toBe("boss-hydra");
    expect(dataset.enemyTopPx).not.toBe(hydraTop);
    battlefield.render(snapshot("boss", colossusLevel));
    expect(dataset.enemyFamily).toBe("boss-colossus");
    expect(dataset.enemyTopPx).not.toBe(hydraTop);
    battlefield.dispose();
    expect(dataset.enemyTopPx).toBeUndefined();
  });
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
    expect(nextBattlefieldFrame(initial, snapshot("normal", 1, 8)).effects).toEqual([]);
    expect(
      nextBattlefieldFrame(initial, snapshot("boss", 10, 10, ["death", "coin", "boss"])).effects,
    ).toEqual(["death", "coin", "boss"]);
    expect(nextBattlefieldFrame(initial, snapshot("boss", 10)).effects).toEqual([]);
    expect(effectEvictions(11, 3)).toBe(2);
  });

  it("restores enemy hit animation only from immutable combat cues", () => {
    const manual = { packets: { count: 1, units: 1 }, source: "manual" } as const;
    expect(enemyAnimationForEffects([{ kind: "hit", ...manual }])).toBe("hit");
    expect(enemyAnimationForEffects([{ kind: "armor", ...manual }])).toBe("hit");
    expect(
      enemyAnimationForEffects([
        { kind: "critical", ...manual },
        { kind: "armor", ...manual },
      ]),
    ).toBe("critical");
    expect(enemyAnimationForEffects(["death", "coin"])).toBeNull();
  });

  it("publishes bounded read-only rendered identity and effect receipts", () => {
    const dataset: Record<string, string> = {};
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: {
        className: "",
        dataset,
        remove: () => undefined,
      } as unknown as HTMLCanvasElement,
      dispose: () => undefined,
      render: () => undefined,
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.render(snapshot("normal", 1));
    expect(dataset).toMatchObject({
      activeEffectCount: "1",
      enemyFamily: "brute",
      enemyGrade: "normal",
      enemyModifier: "none",
      goldenBug: "false",
      lastEffectKinds: "spawn",
    });
    battlefield.render(snapshot("normal", 1, 9, ["hit", "armor"]));
    expect(dataset).toMatchObject({
      activeEffectCount: "3",
      lastEffectKinds: "hit,armor",
    });
    battlefield.dispose();
    expect(dataset).toEqual({});
  });

  it("routes manual and automatic impact cues to player attack without player recoil", () => {
    for (const source of ["manual", "automatic"] as const) {
      let scene: THREE.Scene | undefined;
      const host = { append: () => undefined } as unknown as HTMLElement;
      const renderer = {
        domElement: {
          className: "",
          dataset: {},
          remove: () => undefined,
        } as unknown as HTMLCanvasElement,
        dispose: () => undefined,
        render: (nextScene: THREE.Scene) => {
          scene = nextScene;
        },
        setPixelRatio: () => undefined,
        setSize: () => undefined,
      };
      const battlefield = createBattlefieldWithRenderer(host, renderer);
      battlefield.render(snapshot("normal", 1));
      const impact = {
        kind: "hit",
        packets: { count: source === "automatic" ? 3 : 1, units: 1 },
        source,
      } as const;
      battlefield.render({
        ...snapshot("normal", 1, 9, [impact]),
        playerStats: {
          ...snapshot("normal", 1).playerStats,
          automaticAttacksPerSecond: source === "automatic" ? 11 : 1,
        },
      });
      battlefield.render(snapshot("normal", 1));
      battlefield.render(snapshot("normal", 1));
      battlefield.render(snapshot("normal", 1));
      const pose = scene?.getObjectByName("player-pose");
      if (!(pose instanceof THREE.Group)) throw new Error("Expected production player pose");
      expect(pose.rotation.x).toBeGreaterThan(0);
      expect(pose.scale.x).toBe(1);
      battlefield.dispose();
    }
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
        dataset: {},
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
      (child) => child instanceof THREE.Mesh && child.position.y > 0.5,
    );
    if (
      !(enemy instanceof THREE.Group) ||
      !(player instanceof THREE.Group) ||
      !(spawnEffect instanceof THREE.Mesh)
    )
      throw new Error("Expected unit roots and spawn effect");
    const enemyBody = enemy.getObjectByName("enemy-body-brute");
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
      domElement: {
        className: "",
        dataset: {},
        remove: () => undefined,
      } as unknown as HTMLCanvasElement,
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

  it("orders lethal impact, pause, death, and replacement without duplicating the unit", () => {
    for (const reducedMotion of [false, true]) {
      if (reducedMotion) vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
      for (const impact of ["hit", "critical"] as const) {
        let scene: THREE.Scene | undefined;
        const host = { append: () => undefined } as unknown as HTMLElement;
        const renderer = {
          domElement: {
            className: "",
            dataset: {},
            remove: () => undefined,
          } as unknown as HTMLCanvasElement,
          dispose: () => undefined,
          render: (nextScene: THREE.Scene) => {
            scene = nextScene;
          },
          setPixelRatio: () => undefined,
          setSize: () => undefined,
        };
        const battlefield = createBattlefieldWithRenderer(host, renderer);
        const initial = snapshot("normal", 1);
        const nonlethal = snapshot("normal", 1, 9, ["hit"]);
        const replacement = snapshot("normal", 2);
        battlefield.render(initial);
        const original = scene?.children.find(
          (child) => child instanceof THREE.Group && child.position.x === 1.7,
        );
        if (!(original instanceof THREE.Group)) throw new Error("Expected initial enemy unit");
        const body = original.getObjectByName("enemy-body-brute");
        if (!(body instanceof THREE.Mesh)) throw new Error("Expected initial enemy body");

        battlefield.render(nonlethal);
        expect(original.parent).toBe(scene);
        expect(body.userData.lastCommand).toBe("hit");

        battlefield.render({
          ...replacement,
          visualCues: [normalizedVisualCue(impact), "death", "coin"],
        });
        expect(original.parent).toBe(scene);
        expect(body.userData.lastCommand).toBe(impact);

        for (let index = 0; index < enemyVisualAnimation.commandFrames[impact]; index += 1)
          battlefield.render(replacement);
        expect(original.parent).toBe(scene);
        expect(body.userData.lastCommand).toBe(impact);

        expect(enemyVisualAnimation.lethalPauseFrames).toBe(6);
        for (let index = 0; index < enemyVisualAnimation.lethalPauseFrames; index += 1) {
          battlefield.render(replacement);
          expect(body.userData.lastCommand).toBe(impact);
        }
        battlefield.render(replacement);
        expect(original.parent).toBe(scene);
        expect(body.userData.lastCommand).toBe("death");

        for (let index = 0; index < enemyVisualAnimation.commandFrames.death; index += 1)
          battlefield.render(replacement);
        expect(original.parent).toBeNull();
        expect(
          scene?.children.filter(
            (child) => child instanceof THREE.Group && child.position.x === 1.7,
          ),
        ).toHaveLength(1);

        battlefield.render(replacement);
        expect(
          scene?.children.filter(
            (child) => child instanceof THREE.Group && child.position.x === 1.7,
          ),
        ).toHaveLength(1);
        battlefield.dispose();
      }
      vi.unstubAllGlobals();
    }
  });

  it("keeps the displayed boss and its camera receipt through a lethal sequence", () => {
    let camera: THREE.Camera | undefined;
    let scene: THREE.Scene | undefined;
    const dataset: Record<string, string> = {};
    const host = { append: () => undefined } as unknown as HTMLElement;
    const canvas = {
      className: "",
      dataset,
      height: 800,
      remove: () => undefined,
      width: 1_280,
    } as unknown as HTMLCanvasElement;
    const renderer = {
      domElement: canvas,
      dispose: () => undefined,
      render: (nextScene: THREE.Scene, nextCamera: THREE.Camera) => {
        scene = nextScene;
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
      },
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    const boss = snapshot("boss", 35);
    const replacement = snapshot("normal", 36);
    battlefield.resize(1_280, 800);
    battlefield.render(boss);
    battlefield.rotateCamera(Math.PI / 2);
    if (!(camera instanceof THREE.PerspectiveCamera) || scene === undefined)
      throw new Error("Expected rendered boss camera and scene");
    const original = scene.children.find(
      (child) => child instanceof THREE.Group && child.position.x === 1.7,
    );
    if (!(original instanceof THREE.Group)) throw new Error("Expected displayed boss unit");
    const family = dataset.enemyFamily;
    const body = original.getObjectByName(`enemy-body-${family}`);
    if (!(body instanceof THREE.Mesh)) throw new Error("Expected displayed boss body");
    const cameraTransform = {
      position: camera.position.toArray(),
      quaternion: camera.quaternion.toArray(),
    };
    const assertBossPresentation = (): void => {
      expect(original.parent).toBe(scene);
      expect(dataset.enemyFamily).toBe(family);
      expect(dataset.enemyGrade).toBe("boss");
      expect(Number.isFinite(Number(dataset.enemyTopPx))).toBe(true);
      expect(camera?.position.toArray()).toEqual(cameraTransform.position);
      expect(camera?.quaternion.toArray()).toEqual(cameraTransform.quaternion);
    };

    battlefield.render({
      ...replacement,
      visualCues: [normalizedVisualCue("critical"), "death", "coin", "boss"],
    });
    expect(body.userData.lastCommand).toBe("critical");
    assertBossPresentation();

    for (let index = 0; index < enemyVisualAnimation.commandFrames.critical; index += 1) {
      battlefield.render(replacement);
      assertBossPresentation();
    }
    expect(enemyVisualAnimation.lethalPauseFrames).toBe(6);
    for (let index = 0; index < enemyVisualAnimation.lethalPauseFrames; index += 1) {
      battlefield.render(replacement);
      expect(body.userData.lastCommand).toBe("critical");
      assertBossPresentation();
    }
    battlefield.render(replacement);
    expect(body.userData.lastCommand).toBe("death");
    assertBossPresentation();

    for (let index = 0; index < enemyVisualAnimation.commandFrames.death; index += 1) {
      battlefield.render(replacement);
      if (index + 1 < enemyVisualAnimation.commandFrames.death) assertBossPresentation();
    }
    expect(original.parent).toBeNull();
    expect(dataset.enemyGrade).toBe("normal");
    expect(
      scene.children.filter((child) => child instanceof THREE.Group && child.position.x === 1.7),
    ).toHaveLength(1);
    battlefield.render(snapshot("normal", 51, 10, [], null, true));
    expect(camera.position.x).toBeGreaterThanOrEqual(7);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("boss", 70));
    expect(camera.position.x).toBeCloseTo(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.dispose();
  });

  it("widens static camera framing only for narrow viewports", () => {
    let camera: THREE.Camera | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: {
        className: "",
        dataset: {},
        remove: () => undefined,
      } as unknown as HTMLCanvasElement,
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
    expect(camera.position.z).toBeCloseTo(
      7 * cameraScaleForAspect(390 / 844) * BATTLEFIELD_CONFIG.camera.bossFramingScale,
    );
    expect(camera.position.z).toBeGreaterThan(7);
    battlefield.resize(1_600, 900);
    battlefield.render(snapshot("boss", 15));
    expect(camera.position.z).toBe(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
  });

  it("orbits every enemy and preserves azimuth across replacements, hits, and resize", () => {
    let camera: THREE.Camera | undefined;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: {
        className: "",
        dataset: {},
        remove: () => undefined,
      } as unknown as HTMLCanvasElement,
      dispose: () => undefined,
      render: (_scene: THREE.Scene, nextCamera: THREE.Camera) => {
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.render(snapshot("normal", 1));
    battlefield.rotateCamera(Math.PI / 2);
    if (!(camera instanceof THREE.PerspectiveCamera))
      throw new Error("Expected perspective camera");
    expect(camera.position.x).toBeGreaterThanOrEqual(7);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("veteran", 2));
    expect(camera.position.x).toBeGreaterThanOrEqual(7);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("boss", 35));
    expect(camera.position.x).toBeCloseTo(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.y).toBe(2 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.z).toBeCloseTo(0);
    expect(camera.fov).toBe(50);
    battlefield.render(snapshot("boss", 35, 9, ["hit"]));
    expect(camera.position.x).toBeCloseTo(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("boss", 70));
    expect(camera.position.x).toBeCloseTo(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.rotateCamera(Number.NaN);
    battlefield.rotateCamera(Number.POSITIVE_INFINITY);
    expect(camera.position.x).toBeCloseTo(7 * BATTLEFIELD_CONFIG.camera.bossFramingScale);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.resize(390, 844);
    expect(camera.position.x).toBeCloseTo(
      7 * cameraScaleForAspect(390 / 844) * BATTLEFIELD_CONFIG.camera.bossFramingScale,
    );
    expect(camera.position.y).toBeCloseTo(
      2 * cameraScaleForAspect(390 / 844) * BATTLEFIELD_CONFIG.camera.bossFramingScale,
    );
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("normal", 36));
    expect(camera.position.x).toBeGreaterThanOrEqual(7 * cameraScaleForAspect(390 / 844));
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.render(snapshot("normal", 51, 10, [], null, true));
    expect(camera.position.x).toBeGreaterThanOrEqual(7 * cameraScaleForAspect(390 / 844));
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.rotateCamera(-Math.PI / 4);
    expect(camera.position.x).toBeGreaterThan(0);
    expect(camera.position.z).toBeGreaterThan(0);
    battlefield.render(snapshot("boss", 105));
    const bossDistance =
      7 * cameraScaleForAspect(390 / 844) * BATTLEFIELD_CONFIG.camera.bossFramingScale;
    expect(camera.position.x).toBeCloseTo(bossDistance / Math.SQRT2);
    expect(camera.position.z).toBeCloseTo(bossDistance / Math.SQRT2);
    battlefield.rotateCamera(Math.PI / 4);
    expect(camera.position.x).toBeCloseTo(bossDistance);
    expect(camera.position.z).toBeCloseTo(0);
    battlefield.resetCamera();
    expect(camera.position.x).toBe(0);
    expect(camera.position.z).toBeCloseTo(bossDistance);
    battlefield.dispose();
  });
  it("applies bounded wheel zoom to the game camera without changing visual-lab controls", () => {
    let camera: THREE.Camera | undefined;
    let wheel: ((event: WheelEvent) => void) | undefined;
    const canvas = {
      className: "",
      dataset: {},
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        wheel = listener as (event: WheelEvent) => void;
      },
      removeEventListener: vi.fn(),
      remove: () => undefined,
      width: 1_280,
      height: 800,
    } as unknown as HTMLCanvasElement;
    const host = { append: () => undefined } as unknown as HTMLElement;
    const renderer = {
      domElement: canvas,
      dispose: () => undefined,
      render: (_scene: THREE.Scene, nextCamera: THREE.Camera) => {
        camera = nextCamera;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    battlefield.resize(1_280, 800);
    battlefield.render(snapshot("boss", 35));
    if (!(camera instanceof THREE.PerspectiveCamera) || wheel === undefined)
      throw new Error("Expected game camera and wheel listener");
    const initialDistance = camera.position.length();
    const preventDefault = vi.fn();
    wheel({ deltaY: -1, preventDefault } as unknown as WheelEvent);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(camera.position.length()).toBeLessThan(initialDistance);
    for (let index = 0; index < 30; index += 1)
      wheel({ deltaY: -1, preventDefault: vi.fn() } as unknown as WheelEvent);
    const minimumDistance = camera.position.length();
    wheel({ deltaY: -1, preventDefault: vi.fn() } as unknown as WheelEvent);
    expect(camera.position.length()).toBe(minimumDistance);
    for (let index = 0; index < 60; index += 1)
      wheel({ deltaY: 1, preventDefault: vi.fn() } as unknown as WheelEvent);
    expect(camera.position.length()).toBeGreaterThan(minimumDistance);
    battlefield.dispose();
    expect(canvas.removeEventListener).toHaveBeenCalledWith("wheel", expect.any(Function));
  });
});
