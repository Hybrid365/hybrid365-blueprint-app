/**
 * Shared schedule normalization for the paid member dashboard (PlanJson.schedule shape).
 * Keeps parity with AthleteDashboardClient session mapping without modifying /athlete routes.
 */

import type { RunPrescription } from "./runPrescription";

export type DoubleSessionSummary = {
  label: string;
  title: string;
  intent: string;
  time_cap_minutes: number;
  category: string;
  main: string[];
  notes: string[];
};

export type MemberSessionDetail = {
  day: string;
  dayShort: string;
  title: string;
  category: SessionCategoryLabel;
  status: string;
  intent: string;
  duration: string;
  timeCap?: string;
  tags: string[];
  warmUp: string[];
  mainWork: string[];
  coolDown: string[];
  finisher?: string[];
  coachingNotes: string;
  rpeGuide: string;
  effortDescription: string;
  priorityRank: 1 | 2 | 3;
  priorityDisplayLabel: string;
  priorityCategoryLabel: string;
  priorityReason: string;
  /** Optional PM / support session from double-session planner */
  doubleSession?: DoubleSessionSummary;
  /** Run-only: individualised pace / HR / RPE from programme generation */
  runPrescription?: RunPrescription;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildSessionKey(args: {
  weekNumber: number;
  day: string;
  index: number;
  title: string;
}): string {
  const safeDay = slugify(args.day || "day");
  const safeTitle = slugify(args.title || "session");
  return `week-${args.weekNumber}-${safeDay}-${args.index}-${safeTitle}`;
}

const DEFAULT_SESSION_PRIORITY = {
  priorityRank: 2 as const,
  priorityDisplayLabel: "Priority 2",
  priorityCategoryLabel: "Support Session",
  priorityReason: "This session supports the structure of your week.",
};

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v));
}

function dayShort(day: string): string {
  const s = (day || "").trim();
  if (!s) return "DAY";
  return s.slice(0, 3).toUpperCase();
}

export type SessionCategoryLabel = "Run" | "Strength" | "Hybrid" | "Recovery" | "Aerobic";

function mapCategory(title: string, tags: string[]): SessionCategoryLabel {
  const t0 = (tags[0] || "").toLowerCase();
  const t1 = (tags[1] || "").toLowerCase();
  if (t1 === "recovery" || t0 === "recovery") return "Recovery";
  if (t1 === "aerobic" || t0 === "aerobic_support") return "Aerobic";
  if (t1 === "run" || /_run$/.test(t0) || t0.includes("run")) return "Run";
  if (t1 === "strength" || t0.includes("strength")) return "Strength";
  const lowered = title.toLowerCase();
  if (lowered.includes("run")) return "Run";
  if (lowered.includes("strength")) return "Strength";
  if (lowered.includes("recovery") || lowered.includes("rest")) return "Recovery";
  return "Hybrid";
}

function parseRunPrescription(raw: unknown): RunPrescription | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const rpe = typeof p.rpe === "string" && p.rpe.trim() ? p.rpe.trim() : null;
  const coach_note =
    typeof p.coach_note === "string" && p.coach_note.trim() ? p.coach_note.trim() : null;
  const effort_description =
    typeof p.effort_description === "string" && p.effort_description.trim()
      ? p.effort_description.trim()
      : null;
  if (!rpe && !coach_note && !effort_description) return undefined;
  return {
    pace_range:
      typeof p.pace_range === "string" && p.pace_range.trim() ? p.pace_range.trim() : null,
    hr_range:
      typeof p.hr_range === "string" && p.hr_range.trim() ? p.hr_range.trim() : null,
    rpe: rpe ?? "Use session guidance",
    effort_description: effort_description ?? "",
    coach_note: coach_note ?? "",
  };
}

function parseSessionPriority(raw: unknown): Pick<
  MemberSessionDetail,
  "priorityRank" | "priorityDisplayLabel" | "priorityCategoryLabel" | "priorityReason"
> {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_SESSION_PRIORITY;
  }
  const p = raw as Record<string, unknown>;
  const rank = p.rank;
  if (rank !== 1 && rank !== 2 && rank !== 3) {
    return DEFAULT_SESSION_PRIORITY;
  }
  const fallbackCategory =
    rank === 1 ? "Key Session" : rank === 2 ? "Support Session" : "Optional / Flexible";
  const displayLabel =
    typeof p.display_label === "string" && p.display_label.trim()
      ? String(p.display_label).trim()
      : `Priority ${rank}`;
  const categoryLabel =
    typeof p.category_label === "string" && p.category_label.trim()
      ? String(p.category_label).trim()
      : fallbackCategory;
  const reason =
    typeof p.reason === "string" && p.reason.trim()
      ? String(p.reason).trim()
      : DEFAULT_SESSION_PRIORITY.priorityReason;

  return {
    priorityRank: rank,
    priorityDisplayLabel: displayLabel,
    priorityCategoryLabel: categoryLabel,
    priorityReason: reason,
  };
}

