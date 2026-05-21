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
import type { HyroxAssessmentInput } from "@/app/lib/hyroxAthleteProfileTypes";
import {
  generateCoachDraftWeek,
  type CoachProgrammeStatus,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import { getCoachAthleteById, suggestedNextCoachAction } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import { getMockAssessmentForAthlete } from "@/app/lib/hyroxMockAssessmentSubmissions";
import { buildCoachAthleteStubFromLiveRow } from "@/app/lib/hyroxLiveCoachAthlete";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  CoachAthleteDashboard,
  type AthleteTab,
  type CoachNotesState,
  type LiveProgrammePersistenceProps,
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function tabFromQuery(param: string | null): AthleteTab {
  if (param && TAB_VALUES.includes(param as AthleteTab)) {
    return param as AthleteTab;
  }
  return "Programme Builder";
}

function programmeStatusToCoachStatus(
  athleteStatus: string,
  programmeStatus: string
): CoachProgrammeStatus {
  if (athleteStatus === "programme_published" || programmeStatus === "published") {
    return "published";
  }
  const draftStatuses = ["draft_generated", "coach_reviewing", "edited", "approved"] as const;
  if (draftStatuses.includes(programmeStatus as (typeof draftStatuses)[number])) {
    return draftDbToCoachStatus(programmeStatus as (typeof draftStatuses)[number]);
  }
  return "coach_reviewing";
}

type LiveCoachPayload = {
  athlete: HyroxAthleteRow;
  hasAssessment: boolean;
  hasTesting: boolean;
  hasRaceResult: boolean;
  assessmentInput: HyroxAssessmentInput | null;
  mappedProfileSaved: boolean;
  programmeDraftId: string | null;
  programmeDraftCoachStatus: CoachProgrammeStatus | null;
  programmeDraftData: CoachDraftWeek | null;
  programmeDraftCoachNote: string;
  programmeDraftAthleteNote: string;
};

export default function HyroxAthleteCoachClient({ athleteId }: { athleteId: string }) {
  const searchParams = useSearchParams();
  const mockAthlete = getCoachAthleteById(athleteId);
  const isLiveId = UUID_RE.test(athleteId);
  const isLive = isLiveId && !mockAthlete;

  const [livePayload, setLivePayload] = useState<LiveCoachPayload | null>(null);
  const [liveLoading, setLiveLoading] = useState(isLive);
  const [liveError, setLiveError] = useState<string | null>(null);

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
  const [mappedProfileSaved, setMappedProfileSaved] = useState(false);
  const [liveDraftId, setLiveDraftId] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [publishedFlash, setPublishedFlash] = useState(false);

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q) setTab(tabFromQuery(q));
  }, [searchParams]);

  const loadLive = useCallback(async () => {
    if (!isLive) return;
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.athlete) {
        const detail =
          process.env.NODE_ENV === "development" && data.detail
            ? `${data.error ?? "Load failed"}: ${data.detail}`
            : (data.error ?? "Could not load live athlete.");
        setLiveError(detail);
        return;
      }
      const athlete = data.athlete as HyroxAthleteRow;
      const coachStatus = data.programmeDraftCoachStatus as CoachProgrammeStatus | null;
      setLivePayload({
        athlete,
        hasAssessment: Boolean(data.hasAssessment),
        hasTesting: Boolean(data.hasTesting),
        hasRaceResult: Boolean(data.hasRaceResult),
        assessmentInput: data.assessmentInput ?? null,
        mappedProfileSaved: Boolean(data.mappedProfileSaved),
        programmeDraftId: data.programmeDraft?.id ?? null,
        programmeDraftCoachStatus: coachStatus,
        programmeDraftData: data.programmeDraftData ?? null,
        programmeDraftCoachNote: data.programmeDraft?.coach_note ?? "",
        programmeDraftAthleteNote: data.programmeDraft?.athlete_facing_note ?? "",
      });
      setMappedProfileSaved(Boolean(data.mappedProfileSaved));
      setLiveDraftId(data.programmeDraft?.id ?? null);
      if (coachStatus) setProgrammeStatus(coachStatus);
      else if (athlete.status === "programme_published") setProgrammeStatus("published");
      if (data.programmeDraftData) {
        setInjectedDraft(data.programmeDraftData as CoachDraftWeek);
        setDraftInjectionKey((k) => k + 1);
      }
      if (data.programmeDraft) {
        setCoachNotes({
          weeklyCoachNote: data.programmeDraft.coach_note ?? "",
          weekRationale: "",
          keyFocus: "",
          thingsToAvoid: "",
          athleteFacingNote: data.programmeDraft.athlete_facing_note ?? "",
        });
      }
    } catch {
      setLiveError("Network error loading athlete.");
    } finally {
      setLiveLoading(false);
    }
  }, [athleteId, isLive]);

  useEffect(() => {
    void loadLive();
  }, [loadLive]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && isLive && liveDraftId) {
      console.log("Live programme draft id", liveDraftId);
    }
  }, [isLive, liveDraftId]);

  const baseAthlete = useMemo((): CoachAthlete | undefined => {
    if (mockAthlete) return mockAthlete;
    if (!livePayload) return undefined;
    const stub = buildCoachAthleteStubFromLiveRow(livePayload.athlete, {
      hasAssessment: livePayload.hasAssessment,
      hasTesting: livePayload.hasTesting,
    });
    return {
      ...stub,
      programmeStatus: programmeStatusToCoachStatus(
        livePayload.athlete.status,
        livePayload.athlete.programme_status
      ),
    };
  }, [mockAthlete, livePayload, programmeStatus]);

  const assessment = useMemo((): HyroxAssessmentInput | undefined => {
    if (mockAthlete) return getMockAssessmentForAthlete(athleteId);
    return livePayload?.assessmentInput ?? undefined;
  }, [mockAthlete, livePayload, athleteId]);

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

  const handleSaveProfileReview = useCallback(async () => {
    if (!baseAthlete || !autoProfile || !effectiveProfile) return;

    if (!isLive) {
      if (
        baseAthlete.listStatus === "assessment_submitted" ||
        baseAthlete.listStatus === "needs_coach_review"
      ) {
        setRosterPatch((prev) => ({
          ...prev,
          listStatus: "profile_mapped",
          nextCoachAction: suggestedNextCoachAction("profile_mapped"),
        }));
      }
      return;
    }

    setProfileSaveError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/mapped-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapped_profile: autoProfile,
          coach_overrides: profileOverrides,
          effective_profile: effectiveProfile,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileSaveError(data.error ?? "Could not save mapped profile.");
        return;
      }
      setMappedProfileSaved(true);
      setRosterPatch({
        listStatus: "profile_mapped",
        nextCoachAction: suggestedNextCoachAction("profile_mapped"),
      });
      void loadLive();
    } catch {
      setProfileSaveError("Network error saving mapped profile.");
    }
  }, [athleteId, autoProfile, baseAthlete, effectiveProfile, isLive, loadLive, profileOverrides]);

  const handleResetProfileToAuto = useCallback(() => {
    setProfileOverrides({});
  }, []);

  const handleGenerateProgrammeDraft = useCallback(async () => {
    if (!mergedAthlete || !effectiveProfile) return;

    const d = generateCoachDraftWeek(mergedAthlete);
    const banner = {
      bullets: [
        `Main limiter: ${effectiveProfile.mainLimiter}`,
        `Weekly training hours: ${effectiveProfile.weeklyTrainingHours} h`,
        `Station weaknesses: ${effectiveProfile.stationWeaknesses.filter((x) => x !== "none_significant").join(", ") || "—"}`,
        `Race timeline: ${effectiveProfile.raceTimelineWeeks} weeks (${effectiveProfile.raceTimelinePhase})`,
        `Recovery risk: ${effectiveProfile.recoveryRisk}`,
      ],
    };

    if (!isLive) {
      setInjectedDraft(d);
      setDraftInjectionKey((k) => k + 1);
      setProgrammeStatus("generated_draft");
      setAssessmentBanner(banner);
      setRosterPatch({
        listStatus: "draft_generated",
        nextCoachAction: suggestedNextCoachAction("draft_generated"),
      });
      setGenerateSuccess(true);
      window.setTimeout(() => setGenerateSuccess(false), 9000);
      setTab("Programme Builder");
      return;
    }

    const notes = coachNotes ?? {
      weeklyCoachNote: mergedAthlete.weeklyCoachNote,
      weekRationale: mergedAthlete.weekRationale,
      thingsToAvoid: mergedAthlete.thingsToAvoid,
      keyFocus: mergedAthlete.keyFocus,
      athleteFacingNote: mergedAthlete.athleteFacingNote,
    };

    try {
      const res = await fetch(`/api/hyrox/athletes/${athleteId}/programme-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effective_profile: effectiveProfile,
          generate_block: true,
          coach_note: notes.weeklyCoachNote,
          athlete_facing_note: notes.athleteFacingNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.draft?.id) {
        const detail =
          process.env.NODE_ENV === "development" && data.detail
            ? `${data.error}: ${data.detail}`
            : (data.error ?? "Could not generate draft.");
        setProfileSaveError(detail);
        return;
      }
      const draftId = data.draft.id as string;
      if (process.env.NODE_ENV === "development") {
        console.log("Live programme draft id", draftId, data.draft);
      }
      setLiveDraftId(draftId);
      setInjectedDraft((data.draftData as CoachDraftWeek) ?? d);
      setDraftInjectionKey((k) => k + 1);
      setProgrammeStatus("generated_draft");
      setAssessmentBanner(banner);
      setRosterPatch({
        listStatus: "draft_generated",
        nextCoachAction: suggestedNextCoachAction("draft_generated"),
      });
      setGenerateSuccess(true);
      window.setTimeout(() => setGenerateSuccess(false), 9000);
      setTab("Programme Builder");
      void loadLive();
    } catch {
      setProfileSaveError("Network error generating draft.");
    }
  }, [athleteId, coachNotes, effectiveProfile, isLive, loadLive, mergedAthlete]);

  const clearAssessmentBanner = useCallback(() => {
    setAssessmentBanner(null);
  }, []);

  const livePersistence: LiveProgrammePersistenceProps | undefined = isLive
    ? {
        athleteId,
        draftId: liveDraftId,
        effectiveProfile: effectiveProfile ?? undefined,
        mappedProfileSaved,
        programmeStartDate: livePayload?.athlete.programme_start_date ?? null,
        programmeLengthWeeks: livePayload?.athlete.programme_length_weeks ?? 12,
        blockPublished:
          livePayload?.athlete.status === "programme_published" ||
          programmeStatus === "published",
        onDraftIdChange: setLiveDraftId,
        onReload: loadLive,
        onPublished: () => {
          setPublishedFlash(true);
          setProgrammeStatus("published");
          setRosterPatch({
            listStatus: "approved",
            nextCoachAction: suggestedNextCoachAction("approved"),
          });
          window.setTimeout(() => setPublishedFlash(false), 8000);
        },
      }
    : undefined;

  if (liveLoading) {
    return (
      <CoachAdminShell title="Loading athlete…">
        <p className="text-zinc-500">Loading live athlete from Supabase…</p>
      </CoachAdminShell>
    );
  }

  if (!baseAthlete || !displayAthlete) {
    const isMockMissing = !isLive && !mockAthlete;
    return (
      <CoachAdminShell title="Athlete not found">
        <p className="text-zinc-400">
          {liveError ??
            (isMockMissing
              ? `No mock athlete found for id "${athleteId}".`
              : `No athlete found for id "${athleteId}".`)}
        </p>
        <Link href="/admin/hyrox-athletes" className="mt-4 inline-block text-yellow-400">
          ← Back to roster
        </Link>
      </CoachAdminShell>
    );
  }

  const awaitingSubmissions =
    isLive &&
    livePayload &&
    !livePayload.hasAssessment &&
    !livePayload.hasTesting &&
    !livePayload.hasRaceResult;

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
        <div className="flex flex-col items-end gap-1 text-xs text-zinc-500">
          {livePayload ? (
            <span className="text-emerald-400/90">
              Live · {livePayload.hasAssessment ? "Assessment ✓" : "No assessment"} ·{" "}
              {livePayload.hasTesting ? "Testing ✓" : "No testing"} ·{" "}
              {livePayload.hasRaceResult ? "RoxFit ✓" : "No race"}
              {mappedProfileSaved ? " · Profile saved ✓" : " · Profile not saved"}
              {liveDraftId ? ` · Draft ${status.replace(/_/g, " ")}` : ""}
            </span>
          ) : (
            <span>Mock coach athlete</span>
          )}
          {publishedFlash ? (
            <span className="font-semibold text-yellow-300">Programme published to athlete dashboard.</span>
          ) : null}
          <Link
            href="/admin/hyrox-programme-preview"
            className="font-semibold text-zinc-500 hover:text-yellow-300"
          >
            Programme logic preview →
          </Link>
        </div>
      }
    >
      {profileSaveError ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-400/10 px-4 py-2 text-sm text-red-200">
          {profileSaveError}
        </p>
      ) : null}
      {awaitingSubmissions ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Assessment and testing are not submitted yet. Profile review uses roster data until the
          athlete completes their assessment and baseline testing.
        </p>
      ) : null}
      {isLive && livePayload && !livePayload.hasAssessment && (livePayload.hasTesting || livePayload.hasRaceResult) ? (
        <p className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
          Testing data is on file; assessment not submitted yet. Mapped profile will improve once
          assessment is complete.
        </p>
      ) : null}
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
          draftExists: isLive ? Boolean(liveDraftId) : injectedDraft != null && draftInjectionKey > 0,
          mappedProfileSaved: isLive ? mappedProfileSaved : undefined,
          isLive,
        }}
        programmeWorkflowInject={{
          injectedDraft,
          draftInjectionKey,
          assessmentMappingBanner: assessmentBanner,
          onClearAssessmentMappingBanner: clearAssessmentBanner,
          livePersistence,
        }}
      />
    </CoachAdminShell>
  );
}
