import * as THREE from "three";

export const PLAYER_FORM_STARTS = [1, 100, 500, 1_000, 10_000, 36_365] as const;
export type PlayerFormStart = 1 | 100 | 500 | 1_000 | 10_000 | 36_365;
export const PLAYER_MILESTONE_LEVELS = [
  1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1_000, 2_000, 3_000, 4_000, 5_000, 6_000, 7_000,
  8_000, 9_000, 10_000, 12_000, 14_000, 16_000, 18_000, 20_000, 22_000, 24_000, 26_000, 28_000,
  30_000, 32_000, 34_000, 36_000, 38_000, 40_000, 42_000, 44_000, 46_000, 48_000, 50_000, 55_000,
  60_000, 65_000, 70_000, 75_000, 80_000, 85_000, 90_000, 95_000, 100_000,
] as const;
export type PlayerMilestoneLevel =
  | 1
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 1_000
  | 2_000
  | 3_000
  | 4_000
  | 5_000
  | 6_000
  | 7_000
  | 8_000
  | 9_000
  | 10_000
  | 12_000
  | 14_000
  | 16_000
  | 18_000
  | 20_000
  | 22_000
  | 24_000
  | 26_000
  | 28_000
  | 30_000
  | 32_000
  | 34_000
  | 36_000
  | 38_000
  | 40_000
  | 42_000
  | 44_000
  | 46_000
  | 48_000
  | 50_000
  | 55_000
  | 60_000
  | 65_000
  | 70_000
  | 75_000
  | 80_000
  | 85_000
  | 90_000
  | 95_000
  | 100_000;

export type PlayerEvolutionIdentity = {
  readonly detailCount: number;
  readonly formStart: PlayerFormStart;
  readonly milestoneLevel: PlayerMilestoneLevel;
};

const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, metalness: 0.28, roughness: 0.42 });
const mesh = (
  name: string,
  geometry: THREE.BufferGeometry,
  color: string,
  emissive?: string,
): THREE.Mesh => {
  const result = new THREE.Mesh(geometry, material(color, emissive));
  result.name = name;
  return result;
};
const wing = (name: string, x: number, z: number, scale = 1): THREE.Mesh => {
  const result = mesh(name, new THREE.ConeGeometry(0.2, 1.1, 4), "#8fdcff", "#164d7b");
  result.position.set(x, 0.45, z);
  result.rotation.z = x < 0 ? -0.85 : 0.85;
  result.scale.setScalar(scale);
  return result;
};

const formForLevel = (level: number): PlayerFormStart => {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel >= 36_365) return 36_365;
  if (safeLevel >= 10_000) return 10_000;
  if (safeLevel >= 2_000) return 10_000;
  if (safeLevel >= 1_000) return 1_000;
  if (safeLevel >= 500) return 500;
  if (safeLevel >= 100) return 100;
  return 1;
};
const milestoneForLevel = (level: number): PlayerMilestoneLevel => {
  let selected: PlayerMilestoneLevel = PLAYER_MILESTONE_LEVELS[0] as PlayerMilestoneLevel;
  for (const candidate of PLAYER_MILESTONE_LEVELS) {
    if (candidate > level) break;
    selected = candidate;
  }
  return selected;
};

export const playerEvolutionIdentity = (level: number): PlayerEvolutionIdentity => {
  let safeLevel = 1;
  if (Number.isFinite(level)) safeLevel = Math.min(100_000, Math.max(1, Math.floor(level)));
  else if (level === Infinity) safeLevel = 100_000;
  return {
    formStart: formForLevel(safeLevel),
    detailCount:
      safeLevel >= 1_000 && safeLevel < 2_000
        ? Math.min(4, Math.floor((safeLevel - 1_000) / 200))
        : 0,
    milestoneLevel: milestoneForLevel(safeLevel),
  };
};
const MILESTONE_COLORS = [
  "#76d9ff",
  "#8df5ff",
  "#bc8cff",
  "#63f4d4",
  "#f8cc71",
  "#ff9d66",
] as const;
type PlayerMilestoneBadgeTier = "orb" | "nested" | "crest";

const milestoneBadgeTier = (milestoneIndex: number): PlayerMilestoneBadgeTier => {
  if (milestoneIndex < 10) return "orb";
  if (milestoneIndex < 40) return "nested";
  return "crest";
};

const milestoneBadgeColor = (milestoneIndex: number): string =>
  MILESTONE_COLORS[milestoneIndex % MILESTONE_COLORS.length] ?? MILESTONE_COLORS[0];

