import type { BenchmarkTestId } from "@/app/athlete/testing/hyroxTestingTypes";
import { CORE_TEST_IDS } from "@/app/lib/hyroxTestingPayload";
import type { HyroxAthleteStatus } from "@/app/lib/hyroxDatabaseTypes";
import type { AthleteProgrammeVisibility } from "@/app/lib/hyroxProgrammeServer";
import type { TimelineStep } from "@/components/hyrox-team/TimelineSteps";

const OPTIONAL_TEST_IDS: BenchmarkTestId[] = [
  "farmer_hold",
  "sandbag_lunge",
  "wall_ball",
  "sled_exposure",
];

export type AthleteOnboardingProgress = {
  athleteStatus: HyroxAthleteStatus;
  hasAssessment: boolean;
  hasTesting: boolean;
  hasCoreTestingComplete: boolean;
  hasRaceResult: boolean;
  coreSubmittedCount: number;
  coreRequiredCount: number;
  optionalSubmittedCount: number;
  optionalRequiredCount: number;
  programmeVisibility: AthleteProgrammeVisibility;
  programmePublished: boolean;
  programmeStatus: string | null;
};

export type AthleteNextActionKey =
  | "assessment"
  | "testing"
  | "coach_review"
  | "building"
  | "programme_live";

export type AthleteNextAction = {
  key: AthleteNextActionKey;
  title: string;
  copy: string;
  buttonLabel: string;
  href: string;
};

export function getAthleteNextAction(progress: AthleteOnboardingProgress): AthleteNextAction {
  if (progress.programmePublished) {
    return {
      key: "programme_live",
      title: "Programme live",
      copy: "Your first training week is now live.",
      buttonLabel: "View programme",
      href: "/athlete/programme",
    };
  }

  if (progress.programmeVisibility === "building") {
    return {
      key: "building",
      title: "Programme being built",
      copy: "Your first block is being manually built and reviewed before it goes live in your app.",
      buttonLabel: "Go to dashboard",
      href: "/athlete/dashboard",
    };
  }

  if (
    !progress.hasAssessment ||
    progress.athleteStatus === "assessment_required"
  ) {
    return {
      key: "assessment",
      title: "Complete your athlete assessment",
      copy: "Your assessment gives your coach the information needed to map your profile and build your first block.",
      buttonLabel: "Complete assessment",
      href: "/athlete/assessment",
    };
  }

  const testingIncomplete = !progress.hasTesting && !progress.hasRaceResult;

  if (testingIncomplete) {
    return {
      key: "testing",
      title: "Submit your baseline testing",
      copy: "You can complete tests across multiple days. Saved results stay on your profile.",
      buttonLabel: "Continue testing",
      href: "/athlete/testing",
    };
  }

  return {
    key: "coach_review",
    title: "Coach review in progress",
    copy: "Your coach is reviewing your assessment, testing and race context before building your first programme block.",
    buttonLabel: "Go to dashboard",
    href: "/athlete/dashboard",
  };
}

type PipelineStepKey =
  | "account"
  | "assessment"
  | "testing"
  | "coach_review"
  | "programme_build"
  | "programme_live";

function pipelineStepStatus(
  key: PipelineStepKey,
  progress: AthleteOnboardingProgress
): TimelineStep["status"] {
  const current = getCurrentPipelineKey(progress);

  const order: PipelineStepKey[] = [
    "account",
    "assessment",
    "testing",
    "coach_review",
    "programme_build",
    "programme_live",
  ];
  const currentIdx = order.indexOf(current);
  const stepIdx = order.indexOf(key);

  if (stepIdx < currentIdx) return "complete";
  if (stepIdx === currentIdx) return "current";
  return "locked";
}

function getCurrentPipelineKey(progress: AthleteOnboardingProgress): PipelineStepKey {
  if (progress.programmePublished) return "programme_live";
  if (progress.programmeVisibility === "building") return "programme_build";
  if (!progress.hasAssessment) return "assessment";
  if (!progress.hasTesting && !progress.hasRaceResult) return "testing";
  if (!progress.programmePublished) return "coach_review";
  return "programme_live";
}

