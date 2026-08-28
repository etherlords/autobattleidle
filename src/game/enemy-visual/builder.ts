import * as THREE from "three";

import type { EnemyVisualCommand, EnemyVisualComponent, EnemyVisualLayer } from "./components";

export type EnemyViewBuild = {
  readonly group: THREE.Group;
  readonly roots: Readonly<Record<EnemyVisualLayer, THREE.Group>>;
  command(command: EnemyVisualCommand): boolean;
  dispose(): void;
  tick(): void;
};

export class EnemyViewBuilder {
  private readonly group = new THREE.Group();
  private readonly roots: Record<EnemyVisualLayer, THREE.Group> = {
    body: this.layerRoot("body"),
    grade: this.layerRoot("grade"),
    modifier: this.layerRoot("modifier"),
    decoration: this.layerRoot("decoration"),
  };
  private readonly attached: Record<EnemyVisualLayer, boolean> = {
    body: false,
    grade: false,
    modifier: false,
    decoration: false,
  };
  private readonly animations = new Map<string, () => void>();
  private readonly componentKeys = new Set<string>();
  private readonly commandHandlers: Record<EnemyVisualCommand, Array<() => void>> = {
    spawn: [],
    hit: [],
    critical: [],
    death: [],
  };
  private readonly disposers: Array<() => void> = [];
  private sealed = false;

  add(component: EnemyVisualComponent): this {
    this.assertOpen();
    if (this.componentKeys.has(component.key))
      throw new Error(`Enemy view component ${component.key} is already registered`);
    if (component.layer === "body" && this.attached.body)
      throw new Error("Enemy view already has a body");
    if (component.layer !== "decoration" && this.attached[component.layer])
      throw new Error(`Enemy view already has a ${component.layer} root`);
    component.nodes.forEach((node) => this.roots[component.layer].add(node));
    this.componentKeys.add(component.key);
    if (component.dispose !== undefined) this.disposers.push(component.dispose);
    for (const command of ["spawn", "hit", "critical", "death"] as const) {
      const handler = component.commands?.[command];
      if (handler !== undefined) this.commandHandlers[command].push(handler);
    }
    this.attached[component.layer] = true;
    Object.entries(component.animations ?? {}).forEach(([name, tick]) =>
      this.addAnimation(name, tick),
    );
    return this;
  }

  build(): EnemyViewBuild {
    this.assertOpen();
    if (!this.attached.body) throw new Error("Enemy view requires exactly one body");
    this.sealed = true;
    const roots: Record<EnemyVisualLayer, THREE.Group> = { ...this.roots };
    let disposed = false;
    return {
      group: this.group,
      roots,
      command: (command) => {
        const handlers = this.commandHandlers[command];
        handlers.forEach((handler) => handler());
        return handlers.length > 0;
      },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        this.disposers.forEach((dispose) => dispose());
      },
      tick: () => this.animations.forEach((tick) => tick()),
    };
  }

  private addAnimation(name: string, tick: () => void): void {
    if (this.animations.has(name))
      throw new Error(`Enemy view animation ${name} is already registered`);
    this.animations.set(name, tick);
  }

  private assertOpen(): void {
    if (this.sealed) throw new Error("Enemy view builder is sealed");
  }

  private layerRoot(layer: EnemyVisualLayer): THREE.Group {
    const root = new THREE.Group();
    root.name = `enemy-layer-${layer}`;
    this.group.add(root);
    return root;
  }
}
