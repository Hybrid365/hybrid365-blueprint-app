"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BLOCK_WEEK_FOCUS_LABELS,
  generateCoachDraftWeekForBlockCycle,
  generateCoachBlockDraftWeeks,
  globalWeekForBlock,
  type CoachDraftWeek,
  type CoachProgrammeStatus,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import {
  defaultProgrammeStartYmd,
  formatWeekDateRangeFromYmd,
  isMondayYmd,
  PROGRAMME_START_MUST_BE_MONDAY,
  shouldShowNextBlockPrompt,
  validateProgrammeStartDateYmd,
  weekDateRangeFromProgrammeStart,
  type ProgrammeLengthWeeks,
} from "@/app/lib/hyroxProgrammeDates";
import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { HyroxAthleteProfile } from "@/app/lib/hyroxAthleteProfileTypes";
import type { LiveProgrammePersistenceProps } from "./CoachAthleteDashboard";

export type GenerationScope = "current_week" | "block_4" | "block_8" | "full_12";

export type BlockWeekMeta = {
  cycle: 1 | 2 | 3 | 4;
  globalWeek: number;
  role: string;
  draftId: string | null;
  coachStatus: CoachProgrammeStatus | null;
  draftData?: CoachDraftWeek | null;
  generated: boolean;
  sessionCount: number;
  published: boolean;
  approved: boolean;
};

export type PublishReadiness = {
  canPublish: boolean;
  reason: string;
  buttonLabel: string;
  publishBlock: boolean;
};

