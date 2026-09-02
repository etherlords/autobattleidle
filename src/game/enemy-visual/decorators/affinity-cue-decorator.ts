import * as THREE from "three";

import type { EnemyViewBuilder } from "../builder";
import { component, mesh, type EnemyVisualComponent } from "../components";
import { enemyVisualAnimation, enemyVisualGeometry, enemyVisualLayout } from "../config";

type AffinityCue = "ember-shard" | "frost-mote" | "spark-ring" | "spore-bloom" | "tide-bead";
type AffinityPalette = {
  readonly core: string;
  readonly emissive: string;
  readonly accent: string;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

type CueBuild = {
  readonly group: THREE.Group;
  readonly tick?: () => void;
};

// One bounded builder per cue type; every cue stays at or under six meshes.
const cueBuilds: Readonly<Record<AffinityCue, (palette: AffinityPalette) => CueBuild>> = {
  "ember-shard": (palette) => {
    const group = new THREE.Group();
    [-1, 0, 1].forEach((slot) => {
      const shard = mesh(
        new THREE.TetrahedronGeometry(
          ...(slot === 0
            ? enemyVisualGeometry.affinity.shard
            : enemyVisualGeometry.affinity.shardSmall),
        ),
        slot === 0 ? palette.core : palette.accent,
        palette.emissive,
      );
      shard.name = `affinity-ember-shard-${slot + 1}`;
      shard.position.set(slot * 0.12, slot === 0 ? 0.05 : 0, slot === 0 ? 0 : -slot * 0.07);
      shard.rotation.set(slot * 0.6, slot * 0.9, slot * 0.4);
      group.add(shard);
    });
    let phase = 0;
    return {
      group,
      tick: () => {
        phase += enemyVisualAnimation.affinitySpinRadians;
        group.rotation.y = phase;
      },
    };
  },
  "frost-mote": (palette) => {
    const mote = new THREE.Mesh(
      new THREE.IcosahedronGeometry(...enemyVisualGeometry.affinity.mote),
      new THREE.MeshStandardMaterial({
        color: palette.core,
        emissive: palette.accent,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
      }),
    );
    mote.name = "affinity-frost-mote";
    let phase = 0;
    return {
      group: new THREE.Group().add(mote),
      tick: () => {
        phase += enemyVisualAnimation.affinitySpinRadians;
        mote.rotation.set(phase, phase * 1.4, 0);
      },
    };
  },
  "spark-ring": (palette) => {
    const ring = mesh(
      new THREE.TorusGeometry(...enemyVisualGeometry.affinity.ring),
      palette.accent,
      palette.emissive,
    );
    ring.name = "affinity-spark-ring";
    ring.rotation.x = Math.PI / 3;
    let phase = 0;
    return {
      group: new THREE.Group().add(ring),
      tick: () => {
        phase += enemyVisualAnimation.affinitySpinRadians;
        ring.rotation.z = phase;
      },
    };
  },
  "spore-bloom": (palette) => {
    const group = new THREE.Group();
    [-1, 0, 1].forEach((slot) => {
      const spore = mesh(
        new THREE.IcosahedronGeometry(...enemyVisualGeometry.affinity.spore),
        slot === 0 ? palette.core : palette.accent,
        palette.emissive,
      );
      spore.name = `affinity-spore-${slot + 1}`;
      spore.position.set(slot * 0.1, slot === 0 ? 0.06 : 0, slot === 0 ? 0 : -slot * 0.06);
      group.add(spore);
    });
    let phase = 0;
    return {
      group,
      tick: () => {
        phase += enemyVisualAnimation.affinitySpinRadians;
        group.rotation.y = phase;
      },
    };
  },
  "tide-bead": (palette) => {
    const bead = mesh(
      new THREE.SphereGeometry(...enemyVisualGeometry.affinity.bead),
      palette.core,
      palette.emissive,
    );
    bead.name = "affinity-tide-bead";
    const radius = enemyVisualLayout.affinity.beadOrbitRadius;
    let phase = 0;
    return {
      group: new THREE.Group().add(bead),
      tick: () => {
        phase += enemyVisualAnimation.affinityBeadRadians;
        bead.position.set(
          Math.cos(phase) * radius,
          Math.sin(phase * 2) * 0.04,
          Math.sin(phase) * radius,
        );
      },
    };
  },
};

export const decorateAffinityCue = (
  cue: AffinityCue,
  palette: AffinityPalette,
  reducedMotionOverride?: boolean,
): EnemyVisualComponent => {
  const build = cueBuilds[cue](palette);
  build.group.name = "affinity-cue";
  build.group.position.set(0, enemyVisualLayout.affinity.cueY, enemyVisualLayout.affinity.cueZ);
  const reducedMotion = reducedMotionOverride ?? prefersReducedMotion();
  return component(
    `affinity-cue-${cue}`,
    "decoration",
    [build.group],
    build.tick === undefined || reducedMotion ? undefined : { [`affinity-cue-${cue}`]: build.tick },
    undefined,
    "flank",
  );
};

export class AffinityCueDecorator {
  constructor(
    private readonly cue: AffinityCue,
    private readonly palette: AffinityPalette,
    private readonly reducedMotionOverride?: boolean,
  ) {}

  attach(builder: EnemyViewBuilder): void {
    builder.add(decorateAffinityCue(this.cue, this.palette, this.reducedMotionOverride));
  }
}
