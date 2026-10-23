import { CONCEPT_ANALYTICS, CONCEPT_FIXTURE } from "./fixture";
import { ConceptShell } from "./chrome";
import { ModalityBar, TrajectoryChart } from "./viz";
import { visualEyebrow, visualMeta } from "../tokens";

const MODALITY_LABEL = {
  run: "Run",
  bike: "Bike",
  skierg: "Ski",
  rowerg: "Row",
  strength: "Strength",
  hyrox_specific: "HYROX",
  other: "Other",
} as const;

/** Now → recent trend → longer-term. Uses B analytics fields only. */
export function ProgressConcept() {
  const a = CONCEPT_ANALYTICS;
  const now = a.currentWeek;
  const fiveK = a.benchmarks[0];
  return (
    <ConceptShell kicker="Progress" title="Now, then the trend" wide>
      <section>
        <p className={visualEyebrow}>Now · this week</p>
        <p className={`mt-1 ${visualMeta}`}>
          {now.startDate} – {now.endDate} · in progress
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Completion" value={`${now.completionPct}%`} sub={`${now.completedSessions} of ${now.plannedSessions}`} />
          <Stat label="Run" value={`${now.runDistanceKm} km`} sub="Logged run distance" />
          <Stat label="Time" value={`${now.trainingDurationMinutes} min`} sub="Logged duration" />
          <Stat label="sRPE load" value={String(now.sessionRpeLoad)} sub="Duration × RPE" />
        </dl>
      </section>

      <section className="mt-10 border-t border-zinc-800 pt-8">
        <p className={visualEyebrow}>Recent trend · four weeks</p>
        <p className={`mt-1 ${visualMeta}`}>
          Rolling 4 · {a.rolling4.runDistanceKm} km · {a.rolling4.trainingDurationMinutes} min ·{" "}
          {a.rolling4.completionPct}% completion
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-400">Run volume</p>
            <TrajectoryChart values={[...CONCEPT_FIXTURE.rolling4.runKm]} labels={["W3", "W4", "W5", "W6"]} unit="km" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Completion</p>
            <TrajectoryChart
              values={[...CONCEPT_FIXTURE.rolling4.completionPct]}
              labels={["W3", "W4", "W5", "W6"]}
              unit="%"
            />
          </div>
        </div>
        <div className="mt-6">
          <p className="text-xs text-zinc-400">Modality distribution</p>
          <div className="mt-2">
            <ModalityBar
              slices={a.distribution.map((slice) => ({
                label: MODALITY_LABEL[slice.modality],
                minutes: slice.durationMinutes ?? 0,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-zinc-800 pt-8">
        <p className={visualEyebrow}>Longer-term · 5K</p>
        <ol className="mt-4 space-y-3">
          {fiveK.points.map((point, i) => {
            const prev = fiveK.points[i - 1];
            const delta =
              prev != null ? `${Math.round(prev.normalizedValue - point.normalizedValue)}s vs previous` : "First stored mark";
            return (
              <li key={point.date} className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-zinc-400">{formatPointDate(point.date)}</span>
                <span className="text-lg font-semibold tabular-nums text-white">{point.display}</span>
                <span className={visualMeta}>{delta}</span>
              </li>
            );
          })}
        </ol>
        <p className={`mt-4 ${visualMeta}`}>Unsupported in this payload: {a.unsupported.join(", ")}.</p>
      </section>
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
