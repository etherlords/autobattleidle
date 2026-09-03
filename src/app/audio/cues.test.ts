import { describe, expect, it } from "vitest";
import type { BattleVisualCue } from "../../domain/snapshot";
import type { AudioCue } from "./cues";
import { cueFromBattleVisualCue, familyCueBuffer, resolveCueBuffer, uiCueBuffer } from "./cues";

describe("cue buffer map", () => {
  it("maps manual hit to punch medium with 000/001 alternation", () => {
    const cue: BattleVisualCue = {
      kind: "hit",
      packets: { count: 1, units: 1 },
      source: "manual",
    };
    expect(cueFromBattleVisualCue(cue, 0)).toBe("impactPunch_medium_000");
    expect(cueFromBattleVisualCue(cue, 1)).toBe("impactPunch_medium_001");
    expect(cueFromBattleVisualCue(cue, 2)).toBe("impactPunch_medium_000");
  });

  it("maps manual critical to a dull bell ring", () => {
    expect(
      cueFromBattleVisualCue({
        kind: "critical",
        packets: { count: 1, units: 1 },
        source: "manual",
      }),
    ).toBe("impactBell_heavy_000");
    expect(
      cueFromBattleVisualCue({ kind: "armor", packets: { count: 1, units: 1 }, source: "manual" }),
    ).toBe("impactGlass_medium_000");
  });

  it("maps automatic batch hits to one dull wood knock", () => {
    const cue: BattleVisualCue = {
      kind: "hit",
      packets: { count: 1, units: 1 },
      source: "automatic",
    };
    expect(cueFromBattleVisualCue(cue, 0)).toBe("impactWood_heavy_000");
    expect(cueFromBattleVisualCue(cue, 1)).toBe("impactWood_heavy_000");
  });

  it("maps automatic criticals to a muted heavy punch", () => {
    expect(
      cueFromBattleVisualCue(
        { kind: "critical", packets: { count: 1, units: 1 }, source: "automatic" },
        0,
      ),
    ).toBe("impactPunch_heavy_000");
    expect(
      cueFromBattleVisualCue(
        { kind: "critical", packets: { count: 1, units: 1 }, source: "automatic" },
        1,
      ),
    ).toBe("impactPunch_heavy_000");
  });

  it("maps scene cues", () => {
    expect(cueFromBattleVisualCue("death")).toBe("impactWood_heavy_000");
    expect(cueFromBattleVisualCue("coin")).toBe("confirmation_001");
    expect(cueFromBattleVisualCue("boss")).toBe("impactSoft_heavy_000");
    expect(cueFromBattleVisualCue("golden-kill")).toBe("confirmation_001");
    expect(cueFromBattleVisualCue("golden-escape")).toBe("impactGeneric_light_000");
    expect(cueFromBattleVisualCue("spawn")).toBe("impactSoft_heavy_000");
  });

  it("maps shell families to glass and brute to heavy punch", () => {
    expect(familyCueBuffer("beetle")).toBe("impactGlass_medium_000");
    expect(familyCueBuffer("sentinel")).toBe("impactGlass_medium_000");
    expect(familyCueBuffer("brute")).toBe("impactPunch_heavy_000");
    expect(familyCueBuffer("mantis")).toBeNull();
    expect(familyCueBuffer("wisp")).toBeNull();
    expect(familyCueBuffer("boss-colossus")).toBeNull();
  });

  it("maps UI cues to their short one-shot buffers", () => {
    expect(uiCueBuffer("click")).toBe("click_001");
    expect(uiCueBuffer("select")).toBe("select_001");
    expect(uiCueBuffer("toggle")).toBe("toggle_001");
    expect(uiCueBuffer("switch")).toBe("switch_001");
    expect(uiCueBuffer("open")).toBe("open_001");
    expect(uiCueBuffer("close")).toBe("close_001");
    expect(uiCueBuffer("error")).toBe("error_001");
    expect(uiCueBuffer("back")).toBe("back_001");
  });

  it("returns null for unknown cues instead of throwing", () => {
    const unknownScene = "unknown" as BattleVisualCue;
    expect(cueFromBattleVisualCue(unknownScene)).toBeNull();
    const unknownKind = {
      kind: "explode",
      packets: { count: 1, units: 1 },
      source: "manual",
    } as unknown as AudioCue;
    expect(resolveCueBuffer(unknownKind)).toBeNull();
    const unknownUi = { type: "ui", name: "mystery" } as unknown as AudioCue;
    expect(resolveCueBuffer(unknownUi)).toBeNull();
  });
});
