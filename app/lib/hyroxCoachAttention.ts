/**
 * Coach Command Centre attention flags. Transparent rules only.
 * No AI risk scores. No medical diagnoses.
 */

import {
  isHighRpeVsPrescribed,
  isHighSoreness,
  isLowEnergy,
  textLooksLikeIllness,
  textMentionsHeavyLegs,
} from "@/app/lib/hyroxCoachAttentionParse";

export type CoachAttentionSeverity = "info" | "warn" | "critical";

export type CoachAttentionCode =
  | "pending_benchmark"
  | "missed_programmed_session"
  | "key_session_incomplete"
  | "high_rpe_vs_prescribed"
  | "pain_soreness"
  | "illness"
  | "repeated_heavy_legs"
  | "repeated_low_energy"
  | "missing_weekly_check_in";

export type CoachAttentionSource =
  | "programme_session"
  | "weekly_check_in"
  | "daily_readiness"
  | "benchmark";

export type CoachAttentionTab =
  | "Performance Profile"
  | "Check-Ins"
  | "Weekly Review"
  | "Testing"
  | "Programme Builder"
  | "Coach Notes";

export type CoachAttentionFlag = {
  id: string;
  code: CoachAttentionCode;
  severity: CoachAttentionSeverity;
  title: string;
  reason: string;
  source: CoachAttentionSource;
  date: string | null;
  sessionId: string | null;
  sessionName: string | null;
  actionTab: CoachAttentionTab;
  actionLabel: string;
};

export type CoachAttentionSession = {
  id: string;
  name: string;
  dateYmd: string | null;
  dayOfWeek: string;
  slot: string;
  completed: boolean;
  isKey: boolean;
  loggedRpe: number | null;
  prescribedRpeMax: number | null;
  notes: string | null;
  painOrTightness: string | null;
};

export type CoachAttentionCheckIn = {
  id: string;
  weekNumber: number;
  submittedAt: string | null;
  energy: number | null;
  soreness: number | null;
  painNiggles: string | null;
  biggestStruggle: string | null;
};

export type CoachAttentionReadiness = {
  localDate: string;
  feelingUnwell: boolean;
  muscleSoreness: number | null;
};

export type CoachAttentionBenchmark = {
  id: string;
  type: string;
  label: string;
  resultDate: string | null;
};

export type CoachAttentionInput = {
  athleteId: string;
  todayYmd: string;
  currentWeekNumber: number | null;
  currentWeekCalendarStatus: "past" | "live" | "upcoming" | "unpublished";
  currentWeekPublished: boolean;
  currentWeekSessions: CoachAttentionSession[];
  previousWeekSessions: CoachAttentionSession[];
  recentCheckIns: CoachAttentionCheckIn[];
  currentWeekCheckIn: CoachAttentionCheckIn | null;
  recentReadiness: CoachAttentionReadiness[];
  pendingBenchmarks: CoachAttentionBenchmark[];
};

function weekdayIndexMon0(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(dt.getTime())) return null;
  return (dt.getUTCDay() + 6) % 7;
}

function isOptionalSlot(slot: string): boolean {
  return slot.trim().toLowerCase() === "optional";
}

