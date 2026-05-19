// app/lib/buildWeekBlueprint.ts

import { weightedPick } from "./weightedPick";
import {
  AbilityLevel,
  DayKey,
  DayPlan,
  GoalFocus,
  PlanJson,
  PlanSafetyFlags,
  SESSION_LIBRARY,
  SessionTemplate,
  StructureRole,
  UserEquipment,
  WeeklyHoursBand,
  WeeklyStressSummary,
} from "./sessionLibrary";
import { mapGoalToBias, pickWeeklyStructure } from "./weeklyStructures";
import { classifyRunner, type RunnerProfile } from "./classifyRunner";
import { parseConstraints, type ModalityAvoids, type ParsedConstraints } from "./parseConstraints";
import { computePaceGuidanceFromFiveKSeconds, runSessionPaceNote, type PaceGuidance } from "./paceGuidance";
import { enrichAerobicSessionNotes, isBikeOrEasyAerobicSession } from "./aerobicSessionGuidance";
import { buildRunPrescription } from "./runPrescription";
import { hyroxSessionWeightDelta, hyroxWeeklyStructureBoost } from "./hyroxTrackContext";
import { computeSessionStress, computeWeeklyStress, type SessionStressInput } from "./stressBudget";
import {
  analyzeWeeklyRhythm,
  classifyDayPlan,
  classifySessionFromTemplate,
  stressInputFromClassification,
} from "./sessionStressClassification";
import {
  appendRhythmCoachingNotes,
  balanceScheduleHardEasy,
  pickDayForRole,
} from "./weeklyRhythmPlanner";
import {
  ERG_ENGINE_COACHING_NOTE,
  hasRunThresholdAnchor,
  shouldAddErgThresholdSupport,
} from "./thresholdVolumeTracking";
import {
  getProgressionTarget,
  getStressAlignment,
  type ProgramType,
  type ProgressionTarget,
} from "./progressionTargets";
import { computeSessionPriority, createFillerPriority } from "./sessionPriority";
import { buildSubstitutionNotes } from "./substitutionGuidance";
import {
  applyProgressionFamily,
  resolveStrengthFamilyForRole,
  type AppliedProgression,
} from "./progressionFamilies";
import {
  applyRunProgressionPrescription,
  isBannedRunPick,
  preferredTemplateIdForRunSlot,
  resolveRunAppliedProgression,
  runSlotForRole,
  type RunProgressionContext,
  type WeekRunSnapshot,
} from "./runSessionProgression";
import {
  applyRunVolumeToStructureRoles,
  pickStructureWithRunVolume,
  type RunVolumePlan,
} from "./runVolumePlanner";

export type BlueprintInput = {
  first_name?: string;
  days_per_week: number;
  weekly_hours_band: WeeklyHoursBand;
  goal_focus: GoalFocus;
  ability_level: AbilityLevel;
  double_sessions?: boolean;
  /** Specific days the athlete can do doubles, e.g. ["Monday","Wednesday"] */
  double_session_days?: string[];
  preferred_days?: string[];
  equipment?: string[];
  five_k_time?: string;
  /** Optional max HR (bpm) from paid assessment — enables HR zone guidance on run sessions. */
  max_heart_rate?: number | null;
  notes?: string;
  /** Optional raw flags passed through for rationale generation */
  has_injury?: boolean;
  /** HYROX goal/event track — biases session selection and coaching when active */
  hyrox_track?: import("./hyroxTrackContext").HyroxTrackContext | null;
  /** Athlete-reported weekly run volume band (paid assessment). */
  current_run_volume_band?: string | null;
};

export type BuildWeekBlueprintOptions = {
  program_type?: ProgramType;
  week_number?: number | null;
  block_number?: number | null;
  progression_target?: ProgressionTarget | null;
  run_volume_plan?: RunVolumePlan | null;
  previous_week_run_snapshots?: WeekRunSnapshot[];
};

function formatGoal(goal: GoalFocus) {
  if (goal === "running") return "Run Faster / Improve Engine";
  if (goal === "muscle") return "Build Strength Without Losing Fitness";
  return "Improve Hybrid / Hyrox Performance";
}

function formatPriority(goal: GoalFocus) {
  if (goal === "running") return "Running Performance";
  if (goal === "muscle") return "Strength Development";
  return "Balanced Hybrid Performance";
}

function getHoursText(hours: WeeklyHoursBand) {
  const map: Record<WeeklyHoursBand, string> = {
    "2-3": "2–3 hours per week",
    "3-5": "3–5 hours per week",
    "5-7": "5–7 hours per week",
    "7-10": "7–10 hours per week",
    "10+": "10+ hours per week",
  };

  return map[hours];
}

function getExperienceText(level: AbilityLevel) {
  if (level === "beginner") return "beginner";
  if (level === "advanced") return "advanced";
  return "intermediate";
}

function getEquipmentSummary(equipment?: string[]) {
  if (!equipment || equipment.length === 0) return "full gym access";
  if (equipment.includes("Full gym")) return "full gym access";
  if (equipment.includes("Dumbbells only")) return "limited equipment";
  if (equipment.includes("None (bodyweight only)")) return "bodyweight-only equipment";
  return equipment.join(", ").toLowerCase();
}

function getGoalReason(goal: GoalFocus) {
  if (goal === "running") {
    return "prioritising quality running, aerobic support, and enough strength work to keep you durable";
  }

  if (goal === "muscle") {
    return "prioritising strength development first, while keeping conditioning in to maintain fitness and athleticism";
  }

  return "prioritising threshold work, compromised efforts, and supportive strength to improve how well you perform under fatigue";
}

function getLevelReason(level: AbilityLevel) {
  if (level === "beginner") {
    return "Because you’re still building structure, the week keeps complexity under control and focuses on repeatable, manageable sessions.";
  }

  if (level === "advanced") {
    return "Because your training level is more advanced, the week can handle slightly more density, sharper quality, and more demanding session pairings.";
  }

  return "Because you already have a base of structured training, the week can push quality while still staying recoverable.";
}

function getHoursReason(hours: WeeklyHoursBand, doubleSessions?: boolean) {
  if (hours === "2-3") {
    return "With limited weekly training time, every session has to carry real value — so the structure is built around high-return sessions rather than filler volume.";
  }

  if (hours === "3-5") {
    return "With moderate training time available, the week balances quality and recovery so you can progress without feeling overloaded.";
  }

  if (hours === "5-7") {
    return "With a solid weekly training window, we can include enough quality, support work, and aerobic volume to make the week feel complete.";
  }

  if (hours === "7-10" || hours === "10+") {
    if (doubleSessions) {
      return "Because you have more training time and are open to doubles, the structure can include extra aerobic support without compromising the main sessions.";
    }

    return "Because you have a bigger weekly training window, the structure includes more complete sessions and a fuller performance split.";
  }

  return "";
}

function getConstraintReason(notes?: string) {
  if (!notes || !notes.trim()) return "";
  return `We’ve also kept your note in mind: "${notes.trim()}".`;
}

function intensitySplit(ability: AbilityLevel) {
  if (ability === "beginner") return { easy_percent: 75, hard_percent: 25 };
  if (ability === "advanced") return { easy_percent: 65, hard_percent: 35 };
  return { easy_percent: 70, hard_percent: 30 };
}

function defaultEquipment(equipment?: string[]): UserEquipment[] {
  if (!equipment || equipment.length === 0) return ["Full gym"];
  return equipment as UserEquipment[];
}

function matchesEquipment(session: SessionTemplate, available: UserEquipment[]) {
  if (available.includes("Full gym")) return true;
  return session.equipment.some((e) => available.includes(e));
}

function matchesLevel(session: SessionTemplate, level: AbilityLevel) {
  return session.experience.includes(level);
}

function matchesGoal(session: SessionTemplate, goal: GoalFocus) {
  return session.goal.includes(goal);
}

function matchesTime(session: SessionTemplate, hours: WeeklyHoursBand) {
  if (hours === "2-3" || hours === "3-5") return session.time_requirement !== "75+";
  return true;
}

function roleMatches(session: SessionTemplate, role: StructureRole) {
  return session.structure_roles.includes(role);
}

const LOW_IMPACT_AUTO_NOTE =
  "Safety adjustment: this was softened because you mentioned impact or injury concerns.";
const TIME_CAP_AUTO_NOTE =
  "Safety adjustment: this was shortened because you selected a low weekly time window or mentioned limited time.";
const BEGINNER_LOAD_AUTO_NOTE =
  "Safety adjustment: this was softened to keep the week appropriate for a beginner.";

/** Governor-only: disallow swaps that insist on modalities the athlete ruled out (mirrors modality_avoids weighting intent). */
function governorTemplatePassesModality(s: SessionTemplate, avoids: ModalityAvoids): boolean {
  const blob = sessionText(s);
  if (avoids.sled) {
    const sledHit =
      s.equipment.includes("Sled") || /\bsled\b|\bprowler\b|\bsled\s+(?:push|pull|drag)\b/i.test(blob);
    if (sledHit) return false;
  }
  if (avoids.rower) {
    const rowHit =
      s.equipment.includes("Rower") ||
      blobLooksRowDominant(blob) ||
      /500m\s*row\b|750m\s*row\b|1000m\s*row\b|2000m\s*row\b/i.test(blob);
    if (rowHit) return false;
  }
  if (avoids.ski) {
    const skiHit =
      s.equipment.includes("SkiErg") ||
      blobLooksSkiDominant(blob) ||
      /500m\s*ski\b|750m\s*ski\b|\bkm\s*ski\b/i.test(blob);
    if (skiHit) return false;
  }
  return true;
}

function templateEligibleForGovernorSwapWithConstraints(
  s: SessionTemplate,
  input: BlueprintInput,
  parsedConstraints: ParsedConstraints
): boolean {
  const equipmentResolved = defaultEquipment(input.equipment);
  return (
    matchesLevel(s, input.ability_level) &&
    matchesGoal(s, input.goal_focus) &&
    matchesEquipment(s, equipmentResolved) &&
    matchesTime(s, input.weekly_hours_band) &&
    governorTemplatePassesModality(s, parsedConstraints.modality_avoids)
  );
}

