export const LAB_ZOOM_MIN = 0.45;
export const LAB_ZOOM_MAX = 2.5;
export const LAB_ZOOM_STEP = 0.15;

export type LabZoomDirection = "in" | "out";

export const adjustLabZoom = (zoom: number, direction: LabZoomDirection): number => {
  const current = Number.isFinite(zoom) ? zoom : 1;
  const delta = direction === "in" ? -LAB_ZOOM_STEP : LAB_ZOOM_STEP;
  return Math.min(LAB_ZOOM_MAX, Math.max(LAB_ZOOM_MIN, current + delta));
};

export const labZoomDirectionForWheel = (deltaY: number): LabZoomDirection | undefined => {
  if (deltaY < 0) return "in";
  if (deltaY > 0) return "out";
  return undefined;
};
