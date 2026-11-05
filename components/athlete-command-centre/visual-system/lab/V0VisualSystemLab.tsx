"use client";

import { useState } from "react";
import { LabFixtureBadge } from "./LabFixtureBadge";
import {
  LAB_DISTANCE_REPEAT_WORKOUT,
  LAB_MIXED_UNSUPPORTED_WORKOUT,
  LAB_STATION_ROUND_WORKOUT,
  labContinuousTimeline,
  labPrimarySession,
  labRepeatTimeline,
  labSecondaryCompleted,
  labSecondarySession,
  labWeekDays,
} from "./labFixtures";
import { buildWorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { RollingValue } from "../primitives/RollingValue";
import { VsSectionHeader } from "../primitives/SectionHeader";
import { SessionStatusPill } from "../primitives/StatusPill";
import { VsStat } from "../primitives/Stat";
import { WeekDateNav } from "../navigation/WeekDateNav";
import { PrimarySessionCard } from "../sessions/PrimarySessionCard";
import { SecondarySessionRow } from "../sessions/SecondarySessionRow";
import { CompactWorkoutPreview } from "../workout/CompactWorkoutPreview";
import { WorkoutSegmentDetail } from "../workout/WorkoutSegmentDetail";
import { WorkoutTimeline } from "../workout/WorkoutTimeline";
import { SESSION_STATUS_LABELS, type SessionStatusKey } from "../tokens";
import { vsSurface, vsSurfaceRaised } from "../tokens";

function LabBlock({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--h365-border)] pb-2">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-[var(--h365-text)]">
          {title}
        </h3>
        <LabFixtureBadge />
      </div>
      {children}
    </section>
  );
}

