"use client";

import { useMemo, useState } from "react";
import type { AthleteHomeDDay, AthleteHomeDSessionCard } from "@/app/lib/hyroxAthleteHomeDViewModel";
import {
  homeDDaysToWeekDateNav,
  homeDSessionToCardViewModel,
  splitPrimarySecondarySessions,
} from "@/app/lib/visual-system/homeDSessionCardAdapter";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { WeekDateNav } from "../navigation/WeekDateNav";
import { PrimarySessionCard } from "../sessions/PrimarySessionCard";
import { SecondarySessionRow } from "../sessions/SecondarySessionRow";
import { AthleteCoachNote } from "../primitives/CoachNote";
import { BenchmarkMicro } from "../primitives/BenchmarkMicro";
import { LabFixtureBadge } from "./LabFixtureBadge";
import { LAB_REPEAT_WORKOUT } from "./labFixtures";
import { vsSurface } from "../tokens";

/**
 * LAB-ONLY preview of Batch 1 Home D visual chrome using Home D–shaped VMs.
 * Not live programme data. Never imported by production Home D.
 */
function fixtureDays(): AthleteHomeDDay[] {
  const primary: AthleteHomeDSessionCard = {
    id: "lab-h1",
    slot: "Main",
    modalityLabel: "Run",
    title: "Threshold 5s",
    primaryTarget: "3:55 /km",
    primaryDetail: "5 × 5:00 · 1:30 jog",
    duration: "~45 min",
    intent: "Accumulate quality threshold work.",
    coachNote: "Treat the first rep as a feeler.",
    status: "upcoming",
  };

  const secondary: AthleteHomeDSessionCard = {
    id: "lab-h2",
    slot: "PM",
    modalityLabel: "Strength",
    title: "Lower strength",
    primaryTarget: null,
    primaryDetail: "Squat · hinge · carry",
    duration: "40 min",
    intent: null,
    coachNote: null,
    status: "upcoming",
  };

  const completed: AthleteHomeDSessionCard = {
    id: "lab-h3",
    slot: "Main",
    modalityLabel: "Run",
    title: "Easy aerobic",
    primaryTarget: "Conversational",
    primaryDetail: null,
    duration: "40 min",
    intent: null,
    coachNote: null,
    status: "completed",
  };

  const partial: AthleteHomeDSessionCard = {
    id: "lab-h4",
    slot: "Main",
    modalityLabel: "Hybrid",
    title: "Station density",
    primaryTarget: "Controlled transitions",
    primaryDetail: null,
    duration: "50 min",
    intent: null,
    coachNote: null,
    status: "partial",
  };

  /** Mirrors production density failure: objective duplicated + placeholder target. */
  const densityDup: AthleteHomeDSessionCard = {
    id: "lab-h6",
    slot: "Main",
    modalityLabel: "Strength",
    title: "Upper Body Density EMOM",
    primaryTarget: "See session prescription",
    primaryDetail:
      "Build upper-body pulling/pushing strength endurance with short, dense EMOM work.",
    duration: "35–55 min",
    intent:
      "Build upper-body pulling/pushing strength endurance with short, dense EMOM work.",
    coachNote: "Keep RPE honest — density without grinding.",
    status: "unresolved",
  };

  const densitySecondary: AthleteHomeDSessionCard = {
    id: "lab-h7",
    slot: "PM",
    modalityLabel: "Aerobic",
    title: "Easy run",
    primaryTarget: null,
    primaryDetail: "Add aerobic minutes with minimal impact",
    duration: "30–45 min",
    intent: null,
    coachNote: null,
    status: "unresolved",
  };

  return [
    {
      id: "d0",
      dow: "Mon",
      dateNumber: 3,
      iso: "2026-11-03",
      isToday: false,
      isPast: true,
      sessions: [completed],
    },
    {
      id: "d1",
      dow: "Tue",
      dateNumber: 4,
      iso: "2026-11-04",
      isToday: false,
      isPast: true,
      sessions: [partial],
    },
    {
      id: "d2",
      dow: "Wed",
      dateNumber: 5,
      iso: "2026-11-05",
      isToday: false,
      isPast: false,
      sessions: [],
    },
    {
      id: "d3",
      dow: "Thu",
      dateNumber: 6,
      iso: "2026-11-06",
      isToday: false,
      isPast: false,
      sessions: [
        { ...primary, status: "upcoming" },
        secondary,
      ],
    },
    {
      id: "d4",
      dow: "Fri",
      dateNumber: 7,
      iso: "2026-11-07",
      isToday: true,
      isPast: false,
      sessions: [primary, secondary],
    },
    {
      id: "d5",
      dow: "Sat",
      dateNumber: 8,
      iso: "2026-11-08",
      isToday: false,
      isPast: false,
      sessions: [densityDup, densitySecondary],
    },
    {
      id: "d6",
      dow: "Sun",
      dateNumber: 9,
      iso: "2026-11-09",
      isToday: false,
      isPast: false,
      sessions: [],
    },
  ];
}

