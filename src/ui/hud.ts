import type { BattleSnapshot } from "../domain/snapshot";

export type Hud = { render(snapshot: BattleSnapshot): void; dispose(): void };

export const createHud = (host: HTMLElement): Hud => {
  const panel = document.createElement("section");
  panel.className = "hud";
  panel.setAttribute("aria-label", "Battle status");
  host.append(panel);
  const render = (snapshot: BattleSnapshot): void => {
    panel.replaceChildren(
      makeText("h1", "Autobattle Idle"),
      makeText("p", snapshot.encounter),
      makeText("p", `${snapshot.player.name} ${snapshot.player.health} HP`),
      makeText("p", `${snapshot.enemy.name} ${snapshot.enemy.health} HP`),
    );
  };
  return { render, dispose: () => panel.remove() };
};

const makeText = (tagName: "h1" | "p", value: string): HTMLElement => {
  const element = document.createElement(tagName);
  element.textContent = value;
  return element;
};
