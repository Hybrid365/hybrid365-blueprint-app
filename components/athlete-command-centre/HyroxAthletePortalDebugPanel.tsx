"use client";

import { useEffect, useState } from "react";
import type { AthletePortalDebugSnapshot } from "@/app/lib/hyroxAthletePortalResolve";
import { readHyroxMockPreviewEnabled } from "@/app/lib/hyroxAthletePortalMock";

type ApiCheck = { path: string; ok: boolean; status: number; error?: string };

export function HyroxAthletePortalDebugPanel() {
  const [snapshot, setSnapshot] = useState<AthletePortalDebugSnapshot | null>(null);
  const [apiChecks, setApiChecks] = useState<ApiCheck[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    (async () => {
      try {
        const res = await fetch("/api/hyrox/athlete/portal-debug");
        const json = (await res.json()) as AthletePortalDebugSnapshot & {
          success?: boolean;
          error?: string;
        };
        if (!res.ok) {
          setLoadError(json.error ?? "Debug endpoint failed");
          return;
        }
        setSnapshot(json);

        const checks: ApiCheck[] = [];
        for (const path of [
          "/api/hyrox/athlete/assessment",
          "/api/hyrox/athlete/testing",
          "/api/hyrox/athlete/programme",
        ]) {
          try {
            const r = await fetch(path);
            const body = r.ok ? null : ((await r.json()) as { error?: string });
            checks.push({
              path,
              ok: r.ok,
              status: r.status,
              error: body?.error,
            });
          } catch (e) {
            checks.push({
              path,
              ok: false,
              status: 0,
              error: e instanceof Error ? e.message : "fetch failed",
            });
          }
        }
        setApiChecks(checks);
      } catch {
        setLoadError("Could not load portal debug.");
      }
    })();
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  const mockOn = readHyroxMockPreviewEnabled();

  return (
    <div className="mb-6 rounded-xl border border-violet-500/35 bg-violet-950/25 p-4 text-left text-xs text-violet-100/90">
      <p className="font-bold uppercase tracking-wide text-violet-300">Dev — athlete portal link debug</p>
      {loadError ? <p className="mt-2 text-red-300">{loadError}</p> : null}
      {snapshot ? (
        <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
          <Row label="Authenticated email" value={snapshot.authEmail || "—"} />
          <Row label="Auth user id" value={snapshot.authUserId} />
          <Row label="Matched athlete id" value={snapshot.matchedAthleteId ?? "—"} />
          <Row label="Matched athlete name" value={snapshot.matchedAthleteName ?? "—"} />
          <Row label="Matched by" value={snapshot.matchedBy} />
          <Row label="DB athlete email" value={snapshot.athleteEmailInDb ?? "—"} />
          <Row label="DB user_id" value={snapshot.athleteUserId ?? "— (unlinked)"} />
          <Row label="Access reason" value={snapshot.accessReason ?? "—"} />
          <Row label="Athlete status" value={snapshot.athleteStatus ?? "—"} />
          <Row label="Assessment submitted" value={snapshot.assessmentSubmitted ? "yes" : "no"} />
          <Row label="Testing submitted" value={snapshot.testingSubmitted ? "yes" : "no"} />
          <Row label="Published weeks" value={String(snapshot.publishedWeekCount)} />
          <Row label="programme_start_date" value={snapshot.programmeStartDate ?? "—"} />
          <Row label="Programme live" value={snapshot.programmeLive ? "yes" : "no"} />
          <Row label="Mock preview (session)" value={mockOn ? "ON" : "off"} />
          <Row label="Duplicate email rows" value={String(snapshot.duplicateEmailCount)} />
        </dl>
      ) : null}
      {snapshot && snapshot.duplicateEmailCount > 1 ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/30 p-2">
          <p className="font-semibold text-amber-200">Duplicate hyrox_athletes for this email</p>
          <ul className="mt-1 space-y-1">
            {snapshot.duplicateAthletes.map((d) => (
              <li key={d.id} className="text-amber-100/80">
                {d.id.slice(0, 8)}… · {d.name ?? "—"} · user_id={d.user_id ?? "null"} · published weeks=
                {d.publishedWeekCount}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!snapshot?.matchedAthleteId ? (
        <p className="mt-3 font-medium text-amber-200">
          No Hyrox athlete profile found for this login email.
        </p>
      ) : null}
      {apiChecks.length > 0 ? (
        <div className="mt-3">
          <p className="font-semibold text-violet-300">Client API checks</p>
          <ul className="mt-1 space-y-1">
            {apiChecks.map((c) => (
              <li key={c.path} className={c.ok ? "text-emerald-300" : "text-red-300"}>
                {c.path} → {c.status} {c.ok ? "OK" : c.error ?? "failed"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-violet-400/80">{label}</dt>
      <dd className="font-mono text-[11px] text-white/90">{value}</dd>
    </div>
  );
}
