import { formatNumber } from "../number-format";
import type { LeaderboardView, RankingMode } from "../../leaderboard/contracts";
import { button, makeText } from "./elements";

export class LeaderboardDialog {
  readonly launcher = button("leaderboard-launcher", "Leaderboard");
  readonly modal = document.createElement("section");
  private readonly dialog = document.createElement("section");
  private readonly close = button("leaderboard-close", "Close leaderboard");
  private readonly top = button("leaderboard-top", "Top 100");
  private readonly around = button("leaderboard-around", "Around me");
  private readonly level = button("leaderboard-level", "Level");
  private readonly goldenBugs = button("leaderboard-golden-bugs", "Golden Bugs");
  private readonly status = makeText("p", "Open to load the community leaderboard.");
  private readonly entries = document.createElement("ol");
  private readonly name = document.createElement("input");
  private readonly renameButton = button("leaderboard-rename", "Rename");
  private readonly resetButton = button("leaderboard-reset", "Delete leaderboard identity");
  private loadListener: ((around: boolean, mode: RankingMode) => void) | undefined;
  private mode: RankingMode = "level";
  private renameListener: ((name: string) => void) | undefined;
  private resetListener: (() => void) | undefined;

  constructor() {
    this.launcher.setAttribute("aria-haspopup", "dialog");
    this.modal.className = "leaderboard-modal";
    this.modal.hidden = true;
    this.dialog.className = "leaderboard-dialog";
    this.dialog.setAttribute("aria-label", "Community leaderboard");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("role", "dialog");
    this.status.setAttribute("aria-live", "polite");
    this.entries.className = "leaderboard-entries";
    this.name.className = "leaderboard-name";
    this.name.maxLength = 24;
    this.name.placeholder = "Display name";
    this.name.setAttribute("aria-label", "New display name");
    this.dialog.append(
      this.close,
      this.top,
      this.around,
      this.level,
      this.goldenBugs,
      this.status,
      this.entries,
      this.name,
      this.renameButton,
      this.resetButton,
    );
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
  onRename(listener: (name: string) => void): void {
    this.renameListener = listener;
  }
  onReset(listener: () => void): void {
    this.resetListener = listener;
  }
  render(view: LeaderboardView, status = ""): void {
    const defaultStatus =
      view.entries.length === 0 ? "No ranked players yet." : "Community ranking";
    this.status.textContent =
      status || (view.me === null ? defaultStatus : `Your rank: ${view.me.rank}`);
    this.entries.replaceChildren(
      ...view.entries.map((entry) => {
        const item = document.createElement("li");
        item.textContent = `#${entry.rank} ${entry.name} — ${this.mode === "level" ? `level ${formatNumber(entry.level).text}` : `${formatNumber(entry.goldenBugs).text} Golden Bugs`}`;
        return item;
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
  private readonly loadTop = (): void => this.loadListener?.(false, this.mode);
  private readonly loadAround = (): void => this.loadListener?.(true, this.mode);
  private readonly selectLevel = (): void => {
    this.mode = "level";
    this.loadTop();
  };
  private readonly selectGoldenBugs = (): void => {
    this.mode = "golden-bugs";
    this.loadTop();
  };
  private readonly rename = (): void => this.renameListener?.(this.name.value);
  private readonly reset = (): void => this.resetListener?.();
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
      this.top,
      this.around,
      this.level,
      this.goldenBugs,
      this.name,
      this.renameButton,
      this.resetButton,
    ];
    const current = controls.indexOf(
      document.activeElement as HTMLButtonElement | HTMLInputElement,
    );
    const next = (current + (event.shiftKey ? controls.length - 1 : 1)) % controls.length;
    event.preventDefault();
    controls[next]?.focus();
  };
}
