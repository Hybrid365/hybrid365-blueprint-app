"use client";

import { useMemo, useState } from "react";
import type {
  HyroxAssessmentInput,
  HyroxAthleteProfile,
  ProfileReviewOverrides,
} from "@/app/lib/hyroxAthleteProfileTypes";
import { getMockAssessmentForAthlete } from "@/app/lib/hyroxMockAssessmentSubmissions";
import {
  applyProfileOverrides,
  determineEquipmentSpecificity,
  mapAssessmentToAthleteProfile,
  profileFromCoachAthleteFallback,
} from "@/app/lib/hyroxAssessmentMapping";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import { AlertTriangle, Check, RefreshCw, Sparkles } from "lucide-react";

const ABILITY: Array<HyroxAthleteProfile["abilityLevel"]> = [
  "beginner",
  "intermediate",
  "advanced",
  "pro",
];

const DOUBLE: Array<HyroxAthleteProfile["doubleSessionReadiness"]> = [
  "not_ready",
  "aerobic_double_only",
  "threshold_run_plus_easy_aerobic",
  "threshold_run_plus_erg_threshold",
];

const PACE_NOTE =
  "Pace targets are estimates. HR/RPE should override pace if the athlete is fatigued or drifting above threshold.";

export function ProfileReviewTab({
  athlete,
  assessment,
  overrides,
  onOverridesChange,
  onSaveProfileReview,
  onResetToAuto,
  onGenerateDraft,
  generateSuccess,
  draftExists,
  mappedProfileSaved,
  isLive,
}: {
  athlete: CoachAthlete;
  assessment?: HyroxAssessmentInput;
  overrides: ProfileReviewOverrides;
  onOverridesChange: (o: ProfileReviewOverrides) => void;
  onSaveProfileReview: () => void;
  onResetToAuto: () => void;
  onGenerateDraft: () => void;
  generateSuccess?: boolean;
  draftExists?: boolean;
  mappedProfileSaved?: boolean;
  isLive?: boolean;
}) {
  const [savedFlash, setSavedFlash] = useState(false);

  const autoProfile = useMemo(() => {
    if (assessment) return mapAssessmentToAthleteProfile(assessment);
    return profileFromCoachAthleteFallback(athlete);
  }, [assessment, athlete]);

  const effective = useMemo(
    () => applyProfileOverrides(autoProfile, overrides),
    [autoProfile, overrides]
  );

  const handleSave = () => {
    onSaveProfileReview();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="space-y-6">
      <DashCard highlight>
        <SectionHeading title="Assessment → profile pipeline" />
        <p className="mt-2 text-sm text-zinc-400">
          Map intake to a structured profile, override as needed, then generate a programme draft for
          the builder. Nothing is published to the athlete from here.
        </p>
        {isLive ? (
          <p className="mt-3 text-xs text-emerald-400/90">
            Mapped profile: {mappedProfileSaved ? "saved in Supabase" : "not saved yet"}
            {draftExists ? " · Programme draft on file" : ""}
          </p>
        ) : null}
        {draftExists ? (
          <p className="mt-3 text-xs text-yellow-400/90">
            Draft source: Assessment mapping · Status: needs coach review
          </p>
        ) : null}
      </DashCard>

      {generateSuccess ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Programme draft created. Review it in Programme Builder before publishing — athlete dashboard
          unchanged until publish.
        </p>
      ) : null}

      {savedFlash ? (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <Check className="h-4 w-4" />{" "}
          {isLive ? "Mapped profile saved to Supabase." : "Profile review saved locally."}
        </p>
      ) : null}

      {/* A) Raw assessment */}
      <DashCard>
        <SectionHeading title="A) Raw assessment summary" />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Availability" value={`${(assessment?.trainingDaysPreference.length ?? athlete.trainingDays) || "?"} days · ${assessment?.weeklyTrainingHoursTarget ?? athlete.weeklyHours} h/week target`} />
          <Field
            label="Running profile"
            value={`5 km ${assessment?.fiveKmTime ?? athlete.programmeInputs.fiveKm} · 10 km ${assessment?.tenKmTime || athlete.programmeInputs.tenKm || "—"}`}
          />
          <div className="sm:col-span-2">
            <Field label="Recent training" value={assessment?.recentTrainingSummary ?? athlete.assessment.recoveryProfile} />
          </div>
          <Field
            label="Station weaknesses"
            value={(assessment?.stationWeaknesses ?? athlete.assessment.stationWeaknesses.map((s) => s.replace(/_/g, " "))).join(", ")}
          />
          <Field
            label="Equipment"
            value={assessment ? JSON.stringify(assessment.equipmentAvailable) : athlete.assessment.equipmentAccess.join(", ")}
          />
          <div className="sm:col-span-2">
            <Field
              label="Recovery / injury"
              value={`Sleep: ${assessment?.sleepQuality ?? "—"} · Stress: ${assessment?.stressLevel ?? "—"} · ${(assessment?.injuryFlags ?? []).join("; ") || athlete.assessment.injuryRecovery}`}
            />
          </div>
          <Field label="Goals" value={assessment?.bodyCompositionGoal ?? athlete.raceGoal} />
          <Field
            label="Consent"
            value={`Content ${assessment?.contentConsent ?? true} · Documentation ${assessment?.documentationConsent ?? athlete.assessment.documentationConsent}`}
          />
        </dl>
      </DashCard>

      {/* B) Generated profile */}
      <DashCard>
        <SectionHeading title="B) Generated athlete profile" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Level" value={effective.abilityLevel} />
          <StatCard label="Main limiter" value={effective.mainLimiter} />
          <StatCard label="Secondary limiter" value={effective.secondaryLimiter} />
          <StatCard label="Race timeline" value={`${effective.raceTimelineWeeks} w · ${effective.raceTimelinePhase}`} />
          <StatCard label="Weekly hours" value={`${effective.weeklyTrainingHours} h`} />
          <StatCard label="Double-session readiness" value={effective.doubleSessionReadiness.replace(/_/g, " ")} />
          <StatCard label="Recovery risk" value={effective.recoveryRisk} />
          <StatCard
            label="Equipment specificity"
            value={
              assessment
                ? determineEquipmentSpecificity(assessment)
                : effective.equipmentAccess.slice(0, 6).join(", ") || "—"
            }
          />
          <StatCard label="First block focus" value={effective.firstBlockFocus} />
        </div>
      </DashCard>

      {/* C) Pace zones */}
      <DashCard>
        <SectionHeading title="C) Pace zones (estimate)" />
        <p className="mt-2 text-xs italic text-zinc-500">{PACE_NOTE}</p>
        {effective.estimatedPaceZones ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <RowPace k="Easy" v={effective.estimatedPaceZones.easy} />
            <RowPace k="Steady" v={effective.estimatedPaceZones.steady} />
            <RowPace k="Tempo / aerobic quality" v={effective.estimatedPaceZones.steady} />
            <RowPace k="Threshold" v={effective.estimatedPaceZones.threshold} />
            <RowPace k="10 km" v={effective.estimatedPaceZones.tenK} />
            <RowPace k="5 km" v={effective.estimatedPaceZones.fiveK} />
            <RowPace
              k="Hyrox race run (est.)"
              v={
                (effective.estimatedPaceZones as { hyroxRaceRunEstimate?: string }).hyroxRaceRunEstimate ??
                effective.estimatedPaceZones.hyroxRaceRun
              }
            />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Add valid 5 km / 10 km times to estimate zones.</p>
        )}
      </DashCard>

      {/* D) Flags */}
      <DashCard>
        <SectionHeading title="D) Coach review flags" />
        <ul className="mt-4 space-y-2">
          {effective.coachReviewFlags.map((f) => (
            <li
              key={f.id}
              className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
                f.severity === "warn"
                  ? "border-orange-500/25 bg-orange-400/5 text-orange-100"
                  : "border-zinc-700 bg-zinc-900/40 text-zinc-300"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{f.label}</p>
                <p className="text-xs text-zinc-500">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </DashCard>

      {/* E + F */}
      <DashCard>
        <SectionHeading title="E) Suggested first block focus" />
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{effective.firstBlockFocus}</p>
      </DashCard>

      <DashCard>
        <SectionHeading title="F) Suggested key sessions" />
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {effective.suggestedKeySessions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </DashCard>

      {/* Overrides */}
      <DashCard>
        <SectionHeading title="Coach overrides" />
        <p className="mt-2 text-xs text-zinc-500">Local mock only — does not persist to database.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">
            Athlete level
            <select
              value={overrides.abilityLevel ?? effective.abilityLevel}
              onChange={(e) =>
                onOverridesChange({
                  ...overrides,
                  abilityLevel: e.target.value as HyroxAthleteProfile["abilityLevel"],
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {ABILITY.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Recovery risk
            <select
              value={overrides.recoveryRisk ?? effective.recoveryRisk}
              onChange={(e) =>
                onOverridesChange({
                  ...overrides,
                  recoveryRisk: e.target.value as ProfileReviewOverrides["recoveryRisk"],
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              <option value="low">low</option>
              <option value="moderate">moderate</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Main limiter
            <input
              value={overrides.mainLimiter ?? effective.mainLimiter}
              onChange={(e) => onOverridesChange({ ...overrides, mainLimiter: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Secondary limiter
            <input
              value={overrides.secondaryLimiter ?? effective.secondaryLimiter}
              onChange={(e) => onOverridesChange({ ...overrides, secondaryLimiter: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500">
            Double-session readiness
            <select
              value={overrides.doubleSessionReadiness ?? effective.doubleSessionReadiness}
              onChange={(e) =>
                onOverridesChange({
                  ...overrides,
                  doubleSessionReadiness: e.target.value as ProfileReviewOverrides["doubleSessionReadiness"],
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {DOUBLE.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Weekly training hours
            <input
              type="number"
              step={0.5}
              value={overrides.weeklyTrainingHours ?? effective.weeklyTrainingHours}
              onChange={(e) =>
                onOverridesChange({
                  ...overrides,
                  weeklyTrainingHours: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-500 sm:col-span-2">
            First block focus
            <textarea
              rows={2}
              value={overrides.firstBlockFocus ?? effective.firstBlockFocus}
              onChange={(e) => onOverridesChange({ ...overrides, firstBlockFocus: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-zinc-950"
          >
            {isLive ? "Save mapped profile" : "Save profile review"}
          </button>
          <button
            type="button"
            onClick={onResetToAuto}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset to auto mapping
          </button>
          <button
            type="button"
            onClick={onGenerateDraft}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate programme draft
          </button>
        </div>
      </DashCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-zinc-300">{value}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-zinc-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function RowPace({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-zinc-800/80 py-1">
      <span className="text-zinc-500">{k}</span>
      <span className="font-mono text-yellow-200/90">{v}</span>
    </div>
  );
}
