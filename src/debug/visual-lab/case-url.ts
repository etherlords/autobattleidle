import { canonicalLabCase, LAB_FAMILIES, LAB_GRADES, LAB_MODIFIERS, type LabCase } from "./catalog";
import { LAB_RECIPES, type LabRecipe } from "./recipes";
import type { EnemyPresentationModifier } from "../../domain/combat";

export type LabView = "orbit" | "front" | "side" | "back" | "top";
export type LabViewport = "desktop" | "narrow";
export type LabUrlCase = LabCase & {
  readonly reducedMotion: boolean;
  readonly view: LabView;
  readonly viewport: LabViewport;
  readonly recipe: LabRecipe;
};

export const DEFAULT_LAB_CASE: LabUrlCase = {
  family: "beetle",
  grade: "normal",
  modifier: null,
  variant: 0,
  goldenBug: false,
  reducedMotion: false,
  view: "orbit",
  viewport: "desktop",
  recipe: "production",
};

const values = <T extends string>(input: string | null, allowed: readonly T[], fallback: T): T =>
  input !== null && allowed.includes(input as T) ? (input as T) : fallback;
const bool = (input: string | null, fallback: boolean): boolean => {
  if (input === "1") return true;
  if (input === "0") return false;
  return fallback;
};
const variant = (input: string | null): 0 | 1 | 2 => {
  if (input === "1") return 1;
  if (input === "2") return 2;
  return 0;
};
const modifier = (input: string | null): EnemyPresentationModifier => {
  if (input === null || input === "none") return null;
  const allowed = LAB_MODIFIERS.filter(
    (value): value is Exclude<EnemyPresentationModifier, null> => value !== null,
  );
  return allowed.includes(input as Exclude<EnemyPresentationModifier, null>)
    ? (input as Exclude<EnemyPresentationModifier, null>)
    : null;
};

export const parseLabCase = (search: string): LabUrlCase => {
  const query = new URLSearchParams(search);
  const visual = canonicalLabCase({
    family: values(query.get("family"), LAB_FAMILIES, DEFAULT_LAB_CASE.family),
    grade: values(query.get("grade"), LAB_GRADES, DEFAULT_LAB_CASE.grade),
    modifier: modifier(query.get("modifier")),
    variant: variant(query.get("variant")),
    goldenBug: bool(query.get("golden"), DEFAULT_LAB_CASE.goldenBug),
  });
  return {
    ...visual,
    reducedMotion: bool(query.get("motion"), DEFAULT_LAB_CASE.reducedMotion),
    view: values(query.get("view"), ["orbit", "front", "side", "back", "top"] as const, "orbit"),
    viewport: values(query.get("viewport"), ["desktop", "narrow"] as const, "desktop"),
    recipe: values(query.get("recipe"), LAB_RECIPES, DEFAULT_LAB_CASE.recipe),
  };
};

export const serializeLabCase = (labCase: LabUrlCase): string => {
  const query = new URLSearchParams({
    family: labCase.family,
    grade: labCase.grade,
    modifier: labCase.modifier ?? "none",
    variant: String(labCase.variant),
    golden: labCase.goldenBug ? "1" : "0",
    motion: labCase.reducedMotion ? "1" : "0",
    view: labCase.view,
    viewport: labCase.viewport,
    recipe: labCase.recipe,
  });
  return `?${query.toString()}`;
};
