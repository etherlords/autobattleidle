import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { observeResourceDisposal, resourceCounts } from "./resource-ledger";
import { LabPlayerEvolution, PLAYER_EVOLUTION_FORMS, PLAYER_FORM_STARTS } from "./player-evolution";

describe("player evolution lab prototypes", () => {
  it("keeps every named progression form reachable, distinct, finite, socketed, and disposable", () => {
    expect(PLAYER_EVOLUTION_FORMS.map((form) => form.start)).toEqual(PLAYER_FORM_STARTS);
    const baseline = new THREE.Group();
    const baselineCounts = resourceCounts(baseline);
    const silhouettes: string[] = [];
    for (const form of PLAYER_EVOLUTION_FORMS) {
      const player = new LabPlayerEvolution(form.start, false);
      baseline.add(player.group);
      const receipt = observeResourceDisposal(player.group);
      const bounds = new THREE.Box3().setFromObject(player.group);
      expect(bounds.isEmpty()).toBe(false);
      expect(Number.isFinite(bounds.max.y)).toBe(true);
      expect(player.group.getObjectByName("lab-player-socket-attack")).toBeDefined();
      expect(player.group.getObjectByName("lab-player-socket-aura")).toBeDefined();
      const geometry = player.group.children[0]?.children
        .filter((node): node is THREE.Mesh => node instanceof THREE.Mesh)
        .map((node) => node.geometry.type)
        .join(",");
      if (geometry === undefined) throw new Error(`Missing silhouette for ${form.name}`);
      silhouettes.push(geometry);
      player.replay("hit");
      player.replay("attack");
      for (let frame = 0; frame < 12; frame += 1) player.tick();
      player.group.traverse((node) => {
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.rotation.y)).toBe(true);
        expect(Number.isFinite(node.scale.x)).toBe(true);
      });
      player.dispose();
      expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
    }
    expect(new Set(silhouettes).size).toBe(PLAYER_EVOLUTION_FORMS.length);
    expect(resourceCounts(baseline)).toEqual(baselineCounts);
  });

  it("honors reduced motion while retaining a visible authored form", () => {
    const player = new LabPlayerEvolution(10_000, true);
    const pose = player.group.getObjectByName("lab-player-pose");
    if (!(pose instanceof THREE.Group)) throw new Error("Missing player pose");
    const neutral = pose.position.clone();
    player.replay("hit");
    player.replay("attack");
    for (let frame = 0; frame < 12; frame += 1) player.tick();
    expect(pose.position).toEqual(neutral);
    expect(player.group.getObjectByName("lab-player-wing--1")).toBeDefined();
    player.dispose();
  });
});
