import {
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
  type AttackEvent,
} from "../../domain/combat";
import { createBattleSnapshot, type BattleSnapshot } from "../../domain/snapshot";
import type { BattleControllerEvent, BattleUpdate } from "./contracts";

const attackMessage = (
  source: "manual" | "automatic",
  outcome: AttackEvent,
): string | undefined => {
  if (outcome.type === "ignored") return undefined;
  const label = source === "manual" ? "Manual" : "Automatic";
  return outcome.defeated
    ? `${label} kill: +${outcome.reward} coins`
    : `${label} hit: ${outcome.damage} damage`;
};

export const battleEventMessage = (event: BattleControllerEvent): string | undefined => {
  switch (event.type) {
    case "attack":
      return attackMessage(event.source, event.outcome);
    case "frame":
      return event.automaticOutcome === null
        ? undefined
        : attackMessage("automatic", event.automaticOutcome);
    case "purchase":
      return (
        event.reason ??
        `Purchased ${UPGRADES.find((upgrade) => upgrade.id === event.id)?.label ?? event.id}`
      );
    case "reset":
    case "restore":
      return undefined;
  }
  const exhaustiveEvent: never = event;
  return exhaustiveEvent;
};

export const presentBattleUpdate = (update: BattleUpdate): BattleSnapshot =>
  createBattleSnapshot(
    update.state,
    update.nowMs,
    update.events,
    UPGRADES.map((upgrade) => ({
      cost: upgradeCost(update.state, upgrade.id),
      disabledReason: upgradeDisabledReason(update.state, upgrade.id),
      id: upgrade.id,
      label: upgrade.label,
      level: upgradeLevel(update.state, upgrade.id),
    })),
  );
