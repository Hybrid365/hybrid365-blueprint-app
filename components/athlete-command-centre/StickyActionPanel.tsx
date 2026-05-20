"use client";

import { ClipboardCheck, Play, Target } from "lucide-react";
import Link from "next/link";
import {
  DASHBOARD_SECTIONS,
  MOCK_ATHLETE,
  MOCK_CHECK_IN,
  MOCK_NEXT_SESSION,
} from "@/app/lib/hyroxTeamDashboardMock";
import type { DashboardSectionId } from "@/app/lib/hyroxTeamDashboardMock";
import { scrollToSection } from "./nav";
import { sessionTypeStyle } from "@/components/hyrox-team/HyroxDashboardUi";

type Props = {
  onViewSession: () => void;
  onLogResult: () => void;
  onCheckIn: () => void;
  activeSection?: DashboardSectionId;
};

export function StickyActionPanel({ onViewSession, onLogResult, onCheckIn, activeSection }: Props) {
  const next = MOCK_NEXT_SESSION;
  const checkInDue = MOCK_CHECK_IN.status === "Due";

  return (
    <aside className="hidden space-y-5 lg:block">
      <div className="sticky top-6 space-y-5">
        <div className="rounded-2xl border border-yellow-500/25 bg-zinc-900/95 p-5 shadow-lg shadow-black/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400/80">Next session</p>
          <p className="mt-2 text-lg font-bold leading-snug text-white">{next.name}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {next.day} · {next.dateLabel}
          </p>
          <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${sessionTypeStyle(next.type)}`}>
            {next.type}
          </span>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400 line-clamp-3">{next.objective}</p>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={onViewSession}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
            >
              <Play className="h-4 w-4" />
              View session
            </button>
            <button
              type="button"
              onClick={onLogResult}
              className="w-full rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Log result
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Check-in</span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                checkInDue ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {MOCK_CHECK_IN.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Due {MOCK_CHECK_IN.dueLabel}</p>
          <button
            type="button"
            onClick={onCheckIn}
            className="mt-3 w-full rounded-lg border border-yellow-400/30 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/10"
          >
            Complete check-in
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-500">Coach focus</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{MOCK_ATHLETE.coachingFocus}</p>
            </div>
          </div>
        </div>

        <nav className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3" aria-label="Quick jump">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Jump to</p>
          <ul className="m-0 space-y-0.5 p-0">
            {DASHBOARD_SECTIONS.map((s) => (
              <li key={s.id} className="list-none">
                <button
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                    activeSection === s.id
                      ? "bg-yellow-400/15 font-semibold text-yellow-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-2">
          <Link
            href="/athlete/assessment"
            className="rounded-xl border border-zinc-800 px-3 py-2 text-center text-xs font-semibold text-zinc-400 hover:border-zinc-700 hover:text-white"
          >
            Athlete profile
          </Link>
          <Link
            href="/athlete/testing"
            className="rounded-xl border border-zinc-800 px-3 py-2 text-center text-xs font-semibold text-yellow-400/90 hover:border-yellow-500/30"
          >
            Update tests
          </Link>
        </div>
      </div>
    </aside>
  );
}