/** Pull schedule array from stored plan_json (full PlanJson or { schedule: [...] }). */
export function extractScheduleFromPlanJson(planJson: unknown): unknown[] | null {
  if (!planJson || typeof planJson !== "object") return null;
  const o = planJson as Record<string, unknown>;
  const schedule = o.schedule;
  if (!Array.isArray(schedule)) return null;
  return schedule;
}

export function normalizeMemberSchedule(schedule: unknown[]): MemberSessionDetail[] {
  return schedule.map((item) => {
    const row = item as Record<string, unknown>;
    const session = (row?.session as Record<string, unknown>) || {};
    const minutes = typeof row?.time_cap_minutes === "number" ? row.time_cap_minutes : null;
    const notes = asArray(session?.notes);
    const title = String(row?.title || "Session");
    const tagArr = asArray(row?.tags);
    const category = mapCategory(title, tagArr);
    const priority = parseSessionPriority(row?.priority);
    const runPrescription =
      category === "Run" ? parseRunPrescription(row?.run_prescription) : undefined;

    // Parse double_session if present
    let doubleSession: DoubleSessionSummary | undefined;
    const ds = row?.double_session as Record<string, unknown> | null | undefined;
    if (ds?.enabled === true && ds.secondary && typeof ds.secondary === "object") {
      const sec = ds.secondary as Record<string, unknown>;
      const secSess = (sec.session as Record<string, unknown>) ?? {};
      doubleSession = {
        label: typeof ds.label === "string" ? ds.label : "Optional Support",
        title: typeof sec.title === "string" ? sec.title : "Support Session",
        intent: typeof sec.intent === "string" ? sec.intent : "",
        time_cap_minutes: typeof sec.time_cap_minutes === "number" ? sec.time_cap_minutes : 20,
        category: typeof sec.category === "string" ? sec.category : "recovery",
        main: asArray(secSess.main),
        notes: asArray(secSess.notes),
      };
    }

    return {
      day: String(row?.day || "Day"),
      dayShort: dayShort(String(row?.day || "Day")),
      title,
      category,
      status: "Member",
      intent: String(
        row?.intent || "Execute this session with controlled effort and clean form."
      ),
      duration: minutes ? `${minutes} min` : "Use session guidance",
      timeCap: minutes ? `${minutes} min` : undefined,
      tags: asArray(row?.tags),
      warmUp: asArray(session?.warm_up),
      mainWork: asArray(session?.main),
      coolDown: asArray(session?.cool_down),
      finisher: asArray(session?.finish),
      coachingNotes: notes.length > 0 ? notes.join(" ") : "Use session guidance.",
      rpeGuide: runPrescription?.rpe ?? "Use session guidance",
      effortDescription:
        runPrescription?.effort_description ||
        String(
          row?.intent || "Respect the purpose of the session and keep the effort controlled."
        ),
      ...priority,
      ...(doubleSession ? { doubleSession } : {}),
      ...(runPrescription ? { runPrescription } : {}),
    };
  });
}

