"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronRight,
  Droplets,
  Flame,
  Footprints,
  Moon,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { DailyHabitLogRow, HabitFieldKey } from "@/app/lib/dailyHabitLogs";
import {
  coachingNoteForHabits,
  countHabitsHit,
  habitScorePercent,
  habitStreakFromLogs,
  HABIT_TOTAL,
  localDateKey,
  shiftLocalDateKey,
} from "@/app/lib/dailyHabitLogs";
import { DashboardSubnav } from "@/components/DashboardSubnav";

const HABIT_UI: {
  key: HabitFieldKey;
  title: string;
  helper: string;
  icon: typeof Droplets;
}[] = [
  {
    key: "water_hit",
    title: "Water target hit",
    helper: "Hit your fluid plan for the day.",
    icon: Droplets,
  },
  {
    key: "protein_hit",
    title: "Protein target hit",
    helper: "Adequate protein supports recovery and lean mass.",
    icon: Utensils,
  },
  {
    key: "steps_hit",
    title: "Steps target hit",
    helper: "Daily movement supports your engine sessions.",
    icon: Footprints,
  },
  {
    key: "sleep_hit",
    title: "Sleep protected",
    helper: "Enough sleep for tomorrow’s quality.",
    icon: Moon,
  },
  {
    key: "mobility_hit",
    title: "Mobility / recovery",
    helper: "Light prep or cooldown work logged.",
    icon: Sparkles,
  },
  {
    key: "proof_posted",
    title: "Proof posted",
    helper: "Training or habit proof shared with your crew.",
    icon: Camera,
  },
];

function syntheticTodayRow(logDate: string, programmeInstanceId: string | null): DailyHabitLogRow {
  const now = new Date().toISOString();
  return {
    id: `pending-${logDate}`,
    user_id: "",
    programme_instance_id: programmeInstanceId,
    log_date: logDate,
    water_hit: false,
    protein_hit: false,
    steps_hit: false,
    sleep_hit: false,
    mobility_hit: false,
    proof_posted: false,
    notes: null,
    created_at: now,
    updated_at: now,
  };
}

function mergeRow(base: DailyHabitLogRow, patch: Partial<DailyHabitLogRow>): DailyHabitLogRow {
  return { ...base, ...patch };
}

type Props = {
  programmeInstanceId: string | null;
};

