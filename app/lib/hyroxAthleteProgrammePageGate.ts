import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export type ProgrammePageLoadVariant = "ready" | "no-session" | "not-linked";

export type ProgrammePageRenderDecision =
  | "programme"
  | "waiting"
  | "auth-debug"
  | "not-linked"
  | "published-empty";

export function countPublishedSessionsFromProgramme(
  programme: AthleteLiveProgrammePayload | null | undefined
): number {
  if (!programme?.programmeWeeks?.length) return programme?.sessions?.length ?? 0;
  return programme.programmeWeeks.reduce((n, w) => n + (w.sessions?.length ?? 0), 0);
}

export function countProgrammeWeeksGenerated(
  programme: AthleteLiveProgrammePayload | null | undefined,
  fallbackWeekCount = 0
): number {
  if (!programme?.programmeWeeks?.length) return fallbackWeekCount;
  return programme.programmeWeeks.filter((w) => w.generated).length;
}

export function programmeServerResolvedAthlete(input: {
  variant: ProgrammePageLoadVariant;
  debug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
}): boolean {
  if (input.variant === "ready") return true;
  if (input.debug.linkedAthleteId) return true;
  return Boolean(input.initialProgramme?.athlete);
}

export function resolveProgrammePageRenderGate(input: {
  variant: ProgrammePageLoadVariant;
  debug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
  serverProgrammePublished: boolean;
  layoutServerAuthConfirmed: boolean;
  portalAthleteId: string | null;
}): {
  decision: ProgrammePageRenderDecision;
  reason: string;
  showMainProgramme: boolean;
  showAuthNotice: boolean;
  programmeServerResolved: boolean;
  programmeWeeksCount: number;
  programmeSessionsCount: number;
  layoutAuthUncertainButServerOk: boolean;
} {
  const programmeWeeksCount = countProgrammeWeeksGenerated(
    input.initialProgramme,
    input.debug.publishedWeekCount
  );
  const programmeSessionsCount = countPublishedSessionsFromProgramme(input.initialProgramme);
  const programmeServerResolved = programmeServerResolvedAthlete(input);
  const layoutReady =
    input.layoutServerAuthConfirmed && Boolean(input.portalAthleteId);

  const published =
    input.serverProgrammePublished ||
    Boolean(input.initialProgramme?.published) ||
    input.initialProgramme?.state === "published" ||
    programmeWeeksCount > 0;

  const layoutAuthUncertainButServerOk = programmeServerResolved && !layoutReady;

  if (programmeServerResolved) {
    if (published && programmeSessionsCount === 0) {
      return {
        decision: "published-empty",
        reason: "Programme marked published but no sessions returned from server loader.",
        showMainProgramme: true,
        showAuthNotice: false,
        programmeServerResolved,
        programmeWeeksCount,
        programmeSessionsCount,
        layoutAuthUncertainButServerOk,
      };
    }

    if (!published) {
      return {
        decision: "waiting",
        reason: "Linked athlete resolved; programme not published yet.",
        showMainProgramme: true,
        showAuthNotice: false,
        programmeServerResolved,
        programmeWeeksCount,
        programmeSessionsCount,
        layoutAuthUncertainButServerOk,
      };
    }

    return {
      decision: "programme",
      reason: layoutAuthUncertainButServerOk
        ? "Layout auth uncertain; programme server loader succeeded."
        : "Programme server loader and layout auth agree.",
      showMainProgramme: true,
      showAuthNotice: false,
      programmeServerResolved,
      programmeWeeksCount,
      programmeSessionsCount,
      layoutAuthUncertainButServerOk,
    };
  }

  if (input.variant === "not-linked") {
    return {
      decision: "not-linked",
      reason: input.debug.linkFailureReason ?? "NO_LINKED_ATHLETE",
      showMainProgramme: false,
      showAuthNotice: true,
      programmeServerResolved: false,
      programmeWeeksCount,
      programmeSessionsCount,
      layoutAuthUncertainButServerOk: false,
    };
  }

  if (layoutReady) {
    return {
      decision: "waiting",
      reason: "Layout session confirmed but programme page loader did not resolve athlete.",
      showMainProgramme: true,
      showAuthNotice: false,
      programmeServerResolved: false,
      programmeWeeksCount,
      programmeSessionsCount,
      layoutAuthUncertainButServerOk: false,
    };
  }

  return {
    decision: "auth-debug",
    reason:
      input.debug.renderReason ||
      "Programme page could not resolve athlete or programme on server load.",
    showMainProgramme: false,
    showAuthNotice: true,
    programmeServerResolved: false,
    programmeWeeksCount,
    programmeSessionsCount,
    layoutAuthUncertainButServerOk: false,
  };
}

export type ProgrammePageRenderGateResult = ReturnType<
  typeof resolveProgrammePageRenderGate
>;
