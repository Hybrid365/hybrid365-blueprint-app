"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Battery,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Dumbbell,
  FileText,
  Gauge,
  Heart,
  LineChart,
  Lock,
  Moon,
  Play,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import {
  buildSessionKey,
  extractPlanInsights,
  extractScheduleFromPlanJson,
  normalizeMemberSchedule,
  type MemberSessionDetail,
  type SessionCategoryLabel,
} from "@/app/lib/memberDashboardSchedule";

export type WeekPayload = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

export type MemberDashboardClientProps = {
  email: string;
  programmeTitle: string;
  membershipExpiresAt: string | null;
  instanceCurrentWeek: number | null;
  programmeInstanceId: string | null;
  weeksFromDb: WeekPayload[];
  initialSessionLogs: SessionLogRecord[];
  initialWeeklyCheckIns: WeeklyCheckInRecord[];
};

type SessionLogRecord = {
  id: string;
  week_number: number;
  session_key: string;
  session_title: string | null;
  session_day: string | null;
  completed: boolean;
  completed_at: string | null;
  rpe: number | null;
  notes: string | null;
};

type SessionWithKey = MemberSessionDetail & {
  sessionKey: string;
  weekNumber: number;
  scheduleIndex: number;
};

type WeeklyCheckInRecord = {
  id: string;
  week_number: number;
  bodyweight_kg: number | null;
  sleep_hours: number | null;
  energy_score: number | null;
  recovery_score: number | null;
  stress_score: number | null;
  motivation_score: number | null;
  adherence_score: number | null;
  biggest_win: string | null;
  biggest_struggle: string | null;
  pain_or_injury: string | null;
  notes: string | null;
  submitted_at: string | null;
};

const BLOCKS = [
  { id: 1, name: "Build the Base", weeks: [1, 2, 3, 4] as const, dot: "bg-yellow-400" },
  { id: 2, name: "Build the Engine", weeks: [5, 6, 7, 8] as const, dot: "bg-amber-500" },
  { id: 3, name: "Build Performance", weeks: [9, 10, 11, 12] as const, dot: "bg-orange-500" },
] as const;

function buildTwelveWeeks(weeksFromDb: WeekPayload[]): WeekPayload[] {
  const map = new Map(weeksFromDb.map((w) => [w.week_number, w]));
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return (
      map.get(n) ?? {
        week_number: n,
        title: null,
        is_unlocked: false,
        plan_json: null,
      }
    );
  });
}

function clampWeek(n: number | null | undefined): number | null {
  if (n == null || Number.isNaN(Number(n))) return null;
  const v = Math.floor(Number(n));
  if (v < 1 || v > 12) return null;
  return v;
}

function blockIdForWeek(week: number): 1 | 2 | 3 {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
}

function getCheckInForWeek(
  checkIns: Record<number, WeeklyCheckInRecord>,
  weekNumber: number
): WeeklyCheckInRecord | null {
  return checkIns[weekNumber] ?? null;
}

function getCategoryStyle(category: SessionCategoryLabel): string {
  const styles: Record<SessionCategoryLabel, string> = {
    Run: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    Strength: "bg-red-500/20 text-red-300 border-red-500/40",
    Hybrid: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    Aerobic: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    Recovery: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  };
  return styles[category] || "bg-zinc-500/20 text-zinc-300 border-zinc-800/50";
}

function priorityKeyLabel(session: MemberSessionDetail): "Key" | "Supporting" | "Optional" {
  if (session.priorityRank === 1) return "Key";
  if (session.priorityRank === 2) return "Supporting";
  return "Optional";
}

function getPriorityStyle(key: "Key" | "Supporting" | "Optional"): string {
  const styles: Record<string, string> = {
    Key: "bg-yellow-400/25 text-yellow-300 border-yellow-400/40",
    Supporting: "bg-zinc-600/40 text-zinc-300 border-zinc-800/50",
    Optional: "bg-zinc-700/50 text-zinc-400 border-zinc-800/60",
  };
  return styles[key] || styles.Supporting;
}

function sessionCategories(session: MemberSessionDetail): SessionCategoryLabel[] {
  const primary = session.category;
  const fromTags = session.tags
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((t) => {
      const lower = t.toLowerCase();
      if (lower.includes("run") && primary !== "Run") return "Run" as const;
      if (lower.includes("strength") && primary !== "Strength") return "Strength" as const;
      return null;
    })
    .filter(Boolean) as SessionCategoryLabel[];
  const set = new Set<SessionCategoryLabel>([primary]);
  for (const c of fromTags) set.add(c);
  return Array.from(set);
}

