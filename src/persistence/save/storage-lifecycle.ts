import type { CombatState } from "../../domain/combat";
import {
  LEGACY_SAVE_KEY,
  SAVE_V1_KEY,
  SAVE_V2_KEY,
  SAVE_V3_KEY,
  SAVE_V4_KEY,
  SAVE_V4_RECOVERY_KEY,
} from "./contracts";
import type { PersistenceBoundary, PersistenceOptions, RestoreResult, SaveV1 } from "./contracts";
import { encodeSave } from "./codecs";
import { decodeLegacySave, isPublicationValid, migrateV1 } from "./migrations";
import { decodeV2, decodeV3, decodeV4, parseV1 } from "./validation";

export const createStorageLifecycle = (options: PersistenceOptions = {}): PersistenceBoundary => {
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
      storage.setItem(SAVE_V4_KEY, pending);
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
      return raw === null ? undefined : decodeLegacySave(JSON.parse(raw) as unknown, nowMs);
    } catch {
      return undefined;
    }
  };
  const readV2 = (nowMs: number): CombatState | undefined => {
    try {
      const raw = storage.getItem(SAVE_V2_KEY);
      return raw === null ? undefined : decodeV2(JSON.parse(raw) as unknown, nowMs);
    } catch {
      return undefined;
    }
  };
  const readV3 = (nowMs: number): CombatState | undefined => {
    try {
      const raw = storage.getItem(SAVE_V3_KEY);
      return raw === null ? undefined : decodeV3(JSON.parse(raw) as unknown, nowMs);
    } catch {
      return undefined;
    }
  };
  const publish = (state: CombatState): boolean => {
    const encoded = encodeSave(state);
    try {
      storage.setItem(SAVE_V4_KEY, encoded);
      pending = undefined;
      return true;
    } catch {
      pending = encoded;
      schedule();
      return false;
    }
  };
  const readRepairSource = (nowMs: number): CombatState | undefined => {
    const v3 = readV3(nowMs);
    if (v3 !== undefined) return v3;
    const v2 = readV2(nowMs);
    if (v2 !== undefined) return v2;
    const legacy = readLegacy(nowMs);
    if (legacy !== undefined) return legacy;
    const source = readV1();
    return source ? migrateV1(source, nowMs) : undefined;
  };
  const repairAndPublish = (nowMs: number): RestoreResult => {
    const state = readRepairSource(nowMs);
    if (!state)
      return { state: undefined, message: "Previous-version save is unavailable or invalid." };
    if (!isPublicationValid(state, nowMs))
      return { state: undefined, message: "Previous-version save could not be migrated safely." };
    return publish(state)
      ? { state, message: "Progress restored from the previous version." }
      : { state, message: "Progress migrated in memory; saving it will retry automatically." };
  };
  page.addEventListener("pagehide", onPageHide);
  return {
    load: (fallback, nowMs) => {
      let currentRaw: string | null = null;
      try {
        currentRaw = storage.getItem(SAVE_V4_KEY);
        if (currentRaw !== null && currentRaw !== "") {
          const current = decodeV4(JSON.parse(currentRaw) as unknown, nowMs);
          if (current !== undefined) return current;
          try {
            storage.setItem(SAVE_V4_RECOVERY_KEY, currentRaw);
          } catch {
            /* The historical source remains available if recovery storage is unavailable. */
          }
        }
      } catch {
        if (currentRaw !== null && currentRaw !== "") {
          try {
            storage.setItem(SAVE_V4_RECOVERY_KEY, currentRaw);
          } catch {
            /* The historical source remains available if recovery storage is unavailable. */
          }
        }
        /* An unusable current slot may still have a recoverable historical source. */
      }
      return repairAndPublish(nowMs).state ?? fallback;
    },
    hasPreviousVersionSave: () => {
      try {
        return readRepairSource(0) !== undefined;
      } catch {
        return false;
      }
    },
    restorePreviousVersion: (nowMs) => repairAndPublish(nowMs),
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
        storage.removeItem(SAVE_V4_KEY);
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
