"use client";

import Link from "next/link";
import { COACH_ATHLETES, suggestedNextCoachAction } from "@/app/lib/hyroxCoachMockAthletes";
import { CoachActionQueue } from "@/components/admin-hyrox-athletes/CoachActionQueue";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import { ListStatusBadge } from "@/components/admin-hyrox-athletes/StatusBadge";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";
import { HyroxEyebrow, HyroxLead } from "@/components/hyrox-team/HyroxTeamUi";
import { ChevronRight } from "lucide-react";

const RECOVERY_LABEL = { good: "Good", moderate: "Moderate", poor: "Poor" } as const;

export function AthleteList() {
  const needsReview = COACH_ATHLETES.filter(
    (a) =>
      a.listStatus === "needs_coach_review" ||
      a.listStatus === "draft_generated" ||
      a.listStatus === "profile_mapped" ||
      a.listStatus === "check_in_requires_adjustment"
  ).length;

  return (
    <CoachAdminShell
      actions={
        <div className="text-right text-xs text-zinc-500">
          <p className="font-semibold text-yellow-400/90">{needsReview} need attention</p>
          <p>{COACH_ATHLETES.length} athletes (mock)</p>
        </div>
      }
    >
      <HyroxEyebrow>Programme Builder · Coach workflow</HyroxEyebrow>
      <div className="mt-3 max-w-2xl">
        <HyroxLead>
          Review generated programmes, edit sessions, and publish to athlete dashboards when
          approved.
        </HyroxLead>
      </div>

      <div className="mt-8">
        <CoachActionQueue />
      </div>

      <div className="mt-8 hidden overflow-hidden rounded-2xl border border-zinc-800 lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Athlete</th>
              <th className="px-4 py-3">Race</th>
              <th className="px-4 py-3">Block</th>
              <th className="px-4 py-3">Limiters</th>
              <th className="px-4 py-3">Load</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Recovery</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Next action</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {COACH_ATHLETES.map((a) => (
              <tr key={a.id} className="border-t border-zinc-800/80 hover:bg-zinc-900/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/15 text-xs font-bold text-yellow-200">
                      {a.initials}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{a.name}</p>
                      <p className="text-[11px] text-zinc-500">Updated {a.lastUpdated}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  <p>{a.raceDate}</p>
                  <p className="text-[11px]">{a.raceCategory}</p>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  B{a.programmeBlock} W{a.blockWeek}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {a.mainLimiter}
                  <br />
                  <span className="text-zinc-600">{a.secondaryLimiter}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {a.trainingDays}d · {a.weeklyHours}h
                </td>
                <td className="px-4 py-3 capitalize text-zinc-400">{a.checkInStatus}</td>
                <td className="px-4 py-3 text-zinc-400">{RECOVERY_LABEL[a.recoveryStatus]}</td>
                <td className="px-4 py-3">
                  <ListStatusBadge status={a.listStatus} />
                </td>
                <td className="max-w-[180px] px-4 py-3 text-xs text-zinc-400">
                  {suggestedNextCoachAction(a.listStatus)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/hyrox-athletes/${a.id}`}
                    className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-yellow-400/15 px-3 text-xs font-bold text-yellow-200 ring-1 ring-yellow-500/30 hover:bg-yellow-400/25"
                  >
                    Open Coach Dashboard
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 lg:hidden">
        {COACH_ATHLETES.map((a) => (
          <DashCard key={a.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-sm font-bold text-yellow-200">
                  {a.initials}
                </span>
                <div>
                  <p className="font-bold text-white">{a.name}</p>
                  <p className="text-xs text-zinc-500">
                    {a.raceDate} · B{a.programmeBlock} W{a.blockWeek} · {a.trainingDays}d ·{" "}
                    {a.weeklyHours}h
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{suggestedNextCoachAction(a.listStatus)}</p>
                </div>
              </div>
              <ListStatusBadge status={a.listStatus} />
            </div>
            <Link
              href={`/admin/hyrox-athletes/${a.id}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-zinc-950"
            >
              Open Coach Dashboard
            </Link>
          </DashCard>
        ))}
      </div>
    </CoachAdminShell>
  );
}
