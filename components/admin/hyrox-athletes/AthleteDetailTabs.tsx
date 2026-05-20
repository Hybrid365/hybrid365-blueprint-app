"use client";

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import { formatRaceCountdown } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import { ProgrammeBuilderTab } from "@/components/admin/hyrox-athletes/ProgrammeBuilderTab";
import {
  ListStatusBadge,
  ProgrammeStatusBadge,
} from "@/components/admin/hyrox-athletes/StatusBadge";
import { DashCard, SectionHeading, StatTile } from "@/components/hyrox-team/HyroxDashboardUi";
import { Calendar, Heart, Target } from "lucide-react";

const TABS = [
  "Overview",
  "Assessment",
  "Testing",
  "Programme Builder",
  "Check-Ins",
  "Coach Notes",
] as const;

export type AthleteTab = (typeof TABS)[number];

export function AthleteDetailTabs({
  athlete,
  tab,
  onTabChange,
  programmeStatus,
  onProgrammeStatusChange,
  coachNotes,
  onCoachNotesChange,
}: {
  athlete: CoachAthlete;
  tab: AthleteTab;
  onTabChange: (t: AthleteTab) => void;
  programmeStatus: CoachProgrammeStatus;
  onProgrammeStatusChange: (s: CoachProgrammeStatus) => void;
  coachNotes: {
    weeklyCoachNote: string;
    weekRationale: string;
    thingsToAvoid: string;
    keyFocus: string;
  };
  onCoachNotesChange: (patch: Partial<typeof coachNotes>) => void;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              tab === t
                ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/40"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab athlete={athlete} />}
      {tab === "Assessment" && <AssessmentTab athlete={athlete} />}
      {tab === "Testing" && <TestingTab athlete={athlete} />}
      {tab === "Programme Builder" && (
        <ProgrammeBuilderTab
          athlete={athlete}
          programmeStatus={programmeStatus}
          onStatusChange={onProgrammeStatusChange}
          weeklyCoachNote={coachNotes.weeklyCoachNote}
          weekRationale={coachNotes.weekRationale}
          thingsToAvoid={coachNotes.thingsToAvoid}
          keyFocus={coachNotes.keyFocus}
          onCoachNotesChange={onCoachNotesChange}
        />
      )}
      {tab === "Check-Ins" && <CheckInsTab athlete={athlete} />}
      {tab === "Coach Notes" && (
        <CoachNotesTab athlete={athlete} coachNotes={coachNotes} onCoachNotesChange={onCoachNotesChange} />
      )}
    </div>
  );
}

