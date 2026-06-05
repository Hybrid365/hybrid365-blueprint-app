import { computePaceGuidanceFromFiveKSeconds } from "@/app/lib/paceGuidance";
import { parseTimeToSeconds } from "@/app/lib/mapAssessmentToProgrammeInput";
import type { DayKey, PlanJson, WeekContext } from "@/app/lib/sessionLibrary";
import type { BlockPhase } from "./types";
import type {
  CommunityPreviewInput,
  CommunityProgrammePreview,
  PreviewSession,
  PreviewWeek,
} from "./types";

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SLOT_ORDER: Record<string, number> = { am: 0, single: 1, main: 1, pm: 2, optional: 3 };

export type HyroxScheduleRow = {
  id: string;
  day: DayKey;
  slot: "main" | "am" | "pm" | "optional";
  title: string;
  type: string;
  category: string;
  stress: string;
  hyrox_pillar: string | null;
  purpose: string;
  duration: number;
  rpe: string;
  target_pace_guidance: string | null;
  target_erg_guidance: string | null;
  warm_up: string;
  main_set: string;
  cool_down: string;
  coach_notes: string | null;
  optional_addon: PreviewSession["optional_addon"];
  extra_round_rule: string | null;
  what_to_record: string;
  equipment_notes: string | null;
  weakness_focus: string[];
  metadata: PreviewSession["metadata"];
  intent: string;
  time_cap_minutes: number;
  tags: string[];
  session: {
    warm_up: string[];
    main: string[];
    cool_down: string[];
    notes: string[];
  };
  session_stress?: PreviewSession["stress"];
  run_prescription?: {
    rpe: string;
    coach_note: string;
    effort_description: string;
    pace_range: string | null;
  };
  priority: {
    rank: 1 | 2 | 3;
    display_label: string;
    category_label: string;
    reason: string;
  };
  progression_note: string;
  block_week_progression_note: string;
  is_optional_session: boolean;
};

function dayKey(day: string): DayKey {
  const d = day.trim().slice(0, 3);
  const map: Record<string, DayKey> = {
    Mon: "Mon",
    Tue: "Tue",
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
    Sun: "Sun",
  };
  return map[d] ?? "Mon";
}

function slotLabel(session: PreviewSession): HyroxScheduleRow["slot"] {
  if (session.is_optional_session) return "optional";
  if (session.slot === "am") return "am";
  if (session.slot === "pm") return "pm";
  return "main";
}

function sessionCategory(session: PreviewSession): string {
  if (session.session_type.toLowerCase().includes("run")) return "run";
  if (session.session_type.toLowerCase().includes("strength")) return "strength";
  if (session.session_type.toLowerCase().includes("recovery")) return "recovery";
  if (session.session_type.toLowerCase().includes("engine") || session.session_type.toLowerCase().includes("aerobic")) {
    return "aerobic";
  }
  return "hybrid";
}

function priorityForSession(session: PreviewSession): HyroxScheduleRow["priority"] {
  if (session.is_optional_session) {
    return {
      rank: 3,
      display_label: "Optional",
      category_label: "Optional / Flexible",
      reason: "Add only if recovery is good and the week allows.",
    };
  }
  if (session.stress === "hard" || session.hyrox_pillar === "compromised_hyrox") {
    return {
      rank: 1,
      display_label: "Priority 1",
      category_label: "Key Session",
      reason: "Anchor session for this HYROX week.",
    };
  }
  return {
    rank: 2,
    display_label: "Priority 2",
    category_label: "Support Session",
    reason: "Builds the engine and supports key HYROX sessions.",
  };
}

function buildNotes(session: PreviewSession): string[] {
  const notes: string[] = [];
  if (session.coach_support_note) notes.push(session.coach_support_note);
  if (session.scaling) notes.push(session.scaling);
  if (session.what_to_record) notes.push(`Record: ${session.what_to_record}`);
  if (session.extra_round_rule) notes.push(session.extra_round_rule);
  if (session.equipment_notes) notes.push(session.equipment_notes);
  if (session.target_erg_guidance) notes.push(session.target_erg_guidance);
  if (session.optional_addon) {
    notes.push(
      `Optional add-on: ${session.optional_addon.title} (${session.optional_addon.duration_range}) · RPE ${session.optional_addon.rpe}. ${session.optional_addon.skip_when}`
    );
  }
  if (session.weakness_focus.length) {
    notes.push(`Station focus: ${session.weakness_focus.join(", ")}`);
  }
  notes.push(session.progression_note);
  return notes.filter(Boolean);
}

