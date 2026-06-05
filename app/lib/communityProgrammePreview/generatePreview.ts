import { blockPhaseForNumber, blockPhaseLabel, weekFocusCopy, weekTitle, weekProgressionFocus } from "./blockPhases";
import { COMMUNITY_SUPPORT_OVERVIEW, coachNoteForSession } from "./coachSupport";
import { generateHyroxProgrammePreview } from "./generateHyroxPreview";
import type {
  CommunityPreviewInput,
  CommunityProgrammePreview,
  HyroxPillar,
  PreviewAbilityLevel,
  PreviewSession,
  PreviewSessionMetadata,
  PreviewStress,
  PreviewWeek,
  PreviewWeekMetrics,
  SessionModality,
} from "./types";

type SlotTemplate = {
  day: string;
  pillar: HyroxPillar;
  title: string;
  session_type: string;
  stress: PreviewStress;
  basePurpose: string;
  baseDuration: number;
  record: string;
  modality: SessionModality;
};

function rpeFor(level: PreviewAbilityLevel, stress: PreviewStress, week: number): string {
  const bump = week >= 3 ? 0.5 : 0;
  const table: Record<PreviewAbilityLevel, Record<PreviewStress, [number, number]>> = {
    beginner: { easy: [4, 5], moderate: [5, 6], hard: [6, 7] },
    intermediate: { easy: [5, 6], moderate: [6, 7], hard: [7, 8] },
    advanced: { easy: [5, 6], moderate: [7, 8], hard: [8, 9] },
  };
  const [lo, hi] = table[level][stress];
  const adjLo = Math.min(10, lo + bump);
  const adjHi = Math.min(10, hi + bump);
  return adjLo === adjHi ? String(adjLo) : `${adjLo}–${adjHi}`;
}

function scalingCopy(level: PreviewAbilityLevel, stress: PreviewStress): string {
  if (level === "beginner") {
    return stress === "hard"
      ? "Reduce intervals 20–30%; walk recoveries; cap total hard time."
      : "Stay conversational on easy work; leave 2–3 reps in reserve on strength.";
  }
  if (level === "advanced") {
    return stress === "hard"
      ? "Full prescription if recovered; add finisher only if RPE ≤ target."
      : "Extend aerobic blocks +5–10 min if HR stays Z2.";
  }
  return "Standard prescription; adjust load from RPE and prior-week response.";
}

function buildMetadata(args: {
  duration: number;
  stress: PreviewStress;
  modality: SessionModality;
  pillar: HyroxPillar | null;
  marker: string;
  threshold?: number;
  aerobic?: number;
  run?: number;
  strength?: number;
}): PreviewSessionMetadata {
  return {
    planned_duration_minutes: args.duration,
    planned_aerobic_minutes: args.aerobic ?? (args.stress === "easy" ? args.duration : 0),
    planned_threshold_minutes: args.threshold ?? 0,
    planned_run_minutes: args.run ?? (args.modality === "run" ? args.duration : 0),
    planned_run_distance_km: null,
    planned_erg_minutes: 0,
    planned_strength_minutes: args.strength ?? (args.modality === "strength" ? args.duration : 0),
    planned_station_volume: null,
    session_stress: args.stress,
    modality: args.modality,
    hyrox_pillar: args.pillar,
    optional_addon: false,
    progression_marker: args.marker,
  };
}

