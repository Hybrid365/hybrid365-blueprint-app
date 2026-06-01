import type { DayPlan, PlanJson } from "./sessionLibrary";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
  HYBRID75_RULES,
  type Hybrid75PlanMeta,
} from "./freeWeekChallengeMode";
import { classifyHybrid75Session } from "./hybrid75SessionMethodology";
import {
  countHybrid75Roles,
  repairHybrid75Sequencing,
  sortScheduleByDay,
  type Hybrid75ApplyInput,
} from "./hybrid75Sequencing";

export type { Hybrid75ApplyInput };

function isRestDay(day: DayPlan): boolean {
  const title = day.title.toLowerCase();
  const tags = (day.tags ?? []).join(" ").toLowerCase();
  return (
    title.includes("rest") ||
    title.includes("off day") ||
    tags.includes("rest") ||
    (title.includes("recovery") && !title.includes("mobility") && tags.includes("recovery") && !tags.includes("mobility"))
  );
}

function classifySession(day: DayPlan): "run" | "strength" | "mobility" | "other" {
  if (isRestDay(day)) return "other";

  const title = day.title.toLowerCase();
  const tags = (day.tags ?? []).map((t) => t.toLowerCase());
  const tagStr = tags.join(" ");

  if (tagStr.includes("mobility") || title.includes("mobility")) return "mobility";
  if (
    tagStr.includes("run") ||
    title.includes("run") ||
    tagStr.includes("threshold") ||
    tagStr.includes("tempo") ||
    title.includes("threshold") ||
    title.includes("tempo")
  ) {
    return "run";
  }
  if (tagStr.includes("strength") || title.includes("strength") || title.includes("lift")) {
    return "strength";
  }
  if (title.includes("aerobic") && (title.includes("jog") || tagStr.includes("aerobic"))) {
    return "run";
  }

  return "other";
}

function tagSession(day: DayPlan, role: "run" | "strength" | "mobility"): DayPlan {
  const tags = [...(day.tags ?? [])];
  const tag = `hybrid75_${role}`;
  if (!tags.includes(tag)) tags.push(tag);
  return { ...day, tags };
}

function buildWeekendPlaceholder(day: DayPlan["day"]): DayPlan {
  return {
    day,
    title: "Hybrid Hard Weekly Challenge",
    tags: ["challenge_placeholder", "hybrid_hard_challenge", "hybrid75_challenge"],
    time_cap_minutes: 45,
    intent:
      "This week's Hybrid Hard Challenge is released inside the free Telegram group. Complete it over the weekend, post proof, and submit your score for the leaderboard.",
    session: {
      main: [
        "The weekly Hybrid Hard Challenge workout is released every weekend inside the free Telegram group.",
        "Join the group, complete the challenge, post proof, and submit your score to qualify for prizes and leaderboard placement.",
      ],
      notes: [
        "This is a placeholder — the actual workout is not revealed here. Check Telegram for this week's release.",
      ],
    },
    priority: {
      rank: 2,
      label: "priority_2",
      display_label: "Priority 2",
      category_label: "Support Session",
      reason: "Weekly Hybrid Hard Challenge requirement for Hybrid 75.",
    },
    hybrid75_cta: {
      label: HYBRID75_TELEGRAM_GROUP_LABEL,
      url: FREE_WEEK_TELEGRAM_URL,
    },
  };
}

function isChallengePlaceholder(day: DayPlan): boolean {
  return (day.tags ?? []).some(
    (t) => t === "challenge_placeholder" || t === "hybrid_hard_challenge" || t === "hybrid75_challenge"
  );
}

function insertWeekendPlaceholder(schedule: DayPlan[]): DayPlan[] {
  // Strip any existing challenge placeholders — always re-place on Saturday.
  let next = schedule.filter((d) => !isChallengePlaceholder(d));

  const satIdx = next.findIndex((d) => d.day === "Sat");
  if (satIdx >= 0) {
    next[satIdx] = buildWeekendPlaceholder("Sat");
  } else {
    next.push(buildWeekendPlaceholder("Sat"));
  }

  return sortScheduleByDay(next);
}

function maybeAddMobilitySession(
  schedule: DayPlan[],
  daysPerWeek: number
): { schedule: DayPlan[]; mobilityAdded: boolean } {
  if (daysPerWeek < 4) return { schedule, mobilityAdded: false };

  const restIdx = schedule.findIndex((d) => isRestDay(d));
  if (restIdx < 0) return { schedule, mobilityAdded: false };

  const restDay = schedule[restIdx];
  const next = [...schedule];
  next[restIdx] = {
    ...restDay,
    title: "Mobility & Reset",
    tags: [...(restDay.tags ?? []).filter((t) => t !== "recovery"), "mobility", "hybrid75_mobility"],
    intent: "Light mobility flow to support the Hybrid 75 challenge — 15–20 minutes.",
    time_cap_minutes: 20,
    session: {
      main: ["10–15 min full-body mobility: hips, ankles, T-spine, shoulders"],
      notes: ["Hybrid 75: aim for 1–2 mobility sessions per week. Keep this genuinely easy."],
    },
  };

  return { schedule: next, mobilityAdded: true };
}

