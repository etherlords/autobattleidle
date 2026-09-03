import {
  selectEnemyFamilyIdentity,
  type EnemyAffinity,
  type EnemyFamilyIdentity,
  type EnemyGrade,
} from "../../domain/combat";
import type { BodyFamily, EnemyVisualInput, EnemyVisualSpec, ModifierCue } from "./spec";
import { enemyVisualSpec } from "./spec";
import {
  bossGeometryProfilesForFamily,
  type BossGeometryProfile,
} from "./decorators/boss-geometry-decorator";

export type EnemyVisualCompositionReceipt = {
  readonly input: EnemyVisualInput;
  readonly seed: number;
  readonly identity: EnemyFamilyIdentity;
  readonly family: BodyFamily;
  readonly body: BodyFamily;
  readonly variant: 0 | 1 | 2;
  readonly bodyVariant: 0 | 1 | 2;
  readonly affinity: EnemyAffinity;
  readonly grade: EnemyGrade;
  readonly modifierCue: ModifierCue;
  readonly geometryProfile: BossGeometryProfile;
  readonly geometryProfiles: readonly BossGeometryProfile[];
  readonly spec: EnemyVisualSpec;
};

/** Derives the compiler-checked visual identity and authored geometry assignment once. */
export const enemyVisualCompositionReceipt = (
  input: EnemyVisualInput,
): EnemyVisualCompositionReceipt => {
  const identity = selectEnemyFamilyIdentity(input);
  const spec = enemyVisualSpec(input);
  const geometryProfiles = bossGeometryProfilesForFamily(spec.body);
  const geometryProfile = geometryProfiles[0];
  if (geometryProfile === undefined)
    throw new RangeError("Enemy visual geometry profile registry is empty");
  return {
    input,
    seed: identity.seed,
    identity,
    family: identity.family,
    body: identity.family,
    variant: identity.variant,
    bodyVariant: identity.variant,
    affinity: identity.affinity,
    grade: input.grade,
    modifierCue: spec.modifierCue,
    geometryProfile,
    geometryProfiles,
    spec,
  };
};
