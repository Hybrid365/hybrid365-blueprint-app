"use client";

import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import type { DailyReadinessInputs } from "@/app/lib/hyrox-team/modules/today/readinessScore";
import { CountUp, AnimatedProgressBar } from "./motion";
import { HomeReadinessTile, HomeCheckInTile } from "./HomeReadinessTile";

type Props = {
  todayV2Enabled: boolean;
  readiness: HyroxDailyReadinessRow | null;
  readinessSaving?: boolean;
  readinessDisabled?: boolean;
  onSubmitReadiness: (input: DailyReadinessInputs & { timezone: string }) => Promise<boolean>;
  weeklyCompletionPct: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  checkInStatus: string;
  checkInSub: string;
  checkInDue: boolean;
  readOnly?: boolean;
};

export function HomeWeeklyStateRow({
  todayV2Enabled,
  readiness,
  readinessSaving,
  readinessDisabled,
  onSubmitReadiness,
  weeklyCompletionPct,
  sessionsCompleted,
  sessionsPlanned,
  checkInStatus,
  checkInSub,
  checkInDue,
  readOnly,
}: Props) {
  const columns = todayV2Enabled ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section aria-label="Weekly state">
      <div className={`grid gap-3 ${columns}`}>
        {todayV2Enabled ? (
          <HomeReadinessTile
            readiness={readiness}
            saving={readinessSaving}
            disabled={readinessDisabled}
            onSubmit={onSubmitReadiness}
          />
        ) : null}

        <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Weekly completion
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            <CountUp value={weeklyCompletionPct} suffix="%" />
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {sessionsCompleted}/{sessionsPlanned} sessions
          </p>
          <div className="mt-3">
            <AnimatedProgressBar value={weeklyCompletionPct} />
          </div>
        </div>

        <HomeCheckInTile
          status={checkInStatus}
          sub={checkInSub}
          due={checkInDue}
          readOnly={readOnly}
        />
      </div>
    </section>
  );
}
