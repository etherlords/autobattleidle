export { decorateAffinityCue, AffinityCueDecorator } from "./decorators/affinity-cue-decorator";
export {
  BOSS_GEOMETRY_PROFILES,
  BOSS_GEOMETRY_RECIPES,
  buildBossGeometryRecipe,
  bossGeometryProfileForSeed,
  bossGeometryProfilesForFamily,
  BossGeometryDecorator,
  decorateBossGeometry,
  type BossFamily,
  type BossGeometryProfile,
  type BossRecipe,
} from "./decorators/boss-geometry-decorator";
export { decorateGrade, GradeCueDecorator } from "./decorators/grade-cue-decorator";
export { decorateModifier, ModifierCueDecorator } from "./decorators/modifier-cue-decorator";
export {
  decorateSeededDecoration,
  SeededDecorationDecorator,
} from "./decorators/seeded-decoration-decorator";
export {
  clearSemanticSurfaceCache,
  decorateSemanticSurfaces,
  SemanticSurfaceDecorator,
  semanticSurfaceCacheStats,
  semanticSurfaceTreatmentsForFamily,
  type SemanticSurfaceTreatment,
} from "./decorators/semantic-surface-decorator";
