import { formatNumber } from "../number-format";
import type { LeaderboardView, RankingMode } from "../../leaderboard/contracts";
import { button, makeText } from "./elements";

export class LeaderboardDialog {
  readonly launcher = button("leaderboard-launcher", "Leaderboard");
  readonly modal = document.createElement("section");
  private readonly dialog = document.createElement("section");
  private readonly close = button("leaderboard-close", "Close leaderboard");
  private readonly metricTabs = document.createElement("div");
  private readonly viewTabs = document.createElement("div");
  private readonly top = button("leaderboard-top", "Top 100");
  private readonly around = button("leaderboard-around", "Around me");
  private readonly level = button("leaderboard-level", "Level");
  private readonly goldenBugs = button("leaderboard-golden-bugs", "Golden Bugs");
  private readonly status = makeText("p", "Open to load the community leaderboard.");
  private readonly entries = document.createElement("table");
  private readonly body = document.createElement("tbody");
  private readonly name = document.createElement("input");
  private readonly renameButton = button("leaderboard-rename", "Rename");
  private readonly resetButton = button("leaderboard-reset", "Delete leaderboard identity");
  private loadListener: ((around: boolean, mode: RankingMode) => void) | undefined;
  private mode: RankingMode = "level";
  private aroundView = false;
  private renameListener: ((name: string) => void | Promise<void>) | undefined;
  private resetListener: (() => void | Promise<void>) | undefined;
  private pendingAction = false;

  constructor() {
    this.launcher.setAttribute("aria-haspopup", "dialog");
    this.modal.className = "leaderboard-modal";
    this.modal.hidden = true;
    this.dialog.className = "leaderboard-dialog";
    this.dialog.setAttribute("aria-label", "Community leaderboard");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("role", "dialog");
    this.status.setAttribute("aria-live", "polite");
    this.close.textContent = "×";
    this.close.setAttribute("aria-label", "Close leaderboard");
    this.metricTabs.className = "leaderboard-tabs leaderboard-metric-tabs";
    this.metricTabs.setAttribute("aria-label", "Ranking statistic");
    this.metricTabs.setAttribute("role", "group");
    this.viewTabs.className = "leaderboard-tabs leaderboard-view-tabs";
    this.viewTabs.setAttribute("aria-label", "Leaderboard view");
    this.viewTabs.setAttribute("role", "group");
    this.status.className = "leaderboard-rank-summary";
    this.entries.className = "leaderboard-entries";
    this.entries.append(this.tableHead(), this.body);
    this.name.className = "leaderboard-name";
    this.name.maxLength = 24;
    this.name.placeholder = "Display name";
    this.name.setAttribute("aria-label", "New display name");
    this.metricTabs.append(this.level, this.goldenBugs);
    this.viewTabs.append(this.top, this.around);
    this.dialog.append(
      this.close,
      this.metricTabs,
      this.viewTabs,
      this.status,
      this.entries,
      this.name,
      this.renameButton,
      this.resetButton,
    );
    this.updateTabs();
    this.modal.append(this.dialog);
    this.launcher.addEventListener("click", this.open);
    this.close.addEventListener("click", this.closeFromButton);
    this.top.addEventListener("click", this.loadTop);
    this.around.addEventListener("click", this.loadAround);
    this.level.addEventListener("click", this.selectLevel);
    this.goldenBugs.addEventListener("click", this.selectGoldenBugs);
    this.renameButton.addEventListener("click", this.rename);
    this.resetButton.addEventListener("click", this.reset);
    this.modal.addEventListener("pointerup", this.closeFromBackdrop);
  }