export function previewSessionToScheduleRow(
  session: PreviewSession,
  weekNumber: number,
  index: number
): HyroxScheduleRow {
  const slot = slotLabel(session);
  const id = `hyrox-w${weekNumber}-${dayKey(session.day).toLowerCase()}-${slot}-${index}`;
  const notes = buildNotes(session);

  const runRx =
    session.target_pace_guidance && session.metadata.modality === "run"
      ? {
          rpe: session.rpe,
          coach_note: session.target_pace_guidance,
          effort_description: session.purpose,
          pace_range: null as string | null,
        }
      : undefined;

  return {
    id,
    day: dayKey(session.day),
    slot,
    title:
      slot === "am"
        ? `${session.title} (AM)`
        : slot === "pm"
          ? `${session.title} (PM)`
          : session.title,
    type: session.session_type,
    category: sessionCategory(session),
    stress: session.stress,
    hyrox_pillar: session.hyrox_pillar,
    purpose: session.purpose,
    duration: session.duration_minutes,
    rpe: session.rpe,
    target_pace_guidance: session.target_pace_guidance,
    target_erg_guidance: session.target_erg_guidance,
    warm_up: session.warm_up,
    main_set: session.main_set,
    cool_down: session.cool_down,
    coach_notes: session.coach_support_note,
    optional_addon: session.optional_addon,
    extra_round_rule: session.extra_round_rule,
    what_to_record: session.what_to_record,
    equipment_notes: session.equipment_notes,
    weakness_focus: session.weakness_focus,
    metadata: session.metadata,
    intent: session.purpose,
    time_cap_minutes: session.duration_minutes,
    tags: [
      session.hyrox_pillar ?? "hyrox_community",
      session.stress,
      sessionCategory(session),
    ],
    session: {
      warm_up: session.warm_up ? [session.warm_up] : [],
      main: session.main_set ? [session.main_set] : [],
      cool_down: session.cool_down ? [session.cool_down] : [],
      notes,
    },
    session_stress: session.stress,
    ...(runRx ? { run_prescription: runRx } : {}),
    priority: priorityForSession(session),
    progression_note: session.progression_note,
    block_week_progression_note: session.block_week_progression_note,
    is_optional_session: session.is_optional_session,
  };
}

function mapBlockFocus(blockNumber: number): WeekContext["block_focus"] {
  if (blockNumber === 1) return "build_the_base";
  if (blockNumber === 2) return "build_the_engine";
  return "build_performance";
}

function mapWeekFocus(blockNumber: number, weekInBlock: number): WeekContext["week_focus"] {
  const table: Record<number, WeekContext["week_focus"][]> = {
    1: ["base_intro", "base_progression", "base_peak", "base_deload"],
    2: ["engine_intro", "threshold_build", "engine_peak", "engine_deload"],
    3: ["performance_intro", "specificity_peak", "specificity_peak", "test_or_taper"],
  };
  return table[blockNumber]?.[weekInBlock - 1] ?? "base_intro";
}

function trainingEmphasisForPhase(phase: BlockPhase, weekInBlock: number): NonNullable<WeekContext["training_emphasis"]> {
  const peak = weekInBlock === 3;
  const deload = weekInBlock === 4;
  return {
    aerobic_base: phase === "base" || deload ? "high" : "moderate",
    threshold_volume: peak ? "high" : deload ? "low" : "moderate",
    strength_focus: deload ? "maintenance" : peak ? "strength_progression" : "strength_foundations",
    hybrid_specificity: phase === "race_prep" || peak ? "high" : "moderate",
    intensity: deload ? "low_moderate" : peak ? "moderate_high" : "moderate",
  };
}

function sortScheduleRows(rows: HyroxScheduleRow[]): HyroxScheduleRow[] {
  return [...rows].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (SLOT_ORDER[a.slot] ?? 9) - (SLOT_ORDER[b.slot] ?? 9);
  });
}