function findSessionByName(name: string): SessionTemplate | undefined {
  return SESSION_LIBRARY.find((x) => x.name === name);
}

function pickGovernorTemplateByNames(
  names: string[],
  role: StructureRole,
  input: BlueprintInput,
  parsedConstraints: ParsedConstraints,
  usedTitles: Set<string>,
  requireRoleMatch: boolean,
  allowDuplicateName?: boolean
): SessionTemplate | null {
  for (const name of names) {
    const s = findSessionByName(name);
    if (!s || !templateEligibleForGovernorSwapWithConstraints(s, input, parsedConstraints)) continue;
    if (requireRoleMatch && !roleMatches(s, role)) continue;
    if (!allowDuplicateName && usedTitles.has(s.name.trim().toLowerCase())) continue;
    return s;
  }
  if (!requireRoleMatch) return null;
  return pickGovernorTemplateByNames(
    names,
    role,
    input,
    parsedConstraints,
    usedTitles,
    false,
    allowDuplicateName
  );
}

const STRENGTH_STRUCTURE_ROLES = new Set<StructureRole>([
  "lower_primary",
  "lower_full",
  "upper_primary",
  "upper_full",
  "full_body_strength",
  "recovery",
]);

/** Run prescription only on true run or hybrid-primary sessions — not strength slots. */
function shouldAttachRunPrescription(
  picked: SessionTemplate,
  role: StructureRole
): boolean {
  if (STRENGTH_STRUCTURE_ROLES.has(role)) return false;
  if (picked.category === "run") return true;
  if (
    (role === "hybrid_primary" || role === "hybrid_density") &&
    (picked.type === "hybrid_compromised" || picked.type === "hybrid_density")
  ) {
    return true;
  }
  return false;
}

function buildDayPlanAndStressFromTemplate(args: {
  picked: SessionTemplate;
  assignedDay: DayKey;
  role: StructureRole;
  input: BlueprintInput;
  parsedConstraints: ParsedConstraints;
  paceGuidance: PaceGuidance | null;
  extraSessionNotes?: string[];
  appliedProgression?: AppliedProgression | null;
}): { dayPlan: DayPlan; stress: SessionStressInput } {
  const {
    picked,
    assignedDay,
    role,
    input,
    parsedConstraints,
    paceGuidance,
    extraSessionNotes,
    appliedProgression,
  } = args;
  const equipmentResolved = defaultEquipment(input.equipment);
  const substitutionNotes = buildSubstitutionNotes({
    parsedConstraints,
    equipment: equipmentResolved,
    session: picked,
  }).filter((line) => typeof line === "string" && line.trim().length > 0);

  const coachingPrefix = [
    purposeText(picked),
    structureReasonText(picked, input.goal_focus),
    cueText(picked),
    rpeText(picked),
  ];
  const libraryNotes = [...(picked.prescription.notes || [])];
  const paceNote =
    paceGuidance && picked.category === "run" ? runSessionPaceNote(picked.type, paceGuidance) : null;
  const hyroxEquipmentNote =
    input.hyrox_track?.active && input.hyrox_track.equipment_note
      ? [input.hyrox_track.equipment_note]
      : [];

  const sessionNotesRaw = [
    ...coachingPrefix,
    ...(paceNote ? [paceNote] : []),
    ...hyroxEquipmentNote,
    ...substitutionNotes,
    ...libraryNotes,
    ...(extraSessionNotes ?? []),
  ].filter((line) => typeof line === "string" && line.trim().length > 0);

  const sessionNotes = enrichAerobicSessionNotes(picked, input, sessionNotesRaw);

  const classified = classifySessionFromTemplate({
    type: picked.type,
    category: picked.category,
    intensity: picked.intensity,
    fatigue: picked.fatigue,
    title: appliedProgression?.variant.title ?? picked.name,
    mainLines: appliedProgression?.variant.main?.length
      ? appliedProgression.variant.main
      : picked.prescription.main,
    structureRole: role,
  });

  const stress: SessionStressInput = stressInputFromClassification(
    {
      day: assignedDay,
      title: picked.name,
      category: picked.category,
      type: picked.type,
      intensity: picked.intensity,
      fatigue: picked.fatigue,
      duration: picked.duration,
    },
    classified
  );

  const displayTitle = appliedProgression?.variant.title ?? picked.name;
  const displayMain =
    appliedProgression?.variant.main?.length ? appliedProgression.variant.main : picked.prescription.main;

  const run_prescription = shouldAttachRunPrescription(picked, role)
    ? buildRunPrescription({
        sessionType: picked.type,
        paceGuidance,
        maxHeartRate: input.max_heart_rate ?? null,
        goalFocus: input.goal_focus,
        hyroxTrack: input.hyrox_track?.active ?? false,
      })
    : undefined;

  const dayPlan: DayPlan = {
    template_id: picked.id,
    day: assignedDay,
    title: displayTitle,
    intent: structureIntent(role, input.goal_focus),
    session: {
      warm_up: picked.prescription.warm_up,
      main: displayMain,
      cool_down: picked.prescription.cool_down,
      finish: picked.prescription.finish,
      notes: sessionNotes,
    },
    time_cap_minutes: picked.duration,
    tags: [picked.type, picked.category, picked.variation_group],
    ...(appliedProgression
      ? {
          progression_family: appliedProgression.family_id,
          progression_marker: appliedProgression.variant.marker,
        }
      : {}),
    ...(run_prescription ? { run_prescription } : {}),
    session_stress: classified.session_stress,
    session_role: classified.session_role,
    priority: computeSessionPriority({
      goalFocus: input.goal_focus,
      role,
      session: picked,
    }),
  };

  return { dayPlan, stress };
}

function isSofteningExcludedLowImpactDay(day: DayPlan): boolean {
  const tags = day.tags ?? [];
  const t0 = tags[0];
  const t1 = tags[1];
  const vg = tags[2];
  if (day.template_id === "FILLER-RECOVERY" || day.template_id === "FILLER-AEROBIC") return true;
  if (t0 === "recovery" || t1 === "recovery" || tags.includes("recovery")) return true;
  if (tags.includes("aerobic_support") || t0 === "aerobic_support") return true;
  if (vg === "hybrid_low_impact" || tags.includes("hybrid_low_impact")) return true;
  if (vg === "lower_durability" || tags.includes("lower_durability")) return true;
  return false;
}

function isHighImpactOffenderForAutoSoftening(day: DayPlan): boolean {
  if (isSofteningExcludedLowImpactDay(day)) return false;
  const tags = day.tags ?? [];
  const t0 = tags[0] ?? "";
  if (t0 === "interval_run" || t0 === "threshold_run" || t0 === "long_run" || t0 === "hybrid_compromised") {
    return true;
  }
  const hay = concatDayPlanInspectableText(day);
  if (/lunges?|burpees?|\brun(?:ning)?\b|compromised|race[-\s]specific|\bsled\b/i.test(hay)) {
    return true;
  }
  return false;
}

function lowImpactReplacementNameOrder(offender: DayPlan, role: StructureRole): string[] {
  const t0 = offender.tags?.[0] ?? "";
  if (t0 === "long_run") {
    return ["Long Low-Impact Bike Base", "Low-Impact Aerobic Base", "Low-Impact Run Alternative", "Bike Tempo Build"];
  }
  if (t0 === "hybrid_compromised" || t0 === "hybrid_density") {
    return ["Low-Impact Hybrid Engine", "Carry + Erg Control", "Bike Tempo Build", "Low-Impact Aerobic Base"];
  }
  if (
    t0 === "threshold_run" ||
    t0 === "interval_run" ||
    (t0 === "tempo_run" && offender.tags?.[1] === "run")
  ) {
    return [
      "No-Impact Threshold Builder",
      "Low-Impact Run Alternative",
      "Bike Tempo Build",
      "Low-Impact Aerobic Base",
    ];
  }
  if (t0 === "strength_lower" || t0 === "strength_full") {
    return [
      "Knee-Friendly Lower Strength",
      "Lower Isometric Durability",
      "Bodyweight Lower Durability",
      "Low-Impact Aerobic Base",
    ];
  }
  if (role === "run_long") {
    return ["Long Low-Impact Bike Base", "Low-Impact Aerobic Base", "Low-Impact Run Alternative"];
  }
  if (role === "hybrid_primary" || role === "hybrid_density") {
    return ["Low-Impact Hybrid Engine", "Carry + Erg Control", "Bike Tempo Build"];
  }
  return [
    "Low-Impact Run Alternative",
    "No-Impact Threshold Builder",
    "Bike Tempo Build",
    "Low-Impact Aerobic Base",
    "Low-Impact Hybrid Engine",
  ];
}

function isLibraryBackedDay(day: DayPlan): boolean {
  if (day.template_id === "FILLER-RECOVERY" || day.template_id === "FILLER-AEROBIC") return false;
  if (day.title === "Recovery / Mobility" || day.title === "Aerobic Support") return false;
  return Boolean(day.template_id);
}

function isRecoveryStyledDay(day: DayPlan): boolean {
  if (day.template_id === "FILLER-RECOVERY") return true;
  const t0 = day.tags?.[0];
  const cat = day.tags?.[1];
  return t0 === "recovery" || cat === "recovery";
}

function countAutoSofteningTriggerCategories(args: {
  input: BlueprintInput;
  parsedConstraints: ParsedConstraints;
  schedule: DayPlan[];
  weeklyStress: WeeklyStressSummary;
}): number {
  const { input, parsedConstraints, schedule, weeklyStress } = args;
  const lowImpactActive =
    (parsedConstraints.flags.includes("injury_flags") ||
      parsedConstraints.flags.includes("low_impact_preference")) &&
    schedule.some((d) => isHighImpactOffenderForAutoSoftening(d));
  const timeActive =
    (input.weekly_hours_band === "2-3" || parsedConstraints.flags.includes("time_limit")) &&
    (weeklyStress.estimated_hours > 3.5 || weeklyStress.relative_load > 1.15);
  const beginnerActive = input.ability_level === "beginner" && weeklyStress.relative_load > 1.15;
  return [lowImpactActive, timeActive, beginnerActive].filter(Boolean).length;
}

