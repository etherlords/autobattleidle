import {
  fastForwardProgression,
  simulateProgression,
  summarizeTelemetry,
} from "./progression-simulator";
import {
  attack,
  automaticAttacksPerSecond,
  automaticPacketSchedule,
  bossEncounterForOrdinal,
  bossGapForOrdinal,
  createCombatState,
  damageForLevel,
  expireGoldenBug,
  spawnEnemy,
  spawnGoldenBug,
  type AttackEvent,
  type CombatPlayer,
  type CombatState,
} from "./combat";
import type { ProgressionObservation, SimulationOptions } from "./progression-simulator";
const BOSS_TTK_STAGE_PROBES = {
  starter: bossEncounterForOrdinal(1),
  early: bossEncounterForOrdinal(2),
  midgame: bossEncounterForOrdinal(10),
  endgameStart: bossEncounterForOrdinal(32),
  endgame: bossEncounterForOrdinal(1_000),
} as const;

const run = (
  manualIntervalMs: number | null,
  ordinaryHealthGrowthRate?: number,
  ordinaryEncounters = 3_000,
  alternatives: Pick<
    SimulationOptions,
    | "automaticSpeedLevel"
    | "automaticSpeedMultiplier"
    | "armorPenetrationLevel"
    | "armorPenetrationPolicy"
    | "bossInterval"
    | "criticalRoll"
    | "criticalChancePolicy"
    | "damageMultiplier"
    | "doubleRewardRoll"
    | "eventJump"
    | "upgradeCostMultiplier"
  > = {},
) => {
  const report = simulateProgression({
    bossCount: 0,
    manualIntervalMs,
    ordinaryEncounters,
    ...alternatives,
    ...(ordinaryHealthGrowthRate === undefined ? {} : { ordinaryHealthGrowthRate }),
  });
  return {
    automaticAttacks: report.automaticAttacks,
    coins: report.coins,
    evaluatedOrdinaryEncounters: ordinaryEncounters,
    elapsedMs: report.elapsedMs,
    manualAttacks: report.manualAttacks,
    penetration: report.penetration,
    purchases: report.purchases,
    telemetry: summarizeTelemetry(report),
  };
};

let cachedMeasuredReport: Record<string, unknown> | undefined;

/**
 * The report's high-APS manual probe is a deterministic fixture, not a balance
 * change: its command-only multiplier keeps a 10Hz click sequence within the
 * existing ten-second Golden Bug window.
 */
const HIGH_APS_GOLDEN_BUG_MANUAL_DAMAGE_MULTIPLIER = 1.75;

const goldenBugOutcome = (
  player: CombatPlayer,
  manualIntervalMs: number | null,
  manualDamageMultiplier = 1, // eslint-disable-next-line complexity -- preserves the production packet/event sequence in one measured scenario.
) => {
  let state: CombatState = {
    ...createCombatState(player, 0, true),
    enemy: spawnGoldenBug(2_001, player),
    goldenBug: { id: 2_000, resumeEncounter: 2_001 },
    nextAutomaticAttackAtMs: 0,
  };
  const events: Extract<AttackEvent, { readonly type: "hit" }>[] = [];
  let nextAutomaticAtMs = 0;
  let nextManualAtMs = manualIntervalMs === null ? Infinity : 0;
  let manualClicks = 0;
  while (state.goldenBug !== null && Math.min(nextAutomaticAtMs, nextManualAtMs) < 10_000) {
    const automatic = nextAutomaticAtMs <= nextManualAtMs;
    const atMs = automatic ? nextAutomaticAtMs : nextManualAtMs;
    if (!automatic) {
      manualClicks += 1;
      nextManualAtMs += manualIntervalMs ?? Infinity;
    }
    const schedule = automatic ? automaticPacketSchedule(state, atMs) : undefined;
    const packets = schedule?.packets ?? [{ automaticBatch: false, damageMultiplier: 1 }];
    for (const packet of packets) {
      if (state.goldenBug === null) break;
      const result = attack(state, {
        atMs,
        automaticBatch: packet.automaticBatch,
        damageMultiplier: automatic ? packet.damageMultiplier : manualDamageMultiplier,
        enemyId: state.enemy.id,
        rolls: {
          critical: 0.99,
          doubleReward: 0.99,
          nextEliteModifier: 0,
        },
        source: automatic ? "automatic" : "manual",
      });
      if (result.event.type === "hit") events.push(result.event);
      state = result.state;
    }
    if (automatic) {
      nextAutomaticAtMs = schedule?.nextAttackAtMs ?? nextAutomaticAtMs;
      state = { ...state, nextAutomaticAttackAtMs: nextAutomaticAtMs };
    }
  }
  const escaped = state.goldenBug !== null;
  if (escaped) state = expireGoldenBug(state);
  return {
    packets: events.length,
    damage: events.reduce((total, event) => total + event.damage, 0),
    defeatsGoldenBug: events.some((event) => event.defeated),
    escaped,
    manualClicks,
    reward: events.reduce((total, event) => total + event.reward, 0),
    state: { coins: state.coins, goldenBugDefeats: state.goldenBugDefeats },
  };
};

