import type { AbilityLevel, DayKey, DayPlan, SessionBlock, UserEquipment } from "./sessionLibrary";

export type Hybrid75Stress = "easy" | "moderate" | "hard";

export type Hybrid75PrimaryStimulus =
  | "run_easy"
  | "run_hard"
  | "run_moderate"
  | "upper_strength"
  | "lower_strength"
  | "hybrid_leg_endurance"
  | "mobility"
  | "recovery"
  | "challenge"
  | "conditioning"
  | "other";

export type Hybrid75SessionClassification = {
  stress: Hybrid75Stress;
  primaryStimulus: Hybrid75PrimaryStimulus;
  isRun: boolean;
  isHardRun: boolean;
  isLowerStress: boolean;
  isUpperSupport: boolean;
  isMobility: boolean;
};

export type Hybrid75TemplateInput = {
  day: DayKey;
  ability_level: AbilityLevel;
  /** Form-style equipment strings from free-week assessment. */
  equipment?: string[];
  time_cap_minutes?: number;
};

const HARD_RUN_MARKERS = [
  "threshold",
  "threshold_run",
  "tempo",
  "tempo_run",
  "interval",
  "interval_run",
  "quality run",
  "hard run",
  "compromised run",
  "5 x 5 min",
  "3 x 5 min",
  "repeats",
  "efforts",
];

const QUALITY_RUN_TAGS = ["threshold_run", "tempo_run", "interval_run", "hard_run", "threshold", "tempo", "interval"];

const EASY_RUN_MARKERS = ["easy run", "easy aerobic", "aerobic support", "easy jog", "z2", "recovery run"];

const HARD_LOWER_MARKERS = [
  "lower body",
  "lower-body",
  "lower strength",
  "strength_lower",
  "legs",
  "leg endurance",
  "hybrid leg",
  "hybrid_leg_endurance",
  "sled",
  "lunges",
  "wall balls",
  "wall ball",
  "squat",
  "rdl",
  "deadlift",
];

const EASY_SUPPORT_MARKERS = [
  "upper strength",
  "upper_strength",
  "upper body",
  "upper-body",
  "strength_upper",
  "mobility",
  "recovery",
  "easy run",
  "easy aerobic",
  "core",
  "prehab",
  "easy bike",
  "easy erg",
  "grip",
];

const CHALLENGE_MARKERS = [
  "hybrid hard",
  "challenge_placeholder",
  "hybrid_hard_challenge",
  "hybrid75_challenge",
];

const MODERATE_MARKERS = ["long run", "long_run", "steady run", "steady aerobic", "full body", "strength_full", "strength endurance"];

function haystackForSession(session: Pick<DayPlan, "title" | "tags" | "intent" | "template_id" | "session">): string {
  const block = session.session ?? { main: [] };
  const parts = [
    session.title,
    session.intent ?? "",
    session.template_id ?? "",
    ...(session.tags ?? []),
    ...(block.main ?? []),
    ...(block.notes ?? []),
    ...(block.warm_up ?? []),
    ...(block.finish ?? []),
  ];
  return parts.join(" ").toLowerCase();
}

function includesAny(hay: string, markers: string[]): boolean {
  return markers.some((m) => hay.includes(m));
}

function isRestOrOff(hay: string, title: string): boolean {
  const t = title.toLowerCase();
  if (t.includes("rest day") || t.includes("off day")) return true;
  if (t.includes("recovery / mobility") || t.includes("recovery/mobility")) return false;
  if (t.includes("recovery") && !t.includes("mobility") && !t.includes("run") && !t.includes("threshold")) return true;
  return false;
}

function isStrengthSession(hay: string, tags: string[], title: string): boolean {
  const t = title.toLowerCase();
  if (t.includes("strength") || t.includes("lift") || t.includes("circuit")) return true;
  const sessionTags = contentTags(tags);
  if (sessionTags.some((tag) => tag.includes("strength") || tag.includes("hybrid_bodyweight"))) return true;
  return includesAny(hay, ["strength_lower", "strength_full", "strength_upper", "full body", "full-body"]);
}

function contentTags(tags: string[]): string[] {
  return tags.filter((t) => !t.startsWith("hybrid75_"));
}

