import type {
  CombatEnemy,
  CombatPlayer,
  CombatState,
  EliteModifier,
  EnemyGrade,
} from "../domain/combat";
import {
  automaticInterval,
  criticalChanceForLevel,
  damageForLevel,
  doubleRewardChanceForLevel,
  spawnEnemy,
} from "../domain/combat";

export const SAVE_VERSION = 2;
export const LEGACY_SAVE_KEY = "etherlords.autobattleidle.save";
export const SAVE_V1_KEY = "etherlords.autobattleidle.save.v1";
export const SAVE_V2_KEY = "etherlords.autobattleidle.save.v2";
export const SAVE_KEY = SAVE_V2_KEY;

type StorageLike = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
};
type PageHideHost = {
  addEventListener(type: "pagehide", listener: () => void): void;
  removeEventListener(type: "pagehide", listener: () => void): void;
};
type TimerHost = {
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
};
export type RestoreResult = { readonly state: CombatState | undefined; readonly message: string };
export type PersistenceBoundary = {
  load(fallback: CombatState, nowMs: number): CombatState;
  hasPreviousVersionSave(): boolean;
  restorePreviousVersion(nowMs: number): RestoreResult;
  onStateChanged(state: CombatState): void;
  reset(): void;
  dispose(): void;
};
export type PersistenceOptions = {
  readonly storage?: StorageLike;
  readonly page?: PageHideHost;
  readonly timers?: TimerHost;
  readonly debounceMs?: number;
};

type SaveV1Player = {
  readonly automaticSpeedLevel: number;
  readonly criticalChance: number;
  readonly damage: number;
  readonly doubleRewardChance: number;
};
type V1Envelope = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: unknown;
  readonly player: Record<string, unknown>;
  readonly version: 1;
};
type SaveV1 = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly player: SaveV1Player;
  readonly version: 1;
};
type SaveV2 = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly player: CombatPlayer;
  readonly version: 2;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const integer = (
  value: unknown,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const chance = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 0.6;
const grade = (value: unknown): value is EnemyGrade =>
  value === "normal" || value === "veteran" || value === "elite" || value === "boss";
const modifier = (value: unknown): value is EliteModifier | null =>
  value === null || value === "armor" || value === "health" || value === "automatic-slow";
const modifierRoll = (value: EliteModifier | null): number =>
  value === "health" ? 0.34 : value === "automatic-slow" ? 0.67 : 0;
const validEnemyNumbers = (enemy: Record<string, unknown>): boolean =>
  integer(enemy.id, 1) &&
  integer(enemy.encounter, 1, Math.floor(Number.MAX_SAFE_INTEGER / 3)) &&
  enemy.id === enemy.encounter &&
  integer(enemy.health, 1) &&
  integer(enemy.maxHealth, 1) &&
  enemy.health <= enemy.maxHealth &&
  integer(enemy.armor, 0) &&
  integer(enemy.reward, 1);
const validEnemyKind = (enemy: Record<string, unknown>): boolean =>
  grade(enemy.grade) &&
  modifier(enemy.modifier) &&
  (enemy.grade === "elite" || enemy.modifier === null);

// eslint-disable-next-line complexity -- strict boundary validation is intentionally exhaustive.
const parseEnemyShape = (value: unknown): CombatEnemy | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "armor",
      "encounter",
      "grade",
      "health",
      "id",
      "maxHealth",
      "modifier",
      "reward",
    ])
  )
    return undefined;
  const {
    armor,
    encounter,
    grade: enemyGrade,
    health,
    id,
    maxHealth,
    modifier: enemyModifier,
    reward,
  } = value;
  if (!validEnemyNumbers(value) || !validEnemyKind(value)) return undefined;
  if (!integer(armor, 0) || !integer(encounter, 1) || !grade(enemyGrade) || !integer(health, 1))
    return undefined;
  if (!integer(id, 1) || !integer(maxHealth, 1) || !modifier(enemyModifier) || !integer(reward, 1))
    return undefined;
  return {
    armor,
    encounter,
    grade: enemyGrade,
    health,
    id,
    maxHealth,
    modifier: enemyModifier,
    reward,
  };
};

