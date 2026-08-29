import {
  attack,
  createCombatState,
  expireGoldenBug,
  purchaseUpgrade,
  type CombatState,
  type UpgradeId,
} from "./combat";

export type BossEncounter = { readonly encounter: number; readonly elapsedMs: number };
export type ProgressionReport = {
  readonly armorPreventedDamage: number;
  readonly bosses: readonly BossEncounter[];
  readonly coins: number;
  readonly elapsedMs: number;
  readonly encounters: number;
  readonly manualAttacks: number;
  readonly automaticAttacks: number;
  readonly penetration: number;
  readonly purchases: Readonly<Record<UpgradeId, number>>;
};

const upgradeOrder: readonly UpgradeId[] = [
  "damage",
  "armor-penetration",
  "automatic-speed",
  "critical-chance",
  "double-reward",
];
const emptyPurchases = (): Record<UpgradeId, number> => ({
  "automatic-unlock": 0,
  "automatic-speed": 0,
  "armor-penetration": 0,
  "critical-chance": 0,
  damage: 0,
  "double-reward": 0,
});

// eslint-disable-next-line complexity -- the simulator intentionally mirrors bounded combat decisions.
export const simulateProgression = (bossCount = 3): ProgressionReport => {
  let state: CombatState = { ...createCombatState({}, 0, false), coins: 1 };
  let elapsedMs = 0;
  let automaticAttacks = 0;
  let armorPreventedDamage = 0;
  let penetration = 0;
  let goldenBugDeadlineMs: number | undefined;
  const purchases = emptyPurchases();
  const unlocked = purchaseUpgrade(state, "automatic-unlock", elapsedMs);
  if (unlocked.reason !== null) throw new Error(unlocked.reason);
  state = unlocked.state;
  purchases["automatic-unlock"] = 1;
  const bosses: BossEncounter[] = [];
  while (bosses.length < bossCount && elapsedMs < 86_400_000) {
    if (goldenBugDeadlineMs !== undefined && goldenBugDeadlineMs <= state.nextAutomaticAttackAtMs) {
      elapsedMs = goldenBugDeadlineMs;
      state = expireGoldenBug(state);
      goldenBugDeadlineMs = undefined;
      continue;
    }
    elapsedMs = state.nextAutomaticAttackAtMs;
    const wasGoldenBug = state.goldenBug !== null;
    const result = attack(state, {
      atMs: elapsedMs,
      enemyId: state.enemy.id,
      rolls: { critical: 0.25, doubleReward: 0.25, nextEliteModifier: 0 },
      source: "automatic",
    });
    if (result.event.type === "ignored") throw new Error("Automatic progression stalled");
    automaticAttacks += 1;
    armorPreventedDamage += result.event.armorPreventedDamage;
    penetration = result.event.penetration;
    const wasBoss = state.enemy.grade === "boss" && result.event.defeated;
    state = result.state;
    if (state.goldenBug !== null) goldenBugDeadlineMs = elapsedMs + 10_000;
    if (wasBoss) bosses.push({ encounter: state.enemy.encounter - 1, elapsedMs });
    if (result.event.defeated && !wasGoldenBug) {
      for (const id of upgradeOrder) {
        const purchase = purchaseUpgrade(state, id, elapsedMs);
        if (purchase.reason === null) {
          purchases[id] += 1;
          state = purchase.state;
          break;
        }
      }
    }
  }
  if (bosses.length !== bossCount) throw new Error("Progression did not reach requested bosses");
  return {
    armorPreventedDamage,
    automaticAttacks,
    bosses,
    coins: state.coins,
    elapsedMs,
    encounters: state.enemy.encounter,
    manualAttacks: 0,
    penetration,
    purchases,
  };
};
