import type { AbilityLevel, DayKey, DayPlan } from "./sessionLibrary";
import {
  annotateDayPlanWithHybrid75Methodology,
  classifyHybrid75Session,
  createEasyLongRunSession,
  createEasyRunAddonSession,
  createEasyRunMobilitySession,
  createGripCoreChallengeAddonSession,
  createHybridLegEnduranceSession,
  createMobilityGripCoreChallengeAddonSession,
  createRecoveryAerobicSession,
  createUpperCoreChallengeAddonSession,
  createUpperStrengthASession,
  createUpperStrengthBSession,
  createUpperStrengthGripSession,
  isHybrid75ChallengeAddonLift,
  mergeUpperCoreAddonIntoSession,
  type Hybrid75SessionClassification,
} from "./hybrid75SessionMethodology";

export type Hybrid75SequencingContext = {
  days_per_week: number;
  ability_level: AbilityLevel;
  equipment?: string[];
};

/** Alias for wrapper input — same shape as sequencing context. */
export type Hybrid75ApplyInput = Hybrid75SequencingContext;

export type Hybrid75DayAnalysis = {
  index: number;
  day: DayKey;
  plan: DayPlan;
  classification: Hybrid75SessionClassification;
  hardRunDay: boolean;
  lowerStressDay: boolean;
  hardDay: boolean;
  upperSupportDay: boolean;
  mobilityDay: boolean;
  challengeDay: boolean;
};

export type Hybrid75SequencingResult = {
  schedule: DayPlan[];
  repairs_applied: string[];
  methodology_notes: string[];
  hybrid_leg_injected: boolean;
  lower_work_controlled: boolean;
  hard_easy_summary: string;
};

const DAY_ORDER: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daySortIndex(day: DayKey): number {
  const idx = DAY_ORDER.indexOf(day);
  return idx >= 0 ? idx : 99;
}

export function sortScheduleByDay(schedule: DayPlan[]): DayPlan[] {
  return [...schedule].sort((a, b) => daySortIndex(a.day) - daySortIndex(b.day));
}

export function isWeekendDay(day: DayKey): boolean {
  return day === "Sat" || day === "Sun";
}

export function getAdjacentDays(
  analyses: Hybrid75DayAnalysis[],
  index: number
): { prev: Hybrid75DayAnalysis | null; next: Hybrid75DayAnalysis | null } {
  return {
    prev: index > 0 ? analyses[index - 1] : null,
    next: index < analyses.length - 1 ? analyses[index + 1] : null,
  };
}

function haystack(day: DayPlan): string {
  const s = day.session ?? { main: [] };
  return [day.title, day.intent ?? "", ...(day.tags ?? []), ...(s.main ?? []), ...(s.notes ?? [])]
    .join(" ")
    .toLowerCase();
}

export function isClearlyUpperFocused(day: DayPlan): boolean {
  const c = classifyHybrid75Session(day);
  return c.isUpperSupport || (day.tags ?? []).includes("upper_strength");
}

export function isHybridLegSession(day: DayPlan): boolean {
  return (day.tags ?? []).includes("hybrid_leg_endurance") || day.title.toLowerCase().includes("hybrid leg endurance");
}

export function isChallengeSession(day: DayPlan): boolean {
  const c = classifyHybrid75Session(day);
  return c.primaryStimulus === "challenge";
}

/** Generic lower / full-body strength suitable for upper-support replacement. */
export function isGenericLowerStrength(day: DayPlan): boolean {
  if (isClearlyUpperFocused(day) || isHybridLegSession(day) || isChallengeSession(day)) return false;
  const c = classifyHybrid75Session(day);
  const hay = haystack(day);
  if (c.isUpperSupport) return false;
  if (c.isMobility || c.primaryStimulus === "mobility" || c.primaryStimulus === "recovery") return false;
  if (c.isRun) return false;
  return (
    c.isLowerStress ||
    c.primaryStimulus === "lower_strength" ||
    hay.includes("strength_lower") ||
    hay.includes("strength_full") ||
    hay.includes("full body") ||
    hay.includes("full-body") ||
    (hay.includes("strength") && !hay.includes("upper"))
  );
}

