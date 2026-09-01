import type { BattleEvent } from "../../domain/snapshot";

const sourceLabel: Record<"automatic" | "manual", string> = {
  automatic: "automatic",
  manual: "manual",
};

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
    this.element.replaceChildren(...events.map((event) => this.renderEvent(event)));
  }

  private renderEvent(event: BattleEvent): HTMLElement {
    const item = document.createElement("li");
    item.textContent = event.message;
    if (event.attack !== undefined) {
      item.dataset.source = event.attack.source;
      item.dataset.kind = event.attack.defeated ? "kill" : event.attack.kind;
      item.dataset.damage = String(event.attack.damage);
      const accessibleLabel = document.createElement("span");
      accessibleLabel.className = "event-log-source-label";
      accessibleLabel.textContent = ` (${sourceLabel[event.attack.source]})`;
      item.append(accessibleLabel);
    }
    return item;
  }
}
