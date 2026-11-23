import type { AthleteSessionCardViewModel } from "@/components/athlete-command-centre/visual-system/sessions/sessionCardTypes";
import type { SessionStatusKey } from "@/components/athlete-command-centre/visual-system/tokens";
import type {
  TimelineModality,
  WorkoutTimelineSegment,
  WorkoutTimelineViewModel,
} from "@/app/lib/visual-system/workoutTimelineViewModel";

export type TrackSessionVisualInput = {
  id: string;
  title: string;
  summary?: string | null;
  pace?: string | null;
  effort?: string | null;
  blocks?: string[];
  status?: string | null;
  kind?: string | null;
};

function category(title: string, kind?: string | null): { label: string; modality: TimelineModality } {
  const text = `${title} ${kind ?? ""}`;
  if (/rest/i.test(text)) return { label: "Rest", modality: "other" };
  if (/strength|lower-body/i.test(text)) return { label: "Strength", modality: "strength" };
  if (/station|hyrox|compromised|race-style/i.test(text)) return { label: "Hyrox", modality: "station" };
  if (/ski/i.test(text)) return { label: "Ski", modality: "ski" };
  if (/row/i.test(text)) return { label: "Row", modality: "row" };
  if (/bike/i.test(text)) return { label: "Bike", modality: "bike" };
  if (/threshold/i.test(text)) return { label: "Threshold", modality: "run" };
  if (/long/i.test(text)) return { label: "Long run", modality: "run" };
  if (/easy|aerobic|z2/i.test(text)) return { label: "Easy", modality: "run" };
  return { label: "Session", modality: "other" };
}

function statusKey(status?: string | null, kind?: string | null): SessionStatusKey {
  if (status === "completed" || kind === "covered") return "completed";
  if (status === "partial") return "partial";
  if (status === "missed") return "missed";
  return "upcoming";
}

function segment(input: { id: string; kind: "work" | "recovery"; modality: TimelineModality; durationSec: number; label: string; pace: string | null }): WorkoutTimelineSegment {
  return {
    id: input.id,
    kind: input.kind,
    modality: input.modality,
    durationSec: input.durationSec,
    startOffsetSec: null,
    label: input.label,
    cue: null,
    targetPace: input.pace,
    targetWatts: null,
    targetSplit: null,
    distanceLabel: null,
    reps: null,
    station: null,
    load: null,
    recoveryLabel: null,
  };
}

/**
 * Timeline only from durations already written in the title or blocks.
 * Missing recovery stays missing. No zones or paces are added.
 */
export function timelineFromSessionText(title: string, blocks: string[], pace: string | null, modality: TimelineModality): WorkoutTimelineViewModel | null {
  const text = [title, ...blocks].join(" · ");
  const repeat = text.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*min/i);
  const recovery = text.match(/(\d+)\s*(?:s|sec)\w*\s*(?:recovery|rest|rec)/i);
  const single = !repeat ? text.match(/(\d+)\s*min/i) : null;
  const segments: WorkoutTimelineSegment[] = [];
  if (repeat) {
    const reps = Number(repeat[1]);
    const seconds = Math.round(Number(repeat[2]) * 60);
    const recoverySec = recovery ? Number(recovery[1]) : null;
    if (!Number.isFinite(reps) || reps < 1 || reps > 30 || !Number.isFinite(seconds) || seconds <= 0) return null;
    for (let index = 0; index < reps; index += 1) {
      segments.push(segment({ id: `work-${index + 1}`, kind: "work", modality, durationSec: seconds, label: `${index + 1}`, pace }));
      if (recoverySec && index < reps - 1) {
        segments.push(segment({ id: `rec-${index + 1}`, kind: "recovery", modality: "other", durationSec: recoverySec, label: "Rec", pace: null }));
      }
    }
  } else if (single) {
    const seconds = Math.round(Number(single[1]) * 60);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    segments.push(segment({ id: "work-1", kind: "work", modality, durationSec: seconds, label: "1", pace }));
  } else {
    return null;
  }
  const total = segments.reduce((sum, item) => sum + (item.durationSec ?? 0), 0);
  let cursor = 0;
  const placed = segments.map((item) => {
    const start = cursor;
    cursor += item.durationSec ?? 0;
    return { ...item, startOffsetSec: start };
  });
  return {
    support: "supported",
    unsupportedReasons: [],
    segments: placed,
    totalDurationSec: total,
    canProportionByDuration: placed.every((item) => item.durationSec != null),
  };
}

export function trackSessionCard(input: TrackSessionVisualInput): AthleteSessionCardViewModel {
  const tone = category(input.title, input.kind);
  const blocks = input.blocks ?? [];
  const pace = input.pace?.trim() || null;
  const timeline = timelineFromSessionText(input.title, blocks, pace, tone.modality);
  const minutes = timeline?.totalDurationSec != null ? Math.round(timeline.totalDurationSec / 60) : null;
  return {
    id: input.id,
    title: input.title,
    categoryLabel: tone.label,
    focusLabel: input.effort?.trim() || null,
    status: statusKey(input.status, input.kind),
    prescriptionLine: pace,
    objective: input.summary?.trim() || null,
    primaryTarget: pace,
    durationLabel: minutes ? `${minutes} min` : null,
    coachNote: null,
    timeline,
  };
}

export function weekAccent(categoryLabel: string): string {
  const label = categoryLabel.toLowerCase();
  if (label.includes("threshold") || label.includes("hyrox")) return "border-l-2 border-l-[var(--h365-accent)]";
  if (label.includes("strength")) return "border-l-2 border-l-white/80";
  if (label.includes("long")) return "border-l-2 border-l-[var(--h365-text)]";
  if (label.includes("easy") || label.includes("ski") || label.includes("row") || label.includes("bike")) return "border-l-2 border-l-[var(--h365-recovery)]";
  if (label.includes("rest")) return "border-l-2 border-l-[var(--h365-border)]";
  return "border-l-2 border-l-[var(--h365-border)]";
}

export function minutesIn(text: string | null | undefined): number | null {
  const match = text?.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}
