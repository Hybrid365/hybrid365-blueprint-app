import {
  hydrateHyroxDetailsFromAssessment,
  parseTrainingTrack,
  type CommunityHyroxDetails,
  type CommunityTrainingTrack,
} from "@/app/lib/communityHyroxAssessment";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityAssessmentTrackContext = {
  trainingTrack: CommunityTrainingTrack;
  isHyroxTrack: boolean;
  hyroxDetails: CommunityHyroxDetails;
};

type AssessmentTrackRow = {
  training_track?: string | null;
  hyrox_details?: unknown;
  recent_5k_time?: string | null;
  recent_10k_time?: string | null;
  current_running_volume_km?: number | null;
  longest_recent_run_km?: number | null;
  hyrox_pb?: string | null;
  event_date?: string | null;
  target_time?: string | null;
};

export async function loadCommunityAssessmentTrack(
  supabase: SupabaseClient,
  userId: string
): Promise<CommunityAssessmentTrackContext> {
  const { data } = await supabase
    .from("athlete_assessments")
    .select(
      "training_track, hyrox_details, recent_5k_time, recent_10k_time, current_running_volume_km, longest_recent_run_km, hyrox_pb, event_date, target_time"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const row = (data as AssessmentTrackRow | null) ?? null;
  const trainingTrack = parseTrainingTrack(row?.training_track);

  return {
    trainingTrack,
    isHyroxTrack: trainingTrack === "hyrox",
    hyroxDetails: hydrateHyroxDetailsFromAssessment(row),
  };
}
