import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { detectHyroxTrack } from "@/app/lib/hyroxTrackContext";
import type { TrackFoundationState } from "./pipeline";
import { TRACK_PROGRAMME_MUTATION_ENABLED } from "./productionBoundary";

export type ReadOnlyProgrammeProposal = {
  engine: "generate12WeekProgramme";
  published: false;
  persisted: false;
  mutationEnabled: false;
  weekCount: number;
  firstWeekTitle: string | null;
  fiveKTime: string;
  hyroxTrackActive: boolean;
  equipmentNote: string | null;
};

/**
 * Runs the existing generator in memory.
 * Nothing is saved, published, or applied to a live athlete.
 */
export function buildReadOnlyProgrammeProposal(state: TrackFoundationState): ReadOnlyProgrammeProposal | null {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) {
    throw new Error("Track programme mutation must stay off.");
  }
  if (!state.handoff.readyToGenerate) return null;

  const notes = [
    state.handoff.constraintNotes.join(". "),
    state.profile.programmingReadiness === "PARTIALLY_READY"
      ? "Track partial readiness. Non-critical anchors are still open. Proposal is conservative and read-only."
      : "Track readiness complete. Proposal is read-only.",
    state.handoff.abilityNote,
  ]
    .filter(Boolean)
    .join(" | ");

  const input = mapAssessmentToProgrammeInput({
    email: `${state.intake.athleteId}@track.preview`,
    profile: { full_name: state.intake.displayName },
    benchmarkTests: [],
    assessment: {
      first_name: state.intake.displayName,
      goal_focus: state.handoff.goalFocusRaw,
      event_type: state.handoff.eventType,
      event_date: state.handoff.eventDate,
      target_time: null,
      training_days_per_week: state.handoff.daysPerWeek,
      weekly_hours_band: state.handoff.weeklyHoursBand,
      preferred_training_days: state.intake.availability.availableDays,
      double_session_days: state.intake.availability.doublesPossible ? state.intake.availability.doubleDays : [],
      recent_5k_time: state.handoff.fiveKTime,
      strength_experience: null,
      hyrox_experience: null,
      equipment: state.handoff.equipment,
      injury_flags: state.intake.pain.severity === "meaningful_unresolved" ? state.intake.pain.areas : [],
      movements_to_avoid: [],
      biggest_limiter: null,
      notes,
      hyrox_pb: state.anchors.hyrox.overall,
      current_run_volume_band: state.intake.background.runKmPerWeek != null ? `${state.intake.background.runKmPerWeek} km` : null,
      training_track: "hyrox",
    },
  });

  const weeks = generate12WeekProgramme({
    ...input,
    unavailable_days: state.intake.availability.unavailableDays,
  });
  const hyrox = input.hyrox_track ?? null;
  return {
    engine: "generate12WeekProgramme",
    published: false,
    persisted: false,
    mutationEnabled: false,
    weekCount: weeks.length,
    firstWeekTitle: weeks[0]?.title ?? null,
    fiveKTime: input.five_k_time ?? "",
    hyroxTrackActive: detectHyroxTrack({
      goal_focus_raw: state.handoff.goalFocusRaw,
      event_type: state.handoff.eventType,
    }),
    equipmentNote: hyrox?.equipment_note ?? null,
  };
}
