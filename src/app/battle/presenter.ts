import {
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
  type AttackEvent,
} from "../../domain/combat";
import {
  createBattleSnapshot,
  type BattleSnapshot,
  type BattleVisualCue,
} from "../../domain/snapshot";
import { formatNumber } from "../../ui/number-format";
import type { BattleControllerEvent, BattleUpdate } from "./contracts";

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

const attackVisualCue = (outcome: AttackEvent): BattleVisualCue[] => {
  if (outcome.type === "ignored") return [];
  if (outcome.defeated)
    return [
      outcome.critical ? "critical" : "hit",
      "death",
      ...(outcome.reward > 0 ? (["coin"] as const) : []),
    ];
  if (outcome.critical) return ["critical"];
  return outcome.armorPreventedDamage > 0 ? ["armor"] : ["hit"];
};

const eventOutcome = (event: BattleControllerEvent): AttackEvent | null => {
  if (event.type === "attack") return event.outcome;
  return event.type === "frame" ? event.automaticOutcome : null;
};

const defeatVisualCues = (
  event: BattleControllerEvent,
  cues: BattleVisualCue[],
): BattleVisualCue[] => {
  if (event.type !== "attack" && event.type !== "frame") return cues;
  if (event.previousEnemy?.grade === "boss" || event.state.enemy.grade === "boss")
    cues.push("boss");
  if (event.goldenBugBefore) cues.push("golden-kill");
  return cues;
};

export const battleVisualCues = (event: BattleControllerEvent): readonly BattleVisualCue[] => {
  if (event.type === "frame" && event.goldenBugEscaped) return ["golden-escape"];
  const outcome = eventOutcome(event);
  if (outcome === null || outcome.type === "ignored") return [];
  const cues = attackVisualCue(outcome);
  return outcome.defeated ? defeatVisualCues(event, cues) : cues;
};

export const presentBattleUpdate = (
  update: BattleUpdate,
  event?: BattleControllerEvent,
): BattleSnapshot =>
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
    event === undefined ? [] : battleVisualCues(event),
  );