export function analyseHybrid75Week(schedule: DayPlan[]): Hybrid75DayAnalysis[] {
  const sorted = sortScheduleByDay(schedule);
  return sorted.map((plan, index) => {
    const classification = classifyHybrid75Session(plan);
    const challengeDay = classification.primaryStimulus === "challenge";
    return {
      index,
      day: plan.day,
      plan,
      classification,
      hardRunDay: classification.isHardRun,
      lowerStressDay: classification.isLowerStress && !challengeDay,
      hardDay: classification.stress === "hard",
      upperSupportDay: classification.isUpperSupport,
      mobilityDay: classification.isMobility,
      challengeDay,
    };
  });
}

export function hasBackToBackHardRuns(analyses: Hybrid75DayAnalysis[]): boolean {
  for (let i = 0; i < analyses.length - 1; i++) {
    if (analyses[i].hardRunDay && analyses[i + 1].hardRunDay) return true;
  }
  return false;
}

export function hasBackToBackLowerStress(analyses: Hybrid75DayAnalysis[]): boolean {
  for (let i = 0; i < analyses.length - 1; i++) {
    if (analyses[i].lowerStressDay && analyses[i + 1].lowerStressDay) return true;
  }
  return false;
}

/** True when a day is not an acceptable recovery/support session after Hybrid Leg Endurance. */
export function isPostHybridLegViolation(day: DayPlan): boolean {
  if (isHybridLegSession(day) || isChallengeSession(day)) return false;

  const c = classifyHybrid75Session(day);
  const hay = haystack(day);

  if (c.isHardRun) return true;
  if (c.isLowerStress) return true;
  if (c.primaryStimulus === "lower_strength" || c.primaryStimulus === "hybrid_leg_endurance") return true;
  if (c.stress === "hard" && !c.isUpperSupport && !c.isMobility) return true;
  if (hay.includes("hybrid_compromised") || hay.includes("compromised")) return true;
  if (hay.includes("hybrid_bodyweight") || hay.includes("strength_lower")) return true;
  if (hay.includes("circuit") && !c.isUpperSupport) return true;
  if ((hay.includes("strength") || hay.includes("lift")) && !c.isUpperSupport && !c.isMobility) return true;

  return false;
}

export function hasHybridLegFollowedByViolation(schedule: DayPlan[]): boolean {
  const analyses = analyseHybrid75Week(schedule);
  for (let i = 0; i < analyses.length - 1; i++) {
    if (!isHybridLegSession(analyses[i].plan)) continue;
    if (isPostHybridLegViolation(analyses[i + 1].plan)) return true;
  }
  return false;
}

function isAcceptableFridayBeforeChallenge(day: DayPlan): boolean {
  const c = classifyHybrid75Session(day);
  if (c.isUpperSupport || c.isMobility) return true;
  if (c.isRun && !c.isHardRun && c.stress !== "hard") return true;
  if (c.primaryStimulus === "run_easy" || c.primaryStimulus === "run_moderate") return true;
  if (c.stress === "easy" && !c.isLowerStress) return true;
  return false;
}

function shouldApplyDefaultHybrid75Format(ctx: Hybrid75SequencingContext): boolean {
  return ctx.days_per_week >= 5 && ctx.ability_level !== "beginner";
}

function isUpperStrengthASession(day: DayPlan): boolean {
  return (
    (day.tags ?? []).includes("upper_strength_a") ||
    day.title.toLowerCase().includes("strength bias")
  );
}

function isUpperStrengthBSession(day: DayPlan): boolean {
  return (
    (day.tags ?? []).includes("upper_strength_b") ||
    day.title.toLowerCase().includes("volume + grip")
  );
}

function isEasyRunMobilitySession(day: DayPlan): boolean {
  return (
    day.title.toLowerCase().includes("easy run + mobility") ||
    ((day.tags ?? []).includes("easy_run") && (day.tags ?? []).includes("mobility"))
  );
}

function isEasyLongRunSession(day: DayPlan): boolean {
  return (
    day.title.toLowerCase().includes("easy long run") ||
    day.title.toLowerCase().includes("aerobic base")
  );
}

