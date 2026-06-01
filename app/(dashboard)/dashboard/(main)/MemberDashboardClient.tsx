"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Info,
  LayoutGrid,
  LineChart,
  Lock,
  Moon,
  Play,
  Share2,
  Sparkles,
  Star,
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
  extractProgrammeIntelligence,
  extractProgrammeRationale,
  extractWeekRationale,
  extractPaceGuidanceFromPlanJson,
  extractScheduleFromPlanJson,
  normalizeMemberSchedule,
  type MemberSessionDetail,
  type SessionCategoryLabel,
  type ExtractedProgrammeIntelligence,
  type ExtractedProgrammeRationale,
  type ExtractedWeekRationale,
} from "@/app/lib/memberDashboardSchedule";
import { postDashboardGenerateProgramme } from "@/app/lib/postDashboardGenerateProgramme";
import { shareCardInputFromMemberSession } from "@/app/lib/sessionShareCardText";
import { DashboardChallengeTeaser } from "@/components/dashboard/DashboardChallengeTeaser";
import { DashboardHabitsTeaser } from "@/components/dashboard/DashboardHabitsTeaser";
import { DashboardSupportCard } from "@/components/dashboard/DashboardSupportCard";
import { MissedSessionGuidanceNote } from "@/components/dashboard/MissedSessionGuidanceNote";
import {
  COMMUNITY_BUILD_PROGRAMME,
  COMMUNITY_BUILDING_PROGRAMME,
  COMMUNITY_COMPLETE_ATHLETE_PROFILE,
  COMMUNITY_COMPLETE_PROFILE_BODY,
  COMMUNITY_PROFILE_COMPLETE_BODY,
  COMMUNITY_PROFILE_COMPLETE_HEADLINE,
  COMMUNITY_PROGRAMME_STARTS_WITH_PROFILE,
  COMMUNITY_REVIEW_ATHLETE_PROFILE,
} from "@/components/dashboard/communityOnboardingCopy";
import { ProgrammeReadyBanner } from "@/components/dashboard/ProgrammeReadyBanner";
import { ThisWeekTrackingCard } from "@/components/dashboard/ThisWeekTrackingCard";
import { WeeklyCheckInHomeCard } from "@/components/dashboard/WeeklyCheckInHomeCard";
import { WeekOneGuidanceCard } from "@/components/dashboard/WeekOneGuidanceCard";
import {
  buildDashboardWeekTrackingSummary,
  type ChallengeTrackingSummary,
  type DashboardWeekTrackingSummary,
} from "@/app/lib/dashboardWeekTracking";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import type { BenchmarkTestLike } from "@/app/lib/progressMetrics";
import { buildTwelveProgrammeWeeks } from "@/app/lib/progressMetrics";
import type { SessionShareCardProps } from "@/components/share/SessionShareCard";
import { SessionShareCardModal } from "@/components/share/SessionShareCardModal";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import { AddToHomeScreenBanner } from "@/components/dashboard/AddToHomeScreenBanner";
import { DashboardRotatingMessage } from "@/components/dashboard/DashboardRotatingMessage";
import { GoToNextSessionCta } from "@/components/dashboard/GoToNextSessionCta";
import { MemberSessionDetailDrawer } from "@/components/dashboard/MemberSessionDetailDrawer";
import { MemberStartHereChecklist } from "@/components/dashboard/MemberStartHereChecklist";
import { findNextMemberSession } from "@/app/lib/memberNextSession";
import { useMemberSessionLogs } from "@/app/lib/memberSessionLog";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";
import {
  OnboardingHowItWorksCard,
  OnboardingStructureBlock,
  OnboardingWhopEmailNote,
} from "@/components/dashboard/OnboardingEducation";

export type WeekPayload = {
  week_number: number;
  title: string | null;
  is_unlocked: boolean | null;
  plan_json: unknown | null;
};

