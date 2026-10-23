/**
 * Frozen Workstream B analytics contract (consumer copy).
 * Command Centre must not invent a second engine or fake athlete numbers.
 *
 * Expected import once B lands:
 *   import { getHyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
 */

export type HyroxAnalyticsModality =
  | "run"
  | "bike"
  | "skierg"
  | "rowerg"
  | "strength"
  | "hyrox_specific"
  | "other";

export type HyroxWeekSummary = {
  startDate: string;
  endDate: string;
  completeWeek: boolean;
  plannedSessions: number;
  completedSessions: number;
  completionPct: number | null;
  runDistanceKm: number | null;
  trainingDurationMinutes: number | null;
  averageRpe: number | null;
  sessionRpeLoad: number | null;
  keySessionsCompleted: number;
  keySessionsPlanned: number;
};

export type HyroxAthleteAnalytics = {
  athleteId: string;
  generatedAt: string;
  currentWeek: HyroxWeekSummary;
  previousWeek: HyroxWeekSummary | null;
  rolling4: {
    runDistanceKm: number | null;
    trainingDurationMinutes: number | null;
    completionPct: number | null;
    averageRpe: number | null;
  };
  distribution: {
    modality: HyroxAnalyticsModality;
    sessionCount: number;
    durationMinutes: number | null;
  }[];
  benchmarks: {
    type: string;
    label: string;
    points: {
      date: string;
      display: string;
      normalizedValue: number;
      normalizedUnit: string;
      source: string;
      status: string;
    }[];
  }[];
  unsupported: string[];
};

export type GetHyroxAthleteAnalytics = (input: {
  athleteId: string;
  now?: Date;
}) => Promise<HyroxAthleteAnalytics | null>;
