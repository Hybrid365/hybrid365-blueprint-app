import { CONCEPT_FIXTURE } from "../fixture";
import { CoachMark, ConceptButton, ConceptShell } from "../chrome";
import { visualEyebrow, visualMeta } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

/**
 * Consolidated Home — A hierarchy + C coach presence + one progression signal.
 * B telemetry stays off Home. Visual-lab only.
 */
export function CoachedHome({ state = "populated" }: { state?: CoachedConceptState }) {
  const f = CONCEPT_FIXTURE;
  const hasAdjustment = Boolean(f.todaySession.whyChanged);

  return (
    <ConceptShell kicker="Coached · Home" title="Today's training" wide>
      {state === "loading" ? <ConceptLoading lines={5} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="No published session for today"
          body="When your coach publishes this week, today’s work will appear here with its target and coach note."
        />
      ) : null}
      {state === "populated" ? (
        <div
          data-coached-home=""
          className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.75fr)] lg:items-start"
        >
          <div>
            <p className={visualEyebrow}>{f.dateLabel}</p>
            <p className={`mt-1 ${visualMeta}`}>
              {f.weekLabel} · {f.weekRole}
            </p>

            <div className="mt-6">
              <p className={visualEyebrow}>Today</p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {f.todaySession.name}
              </h3>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
                {f.todaySession.primaryTarget}
              </p>
              <p className={`mt-2 ${visualMeta}`}>
                {f.todaySession.primaryTargetHint} · {f.todaySession.duration} · RPE {f.todaySession.rpe}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
                {f.todaySession.purpose}
              </p>
              <div className="mt-6">
                <ConceptButton primary>Open session</ConceptButton>
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6">
              {hasAdjustment ? (
                <CoachMark label={`${f.coachName} · adjustment`}>
                  <p>{f.todaySession.whyChanged}</p>
                </CoachMark>
              ) : (
                <CoachMark label={`${f.coachName} · today`}>
                  <p>{f.todaySession.coachNote}</p>
                </CoachMark>
              )}
            </div>
          </div>

          <aside className="space-y-8 border-t border-zinc-800 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className={visualEyebrow}>Your mark</p>
              <p className="mt-2 text-xs text-zinc-400">{f.performance.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-white">
                {f.performance.current}
              </p>
              <p className={`mt-1 ${visualMeta}`}>
                {f.performance.derived} · {f.performance.delta} vs previous
              </p>
              <p className={`mt-2 ${visualMeta}`}>
                {f.performance.date} · {f.performance.source}
              </p>
            </div>

            <div>
              <p className={visualEyebrow}>This week</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                {f.week.completed}/{f.week.planned}
              </p>
              <p className={visualMeta}>sessions logged · week in progress</p>
              <p className={`mt-3 ${visualMeta}`}>Upcoming: {f.todaySession.upcomingFocus}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </ConceptShell>
  );
}
