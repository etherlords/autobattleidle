import * as THREE from "three";

export type EnemyVisualInput = {
  readonly grade: string;
  readonly level: number;
  readonly modifier: string | null;
};

type BodyFamily = "beetle" | "brute" | "wisp" | "boss-colossus" | "boss-hydra";
type Decoration = "fins" | "horns" | "orbitals" | "satellites" | "scar";
type GradeCue = "none" | "crest" | "spikes" | "crown";
export type ModifierCue =
  "shield-plates" | "vitality-core" | "time-ring" | "wealth-orbitals" | null;

export type EnemyVisualSpec = {
  readonly body: BodyFamily;
  readonly decorations: readonly Decoration[];
  readonly gradeCue: GradeCue;
  readonly modifierCue: ModifierCue;
  readonly scale: number;
  readonly seed: number;
};

export type EnemyVisual = {
  readonly group: THREE.Group;
  readonly spec: EnemyVisualSpec;
  tick(): void;
};

const material = (color: string, emissive = "#000000"): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.55 });

const mesh = (geometry: THREE.BufferGeometry, color: string, emissive?: string): THREE.Mesh =>
  new THREE.Mesh(geometry, material(color, emissive));

export const stableEnemySeed = (enemy: EnemyVisualInput): number => {
  let seed = Math.abs(Math.trunc(enemy.level)) || 1;
  for (const character of `${enemy.grade}:${enemy.modifier ?? "none"}`) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }
  return seed;
};

const bodyFamily = (enemy: EnemyVisualInput): BodyFamily => {
  const identityLevel = Math.abs(Math.trunc(enemy.level));
  if (enemy.grade === "boss") return identityLevel % 2 === 0 ? "boss-colossus" : "boss-hydra";
  return (["beetle", "brute", "wisp"] as const)[identityLevel % 3] ?? "beetle";
};

const modifierCue = (modifier: string | null): ModifierCue => {
  if (modifier === "armor") return "shield-plates";
  if (modifier === "health") return "vitality-core";
  if (modifier === "automatic-slow") return "time-ring";
  return modifier === "wealth" ? "wealth-orbitals" : null;
};

const gradeCue = (grade: string): GradeCue =>
  grade === "boss"
    ? "crown"
    : grade === "elite"
      ? "spikes"
      : grade === "veteran"
        ? "crest"
        : "none";

const decorationChoices = (seed: number): readonly Decoration[] => {
  const choices = ["fins", "horns", "orbitals", "satellites", "scar"] as const;
  return [
    choices[seed % choices.length] ?? "fins",
    choices[(seed >>> 3) % choices.length] ?? "horns",
  ];
};

export const enemyVisualSpec = (enemy: EnemyVisualInput): EnemyVisualSpec => {
  const seed = stableEnemySeed(enemy);
  return {
    body: bodyFamily(enemy),
    decorations: decorationChoices(seed),
    gradeCue: gradeCue(enemy.grade),
    modifierCue: modifierCue(enemy.modifier),
    scale: enemy.grade === "boss" ? 1.45 : enemy.grade === "elite" ? 1.12 : 1,
    seed,
  };
};

const addBody = (group: THREE.Group, body: BodyFamily): void => {
  const core =
    body === "beetle"
      ? mesh(new THREE.SphereGeometry(0.7, 12, 10), "#ff9d66", "#4d180d")
      : body === "brute"
        ? mesh(new THREE.BoxGeometry(1.1, 0.9, 0.9), "#f3bd58", "#4d3210")
        : body === "wisp"
          ? mesh(new THREE.OctahedronGeometry(0.8), "#bd7cff", "#311653")
          : body === "boss-colossus"
            ? mesh(new THREE.CylinderGeometry(0.8, 1.05, 1.55, 8), "#e9576d", "#5b1021")
            : mesh(new THREE.IcosahedronGeometry(0.95, 1), "#d754c3", "#4e123f");
  core.name = `enemy-body-${body}`;
  group.add(core);
  if (body === "beetle") {
    const shell = mesh(new THREE.SphereGeometry(0.5, 10, 8), "#cf563f");
    shell.scale.z = 1.15;
    shell.position.y = 0.15;
    group.add(shell);
  }
  if (body === "boss-hydra") {
    for (const offset of [-0.55, 0.55]) {
      const head = mesh(new THREE.ConeGeometry(0.35, 0.7, 5), "#ff8fdb", "#4e123f");
      head.position.set(offset, 0.6, 0);
      group.add(head);
    }
  }
};

