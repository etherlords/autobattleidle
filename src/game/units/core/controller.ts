import type { UnitCommand, UnitEvent, UnitListener, UnitUnsubscribe } from "./contracts";
import type { UnitModel } from "./model";
import type { UnitView } from "./view";

export class UnitController<Snapshot> {
  private readonly listeners = new Set<UnitListener<Snapshot>>();
  private readonly unsubscribeModel: UnitUnsubscribe;
  private disposed = false;

  constructor(
    private readonly model: UnitModel<Snapshot>,
    private readonly view: UnitView<Snapshot>,
  ) {
    this.view.sync(model.snapshot);
    this.unsubscribeModel = model.subscribe(({ identityChanged, snapshot }) => {
      this.view.sync(snapshot);
      this.publish({ type: "synced", snapshot, identityChanged });
    });
  }

  dispatch(command: UnitCommand<Snapshot>): boolean {
    if (this.disposed) return false;
    if (command.type === "attach") {
      this.view.attach(command.parent);
      this.publish({ type: "attached" });
      return true;
    }
    if (command.type === "sync") {
      return this.model.replace(command.snapshot);
    }
    if (command.type === "animate") {
      if (!this.view.animate(command.name)) return false;
      this.publish({ type: "animated", name: command.name });
      return true;
    }
    if (command.type === "tick") {
      this.view.tick();
      this.publish({ type: "ticked" });
      return true;
    }
    return this.dispose();
  }

  subscribe(listener: UnitListener<Snapshot>): UnitUnsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  composes(model: UnitModel<Snapshot>, view: UnitView<Snapshot>): boolean {
    return this.model === model && this.view === view;
  }

  dispose(): boolean {
    if (this.disposed) return false;
    this.disposed = true;
    this.unsubscribeModel();
    this.model.dispose();
    this.view.dispose();
    this.publish({ type: "disposed" });
    this.listeners.clear();
    return true;
  }

  private publish(event: UnitEvent<Snapshot>): void {
    for (const listener of this.listeners) listener(event);
  }
}