export function HomeDVisualPreview() {
  const days = useMemo(() => fixtureDays(), []);
  const [selectedId, setSelectedId] = useState(
    days.find((d) => d.isToday)?.id ?? days[0]!.id
  );
  const selected = days.find((d) => d.id === selectedId) ?? days[0]!;
  const split = splitPrimarySecondarySessions(selected.sessions);
  const navDays = homeDDaysToWeekDateNav(days);

  const liveStub = (id: string): HyroxSession | null => {
    if (id === "lab-h1" || id === "lab-h5") {
      return {
        id,
        day: "Fri",
        dayShort: "Fri",
        dateLabel: "Fri",
        name: id === "lab-h5" ? "Long aerobic" : "Threshold 5s",
        type: "Run",
        focus: "Threshold",
        duration: "45 min",
        rpeTarget: "RPE 7",
        status: "upcoming",
        priority: "Key",
        intent: "Quality",
        structuredWorkout: LAB_REPEAT_WORKOUT,
      };
    }
    return null;
  };

  return (
    <div
      data-lab="home-d-visual-preview"
      className="space-y-6 rounded-2xl border border-[var(--h365-border)] p-4 sm:p-6"
      style={{ background: "var(--h365-background)", color: "var(--h365-text)" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="label-caps text-[var(--h365-accent)]">Home D · Batch 1 chrome</p>
        <LabFixtureBadge />
      </div>
      <header>
        <p className="label-caps text-[var(--h365-text-muted)]">Home</p>
        <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight">
          Demo Competitive
        </h2>
        <p className="mt-1 text-sm text-[var(--h365-text-muted)]">
          Week 6 · Build the Engine · Threshold build
        </p>
      </header>

      <WeekDateNav days={navDays} selectedId={selectedId} onSelect={setSelectedId} />

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
          {selected.isToday ? "Today · Friday" : selected.dow}
        </h3>
        <p className="text-xs text-[var(--h365-text-muted)]">
          {selected.sessions.length === 0
            ? "No session"
            : `${selected.sessions.length} session${selected.sessions.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {selected.sessions.length === 0 ? (
        <div className={`${vsSurface} px-4 py-6`} data-lab-rest="">
          <p className="font-display font-semibold uppercase tracking-wide">
            No training scheduled
          </p>
          <p className="mt-1 text-xs text-[var(--h365-text-muted)]">
            Rest day — not labelled Recovery unless the programme says so.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {split.primary ? (
            <PrimarySessionCard
              session={homeDSessionToCardViewModel(
                split.primary,
                liveStub(split.primary.id)
              )}
            />
          ) : null}
          {split.secondary.map((s) => (
            <SecondarySessionRow
              key={s.id}
              session={homeDSessionToCardViewModel(s, liveStub(s.id))}
            />
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={`${vsSurface} px-4 py-4`}>
          <AthleteCoachNote note="Hold the first rep steady — match effort, not clock time." />
        </div>
        <BenchmarkMicro label="5K" value="17:55" detail="↓ 7 sec vs previous" />
      </div>
    </div>
  );
}
