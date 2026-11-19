import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { mapAssessmentToProgrammeInput } from "@/app/lib/mapAssessmentToProgrammeInput";
import { PRODUCTION_TRACK_CANARY_ATHLETE_ID, assertTrackMutationStaysOff } from "@/app/lib/track-production/access";
import { productionTrackDb } from "@/app/lib/track-production/db";
import type { TrackIntake } from "@/app/lib/track-foundation/types";

type Day = {
  day?: string;
  title?: string;
  tags?: string[];
};

export type ProposalWeek = {
  week: number;
  title: string;
  deload: boolean;
  tuesday: string;
  saturday: string;
  sunday: string;
  tuesdayAnchor: boolean;
  saturdayAnchor: boolean;
  sundayAnchor: boolean;
};

function day(schedule: Day[], key: string): Day | undefined {
  return schedule.find((item) => item.day === key);
}

function anchors(schedule: Day[], deload: boolean) {
  const tuesday = day(schedule, "Tue");
  const saturday = day(schedule, "Sat");
  const sunday = day(schedule, "Sun");
  if (deload) {
    return { tuesdayAnchor: true, saturdayAnchor: true, sundayAnchor: true, tuesday: tuesday?.title ?? "", saturday: saturday?.title ?? "", sunday: sunday?.title ?? "" };
  }
  return {
    tuesday: tuesday?.title ?? "",
    saturday: saturday?.title ?? "",
    sunday: sunday?.title ?? "",
    tuesdayAnchor: tuesday?.tags?.[0] === "threshold_run",
    saturdayAnchor: /hyrox|compromised|station/i.test(`${saturday?.title ?? ""} ${saturday?.tags?.[0] ?? ""}`),
    sundayAnchor: sunday?.tags?.[0] === "long_run" || /long/i.test(sunday?.title ?? ""),
  };
}

export function productionGeneratorInput(intake: TrackIntake, results: Array<Record<string, unknown>>) {
  const five = results.find((row) => row.test_id === "run_5k");
  const race = results.find((row) => row.test_id === "hyrox_race");
  return mapAssessmentToProgrammeInput({
    assessment: {
      first_name: "Track",
      goal_focus: "Improve Hybrid / Hyrox Performance",
      event_type: intake.event.eventType,
      event_date: intake.event.eventDate,
      target_time: null,
      training_days_per_week: intake.availability.daysPerWeek,
      weekly_hours_band: "7-10",
      preferred_training_days: intake.availability.availableDays,
      double_session_days: null,
      recent_5k_time: five ? String(five.result_value) : null,
      max_heart_rate: null,
      strength_experience: "advanced",
      hyrox_experience: "competitive",
      equipment: ["Full gym"],
      injury_flags: null,
      movements_to_avoid: null,
      biggest_limiter: "Running under fatigue after stations",
      notes: "Internal production canary. Not a client programme.",
      hyrox_pb: race ? String(race.result_value) : null,
      current_run_volume_band: "30-40km/week",
    },
    benchmarkTests: [],
    email: null,
    profile: { full_name: "Hybrid365 Track Canary" },
  });
}

export async function proposeProductionProgramme(): Promise<{ weeks: ProposalWeek[]; anchorFailures: number[] }> {
  assertTrackMutationStaysOff();
  const db = productionTrackDb();
  const athleteId = PRODUCTION_TRACK_CANARY_ATHLETE_ID;
  const { data: intakeRow, error: intakeError } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", athleteId).single();
  if (intakeError || !intakeRow) throw new Error(intakeError?.message ?? "Intake missing.");
  const intake = intakeRow.intake as TrackIntake;
  const { data: resultRows, error: resultError } = await db.from("track_benchmark_results").select("*").eq("athlete_id", athleteId);
  if (resultError) throw new Error(resultError.message);
  const results = (resultRows ?? []) as Array<Record<string, unknown>>;
  const input = productionGeneratorInput(intake, results);
  const generated = generate12WeekProgramme(input);
  const weeks: ProposalWeek[] = generated.map((week, index) => {
    const weekNumber = index + 1;
    const deload = weekNumber % 4 === 0 || /deload/i.test(week.title ?? "");
    const schedule = (week.plan_json?.schedule ?? []) as Day[];
    const checked = anchors(schedule, deload);
    return { week: weekNumber, title: week.title ?? `Week ${weekNumber}`, deload, ...checked };
  });
  const anchorFailures = weeks.filter((week) => !week.deload && (!week.tuesdayAnchor || !week.saturdayAnchor || !week.sundayAnchor)).map((week) => week.week);
  const { count } = await db.from("track_calendar_sessions").select("id", { count: "exact", head: true }).eq("athlete_id", athleteId).eq("kind", "training");
  if ((count ?? 0) > 0) throw new Error("Training weeks already exist. Proposal was not stored.");
  const { error } = await db.from("track_programme_proposals").insert({
    athlete_id: athleteId,
    readiness: "READY",
    proposal: {
      kind: "programme",
      published: false,
      activated: false,
      weeks,
      anchorFailures,
    },
    published: false,
    status: "proposed",
    week_revision: 1,
    fingerprint: `review-${weeks.length}`,
  });
  if (error) throw new Error(error.message);
  return { weeks, anchorFailures };
}
