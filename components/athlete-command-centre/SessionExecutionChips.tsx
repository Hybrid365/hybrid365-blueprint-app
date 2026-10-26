"use client";

/**
 * Fast type-aware athlete completion chips.
 * Used only when HYROX_SESSION_EXECUTION_CHIPS_* allow-lists the athlete.
 */

import type { FeedbackProfile } from "@/app/lib/hyroxSessionExecutionFeedbackConfig";
import type { SessionExecutionFeedbackChips } from "@/app/lib/hyrox-team/modules/sessionLogging/types";
import type {
  SessionCompletion,
  SessionControl,
  SessionEnergyLevel,
  SessionExecutionTarget,
  SessionLegsLevel,
  SessionMissedReason,
  SessionPainLevel,
} from "@/app/lib/hyroxSessionExecutionTypes";
import { validateExecutionChipsForSubmit } from "@/app/lib/hyroxSessionExecutionValidate";

type Props = {
  profile: FeedbackProfile;
  value: SessionExecutionFeedbackChips | null;
  onChange: (next: SessionExecutionFeedbackChips) => void;
  /** Show forgotten-session prompt first */
  forgottenPrompt?: boolean;
  onForgottenChoice?: (choice: "yes" | "no" | "later") => void;
};

function ChipRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
              value === opt.value
                ? "border-yellow-500/50 bg-yellow-400/15 text-yellow-100"
                : "border-zinc-700 text-zinc-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function shows(profile: FeedbackProfile, field: FeedbackProfile["required"][number]): boolean {
  return profile.required.includes(field) || profile.optional.includes(field);
}