export type MemberDashboardClientProps = {
  email: string;
  viewerDisplayName: string;
  programmeTitle: string;
  membershipExpiresAt: string | null;
  instanceCurrentWeek: number | null;
  programmeInstanceId: string | null;
  weeksFromDb: WeekPayload[];
  initialSessionLogs: SessionLogRecord[];
  initialWeeklyCheckIns: WeeklyCheckInRecord[];
  assessmentCompleted: boolean;
  coreTestsLogged: number;
  programmeGenerated: boolean;
  weekTrackingSummary: DashboardWeekTrackingSummary | null;
  habitLogs: DailyHabitLogRow[];
  benchmarkTests: BenchmarkTestLike[];
  challengeTracking: ChallengeTrackingSummary | null;
  maxHeartRate: number | null;
  hasEngineBenchmark: boolean;
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
  onShare,
}: {
  session: SessionWithKey;
  completed: boolean;
  onView: () => void;
  onShare?: () => void;
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
          {session.doubleSession ? (
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              {session.doubleSession.label}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="h-4 w-4 shrink-0 text-yellow-400/80" />
          <span>{session.duration}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center">
        {completed && onShare ? (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-900/50"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </button>
        ) : null}
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
  viewerDisplayName,
  programmeTitle,
  membershipExpiresAt,
  instanceCurrentWeek,
  programmeInstanceId,
  weeksFromDb,
  initialSessionLogs,
  initialWeeklyCheckIns,
  assessmentCompleted,
  coreTestsLogged,
  programmeGenerated,
  habitLogs,
  benchmarkTests,
  challengeTracking,
  maxHeartRate,
  hasEngineBenchmark,
}: MemberDashboardClientProps) {
  const router = useRouter();
  const [generatingProgramme, setGeneratingProgramme] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);
  const [showProgrammeReadyBanner, setShowProgrammeReadyBanner] = useState(false);
  const allWeeks = useMemo(() => buildTwelveWeeks(weeksFromDb), [weeksFromDb]);

  useEffect(() => {
    if (!programmeGenerated) return;
    try {
      if (sessionStorage.getItem("hybrid365-programme-ready") === "1") {
        setShowProgrammeReadyBanner(true);
        sessionStorage.removeItem("hybrid365-programme-ready");
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [programmeGenerated]);

  const derivedFromFlags =
    allWeeks.find((w) => w.is_unlocked)?.week_number ??
    allWeeks.find((w) => w.week_number === 1)?.week_number ??
    1;

  const effectiveCurrentWeek =
    clampWeek(instanceCurrentWeek) ?? clampWeek(derivedFromFlags) ?? 1;

  const [selectedWeek, setSelectedWeek] = useState(effectiveCurrentWeek);
  const [homeScreenHintDone, setHomeScreenHintDone] = useState(false);
  const {
    sessionLogs,
    drawerOpen,
    setDrawerOpen,
    selectedSession,
    selectedLog,
    draftRpe,
    setDraftRpe,
    draftNotes,
    setDraftNotes,
    saving,
    saveError,
    openSessionDrawer,
    closeSessionDrawer,
    saveSessionLog,
  } = useMemberSessionLogs(programmeInstanceId, initialSessionLogs);
  const [shareCard, setShareCard] = useState<SessionShareCardProps | null>(null);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("hybrid365-home-screen-cta-dismissed") === "1";
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const standalone =
        nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
      if (dismissed || standalone) setHomeScreenHintDone(true);
    } catch {
      // ignore
    }
  }, []);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<Record<number, WeeklyCheckInRecord>>(
    () => Object.fromEntries(initialWeeklyCheckIns.map((entry) => [entry.week_number, entry]))
  );

  const weekTrackingSummary = useMemo(() => {
    if (!programmeGenerated) return null;
    const weeks12 = buildTwelveProgrammeWeeks(
      allWeeks.map((w) => ({
        week_number: w.week_number,
        is_unlocked: w.is_unlocked ?? false,
        plan_json: w.plan_json,
      }))
    );
    const logsList = Object.values(sessionLogs).map((log) => ({
      week_number: log.week_number,
      session_key: log.session_key,
      completed: log.completed,
      rpe: log.rpe,
    }));
    const checkInsList = Object.values(weeklyCheckIns).map((c) => ({
      week_number: c.week_number,
      bodyweight_kg: c.bodyweight_kg,
      sleep_hours: c.sleep_hours,
      energy_score: c.energy_score,
      recovery_score: c.recovery_score,
      stress_score: c.stress_score,
      motivation_score: c.motivation_score,
      submitted_at: c.submitted_at,
    }));
    return buildDashboardWeekTrackingSummary({
      weeks: weeks12,
      sessionLogs: logsList,
      weeklyCheckIns: checkInsList,
      effectiveWeek: effectiveCurrentWeek,
      habitLogs,
      challenge: challengeTracking,
      benchmarkTests,
    });
  }, [
    programmeGenerated,
    allWeeks,
    sessionLogs,
    weeklyCheckIns,
    effectiveCurrentWeek,
    habitLogs,
    challengeTracking,
    benchmarkTests,
  ]);
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
  const scheduleNormalizeOptions = useMemo(
    () => ({
      paceGuidance: extractPaceGuidanceFromPlanJson(selectedPayload?.plan_json),
      maxHeartRate,
      hasEngineBenchmark,
    }),
    [selectedPayload?.plan_json, maxHeartRate, hasEngineBenchmark]
  );

  const sessions = useMemo(() => {
    if (!scheduleRaw) return [];
    return normalizeMemberSchedule(scheduleRaw, scheduleNormalizeOptions).map((session, index) => ({
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
  }, [scheduleRaw, selectedWeek, scheduleNormalizeOptions]);
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

  // Programme-level rationale lives in Week 1 plan_json
  const week1PlanJson = useMemo(
    () => allWeeks.find((w) => w.week_number === 1)?.plan_json ?? null,
    [allWeeks]
  );
  const programmeRationale = useMemo(
    (): ExtractedProgrammeRationale | null => extractProgrammeRationale(week1PlanJson),
    [week1PlanJson]
  );

  const programmeIntelligence = useMemo(
    (): ExtractedProgrammeIntelligence | null => extractProgrammeIntelligence(week1PlanJson),
    [week1PlanJson]
  );

  const programmeIntelligenceChips = useMemo(() => {
    const k = programmeIntelligence;
    if (!k) return [] as string[];
    const limShort: Record<string, string> = {
      running_endurance: "Engine / endurance",
      running_speed: "Speed / economy",
      strength: "Strength first",
      hyrox_stations: "Stations",
      body_composition: "Body composition",
      recovery: "Low impact",
      consistency: "Consistency",
      general: "Balanced",
    };
    const goalShort =
      k.primary_goal === "hybrid"
        ? "Hybrid"
        : k.primary_goal === "running"
          ? "Running"
          : "Strength";
    const chips: string[] = [`${goalShort} goal`, limShort[k.limiter_focus] ?? "Balanced"];
    if (k.event_mode === "event" && !["none", "other"].includes(k.event_specificity)) {
      const evShort: Record<string, string> = {
        hyrox_pro: "Hyrox Pro",
        hyrox_open: "Hyrox Open",
        hyrox_doubles: "Hyrox Doubles",
        running_race: "Running race",
        triathlon: "Triathlon",
      };
      const ev = evShort[k.event_specificity];
      if (ev) chips.push(ev);
    }
    if (k.benchmark_confidence === "low") chips.push("Add baselines");
    else if (k.benchmark_confidence === "medium") chips.push("Tracking: ok");
    else chips.push("Tracking: strong");
    if (k.impact_risk === "high") chips.push("Conservative load");
    return chips.slice(0, 5);
  }, [programmeIntelligence]);

  // Week-level rationale from selected week
  const weekRationale = useMemo(
    (): ExtractedWeekRationale | null => extractWeekRationale(selectedPayload?.plan_json ?? null),
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
  const nextSession = useMemo(() => {
    if (!programmeGenerated) return null;
    return findNextMemberSession({
      weeks: allWeeks,
      sessionLogs,
      startWeek: effectiveCurrentWeek,
    });
  }, [programmeGenerated, allWeeks, sessionLogs, effectiveCurrentWeek]);

  const hasCompletedSession = useMemo(
    () => Object.values(sessionLogs).some((log) => log.completed),
    [sessionLogs]
  );
  const hasHabitLog = habitLogs.length > 0;
  const hasCheckIn = Boolean(getCheckInForWeek(weeklyCheckIns, effectiveCurrentWeek));
  const forceShowStartHere = !assessmentCompleted || !programmeGenerated;
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

  async function handleGenerateProgramme() {
    setGeneratingProgramme(true);
    setGenerateError(null);
    setGenerateSuccess(null);
    const result = await postDashboardGenerateProgramme();
    if (!result.ok) {
      setGenerateError(result.error);
      setGeneratingProgramme(false);
      return;
    }
    try {
      sessionStorage.setItem("hybrid365-programme-ready", "1");
    } catch {
      /* ignore */
    }
    setGenerateSuccess("ready");
    setShowProgrammeReadyBanner(true);
    setGeneratingProgramme(false);
    router.refresh();
  }

  function handleSignOut() {
    window.location.href = "/logout";
  }

  function openSessionShare(session: MemberSessionDrawerSession) {
    setShareCard(shareCardInputFromMemberSession(session, sessionLogs[session.sessionKey]));
  }

  function openCheckInDrawer(forWeek?: number) {
    const week = forWeek ?? selectedWeek;
    const weekRow = allWeeks.find((w) => w.week_number === week);
    if (!weekRow?.is_unlocked) return;
    setSelectedWeek(week);
    const existing = getCheckInForWeek(weeklyCheckIns, week);
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

  const blockPillLabel = `Block ${blockIdForWeek(effectiveCurrentWeek)} · ${currentBlockMeta.name}`;

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
          {assessmentCompleted ? "Ready to build" : "Athlete Profile first"}
        </span>
        <Sparkles className="mb-4 h-12 w-12 text-yellow-400/90" />
        <p className="max-w-md text-base font-medium leading-relaxed text-white sm:text-lg">
          {assessmentCompleted
            ? COMMUNITY_PROFILE_COMPLETE_HEADLINE
            : COMMUNITY_PROGRAMME_STARTS_WITH_PROFILE}
        </p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
          {assessmentCompleted ? COMMUNITY_PROFILE_COMPLETE_BODY : COMMUNITY_COMPLETE_PROFILE_BODY}
        </p>
        {assessmentCompleted ? (
          <button
            type="button"
            disabled={generatingProgramme}
            onClick={handleGenerateProgramme}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingProgramme ? COMMUNITY_BUILDING_PROGRAMME : COMMUNITY_BUILD_PROGRAMME}
          </button>
        ) : (
          <Link
            href="/dashboard/assessment"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            {COMMUNITY_COMPLETE_ATHLETE_PROFILE}
          </Link>
        )}
      </div>
    </div>
  );

  const lockedWeekHint = (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center sm:p-10">
      <Lock className="mx-auto mb-4 h-10 w-10 text-zinc-500" />
      <p className="text-base font-medium text-zinc-300">This week is locked</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
        Unlocks with your next membership month. Continue your membership to unlock this block.
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
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:px-6 lg:px-8 lg:pt-4">
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
                <p className="text-sm font-semibold text-white">{viewerDisplayName}</p>
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
          <div className="mt-5">
            <DashboardSubnav variant="zinc" />
          </div>
        </header>

        <AddToHomeScreenBanner />

        {programmeGenerated ? (
          <div className="mb-8">
            <WeeklyCheckInHomeCard
              effectiveWeek={effectiveCurrentWeek}
              checkIn={getCheckInForWeek(weeklyCheckIns, effectiveCurrentWeek)}
              programmeGenerated={programmeGenerated}
            />
          </div>
        ) : null}

        {programmeGenerated ? (
          <GoToNextSessionCta
            nextSession={nextSession}
            programmeGenerated={programmeGenerated}
            onOpenSession={(session) => {
              if (session.weekNumber !== selectedWeek) {
                setSelectedWeek(session.weekNumber);
              }
              openSessionDrawer(session);
            }}
          />
        ) : null}

        {programmeGenerated && weekTrackingSummary ? (
          <ThisWeekTrackingCard
            summary={weekTrackingSummary}
            onCompleteCheckIn={() => router.push("/dashboard/check-in")}
          />
        ) : null}

        {programmeGenerated ? <DashboardRotatingMessage /> : null}

        <MemberStartHereChecklist
          assessmentCompleted={assessmentCompleted}
          coreTestsLogged={coreTestsLogged}
          programmeGenerated={programmeGenerated}
          hasCompletedSession={hasCompletedSession}
          hasHabitLog={hasHabitLog}
          hasCheckIn={hasCheckIn}
          homeScreenHintDone={homeScreenHintDone}
          forceShow={forceShowStartHere}
          onGenerateProgramme={handleGenerateProgramme}
          generatingProgramme={generatingProgramme}
        />

        {!programmeGenerated ? (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 shadow-xl shadow-black/40 sm:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(250,204,21,0.14),transparent)]" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400/90">Start here</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                  {assessmentCompleted
                    ? COMMUNITY_PROFILE_COMPLETE_HEADLINE
                    : COMMUNITY_PROGRAMME_STARTS_WITH_PROFILE}
                </h2>
                <p className="mt-3 text-lg font-semibold leading-snug text-yellow-200/95 sm:text-xl">
                  {assessmentCompleted
                    ? "Hybrid365 builds your plan — you follow the coaching system."
                    : "Refuse average. Build your structure. Become stronger, fitter and faster."}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  {assessmentCompleted
                    ? COMMUNITY_PROFILE_COMPLETE_BODY
                    : COMMUNITY_COMPLETE_PROFILE_BODY}
                </p>
                <OnboardingWhopEmailNote />

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {(() => {
                    const s1 = assessmentCompleted;
                    const s2 = coreTestsLogged >= 4;
                    const steps: {
                      n: 1 | 2 | 3 | 4;
                      label: string;
                      variant: "done" | "active" | "recommended" | "hold";
                    }[] = [
                      { n: 1, label: "Profile", variant: s1 ? "done" : "active" },
                      {
                        n: 2,
                        label: "Baseline",
                        variant: s2 ? "done" : s1 ? "recommended" : "hold",
                      },
                      { n: 3, label: "Build", variant: s1 ? "active" : "hold" },
                      { n: 4, label: "Train", variant: "hold" },
                    ];
                    return steps.map((step) => {
                      const circle =
                        step.variant === "done"
                          ? "bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400/35"
                          : step.variant === "active"
                            ? "bg-yellow-400 text-zinc-950 ring-2 ring-yellow-300/45"
                            : step.variant === "recommended"
                              ? "border border-amber-500/35 bg-amber-950/25 text-amber-200"
                              : "border border-zinc-700 bg-zinc-900 text-zinc-500";
                      return (
                        <div
                          key={step.n}
                          className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 px-2 py-3.5 text-center sm:py-4"
                        >
                          <div
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${circle}`}
                          >
                            {step.variant === "done" ? <CheckCircle2 className="h-5 w-5" /> : step.n}
                          </div>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Step {step.n}
                          </p>
                          <p className="text-xs font-semibold text-zinc-300">{step.label}</p>
                        </div>
                      );
                    });
                  })()}
                </div>

                <OnboardingStructureBlock />
                <OnboardingHowItWorksCard />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {/* Step 1 */}
                  <div
                    className={`rounded-xl border p-5 sm:p-6 ${
                      assessmentCompleted
                        ? "border-emerald-500/25 bg-emerald-950/20"
                        : "border-yellow-500/30 bg-yellow-400/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                        <User className="h-5 w-5 text-yellow-400" />
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          assessmentCompleted
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border-yellow-400/50 bg-yellow-400/15 text-yellow-200"
                        }`}
                      >
                        {assessmentCompleted ? "Complete" : "Required · Active"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white sm:text-lg">Complete your Athlete Profile</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Goal, availability, equipment, current level and limitations — so Hybrid365 can coach you with
                      intent.
                    </p>
                    <Link
                      href="/dashboard/assessment"
                      className={`mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition sm:w-auto ${
                        assessmentCompleted
                          ? "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600"
                          : "bg-yellow-400 text-zinc-950 hover:bg-yellow-300"
                      }`}
                    >
                      {assessmentCompleted ? COMMUNITY_REVIEW_ATHLETE_PROFILE : COMMUNITY_COMPLETE_ATHLETE_PROFILE}
                    </Link>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`rounded-xl border p-5 sm:p-6 ${
                      !assessmentCompleted
                        ? "border-zinc-800/80 bg-zinc-950/40 opacity-70"
                        : coreTestsLogged >= 4
                          ? "border-emerald-500/25 bg-emerald-950/15"
                          : "border-amber-500/25 bg-amber-950/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
                        <Gauge className="h-5 w-5 text-zinc-300" />
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          !assessmentCompleted
                            ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                            : coreTestsLogged >= 4
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                              : "border-amber-500/40 bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {!assessmentCompleted ? "Locked" : coreTestsLogged >= 4 ? "Complete" : "Recommended"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white sm:text-lg">Set your baseline</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Bodyweight, a run marker (5 km or 3 km), one engine test (Ski or Row), and at least one strength
                      marker. Optional — your programme can be built without this, but baselines make progress tracking
                      much richer.
                    </p>
                    {assessmentCompleted ? (
                      <Link
                        href="/dashboard/testing"
                        className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-amber-500/35 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15 sm:w-auto"
                      >
                        Add baseline tests
                      </Link>
                    ) : (
                      <span className="mt-4 inline-flex w-full min-h-[44px] cursor-not-allowed items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-600 sm:w-auto">
                        Add baseline tests
                      </span>
                    )}
                    <p className="mt-2 text-xs text-zinc-500">Baseline testing: {coreTestsLogged}/4 core areas complete</p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`rounded-xl border p-5 sm:p-6 ${
                      !assessmentCompleted
                        ? "border-zinc-800/80 bg-zinc-950/40 opacity-70"
                        : "border-yellow-500/25 bg-yellow-400/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          !assessmentCompleted
                            ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                            : "border-yellow-400/50 bg-yellow-400/15 text-yellow-200"
                        }`}
                      >
                        {!assessmentCompleted ? "Locked" : "Ready"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white sm:text-lg">Build your personalised programme</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Hybrid365 shapes your 12-week plan from your Athlete Profile — hybrid strength, engine and physique
                      in one coached arc.
                    </p>
                    <button
                      type="button"
                      disabled={!assessmentCompleted || generatingProgramme}
                      aria-busy={generatingProgramme}
                      onClick={handleGenerateProgramme}
                      className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {generatingProgramme ? COMMUNITY_BUILDING_PROGRAMME : COMMUNITY_BUILD_PROGRAMME}
                    </button>
                  </div>

                  {/* Step 4 */}
                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-5 opacity-80 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700">
                        <Zap className="h-5 w-5 text-zinc-400" />
                      </div>
                      <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        Next
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white sm:text-lg">Start training + tracking</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                      Start Week 1, log sessions honestly, stack daily habits and weekly check-ins — then lean into the
                      Hybrid Challenge when you&apos;re ready.
                    </p>
                    <p className="mt-3 text-xs font-medium text-zinc-600">Unlocks when your programme is ready.</p>
                  </div>
                </div>

                <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {!assessmentCompleted ? (
                    <Link
                      href="/dashboard/assessment"
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-center text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 sm:flex-none sm:px-8"
                    >
                      {COMMUNITY_COMPLETE_ATHLETE_PROFILE}
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={generatingProgramme}
                        aria-busy={generatingProgramme}
                        onClick={handleGenerateProgramme}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8"
                      >
                        {generatingProgramme ? COMMUNITY_BUILDING_PROGRAMME : COMMUNITY_BUILD_PROGRAMME}
                      </button>
                      <Link
                        href="/dashboard/testing"
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 sm:flex-none"
                      >
                        Add baseline tests
                      </Link>
                    </>
                  )}
                </div>

                {generateError ? <p className="mt-4 text-sm text-red-300">{generateError}</p> : null}
                {generateSuccess ? (
                  <div className="mt-6">
                    <ProgrammeReadyBanner />
                  </div>
                ) : null}
                <DashboardSupportCard className="mt-8" />
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_min(380px,34%)] xl:grid-cols-[1fr_420px] xl:gap-12">
          {/* ——— Main column ——— */}
          <div className="min-w-0 space-y-10">
            {programmeGenerated && showProgrammeReadyBanner ? (
              <ProgrammeReadyBanner onDismiss={() => setShowProgrammeReadyBanner(false)} />
            ) : null}

            {programmeGenerated && effectiveCurrentWeek === 1 ? (
              <WeekOneGuidanceCard />
            ) : null}

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

            {/* ── Why this programme ── */}
            {programmeRationale ? (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/20 ring-1 ring-yellow-400/25">
                    <Star className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Why this programme</h3>
                </div>
                {programmeIntelligenceChips.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2" aria-label="Programme priorities">
                    {programmeIntelligenceChips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-zinc-700/90 bg-zinc-950/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="mb-4 text-xl font-bold text-white">{programmeRationale.headline}</p>
                <ul className="space-y-2 text-sm leading-relaxed text-zinc-300">
                  {programmeRationale.summary.slice(0, 3).map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-1 shrink-0 text-yellow-400">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                {programmeRationale.key_priorities.length > 0 ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Key priorities</p>
                    <ul className="space-y-1.5">
                      {programmeRationale.key_priorities.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400/80" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {programmeRationale.how_to_get_the_most_from_it.length > 0 ? (
                  <details className="mt-5">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-300">
                      How to get the most from it
                    </summary>
                    <ul className="mt-3 space-y-1.5">
                      {programmeRationale.how_to_get_the_most_from_it.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-sm text-zinc-400">
                          <span className="mt-1 shrink-0 text-yellow-400/70">›</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </section>
            ) : null}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Athlete assessment</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {assessmentCompleted ? "Complete" : "Not complete"}
                </p>
                <Link
                  href="/dashboard/assessment"
                  className="mt-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700/60 hover:text-white"
                >
                  Open assessment
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Baseline testing</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Baseline testing: {coreTestsLogged}/4 core areas complete
                </p>
                <Link
                  href="/dashboard/testing"
                  className="mt-4 inline-flex rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700/60 hover:text-white"
                >
                  Open testing
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Next retest</p>
                <p className="mt-2 text-lg font-semibold text-white">Week 4</p>
                <p className="mt-4 text-sm text-zinc-500">Placeholder milestone for first retest checkpoint.</p>
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

            {/* ── This week's focus ── */}
            {weekUnlocked && weekRationale ? (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <Info className="h-4 w-4 shrink-0 text-yellow-400/80" />
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    {weekRationale.week_role}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{weekRationale.why_this_week_matters}</p>
                {weekRationale.key_sessions_to_prioritise.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Prioritise</p>
                    <ul className="space-y-1">
                      {weekRationale.key_sessions_to_prioritise.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="mt-1 shrink-0 text-yellow-400">›</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {weekRationale.progression_focus ? (
                  <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        This week&apos;s progression
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                        {weekRationale.progression_focus}
                      </p>
                    </div>
                    {weekRationale.key_marker_this_week ? (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          Key marker
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">{weekRationale.key_marker_this_week}</p>
                      </div>
                    ) : null}
                    {weekRationale.what_progressed_from_last_week ? (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                          vs last week
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          {weekRationale.what_progressed_from_last_week}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {weekRationale.coach_note ? (
                  <p className="mt-4 border-t border-zinc-800 pt-3 text-xs italic leading-relaxed text-zinc-500">
                    Coach: {weekRationale.coach_note}
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* Sessions */}
            <section>
              <MissedSessionGuidanceNote className="mb-4" />
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
                      onShare={
                        sessionLogs[session.sessionKey]?.completed
                          ? () => openSessionShare(session)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ——— Sidebar ——— */}
          <aside className="min-w-0 space-y-8 lg:sticky lg:top-6 lg:self-start">
            <Link
              href="/dashboard/programme"
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                  <LayoutGrid className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">View full programme</p>
                  <p className="text-xs text-zinc-500">12-week roadmap & sessions</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
            </Link>

            <Link
              href="/dashboard/progress"
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 transition hover:border-yellow-500/30 hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                  <LineChart className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">View full progress</p>
                  <p className="text-xs text-zinc-500">Adherence, recovery, benchmarks</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
            </Link>

            <DashboardHabitsTeaser />

            <DashboardChallengeTeaser />

            <DashboardSupportCard />

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
                onClick={() => openCheckInDrawer()}
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
                  aria-busy={checkInSaving}
                  className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkInSaving ? "Saving..." : "Save check-in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MemberSessionDetailDrawer
        open={drawerOpen}
        session={selectedSession}
        onClose={closeSessionDrawer}
        log={selectedLog}
        draftRpe={draftRpe}
        onDraftRpeChange={setDraftRpe}
        draftNotes={draftNotes}
        onDraftNotesChange={setDraftNotes}
        saving={saving}
        saveError={saveError}
        programmeInstanceId={programmeInstanceId}
        onSaveComplete={() => saveSessionLog(true)}
        onSaveIncomplete={() => saveSessionLog(false)}
        onShare={
          selectedSession
            ? () => openSessionShare(selectedSession)
            : undefined
        }
      />
      {shareCard ? (
        <SessionShareCardModal open onClose={() => setShareCard(null)} card={shareCard} />
      ) : null}
    </div>
  );
}
