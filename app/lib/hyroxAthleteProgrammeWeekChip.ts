import type {
  AthleteProgrammeWeekBundle,
  AthleteWeekCalendarStatus,
} from "@/app/lib/hyroxAthleteProgrammeTypes";
import {
  deriveWeekCalendarStatusForAthleteWeek,
  resolveAthleteWeekDateRange,
  type ResolvedAthleteWeekDates,
} from "@/app/lib/hyroxProgrammeDates";

export type ProgrammeWeekChipDebug = {
  weekNumber: number;
  rawStart: string | null;
  rawEnd: string | null;
  resolvedStart: string | null;
  resolvedEnd: string | null;
  status: AthleteWeekCalendarStatus | "not_generated";
  labelActuallyRendered: string | null;
  dateSource: ResolvedAthleteWeekDates["source"] | "payload_label" | "none";
  payloadDateRangeLabel: string | null;
  programmeStartUsed: string | null;
  dbMismatchWarning: string | null;
  sessionsTotalForWeek: number;
  sessionsRenderedForWeek: number;
  programmeWeekId: string | null;
};

function chipDebugSessionFields(bundle: AthleteProgrammeWeekBundle | null | undefined) {
  const sessionsTotalForWeek = bundle?.sessions?.length ?? 0;
  return {
    sessionsTotalForWeek,
    sessionsRenderedForWeek: sessionsTotalForWeek,
    programmeWeekId: bundle?.week?.id ?? null,
  };
}

export type ProgrammeWeekChipMeta = {
  dateRangeLabel: string | null;
  calendarStatus: AthleteWeekCalendarStatus | "not_generated";
  resolved: ResolvedAthleteWeekDates | null;
  debug: ProgrammeWeekChipDebug;
};

/** Effective programme start for week date math (athlete row, payload, or W1 DB start). */
export function resolveEffectiveProgrammeStartYmd(
  programmeStartDate: string | null | undefined,
  athleteProgrammeStartDate: string | null | undefined,
  programmeWeeks?: Pick<AthleteProgrammeWeekBundle, "weekNumber" | "week">[] | null
): string | null {
  const direct = programmeStartDate?.trim() || athleteProgrammeStartDate?.trim();
  if (direct) return direct;

  const w1 = programmeWeeks?.find((w) => w.weekNumber === 1);
  const w1Start = w1?.week?.week_start_date?.trim();
  if (w1Start && /^\d{4}-\d{2}-\d{2}$/.test(w1Start)) return w1Start;

  const w1BundleStart = w1 && "weekStartDate" in w1 ? (w1 as AthleteProgrammeWeekBundle).weekStartDate?.trim() : null;
  if (w1BundleStart && /^\d{4}-\d{2}-\d{2}$/.test(w1BundleStart)) return w1BundleStart;

  return null;
}

export function publishedWeekRawDbDates(bundle: {
  week?: { week_start_date?: string | null; week_end_date?: string | null } | null;
  weekStartDate?: string | null;
  weekEndDate?: string | null;
}): { rawStart: string | null; rawEnd: string | null } {
  return {
    rawStart: bundle.week?.week_start_date?.trim() || bundle.weekStartDate?.trim() || null,
    rawEnd: bundle.week?.week_end_date?.trim() || bundle.weekEndDate?.trim() || null,
  };
}

/** Single source of truth for athlete programme week chip label + calendar status. */
export function buildAthleteProgrammeWeekChipMeta(params: {
  bundle: AthleteProgrammeWeekBundle | null | undefined;
  weekNumber: number;
  programmeStartYmd: string | null;
}): ProgrammeWeekChipMeta {
  const { bundle, weekNumber, programmeStartYmd } = params;
  const { rawStart, rawEnd } = bundle
    ? publishedWeekRawDbDates(bundle)
    : { rawStart: null, rawEnd: null };

  const payloadDateRangeLabel = bundle?.dateRangeLabel ?? null;

  if (!bundle?.generated) {
    return {
      dateRangeLabel: null,
      calendarStatus: "not_generated",
      resolved: null,
      debug: {
        weekNumber,
        rawStart,
        rawEnd,
        resolvedStart: null,
        resolvedEnd: null,
        status: "not_generated",
        labelActuallyRendered: null,
        dateSource: "none",
        payloadDateRangeLabel,
        programmeStartUsed: programmeStartYmd,
        dbMismatchWarning: null,
        ...chipDebugSessionFields(bundle),
      },
    };
  }

  if (bundle.calendarStatus === "locked") {
    const resolved = programmeStartYmd
      ? resolveAthleteWeekDateRange({
          programmeStartYmd,
          weekNumber,
          dbWeekStartYmd: rawStart,
          dbWeekEndYmd: rawEnd,
        })
      : null;
    const label = resolved?.dateRangeLabel ?? payloadDateRangeLabel;
    return {
      dateRangeLabel: label,
      calendarStatus: "locked",
      resolved,
      debug: {
        weekNumber,
        rawStart,
        rawEnd,
        resolvedStart: resolved?.startYmd ?? null,
        resolvedEnd: resolved?.endYmd ?? null,
        status: "locked",
        labelActuallyRendered: label,
        dateSource: resolved?.source ?? (label ? "payload_label" : "none"),
        payloadDateRangeLabel,
        programmeStartUsed: programmeStartYmd,
        dbMismatchWarning: resolved?.dbMismatchWarning ?? null,
        ...chipDebugSessionFields(bundle),
      },
    };
  }

  const resolved = programmeStartYmd
    ? resolveAthleteWeekDateRange({
        programmeStartYmd,
        weekNumber,
        dbWeekStartYmd: rawStart,
        dbWeekEndYmd: rawEnd,
      })
    : null;

  const dateRangeLabel = resolved?.dateRangeLabel ?? payloadDateRangeLabel ?? null;

  let calendarStatus: AthleteWeekCalendarStatus | "not_generated" = "not_generated";
  if (programmeStartYmd) {
    calendarStatus = deriveWeekCalendarStatusForAthleteWeek({
      programmeStartYmd,
      weekNumber,
      dbWeekStartYmd: rawStart,
      dbWeekEndYmd: rawEnd,
    });
  } else if (bundle.calendarStatus && bundle.calendarStatus !== "not_generated") {
    calendarStatus = bundle.calendarStatus;
  } else {
    calendarStatus = "upcoming";
  }

  return {
    dateRangeLabel,
    calendarStatus,
    resolved,
    debug: {
      weekNumber,
      rawStart,
      rawEnd,
      resolvedStart: resolved?.startYmd ?? null,
      resolvedEnd: resolved?.endYmd ?? null,
      status: calendarStatus,
      labelActuallyRendered: dateRangeLabel,
      dateSource: resolved?.source ?? (payloadDateRangeLabel ? "payload_label" : "none"),
      payloadDateRangeLabel,
      programmeStartUsed: programmeStartYmd,
      dbMismatchWarning: resolved?.dbMismatchWarning ?? null,
      ...chipDebugSessionFields(bundle),
    },
  };
}

export function calendarStatusToChipMode(
  status: AthleteWeekCalendarStatus | "not_generated" | undefined
): "active" | "upcoming" | "past" | "not_generated" | "locked" {
  if (!status || status === "not_generated") return "not_generated";
  if (status === "locked") return "locked";
  if (status === "live") return "active";
  if (status === "past") return "past";
  return "upcoming";
}