export function V0VisualSystemLab() {
  const days = labWeekDays();
  const [selectedDay, setSelectedDay] = useState(
    days.find((d) => d.isToday)?.id ?? days[0].id
  );
  const repeatTl = labRepeatTimeline();
  const continuousTl = labContinuousTimeline();
  const [selectedSeg, setSelectedSeg] = useState(repeatTl.segments[0]?.id ?? "");
  const distanceTl = buildWorkoutTimelineViewModel(LAB_DISTANCE_REPEAT_WORKOUT);
  const stationTl = buildWorkoutTimelineViewModel(LAB_STATION_ROUND_WORKOUT);
  const mixedTl = buildWorkoutTimelineViewModel(LAB_MIXED_UNSUPPORTED_WORKOUT);
  const statuses = Object.keys(SESSION_STATUS_LABELS) as SessionStatusKey[];

  return (
    <div
      className="space-y-14 rounded-2xl border border-[var(--h365-border)] p-5 sm:p-8"
      style={{
        background: "var(--h365-background)",
        color: "var(--h365-text)",
      }}
      data-lab="v0-visual-system"
    >
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label-caps text-[var(--h365-accent)]">V0 visual system</p>
          <LabFixtureBadge />
        </div>
        <h2 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-[var(--h365-text)] sm:text-4xl">
          Athlete foundations
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--h365-text-muted)]">
          Batch 0 lab gallery. Presentation primitives and StructuredWorkout →
          timeline adapters only. Fixture content is never production data.
        </p>
      </header>

      <LabBlock title="Typography" id="vs-typography">
        <div className="space-y-4">
          <p className="font-display text-4xl font-bold uppercase leading-none tracking-tight">
            Display heading
          </p>
          <VsSectionHeader eyebrow="Section" title="Section heading" meta="Meta" />
          <div className="flex flex-wrap gap-8">
            <VsStat label="Large metric" value="3:55" unit="/km" accent />
            <VsStat label="Technical" value="1:30" unit="jog" />
            <div>
              <p className="label-caps text-[var(--h365-text-muted)]">Label caps</p>
              <p className="mt-1 num text-lg">12:34:56 tabular</p>
            </div>
            <div>
              <p className="label-caps text-[var(--h365-text-muted)]">Rolling</p>
              <p className="mt-1 font-display text-3xl font-semibold">
                <RollingValue value={selectedDay.slice(-1)} />
              </p>
            </div>
          </div>
        </div>
      </LabBlock>

      <LabBlock title="Surfaces" id="vs-surfaces">
        <div className="grid gap-3 sm:grid-cols-3">
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: "var(--h365-background)" }}
          >
            Background
          </div>
          <div className={`${vsSurface} p-4 text-sm`}>Surface</div>
          <div className={`${vsSurfaceRaised} p-4 text-sm`}>Surface raised</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="h-11 rounded-lg bg-[var(--h365-accent)] px-4 text-sm font-semibold text-[var(--h365-background)]"
          >
            Primary CTA
          </button>
          <button
            type="button"
            className="h-11 rounded-lg border border-[var(--h365-border)] px-4 text-sm text-[var(--h365-text)]"
          >
            Secondary
          </button>
        </div>
      </LabBlock>

      <LabBlock title="Status states" id="vs-status">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <SessionStatusPill key={s} status={s} />
          ))}
        </div>
      </LabBlock>

      <LabBlock title="Coach note" id="vs-coach-note">
        <AthleteCoachNote note="Hold the first rep steady — match effort, not clock time." />
      </LabBlock>

      <LabBlock title="Date navigation" id="vs-date-nav">
        <div className="sticky top-0 z-10 -mx-1 bg-[var(--h365-background)]/95 px-1 py-2 backdrop-blur-sm">
          <WeekDateNav
            days={days}
            selectedId={selectedDay}
            onSelect={setSelectedDay}
          />
        </div>
      </LabBlock>

      <LabBlock title="Session cards" id="vs-session-cards">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PrimarySessionCard session={labPrimarySession()} />
          <div className="flex flex-col gap-3">
            <SecondarySessionRow session={labSecondarySession()} />
            <SecondarySessionRow session={labSecondaryCompleted()} />
          </div>
        </div>
      </LabBlock>

      <LabBlock title="Compact workout preview" id="vs-compact">
        <div className={`${vsSurface} p-4`}>
          <CompactWorkoutPreview timeline={repeatTl} />
        </div>
      </LabBlock>

      <LabBlock title="Repeat timeline + segment detail" id="vs-repeat-timeline">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <WorkoutTimeline
            timeline={repeatTl}
            selectedId={selectedSeg}
            onSelect={setSelectedSeg}
          />
          <div className={`${vsSurface} p-5`}>
            <WorkoutSegmentDetail
              segments={repeatTl.segments}
              selectedId={selectedSeg}
              onSelect={setSelectedSeg}
            />
          </div>
        </div>
        <p className="text-[11px] text-[var(--h365-text-muted)]">
          Support: {repeatTl.support} · proportional:{" "}
          {String(repeatTl.canProportionByDuration)}
        </p>
      </LabBlock>

      <LabBlock title="Continuous timeline" id="vs-continuous">
        <WorkoutTimeline
          timeline={continuousTl}
          selectedId={continuousTl.segments[0]?.id ?? ""}
          onSelect={() => {}}
        />
        <p className="text-[11px] text-[var(--h365-text-muted)]">
          Support: {continuousTl.support}
        </p>
      </LabBlock>

      <LabBlock title="Honest fallbacks (unsupported / missing duration)" id="vs-gaps">
        <ul className="space-y-3 text-sm text-[var(--h365-text-muted)]">
          <li>
            Distance repeat (no time on work) — proportional:{" "}
            {String(distanceTl.canProportionByDuration)} · segments:{" "}
            {distanceTl.segments.length}
          </li>
          <li>
            Station round — support: {stationTl.support} · segments:{" "}
            {stationTl.segments.length} · {stationTl.unsupportedReasons.join("; ")}
          </li>
          <li>
            Mixed repeat + strength — support: {mixedTl.support} · segments:{" "}
            {mixedTl.segments.length} · {mixedTl.unsupportedReasons.join("; ")}
          </li>
        </ul>
      </LabBlock>
    </div>
  );
}
