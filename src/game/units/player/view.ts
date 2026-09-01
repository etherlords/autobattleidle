import * as THREE from "three";

import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { UnitView } from "../core";
import { PlayerEvolution, playerEvolutionIdentity } from "./evolution";
import type { PlayerUnitSnapshot } from "./model";

const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

export class PlayerUnitView extends UnitView<PlayerUnitSnapshot> {
  private readonly body = this.createRoot("body");
  private evolution: PlayerEvolution | undefined;

  constructor() {
    super();
    const { base, baseOffsetY } = BATTLEFIELD_CONFIG.player;
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(base.radius, base.radius, base.height, base.segments),
      material(base.color),
    );
    platform.position.y = baseOffsetY;
    this.body.add(platform);
    this.registerAnimation("player-evolution", () => this.evolution?.tick());
  }

  override animate(name: string): boolean {
    if (name === "hit" || name === "attack") {
      this.evolution?.replay(name);
      return this.evolution !== undefined;
    }
    return super.animate(name);
  }

  protected applySnapshot(snapshot: PlayerUnitSnapshot): void {
    this.group.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    const identity = playerEvolutionIdentity(snapshot.level);
    if (
      this.evolution?.identity.formStart !== identity.formStart ||
      this.evolution.identity.detailCount !== identity.detailCount
    ) {
      this.evolution?.dispose();
      this.evolution = new PlayerEvolution(
        identity,
        typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      );
      this.body.add(this.evolution.group);
    }
  }

  playerEvolutionReceipt(): { readonly detailCount: number; readonly formStart: number } {
    if (this.evolution === undefined) throw new Error("Player evolution is not initialized");
    return this.evolution.identity;
  }

  override dispose(): void {
    this.evolution?.dispose();
    this.evolution = undefined;
    super.dispose();
  }
}
