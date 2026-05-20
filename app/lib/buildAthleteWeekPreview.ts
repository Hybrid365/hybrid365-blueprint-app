/**
 * Athlete-facing week preview (coach publish preview — no admin fields).
 */

import type { CoachAthlete } from "@/app/lib/hyroxCoachMockAthletes";
import type { CoachDraftSession, CoachDraftWeek } from "@/app/lib/hyroxCoachProgrammeDraft";

export type AthletePreviewSession = {
  id: string;
  day: string;
  timeLabel: string;
  title: string;
  duration: string;
  intensity: string;
  targetLine: string | null;
  whatToRecord: string[];
  coachNote: string | null;
  isKey: boolean;
  isOptional: boolean;
};

export type AthleteWeekPreview = {
  athleteName: string;
  blockWeekLabel: string;
  weeklyFocus: string;
  coachNote: string;
  whyThisWeek: string;
  nextSession: AthletePreviewSession | null;
  sessions: AthletePreviewSession[];
};

function sessionToPreview(day: string, s: CoachDraftSession): AthletePreviewSession {
  const p = s.prescription;
  const target =
    p?.targetPace ??
    p?.targetSplit ??
    p?.targetLoad ??
    (s.rpeHr && !s.rpeHr.includes("RPE") ? s.rpeHr : null);

  return {
    id: s.draftId,
    day,
    timeLabel: s.timeOfDay === "Main" ? "" : s.timeOfDay,
    title: s.title,
    duration: s.duration,
    intensity: s.intensity || p?.rpeTarget || "—",
    targetLine: target,
    whatToRecord: p?.whatToRecord ?? s.editConfig.whatToRecord ?? [],
    coachNote: s.coachNote || p?.coachNote || null,
    isKey: s.isKeySession,
    isOptional: s.isOptional,
  };
}

/** Mock "next session" — first non-optional session in week order from today. */
function pickNextSession(sessions: AthletePreviewSession[]): AthletePreviewSession | null {
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  const start = map[todayIdx] ?? 0;

  for (let offset = 0; offset < 7; offset++) {
    const day = dayOrder[(start + offset) % 7]!;
    const daySessions = sessions.filter((s) => s.day === day && !s.isOptional);
    if (daySessions.length > 0) return daySessions[0]!;
  }
  return sessions.find((s) => !s.isOptional) ?? sessions[0] ?? null;
}

export function buildAthleteWeekPreview(
  athlete: CoachAthlete,
  draft: CoachDraftWeek,
  notes: {
    weeklyCoachNote: string;
    athleteFacingNote: string;
    weekRationale: string;
    keyFocus: string;
  }
): AthleteWeekPreview {
  const sessions = draft.days.flatMap((d) =>
    d.sessions.map((s) => sessionToPreview(d.day, s))
  );

  const weeklyFocus =
    notes.athleteFacingNote.trim() ||
    notes.keyFocus.trim() ||
    athlete.blockFocus ||
    `Block ${draft.block} · Week ${draft.week}`;

  const coachNote =
    notes.weeklyCoachNote.trim() ||
    athlete.weeklyCoachNote ||
    "Your coach will add a note when the week is published.";

  const whyThisWeek = notes.weekRationale.trim() || athlete.weekRationale;

  return {
    athleteName: athlete.name,
    blockWeekLabel: `Block ${draft.block} · Week ${draft.week}`,
    weeklyFocus,
    coachNote,
    whyThisWeek,
    nextSession: pickNextSession(sessions),
    sessions,
  };
}
