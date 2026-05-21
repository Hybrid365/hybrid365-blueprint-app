import type { CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { HyroxProgrammeDraftStatus } from "@/app/lib/hyroxDatabaseTypes";

/** UI mock status ↔ Supabase `hyrox_programme_drafts.status`. */
export function coachStatusToDraftDb(status: CoachProgrammeStatus): HyroxProgrammeDraftStatus {
  switch (status) {
    case "generated_draft":
      return "draft_generated";
    case "coach_reviewing":
      return "coach_reviewing";
    case "edited_draft":
      return "edited";
    case "approved":
      return "approved";
    case "published":
      return "published";
    default:
      return "draft_generated";
  }
}

export function draftDbToCoachStatus(status: HyroxProgrammeDraftStatus): CoachProgrammeStatus {
  switch (status) {
    case "draft_generated":
      return "generated_draft";
    case "coach_reviewing":
      return "coach_reviewing";
    case "edited":
      return "edited_draft";
    case "approved":
      return "approved";
    case "published":
      return "published";
    case "archived":
      return "published";
    default:
      return "coach_reviewing";
  }
}