function SessionRowCard({
  session,
  completed,
  onView,
}: {
  session: SessionWithKey;
  completed: boolean;
  onView: () => void;
}) {
  return (
    <div
      className={`flex items-stretch gap-4 rounded-2xl border p-5 transition-all sm:gap-5 sm:p-6 ${
        completed
          ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400/40"
          : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700/60 hover:bg-zinc-900"
      }`}
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/80 sm:h-16 sm:w-16">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Day</span>
        <span className="text-sm font-bold text-white">{session.dayShort}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-semibold leading-snug text-white sm:text-lg">{session.title}</h4>
          {completed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {sessionCategories(session).map((cat) => (
            <span
              key={cat}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCategoryStyle(cat)}`}
            >
              {cat}
            </span>
          ))}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityStyle(
              priorityKeyLabel(session)
            )}`}
          >
            {priorityKeyLabel(session)}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="h-4 w-4 shrink-0 text-yellow-400/80" />
          <span>{session.duration}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-700/60 hover:bg-zinc-700 hover:text-white"
        >
          <span className="hidden sm:inline">{completed ? "Edit" : "View"}</span>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

export default function MemberDashboardClient({
  email,
  programmeTitle,
  membershipExpiresAt,
  instanceCurrentWeek,
  programmeInstanceId,
  weeksFromDb,
  initialSessionLogs,
  initialWeeklyCheckIns,
}: MemberDashboardClientProps) {
  const router = useRouter();
  const allWeeks = useMemo(() => buildTwelveWeeks(weeksFromDb), [weeksFromDb]);

  const derivedFromFlags =
    allWeeks.find((w) => w.is_unlocked)?.week_number ??
    allWeeks.find((w) => w.week_number === 1)?.week_number ??
    1;

  const effectiveCurrentWeek =
    clampWeek(instanceCurrentWeek) ?? clampWeek(derivedFromFlags) ?? 1;

  const [selectedWeek, setSelectedWeek] = useState(effectiveCurrentWeek);
  const [selectedSession, setSelectedSession] = useState<SessionWithKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<Record<string, SessionLogRecord>>(
    () => Object.fromEntries(initialSessionLogs.map((log) => [log.session_key, log]))
  );
  const [draftRpe, setDraftRpe] = useState<number | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<Record<number, WeeklyCheckInRecord>>(
    () => Object.fromEntries(initialWeeklyCheckIns.map((entry) => [entry.week_number, entry]))
  );
  const [checkInDraft, setCheckInDraft] = useState({
    bodyweight_kg: "",
    sleep_hours: "",
    energy_score: "",
    recovery_score: "",
    stress_score: "",
    motivation_score: "",
    biggest_win: "",
    biggest_struggle: "",
    pain_or_injury: "",
    notes: "",
  });

  const selectedPayload =
    allWeeks.find((w) => w.week_number === selectedWeek) ?? allWeeks[effectiveCurrentWeek - 1];
  const selectedWeekUnlocked = Boolean(selectedPayload?.is_unlocked);
  const firstUnlockedWeek =
    allWeeks.find((w) => Boolean(w.is_unlocked))?.week_number ?? effectiveCurrentWeek;

  useEffect(() => {
    if (!selectedWeekUnlocked) {
      setSelectedWeek(firstUnlockedWeek);
    }
  }, [firstUnlockedWeek, selectedWeekUnlocked]);

  const currentProgrammeWeekPayload =
    allWeeks.find((w) => w.week_number === effectiveCurrentWeek) ?? allWeeks[0];

  const scheduleRaw = extractScheduleFromPlanJson(selectedPayload?.plan_json);
  const sessions = useMemo(() => {
    if (!scheduleRaw) return [];
    return normalizeMemberSchedule(scheduleRaw).map((session, index) => ({
      ...session,
      weekNumber: selectedWeek,
      scheduleIndex: index,
      sessionKey: buildSessionKey({
        weekNumber: selectedWeek,
        day: session.day,
        index,
        title: session.title,
      }),
    }));
  }, [scheduleRaw, selectedWeek]);
  const hasPlanForSelectedWeek = Boolean(scheduleRaw && scheduleRaw.length > 0);
  const weekUnlocked = selectedWeekUnlocked;

  const heroInsights = useMemo(
    () => extractPlanInsights(currentProgrammeWeekPayload?.plan_json),
    [currentProgrammeWeekPayload?.plan_json]
  );
  const selectedInsights = useMemo(
    () => extractPlanInsights(selectedPayload?.plan_json),
    [selectedPayload?.plan_json]
  );

  const weeklyFocusSubtitle =
    heroInsights.weekFocus ??
    "Weekly focus will appear here from your programme plan — progressive hybrid training across twelve weeks.";

  const displayWeeklyLoad =
    weekUnlocked && hasPlanForSelectedWeek && selectedInsights.weeklyLoadDisplay
      ? selectedInsights.weeklyLoadDisplay
      : "—";

  const progressPercent = Math.min(100, Math.round((effectiveCurrentWeek / 12) * 100));
  const currentBlockMeta = BLOCKS.find((b) => b.id === blockIdForWeek(effectiveCurrentWeek))!;
  const totalSessionsThisWeek = sessions.length;
  const completedCount = sessions.filter((s) => sessionLogs[s.sessionKey]?.completed).length;
  const nextSession = sessions.find((s) => !sessionLogs[s.sessionKey]?.completed) ?? null;
  const allSessionsCompleted = sessions.length > 0 && completedCount === sessions.length;
  const adherencePercent =
    totalSessionsThisWeek > 0 ? Math.round((completedCount / totalSessionsThisWeek) * 100) : null;
  const selectedWeekCheckIn = getCheckInForWeek(weeklyCheckIns, selectedWeek);
  const checkInDue = !selectedWeekCheckIn;
  const nextCheckInStatus = selectedWeekCheckIn ? "Complete" : "Due Sunday";
  const allCheckIns = Object.values(weeklyCheckIns).sort((a, b) => a.week_number - b.week_number);
  const weightSeries = allCheckIns.filter((c) => typeof c.bodyweight_kg === "number");
  const latestWeight = weightSeries.length > 0 ? weightSeries[weightSeries.length - 1].bodyweight_kg : null;
  const startingWeight = weightSeries.length > 0 ? weightSeries[0].bodyweight_kg : null;
  const totalWeightChange =
    latestWeight != null && startingWeight != null ? latestWeight - startingWeight : null;
  const rpeValues = Object.values(sessionLogs)
    .filter((log) => log.week_number === selectedWeek && typeof log.rpe === "number")
    .map((log) => Number(log.rpe));
  const averageRpe = rpeValues.length ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1) : null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openSessionDrawer(session: SessionWithKey) {
    const existing = sessionLogs[session.sessionKey];
    setSelectedSession(session);
    setDraftRpe(existing?.rpe ?? null);
    setDraftNotes(existing?.notes ?? "");
    setSaveError(null);
    setDrawerOpen(true);
  }

  async function saveSessionLog(completed: boolean) {
    if (!selectedSession || !programmeInstanceId) return;
    setSaving(true);
    setSaveError(null);
    const optimistic: SessionLogRecord = {
      id: sessionLogs[selectedSession.sessionKey]?.id ?? `optimistic-${selectedSession.sessionKey}`,
      week_number: selectedSession.weekNumber,
      session_key: selectedSession.sessionKey,
      session_title: selectedSession.title,
      session_day: selectedSession.day,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      rpe: draftRpe,
      notes: draftNotes.trim() || null,
    };
    const previous = sessionLogs[selectedSession.sessionKey];
    setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: optimistic }));
    try {
      const res = await fetch("/api/dashboard/session-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          week_number: selectedSession.weekNumber,
          session_key: selectedSession.sessionKey,
          session_title: selectedSession.title,
          session_day: selectedSession.day,
          completed,
          rpe: draftRpe,
          notes: draftNotes,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to save session");
      }
      const payload = (await res.json()) as { log: SessionLogRecord };
      setSessionLogs((prev) => ({ ...prev, [selectedSession.sessionKey]: payload.log }));
      setDrawerOpen(false);
    } catch (err) {
      setSessionLogs((prev) => {
        if (!previous) {
          const copy = { ...prev };
          delete copy[selectedSession.sessionKey];
          return copy;
        }
        return { ...prev, [selectedSession.sessionKey]: previous };
      });
      setSaveError(err instanceof Error ? err.message : "Unable to save session");
    } finally {
      setSaving(false);
    }
  }

  function openCheckInDrawer() {
    if (!weekUnlocked) return;
    const existing = getCheckInForWeek(weeklyCheckIns, selectedWeek);
    setCheckInDraft({
      bodyweight_kg: existing?.bodyweight_kg != null ? String(existing.bodyweight_kg) : "",
      sleep_hours: existing?.sleep_hours != null ? String(existing.sleep_hours) : "",
      energy_score: existing?.energy_score != null ? String(existing.energy_score) : "",
      recovery_score: existing?.recovery_score != null ? String(existing.recovery_score) : "",
      stress_score: existing?.stress_score != null ? String(existing.stress_score) : "",
      motivation_score: existing?.motivation_score != null ? String(existing.motivation_score) : "",
      biggest_win: existing?.biggest_win ?? "",
      biggest_struggle: existing?.biggest_struggle ?? "",
      pain_or_injury: existing?.pain_or_injury ?? "",
      notes: existing?.notes ?? "",
    });
    setCheckInError(null);
    setCheckInSuccess(null);
    setCheckInOpen(true);
  }

  function asNumberOrNull(v: string) {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  function parseBodyweightKg(v: string) {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function userFriendlyCheckInError(message?: string) {
    if (!message) return "We couldn't save your weekly check-in. Please try again.";
    if (message.toLowerCase().includes("adherence")) return "Adherence must be between 0 and 100.";
    if (message.toLowerCase().includes("energy")) return "Energy must be between 1 and 10.";
    if (message.toLowerCase().includes("recovery")) return "Recovery must be between 1 and 10.";
    if (message.toLowerCase().includes("stress")) return "Stress must be between 1 and 10.";
    if (message.toLowerCase().includes("motivation")) return "Motivation must be between 1 and 10.";
    return message;
  }

  async function saveWeeklyCheckIn() {
    if (!programmeInstanceId || !weekUnlocked) return;
    setCheckInSaving(true);
    setCheckInError(null);
    const previous = getCheckInForWeek(weeklyCheckIns, selectedWeek);
    const optimistic: WeeklyCheckInRecord = {
      id: previous?.id ?? `optimistic-${selectedWeek}`,
      week_number: selectedWeek,
      bodyweight_kg: parseBodyweightKg(checkInDraft.bodyweight_kg),
      sleep_hours: asNumberOrNull(checkInDraft.sleep_hours),
      energy_score: asNumberOrNull(checkInDraft.energy_score),
      recovery_score: asNumberOrNull(checkInDraft.recovery_score),
      stress_score: asNumberOrNull(checkInDraft.stress_score),
      motivation_score: asNumberOrNull(checkInDraft.motivation_score),
      adherence_score: adherencePercent,
      biggest_win: checkInDraft.biggest_win.trim() || null,
      biggest_struggle: checkInDraft.biggest_struggle.trim() || null,
      pain_or_injury: checkInDraft.pain_or_injury.trim() || null,
      notes: checkInDraft.notes.trim() || null,
      submitted_at: new Date().toISOString(),
    };
    setWeeklyCheckIns((prev) => ({ ...prev, [selectedWeek]: optimistic }));
    try {
      const res = await fetch("/api/dashboard/weekly-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          week_number: selectedWeek,
          bodyweight_kg: optimistic.bodyweight_kg,
          sleep_hours: optimistic.sleep_hours,
          energy_score: optimistic.energy_score,
          recovery_score: optimistic.recovery_score,
          stress_score: optimistic.stress_score,
          motivation_score: optimistic.motivation_score,
          adherence_score: optimistic.adherence_score,
          biggest_win: optimistic.biggest_win,
          biggest_struggle: optimistic.biggest_struggle,
          pain_or_injury: optimistic.pain_or_injury,
          notes: optimistic.notes,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(userFriendlyCheckInError(payload.error));
      }
      const payload = (await res.json()) as { checkIn: WeeklyCheckInRecord };
      setWeeklyCheckIns((prev) => ({ ...prev, [selectedWeek]: payload.checkIn }));
      setCheckInSuccess("Weekly check-in saved.");
      setCheckInOpen(false);
    } catch (err) {
      setWeeklyCheckIns((prev) => {
        if (!previous) {
          const copy = { ...prev };
          delete copy[selectedWeek];
          return copy;
        }
        return { ...prev, [selectedWeek]: previous };
      });
      setCheckInError(
        err instanceof Error
          ? userFriendlyCheckInError(err.message)
          : "We couldn't save your weekly check-in. Please try again."
      );
    } finally {
      setCheckInSaving(false);
    }
  }

  const displayName = email.includes("@") ? email.split("@")[0] : email || "Member";

  const blockPillLabel = `Block ${blockIdForWeek(effectiveCurrentWeek)} · ${currentBlockMeta.name}`;
  const selectedLog = selectedSession ? sessionLogs[selectedSession.sessionKey] : null;

  const roadmapPillClass = (
    week: number,
    unlocked: boolean,
    isProgrammeCurrent: boolean,
    isSelected: boolean
  ) => {
    let c =
      "flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold transition-all sm:h-14 sm:w-14 sm:text-base ";
    if (!unlocked) {
      c += "cursor-not-allowed border border-zinc-800 bg-zinc-950 text-zinc-600";
    } else if (isProgrammeCurrent) {
      c += "border border-yellow-400/60 bg-yellow-400 text-zinc-950 shadow-[0_0_20px_rgba(250,204,21,0.25)]";
    } else if (week < effectiveCurrentWeek) {
      c += "border border-zinc-800 bg-zinc-800 text-white hover:border-zinc-700/60 hover:bg-zinc-700";
    } else {
      c += "border border-zinc-800 bg-zinc-800 text-zinc-200 hover:border-zinc-700/60 hover:bg-zinc-700";
    }
    if (isSelected && unlocked && !isProgrammeCurrent) {
      c += " ring-2 ring-inset ring-yellow-400/50";
    }
    return c;
  };

  const weekStripButtonClass = (
    week: number,
    unlocked: boolean,
    isSelected: boolean,
    isProgrammeCurrent: boolean
  ) => {
    let c =
      "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-all sm:h-[3.75rem] sm:w-[3.75rem] sm:text-base ";
    if (!unlocked) {
      c += "cursor-not-allowed border border-zinc-800 bg-zinc-950/80 text-zinc-600";
    } else if (isSelected) {
      c += "border border-yellow-400 bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-400/20";
    } else {
      c +=
        "border border-zinc-800 bg-zinc-800 text-white hover:border-zinc-700/60 hover:bg-zinc-700";
    }
    if (isProgrammeCurrent && !isSelected && unlocked) {
      c += " ring-2 ring-inset ring-yellow-400/45";
    }
    return c;
  };

  const programmePendingCard = (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 sm:p-10">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl" />
      <div className="relative flex flex-col items-center text-center">
        <span className="mb-3 inline-flex items-center rounded-full border border-yellow-400/35 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-400">
          Programme pending
        </span>
        <Sparkles className="mb-4 h-12 w-12 text-yellow-400/90" />
        <p className="max-w-md text-base font-medium leading-relaxed text-white sm:text-lg">
          Your 12-week programme sessions will appear here once generated.
        </p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
          Your personalised sessions will appear here once your 12-week programme is generated. No mock
          workouts — only your real plan when it&apos;s attached to this week.
        </p>
      </div>
    </div>
  );

  const lockedWeekHint = (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center sm:p-10">
      <Lock className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
      <p className="text-base font-medium text-zinc-300">This week is locked</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
        This week unlocks with your next membership month.
      </p>
    </div>
  );

  const nextSessionPending = (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400/90">Next session</p>
      <p className="mt-3 text-lg font-semibold text-white">Nothing scheduled for this view yet</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        When your coach attaches plan data for an unlocked week, your next session will show here with a
        one-tap view.
      </p>
      <button
        type="button"
        disabled
        className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/80 py-3.5 text-sm font-semibold text-zinc-500"
      >
        <Play className="h-5 w-5" />
        Programme pending
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-2 sm:px-6 lg:px-8 lg:pt-4">
        {/* Premium header — full width */}
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 shadow-md shadow-yellow-400/15 sm:h-16 sm:w-16">
                <Dumbbell className="h-8 w-8 text-zinc-900 sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Member Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Hybrid365</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-yellow-400 ring-1 ring-inset ring-yellow-400/30">
                    Active Member
                  </span>
                  <span className="hidden text-sm text-zinc-500 sm:inline">·</span>
                  <span className="hidden max-w-md truncate text-sm text-zinc-400 sm:inline">{programmeTitle}</span>
                </div>
                <p className="mt-2 truncate text-sm text-zinc-400 sm:hidden">{programmeTitle}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-800/80 pt-4 sm:flex-row sm:items-center sm:border-t-0 sm:pt-0 lg:flex-col lg:items-end lg:border-t-0">
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500 sm:max-w-[220px] lg:max-w-[280px]">{email}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-zinc-800 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-700/60 hover:bg-zinc-700"
                >
                  Sign out
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-800/80">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_min(380px,34%)] xl:grid-cols-[1fr_420px] xl:gap-12">
          {/* ——— Main column ——— */}
          <div className="min-w-0 space-y-10">
            {/* Week hero */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 lg:p-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
                {blockPillLabel}
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Week {effectiveCurrentWeek}
                <span className="text-zinc-600"> of 12</span>
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
                {weeklyFocusSubtitle}
              </p>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-400">
                  <span>12-week progress</span>
                  <span className="text-yellow-400">{progressPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 lg:gap-5">
                <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700/60 sm:p-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/20">
                      <Calendar className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Sessions</span>
                  </div>
                  <p className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {weekUnlocked && hasPlanForSelectedWeek ? completedCount : 0}{" "}
                    <span className="text-xl font-semibold text-zinc-500 sm:text-2xl">
                      / {weekUnlocked && hasPlanForSelectedWeek ? totalSessionsThisWeek : "—"}
                    </span>
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    {allSessionsCompleted && totalSessionsThisWeek > 0
                      ? "Week complete"
                      : "Completion logging is live"}
                  </p>
                </div>
                <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700/60 sm:p-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/20">
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Weekly load</span>
                  </div>
                  <p className="line-clamp-2 text-xl font-bold leading-tight text-white sm:text-2xl">
                    {displayWeeklyLoad}
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">From selected week plan</p>
                </div>
                <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700/60 sm:p-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/20">
                      <ClipboardCheck className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Next check-in</span>
                  </div>
                  <p className="text-2xl font-bold text-white sm:text-3xl">{nextCheckInStatus}</p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    {checkInDue ? "Check-in due this week" : "Check-in complete this week"}
                  </p>
                </div>
                <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700/60 sm:p-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/20">
                      <Target className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Current block</span>
                  </div>
                  <p className="text-xl font-bold leading-tight text-white sm:text-2xl">{currentBlockMeta.name}</p>
                  <p className="mt-2 text-xs font-medium text-zinc-500">Block {currentBlockMeta.id} of 3</p>
                </div>
              </div>
            </section>

            {/* Roadmap */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 sm:p-8">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h3 className="text-xl font-bold text-white sm:text-2xl">12-week roadmap</h3>
                <span className="hidden text-sm text-zinc-500 sm:inline">Tap unlocked weeks below</span>
              </div>
              <div className="space-y-8">
                {BLOCKS.map((block) => {
                  const isCurrentBlock = block.id === blockIdForWeek(effectiveCurrentWeek);
                  return (
                    <div
                      key={block.id}
                      className={`rounded-xl border p-5 sm:p-6 ${
                        isCurrentBlock
                          ? "border-yellow-400/20 bg-yellow-400/[0.05]"
                          : "border-zinc-800 bg-zinc-950/50"
                      }`}
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className={`h-3.5 w-3.5 shrink-0 rounded-full ${block.dot}`} />
                        <span className={`text-base font-semibold ${isCurrentBlock ? "text-white" : "text-zinc-500"}`}>
                          Block {block.id}: {block.name}
                        </span>
                        {isCurrentBlock && (
                          <span className="rounded-full bg-yellow-400/20 px-2.5 py-1 text-xs font-semibold text-yellow-400">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {block.weeks.map((week) => {
                          const w = allWeeks[week - 1];
                          const unlocked = Boolean(w?.is_unlocked);
                          const isProgrammeCurrent = week === effectiveCurrentWeek;
                          const isSelected = week === selectedWeek;
                          return (
                            <button
                              key={week}
                              type="button"
                              disabled={!unlocked}
                              onClick={() => unlocked && setSelectedWeek(week)}
                              title={unlocked ? `Week ${week}` : "Locked"}
                              className={roadmapPillClass(week, unlocked, isProgrammeCurrent, isSelected)}
                            >
                              {!unlocked ? <Lock className="h-4 w-4 sm:h-5 sm:w-5" /> : week}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Week selector */}
            <section>
              <h3 className="mb-4 text-base font-semibold text-zinc-300">Select week</h3>
              <div className="-mx-1 flex gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allWeeks.map((w) => {
                  const week = w.week_number;
                  const unlocked = Boolean(w.is_unlocked);
                  const isSelected = week === selectedWeek;
                  const isProgrammeCurrent = week === effectiveCurrentWeek;
                  return (
                    <button
                      key={week}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => unlocked && setSelectedWeek(week)}
                      className={weekStripButtonClass(week, unlocked, isSelected, isProgrammeCurrent)}
                    >
                      {unlocked ? `W${week}` : <Lock className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Viewing <span className="font-medium text-zinc-300">Week {selectedWeek}</span>
                {selectedPayload?.title ? <span className="text-zinc-500"> · {selectedPayload.title}</span> : null}
              </p>
            </section>

            {/* Sessions */}
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-xl font-bold text-white sm:text-2xl">This week&apos;s sessions</h3>
                {weekUnlocked && hasPlanForSelectedWeek ? (
                  <span className="rounded-full border border-zinc-800 bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300">
                    {completedCount}/{sessions.length} completed
                  </span>
                ) : null}
              </div>

              {!weekUnlocked ? (
                lockedWeekHint
              ) : !hasPlanForSelectedWeek ? (
                programmePendingCard
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <SessionRowCard
                      key={session.sessionKey}
                      session={session}
                      completed={Boolean(sessionLogs[session.sessionKey]?.completed)}
                      onView={() => openSessionDrawer(session)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ——— Sidebar ——— */}
          <aside className="min-w-0 space-y-8 lg:sticky lg:top-6 lg:self-start">
            <div>
              <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">Next session</h3>
              {!weekUnlocked ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-500">
                  Unlock a week to preview your next session.
                </div>
              ) : !hasPlanForSelectedWeek ? (
                nextSessionPending
              ) : allSessionsCompleted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Next session</p>
                  <p className="mt-3 text-lg font-semibold text-white">Week complete</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    Great work. You have completed all sessions for this week.
                  </p>
                </div>
              ) : nextSession ? (
                <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
                        {nextSession.day}
                      </span>
                      <h4 className="mt-2 text-2xl font-bold leading-tight text-white">{nextSession.title}</h4>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        priorityKeyLabel(nextSession)
                      )}`}
                    >
                      {priorityKeyLabel(nextSession)}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-400 sm:text-base">{nextSession.intent}</p>
                  <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400/80" />
                      {nextSession.duration}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sessionCategories(nextSession).map((cat) => (
                        <span
                          key={cat}
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getCategoryStyle(cat)}`}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSessionDrawer(nextSession)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-yellow-400/25 transition hover:bg-yellow-300"
                  >
                    <Play className="h-5 w-5" />
                    Start session
                  </button>
                </div>
              ) : null}
            </div>

            {/* Weekly check-in */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-white">Weekly check-in</h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    selectedWeekCheckIn
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-800 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {weekUnlocked
                    ? selectedWeekCheckIn
                      ? `Week ${selectedWeek} check-in complete`
                      : `Week ${selectedWeek} check-in due`
                    : `Week ${selectedWeek} locked`}
                </span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-zinc-400">
                {weekUnlocked
                  ? `Log recovery and bodyweight for Week ${selectedWeek}.`
                  : "Check-ins unlock with this week in your membership cycle."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: TrendingUp,
                    label: "Bodyweight",
                    value:
                      selectedWeekCheckIn?.bodyweight_kg != null
                        ? `${selectedWeekCheckIn.bodyweight_kg} kg`
                        : "—",
                  },
                  {
                    icon: Moon,
                    label: "Sleep",
                    value:
                      selectedWeekCheckIn?.sleep_hours != null
                        ? `${selectedWeekCheckIn.sleep_hours} h`
                        : "—",
                  },
                  {
                    icon: Zap,
                    label: "Energy",
                    value:
                      selectedWeekCheckIn?.energy_score != null
                        ? `${selectedWeekCheckIn.energy_score}/10`
                        : "—",
                  },
                  {
                    icon: Battery,
                    label: "Recovery",
                    value:
                      selectedWeekCheckIn?.recovery_score != null
                        ? `${selectedWeekCheckIn.recovery_score}/10`
                        : "—",
                  },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-zinc-400">
                      <metric.icon className="h-4 w-4 text-yellow-400/80" />
                      <span className="text-xs font-medium uppercase tracking-wide">{metric.label}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
              {checkInSuccess ? <p className="mt-3 text-sm text-emerald-300">{checkInSuccess}</p> : null}
              {checkInError ? <p className="mt-3 text-sm text-red-300">{checkInError}</p> : null}
              <button
                type="button"
                onClick={openCheckInDrawer}
                disabled={!weekUnlocked}
                className="mt-5 w-full rounded-xl bg-yellow-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {weekUnlocked
                  ? selectedWeekCheckIn
                    ? "Edit check-in"
                    : "Complete check-in"
                  : "Locked for this month"}
              </button>
            </div>

            {/* Progress preview */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-7">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Progress preview</h3>
                <span className="text-xs font-medium text-zinc-500">Live</span>
              </div>
              <p className="mb-5 text-sm text-zinc-500">Bodyweight and training response from your check-ins and logs.</p>
              <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Bodyweight trend</span>
                  <span className="text-xs text-zinc-500">{weightSeries.length} logs</span>
                </div>
                {weightSeries.length === 0 ? (
                  <p className="text-sm text-zinc-500">Bodyweight trend appears after your first check-in.</p>
                ) : (
                  <div className="flex h-32 items-end justify-between gap-2 sm:h-36">
                    {weightSeries.map((entry) => {
                      const base = startingWeight ?? entry.bodyweight_kg ?? 0;
                      const value = entry.bodyweight_kg ?? base;
                      const pct = Math.max(20, Math.min(100, 50 + (value - base) * 8));
                      return (
                        <div
                          key={entry.week_number}
                          className="flex flex-1 flex-col items-center justify-end gap-2"
                        >
                          <div
                            className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-yellow-600/40 to-yellow-400/60"
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-[10px] font-medium text-zinc-600">W{entry.week_number}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bodyweight</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{latestWeight != null ? `${latestWeight} kg` : "—"}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {startingWeight != null && totalWeightChange != null
                      ? `Start ${startingWeight} kg (${totalWeightChange >= 0 ? "+" : ""}${totalWeightChange.toFixed(
                          1
                        )} kg)`
                      : "Awaiting first check-in"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Adherence (%)</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{adherencePercent != null ? `${adherencePercent}%` : "—"}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {totalSessionsThisWeek > 0
                      ? `${completedCount}/${totalSessionsThisWeek} sessions complete`
                      : "No sessions this week"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Avg RPE</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{averageRpe ?? "—"}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {rpeValues.length > 0 ? `${rpeValues.length} logged sessions` : "Add RPE in session log"}
                  </p>
                </div>
              </div>
            </div>

            {/* Compact account */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Account</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{email}</p>
              <p className="mt-2 text-xs font-medium text-emerald-400/90">Membership active</p>
              {membershipExpiresAt ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Until {new Date(membershipExpiresAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">No expiry set</p>
              )}
            </div>
          </aside>
        </div>

        {/* Member features — full width */}
        <section className="mt-12 border-t border-zinc-800/80 pt-12">
          <h3 className="text-xl font-bold text-white sm:text-2xl">Member features</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Coming next: log completion, RPE, notes and check-ins directly inside your Hybrid365 dashboard.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5">
            {[
              { title: "Session completion", description: "Track your workouts", icon: CheckCircle2, soon: false },
              { title: "RPE & notes", description: "Log effort and feedback", icon: FileText, soon: false },
              { title: "Weekly check-ins", description: "Monitor your progress", icon: ClipboardCheck, soon: false },
              { title: "Bodyweight graph", description: "Visual weight tracking", icon: LineChart, soon: false },
              { title: "Benchmarks", description: "Test your limits", icon: Target, soon: true },
              { title: "Progress tracker", description: "Long-term analytics", icon: BarChart3, soon: true },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`rounded-2xl border p-6 transition-all sm:p-7 ${
                    feature.soon
                      ? "border-zinc-800/60 bg-zinc-950/50"
                      : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700/60"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
                        feature.soon ? "bg-zinc-800" : "bg-yellow-400/20 ring-1 ring-yellow-400/30"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.soon ? "text-zinc-600" : "text-yellow-400"}`}
                      />
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        feature.soon ? "bg-zinc-800 text-zinc-500" : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {feature.soon ? "Coming" : "Included"}
                    </span>
                  </div>
                  <h4 className={`text-lg font-semibold ${feature.soon ? "text-zinc-500" : "text-white"}`}>
                    {feature.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-12 border-t border-zinc-800/80 pt-8 text-center">
          <p className="text-sm text-zinc-600">© 2026 Hybrid365 · Member app</p>
        </footer>
      </div>

      {checkInOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close weekly check-in"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setCheckInOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-600" />
            <div className="mx-auto max-w-3xl p-5 pb-12 sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400">
                    Week {selectedWeek}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Weekly check-in</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckInOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-800 p-2.5 text-zinc-300 hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Bodyweight (kg)
                  </span>
                  <input
                    value={checkInDraft.bodyweight_kg}
                    onChange={(e) =>
                      setCheckInDraft((prev) => ({ ...prev, bodyweight_kg: e.target.value }))
                    }
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="e.g. 78.4"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Sleep hours
                  </span>
                  <input
                    value={checkInDraft.sleep_hours}
                    onChange={(e) =>
                      setCheckInDraft((prev) => ({ ...prev, sleep_hours: e.target.value }))
                    }
                    inputMode="decimal"
                    placeholder="e.g. 7.5"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  ["energy_score", "Energy"],
                  ["recovery_score", "Recovery"],
                  ["stress_score", "Stress"],
                  ["motivation_score", "Motivation"],
                ].map(([key, label]) => (
                  <label key={key} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {label} (1-10)
                    </span>
                    <input
                      value={checkInDraft[key as keyof typeof checkInDraft]}
                      onChange={(e) =>
                        setCheckInDraft((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      inputMode="numeric"
                      placeholder="1-10"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 space-y-3">
                <textarea
                  value={checkInDraft.biggest_win}
                  onChange={(e) => setCheckInDraft((prev) => ({ ...prev, biggest_win: e.target.value }))}
                  rows={2}
                  placeholder="Biggest win this week"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
                <textarea
                  value={checkInDraft.biggest_struggle}
                  onChange={(e) =>
                    setCheckInDraft((prev) => ({ ...prev, biggest_struggle: e.target.value }))
                  }
                  rows={2}
                  placeholder="Biggest struggle this week"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
                <textarea
                  value={checkInDraft.pain_or_injury}
                  onChange={(e) =>
                    setCheckInDraft((prev) => ({ ...prev, pain_or_injury: e.target.value }))
                  }
                  rows={2}
                  placeholder="Pain or injury notes"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
                <textarea
                  value={checkInDraft.notes}
                  onChange={(e) => setCheckInDraft((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Extra notes"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              </div>
              {checkInError ? <p className="mt-3 text-sm text-red-300">{checkInError}</p> : null}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={saveWeeklyCheckIn}
                  disabled={checkInSaving || !programmeInstanceId}
                  className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkInSaving ? "Saving..." : "Save check-in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && selectedSession && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close session details"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-600" />
            <div className="mx-auto max-w-3xl p-5 pb-12 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-400">
                    {selectedSession.day}
                  </p>
                  <span className="text-sm font-medium text-zinc-300">
                    {selectedSession.priorityDisplayLabel} — {selectedSession.priorityCategoryLabel}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{selectedSession.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-400">{selectedSession.intent}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-800 p-2.5 text-zinc-300 hover:bg-zinc-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Timer className="h-4 w-4" />
                    Duration
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedSession.duration}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Clock className="h-4 w-4" />
                    Time cap
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {selectedSession.timeCap || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Gauge className="h-4 w-4" />
                    Guide
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedSession.rpeGuide}</p>
                </div>
              </div>

              {[
                ["Warm-up", selectedSession.warmUp],
                ["Main work", selectedSession.mainWork],
                ["Cool-down", selectedSession.coolDown],
                ["Finish", selectedSession.finisher],
                ["Coaching notes", selectedSession.coachingNotes ? [selectedSession.coachingNotes] : []],
              ].map(([label, lines]) =>
                Array.isArray(lines) && lines.length > 0 ? (
                  <div key={String(label)} className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <p className="text-sm font-bold text-white">{String(label)}</p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                      {lines.map((line) => (
                        <li key={line}>
                          <span className="text-yellow-400">·</span> {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}

              <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">Session log</p>
                  {selectedLog?.completed ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      Not completed
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">RPE</p>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDraftRpe(value)}
                        className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                          draftRpe === value
                            ? "border-yellow-400 bg-yellow-400 text-zinc-950"
                            : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700/60"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    rows={4}
                    placeholder="Optional notes about this session..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-700/60"
                  />
                </div>

                {saveError ? <p className="mt-3 text-sm text-red-300">{saveError}</p> : null}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={saving || !programmeInstanceId}
                    onClick={() => saveSessionLog(true)}
                    className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : selectedLog?.completed ? "Save changes" : "Mark complete"}
                  </button>
                  <button
                    type="button"
                    disabled={saving || !programmeInstanceId}
                    onClick={() => saveSessionLog(false)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save as incomplete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