function shouldReplaceForDefaultFormat(day: DayPlan, role: "mon" | "wed" | "thu" | "fri" | "sun"): boolean {
  switch (role) {
    case "mon":
      return !isUpperStrengthASession(day);
    case "wed":
      return !isUpperStrengthBSession(day);
    case "thu":
      return !isHybridLegSession(day);
    case "fri":
      return (
        isPostHybridLegViolation(day) ||
        !isAcceptableFridayBeforeChallenge(day) ||
        !isEasyRunMobilitySession(day)
      );
    case "sun":
      return (
        classifyHybrid75Session(day).isHardRun ||
        classifyHybrid75Session(day).stress === "hard" ||
        !isEasyLongRunSession(day)
      );
    default:
      return false;
  }
}

function shouldApplyCompressedHybrid75Format(ctx: Hybrid75SequencingContext): boolean {
  return ctx.days_per_week <= 4 || ctx.ability_level === "beginner";
}

/** Apply short Challenge Add-ons for beginner / 3–4 day compressed Hybrid 75 weeks. */
function applyCompressedHybrid75Format(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[]
): DayPlan[] {
  if (!shouldApplyCompressedHybrid75Format(ctx) || shouldApplyDefaultHybrid75Format(ctx)) return schedule;

  let next = sortScheduleByDay(schedule);
  const input = (day: DayKey) => templateInput(ctx, day);

  const replaceDay = (dayKey: DayKey, plan: DayPlan, label: string) => {
    const idx = next.findIndex((d) => d.day === dayKey);
    if (idx < 0) return;
    next = replaceAt(next, idx, { ...plan, day: dayKey });
    repairs.push(label);
  };

  const mon = next.find((d) => d.day === "Mon");
  if (mon && !isChallengeSession(mon) && !classifyHybrid75Session(mon).isHardRun) {
    replaceDay(
      "Mon",
      createUpperCoreChallengeAddonSession(input("Mon")),
      "Set Monday to Upper/Core Challenge Add-on for compressed Hybrid 75 week."
    );
  }

  const tueIdx = next.findIndex((d) => d.day === "Tue");
  if (tueIdx >= 0) {
    const tue = next[tueIdx];
    if (classifyHybrid75Session(tue).isHardRun) {
      next = replaceAt(next, tueIdx, mergeUpperCoreAddonIntoSession(tue, input("Tue")));
      repairs.push("Added Upper/Core Challenge Add-on to Tuesday quality run day.");
    } else if (!isChallengeSession(tue) && !isHybrid75ChallengeAddonLift(tue)) {
      replaceDay(
        "Tue",
        createUpperCoreChallengeAddonSession(input("Tue")),
        "Set Tuesday to Upper/Core Challenge Add-on."
      );
    }
  }

  const wed = next.find((d) => d.day === "Wed");
  if (wed && !isChallengeSession(wed)) {
    replaceDay(
      "Wed",
      createMobilityGripCoreChallengeAddonSession(input("Wed")),
      "Set Wednesday to Mobility + Grip/Core Challenge Add-on."
    );
  }

  const thu = next.find((d) => d.day === "Thu");
  if (thu && !isChallengeSession(thu) && !classifyHybrid75Session(thu).isHardRun) {
    replaceDay(
      "Thu",
      createEasyRunAddonSession(input("Thu")),
      "Set Thursday to Easy Run Add-on for compressed Hybrid 75 week."
    );
  }

  const fri = next.find((d) => d.day === "Fri");
  if (fri && !isChallengeSession(fri) && !classifyHybrid75Session(fri).isHardRun) {
    const runs = next.filter(countsTowardRunTarget).length;
    const lifts = next.filter(countsTowardLiftTarget).length;
    if (runs < 3) {
      replaceDay("Fri", createEasyRunAddonSession(input("Fri")), "Set Friday to Easy Run Add-on to reach Hybrid 75 run target.");
    } else if (lifts < 3) {
      replaceDay(
        "Fri",
        createGripCoreChallengeAddonSession(input("Fri")),
        "Set Friday to Grip + Core Challenge Add-on to reach Hybrid 75 lift target."
      );
    }
  }

  const sun = next.find((d) => d.day === "Sun");
  if (sun && !isChallengeSession(sun) && !classifyHybrid75Session(sun).isHardRun && !isEasyLongRunSession(sun)) {
    replaceDay(
      "Sun",
      createEasyLongRunSession(input("Sun")),
      "Set Sunday to Easy Long Run / Aerobic Base for compressed Hybrid 75 week."
    );
  }

  return next;
}