function isQualityRunPattern(hay: string, tags: string[], title: string): boolean {
  if (isStrengthSession(hay, tags, title)) return false;
  const combined = `${title} ${hay}`.toLowerCase();
  const sessionTags = contentTags(tags);
  if (sessionTags.some((t) => QUALITY_RUN_TAGS.some((q) => t === q || t.includes(q)))) return true;
  if (includesAny(combined, HARD_RUN_MARKERS)) return true;
  if (/\d+\s*x\s*\d+\s*min/i.test(combined)) return true;
  if (/\d+\s*x\s*\d+\s*km/i.test(combined)) return true;
  if (/\d+\s*x\s*\d+\s*m\b/i.test(combined)) return true;
  return false;
}

function isRunSession(hay: string, tags: string[], title: string): boolean {
  if (isStrengthSession(hay, tags, title)) return false;
  const sessionTags = contentTags(tags);
  if (sessionTags.some((t) => t === "upper_strength" || t === "hybrid_leg_endurance")) return false;
  if (
    sessionTags.some((t) => t.includes("hybrid_compromised") || t === "hybrid_density" || t.includes("hybrid_bodyweight")) &&
    !sessionTags.some((t) => t.includes("run") || QUALITY_RUN_TAGS.includes(t))
  ) {
    return false;
  }
  return (
    isQualityRunPattern(hay, tags, title) ||
    hay.includes(" run") ||
    hay.startsWith("run") ||
    sessionTags.some((t) => t.includes("run")) ||
    includesAny(hay, ["aerobic run", "long run"])
  );
}

function isHardRunSession(hay: string, tags: string[], title: string, isRun: boolean): boolean {
  if (!isRun) return false;
  const sessionTags = contentTags(tags);
  if (sessionTags.includes("easy_run") || title.toLowerCase().includes("easy aerobic run")) return false;
  if (isQualityRunPattern(hay, tags, title)) return true;
  if (includesAny(hay, EASY_RUN_MARKERS)) return false;
  return hay.includes("compromised run");
}

function isEasyRunSession(
  hay: string,
  tags: string[],
  title: string,
  isRun: boolean,
  isHardRun: boolean
): boolean {
  if (!isRun || isHardRun) return false;
  if (isQualityRunPattern(hay, tags, title)) return false;
  return includesAny(hay, EASY_RUN_MARKERS) || hay.includes("aerobic support");
}

function isChallengeSession(hay: string, tags: string[]): boolean {
  return includesAny(hay, CHALLENGE_MARKERS) || tags.some((t) => CHALLENGE_MARKERS.some((m) => t.includes(m)));
}

function isHybridLegEndurance(hay: string, tags: string[], title: string): boolean {
  return tags.includes("hybrid_leg_endurance") || title.toLowerCase().includes("hybrid leg endurance");
}

function isUpperStrengthSupport(hay: string, tags: string[], title: string): boolean {
  const t = title.toLowerCase();
  const isStandaloneUpperAddon =
    t.includes("upper/core challenge add-on") && !t.includes("threshold");
  const isGripCoreAddon =
    (t.includes("grip") && t.includes("core challenge add-on")) ||
    t.includes("mobility + grip/core challenge add-on");
  return (
    tags.includes("upper_strength") ||
    isStandaloneUpperAddon ||
    isGripCoreAddon ||
    hay.includes("upper strength + grip") ||
    (includesAny(hay, ["upper strength", "upper_strength", "strength_upper"]) &&
      !includesAny(hay, HARD_LOWER_MARKERS) &&
      !t.includes("threshold"))
  );
}

function isMobilitySession(hay: string, tags: string[]): boolean {
  return tags.includes("mobility") || tags.includes("hybrid75_mobility") || hay.includes("mobility");
}

function isLowerStressSession(
  hay: string,
  tags: string[],
  title: string,
  classification: Partial<Hybrid75SessionClassification>
): boolean {
  if (classification.isHardRun) return false;
  if (tags.includes("easy_run") || tags.includes("upper_strength") || tags.includes("upper_strength_a") || tags.includes("upper_strength_b")) {
    return false;
  }
  if (tags.includes("hybrid75_addon_lift") || tags.includes("challenge_addon_lift")) return false;
  if (tags.includes("mobility") && (tags.includes("easy_run") || tags.includes("aerobic_support"))) return false;
  if (isHybridLegEndurance(hay, tags, title)) return true;
  if (isUpperStrengthSupport(hay, tags, title)) return false;
  const structuralHay = [title, ...tags, ...(hay.match(/strength_lower|hybrid_compromised|squat|deadlift|lunge|wall ball/gi) ?? [])].join(" ").toLowerCase();
  return (
    includesAny(structuralHay, HARD_LOWER_MARKERS.filter((m) => m !== "lower-body" && m !== "lower body")) ||
    structuralHay.includes("strength_lower") ||
    structuralHay.includes("hybrid_compromised")
  );
}

