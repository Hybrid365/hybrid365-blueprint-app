/** Production-safe visual-system exports. Lab fixtures are NOT re-exported. */

export { VS_DURATION, VS_EASE, usePrefersReducedMotion, vsTransition } from "./motion";
export {
  SESSION_STATUS_LABELS,
  vsDisplay,
  vsHairline,
  vsLabelCaps,
  vsMetric,
  vsSurface,
  vsSurfaceRaised,
  vsTouch,
  type SessionStatusKey,
} from "./tokens";
export { RollingValue } from "./primitives/RollingValue";
export { VsSectionHeader } from "./primitives/SectionHeader";
export { SessionStatusPill } from "./primitives/StatusPill";
export { VsStat } from "./primitives/Stat";
export { AthleteCoachNote } from "./primitives/CoachNote";
export { WeekDateNav, type WeekDateNavDay } from "./navigation/WeekDateNav";
export { PrimarySessionCard } from "./sessions/PrimarySessionCard";
export { SecondarySessionRow } from "./sessions/SecondarySessionRow";
export type { AthleteSessionCardViewModel } from "./sessions/sessionCardTypes";
export { CompactWorkoutPreview } from "./workout/CompactWorkoutPreview";
export { WorkoutTimeline } from "./workout/WorkoutTimeline";
export { WorkoutSegmentDetail } from "./workout/WorkoutSegmentDetail";
