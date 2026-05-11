/**
 * Shared schedule normalization for the paid member dashboard (PlanJson.schedule shape).
 * Keeps parity with AthleteDashboardClient session mapping without modifying /athlete routes.
 */

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
};

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
      rpeGuide: "Use session guidance",
      effortDescription: String(
        row?.intent || "Respect the purpose of the session and keep the effort controlled."
      ),
      ...priority,
    };
  });
}

function humanizeWeekFocus(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
