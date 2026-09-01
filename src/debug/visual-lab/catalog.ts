import {
  ENEMY_MODIFIERS,
  selectEnemyFamilyIdentity,
  type EliteModifier,
  type EnemyFamily,
  type EnemyGrade,
  type EnemyPresentationModifier,
} from "../../domain/combat";
import { BATTLEFIELD_EFFECT_CONFIG, type EffectKind } from "../../game/battlefield/effects";
import { enemyBodyFactories } from "../../game/enemy-visual/bodies";
import { ENEMY_VISUAL_GRADES, type EnemyVisualInput } from "../../game/enemy-visual/spec";

export const LAB_FAMILIES = Object.keys(enemyBodyFactories) as readonly EnemyFamily[];
export const LAB_GRADES = ENEMY_VISUAL_GRADES;
export const LAB_MODIFIERS = [
  null,
  ...(Object.keys(ENEMY_MODIFIERS) as EliteModifier[]),
  "wealth",
] as const satisfies readonly EnemyPresentationModifier[];
export const LAB_EFFECTS = Object.keys(BATTLEFIELD_EFFECT_CONFIG.variants) as EffectKind[];
export const LAB_CUES = [
  "idle",
  "spawn",
  "hit",
  "attack",
  "critical",
  "death",
  ...LAB_EFFECTS.map((effect) => `effect-${effect}`),
] as const;

export const effectForLabCue = (cue: string): EffectKind | undefined =>
  LAB_EFFECTS.find((effect) => cue === `effect-${effect}`);

export type LabCase = {
  readonly family: EnemyFamily;
  readonly grade: EnemyGrade;
  readonly modifier: EnemyPresentationModifier;
  readonly variant: 0 | 1 | 2;
  readonly goldenBug: boolean;
};

const DEFAULT_CASE: LabCase = {
  family: "beetle",
  grade: "normal",
  modifier: null,
  variant: 0,
  goldenBug: false,
};

const matches = (candidate: EnemyVisualInput, labCase: LabCase): boolean => {
  const identity = selectEnemyFamilyIdentity(candidate);
  return identity.family === labCase.family && identity.variant === labCase.variant;
};

export const inputForCase = (labCase: LabCase): EnemyVisualInput => {
  if (labCase.goldenBug) return { grade: "normal", level: 1, modifier: null, goldenBug: true };
  for (let level = 1; level <= 1_000; level += 1) {
    const candidate: EnemyVisualInput = {
      grade: labCase.grade,
      level,
      modifier: labCase.modifier,
    };
    if (matches(candidate, labCase)) return candidate;
  }
  throw new RangeError(
    `No production input for ${labCase.family}:${labCase.grade}:${labCase.modifier}`,
  );
};

export const LAB_CASES: readonly LabCase[] = (() => {
  const cases: LabCase[] = [];
  const candidates = LAB_FAMILIES.flatMap((family) =>
    LAB_GRADES.flatMap((grade) =>
      LAB_MODIFIERS.flatMap((modifier) =>
        ([0, 1, 2] as const).map((variant) => ({
          family,
          grade,
          modifier,
          variant,
          goldenBug: false,
        })),
      ),
    ),
  );
  candidates.forEach((candidate) => {
    try {
      inputForCase(candidate);
      cases.push(candidate);
    } catch {
      /* impossible production combination */
    }
  });
  cases.push({ family: "beetle", grade: "normal", modifier: null, variant: 0, goldenBug: true });
  return cases;
})();

export const canonicalLabCase = (candidate: LabCase): LabCase =>
  LAB_CASES.find(
    (known) =>
      known.family === candidate.family &&
      known.grade === candidate.grade &&
      known.modifier === candidate.modifier &&
      known.variant === candidate.variant &&
      known.goldenBug === candidate.goldenBug,
  ) ?? DEFAULT_CASE;

export const reachableLabCases = (candidate: Partial<LabCase>): readonly LabCase[] =>
  LAB_CASES.filter(
    (known) =>
      (candidate.family === undefined || known.family === candidate.family) &&
      (candidate.grade === undefined || known.grade === candidate.grade) &&
      (candidate.modifier === undefined || known.modifier === candidate.modifier) &&
      (candidate.variant === undefined || known.variant === candidate.variant) &&
      (candidate.goldenBug === undefined || known.goldenBug === candidate.goldenBug),
  );

export const firstReachableLabCase = (candidate: Partial<LabCase>): LabCase =>
  reachableLabCases(candidate)[0] ?? DEFAULT_CASE;

export const toggleGoldenLabCase = (current: LabCase, enabled: boolean): LabCase =>
  enabled
    ? firstReachableLabCase({ goldenBug: true })
    : firstReachableLabCase({ ...current, goldenBug: false });

export const allLabCases = (): readonly LabCase[] => {
  return LAB_CASES;
};
