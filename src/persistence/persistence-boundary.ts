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

export const SAVE_KEY = "etherlords.autobattleidle.save";
export const SAVE_VERSION = 2;

type SaveV1 = {
  readonly version: typeof SAVE_VERSION;
  readonly coins: number;
  readonly automaticUnlocked: boolean;
  readonly player: CombatPlayer;
  readonly enemy: CombatEnemy;
};

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

export type PersistenceBoundary = {
  load(fallback: CombatState, nowMs: number): CombatState;
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

const matchesPlayerDerivedValues = (
  damage: number,
  damageLevel: number,
  criticalChance: number,
  criticalLevel: number,
  doubleRewardChance: number,
  doubleRewardLevel: number,
): boolean =>
  damage === damageForLevel(damageLevel) &&
  criticalChance === criticalChanceForLevel(criticalLevel) &&
  doubleRewardChance === doubleRewardChanceForLevel(doubleRewardLevel);

const parsePlayer = (value: unknown): CombatPlayer | undefined => {
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
  ) {
    return undefined;
  }
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
  if (
    !integer(automaticSpeedLevel, 0) ||
    !integer(armorPenetrationLevel, 0) ||
    !integer(criticalLevel, 0) ||
    !integer(damage, 1) ||
    !integer(damageLevel, 0) ||
    !chance(criticalChance) ||
    !integer(doubleRewardLevel, 0) ||
    !chance(doubleRewardChance)
  ) {
    return undefined;
  }
  if (
    !matchesPlayerDerivedValues(
      damage,
      damageLevel,
      criticalChance,
      criticalLevel,
      doubleRewardChance,
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

const parseEnemyNumbers = (value: Record<string, unknown>) => {
  const { armor, encounter, health, id, maxHealth, reward } = value;
  if (
    !integer(id, 1) ||
    !integer(encounter, 1, Number.MAX_SAFE_INTEGER / 3) ||
    id !== encounter ||
    !integer(health, 1) ||
    !integer(maxHealth, 1) ||
    health > maxHealth ||
    !integer(armor, 0) ||
    !integer(reward, 1)
  ) {
    return undefined;
  }
  return { armor, encounter, health, id, maxHealth, reward };
};

const parseEnemyKind = (value: Record<string, unknown>) => {
  const { grade: enemyGrade, modifier: enemyModifier } = value;
  if (
    !grade(enemyGrade) ||
    !modifier(enemyModifier) ||
    (enemyGrade !== "elite" && enemyModifier !== null)
  ) {
    return undefined;
  }
  return { enemyGrade, enemyModifier };
};

const parseEnemy = (value: unknown): CombatEnemy | undefined => {
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
  ) {
    return undefined;
  }
  const numbers = parseEnemyNumbers(value);
  const kind = parseEnemyKind(value);
  if (!numbers || !kind) return undefined;
  const expected = spawnEnemy(
    numbers.encounter,
    kind.enemyModifier === "health" ? 0.34 : kind.enemyModifier === "automatic-slow" ? 0.67 : 0,
  );
  if (
    expected.grade !== kind.enemyGrade ||
    expected.modifier !== kind.enemyModifier ||
    expected.armor !== numbers.armor ||
    expected.maxHealth !== numbers.maxHealth ||
    expected.reward !== numbers.reward
  ) {
    return undefined;
  }
  return { ...numbers, grade: kind.enemyGrade, modifier: kind.enemyModifier };
};

export const encodeSave = (state: CombatState): string =>
  JSON.stringify({
    automaticUnlocked: state.automaticUnlocked,
    coins: state.coins,
    enemy: state.enemy,
    player: state.player,
    version: SAVE_VERSION,
  } satisfies SaveV1);

export const decodeSave = (value: unknown, fallback: CombatState, nowMs: number): CombatState => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["automaticUnlocked", "coins", "enemy", "player", "version"]) ||
    value.version !== SAVE_VERSION
  ) {
    return fallback;
  }
  const player = parsePlayer(value.player);
  const enemy = parseEnemy(value.enemy);
  if (
    !integer(value.coins, 0) ||
    typeof value.automaticUnlocked !== "boolean" ||
    !player ||
    (!value.automaticUnlocked && player.automaticSpeedLevel !== 0) ||
    !enemy
  ) {
    return fallback;
  }
  return {
    automaticUnlocked: value.automaticUnlocked,
    coins: value.coins,
    enemy,
    nextAutomaticAttackAtMs: value.automaticUnlocked ? nowMs + automaticInterval(enemy, player) : 0,
    player,
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
      storage.setItem(SAVE_KEY, pending);
      pending = undefined;
    } catch {
      // Keep the latest payload for a later bounded retry; storage writes are atomic.
    }
  };
  const schedule = (): void => {
    if (timer !== undefined) return;
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
  page.addEventListener("pagehide", onPageHide);
  return {
    load: (fallback, nowMs) => {
      try {
        const raw = storage.getItem(SAVE_KEY);
        if (raw === null) return fallback;
        return decodeSave(JSON.parse(raw) as unknown, fallback, nowMs);
      } catch {
        return fallback;
      }
    },
    onStateChanged: (state) => {
      if (disposed) return;
      pending = encodeSave(state);
      schedule();
    },
    reset: () => {
      if (disposed) return;
      pending = undefined;
      if (timer !== undefined) {
        timers.clearTimeout(timer);
        timer = undefined;
      }
      try {
        storage.removeItem(SAVE_KEY);
      } catch {
        // Reset is still reflected in live state; a later save can restore it.
      }
    },
    dispose: () => {
      if (disposed) return;
      onPageHide();
      page.removeEventListener("pagehide", onPageHide);
      disposed = true;
    },
  };
};