/** Bias 5–6+ day intermediate/advanced weeks toward the default Hybrid 75 format. */
function applyDefaultHybrid75Format(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { hybrid_leg_injected: boolean }
): DayPlan[] {
  if (!shouldApplyDefaultHybrid75Format(ctx)) return schedule;

  let next = sortScheduleByDay(schedule);
  const input = (day: DayKey) => templateInput(ctx, day);

  const replaceDay = (dayKey: DayKey, plan: DayPlan, label: string) => {
    const idx = next.findIndex((d) => d.day === dayKey);
    if (idx < 0) return;
    next = replaceAt(next, idx, { ...plan, day: dayKey });
    repairs.push(label);
  };

  const mon = next.find((d) => d.day === "Mon");
  if (mon && shouldReplaceForDefaultFormat(mon, "mon")) {
    replaceDay("Mon", createUpperStrengthASession(input("Mon")), "Set Monday to Upper Strength — Strength Bias (Hybrid 75 default format).");
  }

  const wed = next.find((d) => d.day === "Wed");
  if (wed && shouldReplaceForDefaultFormat(wed, "wed")) {
    replaceDay("Wed", createUpperStrengthBSession(input("Wed")), "Set Wednesday to Upper Strength — Volume + Grip (Hybrid 75 default format).");
  }

  const thu = next.find((d) => d.day === "Thu");
  if (thu && shouldReplaceForDefaultFormat(thu, "thu")) {
    replaceDay(
      "Thu",
      createHybridLegEnduranceSession(input("Thu")),
      "Set Thursday to Hybrid Leg Endurance (Hybrid 75 default format)."
    );
    flags.hybrid_leg_injected = true;
  }

  const fri = next.find((d) => d.day === "Fri");
  if (fri && shouldReplaceForDefaultFormat(fri, "fri")) {
    replaceDay(
      "Fri",
      createEasyRunMobilitySession(input("Fri")),
      "Set Friday to Easy Run + Mobility before Saturday's Hybrid Hard Challenge."
    );
  }

  const sun = next.find((d) => d.day === "Sun");
  if (sun && shouldReplaceForDefaultFormat(sun, "sun")) {
    replaceDay(
      "Sun",
      createEasyLongRunSession(input("Sun")),
      "Set Sunday to Easy Long Run / Aerobic Base (Hybrid 75 run 3 of 3)."
    );
  }

  return next;
}

function pickRecoveryDayAfterHybridLeg(
  ctx: Hybrid75SequencingContext,
  day: DayKey,
  analyses: Hybrid75DayAnalysis[]
): DayPlan {
  const input = templateInput(ctx, day);
  const satIsChallenge = analyses.some((a) => a.day === "Sat" && a.challengeDay);

  if (day === "Fri" && satIsChallenge) {
    return createEasyRunMobilitySession(input);
  }
  if (shouldApplyDefaultHybrid75Format(ctx) && day === "Fri") {
    return createEasyRunMobilitySession(input);
  }

  const upperCount = analyses.filter((a) => a.upperSupportDay).length;
  if (upperCount < 2) {
    return createUpperStrengthGripSession(input);
  }
  if (ctx.equipment?.some((e) => e.toLowerCase().includes("bike") || e.toLowerCase().includes("rower"))) {
    return createRecoveryAerobicSession(input);
  }
  return createEasyRunMobilitySession(input);
}

function fixDaysAfterHybridLegEndurance(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { lower_work_controlled: boolean }
): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  let analyses = analyseHybrid75Week(next);

  for (let i = 0; i < analyses.length - 1; i++) {
    if (!isHybridLegSession(analyses[i].plan)) continue;
    const following = analyses[i + 1];
    if (!isPostHybridLegViolation(following.plan)) continue;

    const replacement = pickRecoveryDayAfterHybridLeg(ctx, following.day, analyses);
    next = replaceAt(next, following.index, replacement);
    flags.lower_work_controlled = true;
    repairs.push(
      `Replaced ${following.day}'s ${following.plan.title} with ${replacement.title} — recovery/support day after Hybrid Leg Endurance to manage DOMS.`
    );
    analyses = analyseHybrid75Week(next);
  }

  return next;
}

