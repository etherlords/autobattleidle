import type * as THREE from "three";

import type { EnemyVisualInput } from "../../enemy-visual/spec";

export type EnemyUnitCommand =
  | { readonly type: "spawn"; readonly parent: THREE.Object3D }
  | { readonly type: "hit" }
  | { readonly type: "critical" }
  | { readonly type: "death" }
  | { readonly type: "sync"; readonly snapshot: EnemyVisualInput }
  | { readonly type: "dispose" };

export type EnemyUnitEvent =
  | { readonly type: "spawned" }
  | { readonly type: "hit" }
  | { readonly type: "critical" }
  | { readonly type: "death" }
  | { readonly type: "synchronized"; readonly snapshot: EnemyVisualInput }
  | { readonly type: "disposed" };

export type EnemyUnitEventType =
  "spawned" | "hit" | "critical" | "death" | "synchronized" | "disposed";

export type EnemyUnitListener = (event: EnemyUnitEvent) => void;
