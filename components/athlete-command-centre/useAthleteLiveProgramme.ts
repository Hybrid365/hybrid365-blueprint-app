"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AthleteProgrammeApiState,
  AthleteProgrammeVisibility,
} from "@/app/lib/hyroxProgrammeServer";
import type {
  AthleteProgrammeWeekBundle,
  AthleteWeekCalendarStatus,
} from "@/app/lib/hyroxAthleteProgrammeTypes";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type { AthleteProgrammeWeekBundle, AthleteWeekCalendarStatus };

export type AthleteLiveProgrammeWeek = {
  id: string;
  block_number: number;
  week_number: number;
  weekly_focus: string | null;
  coach_note: string | null;
  athlete_facing_note: string | null;
};

export type AthleteLiveProgrammePayload = {
  state: AthleteProgrammeApiState;
  visibility: AthleteProgrammeVisibility;
  published: boolean;
  programmeStatus: string;
  athleteStatus: string;
  programmeStartDate: string | null;
  programmeLengthWeeks: number;
  liveGlobalWeek: number;
  athlete: {
    name: string;
    race_name: string | null;
    race_date: string | null;
    race_category: string | null;
    target_time: string | null;
    current_block: number;
    current_week: number;
    programme_start_date?: string | null;
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
  programmeStartDate?: string | null;
  programmeLengthWeeks?: number;
  liveGlobalWeek?: number;
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
    programmeStartDate: json.programmeStartDate ?? json.athlete?.programme_start_date ?? null,
    programmeLengthWeeks: json.programmeLengthWeeks ?? 12,
    liveGlobalWeek: json.liveGlobalWeek ?? json.athlete?.current_week ?? 1,
    athlete: json.athlete ?? {
      name: "Athlete",
      race_name: null,
      race_date: null,
      race_category: null,
      target_time: null,
      current_block: 1,
      current_week: 1,
      programme_start_date: null,
    },
    week,
    sessions: json.sessions ?? [],
    programmeWeeks: json.programmeWeeks ?? [],
    weekRationale: json.weekRationale ?? null,
  };
}

type UseAthleteLiveProgrammeOptions = {
  /** Keep existing programme data when API auth fails but layout already confirmed session. */
  preserveDataOnAuthFailure?: boolean;
};

export function useAthleteLiveProgramme(
  enabled: boolean,
  options?: UseAthleteLiveProgrammeOptions
) {
  const [data, setData] = useState<AthleteLiveProgrammePayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hyrox/athlete/programme", {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = (await res.json()) as ProgrammeApiJson;
      if (!res.ok || !json.success) {
        const isAuthFailure =
          res.status === 401 ||
          json.error === "Not signed in" ||
          (json as { reason?: string }).reason === "NO_AUTH_SESSION";
        const message =
          isAuthFailure && options?.preserveDataOnAuthFailure
            ? "Programme API could not refresh your session. Reload the page if data looks stale."
            : (json.error ?? "Could not load programme.");
        setError(message);
        if (!(isAuthFailure && options?.preserveDataOnAuthFailure)) {
          setData(null);
        }
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
  }, [enabled, options?.preserveDataOnAuthFailure]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
