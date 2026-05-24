import Link from "next/link";
import type { HyroxAthleteDiagnosticReport } from "@/app/lib/hyroxAthleteDiagnostic";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300"
          : "rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300"
      }
    >
      {ok ? "yes" : "no"}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-yellow-400/90">
        {title}
      </h2>
      {children}
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,200px)_1fr] gap-2 border-b border-zinc-800/60 py-1.5 text-xs last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="break-all font-mono text-zinc-200">{value}</span>
    </div>
  );
}

export function HyroxAthleteDiagnosticView({
  report,
  defaultEmail,
}: {
  report: HyroxAthleteDiagnosticReport | null;
  defaultEmail: string | null;
}) {
  return (
    <CoachAdminShell
      title="Hyrox athlete live diagnostic"
      backHref="/admin/hyrox-athletes"
      backLabel="Athletes"
    >
      <p className="mb-4 text-sm text-zinc-400">
        Temporary internal tool — compares auth session, portal resolver, DB rows, and
        athlete API logic. Does not change athlete portal behaviour.
      </p>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-zinc-400">
          Email
          <input
            type="email"
            name="email"
            defaultValue={report?.searchEmail ?? defaultEmail ?? ""}
            placeholder="kieran@example.com"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex min-w-[280px] flex-1 flex-col gap-1 text-xs text-zinc-400">
          Athlete id (optional)
          <input
            type="text"
            name="athleteId"
            defaultValue={report?.searchAthleteId ?? ""}
            placeholder="uuid"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
        >
          Run diagnostic
        </button>
      </form>

      {!report ? (
        <p className="text-sm text-zinc-500">
          Enter an email (defaults to your logged-in email) and run diagnostic.
        </p>
      ) : (
        <div className="space-y-5">
          <Section title="Diagnosis">
            <ul className="mb-3 list-disc space-y-1 pl-4 text-sm text-amber-100/95">
              {report.diagnosis.headlines.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Recommended next actions
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-300">
              {report.diagnosis.recommendedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-zinc-600">
              Generated {new Date(report.generatedAt).toLocaleString("en-GB")}
            </p>
          </Section>

          <Section title="Environment (presence only)">
            <KeyValue
              label="HYROX_PORTAL_SIGNING_SECRET"
              value={<StatusPill ok={report.env.hyroxPortalSigningSecretPresent} />}
            />
            <KeyValue
              label="SUPABASE_SERVICE_ROLE_KEY"
              value={<StatusPill ok={report.env.supabaseServiceRoleKeyPresent} />}
            />
            <KeyValue label="NODE_ENV" value={report.env.nodeEnv} />
          </Section>

          <Section title="Auth / session (current browser)">
            <KeyValue label="auth user id" value={report.auth.authUserId ?? "—"} />
            <KeyValue label="auth email" value={report.auth.authEmail ?? "—"} />
            <KeyValue
              label="getSession succeeded"
              value={<StatusPill ok={report.auth.getSessionSucceeded} />}
            />
            <KeyValue
              label="getUser succeeded"
              value={<StatusPill ok={report.auth.getUserSucceeded} />}
            />
            <KeyValue
              label="getUser after retry"
              value={<StatusPill ok={report.auth.getUserAfterRetrySucceeded} />}
            />
            <KeyValue
              label="auth cookies present"
              value={<StatusPill ok={report.auth.authCookiesPresent} />}
            />
            <KeyValue
              label="session refresh attempted"
              value={<StatusPill ok={report.auth.sessionRefreshAttempted} />}
            />
            <KeyValue label="session user id" value={report.auth.sessionUserId ?? "—"} />
          </Section>

          <Section title={`Athlete rows for ${report.searchEmail ?? "—"}`}>
            {report.athleteRows.length === 0 ? (
              <p className="text-sm text-zinc-500">No rows found.</p>
            ) : (
              <div className="space-y-4">
                {report.athleteRows.map((row) => (
                  <div
                    key={row.athleteId}
                    className={`rounded-lg border p-3 ${
                      row.looksLikeBestMatch
                        ? "border-yellow-500/40 bg-yellow-950/20"
                        : "border-zinc-800"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/hyrox-athletes/${row.athleteId}`}
                        className="font-mono text-sm text-yellow-300 hover:underline"
                      >
                        {row.athleteId}
                      </Link>
                      {row.looksLikeBestMatch ? (
                        <span className="text-[10px] font-bold uppercase text-yellow-400">
                          best match (data score)
                        </span>
                      ) : null}
                    </div>
                    <KeyValue label="name" value={row.name ?? "—"} />
                    <KeyValue label="email" value={row.email ?? "—"} />
                    <KeyValue label="user_id" value={row.userId ?? "—"} />
                    <KeyValue label="status" value={row.status} />
                    <KeyValue label="payment" value={row.paymentStatus} />
                    <KeyValue
                      label="application"
                      value={
                        row.applicationId
                          ? `${row.applicationId.slice(0, 8)}… (${row.applicationStatus ?? "?"})`
                          : "—"
                      }
                    />
                    <KeyValue
                      label="programme_start_date"
                      value={row.programmeStartDate ?? "—"}
                    />
                    <KeyValue
                      label="programme_length_weeks"
                      value={row.programmeLengthWeeks ?? "—"}
                    />
                    <KeyValue
                      label="current_programme_block"
                      value={row.currentProgrammeBlock ?? row.currentBlock}
                    />
                    <KeyValue
                      label="assessment submitted"
                      value={<StatusPill ok={row.assessmentSubmitted} />}
                    />
                    <KeyValue
                      label="testing submitted"
                      value={<StatusPill ok={row.testingSubmitted} />}
                    />
                    <KeyValue
                      label="published weeks / sessions"
                      value={`${row.publishedWeekCount} / ${row.publishedSessionCount}`}
                    />
                    <KeyValue
                      label="W1–W4 in current block"
                      value={row.w1ToW4PublishedCount}
                    />
                    <KeyValue
                      label="published week numbers"
                      value={row.publishedWeekNumbers.join(", ") || "—"}
                    />
                    <KeyValue label="data score" value={row.dataScore} />
                  </div>
                ))}
              </div>
            )}
            {report.athleteIdWithPublishedBlock ? (
              <p className="mt-3 text-xs text-emerald-300/90">
                Athlete with full W1–W4 published block:{" "}
                <span className="font-mono">{report.athleteIdWithPublishedBlock}</span>
              </p>
            ) : null}
          </Section>

          <Section title="Portal resolver (layout logic)">
            {report.portalResolvers.map((p) => (
              <div key={p.label} className="mb-4 rounded-lg border border-zinc-800 p-3">
                <p className="mb-2 text-sm font-semibold text-white">{p.label}</p>
                <KeyValue label="simulated auth user" value={p.simulatedAuthUserId ?? "—"} />
                <KeyValue label="simulated auth email" value={p.simulatedAuthEmail ?? "—"} />
                <KeyValue label="resolved athlete id" value={p.resolvedAthleteId ?? "—"} />
                <KeyValue label="resolved name" value={p.resolvedAthleteName ?? "—"} />
                <KeyValue label="match source" value={p.matchSource} />
                <KeyValue label="access reason" value={p.accessReason ?? "—"} />
                <KeyValue
                  label="serverAuthConfirmed"
                  value={<StatusPill ok={p.serverAuthConfirmed} />}
                />
                <KeyValue
                  label="link failure"
                  value={p.linkFailureReason ?? "—"}
                />
                <KeyValue label="duplicate email rows" value={p.duplicateEmailCount} />
                <KeyValue
                  label="auto link"
                  value={`attempted=${p.autoLinkAttempted ? "yes" : "no"}, linked=${p.autoLinked ? "yes" : "no"}`}
                />
              </div>
            ))}
          </Section>

          <Section title="Programme check">
            {report.programmeChecks.length === 0 ? (
              <p className="text-sm text-zinc-500">No programme checks run.</p>
            ) : (
              report.programmeChecks.map((p) => (
                <div key={p.athleteId} className="mb-4 rounded-lg border border-zinc-800 p-3">
                  <p className="mb-2 font-mono text-sm text-yellow-300">{p.athleteId}</p>
                  <KeyValue label="API state" value={p.programmeApiState} />
                  <KeyValue label="visibility" value={p.programmeVisibility} />
                  <KeyValue
                    label="should be live (UI)"
                    value={<StatusPill ok={p.programmeShouldBeLive} />}
                  />
                  <KeyValue
                    label="published weeks / sessions"
                    value={`${p.publishedWeekCount} / ${p.sessionCount}`}
                  />
                  <KeyValue
                    label="W1–W4"
                    value={`${p.w1Exists ? "✓" : "✗"} ${p.w2Exists ? "✓" : "✗"} ${p.w3Exists ? "✓" : "✗"} ${p.w4Exists ? "✓" : "✗"}`}
                  />
                  <KeyValue
                    label="week numbers"
                    value={p.weekNumbersPublished.join(", ") || "—"}
                  />
                  <KeyValue
                    label="programme_start_date"
                    value={p.programmeStartDate ?? "—"}
                  />
                  <KeyValue label="live global week" value={p.liveGlobalWeek ?? "—"} />
                  {p.generatorTrainingDaysNote ? (
                    <p className="mt-2 text-xs text-amber-200/90">{p.generatorTrainingDaysNote}</p>
                  ) : null}
                  {p.weekSessionBreakdown.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Week session breakdown (DB vs draft)
                      </p>
                      {p.weekSessionBreakdown.map((week) => (
                        <div
                          key={week.weekNumber}
                          className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
                        >
                          <p className="text-sm font-semibold text-white">
                            Week {week.weekNumber}
                            {week.programmeWeekId ? (
                              <span className="ml-2 font-mono text-[10px] font-normal text-zinc-500">
                                {week.programmeWeekId.slice(0, 8)}…
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-zinc-400">
                            DB: {week.dbSessionCount} · draft: {week.draftSessionCount ?? "—"} ·
                            key {week.draftKeyCount ?? "—"} · optional {week.draftOptionalCount ?? "—"}{" "}
                            · Main/AM/PM {week.draftMainCount ?? "—"}/{week.draftAmCount ?? "—"}/
                            {week.draftPmCount ?? "—"}
                          </p>
                          {week.mismatchNote ? (
                            <p className="mt-1 text-[11px] text-amber-300/90">{week.mismatchNote}</p>
                          ) : null}
                          {week.sessions.length > 0 ? (
                            <ul className="mt-2 space-y-1 font-mono text-[10px] text-zinc-500">
                              {week.sessions.map((s) => (
                                <li key={s.id}>
                                  {s.day} {s.slot} · {s.title} · {s.category}
                                  {s.isKey ? " · key" : ""}
                                  {s.isOptional ? " · optional" : ""} · {s.id.slice(0, 8)}…
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-[10px] text-zinc-600">No published sessions in DB.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <KeyValue
                    label="calendar live week"
                    value={p.calendarLiveWeekNumber ?? "—"}
                  />
                  <KeyValue
                    label="first session"
                    value={
                      p.firstSessionId
                        ? `${p.firstSessionTitle ?? "—"} (${p.firstSessionId.slice(0, 8)}…)`
                        : "—"
                    }
                  />
                </div>
              ))
            )}
          </Section>

          <Section title="API checks (current session cookie auth)">
            <p className="mb-3 text-[11px] text-zinc-500">
              Simulates the same athlete resolution and data loads as athlete API routes.
              Uses your coach/admin login — to test as the athlete, log in as them on
              /athlete and compare ids below.
            </p>
            {report.apiProbes.map((probe) => (
              <div
                key={probe.route}
                className="mb-2 rounded-lg border border-zinc-800/80 px-3 py-2 text-xs"
              >
                <p className="font-semibold text-zinc-200">{probe.route}</p>
                <p>
                  status: <span className="text-yellow-300">{probe.status}</span> · auth:{" "}
                  {probe.authMethod}
                  {probe.errorCode ? ` · ${probe.errorCode}` : ""}
                </p>
                {probe.matchedAthleteId ? (
                  <p className="font-mono text-zinc-400">
                    athlete: {probe.matchedAthleteId}
                  </p>
                ) : null}
                {probe.errorMessage ? (
                  <p className="text-red-300/90">{probe.errorMessage}</p>
                ) : null}
                {probe.detail ? <p className="text-zinc-500">{probe.detail}</p> : null}
              </div>
            ))}
          </Section>
        </div>
      )}
    </CoachAdminShell>
  );
}