const outcomes = (report: ReturnType<typeof fastForwardProgression>) => {
  const total = (values: readonly number[]): number =>
    values.reduce((sum, value) => sum + value, 0);
  const cohort = (predicate: (value: ProgressionObservation) => boolean) => {
    const values = report.observations.filter(predicate);
    return {
      count: values.length,
      hits: total(values.map(({ hits }) => hits)),
      rewards: total(values.map(({ reward }) => reward)),
    };
  };
  return {
    boss: cohort(({ grade, goldenBug }) => grade === "boss" && !goldenBug),
    goldenBug: cohort(({ goldenBug }) => goldenBug),
    ordinary: cohort(({ grade, goldenBug }) => grade !== "boss" && !goldenBug),
  };
};

const timeDistribution = (values: readonly ProgressionObservation[]) => {
  const times = values.map(({ timeToKillMs }) => timeToKillMs).sort((left, right) => left - right);
  const at = (fraction: number) => times[Math.floor((times.length - 1) * fraction)] ?? 0;
  return { max: times.at(-1) ?? 0, p50: at(0.5), p90: at(0.9) };
};

const bossTtkStages = () => {
  const stages = Object.entries(BOSS_TTK_STAGE_PROBES) as readonly [
    keyof typeof BOSS_TTK_STAGE_PROBES,
    number,
  ][];
  const snapshots = simulateProgression({
    eventJump: true,
    horizonMs: 60 * 60 * 60 * 1_000,
    playerSnapshotEncounters: stages.map(([, encounter]) => encounter),
  }).playerSnapshots;
  const playerAt = new Map(snapshots.map(({ encounter, player }) => [encounter, player]));
  const measure = (
    encounter: number,
    automaticEnabled: boolean,
    manualIntervalMs: number | null,
  ) => {
    const player = playerAt.get(encounter);
    if (player === undefined)
      throw new Error(`Missing production player snapshot for boss ${encounter}`);
    const observation = simulateProgression({
      automaticEnabled,
      bossCount: 1,
      eventJump: true,
      initialPlayer: player,
      manualIntervalMs,
      startEncounter: encounter,
    }).observations.find(({ grade, goldenBug }) => grade === "boss" && !goldenBug);
    if (observation === undefined) throw new Error(`Missing boss TTK receipt for ${encounter}`);
    return { hits: observation.hits, timeToKillMs: observation.timeToKillMs };
  };
  return Object.fromEntries(
    stages.map(([stage, encounter]) => [
      stage,
      {
        automaticOnly: measure(encounter, true, null),
        combined: measure(encounter, true, 100),
        encounter,
        manualOnly: measure(encounter, false, 100),
      },
    ]),
  );
};