function fixFridayBeforeSaturdayChallenge(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { lower_work_controlled: boolean }
): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  const analyses = analyseHybrid75Week(next);
  const sat = analyses.find((a) => a.day === "Sat" && a.challengeDay);
  const fri = analyses.find((a) => a.day === "Fri");
  if (!sat || !fri) return next;
  if (isAcceptableFridayBeforeChallenge(fri.plan) && isEasyRunMobilitySession(fri.plan)) return next;
  if (isAcceptableFridayBeforeChallenge(fri.plan) && !shouldApplyDefaultHybrid75Format(ctx)) return next;

  const replacement = shouldApplyDefaultHybrid75Format(ctx)
    ? createEasyRunMobilitySession(templateInput(ctx, "Fri"))
    : pickRecoveryDayAfterHybridLeg(ctx, "Fri", analyses);

  next = replaceAt(next, fri.index, replacement);
  flags.lower_work_controlled = true;
  repairs.push(
    `Replaced Friday's ${fri.plan.title} with ${replacement.title} — easy/support only before Saturday's Hybrid Hard Challenge.`
  );
  return next;
}

function stressLetter(analysis: Hybrid75DayAnalysis): string {
  if (analysis.challengeDay) return "C";
  if (analysis.hardRunDay) return "H";
  if (analysis.lowerStressDay) return "L";
  if (analysis.upperSupportDay) return "S";
  if (analysis.mobilityDay) return "M";
  if (analysis.classification.stress === "easy") return "E";
  return "A";
}

export function buildHardEasySummary(analyses: Hybrid75DayAnalysis[]): string {
  if (analyses.length === 0) return "";
  return analyses.map((a) => `${a.day}:${stressLetter(a)}`).join(" → ");
}

function templateInput(ctx: Hybrid75SequencingContext, day: DayKey): {
  day: DayKey;
  ability_level: AbilityLevel;
  equipment?: string[];
} {
  return { day, ability_level: ctx.ability_level, equipment: ctx.equipment };
}

function convertHardRunToEasyRun(day: DayPlan): DayPlan {
  return annotateDayPlanWithHybrid75Methodology({
    ...day,
    template_id: "HYBRID75-EASY-RUN",
    title: "Easy Aerobic Run",
    intent: "Easy conversational running — maintain aerobic volume without stacking hard run stress.",
    tags: ["run", "aerobic_support", "easy_run", "hybrid75_run"],
    time_cap_minutes: day.time_cap_minutes ?? 40,
    session: {
      main: ["25–40 min easy run — RPE 3–4/10, fully conversational, nose-breathe where possible"],
      notes: [
        "Hybrid 75 sequencing: adjusted to easy aerobic to protect hard/easy rhythm between key sessions.",
      ],
    },
  });
}

function softenRunToEasyModerate(day: DayPlan): DayPlan {
  if (!classifyHybrid75Session(day).isHardRun) {
    return annotateDayPlanWithHybrid75Methodology({
      ...day,
      intent: day.intent ?? "Controlled easy-moderate aerobic — keep this genuinely conversational.",
      session: {
        ...day.session,
        notes: [
          ...(day.session.notes ?? []),
          "Hybrid 75: kept easy-moderate after the weekend challenge to aid recovery.",
        ],
      },
    });
  }
  return convertHardRunToEasyRun(day);
}

export function findBestUpperSupportReplacementDay(
  analyses: Hybrid75DayAnalysis[],
  adjacentToHardRun: "after" | "before"
): number | null {
  for (let i = 0; i < analyses.length; i++) {
    const { prev, next } = getAdjacentDays(analyses, i);
    const hardAdjacent =
      adjacentToHardRun === "after" ? prev?.hardRunDay : next?.hardRunDay;
    if (!hardAdjacent) continue;
    if (isGenericLowerStrength(analyses[i].plan)) return i;
  }
  return null;
}

export function findBestHybridLegEnduranceDay(analyses: Hybrid75DayAnalysis[]): number | null {
  let bestIdx: number | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const a of analyses) {
    if (a.challengeDay || a.hardRunDay || a.mobilityDay) continue;
    if (isHybridLegSession(a.plan)) return a.index;

    let score = 0;
    if (a.day === "Thu") score += 40;
    if (isWeekendDay(a.day)) score -= 30;

    const { prev, next } = getAdjacentDays(analyses, a.index);
    if (prev?.hardRunDay || next?.hardRunDay) score -= 50;
    if (prev?.challengeDay || next?.challengeDay) score -= 50;
    if (prev?.lowerStressDay || next?.lowerStressDay) score -= 30;
    if (isGenericLowerStrength(a.plan)) score += 25;
    if (a.upperSupportDay) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = a.index;
    }
  }

  return bestScore >= 0 ? bestIdx : null;
}

