import { describe, expect, it } from "vitest";

import {
  adjustLabZoom,
  LAB_ZOOM_MAX,
  LAB_ZOOM_MIN,
  LAB_ZOOM_STEP,
  labZoomDirectionForWheel,
} from "./zoom";

describe("visual lab wheel zoom", () => {
  it("maps wheel-up to zoom in and wheel-down to zoom out", () => {
    expect(labZoomDirectionForWheel(-1)).toBe("in");
    expect(labZoomDirectionForWheel(1)).toBe("out");
    expect(labZoomDirectionForWheel(0)).toBeUndefined();
  });

  it("uses the existing button step in both directions", () => {
    expect(adjustLabZoom(1, "in")).toBeCloseTo(1 - LAB_ZOOM_STEP);
    expect(adjustLabZoom(1, "out")).toBeCloseTo(1 + LAB_ZOOM_STEP);
  });

  it("keeps wheel and button zoom within the camera bounds", () => {
    expect(adjustLabZoom(LAB_ZOOM_MIN, "in")).toBe(LAB_ZOOM_MIN);
    expect(adjustLabZoom(LAB_ZOOM_MAX, "out")).toBe(LAB_ZOOM_MAX);
    expect(adjustLabZoom(Number.NaN, "in")).toBeCloseTo(1 - LAB_ZOOM_STEP);
  });
});
