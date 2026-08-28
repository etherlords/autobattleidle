import type { BattleSnapshot } from "../domain/snapshot";
import { makeText, progress, setProgress } from "./hud-elements";

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
    this.enemy.textContent = `${enemy.name} · Level ${enemy.level} · ${enemy.grade}${enemy.modifier === null ? "" : ` · ${enemy.modifier}`}`;
    setProgress(
      this.health,
      `${enemy.name} health ${enemy.health} of ${enemy.maxHealth}`,
      enemy.maxHealth,
      enemy.health,
    );
    this.healthFill.style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
    this.healthText.textContent = `${enemy.health}/${enemy.maxHealth}`;
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
    this.coins.textContent = `Coins: ${coins}`;
  }
}
