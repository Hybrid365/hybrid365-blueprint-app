import { CONCEPT_FIXTURE } from "../fixture";
import { ConceptShell } from "../chrome";
import { StatusPill } from "../../StatusPill";
import { visualEyebrow, visualMeta } from "../../tokens";
import { ConceptEmpty, ConceptLoading, type CoachedConceptState } from "./ConceptState";

/** Performance — hero mark vs previous; pending clearly separate. Visual-lab only. */
export function CoachedPerformance({ state = "populated" }: { state?: CoachedConceptState }) {
  const p = CONCEPT_FIXTURE.performance;

  return (
    <ConceptShell kicker="Coached · Performance" title="Programming marks">
      {state === "loading" ? <ConceptLoading lines={4} /> : null}
      {state === "empty" ? (
        <ConceptEmpty
          title="No programming marks yet"
          body="Approved benchmarks become current marks after coach activation. Nothing is estimated from race overall."
        />
      ) : null}
      {state === "populated" ? (
        <div data-coached-performance="" className="space-y-8">
          <section>
            <p className={visualEyebrow}>Current · {p.label}</p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-white">{p.current}</p>
            <p className="mt-2 text-lg tabular-nums text-zinc-300">{p.derived}</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">{p.delta} vs previous</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={p.status} />
              <span className={visualMeta}>
                {p.date} · {p.source}
              </span>
            </div>
          </section>

          <section className="border-t border-zinc-800 pt-6">
            <p className={visualEyebrow}>Previous</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-200">{p.previous}</p>
            <p className={visualMeta}>{p.previousDerived} · historical · not the programming anchor</p>
          </section>

          <section className="border-t border-zinc-800 pt-6">
            <p className={visualEyebrow}>Awaiting review</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">{p.pending.value}</p>
            <p className="mt-1 text-sm tabular-nums text-zinc-300">
              {p.pending.label} · {p.pending.derived}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={p.pending.status} />
              <span className={visualMeta}>{p.pending.date} · waiting for coach review</span>
            </div>
          </section>
        </div>
      ) : null}
    </ConceptShell>
  );
}
