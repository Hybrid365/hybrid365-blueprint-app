// app/lib/buildWeekBlueprint.ts

import { weightedPick } from "./weightedPick";
import {
  AbilityLevel,
  DayKey,
  DayPlan,
  GoalFocus,
  PlanJson,
  SESSION_LIBRARY,
  SessionTemplate,
  StructureRole,
  UserEquipment,
  WeeklyHoursBand,
} from "./sessionLibrary";
import { mapGoalToBias, pickWeeklyStructure } from "./weeklyStructures";
import { classifyRunner, type RunnerProfile } from "./classifyRunner";
import { parseConstraints, type ParsedConstraints } from "./parseConstraints";
import { computePaceGuidanceFromFiveKSeconds, runSessionPaceNote, type PaceGuidance } from "./paceGuidance";
import { computeWeeklyStress, type SessionStressInput } from "./stressBudget";
import { getProgressionTarget, getStressAlignment } from "./progressionTargets";
import { computeSessionPriority, createFillerPriority } from "./sessionPriority";
import { buildSubstitutionNotes } from "./substitutionGuidance";

export type BlueprintInput = {
  first_name?: string;
  days_per_week: number;
  weekly_hours_band: WeeklyHoursBand;
  goal_focus: GoalFocus;
  ability_level: AbilityLevel;
  double_sessions?: boolean;
  preferred_days?: string[];
  equipment?: string[];
  five_k_time?: string;
  notes?: string;
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

const MIN_SESSION_WEIGHT = 0.1;

/** Lowercased text from session fields for lightweight keyword checks (equipment notes, substitution weighting). */
function sessionText(session: SessionTemplate): string {
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

/** Mild penalty when athlete notes disallow a modality the session stresses. Uses raw constraint text only. */
function equipmentModalityMismatchPenalty(rawNorm: string, blob: string): number {
  let penalty = 0;

  const mentionsNoRower =
    /\bno\s+rower\b|\bno\s+rowing\s+machine\b|\bno\s+access\s+to\s+(?:the\s+|a\s+)?rower\b|\bdo\s+not\s+have\s+(?:a\s+)?rower\b|don[''\u2019]t\s+have\s+(?:a\s+)?rower\b/i.test(
      rawNorm
    );
  if (mentionsNoRower) {
    const rowInSession =
      /\brower\b|\browing\b|\d+\s*m\s*row\b|row-based|row aerobic|row interval|easy row|steady row|moderate row|row,|row\./i.test(
        blob
      );
    if (rowInSession) penalty -= 3;
  }

  const mentionsNoSki =
    /\bno\s+skierg\b|\bno\s+ski\s+erg\b|\bdo\s+not\s+have\s+(?:a\s+)?(?:skierg|ski\s+erg)\b|don[''\u2019]t\s+have\s+(?:a\s+)?(?:skierg|ski\s+erg)\b|\bno\s+ski\b/i.test(
      rawNorm
    );
  if (mentionsNoSki) {
    const skiInSession =
      /\bskierg\b|\bski\s+erg\b|\bski intervals\b|\d+\s*m\s*ski\b|\bkm\s+ski\b|ski or row|row or ski|ski,|ski\./i.test(
        blob
      );
    if (skiInSession) penalty -= 3;
  }

  const mentionsNoSled =
    /\bno\s+sled\b|\bdo\s+not\s+have\s+(?:a\s+)?sled\b|don[''\u2019]t\s+have\s+(?:a\s+)?sled\b/i.test(rawNorm);
  if (mentionsNoSled && /\bsled\b|\bprowler\b/i.test(blob)) {
    penalty -= 3;
  }

  return penalty;
}

function pickWeightedSession(
  role: StructureRole,
  input: BlueprintInput,
  usedIds: Set<string>,
  parsedConstraints: ParsedConstraints,
  previousTag?: string
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

  const rawNotesNorm = parsedConstraints.raw.trim().toLowerCase().replace(/\s+/g, " ");

  const runner = classifyRunner(input.five_k_time);
  const isRunRole =
    role === "run_quality" ||
    role === "run_quality_beginner" ||
    role === "run_aerobic" ||
    role === "run_long";

  const weighted = options.map((s) => {
    let weight = 1;
    const hasFlag = (flag: string) => parsedConstraints.flags.includes(flag);
    const blob = sessionText(s);

    if (!usedIds.has(s.id)) weight += 2;
    if (previousTag && !s.avoid_after.includes(previousTag)) weight += 2;

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

    if (input.ability_level === "beginner" && s.intensity === "high") weight -= 1;
    if (input.double_sessions && s.category === "aerobic") weight += 1;

    // Constraints are applied as conservative coaching bias only (no hard filtering).
    const needsLowImpact = hasFlag("injury_flags") || hasFlag("low_impact_preference");
    if (needsLowImpact) {
      if (s.type === "long_run") weight -= 7;
      if (s.category === "run" && s.intensity === "high") weight -= 4;
      if (s.type === "threshold_run") weight -= 3;
      if (s.type === "interval_run") weight -= 4;
      if (s.type === "tempo_run" && s.intensity === "high") weight -= 2;

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

      if (s.variation_group === "hybrid_low_impact") weight += 6;
      if (s.type === "hybrid_bodyweight") weight += 5;

      if (s.category === "run" && s.type === "aerobic_run") weight += 4;

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

      if (
        s.category === "strength" &&
        (s.variation_group === "movement_foundations" || s.variation_group === "lower_durability")
      ) {
        weight += 4;
      }

      if (s.category === "recovery") weight += 1;
    }

    if (hasFlag("time_limit")) {
      if (s.time_requirement === "30-45") weight += 6;
      if (s.duration <= 45) weight += 4;
      if (s.duration > 45 && s.duration <= 60) weight -= 3;
      if (s.duration > 60) weight -= 6;
      if (s.time_requirement === "75+") weight -= 8;
    }

    if (hasFlag("equipment_limits")) {
      weight += equipmentModalityMismatchPenalty(rawNotesNorm, blob);
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

    return { item: s, weight: Math.max(MIN_SESSION_WEIGHT, weight) };
  });

  const pick = weightedPick(weighted);
  usedIds.add(pick.id);
  return pick;
}

function addVolumeOverlay(
  session: SessionTemplate,
  hours: WeeklyHoursBand,
  doubleSessions?: boolean,
  timeLimited?: boolean
): SessionTemplate {
  const clone: SessionTemplate = JSON.parse(JSON.stringify(session));

  const extra: string[] = [];

  if (
    !timeLimited &&
    (hours === "7-10" || hours === "10+") &&
    clone.category === "strength"
  ) {
    extra.push(
      hours === "10+"
        ? "Optional: 30–45 min Z2 bike after lifting"
        : "Optional: 20–30 min Z2 bike after lifting"
    );
  }

  if (!timeLimited && doubleSessions && clone.category === "strength") {
    extra.push("Optional second session: 20–30 min easy Z2 bike");
  }

  if (!timeLimited && (hours === "7-10" || hours === "10+") && clone.type === "long_run") {
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

function recoveryDay(day: DayKey): DayPlan {
  return {
    day,
    title: "Recovery / Mobility",
    intent: "Low-stress recovery support.",
    session: {
      main: ["20–30 min easy walk or bike", "10–15 min mobility"],
      notes: ["Keep this genuinely easy — the goal is to recover well."],
    },
    time_cap_minutes: 35,
    tags: ["recovery"],
    priority: createFillerPriority("recovery"),
  };
}

function lightAerobicDay(day: DayKey): DayPlan {
  return {
    day,
    title: "Aerobic Support",
    intent: "Low-cost aerobic support to keep the week balanced.",
    session: {
      main: ["20–40 min easy Z2 bike or jog", "Optional: lower leg durability 2 rounds"],
      notes: ["Stay controlled and conversational throughout."],
    },
    time_cap_minutes: 40,
    tags: ["aerobic_support"],
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
  paceGuidance: PaceGuidance | null
) {
  const structure = pickWeeklyStructure({
    days_per_week: input.days_per_week,
    goal_focus: input.goal_focus,
    ability_level: input.ability_level,
    double_sessions: input.double_sessions,
    weekly_hours_band: input.weekly_hours_band,
  });

  const usedIds = new Set<string>();
  const activeDays: DayPlan[] = [];
  const assignedDays = new Set<DayKey>();

  let previousFatigueTag = "";

  const dayOrder = getPreferredDayOrder(input.preferred_days);

  const stressByDay = new Map<DayKey, SessionStressInput>();

  structure.roles.forEach((role, idx) => {
    const picked = addVolumeOverlay(
      pickWeightedSession(role, input, usedIds, parsedConstraints, previousFatigueTag),
      input.weekly_hours_band,
      input.double_sessions,
      parsedConstraints.flags.includes("time_limit")
    );

    previousFatigueTag =
      picked.type === "strength_lower" && picked.fatigue === "high"
        ? "lower_high_fatigue"
        : picked.type === "hybrid_compromised" && picked.fatigue === "high"
        ? "hybrid_high_fatigue"
        : picked.type;

    let assignedDay = dayOrder[idx];

    // Conservative day-placement preference: avoid blocked run days where possible, but never drop sessions.
    if (picked.category === "run" && parsedConstraints.no_running_days.includes(assignedDay)) {
      const fallbackDay = dayOrder.find(
        (day) => !parsedConstraints.no_running_days.includes(day) && !assignedDays.has(day)
      );
      if (fallbackDay) assignedDay = fallbackDay;
    }

    assignedDays.add(assignedDay);

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

    const sessionNotes = [
      ...coachingPrefix,
      ...(paceNote ? [paceNote] : []),
      ...substitutionNotes,
      ...libraryNotes,
    ].filter((line) => typeof line === "string" && line.trim().length > 0);

    stressByDay.set(assignedDay, {
      day: assignedDay,
      title: picked.name,
      category: picked.category,
      type: picked.type,
      intensity: picked.intensity,
      fatigue: picked.fatigue,
      duration: picked.duration,
    });

    activeDays.push({
      day: assignedDay,
      title: picked.name,
      intent: structureIntent(role, input.goal_focus),
      session: {
        warm_up: picked.prescription.warm_up,
        main: picked.prescription.main,
        cool_down: picked.prescription.cool_down,
        finish: picked.prescription.finish,
        notes: sessionNotes,
      },
      time_cap_minutes: picked.duration,
      tags: [picked.type, picked.category, picked.variation_group],
      priority: computeSessionPriority({
        goalFocus: input.goal_focus,
        role,
        session: picked,
      }),
    });
  });

  return { structure, activeDays, stressByDay };
}

function fillSevenDayWeek(activeDays: DayPlan[], stressByDay: Map<DayKey, SessionStressInput>) {
  const result: DayPlan[] = [];
  const orderedStressInputs: SessionStressInput[] = [];
  const baseDays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      result.push(lightAerobicDay(dayKey));
      orderedStressInputs.push({
        day: dayKey,
        title: "Aerobic Support",
        category: "aerobic",
        type: "aerobic_support",
        intensity: "low",
        fatigue: "low",
        duration: 35,
      });
    } else {
      result.push(recoveryDay(dayKey));
      orderedStressInputs.push({
        day: dayKey,
        title: "Recovery / Mobility",
        category: "recovery",
        type: "recovery",
        intensity: "low",
        fatigue: "low",
        duration: 30,
      });
    }
  }

  return { schedule: result, orderedStressInputs };
}

export function buildWeekBlueprint(input: BlueprintInput): PlanJson {
  const runnerProfile = classifyRunner(input.five_k_time);
  const paceGuidance =
    runnerProfile.seconds !== null
      ? computePaceGuidanceFromFiveKSeconds(runnerProfile.seconds)
      : null;
  const parsedConstraints = parseConstraints(input.notes);
  const { structure, activeDays, stressByDay } = buildActivePlanDays(input, parsedConstraints, paceGuidance);
  const { schedule, orderedStressInputs } = fillSevenDayWeek(activeDays, stressByDay);
  const plannedMinutes = schedule.reduce((sum, day) => {
    if (typeof day.time_cap_minutes !== "number") return sum;
    return sum + day.time_cap_minutes;
  }, 0);
  const weekly_stress = computeWeeklyStress(
    orderedStressInputs,
    input.weekly_hours_band,
    input.ability_level,
    plannedMinutes
  );
  const weekContext = getProgressionTarget("free_week", null, null, input.goal_focus);
  const stressAlignment = getStressAlignment(weekly_stress.relative_load, weekContext);

  return {
    intensity_split: intensitySplit(input.ability_level),
    weekly_stress,
    week_context: weekContext,
    stress_alignment: stressAlignment,
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
    cta: {
  headline: "What happens next?",
  body: "This week is built using Hybrid365 principles. If you want to understand how to get the most from it — and how we build real progression — start here.",
  button_url: "https://www.levelete.com/hybridtrainingmastery",
},
  } as PlanJson;
}
