"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Minus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DashboardSubnav } from "@/components/DashboardSubnav";
import { DashboardSupportCard } from "@/components/dashboard/DashboardSupportCard";
import {
  buildCheckInAnalytics,
  type CommunityWeeklyCheckInRecord,
} from "@/app/lib/communityWeeklyCheckIn";
import type { DailyHabitLogRow } from "@/app/lib/dailyHabitLogs";
import type { ProgrammeWeekLike, TrendDir } from "@/app/lib/progressMetrics";
import { getUnlockedWeekCount } from "@/app/lib/membershipAccess";
import type { MembershipForAccess } from "@/app/lib/membershipAccess";

type Props = {
  programmeInstanceId: string | null;
  programmeGenerated: boolean;
  effectiveWeek: number;
  weeks: ProgrammeWeekLike[];
  membership: MembershipForAccess | null;
  initialCheckIns: CommunityWeeklyCheckInRecord[];
  habitLogs: DailyHabitLogRow[];
  completedByWeek: Record<number, { completed: number; total: number }>;
};

function TrendIcon({ trend }: { trend: TrendDir }) {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-amber-400" />;
  if (trend === "flat") return <Minus className="h-4 w-4 text-zinc-500" />;
  return <span className="text-zinc-600">—</span>;
}

function ScoreBar({ score, max }: { score: number | null; max: number }) {
  const pct = score != null ? Math.min(100, Math.round((score / max) * 100)) : 0;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-yellow-500/60 to-yellow-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const SCORE_FIELDS = [
  { key: "energy_score" as const, label: "Energy (1–10)" },
  { key: "recovery_score" as const, label: "Recovery (1–10)" },
  { key: "stress_score" as const, label: "Stress / fatigue (1–10)" },
  { key: "motivation_score" as const, label: "Motivation (1–10)" },
];

export default function CheckInClient({
  programmeInstanceId,
  programmeGenerated,
  effectiveWeek,
  weeks,
  membership,
  initialCheckIns,
  habitLogs,
  completedByWeek,
}: Props) {
  const unlockedMax = getUnlockedWeekCount(membership);
  const defaultWeek =
    weeks.find((w) => w.week_number === effectiveWeek && w.is_unlocked)?.week_number ??
    weeks.find((w) => w.is_unlocked)?.week_number ??
    effectiveWeek;

  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [checkIns, setCheckIns] = useState<Record<number, CommunityWeeklyCheckInRecord>>(
    () => Object.fromEntries(initialCheckIns.map((c) => [c.week_number, c]))
  );
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState({
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

  const weekUnlocked = selectedWeek >= 1 && selectedWeek <= unlockedMax;
  const checkInsList = useMemo(() => Object.values(checkIns), [checkIns]);
  const analytics = useMemo(
    () => buildCheckInAnalytics(checkInsList, selectedWeek, completedByWeek, habitLogs),
    [checkInsList, selectedWeek, completedByWeek, habitLogs]
  );

  const openForm = () => {
    const existing = checkIns[selectedWeek];
    setDraft({
      bodyweight_kg: existing?.bodyweight_kg != null ? String(existing.bodyweight_kg) : "",
      sleep_hours: existing?.sleep_hours != null ? String(existing.sleep_hours) : "",
      energy_score: existing?.energy_score != null ? String(existing.energy_score) : "",
      recovery_score: existing?.recovery_score != null ? String(existing.recovery_score) : "",
      stress_score: existing?.stress_score != null ? String(existing.stress_score) : "",
      motivation_score:
        existing?.motivation_score != null ? String(existing.motivation_score) : "",
      biggest_win: existing?.biggest_win ?? "",
      biggest_struggle: existing?.biggest_struggle ?? "",
      pain_or_injury: existing?.pain_or_injury ?? "",
      notes: existing?.notes ?? "",
    });
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  };

  const asNum = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const parseBw = (v: string) => {
    const cleaned = v.trim().replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  async function saveCheckIn() {
    if (!programmeInstanceId || !weekUnlocked) return;
    setSaving(true);
    setError(null);
    const weekStats = completedByWeek[selectedWeek];
    const adherence =
      weekStats && weekStats.total > 0
        ? Math.round((weekStats.completed / weekStats.total) * 100)
        : null;
    const body = {
      programme_instance_id: programmeInstanceId,
      week_number: selectedWeek,
      bodyweight_kg: parseBw(draft.bodyweight_kg),
      sleep_hours: asNum(draft.sleep_hours),
      energy_score: asNum(draft.energy_score),
      recovery_score: asNum(draft.recovery_score),
      stress_score: asNum(draft.stress_score),
      motivation_score: asNum(draft.motivation_score),
      adherence_score: adherence,
      biggest_win: draft.biggest_win.trim() || null,
      biggest_struggle: draft.biggest_struggle.trim() || null,
      pain_or_injury: draft.pain_or_injury.trim() || null,
      notes: draft.notes.trim() || null,
    };
    try {
      const res = await fetch("/api/dashboard/weekly-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not save check-in");
      }
      const payload = (await res.json()) as { checkIn: CommunityWeeklyCheckInRecord };
      setCheckIns((prev) => ({ ...prev, [selectedWeek]: payload.checkIn }));
      setSuccess("Weekly check-in saved — your trends are updated below.");
      setFormOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save check-in");
    } finally {
      setSaving(false);
    }
  }

  if (!programmeGenerated || !programmeInstanceId) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
        <div className="mx-auto max-w-2xl">
          <DashboardSubnav variant="zinc" />
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
            <p className="text-lg font-bold text-white">Programme not ready yet</p>
            <p className="mt-2 text-sm text-zinc-400">
              Generate your programme from the dashboard, then return here for weekly check-ins.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/90">Hybrid365</p>
        <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Weekly check-in</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400 md:text-base">
          Review recovery, energy and training response — then log how the week actually felt.
        </p>
        <div className="mt-5">
          <DashboardSubnav variant="zinc" />
        </div>

        {/* Week selector */}
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
            const unlocked = w <= unlockedMax;
            const hasCheckIn = Boolean(checkIns[w]?.submitted_at);
            const selected = w === selectedWeek;
            return (
              <button
                key={w}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && setSelectedWeek(w)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-200"
                    : unlocked
                      ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                      : "cursor-not-allowed border-zinc-800/60 bg-zinc-950/50 text-zinc-600"
                }`}
              >
                W{w}
                {hasCheckIn ? <span className="ml-1 text-emerald-400">✓</span> : null}
              </button>
            );
          })}
        </div>

        {/* CTA / status */}
        <section className="mt-6 rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-900/90 to-zinc-950 p-6 sm:p-8">
          {!analytics.submitted ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 ring-1 ring-yellow-400/25">
                <ClipboardCheck className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">Submit your weekly check-in</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                Your check-in helps you review training, track recovery and keep the programme moving
                in the right direction.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Week {selectedWeek} logged</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">This week&apos;s summary</h2>
              {analytics.consistencyScore != null ? (
                <p className="mt-2 text-sm text-zinc-400">
                  Consistency score:{" "}
                  <span className="font-bold text-yellow-300">{analytics.consistencyScore}%</span>
                </p>
              ) : null}
            </>
          )}
          {weekUnlocked ? (
            <button
              type="button"
              onClick={openForm}
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              {analytics.submitted ? "Update check-in" : "Complete check-in"}
            </button>
          ) : (
            <p className="mt-4 text-sm text-amber-200/90">This week unlocks with your next membership month.</p>
          )}
          {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </section>

        {/* Coach insight */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">Coach note</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{analytics.coachInsight}</p>
            </div>
          </div>
        </section>

        {/* Score cards */}
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <BarChart3 className="h-5 w-5 text-yellow-400" />
            This week&apos;s scores
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.scoreCards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{card.label}</p>
                  <TrendIcon trend={card.trend} />
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                {card.sub ? <p className="mt-1 text-xs text-zinc-500">{card.sub}</p> : null}
                <p className="mt-1 text-[10px] text-zinc-600">{card.trendLabel}</p>
                <ScoreBar score={card.score} max={card.maxScore} />
              </div>
            ))}
            {analytics.sessionPct != null ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Sessions completed
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {analytics.sessionsCompleted}/{analytics.sessionsTotal}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{analytics.sessionPct}% this week</p>
                <ScoreBar score={analytics.sessionPct} max={100} />
              </div>
            ) : null}
            {analytics.current?.bodyweight_kg != null ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bodyweight</p>
                <p className="mt-2 text-2xl font-bold text-white">{analytics.current.bodyweight_kg} kg</p>
                {analytics.previous?.bodyweight_kg != null ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Last week: {analytics.previous.bodyweight_kg} kg
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {/* Habit trends */}
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Droplets className="h-5 w-5 text-yellow-400" />
            Habit consistency
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.habitTrends.map((h) => (
              <div key={h.key} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{h.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{h.pct}%</p>
                <p className="mt-1 text-xs text-zinc-500">{h.sub}</p>
                <ScoreBar score={h.pct} max={100} />
              </div>
            ))}
          </div>
          <Link href="/dashboard/habits" className="mt-3 inline-block text-sm font-semibold text-yellow-400 hover:text-yellow-300">
            Log daily habits →
          </Link>
        </section>

        {/* Recovery trends history */}
        {checkInsList.length >= 2 ? (
          <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
              Recovery trends
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analytics.recoveryTrends.map((row) => (
                <div key={row.key} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-400">{row.label}</p>
                    <TrendIcon trend={row.trend} />
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {row.latest != null ? row.latest : "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <DashboardSupportCard className="mt-10" />
      </main>

      {/* Form modal */}
      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="check-in-title"
          >
            <h3 id="check-in-title" className="text-xl font-bold text-white">
              Week {selectedWeek} check-in
            </h3>
            <div className="mt-4 space-y-4">
              <label className="block text-sm">
                <span className="text-zinc-400">Bodyweight (kg)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  value={draft.bodyweight_kg}
                  onChange={(e) => setDraft((d) => ({ ...d, bodyweight_kg: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-400">Sleep (hours)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  value={draft.sleep_hours}
                  onChange={(e) => setDraft((d) => ({ ...d, sleep_hours: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SCORE_FIELDS.map(({ key, label }) => (
                  <label key={key} className="block text-sm">
                    <span className="text-zinc-400">{label}</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                      value={draft[key]}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              {(["biggest_win", "biggest_struggle", "pain_or_injury", "notes"] as const).map((field) => (
                <label key={field} className="block text-sm">
                  <span className="capitalize text-zinc-400">{field.replace(/_/g, " ")}</span>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                    value={draft[field]}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveCheckIn}
                className="flex-1 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-950 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save check-in"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
