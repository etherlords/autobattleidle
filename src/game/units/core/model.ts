import type { UnitModelEvent, UnitModelListener, UnitUnsubscribe } from "./contracts";

export abstract class UnitModel<Snapshot> {
  private readonly listeners = new Set<UnitModelListener<Snapshot>>();
  private current: Snapshot;
  private disposed = false;

  constructor(initial: Snapshot) {
    this.current = initial;
  }

  get snapshot(): Snapshot {
    return this.current;
  }

  replace(snapshot: Snapshot): boolean {
    if (this.disposed) return false;
    if (this.current === snapshot) return false;
    const identityChanged = !this.sameIdentity(this.current, snapshot);
    this.current = snapshot;
    this.publish({ type: "changed", snapshot, identityChanged });
    return true;
  }

  subscribe(listener: UnitModelListener<Snapshot>): UnitUnsubscribe {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
  }

  protected abstract sameIdentity(previous: Snapshot, next: Snapshot): boolean;

  private publish(event: UnitModelEvent<Snapshot>): void {
    for (const listener of this.listeners) listener(event);
  }
}
