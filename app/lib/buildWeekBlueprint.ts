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

function pickWeightedSession(
  role: StructureRole,
  input: BlueprintInput,
  usedIds: Set<string>,
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

  const weighted = options.map((s) => {
    let weight = 1;

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

    return { item: s, weight: Math.max(1, weight) };
  });

  const pick = weightedPick(weighted);
  usedIds.add(pick.id);
  return pick;
}

function addVolumeOverlay(session: SessionTemplate, hours: WeeklyHoursBand, doubleSessions?: boolean): SessionTemplate {
  const clone: SessionTemplate = JSON.parse(JSON.stringify(session));

  const extra: string[] = [];

  if ((hours === "7-10" || hours === "10+") && clone.category === "strength") {
    extra.push(
      hours === "10+"
        ? "Optional: 30–45 min Z2 bike after lifting"
        : "Optional: 20–30 min Z2 bike after lifting"
    );
  }

  if (doubleSessions && clone.category === "strength") {
    extra.push("Optional second session: 20–30 min easy Z2 bike");
  }

  if ((hours === "7-10" || hours === "10+") && clone.type === "long_run") {
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

function buildIntro(input: BlueprintInput, structureLabel: string) {
  const intro: string[] = [];

  intro.push(
    `This week is built around your goal of ${formatGoal(input.goal_focus).toLowerCase()} while training ${input.days_per_week} days per week.`
  );

  intro.push(
    `Based on your ${getExperienceText(input.ability_level)} training level, ${getHoursText(
      input.weekly_hours_band
    )}, and ${getEquipmentSummary(input.equipment)}, we’ve structured the week to feel specific to where you’re at right now.`
  );

  intro.push(
    `The ${structureLabel.toLowerCase()} structure was chosen to fit your availability while ${getGoalReason(
      input.goal_focus
    )}.`
  );

  intro.push(getLevelReason(input.ability_level));

  const hoursReason = getHoursReason(input.weekly_hours_band, input.double_sessions);
  if (hoursReason) intro.push(hoursReason);

  const constraintReason = getConstraintReason(input.notes);
  if (constraintReason) intro.push(constraintReason);

  if (input.five_k_time && input.goal_focus === "running") {
    intro.push(
      `Your submitted 5k time (${input.five_k_time}) gives this week more context, so the structure leans toward improving your current running level rather than just adding random volume.`
    );
  }

  intro.push(
    "These sessions are not random. They’ve been selected around your current training level, available time, and setup so the week feels relevant to where you’re at right now."
  );

  intro.push(
    "As the Hybrid365 engine continues to improve, this will become even more specific to your current numbers, race goals, and performance profile."
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
  };
}

function getPreferredDayOrder(preferred?: string[]): DayKey[] {
  const map: Record<string, DayKey> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  if (!preferred || preferred.length === 0) {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  const preferredMapped = preferred
    .map((d) => map[d.toLowerCase()])
    .filter(Boolean);

  const allDays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const remaining = allDays.filter((d) => !preferredMapped.includes(d));

  return [...preferredMapped, ...remaining];
}

function buildActivePlanDays(input: BlueprintInput) {
  const structure = pickWeeklyStructure({
    days_per_week: input.days_per_week,
    goal_focus: input.goal_focus,
    ability_level: input.ability_level,
    double_sessions: input.double_sessions,
    weekly_hours_band: input.weekly_hours_band,
  });

  const usedIds = new Set<string>();
  const activeDays: DayPlan[] = [];

  let previousFatigueTag = "";

  const dayOrder = getPreferredDayOrder(input.preferred_days);

  structure.roles.forEach((role, idx) => {
    const picked = addVolumeOverlay(
      pickWeightedSession(role, input, usedIds, previousFatigueTag),
      input.weekly_hours_band,
      input.double_sessions
    );

    previousFatigueTag =
      picked.type === "strength_lower" && picked.fatigue === "high"
        ? "lower_high_fatigue"
        : picked.type === "hybrid_compromised" && picked.fatigue === "high"
        ? "hybrid_high_fatigue"
        : picked.type;

    const assignedDay = dayOrder[idx];

    activeDays.push({
      day: assignedDay,
      title: picked.name,
      intent: structureIntent(role, input.goal_focus),
      session: {
        warm_up: picked.prescription.warm_up,
        main: picked.prescription.main,
        cool_down: picked.prescription.cool_down,
        finish: picked.prescription.finish,
        notes: [
          purposeText(picked),
          structureReasonText(picked, input.goal_focus),
          cueText(picked),
          rpeText(picked),
          ...(picked.prescription.notes || []),
        ],
      },
      time_cap_minutes: picked.duration,
      tags: [picked.type, picked.category, picked.variation_group],
    });
  });

  return { structure, activeDays };
}

function fillSevenDayWeek(input: BlueprintInput, activeDays: DayPlan[]) {
  const result: DayPlan[] = [];
  const baseDays: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const existing = activeDays.find((d) => d.day === baseDays[i]);
    if (existing) {
      result.push(existing);
      continue;
    }

    if (baseDays[i] === "Thu" || baseDays[i] === "Sat") {
      result.push(lightAerobicDay(baseDays[i]));
    } else {
      result.push(recoveryDay(baseDays[i]));
    }
  }

  return result;
}

export function buildWeekBlueprint(input: BlueprintInput): PlanJson {
  const { structure, activeDays } = buildActivePlanDays(input);
  const schedule = fillSevenDayWeek(input, activeDays);

  return {
    intensity_split: intensitySplit(input.ability_level),
    profile: {
      goal: formatGoal(input.goal_focus),
      training_days: `${input.days_per_week} / week`,
      priority: formatPriority(input.goal_focus),
      level: input.ability_level.charAt(0).toUpperCase() + input.ability_level.slice(1),
      weekly_hours: input.weekly_hours_band,
      equipment: (input.equipment || ["Full gym"]).join(", "),
    },
    intro: buildIntro(input, structure.label),
    schedule,
    cta: {
  headline: "What happens next?",
  body: "This week is built using Hybrid365 principles. If you want to understand how to get the most from it — and how we build real progression — start here.",
  button_url: "https://www.levelete.com/hybridtrainingmastery",
},
  };
}