function replaceScheduleSlot(args: {
  schedule: DayPlan[];
  orderedStressInputs: SessionStressInput[];
  index: number;
  dayPlan: DayPlan;
  stress: SessionStressInput;
}): void {
  args.schedule[args.index] = args.dayPlan;
  args.orderedStressInputs[args.index] = args.stress;
}

function pickTimeSofteningReplacement(args: {
  dayKey: DayKey;
  recoveryMinutes: number;
  aerobicSupportMinutes: number;
  aerobicSupportStressDur: number;
  input: BlueprintInput;
  note: string;
}): { dayPlan: DayPlan; stress: SessionStressInput } {
  const { dayKey, recoveryMinutes, aerobicSupportMinutes, aerobicSupportStressDur, input, note } = args;
  if (input.goal_focus === "running") {
    const d = lightAerobicDay(dayKey, input, aerobicSupportMinutes);
    return {
      dayPlan: {
        ...d,
        session: {
          ...d.session,
          notes: [...(d.session.notes ?? []), note],
        },
      },
      stress: {
        day: dayKey,
        title: "Aerobic Support",
        category: "aerobic",
        type: "aerobic_support",
        intensity: "low",
        fatigue: "low",
        duration: aerobicSupportStressDur,
      },
    };
  }
  const d = recoveryDay(dayKey, recoveryMinutes);
  return {
    dayPlan: {
      ...d,
      session: {
        ...d.session,
        notes: [...(d.session.notes ?? []), note],
      },
    },
    stress: {
      day: dayKey,
      title: "Recovery / Mobility",
      category: "recovery",
      type: "recovery",
      intensity: "low",
      fatigue: "low",
      duration: recoveryMinutes,
    },
  };
}

/** Narrow post-fill substitutions (max two per week) before final stress + safety_flags. Mutates parallel arrays in lockstep. */
function applyNarrowAutoSoftening(args: {
  input: BlueprintInput;
  parsedConstraints: ParsedConstraints;
  paceGuidance: PaceGuidance | null;
  schedule: DayPlan[];
  orderedStressInputs: SessionStressInput[];
  dayRoleByAssignedDay: Map<DayKey, StructureRole>;
  weeklyStressBaseline: WeeklyStressSummary;
  compressOffSessions: boolean;
}): void {
  const {
    input,
    parsedConstraints,
    paceGuidance,
    schedule,
    orderedStressInputs,
    dayRoleByAssignedDay,
    weeklyStressBaseline,
    compressOffSessions,
  } = args;

  const triggerCount = countAutoSofteningTriggerCategories({
    input,
    parsedConstraints,
    schedule,
    weeklyStress: weeklyStressBaseline,
  });
  if (triggerCount === 0) return;
  const maxSubs = triggerCount >= 2 ? 2 : 1;
  let substitutions = 0;
  const softenedIndices = new Set<number>();

  const titlesRef = (): Set<string> =>
    new Set(schedule.map((d) => d.title.trim().toLowerCase()).filter((t) => t.length > 0));

  const recoveryMinutes = compressOffSessions ? 22 : 35;
  const aerobicSupportMinutes = compressOffSessions ? 26 : 40;
  const aerobicSupportStressDur = compressOffSessions ? 26 : 35;

  const needsLowImpactGovernor =
    parsedConstraints.flags.includes("injury_flags") ||
    parsedConstraints.flags.includes("low_impact_preference");

  const baselineTimeTrigger =
    (input.weekly_hours_band === "2-3" || parsedConstraints.flags.includes("time_limit")) &&
    (weeklyStressBaseline.estimated_hours > 3.5 || weeklyStressBaseline.relative_load > 1.15);

  const baselineBeginnerTrigger =
    input.ability_level === "beginner" && weeklyStressBaseline.relative_load > 1.15;

  // 1) Low-impact injury: earliest calendar offenders, at most two impact swaps capped by weekly budget.
  let impactPasses = 0;
  const maxImpactPasses = Math.min(2, maxSubs);
  if (needsLowImpactGovernor && maxImpactPasses > 0) {
    for (let i = 0; i < schedule.length; i++) {
      if (substitutions >= maxSubs || impactPasses >= maxImpactPasses) break;
      if (softenedIndices.has(i)) continue;
      const day = schedule[i];
      const dayKey = day.day;
      const role = dayRoleByAssignedDay.get(dayKey);
      if (!role || !isHighImpactOffenderForAutoSoftening(day) || !isLibraryBackedDay(day)) continue;

      let tmpl =
        pickGovernorTemplateByNames(
          lowImpactReplacementNameOrder(day, role),
          role,
          input,
          parsedConstraints,
          titlesRef(),
          true,
          false
        ) ??
        pickGovernorTemplateByNames(
          lowImpactReplacementNameOrder(day, role),
          role,
          input,
          parsedConstraints,
          titlesRef(),
          true,
          true
        );

      if (!tmpl) continue;

      const { dayPlan, stress } = buildDayPlanAndStressFromTemplate({
        picked: tmpl,
        assignedDay: dayKey,
        role,
        input,
        parsedConstraints,
        paceGuidance,
        extraSessionNotes: [LOW_IMPACT_AUTO_NOTE],
      });
      replaceScheduleSlot({ schedule, orderedStressInputs, index: i, dayPlan, stress });
      softenedIndices.add(i);
      impactPasses++;
      substitutions++;
    }
  }

  // 2) Time / band: trim dense support slots
  if (
    baselineTimeTrigger &&
    substitutions < maxSubs
  ) {
    const candIdx = findTimeSofteningCandidateIndex(schedule, softenedIndices);
    if (candIdx !== null && !softenedIndices.has(candIdx)) {
      const dayKey = schedule[candIdx].day;
      const { dayPlan, stress } = pickTimeSofteningReplacement({
        dayKey,
        recoveryMinutes,
        aerobicSupportMinutes,
        aerobicSupportStressDur,
        input,
        note: TIME_CAP_AUTO_NOTE,
      });
      replaceScheduleSlot({ schedule, orderedStressInputs, index: candIdx, dayPlan, stress });
      softenedIndices.add(candIdx);
      substitutions++;
    }
  }

  // 3) Beginner overload: soften heaviest optional day
  if (baselineBeginnerTrigger && substitutions < maxSubs) {
    const candIdx = findBeginnerOverloadCandidateIndex(
      schedule,
      orderedStressInputs,
      softenedIndices
    );
    if (candIdx !== null) {
      const dayKey = schedule[candIdx].day;
      const { dayPlan, stress } = pickTimeSofteningReplacement({
        dayKey,
        recoveryMinutes,
        aerobicSupportMinutes,
        aerobicSupportStressDur,
        input,
        note: BEGINNER_LOAD_AUTO_NOTE,
      });
      replaceScheduleSlot({ schedule, orderedStressInputs, index: candIdx, dayPlan, stress });
      softenedIndices.add(candIdx);
      substitutions++;
    }
  }
}

function findTimeSofteningCandidateIndex(
  schedule: DayPlan[],
  exclude: ReadonlySet<number>
): number | null {
  let bestIdx: number | null = null;
  let bestRank = -1;
  let bestDuration = -1;
  for (let i = 0; i < schedule.length; i++) {
    if (exclude.has(i)) continue;
    const day = schedule[i];
    const rank = day.priority?.rank ?? 99;
    if (rank <= 1) continue;
    if (!isLibraryBackedDay(day)) continue;
    if (isRecoveryStyledDay(day)) continue;
    const t0 = day.tags?.[0] ?? "";
    const dur = typeof day.time_cap_minutes === "number" ? day.time_cap_minutes : 0;
    if (!(dur > 35 || t0 === "hybrid_density" || t0 === "strength_full")) continue;

    const better =
      rank > bestRank ||
      (rank === bestRank && (dur > bestDuration || bestIdx === null));
    if (better) {
      bestIdx = i;
      bestRank = rank;
      bestDuration = dur;
    }
  }
  return bestIdx;
}

