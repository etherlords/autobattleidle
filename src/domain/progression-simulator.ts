import {
  attack,
  automaticPacketSchedule,
  createCombatState,
  expireGoldenBug,
  purchaseUpgrade,
  spawnEnemy,
  effectiveArmor,
  type CombatPlayer,
  type CombatState,
  type CombatEnemy,
  type ArmorPenetrationPolicy,
  type CriticalChancePolicy,
  type EliteModifier,
  type EnemyGrade,
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
  readonly player: CombatPlayer;
  /** Requested production player snapshots captured when the named encounter actually spawns. */
  readonly playerSnapshots: readonly {
    readonly encounter: number;
    readonly player: CombatPlayer;
  }[];
  readonly automaticAttacks: number;
  readonly penetration: number;
  readonly purchases: Readonly<Record<UpgradeId, number>>;
  readonly spend: Readonly<Record<UpgradeId, number>>;
  readonly unaffordableGaps: number;
  readonly doubleRewardIncome: number;
  readonly goldenBugDelayMs: number;
  /** Final production state: used to prove exact-oracle/event-jump equivalence. */
  readonly state: CombatState;
};

export type ProgressionObservation = {
  readonly encounter: number;
  readonly grade: EnemyGrade;
  readonly modifier: EliteModifier | null;
  readonly automaticHits: number;
  readonly manualHits: number;
  readonly hits: number;
  readonly timeToKillMs: number;
  readonly armorRaw: number;
  readonly armorEffective: number;
  readonly armorPreventedDamage: number;
  readonly minimumDamageHits: number;
  readonly reward: number;
  readonly goldenBug: boolean;
};

/** Exact per-enemy receipt for player-facing TTK: raw events and logical attack units stay distinct. */
export type TtkObservation = {
  readonly encounter: number;
  readonly grade: EnemyGrade;
  readonly modifier: EliteModifier | null;
  readonly packetEvents: number;
  readonly effectiveAttackUnits: number;
  readonly goldenBug: boolean;
};
/**
 * Keep logical units as integer micro-units while a fight is in progress.
 * A batch fast-forward can then add exactly the same value as the individual
 * production packets it replaces.
 */
type TtkAccumulator = Omit<TtkObservation, "effectiveAttackUnits"> & {
  readonly effectiveAttackMicroUnits: number;
  readonly startedAtMs: number;
};

export type Distribution = {
  readonly count: number;
  readonly p50: number;
  readonly p90: number;
  readonly max: number;
  readonly oneHitFraction: number;
  readonly fivePlusFraction: number;
  readonly tenPlusFraction: number;
};

export type SimulationOptions = {
  /** Disables the production automatic source for a manual-only measurement. */
  readonly automaticEnabled?: boolean;
  /** Reuses a production-derived player snapshot for a bounded stage probe. */
  readonly initialPlayer?: CombatPlayer;
  /** Explicit measured alternative inputs; omitted keeps the production reference. */
  readonly automaticSpeedLevel?: number;
  /** Multiplies derived APS only for a measured scheduler alternative. */
  readonly automaticSpeedMultiplier?: number;
  readonly bossCount?: number;
  /** Alternate production cadence used by the simulator's real spawn path. */
  readonly bossInterval?: number;
  readonly criticalRoll?: number;
  /** Alternative formula applied by production `attack`; default remains asymptotic. */
  readonly criticalChancePolicy?: CriticalChancePolicy;
  readonly doubleRewardRoll?: number;
  /** Multiplies the resolved production attack damage for a measured formula alternative. */
  readonly damageMultiplier?: number;
  /** Reuses deterministic automatic-hit outcomes to jump long measured candidate walls. */
  readonly eventJump?: boolean;
  readonly armorPenetrationLevel?: number;
  /** Alternative formula applied by production `attack`; default remains asymptotic. */
  readonly armorPenetrationPolicy?: ArmorPenetrationPolicy;
  /** `null` runs the separate automatic-only telemetry reference. */
  readonly manualIntervalMs?: number | null;
  readonly ordinaryHealthGrowthRate?: number;
  readonly ordinaryEncounters?: number;
  /** Starts a bounded receipt at one production encounter without changing its spawn formula. */
  readonly startEncounter?: number;
  /** Captures player state at exact production encounter spawns during this same run. */
  readonly playerSnapshotEncounters?: readonly number[];
  /** Keeps legacy ordinary-only receipts narrow; stage probes keep intervening bosses. */
  readonly skipBosses?: boolean;
  /** Multiplies real upgrade prices for a measured economy alternative. */
  readonly upgradeCostMultiplier?: number;
  /** Stops at this real elapsed-time horizon without simulating idle milliseconds. */
  readonly horizonMs?: number;
};

