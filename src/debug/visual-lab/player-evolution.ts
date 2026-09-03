import {
  PLAYER_FORM_STARTS,
  PLAYER_MILESTONE_LEVELS,
  PlayerEvolution,
  playerEvolutionIdentity,
  type PlayerMilestoneLevel,
  type PlayerFormStart,
} from "../../game/units/player/evolution";

export { PLAYER_FORM_STARTS, PLAYER_MILESTONE_LEVELS };
export type { PlayerFormStart, PlayerMilestoneLevel };
export const PLAYER_LAB_LEVELS = PLAYER_MILESTONE_LEVELS;
export const MINOR_DETAIL_CADENCES = [100, 200, 250] as const;
export const SELECTED_MINOR_DETAIL_CADENCE = 200;
export const PLAYER_DETAIL_LEVELS = [1_000, 1_200, 1_400, 1_600, 1_800, 2_000] as const;
export type PlayerDetailLevel = 1_000 | 1_200 | 1_400 | 1_600 | 1_800 | 2_000;
export const PLAYER_DETAIL_TRANSITION = { source: 1_000, target: 10_000 } as const;
export const minorDetailStateCount = (cadence: number): number => Math.floor(999 / cadence);
export const minorDetailStep = (level: number): number =>
  playerEvolutionIdentity(level).detailCount;
export const playerDetailLevelForStage = (
  stage: PlayerFormStart,
  detailLevel: PlayerDetailLevel,
): PlayerDetailLevel => (stage === PLAYER_DETAIL_TRANSITION.source ? detailLevel : 1_000);
export const renderedPlayerFormStart = (
  stage: PlayerFormStart,
  detailLevel: PlayerDetailLevel,
): PlayerFormStart =>
  stage === PLAYER_DETAIL_TRANSITION.source
    ? playerEvolutionIdentity(detailLevel).formStart
    : stage;

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

export class LabPlayerEvolution extends PlayerEvolution {
  constructor(
    stage: PlayerFormStart,
    reducedMotion: boolean,
    detailLevel: PlayerDetailLevel = 1_000,
    level?: number,
  ) {
    super(
      playerEvolutionIdentity(
        level ?? (stage === PLAYER_DETAIL_TRANSITION.source ? detailLevel : stage),
      ),
      reducedMotion,
    );
  }
}