function resolveStress(
  hay: string,
  tags: string[],
  ctx: {
    isRun: boolean;
    isHardRun: boolean;
    isEasyRun: boolean;
    isChallenge: boolean;
    isHybridLeg: boolean;
    isUpperSupport: boolean;
    isMobility: boolean;
  }
): Hybrid75Stress {
  if (ctx.isChallenge || ctx.isHardRun || ctx.isHybridLeg) return "hard";
  if (ctx.isUpperSupport || ctx.isMobility || ctx.isEasyRun) return "easy";
  if (includesAny(hay, ["hard conditioning", "hybrid_compromised", "hybrid_density"]) && !ctx.isUpperSupport) {
    return "hard";
  }
  if (includesAny(hay, MODERATE_MARKERS) || ctx.isRun) return "moderate";
  if (includesAny(hay, EASY_SUPPORT_MARKERS)) return "easy";
  if (includesAny(hay, HARD_LOWER_MARKERS)) return "hard";
  return "moderate";
}

function resolvePrimaryStimulus(
  hay: string,
  tags: string[],
  title: string,
  ctx: {
    isRun: boolean;
    isHardRun: boolean;
    isEasyRun: boolean;
    isChallenge: boolean;
    isHybridLeg: boolean;
    isUpperSupport: boolean;
    isMobility: boolean;
    stress: Hybrid75Stress;
  }
): Hybrid75PrimaryStimulus {
  if (ctx.isChallenge) return "challenge";
  if (ctx.isHybridLeg) return "hybrid_leg_endurance";
  if (ctx.isUpperSupport) return "upper_strength";
  if (ctx.isMobility) return "mobility";
  if (ctx.isHardRun) return "run_hard";
  if (isRestOrOff(hay, title)) return "recovery";
  if (ctx.isEasyRun) return "run_easy";
  if (ctx.isRun) return "run_moderate";
  if (ctx.stress === "hard" && isLowerStressSession(hay, tags, title, ctx)) return "lower_strength";
  if (includesAny(hay, ["conditioning", "hybrid", "density"])) return "conditioning";
  if (includesAny(hay, ["strength", "lift"])) return "lower_strength";
  return "other";
}

/** Classify a free-week DayPlan for Hybrid 75 stress / stimulus logic. */
export function classifyHybrid75Session(session: Pick<DayPlan, "title" | "tags" | "intent" | "template_id" | "session">): Hybrid75SessionClassification {
  const tags = (session.tags ?? []).map((t) => t.toLowerCase());
  const hay = haystackForSession(session);
  const title = session.title;

  const isChallenge = isChallengeSession(hay, tags);
  const isHybridLeg = isHybridLegEndurance(hay, tags, title);
  const isUpperSupport = isUpperStrengthSupport(hay, tags, title);
  const isMobility = isMobilitySession(hay, tags);
  const isRun = isRunSession(hay, tags, title) && !isChallenge && !isHybridLeg && !isUpperSupport;
  const isHardRun = isHardRunSession(hay, tags, title, isRun);
  const isEasyRun = isEasyRunSession(hay, tags, title, isRun, isHardRun);

  const stress = resolveStress(hay, tags, {
    isRun,
    isHardRun,
    isEasyRun,
    isChallenge,
    isHybridLeg,
    isUpperSupport,
    isMobility,
  });

  const partial = { isHardRun, isUpperSupport };
  const isLowerStress = isLowerStressSession(hay, tags, title, partial);
  const primaryStimulus = resolvePrimaryStimulus(hay, tags, title, {
    isRun,
    isHardRun,
    isEasyRun,
    isChallenge,
    isHybridLeg,
    isUpperSupport,
    isMobility,
    stress,
  });

  return {
    stress,
    primaryStimulus,
    isRun,
    isHardRun,
    isLowerStress,
    isUpperSupport,
    isMobility,
  };
}

/** Derive Hybrid 75 methodology tags to merge onto a schedule item. */
export function getHybrid75SessionTags(
  session: Pick<DayPlan, "title" | "tags" | "intent" | "template_id" | "session">,
  classification?: Hybrid75SessionClassification
): string[] {
  const c = classification ?? classifyHybrid75Session(session);
  const tags = new Set<string>([
    `hybrid75_stress_${c.stress}`,
    `hybrid75_stimulus_${c.primaryStimulus}`,
  ]);

  if (c.isRun) tags.add("hybrid75_run");
  if (c.isHardRun) tags.add("hybrid75_hard_run");
  if (c.isUpperSupport) tags.add("hybrid75_upper_support");
  if (c.isLowerStress) tags.add("hybrid75_lower_stress");
  if (c.isMobility) tags.add("hybrid75_mobility");

  return [...tags];
}

