import type { BenchmarkTestId } from "@/app/athlete/testing/hyroxTestingTypes";
import {
  type AthleteOnboardingProgress,
} from "@/app/lib/hyroxAthleteOnboardingFlow";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { fetchHyroxAthleteTestingRows } from "@/app/lib/hyroxAthleteTestingDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { fetchAthletePublishedProgramme } from "@/app/lib/hyroxProgrammeServer";
import { CORE_TEST_IDS } from "@/app/lib/hyroxTestingPayload";

const OPTIONAL_TEST_IDS: BenchmarkTestId[] = [
  "farmer_hold",
  "sandbag_lunge",
  "wall_ball",
  "sled_exposure",
];

const TEST_ID_BY_DB_TYPE: Partial<Record<string, BenchmarkTestId>> = {
  five_k_run: "5k",
  one_k_ski: "ski",
  two_k_row: "row2k",
  mini_compromised: "compromised",
  farmer_hold: "farmer_hold",
  sandbag_lunge_capacity: "sandbag_lunge",
  wall_ball_capacity: "wall_ball",
  sled_exposure: "sled_exposure",
};

/** Server-only: load athlete onboarding progress from Supabase. */
export async function fetchAthleteOnboardingProgress(
  athlete: HyroxAthleteRow
): Promise<AthleteOnboardingProgress> {
  const { client } = await createCoachServerClient();
  const flags = await fetchAthleteProgressFlags(client, athlete.id);
  const [programme, testing] = await Promise.all([
    fetchAthletePublishedProgramme(client, athlete, flags),
    fetchHyroxAthleteTestingRows(athlete.id),
  ]);

  const benchmarkIds = new Set<BenchmarkTestId>();
  for (const row of testing.tests) {
    const id = TEST_ID_BY_DB_TYPE[row.test_type];
    if (id) benchmarkIds.add(id);
  }

  const coreSubmittedCount = CORE_TEST_IDS.filter((id) => benchmarkIds.has(id)).length;
  const optionalSubmittedCount = OPTIONAL_TEST_IDS.filter((id) => benchmarkIds.has(id)).length;
  const hasRaceResult = Boolean(testing.race);
  const hasCoreTestingComplete =
    coreSubmittedCount >= CORE_TEST_IDS.length || hasRaceResult;

  return {
    athleteStatus: athlete.status,
    hasAssessment: flags.hasAssessment,
    hasTesting: flags.hasTesting || hasRaceResult,
    hasCoreTestingComplete,
    hasRaceResult,
    coreSubmittedCount,
    coreRequiredCount: CORE_TEST_IDS.length,
    optionalSubmittedCount,
    optionalRequiredCount: OPTIONAL_TEST_IDS.length,
    programmeVisibility: programme.visibility,
    programmePublished: programme.published,
    programmeStatus: athlete.programme_status,
  };
}
