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
    this.element.replaceChildren(
      ...events.map((event) => {
        const item = makeText("li", event.message);
        if (event.source !== undefined) {
          item.className = `${event.source}-hit`;
          item.setAttribute(
            "aria-label",
            `${event.source === "manual" ? "Manual" : "Automatic"} hit: ${event.message}`,
          );
        }
        return item;
      }),
    );
  }
}
