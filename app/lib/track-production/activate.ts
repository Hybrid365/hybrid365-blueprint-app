import { generate12WeekProgramme } from "@/app/lib/generate12WeekProgramme";
import { getProgressionFamily } from "@/app/lib/progressionFamilies";
import type { DayPlan } from "@/app/lib/sessionLibrary";
import { addDays } from "@/app/lib/track-foundation/dates";
import type { DayKey, TrackIntake } from "@/app/lib/track-foundation/types";
import { PRODUCTION_TRACK_CANARY_ATHLETE_ID, assertTrackMutationStaysOff } from "@/app/lib/track-production/access";
import { productionGeneratorInput } from "@/app/lib/track-production/propose";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROGRAMME_KEY = `track-block-${PRODUCTION_TRACK_CANARY_ATHLETE_ID}`;
const WEEK_ONE = {
  tuesday: "5 x 5 min Threshold",
  saturday: "Short Compromised Run Block",
  sunday: "65 min Aerobic Long Run",
};

export type ActivationRow = {
  session_date: string;
  day_key: DayKey;
  title: string;
  active: boolean;
  instructions: string[];
  week_number: number;
  week_state: "active" | "future";
  payload: Record<string, unknown>;
};

type StoredWeek = {
  week: number;
  tuesday: string;
  saturday: string;
  sunday: string;
  deload?: boolean;
};

function mondayOnOrBefore(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const day = date.getUTCDay();
  const shift = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - shift);
  return date.toISOString().slice(0, 10);
}

function stageFor(familyId: string | null, title: string): number | null {
  if (!familyId) return null;
  return getProgressionFamily(familyId)?.variants.find((variant) => variant.title === title)?.block_week ?? null;
}

function payloadFor(day: DayPlan, weekNumber: number, blockNumber: number) {
  const family = day.progression_family ?? null;
  const tag = day.tags?.[0] ?? "";
  return {
    weekNumber,
    blockNumber,
    programmeKey: PROGRAMME_KEY,
    purpose: day.run_prescription?.effort_description ?? day.session?.notes?.[0] ?? "",
    main: day.session?.main ?? [],
    notes: day.session?.notes ?? [],
    family,
    stage: stageFor(family, day.title),
    marker: day.progression_marker ?? null,
    pace: day.run_prescription?.pace_range ?? null,
    effort: day.run_prescription?.rpe ?? null,
    priority: tag === "threshold_run" || tag.startsWith("hybrid_") ? "key" : "supporting",
    stimulus: tag || "easy",
    modality: tag.startsWith("hybrid_") ? "hyrox" : "run",
    anchor: tag === "long_run" || tag.startsWith("hybrid_"),
  };
}

