/**
 * Athlete Home D view-model — pure composition from published programme + benchmarks.
 * Never invents targets, readiness, or adaptation claims.
 */

import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import { sanitizeAthleteSessionTitle } from "@/app/lib/hyroxSessionFamilyAthleteCopy";
import { resolveHyroxBlockMeta, type HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type HomeDCardStatus =
  | "upcoming"
  | "completed"
  | "partial"
  | "missed"
  | "unresolved";

export type AthleteHomeDSessionCard = {
  id: string;
  slot: string;
  modalityLabel: string;
  title: string;
  primaryTarget: string | null;
  primaryDetail: string | null;
  duration: string | null;
  intent: string | null;
  coachNote: string | null;
  status: HomeDCardStatus;
};

export type AthleteHomeDDay = {
  /** ISO date yyyy-mm-dd */
  id: string;
  dow: string;
  dateNumber: number;
  iso: string;
  isToday: boolean;
  isPast: boolean;
  sessions: AthleteHomeDSessionCard[];
};

export type AthleteHomeDCoachContext = {
  title: string;
  body: string;
};

export type AthleteHomeDInsight = {
  label: string;
  value: string;
  detail: string | null;
};

export type AthleteHomeDProgressMetric = {
  label: string;
  from: string;
  to: string;
};

export type AthleteHomeDProgrammeContext = {
  weekNumber: number;
  blockLabel: string;
  weekRole: string | null;
  raceLabel: string | null;
};

/** Honest weekly summary derived only from published programme sessions. */
export type AthleteHomeDWeekContext = {
  plannedSessions: number;
  completedSessions: number;
  /** Sum of parseable planned durations only; null when none parse. */
  plannedDurationMinutes: number | null;
  sessionsWithDuration: number;
  modalityCounts: { label: string; count: number }[];
};

export type AthleteHomeDViewModel = {
  athleteName: string;
  programmePublished: boolean;
  programmeContext: AthleteHomeDProgrammeContext | null;
  weekDays: AthleteHomeDDay[];
  /** Default selected day (today if in week, else first day with sessions, else Mon). */
  defaultSelectedDateYmd: string;
  coachContext: AthleteHomeDCoachContext | null;
  /**
   * Only when accepted → applied → published is traceable.
   * Currently always null — adaptation decisions do not mutate programmes.
   */
  adjustmentMessage: null;
  adjustmentGap:
    | "no_accepted_published_adaptation_chain"
    | null;
  performanceInsight: AthleteHomeDInsight | null;
  progressSnapshot: AthleteHomeDProgressMetric[] | null;
  /** Planned-week context for insights rail — omit when empty. */
  weekContext: AthleteHomeDWeekContext | null;
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function todayYmdLocal(now = new Date()): string {
  return formatYmd(now);
}

function addDaysYmd(ymd: string, days: number): string | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return formatYmd(d);
}

function mondayOfWeekContaining(ymd: string): string | null {
  const d = parseYmd(ymd);
  if (!d) return null;
  const day = d.getDay(); // 0 Sun … 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return formatYmd(d);
}

function resolveWeekStartYmd(
  programme: AthleteLiveProgrammePayload,
  nowYmd: string
): string | null {
  const active = programme.programmeWeeks.find(
    (w) => w.weekNumber === programme.liveGlobalWeek
  );
  if (active?.weekStartDate) return active.weekStartDate;
  if (programme.week) {
    const bundle = programme.programmeWeeks.find(
      (w) => w.weekNumber === programme.week!.week_number
    );
    if (bundle?.weekStartDate) return bundle.weekStartDate;
  }
  // Fall back to calendar week containing today (still published-session filtered).
  return mondayOfWeekContaining(nowYmd);
}

export function mapHyroxSessionToHomeDStatus(
  session: HyroxSession,
  dayIso: string,
  todayIso: string
): HomeDCardStatus {
  if (session.status === "complete") return "completed";
  if (session.status === "modified") return "partial";
  if (session.status === "missed") return "missed";
  // upcoming — do not auto-mark past as missed
  if (dayIso < todayIso) return "unresolved";
  return "upcoming";
}

function cardFromSession(
  session: HyroxSession,
  dayIso: string,
  todayIso: string
): AthleteHomeDSessionCard {
  const detail = session.detail;
  const planned = session.plannedTargets;
  const plannedTarget =
    planned?.targetPace?.trim() ||
    planned?.targetSplit?.trim() ||
    planned?.targetLoad?.trim() ||
    "";
  const primaryTarget =
    detail?.targetPaceLoad?.trim() ||
    plannedTarget ||
    session.focus?.trim() ||
    null;
  const primaryDetail =
    detail?.objective?.trim() ||
    session.rpeTarget?.trim() ||
    null;
  const coachNote =
    detail?.coachNote?.trim() || session.coachNote?.trim() || null;
  const intent = session.intent?.trim() || detail?.objective?.trim() || null;

  return {
    id: session.id,
    slot: session.timeOfDay ?? "Main",
    modalityLabel: session.type,
    title: sanitizeAthleteSessionTitle(session.name || session.focus || "Session"),
    primaryTarget: primaryTarget || null,
    primaryDetail: primaryDetail || null,
    duration: detail?.duration?.trim() || session.duration?.trim() || null,
    intent,
    coachNote,
    status: mapHyroxSessionToHomeDStatus(session, dayIso, todayIso),
  };
}

function buildCoachContext(
  programme: AthleteLiveProgrammePayload
): AthleteHomeDCoachContext | null {
  // Never programme.week.coach_note — internal only.
  const weekNote = programme.week?.athlete_facing_note?.trim() ?? "";
  if (weekNote) {
    return { title: "From your coach", body: weekNote };
  }
  const why = programme.weekRationale?.whyMatters?.trim() ?? "";
  const role = programme.weekRationale?.weekRole?.trim() ?? "";
  if (why) {
    return {
      title: role ? `This week · ${role}` : "This week",
      body: why,
    };
  }
  return null;
}

/** Parse athlete-facing duration strings like "55 min", "1h 10m", "90min". */
export function parsePlannedDurationMinutes(raw: string | null | undefined): number | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return null;
  const hm = s.match(/^(\d+)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = hm[2] ? Number(hm[2]) : 0;
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }
  const min = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?)?$/);
  if (min) {
    const n = Number(min[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

function buildWeekContext(days: AthleteHomeDDay[]): AthleteHomeDWeekContext | null {
  const sessions = days.flatMap((d) => d.sessions);
  if (!sessions.length) return null;

  let completedSessions = 0;
  let plannedDurationMinutes = 0;
  let sessionsWithDuration = 0;
  const modalityMap = new Map<string, number>();

  for (const s of sessions) {
    if (s.status === "completed") completedSessions += 1;
    const mins = parsePlannedDurationMinutes(s.duration);
    if (mins != null) {
      plannedDurationMinutes += mins;
      sessionsWithDuration += 1;
    }
    const label = s.modalityLabel.trim() || "Other";
    modalityMap.set(label, (modalityMap.get(label) ?? 0) + 1);
  }

  const modalityCounts = [...modalityMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    plannedSessions: sessions.length,
    completedSessions,
    plannedDurationMinutes: sessionsWithDuration > 0 ? plannedDurationMinutes : null,
    sessionsWithDuration,
    modalityCounts,
  };
}

function buildPerformanceInsight(
  snapshot: BenchmarkSnapshotItem[] | null | undefined
): AthleteHomeDInsight | null {
  if (!snapshot?.length) return null;
  const withChange = snapshot.find((b) => b.logged && b.change && b.latest.trim());
  if (withChange) {
    return {
      label: withChange.label,
      value: withChange.latest,
      detail: withChange.change,
    };
  }
  const logged = snapshot.find((b) => b.logged && b.latest.trim());
  if (logged) {
    return {
      label: logged.label,
      value: logged.latest,
      detail: null,
    };
  }
  return null;
}

function buildProgressSnapshot(
  snapshot: BenchmarkSnapshotItem[] | null | undefined
): AthleteHomeDProgressMetric[] | null {
  if (!snapshot?.length) return null;
  const metrics: AthleteHomeDProgressMetric[] = [];
  for (const b of snapshot) {
    if (!b.logged || !b.change?.trim() || !b.latest.trim()) continue;
    // change often like "+12s" or "faster" — only show arrow teaser when we have a prior hint
    const change = b.change.trim();
    const priorMatch = change.match(/from\s+(.+)$/i);
    if (priorMatch) {
      metrics.push({
        label: b.label,
        from: priorMatch[1]!.trim(),
        to: b.latest,
      });
    } else if (/[→>]/.test(change)) {
      const parts = change.split(/\s*[→>]\s*/);
      if (parts.length === 2 && parts[0] && parts[1]) {
        metrics.push({ label: b.label, from: parts[0].trim(), to: parts[1].trim() });
      }
    }
    if (metrics.length >= 2) break;
  }
  return metrics.length ? metrics : null;
}

export function buildAthleteHomeDViewModel(params: {
  programme: AthleteLiveProgrammePayload | null;
  benchmarkSnapshot?: BenchmarkSnapshotItem[] | null;
  now?: Date;
}): AthleteHomeDViewModel {
  const now = params.now ?? new Date();
  const todayIso = todayYmdLocal(now);
  const programme = params.programme;

  if (!programme || !programme.published) {
    return {
      athleteName: programme?.athlete.name?.trim() || "Athlete",
      programmePublished: false,
      programmeContext: null,
      weekDays: [],
      defaultSelectedDateYmd: todayIso,
      coachContext: null,
      adjustmentMessage: null,
      adjustmentGap: "no_accepted_published_adaptation_chain",
      performanceInsight: null,
      progressSnapshot: null,
      weekContext: null,
    };
  }

  const weekStart = resolveWeekStartYmd(programme, todayIso);
  const days: AthleteHomeDDay[] = [];
  if (weekStart) {
    for (let i = 0; i < 7; i++) {
      const iso = addDaysYmd(weekStart, i);
      if (!iso) continue;
      const d = parseYmd(iso)!;
      const sessions = programme.sessions
        .filter((s) => (s.dateYmd ?? "").trim() === iso)
        .map((s) => cardFromSession(s, iso, todayIso));
      days.push({
        id: iso,
        dow: DOW[i] ?? "Mon",
        dateNumber: d.getDate(),
        iso,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
        sessions,
      });
    }
  }

  const todayInWeek = days.find((d) => d.isToday);
  const firstWithSessions = days.find((d) => d.sessions.length > 0);
  const defaultSelectedDateYmd =
    todayInWeek?.iso ?? firstWithSessions?.iso ?? days[0]?.iso ?? todayIso;

  const blockId = programme.athlete.current_block ?? programme.week?.block_number ?? 1;
  const blockMeta = resolveHyroxBlockMeta(blockId);
  const weekNumber =
    programme.week?.week_number ?? programme.liveGlobalWeek ?? programme.athlete.current_week;
  const raceParts = [programme.athlete.race_name, programme.athlete.race_date]
    .map((x) => x?.trim())
    .filter(Boolean);
  const weekRole =
    programme.week?.weekly_focus?.trim() ||
    programme.weekRationale?.weekRole?.trim() ||
    null;

  return {
    athleteName: programme.athlete.name?.trim() || "Athlete",
    programmePublished: true,
    programmeContext: {
      weekNumber,
      blockLabel: blockMeta.name,
      weekRole,
      raceLabel: raceParts.length ? raceParts.join(" · ") : null,
    },
    weekDays: days,
    defaultSelectedDateYmd,
    coachContext: buildCoachContext(programme),
    adjustmentMessage: null,
    adjustmentGap: "no_accepted_published_adaptation_chain",
    performanceInsight: buildPerformanceInsight(params.benchmarkSnapshot),
    progressSnapshot: buildProgressSnapshot(params.benchmarkSnapshot),
    weekContext: buildWeekContext(days),
  };
}
