import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { PLAYER_MILESTONE_LEVELS, PlayerEvolution, playerEvolutionIdentity } from "./evolution";
import { createPlayerUnit } from "./player-unit";

describe("PlayerUnit", () => {
  it("has one finite deterministic identity at every transition boundary", () => {
    expect([1_000, 1_200, 1_400, 1_600, 1_800, 2_000].map(playerEvolutionIdentity)).toEqual([
      { formStart: 1_000, detailCount: 0, milestoneLevel: 1_000 },
      { formStart: 1_000, detailCount: 1, milestoneLevel: 1_000 },
      { formStart: 1_000, detailCount: 2, milestoneLevel: 1_000 },
      { formStart: 1_000, detailCount: 3, milestoneLevel: 1_000 },
      { formStart: 1_000, detailCount: 4, milestoneLevel: 1_000 },
      { formStart: 10_000, detailCount: 0, milestoneLevel: 2_000 },
    ]);
    expect(playerEvolutionIdentity(1_000_000)).toEqual({
      formStart: 36_365,
      detailCount: 0,
      milestoneLevel: 100_000,
    });
  });

  it("maps every bounded cadence boundary to its nearest milestone", () => {
    const samples = new Map([
      [99, 1],
      [100, 100],
      [999, 900],
      [1_000, 1_000],
      [1_999, 1_000],
      [2_000, 2_000],
      [9_999, 9_000],
      [10_000, 10_000],
      [11_999, 10_000],
      [12_000, 12_000],
      [49_999, 48_000],
      [50_000, 50_000],
      [99_999, 95_000],
      [100_000, 100_000],
      [100_001, 100_000],
      [Infinity, 100_000],
      [Number.NaN, 1],
      [-Infinity, 1],
    ]);
    for (const [level, milestoneLevel] of samples) {
      expect(playerEvolutionIdentity(level).milestoneLevel).toBe(milestoneLevel);
    }
    expect(PLAYER_MILESTONE_LEVELS.length).toBeGreaterThan(40);
  });

  it("gives adjacent milestones distinct authored badge signatures", () => {
    const signatures = PLAYER_MILESTONE_LEVELS.map((level) => {
      const evolution = new PlayerEvolution(playerEvolutionIdentity(level), true);
      const marker = evolution.group.getObjectByName("player-milestone-detail");
      const socket = evolution.group.getObjectByName("player-socket-milestone");
      if (!(marker instanceof THREE.Group) || !(socket instanceof THREE.Object3D))
        throw new Error("Expected milestone badge and socket");
      expect(marker.parent).toBe(socket);
      expect(marker.position.toArray()).toEqual([0, 0, 0]);
      expect(socket.position.toArray()).toEqual([0, 1.55, 0]);
      expect(marker.userData.milestoneLevel).toBe(level);
      expect(marker.userData.milestoneIndex).toBe(PLAYER_MILESTONE_LEVELS.indexOf(level));
      expect(["orb", "nested", "crest"]).toContain(marker.userData.milestoneTier);
      if (marker.userData.milestoneTier === "nested") {
        expect(
          marker.getObjectByName("player-milestone-nested-ring")?.rotation.toArray().slice(0, 3),
        ).toEqual([0, 0, 0]);
        expect(
          marker
            .getObjectByName("player-milestone-nested-inner-ring")
            ?.rotation.toArray()
            .slice(0, 3),
        ).toEqual([0, Math.PI / 2, 0]);
        expect(
          marker
            .getObjectByName("player-milestone-nested-depth-ring")
            ?.rotation.toArray()
            .slice(0, 3),
        ).toEqual([Math.PI / 2, 0, 0]);
      }
      const bounds = new THREE.Box3().setFromObject(marker);
      expect(bounds.isEmpty()).toBe(false);
      expect(bounds.max.x - bounds.min.x).toBeLessThan(0.7);
      expect(bounds.max.y - bounds.min.y).toBeLessThan(0.7);
      const signature = [
        marker.userData.milestoneSignature,
        ...marker.children.map((child) => {
          if (!(child instanceof THREE.Mesh)) throw new Error("Expected badge child mesh");
          return [
            child.name,
            child.geometry.type,
            JSON.stringify(child.geometry.parameters),
            child.material instanceof THREE.MeshStandardMaterial
              ? child.material.color.getHexString()
              : "",
          ].join(":");
        }),
      ].join("|");
      evolution.dispose();
      return signature;
    });
    for (let index = 1; index < signatures.length; index += 1)
      expect(signatures[index]).not.toBe(signatures[index - 1]);

    const first = new PlayerEvolution(playerEvolutionIdentity(10_000), true);
    const second = new PlayerEvolution(playerEvolutionIdentity(10_000), true);
    expect(first.group.getObjectByName("player-milestone-detail")?.userData).toEqual(
      second.group.getObjectByName("player-milestone-detail")?.userData,
    );
    first.dispose();
    second.dispose();
  });

  it("derives bounded forms from level while owning sockets and replaced resources", () => {
    const parent = new THREE.Group();
    const player = createPlayerUnit();
    const events: string[] = [];
    player.subscribe((event) => events.push(event.type));
    player.dispatch({ type: "attach", parent });

    const [platform] = player.view.group.getObjectByName("unit-layer-body")?.children ?? [];
    if (
      !(platform instanceof THREE.Mesh) ||
      !(platform.material instanceof THREE.MeshStandardMaterial)
    )
      throw new Error("Expected platform material");
    expect(player.view.group.position.toArray()).toEqual([...BATTLEFIELD_CONFIG.player.position]);
    expect(platform.material.color.getStyle()).toBe("rgb(36,95,102)");

    player.dispatch({ type: "sync", snapshot: { level: 1_800, position: { x: -2, y: 1, z: 3 } } });
    expect(player.view.group.position.toArray()).toEqual([-2, 1, 3]);
    expect(player.playerView.playerEvolutionReceipt()).toEqual(playerEvolutionIdentity(1_800));
    expect(player.view.group.getObjectByName("player-transition-detail-3")).toBeDefined();
    expect(player.view.group.getObjectByName("player-socket-attack")).toBeDefined();
    expect(player.view.group.getObjectByName("player-socket-aura")).toBeDefined();
    const diamond = player.view.group.getObjectByName("player-diamond");
    if (!(diamond instanceof THREE.Mesh)) throw new Error("Expected transition form mesh");
    let geometryDisposals = 0;
    diamond.geometry.addEventListener("dispose", () => {
      geometryDisposals += 1;
    });
    player.dispatch({ type: "sync", snapshot: { level: 2_000, position: { x: -2, y: 1, z: 3 } } });
    expect(geometryDisposals).toBe(1);
    expect(player.playerView.playerEvolutionReceipt()).toEqual(playerEvolutionIdentity(2_000));
    expect(player.view.group.getObjectByName("player-warden")).toBeDefined();
    player.dispose();
    player.dispose();
    expect(parent.children).toHaveLength(0);
    expect(geometryDisposals).toBe(1);
    expect(events).toEqual(["attached", "synced", "synced", "disposed"]);
  });
});