export function evaluateCoachAttentionFlags(input: CoachAttentionInput): CoachAttentionFlag[] {
  const flags: CoachAttentionFlag[] = [];
  const { todayYmd } = input;

  if (input.pendingBenchmarks.length > 0) {
    const labels = input.pendingBenchmarks.map((b) => b.label || b.type);
    const latest = input.pendingBenchmarks[0];
    flags.push({
      id: `pending_benchmark:${input.athleteId}`,
      code: "pending_benchmark",
      severity: "warn",
      title: "Pending benchmark",
      reason: `${input.pendingBenchmarks.length} athlete submission(s) waiting for coach review: ${labels.join(", ")}.`,
      source: "benchmark",
      date: latest?.resultDate ?? null,
      sessionId: null,
      sessionName: null,
      actionTab: "Performance Profile",
      actionLabel: "Review pending benchmark",
    });
  }

  for (const session of input.currentWeekSessions) {
    const date = session.dateYmd;
    if (!date) continue;
    const due = date <= todayYmd;
    const missed = date < todayYmd;
    if (session.isKey && due && !session.completed) {
      flags.push({
        id: `key_session_incomplete:${session.id}`,
        code: "key_session_incomplete",
        severity: "critical",
        title: "Key session incomplete",
        reason: `Key session "${session.name}" (${session.dayOfWeek}${date ? ` · ${date}` : ""}) is not completed.`,
        source: "programme_session",
        date,
        sessionId: session.id,
        sessionName: session.name,
        actionTab: "Weekly Review",
        actionLabel: "Review week",
      });
      continue;
    }
    if (!session.isKey && missed && !session.completed && !isOptionalSlot(session.slot)) {
      flags.push({
        id: `missed_programmed_session:${session.id}`,
        code: "missed_programmed_session",
        severity: "warn",
        title: "Missed programmed session",
        reason: `Programmed session "${session.name}" was due ${date} and is not completed.`,
        source: "programme_session",
        date,
        sessionId: session.id,
        sessionName: session.name,
        actionTab: "Weekly Review",
        actionLabel: "Review week",
      });
    }
  }

  for (const session of input.currentWeekSessions) {
    if (!isHighRpeVsPrescribed(session.loggedRpe, session.prescribedRpeMax)) continue;
    flags.push({
      id: `high_rpe_vs_prescribed:${session.id}`,
      code: "high_rpe_vs_prescribed",
      severity: "warn",
      title: "High RPE vs prescribed",
      reason: `Logged RPE ${session.loggedRpe} is more than 1 above prescribed max ${session.prescribedRpeMax} on "${session.name}".`,
      source: "programme_session",
      date: session.dateYmd,
      sessionId: session.id,
      sessionName: session.name,
      actionTab: "Weekly Review",
      actionLabel: "Review week",
    });
  }

  const checkIn = input.currentWeekCheckIn;
  if (checkIn && (isHighSoreness(checkIn.soreness) || Boolean(checkIn.painNiggles?.trim()))) {
    const bits = [
      isHighSoreness(checkIn.soreness) ? `soreness ${checkIn.soreness}/10` : null,
      checkIn.painNiggles?.trim() ? `pain/niggles: ${checkIn.painNiggles.trim()}` : null,
    ].filter(Boolean);
    flags.push({
      id: `pain_soreness:checkin:${checkIn.id}`,
      code: "pain_soreness",
      severity: "warn",
      title: "Pain or high soreness reported",
      reason: `Weekly check-in week ${checkIn.weekNumber}: ${bits.join(" · ")}. Not a diagnosis.`,
      source: "weekly_check_in",
      date: checkIn.submittedAt,
      sessionId: null,
      sessionName: null,
      actionTab: "Check-Ins",
      actionLabel: "Open weekly check-in",
    });
  }

  for (const session of [...input.currentWeekSessions, ...input.previousWeekSessions]) {
    const pain = session.painOrTightness?.trim();
    if (!pain) continue;
    flags.push({
      id: `pain_soreness:session:${session.id}`,
      code: "pain_soreness",
      severity: "warn",
      title: "Pain or tightness logged",
      reason: `Session "${session.name}" log includes pain/tightness: ${pain}. Not a diagnosis.`,
      source: "programme_session",
      date: session.dateYmd,
      sessionId: session.id,
      sessionName: session.name,
      actionTab: "Weekly Review",
      actionLabel: "Review week",
    });
  }

  const highSorenessDays = input.recentReadiness.filter((r) => isHighSoreness(r.muscleSoreness));
  if (highSorenessDays.length > 0) {
    const latest = highSorenessDays[0];
    flags.push({
      id: `pain_soreness:readiness:${input.athleteId}`,
      code: "pain_soreness",
      severity: "warn",
      title: "High daily soreness",
      reason: `${highSorenessDays.length} readiness day(s) with muscle soreness ≥ 8 (latest ${latest.localDate}, ${latest.muscleSoreness}/10). Not a diagnosis.`,
      source: "daily_readiness",
      date: latest.localDate,
      sessionId: null,
      sessionName: null,
      actionTab: "Weekly Review",
      actionLabel: "Review week",
    });
  }

  const unwellDays = input.recentReadiness.filter((r) => r.feelingUnwell);
  if (unwellDays.length > 0) {
    const latest = unwellDays[0];
    flags.push({
      id: `illness:readiness:${input.athleteId}`,
      code: "illness",
      severity: "warn",
      title: "Feeling unwell flagged",
      reason: `Daily readiness marked feeling unwell on ${unwellDays.map((d) => d.localDate).join(", ")}. Reported flag only — not a diagnosis.`,
      source: "daily_readiness",
      date: latest.localDate,
      sessionId: null,
      sessionName: null,
      actionTab: "Weekly Review",
      actionLabel: "Review week",
    });
  }

  const illnessCheckIns = input.recentCheckIns.filter(
    (c) => textLooksLikeIllness(c.painNiggles) || textLooksLikeIllness(c.biggestStruggle)
  );
  for (const row of illnessCheckIns) {
    flags.push({
      id: `illness:checkin:${row.id}`,
      code: "illness",
      severity: "warn",
      title: "Illness mentioned in check-in",
      reason: `Week ${row.weekNumber} check-in text mentions illness/unwell. Reported words only — not a diagnosis.`,
      source: "weekly_check_in",
      date: row.submittedAt,
      sessionId: null,
      sessionName: null,
      actionTab: "Check-Ins",
      actionLabel: "Open weekly check-in",
    });
  }

  const heavyLegSessions = [...input.currentWeekSessions, ...input.previousWeekSessions].filter((s) =>
    textMentionsHeavyLegs(s.notes)
  );
  if (heavyLegSessions.length >= 2) {
    flags.push({
      id: `repeated_heavy_legs:${input.athleteId}`,
      code: "repeated_heavy_legs",
      severity: "warn",
      title: "Repeated heavy legs notes",
      reason: `${heavyLegSessions.length} session notes in the current and previous week mention "heavy legs": ${heavyLegSessions.map((s) => s.name).join(", ")}.`,
      source: "programme_session",
      date: heavyLegSessions[0]?.dateYmd ?? null,
      sessionId: heavyLegSessions[0]?.id ?? null,
      sessionName: heavyLegSessions[0]?.name ?? null,
      actionTab: "Weekly Review",
      actionLabel: "Review week",
    });
  }

  const withEnergy = input.recentCheckIns.filter((c) => c.energy != null).slice(0, 2);
  if (withEnergy.length >= 2 && withEnergy.every((c) => isLowEnergy(c.energy))) {
    flags.push({
      id: `repeated_low_energy:${input.athleteId}`,
      code: "repeated_low_energy",
      severity: "warn",
      title: "Repeated low energy",
      reason: `Last two submitted check-ins with energy scores are both ≤ 4 (week ${withEnergy[0].weekNumber}: ${withEnergy[0].energy}, week ${withEnergy[1].weekNumber}: ${withEnergy[1].energy}).`,
      source: "weekly_check_in",
      date: withEnergy[0].submittedAt,
      sessionId: null,
      sessionName: null,
      actionTab: "Check-Ins",
      actionLabel: "Open weekly check-in",
    });
  }

  const liveWeekLateEnough = (() => {
    if (input.currentWeekCalendarStatus === "past") return true;
    if (input.currentWeekCalendarStatus !== "live") return false;
    const idx = weekdayIndexMon0(todayYmd);
    return idx != null && idx >= 3;
  })();

  if (
    input.currentWeekPublished &&
    liveWeekLateEnough &&
    !input.currentWeekCheckIn &&
    (input.currentWeekCalendarStatus === "live" || input.currentWeekCalendarStatus === "past")
  ) {
    flags.push({
      id: `missing_weekly_check_in:${input.athleteId}:${input.currentWeekNumber ?? "na"}`,
      code: "missing_weekly_check_in",
      severity: "warn",
      title: "Missing weekly check-in",
      reason:
        input.currentWeekCalendarStatus === "live"
          ? `Weekly check-in not submitted for the live week (flagged from Thursday onward).`
          : `Weekly check-in not submitted for the past published week${input.currentWeekNumber != null ? ` ${input.currentWeekNumber}` : ""}.`,
      source: "weekly_check_in",
      date: todayYmd,
      sessionId: null,
      sessionName: null,
      actionTab: "Check-Ins",
      actionLabel: "Open weekly check-in",
    });
  }

  return flags;
}

/** Alias used by older C drafts. */
export const evaluateCommandCentreFlags = evaluateCoachAttentionFlags;