function buildHybridSession(
  tpl: SlotTemplate,
  input: CommunityPreviewInput,
  week: number
): PreviewSession {
  const duration =
    input.ability_level === "beginner"
      ? Math.round(tpl.baseDuration * 0.85)
      : input.ability_level === "advanced"
        ? Math.round(tpl.baseDuration * 1.1)
        : tpl.baseDuration;

  const weekNote = weekProgressionFocus(week);
  const progressionNote =
    week === 1
      ? "W1 baseline exposure"
      : week === 2
        ? "W2 build load"
        : week === 3
          ? "W3 peak week"
          : "W4 deload / consolidate";

  return {
    day: tpl.day,
    slot: "single",
    title: tpl.title,
    session_type: tpl.session_type,
    stress: week === 4 && tpl.stress === "hard" ? "moderate" : tpl.stress,
    hyrox_pillar: tpl.pillar,
    purpose: tpl.basePurpose,
    progression_note: progressionNote,
    block_week_progression_note: weekNote,
    rpe: rpeFor(input.ability_level, tpl.stress, week),
    duration_minutes: duration,
    warm_up: "8–10 min easy + movement prep",
    main_set: week === 4 ? "Reduced volume — same intent, lower density" : "Standard block prescription",
    cool_down: "5 min easy + stretch",
    target_pace_guidance: tpl.modality === "run" ? "RPE-led — use assessment paces when available" : null,
    target_erg_guidance: null,
    optional_addon: null,
    extra_round_rule: null,
    coach_support_note: coachNoteForSession("general"),
    is_optional_session: false,
    what_to_record: tpl.record,
    scaling: scalingCopy(input.ability_level, tpl.stress),
    equipment_notes: null,
    weakness_focus: [],
    metadata: buildMetadata({
      duration,
      stress: tpl.stress,
      modality: tpl.modality,
      pillar: tpl.pillar,
      marker: `hybrid_${tpl.pillar}_w${week}`,
      threshold: tpl.pillar === "threshold_run" ? 20 : 0,
      run: tpl.modality === "run" ? duration : 0,
      strength: tpl.modality === "strength" ? duration : 0,
    }),
  };
}

function hybridSlotTemplates(daysPerWeek: 3 | 4 | 5 | 6): SlotTemplate[] {
  const withDay = (day: string, slot: Omit<SlotTemplate, "day">): SlotTemplate => ({ day, ...slot });

  const threshold: Omit<SlotTemplate, "day"> = {
    pillar: "threshold_run",
    title: "Threshold / tempo run",
    session_type: "Run",
    stress: "hard",
    basePurpose: "Develop running engine and lactate tolerance.",
    baseDuration: 45,
    record: "Pace · threshold minutes · RPE",
    modality: "run",
  };
  const strength: Omit<SlotTemplate, "day"> = {
    pillar: "hybrid_strength",
    title: "Full-body strength",
    session_type: "Strength",
    stress: "moderate",
    basePurpose: "Build strength without compromising run quality.",
    baseDuration: 45,
    record: "Top sets · RPE · soreness next day",
    modality: "strength",
  };
  const conditioning: Omit<SlotTemplate, "day"> = {
    pillar: "conditioning",
    title: "Hybrid conditioning",
    session_type: "Conditioning",
    stress: "moderate",
    basePurpose: "Mixed modal capacity — erg, carry, and engine.",
    baseDuration: 40,
    record: "Round times · RPE",
    modality: "hybrid",
  };
  const easy: Omit<SlotTemplate, "day"> = {
    pillar: "long_easy_aerobic",
    title: "Easy aerobic",
    session_type: "Run",
    stress: "easy",
    basePurpose: "Aerobic volume and recovery rhythm.",
    baseDuration: 40,
    record: "Duration · RPE",
    modality: "run",
  };
  const key: Omit<SlotTemplate, "day"> = {
    pillar: "conditioning",
    title: "Weekend hybrid session",
    session_type: "Hybrid",
    stress: "hard",
    basePurpose: "Key hybrid session — moderate-high stress capstone.",
    baseDuration: 50,
    record: "Score/time · RPE",
    modality: "hybrid",
  };

  const layouts: Record<number, SlotTemplate[]> = {
    3: [withDay("Tue", threshold), withDay("Thu", strength), withDay("Sat", key)],
    4: [withDay("Mon", threshold), withDay("Wed", strength), withDay("Fri", easy), withDay("Sat", key)],
    5: [
      withDay("Mon", threshold),
      withDay("Tue", strength),
      withDay("Thu", conditioning),
      withDay("Fri", easy),
      withDay("Sat", key),
    ],
    6: [
      withDay("Mon", threshold),
      withDay("Tue", strength),
      withDay("Wed", conditioning),
      withDay("Thu", easy),
      withDay("Fri", strength),
      withDay("Sat", key),
    ],
  };

  return layouts[daysPerWeek] ?? layouts[5]!;
}

