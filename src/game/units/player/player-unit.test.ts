import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { playerEvolutionIdentity } from "./evolution";
import { createPlayerUnit } from "./player-unit";

describe("PlayerUnit", () => {
  it("has one finite deterministic identity at every transition boundary", () => {
    expect([1_000, 1_200, 1_400, 1_600, 1_800, 2_000].map(playerEvolutionIdentity)).toEqual([
      { formStart: 1_000, detailCount: 0 },
      { formStart: 1_000, detailCount: 1 },
      { formStart: 1_000, detailCount: 2 },
      { formStart: 1_000, detailCount: 3 },
      { formStart: 1_000, detailCount: 4 },
      { formStart: 10_000, detailCount: 0 },
    ]);
    expect(playerEvolutionIdentity(1_000_000)).toEqual({ formStart: 36_365, detailCount: 0 });
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