function normalizeEquipmentList(equipment?: string[]): {
  fullGym: boolean;
  dumbbellsOnly: boolean;
  bodyweight: boolean;
  hasBike: boolean;
  hasRower: boolean;
  hasSki: boolean;
} {
  const list = (equipment ?? []).map((e) => e.toLowerCase());
  const has = (needle: string) => list.some((e) => e.includes(needle));
  return {
    fullGym: has("full gym"),
    dumbbellsOnly: has("dumbbell"),
    bodyweight: has("bodyweight") || has("none"),
    hasBike: has("bike") || has("spin"),
    hasRower: has("rower"),
    hasSki: has("skierg"),
  };
}

function defaultSupportPriority(): DayPlan["priority"] {
  return {
    rank: 2,
    label: "priority_2",
    display_label: "Priority 2",
    category_label: "Support Session",
    reason: "Upper-body support work — keeps leg fatigue manageable between hard run / lower days.",
  };
}

function defaultHardLowerPriority(): DayPlan["priority"] {
  return {
    rank: 1,
    label: "priority_1",
    display_label: "Priority 1",
    category_label: "Key Session",
    reason: "Hybrid leg endurance — builds lower-body durability without max-strength loading.",
  };
}

function buildUpperStrengthABlock(
  equipment: ReturnType<typeof normalizeEquipmentList>,
  level: AbilityLevel
): SessionBlock {
  const volNote =
    level === "beginner"
      ? "Keep 2–3 reps in reserve. Prioritise clean form over load."
      : "Controlled effort — leave 1–2 reps in reserve on main lifts.";

  if (equipment.bodyweight && !equipment.fullGym && !equipment.dumbbellsOnly) {
    return {
      warm_up: ["5–8 min easy movement + scap/shoulder prep"],
      main: [
        "Pull-ups or band lat pulldown: 4 x 6–10",
        "Press-ups or elevated press-ups: 4 x 6–10",
        "Inverted row or band row: 3 x 8–12",
        "Pike press or DB shoulder press if available: 3 x 6–10",
        "Farmer hold / towel grip hold: 4 x 30–45 sec",
        "Core finisher: 6–8 min",
      ],
      notes: [volNote, "Strength-bias upper day — no heavy leg work."],
    };
  }

  if (equipment.dumbbellsOnly && !equipment.fullGym) {
    return {
      warm_up: ["5–8 min easy movement + band/shoulder prep if available"],
      main: [
        "Single-arm DB row or band pulldown: 4 x 8–12 each side",
        "DB incline press or floor press: 4 x 6–10",
        "Chest-supported or bent-over DB row: 3 x 8–12",
        "DB shoulder press: 3 x 6–10",
        "DB farmer hold: 4 x 30–45 sec",
        "Core finisher (dead bug / pallof / plank): 6–8 min",
      ],
      notes: [volNote],
    };
  }

  return {
    warm_up: ["5–8 min easy movement + scap/shoulder prep"],
    main: [
      "Pull-ups or lat pulldown: 4 x 6–10",
      "DB incline press or bench press: 4 x 6–10",
      "Chest-supported row or single-arm row: 3 x 8–12",
      "Shoulder press: 3 x 6–10",
      "Farmer hold / DB grip hold: 4 x 30–45 sec",
      "Core finisher: 6–8 min",
    ],
    notes: [volNote, "Strength-bias upper day — keep leg fatigue low."],
  };
}