export function buildActivationRows(input: {
  intake: TrackIntake;
  results: Array<Record<string, unknown>>;
  storedWeeks: StoredWeek[];
}): { programmeKey: string; weekStart: string; rows: ActivationRow[] } {
  assertTrackMutationStaysOff();
  if (input.storedWeeks.length !== 12) throw new Error("Stored review does not contain 12 weeks.");
  // Programme origin for this already-written block. Live Today does not read this clock.
  const clock = String((input.intake as TrackIntake & { clock?: string }).clock ?? "2026-11-19").slice(0, 10);
  const weekStart = mondayOnOrBefore(clock);
  const generated = generate12WeekProgramme(productionGeneratorInput(input.intake, input.results));
  if (generated.length !== 12) throw new Error("Generator did not return 12 weeks.");

  const rows: ActivationRow[] = [];
  for (const week of generated) {
    const stored = input.storedWeeks.find((item) => item.week === week.week_number);
    if (!stored) throw new Error(`Stored review is missing week ${week.week_number}.`);
    const schedule = week.plan_json.schedule;
    const byDay = new Map<string, DayPlan>();
    for (const day of schedule) {
      if (byDay.has(day.day)) throw new Error(`Week ${week.week_number} has two sessions on ${day.day}.`);
      byDay.set(day.day, day);
    }
    const tuesday = byDay.get("Tue")?.title ?? "";
    const saturday = byDay.get("Sat")?.title ?? "";
    const sunday = byDay.get("Sun")?.title ?? "";
    if (tuesday !== stored.tuesday || saturday !== stored.saturday || sunday !== stored.sunday) {
      throw new Error(`Week ${week.week_number} review ${stored.tuesday} / ${stored.saturday} / ${stored.sunday} generated ${tuesday} / ${saturday} / ${sunday}`);
    }
    const runThreshold = schedule.filter((day) => day.tags?.[0] === "threshold_run");
    if (week.week_number === 1 && runThreshold.length !== 1) throw new Error("Week 1 does not have one threshold run.");
    if (runThreshold.length > 1) throw new Error(`Week ${week.week_number} has more than one threshold run.`);
    if (week.week_number === 1 && (tuesday !== WEEK_ONE.tuesday || saturday !== WEEK_ONE.saturday || sunday !== WEEK_ONE.sunday)) {
      throw new Error("Week 1 does not match the approved sessions.");
    }
    for (const day of schedule) {
      rows.push({
        session_date: addDays(weekStart, (week.week_number - 1) * 7 + DAYS.indexOf(day.day)),
        day_key: day.day,
        title: day.title,
        active: week.week_number === 1,
        instructions: day.session?.main ?? [],
        week_number: week.week_number,
        week_state: week.week_number === 1 ? "active" : "future",
        payload: payloadFor(day, week.week_number, week.block_number),
      });
    }
  }

  const activeWeeks = new Set(rows.filter((row) => row.active).map((row) => row.week_number));
  if (activeWeeks.size !== 1 || !activeWeeks.has(1)) throw new Error("Activation would not leave exactly Week 1 active.");
  return { programmeKey: PROGRAMME_KEY, weekStart, rows };
}

export function generatedCalendarRows(input: {
  intake: TrackIntake;
  results: Array<Record<string, unknown>>;
  weekNumbers: number[];
}): { programmeKey: string; weekStart: string; rows: ActivationRow[] } {
  assertTrackMutationStaysOff();
  const unavailable = new Set(input.intake.availability.unavailableDays);
  // Programme origin for this already-written block. Live Today does not read this clock.
  const clock = String((input.intake as TrackIntake & { clock?: string }).clock ?? "2026-11-19").slice(0, 10);
  const weekStart = mondayOnOrBefore(clock);
  const generated = generate12WeekProgramme(productionGeneratorInput(input.intake, input.results));
  const wanted = new Set(input.weekNumbers);
  const rows: ActivationRow[] = [];
  for (const week of generated) {
    if (!wanted.has(week.week_number)) continue;
    const seen = new Set<string>();
    for (const day of week.plan_json.schedule) {
      if (unavailable.has(day.day)) throw new Error(`Week ${week.week_number} still schedules unavailable ${day.day}.`);
      if (seen.has(day.day)) throw new Error(`Week ${week.week_number} repeats ${day.day}.`);
      seen.add(day.day);
      rows.push({
        session_date: addDays(weekStart, (week.week_number - 1) * 7 + DAYS.indexOf(day.day)),
        day_key: day.day,
        title: day.title,
        active: false,
        instructions: day.session?.main ?? [],
        week_number: week.week_number,
        week_state: "future",
        payload: payloadFor(day, week.week_number, week.block_number),
      });
    }
    const titles = week.plan_json.schedule.map((day) => day.title).join(" | ");
    const hasThreshold = /threshold/i.test(titles);
    const hasLong = /long/i.test(titles);
    const hasHyrox = /compromised|race-style|hyrox/i.test(titles);
    if (!hasThreshold || !hasLong || !hasHyrox) {
      throw new Error(`Week ${week.week_number} is missing a required stimulus: ${titles}`);
    }
  }
  return { programmeKey: PROGRAMME_KEY, weekStart, rows };
}