function buildCompressionNote(
  input: Hybrid75ApplyInput,
  counts: ReturnType<typeof countHybrid75Roles>
): string | undefined {
  const targets = { runs: 3, lifts: 3, mobility: 1 };
  const gaps: string[] = [];

  if (counts.runs < targets.runs) gaps.push(`${targets.runs - counts.runs} additional easy run(s)`);
  if (counts.lifts < targets.lifts) gaps.push(`${targets.lifts - counts.lifts} additional lift session(s)`);
  if (counts.mobility < targets.mobility) gaps.push("a dedicated mobility session");

  if (gaps.length === 0 && input.days_per_week > 4) return undefined;

  if (input.days_per_week <= 4 || input.ability_level === "beginner") {
    const scaled =
      "Your week has been scaled for beginner/compressed availability using short Hybrid 75 Challenge Add-ons to help you reach the 3 run / 3 lift rules safely.";
    if (gaps.length > 0) {
      return `${scaled} To fully complete the rules, add ${gaps.join(" and ")} where recovery allows.`;
    }
    return scaled;
  }

  if (gaps.length > 0) {
    return `Your plan is personalised to your ${input.days_per_week} training days and ${input.ability_level} level. To fully meet Hybrid 75 rules, add ${gaps.join(" and ")} on rest days or light days if recovery allows. Daily habits (hydration, clean eating, proof) apply every day.`;
  }

  return undefined;
}

function parseEquipmentFromPlan(plan: PlanJson, input: Hybrid75ApplyInput): string[] | undefined {
  if (input.equipment?.length) return input.equipment;
  const profile = plan.profile as { equipment?: unknown } | undefined;
  const eq = profile?.equipment;
  if (Array.isArray(eq)) return eq.map(String);
  if (typeof eq === "string" && eq.trim()) return eq.split(",").map((s) => s.trim());
  return undefined;
}

export function applyHybrid75FreeWeek(plan: PlanJson, input: Hybrid75ApplyInput): PlanJson {
  let schedule = plan.schedule.map((day) => {
    const role = classifySession(day);
    if (role === "run") return tagSession(day, "run");
    if (role === "strength") return tagSession(day, "strength");
    if (role === "mobility") return tagSession(day, "mobility");
    return day;
  });

  const mobilityResult = maybeAddMobilitySession(schedule, input.days_per_week);
  schedule = mobilityResult.schedule;

  schedule = insertWeekendPlaceholder(schedule);

  const sequencing = repairHybrid75Sequencing(schedule, {
    days_per_week: input.days_per_week,
    ability_level: input.ability_level,
    equipment: parseEquipmentFromPlan(plan, input),
  });

  schedule = sequencing.schedule;

  const counts = countHybrid75Roles(schedule);

  const session_classifications = schedule.map((day) => {
    const c = classifyHybrid75Session(day);
    return {
      day: day.day,
      title: day.title,
      stress: c.stress,
      primaryStimulus: c.primaryStimulus,
    };
  });

  const compression_note = buildCompressionNote(input, counts);

  const hybrid75: Hybrid75PlanMeta = {
    rules: HYBRID75_RULES,
    targets: {
      runs: 3,
      lifts: 3,
      lifts_min: 3,
      lifts_max: 3,
      upper_exposures: 2,
      hybrid_leg_exposures: 1,
      weekly_challenge: 1,
      mobility_min: 1,
      mobility_max: 2,
    },
    scheduled_counts: counts,
    habits: {
      hydration_litres: "3–4L daily",
      clean_eating: "Daily",
      accountability_proof: "Daily — post in Telegram",
    },
    compression_note,
    telegram_url: FREE_WEEK_TELEGRAM_URL,
    challenge_cta: {
      label: HYBRID75_TELEGRAM_GROUP_LABEL,
      url: FREE_WEEK_TELEGRAM_URL,
    },
    session_classifications,
    methodology_notes: sequencing.methodology_notes,
    sequencing_repairs_applied: sequencing.repairs_applied,
    hard_easy_summary: sequencing.hard_easy_summary,
  };

  const intro = [
    ...plan.intro,
    "You're on the Hybrid 75 Summer Challenge pathway — your week is structured around challenge rules while respecting your goal, level, and availability.",
    "Weekly targets: 3 runs, 3 lifts (2 upper-body + 1 Hybrid Leg Endurance), 1–2 mobility sessions, plus daily hydration (3–4L), clean eating, accountability proof, and the weekend Hybrid Hard Challenge.",
    "Default Hybrid 75 rhythm: Mon upper strength → Tue quality run → Wed upper volume → Thu hybrid leg endurance → Fri easy run + mobility → Sat challenge → Sun easy long run.",
    "This week follows Hybrid365 hard/easy rhythm where possible — hard run and lower sessions are separated by upper-body support, mobility and easy aerobic work.",
    ...(compression_note ? [compression_note] : []),
    ...sequencing.methodology_notes,
  ];

  return {
    ...plan,
    challenge_mode: "hybrid75",
    intro,
    schedule,
    hybrid75,
  };
}
