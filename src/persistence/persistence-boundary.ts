import type { BattleSnapshot } from "../domain/snapshot";

export type PersistenceBoundary = {
  onStateChanged(snapshot: BattleSnapshot): void;
  dispose(): void;
};

/** ABI-005 will replace this seam with validated, versioned localStorage. */
export const createPersistenceBoundary = (): PersistenceBoundary => ({
  onStateChanged: (_snapshot) => undefined,
  dispose: () => undefined,
});
