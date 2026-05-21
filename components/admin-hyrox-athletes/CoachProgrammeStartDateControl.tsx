"use client";

import { formatWeekDateRangeFromYmd, weekDateRangeFromProgrammeStart } from "@/app/lib/hyroxProgrammeDates";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";

export function CoachProgrammeStartDateControl({
  value,
  onChange,
  blockNumber,
  disabled,
  saving,
}: {
  value: string;
  onChange: (ymd: string) => void;
  blockNumber: number;
  disabled?: boolean;
  saving?: boolean;
}) {
  const preview = ([1, 2, 3, 4] as const).map((cycle) => {
    const globalWeek = globalWeekForBlock(blockNumber as 1 | 2 | 3, cycle);
    const { startYmd, endYmd } = weekDateRangeFromProgrammeStart(value, globalWeek);
    return { cycle, range: formatWeekDateRangeFromYmd(startYmd, endYmd) };
  });

  return (
    <fieldset className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <legend className="text-sm font-bold text-white">Programme start date</legend>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
        This sets Week 1 start date and controls which weeks appear live or upcoming for the
        athlete.
      </p>
      <label className="mt-3 block text-xs text-zinc-500">
        Week 1 starts on
        <input
          type="date"
          value={value}
          disabled={disabled || saving}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        />
      </label>
      <ul className="mt-3 grid gap-1 text-[10px] text-zinc-500 sm:grid-cols-2">
        {preview.map((p) => (
          <li key={p.cycle}>
            W{p.cycle}: {p.range}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
