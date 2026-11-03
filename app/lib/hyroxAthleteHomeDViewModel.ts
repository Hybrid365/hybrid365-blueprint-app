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
  };
}