function buildUpperStrengthBBlock(
  equipment: ReturnType<typeof normalizeEquipmentList>,
  level: AbilityLevel
): SessionBlock {
  const volNote =
    level === "beginner"
      ? "Keep reps controlled — this is volume support, not max effort."
      : "Volume + grip day — stop 1–2 reps short on pressing work.";

  if (equipment.bodyweight && !equipment.fullGym && !equipment.dumbbellsOnly) {
    return {
      warm_up: ["5 min easy movement + shoulder/scap prep"],
      main: [
        "Inverted row or band row: 4 x 8–12",
        "Press-ups: 3–4 x 10–15",
        "Band pulldown or pull-up variation: 3 x 8–12",
        "Band pull-apart or rear delt fly: 3 x 12–20",
        "Dead hang or grip hold: 3–4 x 30–45 sec",
        "Plank / side plank / dead bug circuit: 6–8 min",
      ],
      notes: [volNote],
    };
  }

  if (equipment.dumbbellsOnly && !equipment.fullGym) {
    return {
      warm_up: ["5 min easy movement + shoulder prep"],
      main: [
        "Single-arm DB row: 4 x 8–12 each side",
        "Press-ups or DB press variation: 3–4 x 10–15",
        "Lat pulldown substitute / band pulldown: 3 x 8–12",
        "DB lateral raise or rear delt raise: 3 x 12–20",
        "Farmer hold / dead hang: 3–4 x 30–45 sec",
        "Core circuit (plank / side plank / dead bug): 6–8 min",
      ],
      notes: [volNote],
    };
  }

  return {
    warm_up: ["5–8 min easy movement + scap/shoulder prep"],
    main: [
      "Row variation (cable / chest-supported / single-arm): 4 x 8–12",
      "Press-up or DB press variation: 3–4 x 10–15",
      "Lat pulldown / pull-up variation: 3 x 8–12",
      "Lateral raise or rear delt raise: 3 x 12–20",
      "Carry / farmer hold / dead hang: 3–4 x 30–45 sec",
      "Core: plank / side plank / dead bug circuit — 6–8 min",
    ],
    notes: [volNote, "Volume + grip upper day — legs stay fresh."],
  };
}

function buildUpperStrengthBlock(equipment: ReturnType<typeof normalizeEquipmentList>, level: AbilityLevel): SessionBlock {
  const volNote =
    level === "beginner"
      ? "Keep 2–3 reps in reserve. Prioritise clean form over load."
      : level === "advanced"
      ? "Last 1–2 reps should feel challenging but controlled."
      : "Controlled effort — leave 1–2 reps in reserve on main lifts.";

  if (equipment.bodyweight && !equipment.fullGym && !equipment.dumbbellsOnly) {
    return {
      warm_up: ["5 min easy movement + shoulder/scap prep"],
      main: [
        "Press-ups: 4 x 6–12 (elevated if needed)",
        "Inverted row or band row: 4 x 6–12",
        "Pike press or DB shoulder press if available: 3 x 6–10",
        "Side plank + dead bug core circuit: 6–8 min",
      ],
      finish: ["Grip hold (DB/towel/backpack if available): 4 x 30–45 sec"],
      notes: [volNote, "Upper support day — no heavy leg work."],
    };
  }

  if (equipment.dumbbellsOnly && !equipment.fullGym) {
    return {
      warm_up: ["5 min easy movement + band/shoulder prep if available"],
      main: [
        "Single-arm DB row: 4 x 8–12 each side",
        "DB incline press or floor press: 4 x 6–10",
        "DB shoulder press: 3 x 6–10",
        "Press-ups: 2–3 sets controlled",
        "DB farmer hold: 4 x 30–45 sec",
        "Core finisher (dead bug / pallof / plank): 6–8 min",
      ],
      notes: [volNote],
    };
  }

  return {
    warm_up: ["5–8 min easy movement + scap/shoulder prep"],
    main: [
      "Pull-ups or lat pulldown: 4 x 6–10",
      "DB incline press or press-up variation: 4 x 6–10",
      "Chest-supported row or single-arm row: 3 x 8–12",
      "Shoulder press: 3 x 6–10",
      "Push-ups: 2–3 controlled sets",
      "DB farmer hold / grip hold: 4 x 30–45 sec",
      "Core finisher: 6–8 min",
    ],
    notes: [volNote, "Upper support day — keep leg fatigue low."],
  };
}