function computeWeekMetrics(sessions: PreviewSession[], weekInBlock: number): PreviewWeekMetrics {
  let total = 0;
  let aerobic = 0;
  let threshold = 0;
  let strength = 0;
  let runSessions = 0;
  let ergSessions = 0;
  let hard = 0;
  let optionalAddon = 0;

  for (const s of sessions) {
    total += s.metadata.planned_duration_minutes;
    aerobic += s.metadata.planned_aerobic_minutes;
    threshold += s.metadata.planned_threshold_minutes;
    strength += s.metadata.planned_strength_minutes;
    if (s.metadata.planned_run_minutes > 0) runSessions++;
    if (s.metadata.planned_erg_minutes > 0) ergSessions++;
    if (s.stress === "hard") hard++;
    if (s.optional_addon) optionalAddon += s.optional_addon.duration_minutes;
  }

  return {
    week_in_block: weekInBlock,
    progression_focus: weekProgressionFocus(weekInBlock),
    total_planned_minutes: total,
    aerobic_minutes: aerobic,
    threshold_minutes: threshold,
    strength_minutes: strength,
    run_sessions: runSessions,
    erg_sessions: ergSessions,
    hard_sessions: hard,
    optional_addon_minutes: optionalAddon,
  };
}

function generateHybridPreview(input: CommunityPreviewInput): CommunityProgrammePreview {
  const blockNumber = input.block_number || 1;
  const phase = blockPhaseForNumber(blockNumber);
  const templates = hybridSlotTemplates(input.training_days_per_week);

  const weeks: PreviewWeek[] = [1, 2, 3, 4].map((weekNum) => {
    const sessions = templates.map((tpl) => buildHybridSession(tpl, input, weekNum));
    return {
      week_number: weekNum,
      title: weekTitle(weekNum, phase),
      focus: weekFocusCopy(weekNum, phase),
      progression_focus: weekProgressionFocus(weekNum),
      sessions,
      metrics: computeWeekMetrics(sessions, weekNum),
    };
  });

  return {
    track: "hybrid_performance",
    block_number: blockNumber,
    block_phase: phase,
    block_phase_label: blockPhaseLabel(phase),
    block_label: `Block ${blockNumber} · ${blockPhaseLabel(phase)} · 4-week Hybrid Performance preview`,
    progression_focus: blockPhaseLabel(phase),
    coach_support_note: COMMUNITY_SUPPORT_OVERVIEW,
    weeks,
    weakness_focus_block: [],
    equipment_substitutions: [],
    generated_at: new Date().toISOString(),
  };
}

/**
 * In-memory preview only — no database writes.
 */
export function generateCommunityProgrammePreview(
  input: CommunityPreviewInput
): CommunityProgrammePreview {
  if (input.training_track === "hyrox") {
    return generateHyroxProgrammePreview(input);
  }
  return generateHybridPreview(input);
}

export const DEFAULT_PREVIEW_INPUT: CommunityPreviewInput = {
  training_track: "hyrox",
  primary_goal: "hyrox_performance",
  secondary_goal_context: null,
  secondary_goal_kind: "unknown",
  secondary_goal_support_note: null,
  emphasise_running_support: false,
  ability_level: "intermediate",
  training_days_per_week: 5,
  weekly_training_hours: "7-10",
  session_length: "60-90 min",
  double_session_availability: false,
  equipment_access: ["Full Gym"],
  injury_limitations: "",
  current_5k_time: "25:00",
  current_10k_time: "52:00",
  weekly_run_volume_km: "25",
  running_confidence: 7,
  race_booked: "not_yet_but_planning",
  race_date: "",
  race_category: "open",
  race_target_time: "1:30:00",
  station_weaknesses: ["running_between_stations", "wall_balls"],
  hyrox_equipment: ["skierg", "rowerg", "sled", "wall_balls"],
  ski_1k_time: "4:30",
  row_1k_time: "4:15",
  wall_ball_standard: "6 kg",
  sled_experience: "moderate",
  compromised_running_confidence: 6,
  block_number: 1,
};