function shouldInjectHybridLeg(ctx: Hybrid75SequencingContext): boolean {
  if (ctx.days_per_week <= 4) return false;
  if (ctx.ability_level === "beginner") return false;
  return ctx.days_per_week >= 5;
}

function replaceAt(schedule: DayPlan[], index: number, nextPlan: DayPlan): DayPlan[] {
  const sorted = sortScheduleByDay(schedule);
  sorted[index] = { ...nextPlan, day: sorted[index].day };
  return sorted;
}

function countHardRunDays(analyses: Hybrid75DayAnalysis[]): number {
  return analyses.filter((a) => a.hardRunDay && !a.challengeDay).length;
}

function fixBackToBackHardRuns(
  schedule: DayPlan[],
  repairs: string[]
): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  let analyses = analyseHybrid75Week(next);

  for (let i = 0; i < analyses.length - 1; i++) {
    if (!analyses[i].hardRunDay || !analyses[i + 1].hardRunDay) continue;
    const target = analyses[i + 1];
    if (target.challengeDay) continue;

    if (countHardRunDays(analyses) <= 1) break;

    const converted = convertHardRunToEasyRun(target.plan);
    next = replaceAt(next, target.index, converted);
    repairs.push(
      `Converted ${target.day}'s ${target.plan.title} to an easy aerobic run to avoid back-to-back hard running.`
    );
    analyses = analyseHybrid75Week(next);
  }

  return next;
}

function fixAdjacentStrengthToUpper(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { lower_work_controlled: boolean }
): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  let analyses = analyseHybrid75Week(next);

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < analyses.length; i++) {
      const { prev, next: nextDay } = getAdjacentDays(analyses, i);
      const afterHardRun = prev?.hardRunDay;
      const beforeHardRun = nextDay?.hardRunDay;
      if (!afterHardRun && !beforeHardRun) continue;
      if (!isGenericLowerStrength(analyses[i].plan)) continue;

      const upper = createUpperStrengthGripSession(templateInput(ctx, analyses[i].day));
      next = replaceAt(next, analyses[i].index, upper);
      flags.lower_work_controlled = true;
      repairs.push(
        `Replaced ${analyses[i].day}'s lower/full-body strength with Upper Strength + Grip to protect hard/easy rhythm${
          afterHardRun ? " after a hard run" : " before a hard run"
        }.`
      );
      analyses = analyseHybrid75Week(next);
    }
  }

  return next;
}

function injectHybridLegEndurance(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { hybrid_leg_injected: boolean }
): DayPlan[] {
  if (!shouldInjectHybridLeg(ctx)) return schedule;

  let next = sortScheduleByDay(schedule);
  const analyses = analyseHybrid75Week(next);
  if (analyses.some((a) => isHybridLegSession(a.plan))) {
    flags.hybrid_leg_injected = true;
    return next;
  }

  const targetIdx = findBestHybridLegEnduranceDay(analyses);
  if (targetIdx == null) return next;

  const target = analyses[targetIdx];
  const leg = createHybridLegEnduranceSession(templateInput(ctx, target.day));
  next = replaceAt(next, targetIdx, leg);
  flags.hybrid_leg_injected = true;
  repairs.push(
    `Added Hybrid Leg Endurance on ${target.day} — replacing ${target.plan.title} to build hybrid lower durability without max-strength loading.`
  );
  return next;
}

function fixBackToBackLowerStress(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext,
  repairs: string[],
  flags: { lower_work_controlled: boolean }
): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  let analyses = analyseHybrid75Week(next);

  for (let i = 0; i < analyses.length - 1; i++) {
    if (!analyses[i].lowerStressDay || !analyses[i + 1].lowerStressDay) continue;
    const second = analyses[i + 1];
    if (second.challengeDay || isHybridLegSession(second.plan)) continue;
    if (!isGenericLowerStrength(second.plan)) continue;

    const upper = createUpperStrengthGripSession(templateInput(ctx, second.day));
    next = replaceAt(next, second.index, upper);
    flags.lower_work_controlled = true;
    repairs.push(
      `Replaced ${second.day}'s lower-body session with Upper Strength + Grip to avoid back-to-back high lower-body stress.`
    );
    analyses = analyseHybrid75Week(next);
  }

  return next;
}

