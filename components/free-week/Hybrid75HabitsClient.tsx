"use client";

import { Check, Droplets, Footprints, Moon, UtensilsCrossed, Wind } from "lucide-react";
import Hybrid75UpgradeCta from "@/components/free-week/Hybrid75UpgradeCta";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75Habits } from "@/components/free-week/useHybrid75Habits";
import type { Hybrid75HabitKey } from "@/app/lib/hybrid75HabitLogging";

const HABIT_ICONS: Partial<Record<Hybrid75HabitKey, typeof Droplets>> = {
  hydrate: Droplets,
  eat_clean: UtensilsCrossed,
  proof: Check,
  mobility: Wind,
  sleep: Moon,
  steps: Footprints,
};

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export default function Hybrid75HabitsClient() {
  const { planId, athleteEmail, athleteName } = useFreePlan();
  const { summary, configured, loading, savingKey, error, toggleHabit } = useHybrid75Habits(
    planId,
    true,
    athleteEmail,
    athleteName
  );

  const coreHabits = summary?.todayHabits.filter((h) => !h.optional) ?? [];
  const optionalHabits = summary?.todayHabits.filter((h) => h.optional) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Today&apos;s Hybrid 75 Habits</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Habits reset daily. Your weekly trend shows how consistently you&apos;re following the
          challenge. Habit tracking is for accountability — session points are earned separately
          when you log training with proof.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Habit tracking storage is not configured in this environment yet.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <SectionCard>
        {loading && !summary ? (
          <p className="text-sm text-zinc-400">Loading today&apos;s habits…</p>
        ) : (
          <div className="space-y-3">
            {coreHabits.map((habit) => {
              const Icon = HABIT_ICONS[habit.key] ?? Check;
              const saving = savingKey === habit.key;
              return (
                <button
                  key={habit.key}
                  type="button"
                  disabled={saving || !configured}
                  onClick={() => void toggleHabit(habit.key, !habit.completed)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${
                    habit.completed
                      ? "border-[#F4D23C]/40 bg-[#F4D23C]/10"
                      : "border-zinc-800 bg-zinc-950/70 hover:border-[#F4D23C]/25"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      habit.completed ? "bg-[#F4D23C] text-black" : "bg-zinc-900 text-[#F4D23C]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{habit.label}</span>
                    <span className="mt-0.5 block text-sm text-zinc-400">
                      {habit.completed ? "Completed today" : "Tap to mark complete"}
                    </span>
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      habit.completed
                        ? "border-[#F4D23C] bg-[#F4D23C] text-black"
                        : "border-zinc-700 bg-transparent"
                    }`}
                  >
                    {habit.completed ? <Check className="h-4 w-4" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {optionalHabits.length > 0 ? (
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Optional extras
            </p>
            <div className="space-y-3">
              {optionalHabits.map((habit) => {
                const Icon = HABIT_ICONS[habit.key] ?? Check;
                const saving = savingKey === habit.key;
                return (
                  <button
                    key={habit.key}
                    type="button"
                    disabled={saving || !configured}
                    onClick={() => void toggleHabit(habit.key, !habit.completed)}
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                      habit.completed
                        ? "border-white/20 bg-white/[0.06]"
                        : "border-zinc-800/80 bg-zinc-950/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <span className="flex-1 text-sm text-white/80">{habit.label}</span>
                    {habit.completed ? (
                      <Check className="h-4 w-4 text-[#F4D23C]" />
                    ) : (
                      <span className="text-xs text-zinc-500">Optional</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </SectionCard>

      {summary ? (
        <SectionCard>
          <h2 className="text-xl font-bold text-white md:text-2xl">This Week&apos;s Consistency</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Week of {summary.weekStart} — overall {summary.overallCompletionPct}% complete
            {summary.currentStreak > 0 ? ` · ${summary.currentStreak}-day full habit streak` : ""}
          </p>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {summary.weekDays.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {day.label}
                </span>
                <div
                  className={`flex h-12 w-full items-center justify-center rounded-xl border text-xs font-bold ${
                    day.completed
                      ? "border-[#F4D23C]/40 bg-[#F4D23C]/15 text-[#F4D23C]"
                      : day.completedCount > 0
                      ? "border-white/15 bg-white/[0.04] text-white/70"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-600"
                  }`}
                >
                  {day.completedCount}/{day.totalCount}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {summary.weeklyTrends.map((row) => (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/80">{row.label}</span>
                  <span className="font-semibold text-white">
                    {row.completedDays}/{row.targetDays}
                  </span>
                </div>
                <div className="flex gap-1">
                  {row.weekDays.map((done, i) => (
                    <div
                      key={`${row.key}-${i}`}
                      className={`h-2 flex-1 rounded-full ${done ? "bg-[#F4D23C]" : "bg-zinc-800"}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <Hybrid75UpgradeCta variant="compact" />
    </div>
  );
}
