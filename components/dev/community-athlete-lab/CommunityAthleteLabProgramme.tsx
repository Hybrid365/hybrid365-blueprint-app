"use client";

import { useMemo, useState } from "react";
import { MemberSessionDetailDrawer } from "@/components/dashboard/MemberSessionDetailDrawer";
import { SessionStateBadge } from "@/components/dashboard/SessionStateBadge";
import {
  ALEX_MORGAN_COMMUNITY_LAB,
  labLogsByKey,
} from "@/app/lib/dev/community-athlete-lab/alexMorganFixture";
import type { SessionLogDraft } from "@/app/lib/memberSessionLog";
import type { MemberSessionDrawerSession } from "@/app/lib/memberSessionTypes";
import { resolveSessionDisplayState } from "@/app/lib/sessionLogTypes";

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

export function CommunityAthleteLabProgramme() {
  const lab = ALEX_MORGAN_COMMUNITY_LAB;
  const logs = useMemo(() => labLogsByKey(), []);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MemberSessionDrawerSession | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/90">Programme</p>
      <h1 className="mt-2 text-2xl font-bold text-white">{lab.programme.title}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Week {lab.programme.currentWeek} of {lab.programme.totalWeeks} · Engine / Build block
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        Live Community programme is in-page on `/dashboard/programme` (no week URL). This lab shows the current
        week only.
      </p>

      <ol className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {Array.from({ length: lab.programme.totalWeeks }, (_, i) => i + 1).map((week) => {
          const current = week === lab.programme.currentWeek;
          const past = week < lab.programme.currentWeek;
          return (
            <li
              key={week}
              className={
                current
                  ? "rounded-lg border border-yellow-400/50 bg-yellow-400/10 py-2 text-center text-sm font-bold text-yellow-300"
                  : past
                    ? "rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-center text-sm text-zinc-400"
                    : "rounded-lg border border-zinc-900 py-2 text-center text-sm text-zinc-600"
              }
            >
              {week}
            </li>
          );
        })}
      </ol>

      <ul className="mt-8 space-y-2">
        {lab.week6Sessions.map((session) => {
          const rowLog = logs[session.sessionKey];
          const state = resolveSessionDisplayState({
            log: rowLog,
            isTodaySession: session.sessionKey === lab.todaySessionKey,
          });
          return (
            <li key={session.sessionKey}>
              <button
                type="button"
                onClick={() => {
                  setSelected(session);
                  setOpen(true);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left hover:border-yellow-500/30"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{session.day}</p>
                  <p className="font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-zinc-500">{session.intent}</p>
                </div>
                <SessionStateBadge state={state} />
              </button>
            </li>
          );
        })}
      </ul>

      <MemberSessionDetailDrawer
        open={open}
        session={selected}
        onClose={() => setOpen(false)}
        log={selected ? logs[selected.sessionKey] : undefined}
        draft={emptyDraft}
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