function softenSundayAfterChallenge(schedule: DayPlan[], repairs: string[]): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  const analyses = analyseHybrid75Week(next);
  const sat = analyses.find((a) => a.day === "Sat" && a.challengeDay);
  const sunIdx = analyses.findIndex((a) => a.day === "Sun");
  if (!sat || sunIdx < 0) return next;

  const sun = analyses[sunIdx];
  if (!sun.classification.isRun && sun.classification.stress !== "hard") return next;

  let softened = softenRunToEasyModerate(sun.plan);
  if (classifyHybrid75Session(softened).isHardRun || classifyHybrid75Session(softened).stress === "hard") {
    softened = convertHardRunToEasyRun(sun.plan);
  }
  next = replaceAt(next, sunIdx, softened);
  repairs.push(`Kept ${sun.day}'s run easy-moderate after the weekend Hybrid Hard Challenge.`);
  return next;
}

function ensureChallengeOnSaturday(schedule: DayPlan[], repairs: string[]): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  const challengeIdx = next.findIndex((d) => isChallengeSession(d));
  if (challengeIdx < 0) return next;

  const challenge = next[challengeIdx];
  if (challenge.day === "Sat") return next;

  const satIdx = next.findIndex((d) => d.day === "Sat");
  if (satIdx < 0) return next;

  if (challenge.day === "Sun") {
    const displacedSat = next[satIdx];
    next[satIdx] = { ...challenge, day: "Sat" };
    if (!isChallengeSession(displacedSat)) {
      next[challengeIdx] = displacedSat.day === "Sun" ? displacedSat : { ...displacedSat, day: "Sun" };
    } else {
      next.splice(challengeIdx, 1);
    }
    repairs.push(
      "Moved Hybrid Hard Weekly Challenge to Saturday — keeping Sunday for easy aerobic recovery."
    );
    return sortScheduleByDay(next);
  }

  if (!isChallengeSession(next[satIdx])) {
    next[satIdx] = { ...challenge, day: "Sat" };
    next[challengeIdx] = { ...next[challengeIdx], title: "Recovery / Mobility", tags: ["recovery", "mobility"] };
    repairs.push("Moved Hybrid Hard Weekly Challenge to Saturday for weekend challenge placement.");
  }

  return next;
}

function fixHardWeekendStacking(schedule: DayPlan[], repairs: string[]): DayPlan[] {
  let next = sortScheduleByDay(schedule);
  const analyses = analyseHybrid75Week(next);
  const sat = analyses.find((a) => a.day === "Sat");
  const sun = analyses.find((a) => a.day === "Sun");
  if (!sat || !sun) return next;

  const satHardNonChallenge = sat.hardDay && !sat.challengeDay;
  const sunHard = sun.hardDay;

  if (satHardNonChallenge && sunHard) {
    if (sun.challengeDay) {
      next = replaceAt(next, sat.index, buildWeekendChallengeFromPlan(sat.plan));
      repairs.push(
        `Replaced ${sat.day}'s ${sat.plan.title} with Hybrid Hard Weekly Challenge to avoid hard Saturday + hard Sunday stacking.`
      );
    } else if (sun.classification.isRun) {
      next = replaceAt(next, sun.index, softenRunToEasyModerate(sun.plan));
      repairs.push(`Softened ${sun.day}'s run to easy-moderate to avoid hard weekend stacking.`);
    }
  }

  return next;
}

function buildWeekendChallengeFromPlan(_displaced: DayPlan): DayPlan {
  return {
    day: "Sat",
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
  };
}

