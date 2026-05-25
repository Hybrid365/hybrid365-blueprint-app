"use client";

import type { PublishSessionSyncDetail } from "@/app/lib/hyroxProgrammeSessionSync";

export type CoachPublishWeekResult = {
  weekNumber: number;
  draftId?: string;
  draftSessionsCount?: number;
  insertedRowsCount?: number;
  updatedRowsCount?: number;
  unchangedRowsCount?: number;
  skippedRowsCount?: number;
  rowsAfterPublish?: number;
  updatedSessions?: Array<{ id: string; title: string; hadLogs?: boolean }>;
  approvedDraftSessionTitles?: string[];
  sessionSyncDetails?: PublishSessionSyncDetail[];
  verification?: {
    verificationPassed: boolean;
    missingOrUnsyncedDraftSessionTitles: string[];
    livePreviewForEditedSessions: Array<{
      draftSessionId: string | null;
      draftTitle: string;
      preview: string;
      publishedSessionId: string | null;
      publishedPreview: string | null;
    }>;
    errors: string[];
  };
};

export type CoachPublishResultState = {
  fired: boolean;
  at: string | null;
  draftId: string | null;
  publishBlock: boolean;
  message: string | null;
  error: string | null;
  syncVerificationPassed?: boolean;
  syncVerificationErrors?: string[];
  weekResults: CoachPublishWeekResult[];
};

export function CoachPublishResultPanel({ result }: { result: CoachPublishResultState | null }) {
  if (!result?.fired) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-[10px] text-zinc-500">
        <h3 className="text-[11px] font-bold uppercase text-zinc-400">Publish result</h3>
        <p className="mt-2">No publish run yet this session.</p>
      </section>
    );
  }

  const verificationFailed =
    result.syncVerificationPassed === false ||
    result.weekResults.some((w) => w.verification && !w.verification.verificationPassed);
  const panelError = result.error ?? (verificationFailed ? result.message : null);

  return (
    <section
      className={`rounded-2xl border p-3 text-[10px] ${
        panelError || verificationFailed
          ? "border-red-500/30 bg-red-950/25 text-red-100"
          : "border-emerald-500/30 bg-emerald-950/20 text-emerald-50"
      }`}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-emerald-200">
        Publish result
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-300">
        <Row k="publish request" v="yes" />
        <Row k="at" v={result.at ? new Date(result.at).toLocaleString() : "—"} />
        <Row k="draftId" v={result.draftId?.slice(0, 8) ?? "—"} mono />
        <Row k="publishBlock" v={result.publishBlock ? "yes" : "no"} />
        <Row
          k="verificationPassed"
          v={verificationFailed ? "no" : "yes"}
          warn={verificationFailed}
        />
      </dl>
      {panelError ? (
        <p className="mt-2 font-semibold text-red-200">{panelError}</p>
      ) : (
        <p className="mt-2 text-xs text-emerald-100">{result.message}</p>
      )}
      {result.syncVerificationErrors && result.syncVerificationErrors.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-red-200">
          {result.syncVerificationErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {result.weekResults.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {result.weekResults.map((w) => (
            <li
              key={w.weekNumber}
              className="rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5"
            >
              <p className="font-bold text-white">
                W{w.weekNumber}
                {w.draftId ? ` · draft ${w.draftId.slice(0, 8)}…` : ""}
              </p>
              <p>
                draft sessions {w.draftSessionsCount ?? "—"} · inserted {w.insertedRowsCount ?? 0}{" "}
                · updated {w.updatedRowsCount ?? 0} · unchanged {w.unchangedRowsCount ?? 0} ·
                skipped {w.skippedRowsCount ?? 0} · rows after {w.rowsAfterPublish ?? "—"}
              </p>
              {w.verification && !w.verification.verificationPassed ? (
                <p className="mt-1 font-semibold text-red-300">
                  Draft edit was not synced to published session
                </p>
              ) : null}
              {w.sessionSyncDetails && w.sessionSyncDetails.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {w.sessionSyncDetails
                    .filter(
                      (d) =>
                        d.changedFields.length > 0 ||
                        d.updateAttempted ||
                        d.matchSource === "none"
                    )
                    .map((d) => (
                      <li
                        key={`${d.draftSessionId ?? d.draftTitle}-${d.matchedPublishedSessionId ?? "new"}`}
                        className="rounded border border-zinc-800 bg-zinc-950/70 px-2 py-1"
                      >
                        <p className="font-semibold text-yellow-100">{d.draftTitle}</p>
                        <p>draft session id: {d.draftSessionId?.slice(0, 12) ?? "—"}</p>
                        <p>match: {d.matchSource} → {d.matchedPublishedSessionId?.slice(0, 8) ?? "—"}</p>
                        <p>draft preview: {d.draftPreview}</p>
                        <p>before: {d.previousPublishedPreview ?? "—"}</p>
                        <p>after: {d.newPublishedPreview ?? "—"}</p>
                        <p>
                          changed: {d.changedFields.length ? d.changedFields.join(", ") : "—"} ·
                          update {d.updateAttempted ? (d.updateSuccess ? "ok" : "failed") : "no"}
                        </p>
                        {d.unchangedReason ? <p>reason: {d.unchangedReason}</p> : null}
                        {d.syncError ? <p className="text-red-300">{d.syncError}</p> : null}
                      </li>
                    ))}
                </ul>
              ) : null}
              {w.updatedSessions && w.updatedSessions.length > 0 ? (
                <p className="mt-1 text-yellow-200/90">
                  Updated:{" "}
                  {w.updatedSessions.map((s) => `${s.title} (${s.id.slice(0, 8)}…)`).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Row({ k, v, mono, warn }: { k: string; v: string; mono?: boolean; warn?: boolean }) {
  return (
    <div>
      <dt className="text-zinc-500">{k}</dt>
      <dd className={`${warn ? "font-bold text-amber-200" : "text-zinc-200"} ${mono ? "font-mono" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