// eslint-disable-next-line complexity -- authentic legacy validation remains co-located with its adapter.
const parseV1 = (value: unknown): SaveV1 | undefined => {
  if (!isV1SaveEnvelope(value)) return undefined;
  const { automaticSpeedLevel, criticalChance, damage, doubleRewardChance } = value.player;
  if (
    !validV1Player(
      automaticSpeedLevel,
      criticalChance,
      damage,
      doubleRewardChance,
      value.automaticUnlocked,
    )
  )
    return undefined;
  if (!integer(automaticSpeedLevel, 0, 5) || !chance(criticalChance)) return undefined;
  if (!integer(damage, 1, 11) || !chance(doubleRewardChance)) return undefined;
  const enemy = parseEnemyShape(value.enemy);
  if (!enemy) return undefined;
  const oldGrade =
    enemy.encounter % 10 === 0
      ? "boss"
      : ((["normal", "veteran", "elite"] as const)[(enemy.encounter - 1) % 3] ?? "normal");
  const oldModifier = oldGrade === "elite" ? enemy.modifier : null;
  const oldBaseHealth = 10 + (enemy.encounter - 1) * 5;
  const oldMultiplier =
    oldGrade === "boss" ? 3 : oldGrade === "elite" ? 2 : oldGrade === "veteran" ? 1.5 : 1;
  if (!matchesHistoricEnemy(enemy, oldGrade, oldModifier, oldBaseHealth, oldMultiplier))
    return undefined;
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy,
    player: { automaticSpeedLevel, criticalChance, damage, doubleRewardChance },
    version: 1,
  };
};
const isV1SaveEnvelope = (value: unknown): value is V1Envelope =>
  isRecord(value) &&
  hasExactKeys(value, ["automaticUnlocked", "coins", "enemy", "player", "version"]) &&
  value.version === 1 &&
  integer(value.coins, 0) &&
  typeof value.automaticUnlocked === "boolean" &&
  isRecord(value.player) &&
  hasExactKeys(value.player, [
    "automaticSpeedLevel",
    "criticalChance",
    "damage",
    "doubleRewardChance",
  ]);
const validV1Player = (
  automaticSpeedLevel: unknown,
  criticalChance: unknown,
  damage: unknown,
  doubleRewardChance: unknown,
  automaticUnlocked: boolean,
): boolean =>
  integer(automaticSpeedLevel, 0, 5) &&
  integer(damage, 1, 11) &&
  chance(criticalChance) &&
  chance(doubleRewardChance) &&
  Number.isInteger(criticalChance * 10) &&
  Number.isInteger(doubleRewardChance * 10) &&
  (automaticUnlocked || automaticSpeedLevel === 0);
const matchesHistoricEnemy = (
  enemy: CombatEnemy,
  oldGrade: EnemyGrade,
  oldModifier: EliteModifier | null,
  oldBaseHealth: number,
  oldMultiplier: number,
): boolean =>
  enemy.grade === oldGrade &&
  enemy.modifier === oldModifier &&
  enemy.maxHealth ===
    Math.round(oldBaseHealth * oldMultiplier * (oldModifier === "health" ? 1.5 : 1)) &&
  enemy.armor === (oldModifier === "armor" ? enemy.encounter : 0) &&
  enemy.reward === Math.round(enemy.encounter * oldMultiplier);

// eslint-disable-next-line complexity -- each persisted derived field must be validated at the boundary.
const parseV2Player = (value: unknown): Required<CombatPlayer> | undefined => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "automaticSpeedLevel",
      "armorPenetrationLevel",
      "criticalChance",
      "criticalLevel",
      "damage",
      "damageLevel",
      "doubleRewardChance",
      "doubleRewardLevel",
    ])
  )
    return undefined;
  const {
    automaticSpeedLevel,
    armorPenetrationLevel,
    criticalChance,
    criticalLevel,
    damage,
    damageLevel,
    doubleRewardChance,
    doubleRewardLevel,
  } = value;
  if (!integer(automaticSpeedLevel, 0) || !integer(armorPenetrationLevel, 0)) return undefined;
  if (!integer(criticalLevel, 0) || !integer(damageLevel, 0) || !integer(doubleRewardLevel, 0))
    return undefined;
  if (!integer(damage, 1) || !chance(criticalChance) || !chance(doubleRewardChance))
    return undefined;
  if (
    !validV2Levels(
      automaticSpeedLevel,
      armorPenetrationLevel,
      criticalLevel,
      damageLevel,
      doubleRewardLevel,
    ) ||
    !validV2DerivedValues(
      damage,
      criticalChance,
      doubleRewardChance,
      damageLevel,
      criticalLevel,
      doubleRewardLevel,
    )
  )
    return undefined;
  return {
    automaticSpeedLevel,
    armorPenetrationLevel,
    criticalChance,
    criticalLevel,
    damage,
    damageLevel,
    doubleRewardChance,
    doubleRewardLevel,
  };
};
const validV2Levels = (...levels: unknown[]): boolean => levels.every((level) => integer(level, 0));
const validV2DerivedValues = (
  damage: unknown,
  criticalChance: unknown,
  doubleRewardChance: unknown,
  damageLevel: number,
  criticalLevel: number,
  doubleRewardLevel: number,
): boolean =>
  integer(damage, 1) &&
  chance(criticalChance) &&
  chance(doubleRewardChance) &&
  damage === damageForLevel(damageLevel) &&
  criticalChance === criticalChanceForLevel(criticalLevel) &&
  doubleRewardChance === doubleRewardChanceForLevel(doubleRewardLevel);

