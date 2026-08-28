import type { CombatState } from "../../domain/combat";
import { decodeV2 } from "./validation-v2";

export { modifierRoll } from "./validation-primitives";
export { parseV1 } from "./validation-v1";
export { decodeV2 } from "./validation-v2";

export const decodeSave = (value: unknown, fallback: CombatState, nowMs: number): CombatState =>
  decodeV2(value, nowMs) ?? fallback;
