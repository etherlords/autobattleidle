import type { EnemyFamily } from "../../domain/combat";
import type { BattleSnapshot } from "../../domain/snapshot";
import { formatNumber } from "../number-format";
import { makeText } from "./elements";
const familyLabels: Readonly<Partial<Record<EnemyFamily, string>>> = {
  "boss-catbug": "Catbug",
  "boss-colossus": "Colossus",
  "boss-evil-catbug": "Evil Catbug",
  "boss-goose-hydra": "Goose Hydra",
  "boss-hydra": "Hydra",
};

export class BossRoadmap {
  readonly element = document.createElement("section");
  private readonly current = makeText("p", "");
  private readonly next = makeText("p", "");

  constructor() {
    this.element.className = "boss-roadmap";
    this.element.setAttribute("aria-label", "Goals and boss roadmap");
    this.current.className = "boss-roadmap-current";
    this.next.className = "boss-roadmap-next";
    this.element.append(this.current, this.next);
  }

  render(snapshot: BattleSnapshot): void {
    const encounter = formatNumber(snapshot.enemy.level);
    this.current.textContent = `Current: Encounter ${encounter.text} · ${snapshot.enemy.grade}`;
    const target = snapshot.roadmap?.nextBoss;
    const remaining = snapshot.roadmap?.encountersRemaining;
    if (target === null || target === undefined || remaining === null || remaining === undefined) {
      this.next.textContent = "Boss roadmap complete";
      return;
    }
    const bossEncounter = formatNumber(target.encounter);
    const family = familyLabels[target.family] ?? target.family;
    this.next.textContent = `Next boss: #${target.ordinal} ${family} · Encounter ${bossEncounter.text} · ${formatNumber(remaining).text} encounters remaining`;
  }

  dispose(): void {
    this.element.remove();
  }
}
