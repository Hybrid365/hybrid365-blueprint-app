import type { BenchmarkResultInput, TrackIntake } from "@/app/lib/track-foundation/types";
import { getTest } from "@/app/lib/track-foundation/testLibrary";
import { createClient } from "@/app/lib/supabase/server";
import { productionTrackDb } from "@/app/lib/track-production/db";
import {
  PRODUCTION_TRACK_JOURNEY_ATHLETE_ID,
  PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID,
  isTrackJourneyWhopException,
  productionTrackAccessEnabled,
} from "@/app/lib/track-production/access";

export const TRACK_JOURNEY_NAME = "Hybrid365 Track Journey Test";

export function blankJourneyIntake(): TrackIntake {
  return {
    athleteId: PRODUCTION_TRACK_JOURNEY_ATHLETE_ID,
    displayName: TRACK_JOURNEY_NAME,
    goal: null,
    event: { hasEvent: false, eventType: null, eventName: null, eventDate: null, division: null },
    availability: {
      daysPerWeek: 0,
      availableDays: [],
      unavailableDays: [],
      doublesPossible: false,
      doubleDays: [],
      sessionLength: null,
      weekendAvailable: false,
    },
    background: {
      runDaysPerWeek: null,
      runKmPerWeek: null,
      strengthDaysPerWeek: null,
      hyroxSessionsPerWeek: null,
      bikeOrErgNote: null,
      trainingAge: null,
    },
    equipment: [],
    equipmentConfirmed: false,
    pain: { hasConcern: false, areas: [], severity: "none", affectsTraining: false, note: null },
  };
}

/** All four conditions. Any miss leaves the normal Whop gate in place. */
export async function trackJourneyMayPassWhop(userId: string | null | undefined): Promise<boolean> {
  if (!isTrackJourneyWhopException(userId)) return false;
  const db = productionTrackDb();
  const { data: athlete } = await db
    .from("hyrox_athletes")
    .select("id, user_id, payment_status, name")
    .eq("id", PRODUCTION_TRACK_JOURNEY_ATHLETE_ID)
    .maybeSingle();
  if (!athlete) return false;
  if (athlete.user_id !== PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID) return false;
  if (athlete.user_id !== userId) return false;
  if (athlete.name !== TRACK_JOURNEY_NAME) return false;
  if (athlete.payment_status === "paid") return false;
  const { data: membership } = await db
    .from("track_product_membership")
    .select("status")
    .eq("athlete_id", PRODUCTION_TRACK_JOURNEY_ATHLETE_ID)
    .maybeSingle();
  return membership?.status === "active";
}

async function signedInJourney(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return trackJourneyMayPassWhop(data.user?.id);
}

export async function readJourneySetup(): Promise<{ intake: TrackIntake; step: string; results: BenchmarkResultInput[] } | null> {
  if (!productionTrackAccessEnabled()) return null;
  const allowed = await signedInJourney();
  if (!allowed) return null;
  const db = productionTrackDb();
  const { data } = await db
    .from("track_athlete_intake")
    .select("intake")
    .eq("athlete_id", PRODUCTION_TRACK_JOURNEY_ATHLETE_ID)
    .maybeSingle();
  const stored = (data?.intake ?? null) as (TrackIntake & { journeyStep?: string }) | null;
  const { data: rows } = await db
    .from("track_benchmark_results")
    .select("id, test_id, result_value, unit, tested_on, source, notes, details, corrects_result_id")
    .eq("athlete_id", PRODUCTION_TRACK_JOURNEY_ATHLETE_ID)
    .order("created_at");
  const results: BenchmarkResultInput[] = (rows ?? []).map((row) => ({
    id: String(row.id),
    testId: String(row.test_id),
    resultValue: String(row.result_value),
    unit: String(row.unit),
    date: String(row.tested_on).slice(0, 10),
    source: row.source as BenchmarkResultInput["source"],
    notes: (row.notes as string | null) ?? null,
    details: (row.details as BenchmarkResultInput["details"]) ?? null,
    correctsResultId: (row.corrects_result_id as string | null) ?? null,
  }));
  if (!stored) return { intake: blankJourneyIntake(), step: "welcome", results };
  const { journeyStep, ...intake } = stored;
  return { intake: { ...blankJourneyIntake(), ...intake, athleteId: PRODUCTION_TRACK_JOURNEY_ATHLETE_ID, displayName: TRACK_JOURNEY_NAME }, step: journeyStep || "goal", results };
}

export async function saveJourneyIntake(intake: TrackIntake, step: string): Promise<void> {
  const allowed = await signedInJourney();
  if (!allowed) throw new Error("Track journey canary refused.");
  const db = productionTrackDb();
  const stored = {
    ...intake,
    athleteId: PRODUCTION_TRACK_JOURNEY_ATHLETE_ID,
    displayName: TRACK_JOURNEY_NAME,
    journeyStep: step,
  };
  const { error } = await db.from("track_athlete_intake").upsert(
    { athlete_id: PRODUCTION_TRACK_JOURNEY_ATHLETE_ID, intake: stored, updated_at: new Date().toISOString() },
    { onConflict: "athlete_id" }
  );
  if (error) throw new Error(error.message);
}

export async function saveJourneyResult(input: { testId: string; resultValue: string; date: string; source: BenchmarkResultInput["source"]; notes: string | null }): Promise<void> {
  const allowed = await signedInJourney();
  if (!allowed) throw new Error("Track journey canary refused.");
  const test = getTest(input.testId);
  if (!test || !input.resultValue.trim()) throw new Error("Unknown test.");
  const db = productionTrackDb();
  const { error } = await db.from("track_benchmark_results").insert({
    athlete_id: PRODUCTION_TRACK_JOURNEY_ATHLETE_ID,
    test_id: input.testId,
    result_value: input.resultValue.trim(),
    unit: test.resultUnit,
    tested_on: input.date,
    source: input.source,
    notes: input.notes,
    details: {},
  });
  if (error) throw new Error(error.message);
}