const buildMilestoneBadge = (milestoneLevel: PlayerMilestoneLevel): THREE.Group => {
  const milestoneIndex = Math.max(0, PLAYER_MILESTONE_LEVELS.indexOf(milestoneLevel));
  const tier = milestoneBadgeTier(milestoneIndex);
  const badge = new THREE.Group();
  badge.name = "player-milestone-detail";
  badge.userData.milestoneLevel = milestoneLevel;
  badge.userData.milestoneIndex = milestoneIndex;
  badge.userData.milestoneTier = tier;
  badge.userData.milestoneSignature = `${tier}:${milestoneIndex}:${milestoneLevel}`;

  const color = milestoneBadgeColor(milestoneIndex);
  if (tier === "orb") {
    const radius = 0.09 + milestoneIndex * 0.006;
    const segments = 8 + (milestoneIndex % 3) * 2;
    badge.add(
      mesh(
        "player-milestone-orb-core",
        new THREE.SphereGeometry(radius, segments, 6 + (milestoneIndex % 3) * 2),
        color,
        "#176b65",
      ),
    );
    return badge;
  }

  if (tier === "nested") {
    const variant = milestoneIndex - 10;
    const innerRadius = 0.075 + variant * 0.0015;
    const outerRadius = 0.16 + variant * 0.002;
    const thickness = 0.016 + (variant % 4) * 0.002;
    const inner = mesh(
      "player-milestone-nested-core",
      new THREE.SphereGeometry(innerRadius, 8 + (variant % 3) * 2, 6 + (variant % 2) * 2),
      color,
      "#176b65",
    );
    const middle = mesh(
      "player-milestone-nested-ring",
      new THREE.TorusGeometry(
        outerRadius,
        thickness,
        6 + (variant % 3) * 2,
        12 + (variant % 5) * 2,
      ),
      MILESTONE_COLORS[(milestoneIndex + 1) % MILESTONE_COLORS.length] ?? color,
      "#2873aa",
    );
    const innerRing = mesh(
      "player-milestone-nested-inner-ring",
      new THREE.TorusGeometry(
        innerRadius + 0.035 + (variant % 4) * 0.003,
        0.009 + (variant % 3) * 0.002,
        5 + (variant % 2),
        10 + (variant % 4) * 2,
      ),
      color,
      "#176b65",
    );
    const depthRing = mesh(
      "player-milestone-nested-depth-ring",
      new THREE.TorusGeometry(innerRadius + 0.02, 0.008, 5, 10 + (variant % 3) * 2),
      color,
      "#176b65",
    );
    innerRing.rotation.y = Math.PI / 2;
    depthRing.rotation.x = Math.PI / 2;
    badge.add(inner, middle, innerRing, depthRing);
    return badge;
  }

  const variant = milestoneIndex - 40;
  const crestRadius = 0.17 + variant * 0.004;
  const crestHeight = 0.27 + variant * 0.006;
  const core = mesh(
    "player-milestone-crest-core",
    new THREE.ConeGeometry(crestRadius, crestHeight, variant % 2 === 0 ? 4 : 5),
    color,
    "#8b5820",
  );
  core.rotation.y = (variant % 4) * (Math.PI / 4);
  const crestSpan = 0.12 + variant * 0.003;
  const crestBar = 0.038 + (variant % 3) * 0.004;
  const left = mesh(
    "player-milestone-crest-left",
    new THREE.BoxGeometry(crestBar, 0.2 + variant * 0.004, crestBar),
    MILESTONE_COLORS[(milestoneIndex + 2) % MILESTONE_COLORS.length] ?? color,
    "#8b5820",
  );
  const right = mesh(
    "player-milestone-crest-right",
    new THREE.BoxGeometry(crestBar, 0.2 + variant * 0.004, crestBar),
    MILESTONE_COLORS[(milestoneIndex + 2) % MILESTONE_COLORS.length] ?? color,
    "#8b5820",
  );
  left.position.x = -crestSpan;
  right.position.x = crestSpan;
  left.rotation.z = -0.55 - variant * 0.012;
  right.rotation.z = 0.55 + variant * 0.012;
  badge.add(core, left, right);
  return badge;
};

const MILESTONE_SOCKET_Y = 1.55;

