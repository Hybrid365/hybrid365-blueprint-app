import { CONCEPT_FIXTURE } from "./fixture";
import { CoachMark, ConceptButton, ConceptShell } from "./chrome";
import { visualEyebrow, visualMeta } from "../tokens";

/** Extremely focused Home. One session, then context, then one signal. */
export function HomeConceptA() {
  const f = CONCEPT_FIXTURE;
  return (
    <ConceptShell kicker="Concept A" title="Performance command centre">
      <p className={visualEyebrow}>{f.dateLabel}</p>
      <p className={`mt-1 ${visualMeta}`}>{f.weekLabel}</p>

      <div className="mt-6">
        <p className={visualEyebrow}>Today</p>
        <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{f.todaySession.name}</h3>
        <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-white">
          {f.todaySession.primaryTarget}
        </p>
        <p className={`mt-1 ${visualMeta}`}>
          {f.todaySession.primaryTargetHint} · {f.todaySession.duration} · RPE {f.todaySession.rpe}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{f.todaySession.purpose}</p>
        <div className="mt-5">
          <ConceptButton primary>Open session</ConceptButton>
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between border-t border-zinc-800 pt-5">
        <div>
          <p className={visualEyebrow}>This week</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-white">
            {f.week.completed}/{f.week.planned}
          </p>
          <p className={visualMeta}>sessions logged</p>
        </div>
        <div className="text-right">
          <p className={visualEyebrow}>5K</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-white">{f.performance.current}</p>
          <p className={visualMeta}>
            {f.performance.derived} · {f.performance.delta}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CoachMark>
          <p>{f.todaySession.coachNote}</p>
          <p className={`mt-2 ${visualMeta}`}>{f.coachName}</p>
        </CoachMark>
      </div>
    </ConceptShell>
  );
}
