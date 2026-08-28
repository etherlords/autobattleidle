import type { CombatEnemy, CombatPlayer, CombatState } from "../domain/combat";

export const SAVE_VERSION = 2;
export const LEGACY_SAVE_KEY = "etherlords.autobattleidle.save";
export const SAVE_V1_KEY = "etherlords.autobattleidle.save.v1";
export const SAVE_V2_KEY = "etherlords.autobattleidle.save.v2";
export const SAVE_KEY = SAVE_V2_KEY;

export type StorageLike = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
};

export type PageHideHost = {
  addEventListener(type: "pagehide", listener: () => void): void;
  removeEventListener(type: "pagehide", listener: () => void): void;
};

export type TimerHost = {
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

export type SaveV1Player = {
  readonly automaticSpeedLevel: number;
  readonly criticalChance: number;
  readonly damage: number;
  readonly doubleRewardChance: number;
};

export type V1Envelope = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: unknown;
  readonly player: Record<string, unknown>;
  readonly version: 1;
};

export type SaveV1 = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly player: SaveV1Player;
  readonly version: 1;
};

export type SaveV2 = {
  readonly automaticUnlocked: boolean;
  readonly coins: number;
  readonly enemy: CombatEnemy;
  readonly player: CombatPlayer;
  readonly version: 2;
};