  onLoad(listener: (around: boolean, mode: RankingMode) => void): void {
    this.loadListener = listener;
  }
  onRename(listener: (name: string) => void | Promise<void>): void {
    this.renameListener = listener;
  }
  onReset(listener: () => void | Promise<void>): void {
    this.resetListener = listener;
  }
  render(view: LeaderboardView, status = ""): void {
    const defaultStatus =
      view.entries.length === 0 ? "No ranked players yet." : "Community ranking";
    this.status.textContent =
      status ||
      (view.me === null ? defaultStatus : `Community ranking — Your rank is #${view.me.rank}`);
    this.body.replaceChildren(
      ...view.entries.map((entry) => {
        const row = document.createElement("tr");
        const mine = entry.rank === view.me?.rank;
        if (mine) {
          row.className = "leaderboard-current";
          row.setAttribute("aria-label", `Your rank ${entry.rank}`);
        }
        const place = document.createElement("td");
        place.textContent = String(entry.rank);
        const name = document.createElement("td");
        name.textContent = entry.name;
        const value = document.createElement("td");
        value.textContent = formatNumber(
          this.mode === "level" ? entry.level : entry.goldenBugs,
        ).text;
        row.append(place, name, value);
        return row;
      }),
    );
  }
  report(message: string): void {
    this.status.textContent = message;
  }
  dismiss(): void {
    this.closeModal();
  }
  dismissForHandoff(): void {
    this.closeModal(false);
  }
  dispose(): void {
    this.launcher.removeEventListener("click", this.open);
    document.removeEventListener("keydown", this.modalKeydown);
    this.close.removeEventListener("click", this.closeFromButton);
    this.top.removeEventListener("click", this.loadTop);
    this.around.removeEventListener("click", this.loadAround);
    this.level.removeEventListener("click", this.selectLevel);
    this.goldenBugs.removeEventListener("click", this.selectGoldenBugs);
    this.renameButton.removeEventListener("click", this.rename);
    this.resetButton.removeEventListener("click", this.reset);
    this.modal.removeEventListener("pointerup", this.closeFromBackdrop);
  }
  private readonly open = (): void => {
    if (!this.modal.hidden) return;
    this.modal.hidden = false;
    document.addEventListener("keydown", this.modalKeydown);
    this.close.focus();
    this.loadListener?.(false, this.mode);
  };
  private readonly closeModal = (restoreFocus = true): void => {
    if (this.modal.hidden) return;
    this.modal.hidden = true;
    document.removeEventListener("keydown", this.modalKeydown);
    if (restoreFocus) this.launcher.focus();
  };
  private readonly loadTop = (): void => {
    if (this.pendingAction) return;
    this.aroundView = false;
    this.updateTabs();
    this.loadListener?.(this.aroundView, this.mode);
  };
  private readonly loadAround = (): void => {
    if (this.pendingAction) return;
    this.aroundView = true;
    this.updateTabs();
    this.loadListener?.(this.aroundView, this.mode);
  };
  private readonly selectLevel = (): void => {
    if (this.pendingAction) return;
    this.mode = "level";
    this.updateTabs();
    this.loadListener?.(this.aroundView, this.mode);
  };
  private readonly selectGoldenBugs = (): void => {
    if (this.pendingAction) return;
    this.mode = "golden-bugs";
    this.updateTabs();
    this.loadListener?.(this.aroundView, this.mode);
  };
  private readonly rename = async (): Promise<void> => {
    if (this.pendingAction) return;
    this.setPendingAction(true);
    try {
      const result = this.renameListener?.(this.name.value);
      if (result instanceof Promise) await result;
    } finally {
      this.setPendingAction(false);
    }
  };
  private readonly reset = async (): Promise<void> => {
    if (this.pendingAction) return;
    this.setPendingAction(true);
    try {
      const result = this.resetListener?.();
      if (result instanceof Promise) await result;
    } finally {
      this.setPendingAction(false);
    }
  };
  private readonly closeFromButton = (): void => this.closeModal();
  private readonly closeFromBackdrop = (event: PointerEvent): void => {
    if (event.target === this.modal) this.closeModal();
  };
  private readonly modalKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      this.close,
      this.level,
      this.goldenBugs,
      this.top,
      this.around,
      this.name,
      this.renameButton,
      this.resetButton,
    ].filter((control) => !control.disabled);
    const current = controls.indexOf(
      document.activeElement as HTMLButtonElement | HTMLInputElement,
    );
    const next = (current + (event.shiftKey ? controls.length - 1 : 1)) % controls.length;
    event.preventDefault();
    controls[next]?.focus();
  };
  private tableHead(): HTMLTableSectionElement {
    const head = document.createElement("thead");
    const row = document.createElement("tr");
    for (const label of ["Place", "Name", this.mode === "level" ? "Level" : "Golden Bugs"]) {
      const cell = document.createElement("th");
      cell.textContent = label;
      cell.setAttribute("scope", "col");
      row.append(cell);
    }
    head.append(row);
    return head;
  }
  private updateTabs(): void {
    this.level.setAttribute("aria-pressed", String(this.mode === "level"));
    this.goldenBugs.setAttribute("aria-pressed", String(this.mode === "golden-bugs"));
    this.top.setAttribute("aria-pressed", String(!this.aroundView));
    this.around.setAttribute("aria-pressed", String(this.aroundView));
    const head = this.entries.children[0];
    if (head !== undefined) this.entries.replaceChildren(this.tableHead(), this.body);
  }
  private setPendingAction(pending: boolean): void {
    this.pendingAction = pending;
    for (const control of [
      this.level,
      this.goldenBugs,
      this.top,
      this.around,
      this.name,
      this.renameButton,
      this.resetButton,
    ])
      control.disabled = pending;
  }
}
