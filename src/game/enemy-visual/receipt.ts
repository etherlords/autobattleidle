import {
  selectEnemyFamilyIdentity,
  type EnemyAffinity,
  type EnemyFamilyIdentity,
  type EnemyGrade,
} from "../../domain/combat";
import type { BodyFamily, EnemyVisualInput, EnemyVisualSpec, ModifierCue } from "./spec";
import { enemyVisualSpec } from "./spec";
import {
  bossGeometryProfileForSeed,
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
  const spec = enemyVisualSpec(input);
  const identity = selectEnemyFamilyIdentity(input);
  const geometryProfiles = bossGeometryProfilesForFamily(spec.body);
  const geometryProfile = bossGeometryProfileForSeed(spec.body, spec.seed, input.level);
  if (geometryProfile === "legacy/no-overlay" && spec.body.startsWith("boss-"))
    throw new RangeError("Boss visual geometry profile registry did not select a recipe");
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
