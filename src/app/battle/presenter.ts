import {
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeEffectPreview,
  upgradeLevel,
  type AttackEvent,
  type UpgradeId,
} from "../../domain/combat";
import {
  createBattleSnapshot,
  type BattleSnapshot,
  type BattleVisualCue,
} from "../../domain/snapshot";
import { formatNumber } from "../../ui/number-format";
import type { BattleControllerEvent, BattleUpdate } from "./contracts";

export type AttackLogComposition = {
  readonly kind: "critical" | "hit";
  readonly packets: { readonly count: number; readonly units: number };
  readonly baseDamage: number;
};

const formatMultiplier = (units: number): string => {
  const bounded = Math.round(units * 100) / 100;
  return Number.isInteger(bounded) ? String(bounded) : String(bounded).replace(/(\.\d*?)0+$/, "$1");
};

const attackMessage = (
  outcome: Extract<AttackEvent, { type: "hit" }>,
  goldenBugBefore = false,
  composition?: AttackLogComposition,
): string => {
  if (!outcome.defeated) {
    const damage = formatNumber(outcome.damage);
    if (composition === undefined || composition.packets.count <= 1)
      return `Hit: ${damage.text} damage`;
    const units = formatMultiplier(composition.packets.units);
    const baseText =
      composition.baseDamage > 0 && !Number.isInteger(composition.baseDamage)
        ? String(Math.round(composition.baseDamage * 100) / 100)
        : formatNumber(composition.baseDamage).text;
    return `Hit: ${baseText} × ${units} = ${damage.text} damage`;
  }
  const reward = formatNumber(outcome.reward);
  if (goldenBugBefore)
    return `Golden Bug reward: +${reward.text} coins${reward.text === reward.exact ? "" : ` (${reward.exact})`}`;
  return `Kill: +${reward.text} coins`;
};

export const battleEventMessages = {
  attack: (outcome: Extract<AttackEvent, { type: "hit" }>, goldenBugBefore = false): string =>
    attackMessage(outcome, goldenBugBefore),
  frame: (
    outcome: Extract<AttackEvent, { type: "hit" }> | null,
    goldenBugBefore = false,
    composition?: AttackLogComposition,
  ): string | undefined => {
    if (outcome === null) return undefined;
    return attackMessage(outcome, goldenBugBefore, composition);
  },
  purchase: (id: string, reason: string | null): string =>
    reason ?? `Purchased ${UPGRADES.find((upgrade) => upgrade.id === id)?.label ?? id}`,
  reset: (): undefined => undefined,
  restore: (): undefined => undefined,
} as const;

const upgradeEffect = (
  id: UpgradeId,
  preview: ReturnType<typeof upgradeEffectPreview>,
): { readonly exact: string; readonly text: string } | null => {
  if (preview === null) return null;
  if (preview.kind === "unlock")
    return { exact: "Unlock automatic attacks", text: "Unlock auto attack" };
  if (id === "damage") {
    const damage = formatNumber(preview.delta);
    return { exact: `+${damage.exact} damage`, text: `+${damage.text} damage` };
  }
  if (id === "automatic-speed") {
    const value = (preview.delta / 100).toFixed(2);
    return { exact: `+${value} APS`, text: `+${value} APS` };
  }
  let label = "double reward";
  if (id === "armor-penetration") label = "armor penetration";
  else if (id === "critical-chance") label = "critical chance";
  const value = (preview.delta / 10).toFixed(1);
  return { exact: `+${value}% ${label}`, text: `+${value}% ${label}` };
};

const attackVisualCue = (
  outcome: AttackEvent,
  source: "automatic" | "manual",
  packets: { readonly count: number; readonly units: number },
): BattleVisualCue[] => {
  if (outcome.type === "ignored") return [];
  const cue = (kind: "armor" | "critical" | "hit"): BattleVisualCue => ({ kind, packets, source });
  if (outcome.defeated)
    return [
      cue(outcome.critical ? "critical" : "hit"),
      "death",
      ...(outcome.reward > 0 ? (["coin"] as const) : []),
    ];
  if (outcome.critical) return [cue("critical")];
  return [cue(outcome.armorPreventedDamage > 0 ? "armor" : "hit")];
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
  const source = event.type === "attack" ? event.source : "automatic";
  const packets =
    event.type === "frame" && event.automaticReceipt !== undefined
      ? event.automaticReceipt
      : { count: 1, units: 1 };
  const cues = attackVisualCue(outcome, source, packets);
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
    UPGRADES.map((upgrade) => {
      const disabledReason = upgradeDisabledReason(update.state, upgrade.id);
      return {
        cost: upgradeCost(update.state, upgrade.id),
        disabledReason,
        effect:
          disabledReason === null || disabledReason.startsWith("Need ")
            ? upgradeEffect(upgrade.id, upgradeEffectPreview(update.state, upgrade.id))
            : null,
        id: upgrade.id,
        label: upgrade.label,
        level: upgradeLevel(update.state, upgrade.id),
      };
    }),
    update.goldenBugRemainingMs,
    event === undefined ? [] : battleVisualCues(event),
    update.automaticPaused ?? false,
    update.automaticRemainingMs,
  );