function findBeginnerOverloadCandidateIndex(
  schedule: DayPlan[],
  orderedStressInputs: SessionStressInput[],
  exclude: ReadonlySet<number>
): number | null {
  let bestIdx: number | null = null;
  let bestScore = -1;
  for (let i = 0; i < schedule.length; i++) {
    if (exclude.has(i)) continue;
    const day = schedule[i];
    const rank = day.priority?.rank ?? 99;
    if (rank <= 1) continue;
    if (!isLibraryBackedDay(day)) continue;
    if (isRecoveryStyledDay(day)) continue;
    const sIn = orderedStressInputs[i];
    if (!sIn) continue;
    const score =
      computeSessionStress(sIn) + (typeof sIn.duration === "number" ? sIn.duration * 0.01 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

const MIN_SESSION_WEIGHT = 0.1;

type SessionPickContext = {
  usedIds: Set<string>;
  /** variation_group strings already picked this week */
  usedVariationGroups: Set<string>;
  /** Normalised session names already picked */
  usedSessionNames: Set<string>;
  /** Running goal: count of quality runs (threshold / interval / hard tempo) picked so far */
  runningQualitySessionCount: number;
  runningThresholdSessionCount: number;
  runningIntervalSessionCount: number;
  /** variation_group keys for quality run picks only (duplicate quality vg bias) */
  runningQualityVariationGroups: Set<string>;
  weekNumber: number;
  weekFocus: string | null;
};

/** Harder run sessions that stack fatigue when duplicated in one week. */
function isQualityRunSession(s: SessionTemplate): boolean {
  if (s.category !== "run") return false;
  if (s.type === "threshold_run" || s.type === "interval_run") return true;
  if (s.type === "tempo_run" && (s.intensity === "medium" || s.intensity === "high")) return true;
  const vg = s.variation_group.toLowerCase();
  if (vg === "threshold" || vg === "interval" || vg === "tempo") return true;
  return false;
}

/** Threshold/tempo styles appropriate for base-building / novice tolerance. */
function isBeginnerFriendlyRunQuality(s: SessionTemplate): boolean {
  const vg = s.variation_group.toLowerCase();
  return (
    vg.includes("beginner") ||
    vg.includes("short") ||
    vg.includes("base") ||
    vg === "run_walk_base" ||
    vg === "aerobic_run_short" ||
    vg === "aerobic_run" ||
    vg === "tempo_beginner"
  );
}

function registerRunningQualityPick(ctx: SessionPickContext, picked: SessionTemplate) {
  if (picked.category !== "run" || !isQualityRunSession(picked)) return;
  ctx.runningQualitySessionCount += 1;
  if (picked.type === "threshold_run") ctx.runningThresholdSessionCount += 1;
  if (picked.type === "interval_run") ctx.runningIntervalSessionCount += 1;
  ctx.runningQualityVariationGroups.add(picked.variation_group);
}

/** Prefer unused templates when the role pool has alternatives — never empties options. */
function sessionPoolWithDuplicateGuards(options: SessionTemplate[], ctx: SessionPickContext): SessionTemplate[] {
  const nameKey = (s: SessionTemplate) => s.name.trim().toLowerCase();

  let pool = options;
  const noUsedId = options.filter((s) => !ctx.usedIds.has(s.id));
  if (noUsedId.length > 0) pool = noUsedId;

  const noDupName = pool.filter((s) => !ctx.usedSessionNames.has(nameKey(s)));
  if (noDupName.length > 0) pool = noDupName;

  return pool;
}

/** New Stage 5a templates and other anchors to prioritise when impact must stay low. */
const LOW_IMPACT_PRIORITY_IDS = new Set([
  "AER-BIKE-TEMPO-BUILD",
  "AER-ROW-TEMPO-BUILD",
  "AER-SKI-TEMPO-BUILD",
  "HYX-LOW-IMPACT-ENGINE",
  "HYX-CARRY-ERG-CONTROL",
  "LOWER-KNEE-FRIENDLY",
  "LOWER-ISOMETRIC-DURABILITY",
  "RUN-LOW-IMPACT-ALT",
  "AER-BIKE-LONG-BASE",
]);

/** Stage 5b beginner Hyrox / hybrid-intro templates — prefer when athlete or notes imply first Hyrox. */
const HYBRID_INTRO_PRIORITY_IDS = new Set([
  "HYX-BEGINNER-FLOW",
  "HYX-STATION-TECHNIQUE",
  "HYX-CONTROLLED-COMPROMISE",
  "HYX-BEGINNER-DENSITY",
  "RUN-WALK-HYBRID-INTRO",
  "HYX-WALL-BALL-LUNGE-BASE",
  "HYX-ERG-FOUNDATIONS",
  "HYX-TRANSITION-PRACTICE",
  "HYX-BEGINNER-CARRY-CIRCUIT",
  "HYX-FIRST-RACE-PREP",
]);

/** Lowercased text from session fields for lightweight keyword checks (equipment notes, substitution weighting). */
export function sessionText(session: SessionTemplate): string {
  const chunks: string[] = [
    session.name,
    session.type,
    session.variation_group,
    session.coaching.intent,
    session.coaching.cue,
    ...(session.prescription.warm_up ?? []),
    ...(session.prescription.main ?? []),
    ...(session.prescription.cool_down ?? []),
    ...(session.prescription.finish ?? []),
    ...(session.prescription.notes ?? []),
  ];
  return chunks.join(" ").toLowerCase();
}

function blobLooksRowDominant(blob: string): boolean {
  if (blob.includes("rower") || /\browing\s+machine\b/.test(blob)) return true;
  if (/\b\d+m\s+(?:steady|easy|moderate|controlled)?\s*row\b|\b\d+m\s*row\b/.test(blob))
    return true;
  if (/\beasy\s+row\b|\bsteady\s+row\b|\bmoderate\s+row\b|\bcontrolled\s+row\b/.test(blob)) return true;
  if (/\bsteady\s+paddle\b/.test(blob)) return true;
  if (/\b(row\s+or\s+ski|ski\s+or\s+row)\b/.test(blob)) return true;
  return false;
}

function blobLooksSkiDominant(blob: string): boolean {
  if (blob.includes("skierg") || blob.includes("ski erg")) return true;
  if (/\b\d+m\s+(?:steady|easy|moderate|controlled)?\s*ski\b|\b\d+m\s*ski\b/.test(blob))
    return true;
  if (/\beasy\s+ski\b|\bsteady\s+ski\b|\bmoderate\s+ski\b|\bcontrolled\s+ski\b/.test(blob)) return true;
  if (/\b(row\s+or\s+ski|ski\s+or\s+row)\b/.test(blob)) return true;
  return false;
}

/** Strong soft penalty when notes explicitly disallow equipment the session insists on (never hard-filters pools). */
function explicitUnavailableModalityPenalty(s: SessionTemplate, blob: string, avoids: ModalityAvoids): number {
  let penalty = 0;

  if (avoids.sled) {
    const sledHit =
      s.equipment.includes("Sled") ||
      /\bsled\b|\bprowler\b|\bsled\s+(?:push|pull|drag)\b/.test(blob);
    if (sledHit) penalty -= 54;
  }

  if (avoids.rower) {
    const rowHit =
      s.equipment.includes("Rower") ||
      blobLooksRowDominant(blob) ||
      /500m\s*row\b|750m\s*row\b|1000m\s*row\b|2000m\s*row\b/.test(blob);
    if (rowHit) penalty -= 54;
  }

  if (avoids.ski) {
    const skiHit =
      s.equipment.includes("SkiErg") ||
      blobLooksSkiDominant(blob) ||
      /500m\s*ski\b|750m\s*ski\b|\bkm\s+ski\b/.test(blob);
    if (skiHit) penalty -= 54;
  }

  return penalty;
}

function pickWeightedSession(
  role: StructureRole,
  input: BlueprintInput,
  pickContext: SessionPickContext,
  parsedConstraints: ParsedConstraints,
  previousTag?: string,
  runProgression?: RunProgressionContext | null,
  runVolumePlan?: RunVolumePlan | null,
  blueprintInput?: BlueprintInput
): SessionTemplate {
  const equipment = defaultEquipment(input.equipment);

  let options = SESSION_LIBRARY.filter(
    (s) =>
      roleMatches(s, role) &&
      matchesLevel(s, input.ability_level) &&
      matchesGoal(s, input.goal_focus) &&
      matchesEquipment(s, equipment) &&
      matchesTime(s, input.weekly_hours_band)
  );

  if (options.length === 0) {
    options = SESSION_LIBRARY.filter(
      (s) =>
        roleMatches(s, role) &&
        matchesLevel(s, input.ability_level) &&
        matchesEquipment(s, equipment) &&
        matchesTime(s, input.weekly_hours_band)
    );
  }

  if (options.length === 0) {
    options = SESSION_LIBRARY.filter(
      (s) => roleMatches(s, role) && matchesLevel(s, input.ability_level) && matchesEquipment(s, equipment)
    );
  }

  if (options.length === 0) {
    options = SESSION_LIBRARY.filter((s) => roleMatches(s, role));
  }

  const optionsPool = sessionPoolWithDuplicateGuards(options, pickContext);
  const couldAvoidUsedId = options.some((s) => !pickContext.usedIds.has(s.id));
  const couldAvoidDupName = options.some(
    (s) => !pickContext.usedSessionNames.has(s.name.trim().toLowerCase())
  );

  const weeklyHoursBand = input.weekly_hours_band;

  const runner = classifyRunner(input.five_k_time);
  const isRunRole =
    role === "run_quality" ||
    role === "run_quality_beginner" ||
    role === "run_aerobic" ||
    role === "run_long";

  const HIGH_IMPACT_BLOB_HINT =
    /\bburpees?\b|\bjumping\b|\bjump\s+jack\b|\bjumps?\b|\blunges?\b|\blong\s+run\b|race\s*[- ]?\s*sim\b|\bcompromised\b/i;

  const beginnerHyroxContext =
    parsedConstraints.flags.includes("hyrox_beginner") || input.ability_level === "beginner";

  const newRunnerContext =
    parsedConstraints.flags.includes("new_runner") ||
    runner.label === "beginner" ||
    runner.label === "developing";

  const runningBaseBias =
    input.goal_focus === "running" &&
    (input.ability_level === "beginner" ||
      runner.label === "unknown" ||
      runner.label === "beginner" ||
      runner.label === "developing");

  const highRunVolume =
    Boolean(runVolumePlan?.highVolumeAdvanced) ||
    (runVolumePlan?.preferredRunSessionsPerWeek ?? 0) >= 4;

  const preferredTemplateId =
    runProgression && blueprintInput
      ? preferredTemplateIdForRunSlot(runProgression, blueprintInput)
      : null;

  const weighted = optionsPool.map((s) => {
    let weight = 1;
    const hasFlag = (flag: string) => parsedConstraints.flags.includes(flag);
    const blob = sessionText(s);
    const nameLc = s.name.trim().toLowerCase();

    if (!pickContext.usedIds.has(s.id)) weight += 2;
    if (previousTag && !s.avoid_after.includes(previousTag)) weight += 2;

    if (!couldAvoidUsedId && pickContext.usedIds.has(s.id)) weight -= 22;
    if (!couldAvoidDupName && pickContext.usedSessionNames.has(nameLc)) weight -= 18;

    if (runProgression) {
      if (preferredTemplateId && s.id === preferredTemplateId) weight += 48;
      if (isBannedRunPick(s, runProgression)) weight -= 120;
    }

    if (highRunVolume && s.category === "run" && isRunRole) weight += 6;
    if (runVolumePlan?.conservative && s.category === "run" && s.intensity === "high") weight -= 3;

    if (pickContext.usedVariationGroups.has(s.variation_group)) weight -= 5;

    if (input.goal_focus === "running") {
      if (s.category === "run") weight += 2;
      if (s.type === "strength_lower" && s.fatigue === "high") weight -= 1;
    }

    if (input.goal_focus === "muscle") {
      if (s.category === "strength") weight += 2;
      if (s.category === "run" && s.intensity === "high") weight -= 1;
    }

    if (input.goal_focus === "hybrid") {
      if (s.category === "hybrid") weight += 2;
      if (s.name.toLowerCase().includes("hyrox")) weight += 1;
    }

    if (input.hyrox_track?.active) {
      weight += hyroxSessionWeightDelta(
        input.hyrox_track,
        pickContext.weekNumber,
        s,
        role
      );
    } else if (input.goal_focus === "hybrid") {
      if (/\brace\s*sim\b|full race simulation/i.test(blob) && pickContext.weekNumber <= 3) {
        weight -= 6;
      }
    }

    if (input.ability_level === "beginner" && s.intensity === "high") weight -= 1;
    if (input.double_sessions && s.category === "aerobic") weight += 1;

    if (beginnerHyroxContext) {
      if (s.variation_group === "hybrid_intro") weight += 16;
      if (HYBRID_INTRO_PRIORITY_IDS.has(s.id)) weight += 16;
      else if (/beginner\s+hyrox|hyrox\s+intro|controlled\s+compromised|run-walk\s+hybrid/i.test(nameLc)) {
        weight += 10;
      }
      if (s.fatigue === "low") weight += 5;
      if (s.type === "aerobic_support" || s.variation_group === "aerobic_support") weight += 10;
      if (s.variation_group === "lower_durability" || s.variation_group === "movement_foundations") {
        weight += 12;
      }
    }

    if (newRunnerContext) {
      if (s.structure_roles.includes("run_quality_beginner")) weight += 11;
      if (s.variation_group === "run_walk_base") weight += 13;
      if (s.variation_group === "aerobic_run_short") weight += 11;
      if (s.type === "aerobic_support" || s.variation_group === "aerobic_support") weight += 8;
      if (s.category === "run" && s.type === "aerobic_run" && s.intensity === "low") weight += 7;
      if (
        isRunRole &&
        s.category === "run" &&
        s.variation_group === "tempo_beginner" &&
        s.intensity !== "high"
      ) {
        weight += 6;
      }
    }

    // Constraints are applied as conservative coaching bias only (no hard filtering).
    const needsLowImpact = hasFlag("injury_flags") || hasFlag("low_impact_preference");
    if (needsLowImpact) {
      const vg = s.variation_group;
      if (vg === "hybrid_low_impact") weight += 14;
      else if (vg === "lower_durability") weight += 12;
      else if (vg === "movement_foundations") weight += 12;
      else if (vg === "aerobic_support") weight += 9;

      if (LOW_IMPACT_PRIORITY_IDS.has(s.id)) weight += 14;
      else if (
        nameLc.includes("bike tempo build") ||
        nameLc.includes("row tempo build") ||
        nameLc.includes("ski tempo build") ||
        nameLc.includes("low-impact hybrid engine") ||
        nameLc.includes("carry + erg control") ||
        nameLc.includes("knee-friendly lower strength") ||
        nameLc.includes("lower isometric durability") ||
        nameLc.includes("low-impact run alternative") ||
        nameLc.includes("long low-impact bike base")
      ) {
        weight += 12;
      }

      const exemptHighImpactPenalty =
        vg === "hybrid_low_impact" || vg === "lower_durability";
      if (!exemptHighImpactPenalty && HIGH_IMPACT_BLOB_HINT.test(blob)) {
        weight -= 12;
      }

      if (s.type === "long_run") weight -= 7;
      if (s.category === "run" && s.intensity === "high") weight -= 4;
      if (s.type === "threshold_run") weight -= 4;
      if (s.type === "interval_run") weight -= 5;
      if (s.type === "tempo_run") {
        if (s.variation_group === "tempo_short") weight -= 2;
        else weight -= 5;
        if (s.duration >= 45 || s.fatigue === "medium" || s.fatigue === "high") weight -= 3;
      }

      if (s.type === "hybrid_compromised") weight -= 6;
      else if (s.variation_group === "hybrid_primary" && s.category === "hybrid") weight -= 3;

      if (s.category === "hybrid") {
        if (s.fatigue === "high") weight -= 3;
        else if (s.fatigue === "medium" && s.duration >= 50) weight -= 2;
      }

      if (
        /\brace\s*[- ]?\s*sim\b|\brace[- ]specific\b|race.?style|race.?like|\bhyrox\b|compromised run\b/i.test(
          blob
        )
      ) {
        weight -= 3;
      }

      // Bodyweight hybrid often still contains burpees + run tooling — avoid over-boosting for knees.
      if (s.type === "hybrid_bodyweight") {
        if (
          /\bburpees?\b|\bjumping\b|\bjump\s+jack\b|\d+\s*[-\u2013]\s*\d+m\s+run\b|\b\d+m\s+run\b/i.test(
            blob
          )
        ) {
          weight -= 4;
        } else {
          weight += 2;
        }
      }

      if (s.category === "run" && s.type === "aerobic_run") weight += 5;

      if (s.category === "aerobic" && s.intensity !== "high") weight += 3;
      if (s.type === "aerobic_support") weight += 3;

      const ergBackedSupport =
        s.type === "aerobic_support" &&
        (s.equipment.includes("Bike / Spin bike") ||
          s.equipment.includes("Rower") ||
          s.equipment.includes("SkiErg"));
      if (ergBackedSupport && s.category === "aerobic") weight += 3;

      if ((s.category === "hybrid" || s.category === "strength" || s.category === "run") && s.fatigue === "low") {
        weight += 2;
      }

      if (s.category === "recovery") weight += 1;
    }

    if (hasFlag("equipment_limits")) {
      if (s.time_requirement === "30-45") weight += 2;
      if (s.fatigue === "low") weight += 2;
      if (s.type === "hybrid_bodyweight") weight += 5;
      if (
        s.category === "strength" &&
        (s.variation_group === "full_body" ||
          s.variation_group === "movement_foundations" ||
          s.variation_group === "lower_durability")
      ) {
        weight += 3;
      }
      if (s.type === "aerobic_support" && s.duration <= 40) weight += 3;
      if (s.duration <= 45) weight += 2;
    }

    // Runner classification is a soft bias only (never a hard filter).
    if (isRunRole && runner.label !== "unknown" && s.category === "run") {
      switch (runner.label) {
        case "beginner": {
          if (s.type === "aerobic_run") weight += 2;
          if (s.type === "tempo_run" && s.intensity !== "high") weight += 1;
          if (s.type === "interval_run") weight -= 2;
          if (s.type === "threshold_run") weight -= 1;
          if (s.intensity === "high") weight -= 2;
          break;
        }
        case "developing": {
          if (s.type === "aerobic_run") weight += 2;
          if (s.type === "tempo_run") weight += 2;
          if (s.type === "threshold_run" && s.fatigue !== "high") weight += 1;
          if (s.type === "interval_run") weight -= 1;
          break;
        }
        case "intermediate": {
          if (s.type === "threshold_run") weight += 1;
          if (s.type === "tempo_run") weight += 1;
          if (role === "run_quality" && s.type === "interval_run") weight += 1;
          break;
        }
        case "advanced": {
          if (s.type === "threshold_run") weight += 2;
          if (s.type === "interval_run") weight += 2;
          if (s.type === "tempo_run") weight += 1;
          break;
        }
        case "high-performance": {
          if (s.type === "threshold_run") weight += 2;
          if (s.type === "interval_run") weight += 2;
          if (s.type === "tempo_run") weight += 1;
          if (role === "run_quality" && s.type === "aerobic_run") weight -= 1;
          break;
        }
        default:
          break;
      }
    }

    if (newRunnerContext && isRunRole && s.category === "run") {
      if (s.type === "threshold_run") weight -= 11;
      if (s.type === "interval_run") weight -= 11;
      if (s.type === "tempo_run") weight -= 8;
      if (
        s.type === "long_run" &&
        /\bpick(?:-|\s)?ups?\b|\bprogression\b|\btempo\b|\bnegative\s+split\b|\bsteady\s*\/?\s*slightly\s+quicker\b/i.test(
          blob
        )
      ) {
        weight -= 14;
      }
    }

    // Undo runner-profile pressure toward tempo / threshold runs when knees or impact tolerance are limited.
    if (needsLowImpact) {
      if (isRunRole && s.category === "run") {
        if (s.type === "tempo_run") weight -= 8;
        if (s.type === "threshold_run") weight -= 5;
        if (s.type === "interval_run") weight -= 8;
        if (s.type === "aerobic_run") weight += 4;
        if (s.type === "long_run") {
          if (s.intensity === "low") weight += 8;
          else weight -= 3;
        }
      }

      if (
        role === "run_quality" &&
        s.type === "aerobic_support" &&
        s.structure_roles.includes("run_quality") &&
        s.category === "aerobic"
      ) {
        weight += 10;
      }

      if (
        role === "run_long" &&
        s.type === "aerobic_support" &&
        s.structure_roles.includes("run_long") &&
        s.category === "aerobic"
      ) {
        weight += 8;
      }

    }

    weight += explicitUnavailableModalityPenalty(s, blob, parsedConstraints.modality_avoids);

    if (weeklyHoursBand === "2-3") {
      if (s.duration <= 35) weight += 14;
      else if (s.duration <= 45) weight += 9;
      if (s.time_requirement === "30-45") weight += 13;
      if (s.duration > 45 && s.duration < 60) weight -= 29;
      if (s.duration >= 60) weight -= 54;
      if (s.time_requirement === "45-75") weight -= 18;
      if (s.time_requirement === "75+") weight -= 62;
    }

    if (weeklyHoursBand === "3-5") {
      if (s.duration <= 45) weight += 7;
      if (s.duration >= 60) weight -= 14;
      if (s.time_requirement === "75+") weight -= 22;
    }

    const timeLimitedPick = hasFlag("time_limit");
    if (timeLimitedPick) {
      if (s.time_requirement === "30-45") weight += 13;
      if (s.duration <= 38) weight += 10;
      if (s.duration > 45 && s.duration < 60) weight -= 34;
      if (s.duration >= 60) weight -= 42;
      if (s.duration >= 75) weight -= 24;
      if (s.time_requirement === "45-75" && s.duration > 42) weight -= 12;
      if (s.time_requirement === "75+") weight -= 28;
      if (!(s.structure_roles.includes("run_aerobic") && input.goal_focus === "running")) {
        const looksLikeBikeZ2Finish =
          s.category === "aerobic" &&
          s.duration >= 48 &&
          (/\bz2\b|easy.?moderate.?bike|\bbike\b|\bspin\b|\bsteady\s+rhythm\b/i.test(blob) ||
            s.type === "aerobic_support");
        if (looksLikeBikeZ2Finish) weight -= 16;
      }
    }

    // --- Running goal: protect base / unknown runners; spread quality across the week ---
    if (input.goal_focus === "running") {
      if (runningBaseBias) {
        if (s.category === "run") {
          if (s.type === "interval_run") weight -= 26;
          if (s.type === "threshold_run" && !isBeginnerFriendlyRunQuality(s)) weight -= 24;
          if (s.type === "threshold_run" && isBeginnerFriendlyRunQuality(s)) weight += 6;
          if (s.intensity === "high") weight -= 14;
          if (s.type === "aerobic_run") weight += 12;
          if (s.variation_group === "run_walk_base") weight += 14;
          if (s.variation_group === "base_progression") weight += 12;
          if (s.variation_group === "aerobic_run_short") weight += 14;
          if (s.structure_roles.includes("run_quality_beginner")) weight += 10;
          if (s.fatigue === "low") weight += 8;
          if (s.type === "tempo_run" && s.intensity === "high") weight -= 12;
          if (s.type === "tempo_run" && isBeginnerFriendlyRunQuality(s)) weight += 6;
          if (s.type === "tempo_run" && !isBeginnerFriendlyRunQuality(s) && s.intensity !== "high") {
            weight -= 8;
          }
        }
        if (s.category === "strength") {
          if (s.variation_group === "lower_durability" || s.variation_group === "movement_foundations") {
            weight += 10;
          }
        }
      }

      if (isRunRole && s.category === "run") {
        if (
          isQualityRunSession(s) &&
          pickContext.runningQualityVariationGroups.has(s.variation_group)
        ) {
          weight -= 22;
        }

        if (pickContext.runningThresholdSessionCount >= 1 && s.type === "threshold_run") {
          weight -= 28;
        }
        if (pickContext.runningIntervalSessionCount >= 1 && s.type === "interval_run") {
          weight -= 28;
        }

        if (pickContext.runningQualitySessionCount >= 2 && isQualityRunSession(s)) {
          weight -= 36;
        }

        if (pickContext.runningQualitySessionCount >= 1) {
          if (s.type === "aerobic_run") weight += 9;
          if (s.type === "long_run" && s.intensity === "low") weight += 10;
          if (s.type === "aerobic_support") weight += 7;
          if (s.variation_group === "aerobic_run_short") weight += 8;
        }
      }

      if (s.category === "run") {
        if (role === "run_long") {
          if (s.type === "long_run") weight += 16;
          if (s.type === "aerobic_run") weight += 12;
          if (s.type === "threshold_run" || s.type === "interval_run") weight -= 34;
          if (
            pickContext.runningQualitySessionCount >= 1 &&
            (s.type === "threshold_run" || s.type === "interval_run")
          ) {
            weight -= 26;
          }
        }
        if (role === "run_aerobic") {
          if (s.type === "aerobic_run") weight += 14;
          if (s.type === "threshold_run" || s.type === "interval_run") weight -= 32;
        }
      }
    }

    return { item: s, weight: Math.max(MIN_SESSION_WEIGHT, weight) };
  });

  if (preferredTemplateId) {
    const forced = optionsPool.find((s) => s.id === preferredTemplateId);
    if (forced && (!runProgression || !isBannedRunPick(forced, runProgression))) {
      pickContext.usedIds.add(forced.id);
      pickContext.usedVariationGroups.add(forced.variation_group);
      pickContext.usedSessionNames.add(forced.name.trim().toLowerCase());
      return forced;
    }
  }

  let pick = weightedPick(weighted);
  if (runProgression && isBannedRunPick(pick, runProgression) && optionsPool.length > 1) {
    const fallback = optionsPool.filter((s) => !isBannedRunPick(s, runProgression));
    if (fallback.length > 0) {
      const fbWeighted = fallback.map((s) => {
        const existing = weighted.find((w) => w.item.id === s.id);
        return { item: s, weight: Math.max(MIN_SESSION_WEIGHT, existing?.weight ?? 1) };
      });
      pick = weightedPick(fbWeighted);
    }
  }
  pickContext.usedIds.add(pick.id);
  pickContext.usedVariationGroups.add(pick.variation_group);
  pickContext.usedSessionNames.add(pick.name.trim().toLowerCase());
  return pick;
}

function addVolumeOverlay(
  session: SessionTemplate,
  hours: WeeklyHoursBand,
  doubleSessions?: boolean,
  suppressOptionalExtras?: boolean
): SessionTemplate {
  const clone: SessionTemplate = JSON.parse(JSON.stringify(session));

  const extra: string[] = [];

  if (
    !suppressOptionalExtras &&
    (hours === "7-10" || hours === "10+") &&
    clone.category === "strength"
  ) {
    extra.push(
      hours === "10+"
        ? "Optional: 30–45 min Z2 bike after lifting"
        : "Optional: 20–30 min Z2 bike after lifting"
    );
  }

  if (!suppressOptionalExtras && doubleSessions && clone.category === "strength") {
    extra.push("Optional second session: 20–30 min easy Z2 bike");
  }

  if (!suppressOptionalExtras && (hours === "7-10" || hours === "10+") && clone.type === "long_run") {
    clone.prescription.notes = [
      ...(clone.prescription.notes || []),
      "If recovery is strong, extend the aerobic block slightly.",
    ];
  }

  if (extra.length) {
    clone.prescription.finish = [...(clone.prescription.finish || []), ...extra];
  }

  return clone;
}

function structureIntent(role: StructureRole, goal: GoalFocus) {
  const bias = mapGoalToBias(goal);

  const map: Record<StructureRole, string> = {
    lower_full: "Full lower-body coverage to build strength without gaps.",
    lower_primary: "Primary lower-body strength day.",
    upper_full: "Full upper-body coverage with push and pull balance.",
    upper_primary: "Upper-body strength and support.",
    full_body_strength: "Condensed full-body strength coverage.",
    run_quality:
      bias === "running"
        ? "Primary quality run to move your performance forward."
        : "Quality run to improve pace under fatigue.",
    run_quality_beginner: "Entry-level quality run that keeps structure without excess fatigue.",
    run_aerobic: "Aerobic support to build engine and recovery.",
    run_long: "Longer aerobic development to improve overall endurance.",
    hybrid_primary: "Primary Hybrid / Hyrox-specific session.",
    hybrid_density: "Hybrid density work to build fitness in a controlled way.",
    aerobic_support: "Low-cost aerobic support that fits around harder sessions.",
    recovery: "Recovery, reset and durability support.",
  };

  return map[role];
}

function purposeText(session: SessionTemplate) {
  return `Purpose: ${session.coaching.intent}`;
}

function cueText(session: SessionTemplate) {
  return `Execution focus: ${session.coaching.cue}`;
}

function rpeText(session: SessionTemplate) {
  return `Effort guide: ${session.coaching.rpe}`;
}

function structureReasonText(session: SessionTemplate, goal: GoalFocus) {
  if (session.category === "run" && goal === "running") {
    return "This run is included because improving your engine is one of the biggest drivers of progress for your current goal.";
  }

  if (session.category === "hybrid" && goal === "hybrid") {
    return "This session is included to improve how well you hold pace and output once fatigue starts building — a major Hybrid / Hyrox limiter.";
  }

  if (session.category === "strength" && goal === "muscle") {
    return "This strength session is included to make sure the week is still driving muscle and strength forward, not just burning calories.";
  }

  if (session.category === "strength") {
    return "This strength work supports performance by building positions, force output, and durability.";
  }

  if (session.category === "aerobic") {
    return "This session keeps aerobic volume in the week without creating too much extra fatigue.";
  }

  if (session.category === "recovery") {
    return "This day is here to improve recovery so the harder work actually lands.";
  }

  return "This session plays a specific role in balancing quality, recovery, and performance across the week.";
}

function buildIntro(
  input: BlueprintInput,
  structureLabel: string,
  runnerProfile: RunnerProfile,
  parsedConstraints: ParsedConstraints
) {
  const intro: string[] = [];
  intro.push(
    `This week prioritises ${formatGoal(input.goal_focus).toLowerCase()} across ${input.days_per_week} training days using the ${structureLabel.toLowerCase()} structure.`
  );

  intro.push(
    `The structure is built to ${getGoalReason(input.goal_focus)}, while still matching your current setup (${getEquipmentSummary(
      input.equipment
    )}).`
  );

  const hoursReason = getHoursReason(input.weekly_hours_band, input.double_sessions);
  if (hoursReason) {
    intro.push(hoursReason);
  } else {
    intro.push(`Weekly volume is matched to your ${getHoursText(input.weekly_hours_band)} availability.`);
  }

  intro.push(getLevelReason(input.ability_level));

  if (runnerProfile.seconds !== null) {
    intro.push(`Running guidance: ${runnerProfile.guidance}`);
  }

  if (parsedConstraints.has_constraints && parsedConstraints.summary.length > 0) {
    const hasPossibleLimitation =
      parsedConstraints.flags.includes("injury_flags") ||
      parsedConstraints.flags.includes("low_impact_preference");
    const caution = hasPossibleLimitation
      ? " You mentioned a possible limitation, so treat symptoms seriously and keep the work controlled."
      : "";
    intro.push(`You mentioned constraints, so keep these in mind: ${parsedConstraints.summary.join(" ")}${caution}`);
  }

  intro.push(
    "Execute this week by controlling easy work, hitting quality sessions with intent, and respecting recovery between hard days."
  );

  return intro;
}

function recoveryDay(day: DayKey, timeCapMinutes = 35): DayPlan {
  return {
    template_id: "FILLER-RECOVERY",
    day,
    title: "Recovery / Mobility",
    intent: "Low-stress recovery support.",
    session: {
      main: ["20–30 min easy walk or bike", "10–15 min mobility"],
      notes: ["Keep this genuinely easy — the goal is to recover well."],
    },
    time_cap_minutes: timeCapMinutes,
    tags: ["recovery"],
    priority: createFillerPriority("recovery"),
  };
}

function lightAerobicDay(day: DayKey, input: BlueprintInput, timeCapMinutes = 45): DayPlan {
  const advanced = input.ability_level === "advanced";
  const duration = advanced ? "30–60 min easy Z2 bike or easy jog" : "20–40 min easy Z2 bike or jog";
  return {
    template_id: "FILLER-AEROBIC",
    day,
    title: "Aerobic Support",
    intent: "Low-cost aerobic support to keep the week balanced.",
    session: {
      main: [duration, "Optional: lower leg durability 2 rounds"],
      notes: [
        "RPE 2–4/10 — conversational, nose-breathe.",
        "Should improve recovery between hard sessions, not add fatigue.",
        ...(input.hyrox_track?.active && advanced
          ? [
              "Bike Z2 can replace or support easy run volume if legs feel heavy — keep it genuinely easy.",
            ]
          : []),
      ],
    },
    time_cap_minutes: timeCapMinutes,
    tags: ["aerobic_support", "aerobic", "bike_z2_support"],
    priority: createFillerPriority("aerobic_support"),
  };
}

function parsePreferredDayLabel(raw: string): DayKey | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;

  const labels: Record<string, DayKey> = {
    mon: "Mon",
    monday: "Mon",
    tue: "Tue",
    tuesday: "Tue",
    wed: "Wed",
    wednesday: "Wed",
    thu: "Thu",
    thursday: "Thu",
    fri: "Fri",
    friday: "Fri",
    sat: "Sat",
    saturday: "Sat",
    sun: "Sun",
    sunday: "Sun",
  };

  return labels[key] ?? null;
}

function getPreferredDayOrder(preferred?: string[]): DayKey[] {
  const allDays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (!preferred || preferred.length === 0) {
    return [...allDays];
  }

  const seen = new Set<DayKey>();
  const preferredMapped: DayKey[] = [];

  for (const raw of preferred) {
    const day = parsePreferredDayLabel(raw);
    if (day && !seen.has(day)) {
      seen.add(day);
      preferredMapped.push(day);
    }
  }

  const remaining = allDays.filter((d) => !seen.has(d));

  return [...preferredMapped, ...remaining];
}

function buildActivePlanDays(
  input: BlueprintInput,
  parsedConstraints: ParsedConstraints,
  paceGuidance: PaceGuidance | null,
  options?: BuildWeekBlueprintOptions
) {
  const runPlan = options?.run_volume_plan ?? null;

  const baseStructure = runPlan
    ? pickStructureWithRunVolume(input, runPlan)
    : pickWeeklyStructure({
        days_per_week: input.days_per_week,
        goal_focus: input.goal_focus,
        ability_level: input.ability_level,
        double_sessions: input.double_sessions,
        weekly_hours_band: input.weekly_hours_band,
        hyrox_track: input.hyrox_track,
      });

  const structure = {
    ...baseStructure,
    roles: runPlan
      ? applyRunVolumeToStructureRoles(baseStructure.roles, runPlan, input)
      : baseStructure.roles,
  };

  const weekNumber = options?.week_number ?? 1;
  const weekFocus = options?.progression_target?.week_focus ?? null;

  const pickContext: SessionPickContext = {
    usedIds: new Set<string>(),
    usedVariationGroups: new Set<string>(),
    usedSessionNames: new Set<string>(),
    runningQualitySessionCount: 0,
    runningThresholdSessionCount: 0,
    runningIntervalSessionCount: 0,
    runningQualityVariationGroups: new Set<string>(),
    weekNumber,
    weekFocus,
  };
  const activeDays: DayPlan[] = [];
  const assignedDays = new Set<DayKey>();

  let previousFatigueTag = "";
  let runQualityPickIndex = 0;
  const sameWeekRunSnapshots: WeekRunSnapshot[] = [];

  const dayOrder = getPreferredDayOrder(input.preferred_days);

  const stressByDay = new Map<DayKey, SessionStressInput>();
  const dayRoleByAssignedDay = new Map<DayKey, StructureRole>();

  const suppressStrengthRunExtras =
    parsedConstraints.flags.includes("time_limit") || input.weekly_hours_band === "2-3";

  const roleAssignPriority = (role: StructureRole): number => {
    const order: StructureRole[] = [
      "run_long",
      "run_quality",
      "run_quality_beginner",
      "hybrid_primary",
      "hybrid_density",
      "run_aerobic",
      "upper_primary",
      "upper_full",
      "lower_primary",
      "lower_full",
      "full_body_strength",
      "aerobic_support",
      "recovery",
    ];
    const i = order.indexOf(role);
    return i >= 0 ? i : 50;
  };

  const rolesInRhythmOrder = [...structure.roles].sort(
    (a, b) => roleAssignPriority(a) - roleAssignPriority(b)
  );

  rolesInRhythmOrder.forEach((role, idx) => {
    const runSlot = runSlotForRole(role, runQualityPickIndex);
    if (role === "run_quality" || role === "run_quality_beginner") {
      runQualityPickIndex += 1;
    }

    let assignedDay = pickDayForRole({
      role,
      fallbackDay: dayOrder[idx]!,
      assignedDays,
      parsedConstraints,
      input,
      isRunSession:
        role === "run_quality" ||
        role === "run_quality_beginner" ||
        role === "run_long" ||
        role === "run_aerobic",
    });

    let runProgression: RunProgressionContext | null = null;
    if (runSlot) {
      runProgression = {
        slot: runSlot,
        weekNumber,
        weekFocus,
        abilityLevel: input.ability_level,
        assignedDay,
        lowImpact:
          Boolean(input.has_injury) ||
          parsedConstraints.flags.includes("injury_flags") ||
          parsedConstraints.flags.includes("low_impact_preference"),
        previousWeekSnapshots: options?.previous_week_run_snapshots,
        sameWeekSnapshots: sameWeekRunSnapshots,
      };
    }

    let picked = addVolumeOverlay(
      pickWeightedSession(
        role,
        input,
        pickContext,
        parsedConstraints,
        previousFatigueTag,
        runProgression,
        runPlan,
        input
      ),
      input.weekly_hours_band,
      input.double_sessions,
      suppressStrengthRunExtras
    );

    let appliedProgression: AppliedProgression | null = null;
    if (runSlot && runProgression) {
      const progressed = applyRunProgressionPrescription(picked, runProgression, input);
      picked = progressed.session;
      appliedProgression = progressed.applied;
    } else {
      const strengthFamily = resolveStrengthFamilyForRole(role, input, {
        hyrox: input.hyrox_track,
        weekNumber,
        weekFocus,
      });
      if (
        strengthFamily &&
        (picked.category === "strength" || picked.category === "hybrid")
      ) {
        appliedProgression = applyProgressionFamily(strengthFamily, weekNumber, weekFocus);
        picked = {
          ...picked,
          name: appliedProgression.variant.title,
          prescription: {
            ...picked.prescription,
            notes: [
              ...(picked.prescription.notes ?? []),
              ...appliedProgression.variant.main.map((line) => `Progression: ${line}`),
              appliedProgression.variant.coach_snippet,
            ],
          },
        };
      }
    }

    if (runSlot) {
      sameWeekRunSnapshots.push({
        slot: runSlot,
        sessionId: picked.id,
        sessionName: picked.name,
        fingerprint: `${picked.name.trim().toLowerCase()}::${(picked.prescription.main ?? []).join("|")}`,
        day: assignedDay,
      });
    }

    if (input.goal_focus === "running" || (runPlan?.preferredRunSessionsPerWeek ?? 0) >= 4) {
      registerRunningQualityPick(pickContext, picked);
    }

    previousFatigueTag =
      picked.type === "strength_lower" && picked.fatigue === "high"
        ? "lower_high_fatigue"
        : picked.type === "hybrid_compromised" && picked.fatigue === "high"
        ? "hybrid_high_fatigue"
        : picked.type;

    // Conservative day-placement preference: avoid blocked run days where possible, but never drop sessions.
    if (picked.category === "run" && parsedConstraints.no_running_days.includes(assignedDay)) {
      const fallbackDay = dayOrder.find(
        (day) => !parsedConstraints.no_running_days.includes(day) && !assignedDays.has(day)
      );
      if (fallbackDay) assignedDay = fallbackDay;
    }

    assignedDays.add(assignedDay);
    dayRoleByAssignedDay.set(assignedDay, role);

    const { dayPlan, stress } = buildDayPlanAndStressFromTemplate({
      picked,
      assignedDay,
      role,
      input,
      parsedConstraints,
      paceGuidance,
      appliedProgression,
    });

    stressByDay.set(assignedDay, stress);
    activeDays.push(dayPlan);
  });

  return { structure, activeDays, stressByDay, dayRoleByAssignedDay };
}

function fillSevenDayWeek(
  activeDays: DayPlan[],
  stressByDay: Map<DayKey, SessionStressInput>,
  input: BlueprintInput,
  opts?: { compressOffSessions?: boolean }
) {
  const result: DayPlan[] = [];
  const orderedStressInputs: SessionStressInput[] = [];
  const baseDays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const recoveryMinutes = opts?.compressOffSessions ? 22 : 35;
  const aerobicSupportMinutes = opts?.compressOffSessions ? 26 : 40;
  const aerobicSupportStressDur = opts?.compressOffSessions ? 26 : 35;

  for (let i = 0; i < 7; i++) {
    const dayKey = baseDays[i];
    const existing = activeDays.find((d) => d.day === dayKey);
    if (existing) {
      result.push(existing);
      const stress = stressByDay.get(dayKey);
      if (!stress) {
        throw new Error(`stressBudget: missing stress input for ${dayKey}`);
      }
      orderedStressInputs.push(stress);
      continue;
    }

    if (dayKey === "Thu" || dayKey === "Sat") {
      result.push(lightAerobicDay(dayKey, input, aerobicSupportMinutes));
      orderedStressInputs.push({
        day: dayKey,
        title: "Aerobic Support",
        category: "aerobic",
        type: "aerobic_support",
        intensity: "low",
        fatigue: "low",
        duration: aerobicSupportStressDur,
      });
    } else {
      result.push(recoveryDay(dayKey, recoveryMinutes));
      orderedStressInputs.push({
        day: dayKey,
        title: "Recovery / Mobility",
        category: "recovery",
        type: "recovery",
        intensity: "low",
        fatigue: "low",
        duration: recoveryMinutes,
      });
    }
  }

  return { schedule: result, orderedStressInputs };
}

const LOW_IMPACT_REVIEW_RE =
  /burpees?|lunges?|\brun(?:ning)?\b|compromised|race[-\s]specific|\bsled\b/i;

function dedupeOrderedStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function concatDayPlanInspectableText(day: DayPlan): string {
  const s = day.session;
  const parts: string[] = [
    day.title,
    ...(day.tags ?? []),
    ...(s.main ?? []),
    ...(s.finish ?? []),
    ...(s.notes ?? []),
  ];
  return parts.join("\u0000").toLowerCase();
}

function isClearlyLowImpactAerobicOrRecovery(day: DayPlan): boolean {
  if (day.template_id === "FILLER-RECOVERY" || day.template_id === "FILLER-AEROBIC") {
    return true;
  }
  if (day.title === "Recovery / Mobility" || day.title === "Aerobic Support") {
    return true;
  }
  const tags = day.tags ?? [];
  const t0 = tags[0];
  const t1 = tags[1];
  if (t0 === "recovery" || tags.includes("recovery") || t1 === "recovery") {
    return true;
  }
  if (t0 === "aerobic_support") {
    return true;
  }
  if (t1 === "aerobic") {
    return true;
  }
  return false;
}

export function buildSafetyFlags({
  input,
  parsedConstraints,
  weeklyStress,
  schedule,
}: {
  input: BlueprintInput;
  parsedConstraints: ParsedConstraints;
  weeklyStress: WeeklyStressSummary;
  schedule: DayPlan[];
}): PlanSafetyFlags {
  const flags: string[] = [];
  const notes: string[] = [];
  let level: PlanSafetyFlags["level"] = "none";

  const bumpCaution = (flag: string, note: string) => {
    flags.push(flag);
    notes.push(note);
    if (level === "none") level = "caution";
  };

  const bumpHigh = (flag: string, note: string) => {
    flags.push(flag);
    notes.push(note);
    level = "high";
  };

  if (input.weekly_hours_band === "2-3" && weeklyStress.estimated_hours > 3.5) {
    bumpCaution(
      "above_selected_time_band",
      "This week is slightly above your selected time window. Prioritise Priority 1 sessions and trim optional support work first."
    );
  }

  if (parsedConstraints.flags.includes("time_limit") && weeklyStress.estimated_hours > 3.5) {
    bumpCaution(
      "time_limited_week",
      "Because you mentioned limited time, treat support sessions as flexible and keep the main work time-capped."
    );
  }

  if (input.ability_level === "beginner" && weeklyStress.relative_load > 1.15) {
    bumpCaution(
      "beginner_high_relative_load",
      "This is a higher-load week for a beginner. Keep easy work easy and reduce Priority 3 sessions if recovery feels poor."
    );
  }

  if (parsedConstraints.flags.includes("injury_flags") || parsedConstraints.flags.includes("low_impact_preference")) {
    for (const day of schedule) {
      if (isClearlyLowImpactAerobicOrRecovery(day)) continue;
      const haystack = concatDayPlanInspectableText(day);
      if (LOW_IMPACT_REVIEW_RE.test(haystack)) {
        bumpCaution(
          "low_impact_review_needed",
          "You mentioned impact or injury concerns. Keep any running, lunges or burpees controlled, and swap to bike/row/ski if symptoms appear."
        );
        break;
      }
    }
  }

  if (weeklyStress.relative_load > 1.25) {
    bumpHigh(
      "very_high_relative_load",
      "This week is high relative to your inputs. Do not chase optional volume; protect recovery and prioritise the key sessions."
    );
  }

  return {
    level,
    flags: dedupeOrderedStrings(flags),
    notes: dedupeOrderedStrings(notes),
  };
}

export function buildWeekBlueprint(
  input: BlueprintInput,
  options?: BuildWeekBlueprintOptions
): PlanJson {
  const runnerProfile = classifyRunner(input.five_k_time);
  const paceGuidance =
    runnerProfile.seconds !== null
      ? computePaceGuidanceFromFiveKSeconds(runnerProfile.seconds)
      : null;
  const parsedConstraints = parseConstraints(input.notes);
  const compressOffSessions =
    parsedConstraints.flags.includes("time_limit") || input.weekly_hours_band === "2-3";

  const { structure, activeDays, stressByDay, dayRoleByAssignedDay } = buildActivePlanDays(
    input,
    parsedConstraints,
    paceGuidance,
    options
  );
  let { schedule, orderedStressInputs } = fillSevenDayWeek(activeDays, stressByDay, input, {
    compressOffSessions,
  });

  schedule = balanceScheduleHardEasy(schedule, dayRoleByAssignedDay);
  orderedStressInputs = schedule.map((d) => {
    const role = dayRoleByAssignedDay.get(d.day);
    const classified = classifyDayPlan(d, role);
    return stressInputFromClassification(
      {
        day: d.day,
        title: d.title,
        category: (d.tags?.[1] as import("./sessionLibrary").SessionCategory) ?? "aerobic",
        type: d.tags?.[0] ?? "aerobic_support",
        intensity: "medium",
        fatigue: "medium",
        duration: d.time_cap_minutes ?? 30,
      },
      classified
    );
  });

  const rhythm = analyzeWeeklyRhythm(schedule, dayRoleByAssignedDay);
  appendRhythmCoachingNotes(schedule, rhythm);

  if (
    shouldAddErgThresholdSupport(
      input,
      options?.week_number ?? 1,
      options?.progression_target?.week_focus
    ) &&
    hasRunThresholdAnchor(schedule)
  ) {
    const anchorDay = schedule.find(
      (d) =>
        d.progression_family === "threshold_volume_a" ||
        d.progression_family === "threshold_volume_beginner_a"
    );
    if (anchorDay?.session.notes && !anchorDay.session.notes.some((n) => n.includes("remains the anchor"))) {
      anchorDay.session.notes.push(ERG_ENGINE_COACHING_NOTE);
    }
  }

  let plannedMinutes = schedule.reduce((sum, day) => {
    if (typeof day.time_cap_minutes !== "number") return sum;
    return sum + day.time_cap_minutes;
  }, 0);
  const weeklyStressBaseline = computeWeeklyStress(
    orderedStressInputs,
    input.weekly_hours_band,
    input.ability_level,
    plannedMinutes
  );

  applyNarrowAutoSoftening({
    input,
    parsedConstraints,
    paceGuidance,
    schedule,
    orderedStressInputs,
    dayRoleByAssignedDay,
    weeklyStressBaseline,
    compressOffSessions,
  });

  plannedMinutes = schedule.reduce((sum, day) => {
    if (typeof day.time_cap_minutes !== "number") return sum;
    return sum + day.time_cap_minutes;
  }, 0);
  const weekly_stress = computeWeeklyStress(
    orderedStressInputs,
    input.weekly_hours_band,
    input.ability_level,
    plannedMinutes
  );
  const safety_flags = buildSafetyFlags({
    input,
    parsedConstraints,
    weeklyStress: weekly_stress,
    schedule,
  });
  const weekly_stress_with_safety =
    safety_flags.notes.length > 0
      ? {
          ...weekly_stress,
          notes: dedupeOrderedStrings([...weekly_stress.notes, ...safety_flags.notes]),
        }
      : weekly_stress;
  const requestedProgramType = options?.program_type ?? "free_week";
  const weekContext =
    requestedProgramType === "community_12_week"
      ? options?.progression_target ??
        getProgressionTarget(
          "community_12_week",
          options?.block_number ?? null,
          options?.week_number ?? null,
          input.goal_focus
        ) ??
        getProgressionTarget("free_week", null, null, input.goal_focus)
      : getProgressionTarget("free_week", null, null, input.goal_focus);
  const stressAlignment = getStressAlignment(weekly_stress.relative_load, weekContext);

  return {
    intensity_split: intensitySplit(input.ability_level),
    weekly_stress: weekly_stress_with_safety,
    week_context: weekContext,
    stress_alignment: stressAlignment,
    safety_flags,
    profile: {
      goal: formatGoal(input.goal_focus),
      training_days: `${input.days_per_week} / week`,
      priority: formatPriority(input.goal_focus),
      level: input.ability_level.charAt(0).toUpperCase() + input.ability_level.slice(1),
      weekly_hours: input.weekly_hours_band,
      equipment: (input.equipment || ["Full gym"]).join(", "),
      runner_profile: runnerProfile,
      parsed_constraints: parsedConstraints,
      ...(paceGuidance ? { pace_guidance: paceGuidance } : {}),
    },
    intro: buildIntro(input, structure.label, runnerProfile, parsedConstraints),
    schedule,
    structure_roles_by_day: Object.fromEntries(dayRoleByAssignedDay) as Partial<
      Record<import("./sessionLibrary").DayKey, import("./sessionLibrary").StructureRole>
    >,
    cta: {
  headline: "What happens next?",
  body: "This week is built using Hybrid365 principles. If you want to understand how to get the most from it — and how we build real progression — start here.",
  button_url: "https://www.levelete.com/hybridtrainingmastery",
},
  } as PlanJson;
}
