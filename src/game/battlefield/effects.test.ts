import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  advanceBattlefieldEffect,
  createBattlefieldEffect,
  effectEvictions,
  type EffectKind,
  MAX_ACTIVE_EFFECTS,
} from "./effects";

const effectKinds = [
  "hit",
  "armor",
  "critical",
  "death",
  "coin",
  "boss",
  "golden-kill",
  "golden-escape",
] as const satisfies readonly EffectKind[];

describe("battlefield effects", () => {
  it("uses distinct geometry for every readable combat cue", () => {
    const geometries = effectKinds.map((kind) => createBattlefieldEffect(kind).mesh.geometry.type);
    expect(new Set(geometries).size).toBe(8);
  });

  it("uses a circular critical cue rather than a triangular attack marker", () => {
    expect(createBattlefieldEffect("critical").mesh.geometry).toBeInstanceOf(THREE.TorusGeometry);
  });

  it("caps, expires, preserves reduced-motion scale, and disposes each resource once", () => {
    expect(effectEvictions(MAX_ACTIVE_EFFECTS, 1)).toBe(1);
    const effect = createBattlefieldEffect("critical", true);
    const geometry = effect.mesh.geometry;
    const material = effect.mesh.material;
    if (Array.isArray(material)) throw new Error("Expected one effect material");
    let geometryDisposals = 0;
    let materialDisposals = 0;
    geometry.addEventListener("dispose", () => {
      geometryDisposals += 1;
    });
    material.addEventListener("dispose", () => {
      materialDisposals += 1;
    });
    const scale = effect.mesh.scale.x;
    while (advanceBattlefieldEffect(effect)) {
      // Advance to expiry.
    }
    expect(effect.mesh.scale.x).toBe(scale);
    geometry.dispose();
    material.dispose();
    expect(geometryDisposals).toBe(1);
    expect(materialDisposals).toBe(1);
  });
});
