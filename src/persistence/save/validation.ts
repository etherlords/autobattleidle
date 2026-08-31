import type { CombatState } from "../../domain/combat";
import { decodeV2 } from "./validation-v2";
import { decodeV3 } from "./validation-v3";
import { decodeV4 } from "./validation-v4";

export { modifierRoll } from "./validation-primitives";
export { parseV1 } from "./validation-v1";
export { decodeV2 } from "./validation-v2";
export { decodeV3 } from "./validation-v3";
export { decodeV4 } from "./validation-v4";

export const decodeSave = (value: unknown, fallback: CombatState, nowMs: number): CombatState =>
  decodeV4(value, nowMs) ?? decodeV3(value, nowMs) ?? decodeV2(value, nowMs) ?? fallback;
