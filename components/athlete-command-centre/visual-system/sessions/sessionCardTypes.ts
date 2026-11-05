import type { SessionStatusKey } from "../tokens";
import type { WorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";

/**
 * Athlete-safe session card VM — shaped for Home D / programme later.
 * No family IDs, Stage N, or internal notes.
 */
export type AthleteSessionCardViewModel = {
  id: string;
  title: string;
  categoryLabel: string;
  focusLabel: string | null;
  status: SessionStatusKey;
  prescriptionLine: string | null;
  objective: string | null;
  primaryTarget: string | null;
  durationLabel: string | null;
  coachNote: string | null;
  /** Optional compact timeline VM (already athlete-safe). */
  timeline: WorkoutTimelineViewModel | null;
};
