import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  advanceBattlefieldEffect,
  createBattlefieldEffect,
  effectEvictions,
  effectVisualScale,
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
    const geometries = effectKinds
      .filter((kind) => kind !== "critical" && kind !== "hit")
      .map((kind) => {
        const mesh = createBattlefieldEffect(kind).mesh;
        if (!(mesh instanceof THREE.Mesh)) throw new Error("Expected one mesh cue");
        return mesh.geometry.type;
      });
    expect(new Set(geometries).size).toBe(6);
  });

  it("uses transparent tapered slash trails for hit and crossed critical cues", () => {
    const hit = createBattlefieldEffect("hit", false, undefined, 2.6);
    const critical = createBattlefieldEffect("critical", false, undefined, 2.6);
    expect(hit.mesh).toBeInstanceOf(THREE.Group);
    expect(hit.mesh.name).toBe("battlefield-effect-hit");
    expect(effectVisualScale(3)).toBeCloseTo(1.5);
    expect(effectVisualScale(Number.POSITIVE_INFINITY)).toBeCloseTo(1.5);
    expect(hit.mesh.scale.x).toBeCloseTo(2.05 * effectVisualScale(2.6));
    expect(hit.slashes).toHaveLength(1);
    expect(hit.slashes[0]?.trail).toHaveLength(3);
    expect(critical.slashes).toHaveLength(2);
    expect(hit.slashes[0]?.mesh.geometry).toBeInstanceOf(THREE.ShapeGeometry);
    const [first, second] = critical.slashes;
    if (first === undefined || second === undefined)
      throw new Error("Expected crossed critical slashes");
    expect(first.from.x).toBeLessThan(0);
    expect(first.from.y).toBeGreaterThan(0);
    expect(first.to.x).toBeGreaterThan(0);
    expect(first.to.y).toBeLessThan(0);
    expect(second.from.x).toBeGreaterThan(0);
    expect(second.to.x).toBeLessThan(0);
    for (const slash of [...hit.slashes, ...critical.slashes]) {
      for (const layer of slash.trail) {
        const material = layer.mesh.material;
        if (!(material instanceof THREE.MeshBasicMaterial))
          throw new Error("Expected slash material");
        expect(material.transparent).toBe(true);
        expect(material.blending).toBe(THREE.AdditiveBlending);
        expect(material.depthTest).toBe(false);
        expect(layer.mesh.renderOrder).toBe(1);
        expect(material.opacity).toBeLessThanOrEqual(0.42);
      }
    }
  });

  it("caps, expires, preserves reduced-motion scale, and disposes each resource once", () => {
    expect(effectEvictions(MAX_ACTIVE_EFFECTS, 1)).toBe(1);
    const effect = createBattlefieldEffect("armor", true);
    if (!(effect.mesh instanceof THREE.Mesh)) throw new Error("Expected one armor mesh");
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

  it("uses a smaller translucent armor impact distinct from a slash", () => {
    const armor = createBattlefieldEffect("armor");
    if (!(armor.mesh instanceof THREE.Mesh)) throw new Error("Expected armor impact mesh");
    if (!(armor.mesh.material instanceof THREE.MeshStandardMaterial))
      throw new Error("Expected armor impact material");
    expect(armor.mesh.geometry.type).toBe("IcosahedronGeometry");
    expect(armor.mesh.material.transparent).toBe(true);
    expect(armor.mesh.material.opacity).toBe(0.5);
    expect(armor.mesh.scale.x).toBeCloseTo(0.58);
  });

  it("sweeps, fades, and overlaps crossed slash trails without exceeding the alpha cap", () => {
    const hit = createBattlefieldEffect("hit");
    const critical = createBattlefieldEffect("critical");
    const hitSlash = hit.slashes[0];
    const criticalFirst = critical.slashes[0];
    const criticalSecond = critical.slashes[1];
    if (hitSlash === undefined || criticalFirst === undefined || criticalSecond === undefined)
      throw new Error("Expected slash samples");
    const hitMaterial = hitSlash.mesh.material;
    const secondMaterial = criticalSecond.mesh.material;
    if (
      !(hitMaterial instanceof THREE.MeshBasicMaterial) ||
      !(secondMaterial instanceof THREE.MeshBasicMaterial)
    )
      throw new Error("Expected slash materials");
    const initialY = hitSlash.mesh.position.y;
    const initialOpacity = hitMaterial.opacity;
    expect(initialOpacity).toBe(0.42);
    advanceBattlefieldEffect(hit);
    expect(hitSlash.mesh.position.y).not.toBe(initialY);
    expect(hitSlash.mesh.position.x).toBeGreaterThan(hitSlash.from.x);
    advanceBattlefieldEffect(hit);
    expect(hitMaterial.opacity).toBeGreaterThan(0);
    expect(hitMaterial.opacity).toBeLessThanOrEqual(0.42);
    advanceBattlefieldEffect(critical);
    advanceBattlefieldEffect(critical);
    const firstMaterial = criticalFirst.mesh.material;
    if (!(firstMaterial instanceof THREE.MeshBasicMaterial))
      throw new Error("Expected first critical slash material");
    expect(firstMaterial.opacity).toBeGreaterThan(0);
    expect(secondMaterial.opacity).toBeGreaterThan(0);
    expect(criticalFirst.mesh.position.x).toBeGreaterThan(criticalFirst.from.x);
    expect(criticalSecond.mesh.position.x).toBeLessThan(criticalSecond.from.x);
    while (advanceBattlefieldEffect(hit)) {
      // Advance to expiry.
      expect(hitMaterial.opacity).toBeGreaterThan(0);
    }
    expect(hitMaterial.opacity).toBe(0);
  });
});
