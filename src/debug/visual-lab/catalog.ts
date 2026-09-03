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
  type EnemyVisualCompositionReceipt,
} from "../../game/enemy-visual/receipt";

export const LAB_FAMILIES = Object.keys(enemyBodyFactories) as readonly EnemyFamily[];
export const LAB_GRADES = ENEMY_VISUAL_GRADES;
export const LAB_AFFINITIES = ENEMY_AFFINITY_IDS;
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

const matches = (candidate: EnemyVisualInput, labCase: LabCase): boolean => {
  const identity = selectEnemyFamilyIdentity(candidate);
  return (
    identity.affinity === labCase.affinity &&
    identity.family === labCase.family &&
    identity.variant === labCase.variant
  );
};
const LAB_INPUT_SEARCH_LIMIT = 2_000;
const INPUT_CACHE = new Map<string, EnemyVisualInput | null>();
const inputCacheKey = (labCase: LabCase): string =>
  `${labCase.affinity}:${labCase.family}:${labCase.grade}:${labCase.modifier ?? "none"}:${labCase.variant}`;

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
  const cached = INPUT_CACHE.get(key);
  if (cached !== undefined) {
    if (cached === null)
      throw new RangeError(
        `No production input for ${labCase.affinity}:${labCase.family}:${labCase.grade}:${labCase.modifier}`,
      );
    return cached;
  }
  for (let level = 1; level <= LAB_INPUT_SEARCH_LIMIT; level += 1) {
    const candidate: EnemyVisualInput = {
      grade: labCase.grade,
      level,
      modifier: labCase.modifier,
    };
    if (matches(candidate, labCase)) {
      INPUT_CACHE.set(key, candidate);
      return candidate;
    }
  }
  INPUT_CACHE.set(key, null);
  throw new RangeError(
    `No production input for ${labCase.affinity}:${labCase.family}:${labCase.grade}:${labCase.modifier}`,
  );
};

/** Visual Lab uses the production input resolver, so its receipt cannot drift from gameplay. */
export const compositionReceiptForCase = (labCase: LabCase): EnemyVisualCompositionReceipt =>
  enemyVisualCompositionReceipt(inputForCase(labCase));

export const LAB_CASES: readonly LabCase[] = (() => {
  const baseCandidates = LAB_FAMILIES.flatMap((family) =>
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