export default function HabitsClient({ programmeInstanceId }: Props) {
  const [todayYmd, setTodayYmd] = useState(() => localDateKey(new Date()));
  const [logs, setLogs] = useState<DailyHabitLogRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const notesDebounce = useRef<number | null>(null);
  const pendingNotesRef = useRef("");

  const refreshTodayKey = useCallback(() => {
    setTodayYmd(localDateKey(new Date()));
  }, []);

  const fetchRange = useCallback(async () => {
    const today = localDateKey(new Date());
    setTodayYmd(today);
    const from = shiftLocalDateKey(today, -55);
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/dashboard/habit-logs?from=${from}&to=${today}`);
      const body = (await res.json().catch(() => ({}))) as { logs?: DailyHabitLogRow[]; error?: string };
      if (!res.ok) throw new Error(body.error || "Could not load habits");
      setLogs(body.logs ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load habits");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRange();
  }, [fetchRange]);

  useEffect(() => {
    const id = window.setInterval(() => refreshTodayKey(), 60_000);
    return () => window.clearInterval(id);
  }, [refreshTodayKey]);

  const logsByDate = useMemo(() => {
    const m = new Map<string, DailyHabitLogRow>();
    for (const row of logs) m.set(row.log_date, row);
    return m;
  }, [logs]);

  const todayRow = useMemo(() => {
    const existing = logsByDate.get(todayYmd);
    if (existing) return existing;
    return syntheticTodayRow(todayYmd, programmeInstanceId);
  }, [logsByDate, todayYmd, programmeInstanceId]);

  const todayRowRef = useRef(todayRow);
  todayRowRef.current = todayRow;

  const todayDone = countHabitsHit(todayRow);
  const todayPct = habitScorePercent(todayDone);
  const streak = habitStreakFromLogs(logs, todayYmd);

  const lastSevenDays = useMemo(() => {
    const out: { ymd: string; label: string; done: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const ymd = shiftLocalDateKey(todayYmd, -i);
      const d = new Date(ymd + "T12:00:00");
      const label = i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" });
      const row = logsByDate.get(ymd);
      out.push({ ymd, label, done: row ? countHabitsHit(row) : 0 });
    }
    return out;
  }, [logsByDate, todayYmd]);

  const persist = useCallback(
    async (next: DailyHabitLogRow, notesOverride?: string | null) => {
      setSaveError(null);
      setSaving(true);
      const notesVal =
        notesOverride !== undefined
          ? typeof notesOverride === "string"
            ? notesOverride.trim() || null
            : null
          : next.notes?.trim() || null;
      const body = {
        log_date: next.log_date,
        programme_instance_id: programmeInstanceId,
        water_hit: next.water_hit,
        protein_hit: next.protein_hit,
        steps_hit: next.steps_hit,
        sleep_hit: next.sleep_hit,
        mobility_hit: next.mobility_hit,
        proof_posted: next.proof_posted,
        notes: notesVal,
      };
      try {
        const res = await fetch("/api/dashboard/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await res.json().catch(() => ({}))) as { log?: DailyHabitLogRow; error?: string };
        if (!res.ok) throw new Error(payload.error || "Save failed");
        const saved = payload.log;
        if (!saved) throw new Error("Invalid response");
        setLogs((prev) => {
          const rest = prev.filter((r) => r.log_date !== saved.log_date);
          return [...rest, saved].sort((a, b) => a.log_date.localeCompare(b.log_date));
        });
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [programmeInstanceId]
  );

  const onToggle = (key: HabitFieldKey) => {
    if (saving) return;
    const latest = todayRowRef.current;
    const next = mergeRow(latest, { [key]: !latest[key] });
    setLogs((prev) => {
      const rest = prev.filter((r) => r.log_date !== next.log_date);
      return [...rest, next].sort((a, b) => a.log_date.localeCompare(b.log_date));
    });
    void persist(next);
  };

  const onNotesChange = (text: string) => {
    pendingNotesRef.current = text;
    const latest = todayRowRef.current;
    const next = mergeRow(latest, { notes: text });
    setLogs((prev) => {
      const rest = prev.filter((r) => r.log_date !== next.log_date);
      return [...rest, next].sort((a, b) => a.log_date.localeCompare(b.log_date));
    });
    if (notesDebounce.current != null) window.clearTimeout(notesDebounce.current);
    notesDebounce.current = window.setTimeout(() => {
      void persist(todayRowRef.current, pendingNotesRef.current);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 md:px-8 md:pt-10">
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Hybrid365</p>
          <div className="mt-3">
            <DashboardSubnav variant="zinc" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl">Daily Habits</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400 md:text-base">
            Stack the small wins that support your programme.
          </p>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-zinc-300 md:text-base">
            Daily standards create long-term change. Track the work — consistency beats intensity spikes.
          </p>
        </header>

        {!programmeInstanceId ? (
          <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-400/[0.06] to-zinc-950 p-5 sm:p-6">
            <p className="text-sm font-semibold text-yellow-200/95">Habits follow your programme</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Generate your 12-week plan from the dashboard first — then daily habits anchor your non-negotiables.
              Structure beats motivation; small wins compound.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              Open dashboard
            </Link>
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {loadError}
          </div>
        ) : null}
        {saveError ? (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            {saveError}
          </div>
        ) : null}

        <section className="mb-10" aria-busy={saving || loading}>
          <h2 className="mb-4 text-lg font-bold text-white">Today&apos;s habits</h2>
          <div className="space-y-3">
            {HABIT_UI.map((habit) => {
              const Icon = habit.icon;
              const on = Boolean(todayRow[habit.key]);
              return (
                <button
                  key={habit.key}
                  type="button"
                  disabled={loading || saving}
                  onClick={() => onToggle(habit.key)}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
                    on
                      ? "border-yellow-500/35 bg-yellow-400/[0.07] ring-1 ring-inset ring-yellow-500/15"
                      : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700/60"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                      on ? "border-yellow-500/40 bg-yellow-400/15 text-yellow-300" : "border-zinc-700 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{habit.title}</span>
                      {on ? (
                        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          Done
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500">{habit.helper}</span>
                  </span>
                  <span
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                      on ? "border-yellow-400 bg-yellow-400 text-zinc-950" : "border-zinc-700 text-zinc-600"
                    }`}
                    aria-hidden
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Daily score</h2>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-white sm:text-4xl">
                {todayDone}
                <span className="text-lg font-semibold text-zinc-500">/{HABIT_TOTAL}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">{todayPct}% complete</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-orange-500/25 bg-orange-950/20 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-200">{streak} day streak</span>
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
              style={{ width: `${todayPct}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">{coachingNoteForHabits(todayDone)}</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">Last 7 days</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="grid grid-cols-7 divide-x divide-zinc-800 bg-zinc-900/60">
              {lastSevenDays.map((d) => (
                <div key={d.ymd} className="px-1 py-3 text-center sm:py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">{d.label}</p>
                  <p className="mt-2 text-lg font-bold text-white sm:text-xl">{d.done}</p>
                  <p className="text-[10px] text-zinc-600 sm:text-xs">/ {HABIT_TOTAL}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Notes</h2>
          <p className="mt-1 text-sm text-zinc-500">Optional — saved with today&apos;s log.</p>
          <textarea
            value={todayRow.notes ?? ""}
            disabled={loading}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            placeholder="Quick reflection, context, or reminders…"
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
          />
        </section>

        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
