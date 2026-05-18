/**
 * Pure rationale generator — no side effects.
 * Takes mapped programme input + raw assessment fields and produces
 * personalised coach-voiced copy for the whole programme and each week.
 */

import type { PaidProgrammeInput } from "./generate12WeekProgramme";
import type { GoalFocus, WeeklyHoursBand } from "./sessionLibrary";
import type { PaidProgrammeIntelligence } from "./paidProgrammeIntelligence";

// ─── Public types ────────────────────────────────────────────────────────────

export type ProgrammeRationale = {
  headline: string;
  summary: string[];
  key_priorities: string[];
  why_this_structure: string;
  how_to_get_the_most_from_it: string[];
};

export type WeekRationale = {
  week_role: string;
  why_this_week_matters: string;
  key_sessions_to_prioritise: string[];
  coach_note: string;
  /** This week's progression emphasis (paid programmes). */
  progression_focus?: string;
  /** What changed vs the prior week. */
  what_progressed_from_last_week?: string;
  /** Primary measurable marker for the week. */
  key_marker_this_week?: string;
};

// ─── Assessment context (subset of what the API has) ─────────────────────────

export type RationaleContext = {
  input: PaidProgrammeInput;
  /** Raw fields from athlete_assessments that are useful for copy but not engine inputs */
  assessment?: {
    event_type?: string | null;
    event_date?: string | null;
    target_time?: string | null;
    biggest_limiter?: string | null;
    injury_flags?: string[] | null;
    movements_to_avoid?: string[] | null;
    hyrox_pb?: string | null;
    hyrox_experience?: string | null;
    strength_experience?: string | null;
    /** Original assessment goal label — used by intelligence limiter inference */
    goal_focus_raw?: string | null;
    current_run_volume_band?: string | null;
  };
  hasBaseline5k?: boolean;
  hasBenchmarkTests?: boolean;
  double_session_days?: string[];
  benchmark_signals?: import("./paidProgrammeIntelligence").BenchmarkSignals;
  /** Set by generate12WeekProgramme after buildPaidProgrammeIntelligence */
  intelligence?: PaidProgrammeIntelligence | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function first_name(input: PaidProgrammeInput): string {
  return input.first_name?.trim() || "Athlete";
}

function goalHeadline(
  goal: GoalFocus,
  eventType: string | null | undefined,
  intel?: PaidProgrammeIntelligence | null
): string {
  if (goal === "muscle") return "Build Strength Without Losing Your Fitness";
  if (goal === "running") return "Run Faster & Build Your Engine";
  if (intel?.event_specificity === "hyrox_pro") return "12 Weeks Built for Hyrox Pro Readiness";
  if (intel?.event_specificity === "hyrox_open") return "Hyrox Open — 12 Progressive Weeks to Race Readiness";
  if (intel?.event_specificity === "hyrox_doubles") return "12 Weeks for Hyrox Doubles-Ready Fitness";
  if (intel?.event_specificity === "running_race") return "Running Race — Pace, Volume & Durability";
  if (intel?.event_mode === "general") return "A Personalised Hybrid Fitness Plan";
  if (eventType && !/no event/i.test(eventType)) {
    return `12 Weeks Built Around Your Hybrid Performance`;
  }
  return "A Personalised Hybrid Fitness Plan";
}

function goalSentence(
  goal: GoalFocus,
  days: number,
  band: WeeklyHoursBand,
  intel?: PaidProgrammeIntelligence | null
): string {
  const timeStr = band === "2-3" ? "a tighter schedule"
    : band === "3-5" ? "3–5 hours per week"
    : band === "5-7" ? "5–7 hours per week"
    : band === "7-10" ? "7–10 hours per week"
    : "10+ hours per week";

  if (goal === "running") {
    return `This plan is built around ${days} training days and ${timeStr}, with running quality at the core and strength providing durability support.`;
  }
  if (goal === "muscle") {
    return `This plan prioritises strength development across ${days} training days and ${timeStr}, with enough conditioning to keep you athletic and fit.`;
  }
  if (intel?.event_mode === "general") {
    return `This 12-week plan covers ${days} training days and ${timeStr}, mixing steady running, strength, and conditioning so you get fitter, stronger, and more capable without tying everything to a single race storyline.`;
  }
  return `This 12-week plan covers ${days} training days and ${timeStr}, balancing threshold running, erg work, compromised efforts, and strength to develop complete hybrid performance.`;
}

function eventSentence(ctx: RationaleContext): string | null {
  const { assessment } = ctx;
  if (ctx.intelligence?.event_mode === "general") return null;
  if (!assessment?.event_type) return null;
  if (/no event/i.test(assessment.event_type)) return null;

  const datePart = assessment.event_date
    ? ` on ${new Date(assessment.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  const timePart = assessment.target_time ? ` — targeting ${assessment.target_time}` : "";

  return `Your training is targeted at ${assessment.event_type}${datePart}${timePart}. The 12 weeks build progressively toward that performance window.`;
}

const LIMITER_LABEL: Record<PaidProgrammeIntelligence["limiter_focus"], string> = {
  running_endurance: "running endurance and aerobic repeatability",
  running_speed: "running speed, intervals, and pace control",
  strength: "strength development and lift quality",
  hyrox_stations: "Hyrox station durability under fatigue",
  body_composition: "sustainable body-composition progress",
  recovery: "low-impact options and conservative progression",
  consistency: "repeatable weeks and clear session priorities",
  general: "balanced hybrid development",
};

function limiterSentence(ctx: RationaleContext): string | null {
  const limiterRaw = ctx.assessment?.biggest_limiter?.trim();
  const intel = ctx.intelligence;

  if (intel && intel.limiter_focus !== "general") {
    const label = LIMITER_LABEL[intel.limiter_focus];
    if (limiterRaw) {
      return `You identified "${limiterRaw}" as your biggest limiter — this programme leans into ${label} so training stress matches what actually moves your performance.`;
    }
    return `Your answers point to ${label} as the main lever — priorities and coach copy reflect that while keeping the 12-week arc balanced.`;
  }

  if (!limiterRaw) return null;
  return `You identified your biggest limiter as "${limiterRaw}" — this plan directly addresses that as a structured priority across all three blocks.`;
}

function injurySentence(ctx: RationaleContext): string | null {
  const flags = ctx.assessment?.injury_flags?.filter(Boolean);
  const avoids = ctx.assessment?.movements_to_avoid?.filter(Boolean);
  if (!flags?.length && !avoids?.length) return null;
  const parts: string[] = [];
  if (flags?.length) parts.push(`injury/limitation notes (${flags.join(", ")})`);
  if (avoids?.length) parts.push(`movements to avoid (${avoids.join(", ")})`);
  const base = `We have accounted for your ${parts.join(" and ")}. The plan uses conservative loading and smart substitutions throughout.`;
  if (ctx.intelligence?.impact_risk === "high") {
    return `${base} Progression stays deliberately cautious — if something aggravates symptoms, use the low-impact swap paths immediately.`;
  }
  return base;
}

function baselineSentence(ctx: RationaleContext): string {
  if (ctx.hasBenchmarkTests || ctx.hasBaseline5k) {
    const conf = ctx.intelligence?.benchmark_confidence;
    const sig = ctx.benchmark_signals;
    if (conf === "high") {
      return "Your baseline markers are embedded in the plan — bodyweight, run, engine, and strength where you logged them — giving strong objective anchors for retests at Weeks 4, 8, and 12.";
    }
    if (conf === "medium") {
      return "Your baseline data anchors pace and hybrid context; logging any missing core areas (bodyweight, a run trial, Ski or Row, and a strength marker) will sharpen tracking further.";
    }
    if (
      sig &&
      (ctx.intelligence?.primary_goal === "muscle" ||
        ctx.intelligence?.limiter_focus === "body_composition" ||
        ctx.intelligence?.limiter_focus === "strength") &&
      !sig.has_strength_marker
    ) {
      return "Your baseline test data is embedded in the plan. Adding at least one strength marker (squat, bench, pull-ups, etc.) will make strength-focused progress much easier to measure at Weeks 4, 8, and 12.";
    }
    return "Your baseline test data is embedded in the plan, giving you objective markers to measure progress against at Weeks 4, 8, and 12.";
  }
  return "You haven't completed baseline tests yet — the plan still starts immediately. Set your baseline with bodyweight, a run marker, an engine test (Ski or Row), and at least one strength marker when you can.";
}

function runVolumeSentence(ctx: RationaleContext): string | null {
  const band = ctx.assessment?.current_run_volume_band?.trim();
  const goal = ctx.input.goal_focus;
  if (goal === "muscle" && !band) return null;

  const intel = ctx.intelligence;
  const fromIntel = intel?.rationale_notes?.find((n) =>
    /running (volume|load|exposures)/i.test(n)
  );
  if (fromIntel) return fromIntel;

  if (band) {
    return `Your reported baseline is ${band}. Running progresses from that band so mileage does not jump ahead of recovery.`;
  }
  if (ctx.input.ability_level === "advanced" && ctx.input.days_per_week >= 6) {
    return "Your plan includes multiple weekly run exposures — threshold, speed or compromised work, a long run, and supporting aerobic mileage around hybrid sessions.";
  }
  return null;
}

function doubleSessionSentence(ctx: RationaleContext): string | null {
  if (!ctx.input.double_sessions) return null;
  const days = ctx.double_session_days?.length
    ? `(${ctx.double_session_days.join(", ")})`
    : "";
  const tail = ctx.intelligence
    ? " They are intentionally low-stress support: easy aerobic, flush, or mobility — never a second Priority 1."
    : "";
  return `Your double-session days ${days} are used selectively for low-cost aerobic or recovery support — not extra hard sessions. These optional PM sessions extend aerobic base without accumulating fatigue.${tail}`;
}

function levelSentence(input: PaidProgrammeInput): string {
  if (input.ability_level === "beginner") {
    return "Given your training background, the plan starts with manageable loads and builds gradually — the goal in Block 1 is consistency, not intensity.";
  }
  if (input.ability_level === "advanced") {
    return "With your training experience, the structure handles higher density and sharper quality sessions from early in the plan.";
  }
  return "With your existing training base, the plan can push quality while keeping sessions recoverable across each block.";
}

function structureSentence(input: PaidProgrammeInput): string {
  return `The 12 weeks are split into three blocks of four: Build the Base (Weeks 1–4), Build the Engine (Weeks 5–8), and Build Performance (Weeks 9–12). Each block builds on the last, with Week 4, 8, and 12 as deload/test weeks to consolidate adaptation.`;
}

function howToGetMost(ctx: RationaleContext): string[] {
  const { input } = ctx;
  const tips: string[] = [
    "Prioritise Priority 1 sessions above everything else — they carry the most training value.",
    "Mark each session complete in the dashboard so your progress data stays accurate.",
    "Complete your weekly check-in every Sunday — it takes 60 seconds and helps us track recovery.",
  ];
  if (input.ability_level === "beginner") {
    tips.push("If a session feels too hard, reduce intensity — don't skip. Consistency matters more than performance right now.");
  }
  if (input.double_sessions) {
    tips.push("Optional PM sessions are support work — skip them without guilt if recovery feels poor.");
  }
  if (ctx.assessment?.injury_flags?.length) {
    tips.push("If pain or symptoms appear, swap to the low-impact alternative immediately and note it in your check-in.");
  }
  if (!ctx.hasBenchmarkTests && !ctx.hasBaseline5k) {
    tips.push("Log your first baseline tests in the Testing section — even Week 1 data is useful to track progress over time.");
  } else if (ctx.intelligence?.benchmark_confidence === "low") {
    tips.push(
      "Complete your four core baseline areas when you can: bodyweight, a run marker (5 km or 3 km), one engine test (Ski or Row), and one strength marker — more data tightens tracking without changing the weekly rhythm."
    );
  }
  return tips;
}

function keyPrioritiesWithIntelligence(ctx: RationaleContext): string[] {
  const intel = ctx.intelligence;
  if (!intel) return [];
  const out: string[] = [];
  const g = intel.primary_goal;
  const lim = intel.limiter_focus;
  const ev = intel.event_specificity;
  const general = intel.event_mode === "general";
  const sig = ctx.benchmark_signals;

  if (g === "running" || ev === "running_race") {
    out.push("Running quality — pacing, economy, and progressive volume through the block");
    if (lim === "running_speed") {
      out.push("Intervals, strides, and pace-control sessions so speed work is not drowned by slow volume alone");
    }
    if (lim === "running_endurance") {
      out.push("Repeatable aerobic base and threshold-supported endurance — building an engine you can use weekly");
    }
    if (lim === "strength") {
      out.push("Strength retained in the week for durability without burying run development");
    }
  } else if (g === "muscle") {
    out.push("Progressive strength work as the backbone of each week");
    out.push("Conditioning that keeps you athletic without stealing recovery from the lifts");
    if (lim === "body_composition") {
      out.push("Sustainable density — not chronic red-line weeks — so composition changes stick");
    }
    if (!sig?.has_strength_marker) {
      out.push("Measurable strength foundations — log rep-maxes or lift markers in Testing so progression stays objective");
    }
  } else {
    out.push("Hybrid engine — threshold running, erg capacity, and compromised efforts across the programme");
    if (!general && ev !== "none") {
      out.push("Race-relevant specificity ramps into Block 3 so you peak into your performance window");
    }
    if (general) {
      out.push("General performance: fitter, stronger, faster, leaner, and more capable without forcing a single race storyline");
    }
    if (
      sig &&
      (lim === "body_composition" || lim === "strength" || g === "hybrid") &&
      !sig.has_strength_marker
    ) {
      out.push("Strength baseline — add at least one lift or rep-max marker so hybrid progress is not only run and erg driven");
    }
    if (sig?.engine_weaker_than_strength) {
      out.push("Protect strength quality while engine markers catch up — aerobic work supports lifting rather than replacing it");
    }
    if (ev === "hyrox_pro") {
      out.push("Hyrox Pro: more race-style compromised running and station durability; pro-weight context where equipment allows");
    }
    if (ev === "hyrox_open") {
      out.push("Hyrox Open: progressive station exposure — tolerance and skill before density spikes");
    }
    if (ev === "hyrox_doubles") {
      out.push("Doubles-aware repeatability — pacing and fatigue control even though sessions are written individually");
    }
  }

  switch (lim) {
    case "running_endurance":
      if (g !== "running") {
        out.push("Enough aerobic base and long-run quality so conditioning supports hybrid work, not just short efforts");
      }
      break;
    case "running_speed":
      if (g !== "running") {
        out.push("Intervals and economy touches so running speed does not flatline behind steady work only");
      }
      break;
    case "strength":
      if (g !== "muscle") {
        out.push("Strength sessions protected — conditioning supports lifting rather than replacing it");
      }
      break;
    case "hyrox_stations":
      out.push("Wall ball, sled, carry, and compromised running exposure where kit allows — substitutions when gear is limited");
      break;
    case "body_composition":
      if (g === "hybrid") {
        out.push("Balance strength retention with steady aerobic volume and controlled intensity for sustainable output");
      }
      break;
    case "recovery":
      out.push("Low-impact bias and substitution-first notes wherever impact risk shows up");
      break;
    case "consistency":
      out.push("Clear Priority 1 guidance and fewer brutal pairings so busy weeks stay executable");
      break;
    default:
      break;
  }

  return [...new Set(out)].slice(0, 5);
}

function fallbackKeyPriorities(ctx: RationaleContext): string[] {
  const { input, assessment } = ctx;
  const key_priorities: string[] = [];
  if (input.goal_focus === "running") {
    key_priorities.push("Quality threshold and interval runs as Priority 1");
    key_priorities.push("Aerobic base volume to extend endurance capacity");
    key_priorities.push("Strength work to keep you injury-resistant and durable");
  } else if (input.goal_focus === "muscle") {
    key_priorities.push("Progressive strength sessions as Priority 1 throughout");
    key_priorities.push("Conditioning to maintain fitness and athleticism");
    key_priorities.push("Balanced load to avoid strength-only fatigue plateaus");
  } else {
    key_priorities.push("Threshold running and compromised efforts for hybrid performance");
    key_priorities.push("Erg capacity (SkiErg / Row) to support race station transitions");
    key_priorities.push("Strength work that complements, not competes with, aerobic training");
    if (assessment?.event_type && !/no event/i.test(assessment.event_type)) {
      key_priorities.push("Race-specific conditioning in Block 3 to peak for your event");
    }
  }
  return key_priorities;
}

// ─── Programme-level rationale ────────────────────────────────────────────────

export function buildProgrammeRationale(ctx: RationaleContext): ProgrammeRationale {
  const { input, assessment } = ctx;
  const name = first_name(input);
  const headline = goalHeadline(input.goal_focus, assessment?.event_type, ctx.intelligence);

  const summary: string[] = [
    goalSentence(input.goal_focus, input.days_per_week, input.weekly_hours_band, ctx.intelligence),
    levelSentence(input),
    structureSentence(input),
  ];

  const event = eventSentence(ctx);
  if (event) summary.push(event);

  const limiter = limiterSentence(ctx);
  if (limiter) summary.push(limiter);

  const injury = injurySentence(ctx);
  if (injury) summary.push(injury);

  summary.push(baselineSentence(ctx));

  const doubles = doubleSessionSentence(ctx);
  if (doubles) summary.push(doubles);

  const runVol = runVolumeSentence(ctx);
  if (runVol) summary.push(runVol);

  const fromIntel = keyPrioritiesWithIntelligence(ctx);
  const key_priorities = fromIntel.length > 0 ? fromIntel : fallbackKeyPriorities(ctx);

  let why_this_structure =
    `The three-block structure is designed for ${name}'s ${input.ability_level} level and ${input.weekly_hours_band.replace("-", "–")} hours per week. ` +
    `Block 1 builds consistent aerobic base. Block 2 sharpens engine quality with higher-intensity threshold work. Block 3 lifts specificity and performance density. ` +
    (input.double_sessions
      ? `Double sessions are layered in selectively to extend aerobic volume without overloading the hard sessions. `
      : "") +
    `Deload weeks at 4, 8, and 12 allow adaptation to consolidate before the next block.`;

  if (ctx.intelligence?.event_specificity === "hyrox_pro") {
    why_this_structure +=
      " For Hyrox Pro, Block 3 leans further into race-style compromise and running-under-fatigue so station work stays honest at race loads.";
  }
  if (ctx.intelligence?.impact_risk === "high") {
    why_this_structure +=
      " Conservative progression is deliberate where injury or impact notes appear — the arc prioritises consistency over hero weeks.";
  }
  if (ctx.intelligence?.limiter_focus === "consistency" || ctx.intelligence?.limiter_focus === "recovery") {
    why_this_structure +=
      " Session pairings stay simpler where repeatability or recovery sensitivity matters.";
  }

  const how_to_get_the_most_from_it = howToGetMost(ctx);

  return { headline, summary, key_priorities, why_this_structure, how_to_get_the_most_from_it };
}

// ─── Week-level rationale ─────────────────────────────────────────────────────

type WeekFocus =
  | "base_intro"
  | "base_progression"
  | "base_peak"
  | "base_deload"
  | "engine_intro"
  | "threshold_build"
  | "engine_peak"
  | "engine_deload"
  | "performance_intro"
  | "specificity_peak"
  | "sharpen_and_test"
  | "test_or_taper"
  | "balanced_intro";

const WEEK_ROLE: Record<WeekFocus, string> = {
  balanced_intro: "Sample week — establishing rhythm",
  base_intro: "Block 1 — establishing rhythm and training habit",
  base_progression: "Block 1 — building repeatable aerobic base",
  base_peak: "Block 1 — highest load of Block 1",
  base_deload: "Block 1 — deload and consolidate",
  engine_intro: "Block 2 — introducing threshold quality",
  threshold_build: "Block 2 — building threshold capacity",
  engine_peak: "Block 2 — peak engine stress",
  engine_deload: "Block 2 — deload before Block 3",
  performance_intro: "Block 3 — performance density begins",
  specificity_peak: "Block 3 — peak specificity and race pace",
  sharpen_and_test: "Block 3 — sharpen and test",
  test_or_taper: "Block 3 — test performance and taper",
};

const WEEK_WHY: Record<WeekFocus, string> = {
  balanced_intro: "This is your entry point — the goal is to complete sessions, build routine, and get a feel for the structure before adding intensity.",
  base_intro: "This week is about establishing rhythm. Consistency here is more important than intensity — build the habit before chasing fitness.",
  base_progression: "The load increases modestly this week. Focus on keeping easy work genuinely easy while executing the quality sessions well.",
  base_peak: "This is the highest-load week in Block 1. You should feel slightly challenged — that challenge is the adaptation signal. Prioritise recovery the day after each key session.",
  base_deload: "Recovery week. Reduce effort and volume intentionally — adaptation happens here, not during the hard weeks. Stick to the plan even though it feels light.",
  engine_intro: "Block 2 starts with threshold-flavoured sessions. The intensity step up may feel sharper — keep the easy days easy so the hard days can land properly.",
  threshold_build: "Threshold capacity is the primary target this week. These are the sessions that develop your ability to sustain pace under fatigue — the cornerstone of hybrid performance.",
  engine_peak: "Peak engine stress week. Hard sessions will feel demanding — that's correct. If recovery is poor, reduce Priority 3 sessions first and protect Priority 1.",
  engine_deload: "Block 2 deload. Your engine has taken significant load over the past three weeks — this week consolidates that. Don't try to add work.",
  performance_intro: "Block 3 starts with increased specificity. Sessions now look closer to race or target performance demands. Execution quality matters more than raw effort.",
  specificity_peak: "Peak performance and specificity week. This is the sharpest this plan gets. Give Priority 1 sessions your full focus and treat recovery sessions as non-negotiable.",
  sharpen_and_test: "The taper begins with a final sharpening session. Complete the test if scheduled — this data anchors your 12-week progress picture.",
  test_or_taper: "Final week. If you have a race or test, execute your taper and trust the build. If not, log your final tests and reflect on 12 weeks of work.",
};

const WEEK_KEY_SESSIONS: Record<WeekFocus, string[]> = {
  balanced_intro: ["Your main quality session", "Aerobic base work"],
  base_intro: ["Your main quality session — establish the pattern", "One aerobic base session"],
  base_progression: ["Quality run or threshold session", "Strength session"],
  base_peak: ["Priority 1 threshold or hybrid session", "Strength session — heaviest of the block"],
  base_deload: ["One easy aerobic session", "Optional mobility or recovery"],
  engine_intro: ["Your first threshold session of Block 2", "Supporting aerobic work"],
  threshold_build: ["Main threshold session — this is Priority 1", "Long aerobic or secondary quality session"],
  engine_peak: ["Priority 1 threshold session — protect this above all", "Strength session"],
  engine_deload: ["One quality session at reduced intensity", "Recovery / mobility"],
  performance_intro: ["Hybrid compromised effort", "Strength session"],
  specificity_peak: ["Race-specific compromised effort — Priority 1", "Threshold or interval session"],
  sharpen_and_test: ["Sharpening session at race pace or above", "Test session if scheduled"],
  test_or_taper: ["Final performance test if applicable", "Easy flush and mobility"],
};

const WEEK_COACH_NOTE: Record<WeekFocus, string> = {
  balanced_intro: "Don't overthink it — just start, complete, and repeat.",
  base_intro: "Don't start too hard. A manageable Week 1 sets up a successful Week 12.",
  base_progression: "Slightly harder than last week, but still controlled. Keep the easy days genuinely easy.",
  base_peak: "You may feel fatigued by mid-week — that's normal. Complete the Priority 1 sessions and let the support work flex.",
  base_deload: "Resist the urge to add work. The adaptation you need is already banked.",
  engine_intro: "Welcome to Block 2 — pace work feels different. Your aerobic base from Block 1 makes this possible.",
  threshold_build: "If threshold sessions feel manageable, your fitness is in a good place. Aim for controlled discomfort, not survival.",
  engine_peak: "This is where the programme does its most important work. Show up fully for Priority 1. Let everything else flex.",
  engine_deload: "You've done the hard part of Block 2. This week is a gift — take it.",
  performance_intro: "Block 3 sessions feel more specific because they are. You're no longer training to be fit — you're training to perform.",
  specificity_peak: "Peak week. Everything has built to this. Execute the Priority 1 sessions as close to race conditions as you can.",
  sharpen_and_test: "Sharpen, don't hammer. A controlled final quality session serves you better than trying to feel impressive in training.",
  test_or_taper: "Race or test day, this is what 12 weeks of work produces. Trust the process.",
};

export function buildWeekRationale(
  weekFocus: WeekFocus,
  weekNumber: number,
  goalFocus: GoalFocus
): WeekRationale {
  const safeKey: WeekFocus = WEEK_ROLE[weekFocus] ? weekFocus : "base_intro";

  // Goal-specific key session overrides for key weeks
  const sessions = [...WEEK_KEY_SESSIONS[safeKey]];
  if (goalFocus === "muscle") {
    if (sessions[0].toLowerCase().includes("threshold") || sessions[0].toLowerCase().includes("run")) {
      sessions[0] = sessions[0].replace(/threshold|run/gi, "strength");
    }
  }
  if (goalFocus === "running" && safeKey === "specificity_peak") {
    sessions[0] = "Race-pace interval session — Priority 1";
  }

  return {
    week_role: WEEK_ROLE[safeKey],
    why_this_week_matters: WEEK_WHY[safeKey],
    key_sessions_to_prioritise: sessions,
    coach_note: WEEK_COACH_NOTE[safeKey],
  };
}
