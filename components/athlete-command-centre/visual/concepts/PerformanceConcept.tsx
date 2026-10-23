import { CONCEPT_FIXTURE } from "./fixture";
import { ConceptShell } from "./chrome";
import { StatusPill } from "../StatusPill";
import { visualEyebrow, visualMeta } from "../tokens";

export function PerformanceConcept() {
  const p = CONCEPT_FIXTURE.performance;
  return (
    <ConceptShell kicker="Performance" title="Current programming marks">
      <p className={visualEyebrow}>{p.label}</p>
      <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-white">{p.current}</p>
      <p className="mt-2 text-lg tabular-nums text-zinc-300">{p.derived}</p>
      <p className="mt-2 text-sm text-zinc-200">{p.delta}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={p.status} />
        <span className={visualMeta}>
          {p.date} · {p.source}
        </span>
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <p className={visualEyebrow}>Previous</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-200">{p.previous}</p>
        <p className={visualMeta}>{p.previousDerived} · historical</p>
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <p className={visualEyebrow}>{p.pending.label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-white">{p.pending.value}</p>
        <p className="mt-1 text-sm tabular-nums text-zinc-300">{p.pending.derived}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill status={p.pending.status} />
          <span className={visualMeta}>{p.pending.date} · waiting for coach review</span>
        </div>
      </div>
    </ConceptShell>
  );
}