function buildHybridLegBlock(
  equipment: ReturnType<typeof normalizeEquipmentList>,
  level: AbilityLevel
): SessionBlock {
  const rounds = level === "beginner" ? 2 : level === "advanced" ? 4 : 3;
  const compoundSets = level === "beginner" ? "3 x 8–10" : "4 x 8–10";
  const erg =
    equipment.hasBike || equipment.hasRower || equipment.hasSki
      ? "45–60 sec bike / row / SkiErg moderate-hard"
      : "45–60 sec squat thrusts or step-ups moderate-hard";

  const squat =
    equipment.fullGym && !equipment.dumbbellsOnly
      ? "Tempo squat / hack squat: "
      : "Goblet squat / rucksack squat: ";

  const rdl =
    equipment.dumbbellsOnly || !equipment.fullGym
      ? "DB / rucksack Romanian deadlift: "
      : "Romanian deadlift: ";

  const circuitLoad =
    level === "beginner"
      ? "12 wall balls or DB thrusters (light-moderate)"
      : level === "advanced"
      ? "12 wall balls or DB thrusters (moderate-heavy)"
      : "12 wall balls or DB thrusters";

  return {
    warm_up: ["8–10 min easy bike/row or brisk walk + hip/ankle prep"],
    main: [
      `A) Strength endurance compound — ${squat}${compoundSets} (controlled tempo, 60–90 sec rest)`,
      `B) Posterior chain — ${rdl}3 x 8–10 (controlled)`,
      "C) Single-leg durability — walking or reverse lunges: 3 x 12–20 steps",
      `D) Hybrid leg circuit — ${rounds} rounds:`,
      `   • ${circuitLoad}`,
      "   • 12–16 alternating lunges",
      "   • 12 box step-ups or step-ups",
      `   • ${erg}`,
      "   • rest 90 sec between rounds",
    ],
    finish: ["E) Optional: calf raises 3 x 15–20", "Wall sit 2 x 45–60 sec"],
    notes: [
      level === "beginner"
        ? "Keep RPE 6–7/10. Reduce rounds or load if legs feel heavy from running."
        : "Hard lower hybrid day — prioritise quality over max load.",
      "This is endurance/durability work, not a max-strength session.",
    ],
  };
}

/** Hybrid 75 Monday upper session — strength bias (pull, press, grip, core). */
export function createUpperStrengthASession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);
  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 45 : input.ability_level === "advanced" ? 60 : 55);

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-UPPER-A",
    title: "Upper Strength — Strength Bias",
    intent: "Build push/pull strength, trunk control and grip without adding lower-body fatigue.",
    tags: ["upper_strength", "upper_strength_a", "strength_upper", "hybrid75_strength"],
    time_cap_minutes: timeCap,
    session: buildUpperStrengthABlock(equipment, input.ability_level),
    priority: defaultSupportPriority(),
  });
}

/** Hybrid 75 Wednesday upper session — volume + grip emphasis. */
export function createUpperStrengthBSession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);
  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 45 : input.ability_level === "advanced" ? 55 : 50);

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-UPPER-B",
    title: "Upper Strength — Volume + Grip",
    intent: "Add upper-body volume, shoulder durability and grip capacity while keeping the legs fresh.",
    tags: ["upper_strength", "upper_strength_b", "strength_upper", "hybrid75_strength"],
    time_cap_minutes: timeCap,
    session: buildUpperStrengthBBlock(equipment, input.ability_level),
    priority: defaultSupportPriority(),
  });
}

/** Hybrid 75 upper-body support lift — easy/moderate stress, not lower-body loading. */
export function createUpperStrengthGripSession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);

  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 45 : input.ability_level === "advanced" ? 60 : 55);

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-UPPER-GRIP",
    title: "Upper Strength + Grip",
    intent: "Build upper-body strength, grip and trunk durability without adding unnecessary leg fatigue.",
    tags: ["upper_strength", "strength_upper"],
    time_cap_minutes: timeCap,
    session: buildUpperStrengthBlock(equipment, input.ability_level),
    priority: defaultSupportPriority(),
  });
}

/** Hybrid 75 leg endurance hybrid lower session — hard lower-body stress. */
export function createHybridLegEnduranceSession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);

  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 50 : input.ability_level === "advanced" ? 75 : 65);

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-LEG-ENDURANCE",
    title: "Hybrid Leg Endurance",
    intent:
      "Build leg durability, local muscular endurance and hybrid lower-body capacity without chasing a max-strength stimulus.",
    tags: ["hybrid_leg_endurance", "strength_lower", "hybrid"],
    time_cap_minutes: timeCap,
    session: buildHybridLegBlock(equipment, input.ability_level),
    priority: defaultHardLowerPriority(),
  });
}

/** Sunday easy longer run — run 3 of 3 for Hybrid 75 default format. */
export function createEasyLongRunSession(input: Hybrid75TemplateInput): DayPlan {
  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 50 : input.ability_level === "advanced" ? 75 : 65);
  const duration =
    input.ability_level === "beginner" ? "45–55 min" : input.ability_level === "advanced" ? "60–75 min" : "50–65 min";

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-EASY-LONG-RUN",
    title: "Easy Long Run / Aerobic Base",
    intent: "Easy aerobic base — conversational throughout. This is your third run exposure for the Hybrid 75 week.",
    tags: ["run", "aerobic_support", "easy_run", "long_run", "hybrid75_run"],
    time_cap_minutes: timeCap,
    session: {
      main: [`${duration} easy run or run-walk — RPE 3–4/10, fully conversational`],
      notes: [
        "Hybrid 75 run 3 of 3 — keep this genuinely easy after the weekend challenge.",
        "Prioritise time on feet and aerobic base, not pace.",
      ],
    },
    priority: defaultSupportPriority(),
  });
}

