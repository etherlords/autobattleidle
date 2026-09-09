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
  private readonly encounterPanel = document.createElement("div");
  private readonly resourcePanel = document.createElement("div");
  private readonly statGrid = document.createElement("div");
  private readonly enemy = makeText("h1", "");
  private readonly encounter = makeText("p", "");
  private readonly health = progress("enemy-health");
  private readonly healthFill = document.createElement("div");
  private readonly healthText = document.createElement("span");
  readonly trackStatus = makeText("p", "");
  private readonly automatic = progress("automatic-progress");
  private readonly automaticFill = document.createElement("div");
  private readonly automaticRow = document.createElement("div");
  private readonly automaticText = makeText("p", "");
  private readonly automaticPause = button("automatic-pause", "⏸");
  private readonly coins = makeText("p", "");
  private readonly goldenBug = makeText("p", "");
  private readonly damage = this.createMetric("Damage");
  private readonly critical = this.createMetric("Critical chance");
  private readonly penetration = this.createMetric("Armor penetration");
  private readonly armor = this.createMetric("Enemy armor");
  private pauseListener: (() => void) | undefined;

  constructor() {
    this.element.className = "hud-status";
    this.encounterPanel.className = "combat-encounter-panel";
    this.resourcePanel.className = "combat-resource-panel";
    this.statGrid.className = "combat-stat-grid";
    this.healthFill.className = "enemy-health-fill";
    this.health.append(this.healthFill, this.healthText);
    this.automaticFill.className = "automatic-progress-fill";
    this.automatic.append(this.automaticFill);
    this.automaticRow.className = "automatic-control-row";
    this.automaticRow.append(this.automatic, this.automaticPause);
    this.goldenBug.className = "golden-bug-countdown";
    this.trackStatus.className = "hud-track-status";
    this.automaticText.className = "automatic-text";
    this.encounter.className = "combat-encounter";
    this.statGrid.append(
      this.damage.element,
      this.critical.element,
      this.penetration.element,
      this.armor.element,
    );
    this.encounterPanel.append(this.enemy, this.encounter, this.health, this.goldenBug);
    this.resourcePanel.append(this.coins, this.automaticRow, this.automaticText);
    this.element.append(this.encounterPanel, this.resourcePanel, this.statGrid, this.trackStatus);
    this.automaticPause.addEventListener("click", this.togglePause);
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
    const rawArmor = formatNumber(enemy.armor.raw);
    const effectiveArmor = formatNumber(enemy.armor.effective);
    const formattedCoins = formatNumber(coins);
    const formattedDamage = formatNumber(playerStats.damage);
    const penetration = `${(playerStats.armorPenetration * 100).toFixed(1)}%`;
    const criticalChance = `${(playerStats.criticalChance * 100).toFixed(1)}%`;
    this.enemy.textContent = `${enemy.name} · ${enemy.grade}${enemy.modifier === null ? "" : ` · ${modifierLabels[enemy.modifier]}`}`;
    this.encounter.textContent = `${snapshot.encounter} · Encounter ${level.text}`;
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
    this.damage.value.textContent = formattedDamage.text;
    this.damage.value.title = formattedDamage.exact;
    this.damage.value.setAttribute("aria-label", `Damage ${formattedDamage.exact}`);
    this.critical.value.textContent = criticalChance;
    this.critical.value.title = `${(playerStats.criticalChance * 100).toFixed(3)}%`;
    this.critical.value.setAttribute("aria-label", `Critical chance ${this.critical.value.title}`);
    this.penetration.value.textContent = penetration;
    this.penetration.value.title = `${(playerStats.armorPenetration * 100).toFixed(3)}%`;
    this.penetration.value.setAttribute(
      "aria-label",
      `Armor penetration ${this.penetration.value.title}`,
    );
    this.armor.value.textContent = `${rawArmor.text} raw → ${effectiveArmor.text} effective`;
    this.armor.value.title = `Raw armor ${rawArmor.exact}; effective armor ${effectiveArmor.exact}; penetration ${penetration}`;
    this.armor.value.setAttribute("aria-label", this.armor.value.title);
  }

  private createMetric(label: string): {
    readonly element: HTMLDivElement;
    readonly value: HTMLElement;
  } {
    const element = document.createElement("div");
    const name = makeText("p", label);
    const value = makeText("p", "");
    element.className = "combat-stat";
    name.className = "combat-stat-label";
    value.className = "combat-stat-value";
    element.append(name, value);
    return { element, value };
  }

  private readonly togglePause = (): void => this.pauseListener?.();
}
