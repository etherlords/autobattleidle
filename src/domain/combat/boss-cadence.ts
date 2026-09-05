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
const MAX_BOSS_ORDINAL = Math.floor((MAX_ENCOUNTER - 35) / 70) * 2 + 1;

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
const seededOffset = (ordinal: number, band: BossCadenceBand): number => {
  let mixed = (BOSS_CADENCE_BALANCE.seed ^ Math.imul(ordinal, 0x45d9f3b)) >>> 0;
  for (const character of band.id) mixed = (Math.imul(mixed, 33) + character.charCodeAt(0)) >>> 0;
  return mixed >>> 0;
};

export const bossCadenceBandForOrdinal = (ordinal: number): BossCadenceBand => {
  assertOrdinal(ordinal);
  const band = bands.find(({ firstBoss, lastBoss }) => ordinal >= firstBoss && ordinal <= lastBoss);
  if (band === undefined) throw new RangeError("Boss ordinal did not select a cadence band");
  return band;
};

/**
 * Each seeded pair sums to the historical 70-encounter budget while alternating 34/36 gaps.
 * This gives visible progression-aware variation without introducing reward droughts or long-run
 * drift. The first boss remains at encounter 35 for historical save compatibility.
 */
export const bossGapForOrdinal = (ordinal: number): number => {
  assertOrdinal(ordinal);
  if (ordinal === 1) return 35;
  const band = bossCadenceBandForOrdinal(ordinal);
  const pairOffset = ordinal % 2 === 0 ? 34 : 36;
  const cycle = Math.floor((ordinal - 2) / 2) + 1;
  return seededOffset(cycle, band) % 2 === 0 ? pairOffset : 70 - pairOffset;
};
/** Returns the encounter number for a one-based boss ordinal with safe-number output proof. */
export const bossEncounterForOrdinal = (ordinal: number): number => {
  assertOrdinal(ordinal);
  if (ordinal > MAX_BOSS_ORDINAL)
    throw new RangeError("Boss ordinal cannot produce a safe encounter number");
  const gapCount = ordinal - 1;
  const completePairs = Math.floor(gapCount / 2);
  const remainder = gapCount % 2;
  const encounter = 35 + completePairs * 70 + (remainder === 0 ? 0 : bossGapForOrdinal(ordinal));
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
    const scheduledEncounter = bossEncounterForOrdinal(ordinal);
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