/** Easy run + mobility recovery day — for use after Hybrid Leg Endurance. */
export function createEasyRunMobilitySession(input: Hybrid75TemplateInput): DayPlan {
  const timeCap =
    input.time_cap_minutes ??
    (input.ability_level === "beginner" ? 40 : input.ability_level === "advanced" ? 55 : 45);

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-EASY-RUN-MOBILITY",
    title: "Easy Run + Mobility",
    intent: "Easy aerobic flush and mobility after hard lower-body work — keep effort genuinely easy.",
    tags: ["run", "aerobic_support", "easy_run", "mobility"],
    time_cap_minutes: timeCap,
    session: {
      main: [
        "20–30 min easy run or brisk walk — RPE 3–4/10, fully conversational",
        "10–15 min mobility: hips, ankles, hamstrings, T-spine",
      ],
      notes: ["Recovery day after hard lower work — no hard running or lower loading."],
    },
    priority: defaultSupportPriority(),
  });
}

/** Low-impact recovery aerobic — bike/row/walk when a run is not ideal after leg endurance. */
export function createRecoveryAerobicSession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);
  const ergMain =
    equipment.hasBike || equipment.hasRower
      ? "20–30 min easy spin bike or row — RPE 3–4/10, smooth cadence"
      : "20–30 min easy walk or light bike — RPE 3–4/10, fully conversational";

  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-RECOVERY-AEROBIC",
    title: "Recovery Aerobic",
    intent: "Low-impact aerobic recovery after hard lower-body work — flush legs without loading.",
    tags: ["aerobic_support", "aerobic", "easy_run"],
    time_cap_minutes: input.time_cap_minutes ?? 40,
    session: {
      main: [ergMain, "Optional: 8–10 min easy mobility if time allows"],
      notes: ["Keep this genuinely easy — support recovery before the next key session."],
    },
    priority: defaultSupportPriority(),
  });
}

function buildUpperCoreAddonBlock(equipment: ReturnType<typeof normalizeEquipmentList>): SessionBlock {
  const row =
    equipment.dumbbellsOnly || equipment.fullGym
      ? "Band row / DB row / towel row: 2–3 sets"
      : "Band row / towel row / inverted row: 2–3 sets";
  const press = equipment.dumbbellsOnly
    ? "DB incline press-ups or floor press: 2–3 controlled sets"
    : "Press-ups or incline press-ups: 2–3 controlled sets";

  return {
    main: [press, row, "Dead bug or plank: 2–3 sets", "Optional DB hold / dead hang: 2–3 x 20–30 sec"],
    notes: ["Hybrid 75 Challenge Add-on — low-stress upper/core work. Keep all sets easy and controlled."],
  };
}

function buildGripCoreAddonBlock(): SessionBlock {
  return {
    main: [
      "Farmer hold / suitcase hold / dead hang: 3 x 20–30 sec",
      "Side plank: 2 x 20–30 sec each side",
      "Push-up variation: 2 controlled sets",
      "Mobility: 5 min hips / T-spine / shoulders",
    ],
    notes: ["Hybrid 75 Challenge Add-on — grip, trunk and mobility support. No leg loading."],
  };
}

/** Short upper/core lift add-on for compressed Hybrid 75 weeks. */
export function createUpperCoreChallengeAddonSession(input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);
  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-ADDON-UPPER-CORE",
    title: "Upper/Core Challenge Add-on",
    intent: "Short upper-body and core support to count toward Hybrid 75 lift rules without leg fatigue.",
    tags: ["upper_strength", "challenge_addon_lift", "hybrid75_addon_lift", "hybrid75_strength"],
    time_cap_minutes: input.time_cap_minutes ?? 20,
    session: buildUpperCoreAddonBlock(equipment),
    priority: defaultSupportPriority(),
  });
}

/** Short grip/core + mobility add-on for compressed Hybrid 75 weeks. */
export function createGripCoreChallengeAddonSession(input: Hybrid75TemplateInput): DayPlan {
  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-ADDON-GRIP-CORE",
    title: "Grip + Core Challenge Add-on",
    intent: "Light grip, trunk and mobility support — counts toward Hybrid 75 lift rules at low stress.",
    tags: [
      "upper_strength",
      "mobility",
      "challenge_addon_lift",
      "hybrid75_addon_lift",
      "hybrid75_strength",
      "hybrid75_mobility",
    ],
    time_cap_minutes: input.time_cap_minutes ?? 20,
    session: buildGripCoreAddonBlock(),
    priority: defaultSupportPriority(),
  });
}