export const buildMeasuredReport = (): Record<string, unknown> => {
  if (cachedMeasuredReport !== undefined) return cachedMeasuredReport;
  const reference = simulateProgression({ bossCount: 3 });
  const bosses = reference.bosses;
  const referenceTelemetry = summarizeTelemetry(reference);
  const hours = [1, 4, 8, 24, 48, 49] as const;
  const endgameStart = fastForwardProgression(48 * 60 * 60 * 1_000);
  const firstTenGaps = Array.from({ length: 10 }, (_, index) => bossGapForOrdinal(index + 1));
  const fortyEightHourGaps = endgameStart.bosses
    .slice(1)
    .map((boss, index) => boss.encounter - (endgameStart.bosses[index]?.encounter ?? 0));
  const damage = damageForLevel(endgameStart.player.damageLevel ?? endgameStart.player.damage - 1);
  const normal = spawnEnemy(1_999, 0, undefined, endgameStart.player);
  const veteran = spawnEnemy(2_000, 0, undefined, endgameStart.player);
  const elite = spawnEnemy(2_001, 0.34, undefined, endgameStart.player);
  const boss = spawnEnemy(bossEncounterForOrdinal(60), 0, undefined, endgameStart.player);
  const golden = spawnGoldenBug(2_001, endgameStart.player);
  const highApsPlayer = { ...endgameStart.player, automaticSpeedLevel: 1_000 };
  const highApsGoldenAutoOnly = goldenBugOutcome(highApsPlayer, null);
  const highApsGoldenManualPlusAutomatic = goldenBugOutcome(
    highApsPlayer,
    100,
    HIGH_APS_GOLDEN_BUG_MANUAL_DAMAGE_MULTIPLIER,
  );
  const bossTtk = bossTtkStages();
  const report = {
    acceptedHealth: {
      boss: {
        automaticTargetSeconds: 180,
        postArmorNonCriticalThirtyHitFloor: 30,
        legacyStageCeiling: true,
      },
      ordinaryTargetHits: { elite: 10, normal: 1, veteran: 5 },
    },
    bossGaps: firstTenGaps.slice(1),
    cadence: {
      bossGapBounds: {
        min: Math.min(...firstTenGaps),
        max: Math.max(...firstTenGaps),
      },
      firstThreeGaps: bosses.slice(0, 3).map(({ gap }) => gap),
      firstTenGaps,
      fortyEightHourGaps,
      bossAffinities: referenceTelemetry.bossAffinities,
      bossRepeatStreaks: referenceTelemetry.bossRepeatStreaks,
      bossVariants: referenceTelemetry.bossVariants,
    },
    bosses,
    bossTtk,
    briefRevision: 19,
    candidates: Object.fromEntries(
      [0.005, 0.008].map((rate) => {
        const measured = run(null, rate, 3_000, { eventJump: true });
        const reasons = [
          ...(measured.telemetry.walls > 0 ? ["walls"] : []),
          ...(measured.telemetry.adjacentMedianJump > 2 ? ["adjacentMedianJump"] : []),
          ...Object.values(measured.telemetry.bands).flatMap(({ hits }) =>
            hits.fivePlusFraction < 0.2 || hits.tenPlusFraction < 0.05 ? ["bandFractions"] : [],
          ),
        ];
        return [
          `exponential${rate === 0.005 ? "005" : "008"}`,
          { ...measured, accepted: false, rejectionReasons: reasons },
        ];
      }),
    ),
    alternatives: {
      cadence: {
        input: { bossInterval: 50 },
        measured: run(null, undefined, 3_000, { bossInterval: 50, eventJump: true }),
        reason: "rejected: fixed-interval override is not the production seeded cadence",
      },
      damage: {
        input: { damageMultiplier: 1.25 },
        measured: run(null, undefined, 3_000, { damageMultiplier: 1.25, eventJump: true }),
        reason: "rejected: production damage formula remains the player-derived reference",
      },
      attackSpeed: {
        input: { automaticSpeedMultiplier: 1.25 },
        measured: run(null, undefined, 3_000, {
          automaticSpeedMultiplier: 1.25,
          eventJump: true,
        }),
        reason: "rejected: visual presentation remains bounded to three ticks per second",
      },
      critical: {
        input: { criticalChancePolicy: "linear-capped" },
        measured: run(100, undefined, 3_000, {
          criticalChancePolicy: "linear-capped",
          eventJump: true,
        }),
        reason: "rejected: linear capped critical chance changes the retained asymptotic curve",
      },
      penetration: {
        input: { armorPenetrationPolicy: "linear-capped" },
        measured: run(100, undefined, 3_000, {
          armorPenetrationPolicy: "linear-capped",
          eventJump: true,
        }),
        reason: "rejected: linear capped penetration changes the retained asymptotic curve",
      },
      reward: {
        input: { doubleRewardRoll: 0 },
        measured: run(100, undefined, 3_000, { doubleRewardRoll: 0, eventJump: true }),
        reason: "rejected: guaranteed double rewards change the retained economy",
      },
      upgradeCost: {
        input: { upgradeCostMultiplier: 0.8 },
        measured: run(null, undefined, 3_000, { eventJump: true, upgradeCostMultiplier: 0.8 }),
        reason: "rejected: lower costs trivialize the retained sequential upgrade economy",
      },
    },
    combinedWalls: run(null, undefined, 3_000, { eventJump: true }).telemetry.walls,
    endgameStartCalibration: {
      damage,
      goldenBug: { health: golden.maxHealth, hits: Math.ceil(golden.maxHealth / damage) },
      boss: { health: boss.maxHealth, hits: Math.ceil(boss.maxHealth / damage) },
      ordinary: {
        elite: { health: elite.maxHealth, hits: Math.ceil(elite.maxHealth / damage) },
        normal: { health: normal.maxHealth, hits: Math.ceil(normal.maxHealth / damage) },
        veteran: { health: veteran.maxHealth, hits: Math.ceil(veteran.maxHealth / damage) },
      },
    },
    highApsGoldenBug: {
      automaticOnly: {
        ...highApsGoldenAutoOnly,
      },
      manualPlusAutomatic: {
        ...highApsGoldenManualPlusAutomatic,
      },
      manualDamageMultiplier: HIGH_APS_GOLDEN_BUG_MANUAL_DAMAGE_MULTIPLIER,
      health: spawnGoldenBug(2_001, highApsPlayer).maxHealth,
    },
    realTimeBands: hours.map((hours) => {
      const report = fastForwardProgression(hours * 60 * 60 * 1_000);
      return {
        automaticAttacksPerSecond: automaticAttacksPerSecond(report.player.automaticSpeedLevel),
        coins: report.coins,
        elapsedMs: report.elapsedMs,
        encounters: report.encounters,
        encountersPerSecond: report.encounters / (report.elapsedMs / 1_000),
        economy: {
          doubleRewardIncome: report.doubleRewardIncome,
          income: report.observations.reduce((total, observation) => total + observation.reward, 0),
          saturation: report.coins === Number.MAX_SAFE_INTEGER,
          spend: report.spend,
          unaffordableGaps: report.unaffordableGaps,
          unspent: report.coins,
        },
        hours,
        outcomes: outcomes(report),
        player: report.player,
        purchases: report.purchases,
        telemetry: {
          boss: {
            cadenceContributionMs: summarizeTelemetry(report).bossOnlyElapsedMs,
            gaps: summarizeTelemetry(report).bossGaps,
            hits: report.byGrade.boss,
            timeToKillMs: timeDistribution(
              report.observations.filter(({ grade }) => grade === "boss"),
            ),
          },
          goldenBug: {
            delayMs: report.goldenBugDelayMs,
            outcomes: outcomes(report).goldenBug,
          },
          ordinary: summarizeTelemetry(report),
        },
      };
    }),
    persistenceImpact: "no-schema-change",
    taskId: "ABI-029",
  };
  cachedMeasuredReport = report;
  return report;
};
