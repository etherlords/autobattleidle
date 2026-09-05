export const CAMERA_ZOOM_MIN = 0.45;
export const CAMERA_ZOOM_MAX = 2.5;
export const CAMERA_ZOOM_STEP = 0.15;

export type CameraZoomDirection = "in" | "out";

export const adjustCameraZoom = (zoom: number, direction: CameraZoomDirection): number => {
  const current = Number.isFinite(zoom) ? zoom : 1;
  const delta = direction === "in" ? -CAMERA_ZOOM_STEP : CAMERA_ZOOM_STEP;
  return Math.min(CAMERA_ZOOM_MAX, Math.max(CAMERA_ZOOM_MIN, current + delta));
};

export const cameraZoomDirectionForWheel = (deltaY: number): CameraZoomDirection | undefined => {
  if (deltaY < 0) return "in";
  if (deltaY > 0) return "out";
  return undefined;
};
