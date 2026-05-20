"use client";

import type { CoachAthleteListStatus, CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  LIST_STATUS_LABELS,
  PROGRAMME_STATUS_LABELS,
} from "@/app/lib/hyroxCoachMockAthletes";

const LIST_STYLES: Record<CoachAthleteListStatus, string> = {
  assessment_submitted: "border-sky-500/35 bg-sky-400/10 text-sky-200",
  profile_mapped: "border-cyan-500/35 bg-cyan-400/10 text-cyan-200",
  draft_generated: "border-violet-500/35 bg-violet-400/10 text-violet-200",
  needs_coach_review: "border-yellow-500/40 bg-yellow-400/15 text-yellow-200",
  approved: "border-emerald-500/35 bg-emerald-400/10 text-emerald-200",
  published_to_athlete: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
  check_in_requires_adjustment: "border-orange-500/40 bg-orange-400/10 text-orange-200",
};

const PROG_STYLES: Record<CoachProgrammeStatus, string> = {
  generated_draft: "border-zinc-600 bg-zinc-800/80 text-zinc-300",
  coach_reviewing: "border-yellow-500/35 bg-yellow-400/10 text-yellow-200",
  edited_draft: "border-violet-500/30 bg-violet-400/10 text-violet-200",
  approved: "border-emerald-500/30 bg-emerald-400/10 text-emerald-200",
  published: "border-emerald-500/40 bg-emerald-500/15 text-emerald-100",
};

export function ListStatusBadge({ status }: { status: CoachAthleteListStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LIST_STYLES[status]}`}
    >
      {LIST_STATUS_LABELS[status]}
    </span>
  );
}

export function ProgrammeStatusBadge({ status }: { status: CoachProgrammeStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${PROG_STYLES[status]}`}
    >
      {PROGRAMME_STATUS_LABELS[status]}
    </span>
  );
}
