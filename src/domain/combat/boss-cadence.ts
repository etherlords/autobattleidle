import { BOSS_CADENCE_BALANCE, MAX_ENCOUNTER } from "./balance";

export type BossCadenceBandId = "early" | "mid" | "late" | "long-run";
export type BossCadenceBand = {
  readonly id: BossCadenceBandId;
  readonly firstBoss: number;
  readonly lastBoss: number;
  readonly minGap: number;
  readonly maxGap: number;
};

const bands = BOSS_CADENCE_BALANCE.bands as readonly BossCadenceBand[];
const MIN_GAP = Math.min(...bands.map(({ minGap }) => minGap));
const MAX_GAP = Math.max(...bands.map(({ maxGap }) => maxGap));
const CADENCE_PERIOD = 16;
const MAX_BOSS_ORDINAL = Math.floor((MAX_ENCOUNTER - 35) / MAX_GAP) + 1;

const assertOrdinal = (ordinal: number): void => {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1)
    throw new RangeError("Boss ordinal must be a positive safe integer");
};
const assertEncounter = (encounter: number): void => {
  if (!Number.isSafeInteger(encounter) || encounter < 1 || encounter > MAX_ENCOUNTER)
    throw new RangeError("Encounter must be a positive safe integer with safe outputs");
};
const assertInterval = (bossInterval: number): void => {
  if (!Number.isSafeInteger(bossInterval) || bossInterval < 2)
    throw new RangeError("Boss interval must be a safe integer of at least two");
};
/** Small integer mixer: no runtime RNG or persisted seed is needed for this schedule. */
const seededOffset = (offset: number, band: BossCadenceBand): number => {
  let mixed = (BOSS_CADENCE_BALANCE.seed ^ Math.imul(offset + 1, 0x45d9f3b)) >>> 0;
  for (const character of band.id) mixed = (Math.imul(mixed, 33) + character.charCodeAt(0)) >>> 0;
  return mixed >>> 0;
};

export const bossCadenceBandForOrdinal = (ordinal: number): BossCadenceBand => {
  assertOrdinal(ordinal);
  const band = bands.find(({ firstBoss, lastBoss }) => ordinal >= firstBoss && ordinal <= lastBoss);
  if (band === undefined) throw new RangeError("Boss ordinal did not select a cadence band");
  return band;
};

const gapForBandOffset = (offset: number, band: BossCadenceBand): number =>
  band.minGap + (seededOffset(offset % CADENCE_PERIOD, band) % (band.maxGap - band.minGap + 1));
const bandPeriodTotals = bands.map((band) => {
  let total = 0;
  for (let offset = 0; offset < CADENCE_PERIOD; offset += 1)
    total += gapForBandOffset(offset, band);
  return total;
});

/**
 * Each boss gap is an independent seeded draw from its progression band's full envelope.
 * The first gap remains 35 for historical compatibility; later gaps intentionally do not
 * complement one another, so the schedule is perceptibly different from fixed-35 cadence.
 */
export const bossGapForOrdinal = (ordinal: number): number => {
  assertOrdinal(ordinal);
  if (ordinal === 1) return 35;
  const band = bossCadenceBandForOrdinal(ordinal);
  return gapForBandOffset(ordinal - band.firstBoss, band);
};

const sumBandGaps = (band: BossCadenceBand, firstOrdinal: number, lastOrdinal: number): number => {
  const first = Math.max(firstOrdinal, band.firstBoss);
  const last = Math.min(lastOrdinal, band.lastBoss);
  if (first > last) return 0;
  const count = last - first + 1;
  const periodTotal = bandPeriodTotals[bands.indexOf(band)] ?? 0;
  const fullPeriods = Math.floor(count / CADENCE_PERIOD);
  const remainder = count % CADENCE_PERIOD;
  let remainderTotal = 0;
  for (let offset = 0; offset < remainder; offset += 1)
    remainderTotal += gapForBandOffset(offset + (first - band.firstBoss), band);
  return fullPeriods * periodTotal + remainderTotal;
};

/** Returns the encounter number for a one-based boss ordinal with safe-number output proof. */
export const bossEncounterForOrdinal = (ordinal: number): number => {
  assertOrdinal(ordinal);
  if (ordinal > MAX_BOSS_ORDINAL)
    throw new RangeError("Boss ordinal cannot produce a safe encounter number");
  const encounter = 35 + bands.reduce((sum, band) => sum + sumBandGaps(band, 2, ordinal), 0);
  if (!Number.isSafeInteger(encounter) || encounter > MAX_ENCOUNTER)
    throw new RangeError("Boss encounter exceeds safe output range");
  return encounter;
};

/** Returns the one-based boss ordinal only when an encounter is a scheduled boss. */
export const bossOrdinalForEncounter = (
  encounter: number,
  bossInterval?: number,
): number | undefined => {
  assertEncounter(encounter);
  if (bossInterval !== undefined) {
    assertInterval(bossInterval);
    return encounter % bossInterval === 0 ? encounter / bossInterval : undefined;
  }
  let low = 1;
  let high = Math.min(MAX_BOSS_ORDINAL, Math.floor(Math.max(0, encounter - 35) / MIN_GAP) + 2);
  while (low <= high) {
    const ordinal = Math.floor((low + high) / 2);
    let scheduledEncounter: number;
    try {
      scheduledEncounter = bossEncounterForOrdinal(ordinal);
    } catch {
      high = ordinal - 1;
      continue;
    }
    if (scheduledEncounter === encounter) return ordinal;
    if (scheduledEncounter < encounter) low = ordinal + 1;
    else high = ordinal - 1;
  }
  return undefined;
};

export const isBossEncounter = (encounter: number, bossInterval?: number): boolean =>
  bossOrdinalForEncounter(encounter, bossInterval) !== undefined;

export const bossCadenceGapForEncounter = (
  encounter: number,
  bossInterval?: number,
): number | undefined => {
  const ordinal = bossOrdinalForEncounter(encounter, bossInterval);
  if (ordinal === undefined) return undefined;
  return bossInterval === undefined ? bossGapForOrdinal(ordinal) : bossInterval;
};
