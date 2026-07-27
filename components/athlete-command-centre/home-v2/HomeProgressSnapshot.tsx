"use client";

import { useCallback, useState } from "react";
import type { HubMetricValue, PerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/types";
import { AthletePortalNavLink } from "../AthletePortalNavLink";
import { athleteCard, athleteCardPadding, eyebrowClass } from "../athleteUi";
import { CountUp } from "./motion";
import { useAthletePortalOptional } from "../athletePortalContext";
import { useAthleteAdminPreview } from "../athletePortalAdminPreview";

type Props = {
  performanceHubEnabled: boolean;
  legacyMetrics?: Array<{ label: string; value: string; sub?: string }>;
  readOnly?: boolean;
};

function pickSnapshotMetrics(summary: HubMetricValue[]): HubMetricValue[] {
  const withValue = summary.filter((m) => m.value != null && m.display !== "—");
  if (withValue.length >= 2) return withValue.slice(0, 4);
  return summary.slice(0, 4);
}

function parseNumericDisplay(display: string): number | null {
  const n = Number.parseFloat(display.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function HomeProgressSnapshot({
  performanceHubEnabled,
  legacyMetrics = [],
  readOnly,
}: Props) {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const athleteId = adminPreview?.portalAthlete.id ?? portal?.portalAthlete?.id ?? null;
  const timezone =
    adminPreview?.athleteTimezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const [hub, setHub] = useState<PerformanceHubPayload | null>(null);
  const [loading, setLoading] = useState(performanceHubEnabled);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const fetchKey = `${athleteId ?? "none"}:hub-snapshot:${timezone}`;

  const load = useCallback(async () => {
    if (!athleteId || !performanceHubEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = adminPreview
        ? `/api/hyrox/athletes/${encodeURIComponent(athleteId)}/performance-hub-summary?full=1&range=this_week&timezone=${encodeURIComponent(timezone)}`
        : `/api/hyrox/athlete/performance-hub?range=this_week&timezone=${encodeURIComponent(timezone)}&expectedAthleteId=${encodeURIComponent(athleteId)}`;
      const res = await fetch(url, { credentials: "include" });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        hub?: PerformanceHubPayload;
      };
      if (!res.ok || !json.success || !json.hub) {
        setHub(null);
        setError(json.error ?? "Could not load progress data.");
        return;
      }
      setHub(json.hub);
    } catch {
      setHub(null);
      setError("Could not load progress data.");
    } finally {
      setLoading(false);
    }
  }, [athleteId, performanceHubEnabled, adminPreview, timezone]);

  if (performanceHubEnabled && athleteId && loadedKey !== fetchKey) {
    setLoadedKey(fetchKey);
    void load();
  }

  if (!performanceHubEnabled) {
    if (legacyMetrics.length === 0) return null;
    return (
      <LegacyProgressSnapshot metrics={legacyMetrics} readOnly={readOnly} />
    );
  }

  const metrics = hub ? pickSnapshotMetrics(hub.summary) : [];
  const sparse = !loading && metrics.every((m) => m.value == null);

  return (
    <section className={`${athleteCard} ${athleteCardPadding}`} aria-label="Progress snapshot">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={eyebrowClass}>Progress snapshot</p>
          <h2 className="mt-1 text-base font-bold text-white">This week at a glance</h2>
        </div>
        {!readOnly ? (
          <AthletePortalNavLink
            href="/athlete/progress"
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
          >
            View full Performance Hub →
          </AthletePortalNavLink>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading progress data…</p>
      ) : error ? (
        <p className="text-sm text-amber-300/90">{error}</p>
      ) : sparse ? (
        <p className="text-sm text-zinc-500">
          More data will appear as sessions are logged.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => {
            const num = m.value ?? parseNumericDisplay(m.display);
            return (
              <div
                key={m.key}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {m.label}
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {num != null ? (
                    <>
                      <CountUp value={num} />
                      {m.unit ? (
                        <span className="ml-0.5 text-sm font-medium text-zinc-400">{m.unit}</span>
                      ) : null}
                    </>
                  ) : (
                    m.display
                  )}
                </p>
                {m.emptyReason ? (
                  <p className="mt-1 text-[10px] text-zinc-600">{m.emptyReason}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LegacyProgressSnapshot({
  metrics,
  readOnly,
}: {
  metrics: Array<{ label: string; value: string; sub?: string }>;
  readOnly?: boolean;
}) {
  return (
    <section className={`${athleteCard} ${athleteCardPadding}`} aria-label="Progress snapshot">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={eyebrowClass}>Progress snapshot</p>
          <h2 className="mt-1 text-base font-bold text-white">Training summary</h2>
        </div>
        {!readOnly ? (
          <AthletePortalNavLink
            href="/athlete/progress"
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300"
          >
            View progress →
          </AthletePortalNavLink>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {m.label}
            </p>
            <p className="mt-1 text-xl font-bold text-white">{m.value}</p>
            {m.sub ? <p className="mt-0.5 text-[10px] text-zinc-600">{m.sub}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
