"use client";

import { useEffect, useState } from "react";
import type { AthletePortalDebugSnapshot } from "@/app/lib/hyroxAthletePortalResolve";
import type { ApiRouteAuthDebug } from "@/app/lib/supabase/apiRoute";
import { readHyroxMockPreviewEnabled } from "@/app/lib/hyroxAthletePortalMock";
import { useAthletePortal } from "./athletePortalContext";

type ApiCheck = {
  path: string;
  ok: boolean;
  status: number;
  error?: string;
  authEmail?: string;
  reason?: string;
  matchedAthleteId?: string | null;
};

const HYROX_ATHLETE_FETCH: RequestInit = { credentials: "include" };

export function HyroxAthletePortalDebugPanel() {
  const { layoutAuth, portalAthlete } = useAthletePortal();
  const [snapshot, setSnapshot] = useState<
    (AthletePortalDebugSnapshot & {
      apiAuthEmail?: string;
      authDebug?: ApiRouteAuthDebug;
    }) | null
  >(null);
  const [apiChecks, setApiChecks] = useState<ApiCheck[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    (async () => {
      try {
        const res = await fetch("/api/hyrox/athlete/portal-debug", HYROX_ATHLETE_FETCH);
        const json = (await res.json()) as AthletePortalDebugSnapshot & {
          success?: boolean;
          error?: string;
          reason?: string;
          apiAuthEmail?: string;
          authDebug?: ApiRouteAuthDebug;
        };
        if (!res.ok) {
          setLoadError(
            [json.error, json.reason, json.apiAuthEmail ? `api: ${json.apiAuthEmail}` : null]
              .filter(Boolean)
              .join(" · ") || "Debug endpoint failed"
          );
          setSnapshot(null);
        } else {
          setSnapshot(json);
          setLoadError(null);
        }

        const checks: ApiCheck[] = [];
        for (const path of [
          "/api/hyrox/athlete/assessment",
          "/api/hyrox/athlete/testing",
          "/api/hyrox/athlete/programme",
        ]) {
          try {
            const r = await fetch(path, HYROX_ATHLETE_FETCH);
            const body = (await r.json()) as {
              error?: string;
              authEmail?: string;
              reason?: string;
              matchedAthleteId?: string | null;
            };
            checks.push({
              path,
              ok: r.ok,
              status: r.status,
              error: r.ok ? undefined : body.error ?? `HTTP ${r.status}`,
              authEmail: body.authEmail,
              reason: body.reason,
              matchedAthleteId: body.matchedAthleteId,
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
  const layoutApiMismatch =
    layoutAuth.hasSession &&
    snapshot &&
    snapshot.apiAuthEmail &&
    layoutAuth.email &&
    layoutAuth.email !== snapshot.apiAuthEmail;

  return (
    <div className="mb-6 rounded-xl border border-violet-500/35 bg-violet-950/25 p-4 text-left text-xs text-violet-100/90">
      <p className="font-bold uppercase tracking-wide text-violet-300">Dev — athlete portal session debug</p>
      {loadError ? <p className="mt-2 text-red-300">{loadError}</p> : null}
      <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
        <Row label="Layout auth email" value={layoutAuth.email ?? "— (no session)"} />
        <Row label="Layout auth user id" value={layoutAuth.userId ?? "—"} />
        <Row label="API auth email" value={snapshot?.apiAuthEmail ?? "—"} />
        <Row
          label="Supabase auth cookie present"
          value={layoutAuth.hasSupabaseAuthCookie ? "yes (request)" : "no"}
        />
        <Row
          label="API getUser() succeeded"
          value={
            snapshot?.authDebug?.getUserSucceeded === undefined
              ? "—"
              : snapshot.authDebug.getUserSucceeded
                ? "yes"
                : "no"
          }
        />
        <Row
          label="API auth cookie (header store)"
          value={
            snapshot?.authDebug?.hasAuthCookieInHeaderStore === undefined
              ? "—"
              : snapshot.authDebug.hasAuthCookieInHeaderStore
                ? "yes"
                : "no"
          }
        />
        <Row
          label="API auth cookie (raw request)"
          value={
            snapshot?.authDebug?.hasAuthCookieOnRequest === undefined
              ? "—"
              : snapshot.authDebug.hasAuthCookieOnRequest
                ? "yes"
                : "no"
          }
        />
        <Row
          label="Set-Cookie refresh on API"
          value={
            snapshot?.authDebug?.cookiesRefreshed === undefined
              ? "—"
              : snapshot.authDebug.cookiesRefreshed
                ? "yes"
                : "no"
          }
        />
        <Row label="Portal athlete (layout)" value={portalAthlete?.name ?? "—"} />
        <Row label="Matched athlete id" value={snapshot?.matchedAthleteId ?? portalAthlete?.id ?? "—"} />
        <Row label="Matched by" value={snapshot?.matchedBy ?? "—"} />
        <Row label="Access reason" value={snapshot?.accessReason ?? "—"} />
      </dl>
      {layoutApiMismatch ? (
        <p className="mt-2 font-medium text-red-300">
          Layout and API auth emails differ — session cookies may not be reaching API routes.
        </p>
      ) : null}
      {snapshot ? (
        <dl className="mt-3 grid gap-1.5 sm:grid-cols-2 border-t border-violet-500/20 pt-3">
          <Row label="DB athlete email" value={snapshot.athleteEmailInDb ?? "—"} />
          <Row label="DB user_id" value={snapshot.athleteUserId ?? "— (unlinked)"} />
          <Row label="Assessment submitted" value={snapshot.assessmentSubmitted ? "yes" : "no"} />
          <Row label="Testing submitted" value={snapshot.testingSubmitted ? "yes" : "no"} />
          <Row label="Published weeks" value={String(snapshot.publishedWeekCount)} />
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
      {!snapshot?.matchedAthleteId && !portalAthlete?.id ? (
        <p className="mt-3 font-medium text-amber-200">
          No Hyrox athlete profile found for this login email.
        </p>
      ) : null}
      {apiChecks.length > 0 ? (
        <div className="mt-3">
          <p className="font-semibold text-violet-300">Client API checks</p>
          <ul className="mt-1 space-y-1.5">
            {apiChecks.map((c) => (
              <li key={c.path} className={c.ok ? "text-emerald-300" : "text-red-300"}>
                <span className="font-mono">{c.path}</span> → {c.status}{" "}
                {c.ok ? "OK" : (c.error ?? "failed")}
                {!c.ok && (c.reason || c.authEmail || c.matchedAthleteId) ? (
                  <span className="mt-0.5 block font-mono text-[10px] text-red-200/80">
                    {[
                      c.reason && `reason: ${c.reason}`,
                      c.authEmail && `authEmail: ${c.authEmail}`,
                      c.matchedAthleteId && `athlete: ${c.matchedAthleteId}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
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
