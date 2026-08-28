import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { createPlayerUnit } from "./player-unit";

describe("PlayerUnit", () => {
  it("uses the battlefield player configuration and owns its Three.js lifecycle", () => {
    const parent = new THREE.Group();
    const player = createPlayerUnit();
    const events: string[] = [];
    player.subscribe((event) => events.push(event.type));
    player.dispatch({ type: "attach", parent });

    const [core, platform] = player.view.group.getObjectByName("unit-layer-body")?.children ?? [];
    if (!(core instanceof THREE.Mesh) || !(platform instanceof THREE.Mesh))
      throw new Error("Expected player core and platform meshes");
    if (!(core.material instanceof THREE.MeshStandardMaterial))
      throw new Error("Expected core material");
    if (!(platform.material instanceof THREE.MeshStandardMaterial))
      throw new Error("Expected platform material");
    expect(player.view.group.position.toArray()).toEqual([...BATTLEFIELD_CONFIG.player.position]);
    expect(core.material.color.getStyle()).toBe("rgb(77,225,193)");
    expect(platform.material.color.getStyle()).toBe("rgb(36,95,102)");

    player.dispatch({ type: "sync", snapshot: { position: { x: -2, y: 1, z: 3 } } });
    expect(player.view.group.position.toArray()).toEqual([-2, 1, 3]);
    let geometryDisposals = 0;
    core.geometry.addEventListener("dispose", () => {
      geometryDisposals += 1;
    });
    player.dispose();
    player.dispose();
    expect(parent.children).toHaveLength(0);
    expect(geometryDisposals).toBe(1);
    expect(events).toEqual(["attached", "synced", "disposed"]);
  });
});