const decodeV2 = (value: unknown, nowMs: number): CombatState | undefined => {
  if (!isCurrentSaveEnvelope(value)) return undefined;
  const automaticUnlocked = value.automaticUnlocked;
  const coins = value.coins;
  if (typeof automaticUnlocked !== "boolean" || !integer(coins, 0)) return undefined;
  const player = parseV2Player(value.player);
  const enemy = parseEnemyShape(value.enemy);
  if (!player || !enemy || (!automaticUnlocked && player.automaticSpeedLevel !== 0))
    return undefined;
  const expected = spawnEnemy(enemy.encounter, modifierRoll(enemy.modifier));
  if (!matchesCurrentEnemy(expected, enemy)) return undefined;
  return {
    automaticUnlocked,
    coins,
    enemy,
    nextAutomaticAttackAtMs: automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
  };
};
const isCurrentSaveEnvelope = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  hasExactKeys(value, ["automaticUnlocked", "coins", "enemy", "player", "version"]) &&
  value.version === SAVE_VERSION &&
  integer(value.coins, 0) &&
  typeof value.automaticUnlocked === "boolean";
const matchesCurrentEnemy = (expected: CombatEnemy, enemy: CombatEnemy): boolean =>
  expected.grade === enemy.grade &&
  expected.modifier === enemy.modifier &&
  expected.armor === enemy.armor &&
  expected.maxHealth === enemy.maxHealth &&
  expected.reward === enemy.reward;

export const encodeSave = (state: CombatState): string =>
  JSON.stringify({
    automaticUnlocked: state.automaticUnlocked,
    coins: state.coins,
    enemy: state.enemy,
    player: state.player,
    version: SAVE_VERSION,
  } satisfies SaveV2);
export const decodeSave = (value: unknown, fallback: CombatState, nowMs: number): CombatState =>
  decodeV2(value, nowMs) ?? fallback;

const migrateV1 = (source: SaveV1, nowMs: number): CombatState => {
  const player = {
    automaticSpeedLevel: source.player.automaticSpeedLevel,
    armorPenetrationLevel: 0,
    criticalLevel: source.player.criticalChance * 10,
    damageLevel: source.player.damage - 1,
    doubleRewardLevel: source.player.doubleRewardChance * 10,
  };
  const normalizedPlayer: Required<CombatPlayer> = {
    ...player,
    criticalChance: criticalChanceForLevel(player.criticalLevel),
    damage: damageForLevel(player.damageLevel),
    doubleRewardChance: doubleRewardChanceForLevel(player.doubleRewardLevel),
  };
  const spawned = spawnEnemy(source.enemy.encounter, modifierRoll(source.enemy.modifier));
  const enemy = {
    ...spawned,
    health: Math.max(
      1,
      Math.ceil((source.enemy.health / source.enemy.maxHealth) * spawned.maxHealth),
    ),
  };
  return {
    automaticUnlocked: source.automaticUnlocked,
    coins: source.coins,
    enemy,
    nextAutomaticAttackAtMs: source.automaticUnlocked
      ? nowMs + automaticInterval(enemy, normalizedPlayer)
      : 0,
    player: normalizedPlayer,
  };
};

