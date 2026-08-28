import type { BattleSnapshot } from "../../domain/snapshot";
import { makeText, progress, setProgress } from "./elements";
import { formatNumber } from "../number-format";

export class BattleStatus {
  readonly element = document.createElement("section");
  private readonly enemy = makeText("h1", "");
  private readonly health = progress("enemy-health");
  private readonly healthFill = document.createElement("div");
  private readonly healthText = document.createElement("span");
  private readonly automatic = progress("automatic-progress");
  private readonly automaticFill = document.createElement("div");
  private readonly automaticText = makeText("p", "");
  private readonly coins = makeText("p", "");

  constructor() {
    this.element.className = "hud-status";
    this.healthFill.className = "enemy-health-fill";
    this.health.append(this.healthFill, this.healthText);
    this.automaticFill.className = "automatic-progress-fill";
    this.automatic.append(this.automaticFill);
    this.element.append(this.enemy, this.health, this.automatic, this.automaticText, this.coins);
  }

  render(snapshot: BattleSnapshot): void {
    const { automatic, coins, enemy } = snapshot;
    const level = formatNumber(enemy.level);
    const health = formatNumber(enemy.health);
    const maxHealth = formatNumber(enemy.maxHealth);
    const formattedCoins = formatNumber(coins);
    this.enemy.textContent = `${enemy.name} · Level ${level.text} · ${enemy.grade}${enemy.modifier === null ? "" : ` · ${enemy.modifier}`}`;
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
    this.automaticText.textContent = automatic.unlocked
      ? `Automatic attack: ${(automatic.remainingMs / 1000).toFixed(3)}s`
      : "Automatic attack: locked";
    this.coins.textContent = `Coins: ${formattedCoins.text}`;
    this.coins.title = formattedCoins.exact;
  }
}
