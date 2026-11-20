import TrackLoopPreview, { type LoopPreviewModel } from "@/components/track-loop/TrackLoopPreview";
import { runLoopStories } from "@/app/lib/track-loop/scenarios";

const LABELS = {
  accept: "This week",
  decline: "Keep original",
  pain: "Pain",
  no_safe_reflow: "No safe move",
  multi_miss: "Missed sessions",
} as const;

export default function TrackLoopPage() {
  const stories = runLoopStories();
  const models: LoopPreviewModel[] = stories.map((story) => ({
    id: story.id,
    label: LABELS[story.id],
    readiness: story.athleteState.readiness,
    programming: story.afterReadiness,
    ski: story.athleteState.anchors.ski,
    row: story.athleteState.anchors.row,
    threshold: story.athleteState.anchors.running,
    week: story.weekTitles,
    beforeWeek: (story.apply?.record.beforeWeek ?? story.record.sessions).map((session) => `${session.day} ${session.title}`),
    explanation: story.explanation,
    offer: story.decisionOffer,
    status: story.proposalStatus,
    applied: story.apply?.applied ?? false,
    declined: story.record.adaptations.some((row) => row.decision === "declined"),
    nextDecision: story.nextWeek.decision,
    nextExplanation: story.nextWeek.explanation,
    changes: story.nextWeek.changes,
    escalations: story.escalations,
    notifications: story.notifications,
    weeks: story.proposal?.weekCount ?? 0,
    race: story.record.intake.event.eventName,
    feedback: story.record.feedback
      .filter((row) => row.sessionId.startsWith("key-"))
      .map((row) => ({ sessionId: row.sessionId, completion: row.completion, rpe: row.rpe })),
  }));
  return <TrackLoopPreview models={models} />;
}
