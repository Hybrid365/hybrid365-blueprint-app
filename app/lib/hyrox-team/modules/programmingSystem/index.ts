/**
 * HYROX Team Programming System — public exports.
 * Additive coaching methodology layer. Does not alter published programmes.
 */

export type {
  ProgrammingProgressionLevel,
  ProgrammingTrainingPhase,
  ProgrammingAthleteLevel,
  ProgrammingFatigueCost,
  ProgrammingTechnicalDemand,
  ProgrammingSessionStandards,
  ProgrammingProgressionFamily,
  HyroxCoachPerformanceProfile,
  ProgrammingBuilderHintKind,
  ProgrammingBuilderHint,
} from "./types";

export { EMPTY_COACH_PERFORMANCE_PROFILE } from "./types";

export {
  PROGRAMMING_PROGRESSION_FAMILIES,
  getProgressionFamily,
  listProgressionFamiliesByPillar,
} from "./progressionFamilies";

export {
  deriveProgrammingBuilderHints,
  type BuilderGuidanceContext,
} from "./builderGuidance";

export { PROGRAMMING_PILLAR_TAXONOMY } from "./taxonomy";
