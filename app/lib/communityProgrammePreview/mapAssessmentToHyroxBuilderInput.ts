import {
  DEFAULT_TRAINING_TRACK,
  hydrateHyroxDetailsFromAssessment,
  type CommunityTrainingTrack,
  type CommunityHyroxDetails,
} from "@/app/lib/communityHyroxAssessment";
import {
  deriveAbilityLevel,
  parseTimeToSeconds,
  type AthleteAssessmentRowForProgramme,
  type BenchmarkTestRowForProgramme,
} from "@/app/lib/mapAssessmentToProgrammeInput";
import type { CommunityPreviewInput, PreviewAbilityLevel } from "./types";

const SESSION_LENGTH_FROM_BAND: Record<string, string> = {
  "2-3": "30-45 min",
  "3-5": "45-60 min",
  "5-7": "60-90 min",
  "7-10": "60-90 min",
  "10+": "90+ min",
};

function hyroxTrainingDays(raw: number | null | undefined): 3 | 4 | 5 | 6 {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.round(raw)
      : 5;
  if (n <= 3) return 3;
  if (n >= 6) return 6;
  return n as 3 | 4 | 5 | 6;
}

function fiveKFromAssessment(
  assessment: AthleteAssessmentRowForProgramme,
  tests: BenchmarkTestRowForProgramme[]
): string {
  const fromAssessment = assessment.recent_5k_time?.trim() ?? "";
  if (fromAssessment) return fromAssessment;
  for (const row of tests) {
    const blob = `${row.test_type ?? ""} ${row.test_label ?? ""}`.toLowerCase();
    if (/\b5\s*k|5km\b/.test(blob) && row.test_time?.trim()) {
      return row.test_time.trim();
    }
  }
  return "";
}

function tenKFromAssessment(
  assessment: AthleteAssessmentRowForProgramme,
  details: CommunityHyroxDetails,
  benchmarkTests: BenchmarkTestRowForProgramme[]
): string {
  if (details.current_10k_time?.trim()) return details.current_10k_time.trim();
  if (assessment.recent_10k_time?.trim()) return assessment.recent_10k_time.trim();
  for (const row of benchmarkTests) {
    const blob = `${row.test_type ?? ""} ${row.test_label ?? ""}`.toLowerCase();
    if (/\b10\s*k|10km\b/.test(blob) && row.test_time?.trim()) {
      return row.test_time.trim();
    }
  }
  return "";
}

export function resolveCommunityTrainingTrack(
  assessment: AthleteAssessmentRowForProgramme | null | undefined
): CommunityTrainingTrack {
  const t = assessment?.training_track?.trim();
  if (t === "hyrox") return "hyrox";
  return DEFAULT_TRAINING_TRACK;
}

export function mapAssessmentToHyroxBuilderInput(params: {
  assessment: AthleteAssessmentRowForProgramme;
  benchmarkTests: BenchmarkTestRowForProgramme[];
  blockNumber?: number;
}): CommunityPreviewInput {
  const { assessment, benchmarkTests } = params;
  const details = hydrateHyroxDetailsFromAssessment(assessment);
  const five_k = details.current_5k_time?.trim() || fiveKFromAssessment(assessment, benchmarkTests);
  const ten_k = tenKFromAssessment(assessment, details, benchmarkTests);

  const ability_level: PreviewAbilityLevel = deriveAbilityLevel({
    strength_experience: assessment.strength_experience,
    hyrox_experience: assessment.hyrox_experience,
    five_k_time_raw: five_k,
  });

  const band = (assessment.weekly_hours_band ?? "5-7").trim();
  const injuryParts = [
    ...(assessment.injury_flags ?? []),
    ...(assessment.movements_to_avoid ?? []),
  ];

  return {
    training_track: "hyrox",
    ability_level,
    training_days_per_week: hyroxTrainingDays(assessment.training_days_per_week),
    weekly_training_hours: band || "5-7",
    session_length: SESSION_LENGTH_FROM_BAND[band] ?? "60-90 min",
    double_session_availability: Boolean(assessment.double_session_days?.length),
    equipment_access: assessment.equipment?.length ? assessment.equipment : ["Full Gym"],
    injury_limitations: injuryParts.join(", ") || (assessment.notes?.trim() ?? ""),
    current_5k_time: five_k,
    current_10k_time: ten_k,
    weekly_run_volume_km:
      details.weekly_run_volume_km != null ? String(details.weekly_run_volume_km) : "",
    running_confidence: details.running_confidence,
    race_booked: details.race_booked ?? "not_yet_but_planning",
    race_date: details.race_date ?? "",
    race_category: details.category ?? "open",
    race_target_time: details.target_time ?? "",
    station_weaknesses: details.station_weaknesses,
    hyrox_equipment: details.equipment,
    ski_1k_time: details.ski_1k_time ?? "",
    row_1k_time: details.row_1k_time ?? "",
    wall_ball_standard: details.wall_ball_standard ?? "",
    sled_experience: details.sled_push_pull_experience ?? "",
    compromised_running_confidence: details.running_confidence,
    block_number: params.blockNumber ?? 1,
  };
}

export function hyroxPaceGuidanceAvailable(input: CommunityPreviewInput): boolean {
  return (
    Boolean(parseTimeToSeconds(input.current_5k_time)) ||
    Boolean(parseTimeToSeconds(input.current_10k_time))
  );
}