export function buildOnboardingPipelineSteps(
  progress: AthleteOnboardingProgress
): TimelineStep[] {
  return [
    {
      n: 1,
      title: "Account activated",
      description: "Payment confirmed and your athlete portal is active.",
      status: "complete",
    },
    {
      n: 2,
      title: "Assessment",
      description: progress.hasAssessment
        ? "Submitted — your coach can read your profile inputs."
        : "Tell us about training history, race goals, equipment and limiters.",
      status: pipelineStepStatus("assessment", progress),
    },
    {
      n: 3,
      title: "Baseline testing",
      description: progress.hasCoreTestingComplete
        ? "Core markers on file — you can still add optional tests later."
        : "Core tests and/or recent RoxFit splits. Save across multiple days.",
      status: pipelineStepStatus("testing", progress),
    },
    {
      n: 4,
      title: "Coach review",
      description:
        progress.programmeVisibility === "coach_reviewing" ||
        (progress.hasAssessment && progress.hasTesting)
          ? "Your coach is reviewing assessment, testing and race context."
          : "Starts after assessment and baseline data are submitted.",
      status: pipelineStepStatus("coach_review", progress),
    },
    {
      n: 5,
      title: "Programme build",
      description:
        progress.programmeVisibility === "building"
          ? "Your first block is being manually built and checked."
          : "Not an instant template — built after coach review.",
      status: pipelineStepStatus("programme_build", progress),
    },
    {
      n: 6,
      title: "Programme live",
      description: progress.programmePublished
        ? "Your training week is visible in the app."
        : "Unlocks when your coach publishes your first block.",
      status: pipelineStepStatus("programme_live", progress),
    },
  ];
}

export type DashboardStatusChecklist = {
  assessmentSubmitted: boolean;
  testingSubmitted: boolean;
  coachReviewing: boolean;
  programmeBeingBuilt: boolean;
  programmeLive: boolean;
};

export function buildDashboardStatusChecklist(
  progress: AthleteOnboardingProgress
): DashboardStatusChecklist {
  return {
    assessmentSubmitted: progress.hasAssessment,
    testingSubmitted: progress.hasTesting || progress.hasRaceResult,
    coachReviewing:
      progress.programmeVisibility === "coach_reviewing" &&
      !progress.programmePublished &&
      progress.hasAssessment &&
      (progress.hasTesting || progress.hasRaceResult),
    programmeBeingBuilt:
      progress.programmeVisibility === "building" && !progress.programmePublished,
    programmeLive: progress.programmePublished,
  };
}

export function getDashboardCtas(progress: AthleteOnboardingProgress): {
  primary: AthleteNextAction;
  secondary?: { label: string; href: string };
} {
  const primary = getAthleteNextAction(progress);

  if (primary.key === "programme_live") {
    return { primary };
  }

  if (primary.key === "coach_review" || primary.key === "building") {
    return {
      primary,
      secondary: { label: "View onboarding status", href: "/athlete/onboarding" },
    };
  }

  return { primary };
}

/** Map API JSON (client fetch) into AthleteOnboardingProgress. */
export function progressFromAthleteApiPayload(payload: {
  athleteStatus?: string;
  assessmentSubmitted?: boolean;
  hasAssessment?: boolean;
  hasTesting?: boolean;
  hasRaceResult?: boolean;
  coreSubmittedCount?: number;
  coreRequiredCount?: number;
  optionalSubmittedCount?: number;
  programmeVisibility?: AthleteProgrammeVisibility;
  programmePublished?: boolean;
  published?: boolean;
  state?: string;
  programmeStatus?: string | null;
}): AthleteOnboardingProgress {
  const coreSubmittedCount = payload.coreSubmittedCount ?? 0;
  const coreRequiredCount = payload.coreRequiredCount ?? CORE_TEST_IDS.length;
  const hasRaceResult = Boolean(payload.hasRaceResult);
  const hasAssessment = Boolean(payload.assessmentSubmitted ?? payload.hasAssessment);
  const hasTesting = Boolean(payload.hasTesting);

  return {
    athleteStatus: (payload.athleteStatus ?? "assessment_required") as HyroxAthleteStatus,
    hasAssessment,
    hasTesting,
    hasCoreTestingComplete:
      coreSubmittedCount >= coreRequiredCount || hasRaceResult,
    hasRaceResult,
    coreSubmittedCount,
    coreRequiredCount,
    optionalSubmittedCount: payload.optionalSubmittedCount ?? 0,
    optionalRequiredCount: OPTIONAL_TEST_IDS.length,
    programmeVisibility:
      payload.state === "published"
        ? "published"
        : (payload.programmeVisibility ?? "coach_reviewing"),
    programmePublished: Boolean(
      payload.state === "published" || payload.programmePublished || payload.published
    ),
    programmeStatus: payload.programmeStatus ?? null,
  };
}