function buildMethodologyNotes(
  ctx: Hybrid75SequencingContext,
  flags: { hybrid_leg_injected: boolean; lower_work_controlled: boolean }
): string[] {
  const notes: string[] = [];

  if (flags.lower_work_controlled) {
    notes.push("Lower-body intensity has been kept controlled so your key run sessions are not compromised.");
  }

  if (!flags.hybrid_leg_injected && (ctx.days_per_week <= 4 || ctx.ability_level === "beginner")) {
    notes.push(
      "Your full Hybrid Leg Endurance session is reserved for higher-availability weeks. This week prioritises run consistency, upper-body strength and the weekend challenge."
    );
  }

  if (shouldApplyCompressedHybrid75Format(ctx) && !shouldApplyDefaultHybrid75Format(ctx)) {
    notes.push(
      "Short Hybrid 75 Challenge Add-ons are included to help you reach the 3 run / 3 lift rules safely at your availability."
    );
  }

  return notes;
}

/** Apply Hybrid 75 hard/easy sequencing repairs to an existing free-week schedule. */
export function repairHybrid75Sequencing(
  schedule: DayPlan[],
  ctx: Hybrid75SequencingContext
): Hybrid75SequencingResult {
  const repairs_applied: string[] = [];
  const flags = { hybrid_leg_injected: false, lower_work_controlled: false };

  let next = sortScheduleByDay(schedule);

  next = applyDefaultHybrid75Format(next, ctx, repairs_applied, flags);
  next = fixBackToBackHardRuns(next, repairs_applied);
  next = fixAdjacentStrengthToUpper(next, ctx, repairs_applied, flags);
  next = injectHybridLegEndurance(next, ctx, repairs_applied, flags);
  next = fixBackToBackHardRuns(next, repairs_applied);
  next = fixBackToBackLowerStress(next, ctx, repairs_applied, flags);
  next = fixDaysAfterHybridLegEndurance(next, ctx, repairs_applied, flags);
  next = ensureChallengeOnSaturday(next, repairs_applied);
  next = fixHardWeekendStacking(next, repairs_applied);
  next = fixFridayBeforeSaturdayChallenge(next, ctx, repairs_applied, flags);
  next = fixDaysAfterHybridLegEndurance(next, ctx, repairs_applied, flags);
  next = softenSundayAfterChallenge(next, repairs_applied);
  if (shouldApplyDefaultHybrid75Format(ctx)) {
    next = applyDefaultHybrid75Format(next, ctx, repairs_applied, flags);
  } else if (shouldApplyCompressedHybrid75Format(ctx)) {
    next = applyCompressedHybrid75Format(next, ctx, repairs_applied);
  }

  next = next.map((day) => annotateDayPlanWithHybrid75Methodology(day));

  const analyses = analyseHybrid75Week(next);
  const methodology_notes = buildMethodologyNotes(ctx, flags);

  return {
    schedule: next,
    repairs_applied,
    methodology_notes,
    hybrid_leg_injected: flags.hybrid_leg_injected,
    lower_work_controlled: flags.lower_work_controlled,
    hard_easy_summary: buildHardEasySummary(analyses),
  };
}

export function countHybrid75Roles(schedule: DayPlan[]): {
  runs: number;
  lifts: number;
  mobility: number;
  upper_exposures: number;
  hybrid_leg_exposures: number;
  challenge: number;
} {
  let runs = 0;
  let lifts = 0;
  let mobility = 0;
  let upper_exposures = 0;
  let hybrid_leg_exposures = 0;
  let challenge = 0;

  for (const day of schedule) {
    const c = classifyHybrid75Session(day);
    if (c.isMobility) mobility += 1;
    if (countsTowardRunTarget(day)) runs += 1;
    if (countsTowardLiftTarget(day)) lifts += 1;
    if (c.isUpperSupport || isHybrid75ChallengeAddonLift(day)) upper_exposures += 1;
    if (isHybridLegSession(day) || c.primaryStimulus === "hybrid_leg_endurance") hybrid_leg_exposures += 1;
    if (c.primaryStimulus === "challenge") challenge += 1;
  }

  return { runs, lifts, mobility, upper_exposures, hybrid_leg_exposures, challenge };
}

export function countsTowardRunTarget(day: DayPlan): boolean {
  return classifyHybrid75Session(day).isRun;
}

export function countsTowardLiftTarget(day: DayPlan): boolean {
  const c = classifyHybrid75Session(day);
  return (
    c.isUpperSupport ||
    isHybrid75ChallengeAddonLift(day) ||
    c.isLowerStress ||
    c.primaryStimulus === "lower_strength" ||
    c.primaryStimulus === "hybrid_leg_endurance"
  );
}
