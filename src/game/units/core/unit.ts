import type { UnitCommand, UnitListener, UnitUnsubscribe } from "./contracts";
import { UnitController } from "./controller";
import type { UnitModel } from "./model";
import type { UnitView } from "./view";

export class Unit<Snapshot> {
  readonly controller: UnitController<Snapshot>;

  constructor(
    readonly model: UnitModel<Snapshot>,
    readonly view: UnitView<Snapshot>,
    controller?: UnitController<Snapshot>,
  ) {
    this.controller = controller ?? new UnitController(model, view);
  }

  dispatch(command: UnitCommand<Snapshot>): boolean {
    return this.controller.dispatch(command);
  }

  tick(): void {
    this.dispatch({ type: "tick" });
  }

  subscribe(listener: UnitListener<Snapshot>): UnitUnsubscribe {
    return this.controller.subscribe(listener);
  }

  dispose(): boolean {
    return this.controller.dispose();
  }
}
