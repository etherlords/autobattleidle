import type * as THREE from "three";

export type UnitKind = "enemy" | "player";
export type UnitUnsubscribe = () => void;

export type UnitCommand<Snapshot> =
  | { readonly type: "attach"; readonly parent: THREE.Object3D }
  | { readonly type: "sync"; readonly snapshot: Snapshot }
  | { readonly type: "animate"; readonly name: string }
  | { readonly type: "tick" }
  | { readonly type: "dispose" };

export type UnitEvent<Snapshot> =
  | { readonly type: "attached" }
  | { readonly type: "synced"; readonly snapshot: Snapshot; readonly identityChanged: boolean }
  | { readonly type: "animated"; readonly name: string }
  | { readonly type: "ticked" }
  | { readonly type: "disposed" };

export type UnitListener<Snapshot> = (event: UnitEvent<Snapshot>) => void;
export type UnitModelListener<Snapshot> = (event: UnitModelEvent<Snapshot>) => void;

export type UnitModelEvent<Snapshot> = {
  readonly type: "changed";
  readonly snapshot: Snapshot;
  readonly identityChanged: boolean;
};
