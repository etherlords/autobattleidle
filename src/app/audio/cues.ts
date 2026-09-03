import type { BattleVisualCue } from "../../domain/snapshot";

export type AudioCue =
  | {
      readonly type: "attack";
      readonly kind: "armor" | "critical" | "hit";
      readonly source: "automatic" | "manual";
    }
  | { readonly type: "scene"; readonly name: SceneCueName }
  | { readonly type: "ui"; readonly name: UiCueName };

export type UiCueName =
  "click" | "select" | "toggle" | "switch" | "open" | "close" | "error" | "back";
const ALTERNATION_CYCLE = 2;

export type SceneCueName = "boss" | "coin" | "death" | "golden-escape" | "golden-kill" | "spawn";

const SCENE_CUE_BUFFERS: Record<SceneCueName, string> = {
  boss: "impactBell_heavy_000",
  coin: "confirmation_001",
  death: "impactPlate_medium_000",
  "golden-escape": "impactGeneric_light_000",
  "golden-kill": "impactMining_000",
  spawn: "impactSoft_heavy_000",
};

const UI_CUE_BUFFERS: Record<UiCueName, string> = {
  click: "click_001",
  select: "select_001",
  toggle: "toggle_001",
  switch: "switch_001",
  open: "open_001",
  close: "close_001",
  error: "error_001",
  back: "back_001",
};
const MANUAL_ATTACK_BUFFERS: Record<"critical" | "hit", readonly string[]> = {
  critical: ["impactMetal_heavy_000"],
  hit: ["impactPunch_medium_000", "impactPunch_medium_001"],
};

const AUTOMATIC_ATTACK_BUFFERS: Record<"critical" | "hit", readonly string[]> = {
  critical: ["impactMetal_light_000", "impactMetal_light_001"],
  hit: ["impactSoft_medium_000", "impactSoft_medium_001"],
};

export const resolveCueBuffer = (cue: AudioCue, batchIndex = 0): string | null => {
  if (cue.type === "ui") return UI_CUE_BUFFERS[cue.name] ?? null;
  if (cue.type === "scene") return SCENE_CUE_BUFFERS[cue.name] ?? null;
  if (cue.type !== "attack") return null;
  if (cue.kind === "armor") return "impactTin_medium_000";
  const table = cue.source === "manual" ? MANUAL_ATTACK_BUFFERS : AUTOMATIC_ATTACK_BUFFERS;
  const variant = ALTERNATION_CYCLE > 0 ? batchIndex % ALTERNATION_CYCLE : 0;
  return table[cue.kind]?.[variant] ?? null;
};

export const cueFromBattleVisualCue = (cue: BattleVisualCue, batchIndex = 0): string | null => {
  const audioCue: AudioCue =
    typeof cue === "string"
      ? { type: "scene", name: cue }
      : { type: "attack", kind: cue.kind, source: cue.source };
  return resolveCueBuffer(audioCue, batchIndex);
};

export const uiCueBuffer = (name: UiCueName): string | null =>
  resolveCueBuffer({ type: "ui", name });

export const familyCueName = (family: string): "shell" | "brute" | null => {
  if (family === "beetle" || family === "sentinel") return "shell";
  if (family === "brute") return "brute";
  return null;
};

export const familyCueBuffer = (family: string): string | null => {
  const name = familyCueName(family);
  if (name === "shell") return "impactGlass_medium_000";
  if (name === "brute") return "impactPunch_heavy_000";
  return null;
};
