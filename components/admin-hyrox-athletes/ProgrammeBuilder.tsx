"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAthleteWeekPreview } from "@/app/lib/buildAthleteWeekPreview";
import { generateWeeklyRationale } from "@/app/lib/generateWeeklyRationale";
import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import { BLOCK_WEEK_FOCUS_LABELS } from "@/app/lib/hyroxCoachProgrammeDraft";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachLibraryEntry } from "@/app/lib/hyroxCoachSessionLibrary";
import {
  applyEditConfigToSession,
  computeWeeklySummary,
  duplicateAsOptional,
  sessionFromLibrary,
  createBlankCoachDraftSession,
  validateCoachDraft,
  type CoachDraftSession,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
  type CoachSessionEditConfig,
  type WeekdayName,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import type { SandboxTimeOfDay } from "@/app/lib/hyroxProgrammeSandbox";
import { isHyroxSessionFamiliesEnabledClient } from "@/app/lib/hyroxSessionFamiliesFlag";
import {
  createCoachDraftSessionFromFamilyStage,
  applyEditConfigWithFamilyLink,
} from "@/app/lib/hyroxSessionFamilyDraft";
import { shouldRetainSessionFamilyLink } from "@/app/lib/hyroxSessionFamilyUnlink";
import { ProgrammeValidationPanel } from "@/components/admin-hyrox-athletes/ProgrammeValidationPanel";
import { ProgrammingAnchorsPanel } from "@/components/admin-hyrox-athletes/ProgrammingAnchorsPanel";
import { SessionEditDrawer } from "@/components/admin-hyrox-athletes/SessionEditDrawer";
import { SessionLibraryPanel } from "@/components/admin-hyrox-athletes/SessionLibraryPanel";
import {
  ScratchSessionBuilder,
  type ScratchSessionSavePayload,
} from "@/components/admin-hyrox-athletes/ScratchSessionBuilder";
import { WeeklyScheduleBuilder } from "@/components/admin-hyrox-athletes/WeeklyScheduleBuilder";
import { WeeklySummaryPanel } from "@/components/admin-hyrox-athletes/WeeklySummaryPanel";
import { AthleteWeekPreviewModal } from "@/components/admin-hyrox-athletes/AthleteWeekPreviewModal";
import { ProgrammeStatusBadge } from "@/components/admin-hyrox-athletes/StatusBadge";
import { WeeklyRationalePanel } from "@/components/admin-hyrox-athletes/WeeklyRationalePanel";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import type { LiveProgrammePersistenceProps } from "@/components/admin-hyrox-athletes/CoachAthleteDashboard";
import { CoachBlockSelector } from "@/components/admin-hyrox-athletes/CoachBlockSelector";
import { CoachBlockWeekTabs } from "@/components/admin-hyrox-athletes/CoachBlockWeekTabs";
import { CoachGenerationScopeControl } from "@/components/admin-hyrox-athletes/CoachGenerationScopeControl";
import { CoachNextBlockPrompt } from "@/components/admin-hyrox-athletes/CoachNextBlockPrompt";
import { CoachProgrammeStartDateControl } from "@/components/admin-hyrox-athletes/CoachProgrammeStartDateControl";
import { CopyWeekToModal } from "@/components/admin-hyrox-athletes/CopyWeekToModal";
import { CoachBlockReviewPanel } from "@/components/admin-hyrox-athletes/CoachBlockReviewPanel";
import { CoachPublishPanel } from "@/components/admin-hyrox-athletes/CoachPublishPanel";
import { CoachWeekSessionPreviewList } from "@/components/admin-hyrox-athletes/CoachWeekSessionPreviewList";
import { useCoachBlockProgramme } from "@/components/admin-hyrox-athletes/useCoachBlockProgramme";
import {
  CoachProgrammeDraftDebugPanel,
  findSessionByIndices,
  findSessionPreviewInDraft,
} from "@/components/admin-hyrox-athletes/CoachProgrammeDraftDebugPanel";
import { CoachPublishResultPanel } from "@/components/admin-hyrox-athletes/CoachPublishResultPanel";
import {
  ProgressionAssignmentModal,
  type ProgressionAssignmentApplyPayload,
  type ProgressionAssignmentSeed,
} from "@/components/admin-hyrox-athletes/ProgressionAssignmentModal";
import { ChangeStageModal } from "@/components/admin-hyrox-athletes/ChangeStageModal";
import {
  insertSessionOnWeekday,
  refreshFamilyLinkedDraftWeekPreviews,
  targetGlobalWeeksForProgression,
} from "@/app/lib/hyroxSessionFamilyApply";
import { coachFamilySessionTitle } from "@/app/lib/hyroxSessionFamilyAthleteCopy";
import { resolveLibrarySessionFamilyLink } from "@/app/lib/hyroxSessionFamilyLibraryBridge";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  buildPerformanceTestingWeek1Draft,
  draftHasSessions,
  draftLooksLikePerformanceTestingWeek,
  hydrateMissingPerformanceTestingDetails,
  PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME,
} from "@/app/lib/hyroxPerformanceTestingWeekTemplate";
import {
  sessionPrescriptionPreview,
} from "@/app/lib/hyroxCoachProgrammeDraft";

type MoveState = {
  dayIndex: number;
  sessionIndex: number;
  targetDay: WeekdayName;
  targetSlot: SandboxTimeOfDay;
} | null;

