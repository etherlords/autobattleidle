import type { CombatState } from "../domain/combat";
import { SAVE_VERSION, type SaveV2 } from "./save-contracts";

export const encodeSave = (state: CombatState): string =>
  JSON.stringify({
    automaticUnlocked: state.automaticUnlocked,
    coins: state.coins,
    enemy: state.enemy,
    player: state.player,
    version: SAVE_VERSION,
  } satisfies SaveV2);
