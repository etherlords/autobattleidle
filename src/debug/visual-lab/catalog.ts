import {
  ENEMY_AFFINITY_IDS,
  ENEMY_MODIFIERS,
  selectEnemyFamilyIdentity,
  type EliteModifier,
  type EnemyAffinity,
  type EnemyFamily,
  type EnemyGrade,
  type EnemyPresentationModifier,
} from "../../domain/combat";
import { BATTLEFIELD_EFFECT_CONFIG, type EffectKind } from "../../game/battlefield/effects";
import { enemyBodyFactories } from "../../game/enemy-visual/bodies";
import { ENEMY_VISUAL_GRADES, type EnemyVisualInput } from "../../game/enemy-visual/spec";
import {
  enemyVisualCompositionReceipt,
  type EnemyVisualCompositionMode,
  type EnemyVisualCompositionReceipt,
} from "../../game/enemy-visual/receipt";
import { compositionModeForLabRecipe, type LabRecipe } from "./recipes";

export const LAB_FAMILIES = Object.keys(enemyBodyFactories) as readonly EnemyFamily[];
export const LAB_GRADES = ENEMY_VISUAL_GRADES;
export const LAB_AFFINITIES = ENEMY_AFFINITY_IDS;
export const LAB_VARIANTS = [0, 1, 2] as const;
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
  readonly affinity: EnemyAffinity;
  readonly family: EnemyFamily;
  readonly grade: EnemyGrade;
  readonly modifier: EnemyPresentationModifier;
  readonly variant: 0 | 1 | 2;
  readonly goldenBug: boolean;
};

const DEFAULT_CASE: LabCase = {
  affinity: "cinder",
  family: "beetle",
  grade: "normal",
  modifier: null,
  variant: 0,
  goldenBug: false,
};

const LAB_INPUT_SEARCH_LIMIT = 2_000;
const INPUT_CACHE = new Map<string, EnemyVisualInput | null>();
const PRIMED_INPUT_COHORTS = new Set<string>();
const inputCacheKey = (labCase: LabCase): string =>
  `${labCase.affinity}:${labCase.family}:${labCase.grade}:${labCase.modifier ?? "none"}:${labCase.variant}`;
const inputCohortKey = (grade: EnemyGrade, modifier: EnemyPresentationModifier): string =>
  `${grade}:${modifier ?? "none"}`;

/**
 * Resolve one grade/modifier cohort in a single deterministic scan. The lab asks for every
 * affinity against the same selectable body/variant matrix; indexing the production selector
 * once avoids repeating the same level walk for each affinity while preserving first-match order.
 */
const primeInputCohort = (grade: EnemyGrade, modifier: EnemyPresentationModifier): void => {
  const cohort = inputCohortKey(grade, modifier);
  if (PRIMED_INPUT_COHORTS.has(cohort)) return;
  PRIMED_INPUT_COHORTS.add(cohort);
  const unresolved = new Set(
    LAB_FAMILIES.flatMap((family) =>
      LAB_AFFINITIES.flatMap((affinity) =>
        LAB_VARIANTS.map(
          (variant) => `${affinity}:${family}:${grade}:${modifier ?? "none"}:${variant}`,
        ),
      ),
    ),
  );
  for (let level = 1; level <= LAB_INPUT_SEARCH_LIMIT && unresolved.size > 0; level += 1) {
    const candidate: EnemyVisualInput = { grade, level, modifier };
    const identity = selectEnemyFamilyIdentity(candidate);
    const key = `${identity.affinity}:${identity.family}:${grade}:${modifier ?? "none"}:${identity.variant}`;
    if (!unresolved.has(key)) continue;
    INPUT_CACHE.set(key, candidate);
    unresolved.delete(key);
  }
  unresolved.forEach((key) => INPUT_CACHE.set(key, null));
};

export const inputForCase = (labCase: LabCase): EnemyVisualInput => {
  if (labCase.goldenBug) {
    if (
      labCase.affinity !== "cinder" ||
      labCase.family !== "beetle" ||
      labCase.grade !== "normal" ||
      labCase.modifier !== null ||
      labCase.variant !== 0
    )
      throw new RangeError("Golden Bug composition is fixed to the cinder beetle baseline");
    return { grade: "normal", level: 1, modifier: null, goldenBug: true };
  }
  const key = inputCacheKey(labCase);
  primeInputCohort(labCase.grade, labCase.modifier);
  const cached = INPUT_CACHE.get(key);
  if (cached === undefined || cached === null)
    throw new RangeError(
      `No production input for ${labCase.affinity}:${labCase.family}:${labCase.grade}:${labCase.modifier}`,
    );
  return cached;
};