export function ProgrammeBuilder({
  athlete,
  programmeStatus,
  onStatusChange,
  coachNotes,
  onCoachNotesChange,
  injectedDraft = null,
  draftInjectionKey = 0,
  assessmentMappingBanner = null,
  onClearAssessmentMappingBanner,
  livePersistence,
  effectiveProfile = null,
  sessionFamiliesEnabled: sessionFamiliesEnabledProp = false,
  weekComposerEnabled = false,
  onOpenPerformanceProfile,
  onOpenWeekComposer,
}: {
  athlete: CoachAthlete;
  programmeStatus: CoachProgrammeStatus;
  onStatusChange: (s: CoachProgrammeStatus) => void;
  coachNotes: {
    weeklyCoachNote: string;
    weekRationale: string;
    keyFocus: string;
    thingsToAvoid: string;
    athleteFacingNote: string;
  };
  onCoachNotesChange: (patch: Partial<typeof coachNotes>) => void;
  injectedDraft?: CoachDraftWeek | null;
  draftInjectionKey?: number;
  assessmentMappingBanner?: { bullets: string[] } | null;
  onClearAssessmentMappingBanner?: () => void;
  livePersistence?: LiveProgrammePersistenceProps;
  effectiveProfile?: HyroxAthleteProfile | null;
  sessionFamiliesEnabled?: boolean;
  weekComposerEnabled?: boolean;
  /** Jump to Performance Profile tab to confirm / set programming anchors */
  onOpenPerformanceProfile?: () => void;
  /** Jump to Week Composer tab */
  onOpenWeekComposer?: () => void;
}) {
  const block = useCoachBlockProgramme({
    athlete,
    livePersistence,
    coachNotes: {
      weeklyCoachNote: coachNotes.weeklyCoachNote,
      athleteFacingNote: coachNotes.athleteFacingNote,
    },
    initialDraft: injectedDraft,
    programmeStatus,
    onStatusChange,
  });

  const {
    generationScope,
    setGenerationScope,
    selectedCycle,
    selectCycle,
    effectiveBlockWeeks,
    draft,
    setDraft,
    status,
    saving,
    loadingBlock,
    blockLoadError,
    toast,
    generate,
    approveSelectedWeek,
    approveFullBlock,
    publish,
    publishReadiness,
    savingDraft,
    saveFeedback,
    saveDraft,
    persistDraft,
    applyDraftMutation,
    unsavedChanges,
    draftDirty,
    lastSavedAt,
    dbDraftSnapshot,
    publishResult,
    draftDebug,
    isLive,
    programmeStartDate,
    saveProgrammeStartDate,
    programmeLengthWeeks,
    blockWeekDateRanges,
    showToast,
    showNextBlockPrompt,
    generateNextBlock,
    copyWeekTo,
    selectedBlock,
    selectBlock,
    blockSummaries,
    selectedBlockSummary,
    carryForwardEnabled,
    setCarryForwardEnabled,
    carryForwardNotice,
  } = block;

  const [addTarget, setAddTarget] = useState<{ day: WeekdayName; slot: SandboxTimeOfDay } | null>({
    day: "Mon",
    slot: "Main",
  });
  const [editTarget, setEditTarget] = useState<{
    dayIndex: number;
    sessionIndex: number;
  } | null>(null);
  const [moveState, setMoveState] = useState<MoveState>(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    dayIndex: number;
    sessionIndex: number;
  } | null>(null);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rationaleAutoFilled, setRationaleAutoFilled] = useState(false);
  const rationaleTouched = useRef(false);
  const [perfWeekConfirmOpen, setPerfWeekConfirmOpen] = useState(false);
  const [hydrateDetailsConfirmOpen, setHydrateDetailsConfirmOpen] = useState(false);
  const [copyWeekOpen, setCopyWeekOpen] = useState(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [progressionSeed, setProgressionSeed] = useState<ProgressionAssignmentSeed | null>(
    null
  );
  const [perfProfile, setPerfProfile] = useState<HyroxAthletePerformanceProfile | null>(null);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{
    dayIndex: number;
    sessionIndex: number;
    config: CoachSessionEditConfig;
    reason: string;
  } | null>(null);
  const [changeStageTarget, setChangeStageTarget] = useState<{
    dayIndex: number;
    sessionIndex: number;
  } | null>(null);
  const familyPreviewRefreshedFor = useRef<string | null>(null);
  const sessionFamiliesEnabled = isHyroxSessionFamiliesEnabledClient(
    sessionFamiliesEnabledProp
  );
  const weekIsPublished = Boolean(
    selectedBlockSummary?.status === "published" ||
      effectiveBlockWeeks.find((w) => w.cycle === selectedCycle)?.published
  );
  const showPerfDetailActions = draftLooksLikePerformanceTestingWeek(draft);

  const summary = useMemo(() => computeWeeklySummary(draft, athlete), [draft, athlete]);
  const validation = useMemo(() => validateCoachDraft(draft, athlete), [draft, athlete]);

  const applyAutoRationale = useCallback(() => {
    const text = generateWeeklyRationale(athlete, draft);
    onCoachNotesChange({ weekRationale: text });
    setRationaleAutoFilled(true);
    block.showToast("Weekly note auto-filled from programme");
  }, [athlete, block, draft, onCoachNotesChange]);

  useEffect(() => {
    if (rationaleTouched.current || coachNotes.weekRationale.trim()) return;
    onCoachNotesChange({ weekRationale: generateWeeklyRationale(athlete, draft) });
    setRationaleAutoFilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial auto-fill per draft generation
  }, [athlete.id, draft.block, draft.week, draft.generatedAt]);

  const athletePreview = useMemo(
    () => buildAthleteWeekPreview(athlete, draft, coachNotes),
    [athlete, draft, coachNotes]
  );

  const updateDayLocal = useCallback(
    (dayIndex: number, updater: (sessions: CoachDraftSession[]) => CoachDraftSession[]) => {
      setDraft((prev) => ({
        ...prev,
        days: prev.days.map((d, i) =>
          i === dayIndex ? { ...d, sessions: updater(d.sessions) } : d
        ),
      }));
    },
    [setDraft]
  );

  const mutateDaySessions = useCallback(
    (
      dayIndex: number,
      updater: (sessions: CoachDraftSession[]) => CoachDraftSession[],
      successMessage: string
    ) => {
      void applyDraftMutation(
        (prev) => ({
          ...prev,
          days: prev.days.map((d, i) =>
            i === dayIndex ? { ...d, sessions: updater(d.sessions) } : d
          ),
        }),
        { successMessage }
      );
    },
    [applyDraftMutation]
  );

  const mutateDraft = useCallback(
    (updater: (prev: CoachDraftWeek) => CoachDraftWeek, successMessage: string) => {
      void applyDraftMutation(updater, { successMessage });
    },
    [applyDraftMutation]
  );

  const handleAdd = (entry: CoachLibraryEntry) => {
    if (!addTarget) return;
    const session = sessionFromLibrary(athlete, entry.id, addTarget.slot);
    if (!session) return;
    const dayIndex = draft.days.findIndex((d) => d.day === addTarget.day);
    if (dayIndex < 0) return;
    mutateDaySessions(dayIndex, (s) => [...s, session], `Added ${entry.name} to ${addTarget.day} ${addTarget.slot}`);
  };

  const handleLibraryAddForReplace = (entry: CoachLibraryEntry) => {
    if (!replaceTarget) return;
    const session = sessionFromLibrary(athlete, entry.id, "Main");
    if (!session) return;
    mutateDaySessions(
      replaceTarget.dayIndex,
      (sessions) =>
        sessions.map((s, i) => (i === replaceTarget.sessionIndex ? session : s)),
      `Replaced with ${entry.name}`
    );
    setReplaceTarget(null);
  };

  const handleScratchSave = (payload: ScratchSessionSavePayload) => {
    const slot = replaceTarget
      ? draft.days[replaceTarget.dayIndex]?.sessions[replaceTarget.sessionIndex]?.timeOfDay ?? "Main"
      : addTarget?.slot ?? "Main";
    const session = createBlankCoachDraftSession({
      timeOfDay: slot,
      libraryCategory: payload.libraryCategory,
      sessionName: payload.sessionName,
      objective: payload.objective,
      duration: payload.duration,
      rpeTarget: payload.rpeTarget,
      hrZone: payload.hrZone,
      coachNote: payload.coachNote,
      warmUpLines: payload.warmUpLines,
      coolDownLines: payload.coolDownLines,
      customParts: payload.customParts,
    });
    if (replaceTarget) {
      mutateDaySessions(
        replaceTarget.dayIndex,
        (sessions) =>
          sessions.map((s, i) => (i === replaceTarget.sessionIndex ? session : s)),
        `Replaced with ${session.title}`
      );
      setReplaceTarget(null);
    } else {
      if (!addTarget) return;
      const dayIndex = draft.days.findIndex((d) => d.day === addTarget.day);
      if (dayIndex < 0) return;
      mutateDaySessions(
        dayIndex,
        (s) => [...s, session],
        `Added ${session.title} to ${addTarget.day} ${addTarget.slot}`
      );
    }
    setScratchOpen(false);
  };

  const editSession = editTarget
    ? draft.days[editTarget.dayIndex]?.sessions[editTarget.sessionIndex]
    : null;

  useEffect(() => {
    if (!athlete.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/hyrox/athletes/${athlete.id}/benchmarks`);
        const data = (await res.json()) as {
          success?: boolean;
          profile?: HyroxAthletePerformanceProfile;
        };
        if (!cancelled && data.success && data.profile) {
          setPerfProfile(data.profile);
        }
      } catch {
        if (!cancelled) setPerfProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [athlete.id, progressionOpen]);

  // When a draft with family sessions is opened, refresh live prescription previews
  // from the current Performance Profile (never reuse published snapshots as draft targets).
  useEffect(() => {
    if (!sessionFamiliesEnabled || !perfProfile) return;
    const hasFamily = draft.days.some((d) => d.sessions.some((s) => s.sessionFamily));
    if (!hasFamily) return;
    const key = `${draft.week}:${draft.generatedAt}:${perfProfile.threshold?.paceSecondsPerKm ?? "x"}`;
    if (familyPreviewRefreshedFor.current === key) return;
    familyPreviewRefreshedFor.current = key;
    const refreshed = refreshFamilyLinkedDraftWeekPreviews(
      draft,
      perfProfile,
      new Date().toISOString()
    );
    setDraft(refreshed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh once per draft/profile fingerprint
  }, [sessionFamiliesEnabled, perfProfile, draft.week, draft.generatedAt, setDraft]);

  const openProgressionAssign = useCallback((seed?: ProgressionAssignmentSeed | null) => {
    setProgressionSeed(seed ?? null);
    setProgressionOpen(true);
  }, []);

  const handleLibraryBuildProgression = useCallback(
    (entry: CoachLibraryEntry) => {
      const link = resolveLibrarySessionFamilyLink(entry);
      if (!link) {
        showToast("This library session is not mapped to a Session Family stage.");
        return;
      }
      if (!addTarget) {
        showToast("Select a day/slot first, then Build progression.");
        return;
      }
      openProgressionAssign({
        familyId: link.family.id,
        entryStageId: link.stage.id,
        day: addTarget.day,
        slot: addTarget.slot,
        mode: "assign",
      });
    },
    [addTarget, openProgressionAssign, showToast]
  );

  const handlePlacedBuildProgression = useCallback(
    (dayIndex: number, sessionIndex: number) => {
      const session = draft.days[dayIndex]?.sessions[sessionIndex];
      const att = session?.sessionFamily;
      if (!session || !att) return;
      openProgressionAssign({
        familyId: att.familyId,
        entryStageId: att.stageId,
        day: draft.days[dayIndex]!.day as WeekdayName,
        slot: session.timeOfDay,
        mode: "continue",
      });
    },
    [draft.days, openProgressionAssign]
  );

  const handleProgressionApply = useCallback(
    async (payload: ProgressionAssignmentApplyPayload) => {
      const profile = perfProfile;
      if (!profile) {
        showToast("Performance Profile unavailable — cannot resolve progression targets.");
        return;
      }

      // continue: proposals are future-only → start at next programme week
      const startGlobalWeek =
        payload.mode === "continue"
          ? globalWeekForBlock(selectedBlock, selectedCycle) + 1
          : globalWeekForBlock(selectedBlock, selectedCycle);
      const globalWeeks = targetGlobalWeeksForProgression({
        startGlobalWeek,
        blockLength: payload.proposals.length,
      });

      type EnsuredWeek = {
        globalWeek: number;
        draftId: string;
        created: boolean;
        block: number;
        draftData?: CoachDraftWeek;
      };
      let ensuredWeeks: EnsuredWeek[] = [];

      // Ensure future (and cross-block) draft shells exist without mutating current_week.
      if (isLive && livePersistence?.athleteId && livePersistence.effectiveProfile) {
        try {
          const ensureRes = await fetch(
            `/api/hyrox/athletes/${livePersistence.athleteId}/programme-drafts/ensure-weeks`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                global_weeks: globalWeeks,
                effective_profile: livePersistence.effectiveProfile,
                coach_note: coachNotes.weeklyCoachNote,
                athlete_facing_note: coachNotes.athleteFacingNote,
              }),
            }
          );
          const ensureData = (await ensureRes.json()) as {
            success?: boolean;
            error?: string;
            weeks?: EnsuredWeek[];
          };
          if (!ensureRes.ok || !ensureData.success || !ensureData.weeks) {
            showToast(ensureData.error ?? "Could not ensure future draft weeks.");
            return;
          }
          ensuredWeeks = ensureData.weeks;
        } catch {
          showToast("Network error ensuring progression draft weeks.");
          return;
        }
      }

      let applied = 0;
      let skipped = 0;

      for (let i = 0; i < payload.proposals.length; i++) {
        const proposal = payload.proposals[i];
        const globalWeek = globalWeeks[i];

        const session = createCoachDraftSessionFromFamilyStage({
          family: payload.family,
          stageId: proposal.stageId,
          profile,
          resolvedAt: payload.resolvedAt,
          draftId: `fam-${payload.family.id}-${proposal.stageId}-${crypto.randomUUID()}`,
          base: {
            timeOfDay: payload.slot,
            badges: ["Main"],
            title: coachFamilySessionTitle(payload.family.name),
            sessionType: "run_development",
            duration: "60 min",
            intensity: "RPE 7–8",
            rpeHr: "RPE 7–8",
            isKeySession: true,
            isOptional: false,
            rationale: payload.family.objective,
            sessionId: `session-family:${payload.family.id}`,
            prescription: null,
            sessionDetail: null,
          },
          overrides:
            payload.overridePaceSecondsPerKm != null
              ? [
                  {
                    slot: "run",
                    value: payload.overridePaceSecondsPerKm,
                    unit: "s/km",
                  },
                ]
              : undefined,
        });

        if (payload.overrideReason.trim()) {
          session.coachNote = [session.coachNote, `Override: ${payload.overrideReason.trim()}`]
            .filter(Boolean)
            .join(" · ");
        }

        if (globalWeek === draft.week) {
          await applyDraftMutation(
            (prev) => insertSessionOnWeekday(prev, session, payload.day, payload.slot),
            {
              successMessage: `Added ${session.title} to ${payload.day} ${payload.slot}`,
            }
          );
          applied += 1;
          continue;
        }

        if (!isLive) {
          skipped += 1;
          continue;
        }

        const ensured = ensuredWeeks.find((w) => w.globalWeek === globalWeek);
        if (!ensured?.draftId) {
          skipped += 1;
          continue;
        }

        // Prefer ensure payload; re-fetch if missing so we never invent a second week shell.
        try {
          let existing = ensured.draftData ?? null;
          if (!existing) {
            const getRes = await fetch(`/api/hyrox/programme-drafts/${ensured.draftId}`);
            const getData = (await getRes.json()) as {
              success?: boolean;
              draftData?: CoachDraftWeek;
            };
            existing = getData.draftData ?? null;
          }
          if (!existing) {
            skipped += 1;
            continue;
          }
          const nextWeek = insertSessionOnWeekday(existing, session, payload.day, payload.slot);
          const res = await fetch(`/api/hyrox/programme-drafts/${ensured.draftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              draft: nextWeek,
              coach_note: coachNotes.weeklyCoachNote,
              athlete_facing_note: coachNotes.athleteFacingNote,
              effective_profile: livePersistence?.effectiveProfile,
            }),
          });
          if (res.ok) applied += 1;
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }

      setProgressionOpen(false);
      setProgressionSeed(null);
      showToast(
        skipped > 0
          ? `Progression applied to ${applied} week(s). ${skipped} week(s) skipped.`
          : payload.mode === "continue"
            ? `Future progression applied to ${applied} week(s) (current week unchanged · drafts only).`
            : `Progression applied to ${applied} week(s) (drafts only — not published).`
      );
    },
    [
      applyDraftMutation,
      coachNotes.athleteFacingNote,
      coachNotes.weeklyCoachNote,
      draft.week,
      isLive,
      livePersistence?.athleteId,
      livePersistence?.effectiveProfile,
      perfProfile,
      selectedBlock,
      selectedCycle,
      showToast,
    ]
  );

  const commitSessionEdit = useCallback(
    async (dayIndex: number, sessionIndex: number, config: CoachSessionEditConfig) => {
      setEditTarget(null);
      setUnlinkConfirm(null);
      const result = await applyDraftMutation(
        (prev) => ({
          ...prev,
          days: prev.days.map((d, di) =>
            di === dayIndex
              ? {
                  ...d,
                  sessions: d.sessions.map((s, i) => {
                    if (i !== sessionIndex) return s;
                    if (s.sessionFamily) {
                      return applyEditConfigWithFamilyLink(s, config);
                    }
                    return applyEditConfigToSession({ ...s, editConfig: config });
                  }),
                }
              : d
          ),
        }),
        {
          successMessage: isLive
            ? "Session applied and saved to draft."
            : "Session updated (local preview)",
        }
      );
      if (!result.ok && isLive) {
        showToast(`Session edit failed: ${result.error ?? "unknown error"}`);
      }
    },
    [applyDraftMutation, isLive, showToast]
  );

  const selectedForDebug = findSessionByIndices(
    draft,
    editTarget?.dayIndex ?? null,
    editTarget?.sessionIndex ?? null
  );
  const dbSelectedForDebug =
    editSession?.draftId && dbDraftSnapshot
      ? findSessionPreviewInDraft(dbDraftSnapshot, editSession.draftId)
      : "—";

  const draftDebugState = {
    ...draftDebug,
    localSelectedPreview: selectedForDebug
      ? sessionPrescriptionPreview(selectedForDebug)
      : "—",
    dbSelectedPreview: dbSelectedForDebug,
  };

  const weekRole = BLOCK_WEEK_FOCUS_LABELS[selectedCycle];

  const applyPerformanceTestingWeek = useCallback(() => {
    const nextDraft = buildPerformanceTestingWeek1Draft({
      ...athlete,
      blockWeek: selectedCycle,
    });
    void applyDraftMutation(
      (prev) => ({
        ...nextDraft,
        athleteId: prev.athleteId,
        block: prev.block,
        week: prev.week,
      }),
      { successMessage: `${PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME} inserted.` }
    );
    onCoachNotesChange({
      weeklyCoachNote: PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME,
      weekRationale: "Structured Hybrid365 performance testing week — review scaling before publish.",
      keyFocus: "Baseline testing across run, engine, strength and continuous HYROX simulation.",
    });
    setPerfWeekConfirmOpen(false);
  }, [applyDraftMutation, athlete, onCoachNotesChange, selectedCycle]);

  const handleAddPerformanceTestingWeek = useCallback(() => {
    if (draftHasSessions(draft)) {
      setPerfWeekConfirmOpen(true);
      return;
    }
    applyPerformanceTestingWeek();
  }, [applyPerformanceTestingWeek, draft]);

  const applyMissingPerformanceTestingDetails = useCallback(async () => {
    const { draft: nextDraft, hydratedCount, skippedLegacy } =
      hydrateMissingPerformanceTestingDetails(draft);
    setHydrateDetailsConfirmOpen(false);

    if (skippedLegacy) {
      showToast("Legacy Version 1 testing week left unchanged.");
      return;
    }

    if (hydratedCount === 0) {
      showToast("All Performance Testing sessions already have full details.");
      return;
    }

    const result = await applyDraftMutation(() => nextDraft, {
      successMessage: weekIsPublished
        ? `Filled missing details on ${hydratedCount} session(s). Republishing to athlete…`
        : `Filled missing details on ${hydratedCount} session(s).`,
    });

    if (!result.ok) {
      showToast(`Could not save hydrated details: ${result.error ?? "unknown error"}`);
      return;
    }

    if (weekIsPublished && isLive) {
      await publish();
    }
  }, [applyDraftMutation, draft, isLive, publish, showToast, weekIsPublished]);

  return (
    <div className="space-y-4">
      {assessmentMappingBanner ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-400/5 px-4 py-3 text-sm">
          <p className="font-bold text-cyan-100">Draft source: Assessment mapping</p>
          <p className="mt-1 text-xs text-zinc-400">
            Status: Needs coach review — athlete dashboard unchanged until you publish.
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-300">
            {assessmentMappingBanner.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {isLive ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-400/5 px-4 py-3 text-sm">
          <p className="font-bold text-emerald-200">Live draft from Supabase</p>
          <p className="mt-1 text-xs text-zinc-400">
            Publish uses your generation scope. Default publishes the full 4-week block to the
            athlete.
          </p>
        </div>
      ) : null}

      <CoachGenerationScopeControl value={generationScope} onChange={setGenerationScope} />

      {isLive ? (
        <CoachBlockSelector
          blocks={blockSummaries}
          selectedBlock={selectedBlock}
          programmeLengthWeeks={programmeLengthWeeks}
          onSelectBlock={(b) => void selectBlock(b)}
          onGenerateNextBlock={(reviewed) => void generateNextBlock(reviewed)}
          generating={saving}
        />
      ) : null}

      <CoachProgrammeStartDateControl
        value={programmeStartDate}
        blockNumber={selectedBlock}
        saving={saving}
        savedStartDate={livePersistence?.programmeStartDate}
        onChange={(ymd) => void saveProgrammeStartDate(ymd)}
      />

      {isLive && livePersistence?.athleteId ? (
        <CoachBlockReviewPanel
          athleteId={livePersistence.athleteId}
          programmeLengthWeeks={programmeLengthWeeks}
          currentProgrammeBlock={selectedBlock}
          effectiveProfile={effectiveProfile}
          onBlockGenerated={(nextBlock) => void selectBlock(nextBlock)}
        />
      ) : null}

      {showNextBlockPrompt && !isLive ? (
        <CoachNextBlockPrompt
          currentBlock={athlete.programmeBlock}
          programmeLengthWeeks={programmeLengthWeeks}
          generating={saving}
          onGenerateNextBlock={() => void generateNextBlock(athlete.programmeBlock)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">
            Block {selectedBlock} · Week {draft.week} (W{selectedCycle} · {weekRole})
          </p>
          {selectedBlockSummary?.status === "published" ? (
            <p className="text-[11px] text-emerald-400/90">Block {selectedBlock} published to athlete.</p>
          ) : selectedBlockSummary?.status === "ready_to_publish" ? (
            <p className="text-[11px] text-yellow-300/90">
              Block {selectedBlock} approved and ready to publish.
            </p>
          ) : selectedBlockSummary?.status === "draft_available" ||
            selectedBlockSummary?.status === "needs_approval" ? (
            <p className="text-[11px] text-sky-300/90">
              Block {selectedBlock} draft generated. Review and edit before approving.
            </p>
          ) : null}
          <p className="text-[11px] text-zinc-600">
            Generated {new Date(draft.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProgrammeStatusBadge status={status} />
          <button
            type="button"
            disabled={saving}
            onClick={handleAddPerformanceTestingWeek}
            className="rounded-full border border-cyan-500/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-100 disabled:opacity-50"
          >
            Add Performance Testing Week
          </button>
          {showPerfDetailActions ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (weekIsPublished) {
                  setHydrateDetailsConfirmOpen(true);
                  return;
                }
                void applyMissingPerformanceTestingDetails();
              }}
              className="rounded-full border border-amber-500/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 disabled:opacity-50"
            >
              {weekIsPublished
                ? "Apply missing Performance Testing details"
                : "Refresh Performance Testing details"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void generate()}
            className="rounded-full border border-yellow-500/40 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-200 disabled:opacity-50"
          >
            {saving
              ? "Generating…"
              : generationScope === "block_4"
                ? "Generate 4-week block"
                : "Generate selected week"}
          </button>
          {isLive ? (
            <button
              type="button"
              disabled={saving || !draft.days.some((d) => d.sessions.length > 0)}
              onClick={() => setCopyWeekOpen(true)}
              className="rounded-full border border-zinc-500 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-100 disabled:opacity-50"
            >
              Copy week to…
            </button>
          ) : null}
          {sessionFamiliesEnabled ? (
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                openProgressionAssign({
                  familyId: "",
                  entryStageId: "",
                  day: addTarget?.day ?? "Wed",
                  slot: addTarget?.slot ?? "AM",
                  mode: "assign",
                })
              }
              className="rounded-full border border-violet-500/40 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-100 disabled:opacity-50"
              title="Global entry — prefer Build progression from an eligible library card"
            >
              Add progression
            </button>
          ) : null}
          {weekComposerEnabled && onOpenWeekComposer ? (
            <button
              type="button"
              onClick={onOpenWeekComposer}
              className="rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-200"
            >
              Open Composer
            </button>
          ) : null}
        </div>
      </div>

      {isLive ? (
        <label className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-xs text-zinc-300">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={carryForwardEnabled}
            onChange={(e) => setCarryForwardEnabled(e.target.checked)}
          />
          <span>
            <span className="font-semibold text-zinc-100">Start next week from previous programming</span>
            <span className="mt-0.5 block text-[11px] text-zinc-500">
              When you open the next consecutive week and it is empty, copy this week&apos;s sessions
              as an unpublished draft. Jumps and existing weeks are left untouched.
            </span>
          </span>
        </label>
      ) : null}

      {carryForwardNotice ? (
        <div
          className={`rounded-xl border px-3 py-2.5 text-sm ${
            carryForwardNotice.tone === "copied"
              ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-100"
              : carryForwardNotice.tone === "preserved"
                ? "border-sky-500/40 bg-sky-950/30 text-sky-100"
                : "border-zinc-700 bg-zinc-950/80 text-zinc-200"
          }`}
        >
          <p className="font-bold tracking-wide">{carryForwardNotice.title}</p>
          {carryForwardNotice.detail ? (
            <p className="mt-1 text-xs opacity-90">{carryForwardNotice.detail}</p>
          ) : null}
        </div>
      ) : null}

      <CoachBlockWeekTabs
        weeks={effectiveBlockWeeks}
        selectedCycle={selectedCycle}
        onSelect={selectCycle}
        loading={loadingBlock}
        dateRanges={blockWeekDateRanges}
      />

      {blockLoadError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {blockLoadError}
        </p>
      ) : null}

      <CoachWeekSessionPreviewList
        draft={draft}
        weekLabel={`W${selectedCycle}`}
        role={weekRole}
      />

      {toast ? (
        <p className="rounded-lg border border-yellow-500/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          {toast}
        </p>
      ) : null}

      <div className="grid min-h-[640px] grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_300px]">
        <SessionLibraryPanel
          addTarget={replaceTarget ? null : addTarget}
          onAdd={replaceTarget ? handleLibraryAddForReplace : handleAdd}
          onBuildProgression={
            sessionFamiliesEnabled && !replaceTarget
              ? handleLibraryBuildProgression
              : undefined
          }
          onBuildFromScratch={() => setScratchOpen(true)}
          replaceMode={Boolean(replaceTarget)}
          equipmentAvailable={athlete.programmeInputs.equipment}
          athlete={athlete}
          sessionFamiliesEnabled={sessionFamiliesEnabled}
        />
        <WeeklyScheduleBuilder
          days={draft.days}
          addTarget={addTarget}
          onSelectAddTarget={(day, slot) => setAddTarget({ day, slot })}
          onEdit={(di, si) => setEditTarget({ dayIndex: di, sessionIndex: si })}
          onMove={(di, si) =>
            setMoveState({
              dayIndex: di,
              sessionIndex: si,
              targetDay: draft.days[di]?.day as WeekdayName,
              targetSlot: draft.days[di]?.sessions[si]?.timeOfDay ?? "Main",
            })
          }
          onReplace={(di, si) => setReplaceTarget({ dayIndex: di, sessionIndex: si })}
          onRemove={(di, si) => {
            mutateDaySessions(di, (s) => s.filter((_, i) => i !== si), "Session removed.");
          }}
          onDuplicate={(di, si) => {
            const src = draft.days[di]?.sessions[si];
            if (!src) return;
            mutateDaySessions(
              di,
              (s) => [...s, duplicateAsOptional(src)],
              "Duplicated as optional add-on."
            );
          }}
          onViewDetail={(di, si) => {
            updateDayLocal(di, (s) =>
              s.map((sess, i) =>
                i === si ? { ...sess, showDetail: !sess.showDetail } : sess
              )
            );
          }}
          onChangeStage={
            sessionFamiliesEnabled
              ? (di, si) => setChangeStageTarget({ dayIndex: di, sessionIndex: si })
              : undefined
          }
          onBuildProgression={
            sessionFamiliesEnabled ? handlePlacedBuildProgression : undefined
          }
        />
        <aside className="flex flex-col gap-4 overflow-y-auto">
          <ProgrammingAnchorsPanel
            profile={perfProfile}
            variant="compact"
            onOpenProfile={onOpenPerformanceProfile}
          />
          <WeeklySummaryPanel summary={summary} />
          <ProgrammeValidationPanel
            warnings={validation.warnings}
            positives={validation.positives}
          />
          <WeeklyRationalePanel
            value={coachNotes.weekRationale}
            onChange={(v) => {
              rationaleTouched.current = true;
              onCoachNotesChange({ weekRationale: v });
            }}
            onRegenerate={applyAutoRationale}
            autoFilled={rationaleAutoFilled}
          />
          <CoachPublishPanel
            status={status}
            isLive={isLive}
            saving={saving}
            generationScope={generationScope}
            publishReadiness={publishReadiness}
            savingDraft={savingDraft}
            saveFeedback={saveFeedback}
            unsavedChanges={unsavedChanges}
            lastSavedAt={lastSavedAt}
            approveDisabled={isLive && !block.activeDraftId}
            onPreview={() => setPreviewOpen(true)}
            onSaveDraft={() => void saveDraft()}
            onApproveWeek={() => void approveSelectedWeek()}
            onApproveBlock={() => void approveFullBlock()}
            onPublish={() => void publish()}
          />
          {isLive ? (
            <CoachProgrammeDraftDebugPanel
              debug={draftDebugState}
              selectedSessionTitle={editSession?.title ?? null}
            />
          ) : null}
          {isLive ? (
            <CoachPublishResultPanel
              result={publishResult}
              athleteId={livePersistence?.athleteId}
              hasPublishedBlock={
                status === "published" || effectiveBlockWeeks.some((w) => w.published)
              }
            />
          ) : null}
          <CoachNotesPanel notes={coachNotes} onChange={onCoachNotesChange} />
        </aside>
      </div>

      <SessionEditDrawer
        session={editSession ?? null}
        open={editTarget != null}
        profile={perfProfile}
        onOpenPerformanceProfile={onOpenPerformanceProfile}
        onClose={() => setEditTarget(null)}
        onSave={async (config: CoachSessionEditConfig) => {
          if (!editTarget) return;
          const { dayIndex, sessionIndex } = editTarget;
          const current = draft.days[dayIndex]?.sessions[sessionIndex];
          if (current?.sessionFamily) {
            const decision = shouldRetainSessionFamilyLink({
              attachment: current.sessionFamily,
              nextEditConfig: config,
            });
            if (!decision.retain) {
              setUnlinkConfirm({
                dayIndex,
                sessionIndex,
                config,
                reason: decision.reason,
              });
              return;
            }
          }
          await commitSessionEdit(dayIndex, sessionIndex, config);
        }}
      />

      {sessionFamiliesEnabled ? (
        <ProgressionAssignmentModal
          open={progressionOpen}
          onClose={() => {
            setProgressionOpen(false);
            setProgressionSeed(null);
          }}
          onApply={handleProgressionApply}
          profile={perfProfile}
          defaultDay={addTarget?.day ?? "Wed"}
          defaultSlot={addTarget?.slot ?? "AM"}
          seed={
            progressionSeed?.familyId
              ? progressionSeed
              : {
                  familyId: "",
                  entryStageId: "",
                  day: addTarget?.day ?? "Wed",
                  slot: addTarget?.slot ?? "AM",
                  mode: "assign",
                }
          }
        />
      ) : null}

      {sessionFamiliesEnabled ? (
        <ChangeStageModal
          open={changeStageTarget != null}
          session={
            changeStageTarget
              ? draft.days[changeStageTarget.dayIndex]?.sessions[
                  changeStageTarget.sessionIndex
                ] ?? null
              : null
          }
          profile={perfProfile}
          onClose={() => setChangeStageTarget(null)}
          onConfirm={async (next) => {
            if (!changeStageTarget) return;
            const { dayIndex, sessionIndex } = changeStageTarget;
            setChangeStageTarget(null);
            // Updates FUTURE DRAFT only via applyDraftMutation. If the week was already
            // published, existing athlete sessions stay immutable until an explicit republish.
            await applyDraftMutation(
              (prev) => ({
                ...prev,
                days: prev.days.map((d, di) =>
                  di === dayIndex
                    ? {
                        ...d,
                        sessions: d.sessions.map((s, i) =>
                          i === sessionIndex ? next : s
                        ),
                      }
                    : d
                ),
              }),
              {
                successMessage: weekIsPublished
                  ? `Stage updated in draft to ${next.sessionFamily?.stageLabel ?? "new stage"} (athlete week unchanged until republish).`
                  : `Stage updated to ${next.sessionFamily?.stageLabel ?? "new stage"}`,
              }
            );
          }}
        />
      ) : null}

      {unlinkConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h3 className="font-bold text-white">Structural edit</h3>
            <p className="mt-2 text-sm text-zinc-300">
              This edit changes the canonical progression stage.
            </p>
            <p className="mt-2 text-xs text-zinc-500">{unlinkConfirm.reason}</p>
            <p className="mt-2 text-xs text-orange-200">
              Continue to unlink this session from the Session Family, or cancel to keep the link.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300"
                onClick={() => setUnlinkConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded border border-orange-500/50 bg-orange-400/15 px-3 py-1.5 text-xs font-bold text-orange-100"
                onClick={() =>
                  void commitSessionEdit(
                    unlinkConfirm.dayIndex,
                    unlinkConfirm.sessionIndex,
                    unlinkConfirm.config
                  )
                }
              >
                Continue and unlink
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moveState ? (
        <MoveModal
          initialDay={moveState.targetDay}
          initialSlot={moveState.targetSlot}
          onClose={() => setMoveState(null)}
          onConfirm={(targetDay, targetSlot) => {
            const moving = draft.days[moveState.dayIndex]?.sessions[moveState.sessionIndex];
            if (!moving) return;
            const destIdx = draft.days.findIndex((d) => d.day === targetDay);
            if (destIdx < 0) return;
            const fromIdx = moveState.dayIndex;
            const fromSi = moveState.sessionIndex;
            mutateDraft(
              (prev) => ({
                ...prev,
                days: prev.days.map((d, i) => {
                  if (i === fromIdx) {
                    return {
                      ...d,
                      sessions: d.sessions.filter((_, si) => si !== fromSi),
                    };
                  }
                  if (i === destIdx) {
                    return {
                      ...d,
                      sessions: [...d.sessions, { ...moving, timeOfDay: targetSlot }],
                    };
                  }
                  return d;
                }),
              }),
              `Moved to ${targetDay} ${targetSlot}.`
            );
            setMoveState(null);
          }}
        />
      ) : null}

      <AthleteWeekPreviewModal
        preview={athletePreview}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <ScratchSessionBuilder
        open={scratchOpen}
        slotLabel={
          replaceTarget
            ? `Replacing ${draft.days[replaceTarget.dayIndex]?.sessions[replaceTarget.sessionIndex]?.title ?? "session"}`
            : addTarget
              ? `${addTarget.day} · ${addTarget.slot}`
              : "Select a day slot first"
        }
        onClose={() => setScratchOpen(false)}
        onSave={handleScratchSave}
      />

      {replaceTarget ? (
        <p className="text-center text-xs text-sky-300">
          Replace mode — pick a library session or build from scratch.
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setReplaceTarget(null)}
          >
            Cancel
          </button>
        </p>
      ) : null}

      {perfWeekConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h3 className="font-bold text-white">Replace current week?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This will replace the current editable week with{" "}
              <span className="text-cyan-200">{PERFORMANCE_TESTING_WEEK_TEMPLATE_NAME}</span>.
              Existing sessions in this week will be overwritten in the draft. You can still edit,
              remove or scale sessions before publishing.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPerfWeekConfirmOpen(false)}
                className="rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyPerformanceTestingWeek}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-black"
              >
                Replace with testing week
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hydrateDetailsConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h3 className="font-bold text-white">Apply missing Performance Testing details?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This fills empty warm-up, main set, cool-down and recording fields on Version 2
              testing sessions. For Sunday, it also appends the full ordered HYROX sequence when
              that sequence is missing — even if pacing/protocol guidance is already present.
              Existing coach-written content is preserved. Dates, completion state, athlete logs
              and Performance Testing results are not deleted.
            </p>
            <p className="mt-2 text-sm text-amber-200/90">
              Because this week is published, the draft will be saved and then republished so
              athletes receive the updated session details.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setHydrateDetailsConfirmOpen(false)}
                className="rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void applyMissingPerformanceTestingDetails()}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Apply missing details
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLive && livePersistence?.athleteId ? (
        <CopyWeekToModal
          open={copyWeekOpen}
          sourceWeek={draft.week}
          sourceSessionCount={draft.days.reduce((n, d) => n + d.sessions.length, 0)}
          athleteId={livePersistence.athleteId}
          saving={saving}
          onClose={() => setCopyWeekOpen(false)}
          onCopy={async (targetWeek, replace) => {
            const result = await copyWeekTo(draft.week, targetWeek, replace);
            if (result.ok) setCopyWeekOpen(false);
            return result;
          }}
        />
      ) : null}
    </div>
  );
}

