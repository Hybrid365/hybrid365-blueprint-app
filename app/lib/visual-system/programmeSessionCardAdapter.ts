/**
 * Programme → AthleteSessionCardViewModel.
 * Honest statuses only — never remaps past weeks to complete.
 */

import { mapHyroxSessionToHomeDStatus } from "@/app/lib/hyroxAthleteHomeDViewModel";
import { sanitizeAthleteSessionTitle } from "@/app/lib/hyroxSessionFamilyAthleteCopy";
import { isPopulatedTargetValue } from "@/app/lib/hyrox-team/modules/home/resolveCompactSessionTargets";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";
import { buildWorkoutTimelineViewModel } from "@/app/lib/visual-system/workoutTimelineViewModel";
import { inferTimelineModality } from "@/app/lib/visual-system/timelineModality";
import type { AthleteSessionCardViewModel } from "@/components/athlete-command-centre/visual-system/sessions/sessionCardTypes";
import type { SessionStatusKey } from "@/components/athlete-command-centre/visual-system/tokens";
import { slotSortIndex } from "@/app/lib/visual-system/homeDSessionCardAdapter";

function todayYmdLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysYmd(ymd: string, days: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function workTargetFromSession(session: HyroxSession) {
  const raw =
    session.detail?.targetPaceLoad?.trim() ||
    session.plannedTargets?.targetPace?.trim() ||
    session.plannedTargets?.targetSplit?.trim() ||
    session.plannedTargets?.targetLoad?.trim() ||
    null;
  if (!raw || !isPopulatedTargetValue(raw)) return undefined;
  const lower = raw.toLowerCase();
  if (/w\b|watt/.test(lower)) return { watts: raw };
  if (/\/500|split/.test(lower)) return { split: raw };
  return { pace: raw };
}

export function hyroxSessionToProgrammeCardViewModel(
  session: HyroxSession,
  opts?: { now?: Date }
): AthleteSessionCardViewModel {
  const now = opts?.now ?? new Date();
  const todayIso = todayYmdLocal(now);
  const dayIso = (session.dateYmd ?? "").trim() || todayIso;
  const status = mapHyroxSessionToHomeDStatus(session, dayIso, todayIso) as SessionStatusKey;

  const primaryTargetRaw =
    session.detail?.targetPaceLoad?.trim() ||
    session.plannedTargets?.targetPace?.trim() ||
    session.plannedTargets?.targetSplit?.trim() ||
    session.plannedTargets?.targetLoad?.trim() ||
    null;
  const primaryTarget = isPopulatedTargetValue(primaryTargetRaw)
    ? primaryTargetRaw!.trim()
    : null;

  const duration =
    session.detail?.duration?.trim() || session.duration?.trim() || null;
  const objective =
    session.intent?.trim() || session.detail?.objective?.trim() || null;
  const coachNote =
    session.detail?.coachNote?.trim() || session.coachNote?.trim() || null;

  const modality = inferTimelineModality({
    sessionType: session.type,
    sessionName: session.name,
    focus: session.focus,
    category: session.type,
  });
  const timeline = session.structuredWorkout
    ? buildWorkoutTimelineViewModel(session.structuredWorkout, {
        workModality: modality,
        workTarget: workTargetFromSession(session),
      })
    : null;
  const showTimeline =
    timeline != null &&
    timeline.support !== "unsupported" &&
    timeline.segments.length > 0;

  const slot = session.timeOfDay ?? "Main";
  const focusLabel =
    slot === "Main"
      ? session.priority === "Key"
        ? "Key"
        : session.priority === "Optional"
          ? "Optional"
          : null
      : slot;

  return {
    id: session.id,
    title: sanitizeAthleteSessionTitle(session.name || session.focus || "Session"),
    categoryLabel: session.type,
    focusLabel,
    status,
    prescriptionLine: null,
    objective,
    primaryTarget,
    durationLabel: duration,
    coachNote,
    timeline: showTimeline ? timeline : null,
  };
}

export type ProgrammeDayGroup = {
  id: string;
  dow: string;
  dateLabel: string;
  dateYmd: string | null;
  isToday: boolean;
  sessions: HyroxSession[];
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Group published week sessions by calendar day.
 * When weekStartYmd is known, include empty days Mon–Sun.
 */
export function groupProgrammeSessionsByDay(
  sessions: HyroxSession[],
  opts?: { weekStartYmd?: string | null; now?: Date }
): ProgrammeDayGroup[] {
  const now = opts?.now ?? new Date();
  const todayIso = todayYmdLocal(now);
  const weekStart = opts?.weekStartYmd?.trim() || null;

  const byDay = new Map<string, HyroxSession[]>();
  for (const s of sessions) {
    const key =
      (s.dateYmd ?? "").trim() ||
      `${s.dayShort}|${s.dateLabel}` ||
      s.id;
    const list = byDay.get(key) ?? [];
    list.push(s);
    byDay.set(key, list);
  }

  for (const [, list] of byDay) {
    list.sort(
      (a, b) =>
        slotSortIndex(a.timeOfDay) - slotSortIndex(b.timeOfDay) ||
        a.name.localeCompare(b.name)
    );
  }

  if (weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    const days: ProgrammeDayGroup[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDaysYmd(weekStart, i);
      if (!iso) continue;
      const daySessions = byDay.get(iso) ?? [];
      // Also collect sessions that match by dayShort without dateYmd
      const dow = DOW[i]!;
      const orphan = [...byDay.entries()]
        .filter(([k, v]) => !/^\d{4}-\d{2}-\d{2}$/.test(k) && v.some((s) => s.dayShort === dow))
        .flatMap(([, v]) => v.filter((s) => s.dayShort === dow && !(s.dateYmd ?? "").trim()));
      const merged = [...daySessions];
      for (const s of orphan) {
        if (!merged.some((x) => x.id === s.id)) merged.push(s);
      }
      merged.sort(
        (a, b) =>
          slotSortIndex(a.timeOfDay) - slotSortIndex(b.timeOfDay) ||
          a.name.localeCompare(b.name)
      );
      const sample = merged[0];
      days.push({
        id: iso,
        dow,
        dateLabel: sample?.dateLabel ?? dow,
        dateYmd: iso,
        isToday: iso === todayIso,
        sessions: merged,
      });
    }
    return days;
  }

  // Fallback: only days that have sessions
  return [...byDay.entries()]
    .map(([key, list]) => {
      const sample = list[0]!;
      const iso = (sample.dateYmd ?? "").trim() || null;
      return {
        id: key,
        dow: sample.dayShort,
        dateLabel: sample.dateLabel,
        dateYmd: iso,
        isToday: iso === todayIso,
        sessions: list,
      } satisfies ProgrammeDayGroup;
    })
    .sort((a, b) => {
      if (a.dateYmd && b.dateYmd) return a.dateYmd.localeCompare(b.dateYmd);
      return a.dow.localeCompare(b.dow);
    });
}
