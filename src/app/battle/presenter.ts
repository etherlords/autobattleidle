import {
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
  type AttackEvent,
} from "../../domain/combat";
import { createBattleSnapshot, type BattleSnapshot } from "../../domain/snapshot";
import { formatNumber } from "../../ui/number-format";
import type { BattleUpdate } from "./contracts";

const attackMessage = (
  source: "manual" | "automatic",
  outcome: AttackEvent,
): string | undefined => {
  if (outcome.type === "ignored") return undefined;
  const label = source === "manual" ? "Manual" : "Automatic";
  return outcome.defeated
    ? `${label} kill: +${formatNumber(outcome.reward).text} coins`
    : `${label} hit: ${formatNumber(outcome.damage).text} damage`;
};

export const battleEventMessages = {
  attack: attackMessage,
  frame: (outcome: AttackEvent | null): string | undefined =>
    outcome === null ? undefined : attackMessage("automatic", outcome),
  purchase: (id: string, reason: string | null): string =>
    reason ?? `Purchased ${UPGRADES.find((upgrade) => upgrade.id === id)?.label ?? id}`,
  reset: (): undefined => undefined,
  restore: (): undefined => undefined,
} as const;

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
    update.goldenBugRemainingMs,
  );
