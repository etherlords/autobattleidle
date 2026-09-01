import * as THREE from "three";

export const PLAYER_FORM_STARTS = [1, 100, 500, 1_000, 10_000, 36_365] as const;
export type PlayerFormStart = 1 | 100 | 500 | 1_000 | 10_000 | 36_365;

export type PlayerEvolutionForm = {
  readonly start: PlayerFormStart;
  readonly name: string;
  readonly brief: string;
};

export const PLAYER_EVOLUTION_FORMS: readonly PlayerEvolutionForm[] = [
  { start: 1, name: "Seedstone", brief: "Faceted stone core, rune crack, slow hover." },
  { start: 100, name: "Hatchling", brief: "Split egg shell, two fins, pulse on hit." },
  { start: 500, name: "Sparkbound", brief: "Tall crystal core, three sparks, attack flare." },
  { start: 1_000, name: "Runeblade", brief: "Diamond torso, crossed blades, turning idle." },
  { start: 10_000, name: "Aether Warden", brief: "Winged guardian, orbiting halo, wing beat." },
  {
    start: 36_365,
    name: "Astral Sovereign",
    brief: "Crowned star body, four wings, radiant attack.",
  },
];

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

const buildForm = (start: PlayerFormStart): THREE.Group => {
  const group = new THREE.Group();
  const form = PLAYER_EVOLUTION_FORMS.find((candidate) => candidate.start === start);
  if (form === undefined) throw new RangeError(`Unknown player form ${start}`);
  group.name = `lab-player-form-${start}`;
  const pose = new THREE.Group();
  pose.name = "lab-player-pose";
  group.add(pose);
  if (start === 1) {
    pose.add(mesh("lab-player-core-stone", new THREE.DodecahedronGeometry(0.62), "#6b7788"));
    pose.add(
      mesh(
        "lab-player-rune-crack",
        new THREE.TorusGeometry(0.26, 0.035, 4, 8),
        "#76d9ff",
        "#2873aa",
      ),
    );
  } else if (start === 100) {
    pose.add(mesh("lab-player-egg", new THREE.SphereGeometry(0.56, 12, 10), "#d8f3ff", "#2d6f94"));
    [-1, 1].forEach((side) => pose.add(wing(`lab-player-fin-${side}`, side * 0.52, 0, 0.52)));
  } else if (start === 500) {
    pose.add(mesh("lab-player-crystal", new THREE.OctahedronGeometry(0.72), "#59dfff", "#14668a"));
    [-0.62, 0, 0.62].forEach((x, index) => {
      const spark = mesh(
        `lab-player-spark-${index}`,
        new THREE.OctahedronGeometry(0.1),
        "#ffe28a",
        "#b87514",
      );
      spark.position.set(x, 0.35 + Math.abs(x), 0.18);
      pose.add(spark);
    });
  } else if (start === 1_000) {
    pose.add(
      mesh("lab-player-diamond", new THREE.ConeGeometry(0.62, 1.35, 4), "#bc8cff", "#4d217e"),
    );
    [-1, 1].forEach((side) => {
      const blade = mesh(
        `lab-player-blade-${side}`,
        new THREE.BoxGeometry(0.12, 1.18, 0.12),
        "#f5ecff",
        "#543b84",
      );
      blade.position.set(side * 0.55, 0.18, 0);
      blade.rotation.z = side * 0.58;
      pose.add(blade);
    });
  } else if (start === 10_000) {
    pose.add(mesh("lab-player-warden", new THREE.IcosahedronGeometry(0.7), "#63f4d4", "#176b65"));
    [-1, 1].forEach((side) => pose.add(wing(`lab-player-wing-${side}`, side * 0.76, 0.05)));
    pose.add(
      mesh("lab-player-halo", new THREE.TorusGeometry(0.88, 0.045, 6, 18), "#f8cc71", "#8b5820"),
    );
  } else {
    pose.add(mesh("lab-player-star", new THREE.IcosahedronGeometry(0.78, 1), "#ffc978", "#9e4a1d"));
    [-1, 1].forEach((side) => {
      pose.add(wing(`lab-player-wing-front-${side}`, side * 0.84, 0.12, 1.1));
      pose.add(wing(`lab-player-wing-back-${side}`, side * 0.64, -0.4, 0.84));
    });
    const crown = mesh(
      "lab-player-crown",
      new THREE.ConeGeometry(0.34, 0.58, 5),
      "#fff0a8",
      "#b77724",
    );
    crown.position.y = 0.95;
    pose.add(crown);
  }
  const attack = new THREE.Object3D();
  attack.name = "lab-player-socket-attack";
  attack.position.set(0, 0.12, 0.78);
  pose.add(attack);
  const aura = new THREE.Object3D();
  aura.name = "lab-player-socket-aura";
  aura.position.y = 0.1;
  pose.add(aura);
  return group;
};

export class LabPlayerEvolution {
  readonly group: THREE.Group;
  private readonly pose: THREE.Group;
  private frame = 0;
  private hitFrames = 0;
  private attackFrames = 0;

  constructor(
    readonly start: PlayerFormStart,
    private readonly reducedMotion: boolean,
  ) {
    this.group = buildForm(start);
    const pose = this.group.getObjectByName("lab-player-pose");
    if (!(pose instanceof THREE.Group)) throw new Error("Player form pose is missing");
    this.pose = pose;
  }

  replay(cue: "hit" | "attack"): void {
    if (cue === "hit") this.hitFrames = 8;
    else this.attackFrames = 10;
  }

  tick(): void {
    if (this.reducedMotion) return;
    this.frame += 1;
    const hover = Math.sin(this.frame * 0.08) * 0.055;
    this.pose.position.y = hover;
    this.pose.rotation.y = this.start >= 1_000 ? Math.sin(this.frame * 0.035) * 0.18 : 0;
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
    this.group.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      node.material.dispose();
    });
    this.group.removeFromParent();
  }
}
