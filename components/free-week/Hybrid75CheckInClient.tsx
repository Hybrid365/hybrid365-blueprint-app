"use client";

import { useState } from "react";
import Hybrid75UpgradeCta from "@/components/free-week/Hybrid75UpgradeCta";
import { useFreePlan } from "@/components/free-week/FreePlanProvider";
import { useHybrid75CheckIn } from "@/components/free-week/useHybrid75CheckIn";

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

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="font-bold text-[#F4D23C]">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#F4D23C]"
      />
    </label>
  );
}

export default function Hybrid75CheckInClient() {
  const { planId, athleteEmail, athleteName } = useFreePlan();
  const {
    weekStart,
    form,
    configured,
    loading,
    submitting,
    submitted,
    error,
    updateField,
    submit,
  } = useHybrid75CheckIn(planId, true, athleteEmail, athleteName);

  const [showForm, setShowForm] = useState(false);

  if (submitted && !submitting && !showForm) {
    return (
      <div className="space-y-6">
        <SectionCard className="border-[#F4D23C]/25 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4D23C]">Submitted</p>
          <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Check-in submitted. Keep building momentum.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            You can update your answers anytime this week{weekStart ? ` (week starting ${weekStart})` : ""}.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-6 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Edit check-in
          </button>
        </SectionCard>
        <Hybrid75UpgradeCta variant="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Submit Your Weekly Check-In</h1>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Review your week, stay accountable and decide what needs to improve next.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Weekly check-in storage is not configured in this environment yet.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <SectionCard>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading check-in…</p>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                await submit();
                setShowForm(false);
              })();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Sessions completed</span>
                <input
                  type="number"
                  min={0}
                  value={form.sessions_completed}
                  onChange={(e) => updateField("sessions_completed", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#F4D23C]/50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Proof posts made</span>
                <input
                  type="number"
                  min={0}
                  value={form.proof_posts}
                  onChange={(e) => updateField("proof_posts", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#F4D23C]/50"
                />
              </label>
            </div>

            <ScoreSlider
              label="Energy"
              value={form.energy_score}
              onChange={(v) => updateField("energy_score", v)}
            />
            <ScoreSlider
              label="Recovery"
              value={form.recovery_score}
              onChange={(v) => updateField("recovery_score", v)}
            />
            <ScoreSlider
              label="Soreness"
              value={form.soreness_score}
              onChange={(v) => updateField("soreness_score", v)}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">Biggest win this week</span>
              <textarea
                rows={3}
                value={form.biggest_win}
                onChange={(e) => updateField("biggest_win", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#F4D23C]/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">
                Biggest struggle this week
              </span>
              <textarea
                rows={3}
                value={form.biggest_struggle}
                onChange={(e) => updateField("biggest_struggle", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#F4D23C]/50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">
                What do you need help with?
              </span>
              <textarea
                rows={3}
                value={form.support_needed}
                onChange={(e) => updateField("support_needed", e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-[#F4D23C]/50"
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <input
                type="checkbox"
                checked={form.interested_full_programme}
                onChange={(e) => updateField("interested_full_programme", e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-zinc-600 accent-[#F4D23C]"
              />
              <span className="text-sm leading-relaxed text-zinc-300">
                Are you interested in the full 16-week personalised Hybrid365 programme?
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full rounded-xl bg-[#F4D23C] px-6 py-3.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit check-in"}
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
