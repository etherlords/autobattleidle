import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { playerEvolutionIdentity } from "../../game/units/player/evolution";
import { observeResourceDisposal, resourceCounts } from "./resource-ledger";
import {
  LabPlayerEvolution,
  MINOR_DETAIL_CADENCES,
  minorDetailStateCount,
  minorDetailStep,
  PLAYER_EVOLUTION_FORMS,
  PLAYER_DETAIL_TRANSITION,
  PLAYER_FORM_STARTS,
  PLAYER_LAB_LEVELS,
} from "./player-evolution";

describe("player evolution lab prototypes", () => {
  it("selects bounded 200-level minor details across one 1000-level transition", () => {
    expect(MINOR_DETAIL_CADENCES).toEqual([100, 200, 250]);
    expect(MINOR_DETAIL_CADENCES.map((cadence) => minorDetailStateCount(cadence))).toEqual([
      9, 4, 3,
    ]);
    expect(
      [1_000, 1_200, 1_400, 1_600, 1_800, 2_000].map((level) => minorDetailStep(level)),
    ).toEqual([0, 1, 2, 3, 4, 0]);
    expect(minorDetailStep(1_999)).toBe(4);
    const player = new LabPlayerEvolution(1_000, false, 1_800);
    const receipt = observeResourceDisposal(player.group);
    expect(player.group.getObjectByName("player-transition-detail-3")).toBeDefined();
    expect(player.group.getObjectByName("player-transition-detail-4")).toBeUndefined();
    player.dispose();
    expect(receipt()).toMatchObject({ disposed: receipt().expectedDisposals });
    const endpoint = new LabPlayerEvolution(1_000, false, 2_000);
    const endpointReceipt = observeResourceDisposal(endpoint.group);
    expect(endpoint.group.name).toBe(`player-form-${PLAYER_DETAIL_TRANSITION.target}`);
    expect(endpoint.group.getObjectByName("player-warden")).toBeDefined();
    expect(endpoint.group.getObjectByName("player-transition-detail-0")).toBeUndefined();
    endpoint.dispose();
    expect(endpointReceipt()).toMatchObject({ disposed: endpointReceipt().expectedDisposals });
  });

  it("reopens every exact milestone through the shared player selector", () => {
    for (const level of PLAYER_LAB_LEVELS) {
      const player = new LabPlayerEvolution(1, true, 1_000, level);
      expect(player.identity).toEqual(playerEvolutionIdentity(level));
      expect(player.group.getObjectByName("player-milestone-detail")).toBeDefined();
      player.dispose();
    }
  });
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
      expect(player.group.getObjectByName("player-socket-attack")).toBeDefined();
      expect(player.group.getObjectByName("player-socket-aura")).toBeDefined();
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
    const pose = player.group.getObjectByName("player-pose");
    if (!(pose instanceof THREE.Group)) throw new Error("Missing player pose");
    const neutral = pose.position.clone();
    player.replay("hit");
    player.replay("attack");
    for (let frame = 0; frame < 12; frame += 1) player.tick();
    expect(pose.position).toEqual(neutral);
    expect(player.group.getObjectByName("player-wing--1")).toBeDefined();
    player.dispose();
  });
});
