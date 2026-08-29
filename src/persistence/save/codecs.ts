import type { CombatState } from "../../domain/combat";
import { SAVE_VERSION, type SaveV3 } from "./contracts";

export const encodeSave = (state: CombatState): string =>
  JSON.stringify({
    automaticUnlocked: state.automaticUnlocked,
    coins: state.coins,
    enemy: state.enemy,
    goldenBug: state.goldenBug,
    player: state.player,
    version: SAVE_VERSION,
  } satisfies SaveV3);
