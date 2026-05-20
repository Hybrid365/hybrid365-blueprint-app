"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCoachAthleteById } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachProgrammeStatus } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  CoachAthleteDashboard,
  type AthleteTab,
  type CoachNotesState,
} from "@/components/admin-hyrox-athletes/CoachAthleteDashboard";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import Link from "next/link";

const TAB_VALUES: AthleteTab[] = [
  "Overview",
  "Assessment",
  "Testing",
  "Programme Builder",
  "Check-Ins",
  "Coach Notes",
];

function tabFromQuery(param: string | null): AthleteTab {
  if (param && TAB_VALUES.includes(param as AthleteTab)) {
    return param as AthleteTab;
  }
  return "Programme Builder";
}

export default function HyroxAthleteCoachClient({ athleteId }: { athleteId: string }) {
  const searchParams = useSearchParams();
  const athlete = getCoachAthleteById(athleteId);
  const [tab, setTab] = useState<AthleteTab>(() =>
    tabFromQuery(searchParams.get("tab"))
  );
  const [programmeStatus, setProgrammeStatus] = useState<CoachProgrammeStatus | undefined>(
    undefined
  );
  const [coachNotes, setCoachNotes] = useState<CoachNotesState | null>(null);

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q) setTab(tabFromQuery(q));
  }, [searchParams]);

  if (!athlete) {
    return (
      <CoachAdminShell title="Athlete not found">
        <p className="text-zinc-400">No mock athlete with id &quot;{athleteId}&quot;.</p>
        <Link href="/admin/hyrox-athletes" className="mt-4 inline-block text-yellow-400">
          ← Back to roster
        </Link>
      </CoachAdminShell>
    );
  }

  const status = programmeStatus ?? athlete.programmeStatus;
  const notes: CoachNotesState = coachNotes ?? {
    weeklyCoachNote: athlete.weeklyCoachNote,
    weekRationale: athlete.weekRationale,
    thingsToAvoid: athlete.thingsToAvoid,
    keyFocus: athlete.keyFocus,
    athleteFacingNote: athlete.athleteFacingNote,
  };

  return (
    <CoachAdminShell
      title={athlete.name}
      actions={
        <Link
          href="/admin/hyrox-programme-preview"
          className="text-xs font-semibold text-zinc-500 hover:text-yellow-300"
        >
          Programme logic preview →
        </Link>
      }
    >
      <CoachAthleteDashboard
        athlete={athlete}
        tab={tab}
        onTabChange={setTab}
        programmeStatus={status}
        onProgrammeStatusChange={setProgrammeStatus}
        coachNotes={notes}
        onCoachNotesChange={(patch) =>
          setCoachNotes((prev) => ({ ...(prev ?? notes), ...patch }))
        }
      />
    </CoachAdminShell>
  );
}
