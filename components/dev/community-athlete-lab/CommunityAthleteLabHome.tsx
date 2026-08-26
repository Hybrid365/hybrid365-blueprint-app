"use client";

import { useMemo, useState } from "react";
import { MemberSessionDetailDrawer } from "@/components/dashboard/MemberSessionDetailDrawer";
import { SessionStateBadge } from "@/components/dashboard/SessionStateBadge";
import { ThisWeekTrackingCard } from "@/components/dashboard/ThisWeekTrackingCard";
import { WeeklyProgressSummaryCard } from "@/components/dashboard/WeeklyProgressSummaryCard";
import {
  ALEX_MORGAN_COMMUNITY_LAB,
  labLogsByKey,
  labTodaySession,
} from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";
import type { SessionLogDraft } from "@/app/lib/memberSessionLog";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";
import { resolveSessionDisplayState } from "@/app/lib/sessionLogTypes";
import { Calendar, Flag, MapPin, Target } from "lucide-react";

const emptyDraft: SessionLogDraft = {
  session_status: "completed",
  rpe: null,
  notes: "",
  duration_minutes: "",
  distance_km: "",
  average_pace: "",
  average_hr: "",
  load_notes: "",
  station_notes: "",
  proof_url: "",
  pain_or_tightness: "",
  erg_modality_notes: "",
  hyrox_weakest_part: "",
  hyrox_rounds: "",
};

function draftFromLog(session: MemberSessionDrawerSession): SessionLogDraft {
  const log = labLogsByKey()[session.sessionKey];
  if (!log) return emptyDraft;
  return {
    ...emptyDraft,
    session_status: log.session_status ?? "completed",
    rpe: log.rpe,
    notes: log.notes ?? "",
    duration_minutes: log.duration_minutes != null ? String(log.duration_minutes) : "",
    distance_km: log.distance_km != null ? String(log.distance_km) : "",
    average_pace: log.average_pace ?? "",
    average_hr: log.average_hr != null ? String(log.average_hr) : "",
    load_notes: log.load_notes ?? "",
    station_notes: log.station_notes ?? "",
  };
}

export function CommunityAthleteLabHome() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;
  const logs = useMemo(() => labLogsByKey(), []);
  const today = labTodaySession();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MemberSessionDrawerSession | null>(null);

  function openSession(session: MemberSessionDrawerSession) {
    setSelected(session);
    setOpen(true);
  }

  const todayLog = logs[today.sessionKey];
  const todayState = resolveSessionDisplayState({
    log: todayLog,
    isTodaySession: true,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">HYROX Track</p>
      <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Good to see you, {lab.athlete.firstName}.</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {lab.programme.title} · Week {lab.programme.currentWeek} of {lab.programme.totalWeeks} · {lab.labClock.weekday}{" "}
        in the lab
      </p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-yellow-400/[0.08] via-zinc-900 to-zinc-950 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400/90">Today&apos;s session</p>
          <SessionStateBadge state={todayState} />
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">{today.title}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {today.day} · {today.duration} · {today.intent}
        </p>
        <button
          type="button"
          onClick={() => openSession(today)}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-yellow-400 px-5 text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          View session
        </button>
      </section>

      <div className="mt-8">
        <WeeklyProgressSummaryCard summary={lab.weekTracking} isHyroxTrack />
      </div>
      <ThisWeekTrackingCard summary={lab.weekTracking} />

      <section className="mt-8 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-zinc-950 to-black p-5 md:p-7">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-amber-400" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400/90">HYROX Track</p>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-white">Race context</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <p className="flex items-center gap-2 text-sm text-zinc-300">
            <Target className="h-4 w-4 text-zinc-500" />
            {lab.programme.goal}
          </p>
          <p className="flex items-center gap-2 text-sm text-zinc-300">
            <MapPin className="h-4 w-4 text-zinc-500" />
            {lab.programme.nextRace}
          </p>
          <p className="flex items-center gap-2 text-sm text-zinc-300">
            <Calendar className="h-4 w-4 text-zinc-500" />
            {lab.hyroxDetails.race_date}
          </p>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Running this week: {lab.programme.runningCompletedKm} / {lab.programme.runningTargetKm} km
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">This week</h2>
        <ul className="mt-4 space-y-2">
          {lab.week6Sessions.map((session) => {
            const rowLog = logs[session.sessionKey];
            const isToday = session.sessionKey === lab.todaySessionKey;
            const state = resolveSessionDisplayState({
              log: rowLog,
              isTodaySession: isToday,
            });
            return (
              <li key={session.sessionKey}>
                <button
                  type="button"
                  onClick={() => openSession(session)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left hover:border-yellow-500/30"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{session.day}</p>
                    <p className="font-semibold text-white">{session.title}</p>
                    <p className="text-xs text-zinc-500">{session.duration} · {session.category}</p>
                  </div>
                  <SessionStateBadge state={state} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Later feedback hooks</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-400">
          {lab.feedbackHints.map((hint) => (
            <li key={hint}>· {hint}</li>
          ))}
        </ul>
      </section>

      <MemberSessionDetailDrawer
        open={open}
        session={selected}
        onClose={() => setOpen(false)}
        log={selected ? logs[selected.sessionKey] : undefined}
        draft={selected ? draftFromLog(selected) : emptyDraft}
        updateDraft={() => undefined}
        saving={false}
        saveError="UX Lab is read-only. Session writes are disabled."
        programmeInstanceId={null}
        onSave={() => undefined}
        isHyroxTrack
      />
    </div>
  );
}
