"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type {
  HubRangeKey,
  PerformanceHubPayload,
} from "@/app/lib/hyrox-team/modules/performanceHub/types";
import {
  executionStateLabel,
  formatMetricNumber,
} from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { HubTrendChart } from "./HubTrendChart";
import { CHART_COLORS } from "@/components/athlete-command-centre/chartTheme";
import {
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
  eyebrowClass,
} from "@/components/athlete-command-centre/athleteUi";

const RANGES: Array<{ key: HubRangeKey; label: string }> = [
  { key: "this_week", label: "This week" },
  { key: "last_4", label: "Last 4 weeks" },
  { key: "last_12", label: "Last 12 weeks" },
];

function stateChipClass(state: string) {
  if (state === "on_plan") return "border-emerald-500/35 text-emerald-300";
  if (state === "below_plan") return "border-amber-500/35 text-amber-200";
  if (state === "above_plan") return "border-sky-500/35 text-sky-300";
  return "border-zinc-600 text-zinc-400";
}

export function PerformanceHubExperience() {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const athleteId =
    adminPreview?.portalAthlete.id ?? portal?.portalAthlete?.id ?? null;
  const timezone =
    adminPreview?.athleteTimezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const [range, setRange] = useState<HubRangeKey>("this_week");
  const [hub, setHub] = useState<PerformanceHubPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const fetchKey = `${athleteId ?? "none"}:${range}:${timezone}`;

  const load = useCallback(
    async (athlete: string, rangeKey: HubRangeKey) => {
      setLoading(true);
      setError(null);
      try {
        const url = adminPreview
          ? `/api/hyrox/athletes/${encodeURIComponent(athlete)}/performance-hub-summary?full=1&range=${rangeKey}&timezone=${encodeURIComponent(timezone)}`
          : `/api/hyrox/athlete/performance-hub?range=${rangeKey}&timezone=${encodeURIComponent(timezone)}&expectedAthleteId=${encodeURIComponent(athlete)}`;
        const res = await fetch(url, { credentials: "include" });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          hub?: PerformanceHubPayload;
        };
        if (!res.ok || !json.success || !json.hub) {
          setHub(null);
          setError(json.error ?? "Could not load Performance Hub.");
          return;
        }
        setHub(json.hub);
      } catch {
        setHub(null);
        setError("Could not load Performance Hub.");
      } finally {
        setLoading(false);
      }
    },
    [adminPreview, timezone]
  );

  if (athleteId && loadedKey !== fetchKey) {
    setLoadedKey(fetchKey);
    void load(athleteId, range);
  }

  const charts = useMemo(() => {
    if (!hub) return [];
    return [
      {
        title: "Weekly running distance",
        description: "Logged run km by week",
        dataKey: "runDistanceKm" as const,
        unit: "km",
      },
      {
        title: "Weekly training hours",
        description: "Structured logged duration",
        dataKey: "trainingHours" as const,
        unit: "h",
      },
      {
        title: "Threshold / quality minutes",
        description: "Classified quality sessions",
        dataKey: "thresholdMinutes" as const,
        unit: "min",
        color: CHART_COLORS.blue,
      },
      {
        title: "Easy aerobic minutes",
        description: "Classified easy sessions",
        dataKey: "easyMinutes" as const,
        unit: "min",
      },
      {
        title: "Strength sessions",
        description: "Completed / logged strength",
        dataKey: "strengthSessions" as const,
        unit: "",
      },
      {
        title: "HYROX sessions",
        description: "Completed / logged HYROX work",
        dataKey: "hyroxSessions" as const,
        unit: "",
      },
      {
        title: "Average RPE",
        description: "Mean logged RPE",
        dataKey: "averageRpe" as const,
        unit: "",
      },
      {
        title: "Readiness trend",
        description: "Weekly average readiness indicator",
        dataKey: "readinessAvg" as const,
        unit: "",
      },
      {
        title: "Bodyweight",
        description: "Where supplied in readiness",
        dataKey: "bodyweightKg" as const,
        unit: "kg",
      },
      {
        title: "Session completion",
        description: "% completed vs scheduled",
        dataKey: "completionPct" as const,
        unit: "%",
      },
    ];
  }, [hub]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={eyebrowClass}>Performance Hub</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Training performance</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Real programme, log, readiness and check-in data only — no invented scores.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                range === r.key
                  ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-200"
                  : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading performance data…</p> : null}
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {hub ? (
        <>
          <section className={`${athleteCardHighlight} ${athleteCardPadding}`}>
            <p className={eyebrowClass}>{hub.range.label}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {hub.summary.slice(0, 8).map((m) => (
                <div key={m.key} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3" title={m.tooltip}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    {m.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">{m.display}</p>
                  {m.emptyReason ? (
                    <p className="mt-1 text-[10px] text-zinc-600">{m.emptyReason}</p>
                  ) : null}
                </div>
              ))}
            </div>
            {hub.dataNotes.length ? (
              <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                {hub.dataNotes.map((n) => (
                  <li key={n}>· {n}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Planned vs completed
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hub.plannedVsCompleted.map((card) => (
                <article
                  key={card.key}
                  className={`${athleteCard} ${athleteCardPadding}`}
                  title={card.tooltip}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{card.label}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stateChipClass(card.state)}`}
                    >
                      {executionStateLabel(card.state)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">Planned</p>
                      <p className="font-semibold text-zinc-200">
                        {card.planned == null
                          ? "—"
                          : `${formatMetricNumber(card.planned)}${card.unit ? ` ${card.unit}` : ""}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">Completed</p>
                      <p className="font-semibold text-zinc-200">
                        {card.completed == null
                          ? "—"
                          : `${formatMetricNumber(card.completed)}${card.unit ? ` ${card.unit}` : ""}`}
                      </p>
                    </div>
                  </div>
                  {card.pct != null ? (
                    <p className="mt-2 text-2xl font-bold text-yellow-400">{card.pct}%</p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      {card.emptyReason ?? "Partial Data"}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className={`${athleteCard} ${athleteCardPadding}`}>
            <h2 className="text-sm font-bold text-white">Training distribution</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Classified from activity type, intensity tags and session names. Low-confidence
              sessions appear as Other / Unclassified.
            </p>
            <ul className="mt-4 space-y-2">
              {hub.distribution.map((d) => (
                <li key={d.bucket} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 text-zinc-400">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-yellow-400/80"
                      style={{ width: `${d.sharePct ?? Math.min(100, d.sessionCount * 12)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs text-zinc-500">
                    {d.minutes != null ? `${d.minutes} min` : `${d.sessionCount} sess`}
                  </span>
                </li>
              ))}
              {!hub.distribution.length ? (
                <li className="text-sm text-zinc-500">Not enough structured data yet</li>
              ) : null}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
              Trends
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {charts.map((c) => (
                <HubTrendChart
                  key={c.dataKey}
                  title={c.title}
                  description={c.description}
                  data={hub.weeklySeries}
                  dataKey={c.dataKey}
                  unit={c.unit}
                  color={c.color}
                />
              ))}
            </div>
          </section>

          <section className={`${athleteCard} ${athleteCardPadding}`}>
            <h2 className="text-sm font-bold text-white">HYROX exposure</h2>
            <ul className="mt-3 space-y-2">
              {hub.hyroxExposures.map((row) => (
                <li
                  key={row.movement}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/70 py-2 text-sm last:border-0"
                >
                  <span className="font-medium text-zinc-200">{row.movement}</span>
                  {row.emptyReason ? (
                    <span className="text-xs text-zinc-500">{row.emptyReason}</span>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      {row.sessionsContaining} session(s)
                      {row.lastExposureYmd ? ` · last ${row.lastExposureYmd}` : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={`${athleteCard} ${athleteCardPadding}`}>
              <h2 className="text-sm font-bold text-white">Readiness indicator</h2>
              {hub.readiness.emptyReason && hub.readiness.currentScore == null ? (
                <p className="mt-2 text-sm text-zinc-500">{hub.readiness.emptyReason}</p>
              ) : (
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Current</dt>
                    <dd className="font-semibold text-white">
                      {hub.readiness.currentScore ?? "—"}
                      {hub.readiness.currentCategory
                        ? ` · ${hub.readiness.currentCategory}`
                        : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">7-day average</dt>
                    <dd className="font-semibold text-white">{hub.readiness.avg7d ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Trend</dt>
                    <dd className="font-semibold text-zinc-200">{hub.readiness.trend}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Missing days (7d)</dt>
                    <dd>{hub.readiness.missingDays}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">Illness / high soreness</dt>
                    <dd>
                      {hub.readiness.illnessDays} / {hub.readiness.highSorenessDays}
                    </dd>
                  </div>
                </dl>
              )}
              <p className="mt-3 text-xs text-zinc-500">
                Readiness is an indicator for you and your coach — not a medical score and not race
                readiness.
              </p>
            </div>

            <div className={`${athleteCard} ${athleteCardPadding}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-white">Benchmark preview</h2>
                <Link href="/athlete/testing" className="text-xs font-semibold text-yellow-400">
                  Testing →
                </Link>
              </div>
              {hub.benchmarks.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No submitted benchmarks yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {hub.benchmarks.map((b) => (
                    <li key={b.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-zinc-400">{b.label}</span>
                      <span className="text-right font-medium text-white">
                        {b.latest ?? "—"}
                        {b.date ? (
                          <span className="block text-[10px] font-normal text-zinc-500">{b.date}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
              Progress insights
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {hub.insights.map((insight) => (
                <article key={insight.id} className={`${athleteCard} ${athleteCardPadding}`}>
                  <h3 className="text-sm font-bold text-yellow-300">{insight.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{insight.body}</p>
                  <p className="mt-3 text-[10px] text-zinc-600">
                    Source: {insight.dataSource} · {insight.comparisonPeriod}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
