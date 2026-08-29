export const enemyVisualPalette = {
  beetle: { core: "#ff9d66", emissive: "#4d180d", shell: "#cf563f" },
  brute: { core: "#f3bd58", emissive: "#4d3210" },
  wisp: { core: "#bd7cff", emissive: "#311653" },
  colossus: { core: "#e9576d", emissive: "#5b1021" },
  hydra: { core: "#d754c3", emissive: "#4e123f", head: "#ff8fdb" },
  grade: { crest: "#fff0a8", spikes: "#f0c8ff", crown: "#f8d28b", crownEmissive: "#60420b" },
  modifier: {
    armor: "#d6e5f0",
    health: "#7dff92",
    healthEmissive: "#163f1d",
    slow: "#8cb7ff",
    slowEmissive: "#12274d",
    slowHand: "#e8f0ff",
    wealth: "#f8d28b",
    wealthEmissive: "#60420b",
  },
  decoration: {
    fins: "#8ddcff",
    horns: "#fff0cf",
    orbitals: "#f6a8ff",
    satellites: "#d8f7ff",
    scar: "#421217",
  },
} as const;

export const enemyVisualLayout = {
  actorAnchor: { x: 1.7, y: 0.8, z: 0 },
  body: { hydraHeadOffsets: [-0.55, 0.55], hydraHeadY: 0.6 },
  grade: { crestY: 0.75, spikeY: 0.65, spikeOffsets: [-0.45, 0.45], crownY: 1 },
  modifier: {
    armorOffsets: [-0.7, 0.7],
    wealthOffsets: [-0.65, 0.65],
    wealthY: 0.45,
    timeHandY: 0.25,
  },
  decoration: {
    finsX: 0.48,
    finsY: 0.2,
    hornsX: 0.42,
    hornsY: 0.65,
    orbitalsX: 0.25,
    satellitesX: 0.7,
    satellitesY: 0.4,
    scarX: 0.2,
    scarY: 0.1,
    scarZ: 0.7,
  },
} as const;

export const enemyVisualGeometry = {
  body: {
    beetleCore: [0.7, 12, 10],
    beetleShell: [0.5, 10, 8],
    brute: [1.1, 0.9, 0.9],
    wisp: 0.8,
    colossus: [0.8, 1.05, 1.55, 8],
    hydraCore: [0.95, 1],
    hydraHead: [0.35, 0.7, 5],
    mantisThorax: [0.38, 1.25, 8, 12],
    mantisScythe: [0.17, 0.75, 4],
    sentinelCore: [0.62, 0.62, 0.82, 8],
    sentinelPylon: [0.22, 0.85, 0.28],
    drakeTorso: 0.82,
    drakeWing: [0.24, 0.9, 4],
    drakeTail: [0.18, 0.65, 4],
  },
  grade: { crest: [0.25, 0.7, 4], spike: [0.16, 0.55, 4], crown: [0.75, 0.5, 5] },
  modifier: {
    plate: [0.18, 0.8, 0.12],
    core: [0.34, 10, 8],
    ring: [0.88, 0.07, 8, 16],
    hand: [0.05, 0.5, 0.05],
    coin: [0.15, 0.15, 0.08, 10],
  },
  decoration: {
    fin: [0.18, 0.65, 3],
    horn: [0.13, 0.55, 4],
    orbital: [0.34, 0.04, 6, 12],
    satellite: [0.12, 8, 6],
    scar: [0.08, 0.5, 0.05],
  },
} as const;

export const enemyVisualAnimation = {
  timeRingTickRadians: 0.035,
  idleRadians: 0.12,
  idleLift: 0.035,
  commandFrames: { spawn: 12, hit: 6, critical: 8, death: 14 },
  shieldOrbitRadians: 0.045,
  shieldLift: 0.08,
  decorationOrbitRadians: 0.03,
} as const;
export const enemyVisualTransforms = {
  beetleShellZScale: 1.15,
  beetleShellY: 0.15,
  crownYRadians: Math.PI / 5,
  flatRingXRadians: Math.PI / 2,
  finZRadians: 0.7,
  scarZRadians: 0.35,
} as const;
