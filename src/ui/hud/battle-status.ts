import type { BattleSnapshot } from "../../domain/snapshot";
import { button, makeText, progress, setProgress } from "./elements";
import { formatNumber } from "../number-format";

const modifierLabels = {
  armor: "Armored",
  health: "Vital",
  "automatic-slow": "Time Warp",
  hardened: "Hardened",
  "critical-guard": "Critical Guard",
  "manual-guard": "Manual Guard",
} as const;

export class BattleStatus {
  readonly element = document.createElement("section");
  private readonly enemy = makeText("h1", "");
  private readonly health = progress("enemy-health");
  private readonly healthFill = document.createElement("div");
  private readonly healthText = document.createElement("span");
  private readonly automatic = progress("automatic-progress");
  private readonly automaticFill = document.createElement("div");
  private readonly automaticRow = document.createElement("div");
  private readonly automaticText = makeText("p", "");
  private readonly automaticPause = button("automatic-pause", "⏸");
  private pauseListener: (() => void) | undefined;
  private readonly coins = makeText("p", "");
  private readonly goldenBug = makeText("p", "");

  constructor() {
    this.element.className = "hud-status";
    this.healthFill.className = "enemy-health-fill";
    this.health.append(this.healthFill, this.healthText);
    this.automaticFill.className = "automatic-progress-fill";
    this.automatic.append(this.automaticFill);
    this.automaticRow.className = "automatic-control-row";
    this.automaticRow.append(this.automatic, this.automaticPause);
    this.goldenBug.className = "golden-bug-countdown";
    this.automaticPause.addEventListener("click", this.togglePause);
    this.element.append(
      this.enemy,
      this.health,
      this.automaticRow,
      this.automaticText,
      this.goldenBug,
      this.coins,
    );
  }

  onToggleAutomaticPause(listener: () => void): void {
    this.pauseListener = listener;
  }
  dispose(): void {
    this.automaticPause.removeEventListener("click", this.togglePause);
  }

  render(snapshot: BattleSnapshot): void {
    const { automatic, coins, enemy, goldenBug, playerStats } = snapshot;
    const level = formatNumber(enemy.level);
    const health = formatNumber(enemy.health);
    const maxHealth = formatNumber(enemy.maxHealth);
    const formattedCoins = formatNumber(coins);
    this.enemy.textContent = `${enemy.name} · Level ${level.text} · ${enemy.grade}${enemy.modifier === null ? "" : ` · ${modifierLabels[enemy.modifier]}`}`;
    setProgress(
      this.health,
      `${enemy.name} health ${health.exact} of ${maxHealth.exact}`,
      enemy.maxHealth,
      enemy.health,
    );
    this.healthFill.style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
    this.healthText.textContent = `${health.text} / ${maxHealth.text}`;
    this.health.title = `${health.exact} / ${maxHealth.exact}`;
    setProgress(
      this.automatic,
      "Automatic attack cooldown",
      automatic.intervalMs,
      automatic.remainingMs,
    );
    this.automaticFill.style.width = automatic.unlocked
      ? `${Math.min(100, (automatic.remainingMs / automatic.intervalMs) * 100)}%`
      : "0%";
    this.automaticPause.disabled = !automatic.unlocked;
    this.automaticPause.textContent = automatic.paused ? "▶" : "⏸";
    this.automaticPause.setAttribute(
      "aria-label",
      automatic.paused ? "Resume auto attack" : "Pause auto attack",
    );
    this.automaticPause.setAttribute("aria-pressed", String(automatic.paused));
    this.automaticText.textContent = automatic.unlocked
      ? `Automatic attack${automatic.paused ? ": paused" : ""}: ${playerStats.automaticAttacksPerSecond.toFixed(2)} APS · ${(automatic.remainingMs / 1000).toFixed(3)}s`
      : `Automatic attack: locked · ${playerStats.automaticAttacksPerSecond.toFixed(2)} APS`;
    this.coins.textContent = `Coins: ${formattedCoins.text}`;
    this.coins.title = formattedCoins.exact;
    this.goldenBug.textContent =
      goldenBug === null || goldenBug === undefined
        ? ""
        : `Golden Bug escaping in ${(goldenBug.remainingMs / 1000).toFixed(1)}s`;
  }
  private readonly togglePause = (): void => this.pauseListener?.();
}
