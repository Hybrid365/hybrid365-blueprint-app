import { CONCEPT_FIXTURE } from "./fixture";
import { CoachMark, ConceptButton, ConceptShell } from "./chrome";
import { visualEyebrow, visualMeta } from "../tokens";

/** Coach relationship first. The week should feel authored, not downloaded. */
export function HomeConceptC() {
  const f = CONCEPT_FIXTURE;
  return (
    <ConceptShell kicker="Concept C" title="Coach-led experience">
      <p className={visualEyebrow}>{f.weekLabel}</p>
      <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">{f.todaySession.name}</h3>
      <p className={`mt-1 ${visualMeta}`}>
        {f.dateLabel} · {f.todaySession.primaryTarget} · {f.todaySession.duration}
      </p>
      <div className="mt-4">
        <ConceptButton primary>Open today&apos;s session</ConceptButton>
      </div>

      <div className="mt-8">
        <CoachMark label={`${f.coachName} · today`}>
          <p>{f.todaySession.coachNote}</p>
        </CoachMark>
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <p className={visualEyebrow}>Why this week changed</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{f.todaySession.whyChanged}</p>
      </div>

      <div className="mt-6">
        <p className={visualEyebrow}>Programme context</p>
        <p className="mt-2 text-sm text-zinc-300">{f.weekRole} · {f.week.completed} of {f.week.planned} logged</p>
        <p className={`mt-1 ${visualMeta}`}>Upcoming focus: {f.todaySession.upcomingFocus}</p>
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-6">
        <p className={visualEyebrow}>Recent performance</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-white">{f.performance.current}</p>
        <p className={visualMeta}>
          5K · {f.performance.derived} · {f.performance.delta} vs previous
        </p>
      </div>
    </ConceptShell>
  );
}
