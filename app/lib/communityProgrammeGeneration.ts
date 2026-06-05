import { generate12WeekProgramme, type GeneratedProgrammeWeek } from "@/app/lib/generate12WeekProgramme";
import {
  mapAssessmentToProgrammeInput,
  type AthleteAssessmentRowForProgramme,
  type BenchmarkTestRowForProgramme,
  type ProfileRowForProgramme,
} from "@/app/lib/mapAssessmentToProgrammeInput";
import { generate12WeekHyroxCommunityProgramme } from "@/app/lib/communityProgrammePreview/generate12WeekHyroxCommunity";
import {
  hyroxPaceGuidanceAvailable,
  mapAssessmentToHyroxBuilderInput,
  resolveCommunityTrainingTrack,
} from "@/app/lib/communityProgrammePreview/mapAssessmentToHyroxBuilderInput";
import type { CommunityTrainingTrack } from "@/app/lib/communityHyroxAssessment";

export type CommunityBuilderKind = "hybrid_performance" | "hyrox";

export type CommunityProgrammeGenerationResult = {
  weeks: GeneratedProgrammeWeek[];
  builder: CommunityBuilderKind;
  trainingTrack: CommunityTrainingTrack;
  hyroxQaSummaries?: ReturnType<typeof generate12WeekHyroxCommunityProgramme>["qaSummaries"];
  totalSessions?: number;
  paceGuidanceCreated?: boolean;
};

const DEBUG =
  process.env.COMMUNITY_PROGRAMME_DEBUG === "1" ||
  process.env.NODE_ENV === "development";

export function generatePaidCommunityProgramme(params: {
  assessment: AthleteAssessmentRowForProgramme;
  benchmarkTests: BenchmarkTestRowForProgramme[];
  email: string | null | undefined;
  profile: ProfileRowForProgramme | null;
  userId?: string;
}): CommunityProgrammeGenerationResult {
  const trainingTrack = resolveCommunityTrainingTrack(params.assessment);
  const builder: CommunityBuilderKind =
    trainingTrack === "hyrox" ? "hyrox" : "hybrid_performance";

  if (trainingTrack === "hyrox") {
    const hyroxInput = mapAssessmentToHyroxBuilderInput({
      assessment: params.assessment,
      benchmarkTests: params.benchmarkTests,
    });
    const { weeks, qaSummaries, totalSessions } =
      generate12WeekHyroxCommunityProgramme(hyroxInput);

    if (DEBUG) {
      console.info("[community-programme] HYROX generation", {
        userIdPrefix: params.userId?.slice(0, 8),
        training_track: trainingTrack,
        builder,
        weeksGenerated: weeks.length,
        totalSessions,
        blockPhases: qaSummaries.map((q) => ({
          block: q.block_number,
          pass: q.pass_count,
          warn: q.warn_count,
          fail: q.fail_count,
        })),
        stationWeaknesses: hyroxInput.station_weaknesses,
        paceGuidanceCreated: hyroxPaceGuidanceAvailable(hyroxInput),
        doubleSessions: hyroxInput.double_session_availability,
      });
      for (const qa of qaSummaries) {
        if (qa.fail_count > 0 || qa.warn_count > 0) {
          console.info("[community-programme] HYROX QA block", qa.block_number, qa.sample_messages);
        }
      }
    }

    return {
      weeks,
      builder,
      trainingTrack,
      hyroxQaSummaries: qaSummaries,
      totalSessions,
      paceGuidanceCreated: hyroxPaceGuidanceAvailable(hyroxInput),
    };
  }

  const blueprintInput = mapAssessmentToProgrammeInput({
    assessment: params.assessment,
    benchmarkTests: params.benchmarkTests,
    email: params.email,
    profile: params.profile,
  });

  const weeks = generate12WeekProgramme(blueprintInput);

  if (DEBUG) {
    console.info("[community-programme] Hybrid Performance generation", {
      userIdPrefix: params.userId?.slice(0, 8),
      training_track: trainingTrack,
      builder,
      weeksGenerated: weeks.length,
    });
  }

  return {
    weeks,
    builder,
    trainingTrack,
  };
}