export const createPersistenceBoundary = (
  options: PersistenceOptions = {},
): PersistenceBoundary => {
  const storage = options.storage ?? globalThis.localStorage;
  const page = options.page ?? globalThis.window;
  const timers = options.timers ?? globalThis;
  const debounceMs = options.debounceMs ?? 250;
  let pending: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const flush = (): void => {
    if (pending === undefined) return;
    try {
      storage.setItem(SAVE_V2_KEY, pending);
      pending = undefined;
    } catch {
      /* retain the valid payload for retry */
    }
  };
  const schedule = (): void => {
    if (timer === undefined)
      timer = timers.setTimeout(() => {
        timer = undefined;
        flush();
      }, debounceMs);
  };
  const onPageHide = (): void => {
    if (timer !== undefined) {
      timers.clearTimeout(timer);
      timer = undefined;
    }
    flush();
  };
  const readV1 = (): SaveV1 | undefined => {
    try {
      const raw = storage.getItem(SAVE_V1_KEY);
      return raw === null ? undefined : parseV1(JSON.parse(raw) as unknown);
    } catch {
      return undefined;
    }
  };
  const readLegacy = (nowMs: number): CombatState | undefined => {
    try {
      const raw = storage.getItem(LEGACY_SAVE_KEY);
      if (raw === null) return undefined;
      const value = JSON.parse(raw) as unknown;
      const v1 = parseV1(value);
      return decodeV2(value, nowMs) ?? (v1 ? migrateV1(v1, nowMs) : undefined);
    } catch {
      return undefined;
    }
  };
  const needsV2Repair = (nowMs: number): boolean => {
    try {
      const raw = storage.getItem(SAVE_V2_KEY);
      return (
        raw === null || raw === "" || decodeV2(JSON.parse(raw) as unknown, nowMs) === undefined
      );
    } catch {
      return true;
    }
  };
  const publish = (state: CombatState): boolean => {
    const encoded = encodeSave(state);
    try {
      storage.setItem(SAVE_V2_KEY, encoded);
      return true;
    } catch {
      pending = encoded;
      schedule();
      return false;
    }
  };
  const readRepairSource = (nowMs: number): CombatState | undefined => {
    const legacy = readLegacy(nowMs);
    if (legacy !== undefined) return legacy;
    const source = readV1();
    return source ? migrateV1(source, nowMs) : undefined;
  };
  const repairAndPublish = (nowMs: number): RestoreResult => {
    const state = readRepairSource(nowMs);
    if (!state)
      return { state: undefined, message: "Previous-version save is unavailable or invalid." };
    if (!decodeV2(JSON.parse(encodeSave(state)) as unknown, nowMs))
      return { state: undefined, message: "Previous-version save could not be migrated safely." };
    return publish(state)
      ? { state, message: "Progress restored from the previous version." }
      : { state, message: "Progress migrated in memory; saving it will retry automatically." };
  };
  page.addEventListener("pagehide", onPageHide);
  return {
    load: (fallback, nowMs) => {
      try {
        const raw = storage.getItem(SAVE_V2_KEY);
        if (raw !== null && raw !== "") {
          const current = decodeV2(JSON.parse(raw) as unknown, nowMs);
          if (current !== undefined) return current;
        }
      } catch {
        // An unusable current slot may still have a recoverable historical source.
      }
      return repairAndPublish(nowMs).state ?? fallback;
    },
    hasPreviousVersionSave: () => {
      try {
        return storage.getItem(SAVE_V1_KEY) !== null && needsV2Repair(0);
      } catch {
        return false;
      }
    },
    restorePreviousVersion: (nowMs) =>
      needsV2Repair(nowMs)
        ? repairAndPublish(nowMs)
        : { state: undefined, message: "Current-version progress is already valid." },
    onStateChanged: (state) => {
      if (!disposed) {
        pending = encodeSave(state);
        schedule();
      }
    },
    reset: () => {
      if (disposed) return;
      pending = undefined;
      if (timer !== undefined) {
        timers.clearTimeout(timer);
        timer = undefined;
      }
      try {
        storage.removeItem(SAVE_V2_KEY);
      } catch {
        /* live reset remains usable */
      }
    },
    dispose: () => {
      if (!disposed) {
        onPageHide();
        page.removeEventListener("pagehide", onPageHide);
        disposed = true;
      }
    },
  };
};