const addGradeCue = (group: THREE.Group, cue: GradeCue): void => {
  if (cue === "crest") {
    const crest = mesh(new THREE.ConeGeometry(0.25, 0.7, 4), "#fff0a8");
    crest.position.y = 0.75;
    group.add(crest);
  }
  if (cue === "spikes") {
    for (const offset of [-0.45, 0.45]) {
      const spike = mesh(new THREE.ConeGeometry(0.16, 0.55, 4), "#f0c8ff");
      spike.position.set(offset, 0.65, 0);
      group.add(spike);
    }
  }
  if (cue === "crown") {
    const crown = mesh(new THREE.ConeGeometry(0.75, 0.5, 5), "#f8d28b", "#60420b");
    crown.name = "boss-crown";
    crown.position.y = 1;
    crown.rotation.y = Math.PI / 5;
    group.add(crown);
  }
};

const addModifierCue = (group: THREE.Group, cue: ModifierCue): THREE.Object3D | undefined => {
  if (cue === "shield-plates") {
    for (const offset of [-0.7, 0.7]) {
      const plate = mesh(new THREE.BoxGeometry(0.18, 0.8, 0.12), "#d6e5f0");
      plate.position.x = offset;
      group.add(plate);
    }
  }
  if (cue === "vitality-core") {
    const core = mesh(new THREE.SphereGeometry(0.34, 10, 8), "#7dff92", "#163f1d");
    core.name = "vitality-core";
    group.add(core);
  }
  if (cue === "time-ring") {
    const ring = mesh(new THREE.TorusGeometry(0.88, 0.07, 8, 16), "#8cb7ff", "#12274d");
    ring.name = "time-ring";
    ring.rotation.x = Math.PI / 2;
    const hand = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), "#e8f0ff");
    hand.position.y = 0.25;
    ring.add(hand);
    group.add(ring);
    return ring;
  }
  if (cue === "wealth-orbitals") {
    for (const offset of [-0.65, 0.65]) {
      const coin = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), "#f8d28b", "#60420b");
      coin.rotation.x = Math.PI / 2;
      coin.position.set(offset, 0.45, 0);
      group.add(coin);
    }
  }
  return undefined;
};

const addDecoration = (group: THREE.Group, decoration: Decoration, index: number): void => {
  const offset = index === 0 ? -1 : 1;
  if (decoration === "fins") {
    const fin = mesh(new THREE.ConeGeometry(0.18, 0.65, 3), "#8ddcff");
    fin.position.set(offset * 0.48, 0.2, 0);
    fin.rotation.z = offset * 0.7;
    group.add(fin);
  } else if (decoration === "horns") {
    const horn = mesh(new THREE.ConeGeometry(0.13, 0.55, 4), "#fff0cf");
    horn.position.set(offset * 0.42, 0.65, 0);
    group.add(horn);
  } else if (decoration === "orbitals") {
    const orbital = mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 12), "#f6a8ff");
    orbital.position.x = offset * 0.25;
    orbital.rotation.x = Math.PI / 2;
    group.add(orbital);
  } else if (decoration === "satellites") {
    const satellite = mesh(new THREE.SphereGeometry(0.12, 8, 6), "#d8f7ff");
    satellite.position.set(offset * 0.7, 0.4, 0);
    group.add(satellite);
  } else {
    const scar = mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), "#421217");
    scar.position.set(offset * 0.2, 0.1, 0.7);
    scar.rotation.z = offset * 0.35;
    group.add(scar);
  }
};

export const createEnemyVisual = (enemy: EnemyVisualInput): EnemyVisual => {
  const spec = enemyVisualSpec(enemy);
  const group = new THREE.Group();
  addBody(group, spec.body);
  addGradeCue(group, spec.gradeCue);
  const timeRing = addModifierCue(group, spec.modifierCue);
  spec.decorations.forEach((decoration, index) => addDecoration(group, decoration, index));
  group.scale.setScalar(spec.scale);
  group.position.set(1.7, 0.8, 0);
  return {
    group,
    spec,
    tick: () => {
      if (timeRing !== undefined) timeRing.rotation.z += 0.035;
    },
  };
};
