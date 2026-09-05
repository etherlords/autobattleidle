export const BATTLEFIELD_CONFIG = {
  backgroundColor: "#07121f",
  camera: {
    // The enlarged Goose Hydra profile needs this shared distance to clear the measured HUD edge.
    bossFramingScale: 2.8,
    elevation: 2,
    far: 100,
    fieldOfView: 50,
    minimumAspect: 1,
    near: 0.1,
    ordinaryHudSafeTopRatio: 0.19,
    ordinaryMaximumFramingScale: 3,
    distance: 7,
  },
  ground: {
    color: "#172c35",
    radius: 4,
    segments: 32,
  },
  lights: {
    directional: { color: "#f8d28b", intensity: 2, position: [2, 4, 3] as const },
    hemisphere: { groundColor: "#25120b", intensity: 1.5, skyColor: "#75c7ff" },
  },
  player: {
    base: { color: "#245f66", height: 0.08, radius: 0.7, segments: 20 },
    baseOffsetY: -0.68,
    core: { color: "#4de1c1", emissive: "#0d443d", radius: 0.62 },
    position: [-1.7, 0.7, 0] as const,
  },
  renderer: { maximumPixelRatio: 2 },
} as const;

export const cameraScaleForAspect = (aspect: number): number =>
  Math.max(1, BATTLEFIELD_CONFIG.camera.minimumAspect / aspect);