function humanizeWeekFocus(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ExtractedProgrammeRationale = {
  headline: string;
  summary: string[];
  key_priorities: string[];
  why_this_structure: string;
  how_to_get_the_most_from_it: string[];
};

export type ExtractedWeekRationale = {
  week_role: string;
  why_this_week_matters: string;
  key_sessions_to_prioritise: string[];
  coach_note: string;
  progression_focus?: string;
  what_progressed_from_last_week?: string;
  key_marker_this_week?: string;
};

export type ExtractedProgrammeIntelligence = {
  primary_goal: string;
  event_mode: string;
  event_specificity: string;
  limiter_focus: string;
  impact_risk: string;
  benchmark_confidence: string;
  engine_biases: string[];
  rationale_notes: string[];
};

export function extractProgrammeRationale(planJson: unknown): ExtractedProgrammeRationale | null {
  if (!planJson || typeof planJson !== "object") return null;
  const o = planJson as Record<string, unknown>;
  const r = o.programme_rationale;
  if (!r || typeof r !== "object") return null;
  const m = r as Record<string, unknown>;
  const headline = typeof m.headline === "string" ? m.headline : null;
  if (!headline) return null;
  return {
    headline,
    summary: Array.isArray(m.summary) ? m.summary.map(String) : [],
    key_priorities: Array.isArray(m.key_priorities) ? m.key_priorities.map(String) : [],
    why_this_structure: typeof m.why_this_structure === "string" ? m.why_this_structure : "",
    how_to_get_the_most_from_it: Array.isArray(m.how_to_get_the_most_from_it)
      ? m.how_to_get_the_most_from_it.map(String)
      : [],
  };
}

export function extractProgrammeIntelligence(planJson: unknown): ExtractedProgrammeIntelligence | null {
  if (!planJson || typeof planJson !== "object") return null;
  const o = planJson as Record<string, unknown>;
  const p = o.programme_intelligence;
  if (!p || typeof p !== "object") return null;
  const m = p as Record<string, unknown>;
  const primary_goal = typeof m.primary_goal === "string" ? m.primary_goal : null;
  if (!primary_goal) return null;
  return {
    primary_goal,
    event_mode: typeof m.event_mode === "string" ? m.event_mode : "general",
    event_specificity: typeof m.event_specificity === "string" ? m.event_specificity : "none",
    limiter_focus: typeof m.limiter_focus === "string" ? m.limiter_focus : "general",
    impact_risk: typeof m.impact_risk === "string" ? m.impact_risk : "low",
    benchmark_confidence: typeof m.benchmark_confidence === "string" ? m.benchmark_confidence : "low",
    engine_biases: Array.isArray(m.engine_biases) ? m.engine_biases.map(String) : [],
    rationale_notes: Array.isArray(m.rationale_notes) ? m.rationale_notes.map(String) : [],
  };
}

export function extractWeekRationale(planJson: unknown): ExtractedWeekRationale | null {
  if (!planJson || typeof planJson !== "object") return null;
  const o = planJson as Record<string, unknown>;
  const r = o.week_rationale;
  if (!r || typeof r !== "object") return null;
  const m = r as Record<string, unknown>;
  const week_role = typeof m.week_role === "string" ? m.week_role : null;
  if (!week_role) return null;
  return {
    week_role,
    why_this_week_matters: typeof m.why_this_week_matters === "string" ? m.why_this_week_matters : "",
    key_sessions_to_prioritise: Array.isArray(m.key_sessions_to_prioritise)
      ? m.key_sessions_to_prioritise.map(String)
      : [],
    coach_note: typeof m.coach_note === "string" ? m.coach_note : "",
    progression_focus:
      typeof m.progression_focus === "string" ? m.progression_focus : undefined,
    what_progressed_from_last_week:
      typeof m.what_progressed_from_last_week === "string"
        ? m.what_progressed_from_last_week
        : undefined,
    key_marker_this_week:
      typeof m.key_marker_this_week === "string" ? m.key_marker_this_week : undefined,
  };
}

/** week_context.week_focus and weekly_stress.display_label from stored PlanJson */
export function extractPlanInsights(planJson: unknown): {
  weekFocus: string | null;
  weeklyLoadDisplay: string | null;
} {
  if (!planJson || typeof planJson !== "object") {
    return { weekFocus: null, weeklyLoadDisplay: null };
  }
  const o = planJson as Record<string, unknown>;
  let weekFocus: string | null = null;
  const wc = o.week_context;
  if (wc && typeof wc === "object") {
    const wf = (wc as Record<string, unknown>).week_focus;
    if (typeof wf === "string" && wf.trim()) {
      weekFocus = humanizeWeekFocus(wf.trim());
    }
  }
  let weeklyLoadDisplay: string | null = null;
  const ws = o.weekly_stress;
  if (ws && typeof ws === "object") {
    const dl = (ws as Record<string, unknown>).display_label;
    if (typeof dl === "string" && dl.trim()) {
      weeklyLoadDisplay = dl.trim();
    }
  }
  return { weekFocus, weeklyLoadDisplay };
}

export function trainingBalanceFromSessions(sessions: MemberSessionDetail[]) {
  const counts = { Running: 0, Strength: 0, Hybrid: 0, Recovery: 0, Aerobic: 0 };
  for (const s of sessions) {
    if (s.category === "Run") counts.Running += 1;
    else if (s.category === "Strength") counts.Strength += 1;
    else if (s.category === "Recovery") counts.Recovery += 1;
    else if (s.category === "Aerobic") counts.Aerobic += 1;
    else counts.Hybrid += 1;
  }
  const total = Math.max(1, sessions.length);
  const toPct = (n: number) => Math.round((n / total) * 100);
  const base = [
    { label: "Running", percentage: toPct(counts.Running), color: "bg-[#F4D23C]" },
    { label: "Strength", percentage: toPct(counts.Strength), color: "bg-white" },
    { label: "Hybrid", percentage: toPct(counts.Hybrid), color: "bg-zinc-500" },
    { label: "Aerobic", percentage: toPct(counts.Aerobic), color: "bg-emerald-600/80" },
    { label: "Recovery", percentage: toPct(counts.Recovery), color: "bg-zinc-700" },
  ];
  const sum = base.reduce((acc, item) => acc + item.percentage, 0);
  if (sum !== 100) base[0].percentage += 100 - sum;
  return base;
}