/** Mobility day combined with grip/core add-on for compressed weeks. */
export function createMobilityGripCoreChallengeAddonSession(input: Hybrid75TemplateInput): DayPlan {
  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-ADDON-MOBILITY-GRIP",
    title: "Mobility + Grip/Core Challenge Add-on",
    intent: "Mobility plus short grip/core support — helps meet Hybrid 75 lift and mobility rules safely.",
    tags: [
      "mobility",
      "upper_strength",
      "challenge_addon_lift",
      "hybrid75_addon_lift",
      "hybrid75_strength",
      "hybrid75_mobility",
    ],
    time_cap_minutes: input.time_cap_minutes ?? 25,
    session: {
      main: [
        "10–15 min mobility: hips, ankles, T-spine, shoulders",
        "Farmer hold / suitcase hold / dead hang: 3 x 20–30 sec",
        "Side plank: 2 x 20–30 sec each side",
        "Push-up variation: 2 controlled sets",
      ],
      notes: ["Hybrid 75 Challenge Add-on day — keep everything easy and restorative."],
    },
    priority: defaultSupportPriority(),
  });
}

/** Short easy run add-on for compressed Hybrid 75 weeks. */
export function createEasyRunAddonSession(input: Hybrid75TemplateInput): DayPlan {
  return annotateDayPlanWithHybrid75Methodology({
    day: input.day,
    template_id: "HYBRID75-ADDON-EASY-RUN",
    title: "Easy Run Add-on",
    intent: "Short easy aerobic add-on — counts toward Hybrid 75 run rules at low stress.",
    tags: ["run", "aerobic_support", "easy_run", "hybrid75_run", "hybrid75_addon_run"],
    time_cap_minutes: input.time_cap_minutes ?? 30,
    session: {
      main: ["15–25 min easy run or walk-run — RPE 3–4/10, fully conversational"],
      notes: ["Optional: 5–10 min easy mobility after. Hybrid 75 Challenge Add-on — no hard running."],
    },
    priority: defaultSupportPriority(),
  });
}

/** Merge upper/core add-on onto an existing quality run day (same-day add-on). */
export function mergeUpperCoreAddonIntoSession(day: DayPlan, input: Hybrid75TemplateInput): DayPlan {
  const equipment = normalizeEquipmentList(input.equipment);
  const addon = buildUpperCoreAddonBlock(equipment);
  const title = day.title.includes("Add-on") ? day.title : `${day.title} + Upper/Core Add-on`;

  return annotateDayPlanWithHybrid75Methodology({
    ...day,
    title,
    tags: [
      ...new Set([
        ...(day.tags ?? []),
        "hybrid75_addon_lift",
        "challenge_addon_lift",
      ]),
    ],
    session: {
      ...day.session,
      finish: [
        ...(day.session.finish ?? []),
        "--- Upper/Core Challenge Add-on (after run) ---",
        ...addon.main,
      ],
      notes: [...(day.session.notes ?? []), ...(addon.notes ?? [])],
    },
  });
}

export function isHybrid75ChallengeAddonLift(day: DayPlan): boolean {
  return (day.tags ?? []).some((t) => t === "hybrid75_addon_lift" || t === "challenge_addon_lift");
}

export function isHybrid75ChallengeAddonRun(day: DayPlan): boolean {
  return (day.tags ?? []).includes("hybrid75_addon_run") || day.title.toLowerCase().includes("easy run add-on");
}

/** Merge methodology tags onto an existing day plan without replacing session content. */
export function annotateDayPlanWithHybrid75Methodology(day: DayPlan): DayPlan {
  const classification = classifyHybrid75Session(day);
  const methodologyTags = getHybrid75SessionTags(day, classification);
  const preservedTags = (day.tags ?? []).filter(
    (t) =>
      !t.startsWith("hybrid75_stress_") &&
      !t.startsWith("hybrid75_stimulus_") &&
      t !== "hybrid75_hard_run" &&
      t !== "hybrid75_run" &&
      t !== "hybrid75_strength" &&
      t !== "hybrid75_upper_support" &&
      t !== "hybrid75_lower_stress" &&
      t !== "hybrid75_mobility"
  );
  return {
    ...day,
    tags: [...new Set([...preservedTags, ...methodologyTags])],
  };
}