export function hyroxPreviewWeekToPlanJson(args: {
  weekNumber: number;
  blockNumber: number;
  preview: CommunityProgrammePreview;
  previewWeek: PreviewWeek;
  input: CommunityPreviewInput;
  includeProgrammeRationale: boolean;
}): PlanJson {
  const { weekNumber, blockNumber, preview, previewWeek, input, includeProgrammeRationale } = args;

  const schedule = sortScheduleRows(
    previewWeek.sessions.map((s, i) => previewSessionToScheduleRow(s, weekNumber, i))
  );

  const sec5k = parseTimeToSeconds(input.current_5k_time);
  const paceGuidance = sec5k ? computePaceGuidanceFromFiveKSeconds(sec5k) : undefined;

  const metrics = previewWeek.metrics;
  const estimatedHours = Math.round((metrics.total_planned_minutes / 60) * 10) / 10;

  const plan: PlanJson = {
    intensity_split: {
      easy_percent: Math.min(
        85,
        Math.round((metrics.aerobic_minutes / Math.max(metrics.total_planned_minutes, 1)) * 100)
      ),
      hard_percent: Math.min(
        40,
        Math.round((metrics.hard_sessions / Math.max(schedule.length, 1)) * 100)
      ),
    },
    weekly_stress: {
      raw_score: metrics.hard_sessions * 2,
      budget: 12,
      relative_load: metrics.hard_sessions / Math.max(schedule.length, 1),
      label: metrics.hard_sessions >= 3 ? "high" : metrics.hard_sessions >= 2 ? "balanced" : "low",
      display_label:
        metrics.hard_sessions >= 3 ? "High load week" : metrics.hard_sessions >= 2 ? "Balanced week" : "Controlled week",
      hard_sessions: metrics.hard_sessions,
      high_fatigue_sessions: metrics.hard_sessions,
      planned_minutes: metrics.total_planned_minutes,
      estimated_hours: estimatedHours,
      daily_breakdown: [],
      notes: [],
    },
    week_context: {
      program_type: "community_12_week",
      block_number: blockNumber,
      week_number: weekNumber,
      block_focus: mapBlockFocus(blockNumber),
      week_focus: mapWeekFocus(blockNumber, previewWeek.week_number),
      target_relative_load: metrics.hard_sessions / Math.max(schedule.length, 1),
      target_load_range: { min: 0.25, max: 0.45 },
      training_emphasis: trainingEmphasisForPhase(preview.block_phase, previewWeek.week_number),
    },
    profile: {
      goal: "hyrox",
      training_days: String(input.training_days_per_week),
      priority: preview.block_phase_label,
      level: input.ability_level,
      weekly_hours: input.weekly_training_hours,
      equipment: input.equipment_access.join(", "),
      ...(paceGuidance ? { pace_guidance: paceGuidance } : {}),
    },
    intro: [
      preview.block_phase_label,
      previewWeek.focus,
      preview.coach_support_note,
      ...(input.secondary_goal_support_note ? [input.secondary_goal_support_note] : []),
    ],
    schedule: schedule as unknown as PlanJson["schedule"],
    cta: {
      headline: "HYROX Specific Track",
      body: "Fast. Fit. Strong. Built for HYROX. Message in the community with any questions.",
      button_url: "/dashboard/programme",
    },
    week_rationale: {
      week_role: previewWeek.title,
      why_this_week_matters: previewWeek.focus,
      key_sessions_to_prioritise: schedule
        .filter((s) => s.priority.rank === 1)
        .map((s) => s.title)
        .slice(0, 4),
      coach_note: preview.coach_support_note,
      progression_focus: previewWeek.progression_focus,
    },
  };

  if (includeProgrammeRationale) {
    plan.programme_rationale = {
      headline: "HYROX Specific Track — structured community programming",
      summary: [
        preview.progression_focus,
        preview.coach_support_note,
        ...(input.secondary_goal_support_note ? [input.secondary_goal_support_note] : []),
        "Fast. Fit. Strong. Built for HYROX. Not random. Not average.",
      ],
      key_priorities: preview.weakness_focus_block.length
        ? preview.weakness_focus_block
        : ["Threshold engine", "Aerobic base", "Station durability", "Compromised running"],
      why_this_structure:
        "Progressive 4-week blocks with controlled threshold work, aerobic support, upper/grip durability, HYROX legs and compromised key sessions.",
      how_to_get_the_most_from_it: [
        "Respect hard/easy rhythm and optional add-on windows.",
        "Post in the community if you're unsure how to scale a session.",
        "Use RPE and movement quality before adding extra rounds.",
      ],
    };
    plan.programme_intelligence = {
      primary_goal: "hybrid",
      event_mode: input.race_booked === "yes" ? "event" : "general",
      event_specificity: "hyrox_open",
      limiter_focus: "hyrox_stations",
      impact_risk: input.injury_limitations ? "moderate" : "low",
      benchmark_confidence: paceGuidance ? "medium" : "low",
      engine_biases: ["threshold_run", "erg_aerobic", "compromised_hybrid"],
      rationale_notes: [
        ...preview.equipment_substitutions,
        ...(input.secondary_goal_context
          ? [`Secondary athlete context: ${input.secondary_goal_context}`]
          : []),
      ],
    };
  }

  return plan;
}
