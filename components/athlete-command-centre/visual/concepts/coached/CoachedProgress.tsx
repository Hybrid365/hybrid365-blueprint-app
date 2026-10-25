import { CONCEPT_ANALYTICS, CONCEPT_FIXTURE } from "../fixture";
import { ConceptShell } from "../chrome";
import { TrajectoryChart } from "../viz";
import { visualEyebrow, visualMeta } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

/**
 * Progress — improvement vs previous first; volume second.
 * B analytics fields only. Visual-lab only.
 */
export function CoachedProgress({ state = "populated" }: { state?: CoachedConceptState }) {
  const a = CONCEPT_ANALYTICS;
  const now = a.currentWeek;
  const prev = a.previousWeek;
  const fiveK = a.benchmarks[0];
  const latest = fiveK.points[fiveK.points.length - 1];
  const prior = fiveK.points[fiveK.points.length - 2];
  const markDelta =
    prior != null ? `${Math.round(prior.normalizedValue - latest.normalizedValue)}s vs previous mark` : null;

  const completionDelta =
    prev?.completionPct != null && now.completionPct != null
      ? now.completionPct - prev.completionPct
      : null;

  return (
    <ConceptShell kicker="Coached · Progress" title="Improvement first" wide>
      {state === "loading" ? <ConceptLoading lines={6} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="No logged progress yet"
          body="Progress appears from stored session logs and approved benchmarks. Missing weeks stay empty."
        />
      ) : null}
      {state === "populated" ? (
        <div data-coached-progress="" className="space-y-10">
          <section>
            <p className={visualEyebrow}>Now · are you getting better?</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-400">{fiveK.label}</p>
                <p className="mt-2 text-4xl font-bold tabular-nums text-white">{latest.display}</p>
                <p className={`mt-2 ${visualMeta}`}>
                  {markDelta ?? "First stored mark"} · {formatPointDate(latest.date)}
                </p>
                <ol className="mt-5 space-y-2 border-t border-zinc-800 pt-4">
                  {[...fiveK.points].reverse().map((point, i, arr) => {
                    const older = arr[i + 1];
                    const delta =
                      older != null
                        ? `${Math.round(older.normalizedValue - point.normalizedValue)}s`
                        : "—";
                    return (
                      <li key={point.date} className="flex items-baseline justify-between gap-3">
                        <span className="text-xs text-zinc-400">{formatPointDate(point.date)}</span>
                        <span className="text-sm font-semibold tabular-nums text-white">{point.display}</span>
                        <span className={visualMeta}>{delta}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div>
                <p className="text-xs text-zinc-400">This week vs last</p>
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  <Stat
                    label="Completion"
                    value={`${now.completionPct}%`}
                    sub={
                      completionDelta == null
                        ? `${now.completedSessions} of ${now.plannedSessions}`
                        : `${completionDelta > 0 ? "+" : ""}${completionDelta} pts vs last week`
                    }
                  />
                  <Stat
                    label="Key sessions"
                    value={`${now.keySessionsCompleted}/${now.keySessionsPlanned}`}
                    sub={
                      prev
                        ? `Last week ${prev.keySessionsCompleted}/${prev.keySessionsPlanned}`
                        : "No previous week"
                    }
                  />
                </dl>
                <p className={`mt-4 ${visualMeta}`}>
                  Week in progress · previous week {prev?.completionPct ?? "—"}% complete when closed
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-8">
            <p className={visualEyebrow}>Recent · volume context</p>
            <p className={`mt-1 ${visualMeta}`}>
              Rolling 4 · {a.rolling4.runDistanceKm} km · {a.rolling4.trainingDurationMinutes} min
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-400">Run volume</p>
                <TrajectoryChart
                  values={[...CONCEPT_FIXTURE.rolling4.runKm]}
                  labels={["W3", "W4", "W5", "W6"]}
                  unit="km"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Completion %</p>
                <TrajectoryChart
                  values={[...CONCEPT_FIXTURE.rolling4.completionPct]}
                  labels={["W3", "W4", "W5", "W6"]}
                  unit="%"
                />
              </div>
            </div>
          </section>

          <p className={visualMeta}>Unsupported in this payload: {a.unsupported.join(", ")}.</p>
        </div>
      ) : null}
    </ConceptShell>
  );
}

function formatPointDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</dd>
      <dd className={`mt-1 ${visualMeta}`}>{sub}</dd>
    </div>
  );
}
