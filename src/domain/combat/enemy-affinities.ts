// Registry owns affinity themes only; family pairing lives in family-identity.ts.

/**
 * Elemental affinity theme applied to every enemy from its deterministic encounter identity.
 * The registry is compiler-checked: adding a family or affinity without registering its
 * pairing fails exhaustive registry tests instead of silently rendering a default.
 */
export type EnemyAffinity =
  | "cinder"
  | "ice"
  | "ash"
  | "toxic"
  | "volt"
  | "tide"
  | "dusk"
  | "verdant"
  | "gilded"
  | "frost"
  | "magma"
  | "prism";

export type EnemyAffinityProfile = {
  /** Compact display adjective used by the deterministic naming grammar. */
  readonly label: string;
  /** Bounded authored cue shape rendered through existing semantic sockets. */
  readonly cue: "ember-shard" | "frost-mote" | "spark-ring" | "spore-bloom" | "tide-bead";
  /** Symmetric measured reward multiplier; the 12-theme mean is exactly 1.00. */
  readonly rewardMultiplier: number;
  /** Coordinated palette override applied through the existing profile palette owner. */
  readonly palette: {
    readonly core: string;
    readonly emissive: string;
    readonly accent: string;
  };
};

type AffinityCueLiteral = "ember-shard" | "frost-mote" | "spark-ring" | "spore-bloom" | "tide-bead";
type AffinityPaletteLiteral = {
  readonly core: string;
  readonly emissive: string;
  readonly accent: string;
};

const affinity = (
  label: string,
  cue: AffinityCueLiteral,
  palette: AffinityPaletteLiteral,
  rewardMultiplier: number,
): EnemyAffinityProfile => ({ cue, label, palette, rewardMultiplier });

/**
 * The reward factors are symmetric around 1.00 (four 0.99, four 1.00, four 1.01) so the
 * twelve-theme mean is exactly 1.00: affinities redistribute reward pacing across the
 * affinity lottery without shifting the ABI-020/ABI-028 expected economy envelope.
 */
export const ENEMY_AFFINITIES: Readonly<Record<EnemyAffinity, EnemyAffinityProfile>> = {
  cinder: affinity(
    "Cinder",
    "ember-shard",
    { core: "#ff9d66", emissive: "#4d180d", accent: "#ffb35c" },
    1.01,
  ),
  ice: affinity(
    "Ice",
    "frost-mote",
    { core: "#9fd8ff", emissive: "#123a5c", accent: "#75c7ff" },
    0.99,
  ),
  ash: affinity(
    "Ash",
    "spore-bloom",
    { core: "#c9c4bd", emissive: "#3b3835", accent: "#948e86" },
    1,
  ),
  toxic: affinity(
    "Toxic",
    "spore-bloom",
    { core: "#a4e34a", emissive: "#2c4a08", accent: "#7db52f" },
    0.99,
  ),
  volt: affinity(
    "Volt",
    "spark-ring",
    { core: "#ffe66d", emissive: "#5c4a08", accent: "#f0c832" },
    1.01,
  ),
  tide: affinity(
    "Tide",
    "tide-bead",
    { core: "#4fc3e8", emissive: "#0d3d52", accent: "#2f97ba" },
    1,
  ),
  dusk: affinity(
    "Dusk",
    "frost-mote",
    { core: "#8f7dff", emissive: "#241a52", accent: "#6a55d4" },
    1,
  ),
  verdant: affinity(
    "Verdant",
    "spore-bloom",
    { core: "#5fd39a", emissive: "#0d3d24", accent: "#3aa873" },
    0.99,
  ),
  gilded: affinity(
    "Gilded",
    "ember-shard",
    { core: "#d4af37", emissive: "#5c4300", accent: "#fff1a3" },
    1.01,
  ),
  frost: affinity(
    "Frost",
    "frost-mote",
    { core: "#d9f2ff", emissive: "#2a4a5c", accent: "#a8d4e8" },
    0.99,
  ),
  magma: affinity(
    "Magma",
    "ember-shard",
    { core: "#ff6d52", emissive: "#5c1408", accent: "#d94f2f" },
    1.01,
  ),
  prism: affinity(
    "Prism",
    "spark-ring",
    { core: "#ff8fdb", emissive: "#4e123f", accent: "#d754c3" },
    1,
  ),
} as const satisfies Record<EnemyAffinity, EnemyAffinityProfile>;

export const ENEMY_AFFINITY_IDS = Object.keys(ENEMY_AFFINITIES) as readonly EnemyAffinity[];

const affinities: readonly EnemyAffinity[] = ENEMY_AFFINITY_IDS;
const rewardSum = affinities.reduce(
  (total, id) => total + ENEMY_AFFINITIES[id].rewardMultiplier,
  0,
);
if (Math.abs(rewardSum / affinities.length - 1) > 1e-9)
  throw new Error("Affinity reward multipliers must average exactly 1.00");