export function AthleteCommandHeader({ athlete }: { athlete: CoachAthlete }) {
  return (
    <DashCard highlight className="mb-6">
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/25 to-zinc-800 text-xl font-black text-yellow-200">
          {athlete.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{athlete.name}</h2>
            <ListStatusBadge status={athlete.listStatus} />
            <ProgrammeStatusBadge status={athlete.programmeStatus} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">{athlete.email}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-yellow-400/80" />
              {athlete.raceDate} · {formatRaceCountdown(athlete.weeksToRace)}
            </span>
            <span>{athlete.raceCategory}</span>
            <span>
              Block {athlete.programmeBlock} · Week {athlete.blockWeek}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label="Main limiter" value={athlete.mainLimiter} />
          <MiniStat label="Programme" value={athlete.programmeStatus.replace(/_/g, " ")} />
          <MiniStat
            label="Check-in"
            value={athlete.checkInStatus}
            warn={athlete.checkInStatus !== "current"}
          />
          <MiniStat
            label="Recovery risk"
            value={athlete.recoveryRisk}
            warn={athlete.recoveryRisk === "high"}
          />
          <MiniStat label="Training" value={`${athlete.trainingDays}d · ${athlete.weeklyHours}h`} />
          <MiniStat label="Next action" value={athlete.nextCoachAction} small />
        </div>
      </div>
    </DashCard>
  );
}

function MiniStat({
  label,
  value,
  warn,
  small,
}: {
  label: string;
  value: string;
  warn?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-zinc-600">{label}</p>
      <p
        className={`mt-0.5 font-semibold text-zinc-200 ${small ? "text-[11px] leading-snug" : "text-sm"} ${warn ? "text-orange-300" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function OverviewTab({ athlete }: { athlete: CoachAthlete }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DashCard>
        <SectionHeading title="Athlete snapshot" />
        <dl className="space-y-2 text-sm">
          <Row label="Classification" value={athlete.classification} />
          <Row label="Race goal" value={athlete.raceGoal} />
          <Row label="Availability" value={`${athlete.trainingDays} days · ${athlete.weeklyHours}h/week`} />
          <Row label="Run volume target" value={`${athlete.weeklyRunKm} km`} />
          <Row label="Main limiter" value={athlete.mainLimiter} />
          <Row label="Secondary limiter" value={athlete.secondaryLimiter} />
          <Row label="Current week" value={`Block ${athlete.programmeBlock} Week ${athlete.blockWeek}`} />
        </dl>
      </DashCard>
      <DashCard>
        <SectionHeading title="Programme priorities" />
        <ul className="space-y-2 text-sm text-zinc-300">
          {athlete.programmePriorities.map((p) => (
            <li key={p} className="flex gap-2">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400/80" />
              {p}
            </li>
          ))}
        </ul>
      </DashCard>
      <DashCard className="lg:col-span-2">
        <SectionHeading title="This week status" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Programme status" value={athlete.programmeStatus.replace(/_/g, " ")} />
          <StatTile label="Last updated" value={athlete.lastUpdated} />
          <StatTile label="Next coach action" value={athlete.nextCoachAction} />
        </div>
      </DashCard>
    </div>
  );
}

function AssessmentTab({ athlete }: { athlete: CoachAthlete }) {
  const a = athlete.assessment;
  return (
    <DashCard>
      <SectionHeading title="Assessment summary" />
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row label="Running profile" value={a.runningProfile} />
        <Row label="Strength profile" value={a.strengthProfile} />
        <Row label="Station weaknesses" value={a.stationWeaknesses.join(", ")} />
        <Row label="Equipment" value={a.equipmentAccess.join(", ")} />
        <Row label="Recovery" value={a.recoveryProfile} />
        <Row label="Nutrition / bodyweight" value={a.nutritionBodyweight} />
        <Row label="Injury / recovery" value={a.injuryRecovery} />
        <Row label="Content consent" value={a.contentConsent ? "Yes" : "No"} />
        <Row label="Documentation consent" value={a.documentationConsent ? "Yes" : "No"} />
      </dl>
    </DashCard>
  );
}

function TestingTab({ athlete }: { athlete: CoachAthlete }) {
  return (
    <DashCard>
      <SectionHeading title="Testing & benchmarks" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-500">
              <th className="pb-2 pr-4">Metric</th>
              <th className="pb-2 pr-4">Baseline</th>
              <th className="pb-2 pr-4">Current</th>
              <th className="pb-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {athlete.benchmarks.map((b) => (
              <tr key={b.key} className="border-b border-zinc-800/60">
                <td className="py-2.5 pr-4 font-medium text-zinc-200">{b.label}</td>
                <td className="py-2.5 pr-4 text-zinc-500">{b.baseline}</td>
                <td className="py-2.5 pr-4 text-yellow-200/90">{b.current}</td>
                <td className="py-2.5 text-zinc-400">{b.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}

function CheckInsTab({ athlete }: { athlete: CoachAthlete }) {
  const items = [
    { date: "2026-05-15", sleep: "6.5h", soreness: "Mild quads", rpe: "Fatigue 6/10", flags: [] },
    { date: "2026-05-08", sleep: "7h", soreness: "None", rpe: "Good", flags: [] },
    {
      date: "2026-05-01",
      sleep: "5.5h",
      soreness: "High lower body",
      rpe: "Struggling",
      flags: athlete.recoveryRisk === "high" ? ["Poor sleep", "High soreness"] : [],
    },
  ];
  return (
    <DashCard>
      <SectionHeading title="Weekly check-ins" />
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.date} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-semibold text-white">{c.date}</p>
              <span
                className={`text-xs ${athlete.checkInStatus === "overdue" && c.date === "2026-05-15" ? "text-orange-300" : "text-zinc-500"}`}
              >
                {athlete.checkInStatus === "due" ? "Review due" : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Sleep {c.sleep} · Soreness {c.soreness} · {c.rpe}
            </p>
            {c.flags.length > 0 ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-300/90">
                <Heart className="h-3.5 w-3.5" />
                {c.flags.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

function CoachNotesTab({
  athlete,
  coachNotes,
  onCoachNotesChange,
}: {
  athlete: CoachAthlete;
  coachNotes: {
    weeklyCoachNote: string;
    weekRationale: string;
    thingsToAvoid: string;
    keyFocus: string;
  };
  onCoachNotesChange: (patch: Partial<typeof coachNotes>) => void;
}) {
  return (
    <DashCard>
      <SectionHeading title="Coach notes" />
      <p className="mb-4 text-sm text-zinc-500">
        Notes for {athlete.name} — also editable in Programme Builder before publish.
      </p>
      <div className="grid gap-4">
        <TextArea
          label="Weekly coach note (athlete-visible when published)"
          value={coachNotes.weeklyCoachNote}
          onChange={(v) => onCoachNotesChange({ weeklyCoachNote: v })}
        />
        <TextArea
          label="Why this week is built this way"
          value={coachNotes.weekRationale}
          onChange={(v) => onCoachNotesChange({ weekRationale: v })}
        />
        <TextArea
          label="Things to avoid this week"
          value={coachNotes.thingsToAvoid}
          onChange={(v) => onCoachNotesChange({ thingsToAvoid: v })}
        />
        <TextArea
          label="Key focus"
          value={coachNotes.keyFocus}
          onChange={(v) => onCoachNotesChange({ keyFocus: v })}
        />
      </div>
    </DashCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-zinc-300">{value}</dd>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