const buildForm = (start: PlayerFormStart, milestoneLevel: PlayerMilestoneLevel): THREE.Group => {
  const group = new THREE.Group();
  group.name = `player-form-${start}`;
  const pose = new THREE.Group();
  pose.name = "player-pose";
  group.add(pose);
  if (start === 1) {
    pose.add(mesh("player-core-stone", new THREE.DodecahedronGeometry(0.62), "#6b7788"));
    pose.add(
      mesh("player-rune-crack", new THREE.TorusGeometry(0.26, 0.035, 4, 8), "#76d9ff", "#2873aa"),
    );
  } else if (start === 100) {
    pose.add(mesh("player-egg", new THREE.SphereGeometry(0.56, 12, 10), "#d8f3ff", "#2d6f94"));
    [-1, 1].forEach((side) => pose.add(wing(`player-fin-${side}`, side * 0.52, 0, 0.52)));
  } else if (start === 500) {
    pose.add(mesh("player-crystal", new THREE.OctahedronGeometry(0.72), "#59dfff", "#14668a"));
    [-0.62, 0, 0.62].forEach((x, index) => {
      const spark = mesh(
        `player-spark-${index}`,
        new THREE.OctahedronGeometry(0.1),
        "#ffe28a",
        "#b87514",
      );
      spark.position.set(x, 0.35 + Math.abs(x), 0.18);
      pose.add(spark);
    });
  } else if (start === 1_000) {
    pose.add(mesh("player-diamond", new THREE.ConeGeometry(0.62, 1.35, 4), "#bc8cff", "#4d217e"));
    [-1, 1].forEach((side) => {
      const blade = mesh(
        `player-blade-${side}`,
        new THREE.BoxGeometry(0.12, 1.18, 0.12),
        "#f5ecff",
        "#543b84",
      );
      blade.position.set(side * 0.55, 0.18, 0);
      blade.rotation.z = side * 0.58;
      pose.add(blade);
    });
  } else if (start === 10_000) {
    pose.add(mesh("player-warden", new THREE.IcosahedronGeometry(0.7), "#63f4d4", "#176b65"));
    [-1, 1].forEach((side) => pose.add(wing(`player-wing-${side}`, side * 0.76, 0.05)));
    pose.add(
      mesh("player-halo", new THREE.TorusGeometry(0.88, 0.045, 6, 18), "#f8cc71", "#8b5820"),
    );
  } else {
    pose.add(mesh("player-star", new THREE.IcosahedronGeometry(0.78, 1), "#ffc978", "#9e4a1d"));
    [-1, 1].forEach((side) => {
      pose.add(wing(`player-wing-front-${side}`, side * 0.84, 0.12, 1.1));
      pose.add(wing(`player-wing-back-${side}`, side * 0.64, -0.4, 0.84));
    });
    const crown = mesh("player-crown", new THREE.ConeGeometry(0.34, 0.58, 5), "#fff0a8", "#b77724");
    crown.position.y = 0.95;
    pose.add(crown);
  }
  const attack = new THREE.Object3D();
  attack.name = "player-socket-attack";
  attack.position.set(0, 0.12, 0.78);
  pose.add(attack);
  const aura = new THREE.Object3D();
  aura.name = "player-socket-aura";
  aura.position.y = 0.1;
  pose.add(aura);
  const milestoneSocket = new THREE.Object3D();
  milestoneSocket.name = "player-socket-milestone";
  milestoneSocket.position.set(0, MILESTONE_SOCKET_Y, 0);
  milestoneSocket.add(buildMilestoneBadge(milestoneLevel));
  pose.add(milestoneSocket);
  return group;
};

const disposeObject = (object: THREE.Object3D): void =>
  object.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose();
      node.material.dispose();
    }
  });

export class PlayerEvolution {
  readonly group: THREE.Group;
  private readonly pose: THREE.Group;
  private frame = 0;
  private hitFrames = 0;
  private attackFrames = 0;
  private disposed = false;

  constructor(
    readonly identity: PlayerEvolutionIdentity,
    private readonly reducedMotion: boolean,
  ) {
    this.group = buildForm(identity.formStart, identity.milestoneLevel);
    const pose = this.group.getObjectByName("player-pose");
    if (!(pose instanceof THREE.Group)) throw new Error("Player form pose is missing");
    this.pose = pose;
    for (let index = 0; index < identity.detailCount; index += 1) {
      const mote = mesh(
        `player-transition-detail-${index}`,
        new THREE.OctahedronGeometry(0.06),
        "#63f4d4",
        "#176b65",
      );
      mote.position.set((index - 1.5) * 0.2, 0.55 + index * 0.08, 0.25);
      this.pose.add(mote);
    }
  }

  replay(cue: "hit" | "attack"): void {
    if (cue === "hit") this.hitFrames = 8;
    else this.attackFrames = 10;
  }

  tick(): void {
    if (this.reducedMotion) return;
    this.frame += 1;
    this.pose.position.y = Math.sin(this.frame * 0.08) * 0.055;
    this.pose.rotation.y =
      this.identity.formStart >= 1_000 ? Math.sin(this.frame * 0.035) * 0.18 : 0;
    if (this.hitFrames > 0) {
      this.pose.scale.setScalar(0.88 + (8 - this.hitFrames) * 0.015);
      this.hitFrames -= 1;
    } else this.pose.scale.setScalar(1);
    if (this.attackFrames > 0) {
      this.pose.rotation.x = (10 - this.attackFrames) * 0.055;
      this.attackFrames -= 1;
    } else this.pose.rotation.x = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject(this.group);
    this.group.removeFromParent();
  }
}
