import { type EnemyAffinity, type EnemyPresentationModifier } from "../../domain/combat";
import {
  canonicalLabCase,
  LAB_AFFINITIES,
  LAB_FAMILIES,
  LAB_GRADES,
  LAB_MODIFIERS,
  type LabCase,
} from "./catalog";
import { LAB_RECIPE_INPUTS, normalizeLabRecipe, type LabRecipe } from "./recipes";
import {
  PLAYER_DETAIL_LEVELS,
  PLAYER_DETAIL_TRANSITION,
  PLAYER_FORM_STARTS,
  PLAYER_MILESTONE_LEVELS,
  playerDetailLevelForStage,
  type PlayerDetailLevel,
  type PlayerFormStart,
} from "./player-evolution";

export type LabView = "orbit" | "front" | "side" | "back" | "top";
export type LabViewport = "desktop" | "narrow";
export type LabSubject = "enemy" | "player";
export type LabUrlCase = LabCase & {
  readonly reducedMotion: boolean;
  readonly view: LabView;
  readonly viewport: LabViewport;
  readonly recipe: LabRecipe;
  readonly subject: LabSubject;
  readonly playerStage: PlayerFormStart;
  readonly playerDetailLevel: PlayerDetailLevel;
  readonly playerLevel: number;
  readonly correction?: { readonly requested: string; readonly canonical: string };
};

export const DEFAULT_LAB_CASE: LabUrlCase = {
  affinity: "cinder",
  family: "beetle",
  grade: "normal",
  modifier: null,
  variant: 0,
  goldenBug: false,
  reducedMotion: false,
  view: "orbit",
  viewport: "desktop",
  recipe: "production",
  subject: "enemy",
  playerStage: 1,
  playerDetailLevel: 1_000,
  playerLevel: 1,
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
const playerStage = (input: string | null): PlayerFormStart => {
  const value = Number(input);
  return PLAYER_FORM_STARTS.includes(value as PlayerFormStart) ? (value as PlayerFormStart) : 1;
};
const playerDetailLevel = (input: string | null): PlayerDetailLevel => {
  switch (Number(input)) {
    case 1_200:
      return 1_200;
    case 1_400:
      return 1_400;
    case 1_600:
      return 1_600;
    case 1_800:
      return 1_800;
    case 2_000:
      return 2_000;
    default:
      return PLAYER_DETAIL_LEVELS[0];
  }
};
const playerLevel = (input: string | null, fallback: number): number => {
  if (input === null) return fallback;
  const value = Number(input);
  const maximum = PLAYER_MILESTONE_LEVELS[PLAYER_MILESTONE_LEVELS.length - 1] ?? 100_000;
  return Number.isFinite(value) ? Math.min(maximum, Math.max(1, Math.floor(value))) : fallback;
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
    affinity: values(
      query.get("affinity"),
      LAB_AFFINITIES,
      DEFAULT_LAB_CASE.affinity,
    ) as EnemyAffinity,
    family: values(query.get("family"), LAB_FAMILIES, DEFAULT_LAB_CASE.family),
    grade: values(query.get("grade"), LAB_GRADES, DEFAULT_LAB_CASE.grade),
    modifier: modifier(query.get("modifier")),
    variant: variant(query.get("variant")),
    goldenBug: bool(query.get("golden"), DEFAULT_LAB_CASE.goldenBug),
  });
  const selectedPlayerStage = playerStage(query.get("stage"));
  const selectedSubject = values(query.get("subject"), ["enemy", "player"] as const, "enemy");
  const selectedRecipe = values(query.get("recipe"), LAB_RECIPE_INPUTS, DEFAULT_LAB_CASE.recipe);
  const legacyPlayerLevel =
    selectedPlayerStage === PLAYER_DETAIL_TRANSITION.source
      ? playerDetailLevel(query.get("detail"))
      : selectedPlayerStage;
  const selectedPlayerLevel = playerLevel(query.get("level"), legacyPlayerLevel);
  const result: LabUrlCase = {
    ...visual,
    reducedMotion: bool(query.get("motion"), DEFAULT_LAB_CASE.reducedMotion),
    view: values(query.get("view"), ["orbit", "front", "side", "back", "top"] as const, "orbit"),
    viewport: values(query.get("viewport"), ["desktop", "narrow"] as const, "desktop"),
    recipe: normalizeLabRecipe(
      selectedRecipe,
      selectedSubject === "enemy" && visual.family.startsWith("boss-"),
    ),
    subject: selectedSubject,
    playerStage: selectedPlayerStage,
    playerDetailLevel: playerDetailLevelForStage(
      selectedPlayerStage,
      playerDetailLevel(query.get("detail")),
    ),
    playerLevel: selectedPlayerLevel,
  };
  const fields = [
    "affinity",
    "family",
    "grade",
    "modifier",
    "variant",
    "golden",
    "motion",
    "view",
    "viewport",
    "recipe",
    "subject",
    "stage",
    "detail",
    "level",
  ];
  const canonical = serializeLabCase(result);
  const requested = fields.some((field) => query.has(field)) ? `?${query.toString()}` : canonical;
  return requested === canonical ? result : { ...result, correction: { requested, canonical } };
};

export const serializeLabCase = (labCase: LabUrlCase): string => {
  const query = new URLSearchParams({
    affinity: labCase.affinity,
    family: labCase.family,
    grade: labCase.grade,
    modifier: labCase.modifier ?? "none",
    variant: String(labCase.variant),
    golden: labCase.goldenBug ? "1" : "0",
    motion: labCase.reducedMotion ? "1" : "0",
    view: labCase.view,
    viewport: labCase.viewport,
    recipe: labCase.recipe,
    subject: labCase.subject,
    stage: String(labCase.playerStage),
    detail: String(labCase.playerDetailLevel),
    level: String(labCase.playerLevel),
  });
  return `?${query.toString()}`;
};
