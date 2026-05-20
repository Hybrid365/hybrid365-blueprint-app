"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  applyProfileOverrides,
  mapAssessmentToAthleteProfile,
  mergeProfileIntoCoachAthlete,
  profileFromCoachAthleteFallback,
} from "@/app/lib/hyroxAssessmentMapping";
import type { ProfileReviewOverrides } from "@/app/lib/hyroxAthleteProfileTypes";
import { getMockAssessmentForAthlete } from "@/app/lib/hyroxMockAssessmentSubmissions";
import { generateCoachDraftWeek, type CoachProgrammeStatus, type CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";
import { getCoachAthleteById, suggestedNextCoachAction } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import {
  CoachAthleteDashboard,
  type AthleteTab,
  type CoachNotesState,
} from "@/components/admin-hyrox-athletes/CoachAthleteDashboard";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";

const TAB_VALUES: AthleteTab[] = [
  "Overview",
  "Assessment",
  "Testing",
  "Profile Review",
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
  const baseAthlete = getCoachAthleteById(athleteId);
  const [tab, setTab] = useState<AthleteTab>(() => tabFromQuery(searchParams.get("tab")));
  const [programmeStatus, setProgrammeStatus] = useState<CoachProgrammeStatus | undefined>(undefined);
  const [coachNotes, setCoachNotes] = useState<CoachNotesState | null>(null);
  const [profileOverrides, setProfileOverrides] = useState<ProfileReviewOverrides>({});
  const [rosterPatch, setRosterPatch] = useState<Partial<Pick<CoachAthlete, "listStatus" | "nextCoachAction">>>(
    {}
  );
  const [injectedDraft, setInjectedDraft] = useState<CoachDraftWeek | null>(null);
  const [draftInjectionKey, setDraftInjectionKey] = useState(0);
  const [assessmentBanner, setAssessmentBanner] = useState<{ bullets: string[] } | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q) setTab(tabFromQuery(q));
  }, [searchParams]);

  const assessment = getMockAssessmentForAthlete(athleteId);

  const autoProfile = useMemo(() => {
    if (!baseAthlete) return null;
    if (assessment) return mapAssessmentToAthleteProfile(assessment);
    return profileFromCoachAthleteFallback(baseAthlete);
  }, [assessment, baseAthlete]);

  const effectiveProfile = useMemo(
    () => (autoProfile ? applyProfileOverrides(autoProfile, profileOverrides) : null),
    [autoProfile, profileOverrides]
  );

  const mergedAthlete = useMemo(() => {
    if (!baseAthlete || !effectiveProfile) return null;
    return mergeProfileIntoCoachAthlete(baseAthlete, effectiveProfile);
  }, [baseAthlete, effectiveProfile]);

  const displayAthlete = useMemo(() => {
    if (!mergedAthlete) return null;
    return { ...mergedAthlete, ...rosterPatch };
  }, [mergedAthlete, rosterPatch]);

  const handleSaveProfileReview = useCallback(() => {
    if (!baseAthlete) return;
    if (baseAthlete.listStatus === "assessment_submitted") {
      setRosterPatch((prev) => ({
        ...prev,
        listStatus: "profile_mapped",
        nextCoachAction: suggestedNextCoachAction("profile_mapped"),
      }));
    }
  }, [baseAthlete]);

  const handleResetProfileToAuto = useCallback(() => {
    setProfileOverrides({});
  }, []);

  const handleGenerateProgrammeDraft = useCallback(() => {
    if (!mergedAthlete || !effectiveProfile) return;
    const d = generateCoachDraftWeek(mergedAthlete);
    setInjectedDraft(d);
    setDraftInjectionKey((k) => k + 1);
    setProgrammeStatus("generated_draft");
    setAssessmentBanner({
      bullets: [
        `Main limiter: ${effectiveProfile.mainLimiter}`,
        `Weekly training hours: ${effectiveProfile.weeklyTrainingHours} h`,
        `Station weaknesses: ${effectiveProfile.stationWeaknesses.filter((x) => x !== "none_significant").join(", ") || "—"}`,
        `Race timeline: ${effectiveProfile.raceTimelineWeeks} weeks (${effectiveProfile.raceTimelinePhase})`,
        `Recovery risk: ${effectiveProfile.recoveryRisk}`,
      ],
    });
    setRosterPatch({
      listStatus: "draft_generated",
      nextCoachAction: suggestedNextCoachAction("draft_generated"),
    });
    setGenerateSuccess(true);
    window.setTimeout(() => setGenerateSuccess(false), 9000);
    setTab("Programme Builder");
  }, [mergedAthlete, effectiveProfile]);

  const clearAssessmentBanner = useCallback(() => {
    setAssessmentBanner(null);
  }, []);

  if (!baseAthlete || !displayAthlete) {
    return (
      <CoachAdminShell title="Athlete not found">
        <p className="text-zinc-400">No mock athlete with id &quot;{athleteId}&quot;.</p>
        <Link href="/admin/hyrox-athletes" className="mt-4 inline-block text-yellow-400">
          ← Back to roster
        </Link>
      </CoachAdminShell>
    );
  }

  const status = programmeStatus ?? displayAthlete.programmeStatus;
  const notes: CoachNotesState = coachNotes ?? {
    weeklyCoachNote: displayAthlete.weeklyCoachNote,
    weekRationale: displayAthlete.weekRationale,
    thingsToAvoid: displayAthlete.thingsToAvoid,
    keyFocus: displayAthlete.keyFocus,
    athleteFacingNote: displayAthlete.athleteFacingNote,
  };

  return (
    <CoachAdminShell
      title={displayAthlete.name}
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
        athlete={displayAthlete}
        tab={tab}
        onTabChange={setTab}
        programmeStatus={status}
        onProgrammeStatusChange={setProgrammeStatus}
        coachNotes={notes}
        onCoachNotesChange={(patch) => setCoachNotes((prev) => ({ ...(prev ?? notes), ...patch }))}
        profileReview={{
          athlete: displayAthlete,
          assessment,
          overrides: profileOverrides,
          onOverridesChange: setProfileOverrides,
          onSaveProfileReview: handleSaveProfileReview,
          onResetToAuto: handleResetProfileToAuto,
          onGenerateProgrammeDraft: handleGenerateProgrammeDraft,
          generateSuccess,
          draftExists: injectedDraft != null && draftInjectionKey > 0,
        }}
        programmeWorkflowInject={{
          injectedDraft,
          draftInjectionKey,
          assessmentMappingBanner: assessmentBanner,
          onClearAssessmentMappingBanner: clearAssessmentBanner,
        }}
      />
    </CoachAdminShell>
  );
}
