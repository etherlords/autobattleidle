import type { BattleEvent } from "../../domain/snapshot";
import { makeText } from "./elements";

export class EventLog {
  readonly element = document.createElement("ol");
  private renderedEventIds = "";

  constructor() {
    this.element.className = "event-log";
    this.element.setAttribute("aria-label", "Combat events");
    this.element.setAttribute("aria-live", "polite");
  }

  render(events: readonly BattleEvent[]): void {
    const eventIds = events.map((event) => event.id).join(",");
    if (eventIds === this.renderedEventIds) return;
    this.renderedEventIds = eventIds;
    this.element.replaceChildren(...events.map((event) => makeText("li", event.message)));
  }
}
