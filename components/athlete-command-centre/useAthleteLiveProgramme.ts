"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type AthleteLiveProgrammeWeek = {
  id: string;
  block_number: number;
  week_number: number;
  weekly_focus: string | null;
  coach_note: string | null;
  athlete_facing_note: string | null;
};

export type AthleteProgrammeWeekBundle = {
  weekNumber: number;
  blockWeekInCycle: number;
  generated: boolean;
  week: AthleteLiveProgrammeWeek | null;
  weekRole: string;
  sessions: HyroxSession[];
};

export type AthleteLiveProgrammePayload = {
  state: AthleteProgrammeApiState;
  visibility: AthleteProgrammeVisibility;
  published: boolean;
  programmeStatus: string;
  athleteStatus: string;
  athlete: {
    name: string;
    race_name: string | null;
    race_date: string | null;
    race_category: string | null;
    target_time: string | null;
    current_block: number;
    current_week: number;
  };
  week: AthleteLiveProgrammeWeek | null;
  sessions: HyroxSession[];
  programmeWeeks: AthleteProgrammeWeekBundle[];
  weekRationale: {
    weekRole: string;
    whyMatters: string;
    prioritise: string[];
    coachNote: string;
  } | null;
};

type ProgrammeApiJson = {
  success?: boolean;
  error?: string;
  state?: AthleteProgrammeApiState;
  visibility?: AthleteProgrammeVisibility;
  published?: boolean;
  hasPublishedProgramme?: boolean;
  programmeStatus?: string;
  athleteStatus?: string;
  athlete?: AthleteLiveProgrammePayload["athlete"];
  programmeWeek?: AthleteLiveProgrammeWeek | null;
  week?: AthleteLiveProgrammeWeek | null;
  sessions?: HyroxSession[];
  programmeWeeks?: AthleteProgrammeWeekBundle[];
  sessionCount?: number;
  weekRationale?: AthleteLiveProgrammePayload["weekRationale"];
};

function mapProgrammeApi(json: ProgrammeApiJson): AthleteLiveProgrammePayload | null {
  if (!json.success) return null;
  const published = Boolean(json.published ?? json.hasPublishedProgramme);
  const state =
    json.state ??
    (published ? "published" : (json.visibility as AthleteProgrammeApiState) ?? "coach_reviewing");
  const week = json.programmeWeek ?? json.week ?? null;

  return {
    state,
    visibility: published ? "published" : (json.visibility ?? "coach_reviewing"),
    published,
    programmeStatus: json.programmeStatus ?? "",
    athleteStatus: json.athleteStatus ?? "",
    athlete: json.athlete ?? {
      name: "Athlete",
      race_name: null,
      race_date: null,
      race_category: null,
      target_time: null,
      current_block: 1,
      current_week: 1,
    },
    week,
    sessions: json.sessions ?? [],
    programmeWeeks: json.programmeWeeks ?? [],
    weekRationale: json.weekRationale ?? null,
  };
}

export function useAthleteLiveProgramme(enabled: boolean) {
  const [data, setData] = useState<AthleteLiveProgrammePayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/programme");
      const json = (await res.json()) as ProgrammeApiJson;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not load programme.");
        setData(null);
        return;
      }
      const mapped = mapProgrammeApi(json);
      setData(mapped);
      if (process.env.NODE_ENV === "development" && mapped) {
        console.log("[athlete-portal] programme API", {
          state: mapped.state,
          published: mapped.published,
          weekBundles: mapped.programmeWeeks.length,
          generatedWeeks: mapped.programmeWeeks.filter((w) => w.generated).length,
          activeSessions: mapped.sessions.length,
        });
      }
    } catch {
      setError("Network error loading programme.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
