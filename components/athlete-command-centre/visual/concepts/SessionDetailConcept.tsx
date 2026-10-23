import { CONCEPT_FIXTURE } from "./fixture";
import { CoachMark, ConceptButton, ConceptShell } from "./chrome";
import { IntervalTimeline } from "./viz";
import { visualEyebrow, visualMeta } from "../tokens";

export function SessionDetailConcept() {
  const s = CONCEPT_FIXTURE.todaySession;
  return (
    <ConceptShell kicker="Session detail" title="Threshold run">
      <p className={visualEyebrow}>Purpose</p>
      <p className="mt-2 text-lg font-semibold leading-snug text-white">{s.purpose}</p>

      <div className="mt-6">
        <p className={visualEyebrow}>Primary target</p>
        <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-white">{s.primaryTarget}</p>
        <p className={`mt-1 ${visualMeta}`}>
          {s.primaryTargetHint} · {s.duration} · RPE {s.rpe}
        </p>
      </div>

      <div className="mt-8">
        <p className={visualEyebrow}>Structure</p>
        <div className="mt-3">
          <IntervalTimeline steps={[...s.structure]} />
        </div>
      </div>

      <div className="mt-8">
        <p className={visualEyebrow}>Prescription</p>
        <dl className="mt-3 space-y-2">
          {s.prescriptions.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-zinc-800 pb-2">
              <dt className="text-xs text-zinc-400">{row.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-white">{row.value}</dd>
              <dd className="w-24 text-right text-xs text-zinc-500">{row.hint}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8">
        <CoachMark>
          <p>{s.coachNote}</p>
        </CoachMark>
      </div>

      <div className="mt-8">
        <p className={visualEyebrow}>Execution</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-300">
          {s.guidance.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <ConceptButton primary>Log session</ConceptButton>
      </div>
    </ConceptShell>
  );
}
