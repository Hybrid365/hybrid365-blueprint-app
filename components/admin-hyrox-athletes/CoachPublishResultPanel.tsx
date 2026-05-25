"use client";

export type CoachPublishResultState = {
  fired: boolean;
  at: string | null;
  draftId: string | null;
  publishBlock: boolean;
  message: string | null;
  error: string | null;
  weekResults: Array<{
    weekNumber: number;
    draftSessionsCount?: number;
    insertedRowsCount?: number;
    updatedRowsCount?: number;
    unchangedRowsCount?: number;
    skippedRowsCount?: number;
    rowsAfterPublish?: number;
    updatedSessions?: Array<{ id: string; title: string; hadLogs?: boolean }>;
    approvedDraftSessionTitles?: string[];
  }>;
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

  return (
    <section
      className={`rounded-2xl border p-3 text-[10px] ${
        result.error
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
      </dl>
      {result.error ? (
        <p className="mt-2 font-semibold text-red-200">{result.error}</p>
      ) : (
        <p className="mt-2 text-xs text-emerald-100">{result.message}</p>
      )}
      {result.weekResults.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {result.weekResults.map((w) => (
            <li
              key={w.weekNumber}
              className="rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-2 py-1.5"
            >
              <p className="font-bold text-white">W{w.weekNumber}</p>
              <p>
                draft sessions {w.draftSessionsCount ?? "—"} · inserted {w.insertedRowsCount ?? 0}{" "}
                · updated {w.updatedRowsCount ?? 0} · unchanged {w.unchangedRowsCount ?? 0} ·
                skipped {w.skippedRowsCount ?? 0} · rows after {w.rowsAfterPublish ?? "—"}
              </p>
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

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-zinc-500">{k}</dt>
      <dd className={mono ? "font-mono text-zinc-200" : "text-zinc-200"}>{v}</dd>
    </div>
  );
}
