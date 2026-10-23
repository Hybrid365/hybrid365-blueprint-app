import { CONCEPT_ANALYTICS, CONCEPT_FIXTURE } from "./fixture";
import { CoachMark, ConceptButton, ConceptShell } from "./chrome";
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

/** Dense, still mobile-first. Data as telemetry around today's work. */
export function HomeConceptB() {
  const f = CONCEPT_FIXTURE;
  const a = CONCEPT_ANALYTICS;
  return (
    <ConceptShell kicker="Concept B" title="Elite data dashboard" wide>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={visualEyebrow}>Today</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{f.todaySession.name}</h3>
              <p className={`mt-1 ${visualMeta}`}>
                {f.todaySession.primaryTarget} · {f.todaySession.duration} · RPE {f.todaySession.rpe}
              </p>
            </div>
            <ConceptButton primary>Open session</ConceptButton>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Logged" value={`${a.currentWeek.completedSessions}/${a.currentWeek.plannedSessions}`} />
            <Metric label="Run" value={`${a.currentWeek.runDistanceKm} km`} />
            <Metric label="Time" value={`${a.currentWeek.trainingDurationMinutes} min`} />
            <Metric label="sRPE" value={String(a.currentWeek.sessionRpeLoad)} />
          </dl>

          <div className="mt-8">
            <p className={visualEyebrow}>Rolling four weeks · run km</p>
            <div className="mt-3">
              <TrajectoryChart values={[...f.rolling4.runKm]} labels={["W3", "W4", "W5", "W6"]} unit="km" />
            </div>
          </div>

          <div className="mt-8">
            <p className={visualEyebrow}>Modality · four weeks</p>
            <div className="mt-3">
              <ModalityBar
                slices={a.distribution.map((slice) => ({
                  label: MODALITY_LABEL[slice.modality],
                  minutes: slice.durationMinutes ?? 0,
                }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 border-t border-zinc-800 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className={visualEyebrow}>Current 5K</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">{f.performance.current}</p>
            <p className={`mt-1 ${visualMeta}`}>
              {f.performance.derived} · {f.performance.delta}
            </p>
          </div>
          <CoachMark label="Coach adjustment">
            <p>{f.todaySession.whyChanged}</p>
          </CoachMark>
          <p className={`${visualMeta} pb-1`}>
            Completion {a.currentWeek.completionPct}% this week · {a.rolling4.completionPct}% across four weeks.
            Week still in progress.
          </p>
        </div>
      </div>
    </ConceptShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}
