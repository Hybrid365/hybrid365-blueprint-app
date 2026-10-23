"use client";

import { useState } from "react";
import { CONCEPT_FIXTURE } from "./fixture";
import { ConceptButton, ConceptShell } from "./chrome";
import { TargetActual } from "./viz";
import { CompletionConfirm } from "../motion";
import { visualBody, visualEyebrow, visualMeta } from "../tokens";

export function SessionCompleteConcept() {
  const [logged, setLogged] = useState(false);
  const c = CONCEPT_FIXTURE.completion;
  const s = CONCEPT_FIXTURE.todaySession;

  return (
    <ConceptShell kicker="Session complete" title={s.name}>
      {!logged ? (
        <div className="space-y-6">
          <p className={visualBody}>Prototype logging. Values below are demo props, not a live result.</p>
          <TargetActual
            target={{ label: "Target", value: c.targetPace }}
            actual={{ label: "Actual", value: c.actualPace }}
            rpe={{ label: "RPE", value: c.rpe }}
          />
          <dl className="grid grid-cols-3 gap-3">
            <Feedback label="Execution" value={c.execution} />
            <Feedback label="Legs" value={c.legs} />
            <Feedback label="Energy" value={c.energy} />
          </dl>
          <p className={visualMeta}>{c.note}</p>
          <ConceptButton primary onClick={() => setLogged(true)}>
            Save log
          </ConceptButton>
        </div>
      ) : (
        <CompletionConfirm show>
          <div className="space-y-5">
            <p className={visualEyebrow}>Logged</p>
            <p className="text-lg font-semibold text-white">Threshold held. 3s/km inside target.</p>
            <TargetActual
              target={{ label: "Target", value: c.targetPace }}
              actual={{ label: "Actual", value: c.actualPace }}
              rpe={{ label: "RPE", value: c.rpe }}
            />
            <p className={visualMeta}>
              Execution {c.execution} · Legs {c.legs} · Energy {c.energy}
            </p>
            <p className={visualBody}>{c.note}</p>
            <p className={visualMeta}>Your coach can see this result.</p>
          </div>
        </CompletionConfirm>
      )}
    </ConceptShell>
  );
}

function Feedback({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
