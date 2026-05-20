"use client";

import { Moon, Scale, Zap } from "lucide-react";
import { useState } from "react";
import { MOCK_CHECK_IN, MOCK_CHECK_IN_FORM } from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  BtnPrimary,
  PageContent,
  PageHeader,
  SectionTitle,
  StatusBadge,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
} from "./athleteUi";

export function CheckInPageView() {
  const form = MOCK_CHECK_IN_FORM;
  const meta = ATHLETE_PAGE_META.checkin;
  const checkInDue = MOCK_CHECK_IN.status === "Due";
  const [sleep, setSleep] = useState(form.sleep);
  const [energy, setEnergy] = useState(form.energy);
  const [stress, setStress] = useState(form.stress);
  const [soreness, setSoreness] = useState(form.soreness);
  const [recovery, setRecovery] = useState(form.recovery);
  const [bodyweight, setBodyweight] = useState(String(form.bodyweightKg));
  const [submitted, setSubmitted] = useState(false);

  const completionPct = Math.round((form.sessionsCompleted / form.sessionsPlanned) * 100);

  return (
    <PageContent width="wide">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        action={
          <StatusBadge tone={submitted ? "success" : checkInDue ? "warn" : "neutral"}>
            {submitted ? "Submitted" : form.status}
          </StatusBadge>
        }
      />

      <div
        className={`${checkInDue ? athleteCardHighlight : athleteCard} ${athleteCardPadding} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <p className="text-lg font-semibold text-white">Due {form.dueLabel}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {submitted ? "Your coach will review within 24h" : form.coachReviewStatus}
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          Sessions <span className="font-bold text-yellow-400">{form.sessionsCompleted}/{form.sessionsPlanned}</span>{" "}
          ({completionPct}%)
        </p>
      </div>

      <section>
        <SectionTitle title="Rate this week" description="Scale 1–10 — takes about 2 minutes" />
        <div className="space-y-3">
          <RatingField icon={Moon} label="Sleep quality" value={sleep} onChange={setSleep} />
          <RatingField icon={Zap} label="Energy levels" value={energy} onChange={setEnergy} accent="yellow" />
          <RatingField icon={Zap} label="Stress" value={stress} onChange={setStress} />
          <RatingField
            icon={Zap}
            label="Muscle soreness"
            value={soreness}
            onChange={setSoreness}
            accent="orange"
            hint="1 = no soreness, 10 = very sore"
          />
          <RatingField icon={Zap} label="Recovery" value={recovery} onChange={setRecovery} />
        </div>
      </section>

      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-teal-400" />
          <span className="font-semibold text-white">Bodyweight</span>
        </div>
        <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 focus-within:border-yellow-500/40">
          <input
            type="number"
            step="0.1"
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            className="w-full bg-transparent text-2xl font-bold text-white outline-none"
          />
          <span className="text-sm text-zinc-500">kg</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Target range {form.targetRange.min}–{form.targetRange.max} kg
        </p>
      </div>

      <section>
        <SectionTitle title="Reflection" description="Helps your coach adjust next week" />
        <TextArea label="Pain / niggles" defaultValue={form.painNiggles} />
        <TextArea label="Biggest win this week" defaultValue={form.biggestWin} />
        <TextArea label="Biggest struggle this week" defaultValue={form.biggestStruggle} />
        <TextArea label="Next week availability" defaultValue={form.nextWeekAvailability} />
      </section>

      <div className={`${athleteCard} ${athleteCardPadding} text-sm text-zinc-500`}>
        <p className="font-semibold text-zinc-300">Last check-in reference</p>
        <p className="mt-2 leading-relaxed">{MOCK_CHECK_IN.lastSummary.note}</p>
      </div>

      <div className="sticky bottom-20 z-30 border-t border-zinc-800/80 bg-black/90 py-4 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
        <BtnPrimary disabled={submitted} onClick={() => setSubmitted(true)} className="w-full sm:max-w-md">
          {submitted ? "Check-in submitted ✓" : "Submit weekly check-in"}
        </BtnPrimary>
      </div>
    </PageContent>
  );
}

function RatingField({
  icon: Icon,
  label,
  value,
  onChange,
  accent = "yellow",
  hint,
}: {
  icon: typeof Moon;
  label: string;
  value: number;
  onChange: (n: number) => void;
  accent?: "yellow" | "orange";
  hint?: string;
}) {
  const valueColor = accent === "orange" ? "text-orange-400" : "text-yellow-400";
  const activeFill =
    accent === "orange"
      ? "border-orange-500/50 bg-orange-500/30 text-orange-200"
      : "border-yellow-400 bg-yellow-400 text-zinc-950";

  return (
    <div className={`${athleteCard} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent === "orange" ? "text-orange-400" : "text-purple-400"}`} />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
              n === value
                ? activeFill
                : accent === "orange" && n <= value
                  ? "border-orange-500/30 bg-orange-950/40 text-orange-300/80"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-2 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function TextArea({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <textarea
        defaultValue={defaultValue}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-yellow-500/40"
      />
    </div>
  );
}
