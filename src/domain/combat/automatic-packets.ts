import { COMBAT_BALANCE } from "./balance";
import type { AttackEvent, CombatState } from "./contracts";
import { automaticAttackPacketMultipliers, automaticAttacksPerSecond } from "./upgrades";

export type AutomaticPacket = {
  readonly automaticBatch: boolean;
  readonly damageMultiplier: number;
};

export type AutomaticPacketSchedule = {
  readonly nextAttackAtMs: number;
  readonly packets: readonly AutomaticPacket[];
};

/** The one combat-time schedule shared by the UI controller and headless oracle. */
export const automaticPacketSchedule = (
  state: CombatState,
  atMs: number,
  attacksPerSecondMultiplier = 1,
): AutomaticPacketSchedule => {
  if (!Number.isFinite(attacksPerSecondMultiplier) || attacksPerSecondMultiplier <= 0)
    throw new RangeError("Automatic speed multiplier must be finite and positive");
  const attacksPerSecond =
    automaticAttacksPerSecond(state.player.automaticSpeedLevel) * attacksPerSecondMultiplier;
  const batched = attacksPerSecond > COMBAT_BALANCE.automaticVisualTickRate;
  const slowMs =
    state.enemy.modifier === "automatic-slow" ? COMBAT_BALANCE.eliteAutomaticSlowMs : 0;
  const cadenceMs = batched
    ? 1_000 / COMBAT_BALANCE.automaticVisualTickRate
    : 1_000 / attacksPerSecond;
  return {
    nextAttackAtMs: atMs + cadenceMs + slowMs,
    packets: (batched ? automaticAttackPacketMultipliers(attacksPerSecond) : [1]).map(
      (damageMultiplier) => ({ automaticBatch: batched, damageMultiplier }),
    ),
  };
};

export type AutomaticPacketResolution = {
  readonly events: readonly AttackEvent[];
  readonly schedule: AutomaticPacketSchedule;
  readonly state: CombatState;
};

export const resolveAutomaticPackets = (
  state: CombatState,
  atMs: number,
  resolve: (
    state: CombatState,
    packet: AutomaticPacket,
  ) => {
    readonly event: AttackEvent;
    readonly state: CombatState;
  },
): AutomaticPacketResolution => {
  const schedule = automaticPacketSchedule(state, atMs);
  let current = state;
  const events: AttackEvent[] = [];
  for (const packet of schedule.packets) {
    const result = resolve(current, packet);
    current = result.state;
    events.push(result.event);
  }
  return {
    events,
    schedule,
    state: { ...current, nextAutomaticAttackAtMs: schedule.nextAttackAtMs },
  };
};
