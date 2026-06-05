"use client";

import Link from "next/link";
import {
  Activity,
  Calendar,
  Flag,
  Gauge,
  MapPin,
  Target,
  Timer,
  Wrench,
} from "lucide-react";
import type { CommunityHyroxDetails } from "@/app/lib/communityHyroxAssessment";
import {
  deriveHyroxPriorityChips,
  formatHyroxMetric,
  getHyroxRaceCountdown,
  hasLimitedHyroxEquipment,
  hyroxCategoryLabel,
  hyroxDivisionLabel,
  hyroxEquipmentLabel,
  HYROX_ROLLOUT_COPY,
  stationWeaknessLabel,
} from "@/app/lib/communityHyroxDashboard";

function CardShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
      {children}
    </span>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  const muted = value === "Not logged yet";
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 py-2 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-right text-sm font-medium ${muted ? "text-zinc-600" : "text-zinc-200"}`}>
        {value}
      </span>
    </div>
  );
}

type Props = {
  details: CommunityHyroxDetails;
};

export function HyroxTrackHomeSection({ details }: Props) {
  const countdown = getHyroxRaceCountdown(details.race_date);
  const category = hyroxCategoryLabel(details.category);
  const division = hyroxDivisionLabel(details.division);
  const limitedEquipment = hasLimitedHyroxEquipment(details);
  const priorities = deriveHyroxPriorityChips(details);

  return (
    <section className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-zinc-950 to-black p-5 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400/90">HYROX Track</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">HYROX Track</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
            Your programme is being shaped around HYROX performance, station durability and running under
            fatigue.
          </p>
        </div>
        {countdown && !countdown.isPast ? (
          <div className="shrink-0 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">Race countdown</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{countdown.daysRemaining}</p>
            <p className="text-xs text-zinc-400">{countdown.label}</p>
          </div>
        ) : null}
      </div>

      <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs leading-relaxed text-zinc-500">
        {HYROX_ROLLOUT_COPY}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardShell title="Race target" icon={<Calendar className="h-4 w-4" />}>
          <div className="space-y-1">
            {details.race_date ? (
              <MetricRow label="Race date" value={details.race_date} />
            ) : (
              <MetricRow label="Race date" value="Not logged yet" />
            )}
            {details.race_location ? (
              <div className="flex items-center gap-1.5 py-2 text-sm text-zinc-300">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                {details.race_location}
              </div>
            ) : null}
            {(category || division) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {category ? <Chip>{category}</Chip> : null}
                {division ? <Chip>{division}</Chip> : null}
              </div>
            )}
            <MetricRow label="Target time" value={formatHyroxMetric(details.target_time)} />
            {countdown ? (
              <MetricRow label="Countdown" value={countdown.label} />
            ) : null}
          </div>
        </CardShell>

        <CardShell title="Station focus" icon={<Target className="h-4 w-4" />}>
          {details.station_weaknesses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {details.station_weaknesses.slice(0, 3).map((w) => (
                <Chip key={w}>{stationWeaknessLabel(w)}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Not logged yet</p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            These will help guide your station focus and future HYROX progression.
          </p>
        </CardShell>

        <CardShell title="Equipment access" icon={<Wrench className="h-4 w-4" />}>
          {details.equipment.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {details.equipment.map((e) => (
                <Chip key={e}>{hyroxEquipmentLabel(e)}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Not logged yet</p>
          )}
          {limitedEquipment ? (
            <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
              Specificity may be reduced where HYROX equipment is unavailable. Substitutions will be used
              where needed.
            </p>
          ) : null}
        </CardShell>

        <CardShell title="Engine benchmarks" icon={<Gauge className="h-4 w-4" />}>
          <MetricRow label="5K" value={formatHyroxMetric(details.current_5k_time)} />
          <MetricRow label="10K" value={formatHyroxMetric(details.current_10k_time)} />
          <MetricRow label="1 km Ski" value={formatHyroxMetric(details.ski_1k_time)} />
          <MetricRow label="1 km Row" value={formatHyroxMetric(details.row_1k_time)} />
          <MetricRow
            label="Weekly run volume"
            value={formatHyroxMetric(details.weekly_run_volume_km, details.weekly_run_volume_km != null ? " km" : "")}
          />
        </CardShell>

        <CardShell title="Current HYROX priorities" icon={<Activity className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <Chip key={p}>{p}</Chip>
            ))}
          </div>
        </CardShell>

        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Keep your profile current</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Update race details, weaknesses and equipment in your Athlete Profile as your HYROX prep
              evolves.
            </p>
          </div>
          <Link
            href="/dashboard/assessment"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15"
          >
            Review Athlete Profile
          </Link>
        </div>
      </div>
    </section>
  );
}