function CoachNotesPanel({
  notes,
  onChange,
}: {
  notes: {
    weeklyCoachNote: string;
    weekRationale: string;
    keyFocus: string;
    thingsToAvoid: string;
    athleteFacingNote: string;
  };
  onChange: (patch: Partial<typeof notes>) => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-bold text-white">Coach notes</h2>
      <div className="mt-3 space-y-2">
        <Note label="Weekly coach note" value={notes.weeklyCoachNote} onChange={(v) => onChange({ weeklyCoachNote: v })} />
        <Note label="Key focus" value={notes.keyFocus} onChange={(v) => onChange({ keyFocus: v })} />
        <Note label="Things to avoid" value={notes.thingsToAvoid} onChange={(v) => onChange({ thingsToAvoid: v })} />
        <Note label="Athlete-facing note" value={notes.athleteFacingNote} onChange={(v) => onChange({ athleteFacingNote: v })} />
      </div>
    </section>
  );
}

function Note({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[10px] text-zinc-500">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white"
      />
    </label>
  );
}

function MoveModal({
  initialDay,
  initialSlot,
  onClose,
  onConfirm,
}: {
  initialDay: WeekdayName;
  initialSlot: SandboxTimeOfDay;
  onClose: () => void;
  onConfirm: (day: WeekdayName, slot: SandboxTimeOfDay) => void;
}) {
  const [day, setDay] = useState(initialDay);
  const [slot, setSlot] = useState(initialSlot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
        <h3 className="font-bold text-white">Move session</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-500">
            Day
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as WeekdayName)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Slot
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as SandboxTimeOfDay)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
            >
              {(["AM", "Main", "PM", "Optional"] as SandboxTimeOfDay[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-400">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(day, slot)}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950"
          >
            Confirm move
          </button>
        </div>
      </div>
    </div>
  );
}