/** Visual Lab uses the production input resolver, so its receipt cannot drift from gameplay. */
export const compositionReceiptForCase = (
  labCase: LabCase & { readonly recipe?: LabRecipe },
  compositionMode?: EnemyVisualCompositionMode,
): EnemyVisualCompositionReceipt => {
  const selectedMode =
    compositionMode ??
    (labCase.recipe === undefined ? "production" : compositionModeForLabRecipe(labCase.recipe));
  return enemyVisualCompositionReceipt(inputForCase(labCase), selectedMode);
};

export const LAB_CASES: readonly LabCase[] = (() => {
  const baseCandidates = LAB_FAMILIES.flatMap((family) =>
    LAB_GRADES.flatMap((grade) =>
      LAB_MODIFIERS.flatMap((modifier) =>
        LAB_VARIANTS.map((variant) => ({
          family,
          grade,
          modifier,
          variant,
          goldenBug: false,
        })),
      ),
    ),
  );
  const cases: LabCase[] = baseCandidates.flatMap((candidate) => {
    const affinity = LAB_AFFINITIES.find((value) => {
      try {
        inputForCase({ ...candidate, affinity: value });
        return true;
      } catch {
        return false;
      }
    });
    return affinity === undefined ? [] : [{ ...candidate, affinity }];
  });
  cases.push({
    affinity: "cinder",
    family: "beetle",
    grade: "normal",
    modifier: null,
    variant: 0,
    goldenBug: true,
  });
  return cases;
})();

export const canonicalLabCase = (candidate: LabCase): LabCase => {
  if (candidate.goldenBug)
    return {
      ...candidate,
      affinity: "cinder",
      family: "beetle",
      grade: "normal",
      modifier: null,
      variant: 0,
    };
  try {
    inputForCase(candidate);
    return candidate;
  } catch {
    return DEFAULT_CASE;
  }
};

export const reachableLabCases = (candidate: Partial<LabCase>): readonly LabCase[] => {
  const filtered = LAB_CASES.filter(
    (known) =>
      (candidate.family === undefined || known.family === candidate.family) &&
      (candidate.grade === undefined || known.grade === candidate.grade) &&
      (candidate.modifier === undefined || known.modifier === candidate.modifier) &&
      (candidate.variant === undefined || known.variant === candidate.variant) &&
      (candidate.goldenBug === undefined || known.goldenBug === candidate.goldenBug),
  );
  const affinity = candidate.affinity;
  if (affinity === undefined) return filtered;
  return filtered.flatMap((known) => {
    const selected = { ...known, affinity };
    try {
      inputForCase(selected);
      return [selected];
    } catch {
      return [];
    }
  });
};
/** Reconcile a family change without carrying incompatible dependent selections forward. */
export const reconcileLabFamily = (current: LabCase, family: EnemyFamily): LabCase => {
  if (current.goldenBug) return current;
  return (
    reachableLabCases({ family, affinity: current.affinity, goldenBug: false })[0] ??
    reachableLabCases({ family, goldenBug: false })[0] ??
    current
  );
};

export const firstReachableLabCase = (candidate: Partial<LabCase>): LabCase => {
  const matches = reachableLabCases(candidate);
  if (candidate.affinity === undefined) return matches[0] ?? DEFAULT_CASE;
  for (const match of matches) {
    const selected = { ...match, affinity: candidate.affinity };
    try {
      inputForCase(selected);
      return selected;
    } catch {
      continue;
    }
  }
  return DEFAULT_CASE;
};

export const toggleGoldenLabCase = (current: LabCase, enabled: boolean): LabCase =>
  enabled
    ? firstReachableLabCase({ goldenBug: true })
    : firstReachableLabCase({ ...current, goldenBug: false });

export const allLabCases = (): readonly LabCase[] => {
  return LAB_CASES;
};
