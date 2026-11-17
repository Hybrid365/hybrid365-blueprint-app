import { deriveAnchors } from "./anchors";
import { buildAssessmentWeek } from "./assessmentWeek";
import { buildDashboard, buildHome } from "./dashboard";
import { buildEvidenceBook } from "./evidence";
import { buildHandoffPreview } from "./handoff";
import { buildPerformanceProfile } from "./profile";
import { resolveAssessmentRequirements } from "./requirements";
import { TRACK_FOUNDATION_AS_OF, formatDisplayDate } from "./dates";
import type {
  AssessmentRequirement,
  AssessmentWeek,
  AthletePerformanceProfile,
  BenchmarkResultInput,
  DashboardView,
  HomeView,
  TrackHandoffPreview,
  TrackIntake,
  WorkloadCard,
} from "./types";
import type { AnchorBundle } from "./anchors";
import type { EvidenceBook } from "./evidence";

export type TrackFoundationState = {
  asOf: string;
  intake: TrackIntake;
  evidence: EvidenceBook;
  requirements: AssessmentRequirement[];
  week: AssessmentWeek;
  anchors: AnchorBundle;
  profile: AthletePerformanceProfile;
  handoff: TrackHandoffPreview;
  dashboard: DashboardView;
  home: HomeView;
};

export function evaluateTrackFoundation(args: {
  intake: TrackIntake;
  results: BenchmarkResultInput[];
  asOf?: string;
  workload?: WorkloadCard[];
}): TrackFoundationState {
  const asOf = args.asOf ?? TRACK_FOUNDATION_AS_OF;
  const evidence = buildEvidenceBook(args.results, asOf);
  const requirements = resolveAssessmentRequirements(args.intake, evidence);
  const labels: Record<string, string> = {};
  for (const req of requirements) {
    if (!req.satisfiedByResultId) continue;
    const row = evidence.classified.find((item) => item.id === req.satisfiedByResultId);
    if (!row) continue;
    labels[req.id] = `${row.resultValue} · ${formatDisplayDate(row.date)}`;
  }
  const week = buildAssessmentWeek(args.intake, requirements, asOf, labels);
  const anchors = deriveAnchors(evidence);
  const profile = buildPerformanceProfile({ intake: args.intake, book: evidence, anchors, requirements });
  const handoff = buildHandoffPreview({ intake: args.intake, book: evidence, profile });
  const dashboard = buildDashboard({ book: evidence, anchors, profile, workload: args.workload });
  const home = buildHome({ intake: args.intake, week, asOf });
  if (anchors.running.threshold) {
    home.progressSignal = anchors.running.threshold.provenance?.statement ?? null;
  }
  return { asOf, intake: args.intake, evidence, requirements, week, anchors, profile, handoff, dashboard, home };
}