export type MeasuredProgressionReport = ProgressionReport & {
  readonly observations: readonly ProgressionObservation[];
  readonly ttkObservations: readonly TtkObservation[];
  readonly byGrade: Readonly<Record<EnemyGrade, Distribution>>;
  readonly ordinaryWallsOver60Seconds: number;
};

type TelemetryBands = Readonly<
  Record<
    "encounters100To149" | "encounters1000To1099",
    { readonly hits: Distribution; readonly timeToKillMs: Distribution }
  >
>;
export type OrdinaryTtkStage =
  "early" | "startPlus" | "lateStart" | "midgame" | "endgameStart" | "endgame";
type OrdinaryTtkBands = Readonly<Record<OrdinaryTtkStage, Distribution>>;
export type TelemetrySummary = {
  readonly bands: TelemetryBands;
  readonly grades: Readonly<Record<EnemyGrade, Distribution>>;
  readonly gradeTimeToKillMs: Readonly<Record<EnemyGrade, Distribution>>;
  readonly modifiers: Readonly<Record<EliteModifier, Distribution>>;
  readonly modifierTimeToKillMs: Readonly<Record<EliteModifier, Distribution>>;
  /** Transition counts keep long 3,000-encounter receipts compact and reproducible. */
  readonly gradeTransitions: Readonly<Record<string, number>>;
  readonly bossGaps: readonly number[];
  readonly bossOnlyElapsedMs: number;
  readonly walls: number;
  readonly adjacentMedianJump: number;
  readonly armor: {
    readonly raw: number;
    readonly effective: number;
    readonly prevented: number;
    readonly minimumDamageFraction: number;
  };
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
const grades = ["normal", "veteran", "elite", "boss"] as const;
const modifierRolls = [0, 1 / 3, 2 / 3, 3 / 4, 5 / 6, 11 / 12] as const;
const modifierRollForEncounter = (encounter: number): number =>
  modifierRolls[Math.floor((encounter - 1) / 3) % modifierRolls.length] ?? 0;
const emptyDistribution = (): Distribution => ({
  count: 0,
  p50: 0,
  p90: 0,
  max: 0,
  oneHitFraction: 0,
  fivePlusFraction: 0,
  tenPlusFraction: 0,
});
const distribution = (
  observations: readonly ProgressionObservation[],
  value: (observation: ProgressionObservation) => number = ({ hits }) => hits,
): Distribution => {
  if (observations.length === 0) return emptyDistribution();
  const hits = observations.map(value).sort((left, right) => left - right);
  const percentile = (fraction: number): number =>
    hits[Math.floor((hits.length - 1) * fraction)] ?? 0;
  return {
    count: observations.length,
    p50: percentile(0.5),
    p90: percentile(0.9),
    max: hits.at(-1) ?? 0,
    oneHitFraction:
      observations.filter(({ hits: value }) => value === 1).length / observations.length,
    fivePlusFraction:
      observations.filter(({ hits: value }) => value >= 5).length / observations.length,
    tenPlusFraction:
      observations.filter(({ hits: value }) => value >= 10).length / observations.length,
  };
};

const effectiveDistribution = (observations: readonly TtkObservation[]): Distribution => {
  if (observations.length === 0) return emptyDistribution();
  const units = observations
    .map(({ effectiveAttackUnits }) => effectiveAttackUnits)
    .sort((left, right) => left - right);
  const at = (fraction: number): number => units[Math.floor((units.length - 1) * fraction)] ?? 0;
  return {
    count: units.length,
    p50: at(0.5),
    p90: at(0.9),
    max: units.at(-1) ?? 0,
    oneHitFraction: units.filter((value) => value === 1).length / units.length,
    fivePlusFraction: units.filter((value) => value >= 5).length / units.length,
    tenPlusFraction: units.filter((value) => value >= 10).length / units.length,
  };
};

const roundedElapsedMs = (value: number): number => Math.round(value * 1_000) / 1_000;
const ATTACK_UNIT_SCALE = 1_000_000;
const attackUnitsToMicroUnits = (units: number): number => Math.round(units * ATTACK_UNIT_SCALE);
const microUnitsToAttackUnits = (microUnits: number): number => microUnits / ATTACK_UNIT_SCALE;

/** ABI-028's fixed product stages; endgame begins at ABI-020's 48-hour encounter receipt. */
export const ORDINARY_TTK_STAGE_CONTRACT = [
  ["early", 1, 99],
  ["startPlus", 100, 499],
  ["lateStart", 500, 999],
  ["midgame", 1_000, 9_999],
  ["endgameStart", 10_000, 24_919],
  ["endgame", 24_920, Number.MAX_SAFE_INTEGER],
] as const satisfies readonly (readonly [OrdinaryTtkStage, number, number])[];

const firstOrdinaryEncounterAtOrAfter = (encounter: number): number =>
  spawnEnemy(encounter, 0).grade === "boss" ? encounter + 1 : encounter;

/** Actual production probe starts: never seed an ordinary TTK receipt from a boss encounter. */
export const ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS: Readonly<Record<OrdinaryTtkStage, number>> =
  Object.fromEntries(
    ORDINARY_TTK_STAGE_CONTRACT.map(([stage, startEncounter]) => [
      stage,
      firstOrdinaryEncounterAtOrAfter(startEncounter),
    ]),
  ) as Record<OrdinaryTtkStage, number>;

export const summarizeOrdinaryTtkBands = (report: MeasuredProgressionReport): OrdinaryTtkBands => {
  const ordinary = report.ttkObservations.filter(
    ({ grade, goldenBug }) => grade !== "boss" && !goldenBug,
  );
  return Object.fromEntries(
    ORDINARY_TTK_STAGE_CONTRACT.map(([stage, from, to]) => [
      stage,
      effectiveDistribution(
        ordinary.filter(({ encounter }) => encounter >= from && encounter <= to),
      ),
    ]),
  ) as OrdinaryTtkBands;
};

export const measureOrdinaryTtkStages = (
  options: Omit<
    SimulationOptions,
    "bossCount" | "initialPlayer" | "ordinaryEncounters" | "startEncounter"
  > & { readonly stagePlayers: Readonly<Record<OrdinaryTtkStage, CombatPlayer>> },
): OrdinaryTtkBands =>
  Object.fromEntries(
    ORDINARY_TTK_STAGE_CONTRACT.map(([stage]) => {
      const receipt = simulateProgression({
        ...options,
        bossCount: 0,
        eventJump: true,
        initialPlayer: options.stagePlayers[stage],
        ordinaryEncounters: 3,
        skipBosses: false,
        startEncounter: ORDINARY_TTK_STAGE_PROBE_ENCOUNTERS[stage],
      });
      return [stage, summarizeOrdinaryTtkBands(receipt)[stage]];
    }),
  ) as OrdinaryTtkBands;

export const summarizeTelemetry = (report: MeasuredProgressionReport): TelemetrySummary => {
  const ordinary = report.observations.filter(
    ({ grade, goldenBug }) => grade !== "boss" && !goldenBug,
  );
  const modifiers = Object.fromEntries(
    modifierRolls.map((roll) => {
      const modifier = spawnEnemy(3, roll).modifier;
      if (modifier === null) throw new Error("Expected elite modifier");
      return [modifier, distribution(ordinary.filter((value) => value.modifier === modifier))];
    }),
  ) as Record<EliteModifier, Distribution>;
  const modifierTimeToKillMs = Object.fromEntries(
    modifierRolls.map((roll) => {
      const modifier = spawnEnemy(3, roll).modifier;
      if (modifier === null) throw new Error("Expected elite modifier");
      return [
        modifier,
        distribution(
          ordinary.filter((value) => value.modifier === modifier),
          ({ timeToKillMs }) => timeToKillMs,
        ),
      ];
    }),
  ) as Record<EliteModifier, Distribution>;
  const gradeTimeToKillMs = Object.fromEntries(
    grades.map((grade) => [
      grade,
      distribution(
        report.observations.filter((value) => value.grade === grade && !value.goldenBug),
        ({ timeToKillMs }) => timeToKillMs,
      ),
    ]),
  ) as Record<EnemyGrade, Distribution>;
  const gradeTransitions = ordinary
    .slice(1)
    .reduce<Record<string, number>>((counts, value, index) => {
      const previous = ordinary[index];
      if (previous !== undefined && previous.grade !== value.grade) {
        const key = `${previous.grade}->${value.grade}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return counts;
    }, {});
  const bosses = report.observations.filter(({ grade }) => grade === "boss");
  const bands = [100, 150, 200, 500, 1000, 1100].map(
    (at) =>
      distribution(ordinary.filter((value) => value.encounter >= at && value.encounter < at + 50))
        .p50,
  );
  const jumps = bands.slice(1).map((value, index) => value / Math.max(1, bands[index] ?? 1));
  return {
    adjacentMedianJump: Math.max(...jumps, 0),
    armor: {
      minimumDamageFraction:
        ordinary.reduce((total, value) => total + value.minimumDamageHits, 0) /
        Math.max(
          1,
          ordinary.reduce((total, value) => total + value.hits, 0),
        ),
      prevented: ordinary.reduce((total, value) => total + value.armorPreventedDamage, 0),
      effective: ordinary.reduce((total, value) => total + value.armorEffective, 0),
      raw: ordinary.reduce((total, value) => total + value.armorRaw, 0),
    },
    bands: Object.fromEntries(
      (
        [
          ["encounters100To149", 100, 149],
          ["encounters1000To1099", 1000, 1099],
        ] as const
      ).map(([name, from, to]) => {
        const values = ordinary.filter(({ encounter }) => encounter >= from && encounter <= to);
        return [
          name,
          {
            hits: distribution(values),
            timeToKillMs: distribution(values, ({ timeToKillMs }) => timeToKillMs),
          },
        ];
      }),
    ) as TelemetryBands,
    grades: report.byGrade,
    gradeTimeToKillMs,
    modifiers,
    modifierTimeToKillMs,
    gradeTransitions,
    bossGaps: bosses
      .slice(1)
      .map((boss, index) => boss.encounter - (bosses[index]?.encounter ?? boss.encounter)),
    bossOnlyElapsedMs: bosses.reduce((total, boss) => total + boss.timeToKillMs, 0),
    walls: report.ordinaryWallsOver60Seconds,
  };
};

/* eslint-disable max-depth -- the event-jump keeps production event ordering in one bounded loop. */
const runProgression = (
  input: number | SimulationOptions = 3,
  eventJump = false,
  // eslint-disable-next-line complexity -- the simulator intentionally mirrors bounded combat decisions.
): MeasuredProgressionReport => {
  const options = typeof input === "number" ? { bossCount: input } : input;
  const bossCount = options.bossCount ?? 3;
  const ordinaryEncounters = options.ordinaryEncounters ?? 0;
  const horizonMs = options.horizonMs;
  const manualIntervalMs = options.manualIntervalMs ?? null;
  const automaticEnabled = options.automaticEnabled ?? true;
  const skipBosses = options.skipBosses ?? true;
  const requestedSnapshots = new Set(options.playerSnapshotEncounters ?? []);
  for (const encounter of requestedSnapshots)
    if (!Number.isSafeInteger(encounter) || encounter < 1)
      throw new RangeError("Player snapshot encounter must be a positive safe integer");
  const attackAlternatives = {
    ...(options.bossInterval === undefined ? {} : { bossInterval: options.bossInterval }),
    ...(options.criticalChancePolicy === undefined
      ? {}
      : { criticalChancePolicy: options.criticalChancePolicy }),
    ...(options.armorPenetrationPolicy === undefined
      ? {}
      : { armorPenetrationPolicy: options.armorPenetrationPolicy }),
    ...(options.ordinaryHealthGrowthRate === undefined
      ? {}
      : { ordinaryHealthGrowthRate: options.ordinaryHealthGrowthRate }),
  };
  const criticalRoll = options.criticalRoll ?? 0.25;
  const damageMultiplier = options.damageMultiplier ?? 1;
  const doubleRewardRoll = options.doubleRewardRoll ?? 0.25;
  if (horizonMs !== undefined && (!Number.isFinite(horizonMs) || horizonMs <= 0))
    throw new RangeError("Horizon must be a finite positive number");
  if (manualIntervalMs !== null && (!Number.isFinite(manualIntervalMs) || manualIntervalMs <= 0))
    throw new RangeError("Manual interval must be a finite positive number or null");
  for (const roll of [options.criticalRoll, options.doubleRewardRoll])
    if (roll !== undefined && (!Number.isFinite(roll) || roll < 0 || roll >= 1))
      throw new RangeError("Alternative roll must be within [0, 1)");
  for (const multiplier of [
    options.automaticSpeedMultiplier,
    options.damageMultiplier,
    options.upgradeCostMultiplier,
  ])
    if (multiplier !== undefined && (!Number.isFinite(multiplier) || multiplier <= 0))
      throw new RangeError("Alternative multiplier must be finite and positive");
  if (
    options.bossInterval !== undefined &&
    (!Number.isSafeInteger(options.bossInterval) || options.bossInterval < 2)
  )
    throw new RangeError("Boss interval must be a safe integer of at least two");
  const initialPlayer = {
    ...options.initialPlayer,
    ...(options.automaticSpeedLevel === undefined
      ? {}
      : { automaticSpeedLevel: options.automaticSpeedLevel }),
    ...(options.armorPenetrationLevel === undefined
      ? {}
      : { armorPenetrationLevel: options.armorPenetrationLevel }),
  };
  let state: CombatState = {
    ...createCombatState(initialPlayer, 0, false),
    coins: 1,
  };
  const playerSnapshots: { encounter: number; player: CombatPlayer }[] = [];
  const capturedSnapshotEncounters = new Set<number>();
  const pendingSnapshotEncounters = new Set<number>();
  const noteOrdinarySnapshot = (): void => {
    if (
      state.goldenBug === null &&
      requestedSnapshots.has(state.enemy.encounter) &&
      !capturedSnapshotEncounters.has(state.enemy.encounter)
    )
      pendingSnapshotEncounters.add(state.enemy.encounter);
  };
  const capturePendingSnapshots = (): void => {
    for (const encounter of pendingSnapshotEncounters) {
      playerSnapshots.push({ encounter, player: state.player });
      capturedSnapshotEncounters.add(encounter);
    }
    pendingSnapshotEncounters.clear();
  };
  if (options.startEncounter !== undefined) {
    if (!Number.isSafeInteger(options.startEncounter) || options.startEncounter < 1)
      throw new RangeError("Stage start encounter must be a positive safe integer");
    state = {
      ...state,
      enemy: spawnEnemy(
        options.startEncounter,
        modifierRollForEncounter(options.startEncounter),
        options.ordinaryHealthGrowthRate,
        state.player,
        options.bossInterval,
      ),
    };
  }
  let elapsedMs = 0;
  let automaticAttacks = 0;
  let manualAttacks = 0;
  let nextManualAttackAtMs = manualIntervalMs === null ? Infinity : 0;
  let armorPreventedDamage = 0;
  let penetration = 0;
  let goldenBugDeadlineMs: number | undefined;
  const purchases = emptyPurchases();
  const spend = emptyPurchases();
  let unaffordableGaps = 0;
  let doubleRewardIncome = 0;
  let goldenBugDelayMs = 0;
  let nextUpgradeIndex = 0;
  const observations: ProgressionObservation[] = [];
  const ttkObservations: TtkObservation[] = [];
  const activeTtkByEnemyId = new Map<number, TtkAccumulator>();
  const recordTtkPacket = (
    enemy: CombatEnemy,
    goldenBug: boolean,
    source: "manual" | "automatic",
    damageMultiplier: number,
    atMs: number,
    defeated: boolean,
  ): void => {
    const current = activeTtkByEnemyId.get(enemy.id) ?? {
      effectiveAttackMicroUnits: 0,
      encounter: enemy.encounter,
      goldenBug,
      grade: enemy.grade,
      modifier: enemy.modifier,
      packetEvents: 0,
      startedAtMs: atMs,
    };
    const next: TtkAccumulator = {
      ...current,
      effectiveAttackMicroUnits:
        current.effectiveAttackMicroUnits +
        attackUnitsToMicroUnits(source === "automatic" ? damageMultiplier : 1),
      packetEvents: current.packetEvents + 1,
    };
    if (!defeated) {
      activeTtkByEnemyId.set(enemy.id, next);
      return;
    }
    ttkObservations.push({
      effectiveAttackUnits: microUnitsToAttackUnits(next.effectiveAttackMicroUnits),
      encounter: next.encounter,
      goldenBug: next.goldenBug,
      grade: next.grade,
      modifier: next.modifier,
      packetEvents: next.packetEvents,
    });
    activeTtkByEnemyId.delete(enemy.id);
  };
  let ordinaryDefeats = 0;
  if (automaticEnabled) {
    const unlocked = purchaseUpgrade(state, "automatic-unlock", elapsedMs);
    if (unlocked.reason !== null) throw new Error(unlocked.reason);
    state = unlocked.state;
    purchases["automatic-unlock"] = 1;
  }
  noteOrdinarySnapshot();
  capturePendingSnapshots();
  const bosses: BossEncounter[] = [];
  let horizonReached = false;
  while (
    horizonMs === undefined
      ? bosses.length < bossCount || ordinaryDefeats < ordinaryEncounters
      : elapsedMs < horizonMs
  ) {
    const nextAutomaticAttackAtMs = automaticEnabled ? state.nextAutomaticAttackAtMs : Infinity;
    const nextAttackAtMs = Math.min(nextAutomaticAttackAtMs, nextManualAttackAtMs);
    if (horizonMs !== undefined && nextAttackAtMs > horizonMs) {
      elapsedMs = horizonMs;
      break;
    }
    if (goldenBugDeadlineMs !== undefined && goldenBugDeadlineMs <= nextAttackAtMs) {
      if (horizonMs !== undefined && goldenBugDeadlineMs > horizonMs) {
        elapsedMs = horizonMs;
        break;
      }
      elapsedMs = goldenBugDeadlineMs;
      activeTtkByEnemyId.delete(state.enemy.id);
      state = expireGoldenBug(state, options.ordinaryHealthGrowthRate);
      noteOrdinarySnapshot();
      capturePendingSnapshots();
      goldenBugDelayMs += 10_000;
      goldenBugDeadlineMs = undefined;
      continue;
    }
    if (
      ordinaryEncounters > 0 &&
      skipBosses &&
      bossCount === 0 &&
      state.goldenBug === null &&
      state.enemy.grade === "boss"
    ) {
      state = {
        ...state,
        enemy: spawnEnemy(
          state.enemy.encounter + 1,
          0,
          options.ordinaryHealthGrowthRate,
          state.player,
          options.bossInterval,
        ),
      };
      noteOrdinarySnapshot();
      capturePendingSnapshots();
      continue;
    }
    const enemy = state.enemy;
    const wasGoldenBug = state.goldenBug !== null;
    const startedAtMs = elapsedMs;
    let hits = 0;
    let automaticHits = 0;
    let manualHits = 0;
    let prevented = 0;
    let minimumDamageHits = 0;
    let reward = 0;
    while (state.enemy.id === enemy.id) {
      const scheduledAutomaticAtMs = automaticEnabled ? state.nextAutomaticAttackAtMs : Infinity;
      const source = nextManualAttackAtMs <= scheduledAutomaticAtMs ? "manual" : "automatic";
      elapsedMs = source === "manual" ? nextManualAttackAtMs : scheduledAutomaticAtMs;
      if (horizonMs !== undefined && elapsedMs > horizonMs) {
        elapsedMs = horizonMs;
        horizonReached = true;
        break;
      }
      if (source === "manual") {
        if (manualIntervalMs === null) throw new Error("Manual cadence is disabled");
        nextManualAttackAtMs += manualIntervalMs;
      }
      const schedule =
        source === "automatic"
          ? automaticPacketSchedule(state, elapsedMs, options.automaticSpeedMultiplier)
          : undefined;
      const packets = schedule?.packets ?? [{ automaticBatch: false, damageMultiplier: 1 }];
      let batchDamage = 0;
      let batchPrevented = 0;
      let minimumDamagePackets = 0;
      let defeated = false;
      for (const packet of packets) {
        const attackedEnemy = state.enemy;
        const attackedGoldenBug = state.goldenBug !== null;
        const result = attack(state, {
          atMs: elapsedMs,
          automaticBatch: packet.automaticBatch,
          damageMultiplier: packet.damageMultiplier * damageMultiplier,
          ...attackAlternatives,
          enemyId: state.enemy.id,
          rolls: {
            critical: criticalRoll,
            doubleReward: doubleRewardRoll,
            nextEliteModifier: modifierRollForEncounter(state.enemy.encounter),
          },
          source,
        });
        if (result.event.type === "ignored") throw new Error("Automatic progression stalled");
        recordTtkPacket(
          attackedEnemy,
          attackedGoldenBug,
          source,
          packet.damageMultiplier,
          elapsedMs,
          result.event.defeated,
        );
        if (source === "automatic") {
          automaticAttacks += 1;
          automaticHits += 1;
        } else {
          manualAttacks += 1;
          manualHits += 1;
        }
        armorPreventedDamage += result.event.armorPreventedDamage;
        penetration = result.event.penetration;
        hits += 1;
        batchDamage += result.event.damage;
        batchPrevented += result.event.armorPreventedDamage;
        prevented += result.event.armorPreventedDamage;
        if (result.event.damage === 1) {
          minimumDamageHits += 1;
          minimumDamagePackets += 1;
        }
        if (result.event.defeated) {
          reward += result.event.reward;
          doubleRewardIncome += Math.max(0, result.event.reward - state.enemy.reward);
          defeated = true;
        }
        state = result.state;
        noteOrdinarySnapshot();
        if (state.goldenBug !== null) goldenBugDeadlineMs = elapsedMs + 10_000;
      }
      if (schedule !== undefined) {
        state = { ...state, nextAutomaticAttackAtMs: schedule.nextAttackAtMs };
        // Only skip whole, nonlethal production batches. This retains packet order at every transition.
        if (
          eventJump &&
          !wasGoldenBug &&
          !defeated &&
          state.goldenBug === null &&
          batchDamage > 0
        ) {
          const cadenceMs = schedule.nextAttackAtMs - elapsedMs;
          const remainingBatches = Math.ceil(state.enemy.health / batchDamage);
          const horizonBatches =
            horizonMs === undefined
              ? Number.MAX_SAFE_INTEGER
              : Math.max(0, Math.floor((horizonMs - schedule.nextAttackAtMs) / cadenceMs));
          const skippedBatches = Math.max(0, Math.min(remainingBatches - 1, horizonBatches));
          if (skippedBatches > 0) {
            const skippedPackets = skippedBatches * packets.length;
            state = {
              ...state,
              enemy: { ...state.enemy, health: state.enemy.health - batchDamage * skippedBatches },
              nextAutomaticAttackAtMs: schedule.nextAttackAtMs + cadenceMs * skippedBatches,
            };
            automaticAttacks += skippedPackets;
            automaticHits += skippedPackets;
            hits += skippedPackets;
            prevented += batchPrevented * skippedBatches;
            armorPreventedDamage += batchPrevented * skippedBatches;
            minimumDamageHits += minimumDamagePackets * skippedBatches;
            const current = activeTtkByEnemyId.get(state.enemy.id);
            if (current !== undefined)
              activeTtkByEnemyId.set(state.enemy.id, {
                ...current,
                effectiveAttackMicroUnits:
                  current.effectiveAttackMicroUnits +
                  skippedBatches *
                    packets.reduce(
                      (total, packet) => total + attackUnitsToMicroUnits(packet.damageMultiplier),
                      0,
                    ),
                packetEvents: current.packetEvents + skippedPackets,
              });
          }
        }
      }
    }
    if (horizonReached) break;
    if (enemy.grade === "boss")
      bosses.push({ encounter: enemy.encounter, elapsedMs: roundedElapsedMs(elapsedMs) });
    if (!wasGoldenBug && enemy.grade !== "boss" && state.goldenBug === null) ordinaryDefeats += 1;
    observations.push({
      armorPreventedDamage: prevented,
      armorEffective: effectiveArmor(
        enemy.armor,
        state.player.armorPenetrationLevel ?? 0,
        options.armorPenetrationPolicy,
      ),
      armorRaw: enemy.armor,
      automaticHits,
      encounter: enemy.encounter,
      grade: enemy.grade,
      goldenBug: wasGoldenBug,
      hits,
      minimumDamageHits,
      modifier: enemy.modifier,
      manualHits,
      reward,
      timeToKillMs: roundedElapsedMs(elapsedMs - startedAtMs),
    });
    if (reward > 0 && !wasGoldenBug) {
      for (let offset = 0; offset < upgradeOrder.length; offset += 1) {
        const id = upgradeOrder[(nextUpgradeIndex + offset) % upgradeOrder.length];
        if (id === undefined) throw new Error("Upgrade order is incomplete");
        const purchase = purchaseUpgrade(state, id, elapsedMs, options.upgradeCostMultiplier);
        if (purchase.reason === null) {
          purchases[id] += 1;
          spend[id] += state.coins - purchase.state.coins;
          state = purchase.state;
          nextUpgradeIndex = (nextUpgradeIndex + offset + 1) % upgradeOrder.length;
          break;
        }
        if (offset === upgradeOrder.length - 1) unaffordableGaps += 1;
      }
    }
    capturePendingSnapshots();
  }
  if (
    horizonMs === undefined &&
    (bosses.length < bossCount || ordinaryDefeats < ordinaryEncounters)
  )
    throw new Error("Progression did not reach requested encounters");
  const byGrade = Object.fromEntries(
    grades.map((grade) => [
      grade,
      distribution(observations.filter((value) => value.grade === grade && !value.goldenBug)),
    ]),
  ) as Record<EnemyGrade, Distribution>;
  return {
    armorPreventedDamage,
    automaticAttacks,
    bosses,
    coins: state.coins,
    elapsedMs: roundedElapsedMs(elapsedMs),
    encounters: state.enemy.encounter,
    manualAttacks,
    player: state.player,
    playerSnapshots,
    observations,
    ttkObservations,
    byGrade,
    ordinaryWallsOver60Seconds: observations.filter(
      (value) =>
        value.grade !== "boss" &&
        !value.goldenBug &&
        value.encounter >= 100 &&
        value.timeToKillMs > 60_000,
    ).length,
    penetration,
    purchases,
    spend,
    unaffordableGaps,
    doubleRewardIncome,
    goldenBugDelayMs,
    state: { ...state, nextAutomaticAttackAtMs: roundedElapsedMs(state.nextAutomaticAttackAtMs) },
  };
};

export const simulateProgression = (
  input: number | SimulationOptions = 3,
): MeasuredProgressionReport =>
  runProgression(input, typeof input === "number" ? false : (input.eventJump ?? false));
/* eslint-enable max-depth */

/** Event-driven fast-forward: it advances only combat/timed-event timestamps, never idle milliseconds. */
export const fastForwardProgression = (horizonMs: number): MeasuredProgressionReport =>
  runProgression({ horizonMs }, true);
