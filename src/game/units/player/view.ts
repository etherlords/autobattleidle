import * as THREE from "three";

import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { UnitView } from "../core";
import type { PlayerUnitSnapshot } from "./model";

const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

export class PlayerUnitView extends UnitView<PlayerUnitSnapshot> {
  private readonly body = this.createRoot("body");

  constructor() {
    super();
    const { base, baseOffsetY, core } = BATTLEFIELD_CONFIG.player;
    this.body.add(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(core.radius),
        material(core.color, core.emissive),
      ),
    );
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(base.radius, base.radius, base.height, base.segments),
      material(base.color),
    );
    platform.position.y = baseOffsetY;
    this.body.add(platform);
  }

  protected applySnapshot(snapshot: PlayerUnitSnapshot): void {
    this.group.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
  }
}
