import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { Unit, UnitModel, UnitView } from ".";

type TestSnapshot = { readonly id: string; readonly value: number };

class TestModel extends UnitModel<TestSnapshot> {
  protected sameIdentity(previous: TestSnapshot, next: TestSnapshot): boolean {
    return previous.id === next.id;
  }
}

class TestView extends UnitView<TestSnapshot> {
  synchronized: TestSnapshot[] = [];
  ticks = 0;

  constructor() {
    super();
    this.registerAnimation("pulse", () => {
      this.ticks += 1;
    });
  }

  protected applySnapshot(snapshot: TestSnapshot): void {
    this.synchronized.push(snapshot);
  }
}

describe("Unit MVC lifecycle", () => {
  it("routes local sync, animation, tick, attach, and disposal through one controller", () => {
    const model = new TestModel({ id: "first", value: 1 });
    const view = new TestView();
    const unit = new Unit(model, view);
    const events: string[] = [];
    unit.subscribe((event) => events.push(event.type));
    const parent = new THREE.Group();

    unit.dispatch({ type: "attach", parent });
    unit.dispatch({ type: "sync", snapshot: { id: "first", value: 2 } });
    unit.dispatch({ type: "animate", name: "pulse" });
    unit.tick();
    unit.dispose();
    unit.dispatch({ type: "sync", snapshot: { id: "next", value: 3 } });
    expect(model.replace({ id: "next", value: 3 })).toBe(false);

    expect(parent.children).toHaveLength(0);
    expect(view.synchronized).toEqual([
      { id: "first", value: 1 },
      { id: "first", value: 2 },
    ]);
    expect(view.ticks).toBe(2);
    expect(events).toEqual(["attached", "synced", "animated", "ticked", "disposed"]);
  });
});