export function SessionExecutionChips({
  profile,
  value,
  onChange,
  forgottenPrompt,
  onForgottenChoice,
}: Props) {
  const completion = value?.completion ?? null;
  const missed = completion === "missed";
  const validation =
    completion && completion !== "missed"
      ? validateExecutionChipsForSubmit({ chips: value, profile })
      : completion === "missed"
        ? validateExecutionChipsForSubmit({ chips: value, profile })
        : null;

  if (forgottenPrompt) {
    return (
      <div className="space-y-3 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/90">
          Did you do this session?
        </p>
        <p className="text-sm text-zinc-400">Past session with no log yet. No automatic miss.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
            onClick={() => onForgottenChoice?.("yes")}
          >
            Yes
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100"
            onClick={() => onForgottenChoice?.("no")}
          >
            No
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300"
            onClick={() => onForgottenChoice?.("later")}
          >
            Do later
          </button>
        </div>
      </div>
    );
  }

  function setCompletion(next: SessionCompletion) {
    if (next === "missed") {
      onChange({
        completion: "missed",
        missedReason: value?.missedReason ?? null,
        athleteNote: value?.athleteNote ?? null,
      });
      return;
    }
    onChange({
      completion: next,
      execution: value?.execution ?? null,
      rpe: value?.rpe ?? null,
      control: value?.control ?? null,
      pain: value?.pain ?? null,
      energy: value?.energy ?? null,
      legs: value?.legs ?? null,
      athleteNote: value?.athleteNote ?? null,
      actuals: value?.actuals ?? null,
    });
  }

  function patch(partial: Partial<SessionExecutionFeedbackChips>) {
    if (!value?.completion) return;
    onChange({ ...value, ...partial });
  }

  function setActual(key: string, raw: string) {
    if (!value?.completion) return;
    onChange({
      ...value,
      actuals: { ...(value.actuals ?? {}), [key]: raw.trim() || null },
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400/90">
          How did it go?
        </p>
        <p className="text-[10px] text-zinc-600">{profile.label}</p>
      </div>

      <ChipRow<SessionCompletion>
        label="Outcome"
        value={completion}
        onSelect={setCompletion}
        options={[
          { value: "complete", label: "Complete" },
          { value: "partial", label: "Partial" },
          { value: "missed", label: "Missed" },
        ]}
      />

      {missed ? (
        <ChipRow<SessionMissedReason>
          label="Why missed"
          value={value?.missedReason ?? null}
          onSelect={(missedReason) =>
            onChange({ completion: "missed", missedReason, athleteNote: value?.athleteNote ?? null })
          }
          options={[
            { value: "illness", label: "Illness" },
            { value: "life", label: "Life" },
            { value: "fatigue", label: "Fatigue" },
            { value: "pain_injury", label: "Pain/injury" },
            { value: "schedule", label: "Schedule" },
            { value: "other", label: "Other" },
          ]}
        />
      ) : completion ? (
        <>
          {shows(profile, "primaryResult") ? (
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Primary result
              <input
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. 18:42 · 7:05 · 280 W"
                value={String(value?.actuals?.primaryResult ?? value?.actuals?.result ?? "")}
                onChange={(e) => setActual("primaryResult", e.target.value)}
              />
            </label>
          ) : null}

          {shows(profile, "execution") ? (
            <ChipRow<SessionExecutionTarget>
              label={profile.id === "strength" ? "Sets / reps done" : "Targets"}
              value={value?.execution ?? null}
              onSelect={(execution) => patch({ execution })}
              options={[
                { value: "all", label: "All" },
                { value: "most", label: "Most" },
                { value: "some", label: "Some" },
                { value: "missed_target", label: "Did not hit" },
              ]}
            />
          ) : null}

          {shows(profile, "rpe") ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">RPE</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => patch({ rpe: n })}
                    className={`h-8 w-8 rounded-lg border text-xs font-bold ${
                      value?.rpe === n
                        ? "border-yellow-500/50 bg-yellow-400/15 text-yellow-100"
                        : "border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {shows(profile, "control") ? (
            <ChipRow<SessionControl>
              label={profile.id === "hyrox_compromised" ? "Run control" : "Control"}
              value={value?.control ?? null}
              onSelect={(control) => patch({ control })}
              options={[
                { value: "very_controlled", label: "Very controlled" },
                { value: "controlled", label: "Controlled" },
                { value: "appropriate", label: "Appropriate" },
                { value: "hard", label: "Hard" },
                { value: "maximal", label: "Maximal" },
              ]}
            />
          ) : null}

          {shows(profile, "pain") ? (
            <ChipRow<SessionPainLevel>
              label="Pain"
              value={value?.pain ?? null}
              onSelect={(pain) => patch({ pain })}
              options={[
                { value: "none", label: "None" },
                { value: "minor", label: "Minor" },
                { value: "meaningful", label: "Meaningful" },
              ]}
            />
          ) : null}

          {shows(profile, "energy") ? (
            <ChipRow<SessionEnergyLevel>
              label="Energy"
              value={value?.energy ?? null}
              onSelect={(energy) => patch({ energy })}
              options={[
                { value: "good", label: "Good" },
                { value: "ok", label: "Ok" },
                { value: "low", label: "Low" },
              ]}
            />
          ) : null}

          {shows(profile, "legs") ? (
            <ChipRow<SessionLegsLevel>
              label="Legs"
              value={value?.legs ?? null}
              onSelect={(legs) => patch({ legs })}
              options={[
                { value: "good", label: "Good" },
                { value: "heavy", label: "Heavy" },
                { value: "sore", label: "Sore" },
              ]}
            />
          ) : null}

          {shows(profile, "actualPace") ? (
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Actual pace (optional)
              <input
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. 3:55/km"
                value={String(value?.actuals?.pace ?? "")}
                onChange={(e) => setActual("pace", e.target.value)}
              />
            </label>
          ) : null}

          {shows(profile, "actualSplitOrPower") ? (
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Split / power (optional)
              <input
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. 1:50/500 · 220 W"
                value={String(value?.actuals?.splitOrPower ?? "")}
                onChange={(e) => setActual("splitOrPower", e.target.value)}
              />
            </label>
          ) : null}

          {shows(profile, "actualLoadOrReps") ? (
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Load / reps (optional)
              <input
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. 80 kg × 5"
                value={String(value?.actuals?.loadOrReps ?? "")}
                onChange={(e) => setActual("loadOrReps", e.target.value)}
              />
            </label>
          ) : null}

          {shows(profile, "stationLimiting") ? (
            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Limiting station (optional)
              <input
                className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="e.g. sled pull"
                value={String(value?.actuals?.limitingStation ?? "")}
                onChange={(e) => setActual("limitingStation", e.target.value)}
              />
            </label>
          ) : null}
        </>
      ) : null}

      {completion && shows(profile, "note") ? (
        <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Note (optional)
          <textarea
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            rows={2}
            value={value?.athleteNote ?? ""}
            onChange={(e) =>
              onChange({
                ...(value ?? { completion }),
                athleteNote: e.target.value,
              })
            }
          />
        </label>
      ) : completion === "missed" ? (
        <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          Note (optional)
          <textarea
            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            rows={2}
            value={value?.athleteNote ?? ""}
            onChange={(e) =>
              onChange({
                completion: "missed",
                missedReason: value?.missedReason ?? null,
                athleteNote: e.target.value,
              })
            }
          />
        </label>
      ) : null}

      {validation && !validation.ok ? (
        <p className="text-[11px] text-amber-300">{validation.error}</p>
      ) : null}
    </div>
  );
}

export function executionChipsReady(
  value: SessionExecutionFeedbackChips | null,
  profile: FeedbackProfile
): boolean {
  return validateExecutionChipsForSubmit({ chips: value, profile }).ok;
}