export function useCoachBlockProgramme(params: {
  athlete: CoachAthlete;
  livePersistence?: LiveProgrammePersistenceProps;
  coachNotes: {
    weeklyCoachNote: string;
    athleteFacingNote: string;
  };
  initialDraft?: CoachDraftWeek | null;
  programmeStatus: CoachProgrammeStatus;
  onStatusChange: (s: CoachProgrammeStatus) => void;
}) {
  const { athlete, livePersistence, coachNotes, initialDraft, programmeStatus, onStatusChange } =
    params;
  const isLive = Boolean(livePersistence);

  const [generationScope, setGenerationScope] = useState<GenerationScope>("block_4");
  const [selectedCycle, setSelectedCycle] = useState<1 | 2 | 3 | 4>(1);
  const [blockWeeks, setBlockWeeks] = useState<BlockWeekMeta[]>([]);
  const [draft, setDraft] = useState<CoachDraftWeek>(
    () => initialDraft ?? generateCoachDraftWeekForBlockCycle(athlete, 1)
  );
  const [status, setStatus] = useState<CoachProgrammeStatus>(programmeStatus);
  const [saving, setSaving] = useState(false);
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [blockLoadError, setBlockLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [programmeStartDate, setProgrammeStartDate] = useState(() =>
    livePersistence?.programmeStartDate?.trim()
      ? livePersistence.programmeStartDate
      : defaultProgrammeStartYmd()
  );
  const programmeLengthWeeks = (livePersistence?.programmeLengthWeeks === 16
    ? 16
    : 12) as ProgrammeLengthWeeks;

  useEffect(() => {
    if (livePersistence?.programmeStartDate) {
      setProgrammeStartDate(livePersistence.programmeStartDate);
    }
  }, [livePersistence?.programmeStartDate]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    setStatus(programmeStatus);
  }, [programmeStatus]);

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
      const cycle = Math.min(4, Math.max(1, ((initialDraft.week - 1) % 4) + 1)) as 1 | 2 | 3 | 4;
      setSelectedCycle(cycle);
    }
  }, [initialDraft]);

  const loadBlockMeta = useCallback(async (): Promise<BlockWeekMeta[] | null> => {
    if (!isLive || !livePersistence?.athleteId) return null;
    setLoadingBlock(true);
    setBlockLoadError(null);
    try {
      const res = await fetch(`/api/hyrox/athletes/${livePersistence.athleteId}/programme-drafts`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBlockLoadError(data.error ?? "Could not load block drafts.");
        return null;
      }
      const weeks = data.weeks as BlockWeekMeta[];
      setBlockWeeks(weeks);
      return weeks;
    } catch {
      setBlockLoadError("Network error loading block drafts.");
      return null;
    } finally {
      setLoadingBlock(false);
    }
  }, [isLive, livePersistence?.athleteId]);

  useEffect(() => {
    void loadBlockMeta();
  }, [loadBlockMeta, livePersistence?.draftId]);

  const selectedWeekMeta = useMemo(
    () => blockWeeks.find((w) => w.cycle === selectedCycle) ?? null,
    [blockWeeks, selectedCycle]
  );

  const activeDraftId = useMemo(() => {
    if (selectedWeekMeta?.draftId) return selectedWeekMeta.draftId;
    return livePersistence?.draftId ?? null;
  }, [selectedWeekMeta, livePersistence?.draftId]);

  const syncStatusFromWeek = useCallback(
    (week: BlockWeekMeta | null) => {
      if (!week?.coachStatus) return;
      setStatus(week.coachStatus);
      onStatusChange(week.coachStatus);
    },
    [onStatusChange]
  );

  const applyWeekFromMeta = useCallback(
    (weeks: BlockWeekMeta[] | null, cycle: 1 | 2 | 3 | 4) => {
      if (!weeks?.length) return;
      const week = weeks.find((w) => w.cycle === cycle);
      if (week?.draftData) {
        setDraft(week.draftData);
        if (week.draftId) livePersistence?.onDraftIdChange(week.draftId);
        syncStatusFromWeek(week);
      }
    },
    [livePersistence, syncStatusFromWeek]
  );

  const selectCycle = useCallback(
    (cycle: 1 | 2 | 3 | 4) => {
      setSelectedCycle(cycle);
      const week = blockWeeks.find((w) => w.cycle === cycle);
      if (week?.draftData) {
        setDraft(week.draftData);
        if (week.draftId) livePersistence?.onDraftIdChange(week.draftId);
        syncStatusFromWeek(week);
        return;
      }
      setDraft(generateCoachDraftWeekForBlockCycle(athlete, cycle));
      syncStatusFromWeek(week ?? null);
    },
    [athlete, blockWeeks, livePersistence, syncStatusFromWeek]
  );

  const persistDraft = useCallback(
    async (opts?: { coachStatus?: CoachProgrammeStatus; preserveStatus?: boolean }) => {
      const draftId = activeDraftId;
      if (!isLive || !draftId || !livePersistence?.effectiveProfile) {
        return true;
      }
      setSaving(true);
      try {
        const body: Record<string, unknown> = {
          draft,
          effective_profile: livePersistence.effectiveProfile,
          coach_note: coachNotes.weeklyCoachNote,
          athlete_facing_note: coachNotes.athleteFacingNote,
        };
        if (!opts?.preserveStatus && opts?.coachStatus) {
          body.coach_status = opts.coachStatus;
        }
        const res = await fetch(`/api/hyrox/programme-drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          const detail =
            process.env.NODE_ENV === "development" && data.detail
              ? `${data.error}: ${data.detail}`
              : (data.error ?? "Could not save draft.");
          showToast(detail);
          return false;
        }
        if (data.draft?.id) livePersistence.onDraftIdChange(data.draft.id);
        if (data.coachStatus) {
          setStatus(data.coachStatus);
          onStatusChange(data.coachStatus);
        }
        await loadBlockMeta();
        return true;
      } catch {
        showToast("Network error saving draft.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [
      activeDraftId,
      coachNotes.athleteFacingNote,
      coachNotes.weeklyCoachNote,
      draft,
      isLive,
      livePersistence,
      loadBlockMeta,
      onStatusChange,
      showToast,
    ]
  );

  const generate = useCallback(async () => {
    if (!isLive || !livePersistence?.effectiveProfile) {
      const weeks =
        generationScope === "block_4"
          ? generateCoachBlockDraftWeeks(athlete)
          : [generateCoachDraftWeekForBlockCycle(athlete, selectedCycle)];
      const meta: BlockWeekMeta[] = weeks.map((w, idx) => {
        const cycle = (idx + 1) as 1 | 2 | 3 | 4;
        const count = w.days.reduce((n, d) => n + d.sessions.length, 0);
        return {
          cycle,
          globalWeek: w.week,
          role: BLOCK_WEEK_FOCUS_LABELS[cycle],
          draftId: `mock-${cycle}`,
          coachStatus: "generated_draft" as CoachProgrammeStatus,
          draftData: w,
          generated: count > 0,
          sessionCount: count,
          published: false,
          approved: false,
        };
      });
      setBlockWeeks(meta);
      const pick = weeks[selectedCycle - 1] ?? weeks[0]!;
      setDraft(pick);
      setStatus("generated_draft");
      onStatusChange("generated_draft");
      showToast(
        generationScope === "block_4"
          ? "Generated 4-week block (local preview)"
          : `Generated week ${selectedCycle} (local preview)`
      );
      return;
    }

    setSaving(true);
    try {
      const body: {
        effective_profile: HyroxAthleteProfile;
        generate_block?: boolean;
        draft?: CoachDraftWeek;
      } = {
        effective_profile: livePersistence.effectiveProfile as HyroxAthleteProfile,
      };

      if (generationScope === "block_4") {
        body.generate_block = true;
      } else {
        body.draft = generateCoachDraftWeekForBlockCycle(athlete, selectedCycle);
      }

      const res = await fetch(`/api/hyrox/athletes/${livePersistence.athleteId}/programme-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          coach_note: coachNotes.weeklyCoachNote,
          athlete_facing_note: coachNotes.athleteFacingNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error ?? "Generation failed.");
        return;
      }

      if (generationScope === "block_4" && data.drafts?.length) {
        const first = data.drafts[0] as { id: string };
        livePersistence.onDraftIdChange(first.id);
        showToast(`Generated 4-week block (${data.drafts.length} drafts saved).`);
      } else if (data.draft?.id) {
        livePersistence.onDraftIdChange(data.draft.id);
        setDraft((data.draftData as CoachDraftWeek) ?? body.draft!);
        showToast(`Generated week ${selectedCycle} draft.`);
      }

      setStatus("generated_draft");
      onStatusChange("generated_draft");
      const weeks = await loadBlockMeta();
      applyWeekFromMeta(weeks, selectedCycle);
      await livePersistence.onReload();
    } catch {
      showToast("Network error during generation.");
    } finally {
      setSaving(false);
    }
  }, [
    athlete,
    coachNotes.athleteFacingNote,
    coachNotes.weeklyCoachNote,
    applyWeekFromMeta,
    generationScope,
    isLive,
    livePersistence,
    loadBlockMeta,
    onStatusChange,
    selectedCycle,
    showToast,
  ]);

  const effectiveBlockWeeks = useMemo(() => {
    if (blockWeeks.length) return blockWeeks;
    if (!isLive && draft.days.some((d) => d.sessions.length > 0)) {
      const count = draft.days.reduce((n, d) => n + d.sessions.length, 0);
      return [
        {
          cycle: selectedCycle,
          globalWeek: draft.week,
          role: BLOCK_WEEK_FOCUS_LABELS[selectedCycle],
          draftId: "mock-local",
          coachStatus: status,
          draftData: draft,
          generated: count > 0,
          sessionCount: count,
          published: status === "published",
          approved: status === "approved" || status === "published",
        },
      ] as BlockWeekMeta[];
    }
    return blockWeeks;
  }, [blockWeeks, draft, isLive, selectedCycle, status]);

  const saveProgrammeStartDate = useCallback(
    async (ymd: string) => {
      const startError = validateProgrammeStartDateYmd(ymd);
      if (startError) {
        showToast(startError);
        return false;
      }
      setProgrammeStartDate(ymd);
      if (!isLive || !livePersistence?.athleteId) return true;
      try {
        const res = await fetch(
          `/api/hyrox/athletes/${livePersistence.athleteId}/programme-settings`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ programme_start_date: ymd }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          showToast(data.error ?? "Could not save programme start date.");
          return false;
        }
        return true;
      } catch {
        showToast("Network error saving programme start date.");
        return false;
      }
    },
    [isLive, livePersistence?.athleteId, showToast]
  );

  const blockWeekDateRanges = useMemo(() => {
    return ([1, 2, 3, 4] as const).map((cycle) => {
      const globalWeek = globalWeekForBlock(athlete.programmeBlock, cycle);
      const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(
        programmeStartDate,
        globalWeek
      );
      return {
        cycle,
        label: formatWeekDateRangeFromYmd(startYmd, endYmd),
      };
    });
  }, [athlete.programmeBlock, programmeStartDate]);

  const showNextBlockPrompt = useMemo(
    () =>
      shouldShowNextBlockPrompt({
        currentBlock: athlete.programmeBlock,
        programmeLengthWeeks,
        programmeStartYmd: programmeStartDate,
        blockPublished: Boolean(livePersistence?.blockPublished) || status === "published",
      }),
    [
      athlete.programmeBlock,
      livePersistence?.blockPublished,
      programmeLengthWeeks,
      programmeStartDate,
      status,
    ]
  );

  const publishReadiness: PublishReadiness = useMemo(() => {
    const generatedWeeks = effectiveBlockWeeks.filter((w) => w.generated);
    const hasDraft = isLive ? Boolean(activeDraftId) : true;
    const sessionCount = draft.days.reduce((n, d) => n + d.sessions.length, 0);

    if (!programmeStartDate?.trim()) {
      return {
        canPublish: false,
        reason: "Set a programme start date before publishing.",
        buttonLabel: generationScope === "block_4" ? "Publish 4-Week Block" : "Publish Selected Week",
        publishBlock: generationScope === "block_4",
      };
    }

    if (!isMondayYmd(programmeStartDate)) {
      return {
        canPublish: false,
        reason: PROGRAMME_START_MUST_BE_MONDAY,
        buttonLabel: generationScope === "block_4" ? "Publish 4-Week Block" : "Publish Selected Week",
        publishBlock: generationScope === "block_4",
      };
    }

    if (!hasDraft || sessionCount === 0) {
      return {
        canPublish: false,
        reason: "Generate draft sessions before publishing.",
        buttonLabel: generationScope === "block_4" ? "Publish 4-Week Block" : "Publish Selected Week",
        publishBlock: generationScope === "block_4",
      };
    }

    if (generationScope === "block_4") {
      if (generatedWeeks.length < 4) {
        return {
          canPublish: false,
          reason: `Generate all 4 weeks in block ${athlete.programmeBlock} first (${generatedWeeks.length}/4 ready).`,
          buttonLabel: "Publish 4-Week Block",
          publishBlock: true,
        };
      }
      const allApproved = generatedWeeks.every((w) => w.approved || w.published);
      if (!allApproved) {
        return {
          canPublish: false,
          reason: "Approve all 4 weeks before publishing this block (use Approve Full Block).",
          buttonLabel: "Publish 4-Week Block",
          publishBlock: true,
        };
      }
      return {
        canPublish: status !== "published",
        reason: `Ready to publish 4-week block from ${programmeStartDate}. Weeks 1–4 will be visible to the athlete.`,
        buttonLabel: "Publish 4-Week Block",
        publishBlock: true,
      };
    }

    const weekApproved =
      status === "approved" || selectedWeekMeta?.approved || selectedWeekMeta?.published;
    if (!weekApproved) {
      return {
        canPublish: false,
        reason: `Approve week ${selectedCycle} (${BLOCK_WEEK_FOCUS_LABELS[selectedCycle]}) before publishing.`,
        buttonLabel: "Publish Selected Week",
        publishBlock: false,
      };
    }
    return {
      canPublish: status !== "published",
      reason: `Ready to publish week ${selectedCycle} only.`,
      buttonLabel: "Publish Selected Week",
      publishBlock: false,
    };
  }, [
    activeDraftId,
    athlete.programmeBlock,
    effectiveBlockWeeks,
    draft.days,
    generationScope,
    isLive,
    selectedCycle,
    programmeStartDate,
    selectedWeekMeta,
    status,
  ]);

  const approveSelectedWeek = useCallback(async () => {
    if (!activeDraftId && isLive) {
      showToast("Generate draft sessions before approving.");
      return;
    }
    const ok = await persistDraft({ preserveStatus: true });
    if (!ok && isLive) return;

    if (!isLive) {
      setBlockWeeks((prev) =>
        prev.length
          ? prev.map((w) =>
              w.cycle === selectedCycle
                ? { ...w, approved: true, coachStatus: "approved" as CoachProgrammeStatus }
                : w
            )
          : prev
      );
      setStatus("approved");
      onStatusChange("approved");
      showToast(`Week ${selectedCycle} approved (local).`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/hyrox/programme-drafts/${activeDraftId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error ?? data.detail ?? "Approve failed.");
        return;
      }
      setStatus("approved");
      onStatusChange("approved");
      showToast(`Week ${selectedCycle} (${BLOCK_WEEK_FOCUS_LABELS[selectedCycle]}) approved.`);
      const weeks = await loadBlockMeta();
      applyWeekFromMeta(weeks, selectedCycle);
    } finally {
      setSaving(false);
    }
  }, [
    activeDraftId,
    applyWeekFromMeta,
    isLive,
    loadBlockMeta,
    onStatusChange,
    persistDraft,
    selectedCycle,
    showToast,
  ]);

  const approveFullBlock = useCallback(async () => {
    if (!isLive || !livePersistence?.athleteId) {
      setBlockWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          approved: true,
          coachStatus: "approved" as CoachProgrammeStatus,
        }))
      );
      setStatus("approved");
      onStatusChange("approved");
      showToast("Full block approved (local).");
      return;
    }

    const generated = effectiveBlockWeeks.filter((w) => w.generated);
    if (generated.length < 4) {
      showToast("Generate the full 4-week block before approving all weeks.");
      return;
    }

    setSaving(true);
    try {
      const ok = await persistDraft({ preserveStatus: true });
      if (!ok) return;

      const res = await fetch(
        `/api/hyrox/athletes/${livePersistence.athleteId}/programme-drafts/approve-block`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error ?? data.detail ?? "Block approve failed.");
        return;
      }
      setStatus("approved");
      onStatusChange("approved");
      showToast(data.message ?? "Full block approved.");
      const weeks = await loadBlockMeta();
      applyWeekFromMeta(weeks, selectedCycle);
    } finally {
      setSaving(false);
    }
  }, [
    applyWeekFromMeta,
    effectiveBlockWeeks,
    isLive,
    livePersistence,
    loadBlockMeta,
    onStatusChange,
    persistDraft,
    selectedCycle,
    showToast,
  ]);

  const publish = useCallback(async () => {
    if (!activeDraftId && isLive) {
      showToast("No draft to publish.");
      return;
    }

    const publishBlock = generationScope === "block_4";

    if (!isLive) {
      setBlockWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          published: publishBlock ? true : w.cycle === selectedCycle ? true : w.published,
          approved: true,
          coachStatus: "published" as CoachProgrammeStatus,
        }))
      );
      setStatus("published");
      onStatusChange("published");
      showToast(
        publishBlock
          ? "Block published: Weeks 1–4 are now visible to the athlete (mock)."
          : `Week ${selectedCycle} published (mock).`
      );
      return;
    }

    if (publishBlock) {
      const generated = effectiveBlockWeeks.filter((w) => w.generated);
      if (generated.length < 4) {
        showToast("Generate all 4 weeks before publishing the block.");
        return;
      }
      const allApproved = generated.every((w) => w.approved || w.published);
      if (!allApproved) {
        showToast("Approve all 4 weeks (or use Approve Full Block) before publishing.");
        return;
      }
    } else if (status !== "approved") {
      showToast("Approve the selected week before publishing.");
      return;
    }

    setSaving(true);
    try {
      const expected_session_counts_by_week = publishBlock
        ? Object.fromEntries(
            effectiveBlockWeeks
              .filter((w) => w.generated)
              .map((w) => [String(w.globalWeek), w.sessionCount])
          )
        : undefined;
      const expected_session_count = publishBlock
        ? undefined
        : (effectiveBlockWeeks.find((w) => w.cycle === selectedCycle)?.sessionCount ??
          draft.days.reduce((n, d) => n + d.sessions.length, 0));

      const res = await fetch(`/api/hyrox/programme-drafts/${activeDraftId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publish_block: publishBlock,
          programme_start_date: programmeStartDate,
          expected_session_counts_by_week,
          expected_session_count,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const detail =
          data.code === "STALE_DRAFT_SESSION_COUNT"
            ? data.error
            : process.env.NODE_ENV === "development" && data.detail
              ? `${data.error}: ${data.detail}`
              : (data.error ?? "Publish failed.");
        showToast(detail);
        return;
      }
      setStatus("published");
      onStatusChange("published");
      const weekLines = Array.isArray(data.weekResults)
        ? data.weekResults.map(
            (w: {
              weekNumber: number;
              existingRowsBefore: number;
              insertedRowsCount: number;
              rowsAfterPublish: number;
              approvedDraftSessionCount: number;
            }) =>
              `W${w.weekNumber}: ${w.existingRowsBefore}→+${w.insertedRowsCount}→${w.rowsAfterPublish} (draft ${w.approvedDraftSessionCount})`
          )
        : [];
      if (data.publishBlock) {
        showToast(
          weekLines.length > 0
            ? `Block published. ${weekLines.join(" · ")}`
            : `Block published: ${data.weeks?.length ?? 4} week(s), ${data.sessionCount ?? 0} sessions.`
        );
      } else {
        showToast(
          weekLines[0] ??
            (data.sessionCount != null
              ? `Published ${data.sessionCount} session(s) to athlete dashboard.`
              : "Week published to athlete.")
        );
      }
      const weeks = await loadBlockMeta();
      applyWeekFromMeta(weeks, selectedCycle);
      await livePersistence?.onReload();
      livePersistence?.onPublished();
    } finally {
      setSaving(false);
    }
  }, [
    activeDraftId,
    applyWeekFromMeta,
    draft,
    effectiveBlockWeeks,
    generationScope,
    isLive,
    livePersistence,
    loadBlockMeta,
    onStatusChange,
    selectedCycle,
    showToast,
    programmeStartDate,
    status,
  ]);

  const prepareNextBlock = useCallback(() => {
    const next = athlete.programmeBlock + 1;
    showToast(
      `To generate Block ${next}: update the athlete's current block to ${next} in Profile Review, then use Generate 4-week block. Full progress-based auto-generation is coming soon.`
    );
  }, [athlete.programmeBlock, showToast]);

  return {
    effectiveBlockWeeks,
    generationScope,
    setGenerationScope,
    selectedCycle,
    selectCycle,
    blockWeeks,
    selectedWeekMeta,
    draft,
    setDraft,
    status,
    setStatus,
    saving,
    loadingBlock,
    blockLoadError,
    toast,
    activeDraftId,
    generate,
    approveSelectedWeek,
    approveFullBlock,
    publish,
    publishReadiness,
    persistDraft,
    loadBlockMeta,
    showToast,
    isLive,
    programmeStartDate,
    setProgrammeStartDate,
    saveProgrammeStartDate,
    programmeLengthWeeks,
    blockWeekDateRanges,
    showNextBlockPrompt,
    prepareNextBlock,
  };
}
