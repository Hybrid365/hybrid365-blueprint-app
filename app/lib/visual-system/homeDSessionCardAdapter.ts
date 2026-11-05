/**
 * Home D → AthleteSessionCardViewModel + WeekDateNav adapters.
 *
 * Primary session rule (Batch 1):
 * First session in existing programme slot order for the selected day
 * (AM → Main → PM → Optional). No invented coaching "primary" importance.
 */

import type {
  AthleteHomeDDay,
  AthleteHomeDSessionCard,
} from "@/app/lib/hyroxAthleteHomeDViewModel";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { buildWorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { inferTimelineModality } from "@/app/lib/visual-system/timelineModality";
import type { AthleteSessionCardViewModel } from "@/components/athlete-command-centre/visual-system/sessions/sessionCardTypes";
import type { WeekDateNavDay } from "@/components/athlete-command-centre/visual-system/navigation/WeekDateNav";
import type { SessionStatusKey } from "@/components/athlete-command-centre/visual-system/tokens";

const SLOT_ORDER = ["AM", "Main", "PM", "Optional"] as const;

export function slotSortIndex(slot: string | null | undefined): number {
  const i = SLOT_ORDER.indexOf((slot as (typeof SLOT_ORDER)[number]) ?? "Main");
  return i >= 0 ? i : 1;
}

/** Sort sessions by programme slot order — preserves Home D / programme semantics. */
export function sortHomeDSessionsBySlot(
  sessions: AthleteHomeDSessionCard[]
): AthleteHomeDSessionCard[] {
  return [...sessions].sort((a, b) => slotSortIndex(a.slot) - slotSortIndex(b.slot));
}

export function homeDDaysToWeekDateNav(days: AthleteHomeDDay[]): WeekDateNavDay[] {
  return days.map((d) => ({
    id: d.id,
    dow: d.dow,
    dateNumber: d.dateNumber,
    isToday: d.isToday,
    sessionStatuses: d.sessions.map((s) => s.status as SessionStatusKey),
  }));
}

function prescriptionLine(card: AthleteHomeDSessionCard): string | null {
  const bits = [card.primaryDetail, card.duration].filter(Boolean);
  return bits.length ? bits.join(" · ") : null;
}

function workTargetFromCard(card: AthleteHomeDSessionCard, live?: HyroxSession | null) {
  const raw =
    card.primaryTarget?.trim() ||
    live?.detail?.targetPaceLoad?.trim() ||
    live?.plannedTargets?.targetPace?.trim() ||
    live?.plannedTargets?.targetSplit?.trim() ||
    null;
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (/w\b|watt/.test(lower)) return { watts: raw };
  if (/\/500|split/.test(lower)) return { split: raw };
  if (/\/km|\/mi|pace|min/.test(lower) || /\d:\d{2}/.test(raw)) return { pace: raw };
  // Unknown target shape — still pass as pace label for display when present on work
  return { pace: raw };
}

/**
 * Map one Home D session card (+ optional live HyroxSession for StructuredWorkout)
 * into the visual-system session card VM.
 */
export function homeDSessionToCardViewModel(
  card: AthleteHomeDSessionCard,
  live?: HyroxSession | null
): AthleteSessionCardViewModel {
  const workout = live?.structuredWorkout ?? null;
  const modality = inferTimelineModality({
    sessionType: live?.type ?? card.modalityLabel,
    sessionName: live?.name ?? card.title,
    focus: live?.focus ?? card.intent,
    category: card.modalityLabel,
  });

  const timeline = workout
    ? buildWorkoutTimelineViewModel(workout, {
        workModality: modality,
        workTarget: workTargetFromCard(card, live),
      })
    : null;

  const showTimeline =
    timeline != null &&
    timeline.support !== "unsupported" &&
    timeline.segments.length > 0;

  return {
    id: card.id,
    title: card.title,
    categoryLabel: card.modalityLabel,
    focusLabel: card.slot === "Main" ? null : card.slot,
    status: card.status,
    prescriptionLine: prescriptionLine(card),
    objective: card.intent,
    primaryTarget: card.primaryTarget,
    durationLabel: card.duration,
    coachNote: card.coachNote,
    timeline: showTimeline ? timeline : null,
  };
}

/**
 * Split selected-day sessions into primary hero + secondary rows.
 * Primary = first after slot order.
 */
export function splitPrimarySecondarySessions(
  sessions: AthleteHomeDSessionCard[]
): {
  primary: AthleteHomeDSessionCard | null;
  secondary: AthleteHomeDSessionCard[];
  rule: "slot_order_first";
} {
  const ordered = sortHomeDSessionsBySlot(sessions);
  if (!ordered.length) {
    return { primary: null, secondary: [], rule: "slot_order_first" };
  }
  return {
    primary: ordered[0]!,
    secondary: ordered.slice(1),
    rule: "slot_order_first",
  };
}
