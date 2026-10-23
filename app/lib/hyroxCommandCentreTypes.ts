import type { CoachAttentionFlag } from "@/app/lib/hyroxCoachAttention";
import type { CommandCentreAnalyticsStatus } from "@/app/lib/hyroxCommandCentreAnalyticsAdapter";
import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";

export type CommandCentreCheckInSummary = {
  weekNumber: number;
  submittedAt: string | null;
  sleep: number | null;
  energy: number | null;
  soreness: number | null;
  painNiggles: string | null;
};

export type CommandCentreUpcomingKeySession = {
  id: string;
  name: string;
  dateYmd: string | null;
  dayOfWeek: string;
  slot: string;
};

export type CommandCentreThisWeek = {
  weekNumber: number | null;
  startDate: string | null;
  endDate: string | null;
  published: boolean;
  calendarStatus: "past" | "live" | "upcoming" | "unpublished";
  plannedSessions: number | null;
  completedSessions: number | null;
  completionPct: number | null;
  runDistanceKm: number | null;
  trainingDurationMinutes: number | null;
  averageRpe: number | null;
  sessionRpeLoad: number | null;
  keySessionsCompleted: number | null;
  keySessionsPlanned: number | null;
  latestCheckIn: CommandCentreCheckInSummary | null;
  pendingBenchmarkCount: number | null;
  pendingBenchmarkUnavailable: boolean;
  upcomingKeySession: CommandCentreUpcomingKeySession | null;
};

export type CommandCentreProfileAnchor = {
  key: "run5k" | "threshold" | "ski2k" | "row2k" | "ftp" | "hyroxRun";
  label: string;
  display: string | null;
  derived: string | null;
  resultDate: string | null;
};

export type CommandCentrePerformanceProfile = {
  unavailable: boolean;
  pendingCount: number | null;
  anchors: CommandCentreProfileAnchor[];
};

export type CommandCentreNotes = {
  athleteFacingNote: string | null;
  internalCoachNote: string | null;
};

export type CommandCentreRecentProgress = {
  previousWeekPlanned: number | null;
  previousWeekCompleted: number | null;
  previousWeekAverageRpe: number | null;
};

export type HyroxCommandCentrePayload = {
  athleteId: string;
  generatedAt: string;
  analyticsStatus: CommandCentreAnalyticsStatus;
  analytics: HyroxAthleteAnalytics | null;
  thisWeek: CommandCentreThisWeek;
  recentProgress: CommandCentreRecentProgress;
  needsAttention: CoachAttentionFlag[];
  performanceProfile: CommandCentrePerformanceProfile;
  notes: CommandCentreNotes;
};

/** @deprecated use HyroxCommandCentrePayload */
export type HyroxCoachCommandCentrePayload = HyroxCommandCentrePayload;
