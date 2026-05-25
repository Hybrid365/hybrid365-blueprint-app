"use client";

import {
  formatWeekDateRangeFromYmd,
  isMondayYmd,
  PROGRAMME_START_MUST_BE_MONDAY,
  weekDateRangeFromProgrammeStart,
} from "@/app/lib/hyroxProgrammeDates";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";

export function CoachProgrammeStartDateControl({
  value,
  onChange,
  blockNumber,
  disabled,
  saving,
  savedStartDate,
}: {
  value: string;
  onChange: (ymd: string) => void;
  blockNumber: number;
  disabled?: boolean;
  saving?: boolean;
  /** Athlete record start date — warn when not Monday without blocking the form. */
  savedStartDate?: string | null;
}) {
  const preview = ([1, 2, 3, 4] as const).map((cycle) => {
    const globalWeek = globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle);
    const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(value, globalWeek);
    return { cycle, range: formatWeekDateRangeFromYmd(startYmd, endYmd) };
  });

  const valueIsMonday = isMondayYmd(value);
  const savedNotMonday =
    savedStartDate?.trim() && !isMondayYmd(savedStartDate) && savedStartDate !== value;

  return (
    <fieldset className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <legend className="text-sm font-bold text-white">Programme start date</legend>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
        Week 1 must start on a <strong className="font-semibold text-zinc-400">Monday</strong> so
        session days (Mon–Sun) match calendar dates for the athlete.
      </p>
      {savedNotMonday ? (
        <p className="mt-2 rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/90">
          Saved start date ({savedStartDate}) is not a Monday. Choose a Monday below and republish
          so week and session dates align.
        </p>
      ) : null}
      <label className="mt-3 block text-xs text-zinc-500">
        Week 1 starts on (Monday)
        <input
          type="date"
          value={value}
          disabled={disabled || saving}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        />
      </label>
      {!valueIsMonday && value ? (
        <p className="mt-2 text-xs text-red-300/90" role="alert">
          {PROGRAMME_START_MUST_BE_MONDAY}
        </p>
      ) : null}
      <ul className="mt-3 grid gap-1 text-[10px] text-zinc-500 sm:grid-cols-2">
        {preview.map((p) => (
          <li key={p.cycle}>
            W{p.cycle}: {p.range}
            {valueIsMonday ? " (Mon–Sun)" : null}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
