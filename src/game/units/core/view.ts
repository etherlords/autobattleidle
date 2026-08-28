import * as THREE from "three";

export abstract class UnitView<Snapshot> {
  readonly group = new THREE.Group();
  private readonly animations = new Map<string, () => void>();
  private disposed = false;

  attach(parent: THREE.Object3D): void {
    if (!this.disposed) parent.add(this.group);
  }

  sync(snapshot: Snapshot): void {
    if (!this.disposed) this.applySnapshot(snapshot);
  }

  tick(): void {
    if (!this.disposed) {
      for (const animation of this.animations.values()) animation();
    }
  }

  animate(name: string): boolean {
    const animation = this.animations.get(name);
    if (this.disposed || animation === undefined) return false;
    animation();
    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        const { material } = child;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      }
    });
    this.animations.clear();
    this.group.removeFromParent();
  }

  protected createRoot(name: string): THREE.Group {
    const root = new THREE.Group();
    root.name = `unit-layer-${name}`;
    this.group.add(root);
    return root;
  }

  protected registerAnimation(name: string, animation: () => void): void {
    if (this.animations.has(name)) throw new Error(`Animation ${name} is already registered`);
    this.animations.set(name, animation);
  }

  protected abstract applySnapshot(snapshot: Snapshot): void;
}
