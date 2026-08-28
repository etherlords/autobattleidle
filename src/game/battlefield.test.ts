import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  createBattlefieldWithRenderer,
  effectEvictions,
  enemyVisualSpec,
  nextBattlefieldFrame,
} from "./battlefield";
import type { BattleSnapshot } from "../domain/snapshot";

const snapshot = (
  grade: BattleSnapshot["enemy"]["grade"],
  level: number,
  health = 10,
): BattleSnapshot => ({
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
      render: (nextScene: THREE.Scene) => {
        scene = nextScene;
      },
      setPixelRatio: () => undefined,
      setSize: () => undefined,
    };
    const battlefield = createBattlefieldWithRenderer(host, renderer);
    const initial = snapshot("normal", 1);
    battlefield.render(initial);
    if (scene === undefined) throw new Error("Expected renderer scene");
    const enemy = scene.children.find(
      (child) => child instanceof THREE.Group && child.position.x === 1.7,
    );
    const spawnEffect = scene.children.find(
      (child) => child instanceof THREE.Mesh && child.position.y === 0.04,
    );
    if (!(enemy instanceof THREE.Group) || !(spawnEffect instanceof THREE.Mesh))
      throw new Error("Expected enemy and spawn effect");
    const enemyBody = enemy.children[0];
    if (!(enemyBody instanceof THREE.Mesh)) throw new Error("Expected enemy body");
    let enemyDisposals = 0;
    let effectDisposals = 0;
    enemyBody.geometry.addEventListener("dispose", () => {
      enemyDisposals += 1;
    });
    spawnEffect.geometry.addEventListener("dispose", () => {
      effectDisposals += 1;
    });

    battlefield.render(snapshot("boss", 10));
    for (let index = 0; index < 120; index += 1) {
      battlefield.render(snapshot(index % 2 === 0 ? "boss" : "elite", index + 10));
    }
    expect(enemyDisposals).toBe(1);
    expect(effectDisposals).toBe(1);
    expect(scene.children.includes(spawnEffect)).toBe(false);

    battlefield.dispose();
    battlefield.dispose();
    expect(scene.children).toHaveLength(0);
    expect(rendererDisposals).toBe(1);
    expect(canvasRemovals).toBe(1);
  });
});
